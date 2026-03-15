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

  const [imageError, setImageError] = useState(false);

  const member = useMemo(() => {
    return members.find(m => m.id === userId);
  }, [userId, members]);

  useEffect(() => {
    setImageError(false);
  }, [member?.avatar]);

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
    <div className="tangible-glass-card p-[var(--spacing-md)] flex flex-col md:flex-row items-center gap-[var(--spacing-lg)] relative overflow-hidden surfer-theme-bg" dir="rtl">
      {/* Background Accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-ocean/10 rounded-full blur-3xl -z-10" />
      
      <div className="relative">
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-3xl relative group">
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 bg-sunshine-yellow/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="w-full h-full rounded-3xl overflow-hidden border border-white/30 shadow-2xl bg-white/5 backdrop-blur-xl rotate-3 relative z-10 feathered-avatar-hover">
            {member.avatar && !imageError ? (
              <img 
                src={member.avatar} 
                alt="" 
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-[-3deg] feathered-avatar" 
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <Star size={80} className="animate-pulse" />
              </div>
            )}
            
            {/* Glass Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
          </div>
        </div>
        {stats.isTop10 && (
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-sand rounded-full flex items-center justify-center text-black shadow-md border border-white/30 animate-bounce">
            <Crown size={20} />
          </div>
        )}
      </div>

      <div className="flex-1 text-center md:text-right">
        <div className="flex flex-col gap-2 mb-3">
          <h2 className="text-3xl font-black name-title-text tracking-tight">
            {member.firstName} {member.lastName}
          </h2>
          <div className="flex items-center justify-center md:justify-start gap-4 secondary-detail-text font-bold text-sm mb-1">
            <span className="flex items-center gap-1"><Calendar size={14} /> הצטרף ב-{stats.joiningDate}</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="inline-flex px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest border shadow-sm bg-orange-500/20 text-orange-700 border-orange-500/30">
              מעמד: {stats.rank}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest border shadow-sm ${
              member.isActive !== false 
                ? 'bg-emerald-500/20 text-emerald-900 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-900 border-rose-500/30'
            }`}>
              סטטוס: {member.isActive !== false ? 'פעיל' : 'לא פעיל'}
            </span>
            <span className="inline-flex px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest border shadow-sm bg-pink-500/20 text-pink-700 border-pink-500/30">
              זהות: {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
