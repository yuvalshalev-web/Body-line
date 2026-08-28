import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertTriangle, CheckCircle2, Info, Compass, Save, Loader2 } from 'lucide-react';
import WetsuitSVG from './WetsuitSVG';
import { SurfboardOverlay, ExactSurfboard } from './SurfboardOverlay';
import { Member } from '../types';
import { SURFBOARD_CATALOG } from '../data/surfboardCatalog';
import { calculateSurferFormula, calculateMatchScoreDetails, getBoardSize } from '../utils/surfMath';
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

  const { weight, height, surfingLevel, currentBoardVolume, currentBoardLength, currentBoardType } = member;

  const baseRec = calculateSurferFormula(weight, height, surfingLevel as any, member.fitnessLevel as any || 'Average');
  let recVol = baseRec.volume;
  let recLenInches = baseRec.lengthInches;
  let boardType = '';
  let explanation = '';
  let isWarning = false;

  if (currentWaveHeight < 0.2) {
    boardType = 'SUP';
    recVol = 0;
    recLenInches = 0;
    explanation = 'הים פלטה (גלים שטוחים). תנאים מצוינים לאימון חתירה על סאפ, שחייה, או פעילות חוף!';
    isWarning = false;
  } else if (surfingLevel === 'Beginner') {
    if (currentWaveHeight >= 1.3) {
      boardType = 'Softboard';
      explanation = 'ים גבוה ומאתגר למתחילים - מומלץ להישאר בחוף או לתרגל אך ורק בקצף הקרוב לחוף. בטיחות קודמת לכל!';
      isWarning = true;
    } else if (currentWaveHeight >= 0.7) {
      boardType = 'Softboard (7\'6" - 8\'0")';
      recVol = baseRec.volume * 1.05;
      recLenInches = Math.round(baseRec.lengthInches + 2);
      explanation = 'ים איכותי ומסודר (גובה חזה ומעלה), מעולה לתרגול יציבות וירידה בגלים פתוחים עם סופטבורד יציב.';
    } else if (currentWaveHeight >= 0.4) {
      boardType = 'Softboard (8\'0" - 9\'0")';
      recVol = baseRec.volume * 1.15;
      recLenInches = Math.round(baseRec.lengthInches + 4);
      explanation = 'ים מתון ונעים (גובה ברך-מותן), תנאים אידיאליים ללימוד ותרגול תפיסת גלים ופופ-אפ.';
    } else {
      boardType = 'Softboard / Longboard';
      recVol = baseRec.volume * 1.25;
      recLenInches = Math.round(baseRec.lengthInches + 6);
      explanation = 'ים נמוך ורגוע מאוד. סופטבורד גדול בעל ציפה מקסימלית יאפשר לתפוס כל אדווה בקלות.';
    }
  } else if (surfingLevel === 'Advanced') {
    if (currentWaveHeight > 1.8) {
      boardType = 'Step-up / HPSB';
      recVol = baseRec.volume * 1.05;
      recLenInches = Math.round(baseRec.lengthInches + 3);
      explanation = 'ים גבוה ועוצמתי. מומלץ גלשן Step-up או שורטבורד מקצועי עם אחיזה חזקה לרדיקליות ושליטה במהירות.';
    } else if (currentWaveHeight >= 1.2) {
      boardType = 'Shortboard (HPSB)';
      recLenInches = Math.round(baseRec.lengthInches);
      explanation = 'תנאי גלישה מושלמים! שורטבורד קלאסי במידות התחרותיות שלך ייתן ביצועים חדים, פניות מהירות ואחיזה מדויקת.';
    } else if (currentWaveHeight >= 0.75) {
      boardType = 'Shortboard / Performance Fish';
      recVol = baseRec.volume;
      recLenInches = Math.round(baseRec.lengthInches);
      explanation = 'ים איכותי ומסודר (גובה חזה עד כתף). השורטבורד היומיומי או פיש ביצועים יעבדו כאן מצוין לייצור מהירות וביצועים.';
    } else if (currentWaveHeight >= 0.45) {
      boardType = 'Groveler / Fish';
      recVol = baseRec.volume * 1.08;
      recLenInches = Math.round(baseRec.lengthInches - 2);
      explanation = 'ים בינוני-נמוך (גובה מותן). גלשן גרובבלר או פיש קצר ורחב יעזור לייצר מהירות מרבית בקטעים הפחות תלולים.';
    } else {
      boardType = 'Fish / Midlength';
      recVol = baseRec.volume * 1.15;
      recLenInches = Math.round(baseRec.lengthInches - 2);
      explanation = 'ים נמוך (גובה ברך ומטה). גלשן פיש רחב ומשוחרר, מידלנגת\' או לונגבורד יספקו זרימה ומהירות מדהימה.';
    }
  } else {
    // Intermediate
    if (currentWaveHeight > 1.8) {
      boardType = 'Shortboard / Step-up';
      recVol = baseRec.volume * 1.08;
      recLenInches = Math.round(baseRec.lengthInches + 4);
      explanation = 'ים גבוה ומאתגר. קח גלשן ארוך יותר עם אקסטרה נפח כדי להבטיח כניסה בטוחה לגלים.';
    } else if (currentWaveHeight >= 1.2) {
      boardType = 'Shortboard / Hybrid';
      recLenInches = Math.round(baseRec.lengthInches);
      explanation = 'תנאים מצוינים (גובה ראש ומעלה)! גלשן שורטבורד / הייבריד יומי יספק מהירות, יציבות ותמרון נהדר.';
    } else if (currentWaveHeight >= 0.75) {
      boardType = 'Hybrid / Shortboard / Fish';
      recVol = baseRec.volume;
      recLenInches = Math.round(baseRec.lengthInches);
      explanation = 'ים איכותי ומסודר (גובה חזה עד כתף). תנאים מעולים לגלשן היומיומי שלך (All-Rounder או Hybrid) במידות הרגילות!';
    } else if (currentWaveHeight >= 0.45) {
      boardType = 'Funboard / Fish / Groveler';
      recVol = baseRec.volume * 1.10;
      recLenInches = Math.round(baseRec.lengthInches - 2);
      explanation = 'ים בינוני-נמוך (גובה מותן). גלשן עם טיפה יותר נפח ורוחב (פאן-בורד או פיש) יעזור לשמור על מהירות ורציפות.';
    } else {
      recLenInches = Math.round(baseRec.lengthInches + 8);
      recVol = baseRec.volume * 1.25;
      if (recLenInches >= 102) {
        boardType = 'Longboard';
        explanation = 'ים נמוך (גובה ברך ומטה). תהנה מהציפה עם לונגבורד קלאסי שיתפוס כל גל בקלות.';
      } else {
        boardType = 'Midlength / Mini Mal';
        explanation = 'ים נמוך (גובה ברך ומטה). מידלנגת\' או פאן-בורד יעניקו לך שפע ציפה ורציפות על הגל.';
      }
    }
  }

  // Calculate Match Score for current board
  let matchScore = 0;
  let matchText = '';
  let idealBoardRecommendation = '';
  if (currentBoardVolume && currentBoardLength) {
    const matchDetails = calculateMatchScoreDetails(
      currentBoardVolume,
      currentBoardLength,
      recVol,
      recLenInches,
      currentBoardType,
      currentWaveHeight,
      surfingLevel as any
    );
    matchScore = matchDetails.totalScore;
    
    if (matchScore >= 85) {
      matchText = 'הגלשן שלך מתאים בדיוק לתנאי הים היום!';
    } else {
      let reason = '';
      let currentBoardLengthInches = 0;
      if (currentBoardLength) {
        const parsed = parseLength(currentBoardLength);
        currentBoardLengthInches = parsed.feet * 12 + parsed.inches;
      }
      if (matchDetails.typeReason) {
        reason = matchDetails.typeReason;
      } else if (currentBoardVolume < recVol * 0.85) {
        reason = 'הגלשן בעל נפח נמוך מדי לתנאים (חסרה ציפה)';
      } else if (currentBoardVolume > recVol * 1.25) {
        reason = 'הגלשן בעל נפח גדול מדי לתנאים';
      } else if (currentBoardLengthInches > 0 && currentBoardLengthInches < recLenInches * 0.9) {
        reason = 'הגלשן קצר מדי לתנאים (חסרה מהירות כניסה)';
      } else if (currentBoardLengthInches > 0 && currentBoardLengthInches > recLenInches * 1.15) {
        reason = 'הגלשן ארוך מדי לתנאים';
      } else {
        reason = 'המידות וסוג הגלשן פחות אידיאליים למצב הים';
      }

      if (matchScore >= 60) matchText = `הגלשן שלך סביר להיום, אך ${reason}.`;
      else matchText = `הגלשן שלך פחות מתאים לתנאים היום - ${reason}.`;

      idealBoardRecommendation = `במקום זאת, כדאי לגלוש על ${boardType} סביב נפח ${Math.ceil(recVol)}L. ${explanation}`;
    }
  }

  // Wetsuit logic
  const getWetsuit = (temp: number) => {
    if (temp < 18) return { label: 'חליפת חורף (4/3)', thickness: '4/3' as const };
    if (temp <= 20.5) return { label: 'חליפת מעבר (3/2)', thickness: '3/2' as const };
    if (temp <= 22.5) return { label: 'חליפת קיץ ארוכה (2/2)', thickness: '2/2' as const };
    if (temp < 24.5) return { label: 'חליפת קיץ קצרה (2/2)', thickness: '2/2-ss' as const };
    return { label: 'חולצת לייקרה / בגד ים', thickness: 'sun-shirt' as const };
  };
  const wetsuit = waterTemp ? getWetsuit(waterTemp) : null;

  // Find matching catalog item for description
  const catalogItem = SURFBOARD_CATALOG.find(item => 
    boardType.includes(item.name) || boardType.includes(item.nameEn.split(' / ')[0])
  );

  const getBoardKey = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('sup') || lower.includes('סאפ')) return 'sup';
    if (lower.includes('softboard') || lower.includes('סופטבורד')) return 'softboard';
    if (lower.includes('longboard') || lower.includes('לונגבורד')) return 'longboard';
    if (lower.includes('funboard') || lower.includes('פאן-בורד') || lower.includes('פאנבורד') || lower.includes('מיני-מאל') || lower.includes('מידלנגת')) return 'funboard';
    if (lower.includes('shortboard') || lower.includes('שורטבורד')) return 'shortboard';
    if (lower.includes('fish') || lower.includes('פיש')) return 'fish';
    return 'funboard';
  };
  const boardKey = getBoardKey(boardType);

  return (
    <div className="luxury-card p-8 relative overflow-hidden" dir="rtl">
      <div className="grain-overlay" />
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
                    
                    {recVol > 0 && recLenInches > 0 && (
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
                    )}

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
                  
                  <div className="flex flex-row justify-center items-end gap-6 sm:gap-16 lg:gap-12 shrink-0 w-full lg:w-auto pt-6 pb-2 lg:py-12 relative z-10">
                    {wetsuit && (
                      <div className="flex flex-col items-center gap-3 sm:gap-6 w-1/2 sm:w-[220px] group">
                        <div className="relative h-[220px] sm:h-[340px] w-full flex items-end justify-center transition-all duration-500 group-hover:scale-105">
                          <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="w-full h-full flex items-end justify-center">
                            <WetsuitSVG thickness={wetsuit.thickness} alignBottom={true} />
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[9px] sm:text-[11px] font-black text-[#007085] uppercase tracking-[0.2em] opacity-60">ביגוד מומלץ</p>
                          <p className="text-sm sm:text-2xl font-black text-[#002b44] tracking-tighter font-yehuda leading-tight">{wetsuit.label}</p>
                        </div>
                      </div>
                    )}
                    {boardType !== 'ללא גלשן' && (
                      <div className="flex flex-col items-center gap-3 sm:gap-6 w-1/2 sm:w-[220px] group">
                        <div className="relative h-[220px] sm:h-[340px] w-full flex items-end justify-center transition-all duration-500 group-hover:scale-105">
                          <div className="absolute inset-0 bg-orange-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="w-full h-full flex items-end justify-center">
                            <ExactSurfboard type={boardKey} isSelected={true} />
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[9px] sm:text-[11px] font-black text-[#007085] uppercase tracking-[0.2em] opacity-60">גלשן מומלץ</p>
                          <p className="text-sm sm:text-2xl font-black text-[#002b44] tracking-tighter font-yehuda leading-tight">{boardType}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {recVol > 0 && recLenInches > 0 && currentBoardVolume && currentBoardLength && (
                  <div className="bg-white/70 border border-white/60 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-[#002b44] tracking-tight mb-2 flex items-center gap-2">
                        <Sparkles size={18} className="text-[#007085]" />
                        התאמת הגלשן שלך להיום
                      </h4>
                      <p className="text-sm font-bold text-[#002b44]/90 leading-relaxed">{matchText}</p>
                    </div>

                    {/* Visual Gauge - Progress Bar & Score (Positioned ABOVE ideal board recommendation) */}
                    <div className="flex items-center gap-4 pt-1 pb-2">
                      <span className={`text-2xl sm:text-3xl font-black shrink-0 leading-none drop-shadow-sm ${matchScore >= 85 ? 'text-emerald-600' : matchScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {matchScore}%
                      </span>
                      <div className="flex-1 h-5 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-full overflow-hidden relative shadow-[inset_0_2px_5px_rgba(0,0,0,0.05)]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${matchScore}%` }}
                          transition={{ duration: 1.2, delay: 0.1, type: "spring", bounce: 0.2 }}
                          className={`absolute top-0 right-0 h-full rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-r ${
                            matchScore >= 85 ? 'from-emerald-500 to-emerald-400' : 
                            matchScore >= 60 ? 'from-amber-500 to-amber-400' : 
                            'from-rose-500 to-rose-400'
                          }`}
                        >
                          {/* Inner shine for 3D effect */}
                          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent rounded-t-full" />
                        </motion.div>
                      </div>
                    </div>

                    {idealBoardRecommendation && (
                      <div className="p-3.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-xs">
                        <p className="text-xs font-black text-[#007085] mb-1">הגלשן האידאלי במקום:</p>
                        <p className="text-sm text-[#002b44]/80 leading-relaxed font-medium">{idealBoardRecommendation}</p>
                      </div>
                    )}
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
