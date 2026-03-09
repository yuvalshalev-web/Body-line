
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb } from '../services/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  limit,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { Users as UsersIcon, Check, Save, Search, Loader2, ChevronRight, History, Calendar as CalendarIcon, User as UserIcon, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  photoURL?: string;
  avatar?: string;
  role?: string;
}

interface SessionHistory {
  id: string;
  date: any;
  participantsCount: number;
  participantIds: string[];
  instructorName?: string;
  createdAt?: string;
}

const SurfingSessionAttendance: React.FC = () => {
  const navigate = useNavigate();
  const { finalizeThursdaySession, members: globalMembers, isLoading: globalLoading, yearConfig, attendeeIds, toggleSessionAttendance, activeSessionDate } = useData();
  const { showAlert, showConfirm, showSuccess, showError } = useModal();
  const [localConfirmedIds, setLocalConfirmedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'current' | 'history'>('history');
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [editingHistorySession, setEditingHistorySession] = useState<SessionHistory | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showManualDatePicker, setShowManualDatePicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const confirmedIds = editingHistorySession ? localConfirmedIds : new Set(attendeeIds);

  // Track unsaved changes
  useEffect(() => {
    if (editingHistorySession) {
      const originalIds = new Set(editingHistorySession.participantIds || []);
      const currentIds = localConfirmedIds;
      
      const isDifferent = originalIds.size !== currentIds.size || 
        Array.from(originalIds).some(id => !currentIds.has(id));
      
      setHasUnsavedChanges(isDifferent);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [localConfirmedIds, editingHistorySession]);

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const thursdays = useMemo(() => {
    const dates = [];
    const startStr = yearConfig?.startDate || '2026-01-01';
    const start = new Date(startStr);
    const today = new Date();
    let current = new Date(start);
    
    // Find first Thursday on or after start date
    while (current.getDay() !== 4) {
      current.setDate(current.getDate() + 1);
    }

    while (current <= today) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return dates.reverse();
  }, [yearConfig]);

  const dropdownDates = useMemo(() => {
    const historyDates = history.map(s => {
      const d = s.date instanceof Timestamp ? s.date.toDate() : new Date(s.date);
      return d;
    });
    
    const allDates = [...historyDates];
    thursdays.forEach(t => {
      if (!allDates.some(ad => ad.toDateString() === t.toDateString())) {
        allDates.push(t);
      }
    });
    
    return allDates.sort((a, b) => b.getTime() - a.getTime());
  }, [history, thursdays]);

  useEffect(() => {
    const db = getDb();
    
    // 1. Fetch History
    const historyQuery = query(collection(db, 'weekly_history'), orderBy('date', 'desc'), limit(200));
    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
      const historyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SessionHistory));
      setHistory(historyList);
    });

    return () => {
      unsubHistory();
    };
  }, []);

  // 3. Separate effect for active session sync to prevent race conditions
  // (Removed: active_session sync is now handled by DataContext)

  const toggleUser = async (userId: string) => {
    if (editingHistorySession) {
      const newConfirmed = new Set(localConfirmedIds);
      if (newConfirmed.has(userId)) {
        newConfirmed.delete(userId);
      } else {
        newConfirmed.add(userId);
      }
      setLocalConfirmedIds(newConfirmed);
      return;
    }

    try {
      await toggleSessionAttendance(userId);
    } catch (error) {
      console.error("Error toggling user attendance:", error);
      showError('שגיאה בעדכון הנוכחות');
    }
  };

  const handleFinalConfirm = async () => {
    if (confirmedIds.size === 0 && !editingHistorySession) {
      showAlert('נא לבחור לפחות משתתף אחד');
      return;
    }

    const performSave = async () => {
      setIsSaving(true);
      try {
        const db = getDb();
        if (editingHistorySession) {
          const batch = writeBatch(db);
          const newParticipants = Array.from(localConfirmedIds);
          const oldParticipants = editingHistorySession.participantIds || [];
          
          const membersRef = collection(db, 'members');
          const historyRef = collection(db, 'weekly_history');

          // Find added and removed members to sync totalAttendance
          const added = newParticipants.filter(id => !oldParticipants.includes(id));
          const removed = oldParticipants.filter(id => !newParticipants.includes(id));
          
          added.forEach((uid: string) => {
            batch.update(doc(membersRef, uid), { totalAttendance: increment(1) });
          });
          removed.forEach((uid: string) => {
            batch.update(doc(membersRef, uid), { totalAttendance: increment(-1) });
          });

          // Robust date handling for Firestore Timestamp
          let finalDate;
          try {
            if (editingHistorySession.date && typeof editingHistorySession.date.toDate === 'function') {
              finalDate = editingHistorySession.date;
            } else if (editingHistorySession.date instanceof Date) {
              finalDate = Timestamp.fromDate(editingHistorySession.date);
            } else if (editingHistorySession.date && editingHistorySession.date.seconds) {
              finalDate = new Timestamp(editingHistorySession.date.seconds, editingHistorySession.date.nanoseconds || 0);
            } else {
              finalDate = Timestamp.fromDate(new Date(editingHistorySession.date));
            }
          } catch (e) {
            finalDate = Timestamp.now();
          }

          const sessionData = {
            participantIds: newParticipants,
            participantsCount: newParticipants.length,
            updatedAt: serverTimestamp(),
            date: finalDate,
            instructorName: editingHistorySession.instructorName || 'מדריך חבל זוג'
          };

          if (editingHistorySession.id) {
            batch.update(doc(historyRef, editingHistorySession.id), sessionData);
          } else {
            const newDocRef = doc(historyRef);
            batch.set(newDocRef, {
              ...sessionData,
              createdAt: serverTimestamp()
            });
          }
          
          await batch.commit();
          showSuccess('נשמר בהצלחה');
          setEditingHistorySession(null);
          setLocalConfirmedIds(new Set());
          navigate('/admin');
        } else {
          // Current session finalize
          await finalizeThursdaySession();
          showSuccess('נשמר בהצלחה');
          setLocalConfirmedIds(new Set());
          navigate('/admin');
        }
      } catch (error: any) {
        console.error("Error saving session:", error);
        showError('שגיאה בשמירת הנתונים: ' + (error.message || 'שגיאה לא ידועה'));
      } finally {
        setIsSaving(false);
      }
    };

    if (confirmedIds.size === 0 && editingHistorySession) {
      showConfirm({
        title: 'ביטול סשן',
        message: 'מספר המשתתפים אופס.\nהמשך הפעולה יבטל את הסשן.',
        confirmText: 'בטל סשן',
        cancelText: 'חזרה',
        onConfirm: performSave
      });
      return;
    }

    if (editingHistorySession) {
      showConfirm({
        message: "שינוי רשימת המשתתפים בסשן היסטורי ישפיע באופן ישיר על הגרפים והסטטיסטיקות השבועיות. האם אתה בטוח שברצונך לעדכן את הרישום?",
        onConfirm: performSave
      });
    } else {
      showConfirm({
        message: `האם לאשר סופית נוכחות של ${confirmedIds.size} גולשים?`,
        onConfirm: performSave
      });
    }
  };

  const timelineSessions = useMemo(() => {
    // The active session date from DataContext
    const activeDate = activeSessionDate ? new Date(activeSessionDate) : new Date();
    if (!activeSessionDate) {
      while (activeDate.getDay() !== 4) {
        activeDate.setDate(activeDate.getDate() + 1);
      }
      activeDate.setHours(7, 0, 0, 0);
    }

    // We will build the list starting with the virtual "Upcoming" session
    const upcomingSession = {
      id: 'upcoming',
      date: Timestamp.fromDate(activeDate),
      participantsCount: attendeeIds ? attendeeIds.length : 0,
      participantIds: attendeeIds || [],
      instructorName: 'מדריך חבל זוג',
      isUpcoming: true
    };

    // Filter out any history item that has the EXACT SAME date as the active session
    // so we don't show duplicates. The active session takes precedence.
    const filteredHistory = history.filter(s => {
      const d = s.date instanceof Timestamp ? s.date.toDate() : new Date(s.date);
      return d.toDateString() !== activeDate.toDateString();
    });

    const list = [upcomingSession, ...filteredHistory];

    return list.sort((a, b) => {
      const da = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
      const db = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
      return db.getTime() - da.getTime();
    });
  }, [history, attendeeIds, activeSessionDate]);

  const loadHistorySession = (session: SessionHistory) => {
    // If it's the virtual upcoming session, treat it as the current active session
    if (session.id === 'upcoming') {
      setEditingHistorySession(null);
      setLocalConfirmedIds(new Set(attendeeIds || []));
    } else {
      setEditingHistorySession(session);
      setLocalConfirmedIds(new Set(session.participantIds));
    }
    setView('current');
    setShowHistoryDropdown(false);
  };

  const handleSelectHistoryDate = (date: Date) => {
    const activeDate = activeSessionDate ? new Date(activeSessionDate) : new Date();
    if (!activeSessionDate) {
      while (activeDate.getDay() !== 4) {
        activeDate.setDate(activeDate.getDate() + 1);
      }
      activeDate.setHours(7, 0, 0, 0);
    }

    if (date.toDateString() === activeDate.toDateString()) {
      loadHistorySession({
        id: 'upcoming',
        date: Timestamp.fromDate(activeDate),
        participantsCount: attendeeIds ? attendeeIds.length : 0,
        participantIds: attendeeIds || [],
        instructorName: 'מדריך חבל זוג',
        isUpcoming: true
      } as any);
      setShowManualDatePicker(false);
      return;
    }

    const existingSession = history.find(s => {
      const sDate = s.date instanceof Timestamp ? s.date.toDate() : new Date(s.date);
      return sDate.toDateString() === date.toDateString();
    });

    if (existingSession) {
      loadHistorySession(existingSession);
    } else {
      // Create a new historical session object
      const newSession: SessionHistory = {
        id: '', // No ID means it's new
        date: Timestamp.fromDate(date),
        participantsCount: 0,
        participantIds: [],
        instructorName: 'מדריך חבל זוג'
      };
      loadHistorySession(newSession);
    }
    setShowManualDatePicker(false);
  };

  const seedHistory = async () => {
    const startStr = yearConfig?.startDate || '2026-01-01';
    showConfirm({
      message: `האם לייצר היסטוריית סשנים אוטומטית מתאריך ${startStr}?`,
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const db = getDb();
          const startDate = new Date(startStr);
          const today = new Date();
          let current = new Date(startDate);
          
          // Find first Thursday
          while (current.getDay() !== 4) {
            current.setDate(current.getDate() + 1);
          }

          const batch = [];
          while (current <= today) {
            const participantsCount = Math.floor(Math.random() * 15) + 5;
            const randomParticipants = globalMembers
              .sort(() => 0.5 - Math.random())
              .slice(0, participantsCount)
              .map(u => u.id);

            batch.push(addDoc(collection(db, 'weekly_history'), {
              date: Timestamp.fromDate(new Date(current)),
              participantsCount,
              participantIds: randomParticipants,
              instructorName: 'מדריך חבל זוג',
              createdAt: new Date().toISOString()
            }));
            
            current.setDate(current.getDate() + 7);
          }

          await Promise.all(batch);
          showSuccess('היסטוריה יוצרה בהצלחה');
        } catch (error) {
          console.error("Error seeding history:", error);
          showError('שגיאה בייצור היסטוריה');
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : (date.toDate ? date.toDate() : new Date(date));
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredUsers = useMemo(() => globalMembers.filter(u => 
    (u.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.lastName || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const aLast = a.lastName || '';
    const bLast = b.lastName || '';
    const aFirst = a.firstName || '';
    const bFirst = b.firstName || '';
    if (aLast || bLast) {
      const lastCompare = aLast.localeCompare(bLast, 'he');
      if (lastCompare !== 0) return lastCompare;
      return aFirst.localeCompare(bFirst, 'he');
    }
    return (a.firstName + ' ' + a.lastName).localeCompare((b.firstName + ' ' + b.lastName), 'he');
  }), [globalMembers, searchTerm]);

  if (globalLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#006994]" size={40} />
        <p className="text-[#006994] font-black animate-pulse">טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto font-['Yehuda_CLM']" dir="rtl">
      <div className="mt-20">
        {/* Title and Cancel Button */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="surfboard-hero-container">
            <h1 className="main-page-title">
          <span className="surfer-title">יומן סשנים</span>
        </h1>
            <p className="text-[#4E8294] font-bold mt-2">
              {view === 'history' ? 'היסטוריית גלישה ונוכחות לאורך זמן 🌊' : 'סמן את כל הגולשים שיצאו מהמים 🌊'}
            </p>
          </div>
        </div>

        {/* Sticky Top Bar for Editing Historical Sessions */}
        {editingHistorySession && (
          <div className="sticky top-24 z-50 mb-8 bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] p-6 flex flex-col gap-4 shadow-xl" style={{ textAlign: 'right' }}>
            <div className="flex items-start gap-3 t-mobile-text-strong">
              <AlertTriangle className="shrink-0 mt-1" size={24} />
              <div>
                <p className="text-lg font-black leading-tight">
                  אתה נמצא במצב עריכה
                </p>
                <p className="text-sm font-bold opacity-80 leading-[1.5] mt-1">
                  שינוי רשימת המשתתפים בסשן היסטורי ישפיע באופן ישיר על הגרפים והסטטיסטיקות השבועיות.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-2 border-t border-[rgba(255,255,255,0.1)]">
              <button 
                onClick={() => { setView('history'); setEditingHistorySession(null); }}
                className="flex-1 px-4 py-3 bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] rounded-[16px] font-black text-sm transition-all text-[#006994]"
              >
                ביטול
              </button>
              <button 
                onClick={handleFinalConfirm}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex-1 px-6 py-3 bg-[#00FFFF] text-[#006994] rounded-[16px] font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                שמור שינויים
              </button>
            </div>
          </div>
        )}

      {view === 'current' ? (
        <>
          {/* Dynamic Section Title & Stats */}
          <div className="flex items-center justify-between gap-4 mb-10 bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] p-6 rounded-[16px] border border-[rgba(255,255,255,0.2)]">
            {/* Header Text */}
            <div className="text-right">
              <h3 className="text-xl md:text-2xl font-black text-[#006994] tracking-tight">
                {editingHistorySession 
                  ? `רשימת משתתפים בסשן ההיסטורי ${formatDate(editingHistorySession.date)}` 
                  : 'נוכחות עדכנית לסשן הקרוב'}
              </h3>
              <div className="w-16 h-1 bg-[#00FFFF] mt-1 rounded-full shadow-sm"></div>
            </div>

            {/* Stats Widget */}
            <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] px-4 py-2 md:px-6 md:py-3 rounded-[16px] border border-[rgba(255,255,255,0.2)] shadow-sm flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-100 rounded-full flex items-center justify-center text-sky-800">
                <UsersIcon size={18} />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-sky-600 uppercase tracking-widest leading-none mb-1">סה"כ נוכחים</p>
                <p className="text-lg md:text-xl font-black text-sky-800 leading-none">{confirmedIds.size}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-10 group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-sky-800/40 group-focus-within:text-sky-800 transition-colors" />
            <input 
              type="text" 
              placeholder="חפש גולש ברשימה..." 
              className="w-full pr-16 pl-6 py-6 bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] rounded-[16px] border border-[rgba(255,255,255,0.2)] font-black focus:ring-4 ring-cyan-200/20 shadow-sm outline-none transition-all text-lg"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user) => {
                const isSelected = confirmedIds.has(user.id);
                return (
                  <motion.div
                    layout
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => toggleUser(user.id)}
                    className={`relative cursor-pointer group rounded-[16px] p-4 transition-all duration-500 flex flex-col items-center border backdrop-blur-[12px] ${
                      isSelected 
                        ? 'bg-teal-100 shadow-2xl shadow-sky-800/5 border-teal-300/40' 
                        : 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.2)] hover:shadow-xl'
                    }`}
                  >
                    <div className="relative mb-4">
                      <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border transition-all duration-500 ${
                        isSelected ? 'border-teal-300 scale-105 shadow-lg shadow-teal-300/10' : 'border-white grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'
                      }`}>
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=006994&color=fff`} 
                          className="w-full h-full object-cover" 
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                        
                        {/* Selection Overlay */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'bg-[#006994]/5 opacity-100' : 'bg-black/5 opacity-0 group-hover:opacity-100'}`}>
                        </div>
                      </div>
                      
                      {/* Selection Checkmark - Top Right */}
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border border-white shadow-md z-10 transition-all duration-500 ${
                        isSelected ? 'bg-teal-300 text-sky-800 scale-110 rotate-0' : 'bg-white text-slate-200 scale-0 rotate-45'
                      }`}>
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      </div>

                      {/* Role Badge */}
                      {user.role && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full shadow-sm border transition-all ${
                          isSelected ? 'bg-sky-800 text-white border-sky-800' : 'bg-white text-sky-600 border-slate-100'
                        }`}>
                          <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">
                            {user.role === 'Admin' ? 'רכז' : user.role === 'Instructor' ? 'מדריך' : 'חבר'}
                          </span>
                        </div>
                      )}
                    </div>

                    <span className={`text-sm font-black text-center transition-colors mt-1 ${
                      isSelected ? 'text-sky-800' : 'text-sky-600'
                    }`}>
                      {user.firstName} {user.lastName}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#006994] via-[#006994]/20 to-transparent"></div>
          
          <div className="space-y-8 pr-16">
            {timelineSessions
              .map((session, idx) => {
                const isUpcoming = (session as any).isUpcoming;
                const isGrayedOut = (session.participantsCount || 0) === 0 && !isUpcoming;
                return (
                  <motion.div 
                    key={session.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => loadHistorySession(session)}
                    className={`relative group cursor-pointer ${isGrayedOut ? 'grayscale opacity-60' : ''}`}
                  >
                    {/* Timeline Dot */}
                    <div className={`absolute -right-[2.15rem] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-4 z-10 group-hover:scale-150 transition-transform ${
                      isUpcoming ? 'border-emerald-500' : (isGrayedOut ? 'border-slate-400' : 'border-[#006994]')
                    }`}></div>
                    
                    <div className={`${
                      isUpcoming 
                        ? 'bg-emerald-50/40 border-emerald-200/60 shadow-emerald-100/20' 
                        : (isGrayedOut ? 'bg-slate-50/50 border-slate-200' : 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)]')
                    } backdrop-blur-[12px] p-8 rounded-[16px] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8`}>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                            isUpcoming ? 'text-emerald-600' : (isGrayedOut ? 'text-slate-400' : 'text-[#4E8294]')
                          }`}>
                            {isUpcoming ? 'סשן קרוב (יום חמישי)' : (isGrayedOut ? 'סשן בוטל / 0 משתתפים' : 'תאריך הסשן')}
                          </p>
                          <h3 className={`text-3xl font-black tracking-tighter ${
                            isUpcoming ? 'text-emerald-700' : (isGrayedOut ? 'text-slate-500' : 'text-[#006994]')
                          }`}>{formatDate(session.date)}</h3>
                        </div>
                        
                        <div className={`h-12 w-px hidden md:block ${
                          isUpcoming ? 'bg-emerald-200' : (isGrayedOut ? 'bg-slate-200' : 'bg-slate-100')
                        }`}></div>
                        
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                            isUpcoming ? 'text-emerald-600' : (isGrayedOut ? 'text-slate-400' : 'text-[#4E8294]')
                          }`}>מדריך</p>
                          <div className={`flex items-center gap-2 font-black ${
                            isUpcoming ? 'text-emerald-700' : (isGrayedOut ? 'text-slate-500' : 'text-[#006994]')
                          }`}>
                            <UserIcon size={16} />
                            <span>{session.instructorName || 'מדריך חבל זוג'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-8">
                        <div className="flex -space-x-3 space-x-reverse">
                          {session.participantIds.length > 0 ? (
                            session.participantIds.slice(0, 3).map((uid, i) => {
                              const user = globalMembers.find(u => u.id === uid);
                              return (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm">
                                  <img 
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.firstName || '') + ' ' + (user?.lastName || ''))}&background=006994&color=fff`} 
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                              isUpcoming ? 'bg-emerald-100 text-emerald-600' : (isGrayedOut ? 'bg-slate-100 text-slate-300' : 'bg-slate-100 text-slate-400')
                            }`}>
                              <UsersIcon size={16} />
                            </div>
                          )}
                          {session.participantsCount > 3 && (
                            <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm ${
                              isUpcoming ? 'bg-emerald-200 text-emerald-700' : 'bg-[#00FFFF] text-[#006994]'
                            }`}>
                              +{session.participantsCount - 3}
                            </div>
                          )}
                        </div>

                        <div className="text-left">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                            isUpcoming ? 'text-emerald-600' : (isGrayedOut ? 'text-slate-400' : 'text-[#4E8294]')
                          }`}>משתתפים</p>
                          <p className={`text-2xl font-black ${
                            isUpcoming ? 'text-emerald-700' : (isGrayedOut ? 'text-slate-500' : 'text-[#006994]')
                          }`}>{session.participantsCount}</p>
                        </div>

                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                          isUpcoming 
                            ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200' 
                            : (isGrayedOut ? 'bg-slate-100 text-slate-400 group-hover:bg-slate-200' : 'bg-slate-50 text-[#006994] group-hover:bg-[#00FFFF] group-hover:text-[#006994]')
                        }`}>
                          <ChevronRight size={24} className="rotate-180" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

            {history.length === 0 && (
              <div className="py-20 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-[#006994]/10">
                <History size={48} className="mx-auto mb-4 text-[#006994]/20" />
                <p className="text-[#4E8294] font-bold mb-6">אין היסטוריית סשנים זמינה</p>
                <button 
                  onClick={seedHistory}
                  className="px-6 py-3 bg-[#006994] text-white rounded-xl font-black text-xs hover:bg-[#00FFFF] hover:text-[#006994] transition-all"
                >
                  ייצר היסטוריה מתחילת 2026
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default SurfingSessionAttendance;
