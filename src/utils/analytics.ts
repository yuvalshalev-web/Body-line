import { Member } from '../types';

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
  joiningDate: string;
  ageGroup: string;
  progress: Array<{ name: string; value: number; color: string }>;
}

export const calculateUserStats = (
  userId: string, 
  members: Member[], 
  weeklyHistory: any[], 
  yearConfig: { startDate: string; endDate: string } | null
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

  // Rank Logic
  let rank = "Rookie";
  if (totalSessions > 20) rank = "Local";
  if (totalSessions > 50) rank = "Legend";

  // Attendance Percent (vs total possible sessions in shnatHevelZug)
  const possibleSessions = relevantHistory.length;
  const attendancePercent = possibleSessions > 0 ? Math.round((totalSessions / possibleSessions) * 100) : 0;

  // Top 10% Logic
  const allCounts = members.map(m => {
    return relevantHistory.filter(s => s.participantIds?.includes(m.id)).length;
  }).sort((a, b) => b - a);
  
  const top10Threshold = allCounts[Math.floor(allCounts.length * 0.1)] || 0;
  const isTop10 = totalSessions >= top10Threshold && totalSessions > 0;

  return {
    userId,
    firstName: member.firstName,
    lastName: member.lastName,
    avatar: member.avatar,
    attendance: {
      sea: totalSessions,
      social: Math.floor(totalSessions * 0.3) // Mocking social for now
    },
    streak,
    rank,
    gritScore,
    totalSessions,
    attendancePercent,
    isTop10,
    joiningDate: member.joinedAt || "01/09/2023",
    ageGroup: "U18", // Mocking age group
    progress: [
      { name: 'Sea', value: attendancePercent, color: '#006994' },
      { name: 'Social', value: Math.min(100, streak * 20), color: '#40E0D0' }
    ]
  };
};
