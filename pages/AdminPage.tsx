
import React, { useState, useRef, useEffect } from 'react';
import GlassNavigationBar from '../components/GlassNavigationBar';
import { 
  Users, Archive, Mic, Image as ImageIcon, Calendar, Settings, UserCheck, ShieldAlert, Search, 
  Trash2, UserPlus, Mail, Phone, MapPin, ExternalLink, Edit2, CheckCircle2, XCircle, 
  Camera, UserCircle, ChevronLeft, ArrowLeft, LayoutDashboard, Copy, Check, Share2,
  Loader2, X, UserX, RotateCcw, MessageCircle, Plus, RefreshCw, Pencil, Save, Newspaper, ChevronDown, Cake,
  PanelTop, ArrowUpCircle, ArrowDownCircle, User, Sparkles, Globe, Activity, AlertTriangle
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
import { ColorPickerIcon } from '../components/icons/ColorPickerIcon';
import { extractAddressData } from '../utils/googlePlaces';
import StorageDisplay from '../components/StorageDisplay';
import TimePicker from '../components/TimePicker';
import { DayPicker } from '../components/DayPicker';
import EventEditor from '../components/admin/EventEditor';
import EditMemberForm from '../components/admin/EditMemberForm';
import PostEditor from '../components/admin/PostEditor';
import AdminRolloverReport from './AdminRolloverReport';

const ASSET_LABELS: Record<string, string> = {
  habalZugLogo: 'לוגו חבל זוג',
  atalefLogo: 'לוגו עמותת העטלף',
  reefLogo: 'לוגו מועדון ריף',
  heroBg: 'תמונת רקע ראשית',
  loginBg: 'תמונת רקע כניסה',
  favicon: 'אייקון אתר (Favicon)'
};

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showAlert, showConfirm, showSuccess, showError } = useModal();
  const { 
    joinRequests, siteAssets, siteConfig, updateSiteConfig, approveRequest, rejectRequest, members, galleryItems, events, deleteEvent, updateEvent, addEvent, toggleRole, toggleStatus, resetPassword, updateSiteAssets, updateMember, deleteMember, archiveMember,
    yearConfig, updateYearConfig, news, deleteNews, addNews, updateNews, deleteGalleryItems, addGalleryItem
  } = useData();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REQUESTS' | 'SITE' | 'USERS' | 'POSTS' | 'GALLERY' | 'EVENTS' | 'ARCHIVE' | 'ROLLOVER'>('USERS');
  const [newSessionDay, setNewSessionDay] = useState(0);
  const [newSessionTime, setNewSessionTime] = useState('07:00');
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

  const adminTabs = [
    { id: 'USERS', label: 'משתמשים', icon: <Users size={20} /> },
    { id: 'ARCHIVE', label: 'ארכיון', icon: <Archive size={20} /> },
    { id: 'POSTS', label: 'פוסטים', icon: <Newspaper size={20} /> },
    { id: 'GALLERY', label: 'גלריה', icon: <ImageIcon size={20} /> },
    { id: 'EVENTS', label: 'אירועים', icon: <Calendar size={20} /> },
    { id: 'REQUESTS', label: 'בקשות', icon: <UserCheck size={20} />, count: joinRequests.length },
    { id: 'ROLLOVER', label: 'דו"ח יום חמישי', icon: <Activity size={20} /> },
    { id: 'SITE', label: 'הגדרות', icon: <Settings size={20} /> }
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id as any);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [approvedUser, setApprovedUser] = useState<{ firstName: string; lastName: string; email: string; mobile: string; tempPassword: string } | null>(null);
  const [editingAsset, setEditingAsset] = useState<{ key: string, value: string } | null>(null);
  const [isUploadingAsset, setIsUploadingAsset] = useState<string | null>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingAssetKey, setReplacingAssetKey] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Home Break State
  const [isPlaceSelected, setIsPlaceSelected] = useState(!!siteConfig.home_break?.formatted);
  const [hasConfirmedHomeBreakEdit, setHasConfirmedHomeBreakEdit] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const selectedPlaceRef = useRef<any>(null);

  useEffect(() => {
    if (activeTab !== 'SITE') return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_MAPS_API_KEY is missing. Google Maps autocomplete will not work.");
      return;
    }

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

    // בדיקה אם גוגל כבר נטען, אם לא - נטען את הסקריפט
    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=he&region=IL`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setTimeout(initAutocomplete, 100);
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => {
          setTimeout(initAutocomplete, 100);
        });
        
        // במקרה שהסקריפט כבר נטען אבל האובייקטים עדיין לא זמינים
        const checkGoogleInterval = setInterval(() => {
          if (window.google?.maps?.places) {
            initAutocomplete();
            clearInterval(checkGoogleInterval);
          }
        }, 500);
        
        return () => clearInterval(checkGoogleInterval);
      }
    }
  }, [activeTab]);

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

    // 4. תפעול ה-Color Picker הגלובלי
    const colorPicker = document.getElementById('global-theme-color-picker') as HTMLInputElement;
    const hexDisplay = document.getElementById('hex-display');
    
    if (colorPicker && hexDisplay) {
        const handleInput = (e: any) => {
            const newColor = e.target.value;
            document.documentElement.style.setProperty('--gt-accent', newColor);
            hexDisplay.textContent = newColor.toUpperCase();
            (hexDisplay as HTMLElement).style.background = newColor;
        };

        colorPicker.addEventListener('input', handleInput);
        cleanupFns.push(() => colorPicker.removeEventListener('input', handleInput));
    }

    return () => cleanupFns.forEach(fn => fn());
  }, [activeTab]);

  // Year Config State
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [yearForm, setYearForm] = useState({ startDate: '', endDate: '' });
  const [isSavingYear, setIsSavingYear] = useState(false);

  // Weekly Sessions State
  const [weeklySessions, setWeeklySessions] = useState<{ dayOfWeek: number, time: string, isActive?: boolean }[]>(
    siteConfig.weeklySessions || [{ dayOfWeek: 4, time: '07:00', isActive: false }]
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

  // Color Catalog Logic
  useEffect(() => {
    if (activeTab !== 'SITE') return;

    const generateColorCatalog = () => {
      const container = document.getElementById('palettes-container');
      if (!container) return;
      
      container.innerHTML = ''; // Clear existing

      const themes = [
        { 
          name: 'פלטת Ocean', 
          variables: [
            '--ocean-1', '--ocean-2', '--ocean-3', '--ocean-4', '--ocean-5',
            '--ocean-6', '--ocean-7', '--ocean-8', '--ocean-9', '--ocean-10',
            '--ocean-bg', '--ocean-liquid'
          ] 
        },
        { 
          name: 'פלטת Sand', 
          variables: [
            '--sand-light', '--sand-medium', '--sand-dark', '--sand-deep', '--sand-accent'
          ] 
        },
        {
          name: 'פלטת Surfers Theme',
          variables: [
            '--vibrant-cyan', '--turquoise-teal', '--electric-red-pink', 
            '--deep-magenta', '--sunshine-yellow', '--golden-orange',
            '--deep-shadow', '--tan-skin', '--deep-teal-sea', '--aqua-mist'
          ]
        },
        {
          name: 'צבעי מערכת ו-Glassmorphism',
          variables: [
            '--accent-blue', '--bg-main', '--bg-alt', '--text-main', '--text-muted',
            '--glass-bg', '--glass-text', '--glass-text-dark'
          ]
        }
      ];

      themes.forEach(theme => {
        const group = document.createElement('div');
        group.className = 'palette-group';
        group.innerHTML = `<h3>${theme.name}</h3>`;
        
        const grid = document.createElement('div');
        grid.className = 'color-grid';

        theme.variables.forEach(v => {
          const value = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
          if (value) {
            const card = document.createElement('div');
            card.className = 'color-card';
            
            card.innerHTML = `
              <div class="color-swatch" style="background-color: var(${v})"></div>
              <span class="color-hex">${value}</span>
              <span class="color-var-name">${v}</span>
            `;

            card.onclick = async () => {
              try {
                await navigator.clipboard.writeText(value);
                const hexSpan = card.querySelector('.color-hex') as HTMLElement;
                const originalText = hexSpan.innerText;
                hexSpan.innerText = "הועתק! ✅";
                hexSpan.style.color = "#ff009f";
                setTimeout(() => { 
                  hexSpan.innerText = originalText; 
                  hexSpan.style.color = "#666";
                }, 1500);
              } catch (err) {
                console.error('שגיאה בהעתקה:', err);
              }
            };

            grid.appendChild(card);
          }
        });

        if (grid.children.length > 0) {
          group.appendChild(grid);
          container.appendChild(group);
        }
      });
    };

    // Run after a short delay to ensure CSS is applied
    const timer = setTimeout(generateColorCatalog, 500);
    return () => clearTimeout(timer);
  }, [activeTab]);
  
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

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. Process image
        const processed = await processImage(file, 1920, 0.8);
        
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
          atalefLogo: "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Flogo%2Fatalef-logo.png?alt=media",
          reefLogo: "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Flogo%2Freef-logo.jpeg?alt=media",
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
    <div className="relative min-h-screen bg-[var(--aqua-mist)]/20 text-right space-y-12 pb-20 pt-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Body-line Standard Header Stack */}
        <div className="surfboard-hero-container mb-6 space-y-2">
          {/* Main Title */}
          <h1 className="main-page-title">
          <span className="surfer-title">פאנל ניהול</span>
        </h1>

          {/* Subtitle with Emoji context */}
          <div className="flex flex-col items-center gap-4">
            <p className="header-subtitle max-w-2xl">
              ניהול משתמשים, בקשות הצטרפות והגדרות מערכת מתקדמות 🛡️
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-12 items-start">
          {/* Top Navigation - Glass Style like AdminInfoPage */}
          <div className="w-full mb-8">
            <GlassNavigationBar 
              items={adminTabs}
              activeId={activeTab}
              onChange={handleTabChange}
            />
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
                  { id: 'USERS', label: 'ניהול משתמשים', desc: `${members.length} חברים רשומים`, icon: Users, color: 'bg-[var(--turquoise-teal)]' },
                  { id: 'REQUESTS', label: 'בקשות הצטרפות', desc: `${joinRequests.length} ממתינים לאישור`, icon: UserCheck, color: 'bg-[var(--electric-red-pink)]', count: joinRequests.length },
                  { id: 'EVENTS', label: 'ניהול אירועים', desc: `${events.length} אירועים בלוח`, icon: Calendar, color: 'bg-[var(--vibrant-cyan)]' },
                  { id: 'GALLERY', label: 'גלריית תמונות', desc: `${galleryItems.length} פריטים במדיה`, icon: ImageIcon, color: 'bg-[var(--sunshine-yellow)]' },
                  { id: 'POSTS', label: 'פוסטים', desc: 'ניהול תכני האתר', icon: Newspaper, color: 'bg-[var(--sun-bleached)]' },
                  { id: 'SITE', label: 'הגדרות אתר', desc: 'לוגואים, רקעים ונכסים', icon: Settings, color: 'bg-[var(--deep-teal-sea)]' },
                  { id: 'ARCHIVE', label: 'ארכיון משתמשים', desc: 'ניהול חברים שהושעו', icon: Archive, color: 'bg-[var(--deep-magenta)]' },
                  { id: 'ROLLOVER', label: 'דו"ח יום חמישי', desc: 'ארכיון סשנים שבועי וסיכום נוכחות', icon: Activity, color: 'bg-[var(--turquoise-teal)]' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                    }}
                    className="group bg-white p-8 rounded-[2.5rem] border border-[var(--vibrant-cyan)]/10 shadow-sm hover:shadow-2xl hover:shadow-[var(--turquoise-teal)]/10 transition-all duration-500 text-right relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-2 h-full ${item.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${item.color} ${item.color === 'bg-[var(--sunshine-yellow)]' || item.color === 'bg-[var(--sun-bleached)]' ? 'text-[var(--deep-teal-sea)]' : 'text-white'} shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        <item.icon size={28} />
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <div className="bg-[var(--electric-red-pink)] text-white px-3 py-1 rounded-full text-[12px] font-black animate-pulse">
                          {item.count} חדש
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-[var(--deep-teal-sea)] mb-2 group-hover:text-[var(--turquoise-teal)] transition-colors">{item.label}</h3>
                    <p className="text-xs font-black text-[var(--deep-teal-sea)]/70 uppercase tracking-widest">{item.desc}</p>
                    
                    <div className="mt-8 flex items-center gap-2 text-[var(--turquoise-teal)] text-[12px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      כניסה לניהול <ArrowLeft size={12} />
                    </div>
                  </button>
                ))}
              </div>
            )}

        {activeTab === 'REQUESTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Join Requests Summary Card */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--turquoise-teal)]/10 group">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                    <UserCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">בקשות להצטרף</h3>
                    <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">ניהול ואישור חברים חדשים בקהילה</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    בקשות ממתינות {joinRequests.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--turquoise-teal)]/40" />
               <input 
                 type="text" 
                 placeholder="חיפוש לפי שם או אימייל..." 
                 className="w-full pr-16 pl-6 py-6 bg-[var(--aqua-mist)]/10 rounded-[2.5rem] border-none font-black focus:ring-2 ring-[var(--vibrant-cyan)]/30 shadow-sm"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>

            {filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map(req => (
                  <div key={req.id} className={`bg-white border border-[var(--vibrant-cyan)]/5 rounded-[3rem] p-8 shadow-sm hover:shadow-xl hover:shadow-[var(--vibrant-cyan)]/5 transition-all group flex flex-col h-full ${isProcessing === req.id ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-5 mb-8">
                       {req.avatar ? (
                         <img src={req.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                       ) : (
                         <div className="w-16 h-16 rounded-2xl bg-[var(--aqua-mist)]/20 flex items-center justify-center text-[var(--vibrant-cyan)] shadow-md">
                           <UserCircle size={32} />
                         </div>
                       )}
                       <div>
                          <h4 className="text-xl font-black text-[var(--deep-teal-sea)] mb-1">{req.firstName} {req.lastName}</h4>
                          <div className="flex items-center gap-2 text-[var(--turquoise-teal)]/60 font-bold text-[12px] uppercase tracking-widest">
                             <Calendar size={12} />
                             {new Date(req.requestedAt).toLocaleDateString('he-IL')}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 flex-1">
                       <div className="flex items-center gap-3 p-3 bg-[var(--aqua-mist)]/10 rounded-xl">
                          <Mail size={14} className="text-[var(--turquoise-teal)]/60" />
                          <span className="text-xs font-black truncate">{req.email}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-[var(--aqua-mist)]/10 rounded-xl">
                          <Phone size={14} className="text-[var(--turquoise-teal)]/60" />
                          <span className="text-xs font-black">{req.mobile}</span>
                       </div>
                       <div className="flex items-center gap-3 p-3 bg-[var(--turquoise-teal)]/10 text-[var(--vibrant-cyan)] rounded-xl">
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
                         className="flex-1 py-4 hd-glass-button-gold text-white rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                       >
                         {isProcessing === req.id ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} className="text-[var(--water-highlight)]" />}
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
                 <div className="w-20 h-20 bg-[var(--aqua-mist)]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--turquoise-teal)]/20">
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
                <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--turquoise-teal)]/10 group">
                  <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                    
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                        <Users size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">חברים</h3>
                        <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">ניהול וסינון חברי הקהילה</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        רשומים {stats.total}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        פעילים {stats.active}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        מושעים {stats.suspended}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        מדריכים {stats.instructors}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        רכזים {stats.coordinators}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

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
              <div className="bg-white border border-[var(--vibrant-cyan)]/5 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-[var(--aqua-mist)]/10 border-b border-[var(--vibrant-cyan)]/5">
                      <tr>
                        <th className="px-8 py-6 text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest">משתמש</th>
                        <th className="px-8 py-6 text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest">סטטוס</th>
                        <th className="px-8 py-6 text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest text-center">עריכה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--aqua-mist)]/20">
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
                        <tr key={member.id} className="hover:bg-[var(--aqua-mist)]/10 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              {member.avatar ? (
                                <img src={member.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-[var(--aqua-mist)]/20 flex items-center justify-center text-[var(--turquoise-teal)]/40">
                                  <UserCircle size={24} />
                                </div>
                              )}
                              <div>
                                <h4 className="font-black text-[var(--deep-teal-sea)]">{member.firstName} {member.lastName}</h4>
                                <p className="text-[12px] text-[var(--turquoise-teal)]/60 font-black truncate max-w-[150px]">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest ${
                              member.role === 'Admin' 
                                ? 'bg-[var(--vibrant-cyan)]/10 text-[var(--vibrant-cyan)]' 
                                : member.role === 'Instructor'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-[var(--aqua-mist)]/10 text-[var(--turquoise-teal)]/60'
                            }`}>
                              {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={() => setEditingMember(member)}
                                className="w-10 h-10 bg-white border border-[var(--vibrant-cyan)]/10 rounded-xl flex items-center justify-center text-[var(--turquoise-teal)]/40 hover:text-[var(--vibrant-cyan)] hover:border-[var(--vibrant-cyan)]/30 hover:shadow-lg transition-all"
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
            {/* Suspended Members Summary Card */}
            {(() => {
              const suspendedCount = members.filter(m => m.isActive === false).length;
              return (
                <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--turquoise-teal)]/10 group">
                  <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                    
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                        <UserX size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">חברים מושעים</h3>
                        <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">ניהול משתמשים שהוצאו מהמערכת</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                      <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        מושעים {suspendedCount}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white border border-[var(--vibrant-cyan)]/5 rounded-[3rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-[var(--aqua-mist)]/10 border-b border-[var(--vibrant-cyan)]/5">
                    <tr>
                      <th className="px-8 py-6 text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest">משתמש מושעה</th>
                      <th className="px-8 py-6 text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest">תפקיד</th>
                      <th className="px-8 py-6 text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest text-center">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--aqua-mist)]/10">
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
                      <tr key={member.id} className="hover:bg-[var(--aqua-mist)]/10 transition-all group">
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
                                className="w-12 h-12 rounded-xl bg-[var(--aqua-mist)]/20 flex items-center justify-center text-[var(--turquoise-teal)]/20 cursor-pointer hover:bg-[var(--aqua-mist)]/30 transition-colors"
                                onClick={() => setEditingMember(member)}
                              >
                                <UserCircle size={24} />
                              </div>
                            )}
                            <div>
                              <h4 className="font-black text-[var(--turquoise-teal)]/40">{member.firstName} {member.lastName}</h4>
                              <p className="text-[12px] text-[var(--turquoise-teal)]/20 font-black truncate max-w-[150px]">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest bg-[var(--aqua-mist)]/10 text-[var(--turquoise-teal)]/40">
                            {member.role === 'Admin' ? 'מנהל' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setEditingMember(member)}
                              className="w-10 h-10 bg-white border border-[var(--vibrant-cyan)]/10 rounded-xl flex items-center justify-center text-[var(--turquoise-teal)]/40 hover:text-[var(--vibrant-cyan)] hover:border-[var(--vibrant-cyan)]/30 hover:shadow-lg transition-all"
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
                              className="w-10 h-10 bg-white border border-[var(--vibrant-cyan)]/10 rounded-xl flex items-center justify-center text-[var(--turquoise-teal)]/40 hover:text-[var(--vibrant-cyan)] hover:border-[var(--vibrant-cyan)]/30 hover:shadow-lg transition-all"
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
                        <td colSpan={3} className="px-8 py-12 text-center text-[var(--turquoise-teal)]/40 font-black">אין משתמשים בארכיון</td>
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
            {/* Posts Summary Card */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--turquoise-teal)]/10 group">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                    <Newspaper size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">פוסטים</h3>
                    <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">ניהול ומחיקה של פוסטים בקהילה</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    פוסטים פעילים {news.length}
                  </div>
                  
                  <button 
                    onClick={() => setEditingPost({})}
                    className="bg-[var(--vibrant-cyan)] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-[var(--deep-teal-sea)] transition-all shadow-lg shadow-[var(--vibrant-cyan)]/20 flex items-center gap-2 active:scale-95"
                  >
                    <Plus size={18} />
                    פוסט חדש
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map(item => (
                <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col relative group">
                  {item.imageUrl && (
                    <img src={item.imageUrl} className="w-full h-40 object-cover rounded-xl mb-4" alt="" />
                  )}
                  <h3 className="font-black text-lg text-[#2B2B2E] mb-2">{item.title}</h3>
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
                        <p className="text-[12px] text-slate-400">{new Date(item.date).toLocaleDateString('he-IL')}</p>
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
            {/* Gallery Summary Card */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--turquoise-teal)]/10 group">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
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
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--turquoise-teal)]/10 group">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">לוח אירועים</h3>
                    <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">ניהול לוח הזמנים הקהילתי</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    אירועים מתוכננים {events.length}
                  </div>
                  
                  <button 
                    onClick={() => setEditingEvent({})}
                    className="bg-[var(--vibrant-cyan)] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-[var(--deep-teal-sea)] transition-all shadow-lg shadow-[var(--vibrant-cyan)]/20 flex items-center gap-2 active:scale-95"
                  >
                    <Plus size={18} />
                    אירוע חדש
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(event => {
                const eventDate = new Date(`${event.date}T${event.time || '00:00'}`);
                const isPastEvent = eventDate < new Date();

                return (
                  <div key={event.id} className={`bg-white border border-[var(--vibrant-cyan)]/5 rounded-[3rem] p-8 shadow-sm hover:shadow-xl hover:shadow-[var(--vibrant-cyan)]/5 transition-all flex items-center justify-between group relative overflow-hidden ${isPastEvent ? 'opacity-75' : ''}`}>
                    
                    {isPastEvent && (
                      <div className="absolute -right-12 top-6 transform rotate-45 bg-slate-100 text-slate-400 text-[12px] font-black uppercase tracking-widest px-12 py-1 shadow-sm z-10">
                        הסתיים
                      </div>
                    )}

                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl flex items-center justify-center font-black min-w-max ${isPastEvent ? 'bg-slate-100 text-slate-400' : 'bg-[var(--vibrant-cyan)]/10 text-[var(--vibrant-cyan)]'}`}>
                        <span className="text-sm whitespace-nowrap tabular-nums">{formatDate(event.date)}</span>
                      </div>
                      <div className="flex flex-col">
                        <h4 className={`text-xl font-black mb-1 ${isPastEvent ? 'text-slate-500 line-through decoration-slate-300' : 'text-[var(--deep-teal-sea)]'}`}>{event.title}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[var(--turquoise-teal)]/60">{event.location}</p>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                            event.type === 'COMMUNITY' ? 'bg-[var(--vibrant-cyan)] text-white' : 
                            event.type === 'INSTRUCTOR' ? 'bg-amber-500 text-white' : 
                            'bg-[var(--aqua-mist)]/10 text-[var(--turquoise-teal)]/60'
                          }`}>
                            {event.type === 'COMMUNITY' ? 'קהילה' : event.type === 'INSTRUCTOR' ? 'מדריך' : 'חבר'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isPastEvent && (
                        <button 
                          onClick={() => handleEditEvent(event)}
                          className="p-4 bg-[var(--aqua-mist)]/10 text-[var(--turquoise-teal)] rounded-2xl hover:bg-[var(--vibrant-cyan)] hover:text-white transition-all"
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
                          className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                          title="מחיקת אירוע"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                      {isPastEvent && (
                         <button 
                          className="p-4 bg-slate-50 text-slate-300 rounded-2xl cursor-not-allowed"
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

        {activeTab === 'SITE' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
            {/* Design and Settings Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-[var(--deep-teal-sea)] text-white rounded-2xl shadow-lg shadow-[var(--deep-teal-sea)]/20">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">עיצוב והגדרות</h3>
                  <p className="text-[var(--deep-teal-sea)]/60 font-bold">ניהול פרמטרים עיצוביים והגדרות מערכת מתקדמות</p>
                </div>
              </div>

              <div className="bg-red-600 border-4 border-red-800 py-6 px-[5%] rounded-[1.5rem] flex flex-col items-center justify-center gap-3 shadow-[0_0_25px_rgba(220,38,38,0.8)] animate-pulse text-center transform hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-50"></div>
                <ShieldAlert size={48} className="text-white mb-2 animate-bounce relative z-10" />
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] relative z-10">
                  ⚠️ אל תיגע כאן! ⚠️
                </h2>
                <p className="text-lg md:text-xl font-black text-white/95 leading-relaxed max-w-2xl drop-shadow-md relative z-10">
                  שינוי פרמטרים אלה עלול להפוך את האתר למדפסת בלי דפים ולגרום לדיכאון תכנותי
                </p>
              </div>
            </div>

            {/* Habal Zug Year Config Widget */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--vibrant-cyan)]/10 group">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">הגדרת שנת פעילות</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest">תקופה פעילה כעת</p>
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
                        <Calendar size={10} className="text-[var(--vibrant-cyan)] opacity-0 group-hover/dates:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-base font-black text-[var(--deep-teal-sea)] tabular-nums">{formatDate(yearConfig?.startDate || '---')}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 mx-2" />
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                        סיום שנת פעילות
                        <Calendar size={10} className="text-[var(--vibrant-cyan)] opacity-0 group-hover/dates:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-base font-black text-[var(--deep-teal-sea)] tabular-nums">{formatDate(yearConfig?.endDate || '---')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-[var(--turquoise-teal)] uppercase tracking-widest mb-1">שבועות שחלפו</p>
                      <div className="flex items-baseline gap-1 justify-center">
                        <span className="text-4xl font-black text-[var(--vibrant-cyan)] tabular-nums">{calculateWeeks(yearConfig?.startDate || '')}</span>
                        <span className="text-[12px] font-black text-slate-400">/ 52</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsEditingYear(true)}
                      className="w-14 h-14 bg-[var(--deep-teal-sea)] text-white rounded-2xl flex items-center justify-center hover:bg-[var(--vibrant-cyan)] transition-all shadow-xl shadow-[var(--deep-teal-sea)]/10 active:scale-90"
                      title="עריכת הגדרות שנה"
                    >
                      <Save size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Sessions Config Widget */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--vibrant-cyan)]/10 group mb-6">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-start justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10 lg:w-1/3">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">ניהול מועדי סשנים</h3>
                    <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">ניהול ימים ושעות לסשנים קבועים</p>
                  </div>
                </div>

                <div className="flex-1 relative z-10 space-y-6">
                  {/* Active Sessions List */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-black text-[var(--deep-teal-sea)] mb-4">מועדי סשנים שמורים:</h4>
                    {weeklySessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <input 
                            type="checkbox"
                            checked={session.isActive !== false}
                            onChange={(e) => {
                              const newSessions = [...weeklySessions];
                              newSessions[index] = { ...newSessions[index], isActive: e.target.checked };
                              setWeeklySessions(newSessions);
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-[#4A5568] focus:ring-[#4A5568]"
                          />
                          <span className={`px-2 py-1 rounded-md text-[12px] font-black tracking-widest uppercase ${session.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                            {session.isActive !== false ? 'פעיל' : 'מושבת'}
                          </span>
                          <div className="flex-1">
                            <p className="text-lg font-black text-[var(--deep-teal-sea)]">
                              יום {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][session.dayOfWeek]} - {session.time}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSessionToDelete(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          title="מחיקת סשן"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Delete Session Warning Modal */}
                  {sessionToDelete !== null && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-rose-100"
                      >
                        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                          <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-center text-slate-800 mb-4">
                          ⚠️ אזהרה: אל תעשו את זה לעצמכם (או לנו)
                        </h3>
                        <p className="text-center text-slate-600 mb-8 font-medium leading-relaxed">
                          מחיקת סשן עלולה לגרום לנתונים להיעלם, לפעילות להיעצר ולמפתחים שלנו 
                          לפתח מיגרנה קשה בניסיון להציל את המצב. בטוח שאתה רוצה להמשיך?
                        </p>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setSessionToDelete(null)}
                            className="flex-1 py-4 rounded-xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            אני אוותר
                          </button>
                          <button
                            onClick={() => {
                              const newSessions = [...weeklySessions];
                              newSessions.splice(sessionToDelete, 1);
                              setWeeklySessions(newSessions);
                              setSessionToDelete(null);
                            }}
                            className="flex-1 py-4 rounded-xl font-black text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30"
                          >
                            אני מתעקש
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Add New Session Controls */}
                  <div className="mt-8">
                    <h4 className="text-lg font-black text-[var(--deep-teal-sea)] mb-4">הוספת מועד סשן שבועי</h4>
                    <div className="flex flex-wrap items-end gap-4 p-4 bg-[var(--aqua-mist)]/10 rounded-2xl border border-[var(--vibrant-cyan)]/10">
                      <div className="flex-1 min-w-[280px]">
                        <label className="block text-[12px] font-black text-[var(--deep-teal-sea)]/60 uppercase tracking-widest mb-3">יום בשבוע</label>
                        <DayPicker value={newSessionDay} onChange={setNewSessionDay} />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[12px] font-black text-[var(--deep-teal-sea)]/60 uppercase tracking-widest mb-3">שעה</label>
                        <TimePicker 
                          value={newSessionTime} 
                          onChangeValue={setNewSessionTime} 
                          className="w-full bg-white/40 backdrop-blur-md border border-white/20 rounded-xl p-3 text-xl font-bold text-[var(--deep-teal-sea)] focus:ring-2 focus:ring-[var(--surfer-cyan)] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={async () => {
                        setIsSavingSessions(true);
                        try {
                          const newSession = {
                            dayOfWeek: newSessionDay,
                            time: newSessionTime,
                            isActive: false
                          };
                          
                          let updatedSessions = [...weeklySessions];
                          
                          // Prevent duplicates when adding the new session
                          if (!weeklySessions.some(s => s.dayOfWeek === newSession.dayOfWeek && s.time === newSession.time)) {
                            updatedSessions.push(newSession);
                            setWeeklySessions(updatedSessions);
                          }

                          await updateSiteConfig({ weeklySessions: updatedSessions });
                          showSuccess('מועדי הסשנים נשמרו בהצלחה');
                        } catch (err) {
                          console.error(err);
                          showError('שגיאה בשמירת מועדי הסשנים');
                        } finally {
                          setIsSavingSessions(false);
                        }
                      }}
                      disabled={isSavingSessions}
                      className="px-8 py-4 bg-[var(--deep-teal-sea)] text-white rounded-2xl font-black text-sm hover:bg-[var(--vibrant-cyan)] transition-all shadow-lg shadow-[var(--deep-teal-sea)]/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingSessions ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      שמירת נתונים
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Home Break Config Widget */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--vibrant-cyan)]/10 group mb-6">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                    <MapPin size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">חוף הבית</h3>
                    <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">עוגן לחישוב מרחקים גיאוגרפים</p>
                  </div>
                </div>

                <div className="flex-1 max-w-xl relative z-10 space-y-2">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest mr-4">כתובת</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        ref={addressInputRef}
                        defaultValue={siteConfig.home_break?.formatted || ''} 
                        readOnly={!hasConfirmedHomeBreakEdit}
                        onClick={() => {
                          if (!hasConfirmedHomeBreakEdit) {
                            showConfirm({
                              title: 'שינוי חוף הבית',
                              message: 'השאר את החוף במקומו, לטובת השלווה של כולנו.',
                              confirmText: 'המשך לשינוי',
                              cancelText: 'חזור אחורה',
                              onConfirm: () => {
                                setHasConfirmedHomeBreakEdit(true);
                                setTimeout(() => addressInputRef.current?.focus(), 100);
                              },
                              onCancel: () => {}
                            });
                          }
                        }}
                        onChange={(e) => {
                          setIsPlaceSelected(false);
                          selectedPlaceRef.current = null;
                        }} 
                        placeholder="התחל להקליד: עיר, רחוב ומספר בית..."
                        className={`w-full pr-14 pl-6 py-5 rounded-2xl font-black outline-none border transition-all text-[var(--deep-teal-sea)] ${hasConfirmedHomeBreakEdit ? 'bg-white border-[var(--vibrant-cyan)]/50 shadow-lg shadow-[var(--vibrant-cyan)]/10' : 'bg-slate-50 border-slate-50 cursor-pointer hover:bg-slate-100'}`}
                        autoComplete="off"
                      />
                    </div>
                    {hasConfirmedHomeBreakEdit && (
                      <button 
                        onClick={async () => {
                          const currentValue = addressInputRef.current?.value || '';
                          if (currentValue.trim() === '') {
                            try {
                              await updateSiteConfig({ home_break: null });
                              showSuccess('כתובת חוף הבית נמחקה בהצלחה!');
                              setHasConfirmedHomeBreakEdit(false);
                            } catch (err) {
                              console.error(err);
                              showError('שגיאה בעדכון הכתובת');
                            }
                          } else if (isPlaceSelected && selectedPlaceRef.current) {
                            try {
                              const addressData = extractAddressData(selectedPlaceRef.current);
                              await updateSiteConfig({ home_break: addressData });
                              showSuccess('כתובת חוף הבית עודכנה בהצלחה!');
                              setHasConfirmedHomeBreakEdit(false);
                            } catch (err) {
                              console.error(err);
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
                                    showSuccess('כתובת חוף הבית עודכנה בהצלחה!');
                                    setHasConfirmedHomeBreakEdit(false);
                                    if (addressInputRef.current) {
                                      addressInputRef.current.value = results[0].formatted_address;
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    showError('שגיאה בעדכון הכתובת');
                                  }
                                } else {
                                  showError('לא הצלחנו למצוא את הכתובת המבוקשת. אנא בחר מהרשימה.');
                                }
                              });
                            } else {
                              showError('שירות המפות אינו זמין כרגע.');
                            }
                          }
                        }}
                        className="bg-[var(--vibrant-cyan)] text-white px-8 rounded-2xl font-black hover:bg-[var(--turquoise-teal)] transition-colors shadow-lg shadow-[var(--vibrant-cyan)]/20 whitespace-nowrap"
                      >
                        שמור
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Position Toggle Widget */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--vibrant-cyan)]/10 group mb-6">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--vibrant-cyan)]/20 group-hover:rotate-6 transition-transform">
                    <LayoutDashboard size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">מיקום תפריט הניווט</h3>
                    <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">החלפה בין תפריט עליון לתחתון</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Global Color Picker Widget */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-3xl shadow-2xl shadow-[var(--vibrant-cyan)]/10 group mb-6 inline-block">
              <div className="bg-white/95 backdrop-blur-xl p-4 rounded-[1.8rem] relative overflow-hidden flex items-center gap-6">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div>
                  <h3 className="text-lg font-black text-[var(--deep-teal-sea)] tracking-tight">בקר צבע גלובלי</h3>
                  <p className="text-[9px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-0.5">שינוי גוון הטורקיז</p>
                </div>

                <div className="relative">
                  <input 
                    type="color" 
                    value={siteConfig.globalColor || '#40E0D0'} 
                    onChange={(e) => {
                      const newColor = e.target.value;
                      document.documentElement.style.setProperty('--gt-accent', newColor);
                      updateSiteConfig({ globalColor: newColor });
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-xl shadow-lg border-2 border-white flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: siteConfig.globalColor || '#40E0D0' }}>
                    <ColorPickerIcon className="w-7 h-7 text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* H1 Ultra Design Studio Widget */}
            <div className="bg-[var(--deep-teal-sea)] p-[2px] rounded-[3rem] shadow-2xl shadow-[var(--vibrant-cyan)]/10 group mb-10">
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.8rem] relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-[var(--vibrant-cyan)]/5 rounded-full blur-3xl group-hover:bg-[var(--vibrant-cyan)]/10 transition-colors" />
                
                <div className="flex items-center gap-6 mb-10 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#6366f1]/20 group-hover:rotate-6 transition-transform">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] tracking-tight">Ultra Design Studio</h3>
                    <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">אולטרה סטודיו לעיצוב</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                  {/* Preview Area */}
                  <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-[2rem] min-h-[160px] border border-slate-100 relative overflow-hidden">
                    <p className="text-[12px] font-black text-white/80 uppercase tracking-widest mb-2 relative z-10">תצוגה מקדימה</p>
                    <div className="surfboard-hero-container" style={{ minHeight: 'auto', padding: '20px 0' }}>
                      <h1 className="main-page-title m-0 relative z-10">
          <span className="surfer-title">כותרת אולטרה</span>
        </h1>
                    </div>
                  </div>

                  {/* Controls Area */}
                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    {/* Basic Typography */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">גודל פונט</label>
                          <span className="text-xs font-black text-[#6366f1]">{siteConfig.h1Styles?.fontSize || '50px'}</span>
                        </div>
                        <div className="gt-stepper w-full !justify-between">
                          <button 
                            type="button"
                            onClick={() => {
                              const current = parseInt(siteConfig.h1Styles?.fontSize || '50');
                              if (current > 20) updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, fontSize: (current - 1) + 'px' } });
                            }}
                            className="gt-step-btn minus"
                          >-</button>
                          <div className="gt-step-val">{parseInt(siteConfig.h1Styles?.fontSize || '50')}</div>
                          <button 
                            type="button"
                            onClick={() => {
                              const current = parseInt(siteConfig.h1Styles?.fontSize || '50');
                              if (current < 120) updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, fontSize: (current + 1) + 'px' } });
                            }}
                            className="gt-step-btn plus"
                          >+</button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">ריווח אותיות</label>
                          <span className="text-xs font-black text-[#6366f1]">{siteConfig.h1Styles?.letterSpacing || '0'}px</span>
                        </div>
                        <div className="gt-stepper w-full !justify-between">
                          <button 
                            type="button"
                            onClick={() => {
                              const current = parseInt(siteConfig.h1Styles?.letterSpacing || '0');
                              if (current > -5) updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, letterSpacing: (current - 1) + 'px' } });
                            }}
                            className="gt-step-btn minus"
                          >-</button>
                          <div className="gt-step-val">{parseInt(siteConfig.h1Styles?.letterSpacing || '0')}</div>
                          <button 
                            type="button"
                            onClick={() => {
                              const current = parseInt(siteConfig.h1Styles?.letterSpacing || '0');
                              if (current < 20) updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, letterSpacing: (current + 1) + 'px' } });
                            }}
                            className="gt-step-btn plus"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    {/* Gradient Colors */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block text-center">צבע 1</label>
                        <input 
                          type="color" 
                          value={siteConfig.h1Styles?.color1 || '#ffffff'}
                          onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, color1: e.target.value } })}
                          className="w-full h-10 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block text-center">צבע 2</label>
                        <input 
                          type="color" 
                          value={siteConfig.h1Styles?.color2 || '#ffffff'}
                          onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, color2: e.target.value } })}
                          className="w-full h-10 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block text-center">זווית ({siteConfig.h1Styles?.gradAngle || '90'}°)</label>
                        <input 
                          type="range" min="0" max="360" 
                          value={parseInt(siteConfig.h1Styles?.gradAngle || '90')}
                          onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, gradAngle: e.target.value } })}
                          className="gt-slider-input w-full" 
                        />
                      </div>
                    </div>

                    {/* Stroke & Glow */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block mb-2">קו מתאר (Stroke)</label>
                        <div className="flex items-center gap-3 mb-3">
                          <input 
                            type="color" 
                            value={siteConfig.h1Styles?.strokeColor || '#ffffff'}
                            onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, strokeColor: e.target.value } })}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                          />
                          <input 
                            type="range" min="0" max="10" 
                            value={parseInt(siteConfig.h1Styles?.strokeWidth || '0')}
                            onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, strokeWidth: e.target.value } })}
                            className="gt-slider-input flex-1" 
                          />
                        </div>
                      </div>
                      <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block mb-2">הילה (Glow)</label>
                        <div className="flex items-center gap-3 mb-3">
                          <input 
                            type="color" 
                            value={siteConfig.h1Styles?.glowColor || '#ffffff'}
                            onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, glowColor: e.target.value } })}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                          />
                          <input 
                            type="range" min="0" max="50" 
                            value={parseInt(siteConfig.h1Styles?.glowSize || '0')}
                            onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, glowSize: e.target.value } })}
                            className="gt-slider-input flex-1" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Glassmorphism Controls */}
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                      <div className="flex justify-between items-center">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">אפקט Glassmorphism</label>
                        <button 
                          onClick={() => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, showGlass: siteConfig.h1Styles?.showGlass === false ? true : false } })}
                          className={`px-6 py-2 rounded-xl font-black text-xs transition-all ${
                            siteConfig.h1Styles?.showGlass !== false ? 'bg-[#6366f1] text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {siteConfig.h1Styles?.showGlass !== false ? 'פעיל' : 'כבוי'}
                        </button>
                      </div>
                      
                      {siteConfig.h1Styles?.showGlass !== false && (
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">טשטוש</label>
                              <span className="text-xs font-black text-[#6366f1]">{siteConfig.h1Styles?.glassBlur || '10'}px</span>
                            </div>
                            <input 
                              type="range" min="0" max="30" 
                              value={parseInt(siteConfig.h1Styles?.glassBlur || '10')}
                              onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, glassBlur: e.target.value } })}
                              className="gt-slider-input w-full" 
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">שקיפות</label>
                              <span className="text-xs font-black text-[#6366f1]">{Math.round(parseFloat(siteConfig.h1Styles?.glassOpacity || '0.1') * 100)}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" 
                              value={parseFloat(siteConfig.h1Styles?.glassOpacity || '0.1') * 100}
                              onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, glassOpacity: (parseInt(e.target.value) / 100).toString() } })}
                              className="gt-slider-input w-full" 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Final Adjustments */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block">סוג פונט</label>
                        <select 
                          className="gt-select w-full"
                          value={siteConfig.h1Styles?.fontFamily || "'Assistant', sans-serif"}
                          onChange={(e) => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, fontFamily: e.target.value } })}
                        >
                          <option value="'Miriwin', sans-serif">MiriWin</option>
                          <option value="'Yehuda CLM', sans-serif">Yehuda CLM</option>
                          <option value="'Assistant', sans-serif">Assistant</option>
                          <option value="'Inter', sans-serif">Inter</option>
                          <option value="'Heebo', sans-serif">Heebo</option>
                          <option value="'Rubik', sans-serif">Rubik</option>
                          <option value="'Varela Round', sans-serif">Varela Round</option>
                          <option value="'Secular One', sans-serif">Secular One</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block">יישור</label>
                        <div className="gt-segmented">
                          {['right', 'center', 'left'].map(id => (
                            <button 
                              key={id}
                              onClick={() => updateSiteConfig({ h1Styles: { ...siteConfig.h1Styles, align: id } })}
                              className={`gt-segment-item ${siteConfig.h1Styles?.align === id || (!siteConfig.h1Styles?.align && id === 'center') ? 'active' : ''}`}
                            >
                              {id === 'right' ? 'ימין' : id === 'center' ? 'מרכז' : 'שמאל'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Catalog Section */}
            <section id="color-catalog" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-gradient-to-br from-[var(--vibrant-cyan)] to-[var(--turquoise-teal)] text-white rounded-2xl shadow-lg">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[var(--deep-teal-sea)] m-0">קטלוג פלטות צבעים</h2>
                        <p className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mt-1">ניהול ויזואלי של צבעי המערכת (לחיצה להעתקה)</p>
                    </div>
                </div>
                <div id="palettes-container">
                    {/* Will be populated by useEffect */}
                    <div className="flex items-center justify-center w-full py-12">
                        <Loader2 className="animate-spin text-[var(--vibrant-cyan)]" size={32} />
                    </div>
                </div>
            </section>

            <div className="bg-white border border-[var(--vibrant-cyan)]/10 rounded-[4rem] p-12 shadow-sm">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-[var(--vibrant-cyan)] text-white rounded-2xl shadow-lg"><RotateCcw size={24} /></div>
                   <div>
                      <h3 className="text-2xl font-black text-[var(--deep-teal-sea)]">הגדרות ונכסי אתר</h3>
                      <p className="text-[var(--turquoise-teal)]/60 font-bold">צפייה ועדכון הנכסים הוויזואליים של המערכת</p>
                   </div>
                </div>
                <button 
                  onClick={resetAssets}
                  className="px-6 py-3 bg-[var(--aqua-mist)]/10 text-[var(--vibrant-cyan)] rounded-2xl font-black text-xs hover:bg-[var(--aqua-mist)]/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  <RotateCcw size={14} />
                  איפוס לברירת מחדל
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(siteAssets || {}).map(([key, value]: [string, any]) => (
                   <div key={key} className="p-6 bg-[var(--aqua-mist)]/10 rounded-[2rem] border border-[var(--vibrant-cyan)]/5 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-[var(--vibrant-cyan)]/10 relative group/avatar">
                            {typeof value === 'string' && value.startsWith('http') ? (
                               <img src={value} className="w-full h-full object-contain p-2" alt="" />
                            ) : (
                               <span className="text-[var(--turquoise-teal)]/40 font-black text-[12px] uppercase">{key.slice(0, 2)}</span>
                            )}
                            
                            <button 
                              onClick={() => {
                                setReplacingAssetKey(key);
                                assetFileInputRef.current?.click();
                              }}
                              disabled={isUploadingAsset === key}
                              className="absolute inset-0 bg-[var(--deep-teal-sea)]/40 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all disabled:opacity-100"
                            >
                              {isUploadingAsset === key ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <Camera size={20} />
                              )}
                            </button>
                         </div>
                         <div>
                            <p className="text-[12px] font-black text-[var(--vibrant-cyan)] uppercase tracking-widest mb-1">{key}</p>
                            <h4 className="text-lg font-black text-[var(--deep-teal-sea)]">{ASSET_LABELS[key] || key}</h4>
                            <p className="text-[12px] font-bold text-[var(--turquoise-teal)]/40 truncate max-w-[180px]">{typeof value === 'string' ? value : 'נתון מורכב'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingAsset({ key, value: typeof value === 'string' ? value : '' })}
                          className="p-2 text-[var(--turquoise-teal)]/20 hover:text-[var(--vibrant-cyan)] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Settings size={16} />
                        </button>
                        {typeof value === 'string' && value.startsWith('http') && (
                          <a href={value} target="_blank" rel="noreferrer" className="p-2 text-[var(--turquoise-teal)]/20 hover:text-[var(--deep-teal-sea)] opacity-0 group-hover:opacity-100 transition-all">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                   </div>
                ))}
              </div>

              {/* Visual Component Gallery - Turquoise Glassmorphism */}
              <div className="mt-16 pt-16 border-t border-[var(--vibrant-cyan)]/10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-[var(--vibrant-cyan)] text-white rounded-2xl shadow-lg shadow-[var(--vibrant-cyan)]/20"><Sparkles size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--deep-teal-sea)]">גלריית רכיבים ויזואלית</h3>
                    <p className="text-[var(--vibrant-cyan)] font-bold">Turquoise Glassmorphism Component System</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* 1. Primary Button */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">כפתור ראשי</p>
                    <button className="gt-btn-primary">לחץ כאן</button>
                  </div>

                  {/* 2. Glass Button */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">כפתור זכוכית</p>
                    <button className="gt-btn-glass">כפתור שקוף</button>
                  </div>

                  {/* 3. Toggle */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">מפסק טורקיז (Toggle)</p>
                    <div className="gt-toggle-container">
                      <div className="gt-toggle" />
                      <span className="gt-label label-list">LIST</span>
                      <span className="gt-label label-grid">GRID</span>
                    </div>
                  </div>

                  {/* 4. Segmented Control */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">בקר מקטעים (Segmented)</p>
                    <div className="gt-segmented">
                      <div className="gt-segment-item active">LIST</div>
                      <div className="gt-segment-item">GRID</div>
                    </div>
                  </div>

                  {/* 5. Real Slider */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4 w-full">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">סליידר אמיתי</p>
                    <input type="range" className="gt-slider-input w-full" defaultValue="50" />
                  </div>

                  {/* 6. Stepper */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">מונה (Stepper)</p>
                    <div className="gt-stepper">
                      <div className="gt-step-btn minus">-</div>
                      <div className="gt-step-val">10</div>
                      <div className="gt-step-btn plus">+</div>
                    </div>
                  </div>

                  {/* 7. Input Field */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4 w-full">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">שדה טקסט (Input)</p>
                    <input type="text" className="gt-input" placeholder="הקלד כאן..." />
                  </div>

                  {/* 8. Select/Dropdown */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4 w-full">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">תפריט בחירה (Select)</p>
                    <select className="gt-select">
                      <option>אופציה 1</option>
                      <option>אופציה 2</option>
                      <option>אופציה 3</option>
                    </select>
                  </div>

                  {/* 9. Checkbox */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">צ'קבוקס (Checkbox)</p>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="gt-checkbox" id="gt-check-demo" />
                      <label htmlFor="gt-check-demo" className="text-xs font-bold text-slate-500">בחר אותי</label>
                    </div>
                  </div>

                  {/* 10. Sample Card */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4 w-full">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">כרטיס לדוגמה (Card)</p>
                    <div className="gt-card w-full">
                      <h4 className="font-black text-[var(--deep-teal-sea)] mb-2">כותרת כרטיס</h4>
                      <p className="text-[12px] text-slate-500">זהו כרטיס זכוכית מעוצב עם אפקט טשטוש עדין.</p>
                    </div>
                  </div>

                  {/* 11. Status Badge */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">תווית סטטוס (Badge)</p>
                    <div className="flex gap-2">
                      <span className="gt-badge">פעיל</span>
                      <span className="gt-badge" style={{ background: 'rgba(255, 0, 159, 0.1)', color: '#ff009f' }}>חדש</span>
                    </div>
                  </div>

                  {/* 12. Tooltip */}
                  <div className="p-8 bg-[#f8f9fa] rounded-[2.5rem] border border-black/5 flex flex-col items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">אייקון מידע (Tooltip)</p>
                    <div className="gt-info-wrapper">
                      <div className="gt-info-icon">i</div>
                      <span className="gt-tooltip">זהו הסבר קצר שמופיע רק כשמרחפים מעל האייקון!</span>
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[var(--deep-teal-sea)]/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-[var(--deep-teal-sea)] mb-2">עדכון נכס: {editingAsset.key}</h3>
            <p className="text-[var(--turquoise-teal)]/60 font-bold text-sm mb-8">הזן כתובת URL חדשה עבור הנכס</p>
            
            <div className="space-y-6 mb-10">
              <div className="space-y-2">
                <label className="text-[12px] font-black text-[var(--turquoise-teal)]/60 uppercase tracking-widest mr-4">כתובת URL</label>
                <input 
                  type="text"
                  value={editingAsset.value}
                  onChange={(e) => setEditingAsset({ ...editingAsset, value: e.target.value })}
                  className="w-full bg-[var(--aqua-mist)]/10 border border-[var(--vibrant-cyan)]/5 rounded-2xl px-6 py-4 font-bold text-[var(--deep-teal-sea)] focus:ring-2 focus:ring-[var(--vibrant-cyan)] outline-none transition-all"
                  placeholder="https://..."
                />
              </div>
              
              {editingAsset.value.startsWith('http') && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-[var(--vibrant-cyan)]/10 bg-[var(--aqua-mist)]/10">
                  <img src={editingAsset.value} className="w-full h-full object-contain" alt="Preview" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setEditingAsset(null)}
                className="py-4 bg-[var(--sun-bleached)] text-[var(--deep-teal-sea)] rounded-2xl font-black text-sm hover:bg-[var(--sunshine-yellow)]/20 transition-all"
              >
                ביטול
              </button>
              <button 
                onClick={handleUpdateAsset}
                className="py-4 bg-[var(--vibrant-cyan)] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[var(--deep-teal-sea)] transition-all"
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
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest pr-2">תאריך התחלה חדש</label>
                  <input 
                    type="date" 
                    value={yearForm.startDate}
                    onChange={e => setYearForm(prev => ({ ...prev, startDate: e.target.value }))}
                    onClick={(e) => (e.currentTarget as any).showPicker?.()}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 ring-[#ff009f]/5 focus:bg-white transition-all cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest pr-2">תאריך סיום חדש</label>
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
              
              <div className="w-20 h-20 bg-[var(--vibrant-cyan)] text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[var(--vibrant-cyan)]/10">
                 <CheckCircle2 size={40} />
              </div>
              
              <h3 className="text-3xl font-black text-[var(--deep-teal-sea)] mb-4">חבר/ה חדש/ה בנבחרת!</h3>
              <p className="text-[var(--turquoise-teal)]/60 font-bold text-lg mb-10 leading-relaxed">
                הבקשה של <span className="text-[var(--vibrant-cyan)]">{approvedUser.firstName} {approvedUser.lastName}</span> אושרה.
                נא לשלוח לו/ה את פרטי הגישה:
              </p>
              
              <div className="bg-[var(--aqua-mist)]/10 rounded-[2rem] p-8 mb-6 border border-[var(--vibrant-cyan)]/5 relative group">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-right">
                       <span className="text-[12px] font-black text-[var(--turquoise-teal)]/40 uppercase tracking-widest">שם משתמש</span>
                       <span className="font-black text-[var(--deep-teal-sea)]">{approvedUser.email}</span>
                    </div>
                    <div className="h-px bg-[var(--vibrant-cyan)]/10"></div>
                    <div className="flex justify-between items-center text-right">
                       <span className="text-[12px] font-black text-[var(--turquoise-teal)]/40 uppercase tracking-widest">סיסמה זמנית</span>
                       <span className="font-black text-[var(--vibrant-cyan)] text-xl tracking-wider select-all">{approvedUser.tempPassword}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-10">
                 <button 
                   onClick={() => openWhatsApp(approvedUser.mobile, `${approvedUser.firstName} ${approvedUser.lastName}`, approvedUser.email, approvedUser.tempPassword)}
                   className="w-full py-4 bg-[var(--vibrant-cyan)] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[var(--deep-teal-sea)] transition-all flex items-center justify-center gap-3"
                 >
                   <MessageCircle size={20} />
                   שלח בוואטסאפ
                 </button>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(formatWhatsAppMessage(`${approvedUser.firstName} ${approvedUser.lastName}`, approvedUser.email, approvedUser.tempPassword));
                     showSuccess('הודעת ההצטרפות הועתקה ללוח');
                   }}
                   className="w-full py-4 bg-[var(--aqua-mist)]/20 text-[var(--vibrant-cyan)] rounded-2xl font-black text-sm hover:bg-[var(--aqua-mist)]/30 transition-all flex items-center justify-center gap-3"
                 >
                   <Copy size={18} />
                   העתק הודעה ללוח
                 </button>
              </div>
              
              <button 
                onClick={() => setApprovedUser(null)} 
                className="w-full py-5 bg-[var(--deep-teal-sea)] text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-[var(--vibrant-cyan)] transition-all"
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
