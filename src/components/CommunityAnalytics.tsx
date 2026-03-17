import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import { parseDate } from '../utils/dateUtils';
import { AstrodeckGauge } from './UserAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calculateDistance } from '../utils/distanceCalculator';
import { getCoordinates } from '../utils/geocoding';

const CommunityAnalytics: React.FC = () => {
  const { members, weeklyHistory, siteConfig, isLoading } = useData();
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

    let animationFrameId: number;
    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      const pulseCycle = 4000; // 4 seconds per full cycle
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. ציור הטבעות (המרחקים) - Elite Alabaster marble texture
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(245, 245, 245, 0.7)');
      gradient.addColorStop(1, 'rgba(230, 230, 230, 0.5)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Frosted, translucent crystal glass ripples
      const rings = [
          { r: maxRadius, label: '25km' },
          { r: maxRadius * 0.6, label: '10km' },
          { r: maxRadius * 0.3, label: '3km' }
      ];

      rings.forEach(ring => {
          ctx.beginPath();
          ctx.arc(centerX, centerY, ring.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Etched labels
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.font = 'bold 14px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(ring.label, centerX, centerY - ring.r + 20);
      });

      // --- RADAR PULSE ANIMATION ---
      const rippleCount = 3;
      for (let i = 0; i < rippleCount; i++) {
        // Offset each ripple's start time
        const offset = (i / rippleCount) * pulseCycle;
        const progress = ((elapsed + offset) % pulseCycle) / pulseCycle;
        
        // Ease-out expansion
        const rippleRadius = progress * maxRadius;
        // Fade out as it expands
        const opacity = (1 - progress) * 0.4;
        
        if (rippleRadius > 24) { // Don't show inside the logo sphere
          ctx.beginPath();
          ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(54, 140, 176, ${opacity})`; // #368cb0
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw Logo in a pulsating crystal sphere
      const logoSize = 48;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, logoSize);
      coreGradient.addColorStop(0, 'rgba(0, 251, 255, 0.6)'); // Ocean Cyan
      coreGradient.addColorStop(1, 'rgba(0, 251, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, logoSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      if (logoImg.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
        ctx.restore();
        
        // Glass reflection on the sphere
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoSize / 2, 0, Math.PI * 2);
        const glassGrad = ctx.createLinearGradient(centerX - logoSize/2, centerY - logoSize/2, centerX + logoSize/2, centerY + logoSize/2);
        glassGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
        glassGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = glassGrad;
        ctx.fill();
      } else {
        // Fallback
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#00fbff';
        ctx.fill();
      }

      // 2. ציור חברי הקהילה כטיפות מים
      const membersWithCanvasPos = members.map((member, index) => {
          let distance = 0;
          const coords = getCoordinates(member.city, member.lat, member.lng);
          
          if (homeLat && homeLng && coords) {
            distance = calculateDistance(homeLat, homeLng, coords[0], coords[1]);
          } else {
            distance = member.distance || 0;
          }
          
          const distanceLimit = 30;
          let relativeRadius = (distance / distanceLimit) * maxRadius;
          
          const minRadius = 35; 
          if (relativeRadius < minRadius) relativeRadius = minRadius;
          if (relativeRadius > maxRadius) relativeRadius = maxRadius - 10;

          const angle = (index * 137.5) * (Math.PI / 180); 

          const x = centerX + relativeRadius * Math.cos(angle);
          const y = centerY + relativeRadius * Math.sin(angle);

          // Water Droplet (Circle)
          const dropRadius = 6;
          
          // Color mapping: Green for close, Red for far
          const ratio = Math.min(distance / 25, 1);
          const r = Math.round(34 + ratio * (239 - 34));
          const g = Math.round(197 + ratio * (68 - 197));
          const b = Math.round(94 + ratio * (68 - 94));
          const dropColor = `rgb(${r}, ${g}, ${b})`;

          ctx.save();
          ctx.translate(x, y);
          
          // Circle shape
          ctx.beginPath();
          ctx.arc(0, 0, dropRadius, 0, Math.PI * 2);
          
          const dropGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, dropRadius);
          dropGrad.addColorStop(0, dropColor);
          dropGrad.addColorStop(1, `rgba(${r},${g},${b},0.8)`);
          
          ctx.fillStyle = dropGrad;
          ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
          ctx.shadowBlur = 8;
          ctx.fill();
          
          // Brilliant highlight
          ctx.beginPath();
          ctx.arc(-dropRadius*0.3, -dropRadius*0.2, dropRadius*0.2, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.shadowBlur = 0;
          ctx.fill();
          
          ctx.restore();

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
                  tooltip.style.left = visualX + 15 + 'px';
                  tooltip.style.top = visualY + 15 + 'px';
                  tooltip.style.padding = '10px 14px';
                  tooltip.style.background = 'rgba(255, 255, 255, 0.98)';
                  tooltip.style.backdropFilter = 'blur(12px)';
                  tooltip.style.borderRadius = '16px';
                  tooltip.style.border = '1.5px solid #00E5FF';
                  tooltip.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                  tooltip.style.minWidth = '150px';
                  
                  tooltip.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 2px; text-align: right;">
                      <div style="font-weight: 900; color: #000; font-size: 14px; margin-bottom: 0px; line-height: 1.2;">${m.firstName} ${m.lastName}</div>
                      
                      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin: 2px 0;">
                        <div style="font-size: 12px; font-weight: 700; color: #444;">${m.calculatedDistance.toFixed(2)} ק"מ</div>
                        <img src="${m.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1px solid #eee;" />
                      </div>
                      
                      <div style="font-size: 10px; color: #777; font-weight: 700; margin-top: 2px; border-top: 1px solid #f5f5f5; padding-top: 4px; line-height: 1.1;">
                        ${m.full_address || m.city || 'לא צוינה'}
                      </div>
                    </div>
                  `;
                  found = true;
              }
          });
          if (!found) tooltip.style.display = 'none';
      };

      canvas.onmousemove = handleMouseMove as any;
      animationFrameId = requestAnimationFrame(render);
    };

    logoImg.onload = () => {
      animationFrameId = requestAnimationFrame(render);
    };
    
    // Start even if logo takes time
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.onmousemove = null;
    };
  }, [members, siteConfig]);

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
      .filter(m => !recentSessionParticipants.has(m.id));

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

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Activity className="w-12 h-12 text-blue-400 animate-pulse" />
        <p className="text-[#004D40] font-black uppercase tracking-widest animate-pulse">מנתח דופק קהילה...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative" dir="rtl">
      <div className="relative z-10 space-y-12">
        <div className="hidden">
          <h1 className="text-5xl md:text-7xl font-black text-[#7A1555] tracking-tighter leading-none uppercase drop-shadow-md">
            מבט על הקהילה
          </h1>
          <p className="max-w-2xl text-xl font-bold text-[#004D40]">
            ניתוח מעמיק של נתוני הקהילה, דמוגרפיה והתמדה.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="admin-info-card p-8 relative group min-h-[550px] flex flex-col items-center justify-center rounded-[3rem]"
          >
            {/* Background elements that need clipping */}
            <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--surfer-cyan)]/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            </div>
            
            <div className="w-full flex items-center justify-between mb-8 relative z-10 px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl glass-effect flex items-center justify-center text-[#004D40] shadow-inner border border-white/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#7A1555] tracking-tight">התפלגות חברים לפי גיל</h3>
                  <p className="text-[#000000] text-[8px] font-bold uppercase tracking-[0.3em] opacity-80">Community Aura • Ocean Analytics</p>
                </div>
              </div>
            </div>

            {/* Donut Chart Area */}
            <div className="w-full flex-1 relative flex items-center justify-center min-h-[350px]">
              <svg width="100%" height="100%" viewBox="50 50 900 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible max-w-[400px]">
                <defs>
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
                  const strokeWidth = 90; 
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
                          <circle cx={sx} cy={sy} r="2" fill="#000000" opacity="0.3" />
                          
                          <motion.path
                            d={`M ${sx} ${sy} L ${mx} ${my} L ${ex} ${ey}`}
                            fill="none"
                            stroke="#000000"
                            strokeWidth="1.5"
                            opacity="0.2"
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
                            fill="#4A0033" 
                            className="font-black text-3xl"
                          >
                            {Math.round(percentage * 100)}%
                          </text>
                          <text 
                            x={ex + (Math.cos(rad) > 0 ? 10 : -10)} 
                            y={ey + 28} 
                            textAnchor={Math.cos(rad) > 0 ? "start" : "end"} 
                            dominantBaseline="middle" 
                            fill="#000000" 
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
                  <circle cx="500" cy="500" r="230" fill="white" fillOpacity="0.8" />
                  
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
                      <Waves size={48} className="text-[#008080] mb-2" />
                      <span className="home-data-text text-xs font-black uppercase tracking-[0.4em] mb-2 opacity-60">Community Total</span>
                      <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="home-title text-8xl font-black tracking-tighter"
                      >
                        {stats.activeCount}
                      </motion.span>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-3 h-3 rounded-full bg-[#008080] animate-pulse shadow-sm" />
                        <span className="text-xs text-[#008080] font-black uppercase tracking-[0.2em]">Active Pulse</span>
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
            className="admin-info-card p-8 flex flex-col min-h-[550px] relative group rounded-[3rem]"
          >
            {/* Background elements that need clipping */}
            <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--surfer-cyan)]/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="w-12 h-12 rounded-xl glass-effect flex items-center justify-center text-[#004D40] shadow-inner border border-white/20">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black home-title tracking-tight">פיזור גיאוגרפי של החברים</h3>
                <p className="home-data-text text-[8px] font-bold uppercase tracking-[0.3em] opacity-60">Distance Distribution • Ocean Analytics</p>
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
                    tick={{ fill: '#000000', fontSize: 12, fontWeight: 900 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="admin-info-card p-3 rounded-xl border border-white/20">
                            <p className="text-xs font-black text-[#7A1555] mb-1">{payload[0].payload.label} ק"מ</p>
                            <p className="text-lg font-black text-[#004D40]">{payload[0].value} <span className="text-[12px] text-[#000000] opacity-80">חברים</span></p>
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
                <p className="text-[12px] font-black text-[#000000] uppercase tracking-widest mb-1 opacity-90">חי״ר (0-20 ק״מ)</p>
                <p className="text-xl font-black text-[#004D40] flex items-baseline gap-1">
                  {stats.near}
                  <span className="text-[12px] font-bold text-[#000000] opacity-80">חברים</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl glass-effect border border-white/20 shadow-sm group/stat hover:bg-white/10 transition-all">
                <p className="text-[12px] font-black text-[#000000] uppercase tracking-widest mb-1 opacity-90">שיריון (21-100 ק״מ)</p>
                <p className="text-xl font-black text-[#004D40] flex items-baseline gap-1">
                  {stats.medium}
                  <span className="text-[12px] font-bold text-[#000000] opacity-80">חברים</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl glass-effect border border-white/20 shadow-sm group/stat hover:bg-white/10 transition-all">
                <p className="text-[12px] font-black text-[#000000] uppercase tracking-widest mb-1 opacity-90">חיל אויר (100+ ק״מ)</p>
                <p className="text-xl font-black text-[#004D40] flex items-baseline gap-1">
                  {stats.far}
                  <span className="text-[12px] font-bold text-[#000000] opacity-80">חברים</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Churn & Retention Card - Moved here per user request */}
        <motion.div 
          whileHover={{ scale: 1.005 }}
          className="admin-info-card p-10 rounded-[3rem] transition-all duration-500 relative group lg:col-span-2"
        >
          {/* Background elements that need clipping */}
          <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
            {/* Glossy Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          
          <div className="grid grid-cols-1 gap-12">
            
            {/* Low Pulse List */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl glass-effect flex items-center justify-center text-[var(--surfer-pink)] shadow-inner border border-white/10">
                    <UserMinus size={20} />
                  </div>
                  <h4 className="text-xl font-black text-[#7A1555] tracking-tight">דופק נמוך (בסיכון נטישה)</h4>
                </div>
                <span className="text-[12px] font-black text-[#000000] uppercase tracking-widest glass-effect px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
                  לא נראו מעל 30 יום ({stats.lowPulseMembers.length})
                </span>
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar pl-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {stats.lowPulseMembers.length > 0 ? (
                    stats.lowPulseMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-6 rounded-2xl admin-info-card border border-white/20 hover:bg-white/10 transition-all group/item shadow-lg">
                        <div className="flex items-center gap-4">
                          <img 
                            src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}&background=random`} 
                            alt="" 
                            className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-inner object-cover"
                          />
                          <div>
                            <p className="text-base font-black text-[#7A1555]">{member.firstName} {member.lastName}</p>
                            <p className="text-[12px] font-bold text-[#000000] italic">פעם אחרונה: {member.joinedAt}</p>
                          </div>
                        </div>
                        <button className="p-3 rounded-xl glass-effect text-[#004D40] opacity-0 group-hover/item:opacity-100 transition-all hover:bg-white/20">
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-12 text-center border border-dashed border-white/20 rounded-3xl glass-effect">
                      <p className="text-[#000000] font-black uppercase tracking-[0.3em] text-sm">כל החברים פעילים בדופק גבוה ✨</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </motion.div>




        {/* Churn Buckets Section - Unified Background */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 admin-info-card p-10 rounded-[4rem] mt-12 relative overflow-hidden group"
        >
          {/* Glossy Shimmer for the whole container */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-30 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl glass-effect flex items-center justify-center text-[var(--surfer-pink)] shadow-inner border border-white/10">
                <UserMinus size={24} />
              </div>
              <div>
                <h3 className="text-[#7A1555] font-black text-2xl md:text-3xl tracking-tighter uppercase">שיעורי עזיבה Churn rate</h3>
                <p className="text-[#000000] text-[12px] tracking-[0.3em] mt-1 font-black uppercase">COMMUNITY INSIGHTS • ATTRITION</p>
              </div>
            </div>
          </div>

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

        {/* Community Radius Widget */}
        <div className="admin-info-card p-8 rounded-[3rem] border border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex flex-col items-center mt-8 relative overflow-hidden backdrop-blur-xl bg-white/30">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--surfer-cyan)]/10 to-transparent pointer-events-none" />
          
          <h3 className="text-3xl font-black text-[#000000] tracking-tight mb-8 z-10" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>רדיוס הקהילה</h3>
          
          <div className="w-[450px] relative darts-wrapper flex flex-col items-center z-10">
            <canvas ref={canvasRef} id="dartsBoard" width="450" height="450" className="rounded-full" />
            <div id="darts-tooltip" ref={tooltipRef} className="absolute hidden pointer-events-none z-50 whitespace-pre-line text-sm text-center"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export const Astrodeck = ({ label, value, icon: Icon, path, external, color, neoBrutal }: { 
  label: string; 
  value: string | number; 
  icon: any; 
  path: string; 
  external?: boolean;
  color: string;
  neoBrutal?: boolean;
}) => {
  const padPath = "M 135 38 Q 80 45 40 60 C 30 150 60 250 100 320 C 120 360 160 380 185 380 L 185 330 C 185 300 135 300 135 250 Z M 145 35 Q 200 20 255 35 L 245 250 C 245 290 155 290 155 250 Z M 265 38 Q 320 45 360 60 C 370 150 340 250 300 320 C 280 360 240 380 215 380 L 215 330 C 215 300 265 300 265 250 Z";

  return (
    <Link 
      to={path} 
      target={external ? "_blank" : undefined} 
      className={`block h-full group relative w-full aspect-square max-w-[266px] mx-auto transition-all duration-300 ${neoBrutal ? 'hover:translate-x-[2px] hover:translate-y-[2px]' : 'hover:scale-105 hover:-translate-y-2'}`}
    >
      <svg viewBox="0 0 400 400" className={`w-full h-full ${neoBrutal ? 'admin-info-card' : 'backdrop-blur-[10px] rounded-[24px]'}`}>
        <defs>
          <pattern id="diamond-pad-texture" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="rgba(0,0,0,0.05)" />
            <path d="M8 2 L14 8 L8 14 L2 8 Z" fill="rgba(0,0,0,0.1)" />
            <circle cx="8" cy="8" r="2" fill="rgba(0,0,0,0.1)" />
          </pattern>

          <radialGradient id="glass-lens-pad" cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="70%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0.0" />
          </radialGradient>

          <linearGradient id="glass-shine-pad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0.0" />
          </linearGradient>

          <filter id="rough-texture-pad">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#ffffff" surfaceScale="2.5">
              <feDistantLight azimuth="45" elevation="45" />
            </feDiffuseLighting>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Background Pad */}
        <path 
          d={padPath} 
          fill="url(#diamond-pad-texture)" 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth="1"
        />

        {/* Base Color Fill */}
        <path d={padPath} fill="rgba(0, 112, 133, 0.05)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeLinejoin="round" />
        
        {/* Glassmorphism Overlay */}
        <path d={padPath} fill="url(#glass-lens-pad)" opacity="0.8" className="pointer-events-none" />
        <path d={padPath} fill="url(#glass-shine-pad)" opacity="0.6" className="pointer-events-none" />

        {/* Grip Bars Overlay */}
        <g fill="rgba(0,0,0,0.1)" opacity="0.1" pointerEvents="none">
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

        {/* Rough Texture Overlay */}
        <path d={padPath} fill="#121212" filter="url(#rough-texture-pad)" opacity="0.1" className="pointer-events-none" />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 pointer-events-none">
        <Icon size={32} className={`mb-3 ${color} transition-transform duration-500 group-hover:scale-110`} />
        <p className="text-4xl font-black home-metric mb-1 leading-none">{value}</p>
        <p className="text-[12px] font-black uppercase tracking-widest home-label mt-1 text-center">{label}</p>
      </div>
    </Link>
  );
};

export default CommunityAnalytics;
