import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Image as ImageIcon, Calendar, Trophy, UserCircle, LogOut, Newspaper, Menu } from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingMenuProps {
  onOpenDrawer: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ onOpenDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'בית' },
    { path: '/directory', icon: Users, label: 'נבחרת' },
    { path: '/gallery', icon: ImageIcon, label: 'גלרייה' },
    { path: '/events', icon: Calendar, label: 'אירועים' },
    { path: '/surfer-card', icon: Trophy, label: 'דאשבורד' },
    { path: '/profile', icon: UserCircle, label: 'פרופיל' }
  ];

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:w-max md:mx-auto z-[9999] 
                 bg-[var(--sand-light)]/85 backdrop-blur-xl border border-[var(--sand-medium)]/40 
                 rounded-[24px] p-3 shadow-2xl flex items-center gap-2"
    >
      <nav className="flex justify-between items-center gap-2">
        {/* Profile Item */}
        {menuItems.slice().reverse().map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 px-3 rounded-2xl transition-all ${
                isActive 
                  ? 'bg-[var(--sand-accent)] text-white shadow-md' 
                  : 'text-[var(--sand-dark)] hover:text-[var(--sand-deep)] hover:bg-[var(--sand-medium)]/10'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-black">{item.label}</span>
            </button>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-1 p-2 px-3 rounded-2xl text-[var(--sand-dark)] hover:bg-[var(--sand-medium)]/10 transition-all"
        >
          <Menu size={20} />
          <span className="text-[10px] font-black">תפריט</span>
        </button>
      </nav>
    </motion.div>
  );
};

export default FloatingMenu;
