
import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';

const OrcaIllustration = ({ className, isActive = true }: { className?: string, isActive?: boolean }) => {
  const [imgSrc, setImgSrc] = useState("https://img.icons8.com/fluency/512/orca.png");

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="relative group">
        {/* Golden Glow for Orca */}
        {isActive && (
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 blur-2xl bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-200 rounded-full -z-10 scale-110"
          />
        )}
        
        <div className="relative z-10 p-2">
          <motion.div
            className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32"
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            {/* Base Image - High Contrast B&W */}
            <img 
              src={imgSrc}
              alt="Apex Orca"
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] contrast-[1.2] saturate-[0.1] brightness-[1.1]"
              referrerPolicy="no-referrer"
              onError={() => {
                setImgSrc("https://img.icons8.com/color/512/orca.png");
              }}
            />
            
            {/* Static Glossy Highlight */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/10 to-transparent mix-blend-overlay opacity-90"
              style={{
                WebkitMaskImage: `url(${imgSrc})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />

            {/* Moving Water Shimmer (Wet Effect) */}
            <motion.div 
              className="absolute inset-0 mix-blend-overlay opacity-70"
              style={{
                backgroundImage: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.9) 25%, transparent 30%)',
                backgroundSize: '200% 200%',
                WebkitMaskImage: `url(${imgSrc})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
              animate={{
                backgroundPosition: ['200% 0%', '-200% 0%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const TribeStatus: React.FC = () => {
  const { members, weeklyHistory } = useData();
  const { currentUser } = useAuth();
  const [showMockOrca, setShowMockOrca] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const stats = useMemo(() => {
    if (!members || !weeklyHistory || !currentUser) return null;

    // Helper to get water temp
    const getTemp = (session: any) => {
      if (session.waterTemp !== undefined && session.waterTemp !== null) return session.waterTemp;
      const date = session.date?.toDate ? session.date.toDate() : new Date(session.date);
      const month = date.getMonth();
      const averages = [17, 18, 20, 22, 25, 28, 29, 28, 26, 23, 20, 18];
      return averages[month];
    };

    // Helper to get season index
    const getSeasonIndex = (date: Date) => {
      const month = date.getMonth();
      if (month === 11 || month === 0 || month === 1) return 0;
      if (month >= 2 && month <= 4) return 1;
      if (month >= 5 && month <= 7) return 2;
      return 3;
    };

    const penguinSessions = weeklyHistory.filter(s => getTemp(s) < 20);
    const jellyfishSessions = weeklyHistory.filter(s => getTemp(s) > 27);

    const memberStats = members.map(member => {
      const winterSessions = penguinSessions.filter(s => s.participantIds?.includes(member.id));
      const summerSessions = jellyfishSessions.filter(s => s.participantIds?.includes(member.id));
      
      const getStreak = (sessions: any[], memberId: string) => {
        const sorted = [...sessions].sort((a, b) => {
          const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return db.getTime() - da.getTime();
        });
        let streak = 0;
        for (const s of sorted) {
          if (s.participantIds?.includes(memberId)) streak++;
          else break;
        }
        return streak;
      };

      const winterGrit = (winterSessions.length * 1.5) + (getStreak(winterSessions, member.id) * 4);
      const summerGrit = (summerSessions.length * 1.5) + (getStreak(summerSessions, member.id) * 4);

      const seasonalCounts = [0, 0, 0, 0];
      weeklyHistory.forEach(s => {
        if (s.participantIds?.includes(member.id)) {
          const date = s.date?.toDate ? s.date.toDate() : new Date(s.date);
          seasonalCounts[getSeasonIndex(date)]++;
        }
      });

      const mean = seasonalCounts.reduce((a, b) => a + b, 0) / 4;
      const variance = seasonalCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 4;
      const totalAttendance = seasonalCounts.reduce((a, b) => a + b, 0);

      return {
        id: member.id,
        winterGrit,
        summerGrit,
        variance,
        totalAttendance
      };
    });

    // Rankings
    const penguinsRanked = [...memberStats].sort((a, b) => b.winterGrit - a.winterGrit);
    const jellyfishRanked = [...memberStats].sort((a, b) => b.summerGrit - a.summerGrit);
    const sharksRanked = [...memberStats]
      .filter(m => m.totalAttendance >= 4)
      .sort((a, b) => a.variance - b.variance || b.totalAttendance - a.totalAttendance);

    const getMemberRankInfo = (rankedList: any[], memberId: string) => {
      const index = rankedList.findIndex(m => m.id === memberId);
      const rank = index + 1;
      const total = rankedList.length;
      const isTop5 = rank > 0 && rank <= 5;
      const percentile = total > 0 ? Math.round((rank / total) * 100) : 100;
      return { rank, isTop5, percentile };
    };

    const penguinInfo = getMemberRankInfo(penguinsRanked, currentUser.id);
    const jellyfishInfo = getMemberRankInfo(jellyfishRanked, currentUser.id);
    const sharkInfo = getMemberRankInfo(sharksRanked, currentUser.id);

    const isApexPredator = (penguinInfo.isTop5 && jellyfishInfo.isTop5 && sharkInfo.isTop5) || showMockOrca;

    return {
      penguinInfo,
      jellyfishInfo,
      sharkInfo,
      isApexPredator
    };
  }, [members, weeklyHistory, currentUser, showMockOrca]);

  if (!stats) return null;

  const tribes = [
    { 
      id: 'penguin', 
      icon: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Animals/Penguin.png', 
      title: 'פינגווין - גולש חורף',
      grit: Math.max(0, 100 - stats.penguinInfo.percentile),
      rank: 'מומחה קור',
      isActive: showMockOrca ? true : stats.penguinInfo.isTop5
    },
    { 
      id: 'jellyfish', 
      icon: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Animals/Jellyfish.png', 
      title: 'מדוזה - גולש קיץ',
      grit: Math.max(0, 100 - stats.jellyfishInfo.percentile),
      rank: 'שורד חום',
      isActive: showMockOrca ? true : stats.jellyfishInfo.isTop5
    },
    { 
      id: 'shark', 
      icon: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Animals/Shark.png', 
      title: 'כריש - גולש שנתי',
      grit: Math.max(0, 100 - stats.sharkInfo.percentile),
      rank: 'מתמיד',
      isActive: showMockOrca ? true : stats.sharkInfo.isTop5
    },
  ];

  // For the mockup, we'll use the specific numbers from the screenshot if showMockOrca is true
  const displayTribes = showMockOrca ? [
    { ...tribes[0], grit: 92 },
    { ...tribes[1], grit: 88 },
    { ...tribes[2], grit: 95 },
  ] : tribes;

  const combinedGrit = Math.round((displayTribes[0].grit + displayTribes[1].grit + displayTribes[2].grit) / 3);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-3xl shadow-xl shadow-black/5 border border-white/40 bg-white/60 backdrop-blur-md"
    >
      {/* Background Wrapper to contain the radar pulse without clipping tooltips */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        {/* Radar Pulse Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20">
          <div className="absolute inset-0 rounded-full border border-black/5" />
          <div className="absolute inset-8 rounded-full border border-black/5" />
          <div className="absolute inset-16 rounded-full border border-black/5" />
          <div className="absolute inset-24 rounded-full border border-black/5" />
          <div className="absolute inset-32 rounded-full border border-black/5" />
          <div className="absolute inset-40 rounded-full border border-black/5" />
          <div className="absolute top-1/4 right-1/4 text-black/20 font-mono text-sm tracking-widest rotate-45">Radar Pulse</div>
        </div>
      </div>

      <div className="relative z-10 p-4 sm:p-8 md:p-12 flex flex-col items-center">
        <div className="flex items-center justify-center gap-3 mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-black tracking-tight drop-shadow-sm text-center">
            האבולוציה הימית שלך
          </h2>
          <div 
            className="relative flex items-center justify-center"
            onMouseEnter={() => {
              if (window.matchMedia('(hover: hover)').matches) {
                setShowTooltip(true);
              }
            }}
            onMouseLeave={() => {
              if (window.matchMedia('(hover: hover)').matches) {
                setShowTooltip(false);
              }
            }}
          >
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowTooltip(!showTooltip);
              }}
              className="p-2 -m-2 focus:outline-none"
              aria-label="מידע על סמלים"
            >
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-black/30 hover:text-black/60 transition-colors" />
            </button>
            
            {/* Tooltip */}
            <div 
              className={`absolute bottom-[100%] left-1/2 -translate-x-1/2 pb-4 z-50 transition-all duration-300 ${showTooltip ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}
            >
              <div className="w-72 p-5 bg-black/95 backdrop-blur-xl text-white text-sm rounded-2xl shadow-2xl text-right border border-white/10 relative">
                <div className="flex justify-between items-center mb-3">
                  <button 
                    className="sm:hidden p-2 -m-2 text-white/50 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTooltip(false);
                    }}
                  >
                    ✕
                  </button>
                  <p className="font-black text-base text-white">איך משיגים את הסמלים?</p>
                </div>
                <ul className="space-y-2.5 text-white/80 text-sm">
                  <li className="flex items-center gap-2 justify-end"><span className="text-right"><strong className="text-white">פינגווין:</strong> גלישה במים קרים</span> <span className="text-lg">🐧</span></li>
                  <li className="flex items-center gap-2 justify-end"><span className="text-right"><strong className="text-white">מדוזה:</strong> גלישה במים חמים</span> <span className="text-lg">🪼</span></li>
                  <li className="flex items-center gap-2 justify-end"><span className="text-right"><strong className="text-white">כריש:</strong> התמדה לאורך השנה</span> <span className="text-lg">🦈</span></li>
                </ul>
                <p className="mt-3.5 pt-3.5 border-t border-white/10 text-xs text-white/60 leading-relaxed text-right">
                  * הסמל נדלק רק אם אתה בטופ 5 של הקבוצה. תשיג את כולם כדי להפוך לטורף על!
                </p>
                
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/95" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-end justify-between gap-2 sm:gap-4 md:gap-8 w-full overflow-x-auto pb-4">
          {displayTribes.map((tribe) => (
            <div key={tribe.id} className={`flex flex-col items-center gap-2 sm:gap-4 flex-1 min-w-[70px] transition-all duration-500 ${tribe.isActive ? '' : 'grayscale opacity-40'}`}>
              <motion.img 
                src={tribe.icon}
                alt={tribe.title}
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]"
                whileHover={tribe.isActive ? { scale: 1.05, y: -5 } : {}}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (tribe.id === 'penguin') target.src = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Penguin/3D/penguin_3d.png';
                  else if (tribe.id === 'jellyfish') target.src = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Jellyfish/3D/jellyfish_3d.png';
                  else if (tribe.id === 'shark') target.src = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Shark/3D/shark_3d.png';
                  else target.style.display = 'none';
                }}
              />
              <div className="text-center">
                <h3 className="text-[10px] sm:text-xs md:text-lg font-black text-black mb-1 leading-tight">{tribe.title}</h3>
                <p className="text-[9px] sm:text-[10px] md:text-sm text-black/80 font-medium">Grit {tribe.grit}%</p>
                <p className="text-[9px] sm:text-[10px] md:text-sm text-black/80 font-medium">דרגה: {tribe.rank}</p>
              </div>
            </div>
          ))}

          {/* Orca Section */}
          <div className={`flex flex-col items-center gap-2 sm:gap-4 flex-1 min-w-[70px] transition-all duration-500 ${stats.isApexPredator || showMockOrca ? '' : 'grayscale opacity-40'}`}>
            <OrcaIllustration isActive={stats.isApexPredator || showMockOrca} />
            <div className="text-center">
              <p className="text-[8px] sm:text-[9px] md:text-xs font-bold text-black/70 mb-0.5">MEMBER STATUS:</p>
              <h3 className="text-[10px] sm:text-xs md:text-lg font-black text-black mb-1 leading-none">אורקה - גולש על</h3>
              <p className="text-[9px] sm:text-[10px] md:text-sm text-black/80 font-medium leading-tight">אבולוציה סופית: טורף על</p>
              <p className="text-[9px] sm:text-[10px] md:text-sm text-black/80 font-medium">Grit משולב: {showMockOrca ? 91 : combinedGrit}%</p>
            </div>
          </div>
        </div>

        {/* Hidden toggle for testing */}
        <button 
          onClick={() => setShowMockOrca(!showMockOrca)}
          className="absolute top-4 left-4 opacity-0 hover:opacity-100 px-2 py-1 bg-black/10 rounded text-xs"
        >
          Toggle Mock Data
        </button>
      </div>
    </motion.div>
  );
};

export default TribeStatus;
