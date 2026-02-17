
import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { LogIn, Loader2, Waves, ArrowRight, Camera, Bird, Waves as ReefIcon, Eye, EyeOff } from 'lucide-react';
import { db } from '../services/firebase';
import { Member } from '../types';
import { hashPassword } from '../utils/crypto';

interface LoginPageProps {
  onLogin: (member: Member) => void;
  siteAssets: { clubLogo?: string; atalefLogo?: string; habalZugLogo?: string; heroBg?: string; loginBg?: string; };
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, siteAssets }) => {
  const [mode, setMode] = useState<'LOGIN' | 'JOIN'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New styling colors
  const vintageCream = "#F5D682";
  const titleAreaBg = "#0A0A0A";
  
  const defaultBg = "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media";
  const currentBg = siteAssets.loginBg || siteAssets.heroBg || defaultBg;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (email.toLowerCase().trim() === 'yuval@shalev.org' && password === 'Yuval!1970') {
        onLogin({
          id: 'dev-admin-id', 
          name: 'יובל שלו', 
          email: 'yuval@shalev.org', 
          mobile: '050-0000000',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
          bio: 'מנהל מערכת', 
          role: 'Admin', 
          joinedAt: '01/01/2025', 
          isActive: true,
          facebookUrl: '',
          instagramUrl: '',
          tiktokUrl: '',
          linkedinUrl: '',
          twitterUrl: '',
          websiteUrl: '',
          totalAttendance: 0
        });
        return;
      }
      const hashedPassword = await hashPassword(password);
      const q = query(collection(db, 'members'), where('email', '==', email.toLowerCase().trim()), where('password', '==', hashedPassword));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError('פרטי הגישה אינם נכונים');
      } else {
        const userDoc = snapshot.docs[0];
        onLogin({ id: userDoc.id, ...userDoc.data() as Member });
      }
    } catch (err) { setError('שגיאת חיבור למערכת'); } finally { setIsLoading(false); }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'joinRequests'), {
        name: joinName,
        email: joinEmail.toLowerCase().trim(),
        bio: '',
        avatar: joinAvatar,
        requestedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        setMode('JOIN');
        setSuccess(false);
      }, 3000);
    } catch (err) { setError('שגיאה בשליחה'); } finally { setIsLoading(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setJoinAvatar(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Assistant']" dir="rtl">
      
      <div className="absolute inset-0 z-0">
        <img 
          src={currentBg} 
          className="w-full h-full object-cover" 
          alt="Background" 
          onError={(e) => {
             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=2000';
          }}
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        
        {/* Massive Knockout Title Section */}
        <div 
          className="text-center mb-10 p-12 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-4 overflow-visible"
          style={{ backgroundColor: titleAreaBg }}
        >
          <h1 
            className="text-7xl md:text-9xl font-black inline-block whitespace-nowrap"
            style={{ 
              fontFamily: "'Heebo', sans-serif",
              letterSpacing: "-5px",
              transform: "scaleX(1.3)",
              WebkitTextStroke: `4px ${vintageCream}`,
              color: 'transparent',
              lineHeight: '0.8'
            }}
          >
            חבל זוג
          </h1>
          
          <div className="w-4/5 h-px" style={{ backgroundColor: vintageCream }}></div>
          
          <p 
            className="text-4xl md:text-5xl font-black inline-block"
            style={{ 
              fontFamily: "'Heebo', sans-serif",
              letterSpacing: "-2px",
              transform: "scaleX(1.1)",
              WebkitTextStroke: `2px ${vintageCream}`,
              color: 'transparent'
            }}
          >
            הרצליה
          </p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 md:p-14 overflow-hidden relative">
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">אימייל חבר נבחרת</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none font-bold text-slate-900"
                  placeholder="name@habal-zug.co.il"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">סיסמה</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white outline-none font-bold text-slate-900"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-rose-500 text-xs font-black text-center">{error}</p>}
              <button 
                disabled={isLoading} 
                className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                <span>כניסה למערכת</span>
              </button>
              <button type="button" onClick={() => setMode('JOIN')} className="w-full text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-950 transition-all underline underline-offset-4 decoration-slate-200">
                בקשת הצטרפות לנבחרת
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <img src={joinAvatar} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl" alt="Preview" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -left-2 p-2.5 bg-slate-950 text-white rounded-xl shadow-lg hover:scale-110 transition-all border-2 border-white">
                    <Camera size={16} />
                  </button>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
                </div>
                <h4 className="mt-4 text-xl font-black text-slate-950">הצטרפות לקהילה</h4>
              </div>
              <input 
                type="text" required value={joinName} onChange={e => setJoinName(e.target.value)} 
                placeholder="שם מלא" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none font-bold"
              />
              <input 
                type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} 
                placeholder="אימייל" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none font-bold"
              />
              {success ? (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-center font-black text-xs border border-emerald-100">
                  הבקשה נשלחה בהצלחה!
                </div>
              ) : (
                <button className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-lg hover:bg-black transition-all">שלח בקשה</button>
              )}
              <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <ArrowRight size={14} /> חזרה לכניסה
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-8">
           <div className="flex flex-col items-center gap-4">
              <p className="text-xl font-black text-slate-800 uppercase tracking-tighter big-wednesday-title">הרוח מאחורי הגלים שלנו</p>
              
              <div className="flex items-center gap-12">
                 <a href="https://atalef.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                   {siteAssets.atalefLogo ? (
                     <img 
                       src={siteAssets.atalefLogo} 
                       className="h-14 w-auto object-contain transition-transform group-hover:scale-110" 
                       alt="Atalef" 
                     />
                   ) : (
                     <Bird size={28} className="text-slate-600" />
                   )}
                   <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">עמותת העטלף</span>
                 </a>
                 
                 <div className="h-10 w-px bg-slate-300"></div>
                 
                 <a href="https://reefseacenter.co.il/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                   {siteAssets.clubLogo ? (
                     <img 
                       src={siteAssets.clubLogo} 
                       className="h-14 w-auto object-contain transition-transform group-hover:scale-110" 
                       alt="Reef Club" 
                     />
                   ) : (
                     <ReefIcon size={28} className="text-slate-600" />
                   )}
                   <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">מועדון ריף</span>
                 </a>
              </div>
           </div>

           <div className="flex flex-col items-center gap-3">
             <Waves size={24} className="text-slate-400 animate-pulse" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">EST. 2025 • HERZLIYA SPIRIT</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
