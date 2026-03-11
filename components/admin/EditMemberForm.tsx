
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Camera, UserCircle, ChevronLeft, Save, Archive, Loader2, Cake, Phone, Mail, 
  ChevronDown, Instagram, Facebook, Music2, Linkedin, Twitter, Globe, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member } from '../../types';
import { processImage } from '../../utils/imageProcessor';
import { validateMobileNumber, formatMobileNumber } from '../../utils/validation';
import { useModal } from '../../contexts/ModalContext';
import { SUPER_ADMIN_EMAIL } from '../../constants';
import { hashPassword } from '../../utils/crypto';
import { updateMemberAddress } from '../../utils/googlePlaces';

interface EditMemberFormProps {
  member: Member;
  isSuperAdmin: boolean;
  onSave: (updatedMember: Member) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onClose: () => void;
}

const EditMemberForm: React.FC<EditMemberFormProps> = ({ member, isSuperAdmin, onSave, onArchive, onClose }) => {
  const { showSuccess, showError, showConfirm } = useModal();
  const [editingMember, setEditingMember] = useState<Member>(member);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [showRoleWarning, setShowRoleWarning] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPlaceSelected, setIsPlaceSelected] = useState(!!member.full_address);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

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
          
          updateMemberAddress(editingMember.id, place).then(addressData => {
            setEditingMember(prev => ({ ...prev, ...addressData }));
            showSuccess('הכתובת עודכנה בהצלחה!');
          }).catch(err => {
            console.error(err);
            showError('שגיאה בעדכון הכתובת');
          });
        });
      }
    };

    // Global error handler for Google Maps API
    (window as any).gm_authFailure = () => {
      console.error("Google Maps API authentication/authorization failed.");
      showError('שגיאת הרשאות במפות גוגל. יש לוודא שה-Places API וה-Maps JavaScript API מופעלים ב-Google Cloud.');
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
  }, [editingMember.id]);

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http')) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSave = async () => {
    if (editingMember.mobile && !validateMobileNumber(editingMember.mobile)) {
      showError('מספר טלפון נייד לא תקין');
      return;
    }

    if (!isPlaceSelected && addressInputRef.current?.value) {
      showError('יש לבחור כתובת מתוך רשימת ההצעות של גוגל בלבד');
      addressInputRef.current?.focus();
      return;
    }

    setIsProcessing(true);
    try {
      await onSave(editingMember);
      showSuccess('השינויים נשמרו בהצלחה');
      onClose();
    } catch (err) {
      console.error("Error saving member:", err);
      showError('שגיאה בשמירת הנתונים');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      showError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showError('הסיסמאות אינן תואמות');
      return;
    }

    setIsChangingPassword(true);
    try {
      const hashed = await hashPassword(newPassword);
      const updatedMember = { ...editingMember, password: hashed };
      setEditingMember(updatedMember);
      await onSave(updatedMember);
      showSuccess('הסיסמה שונתה בהצלחה');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      showError('שגיאה בשינוי הסיסמה');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="glass-panel border border-white/30 rounded-[4rem] p-8 md:p-12 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden backdrop-blur-3xl">
      {/* Background Decorative Elements - Surfers Theme Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-[#00D9E6]/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2D60]/5 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[#FFDE45]/10 rounded-full blur-[100px]" />
      </div>

      {/* Header Stack */}
      <div className="flex flex-col items-center text-center mb-16 space-y-6">
        <button 
          onClick={onClose}
          className="absolute top-10 right-10 flex items-center gap-2 text-slate-400 hover:text-[#00AFC2] font-black transition-all group z-20"
        >
          <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-sm uppercase tracking-widest">חזרה</span>
        </button>

        <div className="glass-panel border border-white/40 px-6 py-2 rounded-full inline-flex items-center gap-3 text-[11px] font-black text-[#007085] tracking-[0.3em] uppercase shadow-inner bg-white/30 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-[#FF2D60] animate-ping" />
          <span>USER PROFILE</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-[#1e293b] uppercase tracking-tighter leading-none">
          עריכת משתמש
        </h1>

        <div className="w-24 h-1.5 bg-gradient-to-r from-[#00D9E6] via-[#FF2D60] to-[#FFDE45] rounded-full" />

        <p className="text-slate-500 font-bold max-w-2xl text-lg leading-relaxed">
          ניהול הרשאות, פרטי קשר ונוכחות דיגיטלית של חבר הנבחרת 👤
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Avatar Section */}
        <div className="md:col-span-2 flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#00D9E6] via-[#FF2D60] to-[#FFDE45] rounded-[3.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            {editingMember.avatar ? (
              <img src={editingMember.avatar} className="w-48 h-48 rounded-[3rem] object-cover shadow-2xl border-8 border-white/80 relative z-10" alt="" />
            ) : (
              <div className="w-48 h-48 rounded-[3rem] glass-panel flex items-center justify-center text-[#00AFC2]/40 shadow-inner border-8 border-white/40 relative z-10">
                <UserCircle size={100} strokeWidth={1} />
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-all duration-500 cursor-pointer backdrop-blur-md z-20">
              <div className="bg-white/20 p-4 rounded-full border border-white/40 shadow-lg">
                <Camera className="text-white" size={36} />
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const processed = await processImage(file);
                    setEditingMember({ ...editingMember, avatar: processed.dataUrl });
                  }
                }}
              />
            </label>
          </div>
          <p className="mt-6 text-[11px] font-black text-[#007085] uppercase tracking-[0.3em] bg-white/40 px-4 py-1.5 rounded-full border border-white/60 shadow-sm">לחץ לשינוי תמונה</p>
          
          {/* Role Management */}
          <div className="mt-16 w-full max-w-lg space-y-8">
            <div className="flex flex-col items-center gap-6">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">סטטוס תפקיד במערכת</label>
              
              <div 
                className="relative w-full p-1.5 glass-panel rounded-[2rem] border border-white/40 flex items-center overflow-hidden shadow-xl bg-white/20 backdrop-blur-2xl"
                onMouseEnter={() => setShowRoleWarning(true)}
                onMouseLeave={() => setShowRoleWarning(false)}
              >
                <motion.div
                  className="absolute top-1.5 bottom-1.5 rounded-[1.5rem] bg-gradient-to-br from-[#00AFC2] to-[#007085] shadow-[0_10px_20px_-5px_rgba(0,175,194,0.5)] z-0"
                  initial={false}
                  animate={{
                    right: editingMember.role === 'Member' ? '0%' : editingMember.role === 'Instructor' ? '33.33%' : '66.66%',
                    width: '33.33%'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
                
                {[
                  { id: 'Member', label: 'חבר' },
                  { id: 'Instructor', label: 'מדריך' },
                  { id: 'Admin', label: 'רכז' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      if (r.id === 'Admin' && !isSuperAdmin) return;
                      setEditingMember({ ...editingMember, role: r.id as any });
                    }}
                    disabled={r.id === 'Admin' && !isSuperAdmin}
                    className={`relative z-10 flex-1 py-4 text-[13px] font-black transition-all duration-500 outline-none tracking-wider ${
                      editingMember.role === r.id ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                    } ${r.id === 'Admin' && !isSuperAdmin ? 'opacity-20 cursor-not-allowed' : 'focus:scale-105'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {showRoleWarning && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 glass-panel rounded-3xl border border-[#FFDE45]/30 text-center shadow-lg bg-[#FFDE45]/5 backdrop-blur-xl">
                    <p className="text-[12px] text-slate-600 font-bold leading-relaxed">
                      ⚠️ שים לב: שינוי סטטוס המשתמש מעדכן באופן מיידי את <span className="text-[#00AFC2] font-black">הרשאות הגישה</span> שלו במערכת.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Account Status */}
            <div className={`relative overflow-hidden transition-all duration-700 p-8 rounded-[3rem] border backdrop-blur-3xl ${
              editingMember.isActive !== false 
                ? 'glass-panel border-white/40 shadow-xl bg-white/30' 
                : 'bg-rose-50/60 border-rose-200/60 shadow-xl'
            }`}>
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className={`font-black text-[13px] uppercase tracking-widest transition-colors ${editingMember.isActive !== false ? 'text-[#007085]' : 'text-rose-600'}`}>
                    סטטוס חשבון במערכת
                  </h3>
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                    editingMember.isActive !== false ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${editingMember.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {editingMember.isActive !== false ? 'Live' : 'Locked'}
                  </div>
                </div>

                <div className="grid grid-cols-2 p-1.5 glass-effect rounded-[1.75rem] relative h-16 items-center border border-white/30 overflow-hidden shadow-inner bg-black/5">
                  <motion.div 
                    className={`absolute top-1.5 bottom-1.5 rounded-[1.25rem] z-0 ${
                      editingMember.isActive !== false ? 'bg-gradient-to-br from-[#2DA95C] to-[#007085] shadow-lg' : 'bg-gradient-to-br from-[#FF2D60] to-[#CC2678] shadow-lg'
                    }`}
                    initial={false}
                    animate={{
                      right: editingMember.isActive !== false ? '0%' : '50%',
                      width: '50%'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />

                  <button 
                    type="button"
                    onClick={() => setEditingMember({ ...editingMember, isActive: true })}
                    className={`relative z-10 text-sm font-black transition-all duration-500 ${editingMember.isActive !== false ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-500'}`}>
                    פעיל
                  </button>

                  <button 
                    type="button"
                    onClick={() => setEditingMember({ ...editingMember, isActive: false })}
                    className={`relative z-10 text-sm font-black transition-all duration-500 ${editingMember.isActive === false ? 'text-white scale-110' : 'text-slate-400 hover:text-slate-500'}`}>
                    מושעה
                  </button>
                </div>

                <AnimatePresence>
                  {editingMember.isActive === false && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-rose-600/10 p-3 rounded-2xl border border-rose-600/20">
                        <p className="text-rose-600 text-[11px] text-center leading-relaxed font-black animate-pulse uppercase tracking-[0.2em]">
                          ⚠️ ACCOUNT WILL BE RESTRICTED
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6">שם פרטי</label>
            <input 
              type="text"
              value={editingMember.firstName || ''}
              onChange={(e) => setEditingMember({ ...editingMember, firstName: e.target.value })}
              className="w-full p-6 glass-input rounded-3xl font-bold glass-text-primary focus:bg-white/20 focus:shadow-xl transition-all outline-none shadow-sm border border-white/40"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6">שם משפחה</label>
            <input 
              type="text"
              value={editingMember.lastName || ''}
              onChange={(e) => setEditingMember({ ...editingMember, lastName: e.target.value })}
              className="w-full p-6 glass-input rounded-3xl font-bold glass-text-primary focus:bg-white/20 focus:shadow-xl transition-all outline-none shadow-sm border border-white/40"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6">אימייל</label>
            <input 
              type="email"
              value={editingMember.email}
              onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
              className="w-full p-6 glass-input rounded-3xl font-bold glass-text-primary focus:bg-white/20 focus:shadow-xl transition-all outline-none shadow-sm border border-white/40"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6">מגדר</label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                className="w-full p-6 glass-input rounded-3xl font-bold glass-text-primary focus:bg-white/20 transition-all outline-none flex items-center justify-between group shadow-sm border border-white/40"
              >
                <span>{editingMember.gender || 'בחר מגדר'}</span>
                <ChevronDown size={20} className={`text-[#00AFC2] transition-transform duration-500 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isGenderDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsGenderDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-white/80 backdrop-blur-3xl border border-white/60 rounded-[2rem] shadow-2xl z-[70] overflow-hidden"
                    >
                      {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setEditingMember({ ...editingMember, gender: g });
                            setIsGenderDropdownOpen(false);
                          }}
                          className={`w-full px-8 py-5 text-right font-black transition-all hover:bg-[#00D9E6]/10 hover:text-[#007085] ${
                            editingMember.gender === g ? 'text-[#00AFC2] bg-[#00AFC2]/5' : 'text-slate-700'
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

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6">טלפון נייד</label>
            <input 
              type="text"
              value={editingMember.mobile}
              onChange={(e) => setEditingMember({ ...editingMember, mobile: formatMobileNumber(e.target.value) })}
              className="w-full p-6 glass-input rounded-3xl font-bold glass-text-primary focus:bg-white/20 focus:shadow-xl transition-all text-left outline-none shadow-sm border border-white/40"
              dir="ltr"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6">תאריך יום הולדת</label>
            <div className="relative">
              <Cake size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#00AFC2]" />
              <input 
                type="date"
                value={editingMember.birthday || ''}
                onChange={(e) => setEditingMember({ ...editingMember, birthday: e.target.value })}
                className="w-full pr-16 pl-6 py-6 glass-input rounded-3xl font-bold glass-text-primary focus:bg-white/20 transition-all outline-none cursor-pointer shadow-sm border border-white/40"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6">כתובת מגורים</label>
            <div className="relative">
              <Globe size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#00AFC2]" />
              <input 
                type="text" 
                ref={addressInputRef}
                defaultValue={editingMember.full_address || ''} 
                onChange={() => setIsPlaceSelected(false)} 
                placeholder="התחל להקליד: עיר, רחוב ומספר בית..."
                className="w-full pr-16 pl-6 py-6 glass-input rounded-3xl font-bold glass-text-primary focus:bg-white/20 transition-all outline-none shadow-sm border border-white/40" 
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6">ביוגרפיה</label>
          <textarea 
            value={editingMember.bio}
            onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
            className="w-full p-8 glass-input rounded-[3rem] font-bold glass-text-primary focus:bg-white/20 transition-all min-h-[160px] outline-none shadow-sm border border-white/40 leading-relaxed"
            placeholder="ספר קצת על עצמך..."
          />
        </div>

        {/* Social Networks */}
        <div className="md:col-span-2 pt-16 border-t border-white/40">
          <h4 className="text-2xl font-black text-[#1e293b] mb-10 flex items-center gap-4">
            <div className="w-10 h-10 bg-[#00AFC2]/10 rounded-2xl flex items-center justify-center text-[#00AFC2]">
              <Globe size={22} />
            </div>
            רשתות חברתיות
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              { id: 'facebookUrl', label: 'פייסבוק', icon: Facebook, placeholder: 'https://facebook.com/...' },
              { id: 'instagramUrl', label: 'אינסטגרם', icon: Instagram, placeholder: 'https://instagram.com/...' },
              { id: 'tiktokUrl', label: 'טיקטוק', icon: Music2, placeholder: 'https://tiktok.com/@...' },
              { id: 'linkedinUrl', label: 'לינקדאין', icon: Linkedin, placeholder: 'https://linkedin.com/in/...' },
              { id: 'twitterUrl', label: 'טוויטר / X', icon: Twitter, placeholder: 'https://twitter.com/...' },
              { id: 'websiteUrl', label: 'אתר אישי', icon: Globe, placeholder: 'https://...' }
            ].map((social) => (
              <div key={social.id} className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-6 flex items-center gap-2">
                  <social.icon size={14} className="text-[#00AFC2]" />
                  {social.label}
                </label>
                <input 
                  type="text"
                  value={(editingMember as any)[social.id] || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, [social.id]: e.target.value })}
                  placeholder={social.placeholder}
                  className="w-full p-6 glass-input rounded-3xl font-bold glass-text-primary focus:bg-white/20 focus:shadow-xl transition-all text-left outline-none shadow-sm border border-white/40"
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 pt-16 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-8">
            <button 
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className={`flex-[2] py-8 rounded-[2.5rem] font-black text-xl transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 shadow-2xl relative overflow-hidden group ${
                editingMember.isActive !== false 
                  ? 'bg-gradient-to-br from-[#00D9E6] to-[#00AFC2] text-white' 
                  : 'bg-gradient-to-br from-[#FF2D60] to-[#CC2678] text-white'
              }`}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isProcessing ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  <Save size={28} /> 
                  <span className="tracking-tighter">
                    {editingMember.isActive !== false ? 'שמירת שינויים' : 'אשר והשעה משתמש'}
                  </span>
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={() => {
                showConfirm({
                  title: 'העברה לארכיון',
                  message: `האם להעביר את ${editingMember.firstName} ${editingMember.lastName} לארכיון?`,
                  confirmText: 'העבר לארכיון',
                  cancelText: 'ביטול',
                  onConfirm: async () => {
                    setIsProcessing(true);
                    try {
                      await onArchive(editingMember.id);
                      showSuccess('המשתמש הועבר לארכיון בהצלחה');
                      onClose();
                    } catch (err: any) {
                      showError('שגיאה: ' + err.message);
                    } finally {
                      setIsProcessing(false);
                    }
                  }
                });
              }}
              disabled={isProcessing}
              className="flex-1 py-8 glass-panel border border-white/40 text-slate-600 hover:text-[#FF2D60] hover:bg-rose-50/50 rounded-[2.5rem] font-black text-xl transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 shadow-xl"
            >
              <Archive size={28} /> ארכיון
            </button>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              type="button" 
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-3 text-slate-400 hover:text-[#00AFC2] font-black transition-all uppercase tracking-[0.2em] text-[11px] bg-white/20 px-6 py-3 rounded-full border border-white/40 shadow-sm"
            >
              <Key size={16} />
              <span>החלפת סיסמה למשתמש</span>
            </button>
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {showPasswordModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowPasswordModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md glass-panel rounded-[2rem] shadow-2xl overflow-hidden border border-white/20"
              >
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-[#2B2B2E] flex items-center gap-3">
                      <Key className="text-indigo-500" />
                      החלפת סיסמה
                    </h3>
                    <button 
                      onClick={() => setShowPasswordModal(false)}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">סיסמה חדשה</label>
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-4 glass-input rounded-2xl font-black outline-none focus:bg-white/10 transition-all glass-text-primary placeholder:text-white/40"
                        placeholder="הזן סיסמה חדשה"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">אימות סיסמה</label>
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full p-4 glass-input rounded-2xl font-black outline-none focus:bg-white/10 transition-all glass-text-primary placeholder:text-white/40"
                        placeholder="הזן שוב את הסיסמה"
                        required
                        minLength={6}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isChangingPassword || !newPassword || !confirmPassword}
                      className="w-full py-4 glass-button bg-[#00AFC2]/80 hover:bg-[#00AFC2] rounded-2xl font-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isChangingPassword ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      עדכן סיסמה
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default EditMemberForm;
