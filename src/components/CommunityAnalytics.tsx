import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  User,
  TrendingUp, 
  MessageSquare,
  Activity,
  UserCheck,
  UserMinus,
  Heart,
  Sparkles,
  Waves,
  X,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { parseDate } from '../utils/dateUtils';
import { isAppShaperUser } from '../constants';
import { EliteStatCard } from './UserAnalytics';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { calculateAge } from '../utils/dateUtils';

const CommunityAnalytics: React.FC = () => {
  const { members, weeklyHistory, siteConfig, yearConfig, isLoading, updateMember } = useData();
  const [compositionTab, setCompositionTab] = useState<'status' | 'age' | 'gender'>('status');
  const [selectedGroup, setSelectedGroup] = useState<{ type: 'status' | 'age' | 'gender'; name: string } | null>(null);

  const stats = useMemo(() => {
    if (!members.length) return null;

    const communityMembers = members.filter(m => m.role !== 'Staff' && !isAppShaperUser(m));
    const activeMembers = communityMembers.filter(m => m.isActive);
    const totalMembers = communityMembers.length;

    // 1. Demographics
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const currentDate = now;
    const seasonStart = yearConfig?.startDate ? parseDate(yearConfig.startDate) || new Date('2026-01-01') : new Date('2026-01-01');
    seasonStart.setHours(0, 0, 0, 0);
    const seasonEnd = yearConfig?.endDate ? parseDate(yearConfig.endDate) || new Date('2026-12-31') : new Date('2026-12-31');
    seasonEnd.setHours(23, 59, 59, 999);

    const surfHistory = weeklyHistory.filter(s => !s.isEvent);

    const rawValidSessions = surfHistory.filter(session => {
      const sessionDate = parseDate(session.date);
      if (sessionDate) sessionDate.setHours(0, 0, 0, 0);
      if (!sessionDate || isNaN(sessionDate.getTime())) return false;
      const hasParticipants = (session.participantsCount || 0) > 0 || (session.participantIds?.length || 0) > 0;
      return sessionDate >= seasonStart && sessionDate <= seasonEnd && sessionDate <= currentDate && hasParticipants;
    });

    // Group by week (Thursday) to merge participantIds
    const sessionsByDate = new Map<string, { date: Date, participantIds: Set<string> }>();
    rawValidSessions.forEach(session => {
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
        sessionsByDate.set(dateKey, { date: thursdayDate, participantIds: new Set<string>() });
      }
      (session.participantIds || []).forEach((id: string) => sessionsByDate.get(dateKey)!.participantIds.add(id));
    });

    const validSessions = Array.from(sessionsByDate.values()).map(s => ({
      date: s.date,
      participantIds: Array.from(s.participantIds)
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const ageGroups = {
      'צעירים (18-25)': 0,
      'בוגרים (26-40)': 0,
      'אמצע החיים (41-60)': 0,
      'ותיקים (60+)': 0,
      'לא צוין / אחר': 0,
    };

    const ageGroupsTotal = {
      'צעירים (18-25)': 0,
      'בוגרים (26-40)': 0,
      'אמצע החיים (41-60)': 0,
      'ותיקים (60+)': 0,
      'לא צוין / אחר': 0,
    };

    activeMembers.forEach(m => {
      const age = calculateAge(m.birthday || (m as any).birthDate);
      if (age === null) {
        ageGroups['לא צוין / אחר']++;
        return;
      }
      if (age >= 18 && age <= 25) ageGroups['צעירים (18-25)']++;
      else if (age >= 26 && age <= 40) ageGroups['בוגרים (26-40)']++;
      else if (age >= 41 && age <= 60) ageGroups['אמצע החיים (41-60)']++;
      else if (age > 60) ageGroups['ותיקים (60+)']++;
      else ageGroups['לא צוין / אחר']++;
    });

    communityMembers.forEach(m => {
      const age = calculateAge(m.birthday || (m as any).birthDate);
      if (age === null) {
        ageGroupsTotal['לא צוין / אחר']++;
        return;
      }
      if (age >= 18 && age <= 25) ageGroupsTotal['צעירים (18-25)']++;
      else if (age >= 26 && age <= 40) ageGroupsTotal['בוגרים (26-40)']++;
      else if (age >= 41 && age <= 60) ageGroupsTotal['אמצע החיים (41-60)']++;
      else if (age > 60) ageGroupsTotal['ותיקים (60+)']++;
      else ageGroupsTotal['לא צוין / אחר']++;
    });

    // 4. Vitality Orbit (8-session logic)
    const last8Sessions = surfHistory.slice(0, 8);
    const sessionCount = last8Sessions.length;

    const cohorts = [
      { label: 'צעירים', key: 'צעירים (18-25)' },
      { label: 'בוגרים', key: 'בוגרים (26-40)' },
      { label: 'אמצע חיים', key: 'אמצע החיים (41-60)' },
      { label: 'ותיקים', key: 'ותיקים (60+)' }
    ].map(c => {
      const groupMembers = activeMembers.filter(m => {
        const age = calculateAge(m.birthday || (m as any).birthDate);
        if (age === null) return false;
        if (c.key === 'צעירים (18-25)') return age >= 18 && age <= 25;
        if (c.key === 'בוגרים (26-40)') return age >= 26 && age <= 40;
        if (c.key === 'אמצע החיים (41-60)') return age >= 41 && age <= 60;
        if (c.key === 'ותיקים (60+)') return age > 60;
        return false;
      });

      const potentialAttendance = last8Sessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);
      const actualAttendance = last8Sessions.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);

      const retention = potentialAttendance > 0 
        ? Math.round((actualAttendance / potentialAttendance) * 100) 
        : 0;

      // Calculate Yearly Retention
      const yearlyPotentialAttendance = surfHistory.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);
      const yearlyActualAttendance = surfHistory.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);
      const yearlyRetention = yearlyPotentialAttendance > 0 
        ? Math.round((yearlyActualAttendance / yearlyPotentialAttendance) * 100) 
        : 0;

      // Pulse logic: Retention < 60% in the last 2 sessions
      const last2Sessions = last8Sessions.slice(0, 2);
      const potentialAttendanceLast2 = last2Sessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);
      const actualAttendanceLast2 = last2Sessions.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);
      const retentionLast2 = potentialAttendanceLast2 > 0 
        ? (actualAttendanceLast2 / potentialAttendanceLast2) * 100 
        : 0;

      // Color logic based on retention (8-session)
      let colorClass = 'from-slate-400 to-slate-500';
      let glowColor = 'rgba(148, 163, 184, 0.5)';
      let hexColor = '#94a3b8';
      
      if (retention >= 80) {
        colorClass = 'from-emerald-400 to-teal-500';
        glowColor = 'rgba(16, 185, 129, 0.6)';
        hexColor = '#10b981';
      } else if (retention >= 50) {
        colorClass = 'from-sky-400 to-blue-500';
        glowColor = 'rgba(14, 165, 233, 0.6)';
        hexColor = '#0ea5e9';
      } else if (retention > 0) {
        colorClass = 'from-orange-500 to-red-600';
        glowColor = 'rgba(239, 68, 68, 0.6)';
        hexColor = '#ef4444';
      }

      return {
        label: c.label,
        retention,
        yearlyRetention,
        count: groupMembers.length,
        color: colorClass,
        hexColor,
        glow: glowColor,
        shouldPulse: retention < 50 && groupMembers.length > 0
      };
    });

    // 2. Gender Mix
    const genderCounts = {
      'זכר': activeMembers.filter(m => m.gender === 'זכר').length,
      'נקבה': activeMembers.filter(m => m.gender === 'נקבה' && m.role !== 'Staff').length,
      'אחר': activeMembers.filter(m => !m.gender || m.gender === 'מעדיפ/ה לא לציין' || m.gender === 'לא בינארי').length,
    };

    const totalWomen = communityMembers.filter(m => m.gender === 'נקבה').length;
    const activeWomen = activeMembers.filter(m => m.gender === 'נקבה' && m.role !== 'Staff').length;
    const femaleRetention = totalWomen > 0 ? Math.round((activeWomen / totalWomen) * 100) : 100;
    const overallRetention = totalMembers > 0 ? Math.round((activeMembers.length / totalMembers) * 100) : 0;
    const churnedCount = communityMembers.filter(m => m.isActive === false).length;

    // 3. Churn & Low Pulse (Risk of Churn)
    // New Rule: Member is at risk if they haven't participated in any of the last 4 historical sessions
    const last4Sessions = validSessions.slice(0, 4);
    const recentParticipants = new Set<string>();
    last4Sessions.forEach(session => {
      (session.participantIds || []).forEach((id: string) => recentParticipants.add(id));
    });

    const lowPulseMembers = activeMembers
      .filter(m => !recentParticipants.has(m.id))
      .map(m => {
        const lastSession = validSessions.find(s => s.participantIds.includes(m.id));
        return {
          ...m,
          lastSessionDate: lastSession ? lastSession.date.toLocaleDateString('he-IL') : 'מעולם לא'
        };
      });

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Members who were active at the start of the month (or joined during the month)
    const activeAtStartOfMonth = communityMembers.filter(m => {
      if (m.isActive) return true;
      if (!m.deactivatedAt) return true; // Fallback for members suspended before tracking
      const dDate = m.deactivatedAt.toDate ? m.deactivatedAt.toDate() : parseDate(m.deactivatedAt);
      return dDate && dDate >= startOfCurrentMonth;
    });
    
    // Members who are currently inactive AND were deactivated THIS month
    const churnedThisMonth = communityMembers.filter(m => {
      if (m.isActive) return false;
      if (!m.deactivatedAt) return true; // Fallback
      const dDate = m.deactivatedAt.toDate ? m.deactivatedAt.toDate() : parseDate(m.deactivatedAt);
      return dDate && dDate >= startOfCurrentMonth;
    });
    
    console.log("DEBUG: activeAtStartOfMonth:", activeAtStartOfMonth.length, "churnedThisMonth:", churnedThisMonth.length);
    
    const churnRate = activeAtStartOfMonth.length > 0 
      ? parseFloat(((churnedThisMonth.length / activeAtStartOfMonth.length) * 100).toFixed(1)) 
      : 0;

    // Annual Churn (Since Hevel HaZog year start - assuming Sept 1st)
    const currentYear = now.getFullYear();
    const yearStart = now.getMonth() >= 8 ? new Date(currentYear, 8, 1) : new Date(currentYear - 1, 8, 1);
    
    // Annual churned: currently inactive AND deactivated since yearStart
    const annualChurned = communityMembers.filter(m => {
      if (m.isActive) return false;
      if (!m.deactivatedAt) return true; // Fallback
      const dDate = m.deactivatedAt.toDate ? m.deactivatedAt.toDate() : parseDate(m.deactivatedAt);
      return dDate && dDate >= yearStart;
    }).length;
    
    // Annual total: currently active OR deactivated since yearStart
    const annualTotal = communityMembers.filter(m => {
      if (m.isActive) return true;
      if (!m.deactivatedAt) return true; // Fallback
      const dDate = m.deactivatedAt.toDate ? m.deactivatedAt.toDate() : parseDate(m.deactivatedAt);
      return dDate && dDate >= yearStart;
    }).length;
    
    console.log("DEBUG: annualChurned:", annualChurned, "annualTotal:", annualTotal);
    
    const annualChurnRate = annualTotal > 0 ? parseFloat(((annualChurned / annualTotal) * 100).toFixed(1)) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Global Retention Algorithm (3+ sessions in 30 days)
    const userAttendanceCount = new Map<string, number>();
    surfHistory.forEach(session => {
      const sessionDate = parseDate(session.date);
      if (sessionDate && sessionDate >= thirtyDaysAgo) {
        (session.participantIds || []).forEach((id: string) => {
          userAttendanceCount.set(id, (userAttendanceCount.get(id) || 0) + 1);
        });
      }
    });

    const retainedUsersCount = activeMembers.filter(m => (userAttendanceCount.get(m.id) || 0) >= 3).length;
    const globalRetentionIndex = activeMembers.length > 0 
      ? Math.round((retainedUsersCount / activeMembers.length) * 100) 
      : 0;

    // 5. Gender Cohorts (for Tachometer copy)
    const genderCohorts = [
      { label: 'גברים', key: 'זכר', color: 'from-blue-400 to-blue-600', hexColor: '#3182CE', glow: 'rgba(49, 130, 206, 0.5)' },
      { label: 'נשים', key: 'נקבה', color: 'from-pink-400 to-pink-600', hexColor: '#D53F8C', glow: 'rgba(213, 63, 140, 0.5)' },
      { label: 'אחר/לא צוין', key: 'אחר', color: 'from-slate-400 to-slate-600', hexColor: '#718096', glow: 'rgba(113, 128, 150, 0.5)' }
    ].map(c => {
      const groupMembers = activeMembers.filter(m => {
        if (c.key === 'אחר') return !m.gender || m.gender === 'מעדיפ/ה לא לציין' || m.gender === 'לא בינארי';
        return m.gender === c.key;
      });

      const potentialAttendance = last8Sessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);
      const actualAttendance = last8Sessions.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);
      
      const retention = potentialAttendance > 0 
        ? Math.round((actualAttendance / potentialAttendance) * 100) 
        : 0;
      
      // Calculate Yearly Retention
      const yearlyPotentialAttendance = surfHistory.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);
      const yearlyActualAttendance = surfHistory.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);
      const yearlyRetention = yearlyPotentialAttendance > 0 
        ? Math.round((yearlyActualAttendance / yearlyPotentialAttendance) * 100) 
        : 0;

      const count = genderCounts[c.key as keyof typeof genderCounts] || 0;
      
      return {
        label: c.label,
        value: retention,
        yearlyRetention,
        count: count,
        color: c.color,
        hexColor: c.hexColor,
        glow: c.glow,
        isHigh: retention >= 80,
        isLow: retention < 50
      };
    });

    // Member Classifications
    const memberClassifications = communityMembers.map(member => {
      let attended = 0;
      let absenceStreak = 0;
      let countingStreak = true;
      let total = 0;
      let lastSessionDate: string | null = null;

      validSessions.forEach(session => {
        const sessionDate = session.date;
        if (!sessionDate) return;
        if (member.deactivatedAt) {
          const deactivatedDate = parseDate(member.deactivatedAt);
          if (deactivatedDate && sessionDate > deactivatedDate) return;
        }

        total++;
        const isParticipant = session.participantIds?.includes(member.id);
        if (isParticipant) {
          attended++;
          countingStreak = false;
          if (!lastSessionDate) {
            lastSessionDate = sessionDate.toLocaleDateString('he-IL');
          }
        } else if (countingStreak) {
          absenceStreak++;
        }
      });

      if (attended === 0) {
        absenceStreak = 0; // If they never attended, they don't have an absence streak, they are just new/guest.
      }

      // console.log(`Member: ${member.firstName} ${member.lastName}, Total: ${total}, Attended: ${attended}, Streak: ${absenceStreak}`);

      const rate = total > 0 ? (attended / total) * 100 : 0;
      let status = 'מזדמן';
      let bgColor = 'var(--status-guest)';
      let action = 'Encourage participation';

      if (absenceStreak >= 4) {
        status = 'בנסיגה';
        bgColor = 'var(--status-slipping)';
        action = 'Send retention message';
      } else if (rate >= 85) {
        status = 'אלוף';
        bgColor = 'var(--status-champion)';
        action = 'Invite to pro session';
      } else if (rate >= 60) {
        status = 'מתמיד';
        bgColor = 'var(--status-steady)';
        action = 'Keep as is';
      } else if (rate >= 30) {
        status = 'לא יציב';
        bgColor = 'var(--status-unstable)';
        action = 'Check-in message';
      }

      return {
        ...member,
        total,
        attended,
        absenceStreak,
        rate,
        status,
        bgColor,
        action,
        lastSessionDate: lastSessionDate || 'מעולם לא'
      };
    });

    const classificationCounts = {
      'אלוף': 0,
      'מתמיד': 0,
      'לא יציב': 0,
      'בנסיגה': 0,
      'מזדמן': 0
    };

    memberClassifications.forEach(m => {
      if (m.status in classificationCounts) {
        classificationCounts[m.status as keyof typeof classificationCounts]++;
      }
    });

    return {
      ageGroups,
      genderCounts,
      femaleRetention,
      overallRetention,
      lowPulseMembers,
      cohorts,
      genderCohorts,
      memberClassifications,
      classificationCounts,
      activeCount: activeMembers.length,
      totalCount: totalMembers,
      globalRetentionIndex,
      churnRate,
      churnedCount,
      annualChurnRate
    };
  }, [members, weeklyHistory, siteConfig, yearConfig]);

  // Sync member status to DB if it changed
  useEffect(() => {
    if (!stats || !members || members.length === 0) return;

    const updateStatuses = async () => {
      for (const m of stats.memberClassifications) {
        const originalMember = members.find(mem => mem.id === m.id);
        if (originalMember && originalMember.status !== m.status) {
          try {
            await updateMember({ ...originalMember, status: m.status as any });
          } catch (error) {
            console.error(`Failed to update status for member ${m.id}:`, error);
          }
        }
      }
    };

    updateStatuses();
  }, [stats, members, updateMember]);

  const currentTabItems = useMemo(() => {
    if (!stats) return [];
    if (compositionTab === 'status') {
      return [
        { label: 'אלוף', color: 'var(--surfer-yellow)', hex: '#eab308', count: stats.classificationCounts['אלוף'] },
        { label: 'מתמיד', color: 'var(--surfer-teal)', hex: '#0d9488', count: stats.classificationCounts['מתמיד'] },
        { label: 'לא יציב', color: 'var(--surfer-orange)', hex: '#f97316', count: stats.classificationCounts['לא יציב'] },
        { label: 'בנסיגה', color: 'var(--surfer-magenta)', hex: '#d946ef', count: stats.classificationCounts['בנסיגה'] },
        { label: 'מזדמן', color: 'var(--surfer-cyan)', hex: '#06b6d4', count: stats.classificationCounts['מזדמן'] }
      ];
    }
    if (compositionTab === 'age') {
      const items = [
        { label: 'צעירים (18-25)', color: '#0284c7', hex: '#0284c7', count: stats.ageGroups['צעירים (18-25)'] },
        { label: 'בוגרים (26-40)', color: '#10b981', hex: '#10b981', count: stats.ageGroups['בוגרים (26-40)'] },
        { label: 'אמצע החיים (41-60)', color: '#8b5cf6', hex: '#8b5cf6', count: stats.ageGroups['אמצע החיים (41-60)'] },
        { label: 'ותיקים (60+)', color: '#f59e0b', hex: '#f59e0b', count: stats.ageGroups['ותיקים (60+)'] }
      ];
      if (stats.ageGroups['לא צוין / אחר'] > 0) {
        items.push({ label: 'לא צוין / אחר', color: '#94a3b8', hex: '#94a3b8', count: stats.ageGroups['לא צוין / אחר'] });
      }
      return items;
    }
    // gender
    const items = [
      { label: 'גברים', color: '#2563eb', hex: '#2563eb', count: stats.genderCounts['זכר'] },
      { label: 'נשים', color: '#db2777', hex: '#db2777', count: stats.genderCounts['נקבה'] }
    ];
    if (stats.genderCounts['אחר'] > 0) {
      items.push({ label: 'אחר / לא צוין', color: '#7c3aed', hex: '#7c3aed', count: stats.genderCounts['אחר'] });
    }
    return items;
  }, [compositionTab, stats]);

  const modalMembers = useMemo(() => {
    if (!selectedGroup || !stats) return [];
    if (selectedGroup.type === 'status') {
      return stats.memberClassifications.filter(m => m.status === selectedGroup.name);
    }
    if (selectedGroup.type === 'age') {
      return stats.memberClassifications.filter(m => {
        const age = calculateAge(m.birthday || (m as any).birthDate);
        if (selectedGroup.name === 'צעירים (18-25)') return age !== null && age >= 18 && age <= 25;
        if (selectedGroup.name === 'בוגרים (26-40)') return age !== null && age >= 26 && age <= 40;
        if (selectedGroup.name === 'אמצע החיים (41-60)') return age !== null && age >= 41 && age <= 60;
        if (selectedGroup.name === 'ותיקים (60+)') return age !== null && age > 60;
        if (selectedGroup.name === 'לא צוין / אחר') return age === null || age < 18;
        return false;
      });
    }
    if (selectedGroup.type === 'gender') {
      return stats.memberClassifications.filter(m => {
        if (selectedGroup.name === 'גברים') return m.gender === 'זכר';
        if (selectedGroup.name === 'נשים') return m.gender === 'נקבה';
        return !m.gender || m.gender === 'מעדיפ/ה לא לציין' || m.gender === 'לא בינארי';
      });
    }
    return [];
  }, [selectedGroup, stats]);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Activity className="w-12 h-12 text-blue-400 animate-pulse" />
        <p className="text-[#004D40] font-black uppercase tracking-widest animate-pulse">מנתח דופק קהילה...</p>
      </div>
    );
  }

  const currentTabTooltip = 
    compositionTab === 'status' 
      ? 'סיווג התנהגותי של משתתפי הקהילה המבוסס על רצף, תדירות ומועד ההגעה האחרון שלהם לאורך כל זמן הפעילות.'
      : compositionTab === 'age'
      ? 'פילוח גילאי חברי הקהילה: צעירים (18-25), בוגרים (26-40), אמצע החיים (41-60) וותיקים (60+).'
      : 'התפלגות מגדרית של משתתפי הקהילה: גברים, נשים ואחרים.';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative" dir="rtl">
      <div className="relative z-10 space-y-12">
        {/* Member Composition Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="admin-info-card p-6 sm:p-8 relative group min-h-[550px] flex flex-col justify-between rounded-[3rem]"
        >
          {/* Background elements that need clipping */}
          <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--surfer-cyan)]/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          
          <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10 px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl glass-effect flex items-center justify-center text-[#004D40] shadow-inner border border-white/20 flex-shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[#7A1555] tracking-tight">הרכב הקהילה</h3>
                  <div className="relative group flex items-center">
                    <Info size={16} className="text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                    <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-medium rounded-xl shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                      {currentTabTooltip}
                    </div>
                  </div>
                </div>
                <p className="text-[#000000] text-[8px] font-bold uppercase tracking-[0.3em] opacity-80">Community Aura • Ocean Analytics</p>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-effect border border-white/20 shadow-inner self-start md:self-auto">
              <button
                onClick={() => setCompositionTab('status')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  compositionTab === 'status'
                    ? 'bg-[#7A1555] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                סיווג התנהגותי
              </button>
              <button
                onClick={() => setCompositionTab('age')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  compositionTab === 'age'
                    ? 'bg-[#7A1555] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                קבוצות גיל
              </button>
              <button
                onClick={() => setCompositionTab('gender')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  compositionTab === 'gender'
                    ? 'bg-[#7A1555] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                }`}
              >
                פילוח מגדר
              </button>
            </div>
          </div>

          {/* Composition Summary Cards */}
          <div className="w-full mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 relative z-10">
            {currentTabItems.map(group => {
              const totalInTab = currentTabItems.reduce((acc, curr) => acc + curr.count, 0);
              const percentage = totalInTab > 0 ? Math.round((group.count / totalInTab) * 100) : 0;
              return (
                <div 
                  key={group.label} 
                  className="flex flex-col items-center p-2.5 rounded-xl glass-effect border border-white/20 shadow-sm cursor-pointer hover:bg-white/40 transition-all hover:scale-[1.02]"
                  onClick={() => setSelectedGroup({ type: compositionTab, name: group.label })}
                >
                  <span className="text-xs font-black mb-1 truncate max-w-full" style={{ color: group.color }}>{group.label}</span>
                  <span className="text-lg font-black text-gray-900">{percentage}%</span>
                  <span className="text-[10px] text-gray-500 font-bold">{group.count} חברים</span>
                </div>
              );
            })}
          </div>

          {/* Member Classification / Demographics Pie Chart */}
          <div className="w-full flex-1 relative min-h-[340px] z-10" style={{ filter: 'drop-shadow(0px 15px 20px rgba(0,0,0,0.2))' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="pie3d" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.3" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.9"/>
                    </feComponentTransfer>
                  </filter>
                </defs>
                <Pie
                  data={currentTabItems.map(item => ({
                    name: item.label,
                    value: item.count,
                    color: item.color,
                    hex: item.hex
                  })).filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => {
                    if (data?.name) {
                      setSelectedGroup({ type: compositionTab, name: data.name });
                    }
                  }}
                  style={{ cursor: 'pointer', filter: 'url(#pie3d)' }}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={2}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, fill }) => {
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

                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
                        <circle cx={ex} cy={ey} r={4} fill={fill} stroke="none" />
                        <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey - 8} textAnchor={textAnchor} fill={fill} className="text-sm font-black" dominantBaseline="central">
                          {name}
                        </text>
                        <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey + 10} textAnchor={textAnchor} fill="#333" className="text-[12px] font-bold" dominantBaseline="central">
                          {`${value} (${(percent * 100).toFixed(0)}%)`}
                        </text>
                      </g>
                    );
                  }}
                >
                  {currentTabItems.filter(d => d.count > 0).map((entry, index) => (
                    <Cell key={`cell-${compositionTab}-${index}`} fill={entry.hex || entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-effect p-3 rounded-xl border border-white/20 shadow-xl backdrop-blur-md">
                          <p className="text-xs font-black mb-1" style={{ color: payload[0].payload.color || payload[0].payload.hex }}>{payload[0].name}</p>
                          <p className="text-lg font-black text-gray-900">{payload[0].value} <span className="text-[12px] text-gray-700 opacity-80">חברים</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-gray-500 mt-2">לחץ על פלח כדי לראות את רשימת המשתמשים</p>
          </div>
        </motion.div>
      </div>

      {/* Modal for selected group */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedGroup(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-effect rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl relative border border-white/20"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 sticky top-0 z-10 pb-2 border-b border-white/10">
              <div>
                <h3 className="text-2xl font-black text-[#121212] drop-shadow-md">{selectedGroup.name}</h3>
                <p className="text-xs text-gray-600 font-bold">
                  {selectedGroup.type === 'status' ? 'סיווג התנהגותי' : selectedGroup.type === 'age' ? 'קבוצת גיל' : 'מגדר'} • {modalMembers.length} חברים
                </p>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors text-[#121212]">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {modalMembers.map(member => {
                const memberAge = calculateAge(member.birthday || (member as any).birthDate);
                return (
                  <div key={member.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors backdrop-blur-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-white/30 shadow-lg">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {member.firstName[0]}
                          </span>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-[#121212] drop-shadow-sm truncate">{member.firstName} {member.lastName}</p>
                        <div className="flex items-center gap-2 text-xs text-[#121212]/70">
                          <span>נוכחות: {member.rate.toFixed(0)}%</span>
                          {memberAge !== null && <span>• גיל: {memberAge}</span>}
                          {member.gender && <span>• {member.gender}</span>}
                        </div>
                        <p className="text-[10px] text-[#121212]/50 italic truncate">פעם אחרונה: {member.lastSessionDate}</p>
                      </div>
                    </div>
                    <span 
                      className="px-2.5 py-1 rounded-full text-[10px] font-black flex-shrink-0 border border-white/20 shadow-sm"
                      style={{ backgroundColor: member.bgColor || 'rgba(0,0,0,0.05)', color: '#121212' }}
                    >
                      {member.status}
                    </span>
                  </div>
                );
              })}
              {modalMembers.length === 0 && (
                <p className="text-center text-gray-500 py-4">אין משתמשים בקבוצה זו</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export const Astrodeck = ({ label, value, icon: Icon, path, external, color, neoBrutal }: { 
  label: string; 
  value: string | number; 
  icon: any; 
  path: string; 
  external?: boolean;
  color: string;
  neoBrutal?: boolean;
}) => {
  const padPath = "M 135 38 Q 80 45 40 60 C 30 150 60 250 100 320 C 120 360 160 380 185 380 L 185 330 C 185 300 135 300 135 250 Z M 145 35 Q 200 20 255 35 L 245 250 C 245 290 155 290 155 250 Z M 265 38 Q 320 45 360 60 C 370 150 340 250 300 320 C 280 360 240 380 215 380 L 215 330 C 215 300 265 300 265 250 Z";

  return (
    <Link 
      to={path} 
      target={external ? "_blank" : undefined} 
      className={`block h-full group relative w-full aspect-square max-w-[266px] mx-auto transition-all duration-300 ${neoBrutal ? 'hover:translate-x-[2px] hover:translate-y-[2px]' : 'hover:scale-105 hover:-translate-y-2'}`}
    >
      <svg viewBox="0 0 400 400" className={`w-full h-full ${neoBrutal ? 'admin-info-card' : 'backdrop-blur-[10px] rounded-[24px]'}`}>
        <defs>
          <pattern id="diamond-pad-texture" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="rgba(0,0,0,0.05)" />
            <path d="M8 2 L14 8 L8 14 L2 8 Z" fill="rgba(0,0,0,0.1)" />
            <circle cx="8" cy="8" r="2" fill="rgba(0,0,0,0.1)" />
          </pattern>

          <radialGradient id="glass-lens-pad" cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="70%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0.0" />
          </radialGradient>

          <linearGradient id="glass-shine-pad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0.0" />
          </linearGradient>

          <filter id="rough-texture-pad">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#ffffff" surfaceScale="2.5">
              <feDistantLight azimuth="45" elevation="45" />
            </feDiffuseLighting>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Background Pad */}
        <path 
          d={padPath} 
          fill="url(#diamond-pad-texture)" 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth="1"
        />

        {/* Base Color Fill */}
        <path d={padPath} fill="rgba(0, 112, 133, 0.05)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeLinejoin="round" />
        
        {/* Glassmorphism Overlay */}
        <path d={padPath} fill="url(#glass-lens-pad)" opacity="0.8" className="pointer-events-none" />
        <path d={padPath} fill="url(#glass-shine-pad)" opacity="0.6" className="pointer-events-none" />

        {/* Grip Bars Overlay */}
        <g fill="rgba(0,0,0,0.1)" opacity="0.1" pointerEvents="none">
          <rect x="170" y="80" width="60" height="6" rx="3" />
          <rect x="170" y="100" width="60" height="6" rx="3" />
          <rect x="170" y="120" width="60" height="6" rx="3" />
          <rect x="170" y="140" width="60" height="6" rx="3" />
          <rect x="170" y="160" width="60" height="6" rx="3" />
          <rect x="170" y="180" width="60" height="6" rx="3" />
          <rect x="170" y="200" width="60" height="6" rx="3" />
          <rect x="170" y="220" width="60" height="6" rx="3" />
          <rect x="170" y="240" width="60" height="6" rx="3" />
        </g>

        {/* Rough Texture Overlay */}
        <path d={padPath} fill="#121212" filter="url(#rough-texture-pad)" opacity="0.1" className="pointer-events-none" />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 pointer-events-none">
        <Icon size={32} className={`mb-3 ${color} transition-transform duration-500 group-hover:scale-110`} />
        <p className="text-4xl font-black home-metric mb-1 leading-none">{value}</p>
        <p className="text-[12px] font-black uppercase tracking-widest home-label mt-1 text-center">{label}</p>
      </div>
    </Link>
  );
};

export default CommunityAnalytics;
