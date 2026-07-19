import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Waves, TrendingUp, Users, MapPin, Clock, Award } from 'lucide-react';

export const SurfCallsAnalytics: React.FC = () => {
  const { surfCalls } = useData();

  const stats = useMemo(() => {
    const totalCalls = surfCalls.length;
    const realizedCalls = surfCalls.filter(c => c.participantsJoined.length > 1).length;
    const realizationRate = totalCalls > 0 ? Math.round((realizedCalls / totalCalls) * 100) : 0;
    
    const totalParticipants = surfCalls.reduce((acc, c) => acc + c.participantsJoined.length, 0);
    const avgParticipants = totalCalls > 0 ? (totalParticipants / totalCalls).toFixed(1) : '0';

    // Heatmap - Beaches
    const beachCounts = surfCalls.reduce((acc, c) => {
      acc[c.targetBeach] = (acc[c.targetBeach] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const popularBeaches = Object.entries(beachCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

    // Heatmap - Times
    const timeCounts = surfCalls.reduce((acc, c) => {
      acc[c.targetTime] = (acc[c.targetTime] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const popularTimes = Object.entries(timeCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

    // Leaderboard - Creators
    const creatorCounts = surfCalls.reduce((acc, c) => {
      acc[c.creatorName] = (acc[c.creatorName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCreators = Object.entries(creatorCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

    // Leaderboard - Joiners
    const joinerCounts = surfCalls.reduce((acc, c) => {
      c.participantsJoined.forEach((p: any) => {
        if (p.id !== c.creatorId) { // Only count if they are not the creator
          acc[p.name] = (acc[p.name] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);
    const topJoiners = Object.entries(joinerCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

    return { totalCalls, realizedCalls, realizationRate, avgParticipants, popularBeaches, popularTimes, topCreators, topJoiners };
  }, [surfCalls]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4" dir="rtl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Waves size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">מי בא לגלוש?</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">אנליטיקה ומדדי מעורבות</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-bold text-slate-600">סך הכל קריאות</h3>
          </div>
          <p className="text-5xl font-black text-slate-800 relative z-10">{stats.totalCalls}</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Waves size={24} />
            </div>
            <h3 className="font-bold text-slate-600">מפגשים שיצאו לפועל</h3>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <p className="text-5xl font-black text-slate-800">{stats.realizationRate}%</p>
            <p className="text-sm font-bold text-slate-400 mb-2">({stats.realizedCalls} מפגשים)</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users size={24} />
            </div>
            <h3 className="font-bold text-slate-600">ממוצע משתתפים</h3>
          </div>
          <p className="text-5xl font-black text-slate-800 relative z-10">{stats.avgParticipants}</p>
          <p className="text-sm font-bold text-slate-400 mt-2 relative z-10">משתתפים פר קריאה</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
            <MapPin className="text-sky-500" /> חופים פופולריים
          </h3>
          <div className="space-y-4">
            {stats.popularBeaches.map(([beach, count], i) => (
              <div key={beach} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="font-bold text-slate-700">{beach}</span>
                </div>
                <span className="font-black text-sky-600">{count} קריאות</span>
              </div>
            ))}
            {stats.popularBeaches.length === 0 && <p className="text-slate-400 text-center py-4 font-bold">אין נתונים מספיקים</p>}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
            <Clock className="text-sky-500" /> שעות מבוקשות
          </h3>
          <div className="space-y-4">
            {stats.popularTimes.map(([time, count], i) => (
              <div key={time} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="font-bold text-slate-700" dir="ltr">{time}</span>
                </div>
                <span className="font-black text-sky-600">{count} קריאות</span>
              </div>
            ))}
            {stats.popularTimes.length === 0 && <p className="text-slate-400 text-center py-4 font-bold">אין נתונים מספיקים</p>}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
            <Award className="text-amber-500" /> יוזמים מובילים
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase mb-4">חברי קהילה שיוזמים הכי הרבה מפגשים</p>
          <div className="space-y-4">
            {stats.topCreators.map(([name, count], i) => (
              <div key={name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'}`}>{i + 1}</span>
                  <span className="font-bold text-slate-700">{name}</span>
                </div>
                <span className="font-black text-amber-600">{count} פעמים</span>
              </div>
            ))}
            {stats.topCreators.length === 0 && <p className="text-slate-400 text-center py-4 font-bold">אין נתונים מספיקים</p>}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
            <Users className="text-emerald-500" /> הגולשים הפעילים
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase mb-4">חברי קהילה שמצטרפים להכי הרבה מפגשים (שלא הם יזמו)</p>
          <div className="space-y-4">
            {stats.topJoiners.map(([name, count], i) => (
              <div key={name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>{i + 1}</span>
                  <span className="font-bold text-slate-700">{name}</span>
                </div>
                <span className="font-black text-emerald-600">{count} הצטרפויות</span>
              </div>
            ))}
            {stats.topJoiners.length === 0 && <p className="text-slate-400 text-center py-4 font-bold">אין נתונים מספיקים</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
