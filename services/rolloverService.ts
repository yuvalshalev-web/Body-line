
import { getDb } from '../services/firebase';
import { doc, getDoc, updateDoc, writeBatch, increment, collection, Timestamp, addDoc } from 'firebase/firestore';

export const getNextThursday = () => {
  const now = new Date();
  const resultDate = new Date(now);
  const day = now.getDay();
  let daysToAdd = (4 - day + 7) % 7;
  if (daysToAdd === 0 && (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() >= 0))) {
    daysToAdd = 7;
  }
  resultDate.setDate(now.getDate() + daysToAdd);
  resultDate.setHours(7, 0, 0, 0);
  return resultDate.toISOString();
};

export const addRolloverLog = async (action: string, status: 'success' | 'failed', details: string, updatedMembersCount?: number) => {
  const db = getDb();
  await addDoc(collection(db, 'rollover_logs'), {
    action,
    status,
    details,
    updatedMembersCount,
    timestamp: new Date().toISOString()
  });
};

export const finalizeThursdaySession = async (weeklyHistory: any[], yearConfig: { startDate: string; endDate: string } | null) => {
  const db = getDb();
  const sessionRef = doc(db, 'site_data', 'active_session');
  
  try {
    const sessionSnap = await getDoc(sessionRef);
    if (!sessionSnap.exists()) {
      await addRolloverLog('finalizeThursdaySession', 'failed', 'Active session not found');
      return;
    }
    
    const data = sessionSnap.data() as any;
    const attendees = data.attendees || [];
    const sessionDateStr = data.date;

    if (!sessionDateStr) {
      await addRolloverLog('finalizeThursdaySession', 'failed', 'Session date missing');
      return;
    }
    const sessionDate = new Date(sessionDateStr);

    // Season check
    if (yearConfig) {
      const now = new Date();
      const start = new Date(yearConfig.startDate);
      const end = new Date(yearConfig.endDate);
      if (now < start || now > end) {
        await addRolloverLog('finalizeThursdaySession', 'success', 'Skipped: Outside of active season');
        return;
      }
    }

    // Idempotency check
    const alreadyExists = weeklyHistory.some(d => {
      const dDate = d.date?.toDate ? d.date.toDate() : new Date(d.date);
      return dDate.toDateString() === sessionDate.toDateString();
    });

    if (alreadyExists) {
      await addRolloverLog('finalizeThursdaySession', 'success', 'Session already archived (idempotent)');
      const nextThurs = getNextThursday();
      await updateDoc(sessionRef, { attendees: [], date: nextThurs });
      return;
    }

    if (attendees.length === 0) {
      await addRolloverLog('finalizeThursdaySession', 'success', 'No attendees, resetting session');
      const nextThurs = getNextThursday();
      await updateDoc(sessionRef, { attendees: [], date: nextThurs });
      return;
    }

    const batch = writeBatch(db);
    
    // 1. Update totalAttendance
    attendees.forEach((uid: string) => {
      const memberRef = doc(db, 'members', uid);
      batch.update(memberRef, { totalAttendance: increment(1) });
    });

    // 2. Create weekly_history entry
    const historyRef = doc(collection(db, 'weekly_history'));
    batch.set(historyRef, {
      date: Timestamp.fromDate(sessionDate),
      participantsCount: attendees.length,
      participantIds: attendees,
      timestamp: new Date().toISOString(),
      instructorName: 'מדריך חבל זוג'
    });

    // 3. Reset active session
    const nextThurs = getNextThursday();
    batch.update(sessionRef, {
      attendees: [],
      date: nextThurs
    });

    await batch.commit();
    await addRolloverLog('finalizeThursdaySession', 'success', `Archived session with ${attendees.length} attendees`, attendees.length);
  } catch (error: any) {
    console.error("Finalize session error:", error);
    await addRolloverLog('finalizeThursdaySession', 'failed', error.message);
    throw error;
  }
};
