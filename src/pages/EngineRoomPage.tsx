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
    <div className={embedded ? "space-y-8" : "max-w-7xl mx-auto px-4 py-8 space-y-8"}>
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

      {/* System Monitor Component with all infrastructure metrics */}
      <SystemMonitor />
    </div>
  );
};

export default EngineRoomPage;
