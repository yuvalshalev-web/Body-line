import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { parseDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, CheckCircle2, Star, Info, Waves, HelpCircle, X } from 'lucide-react';

const starfishImg = '';
const penguinImg = '';
const mantaRayImg = '';
const sharkImg = '';
const orcaImg = '';
const corkImg = '';

const getMilestones = (assets: any) => [
  { 
    id: 'starfish', 
    src: assets?.starfish || starfishImg, 
    alt: 'Starfish', 
    name: 'כוכב ים', 
    desc: 'הצעד הראשון שלך במים. ברוך הבא לקהילה!',
    color: 'from-amber-200 to-amber-500',
    glow: 'shadow-amber-500/50'
  },
  { 
    id: 'penguin', 
    src: assets?.penguin || penguinImg, 
    alt: 'Penguin', 
    name: 'פינגווין', 
    desc: 'לוחם חורף אמיתי. המים הקרים הם הבית שלך.',
    color: 'from-blue-300 to-blue-600',
    glow: 'shadow-blue-500/50'
  },
  { 
    id: 'manta_ray', 
    src: assets?.mantaRay || mantaRayImg, 
    alt: 'Manta Ray', 
    name: 'מנטה ריי', 
    desc: 'שורד את חום הקיץ עם חיוך. אנרגיה טהורה.',
    color: 'from-orange-300 to-orange-600',
    glow: 'shadow-orange-500/50'
  },
  { 
    id: 'shark', 
    src: assets?.shark || sharkImg, 
    alt: 'Shark', 
    name: 'כריש', 
    desc: 'טורף עקביות. אתה מגיע לכל סשן, בכל מצב.',
    color: 'from-slate-400 to-slate-700',
    glow: 'shadow-slate-500/50'
  },
  { 
    id: 'orca', 
    src: assets?.orca || orcaImg, 
    alt: 'Orca', 
    name: 'אורקה', 
    desc: 'מאסטר חוף הבית. השלמת את כל האתגרים!',
    color: 'from-indigo-500 to-purple-800',
    glow: 'shadow-indigo-500/50'
  },
];

const MilestoneIllustration: React.FC<{ name: string; isUnlocked: boolean }> = ({ name, isUnlocked }) => {
  const color = isUnlocked ? '#007085' : '#94a3b8';
  
  if (name.includes('כוכב ים')) {
    return (
      <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 5 L61 35 L95 35 L68 55 L78 85 L50 65 L22 85 L32 55 L5 35 L39 35 Z" fill={color} opacity="0.6" />
        <circle cx="50" cy="50" r="5" fill="white" opacity="0.3" />
      </svg>
    );
  }
  if (name.includes('פינגווין')) {
    return (
      <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="60" rx="25" ry="35" fill={color} opacity="0.6" />
        <ellipse cx="50" cy="55" rx="15" ry="25" fill="white" opacity="0.2" />
        <circle cx="50" cy="25" r="15" fill={color} opacity="0.6" />
        <circle cx="45" cy="22" r="2" fill="white" />
        <circle cx="55" cy="22" r="2" fill="white" />
        <path d="M48 30 L52 30 L50 35 Z" fill="#f59e0b" />
      </svg>
    );
  }
  if (name.includes('מנטה')) {
    return (
      <svg viewBox="0 0 200 100" className="w-48 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 50 Q100 10 180 50 Q100 90 20 50 Z" fill={color} opacity="0.6" />
        <path d="M90 50 Q100 40 110 50" stroke="white" strokeWidth="2" opacity="0.3" />
        <path d="M100 80 L100 120" stroke={color} strokeWidth="4" opacity="0.4" />
      </svg>
    );
  }
  if (name.includes('כריש')) {
    return (
      <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50 Q50 20 90 50 Q50 80 10 50 Z" fill={color} opacity="0.6" />
        <path d="M50 35 L70 20 L60 40 Z" fill={color} opacity="0.6" />
        <circle cx="75" cy="45" r="2" fill="white" />
      </svg>
    );
  }
  if (name.includes('אורקה')) {
    return (
      <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 60 Q50 20 90 60 Q50 90 10 60 Z" fill={color} opacity="0.6" />
        <path d="M40 40 L55 15 L50 45 Z" fill={color} opacity="0.6" />
        <ellipse cx="70" cy="50" rx="8" ry="4" fill="white" opacity="0.4" />
      </svg>
    );
  }
  if (name.includes('פקק')) {
    return (
      <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="35" y="30" width="30" height="40" rx="4" fill={color} opacity="0.6" />
        <rect x="30" y="25" width="40" height="10" rx="2" fill={color} opacity="0.8" />
        <path d="M40 45 L60 45 M40 55 L60 55" stroke="white" strokeWidth="2" opacity="0.3" />
      </svg>
    );
  }
  return <HelpCircle size={48} color={color} />;
};

const MilestoneNote = ({ milestone, index, isUnlocked, compact, style }: { 
  milestone: any; 
  index: number; 
  isUnlocked: boolean; 
  compact: boolean; 
  style: any; 
}) => {
  const [isShaking, setIsShaking] = useState(false);

  const handleLockedClick = () => {
    if (!isUnlocked) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: isShaking ? [0, -4, 4, -4, 4, 0] : 0
      }}
      transition={{ 
        opacity: { delay: index * 0.1 },
        scale: { delay: index * 0.1 },
        x: { duration: 0.4 }
      }}
      onClick={handleLockedClick}
      className={`relative group flex-shrink-0 ${compact ? `w-48 ${index > 0 ? style.mt : ''} ${style.compactX}` : 'w-44 md:w-full'} ${style.rotate} ${!isUnlocked ? 'cursor-pointer' : ''}`}
      style={{ zIndex: compact ? index + 1 : 1 }}
    >
      {/* Milestone Note Content */}
      <div 
        className={`
          relative flex flex-col items-center justify-center text-center p-4 transition-all duration-500
          opacity-100 min-h-[240px] font-dana-yad
        `}
        style={{
          backgroundColor: style.bg,
          fontFamily: 'var(--font-dana-yad)',
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.05) 100%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.06'/%3E%3C/svg%3E")
          `,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15), 4px 8px 15px rgba(0,0,0,0.12), -2px 10px 15px rgba(0,0,0,0.08), inset 0 -12px 15px -5px rgba(0,0,0,0.08)',
          borderRadius: '2px 255px 3px 25px / 255px 5px 225px 3px'
        }}
      >
        {/* Thumbtack Pin */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
          <div className="absolute top-2 left-2 w-3 h-3 bg-black/30 rounded-full blur-[2px]" />
          <div 
            className="relative w-4 h-4 rounded-full shadow-[inset_-1px_-1px_3px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] border border-black/10"
            style={{ background: style.pin }}
          />
        </div>

        {/* Glass Overlay for Locked State */}
        {!isUnlocked && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[inherit] overflow-hidden group/locked">
            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[4px]" />
            
            {/* Animated Shimmer Background */}
            <motion.div 
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ 
                duration: 15, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-20"
            />

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                {/* Outer Pulse Glow */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 bg-[#00426a]/30 blur-2xl rounded-full"
                />
                
                {/* Icon Container - Porthole Style */}
                <div className="relative w-24 h-24 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center shadow-[0_15px_35px_rgba(0,66,106,0.15),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
                  {/* Inner Shimmer Effect */}
                  <motion.div 
                    animate={{ x: [-120, 120] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                  />
                  
                  {/* The Lock Icon */}
                  <div className="relative">
                    <Lock className="w-12 h-12 text-[#00426a]/50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
                    {/* Tiny Sparkle */}
                    <motion.div
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Star size={10} className="text-white fill-white" />
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Status Label */}
              <motion.span 
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[9px] font-black text-[#00426a]/50 uppercase tracking-[0.3em] mt-4 mr-1"
              >
                עדיין נעול
              </motion.span>
            </div>
          </div>
        )}

        {/* Image Container */}
        {(() => {
          const getMilestoneSrc = (name: string, currentSrc: string) => {
            if (currentSrc) return currentSrc;
            return '';
          };
          
          const milestoneSrc = getMilestoneSrc(milestone.name, milestone.src);
          
          return (
            <div className={`${milestone.name.includes('מנטה') ? 'w-56 h-56' : 'w-32 h-32'} mb-4 flex items-center justify-center relative flex-shrink-0`}>
              {milestoneSrc ? (
                <img 
                  src={milestoneSrc} 
                  alt={milestone.alt} 
                  className={`object-contain relative z-10 ${!isUnlocked ? 'opacity-40 grayscale' : ''} ${
                    milestone.name.includes('כריש') ? 'w-36 h-36' : 
                    milestone.name.includes('אורקה') ? 'w-44 h-44 max-w-none max-h-none' : 
                    milestone.name.includes('פינגווין') ? 'w-36 h-36' : 
                    milestone.name.includes('מנטה') ? 'w-56 h-56 max-w-none max-h-none' : 'w-32 h-32'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center ${!isUnlocked ? 'opacity-40 grayscale' : ''}`}>
                   <MilestoneIllustration name={milestone.name} isUnlocked={isUnlocked} />
                </div>
              )}
            </div>
          );
        })()}

        <h4 className="text-base font-normal text-slate-800 mb-1 font-dana-yad">
            {milestone.name}
        </h4>
        
        {!compact && (
            <p className={`text-xs font-normal leading-tight text-slate-700 font-dana-yad`}>
            {milestone.desc}
            </p>
        )}
      </div>
    </motion.div>
  );
};

export const OceanJourney: React.FC<{ compact?: boolean, noFrame?: boolean }> = ({ compact = false, noFrame = false }) => {
  const { members, weeklyHistory, siteAssets } = useData();
  const { currentUser } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  const milestones = useMemo(() => getMilestones(siteAssets), [siteAssets]);
  const currentCorkImg = siteAssets?.cork || corkImg;

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
          else if (streak > 0) break; // Only break if we've started a streak
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

    // Thresholds: Must have at least a few sessions to even be considered
    const penguins = [...memberStats]
      .filter(m => m.winterCount >= 8) // Increased from 3 to 8
      .sort((a, b) => b.winterGrit - a.winterGrit)
      .slice(0, 3); // Top 3 instead of Top 5

    const jellyfish = [...memberStats]
      .filter(m => m.summerCount >= 8) // Increased from 3 to 8
      .sort((a, b) => b.summerGrit - a.summerGrit)
      .slice(0, 3); // Top 3 instead of Top 5

    const sharks = [...memberStats]
      .filter(m => m.totalAttendance >= 20) // Increased from 8 to 20
      .sort((a, b) => a.variance - b.variance || b.totalAttendance - a.totalAttendance)
      .slice(0, 3); // Top 3 instead of Top 5

    // Orca is the elite: Top 1 in all categories
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

  const unlockedCount = activeCategories.size;
  const totalCount = milestones.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  return (
    <section 
      className={`relative overflow-hidden ${compact ? 'flex flex-col px-2 py-4' : 'py-16 px-4 md:px-8'}`}
      style={{
        backgroundColor: '#b87e4a',
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.5) 100%),
          url("${currentCorkImg}")
        `,
        backgroundSize: '100%, cover',
        backgroundPosition: 'center, center',
        borderStyle: noFrame ? 'none' : 'solid',
        borderWidth: noFrame ? '0' : (compact ? '12px' : '24px'),
        borderTopColor: '#d49a6a',
        borderLeftColor: '#c28553',
        borderRightColor: '#9e6538',
        borderBottomColor: '#855026',
        boxShadow: noFrame ? 'inset 0 10px 20px rgba(0,0,0,0.5), inset 0 -10px 20px rgba(0,0,0,0.3), inset 10px 0 20px rgba(0,0,0,0.4), inset -10px 0 20px rgba(0,0,0,0.4)' : 'inset 0 10px 20px rgba(0,0,0,0.5), inset 0 -10px 20px rgba(0,0,0,0.3), inset 10px 0 20px rgba(0,0,0,0.4), inset -10px 0 20px rgba(0,0,0,0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        borderRadius: noFrame ? '0' : '4px'
      }}
    >
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className={`flex ${compact ? 'flex-col items-center gap-4 mb-4' : 'flex-col lg:flex-row items-center justify-center gap-8 mb-16'}`}>
          {/* Main Title Container */}
          <div 
            className={`text-center relative ${compact ? 'p-3 w-64 translate-x-12 rotate-[3deg] z-10' : 'p-4 md:p-6 w-full max-w-xl rotate-[1deg]'} transform font-dana-yad`}
            style={{
              backgroundColor: '#fdfdfd',
              backgroundImage: `
                linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.03) 100%),
                url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")
              `,
              boxShadow: '0 2px 5px rgba(0,0,0,0.15), 5px 10px 15px rgba(0,0,0,0.1), -3px 12px 15px rgba(0,0,0,0.08), inset 0 -10px 15px -5px rgba(0,0,0,0.05)',
              borderRadius: '2px 255px 3px 25px / 255px 5px 225px 3px'
            }}
          >
            {/* Thumbtack */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="absolute top-2 left-2 w-3 h-3 bg-black/30 rounded-full blur-[2px]" />
              <div 
                className="relative w-4 h-4 rounded-full shadow-[inset_-1px_-1px_3px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] border border-black/10"
                style={{ background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #c93030)' }}
              />
            </div>

            <h2 
              className={`${compact ? 'text-lg md:text-xl mb-3 mt-2' : 'text-3xl md:text-4xl mb-6 mt-2'} font-normal text-[#00426a] tracking-tighter font-dana-yad`}
              style={{ fontFamily: 'var(--font-dana-yad)' }}
            >
              איזו חיה ימית אתה?
            </h2>
            
            <div className="max-w-md mx-auto">
              <div className={`flex justify-between items-end ${compact ? 'mb-1' : 'mb-2'}`}>
                <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-black text-cyan-600 uppercase tracking-widest`}>התקדמות המסע</span>
                <span className={`${compact ? 'text-lg' : 'text-2xl'} font-black text-[#00426a]`}>{unlockedCount}/{totalCount}</span>
              </div>
              <div className={`${compact ? 'h-2' : 'h-3'} w-full bg-[#00426a]/5 rounded-full overflow-hidden border border-[#00426a]/10 p-0.5`} dir="ltr">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                />
              </div>
            </div>
          </div>

          {/* Explanation Sticky Note */}
          <div className={`relative w-full max-w-sm mx-auto transform ${compact ? '-translate-x-12 rotate-[-3deg] z-20 scale-90' : 'rotate-[-1deg]'}`} style={{ filter: 'drop-shadow(3px 5px 5px rgba(0,0,0,0.2))' }}>
            {/* Tape */}
            <div 
              className={`absolute ${compact ? '-top-3' : '-top-4'} left-1/2 -translate-x-1/2 ${compact ? 'w-16 h-8' : 'w-24 h-10'} z-20`}
              style={{
                backgroundColor: '#d69b3a',
                backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.05) 50%, transparent 50%)',
                backgroundSize: '4px 100%',
                transform: 'translateX(-50%) rotate(-2deg)',
                boxShadow: '1px 2px 4px rgba(0,0,0,0.15)',
                borderRadius: '2px'
              }}
            />
            
            {/* Paper */}
            <div 
              className={`relative ${compact ? 'p-5 pl-8 min-h-[200px]' : 'p-8 pl-12 min-h-[320px]'} font-dana-yad`}
              style={{
                backgroundColor: '#f5efe6',
                backgroundImage: `repeating-linear-gradient(transparent, transparent ${compact ? '23px' : '31px'}, #d1c8b8 ${compact ? '23px' : '31px'}, #d1c8b8 ${compact ? '24px' : '32px'})`,
                backgroundPosition: `0 ${compact ? '12px' : '16px'}`,
                maskImage: `radial-gradient(circle at 0px ${compact ? '12px' : '16px'}, transparent ${compact ? '6px' : '8px'}, black ${compact ? '6.5px' : '8.5px'})`,
                maskSize: `100% ${compact ? '24px' : '32px'}`,
                maskRepeat: 'repeat-y',
                WebkitMaskImage: `radial-gradient(circle at 0px ${compact ? '12px' : '16px'}, transparent ${compact ? '6px' : '8px'}, black ${compact ? '6.5px' : '8.5px'})`,
                WebkitMaskSize: `100% ${compact ? '24px' : '32px'}`,
                WebkitMaskRepeat: 'repeat-y',
              }}
            >
              <h4 className={`${compact ? 'text-2xl mb-2' : 'text-3xl mb-4'} font-normal text-slate-800 text-center mt-2 font-dana-yad`}>איך מתקדמים במסע?</h4>
              <ul style={{ lineHeight: compact ? '24px' : '32px' }} className={`space-y-0 ${compact ? 'text-lg' : 'text-2xl'} font-normal text-slate-800 text-right font-dana-yad`}>
                <li><strong className="text-amber-600">כוכב ים:</strong> מוענק לכל חבר חדש.</li>
                <li><strong className="text-blue-600">פינגווין:</strong> התמדה באימוני חורף.</li>
                <li><strong className="text-orange-600">מנטה ריי:</strong> רצף אימונים בקיץ.</li>
                <li><strong className="text-slate-600">כריש:</strong> הגעה עקבית לכל הסשנים.</li>
                <li><strong className="text-red-600">אורקה:</strong> המאסטר האמיתי!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quest Path Visualization */}
        <div className={`relative w-full ${compact ? 'pb-2 pt-2' : 'pb-8 pt-8'}`}>
          <div className="w-full relative mx-auto px-4 md:px-0">
            {/* Connecting Line (Desktop only) */}
            {!compact && <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-[#00426a]/5 -translate-y-1/2 z-0" />}
            
            <div className={`flex ${compact ? 'flex-col items-center' : 'flex-row overflow-x-auto md:grid md:grid-cols-5 gap-2 md:gap-4'} pb-4 pt-4 relative z-10 no-scrollbar`}>
              {milestones.map((milestone, index) => {
                const isUnlocked = activeCategories.has(milestone.id);
                
                const noteStyles = [
                  { bg: '#eaf645', pin: 'radial-gradient(circle at 30% 30%, #5c95ff, #1a5bb8)', rotate: 'rotate-[-4deg]', compactX: '-translate-x-16', mt: 'mt-0' },
                  { bg: '#ffbe4d', pin: 'radial-gradient(circle at 30% 30%, #ffffff, #d0d0d0)', rotate: 'rotate-[6deg]', compactX: 'translate-x-16', mt: '-mt-16' },
                  { bg: '#ffb5c5', pin: 'radial-gradient(circle at 30% 30%, #ff6b4a, #c92a18)', rotate: 'rotate-[-3deg]', compactX: '-translate-x-16', mt: '-mt-16' },
                  { bg: '#7ae0f5', pin: 'radial-gradient(circle at 30% 30%, #5c95ff, #1a5bb8)', rotate: 'rotate-[5deg]', compactX: 'translate-x-16', mt: '-mt-16' },
                  { bg: '#ff8c8c', pin: 'radial-gradient(circle at 30% 30%, #ff6b4a, #c92a18)', rotate: 'rotate-[-4deg]', compactX: '-translate-x-16', mt: '-mt-16' }
                ];
                
                const style = noteStyles[index % noteStyles.length];
                
                return (
                  <MilestoneNote
                    key={milestone.id}
                    milestone={milestone}
                    index={index}
                    isUnlocked={isUnlocked}
                    compact={compact}
                    style={style}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Motivation */}
        {!compact && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-20 text-center"
          >
            <div 
              className="inline-block p-8 relative transform rotate-[-1deg] max-w-2xl mx-auto"
              style={{
                backgroundColor: '#fdfdfd',
                backgroundImage: `
                  linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.03) 100%),
                  url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")
                `,
                boxShadow: '0 2px 5px rgba(0,0,0,0.15), 5px 10px 15px rgba(0,0,0,0.1), -3px 12px 15px rgba(0,0,0,0.08), inset 0 -10px 15px -5px rgba(0,0,0,0.05)',
                borderRadius: '2px 255px 3px 25px / 255px 5px 225px 3px'
              }}
            >
              {/* Thumbtack */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <div className="absolute top-2 left-2 w-3 h-3 bg-black/30 rounded-full blur-[2px]" />
                <div 
                  className="relative w-4 h-4 rounded-full shadow-[inset_-1px_-1px_3px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] border border-black/10"
                  style={{ background: 'radial-gradient(circle at 30% 30%, #ffea4d, #d4b517)' }}
                />
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right relative z-10">
                <motion.div 
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30"
                >
                  <Waves size={32} />
                </motion.div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black mb-2 bg-gradient-to-l from-[#00426a] to-cyan-600 bg-clip-text text-transparent">
                    חוף הבית מחכה לך
                  </h3>
                  <p className="text-sm md:text-base font-bold text-[#00426a]/80 leading-relaxed">
                    המשך להתמיד, כל סשן מקרב אותך לדרגה הבאה במסע.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
