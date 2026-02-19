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
  ShieldAlert
} from 'lucide-react';

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
    className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group w-full text-right ${
      isActive 
        ? 'bg-slate-900 text-white shadow-xl translate-x-1' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <item.icon size={20} className={isActive ? 'text-indigo-400' : 'opacity-40 group-hover:opacity-100'} />
    <span>{item.label}</span>
  </button>
));

const App: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigation = useCallback((path: string, isMobile: boolean) => {
    navigate(path);
    if (isMobile) setIsMobileMenuOpen(false);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

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
    { path: '/directory', icon: Users, label: 'ספר חברים' },
    { path: '/gallery', icon: ImageIcon, label: 'גלריית תמונות' },
    { path: '/events', icon: Calendar, label: 'אירועים קרובים' },
    { path: '/posts', icon: Newspaper, label: 'פוסטים ועדכונים' },
    { path: '/world-news', icon: Globe, label: 'חדשות מהעולם' },
    { path: '/profile', icon: UserCircle, label: 'פרופיל אישי' }
  ];

  const adminNavItems = [
    { path: '/admin', icon: Settings, label: 'פאנל ניהול' },
    { path: '/admin-info', icon: BarChart3, label: 'סטטיסטיקה' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row-reverse font-['Assistant']" dir="rtl">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center text-white">
            <Waves size={20} />
          </div>
          <span className="font-black text-slate-900 tracking-tighter">חבל זוג</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-900">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[110] md:hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
               <img src={currentUser.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
               <div className="flex-1 overflow-hidden">
                 <p className="font-black text-slate-950 truncate">{currentUser.name}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentUser.role === 'Admin' ? 'מנהל' : 'חבר'}</p>
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
             <button onClick={handleLogout} className="mt-6 flex items-center gap-4 px-6 py-4 text-rose-500 font-black text-sm rounded-2xl hover:bg-rose-50 transition-all">
               <LogOut size={20} /> התנתקות
             </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-l border-slate-200 sticky top-0 h-screen z-50 p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-14">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg"><Waves size={28} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tighter leading-none mb-1">חבל זוג</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">קהילת הגולשים</p>
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
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">מנהלה</p>
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
             <img src={currentUser.avatar} className="w-12 h-12 rounded-xl object-cover shadow-md" alt="" />
             <div className="flex-1 overflow-hidden">
                <p className="font-black text-slate-950 text-sm truncate">{currentUser.name}</p>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{currentUser.role === 'Admin' ? 'מנהל' : 'חבר'}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-4 w-full px-6 py-4 text-slate-400 font-black text-sm rounded-2xl hover:text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={20} /> התנתקות
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto bg-slate-50">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/posts" element={<NewsPage />} />
            <Route path="/world-news" element={<SurfingNewsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {currentUser.role === 'Admin' && (
              <>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin-info" element={<AdminInfoPage />} />
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