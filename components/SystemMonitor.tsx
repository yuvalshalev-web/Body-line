import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Server, Database, Activity, AlertCircle } from 'lucide-react';
import { getStorageSizeMB } from '../utils/storageStats';
import StorageDisplay from './StorageDisplay';

const SystemMonitor: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [storageSize, setStorageSize] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, realStorageSize] = await Promise.all([
          fetch('/api/stats/system'),
          getStorageSizeMB()
        ]);
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

  if (loading) return <div className="p-8 text-center font-black text-slate-400 animate-pulse">מתחבר לחדר מכונות...</div>;

  const Gauge = ({ value, label, color }: { value: number, label: string, color: string }) => (
    <div className="relative w-32 h-32 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[
              { value: value },
              { value: 100 - value }
            ]}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={55}
            startAngle={180}
            endAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#f1f5f9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
        <span className="text-xl font-black text-slate-900 tabular-nums">{value}%</span>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-mono" dir="rtl">
      {/* Technical Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Server size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">חדר מכונות</h2>
          <p className="text-slate-400 font-bold text-sm">ניטור תשתיות וביצועי מערכת</p>
        </div>
      </div>

      {/* Technical Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <Activity size={20} className="text-[#00FFFF]" />
            <span className="text-[8px] font-black opacity-50 uppercase tracking-widest">Traffic</span>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums">{data.visitors.daily}</p>
            <p className="text-[10px] opacity-50">מבקרים יומיים</p>
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

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <Activity size={20} className="text-emerald-500" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Uptime</span>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-500 tabular-nums">99.9%</p>
            <p className="text-[10px] text-slate-400">זמינות שרת</p>
          </div>
        </div>
      </div>

      {/* Traffic Area Chart */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">תנועת רשת (24 שעות)</h3>
        <div className="h-80">
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

      {/* Performance Gauges */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tight text-center">מדדי ביצועים</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Gauge value={data.performance.server} label="Server Health" color="#60DD8E" />
          <Gauge value={data.performance.db} label="DB Performance" color="#006994" />
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
