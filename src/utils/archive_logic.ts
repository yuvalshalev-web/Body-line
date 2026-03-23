import { collection, writeBatch, doc, getDocs, deleteDoc, Timestamp, setDoc } from 'firebase/firestore';
import { getDb } from '../services/firebase';
import { Member, GlossaryTerm, Exercise, QuoteItem } from '../types';
import { hashPassword } from './crypto';
import { getCurrentDateFormatted } from './dateUtils';

/**
 * ARCHIVE LOGIC
 * This file contains legacy maintenance, seeding, and batch operations 
 * that are no longer part of the daily active codebase but are kept for reference.
 */

export const updateHistoricalSeaTemperatures = async () => {
  const db = getDb();
  const snapshot = await getDocs(collection(db, 'seaConditions'));
  let count = 0;
  
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => {
    const data = d.data();
    if (data.waterTemp && typeof data.waterTemp === 'string') {
      batch.update(d.ref, { waterTemp: parseFloat(data.waterTemp) });
      count++;
    }
  });
  
  if (count > 0) await batch.commit();
  return count;
};

export const batchAddGlossary = async (items: Omit<GlossaryTerm, 'id'>[]) => {
  const db = getDb();
  const batch = writeBatch(db);
  items.forEach(item => {
    const ref = doc(collection(db, 'glossary'));
    batch.set(ref, item);
  });
  await batch.commit();
};

export const batchAddExercises = async (items: Omit<Exercise, 'id'>[]) => {
  const db = getDb();
  const batch = writeBatch(db);
  items.forEach(item => {
    const ref = doc(collection(db, 'exercises'));
    batch.set(ref, item);
  });
  await batch.commit();
};

export const batchAddQuotes = async (items: Omit<QuoteItem, 'id'>[]) => {
  const db = getDb();
  const batch = writeBatch(db);
  items.forEach(item => {
    const ref = doc(collection(db, 'quotes'));
    batch.set(ref, item);
  });
  await batch.commit();
};

export const batchAddMembers = async (items: any[]) => {
  const db = getDb();
  const batch = writeBatch(db);
  for (const item of items) {
    const ref = doc(collection(db, 'members'));
    const hashedPassword = await hashPassword(item.password || '123456');
    batch.set(ref, {
      ...item,
      password: hashedPassword,
      joinedAt: item.joinedAt || getCurrentDateFormatted(),
      isActive: item.isActive !== undefined ? item.isActive : true,
      loginCount: 0,
      totalAttendance: 0
    });
  }
  await batch.commit();
};

export const batchAddHistory = async (items: any[]) => {
  const db = getDb();
  const batch = writeBatch(db);
  items.forEach(item => {
    const ref = doc(collection(db, 'weekly_history'));
    batch.set(ref, item);
  });
  await batch.commit();
};

export const clearCollection = async (collectionName: string) => {
  const db = getDb();
  const snapshot = await getDocs(collection(db, collectionName));
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
};

export const seedPerformanceData = async (members: Member[]) => {
  const db = getDb();
  const months = ['2024-01', '2024-02', '2024-03'];
  const batch = writeBatch(db);
  
  for (const member of members) {
    for (const month of months) {
      const scoreRef = doc(collection(db, 'performance_scores'));
      batch.set(scoreRef, {
        memberId: member.id,
        month,
        gritScore: Math.floor(Math.random() * 40) + 60,
        attendanceRate: Math.floor(Math.random() * 30) + 70,
        improvement: Math.floor(Math.random() * 10),
        updatedAt: Timestamp.now()
      });
    }
  }
  await batch.commit();
};

export const seedInitialAdmin = async (superAdminEmail: string) => {
  const db = getDb();
  const membersSnap = await getDocs(collection(db, 'members'));
  if (membersSnap.empty) {
    const tempPass = 'admin123';
    const hashedPassword = await hashPassword(tempPass);
    await setDoc(doc(collection(db, 'members')), {
      firstName: 'Admin',
      lastName: 'System',
      email: superAdminEmail,
      role: 'Admin',
      isActive: true,
      password: hashedPassword,
      isTemporary: true,
      joinedAt: getCurrentDateFormatted(),
      loginCount: 0,
      totalAttendance: 0
    });
    return true;
  }
  return false;
};

/**
 * LEGACY: Sync User Stats
 * This was used to migrate legacy member IDs and recalculate attendance.
 */
export const syncUserStatsLegacy = async () => {
  try {
    const db = getDb();
    const membersSnapshot = await getDocs(collection(db, 'members'));
    const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
    
    const emailMap = new Map<string, Member[]>();
    members.forEach(m => {
      if (m.email) {
        const email = m.email.toLowerCase().trim();
        if (!emailMap.has(email)) emailMap.set(email, []);
        emailMap.get(email)!.push(m);
      }
    });
    
    const migrations: { oldId: string, newId: string }[] = [];
    for (const [email, userDocs] of emailMap.entries()) {
      if (userDocs.length > 1) {
        const newDoc = userDocs.find(d => d.id === d.uid);
        if (newDoc) {
          const legacyDocs = userDocs.filter(d => d.id !== d.uid);
          for (const legacy of legacyDocs) {
            migrations.push({ oldId: legacy.id, newId: newDoc.id });
          }
        }
      }
    }
    
    const historySnapshot = await getDocs(collection(db, 'weekly_history'));
    const historyDocs = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    for (const session of historyDocs) {
      let changed = false;
      const participantIds = [...(session.participantIds || [])];
      for (let i = 0; i < participantIds.length; i++) {
        const migration = migrations.find(m => m.oldId === participantIds[i]);
        if (migration) {
          participantIds[i] = migration.newId;
          changed = true;
        }
      }
      if (changed) {
        const uniqueIds = Array.from(new Set(participantIds));
        batch.update(doc(db, 'weekly_history', session.id), {
          participantIds: uniqueIds,
          participantsCount: uniqueIds.length
        });
        updateCount++;
      }
    }
    
    for (const migration of migrations) {
      batch.delete(doc(db, 'members', migration.oldId));
      updateCount++;
    }
    
    if (updateCount > 0) await batch.commit();
    
    const finalHistorySnapshot = await getDocs(collection(db, 'weekly_history'));
    const finalHistoryDocs = finalHistorySnapshot.docs.map(doc => doc.data());
    const attendanceMap = new Map<string, number>();
    finalHistoryDocs.forEach(session => {
      const participantIds = session.participantIds || [];
      participantIds.forEach((uid: string) => {
        attendanceMap.set(uid, (attendanceMap.get(uid) || 0) + 1);
      });
    });
    
    const finalBatch = writeBatch(db);
    let finalUpdateCount = 0;
    const finalMembersSnapshot = await getDocs(collection(db, 'members'));
    finalMembersSnapshot.docs.forEach(memberDoc => {
      const uid = memberDoc.id;
      const currentAttendance = memberDoc.data().totalAttendance || 0;
      const calculatedAttendance = attendanceMap.get(uid) || 0;
      if (currentAttendance !== calculatedAttendance) {
        finalBatch.update(doc(db, 'members', uid), { totalAttendance: calculatedAttendance });
        finalUpdateCount++;
      }
    });
    
    if (finalUpdateCount > 0) await finalBatch.commit();
    return { success: true, updatedCount: updateCount + finalUpdateCount };
  } catch (error: any) {
    console.error('Error syncing user stats:', error);
    return { success: false, error: error.message };
  }
};
