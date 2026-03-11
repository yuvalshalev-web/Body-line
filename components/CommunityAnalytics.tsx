import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  MessageSquare,
  Activity,
  UserCheck,
  UserMinus,
  Heart,
  Sparkles,
  Waves
} from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { parseDate } from '../src/utils/dateUtils';
import { AstrodeckGauge } from './UserAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CommunityAnalytics: React.FC = () => {
  const { members, weeklyHistory, siteConfig, isLoading } = useData();

  const stats = useMemo(() => {
    if (!members.length) return null;

    const activeMembers = members.filter(m => m.isActive);
    const totalMembers = members.length;
    
    // Distance Distribution (Operational & Bins)
    const homeLat = siteConfig.home_break?.lat || 32.1624;
    const homeLng = siteConfig.home_break?.lng || 34.8447;
    
    let nearCount = 0;
    let mediumCount = 0;
    let farCount = 0;

    const binDefinitions = [
      { label: '0-10', min: 0, max: 10, color: '#e5e0d5' },
      { label: '11-20', min: 11, max: 20, color: '#dbd5c5' },
      { label: '21-30', min: 21, max: 30, color: '#d1cab5' },
      { label: '31-40', min: 31, max: 40, color: '#c7bfa5' },
      { label: '41-50', min: 41, max: 50, color: '#bdb495' },
      { label: '51-60', min: 51, max: 60, color: '#b3a985' },
      { label: '61-70', min: 61, max: 70, color: '#a99e75' },
      { label: '71-80', min: 71, max: 80, color: '#9f9365' },
      { label: '81-90', min: 81, max: 90, color: '#958855' },
      { label: '91-100+', min: 91, max: Infinity, color: '#8b7d45' },
    ];

    const binCounts = binDefinitions.map(b => ({ ...b, count: 0 }));

    activeMembers.forEach(member => {
      // Simple distance calculation for analytics (Euclidean approximation is fine for these ranges)
      if (member.lat && member.lng) {
        const dLat = (member.lat - homeLat) * 111;
        const dLng = (member.lng - homeLng) * 111 * Math.cos(homeLat * Math.PI / 180);
        const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng);

        if (distanceKm <= 20) nearCount++;
        else if (distanceKm <= 100) mediumCount++;
        else farCount++;

        const binIndex = binDefinitions.findIndex(b => distanceKm >= b.min && distanceKm <= b.max);
        if (binIndex !== -1) {
          binCounts[binIndex].count++;
        } else if (distanceKm > 100) {
          binCounts[9].count++;
        }
      }
    });

    const distanceData = binCounts.map(b => ({ label: b.label, count: b.count, color: b.color }));

    // 1. Demographics
    const now = new Date();
    const calculateAge = (birthday?: string) => {
      if (!birthday) return null;
      const birthDate = new Date(birthday);
      let age = now.getFullYear() - birthDate.getFullYear();
      const m = now.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const ageGroups = {
      'צעירים (18-25)': 0,
      'בוגרים (26-40)': 0,
      'אמצע החיים (41-60)': 0,
      'ותיקים (60+)': 0,
      'לא צוין / אחר': 0,
    };

    const ageGroupsTotal = {
      'צעירים (18-25)': 0,
      'בוגרים (26-40)': 0,
      'אמצע החיים (41-60)': 0,
      'ותיקים (60+)': 0,
      'לא צוין / אחר': 0,
    };

    activeMembers.forEach(m => {
      const age = calculateAge(m.birthday);
      if (age === null) {
        ageGroups['לא צוין / אחר']++;
        return;
      }
      if (age >= 18 && age <= 25) ageGroups['צעירים (18-25)']++;
      else if (age >= 26 && age <= 40) ageGroups['בוגרים (26-40)']++;
      else if (age >= 41 && age <= 60) ageGroups['אמצע החיים (41-60)']++;
      else if (age > 60) ageGroups['ותיקים (60+)']++;
      else ageGroups['לא צוין / אחר']++;
    });

    members.forEach(m => {
      const age = calculateAge(m.birthday);
      if (age === null) {
        ageGroupsTotal['לא צוין / אחר']++;
        return;
      }
      if (age >= 18 && age <= 25) ageGroupsTotal['צעירים (18-25)']++;
      else if (age >= 26 && age <= 40) ageGroupsTotal['בוגרים (26-40)']++;
      else if (age >= 41 && age <= 60) ageGroupsTotal['אמצע החיים (41-60)']++;
      else if (age > 60) ageGroupsTotal['ותיקים (60+)']++;
      else ageGroupsTotal['לא צוין / אחר']++;
    });

    // 4. Vitality Orbit (8-session logic)
    const last8Sessions = weeklyHistory.slice(0, 8);
    const sessionCount = last8Sessions.length;

    const cohorts = [
      { label: 'צעירים', key: 'צעירים (18-25)' },
      { label: 'בוגרים', key: 'בוגרים (26-40)' },
      { label: 'אמצע חיים', key: 'אמצע החיים (41-60)' },
      { label: 'ותיקים', key: 'ותיקים (60+)' }
    ].map(c => {
      const groupMembers = activeMembers.filter(m => {
        const age = calculateAge(m.birthday);
        if (age === null) return false;
        if (c.key === 'צעירים (18-25)') return age >= 18 && age <= 25;
        if (c.key === 'בוגרים (26-40)') return age >= 26 && age <= 40;
        if (c.key === 'אמצע החיים (41-60)') return age >= 41 && age <= 60;
        if (c.key === 'ותיקים (60+)') return age > 60;
        return false;
      });

      const potentialAttendance = groupMembers.length * sessionCount;
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

      // Pulse logic: Retention < 60% in the last 2 sessions
      const last2Sessions = last8Sessions.slice(0, 2);
      const potentialAttendanceLast2 = groupMembers.length * last2Sessions.length;
      const actualAttendanceLast2 = last2Sessions.reduce((sum, session) => {
        const attendees = session.participantIds || [];
        const groupAttendees = attendees.filter((id: string) => 
          groupMembers.some(m => m.id === id)
        ).length;
        return sum + groupAttendees;
      }, 0);
      const retentionLast2 = potentialAttendanceLast2 > 0 
        ? (actualAttendanceLast2 / potentialAttendanceLast2) * 100 
        : 0;

      // Color logic based on retention (8-session)
      let colorClass = 'from-slate-400 to-slate-500';
      let glowColor = 'rgba(148, 163, 184, 0.5)';
      let hexColor = '#94a3b8';
      
      if (retention >= 80) {
        colorClass = 'from-emerald-400 to-teal-500';
        glowColor = 'rgba(16, 185, 129, 0.6)';
        hexColor = '#10b981';
      } else if (retention >= 50) {
        colorClass = 'from-sky-400 to-blue-500';
        glowColor = 'rgba(14, 165, 233, 0.6)';
        hexColor = '#0ea5e9';
      } else if (retention > 0) {
        colorClass = 'from-orange-500 to-red-600';
        glowColor = 'rgba(239, 68, 68, 0.6)';
        hexColor = '#ef4444';
      }

      return {
        label: c.label,
        retention,
        count: groupMembers.length,
        color: colorClass,
        hexColor,
        glow: glowColor,
        shouldPulse: retention < 50 && groupMembers.length > 0
      };
    });

    // 2. Gender Mix
    const genderCounts = {
      'זכר': activeMembers.filter(m => m.gender === 'זכר').length,
      'נקבה': activeMembers.filter(m => m.gender === 'נקבה').length,
      'אחר': activeMembers.filter(m => !m.gender || m.gender === 'מעדיף/ה לא לציין').length,
    };

    const totalWomen = members.filter(m => m.gender === 'נקבה').length;
    const activeWomen = activeMembers.filter(m => m.gender === 'נקבה').length;
    const femaleRetention = totalWomen > 0 ? Math.round((activeWomen / totalWomen) * 100) : 100;
    const overallRetention = totalMembers > 0 ? Math.round((activeMembers.length / totalMembers) * 100) : 0;
    const churnedCount = members.filter(m => m.isActive === false).length;

    // 3. Churn & Low Pulse
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Members who were active at the start of the month (or joined during the month)
    const activeAtStartOfMonth = members.filter(m => {
      if (m.isActive) return true;
      if (!m.deactivatedAt) return true; // Fallback for members suspended before tracking
      const dDate = m.deactivatedAt.toDate ? m.deactivatedAt.toDate() : new Date(m.deactivatedAt);
      return dDate >= startOfCurrentMonth;
    });
    
    // Members who are currently inactive AND were deactivated THIS month
    const churnedThisMonth = members.filter(m => {
      if (m.isActive) return false;
      if (!m.deactivatedAt) return true; // Fallback
      const dDate = m.deactivatedAt.toDate ? m.deactivatedAt.toDate() : new Date(m.deactivatedAt);
      return dDate >= startOfCurrentMonth;
    });
    
    console.log("DEBUG: activeAtStartOfMonth:", activeAtStartOfMonth.length, "churnedThisMonth:", churnedThisMonth.length);
    
    const churnRate = activeAtStartOfMonth.length > 0 
      ? parseFloat(((churnedThisMonth.length / activeAtStartOfMonth.length) * 100).toFixed(1)) 
      : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessionParticipants = new Set<string>();
    weeklyHistory.forEach(session => {
      const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
      if (sessionDate >= thirtyDaysAgo) {
        (session.participantIds || []).forEach((id: string) => recentSessionParticipants.add(id));
      }
    });

    const lowPulseMembers = activeMembers
      .filter(m => !recentSessionParticipants.has(m.id))
      .slice(0, 4);

    // Annual Churn (Since Hevel HaZog year start - assuming Sept 1st)
    const currentYear = now.getFullYear();
    const yearStart = now.getMonth() >= 8 ? new Date(currentYear, 8, 1) : new Date(currentYear - 1, 8, 1);
    
    // Annual churned: currently inactive AND deactivated since yearStart
    const annualChurned = members.filter(m => {
      if (m.isActive) return false;
      if (!m.deactivatedAt) return true; // Fallback
      const dDate = m.deactivatedAt.toDate ? m.deactivatedAt.toDate() : new Date(m.deactivatedAt);
      return dDate >= yearStart;
    }).length;
    
    // Annual total: currently active OR deactivated since yearStart
    const annualTotal = members.filter(m => {
      if (m.isActive) return true;
      if (!m.deactivatedAt) return true; // Fallback
      const dDate = m.deactivatedAt.toDate ? m.deactivatedAt.toDate() : new Date(m.deactivatedAt);
      return dDate >= yearStart;
    }).length;
    
    console.log("DEBUG: annualChurned:", annualChurned, "annualTotal:", annualTotal);
    
    const annualChurnRate = annualTotal > 0 ? parseFloat(((annualChurned / annualTotal) * 100).toFixed(1)) : 0;

    // Global Retention Algorithm (3+ sessions in 30 days)
    const userAttendanceCount = new Map<string, number>();
    weeklyHistory.forEach(session => {
      const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
      if (sessionDate >= thirtyDaysAgo) {
        (session.participantIds || []).forEach((id: string) => {
          userAttendanceCount.set(id, (userAttendanceCount.get(id) || 0) + 1);
        });
      }
    });

    const retainedUsersCount = activeMembers.filter(m => (userAttendanceCount.get(m.id) || 0) >= 3).length;
    const globalRetentionIndex = activeMembers.length > 0 
      ? Math.round((retainedUsersCount / activeMembers.length) * 100) 
      : 0;

    // 5. Gender Cohorts (for Tachometer copy)
    const genderCohorts = [
      { label: 'גברים', key: 'זכר', color: 'from-blue-400 to-blue-600', hexColor: '#3182CE', glow: 'rgba(49, 130, 206, 0.5)' },
      { label: 'נשים', key: 'נקבה', color: 'from-pink-400 to-pink-600', hexColor: '#D53F8C', glow: 'rgba(213, 63, 140, 0.5)' },
      { label: 'אחר/לא צוין', key: 'אחר', color: 'from-slate-400 to-slate-600', hexColor: '#718096', glow: 'rgba(113, 128, 150, 0.5)' }
    ].map(c => {
      const groupMembers = activeMembers.filter(m => {
        if (c.key === 'אחר') return !m.gender || m.gender === 'מעדיף/ה לא לציין';
        return m.gender === c.key;
      });

      const potentialAttendance = groupMembers.length * sessionCount;
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
      
      const count = genderCounts[c.key as keyof typeof genderCounts] || 0;
      
      return {
        label: c.label,
        value: retention,
        count: count,
        color: c.color,
        hexColor: c.hexColor,
        glow: c.glow,
        isHigh: retention >= 80,
        isLow: retention < 50
      };
    });

    return {
      ageGroups,
      genderCounts,
      femaleRetention,
      overallRetention,
      lowPulseMembers,
      cohorts,
      genderCohorts,
      activeCount: activeMembers.length,
      totalCount: totalMembers,
      globalRetentionIndex,
      churnRate,
      churnedCount,
      annualChurnRate,
      near: nearCount,
      medium: mediumCount,
      far: farCount,
      distanceData
    };
  }, [members, weeklyHistory, siteConfig]);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Activity className="w-12 h-12 text-blue-400 animate-pulse" />
        <p className="text-white/50 font-black uppercase tracking-widest animate-pulse">מנתח דופק קהילה...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative" dir="rtl">
      <div className="relative z-10 space-y-12">
      {/* Unified Header */}
      <div className="hidden">
        <div className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 backdrop-blur-md flex items-center gap-2 shadow-lg">
          <TrendingUp size={12} className="text-blue-400" />
          <span className="text-xs font-black tracking-widest text-blue-100">COMMUNITY PULSE ANALYTICS</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 tracking-tighter leading-none uppercase drop-shadow-2xl">
          מבט על הקהילה
        </h1>

        <p className="max-w-2xl text-xl font-bold text-blue-200/70">
          ניטור בזמן אמת של חיוניות הקהילה והרכב החברים. 📈
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
      {/* Top Row: Age Distribution + Distance Distribution */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Age Distribution Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 relative overflow-hidden group min-h-[550px] flex flex-col items-center justify-center rounded-[3rem]"
          >
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--surfer-cyan)]/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="w-full flex items-center justify-between mb-8 relative z-10 px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl glass-effect flex items-center justify-center text-[var(--surfer-cyan)] shadow-inner border border-white/10">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black glass-text-primary tracking-tight">התפלגות חברים לפי גיל</h3>
                  <p className="glass-text-secondary text-[8px] font-bold uppercase tracking-[0.3em]">Community Aura • Ocean Analytics</p>
                </div>
              </div>
            </div>

            {/* Donut Chart Area */}
            <div className="w-full flex-1 relative flex items-center justify-center min-h-[350px]">
              <svg width="100%" height="100%" viewBox="50 50 900 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible max-w-[400px]">
                <defs>
                  <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  
                  <linearGradient id="neon-turquoise" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4FD1C5" />
                    <stop offset="100%" stopColor="#38B2AC" />
                  </linearGradient>
                  <linearGradient id="neon-magenta" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#63B3ED" />
                    <stop offset="100%" stopColor="#4299E1" />
                  </linearGradient>
                  <linearGradient id="neon-purple" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4299E1" />
                    <stop offset="100%" stopColor="#3182CE" />
                  </linearGradient>
                  <linearGradient id="neon-emerald" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2B6CB0" />
                    <stop offset="100%" stopColor="#2C5282" />
                  </linearGradient>

                  <filter id="glass-reflection" x="0" y="0" width="100%" height="100%">
                    <feGaussianBlur stdDeviation="2" />
                  </filter>
                </defs>

                {/* Donut Ring Segments */}
                {(() => {
                  let currentAngle = -90;
                  const groups = [
                    { label: 'צעירים', key: 'צעירים (18-25)', color: 'url(#neon-turquoise)', glow: '#4FD1C5' },
                    { label: 'בוגרים', key: 'בוגרים (26-40)', color: 'url(#neon-magenta)', glow: '#63B3ED' },
                    { label: 'אמצע חיים', key: 'אמצע החיים (41-60)', color: 'url(#neon-purple)', glow: '#4299E1' },
                    { label: 'ותיקים', key: 'ותיקים (60+)', color: 'url(#neon-emerald)', glow: '#2B6CB0' }
                  ];
                  const total = stats.activeCount || 1;
                  const radius = 280; 
                  const strokeWidth = 85; 
                  const centerX = 500;
                  const centerY = 500;
                  
                  return groups.map((g, i) => {
                    const count = stats.ageGroups[g.key as keyof typeof stats.ageGroups] || 0;
                    if (count === 0) return null;
                    
                    const percentage = count / total;
                    const angleSize = percentage * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angleSize;
                    currentAngle += angleSize;
 
                    const midAngle = startAngle + angleSize / 2;
                    const rad = (midAngle * Math.PI) / 180;
                    
                    // Callout Line Coordinates
                    const lineStartRadius = radius + strokeWidth / 2 + 5;
                    const lineMidRadius = radius + strokeWidth / 2 + 35;
                    
                    const sx = centerX + lineStartRadius * Math.cos(rad);
                    const sy = centerY + lineStartRadius * Math.sin(rad);
                    const mx = centerX + lineMidRadius * Math.cos(rad);
                    const my = centerY + lineMidRadius * Math.sin(rad);
                    const ex = mx + (Math.cos(rad) > 0 ? 30 : -30);
                    const ey = my;

                    const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

                    const largeArcFlag = angleSize > 180 ? 1 : 0;
                    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

                    return (
                      <g key={`group-${i}`}>
                        {/* Glow Layer */}
                        <path
                          d={d}
                          fill="none"
                          stroke={g.glow}
                          strokeWidth={strokeWidth + 4}
                          strokeLinecap="round"
                          opacity="0.2"
                          style={{ filter: 'blur(10px)' }}
                        />
                        {/* Main Segment */}
                        <motion.path
                          d={d}
                          fill="none"
                          stroke={g.color}
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.1 }}
                          className="cursor-pointer hover:brightness-125 transition-all"
                        />

                        {/* Callout Line */}
                        <g>
                          {/* Anchor Dot */}
                          <circle cx={sx} cy={sy} r="2" fill={g.glow} opacity="0.8" />
                          
                          <motion.path
                            d={`M ${sx} ${sy} L ${mx} ${my} L ${ex} ${ey}`}
                            fill="none"
                            stroke={g.glow}
                            strokeWidth="1.5"
                            opacity="0.6"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, delay: 1 + i * 0.1 }}
                          />
                        </g>
                        
                        {/* Percentage Label */}
                        <motion.g
                          initial={{ opacity: 0, x: Math.cos(rad) > 0 ? 10 : -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 1.5 + i * 0.1 }}
                        >
                          <text 
                            x={ex + (Math.cos(rad) > 0 ? 10 : -10)} 
                            y={ey} 
                            textAnchor={Math.cos(rad) > 0 ? "start" : "end"} 
                            dominantBaseline="middle" 
                            fill={g.glow} 
                            className="font-black text-3xl"
                            style={{ filter: `drop-shadow(0 0 8px ${g.glow}66)` }}
                          >
                            {Math.round(percentage * 100)}%
                          </text>
                          <text 
                            x={ex + (Math.cos(rad) > 0 ? 10 : -10)} 
                            y={ey + 28} 
                            textAnchor={Math.cos(rad) > 0 ? "start" : "end"} 
                            dominantBaseline="middle" 
                            fill="#2D3748" 
                            opacity="0.8"
                            className="font-bold text-base uppercase tracking-[0.2em]"
                          >
                            {g.label}
                          </text>
                        </motion.g>
                      </g>
                    );
                  });
                })()}

                {/* Central Core */}
                <g>
                  {/* Light Inner Circle for Contrast */}
                  <circle cx="500" cy="500" r="230" fill="white" fillOpacity="0.9" />
                  
                  {/* Glass Reflection Overlay */}
                  <circle cx="500" cy="500" r="280" fill="url(#glass-gradient)" opacity="0.1" pointerEvents="none" />
                  <defs>
                    <linearGradient id="glass-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="white" />
                      <stop offset="50%" stopColor="transparent" />
                      <stop offset="100%" stopColor="white" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
 
                  <foreignObject x="280" y="280" width="440" height="440">
                    <div className="w-full h-full flex flex-col items-center justify-center text-center">
                      <Waves size={48} className="text-[var(--surfer-cyan)] logo-pulse mb-2" />
                      <span className="glass-text-secondary text-xs font-black uppercase tracking-[0.4em] mb-2">Community Total</span>
                      <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-text-primary text-8xl font-black tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
                      >
                        {stats.activeCount}
                      </motion.span>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-3 h-3 rounded-full bg-[var(--surfer-cyan)] animate-pulse shadow-sm" />
                        <span className="text-xs text-[var(--surfer-cyan)]/60 font-black uppercase tracking-[0.2em]">Active Pulse</span>
                      </div>
                    </div>
                  </foreignObject>
                </g>
              </svg>
            </div>
          </motion.div>

          {/* Distance Distribution Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 flex flex-col min-h-[550px] relative overflow-hidden group rounded-[3rem]"
          >
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
            
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--surfer-cyan)]/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-xl glass-effect flex items-center justify-center text-[var(--surfer-cyan)] shadow-inner border border-white/10">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black glass-text-primary tracking-tight">פיזור גיאוגרפי של החברים</h3>
                <p className="glass-text-secondary text-[8px] font-bold uppercase tracking-[0.3em]">Distance Distribution • Ocean Analytics</p>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distanceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 12, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-effect p-3 rounded-xl border border-white/20 shadow-2xl">
                            <p className="text-xs font-black glass-text-primary mb-1">{payload[0].payload.label} ק"מ</p>
                            <p className="text-lg font-black text-[var(--surfer-cyan)]">{payload[0].value} <span className="text-[12px] opacity-60">חברים</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40}>
                    {stats.distanceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 relative z-10">
              <div className="p-4 rounded-2xl glass-effect border border-white/20 shadow-sm group/stat hover:bg-white/10 transition-all">
                <p className="text-[12px] font-black text-[var(--surfer-cyan)] uppercase tracking-widest mb-1 opacity-70">טווח קרוב (0-20)</p>
                <p className="text-xl font-black glass-text-primary flex items-baseline gap-1">
                  {stats.near}
                  <span className="text-[12px] font-bold opacity-40">חברים</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl glass-effect border border-white/20 shadow-sm group/stat hover:bg-white/10 transition-all">
                <p className="text-[12px] font-black text-[var(--surfer-orange)] uppercase tracking-widest mb-1 opacity-70">טווח איזורי (21-100)</p>
                <p className="text-xl font-black glass-text-primary flex items-baseline gap-1">
                  {stats.medium}
                  <span className="text-[12px] font-bold opacity-40">חברים</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl glass-effect border border-white/20 shadow-sm group/stat hover:bg-white/10 transition-all">
                <p className="text-[12px] font-black text-[var(--surfer-pink)] uppercase tracking-widest mb-1 opacity-70">טווח רחוק (100+)</p>
                <p className="text-xl font-black glass-text-primary flex items-baseline gap-1">
                  {stats.far}
                  <span className="text-[12px] font-bold opacity-40">חברים</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Churn & Retention Card - Moved here per user request */}
        <motion.div 
          whileHover={{ scale: 1.005 }}
          className="glass-panel p-10 rounded-[3rem] transition-all duration-500 relative overflow-hidden group lg:col-span-2"
        >
          {/* Glossy Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          
          <div className="grid grid-cols-1 gap-12">
            
            {/* Low Pulse List */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center text-[var(--surfer-pink)] shadow-inner border border-white/10">
                    <UserMinus size={20} />
                  </div>
                  <h4 className="text-xl font-black glass-text-primary tracking-tight">דופק נמוך (בסיכון נטישה)</h4>
                </div>
                <span className="text-[12px] font-black glass-text-secondary uppercase tracking-widest glass-effect px-4 py-1.5 rounded-full border border-white/10 shadow-sm">
                  לא נראו מעל 30 יום
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {stats.lowPulseMembers.length > 0 ? (
                  stats.lowPulseMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-6 rounded-2xl glass-effect border border-white/10 hover:bg-white/10 transition-all group/item shadow-lg">
                      <div className="flex items-center gap-4">
                        <img 
                          src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}&background=random`} 
                          alt="" 
                          className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-inner object-cover"
                        />
                        <div>
                          <p className="text-base font-black glass-text-primary">{member.firstName} {member.lastName}</p>
                          <p className="text-[12px] font-bold glass-text-secondary italic">פעם אחרונה: {member.joinedAt}</p>
                        </div>
                      </div>
                      <button className="p-3 rounded-xl glass-effect text-white/50 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-white/20 hover:text-white">
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-12 text-center border border-dashed border-white/10 rounded-3xl glass-effect">
                    <p className="glass-text-secondary font-black uppercase tracking-[0.3em] text-sm">כל החברים פעילים בדופק גבוה ✨</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Vitality Retention Card - Tachometer Gauges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-10 rounded-[4rem] transition-all duration-500 relative overflow-hidden group"
        >
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            <div className="flex items-center justify-between mb-12 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl glass-effect flex items-center justify-center text-[var(--surfer-cyan)] shadow-inner border border-white/10">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="glass-text-primary font-black text-2xl md:text-3xl tracking-tighter uppercase">שיעור התמדה לפי קבוצות גיל</h3>
                  <p className="glass-text-secondary text-[12px] tracking-[0.3em] mt-1 font-black uppercase">SESSION VITALITY METRICS-8</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-16 relative z-10">
              {stats.cohorts.map((group: any, idx: number) => {
                const isHigh = group.retention >= 80;
                const isLow = group.retention < 50;
                
                return (
                  <div key={idx} className="flex flex-col items-center relative group/gauge">
                    {/* Gauge Container */}
                    <div className="relative w-full max-w-[280px] mx-auto flex justify-center items-center">
                      <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                        <defs>
                          {/* Inner Dial Gradient */}
                          <radialGradient id={`dial-bg-${idx}`} cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#1A202C" />
                          </radialGradient>

                          {/* Color Band Gradient (Red -> Orange -> Neon Green) - Precise Mapping */}
                          <linearGradient id={`color-band-vitality-${idx}`} x1="35" y1="165" x2="165" y2="165" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="30%" stopColor="#f59e0b" />
                            <stop offset="60%" stopColor="#eab308" />
                            <stop offset="85%" stopColor="#84cc16" />
                            <stop offset="100%" stopColor="#39FF14" />
                          </linearGradient>

                          <radialGradient id={`glass-lens-gauge-${idx}`} cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                            <stop offset="70%" stopColor="white" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                          </radialGradient>

                          <linearGradient id={`glass-shine-gauge-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="white" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                          </linearGradient>

                          <filter id={`glow-${idx}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Dial Background */}
                        <circle cx="100" cy="100" r="92" fill={`url(#dial-bg-${idx})`} stroke="white" strokeOpacity="0.1" strokeWidth="1" />

                        {/* Colored Edge Band (270 degrees) */}
                        <path 
                          d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                          fill="none" 
                          stroke={`url(#color-band-vitality-${idx})`} 
                          strokeWidth="10" 
                          strokeLinecap="butt" 
                          opacity="0.8"
                        />

                        {/* Tick Marks and Numbers */}
                        {[0, 20, 40, 60, 80, 100].map((val) => {
                          const angle = -45 + (val / 100) * 270;
                          const rad = (angle * Math.PI) / 180;
                          
                          // Tick marks
                          const outerR = 92;
                          const innerR = 82;
                          const x1 = 100 - Math.cos(rad) * outerR;
                          const y1 = 100 - Math.sin(rad) * outerR;
                          const x2 = 100 - Math.cos(rad) * innerR;
                          const y2 = 100 - Math.sin(rad) * innerR;

                          // Numbers
                          const textR = 68;
                          const tx = 100 - Math.cos(rad) * textR;
                          const ty = 100 - Math.sin(rad) * textR;

                          return (
                            <g key={val}>
                              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" opacity="0.3" />
                              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="black" opacity="0.6">
                                {val}%
                              </text>
                            </g>
                          );
                        })}

                        {/* Needle */}
                        <motion.g
                          initial={{ rotate: -135 }}
                          animate={{ rotate: -135 + (group.retention / 100) * 270 }}
                          style={{ 
                            transformOrigin: "100px 100px"
                          }}
                          transition={{ 
                            duration: 2.5, 
                            ease: [0.34, 1.56, 0.64, 1],
                            delay: idx * 0.1 
                          }}
                        >
                          <circle cx="100" cy="100" r="100" fill="none" />
                          <polygon 
                            points="98,100 102,100 100,10" 
                            fill="white"
                            style={{ 
                              filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.4))'
                            }}
                          />
                        </motion.g>
                        
                        {/* Center Pivot */}
                        <circle cx="100" cy="100" r="8" fill="white" />
                        <circle cx="100" cy="100" r="4" fill="#1A202C" />

                        {/* Glassmorphism Overlay - Lens Effect & Shine */}
                        <circle cx="100" cy="100" r="92" fill={`url(#glass-lens-gauge-${idx})`} className="pointer-events-none" opacity="0.8" />
                        <circle cx="100" cy="100" r="92" fill={`url(#glass-shine-gauge-${idx})`} className="pointer-events-none" opacity="0.6" />
                        <circle cx="100" cy="100" r="92" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3" className="pointer-events-none" />
                        
                        {/* Pad Outline for definition */}
                        <circle cx="100" cy="100" r="92" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" className="pointer-events-none" />

                        {/* Digital Percentage Box - Glassmorphism 3D Effect */}
                        <g transform="translate(65, 130)">
                          {/* Outer Bevel / Glass Edge */}
                          <rect 
                            width="70" 
                            height="28" 
                            rx="6" 
                            fill="rgba(255, 255, 255, 0.02)" 
                            stroke="rgba(255, 255, 255, 0.15)" 
                            strokeWidth="1" 
                          />
                          {/* Inner Shadow / Depth */}
                          <rect 
                            x="1" 
                            y="1" 
                            width="68" 
                            height="26" 
                            rx="5" 
                            fill="none" 
                            stroke="rgba(0, 0, 0, 0.2)" 
                            strokeWidth="0.5" 
                          />
                          {/* Top Highlight */}
                          <path 
                            d="M 6 2 L 64 2" 
                            stroke="white" 
                            strokeOpacity="0.15" 
                            strokeWidth="1" 
                            strokeLinecap="round"
                          />
                          <text 
                            x="35" 
                            y="15" 
                            textAnchor="middle" 
                            dominantBaseline="middle" 
                            fill={group.retention >= 80 ? "#39FF14" : group.retention >= 50 ? "#f59e0b" : "#ef4444"} 
                            fontSize="16" 
                            fontWeight="black" 
                            fontFamily="monospace"
                            style={{ 
                              filter: `drop-shadow(0px 0px 3px ${group.retention >= 80 ? "rgba(57, 255, 20, 0.4)" : group.retention >= 50 ? "rgba(245, 158, 11, 0.4)" : "rgba(239, 68, 68, 0.4)"})`,
                              letterSpacing: '-1px'
                            }}
                          >
                            {group.retention}%
                          </text>
                        </g>

                        {/* Label inside gauge */}
                        <text x="100" y="178" textAnchor="middle" dominantBaseline="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="black" fontSize="16" className="antialiased tracking-tighter shadow-sm">
                          {group.label}
                        </text>
                      </svg>
                    </div>
                    
                    {/* Status Labels */}
                    <div className="mt-4 flex flex-col items-center gap-2">
                      {isLow && (
                        <div className="px-4 py-1 rounded-full bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                          <span className="text-[12px] text-red-400 font-black uppercase tracking-widest antialiased">
                            LOW PULSE
                          </span>
                        </div>
                      )}
                      {isHigh && (
                        <div className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                          <span className="text-[12px] text-emerald-400 font-black uppercase tracking-widest antialiased">
                            PEAK FLOW
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Indicators */}
            <div className="mt-16 pt-8 border-t border-white/5 flex justify-between items-center w-full relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-white/30 font-black uppercase tracking-[0.2em]">LOW PULSE (&lt;50%)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-white/30 font-black uppercase tracking-[0.2em]">HIGH RETENTION (&gt;80%)</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              </div>
            </div>
          </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-10 transition-all duration-500 relative overflow-hidden group"
        >
          {/* Glossy Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl glass-effect flex items-center justify-center text-[var(--surfer-pink)] shadow-inner border border-white/10">
                <Heart size={24} />
              </div>
              <div>
                <h3 className="glass-text-primary font-black text-2xl md:text-3xl tracking-tighter uppercase">שיעור התמדה לפי מגדר</h3>
                <p className="glass-text-secondary text-[12px] tracking-[0.3em] mt-1 font-black uppercase">COMMUNITY INSIGHTS • GENDER DYNAMICS</p>
              </div>
            </div>
          </div>

          <div className="flex flex-row flex-nowrap items-center justify-around gap-2 relative z-10 overflow-x-auto">
            {stats.genderCohorts.map((group: any, idx: number) => {
              const isHigh = group.isHigh;
              const isLow = group.isLow;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center relative group/gauge w-full max-w-[350px]">
                  {/* Gauge Container */}
                  <div className="relative w-full flex justify-center items-center backdrop-blur-[12px] rounded-full p-2 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.1)]">
                    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                      <defs>
                        {/* Outer Metallic Ring Gradient */}
                        <linearGradient id={`metal-ring-${idx}`} x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#E2E8F0" />
                          <stop offset="50%" stopColor="#94A3B8" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                        
                        {/* Inner Dial Gradient */}
                        <radialGradient id={`dial-bg-${idx}`} cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </radialGradient>

                        {/* Glossy Highlight */}
                        <radialGradient id={`glass-lens-gender-${idx}`} cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                          <stop offset="70%" stopColor="white" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                        </radialGradient>

                        <linearGradient id={`glass-shine-gender-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                          <stop offset="50%" stopColor="white" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                        </linearGradient>

                        <linearGradient id={`gloss-${idx}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                          <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>

                        {/* Color Band Gradient (Ocean: Dark -> Light) */}
                        <linearGradient id={`color-band-${idx}`} x1="0" y1="200" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#1A365D" />
                          <stop offset="50%" stopColor="#2C5282" />
                          <stop offset="100%" stopColor="#63B3ED" />
                        </linearGradient>
                      </defs>

                      {/* Colored Edge Band (270 degrees) */}
                      <path 
                        d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                        fill="none" 
                        stroke={`url(#color-band-${idx})`} 
                        strokeWidth="12" 
                        strokeLinecap="butt" 
                        style={{ filter: 'drop-shadow(0px 0px 15px rgba(255,255,255,0.3))' }}
                      />

                      {/* Thin Border for Arc */}
                      <path 
                        d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                        fill="none" 
                        stroke="#2D3748" 
                        strokeWidth="0.5" 
                        strokeLinecap="butt" 
                        opacity="0.1"
                      />

                      {/* Glossy Overlay */}
                      <path 
                        d="M 8 100 A 92 92 0 0 1 192 100 C 192 145 145 192 100 192 C 55 192 8 145 8 100 Z" 
                        fill={`url(#gloss-${idx})`} 
                        clipPath={`url(#dial-clip-${idx})`}
                      />
                      <clipPath id={`dial-clip-${idx}`}>
                        <circle cx="100" cy="100" r="92" />
                      </clipPath>

                      {/* Tick Marks and Numbers */}
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => {
                        const angle = -45 + (val / 100) * 270;
                        const rad = (angle * Math.PI) / 180;
                        const isMajor = val % 20 === 0;
                        
                        // Tick marks
                        const outerR = 82;
                        const innerR = isMajor ? 70 : 76;
                        const x1 = 100 - Math.cos(rad) * outerR;
                        const y1 = 100 - Math.sin(rad) * outerR;
                        const x2 = 100 - Math.cos(rad) * innerR;
                        const y2 = 100 - Math.sin(rad) * innerR;

                        // Numbers
                        const textR = 55;
                        const tx = 100 - Math.cos(rad) * textR;
                        const ty = 100 - Math.sin(rad) * textR;

                        return (
                          <g key={val}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4A5568" strokeWidth={isMajor ? 2 : 1} opacity="0.2" />
                            {isMajor && (
                              <g>
                                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#2D3748" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="bold" opacity="0.6">
                                  {val}%
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Classic Needle */}
                      <motion.g
                        initial={{ rotate: -225 }}
                        animate={{ rotate: -225 + (group.value / 100) * 270 }}
                        style={{ 
                          transformOrigin: "100px 100px"
                        }}
                        transition={{ 
                          duration: 2.5, 
                          ease: [0.34, 1.56, 0.64, 1],
                          delay: idx * 0.1 
                        }}
                      >
                        <circle cx="100" cy="100" r="100" fill="none" />
                        <polygon 
                          points="100,98 100,102 180,100" 
                          fill="#2D3748"
                          style={{ 
                            filter: `drop-shadow(0px 2px 4px rgba(0,0,0,0.1))`
                          }}
                        />
                      </motion.g>

                      {/* Center Pivot */}
                      <circle cx="100" cy="100" r="6" fill="#2D3748" />

                      {/* Glassmorphism Overlay - Lens Effect & Shine */}
                      <circle cx="100" cy="100" r="92" fill={`url(#glass-lens-gender-${idx})`} className="pointer-events-none" opacity="0.8" />
                      <circle cx="100" cy="100" r="92" fill={`url(#glass-shine-gender-${idx})`} className="pointer-events-none" opacity="0.6" />
                      <circle cx="100" cy="100" r="92" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3" className="pointer-events-none" />

                      {/* Digital Percentage Box - Glassmorphism 3D Effect */}
                      <g transform="translate(65, 130)">
                        {/* Outer Bevel / Glass Edge */}
                        <rect 
                          width="70" 
                          height="28" 
                          rx="6" 
                          fill="rgba(255, 255, 255, 0.02)" 
                          stroke="rgba(255, 255, 255, 0.15)" 
                          strokeWidth="1" 
                        />
                        {/* Inner Shadow / Depth */}
                        <rect 
                          x="1" 
                          y="1" 
                          width="68" 
                          height="26" 
                          rx="5" 
                          fill="none" 
                          stroke="rgba(0, 0, 0, 0.2)" 
                          strokeWidth="0.5" 
                        />
                        {/* Top Highlight */}
                        <path 
                          d="M 6 2 L 64 2" 
                          stroke="white" 
                          strokeOpacity="0.15" 
                          strokeWidth="1" 
                          strokeLinecap="round"
                        />
                        <text 
                          x="35" 
                          y="15" 
                          textAnchor="middle" 
                          dominantBaseline="middle" 
                          fill="#2D3748" 
                          fontSize="16" 
                          fontWeight="black" 
                          fontFamily="monospace"
                          style={{ 
                            filter: `drop-shadow(0px 0px 2px rgba(0,0,0,0.1))`,
                            letterSpacing: '-1px'
                          }}
                        >
                          {group.value}%
                        </text>
                      </g>

                      {/* Text Elements */}
                      <text x="100" y="178" textAnchor="middle" dominantBaseline="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="black" fontSize="14" className="antialiased">{group.label}</text>
                    </svg>
                  </div>
                  
                  {/* Labels below gauge */}
                  <div className="mt-2 flex flex-col items-center gap-2 h-10">
                    {isLow && (
                      <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-black border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.4)] antialiased">
                        LOW PULSE
                      </span>
                    )}
                    {isHigh && (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.4)] antialiased">
                        PEAK FLOW
                      </span>
                    )}
                    {!isLow && !isHigh && (
                      <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-black border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.4)] antialiased">
                        STABLE FLOW
                      </span>
                    )}
                    <span className="text-[12px] font-black glass-text-primary uppercase tracking-widest mt-1">
                      {group.count} חברים
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Churn Buckets Section - Unified Background */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-10 rounded-[4rem] mt-12 relative overflow-hidden group"
        >
          {/* Glossy Shimmer for the whole container */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-30 pointer-events-none" />
          
          <div className="flex flex-row justify-center gap-16">
            <AstrodeckGauge 
              value={stats.churnRate}
              label="שיעור עזיבה חודשי"
              icon={<UserMinus size={18} />}
              tooltip="אחוז המתאמנים שעזבו את הנבחרת בחודש האחרון."
            />
            <AstrodeckGauge 
              value={stats.annualChurnRate}
              label="שיעור עזיבה שנתי"
              icon={<UserMinus size={18} />}
              tooltip="אחוז המתאמנים שעזבו את הנבחרת בשנה האחרונה."
            />
          </div>
        </motion.div>

      </div>

      </div>
    </div>
  );
};

export const Astrodeck = ({ label, value, icon: Icon, path, external, color }: { 
  label: string; 
  value: string | number; 
  icon: any; 
  path: string; 
  external?: boolean;
  color: string;
}) => {
  return (
    <Link 
      to={path} 
      target={external ? "_blank" : undefined} 
      className="block h-full group"
    >
      <div className="relative w-full aspect-square max-w-[220px] mx-auto flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-2">
        
        {/* SVG Background */}
        <div className="absolute inset-0 w-full h-full">
          <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
            <defs>
              <pattern id="diamond" x="0" y="0" width="30" height="16" patternUnits="userSpaceOnUse">
                <path d="M15 0 L30 8 L15 16 L0 8 Z" fill="#ffffff" stroke="#f0f0f0" strokeWidth="1"/>
                <path d="M15 0 L30 8 L15 8 L0 0 Z" fill="#ffffff"/>
                <path d="M0 8 L15 16 L30 8 L15 8 Z" fill="#f8f8f8"/>
                <path d="M0 8 L15 0 L15 16 Z" fill="#fdfdfd"/>
              </pattern>
              
              <filter id="inner-shadow">
                <feOffset dx="0" dy="0"/>
                <feGaussianBlur stdDeviation="4" result="offset-blur"/>
                <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
                <feFlood floodColor="black" floodOpacity="0.15" result="color"/>
                <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
                <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
              </filter>
            </defs>

            <path d="M 135 38 Q 80 45 40 60 C 30 150 60 250 100 320 C 120 360 160 380 185 380 L 185 330 C 185 300 135 300 135 250 Z" 
                  fill="url(#diamond)" filter="url(#inner-shadow)" stroke="#cbd5e1" strokeWidth="1" />

            <path d="M 145 35 Q 200 20 255 35 L 245 250 C 245 290 155 290 155 250 Z" 
                  fill="url(#diamond)" filter="url(#inner-shadow)" stroke="#cbd5e1" strokeWidth="1" />

            <path d="M 265 38 Q 320 45 360 60 C 370 150 340 250 300 320 C 280 360 240 380 215 380 L 215 330 C 215 300 265 300 265 250 Z" 
                  fill="url(#diamond)" filter="url(#inner-shadow)" stroke="#cbd5e1" strokeWidth="1" />

            <g fill="#d4d4d4" filter="url(#inner-shadow)">
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

            <g transform="translate(60, 65) scale(0.8)">
              <path d="M 20 0 L 35 8 L 35 25 L 20 33 L 5 25 L 5 8 Z" fill="#b80028" stroke="#8a001e" strokeWidth="1" />
              <path d="M 6 27 L 21 35 L 21 52 L 6 60 L -9 52 L -9 35 Z" fill="#d4c12a" stroke="#a3941d" strokeWidth="1" />
              <path d="M 34 27 L 49 35 L 49 52 L 34 60 L 19 52 L 19 35 Z" fill="#e01a22" stroke="#a81118" strokeWidth="1" />
            </g>
          </svg>
        </div>

        {/* Content overlay - now transparent */}
        <div className="relative z-10 flex flex-col items-center justify-center p-4">
          <Icon size={32} className={`mb-1 ${color}`} />
          <p className="text-4xl font-black text-slate-900 mb-0 leading-none drop-shadow-sm">{value}</p>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 mt-1 drop-shadow-sm">{label}</p>
        </div>
        
      </div>
    </Link>
  );
};

export default CommunityAnalytics;
