import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { Target } from 'lucide-react';

interface ConsistencyRankWidgetProps {
  userSessions: number;
}

const ConsistencyRankWidget: React.FC<ConsistencyRankWidgetProps> = ({ userSessions }) => {
  const [percentile, setPercentile] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats/community/attendance')
      .then(res => res.json())
      .then(data => {
        const counts: number[] = data.counts;
        if (counts.length === 0) {
          setPercentile(0);
          return;
        }
        
        // Calculate percentile: how many members have fewer or equal sessions
        const smaller = counts.filter(c => c <= userSessions).length;
        const p = Math.round((smaller / counts.length) * 100);
        setPercentile(p);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching community attendance:', err);
        setLoading(false);
      });
  }, [userSessions]);

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
          margin: 5, // margin is in pixels
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

  if (loading) return <div className="h-48 flex items-center justify-center text-slate-400 font-bold">מחשב דירוג התמדה...</div>;

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center" dir="rtl">
      <div className="flex items-center gap-2 mb-4 text-[#006994]">
        <Target size={20} />
        <h3 className="text-lg font-black tracking-tight">מדד ההתמדה שלי</h3>
      </div>
      
      <div className="w-full max-w-[300px]">
        <Chart 
          options={chartOptions} 
          series={[percentile || 0]} 
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
