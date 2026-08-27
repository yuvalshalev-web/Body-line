import React from 'react';
import { Clock, CalendarCheck, Sun, CalendarX } from 'lucide-react';
import { AvailabilitySchedule, AVAILABILITY_SCHEDULE_OPTIONS } from '../constants/availability';

interface AvailabilityPreferenceSectionProps {
  value?: AvailabilitySchedule;
  onChange?: (value: AvailabilitySchedule) => void;
  className?: string;
  isCompact?: boolean;
  readOnly?: boolean;
}

export const AvailabilityPreferenceSection: React.FC<AvailabilityPreferenceSectionProps> = ({
  value = 'always',
  onChange,
  className = '',
  isCompact = false,
  readOnly = false
}) => {
  const currentValue = value || 'always';

  const getIcon = (id: AvailabilitySchedule) => {
    switch (id) {
      case 'always':
        return <Clock className="w-5 h-5 text-emerald-600" />;
      case 'no_shabbat_holidays':
        return <CalendarX className="w-5 h-5 text-amber-600" />;
      case 'weekdays_only':
        return <Sun className="w-5 h-5 text-sky-600" />;
      default:
        return <CalendarCheck className="w-5 h-5 text-slate-600" />;
    }
  };

  const getActiveStyles = (id: AvailabilitySchedule) => {
    switch (id) {
      case 'always':
        return 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-400/30';
      case 'no_shabbat_holidays':
        return 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400/30';
      case 'weekdays_only':
        return 'border-sky-500 bg-sky-50/70 text-sky-950 ring-2 ring-sky-400/30';
      default:
        return 'border-slate-500 bg-slate-50 text-slate-950';
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`} dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {AVAILABILITY_SCHEDULE_OPTIONS.map((option) => {
          const isSelected = currentValue === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange && onChange(option.id)}
              className={`relative flex items-start gap-3 p-4 rounded-2xl border text-right transition-all ${
                readOnly ? 'cursor-default' : 'cursor-pointer'
              } ${
                isSelected 
                  ? `${getActiveStyles(option.id)} shadow-xs font-bold` 
                  : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700 opacity-60'
              } ${isCompact ? 'p-3' : 'p-4'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                isSelected 
                  ? 'bg-white shadow-xs' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {getIcon(option.id)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-sm font-black ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                    {option.label}
                  </span>
                  {option.id === 'always' && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-md font-bold">
                      ברירת מחדל
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {option.description}
                </p>
              </div>

              {/* Radio indicator circle */}
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                isSelected 
                  ? 'border-slate-800 bg-slate-800' 
                  : 'border-slate-300 bg-white'
              }`}>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
