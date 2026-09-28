import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, Variants } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdminUser } from '../constants';
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
  Terminal,
  LogOut,
  User,
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  UserCheck,
  Award,
  Info,
  ShieldCheck,
  X
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  span?: string;
}

const navItems: NavItem[] = [
  { id: 'session', label: 'דף הבית', icon: Waves, path: '/', span: 'col-span-2 row-span-1' },
  { id: 'progress', label: 'דשבורד', icon: Activity, path: '/surfer-card', span: 'col-span-1 row-span-1' },
  { id: 'passport', label: 'דרכון אקסטרים', icon: Award, path: '/passport', span: 'col-span-1 row-span-1' },
  { id: 'community', label: 'קהילה', icon: Users, path: '/directory', span: 'col-span-1 row-span-1' },
  { id: 'gallery', label: 'גלריה', icon: ImageIcon, path: '/gallery', span: 'col-span-1 row-span-1' },
  { id: 'events', label: 'אירועים', icon: Calendar, path: '/events', span: 'col-span-1 row-span-1' },
  { id: 'posts', label: 'פוסטים', icon: Newspaper, path: '/posts', span: 'col-span-1 row-span-1' },
  { id: 'shaper', label: 'שייפר', icon: Hammer, path: '/shaper', span: 'col-span-1 row-span-1' },
  { id: 'settings', label: 'פרופיל', icon: Settings, path: '/profile', span: 'col-span-1 row-span-1' },
  { id: 'news', label: 'חדשות', icon: Globe, path: '/world-news', span: 'col-span-1 row-span-1' },
  { id: 'about', label: 'אודות', icon: Info, path: '/about', span: 'col-span-1 row-span-1' },
];

const BentoCard = React.memo(({ item, isActive, isHovered, onHoverStart, onHoverEnd, onClick, isAdminCard }: { item: NavItem, isActive: boolean, isHovered: boolean, onHoverStart: () => void, onHoverEnd: () => void, onClick: () => void, isAdminCard?: boolean }) => {
  const Icon = item.icon;

  return (
    <motion.button
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-3xl backdrop-blur-md border shadow-xl overflow-hidden group transition-all duration-300 ${item.span || 'col-span-1 row-span-1'} ${
        isAdminCard
          ? isActive 
            ? 'bg-amber-500/25 border-amber-400/60 shadow-[inset_0_4px_12px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(245,158,11,0.25)]' 
            : 'bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-950/80 border-amber-500/25 hover:border-amber-400/50 hover:bg-amber-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
          : isActive 
            ? 'bg-white/20 border-white/40 shadow-[inset_0_4px_12px_rgba(0,0,0,0.2),inset_0_0_20px_rgba(255,255,255,0.2)]' 
            : 'bg-white/5 border-white/10 hover:bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${isAdminCard ? 'from-amber-400/15' : 'from-white/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {isAdminCard && (
        <div className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-[8px] font-black text-amber-300 tracking-wider flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <ShieldCheck size={9} />
          <span>ניהול</span>
        </div>
      )}

      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={28} className={`${
          isAdminCard 
            ? (isActive ? 'text-amber-300' : 'text-amber-200/80')
            : (isActive ? 'text-white' : 'text-white/70')
        } group-hover:text-white transition-colors group-hover:scale-110 duration-300`} />
      </motion.div>

      <span className={`font-black text-[10px] uppercase tracking-widest ${
        isAdminCard
          ? (isActive ? 'text-amber-200' : 'text-amber-100/90')
          : (isActive ? 'text-white' : 'text-white/80')
      } group-hover:text-white`}>
        {item.label}
      </span>
      
      {isActive && (
        <motion.div 
          layoutId="bento-active"
          className={`absolute inset-0 border-2 ${isAdminCard ? 'border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]'} rounded-3xl pointer-events-none`}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      )}

      {isHovered && (
        <motion.div
          layoutId="bento-wave-indicator"
          className={`absolute bottom-2 right-2 ${isAdminCard ? 'text-amber-400/70' : 'text-cyan-400/60'} pointer-events-none`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Waves size={20} strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
});

interface FloatingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoute: string;
}

export const FloatingDrawer: React.FC<FloatingDrawerProps> = ({ isOpen, onClose, activeRoute }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('שלום');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('בוקר טוב');
    else if (hour >= 12 && hour < 17) setGreeting('צהריים טובים');
    else if (hour >= 17 && hour < 21) setGreeting('ערב טוב');
    else setGreeting('לילה טוב');
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const isAdmin = isAdminUser(currentUser);
  const isInstructor = currentUser?.role === 'Instructor';

  const adminNavItems: NavItem[] = React.useMemo(() => [
    ...(isAdmin ? [
      { id: 'admin-panel', label: 'ניהול', icon: LayoutDashboard, path: '/admin', span: 'col-span-1 row-span-1' },
      { id: 'system-settings', label: 'הגדרות מערכת', icon: Settings, path: '/system-settings', span: 'col-span-1 row-span-1' },
      { id: 'engine-room', label: 'חדר מכונות', icon: Terminal, path: '/engine-room', span: 'col-span-1 row-span-1' },
    ] : []),
    ...(isAdmin || isInstructor ? [
      { id: 'community-pulse', label: 'דופק', icon: HeartPulse, path: '/admin-info', span: 'col-span-1 row-span-1' },
      { id: 'grading', label: 'הערכות', icon: UserCheck, path: '/grading', span: 'col-span-1 row-span-1' },
    ] : []),
    ...(isAdmin ? [
      { id: 'session-log', label: 'סשנים', icon: ClipboardList, path: '/attendance', span: 'col-span-1 row-span-1' },
    ] : [])
  ], [isAdmin, isInstructor]);

  const handleHoverStart = React.useCallback((id: string) => setHoveredId(id), []);
  const handleHoverEnd = React.useCallback(() => setHoveredId(null), []);
  const handleItemClick = React.useCallback((path: string) => handleNavigate(path), [handleNavigate]);

  const containerVariants: Variants = {
    hidden: { 
      x: '100%', 
      opacity: 0,
    },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30, 
        staggerChildren: 0.05, 
        delayChildren: 0.2 
      }
    },
    exit: { 
      x: '100%', 
      opacity: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0, scale: 0.8 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] pointer-events-auto"
            />

            <motion.nav
              key="drawer-content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed right-0 md:right-6 top-0 md:top-6 bottom-0 md:bottom-6 w-full md:w-[320px] luxury-card !bg-slate-900/95 !backdrop-blur-2xl p-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-6 !rounded-none md:!rounded-[50px] overflow-hidden !border-white/10 z-[10001]"
              style={{ 
                boxShadow: '0 0 80px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.1)'
              }}
              dir="rtl"
            >
              <div className="grain-overlay opacity-10" />
              <div className="premium-sweep-fx opacity-20" />
            
            {/* Header / Profile Section */}
            <motion.div 
              variants={itemVariants}
              className="relative z-10 flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md shadow-lg"
            >
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {currentUser?.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={24} className="text-white/70 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-white/60 font-medium tracking-wider">{greeting},</span>
                  <h3 className="text-lg font-black text-white tracking-tight leading-tight">
                    {currentUser?.firstName || 'גולש'}
                  </h3>
                </div>
                
                <button 
                  onClick={onClose}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </motion.div>

              {/* Bento Grid Navigation */}
              <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 -mx-2 px-2 pb-4 space-y-4">
                {/* General Community Menu */}
                <div className="space-y-2">
                  <div className="px-2 flex items-center justify-between text-[11px] font-black tracking-wider text-slate-400 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Waves size={13} className="text-cyan-400" />
                      <span>מרחב הקהילה</span>
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">חברים</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3" style={{ gridAutoRows: 'minmax(110px, auto)' }}>
                    {navItems.map((item) => (
                      <BentoCard 
                        key={item.id} 
                        item={item} 
                        isActive={activeRoute === item.path} 
                        isHovered={hoveredId === item.id}
                        onHoverStart={() => handleHoverStart(item.id)}
                        onHoverEnd={handleHoverEnd}
                        onClick={() => handleItemClick(item.path)} 
                      />
                    ))}
                  </div>
                </div>

                {/* Privileged Management Menu (Separated & Styled with Amber Glow) */}
                {adminNavItems.length > 0 && (
                  <div className="pt-2 space-y-3">
                    {/* Visual Separator */}
                    <div className="relative flex items-center justify-center my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
                      </div>
                      <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                        <ShieldCheck size={13} className="text-amber-400" />
                        <span>ניהול מערכת ורכזים</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3" style={{ gridAutoRows: 'minmax(110px, auto)' }}>
                      {adminNavItems.map((item) => (
                        <BentoCard 
                          key={item.id} 
                          item={item} 
                          isAdminCard={true}
                          isActive={activeRoute === item.path} 
                          isHovered={hoveredId === item.id}
                          onHoverStart={() => handleHoverStart(item.id)}
                          onHoverEnd={handleHoverEnd}
                          onClick={() => handleItemClick(item.path)} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Section - Logout */}
              <motion.div 
                variants={itemVariants}
                className="relative z-10"
              >
                <motion.button
                  id="main-menu-logout-btn"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    try {
                      onClose();
                      await logout();
                      navigate('/', { replace: true });
                    } catch (err) {
                      console.error("Logout error in FloatingDock:", err);
                    }
                  }}
                  className="flex items-center justify-center gap-3 p-4 rounded-3xl w-full bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 hover:text-white border border-rose-500/30 transition-all group shadow-lg cursor-pointer"
                >
                  <LogOut size={20} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="font-bold tracking-wide">
                    התנתקות
                  </span>
                </motion.button>
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
