
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
  currentUser, attendees, onToggleAttendance, heroBg, activeSessionDate, siteAssets, news
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
    { label: 'חברי קהילה', value: membersCount, icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-50', path: '/directory' },
    { label: 'תמונות בגלריה', value: galleryCount, icon: ImageIcon, color: 'text-rose-500', bgColor: 'bg-rose-50', path: '/gallery' },
    { label: 'אירועים קרובים', value: eventsCount, icon: Calendar, color: 'text-indigo-500', bgColor: 'bg-indigo-50', path: '/events' },
    { label: 'תחזית גלים', value: 'GoSurf', icon: Waves, color: 'text-sky-500', bgColor: 'bg-sky-50', path: 'https://gosurf.co.il/forecast/herzliya-marina', external: true }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-right max-w-4xl mx-auto pb-12" dir="rtl">
      
      {/* Hero Section - RETURNED TO FULL IMMERSIVE DESIGN */}
      <section className="relative w-full min-h-[420px] rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 group">
        <img 
          src={heroBg} 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
        
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center py-14 px-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-1 drop-shadow-2xl">
              יום חמישי הגדול
            </h2>
            <p className="text-white/90 font-black text-lg md:text-xl uppercase tracking-widest bg-white/10 backdrop-blur-sm inline-block px-6 py-2 rounded-full border border-white/10">
              הסשן הקרוב • {formattedDate}
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4 pt-4">
            <button 
              onClick={async () => { setIsProcessing(true); try { await onToggleAttendance(); } finally { setIsProcessing(false); } }}
              disabled={isProcessing}
              className={`w-full py-5 rounded-[2rem] font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 ${isUserAttending ? 'bg-rose-600 text-white' : 'bg-white text-slate-950 hover:bg-slate-100'}`}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={24} /> : (isUserAttending ? 'רשום • ביטול?' : 'אני מגיע!')}
              {!isProcessing && <Sparkles size={20} className={isUserAttending ? 'text-white' : 'text-indigo-600'} />}
            </button>
            <button onClick={() => attendees.length > 0 && setShowAttendees(true)} className="text-white/60 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full">
              {attendees.length} חברים כבר נרשמו • מי בא?
            </button>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statsCards.map((card, idx) => {
          const content = (
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-xl transition-all group h-full">
              <div className={`w-12 h-12 ${card.bgColor} rounded-2xl flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                <card.icon size={22} />
              </div>
              <div className="text-center">
                <p className="text-slate-600 font-black text-[9px] uppercase tracking-widest mb-1">{card.label}</p>
                <h4 className="text-2xl font-black text-slate-950">{card.value}</h4>
              </div>
            </div>
          );
          return card.external ? <a key={idx} href={card.path} target="_blank" rel="noopener noreferrer" className="block">{content}</a> : <Link key={idx} to={card.path} className="block">{content}</Link>;
        })}
      </div>

      {/* Latest Posts Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
             <Newspaper className="text-slate-950" size={20} />
             <h3 className="text-2xl font-black text-slate-950">פוסטים אחרונים</h3>
          </div>
          <Link to="/news" className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
            לכל הכתבות <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestNews.length > 0 ? latestNews.map((item) => (
            <Link key={item.id} to="/news" className="group bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all flex flex-col gap-4">
              <div className="aspect-[16/9] rounded-[1.5rem] overflow-hidden bg-slate-50 relative">
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
                <h4 className="font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{item.title}</h4>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                     <Bird size={10} />
                  </div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.authorName}</span>
                </div>
              </div>
            </Link>
          )) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2.5rem] text-slate-500 font-black text-sm italic">ממתינים לעדכונים ראשונים...</div>
          )}
        </div>
      </section>

      {/* Beach Cam Section */}
      <section className="rounded-[3.5rem] p-10 md:p-14 text-slate-950 relative overflow-hidden bg-white/30 backdrop-blur-md border border-slate-200 shadow-xl flex flex-col md:flex-row items-center gap-10 group/camsection">
         <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
            <Waves size={400} className="absolute -top-20 -right-20 text-indigo-900" />
         </div>
         
         <div className="flex-1 space-y-6 relative z-10 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
              <span className="text-xs font-black text-rose-500 uppercase tracking-[0.4em]">LIVE BEACH CAM</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-none text-slate-900">תבדוק את המצב בזמן אמת</h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-md mx-auto md:mx-0">
               צפה בשידור חי מחוף המרינה בהרצליה. אל תצא מהבית לפני שאתה מוודא שיש גלים.
            </p>
            <a 
              href="https://beachcam.co.il/marina.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-3 px-10 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs hover:bg-indigo-600 transition-all group shadow-xl"
            >
               לצפייה בשידור החי <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
         </div>

         {/* Go Surf Style Thumbnail UI */}
         <div className="w-full md:w-1/2 aspect-video rounded-[2.5rem] bg-slate-950 border border-slate-200 overflow-hidden relative shadow-2xl group cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=1200" 
              className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
              alt="Live Cam Preview" 
            />
            
            {/* GO SURF UI Overlays */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors"></div>
            
            {/* Top Left: LIVE Badge */}
            <div className="absolute top-5 left-5 px-3 py-1 bg-rose-600 rounded-lg flex items-center gap-2 shadow-lg z-20">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE</span>
            </div>

            {/* Top Right: Provider ID */}
            <div className="absolute top-5 right-5 flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 z-20">
               <span className="text-[9px] font-black text-white uppercase tracking-widest">BEACHCAM.CO.IL</span>
            </div>

            {/* Center: Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white/40 transition-all duration-300">
                  <Play size={40} fill="white" className="text-white ml-2" />
               </div>
            </div>

            {/* Bottom Overlay: Location Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-white/60" />
                    <span className="text-white font-black text-sm tracking-tight">מרינה הרצליה • מבט דרומה</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">HD ONLINE</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Surf Wisdom (Quotes) Section */}
      <section className="bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl border border-slate-800">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <ReefIcon size={300} className="absolute -bottom-20 -left-20 text-white" />
         </div>
         <div className="relative z-10 flex flex-col items-center text-center gap-6">
            <Quote className="text-indigo-400 opacity-50" size={48} />
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-2xl md:text-3xl font-black italic tracking-tight leading-relaxed">
                "{SURF_QUOTES[quoteIndex].text}"
              </h3>
              <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.3em]">
                — {SURF_QUOTES[quoteIndex].author}
              </p>
            </div>
            <button 
              onClick={() => setQuoteIndex((prev) => (prev + 1) % SURF_QUOTES.length)}
              className="mt-4 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <RefreshCw size={18} className="text-slate-400" />
            </button>
         </div>
      </section>

      {/* Surf Dictionary Section */}
      <section className="bg-indigo-950 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl border border-indigo-900">
         <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <Wind size={300} className="absolute -top-20 -right-20 text-white" />
         </div>
         <div className="relative z-10 flex flex-col items-center text-center gap-6">
            <div className="flex items-center gap-3">
              <BookOpen className="text-indigo-400 opacity-50" size={32} />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">מילון הגולש</span>
            </div>
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-2xl md:text-3xl font-black italic tracking-tight leading-relaxed">
                {SURF_DICTIONARY[dictionaryIndex].term}
              </h3>
              <p className="text-slate-300 font-bold text-sm leading-relaxed max-w-lg mx-auto">
                {SURF_DICTIONARY[dictionaryIndex].definition}
              </p>
            </div>
            <button 
              onClick={() => setDictionaryIndex((prev) => (prev + 1) % SURF_DICTIONARY.length)}
              className="mt-4 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <RefreshCw size={18} className="text-slate-400" />
            </button>
         </div>
      </section>

      {/* Attendees Modal */}
      {showAttendees && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowAttendees(false)}>
           <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[70vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-950">נרשמו לסשן</h3>
                 <button onClick={() => setShowAttendees(false)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><CloseIcon size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                 <div className="grid grid-cols-2 gap-6">
                    {attendees.map(a => (
                      <div key={a.id} className="flex flex-col items-center gap-3 group">
                          <img src={a.avatar} className="w-20 h-20 rounded-[1.5rem] object-cover border-2 border-slate-50 group-hover:border-indigo-100 transition-all" alt={a.name} />
                          <h4 className="font-black text-slate-900 text-xs">{a.name}</h4>
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
