import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { getBodyLineStats } from '../src/utils/bodyLineStats';
import './dashboard/dashboard-theme.css';

interface PlayerGimmickMetricsProps {
  userId: string;
}

const PlayerGimmickMetrics: React.FC<PlayerGimmickMetricsProps> = ({ userId }) => {
  const { members, siteConfig, isLoading } = useData();
  const [showPopup, setShowPopup] = useState(false);
  const [showDriftPopup, setShowDriftPopup] = useState(false);

  const member = useMemo(() => {
    return members.find(m => m.id === userId);
  }, [userId, members]);

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

    let badge = null;
    let comment = null;

    if (percentile <= 15) {
      badge = 'פופ-אפיסט';
    } else if (percentile >= 90) {
      badge = 'קלי סלייטר';
    }

    return { percentile, roundedPercentile, badge };
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

  if (isLoading || !member || (!driftPercentile && !agePercentile)) return null;

  return (
    <div className="flex flex-row flex-wrap items-start justify-center gap-4 mb-8" dir="ltr">
      {/* Drift Metric */}
      {driftPercentile && (
        <div className="flex flex-col items-start w-full md:w-auto">
          <div 
            className="tangible-glass-card surfer-theme-bg w-full p-6 cursor-pointer" 
            dir="rtl"
            onClick={() => setShowDriftPopup(true)}
          >
            <div id="drift-title" className="name-title-text text-lg font-bold mb-4 text-center">
              מדד ה-Drift (סחף) 🌊
            </div>
            
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-2xl">🪐</span>
              <div className="tactile-slider-track mx-2">
                <div 
                  className="tactile-slider-fill"
                  style={{ width: `${driftPercentile.roundedPercentile}%` }}
                ></div>
                <div 
                  className="tactile-slider-knob"
                  style={{ left: `${driftPercentile.roundedPercentile}%` }}
                ></div>
              </div>
              <span className="text-2xl">📍</span>
            </div>
            
            <div className="text-center text-sm secondary-detail-text">
              {driftPercentile.roundedPercentile < 20 ? (
                <span>אתה <strong className="metric-value-text">מקומי אמיתי</strong>! רק {driftPercentile.distanceKm} ק"מ מהחוף. 🪐</span>
              ) : driftPercentile.roundedPercentile > 90 ? (
                <span>וואו, איזה <strong className="metric-value-text">סחף</strong>! {driftPercentile.distanceKm} ק"מ? כבוד על ההתמדה! 🚗</span>
              ) : (
                <span>מרחק מהחוף: <strong className="metric-value-text">{driftPercentile.distanceKm} ק"מ</strong>. אתה קרוב יותר מ-{100 - driftPercentile.roundedPercentile}% מהקהילה.</span>
              )}
            </div>
            <div className="text-[10px] secondary-detail-text text-center mt-3">(לחץ עליי לסיבוב דאווין)</div>
          </div>

          {/* Drift Popup Modal */}
          {showDriftPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDriftPopup(false)}>
              <div className="tangible-glass-card surfer-theme-bg p-8 max-w-xs w-full text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-black name-title-text mb-3">
                  סיבוב דאווין 🌊
                </h2>
                <p className="text-lg font-bold secondary-detail-text">מרחק מהבית: {driftPercentile.distanceKm} ק"מ</p>
                <p className="text-sm secondary-detail-text mt-1">אתה באחוזון ה-{driftPercentile.roundedPercentile} של המרחק מהחוף</p>
                <button 
                  className="mt-6 px-8 py-2 bg-ocean text-black rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_10px_rgba(0,217,230,0.4)]"
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
        <div className="flex flex-col items-start w-full md:w-auto">
          {/* New Age Gimmick Container */}
          <div 
            className="tangible-glass-card surfer-theme-bg w-full p-6 cursor-pointer" 
            dir="rtl"
            onClick={() => setShowPopup(true)}
          >
            <div id="funny-title" className="name-title-text text-lg font-bold mb-4 text-center">
              מדד ה-Vintage 🍷
            </div>
            
            <div className="flex items-center justify-between w-full mb-4">
              <span id="startIcon" className="text-2xl">🐢</span>
              <div className="tactile-slider-track mx-2">
                <div 
                  className="tactile-slider-fill"
                  style={{ width: `${agePercentile.roundedPercentile}%` }}
                ></div>
                <div 
                  className="tactile-slider-knob"
                  style={{ left: `${agePercentile.roundedPercentile}%` }}
                ></div>
              </div>
              <span id="endIcon" className="text-2xl">
                {member.gender === 'נקבה' ? '🐥' : '🍼'}
              </span>
            </div>
            
            <div id="dynamicComment" className="text-center text-sm secondary-detail-text">
              {(() => {
                const p = agePercentile.roundedPercentile;
                if (member.gender === 'נקבה') {
                  if (p < 25) return <span>עוד לא התייבש לך החלב על השפתיים, <strong className="metric-value-text">אפרוחית</strong>! 🐥</span>;
                  if (p < 50) return <span>את <strong className="metric-value-text">פרגית</strong> צעירה, תהני! 🐔</span>;
                  if (p < 90) return <span>מזל טוב, את <strong className="metric-value-text">מלכת הלול</strong>! 👑✨</span>;
                  return <span><strong className="metric-value-text">את וינטג' אמיתית (אחוזון {p})</strong>! מגה גלופלקס לקחת? 🍷🐢</span>;
                } else {
                  if (p < 25) return <span>עוד לא התייבש לך החלב על השפתיים 🍼</span>;
                  if (p < 50) return <span>אתה <strong className="metric-value-text">עגל צעיר</strong>, תהנה 🐮</span>;
                  if (p < 90) return <span>מזל טוב, אתה <strong className="metric-value-text">שור אמיתי</strong>! 🐂</span>;
                  return <span><strong className="metric-value-text">אתה וינטג' אמיתי (אחוזון {p})</strong>! מגה גלופלקס לקחת? 🍷🐢</span>;
                }
              })()}
            </div>
            <div className="text-[10px] secondary-detail-text text-center mt-3">(לחצי עליי לסיבוב דאווין)</div>
          </div>

          {/* Popup Modal */}
          {showPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowPopup(false)}>
              <div className="tangible-glass-card surfer-theme-bg p-8 max-w-xs w-full text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-black name-title-text mb-3">
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
                <p className="text-lg font-bold secondary-detail-text">
                  {member.gender === 'נקבה' ? 'את' : 'אתה'} באחוזון הגיל ה-{agePercentile.roundedPercentile} של הקבוצה
                </p>
                <button 
                  className="mt-6 px-8 py-2 bg-sand text-black rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_10px_rgba(243,208,118,0.4)]"
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
  );
};

export default PlayerGimmickMetrics;
