
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '../services/firebase';
import { Member } from '../types';

interface AuthContextType {
  currentUser: Member | null;
  isAuthenticated: boolean;
  login: (user: Member) => void;
  logout: () => void;
  updateUser: (user: Member) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    const saved = localStorage.getItem('habal_zug_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem('habal_zug_user', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('habal_zug_user');
  };

  const updateUser = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem('habal_zug_user', JSON.stringify(user));
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    const db = getDb();
    const unsub = onSnapshot(doc(db, 'members', currentUser.id), (snapshot) => {
      if (snapshot.exists()) {
        const updatedData = { id: snapshot.id, ...snapshot.data() } as Member;
        setCurrentUser(prev => {
          // Only update if data actually changed to avoid infinite loops or unnecessary renders
          if (JSON.stringify(updatedData) !== JSON.stringify(prev)) {
            localStorage.setItem('habal_zug_user', JSON.stringify(updatedData));
            return updatedData;
          }
          return prev;
        });
      } else if (currentUser.id !== 'dev-admin-id') {
        // User was deleted (and it's not the hardcoded dev admin)
        logout();
      }
    }, (error) => {
      console.error("Error listening to user doc:", error);
    });

    return () => unsub();
  }, [currentUser?.id]);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, logout, updateUser }}>
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
