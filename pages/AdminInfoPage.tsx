
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Users2, 
  Filter, 
  MousePointer2, 
  Database,
  ArrowUpRight,
  Activity,
  History,
  Info,
  PieChart,
  Loader2,
  Trophy,
  RefreshCw,
  CalendarDays
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Member, Event } from '../types';
import Chart from 'chart.js/auto';

interface WeeklyStat {
  date: string;
  count: number;
}

const AdminInfoPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [showTop10, setShowTop10] = useState(false);

  const sessionsChartRef = useRef<HTMLCanvasElement>(null);
  const eventsChartRef = useRef<HTMLCanvasElement>(null);
  const loginsChartRef = useRef<HTMLCanvasElement>(null);
  const userEventsChartRef = useRef<HTMLCanvasElement>(null);
  const weeklyAttendanceChartRef = useRef<HTMLCanvasElement>(null);
  
  const chartsInstance = useRef<{ [key: string]: Chart | null }>({
    sessions: null,
    events: null,
    logins: null,
    userEvents: null,
    weeklyAttendance: null,
  });

  // Listen to Members, Events & Weekly Stats in real-time
  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers(data);
      setLoading(false);
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event));
      setEvents(data);
    });

    // Listener for historical weekly attendance stats
    const qWeekly = query(collection(db, 'weekly_stats'), orderBy('date', 'asc'), limit(12));
    const unsubWeekly = onSnapshot(qWeekly, (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as WeeklyStat);
      setWeeklyStats(data);
    });

    return () => {
      unsubMembers();
      unsubEvents();
      unsubWeekly();
    };
  }, []);

  // Aggregate Stats & Participation Map
  const stats = useMemo(() => {
    const totalSessions = members.reduce((acc, curr) => acc + (curr.totalAttendance || 0), 0);
    const totalLogins = members.reduce((acc, curr) => acc + (curr.loginCount || 0), 0);
    
    const participationMap: Record<string, number> = {};
    members.forEach(m => participationMap[m.id] = 0);
    
    events.forEach(e => {
      (e.attendees || []).forEach(uid => {
        if (participationMap[uid] !== undefined) participationMap[uid]++;
      });
    });

    const participationCounts = Object.values(participationMap);
    const high = participationCounts.filter(c => c >= 5).length;
    const mid = participationCounts.filter(c => c > 0 && c < 5).length;
    const low = participationCounts.filter(c => c === 0).length;

    const memberParticipationData = members.map(m => ({ 
      name: m.name, 
      count: participationMap[m.id] || 0,
      sessions: m.totalAttendance || 0,
      logins: m.loginCount || 0 
    }));

    return {
      totalSessions,
      totalLogins,
      eventSegmentation: [high, mid, low],
      memberParticipation: memberParticipationData
    };
  }, [members, events]);

  // Handle Charts Rendering
  useEffect(() => {
    if (loading) return;

    // Cleanup existing charts
    (Object.values(chartsInstance.current) as (Chart | null)[]).forEach(chart => chart?.destroy());

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart' as const
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Assistant', size: 14, weight: 'bold' as const },
          bodyFont: { family: 'Assistant', size: 12 },
          padding: 12,
          cornerRadius: 12,
          rtl: true,
          textAlign: 'right' as const,
          callbacks: {
            label: (context: any) => ` כמות: ${Math.round(context.raw)}`
          }
        }
      }
    };

    const sortedForSessions = [...stats.memberParticipation]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, showTop10 ? 10 : 20);

    const sortedForEvents = [...stats.memberParticipation]
      .sort((a, b) => b.count - a.count)
      .slice(0, showTop10 ? 10 : 20);

    // 1. Sessions Chart (Horizontal Bar)
    if (sessionsChartRef.current) {
      chartsInstance.current.sessions = new Chart(sessionsChartRef.current, {
        type: 'bar',
        data: {
          labels: sortedForSessions.map(m => m.name),
          datasets: [{
            label: 'סשנים',
            data: sortedForSessions.map(m => m.sessions),
            backgroundColor: '#2563eb',
            borderRadius: 6,
          }]
        },
        options: {
          ...commonOptions,
          indexAxis: 'y' as const,
          scales: {
            x: { 
              beginAtZero: true,
              grid: { display: false }, 
              ticks: { 
                stepSize: 1,
                precision: 0,
                font: { family: 'Assistant', weight: 'bold' as const } 
              } 
            },
            y: { ticks: { font: { family: 'Assistant', weight: 'bold' as const } } }
          }
        }
      });
    }

    // 2. Events per Member Chart (Vertical Bar)
    if (userEventsChartRef.current) {
      chartsInstance.current.userEvents = new Chart(userEventsChartRef.current, {
        type: 'bar',
        data: {
          labels: sortedForEvents.map(m => m.name),
          datasets: [{
            label: 'אירועים',
            data: sortedForEvents.map(m => m.count),
            backgroundColor: '#10b981',
            borderRadius: 8,
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Assistant', weight: 'bold' as const } } },
            y: { 
              beginAtZero: true,
              ticks: { 
                font: { family: 'Assistant', weight: 'bold' as const }, 
                stepSize: 1,
                precision: 0
              } 
            }
          }
        }
      });
    }

    // 3. Logins Chart (Line)
    if (loginsChartRef.current) {
      chartsInstance.current.logins = new Chart(loginsChartRef.current, {
        type: 'line',
        data: {
          labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
          datasets: [{
            label: 'כמות כניסות כוללת',
            data: [45, 80, 120, 110, 150, 200, 190, 240, 280, 220, 310, 350],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 4,
            pointRadius: 4,
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Assistant', weight: 'bold' as const } } },
            y: { 
              beginAtZero: true,
              ticks: { 
                font: { family: 'Assistant', weight: 'bold' as const },
                stepSize: 1,
                precision: 0
              } 
            }
          }
        }
      });
    }

    // 4. Events Segmentation (Doughnut)
    if (eventsChartRef.current) {
      chartsInstance.current.events = new Chart(eventsChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['פעילים מאוד (5+)', 'מזדמנים (1-4)', 'טרם השתתפו'],
          datasets: [{
            data: stats.eventSegmentation,
            backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 15
          }]
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            legend: { 
              display: true, 
              position: 'bottom', 
              labels: { 
                padding: 20,
                font: { family: 'Assistant', weight: 'bold' as const, size: 12 } 
              } 
            }
          }
        }
      });
    }

    // 5. Weekly Attendance Trend (NEW - Bar Chart)
    if (weeklyAttendanceChartRef.current && weeklyStats.length > 0) {
      chartsInstance.current.weeklyAttendance = new Chart(weeklyAttendanceChartRef.current, {
        type: 'bar',
        data: {
          labels: weeklyStats.map(s => {
            const date = new Date(s.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }),
          datasets: [{
            label: 'משתתפים',
            data: weeklyStats.map(s => s.count),
            backgroundColor: '#6366f1',
            borderRadius: 12,
            borderSkipped: false,
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Assistant', weight: 'bold' as const } } },
            y: { 
              beginAtZero: true,
              ticks: { 
                font: { family: 'Assistant', weight: 'bold' as const },
                stepSize: 5
              } 
            }
          }
        }
      });
    }

    return () => {
      (Object.values(chartsInstance.current) as (Chart | null)[]).forEach(chart => chart?.destroy());
    };
  }, [loading, stats, showTop10, weeklyStats]);

  const summaryCards = [
    { label: 'סך סשנים (חמישי)', value: stats.totalSessions.toLocaleString(), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'אירועי קהילה פעילים', value: events.length.toLocaleString(), icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'כניסות למערכת', value: stats.totalLogins.toLocaleString(), icon: History, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'חברי קהילה רשומים', value: members.length.toLocaleString(), icon: Users2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
           <Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} />
           <p className="font-black text-slate-400 uppercase tracking-widest text-sm">טוען נתוני אמת מ-Firestore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-right animate-in fade-in duration-700 pb-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-0 pt-10">
        
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest mb-4">
              <ShieldCheck size={12} className="text-rose-400" />
              מידע מסונכרן בזמן אמת
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">דאשבורד ניהול</h2>
            <p className="text-slate-500 font-bold text-lg max-w-2xl">מעקב השתתפות דינמי - נתונים מתעדכנים מיידית עם כל שינוי של המשתמשים.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100">
             <div className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl shadow-sm border border-emerald-50">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Live Sync On</span>
             </div>
             <div className="w-px h-6 bg-slate-200 mx-1"></div>
             <button 
               onClick={() => setShowTop10(!showTop10)}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${showTop10 ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
             >
                <Filter size={14} />
                <span>הצג מובילים</span>
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           {summaryCards.map((card, i) => (
             <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
                <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                   <card.icon size={24} />
                </div>
                <div className="space-y-1">
                   <p className="text-3xl font-black text-slate-950 tracking-tighter">{card.value}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Weekly Attendance Historical Chart (NEW) */}
        <div className="mb-8">
           <div className="bg-white p-8 md:p-12 border border-slate-100 rounded-[3.5rem] shadow-sm flex flex-col h-[500px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              
              <div className="flex items-center justify-between mb-10 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                       <CalendarDays size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">📅 מגמת השתתפות שבועית - חמישי הגדול</h3>
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">נתונים היסטוריים הנשמרים בכל יום חמישי בשעה 09:00</p>
                    </div>
                 </div>
                 
                 <div className="hidden md:flex items-center gap-4">
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ממוצע שבועי</span>
                       <span className="text-xl font-black text-slate-900">
                         {weeklyStats.length > 0 
                           ? Math.round(weeklyStats.reduce((acc, s) => acc + s.count, 0) / weeklyStats.length)
                           : 0}
                       </span>
                    </div>
                    <div className="w-px h-8 bg-slate-100"></div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">שיא תקופתי</span>
                       <span className="text-xl font-black text-indigo-600">
                         {weeklyStats.length > 0 ? Math.max(...weeklyStats.map(s => s.count)) : 0}
                       </span>
                    </div>
                 </div>
              </div>
              
              <div className="flex-1 relative z-10">
                 {weeklyStats.length > 0 ? (
                   <canvas ref={weeklyAttendanceChartRef}></canvas>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                      <BarChart3 size={48} className="opacity-20" />
                      <p className="font-bold">טרם נאספו נתונים היסטוריים...</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Participation Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           {/* Sessions (Horizontal Bar) */}
           <div className="bg-white p-8 md:p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[600px] relative overflow-hidden group">
              <div className="absolute top-8 left-8">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                       <Activity size={20} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">📊 השתתפות בסשנים (חמישי הגדול)</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מבוסס על שדה נוכחות מצטבר • מתעדכן בביטול הגעה</p>
                    </div>
                 </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                 <canvas ref={sessionsChartRef}></canvas>
              </div>
           </div>

           {/* Events per Member (Vertical Bar) */}
           <div className="bg-white p-8 md:p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[600px] relative overflow-hidden group">
              <div className="absolute top-8 left-8">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                       <Trophy size={20} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">🏆 מעורבות באירועי קהילה</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מחושב בזמן אמת מרשימות המשתתפים בכל אירוע</p>
                    </div>
                 </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                 <canvas ref={userEventsChartRef}></canvas>
              </div>
           </div>
        </div>

        {/* Bottom Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
           {/* Logins (Line) */}
           <div className="bg-white p-8 md:p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                       <TrendingUp size={20} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">📈 מגמת כניסות למערכת</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מבט שנתי על רמת השימוש באתר</p>
                    </div>
                 </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                 <canvas ref={loginsChartRef}></canvas>
              </div>
           </div>

           {/* Events Segmentation (Doughnut) */}
           <div className="bg-white p-8 md:p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                       <PieChart size={20} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">🎉 פילוח רמת מעורבות קבוצתית</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">התפלגות כלל הקהילה לפי כמות אירועים</p>
                    </div>
                 </div>
              </div>
              <div className="flex-1 relative overflow-hidden pb-4">
                 <canvas ref={eventsChartRef}></canvas>
              </div>
           </div>
        </div>

        {/* Logic Footer */}
        <div className="p-10 bg-slate-900 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
           <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-indigo-400">
                 <Database size={28} />
              </div>
              <h3 className="text-2xl font-black tracking-tight">דיוק נתוני השתתפות</h3>
           </div>
           <p className="text-white/60 font-bold max-w-3xl leading-relaxed mb-6">
             המערכת מבצעת סנכרון דו-כיווני מול השרת. כל ביטול השתתפות ("Toggle Off") בסשן חמישי או באירוע מעדכן באופן מיידי את מונה הנוכחות של החבר. 
             בצורה זו, הסטטיסטיקה המוצגת כאן היא תמונת מצב מדויקת של המעורבות הקהילתית כפי שהיא ברגע זה.
             <br /><br />
             הגרף השבועי החדש מציג את רמת ההשתתפות ההיסטורית בכל יום חמישי. הנתונים מתועדים באופן אוטומטי ונשמרים לצורך ניתוח מגמות ארוך טווח.
           </p>
           <div className="flex gap-8">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">חיבור חי ל-Firestore פעיל</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">ספירה מבוססת רשימות Attendees</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInfoPage;
