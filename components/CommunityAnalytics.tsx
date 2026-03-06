import React, { useMemo, useState } from 'react';
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
            className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl relative overflow-hidden group min-h-[450px] flex flex-col items-center justify-center"
          >
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="w-full flex items-center justify-between mb-8 relative z-10 px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-inner border border-white/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">התפלגות חברים לפי גיל</h3>
                  <p className="text-white/40 text-[8px] font-bold uppercase tracking-[0.3em]">Community Aura • Ocean Analytics</p>
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
                      <Waves size={48} className="text-[#2D3748] logo-pulse mb-2" />
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
            className="bg-[#2D3748] p-10 rounded-[4rem] border border-white/10 shadow-2xl transition-all duration-500 relative overflow-hidden group"
          >
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            <div className="flex items-center justify-between mb-12 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/80 shadow-inner">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black text-2xl md:text-3xl tracking-tighter uppercase">שיעור התמדה לפי קבוצות גיל</h3>
                  <p className="text-white/40 text-[10px] tracking-[0.3em] mt-1 font-black uppercase">SESSION VITALITY METRICS-8</p>
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

                          {/* Color Band Gradient (Red -> Yellow -> Green) */}
                          <linearGradient id={`color-band-vitality-${idx}`} x1="0" y1="1" x2="1" y2="0">
                            <stop offset="0%" stopColor="#FF4D00" />
                            <stop offset="50%" stopColor="#FFD700" />
                            <stop offset="100%" stopColor="#00FF00" />
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
                          initial={{ rotate: -45 }}
                          animate={{ rotate: -45 + (group.retention / 100) * 270 }}
                          transition={{ 
                            duration: 2.5, 
                            ease: [0.34, 1.56, 0.64, 1],
                            delay: idx * 0.1 
                          }}
                        >
                          <polygon 
                            points="100,98 100,102 25,100" 
                            fill="white" 
                            style={{ filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.4))' }}
                          />
                        </motion.g>

                        {/* Center Pivot */}
                        <circle cx="100" cy="100" r="8" fill="white" />
                        <circle cx="100" cy="100" r="4" fill="#1A202C" />

                        {/* Label inside gauge */}
                        <text x="100" y="170" textAnchor="middle" dominantBaseline="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="black" fontSize="14" className="antialiased tracking-tighter">
                          {group.label}
                        </text>
                      </svg>
                    </div>
                    
                    {/* Status Labels */}
                    <div className="mt-4 flex flex-col items-center gap-2">
                      {isLow && (
                        <div className="px-4 py-1 rounded-full bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                          <span className="text-[10px] text-red-400 font-black uppercase tracking-widest antialiased">
                            LOW PULSE
                          </span>
                        </div>
                      )}
                      {isHigh && (
                        <div className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest antialiased">
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
                <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">LOW PULSE (&lt;50%)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">HIGH RETENTION (&gt;80%)</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white/10 backdrop-blur-xl p-10 rounded-2xl border border-white/20 shadow-2xl transition-all duration-500 relative overflow-hidden group"
        >
          {/* Glossy Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/80 shadow-inner">
                <Heart size={24} />
              </div>
              <div>
                <h3 className="text-white font-black text-2xl md:text-3xl tracking-tighter uppercase">שיעור התמדה לפי מגדר</h3>
                <p className="text-white/40 text-[10px] tracking-[0.3em] mt-1 font-black uppercase">COMMUNITY INSIGHTS • GENDER DYNAMICS</p>
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
          whileHover={{ scale: 1.005 }}
          className="bg-white/10 backdrop-blur-xl p-10 rounded-2xl border border-white/20 shadow-2xl transition-all duration-500 relative overflow-hidden group lg:col-span-2"
        >
          {/* Glossy Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          
          <div className="grid grid-cols-1 gap-12">
            
            {/* Low Pulse List */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                    <UserMinus size={20} />
                  </div>
                  <h4 className="text-xl font-black text-white">דופק נמוך (בסיכון נטישה)</h4>
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
                  לא נראו מעל 30 יום
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {stats.lowPulseMembers.length > 0 ? (
                  stats.lowPulseMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/item shadow-lg">
                      <div className="flex items-center gap-4">
                        <img 
                          src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}&background=random`} 
                          alt="" 
                          className="w-12 h-12 rounded-full border-2 border-white/20 shadow-inner"
                        />
                        <div>
                          <p className="text-base font-black text-white">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] font-bold text-white/40 italic">פעם אחרונה: {member.joinedAt}</p>
                        </div>
                      </div>
                      <button className="p-3 rounded-xl bg-white/10 text-white/50 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-white/20 hover:text-white">
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                    <p className="text-white/30 font-black uppercase tracking-[0.3em] text-sm">כל החברים פעילים בדופק גבוה ✨</p>
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

const Astrodeck = () => {
  const [padColor, setPadColor] = useState('#ffffff');
  const [transform, setTransform] = useState('rotateY(0deg) rotateX(0deg)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
    setTransform(`rotateY(${xAxis}deg) rotateX(${yAxis}deg)`);
  };

  const handleMouseLeave = () => {
    setTransform('rotateY(0deg) rotateX(0deg)');
  };

  return (
    <div className="flex flex-col justify-center items-center p-8 bg-[#e8e8e8] rounded-[4rem] mt-12 overflow-hidden relative" style={{ perspective: '1000px', minHeight: '600px' }}>
      <div className="mb-8 bg-white px-6 py-4 rounded-full shadow-md flex gap-4 z-10 items-center">
        <span className="font-bold text-sm">בחר צבע:</span>
        <button className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer hover:scale-125 transition-transform" style={{ background: 'white' }} onClick={() => setPadColor('#ffffff')} />
        <button className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer hover:scale-125 transition-transform" style={{ background: '#222' }} onClick={() => setPadColor('#222222')} />
        <button className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer hover:scale-125 transition-transform" style={{ background: '#0047ab' }} onClick={() => setPadColor('#0047ab')} />
        <button className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer hover:scale-125 transition-transform" style={{ background: '#e67e22' }} onClick={() => setPadColor('#e67e22')} />
      </div>

      <div 
        className="flex gap-3 transition-transform duration-100 ease-out" 
        style={{ transformStyle: 'preserve-3d', transform }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <style>{`
          .pad-piece {
            position: relative;
            background-color: ${padColor};
            background-image: 
              linear-gradient(135deg, rgba(0,0,0,0.08) 25%, transparent 25%), 
              linear-gradient(225deg, rgba(0,0,0,0.08) 25%, transparent 25%), 
              linear-gradient(45deg, rgba(0,0,0,0.08) 25%, transparent 25%), 
              linear-gradient(315deg, rgba(0,0,0,0.08) 25%, transparent 25%);
            background-position: 8px 0, 8px 0, 0 0, 0 0;
            background-size: 16px 16px;
            box-shadow: 5px 15px 35px rgba(0,0,0,0.1);
            transition: background-color 0.4s;
          }
          .hex {
            width: 26px; height: 15px; background: #d11234; position: relative;
          }
          .hex::before { content: ""; position: absolute; bottom: 100%; border-bottom: 7.5px solid #d11234; border-left: 13px solid transparent; border-right: 13px solid transparent; }
          .hex::after { content: ""; position: absolute; top: 100%; border-top: 7.5px solid #d11234; border-left: 13px solid transparent; border-right: 13px solid transparent; }
          .hex.yellow { background: #f8cc36; }
          .hex.yellow::before { border-bottom-color: #f8cc36; }
          .hex.yellow::after { border-top-color: #f8cc36; }
        `}</style>
        
        <div className="pad-piece w-[120px] h-[450px]" style={{ borderRadius: '10px 40px 15px 60px' }}>
          <div className="absolute top-10 left-8 scale-80">
            <div className="flex gap-1 justify-center mb-0.5"><div className="hex"></div></div>
            <div className="flex gap-1 justify-center mb-0.5"><div className="hex"></div><div className="hex yellow"></div></div>
          </div>
        </div>

        <div className="pad-piece w-[150px] h-[480px] -mt-[15px] flex flex-col items-center" style={{ borderRadius: '15px 15px 80px 80px' }}>
          <div className="mt-[100px] w-[60%] flex flex-col gap-2.5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-3 bg-black/5 rounded shadow-[inset_1px_2px_4px_rgba(0,0,0,0.2)] w-full"></div>
            ))}
          </div>
        </div>

        <div className="pad-piece w-[120px] h-[450px]" style={{ borderRadius: '40px 10px 60px 15px' }}></div>
      </div>
    </div>
  );
};

const ChurnBucket: React.FC<{ title: string; percentage: number }> = ({ title, percentage }) => {
  const isAnnual = title.includes('שנתי');
  
  // Surfboard specs based on user request - Rusty Moby Fish / SD
  const boardSpecs = {
    brand: "Rusty",
    model: "Moby Fish / SD",
    length: "6'0",
    volume: 32.5,
    material: "PU/Polyester",
    tailType: "Squash/Swallow",
    color: "White",
    logo: "Black R-Dot",
    hasTractionPad: false
  };

  // Calculate fill color based on percentage (Green -> Yellow -> Red)
  const getFillColor = (p: number) => {
    if (p <= 20) return '#10B981'; // Green for low churn
    if (p <= 50) return '#F59E0B'; // Yellow/Orange for medium churn
    return '#EF4444'; // Red for high churn
  };

  const fillColor = getFillColor(percentage);

  return (
    <div className="flex-1 max-w-[220px] flex flex-col items-center text-center relative group/surfboard">
      <h3 className="text-[#1A365D] font-black text-[11px] mb-8 tracking-tight uppercase opacity-50 mix-blend-multiply -mt-2">
        {title}
      </h3>

      <div className="relative w-32 h-64 mb-4 perspective-1000">
        <motion.div 
          initial={{ rotateY: 0 }}
          whileHover={{ rotateY: 180 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="w-full h-full relative preserve-3d cursor-pointer"
        >
          {/* Front Side - The Surfboard Design */}
          <div className="absolute inset-0 backface-hidden">
            {/* Surfboard Shape */}
            <div className="w-full h-full relative">
              <svg viewBox="0 0 100 300" className="w-full h-full drop-shadow-xl">
                <defs>
                  <linearGradient id={`board-gradient-${isAnnual ? 'annual' : 'monthly'}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f8f9fa" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e9ecef" />
                  </linearGradient>
                  
                  {/* Stringer (Wood strip down the middle) */}
                  <linearGradient id="stringer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d4a373" />
                    <stop offset="50%" stopColor="#faedcd" />
                    <stop offset="100%" stopColor="#d4a373" />
                  </linearGradient>
                </defs>

                {/* Board Body - Fish/Hybrid Shape */}
                <path 
                  d="M50,5 C75,5 95,60 95,150 C95,240 85,290 50,290 C15,290 5,240 5,150 C5,60 25,5 50,5 Z" 
                  fill={`url(#board-gradient-${isAnnual ? 'annual' : 'monthly'})`}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />

                {/* Stringer */}
                <rect x="49" y="5" width="2" height="285" fill="url(#stringer-gradient)" opacity="0.8" />

                {/* Rusty Logo (R-Dot style) */}
                <g transform="translate(50, 80) scale(0.15)">
                  <circle cx="0" cy="0" r="40" fill="#000000" />
                  <text x="0" y="10" textAnchor="middle" fill="white" fontSize="40" fontWeight="bold" fontFamily="Arial">R</text>
                </g>

                {/* Model Name */}
                <text x="50" y="180" textAnchor="middle" fontSize="6" fontFamily="Arial" fill="#cbd5e0" letterSpacing="1" transform="rotate(-90 50 180)">
                  {boardSpecs.model.toUpperCase()}
                </text>

                {/* Dynamic Fill Level (Churn Visualization) */}
                <clipPath id={`board-clip-${isAnnual ? 'annual' : 'monthly'}`}>
                  <path d="M50,5 C75,5 95,60 95,150 C95,240 85,290 50,290 C15,290 5,240 5,150 C5,60 25,5 50,5 Z" />
                </clipPath>
                
                <g clipPath={`url(#board-clip-${isAnnual ? 'annual' : 'monthly'})`}>
                  <motion.rect 
                    initial={{ y: 300 }}
                    animate={{ y: 300 - (percentage * 3) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    x="0" 
                    width="100" 
                    height="300" 
                    fill={fillColor} 
                    opacity="0.3"
                  />
                  {/* Liquid Top Line */}
                  <motion.line 
                    initial={{ y1: 300, y2: 300 }}
                    animate={{ y1: 300 - (percentage * 3), y2: 300 - (percentage * 3) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    x1="0" 
                    x2="100" 
                    stroke={fillColor} 
                    strokeWidth="2" 
                    opacity="0.8"
                  />
                </g>

                {/* Traction Pad (Tail Pad) */}
                {boardSpecs.hasTractionPad && (
                  <g transform="translate(50, 260)" opacity="0.8">
                    <rect x="-15" y="0" width="30" height="20" rx="2" fill="#1a202c" />
                    <rect x="-15" y="0" width="30" height="20" rx="2" fill="url(#stringer-gradient)" opacity="0.2" />
                    {/* Grid texture */}
                    <path d="M-15,5 L15,5 M-15,10 L15,10 M-15,15 L15,15" stroke="white" strokeWidth="0.5" opacity="0.3" />
                    <path d="M-5,0 L-5,20 M5,0 L5,20" stroke="white" strokeWidth="0.5" opacity="0.3" />
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Back Side - Specs & Details */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[3rem] shadow-xl border border-slate-100 p-4 flex flex-col items-center justify-center transform scale-x-[-1]">
            <div className="text-center space-y-2">
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-100 pb-2 mb-2">
                Board Specs
              </h4>
              <div className="space-y-1 text-[9px] font-mono text-slate-500 text-left w-full px-2">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="font-bold text-slate-700">{boardSpecs.model}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dims:</span>
                  <span className="font-bold text-slate-700">{boardSpecs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vol:</span>
                  <span className="font-bold text-slate-700">{boardSpecs.volume}L</span>
                </div>
                <div className="flex justify-between">
                  <span>Tail:</span>
                  <span className="font-bold text-slate-700">{boardSpecs.tailType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Const:</span>
                  <span className="font-bold text-slate-700">PU/Poly</span>
                </div>
              </div>
              
              <div className="mt-4 pt-2 border-t border-slate-100 w-full">
                <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-1">Churn Level</div>
                <div className="text-2xl font-black" style={{ color: fillColor }}>
                  {percentage}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>
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
          <div className="absolute -top-8 -right-3 opacity-0 group-hover/surfboard:opacity-100 transition-opacity duration-500">
             <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityAnalytics;
