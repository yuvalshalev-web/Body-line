
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCzzpZyz8rBhtnskhbkXB7_dTfHgXLPHfs",
  authDomain: "body-line-67637.firebaseapp.com",
  projectId: "body-line-67637",
  storageBucket: "body-line-67637.firebasestorage.app",
  messagingSenderId: "993710849249",
  appId: "1:993710849249:web:c93118f11d0b073ed48ba0",
  measurementId: "G-6KKFY0N55H"
};

// Singleton pattern for app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics safely in the browser context
if (typeof window !== "undefined") {
  isSupported().then(supported => {
    if (supported) {
      getAnalytics(app);
    }
  }).catch(err => console.warn("Firebase Analytics not supported in this environment"));
}

// Export services strictly tied to the initialized app instance
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
