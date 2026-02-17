
import React, { useState, useRef } from 'react';
import { 
  Newspaper, 
  Calendar, 
  ArrowLeft, 
  Plus, 
  X, 
  Camera, 
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
  Zap
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { NewsItem, Member } from '../types';

interface NewsPageProps {
  news: NewsItem[];
  currentUser: Member;
  onAddNews: (details: Omit<NewsItem, 'id'>) => Promise<void>;
  onDeleteNews: (id: string) => void;
}

const NewsPage: React.FC<NewsPageProps> = ({ news, currentUser, onAddNews, onDeleteNews }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
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

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsPosting(true);
    try {
      let imageUrl = '';
      if (selectedImage) {
        const storageRef = ref(storage, `news/${Date.now()}_${selectedImage.name}`);
        const snapshot = await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await onAddNews({
        title: title.trim(),
        content: content.trim(),
        category,
        date: new Date().toISOString().split('T')[0],
        imageUrl: imageUrl || undefined,
        authorId: currentUser.id,
        authorName: currentUser.name
      });

      setTitle('');
      setContent('');
      setCategory('Update');
      setSelectedImage(null);
      setPreviewUrl(null);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Posting news failed:", err);
      alert("שגיאה בפרסום הכתבה. נסה שנית.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק פוסט זה?')) {
      onDeleteNews(id);
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

  const canDelete = (item: NewsItem) => {
    return currentUser.role === 'Admin' || item.authorId === currentUser.id;
  };

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-slate-50 rounded-full blur-[120px] -mr-64"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-slate-200 shadow-sm">
              <Newspaper size={12} className="text-indigo-500" />
              חדשות הקהילה
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">מה חדש במים?</h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">עדכונים, סיפורים והודעות חשובות מחברי חבל זוג.</p>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-md hover:bg-black transition-all shadow-xl active:scale-95 group/mainbtn"
          >
            <Plus size={24} className="group-hover/mainbtn:rotate-90 transition-transform" />
            <span>פרסום פוסט חדש</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {news.length > 0 ? (
            news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => {
              const { label, icon } = getCategoryDetails(item.category);
              return (
                <article 
                  key={item.id} 
                  className="group flex flex-col lg:flex-row gap-8 bg-white p-4 rounded-[3.5rem] border border-slate-100 hover:shadow-2xl transition-all duration-500 relative"
                >
                  {canDelete(item) && (
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-8 left-8 p-3 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm z-20"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  {item.imageUrl && (
                    <div className="lg:w-1/3 aspect-video lg:aspect-square rounded-[2.5rem] overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    </div>
                  )}
                  
                  <div className={`flex-1 flex flex-col justify-center p-6 lg:p-10 ${!item.imageUrl ? 'text-center items-center' : ''}`}>
                    <div className="flex items-center gap-4 mb-4 text-slate-400">
                      <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        {icon}
                        {label}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {new Date(item.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-3xl font-black text-slate-950 mb-4 group-hover:text-indigo-600 transition-colors tracking-tight">
                      {item.title}
                    </h3>
                    
                    <p className="text-slate-500 font-bold leading-relaxed mb-8 text-lg whitespace-pre-wrap">
                      {item.content}
                    </p>

                    <div className="mt-auto flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                       </div>
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.authorName || 'חבר קהילה'}</span>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200">
                <Newspaper size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">אין עדכונים חדשים</h3>
              <p className="text-slate-400 mt-2 font-medium">היה הראשון לשתף משהו מעניין!</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden p-10 md:p-14 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-8 left-8 p-3 text-slate-400 hover:text-slate-950 transition-colors bg-slate-50 rounded-full"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-4 mb-10">
               <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Waves size={28} />
               </div>
               <h3 className="text-3xl font-black text-slate-950 tracking-tight leading-none">שתפו משהו חדש</h3>
            </div>
            
            <form onSubmit={handlePostSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">כותרת הפוסט</label>
                <input 
                  type="text" 
                  required 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="על מה העדכון?"
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:bg-white transition-all shadow-inner" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">קטגוריה</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:bg-white transition-all shadow-inner"
                >
                  <option value="Update">עדכון כללי</option>
                  <option value="Activity">פעילות שטח</option>
                  <option value="Announcement">הודעה חשובה</option>
                  <option value="Personal">חוויה אישית</option>
                  <option value="Share">רוצה לשתף</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">תוכן</label>
                <textarea 
                  required 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="פרטו כאן..."
                  className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white transition-all shadow-inner min-h-[160px] resize-none leading-relaxed" 
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">תמונה (אופציונלי)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${previewUrl ? 'border-indigo-400' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                >
                  {previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">לחץ להעלאה</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isPosting}
                className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-6 disabled:opacity-50"
              >
                {isPosting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                <span>{isPosting ? 'מפרסם...' : 'פרסם עכשיו'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
