import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from 'firebase/auth';
import { 
  getFirestore, initializeFirestore, getDocs, getDoc, Query, QuerySnapshot, collection, addDoc, query, orderBy, 
  limit, deleteDoc, writeBatch, doc, getDocFromServer, setDoc, updateDoc, onSnapshot,
  DocumentReference, UpdateData, WithFieldValue, DocumentData, Unsubscribe, 
  SnapshotListenOptions, FirestoreError, DocumentSnapshot, QueryConstraint, Firestore,
  terminate, clearIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { trackBandwidth } from '../utils/bandwidthTracker';
import { addLog, SystemLog } from '../utils/systemLogs';

import firebaseConfig from '../../firebase-applet-config.json';

// @ai-preserve: Firebase Initialization
if (typeof window !== 'undefined') {
  (window as any)._firebase_config = {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    databaseId: firebaseConfig.firestoreDatabaseId || "(default)",
    storageBucket: firebaseConfig.storageBucket
  };
  console.log("--- FIREBASE CONFIG DIAGNOSTICS ---");
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Auth Domain:", firebaseConfig.authDomain);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId);
  console.log("-----------------------------------");
}

let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Firebase app:", error);
  throw error;
}

// Check if we are inside an iframe (like AI Studio Preview)
let isIframe = false;
if (typeof window !== 'undefined') {
  try {
    isIframe = window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin policies, we are definitely in an iframe
    isIframe = true;
  }
}

// Handle "(default)" database ID correctly with auto-detect long polling for maximum reliability across iframes and sandboxes
export const db: Firestore = (() => {
  const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, dbId);
  } catch (e) {
    console.warn("initializeFirestore already called or failed, falling back to getFirestore:", e);
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
})();

console.log("Firestore initialized successfully.");

// Initialize Auth specifically to avoid IndexedDB crash in iframes
export const auth = isIframe 
  ? initializeAuth(app, { persistence: inMemoryPersistence }) 
  : getAuth(app);
  
export const storage = getStorage(app);
console.log("Auth and Storage initialized.");

// Helper to safely access localStorage, preventing crashes in iframes with tight security
const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage.getItem blocked for key ${key}:`, e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage.setItem blocked for key ${key}:`, e);
    }
  }
};

export let sessionReadCount = 0;
export let sessionWriteCount = 0;

// Initialize stats from localStorage if it's from the same day
if (typeof window !== 'undefined') {
  const savedData = safeLocalStorage.getItem('db_read_stats');
  if (savedData) {
    try {
      const { count, writeCount, date } = JSON.parse(savedData);
      const today = new Date().toDateString();
      if (date === today) {
        sessionReadCount = count || 0;
        sessionWriteCount = writeCount || 0;
      }
    } catch (e) {
      console.error("Failed to parse db_read_stats from safeLocalStorage", e);
    }
  }
}

export let db_status: 'ONLINE' | 'OFFLINE' = 'ONLINE';

export const setDbStatus = (status: 'ONLINE' | 'OFFLINE') => {
  db_status = status;
  if (typeof window !== 'undefined') {
    safeLocalStorage.setItem('kill_switch_active', String(status === 'OFFLINE'));
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

export interface FirestoreErrorInfo {
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

export const handleFirestoreError = (error: any, operationType: OperationType, path: string | null, shouldThrow: boolean = true) => {
  const errCode = error?.code || 'unknown';
  const errMsg = error?.message || String(error);
  
  if (errCode === 'unavailable' || errMsg.includes('offline') || errMsg.includes('Could not reach Cloud Firestore backend')) {
    console.warn(`[Firestore ${operationType}] Temporary connectivity issue at ${path}:`, errMsg);
    return;
  }
  
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
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
  console.error(`[Firestore ${operationType}] Error at ${path}:`, errCode, errMsg);
  
  // Log to system logs (localStorage)
  addLog(`Firestore ${operationType} Error: ${errMsg}`, 'Critical', 'Database', jsonError);
  
  // Handle Quota Exceeded
  if (errCode === 'resource-exhausted' || errMsg.toLowerCase().includes('quota') || errMsg.includes('429')) {
    console.warn("QUOTA EXCEEDED detected. Switching to OFFLINE mode.");
    setDbStatus('OFFLINE');
  }

  if (shouldThrow) {
    throw new Error(jsonError);
  }
};

/**
 * Wrapper חכם לשליפת מסמכים שסופר קריאות בזמן אמת
 */
export const trackedGetDocs = async (query: Query): Promise<QuerySnapshot> => {
    let path = 'unknown';
    try {
      path = (query as any)._query?.path?.segments?.join('/') || (query as any).path || 'unknown';
    } catch (e) {
      console.warn("Could not determine query path", e);
    }
    
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
  let path = 'unknown';
  try {
    path = refOrQuery.path || (refOrQuery as any)._query?.path?.segments?.join('/') || 'unknown';
  } catch (e) {
    console.warn("Could not determine snapshot path", e);
  }
  
  return onSnapshot(
    refOrQuery,
    (snapshot: any) => {
      // For query snapshots, we count the docs. For doc snapshots, it's 1.
      const reads = snapshot.docs ? (snapshot.docs.length || 1) : 1;
      incrementReadCount(reads);
      
      const estimatedInBytes = reads * 1536;
      trackBandwidth(estimatedInBytes, 'in');
      
      if (typeof window !== 'undefined') {
        (window as any)._db_last_snapshot = {
          path,
          time: new Date().toISOString(),
          size: snapshot.size || (snapshot.exists ? 1 : 0),
          fromCache: snapshot.metadata?.fromCache
        };
      }
      
      onNext(snapshot);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path, false);
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
    const stringified = JSON.stringify(data);
    const estimatedOutBytes = stringified ? stringified.length : 0;
    trackBandwidth(estimatedOutBytes, 'out');
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
    const stringified = JSON.stringify(data);
    const estimatedOutBytes = stringified ? stringified.length : 0;
    trackBandwidth(estimatedOutBytes, 'out');
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
    const data = result.data();
    const stringified = data ? JSON.stringify(data) : null;
    const estimatedInBytes = stringified ? stringified.length : 0;
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
    const stringified = JSON.stringify(data);
    const estimatedOutBytes = stringified ? stringified.length : 0;
    trackBandwidth(estimatedOutBytes, 'out');
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
    safeLocalStorage.setItem('db_read_stats', JSON.stringify({
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
    safeLocalStorage.setItem('db_read_stats', JSON.stringify({
      count: sessionReadCount,
      writeCount: sessionWriteCount,
      date: new Date().toDateString()
    }));
  }
  window.dispatchEvent(new CustomEvent('db-write-update', { detail: sessionWriteCount }));
};

export { writeBatch };

// Connection test
async function testConnection() {
  if (typeof window === 'undefined') return;
  
  console.log("Starting Firestore connection test...");
  try {
    const { getDocFromServer } = await import('firebase/firestore');
    // Using public site_data config doc to test connectivity
    const testDocRef = doc(db, 'site_data', 'config');
    await getDocFromServer(testDocRef);
    console.log("Firestore connection test: SUCCESS (Server reached)");
    (window as any)._db_connected = true;
    (window as any)._db_last_success = new Date().toISOString();
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const errCode = error?.code || 'unknown';
    
    if (errCode === 'permission-denied') {
      console.log("Firestore reached (permission verified)");
      (window as any)._db_connected = true;
    } else {
      console.warn("Firestore connection test note:", { code: errCode, message: errMsg });
      (window as any)._db_connected = true; // Still allow applet to query and use listeners
    }
  }
}
testConnection();

export const getDb = () => db;
export const getStorageInstance = () => storage;
export default app;
