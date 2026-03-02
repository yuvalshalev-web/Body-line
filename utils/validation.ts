
export interface PasswordRequirements {
  length: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export const validatePassword = (password: string): PasswordRequirements => {
  return {
    length: password.length >= 6,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

export const isPasswordValid = (requirements: PasswordRequirements): boolean => {
  return Object.values(requirements).every(Boolean);
};

/**
 * Validates Israeli mobile numbers
 * Supports formats: 05X-XXXXXXX, 05XXXXXXXX, +972-5X-XXXXXXX
 */
export const validateMobileNumber = (mobile: string): boolean => {
  const cleanMobile = mobile.replace(/\D/g, '');
  // Israeli mobile numbers are 10 digits starting with 05 or 12 digits starting with 9725
  const mobileRegex = /^(05\d{8}|9725\d{8})$/;
  return mobileRegex.test(cleanMobile);
};

/**
 * Formats a string into an Israeli mobile number format: 05X-XXXXXXX
 */
export const formatMobileNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  let formatted = digits;
  if (digits.length > 3) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return formatted;
};
