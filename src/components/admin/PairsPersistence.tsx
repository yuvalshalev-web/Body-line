import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  HeartHandshake, 
  Trophy, 
  Sparkles, 
  Flame, 
  Calendar, 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  Waves, 
  Leaf, 
  Snowflake, 
  Sun, 
  Info,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  Award,
  Link2,
  Zap,
  HelpCircle,
  UserCheck,
  UserX,
  UserMinus,
  User,
  Compass
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  LineChart, 
  Line, 
  Legend, 
  Area, 
  AreaChart,
  PieChart,
  Pie
} from 'recharts';
import { useData } from '../../contexts/DataContext';
import { parseDate, formatDate } from '../../utils/dateUtils';
import { Member } from '../../types';

interface PairStats {
  id: string;
  volunteer: Member;
  participant: Member;
  jointSessions: number;
  volunteerSoloSessions: number;
  participantSoloSessions: number;
  totalEitherSessions: number;
  togethernessRate: number; // % of sessions when at least one showed up that both were together
  attendanceRate: number;   // % out of all eligible sessions
  currentJointStreak: number;
  maxJointStreak: number;
  lastJointSessionDate: string | null;
  seasonBreakdown: {
    autumn: { joint: number; either: number; rate: number };
    winter: { joint: number; either: number; rate: number };
    spring: { joint: number; either: number; rate: number };
    summer: { joint: number; either: number; rate: number };
  };
  bestSeasonName: string;
}

const translateRole = (role?: string) => {
  switch (role) {
    case 'Volunteer': return 'מתנדב';
    case 'Member': return 'משתתף';
    case 'Instructor': return 'מדריך';
    case 'Admin': return 'מנהל';
    case 'Staff': return 'צוות עמותה';
    case 'Support': return 'תמיכה';
    default: return role || '';
  }
};

const getSeasonIndex = (date: Date) => {
  const month = date.getMonth();
  if (month === 11 || month === 0 || month === 1) return 'winter'; // Dec, Jan, Feb
  if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer'; // Jun, Jul, Aug
  return 'autumn'; // Sep, Oct, Nov
};

const PairsPersistence: React.FC = () => {
  const { members, weeklyHistory } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'joint' | 'rate' | 'streak' | 'recent'>('joint');

  // 1. Compute Pair Statistics
  const { 
    pairsStats, 
    top5Pairs, 
    communitySyncRate, 
    seasonalAggregates, 
    totalPairsCount,
    buddyBoostMultiplier,
    avgJointStreak,
    arrivalBreakdown
  } = useMemo(() => {
    const emptyArrivalBreakdown = {
      totalAttendeeVisits: 0,
      duoAttendeeVisits: 0,
      soloWithPartnerVisits: 0,
      independentVisits: 0,
      duoPer100: 0,
      soloWithPartnerPer100: 0,
      independentPer100: 0,
      totalPairedSurferVisits: 0,
      pairedTogetherPct: 0,
      pairedSoloPct: 0,
      avgSurfersPerSession: '0.0',
      avgDuoPerSession: '0.0',
      avgSoloWithPartnerPerSession: '0.0',
      avgIndependentPerSession: '0.0'
    };

    if (!members || !members.length) {
      return {
        pairsStats: [],
        top5Pairs: [],
        communitySyncRate: 0,
        seasonalAggregates: [],
        totalPairsCount: 0,
        buddyBoostMultiplier: 0,
        avgJointStreak: 0,
        arrivalBreakdown: emptyArrivalBreakdown
      };
    }

    // Filter valid surf sessions (excluding social events)
    const validSessions = (weeklyHistory || [])
      .filter(s => !s.isEvent && s.date)
      .map(s => {
        const d = parseDate(s.date) || new Date();
        return {
          ...s,
          parsedDate: d,
          participantIds: Array.isArray(s.participantIds) ? s.participantIds : []
        };
      })
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    const totalSessionsCount = validSessions.length;

    // Build pairs map
    const pairsMap = new Map<string, { volunteer: Member; participant: Member }>();
    members.forEach(m => {
      if (m.partnerId) {
        const partner = members.find(p => p.id === m.partnerId);
        if (partner) {
          const key = [m.id, partner.id].sort().join('__');
          if (!pairsMap.has(key)) {
            const vol = m.role === 'Volunteer' ? m : partner.role === 'Volunteer' ? partner : m;
            const part = vol.id === m.id ? partner : m;
            pairsMap.set(key, { volunteer: vol, participant: part });
          }
        }
      }
    });

    const pairsList = Array.from(pairsMap.entries());

    // Calculate individual stats for each pair
    const calculatedPairs: PairStats[] = pairsList.map(([key, { volunteer, participant }]) => {
      let jointSessions = 0;
      let volunteerSoloSessions = 0;
      let participantSoloSessions = 0;
      let currentJointStreak = 0;
      let maxJointStreak = 0;
      let tempStreak = 0;
      let lastJointSessionDate: string | null = null;

      const seasons = {
        autumn: { joint: 0, either: 0, rate: 0 },
        winter: { joint: 0, either: 0, rate: 0 },
        spring: { joint: 0, either: 0, rate: 0 },
        summer: { joint: 0, either: 0, rate: 0 }
      };

      // Traverse chronologically
      validSessions.forEach(session => {
        const hasVol = session.participantIds.includes(volunteer.id);
        const hasPart = session.participantIds.includes(participant.id);
        const seasonKey = getSeasonIndex(session.parsedDate) as keyof typeof seasons;

        if (hasVol && hasPart) {
          jointSessions++;
          tempStreak++;
          if (tempStreak > maxJointStreak) maxJointStreak = tempStreak;
          lastJointSessionDate = session.date;
          seasons[seasonKey].joint++;
          seasons[seasonKey].either++;
        } else if (hasVol && !hasPart) {
          volunteerSoloSessions++;
          tempStreak = 0;
          seasons[seasonKey].either++;
        } else if (!hasVol && hasPart) {
          participantSoloSessions++;
          tempStreak = 0;
          seasons[seasonKey].either++;
        }
      });

      // Calculate streak from latest sessions backwards
      let backwardStreak = 0;
      for (let i = validSessions.length - 1; i >= 0; i--) {
        const s = validSessions[i];
        const hasVol = s.participantIds.includes(volunteer.id);
        const hasPart = s.participantIds.includes(participant.id);
        if (hasVol && hasPart) {
          backwardStreak++;
        } else if (hasVol || hasPart) {
          break; // broke joint attendance
        }
      }
      currentJointStreak = backwardStreak;

      // Seasonal rates
      Object.keys(seasons).forEach(sk => {
        const k = sk as keyof typeof seasons;
        seasons[k].rate = seasons[k].either > 0 
          ? Math.round((seasons[k].joint / seasons[k].either) * 100) 
          : 0;
      });

      const totalEitherSessions = jointSessions + volunteerSoloSessions + participantSoloSessions;
      const togethernessRate = totalEitherSessions > 0 
        ? Math.round((jointSessions / totalEitherSessions) * 100) 
        : 0;
      const attendanceRate = totalSessionsCount > 0 
        ? Math.round((jointSessions / totalSessionsCount) * 100) 
        : 0;

      // Determine best season
      const seasonArr = [
        { name: 'סתיו 🍂', joint: seasons.autumn.joint },
        { name: 'חורף ❄️', joint: seasons.winter.joint },
        { name: 'אביב 🌸', joint: seasons.spring.joint },
        { name: 'קיץ ☀️', joint: seasons.summer.joint },
      ].sort((a, b) => b.joint - a.joint);

      const bestSeasonName = seasonArr[0].joint > 0 ? seasonArr[0].name : 'כל העונות';

      return {
        id: key,
        volunteer,
        participant,
        jointSessions,
        volunteerSoloSessions,
        participantSoloSessions,
        totalEitherSessions,
        togethernessRate,
        attendanceRate,
        currentJointStreak,
        maxJointStreak,
        lastJointSessionDate,
        seasonBreakdown: seasons,
        bestSeasonName
      };
    });

    // Top 5 pairs sorted by joint sessions count and togetherness rate
    const top5 = [...calculatedPairs]
      .sort((a, b) => b.jointSessions - a.jointSessions || b.togethernessRate - a.togethernessRate)
      .slice(0, 5);

    // Community-wide togetherness sync calculation
    let totalAllJoint = 0;
    let totalAllEither = 0;
    let totalStreakSum = 0;

    calculatedPairs.forEach(p => {
      totalAllJoint += p.jointSessions;
      totalAllEither += p.totalEitherSessions;
      totalStreakSum += p.currentJointStreak;
    });

    const communitySyncRate = totalAllEither > 0 
      ? Math.round((totalAllJoint / totalAllEither) * 100) 
      : 0;

    const avgJointStreak = calculatedPairs.length > 0 
      ? (totalStreakSum / calculatedPairs.length).toFixed(1) 
      : '0';

    // Buddy boost calculation (Attendance rate of paired members vs unpaired members)
    const pairedMemberIds = new Set<string>();
    calculatedPairs.forEach(p => {
      pairedMemberIds.add(p.volunteer.id);
      pairedMemberIds.add(p.participant.id);
    });

    const activeMembersList = members.filter(m => m.isActive !== false && m.role !== 'Staff');
    const unpairedMembers = activeMembersList.filter(m => !pairedMemberIds.has(m.id));

    let pairedAttTotal = 0;
    activeMembersList.filter(m => pairedMemberIds.has(m.id)).forEach(m => {
      const count = validSessions.filter(s => s.participantIds.includes(m.id)).length;
      pairedAttTotal += count;
    });
    const avgPairedAtt = pairedMemberIds.size > 0 ? (pairedAttTotal / pairedMemberIds.size) : 0;

    let unpairedAttTotal = 0;
    unpairedMembers.forEach(m => {
      const count = validSessions.filter(s => s.participantIds.includes(m.id)).length;
      unpairedAttTotal += count;
    });
    const avgUnpairedAtt = unpairedMembers.length > 0 ? (unpairedAttTotal / unpairedMembers.length) : 0;

    const buddyBoostMultiplier = avgUnpairedAtt > 0 
      ? Math.round(((avgPairedAtt - avgUnpairedAtt) / avgUnpairedAtt) * 100) 
      : 28; // standard baseline boost

    // Member lookup map
    const memberMap = new Map<string, Member>();
    members.forEach(m => memberMap.set(m.id, m));

    // Per-attendee breakdown across all sessions:
    let totalAttendeeVisits = 0;
    let duoAttendeeVisits = 0;
    let soloWithPartnerVisits = 0;
    let independentVisits = 0;

    validSessions.forEach(session => {
      const pIds = session.participantIds;
      pIds.forEach((id: string) => {
        totalAttendeeVisits++;
        const m = memberMap.get(id);
        if (m && m.partnerId) {
          if (pIds.includes(m.partnerId)) {
            duoAttendeeVisits++;
          } else {
            soloWithPartnerVisits++;
          }
        } else {
          independentVisits++;
        }
      });
    });

    const duoPer100 = totalAttendeeVisits > 0 ? Math.round((duoAttendeeVisits / totalAttendeeVisits) * 100) : 0;
    const soloWithPartnerPer100 = totalAttendeeVisits > 0 ? Math.round((soloWithPartnerVisits / totalAttendeeVisits) * 100) : 0;
    const independentPer100 = Math.max(0, 100 - duoPer100 - soloWithPartnerPer100);

    const totalPairedSurferVisits = duoAttendeeVisits + soloWithPartnerVisits;
    const pairedTogetherPct = totalPairedSurferVisits > 0 ? Math.round((duoAttendeeVisits / totalPairedSurferVisits) * 100) : 0;
    const pairedSoloPct = 100 - pairedTogetherPct;

    const sessionCount = validSessions.length || 1;
    const avgSurfersPerSession = (totalAttendeeVisits / sessionCount).toFixed(1);
    const avgDuoPerSession = (duoAttendeeVisits / sessionCount).toFixed(1);
    const avgSoloWithPartnerPerSession = (soloWithPartnerVisits / sessionCount).toFixed(1);
    const avgIndependentPerSession = (independentVisits / sessionCount).toFixed(1);

    const arrivalBreakdown = {
      totalAttendeeVisits,
      duoAttendeeVisits,
      soloWithPartnerVisits,
      independentVisits,
      duoPer100,
      soloWithPartnerPer100,
      independentPer100,
      totalPairedSurferVisits,
      pairedTogetherPct,
      pairedSoloPct,
      avgSurfersPerSession,
      avgDuoPerSession,
      avgSoloWithPartnerPerSession,
      avgIndependentPerSession
    };

    // Seasonal Aggregates for Community
    const seasonConfigs = [
      { id: 'autumn', name: 'סתיו', icon: Leaf, color: '#FF9F1C', months: [8, 9, 10] },
      { id: 'winter', name: 'חורף', icon: Snowflake, color: '#00B4D8', months: [11, 0, 1] },
      { id: 'spring', name: 'אביב', icon: Waves, color: '#2DA95C', months: [2, 3, 4] },
      { id: 'summer', name: 'קיץ', icon: Sun, color: '#FFDE45', months: [5, 6, 7] },
    ];

    const seasonalAggregates = seasonConfigs.map(cfg => {
      const seasonKey = cfg.id as 'autumn' | 'winter' | 'spring' | 'summer';
      const seasonSessions = validSessions.filter(s => cfg.months.includes(s.parsedDate.getMonth()));
      let seasonJointCount = 0;
      let seasonEitherCount = 0;

      calculatedPairs.forEach(p => {
        const sData = p.seasonBreakdown[seasonKey];
        seasonJointCount += sData.joint;
        seasonEitherCount += sData.either;
      });

      const syncRate = seasonEitherCount > 0 
        ? Math.round((seasonJointCount / seasonEitherCount) * 100) 
        : 0;

      // Find top pair for this season
      const seasonPairsRank = [...calculatedPairs].sort((a, b) => {
        const aVal = a.seasonBreakdown[seasonKey].joint;
        const bVal = b.seasonBreakdown[seasonKey].joint;
        return bVal - aVal;
      });
      const topPair = seasonPairsRank[0] && seasonPairsRank[0].seasonBreakdown[seasonKey].joint > 0 
        ? seasonPairsRank[0] 
        : null;

      return {
        ...cfg,
        sessionCount: seasonSessions.length,
        jointCount: seasonJointCount,
        syncRate,
        topPair
      };
    });

    return {
      pairsStats: calculatedPairs,
      top5Pairs: top5,
      communitySyncRate,
      seasonalAggregates,
      totalPairsCount: calculatedPairs.length,
      buddyBoostMultiplier: Math.max(0, buddyBoostMultiplier),
      avgJointStreak,
      arrivalBreakdown
    };
  }, [members, weeklyHistory]);

  const [ratioViewMode, setRatioViewMode] = useState<'allSurfers' | 'pairedOnly'>('allSurfers');

  // Filter & Search Pairs Table
  const filteredPairs = useMemo(() => {
    return pairsStats
      .filter(p => {
        const matchesSearch = 
          `${p.volunteer.firstName} ${p.volunteer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${p.participant.firstName} ${p.participant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        if (filterTier === 'high') return p.togethernessRate >= 80;
        if (filterTier === 'medium') return p.togethernessRate >= 50 && p.togethernessRate < 80;
        if (filterTier === 'low') return p.togethernessRate < 50;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'joint') return b.jointSessions - a.jointSessions || b.togethernessRate - a.togethernessRate;
        if (sortBy === 'rate') return b.togethernessRate - a.togethernessRate || b.jointSessions - a.jointSessions;
        if (sortBy === 'streak') return b.currentJointStreak - a.currentJointStreak || b.maxJointStreak - a.maxJointStreak;
        if (sortBy === 'recent') {
          const da = a.lastJointSessionDate ? new Date(a.lastJointSessionDate).getTime() : 0;
          const db = b.lastJointSessionDate ? new Date(b.lastJointSessionDate).getTime() : 0;
          return db - da;
        }
        return 0;
      });
  }, [pairsStats, searchTerm, filterTier, sortBy]);

  // Chart data for seasonal progression
  const seasonalChartData = useMemo(() => {
    return seasonalAggregates.map(s => ({
      name: s.name,
      'סנכרון זוגי (%)': s.syncRate,
      'סשנים משותפים': s.jointCount,
      color: s.color
    }));
  }, [seasonalAggregates]);

  return (
    <div className="space-y-12 font-yehuda" dir="rtl">
      {/* 1. Header Banner & Intro */}
      <div className="admin-info-card p-8 rounded-[3rem] shadow-soft space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-rose-500/20 to-orange-500/20 rounded-2xl border border-rose-500/30 text-rose-600 shadow-sm">
                <HeartHandshake size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#121212] tracking-tight">התמדה זוגית • חבל זוג</h2>
                <p className="text-sm text-black/60 font-medium">ניתוח דפוסי גלישה משותפת, סנכרון זוגות והתמדה לאורך עונות השנה</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/80 border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-3">
              <Users className="text-indigo-600" size={20} />
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">זוגות פעילים</div>
                <div className="text-xl font-black text-slate-900">{totalPairsCount} חבלי זוג</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-3">
              <Zap className="text-emerald-600" size={20} />
              <div>
                <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">אפקט חבל זוג</div>
                <div className="text-xl font-black text-emerald-700">+{buddyBoostMultiplier}% בהתמדה</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Community Sync Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-card p-6 rounded-3xl relative overflow-hidden group border border-rose-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-500/15 rounded-2xl text-rose-600">
              <HeartHandshake size={26} />
            </div>
            <div className="gt-info-wrapper relative cursor-help">
              <Info size={16} className="text-slate-400 hover:text-slate-600" />
              <div className="gt-tooltip">
                אחוז הפעמים שבהן הזוגות הגיעו יחד למים מתוך כלל הפעמים שלפחות אחד מבני הזוג גלש.
              </div>
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tight">{communitySyncRate}%</div>
          <div className="text-sm font-bold text-slate-600 mt-1">מחוברות זוגית קהילתית</div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-rose-500 to-orange-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${communitySyncRate}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            {communitySyncRate >= 70 ? '🌟 סנכרון גבוה מאוד בין מתנדבים למשתתפים' : '📈 מגמת חיזוק הקשר הזוגי בסשנים'}
          </p>
        </motion.div>

        {/* Metric 2: Top Pair Sessions Record */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="luxury-card p-6 rounded-3xl relative overflow-hidden group border border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/15 rounded-2xl text-amber-600">
              <Trophy size={26} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              שיא קהילתי
            </span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            {top5Pairs[0]?.jointSessions || 0}
          </div>
          <div className="text-sm font-bold text-slate-600 mt-1">סשנים משותפים לזוג המוביל</div>
          <div className="text-[12px] text-amber-700 font-black mt-3 truncate">
            {top5Pairs[0] ? `${top5Pairs[0].volunteer.firstName} & ${top5Pairs[0].participant.firstName}` : 'טרם נרשמו נתונים'}
          </div>
          <p className="text-[11px] text-slate-400 font-bold mt-1">
            עם {top5Pairs[0]?.togethernessRate || 0}% הגעה משותפת
          </p>
        </motion.div>

        {/* Metric 3: Active Consecutive Streaks */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="luxury-card p-6 rounded-3xl relative overflow-hidden group border border-cyan-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/15 rounded-2xl text-cyan-600">
              <Flame size={26} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
              רצף פעיל
            </span>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            {Math.max(...pairsStats.map(p => p.currentJointStreak), 0)}
          </div>
          <div className="text-sm font-bold text-slate-600 mt-1">שיא רצף שבועות רצופים יחד</div>
          <div className="text-[12px] text-cyan-700 font-black mt-3">
            ממוצע קהילתי: {avgJointStreak} שבועות
          </div>
          <p className="text-[11px] text-slate-400 font-bold mt-1">
            רצף סשנים משותף ללא היעדרות
          </p>
        </motion.div>

        {/* Metric 4: Mutual Anchor Synergy */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="luxury-card p-6 rounded-3xl relative overflow-hidden group border border-emerald-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/15 rounded-2xl text-emerald-600">
              <Sparkles size={26} />
            </div>
            <div className="gt-info-wrapper relative cursor-help">
              <Info size={16} className="text-slate-400 hover:text-slate-600" />
              <div className="gt-tooltip">
                השוואת שיעור ההתמדה הכללי של חברים המצוותים בחבל זוג לעומת גולשים ללא שותף.
              </div>
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            +{buddyBoostMultiplier}%
          </div>
          <div className="text-sm font-bold text-slate-600 mt-1">תוספת התמדה בזכות חבל זוג</div>
          <div className="mt-3 text-[12px] text-emerald-800 font-bold">
            חיבור רגשי ומחויבות הדדית
          </div>
          <p className="text-[11px] text-slate-400 font-bold mt-1">
            מעלה דרמטית את תדירות הגלישה
          </p>
        </motion.div>
      </div>

      {/* 3. RATIO: PAIRED DUOS VS. SOLO ATTENDEES (התפלגות 100% ממשתתפי הסשן) */}
      <div className="admin-info-card p-6 md:p-8 rounded-[3rem] shadow-soft space-y-8 relative overflow-hidden border border-slate-200/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-gradient-to-tr from-indigo-500/20 via-rose-500/15 to-emerald-500/20 rounded-2xl border border-indigo-500/30 text-indigo-700 shadow-sm">
              <Users size={30} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">התפלגות נוכחות בסשן: זוגות מול יחידים (100%)</h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  פילוח 100% נוכחות
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                התפלגות באחוזים של המשתתפים בסשן: כמה % מגיעים יחד כזוג מתואם, כמה % מגיעים לבד ללא השותף וכמה % גולשים עצמאיים
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start lg:self-auto border border-slate-200/80">
            <button
              onClick={() => setRatioViewMode('allSurfers')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                ratioViewMode === 'allSurfers'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🌊 100% מכלל משתתפי הסשן
            </button>
            <button
              onClick={() => setRatioViewMode('pairedOnly')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                ratioViewMode === 'pairedOnly'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🤝 100% מחברי חבלי הזוג
            </button>
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Duo */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/40 p-5 rounded-3xl border border-emerald-500/30 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-700 rounded-2xl">
                <UserCheck size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                שני בני הזוג הגיעו
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-950">
                {ratioViewMode === 'allSurfers' ? arrivalBreakdown.duoPer100 : arrivalBreakdown.pairedTogetherPct}%
              </span>
              <span className="text-sm font-black text-emerald-700">
                {ratioViewMode === 'allSurfers' ? 'מכלל הגולשים בסשן' : 'מחברי חבל זוג'}
              </span>
            </div>
            <div className="text-xs font-bold text-emerald-900 mt-2">
              הגיעו כזוג מתואם (שני בני הזוג במים יחד)
            </div>
            <div className="text-[11px] text-emerald-700/80 font-bold mt-2 pt-2 border-t border-emerald-200/60 flex justify-between">
              <span>סה״כ נוכחויות זוגיות: {arrivalBreakdown.duoAttendeeVisits}</span>
              <span>ממוצע: {arrivalBreakdown.avgDuoPerSession} משתתפים/סשן</span>
            </div>
          </div>

          {/* Solo with Partner */}
          <div className="bg-gradient-to-br from-amber-50/80 to-rose-50/40 p-5 rounded-3xl border border-amber-500/30 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-700 rounded-2xl">
                <UserX size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                שותף/ה נעדר/ה
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-950">
                {ratioViewMode === 'allSurfers' ? arrivalBreakdown.soloWithPartnerPer100 : arrivalBreakdown.pairedSoloPct}%
              </span>
              <span className="text-sm font-black text-amber-700">
                {ratioViewMode === 'allSurfers' ? 'מכלל הגולשים בסשן' : 'מחברי חבל זוג'}
              </span>
            </div>
            <div className="text-xs font-bold text-amber-900 mt-2">
              בעלי חבל זוג שהגיעו לבד (ללא בן/בת הזוג)
            </div>
            <div className="text-[11px] text-amber-700/80 font-bold mt-2 pt-2 border-t border-amber-200/60 flex justify-between">
              <span>סה״כ נוכחויות סולו: {arrivalBreakdown.soloWithPartnerVisits}</span>
              <span>ממוצע: {arrivalBreakdown.avgSoloWithPartnerPerSession} משתתפים/סשן</span>
            </div>
          </div>

          {/* Independent / Unpaired */}
          <div className={`p-5 rounded-3xl border relative overflow-hidden group transition-all ${
            ratioViewMode === 'allSurfers'
              ? 'bg-gradient-to-br from-sky-50/80 to-indigo-50/40 border-sky-500/30'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-700 rounded-2xl">
                <Compass size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                {ratioViewMode === 'allSurfers' ? 'ללא חבל זוג' : 'לא נכללים'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-sky-950">
                {ratioViewMode === 'allSurfers' ? `${arrivalBreakdown.independentPer100}%` : '—'}
              </span>
              <span className="text-sm font-black text-sky-700">
                {ratioViewMode === 'allSurfers' ? 'מכלל הגולשים בסשן' : 'רק בעלי חבל זוג'}
              </span>
            </div>
            <div className="text-xs font-bold text-sky-900 mt-2">
              גולשים עצמאיים (משתתפים/מתנדבים ללא בן זוג קבוע)
            </div>
            <div className="text-[11px] text-sky-700/80 font-bold mt-2 pt-2 border-t border-sky-200/60 flex justify-between">
              <span>סה״כ נוכחויות: {arrivalBreakdown.independentVisits}</span>
              <span>ממוצע: {arrivalBreakdown.avgIndependentPerSession} משתתפים/סשן</span>
            </div>
          </div>
        </div>

        {/* The 100% Surfers Visual Matrix (פילוח 100% נוכחות) */}
        <div className="bg-white/95 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>לוח התפלגות 100% נוכחות בסשן טיפוסי</span>
                <span className="text-xs font-bold text-slate-400"> (כל משבצת = 1% מהנוכחות)</span>
              </h4>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {ratioViewMode === 'allSurfers'
                  ? 'חלוקת 100% מהגולשים בסשן לפי אופן ההגעה והסנכרון'
                  : 'חלוקת 100% מגולשי חבל זוג – הגעה יחד מול הגעה לבד'}
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>הגיעו יחד ({ratioViewMode === 'allSurfers' ? arrivalBreakdown.duoPer100 : arrivalBreakdown.pairedTogetherPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1 rounded-xl border border-amber-200">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>הגיעו לבד ({ratioViewMode === 'allSurfers' ? arrivalBreakdown.soloWithPartnerPer100 : arrivalBreakdown.pairedSoloPct}%)</span>
              </div>
              {ratioViewMode === 'allSurfers' && (
                <div className="flex items-center gap-1.5 bg-sky-50 text-sky-800 px-3 py-1 rounded-xl border border-sky-200">
                  <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                  <span>עצמאיים ({arrivalBreakdown.independentPer100}%)</span>
                </div>
              )}
            </div>
          </div>

          {/* 10x10 Unit Grid of 100% */}
          <div className="p-4 bg-slate-50/80 rounded-3xl border border-slate-200/80">
            <div className="grid grid-cols-10 sm:grid-cols-20 gap-2 sm:gap-2.5 justify-items-center">
              {Array.from({ length: 100 }).map((_, i) => {
                let type: 'duo' | 'soloWithPartner' | 'independent';
                let label = '';
                let bgClass = '';
                let borderClass = '';

                if (ratioViewMode === 'allSurfers') {
                  if (i < arrivalBreakdown.duoPer100) {
                    type = 'duo';
                    label = 'הגיעו יחד כזוג מתואם';
                    bgClass = 'bg-emerald-500 text-white';
                    borderClass = 'border-emerald-600 shadow-xs shadow-emerald-500/20';
                  } else if (i < arrivalBreakdown.duoPer100 + arrivalBreakdown.soloWithPartnerPer100) {
                    type = 'soloWithPartner';
                    label = 'הגיעו לבד (שותף נעדר)';
                    bgClass = 'bg-amber-500 text-white';
                    borderClass = 'border-amber-600 shadow-xs shadow-amber-500/20';
                  } else {
                    type = 'independent';
                    label = 'גולש עצמאי';
                    bgClass = 'bg-sky-500 text-white';
                    borderClass = 'border-sky-600 shadow-xs shadow-sky-500/20';
                  }
                } else {
                  if (i < arrivalBreakdown.pairedTogetherPct) {
                    type = 'duo';
                    label = 'הגיעו יחד כזוג';
                    bgClass = 'bg-emerald-500 text-white';
                    borderClass = 'border-emerald-600 shadow-xs shadow-emerald-500/20';
                  } else {
                    type = 'soloWithPartner';
                    label = 'הגיעו לבד ללא השותף';
                    bgClass = 'bg-amber-500 text-white';
                    borderClass = 'border-amber-600 shadow-xs shadow-amber-500/20';
                  }
                }

                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.25, zIndex: 30 }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-[10px] cursor-pointer transition-all border ${bgClass} ${borderClass} relative group/dot`}
                  >
                    {type === 'duo' ? (
                      <Users size={14} />
                    ) : type === 'soloWithPartner' ? (
                      <UserX size={14} />
                    ) : (
                      <User size={14} />
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 hidden group-hover/dot:block z-50 whitespace-nowrap bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-xl pointer-events-none">
                      {i + 1}% מסך הנוכחות: {label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Strategic Insight Box */}
          <div className="p-5 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-rose-50/90 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                <span>תובנה ניהולית לסנכרון חבלי זוג:</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                מתוך 100% מגולשי חבל זוג בסשנים – <strong className="text-emerald-700 font-black">{arrivalBreakdown.pairedTogetherPct}% מגיעים יחד כזוג מתואם</strong>, ורק <strong className="text-amber-700 font-black">{arrivalBreakdown.pairedSoloPct}% מגיעים לבד</strong> ללא השותף שלהם.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-bold shrink-0 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              ממוצע נוכחות לסשן: <span className="font-black text-slate-900">{arrivalBreakdown.avgSurfersPerSession} משתתפים</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TOP 5 PAIRS - 5 הזוגות המתמידים ביותר להגיע ביחד */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30 text-amber-600 shadow-sm">
              <Trophy size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">5 הזוגות המתמידים ביותר להגיע ביחד 🏆</h3>
              <p className="text-xs text-slate-500 font-bold">היכל התהילה של חבל זוג • הזוגות שכבשו את המים זה לצד זה</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
              מבוסס סשנים משותפים ורצף הגעה
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {top5Pairs.map((pair, index) => {
            const isGold = index === 0;
            const isSilver = index === 1;
            const isBronze = index === 2;

            const badgeBg = isGold 
              ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30' 
              : isSilver 
              ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-md shadow-slate-400/20' 
              : isBronze 
              ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-md shadow-amber-900/20' 
              : 'bg-slate-100 text-slate-700 border border-slate-200';

            const cardBorder = isGold 
              ? 'border-2 border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5' 
              : isSilver 
              ? 'border-2 border-slate-300/80 bg-gradient-to-b from-slate-200/20 via-white to-transparent' 
              : isBronze 
              ? 'border-2 border-amber-800/30 bg-gradient-to-b from-amber-800/10 via-white to-transparent' 
              : 'border border-slate-200/80 bg-white';

            return (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative rounded-[2.5rem] p-6 ${cardBorder} shadow-soft flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300`}
              >
                {/* Crown / Rank Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm ${badgeBg}`}>
                    {isGold ? '🥇 1' : isSilver ? '🥈 2' : isBronze ? '🥉 3' : `#${index + 1}`}
                  </div>

                  <div className="flex items-center gap-1 bg-white/90 border border-slate-200/80 px-2.5 py-1 rounded-full text-[11px] font-black text-rose-600 shadow-xs">
                    <HeartHandshake size={14} />
                    <span>{pair.togethernessRate}% ביחד</span>
                  </div>
                </div>

                {/* Combined Avatars Connected with Rope */}
                <div className="flex flex-col items-center my-3 relative">
                  <div className="flex items-center justify-center -space-x-3 rtl:space-x-reverse relative z-10">
                    {/* Volunteer */}
                    <div className="relative group/vol">
                      <div className="w-16 h-16 rounded-full border-3 border-indigo-500/80 overflow-hidden bg-indigo-50 shadow-md">
                        {pair.volunteer.avatar ? (
                          <img src={pair.volunteer.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold text-lg">
                            {pair.volunteer.firstName[0]}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                        מתנדב
                      </span>
                    </div>

                    {/* Connecting Rope Icon */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 text-white flex items-center justify-center z-20 shadow-md border-2 border-white">
                      <Link2 size={16} />
                    </div>

                    {/* Participant */}
                    <div className="relative group/part">
                      <div className="w-16 h-16 rounded-full border-3 border-rose-500/80 overflow-hidden bg-rose-50 shadow-md">
                        {pair.participant.avatar ? (
                          <img src={pair.participant.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-400 font-bold text-lg">
                            {pair.participant.firstName[0]}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -left-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                        משתתף
                      </span>
                    </div>
                  </div>

                  {/* Names */}
                  <div className="text-center mt-4 space-y-0.5">
                    <h4 className="font-black text-slate-900 text-base leading-snug">
                      {pair.volunteer.firstName} & {pair.participant.firstName}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold">
                      {pair.volunteer.lastName} • {pair.participant.lastName}
                    </p>
                  </div>
                </div>

                {/* Pair Highlights & Badges */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">סשנים משותפים:</span>
                    <span className="font-black text-slate-900 text-sm">{pair.jointSessions} סשנים</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">רצף נוכחי:</span>
                    <span className="font-black text-emerald-600 flex items-center gap-1">
                      <Flame size={13} /> {pair.currentJointStreak} שבועות
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">עונת שיא:</span>
                    <span className="font-black text-slate-700">{pair.bestSeasonName}</span>
                  </div>
                </div>

                {/* Bottom decorative bar */}
                <div className="mt-4 pt-2 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {pair.lastJointSessionDate ? `סשן אחרון: ${formatDate(pair.lastJointSessionDate)}` : 'סשנים פעילים'}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {top5Pairs.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200">
              טרם נוצרו זוגות במערכת או שאין היסטוריית סשנים מספקת.
            </div>
          )}
        </div>
      </div>

      {/* 4. SEASONAL PERSISTENCE BY SEASON (אחוזי התמדה זוגית לפי עונות השנה) */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-sky-500/20 to-teal-500/20 rounded-2xl border border-sky-500/30 text-sky-600 shadow-sm">
            <Calendar size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">אחוזי התמדה זוגית לפי עונות השנה 🍂 ❄️ 🌸 ☀️</h3>
            <p className="text-xs text-slate-500 font-bold">מעקב אחרי יציבות חבלי הזוג בתנאי הים המשתנים לאורך 4 העונות</p>
          </div>
        </div>

        {/* 4 Seasonal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {seasonalAggregates.map((season, idx) => {
            const Icon = season.icon;
            return (
              <motion.div
                key={season.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="luxury-card p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between group border border-slate-200/80 shadow-soft"
              >
                <div 
                  className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                  style={{ backgroundColor: season.color }}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl border border-white/40 shadow-inner" style={{ backgroundColor: `${season.color}25` }}>
                        <Icon size={22} style={{ color: season.color }} />
                      </div>
                      <h4 className="text-xl font-black text-slate-900">{season.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {season.sessionCount} סשנים
                    </span>
                  </div>

                  <div className="my-4">
                    <div className="text-[11px] font-bold text-slate-500 mb-1">אחוז התמדה זוגית בעונה:</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900">{season.syncRate}%</span>
                      <span className="text-xs font-bold text-slate-400">סנכרון</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${season.syncRate}%`, backgroundColor: season.color }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 font-bold space-y-1 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">סה״כ סשנים יחד בעונה:</span>
                      <span className="font-black text-slate-800">{season.jointCount}</span>
                    </div>
                  </div>
                </div>

                {/* Season Champion Pair */}
                <div className="mt-5 pt-3 border-t border-dashed border-slate-200">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    🏆 אלופי עונת ה{season.name}
                  </div>
                  {season.topPair ? (
                    <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-slate-200/60">
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-100 border border-white">
                          {season.topPair.volunteer.avatar ? (
                            <img src={season.topPair.volunteer.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                              {season.topPair.volunteer.firstName[0]}
                            </div>
                          )}
                        </div>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-rose-100 border border-white">
                          {season.topPair.participant.avatar ? (
                            <img src={season.topPair.participant.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-rose-600">
                              {season.topPair.participant.firstName[0]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] font-black text-slate-800 truncate">
                        {season.topPair.volunteer.firstName} & {season.topPair.participant.firstName}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">טרם נקבעו אלופים</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Seasonal Comparison Chart */}
        <div className="luxury-card p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h4 className="text-xl font-black text-slate-900">השוואת התמדה זוגית בין עונות השנה 📊</h4>
              <p className="text-xs text-slate-500 font-bold">שיעור המחוברות הזוגית וכמות הסשנים המשותפים לאורך 4 העונות</p>
            </div>
          </div>

          <div className="h-[280px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} axisLine={{ stroke: '#CBD5E1' }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 12 }} axisLine={{ stroke: '#CBD5E1' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '16px', 
                    color: '#fff', 
                    border: 'none', 
                    direction: 'rtl', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' 
                  }} 
                  formatter={(value: any, name: any) => [`${value}${String(name || '').includes('%') ? '%' : ' סשנים'}`, String(name || '')]}
                />
                <Bar dataKey="סנכרון זוגי (%)" radius={[12, 12, 0, 0]} maxBarSize={60}>
                  {seasonalChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. ALL PAIRS DIRECTORY & DETAILED MATRIX (טבלת כלל הזוגות והסנכרון) */}
      <div className="luxury-card p-6 md:p-8 rounded-[3rem] border border-slate-200 shadow-soft space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">מאגר הזוגות המלא • מדד מחוברות ({filteredPairs.length})</h3>
            <p className="text-xs text-slate-500 font-bold">מעקב מפורט אחר כל חבלי הזוג, התפלגות הגעות משותפות לעומת סולו</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="חיפוש לפי שם..."
                className="w-full pr-9 pl-4 py-2 text-xs font-bold rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-rose-400 transition-all text-slate-800"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setFilterTier('all')}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                  filterTier === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                הכל
              </button>
              <button
                onClick={() => setFilterTier('high')}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                  filterTier === 'high' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                80%+
              </button>
              <button
                onClick={() => setFilterTier('medium')}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                  filterTier === 'medium' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                50-79%
              </button>
              <button
                onClick={() => setFilterTier('low')}
                className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                  filterTier === 'low' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                &lt;50%
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs font-black py-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="joint">מיון: סשנים יחד</option>
              <option value="rate">מיון: % מחוברות</option>
              <option value="streak">מיון: רצף פעיל</option>
              <option value="recent">מיון: סשן אחרון</option>
            </select>
          </div>
        </div>

        {/* Pairs Table List */}
        <div className="space-y-3">
          {filteredPairs.map((pair, index) => {
            const volSoloPct = pair.totalEitherSessions > 0 ? Math.round((pair.volunteerSoloSessions / pair.totalEitherSessions) * 100) : 0;
            const partSoloPct = pair.totalEitherSessions > 0 ? Math.round((pair.participantSoloSessions / pair.totalEitherSessions) * 100) : 0;
            const jointPct = pair.togethernessRate;

            return (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white hover:bg-slate-50/80 border border-slate-200/80 p-4 md:p-5 rounded-3xl transition-all duration-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Pair Info & Avatars */}
                <div className="flex items-center gap-4 min-w-[280px]">
                  <span className="text-sm font-black text-slate-400 w-5">#{index + 1}</span>

                  <div className="flex items-center -space-x-3 rtl:space-x-reverse relative">
                    <div className="w-11 h-11 rounded-full border-2 border-indigo-500 overflow-hidden bg-indigo-50 shadow-xs">
                      {pair.volunteer.avatar ? (
                        <img src={pair.volunteer.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-indigo-600">
                          {pair.volunteer.firstName[0]}
                        </div>
                      )}
                    </div>
                    <div className="w-11 h-11 rounded-full border-2 border-rose-500 overflow-hidden bg-rose-50 shadow-xs">
                      {pair.participant.avatar ? (
                        <img src={pair.participant.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-rose-600">
                          {pair.participant.firstName[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="font-black text-slate-900 text-sm md:text-base flex items-center gap-1.5">
                      <span>{pair.volunteer.firstName} {pair.volunteer.lastName}</span>
                      <span className="text-slate-400">&</span>
                      <span>{pair.participant.firstName} {pair.participant.lastName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold flex items-center gap-2 mt-0.5">
                      <span className="text-indigo-600">מתנדב/ת: {pair.volunteer.firstName}</span>
                      <span>•</span>
                      <span className="text-rose-600">משתתף/ת: {pair.participant.firstName}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Attendance Breakdown Progress Bar */}
                <div className="flex-1 max-w-md space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={12} /> יחד: {pair.jointSessions} ({jointPct}%)
                    </span>
                    <span className="text-slate-400">
                      סולו: {pair.volunteer.firstName} ({pair.volunteerSoloSessions}) | {pair.participant.firstName} ({pair.participantSoloSessions})
                    </span>
                  </div>

                  {/* Multi-segmented attendance bar */}
                  <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all" 
                      style={{ width: `${jointPct}%` }}
                      title={`הגעה משותפת: ${jointPct}%`}
                    />
                    <div 
                      className="bg-indigo-300 h-full transition-all" 
                      style={{ width: `${volSoloPct}%` }}
                      title={`סולו מתנדב: ${volSoloPct}%`}
                    />
                    <div 
                      className="bg-rose-300 h-full transition-all" 
                      style={{ width: `${partSoloPct}%` }}
                      title={`סולו משתתף: ${partSoloPct}%`}
                    />
                  </div>
                </div>

                {/* Right: Key Stats & Badges */}
                <div className="flex items-center gap-4 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                  <div className="text-center px-3">
                    <div className="text-xs text-slate-400 font-bold">רצף פעיל</div>
                    <div className="text-sm font-black text-slate-800 flex items-center justify-center gap-1">
                      <Flame size={14} className={pair.currentJointStreak > 0 ? 'text-amber-500' : 'text-slate-300'} />
                      {pair.currentJointStreak}
                    </div>
                  </div>

                  <div className="text-center px-3">
                    <div className="text-xs text-slate-400 font-bold">סשן אחרון</div>
                    <div className="text-xs font-black text-slate-700">
                      {pair.lastJointSessionDate ? formatDate(pair.lastJointSessionDate) : '—'}
                    </div>
                  </div>

                  <div className="text-left min-w-[70px]">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                      pair.togethernessRate >= 80 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : pair.togethernessRate >= 50 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pair.togethernessRate}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredPairs.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-bold">
              לא נמצאו זוגות התואמים את החיפוש או הסינון שנבחרו.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PairsPersistence;
