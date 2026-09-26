
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Image as ImageIcon, 
  Calendar, 
  Waves,
  Loader2,
  Fingerprint,
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
  AlertCircle,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  X,
  HeartHandshake,
  UserCheck,
  User,
  ShieldCheck,
  GraduationCap,
  Building2
} from 'lucide-react';
import { SurfDashboard, surfSpots } from '../components/SurfDashboard';
import { DailySurfRecommendation } from '../components/DailySurfRecommendation';
import { OnlineUsersCounter } from '../components/OnlineUsersCounter';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getNextSessionDate } from '../services/rolloverService';
import { isAdminUser, isAppShaperUser } from '../constants';
import { getBodyLineStats } from '../utils/bodyLineStats';
import { SURF_QUOTES } from '../data/surfQuotes';
import { SURF_DICTIONARY } from '../data/surfDictionary';
import { motion, AnimatePresence } from 'motion/react';
import { getForecastAnalysis } from '../services/geminiService';
import Markdown from 'react-markdown';
import { BiometricFingerprint } from '../components/BiometricFingerprint';

const SurfboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2c-2.5 4-3 9-2 14 1 5 2 6 2 6s1-1 2-6c1-5 .5-10-2-14Z" />
    <path d="M12 11v3" />
  </svg>
);

export const STATION_NAMES: Record<string, string> = {
  "178": "חוף הילטון, תל אביב",
  "26": "חוף בת גלים, חיפה",
  "124": "חוף הקשתות, אשדוד",
  "208": "חוף בר כוכבא, אשקלון",
  "343": "חוף שבי ציון",
  "46": "חוף המערבי, חדרה"
};

export const getScheduledGroupForSession = (sessionDateStr: string, startDateStr?: string): 'קבוצה א\'' | 'קבוצה ב\'' => {
  if (!sessionDateStr) return 'קבוצה א\'';
  const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date(sessionDateStr).getFullYear(), 8, 1); // default to Sep 1st
  const sessionDate = new Date(sessionDateStr);
  
  const diffMs = sessionDate.getTime() - startDate.getTime();
  if (diffMs < 0) return 'קבוצה א\'';
  
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.floor(diffMs / msPerWeek);
  
  return diffWeeks % 2 === 0 ? 'קבוצה א\'' : 'קבוצה ב\'';
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    members, galleryItems, events, attendeeIds, toggleSessionAttendance, siteAssets, glossary, quotes, news, activeSessionDate, siteConfig, updateMember, coastalWeather, seaStats,
    connectionError, retryConnection, isLoading: isDataLoading, selectedStationId, setSelectedStationId, yearConfig
  } = useData();

  const [heroImageError, setHeroImageError] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<any | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [randomGlossary, setRandomGlossary] = useState<any[]>([]);
  const [randomQuotes, setRandomQuotes] = useState<any[]>([]);
  const [randomPost, setRandomPost] = useState<any>(null);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [isRefreshingGlossary, setIsRefreshingGlossary] = useState(false);
  const [isRefreshingPost, setIsRefreshingPost] = useState(false);

  const [isAnalyzingForecast, setIsAnalyzingForecast] = useState(false);
  const [forecastAnalysis, setForecastAnalysis] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState('herzliya-marina');

  const newsRef = useRef(news);
  useEffect(() => { newsRef.current = news; }, [news]);
  const glossaryRef = useRef(glossary);
  useEffect(() => { glossaryRef.current = glossary; }, [glossary]);
  const quotesRef = useRef(quotes);
  useEffect(() => { quotesRef.current = quotes; }, [quotes]);

  const activeMembers = useMemo(() => getBodyLineStats(members).activeMembers, [members]);
  const isCurrentUserAppShaper = isAppShaperUser(currentUser);
  const attendees = useMemo(() => activeMembers.filter(m => attendeeIds.includes(m.id) && !isAppShaperUser(m)).sort((a, b) => {
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

  const [attendeesFilter, setAttendeesFilter] = useState<'all' | 'pairs' | 'solo' | 'admins' | 'instructors' | 'staff'>('all');

  const adminAttendees = useMemo(() => attendees.filter(a => a.role === 'Admin'), [attendees]);
  const instructorAttendees = useMemo(() => attendees.filter(a => a.role === 'Instructor'), [attendees]);
  const staffAttendees = useMemo(() => attendees.filter(a => a.role === 'Staff'), [attendees]);

  const pairStats = useMemo(() => {
    const attendeeIdSet = new Set(attendeeIds);
    const memberMap = new Map<string, any>();
    members.forEach(m => memberMap.set(m.id, m));

    const confirmedPairs = new Map<string, { memberA: any; memberB: any }>();
    const duoMemberIds = new Set<string>();
    const soloWithPartner: { member: any; partner: any }[] = [];
    const soloWithoutPartner: any[] = [];

    attendees.forEach(m => {
      // מדריך ורכז תמיד באים בתפקיד ללא בני זוג - נספרים כרכזים ומדריכים, אך לא כמי שמגיע לבד
      if (m.role === 'Admin' || m.role === 'Instructor' || m.role === 'Staff') {
        return;
      }

      let partner: any = null;
      if (m.partnerId && memberMap.has(m.partnerId)) {
        partner = memberMap.get(m.partnerId);
      } else {
        const found = members.find(other => other.partnerId === m.id);
        if (found) partner = found;
      }

      if (partner && (partner.role === 'Admin' || partner.role === 'Instructor' || partner.role === 'Staff' || isAppShaperUser(partner))) {
        partner = null;
      }

      if (partner) {
        if (attendeeIdSet.has(partner.id)) {
          duoMemberIds.add(m.id);
          duoMemberIds.add(partner.id);
          const pairKey = [m.id, partner.id].sort().join('_');
          if (!confirmedPairs.has(pairKey)) {
            confirmedPairs.set(pairKey, {
              memberA: m.id < partner.id ? m : partner,
              memberB: m.id < partner.id ? partner : m
            });
          }
        } else {
          soloWithPartner.push({ member: m, partner });
        }
      } else {
        soloWithoutPartner.push(m);
      }
    });

    const fullPairsCount = confirmedPairs.size;
    const duoSurfersCount = duoMemberIds.size;
    const soloWithPartnerCount = soloWithPartner.length;
    const soloWithoutPartnerCount = soloWithoutPartner.length;
    const totalSoloCount = soloWithPartnerCount + soloWithoutPartnerCount;

    return {
      fullPairsCount,
      duoSurfersCount,
      soloWithPartnerCount,
      soloWithoutPartnerCount,
      totalSoloCount,
      duoMemberIds,
      confirmedPairsList: Array.from(confirmedPairs.values()),
      soloWithPartner,
      soloWithoutPartner
    };
  }, [attendees, attendeeIds, members]);

  const getAttendeePairInfo = useCallback((m: any) => {
    if (m.role === 'Admin') {
      return {
        status: 'admin' as const,
        partner: null,
        label: 'רכז סשן',
        isComingTogether: false
      };
    }
    if (m.role === 'Instructor') {
      return {
        status: 'instructor' as const,
        partner: null,
        label: 'מדריך סשן',
        isComingTogether: false
      };
    }
    if (m.role === 'Staff') {
      return {
        status: 'staff' as const,
        partner: null,
        label: 'צוות עמותה',
        isComingTogether: false
      };
    }

    const attendeeIdSet = new Set(attendeeIds);
    let partner: any = null;
    if (m.partnerId) {
      partner = members.find(p => p.id === m.partnerId) || null;
    } else {
      partner = members.find(p => p.partnerId === m.id) || null;
    }

    if (partner && (partner.role === 'Admin' || partner.role === 'Instructor' || partner.role === 'Staff' || isAppShaperUser(partner))) {
      partner = null;
    }

    if (!partner) {
      return {
        status: 'independent' as const,
        partner: null,
        label: 'גולש/ת עצמאי/ת',
        isComingTogether: false
      };
    }

    const isComing = attendeeIdSet.has(partner.id);
    if (isComing) {
      return {
        status: 'pair_both' as const,
        partner,
        label: `חבל זוג עם ${partner.firstName} ${partner.lastName} (מגיעים יחד)`,
        isComingTogether: true
      };
    }

    return {
      status: 'pair_solo' as const,
      partner,
      label: `חבל זוג של ${partner.firstName} ${partner.lastName} (לא אישר/ה)`,
      isComingTogether: false
    };
  }, [attendeeIds, members]);

  const displayedAttendees = useMemo(() => {
    if (attendeesFilter === 'pairs') {
      return attendees.filter(a => pairStats.duoMemberIds.has(a.id));
    }
    if (attendeesFilter === 'solo') {
      return attendees.filter(a => a.role !== 'Admin' && a.role !== 'Instructor' && a.role !== 'Staff' && !pairStats.duoMemberIds.has(a.id));
    }
    if (attendeesFilter === 'admins') {
      return attendees.filter(a => a.role === 'Admin');
    }
    if (attendeesFilter === 'instructors') {
      return attendees.filter(a => a.role === 'Instructor');
    }
    if (attendeesFilter === 'staff') {
      return attendees.filter(a => a.role === 'Staff');
    }
    return attendees;
  }, [attendees, attendeesFilter, pairStats.duoMemberIds]);

  const scheduledGroup = useMemo(() => {
    if (yearConfig?.activityMode !== 'קבוצתית') return null;
    return getScheduledGroupForSession(activeSessionDate, yearConfig?.startDate);
  }, [activeSessionDate, yearConfig]);

  const userGroup = currentUser?.assignedGroup || currentUser?.group;

  const isUserInScheduledGroup = useMemo(() => {
    if (!userGroup || !scheduledGroup) return false;
    if (userGroup === scheduledGroup) return true;
    const normUser = String(userGroup).replace(/['"]/g, '').trim();
    const normSched = String(scheduledGroup).replace(/['"]/g, '').trim();
    if (normUser === normSched) return true;
    if (normUser.endsWith('א') && normSched.endsWith('א')) return true;
    if (normUser.endsWith('ב') && normSched.endsWith('ב')) return true;
    return false;
  }, [userGroup, scheduledGroup]);

  const handleForecastAnalysis = async () => {
    if (!coastalWeather && !seaStats) return;
    setIsAnalyzingForecast(true);
    setForecastAnalysis(null);
    const activeSpot = surfSpots.find(s => s.id === selectedSpotId) || surfSpots[7];
    try {
      const result = await getForecastAnalysis({
        waveHeight: coastalWeather?.waveHeight ?? 0.5,
        waterTemp: coastalWeather?.waterTemp,
        windSpeed: coastalWeather?.windSpeed,
        windDir: coastalWeather?.windDir,
        swellDir: seaStats?.swellDir,
        period: seaStats?.period,
        user: currentUser,
        beachName: activeSpot?.name || "הרצליה"
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
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (isCurrentUserAppShaper) {
      alert("משתמש בסטטוס אפ-שייפר הינו מנהל מערכת וירטואלי ואינו יכול להשתתף בסשנים");
      return;
    }
    setIsProcessing(true);
    try { 
      await toggleSessionAttendance(currentUser.id); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const activeEventsCount = useMemo(() => {
    const now = new Date();
    return events.filter(e => {
      if (e.isArchived) return false;
      const hasAccess = (() => {
        if (isAdminUser(currentUser)) return true;
        if (e.type === 'COMMUNITY') return true;
        if (e.type === 'MEMBER' && currentUser?.role === 'Member') return true;
        if (e.type === 'VOLUNTEER' && currentUser?.role === 'Volunteer') return true;
        return false;
      })();
      if (!hasAccess) return false;
      
      const eventDate = new Date(`${e.date}T${e.time || '00:00'}`);
      return eventDate >= now;
    }).length;
  }, [events, currentUser]);

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
                  console.warn('Hero image failed to load, falling back to Elite Alabaster background:', heroBg);
                  setHeroImageError(true);
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Surfer Action Hotspot - The almost transparent ring with pulse effect */}
          <div className="surfer-hotspot-container pointer-events-none">
            <button
              type="button"
              onClick={handleToggle}
              disabled={isProcessing}
              className={`surfer-hotspot pointer-events-auto ${isUserAttending ? 'attending' : 'not-attending'}`}
              aria-label={isUserAttending ? 'ביטול אישור הגעה' : 'אישור הגעה לסשן'}
              title={isUserAttending ? 'לחץ על הגולש לביטול הגעה' : 'לחץ על הגולש לאישור הגעה'}
              style={{
                color: isUserAttending ? '#38BDF8' : 'rgba(255, 255, 255, 0.9)'
              }}
            >
              {/* Almost transparent concentric pulsing rings */}
              <div className="pulse-halo-primary" />
              <div className="pulse-halo-secondary" />

              {/* Biometric fingerprint texture for instant touch affordance */}
              {!isProcessing ? (
                <BiometricFingerprint 
                  className="fingerprint-texture"
                  strokeWidth={2.5}
                />
              ) : (
                <Loader2 className="animate-spin text-white drop-shadow-lg" size={36} />
              )}
            </button>
            <motion.span 
              className="secondary-label w-max mt-6 pointer-events-auto font-heebo font-black tracking-wide font-bold"
              style={{
                color: isUserAttending ? '#38BDF8' : '#A2FF00',
                fontWeight: 900
              }}
              animate={{ opacity: [1, 0.45, 1], scale: [1, 1.02, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              {isUserAttending ? (
                <strong className="font-black font-heebo text-[22px] md:text-[24px]">לחץ על הגולש לביטול הגעה</strong>
              ) : (
                <span className="font-black font-heebo text-[22px] md:text-[24px]">לחץ על הגולש לאישור הגעה</span>
              )}
            </motion.span>
          </div>

          <div className="relative z-10 min-h-[650px] md:min-h-[900px] lg:min-h-[1200px] flex flex-col items-center justify-between p-6 md:p-12 text-center pointer-events-none">
             {/* Top Section: Quote & Event Title (Positioned above the RSVP ring) */}
             <div className="w-full pt-4 md:pt-8 flex flex-col items-center pointer-events-auto">
               <p className="text-white/95 font-semibold italic text-sm md:text-2xl max-w-2xl mx-auto tracking-[0.08em] leading-relaxed mb-4 md:mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                 "A day will come that is like no other... and nothing that happens after will ever be the same."
               </p>
               <h1 className="text-[var(--surfer-yellow)] big-thursday-title" data-text="יום חמישי הגדול">יום חמישי הגדול</h1>
             </div>
             
             {/* Lower Third Section: Countdown & Group Rotation */}
             <div className="w-full flex flex-col items-center pb-12 md:pb-20 relative z-20 mt-auto pointer-events-auto">
               {/* Countdown */}
               <div className="space-y-4 md:space-y-6 flex flex-col items-center">
                 <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] tracking-wide">נכנסים שוב למים בעוד...</p>
                 <div className="flex gap-2.5 sm:gap-3 md:gap-5 font-black" dir="ltr">
                   {[
                     { label: 'ימים', value: countdown.days },
                     { label: 'שעות', value: countdown.hours },
                     { label: 'דקות', value: countdown.minutes },
                     { label: 'שניות', value: countdown.seconds }
                   ].map((item, i) => (
                     <div key={i} className="flex flex-col items-center bg-slate-900/50 backdrop-blur-xl border border-white/25 px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.4)] min-w-[65px] sm:min-w-[72px] md:min-w-[95px] transition-transform duration-300 hover:scale-105">
                       <span className="text-2xl sm:text-3xl md:text-5xl font-black text-[var(--surfer-yellow)] font-heebo drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{item.value}</span>
                       <span className="text-[10px] sm:text-xs md:text-sm uppercase font-black tracking-tight text-white/95 mt-0.5 md:mt-1 drop-shadow-sm">{item.label}</span>
                     </div>
                   ))}
                 </div>
               </div>

                {/* Group Notice - Positioned cleanly under the timer */}
                {scheduledGroup && (
                  <div className="mt-5 sm:mt-6 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-900/75 backdrop-blur-md border border-white/20 rounded-full text-white/95 text-xs sm:text-sm font-heebo shadow-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00a3c4] animate-pulse shrink-0" />
                      <span>
                        {userGroup ? (
                          isUserInScheduledGroup ? (
                            <>
                              שים לב: הסשן הקרוב מיועד לקבוצה שלך <strong className="font-bold text-[#00a3c4]">({scheduledGroup})</strong>
                            </>
                          ) : (
                            <>
                              שים לב: הסשן הקרוב מיועד לקבוצה השנייה <strong className="font-bold text-[#00a3c4]">({scheduledGroup})</strong>
                            </>
                          )
                        ) : (
                          <>
                            שים לב: הסשן הקרוב מיועד לקבוצה <strong className="font-bold text-[#00a3c4]">({scheduledGroup})</strong>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </section>

        {/* Live Online Users Counter - Between Big Thursday Hero and Confirmed Attendees */}
        <OnlineUsersCounter />

        {/* Confirmed Members Bar - Positioned below Hero, above AstroDecks */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <div className="luxury-card p-10 flex flex-col items-center justify-center gap-8 overflow-hidden relative">
            <div className="grain-overlay" />
            <div className="premium-sweep-fx" />

            <div className="flex flex-col items-center gap-8 relative z-10 w-full">
              {/* Centered Avatars */}
              <div className="flex justify-center -space-x-4 md:-space-x-6 space-x-reverse">
                {attendees.slice(0, 12).map(a => (
                  <div key={a.id} className="relative group flex-shrink-0 cursor-default">
                    {a.avatar ? (
                      <img 
                        src={a.avatar} 
                        className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 border-white/40 shadow-xl object-cover transition-all duration-300 group-hover:scale-110 group-hover:z-20 group-hover:-translate-y-1 feathered-avatar" 
                        alt="" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#002b44] to-[#00426a] border-2 border-white/40 flex items-center justify-center text-sm text-white font-black shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:z-20 group-hover:-translate-y-1">
                        {a.firstName.charAt(0)}
                      </div>
                    )}
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-[#002b44]/90 backdrop-blur-md text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-30 shadow-xl border border-white/20">
                      {a.firstName} {a.lastName}
                    </div>
                  </div>
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
                  {attendees.length === 1 ? 'גולש 1 כבר בפנים. מה איתך?' : `${attendees.length} גולשים כבר בפנים. מה איתך?`}
                </p>
              </div>

              {/* Compact Single Horizontal Row for Attendance Breakdown */}
              <div className="w-full max-w-2xl mx-auto pt-1">
                <div className="grid grid-cols-5 divide-x divide-x-reverse divide-[#002b44]/10 bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 shadow-[0_8px_25px_-6px_rgba(0,43,68,0.08)] p-1 sm:p-2">
                  {/* זוגות */}
                  <button
                    type="button"
                    onClick={() => { setAttendeesFilter('pairs'); setShowAttendees(true); }}
                    className="flex flex-col items-center justify-center py-2 px-0.5 sm:px-1 rounded-xl hover:bg-emerald-500/[0.08] active:scale-95 transition-all text-center group cursor-pointer"
                    title="זוגות ששניהם אישרו הגעה"
                  >
                    <div className="flex items-center gap-0.5 sm:gap-1 text-emerald-700 mb-0.5">
                      <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-black tracking-tight text-emerald-950">זוגות</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-emerald-800 font-yehuda leading-none my-0.5">
                      {pairStats.fullPairsCount}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700/80 leading-tight">
                      {pairStats.duoSurfersCount} גולשים
                    </span>
                  </button>

                  {/* לבד */}
                  <button
                    type="button"
                    onClick={() => { setAttendeesFilter('solo'); setShowAttendees(true); }}
                    className="flex flex-col items-center justify-center py-2 px-0.5 sm:px-1 rounded-xl hover:bg-amber-500/[0.08] active:scale-95 transition-all text-center group cursor-pointer"
                    title="גולשים שמגיעים לבד (ללא רכזים, מדריכים וצוות עמותה)"
                  >
                    <div className="flex items-center gap-0.5 sm:gap-1 text-amber-700 mb-0.5">
                      <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-black tracking-tight text-amber-950">לבד</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-amber-800 font-yehuda leading-none my-0.5">
                      {pairStats.totalSoloCount}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-700/80 leading-tight">
                      סולו
                    </span>
                  </button>

                  {/* רכזים */}
                  <button
                    type="button"
                    onClick={() => { setAttendeesFilter('admins'); setShowAttendees(true); }}
                    className="flex flex-col items-center justify-center py-2 px-0.5 sm:px-1 rounded-xl hover:bg-sky-500/[0.08] active:scale-95 transition-all text-center group cursor-pointer"
                    title="רכזים שאישרו הגעה"
                  >
                    <div className="flex items-center gap-0.5 sm:gap-1 text-sky-700 mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-black tracking-tight text-sky-950">רכזים</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-sky-800 font-yehuda leading-none my-0.5">
                      {adminAttendees.length}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-sky-700/80 leading-tight">
                      {adminAttendees.length === 1 ? 'רכז פעיל' : 'בסשן'}
                    </span>
                  </button>

                  {/* מדריכים */}
                  <button
                    type="button"
                    onClick={() => { setAttendeesFilter('instructors'); setShowAttendees(true); }}
                    className="flex flex-col items-center justify-center py-2 px-0.5 sm:px-1 rounded-xl hover:bg-indigo-500/[0.08] active:scale-95 transition-all text-center group cursor-pointer"
                    title="מדריכים שאישרו הגעה"
                  >
                    <div className="flex items-center gap-0.5 sm:gap-1 text-indigo-700 mb-0.5">
                      <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-black tracking-tight text-indigo-950">מדריכים</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-indigo-800 font-yehuda leading-none my-0.5">
                      {instructorAttendees.length}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700/80 leading-tight">
                      {instructorAttendees.length === 1 ? 'מדריך פעיל' : 'בסשן'}
                    </span>
                  </button>

                  {/* צוות העמותה */}
                  <button
                    type="button"
                    onClick={() => { setAttendeesFilter('staff'); setShowAttendees(true); }}
                    className="flex flex-col items-center justify-center py-2 px-0.5 sm:px-1 rounded-xl hover:bg-rose-500/[0.08] active:scale-95 transition-all text-center group cursor-pointer"
                    title="צוות עמותה שאישרו הגעה (נלקחים בחשבון להדרכות וארוחת בוקר)"
                  >
                    <div className="flex items-center gap-0.5 sm:gap-1 text-rose-700 mb-0.5">
                      <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-black tracking-tight text-rose-950">צוות עמותה</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-rose-800 font-yehuda leading-none my-0.5">
                      {staffAttendees.length}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-rose-700/80 leading-tight">
                      {staffAttendees.length === 1 ? 'איש צוות' : 'בסשן'}
                    </span>
                  </button>
                </div>
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
            currentWaveHeight={coastalWeather?.waveHeight ?? 0.5}
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
        {/* New Beautiful Functional AI forecast and selector widget */}
        <div className="luxury-card p-8 mb-8 relative overflow-hidden" dir="rtl">
          <div className="grain-overlay" />
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#007085]/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#002b44]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            {/* Header / Title reflecting the AI surf suitability functionality */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#007085]/10 text-[#007085] rounded-2xl border border-[#007085]/20 shadow-md">
                  <Sparkles className="text-[#007085] animate-pulse" size={24} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-[#002b44] tracking-tight font-yehuda">
                  עוזר הגלישה AI: ניתוח מצב הים והתאמה לגלישה
                </h3>
              </div>
              <p className="text-[#007085] text-sm md:text-base font-bold font-yehuda max-w-2xl leading-relaxed">
                מערכת בינה מלאכותית מבוססת Gemini המנתחת נתוני גלים, רוחות וטמפרטורה בזמן אמת, ומספקת המלצה מקצועית ומותאמת אישית לכל חוף גלישה בישראל.
              </p>
            </div>

            {/* Selection and Query Controls - clean, premium and functional */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto shrink-0">
              <div className="relative">
                <select
                  value={selectedSpotId}
                  onChange={(e) => {
                    const spotId = e.target.value;
                    setSelectedSpotId(spotId);
                    const spot = surfSpots.find(s => s.id === spotId);
                    if (spot) {
                      setSelectedStationId(spot.imsId);
                    }
                  }}
                  className="w-full sm:w-auto bg-white/75 backdrop-blur-md border border-[#007085]/20 text-[#002b44] rounded-2xl px-6 py-4 text-base font-black outline-none focus:ring-2 focus:ring-[#007085] hover:border-[#007085]/40 transition-all shadow-sm appearance-none cursor-pointer pr-12 pl-6"
                >
                  {surfSpots.map((spot) => (
                    <option key={spot.id} value={spot.id}>
                      🌊 {spot.name}
                    </option>
                  ))}
                </select>
                <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none text-[#007085]">
                  <ChevronRight size={18} className="rotate-90" />
                </div>
              </div>

              <button
                onClick={handleForecastAnalysis}
                disabled={isAnalyzingForecast}
                className="relative group overflow-hidden flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#007085] via-[#00a3c4] to-[#007085] text-white rounded-2xl font-black text-base shadow-lg shadow-[#007085]/20 hover:shadow-[#007085]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {isAnalyzingForecast ? (
                  <Loader2 className="animate-spin text-white" size={20} />
                ) : (
                  <Sparkles className="text-white group-hover:animate-bounce" size={20} />
                )}
                <span>נתח חוף זה ב-AI</span>
              </button>
            </div>
          </div>

          {/* AI Output popup panel - designed with gorgeous clean look and extremely prominent close buttons */}
          <AnimatePresence>
            {forecastAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden mt-8"
              >
                <div className="bg-slate-900/95 text-slate-100 p-8 rounded-[2rem] border-2 border-[#00a3c4]/40 shadow-2xl relative overflow-hidden">
                  <div className="premium-sweep-fx" />
                  
                  {/* Close button at the top header */}
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-[#00a3c4] animate-pulse" size={22} />
                      <h4 className="text-lg md:text-xl font-black text-white">
                        חוות דעת AI – חוף {surfSpots.find(s => s.id === selectedSpotId)?.name || "הרצליה"}
                      </h4>
                    </div>
                    <button
                      onClick={() => setForecastAnalysis(null)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-black text-sm rounded-full border border-rose-500/20 transition-all active:scale-95 cursor-pointer shadow-sm"
                      title="סגור ניתוח"
                    >
                      <span>סגור</span>
                      <X size={16} />
                    </button>
                  </div>

                  <div className="absolute top-16 left-6 text-white/5">
                    <Sparkles size={64} />
                  </div>

                  <div className="prose prose-invert prose-slate max-w-none relative z-10
                    prose-p:text-slate-200 prose-p:leading-relaxed prose-p:font-bold prose-p:text-base md:prose-p:text-lg
                    prose-strong:text-[#00a3c4] prose-strong:font-black
                  ">
                    <Markdown>{forecastAnalysis}</Markdown>
                  </div>

                  {/* Close button at the bottom for maximum visibility/accessibility */}
                  <div className="mt-8 pt-4 border-t border-white/10 flex justify-end relative z-10">
                    <button
                      onClick={() => setForecastAnalysis(null)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-sm rounded-xl border border-white/15 transition-all active:scale-95 cursor-pointer shadow-inner"
                    >
                      <span>סגור חלון המלצה</span>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Existing SurfDashboard displays actual measurements */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[var(--surfer-yellow)]/20 text-[#FFD700] rounded-xl border border-white/20 shadow-lg shadow-[var(--surfer-yellow)]/10">
            <Waves size={20} />
          </div>
          <h3 className="text-2xl font-black text-[#000000] tracking-tight font-yehuda">מצב הים המפורט עכשיו</h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="bento"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <SurfDashboard 
              selectedSpotId={selectedSpotId}
              setSelectedSpotId={(id) => {
                setSelectedSpotId(id);
                const spot = surfSpots.find(s => s.id === id);
                if (spot) {
                  setSelectedStationId(spot.imsId);
                }
              }}
            />
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
           <div className="relative bg-gradient-to-br from-[#FCFCFC] via-[#FFFFFF] to-[#F0F7F9] border border-white/80 shadow-[0_40px_80px_-20px_rgba(0,43,68,0.2)] rounded-[2rem] w-full max-w-lg p-6 sm:p-8 animate-in zoom-in-95 overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Micro-grain texture */}
              <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#002b44] tracking-tight font-yehuda">נבחרת הסשן</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-bold mt-0.5">
                      {pairStats.fullPairsCount} זוגות • {pairStats.totalSoloCount} לבד • {adminAttendees.length} רכזים • {instructorAttendees.length} מדריכים • {staffAttendees.length} צוות עמותה
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-[#007085]/10 text-[#007085] rounded-full text-xs font-black tracking-wider flex-shrink-0">
                    {attendees.length} גולשים
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 mb-3.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setAttendeesFilter('all')}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] sm:text-xs font-black transition-all whitespace-nowrap ${
                      attendeesFilter === 'all'
                        ? 'bg-white text-[#002b44] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    הכל ({attendees.length})
                  </button>
                  <button
                    onClick={() => setAttendeesFilter('pairs')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                      attendeesFilter === 'pairs'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-800 hover:text-emerald-950'
                    }`}
                  >
                    <HeartHandshake size={12} />
                    <span>זוגות ({pairStats.fullPairsCount})</span>
                  </button>
                  <button
                    onClick={() => setAttendeesFilter('solo')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                      attendeesFilter === 'solo'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-800 hover:text-amber-950'
                    }`}
                  >
                    <UserCheck size={12} />
                    <span>לבד ({pairStats.totalSoloCount})</span>
                  </button>
                  <button
                    onClick={() => setAttendeesFilter('admins')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                      attendeesFilter === 'admins'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-sky-800 hover:text-sky-950'
                    }`}
                  >
                    <ShieldCheck size={12} />
                    <span>רכזים ({adminAttendees.length})</span>
                  </button>
                  <button
                    onClick={() => setAttendeesFilter('instructors')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                      attendeesFilter === 'instructors'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-800 hover:text-indigo-950'
                    }`}
                  >
                    <GraduationCap size={12} />
                    <span>מדריכים ({instructorAttendees.length})</span>
                  </button>
                  <button
                    onClick={() => setAttendeesFilter('staff')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                      attendeesFilter === 'staff'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-800 hover:text-rose-950'
                    }`}
                  >
                    <Building2 size={12} />
                    <span>צוות ({staffAttendees.length})</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
                  {displayedAttendees.map(a => {
                    const pairInfo = getAttendeePairInfo(a);
                    return (
                      <div 
                        key={a.id} 
                        onClick={() => setSelectedMemberProfile(a)}
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between p-3.5 bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_4px_16px_-4px_rgba(0,43,68,0.08)] border border-white hover:border-[#007085]/30 hover:shadow-[0_12px_28px_-6px_rgba(0,43,68,0.15)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          {a.avatar ? (
                            <img src={a.avatar} className="w-13 h-13 rounded-2xl object-cover shadow-sm border border-slate-100/60 flex-shrink-0" alt="" loading="lazy" />
                          ) : (
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-white shadow-inner flex items-center justify-center text-slate-400 flex-shrink-0">
                              <UserCircle size={26} strokeWidth={1.5} />
                            </div>
                          )}
                          <div className="text-right">
                            <p className="font-black text-[#002b44] text-base group-hover:text-[#007085] transition-colors">{a.firstName} {a.lastName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {a.role === 'Admin' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200/70">
                                  <ShieldCheck size={11} className="text-sky-700" />
                                  רכז
                                </span>
                              ) : a.role === 'Instructor' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200/70">
                                  <GraduationCap size={11} className="text-indigo-700" />
                                  מדריך
                                </span>
                              ) : a.role === 'Staff' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200/70">
                                  <Building2 size={11} className="text-rose-700" />
                                  צוות עמותה
                                </span>
                              ) : (
                                <span className="text-[11px] font-black text-[#007085] uppercase tracking-[0.15em] opacity-80">
                                  {a.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                                </span>
                              )}
                              {(a.full_address || a.city) && (
                                <span className="text-slate-400 font-normal font-sans text-[11px]">
                                  • {a.full_address || a.city}
                                </span>
                              )}
                            </div>
                            
                            {/* Pair status pill */}
                            <div className="mt-1">
                              {pairInfo.status === 'admin' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200/70">
                                  <ShieldCheck size={11} className="text-sky-600" />
                                  רכז סשן בתפקיד
                                </span>
                              )}
                              {pairInfo.status === 'instructor' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/70">
                                  <GraduationCap size={11} className="text-indigo-600" />
                                  מדריך סשן בתפקיד
                                </span>
                              )}
                              {pairInfo.status === 'pair_both' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                                  <HeartHandshake size={11} className="text-emerald-600" />
                                  זוג עם {pairInfo.partner?.firstName} {pairInfo.partner?.lastName} (שניהם אישרו)
                                </span>
                              )}
                              {pairInfo.status === 'pair_solo' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                                  <UserCheck size={11} className="text-amber-600" />
                                  מגיע/ה לבד ({pairInfo.partner?.firstName} לא אישר/ה)
                                </span>
                              )}
                              {pairInfo.status === 'independent' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70">
                                  <User size={11} className="text-slate-500" />
                                  גולש/ת עצמאי/ת
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-[#007085]/10 text-[#007085] group-hover:bg-[#007085] group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0 mr-2">
                          <Phone size={14} />
                        </div>
                      </div>
                    );
                  })}
                  {displayedAttendees.length === 0 && (
                    <div className="py-8 text-center text-slate-400 font-bold text-sm">
                      לא נמצאו גולשים בסינון זה
                    </div>
                  )}
                </div>
                <button onClick={() => setShowAttendees(false)} className="w-full mt-4 py-3.5 bg-[#002b44] text-white rounded-2xl shadow-[0_12px_24px_-8px_rgba(0,43,68,0.4)] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-[#003b5c]">סגור</button>
              </div>
           </div>
        </div>
      )}

      {/* Member Profile Quick-View Modal */}
      {selectedMemberProfile && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedMemberProfile(null)}
        >
          <div 
            className="relative bg-white rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-[0_30px_90px_-20px_rgba(0,0,0,0.4)] border border-slate-100 text-center animate-in zoom-in-95 overflow-hidden"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedMemberProfile(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
              aria-label="סגור"
            >
              <X size={16} />
            </button>

            {/* Profile Avatar */}
            <div className="flex flex-col items-center mt-1">
              <div className="relative mb-3">
                {selectedMemberProfile.avatar ? (
                  <img 
                    src={selectedMemberProfile.avatar} 
                    alt={`${selectedMemberProfile.firstName} ${selectedMemberProfile.lastName}`}
                    className="w-24 h-24 rounded-3xl object-cover ring-4 ring-[#007085]/20 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-slate-100 ring-4 ring-[#007085]/20 shadow-lg flex items-center justify-center text-slate-400">
                    <UserCircle size={54} strokeWidth={1.5} />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 px-3 py-0.5 rounded-full text-[11px] font-black bg-[#002b44] text-white shadow-sm">
                  {selectedMemberProfile.role === 'Admin' ? 'רכז' : selectedMemberProfile.role === 'Staff' ? 'צוות עמותה' :
                   selectedMemberProfile.role === 'Instructor' ? 'מדריך' :
                   selectedMemberProfile.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                </span>
              </div>

              {/* Name */}
              <h3 className="text-2xl font-black text-[#002b44] tracking-tight font-yehuda">
                {selectedMemberProfile.firstName} {selectedMemberProfile.lastName}
              </h3>

              {/* Residential Address */}
              <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs sm:text-sm font-medium mt-2 mb-4 px-3.5 py-1.5 bg-slate-50 rounded-full border border-slate-200/80 max-w-full">
                <MapPin size={14} className="text-[#007085] shrink-0" />
                <span className="truncate">
                  {selectedMemberProfile.full_address || 
                   (selectedMemberProfile.street_name ? `${selectedMemberProfile.street_name} ${selectedMemberProfile.house_number || ''}, ${selectedMemberProfile.city || ''}` : selectedMemberProfile.city) || 
                   'לא צוינה כתובת מגורים'}
                </span>
              </div>
            </div>

            {/* Contact Action Buttons */}
            <div className="flex flex-col gap-2.5 w-full mt-2">
              {/* Phone Call */}
              {selectedMemberProfile.mobile ? (
                <a 
                  href={`tel:${selectedMemberProfile.mobile}`}
                  className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-2xl bg-[#007085] hover:bg-[#005a6b] active:scale-98 text-white font-black text-sm shadow-md transition-all font-yehuda tracking-wide"
                >
                  <Phone size={16} />
                  <span>שיחת טלפון ({selectedMemberProfile.mobile})</span>
                </a>
              ) : (
                <div className="py-2.5 text-xs text-slate-400 bg-slate-50 rounded-xl">
                  לא הוזן מספר טלפון
                </div>
              )}

              {/* WhatsApp */}
              {selectedMemberProfile.mobile && (
                <a 
                  href={`https://wa.me/${selectedMemberProfile.mobile.replace(/[^0-9]/g, '').replace(/^0/, '972')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-white font-black text-sm shadow-md transition-all font-yehuda tracking-wide"
                >
                  <MessageCircle size={16} />
                  <span>שליחת הודעת WhatsApp</span>
                </a>
              )}

              {/* Email */}
              {selectedMemberProfile.email ? (
                <a 
                  href={`mailto:${selectedMemberProfile.email}`}
                  className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-[#002b44] font-bold text-sm border border-slate-200 transition-all font-sans"
                >
                  <Mail size={16} className="text-[#007085]" />
                  <span className="truncate">{selectedMemberProfile.email}</span>
                </a>
              ) : (
                <div className="py-2 text-xs text-slate-400 bg-slate-50 rounded-xl">
                  לא הוזנה כתובת אימייל
                </div>
              )}
            </div>

            {/* Back Button */}
            <button
              onClick={() => setSelectedMemberProfile(null)}
              className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
            >
              חזרה לרשימת הנבחרת
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
