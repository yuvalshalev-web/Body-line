import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, limit, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { LogIn, Loader2, ArrowRight, Camera, Eye, EyeOff, Phone, AlertCircle, ChevronDown, MapPin, CheckCircle2, UserPlus, Mail, RotateCcw, X, UserCheck, Sparkles, Waves, User } from 'lucide-react';
import { getDb, trackedGetDocs, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updatePassword, getAuth } from 'firebase/auth';
import { Member } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { processImage } from '../utils/imageProcessor';
import emailjs from '@emailjs/browser';

const groups = ["הרצליה", "אשדוד", "אשקלון", "כינרת", "קריות", "תל אביב"];

const LoginPage: React.FC = () => {
  const { login, currentUser } = useAuth();
  const { siteAssets, isLoading: isDataLoading, isDbEmpty, seedInitialAdmin } = useData();
  const navigate = useNavigate();

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

  const headerImage = useRandomHeader();
  const currentBg = siteAssets?.loginBg || headerImage;
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

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();

    try {
      // @ai-preserve: Authentication and Migration Logic
      // Step 1: Try Firebase Auth Login
      try {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const user = userCredential.user;
        
        // Fetch member data
        const memberDoc = await getDoc(doc(db, 'members', user.uid));
        if (memberDoc.exists()) {
          const memberData = { ...memberDoc.data(), id: memberDoc.id } as Member;
          
          if (memberData.isActive === false) {
            setError('החשבון שלך כרגע בחופשה קצרה ⛱️⛺🛫🍹🌴\nלא ניתן להתחבר כרגע בגלל השעיה זמנית');
            await auth.signOut();
            setIsLoading(false);
            return;
          }

          if (memberData.isTemporary) {
            setMode('RESET_TEMP_PASSWORD');
            setIsLoading(false);
            return;
          }

          try {
            await updateDoc(doc(db, 'members', user.uid), {
              loginCount: increment(1)
            });
          } catch (updateErr) {
            console.warn('Could not update login count:', updateErr);
          }
          
          login({ ...memberData, loginCount: (memberData.loginCount || 0) + 1 });
          navigate('/');
        } else {
          // If logged in but no member doc exists (e.g. first time Google login or ID mismatch)
          console.log('LoginPage: Auth success but no member doc for UID:', user.uid, 'Email:', normalizedEmail);
          
          // Try to find by email to see if we need to migrate the ID
          const qEmail = query(collection(db, 'members'), where('email', '==', normalizedEmail), limit(1));
          const emailSnapshot = await trackedGetDocs(qEmail);
          
          if (!emailSnapshot.empty) {
            const legacyDoc = emailSnapshot.docs[0];
            const legacyData = legacyDoc.data() as Member;
            console.log('LoginPage: Found member by email but ID mismatch. Migrating', legacyDoc.id, 'to', user.uid);
            
            // Migrate ID to UID
            const memberData: Member = {
              ...legacyData,
              firstName: legacyData.firstName || 'משתמש',
              lastName: legacyData.lastName || 'חדש',
              email: legacyData.email || normalizedEmail,
              role: legacyData.role || 'Member',
              id: user.uid,
              uid: user.uid,
              loginCount: (legacyData.loginCount || 0) + 1
            };
            
            if (memberData.isActive === false) {
              setError('החשבון שלך כרגע בחופשה קצרה ⛱️⛺🛫🍹🌴\nלא ניתן להתחבר כרגע בגלל השעיה זמנית');
              await auth.signOut();
              setIsLoading(false);
              return;
            }
            
            // Delete old doc if ID was different
            if (legacyDoc.id !== user.uid) {
              try {
                await deleteDoc(doc(db, 'members', legacyDoc.id));
              } catch (delErr: any) {
                console.warn('Could not delete legacy doc during post-login migration:', delErr.message);
              }
            }
            
            try {
              await setDoc(doc(db, 'members', user.uid), memberData);
            } catch (setErr: any) {
              handleFirestoreError(setErr, OperationType.WRITE, `members/${user.uid}`);
            }
            
            if (memberData.isTemporary) {
              setMode('RESET_TEMP_PASSWORD');
              setIsLoading(false);
              return;
            }
            
            login(memberData);
            navigate('/');
          } else if (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
            console.log('LoginPage: Re-creating missing Super Admin document');
            const adminData: Member = {
              id: user.uid,
              uid: user.uid,
              firstName: 'יובל',
              lastName: 'שלו',
              email: SUPER_ADMIN_EMAIL,
              mobile: '050-0000000',
              avatar: '',
              bio: 'רכז מערכת',
              role: 'Admin',
              joinedAt: new Date().toISOString(),
              isActive: true,
              loginCount: 1
            };
            try {
              await setDoc(doc(db, 'members', user.uid), adminData);
            } catch (setErr: any) {
              handleFirestoreError(setErr, OperationType.WRITE, `members/${user.uid}`);
            }
            login(adminData);
            navigate('/');
          } else {
            setError('משתמש זה אינו רשום במערכת כחבר.');
            await auth.signOut();
          }
        }
      } catch (authErr: any) {
        // Step 2: Handle Legacy Users (Migration)
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          // Check if it's the hardcoded admin first
          if (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase() && password === 'Yuval!1970') {
             // Create Firebase user for super admin if it doesn't exist
             try {
               const newUserCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
               const newUser = newUserCredential.user;
               const adminData: Member = {
                 id: newUser.uid,
                 uid: newUser.uid,
                 firstName: 'יובל',
                 lastName: 'שלו',
                 email: SUPER_ADMIN_EMAIL,
                 mobile: '050-0000000',
                 avatar: '',
                 bio: 'רכז מערכת',
                 role: 'Admin',
                 joinedAt: new Date().toISOString(),
                 isActive: true,
                 loginCount: 1
               };
               try {
                 await setDoc(doc(db, 'members', newUser.uid), adminData);
               } catch (setErr: any) {
                 handleFirestoreError(setErr, OperationType.WRITE, `members/${newUser.uid}`);
               }
               login(adminData);
               navigate('/');
               return;
             } catch (createErr: any) {
               if (createErr.code === 'auth/email-already-in-use') {
                 // Email exists but password was wrong in the first try
                 setError('הסיסמה שהזנת אינה נכונה');
                 setIsLoading(false);
                 return;
               }
               throw createErr;
             }
          }

          const qEmail = query(collection(db, 'members'), where('email', '==', normalizedEmail), limit(1));
          const emailSnapshot = await trackedGetDocs(qEmail);
          
          if (emailSnapshot.empty) {
            // Check for join request
            const qRequest = query(collection(db, 'joinRequests'), where('email', '==', normalizedEmail), limit(1));
            const requestSnapshot = await trackedGetDocs(qRequest);
            if (!requestSnapshot.empty) {
              setError('בקשת ההצטרפות שלך עדיין בטיפול. תקבל הודעה כשהיא תאושר.');
            } else {
              setError('אימייל זה אינו רשום במערכת');
            }
            setIsLoading(false);
            return;
          }

          const legacyDoc = emailSnapshot.docs[0];
          const legacyData = legacyDoc.data() as Member;
          const isPasswordValid = await verifyPassword(password, legacyData.password || '');

          if (isPasswordValid) {
            // Migrate to Firebase Auth
            try {
              const newUserCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
              const newUser = newUserCredential.user;
              
              const memberData: Member = {
                ...legacyData,
                firstName: legacyData.firstName || 'משתמש',
                lastName: legacyData.lastName || 'חדש',
                email: legacyData.email || normalizedEmail,
                role: legacyData.role || 'Member',
                id: newUser.uid,
                uid: newUser.uid,
                loginCount: (legacyData.loginCount || 0) + 1
              };
              
              if (memberData.isActive === false) {
                setError('החשבון שלך כרגע בחופשה קצרה ⛱️⛺🛫🍹🌴\nלא ניתן להתחבר כרגע בגלל השעיה זמנית');
                await auth.signOut();
                setIsLoading(false);
                return;
              }
              
              // Delete old doc if ID was different
              if (legacyDoc.id !== newUser.uid) {
                try {
                  await deleteDoc(doc(db, 'members', legacyDoc.id));
                } catch (delErr: any) {
                  console.warn('Could not delete legacy doc, continuing migration:', delErr.message);
                  // Non-fatal, we can continue
                }
              }
              
              try {
                await setDoc(doc(db, 'members', newUser.uid), memberData);
              } catch (setErr: any) {
                console.error('LoginPage: Failed to create member doc after Auth creation:', setErr);
                await auth.signOut();
                handleFirestoreError(setErr, OperationType.WRITE, `members/${newUser.uid}`);
              }
              
              if (memberData.isTemporary) {
                setMode('RESET_TEMP_PASSWORD');
                setIsLoading(false);
                return;
              }
              
              login(memberData);
              navigate('/');
            } catch (migrateErr: any) {
              if (migrateErr.code === 'auth/email-already-in-use') {
                setError('הסיסמה שהזנת אינה נכונה');
              } else {
                setError('שגיאה בתהליך המעבר למערכת החדשה: ' + migrateErr.message);
              }
            }
          } else {
            setError('הסיסמה שהזנת אינה נכונה');
          }
        } else if (authErr.code === 'auth/wrong-password') {
          setError('הסיסמה שהזנת אינה נכונה');
        } else if (authErr.code === 'auth/too-many-requests') {
          setError('יותר מדי ניסיונות כושלים. אנא נסה שוב מאוחר יותר.');
        } else {
          setError('שגיאת התחברות: ' + authErr.message);
        }
      }
    } catch (err: any) {
      console.error('LoginPage: Login error:', err);
      
      let errorMessage = err.message || 'שגיאת מערכת בעת ההתחברות';
      
      // Check if it's a Firestore error (JSON string)
      if (errorMessage.startsWith('{')) {
        try {
          const errInfo = JSON.parse(errorMessage);
          if (errInfo.error === 'Missing or insufficient permissions.') {
            errorMessage = 'שגיאת הרשאות: אין לך הרשאה לגשת לנתונים אלו. וודא שאתה מחובר לחשבון הנכון.';
          } else {
            errorMessage = `שגיאת מערכת: ${errInfo.error}`;
          }
        } catch (e) {
          errorMessage = 'שגיאת מערכת בעת ההתחברות';
        }
      }

      if (err.code === 'auth/network-request-failed') {
        setError('שגיאת חיבור לרשת. אנא בדוק את החיבור שלך.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('יותר מדי ניסיונות כושלים. אנא נסה שוב מאוחר יותר.');
      } else {
        setError(errorMessage);
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
      const normalizedEmail = email.toLowerCase().trim();
      await sendPasswordResetEmail(auth, normalizedEmail);
      
      setResetSuccessMessage('הוראות לשחזור סיסמה נשלחו לכתובת האימייל שלך! 📧 (בדוק גם בתיקיית הספאם)');
      setShowSeaWaterAlert(false);
      setFailedAttempts(0);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('אימייל זה אינו רשום במערכת');
      } else {
        setError('שגיאה בשחזור סיסמה: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
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
      await updatePassword(auth.currentUser, newPassword);
      
      try {
        await updateDoc(doc(db, 'members', auth.currentUser.uid), {
          isTemporary: false,
          loginCount: increment(1)
        });
      } catch (updateErr) {
        console.warn('Could not update member doc after password reset:', updateErr);
      }
      
      if (currentUser) {
        login({ 
          ...currentUser, 
          isTemporary: false, 
          loginCount: (currentUser.loginCount || 0) + 1 
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('שגיאה בעדכון הסיסמה: ' + err.message);
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user is in members collection
      const db = getDb();
      const q = query(collection(db, 'members'), where('email', '==', user.email?.toLowerCase().trim()), limit(1));
      const snapshot = await trackedGetDocs(q);
      
      if (!snapshot.empty) {
        const legacyDoc = snapshot.docs[0];
        const legacyData = legacyDoc.data() as Member;
        
        if (legacyData.isActive === false) {
          setError('החשבון שלך כרגע בחופשה קצרה ⛱️⛺🛫🍹🌴\nלא ניתן להתחבר כרגע בגלל השעיה זמנית');
          await auth.signOut();
          setIsLoading(false);
          return;
        }
        
        // Migrate ID to UID if needed, update login count, and clear isTemporary
        const memberData: Member = {
          ...legacyData,
          firstName: legacyData.firstName || 'משתמש',
          lastName: legacyData.lastName || 'חדש',
          email: legacyData.email || user.email || '',
          role: legacyData.role || 'Member',
          id: user.uid,
          uid: user.uid,
          loginCount: (legacyData.loginCount || 0) + 1,
          isTemporary: false
        };
        
        try {
          await setDoc(doc(db, 'members', user.uid), memberData);
          if (legacyDoc.id !== user.uid) {
            console.log('LoginPage: Google Login ID mismatch. Migrating', legacyDoc.id, 'to', user.uid);
            await deleteDoc(doc(db, 'members', legacyDoc.id));
          }
        } catch (err: any) {
          console.error('Failed to update Google user doc:', err);
          handleFirestoreError(err, OperationType.WRITE, `members/${user.uid}`);
        }
        
        login(memberData);
        navigate('/');
      } else if (user.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim()) {
        // Special case for super admin if not in members yet
        const adminData: Member = {
          id: user.uid,
          uid: user.uid,
          firstName: 'מנהל',
          lastName: 'על',
          email: user.email || '',
          mobile: '',
          avatar: user.photoURL || '',
          bio: 'מנהל מערכת (Google Auth)',
          role: 'Admin',
          isActive: true,
          joinedAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'members', user.uid), adminData);
        } catch (setErr: any) {
          handleFirestoreError(setErr, OperationType.WRITE, `members/${user.uid}`);
        }
        login(adminData);
        navigate('/');
      } else {
        setError('משתמש זה אינו רשום במערכת כחבר.');
        await auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      setError('התחברות עם Google נכשלה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-yehuda" dir="rtl">
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
                 ) : (siteAssets?.habalZugLogo) ? (
                   <img 
                     src={siteAssets.habalZugLogo} 
                     className="h-28 w-auto mx-auto object-contain animate-in fade-in duration-500" 
                     alt="Logo" 
                     onError={() => setLogoError(true)}
                     referrerPolicy="no-referrer"
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
                  className="w-full pr-6 pl-14 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none flex items-center justify-between group hover:bg-white/10 transition-all text-right"
                >
                  <span className="flex-1 text-right">{selectedGroup}</span>
                  <ChevronDown size={20} className={`text-white/40 transition-transform duration-300 ${isGroupMenuOpen ? 'rotate-180' : ''}`} />
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
              
              <div className="pt-4 flex flex-col items-center gap-4">
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

                <button 
                  type="button" 
                  onClick={handleGoogleLogin} 
                  className="group relative flex items-center gap-3 bg-white/5 border border-white/10 text-white/70 px-6 py-3 rounded-2xl font-black overflow-hidden transition-all duration-300 hover:text-white hover:bg-white/10 hover:border-white/20 hover:scale-105"
                >
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-blue-600 font-black text-sm">G</span>
                  </div>
                  <span className="text-base">התחברות עם Google</span>
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
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none flex items-center justify-between group hover:bg-white/10 transition-all text-right"
                    >
                      <span className={`flex-1 text-right ${joinGender ? 'text-white' : 'text-white/40'}`}>{joinGender || 'מגדר'}</span>
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
          <a 
            href="https://www.atalef.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group transition-all duration-500 hover:scale-110"
          >
            {siteAssets?.atalefLogo && (
              <img 
                src={siteAssets.atalefLogo} 
                alt="עמותת העטלף" 
                className="h-14 w-auto opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:brightness-125 transition-all duration-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" 
                referrerPolicy="no-referrer"
              />
            )}
          </a>
          <a 
            href="https://www.reefseacenter.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group transition-all duration-500 hover:scale-110"
          >
            {siteAssets?.reefLogo && (
              <img 
                src={siteAssets.reefLogo} 
                alt="מועדון ריף" 
                className="h-14 w-auto opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:brightness-125 transition-all duration-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" 
                referrerPolicy="no-referrer"
              />
            )}
          </a>
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