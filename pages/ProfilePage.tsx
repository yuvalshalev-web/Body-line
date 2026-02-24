
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Camera, 
  Save, 
  Sparkles, 
  Loader2, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter,
  Music2,
  Globe,
  Check, 
  ExternalLink, 
  X,
  AlertCircle,
  Phone,
  Cake
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';
import { generateBio } from '../services/geminiService';
import { processImage } from '../utils/imageProcessor';

const SocialInput = ({ 
  label, name, value, onChange, icon: Icon, placeholder, brandColor, ensureAbsoluteUrl,
}: any) => {
  const hasValue = !!(value && value.trim());
  return (
    <div className="group">
      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pr-3">{label}</label>
      <div className="relative">
        <Icon size={18} className="absolute right-5 top-1/2 -translate-y-1/2" style={{ color: hasValue ? brandColor : '#cbd5e1' }} />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pr-14 pl-12 py-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100 focus:border-indigo-200 focus:bg-white transition-all"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {hasValue && (
          <a href={ensureAbsoluteUrl(value)} target="_blank" rel="noopener noreferrer" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-950 transition-colors bg-white p-1.5 rounded-lg shadow-sm">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { currentUser, updateUser } = useAuth();
  const { updateMember } = useData();
  
  const [formData, setFormData] = useState<Member | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (currentUser) setFormData({...currentUser});
  }, [currentUser]);

  if (!formData) return null;

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http')) return trimmed;
    return `https://${trimmed}`;
  };

  const handleFieldChange = (field: keyof Member, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    setIsDirty(true);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const digits = value.replace(/\D/g, '').slice(0, 10);
    let formatted = digits;
    if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    handleFieldChange('mobile', formatted);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const { dataUrl } = await processImage(file, 600, 0.8);
        handleFieldChange('avatar', dataUrl);
      } catch (err: any) {
        setToast({ msg: err.message || 'עיבוד התמונה נכשל', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setIsSaving(true);
    try {
      await updateMember(formData);
      updateUser(formData);
      setToast({ msg: 'הפרופיל עודכן בהצלחה!', type: 'success' });
      setIsDirty(false);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Save profile error:", err);
      setToast({ msg: 'שגיאה בעדכון הפרופיל', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!formData) return;
    setIsGeneratingBio(true);
    try {
      const newBio = await generateBio(`${formData.firstName} ${formData.lastName}`, formData.role, formData.bio);
      handleFieldChange('bio', newBio);
    } catch (err) {
      console.error(err);
    } finally { setIsGeneratingBio(false); }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 text-right animate-in fade-in" dir="rtl">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">הפרופיל שלי</h2>
          <p className="text-slate-400 font-bold text-lg">עדכן את הפרטים האישיים והנוכחות הדיגיטלית שלך</p>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl animate-bounce">
            <AlertCircle size={16} />
            <span className="text-xs font-black">שינויים לא שמורים</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative">
        <div className="h-48 bg-slate-900 relative">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
             <div className="absolute bottom-10 right-20 w-48 h-48 bg-sky-500 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-12 pb-16 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-8 mb-16">
            <div className="relative group">
              <div className="w-44 h-44 rounded-[3rem] border-[10px] border-white overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-500 bg-slate-100 flex items-center justify-center">
                {isProcessingImage ? (
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                ) : formData.avatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="" loading="lazy" />
                ) : (
                  <User size={64} className="text-slate-300" />
                )}
              </div>
              <label className="absolute bottom-2 left-2 p-3 bg-[#006994] text-white rounded-2xl cursor-pointer hover:bg-[#4E8294] transition-all shadow-xl">
                <Camera size={20} className="text-[#00FFFF]" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} disabled={isProcessingImage} />
              </label>
            </div>
            <div className="flex-1 mb-4 text-center md:text-right">
               <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{formData.firstName} {formData.lastName}</h3>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{formData.role === 'Admin' ? 'מנהל מערכת' : 'חבר נבחרת'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-10">
              <section>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <User size={14} /> פרטי התקשרות
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">שם פרטי</label>
                    <input type="text" value={formData.firstName || ''} onChange={e => handleFieldChange('firstName', e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">שם משפחה</label>
                    <input type="text" value={formData.lastName || ''} onChange={e => handleFieldChange('lastName', e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">טלפון נייד</label>
                    <div className="relative">
                      <Phone size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="tel" 
                        value={formData.mobile} 
                        onChange={handleMobileChange} 
                        className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">תאריך יום הולדת</label>
                    <div className="relative">
                      <Cake size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="date" 
                        value={formData.birthday || ''} 
                        onChange={e => handleFieldChange('birthday', e.target.value)} 
                        className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all" 
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <Sparkles size={14} /> נוכחות דיגיטלית
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SocialInput label="Instagram" value={formData.instagramUrl} onChange={(v: string) => handleFieldChange('instagramUrl', v)} icon={Instagram} brandColor="#E4405F" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל אינסטגרם" />
                  <SocialInput label="Facebook" value={formData.facebookUrl} onChange={(v: string) => handleFieldChange('facebookUrl', v)} icon={Facebook} brandColor="#1877F2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל פייסבוק" />
                  <SocialInput label="TikTok" value={formData.tiktokUrl} onChange={(v: string) => handleFieldChange('tiktokUrl', v)} icon={Music2} brandColor="#000000" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל טיקטוק" />
                  <SocialInput label="LinkedIn" value={formData.linkedinUrl} onChange={(v: string) => handleFieldChange('linkedinUrl', v)} icon={Linkedin} brandColor="#0A66C2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל לינקדאין" />
                  <SocialInput label="Twitter / X" value={formData.twitterUrl} onChange={(v: string) => handleFieldChange('twitterUrl', v)} icon={Twitter} brandColor="#1DA1F2" ensureAbsoluteUrl={ensureAbsoluteUrl} placeholder="קישור לפרופיל טוויטר" />
                </div>
              </section>
            </div>

            <div className="lg:col-span-5">
               <div className="sticky top-24 space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">הסיפור שלי</label>
                    <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="text-[10px] font-black text-[#006994] flex items-center gap-1.5 hover:bg-[#40E0D0]/10 px-3 py-1.5 rounded-lg transition-all border border-[#006994]/10">
                      {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-[#00FFFF]" />} שדרג ביוגרפיה עם AI
                    </button>
                  </div>
                  <textarea 
                    value={formData.bio} 
                    onChange={e => handleFieldChange('bio', e.target.value)} 
                    className="w-full p-8 bg-slate-50 rounded-[3rem] font-bold h-[32rem] resize-none outline-none border border-slate-50 focus:bg-white focus:border-indigo-100 transition-all text-lg leading-relaxed shadow-inner" 
                    placeholder="ספר קצת על עצמך, על הגלישה, על החיים..." 
                  />
               </div>
            </div>
          </div>

          <div className="mt-20 flex flex-col items-center gap-4">
             <button type="submit" disabled={isSaving || !isDirty} className="group relative px-20 py-6 bg-[#006994] text-white rounded-[2.5rem] font-black text-2xl hover:bg-[#4E8294] transition-all shadow-2xl shadow-[#006994]/20 disabled:opacity-20 active:scale-95 overflow-hidden">
               <span className="relative z-10 flex items-center gap-4">
                 {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="text-[#00FFFF]" />}
                 שמור שינויים
               </span>
               <div className="absolute inset-0 bg-gradient-to-r from-[#006994] to-[#4E8294] opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </button>
          </div>
        </form>
      </div>

      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 rounded-2xl shadow-2xl text-white font-black animate-in slide-in-from-bottom-5 flex items-center gap-4 z-[200] ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.type === 'success' ? <Check size={24} /> : <AlertCircle size={24} />}
          <span className="text-lg">{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
