import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCzzpZyz8rBhtnskhbkXB7_dTfHgXLPHfs",
  authDomain: "body-line-67637.firebaseapp.com",
  projectId: "body-line-67637",
  storageBucket: "body-line-67637.firebasestorage.app",
  messagingSenderId: "993710849249",
  appId: "1:993710849249:web:c93118f11d0b073ed48ba0",
  measurementId: "G-6KKFY0N55H"
};

// Ensure app is initialized exactly once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Safe getter pattern for Firestore
let dbInstance: any = null;
export const getDb = () => {
  if (!dbInstance) {
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};

// Safe getter pattern for Storage
let storageInstance: any = null;
export const getStorageInstance = () => {
  if (!storageInstance) {
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

export default app;