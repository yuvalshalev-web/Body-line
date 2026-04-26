import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Waves, 
  Thermometer, 
  Navigation, 
  Loader2,
  Wind,
  Sun,
  Activity,
  Gauge,
  ChevronRight,
  ChevronLeft,
  Calendar,
  MapPin,
  Clock,
  Video
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const surfSpots = [
  { id: 'haifa-bat-galim', name: 'חיפה - בת גלים', lat: 32.83, lon: 34.98, imsId: "26", cameraUrl: "https://beachcam.co.il/batgalim.html" },
  { id: 'haifa-dado', name: 'חיפה - דדו', lat: 32.79, lon: 34.95, imsId: "26", cameraUrl: "https://beachcam.co.il/meridian.html" },
  { id: 'haifa-zvulun', name: 'חיפה - זבולון', lat: 32.82, lon: 34.97, imsId: "26", cameraUrl: "https://beachcam.co.il/krayot.html" },
  { id: 'shavei-tzion', name: 'שבי ציון / נהריה', lat: 32.97, lon: 35.08, imsId: "343" },
  { id: 'michmoret', name: 'מכמורת / מכון ימי', lat: 32.40, lon: 34.86, imsId: "46" },
  { id: 'netanya-kontiki', name: 'נתניה - קונטיקי', lat: 32.33, lon: 34.84, imsId: "46", cameraUrl: "https://beachcam.co.il/kontiki.html" },
  { id: 'herzliya-zvulun', name: 'הרצליה - זבולון', lat: 32.17, lon: 34.79, imsId: "178", cameraUrl: "https://beachcam.co.il/zvulun.html" },
  { id: 'herzliya-marina', name: 'מרינה הרצליה', lat: 32.16, lon: 34.79, imsId: "178", cameraUrl: "https://beachcam.co.il/marina.html" },
  { id: 'tel-aviv-tel-baruch', name: 'ת"א - תל ברוך', lat: 32.12, lon: 34.78, imsId: "178" },
  { id: 'tel-aviv-hilton', name: 'ת"א - הילטון', lat: 32.08, lon: 34.76, imsId: "178", cameraUrl: "https://beachcam.co.il/yamit.html" },
  { id: 'tel-aviv-gordon', name: 'ת"א - גורדון', lat: 32.08, lon: 34.76, imsId: "178" },
  { id: 'tel-aviv-dolfinarium', name: 'ת"א - דולפינריום', lat: 32.06, lon: 34.76, imsId: "178", cameraUrl: "https://beachcam.co.il/dolfinarium.html" },
  { id: 'tel-aviv-maravi', name: 'ת"א - מערבי (יפו)', lat: 32.05, lon: 34.76, imsId: "178", cameraUrl: "https://beachcam.co.il/yafo.html" },
  { id: 'bat-yam-tayo', name: 'בת ים - תיו', lat: 32.01, lon: 34.74, imsId: "178" },
  { id: 'rishon-lezion', name: 'ראשון לציון', lat: 31.98, lon: 34.72, imsId: "178" },
  { id: 'palmachim', name: 'פלמחים', lat: 31.92, lon: 34.69, imsId: "124" },
  { id: 'ashdod-gil', name: 'אשדוד - גיל / קשתות', lat: 31.79, lon: 34.63, imsId: "124" },
  { id: 'ashkelon-delila', name: 'אשקלון - דלילה', lat: 31.68, lon: 34.55, imsId: "208" },
  { id: 'ziksit', name: 'זיקים', lat: 31.60, lon: 34.51, imsId: "208" }
];

export const SurfDashboard: React.FC = () => {
  const { coastalWeather, setSelectedStationId, isLoading: contextLoading } = useData();
  const [selectedSpotId, setSelectedSpotId] = useState('herzliya-marina');
  
  const [forecastLoaded, setForecastLoaded] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);

  // Derived current spot
  const activeSpot = useMemo(() => surfSpots.find(s => s.id === selectedSpotId) || surfSpots[7], [selectedSpotId]);

  // Sync Global IMS Station context when spot changes
  useEffect(() => {
    setSelectedStationId(activeSpot.imsId);
  }, [activeSpot.imsId, setSelectedStationId]);

  // Fetch forecast data specifically for the lat/lon
  useEffect(() => {
    let active = true;
    const fetchForecast = async () => {
      setForecastLoaded(false);
      setForecastError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 400)); // smooth ui
        const response = await fetch(`/api/forecast/weekly?lat=${activeSpot.lat}&lon=${activeSpot.lon}`);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        if (!active) return;
        if (!data?.daily?.time) throw new Error('Invalid data format received');

        // Process forecast data
        const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        const processedDays = data.daily.time.map((timeStr: string, idx: number) => {
          const dateObj = new Date(timeStr);
          const dayName = idx === 0 ? 'מחר' : daysOfWeek[dateObj.getDay()]; // Note: idx 0 in daily could be today or tomorrow depending on API 
          const dateStrFormatted = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
          
          const rawMeters = data.daily.wave_height_max[idx] || 0;
          let heightCm = Math.max(0, Math.round((rawMeters * 100) * 0.65 - 10));
          if (heightCm < 25) {
             heightCm = 0;
          } else {
             heightCm = Math.round(heightCm / 10) * 10;
          }
          
          return {
            id: timeStr,
            dayName: idx === 0 ? 'היום' : dayName,
            dateStr: dateStrFormatted,
            heightCm,
            windDir: Math.round(data.daily.wave_direction_dominant[idx] || 0),
          };
        });
        
        // Skip 'today' (idx = 0) since we show real-time now for today, show next 6 days
        setForecastData(processedDays.slice(1, 7));
        setForecastLoaded(true);
      } catch (err) {
        if (!active) return;
        // Quietly handle forecast error without triggering console.error which brings up the red screen
        console.warn("Forecast api failed to load");
        setForecastError("שגיאה בטעינת תחזית");
      }
    };
    
    fetchForecast();
    return () => { active = false; };
  }, [activeSpot]);

  const getWaveHeightGrade = (height: number) => {
    // Extreme conditions as specified:
    if (height >= 4.0) return { score: 12, name: 'ים מסוכן / קשה', color: 'text-red-700', bg: 'bg-red-100/40', border: 'border-red-200' };
    if (height >= 2.5) return { score: 11, name: 'ים סוער', color: 'text-slate-800', bg: 'bg-slate-200/50', border: 'border-slate-300' };
    if (height >= 1.5) return { score: 10, name: 'ים גבוה', color: 'text-indigo-800', bg: 'bg-indigo-100/50', border: 'border-indigo-200' };
    
    // Surfable conditions
    if (height >= 1.3) return { score: 8, name: 'גובה ראש + / קירות', color: 'text-cyan-600', bg: 'bg-cyan-100/50', border: 'border-cyan-200' };
    if (height >= 1.1) return { score: 7, name: 'גובה ראש / כתף', color: 'text-blue-600', bg: 'bg-blue-100/50', border: 'border-blue-200' };
    if (height >= 0.9) return { score: 6, name: 'גובה חזה', color: 'text-indigo-600', bg: 'bg-indigo-100/50', border: 'border-indigo-200' };
    if (height >= 0.7) return { score: 5, name: 'גובה מותן (Waist)', color: 'text-amber-600', bg: 'bg-amber-100/50', border: 'border-amber-200' };
    if (height >= 0.4) return { score: 4, name: 'גובה ברך (Knee)', color: 'text-orange-600', bg: 'bg-orange-100/50', border: 'border-orange-200' };
    if (height >= 0.2) return { score: 3, name: 'קרסול / קצף (Ankle)', color: 'text-red-500', bg: 'bg-red-100/50', border: 'border-red-200' };
    if (height >= 0.1) return { score: 2, name: 'פלטה עם קפלים', color: 'text-slate-500', bg: 'bg-slate-100/50', border: 'border-slate-200' };
    if (height > 0) return { score: 1, name: 'זכוכית (Glassy)', color: 'text-slate-400', bg: 'bg-slate-100/50', border: 'border-slate-200' };
    return { score: 0, name: 'בריכה (Flat)', color: 'text-slate-400', bg: 'bg-slate-100/50', border: 'border-slate-200' };
  };

  const getUvColor = (uv: number) => {
    if (uv === 0) return 'bg-[#8dc58d] text-emerald-950'; 
    if (uv === 1) return 'bg-[#499e49] text-white'; 
    if (uv === 2) return 'bg-[#a3cc4e] text-lime-950'; 
    if (uv === 3) return 'bg-[#cddc39] text-lime-950'; 
    if (uv === 4) return 'bg-[#ffeb3b] text-yellow-950'; 
    if (uv === 5) return 'bg-[#ffc107] text-amber-950'; 
    if (uv === 6) return 'bg-[#ff9800] text-orange-950'; 
    if (uv === 7) return 'bg-[#f57c00] text-orange-50'; 
    if (uv >= 8) return 'bg-[#e64a19] text-white'; 
    return 'bg-slate-200 text-slate-800';
  };

  const getUvText = (uv: number) => {
    if (uv <= 2) return 'נמוך';
    if (uv <= 5) return 'בינוני';
    if (uv <= 7) return 'גבוה';
    return 'גבוה מאוד';
  };

  const getTimelineCardStyle = (heightCm: number) => {
    // 4+ מטר - ים קשה / מסוכן (שחור)
    if (heightCm >= 400) return { 
      bg: 'bg-black/40', border: 'border-white/10', text: 'text-white', 
      title: 'text-slate-300', date: 'text-slate-400', 
      unit: 'text-slate-400', condColor: 'text-red-400' 
    }; 
    // 2.5-4 מטר - ים סוער (אדום כהה)
    if (heightCm >= 250) return { 
      bg: 'bg-red-900/40', border: 'border-red-500/20', text: 'text-white', 
      title: 'text-red-200', date: 'text-red-300/80', 
      unit: 'text-red-200', condColor: 'text-red-300' 
    }; 
    // 1.5-2.5 מטר - ים גבוה (אדום חזק)
    if (heightCm >= 150) return { 
      bg: 'bg-red-600/30', border: 'border-red-500/30', text: 'text-white', 
      title: 'text-red-100', date: 'text-red-200/80', 
      unit: 'text-red-200', condColor: 'text-white' 
    };
    // מעל 120 (120-150) - כחול כהה
    if (heightCm >= 120) return { 
      bg: 'bg-[#004a75]/40', border: 'border-blue-400/20', text: 'text-white', 
      title: 'text-blue-100', date: 'text-blue-200', 
      unit: 'text-blue-200', condColor: 'text-blue-100' 
    }; 
    // כחול חזק/בינוני לים עובד (70-120)
    if (heightCm >= 70) return { 
      bg: 'bg-[#006090]/40', border: 'border-blue-400/30', text: 'text-white', 
      title: 'text-blue-50', date: 'text-blue-100', 
      unit: 'text-blue-200', condColor: 'text-white' 
    }; 
    // 30-70 - תכלת עסיסי (יום גלי / ברך)
    if (heightCm >= 30) return { 
      bg: 'bg-cyan-500/30', border: 'border-cyan-400/30', text: 'text-white', 
      title: 'text-cyan-50', date: 'text-cyan-100', 
      unit: 'text-cyan-200', condColor: 'text-cyan-100' 
    }; 
    // פלטה - מתחת ל30. תכלת בהיר מאוד.
    return { 
      bg: 'bg-slate-500/10', border: 'border-slate-400/10', text: 'text-white', 
      title: 'text-slate-300', date: 'text-slate-400', 
      unit: 'text-slate-400', condColor: 'text-slate-400' 
    }; 
  };

  const getWindDirText = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'צפונית';
    if (deg >= 22.5 && deg < 67.5) return 'צפ׳ מזרחית';
    if (deg >= 67.5 && deg < 112.5) return 'מזרחית';
    if (deg >= 112.5 && deg < 157.5) return 'דר׳ מזרחית';
    if (deg >= 157.5 && deg < 202.5) return 'דרומית';
    if (deg >= 202.5 && deg < 247.5) return 'דר׳ מערבית';
    if (deg >= 247.5 && deg < 292.5) return 'מערבית';
    if (deg >= 292.5 && deg < 337.5) return 'צפ׳ מערבית';
    return '-';
  };

  const getWindCondition = (dirText: string, speedKnots: number) => {
    // Basic heuristic for Israeli Mediterranean Coast
    // East winds are offshore (Green)
    if (dirText.includes('מזרחית')) {
      return { 
        label: 'אוף-שור (Offshore)', 
        color: 'text-white',
        bg: 'bg-emerald-500', 
        borderColor: 'border-emerald-600',
        iconBg: 'bg-white/20'
      };
    }
    
    // Onshore / Cross-shore logic (Red for strong > ~14 knots, Orange for moderate/light)
    if (speedKnots >= 14) {
      return { 
        label: dirText === 'מערבית' ? 'און-שור חזק' : 'קרוס-שור חזק', 
        color: 'text-white',
        bg: 'bg-rose-500',
        borderColor: 'border-rose-600',
        iconBg: 'bg-white/20'
      };
    } else {
      return { 
        label: dirText === 'מערבית' ? 'און-שור' : 'קרוס-שור', 
        color: 'text-white',
        bg: 'bg-amber-500', 
        borderColor: 'border-amber-600',
        iconBg: 'bg-white/20'
      };
    }
  };

  const currentCondition = coastalWeather ? getWaveHeightGrade(coastalWeather.waveHeight) : getWaveHeightGrade(0);
  const currentWaveCm = coastalWeather ? (coastalWeather.waveHeight === 0 ? 0 : Math.round(coastalWeather.waveHeight * 100)) : 0;
  
  const windDirText = coastalWeather ? getWindDirText(coastalWeather.windDirection) : '';
  const windStats = coastalWeather ? getWindCondition(windDirText, coastalWeather.windSpeed) : null;

  return (
    <div className="relative space-y-6 pb-12 p-2 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-slate-800" dir="rtl">
      
      {/* 🔮 Background Decoration (Already managed by luxury-bg) */}
      
      {/* 1. Global Spot Selector */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 luxury-card p-4 relative overflow-hidden transition-all">
        <div className="grain-overlay" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center border border-sky-500/20 shadow-sm">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">בחירת ספוט</p>
            <select
              value={selectedSpotId}
              onChange={(e) => setSelectedSpotId(e.target.value)}
              className="bg-transparent text-lg font-black text-slate-800 border-none outline-none pr-0 cursor-pointer hover:text-sky-600 transition-colors"
              style={{ direction: 'rtl' }}
            >
              {surfSpots.map(spot => (
                <option key={spot.id} value={spot.id} className="text-slate-900">{spot.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {coastalWeather && (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-inner relative z-10">
            <Clock size={14} />
            עודכן: {new Date(coastalWeather.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {contextLoading ? (
        <div className="h-64 flex flex-col items-center justify-center luxury-card relative">
          <div className="grain-overlay" />
          <Loader2 className="animate-spin text-sky-500 mb-4" size={32} />
          <p className="text-sm font-bold text-slate-400">חוקר את הים...</p>
        </div>
      ) : coastalWeather ? (
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedSpotId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* 🍱 BENTO 1: The Hero (Wave Stats & Surf Console) */}
          <div className="lg:col-span-8 luxury-card p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[360px] md:min-h-[400px]">
            <div className="grain-overlay" />
            {/* Background Art */}
            <Waves className="absolute -bottom-10 -left-10 w-[400px] h-[400px] text-sky-500/[0.05] -rotate-12 pointer-events-none" />
            <div className="premium-sweep-fx opacity-20" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-8">
              {/* Top Section: Main Wave Height */}
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-sky-500/10 rounded-full border border-sky-500/20 text-xs font-black tracking-widest text-sky-600 shadow-sm">LIVE</div>
                    <span className="text-slate-500 text-sm font-bold uppercase tracking-wider font-yehuda">מצב הגלים</span>
                  </div>
                  
                  {/* Camera Link Button (If Available) */}
                  {(activeSpot as any).cameraUrl && (
                    <a 
                      href={(activeSpot as any).cameraUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm group"
                      title="צפה במצלמת החוף"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">מצלמת חוף</span>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </a>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">גובה הגלים (Swell Height)</p>
                  <div className="flex flex-wrap items-baseline gap-4 md:gap-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-7xl md:text-9xl font-black tracking-tighter leading-none text-slate-800">{currentWaveCm}</span>
                      <span className="text-3xl text-slate-400 font-bold -translate-y-2">ס״מ</span>
                    </div>
                    
                    <div className={`px-4 py-2 flex flex-col justify-center rounded-2xl ${currentCondition.bg} border ${currentCondition.border.replace('/40','').replace('/50','')} shadow-sm transition-all hover:scale-105`}>
                      <span className={`font-black text-xl md:text-2xl ${currentCondition.color}`}>{currentCondition.name}</span>
                      <span className="text-slate-500 text-[10px] md:text-xs font-bold mt-1">ציון גלישה מומחה: {currentCondition.score}/12</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: The 3 Sub-Parameters in Glass UI */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mt-auto">
                {/* Period */}
                <div className="bg-slate-50/50 shadow-inner border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] p-3 md:p-4 flex flex-col justify-center hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <Activity className="absolute -left-2 -bottom-2 w-12 h-12 text-sky-500/10 group-hover:scale-110 transition-transform duration-500" />
                  <p className="text-slate-400 text-[9px] md:text-xs font-black uppercase tracking-wider mb-2 leading-tight">זמן מחזור<br/><span className="hidden sm:inline">(Period)</span></p>
                  <div className="flex items-baseline gap-1 relative z-10">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-sky-600">{coastalWeather.wavePeriod.toFixed(1)}</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-400">ש׳</span>
                  </div>
                </div>

                {/* Wind */}
                <div className={`shadow-inner border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] p-3 md:p-4 flex flex-col justify-center hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group 
                  ${windStats?.bg.includes('emerald') ? 'bg-emerald-50/50' : ''}
                  ${windStats?.bg.includes('rose') ? 'bg-rose-50/50' : ''}
                  ${windStats?.bg.includes('amber') ? 'bg-amber-50/50' : ''}
                  ${!windStats ? 'bg-slate-50/50' : ''}
                `}>
                  <Wind className={`absolute -left-2 -bottom-2 w-12 h-12 opacity-10 group-hover:scale-110 transition-transform duration-500 ${windStats?.bg.includes('emerald') ? 'text-emerald-400' : windStats?.bg.includes('rose') ? 'text-rose-400' : 'text-amber-400'}`} />
                  <p className="text-slate-400 text-[9px] md:text-xs font-black uppercase tracking-wider mb-2 leading-tight">רוח <span className="hidden sm:inline">(Wind)</span></p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 xl:gap-2 relative z-10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800">{Math.round(coastalWeather.windSpeed)}</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-400">קשר</span>
                    </div>
                    
                    <div className={`inline-flex max-w-max items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md mt-1 sm:mt-0 shadow-inner ${windStats?.bg.replace('100/40','500/20').replace('100/50','500/20')}`}>
                      <Navigation size={10} style={{ transform: `rotate(${coastalWeather.windDirection}deg)` }} className={`fill-current shrink-0 ${windStats?.color}`} />
                      <span className={`text-[9px] leading-none mb-[1px] md:text-[10px] font-bold ${windStats?.color}`}>{getWindDirText(coastalWeather.windDirection)}</span>
                    </div>
                  </div>
                  <p className={`text-[9px] md:text-xs font-bold mt-1.5 md:mt-1 max-w-full truncate ${windStats?.color}`}>
                    {windStats?.label}
                  </p>
                </div>

                {/* Swell Direction */}
                <div className="bg-slate-50/50 shadow-inner border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] p-3 md:p-4 flex flex-col justify-center hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <Navigation className="absolute -left-2 -bottom-2 w-12 h-12 text-sky-500/10 group-hover:scale-110 transition-transform duration-500" />
                  <p className="text-slate-400 text-[9px] md:text-xs font-black uppercase tracking-wider mb-2 leading-tight">כיוון סוואל</p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 relative z-10 mt-1">
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 shrink-0 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center transform transition-transform shadow-inner"
                      style={{ transform: `rotate(${coastalWeather.waveDirection || 0}deg)` }}
                    >
                      <Navigation className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-sky-600 fill-current" />
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-lg font-black text-slate-700 uppercase leading-none mt-1 sm:mt-0 italic font-yehuda">
                      {getWindDirText(coastalWeather.waveDirection || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🍱 BENTO 2 & 3: Atmosphere & Environment */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 luxury-card p-6 relative overflow-hidden flex flex-col justify-center hover:scale-[1.02] transition-all">
              <div className="grain-overlay" />
              <div className="absolute -left-10 -bottom-10 opacity-5 blur-sm pointer-events-none">
                <Thermometer size={200} className="text-sky-400" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-sky-500/70 mb-6 font-yehuda">
                  <Thermometer size={18} />
                  <span className="text-xs font-black uppercase tracking-widest leading-none">טמפ׳ מים (Sea)</span>
                </div>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-6xl font-black text-slate-800 tracking-tighter">{coastalWeather.waterTemp.toFixed(1)}</span>
                  <span className="text-3xl font-bold text-slate-300">°C</span>
                </div>
                
                <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 border border-slate-100 shadow-inner">
                  <Thermometer size={14} className="opacity-70" />
                  <span>אוויר: {Math.round(coastalWeather.airTemp)}°</span>
                </div>
              </div>
            </div>

            <div className="luxury-card p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden min-h-[140px] hover:scale-[1.02] transition-all">
              <div className="grain-overlay" />
              <div className="absolute -left-10 -bottom-10 opacity-5 blur-sm pointer-events-none">
                <Sun size={200} className="text-amber-400" />
              </div>

              <div className="relative z-10 flex flex-col items-start gap-4 mb-6">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none font-yehuda">מדד קרינה</h3>
                <div className="flex items-center gap-3 text-lg text-slate-500 leading-none">
                  <span className="font-bold">עכשיו:</span>
                  <div className={`w-10 h-10 flex items-center justify-center font-black text-lg rounded-xl shadow-md border border-white/50 ${getUvColor(Math.round(coastalWeather.uvIndex))}`}>
                    {Math.round(coastalWeather.uvIndex)}
                  </div>
                  <span className="font-black text-slate-700">{getUvText(Math.round(coastalWeather.uvIndex))}</span>
                </div>
              </div>

              {coastalWeather.hourlyUv && coastalWeather.hourlyUv.length > 0 && (
                <div className="relative z-10 mb-6 w-full rounded-2xl overflow-hidden shadow-inner border border-slate-100">
                  <div className="flex w-full">
                    {coastalWeather.hourlyUv.map((hr: any) => (
                      <div key={`uv-${hr.hour}`} className={`flex-1 flex items-center justify-center py-2 text-sm font-black ${getUvColor(hr.uv)}`}>
                        {hr.uv}
                      </div>
                    ))}
                  </div>
                  <div className="flex w-full bg-slate-50/80 backdrop-blur-md">
                    {coastalWeather.hourlyUv.map((hr: any) => (
                       <div key={`hr-${hr.hour}`} className="flex-1 flex items-center justify-center py-2 text-slate-400 text-[10px] font-black tracking-tighter">
                         {hr.hour}
                       </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative z-10 text-center text-slate-300 text-[10px] font-bold pt-4 border-t border-slate-100/50 uppercase tracking-[0.15em] leading-tight">
                0-2: אין סכנה &bull; 3-7: הגנה מלאה מומלץ &bull; 8+: הגנה מלאה חובה
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      ) : (
        <div className="luxury-card p-12 text-center text-rose-500 font-bold border-rose-100">שגיאה בטעינת נתוני הלייב.</div>
      )}

      {/* 🍱 BENTO 4: The Horizon Timeline (Forecast) */}
      <div className="luxury-card p-6 md:p-8 relative overflow-hidden transition-all">
        <div className="grain-overlay" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-2xl border border-sky-500/20 shadow-sm">
            <Calendar size={20} />
          </div>
          <h4 className="text-2xl font-black text-slate-800 tracking-tighter font-yehuda">תחזית החופים לימים הקרובים</h4>
        </div>

        {!forecastLoaded ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-sky-500" size={32} />
          </div>
        ) : forecastError ? (
          <div className="p-6 bg-rose-50 text-rose-600 rounded-3xl text-center text-sm font-black border border-rose-100">{forecastError}</div>
        ) : (
          <div className="overflow-x-auto pb-4 custom-scrollbar relative z-10">
            <div className="flex gap-4 min-w-max px-2">
              {forecastData.map((day, idx) => {
                const cond = getWaveHeightGrade(day.heightCm / 100);
                const theme = getTimelineCardStyle(day.heightCm);

                return (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={day.id} 
                    className="w-36 rounded-[2.5rem] p-6 flex flex-col items-center text-center transition-all duration-500 shadow-lg border border-slate-100 bg-white hover:-translate-y-3 hover:shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-sky-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <span className="relative z-10 text-xs font-black mb-1 text-slate-800 uppercase tracking-widest">{day.dayName}</span>
                    <span className="relative z-10 text-[10px] font-bold mb-4 text-slate-400">{day.dateStr}</span>
                    
                    <div className="relative z-10 flex flex-col items-center gap-1 my-3">
                      <span className="text-4xl font-black text-slate-800 tracking-tighter group-hover:scale-110 transition-transform duration-500">{day.heightCm === 0 ? '0' : day.heightCm}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase">ס״מ</span>
                    </div>

                    <div className="relative z-10 mt-auto pt-4 flex flex-col items-center gap-3 w-full border-t border-slate-50">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cond.bg} ${cond.color} border ${cond.border} shadow-sm`}>{cond.name}</span>
                      
                      <div className="flex items-center gap-1.5 text-[10px] bg-slate-50 px-3 py-2 rounded-xl shadow-inner border border-slate-100 w-full justify-center group-hover:bg-white transition-colors duration-300">
                        <Navigation size={12} style={{ transform: `rotate(${day.windDir}deg)` }} className="text-slate-400 fill-current" />
                        <span className="font-black text-slate-600 italic">{getWindDirText(day.windDir)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurfDashboard;
