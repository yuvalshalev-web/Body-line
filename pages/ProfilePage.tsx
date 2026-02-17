
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  User, 
  Phone, 
  Camera, 
  Save, 
  Sparkles, 
  Loader2, 
  Facebook, 
  Instagram, 
  Music, 
  Linkedin, 
  Check, 
  ExternalLink,
  Globe,
  RefreshCw,
  MessageSquare,
  Mail,
  Cake,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Member } from '../types';
import { generateBio } from '../services/geminiService';
import { hashPassword } from '../utils/crypto';
import { validatePassword, isPasswordValid } from '../utils/validation';

const XLogo = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

interface ProfilePageProps {
  user: Member;
  onUpdate: (user: Member) => Promise<void>;
}

const SocialInput = ({ 
  label, 
  name,
  value, 
  onChange, 
  icon: Icon, 
  placeholder, 
  brandColor,
  ensureAbsoluteUrl,
}: { 
  label: string, 
  name: string,
  value: string, 
  onChange: (val: string) => void, 
  icon: any, 
  placeholder: string,
  brandColor: string,
  ensureAbsoluteUrl: (url?: string) => string,
}) => {
  const hasValue = !!(value && value.trim());
  
  return (
    <div className="group">
      <label htmlFor={name} className="block text-[9px] md:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] pr-3">{label}</label>
      <div className="relative">
        <div className={`absolute right-5 top-1/2 -translate-y-1/2 transition-all duration-500 ${hasValue ? 'scale-110' : 'text-slate-300 scale-100 opacity-40'}`} style={{ color: hasValue ? brandColor : '#94a3b8' }}>
          <Icon size={18} />
        </div>
        <input
          type="url"
          id={name}
          name={name}
          placeholder={placeholder}
          className="w-full pr-14 pl-14 py-4 md:py-4.5 bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] focus:bg-white outline-none transition-all font-black text-slate-900 shadow-sm text-sm"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {hasValue && (
          <a href={ensureAbsoluteUrl(value)} target="_blank" rel="noopener noreferrer" className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 transition-all active:scale-90">
            <ExternalLink size={14} style={{ color: brandColor }} />
          </a>
        )}
      </div>
    </div>
  );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate }) => {
  const initializeMember = (m: Member): Member => ({
    ...m,
    facebookUrl: m.facebookUrl || '',
    instagramUrl: m.instagramUrl || '',
    linkedinUrl: m.linkedinUrl || '',
    tiktokUrl: m.tiktokUrl || '',
    twitterUrl: m.twitterUrl || '',
    websiteUrl: m.websiteUrl || '',
    bio: m.bio || '',
    mobile: m.mobile || '',
    email: m.email || '',
    birthday: m.birthday || ''
  });

  const [formData, setFormData] = useState<Member>(initializeMember(user));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  
  // Track the last user prop value that was successfully synced to state
  const lastSyncedUserPropRef = useRef<string>(JSON.stringify(initializeMember(user)));

  useEffect(() => {
    const initializedUser = initializeMember(user);
    const userJson = JSON.stringify(initializedUser);
    
    // Sync state with props ONLY if user ID changed or if we aren't editing and the props are different
    if (initializedUser.id !== formData.id || (!isDirty && userJson !== lastSyncedUserPropRef.current)) {
       setFormData(initializedUser);
       lastSyncedUserPropRef.current = userJson;
    }
  }, [user, isDirty, formData.id]);

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const getWhatsAppUrl = (mobile?: string) => {
    if (!mobile) return '';
    const cleaned = mobile.replace(/\D/g, '');
    const withPrefix = cleaned.startsWith('0') ? `972${cleaned.substring(1)}` : cleaned;
    return `https://wa.me/${withPrefix}`;
  };

  const handleFieldChange = (field: keyof Member, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Log the entire formData before processing to see what's collected
    console.log("DEBUG [ProfilePage]: Final data being sent for update:", formData);
    
    try {
      let finalData = { ...formData };

      // Handle Password Change if requested
      if (showPasswordForm && passwords.new) {
        if (!passwords.current) throw new Error('יש להזין סיסמה נוכחית');
        const currentHashed = await hashPassword(passwords.current);
        if (currentHashed !== user.password) throw new Error('סיסמה נוכחית אינה נכונה');
        if (passwords.new !== passwords.confirm) throw new Error('הסיסמאות החדשות אינן תואמות');
        const requirements = validatePassword(passwords.new);
        if (!isPasswordValid(requirements)) throw new Error('הסיסמה החדשה אינה עומדת בדרישות האבטחה');
        
        const newHashed = await hashPassword(passwords.new);
        finalData.password = newHashed;
        finalData.isTempPassword = false;
      }

      await onUpdate(finalData);
      
      // Update our sync ref immediately to prevent race conditions
      lastSyncedUserPropRef.current = JSON.stringify(initializeMember(finalData));
      
      setToastMsg('הפרופיל עודכן בהצלחה!');
      setShowToast(true);
      setIsDirty(false);
      setShowPasswordForm(false);
      setPasswords({ current: '', new: '', confirm: '' });
      
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      console.error("ERROR [ProfilePage]: Update failed", err);
      setToastMsg(err.message || 'שגיאה בעדכון הפרופיל.');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const newBio = await generateBio(formData.name, formData.role, formData.bio);
      handleFieldChange('bio', newBio);
    } catch (err) { console.error(err); } finally { setIsGeneratingBio(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => handleFieldChange('avatar', event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative min-h-full bg-white text-right animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
              <User size={12} /> פרופיל אישי
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">הפרופיל שלי</h2>
          </div>
          {isDirty && (
            <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
               <RefreshCw size={16} className="animate-spin" />
               <span className="font-black text-[10px] uppercase tracking-widest">שינויים לא שמורים</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden mb-12">
          <div className="h-32 md:h-40 bg-gradient-to-br from-slate-900 to-indigo-950"></div>
          <form onSubmit={handleSubmit} className="px-6 md:px-12 pb-14 -mt-16 md:-mt-20 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10 mb-12 md:mb-14 text-center md:text-right">
              <div className="relative group mx-auto md:mx-0">
                <img src={formData.avatar} className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] md:rounded-[3rem] border-4 md:border-8 border-white object-cover shadow-2xl bg-white" alt={formData.name} />
                <label className="absolute bottom-1.5 left-1.5 p-3.5 bg-slate-950 text-white rounded-2xl cursor-pointer hover:bg-indigo-600 transition-all border-4 border-white active:scale-90">
                  <Camera size={22} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
              <div className="flex-1 mb-4">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">{formData.name}</h3>
                <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{formData.role === 'Admin' ? 'מנהל קהילה' : 'חבר נבחרת'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12">
              <div className="space-y-6 md:space-y-8">
                <div>
                  <label htmlFor="fullName" className="block text-[9px] md:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">שם מלא</label>
                  <input id="fullName" name="fullName" type="text" className="w-full px-6 py-4 md:py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all" value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div>
                    <label htmlFor="email" className="block text-[9px] md:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">כתובת אימייל</label>
                    <div className="relative">
                      <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input id="email" name="email" type="email" className="w-full pr-14 pl-6 py-4 md:py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mobile" className="block text-[9px] md:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">טלפון נייד</label>
                    <div className="relative">
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input id="mobile" name="mobile" type="tel" className="w-full pr-14 pl-14 py-4 md:py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all" value={formData.mobile} onChange={(e) => handleFieldChange('mobile', e.target.value)} />
                      {formData.mobile && (
                        <a href={getWhatsAppUrl(formData.mobile)} target="_blank" rel="noopener noreferrer" className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg active:scale-90 transition-transform">
                          <MessageSquare size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="birthday" className="block text-[9px] md:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">תאריך יום הולדת</label>
                  <div className="relative">
                    <Cake className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input id="birthday" name="birthday" type="date" className="w-full pr-14 pl-8 py-4 md:py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all cursor-pointer" value={formData.birthday || ''} onChange={(e) => handleFieldChange('birthday', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-5 pt-4">
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 pr-3">רשתות חברתיות</label>
                  <div className="space-y-4">
                    <SocialInput label="Facebook" name="facebookUrl" value={formData.facebookUrl || ''} onChange={(v) => handleFieldChange('facebookUrl', v)} icon={Facebook} placeholder="פייסבוק..." brandColor="#1877F2" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                    <SocialInput label="Linkedin" name="linkedinUrl" value={formData.linkedinUrl || ''} onChange={(v) => handleFieldChange('linkedinUrl', v)} icon={Linkedin} placeholder="לינקדין..." brandColor="#0A66C2" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                    <SocialInput label="Instagram" name="instagramUrl" value={formData.instagramUrl || ''} onChange={(v) => handleFieldChange('instagramUrl', v)} icon={Instagram} placeholder="אינסטגרם..." brandColor="#E4405F" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                    <SocialInput label="X (Twitter)" name="twitterUrl" value={formData.twitterUrl || ''} onChange={(v) => handleFieldChange('twitterUrl', v)} icon={XLogo} placeholder="X..." brandColor="#000000" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                    <SocialInput label="TikTok" name="tiktokUrl" value={formData.tiktokUrl || ''} onChange={(v) => handleFieldChange('tiktokUrl', v)} icon={Music} placeholder="טיקטוק..." brandColor="#000000" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                    <SocialInput label="אתר אישי" name="websiteUrl" value={formData.websiteUrl || ''} onChange={(v) => handleFieldChange('websiteUrl', v)} icon={Globe} placeholder="אתר..." brandColor="#4F46E5" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-3 px-2">
                    <label htmlFor="bio" className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">קצת עלי</label>
                    <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[9px] md:text-[10px] hover:bg-indigo-100 active:scale-95 transition-all">
                      {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      שיפור עם AI
                    </button>
                  </div>
                  <textarea id="bio" name="bio" className="w-full p-6 md:p-8 bg-slate-50 border border-slate-100 rounded-[2rem] md:rounded-[2.5rem] font-bold text-slate-700 min-h-[300px] md:min-h-[450px] resize-none focus:bg-white outline-none transition-all shadow-inner leading-relaxed" value={formData.bio} onChange={(e) => handleFieldChange('bio', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-slate-100">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                       <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">אבטחה וסיסמה</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מומלץ להחליף סיסמה מעת לעת</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowPasswordForm(!showPasswordForm)} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showPasswordForm ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    {showPasswordForm ? 'ביטול' : 'שינוי סיסמה'}
                  </button>
               </div>

               {showPasswordForm && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500 mb-12">
                   <div className="space-y-1.5">
                     <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pr-3">סיסמה נוכחית</label>
                     <div className="relative">
                       <input type={showPass.current ? "text" : "password"} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                       <button type="button" onClick={() => setShowPass({...showPass, current: !showPass.current})} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                         {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                     </div>
                   </div>
                   <div className="space-y-1.5">
                     <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pr-3">סיסמה חדשה</label>
                     <div className="relative">
                       <input type={showPass.new ? "text" : "password"} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                       <button type="button" onClick={() => setShowPass({...showPass, new: !showPass.new})} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                         {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                     </div>
                   </div>
                   <div className="space-y-1.5">
                     <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pr-3">אימות סיסמה</label>
                     <div className="relative">
                       <input type={showPass.confirm ? "text" : "password"} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
                       <button type="button" onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                         {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                     </div>
                   </div>
                 </div>
               )}
            </div>

            <div className="mt-12 md:mt-16 flex items-center justify-center">
              <button type="submit" disabled={isSaving || !isDirty} className="w-full max-w-md py-5 md:py-6 bg-slate-950 text-white rounded-[1.75rem] md:rounded-[2rem] font-black text-lg md:text-xl hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                שמירת פרופיל
              </button>
            </div>
          </form>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-slate-900 text-white rounded-full font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10">
          <Check size={20} className="text-emerald-400" />
          <span className="text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
