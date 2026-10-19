import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Waves, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Share2, 
  Printer, 
  X, 
  MapPin, 
  Sparkles, 
  MessageCircle, 
  Target,
  Clock,
  Globe
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Member } from '../../types';
import { calculateAge, parseDate, formatDate } from '../../utils/dateUtils';
import { isAppShaperUser, isAdminUser, AVAILABLE_COMMUNITIES, SUPER_ADMIN_EMAIL } from '../../constants';
import { getCoordinates, calculateDistance } from '../../utils/geocoding';

interface CommunityExecutiveSnapshotProps {
  onClose?: () => void;
  isModal?: boolean;
}

// Helper to count Thursdays (planned sessions) between two dates
const countThursdays = (start: string | Date, end: string | Date) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  while (current.getDay() !== 4 && current <= endDate) {
    current.setDate(current.getDate() + 1);
  }
  
  while (current <= endDate) {
    count++;
    current.setDate(current.getDate() + 7);
  }
  return count;
};

export const CommunityExecutiveSnapshot: React.FC<CommunityExecutiveSnapshotProps> = ({ 
  onClose, 
  isModal = false 
}) => {
  const { 
    members: allMembers, 
    weeklyHistory: allWeeklyHistory = [], 
    siteConfig, 
    yearConfig,
    availableCommunities: ctxCommunities,
    memberships = []
  } = useData();
  const { currentUser, currentCommunityId } = useAuth();

  const availableCommunities = ctxCommunities || AVAILABLE_COMMUNITIES;
  const activeCommunity = currentCommunityId || 'herzliya';
  const activeCommunityObj = availableCommunities.find(c => c.id === activeCommunity) || availableCommunities[0];

  // Specific privileged roles: Coordinator (רכז), Instructor (מדריך), Up-Shaper (אפ-שייפר)
  // Regular members and volunteers CANNOT toggle global scope and only see their current group!
  const isCoordinator = 
    currentUser?.role === 'Admin' || 
    currentUser?.role === 'Staff' || 
    (currentUser as any)?.role === 'Coordinator' || 
    (currentUser as any)?.role === 'רכז' || 
    isAdminUser(currentUser) || 
    currentUser?.email === SUPER_ADMIN_EMAIL;
  const isInstructor = currentUser?.role === 'Instructor' || (currentUser as any)?.role === 'מדריך';
  const isAppShaper = isAppShaperUser(currentUser) || currentUser?.role === 'Support' || (currentUser as any)?.role === 'אפ-שייפר';
  const canToggleGlobal = Boolean(isCoordinator || isInstructor || isAppShaper);

  const [isGlobalScope, setIsGlobalScope] = useState(false);
  const [planTimeframe, setPlanTimeframe] = useState<'cohort' | 'annual'>('cohort');

  const [copiedToast, setCopiedToast] = useState(false);

  // Helper to format full member name
  const getMemberName = (m: Member | any): string => {
    return `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'חבר קהילה';
  };

  // Filter scoped members based on selected scope (current community vs global)
  const scopedAllMembers = useMemo(() => {
    if (isGlobalScope) return allMembers;
    const isAlumniCommunity = activeCommunity.endsWith('_adults');
    return allMembers.filter(m => {
      const comms = m.communities || [];
      const belongsToCommunity = comms.includes(activeCommunity);
      const isStaffOrSupport = m.role === 'Staff' || isAppShaperUser(m);

      // In group scope, regular members and volunteers must be in activeCommunity
      if (!belongsToCommunity && !isStaffOrSupport) return false;
      // If staff has specific communities, check if they belong to activeCommunity
      if (isStaffOrSupport && comms.length > 0 && !comms.includes(activeCommunity)) {
        return false;
      }

      if (!isAlumniCommunity) {
        const isAlumniOnly = memberships.some(mem => 
          mem.personId === m.id && 
          (mem.groupId === 'group_alumni' || mem.groupId === 'cohort_vav') && 
          (mem.status === 'graduated' || mem.status === 'completed')
        ) && !memberships.some(mem => 
          mem.personId === m.id && 
          mem.groupId === 'cohort_active' && 
          mem.status === 'active'
        );
        if (isAlumniOnly && !isStaffOrSupport) return false;
      } else {
        const isActiveCohortOnly = memberships.some(mem => 
          mem.personId === m.id && 
          mem.groupId === 'cohort_active' && 
          mem.status === 'active'
        ) && !memberships.some(mem => 
          mem.personId === m.id && 
          (mem.groupId === 'group_alumni' || mem.groupId === 'cohort_vav')
        );
        if (isActiveCohortOnly && !isStaffOrSupport) return false;
      }
      return true;
    });
  }, [allMembers, isGlobalScope, activeCommunity, memberships]);

  // Set of member IDs in the current scope
  const scopedMemberIdSet = useMemo(() => {
    return new Set(scopedAllMembers.map(m => m.id));
  }, [scopedAllMembers]);

  // Filter scoped weekly history based on selected scope
  const weeklyHistory = useMemo(() => {
    if (isGlobalScope) {
      return (allWeeklyHistory || []).map(s => ({
        ...s,
        participantIds: s.participantIds || [],
        participantsCount: (s.participantIds || []).length
      }));
    }
    return (allWeeklyHistory || [])
      .filter(session => {
        // Session belongs to active community
        const sessionComm = session.communityId || 'herzliya';
        return sessionComm === activeCommunity;
      })
      .map(session => {
        const rawIds = session.participantIds || [];
        // Filter participant IDs strictly to members belonging to this group
        const groupParticipantIds = rawIds.filter((id: string) => scopedMemberIdSet.has(id));
        return {
          ...session,
          participantIds: groupParticipantIds,
          participantsCount: groupParticipantIds.length
        };
      });
  }, [allWeeklyHistory, isGlobalScope, activeCommunity, scopedMemberIdSet]);

  // Filter regular active community members (exclude staff, appshaper, and inactive/deactivated)
  const members = useMemo(() => {
    return scopedAllMembers.filter(m => m.role !== 'Staff' && !isAppShaperUser(m) && m.isActive !== false && !m.deactivatedAt);
  }, [scopedAllMembers]);

  // Staff and operational management members
  const staffMembers = useMemo(() => {
    return scopedAllMembers.filter(m => m.role === 'Staff' || isAppShaperUser(m));
  }, [scopedAllMembers]);

  const defaultDuration = siteConfig?.sessionDurationMinutes || 90;

  // Calculations: Recent 8 sessions for persistence metrics
  const sortedSessions = useMemo(() => {
    return [...weeklyHistory].sort((a, b) => {
      const da = parseDate(a.date) || new Date(0);
      const db = parseDate(b.date) || new Date(0);
      return db.getTime() - da.getTime();
    });
  }, [weeklyHistory]);

  // Only sessions that actually took place with participants (filtering out cancelled sessions)
  const activeSessions = useMemo(() => {
    return sortedSessions.filter(s => (s.participantIds?.length || 0) > 0 || (s.participantsCount || 0) > 0);
  }, [sortedSessions]);

  const last8Sessions = useMemo(() => {
    return activeSessions.length > 0 ? activeSessions.slice(0, 8) : sortedSessions.slice(0, 8);
  }, [activeSessions, sortedSessions]);

  const lastSession = activeSessions[0] || sortedSessions[0] || null;

  // Cumulative community sea hours (using each session's actual duration or default)
  const totalSeaHours = useMemo(() => {
    return weeklyHistory.reduce((sum, s) => {
      const duration = s.durationMinutes || defaultDuration;
      const participants = s.participantIds?.length || 0;
      return sum + (participants * (duration / 60));
    }, 0);
  }, [weeklyHistory, defaultDuration]);

  // Average session attendees (last 8 sessions)
  const avgAttendees = useMemo(() => {
    if (last8Sessions.length === 0) return 0;
    const total = last8Sessions.reduce((sum, s) => sum + (s.participantIds?.length || 0), 0);
    return Math.round((total / last8Sessions.length) * 10) / 10;
  }, [last8Sessions]);

  // Average sea hours per active community member (Depth of Impact)
  const avgHoursPerMember = useMemo(() => {
    if (members.length === 0) return 0;
    return Math.round((totalSeaHours / members.length) * 10) / 10;
  }, [totalSeaHours, members.length]);

  // Age Cohorts & Attendance / Persistence
  const ageCohortData = useMemo(() => {
    const cohorts: Array<{
      key: string;
      label: string;
      range: string;
      min: number;
      max: number;
      color: string;
      bg: string;
      hexGradient: [string, string];
    }> = [
      { key: 'youth', label: 'נוער וצעירים', range: '18-25', min: 18, max: 25, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 text-amber-900 border-amber-200', hexGradient: ['#f59e0b', '#f97316'] },
      { key: 'youngAdults', label: 'בוגרים צעירים', range: '26-40', min: 26, max: 40, color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 text-sky-900 border-sky-200', hexGradient: ['#0ea5e9', '#2563eb'] },
      { key: 'midLife', label: 'אמצע החיים', range: '41-60', min: 41, max: 60, color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50 text-indigo-900 border-indigo-200', hexGradient: ['#6366f1', '#9333ea'] },
      { key: 'veterans', label: 'ותיקים וזהב', range: '60+', min: 61, max: 120, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 text-emerald-900 border-emerald-200', hexGradient: ['#10b981', '#0d9488'] },
    ];

    return cohorts.map(cohort => {
      const cohortMembers = members.filter(m => {
        const age = calculateAge(m.birthday || (m as any).birthDate);
        if (age === null) return false;
        return age >= cohort.min && age <= cohort.max;
      });

      const totalCohortMembers = cohortMembers.length;

      // Persistence in last 8 sessions:
      let actualAttendances = 0;
      let potentialAttendances = 0;

      last8Sessions.forEach(session => {
        const attendees = session.participantIds || [];
        const activeInSession = cohortMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (attendees.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactDate = parseDate(m.deactivatedAt);
            if (deactDate && sessionDate && deactDate < sessionDate) return false;
          }
          return true;
        });

        potentialAttendances += activeInSession.length;
        const presentCount = activeInSession.filter(m => attendees.includes(m.id)).length;
        actualAttendances += presentCount;
      });

      const persistencePercent = potentialAttendances > 0 
        ? Math.round((actualAttendances / potentialAttendances) * 100) 
        : 0;

      // Last session attendance
      const lastSessionPresent = lastSession 
        ? cohortMembers.filter(m => lastSession.participantIds?.includes(m.id)).length 
        : 0;

      // Total sea hours of this cohort
      const cohortSeaHours = weeklyHistory.reduce((sum, session) => {
        const dur = session.durationMinutes || defaultDuration;
        const attendees = session.participantIds || [];
        const count = cohortMembers.filter(m => attendees.includes(m.id)).length;
        return sum + (count * (dur / 60));
      }, 0);

      // Top persistent surfers in this cohort
      const topSurfers = cohortMembers.map(m => {
        const count = last8Sessions.filter(s => s.participantIds?.includes(m.id)).length;
        return { member: m, count };
      })
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

      // Inactive in last 4 sessions (retention risk)
      const last4Sessions = last8Sessions.slice(0, 4);
      const atRiskSurfers = cohortMembers.filter(m => {
        if (last4Sessions.length === 0) return false;
        const hasAttendedAny = last4Sessions.some(s => s.participantIds?.includes(m.id));
        return !hasAttendedAny;
      });

      return {
        ...cohort,
        members: cohortMembers,
        totalMembers: totalCohortMembers,
        persistencePercent,
        lastSessionPresent,
        lastSessionRate: totalCohortMembers > 0 ? Math.round((lastSessionPresent / totalCohortMembers) * 100) : 0,
        cohortSeaHours: Math.round(cohortSeaHours),
        topSurfers,
        atRiskSurfers,
      };
    });
  }, [members, last8Sessions, lastSession, weeklyHistory, defaultDuration]);

  // 4. Planned vs Actual Sessions for Shnat Hevel Zug (ביצוע מול תכנון)
  const yearlyPlanStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    // Default academic/community year starts Sept 1st
    const defaultStartYear = currentMonthIndex < 8 ? currentYear - 1 : currentYear;
    const defaultCohortStartDate = new Date(defaultStartYear, 8, 17).toISOString(); // 17 Sept default
    const defaultCohortEndDate = new Date(defaultStartYear + 1, 6, 31).toISOString(); // 31 July default

    const isAnnualMode = planTimeframe === 'annual';
    
    // Choose start/end dates based on selected timeframe
    const startDate = isAnnualMode 
      ? new Date(currentYear, 0, 1).toISOString()
      : (yearConfig?.startDate || defaultCohortStartDate);
    const endDate = isAnnualMode 
      ? new Date(currentYear, 11, 31).toISOString()
      : (yearConfig?.endDate || defaultCohortEndDate);

    const startDateObj = parseDate(startDate) || new Date(isAnnualMode ? `${currentYear}-01-01` : defaultCohortStartDate);
    const endDateObj = parseDate(endDate) || new Date(isAnnualMode ? `${currentYear}-12-31` : defaultCohortEndDate);

    // Total planned sessions in this period (counting weekly regular session days - Thursdays)
    const baseTotalPlanned = countThursdays(startDate, endDate) || 52;
    // Planned to date (from start until today or end of period)
    const basePlannedToDate = countThursdays(startDate, now < endDateObj ? now : endDate) || 1;

    // Filter weeklyHistory for this scope and period
    const executedSessions = weeklyHistory.filter(s => {
      if (s.isEvent) return false;
      const sDate = parseDate(s.date);
      if (!sDate) return false;
      const hasParticipants = (s.participantsCount || 0) > 0 || (s.participantIds?.length || 0) > 0;
      return sDate >= startDateObj && sDate <= (now < endDateObj ? now : endDateObj) && hasParticipants;
    });

    const executedCount = executedSessions.length;
    const plannedToDate = basePlannedToDate;
    const totalYearPlanned = baseTotalPlanned;

    // Sessions that were planned but cancelled (e.g. Tishrei holidays, bad sea conditions)
    const cancelledCount = Math.max(0, plannedToDate - executedCount);

    // Pace of execution against target to date (עמידה ביעד עד כה)
    const pacePercent = plannedToDate > 0 ? Math.round((executedCount / plannedToDate) * 100) : 0;
    // Annual completion percentage towards full target
    const annualCompletionPercent = totalYearPlanned > 0 ? Math.round((executedCount / totalYearPlanned) * 100) : 0;
    // Target benchmark pace for today on the annual curve (for progress marker)
    const targetPacePercent = totalYearPlanned > 0 ? Math.min(100, Math.round((plannedToDate / totalYearPlanned) * 100)) : 0;
    const remainingToPlan = Math.max(0, totalYearPlanned - executedCount);

    const timeframeName = isAnnualMode 
      ? `שנת ${currentYear}` 
      : (yearConfig?.name || 'מחזור פעיל');

    return {
      startDate: startDateObj,
      endDate: endDateObj,
      timeframeName,
      isAnnualMode,
      totalYearPlanned,
      plannedToDate,
      executedCount,
      cancelledCount,
      pacePercent,
      annualCompletionPercent,
      targetPacePercent,
      remainingToPlan
    };
  }, [planTimeframe, yearConfig, weeklyHistory]);

  // 5. Geographic Distance Persistence Breakdown (פילוח התמדה לפי מרחק גיאוגרפי מהמועדון)
  const distanceCohortData = useMemo(() => {
    // Club home coordinates (Herzliya default or siteConfig home break)
    const homeLat = siteConfig?.home_break?.lat || 32.174;
    const homeLng = siteConfig?.home_break?.lng || 34.808;

    const cohorts = [
      { key: 'local', label: 'מקומיים וצמודים', range: '0-10 ק״מ', min: 0, max: 10, color: 'text-emerald-700 bg-emerald-50 border-emerald-200 bar-emerald' },
      { key: 'nearby', label: 'סמוכים וגוש דן', range: '11-25 ק״מ', min: 10.001, max: 25, color: 'text-sky-700 bg-sky-50 border-sky-200 bar-sky' },
      { key: 'regional', label: 'מרחב אזורי', range: '26-50 ק״מ', min: 25.001, max: 50, color: 'text-indigo-700 bg-indigo-50 border-indigo-200 bar-indigo' },
      { key: 'distant', label: 'מרוחקים ומסורים', range: '50+ ק״מ', min: 50.001, max: Infinity, color: 'text-amber-700 bg-amber-50 border-amber-200 bar-amber' },
    ];

    return cohorts.map(cohort => {
      // Filter active members belonging to this distance band
      const cohortMembers = members.filter(m => {
        const coords = getCoordinates(m.city, m.lat, m.lng);
        if (!coords) return false;
        const dist = calculateDistance(homeLat, homeLng, coords[0], coords[1]);
        return dist >= cohort.min && dist <= cohort.max;
      });

      const totalCohortMembers = cohortMembers.length;

      // Persistence in last 8 sessions for this distance cohort:
      let actualAttendances = 0;
      let potentialAttendances = 0;

      last8Sessions.forEach(session => {
        const attendees = session.participantIds || [];
        const activeInSession = cohortMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (attendees.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactDate = parseDate(m.deactivatedAt);
            if (deactDate && sessionDate && deactDate < sessionDate) return false;
          }
          return true;
        });

        potentialAttendances += activeInSession.length;
        const presentCount = activeInSession.filter(m => attendees.includes(m.id)).length;
        actualAttendances += presentCount;
      });

      const persistencePercent = potentialAttendances > 0 
        ? Math.round((actualAttendances / potentialAttendances) * 100) 
        : 0;

      return {
        ...cohort,
        totalMembers: totalCohortMembers,
        persistencePercent,
      };
    });
  }, [members, last8Sessions, siteConfig?.home_break]);

  // 6. Gender Persistence Breakdown (פילוח התמדה לפי מגדר)
  const genderCohortData = useMemo(() => {
    const cohorts = [
      { 
        key: 'men', 
        label: 'גברים', 
        subLabel: 'חברי קהילה',
        color: 'text-blue-700 bg-blue-50 border-blue-200', 
        iconBg: 'bg-blue-50 text-blue-600',
        accentColor: 'text-blue-600',
        match: (m: Member) => m.gender === 'זכר' || (m as any).gender === 'Male' || (m as any).gender === 'male'
      },
      { 
        key: 'women', 
        label: 'נשים', 
        subLabel: 'חברות קהילה',
        color: 'text-rose-700 bg-rose-50 border-rose-200', 
        iconBg: 'bg-rose-50 text-rose-600',
        accentColor: 'text-rose-600',
        match: (m: Member) => m.gender === 'נקבה' || (m as any).gender === 'Female' || (m as any).gender === 'female'
      },
      { 
        key: 'other', 
        label: 'אחר / לא צוין', 
        subLabel: 'ללא שיוך מוגדר',
        color: 'text-purple-700 bg-purple-50 border-purple-200', 
        iconBg: 'bg-purple-50 text-purple-600',
        accentColor: 'text-purple-600',
        match: (m: Member) => {
          const g = (m.gender || '').trim();
          return !g || g === 'מעדיפ/ה לא לציין' || g === 'לא בינארי' || (!['זכר', 'Male', 'male', 'נקבה', 'Female', 'female'].includes(g));
        }
      },
    ];

    return cohorts.map(cohort => {
      const cohortMembers = members.filter(cohort.match);
      const totalCohortMembers = cohortMembers.length;

      let actualAttendances = 0;
      let potentialAttendances = 0;

      last8Sessions.forEach(session => {
        const attendees = session.participantIds || [];
        const activeInSession = cohortMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (attendees.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactDate = parseDate(m.deactivatedAt);
            if (deactDate && sessionDate && deactDate < sessionDate) return false;
          }
          return true;
        });

        potentialAttendances += activeInSession.length;
        const presentCount = activeInSession.filter(m => attendees.includes(m.id)).length;
        actualAttendances += presentCount;
      });

      const persistencePercent = potentialAttendances > 0 
        ? Math.round((actualAttendances / potentialAttendances) * 100) 
        : 0;

      return {
        ...cohort,
        totalMembers: totalCohortMembers,
        persistencePercent,
      };
    });
  }, [members, last8Sessions]);

  // Surfers needing re-engagement (overall watchlist)
  const reEngagementWatchlist = useMemo(() => {
    if (last8Sessions.length === 0) return [];
    const last3Sessions = last8Sessions.slice(0, 3);
    
    return members.filter(m => {
      // Must not have attended in the last 3 sessions
      const attendedRecently = last3Sessions.some(s => s.participantIds?.includes(m.id));
      if (attendedRecently) return false;

      // But attended at least once historically
      const attendedEver = weeklyHistory.some(s => s.participantIds?.includes(m.id));
      return attendedEver;
    }).slice(0, 6);
  }, [members, last8Sessions, weeklyHistory]);

  // WhatsApp formatted report copy
  const handleCopyWhatsApp = () => {
    const todayStr = formatDate(new Date());

    let text = `🏄‍♂️ *תמונת מצב קהילתית - דופק חבל זוג* (${todayStr})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🌐 *היקף נתונים:* ${isGlobalScope ? 'כלל הקהילה (גלובלי - כל הסניפים והקבוצות)' : `קבוצת ${activeCommunityObj.name} בלבד`}\n\n`;
    
    text += `📊 *מדדי מפתח וביצועים:*\n`;
    text += `• גולשי קהילה פעילים: ${members.length} (+ ${staffMembers.length} אנשי סגל וצוות | ${scopedAllMembers.length} סה״כ רשומים בהיקף זה)\n`;
    text += `• שעות ים מצטברות העונה: ${Math.round(totalSeaHours)} שעות\n`;
    text += `• ממוצע שעות ים לחבר פעיל: ${avgHoursPerMember} שעות (עומק אימפקט)\n`;
    text += `• ממוצע נוכחות לסשן: ${avgAttendees} גולשים\n\n`;

    text += `🎯 *תכנון מול ביצוע (שנת חבל זוג - ${yearlyPlanStats.timeframeName}):*\n`;
    text += `• סשנים שבוצעו בפועל: ${yearlyPlanStats.executedCount} מתוך ${yearlyPlanStats.plannedToDate} שתוכננו עד כה (${yearlyPlanStats.pacePercent}% עמידה ביעד)\n`;
    text += `• סשנים שבוטלו / חגים: ${yearlyPlanStats.cancelledCount} סשנים\n`;
    text += `• יעד שנתי כולל: ${yearlyPlanStats.totalYearPlanned} סשנים (${yearlyPlanStats.annualCompletionPercent}% השלמה מהיעד השנתי)\n`;
    text += `• נותרו להשלמת היעד: ${yearlyPlanStats.remainingToPlan} סשנים\n\n`;

    text += `🎯 *הגעה והתמדה לפי קבוצות גיל:*\n`;
    ageCohortData.forEach(c => {
      text += `• ${c.label} (${c.range}): ${c.persistencePercent}% התמדה | ${c.totalMembers} חברים\n`;
    });
    text += `\n`;

    text += `📍 *התמדה לפי מרחק גיאוגרפי מהמועדון:*\n`;
    distanceCohortData.forEach(d => {
      text += `• ${d.label} (${d.range}): ${d.persistencePercent}% התמדה | ${d.totalMembers} חברים\n`;
    });
    text += `\n`;

    text += `👥 *פילוח התמדה לפי מגדר:*\n`;
    genderCohortData.forEach(g => {
      if (g.totalMembers > 0 || g.key !== 'other') {
        text += `• ${g.label}: ${g.persistencePercent}% התמדה | ${g.totalMembers} ${g.key === 'women' ? 'חברות' : 'חברים'}\n`;
      }
    });
    text += `\n`;

    if (reEngagementWatchlist.length > 0) {
      text += `🔔 *גולשים לשימור וקשר אישי:* ${reEngagementWatchlist.map(m => getMemberName(m)).slice(0, 4).join(', ')}\n\n`;
    }

    text += `_הופק אוטומטית ממערכת ניהול חבל זוג_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const content = (
    <div className="space-y-4 text-slate-800" dir="rtl">
      {/* Top Header Card - Crisp & Compact One-Pager Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl px-4 py-4 sm:px-6 sm:py-5 text-white shadow-md">
        {/* Top Row: Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[10px] sm:text-[11px] font-bold tracking-wide">
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                ONE-PAGER SNAPSHOT
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs hidden sm:inline">{formatDate(new Date())}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 truncate">
              דופק הקהילה וסיכום מנהלים
            </h2>
            <p className="text-cyan-100/75 text-xs sm:text-sm mt-0.5 line-clamp-2">
              תקציר מנהלים ממוקד של עמידה ביעדים, ביצועים, ואחוזי התמדה והתנהגות חברי הקהילה.
            </p>
          </div>

          {/* Action Buttons: WhatsApp, Print, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-center flex-shrink-0">
            <button
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedToast ? 'הועתק!' : 'העתק לוואטסאפ'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">הדפסה</span>
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Responsive Scope Bar with Compact Toggle Switch */}
        {canToggleGlobal ? (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Sleek Compact Toggle Switch */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300">היקף תצוגה:</span>
              <div 
                className="inline-flex p-0.5 rounded-xl bg-slate-950/80 border border-white/15 backdrop-blur-md shadow-inner"
                role="radiogroup"
                aria-label="בחירת היקף תצוגת נתונים"
              >
                <button
                  type="button"
                  onClick={() => setIsGlobalScope(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    !isGlobalScope 
                      ? 'bg-cyan-500 text-white shadow-sm ring-1 ring-cyan-300/40' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  aria-checked={!isGlobalScope}
                  title={`הצגת נתוני קבוצת ${activeCommunityObj.name} בלבד`}
                >
                  <span>{activeCommunityObj.isAdults ? '🎓' : '🌊'}</span>
                  <span>קבוצה נוכחית</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGlobalScope(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    isGlobalScope 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm ring-1 ring-amber-300/40' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  aria-checked={isGlobalScope}
                  title="הצגת תמונת מצב גלובלית - כלל הקבוצות והסניפים"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>כלל הקהילה</span>
                </button>
              </div>
            </div>

            {/* Live Scope Indicator Badge */}
            <div className="flex items-center gap-2">
              {isGlobalScope ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold shadow-inner">
                  <Globe className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                  <span>נתונים גלובליים: כלל הסניפים ({scopedAllMembers.length} רשומים | {weeklyHistory.length} סשנים)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-bold shadow-inner">
                  <span className="flex-shrink-0">{activeCommunityObj.isAdults ? '🎓' : '🌊'}</span>
                  <span>קבוצת {activeCommunityObj.name} בלבד ({scopedAllMembers.length} רשומים | {weeklyHistory.length} סשנים)</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-cyan-200">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30">
              <span>{activeCommunityObj.isAdults ? '🎓' : '🌊'}</span>
              <span>נתוני קבוצת {activeCommunityObj.name} בלבד</span>
            </div>
            <span className="text-slate-400 text-[11px] font-normal">משתתפים ומתנדבים רואים את ביצועי הקבוצה הנוכחית</span>
          </div>
        )}

        {/* Success toast notification */}
        {copiedToast && (
          <div className="mt-3 p-2.5 bg-emerald-500/90 text-white rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            התקציר הועתק בהצלחה ללוח להדבקה מיידית בוואטסאפ!
          </div>
        )}
      </div>

      {/* Row 1: High-level Vital Signs KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Active Surfers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">גולשי קהילה פעילים</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{members.length}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
              <span>+ {staffMembers.length} סגל</span>
              <span className="text-slate-300">•</span>
              <span>
                {isGlobalScope ? `${allMembers.length} רשומים בכלל הקהילה` : `${scopedAllMembers.length} רשומים בקבוצה`}
              </span>
            </div>
          </div>
        </div>

        {/* Total Sea Hours */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">שעות ים קהילתיות</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-cyan-700">{Math.round(totalSeaHours)}</div>
            <div className="text-xs text-slate-500 mt-1">
              {isGlobalScope ? 'שעות מים מצטברות בכלל הקהילה' : `שעות מים מצטברות בקבוצת ${activeCommunityObj.name}`}
            </div>
          </div>
        </div>

        {/* Avg Sea Hours Per Member (Depth of Impact) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">ממוצע שעות לחבר</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-teal-700">{avgHoursPerMember}</span>
              <span className="text-xs sm:text-sm font-bold text-teal-600">שעות</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isGlobalScope ? 'עומק אימפקט ממוצע בכלל הקהילה' : `עומק אימפקט בקבוצת ${activeCommunityObj.name}`}
            </div>
          </div>
        </div>

        {/* Avg Attendance */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">ממוצע נוכחות לסשן</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">{avgAttendees}</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-600">גולשים</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isGlobalScope ? 'ממוצע גולשים לסשן פעיל בכלל הקהילה' : `ממוצע גולשי ${activeCommunityObj.name} לסשן פעיל`}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium">
              * מבוסס על {last8Sessions.length} הסשנים הפעילים האחרונים (ללא ימים שבוטלו)
            </div>
          </div>
        </div>

        {/* Shnat Hevel Zug: Plan vs Actual Execution */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group col-span-2 sm:col-span-1">
          {/* Subtle decorative glass backdrop gradient */}
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-gradient-to-br from-indigo-400/10 via-purple-300/10 to-transparent rounded-full blur-xl pointer-events-none" />

          {/* Header: Title, Timeframe Toggle Switch, and Target Icon */}
          <div className="flex items-center justify-between relative z-10 gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-700">שנת חבל זוג - ביצוע מול תכנון</span>
              {/* Clean Timeframe Toggle: Active Cohort vs Annual 2026 */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPlanTimeframe('cohort')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    planTimeframe === 'cohort'
                      ? 'bg-white text-indigo-700 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="הצגת נתוני המחזור הפעיל הנוכחי"
                >
                  {yearConfig?.name || 'מחזור ז׳'}
                </button>
                <button
                  type="button"
                  onClick={() => setPlanTimeframe('annual')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    planTimeframe === 'annual'
                      ? 'bg-white text-indigo-700 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="הצגת נתוני שנת פעילות מלאה (2026)"
                >
                  שנת 2026
                </button>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center border border-indigo-100/60 shadow-xs shrink-0">
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 relative z-10">
            {/* Primary Numbers Row */}
            <div className="flex items-baseline justify-between gap-2 mb-2.5">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight">
                    {yearlyPlanStats.executedCount}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-500">
                    סשנים בוצעו
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  מתוך {yearlyPlanStats.plannedToDate} שתוכננו עד כה {isGlobalScope ? '(בכלל הקהילה)' : `(${activeCommunityObj.name})`}
                </span>
              </div>

              {/* Pace Badge */}
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border shadow-xs ${
                  yearlyPlanStats.pacePercent >= 80 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : yearlyPlanStats.pacePercent >= 50 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <span className="text-xs font-black tracking-tight">{yearlyPlanStats.pacePercent}%</span>
                  <span className="text-[10px] font-bold">עמידה ביעד</span>
                </div>
              </div>
            </div>

            {/* Quick Summary Chips: Executed vs Cancelled vs Planned vs Year Goal */}
            <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
              <div className="bg-slate-50/80 rounded-lg p-1.5 border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold">בוצעו</div>
                <div className="text-sm font-black text-indigo-700">{yearlyPlanStats.executedCount}</div>
              </div>
              <div className="bg-slate-50/80 rounded-lg p-1.5 border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold" title="בוטלו עקב תנאי ים או חגים (חגי תשרי)">בוטלו/חג</div>
                <div className="text-sm font-black text-rose-600">{yearlyPlanStats.cancelledCount}</div>
              </div>
              <div className="bg-slate-50/80 rounded-lg p-1.5 border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold">עד כה</div>
                <div className="text-sm font-black text-slate-700">{yearlyPlanStats.plannedToDate}</div>
              </div>
              <div className="bg-indigo-50/50 rounded-lg p-1.5 border border-indigo-100">
                <div className="text-[10px] text-indigo-500 font-bold">יעד שנתי</div>
                <div className="text-sm font-black text-indigo-900">{yearlyPlanStats.totalYearPlanned}</div>
              </div>
            </div>

            {/* Dual Benchmark Progress Bar (Annual Goal Progress + Target Marker for Today) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-0.5">
                <span>התקדמות ביעד השנתי: {yearlyPlanStats.annualCompletionPercent}%</span>
                <span>יעד להיום: {yearlyPlanStats.targetPacePercent}%</span>
              </div>
              <div 
                dir="rtl" 
                className="relative w-full h-3 rounded-full bg-slate-100/90 backdrop-blur-md p-0.5 border border-slate-200/60 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.06)] overflow-visible"
                title={`התקדמות מהיעד השנתי: ${yearlyPlanStats.annualCompletionPercent}% (${yearlyPlanStats.executedCount}/${yearlyPlanStats.totalYearPlanned})`}
              >
                {/* Target marker (where we should be today on annual curve) */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                  style={{ right: `${Math.min(99, Math.max(1, yearlyPlanStats.targetPacePercent))}%` }}
                >
                  <div className="absolute -top-4 right-1/2 translate-x-1/2 text-[8px] font-black text-amber-700 bg-amber-50 px-1 rounded shadow-xs border border-amber-200 whitespace-nowrap">
                    יעד עד כה
                  </div>
                </div>

                {/* Progress Fill: Anchored right (RTL), expands left */}
                <div
                  className="h-full rounded-full bg-gradient-to-l from-indigo-600 via-indigo-500 to-sky-400 shadow-[0_1px_4px_rgba(99,102,241,0.35)] relative overflow-hidden transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, yearlyPlanStats.annualCompletionPercent))}%` }}
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-white/60 rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>{yearlyPlanStats.timeframeName} ({isGlobalScope ? 'כלל הקהילה' : activeCommunityObj.name})</span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-indigo-700">נותרו עוד {yearlyPlanStats.remainingToPlan} סשנים ליעד</span>
            </div>
          </div>
        </div>
      </div>





      {/* Row 3: Attendance & Persistence by Age Groups (Style matching KPI frames: No progress bars, clear numbers & percentages) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">הגעה והתמדה לפי קבוצות גיל</h3>
              <p className="text-xs text-slate-500">
                שיעור התמדה ומספר חברים פעילים (מבוסס 8 סשנים אחרונים)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            מבוסס 8 סשנים אחרונים
          </span>
        </div>

        {/* Minimalist Cards - Exactly matching the screenshot frame style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ageCohortData.map(cohort => {
            return (
              <div
                key={cohort.key}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-slate-500">{cohort.label}</span>
                    <span className="text-[11px] text-slate-400 font-medium">גילאי {cohort.range}</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {cohort.persistencePercent}%
                    </span>
                    <span className="text-xs font-bold text-amber-600">התמדה</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    <strong className="text-slate-800 font-bold">{cohort.totalMembers}</strong> חברים בקבוצה
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3.5: Geographic Distance Persistence Breakdown (Style matching KPI frames) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">פילוח התמדה לפי מרחק גיאוגרפי מהמועדון</h3>
              <p className="text-xs text-slate-500">
                שיעור התמדה ומספר חברים לפי מרחק מחוף הבית ({siteConfig?.home_break?.formatted || 'הרצליה'})
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            מבוסס מיקום מגורים
          </span>
        </div>

        {/* Minimalist Cards - Exactly matching the screenshot frame style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {distanceCohortData.map(cohort => {
            return (
              <div
                key={cohort.key}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-slate-500">{cohort.label}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{cohort.range}</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {cohort.persistencePercent}%
                    </span>
                    <span className="text-xs font-bold text-sky-600">התמדה</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    <strong className="text-slate-800 font-bold">{cohort.totalMembers}</strong> חברים באזור
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3.6: Gender Persistence Breakdown (Style matching KPI frames) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">פילוח התמדה לפי מגדר</h3>
              <p className="text-xs text-slate-500">
                שיעור התמדה ומספר חברים פעילים בחלוקה מגדרית (מבוסס 8 סשנים אחרונים)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            מבוסס 8 סשנים אחרונים
          </span>
        </div>

        {/* Minimalist Cards - Exactly matching the screenshot frame style */}
        <div className={`grid gap-4 ${genderCohortData.filter(c => c.totalMembers > 0 || c.key !== 'other').length <= 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
          {genderCohortData.filter(c => c.totalMembers > 0 || c.key !== 'other').map(cohort => {
            return (
              <div
                key={cohort.key}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-slate-500">{cohort.label}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{cohort.subLabel}</span>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cohort.iconBg}`}>
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {cohort.persistencePercent}%
                    </span>
                    <span className={`text-xs font-bold ${cohort.accentColor}`}>התמדה</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    <strong className="text-slate-800 font-bold">{cohort.totalMembers}</strong> {cohort.key === 'women' ? 'חברות פעילות' : 'חברים פעילים'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 4: Retention Watchlist & Actionable Outreach */}
      {reEngagementWatchlist.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">דופק שימור - גולשים שכדאי לחמם איתם קשר</h3>
                <p className="text-xs text-slate-500">גולשים פעילים שלא נכחו ב-3 הסשנים האחרונים</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              {reEngagementWatchlist.length} גולשים במעקב
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reEngagementWatchlist.map(member => {
              const age = calculateAge(member.birthday || (member as any).birthDate);
              const cleanPhone = (member.mobile || '').replace(/[^0-9]/g, '');
              const fullName = getMemberName(member);
              const firstName = member.firstName || fullName.split(' ')[0];
              const waLink = cleanPhone ? `https://wa.me/972${cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(`היי ${firstName}, מתגעגעים אליך במים של אטלף! מה שלומך? מקווים לראות אותך בסשן הקרוב 🌊`)}` : null;

              return (
                <div 
                  key={member.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 text-xs truncate">
                      {fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {age ? `גיל ${age}` : 'חבר קהילה'}
                    </div>
                  </div>

                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex-shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      וואטסאפ
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">ללא טלפון</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-200">
        <div 
          className="bg-slate-100 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default CommunityExecutiveSnapshot;
