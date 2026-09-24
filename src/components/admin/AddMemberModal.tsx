import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, Cake, ChevronDown, Globe, Sparkles, Loader2, Save, Camera, 
  Check, HeartPulse, Search, UtensilsCrossed, Clock, Eye, EyeOff, 
  Key, ShieldCheck, Copy, CheckCircle2, MessageCircle, AlertCircle, RefreshCw, UserPlus
} from 'lucide-react';
import { Member, Gender } from '../../types';
import { DietaryPreferencesSection } from '../DietaryPreferencesSection';
import { AvailabilityPreferenceSection } from '../AvailabilityPreferenceSection';
import { processImage } from '../../utils/imageProcessor';
import { generateBio } from '../../services/geminiService';
import { hashPassword } from '../../utils/crypto';
import { validateMobileNumber, formatMobileNumber } from '../../utils/validation';
import { loadGoogleMaps, extractAddressData } from '../../utils/googlePlaces';
import { useData } from '../../contexts/DataContext';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  newMemberData: Partial<Member>;
  setNewMemberData: React.Dispatch<React.SetStateAction<Partial<Member>>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  addMember: (member: Member) => Promise<void>;
}

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

// Helper to generate an easy-to-read yet strong random password
const generateRandomPassword = (): string => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

const initialMemberState: Partial<Member> = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  avatar: '',
  bio: '',
  role: 'Member',
  gender: 'מעדיפ/ה לא לציין',
  isActive: true,
  birthday: '',
  full_address: '',
  city: '',
  street_name: '',
  house_number: '',
  availabilitySchedule: 'always',
  dietaryPreferences: [],
  dietaryNotes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalInfo: '',
  instagramUrl: '',
  facebookUrl: '',
  linkedinUrl: '',
  twitterUrl: '',
  password: ''
};

const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  newMemberData, 
  setNewMemberData, 
  isSaving, 
  setIsSaving, 
  addMember 
}) => {
  const { members } = useData();
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  
  // Success modal state after creation
  const [createdUserSummary, setCreatedUserSummary] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    role: string;
    rawPassword: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCertDropdownOpen, setIsCertDropdownOpen] = useState(false);
  const [certSearch, setCertSearch] = useState('');
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFieldErrors({});
      setCreatedUserSummary(null);
      setCopiedPass(false);
      setCopiedAll(false);
      // Generate a default strong password if empty
      if (!newMemberData.password) {
        setNewMemberData(prev => ({ ...prev, password: generateRandomPassword() }));
      }
    }
  }, [isOpen]);

  const handleGeneratePassword = () => {
    const generated = generateRandomPassword();
    setNewMemberData(prev => ({ ...prev, password: generated }));
    setFieldErrors(prev => ({ ...prev, password: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const firstName = (newMemberData.firstName || '').trim();
    const lastName = (newMemberData.lastName || '').trim();
    const email = (newMemberData.email || '').trim().toLowerCase();
    const mobile = (newMemberData.mobile || '').trim();
    const password = (newMemberData.password || '').trim();

    if (!firstName || firstName.length < 2) {
      errors.firstName = 'יש להזין שם פרטי (לפחות 2 אותיות)';
    }

    if (!lastName || lastName.length < 2) {
      errors.lastName = 'יש להזין שם משפחה (לפחות 2 אותיות)';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      errors.email = 'יש להזין כתובת אימייל';
    } else if (!emailRegex.test(email)) {
      errors.email = 'כתובת אימייל אינה תקינה';
    } else if (members?.some(m => m.email?.toLowerCase().trim() === email)) {
      errors.email = 'אימייל זה כבר קיים אצל משתמש אחר במערכת';
    }

    if (!mobile) {
      errors.mobile = 'יש להזין מספר טלפון נייד';
    } else if (!validateMobileNumber(mobile)) {
      errors.mobile = 'מספר טלפון נייד לא תקין (לדוגמה: 050-1234567)';
    }

    if (!password) {
      errors.password = 'יש להגדיר סיסמה ראשונית למשתמש';
    } else if (password.length < 6) {
      errors.password = 'הסיסמה חייבת להכיל לפחות 6 תווים';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setError(firstError);
      return false;
    }

    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const rawPassword = (newMemberData.password || '').trim();
    const normalizedEmail = (newMemberData.email || '').toLowerCase().trim();
    const normalizedMobile = (newMemberData.mobile || '').trim();

    try {
      const hashed = await hashPassword(rawPassword);
      
      await addMember({
        ...newMemberData as Member,
        firstName: (newMemberData.firstName || '').trim(),
        lastName: (newMemberData.lastName || '').trim(),
        email: normalizedEmail,
        mobile: normalizedMobile,
        password: hashed,
        isTemporary: requirePasswordChange,
        joinedAt: new Date().toISOString()
      });
      
      // Successfully added - show rich confirmation view
      setCreatedUserSummary({
        firstName: (newMemberData.firstName || '').trim(),
        lastName: (newMemberData.lastName || '').trim(),
        email: normalizedEmail,
        mobile: normalizedMobile,
        role: newMemberData.role || 'Member',
        rawPassword: rawPassword
      });

    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || err;
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error) {
          errorMessage = parsed.error;
        }
      } catch (e) {
        // Not JSON
      }
      
      setError(`שגיאה בהוספת משתמש: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForNextUser = () => {
    setNewMemberData({
      ...initialMemberState,
      password: generateRandomPassword()
    });
    setCreatedUserSummary(null);
    setError(null);
    setFieldErrors({});
    setCopiedPass(false);
    setCopiedAll(false);
  };

  const handleCopyPassword = () => {
    if (createdUserSummary?.rawPassword) {
      navigator.clipboard.writeText(createdUserSummary.rawPassword);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2500);
    }
  };

  const handleCopyAllDetails = () => {
    if (createdUserSummary) {
      const roleName = createdUserSummary.role === 'Admin' ? 'רכז' : createdUserSummary.role === 'Staff' ? 'צוות עמותה' : createdUserSummary.role === 'Instructor' ? 'מדריך' : createdUserSummary.role === 'Volunteer' ? 'מתנדב' : 'משתתף';
      const text = `🌊 פרטי התחברות למערכת הגלישה:\nשם: ${createdUserSummary.firstName} ${createdUserSummary.lastName}\nתפקיד: ${roleName}\nאימייל לכניסה: ${createdUserSummary.email}\nסיסמה ראשונית: ${createdUserSummary.rawPassword}\nקישור לכניסה: ${window.location.origin}`;
      navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const getWhatsAppLink = () => {
    if (!createdUserSummary) return '#';
    const cleanPhone = createdUserSummary.mobile.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.slice(1) : cleanPhone;
    const msg = encodeURIComponent(
      `שלום ${createdUserSummary.firstName}! 🌊\nנוצר עבורך פרופיל חדש במערכת "חבל זוג".\n\n📌 פרטי ההתחברות שלך:\n📧 אימייל: ${createdUserSummary.email}\n🔑 סיסמה ראשונית: ${createdUserSummary.rawPassword}\n🌐 קישור לכניסה: ${window.location.origin}\n\nנשמח לראותך במים! 🏄‍♂️`
    );
    return `https://wa.me/${intlPhone}?text=${msg}`;
  };

  // Google Maps Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      if (addressInputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
        try {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            componentRestrictions: { country: "il" },
            fields: ["address_components", "geometry", "formatted_address"]
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            
            if (place.formatted_address) {
              const addressData = extractAddressData(place);

              setNewMemberData(prev => ({ 
                ...prev, 
                full_address: addressData.formatted,
                city: addressData.city,
                street_name: addressData.street,
                house_number: addressData.houseNum,
                country: addressData.country,
                lat: addressData.lat,
                lng: addressData.lng
              }));
            }
          });
        } catch (e) {
          console.error("Failed to initialize Autocomplete:", e);
        }
      }
    };

    if (isOpen && !createdUserSummary) {
      loadGoogleMaps()
        .then(initAutocomplete)
        .catch(err => {
          console.warn("Google Maps loading failed:", err.message);
        });
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isOpen, createdUserSummary, setNewMemberData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-12 modal-overlay animate-in fade-in luxury-bg" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="luxury-slab w-full max-w-7xl h-full md:h-auto md:max-h-[90vh] overflow-hidden relative flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {/* If user was created, show SUCCESS SCREEN */}
            {createdUserSummary ? (
              <div className="p-8 md:p-12 flex flex-col items-center text-center justify-center max-w-2xl mx-auto space-y-6 my-auto">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 size={44} className="animate-in zoom-in-50 duration-300" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-[#00426a] tracking-tight">המשתמש נוסף בהצלחה!</h3>
                  <p className="text-sm font-bold text-[#00426a]/70">
                    הפרופיל של <span className="text-[#00426a] font-black">{createdUserSummary.firstName} {createdUserSummary.lastName}</span> מוכן לשימוש.
                  </p>
                </div>

                {/* Account Credentials Card */}
                <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 p-6 shadow-xl space-y-4 text-right">
                  <div className="text-xs font-black uppercase text-[#00426a]/60 tracking-widest pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>פרטי התחברות לחשבון</span>
                    <span className="text-xs px-2.5 py-0.5 bg-[#FF9F1C]/20 text-[#d97706] rounded-full font-black">
                      {createdUserSummary.role === 'Admin' ? 'רכז' : createdUserSummary.role === 'Staff' ? 'צוות עמותה' : createdUserSummary.role === 'Instructor' ? 'מדריך' : createdUserSummary.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-bold text-[#00426a]/60">אימייל להתחברות</div>
                      <div className="font-black text-sm text-[#000000] dir-ltr text-right select-all">{createdUserSummary.email}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#00426a]/60">טלפון נייד</div>
                      <div className="font-black text-sm text-[#000000] dir-ltr text-right">{createdUserSummary.mobile}</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-[#00426a]/60 mb-1">סיסמה שהוגדרה למשתמש</div>
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <Key size={16} className="text-[#FF9F1C] shrink-0" />
                      <span className="font-mono font-black text-base text-[#00426a] flex-1 text-center tracking-wider select-all">
                        {createdUserSummary.rawPassword}
                      </span>
                      <button 
                        onClick={handleCopyPassword}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-black text-[#00426a] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        {copiedPass ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copiedPass ? 'הועתק!' : 'העתק'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
                  <a 
                    href={getWhatsAppLink()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 py-3.5 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <MessageCircle size={18} />
                    שלח פרטי התחברות בוואטסאפ
                  </a>

                  <button 
                    onClick={handleCopyAllDetails}
                    className="flex-1 py-3.5 px-6 bg-white hover:bg-slate-50 border border-slate-200 text-[#00426a] rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    {copiedAll ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                    {copiedAll ? 'כל הפרטים הועתקו!' : 'העתק את כל הפרטים'}
                  </button>
                </div>

                <div className="w-full flex items-center justify-between pt-4 border-t border-slate-200/50">
                  <button 
                    onClick={handleResetForNextUser}
                    className="px-6 py-2.5 bg-[#FF9F1C] hover:bg-[#e08b17] text-white rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-md"
                  >
                    <UserPlus size={16} />
                    הוסף משתמש נוסף
                  </button>
                  <button 
                    onClick={onClose}
                    className="px-6 py-2.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl font-black text-sm transition-all"
                  >
                    סיום וסגירה
                  </button>
                </div>
              </div>
            ) : (
              /* FORM SCROLLABLE CONTAINER */
              <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col">
                {/* Header */}
                <div className="p-6 flex items-center justify-between shrink-0 border-b border-black/5 bg-white/40">
                  <div>
                    <h3 className="text-2xl font-black text-[#7A1555] tracking-tighter">הוספת משתמש חדש</h3>
                    <p className="text-xs font-bold text-[#00426a]/60">הזן את פרטי המשתמש וקבע סיסמה ראשונית לחשבון</p>
                  </div>
                  <button onClick={onClose} className="p-2 tangible-bevel-inset hover:bg-white/20 !rounded-full text-[#00426a] hover:text-[#7A1555] transition-all">
                    <X size={24} />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 shrink-0">
                  <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column: Avatar & Bio */}
                      <div className="lg:col-span-4 space-y-6 luxury-slab p-6">
                        <div className="flex flex-col items-center">
                          <div className="relative group">
                            <div className="w-40 h-40 luxury-card !rounded-full p-2 flex items-center justify-center overflow-hidden border-2 border-white/40">
                              {newMemberData.avatar ? (
                                <img src={newMemberData.avatar} className="w-full h-full rounded-full object-cover" alt="Avatar" />
                              ) : (
                                <Camera size={40} className="text-[#00426a]/30" />
                              )}
                            </div>
                            <label className="absolute bottom-1 right-1 w-11 h-11 bg-[#FF9F1C] rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-105 transition-all">
                              <Plus size={22} />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setIsProcessingImage(true);
                                    try {
                                      const { dataUrl } = await processImage(file, 600, 0.8);
                                      setNewMemberData(prev => ({ ...prev, avatar: dataUrl }));
                                    } catch (err) {
                                      console.error(err);
                                    } finally {
                                      setIsProcessingImage(false);
                                    }
                                  }
                                }} 
                              />
                            </label>
                          </div>
                          <p className="mt-3 text-[11px] font-black text-[#00426a] uppercase tracking-widest">
                            {isProcessingImage ? 'מעבד תמונה...' : 'תמונת פרופיל'}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest">ביוגרפיה</label>
                            <button 
                              type="button" 
                              onClick={async () => {
                                if (!newMemberData.firstName) return;
                                setIsGeneratingBio(true);
                                try {
                                  const bio = await generateBio(`${newMemberData.firstName} ${newMemberData.lastName || ''}`, newMemberData.role || 'Member', newMemberData.bio || '');
                                  setNewMemberData(prev => ({ ...prev, bio }));
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsGeneratingBio(false);
                                }
                              }}
                              className="px-4 py-1.5 luxury-card hover:bg-white/10 !rounded-full text-[#00AFC2] font-black text-xs transition-all flex items-center gap-1.5"
                            >
                              {isGeneratingBio ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                              חולל AI
                            </button>
                          </div>
                          <textarea 
                            value={newMemberData.bio || ''}
                            onChange={e => setNewMemberData(prev => ({ ...prev, bio: e.target.value }))}
                            className="w-full p-4 luxury-card font-bold text-sm outline-none transition-all text-[#000000] h-32 resize-none"
                            placeholder="כתוב ביוגרפיה קצרה..."
                          />
                        </div>
                      </div>

                      {/* Right Column: Fields */}
                      <div className="lg:col-span-8 space-y-8 luxury-slab p-6 md:p-8">
                        
                        {/* SECTION: MANDATORY DETAILS */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-black/5 pb-2">
                            <h4 className="text-xs font-black text-[#7A1555] uppercase tracking-widest flex items-center gap-2">
                              <ShieldCheck size={16} />
                              פרטי חובה וכניסה לחשבון
                            </h4>
                            <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              * כל השדות בחלק זה הינם שדות חובה
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* First Name */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2 flex items-center justify-between">
                                <span>שם פרטי *</span>
                                {fieldErrors.firstName && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.firstName}</span>}
                              </label>
                              <input 
                                type="text" 
                                placeholder="לדוגמה: ליאור"
                                value={newMemberData.firstName || ''} 
                                onChange={e => {
                                  setNewMemberData(prev => ({ ...prev, firstName: e.target.value }));
                                  if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: '' }));
                                }}
                                className={`w-full p-4 luxury-card font-black outline-none transition-all text-[#000000] ${
                                  fieldErrors.firstName ? 'border-2 border-rose-400 bg-rose-50/30' : 'focus:bg-white/90'
                                }`} 
                              />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2 flex items-center justify-between">
                                <span>שם משפחה *</span>
                                {fieldErrors.lastName && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.lastName}</span>}
                              </label>
                              <input 
                                type="text" 
                                placeholder="לדוגמה: רז"
                                value={newMemberData.lastName || ''} 
                                onChange={e => {
                                  setNewMemberData(prev => ({ ...prev, lastName: e.target.value }));
                                  if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: '' }));
                                }}
                                className={`w-full p-4 luxury-card font-black outline-none transition-all text-[#000000] ${
                                  fieldErrors.lastName ? 'border-2 border-rose-400 bg-rose-50/30' : 'focus:bg-white/90'
                                }`} 
                              />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2 flex items-center justify-between">
                                <span>כתובת אימייל *</span>
                                {fieldErrors.email && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.email}</span>}
                              </label>
                              <input 
                                type="email" 
                                dir="ltr"
                                placeholder="user@example.com"
                                value={newMemberData.email || ''} 
                                onChange={e => {
                                  setNewMemberData(prev => ({ ...prev, email: e.target.value }));
                                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                                }}
                                className={`w-full p-4 luxury-card font-black outline-none transition-all text-[#000000] ${
                                  fieldErrors.email ? 'border-2 border-rose-400 bg-rose-50/30' : 'focus:bg-white/90'
                                }`} 
                              />
                            </div>

                            {/* Mobile Phone */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2 flex items-center justify-between">
                                <span>טלפון נייד *</span>
                                {fieldErrors.mobile && <span className="text-[10px] text-rose-600 font-bold">{fieldErrors.mobile}</span>}
                              </label>
                              <input 
                                type="tel" 
                                value={newMemberData.mobile || ''} 
                                onChange={e => {
                                  setNewMemberData(prev => ({ ...prev, mobile: formatMobileNumber(e.target.value) }));
                                  if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: '' }));
                                }}
                                className={`w-full p-4 luxury-card font-black outline-none transition-all text-[#000000] ${
                                  fieldErrors.mobile ? 'border-2 border-rose-400 bg-rose-50/30' : 'focus:bg-white/90'
                                }`} 
                                dir="ltr"
                                placeholder="050-1234567"
                              />
                            </div>

                            {/* Password Field */}
                            <div className="md:col-span-2 space-y-1.5 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest flex items-center gap-1.5">
                                  <Key size={14} className="text-[#FF9F1C]" />
                                  <span>סיסמה ראשונית למשתמש *</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={handleGeneratePassword}
                                  className="text-xs font-black text-[#FF9F1C] hover:text-[#d97706] flex items-center gap-1 transition-all"
                                >
                                  <RefreshCw size={12} />
                                  חולל סיסמה אקראית
                                </button>
                              </div>

                              <div className="relative flex items-center">
                                <input 
                                  type={showPassword ? 'text' : 'password'}
                                  dir="ltr"
                                  placeholder="מינימום 6 תווים"
                                  value={newMemberData.password || ''} 
                                  onChange={e => {
                                    setNewMemberData(prev => ({ ...prev, password: e.target.value }));
                                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                                  }}
                                  className={`w-full p-3.5 pl-12 pr-4 bg-white rounded-xl font-mono font-black text-sm text-[#00426a] outline-none border transition-all shadow-sm ${
                                    fieldErrors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#FF9F1C]'
                                  }`} 
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute left-3 p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                                  title={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                                >
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>

                              {fieldErrors.password && (
                                <p className="text-[11px] text-rose-600 font-bold pr-1">{fieldErrors.password}</p>
                              )}

                              <div className="flex items-center gap-2 pt-1">
                                <input 
                                  type="checkbox"
                                  id="requirePasswordChange"
                                  checked={requirePasswordChange}
                                  onChange={e => setRequirePasswordChange(e.target.checked)}
                                  className="w-4 h-4 rounded text-[#FF9F1C] focus:ring-[#FF9F1C] cursor-pointer"
                                />
                                <label htmlFor="requirePasswordChange" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                  דרוש מהמשתמש להחליף סיסמה בהתחברות הראשונה
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION: GENERAL DETAILS */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-xs font-black text-[#00426a] uppercase tracking-widest border-b border-black/5 pb-2">
                            פרטים כלליים ותפקיד
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Role Dropdown */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2">תפקיד במערכת</label>
                              <div className="relative">
                                <button 
                                  type="button"
                                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                                  className="w-full p-4 luxury-card font-black text-sm outline-none transition-all flex items-center justify-between group hover:bg-white/80"
                                >
                                  <span className="text-[#000000] text-right flex-1">
                                    {newMemberData.role === 'Admin' ? 'רכז' : newMemberData.role === 'Staff' ? 'צוות עמותה' : newMemberData.role === 'Support' ? 'אפ-שייפר' : newMemberData.role === 'Instructor' ? 'מדריך' : newMemberData.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                                  </span>
                                  <ChevronDown size={18} className={`text-[#00426a] transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                  {isRoleDropdownOpen && (
                                    <>
                                      <div className="fixed inset-0 z-[160]" onClick={() => setIsRoleDropdownOpen(false)} />
                                      <motion.div 
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/30 !rounded-2xl shadow-2xl z-[170] overflow-hidden"
                                      >
                                        {(['Member', 'Volunteer', 'Instructor', 'Admin', 'Support', 'Staff'] as const).map((r) => (
                                          <button
                                            key={r}
                                            type="button"
                                            onClick={() => {
                                              setNewMemberData(prev => ({ ...prev, role: r }));
                                              setIsRoleDropdownOpen(false);
                                            }}
                                            className={`w-full px-5 py-3 text-right font-black transition-all hover:bg-slate-100 ${
                                              newMemberData.role === r ? 'text-[#00426a] bg-slate-100/80 font-black' : 'text-[#000000]'
                                            }`}
                                          >
                                            {r === 'Admin' ? 'רכז' : r === 'Staff' ? 'צוות עמותה' : r === 'Support' ? 'אפ-שייפר' : r === 'Instructor' ? 'מדריך' : r === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                                          </button>
                                        ))}
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Gender Dropdown */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2">מגדר</label>
                              <div className="relative">
                                <button 
                                  type="button"
                                  onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                                  className="w-full p-4 luxury-card font-black text-sm outline-none transition-all flex items-center justify-between group hover:bg-white/80"
                                >
                                  <span className="text-[#000000] text-right flex-1">{newMemberData.gender || 'בחר/י מגדר'}</span>
                                  <ChevronDown size={18} className={`text-[#00426a] transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                  {isGenderDropdownOpen && (
                                    <>
                                      <div className="fixed inset-0 z-[160]" onClick={() => setIsGenderDropdownOpen(false)} />
                                      <motion.div 
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/30 !rounded-2xl shadow-2xl z-[170] overflow-hidden"
                                      >
                                        {([
                                          'זכר', 
                                          'נקבה', 
                                          'לא בינארי', 
                                          'מעדיפ/ה לא לציין'
                                        ] as Gender[]).map((g) => (
                                          <button
                                            key={g}
                                            type="button"
                                            onClick={() => {
                                              setNewMemberData(prev => ({ ...prev, gender: g }));
                                              setIsGenderDropdownOpen(false);
                                            }}
                                            className={`w-full px-5 py-3 text-right font-black transition-all hover:bg-slate-100 ${
                                              newMemberData.gender === g ? 'text-[#00426a] bg-slate-100/80 font-black' : 'text-[#000000]'
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

                            {/* Address */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2">כתובת מגורים</label>
                              <input 
                                type="text" 
                                ref={addressInputRef}
                                placeholder="הזן עיר או רחוב"
                                value={newMemberData.full_address || ''} 
                                onChange={e => setNewMemberData(prev => ({ ...prev, full_address: e.target.value }))}
                                className="w-full p-4 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000]" 
                              />
                            </div>

                            {/* Birthday */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2">תאריך לידה</label>
                              <div className="relative">
                                <Cake size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00426a]" />
                                <input 
                                  type="date" 
                                  value={newMemberData.birthday || ''} 
                                  onChange={e => setNewMemberData(prev => ({ ...prev, birthday: e.target.value }))} 
                                  className="w-full p-4 pr-11 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000] [color-scheme:light]" 
                                />
                              </div>
                            </div>

                            {/* Certifications */}
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[11px] font-black text-[#00426a] uppercase tracking-widest pr-2">הכשרות והסמכות רלוונטיות</label>
                              <div className="relative">
                                <button 
                                  type="button"
                                  onClick={() => setIsCertDropdownOpen(!isCertDropdownOpen)}
                                  className="w-full p-4 luxury-card font-black text-sm outline-none transition-all flex items-center justify-between group hover:bg-white/80"
                                >
                                  <span className="text-[#000000] text-right flex-1 truncate">
                                    {newMemberData.certifications && newMemberData.certifications.length > 0 
                                      ? newMemberData.certifications.join(', ') 
                                      : 'בחר הכשרות והסמכות (הדרכה, רפואה, הצלה...)'}
                                  </span>
                                  <ChevronDown size={18} className={`text-[#00426a] transition-transform duration-300 ${isCertDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                  {isCertDropdownOpen && (
                                    <>
                                      <div className="fixed inset-0 z-[160]" onClick={() => setIsCertDropdownOpen(false)} />
                                      <motion.div 
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white/95 border border-white/30 !rounded-2xl shadow-2xl z-[170] overflow-hidden p-4 max-h-[350px] flex flex-col"
                                      >
                                        <div className="p-1 border-b border-slate-100 mb-2">
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

                                        <div className="grid grid-cols-1 gap-1 overflow-y-auto pr-1">
                                          {newMemberData.certifications?.filter(c => !CERTIFICATION_OPTIONS.includes(c)).map((cert) => (
                                            <button
                                              key={cert}
                                              type="button"
                                              onClick={() => {
                                                const currentCerts = newMemberData.certifications || [];
                                                setNewMemberData(prev => ({ ...prev, certifications: currentCerts.filter(c => c !== cert) }));
                                              }}
                                              className="w-full px-4 py-2.5 text-right font-bold rounded-xl transition-all flex items-center justify-between text-[#00426a] bg-[#00426a]/5 hover:bg-[#00426a]/10 text-xs"
                                            >
                                              <span className="truncate">{cert}</span>
                                              <Check size={14} />
                                            </button>
                                          ))}

                                          {CERTIFICATION_OPTIONS.filter(cert => 
                                            cert.toLowerCase().includes(certSearch.toLowerCase())
                                          ).map((cert) => {
                                            const isSelected = newMemberData.certifications?.includes(cert);
                                            return (
                                              <button
                                                key={cert}
                                                type="button"
                                                onClick={() => {
                                                  const currentCerts = newMemberData.certifications || [];
                                                  const newCerts = isSelected 
                                                    ? currentCerts.filter(c => c !== cert)
                                                    : [...currentCerts, cert];
                                                  setNewMemberData(prev => ({ ...prev, certifications: newCerts }));
                                                }}
                                                className={`w-full px-4 py-2.5 text-right font-bold rounded-xl transition-all flex items-center justify-between hover:bg-slate-50 text-xs ${
                                                  isSelected ? 'text-[#00426a] bg-slate-100 font-black' : 'text-[#000000]'
                                                }`}
                                              >
                                                <span className="truncate">{cert}</span>
                                                {isSelected && <Check size={14} className="text-[#00426a]" />}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION: AVAILABILITY & DIET */}
                        <div className="space-y-6 pt-2">
                          <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#00426a] uppercase tracking-[0.2em] flex items-center gap-2">
                              <Clock size={14} /> זמינות לפעילויות
                            </h4>
                            <AvailabilityPreferenceSection
                              value={newMemberData.availabilitySchedule || 'always'}
                              onChange={(schedule) => setNewMemberData(prev => ({ ...prev, availabilitySchedule: schedule }))}
                            />
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#00426a] uppercase tracking-[0.2em] flex items-center gap-2">
                              <UtensilsCrossed size={14} /> העדפות תזונה
                            </h4>
                            <DietaryPreferencesSection
                              selectedPreferences={newMemberData.dietaryPreferences || []}
                              dietaryNotes={newMemberData.dietaryNotes || ''}
                              onChangePreferences={(prefs) => setNewMemberData(prev => ({ ...prev, dietaryPreferences: prefs }))}
                              onChangeNotes={(notes) => setNewMemberData(prev => ({ ...prev, dietaryNotes: notes }))}
                            />
                          </div>
                        </div>

                        {/* SECTION: MEDICAL & EMERGENCY */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-[11px] font-black text-[#00426a] uppercase tracking-[0.2em] flex items-center gap-2 border-b border-black/5 pb-2">
                            <HeartPulse size={14} /> מידע רפואי ואיש קשר לחירום
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-2">איש קשר לחירום</label>
                              <input 
                                type="text" 
                                placeholder="שם מלא" 
                                value={newMemberData.emergencyContactName || ''} 
                                onChange={e => setNewMemberData(prev => ({ ...prev, emergencyContactName: e.target.value }))} 
                                className="w-full p-3.5 luxury-card font-bold text-sm outline-none transition-all text-[#000000]" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-2">טלפון חירום</label>
                              <input 
                                type="tel" 
                                placeholder="050-XXXXXXX" 
                                value={newMemberData.emergencyContactPhone || ''} 
                                onChange={e => setNewMemberData(prev => ({ ...prev, emergencyContactPhone: formatMobileNumber(e.target.value) }))} 
                                className="w-full p-3.5 luxury-card font-bold text-sm outline-none transition-all text-[#000000]" 
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-2">מידע רפואי / רגישויות</label>
                              <textarea 
                                placeholder="פרט כאן רגישויות, פציעות עבר או מידע רפואי שחשוב שנדע..." 
                                value={newMemberData.medicalInfo || ''} 
                                onChange={e => setNewMemberData(prev => ({ ...prev, medicalInfo: e.target.value }))} 
                                className="w-full p-3.5 luxury-card font-bold text-sm outline-none transition-all text-[#000000] min-h-[80px] resize-none" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* SECTION: SOCIAL NETWORKS */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-[11px] font-black text-[#00426a] uppercase tracking-[0.2em] flex items-center gap-2 border-b border-black/5 pb-2">
                            <Globe size={14} /> רשתות חברתיות
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-2">Instagram</label>
                              <input type="text" placeholder="קישור או כינוי" value={newMemberData.instagramUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, instagramUrl: e.target.value }))} className="w-full p-3.5 luxury-card font-bold text-sm outline-none text-[#000000]" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-2">Facebook</label>
                              <input type="text" placeholder="קישור או כינוי" value={newMemberData.facebookUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, facebookUrl: e.target.value }))} className="w-full p-3.5 luxury-card font-bold text-sm outline-none text-[#000000]" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-2">LinkedIn</label>
                              <input type="text" placeholder="קישור לפרופיל" value={newMemberData.linkedinUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, linkedinUrl: e.target.value }))} className="w-full p-3.5 luxury-card font-bold text-sm outline-none text-[#000000]" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-2">X (Twitter)</label>
                              <input type="text" placeholder="קישור לפרופיל" value={newMemberData.twitterUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, twitterUrl: e.target.value }))} className="w-full p-3.5 luxury-card font-bold text-sm outline-none text-[#000000]" />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 flex flex-col items-center justify-end gap-3 shrink-0 mt-auto border-t border-black/5 bg-white/40">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full max-w-xl p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-black text-center flex items-center justify-center gap-2 shadow-sm"
                    >
                      <AlertCircle size={18} className="shrink-0 text-rose-600" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  <div className="flex flex-col md:flex-row items-center justify-end gap-3 w-full">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full md:w-auto px-10 py-3.5 bg-[#FF9F1C] hover:bg-[#e08b17] text-white !rounded-full font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-[#FF9F1C]/25 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      <span>שמור משתמש חדש</span>
                    </button>
                    <button 
                      onClick={onClose}
                      className="w-full md:w-auto px-7 py-3.5 bg-white/30 hover:bg-white/60 !rounded-full text-[#00426a] font-black text-base transition-all cursor-pointer"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMemberModal;
