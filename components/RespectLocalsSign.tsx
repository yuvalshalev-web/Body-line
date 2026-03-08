import React from 'react';
import { motion } from 'motion/react';

export const RespectLocalsSign: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center justify-center mb-12 mt-6 w-full"
    >
      {/* Sign Container (Diamond) */}
      <motion.div
        whileHover={{ scale: 1.02, rotate: 46 }}
        className="relative w-64 h-64 rotate-45 bg-red-600 border-[10px] border-black flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden"
        style={{
          // Realistic distressed texture
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(0,0,0,0.15) 0%, transparent 2px),
            radial-gradient(circle at 80% 60%, rgba(0,0,0,0.15) 0%, transparent 2px),
            linear-gradient(45deg, transparent 45%, rgba(0,0,0,0.05) 48%, rgba(0,0,0,0.05) 52%, transparent 55%),
            linear-gradient(-45deg, transparent 45%, rgba(0,0,0,0.05) 48%, rgba(0,0,0,0.05) 52%, transparent 55%)
          `,
          backgroundSize: '40px 40px, 60px 60px, 100% 100%, 100% 100%',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.4)'
        }}
      >
        {/* Rust/Dirt Overlays */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
               mixBlendMode: 'overlay'
             }} 
        />
        
        {/* Grunge Filter Definition */}
        <svg width="0" height="0">
          <defs>
            <filter id="grunge">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
            </filter>
          </defs>
        </svg>

        {/* Content (Rotated back) */}
        <div className="-rotate-45 flex flex-col items-center justify-center w-full h-full p-6 text-white font-black uppercase tracking-widest text-center">
          <span className="text-2xl font-black mb-1 drop-shadow-sm" style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>עמוד</span>
          
          {/* Detailed Shark SVG */}
          <div className="relative w-52 h-20 my-3">
            <svg viewBox="0 0 200 80" className="w-full h-full fill-white" style={{ filter: 'url(#grunge)' }}>
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
          </div>

          <span className="text-3xl font-black mt-1 drop-shadow-sm" style={{ fontFamily: 'monospace', letterSpacing: '0.2em' }}>הבית</span>
        </div>
        
        {/* Weathering Scratches */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{
               backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.2) 11px, transparent 12px)',
               backgroundSize: '200% 200%'
             }}
        />
      </motion.div>
    </motion.div>
  );
};
