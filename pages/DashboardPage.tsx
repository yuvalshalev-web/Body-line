
import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  Star,
  AlertCircle
} from 'lucide-react';
import { Member, NewsItem } from '../types';
import { GoogleGenAI } from "@google/genai";

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

interface DictionaryTerm {
  term: string;
  definition: string;
}

interface QuoteItem {
  text: string;
  author: string;
}

const FALLBACK_QUOTES: QuoteItem[] = [
  { text: "אתה לא יכול לעצור את הגלים, אבל אתה יכול ללמוד לגלוש עליהם.", author: "ג'ון קבט-זין" },
  { text: "גלישה היא הדרך שלי להתחבר לכוח של הטבע ולמצוא שקט פנימי.", author: "ג'ון ג'ון פלורנס" },
  { text: "הים הוא המקום היחיד שבו אני מרגיש באמת חופשי.", author: "גולש חבל זוג" },
  { text: "יום רע בים תמיד טוב יותר מיום טוב במשרד.", author: "עממי" },
  { text: "הגל הכי טוב בחיים שלך הוא הגל הבא שתתפוס.", author: "נבחרת חבל זוג" }
];

const FALLBACK_DICTIONARY: DictionaryTerm[] = [
  { term: "אופשור (Offshore)", definition: "רוח הנושבת מהיבשה אל הים. הרוח ה'טובה' שמיישרת את הגלים ויוצרת צינורות." },
  { term: "ליינאפ (Lineup)", definition: "האזור בים שבו הגולשים מחכים מעבר לקצף כדי לתפוס את הגלים." },
  { term: "דאק דייב (Duck Dive)", definition: "צלילה מתחת לגל הנשבר עם הגלשן כדי לעבור אותו בקלות." }
];

const QUOTES_CACHE_KEY = 'habal_zug_quotes_cache_v2';
const DICT_CACHE_KEY = 'habal_zug_dict_cache_v2';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days cache to reduce AI requests

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  membersCount, galleryCount, eventsCount, newsCount,
  currentUser, attendees, onToggleAttendance, heroBg, activeSessionDate, news, siteAssets
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const [quotes, setQuotes] = useState<QuoteItem[]>(() => {
    const cached = localStorage.getItem(QUOTES_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return shuffleArray(parsed.data);
      } catch (e) { return FALLBACK_QUOTES; }
    }
    return FALLBACK_QUOTES;
  });
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuotesLoading, setIsQuotesLoading] = useState(false);

  const [dictionary, setDictionary] = useState<DictionaryTerm[]>(() => {
    const cached = localStorage.getItem(DICT_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return shuffleArray(parsed.data);
      } catch (e) { return FALLBACK_DICTIONARY; }
    }
    return FALLBACK_DICTIONARY;
  });
  const [dictionaryIndex, setDictionaryIndex] = useState(0);
  const [isDictLoading, setIsDictLoading] = useState(false);

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  const fetchQuotesData = useCallback(async (force = false) => {
    if (!force) {
      const cached = localStorage.getItem(QUOTES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY) return;
      }
    }

    setIsQuotesLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide 10-15 best surf quotes. Return ONLY JSON array of {text, author} in Hebrew.`,
      });

      const text = response.text || "[]";
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuotes(shuffleArray(parsed));
        localStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify({ data: parsed, timestamp: Date.now() }));
      }
    } catch (err: any) {
      console.warn("Gemini Quotes Fetch Failed (likely quota):", err.message);
      // Silent fail, keep using fallbacks or existing cache
    } finally {
      setIsQuotesLoading(false);
    }
  }, []);

  const fetchDictionaryData = useCallback(async (force = false) => {
    if (!force) {
      const cached = localStorage.getItem(DICT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY) return;
      }
    }

    setIsDictLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide 10 surfing glossary terms with simple definitions in Hebrew. Return ONLY JSON array of {term, definition}.`,
      });

      const text = response.text || "[]";
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        setDictionary(shuffleArray(parsed));
        localStorage.setItem(DICT_CACHE_KEY, JSON.stringify({ data: parsed, timestamp: Date.now() }));
      }
    } catch (err: any) {
      console.warn("Gemini Dictionary Fetch Failed (likely quota):", err.message);
    } finally {
      setIsDictLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotesData();
    fetchDictionaryData();
  }, [fetchQuotesData, fetchDictionaryData]);

  useEffect(() => {
    if (quotes.length <= 1) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 60000);
    return () => clearInterval(interval);
  }, [quotes]);

  useEffect(() => {
    if (dictionary.length <= 1) return;
    const interval = setInterval(() => {
      setDictionaryIndex((prev) => (prev + 1) % dictionary.length);
    }, 60000);
    return () => clearInterval(interval);
  }, [dictionary]);

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

  const statsCards = [
    { label: 'חברים', value: membersCount, icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-50', path: '/directory' },
    { label: 'תמונות', value: galleryCount, icon: ImageIcon, color: 'text-rose-500', bgColor: 'bg-rose-50', path: '/gallery' },
    { label: 'אירועים', value: eventsCount, icon: Calendar, color: 'text-indigo-500', bgColor: 'bg-indigo-50', path: '/events' },
    { label: 'תחזית', value: 'GoSurf', icon: Waves, color: 'text-sky-500', bgColor: 'bg-sky-50', path: 'https://gosurf.co.il/forecast/herzliya-marina', external: true },
    { label: 'BeachCam', value: 'Live', icon: Video, color: 'text-violet-500', bgColor: 'bg-violet-50', path: 'https://beachcam.co.il/marina.html', external: true }
  ];

  const activePost = news[currentNewsIndex];
  const activeTerm = dictionary[dictionaryIndex];
  const activeQuote = quotes[quoteIndex];

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto pb-10" dir="rtl">
      
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
               className="mt-6 text-white/70 hover:text-white font-black text-sm uppercase tracking-widest flex flex-col items-center gap-1 mx-auto transition-all group/stars active:scale-90"
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

      {/* Tickers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
           <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <button 
                onClick={() => fetchQuotesData(true)}
                disabled={isQuotesLoading}
                className="absolute top-8 left-8 p-2 text-slate-300 hover:text-indigo-500 transition-colors z-20 disabled:opacity-50"
                title="רענן ציטוטים"
              >
                 <RefreshCw size={18} className={isQuotesLoading ? 'animate-spin' : ''} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                    <Quote size={20} />
                 </div>
                 <h4 className="font-black text-slate-950 text-sm uppercase tracking-widest">ציטוט הגולשים</h4>
              </div>

              <div className="relative min-h-[100px]">
                {activeQuote && (
                  <div key={quoteIndex} className="space-y-3 text-right animate-in fade-in slide-in-from-left-4 duration-700">
                     <p className="text-lg font-black text-indigo-500 tracking-tight leading-relaxed italic">
                        "{activeQuote.text}"
                     </p>
                     <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                        — {activeQuote.author}
                     </p>
                  </div>
                )}
                {isQuotesLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                    <Loader2 className="animate-spin text-indigo-600" size={20} />
                  </div>
                )}
              </div>
           </div>

           <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <button 
                onClick={() => fetchDictionaryData(true)}
                disabled={isDictLoading}
                className="absolute top-8 left-8 p-2 text-slate-300 hover:text-amber-500 transition-colors z-20 disabled:opacity-50"
                title="רענן מונחים"
              >
                 <RefreshCw size={18} className={isDictLoading ? 'animate-spin' : ''} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                    <BookOpen size={20} />
                 </div>
                 <h4 className="font-black text-slate-950 text-sm uppercase tracking-widest">מילון הגולשים</h4>
              </div>

              <div className="relative min-h-[120px]">
                {activeTerm && (
                  <div key={activeTerm.term} className="space-y-2 text-right animate-in fade-in slide-in-from-left-4 duration-700">
                     <p className="text-lg font-black text-amber-500 tracking-tight flex items-center gap-2">
                       {activeTerm.term}
                       <Sparkles size={14} className="opacity-40" />
                     </p>
                     <p className="text-xs font-bold text-slate-500 leading-relaxed">
                       {activeTerm.definition}
                     </p>
                  </div>
                )}
                {isDictLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                    <Loader2 className="animate-spin text-amber-600" size={20} />
                  </div>
                )}
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
