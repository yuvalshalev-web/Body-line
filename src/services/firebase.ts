import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, getDocs, getDoc, Query, QuerySnapshot, collection, addDoc, query, orderBy, 
  limit, deleteDoc, writeBatch, doc, getDocFromServer, setDoc, updateDoc, onSnapshot,
  DocumentReference, UpdateData, WithFieldValue, DocumentData, Unsubscribe, 
  SnapshotListenOptions, FirestoreError, DocumentSnapshot, QueryConstraint
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { trackBandwidth } from '../utils/bandwidthTracker';
import { addLog, SystemLog } from '../utils/systemLogs';

import firebaseConfig from '../../firebase-applet-config.json';

// @ai-preserve: Firebase Initialization
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized.");
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
console.log("Firestore initialized.");

const auth = getAuth(app);
const storage = getStorage(app);

export let sessionReadCount = 0;
export let sessionWriteCount = 0;

// Initialize stats from localStorage if it's from the same day
if (typeof window !== 'undefined') {
  const savedData = localStorage.getItem('db_read_stats');
  if (savedData) {
    try {
      const { count, writeCount, date } = JSON.parse(savedData);
      const today = new Date().toDateString();
      if (date === today) {
        sessionReadCount = count || 0;
        sessionWriteCount = writeCount || 0;
      }
    } catch (e) {
      console.error("Failed to parse db_read_stats from localStorage", e);
    }
  }
}

export let db_status: 'ONLINE' | 'OFFLINE' = 'ONLINE';

export const setDbStatus = (status: 'ONLINE' | 'OFFLINE') => {
  db_status = status;
  if (typeof window !== 'undefined') {
    localStorage.setItem('kill_switch_active', String(status === 'OFFLINE'));
    window.dispatchEvent(new CustomEvent('db-status-changed', { detail: status }));
  }
};

export const saveLogsToDatabase = async (logs: SystemLog[]) => {
  const batch = writeBatch(db);
  const logsCollection = collection(db, 'system_logs');
  
  logs.forEach(log => {
    const docRef = doc(logsCollection, log.id);
    batch.set(docRef, {
      ...log,
      timestamp: log.timestamp.toISOString()
    });
  });
  
  await batch.commit();
  incrementWriteCount(logs.length);
};

export const loadLogsFromDatabase = async (): Promise<SystemLog[]> => {
  const logsCollection = collection(db, 'system_logs');
  const q = query(logsCollection, orderBy('timestamp', 'desc'), limit(100));
  const snapshot = await trackedGetDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      timestamp: new Date(data.timestamp)
    } as SystemLog;
  });
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  const jsonError = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonError);
  addLog(`Firestore Error: ${errInfo.error}`, 'Critical', 'Database', jsonError);
  throw new Error(jsonError);
};

/**
 * Wrapper חכם לשליפת מסמכים שסופר קריאות בזמן אמת
 */
export const trackedGetDocs = async (query: Query): Promise<QuerySnapshot> => {
    const path = (query as any)._query?.path?.segments?.join('/') || 'unknown';
    const isLoginQuery = path.includes('members');

    if (db_status === 'OFFLINE' && !isLoginQuery) {
      console.warn('Database is OFFLINE. Blocking Firebase read.');
      addLog('Database is OFFLINE. Blocking Firebase read.', 'Warning', 'Database');
      throw new Error('QUOTA_EXCEEDED_OR_KILL_SWITCH');
    }

    try {
      const snapshot = await getDocs(query);
      const reads = snapshot.size || 1; 
      incrementReadCount(reads);
      
      const estimatedInBytes = reads * 1536; 
      trackBandwidth(estimatedInBytes, 'in');
      trackBandwidth(200, 'out');
      
      return snapshot;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
};

/**
 * Wrapper for onSnapshot that tracks reads
 */
export function trackedOnSnapshot<T = DocumentData>(
  query: Query<T>,
  onNext: (snapshot: QuerySnapshot<T>) => void,
  onError?: (error: FirestoreError) => void,
  options?: SnapshotListenOptions
): Unsubscribe;
export function trackedOnSnapshot<T = DocumentData>(
  reference: DocumentReference<T>,
  onNext: (snapshot: DocumentSnapshot<T>) => void,
  onError?: (error: FirestoreError) => void,
  options?: SnapshotListenOptions
): Unsubscribe;
export function trackedOnSnapshot(
  refOrQuery: any,
  onNext: any,
  onError?: any,
  options?: any
): Unsubscribe {
  const path = refOrQuery.path || (refOrQuery as any)._query?.path?.segments?.join('/') || 'unknown';
  
  return onSnapshot(
    refOrQuery,
    (snapshot: any) => {
      // For query snapshots, we count the docs. For doc snapshots, it's 1.
      const reads = snapshot.docs ? (snapshot.docs.length || 1) : 1;
      incrementReadCount(reads);
      
      const estimatedInBytes = reads * 1536;
      trackBandwidth(estimatedInBytes, 'in');
      
      onNext(snapshot);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    },
    options
  );
}

/**
 * Tracked write operations
 */
export const trackedAddDoc = async <T = DocumentData>(
  reference: any,
  data: WithFieldValue<T>
) => {
  try {
    const result = await addDoc(reference, data);
    incrementWriteCount(1);
    trackBandwidth(JSON.stringify(data).length, 'out');
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, reference.path);
    throw error;
  }
};

export const trackedSetDoc = async <T = DocumentData>(
  reference: DocumentReference<T>,
  data: WithFieldValue<T>,
  options?: any
) => {
  try {
    const result = await setDoc(reference, data, options);
    incrementWriteCount(1);
    trackBandwidth(JSON.stringify(data).length, 'out');
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, reference.path);
    throw error;
  }
};

export const trackedGetDoc = async <T = DocumentData>(
  reference: DocumentReference<T>
) => {
  try {
    const result = await getDoc(reference);
    incrementReadCount(1);
    const estimatedInBytes = JSON.stringify(result.data()).length;
    trackBandwidth(estimatedInBytes, 'in');
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, reference.path);
    throw error;
  }
};

export const trackedUpdateDoc = async (
  reference: DocumentReference<any>,
  data: any
) => {
  try {
    const result = await updateDoc(reference, data);
    incrementWriteCount(1);
    trackBandwidth(JSON.stringify(data).length, 'out');
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, reference.path);
    throw error;
  }
};

export const trackedDeleteDoc = async (reference: DocumentReference) => {
  try {
    const result = await deleteDoc(reference);
    incrementWriteCount(1);
    trackBandwidth(100, 'out');
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, reference.path);
    throw error;
  }
};

export const incrementReadCount = (amount: number = 1) => {
  sessionReadCount += amount;
  if (typeof window !== 'undefined') {
    localStorage.setItem('db_read_stats', JSON.stringify({
      count: sessionReadCount,
      writeCount: sessionWriteCount,
      date: new Date().toDateString()
    }));
  }
  window.dispatchEvent(new CustomEvent('db-read-update', { detail: sessionReadCount }));
};

export const incrementWriteCount = (amount: number = 1) => {
  sessionWriteCount += amount;
  if (typeof window !== 'undefined') {
    localStorage.setItem('db_read_stats', JSON.stringify({
      count: sessionReadCount,
      writeCount: sessionWriteCount,
      date: new Date().toDateString()
    }));
  }
  window.dispatchEvent(new CustomEvent('db-write-update', { detail: sessionWriteCount }));
};

export { db, auth, storage, writeBatch };

// Connection test
async function testConnection() {
  try {
    // Using a non-existent doc to test connectivity
    const { getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'system_logs', 'connection_test'));
    console.log("Firestore connection test successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();

export const getDb = () => db;
export const getStorageInstance = () => storage;
export default app;
