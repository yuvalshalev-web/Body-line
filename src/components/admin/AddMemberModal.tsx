import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Cake, ChevronDown, Globe, Sparkles, Loader2, Save, Camera } from 'lucide-react';
import { Member, Gender } from '../../types';
import { processImage } from '../../utils/imageProcessor';
import { generateBio } from '../../services/geminiService';
import { hashPassword } from '../../utils/crypto';
import { validateMobileNumber } from '../../utils/validation';
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

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, newMemberData, setNewMemberData, isSaving, setIsSaving, addMember }) => {
  const [isProcessingImage, setIsProcessingImage] = React.useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = React.useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = React.useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);
  const addressInputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<any>(null);

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
                <h3 className="text-2xl font-black text-[#7A1555] tracking-tighter">הוספת חבר חדש</h3>
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
                          value={newMemberData.mobile} 
                          onChange={e => setNewMemberData(prev => ({ ...prev, mobile: e.target.value }))}
                          className="w-full p-5 luxury-card font-black outline-none focus:bg-white/80 transition-all text-[#000000]" 
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
                            <span className="text-[#000000]">{newMemberData.role === 'Admin' ? 'רכז' : newMemberData.role === 'Instructor' ? 'מדריך' : 'חבר'}</span>
                            <ChevronDown size={18} className="text-[#00426a] transition-transform duration-300" />
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
                                  {(['Member', 'Instructor', 'Admin'] as const).map((r) => (
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
                                      {r === 'Admin' ? 'רכז' : r === 'Instructor' ? 'מדריך' : 'חבר'}
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
                            <span className="text-[#000000]">{newMemberData.gender || 'בחר/י מגדר'}</span>
                            <ChevronDown size={18} className="text-[#00426a] transition-transform duration-300" />
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
                                  {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as Gender[]).map((g) => (
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
              <div className="p-6 flex flex-col md:flex-row items-center justify-end gap-4 shrink-0 mt-auto">
              <button 
                onClick={async () => {
                  if (!newMemberData.firstName || !newMemberData.email) {
                    alert('נא למלא שם ואימייל לפחות');
                    return;
                  }
                  setIsSaving(true);
                  try {
                    const finalPass = newMemberData.password || Math.random().toString(36).slice(-8);
                    const hashed = await hashPassword(finalPass);
                    
                    await addMember({
                      ...newMemberData as Member,
                      password: hashed,
                      isTemporary: true,
                      joinedAt: new Date().toISOString()
                    });
                    
                    alert(`חבר נוסף בהצלחה! סיסמה: ${finalPass}`);
                    onClose();
                    setNewMemberData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      mobile: '',
                      avatar: '',
                      bio: '',
                      role: 'Member',
                      gender: 'מעדיף/ה לא לציין',
                      isActive: true,
                      birthday: '',
                      full_address: '',
                      instagramUrl: '',
                      facebookUrl: '',
                      linkedinUrl: '',
                      twitterUrl: '',
                      password: ''
                    });
                  } catch (err) {
                    console.error(err);
                    alert('שגיאה בהוספת חבר');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="w-full md:w-auto px-12 py-4 bg-[#FF9F1C] text-white !rounded-full font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#FF9F1C]/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                שמור חבר חדש
              </button>
              <button 
                onClick={onClose}
                className="w-full md:w-auto px-8 py-4 bg-white/20 hover:bg-white/40 !rounded-full text-[#00426a] font-black text-lg transition-all"
              >
                ביטול
              </button>
            </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMemberModal;
