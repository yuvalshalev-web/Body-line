import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, increment, getDoc, getDocs, orderBy, limit, addDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { ref, deleteObject, getMetadata } from 'firebase/storage';
import { getDb, trackedGetDocs, setDbStatus, db_status, getStorageInstance } from '../services/firebase';
import { formatDate, getCurrentDateFormatted } from '../src/utils/dateUtils';
import { Member, JoinRequest, Event, NewsItem, GalleryItem, GlossaryTerm, QuoteItem, Exercise, Podcast } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { hashPassword } from '../utils/crypto';
import { initializeStorageStats, syncStorageOnDelete } from '../utils/storageStats';
import { storage } from '../src/utils/storage';
import { useModal } from './ModalContext';
import { finalizeThursdaySession as finalizeThursdaySessionService } from '../services/rolloverService';

interface DataContextType {
  members: Member[];
  joinRequests: JoinRequest[];
  events: Event[];
  news: NewsItem[];
  podcasts: Podcast[];
  galleryItems: GalleryItem[];
  glossary: GlossaryTerm[];
  exercises: Exercise[];
  quotes: QuoteItem[];
  weeklyHistory: any[];
  siteAssets: any;
  siteConfig: { 
    navPosition: 'standard',
    home_break?: {
      formatted: string;
      lat: number | null;
      lng: number | null;
      city: string;
      street: string;
    },
    globalColor?: string,
    h1Styles?: {
      fontSize: string;
      color: string;
      align: string;
      weight: string;
      glassBlur: string;
      glassOpacity: string;
      fontFamily?: string;
      showGlass?: boolean;
      letterSpacing?: string;
      color1?: string;
      color2?: string;
      gradAngle?: string;
      strokeWidth?: string;
      strokeColor?: string;
      glowSize?: string;
      glowColor?: string;
    }
  };
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
  updateNews: (newsItem: NewsItem) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  addPodcast: (details: Omit<Podcast, 'id'>) => Promise<void>;
  updatePodcast: (podcast: Podcast) => Promise<void>;
  deletePodcast: (id: string) => Promise<void>;
  deleteGalleryItems: (ids: string[]) => Promise<void>;
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => Promise<void>;
  toggleSessionAttendance: (userId: string) => Promise<void>;
  forceResetSession: () => Promise<void>;
  finalizeThursdaySession: () => Promise<void>;
  batchAddGlossary: (items: Omit<GlossaryTerm, 'id'>[]) => Promise<void>;
  batchAddExercises: (items: Omit<Exercise, 'id'>[]) => Promise<void>;
  batchAddQuotes: (items: Omit<QuoteItem, 'id'>[]) => Promise<void>;
  clearCollection: (collectionName: string) => Promise<void>;
  updateSiteAssets: (assets: any) => Promise<void>;
  updateSiteConfig: (config: Partial<{ 
    navPosition: 'standard',
    home_break: any,
    globalColor: string,
    h1Styles: any
  }>) => Promise<void>;
  updateYearConfig: (config: { startDate: string; endDate: string }) => Promise<void>;
  archiveMember: (id: string) => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showAlert } = useModal();
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [siteAssets, setSiteAssets] = useState<any>({});
  const [siteConfig, setSiteConfig] = useState<{ 
    navPosition: 'standard',
    home_break?: any,
    globalColor?: string,
    h1Styles?: {
      fontSize: string;
      color: string;
      align: string;
      weight: string;
      glassBlur: string;
      glassOpacity: string;
      fontFamily?: string;
      showGlass?: boolean;
      letterSpacing?: string;
      color1?: string;
      color2?: string;
      gradAngle?: string;
      strokeWidth?: string;
      strokeColor?: string;
      glowSize?: string;
      glowColor?: string;
    }
  }>(() => {
    return { navPosition: 'standard' };
  });
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

    const unsubRequests = onSnapshot(query(collection(db, 'joinRequests'), limit(200)), (snapshot) => {
      setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest)));
    }, handleFirestoreError);
    
    const unsubEvents = onSnapshot(query(collection(db, 'events'), orderBy('date', 'desc'), limit(200)), (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    }, handleFirestoreError);
    
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc'), limit(200)), (snapshot) => {
      setNews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
    }, handleFirestoreError);
    
    const unsubPodcasts = onSnapshot(query(collection(db, 'podcasts'), orderBy('publishedAt', 'desc'), limit(200)), (snapshot) => {
      setPodcasts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Podcast)));
    }, handleFirestoreError);
    
    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
      setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
    }, handleFirestoreError);
    
    const unsubAssets = onSnapshot(doc(db, 'site_data', 'assets'), (doc) => {
      if (doc.exists()) setSiteAssets(doc.data());
    }, handleFirestoreError);

    const unsubConfig = onSnapshot(doc(db, 'site_data', 'config'), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data() as any);
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
      unsubMembers(); unsubHistory(); unsubRequests(); unsubEvents(); unsubNews(); unsubGallery(); unsubAssets(); unsubConfig(); unsubYearConfig(); unsubAttendees();
    };
  }, [handleFirestoreError, dbStatus]);

  const updateMember = async (member: Member) => {
    const { id, ...data } = member;
    const db = getDb();
    
    // Delta Checking: Only update if data actually changed
    const existing = members.find(m => m.id === id);
    if (existing) {
      const hasChanged = Object.keys(data).some(key => (data as any)[key] !== (existing as any)[key]);
      if (!hasChanged) {
        console.log("DataContext: No changes detected for member", id, "- skipping update.");
        return;
      }
    }

    await updateDoc(doc(db, 'members', id), data);
  };

  const deleteMember = async (id: string) => {
    await deleteDoc(doc(getDb(), 'members', id));
  };

  const toggleStatus = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

    const db = getDb();
    const batch = writeBatch(db);
    const memberRef = doc(db, 'members', id);
    const activeSessionRef = doc(db, 'site_data', 'active_session');
    
    const nextIsActive = !member.isActive;
    const updateData: any = { isActive: nextIsActive };
    
    if (!nextIsActive) {
      updateData.deactivatedAt = new Date().toISOString();
      batch.update(activeSessionRef, { attendees: arrayRemove(id) });
    } else {
      updateData.deactivatedAt = null;
    }
    
    batch.update(memberRef, updateData);
    await batch.commit();
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
    const member = members.find(m => m.id === userId);
    if (member && !member.isActive) {
      showAlert("משתמש מושעה אינו יכול לאשר הגעה", "שגיאה");
      return;
    }
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

  const updateNews = async (newsItem: NewsItem) => {
    const { id, ...data } = newsItem;
    await updateDoc(doc(getDb(), 'news', id), data);
  };

  const deleteNews = async (id: string) => {
    await deleteDoc(doc(getDb(), 'news', id));
  };

  const addPodcast = async (details: Omit<Podcast, 'id'>) => {
    await setDoc(doc(collection(getDb(), 'podcasts')), details);
  };

  const updatePodcast = async (podcast: Podcast) => {
    const { id, ...data } = podcast;
    await updateDoc(doc(getDb(), 'podcasts', id), data);
  };

  const deletePodcast = async (id: string) => {
    await deleteDoc(doc(getDb(), 'podcasts', id));
  };

  const deleteGalleryItems = async (ids: string[]) => {
    if (hasQuotaError || dbStatus === 'OFFLINE') throw new Error('Database is currently unavailable or quota exceeded.');
    const storage = getStorageInstance();
    const batch = writeBatch(getDb());
    let totalSizeDeleted = 0;
    let count = 0;

    for (const id of ids) {
      if (count >= 200) break;
      count++;
      const item = galleryItems.find(g => g.id === id);
      if (item && item.storagePath) {
        try {
          const fileRef = ref(storage, item.storagePath);
          const metadata = await getMetadata(fileRef);
          totalSizeDeleted += metadata.size;
          await deleteObject(fileRef);
        } catch (error) {
          console.error(`Failed to delete storage object for item ${id}:`, error);
        }
      }
      batch.delete(doc(getDb(), 'gallery', id));
    }

    await batch.commit();
    if (totalSizeDeleted > 0) {
      await syncStorageOnDelete(totalSizeDeleted);
    }
  };

  const addGalleryItem = async (item: Omit<GalleryItem, 'id'>) => {
    const db = getDb();
    await addDoc(collection(db, 'gallery'), {
      ...item,
      timestamp: Timestamp.now()
    });
  };

  const toggleSessionAttendance = async (userId: string) => {
    const member = members.find(m => m.id === userId);
    if (member && !member.isActive) {
      showAlert("משתמש מושעה אינו יכול לאשר הגעה", "שגיאה");
      return;
    }
    const isCurrentlyAttending = attendeeIds.includes(userId);
    const activeSessionRef = doc(getDb(), 'site_data', 'active_session');
    if (isCurrentlyAttending) {
      await setDoc(activeSessionRef, { attendees: arrayRemove(userId) }, { merge: true });
    } else {
      await setDoc(activeSessionRef, { attendees: arrayUnion(userId) }, { merge: true });
    }
  };

  const forceResetSession = async () => {
    const nextThurs = getNextThursday();
    await setDoc(doc(getDb(), 'site_data', 'active_session'), {
      attendees: [],
      date: nextThurs
    }, { merge: true });
  };

  const addRolloverLog = async (action: string, status: 'success' | 'failed', details: string) => {
    const db = getDb();
    await addDoc(collection(db, 'rollover_logs'), {
      action,
      status,
      details,
      timestamp: new Date().toISOString()
    });
  };

  const finalizeThursdaySession = async () => {
    await finalizeThursdaySessionService(weeklyHistory, yearConfig);
  };

  const batchAddGlossary = async (items: Omit<GlossaryTerm, 'id'>[]) => {
    if (hasQuotaError || dbStatus === 'OFFLINE') throw new Error('Database is currently unavailable or quota exceeded.');
    const db = getDb();
    const batch = writeBatch(db);
    items.slice(0, 200).forEach(item => {
      const newDocRef = doc(collection(db, 'glossary'));
      batch.set(newDocRef, item);
    });
    await batch.commit();
    storage.remove('cached_glossary_v2'); // Invalidate cache
  };

  const batchAddExercises = async (items: Omit<Exercise, 'id'>[]) => {
    if (hasQuotaError || dbStatus === 'OFFLINE') throw new Error('Database is currently unavailable or quota exceeded.');
    const db = getDb();
    const batch = writeBatch(db);
    items.slice(0, 200).forEach(item => {
      const newDocRef = doc(collection(db, 'exercises'));
      batch.set(newDocRef, item);
    });
    await batch.commit();
    storage.remove('cached_exercises_v2'); // Invalidate cache
  };

  const batchAddQuotes = async (items: Omit<QuoteItem, 'id'>[]) => {
    if (hasQuotaError || dbStatus === 'OFFLINE') throw new Error('Database is currently unavailable or quota exceeded.');
    const db = getDb();
    const batch = writeBatch(db);
    items.slice(0, 200).forEach(item => {
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

  const updateSiteConfig = async (config: Partial<{ 
    navPosition: 'standard',
    home_break: any,
    globalColor: string,
    h1Styles: any
  }>) => {
    setSiteConfig(prev => ({ ...prev, ...config }));
    await setDoc(doc(getDb(), 'site_data', 'config'), config, { merge: true });
  };

  const updateYearConfig = async (config: { startDate: string; endDate: string }) => {
    await setDoc(doc(getDb(), 'site_data', 'year_config'), config);
  };

  const archiveMember = async (id: string) => {
    if (hasQuotaError || dbStatus === 'OFFLINE') throw new Error('Database is currently unavailable or quota exceeded.');
    const db = getDb();
    const batch = writeBatch(db);
    
    // 1. Update member status
    const memberRef = doc(db, 'members', id);
    batch.update(memberRef, { isActive: false });
    
    // 2. Remove from active session
    const activeSessionRef = doc(getDb(), 'site_data', 'active_session');
    batch.update(activeSessionRef, { attendees: arrayRemove(id) });
    
    // 3. Remove from all future events
    let count = 0;
    events.forEach(event => {
      if (count >= 200) return;
      if (event.attendees && event.attendees.includes(id)) {
        count++;
        const eventRef = doc(db, 'events', event.id);
        batch.update(eventRef, { attendees: arrayRemove(id) });
      }
    });
    
    await batch.commit();
  };

  const addMember = async (memberData: Omit<Member, 'id'>) => {
    const db = getDb();
    
    // Circuit Breaker check
    if (hasQuotaError || dbStatus === 'OFFLINE') {
      throw new Error('Database is currently unavailable or quota exceeded.');
    }

    const membersRef = collection(db, 'members');
    await addDoc(membersRef, {
      ...memberData,
      joinedAt: memberData.joinedAt || getCurrentDateFormatted(),
      isActive: memberData.isActive !== undefined ? memberData.isActive : true,
      loginCount: 0,
      totalAttendance: 0
    });
  };

  return (
    <DataContext.Provider value={{ 
      members, joinRequests, events, news, podcasts, galleryItems, glossary, exercises, quotes, weeklyHistory, siteAssets, siteConfig, yearConfig, attendeeIds, activeSessionDate, isLoading, hasQuotaError, dbStatus, toggleDbStatus,
      updateMember, deleteMember, toggleStatus, toggleRole, resetPassword, approveRequest, rejectRequest,
      addEvent, deleteEvent, updateEvent, toggleEventAttendance, addNews, updateNews, deleteNews, addPodcast, updatePodcast, deletePodcast, deleteGalleryItems, addGalleryItem, toggleSessionAttendance, forceResetSession,
      finalizeThursdaySession, batchAddGlossary, batchAddExercises, batchAddQuotes, clearCollection, updateSiteAssets, updateSiteConfig, updateYearConfig, archiveMember, addMember
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