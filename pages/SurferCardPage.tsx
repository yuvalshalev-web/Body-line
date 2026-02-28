import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import PlayerCard from '../components/PlayerCard';
import UserAnalytics from '../components/UserAnalytics';
import { Trophy, Waves, Target, Crown, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { calculateUserStats } from '../src/utils/analytics';

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
      <div className="mb-[var(--spacing-lg)] text-center md:text-right">
        <div className="inline-flex items-center gap-[var(--spacing-xs)] px-4 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full mb-[var(--spacing-xs)] shadow-sm">
          <Trophy size={14} />
          כרטיס הגולש המקצועי שלי
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
          כרטיס הגולש שלי
        </h1>
        <p className="text-slate-400 font-bold mt-3 text-lg">
          הפרופיל המקצועי שלך בנבחרת חבל זוג
        </p>
      </div>

      {/* The Professional Player Card */}
      <div className="mb-8">
        <PlayerCard userId={currentUser?.id || 'guest'} />
      </div>

      {/* Motivation Card & Rank Roadmap */}
      <div className="mb-10">
        {(() => {
          const rankColors: Record<string, { bg: string, glow: string, trophy: string }> = {
            'Grommet': { bg: 'from-[var(--ocean-bg)] to-[var(--ocean-pipe-empty)]', glow: 'var(--glow-soft)', trophy: '#E5E7EB' },
            'Rookie': { bg: 'from-[var(--ocean-bg)] to-[var(--ocean-pipe-empty)]', glow: 'var(--glow-soft)', trophy: '#E5E7EB' },
            'Local': { bg: 'from-[#06402b] to-[#065f46]', glow: 'rgba(6, 95, 70, 0.5)', trophy: '#E5E7EB' },
            'Pro': { bg: 'from-[#1e1b4b] to-[#312e81]', glow: 'rgba(67, 56, 202, 0.6)', trophy: '#E5E7EB' },
            'Legend': { bg: 'from-[#92400e] via-[#b45309] to-[#92400e]', glow: 'rgba(251, 191, 36, 0.8)', trophy: '#FFD700' }
          };

          const currentRank = userData?.rank || 'Grommet';
          const theme = rankColors[currentRank] || rankColors['Grommet'];
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
              animate={{ background: `linear-gradient(135deg, ${theme.bg.split(' ')[1].replace('from-[', '').replace(']', '')}, ${theme.bg.split(' ')[theme.bg.split(' ').length-1].replace('to-[', '').replace(']', '')})` }}
              className={`p-[var(--spacing-md)] md:p-[var(--spacing-lg)] rounded-[var(--radius-lg)] text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-1000 overflow-hidden relative border border-white/10`}
            >
              {/* Neumorphic Inner Shadow Overlay */}
              <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(255,255,255,0.1)] pointer-events-none rounded-[var(--radius-lg)]" />
              
              {/* Dark Overlay for depth */}
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              
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
                        backgroundColor: currentRank === 'Legend' ? 'rgba(255, 215, 0, 0.6)' : 
                                       currentRank === 'Pro' ? 'rgba(106, 90, 205, 0.4)' : 
                                       'rgba(255, 255, 255, 0.2)'
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute inset-0 rounded-full blur-3xl"
                    />
                    
                    {/* Trophy Container */}
                    <div className="w-28 h-28 bg-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-2xl shrink-0 shadow-[20px_20px_40px_rgba(0,0,0,0.4),inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/20 relative z-10 overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" />
                      
                      {/* The Trophy Icon */}
                      <Trophy 
                        size={72} 
                        className={`transition-all duration-1000 ${
                          currentRank === 'Legend' 
                            ? 'text-[#FFD700] drop-shadow-[0_0_30px_rgba(255,215,0,1)]' 
                            : 'text-slate-200 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]'
                        }`}
                        strokeWidth={1.2}
                      />

                      {/* Shine effect - always active for Legend, hover for others */}
                      <div className={`absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 ${
                        currentRank === 'Legend' ? 'animate-[shine_3s_infinite_ease-in-out]' : 'group-hover:animate-[shine_1.5s_ease-in-out]'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-right">
                    <div className="inline-flex items-center gap-2 px-5 py-1.5 bg-black/30 backdrop-blur-md rounded-full mb-5 border border-white/10 shadow-lg">
                      <div className={`w-2 h-2 rounded-full animate-ping ${currentRank === 'Legend' ? 'bg-yellow-400' : 'bg-white'}`} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">אתה נמצא בדרגת {currentRank}</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black mb-5 leading-none tracking-tighter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                      הדרך למקצוענות <br className="hidden md:block" /> מתחילה בהתמדה
                    </h3>
                    <p className="font-bold text-white/80 text-xl md:text-2xl leading-relaxed max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      התמדה היא המפתח לשיפור בים. ככל שתגיע ליותר סשנים, כך תעלה בדירוג הקהילה ותפתח יכולות חדשות.
                    </p>
                  </div>
                </div>

                {/* Final 3-Layer Roadmap - Professional Glassmorphism */}
                <div className="mt-10 mb-10 px-4 max-w-4xl mx-auto">
                  {/* Progress System Wrapper - Shared Coordinate System */}
                  <div 
                    className="relative w-full h-8 bg-[var(--ocean-glass)] backdrop-blur-[var(--glass-blur)] rounded-[var(--radius-md)] border border-white/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.3)]"
                    style={{ 
                      '--progress-percent': progressPercent,
                      '--current-progress': `calc(24px + (var(--progress-percent) / 100) * (100% - 48px))`
                    } as React.CSSProperties}
                  >
                    
                    {/* Layer 3: 'CURRENT STATUS' Marker (Above the bar, but child of the bar to share coordinates) */}
                    <div className="absolute -top-10 inset-x-0 h-10 pointer-events-none">
                      <motion.div 
                        key="current-marker"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute flex flex-col items-center"
                        style={{ left: 'var(--current-progress)', transform: 'translateX(-50%)' }}
                      >
                        <span className="text-[9px] font-black text-[var(--ocean-bg)] uppercase tracking-[0.25em] mb-0.5 drop-shadow-md">
                          CURRENT STATUS
                        </span>
                        {/* The indicator arrow - physically attached to the bar with negative margin */}
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[var(--ocean-milestone)] -mt-[1px]" />
                      </motion.div>
                    </div>

                    {/* Clipping Layer for Liquid (Layer 2) */}
                    <div className="absolute inset-0 overflow-hidden rounded-[var(--radius-md)]">
                      {/* Progress Liquid */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: 'var(--current-progress)' 
                        }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--ocean-bg)] via-[var(--ocean-pipe-empty)] to-[var(--ocean-liquid)] shadow-[var(--glow-soft)]"
                      >
                        {/* Internal Shine */}
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-white/30 blur-[0.5px]" />
                      </motion.div>
                    </div>

                    {/* Milestone Nodes (Layer 1 - Inside the tube) */}
                    <div className="absolute inset-0 flex items-center px-6">
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
                              <div className={`w-5 h-5 rounded-full transition-all duration-1000 border-2 relative z-20 ${
                                isCurrent 
                                  ? 'bg-[var(--ocean-liquid)] border-[var(--ocean-milestone)] shadow-[var(--glow-intense)]' 
                                  : (isPassed ? 'bg-[var(--ocean-liquid)] border-[var(--ocean-liquid)] shadow-[var(--glow-soft)]' : 'bg-white/5 border-white/20')
                              }`}>
                                {/* White Glowing Ring for Active Rank */}
                                {isCurrent && (
                                  <div className="absolute inset-[-6px] border-2 border-white/50 rounded-full animate-pulse blur-[1px]" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Offline Overlay (Blur + No Signal) */}
                    {dbStatus === 'OFFLINE' && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-[var(--radius-md)]">
                        <div className="flex items-center gap-2 text-white/70">
                          <WifiOff size={14} className="animate-pulse" />
                          <span className="text-[8px] font-black uppercase tracking-widest">No Signal</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Labels (Layer 1 - Below the bar) */}
                  <div className="relative w-full h-8 mt-2 px-6">
                    <div className="relative w-full h-full">
                      {userData?.rankThresholds.map((rank, idx) => {
                        const isCurrent = rank.name === currentRank;
                        const totalRanks = userData?.rankThresholds.length || 1;
                        const percent = (idx / (totalRanks - 1)) * 100;
                        
                        return (
                          <div 
                            key={rank.name} 
                            className="absolute flex flex-col items-center"
                            style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                          >
                            <span className={`whitespace-nowrap text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 ${
                              isCurrent ? 'text-[var(--ocean-text-main)] opacity-100' : 'text-[var(--ocean-text-dim)] opacity-60'
                            }`}>
                              {rank.name}
                            </span>
                            {rank.name === 'Legend' && (
                              <Trophy size={12} className={`mt-2 ${isCurrent ? 'text-amber-400' : 'text-white/20'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Clean Bottom Message */}
                <div className="text-center mt-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-block px-10 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <p className="text-lg font-bold text-slate-900">
                      דרגה נוכחית: <span className="text-slate-900 font-black">{currentRank}</span> 
                      <span className="text-[var(--ocean-liquid)] text-sm mx-2 font-black drop-shadow-sm">({userData?.totalSessions} סשנים)</span>. 
                      {userData?.nextRankName ? (
                        <> נותרו רק <span className="text-[var(--ocean-liquid)] font-black">{userData.sessionsToNextRank}</span> סשנים עד לדרגת <span className="text-slate-500 italic">{userData.nextRankName}</span>!</>
                      ) : (
                        <> הגעת לדרגה המקסימלית! אתה אגדה חיה בים. </>
                      )}
                    </p>
                  </motion.div>
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
