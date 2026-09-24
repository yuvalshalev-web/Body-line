import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import UserAnalytics from '../components/UserAnalytics';
import { OceanJourney } from '../components/OceanJourney';
import UserCategories from '../components/UserCategories';
import { SurferProgressionTracker } from '../components/SurferProgressionTracker';
import { Trophy, Waves, Flame, Sparkles, Compass } from 'lucide-react';
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
      return calculateUserStats(
        currentUser.id, 
        members, 
        weeklyHistory, 
        yearConfig, 
        events, 
        siteConfig?.sessionDurationMinutes || 90
      );
    } catch (error) {
      console.error("Error calculating user stats:", error);
      return null;
    }
  }, [currentUser, members, weeklyHistory, yearConfig, events, siteConfig?.sessionDurationMinutes, isLoading]);

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

      {/* Club Iconic Slogan Banner - Light Coastal & Radiant Aesthetic */}
      <div className="max-w-6xl mx-auto mb-10 px-2" dir="rtl">
        <div className="relative overflow-hidden rounded-[2.5rem] py-10 sm:py-14 px-6 sm:px-14 bg-gradient-to-r from-white via-sky-50/70 to-amber-50/60 border-2 border-sky-200/90 shadow-[0_15px_45px_-12px_rgba(0,140,180,0.18)] backdrop-blur-xl group text-center">
          
          {/* Gentle Sun & Sea Ambient Flares */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-amber-200/30 rounded-full blur-[90px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-sky-200/40 rounded-full blur-[90px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          
          {/* Elegant Light Shimmer sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

          {/* Slogan Pure Centerpiece with High-Contrast Typography & Quotation Frame */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            
            {/* Stylized Quotation Watermark */}
            <div className="relative inline-block">
              <span className="absolute -top-5 -right-6 sm:-top-7 sm:-right-8 text-4xl sm:text-6xl text-amber-500/25 font-serif select-none pointer-events-none">
                “
              </span>
              <span className="absolute -bottom-8 -left-6 sm:-bottom-10 sm:-left-8 text-4xl sm:text-6xl text-sky-500/25 font-serif select-none pointer-events-none">
                ”
              </span>

              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black font-yehuda tracking-tight leading-[1.15] select-none drop-shadow-sm">
                {/* Part 1: Deep Ocean Navy with Warm Grit */}
                <span className="font-black font-[900] bg-gradient-to-r from-[#002f4a] via-[#004e75] to-[#006699] bg-clip-text text-transparent inline-block ml-3 sm:ml-4 font-yehuda">
                  הגעת – ניצחת.
                </span>

                {/* Part 2: Electric Coastal Cyan Wave */}
                <span className="font-black font-[900] bg-gradient-to-r from-[#0284c7] via-[#0092b8] to-[#0d9488] bg-clip-text text-transparent inline-block font-yehuda">
                  כל השאר בונוס
                </span>
              </h2>
            </div>

            {/* Glowing Accent Wave Line Underneath */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="w-12 sm:w-20 h-[2px] bg-gradient-to-r from-transparent to-amber-400/80 rounded-full" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" />
              <div className="w-16 sm:w-24 h-[2px] bg-gradient-to-r from-amber-400 via-sky-400 to-transparent rounded-full" />
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)] animate-pulse" />
              <div className="w-12 sm:w-20 h-[2px] bg-gradient-to-l from-transparent to-sky-400/80 rounded-full" />
            </div>

          </div>
        </div>
      </div>
      
      {/* Surfer Progression & Level Tracker (Merged with Club Vibe & Ranks) */}
      <div className="max-w-6xl mx-auto mb-12">
        <SurferProgressionTracker
          userSessions={userData?.totalSessions || 0}
          members={members || []}
          weeklyHistory={weeklyHistory || []}
        />
      </div>
      
      {/* Ocean Journey - Marine Milestones */}
      <div className="max-w-6xl mx-auto mb-12">
        <OceanJourney compact={false} />
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
              <p className="text-sm sm:text-base font-dana-yad font-bold text-[#121212] mt-0.5">
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
