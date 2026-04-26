
import React, { useState, useEffect } from 'react';
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
  Crown,
  Feather,
  Wind,
  Moon,
  Sun,
  Droplets,
  ShieldAlert,
  Zap,
  Image as ImageIcon,
  MapPin,
  Activity,
  Gauge
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';

import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export const CoastalDashboard: React.FC = () => {
  const { 
    coastalWeather: data, 
    selectedStationId, 
    setSelectedStationId, 
    seaStats: stats, 
    isLoading: contextLoading, 
    siteAssets 
  } = useData();
  const { currentUser } = useAuth();
  const [imsWarnings, setImsWarnings] = useState<any[]>([]);
  const [imsLoading, setImsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const stations = [
    { id: "178", name: "תל אביב" },
    { id: "26", name: "חיפה" },
    { id: "124", name: "אשדוד" },
    { id: "208", name: "אשקלון" },
    { id: "343", name: "שבי ציון" },
    { id: "46", name: "חדרה" }
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await fetch(`/api/ims/history/${selectedStationId}`);
        if (res.ok) {
          const text = await res.text();
          if (text.includes("<title>Starting Server...</title>")) {
            console.warn("Server is starting up, retrying IMS history later...");
            return;
          }
          try {
            const data = JSON.parse(text);
            setHistory(data);
          } catch (e) {
            console.warn("IMS history API returned non-JSON response");
            setHistoryError("תגובה לא תקינה מהשרת");
          }
        } else {
          const errText = await res.text();
          console.warn(`Failed to fetch history: ${res.status} ${errText}`);
          try {
            const errJson = JSON.parse(errText);
            setHistoryError(errJson.error || `שגיאה ${res.status}`);
          } catch {
            setHistoryError(`שגיאה ${res.status}`);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch history", err);
        setHistoryError("שגיאת תקשורת");
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedStationId]);

  useEffect(() => {
    const fetchImsWarnings = async () => {
      setImsLoading(true);
      try {
        const res = await fetch('/api/ims/warnings');
        if (res.ok) {
          const text = await res.text();
          if (text.includes("<title>Starting Server...</title>")) {
            console.warn("Server is starting up, retrying IMS warnings later...");
            return;
          }
          try {
            const data = JSON.parse(text);
            if (data && Array.isArray(data.data)) {
              setImsWarnings(data.data);
            }
          } catch (e) {
            console.warn("IMS warnings API returned non-JSON response");
          }
        }
      } catch (err) {
        console.warn("Failed to fetch IMS warnings", err);
      } finally {
        setImsLoading(false);
      }
    };
    
    fetchImsWarnings();
  }, []);
  
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

  const getWindDirText = (deg: number) => {
    const directions = ['צפון', 'צפ-מז', 'מזרח', 'דר-מז', 'דרום', 'דר-מע', 'מערב', 'צפ-מע'];
    return directions[Math.round(deg / 45) % 8];
  };

  const advice = data ? getAdvice(data.uvIndex) : null;
  const loading = contextLoading || !data;
  const error = null; // Error handling is now centralized in DataContext

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

  const getPeriodGrade = (period: number) => {
    if (period > 10.0) return { 
      grade: 'Epic', hand: '👌', symbol: '👑', status: 'Ultra-Clean', 
      desc: 'יום נדיר, גלים מסודרים מאוד ("שורות").',
      color: 'text-purple-600', bg: 'bg-purple-100/50', border: 'border-purple-200' 
    };
    if (period >= 8.1) return { 
      grade: 'Great', hand: '🤙', symbol: '💎', status: 'High Energy', 
      desc: 'סוול איכותי, כוח טוב בגל, מרווח נשימה.',
      color: 'text-emerald-600', bg: 'bg-emerald-100/50', border: 'border-emerald-200' 
    };
    if (period >= 6.6) return { 
      grade: 'Good', hand: '👍', symbol: '✅', status: 'Solid Swell', 
      desc: 'ים גליש ומהנה, קצת צפוף אבל מסודר.',
      color: 'text-cyan-600', bg: 'bg-cyan-100/50', border: 'border-cyan-200' 
    };
    if (period >= 5.1) return { 
      grade: 'Fair', hand: '✊', symbol: '🪵', status: 'Wind-Chopped', 
      desc: 'גלי רוח קלאסיים, צפופים, דורשים הרבה חתירה.',
      color: 'text-amber-600', bg: 'bg-amber-100/50', border: 'border-amber-200' 
    };
    return { 
      grade: 'Poor', hand: '👎', symbol: '💩', status: 'Messy', 
      desc: 'ים "מעוך", קצפים, כמעט חסר כוח גלישה.',
      color: 'text-red-600', bg: 'bg-red-100/50', border: 'border-red-200' 
    };
  };

  const getWaveHeightGrade = (height: number) => {
    if (height >= 2.0) return { score: 10, name: 'הירושימה / דאבל', hand: '🙌', symbol: '🌪️', color: 'text-purple-600', bg: 'bg-purple-100/50', border: 'border-purple-200' };
    if (height >= 1.6) return { score: 9, name: 'מעל הראש', hand: '🤙', symbol: '💨', color: 'text-emerald-600', bg: 'bg-emerald-100/50', border: 'border-emerald-200' };
    if (height >= 1.3) return { score: 8, name: 'גובה ראש', hand: '👍', symbol: '🌊', color: 'text-cyan-600', bg: 'bg-cyan-100/50', border: 'border-cyan-200' };
    if (height >= 1.1) return { score: 7, name: 'גובה כתף', hand: '👌', symbol: '🎯', color: 'text-blue-600', bg: 'bg-blue-100/50', border: 'border-blue-200' };
    if (height >= 0.9) return { score: 6, name: 'גובה חזה', hand: '🤘', symbol: '✨', color: 'text-indigo-600', bg: 'bg-indigo-100/50', border: 'border-indigo-200' };
    if (height >= 0.7) return { score: 5, name: 'גובה מותן (Waist)', hand: '🖐️', symbol: '🪵', color: 'text-amber-600', bg: 'bg-amber-100/50', border: 'border-amber-200' };
    if (height >= 0.4) return { score: 4, name: 'גובה ברך (Knee)', hand: '🤏', symbol: '🦵', color: 'text-orange-600', bg: 'bg-orange-100/50', border: 'border-orange-200' };
    if (height >= 0.2) return { score: 3, name: 'קרסול / קצף (Ankle)', hand: '🫳', symbol: '🦶', color: 'text-red-500', bg: 'bg-red-100/50', border: 'border-red-200' };
    if (height >= 0.1) return { score: 2, name: 'פלטה עם קפלים', hand: '🤏', symbol: '〰️', color: 'text-slate-500', bg: 'bg-slate-100/50', border: 'border-slate-200' };
    if (height > 0) return { score: 1, name: 'זכוכית (Glassy)', hand: '🤲', symbol: '🪟', color: 'text-slate-400', bg: 'bg-slate-100/50', border: 'border-slate-200' };
    return { score: 0, name: 'בריכה (Flat)', hand: '👎', symbol: '🏊‍♀️', color: 'text-slate-400', bg: 'bg-slate-100/50', border: 'border-slate-200' };
  };

  const uv = getUVLevel(data.uvIndex);
  const periodGrade = getPeriodGrade(data.wavePeriod);
  const heightGrade = getWaveHeightGrade(data.waveHeight);

  return (
    <div className="space-y-8 pb-12" dir="rtl">
      {/* Station Selector & Beach Links */}
      <div className="flex flex-col gap-6 mb-6">
        {/* Segmented Control for Stations */}
        <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-x-auto hide-scrollbar shadow-inner w-full">
          {stations.map((station) => {
            const isActive = selectedStationId === station.id;
            return (
              <button
                key={station.id}
                onClick={() => setSelectedStationId(station.id)}
                className={`relative flex-1 min-w-[80px] px-4 py-2.5 text-sm font-bold text-center rounded-xl transition-colors z-10 whitespace-nowrap flex items-center justify-center gap-2 ${
                  isActive ? 'text-cyan-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeStation"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50 -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600' : 'opacity-50'}`} />
                {station.name}
              </button>
            );
          })}
        </div>

        {/* Beach Links */}
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://beachcam.co.il/marina.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-black border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm"
          >
            <Video className="w-3 h-3" />
            מצלמת מרינה צפון
          </a>
          <a 
            href="https://gosurf.co.il/forecast/herzliya-marina" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm"
          >
            <ImageIcon className="w-3 h-3" />
            GoSurf מרינה צפון
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats Card */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="luxury-card p-8 lg:col-span-2 space-y-8 relative overflow-hidden"
          >
            <div className="grain-overlay" />
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[#00426a] flex items-center gap-3 tracking-tighter">
                    <Waves className="w-8 h-8 text-[#0071a1]" />
                    מצב הים - {data.location}
                  </h2>
                  <p className="text-[#00426a]/60 mt-1 flex items-center gap-2 font-medium text-sm">
                    <Activity className="w-4 h-4" />
                    עדכון אחרון: {new Date(data.timestamp).toLocaleTimeString('he-IL')}
                  </p>
                </div>
              </div>

              {/* Hero Stats: Wave Height & Period */}
              <div className="flex items-start justify-center gap-4 md:gap-8 mb-10 bg-gradient-to-b from-[#f0f8ff]/80 to-white border border-[#00426a]/10 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,66,106,0.04)] relative overflow-hidden">
                {/* Subtle background wave pattern */}
                <Waves className="absolute -bottom-12 -right-12 w-64 h-64 text-[#0071a1]/5 -rotate-12" />
                
                <div className="flex-1 flex flex-col items-center text-center relative z-10 group">
                  <span className="text-[#0071a1] text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5" />
                    גובה גלים
                  </span>
                  <div className="flex items-baseline gap-1.5 text-[#00426a] group-hover:scale-105 transition-transform duration-500">
                    <span className="text-7xl md:text-8xl font-black tracking-tighter leading-none drop-shadow-sm">{data.waveHeight === 0 ? '0' : Math.round(data.waveHeight * 100)}</span>
                    <span className="text-2xl font-bold opacity-60">ס״מ</span>
                  </div>
                  
                  {/* Height Grade UI */}
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${heightGrade.bg} border ${heightGrade.border} shadow-sm group-hover:scale-105 transition-transform duration-500 delay-75`}>
                      <span className="text-lg leading-none">{heightGrade.hand}</span>
                      <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${heightGrade.color}`}>
                        {heightGrade.score}/10 • {heightGrade.name}
                      </span>
                      <span className="text-lg leading-none">{heightGrade.symbol}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-px h-32 mt-4 bg-gradient-to-b from-transparent via-[#00426a]/15 to-transparent relative z-10" />
                
                <div className="flex-1 flex flex-col items-center text-center relative z-10 group">
                  <span className="text-[#0071a1] text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    מחזוריות
                  </span>
                  <div className="flex items-baseline gap-1.5 text-[#00426a] group-hover:scale-105 transition-transform duration-500">
                    <span className="text-7xl md:text-8xl font-black tracking-tighter leading-none drop-shadow-sm">{data.wavePeriod.toFixed(1)}</span>
                    <span className="text-2xl font-bold opacity-60">ש׳</span>
                  </div>
                  
                  {/* Period Grade UI */}
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${periodGrade.bg} border ${periodGrade.border} shadow-sm group-hover:scale-105 transition-transform duration-500 delay-75`}>
                      <span className="text-lg leading-none">{periodGrade.hand}</span>
                      <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${periodGrade.color}`}>
                        {periodGrade.grade} {periodGrade.status ? `• ${periodGrade.status}` : ''}
                      </span>
                      <span className="text-lg leading-none">{periodGrade.symbol}</span>
                    </div>
                    <p className={`text-[10px] md:text-[11px] font-bold ${periodGrade.color} opacity-80 max-w-[180px] leading-tight`}>
                      {periodGrade.desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center gap-2 text-slate-400 mb-2 group-hover:text-cyan-500 transition-colors">
                    <Wind className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">רוח</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{Math.round(data.windSpeed)}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">kts</span>
                  </div>
                  {data.windGusts > 0 && (
                    <div className="text-[10px] text-orange-600 font-black mt-1 uppercase tracking-wider">
                      משבים: {Math.round(data.windGusts)}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center gap-2 text-slate-400 mb-2 group-hover:text-cyan-500 transition-colors">
                    <Navigation className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">כיוון</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center transition-transform duration-700 shadow-lg shadow-cyan-200"
                      style={{ transform: `rotate(${data.windDirection}deg)` }}
                    >
                      <Navigation className="w-4 h-4 text-white fill-current" />
                    </div>
                    <span className="text-xl font-black text-slate-900">{data.windDirection}°</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{getWindDirText(data.windDirection)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center gap-2 text-slate-400 mb-2 group-hover:text-cyan-500 transition-colors">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">מים</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{data.waterTemp.toFixed(1)}°</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">C</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                    אוויר: {data.airTemp?.toFixed(1) || '--'}°C
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center gap-2 text-slate-400 mb-2 group-hover:text-cyan-500 transition-colors">
                    <Gauge className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">לחץ</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{data.pressure || '--'}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">hPa</span>
                  </div>
                  {data.rain > 0 && (
                    <div className="text-[10px] text-blue-600 font-black mt-1 uppercase tracking-wider flex items-center gap-1">
                      <Droplets className="w-2 h-2" />
                      גשם: {data.rain} מ"מ
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Wind Trend Graph */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="luxury-card p-8 relative overflow-hidden"
          >
            <div className="grain-overlay" />
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight">
              <TrendingUp className="w-6 h-6 text-cyan-600" />
              מגמת רוח (24 שעות אחרונות)
            </h3>
            <div className="h-72 w-full">
              {historyLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">טוען היסטוריה...</span>
                </div>
              ) : historyError ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                  <span className="text-sm font-bold text-slate-500">{historyError}</span>
                  <span className="text-xs text-slate-400 text-center max-w-xs">
                    {historyError.includes('Token missing') ? 'יש להגדיר IMS_API_TOKEN בהגדרות הסביבה (Environment Variables) של שרת הפרודקשן.' : 'לא ניתן לטעון נתוני היסטוריה כרגע.'}
                  </span>
                </div>
              ) : history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGusts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(t) => new Date(t).getHours() + ':00'} 
                      stroke="#94a3b8"
                      fontSize={10}
                      fontFamily="Inter"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      fontFamily="Inter"
                      unit=" kts" 
                      tickFormatter={(value) => Math.ceil(value).toString()}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      labelFormatter={(t) => new Date(t).toLocaleString('he-IL')}
                      formatter={(value: any) => [`${Math.ceil(Number(value || 0))} kts`]}
                      contentStyle={{ 
                        borderRadius: '20px', 
                        border: 'none', 
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                        padding: '12px'
                      }}
                      itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '10px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="windSpeed" 
                      name="רוח ממוצעת"
                      stroke="#0891b2" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorWind)" 
                      animationDuration={1500}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="windGusts" 
                      name="משבים"
                      stroke="#f97316" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1} 
                      fill="url(#colorGusts)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <Feather className="w-16 h-16 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">אין נתוני היסטוריה זמינים לתחנה זו</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar: Advice & Warnings */}
        <div className="space-y-8">
          {/* UV Advice Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 ${advice?.bg} bg-opacity-10 relative overflow-hidden group`}
          >
            <div className="absolute -top-6 -right-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              {advice?.icon}
            </div>
            <h3 className={`text-xl font-black mb-4 flex items-center gap-3 ${advice?.color} tracking-tight`}>
              <Sun className="w-6 h-6" />
              הגנה מהשמש (UV: {data.uvIndex})
            </h3>
            <p className={`text-sm leading-relaxed font-bold ${advice?.color}`}>
              {advice?.text}
            </p>
          </motion.div>

          {/* IMS Warnings */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="luxury-card p-8 relative overflow-hidden"
          >
            <div className="grain-overlay" />
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              אזהרות מטאורולוגיות
            </h3>
            <div className="space-y-4">
              {imsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
              ) : imsWarnings.length > 0 ? (
                imsWarnings.map((warning, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-3xl bg-red-50 border border-red-100 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-4 relative z-10">
                      <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-black text-red-900 uppercase tracking-tight">{warning.warningType || "אזהרה"}</h4>
                        <p className="text-xs font-bold text-red-700 mt-1 leading-relaxed">{warning.warningDescription || warning.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Feather className="w-16 h-16 text-emerald-100 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">אין אזהרות פעילות כרגע</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="flex justify-center mt-12">
        <div className="bg-white px-8 py-4 rounded-full border border-slate-100 shadow-xl flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            מקור: {data.dataSource}
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            תחנה: {data.location} ({data.stationId})
          </div>
        </div>
      </div>
    </div>
  );
};
