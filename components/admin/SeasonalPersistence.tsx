import React from 'react';
import { Waves } from 'lucide-react';
import { OceanPulse } from '../OceanPulse';

const SeasonalPersistence: React.FC = () => {
  return (
    <div className="glass-panel p-8 rounded-[3rem] border border-white/20 shadow-soft space-y-8">
      <h2 className="text-2xl font-black text-[#2B2B2E] mb-4">התמדה עונתית</h2>
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[var(--surfer-cyan)]/20 rounded-[8px] border border-black/10 shadow-sm">
            <Waves className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={24} />
          </div>
          <h3 className="text-3xl font-black text-[#000000] tracking-tight" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>דופק האוקיינוס</h3>
        </div>
        <OceanPulse />
      </section>
    </div>
  );
};

export default SeasonalPersistence;
