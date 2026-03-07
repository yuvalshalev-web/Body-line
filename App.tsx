import React, { useState, lazy, Suspense, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { 
  Home, 
  Users, 
  Image as ImageIcon, 
  Calendar, 
  Newspaper, 
  Globe, 
  UserCircle, 
  Settings, 
  LogOut,
  Menu,
  X,
  Waves,
  BarChart3,
  Loader2,
  ShieldAlert,
  Trophy,
  Activity
} from 'lucide-react';


import { motion, AnimatePresence } from 'motion/react';
import ErrorBoundary from './components/ErrorBoundary';
import FloatingMenu from './components/FloatingMenu';

// Lazy loaded components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const SurfingNewsPage = lazy(() => import('./pages/SurfingNewsPage'));
const AdminInfoPage = lazy(() => import('./pages/AdminInfoPage'));
const AdminRolloverReport = lazy(() => import('./pages/AdminRolloverReport'));
const SurferCardPage = lazy(() => import('./pages/SurferCardPage'));
const SurfingSessionAttendance = lazy(() => import('./pages/SurfingSessionAttendance'));
const SessionStatsPage = lazy(() => import('./pages/SessionStatsPage'));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <span className="font-black text-slate-400 text-xs uppercase tracking-widest">טוען דף...</span>
    </div>
  </div>
);

const SignpostLink = React.memo(({ 
  item, 
  isActive, 
  onClick,
  index
}: { 
  item: any, 
  isActive: boolean, 
  onClick: () => void,
  index: number
}) => {
  const colors = [
    'bg-[#FF6B6B]', // Red
    'bg-[#4ECDC4]', // Teal
    'bg-[#FFE66D]', // Yellow
    'bg-[#FF9F43]', // Orange
    'bg-[#1DD1A1]', // Green
    'bg-[#54A0FF]', // Blue
    'bg-[#5F27CD]', // Purple
    'bg-[#EE5253]', // Rose
  ];
  
  const rotations = [-3, 2, -1, 3, -2, 1];
  const color = colors[index % colors.length];
  const rotation = rotations[index % rotations.length];
  const isRight = index % 2 === 0;

  return (
    <motion.div
      initial={{ x: isRight ? 100 : -100, opacity: 0, rotate: rotation - 10 }}
      animate={{ x: 0, opacity: 1, rotate: rotation }}
      transition={{ 
        delay: index * 0.05, 
        type: 'spring', 
        damping: 12, 
        stiffness: 100 
      }}
      whileHover={{ scale: 1.05, rotate: rotation * 1.5 }}
      whileTap={{ scale: 0.95 }}
      style={{ rotate: rotation }}
      className="relative my-2 w-full group cursor-pointer"
      onClick={onClick}
    >
      {/* The Sign Shape */}
      <div className={`
        relative py-3 px-8 shadow-xl transition-all duration-300
        ${color} ${isActive ? 'ring-4 ring-white ring-inset' : 'opacity-90 group-hover:opacity-100'}
        ${isRight 
          ? 'rounded-l-lg rounded-r-[40px] pr-12' 
          : 'rounded-r-lg rounded-l-[40px] pl-12'}
        border-2 border-black/10
      `}>
        {/* Wood Texture Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 21px)', mixBlendMode: 'overlay' }} />
        
        <div className={`flex items-center gap-3 relative z-10 ${isRight ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
          <item.icon 
            size={22} 
            className={`${isActive ? 'text-white' : 'text-black/60'} drop-shadow-md`} 
          />
          <span className={`
            text-lg font-[900] tracking-tight
            ${isActive ? 'text-white' : 'text-black/80'}
            drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]
          `}>
            {item.label}
          </span>
        </div>

        {/* Arrow Tip for Signpost Look */}
        <div className={`
          absolute top-0 bottom-0 w-8 bg-inherit border-y-2 border-black/10
          ${isRight ? 'right-0 rounded-r-full' : 'left-0 rounded-l-full'}
        `} />
      </div>

      {/* Nails */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-12 pointer-events-none opacity-40">
        <div className="w-2 h-2 rounded-full bg-slate-800 shadow-inner" />
        <div className="w-2 h-2 rounded-full bg-slate-800 shadow-inner" />
      </div>
    </motion.div>
  );
});

const App: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { siteConfig } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply global color
  React.useEffect(() => {
    if (siteConfig.globalColor) {
      document.documentElement.style.setProperty('--gt-accent', siteConfig.globalColor);
    }
  }, [siteConfig.globalColor]);

  const handleNavigation = useCallback((path: string, e?: React.MouseEvent) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    if (e) {
      const target = e.currentTarget.querySelector('.icon-wrapper') || e.currentTarget;
      target.classList.add('animate-bounce-click');
      setTimeout(() => {
        target.classList.remove('animate-bounce-click');
      }, 200);
    }

    navigate(path);
    setIsDrawerOpen(false);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  // Global Progress Bar Function
  React.useEffect(() => {
    (window as any).updateProgressBar = (percent: number) => {
      const bar = document.getElementById('global-progress-bar');
      if (bar) {
        bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      }
    };
  }, []);

  // Apply H1 Global Styles
  React.useEffect(() => {
    if (siteConfig.h1Styles) {
      const { 
        fontSize, color, align, weight, glassBlur, glassOpacity, fontFamily, showGlass,
        letterSpacing, color1, color2, gradAngle, strokeWidth, strokeColor, glowSize, glowColor
      } = siteConfig.h1Styles;
      const root = document.documentElement;
      if (fontSize) root.style.setProperty('--h1-font-size', fontSize);
      if (color) root.style.setProperty('--h1-color', color);
      if (align) root.style.setProperty('--h1-align', align);
      if (weight) root.style.setProperty('--h1-weight', weight);
      if (fontFamily) root.style.setProperty('--h1-font-family', fontFamily);
      if (letterSpacing) root.style.setProperty('--h1-letter-spacing', letterSpacing);
      
      // Gradient & Stroke
      if (color1) root.style.setProperty('--h1-color-1', color1);
      if (color2) root.style.setProperty('--h1-color-2', color2);
      if (gradAngle) {
        const angle = gradAngle.toString().replace('deg', '');
        root.style.setProperty('--h1-grad-angle', `${angle}deg`);
      }
      if (strokeWidth) root.style.setProperty('--h1-stroke-width', `${strokeWidth}px`);
      if (strokeColor) root.style.setProperty('--h1-stroke-color', strokeColor);
      
      // Glow
      if (glowSize) root.style.setProperty('--h1-glow-size', `${glowSize}px`);
      if (glowColor) root.style.setProperty('--h1-glow-color', glowColor);
      
      if (showGlass === false) {
        root.style.setProperty('--h1-glass-blur', '0px');
        root.style.setProperty('--h1-glass-bg', 'transparent');
        root.style.setProperty('--h1-glass-border', 'none');
        root.style.setProperty('--h1-glass-shadow', 'none');
      } else {
        root.style.setProperty('--h1-glass-blur', `${glassBlur || '10'}px`);
        root.style.setProperty('--h1-glass-bg', `rgba(255, 255, 255, ${glassOpacity || '0.2'})`);
        root.style.setProperty('--h1-glass-border', '1px solid rgba(255, 255, 255, 0.2)');
        root.style.setProperty('--h1-glass-shadow', '0 8px 32px rgba(0, 0, 0, 0.2)');
      }
    }
  }, [siteConfig.h1Styles]);

  if (!currentUser) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  const navItems = [
    { path: '/', icon: Home, label: 'בית' },
    { path: '/directory', icon: Users, label: 'נבחרת הגלישה' },
    { path: '/gallery', icon: ImageIcon, label: 'גלריית תמונות' },
    { path: '/events', icon: Calendar, label: 'אירועים קרובים' },
    { path: '/posts', icon: Newspaper, label: 'פוסטים ועדכונים' },
    { path: '/world-news', icon: Globe, label: 'חדשות מהעולם' },
    { path: '/surfer-card', icon: Trophy, label: 'דשבורד' },
    { path: '/profile', icon: UserCircle, label: 'פרופיל אישי' }
  ];

  const adminNavItems = [
    { path: '/admin', icon: Settings, label: 'פאנל ניהול' },
    { path: '/admin-info', icon: BarChart3, label: 'דופק חבל זוג' },
    { path: '/attendance', icon: Users, label: 'יומן סשנים' },
    { path: '/admin-rollover', icon: Activity, label: 'דו"ח יום חמישי' }
  ];

  const isDirectoryPage = location.pathname === '/directory';

  return (
    <div className="min-h-screen flex flex-col font-['Assistant'] relative" dir="rtl">
      {/* Global Wallpaper for Directory Page */}
      <AnimatePresence>
        {isDirectoryPage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: 'url("https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fsurfers_hut.jpg?alt=media")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'brightness(0.9) contrast(1.05)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Global Progress Bar */}
      <div id="global-progress-container">
        <div id="global-progress-bar"></div>
      </div>

      {/* Hamburger Button (Top Left) */}
      <div className="fixed top-6 left-6 z-[10000]">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md border border-white/40 shadow-xl flex items-center justify-center text-[var(--sand-dark)] hover:text-[var(--sand-accent)] transition-all hover:scale-110 active:scale-95"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Drawer Menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[10001]"
            />
            
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[320px] bg-[#f8f1e5] z-[10002] shadow-2xl flex flex-col overflow-hidden"
              style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/sandpaper.png")',
              }}
            >
              {/* The Pole */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-[#8d6e63] shadow-[inset_-4px_0_8px_rgba(0,0,0,0.3),inset_4px_0_8px_rgba(255,255,255,0.1)] z-0">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.2) 41px)' }} />
              </div>

              {/* Crazy Seagull Decoration */}
              <motion.div 
                animate={{ 
                  y: [0, -5, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
              >
                <div className="relative">
                  <span className="text-4xl">🐦</span>
                  <div className="absolute -top-4 -right-4 bg-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm border border-slate-100 rotate-12">
                    MINE!
                  </div>
                </div>
              </motion.div>

              {/* Drawer Header */}
              <div className="p-8 pt-16 pb-4 flex items-center justify-between relative z-10">
                <div className="flex flex-col items-center w-full gap-2">
                  <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-[var(--sand-accent)] border-4 border-[#8d6e63] relative overflow-hidden group">
                    <Waves size={32} className="group-hover:animate-bounce" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-sky-400/30 backdrop-blur-sm" />
                  </div>
                  <span className="text-2xl font-black text-[#5d4037] tracking-tighter drop-shadow-sm">Body-line</span>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/50 hover:bg-white text-[#5d4037] transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 px-4 py-8 flex flex-col gap-1 overflow-y-auto relative z-10 custom-scrollbar">
                <div className="mb-6 text-center">
                  <span className="px-4 py-1 bg-[#d4a373] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                    בחר יעד
                  </span>
                </div>
                
                {navItems.map((item, idx) => (
                  <SignpostLink 
                    key={item.path}
                    item={item}
                    index={idx}
                    isActive={location.pathname === item.path}
                    onClick={() => handleNavigation(item.path)}
                  />
                ))}

                {currentUser.role === 'Admin' && (
                  <>
                    <div className="mt-12 mb-6 text-center">
                      <span className="px-4 py-1 bg-slate-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                        אזור מנהלים
                      </span>
                    </div>
                    {adminNavItems.map((item, idx) => (
                      <SignpostLink 
                        key={item.path}
                        item={item}
                        index={idx + navItems.length}
                        isActive={location.pathname === item.path}
                        onClick={() => handleNavigation(item.path)}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Profile Section */}
              <div className="p-6 bg-white/40 backdrop-blur-md border-t border-[#8d6e63]/20 relative z-10">
                {/* Sand and Sea effect at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-0 overflow-hidden">
                  <motion.div 
                    animate={{ x: [-20, 20, -20] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="absolute bottom-4 left-[-20%] w-[140%] h-8 bg-sky-400/20 rounded-[100%] blur-md" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#f4d03f]/40 blur-sm" />
                  <span className="absolute bottom-1 left-4 text-xl">🐚</span>
                  <span className="absolute bottom-2 right-8 text-xl rotate-12">⭐</span>
                </div>

                <div className="flex items-center gap-4 mb-6 px-2 relative z-10">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg ring-2 ring-[#d4a373]">
                    <img 
                      src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=D4A373&color=fff`} 
                      alt={`${currentUser.firstName} ${currentUser.lastName}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-[#5d4037]">{currentUser.firstName} {currentUser.lastName}</span>
                    <span className="text-[10px] font-bold text-[#8d6e63] uppercase tracking-widest">{currentUser.role}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-[#8d6e63] text-white font-black text-sm hover:bg-[#5d4037] transition-all shadow-lg group"
                >
                  <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                  <span>עזוב את החוף</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <FloatingMenu onOpenDrawer={() => setIsDrawerOpen(true)} />
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto pb-32 relative z-10">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/posts" element={<NewsPage />} />
              <Route path="/world-news" element={<SurfingNewsPage />} />
              <Route path="/surfer-card" element={<SurferCardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {currentUser.role === 'Admin' && (
                <>
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin-info" element={<AdminInfoPage />} />
                  <Route path="/admin-rollover" element={<AdminRolloverReport />} />
                  <Route path="/attendance" element={<SurfingSessionAttendance />} />
                </>
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
