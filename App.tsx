import React, { useState, useCallback, lazy, Suspense } from 'react';
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


import { WoodSignLink } from './components/WoodSignLink';
import surferMenuConfig from './surfer_menu_config.json';
import { motion, AnimatePresence } from 'motion/react';
import ErrorBoundary from './components/ErrorBoundary';
import FloatingMenu from './components/FloatingMenu';

// Lazy loaded components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
import ProfilePage from './pages/ProfilePage';
const AdminPage = lazy(() => import('./pages/AdminPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const SurfingNewsPage = lazy(() => import('./pages/SurfingNewsPage'));
const AdminInfoPage = lazy(() => import('./pages/AdminInfoPage'));
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
      <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
    );
  }

  const menuItems = surferMenuConfig.menu_items;

  // Map the original nav items to the new menu config based on index or logic
  // For now, we'll just use the first 8 items from the config for the main nav
  // and the next 4 for admin nav, to keep the routing intact while changing the visuals.
  const navItems = [
    { path: '/', ...menuItems[0], text: 'דף הבית' },
    { path: '/directory', ...menuItems[1], text: 'נבחרת הכוכבים:' },
    { path: '/gallery', ...menuItems[2], text: 'ליינאפ התמונות' },
    { path: '/events', ...menuItems[3], text: 'אירועים' },
    { path: '/posts', ...menuItems[4], text: 'פוסטים ועדכונים' },
    { path: '/world-news', ...menuItems[5], text: 'חדשות מהעולם' },
    { path: '/surfer-card', ...menuItems[6], text: 'דשבורד' },
    { path: '/profile', ...menuItems[7], text: 'פרופיל אישי' }
  ];

  const adminNavItems = [
    { path: '/admin', ...menuItems[8], text: 'פאנל ניהול' },
    { path: '/admin-info', ...menuItems[9], text: 'דופק חבל זוג' },
    { path: '/attendance', ...menuItems[10], text: 'יומן סשנים' }
  ];

  return (
    <div className="min-h-screen flex flex-col font-['Yehuda_CLM'] relative" dir="rtl">
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
              className="fixed top-0 right-0 bottom-0 w-[85%] sm:w-[60%] md:w-[50%] max-w-[400px] bg-white/10 backdrop-blur-xl border-l border-white/20 z-[10002] shadow-2xl flex flex-col floating-menu-drawer"
              style={{}}
            >
              <div className="w-full h-full flex flex-col relative">
                {/* Vertical Wooden Post - Full Height */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 z-0 pointer-events-none"
                     style={{
                       background: '#5d4037',
                       boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 5px 0 15px rgba(0,0,0,0.3)',
                       borderLeft: '2px solid rgba(0,0,0,0.3)',
                       borderRight: '2px solid rgba(255,255,255,0.1)',
                       backgroundImage: `
                         linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.4) 100%),
                         url("data:image/svg+xml,%3Csvg viewBox='0 0 100 1000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E")
                       `,
                       backgroundSize: '100% 100%'
                     }}
                >
                  {/* Wood Grain */}
                  <div className="absolute inset-0 opacity-40 mix-blend-multiply" 
                       style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.2) 5px, rgba(0,0,0,0.2) 6px)' }} />
                  
                  {/* Knots and cracks */}
                  <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-4 h-6 rounded-full bg-black/20 blur-[1px]" />
                  <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-3 h-8 rounded-full bg-black/25 blur-[1px]" />
                  <div className="absolute top-[75%] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-black/20 blur-[1px]" />
                  
                  {/* Nails at top and bottom */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-800 shadow-inner" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-800 shadow-inner" />
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
                  <div className="flex flex-col items-center w-full gap-0">
                    <div 
                      className="relative w-24 h-24 flex items-center justify-center group cursor-pointer"
                    >
                      {/* Diamond Sign Background */}
                      <div className="absolute inset-0 bg-[#F5A623] rounded-[15px] border-[3px] border-black transform rotate-45 shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:rotate-[40deg] group-hover:scale-105"
                           style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%, 0% 5%)' }}>
                        
                        {/* Rust spots - more and darker */}
                        <div className="absolute top-1 left-1 w-5 h-5 bg-orange-950/40 rounded-full blur-[2px]" />
                        <div className="absolute bottom-2 right-1 w-7 h-7 bg-orange-950/30 rounded-full blur-[3px]" />
                        <div className="absolute top-6 right-8 w-4 h-4 bg-orange-950/50 rounded-full blur-[1px]" />
                        <div className="absolute bottom-8 left-4 w-3 h-3 bg-orange-950/40 rounded-full blur-[1px]" />
                        
                        {/* Cracks */}
                        <div className="absolute top-[20%] left-[10%] w-[80%] h-[2px] bg-black/30 rotate-12" />
                        <div className="absolute top-[60%] left-[20%] w-[60%] h-[2px] bg-black/30 -rotate-6" />
                        
                        <div className="absolute inset-1 border-[2px] border-black rounded-lg"></div>
                      </div>
                      
                      {/* Content (un-rotated) */}
                      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pt-1">
                        {/* Shark SVG */}
                        <svg viewBox="0 0 120 60" className="w-16 h-10 drop-shadow-md transform group-hover:-translate-y-1 transition-transform duration-300">
                          {/* Tail */}
                          <path d="M 90 30 C 100 20 110 10 115 15 C 105 25 95 30 95 30 C 95 30 105 40 110 45 C 100 45 95 35 90 30 Z" fill="#1A4B6E" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
                          
                          {/* Body White */}
                          <path d="M 10 35 C 30 20 60 20 95 30 C 80 45 40 50 10 35 Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
                          
                          {/* Body Blue */}
                          <path d="M 10 35 C 30 20 60 20 95 30 C 70 32 40 38 10 35 Z" fill="#1A4B6E" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
                          
                          {/* Dorsal Fin */}
                          <path d="M 45 23 C 50 5 55 10 60 24 Z" fill="#1A4B6E" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
                          
                          {/* Pectoral Fin */}
                          <path d="M 40 38 C 35 55 45 50 50 42 Z" fill="#1A4B6E" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
                          
                          {/* Eye */}
                          <circle cx="20" cy="30" r="1.5" fill="white" />
                          <circle cx="20" cy="30" r="0.5" fill="black" />
                          
                          {/* Gills */}
                          <path d="M 32 28 L 30 34 M 35 28 L 33 35 M 38 29 L 36 36" stroke="black" strokeWidth="1" fill="none" strokeLinecap="round" />
                          
                          {/* Mouth */}
                          <path d="M 12 37 C 18 39 25 38 25 38" stroke="black" strokeWidth="1" fill="none" />
                        </svg>
                        
                        {/* Text */}
                        <div className="flex flex-col items-center leading-none mt-[-2px] z-10">
                          <span className="text-[11px] font-black text-white uppercase tracking-tight" style={{ WebkitTextStroke: '1.5px black', paintOrder: 'stroke fill' }}>Respect The</span>
                          <span className="text-[14px] font-black text-white uppercase tracking-tight" style={{ WebkitTextStroke: '1.5px black', paintOrder: 'stroke fill' }}>Locals</span>
                        </div>
                      </div>
                    </div>
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
                  <div className="mb-6 text-center relative z-10">
                    <span className="px-4 py-1 bg-[#d4a373] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm" style={{ fontFamily: 'Yehuda CLM' }}>
                      בחר יעד
                    </span>
                  </div>
                  
                  {navItems.map((item, idx) => (
                    <WoodSignLink 
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
                        <span className="px-4 py-1 bg-slate-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm" style={{ fontFamily: 'Yehuda CLM' }}>
                          אזור מנהלים
                        </span>
                      </div>
                      {adminNavItems.map((item, idx) => (
                        <WoodSignLink 
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
                <div className="p-6 bg-transparent backdrop-blur-none border-t border-[#8d6e63]/20 relative z-10">
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

                  <WoodSignLink 
                    item={{...menuItems[12], text: 'גל יציאה'}}
                    index={navItems.length + adminNavItems.length}
                    isActive={false}
                    onClick={handleLogout}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <FloatingMenu onOpenDrawer={() => setIsDrawerOpen(true)} />
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto pb-32 relative z-10">
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
                  <Route path="/attendance" element={<SurfingSessionAttendance />} />
                </>
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
      </main>
    </div>
  );
};

export default App;
