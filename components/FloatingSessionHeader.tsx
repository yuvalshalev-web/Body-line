import React, { useState } from 'react';
import { Plus, Save, History, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingSessionHeaderProps {
  onSave: () => void;
  isSaving: boolean;
  onCreateNewSession: () => void;
  onSelectHistory: (date: Date) => void;
  historyDates: Date[];
  formatDate: (date: any) => string;
  showSave?: boolean;
}

const FloatingSessionHeader: React.FC<FloatingSessionHeaderProps> = ({
  onSave,
  isSaving,
  onCreateNewSession,
  onSelectHistory,
  historyDates,
  formatDate,
  showSave = true
}) => {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center">
      <div className="flex items-center gap-2 glass-panel !rounded-full p-2 shadow-2xl">
        {/* Right: Create New Session */}
        <button
          onClick={onCreateNewSession}
          className="flex items-center gap-2 px-5 py-3 bg-[var(--ocean-navy)] text-white rounded-full font-black text-xs hover:bg-[var(--ocean-deep)] transition-all shadow-lg"
        >
          <Plus size={16} className="text-[var(--ocean-seafoam)]" />
          <span>סשן חדש</span>
        </button>

        {/* Center: History Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
            className="flex items-center gap-2 px-5 py-3 glass-btn text-[var(--ocean-navy)] !rounded-full font-black text-xs transition-all border border-[var(--ocean-navy)]/20"
          >
            <History size={16} className="text-[var(--ocean-deep)]" />
            <span>יומן סשנים...</span>
            <ChevronDown size={14} className={`${showHistoryDropdown ? 'rotate-180' : ''} text-[var(--ocean-navy)]`} />
          </button>

          <AnimatePresence>
            {showHistoryDropdown && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowHistoryDropdown(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-[var(--ocean-navy)]/10 !rounded-2xl py-2 z-[100] shadow-2xl max-h-80 overflow-y-auto custom-scrollbar"
                >
                  <div className="px-4 py-2 text-[10px] font-black text-[var(--ocean-navy)]/40 uppercase tracking-widest border-b border-[var(--ocean-navy)]/5 mb-1">
                    בחר תאריך לעריכה
                  </div>
                  {historyDates.map((date, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectHistory(date);
                        setShowHistoryDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-right hover:bg-[var(--ocean-seafoam)]/10 transition-colors font-bold text-sm text-[var(--ocean-navy)] flex items-center justify-between group"
                    >
                      <span>{formatDate(date)}</span>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Left: Save Changes */}
        {showSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--ocean-deep)] text-white rounded-full font-black text-xs hover:bg-[var(--ocean-navy)] transition-all disabled:opacity-50 shadow-lg"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="text-[var(--ocean-seafoam)]" />}
            <span>שמור שינויים</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingSessionHeader;
