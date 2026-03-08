import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Waves, Zap, Trophy, Flame, Calendar, ChevronLeft, ArrowUpRight, ArrowDownRight, Minus, Users, Info, Target, Compass, Dumbbell, Timer, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../src/utils/dateUtils';
import { calculateUserStats } from '../src/utils/analytics';
import RadarChart from './RadarChart';
import SessionDetails from './SessionDetails';

const OCEAN_PALETTE = [
  '#0284c7', // 0 (12 o'clock)
  '#0369a1', // 1
  '#075985', // 2
  '#0c4a6e', // 3
  '#1e40af', // 4
  '#172554', // 5 (5 o'clock) - Darkest
  '#f0f9ff', // 6 (6 o'clock) - Lightest
  '#e0f2fe', // 7
  '#bae6fd', // 8
  '#7dd3fc', // 9
  '#38bdf8', // 10
  '#0ea5e9', // 11
];

const getOceanWaterGradient = (percent: number) => {
  if (percent >= 90) return 'from-blue-900/60 via-blue-800/40 to-blue-700/20';
  if (percent >= 75) return 'from-blue-700/60 via-blue-600/40 to-blue-500/20';
  if (percent >= 50) return 'from-blue-500/60 via-blue-400/40 to-blue-300/20';
  if (percent >= 25) return 'from-blue-400/60 via-blue-300/40 to-blue-200/20';
  return 'from-blue-200/60 via-blue-100/40 to-blue-50/20';
};

export const AstrodeckGauge: React.FC<{
  value: number;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  footer?: React.ReactNode;
  isGrit?: boolean;
}> = ({ value, label, icon, tooltip, footer, isGrit }) => {
  const padPath = "M 135 38 Q 80 45 40 60 C 30 150 60 250 100 320 C 120 360 160 380 185 380 L 185 330 C 185 300 135 300 135 250 Z M 145 35 Q 200 20 255 35 L 245 250 C 245 290 155 290 155 250 Z M 265 38 Q 320 45 360 60 C 370 150 340 250 300 320 C 280 360 240 380 215 380 L 215 330 C 215 300 265 300 265 250 Z";

  return (
    <div className={`flex-1 w-full flex flex-col items-center text-center group/pad ${isGrit ? 'relative' : ''}`}>
      
      <div className="flex items-center gap-2 mb-6">
        <div className={`${isGrit ? 'text-blue-700' : 'text-blue-400'} group-hover/pad:text-white transition-colors`}>
          {icon}
        </div>
        <h3 className={`text-[11px] font-black uppercase tracking-[0.15em] ${isGrit ? 'text-blue-900' : 'text-[#2B2B2E]'}`}>{label}</h3>
        <div className="gt-info-wrapper">
          <Info size={14} className="text-[#2B2B2E]/30 hover:text-[#2B2B2E] transition-colors" />
          <span className="gt-tooltip" style={{ bottom: '160%', width: '200px' }}>{tooltip}</span>
        </div>
      </div>

      <div className="relative w-full max-w-[170px] aspect-square flex items-center justify-center">
        {isGrit && (
          <div className="absolute inset-0 bg-blue-400/10 blur-[40px] rounded-full animate-pulse pointer-events-none" />
        )}
        
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)] relative z-10">
          <defs>
            <pattern id="diamond-pad-gauge" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#f8fafc" />
              <path d="M8 2 L14 8 L8 14 L2 8 Z" fill="#f1f5f9" />
              <circle cx="8" cy="8" r="2" fill="#e2e8f0" />
            </pattern>
            
            <clipPath id="pad-clip-gauge">
              <path d={padPath} />
            </clipPath>

            <linearGradient id={isGrit ? "grit-liquid-grad" : "ocean-liquid-grad-gauge"} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isGrit ? "#0369a1" : "#38bdf8"} />
              <stop offset="100%" stopColor={isGrit ? "#0c4a6e" : "#0284c7"} />
            </linearGradient>

            <radialGradient id="glass-lens-gauge" cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="70%" stopColor="white" stopOpacity="0.05" />
              <stop offset="100%" stopColor="white" stopOpacity="0.0" />
            </radialGradient>

            <linearGradient id="glass-shine-gauge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="50%" stopColor="white" stopOpacity="0.05" />
              <stop offset="100%" stopColor="white" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="surface-shimmer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            <filter id="pad-shadow-gauge">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Background Pad */}
          <path 
            d={padPath} 
            fill="url(#diamond-pad-gauge)" 
            stroke={isGrit ? "#075985" : "#e2e8f0"} 
            strokeWidth={isGrit ? "1.5" : "1"}
            filter="url(#pad-shadow-gauge)"
          />

          {/* Water Filling Effect */}
          <g clipPath="url(#pad-clip-gauge)">
            <motion.rect
              initial={{ y: 400 }}
              animate={{ y: 400 - (value * 4) }}
              transition={{ duration: 2, ease: "circOut" }}
              x="0"
              y="0"
              width="400"
              height="400"
              fill={`url(#${isGrit ? 'grit-liquid-grad' : 'ocean-liquid-grad-gauge'})`}
              className="opacity-70"
            />
            
            {/* Animated Wave Top */}
            <motion.g
              initial={{ y: 400 }}
              animate={{ y: 400 - (value * 4) }}
              transition={{ duration: 2, ease: "circOut" }}
            >
              <svg x="-200" y="-15" width="800" height="30" viewBox="0 0 200 30" preserveAspectRatio="none" className="animate-[ripple_2s_infinite_linear]">
                <path 
                  d="M0 15 Q 25 0 50 15 T 100 15 T 150 15 T 200 15 V 30 H 0 Z" 
                  fill={isGrit ? "#0ea5e9" : "#7dd3fc"} 
                  opacity="0.6" 
                />
              </svg>
              
              {/* Sparkles / Glimmer Effect */}
              {[...Array(12)].map((_, i) => (
                <g key={i}>
                  <motion.circle
                    cx={30 + (i * 30) + (Math.random() * 20)}
                    cy={-5 + (Math.random() * 10)}
                    r={1 + Math.random() * 2}
                    fill="white"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 1 + Math.random() * 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                  {/* Glint Cross */}
                  {i % 3 === 0 && (
                    <motion.g
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ 
                        opacity: [0, 0.8, 0],
                        rotate: [0, 90],
                        scale: [0.5, 1.2, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      style={{ originX: `${30 + (i * 30) + 10}px`, originY: '0px' }}
                    >
                      <line x1={30 + (i * 30) + 5} y1="0" x2={30 + (i * 30) + 15} y2="0" stroke="white" strokeWidth="0.5" />
                      <line x1={30 + (i * 30) + 10} y1="-5" x2={30 + (i * 30) + 10} y2="5" stroke="white" strokeWidth="0.5" />
                    </motion.g>
                  )}
                </g>
              ))}
              
              {/* Surface Sweep Shimmer */}
              <motion.rect
                x="-400"
                y="-10"
                width="400"
                height="20"
                fill="url(#surface-shimmer-grad)"
                animate={{ x: [ -400, 800 ] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1
                }}
              />

              {/* Horizontal Shimmer Lines on Surface */}
              {[...Array(3)].map((_, i) => (
                <motion.rect
                  key={`shimmer-${i}`}
                  x={100 + (i * 80)}
                  y={-2}
                  width={40}
                  height={1.5}
                  rx={0.75}
                  fill="white"
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ 
                    opacity: [0, 0.4, 0],
                    x: [0, 60]
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    delay: i * 1,
                    ease: "linear"
                  }}
                />
              ))}
            </motion.g>
          </g>

          {/* Glassmorphism Overlay - Lens Effect & Shine */}
          <path 
            d={padPath} 
            fill="url(#glass-lens-gauge)" 
            className="pointer-events-none"
            opacity="0.8"
          />
          <path 
            d={padPath} 
            fill="url(#glass-shine-gauge)" 
            className="pointer-events-none"
            opacity="0.6"
          />
          
          <path 
            d={padPath} 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
            strokeOpacity="0.4"
            className="pointer-events-none"
          />

          {/* Grip Bars Overlay */}
          <g fill="#94a3b8" opacity="0.2" pointerEvents="none">
            <rect x="170" y="80" width="60" height="6" rx="3" />
            <rect x="170" y="100" width="60" height="6" rx="3" />
            <rect x="170" y="120" width="60" height="6" rx="3" />
            <rect x="170" y="140" width="60" height="6" rx="3" />
            <rect x="170" y="160" width="60" height="6" rx="3" />
            <rect x="170" y="180" width="60" height="6" rx="3" />
            <rect x="170" y="200" width="60" height="6" rx="3" />
            <rect x="170" y="220" width="60" height="6" rx="3" />
            <rect x="170" y="240" width="60" height="6" rx="3" />
          </g>
          
          {/* Pad Outline for definition */}
          <path 
            d={padPath} 
            fill="none" 
            stroke="#cbd5e1" 
            strokeWidth="1" 
            opacity="0.5"
          />
        </svg>

        {/* Central Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-black text-[#334155] tabular-nums tracking-tighter drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
          >
            {value}%
          </motion.span>
        </div>
      </div>
      {footer}
    </div>
  );
};

const UserAnalytics: React.FC<{ userId: string }> = ({ userId }) => {
  const { members, weeklyHistory, yearConfig, events, isLoading } = useData();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const data = useMemo(() => {
    if (isLoading) return null;
    return calculateUserStats(userId, members, weeklyHistory, yearConfig, events);
  }, [userId, members, weeklyHistory, yearConfig, events, isLoading]);

  const theme = useMemo(() => {
    if (!data) return null;
    const rankColors: Record<string, { bg: string, glow: string }> = {
      'פופ-אפיסט': { bg: 'from-[#021626] to-[#010d17]', glow: 'rgba(255,255,255,0.1)' },
      'תופס פינה': { bg: 'from-[#021626] to-[#010d17]', glow: 'rgba(255,255,255,0.1)' },
      'ליין-אפיסט': { bg: 'from-[#06402b] to-[#065f46]', glow: 'rgba(6, 95, 70, 0.5)' },
      'כריש פטיש': { bg: 'from-[#1e1b4b] to-[#312e81]', glow: 'rgba(67, 56, 202, 0.6)' },
      'קלי סלייטר': { bg: 'from-[#92400e] via-[#b45309] to-[#92400e]', glow: 'rgba(251, 191, 36, 0.8)' }
    };
    return rankColors[data.rank] || rankColors['פופ-אפיסט'];
  }, [data]);

  const userSessions = useMemo(() => {
    if (!weeklyHistory || !userId) return [];
    return weeklyHistory
      .filter(s => s.participantIds?.includes(userId))
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
  }, [weeklyHistory, userId]);

  if (isLoading || !data || !theme) return <div className="p-8 text-center font-black text-blue-400 animate-pulse">טוען את הגל שלך...</div>;

  const COLORS = ['#60a5fa', '#021626'];

  const bgGradient = '#FDFBF7';

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 min-h-[400px]" dir="rtl">
      {/* Unified Modern Dashboard - Dynamic Premium Style matching Surfer Card */}
      <motion.div 
        className="glass-panel p-[var(--spacing-md)] md:p-[var(--spacing-lg)] rounded-[var(--radius-lg)] relative transition-all duration-1000"
      >
        {/* Neumorphic Inner Shadow Overlay */}
        <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(0,0,0,0.05)] pointer-events-none rounded-[var(--radius-lg)]" />
        
        {/* Decorative background elements */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-slate-200/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-slate-200/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 items-center justify-center gap-8 md:gap-4 relative z-10">
          
          {/* Left Column */}
          <div className="flex flex-col gap-12 md:gap-20">
            <AstrodeckGauge 
              value={data.attendancePercent}
              label="מד התמדה אישי"
              icon={<Waves size={18} />}
              tooltip="כמה פעמים הגעת מתוך כל האימונים שהיו מתחילת השנה."
            />

            <AstrodeckGauge 
              value={data.yearlyStability.percent}
              label={`יציבות שנתית ${yearConfig?.startDate ? new Date(yearConfig.startDate).getFullYear().toString() : '2026'}`}
              icon={<Calendar size={18} />}
              tooltip="מדד הבודק כמה שבועות היית פעיל ברצף מתחילת העונה."
              footer={
                <p className="mt-4 text-[10px] font-bold text-white/40">
                  היית פעיל ב-{data.yearlyStability.activeWeeks} מתוך {data.yearlyStability.totalWeeks} שבועות השנה.
                </p>
              }
            />
          </div>

          {/* Center Column - Grit */}
          <div className="flex justify-center py-8 md:py-0">
            <div className="scale-110 md:scale-125 transform transition-transform duration-500">
              <AstrodeckGauge 
                value={Math.round(data.gritScore)}
                label="מד נחישות Grit"
                icon={<Trophy size={18} />}
                tooltip="זהו מדד ה'נחישות' שלך. הוא בודק כמה אתה מתמיד. הוא משלב את כמות הסשנים שעשית עם העקביות שלך (הרצף). העקביות חשובה יותר מהכמות."
                isGrit={true}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-12 md:gap-20">
            <AstrodeckGauge 
              value={data.percentile}
              label="מד התמדה יחסי"
              icon={<Target size={18} />}
              tooltip="איפה אתה עומד ביחס לכל שאר המתאמנים בנבחרת."
            />

            <AstrodeckGauge 
              value={data.progress[1].value}
              label="מעורבות חברתית"
              icon={<Users size={18} />}
              tooltip="השתתפות באירועים ופעילויות קהילתיות מעבר לים."
            />
          </div>

        </div>
      </motion.div>

      {/* Surf Compass (Radar Chart) - Future Use - Dynamic Premium Style */}
      <motion.div 
        className="glass-panel p-[var(--spacing-md)] md:p-[var(--spacing-lg)] rounded-[var(--radius-lg)] relative overflow-hidden transition-all duration-1000"
      >
        {/* Neumorphic Inner Shadow Overlay */}
        <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(0,0,0,0.05)] pointer-events-none rounded-[var(--radius-lg)]" />
        
          <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-[var(--spacing-xs)]">
              <Compass size={18} className="text-[#2B2B2E]" />
              <h3 className="text-lg font-black text-[#2B2B2E]">רדאר השיפור שלך</h3>
            </div>
            <span className="text-[10px] font-bold text-[#2B2B2E] uppercase tracking-widest mt-1">(לשימוש עתידי)</span>
          </div>

          <div className="h-[450px] w-full relative">
            <RadarChart />
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-[var(--radius-md)] border border-white/10">
            <p className="text-[10px] text-white/40 font-bold text-center leading-relaxed">
              המצפן מנתח את היכולות המקצועיות שלך בים. נתונים אלו יוזנו על ידי המדריכים לאחר הערכות תקופתיות.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Session History - Collapsible Dropbox Style - Dynamic Premium Style */}
      <motion.div 
        className="glass-panel rounded-[var(--radius-lg)] relative overflow-hidden transition-all duration-1000"
        onMouseLeave={() => setIsHistoryOpen(false)}
      >
        {/* Neumorphic Inner Shadow Overlay */}
        <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(0,0,0,0.05)] pointer-events-none rounded-[var(--radius-lg)]" />
        
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          onMouseEnter={() => setIsHistoryOpen(true)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors group relative z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-[var(--radius-sm)] flex items-center justify-center text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-all">
              <Calendar size={16} />
            </div>
            <div className="text-right">
              <h3 className="text-sm font-black text-[#2B2B2E]">היסטוריית סשנים</h3>
              <p className="text-[10px] font-bold text-[#2B2B2E] uppercase tracking-wider">
                {isHistoryOpen ? 'לחץ לסגירה' : `צפה ב-${userSessions.length} סשנים אחרונים`}
              </p>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${isHistoryOpen ? 'rotate-[-90deg]' : ''}`}>
            <ChevronLeft size={18} className="text-slate-300 group-hover:text-slate-500" />
          </div>
        </button>

        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-t border-white/5 relative z-10"
            >
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {userSessions.slice(0, 15).map((session, idx) => {
                  const formattedDate = formatDate(session.date);

                  return (
                    <div 
                      key={session.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className="group px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Waves size={14} className="text-[#2B2B2E]/50 group-hover:text-[var(--ocean-liquid)] transition-colors" />
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2B2B2E] text-xs">{formattedDate}</span>
                          <span className="text-[10px] text-[#2B2B2E]/60 font-medium">
                            {session.instructorName || 'מדריך חבל זוג'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-[#2B2B2E]/50 font-black">
                          <Users size={10} />
                          <span>{session.participantIds?.length || 0}</span>
                        </div>
                        <ChevronLeft size={14} className="text-[#2B2B2E]/50 group-hover:text-[var(--ocean-liquid)] group-hover:translate-x-[-2px] transition-all" />
                      </div>
                    </div>
                  );
                })}

                {userSessions.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-white/30 font-bold italic text-xs">אין סשנים לתצוגה</p>
                  </div>
                )}
              </div>
              
              {userSessions.length > 15 && (
                <div className="p-3 bg-black/20 text-center border-t border-white/5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                    מציג 15 סשנים אחרונים
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {selectedSession && (
          <SessionDetails 
            session={selectedSession} 
            members={members} 
            onClose={() => setSelectedSession(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAnalytics;
