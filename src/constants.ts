
export const SUPER_ADMIN_EMAIL = 'yuval.shalev@gmail.com';

export const isAdminUser = (user: { role?: string; email?: string } | null | undefined): boolean => {
  if (!user) return false;
  const email = user.email?.toLowerCase();
  return (
    user.role === 'Admin' ||
    user.role === 'Staff' ||
    user.role === 'Support' ||
    email === SUPER_ADMIN_EMAIL.toLowerCase() ||
    email === 'yuval@shalev.io'
  );
};

export const isAppShaperUser = (user: { role?: string; email?: string } | null | undefined): boolean => {
  if (!user) return false;
  const email = user.email?.toLowerCase();
  return (
    user.role === 'Support' ||
    email === SUPER_ADMIN_EMAIL.toLowerCase()
  );
};

export const isPrivilegedGalleryManager = (user: { role?: string; email?: string } | null | undefined): boolean => {
  if (!user) return false;
  const email = user.email?.toLowerCase();
  return (
    user.role === 'Admin' ||     // רכז
    user.role === 'Staff' ||     // צוות עמותה
    user.role === 'Support' ||   // אפ-שייפר
    email === SUPER_ADMIN_EMAIL.toLowerCase() ||
    email === 'yuval@shalev.io'
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
