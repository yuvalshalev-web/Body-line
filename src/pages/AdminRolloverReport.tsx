import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Activity, Calendar, CheckCircle, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from '../services/firebase';
import { formatDateTime, parseDate } from '../utils/dateUtils';

export const AdminRolloverReport: React.FC = () => {
  const { weeklyHistory, yearConfig, finalizeSession, activeSessionDate } = useData();
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [saveWeather, setSaveWeather] = useState<boolean>(true);

  useEffect(() => {
    console.log('AdminRolloverReport: activeSessionDate =', activeSessionDate);
    if (!activeSessionDate) return;
    
    const targetDate = new Date(activeSessionDate);
    console.log('AdminRolloverReport: targetDate =', targetDate);
    
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft('הסשן אמור להתחיל/להסתיים עכשיו');
        clearInterval(timer);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft(`${days} ימים, ${hours} שעות, ${minutes} דקות, ${seconds} שניות`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeSessionDate]);

  useEffect(() => {
    console.log('AdminRolloverReport: logs =', logs);
  }, [logs]);

  useEffect(() => {
    console.log('Weekly History Data:', weeklyHistory);
  }, [weeklyHistory]);

  useEffect(() => {
    const db = getDb();
    const q = query(collection(db, 'rollover_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('AdminRolloverReport: Received logs:', newLogs);
      setLogs(newLogs);
    }, (error) => {
      console.error('AdminRolloverReport: Error listening to rollover_logs:', error);
      setError('שגיאה בטעינת לוגים של גלגול שבועי');
    });
    return unsub;
  }, []);

  const recentLogs = useMemo(() => {
    if (!logs.length) return [];
    const lastStartIdx = logs.findIndex(l => l.action === 'start');
    if (lastStartIdx === -1) return logs;
    // Since logs are sorted desc, the logs for the most recent run are from index 0 to lastStartIdx
    return logs.slice(0, lastStartIdx + 1);
  }, [logs]);

  const rolloverSteps = [
    { id: 'start', label: 'התחלת תהליך סגירה' },
    { id: 'archive', label: 'הפיכת הסשן הקרוב להיסטורי' },
    { id: 'save_sea_state', label: 'שמירת נתוני מצב הים' },
    { id: 'create_new', label: 'הקמת סשן קרוב חדש' },
    { id: 'reset_timer', label: 'איפוס טיימר סשן קרוב' },
    { id: 'reset_attendance', label: 'איפוס רשימת מאשרי הגעה' },
    { id: 'update_stats', label: 'עדכון סטטיסטיקות אישיות וקבוצתיות' },
    { id: 'save_db', label: 'שמירת כל העדכונים במסד הנתונים' },
    { id: 'complete', label: 'סיום תהליך סגירה' },
  ];

  const handleFinalize = async () => {
    setError(null);
    try {
      await finalizeSession(saveWeather);
    } catch (err: any) {
      console.error('Finalization error:', err);
      setError(err.message || 'אירעה שגיאה בלתי צפויה בתהליך הסגירה');
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-800">דוח גלגול שבועי</h2>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="saveWeather" className="text-sm font-bold text-slate-600 cursor-pointer">
              שמור נתוני ים ומזג אוויר
            </label>
            <input
              type="checkbox"
              id="saveWeather"
              checked={saveWeather}
              onChange={(e) => setSaveWeather(e.target.checked)}
              className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 focus:ring-2 cursor-pointer"
            />
          </div>
          <button 
            onClick={handleFinalize}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700 transition-colors flex items-center gap-2"
          >
            <Activity size={18} />
            הפעל סגירת סשן
          </button>
        </div>
      </div>

      {timeLeft && (
        <div className="mb-8 p-4 bg-sky-50 border border-sky-200 rounded-xl text-center">
          <p className="text-sm font-bold text-sky-800 mb-1">זמן שנותר לסגירת הסשן הקרוב:</p>
          <p className="text-2xl font-black text-sky-900">{timeLeft}</p>
        </div>
      )}

      {/* Last Rollover Summary */}
      {recentLogs.length > 0 && (
        <div className="mb-8 p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden relative">
          {/* Subtle Background Glow based on status */}
          <div className={`absolute top-0 left-0 w-full h-1 ${recentLogs.find(l => l.action === 'complete')?.status === 'success' ? 'bg-emerald-500' : recentLogs.some(l => l.status === 'failed') ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
             <div>
               <h3 className="text-2xl font-black text-white">יומן מערכת לגלגול סשן (Rollover Trace)</h3>
               <p className="text-sm text-slate-400 mt-1">אובייקט אחוד למעקב טכני, שלבי יצירה וניהול שגיאות.</p>
             </div>
             {recentLogs.find(l => l.action === 'complete')?.status === 'success' ? 
               <span className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg flex items-center gap-2 w-fit"><CheckCircle size={18}/> ריצה הסתיימה בהצלחה</span> : 
               recentLogs.some(l => l.status === 'failed') ? 
               <span className="px-5 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold rounded-lg flex items-center gap-2 w-fit"><AlertTriangle size={18}/> הריצה נכשלה</span> :
               <span className="px-5 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold rounded-lg flex items-center gap-2 w-fit"><Loader2 size={18} className="animate-spin"/> הריצה מתבצעת כעת...</span>
             }
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. What was planned - The blueprint */}
            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 h-full flex flex-col">
              <h4 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2 border-b border-slate-700 pb-3">
                <Circle size={16} className="text-slate-500"/> מה תוכנן (Blueprint)
              </h4>
              <ul className="space-y-4 mt-2">
                {rolloverSteps.map((step, idx) => (
                  <li key={`plan-${step.id}`} className="text-sm text-slate-400 flex items-start gap-3">
                    <span className="text-slate-600 font-mono text-xs mt-0.5">{idx + 1}.</span>
                    <span>{step.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. What was executed / is executing */}
            <div className="bg-emerald-950/10 p-5 rounded-xl border border-emerald-900/30 h-full relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
              <h4 className="text-sm font-bold text-emerald-400 mb-5 flex items-center gap-2 border-b border-emerald-900/50 pb-3 relative z-10">
                <Activity size={16} /> מה בוצע / בביצוע
              </h4>
              <ul className="space-y-5 mt-2 relative z-10">
                {rolloverSteps.map((step) => {
                  const log = recentLogs.find(l => l.action === step.id);
                  if (log?.status === 'success' || log?.status === 'pending') {
                    const isPending = log.status === 'pending';
                    const metrics = log.metrics;
                    return (
                      <li key={`exec-${step.id}`} className="flex flex-col gap-2">
                        <div className={`text-sm flex items-start gap-3 ${isPending ? 'text-amber-300' : 'text-emerald-300/90'}`}>
                          {isPending ? <Loader2 size={16} className="animate-spin text-amber-500 mt-0.5 shrink-0" /> : <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />}
                          <div className="flex flex-col">
                            <span className="font-bold">{step.label}</span>
                            {log.details && <span className="text-xs text-slate-500 font-normal mt-0.5">{log.details}</span>}
                          </div>
                        </div>
                        {metrics && (
                          <div className="mr-7 p-2.5 bg-slate-900/80 rounded border border-slate-700/50 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-2">
                            {metrics.durationMs !== undefined && <span className="flex items-center gap-1 font-mono"><span className="text-slate-600">TIME:</span> {metrics.durationMs}ms</span>}
                            {metrics.updatedFields !== undefined && <span className="flex items-center gap-1 font-mono"><span className="text-slate-600">RECORDS:</span> {metrics.updatedFields}/{metrics.expectedFields}</span>}
                            {metrics.saveStatus && <span className="flex items-center gap-1 font-mono"><span className="text-slate-600">SAVE:</span> <span className={metrics.saveStatus === 'success' ? 'text-emerald-500' : 'text-amber-500'}>{metrics.saveStatus}</span></span>}
                          </div>
                        )}
                      </li>
                    );
                  }
                  return null;
                })}
                {!recentLogs.some(l => l.status === 'success' || l.status === 'pending') && (
                  <li className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-700 rounded-lg">טרם בוצעו שלבים בריצה זו</li>
                )}
              </ul>
            </div>

            {/* 3. What was NOT executed and why */}
            <div className={`bg-rose-950/10 p-5 rounded-xl border border-rose-900/30 h-full relative overflow-hidden flex flex-col ${recentLogs.find(l => l.action === 'complete')?.status === 'success' ? 'opacity-80' : ''}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full pointer-events-none" />
              <h4 className="text-sm font-bold text-rose-400 mb-5 flex items-center gap-2 border-b border-rose-900/50 pb-3 relative z-10">
                <AlertTriangle size={16} /> לא בוצע ומדוע
              </h4>
              
              <ul className="space-y-5 mt-2 relative z-10">
                {rolloverSteps.map((step) => {
                  const log = recentLogs.find(l => l.action === step.id);
                  const hasFailedEarlier = recentLogs.some(l => l.status === 'failed');
                  const checkIdx = rolloverSteps.findIndex(s => s.id === step.id);
                  const failedLog = recentLogs.find(l => l.status === 'failed');
                  const failedStepIdx = failedLog ? rolloverSteps.findIndex(s => s.id === failedLog.action) : -1;

                  if (log?.status === 'failed') {
                    const metrics = log.metrics;
                    return (
                      <li key={`fail-${step.id}`} className="flex flex-col gap-2">
                        <div className="text-sm text-rose-300 font-bold flex items-start gap-3">
                          <AlertTriangle size={16} className="shrink-0 text-rose-500 mt-0.5" /> 
                          <div className="flex flex-col">
                            <span>{step.label}</span>
                            {metrics && metrics.durationMs !== undefined && <span className="text-[10px] text-rose-400/50 font-mono mt-0.5">Failed after {metrics.durationMs}ms</span>}
                          </div>
                        </div>
                        <div className="mr-7 text-xs text-rose-200/90 bg-rose-950/80 p-3 rounded-lg leading-relaxed border border-rose-900/50 shadow-inner">
                          <span className="font-bold block mb-1 text-rose-400/80 text-[10px] uppercase tracking-wider">ERROR REASON:</span>
                          {log.details || 'שגיאה לא ידועה בתריליך הריצה.'}
                        </div>
                      </li>
                    );
                  }
                  
                  if (!log && hasFailedEarlier && failedStepIdx !== -1 && checkIdx > failedStepIdx) {
                    return (
                      <li key={`skip-${step.id}`} className="flex flex-col gap-1.5 opacity-60">
                        <div className="text-sm text-slate-400 font-bold flex items-center gap-3">
                          <Circle size={14} className="shrink-0 text-slate-500" /> 
                          <span className="line-through decoration-slate-600/50">{step.label}</span>
                        </div>
                        <div className="mr-6 text-[10px] text-amber-500/80 font-mono px-2">
                          &gt; SKIPPED: Preceding process failed.
                        </div>
                      </li>
                    );
                  }
                  return null;
                })}

                {/* Complete Success Case */}
                {recentLogs.find(l => l.action === 'complete')?.status === 'success' && !recentLogs.some(l => l.status === 'failed') && (
                  <div className="flex flex-col items-center justify-center p-8 mt-4 h-[150px] border border-dashed border-emerald-900/30 rounded-xl bg-emerald-950/5">
                    <CheckCircle size={32} className="text-emerald-500/50 mb-3" />
                    <p className="text-lg font-black text-emerald-400 text-center tracking-tight">אין חריגות לחיווי</p>
                    <p className="text-xs text-slate-400 text-center mt-2 max-w-[200px] leading-relaxed">כל השלבים מהתוכנית המקורית בוצעו בהצלחה מלאה וללא דילוגים או שגיאות.</p>
                  </div>
                )}
              </ul>
            </div>
          </div>

          {/* Metrics summary */}
          {recentLogs.find(l => l.action === 'complete') && (
            <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">מדדי קצה (Global Metrics)</h4>
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">רשומות מתוכננות (Expected)</p>
                    <p className="text-2xl font-black text-white">{recentLogs.find(l => l.action === 'complete')?.metrics?.expectedFields || '0'}</p>
                  </div>
                  <div className="w-px h-10 bg-slate-700"></div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">רשומות שעודכנו בפועל (Actual)</p>
                    <p className="text-2xl font-black text-emerald-400">{recentLogs.find(l => l.action === 'complete')?.metrics?.updatedFields || '0'}</p>
                  </div>
                </div>
              </div>
              <div className="text-left bg-slate-900 px-4 py-3 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400 font-mono tracking-wider flex items-center gap-2"><Activity size={12} className="text-emerald-500"/> SYSTEM TRACE VERIFIED</p>
                  <p className="text-[10px] text-slate-600 font-mono mt-1 blur-[0.3px]">ROLLOVER.ENGINE // {new Date().getFullYear()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 shadow-sm">
          <AlertTriangle size={20} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Calendar size={18} />
            <span className="text-sm font-bold">תקופת פעילות נוכחית</span>
          </div>
          <p className="text-lg font-black text-slate-800">
            {yearConfig?.startDate ? new Date(yearConfig.startDate).toLocaleDateString('he-IL') : 'לא מוגדר'} - 
            {yearConfig?.endDate ? new Date(yearConfig.endDate).toLocaleDateString('he-IL') : 'לא מוגדר'}
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Activity size={18} />
            <span className="text-sm font-bold">סשנים שתועדו</span>
          </div>
          <p className="text-lg font-black text-slate-800">{weeklyHistory.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 text-sm font-bold text-slate-500">תאריך</th>
              <th className="py-3 px-4 text-sm font-bold text-slate-500">משתתפים</th>
              <th className="py-3 px-4 text-sm font-bold text-slate-500">סטטוס סגירה</th>
            </tr>
          </thead>
          <tbody>
            {[...weeklyHistory].sort((a, b) => {
              const getDate = (s: any) => {
                if (!s.date) return new Date(0);
                if (s.date.seconds) return new Date(s.date.seconds * 1000);
                return s.date.toDate ? s.date.toDate() : new Date(s.date);
              };
              return getDate(b).getTime() - getDate(a).getTime();
            }).map((session) => (
              <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-800">
                  {(() => {
                    if (!session.date) return 'ללא תאריך';
                    
                    // Handle Firestore Timestamp (either object or serialized)
                    let dateValue: Date;
                    if (session.date.seconds) {
                      dateValue = new Date(session.date.seconds * 1000);
                    } else if (session.date.type === 'firestore/timestamp/1.0') {
                      dateValue = new Date(session.date.seconds * 1000);
                    } else {
                      dateValue = parseDate(session.date) || new Date();
                    }
                    
                    if (isNaN(dateValue.getTime())) {
                      return 'תאריך לא תקין';
                    }
                    
                    const formattedDate = formatDateTime(dateValue);
                    return session.isEvent ? `${session.title || 'אירוע קהילה'} - ${formattedDate}` : formattedDate;
                  })()}
                </td>
                <td className="py-3 px-4 text-slate-600">{session.participantsCount || 0}</td>
                <td className="py-3 px-4 text-center">
                  {session.status === 'finalized' ? (
                    <CheckCircle className="text-emerald-500 mx-auto" size={20} />
                  ) : (
                    <AlertTriangle className="text-rose-500 mx-auto" size={20} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRolloverReport;
