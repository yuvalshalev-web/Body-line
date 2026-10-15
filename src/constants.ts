
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
  return user.role === 'Support';
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
export const DEFAULT_BRANCH_COHORTS: Record<string, string> = {
  herzliya: "מחזור ז׳",
  tel_baruch: "מחזור ז׳",
  ashdod: "מחזור ד׳",
  ashkelon: "מחזור ג׳",
  kiryat_yam: "מחזור ב׳"
};

/**
 * מחזיר את שם המחזור הפעיל עבור סניף ספציפי
 */
export function getBranchCohortName(
  branchId: string,
  branchCohorts?: Record<string, string> | null,
  globalFallback?: string
): string {
  const cleanBranchId = branchId.replace('_adults', '');
  if (branchCohorts && branchCohorts[cleanBranchId] && branchCohorts[cleanBranchId].trim()) {
    return branchCohorts[cleanBranchId].trim();
  }
  if (DEFAULT_BRANCH_COHORTS[cleanBranchId]) {
    return DEFAULT_BRANCH_COHORTS[cleanBranchId];
  }
  return (globalFallback && globalFallback.trim()) ? globalFallback.trim() : "מחזור פעיל";
}

/**
 * בונה את רשימת 10 הקבוצות המקומיות באופן דינמי על בסיס המחזור הפעיל הספציפי
 * לכל מיקום גיאוגרפי (סניף). לדוגמה: הרצליה - מחזור ז', אשקלון - מחזור ג'.
 */
export function getAvailableCommunities(
  branchCohortsOrGlobalName?: string | Record<string, string> | null,
  globalFallbackName?: string
): Community[] {
  const isMap = typeof branchCohortsOrGlobalName === 'object' && branchCohortsOrGlobalName !== null;
  const branchMap: Record<string, string> = isMap ? (branchCohortsOrGlobalName as Record<string, string>) : {};
  const globalFallback = (typeof branchCohortsOrGlobalName === 'string' && branchCohortsOrGlobalName.trim()) 
    ? branchCohortsOrGlobalName.trim() 
    : (globalFallbackName?.trim() || "מחזור ז׳");

  const list: Community[] = [];

  for (const branch of BASE_COMMUNITY_BRANCHES) {
    const branchCohort = getBranchCohortName(branch.id, branchMap, globalFallback);

    // 1. קבוצת המחזור הפעיל לסניף
    list.push({
      id: branch.id,
      name: `${branch.baseName} - ${branchCohort}`,
      baseName: branch.baseName,
      isAdults: false
    });

    // 2. קבוצת הבוגרים לסניף
    list.push({
      id: `${branch.id}_adults`,
      name: `${branch.baseName} - בוגרים`,
      baseName: branch.baseName,
      isAdults: true
    });
  }

  return list;
}

// רשימת ברירת מחדל (הרצליה - מחזור ז׳, אשקלון - מחזור ג׳ וכו׳) לתאימות מלאה
export const AVAILABLE_COMMUNITIES: Community[] = getAvailableCommunities(DEFAULT_BRANCH_COHORTS);

