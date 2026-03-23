import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Snowflake, Sun, Zap, Trophy } from 'lucide-react';
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

    const penguinSessions = weeklyHistory.filter(s => getTemp(s) < 20);
    const jellyfishSessions = weeklyHistory.filter(s => getTemp(s) > 27);

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
    if (penguins.some(p => p.id === userId)) categories.push({ name: 'פינגווין', icon: Snowflake, color: 'text-[#00426a]', iconColor: 'text-[#0071a1]', bg: 'bg-[#f0f8ff]/50 border border-[#00426a]/10 shadow-sm' });
    if (jellyfish.some(j => j.id === userId)) categories.push({ name: 'מנטה ריי', icon: Sun, color: 'text-[#00426a]', iconColor: 'text-[#0071a1]', bg: 'bg-[#f0f8ff]/50 border border-[#00426a]/10 shadow-sm' });
    if (sharks.some(s => s.id === userId)) categories.push({ name: 'כריש', icon: Zap, color: 'text-[#00426a]', iconColor: 'text-[#0071a1]', bg: 'bg-[#f0f8ff]/50 border border-[#00426a]/10 shadow-sm' });
    if (orcas.some(o => o.id === userId)) categories.push({ name: 'אורקה', icon: Trophy, color: 'text-[#00426a]', iconColor: 'text-[#0071a1]', bg: 'bg-[#f0f8ff]/50 border border-[#00426a]/10 shadow-sm' });

    return categories;
  }, [members, weeklyHistory, userId]);

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {categories.map(cat => (
        <div key={cat.name} className={`flex items-center gap-1 px-3 py-1 rounded-full ${cat.bg} ${cat.color} font-bold text-xs`}>
          <cat.icon size={14} className={cat.iconColor} />
          {cat.name}
        </div>
      ))}
    </div>
  );
};

export default UserCategories;
