import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Waves, 
  Thermometer, 
  Navigation, 
  Loader2,
  Wind,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  Droplets,
  Activity,
  Gauge,
  ChevronRight,
  ChevronLeft,
  Calendar,
  MapPin,
  Clock,
  Video,
  ExternalLink,
  Sparkles,
  X,
  RefreshCw
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { safeLocalStorage } from '../utils/storage';
import { getForecastAnalysis } from '../services/geminiService';

export const surfSpots = [
  { id: 'haifa-bat-galim', name: 'חיפה - בת גלים', lat: 32.83, lon: 34.98, imsId: "26", cameraUrl: "https://beachcam.co.il/batgalim.html" },
  { id: 'haifa-dado', name: 'חיפה - דדו', lat: 32.79, lon: 34.95, imsId: "26", cameraUrl: "https://beachcam.co.il/meridian.html" },
  { id: 'haifa-zvulun', name: 'חיפה - זבולון', lat: 32.82, lon: 34.97, imsId: "26", cameraUrl: "https://beachcam.co.il/krayot.html" },
  { id: 'shavei-tzion', name: 'שבי ציון / נהריה', lat: 32.97, lon: 35.08, imsId: "343" },
  { id: 'michmoret', name: 'מכמורת / מכון ימי', lat: 32.40, lon: 34.86, imsId: "46" },
  { id: 'netanya-kontiki', name: 'נתניה - קונטיקי', lat: 32.33, lon: 34.84, imsId: "46", cameraUrl: "https://beachcam.co.il/kontiki.html" },
  { id: 'herzliya-zvulun', name: 'הרצליה - זבולון', lat: 32.17, lon: 34.79, imsId: "178", cameraUrl: "https://beachcam.co.il/zvulun.html" },
  { id: 'herzliya-marina', name: 'מרינה הרצליה', lat: 32.16, lon: 34.79, imsId: "178", cameraUrl: "https://beachcam.co.il/marina.html", cameraUrlAlt: "https://www.surfline.com/surf-report/marina-dan-acadia/5ff89a13956aa8cbc947c5aa?view=table" },
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

interface SurfDashboardProps {
  selectedSpotId?: string;
  setSelectedSpotId?: (id: string) => void;
  children?: React.ReactNode;
}

export const SurfDashboard: React.FC<SurfDashboardProps> = ({
  selectedSpotId: controlledSpotId,
  setSelectedSpotId: controlledSetSpotId,
  children,
}) => {
  const { coastalWeather, setSelectedStationId, isLoading: contextLoading } = useData();
  const [localSpotId, setLocalSpotId] = useState('herzliya-marina');
  
  const selectedSpotId = controlledSpotId !== undefined ? controlledSpotId : localSpotId;
  const setSelectedSpotId = controlledSetSpotId !== undefined ? controlledSetSpotId : setLocalSpotId;
  
  const [forecastData, setForecastData] = useState<any[]>(() => {
    try {
      const cached = safeLocalStorage.getItem(`cached_surf_forecast_herzliya-marina`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [forecastLoaded, setForecastLoaded] = useState(() => {
    try {
      const cached = safeLocalStorage.getItem(`cached_surf_forecast_herzliya-marina`);
      return !!(cached && JSON.parse(cached)?.length > 0);
    } catch {
      return false;
    }
  });
  const [forecastError, setForecastError] = useState<string | null>(null);

  // Derived current spot
  const activeSpot = useMemo(() => surfSpots.find(s => s.id === selectedSpotId) || surfSpots[7], [selectedSpotId]);

  // Sync Global IMS Station context when spot changes
  useEffect(() => {
    setSelectedStationId(activeSpot.imsId);
  }, [activeSpot.imsId, setSelectedStationId]);

  // Fetch forecast data specifically for the lat/lon
  useEffect(() => {
    let active = true;

    // Load spot-specific cached forecast immediately if available
    try {
      const cached = safeLocalStorage.getItem(`cached_surf_forecast_${activeSpot.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setForecastData(parsed);
          setForecastLoaded(true);
        }
      }
    } catch (e) {
      // ignore
    }

    const fetchForecast = async () => {
      setForecastError(null);
      try {
        let rawData: any = null;

        // 1. Try server proxy endpoint
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const response = await fetch(`/api/forecast/weekly?lat=${activeSpot.lat}&lon=${activeSpot.lon}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            rawData = await response.json();
          }
        } catch (e) {
          console.warn("Server forecast proxy fetch failed, attempting direct Open-Meteo fetch...");
        }

        // 2. Client-side direct Open-Meteo fallback if server proxy was unreachable
        if (!rawData?.daily?.time) {
          try {
            const directUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${activeSpot.lat}&longitude=${activeSpot.lon}&daily=wave_height_max,wave_direction_dominant,wave_period_max&timezone=Asia%2FJerusalem`;
            const directRes = await fetch(directUrl);
            if (directRes.ok) {
              rawData = await directRes.json();
            }
          } catch (e) {
            console.warn("Direct Open-Meteo forecast fetch failed:", e);
          }
        }

        if (!active) return;

        // 3. Process forecast data or generate synthetic realistic sequence
        const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        let processedDays: any[] = [];

        if (rawData?.daily?.time && Array.isArray(rawData.daily.time)) {
          processedDays = rawData.daily.time.map((timeStr: string, idx: number) => {
            const dateObj = new Date(timeStr);
            const dayName = idx === 0 ? 'היום' : daysOfWeek[dateObj.getDay()];
            const dateStrFormatted = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
            
            const rawMeters = rawData.daily.wave_height_max[idx] || 0;
            const period = rawData.daily.wave_period_max ? rawData.daily.wave_period_max[idx] || 0 : 0;
            const heightCm = Math.max(0, Math.round(rawMeters * 100));
            
            return {
              id: timeStr,
              dayName,
              dateStr: dateStrFormatted,
              heightCm,
              period,
              windDir: Math.round(rawData.daily.wave_direction_dominant[idx] || 0),
            };
          });
        } else {
          // Synthetic fallback if all networks fail
          const baseHeight = coastalWeather?.waveHeight ? Math.round(coastalWeather.waveHeight * 100) : 60;
          const now = new Date();
          for (let i = 1; i <= 6; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            const variation = Math.round(Math.sin(i * 0.9) * 20);
            processedDays.push({
              id: d.toISOString().split('T')[0],
              dayName: daysOfWeek[d.getDay()],
              dateStr,
              heightCm: Math.max(20, baseHeight + variation),
              period: 5.5,
              windDir: 295
            });
          }
        }
        
        // Take next 6 days (slice 1 to 7 if today was idx 0, or all if 6 days generated)
        const finalForecast = processedDays.length >= 7 ? processedDays.slice(1, 7) : processedDays.slice(0, 6);
        setForecastData(finalForecast);
        safeLocalStorage.setItem(`cached_surf_forecast_${activeSpot.id}`, JSON.stringify(finalForecast));
        setForecastLoaded(true);
      } catch (err) {
        if (!active) return;
        console.warn("Forecast processing fallback error:", err);
        setForecastLoaded(true);
      }
    };
    
    fetchForecast();
    return () => { active = false; };
  }, [activeSpot, coastalWeather?.waveHeight]);

  const getWaveConditionGrade = (height: number, period: number = 0) => {
    // Physical wave height in cm for intuitive Israeli surf scale calibration
    const cm = Math.round(height * 100);
    const isLongPeriod = period >= 6.5;
    const isShortPeriod = period > 0 && period < 4.5;

    // 1. Extreme / Storm (2.5m+)
    if (cm >= 250) {
      return { score: 10, name: 'ים סוער / אקסטרים', hand: '🙌', symbol: '🌪️', color: 'text-purple-600', bg: 'bg-purple-100/50', border: 'border-purple-200' };
    }
    
    // 2. Double Overhead / High Waves (1.85m - 2.5m)
    if (cm >= 185) {
      return { score: 9, name: 'דאבל אוברהד / עוצמתי', hand: '🤙', symbol: '💨', color: 'text-emerald-600', bg: 'bg-emerald-100/50', border: 'border-emerald-200' };
    }

    // 3. Overhead / Head+ (1.35m - 1.85m)
    if (cm >= 135) {
      return { 
        score: 8, 
        name: isLongPeriod ? 'ראש + / קירות פתוחים' : 'גובה ראש + (Overhead)', 
        hand: '👍', 
        symbol: '🌊', 
        color: 'text-cyan-600', 
        bg: 'bg-cyan-100/50', 
        border: 'border-cyan-200' 
      };
    }
    
    // 4. Head High (1.05m - 1.35m / 110-135cm) - Classic 120cm Israeli Surf
    if (cm >= 105) {
      return { 
        score: isLongPeriod ? 7 : 6, 
        name: isLongPeriod ? 'גובה ראש / מנוע ארוך' : isShortPeriod ? 'גובה ראש / סוול צפוף' : 'גובה ראש (Head High)', 
        hand: '🤘', 
        symbol: '✨', 
        color: 'text-indigo-600', 
        bg: 'bg-indigo-100/50', 
        border: 'border-indigo-200' 
      };
    }

    // 5. Chest High (75cm - 105cm)
    if (cm >= 75) {
      return { 
        score: isLongPeriod ? 6 : 5, 
        name: isLongPeriod ? 'גובה חזה / קירות מסודרים' : 'גובה חזה (Chest High)', 
        hand: '🖐️', 
        symbol: '🪵', 
        color: 'text-blue-600', 
        bg: 'bg-blue-100/50', 
        border: 'border-blue-200' 
      };
    }

    // 6. Waist High (45cm - 75cm)
    if (cm >= 45) {
      return { 
        score: 4, 
        name: isLongPeriod ? 'גובה מותן / גל ארוך' : 'גובה מותן (Waist High)', 
        hand: '🤏', 
        symbol: '🦵', 
        color: 'text-amber-600', 
        bg: 'bg-amber-100/50', 
        border: 'border-amber-200' 
      };
    }

    // 7. Knee High (25cm - 45cm)
    if (cm >= 25) {
      return { 
        score: 3, 
        name: 'גובה ברך (Knee High)', 
        hand: '🫳', 
        symbol: '🦶', 
        color: 'text-orange-500', 
        bg: 'bg-orange-100/50', 
        border: 'border-orange-200' 
      };
    }

    // 8. Ankle / Ripples (10cm - 25cm)
    if (cm >= 10) {
      return { 
        score: 2, 
        name: 'קרסול / קצף (Ankle)', 
        hand: '🤏', 
        symbol: '〰️', 
        color: 'text-slate-500', 
        bg: 'bg-slate-100/50', 
        border: 'border-slate-200' 
      };
    }

    // 9. Flat / Glassy (< 10cm)
    if (cm > 0) {
      return { 
        score: 1, 
        name: 'זכוכית (Glassy)', 
        hand: '🤲', 
        symbol: '🪟', 
        color: 'text-slate-400', 
        bg: 'bg-slate-100/50', 
        border: 'border-slate-200' 
      };
    }

    return { 
      score: 0, 
      name: 'בריכה (Flat)', 
      hand: '👎', 
      symbol: '🏊‍♀️', 
      color: 'text-slate-400', 
      bg: 'bg-slate-100/50', 
      border: 'border-slate-200' 
    };
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

  const effectiveHourlyUv = useMemo(() => {
    if (coastalWeather?.hourlyUv && Array.isArray(coastalWeather.hourlyUv) && coastalWeather.hourlyUv.length > 0) {
      return coastalWeather.hourlyUv;
    }
    const currentUv = coastalWeather?.uvIndex ? Math.round(coastalWeather.uvIndex) : 5;
    const hours: { hour: string; uv: number }[] = [];
    for (let h = 7; h <= 19; h++) {
      const hStr = String(h).padStart(2, '0');
      const dist = Math.abs(h - 13);
      const factor = Math.max(0, 1 - (dist / 6) ** 2);
      hours.push({ hour: hStr, uv: Math.round(currentUv * factor) });
    }
    return hours;
  }, [coastalWeather?.hourlyUv, coastalWeather?.uvIndex]);

  // Weather condition & season indicator for Air Temp
  const airWeatherState = useMemo(() => {
    const temp = coastalWeather?.airTemp ?? 24;
    const rain = coastalWeather?.rain ?? 0;
    const uv = coastalWeather?.uvIndex ?? 5;

    if (rain > 0.1) {
      return {
        icon: CloudRain,
        title: 'גשם מקומי',
        seasonHint: 'גשום',
        color: 'text-blue-600',
        badgeBg: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
        watermarkColor: 'text-blue-400/[0.12]',
        cardBorder: 'border-blue-200/80',
        cardBg: 'from-blue-50/80 via-slate-50/70 to-indigo-50/40'
      };
    }
    if (temp < 16) {
      return {
        icon: Cloud,
        title: 'מעונן וקריר',
        seasonHint: 'עונת חורף',
        color: 'text-slate-600',
        badgeBg: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
        watermarkColor: 'text-slate-400/[0.12]',
        cardBorder: 'border-slate-200/80',
        cardBg: 'from-slate-100/80 via-slate-50/70 to-sky-50/40'
      };
    }
    if (uv >= 6 || temp >= 28) {
      return {
        icon: Sun,
        title: 'שמשי וחם',
        seasonHint: 'עונת קיץ',
        color: 'text-amber-600',
        badgeBg: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
        watermarkColor: 'text-amber-400/[0.14]',
        cardBorder: 'border-amber-200/80',
        cardBg: 'from-amber-50/80 via-slate-50/70 to-orange-50/40'
      };
    }
    // Transitional / Fair (Spring / Autumn)
    return {
      icon: CloudSun,
      title: 'בהיר ונעים',
      seasonHint: 'עונת מעבר',
      color: 'text-amber-600',
      badgeBg: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      watermarkColor: 'text-amber-400/[0.14]',
      cardBorder: 'border-amber-200/80',
      cardBg: 'from-amber-50/70 via-slate-50/70 to-sky-50/40'
    };
  }, [coastalWeather?.airTemp, coastalWeather?.rain, coastalWeather?.uvIndex]);

  const waterFeelText = useMemo(() => {
    const temp = coastalWeather?.waterTemp ?? 24;
    if (temp >= 28) return 'חמים מאוד';
    if (temp >= 25) return 'נעים לרחצה';
    if (temp >= 22) return 'מרענן';
    if (temp >= 19) return 'קריר (שורטי)';
    return 'קר (חליפה)';
  }, [coastalWeather?.waterTemp]);

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

  // 🏄‍♂️ Intelligent Recommendation Engine (Single Unified Text)
  const generateDeterministicAdvice = useCallback((hCm: number, wKts: number, wDir: number, wTemp: number, spotName: string) => {
    const isOffshore = wDir >= 45 && wDir <= 135;
    const isOnshore = wDir >= 225 && wDir <= 315;
    const windImpact = isOffshore ? 'רוח מזרחית (Offshore) • ים נקי ומסודר 🪞' : (isOnshore ? 'רוח מערבית (Onshore) • ים צ׳ופי 🌊' : 'רוח צדדית (Cross-shore)');

    let suitAdvice = 'בגד ים / לייקרה';
    if (wTemp < 19) suitAdvice = 'חליפת חורף מלאה 3/2 מ״מ';
    else if (wTemp < 22) suitAdvice = 'חליפת מעבר / שורטי 2 מ״מ';
    else if (wTemp < 25) suitAdvice = 'לייקרה / חולצת ניאופרן';

    let suitabilityLevel = 'מתאים לגלישה';
    let verdictEmoji = '🏄';
    let verdictColor = 'bg-cyan-500/10 text-cyan-800 border-cyan-500/30';
    let text = '';

    if (hCm >= 180 || wKts > 22) {
      suitabilityLevel = 'סוער - למנוסים ומקצועיים בלבד';
      verdictEmoji = '⚠️';
      verdictColor = 'bg-rose-500/10 text-rose-800 border-rose-500/30';
      text = `הים ב${spotName} גבוה וסוער עם גלים של כ-${hCm} ס״מ ורוח של ${Math.round(wKts)} קשר. הזרמים חזקים במיוחד והכניסה מומלצת לגולשים מנוסים ומקצועיים בלבד. חובה להישמע להנחיות הבטיחות.`;
    } else if (hCm >= 50 && wKts <= 14) {
      suitabilityLevel = 'מומלץ מאוד לגלישה';
      verdictEmoji = '🔥';
      verdictColor = 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30';
      text = `תנאי גלישה מעולים ב${spotName}! גל עובד יפה בגובה כ-${hCm} ס״מ עם פנים נקיות ורוח נוחה של כ-${Math.round(wKts)} קשר. הגלים זורמים ומזמינים לכל סוגי הגלשנים — שורט, פאן או לונגבורד. זמן מצוין להיכנס למים!`;
    } else if (hCm >= 30) {
      suitabilityLevel = 'מתאים לסופט ולונגבורד';
      verdictEmoji = '🏄';
      verdictColor = 'bg-cyan-500/10 text-cyan-800 border-cyan-500/30';
      text = `תנאי ים רגועים וגליים ב${spotName} בגובה של כ-${hCm} ס״מ. גלים אידיאליים לאימון טכניקה, תפיסת גלים וגלישה זורמת על גלשני סופטבורד, פאן בורד או לונגבורד קלאסי.`;
    } else {
      suitabilityLevel = 'ים שקט - מתאים לסאפ ושחייה';
      verdictEmoji = '🧘';
      verdictColor = 'bg-amber-500/10 text-amber-800 border-amber-500/30';
      text = `הים ב${spotName} שקט עד פלטה (${hCm} ס״מ). תנאים מצוינים לחתירת סאפ (SUP), שחייה במים פתוחים או אימון כושר וחתירה.`;
    }

    return {
      text,
      suitabilityLevel,
      verdictEmoji,
      verdictColor,
      windImpact,
      suitAdvice
    };
  }, []);

  const [recommendation, setRecommendation] = useState<{
    text: string;
    timeStr: string;
    timestamp: number;
    suitabilityLevel: string;
    verdictEmoji: string;
    verdictColor: string;
    windImpact: string;
    suitAdvice: string;
  } | null>(() => {
    try {
      const cached = safeLocalStorage.getItem(`surf_recommendation_${selectedSpotId}`);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return null;
  });

  const [isUpdatingRec, setIsUpdatingRec] = useState(false);

  const updateRecommendation = useCallback(async (force = false) => {
    const spotName = activeSpot.name;
    const hCm = currentWaveCm;
    const wKts = coastalWeather ? coastalWeather.windSpeed : 8;
    const wDir = coastalWeather ? coastalWeather.windDirection : 90;
    const wTemp = coastalWeather ? coastalWeather.waterTemp : 24;

    const baseAdvice = generateDeterministicAdvice(hCm, wKts, wDir, wTemp, spotName);
    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // If cached within 15 minutes and not forced, use cache
    if (!force) {
      try {
        const cachedStr = safeLocalStorage.getItem(`surf_recommendation_${selectedSpotId}`);
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (now - parsed.timestamp < 15 * 60 * 1000) {
            setRecommendation(parsed);
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    // Set immediate base recommendation so user sees zero delay
    const initialRec = {
      ...baseAdvice,
      timeStr,
      timestamp: now
    };
    setRecommendation(initialRec);
    safeLocalStorage.setItem(`surf_recommendation_${selectedSpotId}`, JSON.stringify(initialRec));

    // Refine in background with AI surf guru advice
    setIsUpdatingRec(true);
    try {
      const aiText = await getForecastAnalysis({
        waveHeight: hCm / 100,
        waterTemp: wTemp,
        windSpeed: wKts,
        windDir: getWindDirText(wDir),
        beachName: spotName
      });

      if (aiText && aiText.trim().length > 15) {
        const cleanAiText = aiText.replace(/\*\*/g, '').trim();
        const updated = {
          ...baseAdvice,
          text: cleanAiText,
          timeStr,
          timestamp: now
        };
        setRecommendation(updated);
        safeLocalStorage.setItem(`surf_recommendation_${selectedSpotId}`, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Auto-update surf recommendation fallback active", e);
    } finally {
      setIsUpdatingRec(false);
    }
  }, [activeSpot.name, currentWaveCm, coastalWeather, generateDeterministicAdvice, selectedSpotId]);

  // Auto-update every time spot changes or coastalWeather is refreshed
  useEffect(() => {
    updateRecommendation(false);
  }, [selectedSpotId, coastalWeather?.timestamp]);

  // Periodic 15-minute auto update
  useEffect(() => {
    const timer = setInterval(() => {
      updateRecommendation(true);
    }, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [updateRecommendation]);

  return (
    <div className="relative space-y-6 pb-12 p-2 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-slate-800" dir="rtl">
      
      {/* 🌊 UNIFIED MASTER OBJECT: מצב הים עכשיו והתאמה לגלישה */}
      <div className="luxury-card p-6 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden transition-all border-2 border-[#007085]/20">
        <div className="grain-overlay" />
        <Waves className="absolute -bottom-10 -left-10 w-[450px] h-[450px] text-sky-500/[0.04] -rotate-12 pointer-events-none" />
        <div className="premium-sweep-fx opacity-20" />

        {/* 1. Master Header: Unified Title + Embedded Spot Selector */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/60 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#007085]/20 to-sky-400/20 text-[#007085] rounded-2xl flex items-center justify-center border border-[#007085]/30 shadow-sm shrink-0">
              <Waves size={32} className="text-[#007085]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#002b44] tracking-tight font-yehuda">
                  מצב הים עכשיו והתאמה לגלישה
                </h3>
                <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-[#007085] mt-1">
                כל הנתונים החיוניים לקבלת החלטה על כניסה למים: גלים, רוח, טמפרטורה והתאמה לגלישה
              </p>
            </div>
          </div>

          {/* Controls: Spot Selector Dropdown */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 bg-slate-50/90 backdrop-blur-md border border-[#007085]/25 rounded-2xl p-2 pl-3 shadow-inner">
              <div className="flex items-center gap-2 pr-3 text-[#007085] shrink-0">
                <MapPin size={18} className="text-[#007085]" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#007085] whitespace-nowrap">בחירת ספוט:</span>
              </div>
              <div className="relative">
                <select
                  value={selectedSpotId}
                  onChange={(e) => setSelectedSpotId(e.target.value)}
                  className="bg-white border border-slate-200/90 text-[#002b44] rounded-xl px-5 py-3 text-sm sm:text-base font-black outline-none focus:ring-2 focus:ring-[#007085] hover:border-[#007085]/50 transition-all shadow-sm appearance-none cursor-pointer pr-10 pl-6"
                >
                  {surfSpots.map(spot => (
                    <option key={spot.id} value={spot.id} className="text-[#002b44] font-bold text-base">
                      🌊 {spot.name}
                    </option>
                  ))}
                </select>
                <div className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none text-[#007085]">
                  <ChevronRight size={18} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 🌟 Unified Single Recommendation Card (מתעדכן בכל שינוי חוף או כל 15 דקות) */}
        {recommendation && (
          <div className="relative z-10 mb-8 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 rounded-[2rem] p-6 sm:p-8 border border-sky-100 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl p-2.5 bg-white rounded-2xl shadow-2xs border border-slate-100 shrink-0">
                  {recommendation.verdictEmoji}
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-black border ${recommendation.verdictColor}`}>
                    {recommendation.suitabilityLevel}
                  </span>
                  <h4 className="text-base sm:text-xl font-black text-[#002b44] tracking-tight font-yehuda">
                    המלצת גלישה ל{activeSpot.name}
                  </h4>
                </div>
              </div>

              {/* "עדכון אחרון: שעה" in small text as requested */}
              <div className="flex items-center gap-2.5 self-end sm:self-center">
                {isUpdatingRec && (
                  <Loader2 size={15} className="animate-spin text-[#007085]" />
                )}
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/70 shadow-2xs">
                  <Clock size={14} className="text-[#007085]" />
                  <span>עדכון אחרון: {recommendation.timeStr}</span>
                </div>
                <button
                  onClick={() => updateRecommendation(true)}
                  disabled={isUpdatingRec}
                  title="רענן ניתוח עכשיו"
                  className="p-2 text-slate-500 hover:text-[#007085] hover:bg-white rounded-xl transition-all cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw size={14} className={isUpdatingRec ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* The Unified Expert Surf Recommendation Text - Large, readable and styled like DailySurfRecommendation */}
            <div className="text-base sm:text-lg md:text-xl font-bold text-[#002b44]/95 leading-relaxed font-yehuda py-2">
              <p className="whitespace-pre-line">
                {recommendation.text}
              </p>
            </div>
          </div>
        )}

        {/* 4. Main Metrics Grid (All inside this unified card) */}
        {contextLoading ? (
          <div className="h-64 flex flex-col items-center justify-center relative">
            <Loader2 className="animate-spin text-sky-500 mb-4" size={32} />
            <p className="text-base font-bold text-slate-500">חוקר את הים ומעדכן נתונים בזמן אמת...</p>
          </div>
        ) : coastalWeather ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedSpotId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: מצב הגלים והמדדים (8 cols) */}
              <div className="lg:col-span-8 flex flex-col justify-between gap-6">
                <div>
                  <div className="flex flex-col gap-4 w-full">
                    {/* 1. Formula Score Box (כרטיס דירוג התאמה לגלישה) - מעל כרטיס גובה הגלים */}
                    <div className={`flex flex-col justify-center items-center xl:items-start p-6 sm:p-8 rounded-[2rem] border-2 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl w-full relative overflow-hidden group flex-1 ${currentCondition.bg} ${currentCondition.border.replace('/40','').replace('/50','')}`}>
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/30 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                      
                      <p className={`text-xs sm:text-sm font-black uppercase tracking-wider opacity-90 mb-2 relative z-10 ${currentCondition.color}`}>דירוג התאמה לגלישה (Douglas / AI)</p>
                      
                      <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full">
                        {/* Score Value Component */}
                        <div className="flex items-baseline gap-1" dir="ltr">
                          <span className={`text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none drop-shadow-sm font-yehuda ${currentCondition.color}`}>{currentCondition.score}</span>
                          <span className="text-2xl md:text-3xl font-black text-slate-400">/10</span>
                        </div>
                        
                        <div className="w-px h-16 bg-black/10 mx-1"></div>
                        
                        {/* Name and Icon */}
                        <div className="flex flex-col items-center xl:items-start flex-1 w-full relative z-10 overflow-hidden">
                          <span className="text-3xl sm:text-4xl md:text-5xl drop-shadow-sm mb-1">{currentCondition.hand}</span>
                          <span className={`font-black text-xl sm:text-2xl md:text-3xl leading-tight text-center xl:text-right font-yehuda ${currentCondition.color}`}>{currentCondition.name}</span>
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
                              className={`flex-1 flex items-center justify-center py-2.5 text-xs sm:text-sm font-black transition-all duration-500 ${bgClass} ${isActive ? 'scale-110 shadow-lg z-20 rounded-lg transform' : 'opacity-80'}`} 
                            >
                              {s}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Swell Height Box (כרטיס גובה הגלים) - מתחת לכרטיס הדירוג */}
                    <div className="flex flex-col sm:flex-row justify-between items-center p-6 sm:p-8 bg-slate-50/70 rounded-[2rem] border border-slate-200/80 shadow-inner w-full relative overflow-hidden group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex flex-col items-center sm:items-start">
                        <p className="text-[#007085] text-xs sm:text-sm font-black uppercase tracking-[0.2em] mb-2 relative z-10">גובה הגלים (Swell)</p>
                        <div className="flex items-baseline gap-2 relative z-10">
                          <span className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none text-[#002b44] font-yehuda">{currentWaveCm}</span>
                          <span className="text-3xl sm:text-4xl text-[#007085] font-black -translate-y-2">ס״מ</span>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-0 flex items-center gap-3 bg-white/80 backdrop-blur-xs px-5 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <Waves size={24} className="text-[#007085]" />
                        <div className="text-right">
                          <p className="text-xs font-black text-[#007085] uppercase tracking-wider">מצב הים</p>
                          <p className="text-sm sm:text-base font-black text-[#002b44] font-yehuda">{currentCondition.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Beach Cameras Section (if available) */}
                {((activeSpot as any).cameraUrl || (activeSpot as any).cameraUrlAlt) && (
                  <div className="flex gap-3 w-full">
                    {(activeSpot as any).cameraUrl && (
                      <a
                        href={(activeSpot as any).cameraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white/70 backdrop-blur-md rounded-[1.5rem] border border-slate-200/70 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:bg-white transition-all duration-300 p-4 flex items-center justify-center gap-3.5 group relative overflow-hidden"
                      >
                        <div className="w-12 h-12 rounded-[1rem] bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 shadow-2xs border border-sky-100">
                          <Video strokeWidth={1.5} className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col text-right">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <p className="text-sm sm:text-base font-black text-[#002b44] tracking-tight">{(activeSpot as any).cameraUrlAlt ? 'מצלמה 1' : 'מצלמת חוף'}</p>
                          </div>
                          <p className="text-xs sm:text-sm text-[#007085] font-bold tracking-wider">{(activeSpot as any).cameraUrlAlt ? 'החוף המרכזי' : 'שידור חי'}</p>
                        </div>
                      </a>
                    )}

                    {(activeSpot as any).cameraUrlAlt && (
                      <a
                        href={(activeSpot as any).cameraUrlAlt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-white/70 backdrop-blur-md rounded-[1.5rem] border border-slate-200/70 shadow-2xs hover:shadow-md hover:-translate-y-0.5 hover:bg-white transition-all duration-300 p-4 flex items-center justify-center gap-3.5 group relative overflow-hidden"
                      >
                        <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-2xs border border-emerald-100">
                          <Video strokeWidth={1.5} className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col text-right">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <p className="text-sm sm:text-base font-black text-[#002b44] tracking-tight">מצלמה 2 (Surfline)</p>
                          </div>
                          <p className="text-xs sm:text-sm text-[#007085] font-bold tracking-wider">החוף הימני</p>
                        </div>
                      </a>
                    )}
                  </div>
                )}

                {/* The 3 Sub-Parameters in Glass UI */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-auto">
                  {/* Period */}
                  <div className="bg-slate-50/80 shadow-inner border border-slate-200/70 rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-5 flex flex-col justify-center hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                    <Activity className="absolute -left-2 -bottom-2 w-12 h-12 text-sky-500/10 group-hover:scale-110 transition-transform duration-500" />
                    <p className="text-[#007085] text-xs sm:text-sm font-black uppercase tracking-wider mb-2 leading-tight">זמן מחזור<br/><span className="hidden sm:inline">(Period)</span></p>
                    <div className="flex items-baseline gap-1 relative z-10">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#002b44] font-yehuda">{coastalWeather.wavePeriod.toFixed(1)}</span>
                      <span className="text-sm sm:text-base font-black text-[#007085]">שניות</span>
                    </div>
                  </div>

                  {/* Wind */}
                  <div className={`shadow-inner border border-slate-200/70 rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-5 flex flex-col justify-center hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group 
                    ${windStats?.bg.includes('emerald') ? 'bg-emerald-50/70' : ''}
                    ${windStats?.bg.includes('rose') ? 'bg-rose-50/70' : ''}
                    ${windStats?.bg.includes('amber') ? 'bg-amber-50/70' : ''}
                    ${!windStats ? 'bg-slate-50/80' : ''}
                  `}>
                    <Wind className={`absolute -left-2 -bottom-2 w-12 h-12 opacity-10 group-hover:scale-110 transition-transform duration-500 ${windStats?.bg.includes('emerald') ? 'text-emerald-400' : windStats?.bg.includes('rose') ? 'text-rose-400' : 'text-amber-400'}`} />
                    <p className="text-[#007085] text-xs sm:text-sm font-black uppercase tracking-wider mb-2 leading-tight">רוח <span className="hidden sm:inline">(Wind)</span></p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 xl:gap-2.5 relative z-10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#002b44] font-yehuda">{Math.round(coastalWeather.windSpeed)}</span>
                        <span className="text-sm sm:text-base font-black text-[#007085]">קשר</span>
                      </div>
                      
                      <div className={`inline-flex max-w-max items-center gap-1.5 px-2.5 py-1 rounded-lg mt-1 sm:mt-0 shadow-inner ${windStats?.bg.replace('100/40','500/20').replace('100/50','500/20')}`}>
                        <Navigation size={12} style={{ transform: `rotate(${coastalWeather.windDirection}deg)` }} className={`fill-current shrink-0 ${windStats?.color}`} />
                        <span className={`text-xs sm:text-sm font-black ${windStats?.color}`}>{getWindDirText(coastalWeather.windDirection)}</span>
                      </div>
                    </div>
                    <p className={`text-xs sm:text-sm font-bold mt-2 max-w-full truncate ${windStats?.color}`}>
                      {windStats?.label}
                    </p>
                  </div>

                  {/* Swell Direction */}
                  <div className="bg-slate-50/80 shadow-inner border border-slate-200/70 rounded-[1.25rem] sm:rounded-[1.5rem] p-3.5 sm:p-5 flex flex-col justify-center hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                    <Navigation className="absolute -left-2 -bottom-2 w-12 h-12 text-sky-500/10 group-hover:scale-110 transition-transform duration-500" />
                    <p className="text-[#007085] text-xs sm:text-sm font-black uppercase tracking-wider mb-2 leading-tight">כיוון סוואל</p>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2.5 relative z-10 mt-1">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center transform transition-transform shadow-inner"
                        style={{ transform: `rotate(${coastalWeather.waveDirection || 0}deg)` }}
                      >
                        <Navigation className="w-4 h-4 md:w-5 md:h-5 text-sky-600 fill-current" />
                      </div>
                      <span className="text-sm sm:text-base md:text-xl font-black text-[#002b44] uppercase leading-none mt-1 sm:mt-0 font-yehuda">
                        {getWindDirText(coastalWeather.waveDirection || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: טמפ׳ המים & מדד קרינה (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                {/* 🌊 & ☀️ Symmetrical Dual Temperature Cards: Water Temp & Air Temp */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                  {/* 🌊 Card 1: טמפ׳ מים (Sea Temperature) */}
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-sky-50/80 via-slate-50/70 to-cyan-50/50 rounded-[2rem] border border-sky-200/80 shadow-inner relative overflow-hidden flex flex-col justify-between hover:bg-white hover:shadow-md transition-all group min-h-[185px]">
                    {/* Watermark: Waves / Water icon behind the numbers */}
                    <div className="absolute -left-4 -bottom-4 text-sky-400/[0.12] pointer-events-none group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <Waves size={130} />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-[#007085] mb-3 font-yehuda">
                        <div className="p-2 bg-[#007085]/10 rounded-xl border border-[#007085]/20 shrink-0">
                          <Droplets size={18} className="text-[#007085]" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs sm:text-sm font-black uppercase tracking-wider leading-none block text-[#007085]">טמפ׳ מים</span>
                          <span className="text-[10px] text-slate-400 font-bold tracking-tight">ים תיכון (Sea)</span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 my-1 sm:my-2">
                        <span className="text-3xl sm:text-5xl md:text-6xl font-black text-[#002b44] font-yehuda tracking-tighter leading-none">
                          {coastalWeather.waterTemp.toFixed(1)}
                        </span>
                        <span className="text-base sm:text-2xl font-black text-[#007085] -translate-y-1">°C</span>
                      </div>
                    </div>

                    <div className="relative z-10 mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-sky-100 flex items-center justify-between text-right">
                      <span className="text-[11px] sm:text-xs font-black text-[#007085]">
                        {waterFeelText}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">חיישן ימי</span>
                    </div>
                  </div>

                  {/* ☀️/☁️/🌧️ Card 2: טמפ׳ אוויר (Air Temperature with dynamic weather icon) */}
                  <div className={`p-4 sm:p-6 bg-gradient-to-br ${airWeatherState.cardBg} rounded-[2rem] border ${airWeatherState.cardBorder} shadow-inner relative overflow-hidden flex flex-col justify-between hover:bg-white hover:shadow-md transition-all group min-h-[185px]`}>
                    {/* Watermark: Dynamic seasonal / weather icon behind the numbers */}
                    <div className={`absolute -left-4 -bottom-4 ${airWeatherState.watermarkColor} pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                      <airWeatherState.icon size={130} />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3 font-yehuda">
                        <div className={`p-2 rounded-xl border shrink-0 ${airWeatherState.badgeBg}`}>
                          <airWeatherState.icon size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs sm:text-sm font-black uppercase tracking-wider leading-none block text-slate-800">טמפ׳ אוויר</span>
                          <span className="text-[10px] text-slate-400 font-bold tracking-tight">חוף הים (Air)</span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 my-1 sm:my-2">
                        <span className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-800 font-yehuda tracking-tighter leading-none">
                          {Math.round(coastalWeather.airTemp)}
                        </span>
                        <span className={`text-base sm:text-2xl font-black ${airWeatherState.color} -translate-y-1`}>°C</span>
                      </div>
                    </div>

                    <div className="relative z-10 mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-right">
                      <span className={`text-[11px] sm:text-xs font-black ${airWeatherState.color}`}>
                        {airWeatherState.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{airWeatherState.seasonHint}</span>
                    </div>
                  </div>
                </div>

                {/* UV Index Sub-Card */}
                <div className="p-6 sm:p-8 bg-slate-50/70 rounded-[2rem] border border-slate-200/80 shadow-inner relative overflow-hidden flex flex-col justify-between hover:bg-white hover:shadow-md transition-all">
                  <div className="absolute -left-8 -bottom-8 opacity-5 blur-xs pointer-events-none">
                    <Sun size={160} className="text-amber-400" />
                  </div>

                  <div className="relative z-10 flex flex-col items-start gap-3.5 mb-4">
                    <div className="flex items-center gap-2 text-amber-700 font-yehuda">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl">
                        <Sun size={22} />
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-[#002b44] tracking-tight leading-none">מדד קרינה (UV)</h4>
                    </div>

                    <div className="flex items-center gap-3 text-sm sm:text-base text-slate-700 leading-none">
                      <span className="font-bold text-sm">עכשיו:</span>
                      <div className={`w-9 h-9 flex items-center justify-center font-black text-base rounded-xl shadow-2xs border border-white/50 ${getUvColor(Math.round(coastalWeather.uvIndex))}`}>
                        {Math.round(coastalWeather.uvIndex)}
                      </div>
                      <span className="font-black text-[#002b44] text-sm sm:text-base">{getUvText(Math.round(coastalWeather.uvIndex))}</span>
                    </div>
                  </div>

                  {effectiveHourlyUv && effectiveHourlyUv.length > 0 && (
                    <div className="relative z-10 mb-4 w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200/70">
                      <div className="flex w-full">
                        {effectiveHourlyUv.map((hr: any) => (
                          <div key={`uv-${hr.hour}`} className={`flex-1 flex items-center justify-center py-2 text-xs sm:text-sm font-black ${getUvColor(hr.uv)}`}>
                            {hr.uv}
                          </div>
                        ))}
                      </div>
                      <div className="flex w-full bg-slate-100/90 backdrop-blur-xs">
                        {effectiveHourlyUv.map((hr: any) => (
                          <div key={`hr-${hr.hour}`} className="flex-1 flex items-center justify-center py-1.5 text-slate-600 text-xs font-black tracking-tight">
                            {hr.hour}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 text-center text-slate-500 text-xs sm:text-sm font-bold pt-3 border-t border-slate-200/60 uppercase tracking-wider leading-tight">
                    0-2: בטוח &bull; 3-7: הגנה מומלצת &bull; 8+: הגנה חובה
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="p-8 text-center text-rose-500 font-bold bg-rose-50/50 rounded-2xl border border-rose-100">
            שגיאה בטעינת נתוני הלייב מהתחנות הימיות.
          </div>
        )}
      </div>

      {/* 🏄‍♂️ Personalized Gear & Wetsuit Slot (e.g. DailySurfRecommendation) */}
      {children}

      {/* 🍱 BENTO 4: The Horizon Timeline (Forecast) */}
      <div className="luxury-card p-6 md:p-8 relative overflow-hidden transition-all">
        <div className="grain-overlay" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-2xl border border-sky-500/20 shadow-sm">
            <Calendar size={20} />
          </div>
          <h4 className="text-2xl font-black text-slate-800 tracking-tighter font-yehuda">תחזית החופים לימים הקרובים</h4>
        </div>

        {!forecastLoaded && forecastData.length === 0 ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-sky-500" size={32} />
          </div>
        ) : forecastError && forecastData.length === 0 ? (
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
