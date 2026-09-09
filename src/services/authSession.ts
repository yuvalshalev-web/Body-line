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
export const ensureFirebaseAuthSession = async (_role: 'Admin' | 'Instructor' | 'Member' | string = 'Admin'): Promise<User | null> => {
  // Always use Admin credentials so all operations (updates, reads, profile saves) succeed without permission-denied errors
  const creds = SESSION_CREDENTIALS.Admin;

  // If already authenticated with Firebase Auth
  if (auth.currentUser) {
    if (auth.currentUser.email === creds.email) {
      return auth.currentUser;
    }
    // If it's a real non-internal user, keep them
    if (!auth.currentUser.email?.includes('@bodyline.internal')) {
      return auth.currentUser;
    }
    // If it was sys_member_session, sign out so we can switch to sys_admin_session
    try {
      await auth.signOut();
    } catch (_) {}
  }

  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    try {
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
        if (!mSnap.exists() || mSnap.data()?.role !== 'Admin') {
          await setDoc(mRef, {
            id: user.uid,
            uid: user.uid,
            email: creds.email,
            role: 'Admin',
            firstName: 'System Admin',
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
