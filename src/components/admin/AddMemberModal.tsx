import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Cake, ChevronDown, Globe, Sparkles, Loader2, Save, Camera, Check, HeartPulse, Search, UtensilsCrossed, Clock } from 'lucide-react';
import { Member, Gender } from '../../types';
import { DietaryPreferencesSection } from '../DietaryPreferencesSection';
import { AvailabilityPreferenceSection } from '../AvailabilityPreferenceSection';
import { processImage } from '../../utils/imageProcessor';
import { generateBio } from '../../services/geminiService';
import { hashPassword } from '../../utils/crypto';
import { validateMobileNumber, formatMobileNumber } from '../../utils/validation';
import { loadGoogleMaps, extractAddressData } from '../../utils/googlePlaces';

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

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, newMemberData, setNewMemberData, isSaving, setIsSaving, addMember }) => {
  const [isProcessingImage, setIsProcessingImage] = React.useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = React.useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);
  const [isCertDropdownOpen, setIsCertDropdownOpen] = React.useState(false);
  const [certSearch, setCertSearch] = React.useState('');
  const addressInputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError(null);
    if (!newMemberData.firstName || !newMemberData.lastName || !newMemberData.email) {
      setError('נא למלא שם פרטי, שם משפחה ואימייל לפחות');
      return;
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newMemberData.email)) {
      setError('נא להזין כתובת אימייל תקינה');
      return;
    }

    if (newMemberData.mobile && !validateMobileNumber(newMemberData.mobile)) {
      setError('נא להזין מספר טלפון נייד תקין');
      return;
    }

    setIsSaving(true);
    try {
      const normalizedEmail = (newMemberData.email || '').toLowerCase().trim();
      const finalPass = newMemberData.password || Math.random().toString(36).slice(-8);
      const hashed = await hashPassword(finalPass);
      
      await addMember({
        ...newMemberData as Member,
        email: normalizedEmail,
        password: hashed,
        isTemporary: true,
        joinedAt: new Date().toISOString()
      });
      
      alert(`משתמש נוסף בהצלחה! סיסמה: ${finalPass}`);
      onClose();
      setNewMemberData({
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
        instagramUrl: '',
        facebookUrl: '',
        linkedinUrl: '',
        twitterUrl: '',
        password: ''
      });
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || err;
      
      // Try to parse if it's a JSON string from handleFirestoreError
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error) {
          errorMessage = parsed.error;
        }
      } catch (e) {
        // Not a JSON string, use as is
      }
      
      setError(`שגיאה בהוספת משתמש: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
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

    if (isOpen) {
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
  }, [isOpen, setNewMemberData]);

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
            {/* Scrollable Container */}
            <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col">
              {/* Header */}
              <div className="p-6 flex items-center justify-between shrink-0">
                <h3 className="text-2xl font-black text-[#7A1555] tracking-tighter">הוספת משתמש חדש</h3>
                <button onClick={onClose} className="p-2 tangible-bevel-inset hover:bg-white/20 !rounded-full text-[#00426a] hover:text-[#7A1555] transition-all">
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 shrink-0">
                <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left Column: Avatar & Bio */}
                  <div className="lg:col-span-4 space-y-8 luxury-slab p-8">
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="w-48 h-48 luxury-card !rounded-full p-2 flex items-center justify-center overflow-hidden">
                          {newMemberData.avatar ? (
                            <img src={newMemberData.avatar} className="w-full h-full rounded-full object-cover" alt="Avatar" />
                          ) : (
                            <Camera size={48} className="text-white/20" />
                          )}
                        </div>
                        <label className="absolute bottom-2 right-2 w-12 h-12 bg-[#FF9F1C] rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-105 transition-all">
                          <Plus size={24} />
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
                      <p className="mt-4 text-[12px] font-black text-[#00426a] uppercase tracking-widest">תמונת פרופיל</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest">ביוגרפיה</label>
                        <button 
                          type="button" 
                          onClick={async () => {
                            if (!newMemberData.firstName) return;
                            setIsGeneratingBio(true);
                            try {
                              const bio = await generateBio(`${newMemberData.firstName} ${newMemberData.lastName}`, newMemberData.role || 'Member', newMemberData.bio || '');
                              setNewMemberData(prev => ({ ...prev, bio }));
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsGeneratingBio(false);
                            }
                          }}
                          className="px-6 luxury-card hover:bg-white/10 !rounded-full text-[#00AFC2] font-black transition-all flex items-center gap-2"
                        >
                          {isGeneratingBio ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                          ייצר
                        </button>
                      </div>
                      <textarea 
                        value={newMemberData.bio || ''}
                        onChange={e => setNewMemberData(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full p-6 luxury-card font-black text-sm outline-none transition-all text-[#000000] h-40 resize-none"
                        placeholder="כתוב ביוגרפיה קצרה..."
                      />
                    </div>
                  </div>

                  {/* Right Column: Fields */}
                  <div className="lg:col-span-8 space-y-10 luxury-slab p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">שם פרטי</label>
                        <input 
                          type="text" 
                          value={newMemberData.firstName} 
                          onChange={e => setNewMemberData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full p-5 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">שם משפחה</label>
                        <input 
                          type="text" 
                          value={newMemberData.lastName} 
                          onChange={e => setNewMemberData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full p-5 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">אימייל</label>
                        <input 
                          type="email" 
                          value={newMemberData.email} 
                          onChange={e => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full p-5 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">טלפון נייד</label>
                        <input 
                          type="tel" 
                          value={newMemberData.mobile || ''} 
                          onChange={e => setNewMemberData(prev => ({ ...prev, mobile: formatMobileNumber(e.target.value) }))}
                          className="w-full p-5 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000]" 
                          dir="ltr"
                          placeholder="05X-XXXXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">כתובת מגורים</label>
                        <input 
                          type="text" 
                          ref={addressInputRef}
                          value={newMemberData.full_address || ''} 
                          onChange={e => setNewMemberData(prev => ({ ...prev, full_address: e.target.value }))}
                          className="w-full p-5 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">תאריך לידה</label>
                        <div className="relative">
                          <Cake size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#00426a]" />
                          <input 
                            type="date" 
                            value={newMemberData.birthday || ''} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, birthday: e.target.value }))} 
                            className="w-full p-5 pr-12 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000] [color-scheme:light]" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">זהות</label>
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                            className="w-full p-5 luxury-card font-black text-sm outline-none transition-all flex items-center justify-between group hover:bg-white/80"
                          >
                            <span className="text-[#000000] text-right flex-1">{newMemberData.role === 'Admin' ? 'רכז' : newMemberData.role === 'Support' ? 'אפ-שייפר' : newMemberData.role === 'Instructor' ? 'מדריך' : newMemberData.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}</span>
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
                                  className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-md border border-white/30 !rounded-3xl shadow-2xl z-[170] overflow-hidden"
                                >
                                  {(['Member', 'Volunteer', 'Instructor', 'Admin', 'Support'] as const).map((r) => (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => {
                                        setNewMemberData(prev => ({ ...prev, role: r }));
                                        setIsRoleDropdownOpen(false);
                                      }}
                                      className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-white/50 ${
                                        newMemberData.role === r ? 'text-[#00426a] bg-white/50' : 'text-[#000000]'
                                      }`}
                                    >
                                      {r === 'Admin' ? 'רכז' : r === 'Support' ? 'אפ-שייפר' : r === 'Instructor' ? 'מדריך' : r === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">מגדר</label>
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                            className="w-full p-5 luxury-card font-black text-sm outline-none transition-all flex items-center justify-between group hover:bg-white/80"
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
                                  className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-md border border-white/30 !rounded-3xl shadow-2xl z-[170] overflow-hidden"
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
                                      className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-white/50 ${
                                        newMemberData.gender === g ? 'text-[#00426a] bg-white/50' : 'text-[#000000]'
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

                      <div className="md:col-span-2 space-y-4">
                        <label className="text-[12px] font-black text-[#00426a] uppercase tracking-widest pr-3">הכשרות והסמכות רלוונטיות</label>
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => setIsCertDropdownOpen(!isCertDropdownOpen)}
                            className="w-full p-5 luxury-card font-black text-sm outline-none transition-all flex items-center justify-between group hover:bg-white/80"
                          >
                            <span className="text-[#000000] text-right flex-1 truncate">
                              {newMemberData.certifications && newMemberData.certifications.length > 0 
                                ? newMemberData.certifications.join(', ') 
                                : 'בחר הכשרות והסמכות'}
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
                                  className="absolute top-full left-0 right-0 mt-2 bg-white/95 border border-white/30 !rounded-3xl shadow-2xl z-[170] overflow-hidden p-4 max-h-[400px] flex flex-col"
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

                                  <div className="grid grid-cols-1 gap-1 overflow-y-auto pr-1">
                                    {/* Show custom certifications that are already selected but not in the predefined list */}
                                    {newMemberData.certifications?.filter(c => !CERTIFICATION_OPTIONS.includes(c)).map((cert) => (
                                      <button
                                        key={cert}
                                        type="button"
                                        onClick={() => {
                                          const currentCerts = newMemberData.certifications || [];
                                          setNewMemberData(prev => ({ ...prev, certifications: currentCerts.filter(c => c !== cert) }));
                                        }}
                                        className="w-full px-4 py-3 text-right font-bold rounded-xl transition-all flex items-center justify-between text-[#00426a] bg-[#00426a]/5 hover:bg-[#00426a]/10"
                                      >
                                        <span className="truncate">{cert}</span>
                                        <Check size={16} />
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
                                          className={`w-full px-4 py-3 text-right font-black rounded-xl transition-all flex items-center justify-between hover:bg-slate-50 ${
                                            isSelected ? 'text-[#00426a] bg-white/50' : 'text-[#000000]'
                                          }`}
                                        >
                                          <span className="truncate">{cert}</span>
                                          {isSelected && <Check size={16} className="text-[#00426a]" />}
                                        </button>
                                      );
                                    })}

                                    {certSearch && !CERTIFICATION_OPTIONS.some(c => c.toLowerCase() === certSearch.toLowerCase()) && !newMemberData.certifications?.includes(certSearch) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const currentCerts = newMemberData.certifications || [];
                                          setNewMemberData(prev => ({ ...prev, certifications: [...currentCerts, certSearch] }));
                                          setCertSearch('');
                                        }}
                                        className="w-full px-4 py-3 text-right font-bold rounded-xl transition-all flex items-center justify-between text-[#00426a] hover:bg-[#00426a]/5 border border-dashed border-[#00426a]/20 mt-1"
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

                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[12px] font-black text-[#00426a] uppercase tracking-[0.3em] flex items-center gap-3">
                        <Clock size={14} /> זמינות לפעילויות
                      </h4>
                      <AvailabilityPreferenceSection
                        value={newMemberData.availabilitySchedule || 'always'}
                        onChange={(schedule) => setNewMemberData(prev => ({ ...prev, availabilitySchedule: schedule }))}
                      />
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[12px] font-black text-[#00426a] uppercase tracking-[0.3em] flex items-center gap-3">
                        <UtensilsCrossed size={14} /> תזונה
                      </h4>
                      <DietaryPreferencesSection
                        selectedPreferences={newMemberData.dietaryPreferences || []}
                        dietaryNotes={newMemberData.dietaryNotes || ''}
                        onChangePreferences={(prefs) => setNewMemberData(prev => ({ ...prev, dietaryPreferences: prefs }))}
                        onChangeNotes={(notes) => setNewMemberData(prev => ({ ...prev, dietaryNotes: notes }))}
                      />
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[12px] font-black text-[#00426a] uppercase tracking-[0.3em] flex items-center gap-3">
                        <HeartPulse size={14} /> מידע רפואי וחירום
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-3">איש קשר לחירום</label>
                          <input 
                            type="text" 
                            placeholder="שם מלא של איש הקשר" 
                            value={newMemberData.emergencyContactName || ''} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, emergencyContactName: e.target.value }))} 
                            className="w-full p-4 luxury-card font-black text-sm outline-none transition-all text-[#000000] placeholder:text-[#00426a]/40" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-3">טלפון חירום</label>
                          <input 
                            type="tel" 
                            placeholder="מספר טלפון לחירום" 
                            value={newMemberData.emergencyContactPhone || ''} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, emergencyContactPhone: formatMobileNumber(e.target.value) }))} 
                            className="w-full p-4 luxury-card font-black text-sm outline-none transition-all text-[#000000] placeholder:text-[#00426a]/40" 
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-3">מידע רפואי / רגישויות</label>
                          <textarea 
                            placeholder="פרט כאן רגישויות, פציעות עבר או מידע רפואי שחשוב שנדע..." 
                            value={newMemberData.medicalInfo || ''} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, medicalInfo: e.target.value }))} 
                            className="w-full p-4 luxury-card font-black text-sm outline-none transition-all text-[#000000] placeholder:text-[#00426a]/40 min-h-[100px] resize-none" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[12px] font-black text-[#00426a] uppercase tracking-[0.3em] flex items-center gap-3">
                        <Globe size={14} /> רשתות חברתיות
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-3">Instagram</label>
                          <input type="text" placeholder="קישור לפרופיל" value={newMemberData.instagramUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, instagramUrl: e.target.value }))} className="w-full p-4 luxury-card font-black text-sm outline-none transition-all text-[#000000] placeholder:text-[#00426a]/40" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-3">Facebook</label>
                          <input type="text" placeholder="קישור לפרופיל" value={newMemberData.facebookUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, facebookUrl: e.target.value }))} className="w-full p-4 luxury-card font-black text-sm outline-none transition-all text-[#000000] placeholder:text-[#00426a]/40" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-3">LinkedIn</label>
                          <input type="text" placeholder="קישור לפרופיל" value={newMemberData.linkedinUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, linkedinUrl: e.target.value }))} className="w-full p-4 luxury-card font-black text-sm outline-none transition-all text-[#000000] placeholder:text-[#00426a]/40" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#00426a] uppercase tracking-widest pr-3">X (Twitter)</label>
                          <input type="text" placeholder="קישור לפרופיל" value={newMemberData.twitterUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, twitterUrl: e.target.value }))} className="w-full p-4 luxury-card font-black text-sm outline-none transition-all text-[#000000] placeholder:text-[#00426a]/40" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Footer Actions */}
              <div className="p-6 flex flex-col items-center justify-end gap-4 shrink-0 mt-auto">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-black text-center mb-2 flex items-center justify-center gap-2"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {error}
                  </motion.div>
                )}
                <div className="flex flex-col md:flex-row items-center justify-end gap-4 w-full">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full md:w-auto px-12 py-4 bg-[#FF9F1C] text-white !rounded-full font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#FF9F1C]/20 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    שמור משתמש חדש
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full md:w-auto px-8 py-4 bg-white/20 hover:bg-white/40 !rounded-full text-[#00426a] font-black text-lg transition-all"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMemberModal;
