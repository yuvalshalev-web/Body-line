import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import PlayerCard from '../components/PlayerCard';
import UserAnalytics from '../components/UserAnalytics';
import { Trophy, Waves, Target, Crown, WifiOff, Flame, Info } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useState, useEffect } from 'react';
import { calculateUserStats } from '../src/utils/analytics';

const Counter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return rounded.onChange((v) => setDisplayValue(v));
  }, [value, duration]);

  return <>{displayValue}</>;
};

const SurferCardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { members, weeklyHistory, yearConfig, isLoading, dbStatus } = useData();

  const userData = useMemo(() => {
    if (!currentUser || isLoading) return null;
    return calculateUserStats(currentUser.id, members, weeklyHistory, yearConfig);
  }, [currentUser, members, weeklyHistory, yearConfig, isLoading]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#006994] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold">טוען נתונים...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-lg)] font-['Assistant']" dir="rtl">
      <div className="surfboard-hero-container mb-[var(--spacing-lg)] text-center md:text-right">
        <h1 className="main-page-title">
          הדשבורד שלי
        </h1>
      </div>

      {/* The Professional Player Card */}
      <div className="mb-8">
        <PlayerCard userId={currentUser?.id || 'guest'} />
      </div>

      {/* Motivation Card & Rank Roadmap */}
      <div className="mb-10">
        {(() => {
          const rankColors: Record<string, { bg: string, glow: string, trophy: string }> = {
            'פופ-אפיסט': { bg: 'from-[#021626] to-[#010d17]', glow: 'rgba(0, 242, 254, 0.2)', trophy: '#E5E7EB' },
            'תופס פינה': { bg: 'from-[#021626] to-[#010d17]', glow: 'rgba(0, 242, 254, 0.2)', trophy: '#E5E7EB' },
            'ליין-אפיסט': { bg: 'from-[#06402b] to-[#065f46]', glow: 'rgba(6, 95, 70, 0.5)', trophy: '#E5E7EB' },
            'כריש פטיש': { bg: 'from-[#1e1b4b] to-[#312e81]', glow: 'rgba(67, 56, 202, 0.6)', trophy: '#E5E7EB' },
            'קלי סלייטר': { bg: 'from-[#92400e] via-[#b45309] to-[#92400e]', glow: 'rgba(251, 191, 36, 0.8)', trophy: '#FFD700' }
          };

          const currentRank = userData?.rank || 'פופ-אפיסט';
          const theme = rankColors[currentRank] || rankColors['פופ-אפיסט'];
          const totalSessions = userData?.totalSessions || 0;
          const rankThresholds = userData?.rankThresholds || [];
          const rankIndex = rankThresholds.findIndex(r => r.name === currentRank) ?? 0;

          // Dynamic Segmented Progress Calculation (4 segments of 25% each)
          // Formula: Base % (Current Rank) + ((Current Sessions - Rank Min) / (Next Rank Min - Rank Min) * 25%)
          let progressPercent = 0;
          const totalRanks = rankThresholds.length;
          
          if (totalRanks > 1) {
            const segmentWidth = 100 / (totalRanks - 1); // 25% for 4 segments
            
            // Find current segment
            let segmentIndex = 0;
            for (let i = 0; i < totalRanks - 1; i++) {
              if (totalSessions >= rankThresholds[i].min && totalSessions < rankThresholds[i+1].min) {
                segmentIndex = i;
                break;
              }
              if (i === totalRanks - 2) segmentIndex = i;
            }
            
            const currentMin = rankThresholds[segmentIndex].min;
            const nextMin = rankThresholds[segmentIndex + 1].min;
            const segmentProgress = Math.min(1, Math.max(0, (totalSessions - currentMin) / (nextMin - currentMin)));
            
            progressPercent = (segmentIndex * segmentWidth) + (segmentProgress * segmentWidth);
            
            if (totalSessions >= rankThresholds[totalRanks - 1].min) {
              progressPercent = 100;
            }
          }

          return (
            <motion.div 
              className="p-[var(--spacing-md)] md:p-[var(--spacing-lg)] rounded-[var(--radius-lg)] bg-[#FDFBF7] text-[#2B2B2E] shadow-sm transition-all duration-1000 relative border border-slate-100"
            >
              {/* Neumorphic Inner Shadow Overlay */}
              <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(0,0,0,0.05)] pointer-events-none rounded-[var(--radius-lg)]" />
              
              {/* Subtle background elements */}
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-slate-200/20 rounded-full blur-[120px] pointer-events-none" />
              
              {/* Decorative background elements */}
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-black/30 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-10 mb-6">
                  <div className="relative">
                    {/* Dynamic Backend Glow */}
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.6, 1],
                        opacity: [0.5, 0.9, 0.5],
                        backgroundColor: currentRank === 'קלי סלייטר' ? 'rgba(255, 215, 0, 0.6)' : 
                                       currentRank === 'כריש פטיש' ? 'rgba(106, 90, 205, 0.4)' : 
                                       'rgba(255, 255, 255, 0.2)'
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute inset-0 rounded-full blur-3xl"
                    />
                    
                    {/* Trophy Container */}
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-2xl shrink-0 shadow-[10px_10px_20px_rgba(0,0,0,0.4),inset_0_0_10px_rgba(255,255,255,0.1)] border border-amber-400/50 relative z-10 overflow-hidden group transform perspective-1000 rotate-y-12">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-40" />
                      
                      {/* The Trophy Icon */}
                      <Trophy 
                        size={36} 
                        className={`transition-all duration-1000 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] ${
                          currentRank === 'קלי סלייטר' 
                            ? 'text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]' 
                            : 'text-slate-200'
                        }`}
                        strokeWidth={1.5}
                        color="#D4AF37"
                        style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }}
                      />

                      {/* Shine effect */}
                      <div className={`absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 ${
                        currentRank === 'קלי סלייטר' ? 'animate-[shine_3s_infinite_ease-in-out]' : 'group-hover:animate-[shine_1.5s_ease-in-out]'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-right">
                    <h3 className="text-2xl md:text-[38px] font-black mb-5 leading-none tracking-tighter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] text-[#2B2B2E]">
                      אנחנו לא מודדים הישגים. <br className="hidden md:block" /> אנחנו חוגגים נוכחות.
                    </h3>
                    <p className="font-bold text-[#333333] text-sm md:text-lg leading-relaxed max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      גולשים נבנים מהתמדה, והים מתגמל מתמידים.<br />
                      ככל שתגיע ליותר סשנים, תתקדם במסע שלך ותפתח עוד ועוד אפשרויות חדשות.
                    </p>
                  </div>
                </div>

                {/* Final 3-Layer Roadmap - Professional Glassmorphism */}
                <div className="mt-10 mb-10 px-8 max-w-4xl mx-auto">
                  {/* Parent Container - Wraps both Indicator and Progress Bar */}
                  <div className="relative w-full pt-10">
                    
                    {/* Progress Bar Container - Zero-Point Sync */}
                    <div className="progress-container w-full px-4 mt-12">
                      {/* Layer 3: 'מיקומך הנוכחי' Marker - Positioned above the bar */}
                      <motion.div 
                        key="current-marker"
                        initial={{ opacity: 0, left: 0 }}
                        animate={{ 
                          opacity: 1, 
                          left: `${progressPercent}%`
                        }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className="absolute top-[-50px] flex flex-col items-center pointer-events-none z-[60]"
                        style={{ transform: 'translateX(-50%)' }}
                      >
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200 shadow-sm mb-1">
                          <span className="text-[10px] font-black text-[#2B2B2E] uppercase tracking-widest whitespace-nowrap">
                            מיקומך הנוכחי
                          </span>
                        </div>
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-[var(--gt-accent)] drop-shadow-sm" />
                      </motion.div>

                      <div className="relative w-full h-full flex items-center">
                        {/* Progress Liquid - Same percentage as Marker */}
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${progressPercent}%` 
                          }}
                          transition={{ duration: 2, ease: "circOut" }}
                          className="h-[20px] rounded-full relative z-10 opacity-60 backdrop-blur-[4px] overflow-hidden"
                          style={{ 
                            background: 'linear-gradient(90deg, #00F2FE 0%, #4FACFE 50%, #00F2FE 100%)',
                            boxShadow: '0 0 25px rgba(79, 172, 254, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.4)'
                          }}
                        >
                          {/* Shimmer Effect Overlay */}
                          <motion.div 
                            animate={{ 
                              x: ['-100%', '200%']
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity, 
                              ease: "linear" 
                            }}
                            className="absolute inset-0 w-1/2 h-full skew-x-[-20deg]"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
                            }}
                          />

                          {/* Top Highlight (3D Glass Look) */}
                          <div className="absolute top-0 left-0 right-0 h-[30%] bg-white/20 blur-[1px]" />
                        </motion.div>
  
                        {/* Milestone Nodes (Layer 1 - Inside the tube) */}
                        <div className="absolute inset-0 flex items-center z-50">
                          <div className="relative w-full h-full flex items-center">
                            {userData?.rankThresholds.map((rank, idx) => {
                              const isCurrent = rank.name === currentRank;
                              const isPassed = rankIndex > idx;
                              const totalRanks = userData?.rankThresholds.length || 1;
                              const percent = (idx / (totalRanks - 1)) * 100;
                              
                              return (
                                <div 
                                  key={rank.name} 
                                  className="absolute top-1/2 -translate-y-1/2"
                                  style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                                >
                                  {/* Identical Circle Node */}
                                  <div className={`w-4 h-4 rounded-full transition-all duration-1000 border-2 relative ${
                                    isCurrent || isPassed
                                      ? 'bg-white border-white shadow-[0_0_15px_#fff]' 
                                      : 'bg-slate-800/50 border-white/30'
                                  }`}>
                                    {isCurrent && (
                                      <div className="absolute inset-[-6px] border-2 border-white/60 rounded-full animate-pulse blur-[1px]" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Offline Overlay (Blur + No Signal) */}
                      {dbStatus === 'OFFLINE' && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-full">
                          <div className="flex items-center gap-2 text-white/70">
                            <WifiOff size={14} className="animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-widest">No Signal</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Labels (Layer 1 - Below the bar) */}
                  <div className="relative w-full h-20 mt-2 px-4">
                    <div className="relative w-full h-full">
                      {userData?.rankThresholds.map((rank, idx) => {
                        const isCurrent = rank.name === currentRank;
                        const totalRanks = userData?.rankThresholds.length || 1;
                        const percent = (idx / (totalRanks - 1)) * 100;
                        const trophyCount = idx + 1;
                        
                        return (
                          <div 
                            key={rank.name} 
                            className="absolute flex flex-col items-center"
                            style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                          >
                            <span className={`whitespace-nowrap text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 mb-1 ${
                              isCurrent ? 'text-[var(--gt-accent)] opacity-100 scale-110' : 'text-[#2B2B2E] opacity-60'
                            }`}>
                              {rank.name}
                            </span>
                            
                            {/* Trophy Stack */}
                            <div className="flex flex-row items-center gap-0.5 mt-1">
                              {Array.from({ length: trophyCount }).map((_, i) => (
                                <Trophy 
                                  key={i}
                                  size={10} 
                                  className="text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]"
                                  fill="#D4AF37"
                                  strokeWidth={1}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Stats Grid - Moved from PlayerCard */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-[var(--spacing-md)] border-t border-slate-100 pt-8">
                  <div className="flex flex-col group relative items-center">
                    <span className="text-[13px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-[var(--spacing-xs)] cursor-help">
                      <Crown size={13} className="text-amber-500" /> מעמד
                      <Info size={12} className="text-slate-400" />
                      <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50">
                        הדרגה הנוכחית שלך בנבחרת.
                      </div>
                    </span>
                    <span className="text-xl md:text-2xl font-black text-amber-600 truncate max-w-full px-2">
                      {currentRank}
                    </span>
                  </div>

                  <div className="flex flex-col group relative items-center">
                    <span className="text-[13px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-[var(--spacing-xs)] cursor-help">
                      <Waves size={13} className="text-[var(--ocean-4)]" /> סשנים
                      <Info size={12} className="text-slate-400" />
                      <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50">
                        מספר הסשנים הכולל שהשתתפת בהם עד כה.
                      </div>
                    </span>
                    <span className="text-3xl font-black text-[var(--ocean-2)] tabular-nums">
                      <Counter value={userData?.totalSessions || 0} />
                    </span>
                  </div>

                  <div className="flex flex-col group relative items-center">
                    <span className="text-[13px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-[var(--spacing-xs)] cursor-help">
                      <Target size={13} className="text-emerald-500" /> {userData?.nextRankName ? `סשנים ל${userData.nextRankName}` : 'הגעת לפסגה'}
                      <Info size={12} className="text-slate-400" />
                      <div className="absolute bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50">
                        {userData?.nextRankName ? `מספר הסשנים שנותרו עד למעמד ${userData.nextRankName}` : 'כל הכבוד! הגעת למעמד הגבוה ביותר.'}
                      </div>
                    </span>
                    <span className="text-3xl font-black text-emerald-600 tabular-nums">
                      {userData?.nextRankName ? <Counter value={userData.sessionsToNextRank} /> : 'MAX'}
                    </span>
                  </div>

                  <div className="flex flex-col group relative items-center">
                    <span className="text-[13px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1 cursor-help">
                      <Flame size={13} className="text-[var(--ocean-1)]" /> רצף
                      <Info size={12} className="text-slate-400" />
                      <div className="absolute bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50">
                        מספר השבועות הרצופים בהם הגעת לסשן.
                      </div>
                    </span>
                    <span className="text-3xl font-black text-[var(--ocean-1)] tabular-nums">
                      <Counter value={userData?.streak || 0} />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </div>

      {/* Detailed Analytics below */}
      <div className="mt-16 border-t border-slate-100 pt-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[var(--ocean-bg)]/10 rounded-xl flex items-center justify-center text-[var(--ocean-bg)]">
            <Waves size={20} />
          </div>
          <h2 className="text-2xl font-black text-[var(--ocean-bg)] tracking-tight">ניתוח ביצועים מעמיק</h2>
        </div>
        <div className="mt-8">
          <UserAnalytics userId={currentUser?.id || 'guest'} />
        </div>
      </div>
    </div>
  );
};

export default SurferCardPage;
