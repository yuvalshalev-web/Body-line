import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves, AlertTriangle, CheckCircle2, Info, Compass, Save, Loader2 } from 'lucide-react';
import WetsuitSVG from './WetsuitSVG';
import { SurfboardOverlay } from './SurfboardOverlay';
import { Member } from '../types';
import { SURFBOARD_CATALOG } from '../data/surfboardCatalog';
import { calculateSurferFormula, calculateMatchScore } from '../utils/surfMath';

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

  const baseRec = calculateSurferFormula(weight, height, surfingLevel as any, member.fitnessLevel as any || 'Average');
  let recVol = baseRec.volume;
  let recLenInches = baseRec.lengthInches;
  let boardType = '';
  let explanation = '';
  let isWarning = false;

  if (surfingLevel === 'Beginner') {
    if (currentWaveHeight >= 1.5) {
      boardType = 'סופטבורד (Softboard)';
      explanation = 'ים גבוה מדי למתחילים - מומלץ להישאר בחוף או לגלוש רק בקצף הקרוב לחוף. בטיחות קודמת לכל!';
      isWarning = true;
    } else if (currentWaveHeight >= 0.8) {
      boardType = 'סופטבורד / פאן-בורד';
      recVol = baseRec.volume * 1.05; // Slightly more volume for medium waves
      recLenInches = baseRec.lengthInches + 2;
      explanation = 'ים בינוני, מעולה לתרגול. קח גלשן עם קצת יותר נפח מהרגיל שיעזור לך לתפוס גלים ולשמור על יציבות.';
    } else {
      boardType = 'סופטבורד (Softboard)';
      recVol = baseRec.volume * 1.15; // Much more volume for small waves
      recLenInches = baseRec.lengthInches + 6;
      explanation = 'ים נמוך ורגוע, מושלם למתחילים! סופטבורד גדול במיוחד ייתן לך מקסימום גלים והנאה.';
    }
  } else if (surfingLevel === 'Advanced') {
    if (currentWaveHeight > 2.0) {
      boardType = 'סטפ-אפ (Step-up)';
      recVol = baseRec.volume * 1.05; // Extra volume for big waves
      recLenInches = baseRec.lengthInches + 4; // Longer for big waves
      explanation = 'ים גבוה ועוצמתי. קח גלשן ארוך יותר (Step-up) כדי להיכנס מוקדם לגל ולשמור על שליטה במהירויות גבוהות.';
    } else if (currentWaveHeight >= 1.2) {
      boardType = 'שורטבורד (Shortboard)';
      // Base volume is perfect here
      explanation = 'תנאים מצוינים לביצועים. שורטבורד קלאסי במידות הרגילות שלך ייתן לך את הרדיקליות שאתה מחפש.';
    } else if (currentWaveHeight >= 0.7) {
      boardType = 'שורטבורד קטן / הייבריד';
      recVol = baseRec.volume * 1.08;
      recLenInches = baseRec.lengthInches - 2;
      explanation = 'ים בינוני-נמוך. גלשן מעט קצר ורחב יותר יעזור לך לייצר מהירות בחלקים החלשים של הגל.';
    } else {
      boardType = 'פיש (Fish) / גרובבלר';
      recVol = baseRec.volume * 1.15; // Extra volume for weak waves
      recLenInches = baseRec.lengthInches - 4; // Shorter
      explanation = 'ים חלש. קח גלשן קצר, רחב ושטוח (פיש או גרובבלר) כדי לייצר מהירות גם כשאין כוח בגל.';
    }
  } else {
    // Intermediate
    if (currentWaveHeight > 1.8) {
      boardType = 'שורטבורד / סטפ-אפ';
      recVol = baseRec.volume * 1.08;
      recLenInches = baseRec.lengthInches + 4;
      explanation = 'ים גבוה ומאתגר. קח גלשן ארוך יותר עם אקסטרה נפח כדי להבטיח כניסה בטוחה לגלים.';
    } else if (currentWaveHeight >= 1.0) {
      boardType = 'שורטבורד / הייבריד';
      // Base volume is perfect here
      explanation = 'תנאים קלאסיים! הגלשן היומיומי שלך (All-rounder) במידות הרגילות יעבוד כאן בצורה מושלמת.';
    } else if (currentWaveHeight >= 0.6) {
      boardType = 'פאן-בורד / פיש';
      recVol = baseRec.volume * 1.15;
      recLenInches = baseRec.lengthInches - 2;
      explanation = 'ים חלש יחסית. גלשן עם יותר נפח (כמו פאן-בורד או פיש) יעזור לך לא לפספס גלים ולשמור על מהירות.';
    } else {
      boardType = 'לונגבורד / מיני-מאל';
      recVol = baseRec.volume * 1.35;
      recLenInches = baseRec.lengthInches + 12;
      explanation = 'ים נמוך מאוד. תהנה מהציפה עם לונגבורד או מיני-מאל כדי לתפוס כל אדווה בים.';
    }
  }

  // Calculate Match Score for current board
  let matchScore = 0;
  let matchText = '';
  if (currentBoardVolume && currentBoardLength) {
    matchScore = calculateMatchScore(currentBoardVolume, currentBoardLength, recVol, recLenInches);
    
    if (matchScore >= 85) matchText = 'הגלשן שלך מושלם להיום!';
    else if (matchScore >= 60) matchText = 'הגלשן שלך סביר להיום, אבל לא אידיאלי.';
    else matchText = 'הגלשן שלך פחות מתאים לתנאים היום.';
  }

  // Wetsuit logic
  const getWetsuit = (temp: number) => {
    if (temp < 16) return { label: 'חליפה ארוכה (4/3)', thickness: '4/3' as const };
    if (temp <= 19) return { label: 'חליפה ארוכה (4/3)', thickness: '4/3' as const };
    if (temp <= 23) return { label: 'מעבר (3/2)', thickness: '3/2' as const };
    if (temp <= 25) return { label: 'קיץ ארוך (2/2)', thickness: '2/2' as const };
    if (temp <= 27) return { label: 'קיץ קצר (2/2)', thickness: '2/2-ss' as const };
    return { label: 'חולצת לייקרה', thickness: 'sun-shirt' as const };
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
            <div className="relative">
              <div className="space-y-8 transition-all duration-500">
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
                  
                  <div className="flex justify-center items-end shrink-0 w-full md:w-auto -mx-4 md:mx-0">
                    {wetsuit && (
                      <div className="flex flex-col items-center gap-3 w-[185px] md:w-[200px] z-10 -mr-7 md:-mr-14 relative pt-10">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-[#2A3F45] text-white text-[11px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg z-30">
                          {wetsuit.label} (המומלץ!)
                        </div>
                        <div className="h-[400px] md:h-[350px] w-full relative flex items-end justify-center bg-transparent p-0">
                          <WetsuitSVG thickness={wetsuit.thickness} alignBottom />
                        </div>
                        <span className="text-[11px] font-bold text-[#002b44] text-center w-full leading-tight bg-white/50 px-2 py-1 rounded-lg border border-white/40">ביגוד מומלץ: {wetsuit.label}</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-3 w-[185px] md:w-[255px] z-20 relative pt-10">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-[#2A3F45] text-white text-[11px] font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg z-30">
                        {catalogItem?.name || boardType} (המומלץ!)
                      </div>
                      <div className="h-[400px] w-full relative flex items-end justify-center">
                        <SurfboardOverlay selectedBoardType={boardKey} hideLabel />
                      </div>
                      <span className="text-[11px] font-bold text-[#002b44] text-center w-full leading-tight bg-white/50 px-2 py-1 rounded-lg border border-white/40">גלשן מומלץ: {boardType}</span>
                    </div>
                  </div>
                </div>

                {currentBoardVolume && currentBoardLength && (
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

                {onSaveRecommendation && (
                  <div className="flex justify-center w-full">
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
                      className={`px-8 py-3 font-black rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm hover:shadow-md ${
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
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
