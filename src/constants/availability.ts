export type AvailabilitySchedule = 'always' | 'no_shabbat_holidays' | 'weekdays_only';

export interface AvailabilityOption {
  id: AvailabilitySchedule;
  label: string;
  enLabel: string;
  description: string;
  badgeLabel: string;
}

export const AVAILABILITY_SCHEDULE_OPTIONS: AvailabilityOption[] = [
  {
    id: 'always',
    label: 'זמין תמיד',
    enLabel: 'Always Available',
    description: 'זמין לפעילויות בכל ימות השבוע, כולל סופי שבוע וחגים',
    badgeLabel: 'זמין תמיד'
  },
  {
    id: 'no_shabbat_holidays',
    label: 'לא זמין בשבתות וחגים',
    enLabel: 'Not Available on Shabbat & Holidays',
    description: 'ללא פעילות בשבתות ובמועדי ישראל',
    badgeLabel: 'ללא שבתות וחגים'
  },
  {
    id: 'weekdays_only',
    label: '(א\' - ה\') זמין בימי חול בלבד',
    enLabel: 'Weekdays Only (Sun - Thu)',
    description: 'פעילות מוגבלת לימי ראשון עד חמישי בלבד',
    badgeLabel: 'ימי חול בלבד (א\'-ה\')'
  }
];

export const getAvailabilityLabel = (id?: string): string => {
  if (!id) return 'זמין תמיד';
  const found = AVAILABILITY_SCHEDULE_OPTIONS.find(o => o.id === id);
  if (found) return found.label;
  
  // Backward compatibility check if custom strings are stored
  if (id === 'no_shabbat_holidays' || id.includes('שבת')) return 'לא זמין בשבתות וחגים';
  if (id === 'weekdays_only' || id.includes('חול')) return '(א\' - ה\') זמין בימי חול בלבד';
  return 'זמין תמיד';
};
