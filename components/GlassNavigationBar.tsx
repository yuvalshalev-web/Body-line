import React from 'react';
import { motion } from 'motion/react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface GlassNavigationBarProps {
  items: NavItem[];
  activeId: string;
  onChange: (id: string) => void;
}

const GlassNavigationBar: React.FC<GlassNavigationBarProps> = ({ items, activeId, onChange }) => {
  return (
    <div className="relative p-2 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex w-full max-w-4xl mx-auto bg-slate-900/5 backdrop-blur-xl">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-full transition-all duration-300 group relative z-10
              ${isActive 
                ? 'text-white scale-[1.02]' 
                : 'text-slate-400 hover:text-slate-900'
              }`}
          >
            {isActive && (
              <motion.div 
                layoutId="active-pill"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_8px_20px_rgba(6,182,212,0.3)] rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-600'}`}>
              {item.icon}
            </span>
            <span className="text-sm font-bold tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default GlassNavigationBar;
