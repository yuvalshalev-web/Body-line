import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, limit } from 'firebase/firestore';
import { LogIn, Loader2, ArrowRight, Camera, Eye, EyeOff, Phone, AlertCircle, ChevronDown, MapPin, CheckCircle2, UserPlus, Mail, RotateCcw, X, UserCheck, Sparkles, Waves, User } from 'lucide-react';
import { getDb, trackedGetDocs } from '../services/firebase';
import { Member } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { hashPassword } from '../utils/crypto';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { processImage } from '../utils/imageProcessor';

const groups = ["הרצליה", "אשדוד", "אשקלון", "כינרת", "קריות", "תל אביב"];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { siteAssets, isLoading: isDataLoading } = useData();

  const [mode, setMode] = useState<'LOGIN' | 'JOIN' | 'RESET_TEMP_PASSWORD'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(groups[0]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempUser, setTempUser] = useState<{ id: string; data: Member } | null>(null);
  const [logoError, setLogoError] = useState(false);

  const [joinFirstName, setJoinFirstName] = useState('');
  const [joinLastName, setJoinLastName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinMobile, setJoinMobile] = useState('');
  const [joinGender, setJoinGender] = useState<string>('');
  const [isGenderMenuOpen, setIsGenderMenuOpen] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBg = siteAssets?.loginBg || siteAssets?.heroBg || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=2000';
  const logoUrl = siteAssets?.habalZugLogo;

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
      const db = getDb();
      if (email.toLowerCase().trim() === 'yuval@shalev.org' && password === 'Yuval!1970') {
        const devHashedPassword = await hashPassword('Yuval!1970');
        login({
          id: 'dev-admin-id', 
          firstName: 'The',
          lastName: 'Dude',
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
        where('password', '==', hashedPassword),
        limit(1)
      );
      const snapshot = await trackedGetDocs(q);
      
      if (snapshot.empty) {
        setError('פרטי הגישה אינם נכונים');
      } else {
        const userDoc = snapshot.docs[0];
        const memberData = userDoc.data() as Member;
        
        if (memberData.isActive === false) {
          setError('חשבונך אינו פעיל. פנה למנהל המערכת.');
          return;
        }

        if (memberData.isTemporary) {
          setTempUser({ id: userDoc.id, data: memberData });
          setMode('RESET_TEMP_PASSWORD');
          setIsLoading(false);
          return;
        }

        await updateDoc(doc(db, 'members', userDoc.id), {
          loginCount: increment(1)
        });
        
        login({ id: userDoc.id, ...memberData, loginCount: (memberData.loginCount || 0) + 1 });
      }
    } catch (err: any) { 
      console.error(err);
      if (err.message === 'QUOTA_EXCEEDED_OR_KILL_SWITCH') {
        setError('המערכת במצב לא מקוון זמנית (Emergency Shutdown)');
      } else {
        setError('שגיאת חיבור למערכת'); 
      }
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    
    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);
    try {
      const db = getDb();
      const hashed = await hashPassword(newPassword);
      
      await updateDoc(doc(db, 'members', tempUser.id), {
        password: hashed,
        isTemporary: false,
        loginCount: increment(1)
      });
      
      login({ 
        id: tempUser.id, 
        ...tempUser.data, 
        isTemporary: false, 
        loginCount: (tempUser.data.loginCount || 0) + 1 
      });
    } catch (err) {
      console.error(err);
      setError('שגיאה בעדכון הסיסמה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJoinMobile(formatMobileNumber(e.target.value));
    setMobileError('');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      setError('');
      try {
        const { dataUrl } = await processImage(file, 500, 0.75);
        setJoinAvatar(dataUrl);
      } catch (err: any) {
        setError(err.message || 'עיבוד התמונה נכשל');
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!validateMobileNumber(joinMobile)) {
      setMobileError('נא להזין מספר נייד תקין (10 ספרות, מתחיל ב-05)');
      setIsLoading(false);
      return;
    }

    try {
      const db = getDb();
      const normalizedEmail = joinEmail.toLowerCase().trim();
      const q = query(collection(db, 'members'), where('email', '==', normalizedEmail), limit(1));
      const snapshot = await trackedGetDocs(q);
      if (!snapshot.empty) {
        setShowDuplicateModal(true);
        setIsLoading(false);
        return;
      }

      await addDoc(collection(db, 'joinRequests'), {
        firstName: joinFirstName,
        lastName: joinLastName,
        email: normalizedEmail,
        mobile: joinMobile,
        gender: joinGender || 'מעדיף/ה לא לציין',
        bio: '',
        avatar: joinAvatar,
        requestedAt: new Date().toISOString(),
        group: selectedGroup
      });
      setSuccess(true);
      setTimeout(() => {
        setMode('LOGIN');
        setSuccess(false);
      }, 5000); 
    } catch (err: any) { 
      console.error(err);
      if (err.message === 'QUOTA_EXCEEDED_OR_KILL_SWITCH') {
        setError('המערכת במצב לא מקוון זמנית (Emergency Shutdown)');
      } else {
        setError('שגיאה בשליחת הבקשה'); 
      }
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-['Assistant']" dir="rtl">
      <div className="absolute inset-0 z-0">
        <img src={currentBg} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Background" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 p-8 md:p-14 shadow-2xl">
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
               <div className="text-center mb-8 drop-shadow-2xl flex flex-col items-center min-h-[120px] justify-center">
                 {isDataLoading ? (
                   <Loader2 className="animate-spin text-white/20" size={32} />
                 ) : (!logoError && logoUrl) ? (
                   <img 
                     src={logoUrl} 
                     className="h-28 w-auto mx-auto object-contain animate-in fade-in duration-500" 
                     alt="Logo" 
                     onError={() => setLogoError(true)}
                   />
                 ) : (
                   <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
                       <Waves size={32} />
                     </div>
                     <div className="text-white text-4xl font-black italic tracking-tighter">חבל זוג</div>
                     <div className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">HERZLIYA SURF CLUB</div>
                   </div>
                 )}
               </div>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none"
                placeholder="אימייל חבר"
              />
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required value={password} onChange={e => setPassword(e.target.value)} 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none pr-6 pl-14"
                  placeholder="סיסמה"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Location Selection Dropdown */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none flex items-center justify-between group hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={20} className="text-[#00FFFF]" />
                    <span>{selectedGroup}</span>
                  </div>
                  <ChevronDown size={20} className={`text-white/40 transition-transform duration-300 ${isGroupMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isGroupMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {groups.map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => {
                          setSelectedGroup(group);
                          setIsGroupMenuOpen(false);
                        }}
                        className={`w-full px-6 py-4 text-right font-bold transition-all hover:bg-white/10 ${
                          selectedGroup === group ? 'text-[#00FFFF] bg-white/5' : 'text-white/70'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && <div className="p-4 bg-rose-500/20 text-rose-200 text-xs font-black flex items-center gap-3"><AlertCircle size={16} />{error}</div>}
              <button type="submit" disabled={isLoading} className="w-full py-5 bg-[#006994] text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 hover:bg-[#4E8294] transition-all active:scale-95">
                {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={24} className="text-[#00FFFF]" />}
                כניסה
              </button>
              
              <div className="pt-4 flex justify-center">
                <button 
                  type="button" 
                  onClick={() => setMode('JOIN')} 
                  className="group relative flex items-center gap-3 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                >
                  {/* אפקט "נצנוץ" בציאן ברקע במעבר עכבר */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00FFFF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* האייקון עם הנפשה קטנה */}
                  <UserPlus 
                    size={22} 
                    className="text-[#00FFFF] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" 
                  />
                  
                  <span className="relative z-10 text-lg">בקשת הצטרפות לקהילה</span>
                </button>
              </div>
            </form>
          ) : mode === 'RESET_TEMP_PASSWORD' ? (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#00FFFF]/10 text-[#00FFFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <RotateCcw size={32} />
                </div>
                <h3 className="text-2xl font-black text-white">החלפת סיסמה זמנית</h3>
                <p className="text-white/50 text-xs font-bold mt-2">הסיסמה שקיבלת היא זמנית. נא לבחור סיסמה אישית קבועה.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none pr-6 pl-14"
                    placeholder="סיסמה חדשה"
                  />
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none pr-6 pl-14"
                    placeholder="אימות סיסמה"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && <div className="p-4 bg-rose-500/20 text-rose-200 text-xs font-black flex items-center gap-3"><AlertCircle size={16} />{error}</div>}
              
              <button type="submit" disabled={isLoading} className="w-full py-5 bg-[#006994] text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 hover:bg-[#4E8294] transition-all active:scale-95">
                {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} className="text-[#00FFFF]" />}
                עדכן סיסמה וכנס
              </button>
              
              <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-white/50 hover:text-white font-black text-xs transition-colors">חזרה להתחברות</button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-6">
              {success ? (
                <div className="py-12 text-center space-y-6">
                  <CheckCircle2 size={64} className="text-emerald-500 mx-auto" />
                  <h3 className="text-2xl font-black text-white">הבקשה נשלחה!</h3>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <button type="button" onClick={resetToLogin} className="p-2 text-white/40"><ArrowRight size={24} /></button>
                    <h3 className="text-2xl font-black text-white">בקשת הצטרפות</h3>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/20 bg-white/5 flex items-center justify-center">
                        {isProcessingImage ? (
                          <Loader2 className="animate-spin text-white" />
                        ) : joinAvatar ? (
                          <img src={joinAvatar} className="w-full h-full object-cover" alt="" loading="lazy" />
                        ) : (
                          <User size={48} className="text-white/20" />
                        )}
                      </div>
                      <label className="absolute -bottom-2 -left-2 p-2 bg-[#006994] text-white rounded-xl cursor-pointer shadow-lg hover:bg-[#4E8294] transition-all">
                        <Camera size={16} className="text-[#00FFFF]" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isProcessingImage} />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" required value={joinFirstName} onChange={e => setJoinFirstName(e.target.value)} placeholder="שם פרטי" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" />
                    <input type="text" required value={joinLastName} onChange={e => setJoinLastName(e.target.value)} placeholder="שם משפחה" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" />
                  </div>
                  <input type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} placeholder="אימייל" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="tel" required value={joinMobile} onChange={handleMobileChange} placeholder="טלפון נייד" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none" />
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setIsGenderMenuOpen(!isGenderMenuOpen)}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none flex items-center justify-between group hover:bg-white/10 transition-all"
                      >
                        <span className={joinGender ? 'text-white' : 'text-white/40'}>{joinGender || 'מגדר'}</span>
                        <ChevronDown size={18} className={`text-white/40 transition-transform duration-300 ${isGenderMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isGenderMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setIsGenderMenuOpen(false)} />
                            <motion.div 
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                            >
                              {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => {
                                    setJoinGender(g);
                                    setIsGenderMenuOpen(false);
                                  }}
                                  className={`w-full px-6 py-4 text-right font-bold transition-all hover:bg-white/10 ${
                                    joinGender === g ? 'text-[#00FFFF] bg-white/5' : 'text-white/70'
                                  }`}
                                >
                                  {g}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {error && <div className="p-4 bg-rose-500/20 text-rose-200 text-xs font-black flex items-center gap-3"><AlertCircle size={16} />{error}</div>}
                  <button type="submit" disabled={isLoading || isProcessingImage} className="w-full py-5 bg-[#006994] text-white rounded-2xl font-black text-lg hover:bg-[#4E8294] transition-all active:scale-95">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'שלח בקשה ב-WebP'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;