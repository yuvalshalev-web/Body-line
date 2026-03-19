
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
  HelpCircle
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

const SocialInput = ({ 
  label, name, value, onChange, icon: Icon, placeholder, brandColor, ensureAbsoluteUrl,
}: any) => {
  const hasValue = !!(value && value.trim());
  return (
    <div className="group">
      <label className="block text-[12px] font-black text-[#00426a] mb-2 uppercase tracking-widest pr-3">{label}</label>
      <div className="relative">
        <Icon size={18} className="absolute right-5 top-1/2 -translate-y-1/2" style={{ color: hasValue ? brandColor : '#cbd5e1' }} />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pr-14 pl-12 py-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-white/20 transition-all text-[#000000]"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {hasValue && (
          <a href={ensureAbsoluteUrl(value)} target="_blank" rel="noopener noreferrer" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-950 transition-colors bg-white/20 p-1.5 rounded-lg shadow-sm">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser, updateUser } = useAuth();
  const { updateMember } = useData();
  
  const [formData, setFormData] = useState<Member | null>(null);
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

  useEffect(() => {
    if (currentUser && !formData) {
      setFormData({...currentUser});
      if (currentUser.full_address && addressInputRef.current) {
        addressInputRef.current.value = currentUser.full_address;
        setIsPlaceSelected(true);
      }
    }
  }, [currentUser?.id]); // Only run on initial load or user change

  useEffect(() => {
    const initAutocomplete = () => {
      if (addressInputRef.current && window.google?.maps?.places) {
        try {
          // If already initialized, we clear listeners to re-attach them to the latest scope
          if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          } else {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
              componentRestrictions: { country: "il" },
              fields: ["address_components", "geometry", "formatted_address"]
            });
          }

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            
            if (!place.geometry) {
              console.log("Autocomplete: No geometry found for selected place");
              setIsPlaceSelected(false);
              return;
            }

            console.log("Autocomplete: Place selected successfully", place.formatted_address);
            setIsPlaceSelected(true);
            setIsDirty(true);
            
            if (addressInputRef.current) {
              addressInputRef.current.value = place.formatted_address || '';
            }
            
            // Populate hidden fields and update local state
            const addressComponents = place.address_components || [];
            const city = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name || '';
            const street = addressComponents.find((c: any) => c.types.includes('route'))?.long_name || '';
            const houseNum = addressComponents.find((c: any) => c.types.includes('street_number'))?.long_name || '';
            const country = addressComponents.find((c: any) => c.types.includes('country'))?.long_name || '';
            const lat = place.geometry?.location?.lat() || 0;
            const lng = place.geometry?.location?.lng() || 0;

            const fields = [
              { ref: cityRef, value: city },
              { ref: streetRef, value: street },
              { ref: houseNumRef, value: houseNum },
              { ref: latRef, value: lat.toString() },
              { ref: lngRef, value: lng.toString() }
            ];

            fields.forEach(({ ref, value }) => {
              if (ref.current) {
                ref.current.value = value;
                ref.current.dispatchEvent(new Event('input', { bubbles: true }));
              }
            });

            // Update local formData instead of immediate DB update
            setFormData(prev => prev ? { 
              ...prev, 
              full_address: place.formatted_address,
              city, 
              street_name: street, 
              house_number: houseNum, 
              country,
              lat, 
              lng 
            } : null);
          });
        } catch (e) {
          console.error("Failed to initialize Autocomplete:", e);
        }
      }
    };

    // Global error handler for Google Maps API
    (window as any).gm_authFailure = () => {
      console.error("Google Maps API authentication/authorization failed.");
      setToast({ 
        msg: 'שגיאת הרשאות במפות גוגל. יש לוודא שה-Places API וה-Maps JavaScript API מופעלים ב-Google Cloud.', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 6000);
    };

    loadGoogleMaps()
      .then(initAutocomplete)
      .catch(err => {
        console.warn("Google Maps loading failed:", err.message);
      });

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [currentUser?.id]);

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
  }, [formData]);

  const completionPercentage = completionDetails.percentage;

  if (!formData) return <div className="text-black">Loading...</div>;

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http')) return trimmed;
    return `https://${trimmed}`;
  };

  const handleFieldChange = (field: keyof Member, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    setIsDirty(true);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange('mobile', formatMobileNumber(e.target.value));
  };

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

  console.log("ProfilePage rendering");
  return (
    <div className="min-h-screen w-full luxury-bg">
      <div className="max-w-6xl mx-auto pt-2 pb-10 text-right animate-in fade-in" dir="rtl">

      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-2 space-y-2 header-wallpaper !py-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
            <User size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title">הפרופיל שלי</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto">
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

      <div className="rounded-[2rem] overflow-hidden relative border border-white/50">
        <div className="h-12 relative">
        </div>
        
        <form onSubmit={handleSubmit} className="px-12 pb-16 -mt-6 luxury-card border border-white/60 rounded-[2.5rem] relative z-20">
          <div className="flex flex-col items-center gap-8 mb-16 text-center">
            <div className="relative group">
              <style>
                {`
                  .feathered-avatar {
                    mask-image: radial-gradient(circle, black 40%, transparent 100%);
                    -webkit-mask-image: radial-gradient(circle, black 40%, transparent 100%);
                  }
                `}
              </style>
              <div className="w-44 h-44 overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 flex items-center justify-center relative z-10">
                {isProcessingImage ? (
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                ) : formData.avatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover feathered-avatar feathered-avatar-hover" alt="" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center feathered-avatar">
                    <User size={64} className="text-slate-300" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 left-2 p-3 bg-[var(--surfer-cyan)] text-black rounded-[1rem] cursor-pointer hover:bg-[var(--surfer-teal)] hover:text-white transition-all border border-white/50 shadow-[0_5px_15px_rgba(0,0,0,0.1)] z-20">
                <Camera size={20} className="text-[#00FFFF]" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} disabled={isProcessingImage} />
              </label>
            </div>
            <div className="flex-1 mb-4">
               <h3 className="text-4xl font-black text-[#7A1555] tracking-tight mb-2">{formData.firstName} {formData.lastName}</h3>
               <div className="flex items-center justify-center gap-3">
                 <p className="text-[#00426a] font-bold uppercase tracking-widest text-xs">{formData.role === 'Admin' ? 'רכז' : 'חבר נבחרת'}</p>
                 <span className="w-1 h-1 bg-slate-300 rounded-full" />
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">חבר מאז {new Date(formData.joinedAt).toLocaleDateString('he-IL')}</p>
               </div>
            </div>

            {/* Profile Completion Bar */}
            <div className="w-full max-w-md bg-white/10 backdrop-blur-[20px] border border-white/30 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6 px-1">
                  <div className="flex items-center gap-4">
                    <span className="text-[20px] font-black text-[#00426a] uppercase tracking-widest">השלמת פרופיל</span>
                    <button 
                      type="button"
                      onClick={() => setShowCompletionModal(true)}
                      className="text-[#00426a]/40 hover:text-[#00426a] transition-colors"
                    >
                      <HelpCircle size={28} />
                    </button>
                  </div>
                  <span className="text-[24px] font-black text-[#7A1555] drop-shadow-sm">{completionPercentage}%</span>
                </div>
                <div className="space-y-3">
                  <div className="h-6 w-full glass-progress-track rounded-full overflow-hidden relative" dir="ltr">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      className="h-full bg-gradient-to-r from-[var(--surfer-cyan)] to-[var(--surfer-teal)] glass-progress-fill"
                    />
                  </div>
                  <div className="flex justify-between px-2" dir="ltr">
                    <span className="text-[14px] font-black text-[#00426a]/30">0%</span>
                    <span className="text-[14px] font-black text-[#00426a]/30">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-10">
              <section>
                <h4 className="text-xs font-black text-[#00426a] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <User size={14} className="text-[#3dbbd3]" /> פרטי התקשרות
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">שם פרטי</label>
                    <input type="text" value={formData.firstName || ''} onChange={e => handleFieldChange('firstName', e.target.value)} className="w-full p-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-white/20 transition-all text-[#000000]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">שם משפחה</label>
                    <input type="text" value={formData.lastName || ''} onChange={e => handleFieldChange('lastName', e.target.value)} className="w-full p-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-white/20 transition-all text-[#000000]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">טלפון נייד</label>
                    <div className="relative">
                      <Phone size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#FFDE45]" />
                      <input 
                        type="tel" 
                        value={formData.mobile} 
                        onChange={handleMobileChange} 
                        className="w-full pr-14 pl-6 py-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-white/20 transition-all text-[#000000]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">תאריך יום הולדת</label>
                    <div className="relative">
                      <Cake size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#FF2D60]" />
                      <input 
                        type="date" 
                        value={formData.birthday || ''} 
                        onChange={e => handleFieldChange('birthday', e.target.value)} 
                        className="w-full pr-14 pl-6 py-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-white/20 transition-all cursor-pointer text-[#000000]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">מגדר</label>
                    <div className="relative">
                      <User size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#3dbbd3]" />
                      <button 
                        type="button"
                        onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                        className="w-full pr-14 pl-12 py-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black text-sm outline-none focus:bg-white/20 transition-all flex items-center justify-between group text-[#000000]"
                      >
                        <span>{formData.gender || 'בחר מגדר'}</span>
                        <ChevronDown size={18} className={`text-[#00426a] transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isGenderDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setIsGenderDropdownOpen(false)} />
                            <motion.div 
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-[20px] rounded-[1rem] border-t border-l border-white/30 shadow-[5px_5px_15px_rgba(122,21,85,0.3)] z-[70] overflow-hidden"
                            >
                              {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => {
                                    handleFieldChange('gender', g);
                                    setIsGenderDropdownOpen(false);
                                  }}
                                  className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-cyan-50 ${
                                    formData.gender === g ? 'text-[#7A1555] bg-cyan-50/50' : 'text-[#00426a]'
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
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">כתובת מגורים (חובה)</label>
                    <div className="relative">
                      <Globe size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#3dbbd3]" />
                      <input 
                        type="text" 
                        id="address-input"
                        ref={addressInputRef}
                        defaultValue={currentUser?.full_address || ''} 
                        onChange={(e) => {
                          setIsPlaceSelected(false);
                          setIsDirty(true);
                        }} 
                        placeholder="התחל להקליד: עיר, רחוב ומספר בית..."
                        className="w-full pr-14 pl-6 py-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-white/20 transition-all text-[#000000]" 
                        required
                        autoComplete="off"
                      />
                    </div>
                    <input type="hidden" id="city" ref={cityRef} />
                    <input type="hidden" id="street" ref={streetRef} />
                    <input type="hidden" id="house_num" ref={houseNumRef} />
                    <input type="hidden" id="lat" ref={latRef} />
                    <input type="hidden" id="lng" ref={lngRef} />
                    <p className="text-[12px] text-[#00426a] pr-3 font-bold">חובה לבחור את הכתובת מתוך הרשימה שנפתחת כדי שנוכל לחשב מרחק מהמועדון.</p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-black text-[#007085] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <Sparkles size={14} className="text-[#FFDE45]" /> נוכחות דיגיטלית
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SocialInput label="Instagram" value={formData.instagramUrl} onChange={(v: string) => handleFieldChange('instagramUrl', v)} icon={Instagram} brandColor="#E4405F" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל אינסטגרם" />
                  <SocialInput label="Facebook" value={formData.facebookUrl} onChange={(v: string) => handleFieldChange('facebookUrl', v)} icon={Facebook} brandColor="#1877F2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל פייסבוק" />
                  <SocialInput label="TikTok" value={formData.tiktokUrl} onChange={(v: string) => handleFieldChange('tiktokUrl', v)} icon={Music2} brandColor="#000000" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל טיקטוק" />
                  <SocialInput label="LinkedIn" value={formData.linkedinUrl} onChange={(v: string) => handleFieldChange('linkedinUrl', v)} icon={Linkedin} brandColor="#0A66C2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל לינקדאין" />
                  <SocialInput label="Twitter / X" value={formData.twitterUrl} onChange={(v: string) => handleFieldChange('twitterUrl', v)} icon={Twitter} brandColor="#1DA1F2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל טוויטר" />
                </div>
              </section>

              <section>
                <h4 className="text-xs font-black text-[#007085] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <AlertCircle size={14} className="text-[#FF2D60]" /> בטיחות ובריאות
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">איש קשר לחירום</label>
                    <input 
                      type="text" 
                      value={formData.emergencyContactName || ''} 
                      onChange={e => handleFieldChange('emergencyContactName', e.target.value)} 
                      placeholder="שם מלא של איש הקשר"
                      className="w-full p-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-white/20 transition-all text-[#000000]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">טלפון חירום</label>
                    <input 
                      type="tel" 
                      value={formData.emergencyContactPhone || ''} 
                      onChange={e => handleFieldChange('emergencyContactPhone', formatMobileNumber(e.target.value))} 
                      placeholder="מספר טלפון לחירום"
                      className="w-full p-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-black outline-none focus:bg-white/20 transition-all text-[#000000]" 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">מידע רפואי / רגישויות</label>
                    <textarea 
                      value={formData.medicalInfo || ''} 
                      onChange={e => handleFieldChange('medicalInfo', e.target.value)} 
                      placeholder="פרט כאן רגישויות, פציעות עבר או מידע רפואי שחשוב שנדע..."
                      className="w-full p-5 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1)] rounded-[1rem] font-bold h-24 resize-none outline-none focus:bg-white/20 transition-all text-[#000000]" 
                    />
                  </div>
                </div>
              </section>

            </div>

            <div className="lg:col-span-5">
               <div className="sticky top-24 space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-xs font-black text-[#007085] uppercase tracking-[0.2em]">הסיפור שלי</label>
                    <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="text-[12px] font-black text-black bg-[var(--surfer-cyan)] flex items-center gap-1.5 hover:bg-[var(--surfer-teal)] hover:text-white px-3 py-1.5 rounded-[1rem] transition-all border-t border-l border-white/30 shadow-[2px_2px_5px_rgba(122,21,85,0.3)]">
                      {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-[#FFDE45]" />} שדרג ביוגרפיה עם AI
                    </button>
                  </div>
                  <textarea 
                    value={formData.bio} 
                    onChange={e => handleFieldChange('bio', e.target.value)} 
                    className="w-full p-8 bg-white/10 backdrop-blur-[30px] border border-white/40 shadow-[inset_2px_2px_5px_rgba(122,21,85,0.1),5px_5px_15px_rgba(122,21,85,0.2)] rounded-[1rem] font-bold h-[32rem] resize-none outline-none focus:bg-white/20 transition-all text-lg leading-relaxed text-[#000000]" 
                    placeholder="ספר קצת על עצמך, על הגלישה, על החיים..." 
                  />
               </div>
            </div>
          </div>

          <div className="mt-20 flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
             <button 
               type="submit" 
               disabled={isSaving || !isDirty} 
               className="w-full max-w-xs mx-auto flex items-center justify-center gap-4 px-10 py-5 bg-[var(--surfer-cyan)] text-black rounded-[1rem] border-t border-l border-white/30 shadow-[5px_5px_15px_rgba(122,21,85,0.3)] font-black text-xl transition-all hover:bg-[var(--surfer-teal)] hover:text-white hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[8px_8px_20px_rgba(122,21,85,0.4)] active:scale-95 disabled:opacity-50"
             >
                 {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                 שמור שינויים
             </button>
             
             <button 
               type="button" 
               onClick={() => setShowPasswordModal(true)}
               className="w-full max-w-xs mx-auto flex items-center justify-center gap-4 px-10 py-5 bg-cyan-50/5 backdrop-blur-[20px] text-[#00426a] rounded-[1rem] border-t border-l border-white/30 shadow-[5px_5px_15px_rgba(122,21,85,0.3)] font-black text-xl transition-all hover:bg-cyan-50/10 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[8px_8px_20px_rgba(122,21,85,0.4)] active:scale-95"
             >
               <Key size={24} />
               החלפת סיסמה
             </button>
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#FDFDFD] rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden border border-white"
              style={{
                background: 'radial-gradient(circle at top left, rgba(224, 247, 250, 0.4) 0%, transparent 25%), radial-gradient(circle at bottom right, rgba(224, 247, 250, 0.4) 0%, transparent 25%), #FDFDFD',
              }}
            >
              {/* Micro-grain texture overlay */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              <div className="relative z-10 p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-[#00426a] flex items-center gap-3">
                    <Key className="text-indigo-500" />
                    החלפת סיסמה
                  </h3>
                  <button 
                    onClick={() => setShowPasswordModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a]/40 uppercase tracking-widest pr-3">סיסמה חדשה</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full p-5 bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-slate-100 font-black outline-none focus:border-[var(--surfer-cyan)] transition-all text-[#00426a]"
                      placeholder="הזן סיסמה חדשה"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#00426a]/40 uppercase tracking-widest pr-3">אימות סיסמה</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full p-5 bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-slate-100 font-black outline-none focus:border-[var(--surfer-cyan)] transition-all text-[#00426a]"
                      placeholder="הזן שוב את הסיסמה"
                      required
                      minLength={6}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-[#00426a] text-white rounded-2xl shadow-[0_10px_25px_rgba(0,66,106,0.2)] font-black text-lg transition-all hover:bg-[#005a6b] active:scale-95 disabled:opacity-50"
                  >
                    {isChangingPassword ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    עדכן סיסמה
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Danger Zone */}
      <section className="mt-20 pt-10 border-t border-rose-500/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-rose-500/5 p-8 rounded-[2rem] border border-rose-500/20">
          <div className="space-y-2 text-center md:text-right">
            <h4 className="text-xl font-black text-rose-400">אזור השעיה</h4>
            <p className="text-sm text-rose-400/60">השעיית החשבון תמנע ממך גישה למערכת עד שמנהל יחזיר אותך לפעילות.</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-8 py-4 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-black rounded-xl border border-rose-600/50 transition-all flex items-center gap-2"
          >
            <Trash2 size={20} />
            השעה חשבון
          </button>
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-[2.5rem] p-10 shadow-2xl text-center"
              dir="rtl"
            >
              <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">בטוח שברצונך להשעות את החשבון?</h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                השעיית החשבון תמנע ממך גישה למערכת עד שמנהל יחזיר אותך לפעילות.
              </p>
              
              <div className="space-y-3">
                <button 
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
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl transition-all shadow-lg"
                >
                  כן, השעה את החשבון שלי
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                >
                  ביטול
                </button>
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#FDFDFD] rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden border border-white"
              style={{
                background: 'radial-gradient(circle at top left, rgba(224, 247, 250, 0.4) 0%, transparent 25%), radial-gradient(circle at bottom right, rgba(224, 247, 250, 0.4) 0%, transparent 25%), #FDFDFD',
              }}
              dir="rtl"
            >
              {/* Micro-grain texture overlay */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-[#00426a] flex items-center gap-3">
                    <HelpCircle className="text-[var(--surfer-cyan)]" />
                    מה חסר להשלמה?
                  </h3>
                  <button 
                    onClick={() => setShowCompletionModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <p className="text-[#00426a]/70 font-bold">
                    כדי להגיע ל-100% השלמת פרופיל, עליך למלא את השדות הבאים:
                  </p>
                  
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 py-2">
                    {completionDetails.missing.length > 0 ? (
                      completionDetails.missing.map((label, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3 p-5 bg-white rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-slate-50 transition-transform hover:scale-[1.02]"
                        >
                          <div className="w-2 h-2 rounded-full bg-[var(--surfer-cyan)] shadow-[0_0_8px_rgba(61,187,211,0.5)]" />
                          <span className="font-bold text-[#00426a]">{label}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-8">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center shadow-inner">
                          <Check className="text-emerald-500" size={40} />
                        </div>
                        <p className="font-black text-emerald-600 text-2xl">הפרופיל שלך מושלם!</p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowCompletionModal(false)}
                    className="w-full py-5 bg-[#00426a] hover:bg-[#005a6b] text-white font-black rounded-2xl transition-all shadow-[0_10px_25px_rgba(0,66,106,0.2)]"
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
