/**
 * TODO: REPLACE OR REFACTOR
 * This component (OperationalChartHeader) does not align with the hybrid 
 * "Tangible Surfer UI" (wood, horizontal signs) and "Elite Alabaster" (glassmorphism, luxury white) 
 * design language. It is too standard/corporate.
 */
import React from 'react';

interface OperationalChartHeaderProps {
  cohortName?: string;
  title?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  currentMonth?: number;
  currentWeek?: number;
  isActive?: boolean;
}

export const OperationalChartHeader: React.FC<OperationalChartHeaderProps> = ({ 
  cohortName, title, subtitle, startDate, endDate, currentMonth, currentWeek, isActive 
}) => {
  return (
    <div className="mb-4 flex flex-col gap-2">
      {title && <h3 className="text-lg font-bold">{title}</h3>}
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      {(startDate || endDate || cohortName) && (
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 bg-slate-100/90 backdrop-blur-xs p-2.5 rounded-xl w-fit border border-slate-200/60 shadow-xs">
          {cohortName && (
            <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg shadow-xs font-black">
              {cohortName}
            </span>
          )}
          {startDate && <span>התחלה: {startDate}</span>}
          {endDate && <span>סיום: {endDate}</span>}
          {currentMonth !== undefined && <span>חודש: {currentMonth}</span>}
          {currentWeek !== undefined && <span>שבוע: {currentWeek}</span>}
          {isActive !== undefined && (
            <span className={`px-2 py-0.5 rounded-md ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {isActive ? 'פעיל' : 'הסתיים'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OperationalChartHeader;
