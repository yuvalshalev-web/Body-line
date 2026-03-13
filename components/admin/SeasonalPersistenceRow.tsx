import React, { useMemo } from 'react';
import { Sun, Snowflake, Leaf, Waves } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { calculateSeasonalGrit } from '../../src/utils/analytics';

const SeasonalPersistenceRow: React.FC = () => {
  const { weeklyHistory, members } = useData();

  const seasonalGrit = useMemo(() => {
    const calculatedScores = calculateSeasonalGrit(weeklyHistory, members);
    
    const seasonsConfig = [
      { name: 'סתיו', icon: Waves, color: 'var(--surfer-orange)' },
      { name: 'חורף', icon: Snowflake, color: 'var(--surfer-cyan)' },
      { name: 'אביב', icon: Leaf, color: 'var(--surfer-teal)' },
      { name: 'קיץ', icon: Sun, color: 'var(--surfer-yellow)' },
    ];

    return seasonsConfig.map(config => {
      const scoreData = calculatedScores.find(s => s.name === config.name);
      return {
        ...config,
        score: scoreData ? scoreData.score : 0
      };
    });
  }, [weeklyHistory, members]);

  return (
    <div className="glass-panel p-8 rounded-[3rem] border border-white/20 shadow-soft space-y-6">
      <h2 className="text-2xl font-black text-[#2B2B2E]">אחוזי התמדה קהילתיים לפי עונות השנה</h2>
      <div className="grid grid-cols-4 gap-6">
        {seasonalGrit.map((s, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-black/5">
            <div className="p-3 rounded-[12px] border border-black/5 shadow-inner" style={{ backgroundColor: `${s.color}20` }}>
              <s.icon 
                className="filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" 
                size={20} 
                style={{ color: s.color }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#000000]/40 uppercase tracking-widest" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>{s.name}</span>
              <span className="text-xl font-black text-[#000000]">{s.score}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeasonalPersistenceRow;
