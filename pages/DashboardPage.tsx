
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Image as ImageIcon, 
  TrendingUp, 
  Calendar, 
  Newspaper, 
  Sparkles, 
  Video, 
  Waves, 
  Sunrise, 
  CheckCircle2, 
  Circle,
  Users2,
  Zap,
  ExternalLink,
  BarChart,
  XCircle
} from 'lucide-react';
import { Member } from '../types';

interface DashboardPageProps {
  membersCount: number;
  galleryCount: number;
  eventsCount: number;
  newsCount: number;
  visitorStats: { daily: number; weekly: number; yearly: number };
  currentUser: Member;
  attendees: Member[];
  onToggleAttendance: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  membersCount, 
  galleryCount, 
  eventsCount, 
  newsCount,
  visitorStats,
  currentUser,
  attendees,
  onToggleAttendance
}) => {
  const isAttending = attendees.some(m => m.id === currentUser.id);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "בוקר טוב";
    if (hour >= 12 && hour < 18) return "צהריים טובים";
    if (hour >= 18 && hour < 24) return "ערב טוב";
    return "לילה טוב";
  };

  const getNextThursdayDate = () => {
    const now = new Date();
    const day = now.getDay();
    const targetDay = 4; // Thursday
    let daysUntil = (targetDay - day + 7) % 7;
    if (daysUntil === 0 && now.getHours() >= 12) daysUntil = 7;
    const nextThursday = new Date();
    nextThursday.setDate(now.getDate() + daysUntil);
    return nextThursday.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  };

  const nextThursdayFormatted = getNextThursdayDate();
  const greeting = getTimeGreeting();

  const gridItems = [
    { label: 'חברי קהילה', value: membersCount, icon: Users, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', path: '/directory', type: 'internal' },
    { label: 'תמונות בגלריה', value: galleryCount, icon: ImageIcon, bg: 'bg-rose-50', iconColor: 'text-rose-600', path: '/gallery', type: 'internal' },
    { label: 'אירועים קרובים', value: eventsCount, icon: Calendar, bg: 'bg-violet-50', iconColor: 'text-violet-600', path: '/events', type: 'internal' },
    { label: 'עדכוני חדשות', value: newsCount, icon: Newspaper, bg: 'bg-amber-50', iconColor: 'text-amber-600', path: '/news', type: 'internal' },
    { label: 'מצלמת המרינה', value: 'LIVE', icon: Video, bg: 'bg-indigo-50', iconColor: 'text-indigo-600', path: 'https://beachcam.co.il/marina.html', type: 'external', status: 'pulse' },
    { label: 'תחזית גלים', value: 'GoSurf', icon: Waves, bg: 'bg-cyan-50', iconColor: 'text-cyan-600', path: 'https://gosurf.co.il/forecast/herzliya-marina', type: 'external', status: 'zap' },
  ];

  const GLOBAL_LOGO = "https://i.postimg.cc/Mp1vktm0/org-Logo-bbd1959c-cef4-4677-8c9d-a5943034a63e.png";

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-50/40 rounded-full blur-[130px] -ml-64 -mb-64"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-50/20 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 text-right space-y-10">
        
        {/* Big Thursday Card - Now the Main Hero Element */}
        <div className="group rounded-[3.5rem] p-1 bg-gradient-to-br from-amber-600 via-orange-700 to-slate-900 shadow-2xl relative overflow-hidden transition-all duration-500 hover:-translate-y-1">
          {/* Background: Longboards in Cinematic Vintage Tone */}
          <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1414490929659-9a12b7e31907?auto=format&fit=crop&q=80&w=2000" 
               className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-all duration-[2000ms]" 
               alt="Big Thursday Sessions" 
             />
             <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/20 to-white/95"></div>
          </div>
          
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 space-y-8 text-center md:text-right">
              <div className="flex flex-col items-center md:items-start gap-3">
                 <span className="block text-xs font-black text-white/60 uppercase tracking-widest">הסשן הבא של הנבחרת</span>
                 <span className="block px-8 py-2.5 bg-slate-950 text-white rounded-full text-base font-black border border-white/20 shadow-xl">
                  {nextThursdayFormatted}
                </span>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter drop-shadow-sm filter brightness-0">יום חמישי הגדול</h3>
                <p className="text-slate-900 text-lg font-bold italic max-w-xl">
                  {greeting} {currentUser.name}, הים מחכה. הצטרף לחברים לסשן של זריחה וחברות אמיתית.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-slate-950 font-black text-sm bg-white/40 backdrop-blur-md rounded-full py-2 px-6 border border-white/50">
                  <Users2 size={18} className="text-orange-800" />
                  <span>{attendees.length} כוכבים כבר בפנים</span>
                </div>
                <div className="flex -space-x-3 space-x-reverse">
                  {attendees.slice(0, 5).map((attendee) => (
                    <img key={attendee.id} className="inline-block h-10 w-10 rounded-2xl ring-2 ring-white object-cover shadow-lg" src={attendee.avatar} alt={attendee.name} title={attendee.name} />
                  ))}
                  {attendees.length > 5 && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-orange-100 text-orange-900 ring-2 ring-white text-[10px] font-black">
                      +{attendees.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={onToggleAttendance} 
              className={`w-full md:w-80 py-8 rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 shadow-2xl relative overflow-hidden group/btn ${
                isAttending 
                ? 'bg-red-600 text-white border border-red-400 hover:bg-red-700 shadow-red-200' 
                : 'bg-slate-950 text-white hover:bg-black shadow-slate-900 ring-4 ring-slate-950/10'
              } ${!isAttending ? 'animate-[pulse_4s_infinite]' : ''}`}
            >
              {/* Shimmer Effect for the "I'm coming" state */}
              {!isAttending && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none"></div>
              )}
              
              {isAttending ? (
                <>
                  <XCircle size={32} />
                  <span>אופס - לא הגיע</span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Circle size={32} className="opacity-40" />
                    <Sparkles size={16} className="absolute -top-1 -right-1 text-indigo-400 animate-pulse" />
                  </div>
                  <span>אני בא/ה!</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Unified Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
          {gridItems.map((item) => {
            const commonClasses = "bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-center justify-center p-8 text-center group min-h-[12rem]";
            const iconContainer = (
              <div className={`w-14 h-14 ${item.bg} ${item.iconColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative`}>
                <item.icon size={28} />
                {item.status === 'pulse' && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
                {item.status === 'zap' && (
                  <Zap size={14} className="absolute -top-1 -right-1 text-yellow-600 animate-pulse" />
                )}
              </div>
            );

            if (item.type === 'internal') {
              return (
                <Link key={item.label} to={item.path} className={commonClasses}>
                  {iconContainer}
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-3xl font-black text-slate-950 tracking-tighter">{item.value}</p>
                </Link>
              );
            }

            return (
              <a key={item.label} href={item.path} target="_blank" rel="noopener noreferrer" className={commonClasses}>
                {iconContainer}
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">{item.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-black text-slate-950 tracking-tighter">{item.value}</p>
                  <ExternalLink size={14} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:col-span-2 bg-slate-50/80 rounded-[3.5rem] border border-slate-100 p-10 text-right backdrop-blur-sm">
             <div className="text-slate-900 text-xl font-bold leading-relaxed italic pr-8 border-r-4 border-indigo-600">
               "הים הוא המקום שבו אנחנו משאירים את הדאגות על החוף ומוצאים את עצמנו מחדש. בחבל זוג הרצליה אנחנו דואגים שלעולם לא תגלשו לבד."
             </div>
             <div className="flex items-center gap-4 mt-8 justify-end">
                <div className="flex items-center gap-3 text-xs font-black text-emerald-800 bg-emerald-100 px-5 py-3 rounded-2xl border border-emerald-200">
                  <TrendingUp size={18} />
                  קהילה בצמיחה
                </div>
                <div className="flex items-center gap-3 text-xs font-black text-white bg-slate-950 px-5 py-3 rounded-2xl shadow-xl">
                  <Users size={18} />
                  נבחרת מגובשת
                </div>
             </div>
          </div>
          
          <div className="bg-white rounded-[3.5rem] p-10 text-slate-950 border border-slate-100 shadow-xl relative overflow-hidden flex flex-col justify-center text-right">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16 border border-amber-200/50 opacity-40"></div>
            <div className="relative z-10">
              <p className="text-amber-800 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2 justify-end">
                מילון הים <Sparkles size={12} />
              </p>
              <p className="text-slate-950 font-black text-xl leading-snug mb-8 italic">"תמיד תבדקו את התחזית לפני שיוצאים, אבל הכי חשוב - תהנו מהחברים שסביבכם."</p>
              <div className="flex items-center gap-4 justify-end">
                <div className="text-right">
                  <span className="block text-sm font-black text-slate-950">חבל זוג הרצליה</span>
                  <span className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">צוות ניהול</span>
                </div>
                <img src={GLOBAL_LOGO} alt="חבל זוג הרצליה" className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-100 object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Visitor Stats Row - Compact & One Line */}
        <div className="pt-10 border-t border-slate-100 flex flex-nowrap items-center justify-center gap-4 md:gap-8 overflow-x-auto pb-4">
          <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-full text-center shadow-sm whitespace-nowrap min-w-fit flex flex-col items-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Zap size={10} className="text-amber-500" /> מס' מבקרים היום
            </p>
            <p className="text-xl font-black text-slate-950 tracking-tighter">{visitorStats.daily}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-full text-center shadow-sm whitespace-nowrap min-w-fit flex flex-col items-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <TrendingUp size={10} className="text-indigo-500" /> מס' מבקרים השבוע
            </p>
            <p className="text-xl font-black text-slate-950 tracking-tighter">{visitorStats.weekly}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-full text-center shadow-sm whitespace-nowrap min-w-fit flex flex-col items-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <BarChart size={10} className="text-emerald-500" /> מס' מבקרים השנה
            </p>
            <p className="text-xl font-black text-slate-950 tracking-tighter">{visitorStats.yearly}</p>
          </div>
        </div>
      </div>
      
      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
