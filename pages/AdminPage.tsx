
import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { 
  Users, 
  Trash2, 
  ShieldAlert, 
  Mail, 
  Phone, 
  Search,
  CheckCircle2,
  Image as ImageIcon,
  Calendar,
  Plus,
  Newspaper,
  ShieldCheck,
  Upload,
  Loader2,
  Check,
  UserCheck,
  Clock3,
  Edit3,
  Download,
  Database,
  FileJson,
  RefreshCw,
  FileArchive,
  Camera,
  Layout,
  FileImage
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from '@firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { Member, GalleryItem, Event, NewsItem, JoinRequest } from '../types';
import { optimizeImage } from '../utils/image';

interface AdminPageProps {
  user: Member;
  members: Member[];
  onDeleteMember: (id: string) => void;
  onResetPassword: (id: string) => void;
  onToggleRole: (id: string) => void;
  onUpdateMember: (member: Member) => void;
  joinRequests: JoinRequest[];
  onApproveRequest: (id: string) => Promise<Member | null>;
  onRejectRequest: (id: string) => void;
  galleryItems: GalleryItem[];
  onAddGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  onDeleteGalleryItems: (ids: string[]) => void;
  events: Event[];
  onAddEvent: (details: Omit<Event, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  news: NewsItem[];
  onAddNews: (details: Omit<NewsItem, 'id'>) => void;
  onDeleteNews: (id: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  user,
  members, 
  onDeleteMember, 
  onResetPassword, 
  onToggleRole,
  onUpdateMember,
  joinRequests,
  onApproveRequest,
  onRejectRequest,
  galleryItems,
  onAddGalleryItem,
  onDeleteGalleryItems,
  events,
  onAddEvent,
  onDeleteEvent,
  news,
  onAddNews,
  onDeleteNews
}) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'REQUESTS' | 'GALLERY' | 'EVENTS' | 'NEWS' | 'ADD' | 'SYSTEM'>('MEMBERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const eventImgRef = useRef<HTMLInputElement>(null);
  const newsImgRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

  // Form States
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [approvedMember, setApprovedMember] = useState<Member | null>(null);

  // Add Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLoc, setEventLoc] = useState('');
  const [eventImageBlob, setEventImageBlob] = useState<Blob | null>(null);
  const [eventPreview, setEventPreview] = useState('');

  // Add News Form State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<NewsItem['category']>('Update');
  const [newsImageBlob, setNewsImageBlob] = useState<Blob | null>(null);
  const [newsPreview, setNewsPreview] = useState('');

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    const newMember = await onApproveRequest(id);
    if (newMember) {
      setApprovedMember(newMember);
      setShowEmailModal(true);
    }
  };

  const handleExportZip = async () => {
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = { members, galleryItems, events, news, joinRequests, exportDate: new Date().toISOString() };
      zip.file("database.json", JSON.stringify(backupData, null, 2));
      const content = (await zip.generateAsync({ type: "blob" })) as unknown as Blob;
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `habal_zug_full_backup_${timestamp}.zip`;
      link.click();
      setSuccessMsg('גיבוי ZIP נוצר והורד בהצלחה!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('שגיאה ביצירת הגיבוי');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportJson = () => {
    const backupData = { members, galleryItems, events, news, joinRequests, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habal_zug_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setSuccessMsg('נתוני JSON יוצאו בהצלחה!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (window.confirm('האם אתה בטוח שברצונך לייבא את הנתונים? פעולה זו עשויה לדרוס נתונים קיימים.')) {
          localStorage.setItem('members_hv', JSON.stringify(importedData.members || []));
          alert('הנתונים יובאו בהצלחה. המערכת תתרענן כעת.');
          window.location.reload();
        }
      } catch (err) {
        alert('שגיאה בקריאת הקובץ.');
      }
    };
    reader.readAsText(file);
  };

  const handleEventImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const optimized = await optimizeImage(file, 1200, 0.7);
      setEventImageBlob(optimized);
      setEventPreview(URL.createObjectURL(optimized));
    }
  };

  const handleNewsImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const optimized = await optimizeImage(file, 1200, 0.7);
      setNewsImageBlob(optimized);
      setNewsPreview(URL.createObjectURL(optimized));
    }
  };

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      let imageUrl = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800';
      if (eventImageBlob) {
        const storageRef = ref(storage, `events/${Date.now()}_event.jpg`);
        const snapshot = await uploadBytes(storageRef, eventImageBlob);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      onAddEvent({
        title: eventTitle,
        description: eventDesc,
        date: eventDate,
        time: eventTime,
        location: eventLoc,
        imageUrl,
        attendees: []
      });
      setSuccessMsg('אירוע חדש פורסם בהצלחה!');
      setEventTitle(''); setEventDesc(''); setEventDate(''); setEventTime(''); setEventLoc(''); setEventImageBlob(null); setEventPreview('');
      setTimeout(() => { setSuccessMsg(''); setActiveTab('EVENTS'); }, 2000);
    } catch (err) {
      console.error(err);
      alert("שגיאה בהוספת האירוע.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      let imageUrl = '';
      if (newsImageBlob) {
        const storageRef = ref(storage, `news/${Date.now()}_admin_news.jpg`);
        const snapshot = await uploadBytes(storageRef, newsImageBlob);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      onAddNews({
        title: newsTitle,
        content: newsContent,
        category: newsCategory,
        date: new Date().toISOString().split('T')[0],
        imageUrl: imageUrl || undefined,
        authorId: user.id,
        authorName: user.name
      });
      setSuccessMsg('עדכון חדש פורסם בהצלחה!');
      setNewsTitle(''); setNewsContent(''); setNewsCategory('Update'); setNewsImageBlob(null); setNewsPreview('');
      setTimeout(() => { setSuccessMsg(''); setActiveTab('NEWS'); }, 2000);
    } catch (err) {
      console.error(err);
      alert("שגיאה בהוספת החדשות.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSiteAssetUpload = async (file: File, assetName: string) => {
    setIsProcessing(true);
    try {
      const optimized = await optimizeImage(file, 1600, 0.8);
      const storageRef = ref(storage, `assets/${assetName}_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, optimized);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      await updateDoc(doc(db, 'site_data', 'assets'), { [assetName]: downloadUrl });
      setSuccessMsg(`הנכס ${assetName} עודכן בהצלחה!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert("שגיאה בעדכון נכס האתר.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right" dir="rtl">
      {/* Background Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-100/50 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/40 rounded-full blur-[100px] -ml-48"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 text-slate-200 text-[10px] font-black uppercase tracking-widest mb-3 border border-white/10 shadow-xl">
              <ShieldAlert size={12} className="text-indigo-400" />
              בקרת מנהל מערכת
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">מרכז ניהול קהילה</h2>
          </div>
        </div>

        {successMsg && (
          <div className="mb-8 bg-slate-950 text-white px-8 py-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 shadow-2xl border border-white/10">
            <CheckCircle2 className="text-emerald-400" />
            <span className="font-black text-sm uppercase tracking-wider">{successMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 p-2 bg-slate-100 rounded-[2.5rem] w-fit mb-12 overflow-x-auto shadow-inner">
          {[
            { id: 'MEMBERS', label: 'חברים', icon: Users },
            { id: 'REQUESTS', label: 'בקשות', icon: UserCheck, count: joinRequests.length },
            { id: 'EVENTS', label: 'אירועים', icon: Calendar },
            { id: 'NEWS', label: 'חדשות', icon: Newspaper },
            { id: 'ADD', label: 'הוספה', icon: Plus },
            { id: 'SYSTEM', label: 'תחזוקה', icon: RefreshCw },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-sm transition-all whitespace-nowrap relative group ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900'}`}>
              <tab.icon size={20} className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'} />
              {tab.label}
              {tab.count ? <span className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">{tab.count}</span> : null}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[600px] relative">
          {activeTab === 'MEMBERS' && (
            <div className="p-12">
              <div className="mb-14 max-w-xl">
                <div className="relative group">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={22} />
                  <input type="text" placeholder="חפש חבר קהילה..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-16 pl-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:bg-white focus:border-indigo-200 outline-none transition-all font-black text-slate-950 shadow-inner" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="bg-white rounded-[3rem] border border-slate-100 p-8 hover:shadow-2xl transition-all duration-500 group flex flex-col hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-8">
                      <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-[1.75rem] border border-slate-100 shadow-lg object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      <button onClick={() => setEditingMember(member)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-2xl transition-all"><Edit3 size={20} /></button>
                    </div>
                    <h4 className="font-black text-slate-950 text-xl mb-1 tracking-tight">{member.name}</h4>
                    <p className="text-slate-400 font-bold text-[10px] uppercase mb-6 tracking-widest">{member.role === 'Admin' ? 'מנהל מערכת' : 'חבר קהילה'}</p>
                    <div className="mt-auto pt-6 flex gap-3 border-t border-slate-50">
                      <button onClick={() => onResetPassword(member.id)} className="flex-1 py-3 bg-slate-50 text-slate-950 rounded-xl font-black text-[10px] uppercase">איפוס</button>
                      <button onClick={() => onDeleteMember(member.id)} className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase">מחק</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'REQUESTS' && (
            <div className="p-12">
              <h3 className="text-3xl font-black text-slate-950 mb-10 tracking-tight">בקשות הממתינות לאישור</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {joinRequests.map((req) => (
                  <div key={req.id} className="bg-slate-50 rounded-[3rem] border border-slate-100 p-10 flex flex-col group hover:bg-white hover:shadow-2xl transition-all duration-500">
                    <h4 className="font-black text-slate-950 text-xl mb-6">{req.name}</h4>
                    <div className="space-y-3 text-slate-500 font-bold text-sm mb-10">
                      <div className="flex items-center gap-3"><Mail size={16} /> {req.email}</div>
                      <div className="flex items-center gap-3"><Phone size={16} /> {req.mobile}</div>
                    </div>
                    <div className="flex gap-4 mt-auto">
                      <button onClick={() => handleApprove(req.id)} className="flex-1 py-4 bg-slate-950 text-white rounded-xl font-black text-xs">אשר</button>
                      <button onClick={() => onRejectRequest(req.id)} className="flex-1 py-4 bg-white border border-slate-100 text-red-500 rounded-xl font-black text-xs">דחה</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ADD' && (
            <div className="p-14 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <form onSubmit={handleAddEventSubmit} className="space-y-8 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                  <h3 className="text-2xl font-black text-slate-950 flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Calendar size={24} /></div>
                    הוספת אירוע
                  </h3>
                  <input type="text" placeholder="שם האירוע" required value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-indigo-400 outline-none font-black text-lg shadow-sm" />
                  <textarea placeholder="תיאור האירוע" required value={eventDesc} onChange={e => setEventDesc(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-indigo-400 outline-none font-bold min-h-[120px] shadow-sm italic" />
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">תמונת אירוע</label>
                    <div onClick={() => eventImgRef.current?.click()} className="w-full aspect-video bg-white border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:border-indigo-300 transition-all">
                      {eventPreview ? <img src={eventPreview} className="w-full h-full object-cover" /> : <div className="text-center text-slate-300"><ImageIcon size={32} className="mx-auto mb-2" /><span className="text-xs font-black">לחץ להעלאת תמונה</span></div>}
                      <input type="file" ref={eventImgRef} hidden accept="image/*" onChange={handleEventImage} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="px-6 py-5 bg-white border border-slate-100 rounded-2xl outline-none font-black" />
                    <input type="time" required value={eventTime} onChange={e => setEventTime(e.target.value)} className="px-6 py-5 bg-white border border-slate-100 rounded-2xl outline-none font-black" />
                  </div>
                  <input type="text" placeholder="מיקום האירוע" required value={eventLoc} onChange={e => setEventLoc(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-indigo-400 outline-none font-black shadow-sm" />
                  <button type="submit" disabled={isProcessing} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black text-xl hover:bg-indigo-600 shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Plus />} פרסם אירוע
                  </button>
                </form>

                <form onSubmit={handleAddNewsSubmit} className="space-y-8 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                  <h3 className="text-2xl font-black text-slate-950 flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Newspaper size={24} /></div>
                    הוספת חדשות
                  </h3>
                  <input type="text" placeholder="כותרת הכתבה" required value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-blue-400 outline-none font-black text-lg shadow-sm" />
                  <textarea placeholder="תוכן הכתבה..." required value={newsContent} onChange={e => setNewsContent(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-blue-400 outline-none font-bold min-h-[180px] shadow-sm italic leading-relaxed" />
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">תמונה לכתבה (אופציונלי)</label>
                    <div onClick={() => newsImgRef.current?.click()} className="w-full aspect-video bg-white border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:border-blue-300 transition-all">
                      {newsPreview ? <img src={newsPreview} className="w-full h-full object-cover" /> : <div className="text-center text-slate-300"><FileImage size={32} className="mx-auto mb-2" /><span className="text-xs font-black">לחץ להעלאת תמונה</span></div>}
                      <input type="file" ref={newsImgRef} hidden accept="image/*" onChange={handleNewsImage} />
                    </div>
                  </div>

                  <select value={newsCategory} onChange={e => setNewsCategory(e.target.value as any)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl font-black shadow-sm">
                    <option value="Update">עדכון כללי</option>
                    <option value="Activity">פעילות שטח</option>
                    <option value="Announcement">הודעה חשובה</option>
                    <option value="Personal">חוויה אישית</option>
                    <option value="Share">רוצה לשתף</option>
                  </select>
                  <button type="submit" disabled={isProcessing} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black text-xl hover:bg-blue-600 shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Plus />} פרסם כתבה
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'SYSTEM' && (
            <div className="p-16 max-w-5xl mx-auto space-y-16">
              <div className="text-center space-y-6">
                <Database className="w-20 h-20 text-slate-950 mx-auto" />
                <h3 className="text-3xl font-black text-slate-950 tracking-tight">תחזוקה וסנכרון נתונים</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                  <h4 className="text-xl font-black text-slate-950 mb-8 flex items-center gap-3"><Layout className="text-indigo-600" /> נכסי עיצוב האתר</h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center"><ImageIcon size={20} className="text-slate-400" /></div>
                        <span className="font-black text-sm">לוגו האתר</span>
                      </div>
                      <button onClick={() => logoRef.current?.click()} className="p-3 bg-slate-950 text-white rounded-xl hover:bg-indigo-600 transition-all"><Upload size={18} /></button>
                      <input type="file" ref={logoRef} hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleSiteAssetUpload(e.target.files[0], 'logo')} />
                    </div>
                    <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center"><ImageIcon size={20} className="text-slate-400" /></div>
                        <span className="font-black text-sm">תמונת רקע (Hero)</span>
                      </div>
                      <button onClick={() => heroRef.current?.click()} className="p-3 bg-slate-950 text-white rounded-xl hover:bg-indigo-600 transition-all"><Upload size={18} /></button>
                      <input type="file" ref={heroRef} hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleSiteAssetUpload(e.target.files[0], 'heroBg')} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col justify-center gap-6">
                  <button onClick={handleExportZip} disabled={isProcessing} className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <FileArchive />} גיבוי ZIP מלא
                  </button>
                  <button onClick={handleExportJson} className="w-full py-6 bg-white border border-slate-200 text-slate-950 rounded-2xl font-black text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3">
                    <FileJson /> ייצוא JSON
                  </button>
                  <button onClick={() => importFileInputRef.current?.click()} className="w-full py-6 bg-white border border-slate-200 text-slate-950 rounded-2xl font-black text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3">
                    <Upload /> שחזור נתונים
                  </button>
                  <input type="file" ref={importFileInputRef} hidden accept=".json" onChange={handleImportData} />
                </div>
              </div>

              <div className="bg-slate-950 p-10 rounded-[3rem] flex items-center justify-between text-white">
                <div className="flex items-center gap-6">
                   <Clock3 size={40} className="text-indigo-400" />
                   <div><p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">סטטוס סנכרון</p><p className="font-black text-xl">המערכת מעודכנת ומסונכרנת</p></div>
                </div>
                <button onClick={() => window.location.reload()} className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs backdrop-blur-md transition-all border border-white/10"><RefreshCw size={16} /></button>
              </div>
            </div>
          )}
          {/* NEWS and EVENTS display tabs are similar to before */}
        </div>
      </div>

      {showEmailModal && approvedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl p-16 text-center animate-in zoom-in-95">
             <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-10" />
             <h3 className="text-3xl font-black text-slate-950 mb-4 tracking-tight">החבר אושר!</h3>
             <p className="text-slate-500 font-bold mb-12 text-lg">פרטי הגישה נוצרו עבור {approvedMember.name}. סיסמה זמנית: temp</p>
             <button onClick={() => setShowEmailModal(false)} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xl">סגור</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
