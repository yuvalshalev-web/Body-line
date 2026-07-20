import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { getBodyLineStats } from '../utils/bodyLineStats';
import { calculateAge } from '../utils/dateUtils';
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
    const bday = member?.birthday || (member as any)?.birthDate;
    if (!bday || members.length === 0) return null;

    const userAge = calculateAge(bday);
    if (userAge === null) return null;
    
    // Use getBodyLineStats for age percentile
    const membersWithAge = members.map(m => {
      const mBday = m.birthday || (m as any).birthDate;
      return {
        ...m,
        age: mBday ? calculateAge(mBday) : undefined
      };
    });

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
            className="w-full p-6 bg-[#f0f8ff]/10 backdrop-blur-[20px] border-t border-l border-t-[#ffffff]/80 border-l-[#ffffff]/80 border-b border-r border-b-[#00426a]/10 border-r-[#00426a]/10 shadow-[0_8px_32px_rgba(49,170,193,0.15),0_4px_16px_rgba(49,170,193,0.1)] rounded-[2rem] relative overflow-hidden" 
            dir="rtl"
          >
            {/* Grit Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            
            <div id="drift-title" className="text-[#00426a] text-lg font-black mb-4 text-center relative z-10">
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
            
            <div className="text-center text-sm text-[#000000] relative z-10 font-bold">
              {member.gender === 'נקבה' ? 'את גרה' : member.gender === 'זכר' ? 'אתה גר' : 'נמצא/ת'} במרחק {driftPercentile.distanceKm} ק"מ מחוף הבית – {member.gender === 'נקבה' ? 'קרובה' : member.gender === 'זכר' ? 'קרוב' : 'קרוב/ה'} יותר מ-{100 - driftPercentile.roundedPercentile}% מהקהילה
            </div>
          </div>
        </div>
      )}

      {/* Age Percentile Indicator (Vintage) */}
      {agePercentile && (
        <div className="flex flex-col items-start w-full md:w-auto">
          {/* New Age Gimmick Container */}
          <div 
            className="w-full p-6 bg-[#f0f8ff]/10 backdrop-blur-[20px] border-t border-l border-t-[#ffffff]/80 border-l-[#ffffff]/80 border-b border-r border-b-[#00426a]/10 border-r-[#00426a]/10 shadow-[0_8px_32px_rgba(49,170,193,0.15),0_4px_16px_rgba(49,170,193,0.1)] rounded-[2rem] relative overflow-hidden" 
            dir="rtl"
          >
            {/* Grit Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            
            <div id="funny-title" className="text-[#00426a] text-lg font-black mb-4 text-center relative z-10">
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
            
            <div id="dynamicComment" className="text-center text-sm text-[#000000] relative z-10 font-bold">
              {member.gender === 'נקבה' ? 'את' : member.gender === 'זכר' ? 'אתה' : 'את/ה'} באחוזון הגיל ה-{agePercentile.roundedPercentile}% של הקבוצה
            </div>
          </div>

          {/* Popup Modal */}
        </div>
      )}
    </div>
  );
};

export default PlayerGimmickMetrics;
