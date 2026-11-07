export interface SessionScheduleItem {
  dayOfWeek: number;
  time: string;
  isActive?: boolean;
  isRecurring?: boolean;
  frequency?: 'weekly' | 'biweekly';
  startDate?: string;
}

export const getNextSessionDate = (weeklySessions?: SessionScheduleItem[]) => {
  const now = new Date();
  
  if (weeklySessions && weeklySessions.length > 0) {
    const activeSessions = weeklySessions.filter(s => s.isActive !== false);
    if (activeSessions.length > 0) {
      const possibleDates = activeSessions.map(session => {
        const [hours, minutes] = session.time.split(':').map(Number);
        
        let daysToAdd = session.dayOfWeek - now.getDay();
        
        // If it's today, check if the time has passed
        if (daysToAdd === 0) {
          const sessionTime = new Date(now);
          sessionTime.setHours(hours, minutes, 0, 0);
          if (now >= sessionTime) {
            daysToAdd = 7;
          }
        } else if (daysToAdd < 0) {
          daysToAdd += 7;
        }
        
        const candidateDate = new Date(now);
        candidateDate.setDate(now.getDate() + daysToAdd);
        candidateDate.setHours(hours, minutes, 0, 0);

        // If frequency is bi-weekly, ensure we only hit alternating weeks from group's startDate
        if (session.frequency === 'biweekly') {
          const anchorStr = session.startDate || `${now.getFullYear()}-09-01`;
          const anchor = new Date(anchorStr);
          anchor.setHours(hours, minutes, 0, 0);
          
          const msPerWeek = 7 * 24 * 60 * 60 * 1000;
          const diffMs = candidateDate.getTime() - anchor.getTime();
          const diffWeeks = Math.round(diffMs / msPerWeek);
          
          // If odd number of weeks from anchor, this upcoming week is off: advance by 7 days
          if (Math.abs(diffWeeks) % 2 !== 0) {
            candidateDate.setDate(candidateDate.getDate() + 7);
          }
        }

        return { date: candidateDate, session };
      });

      // Sort by date and pick the earliest
      possibleDates.sort((a, b) => a.date.getTime() - b.date.getTime());
      return possibleDates[0].date.toISOString();
    }
  }
  
  // Default fallback
  const nextSession = new Date(now);
  nextSession.setDate(now.getDate() + 1);
  return nextSession.toISOString();
};

