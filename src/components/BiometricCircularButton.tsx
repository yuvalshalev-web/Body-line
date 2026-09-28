import React, { useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

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
    <div className="flex flex-col items-center justify-center my-1.5 select-none">
      <div className="relative flex items-center justify-center">
        {/* Subtle Ambient Glow */}
        <div 
          className={`absolute w-16 h-16 rounded-full transition-all duration-500 pointer-events-none ${
            isDark 
              ? 'bg-gradient-to-r from-amber-500/30 to-cyan-500/25 blur-lg' 
              : 'bg-gradient-to-r from-[#00AFC2]/25 to-sky-400/25 blur-lg'
          } ${
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
          className={`relative z-10 w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-md cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed ${
            isDark
              ? isLoading
                ? 'bg-amber-950/90 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                : 'bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border border-amber-400/40 hover:border-amber-400 shadow-[0_4px_18px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]'
              : isLoading
                ? 'bg-cyan-50/90 border-2 border-[#00AFC2] shadow-[0_0_20px_rgba(0,175,194,0.45)]'
                : 'bg-white/70 backdrop-blur-xl border-2 border-[#00AFC2]/35 hover:border-[#00AFC2] shadow-[0_6px_20px_rgba(0,175,194,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.9)] hover:shadow-[0_8px_26px_rgba(0,175,194,0.35)]'
          }`}
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          title={userName ? `כניסה מהירה עבור ${userName}` : 'התחברות בטביעת אצבע / Face ID'}
        >
          {isLoading ? (
            <Loader2 className={`animate-spin ${isDark ? 'text-amber-400' : 'text-[#00AFC2]'}`} size={22} />
          ) : (
            <Fingerprint
              size={26}
              className={`${
                isDark 
                  ? 'text-amber-300 group-hover:text-white drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                  : 'text-[#00AFC2] group-hover:text-cyan-700 drop-shadow-[0_2px_6px_rgba(0,175,194,0.25)]'
              } transition-all duration-300 group-hover:scale-105`}
            />
          )}
        </motion.button>
      </div>

      {/* Compact Subtitle Label */}
      <span className={`text-[11px] font-bold mt-2 text-center transition-colors ${
        isDark ? 'text-amber-200/90 group-hover:text-amber-100' : 'text-slate-600 group-hover:text-slate-900'
      }`}>
        {userName ? `כניסה בנגיעה עבור ${userName}` : 'כניסה בטביעת אצבע / Face ID'}
      </span>
    </div>
  );
};
