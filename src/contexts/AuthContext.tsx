
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getDb, auth, trackedGetDoc, trackedOnSnapshot } from '../services/firebase';
import { Member } from '../types';

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
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((user: Member) => {
    setCurrentUser(user);
    // We don't strictly need localStorage anymore as Firebase Auth handles persistence,
    // but it can be useful for immediate UI rendering before onAuthStateChanged fires.
    try {
      window.localStorage.setItem('habal_zug_user', JSON.stringify(user));
    } catch (e) {
      console.warn('localStorage blocked during login');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      try {
        window.localStorage.removeItem('habal_zug_user');
      } catch (e) {}
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const updateUser = useCallback((user: Member) => {
    setCurrentUser(user);
    try {
      window.localStorage.setItem('habal_zug_user', JSON.stringify(user));
    } catch (e) {}
  }, []);

  // @ai-preserve: Firebase Auth State Listener
  // Listen to Firebase Auth state changes
  useEffect(() => {
    console.log("AuthContext: Initializing onAuthStateChanged...");
    
    // Safety timeout in case onAuthStateChanged hangs
    const authTimeout = setTimeout(() => {
      console.warn("AuthContext: onAuthStateChanged timed out, forcing loading to false");
      setLoading(false);
    }, 5000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout);
      console.log("AuthContext: onAuthStateChanged fired. User:", user?.email || 'null');
      setFirebaseUser(user);
      
      if (user) {
        try {
          const db = getDb();
          console.log("AuthContext: Fetching member doc for", user.uid);
          
          // Add a timeout to prevent hanging on flaky connections
          const fetchPromise = trackedGetDoc(doc(db, 'members', user.uid));
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout fetching member doc")), 5000)
          );
          
          const memberDoc = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
          if (memberDoc.exists()) {
            const memberData = { id: memberDoc.id, ...memberDoc.data() } as Member;
            if (memberData.isActive === false) {
              console.warn("AuthContext: User is suspended. Not setting currentUser.");
              setCurrentUser(null);
              try { window.localStorage.removeItem('habal_zug_user'); } catch(e){}
            } else {
              console.log("AuthContext: Member doc found:", memberData.email);
              setCurrentUser(memberData);
              try { window.localStorage.setItem('habal_zug_user', JSON.stringify(memberData)); } catch(e){}
            }
          } else {
            console.warn("AuthContext: Member doc NOT found for", user.uid);
            let savedUser = null;
            try { savedUser = window.localStorage.getItem('habal_zug_user'); } catch(e){}
            if (savedUser) {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser.isActive === false) {
                setCurrentUser(null);
                try { window.localStorage.removeItem('habal_zug_user'); } catch(e){}
              } else {
                setCurrentUser(parsedUser);
              }
            }
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user doc in AuthContext:", error);
          let savedUser = null;
          try { savedUser = window.localStorage.getItem('habal_zug_user'); } catch(e){}
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser.isActive === false) {
              setCurrentUser(null);
              try { window.localStorage.removeItem('habal_zug_user'); } catch(e){}
            } else {
              setCurrentUser(parsedUser);
            }
          }
        }
      } else {
        setCurrentUser(null);
        try { window.localStorage.removeItem('habal_zug_user'); } catch(e){}
      }
      console.log("AuthContext: Setting loading to false");
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to the current user's document for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const db = getDb();
    const unsub = trackedOnSnapshot(doc(db, 'members', currentUser.id), (snapshot) => {
      if (snapshot.exists()) {
        const updatedData = { id: snapshot.id, ...snapshot.data() } as Member;
        if (updatedData.isActive === false) {
          console.warn("AuthContext: User suspended in real-time. Logging out.");
          logout();
        } else {
          setCurrentUser(prev => {
            if (JSON.stringify(updatedData) !== JSON.stringify(prev)) {
              try { window.localStorage.setItem('habal_zug_user', JSON.stringify(updatedData)); } catch(e){}
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
