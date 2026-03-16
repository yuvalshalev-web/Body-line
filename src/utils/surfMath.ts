
export type SurfingLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type FitnessLevel = 'Low' | 'Average' | 'High' | 'Elite';

export interface SurfboardRecommendation {
  volume: number;
  lengthCm: number;
  lengthInches: number;
  lengthFormatted: string;
  boardType: string;
  boardTypeHebrew: string;
}

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

  switch (level) {
    case 'Beginner':
      volMultiplier = 0.8;
      lengthOffset = 40;
      boardType = 'softboard';
      boardTypeHebrew = 'סופטבורד';
      break;
    case 'Intermediate':
      volMultiplier = 0.55;
      lengthOffset = 15;
      boardType = 'funboard';
      boardTypeHebrew = 'פאנבורד';
      break;
    case 'Advanced':
      volMultiplier = 0.4;
      lengthOffset = 0; // +/- 5cm, using base height
      boardType = 'shortboard';
      boardTypeHebrew = 'שורטבורד';
      break;
  }

  let fitnessModifier = 1.0;
  switch (fitness) {
    case 'Low': fitnessModifier = 1.1; break; // +10% volume
    case 'Average': fitnessModifier = 1.0; break; // baseline
    case 'High': fitnessModifier = 0.95; break; // -5% volume
    case 'Elite': fitnessModifier = 0.9; break; // -10% volume
  }

  const volume = Math.round(weight * volMultiplier * fitnessModifier * 10) / 10;
  const lengthCm = heightCm + lengthOffset;
  const lengthInches = lengthCm / 2.54;
  
  const feet = Math.floor(lengthInches / 12);
  const inches = Math.round(lengthInches % 12);
  const lengthFormatted = `${feet}'${inches}"`;

  return {
    volume,
    lengthCm,
    lengthInches,
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
