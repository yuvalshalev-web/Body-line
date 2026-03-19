import React from 'react';

interface DayPickerProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export const DayPicker: React.FC<DayPickerProps> = ({ value, onChange, className = '' }) => {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className={className}
    >
      {days.map((day, index) => (
        <option key={index} value={index}>{day}</option>
      ))}
    </select>
  );
};
