import React, { useMemo, useState } from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useData } from '../contexts/DataContext';
import { calculateUserStats } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';
import { calculateMonthlyAverages } from '../utils/performanceUtils';

const RADAR_PARAMETERS = [
  {
    key: 'paddle',
    label: 'יעילות החתירה',
    fullLabel: 'יעילות החתירה והתנהלות במים (Paddling & Positioning)',
    tooltip: 'זהו הפרמטר המזוקק ביותר. גולש ברמה גבוהה לא "נלחם" בים. הוא יודע להשתמש בזרמים כדי לצאת לליין-אפ, הוא חותר בתנועות ארוכות ושקטות, והוא תמיד נמצא במקום הנכון (ה-Peak) בלי להוציא אנרגיה מיותרת. היכולת להגיע לגל ב-3 חתירות חזקות במקום 10 חלשות היא סימן מובהק לרמה.'
  },
  {
    key: 'positioning',
    label: 'קריאת גלים',
    fullLabel: 'קריאת גלים ובחירת הסדרות (Wave Reading)',
    tooltip: 'חובבן חותר לכל מה שזז. גולש מנוסה יודע לסרוק את האופק, לזהות איזו סדרה (Set) מתקרבת, ולדעת מראש אם הגל הולך להיסגר (Close-out) או להיפתח. היכולת "לראות" את הקו של הגל עוד לפני שהוא נשבר היא מה שמאפשר לך למקסם כל כניסה למים.'
  },
  {
    key: 'takeOff',
    label: 'Take-off ודרופ',
    fullLabel: 'איכות ה-Take-off והדרופ (The Drop)',
    tooltip: 'המעבר משכיבה לעמידה הוא המנוע של הגל. ברמה גבוהה, ה-Pop-up הוא תנועה אחת חלקה שמשלבת את הירידה במדרון הגל. ככל שהרמה עולה, הגולש מסוגל לבצע דרופים בזוויות תלולות יותר ועדיין לשמור על יציבות ומרכז כובד נמוך, מה שנותן לו מהירות התחלתית גבוהה.'
  },
  {
    key: 'style',
    label: 'זרימה וחיבור',
    fullLabel: 'זרימה וחיבור קטעים (Flow & Speed Generation)',
    tooltip: 'זהו ה"סטייל". גולש טוב יודע לחבר בין חלקי הגל השונים מבלי להיתקע. זה כולל את היכולת לייצר מהירות (Pumping) בקטעים שטוחים כדי להגיע לקטע הבא של הגל. אם הגלישה נראית רציפה, ללא תנועות ידיים מיותרות או איבודי שיווי משקל, הרמה גבוהה.'
  },
  {
    key: 'turns',
    label: 'שליטה בציוד',
    fullLabel: 'שליטה בציוד והתאמה לתנאים (Equipment Mastery)',
    tooltip: 'היכולת להבין איזה גלשן מתאים לאיזה יום היא קריטית. גולש ברמה גבוהה יודע למצות את המקסימום מהציוד שלו – בין אם זה גלשן רך עם נפח גבוה לימים רגועים או גלשן ביצועים לים חזק. השליטה בציוד מתבטאת ביכולת לתמרן את הגלשן בדיוק לאן שהעיניים מביטות.'
  },
  {
    key: 'stamina',
    label: 'חוסן מנטלי',
    fullLabel: 'חוסן מנטלי ואתיקה (Mental Game & Etiquette)',
    tooltip: 'הים הוא סביבה תחרותית ולפעמים מלחיצה. גולש ברמה גבוהה הוא גולש רגוע. הוא מכיר את חוקי הקדימות, מכבד את שאר הגולשים בליין-אפ, ולא נכנס לפאניקה כשסט גבוה נשבר עליו. הביטחון העצמי השקט הזה מאפשר קבלת החלטות טובה יותר ברגע האמת.'
  }
];

interface RadarChartProps {
  userId?: string;
}

const CustomAngleTick = (props: any) => {
  const { x, y, payload, setTooltipData, cx, cy } = props;
  const param = RADAR_PARAMETERS.find(p => p.label === payload.value);
  
  return (
    <g 
      onMouseEnter={() => setTooltipData({ param, x, y, cx, cy })}
      onMouseLeave={() => setTooltipData(null)}
      style={{ cursor: 'help' }}
    >
      <text 
        x={x} 
        y={y} 
        textAnchor="middle" 
        dominantBaseline="central"
        fill="#003366" 
        fontSize="13" 
        fontWeight="600"
        fontFamily="'Inter', sans-serif"
      >
        {payload.value}
      </text>
      <circle cx={x} cy={y + 16} r={7} fill="#003366" opacity={0.8} />
      <text x={x} y={y + 16} fill="white" fontSize="10" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontFamily="serif">i</text>
    </g>
  );
};

const MONTH_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
];

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const CustomLegend = ({ payload, hiddenKeys, onClick }: any) => {
  return (
    <ul className="list-none p-0 m-0 text-right" style={{ direction: 'rtl' }}>
      {payload.map((entry: any, index: number) => (
        <li
          key={`item-${index}`}
          className="flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105"
          style={{ 
            opacity: hiddenKeys.has(entry.dataKey) ? 0.3 : 1,
            textDecoration: hiddenKeys.has(entry.dataKey) ? 'line-through' : 'none'
          }}
          onClick={() => onClick(entry)}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm font-medium">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export const RadarChart: React.FC<RadarChartProps> = ({ userId }) => {
  const { weeklyHistory, members, yearConfig, performanceScores } = useData();
  const { currentUser } = useAuth();
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [tooltipData, setTooltipData] = useState<{ param: any, x: number, y: number, cx: number, cy: number } | null>(null);
  
  const targetUserId = userId || currentUser?.id;

  const handleLegendClick = (o: any) => {
    const { dataKey } = o;
    setHiddenKeys(prev => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  const { data, sortedScores, isHistorical } = useMemo(() => {
    if (!targetUserId || !members || !weeklyHistory) return { data: [], sortedScores: [], isHistorical: false };

    // Check if we have performance scores for this user
    const userScores = performanceScores.filter(s => s.memberId === targetUserId);

    if (userScores.length > 0) {
      // Use historical data
      const averagedScores = calculateMonthlyAverages(userScores);
      const sortedScores = [...averagedScores].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      }).slice(-6);

      const data = RADAR_PARAMETERS.map(param => {
        const entry: any = { subject: param.label };
        sortedScores.forEach(score => {
          const key = `${score.month}/${score.year}`;
          entry[key] = (score as any)[param.key];
        });
        return entry;
      });

      return { data, sortedScores, isHistorical: true };
    }

    // Fallback to current stats
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

    const data = [
      { subject: RADAR_PARAMETERS[0].label, A: userMap.A },
      { subject: RADAR_PARAMETERS[1].label, A: userMap.B },
      { subject: RADAR_PARAMETERS[2].label, A: userMap.C },
      { subject: RADAR_PARAMETERS[3].label, A: userMap.D },
      { subject: RADAR_PARAMETERS[4].label, A: userMap.E },
      { subject: RADAR_PARAMETERS[5].label, A: userMap.F },
    ];

    return { data, sortedScores: [], isHistorical: false };
  }, [targetUserId, members, weeklyHistory, yearConfig, performanceScores]);

  const userName = members.find(m => m.id === targetUserId)?.firstName || 'אני';

  return (
    <div className="w-full h-[500px] min-h-0 relative">
      <div className="flex flex-wrap gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#003366] rounded-full opacity-60"></div><span className="text-[#003366] font-medium font-['Inter',sans-serif]">{userName}</span></div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#e2e8f0" strokeOpacity={1} gridType="circle" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={(props) => <CustomAngleTick {...props} setTooltipData={setTooltipData} />}
            tickSize={15}
          />
          {[90, 30, -30, -90, -150, -210].map((angle, i) => (
            <PolarRadiusAxis 
              key={i}
              angle={angle} 
              domain={[0, 10]} 
              tickCount={11}
              tick={{ fill: '#003366', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
          ))}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          />
          {isHistorical ? (
            sortedScores.map((score, index) => {
              const key = `${score.month}/${score.year}`;
              const color = MONTH_COLORS[index % MONTH_COLORS.length];
              const name = `${MONTH_NAMES[score.month - 1]} ${score.year}`;
              return (
                <Radar
                  key={key}
                  name={name}
                  dataKey={key}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                  hide={hiddenKeys.has(key)}
                />
              );
            })
          ) : (
            <Radar 
              name={userName} 
              dataKey="A" 
              stroke="#003366" 
              fill="#003366" 
              fillOpacity={0.2} 
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          )}
          {isHistorical && (
            <Legend 
              content={<CustomLegend hiddenKeys={hiddenKeys} onClick={handleLegendClick} />} 
              layout="vertical" 
              align="right" 
              verticalAlign="middle" 
            />
          )}
        </RechartsRadar>
      </ResponsiveContainer>
      
      {tooltipData && tooltipData.param && (
        <div 
          className="absolute z-50 bg-white p-4 rounded-xl shadow-2xl text-sm text-right border border-gray-100 pointer-events-none"
          style={{ 
            direction: 'rtl',
            width: '280px',
            left: tooltipData.x < tooltipData.cx ? Math.max(10, tooltipData.x - 290) : Math.min(tooltipData.cx * 2 - 290, tooltipData.x + 20),
            top: tooltipData.y < tooltipData.cy ? Math.max(10, tooltipData.y - 20) : Math.min(tooltipData.cy * 2 - 180, tooltipData.y - 150),
          }}
        >
          <strong className="block mb-2 text-[#003366] text-sm font-bold border-b border-gray-100 pb-2">{tooltipData.param.fullLabel}</strong>
          <p className="text-gray-600 leading-relaxed text-xs">{tooltipData.param.tooltip}</p>
        </div>
      )}
    </div>
  );
};

export default RadarChart;
