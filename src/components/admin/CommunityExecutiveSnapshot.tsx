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
  Target
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Member } from '../../types';
import { calculateAge, parseDate, formatDate } from '../../utils/dateUtils';
import { isAppShaperUser } from '../../constants';
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
    weeklyHistory = [], 
    siteConfig, 
    yearConfig
  } = useData();

  const [copiedToast, setCopiedToast] = useState(false);

  // Helper to format full member name
  const getMemberName = (m: Member | any): string => {
    return `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'חבר קהילה';
  };

  // Filter regular active community members (exclude staff, appshaper, and inactive/deactivated)
  const members = useMemo(() => {
    return allMembers.filter(m => m.role !== 'Staff' && !isAppShaperUser(m) && m.isActive !== false && !m.deactivatedAt);
  }, [allMembers]);

  // Staff and operational management members
  const staffMembers = useMemo(() => {
    return allMembers.filter(m => m.role === 'Staff' || isAppShaperUser(m));
  }, [allMembers]);

  const defaultDuration = siteConfig?.sessionDurationMinutes || 90;

  // Calculations: Recent 8 sessions for persistence metrics
  const sortedSessions = useMemo(() => {
    return [...weeklyHistory].sort((a, b) => {
      const da = parseDate(a.date) || new Date(0);
      const db = parseDate(b.date) || new Date(0);
      return db.getTime() - da.getTime();
    });
  }, [weeklyHistory]);

  const last8Sessions = useMemo(() => sortedSessions.slice(0, 8), [sortedSessions]);
  const lastSession = sortedSessions[0] || null;

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

  // 4. Planned vs Actual Sessions for Current Shnat Hevel Zug (שנת חבל זוג הנוכחית)
  const yearlyPlanStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    // Default academic/community year starts Sept 1st
    const defaultStartYear = currentMonthIndex < 8 ? currentYear - 1 : currentYear;
    const defaultStartDate = new Date(defaultStartYear, 8, 1).toISOString();
    const defaultEndDate = new Date(defaultStartYear + 1, 7, 31).toISOString();

    const startDate = yearConfig?.startDate || defaultStartDate;
    const endDate = yearConfig?.endDate || defaultEndDate;

    const startDateObj = parseDate(startDate) || new Date(defaultStartDate);
    const endDateObj = parseDate(endDate) || new Date(defaultEndDate);

    // Total planned sessions in the entire Hevel Zug year (counting regular session days, e.g. Thursdays)
    const totalYearPlanned = countThursdays(startDate, endDate) || 52;
    // Planned to date (from start of year until today or end of year)
    const plannedToDate = countThursdays(startDate, now < endDateObj ? now : endDate) || 1;

    // Actual executed surf sessions within this Hevel Zug year
    const executedSessions = weeklyHistory.filter(s => {
      if (s.isEvent) return false;
      const sDate = parseDate(s.date);
      if (!sDate) return false;
      const hasParticipants = (s.participantsCount || 0) > 0 || (s.participantIds?.length || 0) > 0;
      return sDate >= startDateObj && sDate <= (now < endDateObj ? now : endDateObj) && hasParticipants;
    });

    const executedCount = executedSessions.length;
    // Execution rate against planned to date (pace of plan)
    const pacePercent = plannedToDate > 0 ? Math.round((executedCount / plannedToDate) * 100) : 0;
    // Total annual target completion rate
    const annualCompletionPercent = totalYearPlanned > 0 ? Math.round((executedCount / totalYearPlanned) * 100) : 0;
    const remainingToPlan = Math.max(0, totalYearPlanned - executedCount);

    return {
      startDate: startDateObj,
      endDate: endDateObj,
      totalYearPlanned,
      plannedToDate,
      executedCount,
      pacePercent,
      annualCompletionPercent,
      remainingToPlan
    };
  }, [yearConfig, weeklyHistory]);

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
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    text += `📊 *מדדי מפתח וביצועים:*\n`;
    text += `• גולשי קהילה פעילים: ${members.length} (+ ${staffMembers.length} אנשי סגל וצוות | ${allMembers.length} סה״כ רשומים)\n`;
    text += `• שעות ים מצטברות העונה: ${Math.round(totalSeaHours)} שעות\n`;
    text += `• ממוצע נוכחות לסשן: ${avgAttendees} גולשים\n\n`;

    text += `🎯 *תכנון מול ביצוע (שנת חבל זוג):*\n`;
    text += `• סשנים שבוצעו: ${yearlyPlanStats.executedCount} מתוך ${yearlyPlanStats.plannedToDate} מתוכננים עד כה (${yearlyPlanStats.pacePercent}% קצב ביצוע)\n`;
    text += `• יעד שנתי כולל: ${yearlyPlanStats.totalYearPlanned} סשנים (${yearlyPlanStats.annualCompletionPercent}% השלמה שנתית)\n\n`;

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
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold tracking-wide">
                <Sparkles className="w-3 h-3" />
                ONE-PAGER SNAPSHOT
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs hidden sm:inline">{formatDate(new Date())}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              דופק הקהילה וסיכום מנהלים
            </h2>
            <p className="text-cyan-100/75 text-xs sm:text-sm mt-0.5 max-w-xl">
              תקציר מנהלים ממוקד של עמידה ביעדים, ביצועים, ואחוזי התמדה והתנהגות חברי הקהילה.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedToast ? 'הועתק ללוח!' : 'העתק לוואטסאפ'}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              הדפסה
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all ml-1"
                title="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Success toast notification */}
        {copiedToast && (
          <div className="mt-3 p-2.5 bg-emerald-500/90 text-white rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            התקציר הועתק בהצלחה ללוח להדבקה מיידית בוואטסאפ!
          </div>
        )}
      </div>

      {/* Row 1: High-level Vital Signs KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>+ {staffMembers.length} אנשי סגל וצוות</span>
              <span className="text-slate-300">•</span>
              <span>{allMembers.length} סה״כ רשומים</span>
            </div>
          </div>
        </div>

        {/* Sea Hours */}
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
              שעות מים מצטברות העונה
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
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">{avgAttendees}</div>
            <div className="text-xs text-slate-500 mt-1">
              ב-8 הסשנים האחרונים
            </div>
          </div>
        </div>

        {/* Shnat Hevel Zug: Plan vs Actual Execution */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500">ביצוע מול תכנון (שנתי)</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-indigo-700">{yearlyPlanStats.executedCount}</span>
              <span className="text-sm font-black text-slate-400">/ {yearlyPlanStats.plannedToDate}</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 mr-auto">
                {yearlyPlanStats.pacePercent}% ביצוע
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              מתוכננים בשנה: {yearlyPlanStats.totalYearPlanned} סשנים
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
