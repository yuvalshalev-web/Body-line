import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink, MoreHorizontal, ChevronUp } from 'lucide-react';
import { RespectLocalsSign } from './RespectLocalsSign';

export const ExplorationScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 relative overflow-hidden">
      {/* Top Navigation */}
      <div className="flex justify-between items-center z-20">
        <button className="p-2 bg-white/50 backdrop-blur-md rounded-full border border-white/20 shadow-sm hover:bg-white/70 transition-colors">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex gap-2">
          <button className="p-2 bg-white/50 backdrop-blur-md rounded-full border border-white/20 shadow-sm hover:bg-white/70 transition-colors">
            <ExternalLink size={24} className="text-slate-800" />
          </button>
          <button className="p-2 bg-white/50 backdrop-blur-md rounded-full border border-white/20 shadow-sm hover:bg-white/70 transition-colors">
            <MoreHorizontal size={24} className="text-slate-800" />
          </button>
        </div>
      </div>

      {/* Center Sign */}
      <div className="flex-1 flex items-center justify-center z-10">
        <RespectLocalsSign />
      </div>

      {/* Bottom Swipe Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex flex-col items-center gap-2 pb-8 z-20"
      >
        <span className="text-slate-500 font-medium text-sm tracking-wide uppercase">
          Swipe up to explore area
        </span>
        <div className="w-16 h-1.5 bg-slate-300 rounded-full overflow-hidden">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-full h-full bg-slate-500 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
};
