import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { AthletePassport } from '../components/AthletePassport';
import { Award, ArrowRight, Activity, ShieldCheck, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRandomHeader } from '../hooks/useRandomHeader';

const AthletePassportPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser } = useAuth();
  const { isLoading } = useData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#006994] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-lg)] font-yehuda luxury-bg" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="luxury-card mb-10 relative overflow-hidden !rounded-3xl">
        <div className="grain-overlay" />
        <div 
          className="surfboard-hero-container header-wallpaper !py-8 md:!py-12 relative z-10" 
          style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}
        >
          <div className="header-content-wrapper relative z-20 flex flex-col lg:flex-row items-center justify-between px-4 lg:px-12 gap-8">
            <div className="text-center lg:text-right flex-1">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-400 mb-4 shadow-sm border border-amber-400/20 relative z-10">
                <Award size={40} className="drop-shadow-[0_2px_12px_rgba(251,191,36,0.5)]" />
              </div>
              <h1 className="main-page-title">
                <span className="surfer-title text-[#121212]">דרכון אקסטרים</span>
              </h1>
              <p className="text-slate-600 font-dana-yad font-bold text-base md:text-lg mt-2 max-w-xl mx-auto lg:mx-0">
                ארנק האקסטרים והספורט האישי שלך: תעודות, רישיונות רשמיים, חותמות מסעות ואישורי פעילות
              </p>
            </div>

            {/* Quick Navigation Action to Dashboard */}
            <div className="relative z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/surfer-card')}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs flex items-center gap-2 backdrop-blur-xl shadow-lg transition-all active:scale-95 group"
              >
                <Activity size={16} className="text-cyan-300 group-hover:scale-110 transition-transform" />
                <span>מעבר לדשבורד</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Athlete Passport Interactive Component */}
      <div className="mb-14">
        <AthletePassport />
      </div>
    </div>
  );
};

export default AthletePassportPage;
