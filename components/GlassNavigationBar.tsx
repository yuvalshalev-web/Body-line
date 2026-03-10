import React from 'react';
import { motion } from 'motion/react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface GlassNavigationBarProps {
  items: NavItem[];
  activeId: string;
  onChange: (id: string) => void;
  theme?: 'ocean' | 'sunset' | 'emerald';
}

const themeStyles = {
  ocean: {
    container: 'shadow-[0_8px_32px_0_rgba(0,201,255,0.25)] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10',
    activePill: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 shadow-cyan-500/30',
    textHover: 'hover:text-cyan-700',
    iconHover: 'group-hover:text-cyan-600',
    badgeActive: 'bg-yellow-400 text-blue-900',
    badgeInactive: 'bg-pink-500 text-white',
  },
  sunset: {
    container: 'shadow-[0_8px_32px_0_rgba(251,146,60,0.25)] bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10',
    activePill: 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 shadow-orange-500/30',
    textHover: 'hover:text-orange-700',
    iconHover: 'group-hover:text-orange-600',
    badgeActive: 'bg-cyan-300 text-orange-900',
    badgeInactive: 'bg-rose-500 text-white',
  },
  emerald: {
    container: 'shadow-[0_8px_32px_0_rgba(52,211,153,0.25)] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10',
    activePill: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 shadow-emerald-500/30',
    textHover: 'hover:text-emerald-700',
    iconHover: 'group-hover:text-emerald-600',
    badgeActive: 'bg-yellow-300 text-emerald-900',
    badgeInactive: 'bg-cyan-500 text-white',
  }
};

const GlassNavigationBar: React.FC<GlassNavigationBarProps> = ({ items, activeId, onChange, theme = 'ocean' }) => {
  const currentTheme = themeStyles[theme];

  return (
    <motion.div 
      drag
      whileDrag={{ scale: 1.02, zIndex: 100000 }}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      className={`relative p-2 !rounded-[2rem] overflow-hidden glass-panel flex w-full max-w-5xl mx-auto overflow-x-auto no-scrollbar border border-white/30 backdrop-blur-xl cursor-grab active:cursor-grabbing ${currentTheme.container}`}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-3 py-4 rounded-full transition-all duration-300 group relative z-10
              ${isActive 
                ? 'text-white scale-[1.02]' 
                : `text-slate-600 ${currentTheme.textHover}`
              }`}
          >
            {isActive && (
              <motion.div 
                layoutId="active-pill"
                className={`absolute inset-0 shadow-lg rounded-full -z-10 ${currentTheme.activePill}`}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative">
              <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : `text-slate-500 ${currentTheme.iconHover}`}`}>
                {item.icon}
              </span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black border-2 border-white/50 shadow-sm ${
                  isActive ? currentTheme.badgeActive : currentTheme.badgeInactive
                }`}>
                  {item.count}
                </span>
              )}
            </div>
            <span className="text-sm font-bold tracking-tight font-['Yehuda_CLM'] whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
};

export default GlassNavigationBar;
