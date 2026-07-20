import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Menu as MenuIcon } from 'lucide-react';

interface FloatingMenuProps {
  scrollRef: React.RefObject<HTMLElement>;
  onLogout: () => void;
  onOpenDrawer: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ scrollRef, onOpenDrawer, onLogout }) => {
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
        className="w-16 h-16 bg-gradient-to-br from-slate-900/80 to-[#004266]/80 backdrop-blur-3xl border border-white/20 rounded-[24px] flex items-center justify-center text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_70px_rgba(0,0,0,0.6)] transition-all duration-500 relative group overflow-hidden"
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition duration-700" />
        
        <div className="relative flex flex-col items-center gap-1.5">
          <div className="flex flex-col gap-1.5 items-center group-hover:scale-110 transition-transform duration-500">
            <motion.div 
              className="w-7 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              animate={{ width: [28, 20, 28] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="w-5 h-1 bg-white/90 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              animate={{ width: [20, 28, 20] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.div 
              className="w-8 h-1 bg-white/80 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.2)]"
              animate={{ width: [32, 24, 32] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mt-1 text-white/90 drop-shadow-md">תפריט</span>
        </div>
      </motion.button>
    </div>
  );
};

export default FloatingMenu;
