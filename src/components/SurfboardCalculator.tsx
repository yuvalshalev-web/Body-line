import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Waves, Info, CheckCircle2, AlertTriangle, Ruler, Weight } from 'lucide-react';
import { Member } from '../types';

interface SurfboardCalculatorProps {
  formData: Member;
  onChange: (field: keyof Member, value: any) => void;
}

const ShortboardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2C10 2 8 6 8 12C8 18 10 21 12 22C14 21 16 18 16 12C16 6 14 2 12 2Z" />
    <path d="M12 2V22" strokeOpacity="0.3" />
  </svg>
);

const LongboardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 1C9.5 1 7.5 4 7.5 12C7.5 20 9.5 23 12 23C14.5 23 16.5 20 16.5 12C16.5 4 14.5 1 12 1Z" />
    <path d="M12 1V23" strokeOpacity="0.3" />
  </svg>
);

export const SurfboardCalculator: React.FC<SurfboardCalculatorProps> = ({ formData, onChange }) => {
  const [recommendedVolume, setRecommendedVolume] = useState<number | null>(null);
  const [recommendedLengthCm, setRecommendedLengthCm] = useState<number | null>(null);

  useEffect(() => {
    if (formData.weight && formData.surfingLevel) {
      let volMultiplier = 0;
      switch (formData.surfingLevel) {
        case 'Beginner': volMultiplier = 0.8; break;
        case 'Intermediate': volMultiplier = 0.55; break;
        case 'Advanced': volMultiplier = 0.4; break;
      }
      setRecommendedVolume(formData.weight * volMultiplier);
    } else {
      setRecommendedVolume(null);
    }

    if (formData.height && formData.surfingLevel) {
      let lengthAdd = 0;
      switch (formData.surfingLevel) {
        case 'Beginner': lengthAdd = 40; break;
        case 'Intermediate': lengthAdd = 15; break;
        case 'Advanced': lengthAdd = 0; break; // +/- 5cm, we'll just use 0
      }
      setRecommendedLengthCm(formData.height + lengthAdd);
    } else {
      setRecommendedLengthCm(null);
    }
  }, [formData.weight, formData.height, formData.surfingLevel]);

  const formatLength = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}" (${Math.round(cm)} ס"מ)`;
  };

  const getVolumeComparison = () => {
    if (!recommendedVolume || !formData.currentBoardVolume) return null;
    
    const diff = formData.currentBoardVolume - recommendedVolume;
    const absDiff = Math.abs(diff);
    
    if (absDiff <= 2) {
      return {
        text: 'הנפח מעולה לרמתך!',
        type: 'success',
        icon: CheckCircle2,
        colorClass: 'text-emerald-600 bg-emerald-50/50 border-emerald-200'
      };
    } else if (diff > 2) {
      return {
        text: `גדול בכ-${Math.round(absDiff)}L. מצוין לימים חלשים.`,
        type: 'info',
        icon: Info,
        colorClass: 'text-blue-600 bg-blue-50/50 border-blue-200'
      };
    } else {
      return {
        text: `קטן בכ-${Math.round(absDiff)}L. עלול להקשות.`,
        type: 'warning',
        icon: AlertTriangle,
        colorClass: 'text-amber-600 bg-amber-50/50 border-amber-200'
      };
    }
  };

  const volumeComparison = getVolumeComparison();

  return (
    <section className="mt-10">
      <h4 className="text-xs font-black text-[var(--surfer-cyan)] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
        <Waves size={14} className="text-[var(--surfer-cyan)]" /> מחשבון התאמת גלשן אישי
      </h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-black text-white/80 uppercase tracking-widest pr-3 flex items-center gap-2">
                <Weight size={14} /> משקל (ק"ג)
              </label>
              <input 
                type="number" 
                value={formData.weight || ''} 
                onChange={e => onChange('weight', parseFloat(e.target.value) || undefined)}
                placeholder="לדוגמה: 75"
                className="w-full p-4 bg-white/5 backdrop-blur-[15px] border border-white/10 rounded-2xl font-black outline-none focus:bg-white/10 transition-all text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-black text-white/80 uppercase tracking-widest pr-3 flex items-center gap-2">
                <Ruler size={14} /> גובה (ס"מ)
              </label>
              <input 
                type="number" 
                value={formData.height || ''} 
                onChange={e => onChange('height', parseFloat(e.target.value) || undefined)}
                placeholder="לדוגמה: 175"
                className="w-full p-4 bg-white/5 backdrop-blur-[15px] border border-white/10 rounded-2xl font-black outline-none focus:bg-white/10 transition-all text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-black text-white/80 uppercase tracking-widest pr-3">רמת גלישה</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
                const labels = {
                  'Beginner': 'מתחיל',
                  'Intermediate': 'בינוני',
                  'Advanced': 'מתקדם'
                };
                const isSelected = formData.surfingLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChange('surfingLevel', level)}
                    className={`py-4 px-2 rounded-2xl font-black text-sm transition-all border border-white/10 backdrop-blur-[15px] ${
                      isSelected 
                        ? 'bg-[var(--surfer-cyan)] text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]' 
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {labels[level]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-black text-white/80 uppercase tracking-widest pr-3">נפח גלשן נוכחי (ליטר)</label>
            <input 
              type="number" 
              value={formData.currentBoardVolume || ''} 
              onChange={e => onChange('currentBoardVolume', parseFloat(e.target.value) || undefined)}
              placeholder="לדוגמה: 32.5"
              step="0.1"
              className="w-full p-4 bg-white/5 backdrop-blur-[15px] border border-white/10 rounded-2xl font-black outline-none focus:bg-white/10 transition-all text-white placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-[15px] border border-white/10 rounded-3xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          {/* Decorative background icons */}
          <div className="absolute -right-8 -top-8 text-[var(--surfer-cyan)]/10 rotate-12">
            <LongboardIcon className="w-48 h-48" />
          </div>
          <div className="absolute -left-4 -bottom-4 text-[var(--surfer-pink)]/10 -rotate-12">
            <ShortboardIcon className="w-32 h-32" />
          </div>

          <div className="relative z-10 w-full space-y-6">
            <div>
              <h4 className="text-sm font-black text-white/60 mb-2 uppercase tracking-widest">נפח מומלץ</h4>
              {recommendedVolume ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="flex items-baseline justify-center gap-1 text-[var(--surfer-cyan)] drop-shadow-[0_0_10px_rgba(61,187,211,0.5)]">
                    <span className="text-5xl font-black tracking-tighter">{recommendedVolume.toFixed(1)}</span>
                    <span className="text-xl font-bold">L</span>
                  </div>
                </motion.div>
              ) : (
                <div className="text-3xl font-black text-white/20 tracking-tighter">--.- L</div>
              )}
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div>
              <h4 className="text-sm font-black text-white/60 mb-2 uppercase tracking-widest">אורך מומלץ</h4>
              {recommendedLengthCm ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="flex flex-col items-center justify-center text-[var(--surfer-pink)] drop-shadow-[0_0_10px_rgba(255,45,96,0.5)]">
                    <span className="text-3xl font-black tracking-tighter">{formatLength(recommendedLengthCm)}</span>
                  </div>
                </motion.div>
              ) : (
                <div className="text-2xl font-black text-white/20 tracking-tighter">--'--"</div>
              )}
            </div>

            {volumeComparison && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`flex items-start gap-3 p-4 rounded-2xl text-right border backdrop-blur-md ${volumeComparison.colorClass}`}
              >
                <volumeComparison.icon className="shrink-0 mt-0.5" size={18} />
                <span className="text-sm font-bold leading-tight">{volumeComparison.text}</span>
              </motion.div>
            )}
            
            {!volumeComparison && recommendedVolume && !formData.currentBoardVolume && (
              <p className="text-sm text-white/40 font-bold mt-4">
                הזן את נפח הגלשן הנוכחי שלך כדי לראות השוואה
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
