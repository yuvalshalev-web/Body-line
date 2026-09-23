import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Waves, 
  TrendingUp, 
  Clock, 
  Target, 
  Sparkles, 
  Users, 
  Zap, 
  Check, 
  Lock, 
  Flame, 
  ArrowLeft,
  X,
  Compass,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { Member } from '../types';
import { useData } from '../contexts/DataContext';
import { calculateProgression, ProgressionAnalysis, StageStatus } from '../utils/progressionEngine';

interface SurferProgressionTrackerProps {
  userSessions: number;
  members: Member[];
  weeklyHistory?: any[];
  className?: string;
}

export const SurferProgressionTracker: React.FC<SurferProgressionTrackerProps> = ({
  userSessions,
  members,
  weeklyHistory = [],
  className = '',
}) => {
  const { siteConfig } = useData();
  const sessionDurationMinutes = siteConfig?.sessionDurationMinutes || 90;

  const analysis: ProgressionAnalysis = useMemo(() => {
    return calculateProgression(userSessions, members, weeklyHistory, sessionDurationMinutes);
  }, [userSessions, members, weeklyHistory, sessionDurationMinutes]);

  // Selected stage for inspection (defaults to current user stage)
  const [inspectedStageId, setInspectedStageId] = useState<number>(analysis.currentStage.id);
  const [showVibeModal, setShowVibeModal] = useState<boolean>(false);

  const activeStage: StageStatus = useMemo(() => {
    return analysis.allStages.find(s => s.id === inspectedStageId) || analysis.allStages[0];
  }, [analysis, inspectedStageId]);

  const isCurrent = activeStage.id === analysis.currentStage.id;
  const isCompleted = activeStage.isCompleted;
  const isFuture = activeStage.isLocked;

  return (
    <div className={`space-y-6 text-right font-sans select-none ${className}`} dir="rtl">
      
      {/* Main Glassmorphic Coastal Container */}
      <div className="relative bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-[2rem] p-5 sm:p-7 md:p-8 shadow-sm overflow-hidden">
        
        {/* Subtle Background Flare */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* 1. TOP HEADER & INSTANT SUMMARY */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-sky-800 uppercase tracking-wider mb-1">
              <Compass size={15} className="text-sky-600" />
              <span>מפת שלבי הגלישה בסופטבורד</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-dana-yad font-bold">ניסיון מצטבר בים</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>ההתקדמות שלך בים</span>
            </h2>
          </div>

          {/* User's Current Vibe Quick Badge */}
          <button
            type="button"
            onClick={() => setShowVibeModal(true)}
            className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-300/80 rounded-2xl hover:border-amber-400 hover:shadow-md transition-all text-right group cursor-pointer active:scale-95"
          >
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform"
              style={{ backgroundColor: analysis.currentClubVibe.accent }}
            >
              <Flame size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">הוויב בליין-אפ:</span>
                <span className="text-sm font-black text-slate-900 font-dana-yad">{analysis.currentClubVibe.he}</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 block hover:underline">
                צפה בכל 5 דרגות הוויב ←
              </span>
            </div>
          </button>
        </div>

        {/* 2. CONSOLIDATED 4 KEY KPIS (HORIZONTAL CLEAN BAR) */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
          
          {/* KPI 1: Sessions */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-right">
            <span className="text-[11px] font-black text-slate-500 block mb-0.5">סשנים מצטברים</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{analysis.userSessions}</span>
              <span className="text-xs font-bold text-slate-500">סשנים</span>
            </div>
          </div>

          {/* KPI 2: Water Hours */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-right">
            <span className="text-[11px] font-black text-slate-500 block mb-0.5">שעות מים בים</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-teal-900 font-mono">{analysis.waterHours}</span>
              <span className="text-xs font-bold text-teal-700">שעות</span>
            </div>
          </div>

          {/* KPI 3: Current Stage Name */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-right">
            <span className="text-[11px] font-black text-sky-800 block mb-0.5">שלב נוכחי</span>
            <div className="text-sm sm:text-base font-black text-sky-950 truncate">
              {analysis.currentStage.stageNumber}. {analysis.currentStage.title}
            </div>
          </div>

          {/* KPI 4: Percentile / Pacing */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-right">
            <span className="text-[11px] font-black text-slate-500 block mb-0.5">דירוג פעילות קהילתי</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-slate-600">טופ</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-900 font-mono">
                {Math.max(1, 100 - analysis.percentileRank)}%
              </span>
            </div>
          </div>

        </div>

        {/* 3. FOUR PROGRESSION STAGES (CLEAR 4-COLUMN HORIZON) */}
        <div className="relative z-10 mt-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-sky-600" />
              <span>מסלול 4 השלבים (בחר שלב לצפייה בפרטים)</span>
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              התקדמות כוללת: <strong className="text-slate-900">{Math.round(analysis.overallProgressPercent)}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {analysis.allStages.map((stage) => {
              const isStageSelected = stage.id === inspectedStageId;
              const isStageCurrent = stage.isCurrent;
              const isStageCompleted = stage.isCompleted;
              const isStageLocked = stage.isLocked;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setInspectedStageId(stage.id)}
                  className={`relative p-4 rounded-2xl text-right transition-all duration-200 border cursor-pointer flex flex-col justify-between gap-3 text-right ${
                    isStageSelected
                      ? 'bg-white border-[#003b5c] shadow-md ring-2 ring-[#003b5c]/20'
                      : isStageCurrent
                        ? 'bg-sky-50/80 border-sky-300 hover:bg-sky-50'
                        : isStageCompleted
                          ? 'bg-slate-50/70 border-slate-200 hover:bg-white'
                          : 'bg-slate-50/40 border-slate-200/60 opacity-60 hover:opacity-90'
                  }`}
                >
                  {/* Status Kicker & Stage Number */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-black font-mono text-slate-400">
                      שלב {stage.stageNumber}
                    </span>

                    {/* Status Badge */}
                    {isStageCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-full">
                        <Check size={11} strokeWidth={3} />
                        הושלם
                      </span>
                    ) : isStageCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-800 bg-sky-200/90 border border-sky-400/80 px-2.5 py-0.5 rounded-full animate-pulse">
                        👈 אתה כאן
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Lock size={10} />
                        היעד הבא
                      </span>
                    )}
                  </div>

                  {/* Stage Title & Sessions Target */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {stage.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {stage.sessionsRange} • {stage.monthsRange}
                    </p>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-black">
                      <span className="text-slate-500">
                        {isStageCompleted ? '100%' : isStageCurrent ? `${stage.progressPercentInStage}% הושלם` : '0%'}
                      </span>
                      {isStageCurrent && analysis.nextStage && (
                        <span className="text-sky-800 font-bold">
                          עוד {analysis.sessionsToNextStage} סשנים
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isStageCompleted ? 'bg-emerald-500' : isStageCurrent ? 'bg-[#003b5c]' : 'bg-slate-300'
                        }`}
                        style={{ width: `${stage.progressPercentInStage}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. INSPECTED STAGE DETAIL VIEW (CLEAR & BALANCED 2-COLUMN CARD) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 mt-6"
          >
            <div className="rounded-2xl bg-gradient-to-br from-[#002f4a] via-[#003e63] to-[#002338] text-white p-5 sm:p-7 border border-cyan-500/30 shadow-lg relative overflow-hidden">
              
              {/* Subtle ambient light */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Right Column: Stage Milestone & 3 Key Skills */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Stage Headline & Status Indicator */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-300 mb-1">
                      <span>שלב {activeStage.stageNumber}: {activeStage.monthsRange}</span>
                      <span>•</span>
                      <span className="font-mono">{activeStage.sessionsRange}</span>
                      <span>•</span>
                      <span className="font-mono">{activeStage.hoursRange}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {activeStage.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-sky-200/90 mt-0.5">
                      {activeStage.tagline}
                    </p>
                  </div>

                  {/* Objective Technical Milestone */}
                  <div className="p-3.5 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5 mb-1">
                      <Target size={13} />
                      הישג המפתח בשלב זה:
                    </span>
                    <p className="text-sm font-bold text-white leading-relaxed">
                      "{activeStage.technicalMilestone}"
                    </p>
                  </div>

                  {/* 3 Core Skills Checklist */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
                      מיומנויות הליבה הנרכשות:
                    </span>
                    <div className="space-y-2">
                      {activeStage.skills.map((skill, sIdx) => {
                        const isSkillAchieved = isCompleted || (isCurrent && analysis.stageProgressPercent > ((sIdx + 1) * 30));

                        return (
                          <div
                            key={skill.id}
                            className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                              isSkillAchieved
                                ? 'bg-emerald-500/15 border-emerald-400/40 text-white'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                              isSkillAchieved ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'
                            }`}>
                              {isSkillAchieved ? <Check size={12} strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-white block">{skill.name}</span>
                              <span className="text-[11px] font-bold text-slate-300/80 leading-tight block">{skill.description}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Left Column: Progress Meter & Equipment & Next Step */}
                <div className="lg:col-span-5 space-y-4 bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10">
                  
                  {/* Status summary */}
                  <div className="space-y-2 pb-3 border-b border-white/10">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">
                        {isCurrent ? 'מצבך בשלב זה:' : isCompleted ? 'שלב הושלם בהצלחה:' : 'דרישת סשנים לשלב:'}
                      </span>
                      <span className="font-mono text-sm font-black text-sky-300">
                        {isCompleted ? '100%' : isCurrent ? `${activeStage.progressPercentInStage}%` : 'טרם החל'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-400 to-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${activeStage.progressPercentInStage}%` }}
                      />
                    </div>

                    {isCurrent && analysis.nextStage && (
                      <p className="text-xs font-bold text-amber-200 bg-amber-500/15 border border-amber-400/30 px-3 py-1.5 rounded-lg mt-2">
                        🎯 נותרו לך עוד <strong>{analysis.sessionsToNextStage} סשנים</strong> ({analysis.hoursToNextStage} שעות) למעבר לשלב {analysis.nextStage.stageNumber}!
                      </p>
                    )}
                  </div>

                  {/* Equipment Focus */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                      <Zap size={13} />
                      ציוד וסוג גלשן מומלץ:
                    </span>
                    <p className="text-xs font-bold text-slate-100 bg-white/5 p-2.5 rounded-xl border border-white/10">
                      {activeStage.equipmentFocus}
                    </p>
                  </div>

                  {/* Coaching Note */}
                  <p className="text-[11px] text-slate-300/90 font-bold leading-relaxed border-t border-white/10 pt-3">
                    💡 <strong className="text-white">דגש מאמן:</strong> התמדה של סשן או שניים שבועיים מקבעת את שיווי המשקל ובונה עצמאות אמיתית בים.
                  </p>

                </div>

              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* 5. VIBE SCALE MODAL (5 RANKS OF THE CLUB) */}
      <AnimatePresence>
        {showVibeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVibeModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#002f4a] via-[#004e75] to-[#002b44] text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-md">
                    <Flame size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black font-dana-yad text-white">
                      מה הוויב שלך בליין-אפ?
                    </h3>
                    <p className="text-xs text-sky-200 font-bold">
                      סולם הדרגות, ההומור וההווי של המועדון לפי כמות סשנים במים
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVibeModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Ranks List */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-3 font-dana-yad">
                {analysis.allClubVibes.map((vibe) => (
                  <div
                    key={vibe.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      vibe.isCurrent
                        ? 'bg-amber-500/10 border-amber-400/80 ring-2 ring-amber-400/30 shadow-sm'
                        : vibe.isPassed
                          ? 'bg-slate-50 border-slate-200/80 opacity-90'
                          : 'bg-white border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs"
                          style={{ backgroundColor: vibe.accent }}
                        >
                          {vibe.level}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg sm:text-xl font-black text-slate-900 font-dana-yad">
                              {vibe.he}
                            </span>
                            <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                              {vibe.min}{vibe.max ? `-${vibe.max}` : '+'} סשנים
                            </span>
                            {vibe.isCurrent && (
                              <span className="text-xs font-black text-amber-800 bg-amber-200/80 border border-amber-300 px-2 py-0.5 rounded-full">
                                👈 אתה כאן
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5 italic">
                            "{vibe.desc}"
                          </p>
                        </div>
                      </div>

                      {vibe.isPassed && !vibe.isCurrent && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Check size={12} strokeWidth={3} />
                          נכבש
                        </span>
                      )}
                    </div>

                    {/* Perks */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60">
                      {vibe.perks.map((perk, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[11px] font-bold bg-white text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                        >
                          🏄‍♂️ {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  הסשנים שלך כרגע: <strong className="text-slate-900 font-mono">{analysis.userSessions}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowVibeModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  סגור
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SurferProgressionTracker;
