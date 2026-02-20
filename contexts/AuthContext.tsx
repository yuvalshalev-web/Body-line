
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
