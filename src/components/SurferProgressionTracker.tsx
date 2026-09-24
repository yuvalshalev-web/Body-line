import React, { useMemo, useState } from 'react';
import { calculateProgression, StageStatus, ProgressionStage, ClubVibeRank, StageSkill } from '../utils/progressionEngine';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  TrendingUp, 
  Flame, 
  Check, 
  Lock, 
  Sparkles, 
  ChevronLeft, 
  Target, 
  Award, 
  HelpCircle,
  X,
  Waves,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface SurferProgressionTrackerProps {
  userSessions: number;
  members?: any[];
  weeklyHistory?: any[];
  className?: string;
}

export const SurferProgressionTracker: React.FC<SurferProgressionTrackerProps> = ({
  userSessions,
  members = [],
  weeklyHistory = [],
  className = '',
}) => {
  // 1. Calculate Core Progression Analysis
  const analysis = useMemo(() => {
    return calculateProgression(userSessions, members, weeklyHistory);
  }, [userSessions, members, weeklyHistory]);

  // Modal inspection state
  const [inspectedStageId, setInspectedStageId] = useState<number>(analysis.currentStage.id);
  const [isStageModalOpen, setIsStageModalOpen] = useState<boolean>(false);
  const [showVibeModal, setShowVibeModal] = useState<boolean>(false);

  const activeStage: StageStatus = useMemo(() => {
    return analysis.allStages.find((s: StageStatus) => s.id === inspectedStageId) || analysis.allStages[0];
  }, [analysis, inspectedStageId]);

  const isCurrent = activeStage.id === analysis.currentStage.id;
  const isCompleted = activeStage.isCompleted;
  const isFuture = activeStage.isLocked;

  const openStageModal = (stageId: number) => {
    setInspectedStageId(stageId);
    setIsStageModalOpen(true);
  };

  return (
    <div className={`space-y-6 text-right font-yehuda select-none ${className}`} dir="rtl">
      
      {/* Main Glassmorphic Coastal Container */}
      <div className="relative bg-white/75 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 rounded-[2.25rem] p-5 sm:p-7 md:p-8 shadow-[0_20px_50px_-15px_rgba(0,120,180,0.12),0_0_1px_1px_rgba(255,255,255,0.8)_inset] overflow-hidden font-yehuda before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent before:pointer-events-none">
        
        {/* Ambient Multi-chromatic Sea Glaze Flares */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-sky-200/50 via-cyan-200/40 to-blue-100/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-teal-200/40 via-emerald-100/30 to-amber-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-100/30 rounded-full blur-2xl pointer-events-none" />

        {/* 1. TOP HEADER & INSTANT SUMMARY */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-sky-800 uppercase tracking-wider mb-1 font-yehuda">
              <Compass size={15} className="text-sky-600" />
              <span>מפת שלבי הגלישה בסופטבורד</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-yehuda font-bold">ניסיון מצטבר בים</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 font-yehuda">
              <span>ההתקדמות שלך בים</span>
            </h2>
          </div>

          {/* User's Current Vibe Glassmorphic Quick Badge */}
          <button
            type="button"
            onClick={() => setShowVibeModal(true)}
            className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-50/90 via-white/80 to-orange-50/80 backdrop-blur-md border border-amber-300/80 rounded-2xl hover:border-amber-400 hover:shadow-[0_8px_20px_-4px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 transition-all duration-300 text-right group cursor-pointer active:scale-95 shrink-0"
          >
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs group-hover:scale-110 transition-transform"
              style={{ backgroundColor: analysis.currentClubVibe.accent }}
            >
              <Flame size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">הוויב בליין-אפ:</span>
                <span className="text-sm font-black text-slate-900 font-yehuda">{analysis.currentClubVibe.he}</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 block hover:underline font-yehuda">
                צפה בכל 5 דרגות הוויב ←
              </span>
            </div>
          </button>
        </div>

        {/* 2. CONSOLIDATED 3 KEY KPIS (GLASSMORPHIC SINGLE HORIZONTAL ROW) */}
        <div className="relative z-10 grid grid-cols-3 gap-2.5 sm:gap-4 my-5 sm:my-6">
          
          {/* KPI 1: Sessions */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 hover:border-sky-300/70 shadow-[0_4px_16px_-4px_rgba(0,100,150,0.08)] hover:shadow-[0_8px_24px_-4px_rgba(0,140,200,0.15)] hover:-translate-y-0.5 transition-all duration-300 text-right flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-black text-slate-500 block mb-0.5 sm:mb-1 font-yehuda truncate">סשנים מצטברים</span>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-3xl font-black text-slate-900 font-mono">{analysis.userSessions}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 font-yehuda">סשנים</span>
            </div>
          </div>

          {/* KPI 2: Water Hours */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 hover:border-teal-300/70 shadow-[0_4px_16px_-4px_rgba(0,100,150,0.08)] hover:shadow-[0_8px_24px_-4px_rgba(20,184,166,0.15)] hover:-translate-y-0.5 transition-all duration-300 text-right flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-black text-slate-500 block mb-0.5 sm:mb-1 font-yehuda truncate">שעות מים בים</span>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-3xl font-black text-teal-900 font-mono">{analysis.waterHours}</span>
              <span className="text-[10px] sm:text-xs font-bold text-teal-700 font-yehuda">שעות</span>
            </div>
          </div>

          {/* KPI 3: Percentile / Community Activity Rank */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 hover:border-indigo-300/70 shadow-[0_4px_16px_-4px_rgba(0,100,150,0.08)] hover:shadow-[0_8px_24px_-4px_rgba(99,102,241,0.15)] hover:-translate-y-0.5 transition-all duration-300 text-right flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-black text-slate-500 block mb-0.5 sm:mb-1 font-yehuda truncate">דירוג קהילתי</span>
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-sm font-bold text-slate-600 font-yehuda">טופ</span>
              <span className="text-xl sm:text-3xl font-black text-indigo-900 font-mono">
                {Math.max(1, 100 - analysis.percentileRank)}%
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-600 font-yehuda hidden xs:inline">במועדון</span>
            </div>
          </div>

        </div>

        {/* 3. FOUR PROGRESSION STAGES (HIGH-IMPACT GLASSMORPHIC VISUAL STEPPER) */}
        <div className="relative z-10 mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <span className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-1.5 font-yehuda">
                <TrendingUp size={15} className="text-sky-600" />
                <span>סולם 4 שלבי ההתקדמות בסופטבורד (לחץ על כל שלב לפירוט)</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 font-yehuda">
                התקדמות כוללת במסלול:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs shadow-xs">
                {Math.round(analysis.overallProgressPercent)}%
              </span>
            </div>
          </div>

          {/* Stepper Pipeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {analysis.allStages.map((stage: StageStatus) => {
              const isStageCurrent = stage.isCurrent;
              const isStageCompleted = stage.isCompleted;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => openStageModal(stage.id)}
                  className={`group relative p-5 rounded-3xl text-right transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 active:scale-95 ${
                    isStageCurrent
                      ? 'bg-gradient-to-b from-[#002f4a]/95 via-[#003b5c]/95 to-[#001f30]/95 backdrop-blur-xl text-white border-2 border-cyan-400 shadow-[0_15px_35px_-8px_rgba(6,182,212,0.45)] ring-4 ring-cyan-400/25 lg:scale-[1.03] z-20'
                      : isStageCompleted
                        ? 'bg-white/80 hover:bg-white/95 backdrop-blur-md border-2 border-emerald-400/90 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.18)] hover:shadow-[0_10px_25px_-6px_rgba(16,185,129,0.28)] hover:-translate-y-1 text-slate-900 z-10'
                        : 'bg-white/40 hover:bg-white/80 backdrop-blur-sm border-2 border-dashed border-slate-300/80 text-slate-600 hover:border-slate-400 opacity-75 hover:opacity-100 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top Step Pill & Hierarchy Indicator */}
                  <div className="flex items-center justify-between w-full">
                    {/* Step Number Circle */}
                    <div className={`w-8 h-8 rounded-xl font-mono font-black text-sm flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                      isStageCurrent
                        ? 'bg-cyan-400 text-slate-950 ring-2 ring-white/40 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                        : isStageCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200/80 text-slate-700'
                    }`}>
                      0{stage.stageNumber}
                    </div>

                    {/* Prominent Status Stamp */}
                    {isStageCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-900 bg-emerald-100/90 backdrop-blur-xs border border-emerald-300 px-3 py-1 rounded-full shadow-2xs font-yehuda">
                        <Check size={13} strokeWidth={3.5} />
                        נכבש בהצלחה
                      </span>
                    ) : isStageCurrent ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-300 to-yellow-400 border border-amber-200 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse font-yehuda">
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                        אתה כאן
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-200/90 px-2.5 py-0.5 rounded-full font-yehuda">
                        <Lock size={11} />
                        שלב {stage.stageNumber}
                      </span>
                    )}
                  </div>

                  {/* Stage Title & Sessions Metric */}
                  <div className="space-y-1">
                    <h3 className={`text-lg sm:text-xl font-black leading-snug tracking-tight font-yehuda ${
                      isStageCurrent ? 'text-white' : isStageCompleted ? 'text-slate-900 group-hover:text-emerald-700' : 'text-slate-700'
                    }`}>
                      {stage.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap font-yehuda">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono ${
                        isStageCurrent ? 'bg-white/15 text-cyan-200' : isStageCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/70 text-slate-600'
                      }`}>
                        {stage.sessionsRange}
                      </span>
                      <span className={`text-xs font-bold ${
                        isStageCurrent ? 'text-cyan-200/70' : 'text-slate-400'
                      }`}>
                        • {stage.monthsRange}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar with High-Contrast Track */}
                  <div className="w-full space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold font-mono">
                      <span className={isStageCurrent ? 'text-cyan-200' : isStageCompleted ? 'text-emerald-700' : 'text-slate-400'}>
                        {isStageCompleted ? '100% הושלם' : isStageCurrent ? `${stage.progressPercentInStage}% פעיל` : '0%'}
                      </span>
                      {isStageCurrent && analysis.nextStage && (
                        <span className="text-amber-300 font-bold font-yehuda text-[11px]">
                          עוד {analysis.sessionsToNextStage} סשנים לשלב הבא
                        </span>
                      )}
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      isStageCurrent ? 'bg-white/20' : 'bg-slate-200'
                    }`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          isStageCompleted 
                            ? 'bg-emerald-500' 
                            : isStageCurrent 
                              ? 'bg-gradient-to-r from-amber-400 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]' 
                              : 'bg-slate-300'
                        }`}
                        style={{ width: `${stage.progressPercentInStage}%` }}
                      />
                    </div>
                  </div>

                  {/* High-Visibility Interactive CTA Button */}
                  <div className={`w-full mt-2 py-2 px-3 rounded-xl flex items-center justify-between text-xs font-black font-yehuda transition-all duration-300 shadow-xs border ${
                    isStageCurrent 
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-slate-950 border-cyan-300 shadow-[0_4px_14px_rgba(6,182,212,0.45)] group-hover:shadow-[0_6px_20px_rgba(6,182,212,0.65)] group-hover:scale-[1.02]' 
                      : isStageCompleted 
                        ? 'bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 border-emerald-300/90 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-md' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 group-hover:shadow-md'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className={isStageCurrent ? 'text-slate-950' : 'opacity-80 group-hover:opacity-100'} />
                      <span>פתח פירוט מיומנויות</span>
                    </span>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:-translate-x-1 ${
                      isStageCurrent ? 'bg-slate-950/15 text-slate-950' : 'bg-black/5 group-hover:bg-white/20'
                    }`}>
                      <ChevronLeft size={16} strokeWidth={3} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. STAGE DEEP-DIVE MODAL DIALOG (OPENS ON CLICKING ANY STAGE) */}
      <AnimatePresence>
        {isStageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStageModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 w-full max-w-3xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/80 max-h-[90vh] flex flex-col font-yehuda"
            >
              {/* Modal Top Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#00283f] via-[#003e63] to-[#001f33] text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-400/20 border border-sky-300/40 flex items-center justify-center text-sky-300 shadow-md">
                    <Compass size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sky-300">
                        שלב {activeStage.stageNumber} מתוך 4
                      </span>
                      <span>•</span>
                      <span className="text-xs text-sky-200 font-mono">
                        {activeStage.sessionsRange}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white font-yehuda">
                      {activeStage.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Stage Tabs Switcher inside modal */}
              <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100/90 border-b border-slate-200">
                {analysis.allStages.map((stage: StageStatus) => {
                  const isTabSelected = stage.id === activeStage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setInspectedStageId(stage.id)}
                      className={`py-2 px-2 rounded-xl text-center text-xs font-bold transition-all font-yehuda ${
                        isTabSelected
                          ? 'bg-white text-slate-900 shadow-sm font-black ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <span>שלב {stage.stageNumber}</span>
                      {stage.isCurrent && (
                        <span className="block text-[10px] text-sky-700 font-black">👈 נוכחי</span>
                      )}
                      {stage.isCompleted && (
                        <span className="block text-[10px] text-emerald-600 font-black">✓ הושלם</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
                
                {/* Status Bar */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border ${
                  isCompleted 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                    : isCurrent 
                      ? 'bg-sky-50/80 border-sky-300 text-sky-950' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block font-yehuda opacity-75">
                      סטטוס אישי בשלב זה
                    </span>
                    <span className="text-base font-black font-yehuda">
                      {isCompleted ? '🎉 השלב נכבש בהצלחה!' : isCurrent ? '🏄‍♂️ זהו השלב הפעיל שלך כרגע' : '🔒 שלב עתידי – ייפתח בהמשך המסע'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200">
                      טווח יעד: {activeStage.sessionsRange}
                    </span>
                  </div>
                </div>

                {/* Key Technical Milestone */}
                <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200/80">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5 mb-1.5 font-yehuda">
                    <Target size={15} className="text-sky-700" />
                    הישג המפתח בשלב זה:
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed font-yehuda">
                    "{activeStage.technicalMilestone}"
                  </p>
                </div>

                {/* Skills Checklist */}
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2 font-yehuda">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>מיומנויות ויכולות גלישה הנרכשות בשלב {activeStage.stageNumber}:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeStage.skills.map((skill: StageSkill, idx: number) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
                          isCompleted
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : isCurrent
                              ? 'bg-white border-sky-200 text-slate-900 shadow-2xs'
                              : 'bg-slate-50/80 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-bold leading-snug font-yehuda">{skill.name}: {skill.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Surf Culture & Lineup Manifesto */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5 font-yehuda">
                    <Flame size={15} className="text-amber-600" />
                    מיקוד ציוד וסגנון:
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed font-yehuda">
                    {activeStage.equipmentFocus} — {activeStage.tagline}
                  </p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 font-yehuda">
                  סשנים מצטברים שלך: <strong className="text-slate-900 font-mono font-black">{analysis.userSessions}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer font-yehuda"
                >
                  סגור פירוט
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CLUB VIBE RANKS MODAL (5 RANKS LIST) */}
      <AnimatePresence>
        {showVibeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVibeModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-white/80 max-h-[90vh] flex flex-col font-yehuda"
            >
              {/* Top Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-md">
                    <Flame size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black font-yehuda text-white">
                      מה הוויב שלך בליין-אפ?
                    </h3>
                    <p className="text-xs text-sky-200 font-bold font-yehuda">
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
              <div className="p-5 sm:p-6 overflow-y-auto space-y-3 font-yehuda">
                {analysis.allClubVibes.map((vibe: ClubVibeRank) => (
                  <div
                    key={vibe.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      vibe.isCurrent
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30 shadow-md scale-[1.01]'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs mt-0.5"
                          style={{ backgroundColor: vibe.accent }}
                        >
                          {vibe.min}+
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg sm:text-xl font-black text-slate-900 font-yehuda">
                              {vibe.he}
                            </span>
                            <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                              {vibe.min}–{vibe.max ? vibe.max : '∞'} סשנים
                            </span>
                            {vibe.isCurrent && (
                              <span className="text-xs font-black text-amber-800 bg-amber-200/80 border border-amber-300 px-2 py-0.5 rounded-full font-yehuda">
                                👈 אתה כאן
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5 italic font-yehuda">
                            "{vibe.desc}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 font-yehuda">
                  הסשנים שלך: <strong className="text-amber-800 font-mono font-black">{analysis.userSessions}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowVibeModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer font-yehuda"
                >
                  הבנתי, סגור
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
