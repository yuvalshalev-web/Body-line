import React from 'react';

interface DayPickerProps {
  value: number;
  onChange: (day: number) => void;
  className?: string;
}

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const DayPicker: React.FC<DayPickerProps> = ({ value, onChange, className }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full bg-white/40 backdrop-blur-md border border-white/20 rounded-xl p-3 text-lg font-bold text-[var(--deep-teal-sea)] focus:ring-2 focus:ring-[var(--surfer-cyan)] outline-none transition-all appearance-none cursor-pointer ${className || ''}`}
      >
        {days.map((day, index) => (
          <option key={index} value={index} className="bg-white text-[var(--deep-teal-sea)] font-bold">
            {day}
          </option>
        ))}
      </select>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--deep-teal-sea)]">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
};
