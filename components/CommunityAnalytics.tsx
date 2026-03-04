import React, { useMemo, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  MessageSquare,
  Activity,
  UserCheck,
  UserMinus,
  Heart,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { parseDate } from '../src/utils/dateUtils';

const CommunityAnalytics: React.FC = () => {
  const { members, weeklyHistory, isLoading } = useData();

  const stats = useMemo(() => {
    if (!members.length) return null;

    const activeMembers = members.filter(m => m.isActive);
    const totalMembers = members.length;
    
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

    // 3. Churn & Low Pulse
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

    const overallRetention = totalMembers > 0 ? Math.round((activeMembers.length / totalMembers) * 100) : 0;
    const churnedCount = members.filter(m => !m.isActive).length;
    const churnRate = totalMembers > 0 ? Math.round((churnedCount / totalMembers) * 100) : 0;

    // Annual Churn (Since Hevel HaZog year start - assuming Sept 1st)
    const currentYear = now.getFullYear();
    const yearStart = now.getMonth() >= 8 ? new Date(currentYear, 8, 1) : new Date(currentYear - 1, 8, 1);
    
    const annualChurned = members.filter(m => !m.isActive && m.joinedAt && new Date(m.joinedAt) >= yearStart).length;
    const annualTotal = members.filter(m => m.joinedAt && new Date(m.joinedAt) >= yearStart).length;
    const annualChurnRate = annualTotal > 0 ? Math.round((annualChurned / annualTotal) * 100) : 0;

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
      annualChurnRate
    };
  }, [members, weeklyHistory]);

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
          דופק הקהילה: תמונת מצב
        </h1>

        <p className="max-w-2xl text-xl font-bold text-blue-200/70">
          ניטור בזמן אמת של חיוניות הקהילה והרכב החברים. 📈
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Community Aura Card (Replaces Demographics) */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#F5F7FA] p-4 rounded-[3rem] border border-slate-200 shadow-soft relative overflow-hidden group min-h-[350px] flex flex-col items-center justify-center"
          >
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="w-full flex items-center justify-between mb-4 relative z-10 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-sm border border-blue-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#2D3748] tracking-tight">התפלגות חברים לפי גיל</h3>
                  <p className="text-[#4A5568]/60 text-[8px] font-bold uppercase tracking-[0.2em]">Community Aura • Ocean Analytics</p>
                </div>
              </div>
            </div>

            {/* Donut Chart Area */}
            <div className="w-full flex-1 relative flex items-center justify-center min-h-[280px]">
              <svg width="100%" height="100%" viewBox="50 50 900 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible max-w-[420px]">
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
                  const radius = 234; // 180 * 1.3
                  const strokeWidth = 65; // 50 * 1.3
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
                    const lineStartRadius = radius + strokeWidth / 2 + 10;
                    const lineMidRadius = radius + strokeWidth / 2 + 60;
                    
                    const sx = centerX + lineStartRadius * Math.cos(rad);
                    const sy = centerY + lineStartRadius * Math.sin(rad);
                    const mx = centerX + lineMidRadius * Math.cos(rad);
                    const my = centerY + lineMidRadius * Math.sin(rad);
                    const ex = mx + (Math.cos(rad) > 0 ? 40 : -40);
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
                            x={ex + (Math.cos(rad) > 0 ? 12 : -12)} 
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
                            x={ex + (Math.cos(rad) > 0 ? 12 : -12)} 
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
                  <circle cx="500" cy="500" r="182" fill="white" fillOpacity="0.9" />
                  
                  {/* Glass Reflection Overlay */}
                  <circle cx="500" cy="500" r="234" fill="url(#glass-gradient)" opacity="0.1" pointerEvents="none" />
                  <defs>
                    <linearGradient id="glass-gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="white" />
                      <stop offset="50%" stopColor="transparent" />
                      <stop offset="100%" stopColor="white" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
 
                  <foreignObject x="325" y="325" width="350" height="350">
                    <div className="w-full h-full flex flex-col items-center justify-center text-center">
                      <span className="text-[#4A5568]/40 text-xs font-black uppercase tracking-[0.4em] mb-2">Community Total</span>
                      <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[#2D3748] text-8xl font-black tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
                      >
                        {stats.activeCount}
                      </motion.span>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-sm" />
                        <span className="text-xs text-blue-600/60 font-black uppercase tracking-[0.2em]">Active Pulse</span>
                      </div>
                    </div>
                  </foreignObject>
                </g>
              </svg>
            </div>
          </motion.div>

          {/* Vitality Retention Card - Tachometer Gauges */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#F5F7FA] p-10 rounded-[4rem] border border-slate-200 shadow-soft transition-all duration-500 relative overflow-hidden group"
          >
            {/* Global Retention Index Gauge */}
            <div className="mb-16 pb-12 border-b border-slate-200/50 relative z-10 bg-[#FAF9F6] rounded-[3rem] p-8 shadow-inner">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-[#5D4037] tracking-tighter uppercase">Global Retention Index</h3>
                  <div className="flex items-center justify-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-[#D2B48C]/10 border border-[#D2B48C]/20">
                      <span className="text-[10px] font-black text-[#8D6E63] uppercase tracking-widest">מחושב על בסיס כלל חברי הקהילה</span>
                    </div>
                  </div>
                </div>

                <div className="relative w-full max-w-[450px] mx-auto flex justify-center items-center backdrop-blur-[12px] rounded-full p-2 border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.1)]">
                  <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                    <defs>
                      {/* Outer Metallic Ring Gradient - Sand Theme */}
                      <linearGradient id="metal-ring-sand" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#E8E2D9" />
                        <stop offset="50%" stopColor="#D2B48C" />
                        <stop offset="100%" stopColor="#967969" />
                      </linearGradient>
                      
                      {/* Inner Dial Gradient - Sand Theme */}
                      <radialGradient id="dial-bg-sand" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                        <stop offset="0%" stopColor="#5D4037" />
                        <stop offset="100%" stopColor="#2D1B17" />
                      </radialGradient>

                      {/* Glossy Highlight */}
                      <linearGradient id="gloss-sand" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>

                      {/* Color Band Gradient - Sand Theme */}
                      <linearGradient id="color-band-sand" x1="0" y1="200" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#967969" />
                        <stop offset="50%" stopColor="#D2B48C" />
                        <stop offset="100%" stopColor="#E1C16E" />
                      </linearGradient>

                      <filter id="gauge-glow-sand" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Colored Edge Band (270 degrees) */}
                    <path 
                      d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                      fill="none" 
                      stroke="url(#color-band-sand)" 
                      strokeWidth="12" 
                      strokeLinecap="butt" 
                      style={{ filter: 'drop-shadow(0px 0px 15px rgba(225, 193, 110, 0.3))' }}
                    />

                    {/* Glossy Overlay */}
                    <path 
                      d="M 8 100 A 92 92 0 0 1 192 100 C 192 145 145 192 100 192 C 55 192 8 145 8 100 Z" 
                      fill="url(#gloss-sand)" 
                      clipPath="url(#dial-clip-sand)"
                    />
                    <clipPath id="dial-clip-sand">
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
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5D4037" strokeWidth={isMajor ? 2 : 1} opacity="0.2" />
                          {isMajor && (
                            <g>
                              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#5D4037" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="bold" opacity="0.6">
                                {val}%
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Needle */}
                    <motion.g
                      initial={{ rotate: -45 }}
                      animate={{ rotate: -45 + (stats.globalRetentionIndex / 100) * 270 }}
                      transition={{ 
                        duration: 2.5, 
                        ease: [0.34, 1.56, 0.64, 1]
                      }}
                    >
                      <circle cx="100" cy="100" r="90" fill="transparent" stroke="none" />
                      {/* Dark Needle */}
                      <polygon 
                        points="100,96 100,104 15,100" 
                        fill="#5D4037" 
                        style={{ filter: `drop-shadow(0px 2px 4px rgba(0,0,0,0.1))` }}
                      />
                    </motion.g>

                    {/* Center Pivot */}
                    <circle cx="100" cy="100" r="12" fill="#5D4037" />

                    {/* Value Text */}
                    <text x="100" y="175" textAnchor="middle" className="text-4xl font-black fill-[#5D4037] antialiased">
                      {stats.globalRetentionIndex}%
                    </text>
                  </svg>
                </div>

                <div className="max-w-md mx-auto p-6 rounded-3xl bg-white/60 border border-[#D2B48C]/20 shadow-sm">
                  <p className="text-[11px] font-bold text-[#5D4037]/80 leading-relaxed italic">
                    "שיעור התמדה גלובלי מחושב על בסיס כלל חברי הקהילה כקבוצה אחת אחידה. המדד משקף את אחוז המשתמשים שהפגינו נוכחות עקבית (3+ מפגשים) ב-30 הימים האחרונים."
                  </p>
                  <div className="mt-4 pt-4 border-t border-[#D2B48C]/20 flex justify-center">
                    <code className="text-[10px] font-mono text-[#8D6E63] bg-[#FAF9F6] px-3 py-1 rounded-lg">
                      Global Retention = (Total Retained Users / Total Community Members) × 100
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-12 relative z-10">
              <div>
                <h3 className="text-[#2D3748] font-black text-xl md:text-2xl tracking-tighter uppercase whitespace-nowrap">שיעור התמדה לפי קבוצות גיל</h3>
                <p className="text-[#4A5568]/40 text-[10px] tracking-[0.2em] mt-1 font-bold uppercase">8-Session Vitality Metrics</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                  <Activity size={20} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-12 relative z-10">
              {stats.cohorts.map((group: any, idx: number) => {
                const isHigh = group.retention >= 80;
                const isLow = group.retention < 50;
                
                return (
                  <div key={idx} className="flex flex-col items-center relative group/gauge">
                    {/* Gauge Container */}
                    <div className="relative w-full max-w-[400px] mx-auto flex justify-center items-center backdrop-blur-[12px] rounded-full p-2 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
                      <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                        <defs>
                          {/* Outer Metallic Ring Gradient */}
                          <linearGradient id="metal-ring" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#E2E8F0" />
                            <stop offset="50%" stopColor="#94A3B8" />
                            <stop offset="100%" stopColor="#475569" />
                          </linearGradient>
                          
                          {/* Inner Dial Gradient */}
                          <radialGradient id="dial-bg" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#0F172A" />
                          </radialGradient>

                          {/* Glossy Highlight */}
                          <linearGradient id="gloss" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                          </linearGradient>

                          {/* Color Band Gradient (Ocean: Dark -> Light) */}
                          <linearGradient id="color-band" x1="0" y1="200" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#1A365D" />
                            <stop offset="50%" stopColor="#2C5282" />
                            <stop offset="100%" stopColor="#63B3ED" />
                          </linearGradient>

                          {/* Glass Refraction Filter */}
                          <filter id="glass-refraction" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Colored Edge Band (270 degrees) */}
                        <path 
                          d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                          fill="none" 
                          stroke="url(#color-band)" 
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
                          fill="url(#gloss)" 
                          clipPath="url(#dial-clip)"
                        />
                        <clipPath id="dial-clip">
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
                          initial={{ rotate: -45 }}
                          animate={{ rotate: -45 + (group.retention / 100) * 270 }}
                          transition={{ 
                            duration: 2.5, 
                            ease: [0.34, 1.56, 0.64, 1],
                            delay: idx * 0.1 
                          }}
                        >
                          <circle cx="100" cy="100" r="90" fill="transparent" stroke="none" />
                          {/* Dark Needle */}
                          <polygon 
                            points="100,96 100,104 15,100" 
                            fill="#2D3748" 
                            style={{ filter: `drop-shadow(0px 2px 4px rgba(0,0,0,0.1))` }}
                          />
                        </motion.g>

                        {/* Center Pivot */}
                        <circle cx="100" cy="100" r="12" fill="#2D3748" />

                        {/* Text Elements */}
                        <text x="100" y="155" textAnchor="middle" dominantBaseline="middle" fill="#2D3748" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" className="antialiased">{group.label}</text>
                      </svg>
                    </div>
                    
                    {/* Labels below gauge */}
                    <div className="mt-2 flex flex-col items-center gap-2 h-6">
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
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Indicators */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center w-full relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />
                <span className="text-[9px] text-[#4A5568]/60 font-black uppercase tracking-widest">High Retention (&gt;80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-sm animate-pulse" />
                <span className="text-[9px] text-[#4A5568]/60 font-black uppercase tracking-widest">Low Pulse (&lt;50%)</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-[#F5F7FA] p-8 rounded-[4rem] border border-slate-200 shadow-soft transition-all duration-500 relative overflow-hidden group"
        >
          {/* Glossy Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-[#2D3748] font-black text-xl md:text-2xl tracking-tighter uppercase whitespace-nowrap">שיעור התמדה לפי מגדר</h3>
              <p className="text-[#4A5568]/40 text-[10px] tracking-[0.2em] mt-1 font-bold uppercase">COMMUNITY INSIGHTS • GENDER DYNAMICS</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <Heart size={20} />
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
                        initial={{ rotate: -45 }}
                        animate={{ rotate: -45 + (group.value / 100) * 270 }}
                        transition={{ 
                          duration: 2.5, 
                          ease: [0.34, 1.56, 0.64, 1],
                          delay: idx * 0.1 
                        }}
                      >
                        <circle cx="100" cy="100" r="90" fill="transparent" stroke="none" />
                        {/* Dark Needle */}
                        <polygon 
                          points="100,96 100,104 15,100" 
                          fill="#2D3748" 
                          style={{ filter: `drop-shadow(0px 2px 4px rgba(0,0,0,0.1))` }}
                        />
                      </motion.g>

                      {/* Center Pivot */}
                      <circle cx="100" cy="100" r="12" fill="#2D3748" />

                      {/* Text Elements */}
                      <text x="100" y="155" textAnchor="middle" dominantBaseline="middle" fill="#2D3748" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" className="antialiased">{group.label}</text>
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
                    <span className="text-[10px] font-black text-[#2D3748] uppercase tracking-widest mt-1">
                      {group.count} חברים
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Churn & Retention Card */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="bg-[#F5F7FA] p-10 rounded-[4rem] border border-slate-200 shadow-soft transition-all duration-500 relative overflow-hidden group lg:col-span-2"
        >
          {/* Glossy Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="grid grid-cols-1 gap-12">
            
            {/* Low Pulse List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <UserMinus size={18} />
                  </div>
                  <h4 className="text-lg font-black text-[#2D3748]">דופק נמוך (בסיכון נטישה)</h4>
                </div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  לא נראו מעל 30 יום
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.lowPulseMembers.length > 0 ? (
                  stats.lowPulseMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/60 border border-slate-200 hover:bg-white transition-all group/item shadow-sm">
                      <div className="flex items-center gap-3">
                        <img 
                          src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}&background=random`} 
                          alt="" 
                          className="w-10 h-10 rounded-full border border-slate-200"
                        />
                        <div>
                          <p className="text-sm font-black text-[#2D3748]">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] font-bold text-[#4A5568]/60 italic">פעם אחרונה: {member.joinedAt}</p>
                        </div>
                      </div>
                      <button className="p-2 rounded-xl bg-slate-100 text-[#2D3748]/50 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-slate-200 hover:text-[#2D3748]">
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-8 text-center border border-dashed border-slate-200 rounded-3xl">
                    <p className="text-[#4A5568]/60 font-black uppercase tracking-widest text-sm">כל החברים פעילים בדופק גבוה ✨</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Churn Buckets Section - Unified Background */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gradient-to-br from-slate-100 to-slate-200 p-10 rounded-[4rem] border border-slate-300 shadow-xl mt-12 relative overflow-hidden group"
        >
          {/* Glossy Shimmer for the whole container */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-30 pointer-events-none" />
          
          <div className="flex flex-row justify-center gap-16">
            <ChurnBucket title="שיעור עזיבה חודשי" percentage={stats.churnRate} />
            <ChurnBucket title="שיעור עזיבה שנתי" percentage={stats.annualChurnRate} />
          </div>
        </motion.div>

      </div>

      </div>
    </div>
  );
};

const ChurnBucket: React.FC<{ title: string; percentage: number }> = ({ title, percentage }) => {
  const isAnnual = title.includes('שנתי');
  const label = isAnnual ? 'שנתי' : 'חודשי';

  return (
    <div className="flex-1 max-w-[220px] flex flex-col items-center text-center relative group/bucket">
      <h3 className="text-[#1A365D] font-black text-[11px] mb-8 tracking-tight uppercase opacity-50 mix-blend-multiply -mt-2">
        {title}
      </h3>

      <div className="relative w-24 h-32 mb-4">
        {/* Industrial Bucket Handle */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-10 border-[4px] border-slate-400 border-b-0 rounded-t-[3rem] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
          {/* Welding Mark Left */}
          <div className="absolute bottom-0 -left-1.5 w-3 h-3 rounded-full bg-slate-500/30 blur-[1px]" />
          {/* Welding Mark Right */}
          <div className="absolute bottom-0 -right-1.5 w-3 h-3 rounded-full bg-slate-500/30 blur-[1px]" />
        </div>
        
        {/* Bucket Body - Brushed Metal Render */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-x border-slate-500/30 border-b border-slate-500/50 rounded-b-[1.5rem] overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.2),inset_0_-8px_15px_rgba(0,0,0,0.1)] z-10">
          
          {/* Etched Scale (0-100) */}
          <div className="absolute left-1.5 top-0 bottom-0 flex flex-col justify-between py-2 opacity-30 pointer-events-none">
            {[100, 75, 50, 25, 0].map(n => (
              <span key={n} className="text-[7px] font-mono font-bold text-[#2B2B2E] leading-none">{n}</span>
            ))}
          </div>

          {/* Etched Label into Metal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span 
              className="text-xl font-black text-slate-600/40 uppercase tracking-widest rotate-[-15deg]"
              style={{ 
                textShadow: '-1px -1px 1px rgba(255,255,255,0.5), 1px 1px 1px rgba(0,0,0,0.2)',
              }}
            >
              {label}
            </span>
          </div>

          {/* Turbulent Water */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${percentage}%` }}
            transition={{ duration: 2, ease: "circOut" }}
            className="absolute bottom-0 left-0 w-full bg-gradient-to-b from-blue-500/90 via-blue-600/80 to-blue-800/90 z-10"
          >
            {/* Surface Waves & Reflections */}
            <div className="absolute -top-1.5 left-0 w-full h-3 overflow-hidden">
              <motion.div 
                animate={{ x: [-15, 0, -15] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-[120%] h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.4),transparent)] blur-[1.5px]" 
              />
              <div className="absolute top-0 left-0 w-full h-0.5 bg-white/30 blur-[0.5px]" />
            </div>

            {/* Internal Reflections on Metal Walls */}
            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-pulse" />
            
            {/* Dynamic Bubbles/Turbulence */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '-20%', opacity: [0, 0.5, 0] }}
                  transition={{ 
                    duration: 2 + Math.random() * 2, 
                    repeat: Infinity, 
                    delay: Math.random() * 2,
                    ease: "linear"
                  }}
                  className="absolute w-0.5 h-0.5 bg-white/40 rounded-full"
                  style={{ left: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </motion.div>

          {/* Brushed Metal Texture Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.1)_3px)]" />
        </div>
      </div>

      <div className="relative z-20 mt-1">
        <div className="relative inline-block">
          <span 
            className="text-4xl font-black text-[#2B2B2E] tracking-tighter"
            style={{ 
              textShadow: '0 3px 6px rgba(0,0,0,0.1)',
            }}
          >
            {percentage}%
          </span>
          <div className="absolute -top-8 -right-3 opacity-0 group-hover/bucket:opacity-100 transition-opacity duration-500">
             <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityAnalytics;
