import React, { useState } from 'react';

interface AnalogClockPickerProps {
  value: string; // "HH:MM"
  onChange: (time: string) => void;
  onCancel: () => void;
  onOk: () => void;
}

export const AnalogClockPicker: React.FC<AnalogClockPickerProps> = ({ value, onChange, onCancel, onOk }) => {
  const [hour, minute] = value.split(':').map(Number);

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-0 shadow-xl w-80 overflow-hidden">
      {/* Header */}
      <div className="bg-teal-500 text-white p-6 text-5xl font-bold text-center">
        {value}
      </div>
      
      {/* Clock Face */}
      <div className="p-6">
        <div className="relative w-64 h-64 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, i) => {
            const hourValue = i + 1;
            const angle = (i - 2) * (Math.PI * 2) / 12;
            const x = 128 + 90 * Math.cos(angle);
            const y = 128 + 90 * Math.sin(angle);
            return (
              <div
                key={hourValue}
                className={`absolute w-10 h-10 flex items-center justify-center rounded-full cursor-pointer ${hour === hourValue ? 'bg-teal-500 text-white' : 'hover:bg-teal-100'}`}
                style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                onClick={() => onChange(`${hourValue.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)}
              >
                {hourValue}
              </div>
            );
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const hourValue = i === 11 ? 0 : i + 13;
            const angle = (i - 2) * (Math.PI * 2) / 12;
            const x = 128 + 50 * Math.cos(angle);
            const y = 128 + 50 * Math.sin(angle);
            return (
              <div
                key={hourValue}
                className={`absolute w-8 h-8 flex items-center justify-center rounded-full cursor-pointer text-xs ${hour === hourValue ? 'bg-teal-500 text-white' : 'hover:bg-teal-100'}`}
                style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                onClick={() => onChange(`${hourValue.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)}
              >
                {hourValue === 0 ? '00' : hourValue}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex justify-end gap-4 p-4 text-teal-600 font-bold">
        <button onClick={onCancel} className="hover:bg-teal-50 px-4 py-2 rounded-lg">CANCEL</button>
        <button onClick={onOk} className="hover:bg-teal-50 px-4 py-2 rounded-lg">OK</button>
      </div>
    </div>
  );
};
