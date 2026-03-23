
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  User, 
  Camera, 
  Save, 
  Sparkles, 
  Loader2, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter,
  Music2,
  Globe,
  Check, 
  ExternalLink, 
  X,
  AlertCircle,
  Phone,
  Cake,
  ChevronDown,
  Key,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';
import { generateBio } from '../services/geminiService';
import { processImage } from '../utils/imageProcessor';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';
import { hashPassword } from '../utils/crypto';
import { loadGoogleMaps } from '../utils/googlePlaces';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { PerformanceRadar } from '../components/PerformanceRadar';

const ensureAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  let trimmed = url.trim();
  if (trimmed.startsWith('http')) return trimmed;
  return `https://${trimmed}`;
};

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

const SocialInput = React.memo(({ 
  label, name, value, onChange, icon: Icon, placeholder, brandColor,
}: any) => {
  const hasValue = !!(value && value.trim());
  return (
    <div className="group relative">
      <label className="block text-[10px] font-black text-slate-400/80 mb-2.5 uppercase tracking-[0.25em] pr-4 transition-colors group-focus-within:text-slate-900">{label}</label>
      <div className="relative group/input">
        <div className="absolute inset-0 bg-white/5 rounded-[1.5rem] blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" style={{ backgroundColor: `${brandColor}10` }} />
        <Icon size={20} className="absolute right-6 top-1/2 -translate-y-1/2 z-10 transition-all duration-500 group-focus-within:scale-110" style={{ color: hasValue ? brandColor : '#cbd5e1' }} />
        <input
          type="text"
          size={50}
          placeholder={placeholder}
          className="pr-16 pl-14 py-5 bg-white/70 border border-white/60 shadow-sm rounded-[1.5rem] font-bold outline-none focus:bg-white focus:border-white transition-all duration-500 text-[#0f172a] placeholder:text-slate-400/50 relative z-0 text-lg overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {hasValue && (
          <a 
            href={ensureAbsoluteUrl(value)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="absolute left-5 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-white hover:bg-slate-900 p-2.5 rounded-2xl shadow-sm transition-all duration-500 hover:scale-110 active:scale-90"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
});

// Sub-components for better performance and readability
const SectionHeader = React.memo(({ icon: Icon, title, colorClass, bgColorClass }: any) => (
  <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl ${bgColorClass} flex items-center justify-center ${colorClass} shadow-sm`}>
      <Icon size={18} className="md:w-5 md:h-5" />
    </div>
    <h4 className="text-xs md:text-sm font-black text-[#0f172a] uppercase tracking-[0.2em] md:tracking-[0.3em]">{title}</h4>
  </div>
));

const ProfileHeader = React.memo(({ headerImage, isDirty }: { headerImage: string, isDirty: boolean }) => (
  <div className="surfboard-hero-container mb-4 md:mb-2 space-y-2 header-wallpaper py-8 md:py-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
    <div className="header-content-wrapper relative z-20 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
        <User size={32} className="md:w-10 md:h-10" />
      </div>
      <h1 className="main-page-title">
        <span className="surfer-title text-3xl md:text-5xl">הפרופיל שלי</span>
      </h1>
      <p className="header-subtitle max-w-2xl mx-auto text-sm md:text-base opacity-80">
        עדכן את הפרטים האישיים והנוכחות הדיגיטלית שלך בקהילה 👤
      </p>
      
      {isDirty && (
        <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl animate-bounce mt-4 mx-auto w-max">
          <AlertCircle size={16} />
          <span className="text-xs font-black">שינויים לא שמורים</span>
        </div>
      )}
    </div>
  </div>
));

const ProfileAvatar = React.memo(({ 
  avatar, 
  firstName, 
  lastName, 
  role, 
  joinedAt, 
  isProcessingImage, 
  onAvatarSelect 
}: any) => (
  <div className="flex flex-col items-center gap-8 md:gap-10 mb-12 md:mb-20 text-center pt-12 md:pt-16 relative z-10">
    <div className="relative group">
      <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--surfer-cyan)] to-[var(--surfer-pink)] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
      <div className="w-40 h-40 md:w-48 md:h-48 overflow-hidden group-hover:scale-[1.05] transition-all duration-700 flex items-center justify-center relative z-10 bg-white p-1.5 md:p-2 rounded-full shadow-2xl">
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-50 relative">
          {isProcessingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
              <Loader2 className="animate-spin text-[var(--surfer-teal)]" size={32} />
            </div>
          )}
          {avatar ? (
            <img src={avatar} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <User size={60} className="md:w-20 md:h-20 text-slate-300" />
            </div>
          )}
        </div>
      </div>
      <label className="absolute bottom-2 left-2 md:bottom-4 md:left-4 p-3 md:p-4 bg-white text-slate-900 rounded-xl md:rounded-2xl cursor-pointer hover:bg-slate-900 hover:text-white transition-all border border-slate-100 shadow-xl z-20 hover:scale-110 active:scale-95 group/cam">
        <Camera size={18} className="md:w-5 md:h-5 transition-transform group-hover/cam:rotate-12" />
        <input type="file" className="hidden" accept="image/*" onChange={onAvatarSelect} disabled={isProcessingImage} />
      </label>
    </div>
    
    <div className="space-y-2 md:space-y-3">
       <h3 className="text-3xl md:text-5xl font-black text-[#0f172a] tracking-tight">{firstName} {lastName}</h3>
       <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
         <span className="px-3 py-1 md:px-4 md:py-1.5 bg-sky-100 text-sky-700 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest border border-sky-200 shadow-sm">
           {role === 'Admin' ? 'רכז' : 'חבר נבחרת'}
         </span>
         <span className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full" />
         <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-widest">חבר מאז {new Date(joinedAt).toLocaleDateString('he-IL')}</p>
       </div>
    </div>
  </div>
));

const ProfileCompletion = React.memo(({ percentage, onShowDetails }: { percentage: number, onShowDetails: () => void }) => (
  <div className="w-full max-w-xl bg-white/80 border border-white/60 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden group/completion mx-auto mb-12 md:mb-20">
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
    <div className="relative z-10">
      <div className="flex justify-between items-end mb-6 md:mb-8 px-1 md:px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-sm md:text-[18px] font-black text-[#0f172a] uppercase tracking-widest">רמת מוכנות הפרופיל</span>
            <button 
              type="button"
              onClick={onShowDetails}
              className="text-slate-400 hover:text-sky-500 transition-all hover:scale-110"
            >
              <HelpCircle size={18} className="md:w-6 md:h-6" />
            </button>
          </div>
          <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">השלם את הפרטים לקבלת חשיפה מקסימלית</p>
        </div>
        <div className="text-right">
          <span className="text-3xl md:text-[42px] font-black text-sky-600 leading-none tabular-nums">{percentage}%</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-3 md:h-4 w-full bg-slate-100/50 rounded-full overflow-hidden relative border border-white/50" dir="ltr">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
          </motion.div>
        </div>
      </div>
    </div>
  </div>
));

const ProfilePage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser, updateUser } = useAuth();
  const { updateMember, performanceScores } = useData();
  
  const userScores = useMemo(() => {
    if (!currentUser) return [];
    const scores = performanceScores.filter(s => s.memberId === currentUser.id);
    console.log('currentUser:', currentUser);
    console.log('performanceScores:', performanceScores);
    console.log('userScores:', scores);
    return scores;
  }, [performanceScores, currentUser]);

  const [formData, setFormData] = useState<Member | null>(currentUser ? { ...currentUser } : null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPlaceSelected, setIsPlaceSelected] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  
  // Hidden fields refs
  const cityRef = useRef<HTMLInputElement>(null);
  const streetRef = useRef<HTMLInputElement>(null);
  const houseNumRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);

  // Load Google Maps only when needed
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  
  const initAutocomplete = useCallback(() => {
    if (!addressInputRef.current || !window.google?.maps?.places) return;

    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'il' },
      fields: ['address_components', 'formatted_address', 'geometry']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;

      const addressComponents = place.address_components || [];
      const city = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name || '';
      const street = addressComponents.find((c: any) => c.types.includes('route'))?.long_name || '';
      const houseNum = addressComponents.find((c: any) => c.types.includes('street_number'))?.long_name || '';
      const country = addressComponents.find((c: any) => c.types.includes('country'))?.long_name || '';
      const lat = place.geometry?.location?.lat() || 0;
      const lng = place.geometry?.location?.lng() || 0;

      setFormData(prev => prev ? ({
        ...prev,
        street_name: street,
        house_number: houseNum,
        city: city,
        country: country,
        lat: lat,
        lng: lng,
        full_address: place.formatted_address
      }) : null);
      
      setIsPlaceSelected(true);
      setIsDirty(true);
    });
  }, []);

  const handleAddressFocus = () => {
    if (!isMapsLoaded) {
      loadGoogleMaps()
        .then(() => {
          setIsMapsLoaded(true);
          initAutocomplete();
        })
        .catch(err => console.warn("Google Maps loading failed:", err.message));
    }
  };

  useEffect(() => {
    if (currentUser && !formData) {
      setFormData({...currentUser});
      if (currentUser.full_address && addressInputRef.current) {
        addressInputRef.current.value = currentUser.full_address;
        setIsPlaceSelected(true);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setToast({ msg: 'שגיאת אימות בגוגל מפות. בדוק את מפתח ה-API.', type: 'error' });
    };
  }, []);

  const completionDetails = useMemo(() => {
    if (!formData) return { percentage: 0, missing: [] };
    const fieldMap = [
      { label: 'שם פרטי', value: formData.firstName },
      { label: 'שם משפחה', value: formData.lastName },
      { label: 'טלפון נייד', value: formData.mobile },
      { label: 'תמונת פרופיל', value: formData.avatar },
      { label: 'הסיפור שלי (ביוגרפיה)', value: formData.bio },
      { label: 'תאריך יום הולדת', value: formData.birthday },
      { label: 'מגדר', value: formData.gender },
      { label: 'כתובת מגורים', value: formData.full_address },
      { label: 'שם איש קשר לחירום', value: formData.emergencyContactName },
      { label: 'טלפון לחירום', value: formData.emergencyContactPhone }
    ];
    
    const missing = fieldMap.filter(f => !f.value).map(f => f.label);
    const percentage = Math.round(((fieldMap.length - missing.length) / fieldMap.length) * 100);
    
    return { percentage, missing };
  }, [formData?.firstName, formData?.lastName, formData?.mobile, formData?.avatar, formData?.bio, formData?.birthday, formData?.gender, formData?.full_address, formData?.emergencyContactName, formData?.emergencyContactPhone]);

  const completionPercentage = completionDetails.percentage;

  if (!formData) return null;

  const handleFieldChange = useCallback((field: keyof Member, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    setIsDirty(true);
  }, []);

  const handleMobileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange('mobile', formatMobileNumber(e.target.value));
  }, [handleFieldChange]);

  const handleInstagramChange = useCallback((v: string) => handleFieldChange('instagramUrl', v), [handleFieldChange]);
  const handleFacebookChange = useCallback((v: string) => handleFieldChange('facebookUrl', v), [handleFieldChange]);
  const handleTikTokChange = useCallback((v: string) => handleFieldChange('tiktokUrl', v), [handleFieldChange]);
  const handleLinkedInChange = useCallback((v: string) => handleFieldChange('linkedinUrl', v), [handleFieldChange]);
  const handleTwitterChange = useCallback((v: string) => handleFieldChange('twitterUrl', v), [handleFieldChange]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const { dataUrl } = await processImage(file, 600, 0.8);
        handleFieldChange('avatar', dataUrl);
      } catch (err: any) {
        setToast({ msg: err.message || 'עיבוד התמונה נכשל', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    if (formData.mobile && !validateMobileNumber(formData.mobile)) {
      setToast({ msg: 'מספר טלפון נייד לא תקין', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (!isPlaceSelected) {
      setToast({ msg: 'יש לבחור כתובת מתוך רשימת ההצעות של גוגל בלבד', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      addressInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      await updateMember(formData);
      updateUser(formData);
      setToast({ msg: 'הפרופיל עודכן בהצלחה!', type: 'success' });
      setIsDirty(false);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Save profile error:", err);
      setToast({ msg: 'שגיאה בעדכון הפרופיל', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!formData) return;
    setIsGeneratingBio(true);
    try {
      const newBio = await generateBio(`${formData.firstName} ${formData.lastName}`, formData.role, formData.bio);
      handleFieldChange('bio', newBio);
    } catch (err) {
      console.error(err);
    } finally { setIsGeneratingBio(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    if (newPassword.length < 6) {
      setToast({ msg: 'הסיסמה חייבת להכיל לפחות 6 תווים', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setToast({ msg: 'הסיסמאות אינן תואמות', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsChangingPassword(true);
    try {
      const hashed = await hashPassword(newPassword);
      await updateMember({ ...formData, password: hashed });
      setToast({ msg: 'הסיסמה שונתה בהצלחה', type: 'success' });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ msg: 'שגיאה בשינוי הסיסמה', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Background optimization: use fewer and less intense blurs
  const bgElements = useMemo(() => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-[-10%] right-[-10%] w-[25rem] h-[25rem] bg-sky-200/5 blur-[50px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[25rem] h-[25rem] bg-rose-200/5 blur-[50px] rounded-full" />
    </div>
  ), []);

  return (
    <div className="min-h-screen w-full luxury-bg relative overflow-hidden">
      {bgElements}

      <div className="max-w-6xl mx-auto pt-2 pb-20 text-right animate-in fade-in relative z-10 px-4 md:px-0" dir="rtl">

      {/* Body-line Standard Header Stack */}
      <ProfileHeader headerImage={headerImage} isDirty={isDirty} />

      <div className="rounded-[3.5rem] overflow-hidden relative shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]">
        <form onSubmit={handleSubmit} className="px-6 md:px-16 pb-20 md:pb-24 tangible-surfer-card !bg-white/60 border-none relative z-20 overflow-hidden">
          {/* Decorative background elements - reduced blur and opacity */}
          <div className="absolute top-0 right-0 w-[25rem] md:w-[30rem] h-[25rem] md:h-[30rem] bg-sky-200/5 blur-[50px] md:blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[25rem] md:w-[30rem] h-[25rem] md:h-[30rem] bg-rose-200/5 blur-[50px] md:blur-[60px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          <ProfileAvatar 
            avatar={formData.avatar}
            firstName={formData.firstName}
            lastName={formData.lastName}
            role={formData.role}
            joinedAt={formData.joinedAt}
            isProcessingImage={isProcessingImage}
            onAvatarSelect={handleAvatarSelect}
          />

          <ProfileCompletion 
            percentage={completionPercentage}
            onShowDetails={() => setShowCompletionModal(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 relative z-10">
            <div className="lg:col-span-7 space-y-12 md:space-y-16">
              <section className="space-y-6 md:space-y-8">
                <SectionHeader icon={User} title="פרטים אישיים" colorClass="text-sky-600" bgColorClass="bg-sky-100" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">שם פרטי</label>
                    <input type="text" value={formData.firstName || ''} onChange={e => handleFieldChange('firstName', e.target.value)} className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a]" />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">שם משפחה</label>
                    <input type="text" value={formData.lastName || ''} onChange={e => handleFieldChange('lastName', e.target.value)} className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a]" />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">טלפון נייד</label>
                    <div className="relative">
                      <Phone size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-400 transition-transform group-focus-within:scale-110" />
                      <input 
                        type="tel" 
                        value={formData.mobile} 
                        onChange={handleMobileChange} 
                        className="w-full pr-14 pl-6 py-4 md:py-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">תאריך יום הולדת</label>
                    <div className="relative">
                      <Cake size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-400 transition-transform group-focus-within:scale-110" />
                      <input 
                        type="date" 
                        value={formData.birthday || ''} 
                        onChange={e => handleFieldChange('birthday', e.target.value)} 
                        className="w-full pr-14 pl-6 py-4 md:py-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all cursor-pointer text-[#0f172a]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">מגדר</label>
                    <div className="relative">
                      <User size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-sky-400 transition-transform group-focus-within:scale-110" />
                      <button 
                        type="button"
                        onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                        className="w-full pr-14 pl-12 py-4 md:py-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold text-sm outline-none focus:bg-white focus:border-sky-200 transition-all flex items-center justify-between group/btn text-[#0f172a]"
                      >
                        <span>{formData.gender || 'בחר מגדר'}</span>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isGenderDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setIsGenderDropdownOpen(false)} />
                            <motion.div 
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 mt-3 bg-white/95 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[70] overflow-hidden p-2 rounded-[1.5rem]"
                            >
                              {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => {
                                    handleFieldChange('gender', g);
                                    setIsGenderDropdownOpen(false);
                                  }}
                                  className={`w-full px-6 py-4 text-right font-bold rounded-xl transition-all hover:bg-slate-50 ${
                                    formData.gender === g ? 'text-sky-600 bg-sky-50' : 'text-slate-600'
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
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">כתובת מגורים (חובה)</label>
                    <div className="relative">
                      <Globe size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-400 transition-transform group-focus-within:scale-110" />
                      <input 
                        type="text" 
                        id="address-input"
                        ref={addressInputRef}
                        defaultValue={currentUser?.full_address || ''} 
                        onFocus={handleAddressFocus}
                        onChange={(e) => {
                          setIsPlaceSelected(false);
                          setIsDirty(true);
                        }} 
                        placeholder="התחל להקליד: עיר, רחוב ומספר בית..."
                        className="w-full pr-14 pl-6 py-4 md:py-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a]" 
                        required
                        autoComplete="off"
                      />
                    </div>
                    <input type="hidden" id="city" ref={cityRef} />
                    <input type="hidden" id="street" ref={streetRef} />
                    <input type="hidden" id="house_num" ref={houseNumRef} />
                    <input type="hidden" id="lat" ref={latRef} />
                    <input type="hidden" id="lng" ref={lngRef} />
                    <p className="text-[9px] md:text-[10px] text-slate-400 pr-3 font-bold uppercase tracking-wider">חובה לבחור את הכתובת מתוך הרשימה שנפתחת</p>
                  </div>
                </div>
              </section>

              <section className="space-y-6 md:space-y-8">
                <SectionHeader icon={Sparkles} title="נוכחות דיגיטלית" colorClass="text-emerald-600" bgColorClass="bg-emerald-100" />
                  <div className="grid grid-cols-1 gap-8 md:gap-10">
                    <SocialInput label="Instagram" value={formData.instagramUrl} onChange={handleInstagramChange} icon={Instagram} brandColor="#E4405F" placeholder="קישור לפרופיל אינסטגרם" />
                    <SocialInput label="Facebook" value={formData.facebookUrl} onChange={handleFacebookChange} icon={Facebook} brandColor="#1877F2" placeholder="קישור לפרופיל פייסבוק" />
                    <SocialInput label="TikTok" value={formData.tiktokUrl} onChange={handleTikTokChange} icon={Music2} brandColor="#000000" placeholder="קישור לפרופיל טיקטוק" />
                    <SocialInput label="LinkedIn" value={formData.linkedinUrl} onChange={handleLinkedInChange} icon={Linkedin} brandColor="#0A66C2" placeholder="קישור לפרופיל לינקדאין" />
                    <SocialInput label="Twitter / X" value={formData.twitterUrl} onChange={handleTwitterChange} icon={Twitter} brandColor="#000000" placeholder="קישור לפרופיל טוויטר" />
                  </div>
                </section>

                <section className="space-y-6 md:space-y-8">
                  <SectionHeader icon={HeartPulse} title="מידע רפואי וחירום" colorClass="text-rose-600" bgColorClass="bg-rose-100" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-rose-600 transition-colors">איש קשר לחירום</label>
                    <input 
                      type="text" 
                      value={formData.emergencyContactName || ''} 
                      onChange={e => handleFieldChange('emergencyContactName', e.target.value)} 
                      placeholder="שם מלא של איש הקשר"
                      className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-rose-200 transition-all text-[#0f172a]" 
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-rose-600 transition-colors">טלפון חירום</label>
                    <input 
                      type="tel" 
                      value={formData.emergencyContactPhone || ''} 
                      onChange={e => handleFieldChange('emergencyContactPhone', formatMobileNumber(e.target.value))} 
                      placeholder="מספר טלפון לחירום"
                      className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-rose-200 transition-all text-[#0f172a]" 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-rose-600 transition-colors">מידע רפואי / רגישויות</label>
                    <textarea 
                      value={formData.medicalInfo || ''} 
                      onChange={e => handleFieldChange('medicalInfo', e.target.value)} 
                      placeholder="פרט כאן רגישויות, פציעות עבר או מידע רפואי שחשוב שנדע..."
                      className="w-full p-5 md:p-6 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold h-32 resize-none outline-none focus:bg-white focus:border-rose-200 transition-all text-[#0f172a] leading-relaxed" 
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-5">
               <div className="lg:sticky lg:top-24 space-y-6">
                  <div className="flex justify-between items-center px-2 md:px-4">
                    <SectionHeader icon={Music2} title="הסיפור שלי" colorClass="text-violet-600" bgColorClass="bg-violet-100" />
                    <button 
                      type="button" 
                      onClick={handleGenerateBio} 
                      disabled={isGeneratingBio} 
                      className="text-[9px] md:text-[11px] font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center gap-1.5 md:gap-2 hover:from-violet-500 hover:to-indigo-500 px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl transition-all shadow-[0_10px_20px_rgba(124,58,237,0.2)] hover:scale-105 active:scale-95 disabled:opacity-50 group mb-4"
                    >
                      {isGeneratingBio ? <Loader2 size={12} className="animate-spin md:w-3.5 md:h-3.5" /> : <Sparkles size={12} className="md:w-3.5 md:h-3.5 transition-transform group-hover:rotate-12" />} 
                      <span>שדרג ביוגרפיה עם AI</span>
                    </button>
                  </div>
                  <div className="relative group/bio">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 rounded-[1.5rem] md:rounded-[2rem] blur-lg opacity-0 group-focus-within/bio:opacity-100 transition-opacity duration-500" />
                    <textarea 
                      value={formData.bio} 
                      onChange={e => handleFieldChange('bio', e.target.value)} 
                      className="w-full p-6 md:p-10 bg-white/70 border border-white/80 shadow-sm rounded-[1.5rem] md:rounded-[2rem] font-bold h-[20rem] md:h-[40rem] resize-none outline-none focus:bg-white focus:border-violet-200 transition-all text-base md:text-lg leading-relaxed text-[#0f172a] relative z-10" 
                      placeholder="ספר קצת על עצמך, על הגלישה, על החיים..." 
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-16 md:mt-24 flex flex-col items-center gap-4 md:gap-6 w-full max-w-md mx-auto relative z-10">
             <GlassButton 
               type="submit" 
               variant="primary"
               isLoading={isSaving}
               disabled={!isDirty} 
               className="w-full !py-5 md:!py-6 !text-lg md:!text-xl !rounded-2xl md:!rounded-3xl"
             >
                 {!isSaving && <Save size={20} className="md:w-6 md:h-6 transition-transform group-hover:scale-110" />}
                 <span>שמור שינויים</span>
             </GlassButton>
             
             <GlassButton 
               type="button" 
               variant="secondary"
               onClick={() => setShowPasswordModal(true)}
               className="w-full !py-5 md:!py-6 !text-lg md:!text-xl !rounded-2xl md:!rounded-3xl"
             >
               <Key size={20} className="md:w-6 md:h-6 text-sky-500 transition-transform group-hover:rotate-12" />
               <span>החלפת סיסמה</span>
             </GlassButton>
          </div>
        </form>
      </div>
      </div>

      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 rounded-2xl shadow-2xl text-white font-black animate-in slide-in-from-bottom-5 flex items-center gap-4 z-[200] ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.type === 'success' ? <Check size={24} /> : <AlertCircle size={24} />}
          <span className="text-lg">{toast.msg}</span>
        </div>
      )}

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-[40px] rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/60"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/40 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-100/40 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
              
              {/* Micro-grain texture overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              <div className="relative z-10 p-12">
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-[#0f172a] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Key size={24} />
                      </div>
                      החלפת סיסמה
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pr-1">אבטח את החשבון שלך בסיסמה חזקה</p>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all hover:rotate-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-8">
                  <div className="space-y-3 group">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-4 group-focus-within:text-indigo-600 transition-colors">סיסמה חדשה</label>
                    <div className="relative">
                      <ShieldCheck size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400 transition-transform group-focus-within:scale-110" />
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full pr-14 pl-6 py-5 bg-white/50 border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-2xl font-black outline-none focus:bg-white focus:border-indigo-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a] placeholder:text-slate-300"
                        placeholder="הזן סיסמה חדשה"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 group">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pr-4 group-focus-within:text-indigo-600 transition-colors">אימות סיסמה</label>
                    <div className="relative">
                      <Check size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-400 transition-transform group-focus-within:scale-110" />
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full pr-14 pl-6 py-5 bg-white/50 border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-2xl font-black outline-none focus:bg-white focus:border-indigo-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a] placeholder:text-slate-300"
                        placeholder="הזן שוב את הסיסמה"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-slate-900 text-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] font-black text-xl transition-all hover:bg-slate-800 hover:translate-y-[-4px] active:scale-95 disabled:opacity-50 group"
                  >
                    {isChangingPassword ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="transition-transform group-hover:scale-110" />}
                    <span>עדכן סיסמה</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Danger Zone */}
      <section className="mt-40 pt-20 border-t border-slate-200/40 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-2 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] shadow-sm">
          אזור השעיה
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-white/40 backdrop-blur-xl p-14 rounded-[4rem] border border-white/80 shadow-[0_30px_70px_-20px_rgba(225,29,72,0.08)] relative overflow-hidden group transition-all duration-700 hover:shadow-[0_40px_90px_-20px_rgba(225,29,72,0.12)] hover:bg-white/50">
          {/* Micro-grain texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
          
          <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-rose-200/15 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-rose-300/20 transition-colors duration-1000" />
          
          <div className="space-y-5 text-center md:text-right relative z-10">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-3xl font-black text-rose-600 uppercase tracking-tight">השעיית חשבון</h4>
            </div>
            <p className="text-slate-500 font-bold text-lg max-w-lg leading-relaxed opacity-80">השעיית החשבון תמנע ממך גישה למערכת עד שמנהל יחזיר אותך לפעילות. הפעולה הפיכה ומיועדת למקרים של חופשה ארוכה או הפסקה זמנית.</p>
          </div>
          
          <GlassButton 
            type="button"
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="!px-14 !py-7 !text-xl !rounded-3xl relative z-10 group/del shadow-[0_20px_40px_-10px_rgba(225,29,72,0.2)]"
          >
            <Trash2 size={24} className="transition-transform group-hover/del:rotate-12" />
            <span>השעה חשבון</span>
          </GlassButton>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-[40px] border border-white/80 rounded-[4rem] p-14 shadow-[0_50px_120px_-20px_rgba(0,0,0,0.2)] text-center overflow-hidden"
              dir="rtl"
            >
              {/* Micro-grain texture overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
              
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-rose-100/50 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-100/50 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-28 h-28 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                  <AlertTriangle size={56} className="text-rose-500" />
                </div>
                <h3 className="text-4xl font-black text-[#0f172a] mb-6 leading-tight tracking-tight">בטוח שברצונך להשעות את החשבון?</h3>
                <p className="text-slate-500 font-bold mb-12 leading-relaxed text-xl opacity-80">
                  השעיית החשבון תמנע ממך גישה למערכת עד שמנהל יחזיר אותך לפעילות. הפעולה הפיכה ומיועדת למקרים של הפסקה זמנית.
                </p>
                
                <div className="flex flex-col gap-5">
                  <GlassButton 
                    variant="danger"
                    onClick={async () => {
                      if (!formData) return;
                      try {
                        await updateMember({ ...formData, isActive: false, deactivatedAt: new Date().toISOString() });
                        setToast({ msg: 'החשבון הושעה בהצלחה', type: 'success' });
                        setTimeout(() => {
                          window.location.href = '/login';
                        }, 2000);
                      } catch (err) {
                        console.error(err);
                        setToast({ msg: 'שגיאה בהשעיית החשבון', type: 'error' });
                        setTimeout(() => setToast(null), 3000);
                      }
                      setShowDeleteModal(false);
                    }}
                    className="w-full !py-7 !text-xl !rounded-3xl"
                  >
                    כן, השעה את החשבון
                  </GlassButton>
                  
                  <GlassButton 
                    variant="secondary"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full !py-7 !text-xl !rounded-3xl"
                  >
                    ביטול
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showCompletionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompletionModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-md bg-white/95 backdrop-blur-[40px] rounded-[3rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/60"
              dir="rtl"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-100/40 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              {/* Micro-grain texture overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-[#0f172a] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                        <HelpCircle size={24} />
                      </div>
                      מה חסר להשלמה?
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pr-1">השלם את הפרופיל שלך ל-100%</p>
                  </div>
                  <button 
                    onClick={() => setShowCompletionModal(false)}
                    className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all hover:rotate-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  <p className="text-slate-500 font-bold leading-relaxed">
                    כדי להגיע ל-100% השלמת פרופיל וליהנות מחשיפה מקסימלית בקהילה, עליך למלא את השדות הבאים:
                  </p>
                  
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 py-2">
                    {completionDetails.missing.length > 0 ? (
                      completionDetails.missing.map((label, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-slate-50 transition-all hover:scale-[1.02] hover:shadow-[0_12px_25px_rgba(0,0,0,0.06)] group"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)] group-hover:scale-125 transition-transform" />
                          <span className="font-black text-[#0f172a] text-lg">{label}</span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center gap-6 py-10">
                        <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center shadow-inner animate-bounce">
                          <Check className="text-emerald-500" size={48} />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="font-black text-emerald-600 text-3xl">הפרופיל שלך מושלם!</p>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">אתה מוכן לגלוש בסטייל</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowCompletionModal(false)}
                    className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:translate-y-[-4px] active:scale-95"
                  >
                    הבנתי, תודה
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
