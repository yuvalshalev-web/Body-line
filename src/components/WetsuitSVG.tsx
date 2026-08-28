import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';

import { useData } from '../contexts/DataContext';

const defaultAssets: Record<string, string> = {};


interface WetsuitSVGProps {
  thickness?: '4/3' | '3/2' | '2/2' | '2/2-ss' | 'sun-shirt';
  alignBottom?: boolean;
}

const WetsuitIllustration: React.FC<{ thickness: string }> = ({ thickness }) => {
  const isShort = thickness.includes('ss') || thickness.includes('sun');
  const id = React.useId().replace(/:/g, '');
  
  return (
    <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`suitGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a2b3c" />
          <stop offset="50%" stopColor="#2c3e50" />
          <stop offset="100%" stopColor="#1a2b3c" />
        </linearGradient>
        <linearGradient id={`highlightGrad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="50%" stopColor="white" stopOpacity="0.05" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Main suit body */}
      <path 
        d="M70 40 Q100 30 130 40 L145 100 Q150 150 140 200 L130 380 Q100 390 70 380 L60 200 Q50 150 55 100 Z" 
        fill={`url(#suitGrad-${id})`} 
        stroke="#000" 
        strokeWidth="0.5"
      />
      
      {/* Design details / Panels */}
      <path d="M100 40 L100 385" stroke="white" strokeWidth="0.5" opacity="0.1" />
      <path d="M70 120 Q100 130 130 120" stroke="white" strokeWidth="0.5" opacity="0.1" />
      <path d="M65 200 Q100 210 135 200" stroke="white" strokeWidth="0.5" opacity="0.1" />
      
      {/* Arms */}
      <path d="M60 80 L30 150" stroke="#1a2b3c" strokeWidth="24" strokeLinecap="round" />
      <path d="M140 80 L170 150" stroke="#1a2b3c" strokeWidth="24" strokeLinecap="round" />
      
      {/* Legs (if not short) */}
      {!isShort && (
        <>
          <path d="M82 250 L78 380" stroke="#1a2b3c" strokeWidth="28" strokeLinecap="round" />
          <path d="M118 250 L122 380" stroke="#1a2b3c" strokeWidth="28" strokeLinecap="round" />
        </>
      )}
      
      {/* Gloss/Highlight overlay */}
      <path 
        d="M75 45 Q100 38 125 45 L135 100 Q140 140 130 180 L120 370 Q100 375 80 370 L70 180 Q65 140 68 100 Z" 
        fill={`url(#highlightGrad-${id})`} 
      />
      
      {/* Thickness Label */}
      <text 
        x="100" 
        y="220" 
        textAnchor="middle" 
        fill="white" 
        fontSize="28" 
        fontWeight="900" 
        opacity="0.2" 
        style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '-1px' }}
      >
        {thickness}
      </text>
    </svg>
  );
};

const WetsuitSVG: React.FC<WetsuitSVGProps> = ({ thickness = '4/3', alignBottom = false }) => {
  const { siteAssets } = useData();
  const [imgError, setImgError] = useState(false);

  // Reset error state when thickness changes
  useEffect(() => {
    setImgError(false);
  }, [thickness]);

  const getImgSrc = () => {
    const assetKey = thickness === '2/2-ss' ? 'wetsuit22ss' : thickness === 'sun-shirt' ? 'sunShirt' : `wetsuit${thickness.replace('/', '')}`;
    const asset = siteAssets?.[assetKey];
    return asset || defaultAssets[thickness] || '';
  };

  const imgSrc = getImgSrc();

  return (
    <div className={`flex ${alignBottom ? 'items-end' : 'items-center'} justify-center w-full h-full ${alignBottom ? 'p-0' : 'p-2'} bg-transparent`}>
      <div className={`relative group w-full max-w-md flex justify-center ${alignBottom ? 'items-end' : 'items-center'}`}>
        {/* Glowing background effect for the transparent image */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[var(--surfer-cyan)]/20 blur-[80px] rounded-full pointer-events-none" />
        
        {imgSrc && !imgError ? (
          <div className="relative z-10 w-full max-w-[220px] sm:max-w-[255px] flex flex-col items-center">
            <motion.img
              key={thickness} // Force re-animation on change
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              src={imgSrc} 
              alt={`${thickness} Full Wetsuit`}
              className="max-w-full max-h-[300px] sm:max-h-[360px] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="relative z-10 w-full max-w-[150px] sm:max-w-[180px] flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-h-[300px] sm:max-h-[360px] flex items-center justify-center"
            >
              <WetsuitIllustration thickness={thickness} />
            </motion.div>
            {!imgSrc && (
              <p className="mt-2 text-center font-bold text-[9px] text-[#00426a]/40 bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/40 whitespace-nowrap">
                יוצג איור ברירת מחדל עד להעלאת תמונה
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WetsuitSVG;
