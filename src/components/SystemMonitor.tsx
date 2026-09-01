import React, { useEffect, useState, useMemo } from 'react';
import { safeLocalStorage } from '../utils/storage';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Server, Database, Activity, AlertCircle, Power, ShieldAlert, Info, RefreshCw, ArrowDown, ArrowUp, Skull, TriangleAlert, HeartPulse, Zap, Terminal, Filter, Search as SearchIcon, Clock, Wifi, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VercelStatusWidget from './admin/VercelStatusWidget';
import GitHubCommandCenter from './admin/GitHubCommandCenter';
import WorkflowVisualizer from './admin/WorkflowVisualizer';
import { getStorageSizeMB, recalculateStorageFromStorage, recalculateDatabaseSize } from '../utils/storageStats';
import { sessionReadCount, incrementReadCount, db, saveLogsToDatabase, loadLogsFromDatabase } from '../services/firebase';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { isAppShaperUser } from '../constants';
import { ReadOnlyNoticeModal } from './admin/ReadOnlyNoticeModal';
import { get24hBandwidth } from '../utils/bandwidthTracker';
import { getLogs, SystemLog, LogSeverity, clearLogs } from '../utils/systemLogs';
import { doc, onSnapshot, collection, getDocs, query, limit } from 'firebase/firestore';

interface CircularRingProps {
  value: number;
  label: string;
  sublabel: string;
  gradient: [string, string];
  ringClass?: string;
  animateClass?: string;
  isHigh?: boolean;
  mode?: 'classic' | 'neon';
}

const CircularRing: React.FC<CircularRingProps> = ({ 
  value, label, sublabel, gradient, ringClass, animateClass, isHigh, mode = 'classic'
}) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    const stepTime = duration / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);

  const offset = circumference - (value / 100) * circumference;
  const id = React.useId().replace(/:/g, '');

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${animateClass || ''}`}>
      <div className="relative w-44 h-44 flex items-center justify-center bg-white rounded-3xl shadow-sm border border-slate-100 group hover:border-sky-200 transition-all duration-500">
        <svg className="w-full h-full transform -rotate-90 p-4" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
            <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Background Ring (Track) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(241, 245, 249, 1)"
            strokeWidth="8"
            fill="transparent"
          />
          
          {/* Progress Ring (Fill) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={`url(#grad-${id})`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            filter={`url(#shadow-${id})`}
            className={`transition-all duration-1000 ease-out`}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-black text-slate-800 tracking-tight">
            {displayValue.toFixed(0)}%
          </span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {label}
          </span>
        </div>
      </div>
      <p className="text-xs font-bold text-slate-500 mt-5 tabular-nums uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 shadow-inner">
        {sublabel}
      </p>
    </div>
  );
};

// --- New Modular Components ---

/**
 * Data Health Score Card
 * Scans members collection for integrity issues.
 */
const DataHealthScore: React.FC<{ dbSize: number, storageSize: number }> = ({ dbSize, storageSize }) => {
  const { members } = useData();
  const [isScanning, setIsScanning] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [anomalies, setAnomalies] = useState<{ id: string, name: string, issue: string }[]>([]);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  const runScan = async () => {
    setIsScanning(true);
    // Artificial delay for "Scanning" feel and to prevent UI freeze
    await new Promise(resolve => setTimeout(resolve, 1500));

    let issues: { id: string, name: string, issue: string }[] = [];
    
    members.forEach(member => {
      // Check mandatory fields
      if (!member.firstName || !member.lastName || !member.mobile) {
        issues.push({
          id: member.id,
          name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'ללא שם',
          issue: 'חסרים שדות חובה'
        });
      }

      // Check Grit score anomalies (assuming grit is a number)
      const grit = (member as any).grit;
      if (grit !== undefined && (grit < 0 || grit > 100)) {
        issues.push({
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          issue: `ציון Grit לא תקין: ${grit}`
        });
      }
    });

    // Calculate score: Deduct 2 points per anomaly, min 0
    const calculatedScore = Math.max(0, 100 - (issues.length * 2));
    
    setHealthScore(calculatedScore);
    setAnomalies(issues.slice(0, 5)); // Show only top 5
    setLastScan(new Date());
    setIsScanning(false);

    // Cache result in safeLocalStorage
    safeLocalStorage.setItem('data_health_cache', JSON.stringify({
      score: calculatedScore,
      timestamp: new Date().toISOString(),
      anomalyCount: issues.length
    }));
  };

  useEffect(() => {
    const cached = safeLocalStorage.getItem('data_health_cache');
    if (cached) {
      const { score, timestamp } = JSON.parse(cached);
      setHealthScore(score);
      setLastScan(new Date(timestamp));
    }
  }, []);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">ציון בריאות נתונים</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">DATA INTEGRITY SCORE</p>
          </div>
        </div>
        <button 
          onClick={runScan}
          disabled={isScanning}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isScanning ? 'bg-slate-100 text-slate-400 animate-spin' : 'bg-slate-50 text-slate-600 hover:bg-gradient-to-r hover:from-sky-500 hover:to-indigo-500 hover:text-white shadow-sm hover:shadow-lg hover:shadow-sky-500/30 border border-slate-100'}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        {healthScore !== null ? (
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className={`text-7xl font-black tabular-nums tracking-tighter ${healthScore > 80 ? 'text-emerald-500' : healthScore > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                {healthScore}
              </div>
              <div className="absolute -top-2 -right-6 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                PTS
              </div>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {healthScore > 80 ? 'מצב מצוין' : healthScore > 50 ? 'נדרשת תשומת לב' : 'סכנת נתונים'}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 opacity-40">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center border-2 border-dashed border-slate-300">
              <Activity size={40} className="text-slate-400" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">לחץ לסריקת המערכת</p>
          </div>
        )}
      </div>

      {anomalies.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">אנומליות שנמצאו</p>
          <div className="space-y-2">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100 group hover:bg-rose-100 transition-all">
                <span className="text-xs font-bold text-slate-700">{anomaly.name}</span>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{anomaly.issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastScan && (
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
          <Clock size={12} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            סריקה אחרונה: {lastScan.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Quota Monitor Component
 * Real-time monitoring of Firebase Quotas.
 */
import { getMonthlyQuotaData } from '../utils/quotaStats';

// ... (inside SystemMonitor.tsx)

const QuotaChart = ({ data, dataKey, limit, title, color }: { data: any[], dataKey: string, limit: number, title: string, color: string }) => (
  <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-2xl transition-all hover:border-slate-200 group/chart">
    <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{title}</h4>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">DAILY USAGE METRIC</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
          מכסה: {limit.toLocaleString()}
        </span>
      </div>
    </div>
    <div className="h-[140px] w-full min-h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
            axisLine={false} 
            tickLine={false} 
            dy={10}
          />
          <YAxis 
            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
            domain={[0, limit]} 
            axisLine={false} 
            tickLine={false}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderRadius: '16px', 
              border: '1px solid #f1f5f9', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              padding: '12px'
            }}
            itemStyle={{ fontSize: '11px', fontWeight: '800', color: color }}
            labelStyle={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}
            cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill={`url(#gradient-${dataKey})`} 
            isAnimationActive={true}
          />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={3} 
            dot={{ r: 0, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const QuotaMonitor: React.FC = () => {
  const monthlyData = useMemo(() => getMonthlyQuotaData(), []);

  return (
    <div className="bg-white rounded-3xl p-8 relative overflow-hidden transition-all duration-500 border border-slate-200 shadow-sm hover:shadow-md">
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 shadow-sm border border-sky-100 group-hover:scale-110 transition-transform duration-500">
            <Zap size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">מכסות Firebase</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">MONTHLY QUOTA PROGRESS</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Monitoring</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QuotaChart data={monthlyData} dataKey="reads" limit={50000} title="קריאות מסמכים (Reads)" color="#0ea5e9" />
        <QuotaChart data={monthlyData} dataKey="writes" limit={20000} title="כתיבת מסמכים (Writes)" color="#10b981" />
        <QuotaChart data={monthlyData} dataKey="deletes" limit={20000} title="מחיקת מסמכים (Deletes)" color="#f43f5e" />
      </div>

      {/* Decorative background element */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
    </div>
  );
};

/**
 * Technical Logs Table
 * Interactive log table for system events.
 */
const TechnicalLogs: React.FC = () => {
  const { currentUser } = useAuth();
  const isAppShaper = isAppShaperUser(currentUser);
  const [showReadOnlyNotice, setShowReadOnlyNotice] = useState(false);

  const checkAppShaper = () => {
    if (!isAppShaper) {
      setShowReadOnlyNotice(true);
      return false;
    }
    return true;
  };

  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState<LogSeverity | 'All'>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshLogs = () => {
    setIsRefreshing(true);
    setLogs(getLogs());
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const copyToClipboard = (log: SystemLog) => {
    const textToCopy = `[${log.timestamp.toLocaleString('he-IL')}] ${log.severity} | ${log.source} | ${log.message} | ${log.details || ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  useEffect(() => {
    refreshLogs();
    const handleNewLog = () => refreshLogs();
    window.addEventListener('system-log-added', handleNewLog);
    return () => window.removeEventListener('system-log-added', handleNewLog);
  }, []);

  const filteredLogs = logs.filter(log => filter === 'All' || log.severity === filter);

  const getSeverityColor = (severity: LogSeverity) => {
    switch (severity) {
      case 'Critical': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Warning': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Info': return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'Security': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 relative overflow-hidden transition-all duration-500 border border-slate-200 shadow-sm hover:shadow-md">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
            <Terminal size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">יומן אירועים טכני</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">ADVANCED SYSTEM LOGS</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
            {(['All', 'Critical', 'Warning', 'Info', 'Security'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${
                  filter === s 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-100' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                {s === 'All' ? 'הכל' : s === 'Critical' ? 'קריטי' : s === 'Warning' ? 'אזהרה' : s === 'Info' ? 'מידע' : 'אבטחה'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                if (!checkAppShaper()) return;
                await saveLogsToDatabase(logs);
                clearLogs();
                refreshLogs();
              }}
              className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black hover:bg-rose-600 transition-all shadow-sm active:scale-95"
            >
              נקה ושמור
            </button>
            <button 
              onClick={async () => {
                const loadedLogs = await loadLogsFromDatabase();
                setLogs(loadedLogs);
              }}
              className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
            >
              טען אירועים
            </button>
            <button 
              onClick={refreshLogs}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-8 px-8 max-h-[500px] custom-scrollbar">
        <table className="w-full text-right border-separate border-spacing-y-3 relative">
          <thead className="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
              <th className="pb-4 px-6 text-right">זמן</th>
              <th className="pb-4 px-6 text-right">חומרה</th>
              <th className="pb-4 px-6 text-right">מקור</th>
              <th className="pb-4 px-6 text-right">הודעה</th>
              <th className="pb-4 px-6 text-right">פרטים</th>
            </tr>
          </thead>
          <tbody className="relative z-10">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((log) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group transition-all duration-300"
                >
                  <td className="py-4 px-6 bg-slate-50/50 group-hover:bg-slate-50 first:rounded-r-2xl border-y border-r border-slate-100 text-[11px] font-bold text-slate-500 tabular-nums transition-colors">
                    {log.timestamp.toLocaleTimeString('he-IL')}
                  </td>
                  <td className="py-4 px-6 bg-slate-50/50 group-hover:bg-slate-50 border-y border-slate-100 transition-colors">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-4 px-6 bg-slate-50/50 group-hover:bg-slate-50 border-y border-slate-100 text-[11px] font-black text-slate-700 transition-colors">
                    {log.source}
                  </td>
                  <td 
                    className="py-4 px-6 bg-slate-50/50 group-hover:bg-slate-100 border-y border-slate-100 text-[11px] font-bold text-slate-600 max-w-xs truncate cursor-pointer transition-colors relative"
                    onClick={() => copyToClipboard(log)}
                    title="לחץ להעתקת פרטי האירוע"
                  >
                    {log.message}
                    {copiedId === log.id && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-8 right-6 bg-slate-900 text-white text-[9px] px-3 py-1.5 rounded-xl font-black shadow-xl z-50 flex items-center gap-1.5"
                      >
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        הועתק!
                      </motion.span>
                    )}
                  </td>
                  <td 
                    className="py-4 px-6 bg-slate-50/50 group-hover:bg-slate-100 last:rounded-l-2xl border-y border-l border-slate-100 text-[10px] font-medium text-slate-400 font-mono cursor-pointer transition-colors"
                    onClick={() => copyToClipboard(log)}
                    title="לחץ להעתקת פרטי האירוע"
                  >
                    {log.details || '-'}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {filteredLogs.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100">
              <Filter size={36} />
            </div>
            <h4 className="text-lg font-black text-slate-400 tracking-tight">לא נמצאו אירועים</h4>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">NO MATCHING LOGS FOUND</p>
          </div>
        )}
      </div>

      <ReadOnlyNoticeModal 
        isOpen={showReadOnlyNotice}
        onClose={() => setShowReadOnlyNotice(false)}
      />
    </div>
  );
};

/**
 * Repair & Recovery Component
 * Tools for fixing database and connection issues.
 */
const RepairRecovery: React.FC = () => {
  const { retryConnection, isLoading, seedInitialAssets, seedInitialAdmin } = useData();
  const { currentUser } = useAuth();
  const isAppShaper = isAppShaperUser(currentUser);
  const [showReadOnlyNotice, setShowReadOnlyNotice] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const checkAppShaper = () => {
    if (!isAppShaper) {
      setShowReadOnlyNotice(true);
      return false;
    }
    return true;
  };

  const handleClearCache = async () => {
    if (!checkAppShaper()) return;
    if (window.confirm('האם אתה בטוח שברצונך לנקות את המטמון המקומי? המערכת תבצע טעינה מחדש.')) {
      try { window.localStorage.clear(); } catch(e){}
      try { window.sessionStorage.clear(); } catch(e){}
      // Clear IndexedDB (Firebase persistence)
      try {
        if (window.indexedDB && window.indexedDB.databases) {
          const dbs = await window.indexedDB.databases();
          dbs.forEach(db => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          });
        }
      } catch(e) {
        console.warn("Could not clear indexedDB", e);
      }
      window.location.reload();
    }
  };

  const handleForceSeed = async () => {
    if (!checkAppShaper()) return;
    if (window.confirm('האם אתה בטוח שברצונך להריץ Seed לנתוני המערכת? פעולה זו תוודא שכל נכסי האתר והרשאות האדמין קיימים.')) {
      setIsRepairing(true);
      try {
        await seedInitialAssets();
        await seedInitialAdmin();
        alert('ה-Seed הושלם בהצלחה!');
      } catch (err) {
        console.error(err);
        alert('שגיאה במהלך ה-Seed');
      } finally {
        setIsRepairing(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 relative overflow-hidden transition-all duration-500 border border-slate-200 shadow-sm hover:shadow-md">
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
            <RefreshCw size={28} className={isRepairing ? 'animate-spin' : ''} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">תיקון ושחזור</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">REPAIR & RECOVERY TOOLS</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => {
            if (!checkAppShaper()) return;
            retryConnection();
          }}
          disabled={isLoading}
          className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
        >
          <Wifi size={24} className="text-indigo-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">חיבור מחדש</span>
          <p className="text-[9px] text-slate-400 font-bold text-center">ניסיון התחברות יזום ל-Firestore</p>
        </button>

        <button 
          onClick={handleClearCache}
          className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-amber-50 hover:border-amber-200 transition-all group"
        >
          <Trash2 size={24} className="text-amber-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">ניקוי מטמון</span>
          <p className="text-[9px] text-slate-400 font-bold text-center">מחיקת נתונים מקומיים וטעינה מחדש</p>
        </button>

        <button 
          onClick={handleForceSeed}
          disabled={isRepairing}
          className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
        >
          <Database size={24} className="text-emerald-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Force Seed</span>
          <p className="text-[9px] text-slate-400 font-bold text-center">שחזור נכסי מערכת והרשאות בסיס</p>
        </button>
      </div>

      <ReadOnlyNoticeModal 
        isOpen={showReadOnlyNotice}
        onClose={() => setShowReadOnlyNotice(false)}
      />
    </div>
  );
};

// --- End New Modular Components ---

const Gauge = ({ value, label, color, sublabel }: { value: number, label: string, color: string, sublabel?: string }) => (
  <div className="relative w-full h-[300px] min-h-[300px] mx-auto">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={[
            { value: value },
            { value: 100 - value }
          ]}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill={color}
          paddingAngle={5}
          dataKey="value"
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

const SystemMonitor: React.FC = () => {
  const { dbStatus, toggleDbStatus, members, events } = useData();
  const { currentUser } = useAuth();
  const isAppShaper = isAppShaperUser(currentUser);
  const [showReadOnlyNotice, setShowReadOnlyNotice] = useState(false);

  const checkAppShaper = () => {
    if (!isAppShaper) {
      setShowReadOnlyNotice(true);
      return false;
    }
    return true;
  };

  const [data, setData] = useState<any>({
    dbSize: 0,
    errorRate: 0,
    traffic: []
  });
  const [storageSize, setStorageSize] = useState<number>(0);
  const [dbSize, setDbSize] = useState<number>(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveReads, setLiveReads] = useState(sessionReadCount);
  const [readHistory, setReadHistory] = useState<{ time: string, reads: number }[]>(() => {
    const now = new Date();
    return Array.from({ length: 15 }).map((_, i) => {
      const d = new Date(now.getTime() - (15 - i) * 5000);
      return {
        time: d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        reads: 0
      };
    });
  });
  const [lastReadCount, setLastReadCount] = useState(sessionReadCount);
  const [bandwidthData, setBandwidthData] = useState(get24hBandwidth());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const isKillSwitchActive = dbStatus === 'OFFLINE';

  // Countdown Logic
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      toggleDbStatus();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, toggleDbStatus]);

  useEffect(() => {
    const handleBandwidthUpdate = () => {
      setBandwidthData(get24hBandwidth());
    };
    window.addEventListener('bandwidth-update', handleBandwidthUpdate);
    return () => window.removeEventListener('bandwidth-update', handleBandwidthUpdate);
  }, []);

  useEffect(() => {
    const handleReadUpdate = (e: any) => {
      setLiveReads(e.detail);
    };
    window.addEventListener('db-read-update', handleReadUpdate);
    return () => window.removeEventListener('db-read-update', handleReadUpdate);
  }, []);

  // Live Request Rate Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const currentTotal = sessionReadCount;
      setLiveReads(currentTotal);
      
      setLastReadCount(prevTotal => {
        const delta = Math.max(0, currentTotal - prevTotal);
        
        setReadHistory(prevHistory => {
          const newPoint = { time: timeStr, reads: delta };
          const updatedHistory = [...prevHistory, newPoint].slice(-20);
          return updatedHistory;
        });
        
        return currentTotal;
      });
    }, 5000); // Every 5 seconds for a "Live" feel
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const statsRef = doc(db, "admin", "storage_metadata");
    const dbStatsRef = doc(db, "admin", "database_metadata");

    const unsubStorage = onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const totalBytes = snapshot.data().totalBytes || 0;
        const mb = totalBytes / (1024 * 1024);
        setStorageSize(mb);
      }
    }, (error) => {
      console.error("Error listening to storage stats in SystemMonitor:", error);
    });

    const unsubDb = onSnapshot(dbStatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const mb = snapshot.data().estimatedMB || 0;
        setDbSize(mb);
      }
    }, (error) => {
      console.error("Error listening to database stats in SystemMonitor:", error);
    });

    return () => {
      unsubStorage();
      unsubDb();
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await fetch('/api/stats/system');
        
        if (!statsRes.ok) throw new Error(`Server error: ${statsRes.status}`);
        
        const contentType = statsRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await statsRes.text();
          if (text.includes("<title>Starting Server...</title>")) {
            console.warn("Server is starting up, retrying system stats later...");
            return;
          }
          throw new Error(`Received non-JSON response from server: ${contentType}`);
        }

        const statsJson = await statsRes.json();
        setData(statsJson);
      } catch (err) {
        console.error('Error fetching system stats:', err);
        setError('שגיאה בטעינת נתוני המערכת.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleButtonClick = () => {
    if (!checkAppShaper()) return;
    if (isKillSwitchActive) {
      // Reconnecting doesn't need a countdown, just do it
      toggleDbStatus();
    } else if (countdown !== null) {
      // Abort countdown
      setCountdown(null);
    } else {
      // Start shutdown process
      setShowConfirmModal(true);
    }
  };

  const maxReads = Math.max(...readHistory.map(pt => pt.reads), 0);
  const yAxisMax = Math.pow(10, Math.floor(Math.log10(Math.max(1, maxReads))) + 1);

  return (
    <div className="space-y-16 animate-in fade-in duration-700 min-h-[400px]" dir="rtl">
      {/* Unified Header */}
      <div className="flex flex-col items-center text-center mb-16 space-y-6">
        <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full border border-slate-100 uppercase tracking-[0.2em] shadow-sm">
          <Activity size={14} className="text-sky-500" />
          <span>SYSTEM DIVE ANALYTICS</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter leading-none">
          חדר מכונות
        </h1>

        <div className="flex flex-col items-center gap-6">
          <p className="text-slate-500 max-w-2xl text-xl font-medium leading-relaxed">
            ניטור תשתיות וביצועי מערכת בזמן אמת. כל המדדים הקריטיים תחת שליטה מלאה ⚙️
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => {
                setLoading(true);
                const fetchStats = async () => {
                  try {
                    const statsRes = await fetch('/api/stats/system');
                    if (!statsRes.ok) throw new Error(`Server error: ${statsRes.status}`);
                    
                    const contentType = statsRes.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                      const text = await statsRes.text();
                      if (text.includes("<title>Starting Server...</title>")) {
                        console.warn("Server is starting up, retrying system stats later...");
                        return;
                      }
                      throw new Error(`Received non-JSON response from server: ${contentType}`);
                    }

                    const statsJson = await statsRes.json();
                    setData(statsJson);
                  } catch (err) {
                    console.error('Error fetching system stats:', err);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchStats();
              }}
              className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm active:scale-95"
              title="Refresh Stats"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>

            <button 
              onClick={async () => {
                if (!checkAppShaper()) return;
                setIsRecalculating(true);
                try {
                  await Promise.all([
                    recalculateStorageFromStorage(),
                    recalculateDatabaseSize()
                  ]);
                } finally {
                  setIsRecalculating(false);
                }
              }}
              disabled={isRecalculating}
              className="flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 backdrop-blur-sm border border-white/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRecalculating ? 'animate-spin' : ''} />
              <span>סנכרון נתוני מערכת</span>
            </button>
          </div>
        </div>

        {/* Emergency Control Panel */}
        <div className="w-full flex flex-wrap justify-center gap-10 pt-10 pb-16 items-center">
          
          {/* Emergency Shutdown Button */}
          <div className="flex flex-col items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleButtonClick}
              className={`w-28 h-28 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 shadow-xl transition-all border-4 ${
                isKillSwitchActive 
                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-100' 
                  : countdown !== null 
                    ? 'bg-amber-500 border-amber-600 text-white animate-pulse shadow-amber-100' 
                    : 'bg-rose-500 border-rose-600 text-white shadow-rose-100'
              }`}
            >
              {isKillSwitchActive ? <Power size={36} /> : countdown !== null ? <AlertCircle size={36} /> : <Skull size={36} />}
              <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight">
                {isKillSwitchActive ? 'RECONNECT' : countdown !== null ? `ABORT (${countdown})` : 'SHUTDOWN'}
              </span>
            </motion.button>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">פרוטוקול חירום</span>
          </div>

          {/* Cache Purge Button */}
          <div className="flex flex-col items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!checkAppShaper()) return;
                try { window.localStorage.clear(); } catch(e){}
                try { window.sessionStorage.clear(); } catch(e){}
                window.location.reload();
              }}
              className="w-28 h-28 rounded-[2.5rem] bg-amber-400 border-4 border-amber-500 text-white flex flex-col items-center justify-center gap-2 shadow-xl shadow-amber-50"
            >
              <RefreshCw size={36} />
              <span className="text-[10px] font-black uppercase tracking-tighter">PURGE CACHE</span>
            </motion.button>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">ניקוי מטמון</span>
          </div>
        </div>

        {/* Vercel Command Center */}
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
          <WorkflowVisualizer />
          <GitHubCommandCenter />
          <VercelStatusWidget 
            systemStats={{
              membersCount: members.length,
              eventsCount: events.length
            }}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col rounded-3xl border border-slate-200" dir="rtl">
            <div className="bg-rose-500 p-8 text-white flex items-center gap-4 relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <Skull size={32} className="text-white" />
              </div>
              <div>
                <h4 className="font-black text-xl uppercase tracking-tight flex items-center gap-2">
                  פרוטוקול חירום
                </h4>
                <p className="text-[10px] opacity-80 font-black uppercase tracking-widest">CRITICAL SYSTEM SHUTDOWN</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-slate-800 font-bold text-lg leading-tight">
                  האם אתה בטוח שברצונך להשבית את מסד הנתונים?
                </p>
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 space-y-2">
                  <p className="text-rose-600 text-sm font-bold flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>פעולה זו תנתק את כל המשתמשים המחוברים ותחסום כל גישה למידע באתר.</span>
                  </p>
                  <p className="text-rose-600 text-sm font-bold flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>האתר יפסיק לתפקד עד שתפעיל מחדש את הגישה.</span>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowConfirmModal(false);
                    setCountdown(10);
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-base hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Skull size={18} />
                  אישור (הפעל טיימר)
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-base hover:bg-slate-200 transition-all active:scale-95"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Enhanced Analytics Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <DataHealthScore dbSize={dbSize} storageSize={storageSize} />
        <RepairRecovery />
      </div>

      <div className="mb-12">
        <QuotaMonitor />
      </div>

      <div className="mb-16">
        <TechnicalLogs />
      </div>


      {/* Database & Storage Metrics - MOVED INTO DataHealthScore */}

      <div className="grid grid-cols-1 gap-12">
        {/* Reads per Minute Chart */}
        <div className="bg-white p-10 relative overflow-hidden border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">קצב קריאות ממסד הנתונים (Live)</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">REAL-TIME DATABASE THROUGHPUT</p>
              </div>
              <div className="gt-info-wrapper">
                <div className="gt-info-icon bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors border border-slate-100" style={{ width: '22px', height: '22px', fontSize: '12px' }}>i</div>
                <span className="gt-tooltip bg-white text-slate-600 border border-slate-200 shadow-2xl rounded-2xl p-5 text-xs font-medium leading-relaxed" style={{ bottom: '180%', width: '300px' }}>
                  גרף זה מציג את כמות הבקשות (Requests) שנשלחות למסד הנתונים בזמן אמת, בכל רגע נתון.
                  <br /><br />
                  כל נקודה בגרף מייצגת את מספר המסמכים שנשלפו ב-5 השניות האחרונות. זה עוזר לזהות "פיקים" של פעילות באתר.
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => incrementReadCount(1)}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-[11px] font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 backdrop-blur-sm border border-white/20 active:scale-95"
            >
              בצע בדיקת קריאה
            </button>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readHistory} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="readGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  minTickGap={30}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  domain={[0, yAxisMax]}
                  tickCount={6}
                  allowDecimals={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '20px', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    padding: '16px'
                  }}
                  itemStyle={{ color: '#0ea5e9', fontWeight: 800, fontSize: '13px' }}
                  labelStyle={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}
                  formatter={(value: any) => [Math.round(value), 'קריאות']}
                />
                <Area 
                  type="monotone" 
                  dataKey="reads" 
                  stroke="#0ea5e9" 
                  strokeWidth={0} 
                  fillOpacity={1} 
                  fill="url(#readGradient)" 
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="reads" 
                  stroke="#0ea5e9" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {readHistory.every(pt => pt.reads === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] bg-slate-50/80 px-6 py-3 rounded-full border border-slate-100 backdrop-blur-sm">
                No active traffic detected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Traffic Area Chart */}
      <div className="bg-white p-10 border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-500">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="flex flex-col">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">תנועת רשת (24 שעות - MB)</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">NETWORK BANDWIDTH CONSUMPTION</p>
          </div>
          <div className="flex gap-6 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowDown size={14} className="text-sky-500" /> Incoming
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowUp size={14} className="text-indigo-500" /> Outgoing
              </span>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bandwidthData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                minTickGap={30}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                unit="MB" 
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '20px', 
                  border: '1px solid #f1f5f9', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '16px'
                }}
                itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                labelStyle={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}
                formatter={(value: any) => [`${Math.round(value)} MB`]}
              />
              <Area 
                type="monotone" 
                dataKey="in" 
                name="Incoming" 
                stroke="#0ea5e9" 
                strokeWidth={3.5} 
                fillOpacity={1} 
                fill="url(#colorIn)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
              />
              <Area 
                type="monotone" 
                dataKey="out" 
                name="Outgoing" 
                stroke="#6366f1" 
                strokeWidth={3.5} 
                fillOpacity={1} 
                fill="url(#colorOut)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ReadOnlyNoticeModal 
        isOpen={showReadOnlyNotice}
        onClose={() => setShowReadOnlyNotice(false)}
      />
    </div>
  );
};

export default SystemMonitor;
