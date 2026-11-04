import { AvailabilitySchedule } from '../constants/availability';

export interface ContactSensitivityCheck {
  isSensitive: boolean;
  reason?: 'shabbat' | 'weekend';
  title: string;
  message: string;
  badgeText: string;
  badgeColor: 'amber' | 'sky';
}

/**
 * Checks if contacting a member right now falls during their unavailable communication window.
 * 
 * - 'no_shabbat_holidays': Friday from 14:00 through Saturday 20:30.
 * - 'weekdays_only': Friday all day (00:00 - 23:59) and Saturday all day (00:00 - 23:59).
 * - 'always': Never sensitive.
 */
export const checkContactTimingSensitivity = (
  schedule?: AvailabilitySchedule | string,
  targetDate: Date = new Date()
): ContactSensitivityCheck => {
  const sched = schedule || 'always';

  if (sched === 'always') {
    return {
      isSensitive: false,
      title: '',
      message: '',
      badgeText: '',
      badgeColor: 'amber'
    };
  }

  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 1. Shabbat check: Friday from 14:00 through Saturday 20:30
  if (sched === 'no_shabbat_holidays' || sched.includes('שבת')) {
    const isFridayShabbatEve = dayOfWeek === 5 && timeInMinutes >= 14 * 60;
    const isSaturdayShabbat = dayOfWeek === 6 && timeInMinutes <= 20 * 60 + 30;

    if (isFridayShabbatEve || isSaturdayShabbat) {
      return {
        isSensitive: true,
        reason: 'shabbat',
        title: 'תזכורת: שומר/ת שבת וחג',
        message: 'החבר/ה ציין/ה בפרופיל שמירת שבת ובקשה שלא ליצור קשר בהודעות או בשיחות בשבתות ובמועדי ישראל.',
        badgeText: 'שומר שבת (ללא יצירת קשר בשבתות וחגים)',
        badgeColor: 'amber'
      };
    }
  }

  // 2. Weekdays Only check: Friday and Saturday all day
  if (sched === 'weekdays_only' || sched.includes('חול')) {
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    if (isWeekend) {
      return {
        isSensitive: true,
        reason: 'weekend',
        title: 'תזכורת: זמינות בימי חול בלבד',
        message: 'החבר/ה ציין/ה בפרופיל זמינות לתקשורת בימי ראשון עד חמישי בלבד (ללא סופי שבוע).',
        badgeText: 'זמין בימי חול בלבד (א׳ - ה׳)',
        badgeColor: 'sky'
      };
    }
  }

  return {
    isSensitive: false,
    title: '',
    message: '',
    badgeText: '',
    badgeColor: 'amber'
  };
};

/**
 * Returns a mock sensitivity check simulating weekend/Shabbat for UI preview/testing purposes.
 */
export const getSimulatedSensitivityCheck = (
  schedule?: AvailabilitySchedule | string
): ContactSensitivityCheck => {
  const sched = schedule || 'always';
  if (sched === 'no_shabbat_holidays' || sched.includes('שבת')) {
    return {
      isSensitive: true,
      reason: 'shabbat',
      title: 'תזכורת: שומר/ת שבת וחג',
      message: 'החבר/ה ציין/ה בפרופיל שמירת שבת ובקשה שלא ליצור קשר בהודעות או בשיחות בשבתות ובמועדי ישראל.',
      badgeText: 'שומר שבת (ללא יצירת קשר בשבתות וחגים)',
      badgeColor: 'amber'
    };
  }
  if (sched === 'weekdays_only' || sched.includes('חול')) {
    return {
      isSensitive: true,
      reason: 'weekend',
      title: 'תזכורת: זמינות בימי חול בלבד',
      message: 'החבר/ה ציין/ה בפרופיל זמינות לתקשורת בימי ראשון עד חמישי בלבד (ללא סופי שבוע).',
      badgeText: 'זמין בימי חול בלבד (א׳ - ה׳)',
      badgeColor: 'sky'
    };
  }
  return {
    isSensitive: false,
    title: '',
    message: '',
    badgeText: '',
    badgeColor: 'amber'
  };
};
