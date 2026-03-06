import React, { useState, useRef } from 'react';
import { Newspaper, Plus, X, Loader2, Image as ImageIcon, Heart, MessageCircle, Send, Waves, Trash2, User, Info, Activity, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
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
  const { news, addNews, deleteNews } = useData();
  const { showConfirm } = useModal();

  const [showCreateModal, setShowCreateModal] = useState(false);
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
      let imageUrl = '';
      if (selectedImage) {
        const storageRef = ref(getStorageInstance(), `news/${Date.now()}_post.webp`);
        const snapshot = await uploadBytes(storageRef, selectedImage.blob);
        await syncStorageOnUpload(selectedImage.blob.size);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

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

      setShowSuccess(true);
      setTimeout(() => {
        setTitle(''); setContent(''); setCategory('Update'); setSelectedImage(null);
        setShowSuccess(false); setShowCreateModal(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "שגיאה בפרסום. נסה שנית.");
    } finally {
      setIsPosting(false);
    }
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
    <div className="relative min-h-screen bg-white text-right p-6 md:p-12 animate-in fade-in" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-10 space-y-4">
        {/* Top Badge */}
        <div className="header-badge-glass">
          <Newspaper size={12} className="text-[#00f2fe]" />
          <span>COMMUNITY UPDATES</span>
        </div>

        {/* Main Title */}
        <h1 className="main-page-title">
          פוסטים מהנבחרת
        </h1>

        {/* Subtitle with Emoji context */}
        <div className="flex flex-col items-center gap-6">
          <p className="header-subtitle max-w-2xl">
            עדכונים אופטימליים ורגעים מהחיים של חברי חבל זוג 🗞️
          </p>
          
          <button 
            onClick={() => { setShowSuccess(false); setErrorMsg(null); setShowCreateModal(true); }}
            className="flex items-center gap-4 px-10 py-5 bg-[#006994] text-white rounded-[2rem] font-black text-md hover:bg-[#4E8294] transition-all shadow-xl active:scale-95 group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform text-[#00FFFF]" />
            <span>פרסום פוסט חדש</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {news.length > 0 ? (
          [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
            <article key={item.id} className="group flex flex-col lg:flex-row gap-8 bg-white p-4 rounded-[3.5rem] border border-slate-100 hover:shadow-2xl transition-all relative">
              {(currentUser?.role === 'Admin' || item.authorId === currentUser?.id) && (
                <button onClick={() => handleDelete(item.id)} className="absolute top-8 left-8 p-3 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white shadow-sm z-20"><Trash2 size={18} /></button>
              )}
              {item.imageUrl && (
                <div className="lg:w-1/3 aspect-video lg:aspect-square rounded-[2.5rem] overflow-hidden">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" loading="lazy" />
                </div>
              )}
              <div className="flex-1 p-6 lg:p-10">
                <h3 className="text-3xl font-black text-slate-950 mb-4">{item.title}</h3>
                <p className="text-slate-500 font-bold leading-relaxed mb-8 text-lg whitespace-pre-wrap">{item.content}</p>
                <div className="flex items-center gap-3">
                   {item.authorAvatar ? (
                     <img src={item.authorAvatar} className="w-8 h-8 rounded-full object-cover" alt="" loading="lazy" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                       <User size={14} />
                     </div>
                   )}
                   <span className="text-xs font-black text-slate-400">{item.authorName}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-slate-100 rounded-[4rem]">
            <Newspaper size={48} className="text-slate-200 mb-6 mx-auto" />
            <h3 className="text-2xl font-black text-slate-400">אין עדכונים כרגע</h3>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 relative max-h-[90vh] overflow-y-auto">
            {!showSuccess && <button onClick={() => setShowCreateModal(false)} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-full"><X size={24} /></button>}
            {showSuccess ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
                <h3 className="text-4xl font-black text-[#2B2B2E]">פורסם!</h3>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit} className="space-y-6">
                <h3 className="text-2xl font-black mb-4">יצירת פוסט אופטימלי</h3>
                {errorMsg && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black flex items-center gap-2"><AlertTriangle size={14} /> {errorMsg}</div>}
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת הפוסט" className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none" />
                <textarea required value={content} onChange={e => setContent(e.target.value)} placeholder="מה הסיפור?" className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none h-40 resize-none" />
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden">
                  {selectedImage ? <img src={selectedImage.dataUrl} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={32} className="text-slate-300" />}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                </div>
                <button 
                  type="submit" 
                  disabled={isPosting} 
                  className="w-full py-5 bg-[#006994] text-white rounded-[2rem] font-black text-xl hover:bg-[#4E8294] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {isPosting ? <Loader2 className="animate-spin" /> : <Zap size={24} className="text-[#00FFFF]" />}
                  <span>{isPosting ? 'מפרסם...' : 'פרסם בפורמט WebP'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;