import React, { useMemo, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Calendar, Crown, Star, Facebook, Instagram, Linkedin, Globe, MessageCircle, Phone, Twitter, Music2, Mail, MapPin } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { calculateUserStats } from '../utils/analytics';
import { getBodyLineStats } from '../utils/bodyLineStats';
import UserCategories from './UserCategories';

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
    <div className="flex flex-col items-center gap-[var(--spacing-lg)] relative overflow-hidden w-full p-6 md:p-8 bg-[#f0f8ff]/10 backdrop-blur-[20px] border-t border-l border-t-[#ffffff]/80 border-l-[#ffffff]/80 border-b border-r border-b-[#00426a]/10 border-r-[#00426a]/10 shadow-[0_8px_32px_rgba(49,170,193,0.15),0_4px_16px_rgba(49,170,193,0.1)] rounded-[2rem]" dir="rtl">
      {/* Grit Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      {/* Background Accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-ocean/10 rounded-full blur-3xl -z-10" />
      
      <div className="relative flex justify-center w-full">
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full relative group">
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 bg-sunshine-yellow/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="w-full h-full rounded-full overflow-hidden relative z-10 flex items-center justify-center">
            {member.avatar && !imageError ? (
              <img 
                src={member.avatar} 
                alt="" 
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 gradient-mask" 
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <Star size={100} className="animate-pulse" />
              </div>
            )}
          </div>
        </div>
        {stats.isTop10 && (
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-sand rounded-full flex items-center justify-center text-black shadow-md border border-white/30 animate-bounce z-20">
            <Crown size={20} />
          </div>
        )}
      </div>

      <div className="flex-1 text-center">
        <div className="flex flex-col gap-2 mb-3">
          <h2 className="text-3xl font-black text-[#00426a] tracking-tight">
            {member.firstName} {member.lastName}
          </h2>
          <div className="flex flex-col items-center justify-center gap-1 text-[#00426a]/70 font-bold text-sm mb-1">
            <span className="flex items-center gap-1"><Mail size={14} /> {member.email}</span>
            {(member.full_address || member.city) && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> 
                {member.full_address || [member.street_name, member.house_number, member.city].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="inline-flex px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest border shadow-sm bg-orange-500/20 text-orange-700 border-orange-500/30">
              מעמד: {stats.rank}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest border shadow-sm ${
              member.isActive !== false 
                ? 'bg-[#2D6A4F]/20 text-[#2D6A4F] border-[#2D6A4F]/30' 
                : 'bg-[#BC4749]/20 text-[#BC4749] border-[#BC4749]/30'
            }`}>
              סטטוס: {member.isActive !== false ? 'פעיל' : 'מושהה'}
            </span>
            <span className="inline-flex px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest border shadow-sm bg-[#0071a1]/20 text-[#00426a] border-[#0071a1]/30">
              זהות: {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
            </span>
          </div>

          {/* Social Media Links */}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {/* Facebook */}
            {member.facebookUrl ? (
              <a href={member.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#1877F2]/10 rounded-xl hover:bg-[#1877F2] hover:text-white transition-all text-[#1877F2] shadow-sm" title="Facebook">
                <Facebook size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור לפייסבוק">
                <Facebook size={20} />
              </div>
            )}

            {/* Instagram */}
            {member.instagramUrl ? (
              <a href={member.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#E4405F]/10 rounded-xl hover:bg-[#E4405F] hover:text-white transition-all text-[#E4405F] shadow-sm" title="Instagram">
                <Instagram size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור לאינסטגרם">
                <Instagram size={20} />
              </div>
            )}

            {/* TikTok */}
            {member.tiktokUrl ? (
              <a href={member.tiktokUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/10 rounded-xl hover:bg-black hover:text-white transition-all text-black shadow-sm" title="TikTok">
                <Music2 size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור לטיקטוק">
                <Music2 size={20} />
              </div>
            )}

            {/* LinkedIn */}
            {member.linkedinUrl ? (
              <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#0077B5]/10 rounded-xl hover:bg-[#0077B5] hover:text-white transition-all text-[#0077B5] shadow-sm" title="LinkedIn">
                <Linkedin size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור ללינקדאין">
                <Linkedin size={20} />
              </div>
            )}

            {/* Twitter/X */}
            {member.twitterUrl ? (
              <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/10 rounded-xl hover:bg-black hover:text-white transition-all text-black shadow-sm" title="X (Twitter)">
                <Twitter size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור ל-X">
                <Twitter size={20} />
              </div>
            )}

            {/* Website */}
            {member.websiteUrl ? (
              <a href={member.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#3dbbd3]/10 rounded-xl hover:bg-[#3dbbd3] hover:text-white transition-all text-[#3dbbd3] shadow-sm" title="Website">
                <Globe size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור לאתר">
                <Globe size={20} />
              </div>
            )}
          </div>

          {/* Communication Buttons Removed per user request */}
          <UserCategories userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
