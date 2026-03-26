
import React, { useState, useRef, useEffect } from 'react';
import GlassNavigationBar from '../components/GlassNavigationBar';
import { 
  Users, Archive, Mic, Image as ImageIcon, Calendar, Settings, UserCheck, ShieldAlert, Search, 
  Trash2, UserPlus, Mail, Phone, MapPin, ExternalLink, Edit2, CheckCircle2, XCircle, 
  Camera, UserCircle, ChevronLeft, ArrowLeft, LayoutDashboard, Copy, Check, Share2,
  Loader2, X, UserX, RotateCcw, MessageCircle, Plus, RefreshCw, Pencil, Save, Newspaper, ChevronDown, Cake,
  PanelTop, ArrowUpCircle, ArrowDownCircle, User, Globe, Activity, AlertTriangle, Terminal,
  FileText, Map as MapIcon, Clock, Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { extractAddressData, loadGoogleMaps } from '../utils/googlePlaces';
import { TimePicker } from '../components/TimePicker';
import { DayPicker } from '../components/DayPicker';
import { EventEditor } from '../components/admin/EventEditor';
import EditMemberForm from '../components/admin/EditMemberForm';
import AddMemberModal from '../components/admin/AddMemberModal';
import { PostEditor } from '../components/admin/PostEditor';
import { AdminRolloverReport } from './AdminRolloverReport';
import { AdminAssets } from './AdminAssets';
import SystemMonitor from '../components/SystemMonitor';
import { MarkdownViewer } from '../components/admin/MarkdownViewer';
import MemberGradingPage from './MemberGradingPage';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { calculateUserStats } from '../utils/analytics';



const AdminPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showAlert, showConfirm, showSuccess, showError } = useModal();
  const { 
    joinRequests, siteAssets, siteConfig, updateSiteConfig, approveRequest, rejectRequest, members, galleryItems, events, deleteEvent, updateEvent, addEvent, toggleRole, toggleStatus, resetPassword, updateSiteAssets, updateMember, deleteMember, archiveMember, addMember,
    yearConfig, updateYearConfig, news, deleteNews, addNews, updateNews, deleteGalleryItems, addGalleryItem, conflictingAdmins, weeklyHistory
  } = useData();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REQUESTS' | 'USERS' | 'POSTS' | 'GALLERY' | 'EVENTS' | 'ARCHIVE' | 'ROLLOVER' | 'ENGINE_ROOM' | 'GRADES' | 'ASSETS'>('USERS');
  const [newSessionDay, setNewSessionDay] = useState(0);
  const [newSessionTime, setNewSessionTime] = useState('07:00');
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

  const adminTabs = [
    { id: 'USERS', label: 'משתמשים', icon: <Users size={20} /> },
    { id: 'GRADES', label: 'הערכות', icon: <UserCheck size={20} /> },
    { id: 'POSTS', label: 'פוסטים', icon: <Newspaper size={20} /> },
    { id: 'GALLERY', label: 'גלריה', icon: <ImageIcon size={20} /> },
    { id: 'EVENTS', label: 'אירועים', icon: <Calendar size={20} /> },
    { id: 'ROLLOVER', label: 'דו"ח יום חמישי', icon: <Activity size={20} /> },
    { id: 'ARCHIVE', label: 'ארכיון', icon: <Archive size={20} /> },
    { id: 'REQUESTS', label: 'בקשות', icon: <UserCheck size={20} />, count: joinRequests.length },
    { id: 'ENGINE_ROOM', label: 'חדר מכונות', icon: <Terminal size={20} /> },
    { id: 'ASSETS', label: 'נכסים ועיצוב', icon: <ImageIcon size={20} /> }
  ];

  const isAdmin = currentUser?.role === 'Admin';

  const handleTabChange = (id: string) => {
    setActiveTab(id as any);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [approvedUser, setApprovedUser] = useState<{ firstName: string; lastName: string; email: string; mobile: string; tempPassword: string } | null>(null);

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editingConflictId, setEditingConflictId] = useState<string | null>(null);
  const [conflictNewEmail, setConflictNewEmail] = useState('');
  const [newMemberData, setNewMemberData] = useState<Partial<Member>>({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    avatar: '',
    bio: '',
    role: 'Member',
    gender: 'מעדיף/ה לא לציין',
    isActive: true,
    birthday: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    password: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Markdown Viewer State
  const [markdownConfig, setMarkdownConfig] = useState<{ isOpen: boolean; path: string; title: string }>({
    isOpen: false,
    path: '',
    title: ''
  });

  // Home Break State
  const [isPlaceSelected, setIsPlaceSelected] = useState(!!siteConfig.home_break?.formatted);
  const [hasConfirmedHomeBreakEdit, setHasConfirmedHomeBreakEdit] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const selectedPlaceRef = useRef<any>(null);

  useEffect(() => {
    if (activeTab !== 'ASSETS') return;

    const initAutocomplete = () => {
      // הגנה משופרת: בודקים שכל שרשרת האובייקטים קיימת לפני הגישה אליהם
      if (
        addressInputRef.current && 
        window.google?.maps?.places?.Autocomplete && 
        !autocompleteRef.current
      ) {
        try {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            componentRestrictions: { country: "il" },
            fields: ["address_components", "geometry", "formatted_address"]
          });

          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace();
            
            if (!place.geometry) {
              if (place.name && window.google?.maps?.Geocoder) {
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ address: place.name + ', Israel' }, (results: any, status: any) => {
                  if (status === 'OK' && results && results[0]) {
                    setIsPlaceSelected(true);
                    selectedPlaceRef.current = results[0];
                    if (addressInputRef.current) {
                      addressInputRef.current.value = results[0].formatted_address || results[0].name || '';
                    }
                  } else {
                    setIsPlaceSelected(false);
                    selectedPlaceRef.current = null;
                  }
                });
              } else {
                setIsPlaceSelected(false);
                selectedPlaceRef.current = null;
              }
              return;
            }

            setIsPlaceSelected(true);
            selectedPlaceRef.current = place;
            if (addressInputRef.current) {
              addressInputRef.current.value = place.formatted_address || place.name || '';
            }
          });
        } catch (e) {
          console.error("Failed to initialize Autocomplete:", e);
        }
      }
    };

    // Global error handler for Google Maps API
    (window as any).gm_authFailure = () => {
      console.error("Google Maps API authentication/authorization failed.");
      showError('שגיאת הרשאות במפות גוגל. יש לוודא שה-Places API וה-Maps JavaScript API מופעלים ב-Google Cloud.');
    };

    loadGoogleMaps()
      .then(initAutocomplete)
      .catch(err => {
        console.warn("Google Maps loading failed:", err.message);
      });

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [activeTab]);

  // Year Config State
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [yearForm, setYearForm] = useState({ startDate: '', endDate: '' });
  const [isSavingYear, setIsSavingYear] = useState(false);

  // Weekly Sessions State
  const [weeklySessions, setWeeklySessions] = useState<{ dayOfWeek: number, time: string, isActive?: boolean, isRecurring?: boolean }[]>(
    siteConfig.weeklySessions || [{ dayOfWeek: 4, time: '07:00', isActive: false, isRecurring: true }]
  );
  const [isSavingSessions, setIsSavingSessions] = useState(false);

  React.useEffect(() => {
    if (siteConfig.weeklySessions) {
      setWeeklySessions(siteConfig.weeklySessions);
    }
  }, [siteConfig.weeklySessions]);

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



  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. Process image
        const processed = await processImage(file, 1920, 0.8, 1000);
        
        // 2. Upload to Storage
        const storagePath = `gallery/${Date.now()}_${file.name}`;
        const storageRef = ref(getStorageInstance(), storagePath);
        await uploadBytes(storageRef, processed.blob);
        const imageUrl = await getDownloadURL(storageRef);
        
        // 3. Add to Firestore
        await addGalleryItem({
          imageUrl,
          storagePath,
          uploaderId: currentUser?.uid || 'admin',
          uploaderName: `${currentUser?.firstName || 'רכז'} ${currentUser?.lastName || ''}`.trim(),
          caption: '',
          timestamp: null
        });

        // 4. Update stats
        await syncStorageOnUpload(processed.blob.size);
        
        successCount++;
      }
      
      showSuccess(`הועלו ${successCount} תמונות בהצלחה`);
    } catch (err) {
      console.error('Gallery upload error:', err);
      showError('שגיאה בהעלאת התמונות');
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
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
      } else {
        showError('הבקשה כבר אינה קיימת או שאושרה על ידי מנהל אחר.');
      }
    } catch (err) {
      console.error('AdminPage: Approve error:', err);
      showError('שגיאה בתהליך האישור. בדוק את החיבור לאינטרנט או את הרשאות הרכז.');
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
    <div className="relative min-h-screen luxury-bg text-right space-y-12 pb-20 pt-8" dir="rtl">
      {/* Background Glows to make glassmorphism pop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-200/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-200/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Combined Header Unit with Integrated Nav - Boxed Inset */}
        <div className="luxury-card p-6 mb-12 border border-white/40">
          <div className="surfboard-hero-container mb-6 space-y-2 header-wallpaper !py-10 rounded-[2rem]" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
            <div className="header-content-wrapper relative z-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
                <Settings size={40} />
              </div>
              <h1 className="main-page-title">
                <span className="surfer-title">פאנל ניהול</span>
              </h1>
              <p className="header-subtitle max-w-2xl mx-auto">
                ניהול משתמשים, בקשות הצטרפות והגדרות מערכת מתקדמות 🛡️
              </p>
            </div>
          </div>

          <div className="w-full">
            <GlassNavigationBar 
              items={adminTabs}
              activeId={activeTab}
              onChange={handleTabChange}
            />
          </div>
        </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full">
            {isProcessing && (
              <div className="fixed top-4 left-4 bg-black text-white p-2 z-[999] text-[12px]">
                Processing: {isProcessing}
              </div>
            )}

            {activeTab === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                {[
                  { id: 'USERS', label: 'ניהול משתמשים', desc: `${members.length} חברים רשומים`, icon: Users, color: 'bg-[#00FFFF]' },
                  { id: 'EVENTS', label: 'ניהול אירועים', desc: `${events.length} אירועים בלוח`, icon: Calendar, color: 'bg-[#FFD700]' },
                  { id: 'GALLERY', label: 'גלריית תמונות', desc: `${galleryItems.length} פריטים במדיה`, icon: ImageIcon, color: 'bg-[#FF007F]' },
                  { id: 'POSTS', label: 'פוסטים', desc: 'ניהול תכני האתר', icon: Newspaper, color: 'bg-[#00FFFF]' },
                  { id: 'ROLLOVER', label: 'דו"ח יום חמישי', desc: 'ארכיון סשנים שבועי וסיכום נוכחות', icon: Activity, color: 'bg-[#FFD700]' },
                  ...(isAdmin ? [
                    { id: 'REQUESTS', label: 'בקשות הצטרפות', desc: `${joinRequests.length} ממתינים לאישור`, icon: UserCheck, color: 'bg-[#FF2D60]', count: joinRequests.length },
                    { id: 'ENGINE_ROOM', label: 'חדר מכונות', desc: 'ניטור תשתיות ומערכות', icon: Terminal, color: 'bg-[#8B5CF6]' },
                    { id: 'ASSETS', label: 'נכסים ועיצוב', desc: 'תמונות ופונטים', icon: ImageIcon, color: 'bg-[#FF9F1C]' },
                    { id: 'ARCHIVE', label: 'ארכיון משתמשים', desc: 'ניהול חברים שהושעו', icon: Archive, color: 'bg-[#FFD700]' }
                  ] : [])
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                    }}
                    className="group admin-info-card p-8 transition-all duration-500 text-right relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${item.color} opacity-10 group-hover:opacity-40 transition-opacity`} />
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        <item.icon size={28} />
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <div className="bg-[#00AFC2] text-white px-3 py-1 rounded-full text-[12px] font-black animate-pulse shadow-sm shadow-[#00AFC2]/30">
                          {item.count} חדש
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-[var(--surfer-electric-pink)] mb-2 group-hover:text-[var(--surfer-deep-magenta)] transition-colors">{item.label}</h3>
                    <p className="text-xs font-black text-[var(--deep-teal-sea)] uppercase tracking-widest">{item.desc}</p>
                    
                    <div className="mt-8 flex items-center gap-2 text-[var(--surfer-vibrant-cyan)] text-[12px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      כניסה לניהול <ArrowLeft size={12} />
                    </div>
                  </button>
                ))}
              </div>
            )}

        {activeTab === 'REQUESTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Join Requests Summary Card */}
            <div className="admin-info-card p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--surfer-vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--surfer-vibrant-cyan)]/10 transition-colors" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--surfer-vibrant-cyan)] to-[var(--surfer-sunshine-yellow)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--surfer-vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                  <UserCheck size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[var(--surfer-electric-pink)] tracking-tight">בקשות להצטרף</h3>
                  <p className="text-[12px] font-black text-[var(--deep-teal-sea)] uppercase tracking-widest mt-1">ניהול ואישור חברים חדשים בקהילה</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surfer-aqua-mist)]/10 text-[var(--deep-teal-sea)] rounded-xl border border-[var(--surfer-aqua-mist)]/20 text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  בקשות ממתינות {joinRequests.length}
                </div>
              </div>
            </div>

            <div className="relative">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--surfer-vibrant-cyan)]/40" />
               <input 
                 type="text" 
                 placeholder="חיפוש לפי שם או אימייל..." 
                 className="w-full pr-16 pl-6 py-6 admin-info-card font-black focus:ring-2 ring-[var(--surfer-vibrant-cyan)]/30 text-[#000000] placeholder:text-[#000000]/40"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>

            {filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map(req => (
                  <div key={req.id} className={`admin-info-card p-8 group flex flex-col h-full ${isProcessing === req.id ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-5 mb-8">
                       {req.avatar ? (
                         <img src={req.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md border border-white/30" alt="" />
                       ) : (
                         <div className="w-16 h-16 rounded-2xl bg-[var(--surfer-aqua-mist)]/20 flex items-center justify-center text-[var(--surfer-vibrant-cyan)] shadow-md border border-white/30">
                           <UserCircle size={32} />
                         </div>
                       )}
                       <div>
                          <h4 className="text-xl font-black text-[var(--surfer-electric-pink)] mb-1">{req.firstName} {req.lastName}</h4>
                          <div className="flex items-center gap-2 text-[#000000] font-bold text-[12px] uppercase tracking-widest">
                             <Calendar size={12} className="text-[var(--surfer-sunshine-yellow)]" />
                             {new Date(req.requestedAt).toLocaleDateString('he-IL')}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 flex-1">
                       <div className="flex items-center gap-3 p-3 bg-[var(--surfer-aqua-mist)]/10 rounded-xl border border-white/20">
                          <Mail size={14} className="text-[#000000]/60" />
                          <span className="text-xs font-black text-[#000000] truncate">{req.email}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-[var(--surfer-aqua-mist)]/10 rounded-xl border border-white/20">
                          <Phone size={14} className="text-[#000000]/60" />
                          <span className="text-xs font-black text-[#000000]">{req.mobile}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-[var(--surfer-vibrant-cyan)]/10 text-[#000000] rounded-xl border border-[var(--surfer-vibrant-cyan)]/20">
                          <MapPin size={14} className="text-[var(--surfer-vibrant-cyan)]" />
                          <span className="text-xs font-black">{(req as any).group || 'הרצליה'}</span>
                       </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                       <button 
                         onClick={() => {
                           handleApprove(req.id);
                         }}
                         disabled={isProcessing === req.id}
                         className="flex-1 py-4 hd-glass-button-gold text-white rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} className="text-white" />}
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
              <div className="py-32 text-center border-2 border-dashed border-[var(--vibrant-cyan)]/10 rounded-[4rem]">
                 <div className="w-20 h-20 bg-[var(--aqua-mist)]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#00FFFF]/20">
                    <UserCheck size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-[var(--turquoise-teal)]/40">אין בקשות הצטרפות ממתינות</h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Members Summary Card */}
            {(() => {
              const stats = {
                total: members.length,
                active: members.filter(m => m.isActive !== false).length,
                suspended: members.filter(m => m.isActive === false).length,
                instructors: members.filter(m => m.role === 'Instructor').length,
                coordinators: members.filter(m => m.role === 'Admin').length,
              };
              return (
                <div className="admin-info-card p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--surfer-vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--surfer-vibrant-cyan)]/10 transition-colors" />
                  
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--surfer-vibrant-cyan)] to-[var(--surfer-sunshine-yellow)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--surfer-vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                      <Users size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[var(--surfer-electric-pink)] tracking-tight">חברים</h3>
                      <p className="text-[12px] font-black text-[var(--deep-teal-sea)] uppercase tracking-widest mt-1">ניהול וסינון חברי הקהילה</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surfer-aqua-mist)]/10 text-[var(--deep-teal-sea)] rounded-xl border border-[var(--surfer-aqua-mist)]/20 text-xs font-bold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      רשומים {stats.total}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-xl border border-[#2D6A4F]/20 text-xs font-bold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                      פעילים {stats.active}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#BC4749]/10 text-[#BC4749] rounded-xl border border-[#BC4749]/20 text-xs font-bold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-[#BC4749]" />
                      מושעים {stats.suspended}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-xs font-bold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      מדריכים {stats.instructors}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 text-xs font-bold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      רכזים {stats.coordinators}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-center mt-6">
              <button 
                onClick={() => setIsAddMemberModalOpen(true)}
                className="flex items-center gap-2 px-8 py-4 bg-[#FF9F1C] text-white rounded-2xl font-black text-sm hover:bg-[#FF9F1C]/90 transition-all shadow-lg shadow-[#FF9F1C]/20"
              >
                <Plus size={18} /> הוספת חבר
              </button>
            </div>

            {editingMember ? (
              <EditMemberForm
                member={editingMember}
                gritScore={calculateUserStats(editingMember.id, members, weeklyHistory, yearConfig, events)?.gritScore || 0}
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
            <div className="admin-info-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-[var(--surfer-aqua-mist)]/10 border-b border-[var(--surfer-vibrant-cyan)]/10">
                      <tr>
                        <th className="px-8 py-6 text-[12px] font-black text-[#000000]/60 uppercase tracking-widest">משתמש</th>
                        <th className="px-8 py-6 text-[12px] font-black text-[#000000]/60 uppercase tracking-widest">זהות</th>
                        <th className="px-8 py-6 text-[12px] font-black text-[#000000]/60 uppercase tracking-widest">סטטוס</th>
                        <th className="px-8 py-6 text-[12px] font-black text-[#000000]/60 uppercase tracking-widest text-center">עריכה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surfer-aqua-mist)]/10">
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
                        <tr key={member.id} className="hover:bg-[var(--surfer-aqua-mist)]/10 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              {member.avatar ? (
                                <img src={member.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-white/30" alt="" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-[var(--surfer-aqua-mist)]/20 flex items-center justify-center text-[var(--surfer-vibrant-cyan)]/40 border border-white/30">
                                  <UserCircle size={24} />
                                </div>
                              )}
                              <div>
                                <h4 className="font-black text-[var(--surfer-electric-pink)]">{member.firstName} {member.lastName}</h4>
                                <p className="text-[12px] text-[#000000]/70 font-black truncate max-w-[150px]">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest ${
                              member.role === 'Admin' 
                                ? 'bg-[var(--surfer-vibrant-cyan)]/10 text-[var(--surfer-vibrant-cyan)]' 
                                : member.role === 'Instructor'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-[var(--surfer-aqua-mist)]/10 text-[#000000]'
                            }`}>
                              {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest ${
                              (member as any).status === 'suspended'
                                ? 'bg-[#BC4749]/10 text-[#BC4749]'
                                : 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                            }`}>
                              {(member as any).status === 'suspended' ? 'מושעה' : 'פעיל'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={() => setEditingMember(member)}
                                className="w-10 h-10 bg-white/40 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-[#000000]/40 hover:text-[var(--surfer-electric-pink)] hover:border-[var(--surfer-electric-pink)]/30 hover:shadow-lg transition-all"
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
            <AddMemberModal 
              isOpen={isAddMemberModalOpen}
              onClose={() => setIsAddMemberModalOpen(false)}
              newMemberData={newMemberData}
              setNewMemberData={setNewMemberData}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              addMember={addMember}
            />
          </div>
        )}

        {activeTab === 'GRADES' && (
          <MemberGradingPage />
        )}

        {activeTab === 'ARCHIVE' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Suspended Members Summary Card */}
            {(() => {
              const suspendedCount = members.filter(m => m.isActive === false).length;
              return (
                <div className="admin-info-card p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--surfer-vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--surfer-vibrant-cyan)]/10 transition-colors" />
                  
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--surfer-vibrant-cyan)] to-[var(--surfer-sunshine-yellow)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--surfer-vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                      <UserX size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[var(--surfer-electric-pink)] tracking-tight">חברים מושעים</h3>
                      <p className="text-[12px] font-black text-[var(--deep-teal-sea)] uppercase tracking-widest mt-1">ניהול משתמשים שהוצאו מהמערכת</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-bold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      מושעים {suspendedCount}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="admin-info-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-[var(--surfer-aqua-mist)]/10 border-b border-[var(--surfer-vibrant-cyan)]/10">
                    <tr>
                      <th className="px-8 py-6 text-[12px] font-black text-[#000000]/60 uppercase tracking-widest">משתמש מושעה</th>
                      <th className="px-8 py-6 text-[12px] font-black text-[#000000]/60 uppercase tracking-widest">זהות</th>
                      <th className="px-8 py-6 text-[12px] font-black text-[#000000]/60 uppercase tracking-widest text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--surfer-aqua-mist)]/10">
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
                      <tr key={member.id} className="hover:bg-[var(--surfer-aqua-mist)]/10 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {member.avatar ? (
                              <img 
                                src={member.avatar} 
                                className="w-12 h-12 rounded-xl object-cover shadow-sm opacity-50 cursor-pointer hover:opacity-100 transition-opacity border border-white/30" 
                                alt="" 
                                onClick={() => setEditingMember(member)}
                              />
                            ) : (
                              <div 
                                className="w-12 h-12 rounded-xl bg-[var(--surfer-aqua-mist)]/20 flex items-center justify-center text-[var(--surfer-vibrant-cyan)]/20 cursor-pointer hover:bg-[var(--surfer-aqua-mist)]/30 transition-colors border border-white/30"
                                onClick={() => setEditingMember(member)}
                              >
                                <UserCircle size={24} />
                              </div>
                            )}
                            <div>
                              <h4 className="font-black text-[#000000]/60">{member.firstName} {member.lastName}</h4>
                              <p className="text-[12px] text-[#000000]/40 font-black truncate max-w-[150px]">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest bg-[var(--surfer-aqua-mist)]/10 text-[#000000]/60">
                            {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setEditingMember(member)}
                              className="w-10 h-10 bg-white/40 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-[#000000]/60 hover:text-[var(--surfer-electric-pink)] hover:border-[var(--surfer-electric-pink)]/30 hover:shadow-lg transition-all"
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
                              className="w-10 h-10 bg-white/40 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-[#000000]/60 hover:text-[var(--surfer-vibrant-cyan)] hover:border-[var(--surfer-vibrant-cyan)]/30 hover:shadow-lg transition-all"
                              title="החזר לפעילות"
                            >
                              <RefreshCw size={18} className="text-[var(--surfer-vibrant-cyan)]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {members.filter(m => m.isActive === false).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-8 py-12 text-center text-[#000000]/40 font-black">אין משתמשים בארכיון</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ENGINE_ROOM' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800">חדר מכונות</h2>
            </div>

            <SystemMonitor />

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button 
                onClick={() => setMarkdownConfig({ isOpen: true, path: '/README.md', title: 'מדריך למשתמש (User Guide)' })}
                className="w-full luxury-card p-8 group hover:scale-[1.01] transition-all text-right flex items-center gap-6 relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <FileText size={160} className="text-slate-900" />
                </div>
                <div className="p-5 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm relative z-10 shrink-0 border border-slate-100">
                  <FileText size={32} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-slate-800 mb-1">מדריך למשתמש</h4>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed opacity-80">צפייה בקובץ README.md לקבלת מידע טכני ותפעולי על הפרויקט</p>
                </div>
              </button>

              <button 
                onClick={() => setMarkdownConfig({ isOpen: true, path: '/PROJECT_MAP.md', title: 'מפת הפרויקט (Project Map)' })}
                className="w-full luxury-card p-8 group hover:scale-[1.01] transition-all text-right flex items-center gap-6 relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <MapIcon size={160} className="text-slate-900" />
                </div>
                <div className="p-5 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm relative z-10 shrink-0 border border-slate-100">
                  <MapIcon size={32} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-slate-800 mb-1">מפת הפרויקט</h4>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed opacity-80">צפייה בקובץ PROJECT_MAP.md להבנת מבנה הרכיבים והקשרים ביניהם</p>
                </div>
              </button>
            </section>

            {conflictingAdmins.length > 1 && (
              <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm">
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-8">
                    <div className="p-5 bg-rose-100 text-rose-600 rounded-2xl shadow-sm border border-rose-200">
                      <ShieldAlert size={40} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-rose-200 text-rose-700 text-[10px] font-black rounded uppercase tracking-tighter">Critical</span>
                        <h4 className="text-2xl font-black text-rose-800">התנגשויות אימייל (Super Admin)</h4>
                      </div>
                      <p className="text-base text-rose-700 font-bold opacity-80">נמצאו כפילויות של אימייל מנהל המערכת. יש להשאיר רק חשבון אחד עם האימייל הראשי.</p>
                    </div>
                  </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {conflictingAdmins.map(admin => (
                          <div key={admin.id} className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 shadow-sm group hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img src={admin.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" alt="" />
                                {admin.email === SUPER_ADMIN_EMAIL && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <Check size={8} className="text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-black text-[var(--deep-teal-sea)] text-lg leading-none mb-1">{admin.firstName} {admin.lastName}</p>
                                <p className="text-xs text-[var(--surfer-turquoise-teal)] font-bold tracking-tight">{admin.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {editingConflictId === admin.id ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                                  <input 
                                    type="email"
                                    value={conflictNewEmail}
                                    onChange={(e) => setConflictNewEmail(e.target.value)}
                                    placeholder="אימייל חדש..."
                                    className="px-4 py-2.5 bg-white/80 border-2 border-[var(--surfer-vibrant-cyan)]/30 rounded-xl text-sm font-bold outline-none focus:border-[var(--surfer-vibrant-cyan)] transition-all w-56 text-[var(--deep-teal-sea)]"
                                    autoFocus
                                  />
                                  <button 
                                    onClick={async () => {
                                      if (conflictNewEmail && conflictNewEmail.includes('@')) {
                                        await updateMember({ ...admin, email: conflictNewEmail.trim().toLowerCase() });
                                        setEditingConflictId(null);
                                        setConflictNewEmail('');
                                        showSuccess('האימייל עודכן בהצלחה');
                                      } else {
                                        showError('נא להזין אימייל תקין');
                                      }
                                    }}
                                    className="p-2.5 bg-[var(--surfer-vibrant-cyan)] text-white rounded-xl hover:shadow-lg transition-all"
                                    title="שמור"
                                  >
                                    <Check size={20} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingConflictId(null)}
                                    className="p-2.5 bg-rose-100 text-rose-500 rounded-xl hover:bg-rose-200 transition-all"
                                    title="ביטול"
                                  >
                                    <X size={20} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setEditingConflictId(admin.id);
                                    setConflictNewEmail(admin.email === SUPER_ADMIN_EMAIL ? 'gal@gmail.com' : admin.email);
                                  }}
                                  className="px-5 py-2.5 bg-[var(--surfer-vibrant-cyan)]/10 text-[var(--surfer-vibrant-cyan)] border border-[var(--surfer-vibrant-cyan)]/20 rounded-xl text-sm font-black hover:bg-[var(--surfer-vibrant-cyan)] hover:text-white transition-all shadow-sm"
                                >
                                  תיקון
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </div>
        )}

        {activeTab === 'POSTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Posts Summary Card */}
            <div className="admin-info-card p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--surfer-vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--surfer-vibrant-cyan)]/10 transition-colors" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--surfer-vibrant-cyan)] to-[var(--surfer-turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--surfer-vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                  <Newspaper size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[var(--surfer-electric-pink)] tracking-tight">פוסטים</h3>
                  <p className="text-[12px] font-black text-[var(--deep-teal-sea)] uppercase tracking-widest mt-1">ניהול ומחיקה של פוסטים בקהילה</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surfer-aqua-mist)]/10 text-[var(--deep-teal-sea)] rounded-xl border border-[var(--surfer-aqua-mist)]/20 text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  פוסטים פעילים {news.length}
                </div>
                
                <button 
                  onClick={() => setEditingPost({})}
                  className="bg-[var(--surfer-vibrant-cyan)] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-[var(--deep-teal-sea)] transition-all shadow-lg shadow-[var(--surfer-vibrant-cyan)]/20 flex items-center gap-2 active:scale-95"
                >
                  <Plus size={18} />
                  פוסט חדש
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map(item => (
                <div key={item.id} className="admin-info-card p-6 flex flex-col relative group">
                  {item.imageUrl && (
                    <img src={item.imageUrl} className="w-full h-40 object-cover rounded-xl mb-4 border border-white/30" alt="" />
                  )}
                  <h3 className="font-black text-lg text-[var(--surfer-electric-pink)] mb-2">{item.title}</h3>
                  <p className="text-[var(--deep-teal-sea)] text-sm line-clamp-3 mb-4 flex-1 font-bold">{item.content}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--surfer-aqua-mist)]/20">
                    <div className="flex items-center gap-3">
                      {item.authorAvatar ? (
                        <img src={item.authorAvatar} className="w-8 h-8 rounded-full object-cover border border-white/30" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--surfer-aqua-mist)]/20 flex items-center justify-center text-[var(--surfer-sunshine-yellow)] border border-white/30">
                          <User size={14} />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-black text-[var(--deep-teal-sea)]">{item.authorName}</p>
                        <p className="text-[12px] text-[var(--surfer-turquoise-teal)] font-black">{new Date(item.date).toLocaleDateString('he-IL')}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingPost(item)}
                        className="p-2 bg-[var(--surfer-aqua-mist)]/10 text-[var(--surfer-vibrant-cyan)] rounded-xl hover:bg-[var(--surfer-vibrant-cyan)] hover:text-white transition-colors border border-white/20"
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
                        className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {news.length === 0 && (
                <div className="col-span-full py-20 text-center admin-info-card border-dashed border-2">
                  <Newspaper className="mx-auto text-[var(--surfer-vibrant-cyan)] mb-4" size={48} />
                  <h3 className="text-xl font-black text-[var(--deep-teal-sea)]/40">אין פוסטים במערכת</h3>
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
            {/* Gallery Summary Card */}
            <div className="luxury-slab p-[2px] group">
              <div className="luxury-card p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                    <ImageIcon size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">גלריה</h3>
                    <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">ניהול ומחיקה של תמונות מהגלריה</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                  <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    תמונות בגלריה {galleryItems.length}
                  </div>

                  <button 
                    onClick={() => galleryFileInputRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="bg-[var(--vibrant-cyan)] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-[var(--deep-teal-sea)] transition-all shadow-lg shadow-[var(--vibrant-cyan)]/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isUploadingGallery ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    הוספה
                  </button>
                  <input 
                    type="file" 
                    ref={galleryFileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleGalleryUpload} 
                  />

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
                      className="bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 active:scale-95"
                    >
                      <Trash2 size={18} />
                      מחק {selectedGalleryItems.length} תמונות
                    </button>
                  )}
                </div>
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
            {/* Events Summary Card */}
            <div className="admin-info-card p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--surfer-vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--surfer-vibrant-cyan)]/10 transition-colors" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--surfer-vibrant-cyan)] to-[var(--surfer-turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--surfer-vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                  <Calendar size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[var(--surfer-electric-pink)] tracking-tight">לוח אירועים</h3>
                  <p className="text-[12px] font-black text-[var(--deep-teal-sea)] uppercase tracking-widest mt-1">ניהול לוח הזמנים הקהילתי</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surfer-aqua-mist)]/10 text-[var(--deep-teal-sea)] rounded-xl border border-[var(--surfer-aqua-mist)]/20 text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  אירועים מתוכננים {events.length}
                </div>
                
                <button 
                  onClick={() => setEditingEvent({})}
                  className="bg-[var(--surfer-vibrant-cyan)] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-[var(--deep-teal-sea)] transition-all shadow-lg shadow-[var(--surfer-vibrant-cyan)]/20 flex items-center gap-2 active:scale-95"
                >
                  <Plus size={18} />
                  אירוע חדש
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(event => {
                const eventDate = new Date(`${event.date}T${event.time || '00:00'}`);
                const isPastEvent = eventDate < new Date();

                return (
                  <div key={event.id} className={`admin-info-card p-6 flex flex-col sm:flex-row sm:items-center justify-between group relative overflow-hidden ${isPastEvent ? 'opacity-75' : ''}`}>
                    
                    {isPastEvent && (
                      <div className="absolute -right-12 top-6 transform rotate-45 bg-[var(--surfer-aqua-mist)]/20 text-[var(--deep-teal-sea)]/40 text-[12px] font-black uppercase tracking-widest px-12 py-1 shadow-sm z-10">
                        הסתיים
                      </div>
                    )}

                    <div className="flex items-center gap-6 flex-1">
                      {/* Event Image - Smart Display */}
                      {event.imageUrl ? (
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-md border border-white/20">
                          <img 
                            src={event.imageUrl} 
                            alt={event.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ) : (
                        <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center font-black flex-shrink-0 border border-white/30 ${isPastEvent ? 'bg-[var(--surfer-aqua-mist)]/10 text-[var(--deep-teal-sea)]/40' : 'bg-[var(--surfer-vibrant-cyan)]/10 text-[var(--surfer-vibrant-cyan)]'}`}>
                          <span className="text-sm whitespace-nowrap tabular-nums">{formatDate(event.date)}</span>
                        </div>
                      )}

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {event.imageUrl && (
                             <span className={`px-2 py-0.5 rounded-md text-[10px] font-black whitespace-nowrap ${isPastEvent ? 'bg-[var(--surfer-aqua-mist)]/10 text-[var(--deep-teal-sea)]/40' : 'bg-[var(--surfer-vibrant-cyan)]/10 text-[var(--surfer-vibrant-cyan)]'}`}>
                              {formatDate(event.date)}
                            </span>
                          )}
                          <h4 className={`text-xl font-black truncate ${isPastEvent ? 'text-[var(--deep-teal-sea)]/40 line-through decoration-[var(--deep-teal-sea)]/20' : 'text-[var(--surfer-electric-pink)]'}`}>{event.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[var(--deep-teal-sea)]/60 truncate">{event.location}</p>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider whitespace-nowrap ${
                            event.type === 'COMMUNITY' ? 'bg-[var(--surfer-vibrant-cyan)] text-white' : 
                            event.type === 'INSTRUCTOR' ? 'bg-[var(--surfer-sunshine-yellow)] text-white' : 
                            'bg-[var(--surfer-aqua-mist)]/10 text-[var(--deep-teal-sea)]/60'
                          }`}>
                            {event.type === 'COMMUNITY' ? 'קהילה' : event.type === 'INSTRUCTOR' ? 'מדריך' : 'חבר'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      {!isPastEvent && (
                        <button 
                          onClick={() => handleEditEvent(event)}
                          className="p-4 bg-[var(--surfer-aqua-mist)]/10 text-[var(--surfer-vibrant-cyan)] rounded-2xl hover:bg-[var(--surfer-vibrant-cyan)] hover:text-white transition-all border border-white/20"
                          title="עריכת אירוע"
                        >
                          <Pencil size={20} />
                        </button>
                      )}
                      {!isPastEvent && (
                        <button 
                          onClick={() => {
                            showConfirm({
                              message: 'האם למחוק אירוע זה?',
                              onConfirm: () => deleteEvent(event.id)
                            });
                          }}
                          className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                          title="מחיקת אירוע"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                      {isPastEvent && (
                         <button 
                          className="p-4 bg-[var(--surfer-aqua-mist)]/10 text-[var(--deep-teal-sea)]/20 rounded-2xl cursor-not-allowed border border-white/10"
                          title="לא ניתן לערוך אירוע שהסתיים"
                        >
                          <Archive size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'ROLLOVER' && (
          <AdminRolloverReport />
        )}

        {activeTab === 'ASSETS' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">הגדרות מערכת</h2>
              <p className="text-slate-500 font-medium">ניהול פרמטרים טכניים וקונפיגורציית ליבה של האתר</p>
            </div>

            {/* Warning Banner - Redesigned for Elegance & Impact */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-rose-50/50 to-rose-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative p-6 bg-white/40 backdrop-blur-2xl border border-rose-200/50 rounded-[2rem] flex items-center gap-6 shadow-xl shadow-rose-500/5 group-hover:shadow-rose-500/10 transition-all duration-500">
                <div className="relative shrink-0">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{ 
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-rose-500 blur-xl rounded-full"
                  />
                  <motion.div 
                    animate={{ 
                      backgroundColor: ["#f43f5e", "#3b82f6", "#f43f5e"],
                      boxShadow: [
                        "0 0 20px rgba(244, 63, 94, 0.4)",
                        "0 0 50px rgba(59, 130, 246, 0.9)",
                        "0 0 20px rgba(244, 63, 94, 0.4)"
                      ]
                    }}
                    transition={{ 
                      duration: 0.3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="w-14 h-14 text-white rounded-2xl flex items-center justify-center relative z-10"
                  >
                    <AlertTriangle size={28} strokeWidth={3} className="animate-pulse" />
                  </motion.div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                      אזהרת מערכת
                    </span>
                    <div className="h-px flex-1 bg-rose-100 min-w-[20px]" />
                  </div>
                  <p className="text-slate-700 font-bold text-lg leading-tight tracking-tight">
                    שינוי פרמטרים אלו עלול להשפיע על <span className="text-rose-600 underline decoration-rose-200 underline-offset-4">יציבות האתר</span>. מומלץ לבצע שינויים בזהירות רבה.
                  </p>
                </div>

                <div className="hidden md:flex ml-auto items-center gap-2 text-rose-300">
                  <div className="w-1 h-1 rounded-full bg-current" />
                  <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                  <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Year Config Widget */}
              <div className="luxury-card p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center shadow-sm border border-sky-100">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">הגדרת שנת פעילות</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">YEAR CYCLE CONFIG</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">תחילת שנה</p>
                      <p className="text-xl font-black text-slate-700 tabular-nums">{formatDate(yearConfig?.startDate || '---')}</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">סיום שנה</p>
                      <p className="text-xl font-black text-slate-700 tabular-nums">{formatDate(yearConfig?.endDate || '---')}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">שבוע נוכחי</span>
                      </div>
                      <span className="text-3xl font-black text-slate-800 tabular-nums">{calculateWeeks(yearConfig?.startDate || '')}</span>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">התקדמות שנתית</span>
                        <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                          {Math.round((calculateWeeks(yearConfig?.startDate || '') / 52) * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (calculateWeeks(yearConfig?.startDate || '') / 52) * 100)}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-sky-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsEditingYear(true)}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm active:scale-95"
                  >
                    <Edit2 size={18} />
                    ערוך הגדרות שנה
                  </button>
                </div>
              </div>

              {/* Home Break Config Widget */}
              <div className="luxury-card p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">חוף הבית</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">HOME BREAK LOCATION</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    נקודת העוגן של המערכת המשמשת לחישובי מרחקים, זמני הגעה ותצוגת מפות עבור המשתמשים.
                  </p>

                  <div className="relative">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Globe size={20} />
                    </div>
                    <input 
                      type="text" 
                      ref={addressInputRef}
                      defaultValue={siteConfig.home_break?.formatted || ''} 
                      readOnly={!hasConfirmedHomeBreakEdit}
                      onClick={() => {
                        if (!hasConfirmedHomeBreakEdit) {
                          showConfirm({
                            title: 'שינוי חוף הבית',
                            message: 'האם אתה בטוח שברצונך לשנות את נקודת העוגן של המערכת?',
                            confirmText: 'כן, שנה מיקום',
                            cancelText: 'ביטול',
                            onConfirm: () => {
                              setHasConfirmedHomeBreakEdit(true);
                              setTimeout(() => addressInputRef.current?.focus(), 100);
                            }
                          });
                        }
                      }}
                      placeholder="הזן כתובת מדויקת..."
                      className={`w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-bold ${
                        !hasConfirmedHomeBreakEdit ? 'cursor-pointer' : ''
                      }`}
                      autoComplete="off"
                    />
                  </div>

                  {hasConfirmedHomeBreakEdit ? (
                    <div className="flex gap-3 animate-in slide-in-from-top-2">
                      <button 
                        onClick={() => setHasConfirmedHomeBreakEdit(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all"
                      >
                        ביטול
                      </button>
                      <button 
                        onClick={async () => {
                          const currentValue = addressInputRef.current?.value || '';
                          if (currentValue.trim() === '') {
                            try {
                              await updateSiteConfig({ home_break: null });
                              showSuccess('כתובת חוף הבית נמחקה');
                              setHasConfirmedHomeBreakEdit(false);
                            } catch (err) {
                              showError('שגיאה בעדכון הכתובת');
                            }
                          } else if (isPlaceSelected && selectedPlaceRef.current) {
                            try {
                              const addressData = extractAddressData(selectedPlaceRef.current);
                              await updateSiteConfig({ home_break: addressData });
                              showSuccess('חוף הבית עודכן בהצלחה');
                              setHasConfirmedHomeBreakEdit(false);
                            } catch (err) {
                              showError('שגיאה בעדכון הכתובת');
                            }
                          } else {
                            if (window.google?.maps?.Geocoder) {
                              const geocoder = new window.google.maps.Geocoder();
                              geocoder.geocode({ address: currentValue + ', Israel' }, async (results: any, status: any) => {
                                if (status === 'OK' && results && results[0]) {
                                  try {
                                    const addressData = extractAddressData(results[0]);
                                    await updateSiteConfig({ home_break: addressData });
                                    showSuccess('חוף הבית עודכן בהצלחה');
                                    setHasConfirmedHomeBreakEdit(false);
                                    if (addressInputRef.current) addressInputRef.current.value = results[0].formatted_address;
                                  } catch (err) {
                                    showError('שגיאה בעדכון הכתובת');
                                  }
                                } else {
                                  showError('כתובת לא נמצאה, אנא בחר מהרשימה');
                                }
                              });
                            }
                          }
                        }}
                        className="flex-[2] py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs shadow-sm hover:bg-indigo-600 transition-all"
                      >
                        שמור מיקום חדש
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-100 shrink-0">
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-bold text-emerald-700">המיקום מוגדר ומסונכרן עם שירותי המפות</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Sessions Config Widget */}
            <div className="luxury-card p-8 space-y-10">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center shadow-sm border border-sky-100">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">ניהול מועדי סשנים</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">WEEKLY SCHEDULE MANAGEMENT</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12" dir="rtl">
                {/* Left Column: Sessions List */}
                <div className="xl:col-span-7 space-y-6">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h4 className="text-lg font-black text-slate-700 tracking-tight">רשימת מועדים פעילים</h4>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{weeklySessions.length} סשנים מוגדרים</span>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {weeklySessions.map((session, index) => (
                        <motion.div 
                          key={`${session.dayOfWeek}-${session.time}`} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all duration-300 group/item flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 font-black text-xl group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-500 transition-all duration-500 shadow-inner">
                              {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'][session.dayOfWeek]}
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-800 tracking-tight">
                                יום {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][session.dayOfWeek]}
                              </h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm font-black text-sky-600 flex items-center gap-2 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100/50">
                                  <Clock size={14} strokeWidth={3} />
                                  {session.time}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${session.isRecurring !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                  {session.isRecurring !== false ? 'סדרתי' : 'חד-פעמי'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">סטטוס</span>
                              <div 
                                onClick={() => {
                                  const newSessions = [...weeklySessions];
                                  newSessions[index] = { ...newSessions[index], isActive: !session.isActive };
                                  setWeeklySessions(newSessions);
                                }}
                                className={`w-12 h-6 p-1 rounded-full cursor-pointer transition-all duration-500 relative ${session.isActive !== false ? 'bg-sky-500' : 'bg-slate-200'}`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-500 ${session.isActive !== false ? '-translate-x-6' : 'translate-x-0'}`} />
                              </div>
                            </div>

                            <button
                              onClick={() => setSessionToDelete(index)}
                              className="w-11 h-11 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-rose-100 group-hover/item:scale-105"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right Column: Add Form */}
                <div className="xl:col-span-5">
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner sticky top-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-white text-sky-500 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <Plus size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tight">הוספת סשן חדש</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ADD NEW TIME SLOT</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6 mb-10">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">יום בשבוע</label>
                        <DayPicker 
                          value={newSessionDay} 
                          onChange={setNewSessionDay} 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-700 outline-none focus:ring-4 ring-sky-500/10 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">שעת התחלה</label>
                        <div className="relative">
                          <TimePicker 
                            value={newSessionTime} 
                            onChangeValue={setNewSessionTime} 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-700 outline-none focus:ring-4 ring-sky-500/10 text-center tracking-widest transition-all font-black text-lg"
                          />
                          <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const newSession = {
                          dayOfWeek: newSessionDay,
                          time: newSessionTime,
                          isActive: true,
                          isRecurring: true
                        };
                        if (!weeklySessions.some(s => s.dayOfWeek === newSession.dayOfWeek && s.time === newSession.time)) {
                          setWeeklySessions([...weeklySessions, newSession]);
                          showSuccess('הסשן נוסף לרשימה');
                        } else {
                          showError('סשן זה כבר קיים ברשימה');
                        }
                      }}
                      className="w-full py-5 bg-sky-500 text-white rounded-2xl font-black text-base shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all duration-300 active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Plus size={20} strokeWidth={3} />
                      הוסף לרשימה
                    </button>
                  </div>
                </div>
              </div>

              {/* Global Save Action */}
              <div className="pt-10 flex flex-col items-center gap-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">יש לשמור את השינויים כדי לעדכן את המערכת</p>
                <button
                  onClick={async () => {
                    setIsSavingSessions(true);
                    try {
                      await updateSiteConfig({ weeklySessions });
                      showSuccess('מועדי הסשנים נשמרו בהצלחה');
                    } catch (err) {
                      console.error(err);
                      showError('שגיאה בשמירת מועדי הסשנים');
                    } finally {
                      setIsSavingSessions(false);
                    }
                  }}
                  disabled={isSavingSessions}
                  className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all duration-300 disabled:opacity-50 flex items-center gap-4 active:scale-95"
                >
                  {isSavingSessions ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  שמור את כל השינויים
                </button>
              </div>
            </div>

            <AdminAssets />
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-rose-500 p-8 text-white text-center relative">
              <ShieldAlert size={48} className="mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-1">אזהרת מערכת קריטית</h3>
              <p className="text-rose-100 font-medium">שינוי הגדרות זמן ליבה</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-rose-700 text-center font-bold leading-relaxed text-sm">
                ⚠️ שים לב: שינוי התאריכים ישבש את תפקוד האתר ואת הדוחות. נגיעה מותרת רק בחירום.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pr-1">תאריך התחלה חדש</label>
                  <input 
                    type="date" 
                    value={yearForm.startDate}
                    onChange={e => setYearForm(prev => ({ ...prev, startDate: e.target.value }))}
                    onClick={(e) => (e.currentTarget as any).showPicker?.()}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-sky-500/20 focus:bg-white transition-all cursor-pointer text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pr-1">תאריך סיום חדש</label>
                  <input 
                    type="date" 
                    value={yearForm.endDate}
                    onChange={e => setYearForm(prev => ({ ...prev, endDate: e.target.value }))}
                    onClick={(e) => (e.currentTarget as any).showPicker?.()}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-sky-500/20 focus:bg-white transition-all cursor-pointer text-slate-700"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
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
                  className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-base shadow-sm hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingYear ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  אני מבין את ההשלכות - שמור שינויים
                </button>
                <button 
                  onClick={() => setIsEditingYear(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-base hover:bg-slate-200 transition-all"
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 border border-slate-200 text-center animate-in zoom-in-95 relative overflow-hidden">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 size={32} />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-2">חבר/ה חדש/ה בנבחרת!</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                הבקשה של <span className="text-sky-600 font-bold">{approvedUser.firstName} {approvedUser.lastName}</span> אושרה.
                נא לשלוח לו/ה את פרטי הגישה:
              </p>
              
              <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100 relative group">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-right">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">שם משתמש</span>
                       <span className="font-bold text-slate-700">{approvedUser.email}</span>
                    </div>
                    <div className="h-px bg-slate-200"></div>
                    <div className="flex justify-between items-center text-right">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">סיסמה זמנית</span>
                       <span className="font-bold text-sky-600 text-xl tracking-wider select-all">{approvedUser.tempPassword}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-8">
                 <button 
                   onClick={() => openWhatsApp(approvedUser.mobile, `${approvedUser.firstName} ${approvedUser.lastName}`, approvedUser.email, approvedUser.tempPassword)}
                   className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                 >
                   <MessageCircle size={18} />
                   שלח בוואטסאפ
                 </button>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(formatWhatsAppMessage(`${approvedUser.firstName} ${approvedUser.lastName}`, approvedUser.email, approvedUser.tempPassword));
                     showSuccess('הודעת ההצטרפות הועתקה ללוח');
                   }}
                   className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                 >
                   <Copy size={18} />
                   העתק הודעה ללוח
                 </button>
              </div>
              
              <button 
                onClick={() => setApprovedUser(null)} 
                className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-base shadow-sm hover:bg-slate-900 transition-all"
              >
                סגור פאנל
              </button>
           </div>
        </div>
      )}

      <MarkdownViewer 
        isOpen={markdownConfig.isOpen}
        onClose={() => setMarkdownConfig(prev => ({ ...prev, isOpen: false }))}
        filePath={markdownConfig.path}
        title={markdownConfig.title}
      />
    </div>
    </div>
    </div>
  );
};

export default AdminPage;
