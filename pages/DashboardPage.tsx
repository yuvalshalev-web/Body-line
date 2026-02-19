import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Image as ImageIcon, 
  Calendar, 
  Waves,
  Loader2,
  Video
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    members, galleryItems, events, attendeeIds, toggleSessionAttendance, siteAssets 
  } = useData();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const attendees = useMemo(() => members.filter(m => attendeeIds.includes(m.id)), [members, attendeeIds]);
  const isUserAttending = useMemo(() => currentUser ? attendeeIds.includes(currentUser.id) : false, [attendeeIds, currentUser]);

  // Logic to find the NEXT Thursday at 07:00
  const getNextThursdayTarget = () => {
    const now = new Date();
    const target = new Date(now);
    const day = now.getDay();
    
    // 4 is Thursday
    let daysToAdd = (4 - day + 7) % 7;
    
    // If it's already Thursday
    if (daysToAdd === 0) {
      // If we are past 07:00 today, the next target is next week
      if (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() >= 0)) {
        daysToAdd = 7;
      }
    }
    
    target.setDate(now.getDate() + daysToAdd);
    target.setHours(7, 0, 0, 0);
    return target;
  };

  useEffect(() => {
    const updateCountdown = () => {
      const target = getNextThursdayTarget();
      const diff = target.getTime() - new Date().getTime();
      
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
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-10" dir="rtl">
      {/* Hero Section */}
      <section className="relative w-full aspect-video rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 group">
        <img 
          src={siteAssets.heroBg || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media"} 
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] brightness-[0.7] group-hover:scale-105 transition-transform duration-[3000ms]" 
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center">
           
           {/* The "Big Thursday" Object */}
           <div className="flex flex-col items-center w-fit mx-auto mb-10">
              <p className="text-base md:text-xl italic text-white/90 mb-6 tracking-wide font-['Frank_Ruhl_Libre'] max-w-sm md:max-w-2xl leading-relaxed">
                "A day will come that is like no other... and nothing that happens after will ever be the same."
              </p>
              
              <div className="w-full h-[8px] rounded-full shadow-lg mb-2" style={{ backgroundColor: brandColor }}></div>
              
              <div className="flex flex-col items-center">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none" style={{ color: brandColor }}>
                  יום חמישי הגדול
                </h2>
              </div>
              
              <div className="w-full h-[8px] rounded-full shadow-lg mt-2 mb-8" style={{ backgroundColor: brandColor }}></div>

              {/* Sub-header for Countdown */}
              <p className="text-xl md:text-2xl font-black text-white/90 mb-4 tracking-tight drop-shadow-lg">
                סשן הגלישה הקרוב:
              </p>

              {/* Countdown set to LTR display: Days : Hours : Minutes : Seconds */}
              <div className="flex gap-4 font-black text-2xl md:text-4xl tracking-widest text-white/90" dir="ltr">
                 <div className="flex flex-col items-center">
                   <span>{String(countdown.days).padStart(2, '0')}</span>
                   <span className="text-[10px] uppercase opacity-50 -mt-1 font-bold">ימים</span>
                 </div>
                 <span className="opacity-30">:</span>
                 <div className="flex flex-col items-center">
                   <span>{String(countdown.hours).padStart(2, '0')}</span>
                   <span className="text-[10px] uppercase opacity-50 -mt-1 font-bold">שעות</span>
                 </div>
                 <span className="opacity-30">:</span>
                 <div className="flex flex-col items-center">
                   <span>{String(countdown.minutes).padStart(2, '0')}</span>
                   <span className="text-[10px] uppercase opacity-50 -mt-1 font-bold">דקות</span>
                 </div>
                 <span className="opacity-30">:</span>
                 <div className="flex flex-col items-center">
                   <span>{String(countdown.seconds).padStart(2, '0')}</span>
                   <span className="text-[10px] uppercase opacity-50 -mt-1 font-bold">שניות</span>
                 </div>
              </div>
           </div>

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
                    <img key={a.id} src={a.avatar} className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover" alt="" />
                  ))}
                  {attendees.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-black">
                      +{attendees.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-white/70 font-black text-sm group-hover:text-white">{attendees.length} חברים אישרו הגעה</span>
              </button>
           </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { label: 'חברים', value: members.length, icon: Users, path: '/directory', color: 'bg-emerald-50 text-emerald-600' },
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

      {showAttendees && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowAttendees(false)}>
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-slate-950">נבחרת הסשן</h3>
                <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-xl font-black text-sm">{attendees.length} גולשים</span>
              </div>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                {attendees.length > 0 ? attendees.map(a => (
                  <div key={a.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <img src={a.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                    <div>
                      <p className="font-black text-slate-900">{a.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.role === 'Admin' ? 'מנהל' : 'חבר'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center text-slate-400 font-bold">טרם אישרו הגעה... היו הראשונים!</div>
                )}
              </div>
              <button onClick={() => setShowAttendees(false)} className="w-full mt-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all">סגור</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;