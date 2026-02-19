import React, { useState, useRef } from 'react';
import { 
  Newspaper, 
  Plus, 
  X, 
  Loader2, 
  Image as ImageIcon, 
  Heart, 
  MessageCircle,
  Send,
  Waves,
  Trash2,
  User,
  Info,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { NewsItem } from '../types';

const NewsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { news, addNews, deleteNews } = useData();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NewsItem['category']>('Update');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const formatDate = (dateValue: string) => {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !content.trim() || isPosting) return;

    setIsPosting(true);
    try {
      let imageUrl = '';
      if (selectedImage) {
        const storageRef = ref(storage, `news/${Date.now()}_${selectedImage.name}`);
        const snapshot = await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addNews({
        title: title.trim(),
        content: content.trim(),
        category,
        date: new Date().toISOString().split('T')[0],
        imageUrl: imageUrl || "", 
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar
      });

      setShowSuccess(true);
      setTimeout(() => {
        setTitle(''); setContent(''); setCategory('Update'); setSelectedImage(null); setPreviewUrl(null);
        setShowSuccess(false); setShowCreateModal(false);
      }, 2000);
    } catch (err) {
      console.error("Posting news failed:", err);
      alert("שגיאה בפרסום. נסה שנית.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק פוסט זה?')) {
      deleteNews(id);
    }
  };

  const getCategoryDetails = (cat: NewsItem['category']) => {
    switch (cat) {
      case 'Update': return { label: 'עדכון', icon: <Info size={12} /> };
      case 'Activity': return { label: 'פעילות', icon: <Activity size={12} /> };
      case 'Announcement': return { label: 'הודעה', icon: <Zap size={12} /> };
      case 'Personal': return { label: 'חוויה אישית', icon: <Heart size={12} /> };
      case 'Share': return { label: 'רוצה לשתף', icon: <MessageCircle size={12} /> };
      default: return { label: 'עדכון', icon: <Info size={12} /> };
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-right p-6 md:p-12 animate-in fade-in" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">פוסטים מהנבחרת</h2>
          <p className="text-slate-500 mt-2 font-medium">עדכונים ושיתופים מחברי חבל זוג.</p>
        </div>
        
        <button 
          onClick={() => { setShowSuccess(false); setShowCreateModal(true); }}
          className="flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-md hover:bg-indigo-600 transition-all shadow-xl"
        >
          <Plus size={24} />
          <span>פרסום פוסט חדש</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {news.length > 0 ? (
          [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => {
            const { label, icon } = getCategoryDetails(item.category);
            return (
              <article key={item.id} className="group flex flex-col lg:flex-row gap-8 bg-white p-4 rounded-[3.5rem] border border-slate-100 hover:shadow-2xl transition-all relative">
                {(currentUser?.role === 'Admin' || item.authorId === currentUser?.id) && (
                  <button onClick={() => handleDelete(item.id)} className="absolute top-8 left-8 p-3 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white shadow-sm z-20"><Trash2 size={18} /></button>
                )}
                {item.imageUrl && (
                  <div className="lg:w-1/3 aspect-video lg:aspect-square rounded-[2.5rem] overflow-hidden">
                    <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                  </div>
                )}
                <div className="flex-1 p-6 lg:p-10">
                  <div className="flex items-center gap-4 mb-4 text-slate-400">
                    <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-slate-500 text-[10px] font-black flex items-center gap-2">{icon}{label}</div>
                    <span className="text-[10px] font-black">{formatDate(item.date)}</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-950 mb-4">{item.title}</h3>
                  <p className="text-slate-500 font-bold leading-relaxed mb-8 text-lg whitespace-pre-wrap">{item.content}</p>
                  <div className="flex items-center gap-3">
                     <img src={item.authorAvatar || ''} className="w-8 h-8 rounded-full object-cover" alt="" />
                     <span className="text-xs font-black text-slate-400">{item.authorName}</span>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center">
            <Newspaper size={48} className="text-slate-200 mb-6" />
            <h3 className="text-2xl font-black text-slate-400">אין עדכונים כרגע</h3>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 relative max-h-[90vh] overflow-y-auto">
            {!showSuccess && <button onClick={() => setShowCreateModal(false)} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-full"><X size={24} /></button>}
            {showSuccess ? (
              <div className="py-20 text-center"><CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" /><h3 className="text-4xl font-black">פורסם!</h3></div>
            ) : (
              <form onSubmit={handlePostSubmit} className="space-y-6">
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת הפוסט" className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none" />
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none">
                  <option value="Update">עדכון כללי</option>
                  <option value="Activity">פעילות שטח</option>
                  <option value="Announcement">הודעה חשובה</option>
                  <option value="Personal">חוויה אישית</option>
                  <option value="Share">רוצה לשתף</option>
                </select>
                <textarea required value={content} onChange={e => setContent(e.target.value)} placeholder="מה הסיפור?" className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none h-40 resize-none" />
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden">
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={32} className="text-slate-300" />}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                </div>
                <button type="submit" disabled={isPosting} className="w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all">
                  {isPosting ? <Loader2 className="animate-spin mx-auto" /> : 'פרסם עכשיו'}
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