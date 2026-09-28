import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BiometricFingerprint } from './BiometricFingerprint';

interface BiometricCircularButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  userName?: string;
  theme?: 'light' | 'dark';
}

export const BiometricCircularButton: React.FC<BiometricCircularButtonProps> = ({
  onClick,
  isLoading,
  disabled = false,
  userName,
  theme = 'light'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col items-center justify-center my-0.5 select-none">
      <div className="relative flex items-center justify-center">
        {/* Subtle Ambient Glow - Highly reduced for light theme to prevent ellipse look */}
        <div 
          className={`absolute w-16 h-16 rounded-full transition-all duration-500 pointer-events-none bg-white/5 blur-sm ${
            isHovered || isLoading ? 'scale-105 opacity-100' : 'scale-95 opacity-30'
          }`} 
        />

        {/* Compact Central Touch / Fingerprint Button */}
        <motion.button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative z-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed ${
            isDark
              ? 'w-14 h-14 rounded-full shadow-md bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border border-amber-400/40 hover:border-amber-400 shadow-[0_4px_18px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]'
              : 'w-22 h-22 bg-white/5 hover:bg-white/10 border-0 shadow-none rounded-full'
          }`}
          title="התחברות בטביעת אצבע / Face ID"
        >
          {isLoading ? (
            <Loader2 className={`animate-spin ${isDark ? 'text-amber-400' : 'text-white'}`} size={26} />
          ) : (
            <BiometricFingerprint
              strokeWidth={2.4}
              className={`transition-all duration-300 group-hover:scale-102 ${
                isDark 
                  ? 'w-7 h-8 text-amber-300 group-hover:text-white drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                  : 'w-18 h-21 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)] hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.6)]'
              }`}
            />
          )}
        </motion.button>
      </div>

      {/* No sub-labels under fingerprint to fully comply with removing the label for Spike */}
    </div>
  );
};
