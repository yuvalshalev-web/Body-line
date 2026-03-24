/**
 * TODO: REFACTOR
 * This component (DayPicker) uses a standard HTML select element, which does not 
 * align with the "Elite Alabaster" (luxury white, glassmorphism) or 
 * "Tangible Surfer" (premium materials) aesthetic. 
 * Replace with a custom glass dropdown or a tactile selection component.
 */
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
