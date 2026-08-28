import React from 'react';
import { Utensils, Check, Sparkles, ShieldAlert, Leaf } from 'lucide-react';
import { DIETARY_TAXONOMY, DietaryCategory, DietaryOption } from '../constants/dietary';

interface DietaryPreferencesSectionProps {
  selectedPreferences: string[];
  dietaryNotes?: string;
  onChangePreferences: (preferences: string[]) => void;
  onChangeNotes?: (notes: string) => void;
  readOnly?: boolean;
}

export const DietaryPreferencesSection: React.FC<DietaryPreferencesSectionProps> = ({
  selectedPreferences = [],
  dietaryNotes = '',
  onChangePreferences,
  onChangeNotes,
  readOnly = false,
}) => {
  const isSelected = (id: string, label: string) => {
    return selectedPreferences.includes(id) || selectedPreferences.includes(label);
  };

  const handleSelectOption = (cat: DietaryCategory, opt: DietaryOption) => {
    if (readOnly) return;
    let current = [...selectedPreferences];

    if (cat.selectionType === 'single') {
      // Single choice mode: remove all other options from this category
      const categoryOptionKeys = new Set(cat.options.flatMap(o => [o.id, o.label]));
      const wasSelected = current.some(item => item === opt.id || item === opt.label);
      
      current = current.filter(item => !categoryOptionKeys.has(item));

      if (!wasSelected) {
        current.push(opt.id);
      }
    } else {
      // Multiple choice mode (e.g. allergies)
      const matchIndex = current.findIndex(item => item === opt.id || item === opt.label);
      if (matchIndex >= 0) {
        current.splice(matchIndex, 1);
      } else {
        current.push(opt.id);
      }
    }

    onChangePreferences(current);
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'lifestyle':
        return <Leaf size={16} className="text-emerald-600" />;
      case 'religion':
        return <Sparkles size={16} className="text-sky-600" />;
      case 'allergies':
        return <ShieldAlert size={16} className="text-amber-600" />;
      default:
        return <Utensils size={16} className="text-teal-600" />;
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Category Groups */}
      <div className="space-y-8">
        {DIETARY_TAXONOMY.map((cat) => {
          const isSingle = cat.selectionType === 'single';
          return (
            <div key={cat.id} className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${cat.bgColorClass}`}>
                    {getCategoryIcon(cat.id)}
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-black text-[#0f172a] leading-tight">
                      {cat.title}
                    </h4>
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full border tracking-wide ${
                    isSingle
                      ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                      : 'bg-amber-50 text-amber-700 border-amber-200/80'
                  }`}
                >
                  {isSingle ? 'בחירה יחידה' : 'בחירה מרובה'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {cat.options.map((opt) => {
                  const active = isSelected(opt.id, opt.label);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleSelectOption(cat, opt)}
                      className={`group relative px-4 py-3 rounded-2xl text-xs md:text-sm font-black transition-all duration-300 flex items-center gap-2.5 border text-right ${
                        active
                          ? 'bg-gradient-to-r from-[#002b44] to-[#00426a] text-white border-[#002b44] shadow-md shadow-[#002b44]/20 scale-[1.02]'
                          : 'bg-white/80 hover:bg-white text-slate-700 hover:text-[#002b44] border-slate-200/80 hover:border-slate-300 shadow-sm'
                      } ${readOnly ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      {isSingle ? (
                        // Radio button visual for single-choice categories
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            active
                              ? 'border-white bg-white/20'
                              : 'border-slate-300 bg-slate-100 group-hover:border-slate-400'
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              active ? 'bg-white scale-100' : 'bg-transparent scale-0'
                            }`}
                          />
                        </div>
                      ) : (
                        // Checkbox visual for multiple-choice categories
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-transparent group-hover:bg-slate-200/70'
                          }`}
                        >
                          <Check size={13} className={active ? 'opacity-100 stroke-[3]' : 'opacity-0'} />
                        </div>
                      )}

                      <div className="flex flex-col">
                        <span className="leading-snug">{opt.label}</span>
                        <span
                          className={`text-[9px] font-bold tracking-tight leading-none ${
                            active ? 'text-sky-200' : 'text-slate-400'
                          }`}
                        >
                          {opt.enLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Text Area for Notes & Custom Allergies */}
      <div className="space-y-2 group">
        <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pr-3 group-focus-within:text-teal-600 transition-colors block">
          אחר / הערות תזונה מיוחדות והעדפות נוספות
        </label>
        {readOnly ? (
          dietaryNotes ? (
            <div className="p-5 bg-white/70 border border-white/80 rounded-[1.25rem] text-sm font-bold text-slate-700">
              {dietaryNotes}
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400 pr-3">אין הערות תזונה נוספות</p>
          )
        ) : (
          <textarea
            value={dietaryNotes}
            onChange={(e) => onChangeNotes?.(e.target.value)}
            placeholder="פרט כאן רגישויות ספציפיות, אלרגיות נדירות, העדפות קולינריות או פרטים נוספים לאירועים..."
            className="w-full p-4 md:p-5 bg-white/70 border border-white/80 shadow-sm rounded-[1.25rem] font-bold h-24 md:h-28 resize-none outline-none focus:bg-white focus:border-teal-300 transition-all text-[#0f172a] text-sm leading-relaxed placeholder:text-slate-400/70"
          />
        )}
      </div>
    </div>
  );
};
