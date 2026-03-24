import { PerformanceScore } from '../types';
import { parseDate } from './dateUtils';

export const calculateMonthlyAverages = (scores: PerformanceScore[]) => {
  const groupedScores: Record<string, PerformanceScore[]> = {};

  scores.forEach(score => {
    let year = score.year;
    let month = score.month;

    if (year === undefined || month === undefined) {
      if (score.date) {
        const d = parseDate(score.date);
        if (d && !isNaN(d.getTime())) {
          year = d.getFullYear();
          month = d.getMonth() + 1;
        }
      }
    }

    if (year === undefined || month === undefined) return;

    const key = `${year}-${month}`;
    if (!groupedScores[key]) {
      groupedScores[key] = [];
    }
    groupedScores[key].push(score);
  });

  const averages: PerformanceScore[] = [];

  Object.keys(groupedScores).forEach(key => {
    const monthScores = groupedScores[key];
    const [year, month] = key.split('-').map(Number);
    
    const totalWeight = monthScores.reduce((acc, curr) => {
      const d = parseDate(curr.date);
      const day = d ? d.getDate() : 1;
      return acc + day;
    }, 0);

    const weightedSum = monthScores.reduce((acc, curr) => {
      const d = parseDate(curr.date);
      const day = d ? d.getDate() : 1;
      return {
        paddle: acc.paddle + (curr.paddle * day),
        takeOff: acc.takeOff + (curr.takeOff * day),
        turns: acc.turns + (curr.turns * day),
        positioning: acc.positioning + (curr.positioning * day),
        stamina: acc.stamina + (curr.stamina * day),
        style: acc.style + (curr.style * day),
      };
    }, { paddle: 0, takeOff: 0, turns: 0, positioning: 0, stamina: 0, style: 0 });

    averages.push({
      id: `avg-${key}`,
      memberId: monthScores[0].memberId,
      month,
      year,
      paddle: weightedSum.paddle / totalWeight,
      takeOff: weightedSum.takeOff / totalWeight,
      turns: weightedSum.turns / totalWeight,
      positioning: weightedSum.positioning / totalWeight,
      stamina: weightedSum.stamina / totalWeight,
      style: weightedSum.style / totalWeight,
      instructorId: 'avg',
      instructorName: 'ממוצע משוקלל',
      updatedAt: new Date().toISOString(),
    });
  });

  return averages;
};
