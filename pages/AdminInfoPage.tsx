import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Waves, Server, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CommunityAnalytics from '../components/CommunityAnalytics';
import UserAnalytics from '../components/UserAnalytics';
import SystemMonitor from '../components/SystemMonitor';

type Tab = 'community' | 'user' | 'system';

const AdminInfoPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('user');

  const tabs = [
    { id: 'user', label: 'הגל שלי', icon: Waves, color: 'text-[#40E0D0]' },
    { id: 'community', label: 'דופק הקהילה', icon: TrendingUp, color: 'text-[#006994]', adminOnly: true },
    { id: 'system', label: 'חדר מכונות', icon: Server, color: 'text-slate-900', adminOnly: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || currentUser?.role === 'Admin');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 font-['Assistant']" dir="rtl">
      {/* Header */}
      <div className="mb-12 text-center md:text-right">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-[#00FFFF] text-[10px] font-black rounded-full mb-4 shadow-xl">
          <ShieldAlert size={14} />
          מרכז הבקרה "תצפית הים"
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
          סטטיסטיקה וביצועים
        </h1>
        <p className="text-slate-400 font-bold mt-3 text-lg">
          ניטור בזמן אמת של פעילות הקהילה והמערכת
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-16">
        {filteredTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-sm transition-all relative overflow-hidden group ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-2xl shadow-slate-200' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white z-0"
              />
            )}
            <div className="relative z-10 flex items-center gap-3">
              <tab.icon size={20} className={activeTab === tab.id ? tab.color : 'opacity-40'} />
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
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
            {activeTab === 'user' && <UserAnalytics userId={currentUser?.id || 'guest'} />}
            {activeTab === 'community' && <CommunityAnalytics />}
            {activeTab === 'system' && <SystemMonitor />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminInfoPage;
