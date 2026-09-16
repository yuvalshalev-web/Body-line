
import React, { useMemo, useState } from 'react';
import { safeLocalStorage } from '../../utils/storage';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ReferenceArea,
  ReferenceLine,
  ComposedChart,
  Line,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../contexts/DataContext';
import { 
  Activity, 
  Heart,
  UserMinus,
  User,
  MessageSquare,
  Info,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { getOperationalXAxisProps } from '../../utils/chartHelpers';
import OperationalChartHeader from '../OperationalChartHeader';
import { EliteStatCard } from '../UserAnalytics';
import { calculateAge, parseDate } from '../../utils/dateUtils';
import { Member } from '../../types';
import { isAppShaperUser } from '../../constants';

interface SemiCircleGaugeProps {
  value: number; // 0-100 (octo 8-week)
  benchmarkValue: number; // 0-100 (yearly)
  colorGradient: [string, string];
  id: string;
}

const SemiCircleGauge: React.FC<SemiCircleGaugeProps> = ({
  value,
  benchmarkValue,
  colorGradient,
  id
}) => {
  // Gauge geometry: 220-degree sweeping automotive/aviation instrument arc (-200° to +20°)
  // or 180° symmetrical arc with luxury dashboard styling
  const cx = 110;
  const cy = 102;
  const outerRadius = 84;
  const trackRadius = 72;
  const innerRadius = 58;
  const strokeWidth = 10;
  
  const clampedValue = Math.min(100, Math.max(0, value));
  const clampedBench = Math.min(100, Math.max(0, benchmarkValue));
  
  // Sweep: 180 degrees from PI (left, 180°) down to 0 (right, 0°)
  const arcLength = Math.PI * trackRadius; // ~226.19
  const strokeOffset = arcLength * (1 - clampedValue / 100);

  // Generate tick marks along the outer perimeter (every 10% and every 5%)
  const ticks = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 20; i++) {
      const pct = (i / 20) * 100;
      const angle = Math.PI * (1 - pct / 100); // from PI to 0
      const isMajor = i % 2 === 0; // 0, 10, 20, 30...
      const tickLength = isMajor ? 7 : 4;
      const r1 = outerRadius;
      const r2 = outerRadius - tickLength;
      const x1 = cx + r1 * Math.cos(angle);
      const y1 = cy - r1 * Math.sin(angle);
      const x2 = cx + r2 * Math.cos(angle);
      const y2 = cy - r2 * Math.sin(angle);
      
      // Label for 0%, 50%, 100%
      let label = null;
      if (i === 0 || i === 10 || i === 20) {
        const lr = outerRadius + 11;
        const lx = cx + lr * Math.cos(angle);
        const ly = cy - lr * Math.sin(angle) + 3;
        label = { text: `${pct}`, x: lx, y: ly };
      }
      
      arr.push({ x1, y1, x2, y2, isMajor, pct, label });
    }
    return arr;
  }, []);

  // Needle angle for the 8-week value (in degrees for SVG rotation around center)
  // At 0%: angle is -90° (points west/left), at 50%: 0° (points north/up), at 100%: +90° (points east/right)
  const needleRotation = (clampedValue / 100) * 180 - 90;

  // Benchmark position (annual average) marker calculation
  const benchAngle = Math.PI * (1 - clampedBench / 100);
  const benchR1 = trackRadius - strokeWidth / 2 - 4;
  const benchR2 = trackRadius + strokeWidth / 2 + 5;
  const benchX1 = cx + benchR1 * Math.cos(benchAngle);
  const benchY1 = cy - benchR1 * Math.sin(benchAngle);
  const benchX2 = cx + benchR2 * Math.cos(benchAngle);
  const benchY2 = cy - benchR2 * Math.sin(benchAngle);

  // Status difference calculation for quick dynamic styling
  const diff = value - benchmarkValue;

  return (
    <div className="relative flex flex-col items-center justify-center my-0 select-none w-full max-w-[240px]">
      <svg viewBox="0 0 220 126" className="w-full h-auto overflow-visible drop-shadow-md">
        <defs>
          {/* Active Gradient */}
          <linearGradient id={`gauge-grad-${id}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorGradient[0]} />
            <stop offset="100%" stopColor={colorGradient[1]} />
          </linearGradient>

          {/* Dial Face Metallic Radial Gradient */}
          <radialGradient id={`dial-face-${id}`} cx="50%" cy="85%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#f8fafc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.95" />
          </radialGradient>

          {/* Glowing Filter for Needle & Active Arc */}
          <filter id={`needle-glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.25" />
          </filter>

          <filter id={`arc-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={colorGradient[1]} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Dial Face Inner Shadow Arc */}
        <path
          d={`M ${cx - trackRadius - 10} ${cy} A ${trackRadius + 10} ${trackRadius + 10} 0 0 1 ${cx + trackRadius + 10} ${cy} Z`}
          fill={`url(#dial-face-${id})`}
          className="opacity-70"
        />

        {/* Calibration Sub-Ticks & Labels */}
        {ticks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isMajor ? '#64748b' : '#cbd5e1'}
              strokeWidth={t.isMajor ? '1.75' : '1'}
              strokeLinecap="round"
            />
            {t.label && (
              <text
                x={t.label.x}
                y={t.label.y}
                textAnchor="middle"
                className="text-[9px] font-black fill-slate-400 select-none font-mono"
              >
                {t.label.text}
              </text>
            )}
          </g>
        ))}

        {/* Background Base Track with Chamfered Groove */}
        <path
          d={`M ${cx - trackRadius} ${cy} A ${trackRadius} ${trackRadius} 0 0 1 ${cx + trackRadius} ${cy}`}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - trackRadius} ${cy} A ${trackRadius} ${trackRadius} 0 0 1 ${cx + trackRadius} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Subdivided Zone Indicators on Track (subtle zone markers for <50, 70, 90) */}
        <path
          d={`M ${cx - trackRadius} ${cy} A ${trackRadius} ${trackRadius} 0 0 1 ${cx} ${cy - trackRadius}`}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeDasharray="2 6"
          strokeLinecap="round"
          className="opacity-50"
        />

        {/* Active Value Neon Arc */}
        <motion.path
          d={`M ${cx - trackRadius} ${cy} A ${trackRadius} ${trackRadius} 0 0 1 ${cx + trackRadius} ${cy}`}
          fill="none"
          stroke={`url(#gauge-grad-${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          filter={`url(#arc-glow-${id})`}
        />

        {/* Benchmark Yearly Milestone Marker */}
        <g>
          <line
            x1={benchX1}
            y1={benchY1}
            x2={benchX2}
            y2={benchY2}
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Small diamond/indicator head at outer edge */}
          <circle
            cx={benchX2}
            cy={benchY2}
            r="2"
            fill="#0f172a"
          />
        </g>

        {/* Precision Mechanical Needle - Standard SVG Transform around (cx, cy) */}
        <g 
          transform={`rotate(${needleRotation}, ${cx}, ${cy})`}
          filter={`url(#needle-glow-${id})`}
        >
          {/* Counterweight Tail */}
          <path
            d={`M ${cx - 3} ${cy} L ${cx - 2} ${cy + 10} L ${cx + 2} ${cy + 10} L ${cx + 3} ${cy} Z`}
            fill="#0f172a"
          />
          {/* Needle Spine */}
          <path
            d={`M ${cx - 3.5} ${cy} L ${cx - 1} ${cy - trackRadius + 4} L ${cx} ${cy - trackRadius - 1} L ${cx + 1} ${cy - trackRadius + 4} L ${cx + 3.5} ${cy} Z`}
            fill="#0f172a"
          />
          {/* Needle Hi-Vis Accent Tip */}
          <polygon
            points={`${cx - 1.5},${cy - trackRadius + 15} ${cx},${cy - trackRadius - 1} ${cx + 1.5},${cy - trackRadius + 15}`}
            fill={colorGradient[1]}
          />
        </g>

        {/* Center Chrome / Obsidian Hub Cap with Multi-ring Layers */}
        <circle cx={cx} cy={cy} r="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="13" fill="#0f172a" />
        <circle cx={cx} cy={cy} r="7" fill={colorGradient[0]} />
        <circle cx={cx - 2} cy={cy - 2} r="2.5" fill="#ffffff" className="opacity-70" />
      </svg>

      {/* High-Contrast Luxury Digital Readout Positioned Under Hub */}
      <div className="mt-[-14px] flex flex-col items-center justify-center text-center z-10">
        <div className="flex items-baseline justify-center px-3 py-0.5 rounded-xl bg-slate-900/90 text-white shadow-md border border-slate-700/60 backdrop-blur-md">
          <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
            {value}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-300 ml-0.5">%</span>
          <span className="text-[10px] font-bold text-slate-400 mr-2 border-r border-slate-700 pr-1.5">
            8 שבועות
          </span>
        </div>
      </div>
    </div>
  );
};

interface ChurnMetricCardProps {
  title: string;
  periodLabel: string;
  value: number;
  description: string;
  colorGradient: [string, string];
  id: string;
}

const ChurnMetricCard: React.FC<ChurnMetricCardProps> = ({
  title,
  periodLabel,
  value,
  description,
  colorGradient,
  id,
}) => {
  const radius = 30;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const clampedVal = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedVal / 100) * circumference;

  const isExcellent = value <= 5;
  const isModerate = value > 5 && value <= 15;

  return (
    <div className="flex-1 bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_24px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-[1.75rem] p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.09)] hover:-translate-y-1 relative overflow-hidden group">
      <div className="flex flex-col justify-center min-w-0 flex-1" dir="rtl">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-slate-900 tracking-tight">{title}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100/90 text-slate-600 border border-slate-200/60 shadow-2xs">
            {periodLabel}
          </span>
        </div>
        
        <p className="text-xs text-slate-500 font-medium mt-1">
          {description}
        </p>

        <div className="mt-3 flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${isExcellent ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'}`} />
          <span className={`text-xs font-black ${isExcellent ? 'text-emerald-700' : isModerate ? 'text-amber-700' : 'text-rose-700'}`}>
            {isExcellent ? 'שיעור נמוך ויציב ✨' : isModerate ? 'שיעור סביר לתקופה' : 'דורש תשומת לב ⚠️'}
          </span>
        </div>
      </div>

      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg width="76" height="76" className="transform -rotate-90 overflow-visible drop-shadow-sm">
          <defs>
            <linearGradient id={`churn-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorGradient[0]} />
              <stop offset="100%" stopColor={colorGradient[1]} />
            </linearGradient>
          </defs>
          <circle
            cx="38"
            cy="38"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx="38"
            cy="38"
            r={radius}
            stroke={`url(#churn-grad-${id})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-lg font-black text-slate-900 leading-none tracking-tight">
            {value}%
          </span>
        </div>
      </div>
    </div>
  );
};

const TrendsDashboard: React.FC = () => {
  const { members, weeklyHistory, yearConfig } = useData();

  const RETENTION_THRESHOLDS = {
    TOURIST: 50,
    ECONOMY: 70,
    BUSINESS: 90,
  };

  const stats = useMemo(() => {
    if (!members.length) return null;

    const communityMembers = members.filter(m => m.role !== 'Staff' && !isAppShaperUser(m));
    const activeMembers = communityMembers.filter(m => m.isActive);

    const last8Sessions = weeklyHistory.slice(0, 8);

    // Operational Year Boundaries
    const opStartDate = parseDate(yearConfig?.startDate) || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const opEndDate = parseDate(yearConfig?.endDate) || new Date();
    
    const yearlySessions = weeklyHistory.filter(session => {
      const sessionDate = parseDate(session.date);
      return sessionDate && sessionDate >= opStartDate && sessionDate <= opEndDate;
    });

    // 1. Age Cohorts (8-session & Yearly retention)
    const cohorts = [
      { label: 'צעירים', key: 'צעירים (18-25)' },
      { label: 'בוגרים', key: 'בוגרים (26-40)' },
      { label: 'אמצע חיים', key: 'אמצע החיים (41-60)' },
      { label: 'ותיקים', key: 'ותיקים (60+)' }
    ].map(c => {
      const groupMembers = activeMembers.filter(m => {
        const age = calculateAge(m.birthday || (m as any).birthDate);
        if (age === null) return false;
        if (c.key === 'צעירים (18-25)') return age >= 18 && age <= 25;
        if (c.key === 'בוגרים (26-40)') return age >= 26 && age <= 40;
        if (c.key === 'אמצע החיים (41-60)') return age >= 41 && age <= 60;
        if (c.key === 'ותיקים (60+)') return age > 60;
        return false;
      });

      const potentialAttendance = last8Sessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);

      const actualAttendance = last8Sessions.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);

      const retention = potentialAttendance > 0 
        ? Math.round((actualAttendance / potentialAttendance) * 100) 
        : 0;

      const yearlyPotentialAttendance = yearlySessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);

      const yearlyActualAttendance = yearlySessions.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);

      const yearlyRetention = yearlyPotentialAttendance > 0 
        ? Math.round((yearlyActualAttendance / yearlyPotentialAttendance) * 100) 
        : 0;

      return {
        label: c.label,
        retention,
        yearlyRetention,
        count: groupMembers.length,
      };
    });

    // 2. Gender Cohorts
    const genderCounts = {
      'זכר': activeMembers.filter(m => m.gender === 'זכר').length,
      'נקבה': activeMembers.filter(m => m.gender === 'נקבה' && m.role !== 'Staff').length,
      'לא בינארי': activeMembers.filter(m => m.gender === 'לא בינארי').length,
      'אחר': activeMembers.filter(m => !m.gender || m.gender === 'מעדיפ/ה לא לציין').length,
    };

    const genderCohorts = [
      { label: 'גברים', key: 'זכר' },
      { label: 'נשים', key: 'נקבה' },
      { label: 'לא בינארי', key: 'לא בינארי' },
      { label: 'אחר/לא צוין', key: 'אחר' }
    ].map(c => {
      const groupMembers = activeMembers.filter(m => {
        if (c.key === 'אחר') return !m.gender || m.gender === 'מעדיפ/ה לא לציין';
        return m.gender === c.key;
      });

      const potentialAttendance = last8Sessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);

      const actualAttendance = last8Sessions.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);
      
      const retention = potentialAttendance > 0 
        ? Math.round((actualAttendance / potentialAttendance) * 100) 
        : 0;
      
      const yearlyPotentialAttendance = yearlySessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = parseDate(m.joinedAt);
          const sessionDate = parseDate(session.date);
          if (session.participantIds?.includes(m.id)) return true;
          if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = parseDate(m.deactivatedAt);
            if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);

      const yearlyActualAttendance = yearlySessions.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);

      const yearlyRetention = yearlyPotentialAttendance > 0 
        ? Math.round((yearlyActualAttendance / yearlyPotentialAttendance) * 100) 
        : 0;

      const count = genderCounts[c.key as keyof typeof genderCounts] || 0;
      
      return {
        label: c.label,
        value: retention,
        yearlyRetention,
        count
      };
    });

    // 3. Overall 8-week retention
    const overallPotentialAttendance = last8Sessions.reduce((sum, session) => {
      const activeGroupMembers = activeMembers.filter(m => {
        const joinedDate = parseDate(m.joinedAt);
        const sessionDate = parseDate(session.date);
        if (session.participantIds?.includes(m.id)) return true;
        if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
        if (m.deactivatedAt) {
          const deactivatedDate = parseDate(m.deactivatedAt);
          if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
        }
        return true;
      });
      return sum + activeGroupMembers.length;
    }, 0);

    const overallActualAttendance = last8Sessions.reduce((sum, session) => {
      const attendees = session.participantIds || [];
      const groupAttendees = attendees.filter((id: string) => 
        activeMembers.some(m => m.id === id)
      ).length;
      return sum + groupAttendees;
    }, 0);

    const overallRetention = overallPotentialAttendance > 0 
      ? Math.round((overallActualAttendance / overallPotentialAttendance) * 100) 
      : 0;

    // 4. Overall yearly retention
    const overallYearlyPotentialAttendance = yearlySessions.reduce((sum, session) => {
      const activeGroupMembers = activeMembers.filter(m => {
        const joinedDate = parseDate(m.joinedAt);
        const sessionDate = parseDate(session.date);
        if (session.participantIds?.includes(m.id)) return true;
        if (joinedDate && sessionDate && joinedDate > sessionDate) return false;
        if (m.deactivatedAt) {
          const deactivatedDate = parseDate(m.deactivatedAt);
          if (deactivatedDate && sessionDate && deactivatedDate < sessionDate) return false;
        }
        return true;
      });
      return sum + activeGroupMembers.length;
    }, 0);

    const overallYearlyActualAttendance = yearlySessions.reduce((sum, session) => {
      const attendees = session.participantIds || [];
      const groupAttendees = attendees.filter((id: string) => 
        activeMembers.some(m => m.id === id)
      ).length;
      return sum + groupAttendees;
    }, 0);

    const overallYearlyRetention = overallYearlyPotentialAttendance > 0 
      ? Math.round((overallYearlyActualAttendance / overallYearlyPotentialAttendance) * 100) 
      : 0;

    // 5. Low Pulse Calculation (Absence in last 4 active sessions)
    const surfHistory = weeklyHistory.filter(s => !s.isEvent);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const seasonStart = yearConfig?.startDate ? parseDate(yearConfig.startDate) || new Date('2026-01-01') : new Date('2026-01-01');
    seasonStart.setHours(0, 0, 0, 0);
    const seasonEnd = yearConfig?.endDate ? parseDate(yearConfig.endDate) || new Date('2026-12-31') : new Date('2026-12-31');
    seasonEnd.setHours(23, 59, 59, 999);

    const rawValidSessions = surfHistory.filter(session => {
      const sessionDate = parseDate(session.date);
      if (sessionDate) sessionDate.setHours(0, 0, 0, 0);
      if (!sessionDate || isNaN(sessionDate.getTime())) return false;
      const hasParticipants = (session.participantsCount || 0) > 0 || (session.participantIds?.length || 0) > 0;
      return sessionDate >= seasonStart && sessionDate <= seasonEnd && sessionDate <= now && hasParticipants;
    });

    const sessionsByDate = new Map<string, { date: Date, participantIds: Set<string> }>();
    rawValidSessions.forEach(session => {
      const sessionDate = parseDate(session.date);
      if (!sessionDate) return;
      const day = sessionDate.getDay();
      const diff = 4 - day;
      const thursdayDate = new Date(sessionDate);
      thursdayDate.setDate(thursdayDate.getDate() + diff);
      thursdayDate.setHours(7, 0, 0, 0);
      const dateKey = thursdayDate.toDateString();
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, { date: thursdayDate, participantIds: new Set<string>() });
      }
      (session.participantIds || []).forEach((id: string) => sessionsByDate.get(dateKey)!.participantIds.add(id));
    });

    const validSessions = Array.from(sessionsByDate.values()).map(s => ({
      date: s.date,
      participantIds: Array.from(s.participantIds)
    })).sort((a, b) => b.date.getTime() - a.date.getTime());

    const last4Sessions = validSessions.slice(0, 4);
    const recentParticipants = new Set<string>();
    last4Sessions.forEach(session => {
      (session.participantIds || []).forEach((id: string) => recentParticipants.add(id));
    });

    const lowPulseMembers = activeMembers
      .filter(m => !recentParticipants.has(m.id))
      .map(m => {
        const lastSession = validSessions.find(s => s.participantIds.includes(m.id));
        return {
          ...m,
          lastSessionDate: lastSession ? lastSession.date.toLocaleDateString('he-IL') : 'מעולם לא'
        };
      });

    // 6. Churn Rate Calculations
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const activeAtStartOfMonth = communityMembers.filter(m => {
      if (m.isActive) return true;
      if (!m.deactivatedAt) return true;
      const dDate = (m.deactivatedAt as any).toDate ? (m.deactivatedAt as any).toDate() : parseDate(m.deactivatedAt);
      return dDate && dDate >= startOfCurrentMonth;
    });

    const churnedThisMonth = communityMembers.filter(m => {
      if (m.isActive) return false;
      if (!m.deactivatedAt) return true;
      const dDate = (m.deactivatedAt as any).toDate ? (m.deactivatedAt as any).toDate() : parseDate(m.deactivatedAt);
      return dDate && dDate >= startOfCurrentMonth;
    });

    const churnRate = activeAtStartOfMonth.length > 0 
      ? parseFloat(((churnedThisMonth.length / activeAtStartOfMonth.length) * 100).toFixed(1)) 
      : 0;

    const currentYear = now.getFullYear();
    const yearStart = now.getMonth() >= 8 ? new Date(currentYear, 8, 1) : new Date(currentYear - 1, 8, 1);

    const annualChurned = communityMembers.filter(m => {
      if (m.isActive) return false;
      if (!m.deactivatedAt) return true;
      const dDate = (m.deactivatedAt as any).toDate ? (m.deactivatedAt as any).toDate() : parseDate(m.deactivatedAt);
      return dDate && dDate >= yearStart;
    }).length;

    const annualTotal = communityMembers.filter(m => {
      if (m.isActive) return true;
      if (!m.deactivatedAt) return true;
      const dDate = (m.deactivatedAt as any).toDate ? (m.deactivatedAt as any).toDate() : parseDate(m.deactivatedAt);
      return dDate && dDate >= yearStart;
    }).length;

    const annualChurnRate = annualTotal > 0 ? parseFloat(((annualChurned / annualTotal) * 100).toFixed(1)) : 0;

    return {
      cohorts,
      genderCohorts,
      overallRetention,
      overallYearlyRetention,
      lowPulseMembers,
      churnRate,
      annualChurnRate
    };
  }, [members, weeklyHistory, yearConfig]);

  const [viewMode, setViewMode] = useState<'unified' | 'split'>(() => {
    const saved = safeLocalStorage.getItem('trendsViewMode');
    return (saved as any) || 'unified';
  });
  const [ageGroupViewMode, setAgeGroupViewMode] = useState<'cards' | 'unified'>('cards');
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const groups = [
    { id: 'age1', label: 'צעירים (18-25)', color: '#4FD1C5' },
    { id: 'age2', label: 'בוגרים (26-40)', color: '#63B3ED' },
    { id: 'age3', label: 'אמצע החיים (41-60)', color: '#4299E1' },
    { id: 'age4', label: 'ותיקים (60+)', color: '#2B6CB0' },
    { id: 'male', label: 'גברים', color: '#3182CE' },
    { id: 'female', label: 'נשים', color: '#D53F8C' },
    { id: 'nonBinary', label: 'לא בינארי', color: '#a855f7' },
    { id: 'other', label: 'אחר/לא צוין', color: '#718096' }
  ];

  const communityMembers = useMemo(() => members.filter(m => m.isActive && !isAppShaperUser(m) && m.role !== 'Staff'), [members]);

  const chartData = useMemo(() => {
    if (!yearConfig) return [];
    
    const data = [];
    const startDate = parseDate(yearConfig.startDate) || new Date(0);
    startDate.setHours(0, 0, 0, 0);
    const endDate = parseDate(yearConfig.endDate) || new Date();
    endDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Generate weeks from startDate to endDate
    let iter = new Date(startDate);
    iter.setHours(0, 0, 0, 0);
    
    let safety = 0;
    while (iter <= today && iter <= endDate && safety < 400) {
      if (iter.getDay() === 4) { // Thursdays
        const dateStr = iter.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
        const fullDate = iter.toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' });
        const activityMonth = (iter.getFullYear() - startDate.getFullYear()) * 12 + (iter.getMonth() - startDate.getMonth()) + 1;
        const weekNumber = Math.ceil(Math.abs(iter.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) || 1;
        
        const weekEntry: any = { 
          name: dateStr, 
          fullDate,
          activityMonth,
          weekNumber,
          date: iter.toISOString() 
        };
        
        // Find actual history for this week if available
        const historyEntry = weeklyHistory.find(h => {
          const hDate = parseDate(h.date);
          return hDate && hDate.toDateString() === iter.toDateString();
        });

        groups.forEach(group => {
          if (historyEntry) {
            const attendees = historyEntry.participantIds || [];
            const groupMembers = communityMembers.filter(m => {
              if (group.id === 'male') return m.gender === 'זכר';
              if (group.id === 'female') return m.gender === 'נקבה' && m.role !== 'Staff';
              if (group.id === 'nonBinary') return m.gender === 'לא בינארי';
              if (group.id === 'other') return !m.gender || m.gender === 'מעדיפ/ה לא לציין';
              
              const age = calculateAge(m.birthday || (m as any).birthDate);
              if (age === null) return false;
              if (group.id === 'age1') return age >= 18 && age <= 25;
              if (group.id === 'age2') return age >= 26 && age <= 40;
              if (group.id === 'age3') return age >= 41 && age <= 60;
              if (group.id === 'age4') return age > 60;
              return false;
            });

            const groupAttendees = attendees.filter((id: string) => groupMembers.some(m => m.id === id)).length;
            weekEntry[group.id] = groupMembers.length > 0 ? Math.round((groupAttendees / groupMembers.length) * 100) : 0;
            weekEntry[`${group.id}_count`] = groupAttendees;
          } else {
            // No history for this week
            weekEntry[group.id] = null;
            weekEntry[`${group.id}_count`] = null;
          }
        });
        
        data.push(weekEntry);
      }
      iter.setDate(iter.getDate() + 1);
      safety++;
    }
    
    return data;
  }, [members, weeklyHistory, yearConfig]);

  const currentStats = useMemo(() => {
    if (!yearConfig) return null;
    const today = new Date();
    const startDate = parseDate(yearConfig.startDate) || new Date(0);
    startDate.setHours(0, 0, 0, 0);
    const endDate = parseDate(yearConfig.endDate) || new Date();
    endDate.setHours(23, 59, 59, 999);
    
    if (today < startDate || today > endDate) return null;
    
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const currentWeek = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    const currentMonth = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth()) + 1;
    
    return { currentWeek, currentMonth };
  }, [yearConfig]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-4 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] text-slate-900 text-right backdrop-blur-[24px] bg-white/50 border border-white/80" dir="rtl">
          <p className="text-xs font-black mb-1 border-b border-slate-200/60 pb-2 text-slate-800">{data.fullDate}</p>
          <p className="text-[12px] font-bold text-teal-600 mb-2">חודש {data.activityMonth} לשנת חבל זוג</p>
          <div className="space-y-1.5 mt-2">
            {payload.map((entry: any, index: number) => {
              // Only show the group data, skip the count bars in unified view if they are too many
              if (entry.dataKey.toString().endsWith('_count')) return null;
              
              return (
                <div key={index} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs font-bold text-slate-700">{entry.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{Math.round(entry.value as number)}%</span>
                  </div>
                  {entry.payload[`${entry.dataKey}_count`] !== undefined && (
                    <p className="text-[10px] font-semibold text-slate-500 mr-4">
                      משתתפים בפועל: {entry.payload[`${entry.dataKey}_count`]}
                    </p>
                  )}
                </div>
              );
            })}
            <p className="text-[11px] font-bold text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
              שבוע {data.weekNumber} מתחילת הפעילות
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!stats) return null;

  return (
    <div className="relative space-y-8 p-6 md:p-8 rounded-[2rem] overflow-hidden -mx-4 md:mx-0">
      {/* Abstract Elegant 3D Orbs / Glassmorphism */}
      <div className="absolute inset-0 bg-[#f8fafc] pointer-events-none -z-30 rounded-[2rem]" />
      
      {/* Moving organic shapes */}
      <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-teal-300/20 rounded-[50%] mix-blend-multiply filter blur-[80px] animate-blob pointer-events-none -z-20" />
      <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-cyan-300/20 rounded-[50%] mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000 pointer-events-none -z-20" />
      <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] bg-indigo-300/10 rounded-[50%] mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000 pointer-events-none -z-20" />

      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none -z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* Header & Switcher */}
      <div className="relative z-10 backdrop-blur-[40px] bg-white/40 border border-white/80 shadow-[0_40px_80px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] rounded-[2rem] p-10 transform-gpu perspective-[1000px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 transform translate-z-[10px]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">דשבורד טרנדים והתמדה</h3>
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">ניתוח שנת חבל זוג • 7 קבוצות מיקוד</p>
            </div>
          </div>
        </div>

        {yearConfig && (
          <OperationalChartHeader 
            startDate={(parseDate(yearConfig.startDate) || new Date(0)).toLocaleDateString('he-IL')}
            endDate={(parseDate(yearConfig.endDate) || new Date()).toLocaleDateString('he-IL')}
            currentMonth={currentStats?.currentMonth}
            currentWeek={currentStats?.currentWeek}
            isActive={new Date() <= (parseDate(yearConfig.endDate) || new Date())}
          />
        )}
      </div>

      {/* Age Group Retention Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 relative z-10 backdrop-blur-[40px] bg-white/40 border border-white/80 shadow-[0_40px_80px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] rounded-[2rem] p-8 md:p-10 transition-all duration-500 group transform-gpu perspective-[1000px]"
      >
          {/* Subtle 3D highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between mb-12 relative z-10 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">שיעור התמדה לפי קבוצות גיל</h3>
                <p className="text-xs text-slate-600 mt-1 font-bold">
                  מדידת אחוזי הגעה לסשנים בפועל: 8 שבועות אחרונים לעומת ממוצע שנתי
                </p>
              </div>
            </div>

            {/* Toggle View Button */}
            <div dir="ltr" className="relative flex bg-white/60 backdrop-blur-xl border border-slate-200/60 p-1 rounded-full shadow-xs">
              <div className="absolute inset-1 flex pointer-events-none">
                <motion.div
                  className="w-1/2 h-full rounded-full bg-white border border-slate-200/80 shadow-sm"
                  animate={{ x: ageGroupViewMode === 'cards' ? '0%' : '100%' }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              </div>
              <button
                onClick={() => setAgeGroupViewMode('cards')}
                className={`relative z-10 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-colors duration-300 ${
                  ageGroupViewMode === 'cards' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                שעוני חיווי (מדים)
              </button>
              <button
                onClick={() => setAgeGroupViewMode('unified')}
                className={`relative z-10 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-colors duration-300 ${
                  ageGroupViewMode === 'unified' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                גרף מאוחד
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {ageGroupViewMode === 'unified' ? (
              <motion.div 
                key="unified"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full h-[400px] mt-8 relative z-10 bg-white/60 backdrop-blur-[20px] rounded-2xl p-6 border border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_10px_30px_rgba(15,23,42,0.05)]" 
                dir="ltr"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.cohorts} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} dx={-10} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const yearlyVal = payload.find(p => p.dataKey === 'yearlyRetention')?.value as number || 0;
                          const octoVal = payload.find(p => p.dataKey === 'retention')?.value as number || 0;
                          const diff = octoVal - yearlyVal;
                          return (
                            <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl text-right" dir="rtl">
                              <p className="text-sm font-black text-white mb-2">{label}</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between gap-4 text-slate-300">
                                  <span>אוקטו (8 שבועות):</span>
                                  <span className="font-bold text-emerald-400">{octoVal}%</span>
                                </div>
                                <div className="flex justify-between gap-4 text-slate-400">
                                  <span>ממוצע שנתי:</span>
                                  <span className="font-bold text-slate-200">{yearlyVal}%</span>
                                </div>
                                <div className="pt-2 mt-1 border-t border-white/10 flex justify-between gap-4">
                                  <span className="text-slate-400">מגמה:</span>
                                  <span className={`font-black ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                                    {diff > 0 ? `שיפור של +${diff}%` : diff < 0 ? `ירידה של ${Math.abs(diff)}%` : 'ללא שינוי (0%)'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', color: '#cbd5e1' }} />
                    <ReferenceLine y={stats.overallYearlyRetention} stroke="#52525b" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: `ממוצע שנתי (${stats.overallYearlyRetention}%)`, fill: '#a1a1aa', fontSize: 11, fontWeight: 500 }} />
                    <ReferenceLine y={stats.overallRetention} stroke="#3f3f46" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: `ממוצע 8 שבועות (${stats.overallRetention}%)`, fill: '#71717a', fontSize: 11, fontWeight: 500 }} />
                    <Bar dataKey="yearlyRetention" name="ממוצע שנתי" fill="#52525b" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000} />
                    <Bar dataKey="retention" name="אוקטו (8 שבועות)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000}>
                      {stats.cohorts.map((entry: any, index: number) => {
                        let color = "#10b981"; // emerald-500
                        if (entry.retention < RETENTION_THRESHOLDS.TOURIST) color = "#f43f5e"; // rose-500
                        else if (entry.retention < RETENTION_THRESHOLDS.ECONOMY) color = "#f59e0b"; // amber-500
                        else if (entry.retention < RETENTION_THRESHOLDS.BUSINESS) color = "#3b82f6"; // blue-500
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Trend Pills Row under graph */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-200/50" dir="rtl">
                  {stats.cohorts.map((group: any, idx: number) => {
                    const diff = group.retention - group.yearlyRetention;
                    const isImproving = diff > 0;
                    const isDeclining = diff < 0;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-xs ${
                          isImproving 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : isDeclining 
                            ? 'bg-rose-50 text-rose-800 border-rose-200' 
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="font-black text-slate-900">{group.label}:</span>
                        {isImproving && <TrendingUp size={12} className="text-emerald-600" />}
                        {isDeclining && <TrendingDown size={12} className="text-rose-600" />}
                        {!isImproving && !isDeclining && <Minus size={12} className="text-slate-400" />}
                        <span>
                          {isImproving ? `+${diff}% (שיפור)` : isDeclining ? `${diff}% (ירידה)` : 'יציב'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="cards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8 relative z-10"
              >
                {stats.cohorts.map((group: any, idx: number) => {
                  const retention = group.retention;
                  const yearly = group.yearlyRetention;
                  const diff = retention - yearly;
                  const isImproving = diff > 0;
                  const isDeclining = diff < 0;
                  const isNeutral = diff === 0;

                  let categoryLabel = "";
                  let categoryBadgeClass = "";
                  let colorGradient: [string, string] = ['#10b981', '#059669'];
                  let statusDotColor = "bg-emerald-500";
                  
                  if (retention < RETENTION_THRESHOLDS.TOURIST) {
                    categoryLabel = "תיירים";
                    categoryBadgeClass = "text-rose-700 bg-rose-50 border-rose-200";
                    colorGradient = ['#fb7185', '#e11d48'];
                    statusDotColor = "bg-rose-500";
                  } else if (retention < RETENTION_THRESHOLDS.ECONOMY) {
                    categoryLabel = "אקונומי פלוס";
                    categoryBadgeClass = "text-amber-800 bg-amber-50 border-amber-200";
                    colorGradient = ['#fbbf24', '#d97706'];
                    statusDotColor = "bg-amber-500";
                  } else if (retention < RETENTION_THRESHOLDS.BUSINESS) {
                    categoryLabel = "ביזנס קלאס";
                    categoryBadgeClass = "text-sky-800 bg-sky-50 border-sky-200";
                    colorGradient = ['#60a5fa', '#2563eb'];
                    statusDotColor = "bg-blue-500";
                  } else {
                    categoryLabel = "פירסט קלאס";
                    categoryBadgeClass = "text-emerald-800 bg-emerald-50 border-emerald-200";
                    colorGradient = ['#34d399', '#059669'];
                    statusDotColor = "bg-emerald-500";
                  }

                  return (
                    <div 
                      key={idx} 
                      className="bg-white/70 backdrop-blur-2xl shadow-[0_12px_36px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,0.95)] rounded-[2rem] p-6 border border-white/80 flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] hover:-translate-y-2 transition-all duration-500 transform-gpu"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3 relative z-10" dir="rtl">
                          <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">{group.label}</h4>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">{group.count} חברים פעילים</p>
                          </div>
                          <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-black tracking-wide ${categoryBadgeClass}`}>
                            {categoryLabel}
                          </div>
                        </div>

                        {/* Speedometer Radial Gauge */}
                        <div className="py-2 flex flex-col items-center justify-center relative z-10">
                          <SemiCircleGauge 
                            value={retention} 
                            benchmarkValue={yearly} 
                            colorGradient={colorGradient} 
                            id={`age-${idx}`} 
                          />
                        </div>

                        {/* Dual Metric Comparison Box */}
                        <div className="mt-1 grid grid-cols-2 gap-2 p-2.5 bg-slate-50/90 rounded-2xl border border-slate-200/70 relative z-10" dir="rtl">
                          {/* 8 Weeks */}
                          <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-white/80 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500">8 שבועות (אוקטו)</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
                              <span className="text-base font-black text-slate-900">{retention}%</span>
                            </div>
                          </div>

                          {/* Yearly */}
                          <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-white/80 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500">ממוצע שנתי</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-2 h-2 rounded-full bg-slate-700" />
                              <span className="text-base font-black text-slate-700">{yearly}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trend Difference Banner Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-200/60 relative z-10" dir="rtl">
                        <div className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-black shadow-2xs ${
                          isImproving 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : isDeclining 
                            ? 'bg-rose-50 text-rose-800 border-rose-200' 
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {isImproving && <TrendingUp size={15} className="text-emerald-600 shrink-0" />}
                          {isDeclining && <TrendingDown size={15} className="text-rose-600 shrink-0" />}
                          {isNeutral && <Minus size={15} className="text-slate-400 shrink-0" />}
                          <span>
                            {isImproving && `שיפור של +${diff}% לעומת השנתי`}
                            {isDeclining && `ירידה של ${Math.abs(diff)}% לעומת השנתי`}
                            {isNeutral && `יציב - ללא שינוי מול השנתי`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Indicators */}
          <div className="mt-10 pt-5 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 w-full relative z-10 text-xs" dir="rtl">
            <div className="flex items-center gap-2 text-slate-600 font-bold">
              <span className="w-3 h-1 bg-slate-800 rounded-full inline-block" />
              <span>הקו הכהה בשעון מסמן את סף הממוצע השנתי של קבוצת הגיל</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[11px] text-slate-600 font-bold">תיירים (&lt;{RETENTION_THRESHOLDS.TOURIST}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[11px] text-slate-600 font-bold">אקונומי ({RETENTION_THRESHOLDS.TOURIST}-{RETENTION_THRESHOLDS.ECONOMY - 1}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[11px] text-slate-600 font-bold">ביזנס ({RETENTION_THRESHOLDS.ECONOMY}-{RETENTION_THRESHOLDS.BUSINESS - 1}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-600 font-bold">פירסט ({RETENTION_THRESHOLDS.BUSINESS}%+)</span>
              </div>
            </div>
          </div>
        </motion.div>


      {/* Gender Retention Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 relative z-10 backdrop-blur-[40px] bg-white/40 border border-white/80 shadow-[0_40px_80px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] rounded-[2rem] p-8 md:p-10 transition-all duration-500 group transform-gpu perspective-[1000px]"
      >
          {/* Subtle 3D highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                <Heart size={24} />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">שיעור התמדה לפי מגדר</h3>
                <p className="text-xs text-slate-600 mt-1 font-bold">
                  מדידת אחוזי הגעה לסשנים בפועל: 8 שבועות אחרונים לעומת ממוצע שנתי
                </p>
              </div>
            </div>
          </div>

          {/* Quick Explanation */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium relative z-10 flex items-start gap-2.5">
            <span className="text-base">📊</span>
            <div>
              <strong>מה משמעות המדד?</strong> האחוז מייצג את ממוצע המפגשים אליהם הגיע חבר בקבוצה מתוך 100% המפגשים שהיו זמינים עבורו (ללא קשר לכמות החברים בקבוצה).
            </div>
          </div>

          <div className="flex flex-col gap-10 relative z-10 w-full mt-8 px-4 pb-8">
            {stats.genderCohorts.map((group: any, idx: number) => {
              const retention = group.value;
              const yearly = group.yearlyRetention;
              const diff = retention - yearly;
              const isImproving = diff > 0;
              const isDeclining = diff < 0;
              const isNeutral = diff === 0;
              
              let categoryLabel = "";
              let categoryColor = "";
              let barColorClass = "bg-emerald-500";
              
              if (retention < RETENTION_THRESHOLDS.TOURIST) {
                categoryLabel = "תיירים";
                categoryColor = "text-rose-600 bg-rose-50 border-rose-200";
                barColorClass = "bg-rose-500";
              } else if (retention < RETENTION_THRESHOLDS.ECONOMY) {
                categoryLabel = "אקונומי פלוס";
                categoryColor = "text-amber-600 bg-amber-50 border-amber-200";
                barColorClass = "bg-amber-500";
              } else if (retention < RETENTION_THRESHOLDS.BUSINESS) {
                categoryLabel = "ביזנס קלאס";
                categoryColor = "text-blue-600 bg-blue-50 border-blue-200";
                barColorClass = "bg-blue-500";
              } else {
                categoryLabel = "פירסט קלאס";
                categoryColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
              }

              return (
                <div key={idx} className="flex flex-col w-full relative group/bullet">
                  {/* Header: Responsive Layout for Mobile & Desktop */}
                  <div className="flex flex-col gap-3 mb-4">
                    {/* Top Row: Title, Count, Trend Badge, Category Badge (RTL) */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{group.label}</span>
                        <span className="text-[10px] md:text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 whitespace-nowrap">{group.count} חברים</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* 8-Week vs Annual Trend Badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] md:text-xs font-black border shadow-xs whitespace-nowrap ${
                          isImproving 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : isDeclining 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {isImproving && <TrendingUp size={13} className="text-emerald-600" />}
                          {isDeclining && <TrendingDown size={13} className="text-rose-600" />}
                          {isNeutral && <Minus size={13} className="text-slate-400" />}
                          <span>
                            {isImproving && `שיפור של +${diff}%`}
                            {isDeclining && `ירידה של ${Math.abs(diff)}%`}
                            {isNeutral && `ללא שינוי (0%)`}
                          </span>
                        </div>

                        <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-md font-bold border whitespace-nowrap ${categoryColor}`}>
                          {categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Stats (LTR to match graph) */}
                    <div dir="ltr" className="flex flex-wrap items-center justify-start gap-4 md:gap-6">
                      <div className="flex flex-col items-start">
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 whitespace-nowrap">אוקטו (8 שבועות)</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl md:text-2xl font-black text-slate-900 leading-none">{retention}</span>
                          <span className="text-xs md:text-sm font-medium text-slate-500">%</span>
                        </div>
                      </div>
                      
                      <div className="w-px h-8 md:h-10 bg-slate-200" />
                      
                      <div className="flex flex-col items-start">
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 whitespace-nowrap">ממוצע שנתי</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl md:text-2xl font-bold text-slate-600 leading-none">{yearly}</span>
                          <span className="text-xs md:text-sm font-medium text-slate-500">%</span>
                        </div>
                      </div>

                      <div className="w-px h-8 md:h-10 bg-slate-200" />

                      <div className="flex flex-col items-start">
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 whitespace-nowrap">פער מול השנתי</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-base md:text-lg font-black leading-none ${
                            isImproving ? 'text-emerald-600' : isDeclining ? 'text-rose-600' : 'text-slate-600'
                          }`}>
                            {diff > 0 ? `+${diff}%` : `${diff}%`}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {isImproving ? '(מגמת עלייה)' : isDeclining ? '(מגמת ירידה)' : '(יציב)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bullet Graph Container (Linear Style) */}
                  <div dir="ltr" className="relative w-full h-8 rounded-lg bg-slate-100/50 border border-slate-200/50 overflow-visible flex items-center px-1 shadow-sm">
                    
                    {/* Background Ranges (Subtle) */}
                    <div className="absolute inset-0 flex rounded-lg overflow-hidden pointer-events-none opacity-20">
                      <div className="h-full w-[50%] bg-rose-500 border-r border-slate-200" />
                      <div className="h-full w-[20%] bg-amber-500 border-r border-slate-200" />
                      <div className="h-full w-[20%] bg-blue-500 border-r border-slate-200" />
                      <div className="h-full w-[10%] bg-emerald-500" />
                    </div>

                    {/* Scale Marks */}
                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                      {[0, 25, 50, 75, 100].map(mark => (
                        <div key={mark} className="h-full flex flex-col justify-between py-0.5">
                          <div className="w-px h-1.5 bg-slate-300" />
                          <div className="w-px h-1.5 bg-slate-300" />
                        </div>
                      ))}
                    </div>

                    {/* Main Bar (8 Weeks) */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${retention}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                      className={`h-4 rounded-md relative z-10 overflow-hidden ${barColorClass.replace('from-', 'bg-').split(' ')[0]}`}
                    />

                    {/* Secondary Marker (Annual Average) */}
                    <motion.div
                      initial={{ left: 0, opacity: 0 }}
                      animate={{ left: `${yearly}%`, opacity: 1 }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 + idx * 0.1 }}
                      className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-slate-800 z-20"
                      style={{ transform: 'translateX(-50%)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      {/* View Mode Switcher - Repositioned above graphs */}
      <div className="flex flex-col items-center gap-4 mb-8 mt-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-px bg-slate-300" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">ניתוח מגמות והתמדה</span>
          <div className="w-8 h-px bg-slate-300" />
        </div>
        <div dir="ltr" className="relative flex bg-white/50 backdrop-blur-xl border border-slate-200/50 p-1 rounded-full shadow-sm">
          {/* Animated Bubble */}
          <div className="absolute inset-1 flex pointer-events-none">
            <motion.div
              className="w-1/2 h-full rounded-full bg-white border border-slate-200 shadow-sm"
              animate={{ x: viewMode === 'unified' ? '0%' : '100%' }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          </div>

          <button
            onClick={() => setViewMode('unified')}
            className={`relative z-10 px-8 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors duration-300 ${
              viewMode === 'unified' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            גרף מאוחד
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`relative z-10 px-8 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors duration-300 ${
              viewMode === 'split' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            גרף מפוצל
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'unified' ? (
          <motion.div
            key="unified"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 backdrop-blur-[40px] bg-white/40 border border-white/80 shadow-[0_40px_80px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] rounded-[2rem] p-10 h-[500px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 40, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                
                {/* Area Highlighting */}
                {chartData.length > 0 && (
                  <ReferenceArea 
                    x1={chartData[0]?.name} 
                    x2={chartData[chartData.length - 1]?.name} 
                    fill="#F1F5F9" 
                    fillOpacity={0.5} 
                  />
                )}

                {/* Today Indicator */}
                {(() => {
                  if (!yearConfig) return null;
                  const today = new Date();
                  const sd = parseDate(yearConfig.startDate) || new Date(0);
                  const ed = parseDate(yearConfig.endDate) || new Date();
                  if (today >= sd && today <= ed) {
                    const closest = chartData.reduce((prev: any, curr: any) => {
                      const [pDay, pMonth] = prev.name.split('/');
                      const [cDay, cMonth] = curr.name.split('/');
                      const pD = new Date(today.getFullYear(), parseInt(pMonth)-1, parseInt(pDay));
                      const cD = new Date(today.getFullYear(), parseInt(cMonth)-1, parseInt(cDay));
                      return (Math.abs(cD.getTime() - today.getTime()) < Math.abs(pD.getTime() - today.getTime()) ? curr : prev);
                    });
                    
                    return (
                      <ReferenceLine 
                        x={closest?.name} 
                        stroke="#ef4444" 
                        strokeDasharray="5 5" 
                        label={{ position: 'top', value: 'היום', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} 
                      />
                    );
                  }
                  return null;
                })()}

                <XAxis 
                  dataKey="name" 
                  {...getOperationalXAxisProps(chartData.length, yearConfig)}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  dx={-10}
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  dx={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' }}
                  onMouseEnter={(o) => setHoveredGroup(o.dataKey as string)}
                  onMouseLeave={() => setHoveredGroup(null)}
                />
                {groups.map(group => (
                  <Line
                    key={group.id}
                    yAxisId="left"
                    type="monotone"
                    dataKey={group.id}
                    name={group.label}
                    stroke={hoveredGroup && hoveredGroup !== group.id ? '#e2e8f0' : group.color}
                    strokeWidth={hoveredGroup === group.id ? 4 : 2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={300}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div
            key="split"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {groups.map(group => (
              <div key={group.id} className="relative z-10 backdrop-blur-[40px] bg-white/40 border border-white/80 shadow-[0_40px_80px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] rounded-[2rem] p-8 h-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{group.label}</h4>
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: group.color }} />
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      
                      {/* Area Highlighting */}
                      {chartData.length > 0 && (
                        <ReferenceArea 
                          x1={chartData[0]?.name} 
                          x2={chartData[chartData.length - 1]?.name} 
                          fill="#F1F5F9" 
                          fillOpacity={0.5} 
                        />
                      )}

                      {/* Today Indicator */}
                      {(() => {
                        if (!yearConfig) return null;
                        const today = new Date();
                        const sd = parseDate(yearConfig.startDate) || new Date(0);
                        const ed = parseDate(yearConfig.endDate) || new Date();
                        if (today >= sd && today <= ed) {
                          const closest = chartData.reduce((prev: any, curr: any) => {
                            const [pDay, pMonth] = prev.name.split('/');
                            const [cDay, cMonth] = curr.name.split('/');
                            const pD = new Date(today.getFullYear(), parseInt(pMonth)-1, parseInt(pDay));
                            const cD = new Date(today.getFullYear(), parseInt(cMonth)-1, parseInt(cDay));
                            return (Math.abs(cD.getTime() - today.getTime()) < Math.abs(pD.getTime() - today.getTime()) ? curr : prev);
                          });
                          
                          return (
                            <ReferenceLine 
                              x={closest?.name} 
                              stroke="#ef4444" 
                              strokeDasharray="5 5" 
                            />
                          );
                        }
                        return null;
                      })()}

                      <XAxis 
                        dataKey="name" 
                        {...getOperationalXAxisProps(chartData.length, yearConfig)}
                        height={20}
                        tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        domain={[0, 100]} 
                        ticks={[0, 50, 100]}
                        tickFormatter={(val) => `${val}%`}
                        tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        yAxisId="right"
                        dataKey={`${group.id}_count`}
                        fill="#cbd5e1"
                        radius={[2, 2, 0, 0]}
                        barSize={10}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey={group.id}
                        stroke={group.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low Pulse & Churn Rate Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch pt-4">
        {/* Low Pulse (At Risk) Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-info-card p-6 sm:p-8 rounded-[3rem] flex flex-col justify-between relative group"
        >
          {/* Background elements that need clipping */}
          <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl glass-effect flex items-center justify-center text-[var(--surfer-pink)] shadow-inner border border-white/10">
                  <UserMinus size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#7A1555] tracking-tight">דופק נמוך (בסיכון נטישה)</h4>
                  <p className="text-[#000000] text-[8px] font-bold uppercase tracking-[0.3em] opacity-80">Absence Tracking • Attention Needed</p>
                </div>
              </div>
              <span className="text-[11px] font-black text-[#000000] uppercase tracking-widest glass-effect px-3 py-1 rounded-full border border-white/20 shadow-sm">
                לא השתתפו ב-4 הסשנים האחרונים ({stats?.lowPulseMembers?.length || 0})
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto custom-scrollbar pl-2 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(stats?.lowPulseMembers && stats.lowPulseMembers.length > 0) ? (
                  stats.lowPulseMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl admin-info-card border border-white/20 hover:bg-white/10 transition-all group/item shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt="" 
                            className="w-10 h-10 rounded-xl border border-white/20 shadow-inner object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-white/20 shadow-inner flex-shrink-0">
                            <User size={20} />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-sm font-black text-[#7A1555] truncate">{member.firstName} {member.lastName}</p>
                          <p className="text-[11px] font-bold text-[#000000] opacity-80 italic">פעם אחרונה: {(member as any).lastSessionDate}</p>
                        </div>
                      </div>
                      <button className="p-2 rounded-xl glass-effect text-[#004D40] opacity-0 group-hover/item:opacity-100 transition-all hover:bg-white/20 flex-shrink-0">
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-12 text-center border border-dashed border-white/20 rounded-3xl glass-effect">
                    <p className="text-[#000000] font-black uppercase tracking-[0.3em] text-sm">כל המשתמשים פעילים בדופק גבוה ✨</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Churn Buckets Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-info-card p-6 sm:p-8 rounded-[3rem] relative overflow-hidden group flex flex-col justify-between"
        >
          {/* Glossy Shimmer for the whole container */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-30 pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-6 relative z-10" dir="rtl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl glass-effect flex items-center justify-center text-[var(--surfer-pink)] shadow-inner border border-white/10 shrink-0">
                  <UserMinus size={24} />
                </div>
                <div>
                  <h3 className="text-[#7A1555] font-black text-xl sm:text-2xl tracking-tight">שיעורי עזיבה Churn rate</h3>
                  <p className="text-[#000000] text-[10px] tracking-[0.25em] mt-0.5 font-black uppercase opacity-75">COMMUNITY INSIGHTS • ATTRITION</p>
                </div>
              </div>
            </div>

            {/* Horizontal Side-by-Side Churn Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 my-2">
              <ChurnMetricCard 
                title="עזיבה חודשית"
                periodLabel="חודש נוכחי"
                value={stats?.churnRate ?? 0}
                description="אחוז מחברי הנבחרת שעזבו החודש"
                colorGradient={['#f43f5e', '#e11d48']}
                id="monthly-churn"
              />
              <ChurnMetricCard 
                title="עזיבה שנתית"
                periodLabel="12 חודשים"
                value={stats?.annualChurnRate ?? 0}
                description="אחוז מחברי הנבחרת שעזבו במהלך השנה"
                colorGradient={['#ec4899', '#be185d']}
                id="annual-churn"
              />
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-4 border-t border-slate-200/60 text-center" dir="rtl">
            <p className="text-xs text-slate-500 font-bold">
              מעקב שוטף אחר נטישה מסייע באיתור מוקדם של מגמות עזיבה ושימור החברים בקהילה
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrendsDashboard;
