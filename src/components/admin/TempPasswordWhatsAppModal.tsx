import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Copy, Check, Key, X, Smartphone, AlertTriangle, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cleanIsraeliMobile, formatResetPasswordWhatsAppMessage, openWhatsAppWithMessage } from '../../utils/whatsapp';

interface TempPasswordWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  memberMobile: string;
  tempPassword: string;
  autoOpenedWhatsApp?: boolean;
}

export const TempPasswordWhatsAppModal: React.FC<TempPasswordWhatsAppModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  memberMobile,
  tempPassword,
  autoOpenedWhatsApp = false,
}) => {
  const [mobileNumber, setMobileNumber] = useState(memberMobile || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [wasSent, setWasSent] = useState(autoOpenedWhatsApp);

  useEffect(() => {
    setMobileNumber(memberMobile || '');
    setWasSent(autoOpenedWhatsApp);
  }, [memberMobile, autoOpenedWhatsApp, isOpen]);

  if (!isOpen) return null;

  const fullMessage = formatResetPasswordWhatsAppMessage({
    name: memberName,
    email: memberEmail,
    tempPassword,
  });

  const handleSendWhatsApp = () => {
    const success = openWhatsAppWithMessage(mobileNumber, fullMessage);
    if (success) {
      setWasSent(true);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(fullMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyPasswordOnly = () => {
    navigator.clipboard.writeText(tempPassword);
    setIsPasswordCopied(true);
    setTimeout(() => setIsPasswordCopied(false), 2000);
  };

  const hasMobile = Boolean(cleanIsraeliMobile(mobileNumber));

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-l from-emerald-600 to-teal-700 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute left-5 top-5 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
              title="סגור חלון"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner flex-shrink-0">
                <MessageCircle size={30} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white/90 inline-block mb-1">
                  הודעת וואטסאפ למשתמש
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  שליחת סיסמה זמנית
                </h3>
                <p className="text-emerald-100 text-xs sm:text-sm font-medium mt-0.5">
                  עבור: <strong className="text-white font-bold">{memberName}</strong> ({memberEmail})
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Status notification */}
            {wasSent && (
              <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold animate-in fade-in">
                <Check size={18} className="text-emerald-600 flex-shrink-0" />
                <span>וואטסאפ נפתח לשליחת ההודעה! אם החלון לא נפתח, לחץ על הכפתור הירוק למטה.</span>
              </div>
            )}

            {/* Password Highlight Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key size={14} className="text-sky-600" />
                  הסיסמה הזמנית שנוצרה
                </span>
                <button
                  type="button"
                  onClick={handleCopyPasswordOnly}
                  className="text-sky-600 hover:text-sky-700 flex items-center gap-1 text-[11px] font-black cursor-pointer"
                >
                  {isPasswordCopied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{isPasswordCopied ? 'הועתק!' : 'העתק סיסמה בלבד'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-800 tracking-wider select-all">
                  {tempPassword}
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                  לכניסה ראשונה בלבד
                </span>
              </div>
            </div>

            {/* Mobile Number Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 flex items-center gap-1.5 pr-1">
                <Smartphone size={14} className="text-slate-400" />
                מספר טלפון נייד בוואטסאפ:
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="לדוגמה: 050-1234567"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left"
                  dir="ltr"
                />
              </div>
              {!hasMobile && (
                <p className="text-[12px] font-bold text-amber-600 flex items-center gap-1.5 pt-1">
                  <AlertTriangle size={14} />
                  לא מוגדר מספר נייד תקין. נא להזין מספר לשליחה ישירה או להעתיק את ההודעה.
                </p>
              )}
            </div>

            {/* Message Preview (WhatsApp Bubble style) */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-600 pr-1 block">תצוגה מקדימה של ההודעה:</span>
              <div className="bg-[#ECE5DD] p-4 rounded-2xl border border-slate-300 relative shadow-inner">
                <div className="bg-white p-3.5 rounded-2xl rounded-tr-none shadow-sm text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans relative">
                  {fullMessage}
                  <div className="text-[10px] text-slate-400 text-left mt-2 flex items-center justify-end gap-1">
                    <span>עכשיו</span>
                    <Check size={12} className="text-sky-500 inline" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!hasMobile}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] disabled:opacity-50 text-white font-black text-base shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Send size={19} className="rotate-180" />
                <span>שלח עכשיו בוואטסאפ (WhatsApp)</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  <span>{isCopied ? 'ההודעה הועתקה!' : 'העתק הודעה'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  סיום וסגירה
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
