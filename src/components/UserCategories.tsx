import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Snowflake, Sun, Zap, Trophy, Award, Waves, Check } from 'lucide-react';
import { parseDate } from '../utils/dateUtils';

interface UserCategoriesProps {
  userId: string;
}

const UserCategories: React.FC<UserCategoriesProps> = ({ userId }) => {
  const { members, weeklyHistory } = useData();

  const categories = useMemo(() => {
    if (!members || !weeklyHistory) return [];

    const getTemp = (session: any) => {
      if (session.waterTemp !== undefined && session.waterTemp !== null) return session.waterTemp;
      const date = parseDate(session.date) || new Date();
      const month = date.getMonth();
      const averages = [17, 18, 20, 22, 25, 28, 29, 28, 26, 23, 20, 18];
      return averages[month];
    };

    const getSeasonIndex = (date: Date) => {
      const month = date.getMonth();
      if (month === 11 || month === 0 || month === 1) return 0;
      if (month >= 2 && month <= 4) return 1;
      if (month >= 5 && month <= 7) return 2;
      return 3;
    };

    const surfHistory = weeklyHistory.filter(s => !s.isEvent);
    const penguinSessions = surfHistory.filter(s => getTemp(s) < 20);
    const jellyfishSessions = surfHistory.filter(s => getTemp(s) > 27);

    const memberStats = members.map(member => {
      const winterSessions = penguinSessions.filter(s => s.participantIds?.includes(member.id));
      const summerSessions = jellyfishSessions.filter(s => s.participantIds?.includes(member.id));
      
      const getStreak = (sessions: any[], memberId: string) => {
        const sorted = [...sessions].sort((a, b) => {
          const da = parseDate(a.date) || new Date(0);
          const db = parseDate(b.date) || new Date(0);
          return db.getTime() - da.getTime();
        });
        let streak = 0;
        for (const s of sorted) {
          if (s.participantIds?.includes(memberId)) streak++;
          else break;
        }
        return streak;
      };

      const winterGrit = (winterSessions.length * 1.5) + (getStreak(winterSessions, member.id) * 4);
      const summerGrit = (summerSessions.length * 1.5) + (getStreak(summerSessions, member.id) * 4);

      const seasonalCounts = [0, 0, 0, 0];
      weeklyHistory.forEach(s => {
        if (s.participantIds?.includes(member.id)) {
          const date = parseDate(s.date);
          if (date) {
            seasonalCounts[getSeasonIndex(date)]++;
          }
        }
      });

      const mean = seasonalCounts.reduce((a, b) => a + b, 0) / 4;
      const variance = seasonalCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 4;
      const totalAttendance = seasonalCounts.reduce((a, b) => a + b, 0);

      return {
        id: member.id,
        winterGrit,
        summerGrit,
        variance,
        totalAttendance
      };
    });

    const penguins = [...memberStats].filter(m => m.winterGrit > 0).sort((a, b) => b.winterGrit - a.winterGrit).slice(0, 5);
    const jellyfish = [...memberStats].filter(m => m.summerGrit > 0).sort((a, b) => b.summerGrit - a.summerGrit).slice(0, 5);
    const sharks = [...memberStats].filter(m => m.totalAttendance >= 4).sort((a, b) => a.variance - b.variance || b.totalAttendance - a.totalAttendance).slice(0, 5);
    const orcas = memberStats.filter(m => penguins.some(p => p.id === m.id) && jellyfish.some(j => j.id === m.id) && sharks.some(s => s.id === m.id)).sort((a, b) => b.totalAttendance - a.totalAttendance).slice(0, 5);

    const userStats = memberStats.find(m => m.id === userId);
    if (!userStats) return [];

    const categories = [];
    if (penguins.some(p => p.id === userId)) categories.push({ name: 'פינגווין חורף', title: 'לוחם חורף', icon: Snowflake, color: 'text-sky-900', bg: 'bg-sky-50 border border-sky-200' });
    if (jellyfish.some(j => j.id === userId)) categories.push({ name: 'מנטה ריי', title: 'גליידר קיץ', icon: Sun, color: 'text-cyan-900', bg: 'bg-cyan-50 border border-cyan-200' });
    if (sharks.some(s => s.id === userId)) categories.push({ name: 'כריש', title: 'מכונת עקביות', icon: Zap, color: 'text-slate-900', bg: 'bg-slate-100 border border-slate-300' });
    if (orcas.some(o => o.id === userId)) categories.push({ name: 'אורקה', title: 'מאסטר חוף הבית', icon: Trophy, color: 'text-emerald-900', bg: 'bg-emerald-50 border border-emerald-300' });

    return categories;
  }, [members, weeklyHistory, userId]);

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5 items-center mb-6" dir="rtl">
      <span className="text-xs font-dana-yad font-bold text-slate-500 ml-1">
        הישגים פעילים בעונה:
      </span>
      {categories.map(cat => (
        <div 
          key={cat.name} 
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${cat.bg} ${cat.color} font-dana-yad font-bold text-xs sm:text-sm shadow-xs transition-transform hover:scale-102`}
        >
          <cat.icon size={14} className="opacity-80" />
          <span>{cat.name}</span>
          <span className="text-[10px] font-sans font-normal opacity-70">({cat.title})</span>
          <Check size={12} className="text-emerald-600 mr-0.5" strokeWidth={3} />
        </div>
      ))}
    </div>
  );
};

export default UserCategories;
