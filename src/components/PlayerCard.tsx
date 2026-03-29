import React, { useMemo, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Calendar, Crown, Star, Facebook, Instagram, Linkedin, Globe, MessageCircle, Phone, Twitter, Music2, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateUserStats } from '../utils/analytics';
import UserCategories from './UserCategories';

interface PlayerCardProps {
  userId: string;
}


const SurferSilhouette = () => (
  <svg viewBox="0 0 100 100" className="w-32 h-32 opacity-20" fill="currentColor">
    <path d="M50 20c5.5 0 10-4.5 10-10S55.5 0 50 0s-10 4.5-10 10 4.5 10 10 10zM30 40c0-5.5 4.5-10 10-10h20c5.5 0 10 4.5 10 10v20H30V40zM40 70h20v30H40V70z" />
    <path d="M10 80c0-5.5 10-10 20-10h40c10 0 20 4.5 20 10v10H10V80z" opacity="0.5" />
  </svg>
);

const PlayerCard: React.FC<PlayerCardProps> = ({ userId }) => {
  const { members, weeklyHistory, yearConfig, siteConfig, isLoading, events } = useData();
  const { currentUser } = useAuth();

  const [imageError, setImageError] = useState(false);

  const member = useMemo(() => {
    return members.find(m => m.id === userId);
  }, [userId, members]);

  useEffect(() => {
    setImageError(false);
  }, [member?.avatar]);

  const stats = useMemo(() => {
    if (!userId || members.length === 0 || isLoading) return null;
    return calculateUserStats(userId, members, weeklyHistory, yearConfig, events);
  }, [userId, members, weeklyHistory, yearConfig, events, isLoading]);

  const openWhatsApp = (mobile: string) => {
    const formattedMobile = mobile.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedMobile}`, '_blank');
  };

  const callMobile = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

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
              <div className="w-full h-full flex items-center justify-center text-[#00426a]/20 bg-white/5 backdrop-blur-sm">
                <SurferSilhouette />
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

          {/* Social Media Links */}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {/* Facebook */}
            {member.facebookUrl ? (
              <a href={ensureAbsoluteUrl(member.facebookUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#1877F2]/10 rounded-xl hover:bg-[#1877F2] hover:text-white transition-all text-[#1877F2] shadow-sm" title="Facebook">
                <Facebook size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור לפייסבוק">
                <Facebook size={20} />
              </div>
            )}

            {/* Instagram */}
            {member.instagramUrl ? (
              <a href={ensureAbsoluteUrl(member.instagramUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#E4405F]/10 rounded-xl hover:bg-[#E4405F] hover:text-white transition-all text-[#E4405F] shadow-sm" title="Instagram">
                <Instagram size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור לאינסטגרם">
                <Instagram size={20} />
              </div>
            )}

            {/* TikTok */}
            {member.tiktokUrl ? (
              <a href={ensureAbsoluteUrl(member.tiktokUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/10 rounded-xl hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white transition-all text-slate-800 shadow-sm backdrop-blur-sm" title="TikTok">
                <Music2 size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור לטיקטוק">
                <Music2 size={20} />
              </div>
            )}

            {/* LinkedIn */}
            {member.linkedinUrl ? (
              <a href={ensureAbsoluteUrl(member.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#0077B5]/10 rounded-xl hover:bg-[#0077B5] hover:text-white transition-all text-[#0077B5] shadow-sm" title="LinkedIn">
                <Linkedin size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור ללינקדאין">
                <Linkedin size={20} />
              </div>
            )}

            {/* Twitter/X */}
            {member.twitterUrl ? (
              <a href={ensureAbsoluteUrl(member.twitterUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/10 rounded-xl hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white transition-all text-slate-800 shadow-sm backdrop-blur-sm" title="X (Twitter)">
                <Twitter size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור ל-X">
                <Twitter size={20} />
              </div>
            )}

            {/* Website */}
            {member.websiteUrl ? (
              <a href={ensureAbsoluteUrl(member.websiteUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#3dbbd3]/10 rounded-xl hover:bg-[#3dbbd3] hover:text-white transition-all text-[#3dbbd3] shadow-sm" title="Website">
                <Globe size={20} />
              </a>
            ) : (
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 cursor-not-allowed opacity-40" title="אין קישור לאתר">
                <Globe size={20} />
              </div>
            )}
          </div>

          {/* Communication Buttons */}
          {currentUser?.id !== userId && (
            <div className="flex flex-wrap gap-4 justify-center mt-6">
              <button 
                onClick={() => member.mobile && openWhatsApp(member.mobile)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-b from-[#25D366] to-[#1DA851] rounded-2xl hover:brightness-110 active:translate-y-1 transition-all text-white shadow-[0_6px_0_#14833b,0_10px_20px_rgba(37,211,102,0.4)] font-black" 
                title="WhatsApp"
              >
                <MessageCircle size={24} />
                <span>וואטסאפ</span>
              </button>
              <button 
                onClick={() => member.mobile && callMobile(member.mobile)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-b from-[#00A8E8] to-[#007EA7] rounded-2xl hover:brightness-110 active:translate-y-1 transition-all text-white shadow-[0_6px_0_#005A7A,0_10px_20px_rgba(0,168,232,0.4)] font-black" 
                title="התקשר"
              >
                <Phone size={24} />
                <span>התקשר</span>
              </button>
            </div>
          )}

          <UserCategories userId={userId} />

          {/* Certifications Section */}
          {member.certifications && member.certifications.length > 0 && (
            <div className="w-full p-4 bg-indigo-50/30 backdrop-blur-[20px] border border-indigo-100/50 rounded-2xl mt-4" dir="rtl">
              <div className="text-indigo-600 text-sm font-black mb-3 flex items-center gap-2 justify-center">
                <ShieldCheck size={16} /> הכשרות והסמכות
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {member.certifications.map((cert, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/80 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg shadow-sm">
                    {cert === 'טקסט חופשי' ? (member.otherCertification || 'אחר') : cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
