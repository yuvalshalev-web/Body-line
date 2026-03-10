import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface AnalogTimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

const AnalogTimePicker: React.FC<AnalogTimePickerProps> = ({ value, onChange }) => {
  const [hours, setHours] = useState(parseInt(value.split(':')[0]) || 0);
  const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]) || 0);
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<SVGSVGElement>(null);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    
    // Calculate angle in degrees (0 is top/12 o'clock)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    // Determine if we are setting hours or minutes based on distance from center
    const distance = Math.sqrt(x * x + y * y);
    
    if (distance < rect.width / 4) {
      // Set hours (0-11)
      const newHours = Math.round(angle / 30) % 12;
      setHours(newHours);
    } else {
      // Set minutes (0-59)
      const newMinutes = Math.round(angle / 6) % 60;
      setMinutes(newMinutes);
    }
  };

  useEffect(() => {
    onChange(`${String(hours % 12 === 0 ? 12 : hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }, [hours, minutes]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl">
      <svg
        ref={clockRef}
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="cursor-pointer touch-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseMove={(e) => isDragging && handleInteraction(e)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={(e) => handleInteraction(e)}
      >
        <circle cx="100" cy="100" r="90" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        
        {/* Hour hand */}
        <motion.line
          x1="100" y1="100"
          x2="100" y2="60"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          animate={{ rotate: hours * 30 + minutes * 0.5 }}
          style={{ originX: "100px", originY: "100px" }}
        />
        
        {/* Minute hand */}
        <motion.line
          x1="100" y1="100"
          x2="100" y2="30"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ rotate: minutes * 6 }}
          style={{ originX: "100px", originY: "100px" }}
        />
        
        <circle cx="100" cy="100" r="4" fill="white" />
      </svg>
      <div className="text-2xl font-black text-white">
        {String(hours === 0 ? 12 : hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
      </div>
    </div>
  );
};

export default AnalogTimePicker;
