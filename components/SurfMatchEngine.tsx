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
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Ruler size={24} className="text-cyan-600"/> מידות גוף</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase tracking-widest">משקל (ק"ג)</label>
                <input type="number" value={weight || ''} onChange={e => onChange('weight', parseFloat(e.target.value) || undefined)} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 text-2xl font-black text-center focus:bg-white focus:border-cyan-400 outline-none transition-all shadow-inner" placeholder="75" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase tracking-widest">גובה (ס"מ)</label>
                <input type="number" value={height || ''} onChange={e => onChange('height', parseFloat(e.target.value) || undefined)} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 text-2xl font-black text-center focus:bg-white focus:border-cyan-400 outline-none transition-all shadow-inner" placeholder="178" />
              </div>
            </div>
            <button type="button" onClick={nextStep} disabled={!weight || !height} className="w-full mt-4 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg">
              המשך <ChevronLeft size={20} />
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Waves size={24} className="text-cyan-600"/> רמת גלישה</h3>
            <div className="grid grid-cols-1 gap-3">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
                const labels = { 'Beginner': 'מתחיל (תופס קצפים / גלים ראשונים)', 'Intermediate': 'בינוני (רץ על הפינה / ביצועים בסיסיים)', 'Advanced': 'מתקדם (שליטה מלאה / ביצועים חדים)' };
                const isSelected = surfingLevel === level;
                return (
                  <button key={level} type="button" onClick={() => { onChange('surfingLevel', level); setTimeout(nextStep, 300); }} className={`p-4 rounded-2xl font-bold text-right transition-all border ${isSelected ? 'bg-cyan-100 border-cyan-400 text-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} shadow-sm`}>
                    {labels[level]}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={prevStep} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mt-4"><ChevronRight size={16} /> חזור</button>
          </motion.div>
        );
      case 3:
        const { feet, inches } = parseLength(currentBoardLength);
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Target size={24} className="text-cyan-600"/> הציוד שלך (אופציונלי)</h3>
            <p className="text-sm text-slate-600">הזן את נתוני הגלשן הנוכחי שלך כדי לקבל ציון התאמה.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase tracking-widest">נפח (ליטר)</label>
                <input type="number" step="0.1" value={currentBoardVolume || ''} onChange={e => onChange('currentBoardVolume', parseFloat(e.target.value) || undefined)} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 text-xl font-black text-center focus:bg-white focus:border-cyan-400 outline-none transition-all shadow-inner" placeholder="32.5" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase tracking-widest">אורך</label>
                <div className="flex gap-2" dir="ltr">
                  <select value={feet} onChange={e => onChange('currentBoardLength', `${e.target.value}'${inches}"`)} className="w-1/2 bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 text-xl font-black text-center focus:bg-white focus:border-cyan-400 outline-none appearance-none shadow-inner">
                    {[0,5,6,7,8,9,10].map(f => <option key={f} value={f} className="bg-white">{f}'</option>)}
                  </select>
                  <select value={inches} onChange={e => onChange('currentBoardLength', `${feet}'${e.target.value}"`)} className="w-1/2 bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 text-xl font-black text-center focus:bg-white focus:border-cyan-400 outline-none appearance-none shadow-inner">
                    {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => <option key={i} value={i} className="bg-white">{i}"</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button type="button" onClick={prevStep} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"><ChevronRight size={16} /> חזור</button>
              <div className="flex items-center gap-4">
                {(currentBoardVolume || currentBoardLength) && (
                  <button type="button" onClick={() => { onChange('currentBoardVolume', undefined); onChange('currentBoardLength', undefined); }} className="text-sm text-rose-500 hover:text-rose-700 font-bold">מחק גלשן</button>
                )}
                <button type="button" onClick={nextStep} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-lg">
                  חשב התאמה <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        if (!results) return null;
        return (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-6 w-full">
              <div className="flex justify-between items-start">
                <h3 className="text-3xl font-black text-slate-900">הגלשן האידיאלי עבורך</h3>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-4">ערוך נתונים</button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center shadow-sm">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">נפח מומלץ</p>
                  <p className="text-4xl font-black text-slate-900">{results.recVol.toFixed(1)}<span className="text-xl text-cyan-600 ml-1">L</span></p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center shadow-sm">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">אורך מומלץ</p>
                  <p className="text-4xl font-black text-slate-900" dir="ltr">{formatLength(results.recLenInches)}</p>
                </div>
              </div>

              {results.score > 0 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-5 border border-slate-200 relative overflow-hidden shadow-sm">
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${results.score >= 90 ? 'bg-emerald-500' : results.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-900">הבורד שלך עם ציון התאמה</h4>
                    <span className={`text-4xl font-black ${results.matchColor}`}>{results.score}%</span>
                  </div>
                  <div className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-slate-700 leading-relaxed">{results.coachTip}</p>
                  </div>
                </motion.div>
              )}

              <button 
                type="submit" 
                disabled={isSaving || !isDirty}
                className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                שמור נתוני גלשן בפרופיל
              </button>
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
      
      <div className="relative rounded-[2rem] p-8 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-200/50" 
           style={{ 
             background: 'linear-gradient(135deg, #fdfdfd 0%, #f4f9f9 100%)'
           }}
           dir="rtl"
      >
        {/* Micro-grain texture */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none z-0" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
        
        {/* Progress Bar */}
        <div className="relative z-10 flex gap-2 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-cyan-600' : 'bg-slate-200'}`} />
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
