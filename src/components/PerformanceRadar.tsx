import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { PerformanceScore } from '../types';
import { calculateMonthlyAverages } from '../utils/performanceUtils';

interface PerformanceRadarProps {
  scores: PerformanceScore[];
}

const PARAMETERS = [
  { key: 'paddle', label: 'יעילות החתירה' },
  { key: 'positioning', label: 'קריאת גלים' },
  { key: 'takeOff', label: 'Take-off ודרופ' },
  { key: 'style', label: 'זרימה וחיבור' },
  { key: 'turns', label: 'שליטה בציוד' },
  { key: 'stamina', label: 'חוסן מנטלי' },
];

const MONTH_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
  '#C9CBCF', '#7BC225', '#FF4500', '#DA70D6', '#20B2AA', '#F0E68C'
];

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ scores }) => {
  if (!scores || scores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/5 rounded-xl border border-white/10">
        <p className="text-white/50">אין נתוני ביצועים להצגה</p>
      </div>
    );
  }

  // Sort scores by year and month
  const averagedScores = calculateMonthlyAverages(scores.filter(s => s.year !== undefined && s.month !== undefined));
  const sortedScores = [...averagedScores].sort((a, b) => {
    if (a.year !== b.year) return (a.year || 0) - (b.year || 0);
    return (a.month || 0) - (b.month || 0);
  }).slice(-6); // Take only the last 6 months

  // Prepare data for Recharts
  // Recharts RadarChart expects data in the format:
  // [ { subject: 'חתירה', month1: 8, month2: 9 }, ... ]
  const data = PARAMETERS.map(param => {
    const entry: any = { subject: param.label };
    sortedScores.forEach(score => {
      if (score.month === undefined || score.year === undefined) return;
      const key = `${score.month}/${score.year}`;
      entry[key] = (score as any)[param.key];
    });
    return entry;
  });

  console.log('Radar Data:', data);
  console.log('Sorted Scores:', sortedScores);

  return (
    <div className="w-full min-w-0 h-[520px] bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
      <div className="text-white text-xs">DEBUG: {sortedScores.length} scores</div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 10]} 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            axisLine={false}
          />
          
          {sortedScores.map((score, index) => {
            if (score.month === undefined || score.year === undefined) return null;
            const key = `${score.month}/${score.year}`;
            const color = MONTH_COLORS[(score.month - 1) % MONTH_COLORS.length];
            const name = `${MONTH_NAMES[score.month - 1]} ${score.year}`;
            return (
              <Radar
                key={key}
                name={name}
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.3}
              />
            );
          })}
          
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
