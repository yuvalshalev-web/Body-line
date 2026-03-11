import React from 'react';
import { motion } from 'motion/react';

export const AngryBird: React.FC<{ className?: string; delay?: number }> = ({ className = "", delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`relative flex flex-col items-center ${className}`}
    >
      {/* Angry Bird Image */}
      <motion.img 
        src="https://upload.wikimedia.org/wikipedia/en/f/f9/Angry_Birds_Red.png"
        alt="Angry Bird"
        className="w-28 h-28 drop-shadow-2xl object-contain"
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2, 
          ease: "easeInOut" 
        }}
        referrerPolicy="no-referrer"
      />

      {/* Speech Bubble */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: 1 }}
        transition={{ delay: delay + 0.8, duration: 0.4 }}
        className="absolute -top-10 -right-8 bg-white px-4 py-1.5 rounded-full border-2 border-slate-300 shadow-lg z-30"
      >
        <span className="text-xs font-black text-slate-900 tracking-tighter uppercase">Grrr!</span>
        {/* Bubble Tail */}
        <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-white border-r-2 border-b-2 border-slate-300 rotate-45" />
      </motion.div>
    </motion.div>
  );
};
