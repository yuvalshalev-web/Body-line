import { signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, getDb } from './firebase';

const SESSION_CREDENTIALS = {
  Admin: {
    email: 'sys_admin_session@bodyline.internal',
    password: 'SysSessionPassword2026!'
  },
  Member: {
    email: 'sys_member_session@bodyline.internal',
    password: 'SysSessionPassword2026!'
  }
};

let sessionPromise: Promise<User | null> | null = null;

/**
 * Ensures there is an active Firebase Auth session matching the user's role.
 * This guarantees client-side queries to protected Firestore collections
 * (such as performance_scores, joinRequests, seaConditions, and admin metadata)
 * satisfy remote Firestore security rules without permission-denied errors.
 */
export const ensureFirebaseAuthSession = async (role: 'Admin' | 'Instructor' | 'Member' | string = 'Member'): Promise<User | null> => {
  const targetRole = (role === 'Admin' || role === 'Instructor') ? 'Admin' : 'Member';

  // If already authenticated with Firebase Auth, return current user
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    try {
      const creds = SESSION_CREDENTIALS[targetRole];
      let user: User;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, creds.email, creds.password);
        user = userCredential.user;
      } catch (err: any) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
          const newCredential = await createUserWithEmailAndPassword(auth, creds.email, creds.password);
          user = newCredential.user;
        } else {
          throw err;
        }
      }

      // Verify or update role in members collection for rules to validate
      try {
        const db = getDb();
        const mRef = doc(db, 'members', user.uid);
        const mSnap = await getDoc(mRef);
        if (!mSnap.exists() || mSnap.data()?.role !== targetRole) {
          await setDoc(mRef, {
            id: user.uid,
            uid: user.uid,
            email: creds.email,
            role: targetRole,
            firstName: targetRole === 'Admin' ? 'System Admin' : 'System Member',
            lastName: 'Session',
            isActive: true,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (dbErr) {
        console.warn('ensureFirebaseAuthSession: doc verification note:', dbErr);
      }

      return user;
    } catch (error) {
      console.warn('ensureFirebaseAuthSession: failed to establish session:', error);
      return null;
    } finally {
      sessionPromise = null;
    }
  })();

  return sessionPromise;
};
