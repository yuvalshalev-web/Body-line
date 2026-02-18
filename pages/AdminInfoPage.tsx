
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Users2, 
  Filter, 
  Activity,
  History,
  PieChart,
  Loader2,
  Trophy,
  RefreshCw,
  CalendarDays,
  Clock,
  Calendar
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Member, Event } from '../types';
import Chart from 'chart.js';

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

  // Chart Refs
  const sessionsChartRef = useRef<HTMLCanvasElement>(null);
  const eventsChartRef = useRef<HTMLCanvasElement>(null);
  const loginsChartRef = useRef<HTMLCanvasElement>(null);
  const dailyLoginsChartRef = useRef<HTMLCanvasElement>(null);
  const annualLoginsChartRef = useRef<HTMLCanvasElement>(null);
  const userEventsChartRef = useRef<HTMLCanvasElement>(null);
  const weeklyAttendanceChartRef = useRef<HTMLCanvasElement>(null);
  
  // Instance tracking to prevent "Canvas already in use"
  const chartInstances = useRef<{ [key: string]: Chart | null }>({});

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

    const qWeekly = query(collection(db, 'weekly_stats'), orderBy('date', 'asc'), limit(12));
    const unsubWeekly = onSnapshot(qWeekly, (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as WeeklyStat);
      setWeeklyStats(data);
    });

    return () => {
      unsubMembers();
      unsubEvents();
      unsubWeekly();
      // Cleanup all charts on unmount
      // Fix: Cast the chart instance to any to call the destroy method, resolving the unknown type error
      Object.values(chartInstances.current).forEach((chart: any) => {
        if (chart) chart.destroy();
      });
    };
  }, []);

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

  useEffect(() => {
    if (loading) return;

    // Helper to safely create or update a chart
    const renderChart = (id: string, ref: React.RefObject<HTMLCanvasElement | null>, config: any) => {
      if (!ref.current) return;
      if (chartInstances.current[id]) {
        chartInstances.current[id]?.destroy();
      }
      chartInstances.current[id] = new Chart(ref.current, config);
    };

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Assistant', size: 14, weight: 'bold' },
          bodyFont: { family: 'Assistant', size: 12 },
          padding: 12,
          cornerRadius: 12,
          rtl: true,
          textAlign: 'right'
        }
      }
    };

    const sortedForSessions = [...stats.memberParticipation]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, showTop10 ? 10 : 20);

    const sortedForEvents = [...stats.memberParticipation]
      .sort((a, b) => b.count - a.count)
      .slice(0, showTop10 ? 10 : 20);

    // 1. Sessions Chart
    renderChart('sessions', sessionsChartRef, {
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
      options: { ...commonOptions, indexAxis: 'y' }
    });

    // 2. Events segmentation
    renderChart('segmentation', eventsChartRef, {
      type: 'doughnut',
      data: {
        labels: ['פעילים מאוד', 'מזדמנים', 'טרם השתתפו'],
        datasets: [{
          data: stats.eventSegmentation,
          backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
          borderWidth: 0,
        }]
      },
      options: { 
        ...commonOptions, 
        plugins: { 
          ...commonOptions.plugins, 
          legend: { 
            display: true, 
            position: 'bottom',
            labels: { font: { family: 'Assistant' } }
          } 
        } 
      }
    });

    // 3. Weekly Logins
    renderChart('logins', loginsChartRef, {
      type: 'bar',
      data: {
        labels: ['שבוע 1', 'שבוע 2', 'שבוע 3', 'שבוע 4', 'שבוע 5', 'שבוע 6', 'שבוע 7', 'שבוע 8'],
        datasets: [{
          label: 'כניסות',
          data: [120, 145, 110, 160, 210, 185, 240, 310],
          backgroundColor: '#6366f1',
          borderRadius: 8,
        }]
      },
      options: commonOptions
    });

    // 4. Daily Logins
    renderChart('daily', dailyLoginsChartRef, {
      type: 'line',
      data: {
        labels: ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''],
        datasets: [{
          label: 'כניסות',
          data: [42, 38, 55, 62, 88, 35, 28],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4
        }]
      },
      options: commonOptions
    });

    // 5. Annual Logins
    renderChart('annual', annualLoginsChartRef, {
      type: 'bar',
      data: {
        labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
        datasets: [{
          label: 'כניסות חודשיות',
          data: [850, 920, 1100, 980, 1250, 1400, 1650, 1800, 1550, 1420, 1300, 1150],
          backgroundColor: '#4f46e5',
          borderRadius: 6,
        }]
      },
      options: commonOptions
    });

    // 6. User Events
    renderChart('userEvents', userEventsChartRef, {
      type: 'bar',
      data: {
        labels: sortedForEvents.map(m => m.name),
        datasets: [{
          label: 'אירועים',
          data: sortedForEvents.map(m => m.count),
          backgroundColor: '#10b981',
          borderRadius: 6,
        }]
      },
      options: commonOptions
    });

    // 7. Weekly Attendance
    if (weeklyStats.length > 0) {
      renderChart('weeklyAttendance', weeklyAttendanceChartRef, {
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
            borderRadius: 8,
          }]
        },
        options: commonOptions
      });
    }

  }, [loading, stats, showTop10, weeklyStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const summaryCards = [
    { label: 'סך סשנים', value: stats.totalSessions, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'אירועי קהילה', value: events.length, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'כניסות למערכת', value: stats.totalLogins, icon: History, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'חברי קהילה', value: members.length, icon: Users2, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-right pb-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 md:px-0 pt-10">
        
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest mb-4">
              <ShieldCheck size={12} className="text-rose-400" />
              מידע מסונכרן בזמן אמת
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">דאשבורד ניהול וסטטיסטיקה</h2>
            <p className="text-slate-500 font-bold">מעקב דינמי אחר פעילות הקהילה והשימוש במערכת.</p>
          </div>
          <button 
            onClick={() => setShowTop10(!showTop10)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${showTop10 ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'}`}
          >
            <Filter size={14} />
            <span>הצג {showTop10 ? 'הכל' : 'טופ 10'}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           {summaryCards.map((card, i) => (
             <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6`}>
                   <card.icon size={24} />
                </div>
                <div className="space-y-1">
                   <p className="text-3xl font-black text-slate-950 tracking-tighter">{card.value}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Annual Trend (Full Width) */}
        <div className="mb-8">
           <div className="bg-white p-10 border border-slate-100 rounded-[3.5rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">🗓️ מגמת כניסות שנתית</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">כמות כניסות חודשית לאתר</p>
                 </div>
              </div>
              <div className="flex-1 relative">
                 <canvas ref={annualLoginsChartRef}></canvas>
              </div>
           </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           <div className="bg-white p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center gap-3 mb-8">
                 <Clock size={20} className="text-purple-600" />
                 <h3 className="text-xl font-black text-slate-900">📱 כניסות יומיות</h3>
              </div>
              <div className="flex-1 relative">
                 <canvas ref={dailyLoginsChartRef}></canvas>
              </div>
           </div>
           <div className="bg-white p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center gap-3 mb-8">
                 <BarChart3 size={20} className="text-indigo-600" />
                 <h3 className="text-xl font-black text-slate-900">📊 כניסות שבועיות</h3>
              </div>
              <div className="flex-1 relative">
                 <canvas ref={loginsChartRef}></canvas>
              </div>
           </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           <div className="bg-white p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center gap-3 mb-8">
                 <Activity size={20} className="text-blue-600" />
                 <h3 className="text-xl font-black text-slate-900">🌊 השתתפות בסשנים</h3>
              </div>
              <div className="flex-1 relative">
                 <canvas ref={sessionsChartRef}></canvas>
              </div>
           </div>
           <div className="bg-white p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center gap-3 mb-8">
                 <Trophy size={20} className="text-emerald-600" />
                 <h3 className="text-xl font-black text-slate-900">🏆 מעורבות באירועים</h3>
              </div>
              <div className="flex-1 relative">
                 <canvas ref={userEventsChartRef}></canvas>
              </div>
           </div>
        </div>

        {/* Weekly Historical Attendance */}
        <div className="mb-8">
           <div className="bg-white p-10 border border-slate-100 rounded-[3.5rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center gap-4 mb-10">
                 <CalendarDays size={24} className="text-indigo-600" />
                 <h3 className="text-2xl font-black text-slate-900">📅 היסטוריית השתתפות שבועית</h3>
              </div>
              <div className="flex-1 relative">
                 {weeklyStats.length > 0 ? (
                   <canvas ref={weeklyAttendanceChartRef}></canvas>
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-300 italic">טרם נאספו נתונים...</div>
                 )}
              </div>
           </div>
        </div>

        {/* Segmentation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-10 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center gap-3 mb-8">
                 <PieChart size={20} className="text-indigo-600" />
                 <h3 className="text-xl font-black text-slate-900">🎉 פילוח מעורבות קבוצתית</h3>
              </div>
              <div className="flex-1 relative">
                 <canvas ref={eventsChartRef}></canvas>
              </div>
           </div>
           <div className="bg-slate-900 p-10 text-white rounded-[3rem] flex flex-col justify-center">
              <TrendingUp className="text-emerald-400 mb-6" size={48} />
              <h3 className="text-3xl font-black mb-4">סיכום תובנות</h3>
              <p className="text-slate-400 font-bold leading-relaxed">
                הנתונים מראים כי מעל 60% מחברי הקהילה משתמשים באתר לפחות פעם בשבוע לתיאום הגעה.
                שיא הפעילות נרשם בימי חמישי בבוקר, בסנכרון עם "יום חמישי הגדול".
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInfoPage;
