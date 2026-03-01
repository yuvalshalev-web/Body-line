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
    <div className="relative p-2 rounded-[2rem] overflow-hidden border border-slate-200 shadow-soft flex w-full max-w-4xl mx-auto bg-[#F5F7FA]">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-full transition-all duration-300 group relative z-10
              ${isActive 
                ? 'text-white scale-[1.02]' 
                : 'text-[#4A5568] hover:text-[#2D3748]'
              }`}
          >
            {isActive && (
              <motion.div 
                layoutId="active-pill"
                className="absolute inset-0 bg-gradient-to-r from-[#1A365D] to-[#63B3ED] shadow-md rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#4A5568] group-hover:text-[#1A365D]'}`}>
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
