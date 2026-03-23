import { PerformanceScore } from '../types';

export const calculateMonthlyAverages = (scores: PerformanceScore[]) => {
  const groupedScores: Record<string, PerformanceScore[]> = {};

  scores.forEach(score => {
    const key = `${score.year}-${score.month}`;
    if (!groupedScores[key]) {
      groupedScores[key] = [];
    }
    groupedScores[key].push(score);
  });

  const averages: PerformanceScore[] = [];

  Object.keys(groupedScores).forEach(key => {
    const monthScores = groupedScores[key];
    const [year, month] = key.split('-').map(Number);
    
    const count = monthScores.length;
    const sum = monthScores.reduce((acc, curr) => ({
      paddle: acc.paddle + curr.paddle,
      takeOff: acc.takeOff + curr.takeOff,
      turns: acc.turns + curr.turns,
      positioning: acc.positioning + curr.positioning,
      stamina: acc.stamina + curr.stamina,
      style: acc.style + curr.style,
    }), { paddle: 0, takeOff: 0, turns: 0, positioning: 0, stamina: 0, style: 0 });

    averages.push({
      id: `avg-${key}`,
      memberId: monthScores[0].memberId,
      month,
      year,
      paddle: sum.paddle / count,
      takeOff: sum.takeOff / count,
      turns: sum.turns / count,
      positioning: sum.positioning / count,
      stamina: sum.stamina / count,
      style: sum.style / count,
      instructorId: 'avg',
      instructorName: 'ממוצע',
      updatedAt: new Date().toISOString(),
    });
  });

  return averages;
};
