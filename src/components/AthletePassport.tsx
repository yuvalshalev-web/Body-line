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
  Map as MapIcon,
  Info,
  CheckCircle2 as VerifiedIcon,
  RotateCcw,
  Cloud
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
  { id: 'rafting', name: 'רפטינג', icon: Ship, color: 'from-teal-400 to-blue-700', shadow: 'shadow-teal-500/30' },
  { id: 'skydiving', name: 'צניחה חופשית', icon: Wind, color: 'from-blue-400 to-sky-600', shadow: 'shadow-blue-400/30' },
  { id: 'all', name: 'הכל', icon: Award, color: 'from-slate-700 to-slate-900', shadow: 'shadow-black/30' }
];

const PassportStamp = ({ club, location, date, colorClass, rotateClass, icon: Icon }: any) => {
  return (
    <div className={`relative w-[85px] h-[85px] rounded-full border-[3px] border-dashed ${colorClass} ${rotateClass} flex flex-col items-center justify-center p-1 opacity-[0.85] hover:opacity-100 transition-all duration-300 hover:scale-[1.15] cursor-help shadow-sm group/stamp`}>
       <div className={`absolute inset-[3px] rounded-full border-2 border-solid ${colorClass} opacity-60`}></div>
       <div className={`absolute inset-[9px] rounded-full border border-solid ${colorClass} opacity-40`}></div>
       
       <Icon size={14} className="mb-0.5 opacity-80" />
       
       <span className="font-black text-[9px] leading-[1] text-center uppercase tracking-tighter w-[85%] whitespace-nowrap overflow-hidden text-ellipsis">
          {club}
       </span>
       <span className="font-bold text-[7px] uppercase tracking-widest mt-0.5 opacity-80">{location}</span>
       <span className="font-mono text-[8px] font-black mt-1 opacity-90">{date}</span>
       
       <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMTUiLz4KPC9zdmc+')] rounded-full pointer-events-none opacity-30 mix-blend-overlay"></div>
       
       {/* Tooltip */}
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/stamp:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap z-[200] shadow-xl border border-white/10 pointer-events-none">
          {club} - {location} ({date})
       </div>
    </div>
  )
}

const getClubStamps = (discipline: string, memberId: string) => {
  switch (discipline) {
    case 'surfing':
      return [
        { id: 1, club: "ריף הרצליה", location: "IL", date: "12 AUG 2023", colorClass: "text-[#1e3a8a] border-[#1e3a8a]", rotateClass: "-rotate-[14deg]", icon: Waves },
        { id: 2, club: "Hanalei Bay", location: "North Shore, HI", date: "04 NOV 2024", colorClass: "text-rose-800 border-rose-800", rotateClass: "rotate-[9deg]", icon: Wind }
      ];
    case 'diving':
      return [
        { id: 3, club: "Manta Ray Bay", location: "Palau", date: "22 JAN 2024", colorClass: "text-slate-800 border-slate-800", rotateClass: "rotate-[15deg]", icon: Waves },
        { id: 4, club: "מרינה דייוורס", location: "אילת", date: "15 MAR 2025", colorClass: "text-teal-900 border-teal-900", rotateClass: "-rotate-[7deg]", icon: Waves }
      ];
    case 'sailing':
      return [
        { id: 5, club: "Yacht Club", location: "Monaco", date: "05 SEP 2023", colorClass: "text-[#0f172a] border-[#0f172a]", rotateClass: "-rotate-[22deg]", icon: Anchor }
      ];
     case 'skydiving':
      return [
        { id: 6, club: "Skydive Dubai", location: "UAE", date: "10 FEB 2024", colorClass: "text-rose-900 border-rose-900", rotateClass: "rotate-[12deg]", icon: Wind },
        { id: 7, club: "פרדייב", location: "הבונים", date: "01 MAY 2025", colorClass: "text-blue-900 border-blue-900", rotateClass: "-rotate-[12deg]", icon: Wind }
      ];
    default:
      return [
        { id: 8, club: "מועדון הבית", location: "ישראל", date: "01 JAN 2026", colorClass: "text-slate-800 border-slate-800", rotateClass: "-rotate-[5deg]", icon: ShieldCheck }
      ];
  }
}

const BadgeWithTooltip = ({ icon: Icon, text, tooltip, colorTheme }: { icon: any, text: string, tooltip: string, colorTheme: 'yellow' | 'teal' | 'blue' }) => {
  const cn = colorTheme === 'yellow' 
    ? 'bg-yellow-400/20 text-yellow-100 border-yellow-400/30'
    : colorTheme === 'teal'
    ? 'bg-teal-400/20 text-teal-100 border-teal-400/30'
    : 'bg-blue-400/20 text-blue-100 border-blue-400/30';
    
  return (
    <div className={`relative group px-3 py-1.5 backdrop-blur-md border rounded-lg text-xs font-bold shadow-inner flex items-center shrink-0 gap-1.5 cursor-help ${cn}`}>
      <Icon size={12} />
      <span>{text}</span>
      <Info size={12} className="opacity-60" />
      
      <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 min-w-[140px] max-w-[180px] p-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white font-normal text-[11px] leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center shadow-2xl pointer-events-none">
        {tooltip}
      </div>
    </div>
  );
};

export const AthletePassport: React.FC = () => {
  const { currentUser } = useAuth();
  const { members, weeklyHistory, yearConfig, events } = useData();
  const [activeDiscipline, setActiveDiscipline] = useState('surfing');
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  const member = useMemo(() => members.find(m => m.id === currentUser?.id), [currentUser, members]);
  
  const stats = useMemo(() => {
    if (!currentUser || members.length === 0) return null;
    try {
      return calculateUserStats(currentUser.id, members, weeklyHistory, yearConfig, events);
    } catch (e) {
      console.error("AthletePassport: Failed to calculate stats", e);
      return null;
    }
  }, [currentUser, members, weeklyHistory, yearConfig, events]);

  // Auto-switch to newly added discipline if applicable
  React.useEffect(() => {
    if (member?.digitalWallet && (member as any).digitalWallet.length > 0) {
      const wallet = (member as any).digitalWallet;
      const latest = [...wallet].sort((a: any, b: any) => 
        new Date(b.verifiedAt || 0).getTime() - new Date(a.verifiedAt || 0).getTime()
      )[0];
      
      const type = (latest.type || '').toLowerCase();
      if (type === 'diving' && activeDiscipline !== 'diving') {
        setActiveDiscipline('diving');
      } else if (type === 'surfing' && activeDiscipline !== 'surfing') {
        setActiveDiscipline('surfing');
      } else if (type === 'skydiving' && activeDiscipline !== 'skydiving') {
        setActiveDiscipline('skydiving');
      } else if (type === 'sailing' && activeDiscipline !== 'sailing') {
        setActiveDiscipline('sailing');
      } else if (type === 'climbing' && activeDiscipline !== 'climbing') {
        setActiveDiscipline('climbing');
      }
    }
  }, [member?.digitalWallet?.length]);

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
          <div className="w-full max-w-[420px] min-h-[600px] flex flex-col rounded-[2.5rem] bg-slate-100 border border-slate-200" />
        </div>
      </div>
    );
  }

  const activeProfile = useMemo(() => 
    DISCIPLINES.find(d => d.id === activeDiscipline) || DISCIPLINES[0],
    [activeDiscipline]
  );

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
        <div className="flex luxury-card !bg-white/40 !backdrop-blur-3xl p-1.5 !rounded-full !shadow-inner relative overflow-hidden max-w-full">
          <div className="grain-overlay opacity-[0.02]" />
          <div className="flex items-center gap-1 relative z-10 overflow-x-auto no-scrollbar">
            {DISCIPLINES.map(tab => {
              const Icon = tab.icon;
              const isActive = activeDiscipline === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDiscipline(tab.id)}
                  className={`relative px-4 py-2 rounded-full flex items-center gap-2 text-sm font-black transition-all whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
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
      </div>

      {/* 3D Glass Passport Card */}
      <div className="flex [perspective:1000px] justify-center">
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className={`w-full max-w-[420px] min-h-[680px] flex flex-col rounded-[2.5rem] relative cursor-pointer border ${activeProfile.textColor === 'text-slate-800' ? 'border-white/60' : 'border-white/20'}`}
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
            className={`relative flex-1 p-8 flex flex-col ${activeProfile.textColor || 'text-white'}`}
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
                  <Clock size={12} /> {activeDiscipline === 'skydiving' ? 'צניחות' : 'שעות מעשיות'}
                </span>
                <span className="text-3xl font-black drop-shadow-md">
                  {activeDiscipline === 'surfing' ? stats.totalSessions * 2 : 
                   activeDiscipline === 'skydiving' ? '25+' : '0'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 flex items-center gap-1">
                  <Award size={12} /> רמת מיומנות
                </span>
                <span className="text-lg leading-tight font-black drop-shadow-md mt-auto">
                  {activeDiscipline === 'surfing' ? (stats.overallProgressPercent > 80 ? 'מתקדם' : 'בינוני') : 
                   activeDiscipline === 'skydiving' ? 'רישיון A' : 'טרם הוזן'}
                </span>
              </div>
            </div>

            {/* Certifications / Badges Bar */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-3 block">הסמכות מאומתות</span>
              <div className="flex flex-wrap gap-2">
                {/* Dynamically show licenses from the digital wallet for this discipline */}
                {(() => {
                  const filteredWallet = (member as any).digitalWallet?.filter((l: any) => {
                    const org = (l.organization || '').toLowerCase();
                    const level = (l.level || '').toLowerCase();
                    const type = (l.type || '').toLowerCase();
                    
                    // 1. Direct type match
                    if (activeDiscipline === 'all') return true;
                    if (type === activeDiscipline.toLowerCase()) return true;
                    
                    // 2. Discipline specific heuristics
                    if (activeDiscipline === 'diving') {
                      return type === 'diving' || org.includes('scuba') || org.includes('padi') || org.includes('ssi') || org.includes('iantd') || org.includes('naui') || level.includes('צלילה');
                    }
                    if (activeDiscipline === 'surfing') {
                      return type === 'surfing' || org.includes('surf') || org.includes('isa') || level.includes('גלישה');
                    }
                    if (activeDiscipline === 'sailing') {
                      return type === 'sailing' || org.includes('sail') || org.includes('skipper') || org.includes('yacht') || org.includes('משיט') || level.includes('משיט');
                    }
                    if (activeDiscipline === 'skydiving') {
                       return type === 'skydiving' || org.includes('skydive') || org.includes('uspa') || org.includes('cip') || level.includes('צניחה');
                    }
                    if (activeDiscipline === 'climbing' || activeDiscipline === 'rock-climbing') {
                       return type === 'climbing' || org.includes('climb') || org.includes('טיפוס') || level.includes('טיפוס');
                    }
                    
                    // 3. Metadata search
                    if (l.metadata) {
                        const metaStr = JSON.stringify(l.metadata).toLowerCase();
                        if (activeDiscipline === 'diving' && (metaStr.includes('dive') || metaStr.includes('tank'))) return true;
                        if (activeDiscipline === 'skydiving' && (metaStr.includes('jump') || metaStr.includes('parachute'))) return true;
                    }

                    // 4. If it's a general/other discipline, maybe show everything that doesn't match a main one?
                    // Or if we can't find a match, just return false for now to avoid cluttering.
                    
                    return false;
                  }) || [];

                  if (filteredWallet.length > 0) {
                    return filteredWallet.map((license: any) => (
                      <div key={license.id} className="relative group px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-xs font-bold shadow-inner flex shrink-0 items-center gap-1.5 cursor-help transition-transform hover:scale-105">
                        {license.type === 'Diving' ? <Waves size={12} /> : license.type === 'Surfing' ? <Wind size={12} /> : <ShieldCheck size={12} />}
                        <span>{license.level}</span>
                        
                        {/* Tooltip with full metadata rendering - Removed pointer-events-none to allow modal interaction */}
                        <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-4 w-[280px] p-0 bg-[#0f172a] backdrop-blur-2xl border border-white/10 text-white font-normal text-[11px] leading-tight rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] shadow-2xl overflow-hidden scale-95 group-hover:scale-100">
                          {/* Passport Header in Tooltip */}
                          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <span className="font-black uppercase tracking-tighter text-xs">{license.organization}</span>
                            <VerifiedIcon size={14} className="text-sky-400" />
                          </div>

                          <div className="p-4">
                            {license.image_data && (
                                <div 
                                    className="w-full h-32 mb-4 rounded-xl overflow-hidden border border-white/10 shadow-lg relative bg-black/20 cursor-zoom-in group/img"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowImageModal(license.image_data);
                                    }}
                                >
                                  <img src={license.image_data} alt="Verified Document" className="w-full h-full object-contain" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center p-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                     <span className="text-[10px] font-black uppercase text-white tracking-widest bg-sky-500/80 px-2 py-1 rounded-lg backdrop-blur-sm">הגדל תמונה</span>
                                  </div>
                                </div>
                            )}

                            <div className="space-y-2.5">
                              {license.rank && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] uppercase font-black opacity-40">Classification</span>
                                  <span className="text-sky-300 font-black text-sm tracking-tight">{license.rank}</span>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] uppercase font-black opacity-40">Document ID</span>
                                  <span className="font-mono font-bold tracking-tight">{license.license_id}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] uppercase font-black opacity-40">Expiration</span>
                                  <span className="font-bold text-rose-400">{license.expiration_date || 'Lifetime'}</span>
                                </div>
                                {license.issue_date && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase font-black opacity-40">Issue Date</span>
                                    <span className="font-bold">{license.issue_date}</span>
                                  </div>
                                )}
                                {license.instructor && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase font-black opacity-40">Instructor</span>
                                    <span className="font-bold break-words">{license.instructor}</span>
                                  </div>
                                )}
                              </div>

                              {/* Dynamic Metadata Section */}
                              {license.metadata && Object.keys(license.metadata).length > 0 && (
                                <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                                  <span className="text-[10px] uppercase font-black opacity-40 block mb-2">Extended Credentials</span>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {Object.entries(license.metadata).map(([key, value]) => (
                                      <div key={key} className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold opacity-30 truncate">{key.replace(/_/g, ' ')}</span>
                                        <span className="font-medium text-white/90 truncate">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between opacity-40 italic text-[9px]">
                              <span>Verified: {new Date(license.verifiedAt).toLocaleDateString()}</span>
                              <span>Score: {Math.round(license.confidence_score * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  }
                  
                  // Fallback to text certifications if no dynamic ones found
                  if (Array.isArray(member.certifications) && member.certifications.length > 0) {
                    return member.certifications.map((cert: string, i: number) => (
                      <div key={i} className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-xs font-bold shadow-inner flex shrink-0 items-center">
                        {cert}
                      </div>
                    ));
                  }
                  
                  return (
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-xs font-medium opacity-60">
                      אין הסמכות רשומות
                    </div>
                  );
                })()}
                {activeDiscipline === 'sailing' && (
                  <>
                    <BadgeWithTooltip icon={Anchor} text="משיט 11 (אופנוע ים)" tooltip="רישיון להשטת אופנוע ים" colorTheme="yellow" />
                    <BadgeWithTooltip icon={Anchor} text="משיט 12 (עוצמה א')" tooltip="סירת מנוע עד 8.5 מטר ועד 150 כ''ס" colorTheme="yellow" />
                    <BadgeWithTooltip icon={Anchor} text="משיט 13 (עוצמה ב')" tooltip="סירת מנוע ללא הגבלת כ''ס" colorTheme="yellow" />
                    <BadgeWithTooltip icon={Anchor} text="משיט 30 (סקיפר חופי)" tooltip="משיט יאכטה, מסע חופי עד 24 מטר" colorTheme="yellow" />
                    <BadgeWithTooltip icon={Anchor} text="משיט 40 (מסחרי)" tooltip="משיט בשכר להסעת נוסעים" colorTheme="yellow" />
                    <BadgeWithTooltip icon={Anchor} text="משיט 60 (סקיפר בינלאומי)" tooltip="סקיפר במסע בינלאומי" colorTheme="yellow" />
                  </>
                )}
                {activeDiscipline === 'diving' && (
                  <>
                    <BadgeWithTooltip icon={Waves} text="צולל כוכב 1" tooltip="הסמכה בסיסית - צלילה עד 12 מטר בליווי" colorTheme="teal" />
                    <BadgeWithTooltip icon={Waves} text="צולל שני כוכבים" tooltip="הסמכה מתקדמת - צלילה עצמאית עד 30 מטר" colorTheme="teal" />
                    <BadgeWithTooltip icon={Waves} text="צולל שלושה כוכבים" tooltip="Divemaster - מוביל קבוצות וצולל בכיר" colorTheme="teal" />
                    <BadgeWithTooltip icon={Waves} text="צולל נייטרוקס" tooltip="העשרת אוויר בחמצן להארכת זמן התחתית" colorTheme="teal" />
                    <BadgeWithTooltip icon={Waves} text="עזרה ראשונה והחייאה" tooltip="הסמכת עזרה ראשונה דחופה לסביבה ימית" colorTheme="teal" />
                    <BadgeWithTooltip icon={Waves} text="צולל הצלה" tooltip="Rescue Diver - חילוץ והצלת צוללנים במצבי חירום" colorTheme="teal" />
                  </>
                )}
                {activeDiscipline === 'skydiving' && (
                  <>
                    <BadgeWithTooltip icon={Wind} text="רישיון A" tooltip="רישיון צניחה בסיסי (25 צניחות לפחות)" colorTheme="blue" />
                    <BadgeWithTooltip icon={Wind} text="רישיון B" tooltip="רישיון בינוני (50 צניחות + דרישות מיומנות)" colorTheme="blue" />
                    <BadgeWithTooltip icon={Wind} text="רישיון C" tooltip="רישיון מתקדם (200 צניחות)" colorTheme="blue" />
                    <BadgeWithTooltip icon={Wind} text="רישיון D" tooltip="רישיון מאסטר (500 צניחות)" colorTheme="blue" />
                    <BadgeWithTooltip icon={Award} text="מדריך AFF" tooltip="מדריך צניחה חופשית בשיטת AFF" colorTheme="blue" />
                    <BadgeWithTooltip icon={Award} text="מדריך טנדם" tooltip="מדריך מוסמך לצניחות טנדם" colorTheme="blue" />
                    <BadgeWithTooltip icon={Award} text="Coach" tooltip="מאמן צניחה מוסמך" colorTheme="blue" />
                  </>
                )}
              </div>
            </div>
            {/* Additional Athlete Attributes (Insurance) */}
            {['diving', 'sailing', 'paragliding', 'ski', 'skydiving'].includes(activeDiscipline) && (
              <div className="mt-4 pt-4 border-t border-white/20">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-3 flex items-center gap-1"><ShieldCheck size={12}/> כיסוי ביטוחי רשמי</span>
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-xs">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${activeDiscipline === 'diving' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                         <span className="font-bold opacity-90">ביטוח ספורט אתגרי</span>
                      </div>
                      <span className="font-mono text-[10px] opacity-70">
                         {activeDiscipline === 'diving' ? 'בתוקף עד: 12/2026' : 'נדרש חידוש'}
                      </span>
                    </div>
                    {activeDiscipline === 'diving' && (
                      <div className="flex items-center justify-between px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-xs">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                           <span className="font-bold opacity-90">הצהרת בריאות / רופא צלילה</span>
                        </div>
                        <span className="font-mono text-[10px] opacity-70">אושר ב-01/2025</span>
                      </div>
                    )}
                 </div>
              </div>
            )}
            
            {/* International Club Stamps */}
            <div className="mt-6 pt-5 border-t border-white/20">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-4 flex items-center gap-1 justify-center"><VerifiedIcon size={12}/> זיהוי מועדונים בינלאומיים</span>
              <div className="flex flex-wrap items-center justify-center gap-4 px-2">
                 {getClubStamps(activeDiscipline, member?.id).map((stamp: any) => (
                    <PassportStamp key={stamp.id} {...stamp} />
                 ))}
                 {activeDiscipline === 'all' && (
                    <div className="text-[10px] text-white/50 font-medium text-center w-full">בחר ענף ספורט ספציפי לצפייה בחותמות מועדונים</div>
                 )}
              </div>
            </div>
            
          </motion.div>
        </motion.div>
        
        {/* Full Image Modal Overlay */}
        <AnimatePresence>
          {showImageModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
              onClick={() => setShowImageModal(null)}
            >
               <motion.button
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
               >
                 <RotateCcw className="rotate-45" size={24} />
               </motion.button>

               <motion.div
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center"
                 onClick={e => e.stopPropagation()}
               >
                 <img 
                   src={showImageModal} 
                   alt="License Full View" 
                   className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
                 />
                 <div className="mt-6 flex items-center justify-between w-full px-4">
                    <div className="flex flex-col">
                       <span className="text-white font-black text-lg tracking-tight">תצוגת מסמך מאומת</span>
                       <span className="text-white/40 text-xs font-bold uppercase tracking-widest">AI Secured Verification Image</span>
                    </div>
                    <button 
                       onClick={() => setShowImageModal(null)}
                       className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-sm active:scale-95 transition-transform"
                    >
                       סגור
                    </button>
                 </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
