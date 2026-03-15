import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { db, getStorageInstance } from '../services/firebase';

/**
 * Updates the global storage statistics in Firestore.
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
 */
export const syncStorageOnUpload = async (fileSizeInBytes: number) => {
  try {
    const statsRef = doc(db, "admin", "storage_metadata");
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      await setDoc(statsRef, {
        totalBytes: fileSizeInBytes,
        updatedAt: new Date().toISOString(),
        initialized: true
      });
    } else {
      await updateDoc(statsRef, {
        totalBytes: increment(fileSizeInBytes),
        updatedAt: new Date().toISOString()
      });
    }
    console.log("✅ המונה עודכן: נוספו " + fileSizeInBytes + " בתים");
  } catch (error) {
    console.error("❌ שגיאה בעדכון המונה:", error);
  }
};

/**
 * מעדכן את מונה האחסון ב-Firestore לאחר מחיקה
 */
export const syncStorageOnDelete = async (fileSizeInBytes: number) => {
  try {
    const statsRef = doc(db, "admin", "storage_metadata");
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      await setDoc(statsRef, {
        totalBytes: 0,
        updatedAt: new Date().toISOString(),
        initialized: true
      });
    } else {
      await updateDoc(statsRef, {
        totalBytes: increment(-fileSizeInBytes),
        updatedAt: new Date().toISOString()
      });
    }
    console.log("🗑️ המונה עודכן: הוסרו " + fileSizeInBytes + " בתים");
  } catch (error) {
    console.error("❌ שגיאה בעדכון המונה לאחר מחיקה:", error);
  }
};

/**
 * סורק את כל תיקיות האחסון ומחשב מחדש את הגודל הכולל
 */
export const recalculateStorageFromStorage = async (): Promise<number> => {
  try {
    const storage = getStorageInstance();
    const folders = ['gallery', 'news', 'events', 'assets/site', 'assets/logo'];
    let totalBytes = 0;

    for (const folder of folders) {
      const folderRef = ref(storage, folder);
      try {
        const res = await listAll(folderRef);
        for (const item of res.items) {
          const meta = await getMetadata(item);
          totalBytes += meta.size || 0;
        }
      } catch (e) {
        console.warn(`Could not list folder ${folder}:`, e);
      }
    }

    const statsRef = doc(db, "admin", "storage_metadata");
    await setDoc(statsRef, {
      totalBytes,
      updatedAt: new Date().toISOString(),
      initialized: true,
      recalculatedAt: new Date().toISOString()
    });

    console.log(`📊 Storage recalculated: ${totalBytes} bytes`);
    return totalBytes;
  } catch (error) {
    console.error("Error recalculating storage:", error);
    return 0;
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
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn("⚠️ Storage stats initialization deferred: Client is offline.");
    } else {
      console.error("❌ Error initializing storage stats:", error);
    }
  }
};
