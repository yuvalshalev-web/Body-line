import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, increment, getDoc, getDocs, orderBy, limit, addDoc, writeBatch, Timestamp, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject, getMetadata } from 'firebase/storage';
import { getDb, trackedGetDocs, setDbStatus, db_status, getStorageInstance } from '../services/firebase';
import { formatDate, getCurrentDateFormatted } from '../utils/dateUtils';
import { Member, JoinRequest, Event, NewsItem, GalleryItem, GlossaryTerm, QuoteItem, Exercise, Podcast } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { hashPassword } from '../utils/crypto';
import { initializeStorageStats, syncStorageOnDelete } from '../utils/storageStats';
import { storage } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';
import { finalizeSession as finalizeSessionService, getNextSessionDate } from '../services/rolloverService';

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
    navPosition: 'bottom' | 'top',
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
    },
    weeklySessions?: { dayOfWeek: number, time: string, isActive?: boolean, isRecurring?: boolean }[];
    seaState?: {
      waveHeight?: number | string;
      windSpeed?: number | string;
      waterTemp?: number | string;
      uvIndex?: number | string;
    };
  };
  coastalWeather: any | null;
  seaStats: any | null;
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
  updateHistory: (id: string, participantIds: string[]) => Promise<void>;
  forceResetSession: () => Promise<void>;
  finalizeSession: () => Promise<void>;
  updateHistoricalSeaTemperatures: () => Promise<number>;
  batchAddGlossary: (items: Omit<GlossaryTerm, 'id'>[]) => Promise<void>;
  batchAddExercises: (items: Omit<Exercise, 'id'>[]) => Promise<void>;
  batchAddQuotes: (items: Omit<QuoteItem, 'id'>[]) => Promise<void>;
  clearCollection: (collectionName: string) => Promise<void>;
  updateSiteAssets: (assets: any) => Promise<void>;
  updateSiteConfig: (config: Partial<{ 
    navPosition: 'bottom' | 'top',
    home_break: any,
    globalColor: string,
    h1Styles: any,
    weeklySessions: { dayOfWeek: number, time: string, isActive?: boolean, isRecurring?: boolean }[]
  }>) => Promise<void>;
  updateYearConfig: (config: { startDate: string; endDate: string }) => Promise<void>;
  archiveMember: (id: string) => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
  isDbEmpty: boolean;
  conflictingAdmins: Member[];
  seedInitialAdmin: () => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
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
    navPosition: 'bottom' | 'top',
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
    },
    weeklySessions?: { dayOfWeek: number, time: string, isActive?: boolean, isRecurring?: boolean }[];
  }>(() => {
    return { navPosition: 'bottom', weeklySessions: [{ dayOfWeek: 4, time: '07:00', isActive: false, isRecurring: true }] };
  });
  const [coastalWeather, setCoastalWeather] = useState<any | null>(null);
  const [seaStats, setSeaStats] = useState<any | null>(null);
  const siteConfigRef = useRef(siteConfig);

  useEffect(() => {
    siteConfigRef.current = siteConfig;
  }, [siteConfig]);

  const [yearConfig, setYearConfig] = useState<{ startDate: string; endDate: string } | null>(null);
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const [conflictingAdmins, setConflictingAdmins] = useState<Member[]>([]);
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
    
    // 1. Public Data Listeners (Always active)
    const fetchCoastalWeather = async () => {
      try {
        console.log("Fetching coastal weather from:", window.location.origin + '/api/coastal-weather');
        const res = await fetch(window.location.origin + '/api/coastal-weather', {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!res.ok) {
            console.error("Coastal weather fetch failed with status", res.status);
            return;
        }
        const data = await res.json();
        console.log("Coastal weather data received:", data);
        setCoastalWeather(data);
      } catch (e) {
        console.error("Failed to fetch coastal weather - network error or server down:", e);
      }
    };
    fetchCoastalWeather();
    const weatherInterval = setInterval(fetchCoastalWeather, 1000 * 60 * 15);

    const fetchSeaStats = async () => {
      try {
        const statsRef = doc(db, 'seaConditionsStats', 'current');
        const statsDoc = await getDoc(statsRef);
        if (statsDoc.exists()) {
          setSeaStats(statsDoc.data());
        }
      } catch (e) {
        console.error("Failed to fetch sea stats", e);
      }
    };
    fetchSeaStats();

    const unsubAssets = onSnapshot(doc(db, 'site_data', 'assets'), (doc) => {
      if (doc.exists()) setSiteAssets(doc.data());
    }, handleFirestoreError);

    const unsubConfig = onSnapshot(doc(db, 'site_data', 'config'), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data() as any);
    }, handleFirestoreError);

    const unsubYearConfig = onSnapshot(doc(db, 'site_data', 'year_config'), (doc) => {
      if (doc.exists()) setYearConfig(doc.data() as { startDate: string; endDate: string });
    }, handleFirestoreError);

    // 2. Auth-dependent Data
    let unsubs: (() => void)[] = [unsubAssets, unsubConfig, unsubYearConfig];

    if (currentUser) {
      if (currentUser.role === 'Admin') {
        initializeStorageStats();
      }
      
      // Initial Placeholder from Cache (Freshness check: 2 mins)
      const cachedMembers = storage.get('cached_members_v3');
      if (cachedMembers) setMembers(cachedMembers);
      
      const cachedHistory = storage.get('cached_history_v3');
      if (cachedHistory) setWeeklyHistory(cachedHistory);

      // One-time fetches for static-ish data
      const fetchData = async () => {
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
          
          // Quotes
          const qSnap = await trackedGetDocs(collection(db, 'quotes'));
          setQuotes(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuoteItem)));
        } catch (e: any) {
          if (e.message !== 'QUOTA_EXCEEDED_OR_KILL_SWITCH') handleFirestoreError(e);
        }
      };

      fetchData();

      // Real-time listeners for dynamic data
      const unsubMembers = onSnapshot(query(collection(db, 'members'), limit(200)), (snapshot) => {
        const rawDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
        console.log('DataContext: Raw members count from snapshot:', rawDocs.length);
        
        const filteredDocs = rawDocs.filter(m => {
          const isSuperAdmin = m.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim();
          // Special exception: If it's Gal Gadot, don't filter her out even if email matches (to allow recovery)
          const isGalGadot = (m.firstName === 'גל' && m.lastName === 'גדות') || m.email?.toLowerCase().trim() === 'gal@gmail.com';
          
          if (isSuperAdmin && !isGalGadot) {
            console.log('DataContext: Filtering out super admin:', m.email);
            return false;
          }
          return true;
        });

        console.log('DataContext: Members count after filtering super admin:', filteredDocs.length);
        
        // Check for Gal Gadot specifically
        const superAdmins = rawDocs.filter(m => m.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim());
        setConflictingAdmins(superAdmins);
        if (superAdmins.length > 1) {
          console.log('DataContext: WARNING! Multiple documents with SuperAdmin email found:', superAdmins.map(m => m.id));
        } else if (superAdmins.length === 1) {
          console.log('DataContext: Found single SuperAdmin document. ID:', superAdmins[0].id);
        } else {
          console.log('DataContext: No SuperAdmin document found in raw docs! (This is unexpected)');
        }

        const galGadot = rawDocs.find(m => 
          (m.firstName === 'גל' && m.lastName === 'גדות') || 
          m.email?.toLowerCase().trim() === 'gal@gmail.com'
        );
        if (galGadot) {
          console.log('DataContext: Found Gal Gadot in raw docs:', galGadot);
          console.log('DataContext: Gal Gadot isActive status:', galGadot.isActive);
          const isFiltered = !filteredDocs.find(m => m.id === galGadot.id);
          console.log('DataContext: Is Gal Gadot filtered out by SuperAdmin check?', isFiltered);
        } else {
          console.log('DataContext: Gal Gadot NOT found in raw docs. Current emails in DB:', rawDocs.map(m => m.email));
        }
        
        setMembers(filteredDocs);
        setIsDbEmpty(snapshot.empty);
        storage.set('cached_members_v3', filteredDocs, 2 / 60);
      }, handleFirestoreError);

      const unsubHistory = onSnapshot(query(collection(db, 'weekly_history'), orderBy('date', 'desc'), limit(200)), (snapshot) => {
        const hData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('DataContext: Weekly History Data:', hData);
        setWeeklyHistory(hData);
        storage.set('cached_history_v3', hData, 2 / 60);
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

      const unsubAttendees = onSnapshot(doc(db, 'site_data', 'active_session'), async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as any;
          const sessionDate = data.date;
          const attendees = data.attendees || [];
          setAttendeeIds(attendees);
          
          if (sessionDate && new Date(sessionDate) < new Date()) {
            console.log('Session date passed, finalizing session...');
            finalizeSession();
          } else {
            setActiveSessionDate(sessionDate || getNextSessionDate(siteConfigRef.current?.weeklySessions));
          }
        }
        setIsLoading(false);
      }, handleFirestoreError);

      unsubs.push(unsubMembers, unsubHistory, unsubEvents, unsubNews, unsubPodcasts, unsubGallery, unsubAttendees);

      if (currentUser.role === 'Admin') {
        const unsubRequests = onSnapshot(query(collection(db, 'joinRequests'), limit(200)), (snapshot) => {
          setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest)));
        }, handleFirestoreError);
        unsubs.push(unsubRequests);
      }
    } else {
      // Not logged in
      setIsLoading(false);
    }

    const timeoutId = setTimeout(() => setIsLoading(false), 4000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(weatherInterval);
      unsubs.forEach(unsub => unsub());
    };
  }, [handleFirestoreError, dbStatus, currentUser]);

  const updateMember = useCallback(async (member: Member) => {
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
  }, [members]);

  const deleteMember = useCallback(async (id: string) => {
    await deleteDoc(doc(getDb(), 'members', id));
  }, []);

  const toggleStatus = useCallback(async (id: string) => {
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
  }, [members]);

  const toggleRole = useCallback(async (id: string, requesterEmail?: string) => {
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
  }, [members]);

  const resetPassword = useCallback(async (id: string) => {
    const tempPass = Math.random().toString(36).slice(-8);
    const hashed = await hashPassword(tempPass);
    await updateDoc(doc(getDb(), 'members', id), { password: hashed, isTemporary: true });
    showAlert(`סיסמה זמנית חדשה: ${tempPass}`, "איפוס סיסמה");
  }, [showAlert]);

  const approveRequest = useCallback(async (id: string) => {
    console.log('DataContext: approveRequest starting for id:', id);
    try {
      const db = getDb();
      const requestRef = doc(db, 'joinRequests', id);
      const memberRef = doc(db, 'members', id);
      
      const result = await runTransaction(db, async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        const memberSnap = await transaction.get(memberRef);
        
        if (!requestSnap.exists()) {
          // If member exists but request doesn't, it was likely already approved
          if (memberSnap.exists()) {
            console.log('DataContext: Member already exists, likely already approved.');
            return { alreadyApproved: true };
          }
          return null;
        }
        
        const reqData = requestSnap.data() as JoinRequest;
        const normalizedEmail = (reqData.email || '').toLowerCase().trim();
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(tempPassword);
        
        const newMemberData = {
          firstName: reqData.firstName || '',
          lastName: reqData.lastName || '',
          email: normalizedEmail, 
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
        
        transaction.set(memberRef, newMemberData);
        transaction.delete(requestRef);
        
        return { 
          firstName: newMemberData.firstName,
          lastName: newMemberData.lastName,
          email: newMemberData.email, 
          mobile: newMemberData.mobile, 
          tempPassword 
        };
      });

      if (result && 'alreadyApproved' in result) {
        return null; // Treat as already processed
      }
      
      return result as { firstName: string; lastName: string; email: string; mobile: string; tempPassword: string } | null;
    } catch (err: any) {
      console.error('Error in approveRequest:', err);
      throw err;
    }
  }, []);

  const rejectRequest = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(getDb(), 'joinRequests', id));
    } catch (err: any) {
      throw err;
    }
  }, []);

  const addEvent = useCallback(async (details: Omit<Event, 'id'>) => {
    await setDoc(doc(collection(getDb(), 'events')), details);
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await deleteDoc(doc(getDb(), 'events', id));
  }, []);

  const updateEvent = useCallback(async (event: Event) => {
    const { id, ...data } = event;
    await updateDoc(doc(getDb(), 'events', id), data);
  }, []);

  const toggleEventAttendance = useCallback(async (eventId: string, userId: string) => {
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
  }, [members, events, showAlert]);

  const addNews = useCallback(async (details: Omit<NewsItem, 'id'>) => {
    await setDoc(doc(collection(getDb(), 'news')), details);
  }, []);

  const updateNews = useCallback(async (newsItem: NewsItem) => {
    const { id, ...data } = newsItem;
    await updateDoc(doc(getDb(), 'news', id), data);
  }, []);

  const deleteNews = useCallback(async (id: string) => {
    await deleteDoc(doc(getDb(), 'news', id));
  }, []);

  const addPodcast = useCallback(async (details: Omit<Podcast, 'id'>) => {
    await setDoc(doc(collection(getDb(), 'podcasts')), details);
  }, []);

  const updatePodcast = useCallback(async (podcast: Podcast) => {
    const { id, ...data } = podcast;
    await updateDoc(doc(getDb(), 'podcasts', id), data);
  }, []);

  const deletePodcast = useCallback(async (id: string) => {
    await deleteDoc(doc(getDb(), 'podcasts', id));
  }, []);

  const deleteGalleryItems = useCallback(async (ids: string[]) => {
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
  }, [hasQuotaError, dbStatus, galleryItems]);

  const addGalleryItem = useCallback(async (item: Omit<GalleryItem, 'id'>) => {
    const db = getDb();
    await addDoc(collection(db, 'gallery'), {
      ...item,
      timestamp: Timestamp.now()
    });
  }, []);

  const toggleSessionAttendance = useCallback(async (userId: string) => {
    const member = members.find(m => m.id === userId);
    if (!member || member.isActive === false || (member as any).status === 'suspended' || (member as any).status === 'left') {
      showAlert("משתמש שאינו פעיל או שאינו קיים אינו יכול לאשר הגעה", "שגיאה");
      return;
    }
    const isCurrentlyAttending = attendeeIds.includes(userId);
    const activeSessionRef = doc(getDb(), 'site_data', 'active_session');
    if (isCurrentlyAttending) {
      await setDoc(activeSessionRef, { attendees: arrayRemove(userId) }, { merge: true });
    } else {
      await setDoc(activeSessionRef, { attendees: arrayUnion(userId) }, { merge: true });
    }
  }, [members, attendeeIds, showAlert]);

  const updateHistory = useCallback(async (id: string, participantIds: string[]) => {
    const db = getDb();
    await updateDoc(doc(db, 'weekly_history', id), {
      participantIds,
      participantsCount: participantIds.length
    });
  }, []);

  const forceResetSession = useCallback(async () => {
    const nextSession = getNextSessionDate(siteConfig?.weeklySessions);
    await setDoc(doc(getDb(), 'site_data', 'active_session'), {
      attendees: [],
      date: nextSession
    }, { merge: true });
  }, [siteConfig?.weeklySessions]);

  const addRolloverLog = useCallback(async (action: string, status: 'pending' | 'success' | 'failed', details: string, metrics?: any) => {
    console.log("addRolloverLog called:", { action, status, details, metrics });
    const db = getDb();
    const logData: any = {
      action,
      status,
      details,
      timestamp: serverTimestamp()
    };
    
    if (metrics && typeof metrics === 'object') {
      const sanitizedMetrics = { ...metrics };
      for (const key in sanitizedMetrics) {
        if (sanitizedMetrics[key] === undefined) {
          delete sanitizedMetrics[key];
        }
      }
      logData.metrics = sanitizedMetrics;
    } else if (metrics !== undefined && metrics !== null) {
      logData.metrics = metrics;
    }
    
    try {
      await addDoc(collection(db, 'rollover_logs'), logData);
    } catch (error) {
      console.error('Error adding rollover log:', error);
    }
  }, []);

  const finalizeSession = useCallback(async () => {
    console.log("finalizeSession: Starting process...");
    const db = getDb();
    const startTime = Date.now();
    let updatedFields = 0;
    
    try {
      // 1. Start
      console.log("finalizeSession: Logging start...");
      await addRolloverLog('start', 'success', 'תהליך הסגירה החל');
      
      // 2. Get current active session data
      console.log("finalizeSession: Getting active session data...");
      const activeSessionRef = doc(db, 'site_data', 'active_session');
      const activeSnap = await getDoc(activeSessionRef);
      if (!activeSnap.exists()) {
        console.error("finalizeSession: Active session document not found!");
        throw new Error('Active session document not found');
      }
      const activeData = activeSnap.data();
      const currentAttendees = activeData.attendees || [];
      const currentDate = activeData.date;
      console.log("finalizeSession: Active data retrieved:", { attendeesCount: currentAttendees.length, date: currentDate });

      // 3. Archive to weekly_history
      console.log("finalizeSession: Archiving to weekly_history...");
      await addRolloverLog('archive', 'pending', `מעביר ${currentAttendees.length} משתתפים להיסטוריה...`);
      await addDoc(collection(db, 'weekly_history'), {
        date: currentDate || new Date().toISOString(),
        participantIds: currentAttendees,
        participantsCount: currentAttendees.length,
        status: 'finalized',
        finalizedAt: new Date().toISOString(),
        seaState: coastalWeather || null
      });
      await addRolloverLog('archive', 'success', 'הסשן הועבר להיסטוריה בהצלחה');
      
      await addRolloverLog('save_sea_state', 'pending', 'שומר נתוני מצב הים...');
      if (coastalWeather) {
        await addRolloverLog('save_sea_state', 'success', 'נתוני מצב הים נשמרו בהצלחה');
      } else {
        await addRolloverLog('save_sea_state', 'success', 'לא נמצאו נתוני מצב ים לשמירה');
      }
      updatedFields += 1;

      // 4. Handle One-Time Sessions
      let currentWeeklySessions = siteConfigRef.current?.weeklySessions || [];
      if (currentDate && currentWeeklySessions.length > 0) {
        const sessionDate = new Date(currentDate);
        const dayOfWeek = sessionDate.getDay();
        const timeStr = `${sessionDate.getHours().toString().padStart(2, '0')}:${sessionDate.getMinutes().toString().padStart(2, '0')}`;
        
        const updatedWeeklySessions = currentWeeklySessions.map(s => {
          if (s.dayOfWeek === dayOfWeek && s.time === timeStr && s.isRecurring === false) {
            return { ...s, isActive: false };
          }
          return s;
        });
        
        const hasChanges = JSON.stringify(updatedWeeklySessions) !== JSON.stringify(currentWeeklySessions);
        if (hasChanges) {
          console.log("finalizeSession: Disabling one-time session...");
          await updateDoc(doc(db, 'site_data', 'config'), { weeklySessions: updatedWeeklySessions });
          currentWeeklySessions = updatedWeeklySessions;
          updatedFields += 1;
        }
      }

      // 5. Create new session date
      console.log("finalizeSession: Calculating next session date...");
      await addRolloverLog('create_new', 'pending', 'מחשב תאריך לסשן הבא...');
      const nextDate = getNextSessionDate(currentWeeklySessions);
      console.log("finalizeSession: Next session date calculated:", nextDate);
      await addRolloverLog('create_new', 'success', `תאריך חדש חושב: ${nextDate}`);
      updatedFields += 1;

      // 6. Reset timer
      console.log("finalizeSession: Resetting timer...");
      await addRolloverLog('reset_timer', 'pending', 'מעדכן תאריך סשן פעיל...');
      // This is combined with reset_attendance in the next step
      await addRolloverLog('reset_timer', 'success', 'תאריך הסשן עודכן');
      updatedFields += 1;

      // 7. Reset attendance
      console.log("finalizeSession: Resetting attendance in active_session...");
      await addRolloverLog('reset_attendance', 'pending', 'מאפס רשימת נוכחות...');
      await setDoc(activeSessionRef, {
        date: nextDate,
        attendees: []
      }, { merge: true });
      await addRolloverLog('reset_attendance', 'success', 'רשימת הנוכחות אופסה');
      updatedFields += 1;

      // 8. Update stats (batch update for members)
      console.log("finalizeSession: Preparing batch update for member stats...");
      await addRolloverLog('update_stats', 'pending', `מעדכן סטטיסטיקות ל-${currentAttendees.length} חברים...`);
      const batch = writeBatch(db);
      for (const uid of currentAttendees) {
        const memberRef = doc(db, 'members', uid);
        batch.update(memberRef, {
          totalAttendance: increment(1)
        });
        updatedFields += 1;
      }
      await addRolloverLog('update_stats', 'success', 'סטטיסטיקות חברים הוכנו לעדכון');

      // 9. Save to DB
      console.log("finalizeSession: Committing batch update...");
      await addRolloverLog('save_db', 'pending', 'מבצע שמירה סופית למסד הנתונים...');
      await batch.commit();
      console.log("finalizeSession: Batch commit successful!");
      await addRolloverLog('save_db', 'success', 'כל השינויים נשמרו בהצלחה');

      const metrics = {
        expectedFields: 5 + currentAttendees.length,
        updatedFields: updatedFields,
        saveStatus: 'success',
        durationMs: Date.now() - startTime
      };
      
      console.log("finalizeSession: Rollover complete!", metrics);
      await addRolloverLog('complete', 'success', 'תהליך הסגירה הושלם בהצלחה', metrics);
    } catch (err: any) {
      console.error('Rollover error:', err);
      await addRolloverLog('complete', 'failed', err.message || 'שגיאה לא ידועה');
      throw err;
    }
  }, [addRolloverLog, coastalWeather]);

  const updateHistoricalSeaTemperatures = useCallback(async () => {
    const db = getDb();
    const historyRef = collection(db, 'weekly_history');
    const snapshot = await getDocs(historyRef);
    
    // Average sea temperatures in Tel Aviv by month (0-indexed: Jan=0, Dec=11)
    const telAvivTemps = [18, 17, 18, 19, 21, 25, 28, 29, 28, 26, 23, 20];
    
    let updatedCount = 0;
    const batch = writeBatch(db);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.date) {
        let dateObj: Date;
        
        // Check if it's a Firestore Timestamp
        if (typeof data.date.toDate === 'function') {
          dateObj = data.date.toDate();
        } else {
          dateObj = new Date(data.date);
        }
        
        // Skip invalid dates
        if (isNaN(dateObj.getTime())) continue;
        
        const monthIndex = dateObj.getMonth();
        const avgTemp = telAvivTemps[monthIndex];
        
        if (avgTemp !== undefined) {
          const currentSeaState = data.seaState || {};
          
          batch.update(doc(db, 'weekly_history', docSnap.id), {
            seaState: {
              ...currentSeaState,
              waterTemp: avgTemp,
              isHistoricalAverage: true
            }
          });
          updatedCount++;
        }
      }
    }
    
    if (updatedCount > 0) {
      await batch.commit();
    }
    
    return updatedCount;
  }, []);

  const batchAddGlossary = useCallback(async (items: Omit<GlossaryTerm, 'id'>[]) => {
    if (hasQuotaError || dbStatus === 'OFFLINE') throw new Error('Database is currently unavailable or quota exceeded.');
    const db = getDb();
    const batch = writeBatch(db);
    items.slice(0, 200).forEach(item => {
      const newDocRef = doc(collection(db, 'glossary'));
      batch.set(newDocRef, item);
    });
    await batch.commit();
    storage.remove('cached_glossary_v2'); // Invalidate cache
  }, [hasQuotaError, dbStatus]);

  const batchAddExercises = useCallback(async (items: Omit<Exercise, 'id'>[]) => {
    if (hasQuotaError || dbStatus === 'OFFLINE') throw new Error('Database is currently unavailable or quota exceeded.');
    const db = getDb();
    const batch = writeBatch(db);
    items.slice(0, 200).forEach(item => {
      const newDocRef = doc(collection(db, 'exercises'));
      batch.set(newDocRef, item);
    });
    await batch.commit();
    storage.remove('cached_exercises_v2'); // Invalidate cache
  }, [hasQuotaError, dbStatus]);

  const batchAddQuotes = useCallback(async (items: Omit<QuoteItem, 'id'>[]) => {
    if (hasQuotaError || dbStatus === 'OFFLINE') throw new Error('Database is currently unavailable or quota exceeded.');
    const db = getDb();
    const batch = writeBatch(db);
    items.slice(0, 200).forEach(item => {
      const newDocRef = doc(collection(db, 'quotes'));
      batch.set(newDocRef, item);
    });
    await batch.commit();
  }, [hasQuotaError, dbStatus]);

  const clearCollection = useCallback(async (collectionName: string) => {
    const db = getDb();
    const unsub = onSnapshot(collection(db, collectionName), async (snap: any) => {
      const batch = writeBatch(db);
      snap.docs.forEach((d: any) => batch.delete(d.ref));
      await batch.commit();
      unsub();
    });
  }, []);

  const updateSiteAssets = useCallback(async (assets: any) => {
    await setDoc(doc(getDb(), 'site_data', 'assets'), assets, { merge: true });
  }, []);

  const updateSiteConfig = useCallback(async (config: Partial<{ 
    navPosition: 'bottom' | 'top',
    home_break: any,
    globalColor: string,
    h1Styles: any,
    weeklySessions: { dayOfWeek: number, time: string, isActive?: boolean }[]
  }>) => {
    setSiteConfig(prev => ({ ...prev, ...config }));
    const db = getDb();
    const batch = writeBatch(db);
    batch.set(doc(db, 'site_data', 'config'), config, { merge: true });
    
    if (config.weeklySessions) {
      const nextSessionDate = getNextSessionDate(config.weeklySessions);
      batch.set(doc(db, 'site_data', 'active_session'), { date: nextSessionDate }, { merge: true });
    }
    
    await batch.commit();
  }, []);

  const updateYearConfig = useCallback(async (config: { startDate: string; endDate: string }) => {
    await setDoc(doc(getDb(), 'site_data', 'year_config'), config);
  }, []);

  const archiveMember = useCallback(async (id: string) => {
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
  }, [hasQuotaError, dbStatus, events]);

  const addMember = useCallback(async (memberData: Omit<Member, 'id'>) => {
    const db = getDb();
    
    // Circuit Breaker check
    if (hasQuotaError || dbStatus === 'OFFLINE') {
      throw new Error('Database is currently unavailable or quota exceeded.');
    }

    const membersRef = collection(db, 'members');
    await addDoc(membersRef, {
      ...memberData,
      email: memberData.email.toLowerCase().trim(),
      joinedAt: memberData.joinedAt || getCurrentDateFormatted(),
      isActive: memberData.isActive !== undefined ? memberData.isActive : true,
      loginCount: 0,
      totalAttendance: 0
    });
  }, [hasQuotaError, dbStatus]);

  const seedInitialAdmin = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = getDb();
      const hashedPassword = await hashPassword('admin123');
      const adminData = {
        firstName: 'מנהל',
        lastName: 'מערכת',
        email: SUPER_ADMIN_EMAIL,
        mobile: '0500000000',
        role: 'Admin' as const,
        password: hashedPassword,
        joinedAt: getCurrentDateFormatted(),
        isActive: true,
        loginCount: 0,
        totalAttendance: 0,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        bio: 'מנהל מערכת ראשוני',
        gender: 'זכר',
        isTemporary: true
      };
      
      await addDoc(collection(db, 'members'), adminData);
      setIsDbEmpty(false);
      return true;
    } catch (err) {
      console.error('Error seeding admin:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue = React.useMemo(() => ({ 
      members, joinRequests, events, news, podcasts, galleryItems, glossary, exercises, quotes, weeklyHistory, siteAssets, siteConfig, coastalWeather, seaStats, yearConfig, attendeeIds, activeSessionDate, isLoading, hasQuotaError, dbStatus, toggleDbStatus,
      updateMember, deleteMember, toggleStatus, toggleRole, resetPassword, approveRequest, rejectRequest,
      addEvent, deleteEvent, updateEvent, toggleEventAttendance, addNews, updateNews, deleteNews, addPodcast, updatePodcast, deletePodcast, deleteGalleryItems, addGalleryItem, toggleSessionAttendance, updateHistory, forceResetSession,
      finalizeSession, updateHistoricalSeaTemperatures, batchAddGlossary, batchAddExercises, batchAddQuotes, clearCollection, updateSiteAssets, updateSiteConfig, updateYearConfig, archiveMember, addMember,
      isDbEmpty, conflictingAdmins, seedInitialAdmin
    }), [
      members, joinRequests, events, news, podcasts, galleryItems, glossary, exercises, quotes, weeklyHistory, siteAssets, siteConfig, coastalWeather, seaStats, yearConfig, attendeeIds, activeSessionDate, isLoading, hasQuotaError, dbStatus, toggleDbStatus,
      updateMember, deleteMember, toggleStatus, toggleRole, resetPassword, approveRequest, rejectRequest,
      addEvent, deleteEvent, updateEvent, toggleEventAttendance, addNews, updateNews, deleteNews, addPodcast, updatePodcast, deletePodcast, deleteGalleryItems, addGalleryItem, toggleSessionAttendance, updateHistory, forceResetSession,
      finalizeSession, updateHistoricalSeaTemperatures, batchAddGlossary, batchAddExercises, batchAddQuotes, clearCollection, updateSiteAssets, updateSiteConfig, updateYearConfig, archiveMember, addMember,
      isDbEmpty, conflictingAdmins, seedInitialAdmin
    ]);

  return (
    <DataContext.Provider value={contextValue}>
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