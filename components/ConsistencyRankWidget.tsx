import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Target } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface ConsistencyRankWidgetProps {
  userSessions: number;
}

const ConsistencyRankWidget: React.FC<ConsistencyRankWidgetProps> = ({ userSessions }) => {
  const { members, weeklyHistory, yearConfig, isLoading } = useData();

  const percentile = useMemo(() => {
    if (isLoading || !members.length) return null;

    // Filter sessions from shnatHevelZug onwards
    const startDate = yearConfig?.startDate ? new Date(yearConfig.startDate) : new Date(0);
    
    // Calculate total sessions for each member from history
    const memberSessionCounts = members.map(member => {
      // Count how many sessions in history this member attended after startDate
      const count = weeklyHistory.filter(session => {
        const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
        return sessionDate >= startDate && session.participantIds?.includes(member.id);
      }).length;
      return count;
    });

    if (memberSessionCounts.length === 0) return 0;

    // Calculate percentile: how many members have fewer or equal sessions
    const smaller = memberSessionCounts.filter(c => c <= userSessions).length;
    return Math.round((smaller / memberSessionCounts.length) * 100);
  }, [members, weeklyHistory, yearConfig, userSessions, isLoading]);

  const chartOptions: any = {
    chart: {
      type: 'radialBar',
      offsetY: -20,
      sparkline: {
        enabled: true
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "#e7e7e7",
          strokeWidth: '97%',
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            offsetY: -2,
            fontSize: '22px',
            fontWeight: '900',
            color: '#0f172a',
            formatter: (val: number) => `${val}%`
          }
        }
      }
    },
    grid: {
      padding: {
        top: -10
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        shadeIntensity: 0.4,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 100],
        colorStops: [
          {
            offset: 0,
            color: "#3b82f6", // Blue
            opacity: 1
          },
          {
            offset: 50,
            color: "#f59e0b", // Orange
            opacity: 1
          },
          {
            offset: 100,
            color: "#ef4444", // Red
            opacity: 1
          }
        ]
      },
    },
    labels: ['התמדה'],
  };

  if (isLoading || percentile === null) return <div className="h-48 flex items-center justify-center text-slate-400 font-bold">מחשב דירוג התמדה...</div>;

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center" dir="rtl">
      <div className="flex items-center gap-2 mb-4 text-[#006994]">
        <Target size={20} />
        <h3 className="text-lg font-black tracking-tight">מדד ההתמדה שלי</h3>
      </div>
      
      <div className="w-full max-w-[300px]">
        <Chart 
          options={chartOptions} 
          series={[percentile]} 
          type="radialBar" 
          height={240} 
        />
      </div>

      <div className="text-center mt-2">
        <p className="text-slate-500 font-bold">
          אתה מתמיד יותר מ-<span className="text-[#006994] text-xl font-black">{percentile}%</span> מחברי הקהילה
        </p>
        <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-2 font-black">
          מבוסס על סך הכל סשנים בים
        </p>
      </div>
    </div>
  );
};

export default ConsistencyRankWidget;
