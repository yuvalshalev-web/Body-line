import React, { useState } from 'react';
import { Plus, Save, History, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingSessionHeaderProps {
  onSave: () => void;
  isSaving: boolean;
  onCreateNewSession: () => void;
  onSelectHistory: (date: Date) => void;
  historyDates: Date[];
  formatDate: (date: any) => string;
}

const FloatingSessionHeader: React.FC<FloatingSessionHeaderProps> = ({
  onSave,
  isSaving,
  onCreateNewSession,
  onSelectHistory,
  historyDates,
  formatDate
}) => {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center">
      <div className="flex items-center gap-2 glass-panel !rounded-full p-2">
        {/* Right: Create New Session */}
        <button
          onClick={onCreateNewSession}
          className="flex items-center gap-2 px-5 py-3 bg-[var(--ocean-seafoam)] text-[var(--ocean-navy)] rounded-full font-black text-xs hover:opacity-90 transition-all"
        >
          <Plus size={16} className="text-[var(--ocean-navy)]" />
          <span>סשן חדש</span>
        </button>

        {/* Center: History Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
            className="flex items-center gap-2 px-5 py-3 glass-btn text-[var(--ocean-sky)] !rounded-full font-black text-xs transition-all"
          >
            <History size={16} className="text-[var(--ocean-liquid)]" />
            <span>עריכת סשן מההיסטוריה...</span>
            <ChevronDown size={14} className={`${showHistoryDropdown ? 'rotate-180' : ''} text-[var(--ocean-seafoam)]`} />
          </button>

          <AnimatePresence>
            {showHistoryDropdown && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowHistoryDropdown(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-64 modal-content !rounded-2xl py-2 z-[100] max-h-80 overflow-y-auto"
                >
                  {historyDates.map((date, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectHistory(date);
                        setShowHistoryDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-right hover:bg-cyan-200/10 transition-colors font-bold text-xs text-[var(--ocean-deep)]"
                    >
                      {formatDate(date)}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Left: Save Changes */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--ocean-sky)] text-[var(--ocean-navy)] rounded-full font-black text-xs hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Save size={16} className="text-[var(--ocean-navy)]" />
          <span>שמור שינויים</span>
        </button>
      </div>
    </div>
  );
};

export default FloatingSessionHeader;
