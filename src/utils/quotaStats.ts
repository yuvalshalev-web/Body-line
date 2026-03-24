export const getMonthlyQuotaData = () => {
  const today = new Date().getDate();
  const data = [];
  
  // Base values for trends
  let baseReads = 15000;
  let baseWrites = 5000;
  let baseDeletes = 2000;

  for (let i = 1; i <= today; i++) {
    // Add some random variation and a slight upward trend
    const dayTrend = 1 + (i * 0.02);
    const weekendMultiplier = (i % 7 === 5 || i % 7 === 6) ? 1.5 : 1.0; // Higher on weekends
    
    data.push({
      day: i,
      reads: Math.floor((baseReads + Math.random() * 5000) * dayTrend * weekendMultiplier),
      writes: Math.floor((baseWrites + Math.random() * 2000) * dayTrend * weekendMultiplier),
      deletes: Math.floor((baseDeletes + Math.random() * 1000) * dayTrend * weekendMultiplier),
    });
  }
  return data;
};
