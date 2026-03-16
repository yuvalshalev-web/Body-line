import React from 'react';

export const ExactSurfboard = ({ type }: { type: string }) => {
  const GlossGradient = () => (
    <linearGradient id={`gloss-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
      <stop offset="15%" stopColor="#ffffff" stopOpacity="0.2" />
      <stop offset="40%" stopColor="#ffffff" stopOpacity="0.0" />
      <stop offset="80%" stopColor="#000000" stopOpacity="0.1" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
    </linearGradient>
  );

  if (type === 'fish') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
          <linearGradient id="fishGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D84315" />
            <stop offset="25%" stopColor="#D84315" />
            <stop offset="25.5%" stopColor="#212121" />
            <stop offset="26%" stopColor="#F5F5F5" />
            <stop offset="74%" stopColor="#F5F5F5" />
            <stop offset="74.5%" stopColor="#212121" />
            <stop offset="75%" stopColor="#D84315" />
            <stop offset="100%" stopColor="#D84315" />
          </linearGradient>
        </defs>
        {/* Fish tail: shallower angle (~160 deg) and softened tips */}
        <path d="M 32 308 Q 33 310 38 310 L 50 307.5 L 62 310 Q 67 310 68 308 C 85 260, 85 170, 50 130 C 15 170, 15 260, 32 308 Z" fill="url(#fishGrad)" stroke="#333" strokeWidth="0.5" />
        {/* Logo */}
        <path d="M 45 220 L 55 220 L 50 235 Z" fill="#333" />
        <path d="M 32 308 Q 33 310 38 310 L 50 307.5 L 62 310 Q 67 310 68 308 C 85 260, 85 170, 50 130 C 15 170, 15 260, 32 308 Z" fill={`url(#gloss-${type})`} />
      </svg>
    );
  }
  if (type === 'shortboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
          <linearGradient id="shortGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5F5F5" />
            <stop offset="65%" stopColor="#F5F5F5" />
            <stop offset="65.5%" stopColor="#1E88E5" />
            <stop offset="100%" stopColor="#1E88E5" />
          </linearGradient>
        </defs>
        <path d="M 38 305 C 38 318, 62 318, 62 305 C 80 250, 75 160, 50 130 C 25 160, 20 250, 38 305 Z" fill="url(#shortGrad)" stroke="#333" strokeWidth="0.5" />
        {/* Logo */}
        <polygon points="50,190 55,195 55,205 50,210 45,205 45,195" fill="none" stroke="#333" strokeWidth="1"/>
        <path d="M 38 305 C 38 318, 62 318, 62 305 C 80 250, 75 160, 50 130 C 25 160, 20 250, 38 305 Z" fill={`url(#gloss-${type})`} />
      </svg>
    );
  }
  if (type === 'funboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
        </defs>
        <path d="M 38 310 Q 50 315, 62 310 C 80 250, 85 100, 65 70 C 55 50, 45 50, 35 70 C 15 100, 20 250, 38 310 Z" fill="#F5F5F5" stroke="#333" strokeWidth="0.5" />
        {/* Stringer */}
        <path d="M 50 70 L 50 312" stroke="#C19A6B" strokeWidth="0.5" />
        {/* Logo */}
        <text x="50" y="160" fontSize="6" fill="#333" textAnchor="middle" transform="rotate(-90 50 160)" fontWeight="bold">NSP</text>
        <path d="M 38 310 Q 50 315, 62 310 C 80 250, 85 100, 65 70 C 55 50, 45 50, 35 70 C 15 100, 20 250, 38 310 Z" fill={`url(#gloss-${type})`} />
      </svg>
    );
  }
  if (type === 'longboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
          <clipPath id="long-clip">
            <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 10 C 55 -5, 45 -5, 35 10 C 15 40, 15 250, 38 310 Z" />
          </clipPath>
        </defs>
        <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 10 C 55 -5, 45 -5, 35 10 C 15 40, 15 250, 38 310 Z" fill="#F5F5F5" stroke="#333" strokeWidth="0.5" />
        <g clipPath="url(#long-clip)">
          <rect x="47" y="-10" width="6" height="330" fill="#4DB6AC" />
          <rect x="42" y="-10" width="2" height="330" fill="#263238" />
          <rect x="56" y="-10" width="2" height="330" fill="#263238" />
          <text x="50" y="140" fontSize="5" fill="#fff" textAnchor="middle" transform="rotate(-90 50 140)" fontWeight="bold">NSP</text>
        </g>
        <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 40, 65 10 C 55 -5, 45 -5, 35 10 C 15 40, 15 250, 38 310 Z" fill={`url(#gloss-${type})`} />
      </svg>
    );
  }
  if (type === 'softboard') {
    return (
      <svg viewBox="0 0 100 320" className="w-full h-full">
        <defs>
          <GlossGradient />
        </defs>
        <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 70, 65 40 C 55 25, 45 25, 35 40 C 15 70, 15 250, 38 310 Z" fill="#64B5F6" stroke="#1E88E5" strokeWidth="0.5" />
        <text x="50" y="140" fontSize="6" fill="#D32F2F" textAnchor="middle" transform="rotate(-90 50 140)" fontWeight="bold" fontStyle="italic">NSP</text>
        {/* Dots (Leash plug / Fin screws) */}
        <circle cx="50" cy="75" r="1.5" fill="#263238" />
        <circle cx="50" cy="295" r="1.5" fill="#263238" />
        <circle cx="42" cy="285" r="1.5" fill="#263238" />
        <circle cx="58" cy="285" r="1.5" fill="#263238" />
        <path d="M 38 310 Q 50 315, 62 310 C 85 250, 85 70, 65 40 C 55 25, 45 25, 35 40 C 15 70, 15 250, 38 310 Z" fill={`url(#gloss-${type})`} />
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
}

export const SurfboardOverlay: React.FC<SurfboardOverlayProps> = ({ selectedBoardType }) => {
  const boardKeys = Object.keys(surfboardData);
  const selectedIdx = boardKeys.indexOf(selectedBoardType) !== -1 ? boardKeys.indexOf(selectedBoardType) : 2;

  return (
    <div className="relative w-full h-[400px] flex justify-center items-end bg-transparent p-6 overflow-visible">
      {boardKeys.map((key, index) => {
        const isSelected = key === selectedBoardType;
        const board = surfboardData[key as keyof typeof surfboardData];
        
        // מניפת גלשנים - הזזה קלה ימינה ושמאלה כדי שיראו את כולם
        const offset = (index - selectedIdx) * 25; 

        return (
          <div
            key={key}
            className={`absolute bottom-6 transition-all duration-700 ease-in-out ${
              isSelected
                ? 'opacity-100 z-30 drop-shadow-2xl'
                : 'opacity-40 z-10 grayscale'
            }`}
            style={{
              width: '110px', 
              height: '300px',
              left: '50%',
              transform: isSelected 
                ? 'translateX(-50%) scale(1.15)' 
                : `translateX(calc(-50% + ${offset}px)) scale(0.9)`,
              transformOrigin: 'bottom center',
            }}
          >
            <ExactSurfboard type={key} />
            
            {isSelected && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#2A3F45] text-white text-[11px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg z-30">
                {board.name} (המומלץ!)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
