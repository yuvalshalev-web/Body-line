
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { safeLocalStorage } from '../../utils/storage';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ReferenceArea,
  ReferenceLine,
  ComposedChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../contexts/DataContext';
import { 
  Activity, 
  LayoutGrid, 
  Maximize2, 
  TrendingUp, 
  Heart,
  Users,
  MessageSquare,
  UserCheck,
  UserMinus,
  Sparkles,
  Waves
} from 'lucide-react';
import { getOperationalXAxisProps } from '../../utils/chartHelpers';
import OperationalChartHeader from '../OperationalChartHeader';
import { calculateDistance } from '../../utils/distanceCalculator';
import { getCoordinates } from '../../utils/geocoding';
import { calculateAge, parseDate, formatDate } from '../../utils/dateUtils';

const getTachometerColor = (percentage: number) => {
  const stops = [
    { p: 0, h: 3, s: 80, l: 50 },
    { p: 25, h: 26, s: 90, l: 53 },
    { p: 50, h: 44, s: 91, l: 52 },
    { p: 75, h: 74, s: 71, l: 46 },
    { p: 100, h: 95, s: 56, l: 44 }
  ];

  if (percentage <= 0) return `hsl(${stops[0].h}, ${stops[0].s}%, ${stops[0].l}%)`;
  if (percentage >= 100) return `hsl(${stops[4].h}, ${stops[4].s}%, ${stops[4].l}%)`;

  let lower = stops[0];
  let upper = stops[1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (percentage >= stops[i].p && percentage <= stops[i+1].p) {
      lower = stops[i];
      upper = stops[i+1];
      break;
    }
  }

  const range = upper.p - lower.p;
  const factor = (percentage - lower.p) / range;

  const h = Math.round(lower.h + (upper.h - lower.h) * factor);
  const s = Math.round(lower.s + (upper.s - lower.s) * factor);
  const l = Math.round(lower.l + (upper.l - lower.l) * factor);

  return `hsl(${h}, ${s}%, ${l}%)`;
};

const TrendsDashboard: React.FC = () => {
  const { members, weeklyHistory, yearConfig, siteAssets, siteConfig } = useData();

  const RETENTION_THRESHOLDS = {
    TOURIST: 50,
    ECONOMY: 70,
    BUSINESS: 90,
  };

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
      const age = calculateAge(m.birthday || (m as any).birthDate);
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
      const age = calculateAge(m.birthday || (m as any).birthDate);
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

      // Calculate Yearly Retention (Based on Operational Year)
      const opStartDate = parseDate(yearConfig?.startDate) || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      const opEndDate = parseDate(yearConfig?.endDate) || new Date();
      
      const yearlySessions = weeklyHistory.filter(session => {
        const sessionDate = parseDate(session.date);
        return sessionDate && sessionDate >= opStartDate && sessionDate <= opEndDate;
      });

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

      // Pulse logic: Retention < 60% in the last 2 sessions
      const last2Sessions = last8Sessions.slice(0, 2);
      const potentialAttendanceLast2 = last2Sessions.reduce((sum, session) => {
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
        yearlyRetention,
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
    
    // Calculate overall 8-week retention
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

    // Calculate overall yearly retention
    const opStartDate = parseDate(yearConfig?.startDate) || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const opEndDate = parseDate(yearConfig?.endDate) || new Date();
    
    const yearlySessions = weeklyHistory.filter(session => {
      const sessionDate = parseDate(session.date);
      return sessionDate && sessionDate >= opStartDate && sessionDate <= opEndDate;
    });

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

    const churnedCount = members.filter(m => m.isActive === false).length;

    // 3. Churn & Low Pulse
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Members who were active at the start of the month (or joined during the month)
    const activeAtStartOfMonth = members.filter(m => {
      if (m.isActive) return true;
      if (!m.deactivatedAt) return true; // Fallback for members suspended before tracking
      const dDate = parseDate(m.deactivatedAt);
      return dDate && dDate >= startOfCurrentMonth;
    });
    
    // Members who are currently inactive AND were deactivated THIS month
    const churnedThisMonth = members.filter(m => {
      if (m.isActive) return false;
      if (!m.deactivatedAt) return true; // Fallback
      const dDate = parseDate(m.deactivatedAt);
      return dDate && dDate >= startOfCurrentMonth;
    });
    
    const churnRate = activeAtStartOfMonth.length > 0 
      ? parseFloat(((churnedThisMonth.length / activeAtStartOfMonth.length) * 100).toFixed(1)) 
      : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessionParticipants = new Set<string>();
    weeklyHistory.forEach(session => {
      const sessionDate = parseDate(session.date);
      if (sessionDate && sessionDate >= thirtyDaysAgo) {
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
      const dDate = parseDate(m.deactivatedAt);
      return dDate && dDate >= yearStart;
    }).length;
    
    // Annual total: currently active OR deactivated since yearStart
    const annualTotal = members.filter(m => {
      if (m.isActive) return true;
      if (!m.deactivatedAt) return true; // Fallback
      const dDate = parseDate(m.deactivatedAt);
      return dDate && dDate >= yearStart;
    }).length;
    
    const annualChurnRate = annualTotal > 0 ? parseFloat(((annualChurned / annualTotal) * 100).toFixed(1)) : 0;

    // Global Retention Algorithm (3+ sessions in 30 days)
    const userAttendanceCount = new Map<string, number>();
    weeklyHistory.forEach(session => {
      const sessionDate = parseDate(session.date);
      if (sessionDate && sessionDate >= thirtyDaysAgo) {
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
      
      // Calculate Yearly Retention (Based on Operational Year)
      const opStartDate = parseDate(yearConfig?.startDate) || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      const opEndDate = parseDate(yearConfig?.endDate) || new Date();
      
      const yearlySessions = weeklyHistory.filter(session => {
        const sessionDate = parseDate(session.date);
        return sessionDate && sessionDate >= opStartDate && sessionDate <= opEndDate;
      });

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
      overallYearlyRetention,
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

  if (!stats) return null;

  const [viewMode, setViewMode] = useState<'unified' | 'split'>(() => {
    const saved = safeLocalStorage.getItem('trendsViewMode');
    return (saved as any) || 'unified';
  });
  const [ageGroupViewMode, setAgeGroupViewMode] = useState<'cards' | 'unified'>('cards');
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!members || members.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = 182; // רדיוס הטבעת החיצונית (הוגדל ב-30% מ-140)

    // Home Break Coords with defaults if missing
    const homeLat = siteConfig.home_break?.lat || 32.1624;
    const homeLng = siteConfig.home_break?.lng || 34.8447;

    // Load Logo
    const logoImg = new Image();
    logoImg.src = 'https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/site_assets%2FextraLogo_1771271649909?alt=media';

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. ציור הטבעות (המרחקים)
      const rings = [
          { r: maxRadius, color: '#f1f3f5', label: '20+ ק"מ' }, // חיצונית
          { r: maxRadius * 0.7, color: '#dee2e6', label: '10 ק"מ' },
          { r: maxRadius * 0.4, color: '#ced4da', label: '5 ק"מ' },
          { r: maxRadius * 0.15, color: 'transparent', label: 'Local' } // בולזאיי - שקוף כי נשים לוגו
      ];

      rings.forEach(ring => {
          ctx.beginPath();
          ctx.arc(centerX, centerY, ring.r, 0, Math.PI * 2);
          ctx.fillStyle = ring.color;
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.stroke();
      });

      // Draw Logo
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = 40;
        // Center the logo in the middle of the radar
        const newX = centerX;
        const newY = centerY;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(newX, newY, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        try {
          ctx.drawImage(logoImg, newX - logoSize / 2, newY - logoSize / 2, logoSize, logoSize);
        } catch (e) {
          console.warn("Failed to draw logo image:", e);
          // Fallback blue dot if drawImage fails
          ctx.beginPath();
          ctx.arc(newX, newY, logoSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = '#007bff';
          ctx.fill();
        }
        ctx.restore();
        
        // Logo border
        ctx.beginPath();
        ctx.arc(newX, newY, logoSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Fallback blue dot if logo not loaded
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#007bff';
        ctx.fill();
      }

      // 2. ציור חברי הקהילה כנקודות
      const membersWithCanvasPos = members.map((member, index) => {
          let distance = 0;
          const coords = getCoordinates(member.city, member.lat, member.lng);
          
          if (homeLat && homeLng && coords) {
            distance = calculateDistance(homeLat, homeLng, coords[0], coords[1]);
          } else {
            // No real address or city data
            distance = member.distance || 0;
          }
          
          const distanceLimit = 30;
          let relativeRadius = (distance / distanceLimit) * maxRadius;
          
          // Ensure points are outside the logo area but inside the board
          const minRadius = 25; 
          if (relativeRadius < minRadius) relativeRadius = minRadius + (Math.random() * 5);
          if (relativeRadius > maxRadius) relativeRadius = maxRadius - 5;

          // זווית רנדומלית כדי שהנקודות לא יהיו אחת על השניה
          const angle = (index * 137.5) * (Math.PI / 180); 

          const x = centerX + relativeRadius * Math.cos(angle);
          const y = centerY + relativeRadius * Math.sin(angle);

          // הוספת אנימציית "Pop" למשתמש האחרון
          let radius = 5;
          if (index === members.length - 1) {
            radius = 8; // הגדלה זמנית
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#00fbff";
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          
          ctx.fillStyle = '#ff3e00'; // צבע הנקודה
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();

          return { ...member, canvasX: x, canvasY: y, calculatedDistance: distance };
      });

      // 3. הוספת אינטראקציה (נגיעה/עכבר)
      const handleMouseMove = (e: MouseEvent) => {
          const mouseX = e.offsetX;
          const mouseY = e.offsetY;
          const tooltip = tooltipRef.current;
          
          if (!tooltip) return;

          // Get visual coordinates relative to the container for the tooltip
          const containerRect = canvas.parentElement?.getBoundingClientRect();
          const visualX = containerRect ? e.clientX - containerRect.left : e.offsetX;
          const visualY = containerRect ? e.clientY - containerRect.top : e.offsetY;

          let found = false;
          membersWithCanvasPos.forEach(m => {
              const dist = Math.sqrt((mouseX - m.canvasX)**2 + (mouseY - m.canvasY)**2);
              if (dist < 7) {
                  tooltip.style.display = 'block';
                  tooltip.style.left = visualX + 10 + 'px';
                  tooltip.style.top = visualY + 10 + 'px';
                  tooltip.style.padding = '8px';
                  tooltip.style.background = 'white';
                  tooltip.style.borderRadius = '12px';
                  tooltip.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  tooltip.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${m.avatar ? 
                        `<img src="${m.avatar}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />` :
                        `<div style="width: 30px; height: 30px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; font-weight: bold;">${m.firstName[0]}</div>`
                      }
                      <div style="text-align: right;">
                        <div style="font-weight: bold; color: #333;">${m.firstName} ${m.lastName}</div>
                        <div style="font-size: 12px; color: #666;">${m.calculatedDistance.toFixed(2)} ק"מ מהחוף</div>
                        <div style="font-size: 11px; color: #888; margin-top: 4px; font-weight: 600;">כתובת: [ ${m.full_address || m.city || 'לא צוינה'} ]</div>
                      </div>
                    </div>
                  `;
                  found = true;
              }
          });
          if (!found) tooltip.style.display = 'none';
      };

      canvas.onmousemove = handleMouseMove as any;
    };

    logoImg.onload = render;
    render(); // Initial render

    return () => {
      canvas.onmousemove = null;
    };
  }, [members, siteAssets, siteConfig]);

  const handleViewToggle = () => {
    const next = viewMode === 'unified' ? 'split' : 'unified';
    setViewMode(next);
    safeLocalStorage.setItem('trendsViewMode', next);
  };

  const groups = [
    { id: 'age1', label: 'צעירים (18-25)', color: '#4FD1C5' },
    { id: 'age2', label: 'בוגרים (26-40)', color: '#63B3ED' },
    { id: 'age3', label: 'אמצע החיים (41-60)', color: '#4299E1' },
    { id: 'age4', label: 'ותיקים (60+)', color: '#2B6CB0' },
    { id: 'male', label: 'גברים', color: '#3182CE' },
    { id: 'female', label: 'נשים', color: '#D53F8C' },
    { id: 'other', label: 'אחר/לא צוין', color: '#718096' }
  ];

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
            const groupMembers = members.filter(m => {
              if (group.id === 'male') return m.gender === 'זכר';
              if (group.id === 'female') return m.gender === 'נקבה';
              if (group.id === 'other') return !m.gender || m.gender === 'מעדיף/ה לא לציין';
              
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
        <div className="admin-info-card p-4 rounded-2xl shadow-xl text-[#121212] text-right" dir="rtl">
          <p className="text-xs font-black mb-1 border-b border-white/10 pb-2">{data.fullDate}</p>
          <p className="text-[12px] font-bold text-blue-300 mb-2">חודש {data.activityMonth} לשנת חבל זוג</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              // Only show the group data, skip the count bars in unified view if they are too many
              if (entry.dataKey.toString().endsWith('_count')) return null;
              
              return (
                <div key={index} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs font-bold text-[#004D40]">{entry.name}</span>
                    </div>
                    <span className="text-xs font-black text-white">{Math.round(entry.value as number)}%</span>
                  </div>
                  {entry.payload[`${entry.dataKey}_count`] !== undefined && (
                    <p className="text-[12px] font-bold text-[#000000] mr-4">
                      מספר משתתפים בפועל: {entry.payload[`${entry.dataKey}_count`]}
                    </p>
                  )}
                </div>
              );
            })}
            <p className="text-[12px] font-bold text-[#000000] mt-2 pt-2 border-t border-white/5">
              שבוע {data.weekNumber} מתחילת הפעילות
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header & Switcher */}
      <div className="admin-info-card p-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#2B2B2E] tracking-tight">דשבורד טרנדים והתמדה</h3>
              <p className="text-[12px] font-bold text-[#000000] uppercase tracking-widest">ניתוח שנת חבל זוג • 7 קבוצות מיקוד</p>
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
        className="lg:col-span-2 bg-zinc-950/80 backdrop-blur-xl rounded-3xl border border-zinc-800/50 shadow-2xl p-8 md:p-10 transition-all duration-500 relative group"
      >
          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between mb-12 relative z-10 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#121212] tracking-tight">שיעור התמדה לפי קבוצות גיל</h3>
                <p className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wider">SESSION VITALITY METRICS-8</p>
              </div>
            </div>

            {/* Toggle View Button */}
            <div dir="ltr" className="relative flex bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 p-1 rounded-full">
              <div className="absolute inset-1 flex pointer-events-none">
                <motion.div
                  className="w-1/2 h-full rounded-full bg-zinc-800 border border-zinc-700 shadow-sm"
                  animate={{ x: ageGroupViewMode === 'unified' ? '0%' : '100%' }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              </div>
              <button
                onClick={() => setAgeGroupViewMode('unified')}
                className={`relative z-10 px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors duration-300 ${
                  ageGroupViewMode === 'unified' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                גרף מאוחד
              </button>
              <button
                onClick={() => setAgeGroupViewMode('cards')}
                className={`relative z-10 px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors duration-300 ${
                  ageGroupViewMode === 'cards' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                כרטיסיות
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
                className="w-full h-[400px] mt-8 relative z-10 bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50" 
                dir="ltr"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.cohorts} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} dx={-10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                      itemStyle={{ fontWeight: 'black' }}
                      formatter={(value: any, name: any) => [`${value}%`, name === 'retention' ? 'אוקטו (8 שבועות)' : 'ממוצע שנתי']}
                      labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}
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
                  let categoryLabel = "";
                  let categoryColor = "";
                  let barColorClass = "";
                  
                  if (retention < RETENTION_THRESHOLDS.TOURIST) {
                    categoryLabel = "תיירים";
                    categoryColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                    barColorClass = "bg-rose-500";
                  } else if (retention < RETENTION_THRESHOLDS.ECONOMY) {
                    categoryLabel = "אקונומי פלוס";
                    categoryColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    barColorClass = "bg-amber-500";
                  } else if (retention < RETENTION_THRESHOLDS.BUSINESS) {
                    categoryLabel = "ביזנס קלאס";
                    categoryColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                    barColorClass = "bg-blue-500";
                  } else {
                    categoryLabel = "פירסט קלאס";
                    categoryColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                    barColorClass = "bg-emerald-500";
                  }

                  return (
                    <div key={idx} className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50 flex flex-col relative overflow-hidden group hover:bg-zinc-800/50 transition-colors duration-300">
                      <div className="flex justify-between items-start mb-8 relative z-10" dir="rtl">
                        <div>
                          <h4 className="text-lg font-semibold text-[#121212] tracking-tight">{group.label}</h4>
                          <p className="text-xs text-zinc-500 mt-1">{group.count} חברים</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-md border text-[10px] font-medium tracking-wide ${categoryColor}`}>
                          {categoryLabel}
                        </div>
                      </div>

                      <div className="space-y-5 relative z-10" dir="rtl">
                        {/* Yearly Progress */}
                        <div>
                          <div className="flex justify-between text-xs font-medium mb-2">
                            <span className="text-zinc-500">ממוצע שנתי</span>
                            <span className="text-zinc-300">{group.yearlyRetention}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${group.yearlyRetention}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-zinc-400 rounded-full"
                            />
                            {/* Reference Marker */}
                            <div 
                              className="absolute top-0 bottom-0 w-px bg-zinc-600 z-10"
                              style={{ right: `${stats.overallYearlyRetention}%` }}
                              title={`ממוצע קהילתי: ${stats.overallYearlyRetention}%`}
                            />
                          </div>
                        </div>

                        {/* Octo Progress */}
                        <div>
                          <div className="flex justify-between text-xs font-medium mb-2">
                            <span className="text-zinc-500">אוקטו (8 שבועות)</span>
                            <span className={categoryColor.split(' ')[0]}>{group.retention}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${group.retention}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                              className={`h-full ${barColorClass} rounded-full`}
                            />
                            {/* Reference Marker */}
                            <div 
                              className="absolute top-0 bottom-0 w-px bg-zinc-600 z-10"
                              style={{ right: `${stats.overallRetention}%` }}
                              title={`ממוצע קהילתי: ${stats.overallRetention}%`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Indicators */}
          <div className="mt-12 pt-6 border-t border-zinc-800/50 flex flex-wrap justify-center gap-6 md:justify-between items-center w-full relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">תיירים (&lt;{RETENTION_THRESHOLDS.TOURIST}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">אקונומי פלוס ({RETENTION_THRESHOLDS.TOURIST}-{RETENTION_THRESHOLDS.ECONOMY - 1}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">ביזנס קלאס ({RETENTION_THRESHOLDS.ECONOMY}-{RETENTION_THRESHOLDS.BUSINESS - 1}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">פירסט קלאס ({RETENTION_THRESHOLDS.BUSINESS}%+)</span>
            </div>
          </div>
        </motion.div>


      {/* Gender Retention Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 bg-zinc-950/80 backdrop-blur-xl rounded-3xl border border-zinc-800/50 shadow-2xl p-8 md:p-10 transition-all duration-500 relative group"
      >
          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Heart size={24} />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#121212] tracking-tight">שיעור התמדה לפי מגדר</h3>
                <p className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wider">COMMUNITY INSIGHTS • GENDER DYNAMICS</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-10 relative z-10 w-full mt-8 px-4 pb-8">
            {stats.genderCohorts.map((group: any, idx: number) => {
              const retention = group.value;
              const yearly = group.yearlyRetention;
              
              let categoryLabel = "";
              let categoryColor = "";
              let barColorClass = "bg-emerald-500";
              
              if (retention < RETENTION_THRESHOLDS.TOURIST) {
                categoryLabel = "תיירים";
                categoryColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                barColorClass = "bg-rose-500";
              } else if (retention < RETENTION_THRESHOLDS.ECONOMY) {
                categoryLabel = "אקונומי פלוס";
                categoryColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                barColorClass = "bg-amber-500";
              } else if (retention < RETENTION_THRESHOLDS.BUSINESS) {
                categoryLabel = "ביזנס קלאס";
                categoryColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                barColorClass = "bg-blue-500";
              } else {
                categoryLabel = "פירסט קלאס";
                categoryColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
              }

              return (
                <div key={idx} className="flex flex-col w-full relative group/bullet">
                  {/* Header: Responsive Layout for Mobile & Desktop */}
                  <div className="flex flex-col gap-3 mb-4">
                    {/* Top Row: Title, Count, Badge (RTL) */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg md:text-xl font-semibold text-zinc-100 tracking-tight">{group.label}</span>
                        <span className="text-[10px] md:text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800 whitespace-nowrap">{group.count} חברים</span>
                      </div>
                      <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-md font-medium border whitespace-nowrap ${categoryColor}`}>
                        {categoryLabel}
                      </span>
                    </div>

                    {/* Bottom Row: Stats (LTR to match graph) */}
                    <div dir="ltr" className="flex items-center justify-start gap-4 md:gap-6">
                      <div className="flex flex-col items-start">
                        <span className="text-[9px] md:text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1 whitespace-nowrap">אוקטו (8 שבועות)</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl md:text-2xl font-bold text-zinc-100 leading-none">{retention}</span>
                          <span className="text-xs md:text-sm font-medium text-zinc-500">%</span>
                        </div>
                      </div>
                      <div className="w-px h-8 md:h-10 bg-zinc-800" />
                      <div className="flex flex-col items-start">
                        <span className="text-[9px] md:text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1 whitespace-nowrap">ממוצע שנתי</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl md:text-2xl font-bold text-zinc-400 leading-none">{yearly}</span>
                          <span className="text-xs md:text-sm font-medium text-zinc-600">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bullet Graph Container (Linear Style) */}
                  <div dir="ltr" className="relative w-full h-8 rounded-lg bg-zinc-900/50 border border-zinc-800/50 overflow-visible flex items-center px-1">
                    
                    {/* Background Ranges (Subtle) */}
                    <div className="absolute inset-0 flex rounded-lg overflow-hidden pointer-events-none opacity-20">
                      <div className="h-full w-[50%] bg-rose-500 border-r border-zinc-800" />
                      <div className="h-full w-[20%] bg-amber-500 border-r border-zinc-800" />
                      <div className="h-full w-[20%] bg-blue-500 border-r border-zinc-800" />
                      <div className="h-full w-[10%] bg-emerald-500" />
                    </div>

                    {/* Scale Marks */}
                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                      {[0, 25, 50, 75, 100].map(mark => (
                        <div key={mark} className="h-full flex flex-col justify-between py-0.5">
                          <div className="w-px h-1.5 bg-zinc-700" />
                          <div className="w-px h-1.5 bg-zinc-700" />
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
                      className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-zinc-300 z-20"
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
          <div className="w-8 h-px bg-zinc-800" />
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.3em]">ניתוח מגמות והתמדה</span>
          <div className="w-8 h-px bg-zinc-800" />
        </div>
        <div dir="ltr" className="relative flex bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 p-1 rounded-full">
          {/* Animated Bubble */}
          <div className="absolute inset-1 flex pointer-events-none">
            <motion.div
              className="w-1/2 h-full rounded-full bg-zinc-800 border border-zinc-700 shadow-sm"
              animate={{ x: viewMode === 'unified' ? '0%' : '100%' }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          </div>

          <button
            onClick={() => setViewMode('unified')}
            className={`relative z-10 px-8 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors duration-300 ${
              viewMode === 'unified' ? 'text-[#121212]' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            גרף מאוחד
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`relative z-10 px-8 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors duration-300 ${
              viewMode === 'split' ? 'text-[#121212]' : 'text-zinc-500 hover:text-zinc-300'
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
            className="admin-info-card p-10 h-[500px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 40, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                {/* Area Highlighting */}
                {chartData.length > 0 && (
                  <ReferenceArea 
                    x1={chartData[0]?.name} 
                    x2={chartData[chartData.length - 1]?.name} 
                    fill="#F5F5F5" 
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
                        stroke="#FF0000" 
                        strokeDasharray="5 5" 
                        label={{ position: 'top', value: 'היום', fill: '#FF0000', fontSize: 10, fontWeight: 900 }} 
                      />
                    );
                  }
                  return null;
                })()}

                <XAxis 
                  dataKey="name" 
                  {...getOperationalXAxisProps(chartData.length, yearConfig)}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
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
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dx={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
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
            className="grid grid-cols-1 gap-8"
          >
            {groups.map(group => (
              <div key={group.id} className="admin-info-card p-10 h-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-[#2B2B2E] uppercase tracking-widest">{group.label}</h4>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      
                      {/* Area Highlighting */}
                      {chartData.length > 0 && (
                        <ReferenceArea 
                          x1={chartData[0]?.name} 
                          x2={chartData[chartData.length - 1]?.name} 
                          fill="#F5F5F5" 
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
                              stroke="#FF0000" 
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
                        tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        domain={[0, 100]} 
                        ticks={[0, 50, 100]}
                        tickFormatter={(val) => `${val}%`}
                        tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        yAxisId="right"
                        dataKey={`${group.id}_count`}
                        fill="#E2E8F0"
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

      {/* Community Radius Widget */}
    </div>
  );
};

export default TrendsDashboard;
