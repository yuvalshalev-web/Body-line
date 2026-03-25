
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
  UserCircle,
  Hammer,
  ChevronRight,
  MessageSquareQuote
} from 'lucide-react';
import { CoastalDashboard } from '../components/CoastalDashboard';
import { DailySurfRecommendation } from '../components/DailySurfRecommendation';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getNextSessionDate } from '../services/rolloverService';
import { getBodyLineStats } from '../utils/bodyLineStats';
import { SURF_QUOTES } from '../data/surfQuotes';
import { SURF_DICTIONARY } from '../data/surfDictionary';
import { motion, AnimatePresence } from 'motion/react';
import { getForecastAnalysis } from '../services/geminiService';
import Markdown from 'react-markdown';

import { useRandomHeader } from '../hooks/useRandomHeader';
import staticHeroImage from '../assets/headers/header_1.jpeg';

const SurfboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2c-2.5 4-3 9-2 14 1 5 2 6 2 6s1-1 2-6c1-5 .5-10-2-14Z" />
    <path d="M12 11v3" />
  </svg>
);

const HomePage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser } = useAuth();
  const { 
    members, galleryItems, events, attendeeIds, toggleSessionAttendance, siteAssets, glossary, quotes, news, activeSessionDate, siteConfig, updateMember, coastalWeather, seaStats
  } = useData();

  const [heroImageError, setHeroImageError] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [randomGlossary, setRandomGlossary] = useState<any[]>([]);
  const [randomQuotes, setRandomQuotes] = useState<any[]>([]);
  const [randomPost, setRandomPost] = useState<any>(null);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [isRefreshingGlossary, setIsRefreshingGlossary] = useState(false);
  const [isRefreshingPost, setIsRefreshingPost] = useState(false);

  const [isAnalyzingForecast, setIsAnalyzingForecast] = useState(false);
  const [forecastAnalysis, setForecastAnalysis] = useState<string | null>(null);

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

  const handleForecastAnalysis = async () => {
    if (!coastalWeather && !seaStats) return;
    setIsAnalyzingForecast(true);
    setForecastAnalysis(null);
    try {
      const result = await getForecastAnalysis({
        waveHeight: coastalWeather?.waveHeight || 0.5,
        waterTemp: coastalWeather?.waterTemp,
        windSpeed: coastalWeather?.windSpeed,
        windDir: coastalWeather?.windDir,
        swellDir: seaStats?.swellDir,
        period: seaStats?.period
      });
      setForecastAnalysis(result);
    } catch (error) {
      console.error('Forecast analysis failed:', error);
    } finally {
      setIsAnalyzingForecast(false);
    }
  };

  const refreshPost = useCallback(() => {
    if (newsRef.current.length === 0) return;
    setIsRefreshingPost(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * newsRef.current.length);
      setRandomPost(newsRef.current[randomIndex]);
      setIsRefreshingPost(false);
    }, 400);
  }, []);

  const lastQuoteId = useRef<string | null>(null);
  const lastGlossaryId = useRef<string | null>(null);

  const refreshGlossary = useCallback(() => {
    setIsRefreshingGlossary(true);
    const source = glossaryRef.current.length > 0 ? glossaryRef.current : SURF_DICTIONARY;
    if (source.length === 0) {
      setIsRefreshingGlossary(false);
      return;
    }
    
    let nextItem;
    if (source.length > 1) {
      const filtered = source.filter(item => (item.id || item.term) !== lastGlossaryId.current);
      nextItem = filtered[Math.floor(Math.random() * filtered.length)];
    } else {
      nextItem = source[0];
    }
    
    if (nextItem) {
      lastGlossaryId.current = nextItem.id || nextItem.term;
      setRandomGlossary([nextItem]);
    }
    setTimeout(() => setIsRefreshingGlossary(false), 400);
  }, []);

  const refreshQuote = useCallback(() => {
    setIsRefreshingQuotes(true);
    const source = quotesRef.current.length > 0 ? quotesRef.current : SURF_QUOTES;
    if (source.length === 0) {
      setIsRefreshingQuotes(false);
      return;
    }

    let nextItem;
    if (source.length > 1) {
      const filtered = source.filter(item => {
        const id = typeof item === 'string' ? item : (item.id || item.text);
        return id !== lastQuoteId.current;
      });
      const pool = filtered.length > 0 ? filtered : source;
      nextItem = pool[Math.floor(Math.random() * pool.length)];
    } else {
      nextItem = source[0];
    }

    if (nextItem) {
      lastQuoteId.current = typeof nextItem === 'string' ? nextItem : (nextItem.id || nextItem.text);
      setRandomQuotes([nextItem]);
    }
    setTimeout(() => setIsRefreshingQuotes(false), 400);
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

  const heroBg = staticHeroImage;

  return (
    <div className="space-y-16 max-w-6xl mx-auto pb-20 px-[var(--spacing-md)] md:px-0" dir="rtl">
      {/* Hero & Attendees Group */}
      <div className="space-y-20 md:space-y-6">
        <section className="relative w-full min-h-[650px] md:min-h-[900px] lg:min-h-[1200px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className={`absolute inset-0 rounded-3xl overflow-hidden ${heroImageError ? 'luxury-bg' : ''}`}>
            {!heroImageError && (
              <img 
                key={heroBg}
                src={heroBg} 
                className="w-full h-full object-cover scale-[1.25] md:scale-[1.15] origin-top" 
                style={{ objectPosition: 'center 0%' }}
                alt="Hero"
                loading="lazy"
                onError={(e) => {
                  console.error('Hero image failed to load, falling back to Elite Alabaster background:', heroBg);
                  setHeroImageError(true);
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="relative z-10 min-h-[650px] md:min-h-[900px] lg:min-h-[1200px] flex flex-col items-center justify-between p-6 md:p-12 text-center">
             {/* Top Section: Quote */}
             <div className="w-full pt-4 md:pt-8 flex flex-col items-center">
               <p className="text-white font-semibold italic text-sm md:text-2xl max-w-2xl mx-auto tracking-[0.08em] leading-relaxed mb-6 md:mb-10 drop-shadow-lg">
                 "A day will come that is like no other... and nothing that happens after will ever be the same."
               </p>
             </div>
             
             {/* Lower Third Section: Title & Countdown */}
             <div className="w-full flex flex-col items-center pb-12 md:pb-20 relative z-20 mt-auto">
               <h1 className="text-[var(--surfer-yellow)] big-thursday-title" data-text="יום חמישי הגדול">יום חמישי הגדול</h1>
               
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
                       <span className="text-2xl md:text-4xl font-black text-[var(--surfer-yellow)] font-heebo">{item.value}</span>
                       <span className="text-[9px] md:text-[12px] uppercase font-bold tracking-tighter opacity-80 text-white">{item.label}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
             
             {/* Hotspot */}
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
        </section>

        {/* Confirmed Members Bar - Positioned below Hero, above AstroDecks */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <div className="home-glass-card p-6 md:p-10 flex flex-col items-center justify-center gap-8 overflow-hidden relative">
            {/* Decorative background glows removed per user request */}

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
                <h4 className="text-2xl md:text-3xl font-black text-[#000000] tracking-tight font-yehuda">
                  הכוכבים שאישרו הגעה
                </h4>
                <p className="text-sm md:text-base font-bold text-[#000000] uppercase tracking-widest font-yehuda">
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

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <DailySurfRecommendation 
            member={currentUser}
            currentWaveHeight={coastalWeather?.waveHeight || 0.5}
            waterTemp={coastalWeather?.waterTemp}
            onSaveRecommendation={async (vol, len) => {
              if (currentUser) {
                await updateMember({ ...currentUser, currentBoardVolume: vol, currentBoardLength: len });
              }
            }}
          />
        </section>
      </div>

      <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--surfer-yellow)]/20 text-[#FFD700] rounded-xl border border-white/20 shadow-lg shadow-[var(--surfer-yellow)]/10">
              <Waves size={20} />
            </div>
            <h3 className="text-2xl font-black text-[#000000] tracking-tight font-yehuda">מצב הים – עכשיו ושיאי השנה</h3>
          </div>

          <button
            onClick={handleForecastAnalysis}
            disabled={isAnalyzingForecast}
            className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl font-black text-sm text-[var(--surfer-deep-teal)] hover:bg-white/20 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isAnalyzingForecast ? <Loader2 className="animate-spin" size={18} /> : <MessageSquareQuote size={18} />}
            <span>ניתוח מומחה AI (Gemini)</span>
          </button>
        </div>

        <AnimatePresence>
          {forecastAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-slate-900/90 text-slate-100 p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 text-white/10">
                <Sparkles size={48} />
              </div>
              <div className="prose prose-invert prose-slate max-w-none 
                prose-p:text-slate-200 prose-p:leading-relaxed prose-p:font-bold
                prose-strong:text-[var(--surfer-cyan)] prose-strong:font-black
              ">
                <Markdown>{forecastAnalysis}</Markdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CoastalDashboard />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="home-glass-card p-12 relative min-h-[400px] flex flex-col">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-[var(--surfer-yellow)]/20 rounded-xl border border-white/20 shadow-sm">
                <Quote className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={24} />
              </div>
              <h3 className="text-2xl font-black text-[#000000] font-yehuda">חוכמת הליין-אפ</h3>
           </div>
           <div className="flex-1 relative">
             <AnimatePresence mode="wait">
               {randomQuotes.map((item) => {
                 const text = typeof item === 'string' ? item : (item.text || '');
                 const author = typeof item === 'string' ? 'אנונימי' : (item.author || 'אנונימי');
                 const key = typeof item === 'string' ? item : (item.id || item.text || Math.random().toString());
                 
                 return (
                   <motion.div 
                     key={key}
                     initial={{ opacity: 0, y: 20, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: -20, scale: 0.95 }}
                     transition={{ duration: 0.5, ease: "easeOut" }}
                     className="p-10 bg-white/10 backdrop-blur-[15px] border border-white/20 rounded-2xl shadow-lg shadow-black/5 h-full flex flex-col justify-center"
                   >
                     <p className="text-2xl font-black text-[#000000] leading-tight italic font-yehuda">"{text}"</p>
                     <p className="text-lg font-bold text-[#000000]/60 italic mt-6 font-yehuda">— {author}</p>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
           </div>
        </section>

        <section className="home-glass-card p-12 relative min-h-[400px] flex flex-col">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-[var(--surfer-cyan)]/20 rounded-xl border border-white/20 shadow-sm">
                <BookOpen className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={24} />
              </div>
              <h3 className="text-2xl font-black text-[#000000] font-yehuda">מילון מונחים</h3>
           </div>
           <div className="flex-1 relative">
             <AnimatePresence mode="wait">
               {randomGlossary.map((item) => {
                 const term = item.term || '';
                 const definition = item.definition || '';
                 const key = item.id || item.term || Math.random().toString();
                 
                 return (
                   <motion.div 
                     key={key}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.5, ease: "easeOut" }}
                     className="p-10 bg-white/10 backdrop-blur-[15px] border border-white/20 rounded-2xl shadow-lg shadow-black/5 h-full flex flex-col justify-center"
                   >
                     <h4 className="text-4xl font-black text-[#000000] mb-4 font-yehuda" dir="ltr">{term}</h4>
                     <p className="text-xl font-bold text-[#000000]/70 italic border-r-4 border-white/30 pr-6 font-yehuda">{definition}</p>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
           </div>
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

export default HomePage;
// --- APPENDED CODE: V2 ---
export const HomePageV2 = HomePage;
