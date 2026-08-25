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

      {/* Motivation Title - Tangible Surfer UI Signature Banner */}
      <div className="max-w-6xl mx-auto mb-8 px-2" dir="rtl">
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-[#003b5c]/95 via-[#004e75]/95 to-[#002f4a]/95 border border-cyan-400/30 shadow-xl backdrop-blur-xl group">
          
          {/* Subtle Ambient Waves & Light Flare in Background */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-amber-400/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
          
          {/* Subtle Animated Gold/Cyan Sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-right">
            
            {/* Right side: Icon Badge & High-End Typography */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              {/* Glowing Medal / Flame Icon Pod */}
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-400 to-cyan-400 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#002b44] border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner">
                  <Trophy size={28} className="drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)] animate-pulse" />
                </div>
              </div>

              {/* Multi-layered High-Impact Title */}
              <div className="flex flex-col">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-dana-yad font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    פילוסופיית המועדון
                  </span>
                  <span className="text-xs font-dana-yad text-cyan-200/80 hidden sm:inline">• ערך הליבה ב-Body-Line</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-dana-yad tracking-tight leading-tight drop-shadow-md">
                  <span className="bg-gradient-to-l from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent font-extrabold ml-2">
                    הגעת – ניצחת.
                  </span>
                  <span className="bg-gradient-to-l from-cyan-100 via-cyan-200 to-white bg-clip-text text-transparent font-bold">
                    כל השאר בונוס
                  </span>
                </h2>
              </div>
            </div>

            {/* Left side: Tagline & Grit Indicator */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center gap-2.5 shadow-sm">
                <Waves size={18} className="text-[#3dbbd3]" />
                <span className="text-xs sm:text-sm font-dana-yad font-bold text-cyan-100">
                  הים תמיד מחכה לך
                </span>
              </div>
            </div>

          </div>
        </div>
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
              <p className="text-sm sm:text-base font-dana-yad font-bold text-slate-800 mt-0.5">
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
