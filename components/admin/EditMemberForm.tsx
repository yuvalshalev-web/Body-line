
import React, { useState } from 'react';
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
    <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-[3rem] p-8 md:p-12 shadow-2xl max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#E6D5B8]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#D4A373]/10 rounded-full blur-[80px]" />
      </div>

      {/* Header Stack */}
      <div className="flex flex-col items-center text-center mb-12 space-y-4">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black transition-all group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          <span>חזרה</span>
        </button>

        <div className="bg-white/40 backdrop-blur-md border border-white/60 px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase shadow-sm">
          <UserCircle size={12} className="text-[#D4A373]" />
          <span>USER PROFILE</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter">
          עריכת משתמש
        </h1>

        <p className="text-slate-600 font-medium max-w-2xl">
          ניהול הרשאות, פרטי קשר ונוכחות דיגיטלית של חבר הנבחרת 👤
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Avatar Section */}
        <div className="md:col-span-2 flex flex-col items-center mb-4">
          <div className="relative group">
            {editingMember.avatar ? (
              <img src={editingMember.avatar} className="w-40 h-40 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white/60" alt="" />
            ) : (
              <div className="w-40 h-40 rounded-[2.5rem] bg-white/40 backdrop-blur-md flex items-center justify-center text-slate-300 shadow-inner border-4 border-white/60">
                <UserCircle size={80} strokeWidth={1} />
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-md">
              <Camera className="text-white" size={32} />
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
          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">לחץ לשינוי תמונה</p>
          
          {/* Role Management */}
          <div className="mt-12 w-full max-w-md space-y-6">
            <div className="flex flex-col items-center gap-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">סטטוס תפקיד במערכת</label>
              
              <div 
                className="relative w-full p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 flex items-center overflow-hidden shadow-sm"
                onMouseEnter={() => setShowRoleWarning(true)}
                onMouseLeave={() => setShowRoleWarning(false)}
              >
                <motion.div
                  className="absolute top-1 bottom-1 rounded-xl bg-[#D4A373] shadow-lg z-0"
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
                    className={`relative z-10 flex-1 py-3 text-xs font-black transition-all duration-500 outline-none ${
                      editingMember.role === r.id ? 'text-white' : 'text-slate-500 hover:text-slate-700'
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
                  <div className="p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 text-center shadow-sm">
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                      ⚠️ שים לב: שינוי סטטוס המשתמש מעדכן באופן מיידי את <span className="text-[#D4A373] font-black">הרשאות הגישה</span> שלו במערכת.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Account Status */}
            <div className={`relative overflow-hidden transition-all duration-500 p-6 rounded-[2rem] border backdrop-blur-md ${
              editingMember.isActive !== false 
                ? 'bg-white/40 border-white/60 shadow-sm' 
                : 'bg-rose-50/40 border-rose-200 shadow-sm'
            }`}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className={`font-black text-sm transition-colors ${editingMember.isActive !== false ? 'text-slate-800' : 'text-rose-600'}`}>
                    סטטוס חשבון במערכת
                  </h3>
                  <span className={`text-[9px] px-3 py-1 rounded-full uppercase tracking-widest font-black ${
                    editingMember.isActive !== false ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {editingMember.isActive !== false ? 'Live' : 'Locked'}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-1 bg-slate-100/50 backdrop-blur-md rounded-2xl relative h-14 items-center border border-white/60 overflow-hidden shadow-inner">
                  <motion.div 
                    className={`absolute top-1 bottom-1 rounded-xl z-0 ${
                      editingMember.isActive !== false ? 'bg-emerald-500 shadow-lg' : 'bg-rose-600 shadow-lg'
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
                    className={`relative z-10 text-xs font-black transition-colors duration-300 ${editingMember.isActive !== false ? 'text-white' : 'text-slate-400'}`}>
                    פעיל
                  </button>

                  <button 
                    type="button"
                    onClick={() => setEditingMember({ ...editingMember, isActive: false })}
                    className={`relative z-10 text-xs font-black transition-colors duration-300 ${editingMember.isActive === false ? 'text-white' : 'text-slate-400'}`}>
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
                      <p className="text-rose-600 text-[10px] text-center pt-2 leading-relaxed font-black animate-pulse uppercase tracking-widest">
                        ⚠️ ACCOUNT WILL BE RESTRICTED
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">שם פרטי</label>
            <input 
              type="text"
              value={editingMember.firstName || ''}
              onChange={(e) => setEditingMember({ ...editingMember, firstName: e.target.value })}
              className="w-full p-5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl font-bold text-slate-800 focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all outline-none shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">שם משפחה</label>
            <input 
              type="text"
              value={editingMember.lastName || ''}
              onChange={(e) => setEditingMember({ ...editingMember, lastName: e.target.value })}
              className="w-full p-5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl font-bold text-slate-800 focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all outline-none shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">אימייל</label>
            <input 
              type="email"
              value={editingMember.email}
              onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
              className="w-full p-5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl font-bold text-slate-800 focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">מגדר</label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                className="w-full p-5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl font-bold text-slate-800 focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all outline-none flex items-center justify-between group shadow-sm"
              >
                <span>{editingMember.gender || 'בחר מגדר'}</span>
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
                      className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl z-[70] overflow-hidden"
                    >
                      {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setEditingMember({ ...editingMember, gender: g });
                            setIsGenderDropdownOpen(false);
                          }}
                          className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-[#D4A373] hover:text-white ${
                            editingMember.gender === g ? 'text-[#D4A373] bg-[#D4A373]/5' : 'text-slate-700'
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">טלפון נייד</label>
            <input 
              type="text"
              value={editingMember.mobile}
              onChange={(e) => setEditingMember({ ...editingMember, mobile: formatMobileNumber(e.target.value) })}
              className="w-full p-5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl font-bold text-slate-800 focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all text-left outline-none shadow-sm"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">תאריך יום הולדת</label>
            <div className="relative">
              <Cake size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date"
                value={editingMember.birthday || ''}
                onChange={(e) => setEditingMember({ ...editingMember, birthday: e.target.value })}
                className="w-full pr-14 pl-6 py-5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl font-bold text-slate-800 focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all outline-none cursor-pointer shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">ביוגרפיה</label>
          <textarea 
            value={editingMember.bio}
            onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
            className="w-full p-6 bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] font-bold text-slate-800 focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all min-h-[120px] outline-none shadow-sm"
            placeholder="ספר קצת על עצמך..."
          />
        </div>

        {/* Social Networks */}
        <div className="md:col-span-2 pt-12 border-t border-white/60">
          <h4 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <Globe size={20} className="text-[#D4A373]" />
            רשתות חברתיות
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { id: 'facebookUrl', label: 'פייסבוק', icon: Facebook, placeholder: 'https://facebook.com/...' },
              { id: 'instagramUrl', label: 'אינסטגרם', icon: Instagram, placeholder: 'https://instagram.com/...' },
              { id: 'tiktokUrl', label: 'טיקטוק', icon: Music2, placeholder: 'https://tiktok.com/@...' },
              { id: 'linkedinUrl', label: 'לינקדאין', icon: Linkedin, placeholder: 'https://linkedin.com/in/...' },
              { id: 'twitterUrl', label: 'טוויטר / X', icon: Twitter, placeholder: 'https://twitter.com/...' },
              { id: 'websiteUrl', label: 'אתר אישי', icon: Globe, placeholder: 'https://...' }
            ].map((social) => (
              <div key={social.id} className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4 flex items-center gap-2">
                  <social.icon size={12} />
                  {social.label}
                </label>
                <input 
                  type="text"
                  value={(editingMember as any)[social.id] || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, [social.id]: e.target.value })}
                  placeholder={social.placeholder}
                  className="w-full p-5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl font-bold text-slate-800 focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all text-left outline-none shadow-sm"
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 pt-12 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <button 
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className={`flex-[2] py-6 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 backdrop-blur-md border shadow-xl ${
                editingMember.isActive !== false 
                  ? 'bg-[#D4A373] border-white/20 text-white hover:bg-[#C39262]' 
                  : 'bg-rose-600 border-white/20 text-white hover:bg-rose-700'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <Save size={24} /> 
                  {editingMember.isActive !== false ? 'שמירת שינויים' : 'אשר והשעה משתמש'}
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
              className="flex-1 py-6 bg-white/40 backdrop-blur-md border border-white/60 text-slate-600 hover:text-slate-800 hover:bg-white/60 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-lg"
            >
              <Archive size={24} /> ארכיון
            </button>
          </div>
          
          <div className="flex justify-center mt-4">
            <button 
              type="button" 
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
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
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
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
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default EditMemberForm;
