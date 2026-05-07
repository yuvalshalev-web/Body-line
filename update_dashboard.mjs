import fs from 'fs';

const content = fs.readFileSync('src/components/UserAnalytics.tsx', 'utf-8');

const replacement = `const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    const duration = 2000; // ms

    const step = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Custom easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(easeProgress * value));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return <>{displayValue}</>;
};

const EliteStatCard: React.FC<{
  value: number;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  footer?: React.ReactNode;
  trend?: { direction: 'up' | 'down'; value: number };
  colorStart?: string;
  colorEnd?: string;
  delay?: number;
  highlight?: boolean;
}> = ({ value, label, icon, tooltip, footer, trend, colorStart = '#06b6d4', colorEnd = '#3b82f6', delay = 0, highlight = false }) => {
  const radius = highlight ? 48 : 36;
  const size = highlight ? 120 : 96;
  const center = size / 2;
  const strokeWidth = highlight ? 10 : 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      className={\`relative p-6 md:p-8 bg-white/40 backdrop-blur-[40px] border border-white/80 shadow-[0_20px_40px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] hover:bg-white/50 rounded-[2rem] transition-all duration-500 overflow-hidden group hover:shadow-[0_30px_60px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,1)] transform-gpu flex flex-row items-center justify-between \${highlight ? 'md:col-span-2 lg:col-span-1' : ''}\`}
      dir="rtl"
    >
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 blur-2xl" style={{ background: \`linear-gradient(to right, \${colorStart}, \${colorEnd})\` }} />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/60 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex flex-col h-full justify-between gap-4 md:gap-6 relative z-10 w-full pl-2">
        
        {/* Top Header */}
        <div className="flex items-start gap-4">
          <div className={\`rounded-2xl bg-white/60 backdrop-blur-md shadow-sm border border-white/80 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500 shrink-0 \${highlight ? 'w-14 h-14' : 'w-12 h-12'}\`}>
            {icon}
          </div>
          <div className="flex flex-col mt-1">
            <div className="flex items-center gap-2">
              <h3 className={\`\${highlight ? 'text-lg font-black' : 'text-sm font-bold'} text-slate-800 tracking-wide\`}>{label}</h3>
              <div className="gt-info-wrapper relative">
                <Info size={14} className="text-slate-400 hover:text-slate-600 transition-colors cursor-help" />
                <span className="gt-tooltip" style={{ bottom: '160%', width: '200px' }}>{tooltip}</span>
              </div>
            </div>
            {footer && (
              <div className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-[200px] mt-1">
                {footer}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Trend & Pill */}
        <div className="mt-auto">
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.6, duration: 0.4 }}
              className={\`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.04)] \${
                trend.direction === 'up' 
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
              }\`}
              dir="rtl"
            >
              {trend.direction === 'up' ? <ArrowUpRight size={14} strokeWidth={2.5} className="text-emerald-600 ml-0.5" /> : <ArrowDownRight size={14} strokeWidth={2.5} className="text-rose-600 ml-0.5" />}
              <span className="pt-0.5">עלייה של {Math.abs(trend.value)}%</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Left Circular Gauge */}
      <div className="relative z-10 shrink-0 pr-4 border-r border-slate-200/50">
        <div className={\`relative flex items-center justify-center\`} style={{ width: size, height: size }}>
          <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id={\`grad-\${label.replace(/\\s+/g, '')}\`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colorStart} />
                <stop offset="100%" stopColor={colorEnd} />
              </linearGradient>
            </defs>
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              stroke={\`url(#grad-\${label.replace(/\\s+/g, '')})\`}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, delay: delay + 0.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
            <div className="flex items-baseline gap-0.5" dir="ltr">
              <span className={\`\${highlight ? 'text-4xl' : 'text-3xl'} font-black text-slate-800 tabular-nums tracking-tighter leading-none\`}>
                <AnimatedNumber value={value} />
              </span>
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
`;

const replacement2 = `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 w-full mb-6">
            
            <EliteStatCard 
              value={data.attendancePercent}
              label="מד התמדה אישי"
              icon={<Waves size={20} className="text-cyan-500" />}
              tooltip="כמה פעמים הגעת מתוך כל האימונים שהיו מתחילת השנה."
              trend={{ direction: 'up', value: 12 }}
              colorStart="#06b6d4" // cyan-500
              colorEnd="#3b82f6" // blue-500
              delay={0.1}
            />

            <EliteStatCard 
              value={Math.round(data.gritScore)}
              label="מד נחישות Grit"
              icon={<Trophy size={20} className="text-amber-500" />}
              tooltip="זהו מדד ה'נחישות' שלך. הוא בודק כמה אתה מתמיד. הוא משלב את כמות הסשנים שעשית עם העקביות שלך (הרצף). העקביות חשובה יותר מהכמות."
              trend={{ direction: 'up', value: 15 }}
              colorStart="#f59e0b" // amber-500
              colorEnd="#ef4444" // red-500
              delay={0.2}
              highlight={true}
              footer={
                <span className="inline-block mt-0.5">ממוצע הקהילה: <strong className="text-slate-700">{Math.round(data.averageGrit)}</strong></span>
              }
            />

            <EliteStatCard 
              value={data.yearlyStability.percent}
              label={\`יציבות שנתית \${yearConfig?.startDate ? new Date(yearConfig.startDate).getFullYear().toString() : '2026'}\`}
              icon={<Calendar size={20} className="text-fuchsia-500" />}
              tooltip="מדד הבודק כמה שבועות היית פעיל ברצף מתחילת העונה."
              trend={{ direction: 'up', value: 8 }}
              colorStart="#d946ef" // fuchsia-500
              colorEnd="#8b5cf6" // violet-500
              delay={0.3}
              footer={
                <span className="inline-block mt-0.5">פעיל ב-<strong className="text-slate-700">{data.yearlyStability.activeWeeks}</strong> מתוך {data.yearlyStability.totalWeeks} שבועות השנה</span>
              }
            />

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <EliteStatCard 
                value={data.percentile}
                label="מד התמדה יחסי"
                icon={<Target size={20} className="text-rose-500" />}
                tooltip="איפה אתה עומד ביחס לכל שאר המתאמנים בנבחרת."
                trend={{ direction: 'up', value: 4 }}
                colorStart="#e11d48" // rose-600
                colorEnd="#f43f5e" // rose-500
                delay={0.4}
              />

              <EliteStatCard 
                value={data.progress[1].value}
                label="מעורבות חברתית"
                icon={<Users size={20} className="text-indigo-500" />}
                tooltip="השתתפות באירועים ופעילויות קהילתיות מעבר לים."
                trend={{ direction: 'down', value: 2 }}
                colorStart="#6366f1" // indigo-500
                colorEnd="#4f46e5" // indigo-600
                delay={0.5}
              />
            </div>

        </div>`;

const oceanIdx = content.indexOf('const OCEAN_PALETTE = [');
if (oceanIdx === -1) {
  console.log('oceanIdx not found');
  process.exit(1);
}

const getAstrodeckEnd = () => {
   const startStr = "}> = ({ value, label, icon, tooltip, footer, isGrit, trend }) => {";
   const idx = content.indexOf(startStr);
   if (idx === -1) return content.length; // fallback
   const searchStr = "  );\n};\n\nconst UserAnalytics";
   const endIdx = content.indexOf(searchStr, idx);
   return endIdx + "  );\n};\n\n".length;
}

const astroEnd = getAstrodeckEnd();
let newContent = content.slice(0, oceanIdx) + replacement + '\n\nconst UserAnalytics' + content.slice(astroEnd + 'const UserAnalytics'.length);

const gridStart = newContent.indexOf('<div className="grid grid-cols-1 md:grid-cols-3 items-center justify-center gap-6 md:gap-4 relative z-10">');
if (gridStart > -1) {
  const gridEndStr = '</div>\n      </motion.div>';
  const gridEnd = newContent.indexOf(gridEndStr, gridStart);
  if (gridEnd > -1) {
     newContent = newContent.slice(0, gridStart) + replacement2 + newContent.slice(gridEnd);
  } else {
    // try just motion.div
    const gridEndFallback = newContent.indexOf('</motion.div>', gridStart);
    if (gridEndFallback > -1) {
       newContent = newContent.slice(0, gridStart) + replacement2 + newContent.slice(gridEndFallback);
    }
  }
}

fs.writeFileSync('src/components/UserAnalytics.tsx', newContent);
console.log('done');
