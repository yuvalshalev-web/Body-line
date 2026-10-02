/**
 * Utilities for formatting WhatsApp phone numbers and messages
 */

export function cleanIsraeliMobile(mobile: string): string {
  const digits = (mobile || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return '972' + digits.substring(1);
  }
  if (digits.startsWith('972')) {
    return digits;
  }
  return digits;
}

export function formatResetPasswordWhatsAppMessage(params: {
  name: string;
  email: string;
  tempPassword: string;
  siteUrl?: string;
}): string {
  const siteUrl = params.siteUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://bodyline.co.il');
  const safeName = params.name.trim() || 'חבר/ת קהילה';
  
  return `היי *${safeName}*, 🌊\nהונפקה עבורך סיסמה זמנית חדשה לאתר קהילת חבל זוג:\n\n🔗 כתובת האתר: ${siteUrl}\n👤 שם משתמש: *${params.email}*\n🔑 סיסמה זמנית: *${params.tempPassword}*\n\nלידיעתך: הסיסמה תקפה לכניסה הקרובה בלבד, ולאחריה המערכת תבקש ממך לבחור סיסמה אישית וקבועה.\nנתראה בפנים! צוות חבל זוג 💪`;
}

export function formatBirthdayWhatsAppMessage(firstName: string, gender?: string): string {
  const isFemale = gender === 'נקבה' || gender === 'Female' || gender === 'female';
  
  if (isFemale) {
    return `היי *${firstName}* האלופה! 🤙🌊\n\nצוות קהילת חבל זוג מאחל לך המון מזל טוב ליום ההולדת! 🎂🎉🥳\n\nשתהיה לך שנה מטורפת של גלים מושלמים, סוולים נקיים ורוחות אופשור שמסדרות את הים בדיוק בשבילך! 🏄‍♀️✨\nשתמיד תישארי על הגל, בריאה, שמחה ומחוברת למים, לטבע ולקהילה המדהימה שלנו. 🌊💙\n\nמאחלים לך ליין-אפ מלא באנרגיות טובות וחברים לחיים. מחכים לראות אותך במים לגלוש על הגלים הבאים! 🤙🏄‍♀️☀️✨`;
  } else if (gender === 'זכר' || gender === 'Male' || gender === 'male') {
    return `היי *${firstName}* האלוף! 🤙🌊\n\nצוות קהילת חבל זוג מאחל לך המון מזל טוב ליום ההולדת! 🎂🎉🥳\n\nשתהיה לך שנה מטורפת של גלים מושלמים, סוולים נקיים ורוחות אופשור שמסדרות את הים בדיוק בשבילך! 🏄‍♂️✨\nשתמיד תישאר על הגל, בריא, שמח ומחובר למים, לטבע ולקהילה המדהימה שלנו. 🌊💙\n\nמאחלים לך ליין-אפ מלא באנרגיות טובות וחברים לחיים. מחכים לראות אותך במים לגלוש על הגלים הבאים! 🤙🏄‍♂️☀️✨`;
  } else {
    return `היי *${firstName}* היקר/ה! 🤙🌊\n\nצוות קהילת חבל זוג מאחל לך המון מזל טוב ליום ההולדת! 🎂🎉🥳\n\nשתהיה לך שנה מטורפת של גלים מושלמים, סוולים נקיים ורוחות אופשור שמסדרות את הים בדיוק בשבילך! 🏄‍♂️🏄‍♀️✨\nשתמיד תישאר/י על הגל, בריא/ה, שמח/ה ומחובר/ת למים, לטבע ולקהילה המדהימה שלנו. 🌊💙\n\nמאחלים לך ליין-אפ מלא באנרגיות טובות וחברים לחיים. מחכים לראות אותך במים לגלוש על הגלים הבאים! 🤙🌊☀️✨`;
  }
}

export function openWhatsAppWithMessage(mobile: string, message: string): boolean {
  const formatted = cleanIsraeliMobile(mobile);
  if (!formatted) return false;
  const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
    return true;
  }
  return false;
}
