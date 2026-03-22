import { collection, getDocs, writeBatch, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDb } from '../services/firebase';
import { Member } from '../types';

export const syncUserStats = async () => {
  try {
    const db = getDb();
    
    // 1. Get all members
    const membersSnapshot = await getDocs(collection(db, 'members'));
    const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
    
    // 2. Find duplicate members by email (legacy ID vs new UID)
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
        // Find the one that matches its uid field (the new one)
        const newDoc = userDocs.find(d => d.id === d.uid);
        if (newDoc) {
          // All other docs are legacy
          const legacyDocs = userDocs.filter(d => d.id !== d.uid);
          for (const legacy of legacyDocs) {
            migrations.push({ oldId: legacy.id, newId: newDoc.id });
          }
        }
      }
    }
    
    // 3. Get all weekly history
    const historySnapshot = await getDocs(collection(db, 'weekly_history'));
    const historyDocs = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    // 4. Update history docs with new IDs
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
        // Remove duplicates if any
        const uniqueIds = Array.from(new Set(participantIds));
        batch.update(doc(db, 'weekly_history', session.id), {
          participantIds: uniqueIds,
          participantsCount: uniqueIds.length
        });
        updateCount++;
      }
    }
    
    // 5. Delete legacy member docs
    for (const migration of migrations) {
      batch.delete(doc(db, 'members', migration.oldId));
      updateCount++;
    }
    
    if (updateCount > 0) {
      await batch.commit();
    }
    
    // 6. Recalculate attendance for each user
    const finalHistorySnapshot = await getDocs(collection(db, 'weekly_history'));
    const finalHistoryDocs = finalHistorySnapshot.docs.map(doc => doc.data());
    
    const attendanceMap = new Map<string, number>();
    finalHistoryDocs.forEach(session => {
      const participantIds = session.participantIds || [];
      participantIds.forEach((uid: string) => {
        attendanceMap.set(uid, (attendanceMap.get(uid) || 0) + 1);
      });
    });
    
    // 7. Update members in batches
    const finalBatch = writeBatch(db);
    let finalUpdateCount = 0;
    
    const finalMembersSnapshot = await getDocs(collection(db, 'members'));
    finalMembersSnapshot.docs.forEach(memberDoc => {
      const uid = memberDoc.id;
      const currentAttendance = memberDoc.data().totalAttendance || 0;
      const calculatedAttendance = attendanceMap.get(uid) || 0;
      
      if (currentAttendance !== calculatedAttendance) {
        finalBatch.update(doc(db, 'members', uid), {
          totalAttendance: calculatedAttendance
        });
        finalUpdateCount++;
      }
    });
    
    if (finalUpdateCount > 0) {
      await finalBatch.commit();
    }
    
    return { success: true, updatedCount: updateCount + finalUpdateCount };
  } catch (error: any) {
    console.error('Error syncing user stats:', error);
    return { success: false, error: error.message };
  }
};
