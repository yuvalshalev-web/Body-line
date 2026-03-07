import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Home, Users, Image as ImageIcon, Calendar, Trophy, UserCircle, Settings, LogOut } from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/', icon: Home, label: 'בית' },
  { path: '/directory', icon: Users, label: 'נבחרת' },
  { path: '/gallery', icon: ImageIcon, label: 'גלרייה' },
  { path: '/events', icon: Calendar, label: 'אירועים' },
  { path: '/surfer-card', icon: Trophy, label: 'דאשבורד' },
  { path: '/profile', icon: UserCircle, label: 'פרופיל' },
  { path: '/settings', icon: Settings, label: 'הגדרות' },
];

const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[2000] backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-64 z-[2001] bg-[rgba(255,255,255,0.1)] backdrop-blur-[12px] border-l border-[rgba(255,255,255,0.2)] p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white text-xl font-bold">תפריט</h2>
              <button onClick={onClose} className="text-white/70 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className="flex items-center gap-4 text-white/80 hover:text-white p-3 rounded-xl hover:bg-[rgba(255,255,255,0.1)] transition-all"
                  >
                    <Icon size={24} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  // Handle logout
                  onClose();
                }}
                className="flex items-center gap-4 text-red-300 hover:text-red-100 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.1)] transition-all mt-8"
              >
                <LogOut size={24} />
                <span className="font-medium">התנתק</span>
              </button>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavigationDrawer;
