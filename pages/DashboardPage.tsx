
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
  Video
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

  const latestNews = useMemo(() => news.slice(0, 4), [news]);
  const isUserAttending = attendees.some(a => a.id === currentUser.id);

  const statsCards = [
    { label: 'חברים', value: membersCount, icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-50', path: '/directory' },
    { label: 'תמונות', value: galleryCount, icon: ImageIcon, color: 'text-rose-500', bgColor: 'bg-rose-50', path: '/gallery' },
    { label: 'אירועים', value: eventsCount, icon: Calendar, color: 'text-indigo-500', bgColor: 'bg-indigo-50', path: '/events' },
    { label: 'תחזית', value: 'GoSurf', icon: Waves, color: 'text-sky-500', bgColor: 'bg-sky-50', path: 'https://gosurf.co.il/forecast/herzliya-marina', external: true }
  ];

  const categoryTranslations: Record<string, string> = {
    'Update': 'עדכון',
    'Activity': 'פעילות',
    'Announcement': 'הודעה',
    'Personal': 'אישי',
    'Share': 'שיתוף'
  };

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in duration-700 max-w-5xl mx-auto pb-10" dir="rtl">
      
      {/* Hero Section */}
      <section className="relative w-full aspect-square md:aspect-video lg:min-h-[500px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 group">
        <img 
          src={heroBg} 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
        
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center py-10 px-6 text-center space-y-5 md:space-y-8">
          <div className="space-y-2">
            <h2 
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-1 drop-shadow-2xl"
              style={{ color: '#F1D179' }}
            >
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

      {/* Main Stats Hub - Replicating exact image style */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4">
          <Sparkles className="text-slate-950" size={20} />
          <h3 className="text-xl md:text-2xl font-black text-slate-950">סטטיסטיקה וגלים</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statsCards.map((card, idx) => {
            const content = (
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center gap-4 hover:shadow-xl transition-all group h-full active:scale-95">
                <div className={`w-14 h-14 md:w-16 md:h-16 ${card.bgColor} rounded-[1.25rem] flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform shadow-sm border border-slate-100/50`}>
                  <card.icon size={26} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-slate-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-0.5">{card.label}</p>
                  <h4 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">{card.value}</h4>
                </div>
              </div>
            );
            return card.external ? <a key={idx} href={card.path} target="_blank" rel="noopener noreferrer" className="block">{content}</a> : <Link key={idx} to={card.path} className="block">{content}</Link>;
          })}
        </div>
      </div>

      {/* Latest Posts Thumbnails - Using the same visual style as Stats */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Newspaper className="text-slate-950" size={20} />
            <h3 className="text-xl md:text-2xl font-black text-slate-950">פוסטים אחרונים</h3>
          </div>
          <Link to="/news" className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
            לכל הכתבות <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {latestNews.map((item) => (
            <Link key={item.id} to="/news" className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center gap-4 hover:shadow-xl transition-all group h-full active:scale-95 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform overflow-hidden relative shadow-sm border border-slate-100">
                {item.imageUrl ? (
                  <img src={item.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                ) : (
                  <Newspaper size={26} />
                )}
                <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-0.5">{categoryTranslations[item.category] || item.category}</p>
                <h4 className="text-sm md:text-lg font-black text-slate-900 line-clamp-2 px-1 leading-tight tracking-tight">{item.title}</h4>
              </div>
            </Link>
          ))}
          {/* If less than 4 news, fill with Live Cam or placeholders */}
          {latestNews.length < 4 && (
            <a 
              href="https://beachcam.co.il/marina.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center gap-4 hover:shadow-xl transition-all group h-full active:scale-95 text-center"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-rose-50 rounded-[1.25rem] flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform relative shadow-sm border border-slate-100">
                <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse z-10"></div>
                <Video size={26} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-0.5">מבט לים</p>
                <h4 className="text-lg md:text-2xl font-black text-slate-900 px-1 leading-none tracking-tighter">Live</h4>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Surf Dictionary/Quotes */}
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
