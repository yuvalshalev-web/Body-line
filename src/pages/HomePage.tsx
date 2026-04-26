
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
  MessageSquareQuote,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { CoastalDashboard } from '../components/CoastalDashboard';
import { WeeklyForecast } from '../components/WeeklyForecast';
import { SurfDashboard } from '../components/SurfDashboard';
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

const SurfboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2c-2.5 4-3 9-2 14 1 5 2 6 2 6s1-1 2-6c1-5 .5-10-2-14Z" />
    <path d="M12 11v3" />
  </svg>
);

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    members, galleryItems, events, attendeeIds, toggleSessionAttendance, siteAssets, glossary, quotes, news, activeSessionDate, siteConfig, updateMember, coastalWeather, seaStats,
    connectionError, retryConnection, isLoading: isDataLoading
  } = useData();

  const [heroImageError, setHeroImageError] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [useBentoDashboard, setUseBentoDashboard] = useState(true);
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

  const heroBg = siteAssets?.staticHeroImage || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1920&auto=format&fit=crop';

  useEffect(() => {
    setHeroImageError(false);
  }, [heroBg]);

  return (
    <div className="space-y-16 max-w-6xl mx-auto pb-20 px-[var(--spacing-md)] md:px-0 luxury-bg min-h-screen" dir="rtl">
      {/* Connection Status Banner */}
      <AnimatePresence>
        {connectionError && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <WifiOff size={20} className="animate-pulse" />
                <div>
                  <p className="font-bold text-sm">בעיית חיבור למסד הנתונים</p>
                  <p className="text-xs opacity-80">האפליקציה פועלת כרגע במצב לא מקוון. נתונים עשויים להיות חסרים.</p>
                </div>
              </div>
              <button 
                onClick={retryConnection}
                disabled={isDataLoading}
                className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDataLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {isDataLoading ? 'מתחבר...' : 'נסה שוב'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero & Attendees Group */}
      <div className="space-y-20 md:space-y-6">
        <section className="relative w-full min-h-[650px] md:min-h-[900px] lg:min-h-[1200px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className={`absolute inset-0 rounded-3xl overflow-hidden ${heroImageError ? 'luxury-bg' : ''}`}>
            {!heroImageError && heroBg && (
              <img 
                key={heroBg}
                src={heroBg} 
                className="w-full h-full object-cover scale-[1.25] md:scale-[1.15] origin-top" 
                style={{ objectPosition: 'center 0%' }}
                alt="Hero"
                loading="lazy"
                referrerPolicy="no-referrer"
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
               <p className="text-[#121212] font-semibold italic text-sm md:text-2xl max-w-2xl mx-auto tracking-[0.08em] leading-relaxed mb-6 md:mb-10 drop-shadow-lg">
                 "A day will come that is like no other... and nothing that happens after will ever be the same."
               </p>
             </div>
             
             {/* Lower Third Section: Title & Countdown */}
             <div className="w-full flex flex-col items-center pb-12 md:pb-20 relative z-20 mt-auto">
               <h1 className="text-[var(--surfer-yellow)] big-thursday-title" data-text="יום חמישי הגדול">יום חמישי הגדול</h1>
               
               <div className="mt-8 md:mt-12 space-y-4 flex flex-col items-center">
                 <p className="text-base md:text-xl font-bold text-[#121212] drop-shadow-md">נכנסים למים בעוד...</p>
                 <div className="flex gap-2 md:gap-4 text-[#121212] font-black" dir="ltr">
                   {[
                     { label: 'ימים', value: countdown.days },
                     { label: 'שעות', value: countdown.hours },
                     { label: 'דקות', value: countdown.minutes },
                     { label: 'שניות', value: countdown.seconds }
                   ].map((item, i) => (
                     <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-[15px] border border-white/20 px-3 py-2 md:px-5 md:py-3 rounded-2xl shadow-lg min-w-[60px] md:min-w-[80px]">
                       <span className="text-2xl md:text-4xl font-black text-[var(--surfer-yellow)] font-heebo">{item.value}</span>
                       <span className="text-[9px] md:text-[12px] uppercase font-bold tracking-tighter opacity-80 text-[#121212]">{item.label}</span>
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
          <div className="luxury-card p-10 flex flex-col items-center justify-center gap-8 overflow-hidden relative">
            <div className="grain-overlay" />
            <div className="premium-sweep-fx" />

            <div className="flex flex-col items-center gap-8 relative z-10 w-full">
              {/* Centered Avatars */}
              <div className="flex justify-center -space-x-4 md:-space-x-6 space-x-reverse">
                {attendees.slice(0, 12).map(a => (
                  <Link to={`/directory?id=${a.id}`} key={a.id} className="relative group feathered-avatar-hover flex-shrink-0">
                    {a.avatar ? (
                      <img 
                        src={a.avatar} 
                        className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 border-white/40 shadow-xl object-cover transition-all duration-500 group-hover:scale-125 group-hover:z-20 group-hover:-translate-y-4 group-hover:rotate-6 feathered-avatar" 
                        alt="" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#002b44] to-[#00426a] border-2 border-white/40 flex items-center justify-center text-sm text-white font-black shadow-xl transition-all duration-500 group-hover:scale-125 group-hover:z-20 group-hover:-translate-y-4 group-hover:rotate-6">
                        {a.firstName.charAt(0)}
                      </div>
                    )}
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-[#002b44]/90 backdrop-blur-md text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-30 shadow-xl border border-white/20">
                      {a.firstName} {a.lastName}
                    </div>
                  </Link>
                ))}
                {attendees.length > 12 && (
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#002b44]/80 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-sm text-white font-black shadow-xl z-10">
                    +{attendees.length - 12}
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-3">
                <h4 className="text-3xl md:text-5xl font-black text-[#002b44] tracking-tighter font-yehuda">
                  הכוכבים שאישרו הגעה
                </h4>
                <p className="text-sm md:text-lg font-black text-[#007085] uppercase tracking-[0.3em] font-yehuda opacity-80">
                  {attendees.length} גולשים כבר בפנים. מה איתך?
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowAttendees(true)} 
              className="px-12 py-5 bg-[#007085] text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all relative z-10 border border-white/20"
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseBentoDashboard(!useBentoDashboard)}
              className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl text-xs font-bold text-slate-600 hover:bg-white/80 transition-colors border border-white/40 shadow-sm"
              title="החלף לעיצוב הקלאסי"
            >
              <RefreshCw size={14} className={useBentoDashboard ? "" : "animate-spin-once"} />
              <span>{useBentoDashboard ? "חזור לתצוגה קלאסית" : "עבור ל-Bento UI"}</span>
            </button>
            <button
              onClick={handleForecastAnalysis}
              disabled={isAnalyzingForecast}
              className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl font-black text-sm text-[var(--surfer-deep-teal)] hover:bg-white/20 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isAnalyzingForecast ? <Loader2 className="animate-spin" size={18} /> : <MessageSquareQuote size={18} />}
              <span>ניתוח מומחה AI (Gemini)</span>
            </button>
          </div>
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

        <AnimatePresence mode="wait">
          <motion.div
            key={useBentoDashboard ? 'bento' : 'classic'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {useBentoDashboard ? (
              <SurfDashboard />
            ) : (
              <>
                <CoastalDashboard />
                <WeeklyForecast />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="luxury-card p-12 relative min-h-[400px] flex flex-col overflow-hidden">
           <div className="grain-overlay opacity-[0.03]" />
           <div className="relative z-10">
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
           </div>
        </section>

        <section className="luxury-card p-12 relative min-h-[400px] flex flex-col overflow-hidden">
           <div className="grain-overlay opacity-[0.03]" />
           <div className="relative z-10">
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
           </div>
        </section>
      </div>

      {showAttendees && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowAttendees(false)}>
           <div className="relative bg-gradient-to-br from-[#FCFCFC] via-[#FFFFFF] to-[#F0F7F9] border border-white/80 shadow-[0_40px_80px_-20px_rgba(0,43,68,0.2)] rounded-[2rem] w-full max-w-lg p-8 sm:p-10 animate-in zoom-in-95 overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Micro-grain texture */}
              <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-3xl font-black text-[#002b44] tracking-tight font-yehuda">נבחרת הסשן</h3>
                  <div className="px-4 py-1.5 bg-[#007085]/10 text-[#007085] rounded-full text-sm font-black tracking-widest">{attendees.length} גולשים</div>
                </div>
                <div className="space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
                  {attendees.map(a => (
                    <div key={a.id} className="flex items-center gap-5 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,43,68,0.12)] border border-white hover:shadow-[0_24px_50px_-16px_rgba(0,43,68,0.2)] hover:-translate-y-1 transition-all duration-300">
                      {a.avatar ? (
                        <img src={a.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-md border border-slate-100/50 flex-shrink-0" alt="" loading="lazy" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-white shadow-inner flex items-center justify-center text-slate-400 flex-shrink-0">
                          <UserCircle size={28} strokeWidth={1.5} />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-[#002b44] text-lg">{a.firstName} {a.lastName}</p>
                        <p className="text-[10px] font-black text-[#007085] uppercase tracking-[0.2em] opacity-80">{a.role === 'Admin' ? 'רכז' : 'חבר'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowAttendees(false)} className="w-full mt-6 py-4 bg-[#002b44] text-white rounded-2xl shadow-[0_12px_24px_-8px_rgba(0,43,68,0.4)] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-[#003b5c] hover:shadow-[0_16px_32px_-8px_rgba(0,43,68,0.5)]">סגור</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
// --- APPENDED CODE: V2 ---
export const HomePageV2 = HomePage;
