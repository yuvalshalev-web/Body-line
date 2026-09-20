import React, { useEffect, useState, useRef } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Wifi, X, Smartphone, Monitor, ShieldCheck, Sparkles, Waves } from 'lucide-react';

export interface OnlineUser {
  id: string;
  memberId?: string | null;
  name: string;
  avatar?: string | null;
  role?: string;
  lastSeen: number;
  platform: 'mobile' | 'desktop';
  isCurrentUser?: boolean;
}

// Generate or retrieve unique session ID for current browser tab
const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server_session';
  let sid = sessionStorage.getItem('surf_presence_session_id');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      sessionStorage.setItem('surf_presence_session_id', sid);
    } catch {
      // ignore
    }
  }
  return sid;
};

export const OnlineUsersCounter: React.FC = () => {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sessionIdRef = useRef<string>(getSessionId());

  // Heartbeat effect
  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const db = getDb();
    const docId = currentUser?.id ? `user_${currentUser.id}` : sessionId;

    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const platform = isMobile ? 'mobile' : 'desktop';

    const sendHeartbeat = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const presenceRef = doc(db, 'online_presence', docId);
        await setDoc(
          presenceRef,
          {
            id: docId,
            sessionId,
            memberId: currentUser?.id || currentUser?.uid || null,
            name: currentUser 
              ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'גולש בקהילה'
              : 'גולש אורח',
            avatar: currentUser?.avatar || null,
            role: currentUser?.role || 'Member',
            lastSeen: Date.now(),
            platform,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Presence heartbeat notice:', err);
      }
    };

    // Immediate heartbeat on mount
    sendHeartbeat();

    // Regular interval every 40 seconds
    const interval = setInterval(sendHeartbeat, 40000);

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    // Before unload cleanup
    const handleUnload = () => {
      try {
        const presenceRef = doc(db, 'online_presence', docId);
        // Note: deleteDoc on unload is best-effort
        deleteDoc(presenceRef).catch(() => {});
      } catch {
        // ignore
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [currentUser]);

  // Real-time listener for active presence
  useEffect(() => {
    const db = getDb();
    const presenceCol = collection(db, 'online_presence');

    const unsubscribe = onSnapshot(
      presenceCol,
      (snapshot) => {
        const now = Date.now();
        const activeThreshold = 2.5 * 60 * 1000; // 2.5 minutes
        const list: OnlineUser[] = [];
        const seenMemberIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const lastSeen = data.lastSeen || 0;

          // Only count users active in the last 2.5 minutes
          if (now - lastSeen < activeThreshold) {
            // Deduplicate if member is logged in on multiple tabs
            const dedupeKey = data.memberId || docSnap.id;
            if (!seenMemberIds.has(dedupeKey)) {
              seenMemberIds.add(dedupeKey);
              list.push({
                id: docSnap.id,
                memberId: data.memberId || null,
                name: data.name || 'גולש/ת בקהילה',
                avatar: data.avatar || null,
                role: data.role || 'Member',
                lastSeen: lastSeen,
                platform: data.platform === 'mobile' ? 'mobile' : 'desktop',
                isCurrentUser: data.memberId === currentUser?.id || docSnap.id === sessionIdRef.current
              });
            }
          }
        });

        // Ensure current user is at least present in local list
        if (list.length === 0) {
          list.push({
            id: 'local_current',
            memberId: currentUser?.id || null,
            name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'את/ה (גולש/ת)',
            avatar: currentUser?.avatar || null,
            role: currentUser?.role || 'Member',
            lastSeen: now,
            platform: typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            isCurrentUser: true
          });
        }

        // Sort: current user first, then by recent activity
        list.sort((a, b) => {
          if (a.isCurrentUser) return -1;
          if (b.isCurrentUser) return 1;
          return b.lastSeen - a.lastSeen;
        });

        setOnlineUsers(list);
      },
      (error) => {
        console.warn('Presence listener notice:', error);
        // Fallback: at least show 1 online user (current user)
        setOnlineUsers([
          {
            id: 'local_fallback',
            memberId: currentUser?.id || null,
            name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'את/ה',
            avatar: currentUser?.avatar || null,
            role: currentUser?.role || 'Member',
            lastSeen: Date.now(),
            platform: 'mobile',
            isCurrentUser: true
          }
        ]);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const count = onlineUsers.length;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'Admin':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-white">רכז</span>;
      case 'Staff':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">צוות עמותה</span>;
      case 'Support':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-900">אפ-שייפר</span>;
      case 'Instructor':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-600 text-white">מדריך</span>;
      case 'Volunteer':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">מתנדב</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">משתתף</span>;
    }
  };

  return (
    <>
      <div className="w-full flex justify-center py-2 px-4 my-2">
        <motion.button
          type="button"
          onClick={() => setIsModalOpen(true)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="group inline-flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/80 hover:bg-white/95 backdrop-blur-xl border border-sky-900/10 hover:border-sky-500/30 rounded-full shadow-[0_4px_20px_-4px_rgba(0,43,68,0.12)] hover:shadow-[0_8px_25px_-4px_rgba(0,112,133,0.2)] transition-all duration-300 cursor-pointer text-[#002b44]"
          title="לחץ לצפייה ברשימת הגולשים המחוברים כעת"
        >
          {/* Live pulsing indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </span>

          {/* User Avatars Stack (first 3) */}
          <div className="flex -space-x-2 space-x-reverse items-center">
            {onlineUsers.slice(0, 3).map((u) => (
              <div
                key={u.id}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white bg-[#002b44] text-[10px] text-white font-black flex items-center justify-center overflow-hidden shadow-sm shrink-0"
              >
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{u.name.charAt(0)}</span>
                )}
              </div>
            ))}
          </div>

          {/* Text message */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black tracking-tight">
            <span className="text-[#002b44] font-heebo font-black text-sm sm:text-base">{count}</span>
            <span className="text-[#00426a]/90 font-bold">
              {count === 1 ? 'גולש מחובר כעת לאפליקציה' : 'גולשים מחוברים כעת לאפליקציה'}
            </span>
          </div>

          {/* Subtle live indicator tag */}
          <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            Live
          </span>
        </motion.button>
      </div>

      {/* Online Users Modal / Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_25px_60px_-15px_rgba(0,43,68,0.3)] w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
              dir="rtl"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#002b44] to-[#00426a] text-white flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                    <Wifi size={20} className="text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg sm:text-xl text-white font-yehuda tracking-tight flex items-center gap-2">
                      גולשים מחוברים כעת
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2 py-0.5 rounded-full font-sans">
                        {count} אונליין
                      </span>
                    </h3>
                    <p className="text-xs text-white/80 font-medium">חברי הקהילה שפעילים כרגע באפליקציה</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10"
                  title="סגור"
                >
                  <X size={20} />
                </button>
              </div>

              {/* List */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
                {onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-2xl transition-colors ${
                      user.isCurrentUser ? 'bg-sky-50/80 border border-sky-200/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-md"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#002b44] to-[#00426a] text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-md">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        {/* Status dot */}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#002b44] truncate">
                            {user.name}
                          </span>
                          {user.isCurrentUser && (
                            <span className="text-[10px] font-black text-sky-800 bg-sky-200/80 px-1.5 py-0.5 rounded-md">
                              את/ה
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getRoleBadge(user.role)}
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            פעיל/ה כעת
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 text-slate-400" title={user.platform === 'mobile' ? 'מכשיר נייד' : 'מחשב'}>
                      {user.platform === 'mobile' ? (
                        <Smartphone size={16} className="text-slate-500" />
                      ) : (
                        <Monitor size={16} className="text-slate-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Waves size={14} className="text-[#007085]" />
                  סנכרון בזמן אמת
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-[#002b44] hover:bg-[#00426a] text-white font-bold rounded-xl transition-colors shadow-sm"
                >
                  סגור
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
