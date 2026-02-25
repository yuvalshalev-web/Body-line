import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const StorageUsageMonitor: React.FC = () => {
  const [sizeMB, setSizeMB] = useState<string>('0.00');
  const [status, setStatus] = useState('ממתין...');

  useEffect(() => {
    setStatus('טוען נתונים...');
    
    const statsRef = doc(db, "admin", "storage_metadata");
    
    // האזנה בזמן אמת למסמך הסטטיסטיקה
    const unsubscribe = onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const totalBytes = snapshot.data().totalBytes || 0;
        // המרה למגה-בייט עם שתי ספרות אחרי הנקודה
        const mb = (totalBytes / (1024 * 1024)).toFixed(2);
        setSizeMB(mb);
        setStatus('מעודכן בזמן אמת');
      } else {
        setStatus('מסמך לא נמצא');
      }
    }, (error) => {
      console.error("Quota protection triggered or error:", error);
      setStatus('שגיאת מכסה - יש להמתין לשחרור החסימה');
    });

    // ניקוי המאזין בעת פירוק הקומפוננטה
    return () => unsubscribe();
  }, []); // מערך תלויות ריק - הבלם הכי חשוב למניעת לולאות

  return (
    <div className="p-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm mt-4" dir="rtl">
      <h3 className="text-sm font-black text-slate-900 mb-2">סטטוס אחסון (Blaze Safe Mode)</h3>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">גודל בשימוש: <strong className="text-[#006994]">{sizeMB} MB</strong></p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס: {status}</p>
      </div>
    </div>
  );
};

export default StorageUsageMonitor;
