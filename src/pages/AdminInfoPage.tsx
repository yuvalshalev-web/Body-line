import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Waves, Server, ShieldAlert, Users, Activity, Book, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CommunityAnalytics from '../components/CommunityAnalytics';
import CommunityHeatMap from '../components/CommunityHeatMap';
import SessionStatsPage from './SessionStatsPage';
import TrendsDashboard from '../components/admin/TrendsDashboard';
import GlassNavigationBar from '../components/GlassNavigationBar';
import AdminHelpPage from '../components/admin/AdminHelpPage';
import SeasonalPersistence from '../components/admin/SeasonalPersistence';

import { useRandomHeader } from '../hooks/useRandomHeader';

type Tab = 'community' | 'trends' | 'attendance' | 'help' | 'seasonal';

const SnorkelIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 10c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
    <path d="M10 17v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
    <path d="M12 8v3" />
    <path d="M20 10v4c0 2-1 3-3 3" />
    <path d="M20 10c0-3 1-4 2-4" />
  </svg>
);

const AdminInfoPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('community');

  const tabs = [
    { id: 'community', label: 'דופק הקהילה', icon: <TrendingUp size={20} /> },
    { id: 'trends', label: 'התמדה קבוצתית', icon: <Activity size={20} /> },
    { id: 'seasonal', label: 'התמדה עונתית', icon: <Calendar size={20} /> },
    { id: 'attendance', label: 'צוללים לסשנים', icon: <Waves size={20} /> },
    { id: 'help', label: 'מדריך אנליטיקה', icon: <Book size={20} /> },
  ];

  if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Instructor') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#000000] font-black uppercase tracking-widest">גישה לרכזים ומדריכים בלבד</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 font-['Yehuda_CLM']" dir="rtl">
      {/* Header */}
      <div className="surfboard-hero-container mb-8 header-wallpaper !py-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
            <TrendingUp size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title">דופק הקהילה</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto">
            ניטור בזמן אמת של פעילות הקהילה והמערכת 📈
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-16">
        <GlassNavigationBar 
          items={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as Tab)}
          theme="sunset"
        />
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
            {activeTab === 'community' && (
              <div className="space-y-12">
                <CommunityAnalytics />
                <CommunityHeatMap />
              </div>
            )}
            {activeTab === 'trends' && <TrendsDashboard />}
            {activeTab === 'seasonal' && <SeasonalPersistence />}
            {activeTab === 'attendance' && <SessionStatsPage />}
            {activeTab === 'help' && <AdminHelpPage />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminInfoPage;
