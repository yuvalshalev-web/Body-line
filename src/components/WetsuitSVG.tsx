import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';

const wetsuit43 = '/assets/images/wetsuit-4-3.png';
const wetsuit32 = '/assets/images/wetsuit-3-2.png';
const wetsuit22 = '/assets/images/wetsuit-2-2.png';
const wetsuit22ss = '/assets/images/wetsuit-2-2-ss.png';
const sunShirt = '/assets/images/sun-shirt.png';

interface WetsuitSVGProps {
  thickness?: '4/3' | '3/2' | '2/2' | '2/2-ss' | 'sun-shirt';
  alignBottom?: boolean;
}

const WetsuitSVG: React.FC<WetsuitSVGProps> = ({ thickness = '4/3', alignBottom = false }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state when thickness changes
  useEffect(() => {
    setImgError(false);
  }, [thickness]);

  const imgSrc = thickness === '4/3' ? wetsuit43 : thickness === '3/2' ? wetsuit32 : thickness === '2/2' ? wetsuit22 : thickness === '2/2-ss' ? wetsuit22ss : sunShirt;

  return (
    <div className={`flex ${alignBottom ? 'items-end' : 'items-center'} justify-center w-full h-full ${alignBottom ? 'p-0' : 'p-2'} bg-transparent`}>
      <div className={`relative group w-full max-w-md flex justify-center ${alignBottom ? 'items-end' : 'items-center'}`}>
        {/* Glowing background effect for the transparent image */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[var(--surfer-cyan)]/20 blur-[80px] rounded-full pointer-events-none" />
        
        {!imgError ? (
          <div className={`relative z-10 w-full max-w-[255px] flex flex-col items-center ${alignBottom ? '-translate-y-20' : ''}`}>
            <motion.img
              key={thickness} // Force re-animation on change
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              src={imgSrc} 
              alt={`${thickness} Full Wetsuit`}
              className="w-full h-auto scale-160 drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-170"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center text-[#00426a]/40 border-2 border-dashed border-[#00426a]/20 rounded-3xl p-10 w-full max-w-[250px] aspect-[1/2] bg-white/10 backdrop-blur-sm">
            <ImageIcon size={48} className="mb-4 opacity-50" />
            <p className="text-center font-bold text-sm">
              תמונת החליפה חסרה<br/>
              <span className="text-xs mt-2 block opacity-70">
                יש להעלות את התמונה לתיקיית<br/>
                <code className="bg-black/5 px-2 py-1 rounded mt-1 inline-block" dir="ltr">src/assets/images/wetsuit-{thickness.replace('/', '-')}.png</code>
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WetsuitSVG;
