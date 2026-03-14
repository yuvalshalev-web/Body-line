import React, { useMemo } from 'react';
import { Waves, Snowflake, Sun, Zap, Info } from 'lucide-react';
import { OceanPulse } from '../OceanPulse';
import SeasonalPersistenceRow from './SeasonalPersistenceRow';
import { useData } from '../../contexts/DataContext';
import { motion } from 'motion/react';

const SeasonalPersistence: React.FC = () => {
  const { members, weeklyHistory } = useData();

  const leaderboards = useMemo(() => {
    if (!members || !weeklyHistory) return { penguins: [], jellyfish: [], sharks: [] };

    // Helper to get water temp (actual or estimated by month)
    const getTemp = (session: any) => {
      if (session.waterTemp !== undefined && session.waterTemp !== null) return session.waterTemp;
      const date = session.date?.toDate ? session.date.toDate() : new Date(session.date);
      const month = date.getMonth();
      const averages = [17, 18, 20, 22, 25, 28, 29, 28, 26, 23, 20, 18]; // Jan-Dec
      return averages[month];
    };

    // Helper to get season index (0: Winter, 1: Spring, 2: Summer, 3: Autumn)
    const getSeasonIndex = (date: Date) => {
      const month = date.getMonth();
      if (month === 11 || month === 0 || month === 1) return 0; // Dec, Jan, Feb
      if (month >= 2 && month <= 4) return 1; // Mar, Apr, May
      if (month >= 5 && month <= 7) return 2; // Jun, Jul, Aug
      return 3; // Sep, Oct, Nov
    };

    const penguinSessions = weeklyHistory.filter(s => getTemp(s) < 20);
    const jellyfishSessions = weeklyHistory.filter(s => getTemp(s) > 27);

    const memberStats = members.map(member => {
      const winterSessions = penguinSessions.filter(s => s.participantIds?.includes(member.id));
      const summerSessions = jellyfishSessions.filter(s => s.participantIds?.includes(member.id));
      
      // Calculate category-specific streaks
      const getStreak = (sessions: any[], memberId: string) => {
        const sorted = [...sessions].sort((a, b) => {
          const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
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

      // Variance calculation for Sharks
      const seasonalCounts = [0, 0, 0, 0];
      weeklyHistory.forEach(s => {
        if (s.participantIds?.includes(member.id)) {
          const date = s.date?.toDate ? s.date.toDate() : new Date(s.date);
          seasonalCounts[getSeasonIndex(date)]++;
        }
      });

      const mean = seasonalCounts.reduce((a, b) => a + b, 0) / 4;
      const variance = seasonalCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 4;
      const totalAttendance = seasonalCounts.reduce((a, b) => a + b, 0);

      return {
        ...member,
        winterGrit,
        summerGrit,
        variance,
        totalAttendance,
        seasonalCounts
      };
    });

    const penguins = [...memberStats]
      .filter(m => m.winterGrit > 0)
      .sort((a, b) => b.winterGrit - a.winterGrit)
      .slice(0, 5);

    const jellyfish = [...memberStats]
      .filter(m => m.summerGrit > 0)
      .sort((a, b) => b.summerGrit - a.summerGrit)
      .slice(0, 5);

    const sharks = [...memberStats]
      .filter(m => m.totalAttendance >= 4) // Must have at least some attendance to be a shark
      .sort((a, b) => a.variance - b.variance || b.totalAttendance - a.totalAttendance)
      .slice(0, 5);

    return { penguins, jellyfish, sharks };
  }, [members, weeklyHistory]);

  return (
    <div className="glass-panel p-8 rounded-[3rem] border border-white/20 shadow-soft space-y-12">
      <header className="space-y-2">
        <h2 className="text-2xl font-black text-[#2B2B2E]">התמדה עונתית</h2>
        <p className="text-sm text-black/60 font-medium">ניתוח ביצועים ודירוגי קהילה לפי תנאים תרמיים</p>
      </header>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[var(--surfer-cyan)]/20 rounded-xl border border-white/20 shadow-lg shadow-black/5">
            <Waves className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={24} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-black text-[#000000] tracking-tight" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>דופק האוקיינוס</h3>
            <div className="gt-info-wrapper relative cursor-help">
              <Info size={16} className="text-black/40 hover:text-black transition-colors" />
              <div className="gt-tooltip">
                ניתוח הקשר בין טמפרטורת המים לבין כמות המשתתפים בסשנים.
              </div>
            </div>
          </div>
        </div>
        <OceanPulse />
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[var(--surfer-orange)]/20 rounded-xl border border-white/20 shadow-lg shadow-black/5">
            <Zap className="text-[#000000] filter drop-shadow-[0.5px_0.5px_0.5px_rgba(255,255,255,0.5)] drop-shadow-[-0.5px_-0.5px_0.5px_rgba(0,0,0,0.3)]" size={24} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-black text-[#000000] tracking-tight" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>אחוזי התמדה קהילתיים</h3>
            <div className="gt-info-wrapper relative cursor-help">
              <Info size={16} className="text-black/40 hover:text-black transition-colors" />
              <div className="gt-tooltip">
                אחוז ההתמדה הממוצע של כלל הקהילה בכל עונה.
              </div>
            </div>
          </div>
        </div>
        <SeasonalPersistenceRow />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Penguins */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400/10 to-blue-600/5 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full glass-panel p-6 rounded-[2rem] border border-white/30 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Snowflake className="text-blue-600" size={28} />
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-black text-[#000000]">🐧 פינגווינים</h4>
                  <div className="gt-info-wrapper relative cursor-help">
                    <Info size={14} className="text-blue-600/40 hover:text-blue-600 transition-colors" />
                    <div className="gt-tooltip">
                      גולשים שהשתתפו בסשנים שבהם טמפרטורת המים הייתה מתחת ל-20 מעלות. הדירוג נקבע לפי מדד ה-Grit.
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600/60 bg-blue-600/10 px-2 py-1 rounded-full">Winter Warriors</span>
            </div>
            
            <div className="space-y-4 flex-grow">
              {leaderboards.penguins.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-blue-600/40 w-4">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full border-2 border-blue-200 overflow-hidden bg-blue-50">
                      {m.avatar ? (
                        <img src={m.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-300 font-bold">
                          {m.firstName[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[#000000] leading-tight">{m.firstName} {m.lastName}</div>
                      <div className="text-[10px] text-blue-600 font-bold uppercase">Grit Score</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#000000]">{Math.round(m.winterGrit)}</div>
                  </div>
                </div>
              ))}
              {leaderboards.penguins.length === 0 && (
                <div className="text-center py-12 text-black/40 font-bold italic">טרם נאספו נתונים לעונה זו</div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-blue-600/10 text-[10px] font-bold text-blue-600/60 text-center uppercase tracking-tighter">
              Filter: Water Temp &lt; 20°C
            </div>
          </div>
        </motion.div>

        {/* Column 2: Jellyfish */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-orange-400/10 to-red-600/5 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full glass-panel p-6 rounded-[2rem] border border-white/30 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sun className="text-orange-600" size={28} />
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-black text-[#000000]">🪼 מדוזות</h4>
                  <div className="gt-info-wrapper relative cursor-help">
                    <Info size={14} className="text-orange-600/40 hover:text-orange-600 transition-colors" />
                    <div className="gt-tooltip">
                      גולשים שהשתתפו בסשנים שבהם טמפרטורת המים הייתה מעל 27 מעלות. הדירוג נקבע לפי מדד ה-Grit.
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-orange-600/60 bg-orange-600/10 px-2 py-1 rounded-full">Summer Crew</span>
            </div>
            
            <div className="space-y-4 flex-grow">
              {leaderboards.jellyfish.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-orange-600/40 w-4">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full border-2 border-orange-200 overflow-hidden bg-orange-50">
                      {m.avatar ? (
                        <img src={m.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-300 font-bold">
                          {m.firstName[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[#000000] leading-tight">{m.firstName} {m.lastName}</div>
                      <div className="text-[10px] text-orange-600 font-bold uppercase">Grit Score</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#000000]">{Math.round(m.summerGrit)}</div>
                  </div>
                </div>
              ))}
              {leaderboards.jellyfish.length === 0 && (
                <div className="text-center py-12 text-black/40 font-bold italic">טרם נאספו נתונים לעונה זו</div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-orange-600/10 text-[10px] font-bold text-orange-600/60 text-center uppercase tracking-tighter">
              Filter: Water Temp &gt; 27°C
            </div>
          </div>
        </motion.div>

        {/* Column 3: Sharks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-blue-900/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full glass-panel p-6 rounded-[2rem] border border-white/30 shadow-xl flex flex-col bg-gradient-to-b from-cyan-900/5 to-blue-900/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap className="text-cyan-700" size={28} />
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-black text-[#000000]">🦈 כרישים</h4>
                  <div className="gt-info-wrapper relative cursor-help">
                    <Info size={14} className="text-cyan-700/40 hover:text-cyan-700 transition-colors" />
                    <div className="gt-tooltip">
                      גולשים בעלי העקביות הגבוהה ביותר לאורך כל עונות השנה (שונות נמוכה ביותר בין העונות).
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-700/60 bg-cyan-700/10 px-2 py-1 rounded-full">All-Season Alphas</span>
            </div>
            
            <div className="space-y-4 flex-grow">
              {leaderboards.sharks.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-cyan-800/40 w-4">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full border-2 border-cyan-700/20 overflow-hidden bg-cyan-50">
                      {m.avatar ? (
                        <img src={m.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold">
                          {m.firstName[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[#000000] leading-tight">{m.firstName} {m.lastName}</div>
                      <div className="text-[10px] text-cyan-700 font-bold uppercase">Consistency Index</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#000000]">{m.variance.toFixed(1)}</div>
                    <div className="text-[8px] font-bold text-cyan-700/60">Lower is Better</div>
                  </div>
                </div>
              ))}
              {leaderboards.sharks.length === 0 && (
                <div className="text-center py-12 text-black/40 font-bold italic">טרם נאספו נתונים שנתיים</div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-cyan-900/10 text-[10px] font-bold text-cyan-900/40 text-center uppercase tracking-tighter">
              Metric: Annual Seasonal Variance
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SeasonalPersistence;
