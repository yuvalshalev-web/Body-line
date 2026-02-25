import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Waves, Server, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CommunityAnalytics from '../components/CommunityAnalytics';
import UserAnalytics from '../components/UserAnalytics';
import SystemMonitor from '../components/SystemMonitor';

type Tab = 'community' | 'system';

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
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('community');

  const tabs = [
    { id: 'attendance', label: 'צלילה לסשנים', icon: SnorkelIcon, color: 'text-[#00FFFF]', bgColor: 'bg-[#006994]', textColor: 'text-white' },
    { id: 'community', label: 'דופק הקהילה', icon: TrendingUp, color: 'text-[#006994]' },
    { id: 'system', label: 'חדר מכונות', icon: Server, color: 'text-slate-900' },
  ];

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 font-black uppercase tracking-widest">גישה למנהלים בלבד</p>
      </div>
    );
  }

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
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'attendance') {
                navigate('/attendance');
              } else {
                setActiveTab(tab.id as Tab);
              }
            }}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-sm transition-all relative overflow-hidden group ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-2xl shadow-slate-200' 
                : tab.id === 'attendance' 
                  ? 'bg-[#006994] text-white shadow-lg shadow-[#006994]/20 hover:bg-[#4E8294]'
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
              <tab.icon size={20} className={activeTab === tab.id ? tab.color : tab.id === 'attendance' ? 'text-[#00FFFF]' : 'opacity-40'} />
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
            {activeTab === 'community' && <CommunityAnalytics />}
            {activeTab === 'system' && <SystemMonitor />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminInfoPage;
