import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ComposedChart, Bar, Cell } from 'recharts';
import { Waves, Sun, Snowflake, Leaf, Loader2, Calendar } from 'lucide-react';
import { fetchJson } from '../utils/apiUtils';
import { useData } from '../contexts/DataContext';
import { calculateSeasonalGrit } from '../utils/analytics';
import { getBodyLineStats } from '../utils/bodyLineStats';

export const OceanPulse: React.FC = () => {
  const { weeklyHistory, members } = useData();
  const [loading, setLoading] = useState(true);
  const [currentOceanData, setCurrentOceanData] = useState<any>(null);
  const [correlationData, setCorrelationData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Helper to safely parse dates from Firestore (Timestamp or plain object from cache)
        const parseDate = (date: any) => {
          if (!date) return new Date(NaN);
          if (typeof date.toDate === 'function') return date.toDate();
          if (typeof date.seconds === 'number') return new Date(date.seconds * 1000);
          return new Date(date);
        };

        // 1. Fetch current data
        try {
          const data = await fetchJson('/api/ocean-data');
          setCurrentOceanData(data);
        } catch (err: any) {
          if (err.message !== 'SERVER_STARTING') {
            console.error('Error fetching current ocean data:', err);
          }
        }

        // 2. Fetch historical data for correlation
        if (weeklyHistory && weeklyHistory.length > 0) {
          // Filter out sessions with missing or invalid dates, and future dates
          const now = new Date();
          const validHistory = weeklyHistory.filter(session => {
            const d = parseDate(session.date);
            const isValid = d instanceof Date && !isNaN(d.getTime()) && d <= now;
            return isValid;
          });

          console.log('OceanPulse: Total history:', weeklyHistory.length);
          console.log('OceanPulse: Valid history:', validHistory.length);

          if (validHistory.length === 0) {
            console.warn('OceanPulse: No valid history found for correlation chart');
            setLoading(false);
            return;
          }

          // Sort by date ascending for the chart
          const sortedHistory = [...validHistory]
            .sort((a, b) => {
              const dateA = parseDate(a.date) || new Date(0);
              const dateB = parseDate(b.date) || new Date(0);
              return dateA.getTime() - dateB.getTime();
            });

          const firstDate = parseDate(sortedHistory[0].date);
          const lastDate = parseDate(sortedHistory[sortedHistory.length - 1].date);

          if (!firstDate || !lastDate || isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
            setLoading(false);
            return;
          }

          // Format dates for API (YYYY-MM-DD)
          const formatDateForApi = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          const startDate = formatDateForApi(firstDate);
          const endDate = formatDateForApi(lastDate);

          console.log(`OceanPulse: Fetching historical data from ${startDate} to ${endDate}`);

          try {
            const hData = await fetchJson(`/api/ocean-data/historical?start=${startDate}&end=${endDate}`);
            
            if (hData && hData.hourly) {
              const hourlyTemps = hData.hourly;

              const combined = sortedHistory.map(session => {
                const sDate = parseDate(session.date);
                if (!sDate) return null;

                const dateStr = formatDateForApi(sDate);
                
                // Find temp for this date (try 07:00 first, then any time on that day)
                let timeIndex = hourlyTemps.time.findIndex((t: string) => t.startsWith(`${dateStr}T07:00`));
                
                // Fallback to first available hour for that day if 07:00 is missing
                if (timeIndex === -1) {
                  timeIndex = hourlyTemps.time.findIndex((t: string) => t.startsWith(dateStr));
                }

                const temp = timeIndex !== -1 ? hourlyTemps.sea_surface_temperature[timeIndex] : null;

                return {
                  date: sDate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
                  temp: temp,
                  tempCold: temp !== null && temp < 20 ? temp : null,
                  tempModerate: temp !== null && temp >= 20 && temp <= 26 ? temp : null,
                  tempHot: temp !== null && temp > 26 ? temp : null,
                  attendance: session.participantsCount || 0
                };
              }).filter(item => item !== null);

              console.log('OceanPulse: Combined correlation data points:', combined.length);
              setCorrelationData(combined as any[]);
            }
          } catch (err: any) {
            if (err.message !== 'SERVER_STARTING') {
              console.error('Error fetching historical ocean data:', err);
            }
          }
        } else {
          console.log('OceanPulse: weeklyHistory is empty or null');
        }
      } catch (err) {
        console.error('Error fetching ocean data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [weeklyHistory]);

  const seasonalGrit = useMemo(() => {
    const calculatedScores = calculateSeasonalGrit(weeklyHistory, members);
    
    const seasonsConfig = [
      { name: 'סתיו', icon: Waves, color: 'var(--surfer-orange)' },
      { name: 'חורף', icon: Snowflake, color: 'var(--surfer-cyan)' },
      { name: 'אביב', icon: Leaf, color: 'var(--surfer-teal)' },
      { name: 'קיץ', icon: Sun, color: 'var(--surfer-yellow)' },
    ];

    return seasonsConfig.map(config => {
      const scoreData = calculatedScores.find(s => s.name === config.name);
      return {
        ...config,
        score: scoreData ? scoreData.score : 0
      };
    });
  }, [weeklyHistory]);

  const getThermalColor = (temp: number | null) => {
    if (temp === null) return '#ccc';
    
    // Green (#2ECC71) to Yellow (#F1C40F) to Red (#E74C3C)
    // Range: 15 to 30
    const min = 15;
    const mid = 22.5;
    const max = 30;
    
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
    const t = clamp(temp, min, max);
    
    if (t < mid) {
      // Interpolate Green to Yellow
      const ratio = (t - min) / (mid - min);
      // Simple interpolation for demonstration
      return ratio > 0.5 ? '#F1C40F' : '#2ECC71';
    } else {
      // Interpolate Yellow to Red
      const ratio = (t - mid) / (max - mid);
      return ratio > 0.5 ? '#E74C3C' : '#F1C40F';
    }
  };

  if (loading) {
    return (
      <div className="home-glass-card p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#000000]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Correlation Chart */}
      <div className="home-glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[var(--surfer-cyan)]/20 rounded-xl border border-white/20 shadow-sm">
            <Calendar className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={20} />
          </div>
          <h3 className="text-2xl font-black text-[#000000]" style={{ fontFamily: "var(--primary-font)" }}>קורלציית טמפרטורה לנוכחות בסשנים</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#000" 
                fontSize={12} 
                fontFamily="Inter"
                fontWeight="bold"
              />
              <YAxis 
                yAxisId="left"
                stroke="#000000" 
                fontSize={12} 
                fontFamily="Inter"
                fontWeight="bold"
                label={{ value: "טמפ' מים (C°)", angle: -90, position: 'insideLeft', style: { fill: '#000000', fontWeight: 'bold' } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#000000" 
                fontSize={12} 
                fontFamily="Inter"
                fontWeight="bold"
                label={{ value: 'מספר משתתפים', angle: 90, position: 'insideRight', style: { fill: '#000000', fontWeight: 'bold' } }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: '2px solid #000', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar 
                yAxisId="right"
                dataKey="attendance" 
                name="נוכחות"
                fill="#f59e0b"
                fillOpacity={0.8}
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="temp" 
                name="טמפרטורת מים"
                stroke="#cbd5e1" 
                strokeWidth={2} 
                dot={false}
                activeDot={false}
                legendType="none"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="tempCold" 
                name="טמפרטורת מים (קר)"
                stroke="#0ea5e9" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 10 }}
                connectNulls={false}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="tempModerate" 
                name="טמפרטורת מים (מתון)"
                stroke="#22c55e" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 10 }}
                connectNulls={false}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="tempHot" 
                name="טמפרטורת מים (חם)"
                stroke="#ef4444" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 10 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
          <p className="text-sm text-[#000000]/70 font-medium leading-relaxed" style={{ fontFamily: "var(--primary-font)" }}>
            גרף זה מציג את הקשר בין טמפרטורת המים ביום הסשן (נמדד ב-07:00 בבוקר) לבין כמות המשתתפים שהגיעו בפועל. 
            ניתן לראות מגמות עונתיות והשפעה של תנאי הים על היענות הקהילה.
          </p>
        </div>
      </div>
    </div>
  );
};
