
import React, { useState, useRef } from 'react';
import { 
  Users, Archive, Mic, Image as ImageIcon, Calendar, Settings, UserCheck, ShieldAlert, Search, 
  Trash2, UserPlus, Mail, Phone, MapPin, ExternalLink, Edit2, CheckCircle2, XCircle, 
  Camera, UserCircle, ChevronLeft, ArrowLeft, LayoutDashboard, Copy, Check, Share2,
  Loader2, X, UserX, RotateCcw, MessageCircle, Plus, RefreshCw, Pencil, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REQUESTS' | 'SITE' | 'USERS' | 'PODCASTS' | 'GALLERY' | 'EVENTS' | 'ARCHIVE'>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [approvedUser, setApprovedUser] = useState<{ name: string; email: string; mobile: string; tempPassword: string } | null>(null);
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
    window.alert('AdminPage: handleApprove triggered for id: ' + id);
    if (!window.confirm('האם לאשר את הצטרפות החבר/ה לנבחרת?')) return;
    
    setIsProcessing(id);
    try {
      console.log('AdminPage: Calling approveRequest...');
      const result = await approveRequest(id);
      console.log('AdminPage: approveRequest result:', result);
      
      if (result) {
        setApprovedUser(result);
        // Automatically open WhatsApp with the formatted message
        const message = encodeURIComponent(formatWhatsAppMessage(result.name, result.email, result.tempPassword));
        const cleanMobile = result.mobile.replace(/\D/g, '');
        const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
        const waUrl = `https://wa.me/${finalMobile}?text=${message}`;
        
        console.log('AdminPage: Opening WhatsApp URL:', waUrl);
        const win = window.open(waUrl, '_blank');
        if (!win) {
          alert('הבקשה אושרה! אך חוסם הפופ-אפים מנע את פתיחת וואטסאפ. נא ללחוץ על הכפתור בפאנל שייפתח.');
        }
      } else {
        alert('הבקשה כבר אינה קיימת או שאושרה על ידי מנהל אחר.');
      }
    } catch (err) {
      console.error('AdminPage: Approve error:', err);
      alert('שגיאה בתהליך האישור. בדוק את החיבור לאינטרנט או את הרשאות המנהל.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string, name: string, mobile: string) => {
    window.alert('AdminPage: handleReject triggered for id: ' + id);
    if (!window.confirm(`האם לדחות את בקשת ההצטרפות של ${name}? הבקשה תימחק והמשתמש יקבל הודעת דחייה.`)) return;
    
    setIsProcessing(id);
    try {
      console.log('AdminPage: Calling rejectRequest...');
      await rejectRequest(id);
      console.log('AdminPage: rejectRequest completed');
      
      // Send rejection message after successful deletion
      const cleanMobile = mobile.replace(/\D/g, '');
      const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
      const rejectMsg = `היי *${name}*, תודה על הפנייה ל-אתר חבל זוג 🌊\nכרגע זה פחות מתאים, אבל נשמח לשמור על קשר ולהתעדכן בהמשך במידה ומשהו ישתנה.\nשיהיה אחלה יום! 👋`;
      const waUrl = `https://wa.me/${finalMobile}?text=${encodeURIComponent(rejectMsg)}`;
      
      console.log('AdminPage: Opening Rejection WhatsApp URL:', waUrl);
      const win = window.open(waUrl, '_blank');
      if (!win) {
        alert('הבקשה נדחתה ונמחקה! אך חוסם הפופ-אפים מנע את פתיחת וואטסאפ.');
      }
    } catch (err) {
      console.error('AdminPage: Reject error:', err);
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
    <div className="relative min-h-screen bg-[#f2def0]/30 text-right space-y-12 pb-20 pt-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff009f] text-white text-[10px] font-black rounded-full mb-4 shadow-md shadow-[#ff009f]/20">
            <ShieldAlert size={12} className="text-[#ffd2fa]" /> מנהל מערכת
          </div>
          <h2 className="text-5xl font-black text-[#4a002e] tracking-tighter">מרכז ניהול</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Sidebar Navigation - Sleek Icon Grid */}
          <aside className="w-full lg:w-24 flex-shrink-0 lg:sticky lg:top-8 z-40">
            <nav className="bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] border border-[#ff009f]/10 flex lg:flex-col gap-3 shadow-2xl shadow-[#ff009f]/5 overflow-x-auto lg:overflow-x-visible no-scrollbar">
              {[
                { id: 'DASHBOARD', label: 'ראשי', icon: LayoutDashboard },
                { id: 'USERS', label: 'משתמשים', icon: Users },
                { id: 'ARCHIVE', label: 'ארכיון', icon: Archive },
                { id: 'PODCASTS', label: 'פודקאסטים', icon: Mic },
                { id: 'GALLERY', label: 'גלריה', icon: ImageIcon },
                { id: 'EVENTS', label: 'אירועים', icon: Calendar },
                { id: 'REQUESTS', label: 'בקשות', icon: UserCheck, count: joinRequests.length },
                { id: 'SITE', label: 'הגדרות', icon: Settings }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 flex flex-col items-center justify-center rounded-2xl font-black transition-all duration-500 group relative ${
                    activeTab === tab.id 
                      ? 'text-white shadow-xl shadow-[#ff009f]/30 scale-110' 
                      : 'text-[#f063c1] hover:bg-[#f7c1ea]/20'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-gradient-to-br from-[#ff009f] to-[#f063c1] z-0 rounded-2xl" 
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <tab.icon size={22} className={`transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-125'}`} />
                    
                    {/* Hover Label - Only visible on hover or if active */}
                    <div className={`absolute top-full mt-2 lg:mt-0 lg:right-full lg:mr-4 px-3 py-1.5 bg-[#4a002e] text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 pointer-events-none transition-all duration-300 transform lg:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 z-50 shadow-xl`}>
                      {tab.label}
                      <div className="absolute top-1/2 -translate-y-1/2 -right-1 border-4 border-transparent border-l-[#4a002e] hidden lg:block" />
                    </div>
                  </div>

                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`absolute -top-1 -right-1 z-20 w-5 h-5 flex items-center justify-center rounded-full text-[8px] font-black border-2 border-white ${
                      activeTab === tab.id ? 'bg-[#ffd2fa] text-[#ff009f]' : 'bg-rose-500 text-white'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full">
            
            {activeTab === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                {[
                  { id: 'USERS', label: 'ניהול משתמשים', desc: `${members.length} חברים רשומים`, icon: Users, color: 'bg-[#ff009f]' },
                  { id: 'REQUESTS', label: 'בקשות הצטרפות', desc: `${joinRequests.length} ממתינים לאישור`, icon: UserCheck, color: 'bg-[#f063c1]', count: joinRequests.length },
                  { id: 'EVENTS', label: 'ניהול אירועים', desc: `${events.length} אירועים בלוח`, icon: Calendar, color: 'bg-[#f7c1ea]' },
                  { id: 'GALLERY', label: 'גלריית תמונות', desc: `${galleryItems.length} פריטים במדיה`, icon: ImageIcon, color: 'bg-[#ffd2fa]' },
                  { id: 'PODCASTS', label: 'פודקאסטים', desc: 'ניהול תכני שמע', icon: Mic, color: 'bg-[#f2def0]' },
                  { id: 'SITE', label: 'הגדרות אתר', desc: 'לוגואים, רקעים ונכסים', icon: Settings, color: 'bg-[#4a002e]' },
                  { id: 'ARCHIVE', label: 'ארכיון משתמשים', desc: 'ניהול חברים שהושעו', icon: Archive, color: 'bg-[#f063c1]' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className="group bg-white p-8 rounded-[2.5rem] border border-[#ff009f]/5 shadow-sm hover:shadow-2xl hover:shadow-[#ff009f]/10 transition-all duration-500 text-right relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-2 h-full ${item.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${item.color} ${item.color === 'bg-[#ffd2fa]' || item.color === 'bg-[#f2def0]' ? 'text-[#4a002e]' : 'text-white'} shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        <item.icon size={28} />
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                          {item.count} חדש
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-[#4a002e] mb-2 group-hover:text-[#ff009f] transition-colors">{item.label}</h3>
                    <p className="text-xs font-black text-[#f063c1]/60 uppercase tracking-widest">{item.desc}</p>
                    
                    <div className="mt-8 flex items-center gap-2 text-[#ff009f] text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      כניסה לניהול <ArrowLeft size={12} />
                    </div>
                  </button>
                ))}
              </div>
            )}

        {activeTab === 'REQUESTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="relative">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[#f063c1]/40" />
               <input 
                 type="text" 
                 placeholder="חיפוש לפי שם או אימייל..." 
                 className="w-full pr-16 pl-6 py-6 bg-[#f7c1ea]/10 rounded-[2.5rem] border-none font-black focus:ring-2 ring-[#ff009f]/30 shadow-sm"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>

            {filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map(req => (
                  <div key={req.id} className={`bg-white border border-[#ff009f]/5 rounded-[3rem] p-8 shadow-sm hover:shadow-xl hover:shadow-[#ff009f]/5 transition-all group flex flex-col h-full ${isProcessing === req.id ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-5 mb-8">
                       {req.avatar ? (
                         <img src={req.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                       ) : (
                         <div className="w-16 h-16 rounded-2xl bg-[#f7c1ea]/20 flex items-center justify-center text-[#ff009f] shadow-md">
                           <UserCircle size={32} />
                         </div>
                       )}
                       <div>
                          <h4 className="text-xl font-black text-[#4a002e] mb-1">{req.name}</h4>
                          <div className="flex items-center gap-2 text-[#f063c1]/60 font-bold text-[10px] uppercase tracking-widest">
                             <Calendar size={12} />
                             {new Date(req.requestedAt).toLocaleDateString('he-IL')}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 flex-1">
                       <div className="flex items-center gap-3 p-3 bg-[#f7c1ea]/10 rounded-xl">
                          <Mail size={14} className="text-[#f063c1]/60" />
                          <span className="text-xs font-black truncate">{req.email}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-[#f7c1ea]/10 rounded-xl">
                          <Phone size={14} className="text-[#f063c1]/60" />
                          <span className="text-xs font-black">{req.mobile}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-[#f063c1]/10 text-[#ff009f] rounded-xl">
                          <MapPin size={14} />
                          <span className="text-xs font-black">{(req as any).group || 'הרצליה'}</span>
                       </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                         disabled={isProcessing === req.id}
                         className="flex-1 py-4 bg-[#ff009f] text-white rounded-2xl font-black text-sm hover:bg-[#4a002e] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 relative z-10"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} className="text-[#ffd2fa]" />}
                         אשר הצטרפות
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleReject(req.id, req.name, req.mobile); }}
                         disabled={isProcessing === req.id}
                         className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center border-2 border-rose-200 hover:border-rose-600 shadow-sm relative z-10"
                         title="דחה ומחק בקשה"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={20} /> : <UserX size={20} />}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center border-2 border-dashed border-[#ff009f]/10 rounded-[4rem]">
                 <div className="w-20 h-20 bg-[#f7c1ea]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#f063c1]/20">
                    <UserCheck size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-[#f063c1]/40">אין בקשות הצטרפות ממתינות</h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {editingMember ? (
              <div className="bg-white border border-[#ff009f]/5 rounded-[3rem] p-8 md:p-12 shadow-xl max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                  <button 
                    onClick={() => setEditingMember(null)}
                    className="flex items-center gap-2 text-[#f063c1] hover:text-[#ff009f] font-black transition-all"
                  >
                    <ChevronLeft size={20} /> חזרה לרשימה
                  </button>
                  <h3 className="text-3xl font-black text-[#4a002e]">עריכת משתמש</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Avatar Section */}
                  <div className="md:col-span-2 flex flex-col items-center mb-8">
                    <div className="relative group">
                      {editingMember.avatar ? (
                        <img src={editingMember.avatar} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl" alt="" />
                      ) : (
                        <div className="w-32 h-32 rounded-[2.5rem] bg-[#f7c1ea]/10 flex items-center justify-center text-[#f063c1]/40 shadow-inner">
                          <UserCircle size={64} />
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-[#4a002e]/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
                    <p className="mt-4 text-xs font-black text-[#f063c1]/60 uppercase tracking-widest">לחץ לשינוי תמונה</p>
                    
                    {/* Status & Role Toggles */}
                    <div className="mt-8 flex flex-col gap-4 w-full max-w-xs">
                      {/* Active/Suspended Toggle */}
                      <div className="flex items-center justify-between p-4 bg-[#f7c1ea]/5 rounded-2xl">
                        <span className="text-xs font-black text-[#4a002e]">סטטוס חשבון</span>
                        <button 
                          onClick={() => setEditingMember({ ...editingMember, isActive: !editingMember.isActive })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            editingMember.isActive !== false ? 'bg-[#ff009f]' : 'bg-[#f063c1]/20'
                          }`}
                        >
                          <span className="sr-only">שנה סטטוס</span>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editingMember.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-black mr-2 ${editingMember.isActive !== false ? 'text-[#ff009f]' : 'text-[#f063c1]/40'}`}>
                          {editingMember.isActive !== false ? 'פעיל' : 'מושעה'}
                        </span>
                      </div>

                      {/* Member/Instructor Toggle */}
                      <div className="flex items-center justify-between p-4 bg-[#f7c1ea]/5 rounded-2xl">
                        <span className="text-xs font-black text-[#4a002e]">מדריך</span>
                        <button 
                          onClick={() => {
                            const newRole = editingMember.role === 'Instructor' ? 'Member' : 'Instructor';
                            setEditingMember({ ...editingMember, role: newRole });
                          }}
                          disabled={editingMember.role === 'Admin' && !isSuperAdmin}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            editingMember.role === 'Instructor' ? 'bg-amber-500' : 'bg-[#f063c1]/20'
                          } ${editingMember.role === 'Admin' && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="sr-only">שנה תפקיד מדריך</span>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editingMember.role === 'Instructor' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-black mr-2 ${editingMember.role === 'Instructor' ? 'text-amber-600' : 'text-[#f063c1]/40'}`}>
                          {editingMember.role === 'Instructor' ? 'כן' : 'לא'}
                        </span>
                      </div>

                      {/* Admin Toggle (Super Admin Only) */}
                      {isSuperAdmin && (
                        <div className="flex items-center justify-between p-4 bg-[#f7c1ea]/5 rounded-2xl border border-[#ff009f]/10">
                          <span className="text-xs font-black text-[#4a002e]">מנהל מערכת</span>
                          <button 
                            onClick={() => {
                              const newRole = editingMember.role === 'Admin' ? 'Member' : 'Admin';
                              setEditingMember({ ...editingMember, role: newRole });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              editingMember.role === 'Admin' ? 'bg-[#ff009f]' : 'bg-[#f063c1]/20'
                            }`}
                          >
                            <span className="sr-only">שנה תפקיד מנהל</span>
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                editingMember.role === 'Admin' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-black mr-2 ${editingMember.role === 'Admin' ? 'text-[#ff009f]' : 'text-[#f063c1]/40'}`}>
                            {editingMember.role === 'Admin' ? 'כן' : 'לא'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest mr-2">שם מלא</label>
                    <input 
                      type="text"
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="w-full p-4 bg-[#f7c1ea]/10 border-none rounded-2xl font-black text-[#4a002e] focus:ring-2 ring-[#ff009f]/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest mr-2">אימייל</label>
                    <input 
                      type="email"
                      value={editingMember.email}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      className="w-full p-4 bg-[#f7c1ea]/10 border-none rounded-2xl font-black text-[#4a002e] focus:ring-2 ring-[#ff009f]/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest mr-2">טלפון נייד</label>
                    <input 
                      type="text"
                      value={editingMember.mobile}
                      onChange={(e) => setEditingMember({ ...editingMember, mobile: e.target.value })}
                      className="w-full p-4 bg-[#f7c1ea]/10 border-none rounded-2xl font-black text-[#4a002e] focus:ring-2 ring-[#ff009f]/30 transition-all text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest mr-2">ביוגרפיה</label>
                    <textarea 
                      value={editingMember.bio}
                      onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                      className="w-full p-4 bg-[#f7c1ea]/10 border-none rounded-2xl font-black text-[#4a002e] focus:ring-2 ring-[#ff009f]/30 transition-all min-h-[120px]"
                    />
                  </div>

                  {/* Social Networks */}
                  <div className="md:col-span-2 pt-8 border-t border-[#ff009f]/10">
                    <h4 className="text-lg font-black text-[#4a002e] mb-6">רשתות חברתיות</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#147D8F]/60 uppercase tracking-widest mr-2">פייסבוק</label>
                        <input 
                          type="text"
                          value={editingMember.facebookUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, facebookUrl: e.target.value })}
                          placeholder="https://facebook.com/..."
                          className="w-full p-4 bg-[#3FA7D6]/5 border-none rounded-2xl font-black text-[#0B3C5D] focus:ring-2 focus:ring-[#3FA7D6] transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#147D8F]/60 uppercase tracking-widest mr-2">אינסטגרם</label>
                        <input 
                          type="text"
                          value={editingMember.instagramUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, instagramUrl: e.target.value })}
                          placeholder="https://instagram.com/..."
                          className="w-full p-4 bg-[#3FA7D6]/5 border-none rounded-2xl font-black text-[#0B3C5D] focus:ring-2 focus:ring-[#3FA7D6] transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#147D8F]/60 uppercase tracking-widest mr-2">טיקטוק</label>
                        <input 
                          type="text"
                          value={editingMember.tiktokUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, tiktokUrl: e.target.value })}
                          placeholder="https://tiktok.com/@..."
                          className="w-full p-4 bg-[#3FA7D6]/5 border-none rounded-2xl font-black text-[#0B3C5D] focus:ring-2 focus:ring-[#3FA7D6] transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#147D8F]/60 uppercase tracking-widest mr-2">לינקדאין</label>
                        <input 
                          type="text"
                          value={editingMember.linkedinUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, linkedinUrl: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full p-4 bg-[#3FA7D6]/5 border-none rounded-2xl font-black text-[#0B3C5D] focus:ring-2 focus:ring-[#3FA7D6] transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#147D8F]/60 uppercase tracking-widest mr-2">טוויטר / X</label>
                        <input 
                          type="text"
                          value={editingMember.twitterUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, twitterUrl: e.target.value })}
                          placeholder="https://twitter.com/..."
                          className="w-full p-4 bg-[#f7c1ea]/10 border-none rounded-2xl font-black text-[#4a002e] focus:ring-2 ring-[#ff009f]/30 transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest mr-2">אתר אישי</label>
                        <input 
                          type="text"
                          value={editingMember.websiteUrl || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, websiteUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full p-4 bg-[#f7c1ea]/10 border-none rounded-2xl font-black text-[#4a002e] focus:ring-2 ring-[#ff009f]/30 transition-all text-left"
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
                        className="flex-1 py-4 bg-[#4a002e] text-white rounded-2xl font-black text-base shadow-lg shadow-[#4a002e]/20 hover:bg-[#ff009f] transition-all flex items-center justify-center gap-2 active:scale-95"
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
                        className="flex-1 py-4 bg-[#ff009f] text-white rounded-2xl font-black text-base shadow-lg shadow-[#ff009f]/20 hover:bg-[#4a002e] transition-all flex items-center justify-center gap-2 active:scale-95"
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
                      className="w-full py-4 bg-[#4a002e] text-white rounded-2xl font-black text-base hover:bg-[#ff009f] transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Trash2 size={20} /> מחיקת משתמש לצמיתות
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#ff009f]/5 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-[#f7c1ea]/10 border-b border-[#ff009f]/5">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest">משתמש</th>
                        <th className="px-8 py-6 text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest">סטטוס</th>
                        <th className="px-8 py-6 text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest text-center">עריכה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f7c1ea]/20">
                      {members.filter(m => m.isActive !== false).map(member => (
                        <tr key={member.id} className="hover:bg-[#f7c1ea]/10 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              {member.avatar ? (
                                <img src={member.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-[#f7c1ea]/20 flex items-center justify-center text-[#f063c1]/40">
                                  <UserCircle size={24} />
                                </div>
                              )}
                              <div>
                                <h4 className="font-black text-[#4a002e]">{member.name}</h4>
                                <p className="text-[10px] text-[#f063c1]/60 font-black truncate max-w-[150px]">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              member.role === 'Admin' 
                                ? 'bg-[#ff009f]/10 text-[#ff009f]' 
                                : member.role === 'Instructor'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-[#f7c1ea]/10 text-[#f063c1]/60'
                            }`}>
                              {member.role === 'Admin' ? 'מנהל' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={() => setEditingMember(member)}
                                className="w-10 h-10 bg-white border border-[#ff009f]/10 rounded-xl flex items-center justify-center text-[#f063c1]/40 hover:text-[#ff009f] hover:border-[#ff009f]/30 hover:shadow-lg transition-all"
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
            <div className="bg-white border border-[#ff009f]/5 rounded-[3rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-[#f7c1ea]/10 border-b border-[#ff009f]/5">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest">משתמש מושעה</th>
                      <th className="px-8 py-6 text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest">תפקיד</th>
                      <th className="px-8 py-6 text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f7c1ea]/10">
                    {members.filter(m => m.isActive === false).map(member => (
                      <tr key={member.id} className="hover:bg-[#f7c1ea]/10 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {member.avatar ? (
                              <img src={member.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm opacity-50" alt="" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-[#f7c1ea]/20 flex items-center justify-center text-[#f063c1]/20">
                                <UserCircle size={24} />
                              </div>
                            )}
                            <div>
                              <h4 className="font-black text-[#f063c1]/40">{member.name}</h4>
                              <p className="text-[10px] text-[#f063c1]/20 font-black truncate max-w-[150px]">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#f7c1ea]/10 text-[#f063c1]/40">
                            {member.role === 'Admin' ? 'מנהל' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setEditingMember(member)}
                              className="w-10 h-10 bg-white border border-[#ff009f]/10 rounded-xl flex items-center justify-center text-[#f063c1]/40 hover:text-[#ff009f] hover:border-[#ff009f]/30 hover:shadow-lg transition-all"
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
                              className="w-10 h-10 bg-white border border-[#ff009f]/10 rounded-xl flex items-center justify-center text-[#f063c1]/40 hover:text-[#ff009f] hover:border-[#ff009f]/30 hover:shadow-lg transition-all"
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
                        <td colSpan={3} className="px-8 py-12 text-center text-[#f063c1]/40 font-black">אין משתמשים בארכיון</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PODCASTS' && (
          <div className="py-32 text-center border-2 border-dashed border-[#ff009f]/10 rounded-[4rem] animate-in fade-in">
             <div className="w-20 h-20 bg-[#f7c1ea]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#f063c1]/20">
                <Mic size={40} />
             </div>
             <h3 className="text-2xl font-black text-[#f063c1]/40">ניהול פודקאסטים בקרוב</h3>
             <p className="text-[#f063c1]/40 font-bold mt-2">כאן תוכלו לנהל את רשימת הפרקים והקישורים</p>
          </div>
        )}

        {activeTab === 'GALLERY' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {galleryItems.map(item => (
                 <div key={item.id} className="aspect-square rounded-2xl overflow-hidden relative group border border-[#ff009f]/5">
                   {item.url ? (
                     <img src={item.url} className="w-full h-full object-cover" alt="" />
                   ) : (
                     <div className="w-full h-full bg-[#f7c1ea]/10 flex items-center justify-center text-[#f063c1]/20">
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
                <div key={event.id} className="bg-white border border-[#ff009f]/5 rounded-[3rem] p-8 shadow-sm hover:shadow-xl hover:shadow-[#ff009f]/5 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#ff009f]/10 text-[#ff009f] rounded-2xl flex flex-col items-center justify-center font-black">
                      <span className="text-lg leading-none">{event.date.split('.')[0]}</span>
                      <span className="text-[10px] uppercase">{event.date.split('.')[1]}</span>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-xl font-black text-[#4a002e] mb-1">{event.title}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#f063c1]/60">{event.location}</p>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                          event.type === 'COMMUNITY' ? 'bg-[#ff009f] text-white' : 
                          event.type === 'INSTRUCTOR' ? 'bg-amber-500 text-white' : 
                          'bg-[#f7c1ea]/10 text-[#f063c1]/60'
                        }`}>
                          {event.type === 'COMMUNITY' ? 'קהילה' : event.type === 'INSTRUCTOR' ? 'מדריך' : 'חבר'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteEvent(event.id)}
                    className="p-4 bg-[#f7c1ea]/10 text-[#f063c1]/20 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SITE' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 bg-white border border-[#ff009f]/10 rounded-[4rem] p-12 shadow-sm">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-[#ff009f] text-white rounded-2xl shadow-lg"><RotateCcw size={24} /></div>
                   <div>
                      <h3 className="text-2xl font-black text-[#4a002e]">הגדרות ונכסי אתר</h3>
                      <p className="text-[#f063c1]/60 font-bold">צפייה ועדכון הנכסים הוויזואליים של המערכת</p>
                   </div>
                </div>
                <button 
                  onClick={resetAssets}
                  className="px-6 py-3 bg-[#f7c1ea]/10 text-[#ff009f] rounded-2xl font-black text-xs hover:bg-[#f7c1ea]/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  <RotateCcw size={14} />
                  איפוס לברירת מחדל
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(siteAssets || {}).map(([key, value]: [string, any]) => (
                   <div key={key} className="p-6 bg-[#f7c1ea]/10 rounded-[2rem] border border-[#ff009f]/5 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-[#ff009f]/10 relative group/avatar">
                            {typeof value === 'string' && value.startsWith('http') ? (
                               <img src={value} className="w-full h-full object-contain p-2" alt="" />
                            ) : (
                               <span className="text-[#f063c1]/40 font-black text-[10px] uppercase">{key.slice(0, 2)}</span>
                            )}
                            
                            <button 
                              onClick={() => {
                                setReplacingAssetKey(key);
                                assetFileInputRef.current?.click();
                              }}
                              disabled={isUploadingAsset === key}
                              className="absolute inset-0 bg-[#4a002e]/40 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all disabled:opacity-100"
                            >
                              {isUploadingAsset === key ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <Camera size={20} />
                              )}
                            </button>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-[#ff009f] uppercase tracking-widest mb-1">{key}</p>
                            <h4 className="text-lg font-black text-[#4a002e]">{ASSET_LABELS[key] || key}</h4>
                            <p className="text-[10px] font-bold text-[#f063c1]/40 truncate max-w-[180px]">{typeof value === 'string' ? value : 'נתון מורכב'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingAsset({ key, value: typeof value === 'string' ? value : '' })}
                          className="p-2 text-[#f063c1]/20 hover:text-[#ff009f] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Settings size={16} />
                        </button>
                        {typeof value === 'string' && value.startsWith('http') && (
                          <a href={value} target="_blank" rel="noreferrer" className="p-2 text-[#f063c1]/20 hover:text-[#4a002e] opacity-0 group-hover:opacity-100 transition-all">
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
        </div>
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#4a002e]/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-[#4a002e] mb-2">עדכון נכס: {editingAsset.key}</h3>
            <p className="text-[#f063c1]/60 font-bold text-sm mb-8">הזן כתובת URL חדשה עבור הנכס</p>
            
            <div className="space-y-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest mr-4">כתובת URL</label>
                <input 
                  type="text"
                  value={editingAsset.value}
                  onChange={(e) => setEditingAsset({ ...editingAsset, value: e.target.value })}
                  className="w-full bg-[#f7c1ea]/10 border border-[#ff009f]/5 rounded-2xl px-6 py-4 font-bold text-[#4a002e] focus:ring-2 focus:ring-[#ff009f] outline-none transition-all"
                  placeholder="https://..."
                />
              </div>
              
              {editingAsset.value.startsWith('http') && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-[#ff009f]/10 bg-[#f7c1ea]/10">
                  <img src={editingAsset.value} className="w-full h-full object-contain" alt="Preview" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setEditingAsset(null)}
                className="py-4 bg-[#f2def0] text-[#ff009f] rounded-2xl font-black text-sm hover:bg-[#ffd2fa] transition-all"
              >
                ביטול
              </button>
              <button 
                onClick={handleUpdateAsset}
                className="py-4 bg-[#ff009f] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#4a002e] transition-all"
              >
                עדכון נכס
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for Approved Member */}
      {approvedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#4a002e]/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-10 md:p-14 text-center animate-in zoom-in-95 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff009f]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              
              <div className="w-20 h-20 bg-[#ff009f] text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#ff009f]/10">
                 <CheckCircle2 size={40} />
              </div>
              
              <h3 className="text-3xl font-black text-[#4a002e] mb-4">חבר/ה חדש/ה בנבחרת!</h3>
              <p className="text-[#f063c1]/60 font-bold text-lg mb-10 leading-relaxed">
                הבקשה של <span className="text-[#ff009f]">{approvedUser.name}</span> אושרה.
                נא לשלוח לו/ה את פרטי הגישה:
              </p>
              
              <div className="bg-[#f7c1ea]/10 rounded-[2rem] p-8 mb-6 border border-[#ff009f]/5 relative group">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-right">
                       <span className="text-[10px] font-black text-[#f063c1]/40 uppercase tracking-widest">שם משתמש</span>
                       <span className="font-black text-[#4a002e]">{approvedUser.email}</span>
                    </div>
                    <div className="h-px bg-[#ff009f]/10"></div>
                    <div className="flex justify-between items-center text-right">
                       <span className="text-[10px] font-black text-[#f063c1]/40 uppercase tracking-widest">סיסמה זמנית</span>
                       <span className="font-black text-[#ff009f] text-xl tracking-wider select-all">{approvedUser.tempPassword}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-10">
                 <button 
                   onClick={() => openWhatsApp(approvedUser.mobile, approvedUser.name, approvedUser.email, approvedUser.tempPassword)}
                   className="w-full py-4 bg-[#ff009f] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#4a002e] transition-all flex items-center justify-center gap-3"
                 >
                   <MessageCircle size={20} />
                   שלח בוואטסאפ
                 </button>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(formatWhatsAppMessage(approvedUser.name, approvedUser.email, approvedUser.tempPassword));
                     alert('הודעת ההצטרפות הועתקה ללוח');
                   }}
                   className="w-full py-4 bg-[#f7c1ea]/20 text-[#ff009f] rounded-2xl font-black text-sm hover:bg-[#f7c1ea]/30 transition-all flex items-center justify-center gap-3"
                 >
                   <Copy size={18} />
                   העתק הודעה ללוח
                 </button>
              </div>
              
              <button 
                onClick={() => setApprovedUser(null)} 
                className="w-full py-5 bg-[#4a002e] text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-[#ff009f] transition-all"
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
