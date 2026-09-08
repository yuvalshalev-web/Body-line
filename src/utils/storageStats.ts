import { doc, increment, collection, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { db, auth, getStorageInstance, trackedSetDoc, trackedUpdateDoc, trackedGetDocs } from '../services/firebase';
import { safeLocalStorage } from './storage';
import { ensureFirebaseAuthSession } from '../services/authSession';

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
  } catch (error: any) {
    console.warn('Note updating storage stats:', error?.message || error);
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
  } catch (error: any) {
    console.warn('Note getting storage size:', error?.message || error);
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
  } catch (error: any) {
    console.warn("⚠️ שגיאה בעדכון המונה לאחר העלאה:", error?.message || error);
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
  } catch (error: any) {
    console.warn("⚠️ שגיאה בעדכון המונה לאחר מחיקה:", error?.message || error);
  }
};

const listAllRecursive = async (folderRef: any): Promise<number> => {
  let totalBytes = 0;
  try {
    const res = await listAll(folderRef);
    for (const item of res.items) {
      const meta = await getMetadata(item);
      totalBytes += meta.size || 0;
    }
    for (const prefix of res.prefixes) {
      totalBytes += await listAllRecursive(prefix);
    }
  } catch (e) {
    console.warn(`Could not list folder ${folderRef.fullPath}:`, e);
  }
  return totalBytes;
};

/**
 * סורק את כל תיקיות האחסון ומחשב מחדש את הגודל הכולל
 */
export const recalculateStorageFromStorage = async (): Promise<number> => {
  try {
    const storage = getStorageInstance();
    const rootRef = ref(storage, '');
    const totalBytes = await listAllRecursive(rootRef);

    const statsRef = doc(db, "admin", "storage_metadata");
    await trackedSetDoc(statsRef, {
      totalBytes,
      updatedAt: new Date().toISOString(),
      initialized: true,
      recalculatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`📊 Storage recalculated: ${totalBytes} bytes`);
    return totalBytes;
  } catch (error) {
    console.error("Error recalculating storage:", error);
    return 0;
  }
};

/**
 * מחשב הערכה של גודל מסד הנתונים על סמך כמות המסמכים
 */
export const recalculateDatabaseSize = async (): Promise<number> => {
  try {
    const collections = [
      'members', 'joinRequests', 'gallery', 'events', 'system_logs', 
      'seaConditions', 'seaConditionsStats', 'quotes', 'news', 
      'podcasts', 'glossary', 'exercises', 'weekly_history', 
      'site_data', 'admin', 'rollover_logs'
    ];
    
    let totalDocs = 0;
    for (const colName of collections) {
      try {
        const snap = await trackedGetDocs(collection(db, colName));
        totalDocs += snap.size;
      } catch (e) {
        console.warn(`Could not count collection ${colName}:`, e);
      }
    }

    // הערכה גסה: 2KB למסמך בממוצע (כולל אינדקסים ומטא-דאטה)
    const estimatedBytes = totalDocs * 2048;
    const estimatedMB = Number((estimatedBytes / (1024 * 1024)).toFixed(2));

    const statsRef = doc(db, "admin", "database_metadata");
    await trackedSetDoc(statsRef, {
      estimatedBytes,
      estimatedMB,
      totalDocs,
      updatedAt: new Date().toISOString(),
      recalculatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`📊 Database size estimated: ${estimatedMB} MB (${totalDocs} docs)`);
    return estimatedMB;
  } catch (error) {
    console.error("Error recalculating database size:", error);
    return 0;
  }
};

/**
 * Initial setup for storage and database stats.
 */
export const initializeStorageStats = async () => {
  try {
    if (safeLocalStorage.getItem('admin_stats_initialized') === 'true') {
      return;
    }

    // Ensure Admin session is active before checking admin collections
    await ensureFirebaseAuthSession('Admin');

    if (!auth.currentUser) {
      return;
    }

    const storageStatsRef = doc(db, "admin", "storage_metadata");
    const dbStatsRef = doc(db, "admin", "database_metadata");
    
    const [storageSnap, dbSnap] = await Promise.all([
      getDoc(storageStatsRef),
      getDoc(dbStatsRef)
    ]);

    if (!storageSnap.exists()) {
      await setDoc(storageStatsRef, {
        totalBytes: 11450000,
        updatedAt: new Date().toISOString(),
        initialized: true
      });
      console.log("✅ Storage stats initialized");
    }

    if (!dbSnap.exists()) {
      await setDoc(dbStatsRef, {
        estimatedBytes: 204800,
        estimatedMB: 0.2,
        totalDocs: 100,
        updatedAt: new Date().toISOString(),
        initialized: true
      });
      console.log("✅ Database stats initialized");
    }

    safeLocalStorage.setItem('admin_stats_initialized', 'true');
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn("⚠️ Stats initialization deferred: Client is offline.");
    } else if (error?.code === 'permission-denied' || error?.message?.includes('permission-denied') || error?.message?.includes('insufficient permissions')) {
      console.warn("⚠️ Stats initialization deferred: Waiting for Admin permissions.");
    } else {
      console.warn("⚠️ Stats initialization note:", error?.message || error);
    }
  }
};
