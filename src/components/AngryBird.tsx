import React from 'react';
import { motion } from 'motion/react';

export const AngryBird: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ y: -10, rotate: [0, -10, 10, 0] }}
      className="relative z-50 pointer-events-none"
    >
      <div className="text-5xl drop-shadow-lg filter brightness-110">😡🐦</div>
    </motion.div>
  );
};
