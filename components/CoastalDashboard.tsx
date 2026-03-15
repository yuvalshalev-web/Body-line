
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Waves, 
  Thermometer, 
  Navigation, 
  Loader2,
  AlertTriangle,
  Video,
  TrendingUp,
  TrendingDown,
  Snowflake,
  Crown,
  Feather,
  Wind,
  Moon,
  Sun,
  Droplets,
  ShieldAlert,
  Zap
} from 'lucide-react';

import { WetsuitIcon } from './WetsuitIcon';
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
  const getAdvice = (uv: number) => {
    if (uv <= 2) return { 
      text: "הגנה מינימלית. אין חשש להימצא בשמש.", 
      color: "text-emerald-700", 
      stroke: "stroke-emerald-700", 
      bg: "bg-emerald-500",
      icon: <Sun className="animate-spin-slow w-12 h-12 text-emerald-600" />
    };
    if (uv <= 5) return { 
      text: "זמן להתמרח. יש להשתדל להימצא בצל בשעות הצהריים, לבוש מלא ככל הניתן, שימוש בקרם הגנה, משקפי שמש וכובע.", 
      color: "text-yellow-700", 
      stroke: "stroke-yellow-700", 
      bg: "bg-yellow-500",
      icon: <Droplets className="animate-sparkle w-12 h-12 text-yellow-600" />
    };
    if (uv <= 7) return { 
      text: "חובה כובע ולייקרה. יש להשתדל להימצא בצל בשעות הצהריים, לבוש מלא ככל הניתן, שימוש בקרם הגנה, משקפי שמש וכובע.", 
      color: "text-orange-700", 
      stroke: "stroke-orange-700", 
      bg: "bg-orange-500",
      icon: <AlertTriangle className="animate-hat-pulse w-12 h-12 text-orange-600" />
    };
    if (uv <= 10) return { 
      text: "חובה הגנה מקסימלית. יש צורך בהתגוננות מיוחדת. אין להימצא כלל בשמש ללא לבוש מלא ככל הניתן, שימוש בקרם הגנה, משקפי שמש וכובע. להימנע משהיה בחוץ בשעות הצהריים.", 
      color: "text-red-700", 
      stroke: "stroke-red-700", 
      bg: "bg-red-600",
      icon: <AlertTriangle className="animate-pulse w-12 h-12 text-red-600" />
    };
    return { 
      text: "סכנת כוויה מיידית. יש צורך בהתגוננות מיוחדת. אין להימצא כלל בשמש ללא לבוש מלא ככל הניתן, שימוש בקרם הגנה, משקפי שמש וכובע. להימנע משהיה בחוץ בשעות הצהריים.", 
      color: "text-purple-700", 
      stroke: "stroke-purple-700", 
      bg: "bg-purple-600",
      icon: <ShieldAlert className="animate-pulse w-12 h-12 text-purple-600" />
    };
  };

  const advice = data ? getAdvice(data.uvIndex) : null;
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
        <div className="grid grid-cols-2 gap-4">
          {/* Wave Height */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="col-span-1 bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col items-center justify-between relative transition-all duration-500 group"
          >
            <div className="flex flex-col items-center gap-1 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">גובה גלים</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                {data.waveHeight.toFixed(1)} <span className="text-xl font-bold text-slate-400">m</span>
              </span>
            </div>

            {/* Annual Axis Gradient */}
            <div className="relative w-full h-12 flex items-center mt-2" dir="ltr">
              <div className="absolute w-full h-4 bg-gradient-to-r from-sky-200 via-cyan-500 to-blue-950 rounded-full" />
              
              {/* Markers */}
              <div className="absolute w-full flex justify-between -top-8 text-[10px] font-bold text-slate-500">
                <div className="flex flex-col items-center gap-1">
                  <Waves className="w-5 h-5 text-sky-300" />
                  <span>{stats?.minWaveHeight.toFixed(1)}m</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span>{stats?.maxWaveHeight.toFixed(1)}m</span>
                </div>
              </div>

              {/* Tracker */}
              {stats && (() => {
                const min = stats.minWaveHeight;
                const max = stats.maxWaveHeight;
                const current = data.waveHeight;
                const progress = max === min ? 50 : Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
                return (
                  <motion.div 
                    className="absolute w-6 h-6 bg-white rounded-full border-4 border-white shadow-lg"
                    style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                    initial={{ left: '0%' }}
                    animate={{ left: `${progress}%` }}
                  />
                );
              })()}
            </div>
          </motion.div>

          {/* Wind */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="col-span-1 bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col items-center justify-between relative transition-all duration-500 group"
          >
            <div className="flex flex-col items-center gap-1 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">מהירות רוח</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                {data.windSpeed.toFixed(0)} <span className="text-xl font-bold text-slate-400">kts</span>
              </span>
            </div>

            {/* Annual Axis Gradient */}
            <div className="relative w-full h-12 flex items-center mt-2" dir="ltr">
              <div className="absolute w-full h-4 rounded-full" style={{ background: 'linear-gradient(to right, #bae6fd, #4ade80, #facc15, #ef4444, #7e22ce)' }} />
              
              {/* Markers */}
              <div className="absolute w-full flex justify-between -top-8 text-[10px] font-bold text-slate-500">
                <div className="flex flex-col items-center gap-1">
                  <Feather className="w-5 h-5 text-sky-300" />
                  <span>{stats?.minWindSpeed.toFixed(0)}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Wind className="w-5 h-5 text-purple-900" />
                    <Crown className="w-3 h-3 text-amber-500 absolute -top-2 -right-2" />
                  </div>
                  <span>{stats?.maxWindSpeed.toFixed(0)}</span>
                </div>
              </div>

              {/* Tracker */}
              {stats && (() => {
                const min = stats.minWindSpeed;
                const max = stats.maxWindSpeed;
                const current = data.windSpeed;
                const progress = max === min ? 50 : Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
                const isStrong = current > 25;
                return (
                  <motion.div 
                    className="absolute w-6 h-6 bg-white rounded-full border-4 border-white shadow-lg"
                    style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                    initial={{ left: '0%' }}
                    animate={{ left: `${progress}%` }}
                    whileHover={isStrong ? { x: [-2, 2, -2, 2, 0] } : {}}
                    transition={isStrong ? { repeat: Infinity, duration: 0.1 } : {}}
                  />
                );
              })()}
            </div>
          </motion.div>

          {/* Water Temp */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="col-span-1 bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col items-center justify-between relative transition-all duration-500 group"
          >
            <div className="flex flex-col items-center gap-1 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">טמפ' מים</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                {data.waterTemp.toFixed(1)} <span className="text-xl font-bold text-slate-400">°C</span>
              </span>
            </div>

            {/* Annual Axis Gradient */}
            <div className="relative w-full h-12 flex items-center mt-2" dir="ltr">
              <div className="absolute w-full h-4 bg-gradient-to-l from-amber-400 via-teal-400 to-blue-900 rounded-full" />
              
              {/* Markers */}
              <div className="absolute w-full flex justify-between -top-8 text-[10px] font-bold text-slate-500">
                <div className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <Crown className="w-3 h-3 text-amber-600 absolute -top-2 -right-2" />
                  </div>
                  <span>{stats?.maxWaterTemp.toFixed(1)}°</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Snowflake className="w-5 h-5 text-blue-500" />
                  <span>{stats?.minWaterTemp.toFixed(1)}°</span>
                </div>
              </div>

              {/* Tracker */}
              {stats && (() => {
                const min = stats.minWaterTemp;
                const max = stats.maxWaterTemp;
                const current = data.waterTemp;
                const progress = max === min ? 50 : Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
                return (
                  <motion.div 
                    className="absolute w-6 h-6 bg-white rounded-full border-4 border-white shadow-lg"
                    style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                    initial={{ left: '0%' }}
                    animate={{ left: `${progress}%` }}
                  />
                );
              })()}
            </div>
            
            {/* Wetsuit Recommendation */}
            {(() => {
              const waterTemp = data.waterTemp;
              let label = 'חליפה מלאה';
              let type: 'full' | 'shorty' | 'lycra' = 'full';
              
              if (waterTemp < 16) { label = 'חליפה מלאה (4/3mm)'; type = 'full'; }
              else if (waterTemp <= 19) { label = 'חליפה מלאה (4/3mm)'; type = 'full'; }
              else if (waterTemp <= 23) { label = 'חליפה מלאה (3/2mm)'; type = 'full'; }
              else if (waterTemp <= 27) { label = 'שורטי (Shorty 2mm)'; type = 'shorty'; }
              else { label = 'לייקרה קלה'; type = 'lycra'; }
              
              return (
                <div className="mt-4 flex items-center gap-2">
                  <WetsuitIcon type={type} className="w-8 h-8 text-slate-800" />
                  <span className="text-xs font-bold text-slate-800">{label}</span>
                </div>
              );
            })()}
          </motion.div>

          {/* UV Index */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="col-span-1 bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-3xl p-5 flex flex-col items-center justify-center relative transition-all duration-500 group"
          >
            <div className="flex flex-col items-center gap-1 mb-4">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                {data.uvIndex.toFixed(1)}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">אינדקס קרינה בזמן אמת</span>
            </div>
            {advice && (
              <div className="flex items-center gap-2 text-center">
                <div className="p-2 bg-slate-100 rounded-xl">
                  {advice.icon}
                </div>
                <p className={`text-xs font-bold ${advice.color}`}>{advice.text}</p>
              </div>
            )}
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
