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

// Lazy loaded components
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage.tsx'));
const GalleryPage = lazy(() => import('./pages/GalleryPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.tsx'));
const EventsPage = lazy(() => import('./pages/EventsPage.tsx'));
const NewsPage = lazy(() => import('./pages/NewsPage.tsx'));
const SurfingNewsPage = lazy(() => import('./pages/SurfingNewsPage.tsx'));
const AdminInfoPage = lazy(() => import('./pages/AdminInfoPage.tsx'));
const AdminRolloverReport = lazy(() => import('./pages/AdminRolloverReport.tsx'));
const SurferCardPage = lazy(() => import('./pages/SurferCardPage.tsx'));
const SurfingSessionAttendance = lazy(() => import('./pages/SurfingSessionAttendance.tsx'));
const SessionStatsPage = lazy(() => import('./pages/SessionStatsPage.tsx'));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <span className="font-black text-slate-400 text-xs uppercase tracking-widest">טוען דף...</span>
    </div>
  </div>
);

const NavLink = React.memo(({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: any, 
  isActive: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group w-full text-right relative overflow-hidden ${
      isActive 
        ? 'text-white shadow-lg shadow-[var(--sand-shadow)]/20 translate-x-1' 
        : 'text-[var(--sand-dark)] hover:bg-[var(--sand-light)]/10 hover:text-[var(--sand-accent)]'
    }`}
  >
    {isActive && (
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--sand-accent)] to-[var(--sand-medium)] z-0" />
    )}
    <div className="relative z-10 flex items-center gap-4 w-full">
      <item.icon 
        size={20} 
        className={isActive ? 'text-[var(--sand-light)]' : 'text-[var(--sand-muted)] opacity-60 group-hover:opacity-100 group-hover:text-[var(--sand-accent)] transition-colors'} 
      />
      <span className="flex-1">{item.label}</span>
      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--sand-light)] animate-pulse shadow-[0_0_8px_var(--sand-light)]" />}
    </div>
  </button>
));

const App: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { siteConfig } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Apply global color
  React.useEffect(() => {
    if (siteConfig.globalColor) {
      document.documentElement.style.setProperty('--gt-accent', siteConfig.globalColor);
    }
  }, [siteConfig.globalColor]);

  // Apply body class for bottom nav padding
  React.useEffect(() => {
    if (siteConfig.navPosition === 'floating-bottom') {
      document.body.classList.add('has-bottom-nav');
    } else {
      document.body.classList.remove('has-bottom-nav');
    }
  }, [siteConfig.navPosition]);

  const handleNavigation = useCallback((path: string, isMobile: boolean, e?: React.MouseEvent) => {
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
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const toggleMobileMenuWithHaptic = useCallback((e?: React.MouseEvent) => {
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

    toggleMobileMenu();
  }, [toggleMobileMenu]);

  const handleLogout = useCallback(() => {
    logout();
    setIsMobileMenuOpen(false);
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
      if (gradAngle) root.style.setProperty('--h1-grad-angle', `${gradAngle}deg`);
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
    { path: '/directory', icon: Users, label: 'נבחרת הכוכבים' },
    { path: '/gallery', icon: ImageIcon, label: 'גלריית תמונות' },
    { path: '/events', icon: Calendar, label: 'אירועים קרובים' },
    { path: '/posts', icon: Newspaper, label: 'פוסטים ועדכונים' },
    { path: '/world-news', icon: Globe, label: 'חדשות מהעולם' },
    { path: '/surfer-card', icon: Trophy, label: 'כרטיס הגולש שלי' },
    { path: '/profile', icon: UserCircle, label: 'פרופיל אישי' }
  ];

  const adminNavItems = [
    { path: '/admin', icon: Settings, label: 'פאנל ניהול' },
    { path: '/admin-info', icon: BarChart3, label: 'דופק חבל זוג' },
    { path: '/attendance', icon: Users, label: 'סנכרון נוכחות' },
    { path: '/admin-rollover', icon: Activity, label: 'דו"ח יום חמישי' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row-reverse font-['Assistant']" dir="rtl">
      {/* Global Progress Bar */}
      <div id="global-progress-container">
        <div id="global-progress-bar"></div>
      </div>

      {/* Mobile Header (Visible on all screens, but menu button hidden when floating-bottom is active) */}
      <header className={`h-16 flex items-center justify-between px-[var(--spacing-md)] transition-all duration-300 ${
        siteConfig.navPosition === 'standard' ? 'nav-standard sticky top-0 z-[100]' : 
        siteConfig.navPosition === 'floating-top' ? 'nav-floating-top' : 
        'nav-floating-bottom'
      }`}>
        <div className="flex items-center gap-[var(--spacing-xs)]">
          <div className="w-8 h-8 bg-[var(--sand-accent)] rounded-[var(--radius-sm)] flex items-center justify-center text-white shadow-md">
            <Waves size={20} className="text-[var(--sand-light)]" />
          </div>
          <span className="font-black text-[var(--sand-dark)] tracking-tighter">חבל זוג</span>
        </div>
        {siteConfig.navPosition !== 'floating-bottom' && (
          <button onClick={(e) => toggleMobileMenuWithHaptic(e)} className="p-2 text-[var(--sand-dark)]">
            <div className="icon-wrapper">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </div>
          </button>
        )}
      </header>

      {/* Bottom Navigation (Visible on all screens when floating-bottom is active) */}
      {siteConfig.navPosition === 'floating-bottom' && (
        <div className="bottom-nav-capsule metal-theme">
          {[navItems[0], navItems[1], navItems[2], navItems[3], navItems[6]].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.path}
                onClick={(e) => handleNavigation(item.path, true, e)}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="icon-wrapper">
                  <item.icon size={20} />
                </div>
                <span>{item.label === 'כרטיס הגולש שלי' ? 'כרטיס' : item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button 
            onClick={(e) => toggleMobileMenuWithHaptic(e)}
            className={`bottom-nav-item ${isMobileMenuOpen ? 'active' : ''}`}
          >
            <div className="icon-wrapper">
              <Menu size={20} />
            </div>
            <span>תפריט</span>
          </button>
        </div>
      )}

      {/* Desktop Sidebar (Hidden when floating-bottom is active) */}
      <aside className={`${siteConfig.navPosition === 'floating-bottom' ? 'hidden' : 'hidden md:flex'} flex-col w-64 bg-white border-l border-[var(--sand-medium)]/10 sticky top-0 h-screen z-50 p-[var(--spacing-md)] shadow-sm`}>
        <div className="flex items-center gap-[var(--spacing-xs)] mb-14">
          <div className="w-12 h-12 bg-[var(--sand-accent)] rounded-[var(--radius-md)] flex items-center justify-center text-white shadow-lg shadow-[var(--sand-shadow)]/20">
            <Waves size={28} className="text-[var(--sand-light)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--sand-dark)] tracking-tighter leading-none mb-1">חבל זוג</h1>
            <p className="text-[10px] font-black text-[var(--sand-muted)] uppercase tracking-[0.2em]">קהילת הגולשים</p>
          </div>
        </div>
        <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              item={item} 
              isActive={location.pathname === item.path}
              onClick={() => handleNavigation(item.path, false)}
            />
          ))}
          {currentUser.role === 'Admin' && (
            <div className="pt-8 mt-8 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 pr-4 mb-4">
                <ShieldAlert size={14} className="text-slate-400" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">פאנל ניהול</p>
              </div>
              {adminNavItems.map(item => (
                <NavLink 
                  key={item.path} 
                  item={item} 
                  isActive={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path, false)}
                />
              ))}
            </div>
          )}
        </nav>
        <div className="mt-auto pt-8 border-t border-slate-100">
          <div className="flex items-center gap-4 mb-8">
             {currentUser.avatar ? (
               <img src={currentUser.avatar} className="w-12 h-12 rounded-xl object-cover shadow-md border border-[var(--sand-medium)]/10" alt="" />
             ) : (
               <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[var(--sand-muted)] shadow-md border border-[var(--sand-medium)]/10">
                 <UserCircle size={24} />
               </div>
             )}
             <div className="flex-1 overflow-hidden">
                <p className="font-black text-[var(--sand-dark)] text-sm truncate">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-[9px] font-black text-[var(--sand-accent)] uppercase tracking-widest">
                  {currentUser.role === 'Admin' ? 'רכז' : currentUser.role === 'Instructor' ? 'מדריך' : 'חבר'}
                </p>
             </div>
          </div>
          <button onClick={handleLogout} className="metal-theme flex items-center gap-4 w-full px-6 py-4 text-[var(--metal-davys-gray)] font-black text-sm rounded-2xl hover:text-rose-500 hover:bg-[var(--metal-white-smoke)] transition-all group">
            <LogOut size={20} className="text-rose-500 group-hover:scale-110 transition-transform" /> התנתקות
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto bg-slate-50">
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

      {/* Mobile Menu Overlay (Visible on all screens when open) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[2000]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-6 flex flex-col z-[2001] ${
                siteConfig.navPosition !== 'standard' ? 'floating-menu-drawer' : ''
              }`}
            >
               <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                 <div className="flex items-center gap-4 overflow-hidden">
                   {currentUser.avatar ? (
                     <img src={currentUser.avatar} className="w-12 h-12 rounded-xl object-cover border border-[var(--sand-medium)]/10" alt="" />
                   ) : (
                     <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-[var(--sand-muted)] border border-[var(--sand-medium)]/10">
                       <UserCircle size={24} />
                     </div>
                   )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-[var(--sand-dark)] truncate">{currentUser.firstName} {currentUser.lastName}</p>
                      <p className="text-[10px] font-black text-[var(--sand-accent)] uppercase tracking-widest">
                        {currentUser.role === 'Admin' ? 'רכז' : currentUser.role === 'Instructor' ? 'מדריך' : 'חבר'}
                      </p>
                    </div>
                 </div>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                   <X size={24} />
                 </button>
               </div>
               <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                  {navItems.map(item => (
                    <NavLink 
                      key={item.path} 
                      item={item} 
                      isActive={location.pathname === item.path}
                      onClick={() => handleNavigation(item.path, true)}
                    />
                  ))}
                  {currentUser.role === 'Admin' && (
                    <div className="pt-6 mt-6 border-t border-slate-100 space-y-2">
                      <div className="px-6 mb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ניהול מערכת</p>
                      </div>
                      {adminNavItems.map(item => (
                        <NavLink 
                          key={item.path} 
                          item={item} 
                          isActive={location.pathname === item.path}
                          onClick={() => handleNavigation(item.path, true)}
                        />
                      ))}
                    </div>
                  )}
               </nav>
               <button onClick={handleLogout} className="metal-theme mt-6 flex items-center gap-4 px-6 py-4 text-[var(--metal-davys-gray)] font-black text-sm rounded-2xl hover:bg-[var(--metal-white-smoke)] hover:text-rose-600 transition-all group">
                 <LogOut size={20} className="text-rose-500 group-hover:scale-110 transition-transform" /> התנתקות
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
