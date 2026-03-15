
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Waves, 
  Thermometer, 
  Sun, 
  Wind, 
  Navigation, 
  Loader2,
  AlertTriangle,
  Video,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { getDoc, doc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useData } from '../contexts/DataContext';

interface CoastalData {
  waterTemp: number;
  waveHeight: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  timestamp: string;
  location: string;
  source: string;
}

interface SeaStats {
  maxWaveHeight: number;
  minWaveHeight: number;
  maxWaterTemp: number;
  minWaterTemp: number;
  maxWindSpeed: number;
  minWindSpeed: number;
  maxUvIndex: number;
  minUvIndex: number;
}

export const CoastalDashboard: React.FC = () => {
  const [data, setData] = useState<CoastalData | null>(null);
  const [stats, setStats] = useState<SeaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const weatherRes = await fetch('/api/coastal-weather');
        
        if (!weatherRes.ok) throw new Error('Failed to fetch coastal data');
        const weatherJson = await weatherRes.json();
        setData(weatherJson);
        
        // Fetch current stats
        const statsRef = doc(db, 'seaConditionsStats', 'current');
        const statsDoc = await getDoc(statsRef);
        
        let currentStats: SeaStats;

        if (!statsDoc.exists()) {
          // Initialize stats if they don't exist
          currentStats = {
            maxWaveHeight: weatherJson.waveHeight,
            minWaveHeight: weatherJson.waveHeight,
            maxWaterTemp: weatherJson.waterTemp,
            minWaterTemp: weatherJson.waterTemp,
            maxWindSpeed: weatherJson.windSpeed,
            minWindSpeed: weatherJson.windSpeed,
            maxUvIndex: weatherJson.uvIndex,
            minUvIndex: weatherJson.uvIndex
          };
          await setDoc(statsRef, currentStats);
          setStats(currentStats);
        } else {
          currentStats = statsDoc.data() as SeaStats;
          
          // Check if we need to update any peaks
          const needsUpdate = 
            weatherJson.waveHeight > currentStats.maxWaveHeight ||
            weatherJson.waveHeight < currentStats.minWaveHeight ||
            weatherJson.waterTemp > currentStats.maxWaterTemp ||
            weatherJson.waterTemp < currentStats.minWaterTemp ||
            weatherJson.windSpeed > currentStats.maxWindSpeed ||
            weatherJson.windSpeed < currentStats.minWindSpeed ||
            weatherJson.uvIndex > currentStats.maxUvIndex ||
            weatherJson.uvIndex < currentStats.minUvIndex;

          if (needsUpdate) {
            const newStats = {
              maxWaveHeight: Math.max(currentStats.maxWaveHeight, weatherJson.waveHeight),
              minWaveHeight: Math.min(currentStats.minWaveHeight, weatherJson.waveHeight),
              maxWaterTemp: Math.max(currentStats.maxWaterTemp, weatherJson.waterTemp),
              minWaterTemp: Math.min(currentStats.minWaterTemp, weatherJson.waterTemp),
              maxWindSpeed: Math.max(currentStats.maxWindSpeed, weatherJson.windSpeed),
              minWindSpeed: Math.min(currentStats.minWindSpeed, weatherJson.windSpeed),
              maxUvIndex: Math.max(currentStats.maxUvIndex, weatherJson.uvIndex),
              minUvIndex: Math.min(currentStats.minUvIndex, weatherJson.uvIndex)
            };
            await updateDoc(statsRef, newStats);
            setStats(newStats);
          } else {
            setStats(currentStats);
          }
        }
        
        // Optionally log the condition to history (fire and forget)
        addDoc(collection(db, 'seaConditions'), {
          timestamp: new Date().toISOString(),
          waveHeight: weatherJson.waveHeight,
          waterTemp: weatherJson.waterTemp,
          windSpeed: weatherJson.windSpeed,
          uvIndex: weatherJson.uvIndex
        }).catch(console.error);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000 * 60 * 15); // Refresh every 15 mins
    return () => clearInterval(interval);
  }, []);

  // ... (rest of the component)

  if (loading) {
    return (
      <div className="home-glass-card p-8 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[var(--surfer-cyan)]" size={32} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">טוען נתוני חוף...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="home-glass-card p-8 flex items-center justify-center min-h-[200px] border-red-500/30">
        <div className="flex flex-col items-center gap-3 text-red-500">
          <AlertTriangle size={32} />
          <span className="text-sm font-bold">שגיאה בטעינת נתונים</span>
        </div>
      </div>
    );
  }

  const getWindDirection = (deg: number) => {
    const directions = ['צפון', 'צפון-מזרח', 'מזרח', 'דרום-מזרח', 'דרום', 'דרום-מערב', 'מערב', 'צפון-מערב'];
    return directions[Math.round(deg / 45) % 8];
  };

  const getUVLevel = (uv: number) => {
    if (uv <= 2) return { label: 'נמוך', color: 'text-emerald-500' };
    if (uv <= 5) return { label: 'בינוני', color: 'text-yellow-500' };
    if (uv <= 7) return { label: 'גבוה', color: 'text-orange-500' };
    if (uv <= 10) return { label: 'גבוה מאוד', color: 'text-red-500' };
    return { label: 'קיצוני', color: 'text-purple-500' };
  };

  const uv = getUVLevel(data.uvIndex);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#e0f2fe] rounded-[2rem] border border-slate-200/50 overflow-hidden relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]"
      dir="rtl"
    >
      {/* Micro-grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none z-0" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      {/* Internal Glowing Pulse for the whole dashboard */}
      <motion.div 
        animate={{ 
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none"
      />

      <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-white/40 relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl relative overflow-hidden">
            <motion.div 
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-cyan-400 blur-md"
            />
            <Waves className="text-cyan-600 relative z-10" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">מצב הים - {data.location}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Marine Observations</p>
          </div>
        </div>
        <div className="text-left">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">עודכן</span>
          <span className="text-sm font-black text-slate-800">{new Date(data.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="relative z-10 p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Wave Height */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            className="col-span-2 row-span-2 bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_60px_-15px_rgba(8,145,178,0.15)] rounded-3xl p-6 flex flex-col justify-center items-center relative overflow-hidden transition-all duration-500 group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Waves className="text-cyan-500 mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]" size={56} strokeWidth={1.5} />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 z-10">גובה גלים</span>
            <div className="flex items-baseline gap-2 z-10">
              <span className="text-7xl md:text-8xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{data.waveHeight.toFixed(1)}</span>
              <span className="text-3xl font-bold text-slate-400">מ'</span>
            </div>
            
            {/* Range Bar */}
            {stats && (() => {
              const min = stats.minWaveHeight;
              const max = stats.maxWaveHeight;
              const current = data.waveHeight;
              const pct = max === min ? 50 : Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
              return (
                <div className="w-full mt-8 px-4 z-10">
                  <div className="relative h-2 bg-slate-200/80 rounded-full shadow-inner" dir="ltr">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${pct}%` }} 
                      transition={{ duration: 1.2, ease: "easeOut" }} 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-300 to-cyan-500 rounded-full" 
                    />
                    <motion.div 
                      initial={{ left: 0 }} 
                      animate={{ left: `${pct}%` }} 
                      transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.2 }} 
                      className="absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-white border-[4px] border-cyan-500 rounded-full shadow-md" 
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 text-[11px] font-bold text-slate-500" dir="ltr">
                    <span>מינימום {min.toFixed(1)} מ'</span>
                    <span>מקסימום {max.toFixed(1)} מ'</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* Wind */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="col-span-1 bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col items-center justify-center relative transition-all duration-500 group"
          >
            <div className="relative mb-3">
              <Wind className="text-slate-400 group-hover:text-cyan-500 transition-colors" size={32} strokeWidth={1.5} />
              <Navigation 
                className="absolute -top-2 -right-2 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                size={18} 
                style={{ transform: `rotate(${data.windDirection}deg)` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">רוח ({getWindDirection(data.windDirection)})</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">{data.windSpeed.toFixed(0)}</span>
              <span className="text-sm font-bold text-slate-400">קמ"ש</span>
            </div>

            {/* Range Bar */}
            {stats && (() => {
              const min = stats.minWindSpeed;
              const max = stats.maxWindSpeed;
              const current = data.windSpeed;
              const pct = max === min ? 50 : Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
              return (
                <div className="w-full mt-auto pt-5">
                  <div className="relative h-1.5 bg-slate-200/80 rounded-full shadow-inner" dir="ltr">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-300 to-amber-500 rounded-full" />
                    <motion.div initial={{ left: 0 }} animate={{ left: `${pct}%` }} transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.2 }} className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 bg-white border-[3px] border-amber-500 rounded-full shadow-md z-10" />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] font-bold text-slate-400" dir="ltr">
                    <span>מינימום {min.toFixed(0)}</span>
                    <span>מקסימום {max.toFixed(0)}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* Water Temp */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="col-span-1 bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col items-center justify-center relative transition-all duration-500 group"
          >
            <Thermometer className="text-cyan-500 mb-2 group-hover:text-cyan-600 transition-colors" size={32} strokeWidth={1.5} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">טמפ' מים</span>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-black text-slate-800">{data.waterTemp.toFixed(1)}</span>
              <span className="text-sm font-bold text-slate-400">°C</span>
            </div>
            <div className="bg-slate-100/80 rounded-full px-3 py-1 border border-slate-200 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-slate-600">4/3 מומלץ</span>
            </div>

            {/* Range Bar */}
            {stats && (() => {
              const min = stats.minWaterTemp;
              const max = stats.maxWaterTemp;
              const current = data.waterTemp;
              const pct = max === min ? 50 : Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
              return (
                <div className="w-full mt-auto pt-4">
                  <div className="relative h-1.5 bg-slate-200/80 rounded-full shadow-inner" dir="ltr">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                    <motion.div initial={{ left: 0 }} animate={{ left: `${pct}%` }} transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.2 }} className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 bg-white border-[3px] border-blue-500 rounded-full shadow-md z-10" />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] font-bold text-slate-400" dir="ltr">
                    <span>מינימום {min.toFixed(1)}°</span>
                    <span>מקסימום {max.toFixed(1)}°</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* UV Index */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            className="col-span-2 md:col-span-2 bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col justify-between relative transition-all duration-500 group"
          >
            <div className="flex items-center gap-4 mb-2">
              <Sun className="text-amber-500 group-hover:rotate-90 transition-transform duration-700 drop-shadow-sm" size={36} strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">אינדקס קרינה</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-800">{data.uvIndex.toFixed(1)}</span>
                  <span className={`text-xs font-bold uppercase tracking-tighter px-2 py-0.5 rounded-md bg-white/80 shadow-sm border border-slate-100 ${uv.color}`}>{uv.label}</span>
                </div>
              </div>
            </div>

            {/* Range Bar */}
            {stats && (() => {
              const min = stats.minUvIndex;
              const max = stats.maxUvIndex;
              const current = data.uvIndex;
              const pct = max === min ? 50 : Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
              return (
                <div className="w-full mt-auto pt-3">
                  <div className="relative h-1.5 bg-slate-200/80 rounded-full shadow-inner" dir="ltr">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-300 to-orange-500 rounded-full" />
                    <motion.div initial={{ left: 0 }} animate={{ left: `${pct}%` }} transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.2 }} className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 bg-white border-[3px] border-orange-500 rounded-full shadow-md z-10" />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-slate-500" dir="ltr">
                    <span>מינימום {min.toFixed(1)}</span>
                    <span>מקסימום {max.toFixed(1)}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>
      </div>



      {/* Bottom Grid: Forecast & Live Cam */}
      <div className="grid grid-cols-2 border-t border-slate-200/50 divide-x divide-x-reverse divide-slate-200/50 relative z-10">
        {/* Forecast Tile */}
        <a 
          href="https://gosurf.co.il/forecast/herzliya-marina" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-6 flex flex-col items-center text-center gap-2 hover:bg-cyan-50/50 active:bg-cyan-100/50 transition-all duration-300 group cursor-pointer relative overflow-hidden"
        >
          {/* Subtle Pulse for Mobile Interactivity */}
          <motion.div
            animate={{
              opacity: [0, 0.05, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-cyan-400 pointer-events-none"
          />

          {/* Subtle Hover Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Waves className="text-cyan-500 mb-1 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500 relative z-10" size={28} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none relative z-10">Forecast</span>
          <span className="text-lg font-black text-slate-800 relative z-10" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>תחזית גלים</span>
          
          {/* Interaction Indicator */}
          <div className="absolute bottom-2 w-8 h-0.5 bg-cyan-500/30 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </a>

        {/* Live Cam Tile */}
        <a 
          href="https://beachcam.co.il" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-6 flex flex-col items-center text-center gap-2 hover:bg-amber-50/50 active:bg-amber-100/50 transition-all duration-300 group cursor-pointer relative overflow-hidden"
        >
          {/* Subtle Pulse for Mobile Interactivity */}
          <motion.div
            animate={{
              opacity: [0, 0.05, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute inset-0 bg-amber-400 pointer-events-none"
          />

          {/* Subtle Hover Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Video className="text-amber-500 mb-1 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500 relative z-10" size={28} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none relative z-10">Live Stream</span>
          <span className="text-lg font-black text-slate-800 relative z-10" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>מצלמת חוף</span>
          
          {/* Interaction Indicator */}
          <div className="absolute bottom-2 w-8 h-0.5 bg-amber-500/30 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </a>
      </div>

      <div className="p-4 bg-slate-50/50 border-t border-slate-200/50 flex justify-center relative z-10">
        <a 
          href="https://ims.gov.il/he/coasts" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-slate-400 hover:text-cyan-600 transition-colors flex items-center gap-1 uppercase tracking-widest"
        >
          מקור נתונים: השירות המטאורולוגי הישראלי (IMS) • סנכרון Open-Meteo
        </a>
      </div>
    </motion.div>
  );
};
