
import React from 'react';
import { Info, Calendar, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface OperationalChartHeaderProps {
  startDate: string;
  endDate: string;
  currentMonth?: number;
  currentWeek?: number;
  isActive?: boolean;
}

const OperationalChartHeader: React.FC<OperationalChartHeaderProps> = ({
  startDate,
  endDate,
  currentMonth,
  currentWeek,
  isActive = true
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">
              תצוגת שנת חבל זוג
            </span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {isActive ? 'פעיל' : 'לא פעיל'}
            </span>
          </div>
          <h3 className="text-lg font-black text-[#2B2B2E] tracking-tight">
            טווח: {startDate} — {endDate}
          </h3>
        </div>

        {isActive && currentWeek && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-black text-emerald-700 uppercase tracking-widest">
              סטטוס: שבוע {currentWeek} לפעילות
              {currentMonth && ` (חודש ${currentMonth})`}
            </span>
          </motion.div>
        )}
      </div>

      <div className="glass-panel p-4 !rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-white/10 rounded-xl shadow-sm border border-white/20 text-slate-400">
          <Info size={16} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            <span className="font-black text-[#2B2B2E]">מקרא:</span> חודש (n) מציין את חודש הפעילות מתחילת השנה התפעולית. 
            הציר מציג חודשים יחסיים לנוחות השוואה תפעולית ודיוק בביצועים.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OperationalChartHeader;
