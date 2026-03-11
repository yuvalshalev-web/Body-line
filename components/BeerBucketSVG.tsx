import React from 'react';
import { motion } from 'motion/react';

export const BeerBucketSVG: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 400 450" className="w-full h-full drop-shadow-[20px_20px_30px_rgba(0,0,0,0.6)]">
        <defs>
          {/* Wood Textures */}
          <linearGradient id="wood-base" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3e2723" />
            <stop offset="20%" stopColor="#5d4037" />
            <stop offset="50%" stopColor="#4e342e" />
            <stop offset="80%" stopColor="#5d4037" />
            <stop offset="100%" stopColor="#3e2723" />
          </linearGradient>

          <pattern id="grain-pattern" x="0" y="0" width="100" height="400" patternUnits="userSpaceOnUse">
            <path d="M10 0 Q 30 100 10 200 T 10 400" stroke="rgba(0,0,0,0.2)" fill="none" strokeWidth="2" />
            <path d="M40 0 Q 60 150 40 300 T 40 400" stroke="rgba(0,0,0,0.15)" fill="none" strokeWidth="1.5" />
            <path d="M70 0 Q 90 50 70 150 T 70 350" stroke="rgba(0,0,0,0.25)" fill="none" strokeWidth="2.5" />
            <ellipse cx="50" cy="120" rx="8" ry="12" fill="rgba(0,0,0,0.1)" />
            <ellipse cx="20" cy="280" rx="5" ry="8" fill="rgba(0,0,0,0.08)" />
          </pattern>

          {/* Metal Textures */}
          <linearGradient id="metal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2c1810" />
            <stop offset="50%" stopColor="#4e342e" />
            <stop offset="100%" stopColor="#2c1810" />
          </linearGradient>

          <linearGradient id="handle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9e9e9e" />
            <stop offset="50%" stopColor="#eeeeee" />
            <stop offset="100%" stopColor="#757575" />
          </linearGradient>

          {/* Beer & Glass */}
          <linearGradient id="beer-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD54F" />
            <stop offset="40%" stopColor="#FF8F00" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>

          <radialGradient id="glass-shine" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Ice Textures */}
          <radialGradient id="ice-grad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="white" />
            <stop offset="80%" stopColor="#E0F7FA" />
            <stop offset="100%" stopColor="#B2EBF2" />
          </radialGradient>

          <filter id="frost-effect">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>

          <filter id="rough-wood">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
        </defs>

        {/* --- HANDLES --- */}
        <path d="M30 180 Q 0 180 5 230 Q 10 280 40 260" fill="none" stroke="url(#handle-grad)" strokeWidth="6" strokeLinecap="round" />
        <path d="M370 180 Q 400 180 395 230 Q 390 280 360 260" fill="none" stroke="url(#handle-grad)" strokeWidth="6" strokeLinecap="round" />

        {/* --- BOTTLES --- */}
        <g filter="url(#rough-wood)">
          {/* Left Bottle */}
          <g transform="translate(100, 50) rotate(-12)">
            {/* Bottle Glass Body */}
            <path 
              d="M15 150 Q 15 130 25 120 L 32 30 Q 32 15 55 15 L 55 15 Q 78 15 78 30 L 85 120 Q 95 130 95 150 L 95 260 L 15 260 Z" 
              fill="#3e2723" stroke="#1a0f0a" strokeWidth="1.5" 
            />
            {/* Beer Liquid with depth */}
            <path 
              d="M22 145 L 35 35 Q 35 25 55 25 L 55 25 Q 75 25 75 35 L 88 145 Q 92 150 92 160 L 92 250 L 18 250 L 18 160 Q 18 150 22 145 Z" 
              fill="url(#beer-grad)" opacity="0.9" 
            />
            {/* Neck Rings */}
            <rect x="34" y="45" width="42" height="2" rx="1" fill="rgba(0,0,0,0.3)" />
            <rect x="33" y="55" width="44" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
            
            {/* Crown Cap (Crimped) */}
            <g transform="translate(32, 5)">
              <path d="M0 5 L 46 5 L 44 15 L 2 15 Z" fill="#b71c1c" stroke="#7f0000" strokeWidth="0.5" />
              <path d="M0 15 Q 2 18 4 15 Q 6 18 8 15 Q 10 18 12 15 Q 14 18 16 15 Q 18 18 20 15 Q 22 18 24 15 Q 26 18 28 15 Q 30 18 32 15 Q 34 18 36 15 Q 38 18 40 15 Q 42 18 44 15 Q 46 18 48 15" fill="#b71c1c" stroke="#7f0000" strokeWidth="0.5" />
              <rect x="2" y="0" width="42" height="6" rx="2" fill="#d32f2f" />
            </g>

            {/* Glass Highlights & Reflections */}
            <rect x="25" y="40" width="4" height="120" rx="2" fill="url(#glass-shine)" opacity="0.6" />
            <rect x="80" y="140" width="2" height="80" rx="1" fill="white" opacity="0.1" />
            <path d="M40 120 Q 55 110 70 120" stroke="white" strokeWidth="1" opacity="0.2" fill="none" />
          </g>

          {/* Center Bottle */}
          <g transform="translate(160, 30)">
            <path 
              d="M15 150 Q 15 130 25 120 L 32 30 Q 32 15 55 15 L 55 15 Q 78 15 78 30 L 85 120 Q 95 130 95 150 L 95 260 L 15 260 Z" 
              fill="#3e2723" stroke="#1a0f0a" strokeWidth="1.5" 
            />
            <path 
              d="M22 145 L 35 35 Q 35 25 55 25 L 55 25 Q 75 25 75 35 L 88 145 Q 92 150 92 160 L 92 250 L 18 250 L 18 160 Q 18 150 22 145 Z" 
              fill="url(#beer-grad)" opacity="0.9" 
            />
            <rect x="34" y="45" width="42" height="2" rx="1" fill="rgba(0,0,0,0.3)" />
            <rect x="33" y="55" width="44" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
            
            <g transform="translate(32, 5)">
              <path d="M0 5 L 46 5 L 44 15 L 2 15 Z" fill="#b71c1c" stroke="#7f0000" strokeWidth="0.5" />
              <path d="M0 15 Q 2 18 4 15 Q 6 18 8 15 Q 10 18 12 15 Q 14 18 16 15 Q 18 18 20 15 Q 22 18 24 15 Q 26 18 28 15 Q 30 18 32 15 Q 34 18 36 15 Q 38 18 40 15 Q 42 18 44 15 Q 46 18 48 15" fill="#b71c1c" stroke="#7f0000" strokeWidth="0.5" />
              <rect x="2" y="0" width="42" height="6" rx="2" fill="#d32f2f" />
            </g>

            <rect x="25" y="40" width="4" height="120" rx="2" fill="url(#glass-shine)" opacity="0.6" />
            <rect x="80" y="140" width="2" height="80" rx="1" fill="white" opacity="0.1" />
          </g>

          {/* Right Bottle */}
          <g transform="translate(240, 60) rotate(15)">
            <path 
              d="M15 150 Q 15 130 25 120 L 32 30 Q 32 15 55 15 L 55 15 Q 78 15 78 30 L 85 120 Q 95 130 95 150 L 95 260 L 15 260 Z" 
              fill="#3e2723" stroke="#1a0f0a" strokeWidth="1.5" 
            />
            <path 
              d="M22 145 L 35 35 Q 35 25 55 25 L 55 25 Q 75 25 75 35 L 88 145 Q 92 150 92 160 L 92 250 L 18 250 L 18 160 Q 18 150 22 145 Z" 
              fill="url(#beer-grad)" opacity="0.9" 
            />
            <rect x="34" y="45" width="42" height="2" rx="1" fill="rgba(0,0,0,0.3)" />
            <rect x="33" y="55" width="44" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
            
            <g transform="translate(32, 5)">
              <path d="M0 5 L 46 5 L 44 15 L 2 15 Z" fill="#b71c1c" stroke="#7f0000" strokeWidth="0.5" />
              <path d="M0 15 Q 2 18 4 15 Q 6 18 8 15 Q 10 18 12 15 Q 14 18 16 15 Q 18 18 20 15 Q 22 18 24 15 Q 26 18 28 15 Q 30 18 32 15 Q 34 18 36 15 Q 38 18 40 15 Q 42 18 44 15 Q 46 18 48 15" fill="#b71c1c" stroke="#7f0000" strokeWidth="0.5" />
              <rect x="2" y="0" width="42" height="6" rx="2" fill="#d32f2f" />
            </g>

            <rect x="25" y="40" width="4" height="120" rx="2" fill="url(#glass-shine)" opacity="0.6" />
            <rect x="80" y="140" width="2" height="80" rx="1" fill="white" opacity="0.1" />
          </g>
        </g>

        {/* --- BUCKET --- */}
        <g filter="url(#rough-wood)">
          {/* Bucket Planks */}
          <path d="M50 150 L 350 150 L 310 420 L 90 420 Z" fill="url(#wood-base)" stroke="#1a0f0a" strokeWidth="3" />
          <path d="M50 150 L 350 150 L 310 420 L 90 420 Z" fill="url(#grain-pattern)" opacity="0.6" />
          
          {/* Plank Dividers */}
          <g stroke="#1a0f0a" strokeWidth="1.5" opacity="0.4">
            <line x1="100" y1="150" x2="125" y2="420" />
            <line x1="150" y1="150" x2="165" y2="420" />
            <line x1="200" y1="150" x2="200" y2="420" />
            <line x1="250" y1="150" x2="235" y2="420" />
            <line x1="300" y1="150" x2="275" y2="420" />
          </g>

          {/* Metal Hoops */}
          <rect x="52" y="190" width="296" height="15" fill="url(#metal-grad)" stroke="#1a0f0a" strokeWidth="1" />
          <rect x="82" y="380" width="236" height="15" fill="url(#metal-grad)" stroke="#1a0f0a" strokeWidth="1" />
          
          {/* Rivets */}
          {[65, 125, 200, 275, 335].map(x => (
            <circle key={`top-${x}`} cx={x} cy="197" r="4" fill="#8b4513" stroke="#1a0f0a" strokeWidth="1" />
          ))}
          {[95, 150, 200, 250, 305].map(x => (
            <circle key={`bot-${x}`} cx={x} cy="387" r="4" fill="#8b4513" stroke="#1a0f0a" strokeWidth="1" />
          ))}
        </g>

        {/* --- ICE --- */}
        <g opacity="0.85">
          {/* Mist */}
          <ellipse cx="200" cy="150" rx="140" ry="40" fill="white" opacity="0.3" filter="url(#frost-effect)" />
          
          {/* Individual Ice Cubes (High Density) */}
          {[
            {x:70, y:140, r:10}, {x:100, y:135, r:-5}, {x:130, y:145, r:15}, {x:160, y:130, r:-10},
            {x:190, y:140, r:5}, {x:220, y:135, r:20}, {x:250, y:145, r:-15}, {x:280, y:130, r:10},
            {x:310, y:140, r:-5}, {x:85, y:160, r:12}, {x:115, y:155, r:-8}, {x:145, y:165, r:18},
            {x:175, y:150, r:-12}, {x:205, y:160, r:6}, {x:235, y:155, r:22}, {x:265, y:165, r:-18},
            {x:295, y:150, r:12}, {x:100, y:120, r:5}, {x:140, y:115, r:-10}, {x:180, y:125, r:15},
            {x:220, y:110, r:-5}, {x:260, y:120, r:10}, {x:300, y:115, r:-15}
          ].map((ice, i) => (
            <rect 
              key={`ice-${i}`}
              x={ice.x} y={ice.y} width="35" height="35" rx="6" 
              fill="url(#ice-grad)" 
              stroke="white" strokeWidth="0.5"
              transform={`rotate(${ice.r}, ${ice.x + 17}, ${ice.y + 17})`}
              filter="url(#frost-effect)"
            />
          ))}
        </g>

        {/* --- CENTER NAIL (Rusty & Dinged) --- */}
        <g transform="translate(200, 240)">
          <path 
            d="M-10 -8 L 4 -12 L 12 -4 L 8 8 L -4 12 L -12 4 Z" 
            fill="#8b4513" 
            stroke="#1a0f0a" 
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.6))' }}
          />
          <circle cx="-4" cy="-4" r="3" fill="#cd853f" opacity="0.7" />
        </g>
      </svg>
    </motion.div>
  );
};


