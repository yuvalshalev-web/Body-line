
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
  Info,
  Sparkles
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
    now.setHours(23, 59, 59, 999);
    // 1. Filter sessions by Shnat Hevel Zug start date
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const defaultStartYear = currentMonthIndex < 8 ? currentYear - 1 : currentYear;
    const defaultStartDate = new Date(defaultStartYear, 8, 1); // Sept 1st
    const startDate = parseDate(yearConfig.startDate) || defaultStartDate;
    startDate.setHours(0, 0, 0, 0);
    const cancelledDates = new Set<string>();
    
    // Filter history for sessions after startDate
    const validSessions = weeklyHistory.filter(session => {
      const sessionDate = parseDate(session.date);
      if (sessionDate) sessionDate.setHours(0, 0, 0, 0);
      const hasParticipants = (session.participantsCount || 0) > 0 || (session.participantIds?.length || 0) > 0;
      return sessionDate && sessionDate >= startDate && sessionDate <= now && hasParticipants;
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
      { name: 'קבועים (5+)', value: finalMembers.filter(m => m.totalAttendance >= 5).length, color: '#006994' },
      { name: 'יציבים (2-4)', value: finalMembers.filter(m => m.totalAttendance >= 2 && m.totalAttendance <= 4).length, color: '#40E0D0' },
      { name: 'חד-פעמיים (1)', value: finalMembers.filter(m => m.totalAttendance === 1).length, color: '#94a3b8' },
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
      const age = calculateAge(m.birthday || (m as any).birthDate);
      if (age === null) {
        ageMap.set(m.id, null);
      } else {
        const group = ageGroupsBase.find(g => age >= g.min && age <= g.max);
        ageMap.set(m.id, group?.label || null);
      }
    });

    const ageStackedData = ageGroupsBase.map(group => {
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

      return {
        name: group.label,
        'חודש אחרון': monthlyCount,
        'מתחילת שנה': yearlyCount
      };
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
    <div className="max-w-7xl mx-auto font-yehuda pb-20 relative luxury-bg mt-8 rounded-[3rem] overflow-hidden px-4 md:px-0" dir="rtl">
      <div className="grain-overlay" />
      
      {/* Unified Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12 mt-8">
        <div className="luxury-card p-6 border border-white/40">
          <div className="surfboard-hero-container header-wallpaper !py-12 rounded-[3rem]" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
            <div className="header-content-wrapper relative z-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
                <BarChart3 size={40} />
              </div>
              <h1 className="main-page-title">
                <span className="surfer-title text-[#121212]">יומן סשנים</span>
              </h1>
              <p className="header-subtitle max-w-2xl mx-auto font-black text-[#121212]">
                סטטיסטיקות, נוכחות ונתוני גלישה של חברי הקהילה 📊
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sea-Time & Progress Bar Row */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-12 w-full px-8">
        <div className="relative group">
          <div className="luxury-card p-8 text-center min-w-[280px]">
            <div className="grain-overlay" />
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">זמן ים מצטבר (הערכה)</p>
            <div className="flex flex-col items-center relative z-10">
              <span className="text-6xl font-black text-slate-800 tracking-tighter">
                {stats?.totalSeaTimeHours || 0}
              </span>
              <span className="text-xl font-black text-slate-500 mt-1 uppercase tracking-tight">שעות גלישה מצטברות</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-4 font-bold relative z-10">* מבוסס על הערכה של 90 דק' גלישה למשתתף</p>
          </div>
        </div>

        {/* Yearly Progress Bar Widget */}
        <div className="relative group w-full max-w-xl">
          <div className="luxury-card p-8 flex flex-col w-full" dir="ltr">
            <div className="grain-overlay" />
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
                <div className="relative z-10">
                  <div className="flex flex-col items-center mb-6">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2">התקדמות שנתית - חבל זוג</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-slate-800">{percentage}%</span>
                      <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">ביצוע</span>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="relative h-12 w-full bg-slate-100 rounded-2xl overflow-visible mb-8 border border-slate-200/50 shadow-inner">
                    {/* Percentage Markers */}
                    <div className="absolute -top-6 left-0 w-full flex justify-between px-1">
                      {[0, 20, 40, 60, 80, 100].map(p => (
                        <span key={p} className="text-[8px] font-black text-slate-400">{p}%</span>
                      ))}
                    </div>

                    {/* Actual Progress Fill */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percentage)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 bg-sky-500 rounded-l-2xl shadow-[0_0_20px_rgba(14,165,233,0.3)] z-10"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20" />
                    </motion.div>

                    {/* Target Marker (Today's Plan) */}
                    <div 
                      className="absolute inset-y-0 w-1 bg-amber-500 z-20 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      style={{ left: `${targetPercent}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="text-[9px] font-black text-white bg-slate-800 px-3 py-1 rounded-full shadow-lg whitespace-nowrap">היעד להיום</span>
                        <div className="w-0.5 h-2 bg-amber-500" />
                      </div>
                    </div>
                  </div>

                  {/* Data Display Row */}
                  <div className="flex flex-wrap justify-between gap-4 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>ביצוע: <strong className="text-slate-800">{actualSessions} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>בוטלו: <strong className="text-slate-800">{stats?.cancelledSessionsCount || 0} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>תכנון: <strong className="text-slate-800">{plannedToDate} סשנים</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                      <span>פוטנציאל: <strong className="text-slate-800">{totalPotential} סשנים</strong></span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {stats ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-[400px]">
          {/* Top Stats Row - Refined Horizontal Row */}
          <div className="flex flex-row gap-4 justify-center items-stretch max-w-4xl mx-auto px-8">
            <div className="flex-1 luxury-card p-6 flex flex-col items-center justify-center text-center">
              <div className="grain-overlay" />
              <div className="flex items-center justify-center gap-2 mb-3 relative z-10">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">ממוצע גולשים</p>
                <div className="gt-info-wrapper">
                  <div className="gt-info-icon" style={{ width: '16px', height: '16px', fontSize: '10px', background: 'transparent', border: '1px solid currentColor', color: '#0ea5e9' }}>i</div>
                  <span className="gt-tooltip" style={{ bottom: '180%', width: '200px' }}>
                    ממוצע משתתפים לסשן מתחילת השנה.
                  </span>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-black text-slate-800 leading-none relative z-10">{stats?.avgAttendance}</p>
            </div>

            <div className="flex-1 luxury-card p-6 flex flex-col items-center justify-center text-center">
              <div className="grain-overlay" />
              <div className="flex items-center justify-center gap-2 mb-3 relative z-10">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">כניסות למים</p>
                <div className="gt-info-wrapper">
                  <div className="gt-info-icon" style={{ width: '16px', height: '16px', fontSize: '10px', background: 'transparent', border: '1px solid currentColor', color: '#0ea5e9' }}>i</div>
                  <span className="gt-tooltip" style={{ bottom: '180%', width: '200px' }}>
                    סך השתתפויות מצטבר של כל חברי הקהילה.
                  </span>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-black text-slate-800 leading-none relative z-10">{stats?.totalAttendance}</p>
            </div>

            <div className={`flex-1 luxury-card p-6 flex flex-col items-center justify-center text-center ${
              stats?.globalTrend === 'up' ? 'border-emerald-500/20' : 
              stats?.globalTrend === 'down' ? 'border-rose-500/20' : 
              ''
            }`}>
              <div className="grain-overlay" />
              <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-3 relative z-10">מגמת נוכחות</p>
              <div className="flex items-center gap-3 relative z-10">
                {stats?.globalTrend === 'up' ? <ArrowUpRight size={28} className="text-emerald-500" /> : stats?.globalTrend === 'down' ? <ArrowDownRight size={28} className="text-rose-500" /> : <Minus size={28} className="text-slate-400" />}
                <p className={`text-3xl md:text-4xl font-black leading-none ${
                    stats?.globalTrend === 'up' ? 'text-emerald-600' : 
                    stats?.globalTrend === 'down' ? 'text-rose-600' : 
                    'text-slate-800'
                }`}>{stats?.trendPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-8">
            
            {/* Gender Impact Card (Right Side) */}
            <div className="lg:col-span-5 space-y-10">
              {/* Community Composition Card */}
              <div className="luxury-card p-8 min-h-[550px] flex flex-col items-center justify-center">
                <div className="grain-overlay" />
                
                <div className="w-full flex items-center justify-between mb-8 relative z-10 px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 shadow-inner border border-sky-500/20">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">תדירות השתתפות</h3>
                        <div className="relative group flex items-center">
                          <Info size={16} className="text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
                          <div className="absolute right-0 top-full mt-2 w-64 p-4 luxury-card !bg-white/95 text-slate-700 text-xs font-black rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed border-white">
                            פילוח כמותי של חברי הקהילה לפי מספר ההגעות שלהם בטווח הזמן הנבחר.
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em]">Attendance Frequency • Ocean Analytics</p>
                    </div>
                  </div>
                </div>

                {/* Classification Summary */}
                <div className="w-full mb-6 grid grid-cols-3 gap-3 relative z-10">
                  {(stats?.segmentation || []).map((group: any) => {
                    const totalCount = (stats?.segmentation || []).reduce((acc: number, curr: any) => acc + curr.value, 0);
                    const percentage = totalCount > 0 ? Math.round((group.value / totalCount) * 100) : 0;
                    return (
                      <div key={group.name} className="flex flex-col items-center p-3 rounded-2xl bg-white/40 border border-white/60 shadow-sm">
                        <span className="text-[10px] font-black mb-1 uppercase tracking-tighter" style={{ color: group.color }}>{group.name}</span>
                        <span className="text-lg font-black text-slate-800">{percentage}%</span>
                        <span className="text-[10px] text-slate-400 font-bold">{group.value} חברים</span>
                      </div>
                    );
                  })}
                </div>

                {/* Member Classification Pie Chart */}
                <div className="w-full relative h-[350px] z-10 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.segmentation || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={2}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value, fill, payload }) => {
                          if (midAngle === undefined || percent === undefined) return null;
                          const RADIAN = Math.PI / 180;
                          const sin = Math.sin(-RADIAN * midAngle);
                          const cos = Math.cos(-RADIAN * midAngle);
                          const sx = cx + (outerRadius) * cos;
                          const sy = cy + (outerRadius) * sin;
                          const mx = cx + (outerRadius + 25) * cos;
                          const my = cy + (outerRadius + 25) * sin;
                          const ex = mx + (cos >= 0 ? 1 : -1) * 20;
                          const ey = my;
                          const textAnchor = cos >= 0 ? 'start' : 'end';
                          const safeFill = fill || payload?.color || '#00426a';

                          return (
                            <g style={{ pointerEvents: 'none' }}>
                              <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={safeFill} fill="none" strokeWidth={2} />
                              <circle cx={ex} cy={ey} r={4} fill={safeFill} stroke="none" />
                              <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey - 8} textAnchor={textAnchor} fill={safeFill} className="text-[11px] font-black" dominantBaseline="central">
                                {name}
                              </text>
                              <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey + 10} textAnchor={textAnchor} fill="#64748b" className="text-[10px] font-black" dominantBaseline="central">
                                {`${value} (${(percent * 100).toFixed(0)}%)`}
                              </text>
                            </g>
                          );
                        }}
                      >
                        {(stats?.segmentation || []).map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="luxury-card p-4 !bg-white/95 border-white shadow-2xl">
                                <p className="text-xs font-black mb-1 uppercase tracking-widest" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
                                <p className="text-2xl font-black text-slate-800">{payload[0].value} <span className="text-[12px] text-slate-400 font-bold uppercase tracking-tight">חברים</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-slate-800 tracking-tighter">
                      {(stats?.segmentation || []).reduce((acc: number, curr: any) => acc + curr.value, 0)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">סה״כ חברים</span>
                  </div>
                </div>
              </div>

              <div className="luxury-card p-10 overflow-hidden">
                <div className="grain-overlay" />
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div>
                    <h3 className="text-slate-800 font-black text-2xl tracking-tighter">פילוח מגדרי ואימפקט</h3>
                    <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] mt-1 font-black">Community Mix • Retention Metrics</p>
                  </div>
                  <div className="p-3 bg-sky-500/10 text-sky-600 rounded-2xl shadow-sm border border-sky-500/20">
                    <PieChartIcon size={24} />
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="mb-12 relative z-10">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <span>תמהיל קהילתי</span>
                    <span>{stats?.activeMembersCount} חברים פעילים</span>
                  </div>
                  <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-100 border border-slate-200/50">
                    {(stats?.genderImpact || []).map((item, idx) => {
                      const width = (item.count / (stats?.activeMembersCount || 1)) * 100;
                      if (width === 0) return null;
                      return (
                        <div 
                          key={idx}
                          className={`${item.color} h-full transition-all duration-1000 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]`}
                          style={{ 
                            width: `${width}%`
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="space-y-4 relative z-10">
                  {(stats?.genderImpact || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-white/40 border border-white hover:bg-white/60 transition-all group shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm outline outline-2 outline-white`} />
                        <div>
                          <span className="text-slate-800 font-black text-lg block leading-none mb-1">{item.label}</span>
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{item.count} חברים</span>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-2xl ${item.retention >= 90 ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {item.retention}%
                          </span>
                          <span className="text-slate-400 text-[9px] uppercase font-black tracking-widest">התמדה</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Age Attendance Rates */}
                <div className="mt-10 pt-10 border-t border-slate-100 relative z-10">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">שיעורי השתתפות לפי גיל</h4>
                  <div className="space-y-6">
                    {(stats?.radialPercentages || []).map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                          <span>{item.group}</span>
                          <span>{item.annual}% שנתי</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.annual}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Insight */}
                <div className="mt-10 pt-10 border-t border-slate-100 relative z-10">
                  <div className="bg-sky-500/5 p-5 rounded-2xl border border-sky-500/10">
                    <p className="text-xs text-slate-600 leading-relaxed text-center font-bold">
                      💡 <strong className="text-sky-700 uppercase tracking-tighter">Impact Insight:</strong> {(() => {
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

              {/* Age & Activity Card */}
              <div className="luxury-card p-10">
                <div className="grain-overlay" />
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl shadow-sm border border-indigo-500/20"><Activity size={20} /></div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">מדדי פעילות לפי גיל</h3>
                    <div className="relative group">
                      <Info size={16} className="text-slate-400 opacity-50 hover:opacity-100 transition-opacity cursor-help" />
                      <div className="absolute right-0 bottom-full mb-2 w-64 p-4 luxury-card !bg-white/95 text-slate-700 text-xs font-black rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border-white">
                        פילוח אחוזי השתתפות לפי קבוצות גיל בטווחי זמן שונים.
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="h-[300px] w-full mt-4 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={parallelData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          backdropFilter: 'blur(12px)',
                          borderRadius: '16px', 
                          border: '1px solid #fff',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                          fontFamily: 'Yehuda_CLM',
                          direction: 'rtl',
                          padding: '12px'
                        }}
                        itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900 }}
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
                          dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: group.color }}
                          activeDot={{ r: 7, strokeWidth: 0, fill: group.color }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Age Stacked Data - Comparison */}
                <div className="mt-12 pt-10 border-t border-slate-100 h-[300px] w-full relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">השוואת נוכחות מצטברת</h4>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.ageStackedData || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          backdropFilter: 'blur(12px)',
                          borderRadius: '16px', 
                          border: '1px solid #fff',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                          fontFamily: 'Yehuda_CLM',
                          direction: 'rtl'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900 }}
                      />
                      <Bar dataKey="חודש אחרון" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="מתחילת שנה" fill="#00426a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-slate-400 mt-6 font-black text-center uppercase tracking-widest relative z-10">הנתונים מייצגים אחוז השתתפות מתוך פוטנציאל הקבוצה</p>
              </div>
            </div>

            {/* Charts & Pulse (Left Side) */}
            <div className="lg:col-span-7 space-y-10">
              {/* Pulse Area Chart */}
              <div className="luxury-card p-10">
                <div className="grain-overlay" />
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl shadow-sm border border-sky-500/20">
                    <Activity size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">דופק הקהילה (Pulse)</h3>
                    <div className="relative group">
                      <Info size={16} className="text-slate-400 opacity-50 hover:opacity-100 transition-opacity cursor-help" />
                      <div className="absolute right-0 bottom-full mb-2 w-64 p-4 luxury-card !bg-white/95 text-slate-700 text-xs font-black rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border-white">
                        מגמת נוכחות שבועית מצטברת של כלל הקהילה.
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-auto">Community Heartbeat</p>
                </div>
                
                <div className="h-[400px] w-full mt-6 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.pulseData || []} margin={{ top: 10, right: 30, left: 40, bottom: 80 }}>
                      <defs>
                        <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} 
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="luxury-card p-4 !bg-white/95 border-white shadow-2xl text-right" dir="rtl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{data.fullDate}</p>
                                <p className="text-xl font-black text-slate-800 leading-none">
                                  {Math.round(payload[0].value as number)}% <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">נוכחות</span>
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
                        stroke="#0ea5e9" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorPulse)" 
                        animationDuration={2000}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grit Leaderboard */}
              <div className="luxury-card p-10">
                <div className="grain-overlay" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl shadow-sm border border-amber-500/20">
                      <Award size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tighter">מדד נחישות</h3>
                      <div className="relative group">
                        <Info size={16} className="text-slate-400 opacity-50 hover:opacity-100 transition-opacity cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 w-64 p-4 luxury-card !bg-white/95 text-slate-700 text-xs font-black rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border-white">
                          דירוג המבוסס על שקלול של כמות הגעה לסשנים ורצף הגעה (Streaks).
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative group min-w-[300px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      placeholder="חפש במדד נחישות..." 
                      value={gritSearchTerm}
                      onChange={e => setGritSearchTerm(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-white border border-slate-100 rounded-2xl font-black text-sm text-slate-800 outline-none focus:ring-4 ring-sky-500/5 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto overflow-x-auto custom-scrollbar pr-2 relative z-10">
                  <table className="w-full text-right">
                    <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-20">
                      <tr className="border-b border-slate-100">
                        <th 
                          className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-4 cursor-pointer hover:text-sky-600 transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'firstName', direction: prev.key === 'firstName' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            גולש <ArrowUpDown size={10} className="text-slate-300" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-sky-600 transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'gritScore', direction: prev.key === 'gritScore' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            מדד Grit <ArrowUpDown size={10} className="text-slate-300" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-sky-600 transition-colors"
                          onClick={() => setGritSortConfig(prev => ({ key: 'streak', direction: prev.key === 'streak' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center gap-1">
                            רצף (Streak) <ArrowUpDown size={10} className="text-slate-300" />
                          </div>
                        </th>
                        <th 
                          className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-sky-600 transition-colors text-center"
                          onClick={() => setGritSortConfig(prev => ({ key: 'totalAttendance', direction: prev.key === 'totalAttendance' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center justify-center gap-1">
                            סה״כ <ArrowUpDown size={10} className="text-slate-300" />
                          </div>
                        </th>
                        <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">מגמה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(stats?.gritLeaderboard || []).map((member: any) => (
                        <tr key={member.id} className="group hover:bg-sky-50/50 transition-colors">
                          <td className="py-5 pr-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center flex-shrink-0">
                                {member.avatar ? (
                                  <img src={member.avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                ) : (
                                  <Users className="text-slate-300" size={24} />
                                )}
                              </div>
                              <span className="font-black text-slate-800 text-lg tracking-tight">{member.firstName} {member.lastName}</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-slate-800 tracking-tighter">{Math.round(member.gritScore)}%</span>
                            </div>
                          </td>
                          <td className="py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-slate-800">{member.streak}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions</span>
                            </div>
                          </td>
                          <td className="py-5 font-black text-slate-800 text-center text-lg">{member.totalAttendance}</td>
                          <td className="py-5 text-center">
                            <div className="flex justify-center">
                              {member.trend === 'up' ? (
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                  <ArrowUpRight size={20} />
                                </div>
                              ) : member.trend === 'down' ? (
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                                  <ArrowDownRight size={20} />
                                </div>
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
        <div className="py-40 text-center luxury-card mx-8 mb-20">
          <div className="grain-overlay" />
          <BarChart3 size={64} className="mx-auto mb-8 text-slate-200" />
          <h3 className="text-3xl font-black text-slate-400 mb-4 tracking-tighter">אין מספיק נתונים לניתוח</h3>
          <p className="text-slate-300 font-bold max-w-md mx-auto">
            מערכת האנליטיקה זקוקה ליותר נתוני סשנים כדי להפיק דוחות מעמיקים.
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionStatsPage;
