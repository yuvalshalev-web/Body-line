import React from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const [hour, minute] = value.split(':');

  return (
    <div className="flex items-center gap-2">
      <select
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        className="p-3 rounded-[16px] border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)] font-bold text-white focus:ring-2 ring-[var(--vibrant-cyan)]/30"
      >
        {hours.map((h) => (
          <option key={h} value={h} className="text-black">{h}</option>
        ))}
      </select>
      <span className="text-white font-black">:</span>
      <select
        value={minute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        className="p-3 rounded-[16px] border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)] font-bold text-white focus:ring-2 ring-[var(--vibrant-cyan)]/30"
      >
        {minutes.map((m) => (
          <option key={m} value={m} className="text-black">{m}</option>
        ))}
      </select>
    </div>
  );
};
