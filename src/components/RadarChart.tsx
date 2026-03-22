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

    const getStats = (id: string) => calculateUserStats(id, members, weeklyHistory, yearConfig);
    
    const userStats = getStats(targetUserId);

    const mapStats = (stats: any | null) => {
      if (!stats) return { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
      return {
        A: Math.min(10, stats.gritScore / 10),
        B: Math.min(10, stats.attendancePercent / 10),
        C: Math.min(10, stats.streak),
        D: Math.min(10, stats.percentile / 10),
        E: Math.min(10, stats.attendance.sea / 5),
        F: Math.min(10, stats.overallProgressPercent / 10),
      };
    };

    const userMap = mapStats(userStats);

    return [
      { subject: 'קריאת ים', A: userMap.A },
      { subject: 'בחירת גל', A: userMap.B },
      { subject: 'התמדה', A: userMap.C },
      { subject: 'נחישות', A: userMap.D },
      { subject: 'טכניקה ושליטה', A: userMap.E },
      { subject: 'Flow וסטייל', A: userMap.F },
    ];
  }, [targetUserId, members, weeklyHistory, yearConfig]);

  const userName = members.find(m => m.id === targetUserId)?.firstName || 'אני';

  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <text 
        x={x} 
        y={y} 
        textAnchor="middle" 
        dominantBaseline="central"
        fill="#003366" 
        fontSize="10" 
        fontWeight="700"
        fontFamily="'Inter', sans-serif"
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className="w-full h-[500px]">
      <div className="flex flex-wrap gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#003366] rounded-full opacity-60"></div><span className="text-[#003366] font-medium font-['Inter',sans-serif]">{userName}</span></div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="45%" outerRadius="101%" data={data}>
          <PolarGrid stroke="#e2e8f0" strokeOpacity={1} gridCount={10} gridType="circle" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#003366', fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif" }} />
          <PolarRadiusAxis 
            angle={210} 
            domain={[0, 10]} 
            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={<CustomTick />} 
            axisLine={false}
          />
          
          <Radar name={userName} dataKey="A" stroke="#003366" fill="#003366" fillOpacity={0.4} />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
