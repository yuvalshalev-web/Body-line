import React, { useEffect, useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Server, Database, Activity, AlertCircle, Power, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { getStorageSizeMB } from '../utils/storageStats';
import StorageDisplay from './StorageDisplay';
import { sessionReadCount } from '../services/firebase';

const SystemMonitor: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [storageSize, setStorageSize] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [liveReads, setLiveReads] = useState(sessionReadCount);
  const [readHistory, setReadHistory] = useState<{ time: string, reads: number }[]>([]);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(() => {
    return localStorage.getItem('kill_switch_active') === 'true';
  });

  useEffect(() => {
    const handleReadUpdate = (e: any) => {
      setLiveReads(e.detail);
    };
    window.addEventListener('db-read-update', handleReadUpdate);
    return () => window.removeEventListener('db-read-update', handleReadUpdate);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      setReadHistory(prev => {
        const newHistory = [...prev, { time: timeStr, reads: liveReads }];
        if (newHistory.length > 20) return newHistory.slice(1);
        return newHistory;
      });
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [liveReads]);

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

  const toggleKillSwitch = () => {
    const newState = !isKillSwitchActive;
    setIsKillSwitchActive(newState);
    localStorage.setItem('kill_switch_active', String(newState));
    // In a real app, this would be checked in the firebase service
    window.location.reload(); // Force reload to apply switch
  };

  if (loading) return <div className="p-8 text-center font-black text-slate-400 animate-pulse">מתחבר לחדר מכונות...</div>;

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
    <div className="space-y-8 animate-in fade-in duration-700 font-mono min-h-[400px]" dir="rtl">
      {/* Technical Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Server size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">חדר מכונות</h2>
            <p className="text-slate-400 font-bold text-sm">ניטור תשתיות וביצועי מערכת</p>
          </div>
        </div>

        <button 
          onClick={toggleKillSwitch}
          className={`relative group flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-sm transition-all border-4 overflow-hidden ${
            isKillSwitchActive 
              ? 'bg-rose-700 text-white border-rose-400 shadow-[0_0_50px_rgba(225,29,72,0.8)]' 
              : 'bg-white text-rose-600 border-rose-600 hover:bg-rose-600 hover:text-white shadow-[0_0_20px_rgba(225,29,72,0.2)]'
          }`}
          title="Emergency Database Shutdown"
        >
          {/* Hazard Stripes Background for Active State */}
          {isKillSwitchActive && (
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ 
                   backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)',
                   backgroundSize: '20px 20px'
                 }} 
            />
          )}
          
          <div className="relative z-10 flex items-center gap-3">
            {isKillSwitchActive ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <ShieldAlert size={24} className="text-white" />
              </motion.div>
            ) : (
              <AlertCircle size={24} className="group-hover:animate-ping" />
            )}
            
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-1">Emergency Protocol</span>
              <span className="text-lg tracking-tighter">
                {isKillSwitchActive ? 'SYSTEM OFFLINE' : 'KILL SWITCH'}
              </span>
            </div>
          </div>

          {/* Pulse Ring for Active State */}
          {isKillSwitchActive && (
            <div className="absolute inset-0 border-4 border-white/30 rounded-2xl animate-ping pointer-events-none" />
          )}
        </button>
      </div>

      {liveReads > 1000 && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 text-rose-600 animate-pulse">
          <ShieldAlert size={24} />
          <p className="font-black text-sm">⚠️ High Read Traffic detected in this session!</p>
        </div>
      )}

      {/* Technical Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <Database size={20} className="text-[#00FFFF]" />
            <span className="text-[8px] font-black opacity-50 uppercase tracking-widest">Live Quota</span>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums">{liveReads.toLocaleString()}</p>
            <p className="text-[10px] opacity-50">Database Usage (Live)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <Database size={20} className="text-[#006994]" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Database</span>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tabular-nums">{data.dbSize}MB</p>
            <p className="text-[10px] text-slate-400">נפח מסד נתונים</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <StorageDisplay />
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <AlertCircle size={20} className="text-rose-500" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Errors</span>
          </div>
          <div>
            <p className="text-3xl font-black text-rose-500 tabular-nums">{(data.errorRate * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-slate-400">קצב שגיאות API</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quota Gauge */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tight text-center">שימוש במכסה יומית (חינם)</h3>
          <Gauge 
            value={quotaPercentage} 
            label="Daily Quota Used" 
            color={quotaPercentage > 80 ? '#f43f5e' : quotaPercentage > 50 ? '#f59e0b' : '#006994'} 
            sublabel={`מתוך ${quotaLimit.toLocaleString()} קריאות`}
          />
        </div>

        {/* Reads per Minute Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">קצב קריאות (Live)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#00FFFF', fontWeight: 900 }}
                />
                <Line type="monotone" dataKey="reads" stroke="#006994" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Traffic Area Chart */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">תנועת רשת (24 שעות)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.traffic} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006994" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#006994" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#00FFFF', fontWeight: 900 }}
              />
              <Area type="monotone" dataKey="value" stroke="#006994" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
