
/**
 * PBKDF2 Configuration
 * OWASP current recommendation for PBKDF2-HMAC-SHA256 is 600,000 iterations.
 * This provides high resistance to brute-force and hardware-accelerated cracking attacks,
 * in compliance with GDPR Art. 32 (security of processing) and ENISA guidelines.
 */
const PBKDF2_ITERATIONS = 600000;
const SALT_SIZE = 16;
const KEY_SIZE = 32; // 256 bits

/**
 * Generates a random salt.
 */
export const generateSalt = (): string => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Helper to perform the subtle crypto PBKDF2 derivation.
 */
const hashPasswordInternal = async (password: string, saltHex: string, iterations: number): Promise<string> => {
  const saltUint8 = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const passwordUint8 = new TextEncoder().encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordUint8,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltUint8,
      iterations: iterations,
      hash: 'SHA-256'
    },
    baseKey,
    KEY_SIZE * 8
  );

  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Hashes a password using PBKDF2 with a salt.
 * Returns a string in the GDPR-compliant format: "pbkdf2:iterations:salt:hash"
 */
export const hashPassword = async (password: string, providedSalt?: string): Promise<string> => {
  const saltHex = providedSalt || generateSalt();
  const hashHex = await hashPasswordInternal(password, saltHex, PBKDF2_ITERATIONS);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
};

/**
 * Verifies a password against a stored hash.
 * Supports backward compatibility for:
 * 1. "pbkdf2:iterations:salt:hash" (Standard)
 * 2. "salt:hash" (Legacy 100k iterations)
 * 3. Raw SHA-256 hashes (Old non-salted fallback)
 */
export const verifyPassword = async (password: string, storedValue: string): Promise<boolean> => {
  if (!storedValue.includes(':')) {
    // Fallback for old SHA-256 hashes (no salt)
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const oldHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return oldHashHex === storedValue;
  }

  const parts = storedValue.split(':');
  
  if (parts.length === 4 && parts[0] === 'pbkdf2') {
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const hash = parts[3];
    const calculatedHash = await hashPasswordInternal(password, salt, iterations);
    return calculatedHash === hash;
  } else {
    // Legacy salt:hash with 100,000 iterations
    const [salt, hash] = parts;
    const calculatedHash = await hashPasswordInternal(password, salt, 100000);
    return calculatedHash === hash;
  }
};

/**
 * Generates a secure deterministic Firebase Auth password for a given email.
 * This acts as a reliable bridging credential to prevent Firebase Auth out-of-sync password issues,
 * particularly in environments where administrative password resets from the server are constrained.
 */
export const calculateFbPassword = async (email: string): Promise<string> => {
  const normalizedEmail = email.toLowerCase().trim();
  const secretSalt = "GoSurfClubSecureSalt2026!"; // Unique salt for the application
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedEmail + secretSalt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Meets all strength requirements: contains uppercase (via Gs_), lowercase, digits, special characters, and length > 6
  return "Gs_" + hex.substring(0, 16) + "1!";
};

