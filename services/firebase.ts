
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzzpZyz8rBhtnskhbkXB7_dTfHgXLPHfs",
  authDomain: "body-line-67637.firebaseapp.com",
  projectId: "body-line-67637",
  storageBucket: "body-line-67637.firebasestorage.app",
  messagingSenderId: "993710849249",
  appId: "1:993710849249:web:c93118f11d0b073ed48ba0",
  measurementId: "G-6KKFY0N55H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
