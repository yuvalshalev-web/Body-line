
import React, { useRef, useState } from 'react';
import { X, Camera, Loader2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from '../../services/firebase';
import { processImage } from '../../utils/imageProcessor';
import { syncStorageOnUpload } from '../../utils/storageStats';
import { useModal } from '../../contexts/ModalContext';

interface EventEditorProps {
  event: any;
  onSave: (updatedEvent: any) => Promise<void>;
  onClose: () => void;
}

const EventEditor: React.FC<EventEditorProps> = ({ event, onSave, onClose }) => {
  const { showSuccess, showError } = useModal();
  const [form, setForm] = useState({
    title: event.title || '',
    description: event.description || '',
    date: event.date || '',
    time: event.time || '',
    location: event.location || '',
    imageUrl: event.imageUrl || '',
    type: event.type || 'COMMUNITY'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const processed = await processImage(file, 1200, 0.85);
      const storage = getStorageInstance();
      const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);
      
      await uploadBytes(storageRef, processed.blob);
      await syncStorageOnUpload(processed.blob.size);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setForm(prev => ({ ...prev, imageUrl: downloadUrl }));
      showSuccess('התמונה הועלתה בהצלחה');
    } catch (err) {
      console.error(err);
      showError('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave({ ...event, ...form });
      onClose();
    } catch (err) {
      showError('שגיאה בשמירת האירוע');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl animate-in fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#FDFBF7] w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto border border-white/60"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-black text-[#2B2B2E]">עריכת אירוע</h3>
          <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-all active:scale-95">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mr-4">כותרת האירוע</label>
            <input 
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all shadow-sm"
              placeholder="הכנס כותרת..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mr-4">תיאור</label>
            <textarea 
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all h-32 resize-none shadow-sm"
              placeholder="תאר את האירוע..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mr-4">תאריך</label>
              <input 
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mr-4">שעה</label>
              <input 
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mr-4">סוג אירוע</label>
            <div className="flex gap-4">
              {[
                { id: 'COMMUNITY', label: 'קהילה' },
                { id: 'INSTRUCTOR', label: 'מדריך' },
                { id: 'MEMBER', label: 'חבר' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.id })}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border ${
                    form.type === t.id 
                      ? 'bg-[#D4A373] text-white border-[#D4A373] shadow-md' 
                      : 'bg-white/40 text-slate-400 border-white/60 hover:bg-white/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mr-4">מיקום</label>
            <input 
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all shadow-sm"
              placeholder="איפה זה קורה?"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest mr-4">תמונת רקע</label>
            <div className="relative group/img aspect-video rounded-[2rem] overflow-hidden border-2 border-dashed border-[#D4A373]/20 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center gap-4 transition-all hover:border-[#D4A373]/40 shadow-sm">
              {form.imageUrl ? (
                <>
                  <img src={form.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-4 bg-white text-[#2B2B2E] rounded-2xl font-black text-sm shadow-2xl flex items-center gap-3 active:scale-95 hover:bg-[#D4A373] hover:text-white transition-all"
                    >
                      <Camera size={20} />
                      החלפת תמונת רקע
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-4 text-slate-400 hover:text-[#D4A373] transition-all group/btn"
                >
                  <div className="p-6 bg-white rounded-[1.5rem] shadow-sm border border-white/60 group-hover/btn:scale-110 transition-transform">
                    <Camera size={40} strokeWidth={1.5} />
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest">לחץ להעלאת תמונה</span>
                </button>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-10">
                  <Loader2 className="animate-spin text-[#D4A373]" size={40} />
                  <span className="font-black text-[#D4A373] text-[10px] uppercase tracking-widest animate-pulse">מעלה תמונה...</span>
                </div>
              )}
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-12">
          <button 
            onClick={onClose}
            className="py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
          >
            ביטול
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="py-5 bg-[#D4A373] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-[#C39262] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            שמור שינויים
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EventEditor;
