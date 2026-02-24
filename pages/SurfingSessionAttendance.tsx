
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

interface User {
  id: string;
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
  const { finalizeThursdaySession, members: globalMembers, isLoading: globalLoading } = useData();
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [editingHistorySession, setEditingHistorySession] = useState<SessionHistory | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showManualDatePicker, setShowManualDatePicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    if (editingHistorySession) {
      const originalIds = new Set(editingHistorySession.participantIds || []);
      const currentIds = confirmedIds;
      
      const isDifferent = originalIds.size !== currentIds.size || 
        Array.from(originalIds).some(id => !currentIds.has(id));
      
      setHasUnsavedChanges(isDifferent);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [confirmedIds, editingHistorySession]);

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

  const generateThursdays = () => {
    const dates = [];
    const start = new Date('2026-01-01');
    const today = new Date();
    let current = new Date(start);
    
    while (current.getDay() !== 4) {
      current.setDate(current.getDate() + 1);
    }

    while (current <= today) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return dates.reverse();
  };

  const thursdays = generateThursdays();

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
    const historyQuery = query(collection(db, 'weekly_history'), orderBy('date', 'desc'), limit(20));
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
  useEffect(() => {
    // Only sync with active_session if we are in 'current' view AND NOT editing a historical session
    if (view !== 'current' || editingHistorySession !== null) {
      return;
    }

    const db = getDb();
    const sessionRef = doc(db, 'site_data', 'active_session');
    
    const unsubSession = onSnapshot(sessionRef, (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = snapshot.data();
      const attendees = data?.attendees;
      if (Array.isArray(attendees)) {
        setConfirmedIds(new Set(attendees));
      } else {
        setConfirmedIds(new Set());
      }
    }, (error) => {
      console.error("Active session sync error:", error);
    });

    return () => unsubSession();
  }, [view, editingHistorySession]);

  const toggleUser = async (userId: string) => {
    if (editingHistorySession) {
      const newConfirmed = new Set(confirmedIds);
      if (newConfirmed.has(userId)) {
        newConfirmed.delete(userId);
      } else {
        newConfirmed.add(userId);
      }
      setConfirmedIds(newConfirmed);
      return;
    }

    const db = getDb();
    const sessionRef = doc(db, 'site_data', 'active_session');
    const isSelected = confirmedIds.has(userId);

    try {
      await updateDoc(sessionRef, {
        attendees: isSelected ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error("Error toggling user attendance:", error);
      alert('שגיאה בעדכון הנוכחות');
    }
  };

  const handleFinalConfirm = async () => {
    if (confirmedIds.size === 0) {
      alert('נא לבחור לפחות משתתף אחד');
      return;
    }

    setIsSaving(true);
    try {
      const db = getDb();

      if (editingHistorySession) {
        if (!window.confirm("שינוי רשימת המשתתפים בסשן היסטורי ישפיע באופן ישיר על הגרפים והסטטיסטיקות השבועיות. האם אתה בטוח שברצונך לעדכן את הרישום?")) {
          setIsSaving(false);
          return;
        }
        
        const batch = writeBatch(db);
        const newParticipants = Array.from(confirmedIds);
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
        alert('נשמר בהצלחה');
        setEditingHistorySession(null);
        setConfirmedIds(new Set());
        navigate('/admin/stats');
      } else {
        // Current session finalize
        if (!window.confirm(`האם לאשר סופית נוכחות של ${confirmedIds.size} גולשים?`)) {
          setIsSaving(false);
          return;
        }
        await finalizeThursdaySession();
        alert('נשמר בהצלחה');
        setConfirmedIds(new Set());
        navigate('/admin/stats');
      }
    } catch (error: any) {
      console.error("Error saving session:", error);
      alert('שגיאה בשמירת הנתונים: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setIsSaving(false);
    }
  };

  const loadHistorySession = (session: SessionHistory) => {
    setEditingHistorySession(session);
    setConfirmedIds(new Set(session.participantIds));
    setView('current');
    setShowHistoryDropdown(false);
  };

  const handleSelectHistoryDate = (date: Date) => {
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
    if (!window.confirm("האם לייצר היסטוריית סשנים אוטומטית מתחילת 2026?")) return;
    
    setIsSaving(true);
    try {
      const db = getDb();
      const startDate = new Date('2026-01-01');
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
      alert('היסטוריה יוצרה בהצלחה');
    } catch (error) {
      console.error("Error seeding history:", error);
      alert('שגיאה בייצור היסטוריה');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : (date.toDate ? date.toDate() : new Date(date));
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredUsers = globalMembers.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (globalLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#006994]" size={40} />
        <p className="text-[#006994] font-black animate-pulse">טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto font-['Assistant']" dir="rtl">
      {/* Header Section - Now at the very top */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#006994] text-[#00FFFF] text-[10px] font-black rounded-full mb-4 shadow-lg shadow-[#006994]/20">
            <UsersIcon size={12} /> 
            {view === 'history' && !editingHistorySession ? 'ארכיון סשנים' : (editingHistorySession ? 'עריכת סשן היסטורי' : 'סנכרון נוכחות שבועי')}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#006994] tracking-tighter">
            {view === 'history' && !editingHistorySession ? 'ארכיון סשנים: יום חמישי הגדול' : 
             (editingHistorySession ? `עריכה: ${formatDate(editingHistorySession.date)}` : 'ארכיון סשנים: יום חמישי הגדול')}
          </h2>
          <p className="text-[#4E8294] font-bold mt-2">
            {view === 'history' && !editingHistorySession ? 'היסטוריית גלישה ונוכחות לאורך זמן 🌊' : 'סמן את כל הגולשים שיצאו מהמים 🌊'}
          </p>
          
          {editingHistorySession && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 animate-pulse">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-bold leading-relaxed">
                שינוי רשימת המשתתפים בסשן היסטורי ישפיע באופן ישיר על הגרפים והסטטיסטיקות השבועיות.
              </p>
            </div>
          )}
        </div>

        {(view === 'current' || editingHistorySession) && (
          <div className="flex items-center gap-4">
            {editingHistorySession && (
              <button 
                onClick={() => { setView('history'); setEditingHistorySession(null); }}
                className="px-6 py-4 bg-slate-100 text-[#4E8294] rounded-2xl font-black text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <ArrowRight size={18} /> ביטול
              </button>
            )}
            
            <button 
              onClick={handleFinalConfirm}
              disabled={isSaving || confirmedIds.size === 0}
              className="px-8 py-4 bg-[#006994] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#006994]/20 hover:bg-[#60DD8E] hover:text-[#006994] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group min-w-[160px] justify-center"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
              {editingHistorySession ? 'עדכון סשן' : 'שמירה'}
            </button>
          </div>
        )}
      </div>

      {/* View Toggle & History Dropdown */}
      <div className="flex justify-center mb-12 relative">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-[#006994]/10 flex gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowManualDatePicker(!showManualDatePicker)}
              className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${view === 'current' && !editingHistorySession ? 'bg-[#006994] text-white shadow-lg' : 'text-[#4E8294] hover:bg-slate-50'}`}
            >
              <CalendarIcon size={16} />
              צור סשן ידנית
            </button>

            <AnimatePresence>
              {showManualDatePicker && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowManualDatePicker(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-[100]"
                  >
                    <p className="text-[10px] font-black text-[#4E8294] uppercase tracking-widest mb-4">בחר תאריך לסשן (כולל 2025)</p>
                    <input 
                      type="date" 
                      min="2025-01-01"
                      max="2026-12-31"
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-[#006994] outline-none focus:ring-2 ring-[#00FFFF]/30 mb-4"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSelectHistoryDate(new Date(e.target.value));
                        }
                      }}
                    />
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold italic">
                      <AlertTriangle size={12} />
                      <span>בחירת תאריך תפתח סשן חדש או תטען קיים</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${view === 'history' || editingHistorySession ? 'bg-[#006994] text-white shadow-lg' : 'text-[#4E8294] hover:bg-slate-50'}`}
            >
              <History size={16} />
              היסטוריית סשנים
              <ChevronRight size={16} className={`transition-transform ${showHistoryDropdown ? 'rotate-90' : '-rotate-90'}`} />
            </button>

            <AnimatePresence>
              {showHistoryDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-[90]" 
                    onClick={() => setShowHistoryDropdown(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] max-h-80 overflow-y-auto"
                  >
                    <div className="px-4 py-2 border-bottom border-slate-50 mb-2">
                      <p className="text-[10px] font-black text-[#4E8294] uppercase tracking-widest">בחר תאריך (ימי חמישי וסשנים קיימים)</p>
                    </div>
                    {dropdownDates.map((date, idx) => {
                      const isExisting = history.some(s => {
                        const sDate = s.date instanceof Timestamp ? s.date.toDate() : new Date(s.date);
                        return sDate.toDateString() === date.toDateString();
                      });

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectHistoryDate(date)}
                          className="w-full px-4 py-3 text-right hover:bg-[#00FFFF]/10 transition-colors flex items-center justify-between group"
                        >
                          <span className="font-bold text-[#006994]">{formatDate(date)}</span>
                          {isExisting ? (
                            <span className="text-[8px] font-black bg-[#00FFFF] text-[#006994] px-2 py-0.5 rounded-full uppercase">קיים</span>
                          ) : (
                            <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase">חדש</span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {view === 'current' ? (
        <>
          {/* Dynamic Section Title & Stats */}
          <div className="flex items-center justify-between gap-4 mb-10 bg-white/40 p-6 rounded-[2.5rem] border border-[#006994]/5">
            {/* Header Text */}
            <div className="text-right">
              <h3 className="text-xl md:text-2xl font-black text-[#006994] tracking-tight">
                {editingHistorySession 
                  ? `רשימת משתתפים בסשן ההיסטורי ${formatDate(editingHistorySession.date)}` 
                  : 'רשימת משתתפים בסשן הקרוב (מתעדכן)'}
              </h3>
              <div className="w-16 h-1 bg-[#00FFFF] mt-1 rounded-full shadow-sm"></div>
            </div>

            {/* Stats Widget */}
            <div className="bg-white px-4 py-2 md:px-6 md:py-3 rounded-2xl border border-[#006994]/10 shadow-sm flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#00FFFF]/10 rounded-full flex items-center justify-center text-[#006994]">
                <UsersIcon size={18} />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-[#4E8294] uppercase tracking-widest leading-none mb-1">סה"כ נוכחים</p>
                <p className="text-lg md:text-xl font-black text-[#006994] leading-none">{confirmedIds.size}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-10 group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[#006994]/40 group-focus-within:text-[#006994] transition-colors" />
            <input 
              type="text" 
              placeholder="חפש גולש ברשימה..." 
              className="w-full pr-16 pl-6 py-6 bg-white rounded-[2.5rem] border border-[#006994]/10 font-black focus:ring-4 ring-[#00FFFF]/20 shadow-sm outline-none transition-all text-lg"
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
                    className={`relative cursor-pointer group rounded-[2.5rem] p-4 transition-all duration-500 flex flex-col items-center border ${
                      isSelected 
                        ? 'bg-[#60DD8E]/5 shadow-2xl shadow-[#006994]/5 border-[#60DD8E]/40' 
                        : 'bg-white/40 border-transparent hover:bg-white hover:shadow-xl hover:border-[#006994]/5'
                    }`}
                  >
                    <div className="relative mb-4">
                      <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border transition-all duration-500 ${
                        isSelected ? 'border-[#60DD8E] scale-105 shadow-lg shadow-[#60DD8E]/10' : 'border-white grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'
                      }`}>
                        <img 
                          src={user.photoURL || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=006994&color=fff`} 
                          className="w-full h-full object-cover" 
                          alt={user.name}
                        />
                        
                        {/* Selection Overlay */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'bg-[#006994]/5 opacity-100' : 'bg-black/5 opacity-0 group-hover:opacity-100'}`}>
                        </div>
                      </div>
                      
                      {/* Selection Checkmark - Top Right */}
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border border-white shadow-md z-10 transition-all duration-500 ${
                        isSelected ? 'bg-[#60DD8E] text-[#006994] scale-110 rotate-0' : 'bg-white text-slate-200 scale-0 rotate-45'
                      }`}>
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      </div>

                      {/* Role Badge */}
                      {user.role && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full shadow-sm border transition-all ${
                          isSelected ? 'bg-[#006994] text-white border-[#006994]' : 'bg-white text-[#4E8294] border-slate-100'
                        }`}>
                          <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">
                            {user.role === 'Admin' ? 'מנהל' : user.role === 'Instructor' ? 'מדריך' : 'חבר'}
                          </span>
                        </div>
                      )}
                    </div>

                    <span className={`text-sm font-black text-center transition-colors mt-1 ${
                      isSelected ? 'text-[#006994]' : 'text-[#4E8294]'
                    }`}>
                      {user.name}
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
            {history.map((session, idx) => (
              <motion.div 
                key={session.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => loadHistorySession(session)}
                className="relative group cursor-pointer"
              >
                {/* Timeline Dot */}
                <div className="absolute -right-[2.15rem] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-4 border-[#006994] z-10 group-hover:scale-150 transition-transform"></div>
                
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#006994]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-[#4E8294] uppercase tracking-widest mb-1">תאריך הסשן</p>
                      <h3 className="text-3xl font-black text-[#006994] tracking-tighter">{formatDate(session.date)}</h3>
                    </div>
                    
                    <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
                    
                    <div>
                      <p className="text-[10px] font-black text-[#4E8294] uppercase tracking-widest mb-1">מדריך</p>
                      <div className="flex items-center gap-2 text-[#006994] font-black">
                        <UserIcon size={16} />
                        <span>{session.instructorName || 'מדריך חבל זוג'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8">
                    <div className="flex -space-x-3 space-x-reverse">
                      {session.participantIds.slice(0, 3).map((uid, i) => {
                        const user = globalMembers.find(u => u.id === uid);
                        return (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm">
                            <img 
                              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'G')}&background=006994&color=fff`} 
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          </div>
                        );
                      })}
                      {session.participantsCount > 3 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-[#00FFFF] flex items-center justify-center text-[#006994] text-[10px] font-black shadow-sm">
                          +{session.participantsCount - 3}
                        </div>
                      )}
                    </div>

                    <div className="text-left">
                      <p className="text-[10px] font-black text-[#4E8294] uppercase tracking-widest mb-1">משתתפים</p>
                      <p className="text-2xl font-black text-[#006994]">{session.participantsCount}</p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#006994] group-hover:bg-[#00FFFF] group-hover:text-[#006994] transition-colors">
                      <ChevronRight size={24} className="rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

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
  );
};

export default SurfingSessionAttendance;
