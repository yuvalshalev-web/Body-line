import React, { useMemo, useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { analyzeIsraelSurfConditions } from '../utils/surfAnalysis';
import { parseDate } from '../utils/dateUtils';
import { Waves, Wind, Clock, Info, Cake, Thermometer, Sun, Activity } from 'lucide-react';

const getWindDirCode = (deg: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(deg / 45) % 8];
};

export const SurfNewsTracker: React.FC = () => {
  const { coastalWeather, seaStats, members } = useData();
  const [marineForecast, setMarineForecast] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarineForecast = async () => {
      try {
        const response = await fetch('/api/ims/marine-forecast');
        if (response.ok) {
          const text = await response.text();
          if (text.includes("<title>Starting Server...</title>")) {
            console.warn("Server is starting up, retrying marine forecast later...");
            return;
          }
          try {
            const data = JSON.parse(text);
            if (data.forecast) {
              setMarineForecast(data.forecast);
            }
          } catch (e) {
            console.warn("Marine forecast API returned non-JSON response");
          }
        }
      } catch (err) {
        console.warn("Failed to fetch marine forecast:", err);
      }
    };
    
    fetchMarineForecast();
    const interval = setInterval(fetchMarineForecast, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(interval);
  }, []);

  // Filter members who have a birthday today
  const birthdayMembers = useMemo(() => {
    if (!members || members.length === 0) return [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    return members.filter(m => {
      if (m.isActive === false) return false;
      const bdayStr = m.birthday || (m as any).birthDate;
      if (!bdayStr) return false;
      const d = parseDate(bdayStr);
      if (!d) return false;
      return d.getMonth() === currentMonth && d.getDate() === currentDate;
    });
  }, [members]);

  const trackerData = useMemo(() => {
    if (!coastalWeather) {
      return {
        trackerId: "il-surf-live-01",
        refreshRate: "600s",
        content: {
          scrollingText: "מערכות הניטור בכיול... טוען נתוני אוקיינוס בזמן אמת",
          severity: 'Low' as const,
          lastFetch: '--:--'
        }
      };
    }

    const analysisInput = {
      waveHeight: Number(coastalWeather?.waveHeight ?? 0) * 100,
      windSpeed: Number(coastalWeather?.windSpeed ?? 0),
      windDir: coastalWeather?.windDirection !== undefined ? getWindDirCode(coastalWeather.windDirection) : 'W',
      period: Number(coastalWeather?.wavePeriod || seaStats?.period || 6),
      lastRain: false
    };

    return analyzeIsraelSurfConditions(analysisInput);
  }, [coastalWeather, seaStats]);

  const severity = trackerData.content.severity;

  // Extract structured telemetry metrics
  const waveCm = coastalWeather ? (coastalWeather.waveHeight === 0 ? 0 : Math.round(coastalWeather.waveHeight * 100)) : null;
  const wavePeriod = coastalWeather?.wavePeriod ? coastalWeather.wavePeriod.toFixed(1) : null;
  const windKts = coastalWeather?.windSpeed !== undefined ? Math.round(coastalWeather.windSpeed) : null;
  const windDirStr = coastalWeather?.windDirection !== undefined ? getWindDirCode(coastalWeather.windDirection) : null;
  const waterTemp = coastalWeather?.waterTemp !== undefined ? coastalWeather.waterTemp.toFixed(1) : null;
  const uvIndex = coastalWeather?.uvIndex !== undefined ? Math.round(coastalWeather.uvIndex) : null;

  const renderTickerContent = () => (
    <div className="flex items-center shrink-0 px-3 gap-3" dir="rtl">
      
      {/* 🎂 Birthday Tracker Chip */}
      {birthdayMembers.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-semibold shrink-0 shadow-2xs">
          <Cake className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-bounce" />
          <span className="text-[10px] font-mono uppercase font-black text-amber-700 tracking-wider">יום הולדת:</span>
          <span className="font-bold text-amber-950">
            {birthdayMembers.map(m => `${m.firstName} ${m.lastName}`).join(', ')} 🎉
          </span>
        </div>
      )}

      {/* 🌊 Wave Height Metric Chip */}
      {waveCm !== null && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs text-xs font-medium shrink-0 hover:border-sky-300 transition-colors">
          <Waves className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span className="text-[10px] font-mono uppercase font-black text-slate-400">גובה:</span>
          <span className="font-mono font-bold text-slate-800">{waveCm} cm</span>
        </div>
      )}

      {/* ⏱️ Wave Period Metric Chip */}
      {wavePeriod && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs text-xs font-medium shrink-0 hover:border-indigo-300 transition-colors">
          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="text-[10px] font-mono uppercase font-black text-slate-400">מחזור:</span>
          <span className="font-mono font-bold text-slate-800">{wavePeriod}s</span>
        </div>
      )}

      {/* 💨 Wind Metric Chip */}
      {windKts !== null && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs text-xs font-medium shrink-0 hover:border-teal-300 transition-colors">
          <Wind className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          <span className="text-[10px] font-mono uppercase font-black text-slate-400">רוח:</span>
          <span className="font-mono font-bold text-slate-800">{windKts} kts {windDirStr}</span>
        </div>
      )}

      {/* 🌡️ Water Temp Metric Chip */}
      {waterTemp && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs text-xs font-medium shrink-0 hover:border-cyan-300 transition-colors">
          <Thermometer className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="text-[10px] font-mono uppercase font-black text-slate-400">מים:</span>
          <span className="font-mono font-bold text-slate-800">{waterTemp}°C</span>
        </div>
      )}

      {/* ☀️ UV Index Metric Chip */}
      {uvIndex !== null && (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200/80 shadow-2xs text-xs font-medium shrink-0 hover:border-amber-300 transition-colors">
          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[10px] font-mono uppercase font-black text-slate-400">קרינה:</span>
          <span className="font-mono font-bold text-slate-800">UV {uvIndex}</span>
        </div>
      )}

      {/* 📢 Surf Analysis Chip */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 text-white shadow-2xs text-xs shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${severity === 'Low' ? 'bg-emerald-400' : severity === 'High' ? 'bg-rose-400' : 'bg-amber-400'} animate-pulse`} />
        <span className="text-[10px] font-mono uppercase font-black text-slate-400">סטטוס:</span>
        <span className="font-semibold text-slate-100 tracking-tight">{trackerData.content.scrollingText}</span>
      </div>

      {/* 📡 Marine Forecast Chip */}
      {marineForecast && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-sky-50 border border-sky-100 text-xs shrink-0">
          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="text-[10px] font-mono uppercase font-black text-sky-600">תחזית ימית:</span>
          <span className="text-slate-700 font-medium">{marineForecast}</span>
        </div>
      )}

      {/* 🟢 Sync Time Chip */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/60 text-[11px] font-mono text-slate-500 shrink-0">
        <Activity className="w-3 h-3 text-slate-400" />
        <span>SYNC {trackerData.content.lastFetch}</span>
      </div>

      {/* Separator Divider */}
      <div className="h-4 w-[1px] bg-slate-200/80 mx-2 shrink-0" />
    </div>
  );

  return (
    <div className="w-full h-11 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 relative z-40 select-none overflow-hidden flex items-center shadow-xs" dir="rtl">
      
      {/* Fixed Live Tracker Badge - Right Side */}
      <div className="h-full px-3.5 flex items-center gap-2 bg-slate-900 text-white z-20 relative shrink-0 shadow-sm border-l border-slate-800">
        <div className="relative flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/40 animate-ping" />
        </div>
        <span className="text-[11px] font-mono font-black tracking-widest uppercase text-slate-100">
          LIVE TRACKER
        </span>
      </div>

      {/* Continuous Infinite Marquee Loop */}
      <div className="flex-1 h-full relative overflow-hidden flex items-center" style={{ maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)' }}>
        <div className="flex whitespace-nowrap animate-marquee-loop hover:[animation-play-state:paused]" dir="ltr">
          <div className="flex shrink-0">
            {renderTickerContent()}
            {renderTickerContent()}
            {renderTickerContent()}
            {renderTickerContent()}
          </div>
          <div className="flex shrink-0">
            {renderTickerContent()}
            {renderTickerContent()}
            {renderTickerContent()}
            {renderTickerContent()}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-loop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-loop {
          animation: marquee-loop 60s linear infinite;
          display: flex;
          width: max-content;
        }
      `}} />
    </div>
  );
};


