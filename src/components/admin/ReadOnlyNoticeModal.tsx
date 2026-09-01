import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, ShieldAlert, X } from 'lucide-react';

interface ReadOnlyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadOnlyNoticeModal: React.FC<ReadOnlyNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 relative overflow-hidden text-center space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative background glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
            aria-label="סגור"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-amber-100 to-amber-50 text-amber-600 rounded-3xl flex items-center justify-center shadow-inner border border-amber-200/60 relative">
            <Eye size={36} className="animate-pulse" />
            <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
              <span className="text-xl leading-none">👀</span>
            </div>
          </div>

          {/* Title & Body */}
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              פה מסתכלים, לא נוגעים 👀
            </h3>
            <p className="text-slate-600 font-bold text-base leading-relaxed">
              בקשות לשינוי נא להפנות למחלקת התמיכה הטכנית. הם כבר ימסמסו את זה. 😏
            </p>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-black">
            <ShieldAlert size={14} className="text-amber-500" />
            <span>הרשאת צפייה בלבד (Read Only)</span>
          </div>

          {/* Action button */}
          <div>
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-2xl font-black text-sm shadow-lg shadow-sky-500/25 active:scale-95 transition-all duration-200 border border-white/20"
            >
              הבנתי 😅
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
