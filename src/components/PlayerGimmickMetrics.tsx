import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { getBodyLineStats } from '../utils/bodyLineStats';
import './dashboard/dashboard-theme.css';

interface PlayerGimmickMetricsProps {
  userId: string;
}

const PlayerGimmickMetrics: React.FC<PlayerGimmickMetricsProps> = ({ userId }) => {
  const { members, siteConfig, isLoading } = useData();

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
            className="tangible-glass-card surfer-theme-bg w-full p-6" 
            dir="rtl"
          >
            <div id="drift-title" className="name-title-text text-lg font-bold mb-4 text-center">
              מדד ה-Drift (סחף) 🌊
            </div>
            
            <div className="flex items-center justify-between w-full mb-4" dir="ltr">
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
              {member.gender === 'נקבה' ? 'את גרה' : 'אתה גר'} במרחק {driftPercentile.distanceKm} ק"מ מחוף הבית – {member.gender === 'נקבה' ? 'קרובה' : 'קרוב'} יותר מ-{100 - driftPercentile.roundedPercentile}% מהקהילה
            </div>
          </div>
        </div>
      )}

      {/* Age Percentile Indicator (Vintage) */}
      {agePercentile && (
        <div className="flex flex-col items-start w-full md:w-auto">
          {/* New Age Gimmick Container */}
          <div 
            className="tangible-glass-card surfer-theme-bg w-full p-6" 
            dir="rtl"
          >
            <div id="funny-title" className="name-title-text text-lg font-bold mb-4 text-center">
              מדד ה-Vintage 🍷
            </div>
            
            <div className="flex items-center justify-between w-full mb-4" dir="ltr">
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
              {member.gender === 'נקבה' ? 'את' : 'אתה'} באחוזון הגיל ה-{agePercentile.roundedPercentile}% של הקבוצה
            </div>
          </div>

          {/* Popup Modal */}
        </div>
      )}
    </div>
  );
};

export default PlayerGimmickMetrics;
