import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import PlayerCard from '../components/PlayerCard';
import UserAnalytics from '../components/UserAnalytics';
import { Trophy, Waves, Target, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { calculateUserStats } from '../src/utils/analytics';

const SurferCardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { members, weeklyHistory, yearConfig, isLoading } = useData();

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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 font-['Assistant']" dir="rtl">
      <div className="mb-12 text-center md:text-right">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full mb-4 shadow-sm">
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
      <div className="mb-12">
        <PlayerCard userId={currentUser?.id || 'guest'} />
      </div>

      {/* Motivation Card & Rank Roadmap */}
      <div className="mb-16">
        {(() => {
          const rankColors: Record<string, { bg: string, glow: string, trophy: string }> = {
            'Grommet': { bg: 'from-[#002b3d] to-[#004d66]', glow: 'rgba(0, 105, 148, 0.3)', trophy: '#E5E7EB' },
            'Rookie': { bg: 'from-[#002b3d] to-[#004d66]', glow: 'rgba(0, 105, 148, 0.4)', trophy: '#E5E7EB' },
            'Local': { bg: 'from-[#06402b] to-[#065f46]', glow: 'rgba(6, 95, 70, 0.5)', trophy: '#E5E7EB' },
            'Pro': { bg: 'from-[#1e1b4b] to-[#312e81]', glow: 'rgba(67, 56, 202, 0.6)', trophy: '#E5E7EB' },
            'Legend': { bg: 'from-[#92400e] via-[#b45309] to-[#92400e]', glow: 'rgba(251, 191, 36, 0.8)', trophy: '#FFD700' }
          };

          const currentRank = userData?.rank || 'Grommet';
          const theme = rankColors[currentRank] || rankColors['Grommet'];
          const rankIndex = userData?.rankThresholds.findIndex(r => r.name === currentRank) ?? 0;
          const progressPercent = (rankIndex / (userData?.rankThresholds.length! - 1)) * 100;

          return (
            <motion.div 
              animate={{ background: `linear-gradient(135deg, ${theme.bg.split(' ')[1].replace('from-[', '').replace(']', '')}, ${theme.bg.split(' ')[theme.bg.split(' ').length-1].replace('to-[', '').replace(']', '')})` }}
              className={`p-8 md:p-12 rounded-[4rem] text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-1000 overflow-hidden relative border border-white/10`}
            >
              {/* Neumorphic Inner Shadow Overlay */}
              <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(255,255,255,0.1)] pointer-events-none rounded-[4rem]" />
              
              {/* Dark Overlay for depth */}
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              
              {/* Decorative background elements */}
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-black/30 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-10 mb-14">
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

                {/* Clean & Professional Journey Roadmap */}
                <div className="mt-32 mb-24 px-4">
                  <div className="relative h-10 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] overflow-visible group/journey">
                    
                    {/* Start & Goal Labels - Explicitly aligned to the bar direction */}
                    <div className="absolute -top-12 left-0 text-[10px] font-black text-white/80 tracking-widest uppercase drop-shadow-md">Start: Grommet</div>
                    <div className="absolute -top-12 right-0 text-[10px] font-black text-amber-300 tracking-widest uppercase drop-shadow-md">Goal: Legend</div>

                    {/* Glowing Turquoise Liquid Fill - Growing from Left to Right */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 2, ease: "circOut" }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#004d4d] to-[#40E0D0] shadow-[0_0_20px_rgba(64,224,208,0.3)] rounded-full"
                    >
                      {/* Liquid Shine */}
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-white/30 blur-[0.5px] rounded-full" />
                    </motion.div>

                    {/* Milestone Nodes - Using flex-row-reverse in RTL container to put first item on the left */}
                    <div className="absolute inset-0 flex flex-row-reverse justify-between items-center px-1">
                      {userData?.rankThresholds.map((rank, idx) => {
                        const isCurrent = rank.name === currentRank;
                        const isPassed = rankIndex > idx;
                        const isLegend = rank.name === 'Legend';
                        
                        return (
                          <div key={rank.name} className="relative flex items-center justify-center w-10 h-10">
                            {/* The Node (Circle) */}
                            <div className={`w-4 h-4 rounded-full transition-all duration-1000 relative z-30 border-2 ${
                              isCurrent ? 'bg-white border-white scale-125' : 
                              isPassed ? 'bg-[#40E0D0] border-[#40E0D0]/50' : 
                              isLegend ? 'bg-amber-400/20 border-amber-400/40' :
                              'bg-white/10 border-white/10'
                            }`}>
                              {/* Current Rank: Strengthened Turquoise Circular Glow */}
                              {isCurrent && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="absolute inset-0 bg-[#40E0D0]/60 rounded-full blur-[6px] scale-[3] animate-pulse -z-10" />
                                  <div className="absolute inset-0 bg-[#40E0D0]/30 rounded-full blur-[12px] scale-[4.5] animate-pulse -z-20" />
                                  <div className="absolute inset-0 bg-[#40E0D0]/10 rounded-full blur-[20px] scale-[6] -z-30" />
                                </div>
                              )}

                              {/* Legend Goal: Golden Trophy Icon with confined circular glow */}
                              {isLegend && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {/* Confined circular glow */}
                                  <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-[2px] scale-150 -z-10" />
                                  <Trophy size={10} className={`${isPassed || isCurrent ? 'text-amber-500' : 'text-amber-500/30'}`} />
                                </div>
                              )}
                            </div>

                            {/* Subtle Rank Label */}
                            <span className={`absolute -bottom-8 whitespace-nowrap text-[10px] font-black tracking-wider transition-opacity duration-500 drop-shadow-lg ${
                              isCurrent ? 'text-white opacity-100' : 'text-white/60 opacity-70'
                            }`}>
                              {rank.name}
                            </span>

                            {/* Legend Spotlight Badge (Moved from Current Rank & Changed to Circle) */}
                            {isLegend && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -top-24 flex flex-col items-center z-40"
                              >
                                <div className="w-16 h-16 bg-[#40E0D0] text-black rounded-full shadow-[0_0_30px_rgba(64,224,208,0.6)] flex items-center justify-center flex-col border-4 border-white/20">
                                  <span className="text-[9px] font-black uppercase leading-none">Goal</span>
                                  <span className="text-[11px] font-black uppercase tracking-tighter">Legend</span>
                                </div>
                                {/* Down Arrow */}
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#40E0D0] mt-[-2px]" />
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Clean Bottom Message */}
                <div className="text-center mt-12">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-block px-10 py-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl"
                  >
                    <p className="text-lg font-bold text-white/90">
                      דרגה נוכחית: <span className="text-white font-black">{currentRank}</span> 
                      <span className="text-[#40E0D0] text-sm mx-2 font-black drop-shadow-sm">({userData?.totalSessions} סשנים)</span>. 
                      {userData?.nextRankName ? (
                        <> נותרו רק <span className="text-[#40E0D0] font-black">{userData.sessionsToNextRank}</span> סשנים עד לדרגת <span className="text-white/70 italic">{userData.nextRankName}</span>!</>
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
          <div className="w-10 h-10 bg-[#006994]/10 rounded-xl flex items-center justify-center text-[#006994]">
            <Waves size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ניתוח ביצועים מעמיק</h2>
        </div>
        <div className="mt-8">
          <UserAnalytics userId={currentUser?.id || 'guest'} />
        </div>
      </div>
    </div>
  );
};

export default SurferCardPage;
