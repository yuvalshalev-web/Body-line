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
 * Parses a date input (string, Date, Timestamp, number) into a Date object.
 */
export const parseDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : new Date(dateInput);
  }
  
  if (typeof dateInput === 'object' && typeof dateInput.toDate === 'function') {
    const d = dateInput.toDate();
    return isNaN(d.getTime()) ? null : d;
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
