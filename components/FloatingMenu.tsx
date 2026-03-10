import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Image as ImageIcon, Calendar, Trophy, UserCircle, LogOut, Newspaper, Menu } from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingMenuProps {
  onOpenDrawer: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ onOpenDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'בית', 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/10', 
      border: 'border-orange-500/20',
      activeBg: 'bg-gradient-to-br from-orange-400 via-yellow-400 to-red-500',
      glow: 'drop-shadow-[0_0_12px_rgba(249,115,22,0.6)] drop-shadow-[0_0_3px_rgba(253,224,71,0.4)]'
    },
    { 
      path: '/directory', 
      icon: Users, 
      label: 'נבחרת', 
      color: 'text-sky-500', 
      bg: 'bg-sky-500/10', 
      border: 'border-sky-500/20',
      activeBg: 'bg-gradient-to-br from-sky-400 via-cyan-400 to-blue-600',
      glow: 'drop-shadow-[0_0_12px_rgba(14,165,233,0.6)] drop-shadow-[0_0_3px_rgba(34,211,238,0.4)]'
    },
    { 
      path: '/gallery', 
      icon: ImageIcon, 
      label: 'גלרייה', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20',
      activeBg: 'bg-gradient-to-br from-emerald-400 via-green-400 to-teal-600',
      glow: 'drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] drop-shadow-[0_0_3px_rgba(74,222,128,0.4)]'
    },
    { 
      path: '/events', 
      icon: Calendar, 
      label: 'אירועים', 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20',
      activeBg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-600',
      glow: 'drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]'
    },
    { 
      path: '/surfer-card', 
      icon: Trophy, 
      label: 'דאשבורד', 
      color: 'text-indigo-500', 
      bg: 'bg-indigo-500/10', 
      border: 'border-indigo-500/20',
      activeBg: 'bg-gradient-to-br from-indigo-400 via-purple-400 to-indigo-700',
      glow: 'drop-shadow-[0_0_12px_rgba(99,102,241,0.6)] drop-shadow-[0_0_3px_rgba(167,139,250,0.4)]'
    },
    { 
      path: '/profile', 
      icon: UserCircle, 
      label: 'פרופיל', 
      color: 'text-rose-500', 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/20',
      activeBg: 'bg-gradient-to-br from-rose-400 via-pink-400 to-rose-600',
      glow: 'drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] drop-shadow-[0_0_3px_rgba(244,114,182,0.4)]'
    }
  ];

  return (
    <motion.div 
      key={location.pathname}
      drag
      whileDrag={{ scale: 1.02, zIndex: 100000 }}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:w-max md:mx-auto z-[9999] 
                 bg-white/85 backdrop-blur-3xl border border-white/60 
                 rounded-[40px] p-1.5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.25)] flex items-center gap-1 floating-menu-container cursor-grab active:cursor-grabbing"
    >
      <nav className="flex justify-between items-center gap-1">
        {/* Profile Item */}
        {menuItems.slice().reverse().map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-3 px-5 rounded-[32px] border transition-all duration-500 group relative overflow-hidden ${
                isActive 
                  ? `${item.activeBg} text-white border-transparent shadow-[0_15px_25px_-5px_rgba(0,0,0,0.3)] scale-110 -translate-y-3` 
                  : `${item.color} ${item.bg} ${item.border} hover:scale-115 active:scale-90`
              }`}
            >
              {/* Animated background glow for inactive items */}
              {!isActive && (
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-white/30 via-transparent to-transparent`} />
              )}
              
              <Icon 
                size={26} 
                className={`z-10 transition-all duration-500 ${
                  isActive 
                    ? 'text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]' 
                    : `${item.glow} group-hover:rotate-12 group-hover:scale-110`
                }`} 
              />
              <span className={`text-[10px] font-black z-10 tracking-tight leading-none font-['Miriwin'] ${isActive ? 'text-white' : 'opacity-90'}`}>
                {item.label}
              </span>

              {/* Active Indicator Dot with Animation */}
              {isActive && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute -bottom-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </button>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-1 p-3 px-5 rounded-[32px] border border-slate-200/60 text-slate-700 bg-slate-100/60 hover:bg-slate-200/90 hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <Menu size={26} className="drop-shadow-md" />
          <span className="text-[10px] font-black opacity-80 leading-none font-['Miriwin']">תפריט</span>
        </button>
      </nav>
    </motion.div>
  );
};

export default FloatingMenu;
