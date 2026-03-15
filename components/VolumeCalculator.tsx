import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Waves, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Member } from '../types';

interface VolumeCalculatorProps {
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

export const VolumeCalculator: React.FC<VolumeCalculatorProps> = ({ formData, onChange }) => {
  const [recommendedVolume, setRecommendedVolume] = useState<number | null>(null);

  useEffect(() => {
    if (formData.weight && formData.surfingLevel) {
      let multiplier = 0;
      switch (formData.surfingLevel) {
        case 'Beginner': multiplier = 0.85; break;
        case 'Intermediate': multiplier = 0.6; break;
        case 'Advanced': multiplier = 0.4; break;
      }
      setRecommendedVolume(formData.weight * multiplier);
    } else {
      setRecommendedVolume(null);
    }
  }, [formData.weight, formData.surfingLevel]);

  const getComparisonMessage = () => {
    if (!recommendedVolume || !formData.currentBoardVolume) return null;
    
    const diff = formData.currentBoardVolume - recommendedVolume;
    const absDiff = Math.abs(diff);
    
    if (absDiff <= 2) {
      return {
        text: 'הגלשן שלך בנפח מעולה לרמתך!',
        type: 'success',
        icon: CheckCircle2,
        colorClass: 'text-emerald-600 bg-emerald-50/50 border-emerald-200'
      };
    } else if (diff > 2) {
      return {
        text: `הגלשן שלך גדול בכ-${Math.round(absDiff)} ליטר מהמומלץ. מצוין לימים חלשים.`,
        type: 'info',
        icon: Info,
        colorClass: 'text-blue-600 bg-blue-50/50 border-blue-200'
      };
    } else {
      return {
        text: `הגלשן שלך קטן בכ-${Math.round(absDiff)} ליטר מהמומלץ. עלול להקשות על תפיסת גלים.`,
        type: 'warning',
        icon: AlertTriangle,
        colorClass: 'text-amber-600 bg-amber-50/50 border-amber-200'
      };
    }
  };

  const comparison = getComparisonMessage();

  return (
    <section className="mt-10">
      <h4 className="text-xs font-black text-[#007085] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
        <Waves size={14} className="text-[#3dbbd3]" /> מחשבון נפח גלשן
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">משקל (ק"ג)</label>
            <input 
              type="number" 
              value={formData.weight || ''} 
              onChange={e => onChange('weight', parseFloat(e.target.value) || undefined)}
              placeholder="לדוגמה: 75"
              className="w-full p-5 bg-cyan-50/5 backdrop-blur-[20px] border-t border-l border-white/30 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-cyan-50/10 transition-all text-[#000000]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">רמת גלישה</label>
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
                    className={`py-4 px-2 rounded-[1rem] font-black text-sm transition-all border-t border-l border-white/30 shadow-[2px_2px_5px_rgba(122,21,85,0.1)] ${
                      isSelected 
                        ? 'bg-[var(--surfer-cyan)] text-black shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)]' 
                        : 'bg-cyan-50/5 text-[#00426a] hover:bg-cyan-50/20'
                    }`}
                  >
                    {labels[level]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">נפח גלשן נוכחי (ליטר)</label>
            <input 
              type="number" 
              value={formData.currentBoardVolume || ''} 
              onChange={e => onChange('currentBoardVolume', parseFloat(e.target.value) || undefined)}
              placeholder="לדוגמה: 32.5"
              step="0.1"
              className="w-full p-5 bg-cyan-50/5 backdrop-blur-[20px] border-t border-l border-white/30 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-cyan-50/10 transition-all text-[#000000]"
            />
          </div>
        </div>

        <div className="bg-cyan-50/10 backdrop-blur-[20px] border-t border-l border-white/40 shadow-[5px_5px_15px_rgba(122,21,85,0.1)] rounded-[1.5rem] p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          {/* Decorative background icons */}
          <div className="absolute -right-8 -top-8 text-[#3dbbd3]/20 rotate-12">
            <LongboardIcon className="w-48 h-48" />
          </div>
          <div className="absolute -left-4 -bottom-4 text-[#3dbbd3]/20 -rotate-12">
            <ShortboardIcon className="w-32 h-32" />
          </div>

          <div className="relative z-10 w-full">
            <h4 className="text-sm font-black text-[#00426a] mb-2 uppercase tracking-widest">הנפח המומלץ עבורך</h4>
            {recommendedVolume ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6"
              >
                <div className="flex items-baseline justify-center gap-1 text-[#7A1555]">
                  <span className="text-6xl font-black tracking-tighter">{recommendedVolume.toFixed(1)}</span>
                  <span className="text-2xl font-bold">L</span>
                </div>
              </motion.div>
            ) : (
              <div className="text-4xl font-black text-slate-300/50 mb-6 tracking-tighter">--.- L</div>
            )}

            {comparison && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`flex items-start gap-3 p-4 rounded-[1rem] text-right border ${comparison.colorClass}`}
              >
                <comparison.icon className="shrink-0 mt-0.5" size={18} />
                <span className="text-sm font-bold leading-tight">{comparison.text}</span>
              </motion.div>
            )}
            
            {!comparison && recommendedVolume && !formData.currentBoardVolume && (
              <p className="text-sm text-[#00426a]/70 font-bold mt-4">
                הזן את נפח הגלשן הנוכחי שלך כדי לראות השוואה
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
