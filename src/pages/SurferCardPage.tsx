import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import PlayerCard from '../components/PlayerCard';
import UserAnalytics from '../components/UserAnalytics';
import { OceanJourney } from '../components/OceanJourney';
import UserCategories from '../components/UserCategories';
import { RankRoadmap } from '../components/RankRoadmap';
import { Trophy, Waves, Target, Crown, WifiOff, Flame, Info, Loader2 } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { calculateUserStats } from '../utils/analytics';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { calculateDistance } from '../utils/distanceCalculator';

const Counter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    });
    return () => controls.stop();
  }, [value, duration]);

  return <>{displayValue}</>;
};

const SurferCardPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser } = useAuth();
  const { members, weeklyHistory, yearConfig, siteConfig, isLoading, dbStatus } = useData();
  
  const userData = useMemo(() => {
    if (!currentUser || isLoading) return null;
    return calculateUserStats(currentUser.id, members, weeklyHistory, yearConfig);
  }, [currentUser, members, weeklyHistory, yearConfig, isLoading]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#006994] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold">טוען נתונים...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-lg)] font-['Yehuda_CLM']" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-12 space-y-2 header-wallpaper !py-12 rounded-3xl overflow-hidden" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-4 shadow-sm border border-sky-500/20 relative z-10">
            <Trophy size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title">הדשבורד שלי</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto text-white/80 font-bold">
            הביצועים שלך, ההתקדמות שלך והדרך שלך בים 🌊
          </p>
          
          <div className="flex flex-col items-center gap-3 mt-6">
          </div>
        </div>
      </div>

      {/* Diagnostic Info for Admin */}

      {/* The Professional Player Card */}
      <div className="mb-8">
        <PlayerCard userId={currentUser?.id || 'guest'} />
      </div>

      {/* Motivation Card & Rank Roadmap */}
      <div className="mb-6" dir="rtl">
        <RankRoadmap 
          name={`${userData?.firstName || ''} ${userData?.lastName || ''}`} 
          sessions={userData?.totalSessions || 0} 
          overallProgressPercent={userData?.overallProgressPercent || 0} 
        />
      </div>

      {/* Detailed Analytics below */}
      <div className="mt-16 border-t border-white/20 pt-16">
        <div className="mb-16">
          <OceanJourney />
        </div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-xl flex items-center justify-center text-sunshine-yellow shadow-md shadow-black/5">
            <Waves size={20} />
          </div>
          <h2 className="text-2xl font-black name-title-text tracking-tight">ניתוח ביצועים מעמיק</h2>
        </div>
        <UserCategories userId={currentUser?.id || 'guest'} />
        <div className="mt-8">
          <UserAnalytics userId={currentUser?.id || 'guest'} />
        </div>
      </div>
    </div>
  );
};

export default SurferCardPage;
