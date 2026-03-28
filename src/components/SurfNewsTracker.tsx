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
        console.error("Failed to fetch marine forecast:", err);
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
      statusColor: 'text-[#2D6A4F]', // Deep Sea Green (Active)
      bg: 'bg-[#2D6A4F]/5',
      icon: <Waves className="w-4 h-4 text-[#0071a1]" /> // Ocean 2
    },
    Medium: {
      statusColor: 'text-[#00426a]', // Ocean 1 (Dark Anchor)
      bg: 'bg-[#0071a1]/5',
      icon: <Wind className="w-4 h-4 text-[#0071a1]" /> // Ocean 2
    },
    High: {
      statusColor: 'text-[#BC4749]', // Sunset Red (Paused)
      bg: 'bg-[#BC4749]/5',
      icon: <AlertTriangle className="w-4 h-4 text-[#0071a1]" /> // Ocean 2
    }
  };

  const config = severityConfig[severity];

  const renderTickerContent = () => (
    <div className="flex items-center shrink-0 px-8 gap-12" dir="rtl">
      {/* Tangible Message Capsule */}
      <div className={`flex items-center gap-4 px-5 py-2 rounded-xl ${config.bg} border-t border-l border-[#ffffff]/80 border-b border-[#00426a]/10 border-r border-[#00426a]/10 backdrop-blur-md shadow-sm transition-all duration-300`}>
        <div className="p-1.5 rounded-lg bg-white/40 shadow-sm border-t border-l border-white/80 border-b border-[#00426a]/10 border-r border-[#00426a]/10">
          {config.icon}
        </div>
        <span className={`text-[15px] font-bold tracking-tight text-[#00426a]`}>
          {trackerData.content.scrollingText}
        </span>
        {/* Status Indicator Dot */}
        <div className="flex items-center gap-2 ml-2 pl-4 border-l border-[#00426a]/10">
          <span className={`w-2 h-2 rounded-full ${severity === 'Low' ? 'bg-[#2D6A4F]' : severity === 'High' ? 'bg-[#BC4749]' : 'bg-[#0071a1]'} shadow-sm`} />
          <span className={`text-[11px] font-black uppercase tracking-wider ${config.statusColor}`}>
            {severity === 'Low' ? 'ACTIVE' : severity === 'High' ? 'ALERT' : 'MONITORING'}
          </span>
        </div>
      </div>
      
      {marineForecast && (
        <div className="flex items-center gap-4 px-5 py-2 rounded-xl bg-[#00426a]/5 border-t border-l border-[#ffffff]/80 border-b border-[#00426a]/10 border-r border-[#00426a]/10 backdrop-blur-md shadow-sm transition-all duration-300">
          <div className="p-1.5 rounded-lg bg-white/40 shadow-sm border-t border-l border-white/80 border-b border-[#00426a]/10 border-r border-[#00426a]/10">
            <Info className="w-4 h-4 text-[#0071a1]" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[#00426a]">
            {marineForecast}
          </span>
        </div>
      )}

      {/* Tangible Meta Data */}
      <div className="flex items-center gap-3 px-4 py-1.5 rounded-lg bg-[#f0f8ff]/40 border-t border-l border-[#ffffff]/80 border-b border-[#00426a]/10 border-r border-[#00426a]/10 shadow-sm backdrop-blur-md">
        <Clock className="w-3.5 h-3.5 text-[#0071a1]" />
        <span className="text-[11px] font-mono font-bold text-[#00426a] uppercase tracking-widest">
          SYNC: {trackerData.content.lastFetch}
        </span>
      </div>

      {/* Separator Element */}
      <div className="flex gap-1.5 opacity-60">
        <div className="h-1.5 w-1.5 rounded-full bg-[#00426a]" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#0071a1]" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#31aac1]" />
      </div>
      
      <span className="text-[10px] font-black text-[#00426a]/40 uppercase tracking-[0.3em]">
        Ocean Pulse Engine v3.0
      </span>
    </div>
  );

  return (
    <div className="w-full h-16 bg-[#f0f8ff]/10 backdrop-blur-[20px] border-t border-l border-[#ffffff]/80 border-b border-[#00426a]/10 border-r border-[#00426a]/10 relative z-50 select-none overflow-hidden flex items-center shadow-sm" dir="rtl">
      
      {/* Fixed Label - Right Side (RTL) */}
      <div className="h-full px-5 flex items-center gap-3 bg-[#f0f8ff]/40 border-l border-[#00426a]/10 z-20 relative shrink-0 backdrop-blur-md shadow-[4px_0_24px_rgba(0,66,106,0.05)]">
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 rounded-xl bg-white/60 border-t border-l border-white/90 border-b border-[#00426a]/10 border-r border-[#00426a]/10 flex items-center justify-center shadow-sm">
            <Radio className="w-5 h-5 text-[#0071a1]" />
          </div>
          <span className="absolute w-2.5 h-2.5 bg-[#2D6A4F] rounded-full -top-0.5 -right-0.5 border-2 border-white shadow-sm animate-pulse" />
        </div>
        
        <div className="flex flex-col leading-none justify-center">
          <div className="flex items-center gap-1 mb-0.5">
            <Zap className="w-3 h-3 text-[#0071a1]" />
            <span className="text-[10px] font-black text-[#00426a] uppercase tracking-[0.15em]">LIVE</span>
          </div>
          <span className="text-[12px] font-bold text-[#00426a] whitespace-nowrap tracking-tight">SURF MONITOR</span>
        </div>
      </div>

      {/* Scrolling Container with Gradient Masks for smooth fade in/out */}
      <div className="flex-1 h-full relative overflow-hidden flex items-center" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
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
