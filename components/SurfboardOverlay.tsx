import React from 'react';

// נתונים סטטיים על סוגי הגלשנים, כולל ה-SVGs לקווי המתאר
const surfboardData = {
  shortboard: {
    name: 'שורטבורד',
    // SVG פשוט לייצוג קו מתאר של שורטבורד מחודד
    svg: (
      <svg viewBox="0 0 50 150" className="w-full h-full stroke-current fill-none" strokeWidth="2">
        <path d="M25,5 C15,30 5,70 5,100 C5,130 15,145 25,145 C35,145 45,130 45,100 C45,70 35,30 25,5 Z" />
      </svg>
    ),
  },
  fish: {
    name: 'פיש',
    // SVG פשוט לייצוג קו מתאר של פיש רחב וקצר
    svg: (
      <svg viewBox="0 0 60 130" className="w-full h-full stroke-current fill-none" strokeWidth="2">
        <path d="M30,5 C20,25 10,55 10,85 C10,110 20,125 30,125 C40,125 50,110 50,85 C50,55 40,25 30,5 Z M30,125 L30,115" />
      </svg>
    ),
  },
  funboard: {
    name: 'פאנבורד',
    // SVG פשוט לייצוג קו מתאר של פאנבורד ורסטילי
    svg: (
      <svg viewBox="0 0 65 170" className="w-full h-full stroke-current fill-none" strokeWidth="2">
        <path d="M32.5,5 C22.5,30 12.5,70 12.5,110 C12.5,145 22.5,165 32.5,165 C42.5,165 52.5,145 52.5,110 C52.5,70 42.5,30 32.5,5 Z" />
      </svg>
    ),
  },
  longboard: {
    name: 'לונגבורד',
    // SVG פשוט לייצוג קו מתאר של לונגבורד ארוך ורחב
    svg: (
      <svg viewBox="0 0 70 200" className="w-full h-full stroke-current fill-none" strokeWidth="2">
        <path d="M35,5 C25,30 15,80 15,130 C15,175 25,195 35,195 C45,195 55,175 55,130 C55,80 45,30 35,5 Z" />
      </svg>
    ),
  },
  softboard: {
    name: 'סופטבורד',
    // SVG פשוט לייצוג קו מתאר של סופטבורד עבה ורחב
    svg: (
      <svg viewBox="0 0 75 190" className="w-full h-full stroke-current fill-none" strokeWidth="2">
        <path d="M37.5,5 C27.5,35 17.5,85 17.5,135 C17.5,175 27.5,185 37.5,185 C47.5,185 57.5,175 57.5,135 C57.5,85 47.5,35 37.5,5 Z" strokeWidth="3" />
      </svg>
    ),
  },
};

interface SurfboardOverlayProps {
  selectedBoardType: string;
}

// הרכיב המציג את ההשוואה הוויזואלית ב-Overlay
export const SurfboardOverlay: React.FC<SurfboardOverlayProps> = ({ selectedBoardType }) => {
  return (
    <div className="relative w-full h-80 flex justify-center items-end bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-white/40 overflow-hidden">
      {Object.entries(surfboardData).map(([key, board]) => {
        const isSelected = key === selectedBoardType;

        const width = key === 'shortboard' ? 60 : key === 'fish' ? 70 : key === 'funboard' ? 80 : key === 'longboard' ? 90 : 100;
        const height = key === 'shortboard' ? 180 : key === 'fish' ? 160 : key === 'funboard' ? 210 : key === 'longboard' ? 240 : 230;

        return (
          <div
            key={key}
            className={`absolute bottom-4 transition-all duration-500 ease-in-out ${
              isSelected
                ? 'text-cyan-600 opacity-100 scale-110 z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]' // הדגשת הגלשן הנבחר
                : 'text-slate-400 opacity-20 scale-100 z-0' // שאר הגלשנים ב-Gray out
            }`}
            style={{
              width: `${width}px`, 
              height: `${height}px`,
              marginLeft: isSelected ? '0' : `${(key === 'shortboard' ? -120 : key === 'fish' ? -60 : key === 'funboard' ? 0 : key === 'longboard' ? 60 : 120)}px`,
              transform: isSelected ? 'translateX(0) scale(1.1)' : 'translateX(0)',
              left: '50%',
              transformOrigin: 'bottom center',
              translate: '-50% 0'
            }}
          >
            {board.svg}
            
            {/* הצגת השם מעל הגלשן הנבחר */}
            {isSelected && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-cyan-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg z-20">
                {board.name} (המומלץ!)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
