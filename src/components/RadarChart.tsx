import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import { calculateUserStats } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';

interface RadarChartProps {
  userId?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({ userId }) => {
  const { weeklyHistory, members, yearConfig } = useData();
  const { currentUser } = useAuth();
  
  const targetUserId = userId || currentUser?.id;

  const data = useMemo(() => {
    if (!targetUserId || !members || !weeklyHistory) return [];

    const stats = calculateUserStats(targetUserId, members, weeklyHistory, yearConfig);
    
    if (!stats) return [];
    
    // Normalize values for the radar chart (0-100)
    // We'll use: Grit, Consistency, Attendance, Stability, and a mock 'Skill' or 'Progress'
    return [
      { subject: 'Grit', A: Math.min(stats.gritScore, 100), fullMark: 100 },
      { subject: 'Consistency', A: Math.min(stats.attendancePercent, 100), fullMark: 100 },
      { subject: 'Attendance', A: Math.min((stats.totalSessions / 50) * 100, 100), fullMark: 100 },
      { subject: 'Stability', A: Math.min(stats.yearlyStability.percent, 100), fullMark: 100 },
      { subject: 'Progress', A: Math.min((stats.totalSessions / 20) * 100, 100), fullMark: 100 },
    ];
  }, [targetUserId, members, weeklyHistory, yearConfig]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 font-yehuda">
        No data available for radar
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Heebo' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
          />
          <Radar
            name="Surfer Stats"
            dataKey="A"
            stroke="#00E5FF"
            fill="#00E5FF"
            fillOpacity={0.4}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
