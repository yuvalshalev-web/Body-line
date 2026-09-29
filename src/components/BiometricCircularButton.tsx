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
        {/* High-fidelity layered concentric pulsing aura rings for supreme visual awareness */}
        {!isLoading && !disabled && (
          <>
            <motion.div
              className={`absolute inset-0 rounded-full border pointer-events-none w-20 h-20 -m-1 ${
                isDark ? 'border-[#fbf5df]/30 bg-[#fbf5df]/8' : 'border-[#002b44]/25 bg-[#002b44]/8'
              }`}
              animate={{
                scale: [0.80, 1.50],
                opacity: [0.75, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
            <motion.div
              className={`absolute inset-0 rounded-full border pointer-events-none w-20 h-20 -m-1 ${
                isDark ? 'border-[#fbf5df]/18 bg-[#fbf5df]/4' : 'border-[#002b44]/12 bg-[#002b44]/4'
              }`}
              animate={{
                scale: [0.80, 1.50],
                opacity: [0.75, 0],
              }}
              transition={{
                duration: 2.4,
                delay: 1.2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </>
        )}

        {/* Compact Central Touch / Fingerprint Button - Completely transparent and borderless */}
        <motion.button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative z-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed bg-transparent border-0 p-1 focus:outline-none"
          title="התחברות בטביעת אצבע / Face ID"
        >
          {isLoading ? (
            <Loader2 className={`animate-spin ${isDark ? 'text-[#fbf5df]' : 'text-[#002b44]'}`} size={20} />
          ) : (
            <motion.div
              animate={{
                scale: [0.96, 1.05, 0.96],
                opacity: [0.80, 1, 0.80],
                filter: isDark 
                  ? ["drop-shadow(0 0 2px rgba(251,245,223,0.25))", "drop-shadow(0 0 15px rgba(251,245,223,0.75))", "drop-shadow(0 0 2px rgba(251,245,223,0.25))"]
                  : ["drop-shadow(0 0 2px rgba(0,43,68,0.12))", "drop-shadow(0 0 15px rgba(0,43,68,0.50))", "drop-shadow(0 0 2px rgba(0,43,68,0.12))"]
              }}
              transition={{
                duration: 2.0,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <BiometricFingerprint
                strokeWidth={2.3}
                className={`w-18 h-22 transition-all duration-300 ${
                  isDark 
                    ? 'text-[#fbf5df] group-hover:text-white' 
                    : 'text-[#002b44] group-hover:text-[#001220]'
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
