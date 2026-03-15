import React from 'react';
import { motion } from 'motion/react';

export const AngryBird: React.FC<{ className?: string; delay?: number }> = ({ className = "", delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 1, scale: 0.5, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={`relative flex flex-col items-center origin-bottom z-[10000] ${className}`}
    >
      {/* Angry Bird SVG - Inline to guarantee rendering */}
      <div className="relative w-[90px] h-[90px]">
        <motion.svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-2xl relative z-[10000]"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, -2, 2, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3, 
            ease: "easeInOut" 
          }}
        >
          {/* Tail Feathers */}
          <path d="M 15 55 L 5 50 L 10 60 Z" fill="#331111" />
          <path d="M 12 60 L 2 65 L 10 70 Z" fill="#331111" />
          <path d="M 15 65 L 5 75 L 15 75 Z" fill="#331111" />

          {/* Body */}
          <path d="M 50 15 C 25 15 15 35 15 60 C 15 90 35 95 60 95 C 90 95 95 75 95 50 C 95 25 75 15 50 15 Z" fill="#e23e33" />
          
          {/* Head Feathers */}
          <path d="M 45 18 C 40 5 55 0 55 15 Z" fill="#e23e33" />
          <path d="M 55 18 C 55 5 70 8 65 20 Z" fill="#e23e33" />

          {/* Belly */}
          <path d="M 30 75 C 35 90 75 95 90 75 C 90 65 75 60 55 65 C 35 70 30 70 30 75 Z" fill="#f1edd5" />

          {/* Spots */}
          <circle cx="35" cy="65" r="4" fill="#b12a21" opacity="0.6" />
          <circle cx="25" cy="68" r="3" fill="#b12a21" opacity="0.6" />
          <circle cx="30" cy="58" r="3" fill="#b12a21" opacity="0.6" />

          {/* Eyes */}
          <circle cx="58" cy="55" r="10" fill="white" />
          <circle cx="78" cy="58" r="9" fill="white" />
          
          {/* Pupils */}
          <circle cx="62" cy="55" r="2.5" fill="black" />
          <circle cx="80" cy="58" r="2.5" fill="black" />

          {/* Eyebrows */}
          <path d="M 45 42 L 70 52 L 92 45 L 92 55 L 70 60 L 45 52 Z" fill="#331111" />

          {/* Beak */}
          <path d="M 60 65 L 90 75 L 70 90 Z" fill="#ffde45" />
          <path d="M 60 65 L 90 75 L 75 75 Z" fill="#f59e0b" />
        </motion.svg>
      </div>

      {/* Speech Bubble */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ delay: delay + 0.8, duration: 0.4 }}
        className="absolute -top-12 -right-16 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xl z-[10001] whitespace-nowrap"
      >
        <span className="text-[10px] font-black text-black tracking-tighter uppercase">"RAAAEEOHA"</span>
        {/* Bubble Tail */}
        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-black rotate-45" />
      </motion.div>
    </motion.div>
  );
};
