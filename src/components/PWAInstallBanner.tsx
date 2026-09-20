import React, { useState } from 'react';
import { Download, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isIOS, showIOSGuide, setShowIOSGuide, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <>
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-[9999] flex items-center justify-between animate-in slide-in-from-bottom-5" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <Download className="text-white" size={24} />
          </div>
          <div>
            <h4 className="text-white font-black text-sm">התקנת אפליקציית חבל זוג</h4>
            <p className="text-slate-400 text-xs font-medium">{isIOS ? 'הוספה למסך הבית ב-iPhone' : 'גישה מיידית וביצועים מעולים'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={promptInstall}
            className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-900 text-xs font-black rounded-xl hover:from-cyan-300 hover:to-sky-400 transition-all shadow-md active:scale-95"
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

      {/* iOS Add to Home Screen Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-white pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-sky-400 flex items-center gap-2">
                <span>📱</span> התקנה ב-iPhone / iPad
              </h3>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 size={18} />
                </div>
                <div>
                  <span className="font-bold text-white block">1. לחץ על כפתור השיתוף (Share)</span>
                  <span className="text-xs text-slate-400">נמצא בסרגל התחתון של Safari</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare size={18} />
                </div>
                <div>
                  <span className="font-bold text-white block">2. בחר "הוסף למסך הבית"</span>
                  <span className="text-xs text-slate-400">גלול מטה בתפריט עד שתמצא Add to Home Screen</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-sm rounded-2xl shadow-lg hover:from-sky-400 hover:to-blue-500 transition-all"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

