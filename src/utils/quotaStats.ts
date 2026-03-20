export const getMonthlyQuotaData = () => {
  const today = new Date().getDate();
  const data = [];
  for (let i = 1; i <= today; i++) {
    data.push({
      day: i,
      reads: Math.floor(Math.random() * 40000) + 5000,
      writes: Math.floor(Math.random() * 15000) + 2000,
      deletes: Math.floor(Math.random() * 10000) + 1000,
    });
  }
  return data;
};
