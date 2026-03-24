/**
 * TODO: REPLACE OR REFACTOR
 * This component (OperationalChartHeader) does not align with the hybrid 
 * "Tangible Surfer UI" (wood, horizontal signs) and "Elite Alabaster" (glassmorphism, luxury white) 
 * design language. It is too standard/corporate.
 */
import React from 'react';

interface OperationalChartHeaderProps {
  title?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  currentMonth?: number;
  currentWeek?: number;
  isActive?: boolean;
}

export const OperationalChartHeader: React.FC<OperationalChartHeaderProps> = ({ 
  title, subtitle, startDate, endDate, currentMonth, currentWeek, isActive 
}) => {
  return (
    <div className="mb-4 flex flex-col gap-2">
      {title && <h3 className="text-lg font-bold">{title}</h3>}
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      {(startDate || endDate) && (
        <div className="flex gap-4 text-xs font-bold text-slate-600 bg-slate-100 p-2 rounded-lg w-fit">
          {startDate && <span>התחלה: {startDate}</span>}
          {endDate && <span>סיום: {endDate}</span>}
          {currentMonth !== undefined && <span>חודש: {currentMonth}</span>}
          {currentWeek !== undefined && <span>שבוע: {currentWeek}</span>}
          {isActive !== undefined && (
            <span className={isActive ? 'text-emerald-600' : 'text-rose-600'}>
              {isActive ? 'פעיל' : 'הסתיים'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OperationalChartHeader;
