import React, { useMemo, useState } from 'react';
import { Waves, Trophy, Calendar, ChevronLeft, ArrowUpRight, ArrowDownRight, Users, Info, Target, Compass, Sparkles, Wind, Thermometer, Sun, Flame } from 'lucide-react';
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
    const duration = 1200;
    const safeValue = isNaN(value) ? 0 : value;
    let animationFrameId: number;

    const step = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
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
  onInfoClick?: () => void;
}> = ({ 
  value, 
  label, 
  icon, 
  tooltip, 
  footer, 
  trend, 
  colorStart = '#0284c7', 
  colorEnd = '#00AFC2', 
  delay = 0, 
  highlight = false,
  onInfoClick
}) => {
  const [showLocalTooltip, setShowLocalTooltip] = useState(false);
  const radius = 33;
  const size = 82;
  const center = size / 2;
  const strokeWidth = 7.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  const handleInfoTrigger = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (onInfoClick) {
      onInfoClick();
    } else {
      setShowLocalTooltip(prev => !prev);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={`relative w-full aspect-square p-3 sm:p-4 rounded-2xl group flex flex-col justify-between items-center text-center transition-all duration-200 ${
        highlight 
          ? 'bg-gradient-to-br from-white via-amber-50/60 to-orange-50/40 border-2 border-amber-400/70 shadow-sm hover:shadow-md' 
          : 'bg-white hover:bg-slate-50/50 border border-slate-200/90 shadow-xs hover:shadow-sm'
      }`}
      dir="rtl"
    >
      {/* Top Row: Icon, Title, and Tooltip */}
      <div className="w-full flex items-center justify-between gap-1">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center relative shrink-0 transition-transform group-hover:scale-105 ${
          highlight ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-cyan-50 border border-cyan-200/70 text-[#007b8a]'
        }`}>
          {icon}
        </div>

        <h3 className={`font-dana-yad font-bold tracking-tight leading-tight flex-1 text-center truncate px-1 ${
          highlight ? 'text-sm sm:text-base font-black text-amber-950' : 'text-xs sm:text-sm text-slate-950 font-bold'
        }`}>
          {label}
        </h3>

        {/* Info Tooltip Button */}
        {tooltip ? (
          <div className="relative shrink-0 z-20">
            <button
              type="button"
              onClick={handleInfoTrigger}
              aria-label={`מידע על ${label}`}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-[#00AFC2] hover:bg-cyan-50 active:bg-cyan-100 transition-colors cursor-pointer select-none"
            >
              <Info size={15} strokeWidth={2.2} />
            </button>
            
            {/* Fallback local hover tooltip for desktop when no global modal */}
            {!onInfoClick && showLocalTooltip && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-full right-0 mb-2 bg-[#092734] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl w-[220px] z-50 font-dana-yad font-medium leading-relaxed border border-cyan-500/30 text-right"
              >
                <div className="flex items-center justify-between gap-1 pb-1 mb-1 border-b border-white/15 text-cyan-300 font-bold">
                  <span>{label}</span>
                  <button onClick={() => setShowLocalTooltip(false)} className="text-white/60 hover:text-white">✕</button>
                </div>
                {tooltip}
              </div>
            )}
          </div>
        ) : (
          <div className="w-7" />
        )}
      </div>

      {/* Center: Radial Gauge with enhanced clarity */}
      <div className="my-auto py-0.5 flex items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          {/* Subtle background glow circle */}
          <div 
            className={`absolute inset-2 rounded-full ${highlight ? 'bg-amber-50/80' : 'bg-slate-50/80'} -z-0`} 
          />

          <svg className="w-full h-full transform -rotate-90 relative z-10">
            {/* Background track circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#e2e8f0"
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
              transition={{ duration: 1.1, delay: delay + 0.1, ease: [0.23, 1, 0.32, 1] }}
            />
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center flex-col z-20" dir="ltr">
            <div className="flex items-baseline gap-0.5">
              <span className="font-sans font-black text-[#121212] tabular-nums leading-none tracking-tight text-2xl sm:text-[1.7rem]">
                <AnimatedNumber value={value} />
              </span>
              <span className="font-sans text-xs sm:text-sm font-black text-[#121212]">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Footer or Trend */}
      <div className="w-full pt-1 border-t border-slate-100 flex flex-col items-center justify-center gap-0.5">
        {footer ? (
          <div className="text-xs sm:text-sm font-dana-yad font-bold text-[#121212] leading-tight truncate max-w-full">
            {footer}
          </div>
        ) : trend ? (
          <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold border ${
            trend.direction === 'up' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs' 
              : 'bg-rose-50 text-rose-900 border-rose-300 shadow-2xs'
          }`}>
            {trend.direction === 'up' ? (
              <ArrowUpRight size={13} strokeWidth={2.5} className="text-emerald-700" />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.5} className="text-rose-700" />
            )}
            <span className="font-dana-yad">עלייה של {Math.abs(trend.value)}%</span>
          </div>
        ) : (
          <span className="text-xs font-dana-yad font-bold text-[#121212]">בשנת הפעילות</span>
        )}
      </div>
    </motion.div>
  );
};

const UserAnalytics: React.FC<{ userId: string }> = ({ userId }) => {
  const { members, weeklyHistory, yearConfig, events, isLoading } = useData();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<{ title: string; desc: string; icon?: React.ReactNode } | null>(null);

  const data = useMemo(() => {
    if (isLoading) return null;
    return calculateUserStats(userId, members, weeklyHistory, yearConfig, events);
  }, [userId, members, weeklyHistory, yearConfig, events, isLoading]);

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

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center font-dana-yad font-bold text-cyan-800 animate-pulse text-lg">
        טוען את נתוני הגלישה שלך...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500" dir="rtl">
      
      {/* 1. Alabaster Metrics 2-Column Square Grid */}
      <div className="relative rounded-3xl bg-gradient-to-br from-white/95 via-[#f8fafc]/90 to-[#f1f5f9]/90 border border-white/60 p-4 sm:p-6 backdrop-blur-xl shadow-lg">
        
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header inside the metrics card */}
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-slate-200/70 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#00AFC2]" />
            <h3 className="text-xl sm:text-2xl font-dana-yad font-bold text-[#092734]">
              מדדי ליבה והתמדה אישית
            </h3>
          </div>
          <span className="text-sm font-dana-yad font-bold text-[#121212]">
            מתעדכן אוטומטית לפי כל סשן
          </span>
        </div>

        {/* 2-Columns Grid - ALWAYS 2 Columns (grid-cols-2) */}
        <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
          
          <EliteStatCard 
            value={data.attendancePercent}
            label="מד התמדה אישי"
            icon={<Waves size={18} className="text-[#00AFC2]" />}
            tooltip="כמה פעמים הגעת מתוך כל האימונים שהיו מתחילת השנה."
            trend={{ direction: 'up', value: 12 }}
            colorStart="#00AFC2"
            colorEnd="#0284c7"
            delay={0.05}
            onInfoClick={() => setActiveInfoModal({
              title: 'מד התמדה אישי',
              desc: 'מדד הבודק כמה פעמים הגעת מתוך כלל האימונים והסשנים שנערכו מתחילת השנה.',
              icon: <Waves size={18} className="text-[#00AFC2]" />
            })}
          />

          <EliteStatCard 
            value={Math.round(data.gritScore)}
            label="מד נחישות Grit"
            icon={<Trophy size={18} className="text-amber-600" />}
            tooltip="מדד הנחישות משלב את כמות הסשנים שעשית עם העקביות והרצף שלך בים."
            trend={{ direction: 'up', value: 15 }}
            colorStart="#f59e0b"
            colorEnd="#ea580c"
            delay={0.1}
            highlight={true}
            onInfoClick={() => setActiveInfoModal({
              title: 'מד נחישות Grit',
              desc: 'מדד הנחישות משלב את כמות הסשנים שעשית עם העקביות, ההתמדה והרצף שלך בים לאורך העונה.',
              icon: <Trophy size={18} className="text-amber-600" />
            })}
            footer={
              <span>ממוצע קהילה: <strong className="text-slate-950 font-bold">{Math.round(data.averageGrit)}</strong></span>
            }
          />

          <EliteStatCard 
            value={data.yearlyStability.percent}
            label={`יציבות ${yearConfig?.startDate ? new Date(yearConfig.startDate).getFullYear().toString() : '2026'}`}
            icon={<Calendar size={18} className="text-sky-600" />}
            tooltip="מדד הבודק כמה שבועות היית פעיל ברצף בשנת הפעילות."
            trend={{ direction: 'up', value: 8 }}
            colorStart="#0284c7"
            colorEnd="#0369a1"
            delay={0.15}
            onInfoClick={() => setActiveInfoModal({
              title: `יציבות ${yearConfig?.startDate ? new Date(yearConfig.startDate).getFullYear().toString() : '2026'}`,
              desc: 'מדד הבודק בכמה שבועות מתוך כלל שבועות הפעילות בשנה הגעת לפחות לסשן אחד בים.',
              icon: <Calendar size={18} className="text-sky-600" />
            })}
            footer={
              <span>פעיל ב-<strong className="text-slate-950 font-bold">{data.yearlyStability.activeWeeks}</strong>/{data.yearlyStability.totalWeeks} שב׳</span>
            }
          />

          <EliteStatCard 
            value={data.percentile}
            label="מד התמדה יחסי"
            icon={<Target size={18} className="text-teal-600" />}
            tooltip="המיקום שלך באחוזונים ביחס לכל שאר חברי המועדון."
            trend={{ direction: 'up', value: 4 }}
            colorStart="#0d9488"
            colorEnd="#059669"
            delay={0.2}
            onInfoClick={() => setActiveInfoModal({
              title: 'מד התמדה יחסי',
              desc: 'המיקום שלך באחוזונים ביחס לכל שאר חברי המועדון והקהילה.',
              icon: <Target size={18} className="text-teal-600" />
            })}
          />

          <EliteStatCard 
            value={data.progress[1]?.value || 0}
            label="מעורבות קהילתית"
            icon={<Users size={18} className="text-indigo-600" />}
            tooltip="השתתפות באירועים, תחרויות ומפגשים קהילתיים מעבר למים."
            trend={{ direction: 'down', value: 2 }}
            colorStart="#6366f1"
            colorEnd="#4338ca"
            delay={0.25}
            onInfoClick={() => setActiveInfoModal({
              title: 'מעורבות קהילתית',
              desc: 'השתתפות באירועים מיוחדים, תחרויות, סדנאות ומפגשים קהילתיים מעבר לפעילות הרגילה במים.',
              icon: <Users size={18} className="text-indigo-600" />
            })}
          />

          {/* 6th Square Tile: Milestone & Surf Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
            className="w-full aspect-square p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/50 border border-cyan-200/90 shadow-xs hover:shadow-sm flex flex-col justify-between items-center text-center"
          >
            <div className="w-full flex items-center justify-between gap-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
                <Flame size={18} className="text-amber-500" />
              </div>
              <h3 className="font-dana-yad font-bold text-slate-950 text-xs sm:text-sm flex-1 text-center truncate px-1">
                שנת פעילות
              </h3>
              <div className="relative shrink-0 z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveInfoModal({
                      title: 'שנת פעילות',
                      desc: 'סך כל הסשנים המעשיים שבהם השתתפת בפועל בים בשנת הפעילות הנוכחית.',
                      icon: <Flame size={18} className="text-amber-500" />
                    });
                  }}
                  aria-label="מידע על שנת פעילות"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-[#00AFC2] hover:bg-cyan-50 active:bg-cyan-100 transition-colors cursor-pointer select-none"
                >
                  <Info size={15} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="my-auto py-1 flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-sans font-black text-cyan-950 leading-none tracking-tight">
                {userSessions.length}
              </span>
              <span className="text-xs sm:text-sm font-dana-yad font-bold text-cyan-900 mt-1">
                מספר הסשנים הכולל
              </span>
            </div>

            <div className="w-full pt-1 border-t border-cyan-100 flex items-center justify-between text-xs font-dana-yad text-cyan-950 font-bold">
              <span>לתפוס גלים!</span>
              <span className="text-[11px] font-sans text-[#121212] font-bold">חוף הבית</span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 2. Surf Radar Compass - Alabaster Glass Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-white/95 via-[#f8fafc]/90 to-[#f1f5f9]/90 border border-white/60 p-5 sm:p-7 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00AFC2]/15 border border-[#00AFC2]/30 flex items-center justify-center text-[#007b8a] shadow-xs">
              <Compass size={22} />
            </div>
            <div className="text-center sm:text-right">
              <h3 className="text-2xl sm:text-3xl font-dana-yad font-bold text-[#092734]">
                רדאר הביצועים שלך
              </h3>
              <p className="text-sm sm:text-base font-dana-yad font-bold text-[#121212] mt-0.5">
                מיפוי רב-ממדי של יכולות הגלישה וההתנהלות במים • לשימוש עתידי
              </p>
            </div>
          </div>
        </div>

        <div className="h-[460px] w-full relative z-10">
          <RadarChart userId={userId} />
        </div>

        <div className="mt-4 p-3.5 bg-slate-100/90 rounded-2xl border border-slate-300/80 text-center">
          <p className="text-sm sm:text-base font-dana-yad font-bold text-[#121212] leading-relaxed">
            המצפן מנתח את היכולות המקצועיות שלך בים. נתונים אלו יוזנו על ידי המדריכים לאחר הערכות תקופתיות.
          </p>
        </div>
      </div>

      {/* 3. Session History Collapsible - Tangible Surfer V2.0 Card */}
      <div 
        className="relative rounded-3xl bg-gradient-to-br from-white/95 via-[#f8fafc]/90 to-[#f1f5f9]/90 border border-white/60 overflow-hidden backdrop-blur-xl shadow-lg transition-all"
        onMouseLeave={() => setIsHistoryOpen(false)}
      >
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          onMouseEnter={() => setIsHistoryOpen(true)}
          className="w-full px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-slate-100/50 transition-colors group relative z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00AFC2]/15 border border-[#00AFC2]/30 flex items-center justify-center text-[#007b8a] group-hover:bg-[#00AFC2]/25 transition-all shadow-xs">
              <Calendar size={20} />
            </div>
            <div className="text-right">
              <h3 className="text-lg sm:text-xl font-dana-yad font-bold text-[#092734]">
                יומן סשנים והיסטוריית אימונים
              </h3>
              <p className="text-sm sm:text-base font-dana-yad font-bold text-[#121212]">
                {isHistoryOpen ? 'לחץ לסגירה' : `צפה ב-${userSessions.length} סשנים אחרונים`}
              </p>
            </div>
          </div>
          
          <div className={`transition-transform duration-300 text-[#121212] ${isHistoryOpen ? 'rotate-[-90deg]' : ''}`}>
            <ChevronLeft size={20} />
          </div>
        </button>

        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-t border-slate-200/80 relative z-10"
            >
              <div className="divide-y divide-slate-200/80 max-h-[400px] overflow-y-auto custom-scrollbar">
                {userSessions.slice(0, 15).map((session, idx) => {
                  const formattedDate = formatDate(session.date);

                  return (
                    <div 
                      key={session.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                      className="group px-5 sm:px-6 py-3.5 flex items-center justify-between cursor-pointer hover:bg-cyan-50/50 transition-all"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Waves size={18} className="text-[#00AFC2] shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-dana-yad font-bold text-[#121212] text-base sm:text-lg">{formattedDate}</span>
                          <div className="flex flex-wrap gap-x-4 text-sm font-dana-yad font-bold text-[#121212] mt-0.5">
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

                          {/* Sea State Info Tags */}
                          {(session.waveHeight !== undefined || session.seaState?.waveHeight !== undefined || session.windSpeed !== undefined || session.seaState?.windSpeed !== undefined || session.waterTemp !== undefined || session.seaState?.waterTemp !== undefined || session.uvIndex !== undefined || session.seaState?.uvIndex !== undefined) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {(session.waveHeight !== undefined || session.seaState?.waveHeight !== undefined) && (
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 border border-sky-300 text-[#121212] font-bold" title="גובה גלים">
                                  <Waves size={13} className="text-sky-700" />
                                  <span className="text-xs font-sans font-bold" dir="ltr">{session.waveHeight ?? session.seaState?.waveHeight}m</span>
                                </div>
                              )}
                              {(session.windSpeed !== undefined || session.seaState?.windSpeed !== undefined) && (
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-300 text-[#121212] font-bold" title="מהירות רוח">
                                  <Wind size={13} className="text-cyan-700" />
                                  <span className="text-xs font-sans font-bold" dir="ltr">{session.windSpeed ?? session.seaState?.windSpeed}kts</span>
                                </div>
                              )}
                              {(session.waterTemp !== undefined || session.seaState?.waterTemp !== undefined) && (
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-300 text-[#121212] font-bold" title="טמפ׳ מים">
                                  <Thermometer size={13} className="text-blue-700" />
                                  <span className="text-xs font-sans font-bold" dir="ltr">{session.waterTemp ?? session.seaState?.waterTemp}°C</span>
                                </div>
                              )}
                              {(session.uvIndex !== undefined || session.seaState?.uvIndex !== undefined) && (
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-300 text-[#121212] font-bold" title="אינדקס קרינה">
                                  <Sun size={13} className="text-amber-700" />
                                  <span className="text-xs font-sans font-bold" dir="ltr">{session.uvIndex ?? session.seaState?.uvIndex} UV</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs sm:text-sm font-dana-yad font-bold text-[#121212] bg-slate-100 px-3 py-1 rounded-full border border-slate-300">
                          <Users size={14} className="text-[#121212]" />
                          <span>{session.participantIds?.length || 0} משתתפים</span>
                        </div>
                        <ChevronLeft size={18} className="text-slate-500 group-hover:text-[#00AFC2] group-hover:translate-x-[-2px] transition-all" />
                      </div>
                    </div>
                  );
                })}

                {userSessions.length === 0 && (
                  <div className="py-10 text-center font-dana-yad font-bold text-[#121212] text-base">
                    אין סשנים לתצוגה
                  </div>
                )}
              </div>
              
              {userSessions.length > 15 && (
                <div className="p-3.5 bg-slate-100/80 text-center border-t border-slate-200/80">
                  <span className="text-sm font-dana-yad font-bold text-[#121212] tracking-wide">
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

      {/* High-End Mobile & Desktop Info Modal for Metrics */}
      <AnimatePresence>
        {activeInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              onClick={() => setActiveInfoModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative w-full max-w-sm rounded-3xl bg-[#092734] border border-cyan-400/30 p-5 text-white shadow-2xl z-10 text-right overflow-hidden"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle top glow */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-[#00AFC2] to-transparent opacity-80" />

              <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#00AFC2]/20 border border-[#00AFC2]/40 flex items-center justify-center text-[#00AFC2] shrink-0">
                    {activeInfoModal.icon || <Info size={16} />}
                  </div>
                  <h4 className="text-lg font-dana-yad font-bold text-cyan-300">
                    {activeInfoModal.title}
                  </h4>
                </div>
                <button
                  onClick={() => setActiveInfoModal(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white text-base transition-all cursor-pointer"
                  aria-label="סגור"
                >
                  ✕
                </button>
              </div>

              <p className="text-slate-100 font-dana-yad font-medium text-sm sm:text-base leading-relaxed py-1">
                {activeInfoModal.desc}
              </p>

              <button
                onClick={() => setActiveInfoModal(null)}
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00AFC2] to-[#0284c7] hover:brightness-110 active:scale-98 text-white font-dana-yad font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                הבנתי, תודה!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAnalytics;
