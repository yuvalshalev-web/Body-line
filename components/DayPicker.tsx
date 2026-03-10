import React from 'react';

interface DayPickerProps {
  value: number;
  onChange: (day: number) => void;
}

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const DayPicker: React.FC<DayPickerProps> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="px-4 py-2 rounded-[16px] font-medium text-sm bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] text-white border border-[rgba(255,255,255,0.2)] focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.3)] transition-all"
    >
      {days.map((day, index) => (
        <option key={index} value={index} className="bg-slate-800 text-white">
          {day}
        </option>
      ))}
    </select>
  );
};
