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
