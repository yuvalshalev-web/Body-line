/**
 * Surfboard Inch Rounding Rule (Grit Engine Standard)
 * Rounds up to the nearest multiple of 10, capped between 10 and 90.
 * Example: 12 -> 20, 44 -> 50, 8 -> 10, 95 -> 90
 */
export const roundToGritStandard = (value: number): number => {
  if (value <= 0) return 10;
  // Round up to the nearest 10
  const rounded = Math.ceil(value / 10) * 10;
  // Clamp between 10 and 90 as per rule: "המידות המותרות לתצוגה הן אך ורק: 10, 20, 30, 40, 50, 60, 70, 80, 90"
  return Math.min(90, Math.max(10, rounded));
};
