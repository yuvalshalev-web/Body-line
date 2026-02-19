import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { LogIn, Loader2, ArrowRight, Camera, Eye, EyeOff, Phone, AlertCircle, ChevronDown, MapPin, CheckCircle2, UserPlus, Mail, RotateCcw, X, UserCheck, Sparkles } from 'lucide-react';
import { db } from '../services/firebase';
import { Member } from '../types';
import { hashPassword } from '../utils/crypto';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const groups = ["הרצליה", "אשדוד", "אשקלון", "כינרת", "קריות", "תל אביב"];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { siteAssets } = useData();

  const [mode, setMode] = useState<'LOGIN' | 'JOIN'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(groups[0]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinMobile, setJoinMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buffColor = "#F1D179";
  const currentBg = siteAssets?.loginBg || siteAssets?.heroBg || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=2000';
  const logoUrl = siteAssets?.habalZugLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fhz-logo-fixed.png?alt=media";

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
        login({
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
        
        login({ id: userDoc.id, ...memberData, loginCount: (memberData.loginCount || 0) + 1 });
      }
    } catch (err) { 
      console.error(err);
      setError('שגיאת חיבור למערכת'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove non-digits
    const digits = value.replace(/\D/g, '').slice(0, 10);
    
    // Automatically add hyphen after prefix (05X-)
    let formatted = digits;
    if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    
    setJoinMobile(formatted);
    setMobileError('');
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMobileError('');
    
    // Validate Mobile Format
    const mobileRegex = /^05\d{1}-?\d{7}$/;
    if (!mobileRegex.test(joinMobile)) {
      setMobileError('נא להזין מספר נייד תקין (10 ספרות, מתחיל ב-05)');
      setIsLoading(false);
      return;
    }

    const normalizedEmail = joinEmail.toLowerCase().trim();

    try {
      const q = query(collection(db, 'members'), where('email', '==', normalizedEmail));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setShowDuplicateModal(true);
        setIsLoading(false);
        return;
      }

      const qReq = query(collection(db, 'joinRequests'), where('email', '==', normalizedEmail));
      const snapshotReq = await getDocs(qReq);
      
      if (!snapshotReq.empty) {
        setError('כבר שלחת בקשת הצטרפות עם האימייל הזה. אנחנו בודקים אותה ממש עכשיו!');
        setIsLoading(false);
        return;
      }

      await addDoc(collection(db, 'joinRequests'), {
        name: joinName,
        email: normalizedEmail,
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

  const resetToLogin = () => {
    setMode('LOGIN');
    setError('');
    setShowDuplicateModal(false);
    if (joinEmail) setEmail(joinEmail);
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
        <img src={currentBg} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Background" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10 flex flex-col items-center gap-6">
          <div className="w-24 h-1 bg-[#F1D179] rounded-full shadow-lg"></div>
          <div className="h-48 flex items-center justify-center drop-shadow-2xl">
             <img 
               src={logoUrl} 
               className="h-full w-auto object-contain" 
               alt="Logo" 
             />
          </div>
          <div className="w-24 h-1 bg-[#F1D179] rounded-full shadow-lg"></div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 p-8 md:p-14 shadow-2xl">
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white uppercase tracking-widest pr-2">אימייל חבר נבחרת</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:bg-white/10 transition-all"
                  placeholder="name@habal-zug.co.il"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white uppercase tracking-widest pr-2">סיסמה</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required value={password} onChange={e => setPassword(e.target.value)} 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:bg-white/10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"><Eye size={18} /></button>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-white uppercase tracking-widest pr-2">בחר קבוצה</label>
                <button 
                  type="button" 
                  onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between text-white font-black text-sm"
                >
                  <span className="flex items-center gap-3"><MapPin size={18} className="text-white/40" />{selectedGroup}</span>
                  <ChevronDown size={18} className={isGroupMenuOpen ? 'rotate-180 transition-transform' : ''} />
                </button>
                {isGroupMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden z-50">
                    {groups.map(g => (
                      <button key={g} type="button" onClick={() => { setSelectedGroup(g); setIsGroupMenuOpen(false); }} className="w-full p-4 text-right text-white hover:bg-white/10 transition-colors font-bold text-xs">{g}</button>
                    ))}
                  </div>
                )}
              </div>

              {error && <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-200 text-xs font-black flex items-center gap-3"><AlertCircle size={16} />{error}</div>}

              <button type="submit" disabled={isLoading} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-xl">
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={24} />}
                כניסה למערכת
              </button>

              <button type="button" onClick={() => { setMode('JOIN'); setError(''); }} className="w-full text-white/50 hover:text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mt-4"><UserPlus size={16} />בקשת הצטרפות</button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-6">
              {success ? (
                <div className="py-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl"><CheckCircle2 size={40} /></div>
                  <h3 className="text-2xl font-black text-white">הבקשה נשלחה!</h3>
                  <p className="text-white/60 font-medium">מנהל המערכת יאשר את בקשתך בקרוב.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <button type="button" onClick={resetToLogin} className="p-2 text-white/40 hover:text-white"><ArrowRight size={24} /></button>
                    <h3 className="text-2xl font-black text-white">בקשת הצטרפות</h3>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <img src={joinAvatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20" alt="" />
                      <label className="absolute -bottom-2 -left-2 p-1.5 bg-white text-slate-950 rounded-lg cursor-pointer shadow-lg"><Camera size={14} /><input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} /></label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <input type="text" required value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="שם מלא" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" />
                    <input type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} placeholder="אימייל" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" />
                    <div className="space-y-1">
                      <input 
                        type="tel" 
                        required 
                        value={joinMobile} 
                        onChange={handleMobileChange} 
                        placeholder="טלפון נייד" 
                        className={`w-full p-4 bg-white/5 border ${mobileError ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-white/10'} rounded-2xl text-white font-bold outline-none transition-all`} 
                      />
                      {mobileError && <p className="text-[10px] text-rose-400 font-black pr-2 animate-in fade-in slide-in-from-top-1">{mobileError}</p>}
                    </div>
                  </div>
                  
                  {error && <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-200 text-xs font-black flex items-center gap-3"><AlertCircle size={16} />{error}</div>}
                  
                  <button type="submit" disabled={isLoading} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-lg shadow-xl">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'שלח בקשה'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Modern Duplicate Email Modal - Matches login box style with brand logo */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-2xl animate-in fade-in duration-500">
           <div className="bg-white/10 backdrop-blur-xl w-full max-w-md rounded-[3.5rem] border border-white/20 shadow-2xl p-10 md:p-14 text-center animate-in zoom-in-95 duration-700 relative overflow-hidden">
              
              {/* Branding accent line */}
              <div className="w-20 h-1 bg-[#F1D179] rounded-full mx-auto mb-10 shadow-lg"></div>
              
              <div className="h-32 flex items-center justify-center mb-10 drop-shadow-xl">
                 <img src={logoUrl} className="h-full w-auto object-contain" alt="Habal Zug Logo" />
              </div>
              
              <h3 className="text-3xl font-black text-white mb-6 leading-tight tracking-tight">
                נראה שכבר נפגשנו!
              </h3>
              
              <p className="text-white/70 font-bold text-lg mb-10 leading-relaxed px-2">
                האימייל הזה כבר רשום בקהילה שלנו. רוצה לנסות להתחבר?
              </p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={resetToLogin} 
                  className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-xl hover:bg-slate-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <RotateCcw size={22} />
                  חזרה
                </button>
                
                <button 
                  onClick={() => setShowDuplicateModal(false)} 
                  className="py-4 text-white/50 font-black text-xs uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <X size={14} />
                  סגור
                </button>
              </div>
              
              {/* Decorative accent */}
              <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
                <Sparkles size={12} className="text-[#F1D179]" />
                <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Habal Zug Community</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;