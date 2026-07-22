
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
  Award,
  Search,
  Upload,
  CheckCircle2,
  XCircle,
  FileDigit,
  CheckCircle,
  CheckCircle2 as VerifiedIcon,
  Video,
  Waves,
  Wind,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';
import { generateBio, verifyLicense } from '../services/geminiService';
import { processImage, compressBase64Image } from '../utils/imageProcessor';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';
import { hashPassword } from '../utils/crypto';
import { loadGoogleMaps } from '../utils/googlePlaces';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';
import { useRandomHeader } from '../hooks/useRandomHeader';

const ensureAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  let trimmed = url.trim();
  if (trimmed.startsWith('http')) return trimmed;
  return `https://${trimmed}`;
};

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

const CERTIFICATION_OPTIONS = [
  'מדריך גלישה מוסמך (וינגייט / ISA)',
  'עוזר מדריך (ניסיון קודם)',
  'מציל ים מוסמך',
  'רופא/ה',
  'אח/ות',
  'פראמדיק/ית',
  'חובש/ת',
  'מגיש/ת עזרה ראשונה (מעל 44 שעות)',
  'משיט/ת אופנוע ים (רישיון בתוקף)',
  'משיט/ת סירה / סקיפר',
  'מציל/ה בריכה',
  'טקסט חופשי'
];

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
            className="absolute left-5 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-sky-500 hover:to-indigo-500 p-2.5 rounded-2xl shadow-sm transition-all duration-500 hover:scale-110 active:scale-90"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
});

// Sub-components for better performance and readability
const SectionHeader = React.memo(({ icon: Icon, title, subtitle, colorClass, bgColorClass }: any) => (
  <div className="flex items-center gap-4 mb-8">
    <div className={`w-12 h-12 rounded-2xl ${bgColorClass} flex items-center justify-center ${colorClass} shadow-sm`}>
      <Icon size={24} />
    </div>
    <div>
      <h2 className="text-xl font-black text-[#0f172a]">{title}</h2>
      {subtitle && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
    </div>
  </div>
));

const ProfileHeader = React.memo(({ headerImage, isDirty }: { headerImage: string, isDirty: boolean }) => (
  <div className="surfboard-hero-container mb-0 space-y-2 header-wallpaper !py-12 pb-24" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
    <div className="header-content-wrapper relative z-20 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
        <User size={32} className="md:w-10 md:h-10" />
      </div>
      <h1 className="main-page-title">
        <span className="surfer-title text-[#121212] text-3xl md:text-5xl">הפרופיל שלי</span>
      </h1>
      <p className="header-subtitle max-w-2xl mx-auto text-sm md:text-base text-[#121212] opacity-80">
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
      <label className="absolute bottom-2 left-2 md:bottom-4 md:left-4 p-3 md:p-4 bg-white text-slate-900 rounded-xl md:rounded-2xl cursor-pointer hover:bg-gradient-to-r hover:from-sky-500 hover:to-indigo-500 hover:text-white transition-all border border-slate-100 shadow-xl z-20 hover:scale-110 active:scale-95 group/cam">
        <Camera size={18} className="md:w-5 md:h-5 transition-transform group-hover/cam:rotate-12" />
        <input type="file" className="hidden" accept="image/*" onChange={onAvatarSelect} disabled={isProcessingImage} />
      </label>
    </div>
    
    <div className="space-y-2 md:space-y-3">
       <h3 className="text-3xl md:text-5xl font-black text-[#0f172a] tracking-tight">{firstName} {lastName}</h3>
       <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
         <span className="px-3 py-1 md:px-4 md:py-1.5 bg-sky-100 text-sky-700 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest border border-sky-200 shadow-sm">
           {role === 'Admin' ? 'רכז' : role === 'Support' ? 'אפ-שייפר' : role === 'Instructor' ? 'מדריך' : role === 'Volunteer' ? 'מתנדב' : 'משתתף נבחרת'}
         </span>
         <span className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full" />
         <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-widest">בקהילה מאז {new Date(joinedAt).toLocaleDateString('he-IL')}</p>
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
  const { currentUser, updateUser, firebaseUser } = useAuth();
  const { updateMember } = useData();
  
  const [formData, setFormData] = useState<Member | null>(currentUser ? { ...currentUser } : null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isCertDropdownOpen, setIsCertDropdownOpen] = useState(false);
  const [certSearch, setCertSearch] = useState('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [lastVerifiedImage, setLastVerifiedImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [boardFeet, setBoardFeet] = useState('');
  const [boardInches, setBoardInches] = useState('');

  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPlaceSelected, setIsPlaceSelected] = useState(!!currentUser?.full_address);
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
    if (currentUser) {
      if (!formData) {
        setFormData({...currentUser});
      }
      if (currentUser.full_address) {
        setIsPlaceSelected(true);
        if (addressInputRef.current && !addressInputRef.current.value) {
          addressInputRef.current.value = currentUser.full_address;
        }
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
      { label: 'טלפון לחירום', value: formData.emergencyContactPhone },
      { label: 'מידע רפואי', value: formData.medicalInfo },
      { label: 'הכשרות והסמכות', value: formData.certifications && formData.certifications.length > 0 },
      { label: 'אינסטגרם', value: formData.instagramUrl },
      { label: 'פייסבוק', value: formData.facebookUrl },
      { label: 'טיקטוק', value: formData.tiktokUrl },
      { label: 'לינקדאין', value: formData.linkedinUrl },
      { label: 'טוויטר / X', value: formData.twitterUrl },
      { label: 'אתר אישי', value: formData.websiteUrl },
      { label: 'משקל', value: formData.weight },
      { label: 'גובה', value: formData.height },
      { label: 'רמת גלישה', value: formData.surfingLevel },
      { label: 'רמת כושר', value: formData.fitnessLevel },
      { label: 'נפח גלשן נוכחי', value: formData.currentBoardVolume },
      { label: 'אורך גלשן נוכחי', value: formData.currentBoardLength }
    ];
    
    const missing = fieldMap.filter(f => !f.value).map(f => f.label);
    const percentage = Math.round(((fieldMap.length - missing.length) / fieldMap.length) * 100);
    
    return { percentage, missing };
  }, [
    formData?.firstName, 
    formData?.lastName, 
    formData?.mobile, 
    formData?.avatar, 
    formData?.bio, 
    formData?.birthday, 
    formData?.gender, 
    formData?.full_address, 
    formData?.emergencyContactName, 
    formData?.emergencyContactPhone,
    formData?.medicalInfo,
    formData?.certifications,
    formData?.instagramUrl,
    formData?.facebookUrl,
    formData?.tiktokUrl,
    formData?.linkedinUrl,
    formData?.twitterUrl
  ]);

  const completionPercentage = completionDetails.percentage;

  const handleFieldChange = useCallback((field: keyof Member, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    setIsDirty(true);
  }, []);

  const parseBoardLength = useCallback((lengthStr: string | undefined | null) => {
    if (!lengthStr) return { feet: '', inches: '' };
    const cleanStr = lengthStr.trim();
    
    // Check standard format X'Y"
    const match = cleanStr.match(/^(\d+)'\s*(\d+)"?$/);
    if (match) {
      return { feet: match[1], inches: match[2] };
    }
    
    // Check format X'
    const matchFeetOnly = cleanStr.match(/^(\d+)'?$/);
    if (matchFeetOnly) {
      return { feet: matchFeetOnly[1], inches: '' };
    }
    
    // Try to match any two numbers
    const numbers = cleanStr.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return { feet: numbers[0], inches: numbers[1] };
    } else if (numbers && numbers.length === 1) {
      if (cleanStr.includes('"') && !cleanStr.includes("'")) {
        return { feet: '', inches: numbers[0] };
      }
      return { feet: numbers[0], inches: '' };
    }
    
    return { feet: '', inches: '' };
  }, []);

  // Sync from formData to local inputs on component load/change profile
  useEffect(() => {
    if (formData?.currentBoardLength) {
      const { feet, inches } = parseBoardLength(formData.currentBoardLength);
      setBoardFeet(feet);
      setBoardInches(inches);
    } else {
      setBoardFeet('');
      setBoardInches('');
    }
  }, [formData?.id]);

  const handleFeetChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    setBoardFeet(digits);
    
    let formatted = '';
    if (digits) {
      formatted += `${digits}'`;
    }
    if (boardInches) {
      formatted += `${boardInches}"`;
    }
    handleFieldChange('currentBoardLength', formatted);
  };

  const handleInchesChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    setBoardInches(digits);
    
    let formatted = '';
    if (boardFeet) {
      formatted += `${boardFeet}'`;
    } else if (digits) {
      formatted += "0'";
    }
    if (digits) {
      formatted += `${digits}"`;
    }
    handleFieldChange('currentBoardLength', formatted);
  };

  const handleMobileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange('mobile', formatMobileNumber(e.target.value));
  }, [handleFieldChange]);

  const handleInstagramChange = useCallback((v: string) => handleFieldChange('instagramUrl', v), [handleFieldChange]);
  const handleFacebookChange = useCallback((v: string) => handleFieldChange('facebookUrl', v), [handleFieldChange]);
  const handleTikTokChange = useCallback((v: string) => handleFieldChange('tiktokUrl', v), [handleFieldChange]);
  const handleLinkedInChange = useCallback((v: string) => handleFieldChange('linkedinUrl', v), [handleFieldChange]);
  const handleTwitterChange = useCallback((v: string) => handleFieldChange('twitterUrl', v), [handleFieldChange]);
  const handleWebsiteChange = useCallback((v: string) => handleFieldChange('websiteUrl', v), [handleFieldChange]);

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
    } catch (err: any) {
      console.error("Save profile error:", err);
      let errorMessage = 'שגיאה בעדכון הפרופיל';
      try {
        const errObj = JSON.parse(err.message || err);
        if (errObj.error) errorMessage = errObj.error;
      } catch (e) {
        if (err.message) errorMessage = err.message;
      }
      setToast({ msg: errorMessage, type: 'error' });
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

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      setUploadError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setUploadError('לא ניתן לגשת למצלמה. וודא שנתת הרשאות.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        stopCamera();
        handleVerification(base64);
      }
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('אנא בחר קובץ תמונה תקין');
      return;
    }

    setUploadError(null);
    setIsVerifying(true);

    try {
      // Use processImage to resize and compress the file
      const { dataUrl } = await processImage(file, 1024, 0.7);
      handleVerification(dataUrl);
    } catch (error) {
      console.error("Image processing error:", error);
      setUploadError('שגיאה בעיבוד התמונה');
      setIsVerifying(false);
    }
  };

  const handleVerification = async (base64: string) => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      // Compress if it might be too large (e.g. from camera capture)
      const compressedBase64 = await compressBase64Image(base64, 1024, 0.7);
      const result = await verifyLicense(compressedBase64);
      setVerificationResult(result);
      setLastVerifiedImage(compressedBase64);
    } catch (error) {
      console.error("Verification specialist error:", error);
      setUploadError('שגיאה בתהליך האימות האוטומטי');
    } finally {
      setIsVerifying(false);
    }
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
      if (firebaseUser) {
        const { updatePassword } = await import('firebase/auth');
        await updatePassword(firebaseUser, newPassword);
      }
      const hashed = await hashPassword(newPassword);
      await updateMember({ ...formData, password: hashed });
      setToast({ msg: 'הסיסמה שונתה בהצלחה', type: 'success' });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'שגיאה בשינוי הסיסמה';
      if (err.code === 'auth/requires-recent-login' || (err.message && err.message.includes('requires-recent-login'))) {
        errorMessage = 'פעולה זו רגישה ודורשת התחברות מחדש למערכת לצורך אימות.';
      } else {
        try {
          const errObj = JSON.parse(err.message || err);
          if (errObj.error) errorMessage = errObj.error;
        } catch (e) {
          if (err.message) errorMessage = err.message;
        }
      }
      setToast({ msg: errorMessage, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const bgElements = useMemo(() => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-[-10%] right-[-10%] w-[25rem] h-[25rem] bg-sky-200/5 blur-[50px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[25rem] h-[25rem] bg-rose-200/5 blur-[50px] rounded-full" />
    </div>
  ), []);

  if (!formData) return null;

  return (
    <div className="min-h-screen w-full luxury-bg relative overflow-hidden">
      {bgElements}

      <div className="max-w-6xl mx-auto pt-2 pb-20 text-right animate-in fade-in relative z-10 px-4 md:px-0" dir="rtl">

      {/* Body-line Standard Header Stack */}
      <ProfileHeader headerImage={headerImage} isDirty={isDirty} />

      <div className="relative z-30 -mt-16 mx-4 md:mx-0 rounded-[3.5rem] overflow-hidden">
        <form onSubmit={handleSubmit} className="px-6 md:px-16 pb-20 md:pb-24 luxury-card !bg-white/60 border-none relative z-20 overflow-hidden">
          <div className="grain-overlay" />
          <div className="premium-sweep-fx opacity-20" />

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

          <section className="space-y-6 md:space-y-8 mb-16 md:mb-20 relative z-10">
            <SectionHeader 
              icon={User} 
              title="פרטים אישיים" 
              subtitle="Personal Information"
              colorClass="text-sky-600" 
              bgColorClass="bg-sky-100" 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="space-y-2 group">
                <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">שם פרטי</label>
                <input type="text" value={formData.firstName || ''} onChange={e => handleFieldChange('firstName', e.target.value)} className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a]" />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">שם משפחה</label>
                <input type="text" value={formData.lastName || ''} onChange={e => handleFieldChange('lastName', e.target.value)} className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a]" />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">אימייל</label>
                <input 
                  type="email" 
                  value={formData.email || ''} 
                  onChange={e => handleFieldChange('email', e.target.value)} 
                  className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 focus:shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all text-[#0f172a]" 
                />
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
                    <span className="text-right flex-1">{formData.gender || 'בחר מגדר'}</span>
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
                          {(['זכר', 'נקבה', 'לא בינארי', 'מעדיפ/ה לא לציין'] as const).map((g) => (
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
              <div className="md:col-span-2 lg:col-span-3 space-y-2 group">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 relative z-10">
            <div className="lg:col-span-7 space-y-12 md:space-y-16">
              <section className="space-y-6 md:space-y-8">
                <SectionHeader 
                  icon={Award} 
                  title="הכשרות והסמכות רלוונטיות" 
                  subtitle="Relevant Certifications"
                  colorClass="text-indigo-600" 
                  bgColorClass="bg-indigo-100" 
                />
                <div className="space-y-4">
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setIsCertDropdownOpen(!isCertDropdownOpen)}
                      className="w-full pr-6 pl-12 py-4 md:py-5 bg-white/70 border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.02)] rounded-[1.25rem] font-bold text-sm outline-none focus:bg-white focus:border-indigo-200 transition-all flex items-center justify-between group/btn text-[#0f172a]"
                    >
                      <span className="truncate text-right flex-1">
                        {formData.certifications && formData.certifications.length > 0 
                          ? formData.certifications.join(', ') 
                          : 'בחר הכשרות והסמכות'}
                      </span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isCertDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isCertDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsCertDropdownOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-3 bg-white/95 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[70] overflow-hidden p-4 rounded-[1.5rem] max-h-[300px] overflow-y-auto"
                          >
                            <div className="p-2 border-b border-slate-50 mb-2">
                              <div className="relative">
                                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                  type="text"
                                  placeholder="חיפוש או הוספת הכשרה..."
                                  value={certSearch}
                                  onChange={(e) => setCertSearch(e.target.value)}
                                  className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto pr-1">
                              {/* Show custom certifications that are already selected but not in the predefined list */}
                              {formData.certifications?.filter(c => !CERTIFICATION_OPTIONS.includes(c)).map((cert) => (
                                <button
                                  key={cert}
                                  type="button"
                                  onClick={() => {
                                    const currentCerts = formData.certifications || [];
                                    handleFieldChange('certifications', currentCerts.filter(c => c !== cert));
                                  }}
                                  className="w-full px-4 py-3 text-right font-bold rounded-xl transition-all flex items-center justify-between text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50"
                                >
                                  <span className="truncate">{cert}</span>
                                  <Check size={16} />
                                </button>
                              ))}

                              {CERTIFICATION_OPTIONS.filter(cert => 
                                cert.toLowerCase().includes(certSearch.toLowerCase())
                              ).map((cert) => {
                                const isSelected = formData.certifications?.includes(cert);
                                return (
                                  <button
                                    key={cert}
                                    type="button"
                                    onClick={() => {
                                      const currentCerts = formData.certifications || [];
                                      const newCerts = isSelected 
                                        ? currentCerts.filter(c => c !== cert)
                                        : [...currentCerts, cert];
                                      handleFieldChange('certifications', newCerts);
                                    }}
                                    className={`w-full px-4 py-3 text-right font-bold rounded-xl transition-all flex items-center justify-between hover:bg-slate-50 ${
                                      isSelected ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'
                                    }`}
                                  >
                                    <span className="truncate">{cert}</span>
                                    {isSelected && <Check size={16} />}
                                  </button>
                                );
                              })}

                              {certSearch && !CERTIFICATION_OPTIONS.some(c => c.toLowerCase() === certSearch.toLowerCase()) && !formData.certifications?.includes(certSearch) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentCerts = formData.certifications || [];
                                    handleFieldChange('certifications', [...currentCerts, certSearch]);
                                    setCertSearch('');
                                  }}
                                  className="w-full px-4 py-3 text-right font-bold rounded-xl transition-all flex items-center justify-between text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-200 mt-1"
                                >
                                  <span className="truncate">הוסף: "{certSearch}"</span>
                                  <Sparkles size={14} />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {formData.certifications?.includes('טקסט חופשי') && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 group"
                    >
                      <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-indigo-600 transition-colors">פירוט הכשרה נוספת</label>
                      <textarea 
                        value={formData.otherCertification || ''} 
                        onChange={e => handleFieldChange('otherCertification', e.target.value)} 
                        placeholder="פרט כאן הכשרות נוספות..."
                        className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all text-[#0f172a] min-h-[100px] resize-none" 
                      />
                    </motion.div>
                  )}
                </div>
              </section>

              {/* Digital Document Verification Section */}
              <section className="space-y-6 md:space-y-8">
                <SectionHeader 
                  icon={ShieldCheck} 
                  title="אימות מסמכים דיגיטלי" 
                  subtitle="Digital Document Verification"
                  colorClass="text-blue-600" 
                  bgColorClass="bg-blue-100" 
                />
                
                <div className="luxury-card !p-8 bg-white/40 border border-white/60 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                  <div className="grain-overlay opacity-[0.02]" />
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleDocumentUpload} 
                    className="hidden" 
                    accept="image/*"
                  />

                  {!verificationResult && !isVerifying && !isCameraOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-4 py-10 border-2 border-dashed border-slate-200/60 rounded-[2rem] cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                      >
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                          <Upload size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black text-slate-700">העלה קובץ קיים</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      </div>

                      <div 
                        onClick={startCamera}
                        className="flex flex-col items-center justify-center gap-4 py-10 border-2 border-dashed border-slate-200/60 rounded-[2rem] cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-all group"
                      >
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors">
                          <Video size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black text-slate-700">סרוק עם המצלמה</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Capture and Scan</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isCameraOpen && (
                    <div className="flex flex-col items-center gap-6 py-6">
                      <div className="relative w-full max-w-sm aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 border-2 border-sky-500/30 border-dashed pointer-events-none rounded-2xl m-4" />
                        <div className="absolute top-4 right-4 animate-pulse">
                           <div className="w-2 h-2 bg-rose-500 rounded-full" />
                        </div>
                      </div>
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex gap-4 w-full max-w-xs">
                        <button 
                          onClick={stopCamera}
                          className="flex-1 py-3 bg-white text-slate-600 rounded-xl font-black text-xs shadow-sm hover:bg-slate-50"
                        >
                          ביטול
                        </button>
                        <button 
                          onClick={capturePhoto}
                          className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-black text-xs shadow-lg shadow-sky-500/20 hover:bg-sky-600"
                        >
                          צלם ואמת
                        </button>
                      </div>
                    </div>
                  )}

                  {isVerifying && (
                    <div className="flex flex-col items-center justify-center gap-6 py-12">
                      <div className="relative">
                        <Loader2 size={48} className="text-blue-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ShieldCheck size={20} className="text-blue-600 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-black text-slate-800 animate-pulse">מנתח מסמך ומאמת נתונים...</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gemini 1.5 Flash AI Specialist</p>
                      </div>
                    </div>
                  )}

                  {verificationResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col gap-6"
                    >
                      {verificationResult.error ? (
                        <div className="bg-rose-50 border border-rose-100/50 rounded-2xl p-8 text-center">
                          <XCircle size={40} className="text-rose-500 mx-auto mb-3" />
                          <p className="text-sm font-black text-rose-800">{verificationResult.error === "Invalid or unclear image" ? "התמונה לא ברורה או אינה רישיון תקין" : verificationResult.error}</p>
                          <button 
                            type="button"
                            onClick={() => setVerificationResult(null)}
                            className="mt-4 text-xs font-bold text-rose-600 underline underline-offset-4"
                          >
                            נסה שוב
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between bg-white/50 p-6 rounded-2xl border border-white/60">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${verificationResult.is_valid ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {verificationResult.is_valid ? <CheckCircle size={28} /> : <XCircle size={28} />}
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                   <h5 className="text-lg font-black text-slate-900 tracking-tight">{verificationResult.full_name}</h5>
                                   {verificationResult.confidence_score > 0.9 && <ShieldCheck size={16} className="text-sky-500" />}
                                </div>
                                <p className="text-xs font-bold text-slate-500 leading-none">{verificationResult.organization} • {verificationResult.level}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter ${verificationResult.is_valid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {verificationResult.is_valid ? 'Verified Document' : 'Invalid / Expired'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-right">
                            <div className="bg-white/60 p-5 rounded-2xl border border-white/80 shadow-sm">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">מספר רישיון</span>
                              <span className="font-mono text-sm font-black text-slate-800">{verificationResult.license_id}</span>
                            </div>
                            <div className="bg-white/60 p-5 rounded-2xl border border-white/80 shadow-sm">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">תאריך תפוגה</span>
                              <span className={`text-sm font-black ${verificationResult.is_valid ? 'text-slate-800' : 'text-rose-600'}`}>
                                {verificationResult.expiration_date}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 py-2 text-[10px] font-bold text-slate-400 justify-center bg-slate-50/50 rounded-xl">
                            <Camera size={12} />
                            <span className="uppercase tracking-widest">Conf Score: {Math.round(verificationResult.confidence_score * 100)}% • AI Verified</span>
                          </div>

                          <div className="flex gap-4">
                            <button 
                              type="button"
                              onClick={() => setVerificationResult(null)}
                              className="flex-1 py-4 bg-white/70 border border-white/80 rounded-2xl text-xs font-black text-slate-500 hover:bg-white transition-all shadow-sm active:scale-95"
                            >
                              ביטול
                            </button>
                            {verificationResult.is_valid && (
                              <button 
                                type="button"
                                onClick={() => {
                                  if (!formData) return;
                                  
                                  const currentCerts = formData.certifications || [];
                                  const certText = `${verificationResult.organization}: ${verificationResult.level}`;
                                  
                                  // Add to certifications if not present (legacy support)
                                  let newCerts = [...currentCerts];
                                  if (!currentCerts.includes(certText)) {
                                    newCerts.push(certText);
                                  }

                                  // Add to digital wallet
                                  const rawType = (verificationResult.type || '').toLowerCase();
                                  const org = (verificationResult.organization || '').toLowerCase();
                                  
                                  const walletType = 
                                          ['diving', 'surfing', 'sailing', 'skydiving', 'climbing'].includes(rawType) ? (rawType.charAt(0).toUpperCase() + rawType.slice(1)) :
                                          (org.includes('scuba') || org.includes('padi') || org.includes('ssi') ? 'Diving' : 
                                           org.includes('surf') ? 'Surfing' : 
                                           org.includes('sail') || org.includes('skipper') ? 'Sailing' :
                                           org.includes('skydive') ? 'Skydiving' :
                                           org.includes('climb') ? 'Climbing' : 'Other');

                                  const walletEntity = {
                                    id: crypto.randomUUID(),
                                    full_name: verificationResult.full_name,
                                    license_id: verificationResult.license_id,
                                    organization: verificationResult.organization,
                                    expiration_date: verificationResult.expiration_date,
                                    level: verificationResult.level,
                                    rank: verificationResult.rank,
                                    issue_date: verificationResult.issue_date,
                                    school_number: verificationResult.school_number,
                                    instructor: verificationResult.instructor,
                                    metadata: verificationResult.metadata || {},
                                    image_data: lastVerifiedImage, // Save the base64 image
                                    confidence_score: verificationResult.confidence_score,
                                    is_valid: verificationResult.is_valid,
                                    type: walletType,
                                    verifiedAt: new Date().toISOString()
                                  };

                                  const currentWallet = formData.digitalWallet || [];
                                  
                                  setFormData({
                                    ...formData,
                                    certifications: newCerts,
                                    digitalWallet: [...currentWallet, walletEntity]
                                  });

                                  setToast({ msg: 'המסמך אומת ונשמר זמנית. אל תשכח ללחוץ על "שמור שינויים" בתחתית העמוד כדי לעדכן את הפרופיל והדרכון האתלט שלך!', type: 'success' });
                                  setVerificationResult(null);
                                  setIsDirty(true);
                                  setTimeout(() => setToast(null), 5000);
                                }}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                              >
                                הוסף לארנק הדיגיטלי
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                
                {uploadError && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-rose-50 text-rose-600 text-xs font-bold p-4 rounded-xl border border-rose-100 flex items-center gap-3"
                  >
                    <AlertTriangle size={16} />
                    {uploadError}
                  </motion.div>
                )}
              </section>
              
              {/* Digital Wallet Section */}
              <section className="space-y-6 md:space-y-8">
                <SectionHeader 
                  icon={Award} 
                  title="ארנק מסמכים דיגיטלי" 
                  subtitle="Your Digital Sport Wallet"
                  colorClass="text-emerald-600" 
                  bgColorClass="bg-emerald-100" 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.digitalWallet && formData.digitalWallet.length > 0 ? (
                    formData.digitalWallet.map((license: any) => (
                      <motion.div 
                        key={license.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="luxury-card !p-6 bg-white/40 border border-white/80 rounded-3xl shadow-sm space-y-4 relative overflow-hidden group"
                      >
                         <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                         <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                  {license.type === 'Diving' ? <Waves size={20} /> : license.type === 'Surfing' ? <Wind size={20} /> : <ShieldCheck size={20} />}
                               </div>
                               <div>
                                  <h5 className="font-black text-slate-900 leading-tight">{license.organization}</h5>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{license.level}</p>
                               </div>
                            </div>
                            <div className="text-left">
                               <button 
                                 type="button"
                                 onClick={() => {
                                   const newWallet = formData.digitalWallet?.filter((item: any) => item.id !== license.id);
                                   handleFieldChange('digitalWallet', newWallet);
                                 }}
                                 className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                         
                          {license.image_data && (
                            <div className="relative group/scan h-44 w-full rounded-2xl overflow-hidden border border-white/60 shadow-inner my-4">
                              <img src={license.image_data} alt="Scan" className="w-full h-full object-cover transition-transform group-hover/scan:scale-105 duration-700" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 opacity-0 group-hover/scan:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const win = window.open();
                                    win?.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;"><img src="${license.image_data}" style="max-width:100%;max-height:100vh;"></body></html>`);
                                  }}
                                  className="text-[9px] font-black text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 ml-auto hover:bg-white/40 transition-all border border-white/20 shadow-xl"
                                >
                                  <Maximize2 size={12} /> הצג סריקה מקורית
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 relative z-10">
                            <div className="bg-white/50 p-3 rounded-xl border border-white/60">
                               <span className="text-[9px] font-bold text-slate-400 uppercase block">ID</span>
                               <span className="font-mono text-xs font-black text-slate-700">{license.license_id}</span>
                            </div>
                            <div className="bg-white/50 p-3 rounded-xl border border-white/60">
                               <span className="text-[9px] font-bold text-slate-400 uppercase block">Expires</span>
                               <span className="text-xs font-black text-slate-700">{license.expiration_date || 'N/A'}</span>
                            </div>
                            {license.rank && (
                              <div className="bg-white/50 p-3 rounded-xl border border-white/60">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Rank</span>
                                <span className="text-xs font-black text-slate-700">{license.rank}</span>
                              </div>
                            )}
                            {license.issue_date && (
                              <div className="bg-white/50 p-3 rounded-xl border border-white/60">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Issued</span>
                                <span className="text-xs font-black text-slate-700">{license.issue_date}</span>
                              </div>
                            )}
                            {license.school_number && (
                              <div className="bg-white/50 p-3 rounded-xl border border-white/60">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">School</span>
                                <span className="text-xs font-black text-slate-700">{license.school_number}</span>
                              </div>
                            )}
                            {license.instructor && (
                              <div className="bg-white/50 p-3 rounded-xl border border-white/60 col-span-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Instructor</span>
                                <span className="text-xs font-black text-slate-700">{license.instructor}</span>
                              </div>
                            )}
                            
                            {/* Dynamic Metadata Fields */}
                            {license.metadata && Object.entries(license.metadata).map(([key, value]) => (
                              <div key={key} className="bg-white/50 p-3 rounded-xl border border-white/60">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none mb-1">{key.replace(/_/g, ' ')}</span>
                                <span className="text-xs font-black text-slate-700 leading-tight">{String(value)}</span>
                              </div>
                            ))}
                         </div>
                         
                         <div className="flex items-center justify-between pt-2 border-t border-slate-100 relative z-10">
                            <div className="flex items-center gap-1">
                               <VerifiedIcon size={12} className="text-emerald-500" />
                               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Verified License</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="text-[9px] font-bold text-slate-300 italic">Added: {new Date(license.verifiedAt).toLocaleDateString('he-IL')}</span>
                               <button 
                                 onClick={() => {
                                   if (!formData.digitalWallet) return;
                                   const newWallet = formData.digitalWallet.filter((item: any) => item.id !== license.id);
                                   handleFieldChange('digitalWallet', newWallet);
                                   setIsDirty(true);
                                   setToast({ msg: 'המסמך הוסר מהארנק', type: 'success' });
                                   setTimeout(() => setToast(null), 3000);
                                 }}
                                 className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                               >
                                 <Trash2 size={12} />
                               </button>
                            </div>
                         </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="md:col-span-2 py-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                       <FileDigit size={40} className="text-slate-300 mx-auto mb-4" />
                       <p className="text-slate-400 font-bold">הארנק הדיגיטלי ריק. השתמש במאמת המסמכים למעלה כדי להוסיף רישיונות.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6 md:space-y-8">
                <SectionHeader 
                  icon={HeartPulse} 
                  title="מידע רפואי וחירום" 
                  subtitle="Medical & Emergency Info"
                  colorClass="text-rose-600" 
                  bgColorClass="bg-rose-100" 
                />
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

              <section className="space-y-6 md:space-y-8">
                <SectionHeader 
                  icon={Sparkles} 
                  title="נוכחות דיגיטלית" 
                  subtitle="Social Media Presence"
                  colorClass="text-emerald-600" 
                  bgColorClass="bg-emerald-100" 
                />
                <div className="grid grid-cols-1 gap-8 md:gap-10">
                  <SocialInput label="Instagram" value={formData.instagramUrl} onChange={handleInstagramChange} icon={Instagram} brandColor="#E4405F" placeholder="קישור לפרופיל אינסטגרם" />
                  <SocialInput label="Facebook" value={formData.facebookUrl} onChange={handleFacebookChange} icon={Facebook} brandColor="#1877F2" placeholder="קישור לפרופיל פייסבוק" />
                  <SocialInput label="TikTok" value={formData.tiktokUrl} onChange={handleTikTokChange} icon={Music2} brandColor="#000000" placeholder="קישור לפרופיל טיקטוק" />
                  <SocialInput label="LinkedIn" value={formData.linkedinUrl} onChange={handleLinkedInChange} icon={Linkedin} brandColor="#0A66C2" placeholder="קישור לפרופיל לינקדאין" />
                  <SocialInput label="Twitter / X" value={formData.twitterUrl} onChange={handleTwitterChange} icon={Twitter} brandColor="#000000" placeholder="קישור לפרופיל טוויטר" />
                  <SocialInput label="Personal Website" value={formData.websiteUrl} onChange={handleWebsiteChange} icon={Globe} brandColor="#00AFC2" placeholder="קישור לאתר אישי" />
                </div>
              </section>

              <section className="space-y-6 md:space-y-8">
                <SectionHeader 
                  icon={Sparkles} 
                  title="פרופיל גלישה" 
                  subtitle="Surfing Profile"
                  colorClass="text-sky-600" 
                  bgColorClass="bg-sky-100" 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">משקל (ק"ג)</label>
                    <input 
                      type="number" 
                      value={formData.weight || ''} 
                      onChange={e => handleFieldChange('weight', Number(e.target.value))} 
                      className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 transition-all text-[#0f172a]" 
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">גובה (ס"מ)</label>
                    <input 
                      type="number" 
                      value={formData.height || ''} 
                      onChange={e => handleFieldChange('height', Number(e.target.value))} 
                      className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 transition-all text-[#0f172a]" 
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">רמת גלישה</label>
                    <select 
                      value={formData.surfingLevel || ''} 
                      onChange={e => handleFieldChange('surfingLevel', e.target.value)}
                      className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 transition-all text-[#0f172a] appearance-none"
                    >
                      <option value="">בחר רמת גלישה</option>
                      <option value="Learner">לומד (Learner)</option>
                      <option value="Beginner">מתחיל (Beginner)</option>
                      <option value="Intermediate">בינוני (Intermediate)</option>
                      <option value="Advanced">מתקדם (Advanced)</option>
                    </select>
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">רמת כושר</label>
                    <select 
                      value={formData.fitnessLevel || ''} 
                      onChange={e => handleFieldChange('fitnessLevel', e.target.value)}
                      className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 transition-all text-[#0f172a] appearance-none"
                    >
                      <option value="">בחר רמת כושר</option>
                      <option value="Low">נמוכה (Low)</option>
                      <option value="Average">ממוצעת (Average)</option>
                      <option value="High">גבוהה (High)</option>
                      <option value="Elite">עילית (Elite)</option>
                    </select>
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">נפח גלשן נוכחי (ליטר)</label>
                    <input 
                      type="number" 
                      value={formData.currentBoardVolume || ''} 
                      onChange={e => handleFieldChange('currentBoardVolume', Number(e.target.value))} 
                      className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 transition-all text-[#0f172a]" 
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-sky-600 transition-colors">אורך גלשן נוכחי (פיט ואינצ'ים)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 relative">
                        <input 
                          type="text" 
                          pattern="\d*"
                          inputMode="numeric"
                          value={boardInches} 
                          onChange={e => handleInchesChange(e.target.value)} 
                          className="w-full p-4 md:p-5 pl-10 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 transition-all text-[#0f172a] text-center" 
                          placeholder="10"
                        />
                        <span className="absolute left-4 top-[18px] md:top-[22px] text-xs font-bold text-slate-400 pointer-events-none">in</span>
                        <div className="text-[10px] text-slate-400 pr-2">אינץ' (Inches)</div>
                      </div>
                      <div className="space-y-1 relative">
                        <input 
                          type="text" 
                          pattern="\d*"
                          inputMode="numeric"
                          value={boardFeet} 
                          onChange={e => handleFeetChange(e.target.value)} 
                          className="w-full p-4 md:p-5 pl-10 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold outline-none focus:bg-white focus:border-sky-200 transition-all text-[#0f172a] text-center" 
                          placeholder="6"
                        />
                        <span className="absolute left-4 top-[18px] md:top-[22px] text-xs font-bold text-slate-400 pointer-events-none">ft</span>
                        <div className="text-[10px] text-slate-400 pr-2">פיט (Feet)</div>
                      </div>
                    </div>
                    {formData.currentBoardLength && (
                      <div className="text-xs font-semibold text-slate-500 pr-3 mt-1">
                        תצוגה מנורמלת: <span className="font-mono text-sky-600 font-bold" dir="ltr">{formData.currentBoardLength}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-5">
               <div className="lg:sticky lg:top-24 space-y-12">
                  <section className="space-y-6">
                    <div className="flex justify-between items-center px-2 md:px-4">
                      <SectionHeader 
                        icon={Music2} 
                        title="הסיפור שלי" 
                        subtitle="My Story"
                        colorClass="text-violet-600" 
                        bgColorClass="bg-violet-100" 
                      />
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
                  </section>
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
                    className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] font-black text-xl transition-all hover:from-sky-400 hover:to-indigo-400 hover:translate-y-[-4px] active:scale-95 disabled:opacity-50 group border border-white/20 backdrop-blur-sm"
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
                    className="w-full py-6 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-black rounded-2xl transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:translate-y-[-4px] active:scale-95 border border-white/20 backdrop-blur-sm"
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
