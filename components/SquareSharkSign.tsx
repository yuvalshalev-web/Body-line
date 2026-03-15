import React from 'react';
import { motion } from 'motion/react';
import { Shark } from './Shark';

export const SquareSharkSign: React.FC = () => {
  return (
    <motion.div
      className="w-64 h-64 rounded-2xl border-2 border-black/10 flex flex-col items-center justify-center p-6 shadow-2xl relative overflow-hidden"
      style={{
        backgroundColor: '#FF2D60', // Using one of the theme colors
        backgroundImage: `
          linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 15%, rgba(0,0,0,0) 90%, rgba(0,0,0,0.3) 100%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
        `,
        backgroundSize: '100% 100%, 120px 120px'
      }}
      whileHover={{ scale: 1.05, rotate: 0 }}
    >
      {/* Wood Grain Lines */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" 
           style={{ 
             backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 3px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px)', 
             mixBlendMode: 'multiply',
           }} />

      <Shark />
      <h2 className="text-white font-['Miriwin'] font-bold text-3xl mt-4 text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]">
        Respect the Locals
      </h2>
      
      {/* Center Nail */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex pointer-events-none">
        <div className="w-4 h-4 rounded-full bg-[#2a2a2a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.4)]" />
      </div>
    </motion.div>
  );
};
