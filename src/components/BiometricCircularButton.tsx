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
          className={`absolute w-16 h-16 rounded-full bg-cyan-500/25 blur-lg transition-all duration-500 pointer-events-none ${
            isHovered || isLoading ? 'scale-125 opacity-100' : 'scale-90 opacity-50'
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
              ? 'bg-cyan-950/90 border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,175,194,0.6)]'
              : 'bg-gradient-to-b from-[#0e2c38]/90 via-[#081d26]/95 to-[#040e13]/95 hover:from-[#133d4e] hover:to-[#0a232e] border border-[#00AFC2]/50 hover:border-[#00e5ff] shadow-[0_4px_15px_rgba(0,175,194,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]'
          }`}
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          title={userName ? `כניסה מהירה עבור ${userName}` : 'התחברות בטביעת אצבע / Face ID'}
        >
          {isLoading ? (
            <Loader2 className="animate-spin text-[#00e5ff]" size={22} />
          ) : (
            <Fingerprint
              size={26}
              className="text-cyan-300 group-hover:text-white transition-all duration-300 drop-shadow-[0_0_8px_rgba(0,229,255,0.7)] group-hover:drop-shadow-[0_0_14px_rgba(0,229,255,1)] group-hover:scale-105"
            />
          )}
        </motion.button>
      </div>

      {/* Compact Subtitle Label */}
      <span className="text-[11px] font-medium text-cyan-200/80 group-hover:text-cyan-100 transition-colors mt-1.5 text-center">
        {userName ? `כניסה מהירה (${userName})` : 'כניסה בטביעת אצבע / Face ID'}
      </span>
    </div>
  );
};
