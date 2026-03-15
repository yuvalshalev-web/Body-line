import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves, ChevronLeft, ChevronRight, Lightbulb, Target, Ruler, Weight, Save, Loader2 } from 'lucide-react';
import { Member } from '../types';

interface SurfMatchEngineProps {
  formData: Member;
  onChange: (field: keyof Member, value: any) => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

const parseLength = (lenStr?: string) => {
  if (!lenStr) return { feet: 0, inches: 0 };
  const parts = lenStr.split("'");
  const feet = parseInt(parts[0]) || 0;
  const inches = parseInt(parts[1]?.replace('"', '')) || 0;
  return { feet, inches };
};

const formatLength = (inches: number) => {
  const f = Math.floor(inches / 12);
  const i = Math.round(inches % 12);
  return `${f}'${i}"`;
};

const DynamicBoard = ({ lengthInches, volume }: { lengthInches: number, volume: number }) => {
  const scaleY = Math.min(Math.max(lengthInches / 72, 0.7), 1.3); 
  const scaleX = Math.min(Math.max(volume / 30, 0.7), 1.4);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scaleX, scaleY }}
      transition={{ type: "spring", stiffness: 60, damping: 12 }}
      className="relative w-24 h-64 mx-auto"
    >
      <svg viewBox="0 0 100 300" className="w-full h-full drop-shadow-[0_10px_20px_rgba(6,182,212,0.3)]">
        <defs>
          <linearGradient id="surfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="stringerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
        </defs>
        <path 
          d="M50 5 C 75 5, 90 50, 90 150 C 90 260, 70 295, 50 295 C 30 295, 10 260, 10 150 C 10 50, 25 5, 50 5 Z" 
          fill="url(#surfGradient)" 
          stroke="rgba(255,255,255,0.4)" 
          strokeWidth="1.5" 
        />
        <line x1="50" y1="5" x2="50" y2="295" stroke="url(#stringerGradient)" strokeWidth="2" />
        <path 
          d="M20 150 C 20 80, 30 20, 50 10 C 35 30, 25 80, 25 150 C 25 220, 35 270, 50 290 C 30 280, 20 220, 20 150 Z" 
          fill="rgba(255,255,255,0.15)" 
        />
      </svg>
    </motion.div>
  );
};

export const SurfMatchEngine: React.FC<SurfMatchEngineProps> = ({ formData, onChange, isSaving, isDirty }) => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (formData.weight && formData.height && formData.surfingLevel) {
      setStep(4);
    }
  }, []);

  const { weight, height, surfingLevel, currentBoardVolume, currentBoardLength } = formData;

  const calculateResults = () => {
    if (!weight || !height || !surfingLevel) return null;
    
    let volMultiplier = 0;
    switch (surfingLevel) {
      case 'Beginner': volMultiplier = 0.85; break;
      case 'Intermediate': volMultiplier = 0.6; break;
      case 'Advanced': volMultiplier = 0.4; break;
    }
    const recVol = weight * volMultiplier;
    
    const heightInches = height / 2.54;
    let recLenInches = 0;
    switch (surfingLevel) {
      case 'Beginner': recLenInches = heightInches + 18; break;
      case 'Intermediate': recLenInches = heightInches + 6; break;
      case 'Advanced': recLenInches = heightInches; break;
    }
    
    let score = 0;
    let coachTip = '';
    let matchColor = '';
    
    if (currentBoardVolume && currentBoardLength) {
      const { feet, inches } = parseLength(currentBoardLength);
      const currLenInches = feet * 12 + inches;
      
      const volDiff = Math.abs(currentBoardVolume - recVol);
      const lenDiff = Math.abs(currLenInches - recLenInches);
      
      const volScore = Math.max(0, 100 - (volDiff * 5));
      const lenScore = Math.max(0, 100 - (lenDiff * 3));
      
      score = Math.round((volScore * 0.7) + (lenScore * 0.3));
      
      if (score >= 90) {
        coachTip = 'הגלשן שלך במידות מושלמות עבורך! צא למים ותהנה מכל רגע.';
        matchColor = 'text-emerald-400';
      } else if (currentBoardVolume < recVol - 5) {
        coachTip = 'הגלשן קטן מדי למשקלך ולרמתך. יהיה לך קשה לחתור ולתפוס גלים בים נמוך.';
        matchColor = 'text-rose-400';
      } else if (currentBoardVolume > recVol + 10) {
        coachTip = 'הגלשן גדול ומציף מאוד. מעולה לתפיסת גלים, אבל ירגיש מסורבל בביצועים ופניות.';
        matchColor = 'text-amber-400';
      } else if (currLenInches < recLenInches - 6) {
        coachTip = 'הגלשן קצר מהמומלץ. תצטרך להיות מדויק מאוד במיקום שלך על הגל.';
        matchColor = 'text-amber-400';
      } else {
        coachTip = 'הגלשן סביר, אבל יש מקום לדיוק במידות כדי למקסם את פוטנציאל הגלישה שלך.';
        matchColor = 'text-amber-400';
      }
    }
    
    return { recVol, recLenInches, score, coachTip, matchColor };
  };

  const results = calculateResults();

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-2xl font-black text-cyan-50 flex items-center gap-2"><Ruler size={24} className="text-cyan-400"/> מידות גוף</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-cyan-300/70 uppercase tracking-widest">משקל (ק"ג)</label>
                <input type="number" value={weight || ''} onChange={e => onChange('weight', parseFloat(e.target.value) || undefined)} className="w-full bg-black/20 border border-cyan-500/30 rounded-2xl p-4 text-white text-2xl font-black text-center focus:bg-black/40 focus:border-cyan-400 outline-none transition-all" placeholder="75" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-cyan-300/70 uppercase tracking-widest">גובה (ס"מ)</label>
                <input type="number" value={height || ''} onChange={e => onChange('height', parseFloat(e.target.value) || undefined)} className="w-full bg-black/20 border border-cyan-500/30 rounded-2xl p-4 text-white text-2xl font-black text-center focus:bg-black/40 focus:border-cyan-400 outline-none transition-all" placeholder="178" />
              </div>
            </div>
            <button type="button" onClick={nextStep} disabled={!weight || !height} className="w-full mt-4 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
              המשך <ChevronLeft size={20} />
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-2xl font-black text-cyan-50 flex items-center gap-2"><Waves size={24} className="text-cyan-400"/> רמת גלישה</h3>
            <div className="grid grid-cols-1 gap-3">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
                const labels = { 'Beginner': 'מתחיל (תופס קצפים / גלים ראשונים)', 'Intermediate': 'בינוני (רץ על הפינה / ביצועים בסיסיים)', 'Advanced': 'מתקדם (שליטה מלאה / ביצועים חדים)' };
                const isSelected = surfingLevel === level;
                return (
                  <button key={level} type="button" onClick={() => { onChange('surfingLevel', level); setTimeout(nextStep, 300); }} className={`p-4 rounded-2xl font-bold text-right transition-all border ${isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-50' : 'bg-black/20 border-white/10 text-slate-300 hover:bg-black/40'}`}>
                    {labels[level]}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={prevStep} className="text-sm text-cyan-400/70 hover:text-cyan-300 flex items-center gap-1 mt-4"><ChevronRight size={16} /> חזור</button>
          </motion.div>
        );
      case 3:
        const { feet, inches } = parseLength(currentBoardLength);
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-2xl font-black text-cyan-50 flex items-center gap-2"><Target size={24} className="text-cyan-400"/> הציוד שלך (אופציונלי)</h3>
            <p className="text-sm text-cyan-200/70">הזן את נתוני הגלשן הנוכחי שלך כדי לקבל ציון התאמה.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-cyan-300/70 uppercase tracking-widest">נפח (ליטר)</label>
                <input type="number" step="0.1" value={currentBoardVolume || ''} onChange={e => onChange('currentBoardVolume', parseFloat(e.target.value) || undefined)} className="w-full bg-black/20 border border-cyan-500/30 rounded-2xl p-4 text-white text-xl font-black text-center focus:bg-black/40 focus:border-cyan-400 outline-none transition-all" placeholder="32.5" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-cyan-300/70 uppercase tracking-widest">אורך</label>
                <div className="flex gap-2" dir="ltr">
                  <select value={feet} onChange={e => onChange('currentBoardLength', `${e.target.value}'${inches}"`)} className="w-1/2 bg-black/20 border border-cyan-500/30 rounded-2xl p-4 text-white text-xl font-black text-center focus:bg-black/40 focus:border-cyan-400 outline-none appearance-none">
                    {[0,5,6,7,8,9,10].map(f => <option key={f} value={f} className="bg-slate-800">{f}'</option>)}
                  </select>
                  <select value={inches} onChange={e => onChange('currentBoardLength', `${feet}'${e.target.value}"`)} className="w-1/2 bg-black/20 border border-cyan-500/30 rounded-2xl p-4 text-white text-xl font-black text-center focus:bg-black/40 focus:border-cyan-400 outline-none appearance-none">
                    {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => <option key={i} value={i} className="bg-slate-800">{i}"</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button type="button" onClick={prevStep} className="text-sm text-cyan-400/70 hover:text-cyan-300 flex items-center gap-1"><ChevronRight size={16} /> חזור</button>
              <button type="button" onClick={nextStep} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-xl transition-all flex items-center gap-2">
                חשב התאמה <ChevronLeft size={18} />
              </button>
            </div>
          </motion.div>
        );
      case 4:
        if (!results) return null;
        return (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-6 w-full">
              <div className="flex justify-between items-start">
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">התאמה מושלמת</h3>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-cyan-400/70 hover:text-cyan-300 underline underline-offset-4">ערוך נתונים</button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-2xl p-5 border border-white/10 text-center">
                  <p className="text-xs text-cyan-400/70 uppercase tracking-widest mb-1">נפח מומלץ</p>
                  <p className="text-4xl font-black text-white">{results.recVol.toFixed(1)}<span className="text-xl text-cyan-500 ml-1">L</span></p>
                </div>
                <div className="bg-black/20 rounded-2xl p-5 border border-white/10 text-center">
                  <p className="text-xs text-cyan-400/70 uppercase tracking-widest mb-1">אורך מומלץ</p>
                  <p className="text-4xl font-black text-white" dir="ltr">{formatLength(results.recLenInches)}</p>
                </div>
              </div>

              {results.score > 0 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${results.score >= 90 ? 'bg-emerald-400' : results.score >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-cyan-100">ציון התאמה לציוד שלך</h4>
                    <span className={`text-4xl font-black ${results.matchColor}`}>{results.score}%</span>
                  </div>
                  <div className="flex gap-3 items-start bg-black/20 p-4 rounded-xl">
                    <Lightbulb className="text-amber-300 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-cyan-50 leading-relaxed">{results.coachTip}</p>
                  </div>
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={isSaving || !isDirty}
                className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                שמור נתוני גלשן בפרופיל
              </button>
            </div>
            
            <div className="w-full md:w-1/3 flex justify-center py-4">
               <DynamicBoard lengthInches={results.recLenInches} volume={results.recVol} />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <section className="mt-10">
      <h4 className="text-xs font-black text-[#007085] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
        <Waves size={14} className="text-[#3dbbd3]" /> Surf Match Engine
      </h4>
      
      <div className="bg-gradient-to-br from-[#002b44] to-[#001220] rounded-[2rem] p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden border border-cyan-500/20" dir="rtl">
        {/* Glass reflections */}
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 backdrop-blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Progress Bar */}
        <div className="relative z-10 flex gap-2 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-cyan-400' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="relative z-10 min-h-[300px]">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
