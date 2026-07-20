
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Camera, UserCircle, ChevronLeft, Save, Archive, Loader2, Cake, Phone, Mail, AlertCircle, 
  ChevronDown, Instagram, Facebook, Music2, Linkedin, Twitter, Globe, Key, Check, HeartPulse,
  Award, Search, Sparkles, User, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member } from '../../types';
import { processImage } from '../../utils/imageProcessor';
import { validateMobileNumber, formatMobileNumber } from '../../utils/validation';
import { useModal } from '../../contexts/ModalContext';
import { SUPER_ADMIN_EMAIL } from '../../constants';
import { hashPassword } from '../../utils/crypto';
import { sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { updateMemberAddress, loadGoogleMaps } from '../../utils/googlePlaces';

interface EditMemberFormProps {
  member: Member;
  gritScore: number;
  isSuperAdmin: boolean;
  onSave: (updatedMember: Member) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onClose: () => void;
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

const EditMemberForm: React.FC<EditMemberFormProps> = ({ member, gritScore, isSuperAdmin, onSave, onArchive, onClose }) => {
  const { showSuccess, showError, showConfirm } = useModal();
  const [editingMember, setEditingMember] = useState<Member>(member);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isCertDropdownOpen, setIsCertDropdownOpen] = useState(false);
  const [certSearch, setCertSearch] = useState('');
  const [showRoleWarning, setShowRoleWarning] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPlaceSelected, setIsPlaceSelected] = useState(!!member.full_address);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

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
        } catch (e) {
          console.error("Failed to initialize Autocomplete:", e);
        }
      }
    };

    // Global error handler for Google Maps API
    (window as any).gm_authFailure = () => {
      console.error("Google Maps API authentication/authorization failed.");
      showError('שגיאת הרשאות במפות גוגל. יש לוודא שה-Places API וה-Maps JavaScript API מופעלים ב-Google Cloud.');
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
      const normalizedMember = {
        ...editingMember,
        email: (editingMember.email || '').toLowerCase().trim()
      };
      await onSave(normalizedMember);
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
    
    setIsChangingPassword(true);
    try {
      const isCurrentUser = editingMember.uid && auth.currentUser && editingMember.uid === auth.currentUser.uid;
      
      if (isCurrentUser && auth.currentUser) {
        // Admin is changing their own password
        if (newPassword.length < 6) {
          showError('הסיסמה חייבת להכיל לפחות 6 תווים');
          setIsChangingPassword(false);
          return;
        }
        
        if (newPassword !== confirmPassword) {
          showError('הסיסמאות אינן תואמות');
          setIsChangingPassword(false);
          return;
        }

        await updatePassword(auth.currentUser, newPassword);
        const hashed = await hashPassword(newPassword);
        const updatedMember = { ...editingMember, password: hashed };
        setEditingMember(updatedMember);
        await onSave(updatedMember);
        showSuccess('הסיסמה שלך שונתה בהצלחה');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Resetting password for another user (migrated or legacy)
        if (newPassword.length < 6) {
          showError('הסיסמה חייבת להכיל לפחות 6 תווים');
          setIsChangingPassword(false);
          return;
        }
        
        if (newPassword !== confirmPassword) {
          showError('הסיסמאות אינן תואמות');
          setIsChangingPassword(false);
          return;
        }

        console.log('EditMemberForm: Resetting password for user via API and Firestore', editingMember.email);
        const response = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: editingMember.uid || editingMember.id,
            email: editingMember.email,
            password: newPassword,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'שגיאה בעדכון הסיסמה בשרת האבטחה');
        }

        const resData = await response.json();

        // Hash and save in Firestore so they stay in sync
        const hashed = await hashPassword(newPassword);
        const updatedMember = { 
          ...editingMember, 
          password: hashed, 
          isTemporary: true,
          ...(resData.uid ? { uid: resData.uid } : {})
        };
        
        setEditingMember(updatedMember);
        await onSave(updatedMember);
        
        showSuccess('הסיסמה עודכנה בהצלחה באופן מיידי!');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login' || (err.message && err.message.includes('requires-recent-login'))) {
        showError('פעולה זו רגישה ודורשת התחברות מחדש למערכת לצורך אימות.');
      } else {
        showError('שגיאה בתהליך איפוס הסיסמה: ' + (err.message || err));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="luxury-slab p-8 md:p-12 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden">
      {/* Background Decorative Elements - Surfers Theme Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-[#FF2D60]/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFDE45]/5 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[#CC2678]/10 rounded-full blur-[100px]" />
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

        <div className="px-6 py-2 rounded-full inline-flex items-center gap-3 text-[11px] font-black text-[#007085] tracking-[0.3em] uppercase border border-[#00AFC2]/30 bg-[#00AFC2]/5 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-[#FF9F1C] animate-pulse" />
          <span>Member Management</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-[#1e293b] uppercase tracking-tight leading-none">
          עריכת <span className="text-[#00AFC2]">פרופיל</span>
        </h1>

        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#00AFC2] to-transparent rounded-full" />
      </div>

      <div className="space-y-16">
        {/* Section 1: Identity & Role */}
        <section className="relative">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-[#00AFC2]/10 flex items-center justify-center text-[#00AFC2]">
              <UserCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1e293b]">זהות והרשאות</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identity & System Role</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            {/* Avatar Column */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#00AFC2] to-[#FF9F1C] rounded-[3.5rem] blur-xl opacity-10 group-hover:opacity-30 transition-opacity duration-700" />
                <div className="relative w-48 h-48 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white z-10">
                  {editingMember.avatar ? (
                    <img src={editingMember.avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                      <UserCircle size={100} strokeWidth={1} />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-500 cursor-pointer z-20">
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
                <div className="absolute bottom-2 left-2 p-3 bg-[#00AFC2] text-white rounded-2xl shadow-lg z-30 pointer-events-none">
                  <Camera size={20} />
                </div>
              </div>
            </div>

            {/* Role & Status Column */}
            <div className="md:col-span-8 space-y-10">
              <div className="space-y-4 flex flex-col items-center">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block">תפקיד במערכת</label>
                <div 
                  className="relative w-full max-w-[460px] p-1.5 bg-slate-100/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 grid grid-cols-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)]"
                  dir="rtl"
                  onMouseEnter={() => setShowRoleWarning(true)}
                  onMouseLeave={() => setShowRoleWarning(false)}
                >
                  {[
                    { id: 'Member', label: 'משתתף' },
                    { id: 'Volunteer', label: 'מתנדב' },
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
                      className={`relative py-3.5 text-[13px] font-black text-center flex items-center justify-center transition-all duration-500 outline-none group ${
                        editingMember.role === r.id ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                      } ${r.id === 'Admin' && !isSuperAdmin ? 'opacity-20 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                    >
                      {editingMember.role === r.id && (
                        <motion.div
                          layoutId="role-bubble"
                          className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#00AFC2] via-[#00AFC2] to-[#009fb1] shadow-[0_8px_25px_rgba(0,175,194,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] z-0"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{r.label}</span>
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {showRoleWarning && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-center"
                    >
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        ⚠️ שינוי תפקיד משפיע על הרשאות המערכת
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4 flex flex-col items-center">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block">סטטוס חשבון</label>
                <div className="w-full max-w-[280px] p-1.5 bg-slate-100/40 backdrop-blur-2xl rounded-[2.5rem] relative h-14 items-center border border-white/60 grid grid-cols-2 shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)]" dir="rtl">
                  {[
                    { id: true, label: 'פעיל' },
                    { id: false, label: 'מושעה' }
                  ].map((s) => (
                    <button 
                      key={s.label}
                      type="button"
                      onClick={() => setEditingMember({ ...editingMember, isActive: s.id })}
                      className={`relative h-full text-sm font-black text-center flex items-center justify-center transition-all duration-500 rounded-[2rem] group ${
                        (editingMember.isActive !== false) === s.id ? 'text-white' : 'text-slate-400 hover:text-slate-500'
                      } hover:scale-[1.02] active:scale-95`}
                    >
                      {(editingMember.isActive !== false) === s.id && (
                        <motion.div 
                          layoutId="status-bubble"
                          className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#00AFC2] via-[#00AFC2] to-[#009fb1] shadow-[0_8px_25px_rgba(0,175,194,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] z-0"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{s.label}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-4 flex flex-col items-center">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block">סטטוס חבר</label>
                  <div className="px-8 py-4 bg-[#00AFC2]/5 border border-[#00AFC2]/20 rounded-2xl flex flex-col items-center gap-2">
                    <span className="text-xl font-black text-[#00AFC2] tracking-wider">
                      {editingMember.status || 'מזדמן'}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-sm font-bold text-slate-600">
                        מדד התמדה: {Math.round(gritScore || 0)}%
                      </span>
                      <span className="text-sm font-bold text-slate-600">
                        הערכת מדריך: -
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                    סטטוס מחושב אוטומטית לפי ביצועים ונוכחות
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Personal Information */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00AFC2]/10 flex items-center justify-center text-[#00AFC2]">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1e293b]">פרטים אישיים</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal Information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">שם פרטי</label>
              <input 
                type="text"
                value={editingMember.firstName || ''}
                onChange={(e) => setEditingMember({ ...editingMember, firstName: e.target.value })}
                className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#00AFC2]/10 transition-all outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">שם משפחה</label>
              <input 
                type="text"
                value={editingMember.lastName || ''}
                onChange={(e) => setEditingMember({ ...editingMember, lastName: e.target.value })}
                className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#00AFC2]/10 transition-all outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">אימייל</label>
              <input 
                type="email"
                value={editingMember.email}
                onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#00AFC2]/10 transition-all outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">טלפון נייד</label>
              <input 
                type="text"
                value={editingMember.mobile}
                onChange={(e) => setEditingMember({ ...editingMember, mobile: formatMobileNumber(e.target.value) })}
                className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#00AFC2]/10 transition-all text-left outline-none"
                dir="ltr"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">מגדר</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                  className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white transition-all outline-none flex items-center justify-between"
                >
                  <span className="text-right flex-1">{editingMember.gender || 'בחר מגדר'}</span>
                  <ChevronDown size={20} className={`text-[#00AFC2] transition-transform duration-500 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isGenderDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsGenderDropdownOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-[70] overflow-hidden"
                      >
                        {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setEditingMember({ ...editingMember, gender: g });
                              setIsGenderDropdownOpen(false);
                            }}
                            className={`w-full px-8 py-5 text-right font-black transition-all hover:bg-slate-50 ${
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
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">תאריך יום הולדת</label>
              <div className="relative">
                <Cake size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#00AFC2]" />
                <input 
                  type="date"
                  value={editingMember.birthday || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, birthday: e.target.value })}
                  className="w-full pr-16 pl-6 py-6 luxury-card font-bold text-slate-700 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">כתובת מגורים</label>
            <div className="relative">
              <Globe size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-[#00AFC2]" />
              <input 
                type="text" 
                ref={addressInputRef}
                defaultValue={editingMember.full_address || ''} 
                onChange={() => setIsPlaceSelected(false)} 
                placeholder="התחל להקליד: עיר, רחוב ומספר בית..."
                className="w-full pr-16 pl-6 py-6 luxury-card font-bold text-slate-700 focus:bg-white transition-all outline-none" 
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">ביוגרפיה</label>
            <textarea 
              value={editingMember.bio}
              onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
              className="w-full p-8 luxury-card font-bold text-slate-700 focus:bg-white transition-all min-h-[160px] outline-none leading-relaxed"
              placeholder="ספר קצת על עצמך..."
            />
          </div>
        </section>

        {/* Section 3: Relevant Certifications */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Award size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1e293b]">הכשרות והסמכות רלוונטיות</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Relevant Certifications</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">בחר הכשרות והסמכות</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsCertDropdownOpen(!isCertDropdownOpen)}
                  className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white transition-all outline-none flex items-center justify-between"
                >
                  <span className="text-right flex-1 truncate">
                    {editingMember.certifications && editingMember.certifications.length > 0 
                      ? editingMember.certifications.join(', ') 
                      : 'בחר הכשרות והסמכות'}
                  </span>
                  <ChevronDown size={20} className={`text-[#00AFC2] transition-transform duration-500 ${isCertDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCertDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsCertDropdownOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-[70] overflow-hidden p-4 max-h-[400px] flex flex-col"
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
                          {editingMember.certifications?.filter(c => !CERTIFICATION_OPTIONS.includes(c)).map((cert) => (
                            <button
                              key={cert}
                              type="button"
                              onClick={() => {
                                const currentCerts = editingMember.certifications || [];
                                setEditingMember({ ...editingMember, certifications: currentCerts.filter(c => c !== cert) });
                              }}
                              className="w-full px-4 py-3 text-right font-bold rounded-xl transition-all flex items-center justify-between text-[#00AFC2] bg-[#00AFC2]/5 hover:bg-[#00AFC2]/10"
                            >
                              <span className="truncate">{cert}</span>
                              <Check size={16} />
                            </button>
                          ))}

                          {CERTIFICATION_OPTIONS.filter(cert => 
                            cert.toLowerCase().includes(certSearch.toLowerCase())
                          ).map((cert) => {
                            const isSelected = editingMember.certifications?.includes(cert);
                            return (
                              <button
                                key={cert}
                                type="button"
                                onClick={() => {
                                  const currentCerts = editingMember.certifications || [];
                                  const newCerts = isSelected 
                                    ? currentCerts.filter(c => c !== cert)
                                    : [...currentCerts, cert];
                                  setEditingMember({ ...editingMember, certifications: newCerts });
                                }}
                                className={`w-full px-4 py-3 text-right font-bold rounded-xl transition-all flex items-center justify-between hover:bg-slate-50 ${
                                  isSelected ? 'text-[#00AFC2] bg-[#00AFC2]/5' : 'text-slate-700'
                                }`}
                              >
                                <span className="truncate">{cert}</span>
                                {isSelected && <Check size={16} className="text-[#00AFC2]" />}
                              </button>
                            );
                          })}

                          {certSearch && !CERTIFICATION_OPTIONS.some(c => c.toLowerCase() === certSearch.toLowerCase()) && !editingMember.certifications?.includes(certSearch) && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentCerts = editingMember.certifications || [];
                                setEditingMember({ ...editingMember, certifications: [...currentCerts, certSearch] });
                                setCertSearch('');
                              }}
                              className="w-full px-4 py-3 text-right font-bold rounded-xl transition-all flex items-center justify-between text-[#00AFC2] hover:bg-[#00AFC2]/5 border border-dashed border-[#00AFC2]/20 mt-1"
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

            {editingMember.certifications?.includes('טקסט חופשי') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">פירוט הכשרה נוספת</label>
                <textarea 
                  value={editingMember.otherCertification || ''} 
                  onChange={e => setEditingMember({ ...editingMember, otherCertification: e.target.value })} 
                  placeholder="פרט כאן הכשרות נוספות..."
                  className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white transition-all min-h-[100px] resize-none outline-none leading-relaxed" 
                />
              </motion.div>
            )}
          </div>
        </section>

        {/* Section 2.5: Medical Info */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <HeartPulse size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1e293b]">מידע רפואי וחירום</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical & Emergency Info</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">איש קשר לחירום</label>
              <input 
                type="text" 
                value={editingMember.emergencyContactName || ''} 
                onChange={e => setEditingMember({ ...editingMember, emergencyContactName: e.target.value })} 
                placeholder="שם מלא של איש הקשר"
                className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white transition-all outline-none" 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">טלפון חירום</label>
              <input 
                type="tel" 
                value={editingMember.emergencyContactPhone || ''} 
                onChange={e => setEditingMember({ ...editingMember, emergencyContactPhone: formatMobileNumber(e.target.value) })} 
                placeholder="מספר טלפון לחירום"
                className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white transition-all outline-none" 
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">מידע רפואי / רגישויות</label>
              <textarea 
                value={editingMember.medicalInfo || ''} 
                onChange={e => setEditingMember({ ...editingMember, medicalInfo: e.target.value })} 
                placeholder="פרט כאן רגישויות, פציעות עבר או מידע רפואי שחשוב שנדע..."
                className="w-full p-8 luxury-card font-bold text-slate-700 focus:bg-white transition-all min-h-[120px] resize-none outline-none leading-relaxed" 
              />
            </div>
          </div>
        </section>



        {/* Section 3: Social Networks */}
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00AFC2]/10 flex items-center justify-center text-[#00AFC2]">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1e293b]">נוכחות דיגיטלית</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Social Media Presence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { id: 'facebookUrl', label: 'פייסבוק', icon: Facebook, placeholder: 'https://facebook.com/...' },
              { id: 'instagramUrl', label: 'אינסטגרם', icon: Instagram, placeholder: 'https://instagram.com/...' },
              { id: 'tiktokUrl', label: 'טיקטוק', icon: Music2, placeholder: 'https://tiktok.com/@...' },
              { id: 'linkedinUrl', label: 'לינקדאין', icon: Linkedin, placeholder: 'https://linkedin.com/in/...' },
              { id: 'twitterUrl', label: 'טוויטר / X', icon: Twitter, placeholder: 'https://twitter.com/...' },
              { id: 'websiteUrl', label: 'אתר אישי', icon: Globe, placeholder: 'https://...' }
            ].map((social) => (
              <div key={social.id} className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4 flex items-center gap-2">
                  <social.icon size={14} className="text-[#00AFC2]" />
                  {social.label}
                </label>
                <input 
                  type="text"
                  value={(editingMember as any)[social.id] || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, [social.id]: e.target.value })}
                  placeholder={social.placeholder}
                  className="w-full p-6 luxury-card font-bold text-slate-700 focus:bg-white transition-all text-left outline-none"
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-16 border-t border-slate-100 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row gap-6">
            <button 
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="flex-[2] py-8 rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 shadow-xl relative overflow-hidden group bg-[#00AFC2] text-white"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isProcessing ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  <Save size={28} /> 
                  <span className="tracking-tight">
                    שמירת שינויים
                  </span>
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={() => {
                showConfirm({
                  title: editingMember.isActive !== false ? 'השעיית משתמש' : 'שחרור משתמש',
                  message: editingMember.isActive !== false ? `האם להשעות את ${editingMember.firstName} ${editingMember.lastName}?` : `האם לשחרר את ${editingMember.firstName} ${editingMember.lastName} ולהחזירו לפעילות?`,
                  confirmText: editingMember.isActive !== false ? 'השעה משתמש' : 'שחרר משתמש',
                  cancelText: 'ביטול',
                  onConfirm: async () => {
                    setIsProcessing(true);
                    try {
                      if (editingMember.isActive !== false) {
                        await onArchive(editingMember.id);
                        showSuccess('המשתמש הושעה בהצלחה');
                      } else {
                        await onSave({ ...editingMember, isActive: true });
                        showSuccess('המשתמש הוחזר לפעילות');
                      }
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
              className={`flex-1 py-8 rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 ${
                editingMember.isActive !== false 
                  ? 'bg-[#FF2D60] text-white hover:bg-[#FF2D60]/90 shadow-lg shadow-[#FF2D60]/30' 
                  : 'bg-[#FF2D60] text-white hover:bg-[#FF2D60]/90 shadow-lg shadow-[#FF2D60]/30'
              }`}
            >
              {editingMember.isActive !== false ? (
                <><Archive size={28} /> השעייה</>
              ) : (
                <><RefreshCw size={28} /> שחרור</>
              )}
            </button>
          </div>
          
          <div className="flex justify-center">
            <button 
              type="button" 
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-3 text-slate-400 hover:text-[#00AFC2] font-black transition-all uppercase tracking-[0.2em] text-[11px] px-8 py-4 rounded-full border border-slate-200"
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
                className="relative w-full max-w-md luxury-slab rounded-[2rem] overflow-hidden"
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
                    <>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest pr-3">סיסמה חדשה</label>
                        <input 
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full p-4 luxury-card rounded-2xl font-black outline-none focus:ring-2 ring-indigo-500/20 transition-all text-[#2B2B2E] placeholder:text-slate-400"
                          placeholder="הזן סיסמה חדשה"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest pr-3">אימות סיסמה</label>
                        <input 
                          type="password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full p-4 luxury-card rounded-2xl font-black outline-none focus:ring-2 ring-indigo-500/20 transition-all text-[#2B2B2E] placeholder:text-slate-400"
                          placeholder="הזן שוב את הסיסמה"
                          required
                          minLength={6}
                        />
                      </div>
                    </>
                    <button 
                      type="submit"
                      disabled={isChangingPassword || !newPassword || !confirmPassword}
                      className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
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
