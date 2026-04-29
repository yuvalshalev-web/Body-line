import React, { useMemo, useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { analyzeIsraelSurfConditions } from '../utils/surfAnalysis';
import { Radio, Waves, Wind, Clock, AlertTriangle, Zap, Info } from 'lucide-react';

const getWindDirCode = (deg: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(deg / 45) % 8];
};

export const SurfNewsTracker: React.FC = () => {
  const { coastalWeather, seaStats } = useData();
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
      waveHeight: Number(coastalWeather?.waveHeight || 0) * 100,
      windSpeed: Number(coastalWeather?.windSpeed || 0),
      windDir: coastalWeather?.windDirection !== undefined ? getWindDirCode(coastalWeather.windDirection) : 'W',
      period: Number(coastalWeather?.wavePeriod || seaStats?.period || 6),
      lastRain: false
    };

    return analyzeIsraelSurfConditions(analysisInput);
  }, [coastalWeather, seaStats]);

  const severity = trackerData.content.severity;
  
  const severityConfig = {
    Low: {
      statusColor: 'text-emerald-700', 
      bg: 'bg-emerald-50/80',
      icon: <Waves className="w-4 h-4 text-sky-500" />
    },
    Medium: {
      statusColor: 'text-slate-800', 
      bg: 'bg-white/80',
      icon: <Wind className="w-4 h-4 text-sky-500" /> 
    },
    High: {
      statusColor: 'text-rose-700', 
      bg: 'bg-rose-50/80',
      icon: <AlertTriangle className="w-4 h-4 text-sky-500" /> 
    }
  };

  const config = severityConfig[severity];

  const renderTickerContent = () => (
    <div className="flex items-center shrink-0 px-8 gap-12" dir="rtl">
      {/* Tangible Message Capsule */}
      <div className={`flex items-center gap-4 px-5 py-2 rounded-2xl ${config.bg} border border-white shadow-sm backdrop-blur-md transition-all duration-300`}>
        <div className="p-1.5 rounded-lg bg-white shadow-inner border border-slate-100">
          {config.icon}
        </div>
        <span className={`text-[15px] font-black tracking-tight text-slate-800`}>
          {trackerData.content.scrollingText}
        </span>
        {/* Status Indicator Dot */}
        <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-200">
          <span className={`w-2 h-2 rounded-full ${severity === 'Low' ? 'bg-emerald-500' : severity === 'High' ? 'bg-rose-500' : 'bg-sky-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
          <span className={`text-[11px] font-black uppercase tracking-wider ${config.statusColor}`}>
            {severity === 'Low' ? 'ACTIVE' : severity === 'High' ? 'ALERT' : 'MONITORING'}
          </span>
        </div>
      </div>
      
      {marineForecast && (
        <div className="flex items-center gap-4 px-5 py-2 rounded-xl bg-white/60 border border-white backdrop-blur-md shadow-sm transition-all duration-300">
          <div className="p-1.5 rounded-lg bg-white shadow-inner border border-slate-100">
            <Info className="w-4 h-4 text-sky-500" />
          </div>
          <span className="text-[15px] font-black tracking-tight text-slate-700">
            {marineForecast}
          </span>
        </div>
      )}

      {/* Tangible Meta Data */}
      <div className="flex items-center gap-3 px-4 py-1.5 rounded-lg bg-white/40 border border-white shadow-inner backdrop-blur-sm">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          SYNC: {trackerData.content.lastFetch}
        </span>
      </div>

      {/* Separator Element */}
      <div className="flex gap-1.5 opacity-30">
        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        <div className="h-1.5 w-1.5 rounded-full bg-sky-300" />
        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      </div>
      
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
        BodyLine Pulse Engine v4.0
      </span>
    </div>
  );

  return (
    <div className="w-full h-16 bg-[#FDFDFC]/80 backdrop-blur-[24px] border-y border-slate-200/60 relative z-50 select-none overflow-hidden flex items-center shadow-sm" dir="rtl">
      
      {/* Fixed Label - Right Side (RTL) - Improved with Gradient and Glass Border */}
      <div className="h-full px-6 flex items-center gap-4 bg-gradient-to-l from-sky-50 to-transparent border-l border-slate-100 z-20 relative shrink-0 backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-md transform rotate-3">
            <Radio className="w-5 h-5 text-sky-500 -rotate-3" />
          </div>
          <span className="absolute w-3 h-3 bg-emerald-500 rounded-full -top-1 -right-1 border-2 border-white shadow-lg animate-pulse" />
        </div>
        
        <div className="flex flex-col leading-none justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-rose-500" strokeWidth={3} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">LIVE FEED</span>
          </div>
          <span className="text-sm font-black text-slate-800 whitespace-nowrap tracking-tighter uppercase">REPORT</span>
        </div>
      </div>

      {/* Scrolling Container with Advanced Masks */}
      <div className="flex-1 h-full relative overflow-hidden flex items-center" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
        <div className="flex whitespace-nowrap animate-marquee-loop hover:[animation-play-state:paused]" dir="ltr">
          <div className="flex shrink-0">
            {renderTickerContent()}
            {renderTickerContent()}
          </div>
          <div className="flex shrink-0">
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
