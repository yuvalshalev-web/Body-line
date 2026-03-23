
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getDb, auth } from '../services/firebase';
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
    localStorage.setItem('habal_zug_user', JSON.stringify(user));
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('habal_zug_user');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const updateUser = useCallback((user: Member) => {
    setCurrentUser(user);
    localStorage.setItem('habal_zug_user', JSON.stringify(user));
  }, []);

  // @ai-preserve: Firebase Auth State Listener
  // Listen to Firebase Auth state changes
  useEffect(() => {
    console.log("AuthContext: Initializing onAuthStateChanged...");
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: onAuthStateChanged fired. User:", user?.email || 'null');
      setFirebaseUser(user);
      
      if (user) {
        try {
          const db = getDb();
          console.log("AuthContext: Fetching member doc for", user.uid);
          const memberDoc = await getDoc(doc(db, 'members', user.uid));
          if (memberDoc.exists()) {
            const memberData = { id: memberDoc.id, ...memberDoc.data() } as Member;
            console.log("AuthContext: Member doc found:", memberData.email);
            setCurrentUser(memberData);
            localStorage.setItem('habal_zug_user', JSON.stringify(memberData));
          } else {
            console.warn("AuthContext: Member doc NOT found for", user.uid);
            const savedUser = localStorage.getItem('habal_zug_user');
            if (savedUser) {
              setCurrentUser(JSON.parse(savedUser));
            }
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user doc in AuthContext:", error);
          const savedUser = localStorage.getItem('habal_zug_user');
          if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
          }
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('habal_zug_user');
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
    const unsub = onSnapshot(doc(db, 'members', currentUser.id), (snapshot) => {
      if (snapshot.exists()) {
        const updatedData = { id: snapshot.id, ...snapshot.data() } as Member;
        setCurrentUser(prev => {
          if (JSON.stringify(updatedData) !== JSON.stringify(prev)) {
            localStorage.setItem('habal_zug_user', JSON.stringify(updatedData));
            return updatedData;
          }
          return prev;
        });
      } else if (currentUser.id !== 'dev-admin-id' && currentUser.id !== 'super-admin') {
        // User was deleted
        if (!snapshot.metadata.fromCache) {
          logout();
        }
      }
    }, (error) => {
      console.error("Error listening to user doc:", error);
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
