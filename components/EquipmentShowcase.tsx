import React from 'react';
import { ExactSurfboard } from './SurfboardOverlay';
import { WetsuitIcon } from './WetsuitIcon';
import { SURFBOARD_CATALOG } from '../data/surfboardCatalog';

export const EquipmentShowcase: React.FC = () => {
  const wetsuitTypes: ('full' | 'shorty' | 'lycra')[] = ['full', 'shorty', 'lycra'];
  const wetsuitLabels = {
    full: 'חליפה מלאה',
    shorty: 'חליפה קצרה (Shorty)',
    lycra: 'לייקרה / גופייה'
  };

  return (
    <div className="space-y-16 py-12" dir="rtl">
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-[#007085] rounded-xl flex items-center justify-center text-white shadow-lg">
            <span className="text-xl font-black">B</span>
          </div>
          <h2 className="text-3xl font-black text-[#002b44]">קטלוג גלשנים (HD Mockup)</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {SURFBOARD_CATALOG.map((board) => (
            <div key={board.id} className="flex flex-col items-center gap-4 group">
              <div className="h-[350px] w-full bg-white/30 backdrop-blur-md rounded-[2rem] border border-white/40 p-6 flex items-end justify-center transition-all hover:scale-105 hover:bg-white/50 shadow-xl">
                <div className="w-24 h-[300px]">
                  <ExactSurfboard type={board.id} />
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-black text-[#002b44] text-lg">{board.name}</h4>
                <p className="text-[#007085] text-[10px] font-bold uppercase tracking-widest">{board.nameEn}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-[#002b44] rounded-xl flex items-center justify-center text-white shadow-lg">
            <span className="text-xl font-black">W</span>
          </div>
          <h2 className="text-3xl font-black text-[#002b44]">חליפות גלישה (Proportions Mockup)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {wetsuitTypes.map((type) => (
            <div key={type} className="flex flex-col items-center gap-4 group">
              <div className="h-[400px] w-full max-w-[200px] bg-white/30 backdrop-blur-md rounded-[2rem] border border-white/40 p-8 flex items-center justify-center transition-all hover:scale-105 hover:bg-white/50 shadow-xl">
                <WetsuitIcon type={type} className="w-full h-full text-[#002b44]" />
              </div>
              <div className="text-center">
                <h4 className="font-black text-[#002b44] text-lg">{wetsuitLabels[type]}</h4>
                <p className="text-[#007085] text-[10px] font-bold uppercase tracking-widest">{type.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
