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
  { id: 'ziksit', name: 'זיקים', lat: 31.60, lon: 34.51, imsId: "208" },
  { id: 'maagan-michael', name: 'מעגן מיכאל', lat: 32.55, lon: 34.91, imsId: "46", cameraUrl: "https://beachcam.co.il/maagan.html" },
  { id: 'sdot-yam', name: 'שדות ים', lat: 32.49, lon: 34.89, imsId: "46", cameraUrl: "https://wind.co.il/%D7%9E%D7%96%D7%92-%D7%90%D7%95%D7%99%D7%A8/%D7%A9%D7%99%D7%93%D7%95%D7%A8-%D7%97%D7%99/" }
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
          const period = data.daily.wave_period_max ? data.daily.wave_period_max[idx] || 0 : 0;
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
            period,
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

  const getWaveConditionGrade = (height: number, period: number = 0) => {
    // Wave Power Calculation (kW/m) based on Oceanography Wave Physics: P ≈ 0.5 * H^2 * T
    const power = period > 0 ? 0.5 * (height * height) * period : 0;

    // Extreme conditions as specified:
    if (power >= 20 || height >= 4.0) return { score: 10, name: 'הירושימה / דאבל', hand: '🙌', symbol: '🌪️', color: 'text-purple-600', bg: 'bg-purple-100/50', border: 'border-purple-200' };
    if (power >= 10 || height >= 2.5) return { score: 9, name: 'ים סוער / עוצמתי', hand: '🤙', symbol: '💨', color: 'text-emerald-600', bg: 'bg-emerald-100/50', border: 'border-emerald-200' };
    if (power >= 5 || height >= 1.5) return { score: 8, name: 'גבוה וחזק', hand: '👍', symbol: '🌊', color: 'text-cyan-600', bg: 'bg-cyan-100/50', border: 'border-cyan-200' };
    
    // Surfable conditions - incorporating power as the true engine of waves
    if (power >= 2.5 || height >= 1.3) return { score: 7, name: 'גובה ראש + / קירות', hand: '👌', symbol: '🎯', color: 'text-blue-600', bg: 'bg-blue-100/50', border: 'border-blue-200' };
    if (power >= 1.5 || height >= 1.1) return { score: 6, name: 'גובה ראש / מנוע ארוך', hand: '🤘', symbol: '✨', color: 'text-indigo-600', bg: 'bg-indigo-100/50', border: 'border-indigo-200' };
    if (power >= 0.8 || height >= 0.9) return { score: 5, name: 'גובה חזה', hand: '🖐️', symbol: '🪵', color: 'text-amber-600', bg: 'bg-amber-100/50', border: 'border-amber-200' };
    if (power >= 0.4 || height >= 0.7) return { score: 4, name: 'גובה מותן (Waist)', hand: '🤏', symbol: '🦵', color: 'text-orange-600', bg: 'bg-orange-100/50', border: 'border-orange-200' };
    if (power >= 0.1 || height >= 0.4) return { score: 3, name: 'גובה ברך (Knee)', hand: '🫳', symbol: '🦶', color: 'text-red-500', bg: 'bg-red-100/50', border: 'border-red-200' };
    if (height >= 0.2) return { score: 2, name: 'קרסול / קצף (Ankle)', hand: '🤏', symbol: '〰️', color: 'text-slate-500', bg: 'bg-slate-100/50', border: 'border-slate-200' };
    if (height > 0) return { score: 1, name: 'זכוכית (Glassy)', hand: '🤲', symbol: '🪟', color: 'text-slate-400', bg: 'bg-slate-100/50', border: 'border-slate-200' };
    return { score: 0, name: 'בריכה (Flat)', hand: '👎', symbol: '🏊‍♀️', color: 'text-slate-400', bg: 'bg-slate-100/50', border: 'border-slate-200' };
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

  const currentCondition = coastalWeather ? getWaveConditionGrade(coastalWeather.waveHeight, coastalWeather.wavePeriod) : getWaveConditionGrade(0);
  const currentWaveCm = coastalWeather ? (coastalWeather.waveHeight === 0 ? 0 : Math.round(coastalWeather.waveHeight * 100)) : 0;
  
  const windDirText = coastalWeather ? getWindDirText(coastalWeather.windDirection) : '';
  const windStats = coastalWeather ? getWindCondition(windDirText, coastalWeather.windSpeed) : null;

  const getAquariumPalette = (heightCm: number) => {
    // 1. יום שקט (Calm Sea) < 60cm
    if (heightCm < 60) {
      return {
        gradUrl: '%230077BE', // primary wave foreground
        gradStart: '#48AAAD',
        gradEnd: '#0077BE',
        waveOpacity: 0.6,
        surfaceHighlight: 'rgba(135, 206, 235, 0.4)', // #87CEEB (Sky Blue)
        bubbleColor: 'rgba(242, 210, 169, 0.5)', // #F2D2A9 (Sand)
      };
    }
    // 2. ים בינוני (Moderate Sea) < 150cm (up to Chest)
    if (heightCm < 150) {
      return {
        gradUrl: '%23005678',
        gradStart: '#71A69E',
        gradEnd: '#005678',
        waveOpacity: 0.7,
        surfaceHighlight: 'rgba(169, 169, 169, 0.3)', // #A9A9A9
        bubbleColor: 'rgba(255, 255, 255, 0.6)', // #FFFFFF
      };
    }
    // 3. ים סוער (Rough Sea) < 250cm
    if (heightCm < 250) {
      return {
        gradUrl: '%232F4F4F',
        gradStart: '#778899',
        gradEnd: '#2F4F4F',
        waveOpacity: 0.8,
        surfaceHighlight: 'rgba(105, 105, 105, 0.4)', // #696969
        bubbleColor: 'rgba(224, 224, 224, 0.5)', // #E0E0E0
      };
    }
    // 4. ים סוער מאוד (Violent Sea) >= 250cm
    return {
      gradUrl: '%23191970',
      gradStart: '#4F5D65',
      gradEnd: '#191970',
      waveOpacity: 0.9,
      surfaceHighlight: 'rgba(46, 139, 87, 0.3)', // #2E8B57
      bubbleColor: 'rgba(192, 192, 192, 0.5)', // #C0C0C0
    };
  };

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

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
                  
                  {/* Swell Height Box */}
                  <div className="flex flex-col justify-center items-center xl:items-start p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner w-full relative overflow-hidden group hover:bg-white hover:shadow-md transition-all">
                    <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-2 relative z-10">גובה הגלים (Swell)</p>
                    <div className="flex items-baseline gap-2 relative z-10">
                      <span className="text-7xl md:text-8xl font-black tracking-tighter leading-none text-slate-800">{currentWaveCm}</span>
                      <span className="text-3xl md:text-4xl text-slate-400 font-bold -translate-y-2">ס״מ</span>
                    </div>
                  </div>
                  
                  {/* Formula Score Box */}
                  <div className={`flex flex-col justify-center items-center xl:items-start p-6 rounded-[2rem] border-2 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl w-full relative overflow-hidden group flex-1 ${currentCondition.bg} ${currentCondition.border.replace('/40','').replace('/50','')}`}>
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/30 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                    
                    <p className={`text-[10px] md:text-xs font-black uppercase tracking-wider opacity-80 mb-2 relative z-10 ${currentCondition.color}`}>דירוג מצב הים (Douglas / AI)</p>
                    
                    <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full">
                      {/* Score Value Component */}
                      <div className="flex items-baseline gap-1" dir="ltr">
                        <span className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none drop-shadow-sm ${currentCondition.color}`}>{currentCondition.score}</span>
                        <span className="text-xl md:text-2xl font-bold text-slate-400/80">/10</span>
                      </div>
                      
                      <div className="w-px h-16 bg-black/10 mx-1"></div>
                      
                      {/* Name and Icon */}
                      <div className="flex flex-col items-center xl:items-start flex-1 w-full relative z-10 overflow-hidden">
                        <span className="text-3xl md:text-4xl drop-shadow-sm mb-1">{currentCondition.hand}</span>
                        <span className={`font-black text-lg md:text-xl leading-tight text-center xl:text-right ${currentCondition.color}`}>{currentCondition.name}</span>
                      </div>
                    </div>
                    
                    {/* Visual Scale Indicator (UV Style) */}
                    <div className="w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200/50 flex mt-6 relative z-10">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => {
                        const isActive = s === currentCondition.score;
                        const isPast = s < currentCondition.score;
                        
                        let bgClass = 'bg-white/40 text-slate-400';
                        if (isActive || isPast) {
                          if (s <= 2) bgClass = 'bg-blue-300 text-blue-900';
                          else if (s <= 4) bgClass = 'bg-cyan-400 text-cyan-950';
                          else if (s <= 6) bgClass = 'bg-emerald-400 text-emerald-950';
                          else if (s <= 7) bgClass = 'bg-yellow-400 text-yellow-950';
                          else if (s <= 8) bgClass = 'bg-orange-500 text-white';
                          else if (s <= 9) bgClass = 'bg-red-500 text-white';
                          else bgClass = 'bg-purple-600 text-white';
                        }
                        
                        return (
                          <div 
                            key={s} 
                            className={`flex-1 flex items-center justify-center py-2 text-xs md:text-sm font-black transition-all duration-500 ${bgClass} ${isActive ? 'scale-110 shadow-lg z-20 rounded-lg transform' : 'opacity-80'}`} 
                          >
                            {s}
                          </div>
                        );
                      })}
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
                const cond = getWaveConditionGrade(day.heightCm / 100, day.period);
                const theme = getTimelineCardStyle(day.heightCm);

                // Calculate aquarium fill percentage (assuming 300cm is 100% full)
                const fillPercent = Math.min(100, Math.max(12, (day.heightCm / 300) * 100));
                
                const pal = getAquariumPalette(day.heightCm);

                return (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={day.id} 
                    className={`w-36 rounded-[2.5rem] p-6 flex flex-col items-center text-center transition-all duration-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 backdrop-blur-xl relative overflow-hidden group ${day.heightCm >= 250 ? 'bg-black/10' : 'bg-white/40'} hover:-translate-y-3 hover:shadow-[0_20px_40px_rgb(14,165,233,0.15)] hover:border-white/80`}
                  >
                    {/* Glass Surface Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/0 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20 pointer-events-none rounded-[2.5rem]" />

                    {/* Aquarium Fill Effect */}
                    <div 
                      className="absolute bottom-0 left-0 w-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] z-0 overflow-hidden group-hover:filter group-hover:brightness-110"
                      style={{ 
                        height: `${fillPercent}%`,
                        background: `linear-gradient(to top, ${pal.gradStart}, ${pal.gradEnd})`
                      }}
                    >
                      {/* Deep Water Highlight */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent z-10 pointer-events-none mix-blend-overlay" />

                      {/* Animated Wave on Top - Background */}
                      <div className="absolute top-0 left-0 w-[200%] h-12 opacity-30 animate-wave-slow pointer-events-none mix-blend-overlay" style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z' fill='%23ffffff'/%3E%3C/svg%3E")`,
                        backgroundSize: '800px 48px',
                        transform: 'translateY(-50%) rotate(180deg)'
                      }} />

                      {/* Animated Wave on Top - Foreground */}
                      <div className="absolute top-0 left-0 w-[200%] h-8 animate-wave pointer-events-none filter drop-shadow-[0_-2px_4px_rgba(255,255,255,0.3)]" style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z' fill='${pal.gradUrl}'/%3E%3C/svg%3E")`,
                        backgroundSize: '600px 32px',
                        transform: 'translateY(-50%)',
                        opacity: pal.waveOpacity
                      }} />
                      
                      {/* Bubbles */}
                      <div className="absolute inset-0 pointer-events-none">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`absolute rounded-full animate-bubble-${(i % 3) + 1} mix-blend-overlay`} style={{
                            backgroundColor: pal.bubbleColor,
                            width: `${3+i}px`,
                            height: `${3+i}px`,
                            left: `${15*i + Math.sin(i)*15}%`,
                            bottom: `-${5*i}%`,
                            animationDuration: `${2+i*0.8}s`,
                            animationDelay: `${i*0.4}s`
                          }} />
                        ))}
                      </div>
                    </div>
                    
                    {/* Ripple Rings on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden z-10">
                      <div className="w-[150%] h-[150%] rounded-full border absolute animate-ping" style={{ animationDuration: '3s', borderColor: pal.surfaceHighlight }} />
                      <div className="w-[100%] h-[100%] rounded-full border absolute animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s', borderColor: pal.surfaceHighlight }} />
                    </div>

                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 z-0" style={{ backgroundColor: pal.surfaceHighlight }} />
                    
                    <span className="relative z-10 text-xs font-black mb-1 text-slate-800 uppercase tracking-widest">{day.dayName}</span>
                    <span className="relative z-10 text-[10px] font-bold mb-4 text-slate-400">{day.dateStr}</span>
                    
                    <div className="relative z-10 flex flex-col items-center gap-1 mt-1 mb-3">
                      <span className="text-4xl font-black text-slate-800 tracking-tighter group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">{day.heightCm === 0 ? '0' : day.heightCm}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase">ס״מ</span>
                      
                      {day.period > 0 && (
                        <div className="flex items-center gap-1 mt-1 bg-white/50 px-2 py-0.5 rounded border border-slate-100/50 tooltip-trigger">
                          <span className="text-[10px] font-black text-indigo-700">{Math.round(day.period * 10) / 10}</span>
                          <span className="text-[9px] font-bold text-indigo-600/80">שניות</span>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 mt-auto pt-4 flex flex-col items-center gap-3 w-full border-t border-slate-100/50">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cond.bg} ${cond.color} border ${cond.border} shadow-sm backdrop-blur-md`}>{cond.name}</span>
                      
                      <div className="flex items-center gap-1.5 text-[10px] bg-white/70 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-slate-100/50 w-full justify-center group-hover:bg-white transition-colors duration-300">
                        <Navigation size={12} style={{ transform: `rotate(${day.windDir}deg)` }} className="text-slate-400 fill-current" />
                        <span className="font-black text-slate-600 italic tracking-wide">{getWindDirText(day.windDir)}</span>
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
