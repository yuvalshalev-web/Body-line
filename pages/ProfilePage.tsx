
import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  Facebook, 
  Instagram, 
  Music, 
  Linkedin, 
  Key, 
  Check, 
  X as XIcon,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { storage } from '../services/firebase';
import { Member } from '../types';
import { generateBio } from '../services/geminiService';
import { validatePassword, isPasswordValid } from '../utils/validation';
import { hashPassword } from '../utils/crypto';
import { optimizeImage } from '../utils/image';

interface ProfilePageProps {
  user: Member;
  onUpdate: (user: Member) => void;
}

const PasswordRequirement: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
  <div className={`flex items-center gap-2 text-[10px] font-bold ${met ? 'text-emerald-500' : 'text-slate-400'}`}>
    {met ? <Check size={12} /> : <XIcon size={12} />}
    <span>{label}</span>
  </div>
);

const SocialInput = ({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  placeholder, 
  brandColorClass,
  ensureAbsoluteUrl
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  icon: any, 
  placeholder: string,
  brandColorClass: string,
  ensureAbsoluteUrl: (url?: string) => string
}) => (
  <div className="group">
    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] pr-4">{label}</label>
    <div className="relative">
      <Icon className={`absolute right-6 top-1/2 -translate-y-1/2 transition-all duration-300 ${value.trim() ? brandColorClass : 'text-slate-300'} group-focus-within:${brandColorClass}`} size={20} />
      <input
        type="url"
        placeholder={placeholder}
        className="w-full pr-16 pl-16 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-indigo-200 outline-none transition-all font-black text-slate-900 shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value.trim() && (
        <a 
          href={ensureAbsoluteUrl(value)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
          title="פתח קישור חיצוני לבדיקה"
        >
          <ExternalLink size={18} />
        </a>
      )}
    </div>
  </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState<Member>(user);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const pwdRequirements = useMemo(() => validatePassword(passwords.next), [passwords.next]);
  const isPwdValid = useMemo(() => isPasswordValid(pwdRequirements), [pwdRequirements]);

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      onUpdate(formData);
      setIsSaving(false);
      setToastMsg('הפרופיל עודכן בהצלחה.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPwdValid || passwords.next !== passwords.confirm) return;

    setIsSaving(true);
    try {
      const newPasswordHash = await hashPassword(passwords.next);
      onUpdate({ ...formData, password: newPasswordHash, isTempPassword: false });
      setPasswords({ current: '', next: '', confirm: '' });
      setIsSaving(false);
      setToastMsg('הסיסמה עודכנה בהצלחה.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsPasswordSectionOpen(false);
    } catch (err) {
      console.error("Password update error:", err);
      setIsSaving(false);
    }
  };

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const newBio = await generateBio(formData.name, formData.role, formData.bio);
      setFormData(prev => ({ ...prev, bio: newBio }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUpdatingAvatar(true);
      try {
        const optimized = await optimizeImage(file, 512, 0.7);
        const storageRef = ref(storage, `profiles/${user.id}_avatar.jpg`);
        const snapshot = await uploadBytes(storageRef, optimized);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        setFormData(prev => ({ ...prev, avatar: downloadUrl }));
        setToastMsg('תמונת הפרופיל הועלתה בהצלחה.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch (err) {
        console.error("Avatar upload failed:", err);
        alert("נכשלה העלאת התמונה. נסה שנית.");
      } finally {
        setIsUpdatingAvatar(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-50/40 rounded-full blur-[100px] -ml-48"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
            <User size={12} />
            פרופיל אישי
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">הפרופיל שלי</h2>
          <p className="text-slate-500 mt-2 text-lg font-medium">נהל את המידע האישי שלך והקישורים החברתיים שיוצגו בקהילה.</p>
        </div>

        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-indigo-100/30 overflow-hidden relative mb-12">
          <div className="h-56 bg-gradient-to-br from-slate-900 to-indigo-950 relative overflow-hidden">
             <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-[80px] -ml-24 -mb-24"></div>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="px-12 pb-14 -mt-24 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-10 mb-14">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-[3.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-48 h-48 rounded-[3rem] border-8 border-white overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500 bg-white">
                  {isUpdatingAvatar && (
                    <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                  )}
                  <img 
                    src={formData.avatar} 
                    alt={formData.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <label className="absolute bottom-2 left-2 p-4 bg-slate-950 text-white rounded-2xl shadow-2xl cursor-pointer hover:bg-indigo-600 transition-all border-4 border-white active:scale-90 group-hover:rotate-12">
                  <Camera size={26} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUpdatingAvatar} />
                </label>
              </div>
              <div className="flex-1 mb-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{formData.name}</h3>
                <p className="text-indigo-600 font-black flex items-center gap-2 mt-2 uppercase tracking-[0.2em] text-xs">
                  <ShieldCheck size={16} />
                  {formData.role === 'Admin' ? 'מנהל מערכת' : 'חבר קהילה'} &bull; הצטרף ב-{formData.joinedAt}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Rest of the form is identical */}
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">פרטים אישיים</h4>
                </div>
                
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] pr-4">שם תצוגה</label>
                  <div className="relative">
                    <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                      type="text"
                      className="w-full pr-16 pl-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-indigo-200 outline-none transition-all font-black text-slate-900 shadow-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] pr-4">אימייל ליצירת קשר</label>
                  <div className="relative">
                    <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                      type="email"
                      className="w-full pr-16 pl-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-indigo-200 outline-none transition-all font-black text-slate-900 shadow-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] pr-4">מספר טלפון</label>
                  <div className="relative">
                    <Phone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                      type="tel"
                      className="w-full pr-16 pl-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-indigo-200 outline-none transition-all font-black text-slate-900 shadow-sm"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">ביוגרפיה ורשתות</h4>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3 px-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ספר על עצמך</label>
                    <button 
                      type="button"
                      onClick={handleGenerateBio}
                      disabled={isGeneratingBio}
                      className="group flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[10px] hover:bg-indigo-100 transition-all disabled:opacity-50 border border-indigo-100"
                    >
                      {isGeneratingBio ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} className="group-hover:animate-pulse" />
                      )}
                      {isGeneratingBio ? 'משפר ביוגרפיה...' : 'שיפור עם Gemini'}
                    </button>
                  </div>
                  <textarea
                    className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] focus:bg-white focus:border-indigo-200 outline-none transition-all font-bold text-slate-700 min-h-[160px] resize-none leading-relaxed shadow-sm italic"
                    value={formData.bio}
                    placeholder="ספר לנו קצת על עצמך..."
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                <div className="space-y-6">
                  <SocialInput 
                    label="Facebook" 
                    value={formData.facebookUrl || ''} 
                    onChange={(val) => setFormData({ ...formData, facebookUrl: val })}
                    icon={Facebook}
                    placeholder="הכנס קישור לפרופיל פייסבוק"
                    brandColorClass="text-[#1877F2]"
                    ensureAbsoluteUrl={ensureAbsoluteUrl}
                  />
                  <SocialInput 
                    label="Instagram" 
                    value={formData.instagramUrl || ''} 
                    onChange={(val) => setFormData({ ...formData, instagramUrl: val })}
                    icon={Instagram}
                    placeholder="הכנס קישור לפרופיל אינסטגרם"
                    brandColorClass="text-[#E4405F]"
                    ensureAbsoluteUrl={ensureAbsoluteUrl}
                  />
                  <SocialInput 
                    label="LinkedIn" 
                    value={formData.linkedinUrl || ''} 
                    onChange={(val) => setFormData({ ...formData, linkedinUrl: val })}
                    icon={Linkedin}
                    placeholder="הכנס קישור לפרופיל לינקדין"
                    brandColorClass="text-[#0A66C2]"
                    ensureAbsoluteUrl={ensureAbsoluteUrl}
                  />
                  <SocialInput 
                    label="TikTok" 
                    value={formData.tiktokUrl || ''} 
                    onChange={(val) => setFormData({ ...formData, tiktokUrl: val })}
                    icon={Music}
                    placeholder="הכנס קישור לפרופיל טיקטוק"
                    brandColorClass="text-slate-900"
                    ensureAbsoluteUrl={ensureAbsoluteUrl}
                  />
                </div>
              </div>
            </div>

            <div className="mt-16 pt-10 border-t border-slate-100 flex justify-end">
               <button
                type="submit"
                disabled={isSaving}
                className="group relative flex items-center gap-4 px-14 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 active:scale-95 disabled:opacity-70 overflow-hidden"
              >
                {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                <span>{isSaving ? 'מעדכן נתונים...' : 'שמור שינויים בפרופיל'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className={`bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-12 relative overflow-hidden transition-all duration-500`}>
          <div className="relative z-10">
            <button 
              onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
              className="w-full flex items-center justify-between text-right group focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isPasswordSectionOpen ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                  <Key size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-950">אבטחת חשבון</h3>
                  {!isPasswordSectionOpen && <p className="text-slate-500 font-bold text-sm mt-1">לחץ כאן לעדכון סיסמת הכניסה</p>}
                </div>
              </div>
              <div className={`p-2 rounded-xl bg-slate-50 text-slate-400 transition-transform duration-300 ${isPasswordSectionOpen ? 'rotate-180 bg-slate-900 text-white' : ''}`}>
                <ChevronDown size={24} />
              </div>
            </button>

            {isPasswordSectionOpen && (
              <div className="mt-10 pt-10 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
                <p className="text-slate-500 font-bold mb-8">עדכן את סיסמת הכניסה שלך באופן קבוע לשמירה על חשבונך.</p>
                <form onSubmit={handlePasswordUpdate} className="max-w-xl space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] pr-4">סיסמה חדשה</label>
                      <div className="relative">
                        <Key className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={20} />
                        <input
                          type="password"
                          className="w-full pr-16 pl-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-300 outline-none transition-all font-black text-slate-900 shadow-inner"
                          value={passwords.next}
                          onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] pr-4">אימות סיסמה</label>
                      <div className="relative">
                        <Key className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={20} />
                        <input
                          type="password"
                          className="w-full pr-16 pl-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-300 outline-none transition-all font-black text-slate-900 shadow-inner"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                    <PasswordRequirement met={pwdRequirements.length} label="6+ תווים" />
                    <PasswordRequirement met={pwdRequirements.hasUpper} label="A-Z" />
                    <PasswordRequirement met={pwdRequirements.hasLower} label="a-z" />
                    <PasswordRequirement met={pwdRequirements.hasNumber} label="0-9" />
                    <PasswordRequirement met={pwdRequirements.hasSpecial} label="מיוחד" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving || !isPwdValid || passwords.next !== passwords.confirm}
                    className="px-14 py-5 bg-slate-950 text-white rounded-2xl font-black text-md hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-30 flex items-center gap-3"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                    עדכן סיסמה
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-10 left-10 bg-slate-950 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-left-12 duration-500 z-50 border border-white/10">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Check size={28} />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-[0.2em] text-left">בוצע</p>
            <p className="text-slate-400 text-xs font-bold text-left mt-1">{toastMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
