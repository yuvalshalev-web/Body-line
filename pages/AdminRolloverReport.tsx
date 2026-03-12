
import React, { useEffect, useState, useMemo } from 'react';
import { getDb } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useData } from '../contexts/DataContext';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, Clock, Database, Save, Activity } from 'lucide-react';

interface RolloverLog {
  id: string;
  action: string;
  status: 'success' | 'failure' | 'running' | 'partial';
  details: string;
  duration?: string;
  timestamp: string;
  pct?: number;
}

const AdminRolloverReport: React.FC = () => {
  const { finalizeThursdaySession } = useData();
  const [logs, setLogs] = useState<RolloverLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState({
    recordsSavedThisWeek: 0,
    avgRecordsSaved: 0,
    errorsThisWeek: 0,
    avgErrors: 0,
    lastRunTime: '0s',
    avgRunTime: '0s',
    successRate: 0,
    membersUpdated: 0,
    countersReset: '0',
    runTime: '0s'
  });

  useEffect(() => {
    const db = getDb();
    const q = query(collection(db, 'rollover_logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as RolloverLog));
      setLogs(fetchedLogs);
      
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const logsThisYear = fetchedLogs.filter(l => new Date(l.timestamp) >= startOfYear);
      const logsThisWeek = fetchedLogs.filter(l => new Date(l.timestamp) >= startOfWeek);

      const successLogsThisYear = logsThisYear.filter(l => l.status === 'success');
      const totalRecordsSavedThisYear = successLogsThisYear.reduce((acc, l) => acc + ((l as any).updatedMembersCount || 0), 0);
      const weeksPassed = Math.max(1, Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)));

      const recordsSavedThisWeek = logsThisWeek.filter(l => l.status === 'success').reduce((acc, l) => acc + ((l as any).updatedMembersCount || 0), 0);
      
      const errorsThisWeek = logsThisWeek.filter(l => l.status === 'failure').length;
      const totalErrorsThisYear = logsThisYear.filter(l => l.status === 'failure').length;

      const latestSuccess = successLogsThisYear[0] as any;
      const lastRunTime = latestSuccess?.duration || '0s';
      const totalRunTimeThisYear = successLogsThisYear.reduce((acc, l) => acc + parseFloat(l.duration || '0'), 0);
      const avgRunTime = successLogsThisYear.length > 0 ? (totalRunTimeThisYear / successLogsThisYear.length).toFixed(1) + 's' : '0s';

      const successRate = logsThisYear.length > 0 ? (successLogsThisYear.length / logsThisYear.length) * 100 : 0;
      
      setStats({
        recordsSavedThisWeek,
        avgRecordsSaved: totalRecordsSavedThisYear / weeksPassed,
        errorsThisWeek,
        avgErrors: totalErrorsThisYear / weeksPassed,
        lastRunTime,
        avgRunTime,
        successRate,
        membersUpdated: 0,
        countersReset: '0',
        runTime: '0s'
      });
    });
    return () => unsub();
  }, []);

  const handleRunNow = async () => {
    setShowConfirm(false);
    setIsRunning(true);
    try {
      await finalizeThursdaySession();
    } catch (error) {
      console.error("Manual run failed", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch(status) {
      case 'success': return 'bg-[#7A1555] text-white rounded-2xl';
      case 'running': return 'bg-[#FFDE45] text-black rounded-2xl';
      case 'partial': return 'bg-[#FF9F1C] text-black rounded-2xl';
      case 'failure': return 'bg-[#FF2D60] text-white rounded-2xl';
      default: return 'bg-white text-black rounded-2xl';
    }
  };

  const getIcon = (status: string) => {
    switch(status) {
      case 'success': return <CheckCircle2 size={20} strokeWidth={3} />;
      case 'running': return <RefreshCw size={20} strokeWidth={3} className="animate-spin" />;
      case 'partial': return <AlertTriangle size={20} strokeWidth={3} />;
      case 'failure': return <XCircle size={20} strokeWidth={3} />;
      default: return <Clock size={20} strokeWidth={3} />;
    }
  };

  const latestStatus = logs.length > 0 ? logs[0].status : 'success';

  return (
    <div className="w-full bg-[#F5F5F0] text-black font-['Yehuda_CLM'] p-4 md:p-8 relative overflow-hidden rounded-[3rem] animate-in fade-in slide-in-from-bottom-4" dir="rtl">
      {/* Grid Pattern Removed */}
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="mb-12 flex flex-col items-start gap-4">
          <div className="bg-[#FFDE45] px-4 py-1 inline-block rounded-full">
            <h1 className="font-['IBM_Plex_Mono'] text-black text-sm font-black tracking-widest uppercase">
              ADMIN MONITOR // ROLLOVER
            </h1>
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-black leading-none tracking-tighter uppercase">
            סגירת סשן <span className="text-white" style={{ WebkitTextStroke: '2px black' }}>שבועית</span>
          </h2>
        </header>

        {/* Status Banner */}
        <div className={`p-6 mb-10 flex items-center gap-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg ${getStatusStyles(latestStatus)}`}>
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#7A1555]">
            {getIcon(latestStatus)}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl md:text-3xl uppercase tracking-tight text-[#333333]">
              {latestStatus === 'success' ? 'SYSTEM STATUS: OPTIMAL' :
               latestStatus === 'running' ? 'SYSTEM STATUS: PROCESSING' :
               latestStatus === 'partial' ? 'SYSTEM STATUS: WARNING' :
               'SYSTEM STATUS: CRITICAL'}
            </span>
            <span className="font-bold text-base md:text-lg text-[#333333]">
              {latestStatus === 'success' ? `הושלם בהצלחה — ${new Date().toLocaleDateString()} · ${new Date().toLocaleTimeString()} · זמן ריצה: ${stats.lastRunTime}` :
               latestStatus === 'running' ? 'סגירת סשן שבועית רצה עכשיו... נא להמתין' :
               latestStatus === 'partial' ? 'הושלמה חלקית — שגיאה בשלב 4 נרשמה במערכת' :
               'נכשלה — נדרשת התערבות ידנית מיידית'}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'רשומות שנשמרו', value: stats.recordsSavedThisWeek.toLocaleString(), sub: `ממוצע: ${stats.avgRecordsSaved.toFixed(1)}`, color: 'bg-white' },
            { label: 'שגיאות (שבוע)', value: stats.errorsThisWeek.toString(), sub: `ממוצע: ${stats.avgErrors.toFixed(1)}`, color: 'bg-white' },
            { label: 'זמן ריצה', value: stats.lastRunTime, sub: `ממוצע: ${stats.avgRunTime}`, color: 'bg-white' },
            { label: 'אחוז הצלחה', value: `${stats.successRate.toFixed(0)}%`, sub: 'מתחילת השנה', color: 'bg-white' }
          ].map((stat, i) => (
            <div key={i} className={`backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-lg transition-all ${stat.color}`}>
              <div className="font-['IBM_Plex_Mono'] text-[12px] font-black uppercase mb-4 text-[#7A1555]">{stat.label}</div>
              <div className="text-4xl font-black leading-none mb-2 text-[#000000]">{stat.value}</div>
              <div className="font-bold text-[12px] uppercase tracking-wider text-[#000000]/70">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
          
          {/* Steps Log */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-black/10 bg-[#7A1555]/5 flex items-center justify-between">
              <span className="font-black text-xl uppercase tracking-tight text-[#7A1555]">LOG // לוג שלבים</span>
              <span className="bg-[#7A1555] text-[#FBC02D] px-3 py-1 rounded-full font-black text-sm">
                {logs.filter(l => l.status === 'success').length}/{logs.length} OK
              </span>
            </div>

            <div className="p-6 border-b border-black/10 bg-white">
              <h3 className="font-black text-lg uppercase mb-4 text-[#7A1555]">רשומות שנשמרו</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'members', label: 'עדכון חברים' },
                  { id: 'sessions', label: 'סגירת סשנים' },
                  { id: 'stats', label: 'חישוב סטטיסטיקות' },
                  { id: 'archive', label: 'ארכיון שבועי' }
                ].map((record) => {
                  const isDone = logs.some(l => l.action.includes(record.label) && l.status === 'success');
                  return (
                    <div key={record.id} className="flex items-center gap-3 p-3 bg-[#F5F5F0] border border-black/10 rounded-xl">
                      <div className={`w-6 h-6 border border-black/20 rounded flex items-center justify-center ${isDone ? 'bg-[#7A1555]' : 'bg-white'}`}>
                        {isDone && <CheckCircle2 size={16} className="text-[#FBC02D]" />}
                      </div>
                      <span className="font-bold text-sm text-[#000000]">{record.label}</span>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-black text-lg uppercase mb-4 text-[#7A1555]">מונים אופסו</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'daily_limit', label: 'מכסה יומית' },
                  { id: 'weekly_limit', label: 'מכסה שבועית' },
                  { id: 'session_count', label: 'ספירת סשנים' },
                  { id: 'points_reset', label: 'איפוס נקודות' }
                ].map((counter) => {
                  const isDone = logs.some(l => l.action.includes('איפוס') && l.details.includes(counter.label) && l.status === 'success');
                  return (
                    <div key={counter.id} className="flex items-center gap-3 p-3 bg-[#F5F5F0] border border-black/10 rounded-xl">
                      <div className={`w-6 h-6 border border-black/20 rounded flex items-center justify-center ${isDone ? 'bg-[#7A1555]' : 'bg-white'}`}>
                        {isDone && <CheckCircle2 size={16} className="text-[#FBC02D]" />}
                      </div>
                      <span className="font-bold text-sm text-[#000000]">{counter.label}</span>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-black text-lg uppercase mb-4 text-[#7A1555]">סטטיסטיקות מעודכנות</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'avg_session', label: 'ממוצע סשנים' },
                  { id: 'grit_score', label: 'מדד Grit' },
                  { id: 'active_members', label: 'חברים פעילים' },
                  { id: 'session_duration', label: 'משך סשן ממוצע' }
                ].map((stat) => {
                  const log = logs.find(l => l.action.includes(stat.label) || l.details.includes(stat.label));
                  const isSuccess = log?.status === 'success';
                  const isFailure = log?.status === 'failure';
                  
                  return (
                    <div key={stat.id} className="flex items-center gap-3 p-3 bg-[#F5F5F0] border border-black/10 rounded-xl">
                      <div className={`w-6 h-6 border border-black/20 rounded flex items-center justify-center ${isSuccess ? 'bg-[#7A1555]' : isFailure ? 'bg-[#FF2D60]' : 'bg-white'}`}>
                        {isSuccess && <CheckCircle2 size={16} className="text-[#FBC02D]" />}
                        {isFailure && <XCircle size={16} className="text-[#FBC02D]" />}
                      </div>
                      <span className="font-bold text-sm text-[#000000]">{stat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-black/10 max-h-[800px] overflow-y-auto">
              <div className="h-8 bg-[#F5F5F0]/50 border-b border-black/5"></div>
              <h4 className="p-4 font-black text-[#7A1555] uppercase bg-[#F5F5F0]">סגירת סשן (Finalize)</h4>
              {logs.filter(l => l.action === 'FINALIZETHURSDAYSESSION').map((log) => (
                <div key={log.id} className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 hover:bg-[#F5F5F0] transition-colors group">
                  <div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${
                    log.status === 'success' ? 'bg-[#7A1555]' :
                    log.status === 'failure' ? 'bg-[#FF2D60]' :
                    'bg-[#FFDE45]'
                  }`}>
                    {getIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="text-xl md:text-2xl font-black text-black mb-1 uppercase break-words leading-tight">
                      סגירת סשן יום חמישי
                    </div>
                    <div className="font-['IBM_Plex_Mono'] text-sm md:text-base font-bold text-black/60 flex flex-wrap items-center gap-2">
                      <span className="break-words">
                        {log.details.replace('Archived session with', 'סשן הועבר לארכיון עם').replace('attendees', 'משתתפים')}
                      </span>
                      {(log as any).updatedMembersCount !== undefined && (
                        <span className="bg-black text-[#FBC02D] px-2 py-0.5 text-[12px] font-black whitespace-nowrap">
                          עודכנו: {(log as any).updatedMembersCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-0 border-t sm:border-t-0 border-black/5 pt-2 sm:pt-0 shrink-0">
                    <div className="font-['IBM_Plex_Mono'] text-sm md:text-base font-black text-black whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('he-IL')}
                    </div>
                    <div className="font-['IBM_Plex_Mono'] text-sm md:text-base font-black text-black whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              <div className="h-8 bg-[#F5F5F0]/50 border-y border-black/5"></div>

              <h4 className="p-4 font-black text-[#7A1555] uppercase bg-[#F5F5F0] border-t border-black/10">מערכת ועדכונים</h4>
              {logs.filter(l => l.action !== 'FINALIZETHURSDAYSESSION').map((log) => (
                <div key={log.id} className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 hover:bg-[#F5F5F0] transition-colors group">
                  <div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${
                    log.status === 'success' ? 'bg-[#7A1555]' :
                    log.status === 'failure' ? 'bg-[#FF2D60]' :
                    'bg-[#FFDE45]'
                  }`}>
                    {getIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="text-xl md:text-2xl font-black text-black mb-1 uppercase break-words leading-tight">
                      {log.action}
                    </div>
                    <div className="font-['IBM_Plex_Mono'] text-sm md:text-base font-bold text-black/60 flex flex-wrap items-center gap-2">
                      <span className="break-words">{log.details}</span>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-0 border-t sm:border-t-0 border-black/5 pt-2 sm:pt-0 shrink-0">
                    <div className="font-['IBM_Plex_Mono'] text-sm md:text-base font-black text-black whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('he-IL')}
                    </div>
                    <div className="font-['IBM_Plex_Mono'] text-sm md:text-base font-black text-black whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="p-12 text-center font-black text-3xl text-black/20 uppercase italic">
                  NO DATA AVAILABLE // אין נתונים
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="flex flex-col gap-8">
            
            {/* Run Now Button */}
            <button 
              onClick={() => setShowConfirm(true)}
              disabled={isRunning}
              className="group relative border-2 border-black bg-[#FFDE45] p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-4">
                {isRunning ? <Loader2 className="animate-spin" size={28} strokeWidth={3} /> : <Play size={28} fill="currentColor" />}
                <span className="text-3xl font-black uppercase tracking-tighter">
                  {isRunning ? 'RUNNING...' : 'הרצה ידנית'}
                </span>
              </div>
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                <div className="bg-[#FFD700] border-4 border-black p-8 rounded-3xl shadow-[0_0_40px_rgba(255,215,0,0.6)] max-w-md w-full text-center">
                  <h2 className="text-5xl font-black uppercase mb-6 tracking-tighter text-black">עצור!</h2>
                  <p className="text-xl font-black mb-8 leading-relaxed text-black">
                    לחיצה על 'הרץ עכשיו' כרגע היא כמו לזרוק רימון הלם ליציע של לה פמיליה: זה יסתיים בבלגן אטומי, הרבה רעש ועצורים (במערכת). האם אתה מרגיש בר מזל היום?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="border-2 border-black p-4 rounded-xl font-black uppercase hover:bg-black/10 text-black"
                    >
                      לא, החזר את הניצרה
                    </button>
                    <button 
                      onClick={handleRunNow}
                      className="border-2 border-black p-4 rounded-xl font-black uppercase bg-black text-[#FFD700] hover:bg-black/90"
                    >
                      כן, זרוק!
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Health Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-black/10 bg-[#7A1555]/5">
                <span className="font-black text-2xl md:text-3xl uppercase tracking-tight text-[#7A1555]">HEALTH // כרטיס בריאות</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-black/10 bg-[#F5F5F0]">
                      <th className="p-6 font-black text-lg md:text-xl uppercase text-[#7A1555]">פרמטר</th>
                      <th className="p-6 font-black text-lg md:text-xl uppercase text-center text-[#7A1555]">לפני</th>
                      <th className="p-6 font-black text-lg md:text-xl uppercase text-center text-[#7A1555]">אחרי</th>
                      <th className="p-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {[
                      { label: 'חברים שעודכנו', before: '-', after: stats.membersUpdated },
                      { label: 'מונים מאופסים', before: stats.countersReset, after: '0' },
                      { label: 'זמן ריצה כולל', before: '-', after: stats.runTime }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#F5F5F0]">
                        <td className="p-6 font-bold text-xl md:text-2xl text-[#000000]">{row.label}</td>
                        <td className="p-6 font-['IBM_Plex_Mono'] text-xl md:text-2xl text-center font-bold text-[#000000]/40">{row.before}</td>
                        <td className="p-6 font-['IBM_Plex_Mono'] text-xl md:text-2xl text-center font-black text-[#7A1555]">{row.after}</td>
                        <td className="p-6 text-center font-black text-[#7A1555] text-2xl">✓</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* History Panel */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-black/10 bg-[#7A1555]/5 flex justify-between items-center">
                <span className="font-black text-2xl md:text-3xl uppercase tracking-tight text-[#7A1555]">HISTORY // היסטוריה</span>
                <span className="bg-[#7A1555] text-[#FBC02D] px-3 py-1 rounded-full font-black text-sm md:text-base">
                  {logs.filter(l => l.status === 'success').length} WEEKS
                </span>
              </div>
              <div className="divide-y divide-black/10">
                {logs.filter(l => l.status === 'success').slice(0, 4).map((log) => (
                  <div key={log.id} className="p-6 flex items-center justify-between hover:bg-[#F5F5F0] group cursor-pointer">
                    <div className="flex items-center gap-6">
                      <div className="w-4 h-4 border border-black/20 bg-[#7A1555] rounded-sm group-hover:rotate-45 transition-transform" />
                      <span className="font-['IBM_Plex_Mono'] font-black text-xl md:text-2xl text-[#000000]">
                        {new Date(log.timestamp).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <span className="font-['IBM_Plex_Mono'] font-bold text-xl md:text-2xl text-[#000000]/50">
                      {log.duration || '2.1s'}
                    </span>
                  </div>
                ))}
                {logs.filter(l => l.status === 'success').length === 0 && (
                  <div className="p-6 text-center font-bold text-[#000000]/40">אין נתוני היסטוריה</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRolloverReport;
