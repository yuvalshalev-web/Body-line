import React from 'react';
import { useData } from '../contexts/DataContext';
import { AlertTriangle, Wifi, WifiOff, RefreshCw, X, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DatabaseStatus: React.FC = () => {
  const { dbStatus, toggleDbStatus, hasQuotaError, connectionError, retryConnection, isLoading } = useData();
  const [show, setShow] = React.useState(true);

  if (!show) return null;

  const isOffline = dbStatus === 'OFFLINE';
  const hasError = isOffline || hasQuotaError || connectionError;

  return (
    <AnimatePresence>
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 right-4 z-[9999] md:left-auto md:right-4 md:w-96"
        >
          <div className={`p-4 rounded-2xl shadow-2xl border ${
            hasQuotaError ? 'bg-red-500/90 border-red-400' : 
            connectionError ? 'bg-indigo-500/90 border-indigo-400' :
            'bg-amber-500/90 border-amber-400'
          } backdrop-blur-md text-white`}>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                {hasQuotaError ? <AlertTriangle size={20} /> : 
                 connectionError ? <Wifi size={20} className="animate-pulse" /> :
                 <WifiOff size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">
                  {hasQuotaError ? 'שגיאת מכסה (Quota Exceeded)' : 
                   connectionError ? 'בעיית חיבור למסד הנתונים' :
                   'חיבור למסד הנתונים הופסק'}
                </h3>
                <p className="text-xs opacity-90 mt-1 leading-relaxed">
                  {hasQuotaError 
                    ? 'הגעת למכסת הקריאות היומית של Firebase. המערכת עברה למצב לא מקוון כדי למנוע שגיאות נוספות. המכסה תתאפס בחצות.'
                    : connectionError
                    ? `נראה שיש בעיה בחיבור לשרת (${connectionError}). המערכת מנסה להתחבר מחדש...`
                    : 'המערכת נמצאת כרגע במצב לא מקוון (Offline Mode). נתונים לא יישמרו ולא ייטענו מהשרת.'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (connectionError) {
                        retryConnection();
                      } else {
                        toggleDbStatus();
                        if (hasQuotaError) window.location.reload();
                      }
                    }}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'מתחבר...' : (connectionError ? 'נסה שוב' : (isOffline ? 'נסה להתחבר מחדש' : 'טען מחדש'))}
                  </button>
                  <button
                    onClick={() => {
                      console.log("--- FIREBASE DIAGNOSTICS ---");
                      console.log("Config:", (window as any)._firebase_config);
                      console.log("Connected:", (window as any)._db_connected);
                      console.log("Last Error:", (window as any)._db_error);
                      console.log("Last Snapshot:", (window as any)._db_last_snapshot);
                      console.log("Last Success:", (window as any)._db_last_success);
                      console.log("DB Status:", dbStatus);
                      console.log("Quota Error:", hasQuotaError);
                      console.log("Connection Error:", connectionError);
                      console.log("LocalStorage:", {
                        kill_switch: localStorage.getItem('kill_switch_active'),
                        read_stats: localStorage.getItem('db_read_stats')
                      });
                      alert("Diagnostics logged to console (F12)");
                    }}
                    className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-colors flex items-center gap-1.5"
                  >
                    <Terminal size={14} />
                    דיאגנוסטיקה
                  </button>
                  <button
                    onClick={() => setShow(false)}
                    className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-colors"
                  >
                    התעלם
                  </button>
                </div>
              </div>
              <button onClick={() => setShow(false)} className="text-white/60 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
