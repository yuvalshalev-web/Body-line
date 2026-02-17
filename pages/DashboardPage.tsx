
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
  Video,
  Radio,
  Star
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

const FALLBACK_HEADLINES = [
  "תחזית סוול: גל חדש בדרך לחופי המרכז ביום חמישי הקרוב",
  "מצב הים: טמפרטורת המים עולה ל-20 מעלות, רוח אופשור קלילה בבוקר",
  "קהילה: מפגש גולשי חבל זוג המסורתי יתקיים השבוע במועדון ריף",
  "בטיחות בים: הנחיות חדשות לגלישה בקרבת שוברי הגלים במרינה",
  "ספורט: עלייה במספר הגולשים המקצועיים בנבחרת המייצגת של הרצליה"
];

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  membersCount, galleryCount, eventsCount, newsCount,
  currentUser, attendees, onToggleAttendance, heroBg, activeSessionDate, news, siteAssets
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [dictionaryIndex, setDictionaryIndex] = useState(0);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * SURF_QUOTES.length));
    setDictionaryIndex(Math.floor(Math.random() * SURF_DICTIONARY.length));
  }, []);

  // News Rotation logic (10 seconds)
  useEffect(() => {
    if (news.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [news.length]);

  const formattedDate = useMemo(() => {
    const d = new Date(activeSessionDate);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  }, [activeSessionDate]);

  const isUserAttending = attendees.some(a => a.id === currentUser.id);

  // Merge real news into headlines for the ticker
  const tickerItems = useMemo(() => {
    const realNewsTitles = news.map(n => n.title);
    return realNewsTitles.length > 0 ? [...realNewsTitles, ...FALLBACK_HEADLINES] : FALLBACK_HEADLINES;
  }, [news]);

  const statsCards = [
    { label: 'חברים', value: membersCount, icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-50', path: '/directory' },
    { label: 'תמונות', value: galleryCount, icon: ImageIcon, color: 'text-rose-500', bgColor: 'bg-rose-50', path: '/gallery' },
    { label: 'אירועים', value: eventsCount, icon: Calendar, color: 'text-indigo-500', bgColor: 'bg-indigo-50', path: '/events' },
    { label: 'תחזית', value: 'GoSurf', icon: Waves, color: 'text-sky-500', bgColor: 'bg-sky-50', path: 'https://gosurf.co.il/forecast/herzliya-marina', external: true },
    { label: 'מצלמת חוף', value: 'Live', icon: Video, color: 'text-violet-500', bgColor: 'bg-violet-50', path: 'https://beachcam.co.il/marina.html', external: true }
  ];

  const categoryTranslations: Record<string, string> = {
    'Update': 'עדכון',
    'Activity': 'פעילות',
    'Announcement': 'הודעה',
    'Personal': 'אישי',
    'Share': 'שיתוף'
  };

  const activePost = news[currentNewsIndex];

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto pb-10" dir="rtl">
      
      {/* News Ticker */}
      <div className="w-full bg-white text-slate-900 py-3 md:py-4 rounded-[1.5rem] md:rounded-full overflow-hidden flex items-center relative border border-slate-200 shadow-md h-14 md:h-16 group">
        <div className="absolute right-0 top-0 bottom-0 px-4 md:px-6 bg-slate-50 z-20 flex items-center gap-2 border-l border-slate-200 rounded-r-[1.5rem] md:rounded-r-full shadow-sm">
           <Radio size={14} className="text-rose-500 animate-pulse" />
           <span className="text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap text-slate-500">עדכוני סטריימר</span>
        </div>
        
        <div className="flex-1 overflow-hidden h-full flex items-center" dir="ltr">
          <div className="ticker-scroll-container group-hover:[animation-play-state:paused]">
            <div className="ticker-content-wrapper">
              {[...tickerItems, ...tickerItems].map((text, i) => (
                <div key={i} className="ticker-item">
                  <span className="ticker-text" dir="rtl">{text}</span>
                  <div className="ticker-dot"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full aspect-square md:aspect-video lg:min-h-[500px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 group">
        <img 
          src={heroBg} 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
        
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center py-10 px-6 text-center space-y-4 md:space-y-6">
          <p className="text-white/80 font-medium text-sm md:text-xl italic max-w-xl tracking-wider animate-in fade-in slide-in-from-top-6 duration-1000 text-center -mt-10 md:-mt-24 mb-4 md:mb-6 px-4 drop-shadow-lg">
            "A day will come that is like no other... and nothing that happens after will ever be the same."
          </p>

          <div className="space-y-2">
            <h2 
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-1 drop-shadow-2xl"
              style={{ color: '#F1D179' }}
            >
              יום חמישי הגדול
            </h2>
            <p className="text-white/90 font-black text-sm md:text-xl uppercase tracking-widest bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full border border-white/20">
               {formattedDate}
            </p>
          </div>

          <div className="pt-4">
             <button 
               onClick={async () => {
                 setIsProcessing(true);
                 try { await onToggleAttendance(); } finally { setIsProcessing(false); }
               }}
               disabled={isProcessing}
               className={`px-12 py-5 rounded-full font-black text-xl transition-all shadow-2xl active:scale-95 flex items-center gap-3 ${isUserAttending ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
             >
               {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Waves size={24} />}
               <span>{isUserAttending ? 'בטל הגעה' : 'אני מגיע/ה'}</span>
             </button>
             
             <button 
               onClick={() => setShowAttendees(true)}
               className="mt-6 text-white/70 hover:text-white font-black text-sm uppercase tracking-widest flex flex-col items-center gap-1 mx-auto transition-all group/stars active:scale-95"
             >
               <div className="flex items-center gap-2">
                 <Star size={18} className="text-yellow-400 fill-yellow-400 group-hover:scale-125 transition-transform" />
                 <span>{attendees.length} הכוכבים שאישרו הגעה</span>
               </div>
               <span className="text-[9px] text-white/40 group-hover:text-white/80 transition-colors bg-white/5 px-3 py-0.5 rounded-full border border-white/10 mt-1">
                 (לחץ כאן לצפייה בנבחרת ➔)
               </span>
             </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        {statsCards.map((card, i) => (
          <Link 
            key={i} 
            to={card.path} 
            target={card.external ? "_blank" : undefined}
            className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all group ${card.bgColor}`}
          >
            <div className={`mb-4 flex items-center justify-between ${card.color}`}>
               <card.icon size={28} className="group-hover:scale-110 transition-transform" />
               <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </div>
            <div className="space-y-1 text-right">
              <p className="text-2xl md:text-3xl font-black text-slate-950 tracking-tighter">{card.value}</p>
              <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* News Section with Rotation */}
      <div className="space-y-8 md:space-y-12">
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-black text-slate-950 flex items-center gap-3">
                 <Newspaper className="text-indigo-500" size={24} />
                 פוסטים
                 {news.length > 1 && (
                   <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100 animate-pulse">
                     רוטציה פעילה
                   </span>
                 )}
              </h3>
              <Link to="/news" className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">צפה בהכל</Link>
           </div>
           
           <div className="relative min-h-[160px]">
              {news.length > 0 && activePost ? (
                <Link 
                  key={activePost.id} 
                  to="/news" 
                  className="block p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-left-6 duration-1000"
                >
                  <div className="w-full md:w-32 h-32 md:h-32 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform flex-shrink-0 overflow-hidden">
                    {activePost.imageUrl ? (
                      <img src={activePost.imageUrl} className="w-full h-full object-cover rounded-2xl" alt="" />
                    ) : (
                      <Sparkles size={32} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-center md:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {categoryTranslations[activePost.category] || activePost.category} • {new Date(activePost.date).toLocaleDateString('he-IL')}
                    </p>
                    <h4 className="text-xl md:text-2xl font-black text-slate-950 group-hover:text-indigo-600 transition-colors truncate mb-2">{activePost.title}</h4>
                    <p className="text-sm md:text-base font-bold text-slate-500 leading-relaxed line-clamp-2 md:line-clamp-3">
                      {activePost.content}
                    </p>
                  </div>
                  <div className="hidden md:flex flex-col items-center gap-2">
                    <ArrowRight size={24} className="text-slate-200 group-hover:text-indigo-400 group-hover:-translate-x-1 transition-all flex-shrink-0" />
                    <div className="flex gap-1">
                      {news.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentNewsIndex ? 'bg-indigo-500 w-4' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <Newspaper size={32} />
                   </div>
                   <p className="text-slate-400 font-black text-lg">אין פוסטים חדשים כרגע.</p>
                </div>
              )}
           </div>
        </div>

        {/* Quotes and Dictionary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
           <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                    <Quote size={20} />
                 </div>
                 <h4 className="font-black text-slate-950 text-sm uppercase tracking-widest">ציטוט הגולשים</h4>
              </div>
              <div className="space-y-2 text-right">
                 <p className="text-lg font-black text-indigo-500 tracking-tight leading-relaxed italic">
                    "{SURF_QUOTES[quoteIndex].text}"
                 </p>
                 <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    — {SURF_QUOTES[quoteIndex].author}
                 </p>
              </div>
           </div>

           <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                    <BookOpen size={20} />
                 </div>
                 <h4 className="font-black text-slate-950 text-sm uppercase tracking-widest">מילון הגולשים</h4>
              </div>
              <div className="space-y-2 text-right">
                 <p className="text-lg font-black text-amber-500 tracking-tight">{SURF_DICTIONARY[dictionaryIndex].term}</p>
                 <p className="text-xs font-bold text-slate-500 leading-relaxed">
                   {SURF_DICTIONARY[dictionaryIndex].definition}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {showAttendees && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowAttendees(false)}>
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-2xl font-black text-slate-950 tracking-tighter">רשימת משתתפים</h3>
                 <button onClick={() => setShowAttendees(false)} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-950 transition-colors"><CloseIcon size={20} /></button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {attendees.length > 0 ? (
                   <div className="grid grid-cols-1 gap-3">
                      {attendees.map(a => (
                        <div key={a.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <img src={a.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                           <div className="flex-1 text-right">
                              <p className="font-black text-slate-950">{a.name}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.role === 'Admin' ? 'מנהל' : 'חבר נבחרת'}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="py-12 text-center text-slate-400 font-bold">טרם נרשמו חברים. תהיה הראשון!</div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
