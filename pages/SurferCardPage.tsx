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
                        backgroundColor: currentRank === 'קלי סלייטר' ? 'rgba(255, 215, 0, 0.6)' : 
                                       currentRank === 'כריש פטיש' ? 'rgba(106, 90, 205, 0.4)' : 
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
                          currentRank === 'קלי סלייטר' 
                            ? 'text-[#FFD700] drop-shadow-[0_0_30px_rgba(255,215,0,1)]' 
                            : 'text-slate-200 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]'
                        }`}
                        strokeWidth={1.2}
                      />

                      {/* Shine effect - always active for Legend, hover for others */}
                      <div className={`absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 ${
                        currentRank === 'קלי סלייטר' ? 'animate-[shine_3s_infinite_ease-in-out]' : 'group-hover:animate-[shine_1.5s_ease-in-out]'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-right">
                    <div className="inline-flex items-center gap-2 px-5 py-1.5 bg-black/30 backdrop-blur-md rounded-full mb-5 border border-white/10 shadow-lg">
                      <div className={`w-2 h-2 rounded-full animate-ping ${currentRank === 'קלי סלייטר' ? 'bg-yellow-400' : 'bg-[var(--gt-accent)]'}`} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                        אתה נמצא בדרגת <span className="text-[var(--gt-accent)]">{currentRank}</span>
                      </span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black mb-5 leading-none tracking-tighter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                      הדרך למקצוענות <br className="hidden md:block" /> מתחילה בהתמדה
                    </h3>
                    <p className="font-bold text-white/80 text-xl md:text-2xl leading-relaxed max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      התמדה היא המפתח לשיפור בים. ככל שתגיע ליותר סשנים, כך תעלה בדירוג הקהילה ותפתח יכולות חדשות.
                    </p>
                  </div>
                </div>

                {/* Rank Roadmap Progress Bar */}
                <div className="mt-10 mb-10 px-4 max-w-4xl mx-auto">
                  <div className="relative h-4 bg-white/10 rounded-full overflow-hidden shadow-inner border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="rank-progress-fill absolute inset-y-0 right-0 h-full"
                    />
                    
                    {/* Milestone Nodes */}
                    <div className="absolute inset-0 flex items-center justify-between px-6">
                      {userData?.rankThresholds.map((rank, idx) => {
                        const isCurrent = rank.name === currentRank;
                        const isPassed = rankIndex > idx;
                        return (
                          <div 
                            key={rank.name} 
                            className={`w-3 h-3 rounded-full transition-all duration-500 border-2 ${
                              isCurrent || isPassed
                                ? 'bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                                : 'bg-white/20 border-white/10'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="flex justify-between mt-3 px-2">
                    {userData?.rankThresholds.map((rank) => {
                      const isCurrent = rank.name === currentRank;
                      return (
                        <div key={rank.name} className="flex flex-col items-center">
                          <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-500 ${
                            isCurrent ? 'text-white' : 'text-white/40'
                          }`}>
                            {rank.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data Chips Section */}
                <div className="rank-stats-container">
                  <div className="rank-stat-chip">
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">דרגה נוכחית</span>
                    <span className="text-white font-black text-lg">{currentRank}</span>
                  </div>
                  
                  <div className="w-px h-10 bg-white/10" />
                  
                  <div className="rank-stat-chip">
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">
                      {userData?.nextRankName ? `סשנים לדרגת ${userData.nextRankName}` : 'הגעת לפסגה'}
                    </span>
                    <span className="text-[var(--gt-accent)] font-black text-2xl tabular-nums">
                      {userData?.nextRankName ? userData.sessionsToNextRank : 'MAX'}
                    </span>
                  </div>

                  <div className="w-px h-10 bg-white/10" />

                  <div className="rank-stat-chip">
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">סך הכל צברת</span>
                    <span className="text-white font-black text-lg tabular-nums">{userData?.totalSessions} סשנים</span>
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
