import { safeLocalStorage } from './storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb, trackedUpdateDoc } from '../services/firebase';

export interface BiometricCredential {
  credentialId: string;
  userEmail: string;
  userId: string;
  userName: string;
  createdAt: string;
  deviceLabel?: string;
}

const BIOMETRIC_KEY_PREFIX = 'habal_zug_biometric_';
const BIOMETRIC_USER_MAP_KEY = 'habal_zug_biometric_users';

/**
 * Helper to check if currently running inside an iframe
 */
export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * Check if the current browser/device supports WebAuthn and platform biometrics (TouchID / FaceID / Fingerprint)
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential && !navigator.credentials) {
    return false;
  }
  
  try {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return isAvailable !== false;
    }
    return true;
  } catch (err) {
    console.warn('Biometric check failed:', err);
    return true;
  }
}

/**
 * Helper to convert string / base64 to Uint8Array
 */
function bufferFromBase64(base64: string): Uint8Array {
  const binary = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper to convert Uint8Array / ArrayBuffer to url-safe base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Register a biometric credential for the logged-in user and persist to Firestore database
 */
export async function registerBiometrics(
  userId: string,
  userEmail: string,
  userName: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const isSupported = await isBiometricAvailable();
    if (!isSupported) {
      return { success: false, error: 'המכשיר או הדפדפן אינם תומכים בהזדהות ביומטרית' };
    }

    if (isInIframe()) {
      return {
        success: false,
        error: 'דפדפן תצוגה מקדימה (iFrame) חוסם גישה ישירה לחיישן הביומטרי. יש לפתוח את האפליקציה בטאב חדש או בסמארטפון כדי להפעיל טביעת אצבע / Face ID.'
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userHandle = new TextEncoder().encode(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'חבל זוג - קהילת גולשים',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
      },
      user: {
        id: userHandle,
        name: userEmail,
        displayName: userName || userEmail
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in device authenticator (Fingerprint / Face ID)
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'האימות הביומטרי בוטל על ידי המשתמש' };
    }

    const credentialId = bufferToBase64(credential.rawId);
    const nowIso = new Date().toISOString();
    const deviceName = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') 
      ? 'Apple Touch/Face ID' 
      : navigator.userAgent.includes('Android') 
      ? 'Android Fingerprint / Biometrics' 
      : 'מחשב / מכשיר אישי';

    const bioEntry: BiometricCredential = {
      credentialId,
      userId,
      userEmail: userEmail.toLowerCase().trim(),
      userName,
      createdAt: nowIso,
      deviceLabel: deviceName
    };

    // Save specific credential record in localStorage
    safeLocalStorage.setItem(`${BIOMETRIC_KEY_PREFIX}${userId}`, JSON.stringify(bioEntry));

    // Also update general biometric users lookup map in localStorage
    const existingUsersRaw = safeLocalStorage.getItem(BIOMETRIC_USER_MAP_KEY);
    let usersList: BiometricCredential[] = [];
    if (existingUsersRaw) {
      try {
        usersList = JSON.parse(existingUsersRaw);
      } catch (e) {
        usersList = [];
      }
    }
    // Filter out previous registration for this user
    usersList = usersList.filter(u => u.userId !== userId && u.userEmail !== userEmail.toLowerCase().trim());
    usersList.push(bioEntry);
    safeLocalStorage.setItem(BIOMETRIC_USER_MAP_KEY, JSON.stringify(usersList));

    // Persist permanently in Firestore database under the user document
    try {
      const db = getDb();
      await trackedUpdateDoc(doc(db, 'members', userId), {
        biometricEnabled: true,
        biometricCredentialId: credentialId,
        biometricEnrolledAt: nowIso,
        biometricDevice: deviceName
      });
      console.log(`Biometric enrollment permanently saved to Firestore for user: ${userId}`);
    } catch (firestoreErr) {
      console.warn('Could not save biometricEnabled status to Firestore:', firestoreErr);
      // Even if Firestore update encounters a network hiccup, the local credential was created
    }

    return { success: true, credentialId };
  } catch (err: any) {
    console.error('Biometric registration error:', err);
    if (err.name === 'NotAllowedError') {
      const msg = err.message || '';
      if (msg.includes('publickey-credentials-create') || msg.includes('Permissions Policy') || msg.includes('cross-origin child frames')) {
        return { 
          success: false, 
          error: 'דפדפן תצוגה מקדימה (iFrame) חוסם גישה ישירה לחיישן הביומטרי. יש לפתוח את האפליקציה בחלון/טאב חדש (או להתקין אותה כ-PWA) כדי להפעיל טביעת אצבע / Face ID.' 
        };
      }
      return { success: false, error: 'האימות בוטל או שאין הרשאת גישה לחיישן הביומטרי' };
    }
    if (err.name === 'InvalidStateError') {
      return { success: false, error: 'טביעת האצבע כבר רשומה במערכת עבור מכשיר זה' };
    }
    if (err.message && (err.message.includes('publickey-credentials-create') || err.message.includes('Permissions Policy'))) {
      return { 
        success: false, 
        error: 'דפדפן תצוגה מקדימה (iFrame) חוסם גישה ישירה לחיישן הביומטרי. יש לפתוח את האפליקציה בחלון/טאב חדש (או להתקין אותה כ-PWA) כדי להפעיל טביעת אצבע / Face ID.' 
      };
    }
    return { success: false, error: err.message || 'שגיאה בהפעלת הזדהות ביומטרית' };
  }
}

/**
 * Authenticate via Biometrics (Touch ID / Face ID / Fingerprint)
 */
export async function authenticateWithBiometrics(targetEmail?: string): Promise<{
  success: boolean;
  userEmail?: string;
  userId?: string;
  userName?: string;
  error?: string;
}> {
  try {
    const isSupported = await isBiometricAvailable();
    if (!isSupported) {
      return { success: false, error: 'המכשיר אינו תומך באימות ביומטרי' };
    }

    if (isInIframe()) {
      return {
        success: false,
        error: 'דפדפן תצוגה מקדימה (iFrame) חוסם גישה ישירה לחיישן הביומטרי. יש לפתוח את האפליקציה בטאב חדש כדי להתחבר ביומטרית.'
      };
    }

    // Get registered biometric credentials on this device
    const existingUsersRaw = safeLocalStorage.getItem(BIOMETRIC_USER_MAP_KEY);
    let usersList: BiometricCredential[] = [];
    if (existingUsersRaw) {
      try {
        usersList = JSON.parse(existingUsersRaw);
      } catch (e) {
        usersList = [];
      }
    }

    if (usersList.length === 0) {
      return { 
        success: false, 
        error: 'טרם הוגדרה כניסה ביומטרית במכשיר זה. התחבר רגיל והפעל אותה בהגדרות הפרופיל.' 
      };
    }

    // If specific email requested, find matching credential
    let matchedUser = targetEmail 
      ? usersList.find(u => u.userEmail.toLowerCase() === targetEmail.toLowerCase().trim())
      : usersList[usersList.length - 1]; // default to most recently registered

    if (!matchedUser && targetEmail) {
      // Fallback to the available one if single user on device
      if (usersList.length === 1) {
        matchedUser = usersList[0];
      } else {
        return { 
          success: false, 
          error: `לא נמצאה טביעת אצבע שמורה עבור ${targetEmail}. אנא התחבר עם סיסמה.` 
        };
      }
    }

    if (!matchedUser) {
      return { success: false, error: 'לא נמצאה טביעת אצבע שמורה במכשיר זה' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (matchedUser.credentialId) {
      try {
        allowCredentials.push({
          id: bufferFromBase64(matchedUser.credentialId),
          type: 'public-key',
          transports: ['internal']
        });
      } catch (e) {
        console.warn('Could not parse credentialId buffer:', e);
      }
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      timeout: 60000,
      userVerification: 'required',
      ...(allowCredentials.length > 0 ? { allowCredentials } : {})
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    if (!assertion) {
      return { success: false, error: 'האימות הביומטרי נכשל או בוטל' };
    }

    return {
      success: true,
      userEmail: matchedUser.userEmail,
      userId: matchedUser.userId,
      userName: matchedUser.userName
    };
  } catch (err: any) {
    console.error('Biometric authentication error:', err);
    if (err.name === 'NotAllowedError') {
      const msg = err.message || '';
      if (msg.includes('publickey-credentials-get') || msg.includes('Permissions Policy') || msg.includes('cross-origin child frames')) {
        return { 
          success: false, 
          error: 'דפדפן תצוגה מקדימה (iFrame) חוסם גישה ישירה לחיישן הביומטרי. יש לפתוח את האפליקציה בחלון/טאב חדש כדי להתחבר ביומטרית.' 
        };
      }
      return { success: false, error: 'הזיהוי הביומטרי בוטל' };
    }
    if (err.message && (err.message.includes('publickey-credentials') || err.message.includes('Permissions Policy'))) {
      return { 
        success: false, 
        error: 'דפדפן תצוגה מקדימה (iFrame) חוסם גישה ישירה לחיישן הביומטרי. יש לפתוח את האפליקציה בחלון/טאב חדש כדי להתחבר ביומטרית.' 
      };
    }
    return { success: false, error: err.message || 'שגיאה בתהליך האימות הביומטרי' };
  }
}

/**
 * Check if a specific user has biometrics enrolled on this device or in their member profile
 */
export function isUserBiometricEnrolled(userId?: string, userEmail?: string, memberData?: { biometricEnabled?: boolean }): boolean {
  if (memberData?.biometricEnabled === false) {
    return false;
  }
  
  if (userId) {
    const specific = safeLocalStorage.getItem(`${BIOMETRIC_KEY_PREFIX}${userId}`);
    if (specific) return true;
  }
  
  const existingUsersRaw = safeLocalStorage.getItem(BIOMETRIC_USER_MAP_KEY);
  if (existingUsersRaw) {
    try {
      const list: BiometricCredential[] = JSON.parse(existingUsersRaw);
      if (userId && list.some(u => u.userId === userId)) return true;
      if (userEmail && list.some(u => u.userEmail.toLowerCase() === userEmail.toLowerCase().trim())) return true;
      if (list.length > 0 && !userId && !userEmail) return true;
    } catch (e) {
      // Continue to memberData check
    }
  }

  if (memberData?.biometricEnabled === true) {
    return true;
  }

  return false;
}

/**
 * Synchronize biometric credentials from user's member document to local storage if needed
 */
export function syncBiometricFromMemberDoc(member: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  biometricEnabled?: boolean;
  biometricCredentialId?: string;
  biometricEnrolledAt?: string;
  biometricDevice?: string;
}): void {
  if (!member || !member.id) return;

  if (member.biometricEnabled === false) {
    // If explicitly disabled in database, clear local storage enrollment
    safeLocalStorage.removeItem(`${BIOMETRIC_KEY_PREFIX}${member.id}`);
    const existingUsersRaw = safeLocalStorage.getItem(BIOMETRIC_USER_MAP_KEY);
    if (existingUsersRaw) {
      try {
        const list: BiometricCredential[] = JSON.parse(existingUsersRaw);
        const filtered = list.filter(u => u.userId !== member.id);
        safeLocalStorage.setItem(BIOMETRIC_USER_MAP_KEY, JSON.stringify(filtered));
      } catch (e) {}
    }
    return;
  }

  if (member.biometricEnabled && member.biometricCredentialId) {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
    const bioEntry: BiometricCredential = {
      credentialId: member.biometricCredentialId,
      userId: member.id,
      userEmail: member.email.toLowerCase().trim(),
      userName: fullName,
      createdAt: member.biometricEnrolledAt || new Date().toISOString(),
      deviceLabel: member.biometricDevice || 'מכשיר אישי'
    };

    safeLocalStorage.setItem(`${BIOMETRIC_KEY_PREFIX}${member.id}`, JSON.stringify(bioEntry));

    const existingUsersRaw = safeLocalStorage.getItem(BIOMETRIC_USER_MAP_KEY);
    let usersList: BiometricCredential[] = [];
    if (existingUsersRaw) {
      try {
        usersList = JSON.parse(existingUsersRaw);
      } catch (e) {
        usersList = [];
      }
    }
    usersList = usersList.filter(u => u.userId !== member.id && u.userEmail !== member.email.toLowerCase().trim());
    usersList.push(bioEntry);
    safeLocalStorage.setItem(BIOMETRIC_USER_MAP_KEY, JSON.stringify(usersList));
  }
}

/**
 * Get all biometric registered users on this device
 */
export function getEnrolledBiometricUsers(): BiometricCredential[] {
  const existingUsersRaw = safeLocalStorage.getItem(BIOMETRIC_USER_MAP_KEY);
  if (!existingUsersRaw) return [];
  try {
    return JSON.parse(existingUsersRaw);
  } catch (e) {
    return [];
  }
}

/**
 * Remove biometrics enrollment for a user locally and in Firestore database
 */
export async function disableBiometrics(userId: string): Promise<void> {
  safeLocalStorage.removeItem(`${BIOMETRIC_KEY_PREFIX}${userId}`);
  const existingUsersRaw = safeLocalStorage.getItem(BIOMETRIC_USER_MAP_KEY);
  if (existingUsersRaw) {
    try {
      const list: BiometricCredential[] = JSON.parse(existingUsersRaw);
      const filtered = list.filter(u => u.userId !== userId);
      safeLocalStorage.setItem(BIOMETRIC_USER_MAP_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Error clearing biometric registry:', e);
    }
  }

  // Update in Firestore database
  try {
    const db = getDb();
    await trackedUpdateDoc(doc(db, 'members', userId), {
      biometricEnabled: false
    });
    console.log(`Biometric disabled in Firestore for user: ${userId}`);
  } catch (firestoreErr) {
    console.warn('Could not update biometricEnabled status in Firestore:', firestoreErr);
  }
}

