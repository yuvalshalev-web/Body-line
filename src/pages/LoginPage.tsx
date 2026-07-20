import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, limit, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { LogIn, Loader2, ArrowRight, Camera, Eye, EyeOff, Phone, AlertCircle, ChevronDown, MapPin, CheckCircle2, UserPlus, Mail, RotateCcw, X, UserCheck, Sparkles, Waves, User, Terminal } from 'lucide-react';
import { getDb, trackedGetDocs, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updatePassword, getAuth } from 'firebase/auth';
import { Member, JoinRequest } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { hashPassword, verifyPassword, calculateFbPassword } from '../utils/crypto';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { processImage } from '../utils/imageProcessor';
import { loadGoogleMaps } from '../utils/googlePlaces';
import emailjs from '@emailjs/browser';

const groups = [
  "הרצליה", "הרצליה - ותיקים",
  "אשדוד", "אשדוד - ותיקים",
  "אשקלון", "אשקלון - ותיקים",
  "כינרת", "כינרת - ותיקים",
  "קריות", "קריות - ותיקים",
  "תל אביב", "תל אביב - ותיקים"
];

const LoginPage: React.FC = () => {
  console.log("LoginPage rendering");
  const [mode, setMode] = useState<'LOGIN' | 'JOIN' | 'RESET_TEMP_PASSWORD'>('LOGIN');
  const { login, currentUser } = useAuth();
  const { siteAssets, isLoading: isDataLoading, isDbEmpty, seedInitialAdmin } = useData();
  const navigate = useNavigate();

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
  const [joinAddress, setJoinAddress] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const joinAddressRef = useRef<HTMLInputElement>(null);
  const joinAutocompleteRef = useRef<any>(null);

  React.useEffect(() => {
    if (mode === 'JOIN') {
      loadGoogleMaps().then(() => setGoogleReady(true));
    }
  }, [mode]);

  React.useEffect(() => {
    if (googleReady && joinAddressRef.current && !joinAutocompleteRef.current) {
      try {
        joinAutocompleteRef.current = new window.google.maps.places.Autocomplete(joinAddressRef.current, {
          componentRestrictions: { country: 'il' },
          fields: ['formatted_address', 'geometry', 'name'],
          types: ['geocode', 'establishment']
        });

        joinAutocompleteRef.current.addListener('place_changed', () => {
          const place = joinAutocompleteRef.current.getPlace();
          if (place.formatted_address) {
            setJoinAddress(place.formatted_address);
          } else if (place.name) {
            setJoinAddress(place.name);
          }
        });
      } catch (err) {
        console.error('Error initializing join autocomplete:', err);
      }
    }
  }, [googleReady]);

  const headerImage = useRandomHeader();
  const currentBg = siteAssets?.loginBg || headerImage;
  const logoUrl = siteAssets?.habalZugLogo;

  const handleWrongPassword = () => {
    setError('הסיסמה שהזנת אינה נכונה');
    setFailedAttempts(prev => {
      const next = prev + 1;
      if (next >= 3) {
        setShowSeaWaterAlert(true);
      }
      return next;
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!selectedGroup.startsWith("הרצליה")) {
      setError('הגישה לקבוצת ' + selectedGroup + ' טרם נפתחה במערכת.');
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();

    try {
      // @ai-preserve: Authentication and Migration Logic
      // Step 1: Try Firebase Auth Login (Try raw first, fallback to deterministic bridging password)
      try {
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        } catch (authErr: any) {
          try {
            const fbBridgingPassword = await calculateFbPassword(normalizedEmail);
            userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, fbBridgingPassword);
          } catch (bridgeErr) {
            throw authErr;
          }
        }
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
            setError('משתמש זה אינו מאושר עדיין במערכת.');
            await auth.signOut();
          }
        }
      } catch (authErr: any) {
        // Step 2: Handle Legacy Users (Migration)
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          // Check if it's the hardcoded admin first
          if (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase() && password === 'Yuval!1970') {
             // Create Firebase user for super admin using the deterministic calculated password
             try {
               const fbBridgingPassword = await calculateFbPassword(normalizedEmail);
               const newUserCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, fbBridgingPassword);
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
                 handleWrongPassword();
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
            // Migrate to Firebase Auth using deterministic calculated password
            const fbBridgingPassword = await calculateFbPassword(normalizedEmail);
            try {
              const newUserCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, fbBridgingPassword);
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
                // If account exists in Firebase Auth but they typed correct password (verified by Firestore)
                // and they couldn't log in (due to out-of-sync credential on existing account):
                console.log('LoginPage: Auth email-already-in-use but Firestore verified password. Out-of-sync fallback.');
                setError('שגיאת סנכרון עם שרת האבטחה (סמל פג תוקף). פנה לרכז או מחק את המשתמש מ-Firebase Console כדי להסתנכרן אוטומטית.');
                setIsLoading(false);
              } else {
                setError('שגיאה בתהליך המעבר למערכת החדשה: ' + migrateErr.message);
                setIsLoading(false);
              }
            }
          } else {
            handleWrongPassword();
            setIsLoading(false);
          }
        } else if (authErr.code === 'auth/wrong-password') {
          handleWrongPassword();
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
    
    if (!selectedGroup.startsWith("הרצליה")) {
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
        full_address: joinAddress,
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
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans tracking-tight" dir="rtl">
      {/* Background System */}
      <div className="fixed inset-0 z-0">
        <motion.img 
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={currentBg} 
          className="w-full h-full object-cover opacity-30 pointer-events-none" 
          alt="Background" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/80 via-[#09090b]/40 to-[#09090b]/90 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Modern Minimal Form Container */}
        <div className="bg-[#121214]/90 backdrop-blur-3xl border border-white/[0.08] p-8 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden">

          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6 relative z-10">
               {/* Header / Logo */}
               <div className="text-center mb-8 flex flex-col justify-center items-center">
                 {isDataLoading ? (
                   <div className="h-24 flex items-center justify-center">
                     <Loader2 className="animate-spin text-white/50" size={32} />
                   </div>
                 ) : (
                   <motion.div 
                     initial={{ y: 10, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     className="flex flex-col gap-4 items-center w-full"
                   >
                     {logoUrl ? (
                       <img 
                         src={logoUrl} 
                         className="h-20 sm:h-24 w-auto object-contain" 
                         alt="Habal Zug Logo" 
                         referrerPolicy="no-referrer"
                       />
                     ) : (
                       <div className="w-16 h-16 bg-white flex items-center justify-center text-black rounded-2xl shrink-0 shadow-lg mb-2">
                         <Waves size={32} />
                       </div>
                     )}
                     <div className="space-y-1 mt-2">
                       <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">
                         ברוכים הבאים
                       </h1>
                       <p className="text-white/50 text-sm font-medium">
                         התחברו לחשבון שלכם כדי להמשיך
                       </p>
                     </div>
                   </motion.div>
                 )}
               </div>

              <div className="space-y-4">
                <div className="relative group">
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none pr-4 pl-10 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
                    placeholder="דוא״ל"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail size={18} className="text-white/40 group-focus-within:text-white/80 transition-colors" />
                  </div>
                </div>

                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required value={password} onChange={e => setPassword(e.target.value)} 
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none pr-4 pl-10 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
                    placeholder="סיסמה"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Location Selection Dropdown */}
                <div className="relative w-full">
                  <button 
                    type="button"
                    onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none text-right flex items-center justify-between px-4 hover:border-white/30 transition-all duration-300"
                  >
                    <span className="flex-1 text-right">{selectedGroup}</span>
                    <ChevronDown size={18} className={`text-white/40 transition-transform duration-300 ${isGroupMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isGroupMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-[#1A1A1D] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                      >
                        {groups.map((group) => (
                          <button
                            key={group}
                            type="button"
                            onClick={() => {
                              setSelectedGroup(group);
                              setIsGroupMenuOpen(false);
                              if (!group.startsWith("הרצליה")) {
                                setError('הגישה לקבוצת ' + group + ' טרם נפתחה במערכת.');
                              } else {
                                setError('');
                              }
                            }}
                            className={`w-full px-4 py-3 text-right font-medium text-sm transition-all flex items-center justify-between hover:bg-white/5 ${
                              selectedGroup === group ? 'text-white bg-white/5' : 'text-white/70'
                            }`}
                          >
                            <span>{group}</span>
                            {selectedGroup === group && <CheckCircle2 size={16} className="text-white" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-rose-500/10 border-l-2 border-rose-500 text-rose-400 text-sm font-bold flex items-start gap-3 backdrop-blur-md"
                  >
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
                
                {resetSuccessMessage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-cyan-500/10 border-l-2 border-cyan-400 text-cyan-400 text-sm font-bold flex items-center gap-3 backdrop-blur-md"
                  >
                    <CheckCircle2 size={20} className="shrink-0" />
                    <span>{resetSuccessMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-xl flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-black mx-auto" size={20} />
                  ) : (
                    <span>התחבר</span>
                  )}
                </button>
              </div>
              
              <div className="pt-6 mt-6 border-t border-white/10 flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 w-full justify-center">
                  <span className="text-white/40 text-sm">אין לך חשבון?</span>
                  <button 
                    type="button" 
                    onClick={() => setMode('JOIN')} 
                    className="text-white hover:text-white/80 text-sm font-medium transition-colors"
                  >
                    בקשת הצטרפות
                  </button>
                </div>
              </div>
            </form>
          ) : mode === 'RESET_TEMP_PASSWORD' ? (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleResetPasswordSubmit} 
              className="space-y-6 relative z-10"
            >
              <div className="text-center mb-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                  <RotateCcw size={32} className="text-white" />
                </div>
                <h3 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">החלפת סיסמה זמנית</h3>
                <p className="text-white/50 text-sm font-medium mt-2">הסיסמה שקיבלת היא זמנית. נא לבחור סיסמה אישית קבועה.</p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none pr-4 pl-10 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
                    placeholder="סיסמה חדשה"
                  />
                </div>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none pr-4 pl-10 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
                    placeholder="אימות סיסמה"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-rose-500/10 border-l-2 border-rose-500 text-rose-400 text-sm font-bold flex items-start gap-3 backdrop-blur-md"
                  >
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-xl flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-black mx-auto" size={20} />
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} />
                      <span>עדכן סיסמה והתחבר</span>
                    </div>
                  )}
                </button>
              </div>
              
              <button 
                type="button" 
                onClick={() => setMode('LOGIN')} 
                className="w-full text-white/40 hover:text-white/80 font-medium text-sm transition-colors mt-4"
              >
                חזרה להתחברות
              </button>
            </motion.form>
          ) : (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleJoinSubmit} 
              className="space-y-6 relative z-10"
            >
              {success ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">הבקשה נשלחה</h3>
                  <p className="text-white/50 text-sm font-medium">צוות המועדון יחזור אליך בהקדם עם ערוצי הגישה למערכת.</p>
                  <div className="pt-6">
                    <button type="button" onClick={resetToLogin} className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-medium border border-white/5">
                      חזור לדף ההתחברות
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <button type="button" onClick={resetToLogin} className="w-10 h-10 border border-white/[0.08] hover:border-white/30 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/[0.05] hover:text-white transition-all">
                      <ArrowRight size={18} />
                    </button>
                    <h3 className="text-white text-xl font-semibold tracking-tight">בקשת הצטרפות</h3>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative group/avatar cursor-pointer">
                      <div className="w-20 h-20 overflow-hidden border border-white/10 bg-white/5 rounded-full flex items-center justify-center group-hover/avatar:border-white/30 transition-all duration-300">
                        <div className="w-full h-full flex items-center justify-center">
                          {isProcessingImage ? (
                            <Loader2 className="animate-spin text-white/50" size={24} />
                          ) : joinAvatar ? (
                            <img src={joinAvatar} className="w-full h-full object-cover" alt="" loading="lazy" />
                          ) : (
                            <User size={32} className="text-white/20 group-hover/avatar:text-white/60 transition-colors" />
                          )}
                        </div>
                      </div>
                      <label className="absolute -bottom-1 -left-1 w-8 h-8 bg-white rounded-full text-black flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-all">
                        <Camera size={16} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isProcessingImage} />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" required value={joinFirstName} onChange={e => setJoinFirstName(e.target.value)} placeholder="שם פרטי" className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none px-4 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all" />
                    <input type="text" required value={joinLastName} onChange={e => setJoinLastName(e.target.value)} placeholder="שם משפחה" className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none px-4 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all" />
                  </div>
                  
                  <input type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} placeholder="דוא״ל" className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none px-4 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all" />
                  <input type="tel" required value={joinMobile} onChange={handleMobileChange} placeholder="טלפון נייד" className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none px-4 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all focus:text-left direction-ltr text-left" dir="ltr" />
                  
                  <div className="relative group">
                    <input 
                      ref={joinAddressRef}
                      type="text" 
                      required 
                      value={joinAddress} 
                      onChange={e => setJoinAddress(e.target.value)} 
                      placeholder="כתובת מגורים" 
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none px-4 placeholder-white/30 text-right focus:border-white/30 focus:bg-white/[0.05] transition-all" 
                    />
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/50 transition-colors" />
                  </div>
                  
                  <div className="relative w-full">
                    <button 
                      type="button"
                      onClick={() => setIsGenderMenuOpen(!isGenderMenuOpen)}
                      className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white font-medium text-base outline-none text-right flex items-center justify-between px-4 hover:border-white/30 transition-all"
                    >
                      <span className={`flex-1 text-right ${joinGender ? 'text-white' : 'text-white/30'}`}>{joinGender || 'מגדר (בחירה)'}</span>
                      <ChevronDown size={18} className={`text-white/40 transition-transform duration-300 ${isGenderMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isGenderMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsGenderMenuOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-[#1A1A1D] border border-white/10 rounded-xl shadow-2xl z-[70] overflow-hidden py-1"
                          >
                            {(['זכר', 'נקבה', 'לא בינארי', 'מעדיף/ה לא לציין'] as const).map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  setJoinGender(g);
                                  setIsGenderMenuOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-right font-medium text-sm transition-all flex items-center justify-between hover:bg-white/5 ${
                                  joinGender === g ? 'text-white bg-white/5' : 'text-white/70'
                                }`}
                              >
                                <span>{g}</span>
                                {joinGender === g && <CheckCircle2 size={16} className="text-white" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <AnimatePresence mode="popLayout">
                    {(error || mobileError) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 bg-rose-500/10 border-l-2 border-rose-500 text-rose-400 text-sm font-bold flex items-start gap-3 backdrop-blur-md"
                      >
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <span className="leading-tight">{error || mobileError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isLoading || isProcessingImage} 
                      className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-xl flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin text-black mx-auto" size={20} />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>שלח בקשה</span>
                          <ArrowRight size={18} className="rotate-180" />
                        </div>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.form>
          )}
        </div>

        {/* Logos at the bottom */}
        <div className="mt-8 flex items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
          <a 
            href="https://www.atalef.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group transition-all duration-500 hover:scale-105 opacity-60 hover:opacity-100"
          >
            {siteAssets?.atalefLogo && (
              <img 
                src={siteAssets.atalefLogo} 
                alt="עמותת העטלף" 
                className="h-14 sm:h-16 w-auto transition-all duration-500" 
                referrerPolicy="no-referrer"
              />
            )}
          </a>
          <a 
            href="https://www.reefseacenter.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group transition-all duration-500 hover:scale-105 opacity-60 hover:opacity-100"
          >
            {siteAssets?.reefLogo && (
              <img 
                src={siteAssets.reefLogo} 
                alt="מועדון ריף" 
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover bg-white transition-all duration-500 shadow-sm" 
                referrerPolicy="no-referrer"
              />
            )}
          </a>
        </div>
      </div>
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showSeaWaterAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#121214] border border-white/[0.08] p-8 max-w-sm w-full rounded-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-white/10 text-white flex items-center justify-center mx-auto mb-6 rounded-2xl">
                <RotateCcw size={32} />
              </div>

              <div className="relative z-10 text-center">
                <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">שכחת סיסמה?</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-8">
                  נראה שהתבלבלת בסיסמה 3 פעמים. האם תרצה שנשלח לך סיסמה זמנית לאימייל כדי שתוכל להתחבר?
                </p>
                
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin text-black" size={18} /> : <Mail size={18} />}
                    <span>כן, שלחו לי למייל</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSeaWaterAlert(false);
                      setFailedAttempts(0);
                    }}
                    disabled={isLoading}
                    className="w-full h-12 bg-transparent hover:bg-white/5 text-white/60 hover:text-white rounded-xl font-medium text-sm transition-all"
                  >
                    לא, אני אנסה שוב
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;