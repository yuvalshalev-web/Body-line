import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { AthletePassport } from '../components/AthletePassport';
import UserAnalytics from '../components/UserAnalytics';
import { OceanJourney } from '../components/OceanJourney';
import UserCategories from '../components/UserCategories';
import { RankRoadmap } from '../components/RankRoadmap';
import { Trophy, Waves } from 'lucide-react';
import { animate } from 'motion/react';
import { calculateUserStats } from '../utils/analytics';
import { useRandomHeader } from '../hooks/useRandomHeader';

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
  const { members, weeklyHistory, yearConfig, siteConfig, isLoading, dbStatus, events } = useData();
  
  const userData = useMemo(() => {
    if (!currentUser || isLoading || !members || members.length === 0) return null;
    try {
      return calculateUserStats(currentUser.id, members, weeklyHistory, yearConfig, events);
    } catch (error) {
      console.error("Error calculating user stats:", error);
      return null;
    }
  }, [currentUser, members, weeklyHistory, yearConfig, events, isLoading]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#006994] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold">טוען נתונים...</p>
      </div>
    </div>
  );

  console.log("SurferCardPage: Rendering successfully for user:", userData?.firstName);

  return (
    <div className="max-w-7xl mx-auto px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-lg)] font-yehuda" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-12 header-wallpaper !py-8 md:!py-12 rounded-3xl overflow-hidden" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="relative z-20 flex flex-col lg:flex-row items-center justify-between px-4 lg:px-12 gap-8">
          <div className="header-content-wrapper text-center lg:text-right flex-1">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-4 shadow-sm border border-sky-500/20 relative z-10">
              <Trophy size={40} />
            </div>
            <h1 className="main-page-title">
              <span className="surfer-title">הדשבורד שלי</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Diagnostic Info for Admin */}

      {/* The Digital Athlete Wallet / Passport */}
      <div className="mb-12">
        <AthletePassport />
      </div>

      {/* Motivation Card & Rank Roadmap */}
      <div className="max-w-5xl mx-auto mb-6 text-center lg:text-right px-4" dir="rtl">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent tracking-tight font-yehuda drop-shadow-sm">
          הגעת – ניצחת. כל השאר בונוס
        </h2>
      </div>
      
      <div className="max-w-6xl mx-auto mb-12 relative z-10 w-full rounded-2xl"
           style={{
             background: '#A8A9AD',
             padding: '16px',
             backgroundImage: 'linear-gradient(145deg, #e2e3e5 0%, #c5c6c9 20%, #A8A9AD 50%, #d0d1d4 80%, #828387 100%)',
             boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 4px 4px 6px rgba(255,255,255,0.9), inset -4px -4px 8px rgba(0,0,0,0.4), inset 1px 1px 0px rgba(255,255,255,1), 0 0 0 1px rgba(150,150,150,0.5)'
           }}>
        <div className="flex flex-col lg:flex-row w-full rounded-sm overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]" style={{ minHeight: '600px' }}>
           {/* Right side (RTL) - Whiteboard */}
           <div className="w-full lg:w-1/2 relative bg-[#F8F9FA]">
              <RankRoadmap 
                name={`${userData?.firstName || ''} ${userData?.lastName || ''}`} 
                sessions={userData?.totalSessions || 0} 
                overallProgressPercent={userData?.overallProgressPercent || 0} 
                noFrame
              />
           </div>
           {/* Divider */}
           <div className="w-full h-2 lg:w-2 lg:h-auto bg-gradient-to-b from-[#A8A9AD] via-[#c5c6c9] to-[#828387] shadow-[inset_1px_0_2px_rgba(255,255,255,0.5),inset_-1px_0_2px_rgba(0,0,0,0.3)] z-20" />
           {/* Left side (RTL) - Corkboard */}
           <div className="w-full lg:w-1/2 relative">
              <OceanJourney compact noFrame />
           </div>
        </div>
        
        {/* Lower Tray across the whole board */}
        <div className="absolute bottom-0 left-8 right-8 h-8 bg-gradient-to-b from-[#e5e7eb] to-[#9ca3af] rounded-b-lg flex items-end px-12 pb-2 gap-8 z-20 transform translate-y-full"
             style={{ boxShadow: '0 10px 15px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.8)' }}>
          {/* Black Marker */}
          <div className="w-24 h-4 bg-gradient-to-b from-gray-700 via-black to-gray-900 rounded-full relative transform -rotate-2 translate-y-1"
               style={{ boxShadow: '2px 4px 6px rgba(0,0,0,0.6)' }}>
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gray-600 rounded-r-full" />
            <div className="absolute left-2 top-0 bottom-0 w-1 bg-gray-500 rounded-full" />
          </div>
          {/* Blue Eraser */}
          <div className="w-20 h-6 bg-gradient-to-b from-blue-500 to-blue-800 rounded-sm relative transform rotate-3"
               style={{ boxShadow: '2px 4px 6px rgba(0,0,0,0.6)' }}>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 rounded-b-sm" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400 rounded-t-sm opacity-50" />
          </div>
        </div>
      </div>

      {/* Detailed Analytics below */}
      <div className="mt-16 border-t border-white/20 pt-16">
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
