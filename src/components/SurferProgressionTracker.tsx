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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info
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

  // Selected stage for modal inspection
  const [inspectedStageId, setInspectedStageId] = useState<number>(analysis.currentStage.id);
  const [isStageModalOpen, setIsStageModalOpen] = useState<boolean>(false);
  const [showVibeModal, setShowVibeModal] = useState<boolean>(false);

  const activeStage: StageStatus = useMemo(() => {
    return analysis.allStages.find(s => s.id === inspectedStageId) || analysis.allStages[0];
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
      <div className="relative bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-[2rem] p-5 sm:p-7 md:p-8 shadow-sm overflow-hidden font-yehuda">
        
        {/* Subtle Background Flare */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />

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
                <span className="text-sm font-black text-slate-900 font-yehuda">{analysis.currentClubVibe.he}</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 block hover:underline font-yehuda">
                צפה בכל 5 דרגות הוויב ←
              </span>
            </div>
          </button>
        </div>

        {/* 2. CONSOLIDATED 3 KEY KPIS (ALWAYS HORIZONTAL SINGLE ROW) */}
        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3.5 my-5 sm:my-6">
          
          {/* KPI 1: Sessions */}
          <div className="p-3 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-right hover:border-slate-300 transition-colors flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-black text-slate-500 block mb-0.5 sm:mb-1 font-yehuda truncate">סשנים מצטברים</span>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-3xl font-black text-slate-900 font-mono">{analysis.userSessions}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 font-yehuda">סשנים</span>
            </div>
          </div>

          {/* KPI 2: Water Hours */}
          <div className="p-3 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-right hover:border-slate-300 transition-colors flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-black text-slate-500 block mb-0.5 sm:mb-1 font-yehuda truncate">שעות מים בים</span>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-3xl font-black text-teal-900 font-mono">{analysis.waterHours}</span>
              <span className="text-[10px] sm:text-xs font-bold text-teal-700 font-yehuda">שעות</span>
            </div>
          </div>

          {/* KPI 3: Percentile / Community Activity Rank */}
          <div className="p-3 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-right hover:border-slate-300 transition-colors flex flex-col justify-between">
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

        {/* 3. FOUR PROGRESSION STAGES (HIGH-IMPACT VISUAL STEPPER HIERARCHY) */}
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
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs">
                {Math.round(analysis.overallProgressPercent)}%
              </span>
            </div>
          </div>

          {/* Stepper Pipeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {analysis.allStages.map((stage, idx) => {
              const isStageCurrent = stage.isCurrent;
              const isStageCompleted = stage.isCompleted;
              const isStageLocked = stage.isLocked;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => openStageModal(stage.id)}
                  className={`group relative p-5 rounded-3xl text-right transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 active:scale-95 ${
                    isStageCurrent
                      ? 'bg-gradient-to-b from-[#002f4a] via-[#003b5c] to-[#001f30] text-white border-2 border-cyan-400 shadow-[0_12px_35px_-10px_rgba(0,175,194,0.45)] ring-4 ring-cyan-400/25 lg:scale-[1.03] z-20'
                      : isStageCompleted
                        ? 'bg-gradient-to-b from-white to-emerald-50/70 border-2 border-emerald-400/90 shadow-sm hover:shadow-md text-slate-900 z-10'
                        : 'bg-slate-100/80 hover:bg-white border-2 border-dashed border-slate-300 text-slate-600 hover:border-slate-400 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Top Step Pill & Hierarchy Indicator */}
                  <div className="flex items-center justify-between w-full">
                    {/* Step Number Circle */}
                    <div className={`w-8 h-8 rounded-xl font-mono font-black text-sm flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                      isStageCurrent
                        ? 'bg-cyan-400 text-slate-950 ring-2 ring-white/40 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                        : isStageCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                    }`}>
                      0{stage.stageNumber}
                    </div>

                    {/* Prominent Status Stamp */}
                    {isStageCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs font-yehuda">
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

                  {/* Interactive Action Cue Bar */}
                  <div className={`w-full pt-2.5 border-t flex items-center justify-between text-xs font-bold font-yehuda transition-colors ${
                    isStageCurrent 
                      ? 'border-white/15 text-cyan-300 group-hover:text-white' 
                      : isStageCompleted 
                        ? 'border-emerald-200 text-emerald-800 group-hover:text-emerald-950' 
                        : 'border-slate-200 text-slate-500 group-hover:text-slate-800'
                  }`}>
                    <span>פתח פירוט מיומנויות</span>
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
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
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
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
              <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 border-b border-slate-200">
                {analysis.allStages.map((stage) => {
                  const isTabSelected = stage.id === activeStage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setInspectedStageId(stage.id)}
                      className={`py-2 px-2 rounded-xl text-center text-xs font-bold transition-all font-yehuda ${
                        isTabSelected
                          ? 'bg-white text-slate-900 shadow-sm font-black'
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block font-yehuda">
                      סטטוס אישי בשלב זה
                    </span>
                    <span className="text-base font-black text-slate-900 font-yehuda">
                      {isCompleted ? '🎉 השלב נכבש בהצלחה!' : isCurrent ? '🏄‍♂️ זהו השלב הפעיל שלך כרגע' : '🔒 שלב עתידי – ייפתח בהמשך המסע'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-black text-slate-600 font-mono">
                        {isCompleted ? '100%' : isCurrent ? `${activeStage.progressPercentInStage}% הושלם` : '0%'}
                      </span>
                    </div>
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden" dir="ltr">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-[#003b5c]' : 'bg-slate-300'
                        }`}
                        style={{ width: `${activeStage.progressPercentInStage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Key Technical Milestone */}
                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200/80">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5 mb-1.5 font-yehuda">
                    <Target size={15} className="text-sky-700" />
                    הישג המפתח בשלב זה:
                  </span>
                  <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed font-yehuda">
                    "{activeStage.technicalMilestone}"
                  </p>
                </div>

                {/* 2-Column Grid: Skills & Equipment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  
                  {/* Skills Checklist */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                      מיומנויות הליבה הנרכשות:
                    </span>
                    <div className="space-y-2">
                      {activeStage.skills.map((skill, sIdx) => {
                        const isSkillAchieved = isCompleted || (isCurrent && analysis.stageProgressPercent > ((sIdx + 1) * 30));

                        return (
                          <div
                            key={skill.id}
                            className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                              isSkillAchieved
                                ? 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                              isSkillAchieved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {isSkillAchieved ? <Check size={12} strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900 block">{skill.name}</span>
                              <span className="text-[11px] font-bold text-slate-500 leading-tight block mt-0.5">{skill.description}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Equipment & Coach Tip */}
                  <div className="space-y-3.5">
                    {/* Equipment */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-500" />
                        ציוד וסוג גלשן מומלץ:
                      </span>
                      <p className="text-xs font-bold text-slate-600 pt-1 leading-relaxed">
                        {activeStage.equipmentFocus}
                      </p>
                    </div>

                    {/* Countdown / Goal Notice */}
                    {isCurrent && analysis.nextStage && (
                      <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold">
                        🎯 נותרו לך עוד <strong>{analysis.sessionsToNextStage} סשנים</strong> ({analysis.hoursToNextStage} שעות) למעבר לשלב הבא!
                      </div>
                    )}

                    {/* Coaching Tip */}
                    <p className="text-xs text-slate-500 font-bold leading-relaxed border-t border-slate-200 pt-3">
                      💡 <strong className="text-slate-800">דגש מאמן:</strong> התמדה של סשן או שניים שבועיים מקבעת את שיווי המשקל ובונה עצמאות אמיתית בים.
                    </p>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  סה"כ סשנים מצטברים שלך: <strong className="text-slate-900 font-mono">{analysis.userSessions}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  סגור
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                            <span className="text-lg sm:text-xl font-black text-slate-900 font-yehuda">
                              {vibe.he}
                            </span>
                            <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                              {vibe.min}{vibe.max ? `-${vibe.max}` : '+'} סשנים
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
