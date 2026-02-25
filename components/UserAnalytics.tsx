import React, { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Waves, Zap, Trophy, Flame } from 'lucide-react';
import { motion } from 'motion/react';

const UserAnalytics: React.FC<{ userId: string }> = ({ userId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stats/user/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching user stats:', err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="p-8 text-center font-black text-[#40E0D0] animate-pulse">טוען את הגל שלך...</div>;

  const COLORS = ['#006994', '#40E0D0'];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700" dir="rtl">
      {/* Mobile-First Header */}
      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <div className="w-20 h-20 bg-gradient-to-br from-[#006994] to-[#40E0D0] rounded-3xl flex items-center justify-center text-white shadow-xl rotate-3">
          <Waves size={40} />
        </div>
        <div>
          <h2 className="text-4xl font-black text-[#006994] tracking-tighter">הגל שלי</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
              {data.rank}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-center"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#006994] mx-auto mb-3">
            <Zap size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">סך הכל ים</p>
          <p className="text-3xl font-black text-[#006994] tabular-nums">{data.attendance.sea}</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-center"
        >
          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-3">
            <Flame size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">רצף שבועי</p>
          <p className="text-3xl font-black text-orange-500 tabular-nums">{data.streak}</p>
        </motion.div>
      </div>

      {/* Progress Circles */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-[#006994] mb-8 text-center flex items-center justify-center gap-2">
          <Trophy size={20} className="text-amber-500" />
          התקדמות אישית
        </h3>
        
        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          {data.progress.map((item: any, idx: number) => (
            <div key={idx} className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: item.value },
                      { value: 100 - item.value }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill={item.color} />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 tabular-nums">{item.value}%</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar Chart for Skills (Mocked for visual impact) */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-[#006994] mb-6 text-center">פרופיל גולש</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
              { subject: 'טכניקה', A: 120, fullMark: 150 },
              { subject: 'כוח', A: 98, fullMark: 150 },
              { subject: 'סיבולת', A: 86, fullMark: 150 },
              { subject: 'קריאת ים', A: 99, fullMark: 150 },
              { subject: 'חברתי', A: 85, fullMark: 150 },
            ]}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
              <Radar name="גולש" dataKey="A" stroke="#006994" fill="#006994" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;
