import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-[9999] flex items-center justify-between animate-in slide-in-from-bottom-5" dir="rtl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
          <Download className="text-white" size={24} />
        </div>
        <div>
          <h4 className="text-white font-black text-sm">התקן את האפליקציה</h4>
          <p className="text-slate-400 text-xs font-medium">גישה מהירה וביצועים טובים יותר</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={promptInstall}
          className="px-4 py-2 bg-white text-slate-900 text-xs font-black rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
        >
          התקן
        </button>
        <button 
          onClick={() => setDismissed(true)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
