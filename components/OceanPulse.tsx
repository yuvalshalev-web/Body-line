import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ComposedChart, Bar } from 'recharts';
import { Waves, Sun, Snowflake, Leaf, Loader2, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const OceanPulse: React.FC = () => {
  const { weeklyHistory } = useData();
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
        const currentRes = await fetch('/api/ocean-data');
        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrentOceanData(data);
        }

        // 2. Fetch historical data for correlation
        if (weeklyHistory && weeklyHistory.length > 0) {
          // Filter out sessions with missing or invalid dates
          const validHistory = weeklyHistory.filter(session => {
            const d = parseDate(session.date);
            return d instanceof Date && !isNaN(d.getTime());
          });

          if (validHistory.length === 0) {
            setLoading(false);
            return;
          }

          // Sort by date ascending for the chart
          const sortedHistory = [...validHistory]
            .sort((a, b) => {
              const dateA = parseDate(a.date);
              const dateB = parseDate(b.date);
              return dateA.getTime() - dateB.getTime();
            })
            .slice(-12); // Last 12 sessions

          const firstDate = parseDate(sortedHistory[0].date);
          const lastDate = parseDate(sortedHistory[sortedHistory.length - 1].date);

          if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
            setLoading(false);
            return;
          }

          const startDate = firstDate.toISOString().split('T')[0];
          const endDate = lastDate.toISOString().split('T')[0];

          const historyRes = await fetch(`/api/ocean-data/historical?start=${startDate}&end=${endDate}`);
          if (historyRes.ok) {
            const hData = await historyRes.json();
            const hourlyTemps = hData.hourly;

            const combined = sortedHistory.map(session => {
              const sDate = parseDate(session.date);
              const dateStr = sDate.toISOString().split('T')[0];
              
              // Find temp for this date (at 07:00 as per session time)
              const timeIndex = hourlyTemps.time.findIndex((t: string) => t.startsWith(`${dateStr}T07:00`));
              const temp = timeIndex !== -1 ? hourlyTemps.sea_surface_temperature[timeIndex] : null;

              return {
                date: sDate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }),
                temp: temp,
                attendance: session.participantsCount || 0
              };
            });

            setCorrelationData(combined);
          }
        }
      } catch (err) {
        console.error('Error fetching ocean data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [weeklyHistory]);

  const seasonalData = [
    { season: 'אביב', retention: '88%', icon: Leaf },
    { season: 'קיץ', retention: '95%', icon: Sun },
    { season: 'סתיו', retention: '82%', icon: Waves },
    { season: 'חורף', retention: '75%', icon: Snowflake },
  ];

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
          <div className="p-3 bg-[var(--surfer-cyan)]/20 rounded-[8px] border border-black/10 shadow-sm">
            <Calendar className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={20} />
          </div>
          <h3 className="text-2xl font-black text-[#000000]" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>קורלציית טמפרטורה לנוכחות בסשנים</h3>
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
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="temp" 
                name="טמפרטורת מים"
                stroke="#000000" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#000000', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 10 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 p-4 bg-white/10 rounded-xl border border-black/10">
          <p className="text-sm text-[#000000]/70 font-medium leading-relaxed" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>
            גרף זה מציג את הקשר בין טמפרטורת המים ביום הסשן (נמדד ב-07:00 בבוקר) לבין כמות המשתתפים שהגיעו בפועל. 
            ניתן לראות מגמות עונתיות והשפעה של תנאי הים על היענות הקהילה.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {seasonalData.map((s, i) => (
          <div key={i} className="home-glass-card p-6 flex flex-col items-center justify-center gap-4">
            <div className="p-3 bg-[var(--surfer-cyan)]/20 rounded-[8px] border border-black/10 shadow-sm">
              <s.icon className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={24} />
            </div>
            <span className="text-lg font-black text-[#000000]" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>{s.season}</span>
            <span className="text-3xl font-black text-[#000000]">{s.retention}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
