import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, Variants } from 'motion/react';
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
  span?: string;
}

const navItems: NavItem[] = [
  { id: 'session', label: 'דף הבית', icon: Waves, path: '/', span: 'col-span-2 row-span-1' },
  { id: 'progress', label: 'דשבורד', icon: Activity, path: '/surfer-card', span: 'col-span-1 row-span-2' },
  { id: 'community', label: 'קהילה', icon: Users, path: '/directory', span: 'col-span-1 row-span-1' },
  { id: 'gallery', label: 'גלריה', icon: ImageIcon, path: '/gallery', span: 'col-span-1 row-span-1' },
  { id: 'events', label: 'אירועים', icon: Calendar, path: '/events', span: 'col-span-1 row-span-1' },
  { id: 'posts', label: 'פוסטים', icon: Newspaper, path: '/posts', span: 'col-span-1 row-span-1' },
  { id: 'news', label: 'חדשות', icon: Globe, path: '/world-news', span: 'col-span-2 row-span-1' },
  { id: 'shaper', label: 'שייפר', icon: Hammer, path: '/shaper', span: 'col-span-1 row-span-1' },
  { id: 'settings', label: 'פרופיל', icon: Settings, path: '/profile', span: 'col-span-1 row-span-1' },
];

const BentoCard = React.memo(({ item, isActive, isHovered, onHoverStart, onHoverEnd, onClick }: { item: NavItem, isActive: boolean, isHovered: boolean, onHoverStart: () => void, onHoverEnd: () => void, onClick: () => void }) => {
  const Icon = item.icon;

  return (
    <motion.button
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-3xl backdrop-blur-md border shadow-xl overflow-hidden group transition-all duration-300 ${item.span || 'col-span-1 row-span-1'} ${isActive ? 'bg-white/20 border-white/40 shadow-[inset_0_4px_12px_rgba(0,0,0,0.2),inset_0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={28} className={`${isActive ? 'text-white' : 'text-white/70'} group-hover:text-white transition-colors group-hover:scale-110 duration-300`} />
      </motion.div>

      <span className={`font-black text-[10px] uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/80'} group-hover:text-white`}>{item.label}</span>
      
      {isActive && (
        <motion.div 
          layoutId="bento-active"
          className="absolute inset-0 border-2 border-cyan-400/50 rounded-3xl pointer-events-none shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      )}

      {isHovered && (
        <motion.div
          layoutId="bento-wave-indicator"
          className="absolute bottom-2 right-2 text-cyan-400/60 pointer-events-none"
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

  const isAdmin = currentUser?.role === 'Admin';
  const isInstructor = currentUser?.role === 'Instructor';

  const allNavItems = React.useMemo(() => [
    ...navItems,
    ...(isAdmin ? [
      { id: 'admin-panel', label: 'ניהול', icon: LayoutDashboard, path: '/admin', span: 'col-span-1 row-span-1' },
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
              className="fixed right-0 md:right-6 top-0 md:top-6 bottom-0 md:bottom-6 w-full md:w-[320px] luxury-card !bg-slate-900/95 !backdrop-blur-2xl p-6 flex flex-col gap-6 !rounded-none md:!rounded-[50px] overflow-hidden !border-white/10 z-[10001]"
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
              <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 -mx-2 px-2 pb-4">
                <div className="grid grid-cols-2 gap-3" style={{ gridAutoRows: 'minmax(110px, auto)' }}>
                  {allNavItems.map((item) => (
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

              {/* Footer Section - Logout */}
              <motion.div 
                variants={itemVariants}
                className="relative z-10"
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="flex items-center justify-center gap-3 p-4 rounded-3xl w-full bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 hover:text-white border border-rose-500/30 transition-all group shadow-lg"
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
