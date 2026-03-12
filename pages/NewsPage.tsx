import React, { useState, useRef } from 'react';
import { GlassButtonV2 as GlassButton } from '../components/GlassButton';
import { Newspaper, Plus, X, Loader2, Image as ImageIcon, Heart, MessageCircle, Send, Waves, Trash2, Pencil, User, Info, Activity, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { NewsItem } from '../types';
import { processImage } from '../utils/imageProcessor';
import { syncStorageOnUpload } from '../utils/storageStats';

const NewsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { news, addNews, updateNews, deleteNews } = useData();
  const { showConfirm, showAlert } = useModal();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NewsItem['category']>('Update');
  const [selectedImage, setSelectedImage] = useState<{blob: Blob, dataUrl: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processed = await processImage(file, 1200, 0.85);
        setSelectedImage(processed);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(err.message || 'עיבוד התמונה נכשל');
        setSelectedImage(null);
      }
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !content.trim() || isPosting) return;

    setIsPosting(true);
    setErrorMsg(null);
    try {
      let imageUrl = editingItem?.imageUrl || '';
      if (selectedImage) {
        const storageRef = ref(getStorageInstance(), `news/${Date.now()}_post.webp`);
        const snapshot = await uploadBytes(storageRef, selectedImage.blob);
        await syncStorageOnUpload(selectedImage.blob.size);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      if (editingItem) {
        await updateNews({
          ...editingItem,
          title: title.trim(),
          content: content.trim(),
          category,
          imageUrl
        });
      } else {
        await addNews({
          title: title.trim(),
          content: content.trim(),
          category,
          date: new Date().toISOString().split('T')[0],
          imageUrl: imageUrl || "", 
          authorId: currentUser.id,
          authorName: `${currentUser.firstName} ${currentUser.lastName}`,
          authorAvatar: currentUser.avatar
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        setTitle(''); setContent(''); setCategory('Update'); setSelectedImage(null); setEditingItem(null);
        setShowSuccess(false); setShowCreateModal(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "שגיאה בפרסום. נסה שנית.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleEdit = (item: NewsItem) => {
    if (!currentUser) return;
    
    if (item.authorId !== currentUser.id) {
      showAlert("מבאס, אבל רק מחבר הפוסט יכול לערוך אותו. 🔒", "חזרה");
      return;
    }

    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setSelectedImage(null);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'מחיקת פוסט',
      message: 'האם אתה בטוח שברצונך למחוק פוסט זה?',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      onConfirm: () => deleteNews(id)
    });
  };

  return (
    <div className="relative min-h-screen bg-transparent text-right p-6 md:p-12 animate-in fade-in" dir="rtl" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-10 space-y-4">
        {/* Top Badge */}
        <div className="bg-[var(--surfer-aqua-mist)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 px-4 py-2 rounded-xl text-center shadow-lg min-w-max flex items-center gap-2 w-fit">
          <Newspaper size={12} className="text-[var(--surfer-cyan)]" />
          <span className="text-xs font-black text-[#000000]">COMMUNITY UPDATES</span>
        </div>

        {/* Main Title */}
        <h1 className="main-page-title">
          <span className="text-4xl font-black text-[var(--surfer-magenta)] [text-shadow:0_0_10px_var(--surfer-pink)]">פוסטים מהנבחרת</span>
        </h1>

        {/* Subtitle with Emoji context */}
        <div className="flex flex-col items-center gap-6">
          <p className="text-lg font-bold text-[#000000] max-w-2xl">
            עדכונים אופטימליים ורגעים מהחיים של חברי חבל זוג 🗞️
          </p>
          
          <GlassButton 
            onClick={() => { setShowSuccess(false); setErrorMsg(null); setEditingItem(null); setTitle(''); setContent(''); setCategory('Update'); setSelectedImage(null); setShowCreateModal(true); }}
            className="flex items-center gap-4 px-10 py-5 bg-[var(--surfer-cyan)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 rounded-2xl font-black text-md shadow-xl active:scale-95 group text-[#000000]"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform text-[var(--surfer-cyan)]" />
            <span>פרסום פוסט חדש</span>
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {news.length > 0 ? (
          [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
            <article key={item.id} className="group flex flex-col lg:flex-row gap-8 bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_15px_30px_-10px_var(--surfer-deep-shadow)] rounded-[2.5rem] p-4 hover:shadow-2xl transition-all relative">
              {(currentUser?.role === 'Admin' || item.authorId === currentUser?.id) && (
                <div className="absolute top-8 left-8 flex gap-2 z-20">
                  <button onClick={() => handleEdit(item)} className="p-3 bg-[var(--surfer-aqua-mist)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 text-[#000000] rounded-2xl hover:bg-[var(--surfer-cyan)] hover:text-white shadow-sm"><Pencil size={18} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-3 bg-[var(--surfer-pink)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 text-[#000000] rounded-2xl hover:bg-[var(--surfer-pink)] hover:text-white shadow-sm"><Trash2 size={18} /></button>
                </div>
              )}
              {item.imageUrl && (
                <div className="lg:w-1/3 aspect-video lg:aspect-square rounded-[2rem] overflow-hidden border-t border-l border-white/30 border-r border-b border-white/10">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" loading="lazy" />
                </div>
              )}
              <div className="flex-1 p-6 lg:p-10">
                <h3 className="text-3xl font-black text-[var(--surfer-magenta)] [text-shadow:0_0_10px_var(--surfer-pink)] mb-4">{item.title}</h3>
                <p className="text-[#000000] font-bold leading-relaxed mb-8 text-lg whitespace-pre-wrap">{item.content}</p>
                <div className="flex items-center gap-3">
                   {item.authorAvatar ? (
                     <img src={item.authorAvatar} className="w-8 h-8 rounded-full object-cover" alt="" loading="lazy" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-[var(--surfer-aqua-mist)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 flex items-center justify-center text-[var(--surfer-yellow)]">
                       <User size={14} />
                     </div>
                   )}
                   <span className="text-xs font-black text-[#000000]">{item.authorName}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-[var(--surfer-aqua-mist)]/20 rounded-[4rem] bg-[var(--surfer-aqua-mist)]/5 backdrop-blur-[20px]">
            <Newspaper size={48} className="text-[var(--surfer-cyan)] mb-6 mx-auto" />
            <h3 className="text-2xl font-black text-[#000000]">אין עדכונים כרגע</h3>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl rounded-[3.5rem] p-12 relative max-h-[90vh] overflow-y-auto">
            {!showSuccess && <button onClick={() => setShowCreateModal(false)} className="absolute top-8 left-8 p-3 glass-effect text-white/60 hover:text-white rounded-full"><X size={24} /></button>}
            {showSuccess ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-[var(--surfer-cyan)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} className="text-[#00FFFF]" />
                </div>
                <h3 className="text-4xl font-black glass-text-primary">פורסם!</h3>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit} className="space-y-6">
                <h3 className="text-2xl font-black mb-4 text-[var(--surfer-magenta)]">{editingItem ? 'עריכת פוסט' : 'יצירת פוסט אופטימלי'}</h3>
                {errorMsg && <div className="p-4 bg-[var(--surfer-pink)]/20 text-[var(--surfer-pink)] rounded-2xl text-xs font-black flex items-center gap-2"><AlertTriangle size={14} className="text-[#FFD700]" /> {errorMsg}</div>}
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת הפוסט" className="w-full p-5 bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] rounded-2xl font-black border-none text-[#000000] placeholder-black/50" />
                <textarea required value={content} onChange={e => setContent(e.target.value)} placeholder="מה הסיפור?" className="w-full p-5 bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] rounded-2xl font-bold border-none h-40 resize-none text-[#000000] placeholder-black/50" />
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] rounded-2xl border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-black/5 transition-colors">
                  {selectedImage ? <img src={selectedImage.dataUrl} className="w-full h-full object-cover" alt="" /> : editingItem?.imageUrl ? <img src={editingItem.imageUrl} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={32} className="text-[var(--surfer-cyan)]" />}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                </div>
                <GlassButton 
                  type="submit" 
                  disabled={isPosting} 
                  className="w-full py-5 bg-[var(--surfer-cyan)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 text-[#000000]"
                >
                  {isPosting ? <Loader2 className="animate-spin" /> : <Zap size={24} className="text-[var(--surfer-cyan)]" />}
                  <span>{isPosting ? 'מעדכן...' : editingItem ? 'שמור שינויים' : 'פרסם בפורמט WebP'}</span>
                </GlassButton>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;