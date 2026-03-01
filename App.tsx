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
  Trophy
} from 'lucide-react';


import ErrorBoundary from './components/ErrorBoundary';

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

  // Apply body class for bottom nav padding
  React.useEffect(() => {
    if (siteConfig.navPosition === 'bottom') {
      document.body.classList.add('has-bottom-nav');
    } else {
      document.body.classList.remove('has-bottom-nav');
    }
  }, [siteConfig.navPosition]);

  const handleNavigation = useCallback((path: string, isMobile: boolean) => {
    navigate(path);
    if (isMobile) setIsMobileMenuOpen(false);
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
    { path: '/', icon: Home, label: 'דף הבית' },
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
    { path: '/attendance', icon: Users, label: 'סנכרון נוכחות' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row-reverse font-['Assistant']" dir="rtl">
      {/* Global Progress Bar */}
      <div id="global-progress-container">
        <div id="global-progress-bar"></div>
      </div>

      {/* Mobile Header */}
      <header className={`md:hidden bg-white border-b border-[var(--sand-medium)]/10 h-16 flex items-center justify-between px-[var(--spacing-md)] sticky top-0 z-[100] shadow-sm ${siteConfig.navPosition === 'bottom' ? 'is-bottom-nav' : ''}`}>
        <div className="flex items-center gap-[var(--spacing-xs)]">
          <div className="w-8 h-8 bg-[var(--sand-accent)] rounded-[var(--radius-sm)] flex items-center justify-center text-white shadow-md">
            <Waves size={20} className="text-[var(--sand-light)]" />
          </div>
          <span className="font-black text-[var(--sand-dark)] tracking-tighter">חבל זוג</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[var(--sand-dark)]">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[2000] md:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
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
                    {currentUser.role === 'Admin' ? 'מנהל' : currentUser.role === 'Instructor' ? 'מדריך' : 'חבר'}
                  </p>
                </div>
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
          </div>
        </div>
      )}

      {/* Bottom Navigation (Mobile Only, when active) */}
      {siteConfig.navPosition === 'bottom' && (
        <div className="md:hidden bottom-nav-capsule metal-theme">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.path}
                onClick={() => handleNavigation(item.path, true)}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="icon-wrapper">
                  <item.icon size={20} />
                </div>
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(true);
            }}
            className={`bottom-nav-item ${isMobileMenuOpen ? 'active' : ''}`}
          >
            <div className="icon-wrapper">
              <Menu size={20} />
            </div>
            <span>תפריט</span>
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-l border-[var(--sand-medium)]/10 sticky top-0 h-screen z-50 p-[var(--spacing-md)] shadow-sm">
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
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">מרכז ניהול</p>
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
                  {currentUser.role === 'Admin' ? 'מנהל' : currentUser.role === 'Instructor' ? 'מדריך' : 'חבר'}
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
