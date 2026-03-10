import React, { useId } from 'react';
import { motion } from 'motion/react';

export type WaxColor = 'blue' | 'red' | 'green' | 'orange' | 'yellow';

interface WaxButtonProps {
  color: WaxColor;
  size?: number;
  onClick?: () => void;
  className?: string;
  label?: string;
}

const waxConfig = {
  blue: {
    bg: 'rgba(43, 117, 184, 0.75)',
    text1: 'TROPICAL WATER',
  },
  red: {
    bg: 'rgba(227, 38, 54, 0.75)',
    text1: 'WARM WATER',
  },
  green: {
    bg: 'rgba(143, 206, 123, 0.75)',
    text1: 'COLD WATER',
  },
  orange: {
    bg: 'rgba(242, 125, 38, 0.75)',
    text1: 'COOL WATER',
  },
  yellow: {
    bg: 'rgba(252, 227, 0, 0.75)',
    text1: 'HOCKEY FORMULA',
  }
};

export const WaxButton: React.FC<WaxButtonProps> = ({ color, size = 150, onClick, className = '', label }) => {
  const config = waxConfig[color];
  const uniqueId = useId().replace(/:/g, '-');

  return (
    <motion.button
      whileHover={{ scale: 1.05, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative rounded-full flex flex-col items-center justify-center overflow-hidden cursor-pointer group ${className}`}
      style={{
        width: size,
        height: size,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255,255,255,0.4)',
      }}
      title={label || `${color} button`}
    >
      {/* Glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent pointer-events-none rounded-full z-10" />
      
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg" style={{ padding: '4%' }}>
        <defs>
          <path id={`outer-circle-${uniqueId}`} d="M 15,100 A 85,85 0 1,1 15,99.9" />
          <path id={`mr-zogs-${uniqueId}`} d="M 25,100 A 75,75 0 0,1 175,100" />
          <path id={`best-${uniqueId}`} d="M 175,100 A 75,75 0 0,1 25,100" />
        </defs>

        {/* Outer Black Ring */}
        <circle cx="100" cy="100" r="95" fill="rgba(20, 20, 20, 0.85)" />
        
        {/* Outer Text */}
        <text fontSize="8.5" fill="rgba(255,255,255,0.95)" fontWeight="bold" fontFamily="Arial, sans-serif">
          <textPath href={`#outer-circle-${uniqueId}`} textLength="530" lengthAdjust="spacingAndGlyphs" startOffset="0%">
            SEX WAX INC. • BOX 1222 • CARPINTERIA • CA 93014 • NON-TOXIC • NET WT. 75 GRAMS • {config.text1} SURF WAX • 
          </textPath>
        </text>

        {/* Inner Colored Circle */}
        <circle cx="100" cy="100" r="82" fill={config.bg} />
        
        {/* Inner Borders */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
        <circle cx="100" cy="100" r="77" fill="none" stroke="rgba(20,20,20,0.85)" strokeWidth="2" />

        {/* Top Text */}
        <text fontSize="26" fill="rgba(20,20,20,0.85)" fontWeight="900" fontFamily="Arial Black, Impact, sans-serif">
          <textPath href={`#mr-zogs-${uniqueId}`} startOffset="50%" textAnchor="middle">
            ★ MR. ZOGS ★
          </textPath>
        </text>

        {/* Middle Black Rectangle */}
        <rect x="12" y="82" width="176" height="36" fill="rgba(20,20,20,0.85)" />
        <rect x="14" y="84" width="172" height="32" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
        
        {/* SEX WAX Text */}
        <text x="100" y="109" fill="rgba(255,255,255,0.95)" fontSize="30" fontWeight="900" fontFamily="Arial Black, Impact, sans-serif" textAnchor="middle" letterSpacing="1">
          SEX WAX<tspan fontSize="10" dy="-15">®</tspan>
        </text>

        {/* ORIGINAL Text & Squiggle */}
        <text x="100" y="74" fill="rgba(20,20,20,0.85)" fontSize="11" fontWeight="900" fontFamily="Arial Black, sans-serif" textAnchor="middle" letterSpacing="1">
          ORIGINAL
        </text>
        <path d="M 85,62 Q 90,57 95,62 T 105,62 T 115,62" fill="none" stroke="rgba(20,20,20,0.85)" strokeWidth="2" strokeLinecap="round" />

        {/* NEVER SPOILS Text & Squiggles */}
        <text x="100" y="132" fill="rgba(20,20,20,0.85)" fontSize="9" fontWeight="900" fontFamily="Arial Black, sans-serif" textAnchor="middle" letterSpacing="1">
          NEVER
        </text>
        <text x="100" y="142" fill="rgba(20,20,20,0.85)" fontSize="9" fontWeight="900" fontFamily="Arial Black, sans-serif" textAnchor="middle" letterSpacing="1">
          SPOILS
        </text>
        <path d="M 75,135 Q 70,130 65,135" fill="none" stroke="rgba(20,20,20,0.85)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 125,135 Q 130,130 135,135" fill="none" stroke="rgba(20,20,20,0.85)" strokeWidth="2" strokeLinecap="round" />

        {/* Bottom Text */}
        <text fontSize="14" fill="rgba(20,20,20,0.85)" fontWeight="900" fontFamily="Arial Black, Impact, sans-serif">
          <textPath href={`#best-${uniqueId}`} startOffset="50%" textAnchor="middle">
            ★ THE BEST FOR YOUR STICK ★
          </textPath>
        </text>
      </svg>
      
      {/* Optional Label overlay */}
      {label && (
        <div className="absolute bottom-6 bg-black/60 text-white text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {label}
        </div>
      )}
    </motion.button>
  );
};
