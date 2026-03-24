import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Member, PerformanceScore } from '../types';
import { GlassButtonV2 as GlassButton } from './GlassButton';
import { 
  User, 
  Calendar, 
  Save, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Activity,
  Zap,
  RotateCw,
  Target,
  Dumbbell,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PerformanceInputProps {
  member: Member;
  onClose: () => void;
}

const PARAMETERS = [
  { key: 'paddle', label: 'יעילות החתירה', icon: Activity, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { key: 'positioning', label: 'קריאת גלים', icon: Target, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { key: 'takeOff', label: 'Take-off ודרופ', icon: Zap, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { key: 'style', label: 'זרימה וחיבור', icon: Palette, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  { key: 'turns', label: 'שליטה בציוד', icon: RotateCw, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { key: 'stamina', label: 'חוסן מנטלי', icon: Dumbbell, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
];

export const PerformanceInput: React.FC<PerformanceInputProps> = ({ member, onClose }) => {
  const { addPerformanceScore, performanceScores } = useData();
  const { currentUser } = useAuth();
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scores, setScores] = useState({
    paddle: 5,
    takeOff: 5,
    turns: 5,
    positioning: 5,
    stamina: 5,
    style: 5,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleScoreChange = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await addPerformanceScore({
        memberId: member.id,
        paddle: scores.paddle,
        takeOff: scores.takeOff,
        turns: scores.turns,
        positioning: scores.positioning,
        stamina: scores.stamina,
        style: scores.style,
        instructorId: currentUser.id,
        instructorName: `${currentUser.firstName} ${currentUser.lastName}`,
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (error) {
      console.error("Failed to save performance score:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">הזנת הערכות ביצועים</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">עבור: {member.firstName} {member.lastName}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-slate-400" />
                <select 
                  value={month} 
                  onChange={e => setMonth(parseInt(e.target.value))}
                  className="bg-transparent font-black text-slate-900 outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(new Date(2000, i, 1))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <select 
                value={year} 
                onChange={e => setYear(parseInt(e.target.value))}
                className="bg-transparent font-black text-slate-900 outline-none cursor-pointer"
              >
                {[year - 1, year, year + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PARAMETERS.map(param => (
                <div key={param.key} className="space-y-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${param.bgColor} flex items-center justify-center ${param.color}`}>
                        <param.icon size={16} />
                      </div>
                      <span className="font-black text-slate-700">{param.label}</span>
                    </div>
                    <span className="text-lg font-black text-sky-600">{scores[param.key as keyof typeof scores]}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1"
                    value={scores[param.key as keyof typeof scores]}
                    onChange={e => handleScoreChange(param.key, parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <GlassButton 
                type="submit" 
                variant="primary" 
                className="flex-1 !py-4"
                isLoading={isSaving}
              >
                <Save size={20} />
                <span>שמור הערכות</span>
              </GlassButton>
              <GlassButton 
                type="button" 
                variant="secondary" 
                className="flex-1 !py-4"
                onClick={onClose}
              >
                <span>ביטול</span>
              </GlassButton>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
