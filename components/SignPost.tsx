import React from 'react';

export const SignPost: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative flex justify-center ${className}`}>
      <svg
        viewBox="0 0 60 1000"
        className="h-full w-full drop-shadow-[15px_0_20px_rgba(0,0,0,0.4)]"
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <linearGradient id="wood-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3e2723" />
            <stop offset="15%" stopColor="#5d4037" />
            <stop offset="40%" stopColor="#4e342e" />
            <stop offset="60%" stopColor="#5d4037" />
            <stop offset="90%" stopColor="#4e342e" />
            <stop offset="100%" stopColor="#3e2723" />
          </linearGradient>
          
          <pattern id="wood-grain-complex" x="0" y="0" width="60" height="200" patternUnits="userSpaceOnUse">
            {/* Organic grain lines */}
            <path d="M0 20 Q 30 25 60 20 M0 60 Q 20 50 60 70 M0 110 Q 40 120 60 100 M0 160 Q 15 170 60 150" 
                  stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none" />
            <path d="M0 40 Q 35 35 60 45 M0 90 Q 25 95 60 80 M0 135 Q 45 130 60 140 M0 185 Q 10 195 60 180" 
                  stroke="rgba(0,0,0,0.2)" strokeWidth="1" fill="none" />
            
            {/* Knots */}
            <ellipse cx="30" cy="90" rx="6" ry="4" fill="rgba(0,0,0,0.15)" />
            <ellipse cx="15" cy="150" rx="4" ry="3" fill="rgba(0,0,0,0.1)" />
            <ellipse cx="45" cy="30" rx="5" ry="3" fill="rgba(0,0,0,0.12)" />
          </pattern>

          <filter id="rough-edges-heavy">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
          </filter>

          <filter id="inner-shadow">
            <feOffset dx="0" dy="0" />
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite operator="out" in="SourceGraphic" in2="blur" result="shadow" />
            <feFlood floodColor="black" floodOpacity="0.5" result="color" />
            <feComposite operator="in" in="color" in2="shadow" result="innerShadow" />
            <feComposite operator="over" in="innerShadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Main Post Body */}
        <rect 
          x="5" y="0" width="50" height="1000" 
          fill="url(#wood-gradient)" 
          filter="url(#rough-edges-heavy)"
        />
        
        {/* Wood Grain Overlay */}
        <rect x="5" y="0" width="50" height="1000" fill="url(#wood-grain-complex)" opacity="0.6" filter="url(#inner-shadow)" />

        {/* Vertical Weathering Cracks */}
        <path d="M 25 0 L 28 150 M 35 200 L 32 450 M 20 500 L 22 900 M 40 900 L 38 1000" 
              stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M 15 100 L 12 300 M 45 400 L 48 650 M 10 700 L 13 950" 
              stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" opacity="0.4" />

        {/* Highlights and Shadows for 3D effect */}
        <rect x="5" y="0" width="8" height="1000" fill="rgba(255,255,255,0.15)" />
        <rect x="47" y="0" width="8" height="1000" fill="rgba(0,0,0,0.25)" />

        {/* Top Cap (Weathered Point) */}
        <path d="M5 15 L30 0 L55 15" fill="#3e2723" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
        
        {/* Bottom Cap (Weathered Cut) */}
        <path d="M5 985 L30 1000 L55 985" fill="#3e2723" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
      </svg>
      
      {/* Physical Knots and Nails (Absolute positioned for better rendering) */}
      <div className="absolute top-[12%] left-[40%] w-4 h-3 rounded-full bg-black/30 blur-[1px] rotate-12" />
      <div className="absolute top-[48%] left-[60%] w-3 h-2 rounded-full bg-black/25 blur-[1px] -rotate-6" />
      <div className="absolute top-[82%] left-[25%] w-5 h-4 rounded-full bg-black/20 blur-[2px] rotate-45" />
      
      {/* Rusty Nails where signs might be attached */}
      {[15, 25, 35, 45, 55, 65, 75, 90].map((top) => (
        <div 
          key={top}
          className="absolute w-2 h-2 rounded-full bg-[#8b4513] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.2)]"
          style={{ 
            top: `${top}%`, 
            left: '50%', 
            transform: 'translateX(-50%)',
            backgroundImage: 'radial-gradient(circle at 30% 30%, #cd853f 0%, transparent 70%)' // Rust highlight
          }}
        />
      ))}
    </div>
  );
};

