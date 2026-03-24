
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

  const volume = Math.round(weight * volMultiplier * fitnessModifier * 10) / 10;
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
  recLenInches: number
) => {
  const { feet, inches } = parseLength(currentLenStr);
  const currLenInches = feet * 12 + inches;
  
  const volDiff = currentVol - recVol;
  // If we have more volume, penalty is smaller. If less, penalty is larger.
  const volPenalty = volDiff >= 0 ? volDiff * 1 : Math.abs(volDiff) * 3;
  const volScore = Math.max(0, 100 - volPenalty);
  
  // Length penalty
  const lenDiff = Math.abs(currLenInches - recLenInches);
  const lenScore = Math.max(0, 100 - (lenDiff * 2));
  
  return Math.round((volScore * 0.7) + (lenScore * 0.3));
};
