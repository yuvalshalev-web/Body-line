import React from 'react';
import { motion } from 'motion/react';
import { Snowflake, Sun, Crown } from 'lucide-react';

interface Props {
  currentTemp: number;
  annualMin: number;
  annualMax: number;
}

export const OceanTempVisualizer: React.FC<Props> = ({ currentTemp, annualMin, annualMax }) => {
  const progress = ((currentTemp - annualMin) / (annualMax - annualMin)) * 100;
  const isFreezing = currentTemp <= annualMin + 1;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white shadow-xl" dir="rtl">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-lg font-bold opacity-80">טמפרטורת מים</h2>
        <div className="text-4xl font-black">
          {currentTemp.toFixed(1)}
          <span className="text-2xl font-normal opacity-70">°C</span>
        </div>
      </div>

      <div className="relative h-16 flex items-center">
        {/* Annual Axis Gradient */}
        <div className="absolute w-full h-3 bg-gradient-to-l from-amber-400 via-teal-400 to-blue-900 rounded-full" />
        
        {/* Markers */}
        <div className="absolute w-full flex justify-between -top-8 text-xs font-bold">
          <div className="flex flex-col items-center gap-1">
            <Snowflake className="w-5 h-5 text-sky-200" />
            <span>{annualMin}°</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <Sun className="w-5 h-5 text-amber-300" />
              <Crown className="w-3 h-3 text-amber-400 absolute -top-2 -right-1" />
            </div>
            <span>{annualMax}°</span>
          </div>
        </div>

        {/* Surfer Marker */}
        <motion.div 
          className={`absolute w-6 h-6 rounded-full border-4 border-white shadow-lg ${isFreezing ? 'bg-cyan-400 animate-pulse' : 'bg-white'}`}
          style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
          initial={{ left: '0%' }}
          animate={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
};
