
import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { LogIn, Loader2, Waves, ArrowRight, Camera, Bird, Waves as ReefIcon, Eye, EyeOff, Phone, AlertCircle } from 'lucide-react';
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
  const [joinMobile, setJoinMobile] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buffColor = "#F1D179";
  
  const defaultBg = "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media";
  const currentBg = siteAssets.loginBg || siteAssets.heroBg || defaultBg;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (email.toLowerCase().trim() === 'yuval@shalev.org' && password === 'Yuval!1970') {
        const devHashedPassword = await hashPassword('Yuval!1970');
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
          password: devHashedPassword,
          facebookUrl: '',
          instagramUrl: '',
          tiktokUrl: '',
          linkedinUrl: '',
          twitterUrl: '',
          websiteUrl: '',
          totalAttendance: 0,
          loginCount: 999
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
        const memberData = userDoc.data() as Member;
        
        if (memberData.isActive === false) {
          setError('חשבונך אינו פעיל. פנה למנהל המערכת.');
          return;
        }

        // Update login count for analytics
        await updateDoc(doc(db, 'members', userDoc.id), {
          loginCount: increment(1)
        });
        
        onLogin({ id: userDoc.id, ...memberData, loginCount: (memberData.loginCount || 0) + 1 });
      }
    } catch (err) { 
      console.error(err);
      setError('שגיאת חיבור למערכת'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'joinRequests'), {
        name: joinName,
        email: joinEmail.toLowerCase().trim(),
        mobile: joinMobile,
        bio: '',
        avatar: joinAvatar,
        requestedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        setMode('LOGIN');
        setSuccess(false);
        setJoinName('');
        setJoinEmail('');
        setJoinMobile('');
      }, 5000); 
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-['Assistant']" dir="rtl">
      
      <div className="absolute inset-0 z-0">
        <img 
          src={currentBg} 
          className="w-full h-full object-cover" 
          alt="Background" 
          onError={(e) => {
             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=2000';
          }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        
        {/* Branding Section */}
        <div className="text-center mb-10 md:mb-14 p-4 flex flex-col items-center justify-center gap-6 md:gap-10">
          <div className="w-full h-1 md:h-2 opacity-80 rounded-full shadow-lg" style={{ backgroundColor: buffColor }}></div>
          
          <div className="py-2">
            <h1 className="text-7xl sm:text-9xl md:text-[9rem] font-black inline-block whitespace-nowrap tracking-tighter leading-none drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]" style={{ color: buffColor }}>
              חבל זוג
            </h1>
            <div className="w-full flex justify-center py-4">
               <div className="w-1/2 h-px opacity-40" style={{ backgroundColor: buffColor }}></div>
            </div>
            <p className="text-5xl sm:text-7xl md:text-6xl font-black inline-block tracking-tighter drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]" style={{ color: buffColor }}>
              הרצליה
            </p>
          </div>
          
          <div className="w-full h-1 md:h-2 opacity-80 rounded-full shadow-lg" style={{ backgroundColor: buffColor }}></div>
        </div>

        {/* Form Container - High Transparency & Deep Glass Effect */}
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20 p-8 md:p-14 overflow-hidden relative">
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6 md:space-y-8 flex flex-col">
              <div className="space-y-2">
                <label className="block text-[10px] md:text-[11px] font-black text-white/90 uppercase tracking-widest pr-2">אימייל חבר נבחרת</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="w-full px-6 py-4 md:py-4.5 bg-white/10 border border-white/20 rounded-2xl focus:bg-white/20 outline-none font-bold text-white placeholder:text-white/30 shadow-sm transition-all"
                  placeholder="name@habal-zug.co.il"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] md:text-[11px] font-black text-white/90 uppercase tracking-widest pr-2">סיסמה</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full px-6 py-4 md:py-4.5 bg-white/10 border border-white/20 rounded-2xl focus:bg-white/20 outline-none font-bold text-white placeholder:text-white/30 shadow-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/30 backdrop-blur-md p-4 rounded-xl border border-rose-500/40 animate-in shake duration-300">
                  <AlertCircle size={16} className="text-white shrink-0" />
                  <p className="text-white text-xs font-black">{error}</p>
                </div>
              )}

              {/* Smaller, Eye-catching Wave Button */}
              <div className="flex justify-center pt-2">
                <button 
                  disabled={isLoading} 
                  className="btn-wave-effect min-w-[200px] w-fit px-10 py-3 text-white rounded-full font-black text-lg shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all group overflow-hidden"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Waves className="group-hover:animate-bounce transition-all text-white/80" size={20} style={{ color: buffColor }} />
                  )}
                  <span className="relative z-10 drop-shadow-md animate-text-wave" style={{ color: buffColor }}>כניסה למערכת</span>
                </button>
              </div>

              <button type="button" onClick={() => setMode('JOIN')} className="w-full mt-4 text-[10px] md:text-xs font-black text-white/80 uppercase tracking-widest hover:text-white transition-all underline underline-offset-4 decoration-white/40">
                בקשת הצטרפות לנבחרת
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-4 md:space-y-6">
              <div className="flex flex-col items-center mb-2">
                <div className="relative group">
                  <img src={joinAvatar} className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-3xl object-cover border-4 border-white/20 shadow-xl" alt="Preview" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1.5 -left-1.5 p-2 bg-white text-slate-950 rounded-xl shadow-lg hover:scale-110 transition-all border-2 border-white/20 active:scale-90">
                    <Camera size={14} />
                  </button>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
                </div>
                <h4 className="mt-4 text-xl font-black text-white">הצטרפות לקהילה</h4>
              </div>
              <input 
                type="text" required value={joinName} onChange={e => setJoinName(e.target.value)} 
                placeholder="שם מלא" className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white outline-none font-bold shadow-sm placeholder:text-white/30"
              />
              <input 
                type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} 
                placeholder="אימייל" className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white outline-none font-bold shadow-sm placeholder:text-white/30"
              />
              <div className="relative">
                <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="tel" required value={joinMobile} onChange={e => setJoinMobile(e.target.value)} 
                  placeholder="טלפון נייד" className="w-full pr-14 pl-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white outline-none font-bold shadow-sm placeholder:text-white/30"
                />
              </div>
              {success ? (
                <div className="bg-emerald-500/40 backdrop-blur-md text-white p-6 rounded-2xl text-center font-black text-sm border border-emerald-500/50 leading-relaxed animate-in zoom-in-95">
                  איזה כיף! סיסמא זמנית תשלח בוואטסאפ לנייד שלך
                </div>
              ) : (
                <div className="flex justify-center">
                  <button disabled={isLoading} className="btn-wave-effect px-12 py-4 text-white rounded-full font-black text-lg active:scale-95 transition-all shadow-xl">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'שלח בקשה'}
                  </button>
                </div>
              )}
              <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-[10px] md:text-xs font-black text-white/80 uppercase tracking-widest flex items-center justify-center gap-2">
                <ArrowRight size={14} /> חזרה לכניסה
              </button>
            </form>
          )}
        </div>

        <div className="mt-10 md:mt-12 flex flex-col items-center gap-6 md:gap-8">
           <div className="flex flex-col items-center gap-3">
              <p className="text-lg md:text-xl font-black text-white uppercase tracking-tighter drop-shadow-lg opacity-90">הרוח מאחורי הגלים שלנו</p>
              <div className="flex items-center gap-8 md:gap-12">
                 <a href="https://atalef.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1">
                   <img src={siteAssets.atalefLogo || "https://atalef.com/wp-content/uploads/2021/05/logo.png"} className="h-10 md:h-12 w-auto transition-all opacity-100 drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]" alt="Atalef" />
                 </a>
                 <div className="w-px h-8 bg-white/20"></div>
                 <div className="flex flex-col items-center gap-1">
                   <img src={siteAssets.habalZugLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Flogo.png?alt=media"} className="h-12 md:h-16 w-auto drop-shadow-lg opacity-100" alt="Habal Zug" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
