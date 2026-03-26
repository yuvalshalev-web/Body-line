export const getNextSessionDate = (weeklySessions?: { dayOfWeek: number, time: string, isActive?: boolean, isRecurring?: boolean }[]) => {
  const now = new Date();
  
  if (weeklySessions && weeklySessions.length > 0) {
    const activeSessions = weeklySessions.filter(s => s.isActive !== false);
    if (activeSessions.length > 0) {
      const possibleDates = activeSessions.map(session => {
        const [hours, minutes] = session.time.split(':').map(Number);
        const date = new Date(now);
        
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
        
        date.setDate(now.getDate() + daysToAdd);
        date.setHours(hours, minutes, 0, 0);
        return { date, session };
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
