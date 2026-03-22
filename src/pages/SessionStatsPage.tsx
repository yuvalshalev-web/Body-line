
import React, { useState, useMemo } from 'react';
import { 
  Waves, 
  Snowflake,
  Leaf,
  Sun,
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
import { getBodyLineStats } from '../utils/bodyLineStats';
import { calculateAge, parseDate, formatDate } from '../utils/dateUtils';
import { useRandomHeader } from '../hooks/useRandomHeader';
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
  Legend,
  LineChart,
  Line
} from 'recharts';

const SessionStatsPage: React.FC = () => {
  const headerImage = useRandomHeader();
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
    key: 'gritScore',
    direction: 'desc'
  });

  const stats = useMemo(() => {
    if (!weeklyHistory || weeklyHistory.length === 0 || !yearConfig) return null;

    const activeMembers = getBodyLineStats(members).activeMembers;
    const now = new Date();
    // 1. Filter sessions by Shnat Hevel Zug start date
    const startDate = parseDate(yearConfig.startDate) || new Date();
    const cancelledDates = new Set<string>();
    
    // Filter history for sessions after startDate
    const validSessions = weeklyHistory.filter(session => {
      const sessionDate = parseDate(session.date);
      return sessionDate && sessionDate >= startDate && sessionDate <= now;
    });

    // Group by week (Thursday) to merge participantIds
    const sessionsByDate = new Map<string, { date: Date, participantIds: Set<string>, participantsCount: number }>();
    validSessions.forEach(session => {
      const sessionDate = parseDate(session.date);
      if (!sessionDate) return;
      
      // Normalize to Thursday 07:00
      const day = sessionDate.getDay();
      const diff = 4 - day;
      const thursdayDate = new Date(sessionDate);
      thursdayDate.setDate(thursdayDate.getDate() + diff);
      thursdayDate.setHours(7, 0, 0, 0);
      
      const dateKey = thursdayDate.toDateString();
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, { date: thursdayDate, participantIds: new Set<string>(), participantsCount: 0 });
      }
      const merged = sessionsByDate.get(dateKey)!;
      (session.participantIds || []).forEach((id: string) => merged.participantIds.add(id));
      merged.participantsCount = merged.participantIds.size;
    });

    const filteredSessions = Array.from(sessionsByDate.values())
      .map(s => ({
        date: s.date,
        participantIds: Array.from(s.participantIds),
        participantsCount: s.participantsCount
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const cancelledSessionsCount = weeklyHistory.filter(session => {
      const sessionDate = parseDate(session.date);
      if (!sessionDate) return false;
      
      // Normalize to Thursday 07:00
      const day = sessionDate.getDay();
      const diff = 4 - day;
      const thursdayDate = new Date(sessionDate);
      thursdayDate.setDate(thursdayDate.getDate() + diff);
      thursdayDate.setHours(7, 0, 0, 0);
      
      const dateKey = thursdayDate.toDateString();
      
      return (
        sessionDate >= startDate && 
        sessionDate <= now && 
        (session.participantsCount || 0) === 0 &&
        !sessionsByDate.has(dateKey) &&
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
      return b.date.getTime() - a.date.getTime();
    });

    // Initialize map and calculate streaks
    activeMembers.forEach(member => {
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
    for (const member of activeMembers) {
      processedUsersCount++;
      if (processedUsersCount > 200) break; // Safety cap for user mapping

      const mStats = memberStatsMap[member.id] || { total: 0, firstHalf: 0, secondHalf: 0, streak: 0 };
      
      // Personal Trend: comparing frequency in first half vs second half
      const firstHalfFreq = firstHalf.length > 0 ? mStats.firstHalf / firstHalf.length : 0;
      const secondHalfFreq = secondHalf.length > 0 ? mStats.secondHalf / secondHalf.length : 0;
      
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (secondHalfFreq > firstHalfFreq + 0.05) trend = 'up';
      else if (secondHalfFreq < firstHalfFreq - 0.05) trend = 'down';

      const gritScore = Math.min(100, (mStats.total * 1.5) + (mStats.streak * 4));

      processedMembers.push({
        ...member,
        totalAttendance: mStats.total,
        streak: mStats.streak,
        gritScore,
        trend
      });
    }
    
    // Use getBodyLineStats for global ranking and percentile based on gritScore
    const statsHelper = getBodyLineStats(processedMembers as any);
    
    const finalMembers = processedMembers.map(m => ({
      ...m,
      rank: statsHelper.getRank(m.gritScore, 'gritScore'),
      percentile: statsHelper.calculatePercentile(m.gritScore, 'gritScore')
    }));

    finalMembers.sort((a, b) => b.gritScore - a.gritScore);

    // 4. Segmentation
    const segmentation = [
      { name: 'Regulars (5+)', value: finalMembers.filter(m => m.totalAttendance >= 5).length, color: '#006994' },
      { name: 'Steady (2-4)', value: finalMembers.filter(m => m.totalAttendance >= 2 && m.totalAttendance <= 4).length, color: '#40E0D0' },
      { name: 'One-timers (1)', value: finalMembers.filter(m => m.totalAttendance === 1).length, color: '#94a3b8' },
    ].filter(s => s.value > 0);

    // 5. Age-based Statistics
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
      return s.date >= oneMonthAgo;
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
      membersByAge[g.label] = activeMembers.filter(m => ageMap.get(m.id) === g.label).length;
    });

    const radialStats = {
      annual: {} as Record<string, number>,
      monthly: {} as Record<string, number>,
      lastSession: {} as Record<string, number>
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const lastSession = filteredSessions[filteredSessions.length - 1];
    const lastSessionDate = lastSession ? lastSession.date : null;

    ageGroupsBase.forEach(group => {
      radialStats.annual[group.label] = 0;
      radialStats.monthly[group.label] = 0;
      radialStats.lastSession[group.label] = 0;
    });

    filteredSessions.forEach(session => {
      const sessionDate = session.date;
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
      return s.date >= thirtyDaysAgo;
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
      return s.date >= thirtyDaysAgo;
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
      women: { label: 'נשים', count: 0, totalAttendance: 0, sessionsPossible: 0, color: 'bg-red-500', hex: '#ef4444' },
      unspecified: { label: 'לא צוין', count: 0, totalAttendance: 0, sessionsPossible: 0, color: 'bg-yellow-400', hex: '#facc15' }
    };

    activeMembers.forEach(m => {
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
      const sessionMap = new Map<string, any>();
      filteredSessions.forEach(s => {
        sessionMap.set(s.date.toDateString(), s);
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
          const session = sessionMap.get(iter.toDateString());
          const count = session?.participantsCount || 0;
          const sessionDate = iter;
          const activeAtSession = activeMembers.filter(m => {
            if (session?.participantIds?.includes(m.id)) return true;
            const joinedDate = parseDate(m.joinedAt);
            if (joinedDate && joinedDate > sessionDate) return false;
            if (m.deactivatedAt) {
              const deactivatedDate = parseDate(m.deactivatedAt);
              if (deactivatedDate && deactivatedDate < sessionDate) return false;
            }
            return true;
          }).length;
          
          pulseData.push({
            date: iter.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
            count: count,
            percentage: activeAtSession > 0 ? Math.round((count / activeAtSession) * 100) : 0,
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
        if (sessions.length === 0) return 0;
        
        let potentialAttendance = 0;
        const actualAttendance = sessions.reduce((acc, s) => {
          const sessionDateStart = parseDate(s.date);
          if (!sessionDateStart) return acc;
          sessionDateStart.setHours(0, 0, 0, 0);
          const sessionDateEnd = new Date(sessionDateStart);
          sessionDateEnd.setHours(23, 59, 59, 999);
          
          const activeAtSession = members.filter(m => {
            if (ageMap.get(m.id) !== group.label) return false;
            if (s.participantIds?.includes(m.id)) return true;
            if (!m.joinedAt) return true; // If no joinedAt, assume active
            const joinedDate = parseDate(m.joinedAt);
            if (joinedDate && joinedDate > sessionDateEnd) return false;
            if (m.deactivatedAt) {
              const deactivatedDate = parseDate(m.deactivatedAt);
              if (deactivatedDate && deactivatedDate < sessionDateStart) return false;
            }
            return true;
          }).length;
          potentialAttendance += activeAtSession;
          
          return acc + (s.participantIds || []).filter((uid: string) => ageMap.get(uid) === group.label).length;
        }, 0);
        if (potentialAttendance === 0) return 0;
        return Math.min(100, Math.round((actualAttendance / potentialAttendance) * 100));
      };

      return {
        label: group.label,
        lastSession: calcRate(filteredSessions.slice(-1)),
        lastFour: calcRate(filteredSessions.slice(-4)),
        annual: calcRate(filteredSessions)
      };
    });

    // 11. Grit Leaderboard
    const filteredGrit = finalMembers.filter(m => 
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
      activeMembersCount: activeMembers.length,
      totalSessions: filteredSessions.length,
      totalAttendance: filteredSessions.reduce((acc, s) => acc + s.participantsCount, 0),
      avgAttendance: Math.round(filteredSessions.reduce((acc, s) => acc + s.participantsCount, 0) / filteredSessions.length),
      globalTrend,
      trendPercentage: Math.abs(Math.round(trendPercentage)),
      processedMembers: finalMembers,
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

  const parallelData = useMemo(() => {
    if (!stats) return [];
    return [
      { 
        name: 'סשן אחרון', 
        ...(stats.ageActivityData || []).reduce((acc, curr) => ({...acc, [curr.label]: curr.lastSession}), {}) 
      },
      { 
        name: '4 אחרונים', 
        ...(stats.ageActivityData || []).reduce((acc, curr) => ({...acc, [curr.label]: curr.lastFour}), {}) 
      },
      { 
        name: 'שנתי', 
        ...(stats.ageActivityData || []).reduce((acc, curr) => ({...acc, [curr.label]: curr.annual}), {}) 
      }
    ];
  }, [stats]);

  return (
    <div className="max-w-7xl mx-auto font-['Yehuda_CLM'] pb-20 relative" dir="rtl">
      {/* Unified Header */}
      <div className="surfboard-hero-container mb-6 space-y-2 header-wallpaper !py-10 weathered-sign" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[rgba(240,248,255,0.1)] backdrop-blur-md text-[#0071a1] mb-2 shadow-sm border-t border-l border-white/80 relative z-10">
            <BarChart3 size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title text-[#00426a]">יומן סשנים</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto text-[#00426a] font-black">
            סטטיסטיקות, נוכחות ונתוני גלישה של חברי הקהילה 📊
          </p>
        </div>
      </div>

      {/* Sea-Time & Progress Bar Row */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-12 w-full">
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
          <div className="relative admin-info-card p-8 text-center min-w-[280px]">
            <p className="text-[12px] font-black text-[#00426a] uppercase tracking-widest mb-2">זמן ים מצטבר (הערכה)</p>
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-[#00426a]">
                {stats?.totalSeaTimeHours || 0}
              </span>
              <span className="text-xl font-black text-[#00426a] mt-1">שעות גלישה מצטברות</span>
            </div>
            <p className="text-[9px] text-[#00426a] mt-4 font-bold">* מבוסס על הערכה של 90 דק' גלישה למשתתף</p>
          </div>
        </div>

        {/* Yearly Progress Bar Widget */}
        <div className="relative group w-full max-w-xl">
          <div className="absolute inset-0 bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />
          <div className="relative admin-info-card p-8 flex flex-col w-full" dir="ltr">
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
                    <p className="text-[12px] font-black text-[#00426a] uppercase tracking-widest mb-2">התקדמות שנתית - חבל זוג</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-[#00426a]">{percentage}%</span>
                      <span className="text-[12px] font-black text-[#00426a] uppercase">ביצוע</span>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="relative h-12 w-full bg-slate-200/50 rounded-2xl overflow-visible mb-8 border border-slate-200 shadow-inner">
                    {/* Percentage Markers */}
                    <div className="absolute -top-6 left-0 w-full flex justify-between px-1">
                      {[0, 20, 40, 60, 80, 100].map(p => (
                        <span key={p} className="text-[8px] font-black text-[#00426a]">{p}%</span>
                      ))}
                    </div>

                    {/* Actual Progress Fill - Growing from Right to Left (RTL) */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percentage)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-l-2xl shadow-[0_0_15px_rgba(37,99,235,0.3)] z-10"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20" />
                    </motion.div>

                    {/* Target Marker (Today's Plan) - Positioned from Right (RTL) */}
                    <div 
                      className="absolute inset-y-0 w-1 bg-orange-500 z-20 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                      style={{ left: `${targetPercent}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="text-[9px] font-black text-[#00426a] whitespace-nowrap bg-[rgba(240,248,255,0.1)] backdrop-blur-md px-2 py-0.5 rounded-full border-t border-l border-white/80 shadow-sm">היעד להיום</span>
                        <div className="w-0.5 h-2 bg-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Data Display Row */}
                  <div className="flex flex-wrap justify-between gap-4 text-[11px] font-bold text-[#00426a]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>ביצוע בפועל: <strong className="text-[#00426a]">{actualSessions} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>סשנים שבוטלו: <strong className="text-[#00426a]">{stats?.cancelledSessionsCount || 0} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>תכנון עד היום: <strong className="text-[#00426a]">{plannedToDate} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                      <span>סך הכל שנתי (פוטנציאל): <strong className="text-[#00426a]">{totalPotential} סשנים</strong></span>
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
            <div className="flex-1 bg-[rgba(240,248,255,0.1)] backdrop-blur-[20px] p-6 rounded-[2.5rem] border-t border-l border-white/80 border-b border-r border-[#00426a]/10 shadow-[0_10px_30px_rgba(49,170,193,0.15)] flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <p className="text-[12px] font-black text-[#00426a] uppercase tracking-widest">ממוצע גולשים</p>
                <div className="gt-info-wrapper">
                  <div className="gt-info-icon" style={{ width: '16px', height: '16px', fontSize: '10px', backgroundColor: 'rgba(240,248,255,0.1)', color: '#0071a1' }}>i</div>
                  <span className="gt-tooltip" style={{ bottom: '180%', width: '200px' }}>
                    ממוצע משתתפים לסשן מתחילת השנה.
                  </span>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-black text-[#00426a] leading-none">{stats?.avgAttendance}</p>
            </div>

            <div className="flex-1 bg-[rgba(240,248,255,0.1)] backdrop-blur-[20px] p-6 rounded-[2.5rem] border-t border-l border-white/80 border-b border-r border-[#00426a]/10 shadow-[0_10px_30px_rgba(49,170,193,0.15)] flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <p className="text-[12px] font-black text-[#00426a] uppercase tracking-widest">כניסות למים</p>
                <div className="gt-info-wrapper">
                  <div className="gt-info-icon" style={{ width: '16px', height: '16px', fontSize: '10px', backgroundColor: 'rgba(240,248,255,0.1)', color: '#0071a1' }}>i</div>
                  <span className="gt-tooltip" style={{ bottom: '180%', width: '200px' }}>
                    סך השתתפויות מצטבר של כל חברי הקהילה.
                  </span>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-black text-[#00426a] leading-none">{stats?.totalAttendance}</p>
            </div>

            <div className={`flex-1 p-6 rounded-[2.5rem] border-t border-l border-white/80 border-b border-r border-[#00426a]/10 shadow-[0_10px_30px_rgba(49,170,193,0.15)] flex flex-col items-center justify-center text-center ${
              stats?.globalTrend === 'up' ? 'bg-emerald-900/10 border-emerald-900/20 text-[#2D6A4F]' : 
              stats?.globalTrend === 'down' ? 'bg-rose-900/10 border-rose-900/20 text-[#BC4749]' : 
              'bg-[rgba(240,248,255,0.1)] backdrop-blur-[20px] border-white/80 text-[#00426a]'
            }`}>
              <p className="text-[12px] font-black uppercase tracking-widest opacity-60 mb-3">מגמת נוכחות</p>
              <div className="flex items-center gap-3">
                {stats?.globalTrend === 'up' ? <ArrowUpRight size={28} /> : stats?.globalTrend === 'down' ? <ArrowDownRight size={28} /> : <Minus size={28} />}
                <p className="text-3xl md:text-4xl font-black leading-none">{stats?.trendPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Gender Impact Card (Right Side) */}
            <div className="lg:col-span-5 space-y-10">
              {/* Community Composition Card */}
              <div className="relative admin-info-card p-10 overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-[#00426a] font-black text-2xl tracking-tighter">הרכב הקהילה</h3>
                    <p className="text-[#00426a] text-[12px] uppercase tracking-widest mt-1 font-bold">פילוח לפי רמת פעילות</p>
                  </div>
                  <div className="p-3 bg-[rgba(240,248,255,0.1)] backdrop-blur-md rounded-2xl text-[#0071a1] shadow-sm border-t border-l border-white/80">
                    <Users size={24} />
                  </div>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.segmentation || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(stats?.segmentation || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(240, 248, 255, 0.1)', 
                          backdropFilter: 'blur(24px)',
                          borderRadius: '16px', 
                          border: 'none',
                          boxShadow: '0 8px 32px rgba(49, 170, 193, 0.2)',
                          fontFamily: 'Yehuda_CLM',
                          direction: 'rtl'
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="relative admin-info-card p-10 overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-[#00426a] font-black text-2xl tracking-tighter">פילוח מגדרי ואימפקט</h3>
                    <p className="text-[#00426a] text-[12px] uppercase tracking-widest mt-1 font-bold">תמהיל הקהילה ומדדי התמדה</p>
                  </div>
                  <div className="p-3 bg-[rgba(240,248,255,0.1)] backdrop-blur-md rounded-2xl text-[#0071a1] shadow-sm border-t border-l border-white/80">
                    <PieChartIcon size={24} />
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="mb-12">
                  <div className="flex justify-between text-[12px] font-black text-[#00426a] uppercase tracking-widest mb-3">
                    <span>תמהיל קהילתי</span>
                    <span>{stats?.activeMembersCount} חברים פעילים</span>
                  </div>
                  <div className="flex h-4 w-full rounded-full overflow-hidden bg-black/10 p-[2px] border border-white/20">
                    {(stats?.genderImpact || []).map((item, idx) => {
                      const width = (item.count / (stats?.activeMembersCount || 1)) * 100;
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
                  {(stats?.genderImpact || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-[rgba(240,248,255,0.1)] backdrop-blur-md border-t border-l border-white/80 border-b border-r border-[#00426a]/10 hover:bg-[rgba(240,248,255,0.15)] transition-all group shadow-[0_5px_15px_rgba(49,170,193,0.1)]">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
                        <div>
                          <span className="text-[#00426a] font-black text-lg block leading-none mb-1">{item.label}</span>
                          <span className="text-[#00426a] text-[12px] font-bold uppercase tracking-widest">{item.count} חברי קהילה</span>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-2xl ${item.retention >= 90 ? 'text-[#2D6A4F]' : 'text-[#00426a]'}`}>
                            {item.retention}%
                          </span>
                          <span className="text-[#00426a]/60 text-[9px] uppercase font-black tracking-widest">מדד התמדה</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Age Attendance Rates */}
                <div className="mt-10 pt-10 border-t border-black/10">
                  <h4 className="text-[12px] font-black text-[#00426a] uppercase tracking-widest mb-6">שיעורי השתתפות לפי גיל</h4>
                  <div className="space-y-4">
                    {(stats?.radialPercentages || []).map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-[#00426a] uppercase tracking-widest">
                          <span>{item.group}</span>
                          <span>{item.annual}% שנתי</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.annual}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Insight */}
                <div className="mt-10 pt-6 border-t border-black/10">
                  <div className="bg-[rgba(240,248,255,0.1)] backdrop-blur-md p-4 rounded-2xl border-t border-l border-white/80 border-b border-r border-[#00426a]/10">
                    <p className="text-xs text-[#00426a] leading-relaxed text-center font-bold">
                      💡 <strong className="text-[#00426a]">תובנת אימפקט:</strong> {(() => {
                        const women = stats?.genderImpact?.find(g => g.key === 'women');
                        const men = stats?.genderImpact?.find(g => g.key === 'men');
                        if (women && men && women.retention > men.retention) {
                          return `קבוצת הנשים שומרת על אחוזי התמדה גבוהים (${women.retention}%) לעומת הגברים (${men.retention}%), מה שמעיד על חיבור עמוק לקהילה.`;
                        } else if (women && men) {
                          return `קבוצת הנשים מציגה אחוזי התמדה של ${women.retention}%.`;
                        }
                        return "ניתוח נתוני התמדה לפי מגדר.";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Age & Activity Card - Using White Card */}
              <div className="admin-info-card p-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-[rgba(240,248,255,0.1)] backdrop-blur-md text-[#0071a1] rounded-xl shadow-sm border-t border-l border-white/80 border-b border-r border-[#00426a]/10"><Activity size={20} /></div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-[#00426a] tracking-tighter">מדדי פעילות לפי גיל</h3>
                    <div className="gt-info-wrapper relative cursor-help">
                      <Info size={16} className="text-[#0071a1] opacity-50 hover:opacity-100 transition-opacity" />
                      <div className="gt-tooltip">
                        פילוח אחוזי השתתפות לפי קבוצות גיל בטווחי זמן שונים.
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={parallelData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#00426a', fontSize: 12, fontWeight: 900 }} 
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#00426a', fontSize: 12, fontWeight: 900 }}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(240, 248, 255, 0.1)', 
                          backdropFilter: 'blur(24px)',
                          borderRadius: '16px', 
                          borderTop: '1px solid rgba(255, 255, 255, 0.8)', 
                          borderLeft: '1px solid rgba(255, 255, 255, 0.8)', 
                          boxShadow: '0 8px 32px rgba(49, 170, 193, 0.2)',
                          fontFamily: 'Yehuda_CLM',
                          direction: 'rtl',
                          color: '#00426a'
                        }}
                        itemStyle={{ fontWeight: 900, color: '#00426a' }}
                        formatter={(value: any) => [`${value}%`, '']}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px', fontFamily: 'Yehuda_CLM', fontWeight: 900, color: '#00426a' }}
                        iconType="circle"
                      />
                      {(stats?.ageGroupsBase || []).map((group, idx) => (
                        <Line 
                          key={idx}
                          type="monotone" 
                          dataKey={group.label} 
                          name={group.label}
                          stroke={group.color} 
                          strokeWidth={4}
                          dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 8, strokeWidth: 0 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Age Stacked Data - Comparison */}
                <div className="mt-12 pt-10 border-t border-black/5 h-[300px] w-full">
                  <div className="flex items-center gap-2 mb-6">
                    <h4 className="text-lg font-black text-[#00426a] tracking-tight">השוואת נוכחות מצטברת</h4>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.ageStackedData || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#00426a', fontSize: 12, fontWeight: 900 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#00426a', fontSize: 12, fontWeight: 900 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(240, 248, 255, 0.1)', 
                          backdropFilter: 'blur(24px)',
                          borderRadius: '16px', 
                          border: 'none',
                          boxShadow: '0 8px 32px rgba(49, 170, 193, 0.2)',
                          fontFamily: 'Yehuda_CLM',
                          direction: 'rtl'
                        }}
                      />
                      <Legend />
                      {(stats?.ageGroupsBase || []).map((group, idx) => (
                        <Bar key={idx} dataKey={group.label} fill={group.color} stackId="a" radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-[#00426a] mt-6 font-bold text-center uppercase tracking-widest">הנתונים מייצגים אחוז השתתפות מתוך פוטנציאל הקבוצה</p>
              </div>
            </div>

            {/* Charts & Pulse (Left Side) - Using White Cards */}
            <div className="lg:col-span-7 space-y-10">
              {/* Pulse Area Chart */}
              <div className="admin-info-card p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-[rgba(240,248,255,0.1)] backdrop-blur-md text-[#0071a1] rounded-xl shadow-sm border-t border-l border-white/80 border-b border-r border-[#00426a]/10">
                    <Activity size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-[#00426a] tracking-tighter">דופק הקהילה (Pulse)</h3>
                    <div className="gt-info-wrapper relative cursor-help">
                      <Info size={16} className="text-[#0071a1] opacity-50 hover:opacity-100 transition-opacity" />
                      <div className="gt-tooltip">
                        מגמת נוכחות שבועית מצטברת של כלל הקהילה.
                      </div>
                    </div>
                  </div>
                  <p className="text-[12px] font-black text-[#00426a] uppercase tracking-widest">מגמת נוכחות שבועית</p>
                </div>
                
                <div className="h-[400px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.pulseData || []} margin={{ top: 10, right: 30, left: 40, bottom: 80 }}>
                      <defs>
                        <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00426a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00426a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                      
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#00426a' }}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#00426a' }} 
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="admin-info-card p-4 text-right" dir="rtl">
                                <p className="text-xs font-black mb-1 text-[#00426a]">{data.fullDate}</p>
                                <p className="text-sm font-black text-[#00426a]">
                                  <span className="text-[#00426a]">{Math.round(payload[0].value as number)}%</span> נוכחות
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
                        stroke="#00426a" 
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
              <div className="admin-info-card p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[rgba(240,248,255,0.1)] backdrop-blur-md text-[#0071a1] rounded-xl shadow-sm border-t border-l border-white/80 border-b border-r border-[#00426a]/10">
                      <Award size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-[#00426a] tracking-tighter">מדד נחישות (Grit Leaderboard)</h3>
                      <div className="gt-info-wrapper relative cursor-help">
                        <Info size={16} className="text-[#0071a1] opacity-50 hover:opacity-100 transition-opacity" />
                        <div className="gt-tooltip">
                          דירוג המבוסס על שקלול של כמות הגעה לסשנים ורצף הגעה (Streaks).
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative group min-w-[300px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0071a1]/60" size={16} />
                    <input 
                      type="text" 
                      placeholder="חפש במדד נחישות..." 
                      value={gritSearchTerm}
                      onChange={e => setGritSearchTerm(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-[rgba(240,248,255,0.1)] backdrop-blur-md border-t border-l border-white/80 border-b border-r border-[#00426a]/10 rounded-2xl font-black text-sm text-[#00426a] outline-none focus:ring-2 ring-[#31aac1]/20 transition-all placeholder:text-[#00426a]/30"
                    />
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto overflow-x-auto custom-scrollbar pr-2">
                  <table className="w-full text-right">
                    <thead className="sticky top-0 bg-[rgba(240,248,255,0.1)] backdrop-blur-md z-20 shadow-sm">
                      <tr className="border-b border-[#00426a]/10">
                        <th 
                          className="pb-6 text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-4 cursor-pointer hover:text-[#0071a1] transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'firstName', direction: prev.key === 'firstName' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            גולש <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[12px] font-black text-[#00426a] uppercase tracking-widest cursor-pointer hover:text-[#0071a1] transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'gritScore', direction: prev.key === 'gritScore' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            מדד Grit <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[12px] font-black text-[#00426a] uppercase tracking-widest cursor-pointer hover:text-[#0071a1] transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'streak', direction: prev.key === 'streak' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            רצף (Streak) <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[12px] font-black text-[#00426a] uppercase tracking-widest cursor-pointer hover:text-[#0071a1] transition-colors text-center"
                          onClick={() => setGritSortConfig(prev => ({ key: 'totalAttendance', direction: prev.key === 'totalAttendance' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center justify-center gap-1">
                            סך הכל <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                        <th className="pb-6 text-[12px] font-black text-[#00426a] uppercase tracking-widest text-center">מגמה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#00426a]/5">
                      {(stats?.gritLeaderboard || []).map((member: any) => (
                        <tr key={member.id} className="group hover:bg-[rgba(240,248,255,0.1)] transition-colors">
                          <td className="py-5 pr-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/30 shadow-sm">
                                <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + member.lastName)}&background=00426a&color=fff`} className="w-full h-full object-cover" alt="" />
                              </div>
                              <span className="font-black text-[#00426a] text-lg">{member.firstName} {member.lastName}</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-[#00426a]">{Math.round(member.gritScore)}%</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-[#00426a]">{member.streak}</span>
                              <span className="text-[12px] font-black text-[#00426a] uppercase">סשנים</span>
                            </div>
                          </td>
                          <td className="py-5 font-black text-[#00426a] text-center text-lg">{member.totalAttendance}</td>
                          <td className="py-5 text-center">
                            <div className="flex justify-center">
                              {member.trend === 'up' ? (
                                <ArrowUpRight className="text-[#2D6A4F]" size={24} />
                              ) : member.trend === 'down' ? (
                                <ArrowDownRight className="text-[#BC4749]" size={24} />
                              ) : (
                                <Minus className="text-[#00426a]/20" size={24} />
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
        <div className="py-40 text-center admin-info-card border-2 border-dashed border-[#00426a]/20">
          <BarChart3 size={64} className="mx-auto mb-8 text-[#0071a1]" />
          <h3 className="text-3xl font-black text-[#00426a] mb-4">אין מספיק נתונים לניתוח</h3>
          <p className="text-[#00426a] font-bold max-w-md mx-auto">
            כדי להציג את דף הניתוח, יש להזין סשנים במערכת החל מתאריך תחילת שנת חבל זוג ({yearConfig?.startDate || 'לא הוגדר'}).
          </p>
        </div>
      )}
    </div>
  );

};

export default SessionStatsPage;
// --- APPENDED CODE: V2 ---
export const SessionStatsPageV2 = SessionStatsPage;
