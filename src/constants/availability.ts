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
    label: 'זמין תמיד ליצירת קשר',
    enLabel: 'Always Available for Contact',
    description: 'ניתן ליצור איתי קשר בכל ימות השבוע, כולל סופי שבוע וחגים',
    badgeLabel: 'זמין תמיד'
  },
  {
    id: 'no_shabbat_holidays',
    label: 'שומר שבת (ללא יצירת קשר בשבתות וחגים)',
    enLabel: 'Shabbat Observer (No Contact on Shabbat & Holidays)',
    description: 'נא לא ליצור קשר בהודעות או שיחות בשבתות ובמועדי ישראל',
    badgeLabel: 'שומר שבת וחג'
  },
  {
    id: 'weekdays_only',
    label: 'זמין בימי חול בלבד (א\' - ה\')',
    enLabel: 'Weekdays Only (Sun - Thu)',
    description: 'ניתן ליצור קשר בימי ראשון עד חמישי בלבד (ללא סופי שבוע)',
    badgeLabel: 'ימי חול בלבד (א\'-ה\')'
  }
];

export interface AvailabilityBadgeInfo {
  id: AvailabilitySchedule;
  badgeLabel: string;
  fullLabel: string;
  shortDesc: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
}

export const getAvailabilityBadgeInfo = (id?: string): AvailabilityBadgeInfo => {
  if (id === 'no_shabbat_holidays' || (typeof id === 'string' && id.includes('שבת'))) {
    return {
      id: 'no_shabbat_holidays',
      badgeLabel: 'שומר שבת וחג',
      fullLabel: 'שומר שבת (ללא יצירת קשר בשבתות וחגים)',
      shortDesc: 'נא לא ליצור קשר בשבתות ובמועדים',
      bgClass: 'bg-amber-50/90',
      borderClass: 'border-amber-200/80',
      textClass: 'text-amber-900',
      dotClass: 'bg-amber-500'
    };
  }
  if (id === 'weekdays_only' || (typeof id === 'string' && id.includes('חול'))) {
    return {
      id: 'weekdays_only',
      badgeLabel: 'ימי חול (א׳-ה׳)',
      fullLabel: 'זמין בימי חול בלבד (א\' - ה\')',
      shortDesc: 'יצירת קשר בימי ראשון עד חמישי בלבד',
      bgClass: 'bg-sky-50/90',
      borderClass: 'border-sky-200/80',
      textClass: 'text-sky-900',
      dotClass: 'bg-sky-500'
    };
  }
  return {
    id: 'always',
    badgeLabel: 'זמין תמיד לקשר',
    fullLabel: 'זמין תמיד ליצירת קשר',
    shortDesc: 'ניתן ליצור קשר בכל ימות השבוע',
    bgClass: 'bg-emerald-50/90',
    borderClass: 'border-emerald-200/80',
    textClass: 'text-emerald-900',
    dotClass: 'bg-emerald-500'
  };
};

export const getAvailabilityLabel = (id?: string): string => {
  return getAvailabilityBadgeInfo(id).fullLabel;
};
