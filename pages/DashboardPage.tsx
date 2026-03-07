
import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import { Astrodeck } from '../components/CommunityAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
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
    members, galleryItems, events, attendeeIds, toggleSessionAttendance, siteAssets, glossary, quotes, news, activeSessionDate
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

  const activeMembers = useMemo(() => members.filter(m => m.isActive !== false), [members]);
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
    if (news.length === 0) return;
    setIsRefreshingPost(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * news.length);
      setRandomPost(news[randomIndex]);
      setIsRefreshingPost(false);
    }, 400);
  }, [news]);

  const refreshGlossary = useCallback(() => {
    setIsRefreshingGlossary(true);
    setTimeout(() => {
      const source = glossary.length > 0 ? glossary : SURF_DICTIONARY;
      const shuffled = [...source].sort(() => 0.5 - Math.random());
      setRandomGlossary(shuffled.slice(0, 1));
      setIsRefreshingGlossary(false);
    }, 400);
  }, [glossary]);

  const refreshQuote = useCallback(() => {
    setIsRefreshingQuotes(true);
    setTimeout(() => {
      const source = quotes.length > 0 ? quotes : SURF_QUOTES;
      const shuffled = [...source].sort(() => 0.5 - Math.random());
      setRandomQuotes(shuffled.slice(0, 1));
      setIsRefreshingQuotes(false);
    }, 400);
  }, [quotes]);

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
      const target = activeSessionDate ? new Date(activeSessionDate) : new Date();
      if (!activeSessionDate) {
        let daysToAdd = (4 - now.getDay() + 7) % 7;
        if (daysToAdd === 0 && now.getHours() >= 7) daysToAdd = 7;
        target.setDate(now.getDate() + daysToAdd);
        target.setHours(7, 0, 0, 0);
      }
      
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
  }, [activeSessionDate]);

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
    <div className="space-y-16 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20 px-[var(--spacing-md)] md:px-0" dir="rtl">
      <section className="relative w-full min-h-[700px] md:min-h-[650px] rounded-[var(--radius-lg)] overflow-hidden shadow-2xl border border-slate-100 group">
        <img 
          src={siteAssets.heroBg || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media"} 
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]" 
          alt="Hero"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
        <div className="relative z-10 min-h-[700px] md:min-h-[650px] flex flex-col items-center justify-center p-8 md:p-12 text-center py-20">
           <motion.p 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1.5, delay: 0.5 }}
             className="text-white/90 font-semibold italic text-lg md:text-2xl mb-8 max-w-2xl tracking-[0.08em] leading-relaxed drop-shadow-2xl"
           >
             "A day will come that is like no other... and nothing that happens after will ever be the same."
           </motion.p>
           <h1 className="home-page-title">יום חמישי הגדול</h1>
           
           <div className="mb-8 space-y-2">
             <p className="text-lg md:text-xl font-bold text-white/60">נכנסים למים בעוד...</p>
           </div>

           <div className="mb-12 flex gap-4 text-white/80 font-black text-xl tracking-tighter" dir="ltr">
             <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
               <span className="text-3xl text-[#F1D179]">{countdown.days}</span>
               <span className="text-[10px] uppercase opacity-60">ימים</span>
             </div>
             <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
               <span className="text-3xl text-[#F1D179]">{countdown.hours}</span>
               <span className="text-[10px] uppercase opacity-60">שעות</span>
             </div>
             <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
               <span className="text-3xl text-[#F1D179]">{countdown.minutes}</span>
               <span className="text-[10px] uppercase opacity-60">דקות</span>
             </div>
             <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
               <span className="text-3xl text-[#F1D179]">{countdown.seconds}</span>
               <span className="text-[10px] uppercase opacity-60">שניות</span>
             </div>
           </div>
           
           <div className="flex flex-col gap-6 items-center">
              <button 
                onClick={handleToggle}
                disabled={isProcessing}
                className={`px-10 md:px-16 py-4 md:py-6 rounded-full font-black text-xl md:text-2xl transition-all shadow-2xl active:scale-95 flex items-center gap-[var(--spacing-md)] ${isUserAttending ? 'bg-white border-2 border-[#FF0000]' : 'bg-[var(--ocean-bg)] text-white hover:bg-[var(--ocean-pipe-empty)]'}`}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={28} /> : <Waves size={28} className={isUserAttending ? 'text-[#FF0000]' : 'text-[#00FFFF]'} />}
                {isUserAttending ? <span className="text-[#FF0000]">בטל הגעה</span> : 'אני מגיע/ה'}
              </button>
              
              <div className="flex flex-col items-center gap-4">
                <button onClick={() => setShowAttendees(true)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl transition-all group">
                  <div className="flex -space-x-3 space-x-reverse">
                    {attendees.slice(0, 5).map(a => (
                      a.avatar ? (
                        <img key={a.id} src={a.avatar} className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" alt="" loading="lazy" />
                      ) : (
                        <div key={a.id} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-black">
                          {a.firstName.charAt(0)}
                        </div>
                      )
                    ))}
                    {attendees.length > 5 && <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-black">+{attendees.length - 5}</div>}
                  </div>
                  <span className="text-white/70 font-black text-sm group-hover:text-white">{attendees.length} חברים אישרו הגעה</span>
                </button>
                
                {attendees.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 max-w-md">
                    {attendees.slice(0, 10).map(a => (
                      <span key={a.id} className="text-[10px] font-black text-white/40 bg-white/5 px-2 py-1 rounded-md">{a.firstName}</span>
                    ))}
                  </div>
                )}
              </div>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[var(--spacing-md)]">
        {[
          { label: 'נבחרת הגלישה', value: activeMembers.length, icon: Users, path: '/directory', color: 'text-emerald-600' },
          { label: 'תמונות', value: galleryItems.length, icon: ImageIcon, path: '/gallery', color: 'text-rose-600' },
          { label: 'אירועים', value: activeEventsCount, icon: Calendar, path: '/events', color: 'text-indigo-600' },
          { label: 'פוסטים', value: news.length, icon: Newspaper, path: '/posts', color: 'text-amber-600' },
          { label: 'תחזית גלים', value: 'GoSurf', icon: Waves, path: 'https://gosurf.co.il', external: true, color: 'text-sky-600' },
          { label: 'BeachCam', value: 'Live', icon: Video, path: 'https://beachcam.co.il', external: true, color: 'text-violet-600' }
        ].map((card, i) => (
          <Astrodeck key={i} {...card} />
        ))}
      </div>

      {/* Latest Posts Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 glass-effect text-white rounded-2xl shadow-lg"><Newspaper size={24} /></div>
            <h3 className="text-3xl font-black glass-text-primary tracking-tight">פוסטים אחרונים</h3>
          </div>
          <Link to="/posts" className="glass-text-secondary font-black text-xs uppercase tracking-widest hover:text-slate-950 transition-colors">צפה בהכל</Link>
        </div>
        
        <div className="max-w-xl mx-auto">
          {randomPost ? (
            <Link to="/posts" className={`group glass-panel overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col ${isRefreshingPost ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              {randomPost.imageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img src={randomPost.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                </div>
              )}
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-black glass-text-secondary uppercase tracking-widest mb-4">
                  <Calendar size={12} />
                  {randomPost.date}
                </div>
                <h4 className="text-xl font-black glass-text-primary mb-4 group-hover:text-rose-600 transition-colors line-clamp-2">{randomPost.title}</h4>
                <p className="glass-text-secondary font-bold text-sm line-clamp-3 mb-6">{randomPost.content}</p>
                <div className="mt-auto flex items-center gap-3">
                  {randomPost.authorAvatar ? (
                    <img src={randomPost.authorAvatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full glass-effect flex items-center justify-center text-slate-400">
                      <UserCircle size={12} />
                    </div>
                  )}
                  <span className="text-[10px] font-black glass-text-secondary">{randomPost.authorName}</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="py-20 text-center glass-panel border-2 border-dashed border-white/20">
              <p className="glass-text-secondary font-bold">אין פוסטים להצגה</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="glass-panel p-12 relative min-h-[400px]">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-amber-500/20 text-amber-600 rounded-2xl shadow-inner"><Quote size={24} /></div>
              <h3 className="text-2xl font-black glass-text-primary">חוכמת הליין-אפ</h3>
           </div>
           {randomQuotes.map((item, idx) => (
             <div key={idx} className="p-10 glass-effect rounded-[2.5rem] transition-all animate-in fade-in">
               <p className="text-2xl font-black glass-text-primary leading-tight italic">"{item.text}"</p>
               <p className="text-lg font-bold glass-text-secondary italic mt-6">— {item.author}</p>
             </div>
           ))}
        </section>

        <section className="glass-panel p-12 relative min-h-[400px]">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-sky-500/20 text-sky-600 rounded-2xl shadow-inner"><BookOpen size={24} /></div>
              <h3 className="text-2xl font-black glass-text-primary">מילון מונחים</h3>
           </div>
           {randomGlossary.map((item, idx) => (
             <div key={idx} className="p-10 glass-effect rounded-[2.5rem] transition-all animate-in fade-in">
               <h4 className="text-4xl font-black glass-text-primary mb-4" dir="ltr">{item.term}</h4>
               <p className="text-xl font-bold glass-text-secondary italic border-r-4 border-sky-500/30 pr-6">{item.definition}</p>
             </div>
           ))}
        </section>
      </div>

      {showAttendees && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 modal-overlay" onClick={() => setShowAttendees(false)}>
           <div className="modal-content w-full max-w-lg p-10 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black mb-8 glass-text-primary">נבחרת הסשן</h3>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {attendees.map(a => (
                  <div key={a.id} className="flex items-center gap-4 p-4 glass-effect rounded-2xl">
                    {a.avatar ? (
                      <img src={a.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" loading="lazy" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl glass-effect flex items-center justify-center text-slate-400">
                        <UserCircle size={24} />
                      </div>
                    )}
                    <div>
                      <p className="font-black glass-text-primary">{a.firstName} {a.lastName}</p>
                      <p className="text-[10px] font-black glass-text-secondary uppercase tracking-widest">{a.role === 'Admin' ? 'רכז' : 'חבר'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAttendees(false)} className="w-full mt-8 py-4 bg-[#006994] text-white rounded-2xl font-black text-lg hover:bg-[#4E8294] transition-all active:scale-95">סגור</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
