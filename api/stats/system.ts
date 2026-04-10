import os from 'os';

export default function handler(req: any, res: any) {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  res.json({
    cpuUsage: Math.round(os.loadavg()[0] * 100) / 100, // 1 minute load average
    memoryUsage: Math.round((usedMem / totalMem) * 100),
    activeUsers: Math.floor(Math.random() * 50) + 10, // Mock active users
    uptime: process.uptime()
  });
}
