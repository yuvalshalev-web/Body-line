import { BranchCohortConfig } from './types';

export const SUPER_ADMIN_EMAIL = 'yuval.shalev@gmail.com';

export const isAdminUser = (user: { role?: string; email?: string } | null | undefined): boolean => {
  if (!user) return false;
  return (
    user.role === 'Admin' ||
    user.role === 'Staff' ||
    user.role === 'Support'
  );
};

export const isAppShaperUser = (user: { role?: string; email?: string } | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'Support' || (user.email ? user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() : false);
};

export const canSwitchAllCommunities = (user: { role?: string; email?: string } | null | undefined): boolean => {
  if (!user) return false;
  const emailLower = (user.email || '').toLowerCase();
  const isSuper = emailLower === SUPER_ADMIN_EMAIL.toLowerCase();
  return (
    user.role === 'Admin' ||        // רכז
    user.role === 'Instructor' ||   // מדריך
    user.role === 'Staff' ||        // צוות עמותה
    user.role === 'Support' ||      // אפ-שייפר
    isSuper
  );
};

export const isPrivilegedGalleryManager = (user: { role?: string; email?: string } | null | undefined): boolean => {
  if (!user) return false;
  return (
    user.role === 'Admin' ||     // רכז
    user.role === 'Staff' ||     // צוות עמותה
    user.role === 'Support'      // אפ-שייפר
  );
};

export const canDeleteGalleryItem = (
  user: { id?: string; uid?: string; role?: string; email?: string; firstName?: string; lastName?: string } | null | undefined,
  item: { uploaderId?: string; uploaderName?: string } | null | undefined
): boolean => {
  if (!user || !item) return false;
  // 1. רכז, צוות עמותה ואפ-שייפר יכולים למחוק כל תמונה בגלריה
  if (isPrivilegedGalleryManager(user)) return true;

  // 2. משתתף שהעלה תמונה יכול למחוק את התמונה שהוא העלה ורק אותה
  if (item.uploaderId && (item.uploaderId === user.id || item.uploaderId === user.uid)) {
    return true;
  }
  
  // תאימות שמות אם הועלה ללא ID מזהה
  if (item.uploaderName && user.firstName && user.lastName) {
    const userFullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
    if (item.uploaderName.trim().toLowerCase() === userFullName) {
      return true;
    }
  }

  return false;
};

export const isSystemOrTestMember = (member: { email?: string; firstName?: string; lastName?: string; isSystem?: boolean } | null | undefined): boolean => {
  if (!member) return true;
  if (member.isSystem) return true;
  const email = (member.email || '').toLowerCase().trim();
  if (email.endsWith('@bodyline.internal') || email.includes('@bodyline.internal')) return true;
  if (email.endsWith('@bodyline.test') || email.includes('@bodyline.test')) return true;
  if (email.startsWith('sys_') || email.startsWith('test_')) return true;
  const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase().trim();
  if (
    fullName.includes('system admin') || 
    fullName.includes('system session') || 
    fullName.includes('dev admin') || 
    fullName.includes('test member')
  ) {
    return true;
  }
  return false;
};

export const RANKS = [
  { level:1, id:"pop-upist",      he:"פופ-אפיסט",  min:0,   max:5,   accent:"#00B4D8", perks:["מנסה לעמוד בלי ליפול","שותה יותר מים מים המלח","מפחד מהגלשן של עצמך"],                            desc:"המסע מתחיל. כל גלשן אגדי היה כאן." },
  { level:2, id:"corner-catcher", he:"קצפ-אפיסט",  min:5,   max:15,  accent:"#D4A373", perks:["תופס קצף כמו מקצוען","עדיין מחפש את הבלנס","הגלשן תמיד בורח"],                desc:"המים מכירים אותך. אתה מתחיל לקרוא גלים." },
  { level:3, id:"line-upist",     he:"ליין-אפיסט", min:15,  max:30,  accent:"#F4A261", perks:["יודע מה זה ליין-אפ","מנסה לעשות סיבובים","לא נופל (לפעמים)"],       desc:"אתה יושב בליין-אפ. הגלים הגדולים כבר שלך." },
  { level:4, id:"show-upist",     he:"שואו-אפיסט", min:30,  max:35,  accent:"#E76F51", perks:["עושה פוזות למצלמה","תופס גלים בלי לחשוב","מתחיל לעוף באוויר"],     desc:"כולם מסתכלים. אתה הגל." },
  { level:5, id:"kelly-slater",   he:"קלי סלייטר", min:35,  max:null,accent:"#9B5DE5", perks:["הים הוא הסלון שלך","מבלה יותר במים מאשר ביבשה","קלי סלייטר מתקשר להתייעץ"],            desc:"מעל 35 סשן. אתה לא גולש על הים — אתה הים." },
];

export interface Community {
  id: string;
  name: string;
  baseName?: string;
  isAdults?: boolean;
}

// 5 סניפי הפעילות הפיזיים של עמותת חבל זוג
export const BASE_COMMUNITY_BRANCHES = [
  { id: 'herzliya', baseName: 'הרצליה' },
  { id: 'tel_baruch', baseName: 'תל ברוך' },
  { id: 'ashdod', baseName: 'אשדוד' },
  { id: 'ashkelon', baseName: 'אשקלון' },
  { id: 'kiryat_yam', baseName: 'קריית ים' }
];

// ברירות מחדל למחזור פעיל לפי סניף גיאוגרפי (למשל: בהרצליה מחזור ז׳, באשקלון מחזור ג׳)
export const DEFAULT_BRANCH_COHORTS: Record<string, BranchCohortConfig> = {
  herzliya: { 
    name: "מחזור ז׳ הרצליה", 
    startDate: "2026-09-01", 
    endDate: "2027-07-31",
    dayOfWeek: 4,
    startTime: "07:00",
    sessionDurationMinutes: 90,
    frequency: 'weekly',
    groups: [
      { id: 'h_1', name: "מחזור ז׳ הרצליה", type: 'cohort', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 4, startTime: "07:00", sessionDurationMinutes: 90, frequency: 'weekly' },
      { id: 'h_2', name: "קבוצת בוגרים הרצליה", type: 'alumni', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 4, startTime: "08:30", sessionDurationMinutes: 90, frequency: 'biweekly' }
    ]
  },
  tel_baruch: { 
    name: "מחזור ז׳ תל אביב", 
    startDate: "2026-09-01", 
    endDate: "2027-07-31",
    dayOfWeek: 5,
    startTime: "06:30",
    sessionDurationMinutes: 90,
    frequency: 'weekly',
    groups: [
      { id: 'tb_1', name: "מחזור ז׳ תל אביב", type: 'cohort', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 5, startTime: "06:30", sessionDurationMinutes: 90, frequency: 'weekly' },
      { id: 'tb_2', name: "קבוצת בוגרים תל אביב", type: 'alumni', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 5, startTime: "08:00", sessionDurationMinutes: 90, frequency: 'biweekly' }
    ]
  },
  ashdod: { 
    name: "מחזור ד׳ אשדוד", 
    startDate: "2026-09-01", 
    endDate: "2027-07-31",
    dayOfWeek: 3,
    startTime: "07:00",
    sessionDurationMinutes: 90,
    frequency: 'weekly',
    groups: [
      { id: 'as_1', name: "מחזור ד׳ אשדוד", type: 'cohort', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 3, startTime: "07:00", sessionDurationMinutes: 90, frequency: 'weekly' },
      { id: 'as_2', name: "קבוצת בוגרים אשדוד", type: 'alumni', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 3, startTime: "08:30", sessionDurationMinutes: 90, frequency: 'biweekly' }
    ]
  },
  ashkelon: { 
    name: "מחזור ג׳ אשקלון", 
    startDate: "2026-09-01", 
    endDate: "2027-07-31",
    dayOfWeek: 2,
    startTime: "07:30",
    sessionDurationMinutes: 90,
    frequency: 'weekly',
    groups: [
      { id: 'ask_1', name: "מחזור ג׳ אשקלון", type: 'cohort', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 2, startTime: "07:30", sessionDurationMinutes: 90, frequency: 'weekly' },
      { id: 'ask_2', name: "קבוצת בוגרים אשקלון", type: 'alumni', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 2, startTime: "09:00", sessionDurationMinutes: 90, frequency: 'biweekly' }
    ]
  },
  kiryat_yam: { 
    name: "מחזור ב׳ קריית ים", 
    startDate: "2026-09-01", 
    endDate: "2027-07-31",
    dayOfWeek: 1,
    startTime: "08:00",
    sessionDurationMinutes: 90,
    frequency: 'weekly',
    groups: [
      { id: 'ky_1', name: "מחזור ב׳ קריית ים", type: 'cohort', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 1, startTime: "08:00", sessionDurationMinutes: 90, frequency: 'weekly' },
      { id: 'ky_2', name: "קבוצת בוגרים קריית ים", type: 'alumni', startDate: "2026-09-01", endDate: "2027-07-31", dayOfWeek: 1, startTime: "09:30", sessionDurationMinutes: 90, frequency: 'biweekly' }
    ]
  }
};

/**
 * מחזיר את שם המחזור הפעיל עבור סניף ספציפי (תמיד משלב מחזור ומיקום, כגון "מחזור ז׳ הרצליה")
 */
export function getBranchCohortName(
  branchId?: string,
  branchCohorts?: Record<string, BranchCohortConfig> | null,
  globalFallback?: string
): string {
  if (!branchId) return (globalFallback && globalFallback.trim()) ? globalFallback.trim() : "מחזור פעיל";
  
  const cleanBranchId = branchId.replace('_adults', '');
  const branchObj = BASE_COMMUNITY_BRANCHES.find(b => b.id === cleanBranchId);
  const branchBaseName = branchObj?.baseName || '';

  let rawName = '';
  const cohort = branchCohorts?.[cleanBranchId];
  if (cohort?.name) {
    rawName = cohort.name.trim();
  } else {
    const defaultCohort = DEFAULT_BRANCH_COHORTS[cleanBranchId];
    if (defaultCohort?.name) {
      rawName = defaultCohort.name.trim();
    } else {
      rawName = (globalFallback && globalFallback.trim()) ? globalFallback.trim() : "מחזור פעיל";
    }
  }

  if (branchBaseName && !rawName.includes(branchBaseName)) {
    return `${rawName} ${branchBaseName}`;
  }

  return rawName;
}

/**
 * בונה את רשימת הקבוצות המקומיות באופן דינמי על בסיס המחזור הפעיל הספציפי
 * לכל מיקום גיאוגרפי (סניף). לדוגמה: "מחזור ז׳ הרצליה", "קבוצת בוגרים הרצליה".
 */
export function getAvailableCommunities(
  branchCohortsOrGlobalName?: string | Record<string, BranchCohortConfig> | null,
  globalFallbackName?: string
): Community[] {
  const isMap = typeof branchCohortsOrGlobalName === 'object' && branchCohortsOrGlobalName !== null;
  const branchMap: Record<string, BranchCohortConfig> = isMap ? (branchCohortsOrGlobalName as Record<string, BranchCohortConfig>) : {};
  const globalFallback = (typeof branchCohortsOrGlobalName === 'string' && branchCohortsOrGlobalName.trim()) 
    ? branchCohortsOrGlobalName.trim() 
    : (globalFallbackName?.trim() || "מחזור ז׳");

  const list: Community[] = [];

  for (const branch of BASE_COMMUNITY_BRANCHES) {
    const branchCohort = getBranchCohortName(branch.id, branchMap, globalFallback);
    const cohortDisplay = branchCohort.includes(branch.baseName) ? branchCohort : `${branchCohort} ${branch.baseName}`;

    // 1. קבוצת המחזור הפעיל לסניף
    list.push({
      id: branch.id,
      name: cohortDisplay,
      baseName: branch.baseName,
      isAdults: false
    });

    // 2. קבוצת הבוגרים לסניף
    list.push({
      id: `${branch.id}_adults`,
      name: `קבוצת בוגרים ${branch.baseName}`,
      baseName: branch.baseName,
      isAdults: true
    });
  }

  return list;
}

// רשימת ברירת מחדל (הרצליה - מחזור ז׳, אשקלון - מחזור ג׳ וכו׳) לתאימות מלאה
export const AVAILABLE_COMMUNITIES: Community[] = getAvailableCommunities(DEFAULT_BRANCH_COHORTS);

