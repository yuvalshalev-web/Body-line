import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { parseDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, Waves, Check, Award, Compass, ShieldCheck, Target, Trophy, X, ChevronLeft } from 'lucide-react';

const getMilestones = (assets: any) => [
  { 
    id: 'starfish', 
    src: assets?.starfish || assets?.starFish || '', 
    alt: 'כוכב ים', 
    name: 'כוכב ים', 
    title: 'הצעד הראשון במים',
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
    title: 'לוחם אימוני חורף',
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
    title: 'גליידר עונת הקיץ',
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
    title: 'מכונת עקביות שנתית',
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
  className = "w-10 h-10 sm:w-12 sm:h-12" 
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
    sm: 'w-12 h-12 sm:w-14 sm:h-14',
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
            !isUnlocked ? 'grayscale opacity-35 brightness-75 contrast-75' : 'drop-shadow-md'
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

  // Selected milestone for modal inspection
  const [inspectedIdx, setInspectedIdx] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const inspectedMilestone = milestones[inspectedIdx];
  const isInspectedUnlocked = activeCategories.has(inspectedMilestone.id);
  const unlockedCount = activeCategories.size;
  const totalCount = milestones.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  const openMilestoneModal = (idx: number) => {
    setInspectedIdx(idx);
    setIsModalOpen(true);
  };

  const content = (
    <div className="relative w-full h-full rounded-[2.25rem] bg-white/75 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 p-5 sm:p-7 md:p-8 shadow-[0_20px_50px_-15px_rgba(0,120,180,0.12),0_0_1px_1px_rgba(255,255,255,0.8)_inset] flex flex-col justify-between overflow-hidden font-yehuda text-right select-none before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent before:pointer-events-none" dir="rtl">
      
      {/* Ambient Multi-chromatic Sea Glaze Flares */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-teal-200/50 via-cyan-200/40 to-blue-100/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-sky-200/40 via-emerald-100/30 to-amber-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-100/30 rounded-full blur-2xl pointer-events-none" />

      {/* 1. TOP HEADER & SUMMARY BADGE */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-sky-800 uppercase tracking-wider mb-1 font-yehuda">
            <Award size={15} className="text-sky-600" />
            <span>תגי הישג והצטיינות ימית</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-yehuda font-bold">אוסף חיות הים</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 font-yehuda">
            <span>איזו חיה ימית אתה?</span>
          </h2>
        </div>

        {/* User's Trophy Collection Glassmorphic Quick Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-emerald-50/90 via-white/80 to-teal-50/80 backdrop-blur-md border border-emerald-300/80 rounded-2xl shadow-2xs hover:shadow-[0_8px_20px_-4px_rgba(16,185,129,0.2)] transition-all duration-300 text-right shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
            <Trophy size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">אוסף התגים שלך:</span>
              <span className="text-sm font-black text-slate-900 font-yehuda">{unlockedCount} מתוך {totalCount} תגים</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 block font-yehuda">
              {progressPercent === 100 ? '🎉 האוסף הושלם במלואו!' : `${Math.round(progressPercent)}% מהתגים נכבשו`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SECTION SUBTITLE BAR */}
      <div className="relative z-10 mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <span className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-1.5 font-yehuda">
              <Waves size={15} className="text-sky-600" />
              <span>אוסף 5 התגים הימיים (לחץ על כל חיה לפירוט מלא)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-yehuda">
              התקדמות באוסף:
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs shadow-xs">
              {unlockedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* 3. 5-ANIMAL GLASSMORPHIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 relative">
          {milestones.map((milestone, idx) => {
            const isUnlocked = activeCategories.has(milestone.id);

            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => openMilestoneModal(idx)}
                className={`group relative p-4 sm:p-5 rounded-3xl text-right transition-all duration-300 cursor-pointer flex flex-col justify-between gap-3.5 active:scale-95 ${
                  isUnlocked
                    ? 'bg-white/80 hover:bg-white/95 backdrop-blur-md border-2 border-emerald-400/90 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.18)] hover:shadow-[0_10px_25px_-6px_rgba(16,185,129,0.28)] hover:-translate-y-1 text-slate-900 z-10'
                    : 'bg-white/40 hover:bg-white/80 backdrop-blur-sm border-2 border-dashed border-slate-300/80 text-slate-600 hover:border-slate-400 opacity-75 hover:opacity-100 hover:-translate-y-0.5'
                }`}
              >
                {/* Top Number Pill & Status Pill */}
                <div className="flex items-center justify-between w-full">
                  {/* Step Number Circle */}
                  <div className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                    isUnlocked ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>
                    0{idx + 1}
                  </div>

                  {/* Status Badge */}
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-900 bg-emerald-100/90 backdrop-blur-xs border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs font-yehuda">
                      <Check size={12} strokeWidth={3.5} />
                      נכבש
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/90 px-2 py-0.5 rounded-full font-yehuda">
                      <Lock size={10} />
                      נעול
                    </span>
                  )}
                </div>

                {/* Animal Avatar Centerpiece */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${
                    isUnlocked ? 'bg-gradient-to-br from-sky-50 to-emerald-50 shadow-inner ring-2 ring-emerald-200/60' : 'bg-slate-200/40'
                  }`}>
                    <AnimalAvatar 
                      src={milestone.src} 
                      name={milestone.name} 
                      isUnlocked={isUnlocked} 
                      isSelected={false} 
                      size="sm"
                    />
                  </div>
                </div>

                {/* Name & Badge Category */}
                <div className="text-center space-y-0.5">
                  <h3 className={`text-base sm:text-lg font-black leading-tight tracking-tight font-yehuda ${
                    isUnlocked ? 'text-slate-900 group-hover:text-emerald-800' : 'text-slate-700'
                  }`}>
                    {milestone.name}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 font-yehuda">
                    {milestone.badge}
                  </p>
                </div>

                {/* High-Visibility Interactive CTA Button */}
                <div className={`w-full mt-2 py-2 px-2.5 sm:px-3 rounded-xl flex items-center justify-between text-xs font-black font-yehuda transition-all duration-300 shadow-xs border ${
                  isUnlocked 
                    ? 'bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 border-emerald-300/90 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-md' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 group-hover:shadow-md'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="opacity-80 group-hover:opacity-100" />
                    <span>פתח פירוט</span>
                  </span>
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:-translate-x-1 bg-black/5 group-hover:bg-white/20">
                    <ChevronLeft size={15} strokeWidth={3} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. FOOTER PROGRESS BAR TRACK */}
      <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm font-yehuda text-slate-600 font-bold">
        <div className="flex items-center gap-1.5">
          <Waves size={16} className="text-sky-600" />
          <span>לחץ על כל חיה ימית לצפייה בקריטריון הזכייה ובהישג המלא</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 font-bold">{unlockedCount}/{totalCount} תגים</span>
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden" dir="ltr">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. ANIMAL DETAIL MODAL (GLASSMORPHIC BACKDROP & LUXURY DIALOG) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/80 max-h-[90vh] flex flex-col font-yehuda"
            >
              {/* Top Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#00283f] via-[#003e63] to-[#001f33] text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-400/20 border border-sky-300/40 flex items-center justify-center text-sky-300 shadow-md">
                    <Award size={22} />
                  </div>
                  <div>
                    <span className="text-xs text-sky-300 font-bold font-yehuda">
                      תג הישג ימי • {inspectedMilestone.badge}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black font-yehuda text-white">
                      {inspectedMilestone.name} ({inspectedMilestone.title})
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Tabs inside modal */}
              <div className="grid grid-cols-5 gap-1 p-2 bg-slate-100/90 border-b border-slate-200">
                {milestones.map((m, idx) => {
                  const isSelected = idx === inspectedIdx;
                  const isMUnlocked = activeCategories.has(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setInspectedIdx(idx)}
                      className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all font-yehuda ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-sm font-black ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <span className="truncate block">{m.name}</span>
                      {isMUnlocked ? (
                        <span className="text-[10px] text-emerald-600 font-black">✓ פתוח</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">🔒 נעול</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-7 overflow-y-auto space-y-5 font-yehuda">
                
                {/* Status Bar */}
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                  isInspectedUnlocked
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isInspectedUnlocked ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black">
                        <Lock size={15} />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block opacity-75">
                        סטטוס תג אישי
                      </span>
                      <span className="text-sm sm:text-base font-black">
                        {isInspectedUnlocked ? '🎉 התג נכבש ופתוח באוסף שלך!' : '🎯 אתגר ימי פתוח להשגה'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200">
                    תג {inspectedIdx + 1} מתוך 5
                  </span>
                </div>

                {/* Big Avatar & Title Description */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200 text-center sm:text-right">
                  <div className={`shrink-0 p-3 rounded-2xl flex items-center justify-center ${
                    isInspectedUnlocked 
                      ? 'bg-white shadow-md border border-emerald-200 ring-4 ring-emerald-100/60' 
                      : 'bg-slate-200/60 border border-slate-300 opacity-70'
                  }`}>
                    <AnimalAvatar 
                      src={inspectedMilestone.src} 
                      name={inspectedMilestone.name} 
                      isUnlocked={isInspectedUnlocked} 
                      isSelected={true} 
                      size="md"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 font-yehuda">
                      {inspectedMilestone.name} – {inspectedMilestone.title}
                    </h4>
                    <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed font-yehuda">
                      "{inspectedMilestone.desc}"
                    </p>
                  </div>
                </div>

                {/* Criteria Box */}
                <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5 font-yehuda">
                    <Sparkles size={15} className="text-sky-600" />
                    {isInspectedUnlocked ? 'הקריטריון שנכבש בהצלחה:' : 'איך מרוויחים את התג בים?'}
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed font-yehuda">
                    {inspectedMilestone.criteria}
                  </p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 font-yehuda">
                  סה"כ תגים שנכבשו: <strong className="text-emerald-700 font-mono font-black">{unlockedCount}</strong> מתוך {totalCount}
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer font-yehuda"
                >
                  סגור
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
