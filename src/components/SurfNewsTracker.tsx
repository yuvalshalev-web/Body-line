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
      bg: 'bg-emerald-500/5',
      icon: <Waves className="w-4 h-4 text-[#00AFC2]" />
    },
    Medium: {
      statusColor: 'text-[#121212]', 
      bg: 'bg-[#121212]/5',
      icon: <Wind className="w-4 h-4 text-[#00AFC2]" /> 
    },
    High: {
      statusColor: 'text-rose-700', 
      bg: 'bg-rose-500/5',
      icon: <AlertTriangle className="w-4 h-4 text-[#00AFC2]" /> 
    }
  };

  const config = severityConfig[severity];

  const renderTickerContent = () => (
    <div className="flex items-center shrink-0 px-8 gap-12" dir="rtl">
      {/* Tangible Message Capsule */}
      <div className={`flex items-center gap-4 px-5 py-2 rounded-xl ${config.bg} border border-[#121212]/10 backdrop-blur-md shadow-sm transition-all duration-300`}>
        <div className="p-1.5 rounded-lg bg-white/40 shadow-sm border border-[#121212]/10">
          {config.icon}
        </div>
        <span className={`text-[15px] font-bold tracking-tight text-[#121212]`}>
          {trackerData.content.scrollingText}
        </span>
        {/* Status Indicator Dot */}
        <div className="flex items-center gap-2 ml-2 pl-4 border-l border-[#121212]/10">
          <span className={`w-2 h-2 rounded-full ${severity === 'Low' ? 'bg-emerald-500' : severity === 'High' ? 'bg-rose-500' : 'bg-sky-500'} shadow-sm`} />
          <span className={`text-[11px] font-black uppercase tracking-wider ${config.statusColor}`}>
            {severity === 'Low' ? 'ACTIVE' : severity === 'High' ? 'ALERT' : 'MONITORING'}
          </span>
        </div>
      </div>
      
      {marineForecast && (
        <div className="flex items-center gap-4 px-5 py-2 rounded-xl bg-[#121212]/5 border border-[#121212]/10 backdrop-blur-md shadow-sm transition-all duration-300">
          <div className="p-1.5 rounded-lg bg-white/40 shadow-sm border border-[#121212]/10">
            <Info className="w-4 h-4 text-[#00AFC2]" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[#121212]">
            {marineForecast}
          </span>
        </div>
      )}

      {/* Tangible Meta Data */}
      <div className="flex items-center gap-3 px-4 py-1.5 rounded-lg bg-white/20 border border-[#121212]/10 shadow-sm backdrop-blur-md">
        <Clock className="w-3.5 h-3.5 text-[#00AFC2]" />
        <span className="text-[11px] font-mono font-bold text-[#121212] uppercase tracking-widest">
          SYNC: {trackerData.content.lastFetch}
        </span>
      </div>

      {/* Separator Element */}
      <div className="flex gap-1.5 opacity-60">
        <div className="h-1.5 w-1.5 rounded-full bg-[#121212]" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#00AFC2]" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#31aac1]" />
      </div>
      
      <span className="text-[10px] font-black text-[#121212]/40 uppercase tracking-[0.3em]">
        Ocean Pulse Engine v3.0
      </span>
    </div>
  );

  return (
    <div className="w-full h-16 bg-white/40 backdrop-blur-[24px] border-y border-[#121212]/10 relative z-50 select-none overflow-hidden flex items-center shadow-sm" dir="rtl">
      
      {/* Fixed Label - Right Side (RTL) - Improved with Gradient and Glass Border */}
      <div className="h-full px-6 flex items-center gap-4 bg-gradient-to-l from-[#00AFC2]/10 to-transparent border-l border-[#121212]/10 z-20 relative shrink-0 backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-white/80 border border-[#121212]/10 flex items-center justify-center shadow-md transform rotate-3">
            <Radio className="w-5 h-5 text-[#3dbbd3] -rotate-3" />
          </div>
          <span className="absolute w-3 h-3 bg-emerald-500 rounded-full -top-1 -right-1 border-2 border-white shadow-lg animate-pulse" />
        </div>
        
        <div className="flex flex-col leading-none justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-[#FF2D60]" strokeWidth={3} />
            <span className="text-[10px] font-black text-[#121212] uppercase tracking-[0.2em] opacity-60">LIVE FEED</span>
          </div>
          <span className="text-sm font-black text-[#121212] whitespace-nowrap tracking-tighter">SURF REPORT</span>
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
