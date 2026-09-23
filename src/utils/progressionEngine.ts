import { Member } from '../types';
import { RANKS } from '../constants';

export interface StageSkill {
  id: string;
  name: string;
  description: string;
}

export interface ClubVibeRank {
  level: number;
  id: string;
  he: string;
  min: number;
  max: number | null;
  accent: string;
  perks: string[];
  desc: string;
  isCurrent: boolean;
  isPassed: boolean;
}

export interface ProgressionStage {
  id: number;
  stageNumber: number;
  title: string;
  subtitle: string;
  tagline: string;
  monthsRange: string;
  sessionsRange: string;
  minSessions: number;
  maxSessions: number;
  hoursRange: string;
  minHours: number;
  maxHours: number;
  technicalMilestone: string;
  equipmentFocus: string;
  badgeLabel: string;
  skills: StageSkill[];
  themeColor: {
    primary: string;
    bg: string;
    border: string;
    text: string;
    gradient: string;
    glow: string;
  };
}

export function getProgressionStages(sessionDurationMinutes: number = 90): ProgressionStage[] {
  const durationHours = (sessionDurationMinutes || 90) / 60;
  const fmt = (hrs: number) => {
    const rounded = Math.round(hrs * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
  };

  return [
    {
      id: 1,
      stageNumber: 1,
      title: 'בסיס וירידה מקצף',
      subtitle: 'שלב 1: חודשים 1–3',
      tagline: 'מעבר מלא מקצף לגלים ירוקים נמוכים',
      monthsRange: 'חודש 1–3',
      sessionsRange: '1–12 סשנים',
      minSessions: 1,
      maxSessions: 12,
      hoursRange: `${fmt(1 * durationHours)} – ${fmt(12 * durationHours)} שעות`,
      minHours: Math.round(1 * durationHours * 10) / 10,
      maxHours: Math.round(12 * durationHours * 10) / 10,
      technicalMilestone: 'מעבר מלא מקצף. תפיסת גלים ירוקים נמוכים ואימוץ עמידה נכונה.',
      equipmentFocus: 'סופטבורד (Softboard) נפח גבוה 7\'0–8\'0',
      badgeLabel: 'בסיס וגלי ירק (1-12)',
      skills: [
        { id: 's1-1', name: 'עזיבת הקצף (Whitewater)', description: 'חתירה מתוזמנת ויציאה לעומק מעבר לקו השבירה' },
        { id: 's1-2', name: 'תפיסת גל ירוק נמוך', description: 'זיהוי התרוממות הגל לפני שבירה וחתירה מדויקת' },
        { id: 's1-3', name: 'עמידה נכונה ויציבה (Pop-up)', description: 'עמידה מרכזית יציבה עם פישוק נכון ומרכז כובד נמוך' }
      ],
      themeColor: {
        primary: '#0284c7',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-700',
        gradient: 'from-sky-500 to-cyan-500',
        glow: 'rgba(2, 132, 199, 0.35)',
      }
    },
    {
      id: 2,
      stageNumber: 2,
      title: 'שיוט בדופן הגל (Trim)',
      subtitle: 'שלב 2: חודשים 4–7',
      tagline: 'תפיסה בזווית ושיוט יציב על קו המים הפתוח',
      monthsRange: 'חודש 4–7',
      sessionsRange: '13–30 סשנים',
      minSessions: 13,
      maxSessions: 30,
      hoursRange: `${fmt(13 * durationHours)} – ${fmt(30 * durationHours)} שעות`,
      minHours: Math.round(13 * durationHours * 10) / 10,
      maxHours: Math.round(30 * durationHours * 10) / 10,
      technicalMilestone: 'תפיסה עקבית של גל פתוח, ירידה בזווית, ושיוט יציב על דופן הגל (Trim).',
      equipmentFocus: 'סופטבורד מתקדם / מעבר למיני-מאליבו',
      badgeLabel: 'שיוט דופן הגל (13-30)',
      skills: [
        { id: 's2-1', name: 'ירידה בזווית (Angled Takeoff)', description: 'כיוון החרטום לכיוון שבירת הגל (ימינה/שמאלה) עוד בשלב החתירה' },
        { id: 's2-2', name: 'שיוט על דופן הגל (Trim Line)', description: 'החזקת גובה על קיר הגל ושמירה על מהירות שיוט רציפה' },
        { id: 's2-3', name: 'תפיסה עקבית של גל פתוח', description: 'קריאת סט גלים וכניסה מוצלחת ברוב הניסיונות' }
      ],
      themeColor: {
        primary: '#0d9488',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        text: 'text-teal-700',
        gradient: 'from-teal-500 to-emerald-500',
        glow: 'rgba(13, 148, 136, 0.35)',
      }
    },
    {
      id: 3,
      stageNumber: 3,
      title: 'שליטה וניווט בגלים',
      subtitle: 'שלב 3: חודשים 8–12',
      tagline: 'פניות רכות, ניווט לאורך הגל וסיום גל בביטחון',
      monthsRange: 'חודש 8–12',
      sessionsRange: '31–50 סשנים',
      minSessions: 31,
      maxSessions: 50,
      hoursRange: `${fmt(31 * durationHours)} – ${fmt(50 * durationHours)} שעות`,
      minHours: Math.round(31 * durationHours * 10) / 10,
      maxHours: Math.round(50 * durationHours * 10) / 10,
      technicalMilestone: 'תקרה ריאליסטית: פניות רכות ימינה/שמאלה, ניווט לאורך הגל וסיום גל בביטחון.',
      equipmentFocus: 'סופטבורד מהיר / מעבר לגלשן קשיח מותאם אישית',
      badgeLabel: 'שליטה וניווט (31-50)',
      skills: [
        { id: 's3-1', name: 'פניות רכות ימינה/שמאלה (Carves)', description: 'העברת משקל לחרטום ולירכתיים ליצירת שינוי כיוון חלק' },
        { id: 's3-2', name: 'ניווט לאורך הגל', description: 'שילוב פניות קלות כדי להישאר ב-Pocket (אזור הכוח של הגל)' },
        { id: 's3-3', name: 'יציאה וסיום גל בביטחון (Kick-out)', description: 'סיום מבוקר של הגל לפני שבירת החוף וירידה בטוחה' }
      ],
      themeColor: {
        primary: '#6366f1',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        gradient: 'from-indigo-500 to-purple-600',
        glow: 'rgba(99, 102, 241, 0.35)',
      }
    },
    {
      id: 4,
      stageNumber: 4,
      title: 'גלישה חופשית ומיומנת',
      subtitle: 'שלב 4: חודש 12+ ומעלה',
      tagline: 'קריאת ים מתקדמת, תמרון חופשי ועצמאות מלאה',
      monthsRange: 'חודש 12+',
      sessionsRange: '50+ סשנים',
      minSessions: 51,
      maxSessions: 9999,
      hoursRange: `${fmt(50 * durationHours)}+ שעות`,
      minHours: Math.round(50 * durationHours * 10) / 10,
      maxHours: 9999,
      technicalMilestone: 'קריאת גלים מתקדמת, תמרון מגוון, כניסה ויציאה עצמאית בכל תנאי הים.',
      equipmentFocus: 'גלשן קשיח / פאן-בורד / שורטבורד',
      badgeLabel: 'גולש מנוסה (50+)',
      skills: [
        { id: 's4-1', name: 'קריאת גלים וים מורכב', description: 'הבנת זרמים, תקופות גלים והתמקמות מדויקת בליין-אפ' },
        { id: 's4-2', name: 'תמרון חופשי ומגוון', description: 'Bottom Turn חזק, Cutback ושינויי כיוון דינמיים' },
        { id: 's4-3', name: 'עצמאות ובטיחות מלאה', description: 'ניהול סשנים עצמאיים בביטחון בכל גובה ים' }
      ],
      themeColor: {
        primary: '#e11d48',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        gradient: 'from-rose-500 to-amber-500',
        glow: 'rgba(225, 29, 72, 0.35)',
      }
    }
  ];
}

export const PROGRESSION_STAGES: ProgressionStage[] = getProgressionStages(90);

export interface StageStatus extends ProgressionStage {
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  progressPercentInStage: number;
}

export interface ProgressionAnalysis {
  userSessions: number;
  waterHours: number;
  overallProgressPercent: number;
  currentStage: ProgressionStage;
  nextStage: ProgressionStage | null;
  sessionsToNextStage: number;
  hoursToNextStage: number;
  stageProgressPercent: number;
  allStages: StageStatus[];
  currentClubVibe: ClubVibeRank;
  allClubVibes: ClubVibeRank[];
  communityAverageSessions: number;
  communityAverageHours: number;
  differenceFromAverage: number;
  percentageVsAverage: number;
  comparisonStatus: 'above' | 'average' | 'below' | 'starter';
  comparisonSummaryText: string;
  percentileRank: number;
}

export function calculateOverallProgressPercent(sessions: number): number {
  if (sessions <= 0) return 0;
  if (sessions <= 12) {
    return Math.min(33.33, Math.round((sessions / 12) * 33.33 * 10) / 10);
  }
  if (sessions <= 30) {
    const fraction = (sessions - 12) / (30 - 12);
    return Math.min(66.66, Math.round((33.33 + fraction * 33.33) * 10) / 10);
  }
  if (sessions <= 50) {
    const fraction = (sessions - 30) / (50 - 30);
    return Math.min(100, Math.round((66.66 + fraction * 33.34) * 10) / 10);
  }
  return 100;
}

export function calculateProgression(
  rawUserSessions: number,
  allMembers: Member[] = [],
  weeklyHistory: any[] = [],
  sessionDurationMinutes: number = 90
): ProgressionAnalysis {
  const durationHours = (sessionDurationMinutes || 90) / 60;
  const stages = getProgressionStages(sessionDurationMinutes);
  const userSessions = Math.max(0, Math.round(rawUserSessions || 0));
  const waterHours = Math.round(userSessions * durationHours * 10) / 10;
  const overallProgressPercent = calculateOverallProgressPercent(userSessions);

  let currentStageIndex = 0;
  if (userSessions >= 51) {
    currentStageIndex = 3;
  } else if (userSessions >= 31) {
    currentStageIndex = 2;
  } else if (userSessions >= 13) {
    currentStageIndex = 1;
  } else {
    currentStageIndex = 0;
  }

  const currentStage = stages[currentStageIndex];
  const nextStage = currentStageIndex < stages.length - 1 
    ? stages[currentStageIndex + 1] 
    : null;

  const sessionsToNextStage = nextStage 
    ? Math.max(0, nextStage.minSessions - userSessions) 
    : 0;
  const hoursToNextStage = Math.round(sessionsToNextStage * durationHours * 10) / 10;

  let stageProgressPercent = 0;
  if (currentStageIndex === 0) {
    stageProgressPercent = Math.min(100, Math.round((userSessions / 12) * 100));
  } else if (currentStageIndex === 1) {
    stageProgressPercent = Math.min(100, Math.round(((userSessions - 12) / (30 - 12)) * 100));
  } else if (currentStageIndex === 2) {
    stageProgressPercent = Math.min(100, Math.round(((userSessions - 30) / (50 - 30)) * 100));
  } else {
    stageProgressPercent = 100;
  }

  const allStages: StageStatus[] = stages.map((stage, idx) => {
    const isCompleted = userSessions > stage.maxSessions;
    const isCurrent = idx === currentStageIndex;
    const isLocked = idx > currentStageIndex;

    let progressPercentInStage = 0;
    if (isCompleted) {
      progressPercentInStage = 100;
    } else if (isCurrent) {
      progressPercentInStage = stageProgressPercent;
    }

    return {
      ...stage,
      isCompleted,
      isCurrent,
      isLocked,
      progressPercentInStage,
    };
  });

  const memberSessionCounts: number[] = [];
  allMembers.forEach(m => {
    if (m.isActive === false) return;
    let count = typeof m.totalAttendance === 'number' ? m.totalAttendance : 0;
    if (count === 0 && weeklyHistory.length > 0) {
      count = weeklyHistory.filter(s => s.participantIds?.includes(m.id) || (s.attendees && s.attendees.includes(m.id))).length;
    }
    memberSessionCounts.push(count);
  });

  const validCounts = memberSessionCounts.length > 0 ? memberSessionCounts : [userSessions || 8];
  const sumSessions = validCounts.reduce((acc, curr) => acc + curr, 0);
  const communityAverageSessions = Math.round((sumSessions / validCounts.length) * 10) / 10;
  const communityAverageHours = Math.round(communityAverageSessions * durationHours * 10) / 10;

  const differenceFromAverage = Math.round((userSessions - communityAverageSessions) * 10) / 10;
  const percentageVsAverage = communityAverageSessions > 0 
    ? Math.round(((userSessions - communityAverageSessions) / communityAverageSessions) * 100) 
    : 0;

  let comparisonStatus: 'above' | 'average' | 'below' | 'starter' = 'average';
  let comparisonSummaryText = '';

  if (userSessions === 0) {
    comparisonStatus = 'starter';
    comparisonSummaryText = 'מוכן לסשן הראשון שלך בים! נבנה יחד את הבסיס.';
  } else if (userSessions >= communityAverageSessions * 1.2 && differenceFromAverage >= 2) {
    comparisonStatus = 'above';
    comparisonSummaryText = `קצב גלישה מרשים! גבוה ב-${Math.abs(percentageVsAverage)}% מעל הממוצע הקהילתי (${communityAverageSessions} סשנים).`;
  } else if (userSessions <= communityAverageSessions * 0.8 && differenceFromAverage <= -2) {
    comparisonStatus = 'below';
    comparisonSummaryText = `התקדמות עקבית בדרך לממוצע הקהילה (${communityAverageSessions} סשנים, פער של ${Math.abs(differenceFromAverage)} סשנים).`;
  } else {
    comparisonStatus = 'average';
    comparisonSummaryText = `קצב מעולה ויציב! אתה נמצא בטווח הממוצע הקהילתי (${communityAverageSessions} סשנים).`;
  }

  let lowerCount = 0;
  validCounts.forEach(c => {
    if (userSessions >= c) lowerCount++;
  });
  const percentileRank = Math.min(99, Math.max(1, Math.round((lowerCount / validCounts.length) * 100)));

  // Calculate Club Vibe Ranks (Gamification & Social Folklore)
  const allClubVibes: ClubVibeRank[] = RANKS.map((r) => {
    const isPassed = r.max !== null && userSessions >= r.max;
    const isCurrent = userSessions >= r.min && (r.max === null || userSessions < r.max);
    return {
      level: r.level,
      id: r.id,
      he: r.he,
      min: r.min,
      max: r.max,
      accent: r.accent,
      perks: r.perks,
      desc: r.desc,
      isCurrent,
      isPassed,
    };
  });

  const currentClubVibe: ClubVibeRank = allClubVibes.find(v => v.isCurrent) || allClubVibes[0];

  return {
    userSessions,
    waterHours,
    overallProgressPercent,
    currentStage,
    nextStage,
    sessionsToNextStage,
    hoursToNextStage,
    stageProgressPercent,
    allStages,
    currentClubVibe,
    allClubVibes,
    communityAverageSessions,
    communityAverageHours,
    differenceFromAverage,
    percentageVsAverage,
    comparisonStatus,
    comparisonSummaryText,
    percentileRank,
  };
}
