import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
import SystemMonitor from '../components/SystemMonitor';

interface EngineRoomPageProps {
  embedded?: boolean;
}

export const EngineRoomPage: React.FC<EngineRoomPageProps> = ({ embedded = false }) => {
  const navigate = useNavigate();

  return (
    <div className={embedded ? "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" : "max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500"}>
      {!embedded && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black text-sm px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <ArrowRight size={18} />
            <span>חזרה לפאנל הניהול</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>פאנל ניהול</span>
            <span>/</span>
            <span className="text-slate-700">חדר המכונות</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-black">
            <Terminal size={24} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">חדר המכונות</h2>
        </div>
        <p className="text-slate-500 font-medium">ניטור תשתיות, ביצועי שרת, לוגים וצריכת משאבים בזמן אמת</p>
      </div>

      {/* System Monitor Component with all infrastructure metrics */}
      <div className="pt-4">
        <SystemMonitor />
      </div>
    </div>
  );
};

export default EngineRoomPage;
