
/**
 * PBKDF2 Configuration
 */
const PBKDF2_ITERATIONS = 100000;
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
 * Hashes a password using PBKDF2 with a salt.
 * Returns a string in the format "salt:hash"
 */
export const hashPassword = async (password: string, providedSalt?: string): Promise<string> => {
  const saltHex = providedSalt || generateSalt();
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
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    KEY_SIZE * 8
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${saltHex}:${hashHex}`;
};

/**
 * Verifies a password against a stored hash (format "salt:hash").
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

  const [salt, hash] = storedValue.split(':');
  const newHashWithSalt = await hashPassword(password, salt);
  return newHashWithSalt === storedValue;
};
