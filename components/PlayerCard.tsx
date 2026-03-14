import React, { useMemo, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Calendar, Crown, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { calculateUserStats } from '../src/utils/analytics';
import { getBodyLineStats } from '../src/utils/bodyLineStats';

interface PlayerCardProps {
  userId: string;
}


const PlayerCard: React.FC<PlayerCardProps> = ({ userId }) => {
  const { members, weeklyHistory, yearConfig, siteConfig, isLoading } = useData();
  const [showPopup, setShowPopup] = useState(false);
  const [showDriftPopup, setShowDriftPopup] = useState(false);

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
    
    // Use getBodyLineStats for age percentile
    const membersWithAge = members.map(m => ({
      ...m,
      age: m.birthday ? calculateAge(m.birthday) : undefined
    }));

    const statsHelper = getBodyLineStats(membersWithAge as any);
    const percentile = parseFloat(statsHelper.calculatePercentile(userAge, 'age'));
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

  const driftPercentile = useMemo(() => {
    const homeBreak = siteConfig?.home_break;
    if (!homeBreak?.lat || !homeBreak?.lng || !member?.lat || !member?.lng || members.length === 0) return null;

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const userDistance = calculateDistance(member.lat, member.lng, homeBreak.lat, homeBreak.lng);
    
    // Use getBodyLineStats for distance percentile
    const membersWithDistance = members.map(m => ({
      ...m,
      distance: m.lat && m.lng ? calculateDistance(m.lat!, m.lng!, homeBreak.lat!, homeBreak.lng!) : undefined
    }));

    const statsHelper = getBodyLineStats(membersWithDistance as any);
    const percentile = parseFloat(statsHelper.calculatePercentile(userDistance, 'distance'));
    const roundedPercentile = Math.round(percentile);
    const distanceKm = userDistance.toFixed(1);

    let label = `מדד הסחף: אתה נמצא במרחק של ${distanceKm} ק"מ מהחוף`;
    
    return { percentile, roundedPercentile, distanceKm, label };
  }, [member, members, siteConfig]);

  if (isLoading) return <div className="p-4 glass-panel rounded-2xl border border-white/20 animate-pulse">טוען...</div>;
  if (!member || !stats) return null;

  return (
    <div className="neo-glass-card p-[var(--spacing-md)] flex flex-col md:flex-row items-center gap-[var(--spacing-lg)] relative overflow-hidden" dir="rtl">
      {/* Background Accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
      
      <div className="relative">
        <div className="w-28 h-28 rounded-xl overflow-hidden border border-white/20 shadow-lg shadow-black/5 bg-white/10 backdrop-blur-md rotate-3">
          {member.avatar ? (
            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Star size={48} />
            </div>
          )}
        </div>
        {stats.isTop10 && (
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-md border border-white/30 animate-bounce">
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
            <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[12px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              מעמד: {stats.rank}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-[4px] text-[12px] font-black uppercase tracking-widest border shadow-[1px_1px_0px_rgba(0,0,0,0.8)] ${
              member.isActive !== false 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              סטטוס: {member.isActive !== false ? 'פעיל' : 'לא פעיל'}
            </span>
            <span className="inline-flex px-3 py-1 bg-white/10 backdrop-blur-md glass-text-primary rounded-md text-[12px] font-black uppercase tracking-widest border border-white/20 shadow-sm">
              זהות: {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
            </span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="mt-2 flex flex-row flex-wrap items-start justify-center md:justify-start gap-4" dir="ltr">
          {/* Drift Metric */}
          {driftPercentile && (
            <div className="flex flex-col items-start">
              <div 
                className="age-gimmick-card w-full max-w-[310px]" 
                dir="rtl"
                onClick={() => setShowDriftPopup(true)}
              >
                <div id="drift-title" style={{ fontSize: '15px', color: '#006994', marginBottom: '5px', fontWeight: 700 }}>
                  מדד ה-Drift (סחף) 🌊
                </div>
                
                <div className="indicator-wrapper">
                  <span className="endpoint-icon">🪐</span>
                  <div className="age-line-container">
                    <span className="center-icon">🏄‍♂️</span>
                    <div 
                      className="user-pulse-dot"
                      style={{ 
                        left: `${driftPercentile.roundedPercentile}%`,
                        background: '#006994'
                      }}
                    ></div>
                  </div>
                  <span className="endpoint-icon">📍</span>
                </div>
                
                <div className="dynamic-comment">
                  {driftPercentile.roundedPercentile < 20 ? (
                    <span>אתה <strong>מקומי אמיתי</strong>! רק {driftPercentile.distanceKm} ק"מ מהחוף. 🪐</span>
                  ) : driftPercentile.roundedPercentile > 80 ? (
                    <span>וואו, איזה <strong>סחף</strong>! {driftPercentile.distanceKm} ק"מ? כבוד על ההתמדה! 🚗</span>
                  ) : (
                    <span>מרחק מהחוף: <strong>{driftPercentile.distanceKm} ק"מ</strong>. אתה קרוב יותר מ-{100 - driftPercentile.roundedPercentile}% מהקהילה.</span>
                  )}
                </div>
                <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '10px' }}>(לחץ עליי לסיבוב דאווין)</div>
              </div>

              {/* Drift Popup Modal */}
              {showDriftPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDriftPopup(false)}>
                  <div className="neo-glass-card p-8 max-w-xs w-full text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-black text-[#006994] mb-3">
                      סיבוב דאווין 🌊
                    </h2>
                    <p className="text-md font-bold text-slate-700">מרחק מהבית: {driftPercentile.distanceKm} ק"מ</p>
                    <p className="text-sm text-slate-500 mt-1">אתה באחוזון ה-{driftPercentile.roundedPercentile} של המרחק מהחוף</p>
                    <button 
                      className="mt-6 px-8 py-2 bg-[#006994] text-white rounded-xl border border-white/20 shadow-lg shadow-black/10 font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                      onClick={() => setShowDriftPopup(false)}
                    >
                      סגור
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Age Percentile Indicator (Vintage) */}
          {agePercentile && (
            <div className="flex flex-col items-start">
              {/* New Age Gimmick Container */}
              <div 
                className="age-gimmick-card w-full max-w-[310px]" 
                dir="rtl"
                onClick={() => setShowPopup(true)}
              >
                <div id="funny-title" style={{ fontSize: '15px', color: '#8b795e', marginBottom: '5px', fontWeight: 700 }}>
                  מדד ה-Vintage 🍷
                </div>
                
                <div className="indicator-wrapper">
                  <span id="startIcon" className="endpoint-icon">🐢</span>
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
                      return <span><strong>צב מנוסה אתה באחוזון הגיל ה-85 של הקבוצה</strong>, מגה גלופלקס לקחת? 🐢</span>;
                    } else {
                      if (p < 25) return <span>עוד לא התייבש לך החלב על השפתיים 🍼</span>;
                      if (p < 50) return <span>אתה <strong>עגל צעיר</strong>, תהנה 🐮</span>;
                      if (p <= 60) return <span>מזל טוב, אתה <strong>שור אמיתי</strong>! 🐂</span>;
                      return <span><strong>צב מנוסה אתה באחוזון הגיל ה-85 של הקבוצה</strong>, מגה גלופלקס לקחת? 🐢</span>;
                    }
                  })()}
                </div>
                <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '10px' }}>(לחצי עליי לסיבוב דאווין)</div>
              </div>

              {/* Popup Modal */}
              {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowPopup(false)}>
                  <div className="neo-glass-card p-8 max-w-xs w-full text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-black text-[#006994] mb-3">
                      סיבוב דאווין {(() => {
                        const p = agePercentile.roundedPercentile;
                        if (member.gender === 'נקבה') {
                          if (p < 25) return '🐥';
                          if (p < 50) return '🐔';
                          if (p <= 60) return '👑';
                          return '🐢';
                        } else {
                          if (p < 25) return '🍼';
                          if (p < 50) return '🐮';
                          if (p <= 60) return '🐂';
                          return '🐢';
                        }
                      })()}
                    </h2>
                    <p className="text-md font-bold text-slate-700">צב מנוסה אתה באחוזון הגיל ה-85 של הקבוצה</p>
                    <button 
                      className="mt-6 px-8 py-2 bg-[#006994] text-white rounded-[8px] border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,0.8)] font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                      onClick={() => setShowPopup(false)}
                    >
                      סגור
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
