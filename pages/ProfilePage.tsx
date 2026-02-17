
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
  Key, 
  Check, 
  X as XIcon,
  ExternalLink,
  ChevronDown,
  Globe,
  RefreshCw,
  MessageSquare,
  Mail,
  Cake
} from 'lucide-react';
import { Member } from '../types';
import { generateBio } from '../services/geminiService';
import { validatePassword, isPasswordValid } from '../utils/validation';
import { hashPassword } from '../utils/crypto';

const XLogo = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

interface ProfilePageProps {
  user: Member;
  onUpdate: (user: Member) => Promise<void>;
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
  brandColor,
  ensureAbsoluteUrl,
  isCustom
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  icon: any, 
  placeholder: string,
  brandColor: string,
  ensureAbsoluteUrl: (url?: string) => string,
  isCustom?: boolean
}) => {
  const hasValue = !!(value && value.trim());
  
  return (
    <div className="group">
      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em] pr-4">{label}</label>
      <div className="relative">
        <div className={`absolute right-6 top-1/2 -translate-y-1/2 transition-all duration-500 ${hasValue ? 'scale-110' : 'text-slate-300 scale-100 opacity-40'}`} style={{ color: hasValue ? brandColor : '#94a3b8' }}>
          <Icon size={18} />
        </div>
        <input
          type="url"
          placeholder={placeholder}
          className="w-full pr-16 pl-16 py-4.5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:bg-white outline-none transition-all font-black text-slate-900 shadow-sm text-sm"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {hasValue && (
          <a href={ensureAbsoluteUrl(value)} target="_blank" rel="noopener noreferrer" className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 transition-all hover:scale-110">
            <ExternalLink size={16} style={{ color: brandColor }} />
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
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  
  const lastUserRef = useRef<string>(JSON.stringify(initializeMember(user)));

  useEffect(() => {
    const initializedUser = initializeMember(user);
    const userJson = JSON.stringify(initializedUser);
    
    if (initializedUser.id !== formData.id || (!isDirty && userJson !== lastUserRef.current)) {
       setFormData(initializedUser);
       setIsDirty(false);
       lastUserRef.current = userJson;
    }
  }, [user]);

  const pwdRequirements = useMemo(() => validatePassword(passwords.next), [passwords.next]);
  const isPwdValid = useMemo(() => isPasswordValid(pwdRequirements), [pwdRequirements]);

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
    try {
      await onUpdate(formData);
      setToastMsg('הפרופיל עודכן בהצלחה!');
      setShowToast(true);
      setIsDirty(false);
      lastUserRef.current = JSON.stringify(formData);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      setToastMsg('שגיאה בעדכון.');
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
    <div className="relative min-h-full bg-white text-right">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
              <User size={12} /> פרופיל אישי
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">הפרופיל שלי</h2>
          </div>
          {isDirty && (
            <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 animate-pulse">
               <RefreshCw size={18} className="animate-spin" />
               <span className="font-black text-xs uppercase tracking-widest">שינויים לא שמורים</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden mb-12">
          <div className="h-40 bg-gradient-to-br from-slate-900 to-indigo-950"></div>
          <form onSubmit={handleSubmit} className="px-12 pb-14 -mt-20 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-10 mb-14">
              <div className="relative group">
                <img src={formData.avatar} className="w-48 h-48 rounded-[3rem] border-8 border-white object-cover shadow-2xl bg-white" alt={formData.name} />
                <label className="absolute bottom-2 left-2 p-4 bg-slate-950 text-white rounded-2xl cursor-pointer hover:bg-indigo-600 transition-all border-4 border-white">
                  <Camera size={26} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
              <div className="flex-1 mb-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{formData.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formData.role === 'Admin' ? 'מנהל קהילה' : 'חבר נבחרת'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-4">שם מלא</label>
                  <input type="text" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all" value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-4">כתובת אימייל (חדש)</label>
                  <div className="relative">
                    <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="email" className="w-full pr-16 pl-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-4">יום הולדת (חדש)</label>
                  <div className="relative">
                    <Cake className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="date" 
                      className="w-full pr-16 pl-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all cursor-pointer" 
                      value={formData.birthday || ''} 
                      onChange={(e) => handleFieldChange('birthday', e.target.value)} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-4">טלפון (וואטסאפ)</label>
                  <div className="relative">
                    <Phone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="tel" className="w-full pr-16 pl-16 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all" value={formData.mobile} onChange={(e) => handleFieldChange('mobile', e.target.value)} />
                    {formData.mobile && (
                      <a href={getWhatsAppUrl(formData.mobile)} target="_blank" rel="noopener noreferrer" className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center gap-2 group/wa">
                         <MessageSquare size={16} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-5 pt-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 pr-4">רשתות חברתיות</label>
                  <SocialInput label="Facebook" value={formData.facebookUrl || ''} onChange={(v) => handleFieldChange('facebookUrl', v)} icon={Facebook} placeholder="פייסבוק..." brandColor="#1877F2" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                  <SocialInput label="Instagram" value={formData.instagramUrl || ''} onChange={(v) => handleFieldChange('instagramUrl', v)} icon={Instagram} placeholder="אינסטגרם..." brandColor="#E4405F" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                  <SocialInput label="X (Twitter)" value={formData.twitterUrl || ''} onChange={(v) => handleFieldChange('twitterUrl', v)} icon={XLogo} placeholder="X..." brandColor="#000000" ensureAbsoluteUrl={ensureAbsoluteUrl} isCustom />
                  <SocialInput label="TikTok" value={formData.tiktokUrl || ''} onChange={(v) => handleFieldChange('tiktokUrl', v)} icon={Music} placeholder="טיקטוק..." brandColor="#000000" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                  <SocialInput label="אתר אישי" value={formData.websiteUrl || ''} onChange={(v) => handleFieldChange('websiteUrl', v)} icon={Globe} placeholder="אתר..." brandColor="#4F46E5" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <div className="flex items-center justify-between mb-3 px-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">קצת עלי</label>
                    <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[10px] hover:bg-indigo-100 transition-colors">
                      {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      שיפור עם AI
                    </button>
                  </div>
                  <textarea className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-slate-700 min-h-[300px] resize-none focus:bg-white outline-none transition-all shadow-inner" value={formData.bio} onChange={(e) => handleFieldChange('bio', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-16 flex items-center justify-center">
              <button type="submit" disabled={isSaving || !isDirty} className="w-full max-w-md py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                שמירת פרופיל
              </button>
            </div>
          </form>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10">
          <Check size={24} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
