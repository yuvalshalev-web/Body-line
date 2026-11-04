/**
 * Global date utility for the application.
 * Ensures all dates are formatted and parsed consistently as dd/mm/yyyy.
 */

export const formatDate = (date: any): string => {
  if (!date) return '';
  
  let d: Date;
  
  // Handle Firebase Timestamp or serialized object
  if (date && typeof date === 'object') {
    if (typeof date.toDate === 'function') {
      d = date.toDate();
    } else if ('seconds' in date && typeof date.seconds === 'number') {
      d = new Date(date.seconds * 1000 + (date.nanoseconds ? date.nanoseconds / 1000000 : 0));
    } else if ('_seconds' in date && typeof date._seconds === 'number') {
      d = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
  } 
  // Handle Date object
  else if (date instanceof Date) {
    d = date;
  } 
  // Handle string or number
  else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatDateTime = (date: any): string => {
  if (!date) return '';
  
  let d: Date;
  
  // Handle Firebase Timestamp or serialized object
  if (date && typeof date === 'object') {
    if (typeof date.toDate === 'function') {
      d = date.toDate();
    } else if ('seconds' in date && typeof date.seconds === 'number') {
      d = new Date(date.seconds * 1000 + (date.nanoseconds ? date.nanoseconds / 1000000 : 0));
    } else if ('_seconds' in date && typeof date._seconds === 'number') {
      d = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
  } 
  // Handle Date object
  else if (date instanceof Date) {
    d = date;
  } 
  // Handle string or number
  else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Parses a date input (string, Date, Timestamp, number) into a Date object.
 */
export const parseDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : new Date(dateInput);
  }
  
  if (typeof dateInput === 'object') {
    if (typeof dateInput.toDate === 'function') {
      const d = dateInput.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if ('seconds' in dateInput && typeof dateInput.seconds === 'number') {
      const d = new Date(dateInput.seconds * 1000 + (dateInput.nanoseconds ? dateInput.nanoseconds / 1000000 : 0));
      return isNaN(d.getTime()) ? null : d;
    }
    if ('_seconds' in dateInput && typeof dateInput._seconds === 'number') {
      const d = new Date(dateInput._seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  
  return null;
};

/**
 * Returns the current date in dd/mm/yyyy format.
 */
export const getCurrentDateFormatted = (): string => {
  return formatDate(new Date());
};

/**
 * Calculates age from a birthday string, Date object, or Timestamp.
 */
export const calculateAge = (birthday?: any): number | null => {
  if (!birthday) return null;
  
  const birthDate = parseDate(birthday);

  if (!birthDate || isNaN(birthDate.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculates event duration in days from start and optional end date.
 */
export const calculateEventDuration = (startDateStr: string, endDateStr?: string): { days: number; label: string; isMultiDay: boolean } => {
  if (!startDateStr) return { days: 1, label: 'יום אחד', isMultiDay: false };
  if (!endDateStr || endDateStr === startDateStr) return { days: 1, label: 'יום אחד', isMultiDay: false };

  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);

  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { days: 1, label: 'יום אחד', isMultiDay: false };
  }

  // Zero out time components
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diffMs = e.getTime() - s.getTime();
  if (diffMs <= 0) {
    return { days: 1, label: 'יום אחד', isMultiDay: false };
  }

  const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;

  if (days === 2) {
    return { days: 2, label: 'יומיים', isMultiDay: true };
  }
  return { days, label: `${days} ימים`, isMultiDay: true };
};

/**
 * Formats event date range string, e.g. "10/11/2026 – 12/11/2026" or "10/11/2026"
 */
export const formatEventDateRange = (startDateStr: string, endDateStr?: string): string => {
  const startFmt = formatDate(startDateStr);
  if (!startFmt) return '';

  if (!endDateStr || endDateStr === startDateStr) {
    return startFmt;
  }

  const endFmt = formatDate(endDateStr);
  if (!endFmt || endFmt === startFmt) {
    return startFmt;
  }

  return `${startFmt} – ${endFmt}`;
};

/**
 * Determines whether an event is upcoming, ongoing right now, or in the past.
 */
export const getEventStatus = (startDateStr: string, endDateStr?: string): {
  isOngoing: boolean;
  isPast: boolean;
  isUpcoming: boolean;
  dayNumber?: number;
  totalDays: number;
} => {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr || startDateStr);

  const durationInfo = calculateEventDuration(startDateStr, endDateStr);

  if (!start || !end) {
    return { isOngoing: false, isPast: false, isUpcoming: true, totalDays: 1 };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const eTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).getTime();

  if (todayStart > eTime) {
    return { isOngoing: false, isPast: true, isUpcoming: false, totalDays: durationInfo.days };
  }

  if (todayStart < sTime) {
    return { isOngoing: false, isPast: false, isUpcoming: true, totalDays: durationInfo.days };
  }

  // Ongoing event!
  const currentDayNum = Math.floor((todayStart - sTime) / (1000 * 60 * 60 * 24)) + 1;
  return {
    isOngoing: true,
    isPast: false,
    isUpcoming: false,
    dayNumber: Math.min(Math.max(1, currentDayNum), durationInfo.days),
    totalDays: durationInfo.days,
  };
};

