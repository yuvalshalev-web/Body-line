/**
 * TODO: REFACTOR
 * This component (TimePicker) uses a standard HTML time input, which does not 
 * align with the "Elite Alabaster" (luxury white, glassmorphism) or 
 * "Tangible Surfer" (premium materials) aesthetic. 
 * Replace with a custom glass time picker or a tactile selection component.
 */
import React from 'react';

interface TimePickerProps {
  value: string;
  onChange?: (value: string) => void;
  onChangeValue?: (value: string) => void;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, onChangeValue, className = '' }) => {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => {
        if (onChange) onChange(e.target.value);
        if (onChangeValue) onChangeValue(e.target.value);
      }}
      className={className}
    />
  );
};

export default TimePicker;
