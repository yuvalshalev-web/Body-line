
import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, Archive, Mic, Image as ImageIcon, Calendar, Settings, UserCheck, ShieldAlert, Search, 
  Trash2, UserPlus, Mail, Phone, MapPin, ExternalLink, Edit2, CheckCircle2, XCircle, 
  Camera, UserCircle, ChevronLeft, ArrowLeft, LayoutDashboard, Copy, Check, Share2,
  Loader2, X, UserX, RotateCcw, MessageCircle, Plus, RefreshCw, Pencil, Save, Newspaper, ChevronDown, Cake,
  PanelTop, ArrowUpCircle, ArrowDownCircle, User, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { JoinRequest, Member } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from '../services/firebase';
import { processImage } from '../utils/imageProcessor';
import { updateStorageStats, syncStorageOnUpload } from '../utils/storageStats';
import StorageDisplay from '../components/StorageDisplay';
import EventEditor from '../components/admin/EventEditor';
import EditMemberForm from '../components/admin/EditMemberForm';
import PostEditor from '../components/admin/PostEditor';

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
  const { showAlert, showConfirm, showSuccess, showError } = useModal();
  const { 
    joinRequests, siteAssets, siteConfig, updateSiteConfig, approveRequest, rejectRequest, members, galleryItems, events, deleteEvent, updateEvent, addEvent, toggleRole, toggleStatus, resetPassword, updateSiteAssets, updateMember, deleteMember, archiveMember,
    yearConfig, updateYearConfig, news, deleteNews, addNews, updateNews, deleteGalleryItems
  } = useData();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REQUESTS' | 'SITE' | 'USERS' | 'POSTS' | 'GALLERY' | 'EVENTS' | 'ARCHIVE'>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [approvedUser, setApprovedUser] = useState<{ firstName: string; lastName: string; email: string; mobile: string; tempPassword: string } | null>(null);
  const [editingAsset, setEditingAsset] = useState<{ key: string, value: string } | null>(null);
  const [isUploadingAsset, setIsUploadingAsset] = useState<string | null>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingAssetKey, setReplacingAssetKey] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // לוגיקה לאובייקטים של Turquoise Glassmorphism
  useEffect(() => {
    if (activeTab !== 'SITE') return;

    const cleanupFns: (() => void)[] = [];

    // 1. תפעול ה-Toggle (הדלקה/כיבוי)
    const toggles = document.querySelectorAll('.gt-toggle');
    toggles.forEach(toggle => {
        const handleClick = () => toggle.classList.toggle('active');
        toggle.addEventListener('click', handleClick);
        cleanupFns.push(() => toggle.removeEventListener('click', handleClick));
    });

    // 2. תפעול ה-Segmented Control (מעבר בין אפשרויות)
    const segmentedContainers = document.querySelectorAll('.gt-segmented');
    segmentedContainers.forEach(container => {
        const items = container.querySelectorAll('.gt-segment-item');
        items.forEach(item => {
            const handleClick = () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            };
            item.addEventListener('click', handleClick);
            cleanupFns.push(() => item.removeEventListener('click', handleClick));
        });
    });

    // 3. תפעול ה-Stepper (פלוס/מינוס)
    const steppers = document.querySelectorAll('.gt-stepper');
    steppers.forEach(stepper => {
        const valDisplay = stepper.querySelector('.gt-step-val');
        const btnMinus = stepper.querySelector('.minus');
        const btnPlus = stepper.querySelector('.plus');
        
        if (!valDisplay || !btnMinus || !btnPlus) return;

        let count = parseInt(valDisplay.textContent || '0') || 0;

        const handleMinus = () => {
            count--;
            valDisplay.textContent = count.toString();
        };
        
        const handlePlus = () => {
            count++;
            valDisplay.textContent = count.toString();
        };

        btnMinus.addEventListener('click', handleMinus);
        btnPlus.addEventListener('click', handlePlus);
        cleanupFns.push(() => {
            btnMinus.removeEventListener('click', handleMinus);
            btnPlus.removeEventListener('click', handlePlus);
        });
    });

    return () => cleanupFns.forEach(fn => fn());
  }, [activeTab]);
  
  // Year Config State
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [yearForm, setYearForm] = useState({ startDate: '', endDate: '' });
  const [isSavingYear, setIsSavingYear] = useState(false);

  React.useEffect(() => {
    if (yearConfig) {
      setYearForm({ startDate: yearConfig.startDate, endDate: yearConfig.endDate });
    }
  }, [yearConfig]);

  const calculateWeeks = (startDateStr: string) => {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const now = new Date();
    if (now < start) return 0;
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  };

  // Event Editing State
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  // Post Editing State
  const [editingPost, setEditingPost] = useState<any>(null);

  // Gallery Selection State
  const [selectedGalleryItems, setSelectedGalleryItems] = useState<string[]>([]);

  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.email === 'yuval@shalev.io';

  const formatDate = (dateValue: string) => {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
  };

  const handleAssetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingAssetKey) return;

    setIsUploadingAsset(replacingAssetKey);
    try {
      const processed = await processImage(file, 1200, 0.85);
      const storage = getStorageInstance();
      const storageRef = ref(storage, `assets/site/${replacingAssetKey}_${Date.now()}`);
      
      await uploadBytes(storageRef, processed.blob);
      await syncStorageOnUpload(processed.blob.size);
      const downloadUrl = await getDownloadURL(storageRef);
      
      await updateSiteAssets({ [replacingAssetKey]: downloadUrl });
      showSuccess('הנכס עודכן בהצלחה');
    } catch (err) {
      console.error(err);
      showError('שגיאה בהעלאת הנכס');
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
      showError('שגיאה בעדכון הנכס');
    }
  };

  const resetAssets = async () => {
    showConfirm({
      message: 'האם לאפס את כל הנכסים לערכי ברירת המחדל?',
      onConfirm: async () => {
        const defaults = {
          habalZugLogo: "", // Let user upload the correct one
          atalefLogo: "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fatalef-logo.png?alt=media",
          reefLogo: "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Freef-logo.png?alt=media",
          heroBg: "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media",
          loginBg: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=2000"
        };
        try {
          await updateSiteAssets(defaults);
          showSuccess('הנכסים אופסו בהצלחה');
        } catch (err) {
          console.error(err);
          showError('שגיאה באיפוס הנכסים');
        }
      }
    });
  };

  const filteredRequests = joinRequests.filter(req => 
    (req.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (req.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      const result = await approveRequest(id);
      
      if (result) {
        setApprovedUser(result);
        const message = encodeURIComponent(formatWhatsAppMessage(`${result.firstName} ${result.lastName}`, result.email, result.tempPassword));
        const cleanMobile = result.mobile.replace(/\D/g, '');
        const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
        const waUrl = `https://wa.me/${finalMobile}?text=${message}`;
        
        const win = window.open(waUrl, '_blank');
        if (!win) {
          showAlert('הבקשה אושרה! אך חוסם הפופ-אפים מנע את פתיחת וואטסאפ. נא ללחוץ על הכפתור בפאנל שייפתח.');
        }
      } else {
        showError('הבקשה כבר אינה קיימת או שאושרה על ידי מנהל אחר.');
      }
    } catch (err) {
      console.error('AdminPage: Approve error:', err);
      showError('שגיאה בתהליך האישור. בדוק את החיבור לאינטרנט או את הרשאות המנהל.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string, name: string, mobile: string) => {
    showConfirm({
      message: `האם לדחות את בקשת ההצטרפות של ${name}? הבקשה תימחק והמשתמש יקבל הודעת דחייה.`,
      onConfirm: async () => {
        setIsProcessing(id);
        try {
          await rejectRequest(id);
          
          const cleanMobile = mobile.replace(/\D/g, '');
          const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
          const rejectMsg = `היי *${name}*, תודה על הפנייה ל-אתר חבל זוג 🌊\nכרגע זה פחות מתאים, אבל נשמח לשמור על קשר ולהתעדכן בהמשך במידה ומשהו ישתנה.\nשיהיה אחלה יום! 👋`;
          const waUrl = `https://wa.me/${finalMobile}?text=${encodeURIComponent(rejectMsg)}`;
          
          const win = window.open(waUrl, '_blank');
          if (!win) {
            showAlert('הבקשה נדחתה ונמחקה! אך חוסם הפופ-אפים מנע את פתיחת וואטסאפ.');
          }
        } catch (err) {
          console.error('AdminPage: Reject error:', err);
          showError('שגיאה במחיקת הבקשה.');
        } finally {
          setIsProcessing(null);
        }
      }
    });
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
        {/* Body-line Standard Header Stack */}
        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          {/* Top Badge */}
          <div className="header-badge-glass">
            <ShieldAlert size={12} className="text-[#ff009f]" />
            <span>ADMIN CONTROL CENTER</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl t-mobile-gradient uppercase tracking-tighter">
            מרכז ניהול
          </h1>

          {/* Subtitle with Emoji context */}
          <div className="flex flex-col items-center gap-6">
            <p className="header-subtitle max-w-2xl">
              ניהול משתמשים, בקשות הצטרפות והגדרות מערכת מתקדמות 🛡️
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Sidebar Navigation - Sleek Icon Grid */}
          <aside className="w-full lg:w-24 flex-shrink-0 lg:sticky lg:top-8 z-40">
            <nav className="bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] border border-[#ff009f]/10 flex lg:flex-col gap-3 shadow-2xl shadow-[#ff009f]/5 overflow-x-auto lg:overflow-x-visible no-scrollbar">
              {[
                { id: 'DASHBOARD', label: 'ראשי', icon: LayoutDashboard },
                { id: 'USERS', label: 'משתמשים', icon: Users },
                { id: 'ARCHIVE', label: 'ארכיון', icon: Archive },
                { id: 'POSTS', label: 'פוסטים', icon: Newspaper },
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
            {isProcessing && (
              <div className="fixed top-4 left-4 bg-black text-white p-2 z-[999] text-[10px]">
                Processing: {isProcessing}
              </div>
            )}

            {activeTab === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                {[
                  { id: 'USERS', label: 'ניהול משתמשים', desc: `${members.length} חברים רשומים`, icon: Users, color: 'bg-[#ff009f]' },
                  { id: 'REQUESTS', label: 'בקשות הצטרפות', desc: `${joinRequests.length} ממתינים לאישור`, icon: UserCheck, color: 'bg-[#f063c1]', count: joinRequests.length },
                  { id: 'EVENTS', label: 'ניהול אירועים', desc: `${events.length} אירועים בלוח`, icon: Calendar, color: 'bg-[#f7c1ea]' },
                  { id: 'GALLERY', label: 'גלריית תמונות', desc: `${galleryItems.length} פריטים במדיה`, icon: ImageIcon, color: 'bg-[#ffd2fa]' },
                  { id: 'POSTS', label: 'פוסטים', desc: 'ניהול תכני האתר', icon: Newspaper, color: 'bg-[#f2def0]' },
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
                          <h4 className="text-xl font-black text-[#4a002e] mb-1">{req.firstName} {req.lastName}</h4>
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
                         onClick={() => {
                           handleApprove(req.id);
                         }}
                         disabled={isProcessing === req.id}
                         className="flex-1 py-4 bg-[#ff009f] text-white rounded-2xl font-black text-sm hover:bg-[#4a002e] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} className="text-[#ffd2fa]" />}
                         אשר הצטרפות
                       </button>
                       <button 
                         onClick={() => {
                           handleReject(req.id, `${req.firstName} ${req.lastName}`, req.mobile);
                         }}
                         disabled={isProcessing === req.id}
                         className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center border-2 border-rose-200 hover:border-rose-600 shadow-sm"
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
              <EditMemberForm
                member={editingMember}
                isSuperAdmin={isSuperAdmin}
                onSave={async (updatedMember) => {
                  await updateMember(updatedMember);
                  setEditingMember(null);
                }}
                onArchive={async (memberId) => {
                  await archiveMember(memberId);
                  setEditingMember(null);
                  setActiveTab('ARCHIVE');
                }}
                onClose={() => setEditingMember(null)}
              />
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
                      {members.filter(m => m.isActive !== false).sort((a, b) => {
                        const aLast = a.lastName || '';
                        const bLast = b.lastName || '';
                        const aFirst = a.firstName || '';
                        const bFirst = b.firstName || '';
                        if (aLast || bLast) {
                          const lastCompare = aLast.localeCompare(bLast, 'he');
                          if (lastCompare !== 0) return lastCompare;
                          return aFirst.localeCompare(bFirst, 'he');
                        }
                        return aFirst.localeCompare(bFirst, 'he');
                      }).map(member => (
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
                                <h4 className="font-black text-[#4a002e]">{member.firstName} {member.lastName}</h4>
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
                    {members.filter(m => m.isActive === false).sort((a, b) => {
                      const aLast = a.lastName || '';
                      const bLast = b.lastName || '';
                      const aFirst = a.firstName || '';
                      const bFirst = b.firstName || '';
                      if (aLast || bLast) {
                        const lastCompare = aLast.localeCompare(bLast, 'he');
                        if (lastCompare !== 0) return lastCompare;
                        return aFirst.localeCompare(bFirst, 'he');
                      }
                      return aFirst.localeCompare(bFirst, 'he');
                    }).map(member => (
                      <tr key={member.id} className="hover:bg-[#f7c1ea]/10 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {member.avatar ? (
                              <img 
                                src={member.avatar} 
                                className="w-12 h-12 rounded-xl object-cover shadow-sm opacity-50 cursor-pointer hover:opacity-100 transition-opacity" 
                                alt="" 
                                onClick={() => setEditingMember(member)}
                              />
                            ) : (
                              <div 
                                className="w-12 h-12 rounded-xl bg-[#f7c1ea]/20 flex items-center justify-center text-[#f063c1]/20 cursor-pointer hover:bg-[#f7c1ea]/30 transition-colors"
                                onClick={() => setEditingMember(member)}
                              >
                                <UserCircle size={24} />
                              </div>
                            )}
                            <div>
                              <h4 className="font-black text-[#f063c1]/40">{member.firstName} {member.lastName}</h4>
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
                                showConfirm({
                                  message: 'האם להחזיר את המשתמש לפעילות?',
                                  onConfirm: async () => {
                                    try {
                                      await updateMember({ ...member, isActive: true });
                                      showSuccess('המשתמש הוחזר לפעילות');
                                    } catch (err) {
                                      showError('שגיאה בהחזרת המשתמש');
                                    }
                                  }
                                });
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

        {activeTab === 'POSTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-[#ff009f]/10">
              <div>
                <h2 className="text-2xl font-black text-slate-800">ניהול פוסטים</h2>
                <p className="text-slate-500 font-medium">ניהול ומחיקה של פוסטים שפורסמו על ידי חברי הקהילה</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-[#f2def0] text-[#f063c1] px-4 py-2 rounded-xl font-black text-sm">
                  {news.length} פוסטים
                </div>
                <button 
                  onClick={() => setEditingPost({})}
                  className="bg-[#ff009f] text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-[#4a002e] transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  פוסט חדש
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map(item => (
                <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col relative group">
                  {item.imageUrl && (
                    <img src={item.imageUrl} className="w-full h-40 object-cover rounded-xl mb-4" alt="" />
                  )}
                  <h3 className="font-black text-lg text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">{item.content}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      {item.authorAvatar ? (
                        <img src={item.authorAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-black text-slate-700">{item.authorName}</p>
                        <p className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString('he-IL')}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingPost(item)}
                        className="p-2 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          showConfirm({
                            title: 'מחיקת פוסט',
                            message: 'האם אתה בטוח שברצונך למחוק את הפוסט?',
                            confirmText: 'מחיקה',
                            cancelText: 'ביטול',
                            onConfirm: async () => {
                              try {
                                await deleteNews(item.id);
                                showSuccess('הפוסט נמחק בהצלחה');
                              } catch (err) {
                                showError('שגיאה במחיקת הפוסט');
                              }
                            }
                          });
                        }}
                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {news.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                  <Newspaper className="mx-auto text-slate-300 mb-4" size={48} />
                  <h3 className="text-xl font-black text-slate-400">אין פוסטים במערכת</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {editingPost && (
          <PostEditor
            post={editingPost}
            onSave={async (updatedPost) => {
              if (updatedPost.id) {
                await updateNews(updatedPost);
              } else {
                await addNews(updatedPost);
              }
              setEditingPost(null);
            }}
            onClose={() => setEditingPost(null)}
          />
        )}

        {activeTab === 'GALLERY' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-[#ff009f]/10">
               <div>
                 <h2 className="text-2xl font-black text-slate-800">ניהול גלריה</h2>
                 <p className="text-slate-500 font-medium">ניהול ומחיקה של תמונות מהגלריה</p>
               </div>
               <div className="flex items-center gap-4">
                 <div className="bg-[#f2def0] text-[#f063c1] px-4 py-2 rounded-xl font-black text-sm">
                   {galleryItems.length} תמונות
                 </div>
                 {selectedGalleryItems.length > 0 && (
                   <button 
                     onClick={() => {
                       showConfirm({
                         title: 'מחיקת תמונות',
                         message: `האם אתה בטוח שברצונך למחוק ${selectedGalleryItems.length === 1 ? 'את התמונה' : 'את התמונות'}?`,
                         confirmText: 'מחיקה',
                         cancelText: 'ביטול',
                         onConfirm: async () => {
                           try {
                             await deleteGalleryItems(selectedGalleryItems);
                             setSelectedGalleryItems([]);
                             showSuccess('התמונות נמחקו בהצלחה');
                           } catch (err) {
                             showError('שגיאה במחיקת התמונות');
                           }
                         }
                       });
                     }}
                     className="bg-red-500 text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
                   >
                     <Trash2 size={16} />
                     מחק {selectedGalleryItems.length} תמונות
                   </button>
                 )}
               </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {galleryItems.map(item => (
                 <div 
                   key={item.id} 
                   className={`aspect-square rounded-2xl overflow-hidden relative group border-2 transition-all cursor-pointer ${
                     selectedGalleryItems.includes(item.id) ? 'border-[#ff009f] shadow-lg shadow-[#ff009f]/20' : 'border-[#ff009f]/5'
                   }`}
                   onClick={() => {
                     setSelectedGalleryItems(prev => 
                       prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                     );
                   }}
                 >
                   {item.imageUrl ? (
                     <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                   ) : (
                     <div className="w-full h-full bg-[#f7c1ea]/10 flex items-center justify-center text-[#f063c1]/20">
                       <ImageIcon size={32} />
                     </div>
                   )}
                   
                   <div className="absolute top-2 right-2 z-10">
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                       selectedGalleryItems.includes(item.id) ? 'bg-[#ff009f] border-[#ff009f] text-white' : 'bg-white/50 border-white/80 text-transparent group-hover:bg-white/80'
                     }`}>
                       <Check size={14} strokeWidth={3} />
                     </div>
                   </div>

                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         window.open(item.imageUrl, '_blank');
                       }}
                       className="p-3 bg-white/20 text-white rounded-xl backdrop-blur-sm hover:bg-white/30 transition-all"
                     >
                       <ImageIcon size={18} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'EVENTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#ff009f]/10 rounded-2xl flex items-center justify-center text-[#ff009f]">
                  <Calendar size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#4a002e]">ניהול אירועים</h3>
                  <p className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest">ניהול לוח הזמנים הקהילתי</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingEvent({})}
                className="px-8 py-4 bg-gradient-to-r from-[#ff009f] to-[#f063c1] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#ff009f]/20 hover:scale-105 transition-all flex items-center gap-3 active:scale-95"
              >
                <Plus size={20} />
                אירוע חדש
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(event => (
                <div key={event.id} className="bg-white border border-[#ff009f]/5 rounded-[3rem] p-8 shadow-sm hover:shadow-xl hover:shadow-[#ff009f]/5 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="bg-[#ff009f]/10 text-[#ff009f] p-4 rounded-2xl flex items-center justify-center font-black min-w-max">
                      <span className="text-sm whitespace-nowrap tabular-nums">{formatDate(event.date)}</span>
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
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditEvent(event)}
                      className="p-4 bg-[#f7c1ea]/10 text-[#f063c1] rounded-2xl hover:bg-[#ff009f] hover:text-white transition-all"
                      title="עריכת אירוע"
                    >
                      <Pencil size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        showConfirm({
                          message: 'האם למחוק אירוע זה?',
                          onConfirm: () => deleteEvent(event.id)
                        });
                      }}
                      className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                      title="מחיקת אירוע"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SITE' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
            {/* Habal Zug Year Config Widget */}
            <div className="bg-gradient-to-br from-[#4a002e] to-[#2d001c] p-1 rounded-[3rem] shadow-2xl shadow-[#ff009f]/10 group">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#ff009f]/5 rounded-full blur-3xl group-hover:bg-[#ff009f]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ff009f] to-[#f063c1] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#ff009f]/20 group-hover:rotate-6 transition-transform">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#4a002e] tracking-tight">שנת חבל זוג</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest">תקופה פעילה כעת</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 lg:gap-12 relative z-10">
                  <div 
                    className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 cursor-pointer hover:bg-white hover:shadow-md transition-all group/dates"
                    onClick={() => setIsEditingYear(true)}
                  >
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                        תחילת שנת פעילות
                        <Calendar size={10} className="text-[#ff009f] opacity-0 group-hover/dates:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-base font-black text-[#4a002e] tabular-nums">{formatDate(yearConfig?.startDate || '---')}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 mx-2" />
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                        סיום שנת פעילות
                        <Calendar size={10} className="text-[#ff009f] opacity-0 group-hover/dates:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-base font-black text-[#4a002e] tabular-nums">{formatDate(yearConfig?.endDate || '---')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-[#f063c1] uppercase tracking-widest mb-1">שבועות שחלפו</p>
                      <div className="flex items-baseline gap-1 justify-center">
                        <span className="text-4xl font-black text-[#ff009f] tabular-nums">{calculateWeeks(yearConfig?.startDate || '')}</span>
                        <span className="text-[10px] font-black text-slate-400">/ 52</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsEditingYear(true)}
                      className="w-14 h-14 bg-[#4a002e] text-white rounded-2xl flex items-center justify-center hover:bg-[#ff009f] transition-all shadow-xl shadow-[#4a002e]/10 active:scale-90"
                      title="עריכת הגדרות שנה"
                    >
                      <Settings size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Position Toggle Widget */}
            <div className="bg-gradient-to-br from-[#4a002e] to-[#2d001c] p-1 rounded-[3rem] shadow-2xl shadow-[#ff009f]/10 group">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#ff009f]/5 rounded-full blur-3xl group-hover:bg-[#ff009f]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ff009f] to-[#f063c1] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#ff009f]/20 group-hover:rotate-6 transition-transform">
                    <LayoutDashboard size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#4a002e] tracking-tight">מיקום תפריט הניווט</h3>
                    <p className="text-[10px] font-black text-[#f063c1]/60 uppercase tracking-widest mt-1">החלפה בין תפריט עליון לתחתון</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${siteConfig.navPosition !== 'floating-bottom' ? 'text-[#ff009f]' : 'text-slate-400'}`}>
                      עליון
                    </span>
                    <div 
                      className={`gt-toggle ${siteConfig.navPosition === 'floating-bottom' ? 'active' : ''}`}
                      onClick={() => {
                        const newPos = siteConfig.navPosition === 'floating-bottom' ? 'floating-top' : 'floating-bottom';
                        updateSiteConfig({ navPosition: newPos });
                      }}
                    />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${siteConfig.navPosition === 'floating-bottom' ? 'text-[#ff009f]' : 'text-slate-400'}`}>
                      תחתון
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#ff009f]/10 rounded-[4rem] p-12 shadow-sm">
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

              {/* Visual Component Gallery - Turquoise Glassmorphism */}
              <div className="mt-16 pt-16 border-t border-[#ff009f]/10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-[#40E0D0] text-white rounded-2xl shadow-lg shadow-[#40E0D0]/20"><Sparkles size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-[#4a002e]">גלריית רכיבים ויזואלית</h3>
                    <p className="text-[#40E0D0] font-bold">Turquoise Glassmorphism Component System</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* 1. Primary Button */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">כפתור ראשי</p>
                    <button className="gt-btn-primary">לחץ כאן</button>
                  </div>

                  {/* 2. Glass Button */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">כפתור זכוכית</p>
                    <button className="gt-btn-glass">כפתור שקוף</button>
                  </div>

                  {/* 3. Toggle */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מפסק טורקיז (Toggle)</p>
                    <div className="gt-toggle" />
                  </div>

                  {/* 4. Segmented Control */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">בקר מקטעים (Segmented)</p>
                    <div className="gt-segmented">
                      <div className="gt-segment-item active">LIST</div>
                      <div className="gt-segment-item">GRID</div>
                    </div>
                  </div>

                  {/* 5. Real Slider */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4 w-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סליידר אמיתי</p>
                    <input type="range" className="gt-slider-input w-full" defaultValue="50" />
                  </div>

                  {/* 6. Stepper */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מונה (Stepper)</p>
                    <div className="gt-stepper">
                      <div className="gt-step-btn minus">-</div>
                      <div className="gt-step-val">10</div>
                      <div className="gt-step-btn plus">+</div>
                    </div>
                  </div>

                  {/* 7. Input Field */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4 w-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">שדה טקסט (Input)</p>
                    <input type="text" className="gt-input" placeholder="הקלד כאן..." />
                  </div>

                  {/* 8. Select/Dropdown */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4 w-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תפריט בחירה (Select)</p>
                    <select className="gt-select">
                      <option>אופציה 1</option>
                      <option>אופציה 2</option>
                      <option>אופציה 3</option>
                    </select>
                  </div>

                  {/* 9. Checkbox */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">צ'קבוקס (Checkbox)</p>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="gt-checkbox" id="gt-check-demo" />
                      <label htmlFor="gt-check-demo" className="text-xs font-bold text-slate-500">בחר אותי</label>
                    </div>
                  </div>

                  {/* 10. Sample Card */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4 w-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">כרטיס לדוגמה (Card)</p>
                    <div className="gt-card w-full">
                      <h4 className="font-black text-[#4a002e] mb-2">כותרת כרטיס</h4>
                      <p className="text-[10px] text-slate-500">זהו כרטיס זכוכית מעוצב עם אפקט טשטוש עדין.</p>
                    </div>
                  </div>

                  {/* 11. Status Badge */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תווית סטטוס (Badge)</p>
                    <div className="flex gap-2">
                      <span className="gt-badge">פעיל</span>
                      <span className="gt-badge" style={{ background: 'rgba(255, 0, 159, 0.1)', color: '#ff009f' }}>חדש</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* Edit Event Modal */}
      {editingEvent && (
        <EventEditor
          event={editingEvent}
          onSave={async (updatedEvent) => {
            if (updatedEvent.id) {
              await updateEvent(updatedEvent);
            } else {
              await addEvent(updatedEvent);
            }
            setEditingEvent(null);
          }}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {/* Year Config Warning Modal */}
      {isEditingYear && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-rose-500 p-10 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <ShieldAlert size={64} className="mx-auto mb-6 animate-bounce" />
              <h3 className="text-3xl font-black mb-2">אזהרת מערכת קריטית</h3>
              <p className="text-white/80 font-bold">שינוי הגדרות זמן ליבה</p>
            </div>

            <div className="p-10 space-y-8">
              <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 text-rose-700 text-center font-black leading-relaxed">
                ⚠️ שים לב: שינוי התאריכים ישבש את תפקוד האתר ואת הדוחות. נגיעה מותרת רק בחירום.
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">תאריך התחלה חדש</label>
                  <input 
                    type="date" 
                    value={yearForm.startDate}
                    onChange={e => setYearForm(prev => ({ ...prev, startDate: e.target.value }))}
                    onClick={(e) => (e.currentTarget as any).showPicker?.()}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 ring-[#ff009f]/5 focus:bg-white transition-all cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">תאריך סיום חדש</label>
                  <input 
                    type="date" 
                    value={yearForm.endDate}
                    onChange={e => setYearForm(prev => ({ ...prev, endDate: e.target.value }))}
                    onClick={(e) => (e.currentTarget as any).showPicker?.()}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 ring-[#ff009f]/5 focus:bg-white transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={async () => {
                    setIsSavingYear(true);
                    try {
                      await updateYearConfig(yearForm);
                      setIsEditingYear(false);
                      showSuccess('הגדרות השנה עודכנו בהצלחה');
                    } catch (err) {
                      showError('שגיאה בעדכון הגדרות השנה');
                    } finally {
                      setIsSavingYear(false);
                    }
                  }}
                  disabled={isSavingYear}
                  className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSavingYear ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  אני מבין את ההשלכות - שמור שינויים
                </button>
                <button 
                  onClick={() => setIsEditingYear(false)}
                  className="w-full py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-lg hover:bg-slate-200 transition-all"
                >
                  ביטול וחזרה
                </button>
              </div>
            </div>
          </motion.div>
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
                הבקשה של <span className="text-[#ff009f]">{approvedUser.firstName} {approvedUser.lastName}</span> אושרה.
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
                   onClick={() => openWhatsApp(approvedUser.mobile, `${approvedUser.firstName} ${approvedUser.lastName}`, approvedUser.email, approvedUser.tempPassword)}
                   className="w-full py-4 bg-[#ff009f] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#4a002e] transition-all flex items-center justify-center gap-3"
                 >
                   <MessageCircle size={20} />
                   שלח בוואטסאפ
                 </button>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(formatWhatsAppMessage(`${approvedUser.firstName} ${approvedUser.lastName}`, approvedUser.email, approvedUser.tempPassword));
                     showSuccess('הודעת ההצטרפות הועתקה ללוח');
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
  </div>
</div>
</div>
  );
};

export default AdminPage;
