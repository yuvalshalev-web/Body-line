import React, { useState, useRef, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { 
  Waves, 
  Anchor, 
  Mountain, 
  Snowflake,
  ShieldCheck,
  Award,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  User,
  Flag,
  Wind,
  Compass,
  Ship,
  Map as MapIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateUserStats } from '../utils/analytics';

// Define the available disciplines/sports
const DISCIPLINES = [
  { id: 'surfing', name: 'גלישת גלים', icon: Waves, color: 'from-cyan-500 to-blue-600', shadow: 'shadow-blue-500/30' },
  { id: 'sailing', name: 'סקיפר / שייט', icon: Anchor, color: 'from-blue-600 to-indigo-800', shadow: 'shadow-indigo-500/30' },
  { id: 'diving', name: 'צלילה', icon: Waves, color: 'from-emerald-400 to-teal-600', shadow: 'shadow-teal-500/30' },
  { id: 'climbing', name: 'טיפוס הרים', icon: Mountain, color: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/30' },
  { id: 'rock-climbing', name: 'טיפוס צוקים', icon: Mountain, color: 'from-stone-500 to-stone-700', shadow: 'shadow-stone-500/30' },
  { id: 'ski', name: 'סקי / סנובורד', icon: Snowflake, color: 'from-slate-200 to-slate-400', shadow: 'shadow-slate-400/30', textColor: 'text-slate-800' },
  { id: 'golf', name: 'גולף', icon: Flag, color: 'from-green-400 to-green-700', shadow: 'shadow-green-500/30' },
  { id: 'paragliding', name: 'מצנח רחיפה', icon: Wind, color: 'from-sky-300 to-indigo-500', shadow: 'shadow-sky-500/30' },
  { id: 'canyoning', name: 'קניונינג', icon: MapIcon, color: 'from-amber-600 to-orange-800', shadow: 'shadow-amber-500/30' },
  { id: 'rafting', name: 'רפטינג', icon: Ship, color: 'from-teal-400 to-blue-700', shadow: 'shadow-teal-500/30' }
];

export const AthletePassport: React.FC = () => {
  const { currentUser } = useAuth();
  const { members, weeklyHistory, yearConfig, events } = useData();
  const [activeDiscipline, setActiveDiscipline] = useState('surfing');
  
  const member = useMemo(() => members.find(m => m.id === currentUser?.id), [currentUser, members]);
  
  const stats = useMemo(() => {
    if (!currentUser || members.length === 0) return null;
    return calculateUserStats(currentUser.id, members, weeklyHistory, yearConfig, events);
  }, [currentUser, members, weeklyHistory, yearConfig, events]);

  // 3D Tilt Effect Setup
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (!member || !stats) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-pulse" dir="rtl">
        <div className="h-10 w-48 bg-slate-200 rounded-lg mb-8" />
        <div className="flex justify-center">
          <div className="w-full max-w-[420px] aspect-[1/1.6] rounded-[2.5rem] bg-slate-100 border border-slate-200" />
        </div>
      </div>
    );
  }

  const activeProfile = DISCIPLINES.find(d => d.id === activeDiscipline)!;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8" dir="rtl">
      
      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="text-center md:text-right">
          <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-l from-slate-800 to-slate-500 bg-clip-text text-transparent tracking-tight">
            Athlete Passport
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Verified Action ID</p>
        </div>
        
        {/* Apple Wallet Style Tabs */}
        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-full shadow-inner border border-slate-200/50 overflow-x-auto max-w-full">
          {DISCIPLINES.map(tab => {
            const Icon = tab.icon;
            const isActive = activeDiscipline === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDiscipline(tab.id)}
                className={`relative px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-all whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-tab"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-full -z-10 shadow-lg`}
                  />
                )}
                <Icon size={16} className={isActive ? 'text-white' : ''} />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3D Glass Passport Card */}
      <div className="flex [perspective:1000px] justify-center">
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className={`w-full max-w-[420px] aspect-[1/1.6] rounded-[2.5rem] relative cursor-pointer border ${activeProfile.textColor === 'text-slate-800' ? 'border-white/60' : 'border-white/20'}`}
        >
          {/* Animated Background Gradient */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDiscipline}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-br ${activeProfile.color} ${activeProfile.shadow} shadow-2xl overflow-hidden`}
            >
              {/* Holographic Overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/5 to-transparent opacity-50 mix-blend-overlay" />
              <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,transparent_50%)] animate-spin-slow pointer-events-none mix-blend-overlay" style={{ animationDuration: '20s' }} />
              {/* Noise Texture */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            </motion.div>
          </AnimatePresence>

          {/* Card Content (Elevated in 3D) */}
          <motion.div 
            style={{ transform: "translateZ(40px)" }}
            className={`absolute inset-0 p-8 flex flex-col ${activeProfile.textColor || 'text-white'}`}
          >
            {/* Header: Verified & QR */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 shadow-inner mb-2 inline-flex">
                  <ShieldCheck size={14} className="text-white drop-shadow-sm" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-sm">Verified ID</span>
                </div>
                <h3 className="text-sm font-black opacity-80 uppercase tracking-widest">{activeProfile.name}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
                <QrCode size={24} className="opacity-80" />
              </div>
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/30 shadow-inner overflow-hidden p-1 flex-shrink-0">
                {member.avatar ? (
                  <img src={member.avatar} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-white/20 rounded-xl flex items-center justify-center">
                    <User size={32} className="opacity-50" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight drop-shadow-md leading-none mb-1">
                  {member.firstName} {member.lastName}
                </h1>
                <p className="text-sm font-bold opacity-80 flex items-center gap-1.5">
                  <MapPin size={14} />
                  {(member as any).homeBreak || 'ישראל'}
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 flex items-center gap-1">
                  <Clock size={12} /> שעות מעשיות
                </span>
                <span className="text-3xl font-black drop-shadow-md">
                  {activeDiscipline === 'surfing' ? stats.totalSessions * 2 : '--'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 flex items-center gap-1">
                  <Award size={12} /> רמת מיומנות
                </span>
                <span className="text-lg leading-tight font-black drop-shadow-md mt-auto">
                  {activeDiscipline === 'surfing' ? (stats.overallProgressPercent > 80 ? 'מתקדם' : 'בינוני') : 'טרם הוזן'}
                </span>
              </div>
            </div>

            {/* Certifications / Badges Bar */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-3 block">הסמכות מאומתות</span>
              <div className="flex gap-2">
                {Array.isArray(member.certifications) && member.certifications.length > 0 ? (
                  member.certifications.map((cert: string, i: number) => (
                    <div key={i} className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-xs font-bold shadow-inner">
                      {cert.split(' ')[0]} {/* Show short version */}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs font-medium opacity-60">
                    אין הסמכות רשומות
                  </div>
                )}
                {activeDiscipline === 'sailing' && (
                  <div className="px-3 py-1.5 bg-yellow-400/20 text-yellow-100 backdrop-blur-md border border-yellow-400/30 rounded-lg text-xs font-bold shadow-inner flex items-center gap-1">
                    <Anchor size={12} /> סקיפר משיט 30
                  </div>
                )}
              </div>
            </div>
            
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
};
