
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Image as ImageIcon, 
  Calendar, 
  Waves,
  Loader2,
  X as CloseIcon,
  Sparkles,
  ArrowRight,
  Newspaper,
  Quote,
  BookOpen,
  RefreshCw,
  Bird,
  Waves as ReefIcon,
  Wind,
  Play,
  Monitor
} from 'lucide-react';
import { Member, NewsItem } from '../types';

interface DashboardPageProps {
  membersCount: number;
  galleryCount: number;
  eventsCount: number;
  newsCount: number;
  currentUser: Member;
  attendees: Member[];
  onToggleAttendance: () => Promise<void>;
  heroBg?: string;
  activeSessionDate: string;
  siteAssets: { clubLogo?: string; atalefLogo?: string; habalZugLogo?: string; };
  news: NewsItem[];
}

const SURF_QUOTES = [
  { text: "אתה לא יכול לעצור את הגלים, אבל אתה יכול ללמוד לגלוש עליהם.", author: "ג'ון קבט-זין" },
  { text: "גלישה היא הדרך שלי להתחבר לכוח של הטבע ולמצוא שקט פנימי.", author: "ג'ון ג'ון פלורנס" },
  { text: "הים הוא המקום היחיד שבו אני מרגיש באמת חופשי.", author: "גולש חבל זוג" },
  { text: "יום רע בים תמיד טוב יותר מיום טוב במשרד.", author: "עממי" },
  { text: "הגל הכי טוב בחיים שלך הוא הגל הבא שתתפוס.", author: "נבחרת חבל זוג" }
];

const SURF_DICTIONARY = [
  { term: "אופשור (Offshore)", definition: "רוח הנושבת מהיבשה אל הים. הרוח ה'טובה' שמיישרת את הגלים ויוצרת צינורות." },
  { term: "אונשור (Onshore)", definition: "רוח הנושבת מהים אל היבשה. יוצרת גלים מבולגנים וקשים לגלישה." },
  { term: "ליינאפ (Lineup)", definition: "האזור בים שבו הגולשים מחכים מעבר לקצף כדי לתפוס את הגלים." },
  { term: "דאק דייב (Duck Dive)", definition: "צלילה מתחת לגל הנשבר עם הגלשן כדי לעבור אותו בקלות." },
  { term: "פיק (Peak)", definition: "הנקודה הגבוהה ביותר בגל, המקום האידיאלי להתחיל בו את הגלישה." },
  { term: "סוול (Swell)", definition: "אנרגיית הגלים שנוצרה בלב ים ומגיעה אל החוף כסטים מסודרים." }
];

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  membersCount, galleryCount, eventsCount, newsCount,
  currentUser, attendees, onToggleAttendance, heroBg, activeSessionDate, news
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [dictionaryIndex, setDictionaryIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * SURF_QUOTES.length));
    setDictionaryIndex(Math.floor(Math.random() * SURF_DICTIONARY.length));
  }, []);

  const formattedDate = useMemo(() => {
    const d = new Date(activeSessionDate);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  }, [activeSessionDate]);

  const latestNews = useMemo(() => news.slice(0, 3), [news]);
  const isUserAttending = attendees.some(a => a.id === currentUser.id);

  const statsCards = [
    { label: 'חברים', value: membersCount, icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-50', path: '/directory' },
    { label: 'תמונות', value: galleryCount, icon: ImageIcon, color: 'text-rose-500', bgColor: 'bg-rose-50', path: '/gallery' },
    { label: 'אירועים', value: eventsCount, icon: Calendar, color: 'text-indigo-500', bgColor: 'bg-indigo-50', path: '/events' },
    { label: 'תחזית', value: 'GoSurf', icon: Waves, color: 'text-sky-500', bgColor: 'bg-sky-50', path: 'https://gosurf.co.il/forecast/herzliya-marina', external: true }
  ];

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in duration-700 max-w-5xl mx-auto pb-10" dir="rtl">
      
      {/* Hero Section - Mobile Square, Desktop Wide */}
      <section className="relative w-full aspect-square md:aspect-video lg:min-h-[500px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 group">
        <img 
          src={heroBg} 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
        
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center py-10 px-6 text-center space-y-5 md:space-y-8">
          <div className="space-y-2">
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none mb-1 drop-shadow-2xl">
              יום חמישי הגדול
            </h2>
            <p className="text-white/90 font-black text-sm md:text-xl uppercase tracking-widest bg-white/10 backdrop-blur-sm inline-block px-4 md:px-6 py-2 rounded-full border border-white/10">
              הסשן הקרוב • {formattedDate}
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4 md:pt-4">
            <button 
              onClick={async () => { setIsProcessing(true); try { await onToggleAttendance(); } finally { setIsProcessing(false); } }}
              disabled={isProcessing}
              className={`w-full py-4.5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-2xl transition-all shadow-2xl flex items-center justify-center gap-3 md:gap-4 active:scale-95 ${isUserAttending ? 'bg-rose-600 text-white' : 'bg-white text-slate-950 hover:bg-slate-100'}`}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={24} /> : (isUserAttending ? 'רשום • ביטול?' : 'אני מגיע!')}
              {!isProcessing && <Sparkles size={20} className={isUserAttending ? 'text-white' : 'text-indigo-600'} />}
            </button>
            <button 
              onClick={() => attendees.length > 0 && setShowAttendees(true)} 
              className="text-white/60 font-black text-[10px] md:text-xs uppercase tracking-widest hover:text-white transition-colors bg-black/20 backdrop-blur-md px-5 py-2 rounded-full"
            >
              {attendees.length} חברים כבר נרשמו • מי בא?
            </button>
          </div>
        </div>
      </section>

      {/* Stats Cards - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((card, idx) => {
          const content = (
            <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-xl transition-all group h-full active:scale-95">
              <div className={`w-10 h-10 md:w-14 md:h-14 ${card.bgColor} rounded-xl md:rounded-2xl flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="text-center">
                <p className="text-slate-600 font-black text-[8px] md:text-[10px] uppercase tracking-widest mb-1">{card.label}</p>
                <h4 className="text-xl md:text-3xl font-black text-slate-950">{card.value}</h4>
              </div>
            </div>
          );
          return card.external ? <a key={idx} href={card.path} target="_blank" rel="noopener noreferrer" className="block">{content}</a> : <Link key={idx} to={card.path} className="block">{content}</Link>;
        })}
      </div>

      {/* News and Socials Stacking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
        {/* Latest Posts */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Newspaper className="text-slate-950" size={20} />
              <h3 className="text-xl md:text-2xl font-black text-slate-950">פוסטים אחרונים</h3>
            </div>
            <Link to="/news" className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
              לכל הכתבות <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
            {latestNews.length > 0 ? latestNews.map((item) => (
              <Link key={item.id} to="/news" className="group bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all flex flex-col gap-4 active:scale-95">
                <div className="aspect-[16/9] rounded-[1.25rem] md:rounded-[1.5rem] overflow-hidden bg-slate-50 relative">
                   {item.imageUrl ? (
                     <img src={item.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-200"><Newspaper size={32} /></div>
                   )}
                   <div className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-950 border border-slate-100">
                      {item.category}
                   </div>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm md:text-lg leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{item.title}</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                       <Bird size={10} />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.authorName}</span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] text-slate-500 font-black text-sm italic">ממתינים לעדכונים...</div>
            )}
          </div>
        </div>

        {/* Live Cam Sidebar - Desktop Only or Top Stack on Mobile */}
        <div className="space-y-6 md:space-y-8">
          <div className="flex items-center gap-3 px-4">
            <Monitor size={20} className="text-slate-950" />
            <h3 className="text-xl md:text-2xl font-black text-slate-950">מבט לים</h3>
          </div>
          <a 
            href="https://beachcam.co.il/marina.html" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block w-full aspect-video rounded-[2.5rem] bg-slate-950 border border-slate-200 overflow-hidden relative shadow-xl group active:scale-95 transition-all"
          >
            <img 
              src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=1200" 
              className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
              alt="Live Cam Preview" 
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors"></div>
            <div className="absolute top-4 left-4 px-2 py-1 bg-rose-600 rounded-lg flex items-center gap-2 shadow-lg z-20">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              <span className="text-[8px] font-black text-white uppercase tracking-widest">LIVE</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                  <Play size={30} fill="white" className="text-white ml-1.5" />
               </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent z-20">
               <span className="text-white font-black text-[10px] md:text-xs tracking-tight">מרינה הרצליה • שידור חי</span>
            </div>
          </a>
        </div>
      </div>

      {/* Surf Dictionary/Quotes - Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        <section className="bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800 text-center">
           <Quote className="text-indigo-400 opacity-50 mx-auto mb-6" size={40} />
           <div className="space-y-4">
              <h3 className="text-lg md:text-2xl font-black italic leading-relaxed">
                "{SURF_QUOTES[quoteIndex].text}"
              </h3>
              <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">
                — {SURF_QUOTES[quoteIndex].author}
              </p>
           </div>
           <button 
             onClick={() => setQuoteIndex((prev) => (prev + 1) % SURF_QUOTES.length)}
             className="mt-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
           >
             <RefreshCw size={18} className="text-slate-400" />
           </button>
        </section>

        <section className="bg-indigo-950 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-indigo-900 text-center">
           <BookOpen className="text-indigo-400 opacity-50 mx-auto mb-6" size={32} />
           <div className="space-y-4">
              <h3 className="text-xl md:text-2xl font-black italic">
                {SURF_DICTIONARY[dictionaryIndex].term}
              </h3>
              <p className="text-slate-300 font-bold text-sm md:text-lg leading-relaxed max-w-lg mx-auto">
                {SURF_DICTIONARY[dictionaryIndex].definition}
              </p>
           </div>
           <button 
             onClick={() => setDictionaryIndex((prev) => (prev + 1) % SURF_DICTIONARY.length)}
             className="mt-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
           >
             <RefreshCw size={18} className="text-slate-400" />
           </button>
        </section>
      </div>

      {/* Attendees Modal */}
      {showAttendees && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowAttendees(false)}>
           <div className="bg-white w-full max-w-md rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="text-xl md:text-2xl font-black text-slate-950">נרשמו לסשן</h3>
                 <button onClick={() => setShowAttendees(false)} className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><CloseIcon size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                 <div className="grid grid-cols-2 gap-5 md:gap-6">
                    {attendees.map(a => (
                      <div key={a.id} className="flex flex-col items-center gap-3 group">
                          <img src={a.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-slate-50 group-hover:border-indigo-100 transition-all shadow-sm" alt={a.name} />
                          <h4 className="font-black text-slate-900 text-[10px] md:text-xs text-center">{a.name}</h4>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
