import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, increment, getDoc, orderBy, limit, addDoc, writeBatch } from 'firebase/firestore';
import { getDb } from '../services/firebase';
import { Member, JoinRequest, Event, NewsItem, GalleryItem, GlossaryTerm, QuoteItem } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { hashPassword } from '../utils/crypto';

interface DataContextType {
  members: Member[];
  joinRequests: JoinRequest[];
  events: Event[];
  news: NewsItem[];
  galleryItems: GalleryItem[];
  glossary: GlossaryTerm[];
  quotes: QuoteItem[];
  siteAssets: any;
  attendeeIds: string[];
  activeSessionDate: string;
  isLoading: boolean;
  updateMember: (member: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  toggleRole: (id: string, requesterEmail?: string) => Promise<void>;
  resetPassword: (id: string) => Promise<void>;
  approveRequest: (id: string) => Promise<{ name: string; email: string; mobile: string; tempPassword: string } | null>;
  rejectRequest: (id: string) => Promise<void>;
  addEvent: (details: Omit<Event, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventAttendance: (eventId: string, userId: string) => Promise<void>;
  addNews: (details: Omit<NewsItem, 'id'>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  toggleSessionAttendance: (userId: string) => Promise<void>;
  forceResetSession: () => Promise<void>;
  finalizeThursdaySession: () => Promise<void>;
  batchAddGlossary: (items: Omit<GlossaryTerm, 'id'>[]) => Promise<void>;
  batchAddQuotes: (items: Omit<QuoteItem, 'id'>[]) => Promise<void>;
  clearCollection: (collectionName: string) => Promise<void>;
  updateSiteAssets: (assets: any) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [siteAssets, setSiteAssets] = useState<any>({});
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [activeSessionDate, setActiveSessionDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const db = getDb();
    
    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot: any) => {
      setMembers(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Member)));
    });
    
    const unsubRequests = onSnapshot(collection(db, 'joinRequests'), (snapshot: any) => {
      setJoinRequests(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as JoinRequest)));
    });
    
    const unsubEvents = onSnapshot(query(collection(db, 'events'), orderBy('date', 'desc')), (snapshot: any) => {
      setEvents(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Event)));
    });
    
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (snapshot: any) => {
      setNews(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as NewsItem)));
    });
    
    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('timestamp', 'desc')), (snapshot: any) => {
      setGalleryItems(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as GalleryItem)));
    });
    
    const unsubGlossary = onSnapshot(collection(db, 'glossary'), (snapshot: any) => {
      setGlossary(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as GlossaryTerm)));
    });
    
    const unsubQuotes = onSnapshot(collection(db, 'quotes'), (snapshot: any) => {
      setQuotes(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as QuoteItem)));
    });
    
    const unsubAssets = onSnapshot(doc(db, 'site_data', 'assets'), (doc) => {
      if (doc.exists()) setSiteAssets(doc.data());
    });

    const unsubAttendees = onSnapshot(doc(db, 'site_data', 'active_session'), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        const sessionDate = data.date;
        const attendees = data.attendees || [];
        
        setAttendeeIds(attendees);
        setActiveSessionDate(sessionDate || getNextThursday());
      } else {
        const nextThurs = getNextThursday();
        await setDoc(doc(db, 'site_data', 'active_session'), {
          attendees: [],
          date: nextThurs
        });
        setActiveSessionDate(nextThurs);
      }
      setIsLoading(false);
    });

    return () => {
      unsubMembers(); unsubRequests(); unsubEvents(); unsubNews(); unsubGallery(); unsubGlossary(); unsubQuotes(); unsubAssets(); unsubAttendees();
    };
  }, []);

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
    alert(`סיסמה זמנית חדשה: ${tempPass}`);
  };

  const approveRequest = async (id: string) => {
    console.log('DataContext: approveRequest starting for id:', id);
    try {
      const db = getDb();
      const requestRef = doc(db, 'joinRequests', id);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        alert('שגיאה: בקשת ההצטרפות לא נמצאה במסד הנתונים.');
        return null;
      }
      
      const reqData = requestSnap.data() as JoinRequest;
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(tempPassword);
      
      const newMemberData = {
        name: reqData.name || 'ללא שם', 
        email: reqData.email || '', 
        mobile: reqData.mobile || '', 
        avatar: reqData.avatar || '', 
        bio: reqData.bio || '',
        role: 'Member', 
        joinedAt: new Date().toLocaleDateString('he-IL'), 
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
        name: newMemberData.name, 
        email: newMemberData.email, 
        mobile: newMemberData.mobile, 
        tempPassword 
      };
    } catch (err: any) {
      alert('שגיאה באישור המשתמש: ' + (err.message || 'שגיאה לא ידועה'));
      throw err;
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      await deleteDoc(doc(getDb(), 'joinRequests', id));
    } catch (err: any) {
      alert('שגיאה בדחיית המשתמש: ' + (err.message || 'שגיאה לא ידועה'));
      throw err;
    }
  };

  const addEvent = async (details: Omit<Event, 'id'>) => {
    await setDoc(doc(collection(getDb(), 'events')), details);
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(getDb(), 'events', id));
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
    
    if (!sessionSnap.exists()) throw new Error("Active session not found");
    
    const data = sessionSnap.data() as any;
    const attendees = data.attendees || [];
    const sessionDate = data.date;

    if (attendees.length === 0) throw new Error("No attendees to finalize");

    const batch = writeBatch(db);
    
    // 1. Update totalAttendance for all attendees
    attendees.forEach((uid: string) => {
      const memberRef = doc(db, 'members', uid);
      batch.update(memberRef, { totalAttendance: increment(1) });
    });

    // 2. Create weekly_stats entry
    const statsRef = doc(collection(db, 'weekly_stats'));
    batch.set(statsRef, {
      date: sessionDate,
      count: attendees.length,
      participantIds: attendees,
      timestamp: new Date().toISOString()
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

  return (
    <DataContext.Provider value={{ 
      members, joinRequests, events, news, galleryItems, glossary, quotes, siteAssets, attendeeIds, activeSessionDate, isLoading,
      updateMember, deleteMember, toggleStatus, toggleRole, resetPassword, approveRequest, rejectRequest,
      addEvent, deleteEvent, toggleEventAttendance, addNews, deleteNews, toggleSessionAttendance, forceResetSession,
      finalizeThursdaySession, batchAddGlossary, batchAddQuotes, clearCollection, updateSiteAssets
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