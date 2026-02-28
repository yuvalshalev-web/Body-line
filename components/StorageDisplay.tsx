import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '../services/firebase';
import { HardDrive } from 'lucide-react';

const StorageDisplay: React.FC = () => {
  const [sizeInMB, setSizeInMB] = useState<string>('0.00');
  const QUOTA_MB = 1000;

  useEffect(() => {
    const docRef = doc(db, "admin", "storage_metadata");
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const totalBytes = docSnap.data().totalBytes || 0;
        const mb = totalBytes / (1024 * 1024);
        setSizeInMB(mb.toFixed(2));
      }
    }, (error) => {
      console.error("Error listening to storage counter:", error);
    });

    return () => unsubscribe();
  }, []);

  const percentage = Math.min((Number(sizeInMB) / QUOTA_MB) * 100, 100).toFixed(1);

  const formatSize = (mb: number) => {
    if (mb >= 1024 * 1024) return `${(mb / (1024 * 1024)).toFixed(2)} TB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const getBarColor = () => {
    const p = Number(percentage);
    if (p < 70) return '#4caf50'; // ירוק
    if (p < 90) return '#ff9800'; // כתום
    return '#f44336'; // אדום
  };

  return (
    <div className="w-full space-y-3" dir="rtl">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <HardDrive size={18} className="text-[#40E0D0]" />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Storage usage</span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200/50">
        <div 
          className="h-full liquid-progress-bar rounded-full breathing-glow"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: getBarColor(),
            '--glow-color': `${getBarColor()}60`
          } as any}
        />
      </div>

      <div className="flex justify-between items-end">
        <div className="text-right">
          <p className="text-sm font-black text-slate-600 tabular-nums leading-none">{formatSize(Number(sizeInMB))}</p>
          <p className="text-[8px] font-bold text-slate-400 mt-1">בשימוש</p>
        </div>
        
        <div className="text-center">
          <p className="text-xs font-black text-slate-600 tabular-nums leading-none">{percentage}%</p>
          <p className="text-[8px] font-bold text-slate-400 mt-1">ניצול</p>
        </div>

        <div className="text-left">
          <p className="text-[10px] font-black text-slate-600 tabular-nums leading-none">{formatSize(QUOTA_MB)}</p>
          <p className="text-[8px] font-bold text-slate-400 mt-1">מכסה</p>
        </div>
      </div>
    </div>
  );
};

export default StorageDisplay;
