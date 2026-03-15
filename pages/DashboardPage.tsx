
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Image as ImageIcon, 
  Calendar, 
  Waves,
  Loader2,
  Video,
  Quote,
  BookOpen,
  Sparkles,
  Zap,
  Wind,
  RefreshCw,
  Newspaper,
  UserCircle
} from 'lucide-react';
import { CoastalDashboard } from '../components/CoastalDashboard';
import { WaterTempCard } from '../components/WaterTempCard';
import { DailySurfRecommendation } from '../components/DailySurfRecommendation';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getNextSessionDate } from '../services/rolloverService';
import { getBodyLineStats } from '../src/utils/bodyLineStats';
import { SURF_QUOTES } from '../data/surfQuotes';
import { SURF_DICTIONARY } from '../data/surfDictionary';
import { motion } from 'motion/react';

const SurfboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2c-2.5 4-3 9-2 14 1 5 2 6 2 6s1-1 2-6c1-5 .5-10-2-14Z" />
    <path d="M12 11v3" />
  </svg>
);

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    members, galleryItems, events, attendeeIds, toggleSessionAttendance, siteAssets, glossary, quotes, news, activeSessionDate, siteConfig, updateMember, coastalWeather, seaStats
  } = useData();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [randomGlossary, setRandomGlossary] = useState<any[]>([]);
  const [randomQuotes, setRandomQuotes] = useState<any[]>([]);
  const [randomPost, setRandomPost] = useState<any>(null);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [isRefreshingGlossary, setIsRefreshingGlossary] = useState(false);
  const [isRefreshingPost, setIsRefreshingPost] = useState(false);

  const newsRef = useRef(news);
  useEffect(() => { newsRef.current = news; }, [news]);
  const glossaryRef = useRef(glossary);
  useEffect(() => { glossaryRef.current = glossary; }, [glossary]);
  const quotesRef = useRef(quotes);
  useEffect(() => { quotesRef.current = quotes; }, [quotes]);

  const activeMembers = useMemo(() => getBodyLineStats(members).activeMembers, [members]);
  const attendees = useMemo(() => activeMembers.filter(m => attendeeIds.includes(m.id)).sort((a, b) => {
    const aLast = a.lastName || '';
    const bLast = b.lastName || '';
    const aFirst = a.firstName || '';
    const bFirst = b.firstName || '';
    if (aLast || bLast) {
      const lastCompare = aLast.localeCompare(bLast, 'he');
      if (lastCompare !== 0) return lastCompare;
      return aFirst.localeCompare(bFirst, 'he');
    }
    return (a.firstName + ' ' + a.lastName).localeCompare((b.firstName + ' ' + b.lastName), 'he');
  }), [activeMembers, attendeeIds]);
  const isUserAttending = useMemo(() => currentUser ? attendeeIds.includes(currentUser.id) : false, [attendeeIds, currentUser]);

  const refreshPost = useCallback(() => {
    if (newsRef.current.length === 0) return;
    setIsRefreshingPost(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * newsRef.current.length);
      setRandomPost(newsRef.current[randomIndex]);
      setIsRefreshingPost(false);
    }, 400);
  }, []);

  const refreshGlossary = useCallback(() => {
    setIsRefreshingGlossary(true);
    setTimeout(() => {
      const source = glossaryRef.current.length > 0 ? glossaryRef.current : SURF_DICTIONARY;
      const shuffled = [...source].sort(() => 0.5 - Math.random());
      setRandomGlossary(shuffled.slice(0, 1));
      setIsRefreshingGlossary(false);
    }, 400);
  }, []);

  const refreshQuote = useCallback(() => {
    setIsRefreshingQuotes(true);
    setTimeout(() => {
      const source = quotesRef.current.length > 0 ? quotesRef.current : SURF_QUOTES;
      const shuffled = [...source].sort(() => 0.5 - Math.random());
      setRandomQuotes(shuffled.slice(0, 1));
      setIsRefreshingQuotes(false);
    }, 400);
  }, []);

  useEffect(() => {
    refreshGlossary();
    const interval = setInterval(refreshGlossary, 10000);
    return () => clearInterval(interval);
  }, [refreshGlossary]);

  useEffect(() => {
    refreshQuote();
    const interval = setInterval(refreshQuote, 10000);
    return () => clearInterval(interval);
  }, [refreshQuote]);

  useEffect(() => {
    refreshPost();
    const interval = setInterval(refreshPost, 20000);
    return () => clearInterval(interval);
  }, [refreshPost]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      let targetDateStr = activeSessionDate;
      
      if (!targetDateStr) {
        // Fallback to dynamic next session date based on siteConfig
        targetDateStr = getNextSessionDate(siteConfig?.weeklySessions);
      }
      
      const target = new Date(targetDateStr);
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeSessionDate, siteConfig?.weeklySessions]);

  const handleToggle = async () => {
    if (!currentUser) return;
    setIsProcessing(true);
    try { await toggleSessionAttendance(currentUser.id); } finally { setIsProcessing(false); }
  };

  const activeEventsCount = useMemo(() => {
    const now = new Date();
    return events.filter(e => {
      const eventDate = new Date(`${e.date}T${e.time || '00:00'}`);
      return eventDate >= now;
    }).length;
  }, [events]);

  const brandColor = '#F1D179';

  return (
    <div className="space-y-16 max-w-6xl mx-auto pb-20 px-[var(--spacing-md)] md:px-0" dir="rtl">
      {/* Hero & Attendees Group */}
      <div className="space-y-20 md:space-y-6">
        <section className="relative w-full min-h-[650px] md:min-h-[900px] lg:min-h-[1200px] rounded-3xl border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-transparent rounded-3xl overflow-hidden">
            <img 
              src={siteAssets.loginBg || siteAssets.heroBg || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media"} 
              className="w-full h-full object-contain" 
              style={{ objectPosition: 'center 5%' }}
              alt="Hero"
              loading="lazy"
            />
          </div>
          <div className="relative z-10 min-h-[650px] md:min-h-[900px] lg:min-h-[1200px] flex flex-col items-center justify-between p-6 md:p-12 text-center">
             {/* Top Section: Quote & Title & Countdown */}
             <div className="w-full pt-4 md:pt-8 flex flex-col items-center">
               <p className="text-white font-semibold italic text-sm md:text-2xl max-w-2xl mx-auto tracking-[0.08em] leading-relaxed mb-6 md:mb-10 drop-shadow-lg">
                 "A day will come that is like no other... and nothing that happens after will ever be the same."
               </p>
               <h1 className="text-[var(--surfer-yellow)] big-thursday-title" data-text="יום חמישי הגדול">יום חמישי הגדול</h1>
               
               {/* Countdown moved here for fixed positioning relative to title */}
               <div className="mt-8 md:mt-12 space-y-4 flex flex-col items-center">
                 <p className="text-base md:text-xl font-bold text-white drop-shadow-md">נכנסים למים בעוד...</p>
                 <div className="flex gap-2 md:gap-4 text-white font-black" dir="ltr">
                   {[
                     { label: 'ימים', value: countdown.days },
                     { label: 'שעות', value: countdown.hours },
                     { label: 'דקות', value: countdown.minutes },
                     { label: 'שניות', value: countdown.seconds }
                   ].map((item, i) => (
                     <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-[15px] border border-white/20 px-3 py-2 md:px-5 md:py-3 rounded-2xl shadow-lg min-w-[60px] md:min-w-[80px]">
                       <span className="text-2xl md:text-4xl font-black text-[var(--surfer-yellow)]" style={{ fontFamily: "'Heebo', sans-serif" }}>{item.value}</span>
                       <span className="text-[9px] md:text-[12px] uppercase font-bold tracking-tighter opacity-80 text-white">{item.label}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
             
             {/* Middle Section: Hotspot */}
             <div className="w-full flex flex-col items-center py-8 md:py-12 flex-1 justify-center">
               {/* Surfer Action Hotspot - Absolute positioned in CSS */}
               <div className="surfer-hotspot-container">
                 <button 
                   onClick={handleToggle}
                   disabled={isProcessing}
                   className="surfer-hotspot"
                   aria-label={isUserAttending ? "בטל הגעה" : "אני מגיע/ה"}
                 >
                   <div className="pulse-halo"></div>
                   {isProcessing ? (
                     <Loader2 className="animate-spin text-white/50" size={32} />
                   ) : (
                      null
                   )}
                 </button>
                 <motion.span 
                   className="secondary-label w-max mt-6"
                   style={{ color: isUserAttending ? '#FF2D60' : '#A2FF00' }}
                   animate={{ opacity: [1, 0.4, 1], scale: [1, 1.02, 1] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 >
                   {isUserAttending ? 'לחץ על הגולש לביטול הגעה' : 'לחץ על הגולש לאישור הגעה'}
                 </motion.span>
               </div>




             </div>
          </div>
        </section>

        {/* Confirmed Members Bar - Positioned below Hero, above AstroDecks */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <div className="home-glass-card p-6 md:p-10 flex flex-col items-center justify-center gap-8 overflow-hidden relative">
            {/* Decorative background glows - enhanced for Glassmorphism */}
            <div className="absolute left-1/4 top-0 w-64 h-64 bg-cyan-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute right-1/4 bottom-0 w-64 h-64 bg-amber-500/5 blur-[120px] pointer-events-none" />

            <div className="flex flex-col items-center gap-6 relative z-10 w-full">
              {/* Centered Avatars */}
              <div className="flex justify-center -space-x-3 md:-space-x-4 space-x-reverse">
                {attendees.slice(0, 12).map(a => (
                  <Link to={`/directory?id=${a.id}`} key={a.id} className="relative group feathered-avatar-hover">
                    {a.avatar ? (
                      <img 
                        src={a.avatar} 
                        className="w-12 h-12 md:w-14 md:h-14 rounded-xl border border-white/20 shadow-md object-cover transition-all duration-300 group-hover:scale-125 group-hover:z-20 group-hover:-translate-y-2 group-hover:rotate-6 feathered-avatar" 
                        alt="" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 flex items-center justify-center text-xs text-white font-black shadow-md transition-all duration-300 group-hover:scale-125 group-hover:z-20 group-hover:-translate-y-2 group-hover:rotate-6">
                        {a.firstName.charAt(0)}
                      </div>
                    )}
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-[12px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                      {a.firstName} {a.lastName}
                    </div>
                  </Link>
                ))}
                {attendees.length > 12 && (
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-800/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs text-white font-black shadow-md z-10">
                    +{attendees.length - 12}
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-2xl md:text-3xl font-black text-[#000000] tracking-tight" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>
                  הכוכבים שאישרו הגעה
                </h4>
                <p className="text-sm md:text-base font-bold text-[#000000] uppercase tracking-widest" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>
                  {attendees.length} גולשים כבר בפנים. מה איתך?
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowAttendees(true)} 
              className="px-10 py-4 bg-[var(--surfer-yellow)] text-black rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all relative z-10"
            >
              צפה ברשימה המלאה
            </button>
          </div>
        </section>
      </div>

      <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-[var(--surfer-yellow)]/20 text-[#FFD700] rounded-xl border border-white/20 shadow-lg shadow-[var(--surfer-yellow)]/10">
            <Waves size={20} />
          </div>
          <h3 className="text-2xl font-black text-[#000000] tracking-tight" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>מצב הים – עכשיו ושיאי השנה</h3>
        </div>
        <CoastalDashboard />
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DailySurfRecommendation 
            member={currentUser} 
            currentWaveHeight={1.2} 
            onSaveRecommendation={async (vol, length) => {
              if (currentUser) {
                await updateMember({
                  ...currentUser,
                  recommendedBoardVolume: vol,
                  recommendedBoardLength: length
                });
              }
            }}
          />
          <WaterTempCard 
            lastUpdated={Date.now() - 300000} 
          />
        </div>
      </section>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="home-glass-card p-12 relative min-h-[400px]">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-[var(--surfer-yellow)]/20 rounded-xl border border-white/20 shadow-sm">
                <Quote className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={24} />
              </div>
              <h3 className="text-2xl font-black text-[#000000]" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>חוכמת הליין-אפ</h3>
           </div>
           {randomQuotes.map((item, idx) => (
             <div key={idx} className="p-10 bg-white/10 backdrop-blur-[15px] border border-white/20 rounded-2xl transition-all animate-in fade-in shadow-lg shadow-black/5">
               <p className="text-2xl font-black text-[#000000] leading-tight italic" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>"{item.text}"</p>
               <p className="text-lg font-bold text-[#000000]/60 italic mt-6" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>— {item.author}</p>
             </div>
           ))}
        </section>

        <section className="home-glass-card p-12 relative min-h-[400px]">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-[var(--surfer-cyan)]/20 rounded-xl border border-white/20 shadow-sm">
                <BookOpen className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={24} />
              </div>
              <h3 className="text-2xl font-black text-[#000000]" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>מילון מונחים</h3>
           </div>
           {randomGlossary.map((item, idx) => (
             <div key={idx} className="p-10 bg-white/10 backdrop-blur-[15px] border border-white/20 rounded-2xl transition-all animate-in fade-in shadow-lg shadow-black/5">
               <h4 className="text-4xl font-black text-[#000000] mb-4" dir="ltr" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>{item.term}</h4>
               <p className="text-xl font-bold text-[#000000]/70 italic border-r-4 border-white/30 pr-6" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>{item.definition}</p>
             </div>
           ))}
        </section>
      </div>

      {showAttendees && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowAttendees(false)}>
           <div className="bg-white/10 backdrop-blur-[15px] border border-white/20 shadow-2xl shadow-black/20 rounded-2xl w-full max-w-lg p-10 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black mb-8 glass-text-primary">נבחרת הסשן</h3>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {attendees.map(a => (
                  <div key={a.id} className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-[15px] border border-white/10 rounded-xl shadow-md shadow-black/5 feathered-avatar-hover">
                    {a.avatar ? (
                      <img src={a.avatar} className="w-12 h-12 rounded-xl border border-white/20 object-cover feathered-avatar" alt="" loading="lazy" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-400">
                        <UserCircle size={24} />
                      </div>
                    )}
                    <div>
                      <p className="font-black glass-text-primary">{a.firstName} {a.lastName}</p>
                      <p className="text-[12px] font-black glass-text-secondary uppercase tracking-widest">{a.role === 'Admin' ? 'רכז' : 'חבר'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAttendees(false)} className="w-full mt-8 py-4 bg-[var(--surfer-cyan)] text-black rounded-2xl shadow-lg font-black text-lg transition-all active:scale-95 hover:bg-[var(--surfer-teal)]">סגור</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
// --- APPENDED CODE: V2 ---
export const DashboardPageV2 = DashboardPage;
