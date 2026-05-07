import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { Waves, Zap, Trophy, Flame, Calendar, ChevronLeft, ArrowUpRight, ArrowDownRight, Minus, Users, Info, Target, Compass, Dumbbell, Timer, Eye, Wind, Thermometer, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../utils/dateUtils';
import { calculateUserStats } from '../utils/analytics';
import { RadarChart } from './RadarChart';
import SessionDetails from './SessionDetails';

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    const duration = 2000; // ms
    const safeValue = isNaN(value) ? 0 : value;
    let animationFrameId: number;

    const step = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Custom easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(easeProgress * safeValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <>{displayValue}</>;
};

export const EliteStatCard: React.FC<{
  value: number;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  footer?: React.ReactNode;
  trend?: { direction: 'up' | 'down'; value: number };
  colorStart?: string;
  colorEnd?: string;
  delay?: number;
  highlight?: boolean;
}> = ({ value, label, icon, tooltip, footer, trend, colorStart = '#06b6d4', colorEnd = '#3b82f6', delay = 0, highlight = false }) => {
  const radius = highlight ? 48 : 36;
  const size = highlight ? 120 : 96;
  const center = size / 2;
  const strokeWidth = highlight ? 10 : 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`relative p-6 md:p-8 rounded-[24px] group transform-gpu flex flex-row items-center justify-between ${highlight ? 'md:col-span-2 lg:col-span-1' : ''}`}
      dir="rtl"
      style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -1px 1px rgba(255,255,255,0.02), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      {/* Decorative Backgrounds - Contained Layer */}
      <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none transition-all duration-500">
        {/* Dynamic Animated Glows */}
        <motion.div 
          className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%] opacity-[0.15] group-hover:opacity-40 transition-opacity duration-1000 blur-[80px] pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${colorStart} 0%, transparent 60%)` }}
          animate={{
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/[0.08] to-transparent rounded-bl-full pointer-events-none mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-col h-full justify-between gap-4 md:gap-6 relative z-10 w-full pl-4 border-l border-white/[0.08]">
        
        {/* Top Header */}
        <div className="flex items-start gap-4">
          <div className={`rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center relative z-10 group-hover:bg-white/10 transition-colors duration-500 shrink-0 ${highlight ? 'w-14 h-14' : 'w-12 h-12'}`}>
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }}>
              {icon}
            </motion.div>
          </div>
          <div className="flex flex-col mt-1">
            <div className="flex items-center gap-2">
              <h3 className={`${highlight ? 'text-lg font-black' : 'text-md font-bold'} text-slate-100 tracking-wide`}>{label}</h3>
              <div className="relative flex items-center">
                <Info size={14} className="text-slate-500 hover:text-slate-300 transition-colors cursor-help peer" />
                <div className="opacity-0 peer-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-700 shadow-2xl w-[200px] pointer-events-none z-50">
                  {tooltip}
                </div>
              </div>
            </div>
            {footer && (
              <div className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-[200px] mt-1 line-clamp-2">
                {footer}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Trend & Pill */}
        <div className="mt-auto">
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.6, duration: 0.4 }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.2)] ${
                trend.direction === 'up' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
              dir="rtl"
            >
              {trend.direction === 'up' ? <ArrowUpRight size={14} strokeWidth={3} className="text-emerald-400 ml-0.5" /> : <ArrowDownRight size={14} strokeWidth={3} className="text-rose-400 ml-0.5" />}
              <span className="tracking-wide">עלייה של {Math.abs(trend.value)}%</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Left Circular Gauge */}
      <div className="relative z-10 shrink-0 pr-4">
        <div className={`relative flex items-center justify-center`} style={{ width: size, height: size }}>
          
          {/* Inner Glow under the circle */}
          <div className="absolute inset-0 rounded-full blur-[20px] opacity-20 group-hover:opacity-50 transition-opacity duration-700" style={{ background: colorStart }} />
          
          <svg className="w-full h-full transform -rotate-90 filter drop-shadow-lg relative z-10">
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colorStart} />
                <stop offset="100%" stopColor={colorEnd} />
              </linearGradient>
            </defs>
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              stroke={`url(#grad-${label.replace(/\s+/g, '')})`}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, delay: delay + 0.2, ease: [0.23, 1, 0.32, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col pt-1 z-20">
            <div className="flex items-baseline gap-0.5" dir="ltr">
              <span className={`${highlight ? 'text-4xl' : 'text-3xl'} font-black text-white tabular-nums tracking-tighter leading-none`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                <AnimatedNumber value={value} />
              </span>
              <span className="text-sm font-bold text-slate-400 opacity-80">%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
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
      'קצפ-אפיסט': { bg: 'from-[#021626] to-[#010d17]', glow: 'rgba(255,255,255,0.1)' },
      'ליין-אפיסט': { bg: 'from-[#06402b] to-[#065f46]', glow: 'rgba(6, 95, 70, 0.5)' },
      'שואו-אפיסט': { bg: 'from-[#1e1b4b] to-[#312e81]', glow: 'rgba(67, 56, 202, 0.6)' },
      'קלי סלייטר': { bg: 'from-[#92400e] via-[#b45309] to-[#92400e]', glow: 'rgba(251, 191, 36, 0.8)' }
    };
    return rankColors[data.rank] || rankColors['פופ-אפיסט'];
  }, [data]);

  const userSessions = useMemo(() => {
    if (!weeklyHistory || !userId) return [];
    return weeklyHistory
      .filter(s => s.participantIds?.includes(userId) && !s.isEvent)
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
        className="p-4 md:p-6 relative z-10 backdrop-blur-[40px] bg-white/40 border border-white/80 shadow-[0_40px_80px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] rounded-[2rem] transition-all duration-1000 overflow-hidden"
      >
        {/* Grit Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        {/* Decorative background elements */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 w-full mb-6">
            
            <EliteStatCard 
              value={data.attendancePercent}
              label="מד התמדה אישי"
              icon={<Waves size={20} className="text-cyan-500" />}
              tooltip="כמה פעמים הגעת מתוך כל האימונים שהיו מתחילת השנה."
              trend={{ direction: 'up', value: 12 }}
              colorStart="#06b6d4" // cyan-500
              colorEnd="#3b82f6" // blue-500
              delay={0.1}
            />

            <EliteStatCard 
              value={Math.round(data.gritScore)}
              label="מד נחישות Grit"
              icon={<Trophy size={20} className="text-amber-500" />}
              tooltip="זהו מדד ה'נחישות' שלך. הוא בודק כמה אתה מתמיד. הוא משלב את כמות הסשנים שעשית עם העקביות שלך (הרצף). העקביות חשובה יותר מהכמות."
              trend={{ direction: 'up', value: 15 }}
              colorStart="#f59e0b" // amber-500
              colorEnd="#ef4444" // red-500
              delay={0.2}
              highlight={true}
              footer={
                <span className="inline-block mt-0.5">ממוצע הקהילה: <strong className="text-slate-700">{Math.round(data.averageGrit)}</strong></span>
              }
            />

            <EliteStatCard 
              value={data.yearlyStability.percent}
              label={`יציבות שנתית ${yearConfig?.startDate ? new Date(yearConfig.startDate).getFullYear().toString() : '2026'}`}
              icon={<Calendar size={20} className="text-fuchsia-500" />}
              tooltip="מדד הבודק כמה שבועות היית פעיל ברצף מתחילת העונה."
              trend={{ direction: 'up', value: 8 }}
              colorStart="#d946ef" // fuchsia-500
              colorEnd="#8b5cf6" // violet-500
              delay={0.3}
              footer={
                <span className="inline-block mt-0.5">פעיל ב-<strong className="text-slate-700">{data.yearlyStability.activeWeeks}</strong> מתוך {data.yearlyStability.totalWeeks} שבועות השנה</span>
              }
            />

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <EliteStatCard 
                value={data.percentile}
                label="מד התמדה יחסי"
                icon={<Target size={20} className="text-rose-500" />}
                tooltip="איפה אתה עומד ביחס לכל שאר המתאמנים בנבחרת."
                trend={{ direction: 'up', value: 4 }}
                colorStart="#e11d48" // rose-600
                colorEnd="#f43f5e" // rose-500
                delay={0.4}
              />

              <EliteStatCard 
                value={data.progress[1].value}
                label="מעורבות חברתית"
                icon={<Users size={20} className="text-indigo-500" />}
                tooltip="השתתפות באירועים ופעילויות קהילתיות מעבר לים."
                trend={{ direction: 'down', value: 2 }}
                colorStart="#6366f1" // indigo-500
                colorEnd="#4f46e5" // indigo-600
                delay={0.5}
              />
            </div>

        </div>
      </motion.div>

      {/* Surf Compass (Radar Chart) - Future Use - Dynamic Premium Style */}
      <motion.div 
        className="p-4 md:p-6 relative z-10 backdrop-blur-[40px] bg-white/40 border border-white/80 shadow-[0_40px_80px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] rounded-[2rem] transition-all duration-1000"
      >
        {/* Grit Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-[var(--spacing-xs)]">
                <div className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-sm mr-2">
                  <Compass size={18} className="text-[#D4A373]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-3xl font-black text-slate-800">רדאר השיפור שלך</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">לא פעיל - לשימוש עתידי</p>
                </div>
              </div>
            </div>

          <div className="h-[500px] w-full relative z-20">
            <RadarChart userId={userId} />
          </div>

          <div className="mt-12 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/20 shadow-md shadow-black/5">
            <p className="text-[12px] text-slate-600 font-bold text-center leading-relaxed">
              המצפן מנתח את היכולות המקצועיות שלך בים. נתונים אלו יוזנו על ידי המדריכים לאחר הערכות תקופתיות.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Session History - Collapsible Dropbox Style - Dynamic Premium Style */}
      <motion.div 
        className="relative z-10 backdrop-blur-[40px] bg-white/40 border border-white/80 shadow-[0_40px_80px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] rounded-[2rem] overflow-hidden transition-all duration-1000"
        onMouseLeave={() => setIsHistoryOpen(false)}
      >
        {/* Grit Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          onMouseEnter={() => setIsHistoryOpen(true)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors group relative z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-md shadow-sm flex items-center justify-center text-[#FF007F] group-hover:bg-white/20 group-hover:text-[#FF007F] transition-all">
              <Calendar size={16} />
            </div>
            <div className="text-right">
              <h3 className="text-sm font-black text-slate-800">היסטוריית סשנים</h3>
              <p className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">
                {isHistoryOpen ? 'לחץ לסגירה' : `צפה ב-${userSessions.length} סשנים אחרונים`}
              </p>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${isHistoryOpen ? 'rotate-[-90deg]' : ''}`}>
            <ChevronLeft size={18} className="text-sunshine-yellow group-hover:opacity-80" />
          </div>
        </button>

        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-t border-white/20 relative z-10"
            >
              <div className="divide-y-[1.5px] divide-black max-h-[400px] overflow-y-auto custom-scrollbar">
                {userSessions.slice(0, 15).map((session, idx) => {
                  const formattedDate = formatDate(session.date);

                  return (
                    <div 
                      key={session.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className="group px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Waves size={14} className="text-sunshine-yellow transition-colors" />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-600 text-xs">{formattedDate}</span>
                          <div className="flex flex-col gap-0.5 text-[12px] text-slate-600 font-medium">
                            <div>
                              מדריכים: {(() => {
                                const instructors = (session.participantIds || [])
                                  .map((id: string) => members.find(m => m.id === id))
                                  .filter((m: any) => m && m.role === 'Instructor');
                                return instructors.length > 0 
                                  ? instructors.map((m: any) => `${m.firstName} ${m.lastName}`).join(', ')
                                  : 'אין';
                              })()}
                            </div>
                            <div>
                              רכזים: {(() => {
                                const coordinators = (session.participantIds || [])
                                  .map((id: string) => members.find(m => m.id === id))
                                  .filter((m: any) => m && m.role === 'Admin');
                                return coordinators.length > 0 
                                  ? coordinators.map((m: any) => `${m.firstName} ${m.lastName}`).join(', ')
                                  : 'אין';
                              })()}
                            </div>
                          </div>
                          {/* Sea State Info */}
                          {(session.waveHeight !== undefined || session.seaState?.waveHeight !== undefined || session.windSpeed !== undefined || session.seaState?.windSpeed !== undefined || session.waterTemp !== undefined || session.seaState?.waterTemp !== undefined || session.uvIndex !== undefined || session.seaState?.uvIndex !== undefined) && (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {(session.waveHeight !== undefined || session.seaState?.waveHeight !== undefined) && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0071a1]/5 border border-[#0071a1]/10 transition-all hover:bg-[#0071a1]/10" title="גובה גלים">
                                  <Waves size={12} className="text-[#0071a1]" />
                                  <span className="text-[10px] font-black text-slate-700">גובה גלים:</span>
                                  <span className="text-[10px] font-black text-[#0071a1]" dir="ltr">{session.waveHeight ?? session.seaState?.waveHeight}m</span>
                                </div>
                              )}
                              {(session.windSpeed !== undefined || session.seaState?.windSpeed !== undefined) && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0891b2]/5 border border-[#0891b2]/10 transition-all hover:bg-[#0891b2]/10" title="מהירות רוח">
                                  <Wind size={12} className="text-[#0891b2]" />
                                  <span className="text-[10px] font-black text-slate-700">מהירות רוח:</span>
                                  <span className="text-[10px] font-black text-[#0891b2]" dir="ltr">{session.windSpeed ?? session.seaState?.windSpeed}kts</span>
                                </div>
                              )}
                              {(session.waterTemp !== undefined || session.seaState?.waterTemp !== undefined) && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#4338ca]/5 border border-[#4338ca]/10 transition-all hover:bg-[#4338ca]/10" title="טמפ׳ מים">
                                  <Thermometer size={12} className="text-[#4338ca]" />
                                  <span className="text-[10px] font-black text-slate-700">טמפ׳ מים:</span>
                                  <span className="text-[10px] font-black text-[#4338ca]" dir="ltr">{session.waterTemp ?? session.seaState?.waterTemp}°C</span>
                                </div>
                              )}
                              {(session.uvIndex !== undefined || session.seaState?.uvIndex !== undefined) && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#b45309]/5 border border-[#b45309]/10 transition-all hover:bg-[#b45309]/10" title="אינדקס קרינה">
                                  <Sun size={12} className="text-[#b45309]" />
                                  <span className="text-[10px] font-black text-slate-700">אינדקס קרינה:</span>
                                  <span className="text-[10px] font-black text-[#b45309]" dir="ltr">{session.uvIndex ?? session.seaState?.uvIndex} UV</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[12px] text-slate-600 font-black">
                          <Users size={10} />
                          <span>{session.participantIds?.length || 0}</span>
                        </div>
                        <ChevronLeft size={14} className="text-sunshine-yellow group-hover:translate-x-[-2px] transition-all" />
                      </div>
                    </div>
                  );
                })}

                {userSessions.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-slate-600 font-bold italic text-xs">אין סשנים לתצוגה</p>
                  </div>
                )}
              </div>
              
              {userSessions.length > 15 && (
                <div className="p-3 bg-black/20 text-center border-t border-white/20">
                  <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">
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
