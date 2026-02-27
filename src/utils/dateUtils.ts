/**
 * Global date utility for the application.
 * Ensures all dates are formatted and parsed consistently as dd/mm/yyyy.
 */

export const formatDate = (date: any): string => {
  if (!date) return '';
  
  let d: Date;
  
  // Handle Firebase Timestamp
  if (date && typeof date === 'object' && typeof date.toDate === 'function') {
    d = date.toDate();
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

/**
 * Parses a dd/mm/yyyy string into a Date object.
 */
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
  
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Returns the current date in dd/mm/yyyy format.
 */
export const getCurrentDateFormatted = (): string => {
  return formatDate(new Date());
};
