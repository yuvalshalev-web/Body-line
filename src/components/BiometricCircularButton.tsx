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
        {/* Subtle, glowing, expanding pulsing aura ring behind the fingerprint */}
        {!isLoading && !disabled && (
          <motion.div
            className={`absolute inset-0 rounded-full border pointer-events-none w-20 h-20 -m-1 ${
              isDark ? 'border-[#fbf5df]/20 bg-[#fbf5df]/5' : 'border-[#002b44]/15 bg-[#002b44]/5'
            }`}
            animate={{
              scale: [0.85, 1.45],
              opacity: [0.65, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}

        {/* Compact Central Touch / Fingerprint Button - Completely transparent and borderless */}
        <motion.button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed bg-transparent border-0 p-1 focus:outline-none"
          title="התחברות בטביעת אצבע / Face ID"
        >
          {isLoading ? (
            <Loader2 className={`animate-spin ${isDark ? 'text-[#fbf5df]' : 'text-[#002b44]'}`} size={20} />
          ) : (
            <motion.div
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.85, 1, 0.85],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <BiometricFingerprint
                strokeWidth={2.3}
                className={`w-18 h-22 transition-all duration-300 ${
                  isDark 
                    ? 'text-[#fbf5df] group-hover:text-white drop-shadow-[0_0_12px_rgba(251,245,223,0.55)]' 
                    : 'text-[#002b44] group-hover:text-[#001220] drop-shadow-[0_0_12px_rgba(0,43,68,0.25)]'
                }`}
              />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* No sub-labels under fingerprint to fully comply with removing the label for Spike */}
    </div>
  );
};
