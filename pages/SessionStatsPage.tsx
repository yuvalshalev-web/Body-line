
import React, { useState, useMemo } from 'react';
import { 
  Waves, 
  Users, 
  TrendingUp, 
  Award, 
  BarChart3,
  Loader2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import Chart from 'react-apexcharts';

const SessionStatsPage: React.FC = () => {
  const { members, weeklyHistory, yearConfig, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [gritSearchTerm, setGritSearchTerm] = useState('');
  const [ageView, setAgeView] = useState<'annual' | 'monthly' | 'lastSession'>('annual');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [gritSortConfig, setGritSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'streak',
    direction: 'desc'
  });

  const stats = useMemo(() => {
    if (!weeklyHistory || weeklyHistory.length === 0 || !yearConfig) return null;

    const now = new Date();
    // 1. Filter sessions by Shnat Hevel Zug start date
    const startDate = new Date(yearConfig.startDate);
    const filteredSessions = weeklyHistory
      .filter(session => {
        const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
        return sessionDate >= startDate && sessionDate <= now && (session.participantsCount || 0) > 0;
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    if (filteredSessions.length === 0) return null;

    // 2. Attendance Trend (First Half vs Second Half)
    const midPoint = Math.ceil(filteredSessions.length / 2);
    const firstHalf = filteredSessions.slice(0, midPoint);
    const secondHalf = filteredSessions.slice(midPoint);

    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((acc, s) => acc + s.participantsCount, 0) / firstHalf.length 
      : 0;
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((acc, s) => acc + s.participantsCount, 0) / secondHalf.length 
      : 0;
    
    const globalTrend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'neutral';
    const trendPercentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    // 3. Member Specific Stats & Trends
    const memberStatsMap: Record<string, { total: number, firstHalf: number, secondHalf: number, streak: number }> = {};
    
    // Sort sessions descending for streak calculation
    const sortedSessionsDesc = [...filteredSessions].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    // Initialize map and calculate streaks
    members.forEach(member => {
      let streak = 0;
      for (const session of sortedSessionsDesc) {
        if ((session.participantIds || []).includes(member.id)) {
          streak++;
        } else {
          break;
        }
      }
      memberStatsMap[member.id] = { total: 0, firstHalf: 0, secondHalf: 0, streak };
    });

    filteredSessions.forEach((session, idx) => {
      const isFirstHalf = idx < midPoint;
      (session.participantIds || []).forEach((uid: string) => {
        if (memberStatsMap[uid]) {
          memberStatsMap[uid].total++;
          if (isFirstHalf) memberStatsMap[uid].firstHalf++;
          else memberStatsMap[uid].secondHalf++;
        }
      });
    });

    let processedUsersCount = 0;
    const processedMembers = [];
    for (const member of members) {
      processedUsersCount++;
      if (processedUsersCount > 150) break; // Safety cap for user mapping

      const mStats = memberStatsMap[member.id] || { total: 0, firstHalf: 0, secondHalf: 0, streak: 0 };
      
      // Personal Trend: comparing frequency in first half vs second half
      const firstHalfFreq = firstHalf.length > 0 ? mStats.firstHalf / firstHalf.length : 0;
      const secondHalfFreq = secondHalf.length > 0 ? mStats.secondHalf / secondHalf.length : 0;
      
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (secondHalfFreq > firstHalfFreq + 0.05) trend = 'up';
      else if (secondHalfFreq < firstHalfFreq - 0.05) trend = 'down';

      processedMembers.push({
        ...member,
        totalAttendance: mStats.total,
        streak: mStats.streak,
        trend
      });
    }
    processedMembers.sort((a, b) => b.totalAttendance - a.totalAttendance);

    // 4. Segmentation
    const segmentation = [
      { name: 'Regulars (5+)', value: processedMembers.filter(m => m.totalAttendance >= 5).length, color: '#006994' },
      { name: 'Steady (2-4)', value: processedMembers.filter(m => m.totalAttendance >= 2 && m.totalAttendance <= 4).length, color: '#40E0D0' },
      { name: 'One-timers (1)', value: processedMembers.filter(m => m.totalAttendance === 1).length, color: '#94a3b8' },
    ].filter(s => s.value > 0);

    // 5. Age-based Statistics
    const calculateAge = (birthday?: string) => {
      if (!birthday) return null;
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const ageGroupsBase = [
      { label: '18–24', min: 18, max: 24, color: '#006994' },
      { label: '25–34', min: 25, max: 34, color: '#40E0D0' },
      { label: '35–44', min: 35, max: 44, color: '#6366f1' },
      { label: '45–54', min: 45, max: 54, color: '#f59e0b' },
      { label: '55–64', min: 55, max: 64, color: '#ec4899' },
      { label: '65+', min: 65, max: 120, color: '#94a3b8' },
    ];

    // Last Month Sessions
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthSessions = filteredSessions.filter(s => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      return d >= oneMonthAgo;
    });

    // Age Mapping (Local Map for efficiency)
    const ageMap = new Map<string, string | null>();
    members.forEach(m => {
      const age = calculateAge(m.birthday);
      if (age === null) {
        ageMap.set(m.id, null);
      } else {
        const group = ageGroupsBase.find(g => age >= g.min && age <= g.max);
        ageMap.set(m.id, group?.label || null);
      }
    });

    const ageStackedData = [
      { name: 'חודש אחרון' },
      { name: 'מתחילת שנה' }
    ] as any[];

    ageGroupsBase.forEach(group => {
      // Monthly
      const monthlyCount = lastMonthSessions.reduce((acc, session) => {
        const count = (session.participantIds || []).filter((uid: string) => ageMap.get(uid) === group.label).length;
        return acc + count;
      }, 0);
      
      // Yearly
      const yearlyCount = filteredSessions.reduce((acc, session) => {
        const count = (session.participantIds || []).filter((uid: string) => ageMap.get(uid) === group.label).length;
        return acc + count;
      }, 0);

      ageStackedData[0][group.label] = monthlyCount;
      ageStackedData[1][group.label] = yearlyCount;
    });

    // 6. Radial Bar Data (Age Attendance Rate)
    const membersByAge: Record<string, number> = {};
    ageGroupsBase.forEach(g => {
      membersByAge[g.label] = members.filter(m => ageMap.get(m.id) === g.label).length;
    });

    const radialStats = {
      annual: {} as Record<string, number>,
      monthly: {} as Record<string, number>,
      lastSession: {} as Record<string, number>
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const lastSession = filteredSessions[filteredSessions.length - 1];
    const lastSessionDate = lastSession ? (lastSession.date?.toDate ? lastSession.date.toDate() : new Date(lastSession.date)) : null;

    ageGroupsBase.forEach(group => {
      radialStats.annual[group.label] = 0;
      radialStats.monthly[group.label] = 0;
      radialStats.lastSession[group.label] = 0;
    });

    filteredSessions.forEach(session => {
      const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
      const isMonthly = sessionDate >= thirtyDaysAgo;
      const isLast = lastSessionDate && sessionDate.getTime() === lastSessionDate.getTime();

      (session.participantIds || []).forEach((memberId: string) => {
        const groupLabel = ageMap.get(memberId);
        if (groupLabel && radialStats.annual[groupLabel] !== undefined) {
          radialStats.annual[groupLabel]++;
          if (isMonthly) radialStats.monthly[groupLabel]++;
          if (isLast) radialStats.lastSession[groupLabel]++;
        }
      });
    });

    const totalSessionsCount = filteredSessions.length;
    const monthlySessionsCount = filteredSessions.filter(s => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      return d >= thirtyDaysAgo;
    }).length;

    const radialPercentages = ageGroupsBase.map(group => {
      const potentialAnnual = (membersByAge[group.label] || 0) * totalSessionsCount;
      const potentialMonthly = (membersByAge[group.label] || 0) * monthlySessionsCount;
      const potentialLast = (membersByAge[group.label] || 0);

      return {
        group: group.label,
        color: group.color,
        annual: potentialAnnual > 0 ? parseFloat(((radialStats.annual[group.label] / potentialAnnual) * 100).toFixed(1)) : 0,
        monthly: potentialMonthly > 0 ? parseFloat(((radialStats.monthly[group.label] / potentialMonthly) * 100).toFixed(1)) : 0,
        lastSessionCount: radialStats.lastSession[group.label],
        lastSessionPercent: potentialLast > 0 ? parseFloat(((radialStats.lastSession[group.label] / potentialLast) * 100).toFixed(1)) : 0
      };
    });

    // Total counts for hollow center
    const totalAnnualParticipants = filteredSessions.reduce((acc, s) => acc + (s.participantIds?.length || 0), 0);
    const totalMonthlyParticipants = filteredSessions.filter(s => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      return d >= thirtyDaysAgo;
    }).reduce((acc, s) => acc + (s.participantIds?.length || 0), 0);
    const totalLastParticipants = lastSession?.participantIds?.length || 0;

    const radialSummary = {
      annual: totalAnnualParticipants,
      monthly: totalMonthlyParticipants,
      lastSession: totalLastParticipants
    };

    // 7. Pulse Data (Full timeline from startDate to lastSessionDate)
    const pulseData = [];
    if (filteredSessions.length > 0) {
      const lastSession = filteredSessions[filteredSessions.length - 1];
      const lastSessionDate = lastSession.date?.toDate ? lastSession.date.toDate() : new Date(lastSession.date);
      
      const sessionMap = new Map<string, number>();
      filteredSessions.forEach(s => {
        const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        sessionMap.set(d.toDateString(), s.participantsCount || 0);
      });

      let iter = new Date(startDate);
      iter.setHours(0, 0, 0, 0);
      const end = new Date(lastSessionDate);
      end.setHours(23, 59, 59, 999);
      
      let safety = 0;
      while (iter <= end && safety < 400) {
        // We only show Thursdays (day 4) as those are the session days
        if (iter.getDay() === 4) {
          pulseData.push({
            date: iter.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
            count: sessionMap.get(iter.toDateString()) || 0
          });
        }
        iter.setDate(iter.getDate() + 1);
        safety++;
      }
    }

    const filteredGrit = processedMembers.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(gritSearchTerm.toLowerCase())
    );

    const gritLeaderboard = [...filteredGrit]
      .sort((a, b) => {
        const aValue = a[gritSortConfig.key as keyof typeof a];
        const bValue = b[gritSortConfig.key as keyof typeof b];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return gritSortConfig.direction === 'desc' ? bValue - aValue : aValue - bValue;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return gritSortConfig.direction === 'desc' 
          ? bStr.localeCompare(aStr) 
          : aStr.localeCompare(bStr);
      })
      .slice(0, 50);

    return {
      totalSessions: filteredSessions.length,
      totalAttendance: filteredSessions.reduce((acc, s) => acc + s.participantsCount, 0),
      avgAttendance: Math.round(filteredSessions.reduce((acc, s) => acc + s.participantsCount, 0) / filteredSessions.length),
      globalTrend,
      trendPercentage: Math.abs(Math.round(trendPercentage)),
      processedMembers,
      segmentation,
      ageStackedData,
      ageGroupsBase,
      radialPercentages,
      radialSummary,
      pulseData,
      gritLeaderboard
    };
  }, [weeklyHistory, members, yearConfig, gritSortConfig, gritSearchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#006994]" size={40} />
        <p className="text-[#006994] font-black animate-pulse">טוען נתונים...</p>
      </div>
    );
  }

  const filteredMembers = stats?.processedMembers.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto font-['Assistant'] pb-20" dir="rtl">
      {/* Editorial Header */}
      <header className="mb-16 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#006994]/10 text-[#006994] rounded-full mb-6 border border-[#006994]/10">
              <Activity size={14} className="text-[#00FFFF]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Session Dive Analytics</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-[#006994] tracking-tighter leading-none mb-4">
              צלילה <span className="text-[#40E0D0]">לסשנים</span>
            </h1>
            <p className="text-xl text-[#4E8294] font-bold max-w-2xl leading-relaxed">
              ניתוח עומק של ביצועי הנבחרת, מגמות נוכחות ופילוח גולשים. 🌊
            </p>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl -z-10" />
      </header>

      {stats ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-[400px]">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#006994]/10 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">סך הכל סשנים (שהתקיימו)</p>
              <p className="text-4xl font-black text-[#006994]">{stats.totalSessions}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#006994]/10 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ממוצע גולשים לסשן</p>
                <div className="relative">
                  <button 
                    onClick={() => setActiveTooltip(activeTooltip === 'avg' ? null : 'avg')}
                    onMouseEnter={() => setActiveTooltip('avg')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`p-1 rounded-full border transition-all cursor-help outline-none ${
                      activeTooltip === 'avg' 
                        ? 'bg-[#006994]/10 border-[#006994]/30' 
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <Info size={14} className={`transition-colors ${activeTooltip === 'avg' ? 'text-[#006994]' : 'text-[#006994]/40'}`} />
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'avg' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-3 w-56 p-3 bg-[#006994] text-white text-[11px] font-bold rounded-2xl z-50 shadow-2xl border border-white/20 backdrop-blur-sm pointer-events-none"
                      >
                        מספר המשתתפים הממוצע לסשן בודד, מתחילת שנת חבל זוג ועד היום.
                        <div className="absolute top-full right-3 border-[6px] border-transparent border-t-[#006994]"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-4xl font-black text-[#006994]">{stats.avgAttendance}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-[#006994]/10 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סך כל הכניסות למים</p>
                <div className="relative">
                  <button 
                    onClick={() => setActiveTooltip(activeTooltip === 'total' ? null : 'total')}
                    onMouseEnter={() => setActiveTooltip('total')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`p-1 rounded-full border transition-all cursor-help outline-none ${
                      activeTooltip === 'total' 
                        ? 'bg-[#006994]/10 border-[#006994]/30' 
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <Info size={14} className={`transition-colors ${activeTooltip === 'total' ? 'text-[#006994]' : 'text-[#006994]/40'}`} />
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'total' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-3 w-56 p-3 bg-[#006994] text-white text-[11px] font-bold rounded-2xl z-50 shadow-2xl border border-white/20 backdrop-blur-sm pointer-events-none"
                      >
                        סך ההשתתפויות המצטבר של כל חברי הנבחרת בכל הסשנים שהתקיימו מתחילת שנת חבל זוג.
                        <div className="absolute top-full right-3 border-[6px] border-transparent border-t-[#006994]"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-4xl font-black text-[#006994]">{stats.totalAttendance}</p>
            </div>
            <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between ${
              stats.globalTrend === 'up' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
              stats.globalTrend === 'down' ? 'bg-rose-50 border-rose-100 text-rose-700' : 
              'bg-slate-50 border-slate-100 text-slate-700'
            }`}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">מגמת נוכחות כללית</p>
              <div className="flex items-center gap-3">
                {stats.globalTrend === 'up' ? <ArrowUpRight size={32} /> : stats.globalTrend === 'down' ? <ArrowDownRight size={32} /> : <Minus size={32} />}
                <p className="text-3xl font-black">{stats.trendPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Row 1: Pulse Area Chart (Full Width) - Temporarily Disabled for Stability */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-[#006994]/10 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#006994] text-white rounded-xl shadow-lg"><TrendingUp size={20} /></div>
                  <h3 className="text-2xl font-black text-[#006994]">דופק הסשנים (Pulse)</h3>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">נתוני נוכחות</p>
              </div>
              <div className="h-[400px] w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.pulseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#006994" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#006994" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#00FFFF', fontWeight: 900 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#006994" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorPulse)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 2: Age Radial Bar (Right) & Donut Chart (Left) - Temporarily Disabled for Stability */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-[#006994]/10 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-lg"><Users size={20} /></div>
                  <h3 className="text-2xl font-black text-[#006994]">אנליזה קבוצתית (גילאים)</h3>
                </div>
              </div>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.ageStackedData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 900, fill: '#006994' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff' }}
                    />
                    <Legend iconType="circle" />
                    {stats.ageGroupsBase.map((group, idx) => (
                      <Bar 
                        key={idx} 
                        dataKey={group.label} 
                        stackId="a" 
                        fill={group.color} 
                        radius={idx === stats.ageGroupsBase.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] border border-[#006994]/10 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-slate-100 text-[#006994] rounded-xl shadow-lg"><PieChartIcon size={20} /></div>
                <h3 className="text-2xl font-black text-[#006994]">פילוח קבועים/מזדמנים</h3>
              </div>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.segmentation}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.segmentation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 3: Grit Leaderboard (Full Width) */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-[#006994]/10 shadow-sm lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shadow-lg border border-amber-200">
                    <Award size={20} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#006994]">מדד נחישות (Grit Leaderboard)</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">טופ 50 גולשים</p>
                  </div>
                </div>
                <div className="relative group min-w-[300px]">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="חפש במדד נחישות..." 
                    value={gritSearchTerm}
                    onChange={e => setGritSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-amber-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th 
                        className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4 cursor-pointer hover:text-[#006994] transition-colors"
                        onClick={() => setGritSortConfig(prev => ({ key: 'firstName', direction: prev.key === 'firstName' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                      >
                        <div className="flex items-center gap-1">
                          גולש <ArrowUpDown size={12} className="opacity-50" />
                        </div>
                      </th>
                      <th 
                        className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-[#006994] transition-colors"
                        onClick={() => setGritSortConfig(prev => ({ key: 'streak', direction: prev.key === 'streak' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                      >
                        <div className="flex items-center gap-1">
                          רצף נוכחות (Streak) <ArrowUpDown size={12} className="opacity-50" />
                        </div>
                      </th>
                      <th 
                        className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-[#006994] transition-colors"
                        onClick={() => setGritSortConfig(prev => ({ key: 'totalAttendance', direction: prev.key === 'totalAttendance' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                      >
                        <div className="flex items-center gap-1">
                          סך הכל השתתפויות <ArrowUpDown size={12} className="opacity-50" />
                        </div>
                      </th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">מגמה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.gritLeaderboard.map((member: any) => (
                      <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                              <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}&background=006994&color=fff`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <span className="font-black text-[#006994]">{member.firstName} {member.lastName}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-[#006994]">{member.streak}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">סשנים רצופים</span>
                          </div>
                        </td>
                        <td className="py-4 font-black text-[#4E8294]">{member.totalAttendance}</td>
                        <td className="py-4">
                          {member.trend === 'up' ? (
                            <ArrowUpRight className="text-emerald-500" size={20} />
                          ) : member.trend === 'down' ? (
                            <ArrowDownRight className="text-rose-500" size={20} />
                          ) : (
                            <Minus className="text-slate-300" size={20} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Member Search Table */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-[#006994]/10 shadow-sm lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-xl shadow-lg"><Search size={20} /></div>
                  <h3 className="text-2xl font-black text-[#006994]">חיפוש ומגמות אישיות</h3>
                </div>
                <div className="relative group min-w-[300px]">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="חפש גולש..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-[#006994]/10 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">גולש</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">סך הכל סשנים</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">מגמת שיפור</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMembers.slice(0, 20).map((member) => (
                      <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                              <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}&background=006994&color=fff`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <span className="font-black text-[#006994]">{member.firstName} {member.lastName}</span>
                          </div>
                        </td>
                        <td className="py-4 font-black text-[#4E8294]">{member.totalAttendance}</td>
                        <td className="py-4">
                          {member.trend === 'up' ? (
                            <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                              <ArrowUpRight size={14} /> במגמת עלייה
                            </div>
                          ) : member.trend === 'down' ? (
                            <div className="flex items-center gap-1 text-rose-500 font-black text-xs">
                              <ArrowDownRight size={14} /> במגמת ירידה
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400 font-black text-xs">
                              <Minus size={14} /> יציב
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            member.totalAttendance >= 5 ? 'bg-indigo-50 text-indigo-600' : 
                            member.totalAttendance >= 2 ? 'bg-[#40E0D0]/10 text-[#006994]' : 
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {member.totalAttendance >= 5 ? 'Regular' : member.totalAttendance >= 2 ? 'Steady' : 'Newbie'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-40 text-center bg-white/40 rounded-[4rem] border-2 border-dashed border-[#006994]/10">
          <BarChart3 size={64} className="mx-auto mb-8 text-[#006994]/20" />
          <h3 className="text-3xl font-black text-[#4E8294] mb-4">אין מספיק נתונים לניתוח</h3>
          <p className="text-slate-400 font-bold max-w-md mx-auto">
            כדי להציג את דף הניתוח, יש להזין סשנים במערכת החל מתאריך תחילת שנת חבל זוג ({yearConfig?.startDate || 'לא הוגדר'}).
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionStatsPage;
