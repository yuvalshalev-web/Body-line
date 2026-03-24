import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Server, Database, Activity, AlertCircle, Power, ShieldAlert, Info, RefreshCw, ArrowDown, ArrowUp, Skull, TriangleAlert, HeartPulse, Zap, Terminal, Filter, Search as SearchIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VercelStatusWidget from './admin/VercelStatusWidget';
import GitHubCommandCenter from './admin/GitHubCommandCenter';
import WorkflowVisualizer from './admin/WorkflowVisualizer';
import { fetchJson } from '../utils/apiUtils';
import { getStorageSizeMB, recalculateStorageFromStorage, recalculateDatabaseSize } from '../utils/storageStats';
import { 
  getDb, trackedGetDocs, setDbStatus, db_status, getStorageInstance, 
  trackedAddDoc, trackedSetDoc, trackedUpdateDoc, trackedDeleteDoc, 
  trackedOnSnapshot, incrementWriteCount, sessionReadCount, sessionWriteCount, 
  incrementReadCount, saveLogsToDatabase, loadLogsFromDatabase 
} from '../services/firebase';
import { useData } from '../contexts/DataContext';
import { get24hBandwidth } from '../utils/bandwidthTracker';
import { getLogs, SystemLog, LogSeverity, clearLogs } from '../utils/systemLogs';
import { doc, collection, query, limit, writeBatch, increment } from 'firebase/firestore';
import { useModal } from '../contexts/ModalContext';

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

  if (mode === 'neon') {
    return (
      <div className={`flex flex-col items-center justify-center p-4 ${animateClass || ''}`}>
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={gradient[0]}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="none"
              className={`gauge-ring-neon ${ringClass || ''}`}
            />
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="central"
              className="gauge-percentage-neon transform rotate-90 fill-[#000000] font-black"
              style={{ transformOrigin: '50px 50px' }}
            >
              {displayValue.toFixed(0)}%
            </text>
            <text
              x="50"
              y="75"
              textAnchor="middle"
              className="gauge-label-neon transform rotate-90 fill-[#000000] font-bold text-[8px]"
              style={{ transformOrigin: '50px 50px' }}
            >
              {label}
            </text>
          </svg>
        </div>
        <p className="text-[12px] font-black text-[#000000] mt-4 tabular-nums uppercase tracking-widest">
          {sublabel}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${animateClass || ''}`}>
      <div className="relative w-40 h-40 flex items-center justify-center bg-[#B2EBF2]/[0.07] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),0_10px_20px_-5px_rgba(0,0,0,0.05)] border border-white/30 backdrop-blur-[20px]">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
          
          {/* Background Ring (Track) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(0,0,0,0.1)"
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
            className={`transition-all duration-1000 ease-out`}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-black text-[#00426a]">
            {displayValue.toFixed(0)}%
          </span>
          <span className="text-[10px] font-bold text-[#00426a] uppercase tracking-wider mt-1">
            {label}
          </span>
        </div>
      </div>
      <p className="text-xs font-bold text-[#00426a] mt-4 tabular-nums uppercase tracking-widest">
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
const DataHealthScore: React.FC = () => {
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
    const emails = new Set<string>();

    members.forEach(member => {
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'ללא שם';
      
      // Check mandatory fields
      if (!member.firstName || !member.lastName || !member.mobile || !member.email) {
        issues.push({
          id: member.id,
          name: fullName,
          issue: 'חסרים שדות חובה'
        });
      }

      // Check email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (member.email && !emailRegex.test(member.email)) {
        issues.push({
          id: member.id,
          name: fullName,
          issue: 'פורמט אימייל לא תקין'
        });
      }

      // Check for duplicate emails
      if (member.email) {
        if (emails.has(member.email.toLowerCase())) {
          issues.push({
            id: member.id,
            name: fullName,
            issue: 'אימייל כפול במערכת'
          });
        }
        emails.add(member.email.toLowerCase());
      }

      // Check birthday validity
      if (member.birthday) {
        const bday = new Date(member.birthday);
        const now = new Date();
        if (isNaN(bday.getTime()) || bday > now || bday.getFullYear() < 1920) {
          issues.push({
            id: member.id,
            name: fullName,
            issue: 'תאריך לידה לא הגיוני'
          });
        }
      }

      // Check Grit score anomalies
      const grit = (member as any).grit;
      if (grit !== undefined && (grit < 0 || grit > 100)) {
        issues.push({
          id: member.id,
          name: fullName,
          issue: `ציון Grit לא תקין: ${grit}`
        });
      }
    });

    // Calculate score: Deduct 2 points per anomaly, min 0
    const calculatedScore = Math.max(0, 100 - (issues.length * 2));
    
    setHealthScore(calculatedScore);
    setAnomalies(issues.slice(0, 8)); // Show more anomalies
    setLastScan(new Date());
    setIsScanning(false);

    // Cache result in localStorage
    localStorage.setItem('data_health_cache', JSON.stringify({
      score: calculatedScore,
      timestamp: new Date().toISOString(),
      anomalyCount: issues.length
    }));
  };

  useEffect(() => {
    const cached = localStorage.getItem('data_health_cache');
    if (cached) {
      const { score, timestamp } = JSON.parse(cached);
      setHealthScore(score);
      setLastScan(new Date(timestamp));
    }
  }, []);

  return (
    <div className="rounded-3xl p-8 relative overflow-hidden group transition-all duration-500 border border-white/20 shadow-xl"
      style={{
        background: 'rgba(240, 248, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid rgba(0, 66, 106, 0.1)',
        borderRight: '1px solid rgba(0, 66, 106, 0.1)',
      }}
    >
      {/* Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FFDE45] rounded-2xl flex items-center justify-center text-[#000000] shadow-sm border border-white/30">
            <HeartPulse size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#00426a] tracking-tight">ציון בריאות נתונים</h3>
            <p className="text-xs font-bold text-[#00426a] uppercase tracking-widest">DATA INTEGRITY SCAN</p>
          </div>
        </div>
        
        <button 
          onClick={runScan}
          disabled={isScanning}
          className="px-4 py-2 bg-white/30 hover:bg-white/50 border border-white/40 rounded-xl text-xs font-black text-[#00426a] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'סורק...' : 'הפעל סריקה'}
        </button>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="rgba(0,0,0,0.05)" strokeWidth="8" fill="none" />
            <motion.circle 
              cx="50" cy="50" r="40" 
              stroke={healthScore !== null && healthScore < 70 ? '#F56565' : '#10B981'} 
              strokeWidth="8" 
              fill="none"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (healthScore || 0) / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#007085]">{healthScore ?? '--'}</span>
            <span className="text-[8px] font-bold text-[#00426a] uppercase tracking-widest">SCORE</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
              <p className="text-[10px] font-bold text-[#00426a] uppercase tracking-widest mb-1">סה"כ רשומות</p>
              <p className="text-xl font-black text-[#007085]">{members.length}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
              <p className="text-[10px] font-bold text-[#00426a] uppercase tracking-widest mb-1">חריגות שנמצאו</p>
              <p className={`text-xl font-black ${anomalies.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {healthScore !== null ? (100 - healthScore) / 2 : '--'}
              </p>
            </div>
          </div>
          
          {anomalies.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">דגימת חריגות:</p>
              <div className="space-y-1">
                {anomalies.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-[11px] font-bold text-[#00426a] bg-rose-50/20 px-3 py-1.5 rounded-lg border border-rose-100/30">
                    <span>{a.name}</span>
                    <span className="text-rose-600">{a.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {lastScan && (
        <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between">
          <p className="text-[10px] font-bold text-[#00426a]/40 uppercase tracking-widest">סריקה אחרונה: {lastScan.toLocaleString('he-IL')}</p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            <HeartPulse size={10} />
            <span>DATA IS STABLE</span>
          </div>
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
  <div className="bg-[#f0f8ff]/10 backdrop-blur-md p-6 border border-white/20 rounded-2xl shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-sm font-black text-[#00426a] uppercase tracking-widest">{title}</h4>
      <span className="text-[10px] font-black text-[#00426a]/60 bg-[#00426a]/5 px-2 py-1 rounded-md">
        מכסה יומית: {limit.toLocaleString()}
      </span>
    </div>
    <div className="h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} domain={[0, limit]} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const QuotaMonitor: React.FC = () => {
  const monthlyData = useMemo(() => getMonthlyQuotaData(), []);

  return (
    <div className="rounded-3xl p-8 relative overflow-hidden group transition-all duration-500 border border-white/20 shadow-xl"
      style={{
        background: 'rgba(240, 248, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid rgba(0, 66, 106, 0.1)',
        borderRight: '1px solid rgba(0, 66, 106, 0.1)',
      }}
    >
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FFDE45] rounded-xl flex items-center justify-center text-[#000000] shadow-sm border border-white/30">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#00426a] tracking-tight">מכסות Firebase היסטוריות</h3>
            <p className="text-xs font-bold text-[#00426a] uppercase tracking-widest">MONTHLY QUOTA PROGRESS</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <QuotaChart data={monthlyData} dataKey="reads" limit={50000} title="קריאות מסמכים (Reads)" color="#007085" />
        <QuotaChart data={monthlyData} dataKey="writes" limit={20000} title="כתיבת מסמכים (Writes)" color="#3dbbd3" />
        <QuotaChart data={monthlyData} dataKey="deletes" limit={20000} title="מחיקת מסמכים (Deletes)" color="#CC2678" />
      </div>
    </div>
  );
};

/**
 * Technical Logs Table
 * Interactive log table for system events.
 */
const TechnicalLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState<LogSeverity | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredLogs = logs.filter(log => {
    const matchesSeverity = filter === 'All' || log.severity === filter;
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity: LogSeverity) => {
    switch (severity) {
      case 'Critical': return 'text-rose-500 bg-rose-50 border-rose-100';
      case 'Warning': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'Info': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'Security': return 'text-violet-500 bg-violet-50 border-violet-100';
    }
  };

  return (
    <div className="rounded-3xl p-8 relative overflow-hidden group transition-all duration-500 border border-white/20 shadow-xl"
      style={{
        background: 'rgba(240, 248, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid rgba(0, 66, 106, 0.1)',
        borderRight: '1px solid rgba(0, 66, 106, 0.1)',
      }}
    >
      {/* Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FFDE45] rounded-2xl flex items-center justify-center text-[#00426a] shadow-lg border border-white/30">
            <Terminal size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#00426a] tracking-tight">יומן אירועים טכני</h3>
            <p className="text-xs font-bold text-[#00426a] uppercase tracking-widest">ADVANCED SYSTEM LOGS</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00426a]/40" />
              <input 
                type="text"
                placeholder="חיפוש ביומן..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 bg-white/30 border border-white/40 rounded-xl text-xs font-bold text-[#00426a] outline-none focus:bg-white/50 transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button 
                onClick={async () => {
                  await saveLogsToDatabase(logs);
                  clearLogs();
                  refreshLogs();
                }}
                className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[10px] font-black hover:bg-rose-600 transition-all shadow-sm"
              >
                נקה ושמור
              </button>
              <button 
                onClick={async () => {
                  const loadedLogs = await loadLogsFromDatabase();
                  setLogs(loadedLogs);
                }}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black hover:bg-emerald-600 transition-all shadow-sm"
              >
                טען אירועים
              </button>
              <button 
                onClick={refreshLogs}
                className="p-2 bg-white/30 border border-white/40 rounded-xl text-[#00426a]/40 hover:text-[#00426a] transition-all shadow-sm"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="flex bg-black/5 p-1 rounded-xl border border-black/10 w-fit self-end">
            {(['All', 'Critical', 'Warning', 'Info', 'Security'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  filter === s ? 'bg-white text-[#00426a] shadow-sm' : 'text-[#00426a]/40 hover:text-[#00426a]'
                }`}
              >
                {s === 'All' ? 'הכל' : s === 'Critical' ? 'קריטי' : s === 'Warning' ? 'אזהרה' : s === 'Info' ? 'מידע' : 'אבטחה'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto -mx-8 px-8 max-h-[400px] custom-scrollbar">
        <table className="w-full text-right border-separate border-spacing-y-2 relative">
          <thead className="sticky top-0 z-20 bg-[#fdfdfd]">
            <tr className="text-[10px] font-black text-[#00426a] uppercase tracking-[0.2em]">
              <th className="pb-4 px-4 text-right">זמן</th>
              <th className="pb-4 px-4 text-right">חומרה</th>
              <th className="pb-4 px-4 text-right">מקור</th>
              <th className="pb-4 px-4 text-right">הודעה</th>
              <th className="pb-4 px-4 text-right">פרטים</th>
            </tr>
          </thead>
          <tbody className="relative z-10">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((log) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group"
                >
                  <td className="py-3 px-4 bg-white/10 first:rounded-r-2xl border-y border-r border-white/10 text-[11px] font-bold text-[#00426a]/60 tabular-nums">
                    {log.timestamp.toLocaleTimeString('he-IL')}
                  </td>
                  <td className="py-3 px-4 bg-white/10 border-y border-white/10">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 bg-white/10 border-y border-white/10 text-[11px] font-black text-[#00426a]">
                    {log.source}
                  </td>
                  <td 
                    className="py-3 px-4 bg-white/10 border-y border-white/10 text-[11px] font-bold text-[#00426a] max-w-xs truncate cursor-pointer hover:bg-white/20 transition-colors relative"
                    onClick={() => copyToClipboard(log)}
                    title="לחץ להעתקת פרטי האירוע"
                  >
                    {log.message}
                    {copiedId === log.id && (
                      <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-6 right-0 bg-emerald-500 text-white text-[8px] px-2 py-1 rounded-md font-black shadow-lg z-50"
                      >
                        הועתק!
                      </motion.span>
                    )}
                  </td>
                  <td 
                    className="py-3 px-4 bg-white/10 last:rounded-l-2xl border-y border-l border-white/10 text-[10px] font-medium text-[#00426a]/40 font-mono cursor-pointer hover:bg-white/20 transition-colors"
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
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
              <Filter size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400">לא נמצאו אירועים התואמים לסינון</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- End New Modular Components ---

const Gauge = ({ value, label, color, sublabel }: { value: number, label: string, color: string, sublabel?: string }) => (
  <div className="relative w-full h-[300px] mx-auto">
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
  const { dbStatus, toggleDbStatus, members, weeklyHistory, yearConfig, siteConfig, events } = useData();
  const { showSuccess, showError, showAlert } = useModal();
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
  const [liveWrites, setLiveWrites] = useState(sessionWriteCount);
  const [readHistory, setReadHistory] = useState<{ time: string, reads: number, writes: number }[]>(() => {
    const now = new Date();
    return Array.from({ length: 20 }).map((_, i) => {
      const d = new Date(now.getTime() - (20 - i) * 5000);
      return {
        time: d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        reads: 0,
        writes: 0
      };
    });
  });
  const [lastReadCount, setLastReadCount] = useState(sessionReadCount);
  const [lastWriteCount, setLastWriteCount] = useState(sessionWriteCount);
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
    const handleReadUpdate = (e: any) => setLiveReads(e.detail);
    const handleWriteUpdate = (e: any) => setLiveWrites(e.detail);
    
    window.addEventListener('db-read-update', handleReadUpdate);
    window.addEventListener('db-write-update', handleWriteUpdate);
    
    return () => {
      window.removeEventListener('db-read-update', handleReadUpdate);
      window.removeEventListener('db-write-update', handleWriteUpdate);
    };
  }, []);

  // Live Request Rate Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const currentReads = sessionReadCount;
      const currentWrites = sessionWriteCount;
      
      setLiveReads(currentReads);
      setLiveWrites(currentWrites);
      
      setLastReadCount(prevReads => {
        const readsDelta = Math.max(0, currentReads - prevReads);
        
        setLastWriteCount((prevWrites: number) => {
          const writesDelta = Math.max(0, currentWrites - prevWrites);
          
          setReadHistory(prevHistory => {
            const newPoint = { time: timeStr, reads: readsDelta, writes: writesDelta };
            const updatedHistory = [...prevHistory, newPoint].slice(-20);
            return updatedHistory;
          });
          
          return currentWrites;
        });
        
        return currentReads;
      });
    }, 5000); // Every 5 seconds for a "Live" feel
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const db = getDb();
    const statsRef = doc(db, "admin", "storage_metadata");
    const dbStatsRef = doc(db, "admin", "database_metadata");

    const unsubStorage = trackedOnSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        const totalBytes = snapshot.data().totalBytes || 0;
        const mb = totalBytes / (1024 * 1024);
        setStorageSize(mb);
      }
    }, (error) => {
      console.error("Error listening to storage stats in SystemMonitor:", error);
    });

    const unsubDb = trackedOnSnapshot(dbStatsRef, (snapshot) => {
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
        const statsJson = await fetchJson('/api/stats/system');
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'members' | 'sessions') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const processData = async (data: any[]) => {
      const db = getDb();
      const batch = writeBatch(db);
      let count = 0;

      try {
        if (type === 'members') {
          for (const row of data) {
            if (!row.email) continue;
            
            // Check if member already exists
            const existingMember = members.find(m => m.email.toLowerCase() === row.email.toLowerCase());
            const memberId = existingMember ? existingMember.id : doc(collection(db, 'members')).id;
            
            const memberData = {
              firstName: row.firstName || row.first_name || '',
              lastName: row.lastName || row.last_name || '',
              email: row.email.toLowerCase(),
              mobile: String(row.mobile || row.phone || ''),
              role: row.role || 'Member',
              joinedAt: row.joinedAt || row.joined_at || new Date().toISOString(),
              isActive: row.isActive !== undefined ? (row.isActive === 'true' || row.isActive === true) : true,
              avatar: row.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.email}`,
              bio: row.bio || '',
              id: memberId
            };

            batch.set(doc(db, 'members', memberId), memberData, { merge: true });
            count++;
          }
        } else if (type === 'sessions') {
          for (const row of data) {
            const dateStr = row.date || row.Date;
            if (!dateStr) continue;

            const participantEmails = String(row.participantEmails || row.emails || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
            const participantIds = participantEmails.map(email => {
              const m = members.find(member => member.email.toLowerCase() === email);
              return m ? m.id : null;
            }).filter(Boolean) as string[];

            const sessionId = doc(collection(db, 'weekly_history')).id;
            const sessionData = {
              id: sessionId,
              date: dateStr,
              participantIds,
              participantsCount: participantIds.length,
              type: 'SEA',
              status: 'COMPLETED'
            };

            batch.set(doc(db, 'weekly_history', sessionId), sessionData);
            
            // Update totalAttendance for each participant
            for (const uid of participantIds) {
              batch.update(doc(db, 'members', uid), {
                totalAttendance: increment(1)
              });
            }
            count++;
          }
        }

        await batch.commit();
        incrementWriteCount(count);
        showSuccess(`ייבוא ${count} רשומות הושלם בהצלחה!`);
      } catch (error) {
        console.error('Import error:', error);
        showError('שגיאה במהלך הייבוא. וודא שהפורמט תקין.');
      }
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (results) => {
          processData(results.data);
        },
        header: true,
        skipEmptyLines: true
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        processData(json);
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset input
    event.target.value = '';
  };

  const maxMetric = Math.max(...readHistory.map(pt => Math.max(pt.reads, pt.writes)), 0);
  const yAxisMax = Math.pow(10, Math.floor(Math.log10(Math.max(1, maxMetric))) + 1);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 min-h-[400px]" dir="rtl">
      {/* Unified Header */}
      <div className="flex flex-col items-center text-center mb-16 space-y-6">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-[#FFDE45] text-[#000000] text-[12px] font-black rounded-full shadow-xl border border-white/30">
          <Activity size={12} />
          <span className="tracking-widest">SYSTEM DIVE ANALYTICS</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-[#00426a] tracking-tighter leading-none uppercase" style={{ textShadow: '0 0 30px rgba(0, 66, 106, 0.2)' }}>
          חדר מכונות
        </h1>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[#000000] max-w-2xl text-xl font-bold">
            ניטור תשתיות וביצועי מערכת בזמן אמת. כל המדדים הקריטיים תחת שליטה מלאה ⚙️
          </p>
          
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => {
                setLoading(true);
                const fetchStats = async () => {
                  try {
                    const statsJson = await fetchJson('/api/stats/system');
                    setData(statsJson);
                  } catch (err) {
                    console.error('Error fetching system stats:', err);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchStats();
              }}
              className="p-2 bg-white/30 hover:bg-white/50 rounded-full text-[#000000] transition-all border border-white/30 shadow-sm"
              title="Refresh Stats"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button 
              onClick={async () => {
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
              className="flex items-center gap-2 px-4 py-2 bg-white/30 hover:bg-white/50 rounded-xl text-[#00426a] text-xs font-black transition-all border border-white/30 shadow-sm disabled:opacity-50"
              title="Recalculate Storage & Database"
            >
              <RefreshCw size={12} className={isRecalculating ? 'animate-spin' : ''} />
              <span>סנכרון נתוני מערכת</span>
            </button>
          </div>
        </div>

        {/* Emergency Control Panel - 2x1 Grid */}
        <div className="w-full flex justify-center gap-24 pt-12 pb-20 items-center">
          
          {/* Emergency Shutdown Button */}
          <div className="relative w-[180px] h-[180px] flex items-center justify-center flex-shrink-0">
            {/* Outer Ring/Base of the button */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full shadow-inner border border-white/20 pointer-events-none" />
            
            <motion.div 
              role="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92, boxShadow: '0px 0px 10px rgba(0,0,0,0.2)' }}
              animate={isKillSwitchActive || countdown !== null ? {
                filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                scale: [1, 0.98, 1],
                boxShadow: [
                  '0 0 20px rgba(255,0,0,0.2)',
                  '0 0 40px rgba(255,0,0,0.5)',
                  '0 0 20px rgba(255,0,0,0.2)'
                ]
              } : {}}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              onClick={handleButtonClick}
              style={{ 
                width: '150px', 
                height: '150px',
                minWidth: '150px',
                minHeight: '150px'
              }}
              className="relative rounded-full font-black text-[10px] transition-all duration-300 border-4 border-[#CC0000] bg-[#FF0000] text-white shadow-xl overflow-hidden cursor-pointer flex-none"
              title={isKillSwitchActive ? "Reconnect to database" : countdown !== null ? "Click to Abort Shutdown" : "Emergency Database Shutdown"}
            >
              {/* Glass Shine Effect */}
              <div className="absolute top-2 left-4 right-4 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />
              
              {/* Inner Bezel */}
              <div className="absolute inset-2 rounded-full border-2 border-white/10 pointer-events-none" />
              
              {/* Content - Absolutely Positioned to avoid stretching */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                {isKillSwitchActive ? (
                  <>
                    <RefreshCw size={32} className="animate-spin mb-1" />
                    <span className="leading-none uppercase font-black tracking-tighter text-[10px]">RECONNECTING...</span>
                  </>
                ) : countdown !== null ? (
                  <div className="flex flex-col items-center justify-center">
                    <TriangleAlert size={40} className="animate-pulse text-yellow-300 mb-1" />
                    <span className="text-5xl font-black leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{countdown}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1">SECONDS</span>
                  </div>
                ) : (
                  <>
                    <TriangleAlert size={36} className="mb-1" />
                    <span className="leading-tight uppercase font-black tracking-tighter text-[11px]">EMERGENCY<br/>SHUTDOWN</span>
                    <Skull size={28} className="mt-1" />
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Cache Cleaning Button - Styled like Emergency Button */}
          <div className="relative w-[180px] h-[180px] flex items-center justify-center flex-shrink-0">
            {/* Outer Ring/Base of the button */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full shadow-inner border border-white/20 pointer-events-none" />
            
            <motion.div 
              role="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92, boxShadow: '0px 0px 10px rgba(0,0,0,0.2)' }}
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{ 
                width: '150px', 
                height: '150px',
                minWidth: '150px',
                minHeight: '150px'
              }}
              className="relative rounded-full font-black text-[10px] transition-all duration-300 border-4 border-[#B48200] bg-[#FFB800] text-white shadow-xl overflow-hidden cursor-pointer flex-none"
              title="ניקוי מטמון וטעינה מחדש של המערכת"
            >
              {/* Glass Shine Effect */}
              <div className="absolute top-2 left-4 right-4 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />
              
              {/* Inner Bezel */}
              <div className="absolute inset-2 rounded-full border-2 border-white/10 pointer-events-none" />
              
              {/* Content - Absolutely Positioned to avoid stretching */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                <RefreshCw size={36} className="mb-1" />
                <span className="leading-tight uppercase font-black tracking-tighter text-[11px]">CACHE<br/>PURGE</span>
                <Zap size={28} className="mt-1" />
              </div>
            </motion.div>
          </div>

        </div>

        {/* Vercel Command Center - Repositioned beneath Emergency Buttons */}
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#00426a]/40 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#f0f8ff]/10 backdrop-blur-md border border-white/20 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col rounded-[2.5rem]" dir="rtl">
            <div className="bg-[#BC4749] p-8 text-white flex items-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_70%)] animate-pulse" />
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/30 rotate-3">
                <Skull size={40} className="text-white animate-pulse" />
              </div>
              <div className="relative z-10">
                <h4 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-2">
                  <TriangleAlert size={24} className="text-yellow-400" />
                  פרוטוקול חירום
                </h4>
                <p className="text-xs opacity-80 font-black uppercase tracking-widest">CRITICAL SYSTEM SHUTDOWN</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-[#00426a] font-black text-lg leading-tight">
                  האם אתה בטוח שברצונך להשבית את מסד הנתונים?
                </p>
                <div className="bg-[#BC4749]/10 p-4 rounded-2xl border border-[#BC4749]/20 space-y-2">
                  <p className="text-[#BC4749] text-sm font-bold flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>פעולה זו תנתק את כל המשתמשים המחוברים ותחסום כל גישה למידע באתר.</span>
                  </p>
                  <p className="text-[#BC4749] text-sm font-bold flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>האתר יפסיק לתפקד עד שתפעיל מחדש את הגישה.</span>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => {
                    setShowConfirmModal(false);
                    setCountdown(10);
                  }}
                  className="flex-1 py-4 bg-[#BC4749] text-white rounded-2xl font-black text-lg hover:bg-[#9b3a3c] transition-all shadow-[0_10px_30px_rgba(188,71,73,0.4)] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Skull size={20} />
                  אישור (הפעל טיימר)
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-4 bg-white/20 backdrop-blur-md text-[#00426a] rounded-2xl font-black text-lg hover:bg-white/30 transition-all active:scale-95 border border-white/30"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Enhanced Analytics Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <DataHealthScore />
        <QuotaMonitor />
      </div>

      <div className="mb-12">
        <TechnicalLogs />
      </div>


      {/* Database & Storage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#f0f8ff]/10 backdrop-blur-md p-8 flex items-center gap-6 border border-white/20 rounded-3xl shadow-xl">
          <CircularRing 
            value={Math.min((dbSize / 1024) * 100, 100)}
            label="Database"
            sublabel={dbSize >= 1024 ? `${(dbSize / 1024).toFixed(2)} GB` : `${(dbSize || 0).toFixed(2)} MB`}
            gradient={dbSize / 1024 > 0.9 ? ['#CC2678', '#FF2D60'] : dbSize / 1024 > 0.7 ? ['#FFDE45', '#FF9F1C'] : ['#10B981', '#34D399']}
          />
          <div>
            <h3 className="text-lg font-black text-[#00426a] uppercase tracking-tight mb-2">גודל מסד הנתונים</h3>
            <p className="text-xs font-bold text-[#00426a]/60 uppercase tracking-widest">מתוך מכסה של 1 GB</p>
          </div>
        </div>
        <div className="bg-[#f0f8ff]/10 backdrop-blur-md p-8 flex items-center gap-6 border border-white/20 rounded-3xl shadow-xl">
          <CircularRing 
            value={Math.min((storageSize / 5120) * 100, 100)}
            label="Storage"
            sublabel={storageSize >= 1024 ? `${(storageSize / 1024).toFixed(2)} GB` : `${(storageSize || 0).toFixed(2)} MB`}
            gradient={storageSize / 5120 > 0.9 ? ['#CC2678', '#FF2D60'] : storageSize / 5120 > 0.7 ? ['#FFDE45', '#FF9F1C'] : ['#10B981', '#34D399']}
          />
          <div>
            <h3 className="text-lg font-black text-[#00426a] uppercase tracking-tight mb-2">גודל שטח האחסון (Storage)</h3>
            <p className="text-xs font-bold text-[#00426a]/60 uppercase tracking-widest">מתוך מכסה של 5 GB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Reads per Minute Chart */}
        <div className="bg-[#f0f8ff]/10 backdrop-blur-md p-8 relative overflow-hidden border border-white/20 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#A2FF00] rounded-full animate-ping" />
              <h3 className="text-lg font-black text-[#00426a] uppercase tracking-tight">קצב קריאות ממסד הנתונים (Live)</h3>
              <div className="gt-info-wrapper">
                <div className="gt-info-icon" style={{ width: '18px', height: '18px', fontSize: '11px', backgroundColor: '#FFDE45', color: '#000' }}>i</div>
                <span className="gt-tooltip" style={{ bottom: '180%', width: '280px', backgroundColor: '#fff', color: '#000', border: '2px solid #000' }}>
                  גרף זה מציג את כמות הבקשות (Requests) שנשלחות למסד הנתונים בזמן אמת, בכל רגע נתון.
                  <br /><br />
                  כל נקודה בגרף מייצגת את מספר המסמכים שנשלפו ב-5 השניות האחרונות. זה עוזר לזהות "פיקים" של פעילות באתר.
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  import('../services/firebase').then(m => m.incrementReadCount(1));
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#007085] to-[#3dbbd3] hover:from-[#005a6a] hover:to-[#3098ad] text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-wider border border-white/10 shadow-lg hover:shadow-xl active:scale-95"
              >
                בצע בדיקת קריאה
              </button>
              <button 
                onClick={() => {
                  import('../services/firebase').then(m => m.incrementWriteCount(1));
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-wider border border-white/10 shadow-lg hover:shadow-xl active:scale-95"
              >
                בצע בדיקת כתיבה
              </button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readHistory} margin={{ top: 10, right: 30, left: 40, bottom: 80 }}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,66,106,0.1)" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#00426a' }}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#00426a' }}
                  domain={[0, yAxisMax]}
                  tickCount={6}
                  allowDecimals={false}
                  minTickGap={10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(240, 248, 255, 0.9)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)', color: '#00426a', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ fontWeight: 900 }}
                  formatter={(value: any, name: any) => [Math.round(value), name === 'reads' ? 'קריאות' : 'כתיבות']}
                />
                <Line 
                  type="monotone" 
                  dataKey="reads" 
                  name="reads"
                  stroke="#0071a1" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#0071a1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="writes" 
                  name="writes"
                  stroke="#f43f5e" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center mt-6 px-4 bg-white/20 p-4 rounded-2xl border border-white/30">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#00426a]/60 uppercase tracking-widest">סה"כ קריאות (Session)</span>
              <span className="text-2xl font-black text-[#00426a]">{liveReads.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest">סה"כ כתיבות (Session)</span>
              <span className="text-2xl font-black text-rose-500">{liveWrites.toLocaleString()}</span>
            </div>
          </div>
          
          {readHistory.every(pt => pt.reads === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[12px] font-black text-[#00426a]/40 uppercase tracking-[0.3em] bg-white/40 px-4 py-2 rounded-full backdrop-blur-sm">
                No active traffic detected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Traffic Area Chart */}
      <div className="bg-[#f0f8ff]/10 backdrop-blur-md p-8 border border-white/20 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-[#00426a] uppercase tracking-tight">תנועת רשת (24 שעות - MB)</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#007085]" />
              <span className="text-[12px] font-black text-[#00426a] uppercase tracking-widest flex items-center gap-1">
                <ArrowDown size={10} /> Incoming
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3dbbd3]" />
              <span className="text-[12px] font-black text-[#00426a] uppercase tracking-widest flex items-center gap-1">
                <ArrowUp size={10} /> Outgoing
              </span>
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bandwidthData} margin={{ top: 10, right: 30, left: 40, bottom: 80 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00426a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00426a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0071a1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0071a1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,66,106,0.1)" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#00426a' }}
                minTickGap={30}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#00426a' }} unit="MB" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(240, 248, 255, 0.9)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)', color: '#00426a', backdropFilter: 'blur(10px)' }}
                itemStyle={{ fontWeight: 900 }}
                formatter={(value: any) => [`${Math.round(value)} MB`]}
              />
              <Area type="monotone" dataKey="in" name="Incoming" stroke="#00426a" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
              <Area type="monotone" dataKey="out" name="Outgoing" stroke="#0071a1" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Import Section */}
      <div className="bg-[#f0f8ff]/10 backdrop-blur-md p-8 border border-white/20 rounded-3xl shadow-xl mt-8">
        <h3 className="text-lg font-black text-[#00426a] uppercase tracking-tight mb-6">ייבוא נתונים חיצוניים</h3>
        <div className="flex gap-4">
          <label className="cursor-pointer bg-[#00426a] text-white px-6 py-3 rounded-xl font-black hover:bg-[#0071a1] transition-colors">
            ייבוא פרטי חברים (CSV/XLS)
            <input type="file" accept=".csv, .xls, .xlsx" className="hidden" onChange={(e) => handleImport(e, 'members')} />
          </label>
          <label className="cursor-pointer bg-[#0071a1] text-white px-6 py-3 rounded-xl font-black hover:bg-[#00426a] transition-colors">
            ייבוא סשנים היסטוריים (CSV/XLS)
            <input type="file" accept=".csv, .xls, .xlsx" className="hidden" onChange={(e) => handleImport(e, 'sessions')} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
