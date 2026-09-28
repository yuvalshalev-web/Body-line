import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, limit, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { LogIn, Loader2, ArrowRight, Camera, Eye, EyeOff, Phone, AlertCircle, ChevronDown, MapPin, CheckCircle2, UserPlus, Mail, RotateCcw, X, UserCheck, Sparkles, Waves, User, Terminal, Fingerprint, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#011422] flex flex-col items-center justify-center p-2.5 sm:p-8 relative overflow-hidden font-sans tracking-tight" dir="rtl">
      {/* Background System: Real, Majestic Pacific Surf Barrel - High Visibility, Vivid & Luminous */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <img 
          src={bgSrc} 
          className="w-full h-full object-cover saturate-[1.2] contrast-[1.05] brightness-[1.0] pointer-events-none select-none" 
          alt="" 
          role="presentation"
          aria-hidden="true"
        />
        
        {/* Soft, Transparent Atmospheric Vignette - keeps image clear and vivid across the entire viewport */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#011422]/15 via-transparent to-[#011422]/25 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md my-auto flex flex-col justify-center">
        {/* Crystalline High-Transparency Sea-Glass Card - Background shines through beautifully (10% opacity) */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/30 p-3.5 sm:p-6 md:p-8 rounded-[28px] shadow-[0_20px_60px_rgba(0,18,36,0.35),0_2px_4px_rgba(0,0,0,0.02),inset_0_1.5px_2px_rgba(255,255,255,0.5)] relative max-h-[96vh] sm:max-h-none overflow-y-auto custom-scrollbar">
          
          {/* Top Aqua & Turquoise Surf Shimmer */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-400 via-[#00AFC2] to-sky-400" />

          {/* Header / Logo */}
          <div className="text-center mb-2 sm:mb-4 flex flex-col justify-center items-center relative z-10">
            {isDataLoading ? (
              <div className="h-14 sm:h-24 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00AFC2]" size={26} />
              </div>
            ) : (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col gap-1.5 sm:gap-2 items-center w-full relative"
              >
                {logoUrl && !logoError ? (
                  <img 
                    src={logoUrl} 
                    onError={() => setLogoError(true)}
                    className="h-25 sm:h-55 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,175,194,0.3)] hover:scale-105 transition-transform duration-500" 
                    alt="Habal Zug Logo" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 sm:h-24 sm:w-24 bg-gradient-to-br from-[#00AFC2] via-[#008da0] to-[#004266] flex items-center justify-center text-white rounded-xl sm:rounded-2xl shrink-0 shadow-[0_6px_20px_rgba(0,175,194,0.35)] mb-1">
                    <Waves size={30} className="sm:hidden" />
                    <Waves size={48} className="hidden sm:block" />
                  </div>
                )}

                <div className="space-y-1.5 sm:space-y-2.5">
                  <h1 className="text-slate-900 text-[20px] sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-[0_1.5px_2.5px_rgba(255,255,255,0.95)] leading-tight">
                    קהילת חבל זוג — מחוברים תמיד, מכל מקום
                  </h1>
                  <p className="text-white text-[15px] sm:text-lg md:text-xl font-black flex items-center justify-center gap-1.5 drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.45)] mt-1">
                    <span>איזה כיף שחזרת!</span>
                    <span>🌊</span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Segmented Mode Switcher: Member Login vs Join Request */}
          {mode !== 'RESET_TEMP_PASSWORD' && (
            <div className="flex p-1 bg-slate-900/[0.05] backdrop-blur-xl border border-white/80 rounded-xl sm:rounded-2xl mb-2 sm:mb-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] relative z-10">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setError(''); }}
                className={`flex-1 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 ${
                  mode === 'LOGIN'
                    ? 'bg-gradient-to-r from-[#00AFC2] to-teal-500 text-white shadow-[0_4px_16px_rgba(0,175,194,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <LogIn size={13} className="sm:w-[15px] sm:h-[15px]" />
                <span>כניסת חברים</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('JOIN'); setError(''); }}
                className={`flex-1 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 ${
                  mode === 'JOIN'
                    ? 'bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow-[0_4px_16px_rgba(14,165,233,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.4)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <UserPlus size={13} className="sm:w-[15px] sm:h-[15px]" />
                <span>הצטרפות לקהילה</span>
              </button>
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5 relative z-10">
              <div className="space-y-3.5 sm:space-y-4">
                <div className="relative group">
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                    className="w-full h-12 sm:h-13 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-xl sm:rounded-2xl text-slate-900 font-medium text-sm sm:text-base outline-none pr-4 pl-10 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]"
                    placeholder="דוא״ל"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail size={16} className="text-[#00AFC2] group-focus-within:text-cyan-700 transition-colors sm:w-[18px] sm:h-[18px]" />
                  </div>
                </div>

                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required value={password} onChange={e => setPassword(e.target.value)} 
                    className="w-full h-12 sm:h-13 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-xl sm:rounded-2xl text-slate-900 font-medium text-sm sm:text-base outline-none pr-4 pl-10 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]"
                    placeholder="סיסמה"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  </button>
                </div>

                {/* Group Selection Dropdown */}
                <div className="relative w-full">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 block pr-1 mb-1.5 text-right">קבוצת פעילות</label>
                  <button 
                    type="button"
                    onClick={() => setIsCommunityMenuOpen(!isCommunityMenuOpen)}
                    className="w-full h-12 sm:h-13 bg-white/60 hover:bg-white/80 backdrop-blur-xl border border-white/90 rounded-xl sm:rounded-2xl text-slate-800 font-semibold text-sm sm:text-base outline-none text-right flex items-center justify-between px-4 hover:border-[#00AFC2]/60 focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]"
                  >
                    <span className="flex-1 text-right flex items-center gap-1.5 sm:gap-2">
                      <MapPin size={14} className="text-[#00AFC2] shrink-0 sm:w-[16px] sm:h-[16px]" />
                      <span>{AVAILABLE_COMMUNITIES.find(c => c.id === selectedCommunityId)?.name || 'קבוצת הרצליה'}</span>
                    </span>
                    <ChevronDown size={16} className={`text-[#00AFC2] transition-transform duration-300 sm:w-[18px] sm:h-[18px] ${isCommunityMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isCommunityMenuOpen && (
                       <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-white/95 backdrop-blur-2xl border border-white/90 rounded-xl sm:rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-48 sm:max-h-60 py-1.5 custom-scrollbar"
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
                            className={`w-full px-4 py-2.5 sm:py-3 text-right font-medium text-xs sm:text-sm transition-all flex items-center justify-between hover:bg-cyan-50/80 ${
                              selectedCommunityId === c.id ? 'text-[#008ba3] bg-cyan-50 font-bold' : 'text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00AFC2]" />
                              <span>{c.name}</span>
                            </span>
                            {selectedCommunityId === c.id && <CheckCircle2 size={16} className="text-[#00AFC2]" />}
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
                    className="p-3.5 bg-rose-50/90 border-r-4 border-rose-500 text-rose-700 text-sm font-bold flex items-start gap-3 rounded-xl shadow-sm backdrop-blur-md"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
                
                {resetSuccessMessage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3.5 bg-emerald-50/90 border-r-4 border-emerald-500 text-emerald-800 text-sm font-bold flex items-center gap-3 rounded-xl shadow-sm backdrop-blur-md"
                  >
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                    <span>{resetSuccessMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-2 flex flex-col items-center gap-3 sm:gap-4.5">
                <button 
                  type="submit" 
                  disabled={isLoading || isBiometricLoading} 
                  className="w-full h-11.5 sm:h-12.5 bg-gradient-to-r from-[#00AFC2] via-teal-500 to-sky-500 hover:brightness-105 text-white shadow-[0_8px_22px_rgba(0,175,194,0.38),inset_0_1.5px_2px_rgba(255,255,255,0.6)] active:shadow-[0_2px_8px_rgba(0,175,194,0.4)] border-b-[3px] border-[#008ba3] active:border-b-0 active:translate-y-[2px] rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-black text-sm sm:text-base tracking-wide"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-white mx-auto" size={18} />
                  ) : (
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <span>התחבר</span>
                      <ArrowRight size={16} className="rotate-180 sm:w-[18px] sm:h-[18px]" />
                    </span>
                  )}
                </button>

                {hasBiometrics && (
                  <div className="w-full flex flex-col items-center pt-2.5">
                    <div className="w-full flex items-center gap-3 my-3 sm:my-3.5">
                      <div className="flex-1 h-px bg-white/25" />
                      <span className="text-xs sm:text-sm font-black text-white tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">או כניסה מהירה בנגיעה</span>
                      <div className="flex-1 h-px bg-white/25" />
                    </div>
                    <BiometricCircularButton
                      onClick={handleBiometricLogin}
                      isLoading={isBiometricLoading}
                      disabled={isLoading}
                      theme="light"
                      userName={enrolledBioUsers.length > 0 ? (enrolledBioUsers[0].userName || enrolledBioUsers[0].userEmail) : undefined}
                    />
                  </div>
                )}
              </div>
            </form>
          ) : mode === 'RESET_TEMP_PASSWORD' ? (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleResetPasswordSubmit} 
              className="space-y-5 relative z-10"
            >
              <div className="text-center mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-cyan-50 text-[#00AFC2] rounded-2xl flex items-center justify-center mb-3 border border-cyan-200 shadow-sm">
                  <RotateCcw size={30} className="animate-spin-slow text-[#00AFC2]" />
                </div>
                <h3 className="text-slate-900 text-2xl font-black tracking-tight">החלפת סיסמה זמנית</h3>
                <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">הסיסמה שקיבלת היא זמנית. נא לבחור סיסמה אישית קבועה.</p>
              </div>

              <div className="space-y-3.5">
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full h-12 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-900 font-medium text-base outline-none pr-4 pl-10 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]"
                    placeholder="סיסמה חדשה"
                  />
                </div>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full h-12 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-900 font-medium text-base outline-none pr-4 pl-10 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]"
                    placeholder="אימות סיסמה"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
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
                    className="p-3.5 bg-rose-50/90 border-r-4 border-rose-500 text-rose-700 text-sm font-bold flex items-start gap-3 rounded-xl shadow-sm backdrop-blur-md"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 bg-gradient-to-r from-[#00AFC2] via-teal-500 to-sky-500 hover:brightness-105 text-white shadow-[0_8px_22px_rgba(0,175,194,0.38),inset_0_1.5px_2px_rgba(255,255,255,0.6)] active:shadow-[0_2px_8px_rgba(0,175,194,0.4)] border-b-[3px] border-[#008ba3] active:border-b-0 active:translate-y-[2px] rounded-2xl flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-black text-base tracking-wide"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-white mx-auto" size={20} />
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
                className="w-full text-[#008ba3] hover:text-[#005f70] font-bold text-sm transition-colors mt-3 hover:underline underline-offset-4 text-center block"
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
              className="space-y-4 relative z-10"
            >
              {success ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-20 h-20 bg-cyan-50 text-[#00AFC2] rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-200 shadow-sm animate-bounce">
                    <CheckCircle2 size={40} className="text-[#00AFC2]" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">הבקשה נשלחה בהצלחה! 🎉</h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">צוות המועדון יחזור אליך בהקדם כדי לחבר אותך לפעילות הבאה בים.</p>
                  <div className="pt-4">
                    <button type="button" onClick={resetToLogin} className="w-full h-12 bg-[#00AFC2] hover:bg-[#009bb0] text-white rounded-2xl transition-all font-bold shadow-md">
                      חזור לדף ההתחברות
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-right">
                      <h3 className="text-slate-900 text-lg font-black tracking-tight flex items-center gap-1.5">
                        <Sparkles size={16} className="text-[#00AFC2]" />
                        <span>הצטרפות לקהילת חבל זוג</span>
                      </h3>
                      <p className="text-slate-500 text-xs">נשמח לראות אותך איתנו במים!</p>
                    </div>
                    <button type="button" onClick={resetToLogin} className="w-9 h-9 border border-white/90 hover:border-[#00AFC2] rounded-xl flex items-center justify-center text-slate-500 hover:bg-white/80 hover:text-slate-900 transition-all shrink-0 shadow-sm">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="relative group/avatar cursor-pointer">
                      <div className="w-18 h-18 sm:w-20 sm:h-20 overflow-hidden border-2 border-white/90 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center group-hover/avatar:border-[#00AFC2] transition-all duration-300 shadow-sm">
                        <div className="w-full h-full flex items-center justify-center">
                          {isProcessingImage ? (
                            <Loader2 className="animate-spin text-[#00AFC2]" size={24} />
                          ) : joinAvatar ? (
                            <img src={joinAvatar} className="w-full h-full object-cover" alt="" loading="lazy" />
                          ) : (
                            <User size={32} className="text-slate-400 group-hover/avatar:text-[#00AFC2] transition-colors" />
                          )}
                        </div>
                      </div>
                      <label className="absolute -bottom-1 -left-1 w-7 h-7 bg-gradient-to-r from-[#00AFC2] to-cyan-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-all border border-white">
                        <Camera size={13} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isProcessingImage} />
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">תמונת פרופיל (מומלץ)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" required value={joinFirstName} onChange={e => setJoinFirstName(e.target.value)} placeholder="שם פרטי" className="w-full h-11 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-900 font-medium text-sm outline-none px-3.5 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]" />
                    <input type="text" required value={joinLastName} onChange={e => setJoinLastName(e.target.value)} placeholder="שם משפחה" className="w-full h-11 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-900 font-medium text-sm outline-none px-3.5 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]" />
                  </div>
                  
                  <input type="email" required value={joinEmail} onChange={e => setJoinEmail(e.target.value)} placeholder="דוא״ל" className="w-full h-11 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-900 font-medium text-sm outline-none px-3.5 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]" />
                  <input type="tel" required value={joinMobile} onChange={handleMobileChange} placeholder="טלפון נייד (למשל 0501234567)" className="w-full h-11 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-900 font-medium text-sm outline-none px-3.5 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)] focus:text-left direction-ltr text-left" dir="ltr" />
                  
                  <div className="relative group">
                    <input 
                      ref={joinAddressRef}
                      type="text" 
                      required 
                      value={joinAddress} 
                      onChange={e => setJoinAddress(e.target.value)} 
                      placeholder="כתובת מגורים (עיר ורחוב)" 
                      className="w-full h-11 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-900 font-medium text-sm outline-none px-3.5 placeholder-slate-400 text-right focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]" 
                    />
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00AFC2] transition-colors" />
                  </div>

                  {/* Group Choice for New Applicant */}
                  <div className="relative w-full">
                    <button 
                      type="button"
                      onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                      className="w-full h-11 bg-white/60 hover:bg-white/80 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-800 font-medium text-sm outline-none text-right flex items-center justify-between px-3.5 hover:border-[#00AFC2]/60 focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]"
                    >
                      <span className="flex-1 text-right flex items-center gap-1.5">
                        <span className="text-slate-400 text-xs">קבוצה מבוקשת:</span>
                        <span className="text-[#008ba3] font-bold">{selectedGroup}</span>
                      </span>
                      <ChevronDown size={16} className={`text-[#00AFC2] transition-transform duration-300 ${isGroupMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isGroupMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsGroupMenuOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-white/95 backdrop-blur-2xl border border-white/90 rounded-2xl shadow-2xl z-[70] overflow-y-auto max-h-48 py-1.5 custom-scrollbar"
                          >
                            {groups.map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  setSelectedGroup(g);
                                  setIsGroupMenuOpen(false);
                                }}
                                className={`w-full px-3.5 py-2.5 text-right font-medium text-xs sm:text-sm transition-all flex items-center justify-between hover:bg-cyan-50/80 ${
                                  selectedGroup === g ? 'text-[#008ba3] bg-cyan-50 font-bold' : 'text-slate-700'
                                }`}
                              >
                                <span>{g}</span>
                                {selectedGroup === g && <CheckCircle2 size={15} className="text-[#00AFC2]" />}
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
                      className="w-full h-11 bg-white/60 hover:bg-white/80 backdrop-blur-xl border border-white/90 rounded-2xl text-slate-800 font-medium text-sm outline-none text-right flex items-center justify-between px-3.5 hover:border-[#00AFC2]/60 focus:border-[#00AFC2] focus:ring-4 focus:ring-[#00AFC2]/15 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,40,70,0.03),0_2px_8px_rgba(0,175,194,0.05)]"
                    >
                      <span className={`flex-1 text-right ${joinGender ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{joinGender || 'מגדר (בחירה)'}</span>
                      <ChevronDown size={16} className={`text-[#00AFC2] transition-transform duration-300 ${isGenderMenuOpen ? 'rotate-180' : ''}`} />
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
                            className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-white/95 backdrop-blur-2xl border border-white/90 rounded-2xl shadow-2xl z-[70] overflow-hidden py-1"
                          >
                            {(['זכר', 'נקבה', 'לא בינארי', 'מעדיפ/ה לא לציין'] as const).map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  setJoinGender(g);
                                  setIsGenderMenuOpen(false);
                                }}
                                className={`w-full px-3.5 py-2.5 text-right font-medium text-xs sm:text-sm transition-all flex items-center justify-between hover:bg-cyan-50/80 ${
                                  joinGender === g ? 'text-[#008ba3] bg-cyan-50 font-bold' : 'text-slate-700'
                                }`}
                              >
                                <span>{g}</span>
                                {joinGender === g && <CheckCircle2 size={15} className="text-[#00AFC2]" />}
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
                        className="p-3 bg-rose-50/90 border-r-4 border-rose-500 text-rose-700 text-xs sm:text-sm font-bold flex items-start gap-2.5 rounded-xl shadow-sm backdrop-blur-md"
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                        <span className="leading-tight">{error || mobileError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isLoading || isProcessingImage} 
                      className="w-full h-12 bg-gradient-to-r from-teal-500 via-[#00AFC2] to-sky-600 hover:brightness-105 text-white shadow-[0_8px_22px_rgba(20,184,166,0.38),inset_0_1.5px_2px_rgba(255,255,255,0.6)] active:shadow-[0_2px_8px_rgba(20,184,166,0.4)] border-b-[3px] border-[#008ba3] active:border-b-0 active:translate-y-[2px] rounded-2xl flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-black text-base tracking-wide"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin text-white mx-auto" size={20} />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>שלח בקשת הצטרפות למועדון</span>
                          <ArrowRight size={18} className="rotate-180" />
                        </div>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.form>
          )}
          {/* Subtle elegant divider */}
          <div className="my-1 border-t border-white/10 w-full" />
          
          {/* Integrated Partner Logos - Highly compact to eliminate dead space */}
          <div className="flex items-center justify-center gap-3.5 sm:gap-5 pb-0">
            <a 
              href="https://www.atalef.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group transition-all duration-500 hover:scale-105 opacity-95 hover:opacity-100 flex items-center"
              title="עמותת העטלף"
            >
              {siteAssets?.atalefLogo && !atalefError && (
                <img 
                  src={siteAssets.atalefLogo} 
                  onError={() => setAtalefError(true)}
                  alt="עמותת העטלף" 
                  className="h-12 sm:h-16 w-auto transition-all duration-500" 
                  referrerPolicy="no-referrer"
                />
              )}
            </a>
            <div className="w-px h-5 sm:h-8 bg-white/20" />
            <a 
              href="https://www.reefseacenter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group transition-all duration-500 hover:scale-105 opacity-95 hover:opacity-100 flex items-center"
              title="מרכז ימי ריף"
            >
              {siteAssets?.reefLogo && !reefError && (
                <img 
                  src={siteAssets.reefLogo} 
                  onError={() => setReefError(true)}
                  alt="מועדון ריף" 
                  className="h-8 w-8 sm:h-11 sm:w-11 rounded-full object-cover bg-white transition-all duration-500 shadow-sm ring-1 ring-white/60" 
                  referrerPolicy="no-referrer"
                />
              )}
            </a>
          </div>
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
      {/* Biometric Guide Modal */}
      <AnimatePresence>
        {showBioGuideModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#0f1d24] border border-[#00AFC2]/30 p-8 max-w-sm w-full rounded-3xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,175,194,0.25)] text-center"
            >
              <div className="w-16 h-16 bg-[#00AFC2]/15 text-[#00AFC2] flex items-center justify-center mx-auto mb-5 rounded-2xl border border-[#00AFC2]/30 shadow-inner">
                <Fingerprint size={34} className="animate-pulse" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">הפעלת כניסה מהירה</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                כדי להשתמש בטביעת אצבע או Face ID:
              </p>

              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-right mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00AFC2]/20 text-[#00AFC2] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                  <p className="text-xs text-white/90 font-medium">התחבר תחילה עם מספר הטלפון / אימייל והסיסמה שלך.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00AFC2]/20 text-[#00AFC2] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                  <p className="text-xs text-white/90 font-medium">היכנס לדף הפרופיל שלך ולחץ על <span className="text-[#00AFC2] font-bold">"הפעל כניסה בטביעת אצבע"</span>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00AFC2]/20 text-[#00AFC2] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                  <p className="text-xs text-white/90 font-medium">החל מהפעם הבאה, הכניסה תתבצע בנגיעה אחת בלבד!</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBioGuideModal(false)}
                className="w-full h-12 bg-gradient-to-r from-[#00AFC2] to-[#00709b] hover:from-[#00c3d9] hover:to-[#0089bd] text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center shadow-lg active:scale-[0.98]"
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