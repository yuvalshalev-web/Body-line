
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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { SURF_QUOTES } from '../data/surfQuotes';
import { SURF_DICTIONARY } from '../data/surfDictionary';

const SurfboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2c-2.5 4-3 9-2 14 1 5 2 6 2 6s1-1 2-6c1-5 .5-10-2-14Z" />
    <path d="M12 11v3" />
  </svg>
);

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    members, galleryItems, events, attendeeIds, toggleSessionAttendance, siteAssets, glossary, quotes
  } = useData();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [randomGlossary, setRandomGlossary] = useState<any[]>([]);
  const [randomQuotes, setRandomQuotes] = useState<any[]>([]);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [isRefreshingGlossary, setIsRefreshingGlossary] = useState(false);

  const attendees = useMemo(() => members.filter(m => attendeeIds.includes(m.id)), [members, attendeeIds]);
  const isUserAttending = useMemo(() => currentUser ? attendeeIds.includes(currentUser.id) : false, [attendeeIds, currentUser]);

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
    const interval = setInterval(refreshGlossary, 20000);
    return () => clearInterval(interval);
  }, [refreshGlossary]);

  useEffect(() => {
    refreshQuote();
    const interval = setInterval(refreshQuote, 20000);
    return () => clearInterval(interval);
  }, [refreshQuote]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(now);
      let daysToAdd = (4 - now.getDay() + 7) % 7;
      if (daysToAdd === 0 && now.getHours() >= 7) daysToAdd = 7;
      target.setDate(now.getDate() + daysToAdd);
      target.setHours(7, 0, 0, 0);
      const diff = target.getTime() - now.getTime();
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
  }, []);

  const handleToggle = async () => {
    if (!currentUser) return;
    setIsProcessing(true);
    try { await toggleSessionAttendance(currentUser.id); } finally { setIsProcessing(false); }
  };

  const brandColor = '#F1D179';

  return (
    <div className="space-y-16 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20" dir="rtl">
      <section className="relative w-full aspect-video rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 group">
        <img 
          src={siteAssets.heroBg || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media"} 
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]" 
          alt="Hero"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center">
           <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-10" style={{ color: brandColor }}>יום חמישי הגדול</h2>
           <div className="flex flex-col gap-6 items-center">
              <button 
                onClick={handleToggle}
                disabled={isProcessing}
                className={`px-16 py-6 rounded-full font-black text-2xl transition-all shadow-2xl active:scale-95 flex items-center gap-4 ${isUserAttending ? 'bg-rose-600 text-white' : 'bg-[#F1D179] text-slate-900'}`}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={28} /> : <Waves size={28} />}
                {isUserAttending ? 'בטל הגעה' : 'אני מגיע/ה'}
              </button>
              <button onClick={() => setShowAttendees(true)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl transition-all group">
                <div className="flex -space-x-3 space-x-reverse">
                  {attendees.slice(0, 3).map(a => (
                    <img key={a.id} src={a.avatar} className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover" alt="" loading="lazy" />
                  ))}
                  {attendees.length > 3 && <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-black">+{attendees.length - 3}</div>}
                </div>
                <span className="text-white/70 font-black text-sm group-hover:text-white">{attendees.length} חברים אישרו הגעה</span>
              </button>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { label: 'נבחרת הכוכבים', value: members.length, icon: Users, path: '/directory', color: 'bg-emerald-50 text-emerald-600' },
          { label: 'תמונות', value: galleryItems.length, icon: ImageIcon, path: '/gallery', color: 'bg-rose-50 text-rose-600' },
          { label: 'אירועים', value: events.length, icon: Calendar, path: '/events', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'תחזית גלים', value: 'GoSurf', icon: Waves, path: 'https://gosurf.co.il', external: true, color: 'bg-sky-50 text-sky-600' },
          { label: 'BeachCam', value: 'Live', icon: Video, path: 'https://beachcam.co.il', external: true, color: 'bg-violet-50 text-violet-600' }
        ].map((card, i) => (
          <Link key={i} to={card.path} target={card.external ? "_blank" : undefined} className={`p-8 rounded-[2.5rem] border border-slate-100 hover:shadow-xl transition-all flex flex-col items-center text-center ${card.color}`}>
            <card.icon size={28} className="mb-4" />
            <p className="text-3xl font-black text-slate-900 mb-1">{card.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm relative min-h-[400px]">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-inner"><Quote size={24} /></div>
              <h3 className="text-2xl font-black text-slate-950">חוכמת הליין-אפ</h3>
           </div>
           {randomQuotes.map((item, idx) => (
             <div key={idx} className="p-10 bg-slate-50 rounded-[2.5rem] transition-all animate-in fade-in">
               <p className="text-2xl font-black text-slate-900 leading-tight italic">"{item.text}"</p>
               <p className="text-lg font-bold text-slate-400 italic mt-6">— {item.author}</p>
             </div>
           ))}
        </section>

        <section className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm relative min-h-[400px]">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl shadow-inner"><BookOpen size={24} /></div>
              <h3 className="text-2xl font-black text-slate-950">מילון מונחים</h3>
           </div>
           {randomGlossary.map((item, idx) => (
             <div key={idx} className="p-10 bg-slate-50 rounded-[2.5rem] transition-all animate-in fade-in">
               <h4 className="text-4xl font-black text-slate-900 mb-4" dir="ltr">{item.term}</h4>
               <p className="text-xl font-bold text-slate-500 italic border-r-4 border-sky-100 pr-6">{item.definition}</p>
             </div>
           ))}
        </section>
      </div>

      {showAttendees && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowAttendees(false)}>
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black mb-8">נבחרת הסשן</h3>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {attendees.map(a => (
                  <div key={a.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <img src={a.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" loading="lazy" />
                    <div>
                      <p className="font-black text-slate-900">{a.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.role === 'Admin' ? 'מנהל' : 'חבר'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAttendees(false)} className="w-full mt-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-lg">סגור</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
