import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Menu as MenuIcon } from 'lucide-react';

interface FloatingMenuProps {
  scrollRef: React.RefObject<HTMLElement>;
  onLogout: () => void;
  onOpenDrawer: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ scrollRef, onOpenDrawer }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setShowScrollTop(scrollRef.current.scrollTop > 300);
      }
    };

    const mainElement = scrollRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [scrollRef]);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[10000] flex flex-col gap-4">
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-to-top"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl flex items-center justify-center text-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:bg-white/20 transition-all duration-300 group"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Menu Toggle */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={onOpenDrawer}
        className="w-16 h-16 bg-gradient-to-br from-blue-500/40 to-cyan-500/40 backdrop-blur-2xl border border-white/40 rounded-[24px] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] transition-all duration-500 relative group overflow-hidden"
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative flex flex-col items-center gap-1">
          <MenuIcon size={28} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-xs font-black uppercase tracking-widest leading-none">תפריט</span>
        </div>
      </motion.button>
    </div>
  );
};

export default FloatingMenu;
