import React, { useEffect, useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Server, Database, Activity, AlertCircle, Power, ShieldAlert, Info, RefreshCw, ArrowDown, ArrowUp, Skull, TriangleAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { getStorageSizeMB } from '../utils/storageStats';
import StorageDisplay from './StorageDisplay';
import { sessionReadCount } from '../services/firebase';
import { useData } from '../contexts/DataContext';
import { get24hBandwidth } from '../utils/bandwidthTracker';

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
              className="gauge-percentage-neon transform rotate-90 fill-[#2D3748]"
              style={{ transformOrigin: '50px 50px' }}
            >
              {displayValue.toFixed(0)}%
            </text>
            <text
              x="50"
              y="75"
              textAnchor="middle"
              className="gauge-label-neon transform rotate-90 fill-[#4A5568]"
              style={{ transformOrigin: '50px 50px' }}
            >
              {label}
            </text>
          </svg>
        </div>
        <p className="text-[10px] font-black text-[#4A5568] mt-4 tabular-nums uppercase tracking-widest">
          {sublabel}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${animateClass || ''}`}>
      <div className="glass-gauge-container">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="50%" stopColor={gradient[1]}>
                <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor={gradient[0]} />
            </linearGradient>
            
            <filter id={`glow-${id}`}>
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background Ring (Track) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="10"
            fill="transparent"
          />
          
          {/* Progress Ring (Fill) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={`url(#grad-${id})`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className={`gauge-ring-fill ${ringClass || ''}`}
            style={{ 
              filter: isHigh ? 'brightness(1.1) saturate(120%)' : `url(#glow-${id})`
            }}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="gauge-value text-[#2D3748]">
            {displayValue.toFixed(0)}%
          </span>
          <span className="text-[9px] font-black text-[#4A5568] uppercase tracking-[0.2em] mt-1">
            {label}
          </span>
        </div>
      </div>
      <p className="text-[10px] font-black text-[#4A5568] mt-6 tabular-nums uppercase tracking-widest">
        {sublabel}
      </p>
    </div>
  );
};

const SystemMonitor: React.FC = () => {
  const { dbStatus, toggleDbStatus } = useData();
  const [designMode, setDesignMode] = useState<'classic' | 'neon'>('classic');
  const [data, setData] = useState<any>({
    dbSize: 0,
    errorRate: 0,
    traffic: []
  });
  const [storageSize, setStorageSize] = useState<number>(0);
  const [loading, setLoading] = useState(true);
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
    const fetchStats = async () => {
      try {
        const [statsRes, realStorageSize] = await Promise.all([
          fetch('/api/stats/system'),
          getStorageSizeMB()
        ]);
        
        if (!statsRes.ok) throw new Error(`Server error: ${statsRes.status}`);
        
        const statsJson = await statsRes.json();
        setData(statsJson);
        setStorageSize(realStorageSize);
      } catch (err) {
        console.error('Error fetching system stats:', err);
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

  if (loading && !data.traffic.length) return <div className="p-8 text-center font-black text-[#4A5568] animate-pulse">מתחבר לחדר מכונות...</div>;

  const quotaLimit = 50000;
  const quotaPercentage = Math.min(100, Math.round((liveReads / quotaLimit) * 100));

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
            startAngle={180}
            endAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#f1f5f9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
        <span className="text-3xl font-black text-slate-900 tabular-nums">{value}%</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        {sublabel && <span className="text-[8px] text-slate-300 mt-1">{sublabel}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 min-h-[400px]" dir="rtl">
      {/* Unified Header */}
      <div className="flex flex-col items-center text-center mb-16 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F5F7FA] text-[#2D3748] text-[10px] font-black rounded-full shadow-soft border border-slate-200">
          <Activity size={12} className="text-[#1A365D]" />
          <span>SYSTEM DIVE ANALYTICS</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-[#2D3748] tracking-tighter leading-none uppercase">
          חדר מכונות
        </h1>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[#4A5568] max-w-2xl text-xl font-bold">
            ניטור תשתיות וביצועי מערכת בזמן אמת. כל המדדים הקריטיים תחת שליטה מלאה ⚙️
          </p>
          
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => {
                setLoading(true);
                const fetchStats = async () => {
                  try {
                    const [statsRes, realStorageSize] = await Promise.all([
                      fetch('/api/stats/system'),
                      getStorageSizeMB()
                    ]);
                    if (!statsRes.ok) throw new Error(`Server error: ${statsRes.status}`);
                    const statsJson = await statsRes.json();
                    setData(statsJson);
                    setStorageSize(realStorageSize);
                  } catch (err) {
                    console.error('Error fetching system stats:', err);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchStats();
              }}
              className="p-1.5 bg-[#F5F7FA] hover:bg-slate-200 rounded-full text-[#4A5568] hover:text-[#2D3748] transition-all border border-slate-200"
              title="Refresh Stats"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Emergency Button - Centered Push Button Style (Resized to be ~20% smaller than gauges) */}
        <div className="w-full flex justify-center pt-4 pb-8">
          <div className="relative group">
            {/* Outer Ring/Base of the button */}
            <div className="absolute -inset-4 bg-slate-300 rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.2),0_10px_20px_rgba(0,0,0,0.1)] border border-slate-400" />
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.9, y: 8, boxShadow: '0px 2px 5px rgba(0,0,0,0.5)' }}
              animate={isKillSwitchActive || countdown !== null ? {
                filter: ["brightness(1)", "brightness(1.8)", "brightness(1)"],
                scale: [1, 0.95, 1],
                boxShadow: [
                  '0_15px_0_rgb(153,0,0),0_25px_50px_rgba(255,0,0,0.5)',
                  '0_15px_0_rgb(153,0,0),0_40px_80px_rgba(255,0,0,0.8)',
                  '0_15px_0_rgb(153,0,0),0_25px_50px_rgba(255,0,0,0.5)'
                ]
              } : {}}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              onClick={handleButtonClick}
              className={`relative w-32 h-32 rounded-full font-black text-[9px] transition-all duration-300 flex flex-col items-center justify-center p-4 text-center shadow-[0_15px_0_rgb(153,0,0),0_25px_50px_rgba(0,0,0,0.4)] border-4 border-[#CC0000] bg-[#FF0000] text-white`}
              style={{ 
                transformStyle: 'preserve-3d',
              }}
              title={isKillSwitchActive ? "Reconnect to database" : countdown !== null ? "Click to Abort Shutdown" : "Emergency Database Shutdown"}
            >
              {/* Glass Shine Effect */}
              <div className="absolute top-2 left-4 right-4 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full pointer-events-none" />
              
              {/* Inner Bezel */}
              <div className="absolute inset-2 rounded-full border-2 border-white/10 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center gap-1">
                {isKillSwitchActive ? (
                  <>
                    <RefreshCw size={24} className="animate-spin mb-1" />
                    <span className="leading-tight uppercase tracking-tighter">RECONNECTING...</span>
                  </>
                ) : countdown !== null ? (
                  <>
                    <TriangleAlert size={24} className="animate-pulse text-yellow-300 mb-1" />
                    <span className="text-2xl font-black leading-none">{countdown}</span>
                    <Skull size={20} className="animate-bounce mt-1" />
                  </>
                ) : (
                  <>
                    <TriangleAlert size={28} className="group-hover:scale-110 transition-transform mb-1" />
                    <span className="leading-tight uppercase font-black tracking-tighter">EMERGENCY<br/>SHUTDOWN</span>
                    <Skull size={24} className="group-hover:rotate-12 transition-transform mt-1" />
                  </>
                )}
              </div>

              {/* Intense Danger Glow for Active State */}
              {(isKillSwitchActive || countdown !== null) && (
                <div className="absolute inset-0 bg-white animate-pulse opacity-20 rounded-full" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-[0_0_100px_rgba(255,0,0,0.3)] overflow-hidden animate-in zoom-in-95 flex flex-col border-4 border-[#FF0000]" dir="rtl">
            <div className="bg-[#FF0000] p-8 text-white flex items-center gap-4 relative overflow-hidden">
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
                <p className="text-slate-900 font-black text-lg leading-tight">
                  האם אתה בטוח שברצונך להשבית את מסד הנתונים?
                </p>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-2">
                  <p className="text-[#FF0000] text-sm font-bold flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>פעולה זו תנתק את כל המשתמשים המחוברים ותחסום כל גישה למידע באתר.</span>
                  </p>
                  <p className="text-[#FF0000] text-sm font-bold flex items-start gap-2">
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
                  className="flex-1 py-4 bg-[#FF0000] text-white rounded-2xl font-black text-lg hover:bg-[#CC0000] transition-all shadow-[0_10px_30px_rgba(255,0,0,0.4)] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Skull size={20} />
                  אישור (הפעל טיימר)
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all active:scale-95"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {liveReads > 1000 && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 text-[#FF0000] animate-pulse">
          <ShieldAlert size={24} />
          <p className="font-black text-sm">⚠️ High Read Traffic detected in this session!</p>
        </div>
      )}

      {/* Health-Check Matrix (2x2 Grid) */}
      <div className={`${designMode === 'neon' ? 'dashboard-container-neon' : 'bg-[#F5F7FA] border border-slate-200 rounded-[3rem] p-12'} mb-12 shadow-soft relative`}>
        {/* Design Toggle */}
        <button 
          onClick={() => setDesignMode(prev => prev === 'classic' ? 'neon' : 'classic')}
          className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white/80 rounded-full text-[#4A5568] hover:text-[#2D3748] transition-all z-50 border border-slate-200"
          title="Switch Design Mode"
        >
          <RefreshCw size={16} className={designMode === 'neon' ? 'rotate-180' : ''} />
        </button>

        <div className={designMode === 'neon' ? '' : 'grid grid-cols-2 gap-12'}>
          {/* 1. Database Usage (Azure/Cyan) */}
          {(() => {
            const dbQuotaMB = 1024;
            const dbSizeMB = Number(data.dbSize) || 0;
            const percentage = Math.min((dbSizeMB / dbQuotaMB) * 100, 100);
            const isHigh = percentage > 85;
            
            return (
              <CircularRing 
                mode={designMode}
                value={percentage}
                label="Database"
                sublabel={`${dbSizeMB.toFixed(2)} MB / ${dbQuotaMB} MB`}
                gradient={isHigh ? ['#2D3748', '#1A365D'] : ['#1A365D', '#63B3ED']}
                ringClass={designMode === 'neon' ? 'gauge-db' : ''}
                animateClass="animate-breathing"
              />
            );
          })()}

          {/* 2. System Status (Live Quota - Emerald/Spring) */}
          {(() => {
            const percentage = Math.min((liveReads / quotaLimit) * 100, 100);
            
            return (
              <CircularRing 
                mode={designMode}
                value={percentage}
                label="System Status"
                sublabel={`${liveReads.toLocaleString()} / ${quotaLimit.toLocaleString()} Reads`}
                gradient={['#38B2AC', '#4FD1C5']}
                ringClass={designMode === 'neon' ? 'gauge-sys' : ''}
                animateClass="animate-breathing"
              />
            );
          })()}

          {/* 3. Memory/Resource Load (Storage - Amber/Sun) */}
          {(() => {
            const quotaMB = 1000;
            const sizeMB = Number(storageSize) || 0;
            const percentage = Math.min((sizeMB / quotaMB) * 100, 100);
            const isHigh = percentage > 70;
            
            return (
              <CircularRing 
                mode={designMode}
                value={percentage}
                label="Resources"
                sublabel={`${sizeMB.toFixed(2)} MB / ${quotaMB} MB`}
                gradient={['#D69E2E', '#F6E05E']}
                ringClass={designMode === 'neon' ? 'gauge-res' : ''}
                animateClass="animate-breathing"
                isHigh={isHigh}
              />
            );
          })()}

          {/* 4. Errors/Security (Crimson/Ruby) */}
          {(() => {
            const percentage = Math.min(data.errorRate * 100, 100);
            const hasErrors = percentage > 0;
            
            return (
              <CircularRing 
                mode={designMode}
                value={percentage}
                label="Security"
                sublabel={`${percentage.toFixed(2)}% Error Rate`}
                gradient={['#E53E3E', '#FC8181']}
                ringClass={designMode === 'neon' ? 'gauge-err' : ''}
                animateClass={hasErrors ? 'animate-shake' : 'animate-breathing'}
              />
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Reads per Minute Chart */}
        <div className="bg-[#F5F7FA] p-8 rounded-[3rem] border border-slate-200 shadow-soft relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <h3 className="text-lg font-black text-[#2D3748] uppercase tracking-tight">קצב קריאות ממסד הנתונים (Live)</h3>
              <div className="gt-info-wrapper">
                <div className="gt-info-icon" style={{ width: '18px', height: '18px', fontSize: '11px' }}>i</div>
                <span className="gt-tooltip" style={{ bottom: '180%', width: '280px' }}>
                  גרף זה מציג את כמות הבקשות (Requests) שנשלחות למסד הנתונים בזמן אמת, בכל רגע נתון.
                  <br /><br />
                  כל נקודה בגרף מייצגת את מספר המסמכים שנשלפו ב-5 השניות האחרונות. זה עוזר לזהות "פיקים" של פעילות באתר.
                </span>
              </div>
            </div>
            
            {/* Simulation Button for testing */}
            <button 
              onClick={() => {
                // Simulate a read by dispatching the event that the monitor listens to
                // and incrementing the local count for the UI
                const fakeTotal = liveReads + Math.floor(Math.random() * 5) + 1;
                window.dispatchEvent(new CustomEvent('db-read-update', { detail: fakeTotal }));
                // We also need to update the global variable if we want it to persist in this session
                // but for simulation, the event is enough to trigger the graph
              }}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-[#4A5568] text-[10px] font-black rounded-lg transition-colors uppercase tracking-wider border border-slate-200"
            >
              בצע בדיקת קריאה
            </button>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readHistory} margin={{ top: 10, right: 30, left: 40, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#4A5568' }}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#4A5568' }}
                  domain={[0, 'auto']}
                  allowDecimals={false}
                  minTickGap={10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#2D3748', borderRadius: '1rem', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#63B3ED', fontWeight: 900 }}
                  formatter={(value: any) => [Math.round(value), 'קריאות']}
                />
                <Line 
                  type="monotone" 
                  dataKey="reads" 
                  stroke="#1A365D" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#1A365D', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {readHistory.every(pt => pt.reads === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm">
                No active traffic detected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Traffic Area Chart */}
      <div className="bg-[#F5F7FA] p-8 rounded-[3rem] border border-slate-200 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-[#2D3748] uppercase tracking-tight">תנועת רשת (24 שעות - MB)</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1A365D]" />
              <span className="text-[10px] font-black text-[#4A5568] uppercase tracking-widest flex items-center gap-1">
                <ArrowDown size={10} /> Incoming
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#38B2AC]" />
              <span className="text-[10px] font-black text-[#4A5568] uppercase tracking-widest flex items-center gap-1">
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
                  <stop offset="5%" stopColor="#1A365D" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1A365D" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38B2AC" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38B2AC" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#4A5568' }}
                minTickGap={30}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#4A5568' }} unit="MB" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#2D3748', borderRadius: '1rem', border: 'none', color: '#fff' }}
                itemStyle={{ fontWeight: 900 }}
                formatter={(value: any) => [`${Math.round(value)} MB`]}
              />
              <Area type="monotone" dataKey="in" name="Incoming" stroke="#1A365D" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
              <Area type="monotone" dataKey="out" name="Outgoing" stroke="#38B2AC" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
