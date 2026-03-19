import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Image, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface GlassNavigationBarProps {
  items?: { id?: string; path?: string; label: string; icon: React.ReactNode; count?: number }[];
  activeId?: string;
  onChange?: (id: string) => void;
  theme?: string;
}

const GlassNavigationBar: React.FC<GlassNavigationBarProps> = ({ items, activeId, onChange, theme }) => {
  const { logout, currentUser } = useAuth();
  const location = useLocation();

  // Mode 1: Tab Bar (used in Admin pages)
  if (items && onChange) {
    return (
      <div className={`flex overflow-x-auto hide-scrollbar gap-2 p-2 rounded-2xl ${theme === 'sunset' ? 'bg-orange-50/50' : 'bg-white/50'} backdrop-blur-md border border-white/20 shadow-sm`}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => item.id && onChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-sm font-black scale-105' 
                  : 'text-slate-600 hover:bg-white/60 font-bold hover:text-slate-900'
              }`}
            >
              <div className={`${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                {item.icon}
              </div>
              <span className="text-sm">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Mode 2: Bottom Navigation Bar (default)
  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'ראשי' },
    { path: '/directory', icon: <Users size={20} />, label: 'חברים' },
    { path: '/gallery', icon: <Image size={20} />, label: 'גלריה' },
  ];

  if (currentUser?.role === 'Admin') {
    navItems.push({ path: '/admin', icon: <Settings size={20} />, label: 'ניהול' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 pb-safe">
      <div className="flex justify-around items-center p-2 max-w-md mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              location.pathname === item.path
                ? 'text-slate-900 bg-slate-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-[10px] mt-1 font-medium">התנתק</span>
        </button>
      </div>
    </nav>
  );
};

export default GlassNavigationBar;
