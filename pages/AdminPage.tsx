
import React, { useState, useRef } from 'react';
import { 
  Users, 
  Trash2, 
  ShieldAlert, 
  Mail, 
  Phone, 
  Search,
  CheckCircle2,
  ShieldX,
  Loader2,
  X,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Clock,
  Palette,
  Camera,
  Save,
  ImageIcon,
  UserCog,
  Waves,
  Plus,
  Bird,
  Anchor,
  Trash,
  Calendar,
  Newspaper,
  Star,
  LogIn,
  Edit2,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Music,
  AlertTriangle,
  MessageSquare,
  Copy,
  ExternalLink
} from 'lucide-react';
import { doc, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { Member, JoinRequest, Event, NewsItem } from '../types';

const XLogo = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

interface AdminPageProps {
  user: Member;
  members: Member[];
  onDeleteMember: (id: string) => Promise<void>;
  onResetPassword: (id: string) => Promise<void>;
  onToggleRole: (id: string) => Promise<void>;
  onUpdateMember: (member: Member) => Promise<void>;
  joinRequests: JoinRequest[];
  onApproveRequest: (id: string) => Promise<{ name: string; mobile: string; tempPassword: string } | null>;
  onRejectRequest: (id: string) => Promise<void>;
  siteAssets: { 
    clubLogo?: string; 
    atalefLogo?: string; 
    habalZugLogo?: string;
    heroBg?: string; 
    loginBg?: string;
    extraLogos?: string[]; 
    extraHeroImages?: string[] 
  };
  events: Event[];
  news: NewsItem[];
  onDeleteEvent: (id: string) => Promise<void>;
  onDeleteNews: (id: string) => Promise<void>;
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  members, 
  onDeleteMember, 
  onResetPassword, 
  onToggleRole, 
  onUpdateMember,
  joinRequests,
  onApproveRequest,
  onRejectRequest,
  siteAssets,
  events,
  news,
  onDeleteEvent,
  onDeleteNews
}) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'REQUESTS' | 'EVENTS' | 'NEWS' | 'SITE'>('MEMBERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [approvedResult, setApprovedResult] = useState<{ name: string; mobile: string; tempPassword: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'extraLogo' | 'extraHero' | 'memberAvatar' | null>(null);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try { 
      const result = await onApproveRequest(id); 
      if (result) setApprovedResult(result);
    } catch (err) {
      console.error(err);
      alert('שגיאה בתהליך האישור');
    } finally { setIsProcessing(null); }
  };

  const sendWhatsApp = (name: string, mobile: string, pass: string) => {
    const cleanedMobile = mobile.replace(/\D/g, '');
    const mobileWithPrefix = cleanedMobile.startsWith('0') ? `972${cleanedMobile.substring(1)}` : cleanedMobile;
    const message = encodeURIComponent(`שלום ${name}, ברוך הבא לקהילת חבל זוג! 🌊\n\nחשבונך אושר בהצלחה. סיסמת הגישה הזמנית שלך היא: ${pass}\n\nמומלץ להיכנס בהקדם ולשנות את הסיסמה בפרופיל האישי.\nנתראה במים! 🏄‍♂️`);
    window.open(`https://wa.me/${mobileWithPrefix}?text=${message}`, '_blank');
  };

  const handleReject = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך לדחות את הבקשה?')) {
      setIsProcessing(id);
      try { await onRejectRequest(id); } finally { setIsProcessing(null); }
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsProcessing('SAVE_EDIT');
    try {
      await onUpdateMember(editingMember);
      setEditingMember(null);
    } catch (err) {
      console.error(err);
      alert('שגיאה בשמירת הפרטים');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;

    setIsUploading(uploadType);
    try {
      const storageRef = ref(storage, `site_assets/${uploadType}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      if (uploadType === 'memberAvatar' && editingMember) {
        setEditingMember({ ...editingMember, avatar: url });
      } else {
        const assetsRef = doc(db, 'site_data', 'assets');
        if (uploadType === 'extraLogo') {
          await updateDoc(assetsRef, { extraLogos: arrayUnion(url) });
        } else if (uploadType === 'extraHero') {
          await updateDoc(assetsRef, { extraHeroImages: arrayUnion(url) });
        }
        alert('הקובץ הועלה בהצלחה!');
      }
    } catch (err) {
      console.error(err);
      alert('שגיאה בהעלאת הקובץ.');
    } finally {
      setIsUploading(null);
      setUploadType(null);
    }
  };

  const removeAsset = async (type: 'extraLogo' | 'extraHero', url: string) => {
    if (!window.confirm('האם למחוק נכס זה?')) return;
    const assetsRef = doc(db, 'site_data', 'assets');
    const field = type === 'extraLogo' ? 'extraLogos' : 'extraHeroImages';
    await updateDoc(assetsRef, { [field]: arrayRemove(url) });
  };

  const setAsPrimary = async (type: 'clubLogo' | 'atalefLogo' | 'habalZugLogo' | 'heroBg' | 'loginBg', url: string) => {
    const assetsRef = doc(db, 'site_data', 'assets');
    await setDoc(assetsRef, { [type]: url }, { merge: true });
    alert('עודכן כראשי!');
  };

  const triggerUpload = (type: 'extraLogo' | 'extraHero' | 'memberAvatar') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const combinedLogos = Array.from(new Set([
    ...(siteAssets.clubLogo ? [siteAssets.clubLogo] : []),
    ...(siteAssets.atalefLogo ? [siteAssets.atalefLogo] : []),
    ...(siteAssets.habalZugLogo ? [siteAssets.habalZugLogo] : []),
    ...(siteAssets.extraLogos || [])
  ]));

  const combinedHeroes = Array.from(new Set([
    ...(siteAssets.heroBg ? [siteAssets.heroBg] : []),
    ...(siteAssets.loginBg ? [siteAssets.loginBg] : []),
    ...(siteAssets.extraHeroImages || [])
  ]));

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 bg-white text-right">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
        
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest mb-4 shadow-xl">
              <ShieldAlert size={12} className="text-rose-400" />
              מרכז שליטה
            </div>
            <h2 className="text-5xl font-black text-slate-950 tracking-tighter mb-3">ניהול קהילה</h2>
          </div>
          
          <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100 flex-wrap gap-1">
            {[
              { id: 'MEMBERS', label: 'חברים', icon: Users },
              { id: 'REQUESTS', label: 'בקשות', icon: UserPlus },
              { id: 'EVENTS', label: 'אירועים', icon: Calendar },
              { id: 'NEWS', label: 'חדשות', icon: Newspaper },
              { id: 'SITE', label: 'נכסים', icon: Palette }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-[1.5rem] font-black text-[11px] transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400'}`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAssetUpload} />

        <div className="space-y-6">
          {activeTab === 'MEMBERS' && (
            <>
              <div className="mb-10 relative group">
                <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={24} />
                <input 
                  type="text" 
                  placeholder="חפש חבר..." 
                  className="w-full pr-20 pl-10 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] focus:bg-white outline-none transition-all font-black text-slate-950"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">חבר נבחרת</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">תפקיד</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <img src={m.avatar} className="w-14 h-14 rounded-2xl object-cover" alt={m.name} />
                            <div>
                              <p className="font-black text-slate-950 text-lg leading-none mb-1">{m.name}</p>
                              <p className="text-slate-400 font-bold text-xs">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <button 
                            onClick={() => onToggleRole(m.id)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${m.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-400'}`}
                          >
                            {m.role === 'Admin' ? 'מנהל' : 'חבר'}
                          </button>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={() => setEditingMember(m)}
                              className="p-3 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-all"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => { if(window.confirm('למחוק חבר זה?')) onDeleteMember(m.id); }}
                              className="p-3 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl hover:bg-rose-50 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'REQUESTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {joinRequests.length > 0 ? (
                joinRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center gap-6 mb-8">
                      <img src={req.avatar} className="w-20 h-20 rounded-[1.5rem] object-cover border-2 border-slate-50 shadow-sm" alt={req.name} />
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{req.name}</h4>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-slate-400 text-xs font-black flex items-center gap-2"><Mail size={12} /> {req.email}</p>
                          <p className="text-slate-400 text-xs font-black flex items-center gap-2"><Phone size={12} /> {req.mobile || 'לא צוין'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleApprove(req.id)} 
                        disabled={isProcessing === req.id}
                        className="flex-1 py-5 bg-slate-950 text-white rounded-2xl font-black text-md hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isProcessing === req.id ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} />}
                        אישור
                      </button>
                      <button 
                        onClick={() => handleReject(req.id)} 
                        disabled={isProcessing === req.id}
                        className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-md hover:bg-rose-50 hover:text-rose-500 transition-all"
                      >
                        דחייה
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-40 text-center flex flex-col items-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                      <UserPlus size={40} />
                   </div>
                   <h4 className="text-2xl font-black text-slate-900 tracking-tight">אין בקשות ממתינות</h4>
                   <p className="text-slate-400 mt-2 font-bold">כשמישהו יבקש להצטרף לנבחרת, תראה אותו כאן.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'EVENTS' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-950 mb-4">ניהול אירועים</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(event => (
                  <div key={event.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <img src={event.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt="" />
                       <div>
                         <h4 className="font-black text-slate-900">{event.title}</h4>
                         <p className="text-slate-400 text-xs font-bold">{event.date} | {event.location}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => onDeleteEvent(event.id)}
                      className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'NEWS' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-950 mb-4">ניהול חדשות</h3>
              <div className="space-y-4">
                {news.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       {item.imageUrl ? (
                         <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt="" />
                       ) : (
                         <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center"><Newspaper className="text-slate-300" /></div>
                       )}
                       <div>
                         <h4 className="font-black text-slate-900">{item.title}</h4>
                         <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{item.date} | {item.authorName}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => onDeleteNews(item.id)}
                      className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SITE' && (
            <div className="grid grid-cols-1 gap-12">
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2">
                 <AlertTriangle size={16} className="text-amber-500" />
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                   אם אתה לא מפתח Front End אל תגע
                 </p>
                 <AlertTriangle size={16} className="text-amber-500" />
               </div>

               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                          <Plus size={24} />
                       </div>
                       <h3 className="text-2xl font-black text-slate-950">ניהול לוגואים</h3>
                    </div>
                    <button onClick={() => triggerUpload('extraLogo')} className="px-6 py-3 bg-slate-950 text-white rounded-2xl font-black text-xs flex items-center gap-2">
                      {isUploading === 'extraLogo' ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                      העלאת לוגו
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                    {combinedLogos.map((url, i) => {
                      const isClub = url === siteAssets.clubLogo;
                      const isAtalef = url === siteAssets.atalefLogo;
                      const isHabalZug = url === siteAssets.habalZugLogo;
                      return (
                        <div key={i} className={`relative group aspect-square bg-slate-50 rounded-3xl border-2 flex items-center justify-center p-4 transition-all ${isClub || isAtalef || isHabalZug ? 'border-indigo-500 shadow-lg' : 'border-slate-100'}`}>
                          <img src={url} className="max-h-full max-w-full object-contain" alt="Logo Asset" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                            <button onClick={() => setAsPrimary('habalZugLogo', url)} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${isHabalZug ? 'bg-indigo-500 text-white' : 'bg-white text-slate-950'}`}>ראשי - חבל זוג</button>
                            <button onClick={() => setAsPrimary('clubLogo', url)} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${isClub ? 'bg-indigo-500 text-white' : 'bg-white text-slate-950'}`}>ראשי - ריף</button>
                            <button onClick={() => setAsPrimary('atalefLogo', url)} className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${isAtalef ? 'bg-indigo-500 text-white' : 'bg-white text-slate-950'}`}>ראשי - עטלף</button>
                            <button onClick={() => removeAsset('extraLogo', url)} className="w-full py-1.5 bg-rose-500 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter">מחיקה</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                          <ImageIcon size={24} />
                       </div>
                       <h3 className="text-2xl font-black text-slate-950">ניהול רקעים (Hero)</h3>
                    </div>
                    <button onClick={() => triggerUpload('extraHero')} className="px-6 py-3 bg-slate-950 text-white rounded-2xl font-black text-xs flex items-center gap-2">
                      {isUploading === 'extraHero' ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                      הוספת רקע
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {combinedHeroes.map((url, i) => {
                      const isMain = url === siteAssets.heroBg;
                      const isLogin = url === siteAssets.loginBg;
                      return (
                        <div key={i} className={`relative group rounded-3xl overflow-hidden border-4 transition-all ${isMain || isLogin ? 'border-indigo-500 shadow-xl' : 'border-slate-50'}`}>
                          <img src={url} className="w-full h-40 object-cover" alt="Hero Asset" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                             <div className="flex items-center gap-2 w-full">
                               <button onClick={() => setAsPrimary('heroBg', url)} className={`flex-1 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${isMain ? 'bg-indigo-500 text-white' : 'bg-white text-slate-950'}`}>קבע כראשי</button>
                               <button onClick={() => setAsPrimary('loginBg', url)} className={`flex-1 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${isLogin ? 'bg-rose-500 text-white' : 'bg-white text-slate-950'}`}>רקע כניסה</button>
                             </div>
                             <button onClick={() => removeAsset('extraHero', url)} className="w-full py-2 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase">מחיקה</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Success Modal */}
      {approvedResult && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-2xl p-14 relative animate-in zoom-in-95 text-center">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <CheckCircle2 size={64} />
            </div>
            
            <h3 className="text-4xl font-black text-slate-950 mb-4 tracking-tighter">המועמד אושר!</h3>
            <p className="text-slate-500 font-bold text-lg mb-10 leading-relaxed">
               חשבון נוצר עבור <span className="text-slate-900">{approvedResult.name}</span>.<br/>שלח לו את פרטי הגישה הזמניים עכשיו.
            </p>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-10 group relative overflow-hidden">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">סיסמה זמנית למשלוח</p>
               <div className="text-4xl font-black text-slate-900 tracking-widest select-all">
                 {approvedResult.tempPassword}
               </div>
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(approvedResult.tempPassword);
                   alert('הסיסמה הועתקה!');
                 }}
                 className="absolute top-4 left-4 p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                 title="העתק סיסמה"
               >
                 <Copy size={16} />
               </button>
            </div>

            <div className="flex flex-col gap-4">
               <button 
                 onClick={() => sendWhatsApp(approvedResult.name, approvedResult.mobile, approvedResult.tempPassword)}
                 className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-4 active:scale-95"
               >
                 <MessageSquare size={24} />
                 <span>שלח בוואטסאפ</span>
               </button>
               
               <button 
                 onClick={() => setApprovedResult(null)}
                 className="w-full py-6 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-950 transition-all"
               >
                 סגור חלונית
               </button>
            </div>
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={() => setEditingMember(null)}>
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <UserCog className="text-indigo-600" size={24} />
                  <h3 className="text-2xl font-black text-slate-950">עריכת פרטי חבר</h3>
               </div>
               <button onClick={() => setEditingMember(null)} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-950 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditSave} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="flex flex-col items-center gap-4 mb-4">
                 <div className="relative group">
                    <img src={editingMember.avatar} className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-100" alt={editingMember.name} />
                    <button type="button" onClick={() => triggerUpload('memberAvatar')} className="absolute -bottom-2 -left-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                       <Camera size={14} />
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שם מלא</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">אימייל</label>
                    <input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={editingMember.email} onChange={e => setEditingMember({...editingMember, email: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">טלפון</label>
                    <input type="tel" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={editingMember.mobile} onChange={e => setEditingMember({...editingMember, mobile: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">תאריך יום הולדת</label>
                    <input type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={editingMember.birthday || ''} onChange={e => setEditingMember({...editingMember, birthday: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">ביוגרפיה</label>
                 <textarea className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold min-h-[100px] resize-none" value={editingMember.bio} onChange={e => setEditingMember({...editingMember, bio: e.target.value})} />
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">רשתות חברתיות</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                       <Facebook className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input type="url" placeholder="Facebook URL" className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs" value={editingMember.facebookUrl || ''} onChange={e => setEditingMember({...editingMember, facebookUrl: e.target.value})} />
                    </div>
                    <div className="relative">
                       <Linkedin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input type="url" placeholder="Linkedin URL" className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs" value={editingMember.linkedinUrl || ''} onChange={e => setEditingMember({...editingMember, linkedinUrl: e.target.value})} />
                    </div>
                    <div className="relative">
                       <Instagram className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input type="url" placeholder="Instagram URL" className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs" value={editingMember.instagramUrl || ''} onChange={e => setEditingMember({...editingMember, instagramUrl: e.target.value})} />
                    </div>
                    <div className="relative">
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"><XLogo size={16} /></div>
                       <input type="url" placeholder="X (Twitter) URL" className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs" value={editingMember.twitterUrl || ''} onChange={e => setEditingMember({...editingMember, twitterUrl: e.target.value})} />
                    </div>
                    <div className="relative">
                       <Music className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input type="url" placeholder="TikTok URL" className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs" value={editingMember.tiktokUrl || ''} onChange={e => setEditingMember({...editingMember, tiktokUrl: e.target.value})} />
                    </div>
                    <div className="relative">
                       <Globe className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input type="url" placeholder="Website URL" className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs" value={editingMember.websiteUrl || ''} onChange={e => setEditingMember({...editingMember, websiteUrl: e.target.value})} />
                    </div>
                 </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-50">
                <button 
                  type="submit" 
                  disabled={isProcessing === 'SAVE_EDIT'}
                  className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing === 'SAVE_EDIT' ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>שמירת שינויים</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
