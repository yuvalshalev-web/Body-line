import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Compass } from 'lucide-react';

const CategoryVector: React.FC<{ id: string; className?: string }> = ({ id, className = "w-10 h-10" }) => {
  if (id === 'starfish') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 8 L61 36 L92 36 L66 55 L76 84 L50 66 L24 84 L34 55 L8 36 L39 36 Z" fill="#0284c7" />
        <circle cx="50" cy="48" r="5" fill="white" opacity="0.8" />
      </svg>
    );
  }
  if (id === 'penguin') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="62" rx="20" ry="28" fill="#0369a1" />
        <ellipse cx="50" cy="60" rx="12" ry="18" fill="white" opacity="0.6" />
        <circle cx="50" cy="28" r="13" fill="#0369a1" />
        <path d="M47 31 L53 31 L50 36 Z" fill="#f59e0b" />
      </svg>
    );
  }
  if (id === 'manta_ray') {
    return (
      <svg viewBox="0 0 200 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 50 Q100 12 180 50 Q100 88 20 50 Z" fill="#0891b2" />
        <path d="M90 50 Q100 40 110 50" stroke="white" strokeWidth="2.5" opacity="0.7" />
        <path d="M100 78 L100 105" stroke="#0891b2" strokeWidth="3" />
      </svg>
    );
  }
  if (id === 'shark') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50 Q50 22 90 50 Q50 78 10 50 Z" fill="#334155" />
        <path d="M52 35 L70 18 L62 38 Z" fill="#334155" />
        <circle cx="75" cy="46" r="2.5" fill="white" />
      </svg>
    );
  }
  if (id === 'orca') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 58 Q50 20 90 58 Q50 88 10 58 Z" fill="#0f172a" />
        <path d="M42 38 L56 16 L52 42 Z" fill="#0f172a" />
        <ellipse cx="70" cy="50" rx="6" ry="3" fill="white" opacity="0.8" />
      </svg>
    );
  }
  return <Compass className={className} color="#0284c7" />;
};

const getCategories = (assets: any) => [
  { id: 'starfish', name: 'כוכב ים', image: assets?.starfish || '' },
  { id: 'penguin', name: 'פינגווין', image: assets?.penguin || '' },
  { id: 'manta_ray', name: 'מנטה ריי', image: assets?.mantaRay || assets?.manta_ray || '' },
  { id: 'shark', name: 'כריש', image: assets?.shark || '' },
  { id: 'orca', name: 'אורקה', image: assets?.orca || '' },
];

const CategoryCard: React.FC<{ cat: { id: string; name: string; image: string } }> = ({ cat }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/20 hover:bg-white/30 transition-all duration-300 shadow-sm"
      whileHover={{ scale: 1.05 }}
    >
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/40 overflow-hidden">
        {cat.image && !imgError ? (
          <img 
            src={cat.image} 
            alt={cat.name} 
            className="w-full h-full object-contain p-1"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <CategoryVector id={cat.id} className="w-10 h-10" />
        )}
      </div>
      <span className="text-xs font-bold text-[#121212]">{cat.name}</span>
    </motion.div>
  );
};

const GamificationCategories: React.FC = () => {
  const { siteAssets } = useData();

  const categories = useMemo(() => getCategories(siteAssets), [siteAssets]);

  return (
    <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl">
      <h3 className="text-2xl font-black text-[#121212] mb-6 text-center">המסע שלך באוקיינוס</h3>
      <div className="flex justify-between items-center gap-4 flex-wrap sm:flex-nowrap">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>
    </div>
  );
};

export default GamificationCategories;
