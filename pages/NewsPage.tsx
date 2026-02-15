
import React, { useState, useRef } from 'react';
import { 
  Newspaper, 
  Calendar, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  Activity, 
  Info, 
  Plus, 
  X, 
  Camera, 
  Loader2, 
  Image as ImageIcon, 
  Heart, 
  MessageCircle,
  Send,
  Waves
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { storage } from '../services/firebase';
import { NewsItem } from '../types';

interface NewsPageProps {
  news: NewsItem[];
  onAddNews: (details: Omit<NewsItem, 'id'>) => void;
}

const NewsPage: React.FC<NewsPageProps> = ({ news, onAddNews }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  // Form State
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
    if (!title || !content) return;

    setIsPosting(true);
    try {
      let imageUrl = '';
      
      // Upload image to Firebase Storage if selected
      if (selectedImage) {
        const storageRef = ref(storage, `news/${Date.now()}_${selectedImage.name}`);
        const snapshot = await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // Persist to database via parent handler
      onAddNews({
        title,
        content,
        category,
        date: new Date().toISOString().split('T')[0],
        imageUrl: imageUrl || undefined
      });

      // Reset form
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
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-blue-50/60 rounded-full blur-[120px] -mr-64"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-50/40 rounded-full blur-[130px]"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-blue-100 shadow-sm">
              <Newspaper size={12} className="text-blue-500" />
              חדשות המערכת
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">מה חדש בקהילה?</h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">הישארו מעודכנים בכל הפעילויות וההודעות האחרונות של חבל זוג.</p>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-md hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 group/mainbtn"
          >
            <Plus size={24} className="group-hover/mainbtn:rotate-90 transition-transform" />
            <span>שתף עדכון חדש</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-14">
          {news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => {
            const { label, icon } = getCategoryDetails(item.category);
            return (
              <article 
                key={item.id} 
                className="group flex flex-col lg:flex-row gap-10 bg-white p-4 rounded-[4rem] border border-slate-100 hover:shadow-[0_40px_100px_-20px_rgba(59,130,246,0.1)] transition-all duration-700 hover:-translate-y-1"
              >
                {item.imageUrl && (
                  <div className="lg:w-2/5 aspect-[16/10] lg:aspect-square rounded-[3rem] overflow-hidden relative shadow-2xl shadow-blue-100/20">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
                    <div className="absolute bottom-6 right-6">
                       <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          {icon}
                          {label}
                       </div>
                    </div>
                  </div>
                )}
                
                <div className={`flex-1 flex flex-col justify-center p-8 lg:p-14 ${!item.imageUrl ? 'text-center items-center' : ''}`}>
                  <div className="flex items-center gap-4 mb-6 text-slate-400">
                    {!item.imageUrl && (
                      <div className="px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        {icon}
                        {label}
                      </div>
                    )}
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
                      <Calendar size={14} className="text-blue-500" />
                      {new Date(item.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-black text-slate-950 mb-8 group-hover:text-blue-600 transition-colors tracking-tighter leading-tight">
                    {item.title}
                  </h3>
                  
                  <div className="text-slate-500 font-bold leading-relaxed mb-10 text-lg whitespace-pre-wrap italic">
                    {item.content}
                  </div>

                  <button className="flex items-center gap-3 text-slate-950 font-black text-xs uppercase tracking-[0.4em] group/btn hover:text-blue-600 transition-colors w-fit">
                    קרא עוד
                    <ArrowLeft size={18} className="text-blue-500 group-hover/btn:translate-x-[-8px] transition-transform" />
                  </button>
                </div>
              </article>
            );
          })}

          {news.length === 0 && (
            <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200">
                <Newspaper size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">שקט במערכת</h3>
              <p className="text-slate-400 mt-2 font-medium text-lg">אין עדכונים חדשים כרגע. נשמור אתכם מעודכנים!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create News Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden p-10 md:p-14 relative animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-8 left-8 p-3 text-slate-400 hover:text-slate-950 transition-colors z-50 bg-white/80 rounded-full"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-4 mb-10">
               <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Waves size={28} />
               </div>
               <h3 className="text-3xl font-black text-slate-950 tracking-tight">שתפו את הקהילה</h3>
            </div>
            
            <form onSubmit={handlePostSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">כותרת הכתבה</label>
                <input 
                  type="text" 
                  required 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="על מה העדכון?"
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-blue-400 shadow-inner" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">סוג העדכון</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-blue-400 shadow-inner"
                >
                  <option value="Update">עדכון כללי</option>
                  <option value="Activity">פעילות שטח</option>
                  <option value="Announcement">הודעה חשובה</option>
                  <option value="Personal">חוויה אישית</option>
                  <option value="Share">רוצה לשתף</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">תוכן הכתבה</label>
                <textarea 
                  required 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="פרט כאן את החדשות..."
                  className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-400 shadow-inner min-h-[160px] resize-none leading-relaxed italic" 
                />
              </div>

              {/* Image Upload Area */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">הוסף תמונה</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full aspect-video rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${previewUrl ? 'border-blue-400' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-3">
                        <Camera size={24} />
                        <span className="font-black text-sm uppercase">החלף תמונה</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto shadow-sm">
                        <ImageIcon size={28} />
                      </div>
                      <p className="text-slate-400 font-bold text-xs">לחץ להעלאת תמונה לכתבה</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isPosting}
                className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black text-2xl hover:bg-blue-600 transition-all shadow-2xl flex items-center justify-center gap-6 disabled:opacity-50 group/sharebtn"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="animate-spin" size={28} />
                    <span>מעלה לשרת...</span>
                  </>
                ) : (
                  <>
                    <Send size={28} className="group-hover/sharebtn:translate-x-[-10px] transition-transform" />
                    <span>שתף עם הקהילה</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
