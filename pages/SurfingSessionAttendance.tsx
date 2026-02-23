
import React, { useState, useEffect } from 'react';
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
  Timestamp
} from 'firebase/firestore';
import { Users as UsersIcon, Check, Save, Search, Loader2, ChevronRight, History, Calendar as CalendarIcon, User as UserIcon, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [users, setUsers] = useState<User[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [editingHistorySession, setEditingHistorySession] = useState<SessionHistory | null>(null);

  useEffect(() => {
    const db = getDb();
    
    // 1. Fetch all members
    const unsubUsers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersList);
      setIsLoading(false);
    });

    // 2. Real-time sync with 'Big Thursday' (active_session)
    const sessionRef = doc(db, 'site_data', 'active_session');
    const unsubSession = onSnapshot(sessionRef, (snapshot) => {
      if (view === 'current' && !editingHistorySession) {
        const data = snapshot.data();
        const attendees = data?.attendees;
        if (Array.isArray(attendees)) {
          setConfirmedIds(new Set(attendees));
        } else {
          setConfirmedIds(new Set());
        }
      }
    });

    // 3. Fetch History
    const historyQuery = query(collection(db, 'weekly_history'), orderBy('date', 'desc'), limit(20));
    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
      const historyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SessionHistory));
      setHistory(historyList);
    });

    return () => {
      unsubUsers();
      unsubSession();
      unsubHistory();
    };
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

    if (editingHistorySession) {
      if (!window.confirm("שינוי רשימת המשתתפים בסשן היסטורי ישפיע באופן ישיר על הגרפים והסטטיסטיקות השבועיות. האם אתה בטוח שברצונך לעדכן את הרישום?")) return;
      
      setIsSaving(true);
      try {
        const db = getDb();
        await updateDoc(doc(db, 'weekly_history', editingHistorySession.id), {
          participantIds: Array.from(confirmedIds),
          participantsCount: confirmedIds.size,
          updatedAt: serverTimestamp()
        });
        alert('הסשן ההיסטורי עודכן בהצלחה');
        setEditingHistorySession(null);
        setView('history');
      } catch (error) {
        console.error("Error updating history:", error);
        alert('שגיאה בעדכון הסשן');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!window.confirm(`האם לאשר סופית נוכחות של ${confirmedIds.size} גולשים?`)) return;

    setIsSaving(true);
    try {
      const db = getDb();
      await addDoc(collection(db, 'weekly_history'), {
        date: serverTimestamp(),
        participantsCount: confirmedIds.size,
        participantIds: Array.from(confirmedIds),
        createdAt: new Date().toISOString()
      });
      alert('הנוכחות נשמרה בהצלחה בארכיון השבועי');
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert('שגיאה בשמירת הנתונים');
    } finally {
      setIsSaving(false);
    }
  };

  const loadHistorySession = (session: SessionHistory) => {
    setEditingHistorySession(session);
    setConfirmedIds(new Set(session.participantIds));
    setView('current');
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
        const randomParticipants = users
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
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#006994]" size={40} />
        <p className="text-[#006994] font-black animate-pulse">טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto font-['Assistant']" dir="rtl">
      {/* View Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-[#006994]/10 flex gap-2">
          <button 
            onClick={() => { setView('current'); setEditingHistorySession(null); }}
            className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${view === 'current' && !editingHistorySession ? 'bg-[#006994] text-white shadow-lg' : 'text-[#4E8294] hover:bg-slate-50'}`}
          >
            הסשן הקרוב
          </button>
          <button 
            onClick={() => { setView('history'); setEditingHistorySession(null); }}
            className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${view === 'history' ? 'bg-[#006994] text-white shadow-lg' : 'text-[#4E8294] hover:bg-slate-50'}`}
          >
            היסטוריית סשנים
          </button>
        </div>
      </div>

      {view === 'current' ? (
        <>
          {/* Header Section */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#006994] text-[#00FFFF] text-[10px] font-black rounded-full mb-4 shadow-lg shadow-[#006994]/20">
                <UsersIcon size={12} /> {editingHistorySession ? 'עריכת סשן היסטורי' : 'סנכרון נוכחות שבועי'}
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#006994] tracking-tighter">
                {editingHistorySession ? `עריכה: ${formatDate(editingHistorySession.date)}` : 'סנכרון נוכחות: יום חמישי הגדול'}
              </h2>
              <p className="text-[#4E8294] font-bold mt-2">סמן את כל הגולשים שיצאו ממים 🌊</p>
              
              {editingHistorySession && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 animate-pulse">
                  <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm font-bold leading-relaxed">
                    שינוי רשימת המשתתפים בסשן היסטורי ישפיע באופן ישיר על הגרפים והסטטיסטיקות השבועיות.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {editingHistorySession && (
                <button 
                  onClick={() => { setView('history'); setEditingHistorySession(null); }}
                  className="px-6 py-4 bg-slate-100 text-[#4E8294] rounded-2xl font-black text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <ArrowRight size={18} /> ביטול
                </button>
              )}
              <div className="bg-white px-6 py-3 rounded-2xl border border-[#006994]/10 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00FFFF]/10 rounded-full flex items-center justify-center text-[#006994]">
                  <UsersIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#4E8294] uppercase tracking-widest">סה"כ נוכחים</p>
                  <p className="text-xl font-black text-[#006994]">{confirmedIds.size}</p>
                </div>
              </div>
              
              <button 
                onClick={handleFinalConfirm}
                disabled={isSaving || confirmedIds.size === 0}
                className="px-8 py-4 bg-[#006994] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#006994]/20 hover:bg-[#00FFFF] hover:text-[#006994] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                {editingHistorySession ? 'עדכון סשן' : 'אישור סופי ושמירה'}
              </button>
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
                    className={`relative cursor-pointer group rounded-[2.5rem] p-4 transition-all duration-500 flex flex-col items-center ${
                      isSelected 
                        ? 'bg-white shadow-2xl shadow-[#006994]/10 border-2 border-[#00FFFF]' 
                        : 'bg-white/40 border border-transparent hover:bg-white hover:shadow-xl'
                    }`}
                  >
                    <div className="relative mb-4">
                      <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-4 transition-all duration-500 ${
                        isSelected ? 'border-[#00FFFF] scale-105 shadow-lg shadow-[#00FFFF]/20' : 'border-white grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'
                      }`}>
                        <img 
                          src={user.photoURL || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=006994&color=fff`} 
                          className="w-full h-full object-cover" 
                          alt={user.name}
                        />
                        
                        {/* Selection Overlay (Dimming only) */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'bg-[#006994]/20 opacity-100' : 'bg-black/10 opacity-0 group-hover:opacity-100'}`}>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-[#00FFFF] text-[#006994] rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10"
                        >
                          <Check size={16} strokeWidth={4} />
                        </motion.div>
                      )}
                    </div>

                    <span className={`text-sm font-black text-center transition-colors ${
                      isSelected ? 'text-[#006994]' : 'text-[#4E8294]'
                    }`}>
                      {user.name}
                    </span>

                    {isSelected && (
                      <div className="mt-2 px-3 py-1 bg-[#00FFFF]/10 rounded-full">
                        <span className="text-[10px] font-black text-[#006994] uppercase tracking-widest">נוכח/ת</span>
                      </div>
                    )}
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
                        const user = users.find(u => u.id === uid);
                        return (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm">
                            <img 
                              src={user?.photoURL || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'G')}&background=006994&color=fff`} 
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
