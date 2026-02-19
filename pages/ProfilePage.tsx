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
  Check, 
  ExternalLink, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';
import { generateBio } from '../services/geminiService';

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
          className="w-full pr-14 pl-12 py-4 bg-slate-50 rounded-2xl font-black text-sm outline-none border border-slate-100"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {hasValue && (
          <a href={ensureAbsoluteUrl(value)} target="_blank" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-950 transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { updateMember } = useData();
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Member | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setIsSaving(true);
    try {
      await updateMember(formData);
      setToast({ msg: 'פרופיל עודכן!', type: 'success' });
      setIsDirty(false);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ msg: 'שגיאה בעדכון', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!formData) return;
    setIsGeneratingBio(true);
    try {
      const newBio = await generateBio(formData.name, formData.role, formData.bio);
      handleFieldChange('bio', newBio);
    } finally { setIsGeneratingBio(false); }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 text-right animate-in fade-in" dir="rtl">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">פרופיל אישי</h2>
        <p className="text-slate-400 font-bold">נהל את הזהות שלך בקהילה</p>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="h-32 bg-slate-950"></div>
        <form onSubmit={handleSubmit} className="px-10 pb-14 -mt-16">
          <div className="flex items-end gap-6 mb-12">
            <div className="relative">
              <img src={formData.avatar} className="w-32 h-32 rounded-[2.5rem] border-8 border-white object-cover shadow-xl" alt="" />
              <label className="absolute bottom-1 left-1 p-2 bg-slate-950 text-white rounded-xl cursor-pointer hover:bg-indigo-600 transition-all">
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => handleFieldChange('avatar', ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <input type="text" value={formData.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50" placeholder="שם מלא" />
              <div className="grid grid-cols-2 gap-4">
                <input type="email" value={formData.email} onChange={e => handleFieldChange('email', e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50" placeholder="אימייל" />
                <input type="tel" value={formData.mobile} onChange={e => handleFieldChange('mobile', e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-50" placeholder="טלפון" />
              </div>
              <div className="space-y-4 pt-4">
                <SocialInput label="Instagram" value={formData.instagramUrl} onChange={(v: string) => handleFieldChange('instagramUrl', v)} icon={Instagram} brandColor="#E4405F" ensureAbsoluteUrl={ensureAbsoluteUrl} />
                <SocialInput label="Facebook" value={formData.facebookUrl} onChange={(v: string) => handleFieldChange('facebookUrl', v)} icon={Facebook} brandColor="#1877F2" ensureAbsoluteUrl={ensureAbsoluteUrl} />
              </div>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase">ביוגרפיה</label>
                 <button type="button" onClick={handleGenerateBio} disabled={isGeneratingBio} className="text-[10px] font-black text-indigo-600 flex items-center gap-1 hover:underline">
                   {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} שדרג עם AI
                 </button>
               </div>
               <textarea value={formData.bio} onChange={e => handleFieldChange('bio', e.target.value)} className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-bold h-64 resize-none outline-none border border-slate-50" placeholder="קצת עליך..." />
            </div>
          </div>

          <div className="mt-12 flex justify-center">
             <button type="submit" disabled={isSaving || !isDirty} className="px-16 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-30">
               {isSaving ? <Loader2 className="animate-spin" /> : <Save className="inline-block ml-3" />}
               שמור שינויים
             </button>
          </div>
        </form>
      </div>

      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl text-white font-black animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;