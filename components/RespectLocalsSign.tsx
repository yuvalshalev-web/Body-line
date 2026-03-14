import React from 'react';
import { motion } from 'motion/react';

export const RespectLocalsSign: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center justify-center mb-2 mt-2 w-full"
    >
      {/* Sign Container (Diamond) */}
      <motion.div
        whileHover={{ scale: 1.02, rotate: 46 }}
        className="relative w-64 h-64 rotate-45 bg-[#F5A623] border-[6px] border-black/80 flex items-center justify-center shadow-2xl overflow-hidden"
        style={{
          // Realistic distressed texture
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(0,0,0,0.1) 0%, transparent 2px),
            radial-gradient(circle at 80% 60%, rgba(0,0,0,0.1) 0%, transparent 2px),
            linear-gradient(45deg, transparent 45%, rgba(0,0,0,0.03) 48%, rgba(0,0,0,0.03) 52%, transparent 55%),
            linear-gradient(-45deg, transparent 45%, rgba(0,0,0,0.03) 48%, rgba(0,0,0,0.03) 52%, transparent 55%)
          `,
          backgroundSize: '40px 40px, 60px 60px, 100% 100%, 100% 100%',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        {/* Rust spots */}
        <div className="absolute top-4 left-4 w-12 h-12 bg-orange-950/40 rounded-full blur-[4px] -rotate-45" />
        <div className="absolute bottom-8 right-4 w-16 h-16 bg-orange-950/30 rounded-full blur-[6px] -rotate-45" />
        <div className="absolute top-12 right-16 w-8 h-8 bg-orange-950/50 rounded-full blur-[2px] -rotate-45" />
        <div className="absolute bottom-16 left-8 w-6 h-6 bg-orange-950/40 rounded-full blur-[2px] -rotate-45" />
        
        {/* Cracks */}
        <div className="absolute top-[20%] left-[10%] w-[80%] h-[2px] bg-black/30 rotate-12" />
        <div className="absolute top-[60%] left-[20%] w-[60%] h-[2px] bg-black/30 -rotate-6" />
        
        {/* Inner border */}
        <div className="absolute inset-2 border-[2px] border-black/40 rounded-xl"></div>

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
          <span className="text-xl font-black mb-0 drop-shadow-sm" style={{ WebkitTextStroke: '1.5px black', paintOrder: 'stroke fill' }}>Respect The</span>
          
          {/* Detailed Shark SVG */}
          <div className="relative w-[260px] h-[86px] my-1">
            <svg viewBox="0 0 120 60" className="w-full h-full drop-shadow-md">
              {/* Tail */}
              <path d="M 90 30 C 100 20 110 10 115 15 C 105 25 95 30 95 30 C 95 30 105 40 110 45 C 100 45 95 35 90 30 Z" fill="#1A4B6E" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Body White */}
              <path d="M 10 35 C 30 20 60 20 95 30 C 80 45 40 50 10 35 Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Body Blue */}
              <path d="M 10 35 C 30 20 60 20 95 30 C 70 32 40 38 10 35 Z" fill="#1A4B6E" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Dorsal Fin */}
              <path d="M 45 23 C 50 5 55 10 60 24 Z" fill="#1A4B6E" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Pectoral Fin */}
              <path d="M 40 38 C 35 55 45 50 50 42 Z" fill="#1A4B6E" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Eye */}
              <circle cx="20" cy="30" r="1.5" fill="white" />
              <circle cx="20" cy="30" r="0.5" fill="black" />
              
              {/* Gills */}
              <path d="M 32 28 L 30 34 M 35 28 L 33 35 M 38 29 L 36 36" stroke="black" strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          <span className="text-3xl font-black mt-0 drop-shadow-sm" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>Locals</span>
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
