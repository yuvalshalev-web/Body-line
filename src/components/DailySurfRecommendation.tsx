import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertTriangle, CheckCircle2, Info, Compass, Save, Loader2 } from 'lucide-react';
import WetsuitSVG from './WetsuitSVG';
import { SurfboardOverlay, ExactSurfboard } from './SurfboardOverlay';
import { Member } from '../types';
import { SURFBOARD_CATALOG } from '../data/surfboardCatalog';
import { calculateSurferFormula, calculateMatchScore, getBoardSize } from '../utils/surfMath';
import { roundToGritStandard } from '../utils/gritRounding';

interface DailySurfRecommendationProps {
  member: Member | null;
  currentWaveHeight: number; // in meters
  waterTemp?: number;
  onSaveRecommendation?: (vol: number, length: string) => Promise<void>;
}

const parseLength = (lenStr?: string) => {
  if (!lenStr) return { feet: 0, inches: 0 };
  const parts = lenStr.split("'");
  if (parts.length === 1 && parts[0].includes('"')) {
    // Handle new format (e.g. 80")
    return { feet: 0, inches: parseInt(parts[0].replace('"', '')) || 0 };
  }
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
      recLenInches = Math.round(baseRec.lengthInches + 2);
      explanation = 'ים בינוני, מעולה לתרגול. קח גלשן עם קצת יותר נפח מהרגיל שיעזור לך לתפוס גלים ולשמור על יציבות.';
    } else {
      boardType = 'סופטבורד (Softboard)';
      recVol = baseRec.volume * 1.15; // Much more volume for small waves
      recLenInches = Math.round(baseRec.lengthInches + 6);
      explanation = 'ים נמוך ורגוע, מושלם למתחילים! סופטבורד גדול במיוחד ייתן לך מקסימום גלים והנאה.';
    }
  } else if (surfingLevel === 'Advanced') {
    if (currentWaveHeight > 2.0) {
      boardType = 'סטפ-אפ (Step-up)';
      recVol = baseRec.volume * 1.05; // Extra volume for big waves
      recLenInches = Math.round(baseRec.lengthInches + 4); // Longer for big waves
      explanation = 'ים גבוה ועוצמתי. קח גלשן ארוך יותר (Step-up) כדי להיכנס מוקדם לגל ולשמור על שליטה במהירויות גבוהות.';
    } else if (currentWaveHeight >= 1.2) {
      boardType = 'שורטבורד (Shortboard)';
      // Base volume is perfect here
      recLenInches = Math.round(baseRec.lengthInches);
      explanation = 'תנאים מצוינים לביצועים. שורטבורד קלאסי במידות הרגילות שלך ייתן לך את הרדיקליות שאתה מחפש.';
    } else if (currentWaveHeight >= 0.7) {
      boardType = 'שורטבורד קטן / הייבריד';
      recVol = baseRec.volume * 1.08;
      recLenInches = Math.round(baseRec.lengthInches - 2);
      explanation = 'ים בינוני-נמוך. גלשן מעט קצר ורחב יותר יעזור לך לייצר מהירות בחלקים החלשים של הגל.';
    } else {
      boardType = 'פיש (Fish) / גרובבלר';
      recVol = baseRec.volume * 1.15; // Extra volume for weak waves
      recLenInches = Math.round(baseRec.lengthInches - 4); // Shorter
      explanation = 'ים חלש. קח גלשן קצר, רחב ושטוח (פיש או גרובבלר) כדי לייצר מהירות גם כשאין כוח בגל.';
    }
  } else {
    // Intermediate
    if (currentWaveHeight > 1.8) {
      boardType = 'שורטבורד / סטפ-אפ';
      recVol = baseRec.volume * 1.08;
      recLenInches = Math.round(baseRec.lengthInches + 4);
      explanation = 'ים גבוה ומאתגר. קח גלשן ארוך יותר עם אקסטרה נפח כדי להבטיח כניסה בטוחה לגלים.';
    } else if (currentWaveHeight >= 1.0) {
      boardType = 'שורטבורד / הייבריד';
      // Base volume is perfect here
      recLenInches = Math.round(baseRec.lengthInches);
      explanation = 'תנאים קלאסיים! הגלשן היומיומי שלך (All-rounder) במידות הרגילות יעבוד כאן בצורה מושלמת.';
    } else if (currentWaveHeight >= 0.6) {
      boardType = 'פאן-בורד / פיש';
      recVol = baseRec.volume * 1.15;
      recLenInches = Math.round(baseRec.lengthInches - 2);
      explanation = 'ים חלש יחסית. גלשן עם יותר נפח (כמו פאן-בורד או פיש) יעזור לך לא לפספס גלים ולשמור על מהירות.';
    } else {
      boardType = 'לונגבורד / מיני-מאל';
      recVol = baseRec.volume * 1.35;
      recLenInches = Math.round(baseRec.lengthInches + 12);
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

      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="p-3 bg-[#007085]/10 rounded-2xl border border-[#007085]/20 shadow-[0_0_15px_rgba(0,112,133,0.1)]">
          <Sparkles className="text-[#007085]" size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-[#002b44] tracking-tight">התאמה אישית לפי מדדי גוף, רמת גלישה ומצב הים</h3>
          <p className="text-[#007085] text-sm font-bold tracking-widest uppercase">המלצת ציוד יומית</p>
        </div>
      </div>

      {/* Personalization Context Badges */}
      <div className="flex flex-wrap gap-3 mb-8 relative z-10">
        <div className="px-3 py-1.5 bg-[#007085]/5 border border-[#007085]/10 rounded-xl flex items-center gap-2 shadow-sm">
          <span className="text-[9px] font-black text-[#007085]/60 uppercase tracking-wider">משקל</span>
          <span className="text-xs font-black text-[#002b44]">{weight} ק"ג</span>
        </div>
        <div className="px-3 py-1.5 bg-[#007085]/5 border border-[#007085]/10 rounded-xl flex items-center gap-2 shadow-sm">
          <span className="text-[9px] font-black text-[#007085]/60 uppercase tracking-wider">גובה</span>
          <span className="text-xs font-black text-[#002b44]">{height} ס"מ</span>
        </div>
        <div className="px-3 py-1.5 bg-[#007085]/5 border border-[#007085]/10 rounded-xl flex items-center gap-2 shadow-sm">
          <span className="text-[9px] font-black text-[#007085]/60 uppercase tracking-wider">רמה</span>
          <span className="text-xs font-black text-[#002b44]">{surfingLevel}</span>
        </div>
        <div className="px-3 py-1.5 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center gap-2 shadow-sm">
          <span className="text-[9px] font-black text-orange-600/60 uppercase tracking-wider">גובה גל</span>
          <span className="text-xs font-black text-[#002b44]">{currentWaveHeight} מ'</span>
        </div>
        {waterTemp && (
          <div className="px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-2 shadow-sm">
            <span className="text-[9px] font-black text-blue-600/60 uppercase tracking-wider">טמפ' מים</span>
            <span className="text-xs font-black text-[#002b44]">{waterTemp}°C</span>
          </div>
        )}
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
                <div className="luxury-card p-10 flex flex-col lg:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
                  <div className="grain-overlay" />
                  <div className="premium-sweep-fx" />
                  
                  <div className="flex-1 text-center lg:text-right space-y-8 relative z-10">
                    <div>
                      <h4 className="text-5xl font-black text-[#002b44] mb-3 tracking-tighter font-yehuda">{boardType}</h4>
                      <div className="h-1.5 w-24 bg-[#007085] rounded-full mx-auto lg:mx-0 mb-8" />
                    </div>
                    
                    <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                      <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm min-w-[140px] transition-transform hover:scale-105">
                        <p className="text-[10px] text-[#007085] uppercase tracking-[0.2em] mb-2 font-black">נפח מומלץ</p>
                        <p className="text-4xl font-black text-[#002b44]">{Math.ceil(recVol)}<span className="text-sm text-[#007085] ml-1">L</span></p>
                      </div>
                      <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm min-w-[140px] transition-transform hover:scale-105">
                        <p className="text-[10px] text-[#007085] uppercase tracking-[0.2em] mb-2 font-black">אורך מומלץ</p>
                        <p className="text-4xl font-black text-[#002b44]" dir="ltr">{getBoardSize(recLenInches * 2.54)}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <p className="text-[#002b44]/90 text-xl leading-relaxed font-bold font-yehuda">{explanation}</p>
                      
                      {catalogItem && (
                        <div className="bg-white/30 backdrop-blur-md p-8 rounded-3xl border border-white/40 space-y-6 text-right shadow-inner">
                          <div className="flex flex-wrap justify-between items-center gap-4">
                            <p className="text-xs text-[#007085] uppercase tracking-[0.3em] font-black">על סוג הגלשן:</p>
                            <div className="flex gap-3">
                              <span className="text-[11px] bg-[#007085] text-white px-4 py-1.5 rounded-full font-black shadow-sm">אורך: {catalogItem.lengthRange}</span>
                              <span className="text-[11px] bg-[#007085] text-white px-4 py-1.5 rounded-full font-black shadow-sm">נפח: {catalogItem.volumeRange}</span>
                            </div>
                          </div>
                          <p className="text-[#002b44]/80 text-base leading-relaxed font-medium">{catalogItem.description}</p>
                          <div className="pt-6 border-t border-[#007085]/10">
                            <p className="text-[11px] text-[#007085] font-black uppercase tracking-widest mb-2">השורה התחתונה:</p>
                            <p className="text-[#002b44] text-lg leading-relaxed font-black italic font-yehuda">"{catalogItem.bottomLine}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row justify-center items-end gap-4 sm:gap-16 lg:gap-12 shrink-0 w-full lg:w-auto py-12 relative z-10">
                    {wetsuit && (
                      <div className="flex flex-col items-center gap-4 sm:gap-8 w-1/2 sm:w-[220px] group">
                        <div className="relative h-[250px] sm:h-[380px] w-full flex items-end justify-center transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-4">
                          <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                          <div className="w-full h-full flex items-end justify-center pb-4">
                            <WetsuitSVG thickness={wetsuit.thickness} alignBottom={true} />
                          </div>
                        </div>
                        <div className="text-center space-y-1 sm:space-y-2">
                          <p className="text-[9px] sm:text-[11px] font-black text-[#007085] uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60">ביגוד מומלץ</p>
                          <p className="text-sm sm:text-2xl font-black text-[#002b44] tracking-tighter font-yehuda leading-tight">{wetsuit.label}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-4 sm:gap-8 w-1/2 sm:w-[220px] group">
                      <div className="relative h-[250px] sm:h-[380px] w-full flex items-end justify-center transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-4">
                        <div className="absolute inset-0 bg-orange-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="w-full h-full scale-[1.25] origin-bottom -translate-y-10">
                          <ExactSurfboard type={boardKey} isSelected={true} />
                        </div>
                      </div>
                      <div className="text-center space-y-1 sm:space-y-2">
                        <p className="text-[9px] sm:text-[11px] font-black text-[#007085] uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60">גלשן מומלץ</p>
                        <p className="text-sm sm:text-2xl font-black text-[#002b44] tracking-tighter font-yehuda leading-tight">{boardType}</p>
                      </div>
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
                          await onSaveRecommendation(recVol, getBoardSize(recLenInches * 2.54));
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
