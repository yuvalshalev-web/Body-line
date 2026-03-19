import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDocs, Query, QuerySnapshot, collection, addDoc, query, orderBy, limit, deleteDoc, writeBatch, doc } from 'firebase/firestore';
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

// Initialize read count from localStorage if it's from the same day
if (typeof window !== 'undefined') {
  const savedData = localStorage.getItem('db_read_stats');
  if (savedData) {
    const { count, date } = JSON.parse(savedData);
    const today = new Date().toDateString();
    if (date === today) {
      sessionReadCount = count;
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
};

export const loadLogsFromDatabase = async (): Promise<SystemLog[]> => {
  const logsCollection = collection(db, 'system_logs');
  const q = query(logsCollection, orderBy('timestamp', 'desc'), limit(100));
  const snapshot = await getDocs(q);
  
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
    // בדיקת Kill Switch
    // מאפשרים קריאה רק אם מדובר בבדיקת לוגין (members) כדי למנוע נעילה מוחלטת של מנהלים
    const path = (query as any)._query?.path?.segments?.join('/') || 'unknown';
    const isLoginQuery = path.includes('members');

    if (db_status === 'OFFLINE' && !isLoginQuery) {
      console.warn('Database is OFFLINE. Blocking Firebase read.');
      addLog('Database is OFFLINE. Blocking Firebase read.', 'Warning', 'Database');
      throw new Error('QUOTA_EXCEEDED_OR_KILL_SWITCH');
    }

    try {
      const snapshot = await getDocs(query);
      // Firebase מחייב על כל מסמך שחזר + 1 על השאילתה עצמה
      const reads = snapshot.size || 1; 
      sessionReadCount += reads;
      
      // Estimate bandwidth: Average doc size 1.5KB + overhead
      const estimatedInBytes = reads * 1536; 
      trackBandwidth(estimatedInBytes, 'in');
      // Outgoing query overhead (approx 200 bytes)
      trackBandwidth(200, 'out');
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('db_read_stats', JSON.stringify({
          count: sessionReadCount,
          date: new Date().toDateString()
        }));
      }
      
      // עדכון אירוע מותאם אישית כדי שחדר המכונות יתעדכן
      window.dispatchEvent(new CustomEvent('db-read-update', { detail: sessionReadCount }));
      
      return snapshot;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error; // handleFirestoreError already throws, but for TS
    }
};

export { db, auth, storage };
export const getDb = () => db;
export const getStorageInstance = () => storage;
export default app;
