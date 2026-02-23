
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
  arrayRemove
} from 'firebase/firestore';
import { Users as UsersIcon, Check, Save, Search, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface User {
  id: string;
  name: string;
  photoURL?: string;
  avatar?: string; // Fallback for members collection if needed
  isPresent?: boolean;
}

const SurfingSessionAttendance: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const db = getDb();
    
    // 1. Fetch all users from 'users' collection
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
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
      const data = snapshot.data();
      const attendees = data?.attendees;
      if (Array.isArray(attendees)) {
        setConfirmedIds(new Set(attendees));
      } else {
        setConfirmedIds(new Set());
      }
    }, (error) => {
      console.error("Error listening to session:", error);
    });

    return () => {
      unsubUsers();
      unsubSession();
    };
  }, []);

  const toggleUser = async (userId: string) => {
    const db = getDb();
    const sessionRef = doc(db, 'site_data', 'active_session');
    const isSelected = confirmedIds.has(userId);

    try {
      await updateDoc(sessionRef, {
        attendees: isSelected ? arrayRemove(userId) : arrayUnion(userId)
      });
      // Note: confirmedIds will be updated automatically via onSnapshot
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
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('הנוכחות נשמרה בהצלחה בארכיון השבועי');
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert('שגיאה בשמירת הנתונים');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#006994]" size={40} />
        <p className="text-[#006994] font-black animate-pulse">טוען רשימת גולשים...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto font-['Assistant']" dir="rtl">
      {/* Header Section */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#006994] text-[#00FFFF] text-[10px] font-black rounded-full mb-4 shadow-lg shadow-[#006994]/20">
            <UsersIcon size={12} /> סנכרון נוכחות שבועי
          </div>
          <h2 className="text-5xl font-black text-[#006994] tracking-tighter">סנכרון נוכחות: יום חמישי הגדול</h2>
          <p className="text-[#4E8294] font-bold mt-2">סמן את כל הגולשים שיצאו ממים 🌊</p>
        </div>

        <div className="flex items-center gap-4">
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
            אישור סופי ושמירה
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
                    
                    {/* Checkbox Overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isSelected ? 'bg-[#006994]/20 opacity-100' : 'bg-black/20 opacity-0 group-hover:opacity-100'}`}>
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#00FFFF] border-[#00FFFF]' : 'bg-white/20 border-white'}`}>
                        {isSelected && <Check size={14} className="text-[#006994]" strokeWidth={4} />}
                      </div>
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

      {filteredUsers.length === 0 && (
        <div className="py-32 text-center border-2 border-dashed border-[#006994]/10 rounded-[4rem]">
          <div className="w-20 h-20 bg-[#006994]/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[#006994]/20">
            <UsersIcon size={40} />
          </div>
          <h3 className="text-2xl font-black text-[#006994]/20">לא נמצאו גולשים תואמים</h3>
        </div>
      )}
    </div>
  );
};

export default SurfingSessionAttendance;
