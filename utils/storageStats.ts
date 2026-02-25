import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Updates the global storage statistics in Firestore.
 * This should be called after every successful file upload.
 * @param bytes The size of the uploaded file in bytes.
 */
export const updateStorageStats = async (bytes: number) => {
  try {
    const statsRef = doc(db, "admin", "storage_metadata");
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      // Initialize if doesn't exist
      await setDoc(statsRef, {
        totalBytes: bytes,
        updatedAt: new Date().toISOString()
      });
    } else {
      await updateDoc(statsRef, {
        totalBytes: increment(bytes),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating storage stats:', error);
  }
};

/**
 * Retrieves the current storage size in megabytes.
 */
export const getStorageSizeMB = async (): Promise<number> => {
  try {
    const statsRef = doc(db, "admin", "storage_metadata");
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const totalBytes = statsDoc.data().totalBytes || 0;
      return Number((totalBytes / (1024 * 1024)).toFixed(2));
    }
    return 0;
  } catch (error) {
    console.error('Error getting storage size:', error);
    return 0;
  }
};

/**
 * מעדכן את מונה האחסון ב-Firestore לאחר העלאה
 * @param {number} fileSizeInBytes - גודל הקובץ שהועלה (file.size)
 */
export const syncStorageOnUpload = async (fileSizeInBytes: number) => {
  try {
    const statsRef = doc(db, "admin", "storage_metadata");
    await updateDoc(statsRef, {
      totalBytes: increment(fileSizeInBytes),
      updatedAt: new Date().toISOString()
    });
    console.log("✅ המונה עודכן: נוספו " + fileSizeInBytes + " בתים");
  } catch (error) {
    console.error("❌ שגיאה בעדכון המונה:", error);
  }
};

/**
 * מעדכן את מונה האחסון ב-Firestore לאחר מחיקה
 * @param {number} fileSizeInBytes - גודל הקובץ שנמחק
 */
export const syncStorageOnDelete = async (fileSizeInBytes: number) => {
  try {
    const statsRef = doc(db, "admin", "storage_metadata");
    // שימוש ב-increment עם ערך שלילי כדי להחסיר
    await updateDoc(statsRef, {
      totalBytes: increment(-fileSizeInBytes),
      updatedAt: new Date().toISOString()
    });
    console.log("🗑️ המונה עודכן: הוסרו " + fileSizeInBytes + " בתים");
  } catch (error) {
    console.error("❌ שגיאה בעדכון המונה לאחר מחיקה:", error);
  }
};

/**
 * Initial setup for storage stats.
 */
export const initializeStorageStats = async () => {
  try {
    const statsRef = doc(db, "admin", "storage_metadata");
    const statsDoc = await getDoc(statsRef);
    if (!statsDoc.exists()) {
      await setDoc(statsRef, {
        totalBytes: 11450000,
        updatedAt: new Date().toISOString(),
        initialized: true
      });
      console.log("✅ Storage stats initialized with 11,450,000 bytes");
    }
  } catch (error) {
    console.error("❌ Error initializing storage stats:", error);
  }
};
