import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform, animate } from 'motion/react';
import { Thermometer, Waves, Clock } from 'lucide-react';
import { WetsuitIcon } from './WetsuitIcon';
import { useData } from '../contexts/DataContext';

interface WaterTempCardProps {
  lastUpdated: number; // Timestamp
}

const getWetsuitRecommendation = (temp: number) => {
  if (temp < 17) return { text: "חליפה 4/3 + נעליים", color: "bg-blue-900", icon: 'full' as const };
  if (temp < 20) return { text: "חליפה 3/2 או 4/3", color: "bg-blue-600", icon: 'full' as const };
  if (temp < 23) return { text: "חליפה דקה 2/2", color: "bg-teal-500", icon: 'shorty' as const };
  if (temp < 26) return { text: "שורטי (Shorty)", color: "bg-emerald-500", icon: 'shorty' as const };
  return { text: "לייקרה בלבד", color: "bg-orange-500", icon: 'lycra' as const };
};

export const WaterTempCard: React.FC<WaterTempCardProps> = ({ lastUpdated }) => {
  const { coastalWeather } = useData();
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

  const recommendation = getWetsuitRecommendation(currentTemp);
  const minutesAgo = Math.floor((Date.now() - lastUpdated) / 60000);

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] rounded-3xl p-6 flex flex-col gap-4 text-slate-800"
      dir="rtl"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Thermometer className="text-cyan-600" size={20} />
          <span className="font-bold text-lg">טמפרטורת מים</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <motion.div 
            animate={{ opacity: [1, 0.5, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-green-500" 
          />
          <span>עודכן לפני {minutesAgo} דקות</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center mt-2 gap-4">
        <div className="flex items-baseline gap-1">
          <motion.span className="text-6xl font-black">
            {count.get().toFixed(1)}
          </motion.span>
          <span className="text-3xl font-bold text-slate-400">°C</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col text-left">
            <span className="text-sm font-medium text-slate-500">חליפה מומלצת:</span>
            <span className="text-xl font-bold text-slate-800">{recommendation.text}</span>
          </div>
          <motion.div
            initial={{ rotate: -5, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <WetsuitIcon type={recommendation.icon} className="w-20 h-20 text-cyan-700" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
