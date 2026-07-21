import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { safeLocalStorage } from '../utils/storage';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, increment, getDoc, getDocs, orderBy, limit, addDoc, writeBatch, Timestamp, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { ref, deleteObject, getMetadata } from 'firebase/storage';
import { 
  getDb, 
  trackedGetDocs, 
  trackedGetDoc,
  trackedAddDoc,
  trackedSetDoc,
  trackedUpdateDoc,
  trackedDeleteDoc,
  trackedOnSnapshot,
  setDbStatus, 
  db_status, 
  getStorageInstance,
  OperationType,
  FirestoreErrorInfo
} from '../services/firebase';
import { formatDate, getCurrentDateFormatted } from '../utils/dateUtils';
import { Member, JoinRequest, Event, NewsItem, GalleryItem, GlossaryTerm, QuoteItem, Exercise, Podcast, PerformanceScore, SurfCall } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { hashPassword } from '../utils/crypto';
import { initializeStorageStats, syncStorageOnDelete } from '../utils/storageStats';
import { storage } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';
import { getNextSessionDate } from '../services/rolloverService';

interface SiteAssets {
  headers: string[];
  uiImages: string[];
  fonts: {
    [key: string]: any[];
  };
  staticHeroImage: string;
  loginBg: string;
  surfboardModels: {
    [key: string]: string;
  };
  [key: string]: any;
}

interface DataContextType {
  members: Member[];
  joinRequests: JoinRequest[];
  events: Event[];
  surfCalls: SurfCall[];
  news: NewsItem[];
  podcasts: Podcast[];
  galleryItems: GalleryItem[];
  glossary: GlossaryTerm[];
  exercises: Exercise[];
  quotes: QuoteItem[];
  performanceScores: PerformanceScore[];
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
  selectedStationId: string;
  setSelectedStationId: (id: string) => void;
  seaStats: any | null;
  yearConfig: { startDate: string; endDate: string } | null;
  attendeeIds: string[];
  activeSessionDate: string;
  isLoading: boolean;
  hasQuotaError: boolean;
  connectionError: string | null;
  retryConnection: () => void;
  dbStatus: 'ONLINE' | 'OFFLINE';
  toggleDbStatus: () => void;
  updateMember: (member: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  toggleRole: (id: string, requesterEmail?: string) => Promise<void>;
  approveRequest: (id: string) => Promise<{ firstName: string; lastName: string; email: string; mobile: string; tempPassword: string } | null>;
  rejectRequest: (id: string) => Promise<void>;
  addEvent: (details: Omit<Event, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  archiveEvent: (id: string) => Promise<void>;
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
  finalizeSession: (saveWeather?: boolean) => Promise<void>;
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
  addPerformanceScore: (score: Omit<PerformanceScore, 'id'>) => Promise<void>;
  updatePerformanceScore: (score: PerformanceScore) => Promise<void>;
  isDbEmpty: boolean;
  conflictingAdmins: Member[];
  seedInitialAdmin: () => Promise<boolean>;
  seedInitialAssets: () => Promise<void>;
  addSurfCall: (call: Omit<SurfCall, 'id'>) => Promise<string>;
  toggleSurfCallAttendance: (callId: string, userId: string, userName: string, avatar?: string) => Promise<void>;
  archiveSurfCall: (callId: string) => Promise<void>;
  addSurfCallComment: (callId: string, userId: string, userName: string, avatar: string | undefined, text: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, firebaseUser } = useAuth();
  const { showAlert } = useModal();
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [surfCalls, setSurfCalls] = useState<SurfCall[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [performanceScores, setPerformanceScores] = useState<PerformanceScore[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [siteAssets, setSiteAssets] = useState<SiteAssets>({
    headers: [],
    uiImages: [],
    fonts: {
      yehudaLight: [],
      yehudaBold: [],
      miriwin: [],
      danaYad: []
    },
    staticHeroImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1920&auto=format&fit=crop',
    loginBg: 'https://images.unsplash.com/photo-1505972186483-70ff335e0d78?q=80&w=1920&auto=format&fit=crop',
    surfboardModels: {}
  });
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
  const [selectedStationId, setSelectedStationId] = useState<string>("178");
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

  const seedActiveSession = useCallback(async () => {
    if (currentUser?.role !== 'Admin') return;
    try {
      const db = getDb();
      const activeSessionRef = doc(db, 'site_data', 'active_session');
      const snap = await trackedGetDoc(activeSessionRef);
      if (!snap.exists()) {
        console.log("DataContext: Seeding missing active_session doc");
        await trackedSetDoc(activeSessionRef, {
          attendees: [],
          date: getNextSessionDate(siteConfigRef.current?.weeklySessions),
          lastUpdated: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("DataContext: Failed to seed active_session", err);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role === 'Admin' && !isLoading) {
      seedActiveSession();
    }
  }, [currentUser?.role, isLoading, seedActiveSession]);
  const [hasQuotaError, setHasQuotaError] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [dbStatus, setDbStatusState] = useState<'ONLINE' | 'OFFLINE'>(() => {
    const saved = safeLocalStorage.getItem('kill_switch_active');
    return saved === 'true' ? 'OFFLINE' : 'ONLINE';
  });

  const toggleDbStatus = useCallback(() => {
    const newStatus = dbStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setDbStatusState(newStatus);
    setDbStatus(newStatus);
  }, [dbStatus]);



  const handleFirestoreError = useCallback((error: any, operationType: OperationType = OperationType.WRITE, path: string | null = null) => {
    // Ignore transient connection issues or intentional kill switch
    if (error.code === 'unavailable' || error.message === 'QUOTA_EXCEEDED_OR_KILL_SWITCH') {
      if (error.code === 'unavailable') {
        console.warn("Firestore is temporarily unavailable. Operating in offline mode.");
      } else {
        console.warn("Database is OFFLINE (Kill Switch). Blocking request.");
      }
      return;
    }

    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: firebaseUser?.uid,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified,
        isAnonymous: firebaseUser?.isAnonymous,
        tenantId: firebaseUser?.tenantId,
        providerInfo: firebaseUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };

    console.error("Firestore Error:", JSON.stringify(errInfo));
    
    if (error.code === 'resource-exhausted' || error.message?.includes('429') || error.message?.includes('quota')) {
      setHasQuotaError(true);
      showAlert("שגיאת מכסה (Quota Exceeded). המערכת עברה למצב לא מקוון זמנית.", "שגיאת מערכת");
    } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || error.message?.includes('client is offline')) {
      setConnectionError(error.code || 'offline');
    }

    throw new Error(JSON.stringify(errInfo));
  }, [showAlert, firebaseUser]);

  // 1. Sync db_status with firebase.ts
  useEffect(() => {
    if (db_status !== dbStatus) {
      setDbStatus(dbStatus);
    }
  }, [dbStatus]);

  // 2. Coastal Weather Fetcher (Interval)
  useEffect(() => {
    console.log("Coastal weather useEffect running, dbStatus:", dbStatus, "currentUser:", currentUser);
    // Removed the dbStatus check to ensure it runs
    
    let isMounted = true;
    let retryTimeoutId: NodeJS.Timeout;

    const fetchCoastalWeather = async (retryCount = 0) => {
      if (!isMounted) return;
      console.log(`Starting coastal weather fetch (Attempt ${retryCount + 1}) for station ${selectedStationId}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        // Silent timeout
        controller.abort();
      }, 15000); // 15s timeout

      try {
        const apiUrl = `/api/coastal-weather?stationId=${selectedStationId}`;
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!isMounted) return;

        if (!response.ok) {
          console.error(`API Error: ${response.status}`);
          setIsLoading(false);
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          if (text.includes("<title>Starting Server...</title>")) {
            console.warn("Server is starting up, retrying coastal weather fetch later...");
            throw new Error("SERVER_STARTING");
          } else {
            console.error("Non-JSON response body:", text.substring(0, 500));
            throw new Error(`Received non-JSON response from server: ${contentType}`);
          }
        }

        const data = await response.json();
        if (!isMounted) return;
        console.log("DataContext - Coastal weather data received:", data);
        setCoastalWeather(data);
        setIsLoading(false);

        // Centralized Side Effects: Update stats and log history (Admins only for history)
        const db = getDb();
        const statsRef = doc(db, 'seaConditionsStats', 'current');
        const statsDoc = await getDoc(statsRef);
        
        if (!isMounted) return;

        if (!statsDoc.exists()) {
          await setDoc(statsRef, {
            maxWaveHeight: data.waveHeight,
            minWaveHeight: data.waveHeight,
            maxWaterTemp: data.waterTemp,
            minWaterTemp: data.waterTemp,
            maxWindSpeed: data.windSpeed,
            minWindSpeed: data.windSpeed,
            maxUvIndex: data.uvIndex,
            minUvIndex: data.uvIndex
          });
        } else {
          const currentStats = statsDoc.data();
          const needsUpdate = 
            data.waveHeight > currentStats.maxWaveHeight ||
            data.waveHeight < currentStats.minWaveHeight ||
            data.waterTemp > currentStats.maxWaterTemp ||
            data.waterTemp < currentStats.minWaterTemp ||
            data.windSpeed > currentStats.maxWindSpeed ||
            data.windSpeed < currentStats.minWindSpeed ||
            data.uvIndex > currentStats.maxUvIndex ||
            data.uvIndex < currentStats.minUvIndex;

          if (needsUpdate) {
            await updateDoc(statsRef, {
              maxWaveHeight: Math.max(currentStats.maxWaveHeight, data.waveHeight),
              minWaveHeight: Math.min(currentStats.minWaveHeight, data.waveHeight),
              maxWaterTemp: Math.max(currentStats.maxWaterTemp, data.waterTemp),
              minWaterTemp: Math.min(currentStats.minWaterTemp, data.waterTemp),
              maxWindSpeed: Math.max(currentStats.maxWindSpeed, data.windSpeed),
              minWindSpeed: Math.min(currentStats.minWindSpeed, data.windSpeed),
              maxUvIndex: Math.max(currentStats.maxUvIndex, data.uvIndex),
              minUvIndex: Math.min(currentStats.minUvIndex, data.uvIndex)
            });
          }
        }

        // Log to history if Admin - only once per hour to prevent spam
        if (currentUser?.role === 'Admin') {
          const now = new Date();
          const hourKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}T${now.getHours()}:00:00`;
          const lastLogKey = 'last_sea_condition_log_hour';
          const lastLogHour = safeLocalStorage.getItem(lastLogKey);

          if (lastLogHour !== hourKey) {
            trackedAddDoc(collection(db, 'seaConditions'), {
              timestamp: now.toISOString(),
              waveHeight: data.waveHeight,
              waterTemp: data.waterTemp,
              windSpeed: data.windSpeed,
              uvIndex: data.uvIndex
            }).then(() => {
              safeLocalStorage.setItem(lastLogKey, hourKey);
            }).catch(err => {
              console.error("Failed to log sea conditions:", err);
            });
          }
        }
      } catch (e: any) {
        clearTimeout(timeoutId);
        if (!isMounted) return;
        if (e.name === 'AbortError') {
          // Silent timeout
        } else if (e.message === 'SERVER_STARTING') {
          // Silent retry, server is just starting
        } else {
          console.warn("Failed to fetch coastal weather - network error or server down:", e);
        }
        
        // Retry logic for transient errors
        if (retryCount < 3) {
          console.log(`Retrying coastal weather fetch in 5 seconds...`);
          retryTimeoutId = setTimeout(() => fetchCoastalWeather(retryCount + 1), 5000);
        } else {
          setIsLoading(false); // Ensure loading stops on final error
        }
      }
    };

    fetchCoastalWeather();
    const weatherInterval = setInterval(() => fetchCoastalWeather(0), 1000 * 60 * 15);
    return () => {
      isMounted = false;
      clearInterval(weatherInterval);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [dbStatus, currentUser?.id, currentUser?.role, selectedStationId]);

  // 3. Public Site Data Listeners
  useEffect(() => {
    if (dbStatus === 'OFFLINE') return;
    const db = getDb();

    let configLoaded = false;
    let assetsLoaded = false;
    const checkPublicDataReady = () => {
      if (!firebaseUser?.uid && configLoaded && assetsLoaded) {
        setIsLoading(false);
      }
    };

    const unsubSeaStats = trackedOnSnapshot(doc(db, 'seaConditionsStats', 'current'), (doc) => {
      if (doc.exists()) setSeaStats(doc.data());
    });

    const unsubAssets = trackedOnSnapshot(doc(db, 'site_data', 'assets'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SiteAssets;
        // Ensure default structure exists even if document is partially populated
        const sanitizedData: SiteAssets = {
          ...data,
          headers: data.headers || [],
          uiImages: data.uiImages || [],
          fonts: data.fonts || {
            yehudaLight: [],
            yehudaBold: [],
            miriwin: [],
            danaYad: []
          },
          surfboardModels: data.surfboardModels || {}
        };
        console.log('Site assets updated from Firestore:', sanitizedData);
        setSiteAssets(sanitizedData);
      } else {
        // Seed initial assets if they don't exist
        console.log('Site assets do not exist, seeding...');
        seedInitialAssets();
      }
      assetsLoaded = true;
      checkPublicDataReady();
    });

    const unsubConfig = trackedOnSnapshot(doc(db, 'site_data', 'config'), (doc) => {
      if (doc.exists()) {
        setSiteConfig(doc.data() as any);
      }
      configLoaded = true;
      checkPublicDataReady();
    });

    const unsubYearConfig = trackedOnSnapshot(doc(db, 'site_data', 'year_config'), (doc) => {
      if (doc.exists()) setYearConfig(doc.data() as { startDate: string; endDate: string });
    });

    // Safety timeout for public data
    const publicDataTimeout = setTimeout(() => {
      if (!firebaseUser?.uid) {
        setIsLoading(false);
      }
    }, 4000);

    return () => {
      clearTimeout(publicDataTimeout);
      unsubSeaStats();
      unsubAssets();
      unsubConfig();
      unsubYearConfig();
    };
  }, [dbStatus, firebaseUser?.uid, handleFirestoreError]);

  // 4. Auth-dependent Data Listeners
  useEffect(() => {
    if (dbStatus === 'OFFLINE' || !currentUser) {
      setIsLoading(false);
      return;
    }

    const db = getDb();

    // Initial Placeholder from Cache
    const cachedMembers = storage.get('cached_members_v3');
    if (cachedMembers) setMembers(cachedMembers);
    
    const cachedHistory = storage.get('cached_history_v3');
    if (cachedHistory) setWeeklyHistory(cachedHistory);

    // One-time fetches
    const fetchData = async () => {
      try {
        const cachedGlossary = storage.get('cached_glossary_v2');
        if (cachedGlossary) {
          setGlossary(cachedGlossary);
        } else {
          const glSnap = await trackedGetDocs(collection(db, 'glossary'));
          const glData = glSnap.docs.map(d => ({ id: d.id, ...d.data() } as GlossaryTerm));
          setGlossary(glData);
          storage.set('cached_glossary_v2', glData, 24);
        }

        const cachedExercises = storage.get('cached_exercises_v2');
        if (cachedExercises) {
          setExercises(cachedExercises);
        } else {
          const exSnap = await trackedGetDocs(collection(db, 'exercises'));
          const exData = exSnap.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
          setExercises(exData);
          storage.set('cached_exercises_v2', exData, 24);
        }
        
        const qSnap = await trackedGetDocs(collection(db, 'quotes'));
        setQuotes(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuoteItem)));
      } catch (e: any) {
        if (e.message !== 'QUOTA_EXCEEDED_OR_KILL_SWITCH') handleFirestoreError(e);
      }
    };
    fetchData();

    // Real-time listeners
    const unsubMembers = trackedOnSnapshot(query(collection(db, 'members'), limit(1000)), (snapshot) => {
      const rawDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers(rawDocs);
      setIsDbEmpty(snapshot.empty);
      storage.set('cached_members_v3', rawDocs, 2 / 60);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`DataContext: Loaded ${rawDocs.length} members.`);
        const yuval = rawDocs.find(m => m.email === 'yuval.shalev@gmail.com');
        if (yuval) console.log('DataContext: Found Yuval Luxembourg in members:', yuval);
      }
    });

    const unsubHistory = trackedOnSnapshot(query(collection(db, 'weekly_history'), orderBy('date', 'desc'), limit(1000)), (snapshot) => {
      const hData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setWeeklyHistory(hData);
      storage.set('cached_history_v3', hData, 2 / 60);
    });

    
    const unsubSurfCalls = trackedOnSnapshot(query(collection(db, 'surf_calls')), (snapshot) => {
      setSurfCalls(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SurfCall)));
    });

    const unsubEvents = trackedOnSnapshot(query(collection(db, 'events'), orderBy('date', 'desc'), limit(200)), (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    });
    
    const unsubNews = trackedOnSnapshot(query(collection(db, 'news'), orderBy('date', 'desc'), limit(200)), (snapshot) => {
      setNews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
    });
    
    const unsubPodcasts = trackedOnSnapshot(query(collection(db, 'podcasts'), orderBy('publishedAt', 'desc'), limit(200)), (snapshot) => {
      setPodcasts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Podcast)));
    });
    
    const unsubGallery = trackedOnSnapshot(query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
      setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
    });

    let unsubPerformance: (() => void) | null = null;
    if (currentUser.role === 'Admin' || currentUser.role === 'Instructor') {
      unsubPerformance = trackedOnSnapshot(query(collection(db, 'performance_scores'), limit(500)), (snapshot) => {
        const scores = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PerformanceScore));
        console.log('performanceScores updated:', scores);
        setPerformanceScores(scores);
      });
    } else if (currentUser.role === 'Member' && firebaseUser) {
      // Members only see their own scores
      const myScoresQuery = query(collection(db, 'performance_scores'), where('memberId', '==', firebaseUser.uid), limit(100));
      unsubPerformance = trackedOnSnapshot(myScoresQuery, (snapshot) => {
        const scores = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PerformanceScore));
        setPerformanceScores(scores);
      });
    }

    const unsubAttendees = trackedOnSnapshot(doc(db, 'site_data', 'active_session'), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setAttendeeIds(data.attendees || []);
        
        if (data.date && new Date(data.date) < new Date()) {
          if (finalizeSessionRef.current) finalizeSessionRef.current();
        } else {
          setActiveSessionDate(data.date || getNextSessionDate(siteConfigRef.current?.weeklySessions));
        }
        setConnectionError(null);
      }
      setIsLoading(false);
    }, (err) => {
      setConnectionError(err.code);
      setIsLoading(false);
    });

    let unsubRequests: (() => void) | null = null;
    if (currentUser.role === 'Admin') {
      unsubRequests = trackedOnSnapshot(query(collection(db, 'joinRequests'), limit(200)), (snapshot) => {
        setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest)));
      });
      initializeStorageStats();
    }

    const timeoutId = setTimeout(() => setIsLoading(false), 4000);

    return () => {
      clearTimeout(timeoutId);
      unsubMembers();
      unsubHistory();
      unsubEvents();
      unsubSurfCalls();
      unsubNews();
      unsubPodcasts();
      unsubGallery();
      if (unsubPerformance) unsubPerformance();
      unsubAttendees();
      if (unsubRequests) unsubRequests();
    };
  }, [dbStatus, currentUser?.id, currentUser?.role, firebaseUser?.uid, handleFirestoreError]);

  const updateMember = useCallback(async (member: Member) => {
    const { id, ...data } = member;
    const db = getDb();
    
    // Normalize email if present
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
      
      // Check if email already exists for a different user
      const q = query(collection(db, 'members'), where('email', '==', data.email), limit(2));
      const snapshot = await trackedGetDocs(q);
      
      const existingWithEmail = snapshot.docs.find(doc => doc.id !== id);
      if (existingWithEmail) {
        throw new Error('משתמש עם אימייל זה כבר קיים במערכת.');
      }
    }
    
    // Delta Checking: Only update if data actually changed
    const existing = members.find(m => m.id === id);
    if (existing) {
      const hasChanged = Object.keys(data).some(key => (data as any)[key] !== (existing as any)[key]);
      if (!hasChanged) {
        console.log("DataContext: No changes detected for member", id, "- skipping update.");
        return;
      }
    }

    try {
      await trackedUpdateDoc(doc(db, 'members', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${id}`);
    }
  }, [members, handleFirestoreError]);

  const deleteMember = useCallback(async (id: string) => {
    await trackedDeleteDoc(doc(getDb(), 'members', id));
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
        if (member.role === 'Member') nextRole = 'Volunteer';
        else if (member.role === 'Volunteer') nextRole = 'Instructor';
        else if (member.role === 'Instructor') nextRole = 'Admin';
        else nextRole = 'Member';
      } else {
        // Regular Admin: Only toggle between Member, Volunteer and Instructor
        if (member.role === 'Admin') {
          throw new Error('Unauthorized: Only Super Admin can change Admin roles');
        }
        if (member.role === 'Member') nextRole = 'Volunteer';
        else if (member.role === 'Volunteer') nextRole = 'Instructor';
        else nextRole = 'Member';
      }
      
      await updateDoc(doc(getDb(), 'members', id), { role: nextRole });
    }
  }, [members]);

  const approveRequest = useCallback(async (id: string) => {
    console.log('DataContext: approveRequest starting for id:', id);
    try {
      const db = getDb();
      const requestRef = doc(db, 'joinRequests', id);
      const memberRef = doc(db, 'members', id);
      
      // Get the request data first to check email
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const reqData = requestSnap.data() as JoinRequest;
        const normalizedEmail = (reqData.email || '').toLowerCase().trim();
        
        // Check if email already exists in members collection
        const emailQuery = query(collection(db, 'members'), where('email', '==', normalizedEmail), limit(1));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          throw new Error('משתמש עם אימייל זה כבר קיים במערכת.');
        }
      }
      
      const result = await runTransaction(db, async (transaction) => {
        const txRequestSnap = await transaction.get(requestRef);
        const txMemberSnap = await transaction.get(memberRef);
        
        if (!txRequestSnap.exists()) {
          // If member exists but request doesn't, it was likely already approved
          if (txMemberSnap.exists()) {
            console.log('DataContext: Member already exists, likely already approved.');
            return { alreadyApproved: true };
          }
          return null;
        }
        
        const reqData = txRequestSnap.data() as JoinRequest;
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
          gender: reqData.gender || 'מעדיפ/ה לא לציין',
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

  
  const addSurfCall = useCallback(async (call: Omit<SurfCall, 'id'>) => {
    try {
      const cleanParticipants = call.participantsJoined.map(p => {
        const cleanP = { ...p };
        if (cleanP.avatar === undefined) delete cleanP.avatar;
        return cleanP;
      });
      const cleanCall = { ...call, participantsJoined: cleanParticipants };
      
      const docRef = await addDoc(collection(getDb(), 'surf_calls'), cleanCall);
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding surf call:', err);
      throw err;
    }
  }, []);

  const toggleSurfCallAttendance = useCallback(async (callId: string, memberId: string, memberName: string, avatar?: string) => {
    try {
      const callRef = doc(getDb(), 'surf_calls', callId);
      const callDoc = await getDoc(callRef);
      if (!callDoc.exists()) return;
      
      const call = callDoc.data() as SurfCall;
      const joined = call.participantsJoined || [];
      const cancelled = call.participantsCancelled || [];
      
      const isAttending = joined.some((p: any) => p.id === memberId);
      
      let newJoined = [...joined];
      let newCancelled = [...cancelled];
      
      if (isAttending) {
        newJoined = newJoined.filter((p: any) => p.id !== memberId);
        if (!newCancelled.includes(memberId)) {
          newCancelled.push(memberId);
        }
      } else {
        const newParticipant: any = { id: memberId, name: memberName };
        if (avatar !== undefined) newParticipant.avatar = avatar;
        newJoined.push(newParticipant);
        newCancelled = newCancelled.filter(id => id !== memberId);
      }
      
      // Clean up any undefined values in the entire array before saving
      const cleanJoined = newJoined.map(p => {
        const cleanP: Record<string, any> = { ...p };
        Object.keys(cleanP).forEach(key => cleanP[key] === undefined && delete cleanP[key]);
        return cleanP;
      });
      
      await updateDoc(callRef, {
        participantsJoined: cleanJoined,
        participantsCancelled: newCancelled
      });
    } catch (err: any) {
      console.error('Error toggling surf call attendance:', err);
      let errMsg = err.message || String(err);
      if (errMsg.startsWith('{')) {
        try {
          const parsed = JSON.parse(errMsg);
          errMsg = parsed.error || errMsg;
        } catch (e) {}
      }
      showAlert('שגיאה ברישום לקריאת הגלישה: ' + errMsg);
      throw err;
    }
  }, [showAlert]);

  
  const addSurfCallComment = useCallback(async (callId: string, userId: string, userName: string, avatar: string | undefined, text: string) => {
    try {
      const callRef = doc(getDb(), 'surf_calls', callId);
      const callDoc = await getDoc(callRef);
      if (!callDoc.exists()) return;
      
      const call = callDoc.data() as SurfCall;
      const comments = call.comments || [];
      const newComment = {
        id: Math.random().toString(36).substring(2, 9),
        userId,
        userName,
        avatar,
        text,
        timestamp: new Date().toISOString()
      };
      
      await updateDoc(callRef, {
        comments: [...comments, newComment]
      });
    } catch (err: any) {
      console.error('Error adding comment:', err);
      let errMsg = err.message || String(err);
      if (errMsg.startsWith('{')) {
        try {
          const parsed = JSON.parse(errMsg);
          errMsg = parsed.error || errMsg;
        } catch (e) {}
      }
      showAlert('שגיאה בהוספת תגובה: ' + errMsg);
      throw err;
    }
  }, [showAlert]);

  const archiveSurfCall = useCallback(async (callId: string) => {
    try {
      const callRef = doc(getDb(), 'surf_calls', callId);
      await updateDoc(callRef, { isArchived: true });
    } catch (err) {
      console.error('Error archiving surf call:', err);
      throw err;
    }
  }, []);

const addEvent = useCallback(async (details: Omit<Event, 'id'>) => {
    await trackedAddDoc(collection(getDb(), 'events'), details);
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await trackedDeleteDoc(doc(getDb(), 'events', id));
  }, []);

  const archiveEvent = useCallback(async (id: string) => {
    await trackedUpdateDoc(doc(getDb(), 'events', id), { isArchived: true });
  }, []);

  const updateEvent = useCallback(async (event: Event) => {
    const { id, ...data } = event;
    await trackedUpdateDoc(doc(getDb(), 'events', id), data);
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
    
    // Check if user is the creator and trying to cancel
    if (isAttending && event.creatorId === userId) {
      showAlert("מארגן האירוע אינו יכול לבטל את השתתפותו", "שים לב");
      return;
    }

    await trackedUpdateDoc(doc(getDb(), 'events', eventId), {
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
    console.log("toggleSessionAttendance: Triggered for user", userId);
    const member = members.find(m => m.id === userId);
    if (!member || member.isActive === false || (member as any).status === 'suspended' || (member as any).status === 'left') {
      console.warn("toggleSessionAttendance: Member not eligible", member);
      showAlert("משתמש שאינו פעיל או שאינו קיים אינו יכול לאשר הגעה", "שגיאה");
      return;
    }
    
    try {
      const isCurrentlyAttending = attendeeIds.includes(userId);
      console.log("toggleSessionAttendance: isCurrentlyAttending =", isCurrentlyAttending);
      
      const activeSessionRef = doc(getDb(), 'site_data', 'active_session');
      
      // We MUST ONLY update the 'attendees' field to comply with Firestore rules for non-admins
      if (isCurrentlyAttending) {
        console.log("toggleSessionAttendance: Removing user from attendees");
        await trackedUpdateDoc(activeSessionRef, { 
          attendees: arrayRemove(userId)
        });
      } else {
        console.log("toggleSessionAttendance: Adding user to attendees");
        await trackedUpdateDoc(activeSessionRef, { 
          attendees: arrayUnion(userId)
        });
      }
      console.log("toggleSessionAttendance: Success");
    } catch (error: any) {
      console.error("toggleSessionAttendance: Error", error);
      showAlert(`שגיאה בעדכון הגעה: ${error.message || 'שגיאת הרשאה או חיבור'}`, "שגיאה");
    }
  }, [members, attendeeIds, showAlert]);

  const updateHistory = useCallback(async (id: string, participantIds: string[]) => {
    const db = getDb();
    
    // Find the previous session data to calculate who was added/removed
    const previousSession = weeklyHistory.find(s => s.id === id);
    const previousParticipants = previousSession?.participantIds || [];
    
    const addedParticipants = participantIds.filter((pid: string) => !previousParticipants.includes(pid));
    const removedParticipants = previousParticipants.filter((pid: string) => !participantIds.includes(pid));
    
    const batch = writeBatch(db);
    
    // Update the history document
    batch.update(doc(db, 'weekly_history', id), {
      participantIds,
      participantsCount: participantIds.length
    });
    
    // Update totalAttendance for added participants
    for (const uid of addedParticipants) {
      batch.update(doc(db, 'members', uid), {
        totalAttendance: increment(1)
      });
    }
    
    // Update totalAttendance for removed participants
    for (const uid of removedParticipants) {
      batch.update(doc(db, 'members', uid), {
        totalAttendance: increment(-1)
      });
    }
    
    await batch.commit();
  }, [weeklyHistory]);

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

  const isFinalizingRef = useRef(false);
  const finalizeSessionRef = useRef<(saveWeather?: boolean) => Promise<void>>();
  
  const finalizeSession = useCallback(async (saveWeather: boolean = true) => {
    if (isFinalizingRef.current) {
      console.log("finalizeSession: Already in progress, skipping...");
      return;
    }
    
    if (hasQuotaError) {
      console.warn("finalizeSession: Quota error detected, skipping...");
      return;
    }
    
    isFinalizingRef.current = true;
    console.log("finalizeSession: Starting process...");
    const db = getDb();
    const startTime = Date.now();
    let updatedFields = 0;
    
    try {
      // 1. Start
      console.log("finalizeSession: Logging start...");
      // Reduced logging: only log start and end
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
      // Generate a deterministic ID based on the session date to prevent duplicate sessions 
      // in case of Race Conditions from multiple clients triggering rollover simultaneously.
      const sessionDateStr = currentDate || new Date().toISOString();
      const deterministicId = new Date(sessionDateStr).toISOString().split('T')[0]; // e.g., "2026-03-19"
      
      const historyDocRef = doc(db, 'weekly_history', deterministicId);
      
      await setDoc(historyDocRef, {
        date: sessionDateStr,
        participantIds: currentAttendees,
        participantsCount: currentAttendees.length,
        status: 'finalized',
        finalizedAt: new Date().toISOString(),
        ...(saveWeather ? { seaState: coastalWeather || null } : {})
      }, { merge: true });
      
      await addRolloverLog('archive', 'success', 'הסשן נשמר בהיסטוריה');
      if (saveWeather) {
        await addRolloverLog('save_sea_state', 'success', 'נתוני הים נשמרו');
      } else {
        await addRolloverLog('save_sea_state', 'success', 'נבחר שלא לשמור נתוני ים');
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
      const nextDate = getNextSessionDate(currentWeeklySessions);
      console.log("finalizeSession: Next session date calculated:", nextDate);
      await addRolloverLog('create_new', 'success', 'סשן חדש הוקם');
      updatedFields += 1;

      // 6. Reset timer
      console.log("finalizeSession: Resetting timer...");
      // This is combined with reset_attendance in the next step
      await addRolloverLog('reset_timer', 'success', 'טיימר אופס');
      updatedFields += 1;

      // 7. Reset attendance
      console.log("finalizeSession: Resetting attendance in active_session...");
      await setDoc(activeSessionRef, {
        date: nextDate,
        attendees: []
      }, { merge: true });
      await addRolloverLog('reset_attendance', 'success', 'רשימת משתתפים אופסה');
      updatedFields += 1;

      // 8. Update stats (batch update for members)
      console.log("finalizeSession: Preparing batch update for member stats...");
      await addRolloverLog('update_stats', 'success', 'סטטיסטיקות עודכנו');
      const batch = writeBatch(db);
      for (const uid of currentAttendees) {
        const memberRef = doc(db, 'members', uid);
        batch.update(memberRef, {
          totalAttendance: increment(1)
        });
        updatedFields += 1;
      }

      // 9. Save to DB
      console.log("finalizeSession: Committing batch update...");
      await batch.commit();
      console.log("finalizeSession: Batch commit successful!");
      await addRolloverLog('save_db', 'success', 'עדכונים נשמרו במסד הנתונים');

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
    } finally {
      isFinalizingRef.current = false;
    }
  }, [addRolloverLog, coastalWeather]);

  // Update the ref whenever finalizeSession changes
  useEffect(() => {
    finalizeSessionRef.current = finalizeSession;
  }, [finalizeSession]);

  // 5. Event Auto-Archiver
  useEffect(() => {
    if (dbStatus === 'OFFLINE' || !events.length) return;

    const checkEvents = async () => {
      const now = new Date();
      const activeEvents = events.filter(e => !e.isArchived);

      for (const event of activeEvents) {
        if (!event.date || !event.time) continue;
        
        const eventDateTime = new Date(`${event.date}T${event.time}:00`);
        if (isNaN(eventDateTime.getTime())) continue;
        
        if (now >= eventDateTime) {
          console.log(`Event ${event.id} has started. Archiving and updating stats...`);
          
          try {
            const db = getDb();
            const eventRef = doc(db, 'events', event.id);
            
            await runTransaction(db, async (transaction) => {
              // --- ALL READS FIRST ---
              const eventDoc = await transaction.get(eventRef);
              if (!eventDoc.exists()) return;
              
              const eventData = eventDoc.data();
              if (eventData.isArchived) {
                // Already archived by another client
                return;
              }

              let memberDocs: any[] = [];
              if (eventData.attendees && eventData.attendees.length > 0) {
                const memberRefs = eventData.attendees.map((uid: string) => doc(db, 'members', uid));
                // Perform all reads before any writes
                memberDocs = await Promise.all(memberRefs.map((ref: any) => transaction.get(ref)));
              }
              
              // --- ALL WRITES SECOND ---
              // 1. Mark as archived
              transaction.update(eventRef, { isArchived: true });
              
              // 2. Add to weekly_history
              const historyRef = doc(collection(db, 'weekly_history'));
              transaction.set(historyRef, {
                date: eventDateTime.toISOString(),
                participantIds: eventData.attendees || [],
                participantsCount: (eventData.attendees || []).length,
                status: 'finalized',
                finalizedAt: new Date().toISOString(),
                seaState: coastalWeather || null,
                isEvent: true,
                title: eventData.title || 'אירוע קהילה'
              });
              
              // 3. Update attendees stats
              memberDocs.forEach((memberDoc) => {
                if (memberDoc.exists()) {
                  transaction.update(memberDoc.ref, {
                    totalAttendance: increment(1)
                  });
                }
              });
            });
            console.log(`Event ${event.id} successfully auto-archived and stats updated.`);
          } catch (error) {
            console.error(`Failed to auto-archive event ${event.id}:`, error);
          }
        }
      }
    };

    const intervalId = setInterval(checkEvents, 60000); // Check every minute
    checkEvents(); // Check immediately on mount/update

    return () => clearInterval(intervalId);
  }, [events, dbStatus, coastalWeather]);

  const updateSiteAssets = useCallback(async (assets: any) => {
    console.log('Updating site assets in Firestore:', assets);
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

    const path = 'members';
    try {
      const membersRef = collection(db, path);
      const normalizedEmail = memberData.email.toLowerCase().trim();
      
      // Check if email already exists
      const q = query(membersRef, where('email', '==', normalizedEmail), limit(1));
      const snapshot = await trackedGetDocs(q);
      
      if (!snapshot.empty) {
        throw new Error('משתמש עם אימייל זה כבר קיים במערכת.');
      }

      await addDoc(membersRef, {
        ...memberData,
        email: normalizedEmail,
        joinedAt: memberData.joinedAt || getCurrentDateFormatted(),
        isActive: memberData.isActive !== undefined ? memberData.isActive : true,
        loginCount: 0,
        totalAttendance: 0
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }, [hasQuotaError, dbStatus, handleFirestoreError]);

  const addPerformanceScore = useCallback(async (score: Omit<PerformanceScore, 'id'>) => {
    const db = getDb();
    const path = 'performance_scores';
    try {
      await addDoc(collection(db, path), {
        ...score,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }, [handleFirestoreError]);

  const updatePerformanceScore = useCallback(async (score: PerformanceScore) => {
    const { id, ...data } = score;
    const db = getDb();
    const path = `performance_scores/${id}`;
    try {
      await updateDoc(doc(db, 'performance_scores', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }, [handleFirestoreError]);

  const seedInitialAssets = useCallback(async () => {
    const db = getDb();
    const storageBucket = 'body-line-67637.firebasestorage.app';
    const uiPath = 'assets%2Fui';
    const getStorageUrl = (filename: string) => `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${uiPath}%2F${filename}?alt=media`;

    const initialAssets: SiteAssets = {
      starfish: '',
      penguin: '',
      mantaRay: '',
      shark: '',
      orca: '',
      cork: '',
      staticHeroImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1920&auto=format&fit=crop',
      loginBg: 'https://images.unsplash.com/photo-1505972186483-70ff335e0d78?q=80&w=1920&auto=format&fit=crop',
      wetsuit43: getStorageUrl('wetsuit43.png'),
      wetsuit32: getStorageUrl('wetsuit32.png'),
      wetsuit22: getStorageUrl('wetsuit22.png'),
      wetsuit22ss: getStorageUrl('wetsuit22ss.png'),
      sunShirt: getStorageUrl('sunShirt.png'),
      headers: [],
      uiImages: [],
      fonts: {
        yehudaLight: [],
        yehudaBold: [],
        miriwin: [],
        danaYad: []
      },
      surfboardModels: {},
      atalefLogo: '',
      reefLogo: '',
      habalZugLogo: '',
      defaultEventImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1920&auto=format&fit=crop'
    };
    try {
      await setDoc(doc(db, 'site_data', 'assets'), initialAssets, { merge: true });
      setSiteAssets((prev: SiteAssets) => ({ ...initialAssets, ...prev }));
    } catch (e) {
      console.error('Error seeding initial assets:', e);
    }
  }, []);

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
        avatar: '',
        bio: 'מנהל מערכת ראשוני',
        gender: 'זכר',
        isTemporary: true
      };
      
      await setDoc(doc(db, 'members', 'initial-admin'), adminData);
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
      members, joinRequests, events, news, podcasts, galleryItems, glossary, exercises, quotes, performanceScores, weeklyHistory, siteAssets, siteConfig, coastalWeather, selectedStationId, setSelectedStationId, seaStats, yearConfig, attendeeIds, activeSessionDate, isLoading, hasQuotaError, connectionError, retryConnection: () => {
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
        setConnectionError(null);
      }, dbStatus, toggleDbStatus,
      updateMember, deleteMember, toggleStatus, toggleRole, approveRequest, rejectRequest,
      addEvent,
    surfCalls,
    addSurfCall,
    toggleSurfCallAttendance,
    archiveSurfCall,
    addSurfCallComment, deleteEvent, archiveEvent, updateEvent, toggleEventAttendance, addNews, updateNews, deleteNews, addPodcast, updatePodcast, deletePodcast, deleteGalleryItems, addGalleryItem, toggleSessionAttendance, updateHistory,
      finalizeSession, updateSiteAssets, updateSiteConfig, updateYearConfig, archiveMember, addMember,
      addPerformanceScore, updatePerformanceScore,
      isDbEmpty, conflictingAdmins, seedInitialAdmin, seedInitialAssets
    }), [
      members, joinRequests, events, news, podcasts, galleryItems, glossary, exercises, quotes, performanceScores, weeklyHistory, siteAssets, siteConfig, coastalWeather, selectedStationId, setSelectedStationId, seaStats, yearConfig, attendeeIds, activeSessionDate, isLoading, hasQuotaError, connectionError, dbStatus, toggleDbStatus,
      updateMember, deleteMember, toggleStatus, toggleRole, approveRequest, rejectRequest,
      addEvent, deleteEvent, archiveEvent, updateEvent, toggleEventAttendance, addNews, updateNews, deleteNews, addPodcast, updatePodcast, deletePodcast, deleteGalleryItems, addGalleryItem, toggleSessionAttendance, updateHistory,
      finalizeSession, updateSiteAssets, updateSiteConfig, updateYearConfig, archiveMember, addMember,
      addPerformanceScore, updatePerformanceScore,
      isDbEmpty, conflictingAdmins, seedInitialAdmin, seedInitialAssets,
      surfCalls, addSurfCall, toggleSurfCallAttendance, archiveSurfCall, addSurfCallComment
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