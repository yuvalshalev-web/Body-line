import React, { useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface BiometricCircularButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  userName?: string;
}

export const BiometricCircularButton: React.FC<BiometricCircularButtonProps> = ({
  onClick,
  isLoading,
  disabled = false,
  userName
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center my-1.5 select-none">
      <div className="relative flex items-center justify-center">
        {/* Subtle Ambient Glow */}
        <div 
          className={`absolute w-16 h-16 rounded-full bg-gradient-to-r from-amber-500/30 to-cyan-500/25 blur-lg transition-all duration-500 pointer-events-none ${
            isHovered || isLoading ? 'scale-125 opacity-100' : 'scale-90 opacity-60'
          }`} 
        />

        {/* Compact Central Touch / Fingerprint Button */}
        <motion.button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className={`relative z-10 w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed ${
            isLoading
              ? 'bg-amber-950/90 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
              : 'bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border border-amber-400/40 hover:border-amber-400 shadow-[0_4px_18px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]'
          }`}
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          title={userName ? `כניסה מהירה עבור ${userName}` : 'התחברות בטביעת אצבע / Face ID'}
        >
          {isLoading ? (
            <Loader2 className="animate-spin text-amber-400" size={22} />
          ) : (
            <Fingerprint
              size={26}
              className="text-amber-300 group-hover:text-white transition-all duration-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] group-hover:drop-shadow-[0_0_14px_rgba(245,158,11,1)] group-hover:scale-105"
            />
          )}
        </motion.button>
      </div>

      {/* Compact Subtitle Label */}
      <span className="text-[11px] font-bold text-amber-200/90 group-hover:text-amber-100 transition-colors mt-2 text-center">
        {userName ? `כניסה בנגיעה עבור ${userName}` : 'כניסה בטביעת אצבע / Face ID'}
      </span>
    </div>
  );
};
