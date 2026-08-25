import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PWAUpdateNotification: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Function to handle update when new worker is waiting or installed
    const handleServiceWorkerUpdate = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      setNeedRefresh(true);
    };

    // Check existing registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      setRegistration(reg);

      // Check periodically for updates (every 5 minutes)
      const interval = setInterval(() => {
        reg.update().catch((err) => console.log('SW update check failed:', err));
      }, 5 * 60 * 1000);

      // If waiting worker exists immediately
      if (reg.waiting) {
        handleServiceWorkerUpdate(reg);
      }

      // Listen for when a new worker becomes available
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed & ready
            handleServiceWorkerUpdate(reg);
          }
        });
      });

      return () => clearInterval(interval);
    });

    // Listen to controllerchange event (reload if new SW took over)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = () => {
    setIsUpdating(true);
    try {
      if (registration && registration.waiting) {
        // Send message to waiting SW to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      // Force reload if not reloaded within 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[99999]"
          dir="rtl"
        >
          <div className="bg-[#0f1d24]/95 border-2 border-[#00AFC2]/60 p-4 rounded-2xl shadow-[0_10px_35px_rgba(0,175,194,0.4)] backdrop-blur-xl flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00AFC2] to-cyan-400 text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,175,194,0.6)]">
                <Sparkles size={20} className="animate-spin text-slate-900" style={{ animationDuration: '6s' }} />
              </div>
              <div className="text-right">
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  גרסה חדשה זמינה! ✨
                </h4>
                <p className="text-cyan-200/90 text-xs font-medium mt-0.5">
                  בוצע עדכון קוד עם שיפורים ותיקונים.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-3.5 py-2 bg-gradient-to-r from-[#00AFC2] to-cyan-500 hover:from-cyan-400 hover:to-[#00AFC2] text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
              >
                <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? 'מעדכן...' : 'עדכן עכשיו'}</span>
              </button>
              <button
                type="button"
                onClick={() => setNeedRefresh(false)}
                className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="סגור"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
