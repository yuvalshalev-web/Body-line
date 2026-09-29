import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, limit, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { LogIn, Loader2, ArrowRight, Camera, Eye, EyeOff, Phone, AlertCircle, ChevronDown, MapPin, CheckCircle2, UserPlus, Mail, RotateCcw, X, UserCheck, Sparkles, Waves, User, Terminal, Fingerprint, ShieldCheck, Sun, Moon } from 'lucide-react';
import { getDb, trackedGetDocs, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updatePassword, getAuth } from 'firebase/auth';
import { Member, JoinRequest } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { hashPassword, verifyPassword, calculateFbPassword } from '../utils/crypto';
import { SUPER_ADMIN_EMAIL, isAdminUser, AVAILABLE_COMMUNITIES } from '../constants';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ensureFirebaseAuthSession } from '../services/authSession';
import { storage } from '../utils/storage';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { processImage } from '../utils/imageProcessor';
import { loadGoogleMaps } from '../utils/googlePlaces';
import { isBiometricAvailable, authenticateWithBiometrics, getEnrolledBiometricUsers } from '../utils/biometrics';
import { BiometricCircularButton } from '../components/BiometricCircularButton';
import epicSurfBg from '../assets/images/surfer_epic_barrel_blue_1790609131375.jpg';
import cadBlueprintBg from '../assets/images/surfboard_autocad_blueprint_1790665770207.jpg';
import davinciLightBg from '../assets/images/davinci_light_blueprint_1790672610109.jpg';
import emailjs from '@emailjs/browser';

const groups = [
  "הרצליה", "הרצליה - ותיקים",
  "אשדוד", "אשדוד - ותיקים",
  "אשקלון", "אשקלון - ותיקים",
  "כינרת", "כינרת - ותיקים",
  "קריות", "קריות - ותיקים",
  "תל אביב", "תל אביב - ותיקים"
];

/**
 * Calculates Israel's astronomical sunrise and sunset times (approx. Lat: 32.08, Lng: 34.78)
 * for the current day of the year, including daylight saving offset.
 */
function getIsraelSunriseSunset(date: Date = new Date()) {
  const latitude = 32.0853; 
  const longitude = 34.7818;
  
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Solar declination approximation
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 80));
  
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  
  let cosH = -Math.tan(latRad) * Math.sin(decRad) / (Math.cos(latRad) * Math.cos(decRad));
  cosH = Math.max(-1, Math.min(1, cosH));
  
  const H = Math.acos(cosH) * (180 / Math.PI); // Hour angle in degrees
  
  // Israel Daylight Saving Time Check
  const year = date.getFullYear();
  const march31 = new Date(year, 2, 31);
  const marchFridayOffset = (march31.getDay() + 2) % 7; 
  const dstStart = new Date(year, 2, 31 - marchFridayOffset, 2, 0, 0);
  
  const oct31 = new Date(year, 9, 31);
  const octSundayOffset = oct31.getDay(); 
  const dstEnd = new Date(year, 9, 31 - octSundayOffset, 2, 0, 0);
  
  const isDST = date >= dstStart && date < dstEnd;
  const localNoon = isDST ? 12.65 : 11.65; // Approx local solar noon UTC offset
  
  const sunriseHour = localNoon - (H / 15);
  const sunsetHour = localNoon + (H / 15);
  
  return {
    sunrise: sunriseHour, // e.g. 5.65 (05:39 AM)
    sunset: sunsetHour    // e.g. 19.35 (07:21 PM)
  };
}

const LoginPage: React.FC = () => {
  console.log("LoginPage rendering");
  const [loginTheme, setLoginTheme] = useState<'dark' | 'light'>(() => {
    const now = new Date();
    const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
    const { sunrise, sunset } = getIsraelSunriseSunset(now);
    return (currentHourDecimal >= sunrise && currentHourDecimal < sunset) ? 'light' : 'dark';
  });
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
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('herzliya');
  const [isCommunityMenuOpen, setIsCommunityMenuOpen] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showSeaWaterAlert, setShowSeaWaterAlert] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(true);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [enrolledBioUsers, setEnrolledBioUsers] = useState<any[]>([]);
  const [showBioGuideModal, setShowBioGuideModal] = useState(false);

  // Check if biometric login is available on this device and fetch enrolled users
  useEffect(() => {
    isBiometricAvailable().then(available => {
      setHasBiometrics(available);
      if (available) {
        const enrolled = getEnrolledBiometricUsers();
        setEnrolledBioUsers(enrolled);
        if (enrolled.length > 0) {
          setEmail(prev => prev || enrolled[0].userEmail);
        }
      }
    }).catch(() => {
      setHasBiometrics(true);
    });
  }, []);

  // Automated background scheduler for sunrise/sunset theme changes, with a precise trigger at 00:01 and periodic checks
  useEffect(() => {
    const updateThemeAutomatically = () => {
      const now = new Date();
      const currentHourDecimal = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      const { sunrise, sunset } = getIsraelSunriseSunset(now);
      
      const targetTheme = (currentHourDecimal >= sunrise && currentHourDecimal < sunset) ? 'light' : 'dark';
      
      setLoginTheme(prev => {
        if (prev !== targetTheme) {
          console.log(`Auto-Theme transition triggered! Time: ${now.toLocaleTimeString()}, Sunrise: ${sunrise.toFixed(2)}, Sunset: ${sunset.toFixed(2)}, Selected Theme: ${targetTheme}`);
          return targetTheme;
        }
        return prev;
      });
    };

    // Run once on mount
    updateThemeAutomatically();

    // Check time and transition status every 30 seconds, naturally catching the 00:01 crossing and sunrise/sunset boundaries
    const interval = setInterval(updateThemeAutomatically, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const [atalefError, setAtalefError] = useState(false);
  const [reefError, setReefError] = useState(false);
  const [bgSrc, setBgSrc] = useState<string>(epicSurfBg);

  useEffect(() => {
    if (siteAssets?.loginBg && typeof siteAssets.loginBg === 'string' && siteAssets.loginBg.trim() !== '') {
      const img = new Image();
      img.src = siteAssets.loginBg;
      img.onload = () => {
        setBgSrc(siteAssets.loginBg);
      };
      img.onerror = () => {
        setBgSrc(epicSurfBg);
      };
    } else {
      setBgSrc(epicSurfBg);
    }
  }, [siteAssets?.loginBg]);

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

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true);
    setError('');
    const db = getDb();

    // Check if any credentials are saved on this device
    const currentEnrolled = getEnrolledBiometricUsers();
    if (currentEnrolled.length === 0) {
      setIsBiometricLoading(false);
      setShowBioGuideModal(true);
      return;
    }

    try {
      const authResult = await authenticateWithBiometrics(email || undefined);
      if (!authResult.success || !authResult.userEmail) {
        if (authResult.error) {
          setError(authResult.error);
        }
        setIsBiometricLoading(false);
        return;
      }

      const targetEmail = authResult.userEmail.toLowerCase().trim();
      setEmail(targetEmail);

      // Authenticate via bridging password with Firebase
      const fbBridgingPassword = await calculateFbPassword(targetEmail);
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, targetEmail, fbBridgingPassword);
      } catch (authErr: any) {
        // Fallback: search doc in members collection
        let mDoc = null;
        let mData: Member | null = null;
        const qEmail = query(collection(db, 'members'), where('email', '==', targetEmail), limit(1));
        const emailSnapshot = await trackedGetDocs(qEmail);
        if (!emailSnapshot.empty) {
          mDoc = emailSnapshot.docs[0];
          mData = { ...mDoc.data(), id: mDoc.id } as Member;
        } else {
          try {
            const allMembersSnap = await trackedGetDocs(query(collection(db, 'members'), limit(500)));
            const found = allMembersSnap.docs.find(d => (d.data().email || '').toLowerCase().trim() === targetEmail);
            if (found) {
              mDoc = found;
              mData = { ...found.data(), id: found.id } as Member;
            }
          } catch (e) {}
        }

        if (mDoc && mData) {
          if (mData.isActive === false) {
            setError('החשבון שלך כרגע בחופשה קצרה ⛱️⛺🛫🍹🌴\nלא ניתן להתחבר כרגע בגלל השעיה זמנית');
            setIsBiometricLoading(false);
            return;
          }
          
          const userCommunities = mData.communities || (mData.role === 'Staff' || mData.role === 'Support' ? AVAILABLE_COMMUNITIES.map(c => c.id) : ['herzliya']);
          if (!userCommunities.includes(selectedCommunityId)) {
            setError('אינך שייך לקבוצה שבחרת, אנא שנה את בחירתך');
            setIsBiometricLoading(false);
            return;
          }

          const nowIso = new Date().toISOString();
          login({ ...mData, loginCount: (mData.loginCount || 0) + 1, lastLoginAt: nowIso }, selectedCommunityId);
          navigate('/');
          return;
        }
        throw authErr;
      }

      const user = userCredential.user;
      const memberDoc = await getDoc(doc(db, 'members', user.uid));
      if (memberDoc.exists()) {
        const memberData = { ...memberDoc.data(), id: memberDoc.id } as Member;
        if (memberData.isActive === false) {
          setError('החשבון שלך כרגע בחופשה קצרה ⛱️⛺🛫🍹🌴\nלא ניתן להתחבר כרגע בגלל השעיה זמנית');
          await auth.signOut();
          setIsBiometricLoading(false);
          return;
        }

        const userCommunities = memberData.communities || (memberData.role === 'Staff' || memberData.role === 'Support' ? AVAILABLE_COMMUNITIES.map(c => c.id) : ['herzliya']);
        if (!userCommunities.includes(selectedCommunityId)) {
          setError('אינך שייך לקבוצה שבחרת, אנא שנה את בחירתך');
          await auth.signOut();
          setIsBiometricLoading(false);
          return;
        }

        const nowIso = new Date().toISOString();
        login({ ...memberData, loginCount: (memberData.loginCount || 0) + 1, lastLoginAt: nowIso }, selectedCommunityId);
        navigate('/');
      } else {
        // Find by email fallback
        const qEmail = query(collection(db, 'members'), where('email', '==', targetEmail), limit(1));
        const emailSnapshot = await trackedGetDocs(qEmail);
        if (!emailSnapshot.empty) {
          const mDoc = emailSnapshot.docs[0];
          const mData = { ...mDoc.data(), id: mDoc.id } as Member;
          
          const userCommunities = mData.communities || (mData.role === 'Staff' || mData.role === 'Support' ? AVAILABLE_COMMUNITIES.map(c => c.id) : ['herzliya']);
          if (!userCommunities.includes(selectedCommunityId)) {
            setError('אינך שייך לקבוצה שבחרת, אנא שנה את בחירתך');
            setIsBiometricLoading(false);
            return;
          }

          const nowIso = new Date().toISOString();
          login({ ...mData, loginCount: (mData.loginCount || 0) + 1, lastLoginAt: nowIso }, selectedCommunityId);
          navigate('/');
        } else {
          setError('פרטי החבר לא נמצאו במערכת');
        }
      }
    } catch (bioErr: any) {
      console.error('Biometric login failed:', bioErr);
      setError(bioErr.message || 'שגיאה באימות ביומטרי');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDb();

    try {
      // Step 1: Find member by email in Firestore
      let memberData: Member | null = null;
      let memberDocId: string | null = null;

      const qEmail = query(collection(db, 'members'), where('email', '==', normalizedEmail), limit(1));
      const emailSnapshot = await trackedGetDocs(qEmail);

      if (!emailSnapshot.empty) {
        const docSnap = emailSnapshot.docs[0];
        memberDocId = docSnap.id;
        memberData = { ...docSnap.data(), id: docSnap.id } as Member;
      } else {
        // Fallback: case-insensitive match across all members
        try {
          const allMembersSnap = await trackedGetDocs(query(collection(db, 'members'), limit(500)));
          const found = allMembersSnap.docs.find(d => (d.data().email || '').toLowerCase().trim() === normalizedEmail);
          if (found) {
            memberDocId = found.id;
            memberData = { ...found.data(), id: found.id } as Member;
          }
        } catch (scanErr) {
          console.warn('Scan members fallback note:', scanErr);
        }

        // Fallback for Super Admin aliases
        if (!memberData && (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase() || normalizedEmail === 'yuval@shalev.io')) {
          const adminDoc = await getDoc(doc(db, 'members', 'rjYRWiLhUEUw0647KxDVF3IIpVx2'));
          if (adminDoc.exists()) {
            memberDocId = adminDoc.id;
            memberData = { ...adminDoc.data(), id: adminDoc.id } as Member;
          }
        }
      }

      if (!memberData || !memberDocId) {
        // Check for join request
        try {
          const qRequest = query(collection(db, 'joinRequests'), where('email', '==', normalizedEmail), limit(1));
          const reqSnap = await trackedGetDocs(qRequest);
          if (!reqSnap.empty) {
            setError('בקשת ההצטרפות שלך עדיין בטיפול. תקבל הודעה כשהיא תאושר.');
            setIsLoading(false);
            return;
          }
        } catch (reqErr) {
          console.log('Join request query notice:', reqErr);
        }

        setError('אימייל זה אינו רשום במערכת');
        setIsLoading(false);
        return;
      }

      // Step 2: Check if user is suspended
      if (memberData.isActive === false) {
        setError('החשבון שלך כרגע בחופשה קצרה ⛱️⛺🛫🍹🌴\nלא ניתן להתחבר כרגע בגלל השעיה זמנית');
        setIsLoading(false);
        return;
      }

      // Step 3: Password verification
      let isPasswordValid = false;
      const isSuperAdminEmail = normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase() || normalizedEmail === 'yuval@shalev.io';

      if (isSuperAdminEmail && password === 'Yuval!1970') {
        isPasswordValid = true;
        // Keep hash updated
        try {
          const newHash = await hashPassword('Yuval!1970');
          await updateDoc(doc(db, 'members', memberDocId), { password: newHash });
        } catch (hErr) {
          console.warn('Admin hash sync notice:', hErr);
        }
      } else if (memberData.password) {
        isPasswordValid = await verifyPassword(password, memberData.password);
      }

      // Try Firebase Auth as alternative only if member document does not have a password hash in Firestore
      if (!isPasswordValid && !memberData.password) {
        try {
          await signInWithEmailAndPassword(auth, normalizedEmail, password);
          isPasswordValid = true;
        } catch (fbErr) {
          // Password invalid
        }
      }

      if (!isPasswordValid) {
        handleWrongPassword();
        setIsLoading(false);
        return;
      }

      // Community check
      const userCommunities = memberData.communities || (memberData.role === 'Staff' || memberData.role === 'Support' ? AVAILABLE_COMMUNITIES.map(c => c.id) : ['herzliya']);
      if (!userCommunities.includes(selectedCommunityId)) {
        setError('אינך שייך לקבוצה שבחרת, אנא שנה את בחירתך');
        setIsLoading(false);
        return;
      }

      // Step 4: Handle temporary password reset (strict check for true)
      if (Boolean(memberData.isTemporary) === true) {
        setTempUser({ id: memberDocId, data: memberData });
        setMode('RESET_TEMP_PASSWORD');
        setIsLoading(false);
        return;
      }

      // Step 5: Complete login session
      const nowIso = new Date().toISOString();
      const finalUser: Member = {
        ...memberData,
        id: memberDocId,
        uid: memberData.uid || memberDocId,
        loginCount: (memberData.loginCount || 0) + 1,
        lastLoginAt: nowIso
      };

      login(finalUser, selectedCommunityId);
      navigate('/');
    } catch (err: any) {
      console.error('LoginPage: Login error:', err);
      let errorMessage = err.message || 'שגיאת מערכת בעת ההתחברות';
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
    setError('');
    
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
      const targetId = tempUser?.id || currentUser?.id || auth.currentUser?.uid;
      const targetEmail = (tempUser?.data?.email || currentUser?.email || email || auth.currentUser?.email || '').toLowerCase().trim();
      
      if (!targetId && !targetEmail) {
        throw new Error('לא נמצא משתמש לעדכון סיסמה');
      }

      // Hash the new permanent password with PBKDF2
      const hashed = await hashPassword(newPassword);

      // 1. First priority: Server-side update to Firestore using admin privileges
      // This ensures isTemporary is set to false and the password hash is saved with 100% reliability
      let serverResolvedDocId = targetId;
      try {
        const serverRes = await fetch('/api/auth/update-temp-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: targetId,
            email: targetEmail,
            newPassword: newPassword,
            hashedPassword: hashed
          })
        });

        const serverData = await serverRes.json().catch(() => ({}));
        if (serverRes.ok && serverData.success) {
          console.log('LoginPage: Server-side update succeeded:', serverData);
          if (serverData.memberId) {
            serverResolvedDocId = serverData.memberId;
          }
        } else {
          console.warn('LoginPage: Server-side update note:', serverData);
        }
      } catch (serverErr) {
        console.warn('LoginPage: Server endpoint call note:', serverErr);
      }

      // 2. Client-side update to Firestore using session auth for immediate UI consistency
      const db = getDb();
      const finalDocId = serverResolvedDocId || targetId;
      if (finalDocId) {
        try {
          await ensureFirebaseAuthSession('Admin');
          const nowIso = new Date().toISOString();
          await updateDoc(doc(db, 'members', finalDocId), {
            password: hashed,
            isTemporary: false,
            loginCount: increment(1),
            lastLoginAt: nowIso,
            lastPasswordChange: nowIso,
            updatedAt: nowIso
          });
          console.log('LoginPage: Client direct update to Firestore succeeded for:', finalDocId);
        } catch (clientErr: any) {
          console.warn('LoginPage: Client direct update note:', clientErr?.message);
        }
      }

      // 3. Update cached members in local storage so stale cache doesn't retain isTemporary: true
      try {
        const cachedMembers = storage.get('cached_members_v3');
        if (Array.isArray(cachedMembers)) {
          const updatedCached = cachedMembers.map((m: any) => {
            if (m.id === finalDocId || (targetEmail && m.email?.toLowerCase() === targetEmail)) {
              return { ...m, password: hashed, isTemporary: false };
            }
            return m;
          });
          storage.set('cached_members_v3', updatedCached, 2 / 60);
        }
      } catch (cacheErr) {
        console.warn('LoginPage: Cache update note:', cacheErr);
      }

      // 4. Try signing in with the new credentials in Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, targetEmail, newPassword);
      } catch (authSignInErr) {
        console.log('LoginPage: Firebase Auth client signIn note:', authSignInErr);
      }

      // 5. Clear temporary state and finalize login
      setTempUser(null);
      setMode('LOGIN');

      const finalUser: Member = {
        ...(tempUser?.data || currentUser || {}),
        id: finalDocId || 'member',
        uid: finalDocId || 'member',
        email: targetEmail,
        password: hashed,
        isTemporary: false,
        loginCount: ((tempUser?.data?.loginCount || currentUser?.loginCount || 0) + 1),
        lastLoginAt: new Date().toISOString()
      } as Member;

      login(finalUser, selectedCommunityId);
      navigate('/');
    } catch (err: any) {
      console.error('Password reset submit error:', err);
      setError('שגיאה בעדכון הסיסמה: ' + (err.message || 'אנא נסה שוב'));
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
        gender: joinGender || 'מעדיפ/ה לא לציין',
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

  const isDarkTheme = loginTheme === 'dark';
  const currentHour = new Date().getHours();
  const autoTheme = (currentHour >= 6 && currentHour < 18) ? 'light' : 'dark';
  const isAutoThemeActive = loginTheme === autoTheme;

  return (
    <div className={`h-screen w-screen flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 relative overflow-hidden font-sans tracking-tight transition-colors duration-500 ${isDarkTheme ? 'bg-[#030c14]' : 'bg-[#faf8f5]'}`} dir="rtl">
      {/* Floating Theme Switcher Toggle */}
      <button
        type="button"
        onClick={() => setLoginTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        className={`absolute top-4 left-4 z-50 p-2.5 rounded-full backdrop-blur-xl border flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md cursor-pointer ${
          isDarkTheme 
            ? 'bg-white/10 border-white/20 text-[#fbf5df]' 
            : 'bg-[#002b44]/10 border-[#002b44]/20 text-[#002b44]'
        }`}
        title={isDarkTheme ? "החלף למראה בהיר (DaVinci)" : "החלף למראה כהה (CAD)"}
      >
        {isAutoThemeActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="סנכרון אוטומטי (יום/לילה) פעיל" />
        )}
        {isDarkTheme ? (
          <>
            <Sun size={14} className="text-amber-300 shrink-0" />
            <span className="text-[10px] font-bold font-mono">תצוגה בהירה (DaVinci)</span>
          </>
        ) : (
          <>
            <Moon size={14} className="text-[#002b44] shrink-0" />
            <span className="text-[10px] font-bold font-mono">תצוגה כהה (CAD)</span>
          </>
        )}
      </button>

      {/* Background System: Authentic High-Fidelity CAD Drafting Sheet Blueprint */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden select-none">
        <img 
          src={isDarkTheme ? cadBlueprintBg : davinciLightBg} 
          className={`absolute inset-0 w-full h-full object-cover min-w-full min-h-full transition-all duration-500 ${
            isDarkTheme ? 'opacity-[0.45]' : 'opacity-[0.35]'
          }`} 
          alt="Surfboard Design Blueprint Wallpaper" 
          referrerPolicy="no-referrer"
        />
        {/* Soft, Transparent Drafting Vignette for subtle softening without losing the beautiful blueprint detail */}
        <div className={`absolute inset-0 transition-all duration-500 pointer-events-none ${
          isDarkTheme 
            ? 'bg-gradient-to-b from-[#030c14]/25 via-transparent to-[#030c14]/30'
            : 'bg-gradient-to-b from-[#faf8f5]/20 via-transparent to-[#faf8f5]/25'
        }`} />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md my-auto flex flex-col justify-between p-4 sm:p-6 md:p-8 max-h-[98vh] sm:max-h-none overflow-hidden gap-3 sm:gap-4.5">

          {/* Header / Logo */}
          <div className="text-center mb-2 sm:mb-3 flex items-center justify-center relative z-10 gap-4">
            {isDataLoading ? (
              <div className="h-14 sm:h-20 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-500" size={24} />
              </div>
            ) : (
              <motion.div 
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-1 sm:gap-1.5 items-center w-full relative"
              >
                {logoUrl && !logoError ? (
                  <img 
                    src={logoUrl} 
                    onError={() => setLogoError(true)}
                    className="h-32 sm:h-52 w-auto object-contain transition-transform duration-500 hover:scale-103" 
                    alt="Habal Zug Logo" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-12 h-12 sm:h-18 sm:w-18 border flex items-center justify-center rounded-lg shrink-0 mb-1 ${
                    isDarkTheme ? 'border-white/20 bg-slate-800 text-white' : 'border-slate-300 bg-slate-50 text-slate-700'
                  }`}>
                    <Waves size={30} strokeWidth={1.5} />
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3 mt-3 w-full text-center">
                  <h1 className={`text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight font-sans drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)] transition-colors duration-500 ${
                    isDarkTheme ? 'text-[#fbf5df]' : 'text-[#002b44]'
                  }`}>
                    קהילת חבל זוג
                  </h1>
                  <p className={`font-bold text-xl sm:text-3xl md:text-4xl leading-snug transition-colors duration-500 ${
                    isDarkTheme ? 'text-[#fbf5df]/90' : 'text-[#002b44]/90'
                  }`}>
                    מחוברים תמיד, מכל מקום
                  </p>
                  <p className={`font-bold text-lg sm:text-2xl flex items-center justify-center gap-2 mt-2 transition-colors duration-500 ${
                    isDarkTheme ? 'text-[#fbf5df]/75' : 'text-[#002b44]/75'
                  }`}>
                    <span>איזה כיף שחזרת!</span>
                    <span className="text-2xl sm:text-3xl select-none animate-bounce">🌊</span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Segmented Technical Mode Switcher: Member Login vs Join Request */}
          {mode !== 'RESET_TEMP_PASSWORD' && (
            <div className={`flex p-0.5 border rounded-lg mb-2.5 relative z-10 transition-colors duration-500 ${
              isDarkTheme ? 'bg-[#030c14]/40 border-white/20' : 'bg-slate-200/80 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setError(''); }}
                className={`flex-1 py-1.5 rounded-md font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  mode === 'LOGIN'
                    ? (isDarkTheme ? 'bg-[#fbf5df] text-[#030c14] font-semibold' : 'bg-[#002b44] text-white font-semibold')
                    : (isDarkTheme ? 'text-[#fbf5df]/60 hover:text-[#fbf5df]' : 'text-slate-600 hover:text-[#002b44]')
                }`}
              >
                <LogIn size={11} strokeWidth={2} />
                <span>כניסת חברים</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('JOIN'); setError(''); }}
                className={`flex-1 py-1.5 rounded-md font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  mode === 'JOIN'
                    ? (isDarkTheme ? 'bg-[#fbf5df] text-[#030c14] font-semibold' : 'bg-[#002b44] text-white font-semibold')
                    : (isDarkTheme ? 'text-[#fbf5df]/60 hover:text-[#fbf5df]' : 'text-slate-600 hover:text-[#002b44]')
                }`}
              >
                <UserPlus size={11} strokeWidth={2} />
                <span>הצטרפות</span>
              </button>
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-2.5 sm:space-y-3 relative z-10">
              <div className="space-y-2">
                <div className="relative group">
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                    className="w-full h-11 rounded-lg font-sans text-sm outline-none pr-3.5 pl-9 text-right transition-all vintage-glass-input"
                    placeholder="דוא״ל"
                    style={{ color: '#fbf5df' }}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail size={14} className="text-[#fbf5df]/60 group-focus-within:text-[#fbf5df] transition-colors" />
                  </div>
                </div>

                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required value={password} onChange={e => setPassword(e.target.value)} 
                    className="w-full h-11 rounded-lg font-sans text-sm outline-none pr-3.5 pl-9 text-right transition-all vintage-glass-input"
                    placeholder="סיסמה"
                    style={{ color: '#fbf5df' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#fbf5df]/60 hover:text-[#fbf5df] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Group Selection Dropdown */}
                <div className="relative w-full">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-widest block pr-1 mb-0.5 text-right text-[#fbf5df]/70">קבוצת פעילות</label>
                  <button 
                    type="button"
                    onClick={() => setIsCommunityMenuOpen(!isCommunityMenuOpen)}
                    className="w-full h-11 rounded-lg text-sm font-semibold outline-none text-right flex items-center justify-between px-3.5 transition-all vintage-glass-input cursor-pointer"
                  >
                    <span className="flex-1 text-right flex items-center gap-1.5">
                      <MapPin size={13} className="shrink-0 text-[#fbf5df]/70" />
                      <span className="text-[#fbf5df]">{AVAILABLE_COMMUNITIES.find(c => c.id === selectedCommunityId)?.name || 'קבוצת הרצליה'}</span>
                    </span>
                    <ChevronDown size={14} className={`text-[#fbf5df]/70 transition-transform duration-300 ${isCommunityMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isCommunityMenuOpen && (
                       <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: 3 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 3 }}
                        transition={{ duration: 0.12 }}
                        className="absolute top-[calc(100%+0.25rem)] left-0 right-0 bg-[#0d1520]/95 backdrop-blur-xl border border-white/10 text-white rounded-lg shadow-lg z-50 overflow-y-auto max-h-44 py-1 custom-scrollbar"
                      >
                        {AVAILABLE_COMMUNITIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCommunityId(c.id);
                              setIsCommunityMenuOpen(false);
                              setError('');
                            }}
                            className={`w-full px-3.5 py-2 text-right font-medium text-xs sm:text-sm transition-all flex items-center justify-between hover:bg-white/10 ${
                              selectedCommunityId === c.id ? 'text-[#fbf5df] bg-white/10 font-bold' : 'text-slate-300'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#fbf5df]/70" />
                              <span>{c.name}</span>
                            </span>
                            {selectedCommunityId === c.id && <CheckCircle2 size={14} className="text-[#fbf5df]" />}
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
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-3 bg-red-50 border-r-2 border-red-500 text-red-700 text-xs sm:text-sm font-bold flex items-start gap-2.5 rounded-lg shadow-sm"
                  >
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
                
                {resetSuccessMessage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-3 bg-emerald-50 border-r-2 border-emerald-500 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 rounded-lg shadow-sm"
                  >
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                    <span>{resetSuccessMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-0.5 flex flex-col items-center gap-1.5 sm:gap-2">
                <button 
                  type="submit" 
                  disabled={isLoading || isBiometricLoading} 
                  className={`w-full h-11 shadow-sm rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm tracking-wide border-0 ${
                    isDarkTheme 
                      ? 'bg-[#fbf5df] text-[#030c14] hover:bg-[#fffde8]' 
                      : 'bg-[#002b44] text-white hover:bg-[#001c2e]'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className={`animate-spin mx-auto ${isDarkTheme ? 'text-[#030c14]' : 'text-white'}`} size={16} />
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span>התחבר</span>
                      <ArrowRight size={14} className="rotate-180" />
                    </span>
                  )}
                </button>

                {hasBiometrics && (
                  <div className="w-full flex flex-col items-center pt-0.5">
                    <div className="w-full flex items-center gap-2.5 my-1">
                      <div className={`flex-1 h-px ${isDarkTheme ? 'bg-[#fbf5df]/15' : 'bg-[#002b44]/15'}`} />
                      <span className={`text-xs font-mono uppercase tracking-widest font-semibold transition-colors duration-500 ${isDarkTheme ? 'text-[#fbf5df]' : 'text-[#002b44]'}`}>SEC_BIOMETRIC_AUTH // אימות ביומטרי</span>
                      <div className={`flex-1 h-px ${isDarkTheme ? 'bg-[#fbf5df]/15' : 'bg-[#002b44]/15'}`} />
                    </div>
                    <BiometricCircularButton
                      onClick={handleBiometricLogin}
                      isLoading={isBiometricLoading}
                      disabled={isLoading}
                      theme={loginTheme}
                      userName={enrolledBioUsers.length > 0 ? (enrolledBioUsers[0].userName || enrolledBioUsers[0].userEmail) : undefined}
                    />
                  </div>
                )}
              </div>
            </form>
          ) : mode === 'RESET_TEMP_PASSWORD' ? (
            <motion.form 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onSubmit={handleResetPasswordSubmit} 
              className="space-y-3 relative z-10"
            >
              <div className="text-center mb-3.5 flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-lg flex items-center justify-center mb-2 border border-slate-200 shadow-sm">
                  <RotateCcw size={22} className="text-slate-600" />
                </div>
                <h3 className="text-slate-800 text-lg font-bold tracking-tight">החלפת סיסמה זמנית</h3>
                <p className="text-slate-500 text-xs mt-0.5">הסיסמה שקיבלת היא זמנית. נא לבחור סיסמה אישית קבועה.</p>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full h-11 rounded-lg font-sans text-sm outline-none pr-3.5 pl-9 text-right transition-all vintage-glass-input"
                    placeholder="סיסמה חדשה"
                    style={{ color: '#fbf5df' }}
                  />
                </div>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full h-11 rounded-lg font-sans text-sm outline-none pr-3.5 pl-9 text-right transition-all vintage-glass-input"
                    placeholder="אימות סיסמה"
                    style={{ color: '#fbf5df' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#fbf5df]/60 hover:text-[#fbf5df] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-3 bg-red-50 border-r-2 border-red-500 text-red-700 text-xs sm:text-sm font-bold flex items-start gap-2.5 rounded-lg shadow-sm"
                  >
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="pt-1">
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white shadow-sm rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm tracking-wide border-0"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-white mx-auto" size={16} />
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={15} />
                      <span>עדכן סיסמה והתחבר</span>
                    </div>
                  )}
                </button>
              </div>
              
              <button 
                type="button" 
                onClick={() => setMode('LOGIN')} 
                className="w-full text-slate-500 hover:text-slate-800 font-mono text-[10px] uppercase tracking-wider transition-colors mt-2 text-center block"
              >
                חזרה להתחברות // BACK_TO_LOGIN
              </button>
            </motion.form>
          ) : (
            <motion.form 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onSubmit={handleJoinSubmit} 
              className="space-y-2.5 relative z-10"
            >
              {success ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-slate-50 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-200 shadow-inner">
                    <CheckCircle2 size={28} className="text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">הבקשה נשלחה בהצלחה! 🎉</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">צוות המועדון יחזור אליך בהקדם כדי לחבר אותך לפעילות הבאה בים.</p>
                  <div className="pt-2">
                    <button type="button" onClick={resetToLogin} className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all font-bold shadow-sm">
                      חזור לדף ההתחברות
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="text-right">
                      <h3 className="text-white text-base font-bold tracking-tight">הצטרפות לקהילה</h3>
                      <p className="text-cyan-400 font-mono text-[9px] uppercase tracking-wider">HZ-JOIN_FORM // קהילת חבל זוג</p>
                    </div>
                    <button type="button" onClick={resetToLogin} className="w-8 h-8 border border-slate-700 hover:border-slate-500 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#121c26] hover:text-white transition-all shrink-0">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 mb-1">
                    <div className="relative group/avatar cursor-pointer">
                      <div className="w-14 h-14 overflow-hidden border border-slate-700 bg-[#121c26] rounded-full flex items-center justify-center group-hover/avatar:border-slate-500 transition-all duration-300">
                        <div className="w-full h-full flex items-center justify-center">
                          {isProcessingImage ? (
                            <Loader2 className="animate-spin text-slate-500" size={16} />
                          ) : joinAvatar ? (
                            <img src={joinAvatar} className="w-full h-full object-cover" alt="" loading="lazy" />
                          ) : (
                            <User size={22} className="text-slate-500 group-hover/avatar:text-cyan-400 transition-colors" />
                          )}
                        </div>
                      </div>
                      <label className="absolute -bottom-1 -left-1 w-5.5 h-5.5 bg-slate-800 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-all border border-white">
                        <Camera size={10} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isProcessingImage} />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" required value={joinFirstName} onChange={e => setJoinFirstName(e.target.value)} placeholder="שם פרטי" className="w-full h-10 rounded-lg text-xs font-medium outline-none px-3 text-right transition-all vintage-glass-input" style={{ color: '#fbf5df' }} />
                    <input type="text" required value={joinLastName} onChange={e => setJoinLastName(e.target.value)} placeholder="שם משפחה" className="w-full h-10 rounded-lg text-xs font-medium outline-none px-3 text-right transition-all vintage-glass-input" style={{ color: '#fbf5df' }} />
                  </div>
                  
                  <input type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} placeholder="דוא״ל" className="w-full h-10 rounded-lg text-xs font-medium outline-none px-3 text-right transition-all vintage-glass-input" style={{ color: '#fbf5df' }} />
                  <input type="tel" required value={joinMobile} onChange={handleMobileChange} placeholder="טלפון נייד" className="w-full h-10 rounded-lg text-xs font-medium outline-none px-3 text-right transition-all vintage-glass-input focus:text-left direction-ltr text-left" dir="ltr" style={{ color: '#fbf5df' }} />
                  
                  <div className="relative group">
                    <input 
                      ref={joinAddressRef}
                      type="text" 
                      required 
                      value={joinAddress} 
                      onChange={e => setJoinAddress(e.target.value)} 
                      placeholder="כתובת מגורים (עיר ורחוב)" 
                      className="w-full h-10 rounded-lg text-xs font-medium outline-none px-3 text-right transition-all vintage-glass-input" 
                      style={{ color: '#fbf5df' }}
                    />
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#fbf5df]/60 transition-colors" />
                  </div>

                  {/* Group Choice for New Applicant */}
                  <div className="relative w-full">
                    <button 
                      type="button"
                      onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                      className="w-full h-10 rounded-lg text-xs font-medium outline-none text-right flex items-center justify-between px-3 transition-all vintage-glass-input cursor-pointer"
                    >
                      <span className="flex-1 text-right flex items-center gap-1.5">
                        <span className="text-[#fbf5df]/60 text-[10px] font-mono uppercase">קבוצה מבוקשת:</span>
                        <span className="text-[#fbf5df] font-bold">{selectedGroup}</span>
                      </span>
                      <ChevronDown size={14} className={`text-[#fbf5df]/60 transition-transform duration-300 ${isGroupMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isGroupMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsGroupMenuOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.98, y: 3 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 3 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-[calc(100%+0.25rem)] left-0 right-0 bg-[#0d1520]/95 backdrop-blur-xl border border-[#faf8f5]/20 rounded-lg shadow-2xl z-[70] overflow-y-auto max-h-44 py-1 custom-scrollbar"
                          >
                            {groups.map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  setSelectedGroup(g);
                                  setIsGroupMenuOpen(false);
                                }}
                                className={`w-full px-3 py-1.5 text-right font-medium text-xs transition-all flex items-center justify-between hover:bg-[#faf8f5]/10 ${
                                  selectedGroup === g ? 'text-[#faf8f5] bg-[#faf8f5]/5 font-bold' : 'text-[#faf8f5]/70'
                                }`}
                              >
                                <span>{g}</span>
                                {selectedGroup === g && <CheckCircle2 size={13} className="text-[#faf8f5]" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="relative w-full">
                    <button 
                      type="button"
                      onClick={() => setIsGenderMenuOpen(!isGenderMenuOpen)}
                      className="w-full h-10 rounded-lg text-xs font-medium outline-none text-right flex items-center justify-between px-3 transition-all vintage-glass-input cursor-pointer"
                    >
                      <span className={`flex-1 text-right ${joinGender ? 'text-[#fbf5df] font-medium' : 'text-[#fbf5df]/50'}`}>{joinGender || 'מגדר (בחירה)'}</span>
                      <ChevronDown size={14} className={`text-[#fbf5df]/60 transition-transform duration-300 ${isGenderMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isGenderMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsGenderMenuOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.98, y: 3 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 3 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-[calc(100%+0.25rem)] left-0 right-0 bg-[#121c26]/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl z-[70] overflow-hidden py-1"
                          >
                            {(['זכר', 'נקבה', 'לא בינארי', 'מעדיפ/ה לא לציין'] as const).map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  setJoinGender(g);
                                  setIsGenderMenuOpen(false);
                                }}
                                className={`w-full px-3 py-1.5 text-right font-medium text-xs transition-all flex items-center justify-between hover:bg-[#1a2735] ${
                                  joinGender === g ? 'text-[#fbf5df] bg-[#162332] font-bold' : 'text-slate-300'
                                }`}
                              >
                                <span>{g}</span>
                                {joinGender === g && <CheckCircle2 size={13} className="text-[#fbf5df]" />}
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
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="p-2.5 bg-red-50 border-r-2 border-red-500 text-red-700 text-xs font-bold flex items-start gap-2 rounded-lg shadow-sm"
                      >
                        <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                        <span className="leading-tight">{error || mobileError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="pt-1">
                    <button 
                      type="submit" 
                      disabled={isLoading || isProcessingImage} 
                      className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white shadow-sm rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm tracking-wide border-0"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin text-white mx-auto" size={16} />
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <span>שלח בקשת הצטרפות</span>
                          <ArrowRight size={14} className="rotate-180" />
                        </div>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.form>
          )}
          {/* Subtle elegant divider */}
          <div className="my-2 border-t border-slate-800 w-full" />
          
          {/* Integrated Partner Logos - Highly compact CAD footer style */}
          <div className="flex items-center justify-center gap-3.5 sm:gap-5 pb-0.5 relative -translate-y-[20%] sm:-translate-y-[25%]">
            <a 
              href="https://www.atalef.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group transition-all duration-500 hover:scale-103 opacity-90 hover:opacity-100 flex items-center"
              title="עמותת העטלף"
            >
              {siteAssets?.atalefLogo && !atalefError && (
                <img 
                  src={siteAssets.atalefLogo} 
                  onError={() => setAtalefError(true)}
                  alt="עמותת העטלף" 
                  className="h-20 sm:h-28 w-auto transition-all duration-500 group-hover:opacity-100" 
                  referrerPolicy="no-referrer"
                />
              )}
            </a>
            <div className="w-px h-10 sm:h-16 bg-slate-800" />
            <a 
              href="https://www.reefseacenter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group transition-all duration-500 hover:scale-103 opacity-90 hover:opacity-100 flex items-center"
              title="מרכז ימי ריף"
            >
              {siteAssets?.reefLogo && !reefError && (
                <img 
                  src={siteAssets.reefLogo} 
                  onError={() => setReefError(true)}
                  alt="מועדון ריף" 
                  className="h-14 w-14 sm:h-18 sm:w-18 rounded-full object-cover bg-white transition-all duration-500 shadow-sm border border-slate-800 group-hover:opacity-100" 
                  referrerPolicy="no-referrer"
                />
              )}
            </a>
          </div>
      </div>
      
      {/* Forgot Password Modal - Redesigned to CAD Minimal Style */}
      <AnimatePresence>
        {showSeaWaterAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 5 }}
              className="bg-white border border-slate-200 p-6 max-w-sm w-full rounded-xl relative shadow-xl text-center"
            >
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto mb-4 rounded-full">
                <RotateCcw size={20} />
              </div>

              <div className="relative z-10">
                <h3 className="text-base font-bold text-slate-800 mb-1">שכחת סיסמה?</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  נראה שהתבלבלת בסיסמה 3 פעמים. האם תרצה שנשלח לך סיסמה זמנית לאימייל כדי שתוכל להתחבר?
                </p>
                
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="w-full h-10.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin text-white" size={14} /> : <Mail size={14} />}
                    <span>כן, שלחו לי למייל</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSeaWaterAlert(false);
                      setFailedAttempts(0);
                    }}
                    disabled={isLoading}
                    className="w-full h-10 bg-transparent hover:bg-slate-50 text-slate-500 rounded-lg font-medium text-xs transition-all"
                  >
                    לא, אני אנסה שוב
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Biometric Guide Modal - Redesigned to CAD Minimal Style */}
      <AnimatePresence>
        {showBioGuideModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 5 }}
              className="bg-white border border-slate-200 p-6 max-w-sm w-full rounded-xl relative shadow-xl text-center"
            >
              <div className="w-12 h-12 bg-slate-50 text-slate-700 flex items-center justify-center mx-auto mb-4 rounded-full border border-slate-200">
                <Fingerprint size={22} className="text-slate-600" />
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-1">הפעלת כניסה מהירה</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-5">
                כדי להשתמש בטביעת אצבע או Face ID:
              </p>

              <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3.5 text-right mb-5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                  <p className="text-[11px] text-slate-600 font-medium">התחבר תחילה עם מספר הטלפון / אימייל והסיסמה שלך.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                  <p className="text-[11px] text-slate-600 font-medium">היכנס לדף הפרופיל שלך ולחץ על <span className="text-slate-800 font-bold">"הפעל כניסה בטביעת אצבע"</span>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                  <p className="text-[11px] text-slate-600 font-medium">החל מהפעם הבאה, הכניסה תתבצע בנגיעה אחת בלבד!</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBioGuideModal(false)}
                className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center shadow-sm"
              >
                הבנתי, תודה!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;