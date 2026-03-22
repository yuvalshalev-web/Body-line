import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Image, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

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
      <div className="w-full flex justify-center">
        <div className={`flex items-center overflow-x-auto no-scrollbar gap-2 p-2 rounded-[2rem] ${theme === 'sunset' ? 'bg-orange-200/30' : 'bg-white/40'} backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/5 relative max-w-full touch-pan-x`}>
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.id && onChange(item.id)}
                className="relative group px-1 py-1 flex-shrink-0 outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 rounded-2xl ${
                      theme === 'sunset'
                        ? 'shadow-[0_4px_20px_rgba(249,115,22,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)]'
                        : 'shadow-[0_4px_20px_rgba(255,45,96,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)]'
                    } border-t border-white/80 border-l border-white/50 ${
                      theme === 'sunset' 
                        ? 'bg-gradient-to-br from-orange-500/80 to-rose-600/80' 
                        : 'bg-gradient-to-br from-[#FF2D60] to-[#E61E4D]'
                    } backdrop-blur-xl`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {/* Extra glass shine layer */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
                  </motion.div>
                )}
                <div className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 z-10 ${
                  isActive 
                    ? 'text-white font-black scale-105' 
                    : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-white/50 hover:shadow-sm'
                }`}>
                  <div className={`transition-transform duration-300 ${isActive ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] scale-110' : `text-slate-500 group-hover:scale-110 ${theme === 'sunset' ? 'group-hover:text-orange-500' : 'group-hover:text-[#FF2D60]'}`}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 18, strokeWidth: isActive ? 2.5 : 2 })}
                  </div>
                  <span className={`text-sm font-black tracking-tight whitespace-nowrap transition-all duration-300 ${isActive ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]' : ''}`}>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black shadow-md transition-all duration-300 ${
                      isActive 
                        ? `bg-white ${theme === 'sunset' ? 'text-orange-500' : 'text-[#FF2D60]'}` 
                        : `${theme === 'sunset' ? 'bg-orange-500' : 'bg-[#FF2D60]'} text-white group-hover:scale-110`
                    }`}>
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
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
