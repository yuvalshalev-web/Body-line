import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, TrendingUp, UserPlus, Calendar, ArrowLeft } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const CommunityAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { members, weeklyHistory } = useData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats/community')
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching community stats:', err);
        setLoading(false);
      });
  }, []);

  const activeMembersCount = members.filter(m => m.isActive).length;
  
  // New joiners in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newJoinersCount = members.filter(m => {
    if (!m.joinedAt) return false;
    // Try to parse he-IL date "DD.MM.YYYY"
    const parts = m.joinedAt.split('.');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return date >= thirtyDaysAgo;
    }
    // Fallback for other formats
    const date = new Date(m.joinedAt);
    return !isNaN(date.getTime()) && date >= thirtyDaysAgo;
  }).length;

  // Sessions this year
  const currentYear = new Date().getFullYear();
  const sessionsThisYear = weeklyHistory.filter(s => {
    if (!s.date || (s.participantsCount || 0) === 0) return false;
    const date = s.date.toDate ? s.date.toDate() : new Date(s.date);
    return date.getFullYear() === currentYear;
  }).length;

  if (loading) return <div className="p-8 text-center font-black text-[#006994] animate-pulse">טוען דופק קהילה...</div>;

  const COLORS = ['#006994', '#40E0D0', '#4E8294', '#60DD8E'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-[#006994] rounded-2xl flex items-center justify-center text-white shadow-lg">
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-[#006994] tracking-tight">דופק הקהילה</h2>
          <p className="text-slate-400 font-bold text-sm">מגמות צמיחה ונוכחות מאקרו</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#006994]">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">חברים פעילים</p>
            <p className="text-2xl font-black text-[#006994] tabular-nums">{activeMembersCount.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מצטרפים חדשים (30 יום)</p>
            <p className="text-2xl font-black text-emerald-600 tabular-nums">+{newJoinersCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סשנים השנה</p>
            <p className="text-2xl font-black text-amber-600 tabular-nums">{sessionsThisYear}</p>
          </div>
        </div>

        {/* New Action Card */}
        <button 
          onClick={() => navigate('/session-stats')}
          className="bg-gradient-to-br from-[#006994] to-[#4E8294] p-6 rounded-[2rem] shadow-lg shadow-[#006994]/20 flex items-center justify-between group hover:scale-[1.02] transition-all text-right"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">ניתוח עומק</p>
              <p className="text-xl font-black text-white">צוללים לסשנים</p>
            </div>
          </div>
          <ArrowLeft className="text-white opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
        </button>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-[#006994] mb-6">צמיחת הקהילה (חדשים מול ותיקים)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.growth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 900 }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                <Bar dataKey="veterans" name="ותיקים" fill="#006994" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="new" name="חדשים" fill="#40E0D0" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Venn Representation (Simplified as Pie for now) */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-[#006994] mb-6">חפיפת פעילויות</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'גלישה בלבד', value: data.venn.surfing - data.venn.overlap },
                    { name: 'חברתי בלבד', value: data.venn.social - data.venn.overlap },
                    { name: 'משולב', value: data.venn.overlap },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 900 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityAnalytics;
