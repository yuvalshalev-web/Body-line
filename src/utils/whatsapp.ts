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
