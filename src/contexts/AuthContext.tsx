
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { safeLocalStorage, safeSessionStorage } from '../utils/storage';
import { doc, onSnapshot, getDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getDb, auth, trackedGetDoc, trackedOnSnapshot } from '../services/firebase';
import { Member } from '../types';
import { syncBiometricFromMemberDoc, getEnrolledBiometricUsers } from '../utils/biometrics';
import { ensureFirebaseAuthSession, resetAuthSession } from '../services/authSession';
import { isAdminUser } from '../constants';

interface AuthContextType {
  currentUser: Member | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: Member) => void;
  logout: () => Promise<void>;
  updateUser: (user: Member) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isLoggingOutRef = React.useRef(safeLocalStorage.getItem('habal_zug_logged_out') === 'true');
  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    // Purge any legacy localStorage session to enforce strict session-only authentication
    safeLocalStorage.removeItem('habal_zug_user');

    // 1. If user explicitly logged out, never restore
    if (safeLocalStorage.getItem('habal_zug_logged_out') === 'true') {
      safeSessionStorage.removeItem('habal_zug_user');
      return null;
    }

    // 2. Check if the page/PWA was closed
    const pagehideAt = parseInt(safeLocalStorage.getItem('habal_zug_pagehide_at') || '0', 10);
    const now = Date.now();
    const navEntry = (typeof performance !== 'undefined' && performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) as PerformanceNavigationTiming | undefined;
    const isPageReload = navEntry ? navEntry.type === 'reload' : (typeof performance !== 'undefined' && (performance as any).navigation?.type === 1);

    // If app/tab was closed and reopened (more than 3 seconds since pagehide, and NOT an immediate in-tab reload):
    if (!isPageReload && pagehideAt > 0 && (now - pagehideAt) > 3000) {
      console.log("AuthContext: Fresh launch after page/PWA close. Ending previous session.");
      safeSessionStorage.removeItem('habal_zug_user');
      safeLocalStorage.removeItem('habal_zug_pagehide_at');
      return null;
    }

    // 3. Strictly restore ONLY from active tab/window sessionStorage
    const saved = safeSessionStorage.getItem('habal_zug_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isActive !== false) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing saved user:", e);
      }
    }
    return null;
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Track app close and background transitions to ensure session terminates when app is closed
  useEffect(() => {
    const handlePageHide = () => {
      safeLocalStorage.setItem('habal_zug_pagehide_at', Date.now().toString());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        safeLocalStorage.setItem('habal_zug_pagehide_at', Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        const hideTime = parseInt(safeLocalStorage.getItem('habal_zug_pagehide_at') || '0', 10);
        // If app was backgrounded for more than 3 minutes, terminate session for security
        if (hideTime > 0 && (Date.now() - hideTime) > 3 * 60 * 1000) {
          console.log("AuthContext: Session timed out while backgrounded. Requiring re-login.");
          safeSessionStorage.removeItem('habal_zug_user');
          safeLocalStorage.removeItem('habal_zug_pagehide_at');
          setCurrentUser(null);
          if (auth.currentUser && !auth.currentUser.email?.includes('@bodyline.internal')) {
            signOut(auth).catch(() => {});
          }
        }
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = useCallback(async (user: Member) => {
    isLoggingOutRef.current = false;
    safeLocalStorage.removeItem('habal_zug_logged_out');
    safeLocalStorage.removeItem('habal_zug_pagehide_at');
    
    const nowIso = new Date().toISOString();
    const updatedUser: Member = {
      ...user,
      lastLoginAt: nowIso,
      loginCount: (user.loginCount || 0) + 1
    };

    // Save to sessionStorage ONLY so closing the PWA/tab terminates the session
    safeLocalStorage.removeItem('habal_zug_user');
    safeSessionStorage.setItem('habal_zug_user', JSON.stringify(updatedUser));

    setCurrentUser(updatedUser);
    if (updatedUser) {
      syncBiometricFromMemberDoc(updatedUser);
      try {
        await ensureFirebaseAuthSession(isAdminUser(updatedUser) ? 'Admin' : (updatedUser.role || 'Member'));
        const db = getDb();
        const targetId = updatedUser.id || (updatedUser as any).uid;
        if (targetId) {
          await updateDoc(doc(db, 'members', targetId), {
            lastLoginAt: nowIso,
            loginCount: increment(1)
          });
          console.log(`AuthContext: Recorded lastLoginAt (${nowIso}) for member ${targetId}`);
        }
      } catch (syncErr) {
        console.warn("AuthContext: Could not direct sync lastLoginAt to Firestore:", syncErr);
      }

      // Secondary server-side sync for absolute reliability
      try {
        fetch('/api/auth/record-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: updatedUser.id || (updatedUser as any).uid,
            email: updatedUser.email
          })
        }).catch(() => {});
      } catch (_) {}
    }
  }, []);

  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;
    console.log("AuthContext: Initiating complete user logout...");
    
    // 1. Permanently record persistent logged out state across sessions
    safeLocalStorage.setItem('habal_zug_logged_out', 'true');
    safeSessionStorage.removeItem('habal_zug_user');
    safeLocalStorage.removeItem('habal_zug_user');
    safeLocalStorage.removeItem('habal_zug_pagehide_at');
    safeLocalStorage.removeItem('admin_stats_initialized');

    // 2. Immediately clear React user state so the UI transitions to logged-out state instantly
    setCurrentUser(null);
    setFirebaseUser(null);

    // 3. Terminate Firebase Auth session and reset session promises
    try {
      await resetAuthSession();
    } catch (error) {
      console.warn("Error signing out from firebase auth:", error);
    } finally {
      // 4. Double check storage and state are completely clean
      safeLocalStorage.setItem('habal_zug_logged_out', 'true');
      safeSessionStorage.removeItem('habal_zug_user');
      safeLocalStorage.removeItem('habal_zug_user');
      safeLocalStorage.removeItem('habal_zug_pagehide_at');
      safeLocalStorage.removeItem('admin_stats_initialized');
      setCurrentUser(null);
      setFirebaseUser(null);
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((user: Member) => {
    if (isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') return;
    setCurrentUser(user);
    safeSessionStorage.setItem('habal_zug_user', JSON.stringify(user));
    if (user) {
      syncBiometricFromMemberDoc(user);
    }
  }, []);

  // @ai-preserve: Firebase Auth State Listener
  // Listen to Firebase Auth state changes
  useEffect(() => {
    console.log("AuthContext: Initializing onAuthStateChanged...");
    
    // Safety timeout in case onAuthStateChanged hangs
    const authTimeout = setTimeout(() => {
      console.warn("AuthContext: onAuthStateChanged timed out, forcing loading to false");
      setLoading(false);
    }, 4000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout);
      console.log("AuthContext: onAuthStateChanged fired. User:", user?.email || 'null');
      
      const isLoggedOut = isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true';
      if (isLoggedOut) {
        console.log("AuthContext: onAuthStateChanged ignored during/after logout");
        setCurrentUser(null);
        setFirebaseUser(null);
        setLoading(false);
        return;
      }

      // STRICT SESSION-ONLY CHECK:
      // If the browser tab or PWA was closed, sessionStorage is wiped or timed out.
      // Do NOT auto-login the user just because Firebase Auth or IndexedDB had a cached token!
      const activeSessionUser = safeSessionStorage.getItem('habal_zug_user');
      if (!activeSessionUser) {
        console.log("AuthContext: No active tab session in safeSessionStorage. Re-authentication required.");
        setFirebaseUser(user);
        setCurrentUser(null);
        setLoading(false);
        // Clear any lingering human Firebase Auth session from IndexedDB
        if (user && !user.email?.includes('@bodyline.internal')) {
          signOut(auth).catch(() => {});
        }
        return;
      }

      setFirebaseUser(user);
      
      if (user) {
        // If this is the background session user, do not overwrite the human member's state
        if (user.email?.includes('@bodyline.internal')) {
          setLoading(false);
          return;
        }

        try {
          const db = getDb();
          console.log("AuthContext: Fetching member doc for", user.uid);
          
          const memberDoc = await trackedGetDoc(doc(db, 'members', user.uid));
          
          if (memberDoc.exists()) {
            const memberData = { id: memberDoc.id, ...memberDoc.data() } as Member;
            if (memberData.isActive === false) {
              console.warn("AuthContext: User is suspended. Not setting currentUser.");
              setCurrentUser(null);
              safeSessionStorage.removeItem('habal_zug_user');
            } else {
              if (isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') return;
              console.log("AuthContext: Member doc found:", memberData.email);
              syncBiometricFromMemberDoc(memberData);
              setCurrentUser(memberData);
              safeSessionStorage.setItem('habal_zug_user', JSON.stringify(memberData));
            }
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user doc in AuthContext:", error);
        }
      } else {
        if (isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Firebase Auth has no user (e.g. in-memory persistence in iframe).
        // Check if there is an active session in safeSessionStorage
        const saved = safeSessionStorage.getItem('habal_zug_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.isActive !== false) {
              if (isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') return;
              setCurrentUser(parsed);
              // Ensure Firebase Auth session is established for the restored user
              ensureFirebaseAuthSession(isAdminUser(parsed) ? 'Admin' : (parsed.role || 'Member')).catch(err => {
                console.warn("Background Firebase Auth restore note:", err);
              });

              // Verify in background against Firestore to keep data fresh
              const db = getDb();
              getDoc(doc(db, 'members', parsed.id)).then(docSnap => {
                if (isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') return;
                if (docSnap.exists()) {
                  const latest = { id: docSnap.id, ...docSnap.data() } as Member;
                  if (latest.isActive === false) {
                    setCurrentUser(null);
                    safeSessionStorage.removeItem('habal_zug_user');
                  } else {
                    if (isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') return;

                    // Automatically refresh lastLoginAt if the member last checked in over 4 hours ago
                    const lastLoginMs = latest.lastLoginAt ? new Date(latest.lastLoginAt).getTime() : 0;
                    const nowMs = Date.now();
                    if (!lastLoginMs || nowMs - lastLoginMs > 4 * 60 * 60 * 1000) {
                      const nowIso = new Date().toISOString();
                      latest.lastLoginAt = nowIso;
                      latest.loginCount = (latest.loginCount || 0) + 1;
                      fetch('/api/auth/record-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberId: latest.id, email: latest.email })
                      }).catch(() => {});
                    }

                    setCurrentUser(latest);
                    safeSessionStorage.setItem('habal_zug_user', JSON.stringify(latest));
                  }
                }
              }).catch(err => {
                console.warn("Background verify failed, keeping cached session:", err);
              });
            } else {
              setCurrentUser(null);
              safeSessionStorage.removeItem('habal_zug_user');
            }
          } catch (e) {
            setCurrentUser(null);
            safeSessionStorage.removeItem('habal_zug_user');
          }
        } else {
          setCurrentUser(null);
        }
      }
      console.log("AuthContext: Setting loading to false");
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Ensure Firebase Auth session is synchronized whenever currentUser is loaded
  useEffect(() => {
    if (currentUser && !firebaseUser && !isLoggingOutRef.current && safeLocalStorage.getItem('habal_zug_logged_out') !== 'true') {
      ensureFirebaseAuthSession(isAdminUser(currentUser) ? 'Admin' : (currentUser.role || 'Member')).catch(err => {
        console.warn("Failed to ensure Firebase Auth session on currentUser change:", err);
      });
    }
  }, [currentUser, firebaseUser]);

  // Listen to the current user's document for real-time updates
  useEffect(() => {
    if (!currentUser?.id || isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') return;

    const db = getDb();
    const unsub = trackedOnSnapshot(doc(db, 'members', currentUser.id), (snapshot) => {
      if (isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') return;
      if (snapshot.exists()) {
        const updatedData = { id: snapshot.id, ...snapshot.data() } as Member;
        if (updatedData.isActive === false) {
          console.warn("AuthContext: User suspended in real-time. Logging out.");
          logout();
        } else {
          setCurrentUser(prev => {
            if (!prev || isLoggingOutRef.current || safeLocalStorage.getItem('habal_zug_logged_out') === 'true') return null;
            if (JSON.stringify(updatedData) !== JSON.stringify(prev)) {
              safeSessionStorage.setItem('habal_zug_user', JSON.stringify(updatedData));
              return updatedData;
            }
            return prev;
          });
        }
      } else if (currentUser.id !== 'dev-admin-id' && currentUser.id !== 'super-admin') {
        // User was deleted
        if (!snapshot.metadata.fromCache) {
          logout();
        }
      }
    });

    return () => unsub();
  }, [currentUser?.id, logout]);

  const value = React.useMemo(() => ({ 
    currentUser, 
    firebaseUser,
    isAuthenticated: !!currentUser, 
    loading,
    login, 
    logout, 
    updateUser 
  }), [currentUser, firebaseUser, loading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
