
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ruler, 
  Weight, 
  Trophy, 
  Waves, 
  Info, 
  ChevronRight, 
  Sparkles,
  Zap,
  Hammer,
  Pencil,
  Target,
  Lightbulb,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MessageSquareQuote
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateSurferFormula, calculateMatchScore, calculateMatchScoreDetails } from '../utils/surfMath';
import { SurfboardOverlay, ExactSurfboard } from '../components/SurfboardOverlay';
import WetsuitSVG from '../components/WetsuitSVG';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { getShaperConsultation } from '../services/geminiService';
import Markdown from 'react-markdown';

const POPULAR_SURFBOARD_TYPES = [
  'Beginner Softboard (Soft-Top / Foamie)',
  'Performance Softboard',
  'Longboard (9\'0"+)',
  'Mini Mal / Malibu',
  'Funboard / Egg',
  'Midlength (7\'0" - 8\'0")',
  'Fish / Retro Fish',
  'Hybrid / Groveler',
  'Shortboard (Performance)',
  'High-Performance Shortboard (HPSB)'
];

const ShaperPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser } = useAuth();
  const { updateMember, seaStats, coastalWeather, siteConfig } = useData();
  
  const initialWeight = currentUser?.weight ? (currentUser.weight < 10 ? currentUser.weight * 10 : currentUser.weight) : 75;
  const initialHeight = currentUser?.height ? (currentUser.height < 3 ? currentUser.height * 100 : currentUser.height) : 175;
  
  const [weight, setWeight] = useState<number>(initialWeight);
  const [height, setHeight] = useState<number>(initialHeight);
  const [level, setLevel] = useState<'Learner' | 'Beginner' | 'Intermediate' | 'Advanced'>(
    (currentUser?.surfingLevel as any) || 'Intermediate'
  );
  const [fitnessLevel, setFitnessLevel] = useState<'Low' | 'Average' | 'High' | 'Elite'>(
    (currentUser?.fitnessLevel as any) || 'Average'
  );
  const [currentVol, setCurrentVol] = useState<number | undefined>(currentUser?.currentBoardVolume);
  const [currentLen, setCurrentLen] = useState<string | undefined>(currentUser?.currentBoardLength);
  const [currentType, setCurrentType] = useState<string>(
    currentUser?.currentBoardType || POPULAR_SURFBOARD_TYPES[0]
  );
  
  const waterTempRaw = seaStats?.waterTemp ?? coastalWeather?.waterTemp ?? siteConfig?.seaState?.waterTemp;
  const waterTemp = (waterTempRaw !== undefined && waterTempRaw !== null) 
    ? parseFloat(String(waterTempRaw)) 
    : null;

  useEffect(() => {
    console.log('ShaperPage - Water Temp Debug:', {
      seaStatsTemp: seaStats?.waterTemp,
      coastalWeatherTemp: coastalWeather?.waterTemp,
      siteConfigTemp: siteConfig?.seaState?.waterTemp,
      waterTempRaw,
      finalWaterTemp: waterTemp
    });
  }, [seaStats, coastalWeather, siteConfig, waterTempRaw, waterTemp]);

  const getWetsuit = (temp: number) => {
    if (temp < 16) return { label: 'חליפה ארוכה (4/3)', thickness: '4/3' as const };
    if (temp <= 19) return { label: 'חליפה ארוכה (4/3)', thickness: '4/3' as const };
    if (temp <= 23) return { label: 'מעבר (3/2)', thickness: '3/2' as const };
    if (temp <= 25) return { label: 'קיץ ארוך (2/2)', thickness: '2/2' as const };
    if (temp <= 27) return { label: 'קיץ קצר (2/2)', thickness: '2/2-ss' as const };
    return { label: 'חולצת לייקרה', thickness: 'sun-shirt' as const };
  };

  const recommendedWetsuit = waterTemp ? getWetsuit(waterTemp) : null;
  const wetsuitThickness = recommendedWetsuit?.thickness || '4/3';
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultation, setConsultation] = useState<string | null>(null);
  
  const recommendation = useMemo(() => {
    return calculateSurferFormula(weight, height, level, fitnessLevel);
  }, [weight, height, level, fitnessLevel]);

  const waveHeightRaw = seaStats?.waveHeight ?? coastalWeather?.waveHeight ?? siteConfig?.seaState?.waveHeight ?? 1.0;
  const currentWaveHeight = typeof waveHeightRaw === 'number' ? waveHeightRaw : parseFloat(String(waveHeightRaw)) || 1.0;

  const matchResults = useMemo(() => {
    if (!currentVol || !currentLen) return null;
    
    const matchDetails = calculateMatchScoreDetails(
      currentVol,
      currentLen,
      recommendation.volume,
      recommendation.lengthInches,
      currentType,
      currentWaveHeight,
      level
    );
    const score = matchDetails.totalScore;
    
    let coachTip = '';
    let matchColor = '';
    
    if (score >= 90) {
      coachTip = 'הגלשן וסוג הגלשן שלך במידות והתאמה מושלמות עבורך למצב הים!';
      matchColor = 'text-emerald-500';
    } else if (matchDetails.typeReason) {
      coachTip = matchDetails.typeReason;
      matchColor = score >= 60 ? 'text-amber-500' : 'text-rose-500';
    } else if (currentVol < recommendation.volume - 5) {
      coachTip = 'הגלשן קטן מדי למשקלך ולרמתך. יהיה לך קשה לחתור ולתפוס גלים בים נמוך.';
      matchColor = 'text-rose-500';
    } else if (currentVol > recommendation.volume + 10) {
      coachTip = 'הגלשן גדול ומציף מאוד. מעולה לתפיסת גלים, אבל ירגיש מסורבל בביצועים ופניות.';
      matchColor = 'text-amber-500';
    } else {
      coachTip = 'הגלשן סביר, אבל יש מקום לדיוק במידות כדי למקסם את פוטנציאל הגלישה שלך.';
      matchColor = 'text-amber-500';
    }
    
    return { score, coachTip, matchColor };
  }, [currentVol, currentLen, currentType, currentWaveHeight, recommendation, level]);

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateMember({
        ...currentUser,
        weight,
        height,
        surfingLevel: level,
        fitnessLevel,
        currentBoardVolume: currentVol,
        currentBoardLength: currentLen,
        currentBoardType: currentType,
        recommendedBoardVolume: recommendation.volume,
        recommendedBoardLength: recommendation.lengthFormatted
      });
      setSaveSuccess(true);
      setToast({ msg: 'נשמר בהצלחה', type: 'success' });
      setTimeout(() => {
        setSaveSuccess(false);
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving shaper data:', error);
      setToast({ msg: 'שגיאה בשמירת הנתונים', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConsultation = async () => {
    setIsConsulting(true);
    setConsultation(null);
    try {
      const result = await getShaperConsultation({
        weight,
        height,
        level,
        fitness: fitnessLevel,
        currentBoard: currentVol ? { volume: currentVol, length: currentLen } : undefined,
        recommendedBoard: {
          volume: recommendation.volume,
          length: recommendation.lengthFormatted,
          type: recommendation.boardTypeHebrew
        }
      });
      setConsultation(result);
    } catch (error) {
      console.error('Consultation failed:', error);
      setToast({ msg: 'שגיאה בחיבור לשייפר', type: 'error' });
    } finally {
      setIsConsulting(false);
    }
  };

  const parseLength = (lenStr?: string) => {
    if (!lenStr) return { feet: 0, inches: 0 };
    const parts = lenStr.split("'");
    const feet = parseInt(parts[0]) || 0;
    const inches = parseInt(parts[1]?.replace('"', '')) || 0;
    return { feet, inches };
  };

  const { feet, inches } = parseLength(currentLen);

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 relative overflow-hidden luxury-bg" dir="rtl">
      <div className="max-w-4xl mx-auto pt-12 relative z-10">
        {/* Body-line Standard Header Stack */}
        <div className="surfboard-hero-container mb-0 space-y-2 header-wallpaper !py-12 pb-24" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
          <div className="header-content-wrapper relative z-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
              <Hammer size={40} />
            </div>
            <h1 className="main-page-title">
              <span className="surfer-title text-[#121212]">פינת השייפר</span>
            </h1>
            <p className="header-subtitle max-w-2xl mx-auto text-[#121212]">
              הנוסחה המדעית למציאת הגלשן המושלם עבורך. שקלול של משקל, גובה ורמת גלישה.
            </p>
          </div>
        </div>

        <div className="relative z-30 -mt-16 mx-4 md:mx-0 space-y-8">
          <div className="luxury-card p-6 relative overflow-hidden">
            <div className="grain-overlay" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
              {/* Controls Section */}
              <div className="lg:col-span-5 space-y-8">
                <section className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-10 space-y-8 shadow-inner relative overflow-hidden">
                  <div className="grain-overlay opacity-[0.02]" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <Pencil className="text-[var(--ocean-2)]" size={24} />
                      <h3 className="text-2xl font-black text-[#00426a] font-yehuda">המידות שלך</h3>
                    </div>

                    {/* Weight Slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[#00426a]/70 font-bold flex items-center gap-2">
                          <Weight size={18} /> משקל גוף (ק"ג)
                        </label>
                        <span className="text-2xl font-black text-[var(--ocean-2)]">{weight}</span>
                      </div>
                      <input 
                        type="range" 
                        min="30" 
                        max="150" 
                        value={weight || 75} 
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full accent-[var(--ocean-2)] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        dir="ltr"
                      />
                    </div>

                    {/* Height Slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[#00426a]/70 font-bold flex items-center gap-2">
                          <Ruler size={18} /> גובה (ס"מ)
                        </label>
                        <span className="text-2xl font-black text-[var(--ocean-2)]">{height}</span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="220" 
                        value={height} 
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full accent-[var(--ocean-2)] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        dir="ltr"
                      />
                    </div>

                    {/* Level Selector */}
                    <div className="space-y-4">
                      <label className="text-[#00426a]/70 font-bold flex items-center gap-2">
                        <Trophy size={18} /> רמת גלישה
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {(['Learner', 'Beginner', 'Intermediate', 'Advanced'] as const).map((l) => (
                          <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`py-3 rounded-xl font-black text-xs transition-all border ${
                              level === l 
                                ? 'bg-gradient-to-r from-[var(--ocean-2)] to-[var(--ocean-3)] text-white border-transparent shadow-lg scale-105' 
                                : 'bg-slate-50 text-[#00426a]/40 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {l === 'Learner' ? 'מתלמד' : l === 'Beginner' ? 'מתחיל' : l === 'Intermediate' ? 'מיומן' : 'מתקדם'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fitness Level Selector */}
                    <div className="space-y-4">
                      <label className="text-[#00426a]/70 font-bold flex items-center gap-2">
                        <Zap size={18} /> רמת אימון שבועית (כוח ואירובי)
                      </label>
                      <div className="flex flex-col gap-3">
                        {[
                          { val: 'Low', title: 'Low', desc: 'פעילות מזדמנת בלבד.' },
                          { val: 'Average', title: 'Average', desc: 'אימון פעם-פעמיים בשבוע (ריצה קלה או חדר כושר).' },
                          { val: 'High', title: 'High/Fit', desc: '3-4 אימונים בשבוע, משלב כוח ואירובי.' },
                          { val: 'Elite', title: 'Elite', desc: 'ספורטאי פעיל, אימוני כוח ספציפיים לגלישה/פונקציונלי יום-יום.' }
                        ].map((f) => (
                          <button
                            key={f.val}
                            onClick={() => setFitnessLevel(f.val as any)}
                            className={`p-4 rounded-xl text-right transition-all border flex flex-col gap-1 ${
                              fitnessLevel === f.val 
                                ? 'bg-[var(--surfer-cyan)]/10 border-[var(--surfer-cyan)] shadow-sm' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`font-black text-sm ${fitnessLevel === f.val ? 'text-[#00426a]' : 'text-[#00426a]/60'}`}>
                              {f.title}
                            </span>
                            <span className={`text-xs font-bold ${fitnessLevel === f.val ? 'text-[#00426a]/80' : 'text-[#00426a]/40'}`}>
                              {f.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Current Board Section */}
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="text-[var(--surfer-cyan)]" size={24} />
                        <h3 className="text-2xl font-black text-[#00426a]">הגלשן הנוכחי שלי</h3>
                      </div>
                      <p className="text-xs text-[#00426a]/50 font-bold">הזן את נתוני הגלשן שלך כדי לקבל ציון התאמה (אופציונלי)</p>
                      
                      {/* Surfboard Type Dropdown (10 common types in English, beginner to performance) */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-[#00426a]/40 uppercase tracking-widest font-black block">
                          סוג הגלשן (Surfboard Type)
                        </label>
                        <select 
                          value={currentType} 
                          onChange={e => setCurrentType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#00426a] font-black outline-none focus:border-[var(--surfer-cyan)] transition-all cursor-pointer"
                          dir="ltr"
                        >
                          {POPULAR_SURFBOARD_TYPES.map((type, idx) => (
                            <option key={type} value={type}>
                              {idx + 1}. {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-[#00426a]/40 uppercase tracking-widest font-black">נפח (ליטר)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            value={currentVol || ''} 
                            onChange={e => setCurrentVol(parseFloat(e.target.value) || undefined)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#00426a] font-black outline-none focus:border-[var(--surfer-cyan)] transition-all" 
                            placeholder="32.5" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] text-[#00426a]/40 uppercase tracking-widest font-black">אורך</label>
                          <div className="flex gap-2" dir="ltr">
                            <select 
                              value={feet} 
                              onChange={e => setCurrentLen(`${e.target.value}'${inches}"`)} 
                              className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#00426a] font-black outline-none appearance-none"
                            >
                              {[0,5,6,7,8,9,10].map(f => <option key={f} value={f}>{f}'</option>)}
                            </select>
                            <select 
                              value={inches} 
                              onChange={e => setCurrentLen(`${feet}'${e.target.value}"`)} 
                              className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#00426a] font-black outline-none appearance-none"
                            >
                              {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => <option key={i} value={i}>{i}"</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 relative">
                      <AnimatePresence>
                        {toast && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className={`absolute -top-14 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl shadow-lg flex items-center gap-2 font-black whitespace-nowrap ${
                              toast.type === 'success' 
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                                : 'bg-rose-500 text-white shadow-rose-500/20'
                            }`}
                          >
                            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                            <span className="text-sm">{toast.msg}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <GlassButton 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-4 text-lg flex items-center justify-center gap-2 font-black transition-all active:scale-95 ${
                          saveSuccess 
                            ? '!bg-gradient-to-br !from-emerald-400/60 !to-emerald-500/20 !backdrop-blur-xl !border !border-white/60 !border-b-black/10 !border-r-black/10 !shadow-[inset_0_2px_15px_rgba(255,255,255,0.7),0_10px_30px_rgba(52,211,153,0.3)] !text-white hover:!from-emerald-400/70 hover:!to-emerald-500/30' 
                            : '!bg-gradient-to-br !from-[var(--surfer-cyan)]/60 !to-[var(--surfer-cyan)]/20 !backdrop-blur-xl !border !border-white/60 !border-b-black/10 !border-r-black/10 !shadow-[inset_0_2px_15px_rgba(255,255,255,0.7),0_10px_30px_rgba(0,255,255,0.2)] !text-white hover:!from-[var(--surfer-cyan)]/70 hover:!to-[var(--surfer-cyan)]/30 hover:!shadow-[inset_0_2px_20px_rgba(255,255,255,0.9),0_15px_40px_rgba(0,255,255,0.3)]'
                        }`}
                      >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : null}
                        {saveSuccess ? 'נשמר בהצלחה!' : 'עדכן בפרופיל שלי'}
                      </GlassButton>
                    </div>
                  </div>
                </section>

                {/* Scientific Logic Info */}
                <section className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] p-8 shadow-inner relative overflow-hidden">
                  <div className="grain-overlay opacity-[0.01]" />
                  <div className="flex items-center gap-2 mb-4 text-[var(--ocean-2)] relative z-10">
                    <Info size={18} />
                    <h4 className="font-black text-xs uppercase tracking-widest leading-none">הלוגיקה המדעית (Surfer's Formula)</h4>
                  </div>
                  <ul className="space-y-3 text-[#00426a]/50 text-sm font-bold">
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0" />
                      <span>נפח: משקל × מקדם רמה (מתלמד: 1.1 | מתחיל: 1.0 | מיומן: 0.55 | מתקדם: 0.38)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0" />
                      <span>אורך: גובה + תוספת רמה (מתלמד: 70+ | מתחיל: 50+ | מיומן: 15+ | מתקדם: 5+/-)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 flex-shrink-0" />
                      <span>שקלול כושר: מכפיל נפח משתנה (0.92 עד 1.10) בהתאם לרמת האימון השבועית.</span>
                    </li>
                  </ul>
                </section>
              </div>

              {/* Results Section */}
              <div className="lg:col-span-7 space-y-8">
                <section className="luxury-card !p-10 flex flex-col items-center relative overflow-hidden">
                  <div className="grain-overlay" />
                  <div className="premium-sweep-fx opacity-10" />
                  
                  {/* Blueprint background effect */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #00426a 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                  }} />

                  <div className="relative z-10 w-full text-center mb-8">
                    <h3 className="text-3xl font-black text-[#00426a] mb-2">הגלשן המומלץ עבורך</h3>
                    <div className="flex justify-center gap-12 mt-8">
                      <div className="text-center">
                        <p className="text-[#00426a]/40 text-[10px] font-black uppercase tracking-widest mb-2">נפח מומלץ</p>
                        <p className="text-6xl font-black text-[var(--ocean-2)]">{recommendation.volume}<span className="text-2xl ml-1">L</span></p>
                      </div>
                      <div className="w-px h-20 bg-slate-200" />
                      <div className="text-center">
                        <p className="text-[#00426a]/40 text-[10px] font-black uppercase tracking-widest mb-2">אורך מומלץ</p>
                        <p className="text-6xl font-black text-[var(--surfer-cyan)]" dir="ltr">{recommendation.lengthFormatted}</p>
                      </div>
                    </div>
                  </div>

                  {/* Board Visualization */}
                  <div className="relative w-full aspect-[2/3] md:aspect-[3/4] flex items-end justify-center bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                    <div className="w-full h-full scale-[1.2] origin-bottom flex items-end justify-center pb-8">
                      <ExactSurfboard type={recommendation.boardType} isSelected={true} />
                    </div>
                  </div>

                  <div className="mt-10 text-center bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-8 w-full shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="text-[var(--ocean-2)]" size={20} />
                      <h4 className="text-2xl font-black text-[#00426a]">סוג הגלשן: {recommendation.boardTypeHebrew}</h4>
                    </div>
                    <p className="text-[#00426a]/60 font-bold text-lg">
                      התאמה אופטימלית לרמת {level === 'Learner' ? 'מתלמד' : level === 'Beginner' ? 'מתחיל' : level === 'Intermediate' ? 'מיומן' : 'מתקדם'} במשקל {weight} ק"ג.
                    </p>
                  </div>

                  {/* Match Score Display */}
                  {matchResults && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 w-full bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-8 shadow-sm relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 w-2 h-full ${matchResults.score >= 90 ? 'bg-emerald-500' : matchResults.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-2xl font-black text-[#00426a]">ציון התאמה לגלשן שלך</h4>
                        <span className={`text-5xl font-black ${matchResults.matchColor}`}>{matchResults.score}%</span>
                      </div>
                      <div className="flex gap-4 items-start bg-white/40 p-5 rounded-2xl border border-white/60">
                        <Lightbulb className="text-amber-500 shrink-0 mt-1" size={24} />
                        <p className="text-[#00426a]/70 font-bold leading-relaxed">{matchResults.coachTip}</p>
                      </div>
                    </motion.div>
                  )}
                </section>

                {/* Wetsuit Visualizer Section */}
                <section className="space-y-6 bg-white/40 backdrop-blur-md border border-white/60 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00FFFF]/10 rounded-2xl flex items-center justify-center text-[#00FFFF]">
                        <Waves size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-[#00426a]">חליפת גלישה מומלצת</h3>
                        <p className="text-[#00426a]/40 text-xs font-bold">
                          {waterTemp ? `טמפרטורת מים נוכחית: ${waterTemp}°C` : 'טמפרטורת מים לא זמינה'}
                        </p>
                      </div>
                    </div>

                    {recommendedWetsuit && (
                      <div className="bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/60 shadow-inner font-black text-[#00426a]">
                        {recommendedWetsuit.label}
                      </div>
                    )}
                  </div>
                  <div className="scale-80">
                    <WetsuitSVG thickness={recommendedWetsuit?.thickness || '3/2'} />
                  </div>
                </section>

                {/* Pro Tip Card */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-10 flex flex-col gap-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)]">
                  <div className="flex gap-8 items-center">
                    <div className="w-20 h-20 bg-[var(--surfer-cyan)]/10 rounded-3xl flex items-center justify-center text-[var(--surfer-cyan)] shadow-inner flex-shrink-0">
                      <Zap size={40} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-[#00426a] mb-2">טיפ מהשייפר</h4>
                      <p className="text-[#00426a]/60 font-bold leading-relaxed text-lg">
                        זכור שנפח הוא המפתח לציפה ולתפיסת גלים, אבל האורך והרוחב קובעים את יכולת התמרון. אם אתה מרגיש שאתה לא תופס מספיק גלים, נסה לעלות ב-2-3 ליטר מעל ההמלצה.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={handleConsultation}
                      disabled={isConsulting}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[var(--ocean-2)] to-[var(--surfer-cyan)] text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isConsulting ? <Loader2 className="animate-spin" size={24} /> : <MessageSquareQuote size={24} />}
                      <span>התייעצות עם שייפר AI (Gemini)</span>
                    </button>

                    <AnimatePresence>
                      {consultation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 overflow-hidden"
                        >
                          <div className="bg-slate-900/90 text-slate-100 p-8 rounded-3xl border border-white/10 shadow-2xl relative">
                            <div className="absolute top-4 right-4 text-white/20">
                              <Sparkles size={40} />
                            </div>
                            <div className="prose prose-invert prose-slate max-w-none 
                              prose-p:text-slate-200 prose-p:leading-relaxed prose-p:font-bold
                              prose-strong:text-[var(--surfer-cyan)] prose-strong:font-black
                              prose-li:text-slate-300 prose-li:font-bold
                            ">
                              <Markdown>{consultation}</Markdown>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShaperPage;
