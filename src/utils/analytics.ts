import { Member } from '../../types';
import { formatDate } from './dateUtils';
import { getBodyLineStats } from './bodyLineStats';

export interface UserStats {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  attendance: {
    sea: number;
    social: number;
  };
  streak: number;
  rank: string;
  gritScore: number;
  averageGrit: number;
  totalSessions: number;
  attendancePercent: number;
  isTop10: boolean;
  percentile: number;
  joiningDate: string;
  ageGroup: string;
  progress: Array<{ name: string; value: number; color: string }>;
  yearlyStability: {
    percent: number;
    activeWeeks: number;
    totalWeeks: number;
  };
  rankThresholds: Array<{ name: string; min: number }>;
  sessionsToNextRank: number;
  nextRankName: string | null;
}

export const calculateUserStats = (
  userId: string, 
  members: Member[], 
  weeklyHistory: any[], 
  yearConfig: { startDate: string; endDate: string } | null,
  events: any[] = []
): UserStats | null => {
  const member = members.find(m => m.id === userId);
  if (!member) return null;

  const startDate = yearConfig?.startDate ? new Date(yearConfig.startDate) : new Date(0);
  const now = new Date();
  
  // Filter history for sessions after startDate, ignoring cancelled sessions
  const validSessions = weeklyHistory.filter(session => {
    const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
    return sessionDate >= startDate && sessionDate <= now && (session.participantsCount || 0) > 0;
  });

  // Group by week (Thursday) to merge participantIds
  const sessionsByDate = new Map<string, { date: Date, participantIds: Set<string> }>();
  validSessions.forEach(session => {
    const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
    
    // Normalize to Thursday 07:00
    const day = sessionDate.getDay();
    const diff = 4 - day;
    const thursdayDate = new Date(sessionDate);
    thursdayDate.setDate(thursdayDate.getDate() + diff);
    thursdayDate.setHours(7, 0, 0, 0);
    
    const dateKey = thursdayDate.toDateString();
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, { date: thursdayDate, participantIds: new Set<string>() });
    }
    (session.participantIds || []).forEach((id: string) => sessionsByDate.get(dateKey)!.participantIds.add(id));
  });

  const relevantHistory = Array.from(sessionsByDate.values()).map(s => ({
    date: s.date,
    participantIds: Array.from(s.participantIds)
  }));

  // Calculate attendance
  const userSessions = relevantHistory.filter(session => 
    session.participantIds?.includes(userId)
  );

  const totalSessions = userSessions.length;

  // Calculate Social Attendance (Only past events)
  const pastSocialEvents = events.filter(e => {
    const eventDate = e.date?.toDate ? e.date.toDate() : new Date(e.date);
    return (e.type === 'COMMUNITY' || e.type === 'MEMBER') && eventDate < now;
  });
  const userSocialAttendance = pastSocialEvents.filter(e => e.attendees?.includes(userId)).length;
  const totalSocialEvents = pastSocialEvents.length;
  const socialPercent = totalSocialEvents > 0 ? Math.round((userSocialAttendance / totalSocialEvents) * 100) : 0;
  
  // Calculate Streak (consecutive weeks)
  // Sort history by date desc
  const sortedHistory = [...relevantHistory].sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
  });

  let streak = 0;
  for (const session of sortedHistory) {
    if (session.participantIds?.includes(userId)) {
      streak++;
    } else {
      break;
    }
  }

  // Grit Score Logic: (Total Sessions * 2) + (Streak * 5)
  const gritScore = Math.min(100, (totalSessions * 1.5) + (streak * 4));

  // Rank Logic & Next Rank Calculation (Adjusted for once-a-week schedule)
  const rankThresholds = [
    { name: "פופ-אפיסט", min: 0 },
    { name: "תופס פינה", min: 5 },
    { name: "ליין-אפיסט", min: 10 },
    { name: "שואו-אפיסט", min: 20 },
    { name: "קלי סלייטר", min: 40 }
  ];

  let currentRankIndex = 0;
  for (let i = rankThresholds.length - 1; i >= 0; i--) {
    if (totalSessions >= rankThresholds[i].min) {
      currentRankIndex = i;
      break;
    }
  }

  const rank = rankThresholds[currentRankIndex].name;
  const nextRank = currentRankIndex < rankThresholds.length - 1 ? rankThresholds[currentRankIndex + 1] : null;
  const sessionsToNextRank = nextRank ? nextRank.min - totalSessions : 0;

  // Attendance Percent (vs total possible sessions in shnatHevelZug)
  const possibleSessions = relevantHistory.length;
  const attendancePercent = possibleSessions > 0 ? Math.round((totalSessions / possibleSessions) * 100) : 0;

  // Use getBodyLineStats for Percentile calculation based on Grit Score
  // First, we need to calculate grit for all members
  const membersWithStats = members.map(m => {
    const mSessions = relevantHistory.filter(s => s.participantIds?.includes(m.id));
    const mTotalSessions = mSessions.length;
    
    let mStreak = 0;
    for (const session of sortedHistory) {
      if (session.participantIds?.includes(m.id)) {
        mStreak++;
      } else {
        break;
      }
    }
    
    const mGritScore = Math.min(100, (mTotalSessions * 1.5) + (mStreak * 4));
    
    return {
      ...m,
      gritScore: mGritScore
    };
  });

  const statsHelper = getBodyLineStats(membersWithStats as any);
  const percentileValue = parseFloat(statsHelper.calculatePercentile(gritScore, 'gritScore'));
  const percentile = Math.round(percentileValue);
  const isTop10 = percentile >= 90 && totalSessions > 0;
  const averageGrit = statsHelper.getAverage('gritScore');

  // Yearly Stability Calculation (based on Shnat Hevel Zug)
  const seasonStart = yearConfig?.startDate ? new Date(yearConfig.startDate) : new Date('2026-01-01');
  const seasonEnd = yearConfig?.endDate ? new Date(yearConfig.endDate) : new Date('2026-12-31');
  
  // Calculate total weeks passed in the current season up to now
  const effectiveEnd = now < seasonEnd ? now : seasonEnd;
  const diffTime = Math.max(0, effectiveEnd.getTime() - seasonStart.getTime());
  const totalWeeksPassed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)));

  // Filter user sessions to only those in the current season
  const userSessionsSeason = userSessions.filter(s => {
    const d = s.date;
    return d >= seasonStart && d <= seasonEnd;
  });

  // Calculate active weeks (weeks with at least one session attended) in the season
  const userSessionWeeks = new Set(userSessionsSeason.map(s => {
    const d = s.date;
    // Simple week identifier: Year-WeekNumber
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
    return `${d.getFullYear()}-${weekNum}`;
  }));
  
  const activeWeeks = userSessionWeeks.size;
  const stabilityPercent = Math.min(100, Math.round((activeWeeks / totalWeeksPassed) * 100));

  return {
    userId,
    firstName: member.firstName,
    lastName: member.lastName,
    avatar: member.avatar,
    attendance: {
      sea: totalSessions,
      social: userSocialAttendance
    },
    streak,
    rank,
    gritScore,
    averageGrit,
    totalSessions,
    attendancePercent,
    isTop10,
    percentile,
    joiningDate: formatDate(member.joinedAt) || "01/09/2023",
    ageGroup: "U18", // Mocking age group
    progress: [
      { name: 'Sea', value: attendancePercent, color: '#006994' },
      { name: 'Social', value: socialPercent, color: '#40E0D0' }
    ],
    yearlyStability: {
      percent: stabilityPercent,
      activeWeeks,
      totalWeeks: totalWeeksPassed
    },
    rankThresholds,
    sessionsToNextRank,
    nextRankName: nextRank ? nextRank.name : null
  };
};

export const calculateSeasonalGrit = (weeklyHistory: any[], members: Member[]) => {
  if (!weeklyHistory || weeklyHistory.length === 0 || !members) return [];

  // Helper to safely parse dates from Firestore
  const parseDate = (date: any) => {
    if (!date) return new Date(NaN);
    if (typeof date.toDate === 'function') return date.toDate();
    if (typeof date.seconds === 'number') return new Date(date.seconds * 1000);
    return new Date(date);
  };

  // Filter and normalize sessions
  const sessionsByDate = new Map<string, { date: Date, count: number }>();
  weeklyHistory.forEach(session => {
    const sessionDate = parseDate(session.date);
    if (isNaN(sessionDate.getTime())) return;
    
    const day = sessionDate.getDay();
    const diff = 4 - day;
    const thursdayDate = new Date(sessionDate);
    thursdayDate.setDate(thursdayDate.getDate() + diff);
    thursdayDate.setHours(7, 0, 0, 0);
    
    const dateKey = thursdayDate.toDateString();
    const currentCount = session.participantsCount || 0;
    if (!sessionsByDate.has(dateKey) || currentCount > sessionsByDate.get(dateKey)!.count) {
      sessionsByDate.set(dateKey, { date: thursdayDate, count: currentCount });
    }
  });

  const normalizedSessions = Array.from(sessionsByDate.values());

  // Seasons definition
  const seasons = [
    { name: 'סתיו', months: [8, 9, 10] },
    { name: 'חורף', months: [11, 0, 1] },
    { name: 'אביב', months: [2, 3, 4] },
    { name: 'קיץ', months: [5, 6, 7] },
  ];

  return seasons.map(season => {
    const seasonSessions = normalizedSessions.filter(s => {
      const month = s.date.getMonth();
      return season.months.includes(month);
    });

    if (seasonSessions.length === 0) return { name: season.name, score: 0 };

    let totalActuals = 0;
    let totalCapacity = 0;

    seasonSessions.forEach(s => {
      // Calculate how many members were active AT THE TIME of this session
      const activeAtTime = members.filter(m => {
        const joinedDate = new Date(m.joinedAt);
        if (joinedDate > s.date) return false;
        
        if (m.deactivatedAt) {
          const deactivatedDate = new Date(m.deactivatedAt);
          if (deactivatedDate < s.date) return false;
        }
        return true;
      }).length;

      totalActuals += s.count;
      totalCapacity += activeAtTime;
    });

    const avgScore = totalCapacity > 0 ? Math.round((totalActuals / totalCapacity) * 100) : 0;
    return { 
      name: season.name, 
      score: Math.min(100, avgScore),
      actuals: totalActuals,
      capacity: totalCapacity,
      sessionCount: seasonSessions.length
    };
  });
};
