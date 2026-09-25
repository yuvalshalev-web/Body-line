import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Terminal, Calendar, MapPin, Globe, Timer, Hourglass, 
  Clock, Plus, Trash2, Edit2, CheckCircle2, ShieldAlert, AlertTriangle, 
  FileText, Map as MapIcon, Users, Check, X, Loader2, Save, Eye,
  Layers, Activity, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { SUPER_ADMIN_EMAIL, isAppShaperUser } from '../constants';
import { loadGoogleMaps, extractAddressData } from '../utils/googlePlaces';
import { DayPicker } from '../components/DayPicker';
import { TimePicker } from '../components/TimePicker';
import { MarkdownViewer } from '../components/admin/MarkdownViewer';
import { ReadOnlyNoticeModal } from '../components/admin/ReadOnlyNoticeModal';

interface SystemSettingsPageProps {
  embedded?: boolean;
}

export const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showAlert, showConfirm, showSuccess, showError } = useModal();
  const { 
    siteConfig, updateSiteConfig, 
    yearConfig, updateYearConfig, 
    conflictingAdmins, updateMember, deleteMember, members 
  } = useData();

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Staff' || currentUser?.role === 'Support' || currentUser?.email?.toLowerCase() === 'yuval.shalev@gmail.com';
  const isAppShaper = isAppShaperUser(currentUser);
  const [showReadOnlyNotice, setShowReadOnlyNotice] = useState(false);

  const checkAppShaper = () => {
    if (!isAppShaper) {
      setShowReadOnlyNotice(true);
      return false;
    }
    return true;
  };

  // Conflict email editing
  const [editingConflictId, setEditingConflictId] = useState<string | null>(null);
  const [conflictNewEmail, setConflictNewEmail] = useState('');

  // Duplicate users cleanup
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  const handleCleanupDuplicates = () => {
    showConfirm({
      title: "מחיקת כפילויות",
      message: "האם אתה בטוח שברצונך למחוק את כל המשתמשים הכפולים? פעולה זו תשאיר רק משתמש אחד לכל כתובת אימייל (המשתמש עם הכי הרבה נתונים) ותמחק את השאר לצמיתות.",
      confirmText: "כן, נקה כפילויות",
      cancelText: "ביטול",
      onConfirm: async () => {
        setIsCleaningDuplicates(true);
        try {
          const emailGroups: Record<string, any[]> = {};
          members.forEach(m => {
            if (!m.email) return;
            const email = m.email.toLowerCase().trim();
            if (!emailGroups[email]) emailGroups[email] = [];
            emailGroups[email].push(m);
          });

          let deletedCount = 0;

          for (const [email, group] of Object.entries(emailGroups)) {
            if (group.length > 1) {
              group.sort((a, b) => {
                if (a.id === currentUser?.id) return -1;
                if (b.id === currentUser?.id) return 1;
                
                const aIsAuthId = a.id.length === 28;
                const bIsAuthId = b.id.length === 28;
                if (aIsAuthId && !bIsAuthId) return -1;
                if (!aIsAuthId && bIsAuthId) return 1;

                const aLogins = a.loginCount || 0;
                const bLogins = b.loginCount || 0;
                if (aLogins !== bLogins) return bLogins - aLogins;

                const aAtt = a.totalAttendance || 0;
                const bAtt = b.totalAttendance || 0;
                if (aAtt !== bAtt) return bAtt - aAtt;

                if (a.isActive && !b.isActive) return -1;
                if (!a.isActive && b.isActive) return 1;

                return 0;
              });

              const [primary, ...duplicates] = group;
              for (const dup of duplicates) {
                await deleteMember(dup.id);
                deletedCount++;
              }
            }
          }

          if (deletedCount > 0) {
            showSuccess(`נמחקו ${deletedCount} משתמשים כפולים בהצלחה.`);
          } else {
            showSuccess("לא נמצאו משתמשים כפולים במערכת.");
          }
        } catch (error) {
          console.error("Error cleaning up duplicates:", error);
          showError("שגיאה במחיקת כפילויות. אנא נסה שוב.");
        } finally {
          setIsCleaningDuplicates(false);
        }
      }
    });
  };

  // Markdown viewer state
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

  // Session Duration State
  const [sessionDurationInput, setSessionDurationInput] = useState<number>(siteConfig.sessionDurationMinutes || 90);
  const [isSavingSessionDuration, setIsSavingSessionDuration] = useState(false);

  useEffect(() => {
    if (siteConfig.sessionDurationMinutes !== undefined) {
      setSessionDurationInput(siteConfig.sessionDurationMinutes);
    }
  }, [siteConfig.sessionDurationMinutes]);

  // Google Maps Autocomplete for Home Break
  useEffect(() => {
    const initAutocomplete = () => {
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
  }, []);

  // Year Config State
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [yearForm, setYearForm] = useState<{ startDate: string; endDate: string; activityMode: 'קבוצתית' | 'משותפת' }>({
    startDate: '',
    endDate: '',
    activityMode: 'משותפת'
  });
  const [isSavingYear, setIsSavingYear] = useState(false);

  useEffect(() => {
    if (yearConfig) {
      setYearForm({ 
        startDate: yearConfig.startDate || '', 
        endDate: yearConfig.endDate || '',
        activityMode: (yearConfig.activityMode as 'קבוצתית' | 'משותפת') || 'משותפת'
      });
    }
  }, [yearConfig]);

  // Weekly Sessions State
  const [weeklySessions, setWeeklySessions] = useState<{ dayOfWeek: number, time: string, isActive?: boolean, isRecurring?: boolean }[]>(
    siteConfig.weeklySessions || [{ dayOfWeek: 4, time: '07:00', isActive: false, isRecurring: true }]
  );
  const [newSessionDay, setNewSessionDay] = useState(0);
  const [newSessionTime, setNewSessionTime] = useState('07:00');
  const [isSavingSessions, setIsSavingSessions] = useState(false);

  useEffect(() => {
    if (siteConfig.weeklySessions) {
      setWeeklySessions(siteConfig.weeklySessions);
    }
  }, [siteConfig.weeklySessions]);

  const calculateWeeks = (startDateStr: string) => {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const now = new Date();
    if (now < start) return 0;
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  };

  const formatDate = (dateValue: string) => {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={embedded ? "space-y-12" : "max-w-7xl mx-auto px-4 py-8 space-y-12"}>
      {/* Standalone Back Link if not embedded */}
      {!embedded && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black text-sm px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <ArrowRight size={18} />
            <span>חזרה לפאנל הניהול</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>פאנל ניהול</span>
            <span>/</span>
            <span className="text-slate-700">הגדרות מערכת</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black">
            <Settings size={24} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">הגדרות מערכת</h2>
        </div>
        <p className="text-slate-500 font-medium">ניהול פרמטרים טכניים, תשתיות, מועדי פעילות וקונפיגורציית ליבה של האתר</p>
      </div>

      {/* Read-Only Notice for Non-AppShapers */}
      {!isAppShaper && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-300/40 rounded-2xl flex items-center justify-between gap-4 text-amber-900 shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
              <Eye size={22} />
            </div>
            <div>
              <p className="font-black text-sm">מצב צפייה בלבד (Read-Only) 👀</p>
              <p className="text-xs text-amber-800/80 font-medium">
                רק משתמשים בעלי הרשאת אפ-שייפר מורשים לבצע שינויים בפרמטרים והגדרות מערכת.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowReadOnlyNotice(true)}
            className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl shadow hover:bg-amber-600 transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
          >
            לפרטים
          </button>
        </motion.div>
      )}

      {/* Warning Banner */}
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
              <AlertTriangle size={28} strokeWidth={3} className="animate-siren" />
            </motion.div>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                אזהרת מערכת
              </span>
              <div className="h-px flex-1 bg-rose-100 min-w-[20px]" />
            </div>
            <p className="text-slate-800 font-black text-lg leading-tight tracking-tight mt-1">
              אזהרה: אבן שזרק טיפש אחד לבאר, גם אלף חכמים לא יוציאו.
            </p>
            <p className="text-slate-700 font-bold text-sm leading-tight tracking-tight mt-1">
              אל תהיה הגיבור שבגללו כולם נשארים שבת. התעסקות עם ההגדרות האלו היא הזמנה רשמית לתקלות בלתי מוסברות, באגים על-טבעיים והתפטרות של צוות הפיתוח. נגיעה בזהירות מופלגת, או לא לגעת בכלל.
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

            {/* Activity Mode Toggle Switch */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center font-black">
                    <Layers size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מצב פעילות שנתי</p>
                    <p className="text-sm font-black text-slate-800">
                      {yearConfig?.activityMode === 'קבוצתית' ? 'פעילות קבוצתית (קבוצה א׳ / ב׳)' : 'פעילות משותפת (כל החברים)'}
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-black px-3 py-1 rounded-full border shadow-xs transition-colors ${
                  yearConfig?.activityMode === 'קבוצתית'
                    ? 'bg-blue-500 text-white border-blue-600 shadow-blue-500/20'
                    : 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20'
                }`}>
                  {yearConfig?.activityMode === 'קבוצתית' ? 'קבוצתית' : 'משותפת'}
                </span>
              </div>

              {/* Toggle Switch Component */}
              <div className="relative bg-slate-200/90 p-1.5 rounded-2xl flex items-center border border-slate-300/60 select-none">
                <button
                  type="button"
                  onClick={async () => {
                    if (!checkAppShaper()) return;
                    try {
                      await updateYearConfig({ activityMode: 'קבוצתית' });
                      showSuccess('מצב הפעילות עודכן ל: קבוצתית');
                    } catch (e) {
                      showError('שגיאה בעדכון מצב הפעילות');
                    }
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 relative z-10 cursor-pointer ${
                    yearConfig?.activityMode === 'קבוצתית'
                      ? 'bg-white text-blue-700 shadow-md ring-1 ring-black/5 font-black scale-[1.01]'
                      : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-white/40'
                  }`}
                >
                  <Users size={16} className={yearConfig?.activityMode === 'קבוצתית' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>קבוצתית</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!checkAppShaper()) return;
                    try {
                      await updateYearConfig({ activityMode: 'משותפת' });
                      showSuccess('מצב הפעילות עודכן ל: משותפת');
                    } catch (e) {
                      showError('שגיאה בעדכון מצב הפעילות');
                    }
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 relative z-10 cursor-pointer ${
                    yearConfig?.activityMode !== 'קבוצתית'
                      ? 'bg-white text-emerald-700 shadow-md ring-1 ring-black/5 font-black scale-[1.01]'
                      : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-white/40'
                  }`}
                >
                  <Activity size={16} className={yearConfig?.activityMode !== 'קבוצתית' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>משותפת</span>
                </button>
              </div>
            </div>

            <button 
              onClick={() => {
                if (!checkAppShaper()) return;
                setIsEditingYear(true);
              }}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 backdrop-blur-sm border border-white/20 active:scale-95 cursor-pointer"
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
                  if (!checkAppShaper()) return;
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
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all cursor-pointer"
                >
                  ביטול
                </button>
                <button 
                  onClick={async () => {
                    if (!checkAppShaper()) return;
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
                  className="flex-[2] py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs shadow-sm hover:bg-indigo-600 transition-all cursor-pointer"
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

      {/* Session Duration Config Widget */}
      <div className="luxury-card p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center shadow-sm border border-sky-100">
              <Timer size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">אורך הסשן (זמן מים)</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SESSION DURATION & SEA TIME MULTIPLIER</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200/70 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600">
            <Hourglass size={14} className="text-sky-500" />
            <span>ערך פעיל: <strong className="text-slate-800 font-black">{siteConfig.sessionDurationMinutes || 90} דק'</strong> ({(Number(siteConfig.sessionDurationMinutes || 90) / 60).toFixed(1)} שעות)</span>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            קביעת משך סשן גלישה בודד בדקות. נתון זה משמש כמקדם לחישוב צבירת שעות הגלישה האישיות של כל גולש, סך שעות המים של הקבוצה כולה, וכלל הסטטיסטיקות ומדדי ההתקדמות מול יעדי הקהילה.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50/70 rounded-3xl p-6 border border-slate-100">
            
            {/* Left Controls */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">משך סשן רצוי</span>
                <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                  = {(sessionDurationInput / 60).toFixed(2).replace(/\.00$/, '')} שעות לסשן
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAppShaper && !isAdmin && currentUser?.role !== 'Instructor') {
                      setShowReadOnlyNotice(true);
                      return;
                    }
                    setSessionDurationInput(prev => Math.max(15, prev - 15));
                  }}
                  className="px-4 py-3 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 font-black text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="הפחת 15 דקות"
                >
                  -15
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAppShaper && !isAdmin && currentUser?.role !== 'Instructor') {
                      setShowReadOnlyNotice(true);
                      return;
                    }
                    setSessionDurationInput(prev => Math.max(15, prev - 5));
                  }}
                  className="px-3.5 py-3 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 font-black text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="הפחת 5 דקות"
                >
                  -5
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    min="15"
                    max="300"
                    step="5"
                    value={sessionDurationInput}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setSessionDurationInput(Math.min(360, Math.max(15, val)));
                      }
                    }}
                    className="w-full text-center py-3.5 px-4 bg-white border-2 border-slate-200 focus:border-sky-500 rounded-2xl text-2xl font-black text-slate-800 outline-none transition-all shadow-inner tabular-nums"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">
                    דקות
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAppShaper && !isAdmin && currentUser?.role !== 'Instructor') {
                      setShowReadOnlyNotice(true);
                      return;
                    }
                    setSessionDurationInput(prev => Math.min(300, prev + 5));
                  }}
                  className="px-3.5 py-3 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 font-black text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="הוסף 5 דקות"
                >
                  +5
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAppShaper && !isAdmin && currentUser?.role !== 'Instructor') {
                      setShowReadOnlyNotice(true);
                      return;
                    }
                    setSessionDurationInput(prev => Math.min(300, prev + 15));
                  }}
                  className="px-4 py-3 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 font-black text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="הוסף 15 דקות"
                >
                  +15
                </button>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">בחירה מהירה:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { min: 45, label: "45 דק'", hrs: "0.75 ש'" },
                    { min: 60, label: "60 דק'", hrs: "שעה" },
                    { min: 75, label: "75 דק'", hrs: "1.25 ש'" },
                    { min: 90, label: "90 דק'", hrs: "1.5 ש'", isDefault: true },
                    { min: 105, label: "105 דק'", hrs: "1.75 ש'" },
                    { min: 120, label: "120 דק'", hrs: "שעתיים" }
                  ].map((preset) => {
                    const isSelected = sessionDurationInput === preset.min;
                    return (
                      <button
                        key={preset.min}
                        type="button"
                        onClick={() => {
                          if (!isAppShaper && !isAdmin && currentUser?.role !== 'Instructor') {
                            setShowReadOnlyNotice(true);
                            return;
                          }
                          setSessionDurationInput(preset.min);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/30 scale-[1.03]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className={`text-[9px] font-medium opacity-80 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                          {preset.hrs}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Impact Cards */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סשן בודד</span>
                <p className="text-xl font-black text-slate-800 tabular-nums">
                  {(sessionDurationInput / 60).toFixed(1)} <span className="text-xs font-bold text-slate-400">שעות</span>
                </p>
                <p className="text-[10px] text-slate-500 font-medium">זמן מים מצטבר לגולש</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">שלב 1 (12 סשנים)</span>
                <p className="text-xl font-black text-sky-600 tabular-nums">
                  {((12 * sessionDurationInput) / 60).toFixed(1)} <span className="text-xs font-bold text-sky-400">שעות</span>
                </p>
                <p className="text-[10px] text-slate-500 font-medium">מעבר מקצף לגלים</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">שלב 3 (50 סשנים)</span>
                <p className="text-xl font-black text-indigo-600 tabular-nums">
                  {((50 * sessionDurationInput) / 60).toFixed(1)} <span className="text-xs font-bold text-indigo-400">שעות</span>
                </p>
                <p className="text-[10px] text-slate-500 font-medium">רמת ניווט ושליטה</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">100 סשנים קבוצתיים</span>
                <p className="text-xl font-black text-emerald-600 tabular-nums">
                  {Math.round((100 * sessionDurationInput) / 60)} <span className="text-xs font-bold text-emerald-400">שעות</span>
                </p>
                <p className="text-[10px] text-slate-500 font-medium">צבירת ים קהילתית</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400 font-medium">
              {sessionDurationInput !== (siteConfig.sessionDurationMinutes || 90) ? (
                <span className="text-amber-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  ישנם שינויים שלא נשמרו (מ-{siteConfig.sessionDurationMinutes || 90} ל-{sessionDurationInput} דק')
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  ההגדרה שמורה ומסונכרנת
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isSavingSessionDuration || sessionDurationInput === (siteConfig.sessionDurationMinutes || 90)}
              onClick={async () => {
                if (!isAppShaper && !isAdmin && currentUser?.role !== 'Instructor') {
                  setShowReadOnlyNotice(true);
                  return;
                }

                setIsSavingSessionDuration(true);
                try {
                  await updateSiteConfig({ sessionDurationMinutes: sessionDurationInput });
                  showSuccess(`אורך הסשן עודכן בהצלחה ל-${sessionDurationInput} דקות (${(sessionDurationInput / 60).toFixed(1)} שעות)`);
                } catch (err) {
                  console.error('Failed to update session duration:', err);
                  showError('שגיאה בעדכון אורך הסשן');
                } finally {
                  setIsSavingSessionDuration(false);
                }
              }}
              className={`py-3.5 px-8 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-lg ${
                sessionDurationInput !== (siteConfig.sessionDurationMinutes || 90)
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white shadow-sky-500/25 active:scale-95 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSavingSessionDuration ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save size={16} />
                  שמור אורך סשן
                </>
              )}
            </button>
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
                            if (!checkAppShaper()) return;
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
                        onClick={() => {
                          if (!checkAppShaper()) return;
                          const newSessions = weeklySessions.filter((_, i) => i !== index);
                          setWeeklySessions(newSessions);
                        }}
                        className="w-11 h-11 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm border border-rose-100 group-hover/item:scale-105 cursor-pointer"
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
                  if (!checkAppShaper()) return;
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
                className="w-full py-5 bg-sky-500 text-white rounded-2xl font-black text-base shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
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
              if (!checkAppShaper()) return;
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
            className="px-16 py-5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 backdrop-blur-sm border border-white/20 transition-all duration-300 disabled:opacity-50 flex items-center gap-4 active:scale-95 cursor-pointer"
          >
            {isSavingSessions ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            שמור את כל השינויים
          </button>
        </div>
      </div>

      {/* Documentation Guides */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => setMarkdownConfig({ isOpen: true, path: '/README.md', title: 'מדריך למשתמש (User Guide)' })}
          className="w-full luxury-card p-8 group hover:scale-[1.01] transition-all text-right flex items-center gap-6 relative overflow-hidden cursor-pointer"
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
          className="w-full luxury-card p-8 group hover:scale-[1.01] transition-all text-right flex items-center gap-6 relative overflow-hidden cursor-pointer"
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

      {/* Data Maintenance */}
      <section>
        <h3 className="text-xl font-black text-slate-800 mb-4">תחזוקת נתונים (Data Maintenance)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="luxury-card p-8 flex flex-col justify-between border-l-4 border-rose-500">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                  <Users size={24} />
                </div>
                <h4 className="text-lg font-black text-slate-800">ניקוי משתמשים כפולים</h4>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                סריקת כל המשתמשים במערכת ומחיקת כפילויות לפי כתובת אימייל. המערכת תשמור את המשתמש עם כמות ההתחברויות והנוכחות הגבוהה ביותר, ותמחק את השאר.
              </p>
            </div>
            <button
              onClick={handleCleanupDuplicates}
              disabled={isCleaningDuplicates}
              className="w-full py-4 bg-rose-500 text-white rounded-xl font-black text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCleaningDuplicates ? <Loader2 className="animate-spin" size={20} /> : <ShieldAlert size={20} />}
              {isCleaningDuplicates ? 'מנקה כפילויות...' : 'הפעל ניקוי כפילויות'}
            </button>
          </div>
        </div>
      </section>

      {/* Conflicting Admins Alert */}
      {conflictingAdmins.length > 1 && (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-8">
              <div className="p-5 bg-rose-100 text-rose-600 rounded-2xl shadow-sm border border-rose-200">
                <ShieldAlert size={40} className="animate-siren" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-700 text-[10px] font-black rounded uppercase tracking-tighter">Critical</span>
                  <h4 className="text-2xl font-black text-rose-800">התנגשויות אימייל (Super Admin)</h4>
                </div>
                <p className="text-base text-rose-700 font-bold opacity-80">נמצאו כפילויות של אימייל רכז המערכת. יש להשאיר רק חשבון אחד עם האימייל הראשי.</p>
              </div>
            </div>
                
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conflictingAdmins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 shadow-sm group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
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
                          className="p-2.5 bg-[var(--surfer-vibrant-cyan)] text-white rounded-xl hover:shadow-lg transition-all cursor-pointer"
                          title="שמור"
                        >
                          <Check size={20} />
                        </button>
                        <button 
                          onClick={() => setEditingConflictId(null)}
                          className="p-2.5 bg-rose-100 text-rose-500 rounded-xl hover:bg-rose-200 transition-all cursor-pointer"
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
                        className="px-5 py-2.5 bg-[var(--surfer-vibrant-cyan)]/10 text-[var(--surfer-vibrant-cyan)] border border-[var(--surfer-vibrant-cyan)]/20 rounded-xl text-sm font-black hover:bg-[var(--surfer-vibrant-cyan)] hover:text-white transition-all shadow-sm cursor-pointer"
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
                    onClick={(e) => {
                      try {
                        (e.currentTarget as any).showPicker?.();
                      } catch(err) {}
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-sky-500/20 focus:bg-white transition-all cursor-pointer text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pr-1">תאריך סיום חדש</label>
                  <input 
                    type="date" 
                    value={yearForm.endDate}
                    onChange={e => setYearForm(prev => ({ ...prev, endDate: e.target.value }))}
                    onClick={(e) => {
                      try {
                        (e.currentTarget as any).showPicker?.();
                      } catch(err) {}
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-sky-500/20 focus:bg-white transition-all cursor-pointer text-slate-700"
                  />
                </div>
              </div>

              {/* Activity Mode in Modal */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pr-1">מצב פעילות שנתי</label>
                <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setYearForm(prev => ({ ...prev, activityMode: 'קבוצתית' }))}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      yearForm.activityMode === 'קבוצתית'
                        ? 'bg-white text-blue-700 shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <Users size={15} />
                    <span>פעילות קבוצתית</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setYearForm(prev => ({ ...prev, activityMode: 'משותפת' }))}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      yearForm.activityMode !== 'קבוצתית'
                        ? 'bg-white text-emerald-700 shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <Activity size={15} />
                    <span>פעילות משותפת</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={async () => {
                    if (!checkAppShaper()) return;
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
                  className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-base shadow-sm hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingYear ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  אני מבין את ההשלכות - שמור שינויים
                </button>
                <button 
                  onClick={() => setIsEditingYear(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-base hover:bg-slate-200 transition-all cursor-pointer"
                >
                  ביטול וחזרה
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Markdown Guide Modal */}
      <MarkdownViewer 
        isOpen={markdownConfig.isOpen}
        onClose={() => setMarkdownConfig(prev => ({ ...prev, isOpen: false }))}
        filePath={markdownConfig.path}
        title={markdownConfig.title}
      />

      {/* Read Only Notice Modal */}
      <ReadOnlyNoticeModal 
        isOpen={showReadOnlyNotice}
        onClose={() => setShowReadOnlyNotice(false)}
      />
    </div>
  );
};

export default SystemSettingsPage;
