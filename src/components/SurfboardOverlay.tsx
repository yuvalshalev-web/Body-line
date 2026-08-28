import React, { useId } from 'react';
import { motion } from 'motion/react';
import { useData } from '../contexts/DataContext';

export const ExactSurfboard = ({ type, isSelected }: { type: string; isSelected?: boolean }) => {
  const { siteAssets } = useData();
  const idPrefix = useId().replace(/:/g, '');
  const [imgError, setImgError] = React.useState(false);
  
  const customImage = siteAssets?.surfboardModels?.[type];
  
  React.useEffect(() => {
    setImgError(false);
  }, [customImage]);
  
  if (customImage && !imgError) {
    return (
      <div className="w-full h-full flex items-end justify-center">
        <img 
          src={customImage} 
          alt={type} 
          className={`max-w-full max-h-full object-contain drop-shadow-2xl transition-all duration-500 scale-100`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          style={{
            filter: isSelected ? 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.4))' : 'grayscale(100%) opacity(0.3)'
          }}
        />
      </div>
    );
  }
  
  const GlossGradient = () => (
    <linearGradient id={`gloss-${type}-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
    </linearGradient>
  );

  if (type === 'fish') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full drop-shadow-2xl">
        <defs>
          <GlossGradient />
          <linearGradient id={`fishGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF8A65" />
            <stop offset="50%" stopColor="#FF5722" />
            <stop offset="100%" stopColor="#E64A19" />
          </linearGradient>
          <linearGradient id={`stringerGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3E2723" />
            <stop offset="50%" stopColor="#5D4037" />
            <stop offset="100%" stopColor="#3E2723" />
          </linearGradient>
        </defs>
        <path d="M 32 308 Q 33 310 38 310 L 50 307.5 L 62 310 Q 67 310 68 308 C 85 260, 85 170, 50 140 C 15 170, 15 260, 32 308 Z" fill={isSelected ? `url(#fishGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#BF360C" : "#9CA3AF"} strokeWidth="0.5" />
        {isSelected && (
          <>
            <rect x="49.5" y="140" width="1" height="168" fill={`url(#stringerGrad-${type}-${idPrefix})`} opacity="0.8" />
            {/* Fin Boxes */}
            <rect x="35" y="285" width="4" height="12" rx="1" fill="#212121" opacity="0.3" />
            <rect x="61" y="285" width="4" height="12" rx="1" fill="#212121" opacity="0.3" />
          </>
        )}
        <path d="M 45 220 L 55 220 L 50 235 Z" fill={isSelected ? "#212121" : "#9CA3AF"} opacity="0.8" />
        <path d="M 32 308 Q 33 310 38 310 L 50 307.5 L 62 310 Q 67 310 68 308 C 85 260, 85 170, 50 140 C 15 170, 15 260, 32 308 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'shortboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full drop-shadow-2xl">
        <defs>
          <GlossGradient />
          <linearGradient id={`shortGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#FAFAFA" />
            <stop offset="100%" stopColor="#E1F5FE" />
          </linearGradient>
          <linearGradient id={`railGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0288D1" stopOpacity="0.6" />
            <stop offset="15%" stopColor="#0288D1" stopOpacity="0" />
            <stop offset="85%" stopColor="#0288D1" stopOpacity="0" />
            <stop offset="100%" stopColor="#0288D1" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d="M 38 305 C 38 318, 62 318, 62 305 C 80 250, 75 160, 50 120 C 25 160, 20 250, 38 305 Z" fill={isSelected ? `url(#shortGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#0277BD" : "#9CA3AF"} strokeWidth="0.5" />
        {isSelected && (
          <>
            <path d="M 38 305 C 38 318, 62 318, 62 305 C 80 250, 75 160, 50 120 C 25 160, 20 250, 38 305 Z" fill={`url(#railGrad-${type}-${idPrefix})`} />
            <rect x="49.7" y="120" width="0.6" height="185" fill="#90A4AE" opacity="0.4" />
            {/* Fin Boxes */}
            <rect x="48" y="290" width="4" height="10" rx="1" fill="#212121" opacity="0.3" />
            <rect x="40" y="280" width="3" height="8" rx="1" fill="#212121" opacity="0.2" />
            <rect x="57" y="280" width="3" height="8" rx="1" fill="#212121" opacity="0.2" />
          </>
        )}
        <polygon points="50,190 55,195 55,205 50,210 45,205 45,195" fill="none" stroke={isSelected ? "#424242" : "#9CA3AF"} strokeWidth="0.5" opacity="0.6"/>
        <path d="M 38 305 C 38 318, 62 318, 62 305 C 80 250, 75 160, 50 120 C 25 160, 20 250, 38 305 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'funboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full drop-shadow-2xl">
        <defs>
          <GlossGradient />
          <linearGradient id={`funGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="50%" stopColor="#FFF9C4" />
            <stop offset="100%" stopColor="#FFF176" />
          </linearGradient>
        </defs>
        <path d="M 38 310 Q 50 315, 62 310 C 80 250, 85 100, 65 70 C 55 50, 45 50, 35 70 C 15 100, 20 250, 38 310 Z" fill={isSelected ? `url(#funGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#FBC02D" : "#9CA3AF"} strokeWidth="0.5" />
        {isSelected && (
          <>
            <path d="M 50 70 L 50 312" stroke="#8D6E63" strokeWidth="1" opacity="0.8" />
            <rect x="48" y="295" width="4" height="12" rx="1" fill="#212121" opacity="0.3" />
          </>
        )}
        <text x="50" y="160" fontSize="7" fill={isSelected ? "#424242" : "#9CA3AF"} textAnchor="middle" transform="rotate(-90 50 160)" fontWeight="900" letterSpacing="1">NSP</text>
        <path d="M 38 310 Q 50 315, 62 310 C 80 250, 85 100, 65 70 C 55 50, 45 50, 35 70 C 15 100, 20 250, 38 310 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'longboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full drop-shadow-2xl">
        <defs>
          <GlossGradient />
          <clipPath id={`long-clip-${type}-${idPrefix}`}>
            <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 15 C 55 2, 45 2, 35 15 C 15 40, 15 250, 38 310 Z" />
          </clipPath>
          <linearGradient id={`longGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5F5F5" />
          </linearGradient>
        </defs>
        <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 15 C 55 2, 45 2, 35 15 C 15 40, 15 250, 38 310 Z" fill={isSelected ? `url(#longGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#00695C" : "#9CA3AF"} strokeWidth="0.5" />
        <g clipPath={`url(#long-clip-${type}-${idPrefix})`}>
          {isSelected && (
            <>
              <rect x="48.5" y="0" width="3" height="320" fill="#5D4037" opacity="0.8" />
              <rect x="44" y="0" width="1" height="320" fill="#3E2723" opacity="0.4" />
              <rect x="55" y="0" width="1" height="320" fill="#3E2723" opacity="0.4" />
              <rect x="48" y="295" width="4" height="15" rx="1" fill="#212121" opacity="0.3" />
            </>
          )}
          <text x="50" y="140" fontSize="6" fill={isSelected ? "#212121" : "#9CA3AF"} textAnchor="middle" transform="rotate(-90 50 140)" fontWeight="900" letterSpacing="1">NSP</text>
        </g>
        <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 15 C 55 2, 45 2, 35 15 C 15 40, 15 250, 38 310 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'softboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full drop-shadow-2xl">
        <defs>
          <GlossGradient />
          <linearGradient id={`softGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#81D4FA" />
            <stop offset="50%" stopColor="#4FC3F7" />
            <stop offset="100%" stopColor="#29B6F6" />
          </linearGradient>
        </defs>
        <path d="M 35 305 Q 50 310, 65 305 C 90 250, 90 90, 70 60 C 60 45, 40 45, 30 60 C 10 90, 10 250, 35 305 Z" fill={isSelected ? `url(#softGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#0277BD" : "#9CA3AF"} strokeWidth="0.5" />
        {isSelected && (
          <>
            <circle cx="50" cy="85" r="2" fill="#212121" opacity="0.8" />
            <circle cx="50" cy="290" r="2" fill="#212121" opacity="0.8" />
            <circle cx="42" cy="280" r="2" fill="#212121" opacity="0.8" />
            <circle cx="58" cy="280" r="2" fill="#212121" opacity="0.8" />
          </>
        )}
        <text x="50" y="160" fontSize="7" fill={isSelected ? "#C62828" : "#9CA3AF"} textAnchor="middle" transform="rotate(-90 50 160)" fontWeight="900" fontStyle="italic" letterSpacing="0.5">NSP</text>
        <path d="M 35 305 Q 50 310, 65 305 C 90 250, 90 90, 70 60 C 60 45, 40 45, 30 60 C 10 90, 10 250, 35 305 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  if (type === 'sup') {
    return (
      <svg viewBox="-20 0 140 340" className="w-full h-full drop-shadow-2xl">
        <defs>
          <GlossGradient />
          <linearGradient id={`supGrad-${type}-${idPrefix}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4DD0E1" />
            <stop offset="100%" stopColor="#00BCD4" />
          </linearGradient>
        </defs>
        
        {/* Paddle (only if selected) */}
        {isSelected && (
          <g className="drop-shadow-lg">
            {/* Shaft */}
            <rect x="95" y="80" width="4" height="180" rx="2" fill="#212121" />
            {/* Blade */}
            <path d="M 97 260 C 110 280, 105 315, 97 325 C 89 315, 84 280, 97 260 Z" fill="#B2FF59" />
            {/* Handle */}
            <rect x="91" y="76" width="12" height="6" rx="2" fill="#B2FF59" />
          </g>
        )}

        {/* Board */}
        <path d="M 25 310 Q 50 325, 75 310 C 95 240, 95 80, 75 40 C 60 15, 40 15, 25 40 C 5 80, 5 240, 25 310 Z" fill={isSelected ? `url(#supGrad-${type}-${idPrefix})` : "#D1D5DB"} stroke={isSelected ? "#00ACC1" : "#9CA3AF"} strokeWidth="0.5" />
        
        {isSelected && (
          <>
            {/* Grip Pad */}
            <path d="M 20 160 L 80 160 L 68 290 Q 50 300 32 290 Z" fill="#00838F" opacity="0.15" />
            
            {/* Front Bungee Cords */}
            <line x1="30" y1="90" x2="70" y2="90" stroke="#B2FF59" strokeWidth="1.5" />
            <line x1="30" y1="110" x2="70" y2="110" stroke="#B2FF59" strokeWidth="1.5" />
            <line x1="30" y1="90" x2="70" y2="110" stroke="#B2FF59" strokeWidth="1.5" />
            <line x1="70" y1="90" x2="30" y2="110" stroke="#B2FF59" strokeWidth="1.5" />
            
            {/* Center Handle */}
            <rect x="47" y="190" width="6" height="25" rx="3" fill="#212121" />
            <rect x="48" y="192" width="4" height="21" rx="2" fill="#B2FF59" />
            
            {/* Brand overlay */}
            <text x="50" y="130" fontSize="11" fill="#B2FF59" textAnchor="middle" transform="rotate(-90 50 130)" fontWeight="900" letterSpacing="2">SUP</text>
          </>
        )}
        
        <path d="M 25 310 Q 50 325, 75 310 C 95 240, 95 80, 75 40 C 60 15, 40 15, 25 40 C 5 80, 5 240, 25 310 Z" fill={`url(#gloss-${type}-${idPrefix})`} />
      </svg>
    );
  }
  return null;
};

const surfboardData = {
  sup: { name: 'סאפ (SUP)' },
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
