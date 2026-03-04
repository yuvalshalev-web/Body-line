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
      .sort((a, b) => a - b); // Sorted youngest to oldest

    if (allAges.length === 0) return null;

    // Find index of user's age. 
    // If index is 0, they are the youngest (0th percentile).
    // If index is length-1, they are the oldest (100th percentile).
    const index = allAges.indexOf(userAge);
    const percentile = (index / (allAges.length - 1)) * 100;
    const roundedPercentile = Math.round(percentile);

    let label = `גולש מנוסה: אתה בוגר ומנוסה יותר מ-${roundedPercentile}% מהקהילה`;
    let badge = null;

    if (percentile <= 10) {
      badge = 'פופ-אפיסט';
      label = 'פופ-אפיסט: מהצעירים והמבטיחים ביותר בקהילה!';
    } else if (percentile >= 90) {
      badge = 'קלי סלייטר';
      label = 'קלי סלייטר: מעמודי התווך המנוסים ביותר שלנו!';
    } else if (percentile > 50) {
      label = `גולש מנוסה: אתה בוגר ומנוסה יותר מ-${roundedPercentile}% מהקהילה`;
    } else {
      label = `גולש צעיר: יש לך עוד המון גלים לכבוש, אתה צעיר יותר מ-${100 - roundedPercentile}% מהקהילה`;
    }

    return { percentile, roundedPercentile, label, badge };
  }, [member, members]);

  if (isLoading) return <div className="p-4 bg-white rounded-2xl border border-slate-100 animate-pulse">טוען...</div>;
  if (!member || !stats) return null;

  return (
    <div className="bg-[#FDFBF7] p-[var(--spacing-md)] rounded-[var(--radius-lg)] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-[var(--spacing-lg)] relative overflow-hidden" dir="rtl">
      {/* Background Accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--ocean-liquid)]/5 rounded-full blur-3xl -z-10" />
      
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
        <div className="flex flex-col gap-2 mb-3">
          <h2 className="text-3xl font-black text-[#2B2B2E] tracking-tight">
            {member.firstName} {member.lastName}
          </h2>
          <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400 font-bold text-sm mb-1">
            <span className="flex items-center gap-1"><Calendar size={14} /> הצטרף ב-{stats.joiningDate}</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              מעמד: {stats.rank}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
              member.isActive !== false 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              סטטוס: {member.isActive !== false ? 'פעיל' : 'לא פעיל'}
            </span>
            <span className="inline-flex px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">
              תפקיד: {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
            </span>
          </div>
        </div>

        {/* Age Percentile Indicator */}
        {agePercentile && (
          <div className="mt-2 max-w-xs mx-auto md:mx-0 flex flex-col items-center md:items-start" dir="ltr">
            {/* New Age Gimmick Container */}
            <div 
              className="age-gimmick-card w-full max-w-[310px] mx-auto md:mx-0" 
              dir="rtl"
              onClick={(e) => {
                const dot = e.currentTarget.querySelector('.user-pulse-dot');
                if (dot) {
                  dot.classList.remove('bounce-animation');
                  void (dot as HTMLElement).offsetWidth; // Trigger reflow
                  dot.classList.add('bounce-animation');
                }
              }}
            >
              <div id="funny-title" style={{ fontSize: '15px', color: '#8b795e', marginBottom: '5px', fontWeight: 700 }}>
                מדד ה-Vintage 🍷
              </div>
              
              <div className="indicator-wrapper">
                <span id="startIcon" className="endpoint-icon">👓</span>
                <div className="age-line-container">
                  <span id="centerIcon" className="center-icon">
                    {member.gender === 'נקבה' ? '👑' : '🐂'}
                  </span>
                  <div 
                    id="userDot" 
                    className="user-pulse-dot"
                    style={{ 
                      left: `${agePercentile.roundedPercentile}%`,
                      background: member.gender === 'נקבה' 
                        ? (agePercentile.roundedPercentile < 25 ? '#fefae0' : agePercentile.roundedPercentile < 50 ? '#faedcd' : agePercentile.roundedPercentile <= 60 ? '#d4a373' : '#ccd5ae')
                        : '#d4a373'
                    }}
                  ></div>
                </div>
                <span id="endIcon" className="endpoint-icon">
                  {member.gender === 'נקבה' ? '🐥' : '🍼'}
                </span>
              </div>
              
              <div id="dynamicComment" className="dynamic-comment">
                {(() => {
                  const p = agePercentile.roundedPercentile;
                  if (member.gender === 'נקבה') {
                    if (p < 25) return <span>עוד לא התייבש לך החלב על השפתיים, <strong>אפרוחית</strong>! 🐥</span>;
                    if (p < 50) return <span>את <strong>פרגית</strong> צעירה, תהני! 🐔</span>;
                    if (p <= 60) return <span>מזל טוב, את <strong>מלכת הלול</strong>! 👑✨</span>;
                    return <span><strong>מגה גלופלקס</strong>, לקחת? 🦯</span>;
                  } else {
                    if (p < 25) return <span>עוד לא התייבש לך החלב על השפתיים 🍼</span>;
                    if (p < 50) return <span>אתה <strong>עגל צעיר</strong>, תהנה 🐮</span>;
                    if (p <= 60) return <span>מזל טוב, אתה <strong>שור אמיתי</strong>! 🐂</span>;
                    return <span><strong>מגה גלופלקס</strong>, לקחת? 🦯</span>;
                  }
                })()}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '10px' }}>(לחצי עליי לסיבוב דאווין)</div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-[var(--spacing-md)]">
          <div className="flex flex-col">
            <span className="text-[13px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-[var(--spacing-xs)] justify-center md:justify-start">
              <Waves size={13} className="text-[var(--ocean-liquid)]" /> סשנים
            </span>
            <span className="text-3xl font-black text-[var(--ocean-liquid)] tabular-nums">
              <Counter value={stats.totalSessions} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1 justify-center md:justify-start">
              <Flame size={13} className="text-orange-500" /> רצף
            </span>
            <span className="text-3xl font-black text-orange-500 tabular-nums">
              <Counter value={stats.streak} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1 justify-center md:justify-start">
              <Trophy size={13} className="text-amber-500" /> Grit
            </span>
            <span className="text-3xl font-black text-amber-500 tabular-nums">
              <Counter value={Math.round(stats.gritScore)} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
