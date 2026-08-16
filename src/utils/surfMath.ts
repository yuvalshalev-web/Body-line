
import { roundToGritStandard } from './gritRounding';

export type SurfingLevel = 'Learner' | 'Beginner' | 'Intermediate' | 'Advanced';
export type FitnessLevel = 'Low' | 'Average' | 'High' | 'Elite';

export interface SurfboardRecommendation {
  volume: number;
  lengthCm: number;
  lengthInches: number;
  lengthFormatted: string;
  boardType: string;
  boardTypeHebrew: string;
}

export const getBoardSize = (cm: number): string => {
  // 1. המרה ועיגול למספר שלם הכי קרוב (כמו בחנות)
  const totalInches = Math.round(cm / 2.54);
  
  // 2. חילוץ רגליים ואינצ'ים
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  
  // 3. פורמט תצוגה של שייפרים
  return `${feet}'${inches}"`;
};

export const calculateSurferFormula = (
  weight: number,
  heightCm: number,
  level: SurfingLevel,
  fitness: FitnessLevel = 'Average'
): SurfboardRecommendation => {
  let volMultiplier = 0;
  let lengthOffset = 0;
  let boardType = '';
  let boardTypeHebrew = '';

  // 1. Base Volume Multiplier (GF - Guild Factor)
  switch (level) {
    case 'Learner':
      volMultiplier = 1.10; // Extra volume for absolute learners
      break;
    case 'Beginner':
      volMultiplier = 1.00;
      break;
    case 'Intermediate':
      volMultiplier = 0.55;
      break;
    case 'Advanced':
      volMultiplier = 0.38;
      break;
  }

  // 2. Fitness Modifier
  let fitnessModifier = 1.0;
  switch (fitness) {
    case 'Low': fitnessModifier = 1.10; break; // +10% volume
    case 'Average': fitnessModifier = 1.00; break; // baseline
    case 'High': fitnessModifier = 0.95; break; // -5% volume
    case 'Elite': fitnessModifier = 0.92; break; // -8% volume
  }

  // 3. Board Type & Length Offset based on Level and Fitness
  if (level === 'Learner') {
    boardType = 'softboard';
    boardTypeHebrew = 'סופטבורד';
    lengthOffset = 70; // Increased to 70cm for better learner length
  } else if (level === 'Beginner') {
    if (fitness === 'Low' || fitness === 'Average') {
      boardType = 'softboard';
      boardTypeHebrew = 'סופטבורד';
      lengthOffset = 50; // General beginner length
    } else {
      boardType = 'longboard';
      boardTypeHebrew = 'לונגבורד';
      lengthOffset = 60; // +50-70cm for longboards
    }
  } else if (level === 'Intermediate') {
    if (fitness === 'Low') {
      boardType = 'funboard';
      boardTypeHebrew = 'פאנבורד';
      lengthOffset = 20;
    } else if (fitness === 'Average') {
      boardType = 'funboard';
      boardTypeHebrew = 'פאנבורד / פיש';
      lengthOffset = 15;
    } else {
      boardType = 'shortboard';
      boardTypeHebrew = 'שורטבורד (Hybrid)';
      lengthOffset = 0;
    }
  } else if (level === 'Advanced') {
    if (fitness === 'Low' || fitness === 'Average') {
      boardType = 'fish';
      boardTypeHebrew = 'פיש / שורטבורד';
      lengthOffset = -5; // -5 to -10cm for fish
    } else {
      boardType = 'shortboard';
      boardTypeHebrew = 'שורטבורד';
      lengthOffset = 0; // +/- 5cm for shortboard
    }
  }

  const volume = Math.ceil(weight * volMultiplier * fitnessModifier);
  let lengthCm = heightCm + lengthOffset;
  let lengthInches = lengthCm / 2.54;
  
  // Cap softboard length at 9'6" (114 inches / ~290-293 cm) since that's the max manufactured size
  if (boardType === 'softboard' && lengthInches > 114) {
    lengthInches = 114;
    lengthCm = 114 * 2.54;
  }

  // Enforce classic longboard length range (8'0" to 12'0")
  if (boardType === 'longboard') {
    if (lengthInches < 96) { // 8'0" = 96 inches
      boardType = 'funboard';
      boardTypeHebrew = 'מיני-מאל / פאנבורד';
    } else if (lengthInches > 144) { // 12'0" = 144 inches
      lengthInches = 144;
      lengthCm = 144 * 2.54;
    }
  }

  // 1. המרה ועיגול למספר שלם הכי קרוב (כמו בחנות)
  const totalInches = Math.round(lengthCm / 2.54);
  const lengthFormatted = getBoardSize(lengthCm);

  return {
    volume,
    lengthCm,
    lengthInches: totalInches,
    lengthFormatted,
    boardType,
    boardTypeHebrew
  };
};

export const parseLength = (lenStr?: string) => {
  if (!lenStr) return { feet: 0, inches: 0 };
  const parts = lenStr.split("'");
  const feet = parseInt(parts[0]) || 0;
  const inches = parseInt(parts[1]?.replace('"', '')) || 0;
  return { feet, inches };
};

export const calculateMatchScore = (
  currentVol: number,
  currentLenStr: string,
  recVol: number,
  recLenInches: number,
  currentBoardType?: string,
  waveHeight?: number
): number => {
  const details = calculateMatchScoreDetails(
    currentVol,
    currentLenStr,
    recVol,
    recLenInches,
    currentBoardType,
    waveHeight
  );
  return details.totalScore;
};

export interface MatchScoreDetails {
  totalScore: number;
  volScore: number;
  lenScore: number;
  typeScore?: number;
  typeReason?: string;
}

export const normalizeBoardCategory = (typeStr?: string): string => {
  if (!typeStr) return 'unknown';
  const lower = typeStr.toLowerCase();
  
  if (lower.includes('performance soft') || lower.includes('פרפורמנס סופט')) return 'perf_softboard';
  if (lower.includes('beginner soft') || lower.includes('softboard') || lower.includes('foamie') || lower.includes('סופט')) return 'beg_softboard';
  if (lower.includes('longboard') || lower.includes('לונג')) return 'longboard';
  if (lower.includes('mini mal') || lower.includes('malibu') || lower.includes('מיני-מאל')) return 'minimal';
  if (lower.includes('funboard') || lower.includes('egg') || lower.includes('פאנבורד')) return 'funboard';
  if (lower.includes('midlength') || lower.includes('מידלנגת')) return 'midlength';
  if (lower.includes('fish') || lower.includes('פיש')) return 'fish';
  if (lower.includes('hybrid') || lower.includes('groveler') || lower.includes('גרובבלר')) return 'hybrid';
  if (lower.includes('hpsb') || lower.includes('high-performance')) return 'hpsb';
  if (lower.includes('shortboard') || lower.includes('שורטבורד')) return 'shortboard';
  return 'shortboard';
};

export const calculateTypeCompatibility = (
  currentBoardType?: string,
  waveHeight?: number,
  surfingLevel?: SurfingLevel
): { score: number; reason?: string } => {
  if (!currentBoardType || waveHeight === undefined) {
    return { score: 100 };
  }

  const category = normalizeBoardCategory(currentBoardType);

  // 1. Check Surfing Level vs. Board Type Compatibility
  if (surfingLevel) {
    // Beginner or Learner trying to ride Shortboard / HPSB
    if ((surfingLevel === 'Learner' || surfingLevel === 'Beginner') && (category === 'shortboard' || category === 'hpsb')) {
      return {
        score: 20,
        reason: 'גולש מתחיל/לומד יתקשה מאוד לחתור, לתפוס גלים ולעמוד על גלשן שורטבורד/HPSB (חסר ציפה ויציבות קריטית לרמה)'
      };
    }

    // Learner trying to ride Fish
    if (surfingLevel === 'Learner' && category === 'fish') {
      return {
        score: 40,
        reason: 'גולש לומד יתקשה לשמור על יציבות ולתפוס גלים על גלשן פיש קצר ומשוחרר'
      };
    }

    // Advanced or Intermediate surfer riding a Beginner Softboard
    if ((surfingLevel === 'Advanced' || surfingLevel === 'Intermediate') && category === 'beg_softboard') {
      if (surfingLevel === 'Advanced') {
        return {
          score: 50,
          reason: 'גולש מתקדם יפיק ביצועים, מהירות ויכולת תמרון גבוהות בהרבה בים נמוך עם גלשן פיש, מידלנגת\' או גרובבלר מאשר עם סופטבורד מתחילים'
        };
      } else {
        return {
          score: 65,
          reason: 'גולש ברמת ביניים יקבל מנוף התקדמות, תמרון וזריזות עדיפים בהרבה מגלשן מידלנגת\', פאנבורד או פיש מאשר מסופטבורד מתחילים'
        };
      }
    }
  }

  // 2. Wave Height vs Board Type Compatibility
  // Small / Flat Waves (< 0.6m)
  if (waveHeight < 0.6) {
    switch (category) {
      case 'beg_softboard':
      case 'perf_softboard':
      case 'longboard':
      case 'minimal':
      case 'funboard':
        return { score: 100 };
      case 'fish':
      case 'hybrid':
      case 'midlength':
        return { score: 90 };
      case 'shortboard':
        return { score: 60, reason: 'שורטבורד רגיל דורש כוח גל ויתקשה לייצר מהירות בגלים נמוכים וחלשים' };
      case 'hpsb':
        return { score: 40, reason: 'גלשן HPSB בעל רוקר תלול וצורת גוף צרה ייגרר מים ויעצור בגלים נמוכים וחלשים' };
      default:
        return { score: 75 };
    }
  }

  // Medium-Small Waves (0.6m - 1.2m)
  if (waveHeight <= 1.2) {
    switch (category) {
      case 'funboard':
      case 'midlength':
      case 'fish':
      case 'hybrid':
      case 'minimal':
      case 'beg_softboard':
      case 'perf_softboard':
        return { score: 100 };
      case 'longboard':
        return { score: 90 };
      case 'shortboard':
        return { score: 85 };
      case 'hpsb':
        return { score: 70, reason: 'גלשן HPSB יעבוד טוב יותר בגלים חזקים וחלולים יותר' };
      default:
        return { score: 85 };
    }
  }

  // Good / Medium-High Waves (1.2m - 1.8m)
  if (waveHeight <= 1.8) {
    switch (category) {
      case 'shortboard':
      case 'hpsb':
      case 'hybrid':
        return { score: 100 };
      case 'perf_softboard':
        return { score: 85, reason: 'סופטבורד פרפורמנס מתמודד היטב בגלים בינוניים-גבוהים, אך בגל תלול וחלול גלשן קשיח ייתן אחיזה עדיפה' };
      case 'midlength':
      case 'funboard':
      case 'fish':
        return { score: 80, reason: 'בגלים גבוהים, גלשנים רחבים בעלי זנב רחב עלולים לאבד אחיזה בפניות חדות' };
      case 'longboard':
      case 'minimal':
        return { score: 65, reason: 'בגלים גבוהים, גלשן ארוך ומסיבי דורש כושר חתירה גבוה ומעבר קשה דרך הקצפים (Duck Dive)' };
      case 'beg_softboard':
        return { score: 50, reason: 'סופטבורד מתחילים רחב בעל חרבות גמישות יתקשה להיכנס לגלים גבוהים ותלולים ואינו מספק אחיזה במהירות גבוהה' };
      default:
        return { score: 85 };
    }
  }

  // Big / Heavy Waves (> 1.8m)
  switch (category) {
    case 'shortboard':
    case 'hpsb':
      return { score: 100 };
    case 'hybrid':
    case 'midlength':
      return { score: 70, reason: 'בגלים עוצמתיים וגבוהים דרוש רוקר גבוה וזנב צר יותר לשליטה במהירות' };
    case 'perf_softboard':
      return { score: 50, reason: 'גלים גבוהים ועוצמתיים מאוד מאתגרים את מבנה הסופטבורד ומגבילים ביצועים' };
    case 'fish':
    case 'funboard':
      return { score: 50, reason: 'בגלים גבוהים מאוד, גלשן רחב ושטוח עלול להחליק או לסחרר בפניות מהירות' };
    case 'longboard':
    case 'minimal':
      return { score: 45, reason: 'בגלים גבוהים ועוצמתיים, לונגבורד מתקשה לעבור את הקצפים בחזרה לים ותופס רוח' };
    case 'beg_softboard':
      return { score: 30, reason: 'ים גבוה ועוצמתי מדי לסופטבורד מתחילים - סכנת בטיחות ואובדן שליטה בגל' };
    default:
      return { score: 60 };
  }
};

export const calculateMatchScoreDetails = (
  currentVol: number,
  currentLenStr: string,
  recVol: number,
  recLenInches: number,
  currentBoardType?: string,
  waveHeight?: number,
  surfingLevel?: SurfingLevel
): MatchScoreDetails => {
  const { feet, inches } = parseLength(currentLenStr);
  const currLenInches = feet * 12 + inches;
  
  const volDiff = currentVol - recVol;
  // If we have more volume, penalty is smaller. If less, penalty is larger.
  const volPenalty = volDiff >= 0 ? volDiff * 1 : Math.abs(volDiff) * 3;
  const volScore = Math.max(0, 100 - volPenalty);
  
  // Length penalty
  const lenDiff = Math.abs(currLenInches - recLenInches);
  const lenScore = Math.max(0, 100 - (lenDiff * 2));
  
  if (currentBoardType && waveHeight !== undefined) {
    const { score: typeScore, reason: typeReason } = calculateTypeCompatibility(currentBoardType, waveHeight, surfingLevel);
    // Weighted model: 40% Volume, 25% Length, 35% Board Type Hydrodynamics & Level Match
    const totalScore = Math.round((volScore * 0.40) + (lenScore * 0.25) + (typeScore * 0.35));
    return {
      totalScore,
      volScore,
      lenScore,
      typeScore,
      typeReason
    };
  }

  // Fallback when board type or wave height isn't available: 65% Volume, 35% Length
  const totalScore = Math.round((volScore * 0.65) + (lenScore * 0.35));
  return {
    totalScore,
    volScore,
    lenScore
  };
};
