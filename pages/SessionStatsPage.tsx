
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
import { Sparkles } from 'lucide-react';

const SessionStatsPage: React.FC = () => {
  const { members, weeklyHistory, yearConfig, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [gritSearchTerm, setGritSearchTerm] = useState('');
  const [ageView, setAgeView] = useState<'annual' | 'monthly' | 'lastSession'>('annual');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Helper to count Thursdays between two dates
  const countThursdays = (start: string | Date, end: string | Date) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    
    let count = 0;
    const current = new Date(startDate);
    
    // Normalize to start of day
    current.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Find first Thursday
    while (current.getDay() !== 4 && current <= endDate) {
      current.setDate(current.getDate() + 1);
    }
    
    while (current <= endDate) {
      count++;
      current.setDate(current.getDate() + 7);
    }
    return count;
  };

  const [gritSortConfig, setGritSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'streak',
    direction: 'desc'
  });

  const stats = useMemo(() => {
    if (!weeklyHistory || weeklyHistory.length === 0 || !yearConfig) return null;

    const now = new Date();
    // 1. Filter sessions by Shnat Hevel Zug start date
    const startDate = new Date(yearConfig.startDate);
    const seenDates = new Set<string>();
    const cancelledDates = new Set<string>();
    
    const filteredSessions = weeklyHistory
      .filter(session => {
        const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
        const dateKey = sessionDate.toDateString();
        // Only count unique days with participants within the date range
        if (sessionDate >= startDate && sessionDate <= now && (session.participantsCount || 0) > 0 && !seenDates.has(dateKey)) {
          seenDates.add(dateKey);
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    const cancelledSessionsCount = weeklyHistory.filter(session => {
      const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
      const dateKey = sessionDate.toDateString();
      return (
        sessionDate >= startDate && 
        sessionDate <= now && 
        (session.participantsCount || 0) === 0 &&
        !seenDates.has(dateKey) &&
        !cancelledDates.has(dateKey)
      ) ? (cancelledDates.add(dateKey), true) : false;
    }).length;

    if (filteredSessions.length === 0 && cancelledSessionsCount === 0) return null;

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
      if (processedUsersCount > 200) break; // Safety cap for user mapping

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

    // 9. Pulse Data (Full timeline from startDate to endDate)
    const pulseData = [];
    let currentWeek = 0;
    let currentMonth = 0;
    const today = new Date();

    if (filteredSessions.length > 0 && yearConfig) {
      const sessionMap = new Map<string, number>();
      filteredSessions.forEach(s => {
        const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        sessionMap.set(d.toDateString(), s.participantsCount || 0);
      });

      let iter = new Date(startDate);
      iter.setHours(0, 0, 0, 0);
      const end = new Date(yearConfig.endDate);
      end.setHours(23, 59, 59, 999);
      
      // Calculate current status
      if (today >= startDate && today <= end) {
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        currentWeek = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        currentMonth = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth()) + 1;
      }

      let safety = 0;
      while (iter <= end && safety < 400) {
        if (iter.getDay() === 4) {
          const count = sessionMap.get(iter.toDateString()) || 0;
          pulseData.push({
            date: iter.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
            count: count,
            percentage: members.length > 0 ? Math.round((count / members.length) * 100) : 0,
            fullDate: iter.toLocaleDateString('he-IL', { month: 'long' }), // Just the month name for title
            activityMonth: (iter.getFullYear() - startDate.getFullYear()) * 12 + (iter.getMonth() - startDate.getMonth()) + 1,
            weekNumber: Math.ceil(Math.abs(iter.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) || 1
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
      ageActivityData,
      currentWeek,
      currentMonth,
      cancelledSessionsCount,
      yearConfig
    };
  }, [weeklyHistory, members, yearConfig, gritSortConfig, gritSearchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#DDE1E4] fixed inset-0 z-50">
        <Loader2 className="animate-spin text-[#1A365D]" size={40} />
        <p className="text-[#2D3748] font-black animate-pulse">טוען נתונים...</p>
      </div>
    );
  }

  const filteredMembers = stats?.processedMembers.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto font-['Assistant'] pb-20 relative" dir="rtl">
      {/* Unified Header */}
      <header className="mb-8 relative">
        <div className="surfboard-hero-container space-y-2">
          <h1 className="main-page-title">
          <span className="surfer-title">צלילה לסשנים</span>
        </h1>
          
          <p className="text-[#4A5568] max-w-2xl text-xl font-bold">
            ניתוח עומק של ביצועי הנבחרת, מגמות נוכחות ופילוח גולשים. 🌊
          </p>
        </div>
      </header>

      {/* Sea-Time & Progress Bar Row */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-12 w-full">
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
          <div className="relative bg-[#DDE1E4] p-8 rounded-[3rem] text-center min-w-[280px] shadow-soft border border-slate-200">
            <p className="text-[10px] font-black text-[#4A5568] uppercase tracking-widest mb-2">זמן ים מצטבר (הערכה)</p>
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-[#2D3748] drop-shadow-sm">
                {stats?.totalSeaTimeHours || 0}
              </span>
              <span className="text-xl font-black text-[#1A365D] mt-1">שעות גלישה מצטברות</span>
            </div>
            <p className="text-[9px] text-[#4A5568]/40 mt-4 font-bold">* מבוסס על הערכה של 90 דק' גלישה למשתתף</p>
          </div>
        </div>

        {/* Yearly Progress Bar Widget */}
        <div className="relative group w-full max-w-xl">
          <div className="absolute inset-0 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />
          <div className="relative bg-[#DDE1E4] p-8 rounded-[3rem] shadow-soft border border-slate-200 flex flex-col w-full">
            {(() => {
              const now = new Date();
              const startDate = yearConfig?.startDate || new Date().toISOString();
              const endDate = yearConfig?.endDate || new Date(new Date().getFullYear(), 11, 31).toISOString();
              
              // Potential is the number of Thursdays in the entire year config range
              const totalPotential = countThursdays(startDate, endDate);
              // Planned to date is the number of Thursdays from start until today (or end of year if today is after)
              const plannedToDate = countThursdays(startDate, now < new Date(endDate) ? now : endDate);
              
              const actualSessions = stats?.totalSessions || 0;
              const percentage = totalPotential > 0 ? Math.round((actualSessions / totalPotential) * 100) : 0;
              const targetPercent = totalPotential > 0 ? Math.min(100, (plannedToDate / totalPotential) * 100) : 0;
              
              return (
                <>
                  <div className="flex flex-col items-center mb-6">
                    <p className="text-[10px] font-black text-[#4A5568] uppercase tracking-widest mb-2">התקדמות שנתית - חבל זוג</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-[#1A365D]">{percentage}%</span>
                      <span className="text-[10px] font-black text-[#4A5568]/40 uppercase">ביצוע</span>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="relative h-12 w-full bg-slate-200/50 rounded-2xl overflow-visible mb-8 border border-slate-200 shadow-inner">
                    {/* Percentage Markers */}
                    <div className="absolute -top-6 left-0 w-full flex justify-between px-1">
                      {[0, 20, 40, 60, 80, 100].map(p => (
                        <span key={p} className="text-[8px] font-black text-slate-400">{p}%</span>
                      ))}
                    </div>

                    {/* Actual Progress Fill - Growing from Right to Left (RTL) */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percentage)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute inset-y-0 right-0 bg-gradient-to-l from-blue-400 to-blue-600 rounded-r-2xl shadow-[0_0_15px_rgba(37,99,235,0.3)] z-10"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20" />
                    </motion.div>

                    {/* Target Marker (Today's Plan) - Positioned from Right (RTL) */}
                    <div 
                      className="absolute inset-y-0 w-1 bg-orange-500 z-20 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                      style={{ right: `${targetPercent}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="text-[9px] font-black text-orange-600 whitespace-nowrap bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 shadow-sm">היעד להיום</span>
                        <div className="w-0.5 h-2 bg-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Data Display Row */}
                  <div className="flex flex-wrap justify-between gap-4 text-[11px] font-bold text-[#4A5568]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>ביצוע בפועל: <strong className="text-[#2D3748]">{actualSessions} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>סשנים שבוטלו: <strong className="text-[#2D3748]">{stats?.cancelledSessionsCount || 0} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>תכנון עד היום: <strong className="text-[#2D3748]">{plannedToDate} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                      <span>סך הכל שנתי (פוטנציאל): <strong className="text-[#2D3748]">{totalPotential} סשנים</strong></span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {stats ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-[400px]">
          {/* Top Stats Row - Refined Horizontal Row */}
          <div className="flex flex-row gap-4 justify-center items-stretch max-w-4xl mx-auto">
            <div className="flex-1 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ממוצע גולשים</p>
                <div className="gt-info-wrapper">
                  <div className="gt-info-icon" style={{ width: '16px', height: '16px', fontSize: '10px' }}>i</div>
                  <span className="gt-tooltip" style={{ bottom: '180%', width: '200px' }}>
                    ממוצע משתתפים לסשן מתחילת השנה.
                  </span>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-black text-[#2B2B2E] leading-none">{stats.avgAttendance}</p>
            </div>

            <div className="flex-1 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">כניסות למים</p>
                <div className="gt-info-wrapper">
                  <div className="gt-info-icon" style={{ width: '16px', height: '16px', fontSize: '10px' }}>i</div>
                  <span className="gt-tooltip" style={{ bottom: '180%', width: '200px' }}>
                    סך השתתפויות מצטבר של כל חברי הקהילה.
                  </span>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-black text-[#2B2B2E] leading-none">{stats.totalAttendance}</p>
            </div>

            <div className={`flex-1 p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center justify-center text-center ${
              stats.globalTrend === 'up' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
              stats.globalTrend === 'down' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
              'bg-white border-slate-100 text-slate-400'
            }`}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">מגמת נוכחות</p>
              <div className="flex items-center gap-3">
                {stats.globalTrend === 'up' ? <ArrowUpRight size={28} /> : stats.globalTrend === 'down' ? <ArrowDownRight size={28} /> : <Minus size={28} />}
                <p className="text-3xl md:text-4xl font-black leading-none">{stats.trendPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Gender Impact Card (Right Side) */}
            <div className="lg:col-span-5 space-y-10">
              <div className="relative p-10 rounded-[3.5rem] overflow-hidden border border-slate-200 shadow-soft bg-[#DDE1E4]">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-[#2D3748] font-black text-2xl tracking-tighter">פילוח מגדרי ואימפקט</h3>
                    <p className="text-[#4A5568] text-[10px] uppercase tracking-widest mt-1">תמהיל הקהילה ומדדי התמדה</p>
                  </div>
                  <div className="p-3 bg-white rounded-2xl text-[#1A365D] shadow-sm border border-slate-100">
                    <PieChartIcon size={24} />
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="mb-12">
                  <div className="flex justify-between text-[10px] font-black text-[#4A5568] uppercase tracking-widest mb-3">
                    <span>תמהיל קהילתי</span>
                    <span>{members.length} חברים</span>
                  </div>
                  <div className="flex h-4 w-full rounded-full overflow-hidden bg-white p-[2px] border border-slate-200">
                    {stats.genderImpact.map((item, idx) => {
                      const width = (item.count / members.length) * 100;
                      if (width === 0) return null;
                      return (
                        <div 
                          key={idx}
                          className={`${item.color} h-full transition-all duration-1000`}
                          style={{ 
                            width: `${width}%`,
                            boxShadow: `0 0 10px ${item.hex}20`
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="space-y-4">
                  {stats.genderImpact.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-white border border-slate-100 hover:bg-slate-50 transition-all group shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
                        <div>
                          <span className="text-[#2D3748] font-black text-lg block leading-none mb-1">{item.label}</span>
                          <span className="text-[#4A5568] text-[10px] font-bold uppercase tracking-widest">{item.count} חברי קהילה</span>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-2xl ${item.retention >= 90 ? 'text-emerald-600' : 'text-[#2D3748]'}`}>
                            {item.retention}%
                          </span>
                          <span className="text-[#4A5568]/40 text-[9px] uppercase font-black tracking-widest">מדד התמדה</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Impact Insight */}
                <div className="mt-10 pt-6 border-t border-slate-200">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-xs text-[#1A365D] leading-relaxed text-center font-bold">
                      💡 <strong className="text-[#2D3748]">תובנת אימפקט:</strong> קבוצת הנשים שומרת על אחוזי התמדה גבוהים, מה שמעיד על חיבור עמוק לקהילה למרות הייצוג המספרי הקטן.
                    </p>
                  </div>
                </div>
              </div>

              {/* Age & Activity Card - Using White Card */}
              <div className="bg-[#DDE1E4] p-10 rounded-[3.5rem] border border-slate-200 shadow-soft">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-white text-[#38B2AC] rounded-xl shadow-sm border border-slate-100"><Activity size={20} /></div>
                  <h3 className="text-2xl font-black text-[#2D3748] tracking-tighter">מדדי פעילות לפי גיל</h3>
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
                            <span className="text-sm font-black text-[#2B2B2E]">{row.label}</span>
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
              <div className="bg-[#DDE1E4] p-10 rounded-[3.5rem] border border-slate-200 shadow-soft">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-white text-[#1A365D] rounded-xl shadow-sm border border-slate-100">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#2D3748] tracking-tighter">דופק הקהילה (Pulse)</h3>
                    <p className="text-[10px] font-black text-[#4A5568] uppercase tracking-widest">מגמת נוכחות שבועית</p>
                  </div>
                </div>
                
                <div className="h-[400px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.pulseData} margin={{ top: 10, right: 30, left: 40, bottom: 80 }}>
                      <defs>
                        <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A365D" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1A365D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#4A5568' }}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#4A5568' }} 
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#2D3748] p-4 rounded-2xl border-none shadow-xl text-white text-right" dir="rtl">
                                <p className="text-xs font-black mb-1">{data.fullDate}</p>
                                <p className="text-sm font-black">
                                  <span className="text-blue-400">{Math.round(payload[0].value as number)}%</span> נוכחות
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#1A365D" 
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
              <div className="bg-[#DDE1E4] p-10 rounded-[3.5rem] border border-slate-200 shadow-soft">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white text-[#D69E2E] rounded-xl shadow-sm border border-slate-100">
                      <Award size={20} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#2D3748] tracking-tighter">מדד נחישות (Grit Leaderboard)</h3>
                      <p className="text-[10px] font-black text-[#4A5568] uppercase tracking-widest">טופ 50 גולשים</p>
                    </div>
                  </div>
                  <div className="relative group min-w-[300px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="חפש בממד נחישות..." 
                      value={gritSearchTerm}
                      onChange={e => setGritSearchTerm(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-[#2D3748] outline-none focus:ring-2 ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th 
                          className="pb-6 text-[10px] font-black text-[#4A5568] uppercase tracking-widest pr-4 cursor-pointer hover:text-[#2D3748] transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'firstName', direction: prev.key === 'firstName' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            גולש <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[10px] font-black text-[#4A5568] uppercase tracking-widest cursor-pointer hover:text-[#2D3748] transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'streak', direction: prev.key === 'streak' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            רצף (Streak) <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[10px] font-black text-[#4A5568] uppercase tracking-widest cursor-pointer hover:text-[#2D3748] transition-colors text-center"
                          onClick={() => setGritSortConfig(prev => ({ key: 'totalAttendance', direction: prev.key === 'totalAttendance' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center justify-center gap-1">
                            סך הכל <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th className="pb-6 text-[10px] font-black text-[#4A5568] uppercase tracking-widest text-center">מגמה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {stats.gritLeaderboard.map((member: any) => (
                        <tr key={member.id} className="group hover:bg-white/50 transition-colors">
                          <td className="py-5 pr-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
                                <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}&background=1A365D&color=fff`} className="w-full h-full object-cover" alt="" />
                              </div>
                              <span className="font-black text-[#2D3748] text-lg">{member.firstName} {member.lastName}</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-[#1A365D]">{member.streak}</span>
                              <span className="text-[10px] font-black text-[#4A5568] uppercase">סשנים</span>
                            </div>
                          </td>
                          <td className="py-5 font-black text-[#4A5568] text-center text-lg">{member.totalAttendance}</td>
                          <td className="py-5 text-center">
                            <div className="flex justify-center">
                              {member.trend === 'up' ? (
                                <ArrowUpRight className="text-emerald-600" size={24} />
                              ) : member.trend === 'down' ? (
                                <ArrowDownRight className="text-rose-600" size={24} />
                              ) : (
                                <Minus className="text-slate-300" size={24} />
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
          <h3 className="text-3xl font-black text-[#2B2B2E] mb-4">אין מספיק נתונים לניתוח</h3>
          <p className="text-slate-400 font-bold max-w-md mx-auto">
            כדי להציג את דף הניתוח, יש להזין סשנים במערכת החל מתאריך תחילת שנת חבל זוג ({yearConfig?.startDate || 'לא הוגדר'}).
          </p>
        </div>
      )}
    </div>
  );

};

export default SessionStatsPage;
