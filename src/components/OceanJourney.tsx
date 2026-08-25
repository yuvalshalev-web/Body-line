import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { parseDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, Waves, Check, Award, Compass, ShieldCheck } from 'lucide-react';

const getMilestones = (assets: any) => [
  { 
    id: 'starfish', 
    src: assets?.starfish || assets?.starFish || '', 
    alt: 'כוכב ים', 
    name: 'כוכב ים', 
    title: 'הצעד הראשון',
    desc: 'הצעד הראשון שלך במים. ברוך הבא לקהילת הגולשים!',
    accent: '#0284c7',
    badge: 'חבר קהילה',
    criteria: 'מוענק לכל חבר מועדון'
  },
  { 
    id: 'penguin', 
    src: assets?.penguin || '', 
    alt: 'פינגווין', 
    name: 'פינגווין', 
    title: 'לוחם חורף',
    desc: 'לוחם חורף אמיתי. המים הקרים והסערות הם הבית שלך.',
    accent: '#0369a1',
    badge: 'אימוני חורף',
    criteria: 'התמדה באימוני חורף קרים'
  },
  { 
    id: 'manta_ray', 
    src: assets?.mantaRay || assets?.manta_ray || '', 
    alt: 'מנטה ריי', 
    name: 'מנטה ריי', 
    title: 'גליידר קיץ',
    desc: 'חותר באנרגיה גבוהה בחום הקיץ. קצב וסטייל טהור.',
    accent: '#0891b2',
    badge: 'רצף קיץ',
    criteria: 'רצף אימונים בחום הקיץ'
  },
  { 
    id: 'shark', 
    src: assets?.shark || '', 
    alt: 'כריש', 
    name: 'כריש', 
    title: 'מכונת עקביות',
    desc: 'טורף עקביות. מגיע לכל סשן, בכל עונה ובכל מצב ים.',
    accent: '#334155',
    badge: 'עקביות שיא',
    criteria: 'נוכחות גבוהה ועקבית לאורך השנה'
  },
  { 
    id: 'orca', 
    src: assets?.orca || '', 
    alt: 'אורקה', 
    name: 'אורקה', 
    title: 'מאסטר חוף הבית',
    desc: 'המאסטר האמיתי של הליין-אפ. השלמת את כל האתגרים!',
    accent: '#0f172a',
    badge: 'מאסטר עליון',
    criteria: 'טופ בכל קטגוריות המועדון'
  },
];

const VectorIllustration: React.FC<{ name: string; isUnlocked: boolean; isSelected?: boolean; className?: string }> = ({ 
  name, 
  isUnlocked, 
  isSelected = false,
  className = "w-8 h-8 sm:w-9 sm:h-9" 
}) => {
  const color = isSelected ? '#00AFC2' : isUnlocked ? '#0284c7' : '#94a3b8';
  
  if (name.includes('כוכב ים')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-xs`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 8 L61 36 L92 36 L66 55 L76 84 L50 66 L24 84 L34 55 L8 36 L39 36 Z" fill={color} fillOpacity={isUnlocked ? "0.9" : "0.35"} />
        <circle cx="50" cy="48" r="5" fill="white" opacity="0.8" />
      </svg>
    );
  }
  if (name.includes('פינגווין')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-xs`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="62" rx="20" ry="28" fill={color} fillOpacity={isUnlocked ? "0.9" : "0.35"} />
        <ellipse cx="50" cy="60" rx="12" ry="18" fill="white" opacity="0.6" />
        <circle cx="50" cy="28" r="13" fill={color} fillOpacity={isUnlocked ? "0.9" : "0.35"} />
        <path d="M47 31 L53 31 L50 36 Z" fill="#f59e0b" />
      </svg>
    );
  }
  if (name.includes('מנטה')) {
    return (
      <svg viewBox="0 0 200 100" className={`${className} drop-shadow-xs`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 50 Q100 12 180 50 Q100 88 20 50 Z" fill={color} fillOpacity={isUnlocked ? "0.9" : "0.35"} />
        <path d="M90 50 Q100 40 110 50" stroke="white" strokeWidth="2.5" opacity="0.7" />
        <path d="M100 78 L100 105" stroke={color} strokeWidth="3" opacity={isUnlocked ? "0.8" : "0.3"} />
      </svg>
    );
  }
  if (name.includes('כריש')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-xs`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50 Q50 22 90 50 Q50 78 10 50 Z" fill={color} fillOpacity={isUnlocked ? "0.9" : "0.35"} />
        <path d="M52 35 L70 18 L62 38 Z" fill={color} fillOpacity={isUnlocked ? "0.9" : "0.35"} />
        <circle cx="75" cy="46" r="2.5" fill="white" />
      </svg>
    );
  }
  if (name.includes('אורקה')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-xs`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 58 Q50 20 90 58 Q50 88 10 58 Z" fill={color} fillOpacity={isUnlocked ? "0.9" : "0.35"} />
        <path d="M42 38 L56 16 L52 42 Z" fill={color} fillOpacity={isUnlocked ? "0.9" : "0.35"} />
        <ellipse cx="70" cy="50" rx="6" ry="3" fill="white" opacity="0.8" />
      </svg>
    );
  }
  return <Compass className={className} color={color} />;
};

const AnimalAvatar: React.FC<{ 
  src?: string; 
  name: string; 
  isUnlocked: boolean; 
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ src, name, isUnlocked, isSelected = false, size = 'sm' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-20 h-20 sm:w-24 sm:h-24'
  };

  if (src && !imgError) {
    return (
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className={`w-full h-full object-contain transition-all duration-300 ${
            !isUnlocked ? 'grayscale opacity-40 brightness-75' : 'drop-shadow-sm'
          } ${isSelected ? 'scale-110' : ''}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <VectorIllustration 
      name={name} 
      isUnlocked={isUnlocked} 
      isSelected={isSelected}
      className={sizeClasses[size]}
    />
  );
};

export const OceanJourney: React.FC<{ compact?: boolean, noFrame?: boolean }> = ({ compact = false, noFrame = false }) => {
  const { members, weeklyHistory, siteAssets } = useData();
  const { currentUser } = useAuth();

  const milestones = useMemo(() => getMilestones(siteAssets), [siteAssets]);

  const activeCategories = useMemo(() => {
    if (!currentUser || !members || !weeklyHistory) return new Set(['starfish']);

    const userId = currentUser.id;

    const getTemp = (session: any) => {
      if (session.waterTemp !== undefined && session.waterTemp !== null) return session.waterTemp;
      const date = parseDate(session.date) || new Date();
      const month = date.getMonth();
      const averages = [17, 18, 20, 22, 25, 28, 29, 28, 26, 23, 20, 18];
      return averages[month];
    };

    const surfHistory = weeklyHistory.filter(s => !s.isEvent);
    const penguinSessions = surfHistory.filter(s => getTemp(s) < 20);
    const jellyfishSessions = surfHistory.filter(s => getTemp(s) > 27);

    const memberStats = members.map(member => {
      const winterSessions = penguinSessions.filter(s => s.participantIds?.includes(member.id));
      const summerSessions = jellyfishSessions.filter(s => s.participantIds?.includes(member.id));
      
      const getStreak = (allRelevantSessions: any[], memberId: string) => {
        const sorted = [...allRelevantSessions].sort((a, b) => {
          const da = parseDate(a.date) || new Date(0);
          const db = parseDate(b.date) || new Date(0);
          return db.getTime() - da.getTime();
        });
        let streak = 0;
        for (const s of sorted) {
          if (s.participantIds?.includes(memberId)) streak++;
          else if (streak > 0) break;
        }
        return streak;
      };

      const winterGrit = (winterSessions.length * 1.5) + (getStreak(penguinSessions, member.id) * 4);
      const summerGrit = (summerSessions.length * 1.5) + (getStreak(jellyfishSessions, member.id) * 4);

      const seasonalCounts = [0, 0, 0, 0];
      const getSeasonIndex = (date: Date) => {
        const month = date.getMonth();
        if (month === 11 || month === 0 || month === 1) return 0;
        if (month >= 2 && month <= 4) return 1;
        if (month >= 5 && month <= 7) return 2;
        return 3;
      };

      weeklyHistory.forEach(s => {
        if (s.participantIds?.includes(member.id)) {
          const date = parseDate(s.date) || new Date();
          seasonalCounts[getSeasonIndex(date)]++;
        }
      });

      const totalAttendance = seasonalCounts.reduce((a, b) => a + b, 0);
      const mean = totalAttendance / 4;
      const variance = seasonalCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 4;

      return {
        id: member.id,
        winterGrit,
        summerGrit,
        variance,
        totalAttendance,
        winterCount: winterSessions.length,
        summerCount: summerSessions.length
      };
    });

    const penguins = [...memberStats]
      .filter(m => m.winterCount >= 8)
      .sort((a, b) => b.winterGrit - a.winterGrit)
      .slice(0, 3);

    const jellyfish = [...memberStats]
      .filter(m => m.summerCount >= 8)
      .sort((a, b) => b.summerGrit - a.summerGrit)
      .slice(0, 3);

    const sharks = [...memberStats]
      .filter(m => m.totalAttendance >= 20)
      .sort((a, b) => a.variance - b.variance || b.totalAttendance - a.totalAttendance)
      .slice(0, 3);

    const top1Penguins = penguins.slice(0, 1);
    const top1Jellyfish = jellyfish.slice(0, 1);
    const top1Sharks = sharks.slice(0, 1);

    const orcas = memberStats.filter(m => 
      top1Penguins.some(p => p.id === m.id) && 
      top1Jellyfish.some(j => j.id === m.id) && 
      top1Sharks.some(s => s.id === m.id)
    );

    const active = new Set(['starfish']);
    if (penguins.some(p => p.id === userId)) active.add('penguin');
    if (jellyfish.some(j => j.id === userId)) active.add('manta_ray');
    if (sharks.some(s => s.id === userId)) active.add('shark');
    if (orcas.some(o => o.id === userId)) active.add('orca');

    return active;
  }, [members, weeklyHistory, currentUser]);

  // Find the highest unlocked milestone by default
  const defaultSelectedIdx = useMemo(() => {
    let best = 0;
    milestones.forEach((m, idx) => {
      if (activeCategories.has(m.id)) best = idx;
    });
    return best;
  }, [milestones, activeCategories]);

  const [selectedIdx, setSelectedIdx] = useState<number>(defaultSelectedIdx);

  const selectedMilestone = milestones[selectedIdx];
  const isSelectedUnlocked = activeCategories.has(selectedMilestone.id);
  const unlockedCount = activeCategories.size;
  const totalCount = milestones.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  const content = (
    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-white/95 via-[#f8fafc]/90 to-[#f1f5f9]/90 border border-white/60 p-5 sm:p-7 backdrop-blur-xl shadow-lg flex flex-col justify-between" dir="rtl">
      
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-cyan-900/20 pb-3.5 mb-4">
          <div className="text-center sm:text-right">
            <h2 className="text-3xl sm:text-4xl md:text-[2.6rem] font-dana-yad font-bold text-[#092734]" style={{ fontFamily: 'var(--font-dana-yad)' }}>
              איזו חיה ימית אתה?
            </h2>
            <p className="text-sm sm:text-base text-cyan-950 font-dana-yad font-semibold mt-0.5">
              מסע תגי ההישג הימיים של המועדון
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#00AFC2]/15 border border-[#00AFC2]/40 px-3.5 py-1.5 rounded-full shadow-xs">
            <Award size={16} className="text-[#007b8a]" />
            <span className="text-base font-bold text-slate-950 font-dana-yad">
              {unlockedCount} מתוך {totalCount} תגים פתוחים
            </span>
          </div>
        </div>

        {/* Interactive Animal Badge Strip (Uses DB Image with Vector Fallback) */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-1.5 bg-slate-200/60 rounded-2xl border border-slate-300/70 mb-4">
          {milestones.map((milestone, idx) => {
            const isUnlocked = activeCategories.has(milestone.id);
            const isSelected = selectedIdx === idx;

            return (
              <button
                key={milestone.id}
                onClick={() => setSelectedIdx(idx)}
                className={`relative py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-300 outline-none ${
                  isSelected 
                    ? 'bg-white shadow-md ring-2 ring-[#00AFC2] scale-102 z-10' 
                    : isUnlocked 
                      ? 'bg-white/50 hover:bg-white/80 text-slate-800' 
                      : 'bg-slate-100/50 hover:bg-slate-100/90 text-slate-400 opacity-60'
                }`}
              >
                {/* Active Indicator Top Dot */}
                {isSelected && (
                  <motion.div 
                    layoutId="activePill"
                    className="absolute -top-1 w-2 h-2 rounded-full bg-[#00AFC2]"
                  />
                )}

                <div className="h-10 sm:h-11 flex items-center justify-center mb-1">
                  <AnimalAvatar 
                    src={milestone.src} 
                    name={milestone.name} 
                    isUnlocked={isUnlocked} 
                    isSelected={isSelected} 
                    size="sm"
                  />
                </div>

                <span className={`text-xs sm:text-sm font-dana-yad font-bold truncate max-w-full ${
                  isSelected ? 'text-slate-950 font-black' : isUnlocked ? 'text-slate-800' : 'text-slate-500'
                }`}>
                  {milestone.name}
                </span>

                {/* Status Dot Indicator */}
                <div className="mt-1 flex items-center justify-center">
                  {isUnlocked ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  ) : (
                    <Lock size={10} className="text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Milestone Showcase Card (Smooth Animated Transition & DB Image) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMilestone.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${
              isSelectedUnlocked 
                ? 'bg-gradient-to-br from-cyan-50/90 via-white to-sky-50/60 border-cyan-300 shadow-sm' 
                : 'bg-slate-100/80 border-slate-200 shadow-xs'
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                  isSelectedUnlocked 
                    ? 'bg-cyan-100 text-cyan-900 border-cyan-300' 
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}>
                  {selectedMilestone.badge}
                </span>
                <span className="text-xs sm:text-sm font-sans font-semibold text-slate-500">
                  • {selectedMilestone.title}
                </span>
              </div>

              <div>
                {isSelectedUnlocked ? (
                  <span className="flex items-center gap-1 text-xs font-sans font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-xs">
                    <Check size={12} strokeWidth={3} />
                    פתוח בחשבונך
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-sans font-medium text-slate-600 bg-slate-200/90 border border-slate-300 px-2 py-0.5 rounded-full">
                    <Lock size={11} />
                    נעול כרגע
                  </span>
                )}
              </div>
            </div>

            {/* Content with Large Animal Image & Text */}
            <div className="my-2 flex items-center gap-4">
              <div className="shrink-0 p-2 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs flex items-center justify-center">
                <AnimalAvatar 
                  src={selectedMilestone.src} 
                  name={selectedMilestone.name} 
                  isUnlocked={isSelectedUnlocked} 
                  isSelected={true} 
                  size="md"
                />
              </div>

              <div className="flex-1">
                <h3 className="text-2xl sm:text-[1.75rem] font-bold font-dana-yad text-slate-950 mb-1">
                  {selectedMilestone.name}
                </h3>
                <p className="text-base sm:text-lg font-dana-yad font-semibold text-slate-800 leading-relaxed">
                  {selectedMilestone.desc}
                </p>
              </div>
            </div>

            {/* Criteria Footer */}
            <div className="pt-2.5 mt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs sm:text-sm font-dana-yad text-slate-700">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className={isSelectedUnlocked ? "text-[#00AFC2]" : "text-slate-400"} />
                <span className="font-semibold">{selectedMilestone.criteria}</span>
              </div>
              <span className="text-xs font-sans font-medium text-slate-400">
                {selectedIdx + 1} מתוך 5
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtle Hint & Mini Track */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-xs font-dana-yad text-slate-600">
        <div className="flex items-center gap-1.5">
          <Waves size={14} className="text-[#00AFC2]" />
          <span>לחץ על כל חיה למעלה לחשיפת פרטי האתגר והקריטריונים</span>
        </div>
        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden" dir="ltr">
          <div 
            className="h-full bg-gradient-to-r from-[#00AFC2] to-sky-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

    </div>
  );

  if (noFrame) {
    return content;
  }

  return (
    <div className="w-full h-full flex flex-col">
      {content}
    </div>
  );
};
