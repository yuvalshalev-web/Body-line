
import React, { useState, useMemo } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateSurferFormula, calculateMatchScore } from '../utils/surfMath';
import { SurfboardOverlay } from '../components/SurfboardOverlay';
import WetsuitSVG from '../components/WetsuitSVG';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';

const ShaperPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { updateMember } = useData();
  
  const [weight, setWeight] = useState<number>(currentUser?.weight || 75);
  const [height, setHeight] = useState<number>(currentUser?.height || 175);
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    (currentUser?.surfingLevel as any) || 'Intermediate'
  );
  const [fitnessLevel, setFitnessLevel] = useState<'Low' | 'Average' | 'High' | 'Elite'>(
    (currentUser?.fitnessLevel as any) || 'Average'
  );
  const [currentVol, setCurrentVol] = useState<number | undefined>(currentUser?.currentBoardVolume);
  const [currentLen, setCurrentLen] = useState<string | undefined>(currentUser?.currentBoardLength);
  const [wetsuitThickness, setWetsuitThickness] = useState<'4/3' | '3/2' | '2/2' | '2/2-ss' | 'sun-shirt'>('4/3');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const recommendation = useMemo(() => {
    return calculateSurferFormula(weight, height, level, fitnessLevel);
  }, [weight, height, level, fitnessLevel]);

  const matchResults = useMemo(() => {
    if (!currentVol || !currentLen) return null;
    
    const score = calculateMatchScore(currentVol, currentLen, recommendation.volume, recommendation.lengthInches);
    
    let coachTip = '';
    let matchColor = '';
    
    if (score >= 90) {
      coachTip = 'הגלשן שלך במידות מושלמות עבורך! צא למים ותהנה מכל רגע.';
      matchColor = 'text-emerald-500';
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
  }, [currentVol, currentLen, recommendation]);

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

  const parseLength = (lenStr?: string) => {
    if (!lenStr) return { feet: 0, inches: 0 };
    const parts = lenStr.split("'");
    const feet = parseInt(parts[0]) || 0;
    const inches = parseInt(parts[1]?.replace('"', '')) || 0;
    return { feet, inches };
  };

  const { feet, inches } = parseLength(currentLen);

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 relative overflow-hidden" dir="rtl" style={{
      backgroundColor: '#fcfcfc',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(178, 235, 242, 0.2) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(178, 235, 242, 0.2) 0px, transparent 50%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")
      `,
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-4xl mx-auto pt-12 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-full mb-6 shadow-sm"
          >
            <Hammer className="text-[var(--surfer-deep-teal)]" size={20} />
            <span className="text-[#00426a] font-black text-sm uppercase tracking-[0.2em]">Shaper's Corner</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-[#00426a] mb-4 drop-shadow-sm" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>
            מחשבון התאמת גלשן אישי
          </h1>
          <p className="text-[#00426a]/60 text-lg max-w-2xl mx-auto font-bold">
            הנוסחה המדעית למציאת הגלשן המושלם עבורך. שקלול של משקל, גובה ורמת גלישה.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Controls Section */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-10 space-y-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12),0_30px_60px_-30px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-3 mb-2">
                <Pencil className="text-[var(--surfer-deep-teal)]" size={24} />
                <h3 className="text-2xl font-black text-[#00426a]">המידות שלך</h3>
              </div>

              {/* Weight Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[#00426a]/70 font-bold flex items-center gap-2">
                    <Weight size={18} /> משקל גוף (ק"ג)
                  </label>
                  <span className="text-2xl font-black text-[var(--surfer-deep-teal)]">{weight}</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="150" 
                  value={weight} 
                  onChange={(e) => setWeight(parseInt(e.target.value))}
                  className="w-full accent-[var(--surfer-deep-teal)] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  dir="ltr"
                />
              </div>

              {/* Height Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[#00426a]/70 font-bold flex items-center gap-2">
                    <Ruler size={18} /> גובה (ס"מ)
                  </label>
                  <span className="text-2xl font-black text-[var(--surfer-cyan)]">{height}</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="220" 
                  value={height} 
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  className="w-full accent-[var(--surfer-cyan)] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  dir="ltr"
                />
              </div>

              {/* Level Selector */}
              <div className="space-y-4">
                <label className="text-[#00426a]/70 font-bold flex items-center gap-2">
                  <Trophy size={18} /> רמת גלישה
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`py-3 rounded-xl font-black text-xs transition-all border ${
                        level === l 
                          ? 'bg-[var(--surfer-deep-teal)] text-white border-[var(--surfer-deep-teal)] shadow-lg scale-105' 
                          : 'bg-slate-50 text-[#00426a]/40 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {l === 'Beginner' ? 'מתחיל' : l === 'Intermediate' ? 'בינוני' : 'מתקדם'}
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

              {/* Current Board Section (Match Engine Merger) */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="text-[var(--surfer-cyan)]" size={24} />
                  <h3 className="text-2xl font-black text-[#00426a]">הגלשן הנוכחי שלי</h3>
                </div>
                <p className="text-xs text-[#00426a]/50 font-bold">הזן את נתוני הגלשן שלך כדי לקבל ציון התאמה (אופציונלי)</p>
                
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
                      ? '!bg-gradient-to-br !from-emerald-400/60 !to-emerald-500/20 !backdrop-blur-xl !border !border-white/60 !border-b-black/10 !border-r-black/10 !shadow-[inset_0_2px_15px_rgba(255,255,255,0.7),0_10px_30px_rgba(52,211,153,0.3)] !text-[#00426a] hover:!from-emerald-400/70 hover:!to-emerald-500/30' 
                      : '!bg-gradient-to-br !from-[var(--surfer-cyan)]/60 !to-[var(--surfer-cyan)]/20 !backdrop-blur-xl !border !border-white/60 !border-b-black/10 !border-r-black/10 !shadow-[inset_0_2px_15px_rgba(255,255,255,0.7),0_10px_30px_rgba(0,255,255,0.2)] !text-[#00426a] hover:!from-[var(--surfer-cyan)]/70 hover:!to-[var(--surfer-cyan)]/30 hover:!shadow-[inset_0_2px_20px_rgba(255,255,255,0.9),0_15px_40px_rgba(0,255,255,0.3)]'
                  }`}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : null}
                  {saveSuccess ? 'נשמר בהצלחה!' : 'עדכן בפרופיל שלי'}
                </GlassButton>
              </div>
            </section>

            {/* Scientific Logic Info */}
            <section className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-[var(--surfer-deep-teal)]">
                <Info size={18} />
                <h4 className="font-black text-sm uppercase tracking-widest">הלוגיקה המדעית (Surfer's Formula)</h4>
              </div>
              <ul className="space-y-3 text-[#00426a]/50 text-sm font-bold">
                <li className="flex items-start gap-2">
                  <ChevronRight size={14} className="mt-1 flex-shrink-0" />
                  <span>נפח (מתחיל): משקל × 0.8 | (בינוני): משקל × 0.55 | (מתקדם): משקל × 0.4</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={14} className="mt-1 flex-shrink-0" />
                  <span>אורך (מתחיל): גובה + 40 ס"מ | (בינוני): גובה + 15 ס"מ | (מתקדם): גובה +/- 5 ס"מ</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15),0_40px_80px_-40px_rgba(0,0,0,0.2)]">
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
                    <p className="text-6xl font-black text-[var(--surfer-deep-teal)]">{recommendation.volume}<span className="text-2xl ml-1">L</span></p>
                  </div>
                  <div className="w-px h-20 bg-slate-200" />
                  <div className="text-center">
                    <p className="text-[#00426a]/40 text-[10px] font-black uppercase tracking-widest mb-2">אורך מומלץ</p>
                    <p className="text-6xl font-black text-[var(--surfer-cyan)]" dir="ltr">{recommendation.lengthFormatted}</p>
                  </div>
                </div>
              </div>

              {/* Board Visualization */}
              <div className="relative w-full h-[400px] flex items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                <SurfboardOverlay selectedBoardType={recommendation.boardType} />
              </div>

              <div className="mt-10 text-center bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-8 w-full shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="text-[var(--surfer-deep-teal)]" size={20} />
                  <h4 className="text-2xl font-black text-[#00426a]">סוג הגלשן: {recommendation.boardTypeHebrew}</h4>
                </div>
                <p className="text-[#00426a]/60 font-bold text-lg">
                  התאמה אופטימלית לרמת {level === 'Beginner' ? 'מתחיל' : level === 'Intermediate' ? 'בינוני' : 'מתקדם'} במשקל {weight} ק"ג.
                </p>
              </div>

              {/* Match Score Display (Match Engine Merger) */}
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
                    <p className="text-[#00426a]/40 text-xs font-bold">התאמה לפי עונות השנה</p>
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/60 shadow-inner overflow-x-auto">
                  <button
                    onClick={() => setWetsuitThickness('4/3')}
                    className={`px-4 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                      wetsuitThickness === '4/3'
                        ? 'bg-[var(--surfer-deep-teal)] text-white shadow-md'
                        : 'text-[#00426a]/60 hover:text-[#00426a]'
                    }`}
                  >
                    חליפה ארוכה (4/3)
                  </button>
                  <button
                    onClick={() => setWetsuitThickness('3/2')}
                    className={`px-4 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                      wetsuitThickness === '3/2'
                        ? 'bg-[var(--surfer-cyan)] text-[#00426a] shadow-md'
                        : 'text-[#00426a]/60 hover:text-[#00426a]'
                    }`}
                  >
                    מעבר (3/2)
                  </button>
                  <button
                    onClick={() => setWetsuitThickness('2/2')}
                    className={`px-4 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                      wetsuitThickness === '2/2'
                        ? 'bg-[var(--surfer-pink)] text-white shadow-md'
                        : 'text-[#00426a]/60 hover:text-[#00426a]'
                    }`}
                  >
                    קיץ ארוך (2/2)
                  </button>
                  <button
                    onClick={() => setWetsuitThickness('2/2-ss')}
                    className={`px-4 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                      wetsuitThickness === '2/2-ss'
                        ? 'bg-amber-400 text-[#00426a] shadow-md'
                        : 'text-[#00426a]/60 hover:text-[#00426a]'
                    }`}
                  >
                    קיץ קצר (2/2)
                  </button>
                  <button
                    onClick={() => setWetsuitThickness('sun-shirt')}
                    className={`px-4 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                      wetsuitThickness === 'sun-shirt'
                        ? 'bg-[#141414] text-white shadow-md'
                        : 'text-[#00426a]/60 hover:text-[#00426a]'
                    }`}
                  >
                    חולצת לייקרה
                  </button>
                </div>
              </div>
              <WetsuitSVG thickness={wetsuitThickness} />
            </section>

            {/* Pro Tip Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-10 flex gap-8 items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)]"
            >
              <div className="w-20 h-20 bg-[var(--surfer-cyan)]/10 rounded-3xl flex items-center justify-center text-[var(--surfer-cyan)] shadow-inner flex-shrink-0">
                <Zap size={40} fill="currentColor" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-[#00426a] mb-2">טיפ מהשייפר</h4>
                <p className="text-[#00426a]/60 font-bold leading-relaxed text-lg">
                  זכור שנפח הוא המפתח לציפה ולתפיסת גלים, אבל האורך והרוחב קובעים את יכולת התמרון. אם אתה מרגיש שאתה לא תופס מספיק גלים, נסה לעלות ב-2-3 ליטר מעל ההמלצה.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShaperPage;
