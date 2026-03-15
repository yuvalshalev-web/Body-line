
import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  Bar
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
import { getOperationalXAxisProps } from '../../src/utils/chartHelpers';
import OperationalChartHeader from '../OperationalChartHeader';
import { calculateDistance } from '../../utils/distanceCalculator';
import { getCoordinates } from '../../src/utils/geocoding';

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

      const potentialAttendance = last8Sessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = new Date(m.joinedAt);
          const sessionDate = new Date(session.date);
          if (joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = new Date(m.deactivatedAt);
            if (deactivatedDate < sessionDate) return false;
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

      // Calculate Yearly Retention
      const yearlyPotentialAttendance = weeklyHistory.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = new Date(m.joinedAt);
          const sessionDate = new Date(session.date);
          if (joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = new Date(m.deactivatedAt);
            if (deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);
      const yearlyActualAttendance = weeklyHistory.reduce((sum, session) => {
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
          const joinedDate = new Date(m.joinedAt);
          const sessionDate = new Date(session.date);
          if (joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = new Date(m.deactivatedAt);
            if (deactivatedDate < sessionDate) return false;
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

      const potentialAttendance = last8Sessions.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = new Date(m.joinedAt);
          const sessionDate = new Date(session.date);
          if (joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = new Date(m.deactivatedAt);
            if (deactivatedDate < sessionDate) return false;
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
      
      // Calculate Yearly Retention
      const yearlyPotentialAttendance = weeklyHistory.reduce((sum, session) => {
        const activeGroupMembers = groupMembers.filter(m => {
          const joinedDate = new Date(m.joinedAt);
          const sessionDate = new Date(session.date);
          if (joinedDate > sessionDate) return false;
          if (m.deactivatedAt) {
            const deactivatedDate = new Date(m.deactivatedAt);
            if (deactivatedDate < sessionDate) return false;
          }
          return true;
        });
        return sum + activeGroupMembers.length;
      }, 0);
      const yearlyActualAttendance = weeklyHistory.reduce((sum, session) => {
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
    const saved = localStorage.getItem('trendsViewMode');
    return (saved as any) || 'unified';
  });
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
      if (logoImg.complete) {
        const logoSize = 40;
        // Center the logo in the middle of the radar
        const newX = centerX;
        const newY = centerY;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(newX, newY, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, newX - logoSize / 2, newY - logoSize / 2, logoSize, logoSize);
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
                      <img src="${m.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />
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
    localStorage.setItem('trendsViewMode', next);
  };

  const groups = [
    { id: 'age1', label: 'צעירים (18-25)', color: '#4FD1C5' },
    { id: 'age2', label: 'בוגרים (26-40)', color: '#63B3ED' },
    { id: 'age3', label: 'אמצע חיים (41-60)', color: '#4299E1' },
    { id: 'age4', label: 'ותיקים (60+)', color: '#2B6CB0' },
    { id: 'male', label: 'גברים', color: '#3182CE' },
    { id: 'female', label: 'נשים', color: '#D53F8C' },
    { id: 'other', label: 'אחר/לא צוין', color: '#718096' }
  ];

  const chartData = useMemo(() => {
    if (!yearConfig) return [];
    
    const data = [];
    const startDate = new Date(yearConfig.startDate);
    const endDate = new Date(yearConfig.endDate);
    const today = new Date();
    
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
          const hDate = h.date?.toDate ? h.date.toDate() : new Date(h.date);
          return hDate.toDateString() === iter.toDateString();
        });

        groups.forEach(group => {
          if (historyEntry) {
            const attendees = historyEntry.participantIds || [];
            const groupMembers = members.filter(m => {
              if (group.id === 'male') return m.gender === 'זכר';
              if (group.id === 'female') return m.gender === 'נקבה';
              if (group.id === 'other') return !m.gender || m.gender === 'מעדיף/ה לא לציין';
              
              const birthDate = m.birthday ? new Date(m.birthday) : null;
              if (!birthDate) return false;
              const age = today.getFullYear() - birthDate.getFullYear();
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
    const startDate = new Date(yearConfig.startDate);
    const endDate = new Date(yearConfig.endDate);
    
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
        <div className="bg-[#2D3748] p-4 rounded-2xl border-none shadow-xl text-white text-right" dir="rtl">
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
                      <span className="text-xs font-bold text-slate-300">{entry.name}</span>
                    </div>
                    <span className="text-xs font-black text-white">{Math.round(entry.value as number)}%</span>
                  </div>
                  {entry.payload[`${entry.dataKey}_count`] !== undefined && (
                    <p className="text-[12px] font-bold text-slate-400 mr-4">
                      מספר משתתפים בפועל: {entry.payload[`${entry.dataKey}_count`]}
                    </p>
                  )}
                </div>
              );
            })}
            <p className="text-[12px] font-bold text-slate-500 mt-2 pt-2 border-t border-white/5">
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
      <div className="glass-panel p-10 rounded-[3.5rem] border border-white/20 shadow-soft">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#2B2B2E] tracking-tight">דשבורד טרנדים והתמדה</h3>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">ניתוח שנת חבל זוג • 7 קבוצות מיקוד</p>
            </div>
          </div>
        </div>

        {yearConfig && (
          <OperationalChartHeader 
            startDate={new Date(yearConfig.startDate).toLocaleDateString('he-IL')}
            endDate={new Date(yearConfig.endDate).toLocaleDateString('he-IL')}
            currentMonth={currentStats?.currentMonth}
            currentWeek={currentStats?.currentWeek}
            isActive={new Date() <= new Date(yearConfig.endDate)}
          />
        )}
      </div>

      {/* Vitality Retention Card - Tachometer Gauges */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 home-glass-card p-10 rounded-[4rem] transition-all duration-500 relative group"
      >
          {/* Background elements that need clipping */}
          <div className="absolute inset-0 overflow-hidden rounded-[4rem] pointer-events-none">
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>

          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl glass-effect flex items-center justify-center text-[var(--surfer-cyan)] shadow-inner border border-white/10">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="home-title font-black text-2xl md:text-3xl tracking-tighter uppercase">שיעור התמדה לפי קבוצות גיל</h3>
                <p className="home-data-text text-[12px] tracking-[0.3em] mt-1 font-black uppercase">SESSION VITALITY METRICS-8</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 relative z-10">
            {stats.cohorts.map((group: any, idx: number) => {
              const retention = group.retention;
              
              let categoryLabel = "";
              let categoryColor = "";
              if (retention < RETENTION_THRESHOLDS.TOURIST) {
                categoryLabel = "תיירים";
                categoryColor = "text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
              } else if (retention < RETENTION_THRESHOLDS.ECONOMY) {
                categoryLabel = "אקונומי פלוס";
                categoryColor = "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
              } else if (retention < RETENTION_THRESHOLDS.BUSINESS) {
                categoryLabel = "ביזנס קלאס";
                categoryColor = "text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]";
              } else {
                categoryLabel = "פירסט קלאס";
                categoryColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
              }
              
              return (
                <div key={idx} className="flex flex-col items-center relative group/gauge hover:z-50 z-10">
                  {/* Category Sign (Clock Style) */}
                  <div className="mb-4 bg-[#fdfdfd] border border-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.3)] px-4 py-0.5 min-w-[100px] flex justify-center items-center relative z-20">
                    <span className="text-black font-black text-[11px] uppercase tracking-[0.15em] antialiased">
                      {group.label} {group.count}
                    </span>
                  </div>

                  {/* Gauge Container */}
                  <div className="relative w-full max-w-[280px] mx-auto flex justify-center items-center bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                      <defs>
                        {/* Frosted Glass Background Filter */}
                        <filter id={`frosted-glass-age-${idx}`} x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="8" result="blur" />
                          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" in="blur" result="goo" />
                          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                        </filter>

                        {/* Brushed Metal for Needle */}
                        <linearGradient id={`brushed-metal-age-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f8fafc" />
                          <stop offset="25%" stopColor="#94a3b8" />
                          <stop offset="50%" stopColor="#e2e8f0" />
                          <stop offset="75%" stopColor="#475569" />
                          <stop offset="100%" stopColor="#cbd5e1" />
                        </linearGradient>

                        {/* Liquid Light Gradient (Vitality) */}
                        <linearGradient id={`liquid-light-age-${idx}`} x1="35" y1="165" x2="165" y2="165" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="30%" stopColor="#f59e0b" />
                          <stop offset="60%" stopColor="#eab308" />
                          <stop offset="90%" stopColor="#84cc16" />
                          <stop offset="100%" stopColor="#39FF14" />
                        </linearGradient>

                        {/* Glossy Highlight */}
                        <radialGradient id={`glass-lens-age-${idx}`} cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                          <stop offset="50%" stopColor="white" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                        </radialGradient>

                        <linearGradient id={`glass-shine-age-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="white" stopOpacity="0.02" />
                          <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Frosted Glass Background */}
                      <circle cx="100" cy="100" r="92" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                      <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(0, 0, 0, 0.5)" strokeWidth="2" />

                      {/* Empty Glass Tube */}
                      <path 
                        d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                        fill="none" 
                        stroke="rgba(255, 255, 255, 0.03)" 
                        strokeWidth="12" 
                        strokeLinecap="round" 
                      />
                      <path 
                        d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                        fill="none" 
                        stroke="rgba(0, 0, 0, 0.4)" 
                        strokeWidth="12" 
                        strokeLinecap="round" 
                        style={{ filter: 'blur(1px)' }}
                        opacity="0.6"
                      />

                      {/* Liquid Light (Filled) */}
                      <motion.path 
                        d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                        fill="none" 
                        stroke={`url(#liquid-light-age-${idx})`} 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        pathLength="100"
                        strokeDasharray="100"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 100 - group.retention }}
                        transition={{ duration: 2.5, ease: [0.34, 1.56, 0.64, 1], delay: idx * 0.1 }}
                        style={{ filter: 'drop-shadow(0px 0px 8px rgba(57,255,20,0.4))' }}
                      />

                      {/* Tick Marks and Numbers */}
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => {
                        const angle = -45 + (val / 100) * 270;
                        const rad = (angle * Math.PI) / 180;
                        const isMajor = val % 20 === 0;
                        
                        // Tick marks
                        const outerR = 82;
                        const innerR = isMajor ? 72 : 77;
                        const x1 = 100 - Math.cos(rad) * outerR;
                        const y1 = 100 - Math.sin(rad) * outerR;
                        const x2 = 100 - Math.cos(rad) * innerR;
                        const y2 = 100 - Math.sin(rad) * innerR;

                        // Numbers
                        const textR = 58;
                        const tx = 100 - Math.cos(rad) * textR;
                        const ty = 100 - Math.sin(rad) * textR;

                        return (
                          <g key={val}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth={isMajor ? 1.5 : 0.5} style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.8))' }} />
                            {isMajor && (
                              <g>
                                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.9)" fontSize="10" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="200" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8), -1px -1px 1px rgba(255,255,255,0.2)' }}>
                                  {val}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Yearly Retention Marker moved to end of SVG for top z-index */}
                      {/* Thin Sharp Needle */}
                      <motion.g
                        initial={{ rotate: -135 }}
                        animate={{ rotate: -135 + (group.retention / 100) * 270 }}
                        style={{ transformOrigin: "100px 100px" }}
                        transition={{ duration: 2.5, ease: [0.34, 1.56, 0.64, 1], delay: idx * 0.1 }}
                      >
                        <circle cx="100" cy="100" r="100" fill="none" />
                        <polygon 
                          points="98.5,100 101.5,100 100,18" 
                          fill={`url(#brushed-metal-age-${idx})`}
                          style={{ filter: `drop-shadow(0px 4px 6px rgba(0,0,0,0.5))` }}
                        />
                        {/* Illuminated Tip */}
                        <circle cx="100" cy="18" r="2.5" fill="#ffffff" style={{ filter: 'drop-shadow(0px 0px 4px #ffffff)' }} />
                      </motion.g>

                      {/* Center Pivot */}
                      <circle cx="100" cy="100" r="8" fill={`url(#brushed-metal-age-${idx})`} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }} />
                      <circle cx="100" cy="100" r="3" fill="#0F172A" />

                      {/* Glassmorphism Overlay - Lens Effect & Shine */}
                      <circle cx="100" cy="100" r="92" fill={`url(#glass-lens-age-${idx})`} className="pointer-events-none" opacity="0.8" />
                      <circle cx="100" cy="100" r="92" fill={`url(#glass-shine-age-${idx})`} className="pointer-events-none" opacity="0.6" />
                      <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="pointer-events-none" />

                      {/* Digital Percentage Boxes - Side by Side */}
                      <g transform="translate(48, 110)">
                        {/* Yearly Box */}
                        <rect width="50" height="32" rx="4" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                        <text x="25" y="12" textAnchor="middle" dominantBaseline="middle" fill="#4A5568" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="bold">שנתי</text>
                        <text x="25" y="24" textAnchor="middle" dominantBaseline="middle" fill="#D69E2E" fontSize="13" fontWeight="black" fontFamily="monospace" style={{ filter: 'drop-shadow(0px 0px 2px rgba(214,158,46,0.4))', letterSpacing: '-0.5px' }}>{group.yearlyRetention}%</text>
                      </g>
                      <g transform="translate(102, 110)">
                        {/* Octo Box */}
                        <rect width="50" height="32" rx="4" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                        <text x="25" y="12" textAnchor="middle" dominantBaseline="middle" fill="#4A5568" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="bold">אוקטו (8)</text>
                        <text x="25" y="24" textAnchor="middle" dominantBaseline="middle" fill="#2D3748" fontSize="13" fontWeight="black" fontFamily="monospace" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.1))', letterSpacing: '-0.5px' }}>{group.retention}%</text>
                      </g>

                      {/* Text Elements */}
                      <text x="100" y="178" textAnchor="middle" dominantBaseline="middle" fill="#4A0033" fontFamily="Inter, sans-serif" fontWeight="black" fontSize="14" className="antialiased">{group.label}</text>

                      {/* Yearly Retention Marker (Rendered last to be on top) */}
                      <motion.g
                        className="group/marker cursor-pointer outline-none"
                        tabIndex={0}
                        onTouchStart={() => {}}
                        initial={{ rotate: -135 }}
                        animate={{ rotate: -135 + (group.yearlyRetention / 100) * 270 }}
                        style={{ transformOrigin: "100px 100px" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      >
                        {/* Invisible hit area for easier hover */}
                        <circle cx="100" cy="-5" r="32" fill="transparent" />
                        
                        {/* Pulsing Glow */}
                        <motion.circle 
                          cx="100" cy="-5" r="8" 
                          fill="rgba(255,222,69,0.3)" 
                          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }} 
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} 
                        />
                        {/* Isosceles Triangle Pointer */}
                        <polygon 
                          points="94,-12 106,-12 100,2" 
                          fill="#FFDE45"
                          stroke="#FFFFFF"
                          strokeWidth="1"
                          style={{ filter: 'drop-shadow(0px 2px 6px rgba(255,222,69,0.8))' }}
                        />
                        
                        {/* Tooltip (Counter-rotated to stay upright) */}
                        <g 
                          className="opacity-0 group-hover/marker:opacity-100 group-focus/marker:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ transform: `rotate(${-(-135 + (group.yearlyRetention / 100) * 270)}deg)`, transformOrigin: '100px -44px' }}
                        >
                          <rect x="40" y="-70" width="120" height="52" rx="10" fill="rgba(15, 23, 42, 0.95)" stroke="#FFDE45" strokeWidth="1.5" style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.6))' }} />
                          <text x="100" y="-52" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif">
                            שנתי
                          </text>
                          <text x="100" y="-30" textAnchor="middle" dominantBaseline="middle" fill="#FFDE45" fontSize="22" fontWeight="black" fontFamily="monospace" style={{ letterSpacing: '0.5px' }}>
                            {group.yearlyRetention}%
                          </text>
                        </g>
                      </motion.g>
                    </svg>
                  </div>
                  
                  {/* Status Labels */}
                  <div className="mt-6 flex flex-col items-center gap-2 h-12">
                    <div className={`px-4 py-1 rounded-full border ${categoryColor}`}>
                      <span className="text-[12px] font-black uppercase tracking-widest antialiased">
                        {categoryLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Indicators */}
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-6 md:justify-between items-center w-full relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#007085] font-black uppercase tracking-[0.2em]">תיירים (&lt;{RETENTION_THRESHOLDS.TOURIST}%)</span>
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#007085] font-black uppercase tracking-[0.2em]">אקונומי פלוס ({RETENTION_THRESHOLDS.TOURIST}-{RETENTION_THRESHOLDS.ECONOMY - 1}%)</span>
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#007085] font-black uppercase tracking-[0.2em]">ביזנס קלאס ({RETENTION_THRESHOLDS.ECONOMY}-{RETENTION_THRESHOLDS.BUSINESS - 1}%)</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#007085] font-black uppercase tracking-[0.2em]">פירסט קלאס ({RETENTION_THRESHOLDS.BUSINESS}%+)</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            </div>
          </div>
        </motion.div>


      {/* Vitality Retention Card - Tachometer Gauges */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 home-glass-card p-10 rounded-[4rem] transition-all duration-500 relative group"
      >
          {/* Background elements that need clipping */}
          <div className="absolute inset-0 overflow-hidden rounded-[4rem] pointer-events-none">
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>

          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl glass-effect flex items-center justify-center text-[var(--surfer-pink)] shadow-inner border border-white/10">
                <Heart size={24} />
              </div>
              <div>
                <h3 className="home-title font-black text-2xl md:text-3xl tracking-tighter uppercase">שיעור התמדה לפי מגדר</h3>
                <p className="home-data-text text-[12px] tracking-[0.3em] mt-1 font-black uppercase">COMMUNITY INSIGHTS • GENDER DYNAMICS</p>
              </div>
            </div>
          </div>

          <div className="flex flex-row flex-nowrap items-center justify-around gap-2 relative z-10 overflow-x-auto">
            {stats.genderCohorts.map((group: any, idx: number) => {
              const retention = group.value;
              
              let categoryLabel = "";
              let categoryColor = "";
              if (retention < RETENTION_THRESHOLDS.TOURIST) {
                categoryLabel = "תיירים";
                categoryColor = "text-red-400 bg-red-500/20 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.4)]";
              } else if (retention < RETENTION_THRESHOLDS.ECONOMY) {
                categoryLabel = "אקונומי פלוס";
                categoryColor = "text-amber-400 bg-amber-500/20 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.4)]";
              } else if (retention < RETENTION_THRESHOLDS.BUSINESS) {
                categoryLabel = "ביזנס קלאס";
                categoryColor = "text-blue-400 bg-blue-500/20 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.4)]";
              } else {
                categoryLabel = "פירסט קלאס";
                categoryColor = "text-emerald-400 bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.4)]";
              }
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center relative group/gauge w-full max-w-[280px] hover:z-50 z-10">
                  {/* Category Sign (Clock Style) */}
                  <div className="mb-4 bg-[#fdfdfd] border border-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.3)] px-4 py-0.5 min-w-[100px] flex justify-center items-center relative z-20">
                    <span className="text-black font-black text-[11px] uppercase tracking-[0.15em] antialiased">
                      {group.label} {group.count}
                    </span>
                  </div>

                  {/* Gauge Container */}
                  <div className="relative w-full flex justify-center items-center bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                      <defs>
                        {/* Frosted Glass Background Filter */}
                        <filter id={`frosted-glass-gender-${idx}`} x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="8" result="blur" />
                          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" in="blur" result="goo" />
                          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                        </filter>

                        {/* Brushed Metal for Needle */}
                        <linearGradient id={`brushed-metal-gender-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f8fafc" />
                          <stop offset="25%" stopColor="#94a3b8" />
                          <stop offset="50%" stopColor="#e2e8f0" />
                          <stop offset="75%" stopColor="#475569" />
                          <stop offset="100%" stopColor="#cbd5e1" />
                        </linearGradient>

                        {/* Liquid Light Gradient (Ocean) */}
                        <linearGradient id={`liquid-light-gender-${idx}`} x1="0" y1="200" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#1A365D" />
                          <stop offset="50%" stopColor="#2C5282" />
                          <stop offset="100%" stopColor="#63B3ED" />
                        </linearGradient>

                        {/* Glossy Highlight */}
                        <radialGradient id={`glass-lens-gender-${idx}`} cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                          <stop offset="50%" stopColor="white" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                        </radialGradient>

                        <linearGradient id={`glass-shine-gender-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="white" stopOpacity="0.02" />
                          <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Frosted Glass Background */}
                      <circle cx="100" cy="100" r="92" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                      <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(0, 0, 0, 0.5)" strokeWidth="2" />

                      {/* Empty Glass Tube */}
                      <path 
                        d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                        fill="none" 
                        stroke="rgba(255, 255, 255, 0.03)" 
                        strokeWidth="12" 
                        strokeLinecap="round" 
                      />
                      <path 
                        d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                        fill="none" 
                        stroke="rgba(0, 0, 0, 0.4)" 
                        strokeWidth="12" 
                        strokeLinecap="round" 
                        style={{ filter: 'blur(1px)' }}
                        opacity="0.6"
                      />

                      {/* Liquid Light (Filled) */}
                      <motion.path 
                        d="M 34.95 165.05 A 92 92 0 1 1 165.05 165.05" 
                        fill="none" 
                        stroke={`url(#liquid-light-gender-${idx})`} 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        pathLength="100"
                        strokeDasharray="100"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 100 - group.value }}
                        transition={{ duration: 2.5, ease: [0.34, 1.56, 0.64, 1], delay: idx * 0.1 }}
                        style={{ filter: 'drop-shadow(0px 0px 8px rgba(99,179,237,0.4))' }}
                      />

                      {/* Tick Marks and Numbers */}
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => {
                        const angle = -45 + (val / 100) * 270;
                        const rad = (angle * Math.PI) / 180;
                        const isMajor = val % 20 === 0;
                        
                        // Tick marks
                        const outerR = 82;
                        const innerR = isMajor ? 72 : 77;
                        const x1 = 100 - Math.cos(rad) * outerR;
                        const y1 = 100 - Math.sin(rad) * outerR;
                        const x2 = 100 - Math.cos(rad) * innerR;
                        const y2 = 100 - Math.sin(rad) * innerR;

                        // Numbers
                        const textR = 58;
                        const tx = 100 - Math.cos(rad) * textR;
                        const ty = 100 - Math.sin(rad) * textR;

                        return (
                          <g key={val}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth={isMajor ? 1.5 : 0.5} style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.8))' }} />
                            {isMajor && (
                              <g>
                                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.9)" fontSize="10" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="200" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8), -1px -1px 1px rgba(255,255,255,0.2)' }}>
                                  {val}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Yearly Retention Marker moved to end of SVG for top z-index */}
                      {/* Thin Sharp Needle */}
                      <motion.g
                        initial={{ rotate: -135 }}
                        animate={{ rotate: -135 + (group.value / 100) * 270 }}
                        style={{ transformOrigin: "100px 100px" }}
                        transition={{ duration: 2.5, ease: [0.34, 1.56, 0.64, 1], delay: idx * 0.1 }}
                      >
                        <circle cx="100" cy="100" r="100" fill="none" />
                        <polygon 
                          points="98.5,100 101.5,100 100,18" 
                          fill={`url(#brushed-metal-gender-${idx})`}
                          style={{ filter: `drop-shadow(0px 4px 6px rgba(0,0,0,0.5))` }}
                        />
                        {/* Illuminated Tip */}
                        <circle cx="100" cy="18" r="2.5" fill="#ffffff" style={{ filter: 'drop-shadow(0px 0px 4px #ffffff)' }} />
                      </motion.g>

                      {/* Center Pivot */}
                      <circle cx="100" cy="100" r="8" fill={`url(#brushed-metal-gender-${idx})`} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }} />
                      <circle cx="100" cy="100" r="3" fill="#0F172A" />

                      {/* Glassmorphism Overlay - Lens Effect & Shine */}
                      <circle cx="100" cy="100" r="92" fill={`url(#glass-lens-gender-${idx})`} className="pointer-events-none" opacity="0.8" />
                      <circle cx="100" cy="100" r="92" fill={`url(#glass-shine-gender-${idx})`} className="pointer-events-none" opacity="0.6" />
                      <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="pointer-events-none" />

                      {/* Digital Percentage Boxes - Side by Side */}
                      <g transform="translate(48, 110)">
                        {/* Yearly Box */}
                        <rect width="50" height="32" rx="4" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                        <text x="25" y="12" textAnchor="middle" dominantBaseline="middle" fill="#4A5568" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="bold">שנתי</text>
                        <text x="25" y="24" textAnchor="middle" dominantBaseline="middle" fill="#D69E2E" fontSize="13" fontWeight="black" fontFamily="monospace" style={{ filter: 'drop-shadow(0px 0px 2px rgba(214,158,46,0.4))', letterSpacing: '-0.5px' }}>{group.yearlyRetention}%</text>
                      </g>
                      <g transform="translate(102, 110)">
                        {/* Octo Box */}
                        <rect width="50" height="32" rx="4" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                        <text x="25" y="12" textAnchor="middle" dominantBaseline="middle" fill="#4A5568" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="bold">אוקטו (8)</text>
                        <text x="25" y="24" textAnchor="middle" dominantBaseline="middle" fill="#2D3748" fontSize="13" fontWeight="black" fontFamily="monospace" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.1))', letterSpacing: '-0.5px' }}>{group.value}%</text>
                      </g>

                      {/* Text Elements */}
                      <text x="100" y="178" textAnchor="middle" dominantBaseline="middle" fill="#4A0033" fontFamily="Inter, sans-serif" fontWeight="black" fontSize="14" className="antialiased">{group.label}</text>

                      {/* Yearly Retention Marker (Rendered last to be on top) */}
                      <motion.g
                        className="group/marker cursor-pointer outline-none"
                        tabIndex={0}
                        onTouchStart={() => {}}
                        initial={{ rotate: -135 }}
                        animate={{ rotate: -135 + (group.yearlyRetention / 100) * 270 }}
                        style={{ transformOrigin: "100px 100px" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      >
                        {/* Invisible hit area for easier hover */}
                        <circle cx="100" cy="-5" r="32" fill="transparent" />
                        
                        {/* Pulsing Glow */}
                        <motion.circle 
                          cx="100" cy="-5" r="8" 
                          fill="rgba(255,222,69,0.3)" 
                          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }} 
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} 
                        />
                        {/* Isosceles Triangle Pointer */}
                        <polygon 
                          points="94,-12 106,-12 100,2" 
                          fill="#FFDE45"
                          stroke="#FFFFFF"
                          strokeWidth="1"
                          style={{ filter: 'drop-shadow(0px 2px 6px rgba(255,222,69,0.8))' }}
                        />
                        
                        {/* Tooltip (Counter-rotated to stay upright) */}
                        <g 
                          className="opacity-0 group-hover/marker:opacity-100 group-focus/marker:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ transform: `rotate(${-(-135 + (group.yearlyRetention / 100) * 270)}deg)`, transformOrigin: '100px -44px' }}
                        >
                          <rect x="40" y="-70" width="120" height="52" rx="10" fill="rgba(15, 23, 42, 0.95)" stroke="#FFDE45" strokeWidth="1.5" style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.6))' }} />
                          <text x="100" y="-52" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif">
                            שנתי
                          </text>
                          <text x="100" y="-30" textAnchor="middle" dominantBaseline="middle" fill="#FFDE45" fontSize="22" fontWeight="black" fontFamily="monospace" style={{ letterSpacing: '0.5px' }}>
                            {group.yearlyRetention}%
                          </text>
                        </g>
                      </motion.g>
                    </svg>
                  </div>
                  
                  {/* Labels below gauge */}
                  <div className="mt-4 flex flex-col items-center gap-2 h-12">
                    <span className={`text-[10px] px-3 py-0.5 rounded-full font-black border antialiased ${categoryColor}`}>
                      {categoryLabel}
                    </span>
                    <span className="text-[12px] font-black home-title uppercase tracking-widest mt-1">
                      {group.count} חברים
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      {/* View Mode Switcher - Repositioned above graphs */}
      <div className="flex flex-col items-center gap-4 mb-8 mt-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-px bg-slate-200" />
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">ניתוח מגמות והתמדה</span>
          <div className="w-8 h-px bg-slate-200" />
        </div>
        <div dir="ltr" className="relative flex bg-white/10 backdrop-blur-xl p-1.5 rounded-full shadow-2xl border border-white/20">
          {/* Animated Colorful Bubble */}
          <div className="absolute inset-1.5 flex pointer-events-none">
            <motion.div
              className="w-1/2 h-full rounded-full bg-gradient-to-r from-[var(--surfer-cyan)] via-[var(--surfer-pink)] to-[var(--surfer-orange)] shadow-lg shadow-pink-500/40"
              animate={{ x: viewMode === 'unified' ? '0%' : '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <button
            onClick={() => setViewMode('unified')}
            className={`relative z-10 px-10 py-3 rounded-full text-[14px] font-black uppercase tracking-widest transition-colors duration-300 ${
              viewMode === 'unified' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            גרף מאוחד
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`relative z-10 px-10 py-3 rounded-full text-[14px] font-black uppercase tracking-widest transition-colors duration-300 ${
              viewMode === 'split' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
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
            className="glass-panel p-10 rounded-[3.5rem] border border-white/20 shadow-soft h-[500px]"
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
                  if (today >= new Date(yearConfig.startDate) && today <= new Date(yearConfig.endDate)) {
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
              <div key={group.id} className="glass-panel p-10 rounded-[3.5rem] border border-white/20 shadow-soft h-[350px] flex flex-col">
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
                        if (today >= new Date(yearConfig.startDate) && today <= new Date(yearConfig.endDate)) {
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
