import React, { useState, useEffect, useRef } from 'react';
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
  EyeOff, 
  AlertCircle,
  X,
  Calendar,
  Bird,
  ShieldCheck
} from 'lucide-react';
import { Member } from '../types';
import { generateBio } from '../services/geminiService';
import { hashPassword } from '../utils/crypto';

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
          name={name}
          id={name}
          type="text"
          placeholder={placeholder}
          className="w-full pr-14 pl-20 py-4 md:py-4.5 bg-slate-50 border border-slate-100 rounded-[1.25rem] md:rounded-[1.5rem] focus:bg-white outline-none transition-all font-black text-slate-900 shadow-sm text-sm"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {hasValue && (
            <>
              <button 
                type="button" 
                onClick={() => onChange('')}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100"
              >
                <X size={14} />
              </button>
              <a href={ensureAbsoluteUrl(value)} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100">
                <ExternalLink size={14} style={{ color: brandColor }} />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate }) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const initializeMember = (m: Member): Member => ({
    ...m,
    facebookUrl: m.facebookUrl || '',
    instagramUrl: m.instagramUrl || '',
    tiktokUrl: m.tiktokUrl || '',
    linkedinUrl: m.linkedinUrl || '',
    twitterUrl: m.twitterUrl || '',
    websiteUrl: m.websiteUrl || '',
    bio: m.bio || '',
    mobile: m.mobile || '',
    email: m.email || '',
    birthday: m.birthday || '',
    isActive: m.isActive !== undefined ? m.isActive : true,
    role: m.role || 'Member'
  });

  const [formData, setFormData] = useState<Member>(initializeMember(user));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!isDirty || user.id !== formData.id) {
       setFormData(initializeMember(user));
    }
  }, [user.id, user]); 

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const formatDateDisplay = (dateValue?: string) => {
    if (!dateValue) return 'בחירת תאריך לידה';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
      setToastType('success');
      setShowToast(true);
      setIsDirty(false);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      setToastMsg('שגיאה בעדכון הפרופיל.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
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
    <div className="relative min-h-full bg-white text-right animate-in fade-in duration-700 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest mb-3 shadow-md">
              <User size={12} /> עריכת פרופיל
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">הגדרות חשבון</h2>
          </div>
          {isDirty && (
            <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 animate-pulse">
               <RefreshCw size={16} className="animate-spin" />
               <span className="font-black text-[10px] uppercase tracking-widest">שינויים לא שמורים</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden mb-12">
          <div className="h-40 bg-gradient-to-br from-slate-900 to-indigo-950"></div>
          <form onSubmit={handleSubmit} className="px-6 md:px-12 pb-14 -mt-20 relative">
            <div className="flex flex-col md:flex-row md:items-start gap-10 mb-14 text-center md:text-right">
              <div className="relative group mx-auto md:mx-0 shrink-0">
                <img src={formData.avatar} className="w-48 h-48 rounded-[3rem] border-8 border-white object-cover shadow-2xl bg-white" alt="" />
                <label className="absolute bottom-1.5 left-1.5 p-3.5 bg-slate-950 text-white rounded-2xl cursor-pointer hover:bg-indigo-600 transition-all border-4 border-white active:scale-90 shadow-xl">
                  <Camera size={22} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
              <div className="flex-1 pt-24 md:pt-28">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">{formData.name}</h3>
                <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-6">נבחרת חבל זוג • {formData.email}</p>
                
                {/* --- Rolling Toggles Section --- */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-14 mt-8 py-4 border-t border-slate-50">
                  
                  {/* Activity Toggle */}
                  <div className="rolling-toggle-container">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-1">סטטוס משתמש</span>
                    <div className="scale-[0.4] md:scale-[0.5] origin-top">
                      <input 
                        type="checkbox" 
                        id="toggle-active" 
                        className="rolling-toggle-checkbox" 
                        checked={formData.isActive}
                        onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                      />
                      <div className="rolling-toggle-bg">
                        <label htmlFor="toggle-active" className="rolling-toggle-ball"></label>
                      </div>
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${formData.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {formData.isActive ? 'משתמש פעיל' : 'משתמש מושבת'}
                    </span>
                  </div>

                  {/* Role Toggle */}
                  <div className="rolling-toggle-container">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-1">סוג חשבון</span>
                    <div className="scale-[0.4] md:scale-[0.5] origin-top">
                      <input 
                        type="checkbox" 
                        id="toggle-role" 
                        className="rolling-toggle-checkbox" 
                        checked={formData.role === 'Admin'}
                        onChange={(e) => handleFieldChange('role', e.target.checked ? 'Admin' : 'Member')}
                      />
                      <div className="rolling-toggle-bg">
                        <label htmlFor="toggle-role" className="rolling-toggle-ball"></label>
                      </div>
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${formData.role === 'Admin' ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {formData.role === 'Admin' ? 'מנהל מערכת' : 'חבר נבחרת'}
                    </span>
                  </div>

                </div>
                {/* --- End of Toggles --- */}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-10">
              <div className="space-y-8">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">שם מלא</label>
                  <input type="text" className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm focus:bg-white outline-none transition-all" value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">אימייל</label>
                    <input type="email" className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">טלפון נייד</label>
                    <input type="tel" className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900" value={formData.mobile} onChange={(e) => handleFieldChange('mobile', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">תאריך לידה</label>
                  <div className="relative cursor-pointer group/date" onClick={() => dateInputRef.current?.showPicker()}>
                    <div className="w-full pr-14 pl-8 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 shadow-sm flex items-center min-h-[60px]">
                      <Calendar className="absolute right-5 text-slate-300 group-hover/date:text-indigo-500 transition-colors" size={18} />
                      <span className={formData.birthday ? 'text-slate-900' : 'text-slate-300'}>{formatDateDisplay(formData.birthday)}</span>
                    </div>
                    <input ref={dateInputRef} type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={formData.birthday || ''} onChange={(e) => handleFieldChange('birthday', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-5 pt-4">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 pr-3">קישורים חברתיים</label>
                  <div className="space-y-4">
                    <SocialInput label="Instagram" name="instagramUrl" value={formData.instagramUrl || ''} onChange={(v) => handleFieldChange('instagramUrl', v)} icon={Instagram} placeholder="קישור לפרופיל..." brandColor="#E4405F" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                    <SocialInput label="Facebook" name="facebookUrl" value={formData.facebookUrl || ''} onChange={(v) => handleFieldChange('facebookUrl', v)} icon={Facebook} placeholder="קישור לפרופיל..." brandColor="#1877F2" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                    <SocialInput label="LinkedIn" name="linkedinUrl" value={formData.linkedinUrl || ''} onChange={(v) => handleFieldChange('linkedinUrl', v)} icon={Linkedin} placeholder="קישור לפרופיל..." brandColor="#0A66C2" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-3 px-2">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">ביוגרפיה (AI Enhanced)</label>
                    <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[10px] hover:bg-indigo-100 active:scale-95 transition-all">
                      {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      שדרג עם AI
                    </button>
                  </div>
                  <textarea className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[3rem] font-bold text-slate-700 min-h-[400px] resize-none focus:bg-white outline-none transition-all shadow-inner leading-relaxed" value={formData.bio} onChange={(e) => handleFieldChange('bio', e.target.value)} placeholder="ספר על עצמך..." />
                </div>
              </div>
            </div>

            <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col items-center">
               <button type="submit" disabled={isSaving || !isDirty} className="w-full max-w-md py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-30 active:scale-95">
                  {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  <span>שמור שינויים</span>
               </button>
            </div>
          </form>
        </div>
      </div>
      
      {showToast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-6 duration-500 ${toastType === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {toastType === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="font-black text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;