import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getDocs, Query, QuerySnapshot } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCzzpZyz8rBhtnskhbkXB7_dTfHgXLPHfs",
  authDomain: "body-line-67637.firebaseapp.com",
  projectId: "body-line-67637",
  storageBucket: "body-line-67637.firebasestorage.app",
  messagingSenderId: "993710849249",
  appId: "1:993710849249:web:c93118f11d0b073ed48ba0",
  measurementId: "G-6KKFY0N55H"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const auth = getAuth(app);
const storage = getStorage(app);

export let sessionReadCount = 0;

/**
 * Wrapper חכם לשליפת מסמכים שסופר קריאות בזמן אמת
 */
export const trackedGetDocs = async (query: Query): Promise<QuerySnapshot> => {
    const snapshot = await getDocs(query);
    // Firebase מחייב על כל מסמך שחזר + 1 על השאילתה עצמה
    const reads = snapshot.size || 1; 
    sessionReadCount += reads;
    
    // עדכון אירוע מותאם אישית כדי שחדר המכונות יתעדכן
    window.dispatchEvent(new CustomEvent('db-read-update', { detail: sessionReadCount }));
    
    return snapshot;
};

export { db, auth, storage };
export const getDb = () => db;
export const getStorageInstance = () => storage;
export default app;
