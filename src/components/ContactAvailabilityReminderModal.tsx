import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Phone, X, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { ContactSensitivityCheck } from '../utils/availabilityTiming';

export interface PendingContactAction {
  type: 'whatsapp' | 'phone';
  memberName: string;
  memberAvatar?: string;
  mobile: string;
  sensitivity: ContactSensitivityCheck;
  onProceed: () => void;
}

interface ContactAvailabilityReminderModalProps {
  pendingAction: PendingContactAction | null;
  onClose: () => void;
}

export const ContactAvailabilityReminderModal: React.FC<ContactAvailabilityReminderModalProps> = ({
  pendingAction,
  onClose
}) => {
  if (!pendingAction) return null;

  const { type, memberName, memberAvatar, sensitivity, onProceed } = pendingAction;
  const isShabbat = sensitivity.reason === 'shabbat';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 text-right p-6 sm:p-7"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            title="סגירה"
          >
            <X size={20} />
          </button>

          {/* Icon Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isShabbat 
                ? 'bg-amber-100/80 text-amber-600 ring-4 ring-amber-50' 
                : 'bg-sky-100/80 text-sky-600 ring-4 ring-sky-50'
            }`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className={`text-[11px] font-black tracking-wider uppercase ${
                isShabbat ? 'text-amber-700' : 'text-sky-700'
              }`}>
                שיקול דעת לפני פנייה
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-snug">
                {sensitivity.title}
              </h3>
            </div>
          </div>

          {/* Member Info Card */}
          <div className={`p-4 rounded-2xl border mb-4 flex items-center gap-3.5 ${
            isShabbat 
              ? 'bg-amber-50/60 border-amber-200/70' 
              : 'bg-sky-50/60 border-sky-200/70'
          }`}>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs relative">
              {memberAvatar ? (
                <img src={memberAvatar} alt={memberName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User size={22} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-900 text-sm truncate">
                {memberName}
              </h4>
              <div className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-[11px] font-bold text-slate-800 shadow-2xs">
                <span>{sensitivity.badgeText}</span>
              </div>
            </div>
          </div>

          {/* Explanatory Note */}
          <div className="space-y-2 mb-6 text-sm leading-relaxed text-slate-600">
            <p className="font-medium">
              {sensitivity.message}
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-500 font-normal">
              💡 <span className="font-bold text-slate-700">תזכורת בלבד:</span> האפשרות ליצור קשר פתוחה לחלוטין. אנו רק מזכירים כדי שתוכל/י להפעיל שיקול דעת האם מדובר בפנייה דחופה או שעדיף להמתין.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row-reverse gap-2.5">
            <button
              type="button"
              onClick={() => {
                onProceed();
                onClose();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
                type === 'whatsapp'
                  ? 'bg-[#25D366] hover:bg-[#1fa851]'
                  : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              {type === 'whatsapp' ? <MessageCircle size={18} /> : <Phone size={18} />}
              <span>המשך ל{type === 'whatsapp' ? 'וואטסאפ' : 'שיחה'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all active:scale-95 cursor-pointer text-center"
            >
              הבנתי, אמתין
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
