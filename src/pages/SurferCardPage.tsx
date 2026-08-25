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
    <div className="max-w-7xl mx-auto px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-lg)] font-yehuda luxury-bg" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="luxury-card mb-12 relative overflow-hidden !rounded-3xl">
        <div className="grain-overlay" />
        <div className="surfboard-hero-container header-wallpaper !py-8 md:!py-12 relative z-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
          <div className="header-content-wrapper relative z-20 flex flex-col lg:flex-row items-center justify-between px-4 lg:px-12 gap-8">
            <div className="text-center lg:text-right flex-1">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-4 shadow-sm border border-sky-500/20 relative z-10">
                <Trophy size={40} />
              </div>
            <h1 className="main-page-title">
              <span className="surfer-title text-[#121212]">הדשבורד שלי</span>
            </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Info for Admin */}

      {/* The Digital Athlete Wallet / Passport */}
      <div className="mb-12">
        <AthletePassport />
      </div>

      {/* Motivation Title */}
      <div className="max-w-6xl mx-auto mb-6 text-center lg:text-right px-4" dir="rtl">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent tracking-tight font-yehuda drop-shadow-sm">
          הגעת – ניצחת. כל השאר בונוס
        </h2>
      </div>
      
      {/* Modern Coastal Bento Grid: Rank Roadmap & Ocean Journey */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Right side (RTL) - Rank Roadmap Card */}
          <div className="w-full flex flex-col">
            <RankRoadmap 
              name={`${userData?.firstName || ''} ${userData?.lastName || ''}`} 
              sessions={userData?.totalSessions || 0} 
              overallProgressPercent={userData?.overallProgressPercent || 0} 
              noFrame
            />
          </div>
          
          {/* Left side (RTL) - Ocean Journey Alabaster Glass Card */}
          <div className="w-full flex flex-col">
            <OceanJourney compact noFrame />
          </div>
        </div>
      </div>

      {/* Detailed Analytics below */}
      <div className="mt-14 pt-10 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00AFC2]/15 border border-[#00AFC2]/30 rounded-xl flex items-center justify-center text-[#007b8a] shadow-xs">
              <Waves size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-dana-yad font-bold text-[#092734]">
                נתוני התמדה והשתתפות
              </h2>
              <p className="text-xs sm:text-sm font-dana-yad font-semibold text-slate-500 mt-0.5">
                מדדי עקביות, נחישות (Grit) וסטטיסטיקת אימונים אישית
              </p>
            </div>
          </div>
        </div>
        
        <UserCategories userId={currentUser?.id || 'guest'} />
        
        <div className="mt-4">
          <UserAnalytics userId={currentUser?.id || 'guest'} />
        </div>
      </div>
    </div>
  );
};

export default SurferCardPage;
