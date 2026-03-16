import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves, AlertTriangle, CheckCircle2, Info, Compass, Save, Loader2 } from 'lucide-react';
import { WetsuitIcon } from './WetsuitIcon';
import { SurfboardOverlay } from './SurfboardOverlay';
import { Member } from '../types';
import { SURFBOARD_CATALOG } from '../data/surfboardCatalog';

interface DailySurfRecommendationProps {
  member: Member | null;
  currentWaveHeight: number; // in meters
  waterTemp?: number;
  onSaveRecommendation?: (vol: number, length: string) => Promise<void>;
}

const parseLength = (lenStr?: string) => {
  if (!lenStr) return { feet: 0, inches: 0 };
  const parts = lenStr.split("'");
  const feet = parseInt(parts[0]) || 0;
  const inches = parseInt(parts[1]?.replace('"', '')) || 0;
  return { feet, inches };
};

export const DailySurfRecommendation: React.FC<DailySurfRecommendationProps> = ({ member, currentWaveHeight, waterTemp, onSaveRecommendation }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, [currentWaveHeight, member?.weight, member?.height, member?.surfingLevel]);

  if (!member || !member.weight || !member.height || !member.surfingLevel) {
    return (
      <div className="bg-white/40 backdrop-blur-[20px] border border-white/40 rounded-[2rem] p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)]" dir="rtl">
        <div className="p-4 bg-[#007085]/10 rounded-2xl inline-block mb-4">
          <Compass className="text-[#007085]" size={32} />
        </div>
        <h3 className="text-xl font-black text-[#002b44] mb-2">המלצת גלשן יומית</h3>
        <p className="text-[#007085] text-sm mb-6">אנא הזן את הנתונים הפיזיים שלך בפרופיל האישי שלך</p>
      </div>
    );
  }

  const { weight, height, surfingLevel, currentBoardVolume, currentBoardLength } = member;

  let recVol = 0;
  let recLenInches = 0;
  let boardType = '';
  let explanation = '';
  let isWarning = false;

  const heightInches = height / 2.54;

  if (surfingLevel === 'Beginner') {
    if (currentWaveHeight >= 1.6) {
      boardType = 'סופטבורד (Softboard)';
      recVol = weight * 0.85;
      recLenInches = heightInches + 30;
      explanation = 'ים גבוה מדי למתחילים - מומלץ להישאר בחוץ או לגלוש רק בקצף הקרוב לחוף. בטיחות קודמת לכל!';
      isWarning = true;
    } else if (currentWaveHeight >= 0.8) {
      boardType = 'סופטבורד / פאן-בורד';
      recVol = weight * 0.8;
      recLenInches = heightInches + 30;
      explanation = 'ים בינוני, מעולה לתרגול. קח גלשן עם הרבה נפח שיעזור לך לתפוס גלים ולשמור על יציבות.';
    } else {
      boardType = 'סופטבורד (Softboard)';
      recVol = weight * 0.9;
      recLenInches = heightInches + 45;
      explanation = 'ים נמוך ורגוע, מושלם למתחילים! סופטבורד גדול ייתן לך מקסימום גלים והנאה.';
    }
  } else if (surfingLevel === 'Advanced') {
    if (currentWaveHeight > 2.5) {
      boardType = 'שורטבורד (Shortboard)';
      recVol = weight * 0.45;
      recLenInches = heightInches + 12;
      explanation = 'ים גבוה ועוצמתי. קח גלשן ארוך וצר יותר כדי להיכנס מוקדם לגל ולשמור על שליטה במהירויות גבוהות.';
    } else if (currentWaveHeight >= 1.6) {
      boardType = 'שורטבורד (Shortboard)';
      recVol = weight * 0.4;
      recLenInches = heightInches;
      explanation = 'תנאים מצוינים לביצועים. שורטבורד קלאסי ייתן לך את הרדיקליות שאתה מחפש.';
    } else if (currentWaveHeight >= 0.8) {
      boardType = 'שורטבורד / פיש';
      recVol = weight * 0.42;
      recLenInches = heightInches - 2;
      explanation = 'ים כיפי וורסטילי. פיש או שורטבורד קצר יעזרו לך לייצר מהירות ולשחרר זנב.';
    } else {
      boardType = 'פיש (Fish)';
      recVol = weight * 0.5;
      recLenInches = heightInches + 5;
      explanation = 'ים חלש. קח גלשן רחב ושטוח (פיש או טווין-פין) כדי לייצר מהירות גם כשאין כוח בגל.';
    }
  } else {
    // Intermediate
    if (currentWaveHeight > 2.5) {
      boardType = 'שורטבורד (Shortboard)';
      recVol = weight * 0.5;
      recLenInches = heightInches + 10;
      explanation = 'ים גבוה מאוד ומאתגר. דורש כושר וניסיון. אם אתה נכנס, קח גלשן ארוך יותר עם אקסטרה נפח.';
      isWarning = true;
    } else if (currentWaveHeight >= 1.6) {
      boardType = 'שורטבורד / הייבריד';
      recVol = weight * 0.5;
      recLenInches = heightInches + 5;
      explanation = 'הים עולה. גלשן היברידי או שורטבורד עם קצת יותר נפח יעזור לך להתמודד עם העוצמה.';
    } else if (currentWaveHeight >= 0.8) {
      boardType = 'פאן-בורד / פיש';
      recVol = weight * 0.6;
      recLenInches = heightInches + 20;
      explanation = 'יום קלאסי לפאן-בורד או ה-Ribeye שלך. שילוב מושלם של ציפה ויכולת תמרון.';
    } else {
      boardType = 'לונגבורד / פאן-בורד';
      recVol = weight * 0.75;
      recLenInches = heightInches + 35;
      explanation = 'ים נמוך. תהנה מהציפה עם לונגבורד או פאן-בורד גדול כדי לא לפספס אף גל.';
    }
  }

  // Calculate Match Score for current board
  let matchScore = 0;
  let matchText = '';
  if (currentBoardVolume && currentBoardLength) {
    const { feet, inches } = parseLength(currentBoardLength);
    const currLenInches = feet * 12 + inches;
    
    const volDiff = currentBoardVolume - recVol;
    // If we have more volume, penalty is smaller. If less, penalty is larger.
    const volPenalty = volDiff >= 0 ? volDiff * 1 : Math.abs(volDiff) * 3;
    const volScore = Math.max(0, 100 - volPenalty);
    
    // Length penalty - reduced sensitivity
    const lenDiff = Math.abs(currLenInches - recLenInches);
    const lenScore = Math.max(0, 100 - (lenDiff * 2));
    
    matchScore = Math.round((volScore * 0.7) + (lenScore * 0.3));
    
    if (matchScore >= 85) matchText = 'הגלשן שלך מושלם להיום!';
    else if (matchScore >= 60) matchText = 'הגלשן שלך סביר להיום, אבל לא אידיאלי.';
    else matchText = 'הגלשן שלך פחות מתאים לתנאים היום.';
  }

  // Wetsuit logic
  const getWetsuit = (temp: number) => {
    if (temp < 16) return { label: 'חליפה מלאה (4/3mm)', type: 'full' as const };
    if (temp <= 19) return { label: 'חליפה מלאה (4/3mm)', type: 'full' as const };
    if (temp <= 23) return { label: 'חליפה מלאה (3/2mm)', type: 'full' as const };
    if (temp <= 27) return { label: 'שורטי (Shorty 2mm)', type: 'shorty' as const };
    return { label: 'לייקרה קלה', type: 'lycra' as const };
  };
  const wetsuit = waterTemp ? getWetsuit(waterTemp) : null;

  // Find matching catalog item for description
  const catalogItem = SURFBOARD_CATALOG.find(item => 
    boardType.includes(item.name) || boardType.includes(item.nameEn.split(' / ')[0])
  );

  const getBoardKey = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('softboard') || lower.includes('סופטבורד')) return 'softboard';
    if (lower.includes('longboard') || lower.includes('לונגבורד')) return 'longboard';
    if (lower.includes('funboard') || lower.includes('פאן-בורד') || lower.includes('פאנבורד')) return 'funboard';
    if (lower.includes('shortboard') || lower.includes('שורטבורד')) return 'shortboard';
    if (lower.includes('fish') || lower.includes('פיש')) return 'fish';
    return 'funboard';
  };
  const boardKey = getBoardKey(boardType);

  return (
    <div className="bg-white/40 backdrop-blur-[30px] border border-white/40 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden" dir="rtl">
      {/* Background elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#007085]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#002b44]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-3 bg-[#007085]/10 rounded-2xl border border-[#007085]/20 shadow-[0_0_15px_rgba(0,112,133,0.1)]">
          <Waves className="text-[#007085]" size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-[#002b44] tracking-tight">התאמה אישית לפי מדדי גוף, רמת גלישה ומצב הים</h3>
          <p className="text-[#007085] text-sm font-bold tracking-widest uppercase">המלצת ציוד יומית</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoaded && (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="relative z-10 space-y-8"
          >
            {isWarning ? (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex items-start gap-4">
                <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={28} />
                <div>
                  <h4 className="text-xl font-black text-rose-900 mb-2">אזהרת בטיחות</h4>
                  <p className="text-rose-800 leading-relaxed font-medium">{explanation}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 border border-white/40 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                <div className="flex-1 text-center md:text-right">
                  <h4 className="text-3xl font-black text-[#002b44] mb-3">{boardType}</h4>
                  <div className="flex justify-center md:justify-start gap-6 mb-4">
                    <div>
                      <p className="text-[10px] text-[#007085] uppercase tracking-widest mb-1">נפח מומלץ</p>
                      <p className="text-2xl font-black text-[#002b44]">{recVol.toFixed(1)}<span className="text-sm text-[#007085] ml-1">L</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#007085] uppercase tracking-widest mb-1">אורך מומלץ</p>
                      <p className="text-2xl font-black text-[#002b44]" dir="ltr">{Math.floor(recLenInches/12)}'{Math.round(recLenInches%12)}"</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[#002b44]/80 text-sm leading-relaxed bg-white/50 p-4 rounded-xl border border-white/40">{explanation}</p>
                    {catalogItem && (
                      <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100/50 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-cyan-700 uppercase tracking-widest font-bold">על סוג הגלשן:</p>
                          <div className="flex gap-3">
                            <span className="text-[9px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold">אורך: {catalogItem.lengthRange}</span>
                            <span className="text-[9px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold">נפח: {catalogItem.volumeRange}</span>
                          </div>
                        </div>
                        <p className="text-[#002b44]/70 text-xs leading-relaxed italic">{catalogItem.description}</p>
                        <div className="pt-2 border-t border-cyan-200/30">
                          <p className="text-[9px] text-cyan-600 font-bold uppercase mb-1">השורה התחתונה:</p>
                          <p className="text-[#002b44]/80 text-[11px] leading-relaxed font-medium">{catalogItem.bottomLine}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 shrink-0 items-end">
                  {wetsuit && (
                    <div className="flex flex-col items-center gap-3 w-full md:w-32">
                      <div className="h-80 w-full relative flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-4 drop-shadow-[0_10px_20px_rgba(0,43,68,0.1)]">
                        <WetsuitIcon type={wetsuit.type} className="w-full h-full text-[#002b44]" />
                      </div>
                      <span className="text-[11px] font-bold text-[#002b44] text-center w-full leading-tight bg-white/50 px-2 py-1 rounded-lg border border-white/40">{wetsuit.label}</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-3 w-full md:w-64">
                    <SurfboardOverlay selectedBoardType={boardKey} />
                    <span className="text-[11px] font-bold text-[#002b44] text-center w-full leading-tight bg-white/50 px-2 py-1 rounded-lg border border-white/40">גלשן מומלץ: {boardType}</span>
                  </div>
                </div>
              </div>
            )}

            {currentBoardVolume && currentBoardLength && !isWarning && (
              <div className="bg-white/50 border border-white/40 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs text-[#007085] uppercase tracking-widest mb-1">התאמת הגלשן שלך להיום</p>
                    <p className="text-sm font-bold text-[#002b44]">{matchText}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-black ${matchScore >= 85 ? 'text-emerald-500' : matchScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {matchScore}%
                    </span>
                  </div>
                </div>
                
                {/* Visual Gauge */}
                <div className="h-3 bg-black/5 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${matchScore}%` }}
                    transition={{ duration: 1, delay: 0.5, type: "spring" }}
                    className={`absolute top-0 left-0 h-full rounded-full ${matchScore >= 85 ? 'bg-emerald-400' : matchScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  />
                </div>
              </div>
            )}

            {onSaveRecommendation && !isWarning && (
              <button 
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await onSaveRecommendation(recVol, `${Math.floor(recLenInches/12)}'${Math.round(recLenInches%12)}"`);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || saveSuccess}
                className={`w-full py-4 font-black rounded-xl transition-all flex justify-center items-center gap-2 ${
                  saveSuccess 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-[#007085] hover:bg-[#005a6b] text-white'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 size={20} />
                    נשמר בהצלחה
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    שמור המלצה בפרופיל
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
