import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const starfishImg = '';
const penguinImg = '';
const mantaRayImg = '';
const sharkImg = '';
const orcaImg = '';

const getCategories = (assets: any) => [
  { id: 'starfish', name: 'כוכב ים', image: assets?.starfish || starfishImg },
  { id: 'penguin', name: 'פינגווין', image: assets?.penguin || penguinImg },
  { id: 'manta_ray', name: 'מנטה ריי', image: assets?.mantaRay || mantaRayImg },
  { id: 'shark', name: 'כריש', image: assets?.shark || sharkImg },
  { id: 'orca', name: 'אורקה', image: assets?.orca || orcaImg },
];

const GamificationCategories: React.FC = () => {
  const { members, weeklyHistory, siteAssets } = useData();
  const { currentUser } = useAuth();

  const categories = useMemo(() => getCategories(siteAssets), [siteAssets]);

  const userCategory = useMemo(() => {
    if (!currentUser || !members || !weeklyHistory) return 'starfish';
    return 'starfish'; 
  }, [currentUser, members, weeklyHistory]);

  return (
    <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl">
      <h3 className="text-2xl font-black text-white mb-6 text-center">המסע שלך באוקיינוס</h3>
      <div className="flex justify-between items-center gap-4">
        {categories.map((cat) => {
          const isActive = true; 
          return (
            <motion.div
              key={cat.id}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${isActive ? 'bg-white/20' : 'bg-black/20 grayscale'}`}
              whileHover={{ scale: 1.05 }}
            >
              <img 
                src={cat.image} 
                alt={cat.name} 
                className={`${cat.id === 'manta_ray' ? 'w-32 h-32' : cat.id === 'orca' ? 'w-[70px] h-[70px]' : 'w-16 h-16'} object-cover rounded-full`}
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-white">{cat.name}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GamificationCategories;
