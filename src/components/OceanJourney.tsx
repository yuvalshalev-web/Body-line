import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { parseDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, Waves, Check, Award, Compass, ShieldCheck, Target, Trophy } from 'lucide-react';

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
    criteria: 'מוענק אוטומטית לכל חבר מועדון פעיל'
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
    criteria: 'התמדה ורצף אימונים בתנאי ים וחורף קרים (טמפ\' מים מתחת ל-20°)'
  },
  { 
    id: 'manta_ray', 
    src: assets?.mantaRay || assets?.manta_ray || '', 
    alt: 'מנטה ריי', 
    name: 'מנטה ריי', 
    title: 'גליידר קיץ',
    desc: 'חותר באנרגיה גבוהה בחום הקיץ. קצב, גלישה וסטייל טהור.',
    accent: '#0891b2',
    badge: 'רצף קיץ',
    criteria: 'רצף סשנים בחודשי הקיץ החמים (טמפ\' מים מעל 27°)'
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
    criteria: 'התמדה לאורך כל 4 עונות השנה ברציפות (מעל 20 סשנים בשנה)'
  },
  { 
    id: 'orca', 
    src: assets?.orca || '', 
    alt: 'אורקה', 
    name: 'אורקה', 
    title: 'מאסטר חוף הבית',
    desc: 'המאסטר האמיתי של הליין-אפ. השלמת את כל האתגרים הימיים!',
    accent: '#0f172a',
    badge: 'מאסטר עליון',
    criteria: 'הובלה וכיבוש כל תגי המועדון (פינגווין, מנטה ריי וכריש)'
  },
];

const VectorIllustration: React.FC<{ name: string; isUnlocked: boolean; isSelected?: boolean; className?: string }> = ({ 
  name, 
  isUnlocked, 
  isSelected = false,
  className = "w-9 h-9 sm:w-11 sm:h-11" 
}) => {
  const color = isUnlocked ? (isSelected ? '#0284c7' : '#0ea5e9') : '#94a3b8';
  
  if (name.includes('כוכב ים')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-sm`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 8 L61 36 L92 36 L66 55 L76 84 L50 66 L24 84 L34 55 L8 36 L39 36 Z" fill={color} fillOpacity={isUnlocked ? "0.95" : "0.25"} />
        <circle cx="50" cy="48" r="5" fill="white" opacity={isUnlocked ? "0.9" : "0.3"} />
      </svg>
    );
  }
  if (name.includes('פינגווין')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-sm`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="62" rx="20" ry="28" fill={color} fillOpacity={isUnlocked ? "0.95" : "0.25"} />
        <ellipse cx="50" cy="60" rx="12" ry="18" fill="white" opacity={isUnlocked ? "0.8" : "0.2"} />
        <circle cx="50" cy="28" r="13" fill={color} fillOpacity={isUnlocked ? "0.95" : "0.25"} />
        <path d="M47 31 L53 31 L50 36 Z" fill={isUnlocked ? "#f59e0b" : "#cbd5e1"} />
      </svg>
    );
  }
  if (name.includes('מנטה')) {
    return (
      <svg viewBox="0 0 200 100" className={`${className} drop-shadow-sm`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 50 Q100 12 180 50 Q100 88 20 50 Z" fill={color} fillOpacity={isUnlocked ? "0.95" : "0.25"} />
        <path d="M90 50 Q100 40 110 50" stroke="white" strokeWidth="2.5" opacity={isUnlocked ? "0.8" : "0.3"} />
        <path d="M100 78 L100 105" stroke={color} strokeWidth="3" opacity={isUnlocked ? "0.9" : "0.25"} />
      </svg>
    );
  }
  if (name.includes('כריש')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-sm`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50 Q50 22 90 50 Q50 78 10 50 Z" fill={color} fillOpacity={isUnlocked ? "0.95" : "0.25"} />
        <path d="M52 35 L70 18 L62 38 Z" fill={color} fillOpacity={isUnlocked ? "0.95" : "0.25"} />
        <circle cx="75" cy="46" r="2.5" fill="white" opacity={isUnlocked ? "0.9" : "0.3"} />
      </svg>
    );
  }
  if (name.includes('אורקה')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} drop-shadow-sm`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 58 Q50 20 90 58 Q50 88 10 58 Z" fill={color} fillOpacity={isUnlocked ? "0.95" : "0.25"} />
        <path d="M42 38 L56 16 L52 42 Z" fill={color} fillOpacity={isUnlocked ? "0.95" : "0.25"} />
        <ellipse cx="70" cy="50" rx="6" ry="3" fill="white" opacity={isUnlocked ? "0.9" : "0.3"} />
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
    sm: 'w-10 h-10 sm:w-12 sm:h-12',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-28'
  };

  if (src && !imgError) {
    return (
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className={`w-full h-full object-contain transition-all duration-300 ${
            !isUnlocked ? 'grayscale opacity-30 brightness-75 contrast-75' : 'drop-shadow-md'
          } ${isSelected ? 'scale-105' : ''}`}
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
    <div className="relative w-full h-full rounded-[2rem] bg-white/85 border border-slate-200/90 p-5 sm:p-7 md:p-8 backdrop-blur-xl shadow-sm flex flex-col justify-between" dir="rtl">
      
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/70 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-[#008da5] uppercase tracking-wider mb-1">
              <Award size={15} />
              <span>תגי הישג והצטיינות ימית</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-dana-yad">
              איזו חיה ימית אתה?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">
              גלה אילו תגים ימיים הרווחת בזכות התמדה, עונות השנה ותנאי הים
            </p>
          </div>

          {/* Unlocked Summary Badge */}
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300/80 px-4 py-2 rounded-2xl shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Trophy size={16} />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">אוסף התגים שלך</span>
              <span className="text-sm font-black text-slate-900 font-dana-yad">
                <strong className="text-emerald-700 font-mono text-base">{unlockedCount}</strong> מתוך {totalCount} תגים נכבשו!
              </span>
            </div>
          </div>
        </div>

        {/* 5-ANIMAL INTERACTIVE BADGE STRIP - HIGH CONTRAST EARNED VS LOCKED */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {milestones.map((milestone, idx) => {
            const isUnlocked = activeCategories.has(milestone.id);
            const isSelected = selectedIdx === idx;

            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`relative p-3.5 sm:p-4 rounded-2xl flex flex-col items-center justify-between gap-2.5 transition-all duration-200 outline-none text-center cursor-pointer ${
                  isUnlocked
                    ? isSelected
                      ? 'bg-gradient-to-b from-white to-emerald-50/80 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-400/20 scale-[1.02] z-10'
                      : 'bg-white hover:bg-emerald-50/40 border border-emerald-300/80 shadow-xs hover:shadow-sm'
                    : isSelected
                      ? 'bg-slate-100 border-2 border-slate-400 shadow-sm z-10'
                      : 'bg-slate-100/50 hover:bg-slate-100 border border-dashed border-slate-300/90 opacity-60 hover:opacity-85'
                }`}
              >
                {/* Clear Status Top Pill */}
                <div className="w-full flex justify-center">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                      <Check size={10} strokeWidth={3.5} />
                      הרווחת!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                      <Lock size={9} />
                      נעול
                    </span>
                  )}
                </div>

                {/* Animal Avatar on illuminated circular pedestal if unlocked */}
                <div className={`p-2 rounded-2xl transition-all ${
                  isUnlocked ? 'bg-gradient-to-br from-sky-50 to-emerald-50 shadow-inner' : 'bg-slate-200/40'
                }`}>
                  <AnimalAvatar 
                    src={milestone.src} 
                    name={milestone.name} 
                    isUnlocked={isUnlocked} 
                    isSelected={isSelected} 
                    size="sm"
                  />
                </div>

                {/* Name & Badge */}
                <div>
                  <h4 className={`text-sm sm:text-base font-dana-yad font-bold leading-tight ${
                    isUnlocked ? 'text-slate-900 font-black' : 'text-slate-500'
                  }`}>
                    {milestone.name}
                  </h4>
                  <span className="text-[10px] font-sans font-bold text-slate-400 block mt-0.5">
                    {milestone.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Milestone Showcase Card (Different Styling for Unlocked vs Locked) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMilestone.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 ${
              isSelectedUnlocked 
                ? 'bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/70 border-emerald-300 shadow-sm' 
                : 'bg-slate-50 border-dashed border-slate-300 shadow-xs'
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  isSelectedUnlocked 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedMilestone.badge}
                </span>
                <span className="text-sm font-black text-slate-700 font-dana-yad">
                  • {selectedMilestone.title}
                </span>
              </div>

              <div>
                {isSelectedUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-xs">
                    <Check size={14} strokeWidth={3} />
                    תג פתוח באוסף שלך!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full">
                    <Target size={13} className="text-amber-600" />
                    אתגר פתוח להשגה
                  </span>
                )}
              </div>
            </div>

            {/* Content with Large Animal Image & Text */}
            <div className="my-2 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-right">
              <div className={`shrink-0 p-3 rounded-2xl flex items-center justify-center ${
                isSelectedUnlocked 
                  ? 'bg-white shadow-md border border-emerald-200 ring-4 ring-emerald-100/60' 
                  : 'bg-slate-200/60 border border-slate-300 opacity-70'
              }`}>
                <AnimalAvatar 
                  src={selectedMilestone.src} 
                  name={selectedMilestone.name} 
                  isUnlocked={isSelectedUnlocked} 
                  isSelected={true} 
                  size="md"
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black font-dana-yad text-slate-900">
                    {selectedMilestone.name}
                  </h3>
                  {isSelectedUnlocked && (
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-dana-yad">
                      נכבש בהצלחה 🌊
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base font-dana-yad font-bold text-slate-700 leading-relaxed max-w-2xl">
                  {selectedMilestone.desc}
                </p>
              </div>
            </div>

            {/* Criteria Box */}
            <div className={`mt-4 pt-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-dana-yad ${
              isSelectedUnlocked ? 'border-emerald-200 text-emerald-900' : 'border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={isSelectedUnlocked ? "text-emerald-600" : "text-amber-600"} />
                <span className="font-bold">
                  {isSelectedUnlocked ? 'הקריטריון שהשגת:' : 'איך מרוויחים את התג?'} <strong className="text-slate-900">{selectedMilestone.criteria}</strong>
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 self-end sm:self-auto">
                תג {selectedIdx + 1} מתוך 5
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Track */}
      <div className="mt-5 pt-4 border-t border-slate-200/70 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm font-dana-yad text-slate-600 font-bold">
        <div className="flex items-center gap-1.5">
          <Waves size={16} className="text-sky-600" />
          <span>לחץ על כל חיה למעלה לצפייה בקריטריון ובהישג המלא</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">{unlockedCount}/{totalCount}</span>
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden" dir="ltr">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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

export default OceanJourney;
