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
        <div className={`flex items-center overflow-x-auto no-scrollbar gap-1.5 p-1.5 rounded-2xl ${theme === 'sunset' ? 'bg-orange-200/20' : 'bg-slate-200/20'} backdrop-blur-2xl border border-white/30 shadow-inner relative max-w-full touch-pan-x`}>
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.id && onChange(item.id)}
                className="relative group px-0.5 py-0.5 flex-shrink-0"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,1)] border-t border-white/60 border-l border-white/40 ${
                      theme === 'sunset' 
                        ? 'bg-gradient-to-br from-orange-500/60 to-rose-600/60' 
                        : 'bg-gradient-to-br from-indigo-500/60 to-purple-600/60'
                    } backdrop-blur-xl`}
                    initial={false}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                  >
                    {/* Extra glass shine layer */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                  </motion.div>
                )}
                <div className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all duration-300 z-10 ${
                  isActive 
                    ? 'text-white font-black scale-105' 
                    : 'text-slate-600 hover:text-slate-900 font-bold'
                }`}>
                  <div className={`${isActive ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]' : 'text-slate-500'}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                  </div>
                  <span className="text-sm font-black tracking-tight whitespace-nowrap">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black shadow-md ${
                      isActive ? 'bg-white text-slate-900' : 'bg-[#00AFC2] text-white'
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
