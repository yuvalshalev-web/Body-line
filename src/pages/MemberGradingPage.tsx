import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, User, UserCheck, Activity, Target, Zap, Waves, Compass, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import MemberGradingModal from '../components/admin/MemberGradingModal';
import { Member } from '../types';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const MemberGradingPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { members, performanceScores } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = members.filter(m => 
    m.role !== 'Instructor' && m.role !== 'Staff' && 
    (m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate group averages
  const groupAverages = useMemo(() => {
    if (!performanceScores || performanceScores.length === 0) {
      return { paddle: 0, takeOff: 0, turns: 0, positioning: 0, stamina: 0, style: 0 };
    }

    const sums = performanceScores.reduce((acc, score) => {
      acc.paddle += score.paddle || 0;
      acc.takeOff += score.takeOff || 0;
      acc.turns += score.turns || 0;
      acc.positioning += score.positioning || 0;
      acc.stamina += score.stamina || 0;
      acc.style += score.style || 0;
      return acc;
    }, { paddle: 0, takeOff: 0, turns: 0, positioning: 0, stamina: 0, style: 0 });

    const count = performanceScores.length;
    return {
      paddle: sums.paddle / count,
      takeOff: sums.takeOff / count,
      turns: sums.turns / count,
      positioning: sums.positioning / count,
      stamina: sums.stamina / count,
      style: sums.style / count
    };
  }, [performanceScores]);

  const metrics = [
    { id: 'paddle', label: 'יעילות החתירה', value: groupAverages.paddle, icon: Waves, color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/20' },
    { id: 'positioning', label: 'קריאת גלים', value: groupAverages.positioning, icon: Compass, color: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/20' },
    { id: 'takeOff', label: 'Take-off ודרופ', value: groupAverages.takeOff, icon: Zap, color: 'from-sky-400 to-sky-600', shadow: 'shadow-sky-500/20' },
    { id: 'style', label: 'זרימה וחיבור', value: groupAverages.style, icon: Activity, color: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/20' },
    { id: 'turns', label: 'שליטה בציוד', value: groupAverages.turns, icon: Target, color: 'from-violet-400 to-violet-600', shadow: 'shadow-violet-500/20' },
    { id: 'stamina', label: 'חוסן מנטלי', value: groupAverages.stamina, icon: Brain, color: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/20' },
  ];

  const radarData = metrics.map(m => ({
    subject: m.label,
    A: Number(m.value.toFixed(1)),
    fullMark: 10,
  }));

  const getMemberScoreData = (memberId: string) => {
    const memberScores = performanceScores.filter(s => s.memberId === memberId);
    if (memberScores.length === 0) return null;
    memberScores.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    
    const latest = memberScores[0];
    const latestAvg = (latest.paddle + latest.takeOff + latest.turns + latest.positioning + latest.stamina + latest.style) / 6;
    
    let trend: 'up' | 'down' | 'flat' | null = null;
    if (memberScores.length > 1) {
      const previous = memberScores[1];
      const previousAvg = (previous.paddle + previous.takeOff + previous.turns + previous.positioning + previous.stamina + previous.style) / 6;
      if (latestAvg > previousAvg) trend = 'up';
      else if (latestAvg < previousAvg) trend = 'down';
      else trend = 'flat';
    }

    return {
      score: latestAvg.toFixed(1),
      trend
    };
  };

  return (
    <div className="relative min-h-screen luxury-bg text-right space-y-12 pb-20 pt-8" dir="rtl">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-200/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 px-4">
        {/* Header Section */}
        <div className="luxury-card p-6 mb-12 border border-white/40">
          <div className="surfboard-hero-container mb-6 space-y-2 header-wallpaper !py-10 rounded-[2rem]" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
            <div className="header-content-wrapper relative z-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
                <UserCheck size={40} />
              </div>
              <h1 className="main-page-title">
                <span className="surfer-title text-[#121212]">הערכות וביצועים</span>
              </h1>
              <p className="header-subtitle max-w-2xl mx-auto text-[#121212]">
                ניתוח נתונים קבוצתי והערכות אישיות למשתתפי הקהילה 🌊
              </p>
            </div>
          </div>
        </div>

        {/* Group Averages Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Activity size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">ממוצע קבוצתי</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Radar Chart */}
            <div className="luxury-card p-6 lg:col-span-1 flex flex-col items-center justify-center min-h-[350px]">
              <h3 className="text-lg font-bold text-slate-700 mb-4 w-full text-center">מפת ביצועים כוללת</h3>
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid gridType="polygon" stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar name="ממוצע קבוצתי" dataKey="A" stroke="#0ea5e9" fill="#38bdf8" fillOpacity={0.4} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics Bars */}
            <div className="luxury-card p-8 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {metrics.map((metric, idx) => (
                <motion.div 
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center text-white shadow-lg ${metric.shadow}`}>
                        <metric.icon size={16} />
                      </div>
                      <span className="font-bold text-slate-700">{metric.label}</span>
                    </div>
                    <span className="font-black text-slate-900 text-lg">{metric.value.toFixed(1)}<span className="text-xs text-slate-400 font-normal ml-1">/10</span></span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner" dir="ltr">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(metric.value / 10) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + (idx * 0.1), ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${metric.color} rounded-full relative`}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)' }} />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Member List Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
                <User size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">הערכה אישית</h2>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-500/40" />
              <input 
                type="text" 
                placeholder="חיפוש להערכה..." 
                className="w-full pr-12 pl-6 py-4 luxury-card font-bold focus:ring-2 ring-sky-500/30 text-slate-900 placeholder:text-slate-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMembers.map(member => {
              const scoreData = getMemberScoreData(member.id);
              
              return (
                <motion.div 
                  key={member.id}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="luxury-card p-5 cursor-pointer group transition-all hover:border-sky-500/30 flex flex-col items-center relative overflow-hidden"
                  onClick={() => setSelectedMember(member)}
                >
                  {/* Decorative background element */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-sky-100 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative mb-4 mt-2">
                    <div className="absolute -inset-2 bg-gradient-to-br from-sky-400/20 to-transparent rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    {member.avatar ? (
                      <img 
                        src={member.avatar}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-white shadow-md relative z-10"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full mx-auto bg-sky-50 flex items-center justify-center text-sky-500 border-2 border-white shadow-md relative z-10">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-black text-slate-900 text-lg group-hover:text-sky-600 transition-colors text-center w-full truncate">
                    {member.firstName} {member.lastName}
                  </h3>
                  
                  <div className="mt-4 w-full pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      ציון אחרון
                    </span>
                    {scoreData ? (
                      <div className="flex items-center gap-2">
                        {scoreData.trend === 'up' && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-500">
                            <TrendingUp size={14} strokeWidth={3} />
                          </div>
                        )}
                        {scoreData.trend === 'down' && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-500">
                            <TrendingDown size={14} strokeWidth={3} />
                          </div>
                        )}
                        {scoreData.trend === 'flat' && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 text-slate-400">
                            <Minus size={14} strokeWidth={3} />
                          </div>
                        )}
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-black text-sm border border-sky-100">
                          {scoreData.score}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 font-bold text-xs border border-amber-100">
                        טרם הוערך
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedMember && (
        <MemberGradingModal 
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          member={selectedMember}
        />
      )}
    </div>
  );
};

export default MemberGradingPage;
