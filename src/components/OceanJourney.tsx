import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { parseDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, CheckCircle2, Star, Info, Waves, HelpCircle, X } from 'lucide-react';

const milestones = [
  { 
    id: 'starfish', 
    src: `${import.meta.env.BASE_URL}images/starfish.png`, 
    alt: 'Starfish', 
    name: 'כוכב ים', 
    desc: 'הצעד הראשון שלך במים. ברוך הבא לקהילה!',
    color: 'from-amber-200 to-amber-500',
    glow: 'shadow-amber-500/50'
  },
  { 
    id: 'penguin', 
    src: `${import.meta.env.BASE_URL}images/penguin.png`, 
    alt: 'Penguin', 
    name: 'פינגווין', 
    desc: 'לוחם חורף אמיתי. המים הקרים הם הבית שלך.',
    color: 'from-blue-300 to-blue-600',
    glow: 'shadow-blue-500/50'
  },
  { 
    id: 'clownfish', 
    src: `${import.meta.env.BASE_URL}images/clownfish.png`, 
    alt: 'Clownfish', 
    name: 'דג ליצן', 
    desc: 'שורד את חום הקיץ עם חיוך. אנרגיה טהורה.',
    color: 'from-orange-300 to-orange-600',
    glow: 'shadow-orange-500/50'
  },
  { 
    id: 'shark', 
    src: `${import.meta.env.BASE_URL}images/shark.png`, 
    alt: 'Shark', 
    name: 'כריש', 
    desc: 'טורף עקביות. אתה מגיע לכל סשן, בכל מצב.',
    color: 'from-slate-400 to-slate-700',
    glow: 'shadow-slate-500/50'
  },
  { 
    id: 'orca', 
    src: `${import.meta.env.BASE_URL}images/orca.png`, 
    alt: 'Orca', 
    name: 'אורקה', 
    desc: 'מאסטר חוף הבית. השלמת את כל האתגרים!',
    color: 'from-indigo-500 to-purple-800',
    glow: 'shadow-indigo-500/50'
  },
];

export const OceanJourney: React.FC = () => {
  const { members, weeklyHistory } = useData();
  const { currentUser } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  const activeCategories = useMemo(() => {
    if (!currentUser || !members || !weeklyHistory) return new Set(['starfish']);

    const userId = currentUser.id;

    const getTemp = (session: any) => {
      if (session.waterTemp !== undefined && session.waterTemp !== null) return session.waterTemp;
      const date = parseDate(session.date) || new Date();
      const month = date.getMonth();
      const averages = [17, 18, 20, 22, 25, 28, 29, 28, 26, 23, 20, 18];
      return averages[month];
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
      const getSeasonIndex = (date: Date) => {
        const month = date.getMonth();
        if (month === 11 || month === 0 || month === 1) return 0;
        if (month >= 2 && month <= 4) return 1;
        if (month >= 5 && month <= 7) return 2;
        return 3;
      };

      weeklyHistory.forEach(s => {
        if (s.participantIds?.includes(member.id)) {
          const date = s.date?.toDate ? s.date.toDate() : new Date(s.date);
          seasonalCounts[getSeasonIndex(date)]++;
        }
      });

      const totalAttendance = seasonalCounts.reduce((a, b) => a + b, 0);
      const mean = totalAttendance / 4;
      const variance = seasonalCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 4;

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
    const orcas = memberStats.filter(m => penguins.some(p => p.id === m.id) && jellyfish.some(j => j.id === m.id) && sharks.some(s => s.id === m.id));

    const active = new Set(['starfish']);
    if (penguins.some(p => p.id === userId)) active.add('penguin');
    if (jellyfish.some(j => j.id === userId)) active.add('clownfish');
    if (sharks.some(s => s.id === userId)) active.add('shark');
    if (orcas.some(o => o.id === userId)) active.add('orca');

    return active;
  }, [members, weeklyHistory, currentUser]);

  const unlockedCount = activeCategories.size;
  const totalCount = milestones.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  return (
    <section className="relative py-16 px-4 md:px-8 overflow-hidden rounded-[3rem] bg-white/40 backdrop-blur-xl border border-white/40 shadow-xl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,113,161,0.05),transparent_70%)]" />
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-200/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-300/20 rounded-full blur-[80px]" 
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16 relative">
          {/* Help Icon & Tooltip */}
          <div className="absolute top-0 right-0 md:right-4">
            <motion.button 
              onClick={() => setShowHelp(!showHelp)}
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0px rgba(6, 182, 212, 0)",
                  "0 0 15px rgba(6, 182, 212, 0.4)",
                  "0 0 0px rgba(6, 182, 212, 0)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="p-2.5 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-600 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-600/30 transition-all duration-300"
              title="איך משחקים?"
            >
              <HelpCircle size={28} />
            </motion.button>
            
            <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute top-14 left-0 md:left-auto md:right-0 w-72 md:w-80 p-6 rounded-3xl bg-[#021626] text-white shadow-2xl z-50 text-right border border-white/10"
                >
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="absolute top-4 left-4 text-white/40 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                  <h4 className="text-lg font-black mb-4 text-cyan-400">איך מתקדמים במסע?</h4>
                  <ul className="space-y-3 text-xs font-bold leading-relaxed">
                    <li className="flex gap-2 items-start">
                      <span className="text-amber-400">★</span>
                      <span><strong className="text-amber-400">כוכב ים:</strong> מוענק לכל חבר חדש שמצטרף למשפחת המים שלנו.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-blue-400">★</span>
                      <span><strong className="text-blue-400">פינגווין:</strong> מוענק על התמדה יוצאת דופן באימוני החורף הקרים.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-orange-400">★</span>
                      <span><strong className="text-orange-400">דג ליצן:</strong> מוענק על שמירה על רצף אימונים גם בימי הקיץ החמים.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-slate-400">★</span>
                      <span><strong className="text-slate-400">כריש:</strong> מוענק על הגעה עקבית ורציפה לכל הסשנים לאורך זמן.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-indigo-400">★</span>
                      <span><strong className="text-indigo-400">אורקה:</strong> המאסטר האמיתי - מי שהצליח להשיג את כל הדרגות!</span>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00426a]/5 border border-[#00426a]/10 mb-4"
          >
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00426a]/60">הגעת – ניצחת. כל השאר בונוס</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-black text-[#00426a] mb-6 tracking-tighter">
            אקלים משתנה – הנחישות גוברת
          </h2>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-black text-cyan-600 uppercase tracking-widest">התקדמות המסע</span>
              <span className="text-2xl font-black text-[#00426a]">{unlockedCount}/{totalCount}</span>
            </div>
            <div className="h-3 w-full bg-[#00426a]/5 rounded-full overflow-hidden border border-[#00426a]/10 p-0.5" dir="ltr">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              />
            </div>
          </div>
        </div>

        {/* Quest Path Visualization */}
        <div className="relative w-full pb-8 pt-4">
          <div className="w-full relative mx-auto px-4 md:px-0">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-[#00426a]/5 -translate-y-1/2 z-0" />
            
            <div className="flex flex-row gap-2 overflow-x-auto pb-4 md:grid md:grid-cols-5 md:gap-4 relative z-10 no-scrollbar">
              {milestones.map((milestone, index) => {
                const isUnlocked = activeCategories.has(milestone.id);
                
                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group flex-shrink-0 w-32 md:w-full"
                  >
                  {/* Milestone Card */}
                  <div className={`
                    relative z-10 flex flex-col items-center p-4 rounded-[2rem] transition-all duration-500
                    ${isUnlocked 
                      ? `bg-gradient-to-b ${milestone.color} shadow-xl ${milestone.glow}` 
                      : 'bg-white/40 border border-[#00426a]/10 grayscale opacity-60'}
                  `}>
                    {/* Status Icon */}
                    <div className="absolute -top-2 -right-2 z-20">
                      {isUnlocked ? (
                        <div className="bg-green-500 rounded-full p-0.5 shadow-lg border-2 border-white">
                          <CheckCircle2 size={14} className="text-white" />
                        </div>
                      ) : (
                        <div className="bg-slate-100 rounded-full p-1 shadow-lg border border-[#00426a]/10">
                          <Lock size={12} className="text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Image Container */}
                    <div className={`
                      w-20 h-20 rounded-full flex items-center justify-center mb-3 relative
                      ${isUnlocked ? 'bg-white/30 backdrop-blur-md' : 'bg-white/20'}
                    `}>
                      {isUnlocked && (
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-white blur-lg"
                        />
                      )}
                      <img 
                        src={milestone.src} 
                        alt={milestone.alt} 
                        className={`w-16 h-16 object-contain relative z-10 ${isUnlocked ? 'drop-shadow-xl' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <h4 className={`text-sm font-black mb-1 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                      {milestone.name}
                    </h4>
                    
                    <p className={`text-[8px] text-center font-bold leading-tight ${isUnlocked ? 'text-white/90' : 'text-slate-400'}`}>
                      {milestone.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Footer Motivation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-8 rounded-[2.5rem] bg-white/60 border border-white/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right relative z-10">
              <motion.div 
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30"
              >
                <Waves size={32} />
              </motion.div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black mb-2 bg-gradient-to-l from-[#00426a] to-cyan-600 bg-clip-text text-transparent">
                  חוף הבית מחכה לך
                </h3>
                <p className="text-sm md:text-base font-bold text-[#00426a]/80 leading-relaxed">
                  המשך להתמיד, כל סשן מקרב אותך לדרגה הבאה במסע.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
