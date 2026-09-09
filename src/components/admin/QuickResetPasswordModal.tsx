import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, X, Sparkles, Loader2, Smartphone, AlertTriangle, MessageCircle, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Member } from '../../types';
import { hashPassword } from '../../utils/crypto';
import { TempPasswordWhatsAppModal } from './TempPasswordWhatsAppModal';
import { cleanIsraeliMobile, formatResetPasswordWhatsAppMessage, openWhatsAppWithMessage } from '../../utils/whatsapp';

interface QuickResetPasswordModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedMember: Member) => void;
}

export const QuickResetPasswordModal: React.FC<QuickResetPasswordModalProps> = ({
  member,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tempPassword, setTempPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhatsAppSuccess, setShowWhatsAppSuccess] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  // Generate a friendly, readable temporary password
  const generateRandomPassword = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let pass = 'Wave';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '!';
    setTempPassword(pass);
    setError(null);
  };

  useEffect(() => {
    if (isOpen && member) {
      generateRandomPassword();
      setError(null);
      setShowWhatsAppSuccess(false);
      setAutoOpened(false);
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'חבר/ת קהילה';
  const hasMobile = Boolean(cleanIsraeliMobile(member.mobile || ''));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPassword || tempPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const hashed = await hashPassword(tempPassword);

      // 1. Server-side update to Firestore and Auth with isTemporary: true
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: member.uid || member.id,
          email: member.email,
          password: tempPassword,
          isTemporary: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        console.warn('Server reset note:', data);
      }

      // 2. Prepare updated member object
      const updatedMember: Member = {
        ...member,
        password: hashed,
        isTemporary: true,
        updatedAt: new Date().toISOString(),
      };

      if (onSuccess) {
        onSuccess(updatedMember);
      }

      // 3. Format message and attempt to open WhatsApp immediately if mobile exists
      let opened = false;
      if (hasMobile) {
        const message = formatResetPasswordWhatsAppMessage({
          name: memberName,
          email: member.email,
          tempPassword,
        });
        opened = openWhatsAppWithMessage(member.mobile || '', message);
      }

      setAutoOpened(opened);
      setShowWhatsAppSuccess(true);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError('שגיאה באיפוס הסיסמה: ' + (err.message || 'אנא נסה שוב'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showWhatsAppSuccess) {
    return (
      <TempPasswordWhatsAppModal
        isOpen={true}
        onClose={() => {
          setShowWhatsAppSuccess(false);
          onClose();
        }}
        memberName={memberName}
        memberEmail={member.email}
        memberMobile={member.mobile || ''}
        tempPassword={tempPassword}
        autoOpenedWhatsApp={autoOpened}
      />
    );
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-l from-sky-600 to-indigo-700 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute left-5 top-5 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white flex-shrink-0">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">החלפת סיסמה ושליחה בוואטסאפ</h3>
                <p className="text-sky-100 text-xs font-medium mt-0.5">
                  עבור <strong className="text-white font-bold">{memberName}</strong>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* User Details Box */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">אימייל:</span>
                <span className="text-slate-800 font-black">{member.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Smartphone size={13} />
                  טלפון נייד בוואטסאפ:
                </span>
                {hasMobile ? (
                  <span className="text-emerald-700 font-mono font-black" dir="ltr">{member.mobile}</span>
                ) : (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertTriangle size={13} />
                    לא מוגדר
                  </span>
                )}
              </div>
            </div>

            {/* Password input & generator */}
            <div className="space-y-2">
              <div className="flex justify-between items-center pr-1">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  סיסמה זמנית חדשה:
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Sparkles size={13} />
                  חולל סיסמה אקראית
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="הזן או חולל סיסמה"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-mono font-black text-base focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-center tracking-wider"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium pr-1">
                * הסיסמה תהיה זמנית בלבד. בכניסה הראשונה המערכת תחייב את המשתמש לקבוע סיסמה קבועה.
              </p>
            </div>

            {/* Notice about WhatsApp */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <MessageCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">
                עם האישור, הסיסמה תעודכן במערכת וייפתח חלון וואטסאפ לשליחה ישירה לנייד של המשתמש.
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || !tempPassword}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} className="rotate-180" />
                    <span>עדכן ושלח בוואטסאפ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
