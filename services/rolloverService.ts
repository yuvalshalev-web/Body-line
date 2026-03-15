
import { getDb } from '../services/firebase';
import { doc, getDoc, updateDoc, writeBatch, increment, collection, Timestamp, addDoc, getDocs } from 'firebase/firestore';
import { SUPER_ADMIN_EMAIL } from '../constants';

export const getNextSessionDate = (weeklySessions?: any[]) => {
  const now = new Date();
  
  const activeSessions = weeklySessions?.filter(s => s.isActive !== false) || [];
  if (activeSessions.length === 0) {
    // Fallback to next Thursday 07:00
    const resultDate = new Date(now);
    const day = now.getDay();
    let daysToAdd = (4 - day + 7) % 7;
    if (daysToAdd === 0 && (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() >= 0))) {
      daysToAdd = 7;
    }
    resultDate.setDate(now.getDate() + daysToAdd);
    resultDate.setHours(7, 0, 0, 0);
    return resultDate.toISOString();
  }

  // Find the closest next session
  let closestDate: Date | null = null;
  let minDiff = Infinity;

  activeSessions.forEach(session => {
    const { dayOfWeek, time } = session;
    if (time && typeof dayOfWeek === 'number') {
      const [hourStr, minuteStr] = time.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      const candidate = new Date(now);
      const currentDay = now.getDay();
      let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
      
      // If it's the same day, check if the time has passed
      if (daysToAdd === 0) {
        if (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute)) {
          daysToAdd = 7;
        }
      }
      
      candidate.setDate(now.getDate() + daysToAdd);
      candidate.setHours(hour, minute, 0, 0);

      const diff = candidate.getTime() - now.getTime();
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        closestDate = candidate;
      }
    }
  });

  if (closestDate) {
    return (closestDate as Date).toISOString();
  }

  // Fallback
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
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

export const finalizeSession = async (weeklyHistory: any[], yearConfig: { startDate: string; endDate: string } | null, waterTemp?: number, weeklySessions?: any[]) => {
  const db = getDb();
  const sessionRef = doc(db, 'site_data', 'active_session');
  
  try {
    const sessionSnap = await getDoc(sessionRef);
    if (!sessionSnap.exists()) {
      await addRolloverLog('finalizeSession', 'failed', 'Active session not found');
      return;
    }
    
    const data = sessionSnap.data() as any;
    const rawAttendees = data.attendees || [];
    const sessionDateStr = data.date;

    if (!sessionDateStr) {
      await addRolloverLog('finalizeSession', 'failed', 'Session date missing');
      return;
    }

    // Fetch members to filter active ones
    const membersSnap = await getDocs(collection(db, 'members'));
    const members = membersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((m: any) => m.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase());
    
    const activeMemberIds = members
      .filter((m: any) => m.isActive !== false && m.status !== 'suspended' && m.status !== 'left')
      .map((m: any) => m.id);

    const attendees = rawAttendees.filter((id: string) => activeMemberIds.includes(id));
    const sessionDate = new Date(sessionDateStr);

    // Season check
    if (yearConfig) {
      const now = new Date();
      const start = new Date(yearConfig.startDate);
      const end = new Date(yearConfig.endDate);
      if (now < start || now > end) {
        await addRolloverLog('finalizeSession', 'success', 'Skipped: Outside of active season');
        return;
      }
    }

    // Idempotency check / Overwrite existing
    const existingHistoryItem = weeklyHistory.find(d => {
      const dDate = d.date?.toDate ? d.date.toDate() : new Date(d.date);
      return dDate.toDateString() === sessionDate.toDateString();
    });

    const batch = writeBatch(db);
    
    // 1. Update totalAttendance
    let addedAttendees = attendees;
    let removedAttendees: string[] = [];

    if (existingHistoryItem) {
      const oldAttendees = existingHistoryItem.participantIds || [];
      addedAttendees = attendees.filter((id: string) => !oldAttendees.includes(id));
      removedAttendees = oldAttendees.filter((id: string) => !attendees.includes(id));
    }

    if (addedAttendees.length > 0) {
      addedAttendees.forEach((uid: string) => {
        const memberRef = doc(db, 'members', uid);
        batch.update(memberRef, { totalAttendance: increment(1) });
      });
    }
    
    if (removedAttendees.length > 0) {
      removedAttendees.forEach((uid: string) => {
        const memberRef = doc(db, 'members', uid);
        batch.update(memberRef, { totalAttendance: increment(-1) });
      });
    }

    // Determine category based on temp
    let category = 'Transition';
    if (waterTemp !== undefined) {
      if (waterTemp < 20) category = 'Penguin';
      else if (waterTemp > 27) category = 'Clownfish';
    }

    // 2. Create or Update weekly_history entry
    if (existingHistoryItem) {
      const historyRef = doc(db, 'weekly_history', existingHistoryItem.id);
      batch.update(historyRef, {
        participantsCount: attendees.length,
        participantIds: attendees,
        updatedAt: new Date().toISOString(),
        waterTemp: waterTemp || existingHistoryItem.waterTemp || null,
        category: category
      });
    } else {
      const historyRef = doc(collection(db, 'weekly_history'));
      batch.set(historyRef, {
        date: Timestamp.fromDate(sessionDate),
        participantsCount: attendees.length,
        participantIds: attendees,
        timestamp: new Date().toISOString(),
        instructorName: 'מדריך חבל זוג',
        waterTemp: waterTemp || null,
        category: category
      });
    }

    // 3. Reset active session
    const nextSessionDate = getNextSessionDate(weeklySessions);
    batch.set(sessionRef, {
      attendees: [],
      date: nextSessionDate
    }, { merge: true });

    await batch.commit();
    await addRolloverLog('finalizeSession', 'success', `Archived session with ${attendees.length} attendees. Temp: ${waterTemp}°C, Category: ${category}`, attendees.length);
  } catch (error: any) {
    console.error("Finalize session error:", error);
    await addRolloverLog('finalizeSession', 'failed', error.message);
    throw error;
  }
};
