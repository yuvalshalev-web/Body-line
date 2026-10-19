import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Waves, Activity, Calendar, HeartHandshake, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdminUser } from '../constants';
import GlassNavigationBar from '../components/GlassNavigationBar';
import { useRandomHeader } from '../hooks/useRandomHeader';

// Lazy-load individual tab components to ensure fast initial page load and isolated error boundaries
const CommunityExecutiveSnapshot = lazy(() => import('../components/admin/CommunityExecutiveSnapshot'));
const CommunityAnalytics = lazy(() => import('../components/CommunityAnalytics'));
const CommunityHeatMap = lazy(() => import('../components/CommunityHeatMap'));
const TrendsDashboard = lazy(() => import('../components/admin/TrendsDashboard'));
const PairsPersistence = lazy(() => import('../components/admin/PairsPersistence'));
const SeasonalPersistence = lazy(() => import('../components/admin/SeasonalPersistence'));
const SessionStatsPage = lazy(() => import('./SessionStatsPage'));
const AdminHelpPage = lazy(() => import('../components/admin/AdminHelpPage'));

const TabLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
    <Loader2 className="animate-spin text-sky-500" size={32} />
    <span className="text-xs font-bold">טוען נתונים...</span>
  </div>
);

type Tab = 'snapshot' | 'community' | 'trends' | 'pairs' | 'attendance' | 'help' | 'seasonal';

const AdminInfoPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('snapshot');

  const tabs = [
    { id: 'snapshot', label: 'דופק הקהילה וסיכום מנהלים', icon: <Sparkles size={20} /> },
    { id: 'community', label: 'דופק הקהילה', icon: <TrendingUp size={20} /> },
    { id: 'trends', label: 'התמדה קבוצתית', icon: <Activity size={20} /> },
    { id: 'pairs', label: 'התמדה זוגית', icon: <HeartHandshake size={20} /> },
    { id: 'seasonal', label: 'התמדה עונתית', icon: <Calendar size={20} /> },
    { id: 'attendance', label: 'צוללים לסשנים', icon: <Waves size={20} /> },
    { id: 'help', label: 'איך זה עובד?', icon: <HelpCircle size={20} /> },
  ];

  if (!isAdminUser(currentUser) && currentUser?.role !== 'Instructor') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#000000] font-black uppercase tracking-widest">גישה לרכזים, מדריכים ואפ-שייפר בלבד</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 font-yehuda luxury-bg" dir="rtl">
      {/* Combined Header Unit with Integrated Nav - Boxed Inset */}
      <div className="luxury-card p-6 mb-12 relative overflow-hidden">
        <div className="grain-overlay" />
        <div className="surfboard-hero-container mb-6 header-wallpaper !py-10 rounded-[2rem] relative z-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
          <div className="header-content-wrapper relative z-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
              <TrendingUp size={40} />
            </div>
            <h1 className="main-page-title">
              <span className="surfer-title text-[#121212]">דופק הקהילה</span>
            </h1>
            <p className="header-subtitle max-w-2xl mx-auto text-[#121212]">
              ניטור בזמן אמת של פעילות הקהילה והמערכת 📈
            </p>
          </div>
        </div>

        <div className="w-full">
          <GlassNavigationBar 
            items={tabs}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as Tab)}
            theme="sunset"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'snapshot' && <CommunityExecutiveSnapshot />}
              {activeTab === 'community' && (
                <div className="space-y-12">
                  <CommunityAnalytics />
                  <CommunityHeatMap />
                </div>
              )}
              {activeTab === 'trends' && <TrendsDashboard />}
              {activeTab === 'pairs' && <PairsPersistence />}
              {activeTab === 'seasonal' && <SeasonalPersistence />}
              {activeTab === 'attendance' && <SessionStatsPage />}
              {activeTab === 'help' && <AdminHelpPage />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminInfoPage;
