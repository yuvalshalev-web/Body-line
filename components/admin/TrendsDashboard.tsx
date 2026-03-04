
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
import { Activity, LayoutGrid, Maximize2 } from 'lucide-react';
import { getOperationalXAxisProps } from '../../src/utils/chartHelpers';
import OperationalChartHeader from '../OperationalChartHeader';
import { calculateDistance } from '../../utils/distanceCalculator';

const TrendsDashboard: React.FC = () => {
  const { members, weeklyHistory, yearConfig, siteAssets, siteConfig } = useData();
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
    const maxRadius = 140; // רדיוס הטבעת החיצונית

    // Home Break Coords
    const homeLat = siteConfig.home_break?.lat;
    const homeLng = siteConfig.home_break?.lng;

    // Load Logo
    const logoImg = new Image();
    logoImg.src = siteAssets?.logo || 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png'; // Fallback to a generic surf icon if no logo

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

      // Draw Logo in center
      if (logoImg.complete) {
        const logoSize = 40;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
        ctx.restore();
        
        // Logo border
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoSize / 2, 0, Math.PI * 2);
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
          if (homeLat && homeLng && member.lat && member.lng) {
            distance = calculateDistance(homeLat, homeLng, member.lat, member.lng);
          } else {
            // Mock distance if no real address data
            distance = member.distance || (Math.random() * 30);
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

          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ff3e00'; // צבע הנקודה
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();

          return { ...member, canvasX: x, canvasY: y, calculatedDistance: distance };
      });

      // 3. הוספת אינטראקציה (נגיעה/עכבר)
      const handleMouseMove = (e: MouseEvent) => {
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const tooltip = tooltipRef.current;
          
          if (!tooltip) return;

          let found = false;
          membersWithCanvasPos.forEach(m => {
              const dist = Math.sqrt((mouseX - m.canvasX)**2 + (mouseY - m.canvasY)**2);
              if (dist < 7) {
                  tooltip.style.display = 'block';
                  tooltip.style.left = mouseX + 10 + 'px';
                  tooltip.style.top = mouseY + 10 + 'px';
                  tooltip.innerText = `${m.firstName} ${m.lastName}\n${m.calculatedDistance.toFixed(2)} ק"מ מהחוף`;
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
    while (iter <= endDate && safety < 400) {
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
            // Mock data for future/missing weeks to maintain the trend visualization
            const seed = (safety * 7) % 100;
            weekEntry[group.id] = iter > today ? null : (40 + Math.sin(safety / 5) * 20 + (seed % 10));
            weekEntry[`${group.id}_count`] = iter > today ? null : Math.floor(Math.random() * 20);
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
          <p className="text-[10px] font-bold text-blue-300 mb-2">חודש {data.activityMonth} לשנת חבל זוג</p>
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
                    <p className="text-[10px] font-bold text-slate-400 mr-4">
                      מספר משתתפים בפועל: {entry.payload[`${entry.dataKey}_count`]}
                    </p>
                  )}
                </div>
              );
            })}
            <p className="text-[10px] font-bold text-slate-500 mt-2 pt-2 border-t border-white/5">
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
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-soft">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#2B2B2E] tracking-tight">דשבורד טרנדים והתמדה</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ניתוח שנת חבל זוג • 7 קבוצות מיקוד</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="theme-switch-container m-0">
              <span className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'unified' ? 'text-indigo-600' : 'text-slate-400'}`}>
                גרף מאוחד
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={viewMode === 'split'} 
                  onChange={handleViewToggle}
                />
                <span className="slider"></span>
              </label>
              <span className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'split' ? 'text-indigo-600' : 'text-slate-400'}`}>
                גרף מפוצל
              </span>
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

      {/* Charts Area */}
      <AnimatePresence mode="wait">
        {viewMode === 'unified' ? (
          <motion.div
            key="unified"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-soft h-[500px]"
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {groups.map(group => (
              <div key={group.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-soft h-[250px] flex flex-col">
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
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-soft flex flex-col items-center">
        <h3 className="text-xl font-black text-[#2B2B2E] tracking-tight mb-6 w-full text-right">רדיוס הקהילה</h3>
        <div className="w-[350px] relative darts-wrapper flex flex-col items-center">
          <h4 className="text-center mb-4">פיזור גיאוגרפי</h4>
          <canvas ref={canvasRef} id="dartsBoard" width="350" height="350" className="rounded-full" />
          <div id="darts-tooltip" ref={tooltipRef} className="absolute hidden pointer-events-none z-50 whitespace-pre-line text-sm text-center"></div>
        </div>
      </div>
    </div>
  );
};

export default TrendsDashboard;
