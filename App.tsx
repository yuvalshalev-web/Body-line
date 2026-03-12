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
import { AngryBird } from './components/AngryBird';


import { WoodSignLinkV2 as WoodSignLink } from './components/WoodSignLink';
import { RespectLocalsSign } from './components/RespectLocalsSign';
import { SignPost } from './components/SignPost';
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  const menuItems = surferMenuConfig.menu_items;

  // Map the original nav items to the new menu config based on index or logic
  // For now, we'll just use the first 8 items from the config for the main nav
  // and the next 4 for admin nav, to keep the routing intact while changing the visuals.
  const navItems = [
    { path: '/', ...menuItems[0], text: 'דף הבית' },
    { path: '/directory', ...menuItems[1], text: 'נבחרת הכוכבים' },
    { path: '/gallery', ...menuItems[2], text: 'גלריית תמונות' },
    { path: '/events', ...menuItems[3], text: 'אירועים' },
    { path: '/posts', ...menuItems[4], text: 'פוסטים ועדכונים' },
    { path: '/world-news', ...menuItems[5], text: 'חדשות מהעולם' },
    { path: '/surfer-card', ...menuItems[6], text: 'דשבורד אישי' },
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
              className="fixed top-0 right-0 bottom-0 w-[85%] sm:w-[60%] md:w-[50%] max-w-[400px] z-[10002] shadow-2xl flex flex-col floating-menu-drawer"
              style={{
                backgroundImage: 'url("/src/assets/wood-texture.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="w-full h-full flex flex-col relative bg-transparent backdrop-blur-[2px]">
                {/* Wood Pole in Drawer - Centered absolutely behind everything */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-[88%] pointer-events-none -z-10 opacity-80">
                  <SignPost className="h-full w-full" />
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/50 hover:bg-white text-[#5d4037] transition-all shadow-sm z-30"
                >
                  <X size={20} />
                </button>

                {/* Navigation Items & Signs */}
                <div className="flex-1 px-6 pt-16 pb-24 flex flex-col items-center gap-0 overflow-y-auto relative z-10 custom-scrollbar">
                  {/* Respect the Locals Sign at the top of the list */}
                  <div className="scale-50 -my-20 relative flex flex-col items-center mb-0">
                    <RespectLocalsSign />
                    {/* Nail for the diamond sign */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#2a2a2a] shadow-lg z-20" />
                  </div>

                  {navItems.map((item, idx) => (
                    <div key={item.path} className="relative w-full max-w-[280px] flex justify-center overflow-visible">
                      {idx === 0 && (
                        <div className="absolute -top-17 -left-3 z-[10000] pointer-events-none scale-[0.6375]">
                          <AngryBird delay={0.5} />
                        </div>
                      )}
                      <WoodSignLink 
                        item={item}
                        index={idx}
                        isActive={location.pathname === item.path}
                        onClick={() => handleNavigation(item.path)}
                      />
                    </div>
                  ))}

                  {(currentUser.role === 'Admin' || currentUser.role === 'Instructor') && (
                    <>
                      <div className="mt-8 mb-4 w-full text-center">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider bg-transparent border border-white/20 px-3 py-1 rounded-full">
                          אזור צוות
                        </span>
                      </div>
                      {adminNavItems.map((item, idx) => (
                        <div key={item.path} className="relative w-full max-w-[280px] flex justify-center overflow-visible">
                          <WoodSignLink 
                            item={item}
                            index={idx + navItems.length}
                            isActive={location.pathname === item.path}
                            onClick={() => handleNavigation(item.path)}
                          />
                        </div>
                      ))}
                    </>
                  )}

                  {/* Exit Wave (Logout) Sign */}
                  <div className="mt-8 w-full max-w-[280px] flex justify-center overflow-visible">
                    <WoodSignLink 
                      item={{ 
                        id: 999,
                        text: 'גל יציאה', 
                        icon: '🚪',
                        color: '#5d4037',
                        direction: 'left',
                        rotation: -2
                      }}
                      index={navItems.length + adminNavItems.length + 1}
                      isActive={false}
                      onClick={handleLogout}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <FloatingMenu onOpenDrawer={() => setIsDrawerOpen(true)} />
      <main className={`flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto pb-32 relative z-10 ${location.pathname === '/profile' ? 'profile-page-bg' : ''}`}>
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
            {(currentUser.role === 'Admin' || currentUser.role === 'Instructor') && (
              <>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin-info" element={<AdminInfoPage />} />
                <Route path="/attendance" element={<SurfingSessionAttendance />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
