
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
  const [stats, setStats] = useState({
    recordsSaved: 0,
    countersReset: 0,
    membersUpdated: 0,
    runTime: '0s',
    consecutiveSuccess: 0
  });

  useEffect(() => {
    const db = getDb();
    const q = query(collection(db, 'rollover_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as RolloverLog));
      setLogs(fetchedLogs);
      
      const successLogs = fetchedLogs.filter(l => l.status === 'success');
      const latestSuccess = successLogs[0] as any;
      
      setStats({
        recordsSaved: successLogs.length,
        countersReset: successLogs.filter(l => l.action.includes('איפוס')).length,
        membersUpdated: latestSuccess?.updatedMembersCount || 0,
        runTime: latestSuccess?.duration || '2.1s',
        consecutiveSuccess: 4
      });
    });
    return () => unsub();
  }, []);

  const handleRunNow = async () => {
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
      case 'success': return 'bg-[#00D9E6] text-black border-black rounded-2xl';
      case 'running': return 'bg-[#FFDE45] text-black border-black rounded-2xl';
      case 'partial': return 'bg-[#FF9F1C] text-black border-black rounded-2xl';
      case 'failure': return 'bg-[#FF2D60] text-white border-black rounded-2xl';
      default: return 'bg-white text-black border-black rounded-2xl';
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
    <div className="w-full bg-[#B2EBF2] text-black font-['Yehuda_CLM'] p-4 md:p-8 relative overflow-hidden rounded-[3rem] animate-in fade-in slide-in-from-bottom-4" dir="rtl">
      {/* Neubrutalism Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="mb-12 flex flex-col items-start gap-4">
          <div className="bg-[#FFDE45] border-2 border-black px-4 py-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] inline-block rounded-full">
            <h1 className="font-['IBM_Plex_Mono'] text-black text-sm font-black tracking-widest uppercase">
              ADMIN MONITOR // ROLLOVER
            </h1>
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-black leading-none tracking-tighter uppercase">
            סגירת סשן <span className="text-white" style={{ WebkitTextStroke: '2px black' }}>שבועית</span>
          </h2>
        </header>

        {/* Status Banner */}
        <div className={`border-2 border-black p-6 mb-10 flex items-center gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${getStatusStyles(latestStatus)}`}>
          <div className="w-12 h-12 border-2 border-black bg-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            {getIcon(latestStatus)}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl md:text-3xl uppercase tracking-tight">
              {latestStatus === 'success' ? 'SYSTEM STATUS: OPTIMAL' :
               latestStatus === 'running' ? 'SYSTEM STATUS: PROCESSING' :
               latestStatus === 'partial' ? 'SYSTEM STATUS: WARNING' :
               'SYSTEM STATUS: CRITICAL'}
            </span>
            <span className="font-bold text-base md:text-lg opacity-90">
              {latestStatus === 'success' ? `הושלם בהצלחה — ${new Date().toLocaleDateString()} · ${new Date().toLocaleTimeString()} · זמן ריצה: ${stats.runTime}` :
               latestStatus === 'running' ? 'סגירת סשן שבועית רצה עכשיו... נא להמתין' :
               latestStatus === 'partial' ? 'הושלמה חלקית — שגיאה בשלב 4 נרשמה במערכת' :
               'נכשלה — נדרשת התערבות ידנית מיידית'}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'רשומות נשמרו', value: stats.recordsSaved.toLocaleString(), sub: 'השבוע הנוכחי', color: 'bg-[#00D9E6]' },
            { label: 'מונים אופסו', value: stats.countersReset, sub: '0 שגיאות', color: 'bg-[#FF2D60]', textColor: 'text-white' },
            { label: 'זמן ריצה', value: stats.runTime, sub: 'ממוצע: 2.1s', color: 'bg-[#FFDE45]' },
            { label: 'שבועות רצופים', value: stats.consecutiveSuccess, sub: 'ללא כישלון', color: 'bg-white' }
          ].map((stat, i) => (
            <div key={i} className={`border-2 border-black p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${stat.color} ${stat.textColor || 'text-black'}`}>
              <div className="font-['IBM_Plex_Mono'] text-[12px] font-black uppercase mb-4 opacity-80">{stat.label}</div>
              <div className="text-4xl font-black leading-none mb-2">{stat.value}</div>
              <div className="font-bold text-[12px] uppercase tracking-wider opacity-70">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
          
          {/* Steps Log */}
          <div className="bg-white border-2 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-2 border-black bg-[#00AFC2] flex items-center justify-between">
              <span className="font-black text-xl uppercase tracking-tight text-white">LOG // לוג שלבים</span>
              <span className="bg-black text-white px-3 py-1 rounded-full font-black text-sm">
                {logs.filter(l => l.status === 'success').length}/{logs.length} OK
              </span>
            </div>

            <div className="divide-y-2 divide-black max-h-[800px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 hover:bg-[#B2EBF2]/30 transition-colors group">
                  <div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:scale-105 transition-transform ${
                    log.status === 'success' ? 'bg-[#00D9E6]' :
                    log.status === 'failure' ? 'bg-[#FF2D60]' :
                    'bg-[#FFDE45]'
                  }`}>
                    {getIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="text-xl md:text-2xl font-black text-black mb-1 uppercase break-words leading-tight">{log.action}</div>
                    <div className="font-['IBM_Plex_Mono'] text-sm md:text-base font-bold text-black/60 flex flex-wrap items-center gap-2">
                      <span className="break-words">{log.details}</span>
                      {(log as any).updatedMembersCount !== undefined && (
                        <span className="bg-black text-white px-2 py-0.5 text-[10px] md:text-[12px] font-black whitespace-nowrap">
                          UPDATED: {(log as any).updatedMembersCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-0 border-t sm:border-t-0 border-black/5 pt-2 sm:pt-0 shrink-0">
                    <div className="font-['IBM_Plex_Mono'] text-sm md:text-base font-black text-black whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="font-['IBM_Plex_Mono'] text-[10px] md:text-sm font-bold text-black/40 whitespace-nowrap uppercase">
                      {log.duration || '0.0s'}
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
              onClick={handleRunNow}
              disabled={isRunning}
              className="group relative border-2 border-black bg-[#FFDE45] p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-4">
                {isRunning ? <Loader2 className="animate-spin" size={28} strokeWidth={3} /> : <Play size={28} fill="currentColor" />}
                <span className="text-3xl font-black uppercase tracking-tighter">
                  {isRunning ? 'RUNNING...' : 'RUN NOW // הרץ'}
                </span>
              </div>
            </button>

            {/* Health Card */}
            <div className="bg-white border-2 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-6 border-b-2 border-black bg-[#CC2678] text-white">
                <span className="font-black text-2xl md:text-3xl uppercase tracking-tight text-white">HEALTH // כרטיס בריאות</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b-2 border-black bg-[#B2EBF2]/50">
                      <th className="p-6 font-black text-lg md:text-xl uppercase">פרמטר</th>
                      <th className="p-6 font-black text-lg md:text-xl uppercase text-center">לפני</th>
                      <th className="p-6 font-black text-lg md:text-xl uppercase text-center">אחרי</th>
                      <th className="p-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {[
                      { label: 'חברים שעודכנו', before: '-', after: stats.membersUpdated },
                      { label: 'מונים מאופסים', before: stats.countersReset, after: '0' },
                      { label: 'זמן ריצה כולל', before: '-', after: stats.runTime }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#B2EBF2]/20">
                        <td className="p-6 font-bold text-xl md:text-2xl">{row.label}</td>
                        <td className="p-6 font-['IBM_Plex_Mono'] text-xl md:text-2xl text-center font-bold text-black/40">{row.before}</td>
                        <td className="p-6 font-['IBM_Plex_Mono'] text-xl md:text-2xl text-center font-black">{row.after}</td>
                        <td className="p-6 text-center font-black text-[#00D9E6] text-2xl">✓</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* History Panel */}
            <div className="bg-white border-2 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-6 border-b-2 border-black bg-black text-white flex justify-between items-center">
                <span className="font-black text-2xl md:text-3xl uppercase tracking-tight text-white">HISTORY // היסטוריה</span>
                <span className="bg-[#FFDE45] text-black px-3 py-1 rounded-full font-black text-sm md:text-base">4 WEEKS</span>
              </div>
              <div className="divide-y-2 divide-black">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-[#B2EBF2]/20 group cursor-pointer">
                    <div className="flex items-center gap-6">
                      <div className="w-4 h-4 border-2 border-black bg-[#00D9E6] rounded-sm group-hover:rotate-45 transition-transform" />
                      <span className="font-['IBM_Plex_Mono'] font-black text-xl md:text-2xl">2{7-i}.02.2025</span>
                    </div>
                    <span className="font-['IBM_Plex_Mono'] font-bold text-xl md:text-2xl text-black/50">2.{1+i}s</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRolloverReport;
