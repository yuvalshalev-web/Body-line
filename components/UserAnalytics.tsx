import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Waves, Zap, Trophy, Flame, Calendar, ChevronLeft, ArrowUpRight, ArrowDownRight, Minus, Users, Info, Target, Compass, Dumbbell, Timer, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../src/utils/dateUtils';
import { calculateUserStats } from '../src/utils/analytics';
import SessionDetails from './SessionDetails';

const OceanRing: React.FC<{ 
  value: number; 
  label: string; 
  color: string; 
  icon: React.ReactNode;
  tooltip: string;
}> = ({ value, label, color, icon, tooltip }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getDescriptor = (val: number) => {
    if (val >= 90) return 'Epic';
    if (val >= 75) return 'Solid';
    if (val >= 50) return 'Flow';
    if (val >= 25) return 'Steady';
    return 'Grommet';
  };

  const angle = (value / 100) * 360 - 90;
  const foamX = 50 + radius * Math.cos((angle * Math.PI) / 180);
  const foamY = 50 + radius * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="flex-1 w-full flex flex-col items-center text-center group/ring">
      <div className="flex items-center gap-[var(--spacing-xs)] mb-6">
        <div className="text-[var(--ocean-bg)] group-hover/ring:text-[var(--ocean-liquid)] transition-colors">
          {icon}
        </div>
        <h3 className="text-[11px] font-black text-[var(--ocean-bg)] uppercase tracking-[0.15em]">{label}</h3>
        <div className="relative group">
          <Info size={12} className="text-[var(--ocean-text-dim)]/30 cursor-help hover:text-[var(--ocean-text-dim)] transition-colors" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-[var(--ocean-bg)] text-[var(--ocean-text-main)] text-[11px] font-medium rounded-[var(--radius-md)] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-[100] shadow-2xl pointer-events-none text-right leading-relaxed border border-white/10" dir="rtl">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--ocean-bg)]" />
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-[170px] aspect-square flex items-center justify-center">
        {/* Aquarium Container */}
        <div className="absolute inset-[12%] rounded-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
          {/* Horizontal Water with Ripple */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: `${100 - value}%` }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full bg-gradient-to-b from-[var(--ocean-liquid)]/60 via-[var(--ocean-liquid)]/40 to-slate-200/80"
          >
            {/* Multi-layered Ripple Effect */}
            <div className="absolute top-0 left-0 w-[400%] h-6 -translate-y-1/2 opacity-40">
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full animate-[ripple_3s_infinite_linear]">
                <path d="M0 10 Q 12.5 18 25 10 T 50 10 T 75 10 T 100 10 V 20 H 0 Z" fill="white" />
              </svg>
            </div>
            {/* Surface Shimmer */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </motion.div>
        </div>

        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 relative z-10">
          <defs>
            <linearGradient id={`ocean-grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--ocean-liquid)" />
              <stop offset="100%" stopColor="var(--ocean-bg)" />
            </linearGradient>
            <filter id="foam-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--ocean-pipe-empty)"
            strokeWidth="3"
            className="opacity-30"
          />

          {/* Progress Arc */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={`url(#ocean-grad-${label})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ 
              duration: 2, 
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.2 
            }}
          />
        </svg>

        {/* Central Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter drop-shadow-sm"
          >
            {value}%
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            className="text-[9px] font-black text-[var(--ocean-liquid)] uppercase tracking-[0.2em] mt-0.5"
          >
            {getDescriptor(value)}
          </motion.span>
        </div>
      </div>
    </div>
  );
};

const StabilityGauge: React.FC<{ 
  percent: number; 
  activeWeeks: number; 
  totalWeeks: number;
  seasonYear: string;
}> = ({ percent, activeWeeks, totalWeeks, seasonYear }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  
  // 12 segments for months
  const segmentGap = 2; // degrees
  const segmentLength = (360 / 12) - segmentGap;
  const dashArray = `${(segmentLength / 360) * circumference} ${(segmentGap / 360) * circumference}`;

  return (
    <div className="flex-1 w-full flex flex-col items-center text-center group/stability">
      <div className="flex items-center gap-[var(--spacing-xs)] mb-6">
        <div className="text-[var(--ocean-bg)] group-hover/stability:text-[var(--ocean-liquid)] transition-colors">
          <Calendar size={18} />
        </div>
        <h3 className="text-[11px] font-black text-[var(--ocean-bg)] uppercase tracking-[0.15em]">יציבות שנתית {seasonYear}</h3>
        <div className="relative group">
          <Info size={12} className="text-[var(--ocean-text-dim)]/30 cursor-help hover:text-[var(--ocean-text-dim)] transition-colors" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-[var(--ocean-bg)] text-[var(--ocean-text-main)] text-[11px] font-medium rounded-[var(--radius-md)] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-[100] shadow-2xl pointer-events-none text-right leading-relaxed border border-white/10" dir="rtl">
            מדד העקביות שלך. הוא בודק בכמה שבועות היית פעיל (לפחות פעם אחת) מתוך כלל השבועות שחלפו מתחילת עונת {seasonYear}. דילוג על שבועות מוריד את הציון.
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--ocean-bg)]" />
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-[170px] aspect-square flex items-center justify-center">
        {/* Aquarium Container */}
        <div className="absolute inset-[12%] rounded-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
          {/* Deep Sea Water */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: `${100 - percent}%` }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full bg-gradient-to-b from-[var(--ocean-liquid)]/60 via-[var(--ocean-liquid)]/40 to-slate-200/80"
          >
            {/* Wave Animation */}
            <div className="absolute top-0 left-0 w-[400%] h-6 -translate-y-1/2 opacity-40">
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full animate-[ripple_3s_infinite_linear]">
                <path d="M0 10 Q 12.5 18 25 10 T 50 10 T 75 10 T 100 10 V 20 H 0 Z" fill="white" />
              </svg>
            </div>
          </motion.div>
        </div>

        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 relative z-10">
          <defs>
            <linearGradient id="stability-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--ocean-liquid)" />
              <stop offset="100%" stopColor="var(--ocean-bg)" />
            </linearGradient>
          </defs>

          {/* Background Segmented Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--ocean-pipe-empty)"
            strokeWidth="4"
            strokeDasharray={dashArray}
            className="opacity-30"
          />

          {/* Progress Segmented Arc */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#stability-grad)"
            strokeWidth="5"
            strokeLinecap="butt"
            strokeDasharray={dashArray}
            strokeDashoffset={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </svg>

        {/* Central Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter drop-shadow-sm">{percent}%</span>
        </div>
      </div>
      
      <p className="mt-4 text-[10px] font-bold text-[var(--ocean-text-dim)]">
        היית פעיל ב-{activeWeeks} מתוך {totalWeeks} שבועות השנה.
      </p>
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

  if (isLoading || !data) return <div className="p-8 text-center font-black text-[var(--ocean-liquid)] animate-pulse">טוען את הגל שלך...</div>;

  const COLORS = ['var(--ocean-liquid)', 'var(--ocean-bg)'];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 min-h-[400px]" dir="rtl">
      {/* Unified Modern Dashboard */}
      <div className="bg-white p-[var(--spacing-md)] md:p-[var(--spacing-lg)] rounded-[var(--radius-lg)] border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-start justify-between gap-[var(--spacing-md)] md:gap-[var(--spacing-lg)]">
          
          <OceanRing 
            value={data.percentile}
            label="מד התמדה יחסי"
            color="#4F46E5"
            icon={<Target size={18} />}
            tooltip="מדד זה משווה את כמות האימונים שלך לשאר חברי הנבחרת. ציון 90% אומר שאתה מתאמן יותר מ-90% מהחברים."
          />

          <OceanRing 
            value={data.attendancePercent}
            label="מד התמדה אישי"
            color="#006994"
            icon={<Waves size={18} />}
            tooltip="אחוז ההגעה שלך למפגשי הים מתוך כלל המפגשים שהתקיימו מתחילת השנה. זהו המדד האישי שלך לעמידה ביעדים."
          />

          <OceanRing 
            value={data.progress[1].value}
            label="מעורבות חברתית"
            color="#40E0D0"
            icon={<Users size={18} />}
            tooltip="מדד המציג את אחוז ההשתתפות שלך באירועים חברתיים וקהילתיים. להיות חלק מהנבחרת זה גם מעבר לים!"
          />

          <StabilityGauge 
            percent={data.yearlyStability.percent}
            activeWeeks={data.yearlyStability.activeWeeks}
            totalWeeks={data.yearlyStability.totalWeeks}
            seasonYear={yearConfig?.startDate ? new Date(yearConfig.startDate).getFullYear().toString() : '2026'}
          />

        </div>
      </div>

      {/* Surf Compass (Radar Chart) - Future Use */}
      <div className="bg-white p-[var(--spacing-md)] md:p-[var(--spacing-lg)] rounded-[var(--radius-lg)] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <Compass size={18} className="text-[var(--ocean-liquid)]" />
            <h3 className="text-lg font-black text-[var(--ocean-bg)]">מצפן גלישה</h3>
          </div>
          <span className="text-[10px] font-bold text-[var(--ocean-text-dim)] uppercase tracking-widest mt-1">(לשימוש עתידי)</span>
        </div>

        <div className="h-[320px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
              { subject: 'טכניקה', A: 110, fullMark: 150, icon: <Zap size={12} /> },
              { subject: 'איכות התמרונים', A: 95, fullMark: 150, icon: <Dumbbell size={12} /> },
              { subject: 'סיבולת', A: 85, fullMark: 150, icon: <Timer size={12} /> },
              { subject: 'בחירת גלים', A: 120, fullMark: 150, icon: <Eye size={12} /> },
              { subject: 'כושר ותפקוד במים', A: 100, fullMark: 150, icon: <Users size={12} /> },
              { subject: 'התמדה', A: (data.attendancePercent / 100) * 150, fullMark: 150, icon: <Target size={12} /> },
            ]}>
              <defs>
                <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ocean-liquid)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--ocean-bg)" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <PolarGrid gridType="circle" stroke="var(--ocean-text-dim)" strokeOpacity={0.2} strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={(props: any) => {
                  const { x, y, payload } = props;
                  const item = [
                    { subject: 'טכניקה', icon: <Zap size={12} /> },
                    { subject: 'איכות התמרונים', icon: <Dumbbell size={12} /> },
                    { subject: 'סיבולת', icon: <Timer size={12} /> },
                    { subject: 'בחירת גלים', icon: <Eye size={12} /> },
                    { subject: 'כושר ותפקוד במים', icon: <Users size={12} /> },
                    { subject: 'התמדה', icon: <Target size={12} /> },
                  ].find(i => i.subject === payload.value);
                  
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="middle"
                        fill="var(--ocean-text-dim)"
                        className="text-[10px] font-black"
                      >
                        {payload.value}
                      </text>
                      <foreignObject x={-6} y={-12} width={12} height={12}>
                        <div className="text-[var(--ocean-liquid)] opacity-60">
                          {item?.icon}
                        </div>
                      </foreignObject>
                    </g>
                  );
                }}
              />
              <Radar
                name="גולש"
                dataKey="A"
                stroke="var(--ocean-liquid)"
                strokeWidth={3}
                fill="url(#radarGrad)"
                fillOpacity={0.6}
                dot={{ r: 4, fill: 'var(--ocean-liquid)', strokeWidth: 2, stroke: '#fff' }}
              />
            </RadarChart>
          </ResponsiveContainer>
          
          {/* Compass Overlay Decoration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <Compass size={200} strokeWidth={0.5} color="var(--ocean-liquid)" />
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-[var(--radius-md)] border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed">
            המצפן מנתח את היכולות המקצועיות שלך בים. נתונים אלו יוזנו על ידי המדריכים לאחר הערכות תקופתיות.
          </p>
        </div>
      </div>

      {/* Session History - Collapsible Dropbox Style */}
      <div 
        className="bg-white rounded-[var(--radius-lg)] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300"
        onMouseLeave={() => setIsHistoryOpen(false)}
      >
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          onMouseEnter={() => setIsHistoryOpen(true)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--ocean-liquid)]/10 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--ocean-liquid)] group-hover:bg-[var(--ocean-liquid)] group-hover:text-white transition-all">
              <Calendar size={16} />
            </div>
            <div className="text-right">
              <h3 className="text-sm font-black text-[var(--ocean-bg)]">היסטוריית סשנים</h3>
              <p className="text-[10px] font-bold text-[var(--ocean-text-dim)] uppercase tracking-wider">
                {isHistoryOpen ? 'לחץ לסגירה' : `צפה ב-${userSessions.length} סשנים אחרונים`}
              </p>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${isHistoryOpen ? 'rotate-[-90deg]' : ''}`}>
            <ChevronLeft size={18} className="text-slate-400 group-hover:text-[var(--ocean-liquid)]" />
          </div>
        </button>

        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-t border-white/5"
            >
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                {userSessions.slice(0, 15).map((session, idx) => {
                  const formattedDate = formatDate(session.date);

                  return (
                    <div 
                      key={session.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className="group px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Waves size={14} className="text-[var(--ocean-text-dim)] group-hover:text-[var(--ocean-liquid)] transition-colors" />
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--ocean-bg)] text-xs">{formattedDate}</span>
                          <span className="text-[10px] text-[var(--ocean-text-dim)] font-medium">
                            {session.instructorName || 'מדריך חבל זוג'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-black">
                          <Users size={10} />
                          <span>{session.participantIds?.length || 0}</span>
                        </div>
                        <ChevronLeft size={14} className="text-slate-400 group-hover:text-[var(--ocean-liquid)] group-hover:translate-x-[-2px] transition-all" />
                      </div>
                    </div>
                  );
                })}

                {userSessions.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-[var(--ocean-text-dim)] font-bold italic text-xs">אין סשנים לתצוגה</p>
                  </div>
                )}
              </div>
              
              {userSessions.length > 15 && (
                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    מציג 15 סשנים אחרונים
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
