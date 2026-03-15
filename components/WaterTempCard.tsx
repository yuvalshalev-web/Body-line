import React, { useState, useEffect } from 'react';
import { motion, useSpring, animate } from 'motion/react';
import { Thermometer, Snowflake, Sun, Crown } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface WaterTempCardProps {
  lastUpdated: number; // Timestamp
}

export const WaterTempCard: React.FC<WaterTempCardProps> = ({ lastUpdated }) => {
  const { coastalWeather, seaStats } = useData();
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const count = useSpring(0, { stiffness: 100, damping: 20 });

  useEffect(() => {
    if (coastalWeather) {
      setCurrentTemp(coastalWeather.waterTemp);
    }
  }, [coastalWeather]);

  useEffect(() => {
    const controls = animate(0, currentTemp || 0, {
      duration: 1.5,
      onUpdate: (value) => count.set(value),
    });
    return () => controls.stop();
  }, [currentTemp, count]);

  if (currentTemp === null) return null;

  const annualMin = seaStats?.minWaterTemp || 15.0;
  const annualMax = seaStats?.maxWaterTemp || 30.0;
  const progress = ((currentTemp - annualMin) / (annualMax - annualMin)) * 100;
  const isFreezing = currentTemp <= annualMin + 1;

  return (
    <motion.div 
      className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] rounded-3xl p-6 flex flex-col gap-4 text-slate-800"
      dir="rtl"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Thermometer className="text-cyan-600" size={20} />
          <span className="font-bold text-lg">טמפ' מים</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-baseline gap-1">
          <motion.span className="text-5xl font-black text-slate-900">
            {count.get().toFixed(1)}
          </motion.span>
          <span className="text-2xl font-bold text-slate-400">°C</span>
        </div>

        <div className="bg-slate-100 rounded-full px-4 py-1 text-sm font-bold text-slate-600">
          4/3 מומלץ
        </div>
      </div>

      <div className="relative h-16 flex items-center mt-2">
        {/* Annual Axis Gradient */}
        <div className="absolute w-full h-3 bg-gradient-to-l from-amber-400 via-teal-400 to-blue-900 rounded-full" />
        
        {/* Markers */}
        <div className="absolute w-full flex justify-between -top-8 text-xs font-bold text-slate-500">
          <div className="flex flex-col items-center gap-1">
            <Snowflake className="w-4 h-4 text-blue-500" />
            <span>{annualMin.toFixed(1)}°</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <Sun className="w-4 h-4 text-amber-500" />
              <Crown className="w-2 h-2 text-amber-600 absolute -top-1 -right-1" />
            </div>
            <span>{annualMax.toFixed(1)}°</span>
          </div>
        </div>

        {/* Surfer Marker */}
        <motion.div 
          className={`absolute w-6 h-6 rounded-full border-4 border-white shadow-lg ${isFreezing ? 'bg-cyan-400 animate-pulse' : 'bg-white'}`}
          style={{ left: `${Math.min(Math.max(progress, 0), 100)}%`, transform: 'translateX(-50%)' }}
          initial={{ left: '0%' }}
          animate={{ left: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </motion.div>
  );
};
