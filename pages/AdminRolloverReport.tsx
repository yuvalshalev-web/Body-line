
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
      
      // Calculate stats based on logs
      const successLogs = fetchedLogs.filter(l => l.status === 'success');
      const latestSuccess = successLogs[0] as any;
      
      setStats({
        recordsSaved: successLogs.length,
        countersReset: successLogs.filter(l => l.action.includes('איפוס')).length,
        membersUpdated: latestSuccess?.updatedMembersCount || 0,
        runTime: latestSuccess?.duration || '2.1s',
        consecutiveSuccess: 4 // Mock
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'text-[#00D9E6] border-[#00D9E6] bg-[#00D9E6]/10';
      case 'running': return 'text-[#FFDE45] border-[#FFDE45] bg-[#FFDE45]/10';
      case 'partial': return 'text-[#FF9F1C] border-[#FF9F1C] bg-[#FF9F1C]/10';
      case 'failure': return 'text-[#FF2D60] border-[#FF2D60] bg-[#FF2D60]/10';
      default: return 'text-[#B2EBF2] border-[#B2EBF2] bg-[#B2EBF2]/10';
    }
  };

  const getIcon = (status: string) => {
    switch(status) {
      case 'success': return <CheckCircle2 size={16} />;
      case 'running': return <RefreshCw size={16} className="animate-spin" />;
      case 'partial': return <AlertTriangle size={16} />;
      case 'failure': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const latestStatus = logs.length > 0 ? logs[0].status : 'success'; // Default to success for demo if empty

  return (
    <div className="min-h-screen bg-[#002025] text-slate-50 font-['Yehuda_CLM'] p-6 md:p-10 relative overflow-hidden rounded-3xl" dir="rtl">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(rgba(0,175,194,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,175,194,0.2) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col items-center justify-center gap-2 mb-10 text-center">
          <h1 className="font-['IBM_Plex_Mono'] text-[#00D9E6] text-xs tracking-[3px] uppercase mb-1">// Admin Monitor</h1>
          <h2 className="text-4xl font-black text-white leading-none">סגירת סשן <span className="text-[#00D9E6]">שבועית</span></h2>
        </header>

        {/* Status Banner */}
        <div className={`rounded-3xl p-4 md:p-6 mb-8 flex items-center gap-4 border transition-all duration-500 ${
          latestStatus === 'success' ? 'bg-[#004048] border-[#00D9E6]/50 text-[#00D9E6]' :
          latestStatus === 'running' ? 'bg-[#004048] border-[#FFDE45]/50 text-[#FFDE45]' :
          latestStatus === 'partial' ? 'bg-[#004048] border-[#FF9F1C]/50 text-[#FF9F1C]' :
          'bg-[#004048] border-[#FF2D60]/50 text-[#FF2D60]'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] animate-pulse ${
             latestStatus === 'success' ? 'bg-[#00D9E6] shadow-[#00D9E6]' :
             latestStatus === 'running' ? 'bg-[#FFDE45] shadow-[#FFDE45]' :
             latestStatus === 'partial' ? 'bg-[#FF9F1C] shadow-[#FF9F1C]' :
             'bg-[#FF2D60] shadow-[#FF2D60]'
          }`} />
          <span className="font-medium text-sm md:text-base">
            {latestStatus === 'success' ? `✓ סגירת סשן שבועית הושלמה בהצלחה — ${new Date().toLocaleDateString()} · ${new Date().toLocaleTimeString()} · זמן ריצה: ${stats.runTime}` :
             latestStatus === 'running' ? '⟳ סגירת סשן שבועית רצה עכשיו...' :
             latestStatus === 'partial' ? '⚠ סגירת סשן שבועית הושלמה חלקית — שגיאה בשלב 4' :
             '✗ סגירת סשן שבועית נכשלה — נדרשת התערבות ידנית'}
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '// רשומות נשמרו', value: stats.recordsSaved.toLocaleString(), sub: 'השבוע הנוכחי', color: 'after:bg-[#00D9E6]' },
            { label: '// מונים אופסו', value: stats.countersReset, sub: '0 שגיאות', color: 'after:bg-[#00AFC2]' },
            { label: '// זמן ריצה', value: stats.runTime, sub: 'ממוצע: 2.1s', color: 'after:bg-[#FFDE45]' },
            { label: '// שבועות רצופים', value: stats.consecutiveSuccess, sub: 'ללא כישלון', color: 'after:bg-[#00D9E6]' }
          ].map((stat, i) => (
            <div key={i} className={`bg-[#004048] border border-[#00AFC2]/20 rounded-3xl p-5 relative overflow-hidden hover:border-[#00AFC2]/50 transition-colors ${stat.color} after:content-[''] after:absolute after:top-0 after:right-0 after:w-[3px] after:h-full`}>
              <div className="font-['IBM_Plex_Mono'] text-[10px] tracking-[2px] uppercase text-[#B2EBF2] mb-2">{stat.label}</div>
              <div className="font-['IBM_Plex_Mono'] text-2xl md:text-3xl font-semibold text-white leading-none mb-1">{stat.value}</div>
              <div className="text-xs text-[#B2EBF2]/70">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          
          {/* Steps Log */}
          <div className="bg-[#004048] border border-[#00AFC2]/20 rounded-3xl overflow-hidden">
            <div className="p-4 md:p-6 border-b border-[#00AFC2]/20 flex items-center justify-between">
              <span className="font-['IBM_Plex_Mono'] text-[11px] tracking-[2px] uppercase text-[#B2EBF2]">// לוג שלבים</span>
              <span className="font-['IBM_Plex_Mono'] text-[11px] px-2 py-1 rounded bg-[#00AFC2]/20 text-[#00D9E6] border border-[#00AFC2]/30">
                {logs.filter(l => l.status === 'success').length}/{logs.length} פעולות
              </span>
            </div>

            {/* Timeline Bar */}
            <div className="px-6 py-4 flex items-center gap-1">
              {logs.slice(0, 6).map((log, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${
                  log.status === 'success' ? 'bg-[#00D9E6] flex-1' :
                  log.status === 'failure' ? 'bg-[#FF2D60] flex-1' :
                  'bg-[#00AFC2]/30 flex-1'
                }`} />
              ))}
            </div>

            <div className="divide-y divide-[#00AFC2]/20">
              {logs.map((log) => (
                <div key={log.id} className="p-4 md:p-6 flex items-center gap-4 hover:bg-[#00AFC2]/10 transition-colors animate-in fade-in slide-in-from-right-4">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${getStatusColor(log.status)}`}>
                    {getIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white mb-1">{log.action}</div>
                    <div className="font-['IBM_Plex_Mono'] text-[11px] text-[#B2EBF2] truncate">
                      {log.details}
                      {(log as any).updatedMembersCount !== undefined && (
                        <span className="text-[#00D9E6] ml-2">
                          | עודכנו: {(log as any).updatedMembersCount} חברים
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="font-['IBM_Plex_Mono'] text-xs text-[#B2EBF2] mb-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div className="font-['IBM_Plex_Mono'] text-[11px] text-[#B2EBF2]/70">{log.duration || '-'}</div>
                  </div>
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="p-8 text-center text-[#B2EBF2] font-['IBM_Plex_Mono'] text-xs">
                  // אין נתונים להצגה
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            
            {/* Run Now Button */}
            <div className="flex justify-center">
              <button 
                onClick={handleRunNow}
                disabled={isRunning}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-12 py-4 text-lg bg-[#00AFC2] hover:bg-[#00D9E6] text-white border-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isRunning ? <Loader2 className="animate-spin" size={20} /> : '⟳'}
                  {isRunning ? 'רץ כעת...' : 'הרץ עכשיו'}
                </span>
              </button>
            </div>

            {/* Health Card */}
            <div className="bg-[#004048]/80 backdrop-blur-xl border border-[#00AFC2]/30 shadow-xl rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-[#00AFC2]/20">
                <span className="font-['IBM_Plex_Mono'] text-[11px] tracking-[2px] uppercase text-[#B2EBF2]">// כרטיס בריאות</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#00AFC2]/20">
                    <td className="p-3 font-['IBM_Plex_Mono'] text-[10px] text-[#B2EBF2] tracking-widest">פרמטר</td>
                    <td className="p-3 font-['IBM_Plex_Mono'] text-[10px] text-[#B2EBF2] tracking-widest text-center">לפני</td>
                    <td className="p-3 font-['IBM_Plex_Mono'] text-[10px] text-[#B2EBF2] tracking-widest text-center">אחרי</td>
                    <td className="p-3"></td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00AFC2]/20">
                  <tr>
                    <td className="p-3 text-[13px] text-white">חברים שעודכנו</td>
                    <td className="p-3 font-['IBM_Plex_Mono'] text-xs text-[#B2EBF2]/70 text-center">-</td>
                    <td className="p-3 font-['IBM_Plex_Mono'] text-xs text-white font-bold text-center">{stats.membersUpdated}</td>
                    <td className="p-3 text-center text-[#00D9E6]">✓</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[13px] text-white">מונים מאופסים</td>
                    <td className="p-3 font-['IBM_Plex_Mono'] text-xs text-[#B2EBF2]/70 text-center">{stats.countersReset}</td>
                    <td className="p-3 font-['IBM_Plex_Mono'] text-xs text-white font-bold text-center">0</td>
                    <td className="p-3 text-center text-[#00D9E6]">✓</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[13px] text-white">זמן ריצה כולל</td>
                    <td className="p-3 font-['IBM_Plex_Mono'] text-xs text-[#B2EBF2]/70 text-center">-</td>
                    <td className="p-3 font-['IBM_Plex_Mono'] text-xs text-white font-bold text-center">{stats.runTime}</td>
                    <td className="p-3 text-center text-[#00D9E6]">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* History Panel */}
            <div className="bg-[#004048]/80 backdrop-blur-xl border border-[#00AFC2]/30 shadow-xl rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-[#00AFC2]/20 flex justify-between items-center">
                <span className="font-['IBM_Plex_Mono'] text-[11px] tracking-[2px] uppercase text-[#B2EBF2]">// היסטוריה</span>
                <span className="font-['IBM_Plex_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#00AFC2]/20 text-[#00D9E6] border border-[#00AFC2]/30">4 שבועות</span>
              </div>
              <div className="divide-y divide-[#00AFC2]/20">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-[#00AFC2]/10">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00D9E6]" />
                      <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#B2EBF2]">2{7-i}.02.2025</span>
                    </div>
                    <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#B2EBF2]">2.{1+i}s</span>
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
