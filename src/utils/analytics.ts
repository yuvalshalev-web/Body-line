import { Member } from '../../types';
import { formatDate } from './dateUtils';

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
  
  // Filter history for sessions after startDate
  const relevantHistory = weeklyHistory.filter(session => {
    const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
    return sessionDate >= startDate;
  });

  // Calculate attendance
  const userSessions = relevantHistory.filter(session => 
    session.participantIds?.includes(userId)
  );

  const totalSessions = userSessions.length;

  // Calculate Social Attendance
  const socialEvents = events.filter(e => e.type === 'COMMUNITY');
  const userSocialAttendance = socialEvents.filter(e => e.attendees?.includes(userId)).length;
  const totalSocialEvents = socialEvents.length;
  const socialPercent = totalSocialEvents > 0 ? Math.round((userSocialAttendance / totalSocialEvents) * 100) : 100;
  
  // Calculate Streak (consecutive weeks)
  // Sort history by date desc
  const sortedHistory = [...relevantHistory].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
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
    { name: "Grommet", min: 0 },
    { name: "Rookie", min: 6 },
    { name: "Local", min: 15 },
    { name: "Pro", min: 30 },
    { name: "Legend", min: 42 }
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

  // Top 10% Logic
  const allCounts = members.map(m => {
    return relevantHistory.filter(s => s.participantIds?.includes(m.id)).length;
  }).sort((a, b) => b - a);
  
  const top10Threshold = allCounts[Math.floor(allCounts.length * 0.1)] || 0;
  const isTop10 = totalSessions >= top10Threshold && totalSessions > 0;

  // Improved Percentile calculation (Standard Percentile Rank formula)
  const otherCounts = members
    .filter(m => m.id !== userId)
    .map(m => relevantHistory.filter(s => s.participantIds?.includes(m.id)).length);
  
  const strictlySmaller = otherCounts.filter(c => c < totalSessions).length;
  const tied = otherCounts.filter(c => c === totalSessions).length;
  const totalOthers = otherCounts.length;
  
  // PR = (L + 0.5S) / N * 100
  const percentile = totalOthers > 0 
    ? Math.round(((strictlySmaller + (0.5 * tied)) / totalOthers) * 100) 
    : 100;

  // Yearly Stability Calculation (based on Shnat Hevel Zug)
  const now = new Date();
  const seasonStart = yearConfig?.startDate ? new Date(yearConfig.startDate) : new Date('2026-01-01');
  const seasonEnd = yearConfig?.endDate ? new Date(yearConfig.endDate) : new Date('2026-12-31');
  
  // Calculate total weeks passed in the current season up to now
  const effectiveEnd = now < seasonEnd ? now : seasonEnd;
  const diffTime = Math.max(0, effectiveEnd.getTime() - seasonStart.getTime());
  const totalWeeksPassed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)));

  // Filter user sessions to only those in the current season
  const userSessionsSeason = userSessions.filter(s => {
    const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
    return d >= seasonStart && d <= seasonEnd;
  });

  // Calculate active weeks (weeks with at least one session attended) in the season
  const userSessionWeeks = new Set(userSessionsSeason.map(s => {
    const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
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
