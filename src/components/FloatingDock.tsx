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
  ClipboardList
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
  const dockRef = useRef<HTMLElement>(null);
  
  const isAdmin = currentUser?.role === 'Admin';

  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [
      { id: 'admin-panel', label: 'פאנל ניהול', icon: LayoutDashboard, path: '/admin' },
      { id: 'community-pulse', label: 'דופק הקהילה', icon: HeartPulse, path: '/admin-info' },
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
      {/* Edge Trigger (Invisible) */}
      {!isOpen && (
        <div 
          className="fixed right-0 top-0 bottom-0 w-5 z-[9999] cursor-pointer"
          onMouseEnter={onClose} // Just in case, but usually we want to open it
          onClick={onClose}
        />
      )}

      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-[9999] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.nav
        ref={dockRef}
        initial={{ x: 300, opacity: 0 }}
        animate={{
          x: isOpen ? 0 : 300,
          opacity: 1,
          ...(isOpen ? floatAnimation : {})
        }}
        transition={{
          ...springConfig,
          ...(isOpen ? { y: floatTransition } : {})
        }}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-[10000] w-[280px] bg-white/40 backdrop-blur-xl rounded-[32px] p-6 flex flex-col gap-6 shadow-[0_20px_50px_rgba(31,38,135,0.15)] border border-white/20"
        style={{
          boxShadow: '0 20px 50px rgba(31,38,135,0.15), inset 0 1px 1px rgba(255,255,255,0.7)',
        }}
        dir="rtl"
      >
        {/* Profile Section */}
        <div 
          className="flex items-center gap-4 p-2 rounded-2xl transition-colors hover:bg-white/20 shrink-0 cursor-pointer"
          onClick={() => handleNavigate('/profile')}
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/50 shrink-0 border border-white/40 shadow-sm flex items-center justify-center">
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={28} className="text-slate-400" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-col justify-center overflow-hidden">
            <span className="text-base font-bold text-slate-800 leading-tight truncate">
              {currentUser?.firstName || 'גולש'}
            </span>
            <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              {currentUser?.role || 'Member'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-3 w-full overflow-y-auto max-h-[55vh] no-scrollbar py-2 px-1">
          {allNavItems.map((item) => {
            const isActive = activeRoute === item.path;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(item.path)}
                aria-label={item.label}
                className={`
                  flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 w-full shrink-0 group relative
                  ${isActive 
                    ? 'bg-blue-400/20 text-slate-800 shadow-[-2px_-2px_5px_rgba(255,255,255,0.8),2px_2px_5px_rgba(0,0,0,0.1)]' 
                    : 'text-slate-700 hover:bg-white/30 hover:text-slate-900'
                  }
                `}
                style={isActive ? {
                  boxShadow: 'inset -2px -2px 5px rgba(255,255,255,0.7), inset 2px 2px 5px rgba(0,0,0,0.1)',
                } : {}}
              >
                <Icon 
                  size={24} 
                  strokeWidth={1.5} 
                  className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'scale-110' : ''}`} 
                />
                <span className="whitespace-nowrap text-[15px] font-bold text-right">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-slate-800/5 shrink-0" />

        {/* Logout Button (Pinned to Bottom) */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            logout();
            onClose();
          }}
          aria-label="גל יציאה"
          className="flex items-center gap-4 p-4 rounded-2xl transition-colors w-full shrink-0 text-slate-600 hover:bg-rose-400/10 hover:text-rose-600 group mt-auto"
        >
          <LogOut size={24} strokeWidth={1.5} className="shrink-0 transition-transform group-hover:scale-110" />
          <span className="whitespace-nowrap text-[15px] font-bold text-right">
            גל יציאה
          </span>
        </motion.button>
      </motion.nav>
    </>
  );
};
