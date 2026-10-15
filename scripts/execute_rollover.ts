import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  getDocs, 
  doc, 
  collection, 
  writeBatch,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runOrderlyRollover() {
  console.log('--- Starting Orderly Rollover ---');
  
  // 1. Fetch current groups, members, memberships
  const groupsSnap = await getDocs(collection(db, 'community_groups'));
  const membersSnap = await getDocs(collection(db, 'members'));
  const membershipsSnap = await getDocs(collection(db, 'group_memberships'));
  
  console.log(`Current state: ${groupsSnap.size} groups, ${membersSnap.size} members, ${membershipsSnap.size} memberships`);

  const batch = writeBatch(db);

  // 2. Ensure Alumni Group exists
  const alumniGroupId = 'group_alumni';
  const alumniGroupRef = doc(db, 'community_groups', alumniGroupId);
  batch.set(alumniGroupRef, {
    id: alumniGroupId,
    name: 'קבוצת בוגרים',
    type: 'alumni',
    isActive: true,
    isCurrentCohort: false,
    description: 'קבוצת הבוגרים והמתנדבים שסיימו מחזורי פעילות קודמים (מחזור ו׳ ומחזורים קודמים)',
    createdAt: new Date().toISOString()
  }, { merge: true });

  // 3. Close "מחזור ו׳" (Completed / Past Cohort)
  const cohortVavId = 'cohort_vav';
  const cohortVavRef = doc(db, 'community_groups', cohortVavId);
  batch.set(cohortVavRef, {
    id: cohortVavId,
    name: 'מחזור ו׳',
    type: 'cohort',
    isActive: false,
    isCurrentCohort: false,
    startDate: '2025-09-01',
    endDate: '2026-07-31',
    description: 'שנת חבל זוג שהסתיימה - מחזור ו׳',
    completedAt: '2026-07-31T23:59:59.000Z',
    createdAt: '2025-09-01T00:00:00.000Z'
  });

  // 4. Open and activate "מחזור ז׳" (Current Cohort: 17/09/2026 - 31/07/2027)
  const cohortZayinId = 'cohort_active';
  const cohortZayinRef = doc(db, 'community_groups', cohortZayinId);
  batch.set(cohortZayinRef, {
    id: cohortZayinId,
    name: 'מחזור ז׳',
    type: 'cohort',
    isActive: true,
    isCurrentCohort: true,
    startDate: '2026-09-17',
    endDate: '2027-07-31',
    description: 'מחזור פעיל - שנת חבל זוג (מחזור ז׳)',
    createdAt: new Date().toISOString()
  });

  // 5. Update site_data/year_config
  const yearConfigRef = doc(db, 'site_data', 'year_config');
  batch.set(yearConfigRef, {
    name: 'מחזור ז׳',
    startDate: '2026-09-17',
    endDate: '2027-07-31',
    activityMode: 'קבוצתית'
  }, { merge: true });

  // 6. Delete old/obsolete group_memberships if any exist to re-seed clean and accurate memberships
  for (const mDoc of membershipsSnap.docs) {
    batch.delete(doc(db, 'group_memberships', mDoc.id));
  }

  // 7. Process all members:
  // - Participants (Member role): Completed in מחזור ו׳, Graduated to קבוצת בוגרים!
  // - Volunteers (Volunteer role): Completed in מחזור ו׳, Graduated to קבוצת בוגרים! (Can also volunteer in מחזור ז׳)
  // - Staff / Instructors / Admins: Carried over as active in both / new cohort מחזור ז׳!
  membersSnap.forEach(mDoc => {
    const mem = mDoc.data();
    const personId = mDoc.id;

    if (mem.role === 'Member') {
      // 1) Membership in completed cohort מחזור ו׳
      const vavMemRef = doc(collection(db, 'group_memberships'));
      batch.set(vavMemRef, {
        personId,
        groupId: cohortVavId,
        role: 'participant',
        status: 'completed',
        joinedAt: '2025-09-01T00:00:00.000Z',
        completedAt: '2026-07-31T23:59:59.000Z',
        notes: 'השלים בהצלחה את שנת חבל זוג - מחזור ו׳'
      });

      // 2) Membership in Alumni Group
      const alumniMemRef = doc(collection(db, 'group_memberships'));
      batch.set(alumniMemRef, {
        personId,
        groupId: alumniGroupId,
        role: 'participant',
        status: 'graduated',
        joinedAt: '2026-08-01T00:00:00.000Z',
        notes: 'בוגר מחזור ו׳'
      });
    } else if (mem.role === 'Volunteer') {
      // 1) Membership in completed cohort מחזור ו׳
      const vavMemRef = doc(collection(db, 'group_memberships'));
      batch.set(vavMemRef, {
        personId,
        groupId: cohortVavId,
        role: 'volunteer',
        status: 'completed',
        joinedAt: '2025-09-01T00:00:00.000Z',
        completedAt: '2026-07-31T23:59:59.000Z',
        notes: 'התנדב והשלים בהצלחה את שנת חבל זוג - מחזור ו׳'
      });

      // 2) Membership in Alumni Group
      const alumniMemRef = doc(collection(db, 'group_memberships'));
      batch.set(alumniMemRef, {
        personId,
        groupId: alumniGroupId,
        role: 'volunteer',
        status: 'graduated',
        joinedAt: '2026-08-01T00:00:00.000Z',
        notes: 'בוגר מתנדב מחזור ו׳'
      });
    } else {
      // Staff, Instructors, Admins, Support:
      const mappedRole = mem.role === 'Instructor' 
        ? 'instructor' 
        : (mem.role === 'Admin' ? 'coordinator' : 'staff');

      // 1) History in מחזור ו׳
      const vavMemRef = doc(collection(db, 'group_memberships'));
      batch.set(vavMemRef, {
        personId,
        groupId: cohortVavId,
        role: mappedRole,
        status: 'completed',
        joinedAt: '2025-09-01T00:00:00.000Z',
        completedAt: '2026-07-31T23:59:59.000Z'
      });

      // 2) Active in new current cohort מחזור ז׳
      const zayinMemRef = doc(collection(db, 'group_memberships'));
      batch.set(zayinMemRef, {
        personId,
        groupId: cohortZayinId,
        role: mappedRole,
        status: 'active',
        joinedAt: '2026-09-17T00:00:00.000Z',
        notes: 'צוות וסגל פעיל - מחזור ז׳'
      });
    }
  });

  await batch.commit();
  console.log('--- Rollover Committed Successfully! ---');
  process.exit(0);
}

runOrderlyRollover().catch(err => {
  console.error('Rollover error:', err);
  process.exit(1);
});
