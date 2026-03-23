import React, { useId } from 'react';
import { motion } from 'motion/react';

export const ExactSurfboard = ({ type, isSelected }: { type: string; isSelected?: boolean }) => {
  const idPrefix = useId().replace(/:/g, '');
  
  const GlossGradient = () => (
    <linearGradient id={`gloss-${type}-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
    </linearGradient>
  );

  if (type === 'fish') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
          <linearGradient id={`fishGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5722" />
            <stop offset="100%" stopColor="#E64A19" />
          </linearGradient>
        </defs>
        <path d="M 32 308 Q 33 310 38 310 L 50 307.5 L 62 310 Q 67 310 68 308 C 85 260, 85 170, 50 140 C 15 170, 15 260, 32 308 Z" fill={isSelected ? `url(#fishGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#E64A19" : "#9CA3AF"} strokeWidth="1" />
        <path d="M 45 220 L 55 220 L 50 235 Z" fill={isSelected ? "#333" : "#9CA3AF"} />
        <path d="M 32 308 Q 33 310 38 310 L 50 307.5 L 62 310 Q 67 310 68 308 C 85 260, 85 170, 50 140 C 15 170, 15 260, 32 308 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'shortboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
          <linearGradient id={`shortGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#2196F3" />
          </linearGradient>
        </defs>
        <path d="M 38 305 C 38 318, 62 318, 62 305 C 80 250, 75 160, 50 120 C 25 160, 20 250, 38 305 Z" fill={isSelected ? `url(#shortGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#1976D2" : "#9CA3AF"} strokeWidth="1" />
        <polygon points="50,190 55,195 55,205 50,210 45,205 45,195" fill="none" stroke={isSelected ? "#333" : "#9CA3AF"} strokeWidth="1"/>
        <path d="M 38 305 C 38 318, 62 318, 62 305 C 80 250, 75 160, 50 120 C 25 160, 20 250, 38 305 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'funboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
          <linearGradient id={`funGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="100%" stopColor="#FFF176" />
          </linearGradient>
        </defs>
        <path d="M 38 310 Q 50 315, 62 310 C 80 250, 85 100, 65 70 C 55 50, 45 50, 35 70 C 15 100, 20 250, 38 310 Z" fill={isSelected ? `url(#funGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#FBC02D" : "#9CA3AF"} strokeWidth="1" />
        <path d="M 50 70 L 50 312" stroke={isSelected ? "#795548" : "#9CA3AF"} strokeWidth="1" />
        <text x="50" y="160" fontSize="6" fill={isSelected ? "#333" : "#9CA3AF"} textAnchor="middle" transform="rotate(-90 50 160)" fontWeight="bold">NSP</text>
        <path d="M 38 310 Q 50 315, 62 310 C 80 250, 85 100, 65 70 C 55 50, 45 50, 35 70 C 15 100, 20 250, 38 310 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'longboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
          <clipPath id={`long-clip-${type}-${idPrefix}`}>
            <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 15 C 55 2, 45 2, 35 15 C 15 40, 15 250, 38 310 Z" />
          </clipPath>
        </defs>
        <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 15 C 55 2, 45 2, 35 15 C 15 40, 15 250, 38 310 Z" fill={isSelected ? "#FFFFFF" : "#D1D5DB"} stroke={isSelected ? "#00796B" : "#9CA3AF"} strokeWidth="1" />
        <g clipPath={`url(#long-clip-${type}-${idPrefix})`}>
          <rect x="47" y="0" width="6" height="320" fill={isSelected ? "#009688" : "#9CA3AF"} />
          <rect x="42" y="0" width="2" height="320" fill={isSelected ? "#263238" : "#757575"} />
          <rect x="56" y="0" width="2" height="320" fill={isSelected ? "#263238" : "#757575"} />
          <text x="50" y="140" fontSize="5" fill={isSelected ? "#fff" : "#9CA3AF"} textAnchor="middle" transform="rotate(-90 50 140)" fontWeight="bold">NSP</text>
        </g>
        <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 15 C 55 2, 45 2, 35 15 C 15 40, 15 250, 38 310 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'softboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
        </defs>
        <path d="M 35 305 Q 50 310, 65 305 C 90 250, 90 90, 70 60 C 60 45, 40 45, 30 60 C 10 90, 10 250, 35 305 Z" fill={isSelected ? "#4FC3F7" : "#D1D5DB"} stroke={isSelected ? "#0288D1" : "#9CA3AF"} strokeWidth="1" />
        <text x="50" y="160" fontSize="6" fill={isSelected ? "#D32F2F" : "#9CA3AF"} textAnchor="middle" transform="rotate(-90 50 160)" fontWeight="bold" fontStyle="italic">NSP</text>
        <circle cx="50" cy="85" r="1.5" fill={isSelected ? "#263238" : "#9CA3AF"} />
        <circle cx="50" cy="290" r="1.5" fill={isSelected ? "#263238" : "#9CA3AF"} />
        <circle cx="42" cy="280" r="1.5" fill={isSelected ? "#263238" : "#9CA3AF"} />
        <circle cx="58" cy="280" r="1.5" fill={isSelected ? "#263238" : "#9CA3AF"} />
        <path d="M 35 305 Q 50 310, 65 305 C 90 250, 90 90, 70 60 C 60 45, 40 45, 30 60 C 10 90, 10 250, 35 305 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  return null;
};

const surfboardData = {
  shortboard: { name: 'שורטבורד' },
  fish: { name: 'פיש' },
  funboard: { name: 'פאנבורד' },
  longboard: { name: 'לונגבורד' },
  softboard: { name: 'סופטבורד' },
};

interface SurfboardOverlayProps {
  selectedBoardType: string;
  hideLabel?: boolean;
}

export const SurfboardOverlay: React.FC<SurfboardOverlayProps> = ({ selectedBoardType, hideLabel = false }) => {
  const boardKeys = Object.keys(surfboardData);
  
  const selectedIdx = boardKeys.findIndex(key => {
    const board = surfboardData[key as keyof typeof surfboardData];
    const target = (selectedBoardType || '').toLowerCase().trim();
    
    if (!target) return false;
    
    // Exact match
    if (key.toLowerCase() === target || board.name.toLowerCase() === target) return true;
    
    // Partial match
    if (target.includes(key.toLowerCase()) || target.includes(board.name.toLowerCase())) return true;
    if (key.toLowerCase().includes(target) || board.name.toLowerCase().includes(target)) return true;
    
    return false;
  });
  
  // Default to funboard (index 2) if no match found
  const finalIdx = selectedIdx !== -1 ? selectedIdx : 2;

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[16/9] flex justify-center items-end bg-transparent p-3 overflow-visible">
      {boardKeys.map((key, index) => {
        const isSelected = index === finalIdx;
        const board = surfboardData[key as keyof typeof surfboardData];
        const offset = (index - finalIdx) * 35; 

        return (
          <div
            key={key}
            className={`absolute bottom-8 transition-all duration-500 ease-out ${
              isSelected ? 'z-40' : 'z-10'
            }`}
            style={{
              width: '120px', 
              height: '320px',
              left: '50%',
              transform: `translateX(calc(-50% + ${offset}px)) ${isSelected ? 'scale(1.25)' : 'scale(0.8)'}`,
              transformOrigin: 'bottom center',
            }}
          >
            <div 
              className="w-full h-full transition-all duration-500"
              style={{ 
                filter: isSelected ? 'drop-shadow(0 0 25px rgba(6, 182, 212, 0.5))' : 'grayscale(100%)',
                opacity: isSelected ? 1 : 0.2,
                transform: isSelected ? 'translateY(-10px)' : 'none'
              }}
            >
              <ExactSurfboard type={key} isSelected={isSelected} />
            </div>
            
            {isSelected && !hideLabel && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white text-[12px] font-black px-5 py-2 rounded-full whitespace-nowrap shadow-[0_0_20px_rgba(6,182,212,0.6)] z-50 animate-bounce"
              >
                {board.name} (המומלץ!)
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};
