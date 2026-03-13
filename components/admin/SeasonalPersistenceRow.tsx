
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useData } from '../../contexts/DataContext';
import { calculateSeasonalGrit } from '../../src/utils/analytics';
import { Waves, Snowflake, Leaf, Sun, Info } from 'lucide-react';

const SeasonalPersistenceRow: React.FC = () => {
  const { weeklyHistory, members } = useData();

  const seasonalGrit = useMemo(() => {
    const calculatedScores = calculateSeasonalGrit(weeklyHistory, members);
    
    const seasonsConfig = [
      { name: 'סתיו', icon: Waves, color: '#FF9F1C' }, // Orange
      { name: 'חורף', icon: Snowflake, color: '#3dbbd3' }, // Cyan
      { name: 'אביב', icon: Leaf, color: '#2DA95C' }, // Green
      { name: 'קיץ', icon: Sun, color: '#FFDE45' }, // Yellow
    ];

    return seasonsConfig.map(config => {
      const scoreData = calculatedScores.find(s => s.name === config.name);
      return {
        ...config,
        score: scoreData ? scoreData.score : 0,
        actuals: scoreData ? scoreData.actuals : 0,
        capacity: scoreData ? scoreData.capacity : 0,
        sessionCount: scoreData ? scoreData.sessionCount : 0
      };
    });
  }, [weeklyHistory, members]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {seasonalGrit.map((s, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="home-glass-card p-6 flex flex-col items-center justify-center gap-3 relative overflow-hidden group"
        >
          {/* Subtle background glow */}
          <div 
            className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500" 
            style={{ backgroundColor: s.color }}
          />
          
          <div className="p-3 rounded-[12px] border border-black/5 shadow-inner" style={{ backgroundColor: `${s.color}20` }}>
            <s.icon 
              className="filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" 
              size={24} 
              style={{ color: s.color }}
            />
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] font-black text-[#000000]/40 uppercase tracking-widest">{s.name}</span>
              <div className="gt-info-wrapper relative cursor-help">
                <Info size={10} className="text-black/20 hover:text-black/40 transition-colors" />
                <div className="gt-tooltip">
                  אחוז ההתמדה הקהילתי בעונת ה{s.name}.
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-black text-[#000000]">{s.score}%</span>
            </div>
          </div>
          
          {/* Beveled edge effect */}
          <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
        </motion.div>
      ))}
    </div>
  );
};

export default SeasonalPersistenceRow;
