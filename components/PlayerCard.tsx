import React, { useMemo, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Flame, Trophy, Calendar, Crown, Star, Waves } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { calculateUserStats } from '../src/utils/analytics';

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

  const member = useMemo(() => {
    return members.find(m => m.id === userId);
  }, [userId, members]);

  const stats = useMemo(() => {
    if (!userId || members.length === 0 || isLoading) return null;
    return calculateUserStats(userId, members, weeklyHistory, yearConfig);
  }, [userId, members, weeklyHistory, yearConfig, isLoading]);

  const agePercentile = useMemo(() => {
    if (!member?.birthday || members.length === 0) return null;

    const calculateAge = (birthday: string) => {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const userAge = calculateAge(member.birthday);
    const allAges = members
      .map(m => m.birthday ? calculateAge(m.birthday) : null)
      .filter((age): age is number => age !== null)
      .sort((a, b) => a - b);

    if (allAges.length === 0) return null;

    const index = allAges.indexOf(userAge);
    const percentile = (index / (allAges.length - 1)) * 100;
    const roundedPercentile = Math.round(percentile);

    let label = `גולש מנוסה: אתה בוגר ומנוסה יותר מ-${roundedPercentile}% מהקהילה`;
    let badge = null;

    if (percentile <= 10) {
      badge = 'Grommet';
      label = 'Grommet: מהצעירים והמבטיחים ביותר בקהילה!';
    } else if (percentile >= 90) {
      badge = 'Legend/Senior';
      label = 'Legend/Senior: מעמודי התווך המנוסים ביותר שלנו!';
    } else if (percentile > 50) {
      label = `גולש מנוסה: אתה בוגר ומנוסה יותר מ-${roundedPercentile}% מהקהילה`;
    } else {
      label = `גולש צעיר: יש לך עוד המון גלים לכבוש, אתה צעיר יותר מ-${100 - roundedPercentile}% מהקהילה`;
    }

    return { percentile, label, badge };
  }, [member, members]);

  if (isLoading) return <div className="p-4 bg-white rounded-2xl border border-slate-100 animate-pulse">טוען...</div>;
  if (!member || !stats) return null;

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden" dir="rtl">
      {/* Background Accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#006994]/5 rounded-full blur-3xl -z-10" />
      
      <div className="relative">
        <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-50 rotate-3">
          {member.avatar ? (
            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Star size={48} />
            </div>
          )}
        </div>
        {stats.isTop10 && (
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce">
            <Crown size={20} />
          </div>
        )}
      </div>

      <div className="flex-1 text-center md:text-right">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {member.firstName} {member.lastName}
          </h2>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              {stats.rank}
            </span>
            {agePercentile?.badge && (
              <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {agePercentile.badge}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400 font-bold text-sm">
          <span className="flex items-center gap-1"><Calendar size={14} /> הצטרף ב-{stats.joiningDate}</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full" />
          <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] uppercase tracking-widest">
            {member.role === 'Admin' ? 'מנהל' : 'חבר'}
          </span>
        </div>

        {/* Age Percentile Indicator */}
        {agePercentile && (
          <div className="mt-4 max-w-xs mx-auto md:mx-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">אחוזון גיל</span>
              <span className="text-[9px] font-black text-[#006994]">{Math.round(agePercentile.percentile)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${agePercentile.percentile}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#006994] to-[#40E0D0]"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-1">{agePercentile.label}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1 justify-center md:justify-start">
              <Waves size={10} className="text-[#006994]" /> סשנים
            </span>
            <span className="text-2xl font-black text-[#006994] tabular-nums">
              <Counter value={stats.totalSessions} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1 justify-center md:justify-start">
              <Flame size={10} className="text-orange-500" /> רצף
            </span>
            <span className="text-2xl font-black text-orange-500 tabular-nums">
              <Counter value={stats.streak} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1 justify-center md:justify-start">
              <Trophy size={10} className="text-amber-500" /> Grit
            </span>
            <span className="text-2xl font-black text-amber-500 tabular-nums">
              <Counter value={Math.round(stats.gritScore)} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
