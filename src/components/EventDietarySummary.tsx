import React, { useState, useMemo } from 'react';
import { 
  UtensilsCrossed, 
  Leaf, 
  Sparkles, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Copy, 
  CheckCheck,
  AlertCircle,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member } from '../types';
import { DIETARY_TAXONOMY, DietaryOption, getDietaryOptionLabel } from '../constants/dietary';

interface EventDietarySummaryProps {
  attendees: Member[];
  compact?: boolean;
  title?: string;
  className?: string;
  onOpenAttendeeDetails?: (member: Member) => void;
}

export interface DietaryCategoryStat {
  categoryId: string;
  title: string;
  subtitle: string;
  colorClass: string;
  bgColorClass: string;
  badgeBg: string;
  options: {
    option: DietaryOption;
    count: number;
    members: Member[];
  }[];
  totalTaggedCount: number;
}

export const EventDietarySummary: React.FC<EventDietarySummaryProps> = ({
  attendees,
  compact = false,
  title = 'סיכום תזונה וכשרות',
  className = '',
  onOpenAttendeeDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute aggregation
  const { statsByCategory, notesList, specifiedCount, totalAttendees } = useMemo(() => {
    const total = attendees.length;
    let specified = 0;
    const notes: { member: Member; note: string }[] = [];

    const stats: DietaryCategoryStat[] = DIETARY_TAXONOMY.map((cat) => {
      const optionsStats = cat.options.map((opt) => {
        const matchingMembers = attendees.filter((m) => {
          const prefs = m.dietaryPreferences || [];
          return prefs.includes(opt.id) || prefs.includes(opt.label);
        });
        return {
          option: opt,
          count: matchingMembers.length,
          members: matchingMembers,
        };
      });

      const totalTagged = optionsStats.reduce((sum, item) => sum + item.count, 0);

      return {
        categoryId: cat.id,
        title: cat.title,
        subtitle: cat.subtitle,
        colorClass: cat.colorClass,
        bgColorClass: cat.bgColorClass,
        badgeBg: cat.badgeBg,
        options: optionsStats,
        totalTaggedCount: totalTagged,
      };
    });

    attendees.forEach((m) => {
      const hasPrefs = m.dietaryPreferences && m.dietaryPreferences.length > 0;
      const hasNotes = Boolean(m.dietaryNotes && m.dietaryNotes.trim());
      if (hasPrefs || hasNotes) {
        specified += 1;
      }
      if (hasNotes && m.dietaryNotes) {
        notes.push({ member: m, note: m.dietaryNotes.trim() });
      }
    });

    return {
      statsByCategory: stats,
      notesList: notes,
      specifiedCount: specified,
      totalAttendees: total,
    };
  }, [attendees]);

  // Generate text report for organizers / catering orders
  const handleCopyReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `📋 סיכום תזונה וכשרות לאירוע (${totalAttendees} משתתפים):\n\n`;

    statsByCategory.forEach((cat) => {
      const activeOptions = cat.options.filter((o) => o.count > 0);
      if (activeOptions.length > 0) {
        text += `🔹 ${cat.title}:\n`;
        activeOptions.forEach((o) => {
          text += `  • ${o.option.label}: ${o.count} משתתפים (${o.members.map((m) => `${m.firstName} ${m.lastName}`).join(', ')})\n`;
        });
        text += '\n';
      }
    });

    if (notesList.length > 0) {
      text += `📝 הערות מיוחדות ואלרגיות ספציפיות:\n`;
      notesList.forEach((n) => {
        text += `  • ${n.member.firstName} ${n.member.lastName}: "${n.note}"\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (totalAttendees === 0) {
    return null;
  }

  // Active options with counts > 0 for quick view
  const allActiveOptions = statsByCategory.flatMap((cat) =>
    cat.options
      .filter((o) => o.count > 0)
      .map((o) => ({ ...o, categoryId: cat.categoryId, badgeBg: cat.badgeBg, colorClass: cat.colorClass }))
  );

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
        compact
          ? 'bg-gradient-to-br from-emerald-500/[0.04] via-teal-500/[0.02] to-sky-500/[0.04] border-emerald-500/20 shadow-sm'
          : 'bg-white/90 backdrop-blur-md border-emerald-500/20 shadow-md p-5 md:p-6'
      } ${className}`}
      dir="rtl"
    >
      {/* Header / Toggle Bar */}
      <div
        className={`flex items-center justify-between gap-3 select-none ${
          compact ? 'p-3.5 cursor-pointer hover:bg-emerald-50/50 transition-colors' : 'mb-5 pb-4 border-b border-slate-100'
        }`}
        onClick={() => compact && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 flex-shrink-0">
            <UtensilsCrossed size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm md:text-base font-black text-[#002b44] tracking-tight">
                {title}
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                {specifiedCount} מתוך {totalAttendees} ציינו העדפות
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400">
              נתוני זמן אמת מתעדכנים אוטומטית עם כל אישור הגעה
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyReport}
            title="העתק דו״ח תזונה להזמנת קייטרינג / מארגן"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:text-emerald-700 text-slate-600 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            {copied ? (
              <>
                <CheckCheck size={14} className="text-emerald-600 stroke-[2.5]" />
                <span className="text-emerald-700">הועתק!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="hidden sm:inline">העתק סיכום</span>
              </>
            )}
          </button>

          {compact && (
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#002b44] transition-colors"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Quick Summary Chips for Compact view when closed */}
      {compact && !isExpanded && (
        <div className="px-3.5 pb-3.5 pt-0">
          {allActiveOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 items-center">
              {allActiveOptions.map((opt) => (
                <span
                  key={opt.option.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border shadow-xs ${opt.badgeBg}`}
                >
                  <span>{opt.option.label}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-white/80 text-[10px] font-black">
                    {opt.count}
                  </span>
                </span>
              ))}
              {notesList.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertCircle size={12} />
                  <span>{notesList.length} הערות מיוחדות</span>
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400">
              המשתתפים שאישרו הגעה לא הגדירו הגבלות תזונה מיוחדות (הכל אוכל).
            </p>
          )}
        </div>
      )}

      {/* Expanded Breakdown Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className={`space-y-6 ${compact ? 'p-3.5 pt-0 border-t border-emerald-500/10' : ''}`}
          >
            {/* Category Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statsByCategory.map((cat) => {
                const activeOptions = cat.options.filter((o) => o.count > 0);
                const inactiveOptions = cat.options.filter((o) => o.count === 0);

                return (
                  <div
                    key={cat.categoryId}
                    className="p-4 rounded-2xl bg-white/70 border border-slate-100 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${cat.bgColorClass}`}>
                            {cat.categoryId === 'lifestyle' && <Leaf size={14} className="text-emerald-600" />}
                            {cat.categoryId === 'religion' && <Sparkles size={14} className="text-sky-600" />}
                            {cat.categoryId === 'allergies' && <ShieldAlert size={14} className="text-amber-600" />}
                          </div>
                          <div>
                            <h5 className="text-xs md:text-sm font-black text-[#002b44] leading-tight">
                              {cat.title}
                            </h5>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-slate-400">
                          {cat.totalTaggedCount} סומנו
                        </span>
                      </div>

                      {activeOptions.length > 0 ? (
                        <div className="space-y-2">
                          {activeOptions.map((optItem) => {
                            const isCurrentSelected = selectedTagId === optItem.option.id;
                            return (
                              <div key={optItem.option.id} className="space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedTagId(isCurrentSelected ? null : optItem.option.id)
                                  }
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-right transition-all text-xs font-black ${
                                    isCurrentSelected
                                      ? 'bg-[#002b44] text-white border-[#002b44] shadow-sm'
                                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{optItem.option.label}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                                        isCurrentSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {optItem.count}
                                    </span>
                                    <span className="text-[10px] opacity-70">
                                      ({Math.round((optItem.count / totalAttendees) * 100)}%)
                                    </span>
                                  </div>
                                </button>

                                {/* List of members under this tag when clicked */}
                                {isCurrentSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                                  >
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                      משתתפים שסימנו {optItem.option.label}:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {optItem.members.map((m) => (
                                        <span
                                          key={m.id}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold shadow-xs text-[11px]"
                                        >
                                          {m.avatar && (
                                            <img
                                              src={m.avatar}
                                              alt=""
                                              className="w-4 h-4 rounded-full object-cover"
                                            />
                                          )}
                                          {m.firstName} {m.lastName}
                                        </span>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] font-bold text-slate-400 italic py-2 text-center">
                          אין הגבלות בקטגוריה זו
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Special Notes / Free-Text Allergies & Comments */}
            {notesList.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-900">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                  <h5 className="text-xs md:text-sm font-black">
                    דגשים מיוחדים, רגישויות ואלרגיות חריגות שהוזנו ({notesList.length})
                  </h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {notesList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/90 rounded-xl border border-amber-200/80 shadow-xs flex items-start gap-2.5"
                    >
                      {item.member.avatar ? (
                        <img
                          src={item.member.avatar}
                          alt=""
                          className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-slate-100"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center flex-shrink-0">
                          {item.member.firstName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-[#002b44] leading-tight">
                          {item.member.firstName} {item.member.lastName}
                        </p>
                        <p className="text-xs font-bold text-slate-700 mt-0.5 leading-relaxed">
                          "{item.note}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
