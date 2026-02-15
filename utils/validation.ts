
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
