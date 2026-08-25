import React from "react";
import { RANKS } from "../constants";
import { motion } from "motion/react";
import { Check, Flame, Waves, Sparkles } from "lucide-react";

export const RankRoadmap: React.FC<{ 
  name: string; 
  sessions: number; 
  overallProgressPercent: number; 
  noFrame?: boolean;
}> = ({ name, sessions, overallProgressPercent, noFrame = false }) => {
  
  // Calculate precise continuous vertical progress (0% to 100%)
  const calculateVerticalProgress = (s: number): number => {
    if (s <= 0) return 0;
    if (s < 5) return (s / 5) * 25;
    if (s < 15) return 25 + ((s - 5) / 10) * 25;
    if (s < 30) return 50 + ((s - 15) / 15) * 25;
    if (s < 35) return 75 + ((s - 30) / 5) * 25;
    return 100;
  };

  const progressPercent = calculateVerticalProgress(sessions);

  const content = (
    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-white/95 via-[#f8fafc]/90 to-[#f1f5f9]/90 border border-white/60 p-5 sm:p-7 md:p-8 backdrop-blur-xl shadow-lg flex flex-col justify-between"
         dir="rtl"
         style={{ fontFamily: 'var(--font-dana-yad)' }}>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col gap-5 text-right font-dana-yad font-normal" style={{ color: '#092734' }}>
        
        {/* Header with Title and Current Sessions Pill */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-cyan-900/20 pb-3.5">
          <div className="text-center sm:text-right">
            <h2 className="text-3xl sm:text-4xl md:text-[2.6rem] font-dana-yad font-bold text-[#092734]" style={{ transform: 'rotate(-1deg)', fontFamily: 'var(--font-dana-yad)' }}>
              מה הוויב שלך בליין-אפ?
            </h2>
            <p className="text-sm sm:text-base text-cyan-950 font-dana-yad font-semibold mt-0.5">
              מסלול הדרגות וההתמדה בים • לפי כמות סשנים
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#00AFC2]/15 border border-[#00AFC2]/40 px-3.5 py-1.5 rounded-full shadow-xs">
            <Waves size={16} className="text-[#007b8a]" />
            <span className="text-base font-bold text-slate-950 font-dana-yad">
              {sessions} סשנים במים
            </span>
          </div>
        </div>
        
        {/* Main Content Layout with Refined Minimalist Vertical Progress Bar */}
        <div className="relative flex gap-3.5 sm:gap-5 items-stretch">
          
          {/* Subtle Vertical Progress Spine */}
          <div className="relative flex flex-col items-center shrink-0 w-6 sm:w-7 pt-3 pb-3 select-none">
            {/* Background Track Line */}
            <div className="absolute top-5 bottom-5 w-1.5 bg-slate-300 rounded-full overflow-hidden" />

            {/* Filled Active Progress Line */}
            <motion.div 
              className="absolute top-5 w-1.5 rounded-full bg-gradient-to-b from-[#00AFC2] via-cyan-600 to-[#b91c1c] z-0"
              initial={{ height: 0 }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ maxHeight: 'calc(100% - 40px)' }}
            />

            {/* Subtle Milestone Dots */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-1">
              {RANKS.map((rank, i) => {
                const isPassed = rank.max !== null && sessions >= rank.max;
                const isCurrent = sessions >= rank.min && (rank.max === null || sessions < rank.max);

                return (
                  <div key={rank.id} className="relative flex items-center justify-center my-auto">
                    {/* Minimal Ripple on Current Node */}
                    {isCurrent && (
                      <motion.div
                        className="absolute w-5 h-5 rounded-full bg-[#b91c1c]/25 z-0 pointer-events-none"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}

                    {/* Milestone Dot */}
                    <div 
                      className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? 'bg-[#b91c1c] text-white ring-2 ring-[#b91c1c]/30 scale-110 shadow-xs'
                          : isPassed
                            ? 'bg-[#007b8a] text-white shadow-xs'
                            : 'bg-white border-2 border-slate-400'
                      }`}
                    >
                      {isCurrent ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ) : isPassed ? (
                        <Check size={10} strokeWidth={3} />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-slate-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ranks Cards List */}
          <div className="flex-1 flex flex-col justify-between gap-4 sm:gap-5 font-dana-yad font-normal">
            {RANKS.map((rank, i) => {
              const isPassed = rank.max !== null && sessions >= rank.max;
              const isCurrent = sessions >= rank.min && (rank.max === null || sessions < rank.max);
              const textColor = isCurrent ? '#b91c1c' : isPassed ? '#0c4a6e' : '#1e293b';
              const rotation = (i % 2 === 0 ? -0.5 : 0.5) * (Math.random() * 0.5 + 0.2);
              
              return (
                <div 
                  key={rank.id} 
                  className={`flex flex-col gap-1 transition-all duration-300 font-dana-yad rounded-lg p-2 sm:p-2.5 ${
                    isCurrent 
                      ? 'scale-[1.01] origin-right bg-red-100/50 border-r-4 border-[#b91c1c] pr-3 shadow-xs' 
                      : isPassed
                        ? 'opacity-100'
                        : 'opacity-90'
                  }`}
                  style={{ 
                    color: textColor, 
                    transform: `rotate(${rotation}deg)`
                  }}
                >
                  <div className="flex items-center gap-2 justify-start font-dana-yad font-normal flex-wrap">
                    {isCurrent && (
                      <span 
                        className="text-sm sm:text-base font-bold ml-1 font-dana-yad text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-xs"
                        style={{ transform: 'rotate(1deg)' }}
                      >
                        👈 אתה כאן
                      </span>
                    )}
                    
                    <span className="text-2xl sm:text-[1.75rem] font-bold font-dana-yad" style={{ color: textColor }}>
                      {rank.he}
                    </span>

                    <span className="text-sm sm:text-base font-medium font-dana-yad text-slate-900 bg-slate-200/90 border border-slate-300/80 px-2 py-0.5 rounded">
                      ({rank.min}{rank.max ? `-${rank.max}` : '+'} סשנים)
                    </span>

                    {isPassed && (
                      <span className="text-[11px] sm:text-xs text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-sans font-bold shadow-xs">
                        הושלם ✓
                      </span>
                    )}
                  </div>

                  <p className="text-base sm:text-lg leading-relaxed pl-2 font-dana-yad font-semibold text-slate-900">
                    {rank.desc}
                  </p>

                  <ul className="list-disc list-inside pr-3 text-sm sm:text-base font-dana-yad font-medium text-slate-800 flex flex-wrap gap-x-3.5 gap-y-0.5">
                    {rank.perks.map((perk, idx) => (
                      <li key={idx} className="font-dana-yad">
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      {content}
    </div>
  );
};
