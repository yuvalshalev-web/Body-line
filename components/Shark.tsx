import React from 'react';
import { motion } from 'motion/react';

export const Shark: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-52 h-20 my-3"
    >
      <svg viewBox="0 0 200 80" className="w-full h-full fill-white" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>
        {/* Shark Body with Mouth */}
        <path d="M20,40 C40,20 80,15 130,20 C160,15 180,25 190,35 C180,45 160,35 130,40 C90,45 50,55 20,40 Z" />
        {/* Mouth */}
        <path d="M30,40 L50,45 L30,48 Z" fill="black" />
        {/* Dorsal Fin */}
        <path d="M90,20 L110,5 L130,25 Z" />
        {/* Pectoral Fin */}
        <path d="M60,40 L40,60 L80,50 Z" />
        {/* Tail */}
        <path d="M190,35 L210,15 L200,35 L210,55 Z" />
        {/* Eye */}
        <circle cx="35" cy="35" r="1.5" fill="black" />
      </svg>
    </motion.div>
  );
};
