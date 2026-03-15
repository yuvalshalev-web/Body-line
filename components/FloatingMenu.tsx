import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Image as ImageIcon, Calendar, Trophy, UserCircle, LogOut, Newspaper, Menu } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';

interface FloatingMenuProps {
  onOpenDrawer: () => void;
  scrollRef?: React.RefObject<HTMLElement>;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ onOpenDrawer, scrollRef }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { siteConfig } = useData();
  const isTop = siteConfig?.navPosition === 'top';
  const menuRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [dragConstraints, setDragConstraints] = useState({ top: -50, bottom: 50, left: -50, right: 50 });

  // Update drag constraints based on window size
  useEffect(() => {
    const updateConstraints = () => {
      setDragConstraints({
        top: isTop ? 0 : -window.innerHeight + 180,
        bottom: isTop ? window.innerHeight - 180 : 50,
        left: -window.innerWidth / 2 + 20,
        right: window.innerWidth / 2 - 20
      });
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, [isTop]);

  // Scroll to hide/show logic
  useEffect(() => {
    const scrollContainer = scrollRef?.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        if (isVisible) {
          setIsVisible(false);
          controls.start({ 
            y: isTop ? -150 : 150, 
            opacity: 0,
            transition: { duration: 0.3, ease: "easeInOut" } 
          });
        }
      } else {
        // Scrolling up
        if (!isVisible) {
          setIsVisible(true);
          controls.start({ 
            y: 0, 
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 30 } 
          });
        }
      }
      lastScrollY.current = currentScrollY;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [scrollRef, isVisible, controls, isTop]);

  // Reset position on route change
  useEffect(() => {
    setIsVisible(true);
    controls.start({ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } });
  }, [location.pathname, controls]);

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
      ref={menuRef}
      animate={controls}
      initial={{ y: isTop ? -100 : 100, opacity: 0 }}
      drag={true} // Allow dragging in both modes
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      dragMomentum={false}
      whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
      className={`fixed ${isTop ? 'top-6' : 'bottom-8'} left-1/2 -translate-x-1/2 z-[9999] 
                 w-max max-w-[98vw]
                 bg-white/80 backdrop-blur-2xl border border-white/40 
                 rounded-[32px] p-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] 
                 flex items-center floating-menu-container
                 cursor-grab active:cursor-grabbing hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] transition-shadow duration-300`}
    >
      <nav className="flex items-center justify-center gap-0.5 sm:gap-1 w-full px-1">
        {/* Menu Button (Right side in RTL) */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-0.5 p-1 px-1.5 min-[360px]:px-2 sm:px-4 rounded-[28px] border border-slate-200/60 text-slate-700 bg-slate-100/60 hover:bg-slate-200/90 hover:scale-110 active:scale-95 transition-all duration-300 group shrink-0"
        >
          <Menu size={18} className="sm:size-[24px] drop-shadow-md group-hover:rotate-12 transition-transform" />
          <span className="text-[11px] sm:text-[15px] font-black opacity-80 leading-none font-['Yehuda_CLM']">תפריט</span>
        </button>

        {/* Navigation Items */}
        {menuItems.slice().reverse().map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 p-1 px-1.5 min-[360px]:px-2 sm:px-4 rounded-[28px] border transition-all duration-500 group relative overflow-hidden shrink-0 ${
                isActive 
                  ? `${item.activeBg} text-white border-transparent shadow-[0_15px_25px_-5px_rgba(0,0,0,0.3)] scale-105 -translate-y-1.5` 
                  : `${item.color} ${item.bg} ${item.border} hover:scale-110 active:scale-90`
              }`}
            >
              {/* Animated background glow for inactive items */}
              {!isActive && (
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-white/30 via-transparent to-transparent`} />
              )}
              
              <Icon 
                size={18} 
                className={`z-10 transition-all duration-500 sm:size-[24px] ${
                  isActive 
                    ? 'text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]' 
                    : `${item.glow} group-hover:rotate-12 group-hover:scale-110`
                }`} 
              />
              <span className={`text-[11px] sm:text-[15px] font-black z-10 tracking-tighter leading-none font-['Yehuda_CLM'] ${isActive ? 'text-white' : 'opacity-90'}`}>
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
      </nav>
    </motion.div>
  );
};

export default FloatingMenu;
