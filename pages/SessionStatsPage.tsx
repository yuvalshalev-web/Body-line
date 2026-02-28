
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
      { label: 'צעירים (18-25)', min: 18, max: 25, color: '#006994' },
      { label: 'בוגרים (26-40)', min: 26, max: 40, color: '#40E0D0' },
      { label: 'אמצע החיים (41-60)', min: 41, max: 60, color: '#6366f1' },
      { label: 'ותיקים (60+)', min: 61, max: 120, color: '#94a3b8' },
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

    // 7. Gender Analytics
    const genderStatsObj = {
      men: { label: 'גברים', count: 0, totalAttendance: 0, sessionsPossible: 0, color: 'bg-blue-500', hex: '#3b82f6' },
      women: { label: 'נשים', count: 0, totalAttendance: 0, sessionsPossible: 0, color: 'bg-pink-500', hex: '#ec4899' },
      unspecified: { label: 'לא צוין', count: 0, totalAttendance: 0, sessionsPossible: 0, color: 'bg-gray-400', hex: '#9ca3af' }
    };

    members.forEach(m => {
      const g = m.gender === 'זכר' ? 'men' : m.gender === 'נקבה' ? 'women' : 'unspecified';
      genderStatsObj[g].count++;
      genderStatsObj[g].totalAttendance += (memberStatsMap[m.id]?.total || 0);
      genderStatsObj[g].sessionsPossible += totalSessionsCount;
    });

    const genderImpact = Object.entries(genderStatsObj).map(([key, data]) => ({
      key,
      ...data,
      retention: data.sessionsPossible > 0 && data.count > 0 
        ? Math.round((data.totalAttendance / (data.count * totalSessionsCount)) * 100) 
        : 0
    }));

    // 8. Sea Time Calculation
    const totalSeaTimeMinutes = filteredSessions.reduce((acc, s) => acc + (s.participantsCount || 0) * 90, 0);
    const totalSeaTimeHours = Math.round(totalSeaTimeMinutes / 60);
    const monthlySeaTimeMinutes = lastMonthSessions.reduce((acc, s) => acc + (s.participantsCount || 0) * 90, 0);
    const monthlySeaTimeHours = Math.round(monthlySeaTimeMinutes / 60);

    // 9. Pulse Data (Full timeline from startDate to lastSessionDate)
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

    // 10. Age & Activity Table Data (Participation rate per group across 3 time ranges)
    const ageActivityData = ageGroupsBase.map(group => {
      const groupMembers = members.filter(m => ageMap.get(m.id) === group.label);
      const groupCount = groupMembers.length;

      const calcRate = (sessions: any[]) => {
        if (groupCount === 0 || sessions.length === 0) return 0;
        const actualAttendance = sessions.reduce((acc, s) => {
          return acc + (s.participantIds || []).filter((uid: string) => ageMap.get(uid) === group.label).length;
        }, 0);
        return Math.round((actualAttendance / (groupCount * sessions.length)) * 100);
      };

      return {
        label: group.label,
        lastSession: calcRate(filteredSessions.slice(-1)),
        lastFour: calcRate(filteredSessions.slice(-4)),
        annual: calcRate(filteredSessions)
      };
    });

    // 11. Grit Leaderboard
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
      gritLeaderboard,
      genderImpact,
      totalSeaTimeHours,
      monthlySeaTimeHours,
      ageActivityData
    };
  }, [weeklyHistory, members, yearConfig, gritSortConfig, gritSearchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#0f172a] fixed inset-0 z-50">
        <Loader2 className="animate-spin text-[#00FFFF]" size={40} />
        <p className="text-white font-black animate-pulse">טוען נתונים...</p>
      </div>
    );
  }

  const filteredMembers = stats?.processedMembers.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto font-['Assistant'] pb-20 relative" dir="rtl">
      {/* Editorial Header */}
      <header className="mb-16 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900/5 text-slate-500 rounded-full mb-6 border border-slate-200 backdrop-blur-md">
              <Activity size={14} className="text-[#006994]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Session Dive Analytics</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none mb-4">
              צלילה <span className="text-[#006994]">לסשנים</span>
            </h1>
            <p className="text-xl text-slate-500 font-bold max-w-2xl leading-relaxed">
              ניתוח עומק של ביצועי הנבחרת, מגמות נוכחות ופילוח גולשים. 🌊
            </p>
          </div>

          {/* Sea-Time Dashboard Widget - Using the Dark Glass style from Machine Room */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl group-hover:bg-blue-500/30 transition-all duration-500" />
            <div className="relative health-matrix-glass p-8 rounded-[3rem] text-center min-w-[280px] shadow-2xl border border-white/10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">זמן ים מצטבר (הערכה)</p>
              <div className="flex flex-col items-center">
                <span className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {stats?.totalSeaTimeHours || 0}
                </span>
                <span className="text-xl font-black text-blue-400 mt-1">שעות גלישה הוענקו</span>
              </div>
              <p className="text-[9px] text-white/20 mt-4 font-bold">* מבוסס על הערכה של 90 דק' גלישה למשתתף</p>
            </div>
          </div>
        </div>
      </header>

      {stats ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-[400px]">
          {/* Top Stats Row - Using Modern White Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">סך הכל סשנים</p>
              <p className="text-4xl font-black text-slate-900">{stats.totalSessions}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ממוצע גולשים לסשן</p>
                <div className="relative">
                  <button 
                    onClick={() => setActiveTooltip(activeTooltip === 'avg' ? null : 'avg')}
                    onMouseEnter={() => setActiveTooltip('avg')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`p-1 rounded-full border transition-all cursor-help outline-none ${
                      activeTooltip === 'avg' 
                        ? 'bg-slate-100 border-slate-300' 
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <Info size={14} className={`transition-colors ${activeTooltip === 'avg' ? 'text-slate-900' : 'text-slate-300'}`} />
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'avg' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-3 w-56 p-3 bg-slate-900 text-white text-[11px] font-bold rounded-2xl z-50 shadow-2xl border border-white/20 backdrop-blur-md pointer-events-none"
                      >
                        מספר המשתתפים הממוצע לסשן בודד, מתחילת שנת חבל זוג ועד היום.
                        <div className="absolute top-full right-3 border-[6px] border-transparent border-t-slate-900"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-4xl font-black text-slate-900">{stats.avgAttendance}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סך כל הכניסות למים</p>
                <div className="relative">
                  <button 
                    onClick={() => setActiveTooltip(activeTooltip === 'total' ? null : 'total')}
                    onMouseEnter={() => setActiveTooltip('total')}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`p-1 rounded-full border transition-all cursor-help outline-none ${
                      activeTooltip === 'total' 
                        ? 'bg-slate-100 border-slate-300' 
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <Info size={14} className={`transition-colors ${activeTooltip === 'total' ? 'text-slate-900' : 'text-slate-300'}`} />
                  </button>
                  <AnimatePresence>
                    {activeTooltip === 'total' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-3 w-56 p-3 bg-slate-900 text-white text-[11px] font-bold rounded-2xl z-50 shadow-2xl border border-white/20 backdrop-blur-md pointer-events-none"
                      >
                        סך ההשתתפויות המצטבר של כל חברי הנבחרת בכל הסשנים שהתקיימו מתחילת שנת חבל זוג.
                        <div className="absolute top-full right-3 border-[6px] border-transparent border-t-slate-900"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-4xl font-black text-slate-900">{stats.totalAttendance}</p>
            </div>
            <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between ${
              stats.globalTrend === 'up' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
              stats.globalTrend === 'down' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
              'bg-white border-slate-100 text-slate-400'
            }`}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">מגמת נוכחות כללית</p>
              <div className="flex items-center gap-3">
                {stats.globalTrend === 'up' ? <ArrowUpRight size={32} /> : stats.globalTrend === 'down' ? <ArrowDownRight size={32} /> : <Minus size={32} />}
                <p className="text-3xl font-black">{stats.trendPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Gender Impact Card (Right Side) - Using Dark Glass for high contrast */}
            <div className="lg:col-span-5 space-y-10">
              <div className="relative p-10 rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl health-matrix-glass">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-white font-black text-2xl tracking-tighter">פילוח מגדרי ואימפקט</h3>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">תמהיל הקהילה ומדדי התמדה</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl text-blue-400">
                    <PieChartIcon size={24} />
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="mb-12">
                  <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
                    <span>תמהיל קהילתי</span>
                    <span>{members.length} חברים</span>
                  </div>
                  <div className="flex h-4 w-full rounded-full overflow-hidden bg-white/5 p-[2px] border border-white/5">
                    {stats.genderImpact.map((item, idx) => {
                      const width = (item.count / members.length) * 100;
                      if (width === 0) return null;
                      return (
                        <div 
                          key={idx}
                          className={`${item.color} h-full transition-all duration-1000`}
                          style={{ 
                            width: `${width}%`,
                            boxShadow: `0 0 15px ${item.hex}40`
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="space-y-4">
                  {stats.genderImpact.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_10px_currentColor]`} />
                        <div>
                          <span className="text-white font-black text-lg block leading-none mb-1">{item.label}</span>
                          <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{item.count} חברי קהילה</span>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-2xl ${item.retention >= 90 ? 'text-emerald-400' : 'text-white'}`}>
                            {item.retention}%
                          </span>
                          <span className="text-white/20 text-[9px] uppercase font-black tracking-widest">מדד התמדה</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Impact Insight */}
                <div className="mt-10 pt-6 border-t border-white/10">
                  <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                    <p className="text-xs text-blue-300 leading-relaxed text-center font-bold">
                      💡 <strong className="text-white">תובנת אימפקט:</strong> קבוצת הנשים שומרת על אחוזי התמדה גבוהים, מה שמעיד על חיבור עמוק לקהילה למרות הייצוג המספרי הקטן.
                    </p>
                  </div>
                </div>
              </div>

              {/* Age & Activity Card - Using White Card */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-slate-50 text-emerald-600 rounded-xl shadow-sm border border-slate-100"><Activity size={20} /></div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">מדדי פעילות לפי גיל</h3>
                </div>
                
                <div className="overflow-hidden rounded-3xl border border-slate-100">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">קבוצת גיל</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">סשן אחרון</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">4 אחרונים</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">שנתי</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.ageActivityData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-5">
                            <span className="text-sm font-black text-slate-900">{row.label}</span>
                          </td>
                          <td className="p-5 text-center">
                            <span className={`text-sm font-black ${row.lastSession >= 80 ? 'text-emerald-600' : 'text-slate-500'}`}>{row.lastSession}%</span>
                          </td>
                          <td className="p-5 text-center">
                            <span className={`text-sm font-black ${row.lastFour >= 80 ? 'text-emerald-600' : 'text-slate-500'}`}>{row.lastFour}%</span>
                          </td>
                          <td className="p-5 text-center">
                            <span className={`text-sm font-black ${row.annual >= 80 ? 'text-emerald-600' : 'text-slate-500'}`}>{row.annual}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[9px] text-slate-300 mt-6 font-bold text-center uppercase tracking-widest">הנתונים מייצגים אחוז השתתפות מתוך פוטנציאל הקבוצה</p>
              </div>
            </div>

            {/* Charts & Pulse (Left Side) - Using White Cards */}
            <div className="lg:col-span-7 space-y-10">
              {/* Pulse Area Chart */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-blue-600 rounded-xl shadow-sm border border-slate-100"><TrendingUp size={20} /></div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">דופק הסשנים (Pulse)</h3>
                  </div>
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
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1.5rem', border: 'none', color: '#fff' }}
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

              {/* Grit Leaderboard */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-amber-600 rounded-xl shadow-sm border border-slate-100">
                      <Award size={20} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">מדד נחישות (Grit Leaderboard)</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">טופ 50 גולשים</p>
                    </div>
                  </div>
                  <div className="relative group min-w-[300px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      placeholder="חפש במדד נחישות..." 
                      value={gritSearchTerm}
                      onChange={e => setGritSearchTerm(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th 
                          className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4 cursor-pointer hover:text-slate-900 transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'firstName', direction: prev.key === 'firstName' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            גולש <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'streak', direction: prev.key === 'streak' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            רצף (Streak) <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors text-center"
                          onClick={() => setGritSortConfig(prev => ({ key: 'totalAttendance', direction: prev.key === 'totalAttendance' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center justify-center gap-1">
                            סך הכל <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">מגמה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.gritLeaderboard.map((member: any) => (
                        <tr key={member.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-5 pr-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}&background=006994&color=fff`} className="w-full h-full object-cover" alt="" />
                              </div>
                              <span className="font-black text-slate-900 text-lg">{member.firstName} {member.lastName}</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-[#006994]">{member.streak}</span>
                              <span className="text-[10px] font-black text-slate-300 uppercase">סשנים</span>
                            </div>
                          </td>
                          <td className="py-5 font-black text-slate-500 text-center text-lg">{member.totalAttendance}</td>
                          <td className="py-5 text-center">
                            <div className="flex justify-center">
                              {member.trend === 'up' ? (
                                <ArrowUpRight className="text-emerald-500" size={24} />
                              ) : member.trend === 'down' ? (
                                <ArrowDownRight className="text-rose-500" size={24} />
                              ) : (
                                <Minus className="text-slate-200" size={24} />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
          <BarChart3 size={64} className="mx-auto mb-8 text-slate-100" />
          <h3 className="text-3xl font-black text-slate-900 mb-4">אין מספיק נתונים לניתוח</h3>
          <p className="text-slate-400 font-bold max-w-md mx-auto">
            כדי להציג את דף הניתוח, יש להזין סשנים במערכת החל מתאריך תחילת שנת חבל זוג ({yearConfig?.startDate || 'לא הוגדר'}).
          </p>
        </div>
      )}
    </div>
  );

};

export default SessionStatsPage;
