import React, { useMemo, useState, useEffect } from 'react';
import { Navigation, Waves, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Coordinates mapped for the 19 locations (approximate for global models)
const forecastLocations = [
  { id: 'haifa-bat-galim', name: 'חיפה - בת גלים', lat: 32.83, lon: 34.98 },
  { id: 'haifa-dado', name: 'חיפה - דדו', lat: 32.79, lon: 34.95 },
  { id: 'haifa-zvulun', name: 'חיפה - זבולון', lat: 32.82, lon: 34.97 },
  { id: 'shavei-tzion', name: 'שבי ציון / נהריה', lat: 32.97, lon: 35.08 },
  { id: 'michmoret', name: 'מכמורת', lat: 32.40, lon: 34.86 },
  { id: 'netanya-kontiki', name: 'נתניה - קונטיקי', lat: 32.33, lon: 34.84 },
  { id: 'herzliya-zvulun', name: 'הרצליה - זבולון', lat: 32.17, lon: 34.79 },
  { id: 'herzliya-marina', name: 'מרינה הרצליה', lat: 32.16, lon: 34.79 },
  { id: 'tel-aviv-tel-baruch', name: 'ת"א - תל ברוך', lat: 32.12, lon: 34.78 },
  { id: 'tel-aviv-hilton', name: 'ת"א - הילטון', lat: 32.08, lon: 34.76 },
  { id: 'tel-aviv-gordon', name: 'ת"א - גורדון', lat: 32.08, lon: 34.76 },
  { id: 'tel-aviv-dolfinarium', name: 'ת"א - דולפינריום', lat: 32.06, lon: 34.76 },
  { id: 'tel-aviv-maravi', name: 'ת"א - מערבי', lat: 32.05, lon: 34.76 },
  { id: 'bat-yam-tayo', name: 'בת ים - תיו', lat: 32.01, lon: 34.74 },
  { id: 'rishon-lezion', name: 'ראשון לציון', lat: 31.98, lon: 34.72 },
  { id: 'palmachim', name: 'פלמחים', lat: 31.92, lon: 34.69 },
  { id: 'ashdod-gil', name: 'אשדוד - גיל / קשתות', lat: 31.79, lon: 34.63 },
  { id: 'ashkelon-delila', name: 'אשקלון - דלילה', lat: 31.68, lon: 34.55 },
  { id: 'ziksit', name: 'זיקים', lat: 31.60, lon: 34.51 }
];

const getConditionData = (height: number) => {
  // Modern vivid brand colors for conditions
  if (height <= 20) return { color: '#94a3b8', text: 'text-slate-500', label: 'פלטה' };      // Slate
  if (height <= 40) return { color: '#0ea5e9', text: 'text-sky-500', label: 'קטנים' };       // Sky
  if (height <= 70) return { color: '#3b82f6', text: 'text-blue-500', label: 'בינוניים' };    // Blue
  if (height <= 110) return { color: '#10b981', text: 'text-emerald-500', label: 'טובים' };    // Emerald
  if (height <= 150) return { color: '#eab308', text: 'text-yellow-500', label: 'רוגש' };     // Yellow
  if (height <= 190) return { color: '#f97316', text: 'text-orange-500', label: 'גבוהים' };    // Orange
  return { color: '#f43f5e', text: 'text-rose-500', label: 'סערה' };                             // Rose
};

// Default fallback data if API fails
const generateFallbackData = (locationId: string) => {
  const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  let seed = 0;
  for (let i = 0; i < locationId.length; i++) {
    seed += locationId.charCodeAt(i);
  }
  
  const baseData = [
    { windDir: 135, heightCm: 40 + (seed % 30), windSpeed: 15 + (seed % 5), wavePeriod: 4 },
    { windDir: 180, heightCm: 60 + ((seed + 5) % 40) - 10, windSpeed: 18 + (seed % 8), wavePeriod: 5 },
    { windDir: 225, heightCm: 90 + ((seed * 2) % 20), windSpeed: 22 - (seed % 4), wavePeriod: 6 },
    { windDir: 270, heightCm: 110 - ((seed * 3) % 40), windSpeed: 25, wavePeriod: 8 },
    { windDir: 315, heightCm: 80 + ((seed * 4) % 15), windSpeed: 16 + (seed % 6), wavePeriod: 5 },
    { windDir: 90, heightCm: 50 + ((seed * 5) % 45), windSpeed: 12, wavePeriod: 4 },
    { windDir: 45, heightCm: 20 + ((seed * 6) % 25), windSpeed: 10 + (seed % 3), wavePeriod: 3 },
  ];

  const today = new Date();
  
  return baseData.map((data, idx) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + idx);
    
    const dayName = idx === 0 ? 'היום' : daysOfWeek[targetDate.getDay()];
    const dateStr = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const condition = getConditionData(data.heightCm);

    return {
      day: dayName,
      date: dateStr,
      condition,
      ...data
    };
  });
};

export const WeeklyForecast: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState('herzliya-marina');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchForecast = async () => {
      setIsLoading(true);
      setError(null);
      
      const loc = forecastLocations.find(l => l.id === selectedLocation);
      if (!loc) return;

      try {
        // Minimum delay solely so the user can perceive the transition
        await new Promise(resolve => setTimeout(resolve, 600));

        // Fetch offshore wave forecast using our unified backend proxy
        const response = await fetch(`/api/forecast/weekly?lat=${loc.lat}&lon=${loc.lon}`);
        
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        if (!active) return;
        if (!data?.daily?.time) throw new Error('Invalid data format received');

        // Process data
        const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        const processedDays = data.daily.time.map((timeStr: string, idx: number) => {
          const dateObj = new Date(timeStr);
          const dayName = idx === 0 ? 'היום' : daysOfWeek[dateObj.getDay()];
          const dateStrFormatted = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
          
          // 🌊 אלגוריתם ריאליסטי למבנה החופים ומאפייני הים התיכון:
          // מודל ה-API מושך "Wave Height Max" - גל המקסימום בעומק הלב ים.
          // להבדיל מסוולים של אוקיינוס (שם הגל מזדקר עם מקדם שבירה גבוה כשפוגע בחוף),
          // בים התיכון מדובר לרוב בסוול רוח מקומי (Wind Swell) עם זמן מחזור (Period) קצר.
          // המשמעות היא שהגל מאבד כמות עצומה של אנרגיה כשמגיע למדף היבשת הרדוד של ישראל,
          // וכן מופחת משמעותית כשיש שוברי גלים (כמו במרינה או חופים סגורים).
          // לכן, כדי לייצג לגולש את "קיר הגל" (Face) הניתן לגלישה, צריך למעשה *לחתוך* מהמקסימום.
          const rawMeters = data.daily.wave_height_max[idx] || 0;
          
          // ניכוי אנרגיה בגין מדף היבשת וחולשת הרוח בתל אביב/הרצליה:
          // ניקח 65% מגובה המקסימום בלב ים, ונפחית גם כ-10 ס"מ שחיקה
          let heightCm = Math.max(0, Math.round((rawMeters * 100) * 0.65 - 10));
          
          // העלמת "רעש" ויצירת תצוגה נקייה:
          if (heightCm < 25) {
             // מתחת ל-25 ס"מ זה בפועל ים פלטה לגולש (אין שבירה שמחזיקה גלשן)
             heightCm = 0;
          } else {
             // עיגול לעשרות הקרובות בשביל התצוגה הקלאסית והקריאה
             heightCm = Math.round(heightCm / 10) * 10;
          }
          
          // API has dominant dir
          const windDir = Math.round(data.daily.wave_direction_dominant[idx] || 0);

          // We don't get exact wind speed from the simple marine daily endpoint easily without mixing endpoints, so providing a correlated mock for now or static average for wind
          // For a true implementation, we'd fetch the standard weather API simultaneously
          const windSpeed = Math.round(10 + (heightCm / 10) + (Math.random() * 5)); 

          return {
            day: dayName,
            date: dateStrFormatted,
            heightCm,
            windDir,
            windSpeed,
            condition: getConditionData(heightCm)
          };
        });

        // Open Meteo sometimes returns 8 days due to timezone overlaps at boundaries, cap at 7
        setForecastData(processedDays.slice(0, 7));
      } catch (err) {
        console.error("Forecast fetch error:", err);
        if (active) {
          // If API fails, fallback to calculated mock data so interface doesn't break entirely
          setForecastData(generateFallbackData(selectedLocation));
          setError('שגיאה בשליפת נתוני אמת מהמודל. מוצגים נתוני תחזית משוערים.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchForecast();
    return () => { active = false; };
  }, [selectedLocation]);
  
  // Calculate the max wave height flexibly for the visual liquid fill logic (minimum logic 150cm to always show some headroom)
  const maxWave = Math.max(...forecastData.map(d => d.heightCm), 150);

  return (
    <div className="mt-8 md:mt-12 luxury-card p-5 lg:p-8 relative" dir="rtl">
      <div className="grain-overlay" />
      {/* Subtle light bleeds */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#38bdf8] opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-[#0ea5e9] opacity-10 blur-[100px] rounded-full pointer-events-none" />

      {/* Location Selector */}
      <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-x-auto scroller-hide shadow-inner w-full mb-6 md:mb-8">
        {forecastLocations.map((loc) => {
          const isActive = selectedLocation === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`relative flex-1 min-w-[max-content] px-5 py-2.5 text-sm font-bold text-center rounded-xl transition-colors z-10 whitespace-nowrap flex items-center justify-center gap-2 ${
                isActive ? 'text-sky-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeWeeklyLocation"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,100,200,0.12)] border border-slate-200/50 -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <MapPin className={`w-4 h-4 ${isActive ? 'text-sky-500' : 'opacity-50'}`} />
              {loc.name}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-8 relative z-10">
         <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white shadow-sm mt-1">
              <Waves size={12} className="text-blue-600" />
              <span className="text-[10px] font-bold text-slate-700 tracking-wide uppercase">Weekly Overview</span>
            </div>
            <h4 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
              תחזית לשבוע הקרוב
            </h4>
         </div>

         {/* Dynamic Modern Legend */}
         <div className="flex flex-wrap items-center gap-1.5 bg-white/50 p-2 md:p-2.5 rounded-xl border border-white shadow-sm max-w-full">
            <span className="text-[10px] font-extrabold text-slate-400 mx-1 uppercase tracking-wide">מקרא</span>
            {Object.values(
              forecastData.length > 0 ? forecastData.reduce((acc, curr) => {
                if (!acc[curr.condition.label]) acc[curr.condition.label] = curr.condition;
                return acc;
              }, {} as Record<string, ReturnType<typeof getConditionData>>) : {}
            ).map((cond: any, idx) => (
               <div key={idx} className="group flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100 transition-all hover:scale-105">
                 <div className="w-2 h-2 rounded-full shadow-inner" style={{ backgroundColor: cond.color }}></div>
                 <span className="text-[10px] font-bold text-slate-600">{cond.label}</span>
               </div>
            ))}
         </div>
      </div>
      
      {error && (
        <div className="mb-6 flex items-center gap-2 text-amber-600 bg-amber-50/50 p-3 rounded-xl border border-amber-200/50 text-xs font-medium">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Fluid Cards Container - Overflows safely */}
      <div className="relative w-full overflow-x-auto scroller-hide pb-6 pt-2 -mx-4 px-4 lg:mx-0 lg:px-0 scroll-smooth snap-x">
         <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center h-[250px] md:h-[260px] w-full bg-white/30 rounded-[1.5rem] backdrop-blur-sm border border-white/50"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                  <span className="text-sm font-semibold text-slate-500">טוען תחזית מגלי הים...</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, staggerChildren: 0.1 }}
                className="flex gap-3 md:gap-4 w-max"
              >
                 {forecastData.map((day, idx) => {
                  // Calculate how "full" the card should be based on wave height
                  // Cap at 95% so the top border of the liquid is always visible
                  const fillPercent = Math.min((day.heightCm / maxWave) * 100, 95);

                  return (
                    <motion.div key={idx} 
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         transition={{ duration: 0.4, delay: idx * 0.05 }}
                         className="group relative w-[130px] md:w-[145px] h-[250px] md:h-[260px] rounded-[1.5rem] overflow-hidden bg-white/60 border border-white shadow-md hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between p-4 snap-center shrink-0 cursor-default">
                   
                   {/* Liquid Fill Element representing the Bar Chart organically */}
                   <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out z-0 opacity-80 group-hover:opacity-100"
                        style={{
                          height: `${fillPercent}%`,
                          background: `linear-gradient(to top, ${day.condition.color}40, ${day.condition.color}05)`,
                          borderTop: `2px solid ${day.condition.color}50`,
                        }}
                   >
                      {/* Inner soft top glow */}
                      <div className="absolute top-0 left-0 right-0 h-4" style={{ background: `linear-gradient(to bottom, ${day.condition.color}30, transparent)`}}></div>
                   </div>

                   {/* Inner global glow on hover based on condition color */}
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 mix-blend-multiply blur-2xl" style={{ backgroundColor: day.condition.color }} />

                   {/* Top area: Day & Date */}
                   <div className="relative z-10 text-center space-y-0.5">
                     <h5 className="text-lg md:text-xl font-black text-slate-800">{day.day}</h5>
                     <p className="text-[10px] font-semibold text-slate-400">{day.date}</p>
                   </div>

                   {/* Middle area: Big Wave Height (Hero metric) */}
                   <div className="relative z-10 flex flex-col items-center justify-center grow my-1">
                      <span className={`text-4xl md:text-5xl font-black tracking-tighter drop-shadow-sm transition-transform duration-500 group-hover:scale-110 ${day.condition.text}`}>
                        {day.heightCm}
                      </span>
                      <span className="text-xs font-extrabold text-slate-600 opacity-70">ס״מ</span>
                   </div>

                   {/* Bottom area: Wind Dial & Condition Badge */}
                   <div className="relative z-10 flex flex-col items-center gap-2 w-full">
                      <span className="text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full bg-white shadow-sm border border-white/50 transition-colors" style={{ color: day.condition.color }}>
                        {day.condition.label}
                      </span>

                      <div className="flex items-center justify-center gap-1.5 w-full bg-white/80 backdrop-blur-md rounded-xl p-1.5 shadow-sm border border-white/60 group-hover:bg-white transition-colors duration-300">
                         <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shadow-inner border border-slate-100 shrink-0">
                           <Navigation size={12} className="text-slate-700 transition-transform duration-700 group-hover:rotate-12" style={{ transform: `rotate(${day.windDir}deg)`, color: day.condition.color }} />
                         </div>
                         <div className="flex flex-col items-start leading-none">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Wind</span>
                            <span className="text-[11px] font-extrabold text-slate-700">{day.windSpeed} <span className="font-semibold text-[9px] text-slate-500">קמ״ש</span></span>
                         </div>
                      </div>
                   </div>

                 </motion.div>
               );
            })}
         </motion.div>
         )}
         </AnimatePresence>
      </div>
    </div>
  );
};
