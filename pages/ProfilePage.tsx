
import React, { useState, useEffect, useRef } from 'react';
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
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';
import { generateBio } from '../services/geminiService';
import { processImage } from '../utils/imageProcessor';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';
import { hashPassword } from '../utils/crypto';
import { updateMemberAddress } from '../utils/googlePlaces';

const SocialInput = ({ 
  label, name, value, onChange, icon: Icon, placeholder, brandColor, ensureAbsoluteUrl,
}: any) => {
  const hasValue = !!(value && value.trim());
  return (
    <div className="group">
      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">{label}</label>
      <div className="relative">
        <Icon size={18} className="absolute right-5 top-1/2 -translate-y-1/2" style={{ color: hasValue ? brandColor : '#cbd5e1' }} />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pr-14 pl-12 py-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100 focus:border-indigo-200 focus:bg-white transition-all"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {hasValue && (
          <a href={ensureAbsoluteUrl(value)} target="_blank" rel="noopener noreferrer" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-950 transition-colors bg-white p-1.5 rounded-lg shadow-sm">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPlaceSelected, setIsPlaceSelected] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

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
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_MAPS_API_KEY is missing. Google Maps autocomplete will not work.");
      return;
    }

    const initAutocomplete = () => {
      if (addressInputRef.current && window.google && !autocompleteRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          componentRestrictions: { country: "il" },
          fields: ["address_components", "geometry", "formatted_address"]
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (!place.geometry) {
            setIsPlaceSelected(false);
            return;
          }

          setIsPlaceSelected(true);
          if (addressInputRef.current) {
            addressInputRef.current.value = place.formatted_address || '';
          }
          
          if (currentUser) {
            updateMemberAddress(currentUser.id, place).then(addressData => {
              setFormData(prev => prev ? { ...prev, ...addressData } : null);
              setToast({ msg: 'הכתובת עודכנה בהצלחה!', type: 'success' });
              setTimeout(() => setToast(null), 3000);
            }).catch(err => {
              console.error(err);
              setToast({ msg: 'שגיאה בעדכון הכתובת', type: 'error' });
              setTimeout(() => setToast(null), 3000);
            });
          }
        });
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

    if (window.google) {
      initAutocomplete();
    } else {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=he&region=IL`;
        script.async = true;
        script.defer = true;
        script.onload = initAutocomplete;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initAutocomplete);
      }
    }
  }, [currentUser]);

  if (!formData) return null;

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

  return (
    <div className="max-w-6xl mx-auto py-10 text-right animate-in fade-in" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="flex flex-col items-center text-center mb-10 space-y-4">
        {/* Top Badge */}
        <div className="header-badge-glass">
          <User size={12} className="text-[#00f2fe]" />
          <span>MEMBER PROFILE</span>
        </div>

        {/* Main Title */}
        <h1 className="main-page-title">
          הפרופיל שלי
        </h1>

        {/* Subtitle with Emoji context */}
        <div className="flex flex-col items-center gap-6">
          <p className="header-subtitle max-w-2xl">
            עדכן את הפרטים האישיים והנוכחות הדיגיטלית שלך בקהילה 👤
          </p>
          
          {isDirty && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl animate-bounce">
              <AlertCircle size={16} />
              <span className="text-xs font-black">שינויים לא שמורים</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative">
        <div className="h-48 bg-slate-900 relative">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
             <div className="absolute bottom-10 right-20 w-48 h-48 bg-sky-500 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-12 pb-16 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-8 mb-16">
            <div className="relative group">
              <div className="w-44 h-44 rounded-[3rem] border-[10px] border-white overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-500 bg-slate-100 flex items-center justify-center">
                {isProcessingImage ? (
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                ) : formData.avatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="" loading="lazy" />
                ) : (
                  <User size={64} className="text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-2 left-2 p-3 bg-[#006994] text-white rounded-2xl cursor-pointer hover:bg-[#4E8294] transition-all shadow-xl">
                <Camera size={20} className="text-[#00FFFF]" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} disabled={isProcessingImage} />
              </label>
            </div>
            <div className="flex-1 mb-4 text-center md:text-right">
               <h3 className="text-4xl font-black text-[#2B2B2E] tracking-tight mb-2">{formData.firstName} {formData.lastName}</h3>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{formData.role === 'Admin' ? 'רכז מערכת' : 'חבר נבחרת'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-10">
              <section>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <User size={14} /> פרטי התקשרות
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">שם פרטי</label>
                    <input type="text" value={formData.firstName || ''} onChange={e => handleFieldChange('firstName', e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">שם משפחה</label>
                    <input type="text" value={formData.lastName || ''} onChange={e => handleFieldChange('lastName', e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">טלפון נייד</label>
                    <div className="relative">
                      <Phone size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="tel" 
                        value={formData.mobile} 
                        onChange={handleMobileChange} 
                        className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">תאריך יום הולדת</label>
                    <div className="relative">
                      <Cake size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="date" 
                        value={formData.birthday || ''} 
                        onChange={e => handleFieldChange('birthday', e.target.value)} 
                        className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all cursor-pointer" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">מגדר</label>
                    <div className="relative">
                      <User size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <button 
                        type="button"
                        onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                        className="w-full pr-14 pl-12 py-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all flex items-center justify-between group"
                      >
                        <span>{formData.gender || 'בחר מגדר'}</span>
                        <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isGenderDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setIsGenderDropdownOpen(false)} />
                            <motion.div 
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                            >
                              {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => {
                                    handleFieldChange('gender', g);
                                    setIsGenderDropdownOpen(false);
                                  }}
                                  className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-indigo-50 ${
                                    formData.gender === g ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">כתובת מגורים (חובה)</label>
                    <div className="relative">
                      <Globe size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        ref={addressInputRef}
                        defaultValue={currentUser?.full_address || ''} 
                        onChange={(e) => {
                          setIsPlaceSelected(false);
                          setIsDirty(true);
                        }} 
                        placeholder="התחל להקליד: עיר, רחוב ומספר בית..."
                        className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all" 
                        required
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 pr-3 font-bold">חובה לבחור את הכתובת מתוך הרשימה שנפתחת כדי שנוכל לחשב מרחק מהמועדון.</p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <Sparkles size={14} /> נוכחות דיגיטלית
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SocialInput label="Instagram" value={formData.instagramUrl} onChange={(v: string) => handleFieldChange('instagramUrl', v)} icon={Instagram} brandColor="#E4405F" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל אינסטגרם" />
                  <SocialInput label="Facebook" value={formData.facebookUrl} onChange={(v: string) => handleFieldChange('facebookUrl', v)} icon={Facebook} brandColor="#1877F2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל פייסבוק" />
                  <SocialInput label="TikTok" value={formData.tiktokUrl} onChange={(v: string) => handleFieldChange('tiktokUrl', v)} icon={Music2} brandColor="#000000" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל טיקטוק" />
                  <SocialInput label="LinkedIn" value={formData.linkedinUrl} onChange={(v: string) => handleFieldChange('linkedinUrl', v)} icon={Linkedin} brandColor="#0A66C2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל לינקדאין" />
                  <SocialInput label="Twitter / X" value={formData.twitterUrl} onChange={(v: string) => handleFieldChange('twitterUrl', v)} icon={Twitter} brandColor="#1DA1F2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל טוויטר" />
                </div>
              </section>
            </div>

            <div className="lg:col-span-5">
               <div className="sticky top-24 space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">הסיפור שלי</label>
                    <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="text-[10px] font-black text-[#006994] flex items-center gap-1.5 hover:bg-[#40E0D0]/10 px-3 py-1.5 rounded-lg transition-all border border-[#006994]/10">
                      {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-[#00FFFF]" />} שדרג ביוגרפיה עם AI
                    </button>
                  </div>
                  <textarea 
                    value={formData.bio} 
                    onChange={e => handleFieldChange('bio', e.target.value)} 
                    className="w-full p-8 bg-slate-50 rounded-[3rem] font-bold h-[32rem] resize-none outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all text-lg leading-relaxed shadow-inner" 
                    placeholder="ספר קצת על עצמך, על הגלישה, על החיים..." 
                  />
               </div>
            </div>
          </div>

          <div className="mt-20 flex flex-col items-center gap-4">
             <button type="submit" disabled={isSaving || !isDirty} className="group relative px-20 py-6 bg-[#006994] text-white rounded-[2.5rem] font-black text-2xl hover:bg-[#4E8294] transition-all shadow-2xl shadow-[#006994]/20 disabled:opacity-20 active:scale-95 overflow-hidden">
               <span className="relative z-10 flex items-center gap-4">
                 {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="text-[#00FFFF]" />}
                 שמור שינויים
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-[#006994] to-[#4E8294] opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </button>
             
             <button 
               type="button" 
               onClick={() => setShowPasswordModal(true)}
               className="mt-4 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold transition-colors"
             >
               <Key size={16} />
               <span>החלפת סיסמה</span>
             </button>
          </div>
        </form>
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
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-[#2B2B2E] flex items-center gap-3">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">סיסמה חדשה</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100 focus:bg-white focus:border-indigo-200 transition-all"
                      placeholder="הזן סיסמה חדשה"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">אימות סיסמה</label>
                    <input 
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100 focus:bg-white focus:border-indigo-200 transition-all"
                      placeholder="הזן שוב את הסיסמה"
                      required
                      minLength={6}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
    </div>
  );
};

export default ProfilePage;
