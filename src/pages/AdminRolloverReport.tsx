import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Activity, Calendar, CheckCircle, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from '../services/firebase';

export const AdminRolloverReport: React.FC = () => {
  const { weeklyHistory, yearConfig, finalizeSession, activeSessionDate, updateHistoricalSeaTemperatures } = useData();
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUpdatingTemps, setIsUpdatingTemps] = useState(false);
  const [tempUpdateMessage, setTempUpdateMessage] = useState<string | null>(null);

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
    });
    return unsub;
  }, []);

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

  const getStepStatus = (stepId: string) => {
    const log = logs.find(l => l.action === stepId);
    if (!log) return 'pending';
    return log.status;
  };

  const handleFinalize = async () => {
    setError(null);
    try {
      await finalizeSession();
    } catch (err: any) {
      console.error('Finalization error:', err);
      setError(err.message || 'אירעה שגיאה בלתי צפויה בתהליך הסגירה');
    }
  };

  const handleUpdateTemps = async () => {
    setIsUpdatingTemps(true);
    setTempUpdateMessage(null);
    try {
      const count = await updateHistoricalSeaTemperatures();
      setTempUpdateMessage(`עודכנו בהצלחה ${count} סשנים היסטוריים עם נתוני טמפרטורת מים.`);
    } catch (err: any) {
      console.error('Update temps error:', err);
      setError(err.message || 'אירעה שגיאה בעדכון טמפרטורות');
    } finally {
      setIsUpdatingTemps(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-800">דוח גלגול שבועי</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleUpdateTemps}
            disabled={isUpdatingTemps}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isUpdatingTemps ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
            עדכן טמפ' היסטורית
          </button>
          <button 
            onClick={handleFinalize}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700 transition-colors flex items-center gap-2"
          >
            <Activity size={18} />
            הפעל סגירת סשן
          </button>
        </div>
      </div>

      {tempUpdateMessage && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
          <CheckCircle size={20} />
          <span className="font-bold">{tempUpdateMessage}</span>
        </div>
      )}

      {timeLeft && (
        <div className="mb-8 p-4 bg-sky-50 border border-sky-200 rounded-xl text-center">
          <p className="text-sm font-bold text-sky-800 mb-1">זמן שנותר לסגירת הסשן הקרוב:</p>
          <p className="text-2xl font-black text-sky-900">{timeLeft}</p>
        </div>
      )}

      {/* Last Rollover Summary */}
      {logs.find(l => l.action === 'complete') && (
        <div className="mb-8 p-6 bg-slate-800 rounded-xl text-white">
          <h3 className="text-lg font-black mb-4">סיכום סגירת סשן אחרונה</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 font-bold">מתוכנן (Expected)</p>
              <p className="text-xl font-black">{logs.find(l => l.action === 'complete')?.metrics?.expectedFields || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">בוצע בפועל (Actual)</p>
              <p className="text-xl font-black">{logs.find(l => l.action === 'complete')?.metrics?.updatedFields || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700">
          <AlertTriangle size={20} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-black text-slate-800 mb-4">תהליך סגירת סשן</h3>
        <div className="space-y-3">
          {rolloverSteps.map((step) => {
            const log = logs.find(l => l.action === step.id);
            const status = log ? log.status : 'idle';
            const metrics = log?.metrics;
            
            return (
              <div key={step.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {status === 'success' && <CheckCircle className="text-emerald-500" size={20} />}
                  {status === 'failed' && <AlertTriangle className="text-rose-500" size={20} />}
                  {status === 'pending' && <Loader2 className="text-sky-500 animate-spin" size={20} />}
                  {status === 'idle' && <Circle className="text-slate-300" size={20} />}
                  <span className={`font-bold ${status === 'idle' ? 'text-slate-400' : 'text-slate-800'}`}>
                    {step.label}
                  </span>
                  {log?.details && status !== 'idle' && (
                    <span className="text-xs text-slate-500 font-normal mr-auto">
                      {log.details}
                    </span>
                  )}
                </div>
                {metrics && (
                  <div className="mr-8 p-2 bg-slate-100 rounded text-xs text-slate-600">
                    <p>שדות עודכנו: {metrics.updatedFields} / {metrics.expectedFields}</p>
                    <p>סטטוס שמירה: {metrics.saveStatus}</p>
                    {metrics.durationMs !== undefined && <p>זמן ריצה: {metrics.durationMs}ms</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Calendar size={18} />
            <span className="text-sm font-bold">תקופת פעילות</span>
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
                      dateValue = new Date(session.date);
                    }
                    
                    if (isNaN(dateValue.getTime())) {
                      return 'תאריך לא תקין';
                    }
                    
                    return dateValue.toLocaleDateString('he-IL');
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
