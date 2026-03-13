
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
  Video
} from 'lucide-react';

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

export const CoastalDashboard: React.FC = () => {
  const [data, setData] = useState<CoastalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/coastal-weather');
        if (!res.ok) throw new Error('Failed to fetch coastal data');
        const json = await res.json();
        setData(json);
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
      className="home-glass-card overflow-hidden relative"
      dir="rtl"
    >
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
        className="absolute inset-0 bg-gradient-to-br from-[var(--surfer-cyan)]/10 to-transparent pointer-events-none"
      />

      <div className="p-4 border-b border-black/10 flex items-center justify-between bg-white/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--surfer-cyan)]/20 rounded-xl relative overflow-hidden">
            <motion.div 
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-[var(--surfer-cyan)] blur-md"
            />
            <Waves className="text-[var(--surfer-cyan)] relative z-10" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#000000] tracking-tight">מצב הים - {data.location}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Marine Observations</p>
          </div>
        </div>
        <div className="text-left">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">עודכן</span>
          <span className="text-sm font-black text-[#000000]">{new Date(data.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-black/10 relative z-10">
        {/* Wave Height */}
        <div className="p-5 flex flex-col items-center text-center gap-2 hover:bg-black/5 transition-colors group">
          <Waves className="text-blue-500 mb-1 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">גובה גלים</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#000000]">{data.waveHeight.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-500">מ'</span>
          </div>
        </div>

        {/* Water Temp */}
        <div className="p-5 flex flex-col items-center text-center gap-2 hover:bg-black/5 transition-colors group">
          <Thermometer className="text-emerald-500 mb-1 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">טמפ' מים</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#000000]">{data.waterTemp.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-500">°C</span>
          </div>
        </div>

        {/* Wind */}
        <div className="p-5 flex flex-col items-center text-center gap-2 hover:bg-black/5 transition-colors group">
          <div className="relative mb-1">
            <Wind className="text-slate-400 group-hover:scale-110 transition-transform" size={24} />
            <Navigation 
              className="absolute -top-1 -right-1 text-[var(--surfer-yellow)]" 
              size={12} 
              style={{ transform: `rotate(${data.windDirection}deg)` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">רוח ({getWindDirection(data.windDirection)})</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#000000]">{data.windSpeed.toFixed(0)}</span>
            <span className="text-xs font-bold text-slate-500">קמ"ש</span>
          </div>
        </div>

        {/* UV Index */}
        <div className="p-5 flex flex-col items-center text-center gap-2 hover:bg-black/5 transition-colors group">
          <Sun className="text-yellow-500 mb-1 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">אינדקס קרינה</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#000000]">{data.uvIndex.toFixed(1)}</span>
            <span className={`text-[9px] font-bold uppercase tracking-tighter ${uv.color}`}>{uv.label}</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Forecast & Live Cam */}
      <div className="grid grid-cols-2 border-t border-black/10 divide-x divide-x-reverse divide-black/10 relative z-10">
        {/* Forecast Tile */}
        <a 
          href="https://gosurf.co.il/forecast/herzliya-marina" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-6 flex flex-col items-center text-center gap-2 hover:bg-[var(--surfer-cyan)]/5 active:bg-[var(--surfer-cyan)]/10 transition-all duration-300 group cursor-pointer relative overflow-hidden"
        >
          {/* Subtle Pulse for Mobile Interactivity */}
          <motion.div
            animate={{
              opacity: [0, 0.08, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-[var(--surfer-cyan)] pointer-events-none"
          />

          {/* Subtle Hover Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Waves className="text-[var(--surfer-cyan)] mb-1 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500 relative z-10" size={28} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none relative z-10">Forecast</span>
          <span className="text-lg font-black text-[#000000] relative z-10" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>תחזית גלים</span>
          
          {/* Interaction Indicator */}
          <div className="absolute bottom-2 w-8 h-0.5 bg-[var(--surfer-cyan)]/30 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </a>

        {/* Live Cam Tile */}
        <a 
          href="https://beachcam.co.il" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-6 flex flex-col items-center text-center gap-2 hover:bg-[var(--surfer-yellow)]/5 active:bg-[var(--surfer-yellow)]/10 transition-all duration-300 group cursor-pointer relative overflow-hidden"
        >
          {/* Subtle Pulse for Mobile Interactivity */}
          <motion.div
            animate={{
              opacity: [0, 0.08, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute inset-0 bg-[var(--surfer-yellow)] pointer-events-none"
          />

          {/* Subtle Hover Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Video className="text-[var(--surfer-yellow)] mb-1 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500 relative z-10" size={28} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none relative z-10">Live Stream</span>
          <span className="text-lg font-black text-[#000000] relative z-10" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>מצלמת חוף</span>
          
          {/* Interaction Indicator */}
          <div className="absolute bottom-2 w-8 h-0.5 bg-[var(--surfer-yellow)]/30 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </a>
      </div>

      <div className="p-4 bg-black/5 border-t border-black/10 flex justify-center relative z-10">
        <a 
          href="https://ims.gov.il/he/coasts" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-slate-500 hover:text-[var(--surfer-cyan)] transition-colors flex items-center gap-1 uppercase tracking-widest"
        >
          מקור נתונים: השירות המטאורולוגי הישראלי (IMS) • סנכרון Open-Meteo
        </a>
      </div>
    </motion.div>
  );
};
