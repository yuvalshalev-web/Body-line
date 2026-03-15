import React, { useRef, useState } from 'react';
import { X, Camera, Loader2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from '../../services/firebase';
import { processImage } from '../../utils/imageProcessor';
import { syncStorageOnUpload } from '../../utils/storageStats';
import { useModal } from '../../contexts/ModalContext';
import { NewsItem } from '../../types';

interface PostEditorProps {
  post: NewsItem;
  onSave: (updatedPost: NewsItem) => Promise<void>;
  onClose: () => void;
}

const PostEditor: React.FC<PostEditorProps> = ({ post, onSave, onClose }) => {
  const { showSuccess, showError } = useModal();
  const [form, setForm] = useState({
    title: post.title || '',
    content: post.content || '',
    date: post.date || '',
    imageUrl: post.imageUrl || '',
    category: post.category || 'Update',
    authorName: post.authorName || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const processed = await processImage(file, 1200, 0.9, 800);
      const storage = getStorageInstance();
      const storageRef = ref(storage, `news/${Date.now()}_${file.name}`);
      
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
      await onSave({ ...post, ...form });
      onClose();
    } catch (err) {
      showError('שגיאה בשמירת הפוסט');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="luxury-slab w-full max-w-2xl p-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-black text-[#2B2B2E]">עריכת פוסט</h3>
          <button onClick={onClose} className="p-3 luxury-card hover:bg-white/10 rounded-full text-white/60 hover:text-rose-500 transition-all active:scale-95">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[12px] font-black text-[#D4A373] uppercase tracking-widest mr-4">כותרת הפוסט</label>
            <input 
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full luxury-card px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all"
              placeholder="הכנס כותרת..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-black text-[#D4A373] uppercase tracking-widest mr-4">תוכן הפוסט</label>
            <textarea 
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full luxury-card px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all h-32 resize-none"
              placeholder="הכנס תוכן..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[12px] font-black text-[#D4A373] uppercase tracking-widest mr-4">תאריך</label>
              <input 
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full luxury-card px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-black text-[#D4A373] uppercase tracking-widest mr-4">קטגוריה</label>
              <select 
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full luxury-card px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all appearance-none"
              >
                <option value="Update">עדכון</option>
                <option value="Activity">פעילות</option>
                <option value="Announcement">הכרזה</option>
                <option value="Personal">אישי</option>
                <option value="Share">שיתוף</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-black text-[#D4A373] uppercase tracking-widest mr-4">שם המחבר</label>
            <input 
              type="text"
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
              className="w-full luxury-card px-6 py-4 font-bold text-[#2B2B2E] focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 outline-none transition-all"
              placeholder="שם המחבר..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-black text-[#D4A373] uppercase tracking-widest mr-4">תמונת נושא</label>
            <div className="relative group rounded-[2rem] overflow-hidden luxury-card aspect-video">
              {form.imageUrl ? (
                <img src={form.imageUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Camera size={48} className="mb-4 opacity-50" />
                  <span className="font-bold">לחץ להעלאת תמונה</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={32} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#D4A373]" size={40} />
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSaving || !form.title || !form.content}
            className="w-full py-6 bg-[#D4A373] text-white rounded-[2rem] font-black text-xl hover:bg-[#C29262] transition-all shadow-xl shadow-[#D4A373]/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
          >
            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            שמור שינויים
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PostEditor;
