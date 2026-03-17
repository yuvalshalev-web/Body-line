
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const login = (user: Member) => {
    setCurrentUser(user);
    // We don't strictly need localStorage anymore as Firebase Auth handles persistence,
    // but it can be useful for immediate UI rendering before onAuthStateChanged fires.
    localStorage.setItem('habal_zug_user', JSON.stringify(user));
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('habal_zug_user');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateUser = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem('habal_zug_user', JSON.stringify(user));
  };

  // @ai-preserve: Firebase Auth State Listener
  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // User is signed in, fetch their member data from Firestore
        const db = getDb();
        
        // Try to find member by UID first
        // If not found by UID, we might need to find by email (for legacy users)
        // But for now let's assume UID is the primary key or stored in the doc
        
        // Actually, the current app uses document IDs that might not be UIDs.
        // Let's check if we can find a member with this UID.
        // If we can't find by UID, we'll try to find by email.
        
        // For now, let's try to get the member data.
        // We'll need a way to map Firebase User to Member document.
        // Usually, the document ID is the UID.
        
        const memberDoc = await getDoc(doc(db, 'members', user.uid));
        if (memberDoc.exists()) {
          const memberData = { id: memberDoc.id, ...memberDoc.data() } as Member;
          setCurrentUser(memberData);
          localStorage.setItem('habal_zug_user', JSON.stringify(memberData));
        } else {
          // If not found by UID, maybe it's a legacy user or a new Google login
          // We'll handle this in the login page or here if needed.
          // For now, if they are logged into Firebase but no member doc exists, 
          // we might still want to set some basic info if they are the super admin.
          
          const savedUser = localStorage.getItem('habal_zug_user');
          if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
          }
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('habal_zug_user');
      }
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
        logout();
      }
    }, (error) => {
      console.error("Error listening to user doc:", error);
    });

    return () => unsub();
  }, [currentUser?.id]);

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      firebaseUser,
      isAuthenticated: !!currentUser, 
      loading,
      login, 
      logout, 
      updateUser 
    }}>
      {!loading && children}
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
