import React, { useMemo, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Flame, Trophy, Calendar, Crown, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { calculateUserStats } from '../utils/analytics';

interface PlayerCardProps {
  userId: string;
}

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

const PlayerCard: React.FC<PlayerCardProps> = ({ userId }) => {
  const { members, weeklyHistory, yearConfig, isLoading } = useData();

  const data = useMemo(() => {
    if (isLoading) return null;
    return calculateUserStats(userId, members, weeklyHistory, yearConfig);
  }, [userId, members, weeklyHistory, yearConfig, isLoading]);

  if (isLoading) return (
    <div className="player-card animate-pulse bg-white/5 border-white/10">
      <div className="w-[120px] h-[120px] rounded-full bg-white/10" />
      <div className="flex-1 space-y-4">
        <div className="h-8 w-48 bg-white/10 rounded-lg" />
        <div className="h-4 w-32 bg-white/10 rounded-lg" />
      </div>
    </div>
  );

  if (!data) return null;

  const isElite = data.streak >= 4;
  const hasGoldBorder = data.streak >= 3;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="player-card relative overflow-hidden group"
      dir="rtl"
    >
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#006994]/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#40E0D0]/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Left Section: Profile Picture */}
      <div className="relative flex-shrink-0">
        <div className={`profile-glow ${hasGoldBorder ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-transparent shadow-[0_0_20px_rgba(251,191,36,0.5)]' : ''}`}>
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/20 bg-slate-800">
            {data.avatar ? (
              <img src={data.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <Star size={48} />
              </div>
            )}
          </div>
        </div>
        {data.isTop10 && (
          <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 p-1.5 rounded-full shadow-lg border-2 border-white">
            <Crown size={16} />
          </div>
        )}
      </div>

      {/* Middle Section: User Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-3xl font-black tracking-tighter text-white">
            {data.firstName || 'גולש'} {data.lastName || 'חבל זוג'}
          </h2>
          {data.isTop10 && <Crown size={24} className="text-amber-400 animate-bounce" />}
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm font-bold">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>הצטרף ב-{data.joiningDate}</span>
          </div>
          <div className="px-3 py-0.5 bg-white/10 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-[#40E0D0]">
            {data.ageGroup}
          </div>
          {isElite && (
            <div className="px-3 py-0.5 bg-amber-400/20 text-amber-400 rounded-full border border-amber-400/20 text-[10px] font-black uppercase tracking-widest">
              Elite Member
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Key Power Stats */}
      <div className="flex flex-col gap-4 min-w-[140px]">
        <div className="stat-badge group-hover:scale-105 transition-transform">
          <div className="flex items-center justify-center gap-2 text-orange-400 mb-1">
            <Flame size={16} fill="currentColor" />
            <span className="stat-label text-white">Grit Score</span>
          </div>
          <span className="stat-value text-white">
            <Counter value={data.gritScore} />
          </span>
        </div>

        <div className="stat-badge !bg-white/10 !border !border-white/10 group-hover:scale-105 transition-transform delay-75">
          <span className="stat-label">סך הכל סשנים</span>
          <span className="stat-value">
            <Counter value={data.totalSessions} />
          </span>
        </div>

        <div className="stat-badge !bg-white/10 !border !border-white/10 group-hover:scale-105 transition-transform delay-150">
          <span className="stat-label">אחוז נוכחות</span>
          <span className="stat-value">
            <Counter value={data.attendancePercent} />%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;
