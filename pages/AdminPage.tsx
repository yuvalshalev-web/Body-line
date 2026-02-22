
import React, { useState, useRef } from 'react';
import { 
  ShieldAlert, 
  Search,
  Loader2,
  Check,
  X,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Copy,
  RotateCcw,
  MessageCircle,
  Trash2,
  Users,
  Mic,
  Image as ImageIcon,
  Settings,
  Plus,
  UserCircle,
  Camera,
  RefreshCw,
  Pencil,
  Save,
  ChevronLeft,
  Archive
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { JoinRequest, Member } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from '../services/firebase';
import { processImage } from '../utils/imageProcessor';

const ASSET_LABELS: Record<string, string> = {
  habalZugLogo: 'לוגו חבל זוג',
  atalefLogo: 'לוגו עמותת העטלף',
  reefLogo: 'לוגו מועדון ריף',
  heroBg: 'תמונת רקע ראשית',
  loginBg: 'תמונת רקע כניסה',
  favicon: 'אייקון אתר (Favicon)'
};

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    joinRequests, siteAssets, approveRequest, rejectRequest, members, galleryItems, events, deleteEvent, toggleRole, toggleStatus, resetPassword, updateSiteAssets, updateMember, deleteMember
  } = useData();

  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'SITE' | 'USERS' | 'PODCASTS' | 'GALLERY' | 'EVENTS' | 'ARCHIVE'>('REQUESTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [approvedUser, setApprovedUser] = useState<{ name: string; mobile: string; tempPassword: string } | null>(null);
  const [editingAsset, setEditingAsset] = useState<{ key: string, value: string } | null>(null);
  const [isUploadingAsset, setIsUploadingAsset] = useState<string | null>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingAssetKey, setReplacingAssetKey] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;

  const handleAssetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingAssetKey) return;

    setIsUploadingAsset(replacingAssetKey);
    try {
      const processed = await processImage(file, 1200, 0.85);
      const storage = getStorageInstance();
      const storageRef = ref(storage, `assets/site/${replacingAssetKey}_${Date.now()}`);
      
      await uploadBytes(storageRef, processed.blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      await updateSiteAssets({ [replacingAssetKey]: downloadUrl });
      alert('הנכס עודכן בהצלחה');
    } catch (err) {
      console.error(err);
      alert('שגיאה בהעלאת הנכס');
    } finally {
      setIsUploadingAsset(null);
      setReplacingAssetKey(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;
    try {
      await updateSiteAssets({ [editingAsset.key]: editingAsset.value });
      setEditingAsset(null);
    } catch (err) {
      console.error(err);
      alert('שגיאה בעדכון הנכס');
    }
  };

  const resetAssets = async () => {
    if (!window.confirm('האם לאפס את כל הנכסים לערכי ברירת המחדל?')) return;
    const defaults = {
      habalZugLogo: "", // Let user upload the correct one
      atalefLogo: "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fatalef-logo.png?alt=media",
      reefLogo: "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Freef-logo.png?alt=media",
      heroBg: "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media",
      loginBg: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=2000"
    };
    try {
      await updateSiteAssets(defaults);
      alert('הנכסים אופסו בהצלחה');
    } catch (err) {
      console.error(err);
      alert('שגיאה באיפוס הנכסים');
    }
  };

  const filteredRequests = joinRequests.filter(req => 
    req.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    if (!window.confirm('האם לאשר את הצטרפות החבר/ה לנבחרת?')) return;
    setIsProcessing(id);
    try {
      const result = await approveRequest(id);
      if (result) {
        setApprovedUser(result);
      } else {
        alert('הבקשה כבר אינה קיימת או שאושרה על ידי מנהל אחר.');
      }
    } catch (err) {
      console.error(err);
      alert('שגיאה בתהליך האישור. בדוק את החיבור לאינטרנט.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string, name: string, mobile: string) => {
    if (!window.confirm(`האם לדחות את בקשת ההצטרפות של ${name}? הבקשה תימחק והמשתמש יקבל הודעת דחייה.`)) return;
    
    // Send rejection message first
    const cleanMobile = mobile.replace(/\D/g, '');
    const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
    const rejectMsg = `היי *${name}*, תודה על הפנייה ל-אתר חבל זוג 🌊\nכרגע זה פחות מתאים, אבל נשמח לשמור על קשר ולהתעדכן בהמשך במידה ומשהו ישתנה.\nשיהיה אחלה יום! 👋`;
    window.open(`https://wa.me/${finalMobile}?text=${encodeURIComponent(rejectMsg)}`, '_blank');

    setIsProcessing(id);
    try {
      await rejectRequest(id);
    } catch (err) {
      console.error(err);
      alert('שגיאה במחיקת הבקשה.');
    } finally {
      setIsProcessing(null);
    }
  };

  const formatWhatsAppMessage = (name: string, email: string, tempPass: string) => {
    const siteUrl = window.location.origin;
    return `היי *${name}*, איזה כיף! 🌊 הבקשה שלך להצטרפות לאתר קהילת חבל זוג אושרה רשמית. \n\n*פרטי התחברות ראשונית:*\n🔗 כתובת האתר: ${siteUrl}\n👤 שם משתמש: *${email}*\n🔑 סיסמה זמנית: \`${tempPass}\` \n\nלידיעתך: הסיסמה תקפה לכניסה הראשונה בלבד, ולאחריה המערכת תבקש ממך לבחור סיסמה אישית וקבועה.\nנתראה בפנים! צוות האתר 💪`;
  };

  const openWhatsApp = (mobile: string, name: string, email: string, tempPass: string) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
    const message = encodeURIComponent(formatWhatsAppMessage(name, email, tempPass));
    window.open(`https://wa.me/${finalMobile}?text=${message}`, '_blank');
  };

  return (
    <div className="relative min-h-screen bg-white text-right space-y-12 pb-20 pt-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full mb-4">
              <ShieldAlert size={12} className="text-rose-400" /> מנהל מערכת
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">מרכז ניהול</h2>
          </div>
          <div className="flex bg-slate-100 p-2 rounded-[2rem] gap-1 overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'USERS', label: 'משתמשים', icon: Users },
              { id: 'ARCHIVE', label: 'ארכיון', icon: Archive },
              { id: 'PODCASTS', label: 'פודקאסטים', icon: Mic },
              { id: 'GALLERY', label: 'גלריית תמונות', icon: ImageIcon },
              { id: 'EVENTS', label: 'אירועים', icon: Calendar },
              { id: 'REQUESTS', label: `בקשות הצטרפות (${joinRequests.length})`, icon: UserCheck },
              { id: 'SITE', label: 'נכסים', icon: Settings }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'REQUESTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="relative">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
               <input 
                 type="text" 
                 placeholder="חיפוש לפי שם או אימייל..." 
                 className="w-full pr-16 pl-6 py-6 bg-slate-50 rounded-[2.5rem] border-none font-black focus:ring-2 ring-slate-200 shadow-sm"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>

            {filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map(req => (
                  <div key={req.id} className={`bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full ${isProcessing === req.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-start gap-5 mb-8">
                       {req.avatar ? (
                         <img src={req.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                       ) : (
                         <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 shadow-md">
                           <UserCircle size={32} />
                         </div>
                       )}
                       <div>
                          <h4 className="text-xl font-black text-slate-900 mb-1">{req.name}</h4>
                          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                             <Calendar size={12} />
                             {new Date(req.requestedAt).toLocaleDateString('he-IL')}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 flex-1">
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <Mail size={14} className="text-slate-400" />
                          <span className="text-xs font-black truncate">{req.email}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <Phone size={14} className="text-slate-400" />
                          <span className="text-xs font-black">{req.mobile}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                          <MapPin size={14} />
                          <span className="text-xs font-black">{(req as any).group || 'הרצליה'}</span>
                       </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                       <button 
                         onClick={() => handleApprove(req.id)}
                         disabled={isProcessing === req.id}
                         className="flex-1 py-4 bg-[#006994] text-white rounded-2xl font-black text-sm hover:bg-[#4E8294] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} className="text-[#00FFFF]" />}
                         אשר הצטרפות
                       </button>
                       <button 
                         onClick={() => handleReject(req.id, req.name, req.mobile)}
                         disabled={isProcessing === req.id}
                         className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-50 flex items-center justify-center"
                         title="דחה ומחק בקשה"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={18} /> : <UserX size={18} />}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[4rem]">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <UserCheck size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-400">אין בקשות הצטרפות ממתינות</h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {editingMember ? (
              <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-xl max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                  <button 
                    onClick={() => setEditingMember(null)}
                    className="flex items-center gap-2 text-[#4E8294] hover:text-[#006994] font-black transition-all"
                  >
                    <ChevronLeft size={20} /> חזרה לרשימה
                  </button>
                  <h3 className="text-3xl font-black text-slate-900">עריכת משתמש</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Avatar Section */}
                  <div className="md:col-span-2 flex flex-col items-center mb-8">
                    <div className="relative group">
                      {editingMember.avatar ? (
                        <img src={editingMember.avatar} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl" alt="" />
                      ) : (
                        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center text-slate-300 shadow-inner">
                          <UserCircle size={64} />
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="text-white" size={32} />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await processImage(file);
                              setEditingMember({ ...editingMember, avatar: base64 });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">לחץ לשינוי תמונה</p>
                    
                    {/* Status & Role Toggles */}
                    <div className="mt-8 flex flex-col gap-4 w-full max-w-xs">
                      {/* Active/Suspended Toggle */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-xs font-black text-slate-900">סטטוס חשבון</span>
                        <button 
                          onClick={() => setEditingMember({ ...editingMember, isActive: !editingMember.isActive })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            editingMember.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span className="sr-only">שנה סטטוס</span>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editingMember.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-black mr-2 ${editingMember.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {editingMember.isActive !== false ? 'פעיל' : 'מושעה'}
                        </span>
                      </div>

                      {/* Member/Instructor Toggle */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-xs font-black text-slate-900">מדריך</span>
                        <button 
                          onClick={() => {
                            const newRole = editingMember.role === 'Instructor' ? 'Member' : 'Instructor';
                            setEditingMember({ ...editingMember, role: newRole });
                          }}
                          disabled={editingMember.role === 'Admin' && !isSuperAdmin}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            editingMember.role === 'Instructor' ? 'bg-amber-500' : 'bg-slate-300'
                          } ${editingMember.role === 'Admin' && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="sr-only">שנה תפקיד מדריך</span>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editingMember.role === 'Instructor' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-black mr-2 ${editingMember.role === 'Instructor' ? 'text-amber-600' : 'text-slate-400'}`}>
                          {editingMember.role === 'Instructor' ? 'כן' : 'לא'}
                        </span>
                      </div>

                      {/* Admin Toggle (Super Admin Only) */}
                      {isSuperAdmin && (
                        <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <span className="text-xs font-black text-indigo-900">מנהל מערכת</span>
                          <button 
                            onClick={() => {
                              const newRole = editingMember.role === 'Admin' ? 'Member' : 'Admin';
                              setEditingMember({ ...editingMember, role: newRole });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              editingMember.role === 'Admin' ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span className="sr-only">שנה תפקיד מנהל</span>
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                editingMember.role === 'Admin' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-black mr-2 ${editingMember.role === 'Admin' ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {editingMember.role === 'Admin' ? 'כן' : 'לא'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">שם מלא</label>
                    <input 
                      type="text"
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">אימייל</label>
                    <input 
                      type="email"
                      value={editingMember.email}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">טלפון נייד</label>
                    <input 
                      type="text"
                      value={editingMember.mobile}
                      onChange={(e) => setEditingMember({ ...editingMember, mobile: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">ביוגרפיה</label>
                    <textarea 
                      value={editingMember.bio}
                      onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all min-h-[120px]"
                    />
                  </div>

                  {/* Social Networks */}
                  <div className="md:col-span-2 pt-8 border-t border-slate-100">
                    <h4 className="text-lg font-black text-slate-900 mb-6">רשתות חברתיות</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">פייסבוק</label>
                        <input 
                          type="text"
                          value={editingMember.facebookUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, facebookUrl: e.target.value })}
                          placeholder="https://facebook.com/..."
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">אינסטגרם</label>
                        <input 
                          type="text"
                          value={editingMember.instagramUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, instagramUrl: e.target.value })}
                          placeholder="https://instagram.com/..."
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">טיקטוק</label>
                        <input 
                          type="text"
                          value={editingMember.tiktokUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, tiktokUrl: e.target.value })}
                          placeholder="https://tiktok.com/@..."
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">לינקדאין</label>
                        <input 
                          type="text"
                          value={editingMember.linkedinUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, linkedinUrl: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">טוויטר / X</label>
                        <input 
                          type="text"
                          value={editingMember.twitterUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, twitterUrl: e.target.value })}
                          placeholder="https://twitter.com/..."
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">אתר אישי</label>
                        <input 
                          type="text"
                          value={editingMember.websiteUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, websiteUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-12 flex flex-col gap-4">
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={async () => {
                          if (!editingMember) return;
                          setIsProcessing(editingMember.id);
                          try {
                            await updateMember(editingMember);
                            setEditingMember(null);
                            alert('השינויים נשמרו בהצלחה');
                          } catch (err) {
                            alert('שגיאה בשמירת הנתונים');
                          } finally {
                            setIsProcessing(null);
                          }
                        }}
                        disabled={isProcessing === editingMember.id}
                        className="flex-1 py-4 bg-[#006994] text-white rounded-2xl font-black text-base shadow-lg shadow-[#006994]/20 hover:bg-[#005a82] transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        {isProcessing === editingMember.id ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            <Save size={20} /> שמירה
                          </>
                        )}
                      </button>

                      <button 
                        type="button"
                        onClick={async () => {
                          if (!editingMember) return;
                          if (!window.confirm(`האם להעביר את ${editingMember.name} לארכיון?`)) return;
                          
                          setIsProcessing(editingMember.id);
                          try {
                            await updateMember({ ...editingMember, isActive: false });
                            setEditingMember(null);
                            setActiveTab('ARCHIVE');
                            alert('המשתמש הועבר לארכיון בהצלחה');
                          } catch (err: any) {
                            alert('שגיאה: ' + err.message);
                          } finally {
                            setIsProcessing(null);
                          }
                        }}
                        disabled={isProcessing === editingMember.id}
                        className="flex-1 py-4 bg-[#E20074] text-white rounded-2xl font-black text-base shadow-lg shadow-[#E20074]/20 hover:bg-[#c10063] transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Archive size={20} /> ארכיון
                      </button>
                    </div>

                    <button 
                      type="button"
                      onClick={async () => {
                        if (!editingMember) return;
                        if (!window.confirm('האם למחוק את המשתמש לצמיתות? פעולה זו אינה הפיכה!')) return;
                        setIsProcessing(editingMember.id);
                        try {
                          await deleteMember(editingMember.id);
                          setEditingMember(null);
                          alert('המשתמש נמחק לצמיתות');
                        } catch (err) {
                          alert('שגיאה במחיקת המשתמש');
                        } finally {
                          setIsProcessing(null);
                        }
                      }}
                      disabled={isProcessing === editingMember.id}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Trash2 size={20} /> מחיקת משתמש לצמיתות
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">משתמש</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">עריכה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {members.filter(m => m.isActive !== false).map(member => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              {member.avatar ? (
                                <img src={member.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                                  <UserCircle size={24} />
                                </div>
                              )}
                              <div>
                                <h4 className="font-black text-slate-900">{member.name}</h4>
                                <p className="text-[10px] text-slate-400 font-black truncate max-w-[150px]">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              member.role === 'Admin' 
                                ? 'bg-indigo-50 text-indigo-600' 
                                : member.role === 'Instructor'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {member.role === 'Admin' ? 'מנהל' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={() => setEditingMember(member)}
                                className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all"
                                title="עריכת משתמש"
                              >
                                <Pencil size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ARCHIVE' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">משתמש מושעה</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">תפקיד</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {members.filter(m => m.isActive === false).map(member => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {member.avatar ? (
                              <img src={member.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm opacity-50" alt="" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                                <UserCircle size={24} />
                              </div>
                            )}
                            <div>
                              <h4 className="font-black text-slate-400">{member.name}</h4>
                              <p className="text-[10px] text-slate-300 font-black truncate max-w-[150px]">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400">
                            {member.role === 'Admin' ? 'מנהל' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setEditingMember(member)}
                              className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all"
                              title="עריכה"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (!window.confirm('האם להחזיר את המשתמש לפעילות?')) return;
                                try {
                                  await updateMember({ ...member, isActive: true });
                                  alert('המשתמש הוחזר לפעילות');
                                } catch (err) {
                                  alert('שגיאה בהחזרת המשתמש');
                                }
                              }}
                              className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all"
                              title="החזר לפעילות"
                            >
                              <RefreshCw size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {members.filter(m => m.isActive === false).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-black">אין משתמשים בארכיון</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PODCASTS' && (
          <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[4rem] animate-in fade-in">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Mic size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-400">ניהול פודקאסטים בקרוב</h3>
             <p className="text-slate-400 font-bold mt-2">כאן תוכלו לנהל את רשימת הפרקים והקישורים</p>
          </div>
        )}

        {activeTab === 'GALLERY' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {galleryItems.map(item => (
                 <div key={item.id} className="aspect-square rounded-2xl overflow-hidden relative group border border-slate-100">
                   {item.url ? (
                     <img src={item.url} className="w-full h-full object-cover" alt="" />
                   ) : (
                     <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                       <ImageIcon size={32} />
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                     <button className="p-3 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all">
                       <Trash2 size={18} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'EVENTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(event => (
                <div key={event.id} className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm hover:shadow-xl transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center justify-center font-black">
                      <span className="text-lg leading-none">{event.date.split('.')[0]}</span>
                      <span className="text-[10px] uppercase">{event.date.split('.')[1]}</span>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-xl font-black text-slate-900 mb-1">{event.title}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-400">{event.location}</p>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                          event.type === 'COMMUNITY' ? 'bg-[#006994] text-white' : 
                          event.type === 'INSTRUCTOR' ? 'bg-amber-500 text-white' : 
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {event.type === 'COMMUNITY' ? 'קהילה' : event.type === 'INSTRUCTOR' ? 'מדריך' : 'חבר'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteEvent(event.id)}
                    className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SITE' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 bg-white border border-slate-100 rounded-[4rem] p-12 shadow-sm">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg"><RotateCcw size={24} /></div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900">הגדרות ונכסי אתר</h3>
                      <p className="text-slate-400 font-bold">צפייה ועדכון הנכסים הוויזואליים של המערכת</p>
                   </div>
                </div>
                <button 
                  onClick={resetAssets}
                  className="px-6 py-3 bg-slate-100 text-[#006994] rounded-2xl font-black text-xs hover:bg-slate-200 transition-all flex items-center gap-2 active:scale-95"
                >
                  <RotateCcw size={14} />
                  איפוס לברירת מחדל
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(siteAssets || {}).map(([key, value]: [string, any]) => (
                   <div key={key} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-100 relative group/avatar">
                            {typeof value === 'string' && value.startsWith('http') ? (
                               <img src={value} className="w-full h-full object-contain p-2" alt="" />
                            ) : (
                               <span className="text-slate-400 font-black text-[10px] uppercase">{key.slice(0, 2)}</span>
                            )}
                            
                            <button 
                              onClick={() => {
                                setReplacingAssetKey(key);
                                assetFileInputRef.current?.click();
                              }}
                              disabled={isUploadingAsset === key}
                              className="absolute inset-0 bg-slate-950/40 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all disabled:opacity-100"
                            >
                              {isUploadingAsset === key ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <Camera size={20} />
                              )}
                            </button>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{key}</p>
                            <h4 className="text-lg font-black text-slate-900">{ASSET_LABELS[key] || key}</h4>
                            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[180px]">{typeof value === 'string' ? value : 'נתון מורכב'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingAsset({ key, value: typeof value === 'string' ? value : '' })}
                          className="p-2 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Settings size={16} />
                        </button>
                        {typeof value === 'string' && value.startsWith('http') && (
                          <a href={value} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-slate-950 opacity-0 group-hover:opacity-100 transition-all">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Assets */}
      <input 
        type="file"
        ref={assetFileInputRef}
        onChange={handleAssetFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 mb-2">עדכון נכס: {editingAsset.key}</h3>
            <p className="text-slate-400 font-bold text-sm mb-8">הזן כתובת URL חדשה עבור הנכס</p>
            
            <div className="space-y-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">כתובת URL</label>
                <input 
                  type="text"
                  value={editingAsset.value}
                  onChange={(e) => setEditingAsset({ ...editingAsset, value: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="https://..."
                />
              </div>
              
              {editingAsset.value.startsWith('http') && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img src={editingAsset.value} className="w-full h-full object-contain" alt="Preview" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setEditingAsset(null)}
                className="py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
              >
                ביטול
              </button>
              <button 
                onClick={handleUpdateAsset}
                className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all"
              >
                עדכן נכס
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for Approved Member */}
      {approvedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-10 md:p-14 text-center animate-in zoom-in-95 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                 <CheckCircle2 size={40} />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 mb-4">חבר/ה חדש/ה בנבחרת!</h3>
              <p className="text-slate-500 font-bold text-lg mb-10 leading-relaxed">
                הבקשה של <span className="text-emerald-600">{approvedUser.name}</span> אושרה.
                נא לשלוח לו/ה את פרטי הגישה:
              </p>
              
              <div className="bg-slate-50 rounded-[2rem] p-8 mb-6 border border-slate-100 relative group">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-right">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">טלפון</span>
                       <span className="font-black text-slate-900">{approvedUser.mobile}</span>
                    </div>
                    <div className="h-px bg-slate-200"></div>
                    <div className="flex justify-between items-center text-right">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סיסמה זמנית</span>
                       <span className="font-black text-emerald-600 text-xl tracking-wider select-all">{approvedUser.tempPassword}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-10">
                 <button 
                   onClick={() => openWhatsApp(approvedUser.mobile, approvedUser.name, approvedUser.tempPassword)}
                   className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                 >
                   <MessageCircle size={20} />
                   שלח בוואטסאפ
                 </button>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(formatWhatsAppMessage(approvedUser.name, approvedUser.tempPassword));
                     alert('הודעת ההצטרפות הועתקה ללוח');
                   }}
                   className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                 >
                   <Copy size={18} />
                   העתק הודעה ללוח
                 </button>
              </div>
              
              <button 
                onClick={() => setApprovedUser(null)} 
                className="w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-slate-800 transition-all"
              >
                סגור פאנל
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
