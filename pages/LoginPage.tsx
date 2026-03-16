import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, limit } from 'firebase/firestore';
import { LogIn, Loader2, ArrowRight, Camera, Eye, EyeOff, Phone, AlertCircle, ChevronDown, MapPin, CheckCircle2, UserPlus, Mail, RotateCcw, X, UserCheck, Sparkles, Waves, User } from 'lucide-react';
import { getDb, trackedGetDocs } from '../services/firebase';
import { Member } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { processImage } from '../utils/imageProcessor';
import emailjs from '@emailjs/browser';

const groups = ["הרצליה", "אשדוד", "אשקלון", "כינרת", "קריות", "תל אביב"];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { siteAssets, isLoading: isDataLoading, isDbEmpty, seedInitialAdmin } = useData();

  const [mode, setMode] = useState<'LOGIN' | 'JOIN' | 'RESET_TEMP_PASSWORD'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(groups[0]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showSeaWaterAlert, setShowSeaWaterAlert] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

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
      const normalizedEmail = email.toLowerCase().trim();

      // Hardcoded Admin Bypass
      if (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase() && password === 'Yuval!1970') {
        const devHashedPassword = await hashPassword('Yuval!1970');
        login({
          id: 'dev-admin-id', 
          firstName: 'יובל',
          lastName: 'שלו',
          email: SUPER_ADMIN_EMAIL, 
          mobile: '050-0000000',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
          bio: 'רכז מערכת', 
          role: 'Admin', 
          joinedAt: '01/01/2025', 
          isActive: true,
          password: devHashedPassword,
          totalAttendance: 0,
          loginCount: 999
        });
        return;
      }

      // Step 1: Check if email exists
      console.log('LoginPage: Attempting login for:', normalizedEmail);
      const qEmail = query(
        collection(db, 'members'), 
        where('email', '==', normalizedEmail), 
        limit(1)
      );
      const emailSnapshot = await trackedGetDocs(qEmail);
      console.log('LoginPage: Email snapshot size:', emailSnapshot.size);
      if (emailSnapshot.empty) {
        console.log('LoginPage: Email not found:', normalizedEmail);
        // Diagnostic: Check if there are ANY members in the system
        const qAnyMember = query(collection(db, 'members'), limit(1));
        const anyMemberSnapshot = await trackedGetDocs(qAnyMember);
        
        console.log('LoginPage: Any member check size:', anyMemberSnapshot.size);
        
        if (anyMemberSnapshot.empty) {
          console.error('LoginPage: Database collection "members" is completely empty!');
          setError('מסד הנתונים ריק. אנא פנה למנהל המערכת להקמת משתמשים ראשונית.');
          setIsLoading(false);
          return;
        }

        // Check if they have a pending join request
        const qRequest = query(
          collection(db, 'joinRequests'),
          where('email', '==', normalizedEmail),
          limit(1)
        );
        const requestSnapshot = await trackedGetDocs(qRequest);
        
        if (!requestSnapshot.empty) {
          setError('בקשת ההצטרפות שלך עדיין בטיפול. תקבל הודעה כשהיא תאושר.');
        } else {
          setFailedAttempts(prev => prev + 1);
          if (failedAttempts + 1 >= 3) {
            setShowSeaWaterAlert(true);
          } else {
            setError('אימייל זה אינו רשום במערכת');
          }
        }
        setIsLoading(false);
        return;
      }

      // Step 2: Check password
      const userDoc = emailSnapshot.docs[0];
      const memberData = userDoc.data() as Member;
      const isPasswordValid = await verifyPassword(password, memberData.password || '');

      if (!isPasswordValid) {
        setFailedAttempts(prev => prev + 1);
        if (failedAttempts + 1 >= 3) {
          setShowSeaWaterAlert(true);
        } else {
          setError('הסיסמה שהזנת אינה נכונה');
        }
        setIsLoading(false);
        return;
      }
      
      if (memberData.isActive === false) {
        setError('חשבונך אינו פעיל. פנה לרכז המערכת.');
        setIsLoading(false);
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
      
      login({ ...memberData, id: userDoc.id, loginCount: (memberData.loginCount || 0) + 1 });
    } catch (err: any) { 
      console.error(err);
      setFailedAttempts(prev => prev + 1);
      if (failedAttempts + 1 >= 3) {
        setShowSeaWaterAlert(true);
      } else {
        if (err.message === 'QUOTA_EXCEEDED_OR_KILL_SWITCH') {
          setError('המערכת במצב לא מקוון זמנית (Emergency Shutdown)');
        } else {
          setError('שגיאת חיבור למערכת'); 
        }
      }
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('נא להזין אימייל לשחזור סיסמה');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResetSuccessMessage('');
    
    try {
      const db = getDb();
      const normalizedEmail = email.toLowerCase().trim();
      const qEmail = query(
        collection(db, 'members'), 
        where('email', '==', normalizedEmail), 
        limit(1)
      );
      const emailSnapshot = await trackedGetDocs(qEmail);
      
      if (emailSnapshot.empty) {
        setError('אימייל זה אינו רשום במערכת');
        setShowSeaWaterAlert(false);
        setFailedAttempts(0);
        setIsLoading(false);
        return;
      }
      
      const userDoc = emailSnapshot.docs[0];
      const memberData = userDoc.data() as Member;
      
      // Generate temporary password
      const tempPass = Math.random().toString(36).slice(-8);
      const hashedPass = await hashPassword(tempPass);
      
      // Update user document
      await updateDoc(doc(db, 'members', userDoc.id), {
        password: hashedPass,
        isTemporary: true
      });
      
      // Send Email via EmailJS
      try {
        // מזהי EmailJS - יש להחליף בנתונים האמיתיים מהחשבון שלך (או להגדיר ב-.env)
        const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_34obqry';
        const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_96js5ks';
        const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'jwzorvUPZsJyfTZpg';

        if (SERVICE_ID) {
          await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            {
              to_email: memberData.email,
              to_name: memberData.firstName,
              temp_password: tempPass,
            },
            PUBLIC_KEY
          );
        } else {
          console.log('EmailJS is not configured. Simulated email send:', { to: memberData.email, tempPass });
        }
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
        // We continue anyway so the user isn't blocked in demo mode
      }
      
      // Show success message
      setResetSuccessMessage('הסיסמה הזמנית נשלחה לכתובת האימייל שלך! 📧 (בדוק גם בתיקיית הספאם)');
      setShowSeaWaterAlert(false);
      setFailedAttempts(0);
      
    } catch (err) {
      console.error(err);
      setError('שגיאה בשחזור סיסמה');
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
        ...tempUser.data, 
        id: tempUser.id, 
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
    
    if (selectedGroup !== "הרצליה") {
      setError('הגישה לקבוצת ' + selectedGroup + ' טרם נפתחה במערכת.');
      setIsLoading(false);
      return;
    }

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-['Yehuda_CLM']" dir="rtl">
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
                   </div>
                 )}
               </div>
              <div className="relative w-full">
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none pr-6 pl-14 placeholder-white/50 text-right"
                  placeholder="אימייל חבר"
                />
                <Mail size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none ${email ? 'text-[#00FFFF]' : 'text-white/40'}`} />
              </div>
              <div className="relative w-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required value={password} onChange={e => setPassword(e.target.value)} 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none pr-6 pl-14 placeholder-white/50 text-right"
                  placeholder="סיסמה"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 hover:text-white ${password ? 'text-[#00FFFF]' : 'text-white/40'}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Location Selection Dropdown */}
              <div className="relative w-full">
                <button 
                  type="button"
                  onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                  className="w-full pr-6 pl-14 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none flex items-center justify-end gap-2 group hover:bg-white/10 transition-all text-right"
                >
                  <ChevronDown size={20} className={`text-white/40 transition-transform duration-300 ${isGroupMenuOpen ? 'rotate-180' : ''}`} />
                  <span>{selectedGroup}</span>
                </button>
                <MapPin size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00FFFF] pointer-events-none" />

                {isGroupMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {groups.map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => {
                          setSelectedGroup(group);
                          setIsGroupMenuOpen(false);
                          if (group !== "הרצליה") {
                            setError('הגישה לקבוצת ' + group + ' טרם נפתחה במערכת.');
                          } else {
                            setError('');
                          }
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

              {error && (
                <div className="p-4 bg-rose-500/20 text-rose-200 text-xs font-black flex items-center gap-3">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {resetSuccessMessage && (
                <div className="p-4 bg-emerald-500/20 text-emerald-200 text-xs font-black flex items-center gap-3 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 size={16} />
                  {resetSuccessMessage}
                </div>
              )}
              
              {isDbEmpty && (
                <div className="p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl text-cyan-100 text-xs font-bold text-center space-y-3">
                  <p>נראה שמסד הנתונים ריק. האם תרצה להקים מנהל מערכת ראשוני?</p>
                  <button
                    type="button"
                    disabled={isSeeding}
                    onClick={async () => {
                      setIsSeeding(true);
                      const success = await seedInitialAdmin();
                      if (success) {
                        setEmail(SUPER_ADMIN_EMAIL);
                        setPassword('admin123');
                        setError('מנהל מערכת הוקם בהצלחה! התחבר עם admin123');
                      }
                      setIsSeeding(false);
                    }}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-black hover:bg-cyan-400 transition-colors disabled:opacity-50"
                  >
                    {isSeeding ? 'מקים...' : 'לחץ כאן להקמת מנהל מערכת ראשוני'}
                  </button>
                </div>
              )}

              <div className="flex justify-center">
                <GlassButton type="submit" disabled={isLoading} className="!px-8 !py-4 bg-[#FFD700]/20 border-[#FFD700]/30 text-[#00FFFF] font-black w-fit">
                  {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={24} className="text-[#FFD700]" />}
                  <span className="text-lg">כניסה</span>
                </GlassButton>
              </div>
              
              <div className="pt-4 flex justify-center">
                <button 
                  type="button" 
                  onClick={() => setMode('JOIN')} 
                  className="group relative flex items-center gap-2 bg-transparent border border-white/5 text-white/40 px-6 py-3 rounded-2xl font-black overflow-hidden transition-all duration-300 hover:text-white hover:bg-white/5 hover:border-white/10 hover:scale-105 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                >
                  {/* אפקט "נצנוץ" בציאן ברקע במעבר עכבר */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00FFFF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* האייקון עם הנפשה קטנה */}
                  <UserPlus 
                    size={18} 
                    className="text-[#00FFFF]/40 transition-all duration-300 group-hover:text-[#00FFFF] group-hover:rotate-12 group-hover:scale-110" 
                  />
                  
                  <span className="relative z-10 text-base">בקש להצטרף</span>
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
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none pr-6 pl-14 placeholder-white/50"
                    placeholder="סיסמה חדשה"
                  />
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none pr-6 pl-14 placeholder-white/50"
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
              
              <GlassButton type="submit" disabled={isLoading} className="w-fit mx-auto">
                {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} className="text-[#00FFFF]" />}
                עדכן סיסמה וכנס
              </GlassButton>
              
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
                    <input type="text" required value={joinFirstName} onChange={e => setJoinFirstName(e.target.value)} placeholder="שם פרטי" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none placeholder-white/50 text-right" />
                    <input type="text" required value={joinLastName} onChange={e => setJoinLastName(e.target.value)} placeholder="שם משפחה" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none placeholder-white/50 text-right" />
                  </div>
                  <input type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} placeholder="אימייל" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none placeholder-white/50 text-right" />
                  <input type="tel" required value={joinMobile} onChange={handleMobileChange} placeholder="טלפון נייד" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none placeholder-white/50 text-right" />
                  <div className="relative w-full">
                    <button 
                      type="button"
                      onClick={() => setIsGenderMenuOpen(!isGenderMenuOpen)}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none flex items-center justify-end gap-2 group hover:bg-white/10 transition-all text-right"
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
                  {error && <div className="p-4 bg-rose-500/20 text-rose-200 text-xs font-black flex items-center gap-3"><AlertCircle size={16} />{error}</div>}
                  <GlassButton type="submit" disabled={isLoading || isProcessingImage} className="w-fit mx-auto">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'שלח בקשה ב-WebP'}
                  </GlassButton>
                </>
              )}
            </form>
          )}
        </div>

        {/* Logos at the bottom */}
        <div className="mt-12 flex items-center justify-center gap-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
          {(siteAssets?.atalefLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Flogo%2Fatalef-logo.png?alt=media") && (
            <a 
              href="https://www.atalef.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group transition-all duration-500 hover:scale-110"
            >
              <img 
                src={siteAssets?.atalefLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Flogo%2Fatalef-logo.png?alt=media"} 
                alt="עמותת העטלף" 
                className="h-14 w-auto opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:brightness-125 transition-all duration-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" 
              />
            </a>
          )}
          {(siteAssets?.reefLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Flogo%2Freef-logo.jpeg?alt=media") && (
            <a 
              href="https://www.reefseacenter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group transition-all duration-500 hover:scale-110"
            >
              <img 
                src={siteAssets?.reefLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Flogo%2Freef-logo.jpeg?alt=media"} 
                alt="מועדון ריף" 
                className="h-14 w-auto opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:brightness-125 transition-all duration-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" 
              />
            </a>
          )}
        </div>
      </div>
      {/* Sea Water Alert Modal (Forgot Password) */}
      <AnimatePresence>
        {showSeaWaterAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A24] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Waves size={32} />
              </div>
              <h3 className="text-2xl font-black text-white text-center mb-2">שתית מי ים?</h3>
              <p className="text-white/70 text-center mb-6">
                נראה שהתבלבלת בסיסמה 3 פעמים. האם תרצה שנשלח לך סיסמה זמנית לאימייל כדי שתוכל להתחבר?
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
                  כן, שלח לי למייל
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSeaWaterAlert(false);
                    setFailedAttempts(0);
                  }}
                  disabled={isLoading}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  לא, אני אנסה שוב
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;