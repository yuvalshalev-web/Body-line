import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Waves, 
  Users, 
  Activity, 
  Image as ImageIcon, 
  Calendar, 
  Newspaper, 
  Globe,
  Hammer,
  Settings, 
  LogOut,
  User,
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  UserCheck,
  X
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'session', label: 'דף הבית', icon: Waves, path: '/' },
  { id: 'community', label: 'קהילה', icon: Users, path: '/directory' },
  { id: 'progress', label: 'דשבורד אישי', icon: Activity, path: '/surfer-card' },
  { id: 'gallery', label: 'גלריה', icon: ImageIcon, path: '/gallery' },
  { id: 'events', label: 'אירועים', icon: Calendar, path: '/events' },
  { id: 'posts', label: 'פוסטים', icon: Newspaper, path: '/posts' },
  { id: 'news', label: 'חדשות', icon: Globe, path: '/world-news' },
  { id: 'shaper', label: 'פינת השייפר', icon: Hammer, path: '/shaper' },
  { id: 'settings', label: 'פרופיל שלי', icon: Settings, path: '/profile' },
];

interface FloatingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoute: string;
}

export const FloatingDrawer: React.FC<FloatingDrawerProps> = ({ isOpen, onClose, activeRoute }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = currentUser?.role === 'Admin';
  const isInstructor = currentUser?.role === 'Instructor';

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [
      { id: 'admin-panel', label: 'פאנל ניהול', icon: LayoutDashboard, path: '/admin' },
    ] : []),
    ...(isAdmin || isInstructor ? [
      { id: 'community-pulse', label: 'דופק הקהילה', icon: HeartPulse, path: '/admin-info' },
      { id: 'grading', label: 'הערכות', icon: UserCheck, path: '/grading' },
    ] : []),
    ...(isAdmin ? [
      { id: 'session-log', label: 'יומן סשנים', icon: ClipboardList, path: '/attendance' },
    ] : [])
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const springConfig: any = {
    type: "spring",
    stiffness: 300,
    damping: 30
  };

  const floatAnimation = {
    y: [0, -5, 0],
  };

  const floatTransition = {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  };

  return (
    <>
      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] lg:bg-transparent lg:backdrop-blur-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            key="drawer-content"
            initial={{ x: '110%', rotateY: -20, opacity: 0 }}
            animate={{ 
              x: 0, 
              rotateY: 0, 
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 25,
                mass: 0.8
              }
            }}
            exit={{ 
              x: '110%', 
              rotateY: 20, 
              opacity: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            }}
            className="fixed right-4 top-4 bottom-4 z-[10000] w-[300px] bg-white/40 backdrop-blur-[40px] rounded-[40px] p-8 flex flex-col gap-8 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] border border-slate-200/60 overflow-hidden"
            style={{
              perspective: '1000px',
              boxShadow: '0 32px 64px -15px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.8), inset 0 20px 40px rgba(255,255,255,0.5)',
            }}
            dir="rtl"
          >
            {/* Animated Background Glows */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header / Profile Section */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative z-10 flex flex-col items-center text-center gap-4 py-4"
            >
              <div className="relative group cursor-pointer" onClick={() => handleNavigate('/profile')}>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-[28px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                <div className="relative w-24 h-24 rounded-[24px] overflow-hidden bg-white/80 border border-slate-200 shadow-xl flex items-center justify-center">
                  {currentUser?.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={40} className="text-slate-400" strokeWidth={1} />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {currentUser?.firstName || 'גולש'}
                </h3>
                <span className="text-xs text-slate-500 font-black uppercase tracking-[0.2em]">
                  {currentUser?.role || 'Member'}
                </span>
              </div>
            </motion.div>

            {/* Navigation Links */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar relative z-10 pr-1">
              {allNavItems.map((item, index) => {
                const isActive = activeRoute === item.path;
                const Icon = item.icon;
                
                return (
                  <motion.button
                    key={item.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ x: -8 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleNavigate(item.path)}
                    className={`
                      flex items-center gap-4 p-4 rounded-[20px] transition-all duration-500 w-full shrink-0 group relative overflow-hidden
                      ${isActive 
                        ? 'bg-blue-50/80 text-blue-700 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)]' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav-bg"
                        className="absolute inset-0 bg-gradient-to-l from-blue-100/50 to-transparent"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                      ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 group-hover:bg-slate-200'}
                    `}>
                      <Icon 
                        size={24} 
                        strokeWidth={2} 
                        className="shrink-0" 
                      />
                    </div>
                    
                    <span className={`text-lg font-bold tracking-tight transition-all duration-300 ${isActive ? 'translate-x-0' : 'group-hover:-translate-x-1'}`}>
                      {item.label}
                    </span>

                    {isActive && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute left-4 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer Section */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative z-10 pt-4 border-t border-slate-200 flex flex-col gap-4"
            >
              <motion.button
                whileHover={{ x: -8 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-4 p-4 rounded-[20px] transition-all duration-500 w-full text-slate-600 hover:bg-rose-50 hover:text-rose-600 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <LogOut size={24} strokeWidth={2} />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  גל יציאה
                </span>
              </motion.button>
            </motion.div>

            {/* Close Button */}
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all z-[10001]"
              aria-label="סגור תפריט"
            >
              <X size={20} strokeWidth={2.5} />
            </motion.button>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};
