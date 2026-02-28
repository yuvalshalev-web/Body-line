import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, increment, getDoc, getDocs, orderBy, limit, addDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { getDb, trackedGetDocs, setDbStatus, db_status } from '../services/firebase';
import { formatDate, getCurrentDateFormatted } from '../src/utils/dateUtils';
import { Member, JoinRequest, Event, NewsItem, GalleryItem, GlossaryTerm, QuoteItem, Exercise } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { hashPassword } from '../utils/crypto';
import { initializeStorageStats } from '../utils/storageStats';
import { storage } from '../src/utils/storage';
import { useModal } from './ModalContext';

interface DataContextType {
  members: Member[];
  joinRequests: JoinRequest[];
  events: Event[];
  news: NewsItem[];
  galleryItems: GalleryItem[];
  glossary: GlossaryTerm[];
  exercises: Exercise[];
  quotes: QuoteItem[];
  weeklyHistory: any[];
  siteAssets: any;
  yearConfig: { startDate: string; endDate: string } | null;
  attendeeIds: string[];
  activeSessionDate: string;
  isLoading: boolean;
  hasQuotaError: boolean;
  dbStatus: 'ONLINE' | 'OFFLINE';
  toggleDbStatus: () => void;
  updateMember: (member: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  toggleRole: (id: string, requesterEmail?: string) => Promise<void>;
  resetPassword: (id: string) => Promise<void>;
  approveRequest: (id: string) => Promise<{ firstName: string; lastName: string; email: string; mobile: string; tempPassword: string } | null>;
  rejectRequest: (id: string) => Promise<void>;
  addEvent: (details: Omit<Event, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  toggleEventAttendance: (eventId: string, userId: string) => Promise<void>;
  addNews: (details: Omit<NewsItem, 'id'>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  toggleSessionAttendance: (userId: string) => Promise<void>;
  forceResetSession: () => Promise<void>;
  finalizeThursdaySession: () => Promise<void>;
  batchAddGlossary: (items: Omit<GlossaryTerm, 'id'>[]) => Promise<void>;
  batchAddExercises: (items: Omit<Exercise, 'id'>[]) => Promise<void>;
  batchAddQuotes: (items: Omit<QuoteItem, 'id'>[]) => Promise<void>;
  clearCollection: (collectionName: string) => Promise<void>;
  updateSiteAssets: (assets: any) => Promise<void>;
  updateYearConfig: (config: { startDate: string; endDate: string }) => Promise<void>;
  archiveMember: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showAlert } = useModal();
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [siteAssets, setSiteAssets] = useState<any>({});
  const [yearConfig, setYearConfig] = useState<{ startDate: string; endDate: string } | null>(null);
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [activeSessionDate, setActiveSessionDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasQuotaError, setHasQuotaError] = useState(false);
  const [dbStatus, setDbStatusState] = useState<'ONLINE' | 'OFFLINE'>(() => {
    const saved = localStorage.getItem('kill_switch_active');
    return saved === 'true' ? 'OFFLINE' : 'ONLINE';
  });

  const toggleDbStatus = useCallback(() => {
    const newStatus = dbStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setDbStatusState(newStatus);
    setDbStatus(newStatus);
  }, [dbStatus]);

  const getNextThursday = () => {
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

  const handleFirestoreError = useCallback((error: any) => {
    // Ignore transient connection issues or intentional kill switch
    if (error.code === 'unavailable' || error.message === 'QUOTA_EXCEEDED_OR_KILL_SWITCH') {
      if (error.code === 'unavailable') {
        console.warn("Firestore is temporarily unavailable. Operating in offline mode.");
      } else {
        console.warn("Database is OFFLINE (Kill Switch). Blocking request.");
      }
      return;
    }

    console.error("Firestore error:", error);
    if (error.code === 'resource-exhausted' || error.message?.includes('429') || error.message?.includes('quota')) {
      setHasQuotaError(true);
      showAlert("שגיאת מכסה (Quota Exceeded). המערכת עברה למצב לא מקוון זמנית.", "שגיאת מערכת");
    }
  }, [showAlert]);

  useEffect(() => {
    if (db_status !== dbStatus) {
      setDbStatus(dbStatus);
    }

    if (dbStatus === 'OFFLINE') {
      setIsLoading(false);
      return;
    }

    const db = getDb();
    initializeStorageStats();
    
    // 1. Initial Placeholder from Cache (Freshness check: 2 mins)
    const cachedMembers = storage.get('cached_members_v3');
    if (cachedMembers) setMembers(cachedMembers);
    
    const cachedHistory = storage.get('cached_history_v3');
    if (cachedHistory) setWeeklyHistory(cachedHistory);

    // 2. One-time fetches for static-ish data
    const fetchData = async () => {
      try {
        // Glossary & Exercises (with 24h localStorage caching)
        try {
          // Glossary
          const cachedGlossary = storage.get('cached_glossary_v2');
          if (cachedGlossary) {
            setGlossary(cachedGlossary);
          } else {
            const glSnap = await trackedGetDocs(collection(db, 'glossary'));
            const glData = glSnap.docs.map(d => ({ id: d.id, ...d.data() } as GlossaryTerm));
            setGlossary(glData);
            storage.set('cached_glossary_v2', glData, 24);
          }

          // Exercises
          const cachedExercises = storage.get('cached_exercises_v2');
          if (cachedExercises) {
            setExercises(cachedExercises);
          } else {
            const exSnap = await trackedGetDocs(collection(db, 'exercises'));
            const exData = exSnap.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
            setExercises(exData);
            storage.set('cached_exercises_v2', exData, 24);
          }
          
          // Quotes (still one-time fetch, but not cached in localStorage yet as per request)
          const qSnap = await trackedGetDocs(collection(db, 'quotes'));
          setQuotes(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuoteItem)));
        } catch (e: any) {
          if (e.message !== 'QUOTA_EXCEEDED_OR_KILL_SWITCH') throw e;
        }

      } catch (err) {
        handleFirestoreError(err);
      }
    };

    fetchData();

    // 3. Real-time listeners for dynamic data (Background Fetch)
    // Members (with 2-min placeholder cache)
    const unsubMembers = onSnapshot(query(collection(db, 'members'), limit(200)), (snapshot) => {
      const mData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers(mData);
      storage.set('cached_members_v3', mData, 2 / 60); // 2 mins cache
    }, handleFirestoreError);

    // Weekly History (with 2-min placeholder cache)
    const unsubHistory = onSnapshot(query(collection(db, 'weekly_history'), orderBy('date', 'desc'), limit(200)), (snapshot) => {
      const hData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setWeeklyHistory(hData);
      storage.set('cached_history_v3', hData, 2 / 60); // 2 mins cache
    }, handleFirestoreError);

    const unsubRequests = onSnapshot(collection(db, 'joinRequests'), (snapshot) => {
      setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest)));
    }, handleFirestoreError);
    
    const unsubEvents = onSnapshot(query(collection(db, 'events'), orderBy('date', 'desc')), (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    }, handleFirestoreError);
    
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (snapshot) => {
      setNews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
    }, handleFirestoreError);
    
    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
      setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
    }, handleFirestoreError);
    
    const unsubAssets = onSnapshot(doc(db, 'site_data', 'assets'), (doc) => {
      if (doc.exists()) setSiteAssets(doc.data());
    }, handleFirestoreError);

    const unsubYearConfig = onSnapshot(doc(db, 'site_data', 'year_config'), (doc) => {
      if (doc.exists()) setYearConfig(doc.data() as { startDate: string; endDate: string });
    }, handleFirestoreError);

    const timeoutId = setTimeout(() => setIsLoading(false), 4000);

    const unsubAttendees = onSnapshot(doc(db, 'site_data', 'active_session'), async (snapshot) => {
      clearTimeout(timeoutId);
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        const sessionDate = data.date;
        const attendees = data.attendees || [];
        setAttendeeIds(attendees);
        setActiveSessionDate(sessionDate || getNextThursday());
      }
      setIsLoading(false);
    }, handleFirestoreError);

    return () => {
      clearTimeout(timeoutId);
      unsubMembers(); unsubHistory(); unsubRequests(); unsubEvents(); unsubNews(); unsubGallery(); unsubAssets(); unsubYearConfig(); unsubAttendees();
    };
  }, [handleFirestoreError, dbStatus]);

  const updateMember = async (member: Member) => {
    const { id, ...data } = member;
    await updateDoc(doc(getDb(), 'members', id), data);
  };

  const deleteMember = async (id: string) => {
    await deleteDoc(doc(getDb(), 'members', id));
  };

  const toggleStatus = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) await updateDoc(doc(getDb(), 'members', id), { isActive: !member.isActive });
  };

  const toggleRole = async (id: string, requesterEmail?: string) => {
    const member = members.find(m => m.id === id);
    if (member) {
      const isSuperAdmin = requesterEmail === SUPER_ADMIN_EMAIL;
      let nextRole: Member['role'] = 'Member';

      if (isSuperAdmin) {
        // Super Admin: Cycle through all roles
        if (member.role === 'Member') nextRole = 'Instructor';
        else if (member.role === 'Instructor') nextRole = 'Admin';
        else nextRole = 'Member';
      } else {
        // Regular Admin: Only toggle between Member and Instructor
        if (member.role === 'Admin') {
          throw new Error('Unauthorized: Only Super Admin can change Admin roles');
        }
        nextRole = member.role === 'Member' ? 'Instructor' : 'Member';
      }
      
      await updateDoc(doc(getDb(), 'members', id), { role: nextRole });
    }
  };

  const resetPassword = async (id: string) => {
    const tempPass = Math.random().toString(36).slice(-8);
    const hashed = await hashPassword(tempPass);
    await updateDoc(doc(getDb(), 'members', id), { password: hashed, isTemporary: true });
    showAlert(`סיסמה זמנית חדשה: ${tempPass}`, "איפוס סיסמה");
  };

  const approveRequest = async (id: string) => {
    console.log('DataContext: approveRequest starting for id:', id);
    try {
      const db = getDb();
      const requestRef = doc(db, 'joinRequests', id);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        return null;
      }
      
      const reqData = requestSnap.data() as JoinRequest;
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(tempPassword);
      
      const newMemberData = {
        firstName: reqData.firstName || '',
        lastName: reqData.lastName || '',
        email: reqData.email || '', 
        mobile: reqData.mobile || '', 
        avatar: reqData.avatar || '', 
        bio: reqData.bio || '',
        gender: reqData.gender || 'מעדיף/ה לא לציין',
        role: 'Member', 
        joinedAt: getCurrentDateFormatted(), 
        isActive: true,
        password: hashedPassword, 
        isTemporary: true, 
        loginCount: 0, 
        totalAttendance: 0,
        facebookUrl: reqData.facebookUrl || '',
        instagramUrl: reqData.instagramUrl || '',
        tiktokUrl: reqData.tiktokUrl || '',
        linkedinUrl: reqData.linkedinUrl || '',
        twitterUrl: reqData.twitterUrl || '',
        websiteUrl: reqData.websiteUrl || ''
      };
      
      const memberRef = doc(db, 'members', id);
      await setDoc(memberRef, newMemberData);
      await deleteDoc(requestRef);
      
      return { 
        firstName: newMemberData.firstName,
        lastName: newMemberData.lastName,
        email: newMemberData.email, 
        mobile: newMemberData.mobile, 
        tempPassword 
      };
    } catch (err: any) {
      throw err;
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      await deleteDoc(doc(getDb(), 'joinRequests', id));
    } catch (err: any) {
      throw err;
    }
  };

  const addEvent = async (details: Omit<Event, 'id'>) => {
    await setDoc(doc(collection(getDb(), 'events')), details);
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(getDb(), 'events', id));
  };

  const updateEvent = async (event: Event) => {
    const { id, ...data } = event;
    await updateDoc(doc(getDb(), 'events', id), data);
  };

  const toggleEventAttendance = async (eventId: string, userId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const isAttending = (event.attendees || []).includes(userId);
    await updateDoc(doc(getDb(), 'events', eventId), {
      attendees: isAttending ? arrayRemove(userId) : arrayUnion(userId)
    });
  };

  const addNews = async (details: Omit<NewsItem, 'id'>) => {
    await setDoc(doc(collection(getDb(), 'news')), details);
  };

  const deleteNews = async (id: string) => {
    await deleteDoc(doc(getDb(), 'news', id));
  };

  const toggleSessionAttendance = async (userId: string) => {
    const isCurrentlyAttending = attendeeIds.includes(userId);
    const activeSessionRef = doc(getDb(), 'site_data', 'active_session');
    if (isCurrentlyAttending) {
      await updateDoc(activeSessionRef, { attendees: arrayRemove(userId) });
    } else {
      await updateDoc(activeSessionRef, { attendees: arrayUnion(userId) });
    }
  };

  const forceResetSession = async () => {
    const nextThurs = getNextThursday();
    await updateDoc(doc(getDb(), 'site_data', 'active_session'), {
      attendees: [],
      date: nextThurs
    });
  };

  const finalizeThursdaySession = async () => {
    const db = getDb();
    const sessionRef = doc(db, 'site_data', 'active_session');
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) return;
    
    const data = sessionSnap.data() as any;
    const attendees = data.attendees || [];
    const sessionDateStr = data.date;

    if (!sessionDateStr) return;
    const sessionDate = new Date(sessionDateStr);

    // Idempotency check: Has this session already been archived?
    // Use the already fetched weeklyHistory from state if possible, or a limited query
    const alreadyExists = weeklyHistory.some(d => {
      const dDate = d.date?.toDate ? d.date.toDate() : new Date(d.date);
      return dDate.toDateString() === sessionDate.toDateString();
    });

    if (alreadyExists) {
      const nextThurs = getNextThursday();
      await updateDoc(sessionRef, {
        attendees: [],
        date: nextThurs
      });
      return;
    }

    if (attendees.length === 0) {
      const nextThurs = getNextThursday();
      await updateDoc(sessionRef, {
        attendees: [],
        date: nextThurs
      });
      return;
    }

    const batch = writeBatch(db);
    
    // 1. Update totalAttendance for all attendees
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
  };

  const batchAddGlossary = async (items: Omit<GlossaryTerm, 'id'>[]) => {
    const db = getDb();
    const batch = writeBatch(db);
    items.forEach(item => {
      const newDocRef = doc(collection(db, 'glossary'));
      batch.set(newDocRef, item);
    });
    await batch.commit();
    storage.remove('cached_glossary_v2'); // Invalidate cache
  };

  const batchAddExercises = async (items: Omit<Exercise, 'id'>[]) => {
    const db = getDb();
    const batch = writeBatch(db);
    items.forEach(item => {
      const newDocRef = doc(collection(db, 'exercises'));
      batch.set(newDocRef, item);
    });
    await batch.commit();
    storage.remove('cached_exercises_v2'); // Invalidate cache
  };

  const batchAddQuotes = async (items: Omit<QuoteItem, 'id'>[]) => {
    const db = getDb();
    const batch = writeBatch(db);
    items.forEach(item => {
      const newDocRef = doc(collection(db, 'quotes'));
      batch.set(newDocRef, item);
    });
    await batch.commit();
  };

  const clearCollection = async (collectionName: string) => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, collectionName), async (snap: any) => {
      const batch = writeBatch(db);
      snap.docs.forEach((d: any) => batch.delete(d.ref));
      await batch.commit();
      unsub();
    });
  };

  const updateSiteAssets = async (assets: any) => {
    await setDoc(doc(getDb(), 'site_data', 'assets'), assets, { merge: true });
  };

  const updateYearConfig = async (config: { startDate: string; endDate: string }) => {
    await setDoc(doc(getDb(), 'site_data', 'year_config'), config);
  };

  const archiveMember = async (id: string) => {
    const db = getDb();
    const batch = writeBatch(db);
    
    // 1. Update member status
    const memberRef = doc(db, 'members', id);
    batch.update(memberRef, { isActive: false });
    
    // 2. Remove from active session
    const activeSessionRef = doc(getDb(), 'site_data', 'active_session');
    batch.update(activeSessionRef, { attendees: arrayRemove(id) });
    
    // 3. Remove from all future events
    events.forEach(event => {
      if (event.attendees && event.attendees.includes(id)) {
        const eventRef = doc(db, 'events', event.id);
        batch.update(eventRef, { attendees: arrayRemove(id) });
      }
    });
    
    await batch.commit();
  };

  return (
    <DataContext.Provider value={{ 
      members, joinRequests, events, news, galleryItems, glossary, exercises, quotes, weeklyHistory, siteAssets, yearConfig, attendeeIds, activeSessionDate, isLoading, hasQuotaError, dbStatus, toggleDbStatus,
      updateMember, deleteMember, toggleStatus, toggleRole, resetPassword, approveRequest, rejectRequest,
      addEvent, deleteEvent, updateEvent, toggleEventAttendance, addNews, deleteNews, toggleSessionAttendance, forceResetSession,
      finalizeThursdaySession, batchAddGlossary, batchAddExercises, batchAddQuotes, clearCollection, updateSiteAssets, updateYearConfig, archiveMember
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};