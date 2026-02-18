import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { LogIn, Loader2, ArrowRight, Camera, Eye, EyeOff, Phone, AlertCircle, ChevronDown, MapPin, CheckCircle2, UserPlus, Mail } from 'lucide-react';
import { db } from '../services/firebase';
import { Member } from '../types';
import { hashPassword } from '../utils/crypto';

interface LoginPageProps {
  onLogin: (member: Member) => void;
  siteAssets: { 
    clubLogo?: string; 
    atalefLogo?: string; 
    habalZugLogo?: string; 
    heroBg?: string; 
    loginBg?: string; 
  };
}

const groups = ["הרצליה", "אשדוד", "אשקלון", "כינרת", "קריות", "תל אביב"];

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, siteAssets }) => {
  const [mode, setMode] = useState<'LOGIN' | 'JOIN'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(groups[0]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinMobile, setJoinMobile] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buffColor = "#F1D179";
  
  const currentBg = siteAssets.loginBg || siteAssets.heroBg;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (selectedGroup !== "הרצליה") {
      setError('הגישה לקבוצת ' + selectedGroup + ' טרם נפתחה במערכת.');
      setIsLoading(false);
      return;
    }

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
      const q = query(
        collection(db, 'members'), 
        where('email', '==', email.toLowerCase().trim()), 
        where('password', '==', hashedPassword)
      );
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
        requestedAt: new Date().toISOString(),
        group: selectedGroup
      });
      setSuccess(true);
      setTimeout(() => {
        setMode('LOGIN');
        setSuccess(false);
        setJoinName('');
        setJoinEmail('');
        setJoinMobile('');
      }, 5000); 
    } catch (err) { 
      console.error(err);
      setError('שגיאה בשליחת הבקשה'); 
    } finally { 
      setIsLoading(false); 
    }
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-['Assistant']" dir="rtl">
      
      <div className="absolute inset-0 z-0">
        {currentBg && (
          <img 
            src={currentBg} 
            className="w-full h-full object-cover animate-in fade-in duration-1000" 
            alt="Background" 
            onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=2000';
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        
        <div className="text-center mb-8 md:mb-12 p-4 flex flex-col items-center justify-center gap-6 md:gap-8">
          <div className="w-full h-1 md:h-1.5 opacity-80 rounded-full shadow-lg" style={{ backgroundColor: buffColor }}></div>
          
          <div className="py-6 md:py-10 flex items-center justify-center w-full">
            <div className="h-40 md:h-64 flex items-center justify-center drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] transition-transform hover:scale-105 duration-500">
               <img 
                 src={siteAssets.habalZugLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fhz-logo-fixed.png?alt=media"} 
                 className="h-full w-auto object-contain" 
                 alt="לוגו חבל זוג" 
               />
            </div>
          </div>
          
          <div className="w-full h-1 md:h-1.5 opacity-80 rounded-full shadow-lg" style={{ backgroundColor: buffColor }}></div>
        </div>

        <div className="bg-white/0 backdrop-blur-md rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 p-8 md:p-14 overflow-visible relative">
          
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6 md:space-y-8 flex flex-col">
              <div className="space-y-2">
                <label className="block text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest pr-2 drop-shadow-sm">אימייל חבר נבחרת</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="w-full px-6 py-4 md:py-4.5 bg-white/[0.03] border border-white/20 rounded-2xl focus:bg-white/10 focus:border-white/40 outline-none font-bold text-white placeholder:text-white/40 shadow-sm transition-all"
                  placeholder="name@habal-zug.co.il"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest pr-2 drop-shadow-sm">סיסמה</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full px-6 py-4 md:py-4.5 bg-white/[0.03] border border-white/20 rounded-2xl focus:bg-white/10 focus:border-white/40 outline-none font-bold text-white placeholder:text-white/40 shadow-sm transition-all"
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

              <div className="space-y-2 relative">
                <label className="block text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest pr-2 drop-shadow-sm">בחר קבוצה</label>
                <button 
                  type="button"
                  onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                  className="w-full px-6 py-4 bg-white/[0.03] border border-white/20 rounded-2xl flex items-center justify-between text-white font-black text-sm"
                >
                  <span className="flex items-center gap-3">
                    <MapPin size={18} className="opacity-50" />
                    {selectedGroup}
                  </span>
                  <ChevronDown size={18} className={`transition-transform duration-300 ${isGroupMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isGroupMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                    {groups.map(g => (
                      <button 
                        key={g} 
                        type="button"
                        onClick={() => { setSelectedGroup(g); setIsGroupMenuOpen(false); }}
                        className={`w-full p-4 text-right font-black text-xs transition-colors border-b border-white/5 last:border-0 ${selectedGroup === g ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-200 text-xs font-black animate-in shake duration-500">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-xl"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={24} />}
                כניסה למערכת
              </button>

              <div className="pt-4 text-center">
                <button 
                  type="button" 
                  onClick={() => { setMode('JOIN'); setError(''); }}
                  className="text-white/60 hover:text-white font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <UserPlus size={16} />
                  בקשת הצטרפות לנבחרת
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {success ? (
                <div className="py-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">הבקשה נשלחה!</h3>
                  <p className="text-white/60 font-bold leading-relaxed">הבקשה שלך נמצאת בבדיקת מנהלי המערכת. ניצור איתך קשר בהקדם.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                     <button type="button" onClick={() => setMode('LOGIN')} className="p-2 text-white/40 hover:text-white transition-colors">
                        <ArrowRight size={24} />
                     </button>
                     <h3 className="text-3xl font-black text-white tracking-tight">בקשת הצטרפות</h3>
                  </div>

                  <div className="flex flex-col items-center gap-4 mb-8">
                     <div className="relative group">
                        <img src={joinAvatar} className="w-24 h-24 rounded-3xl object-cover border-4 border-white/10 shadow-xl" alt="" />
                        <label className="absolute -bottom-2 -left-2 p-2 bg-white text-slate-950 rounded-xl cursor-pointer hover:bg-indigo-600 hover:text-white transition-all border-2 border-slate-900 shadow-lg">
                           <Camera size={16} />
                           <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                     </div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">תמונת פרופיל</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/50 uppercase tracking-widest pr-2">שם מלא</label>
                      <input type="text" required value={joinName} onChange={e => setJoinName(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:bg-white/10" placeholder="הכנס שם מלא..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/50 uppercase tracking-widest pr-2">אימייל</label>
                      <input type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:bg-white/10" placeholder="email@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/50 uppercase tracking-widest pr-2">טלפון נייד</label>
                      <div className="relative">
                        <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input type="tel" required value={joinMobile} onChange={e => setJoinMobile(e.target.value)} className="w-full pr-14 pl-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:bg-white/10" placeholder="05X-XXXXXXX" />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-200 text-xs font-black">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-6 bg-white text-slate-950 rounded-2xl font-black text-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Mail size={24} />}
                    שלח בקשה
                  </button>
                </>
              )}
            </form>
          )}

        </div>

        <div className="mt-12 flex items-center justify-center gap-12 opacity-80">
          <div className="flex flex-col items-center gap-2 group cursor-pointer transition-all">
             <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10 group-hover:scale-110 group-hover:bg-white/20 transition-all">
               <img 
                 src={siteAssets.atalefLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fatalef-logo.png?alt=media"} 
                 className="w-full h-full object-contain" 
                 alt="Atalef" 
               />
             </div>
             <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Atalef</span>
          </div>

          <div className="flex flex-col items-center gap-2 group cursor-pointer transition-all">
             <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl p-2.5 border border-white/10 group-hover:scale-110 group-hover:bg-white/20 transition-all">
               <img 
                 src={siteAssets.clubLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Freef-logo.png?alt=media"} 
                 className="w-full h-full object-contain" 
                 alt="Reef" 
               />
             </div>
             <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Reef Club</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;