import React from 'react';
import { motion } from 'motion/react';

interface WoodSignLinkProps {
  item: {
    id: number;
    text: string;
    icon: string;
    color: string;
    direction: string;
    rotation: number;
  };
  isActive: boolean;
  onClick: () => void;
  index: number;
}

export const WoodSignLink: React.FC<WoodSignLinkProps> = React.memo(({
  item,
  isActive,
  onClick,
  index
}) => {
  const isRight = item.direction === 'right';

  // Organic, slightly weathered wooden board shapes with small breaks/notches
  const clipPathRight = 'polygon(2% 4%, 25% 2%, 27% 12%, 30% 1%, calc(100% - 28px) 0%, 100% 50%, calc(100% - 28px) 100%, 60% 98%, 58% 90%, 55% 99%, 0% 96%, 3% 50%)';
  const clipPathLeft = 'polygon(28px 0%, 70% 2%, 68% 15%, 65% 1%, 98% 4%, 97% 50%, 100% 96%, 40% 98%, 42% 90%, 45% 99%, 28px 100%, 0% 50%)';

  return (
    <motion.div
      initial={{ opacity: 0, x: isRight ? 20 : -20, scale: 1, rotate: item.rotation }}
      animate={{ opacity: 1, x: 0, scale: 1, rotate: item.rotation }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.4,
        ease: "easeOut"
      }}
      whileHover={{ scale: 1.1, rotate: 0 }}
      whileTap={{ scale: 0.95 }}
      style={{ 
        // Drop shadow on the wrapper because clip-path hides box-shadow
        filter: 'drop-shadow(0px 8px 6px rgba(0,0,0,0.3)) drop-shadow(0px 2px 2px rgba(0,0,0,0.2))'
      }}
      className="wood-sign relative my-1.5 w-full group cursor-pointer"
      onClick={onClick}
    >
      {/* The Sign Shape */}
      <div 
        className={`
          relative py-2 px-4 transition-all duration-300
          ${isActive ? 'brightness-110' : 'brightness-90 group-hover:brightness-100'}
          ${isRight ? 'pr-8 pl-4' : 'pl-8 pr-4'}
        `}
        style={{ 
          backgroundColor: `${item.color}66`, // Add transparency (66 = ~40%)
          clipPath: isRight ? clipPathRight : clipPathLeft,
          // Wood texture and lighting
          backgroundImage: `
            linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 15%, rgba(0,0,0,0) 90%, rgba(0,0,0,0.3) 100%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
          `,
          backgroundSize: '100% 100%, 120px 120px'
        }}
      >
        {/* Wood Grain Lines */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" 
             style={{ 
               backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 3px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px)', 
               mixBlendMode: 'multiply',
             }} />

        {/* Faded Paint & Edge Darkening (Under text) */}
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-70"
             style={{
               background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.8) 100%)'
             }} />

        {/* Water Stains / Discoloration (Under text) */}
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-40"
             style={{
               backgroundImage: `
                 radial-gradient(circle at 15% 70%, rgba(0,0,0,0.5) 0%, transparent 25%),
                 radial-gradient(circle at 90% 30%, rgba(0,0,0,0.4) 0%, transparent 35%)
               `
             }} />
        
        <div className={`flex items-center gap-3 relative z-10 ${isRight ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
          <span className="text-3xl drop-shadow-md opacity-90">
            {item.icon}
          </span>
          <span className={`
            text-2xl text-white/90 font-['Yehuda_CLM'] font-bold
            drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]
          `}
          >
            {item.text}
          </span>
        </div>

        {/* Scratches (Over text) */}
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40 z-20"
             style={{
               backgroundImage: `
                 repeating-linear-gradient(65deg, transparent, transparent 4px, rgba(255,255,255,0.4) 5px, transparent 6px),
                 repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(0,0,0,0.5) 13px, transparent 14px),
                 repeating-linear-gradient(15deg, transparent, transparent 25px, rgba(255,255,255,0.3) 26px, transparent 27px)
               `
             }} />

        {/* Cracks Overlay (Over text) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60 z-20" preserveAspectRatio="none" viewBox="0 0 100 100">
          <g className="mix-blend-multiply">
            <path d="M 15,0 Q 18,12 12,20 T 20,35" stroke="#3a2010" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 90,100 Q 80,80 88,65 T 75,45" stroke="#2a1508" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 100,30 Q 90,35 80,25" stroke="#3a2010" strokeWidth="0.6" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 0,60 Q 15,58 20,65" stroke="#2a1508" strokeWidth="0.7" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 45,40 Q 50,45 42,55" stroke="#3a2010" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />
            
            {/* New cracks */}
            <path d="M 27,0 Q 29,10 25,15 T 28,25" stroke="#2a1508" strokeWidth="1.0" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 58,100 Q 56,90 60,75 T 55,60" stroke="#3a2010" strokeWidth="0.9" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 35,100 Q 38,90 32,80" stroke="#2a1508" strokeWidth="0.6" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 70,0 Q 65,15 72,25" stroke="#3a2010" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 50,60 Q 55,65 52,75" stroke="#2a1508" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
          </g>
          {/* Highlights for cracks (peeling paint effect) */}
          <g className="mix-blend-overlay">
            <path d="M 15.5,0 Q 18.5,12 12.5,20 T 20.5,35" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 90.5,100 Q 80.5,80 88.5,65 T 75.5,45" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
            
            {/* New highlights */}
            <path d="M 27.5,0 Q 29.5,10 25.5,15 T 28.5,25" stroke="rgba(255,255,255,0.7)" strokeWidth="1.0" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 58.5,100 Q 56.5,90 60.5,75 T 55.5,60" stroke="rgba(255,255,255,0.6)" strokeWidth="0.9" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 50.5,60 Q 55.5,65 52.5,75" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
      </div>

      {/* Center Nail - Rusty & Weathered */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex pointer-events-none">
        <div className="relative w-4 h-4">
          {/* Main nail head with irregular shape (dinged) */}
          <div 
            className="absolute inset-0 rounded-full bg-[#5d4037] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.2)]"
            style={{
              clipPath: 'polygon(10% 20%, 40% 5%, 90% 15%, 95% 50%, 80% 90%, 45% 95%, 5% 75%)',
              backgroundImage: 'radial-gradient(circle at 30% 30%, #8b4513 0%, #3e2723 100%)'
            }}
          />
          {/* Rust spots/dings */}
          <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#cd853f] opacity-40 blur-[0.5px]" />
          <div className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-[#2a1b18] opacity-60" />
        </div>
      </div>
    </motion.div>
  );
});

// --- APPENDED CODE: V2 ---
export const WoodSignLinkV2: React.FC<WoodSignLinkProps> = React.memo(({
  item,
  isActive,
  onClick,
  index
}) => {
  const isRight = item.direction === 'right';
  const rotation = React.useMemo(() => (Math.random() * 6) - 3, []);

  // Organic, slightly weathered wooden board shapes with small breaks/notches
  const clipPathRight = 'polygon(2% 4%, 25% 2%, 27% 12%, 30% 1%, calc(100% - 28px) 0%, 100% 50%, calc(100% - 28px) 100%, 60% 98%, 58% 90%, 55% 99%, 0% 96%, 3% 50%)';
  const clipPathLeft = 'polygon(28px 0%, 70% 2%, 68% 15%, 65% 1%, 98% 4%, 97% 50%, 100% 96%, 40% 98%, 42% 90%, 45% 99%, 28px 100%, 0% 50%)';

  return (
    <motion.div
      initial={{ opacity: 0, x: isRight ? 20 : -20, scale: 1, rotate: rotation }}
      animate={{ opacity: 1, x: 0, scale: 1, rotate: rotation }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.4,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.05, 
        rotate: [rotation, rotation - 3, rotation + 3, rotation - 2, rotation + 2, rotation], 
        transition: { duration: 0.6, ease: "easeInOut" } 
      }}
      whileTap={{ scale: 0.95 }}
      style={{ 
        // Drop shadow on the wrapper because clip-path hides box-shadow
        filter: 'drop-shadow(0px 8px 6px rgba(0,0,0,0.3)) drop-shadow(0px 2px 2px rgba(0,0,0,0.2))',
        transformOrigin: 'center center'
      }}
      className="wood-sign relative my-1.5 w-full group cursor-pointer"
      onClick={onClick}
    >
      {/* The Sign Shape */}
      <div 
        className={`
          relative py-2 px-4 transition-all duration-300
          ${isActive ? 'brightness-110' : 'brightness-90 group-hover:brightness-100'}
          ${isRight ? 'pr-8 pl-4' : 'pl-8 pr-4'}
        `}
        style={{ 
          backgroundColor: `${item.color}66`, // Add transparency (66 = ~40%)
          clipPath: isRight ? clipPathRight : clipPathLeft,
          // Wood texture and lighting
          backgroundImage: `
            linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 15%, rgba(0,0,0,0) 90%, rgba(0,0,0,0.3) 100%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
          `,
          backgroundSize: '100% 100%, 120px 120px'
        }}
      >
        {/* Wood Grain Lines */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" 
             style={{ 
               backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 3px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px)', 
               mixBlendMode: 'multiply',
             }} />

        {/* Faded Paint & Edge Darkening (Under text) */}
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-70"
             style={{
               background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.8) 100%)'
             }} />

        {/* Water Stains / Discoloration (Under text) */}
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-40"
             style={{
               backgroundImage: `
                 radial-gradient(circle at 15% 70%, rgba(0,0,0,0.5) 0%, transparent 25%),
                 radial-gradient(circle at 90% 30%, rgba(0,0,0,0.4) 0%, transparent 35%)
               `
             }} />
        
        <div className={`flex items-center gap-3 relative z-10 ${isRight ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
          <span className="text-3xl drop-shadow-md opacity-90">
            {item.icon}
          </span>
          <span className={`
            text-2xl text-white/90 font-['Yehuda_CLM'] font-bold
            drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]
          `}
          >
            {item.text}
          </span>
        </div>

        {/* Scratches (Over text) */}
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40 z-20"
             style={{
               backgroundImage: `
                 repeating-linear-gradient(65deg, transparent, transparent 4px, rgba(255,255,255,0.4) 5px, transparent 6px),
                 repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(0,0,0,0.5) 13px, transparent 14px),
                 repeating-linear-gradient(15deg, transparent, transparent 25px, rgba(255,255,255,0.3) 26px, transparent 27px)
               `
             }} />

        {/* Cracks Overlay (Over text) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60 z-20" preserveAspectRatio="none" viewBox="0 0 100 100">
          <g className="mix-blend-multiply">
            <path d="M 15,0 Q 18,12 12,20 T 20,35" stroke="#3a2010" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 90,100 Q 80,80 88,65 T 75,45" stroke="#2a1508" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 100,30 Q 90,35 80,25" stroke="#3a2010" strokeWidth="0.6" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 0,60 Q 15,58 20,65" stroke="#2a1508" strokeWidth="0.7" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 45,40 Q 50,45 42,55" stroke="#3a2010" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />
            
            {/* New cracks */}
            <path d="M 27,0 Q 29,10 25,15 T 28,25" stroke="#2a1508" strokeWidth="1.0" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 58,100 Q 56,90 60,75 T 55,60" stroke="#3a2010" strokeWidth="0.9" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 35,100 Q 38,90 32,80" stroke="#2a1508" strokeWidth="0.6" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 70,0 Q 65,15 72,25" stroke="#3a2010" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 50,60 Q 55,65 52,75" stroke="#2a1508" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
          </g>
          {/* Highlights for cracks (peeling paint effect) */}
          <g className="mix-blend-overlay">
            <path d="M 15.5,0 Q 18.5,12 12.5,20 T 20.5,35" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 90.5,100 Q 80.5,80 88.5,65 T 75.5,45" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
            
            {/* New highlights */}
            <path d="M 27.5,0 Q 29.5,10 25.5,15 T 28.5,25" stroke="rgba(255,255,255,0.7)" strokeWidth="1.0" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 58.5,100 Q 56.5,90 60.5,75 T 55.5,60" stroke="rgba(255,255,255,0.6)" strokeWidth="0.9" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M 50.5,60 Q 55.5,65 52.5,75" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
      </div>

      {/* Center Nail - Rusty & Weathered */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex pointer-events-none">
        <div className="relative w-4 h-4">
          {/* Main nail head with irregular shape (dinged) */}
          <div 
            className="absolute inset-0 rounded-full bg-[#5d4037] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.2)]"
            style={{
              clipPath: 'polygon(10% 20%, 40% 5%, 90% 15%, 95% 50%, 80% 90%, 45% 95%, 5% 75%)',
              backgroundImage: 'radial-gradient(circle at 30% 30%, #8b4513 0%, #3e2723 100%)'
            }}
          />
          {/* Rust spots/dings */}
          <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#cd853f] opacity-40 blur-[0.5px]" />
          <div className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-[#2a1b18] opacity-60" />
        </div>
      </div>
    </motion.div>
  );
});

