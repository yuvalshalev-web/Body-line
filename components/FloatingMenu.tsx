import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Image as ImageIcon, Calendar, Trophy, UserCircle, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import NavigationDrawer from './NavigationDrawer';

const menuItems = [
  { path: '/', icon: Home, label: 'בית' },
  { path: '/directory', icon: Users, label: 'נבחרת' },
  { path: '/gallery', icon: ImageIcon, label: 'גלרייה' },
  { path: '/events', icon: Calendar, label: 'אירועים' },
  { path: '/surfer-card', icon: Trophy, label: 'דאשבורד' },
  { path: '/profile', icon: UserCircle, label: 'פרופיל' }
];

const FloatingMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:w-max md:mx-auto z-[9999] 
                   bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.2)] 
                   rounded-[16px] p-3 shadow-lg flex items-center gap-2"
      >
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-[rgba(255,255,255,0.1)] transition-all"
        >
          <Menu size={24} />
        </button>
        <nav className="flex justify-between items-center gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isActive ? 'text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.div>
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

export default FloatingMenu;
