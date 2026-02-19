import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, increment, getDoc, orderBy, limit, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Member, JoinRequest, Event, NewsItem, GalleryItem } from '../types';
import { hashPassword } from '../utils/crypto';

interface DataContextType {
  members: Member[];
  joinRequests: JoinRequest[];
  events: Event[];
  news: NewsItem[];
  galleryItems: GalleryItem[];
  siteAssets: any;
  attendeeIds: string[];
  activeSessionDate: string;
  isLoading: boolean;
  updateMember: (member: Member) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  toggleRole: (id: string) => Promise<void>;
  resetPassword: (id: string) => Promise<void>;
  approveRequest: (id: string) => Promise<{ name: string; mobile: string; tempPassword: string } | null>;
  rejectRequest: (id: string) => Promise<void>;
  addEvent: (details: Omit<Event, 'id'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventAttendance: (eventId: string, userId: string) => Promise<void>;
  addNews: (details: Omit<NewsItem, 'id'>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  toggleSessionAttendance: (userId: string) => Promise<void>;
  forceResetSession: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [siteAssets, setSiteAssets] = useState<any>({});
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [activeSessionDate, setActiveSessionDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Unified logic for next Thursday 07:00
  const getNextThursday = () => {
    const now = new Date();
    const resultDate = new Date(now);
    const day = now.getDay();
    // 4 is Thursday
    let daysToAdd = (4 - day + 7) % 7;
    
    // If it's Thursday and we are past 07:00, move to next week
    if (daysToAdd === 0 && (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() >= 0))) {
      daysToAdd = 7;
    }
    
    resultDate.setDate(now.getDate() + daysToAdd);
    resultDate.setHours(7, 0, 0, 0);
    return resultDate.toISOString();
  };

  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
    });
    const unsubRequests = onSnapshot(collection(db, 'joinRequests'), (snapshot) => {
      setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest)));
    });
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    });
    const unsubNews = onSnapshot(collection(db, 'news'), (snapshot) => {
      setNews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
    });
    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
    });
    const unsubAssets = onSnapshot(doc(db, 'site_data', 'assets'), (doc) => {
      if (doc.exists()) setSiteAssets(doc.data());
    });

    const unsubAttendees = onSnapshot(doc(db, 'site_data', 'active_session'), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const sessionDate = data.date;
        const attendees = data.attendees || [];
        
        const now = new Date();
        const sDate = new Date(sessionDate);
        
        // Check if we passed the session time
        if (sessionDate && now.getTime() >= sDate.getTime()) {
          console.log("Session limit reached. Processing final attendance and resetting...");
          
          // Re-fetch to avoid race conditions (basic lock pattern)
          const sessionRef = doc(db, 'site_data', 'active_session');
          const currentSnap = await getDoc(sessionRef);
          if (currentSnap.exists() && currentSnap.data().date === sessionDate) {
            
            // 1. Archive the count to weekly_stats
            try {
              await addDoc(collection(db, 'weekly_stats'), {
                date: sessionDate,
                count: attendees.length,
                timestamp: new Date().toISOString()
              });
            } catch (e) { console.error("Archive failed", e); }

            // 2. Increment totalAttendance for all current attendees in batch
            const batch = writeBatch(db);
            attendees.forEach((uid: string) => {
              const mRef = doc(db, 'members', uid);
              batch.update(mRef, { totalAttendance: increment(1) });
            });
            try { await batch.commit(); } catch (e) { console.error("Batch update failed", e); }

            // 3. Reset the session document for the next Thursday
            const nextThurs = getNextThursday();
            await setDoc(sessionRef, {
              attendees: [],
              date: nextThurs
            }, { merge: true });
            
            setAttendeeIds([]);
            setActiveSessionDate(nextThurs);
          }
        } else {
          setAttendeeIds(attendees);
          setActiveSessionDate(sessionDate || getNextThursday());
        }
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
      unsubMembers(); unsubRequests(); unsubEvents(); unsubNews(); unsubGallery(); unsubAssets(); unsubAttendees();
    };
  }, []);

  const forceResetSession = async () => {
    const nextThurs = getNextThursday();
    await updateDoc(doc(db, 'site_data', 'active_session'), {
      attendees: [],
      date: nextThurs
    });
  };

  const updateMember = async (member: Member) => {
    const { id, ...data } = member;
    await updateDoc(doc(db, 'members', id), data);
  };

  const toggleStatus = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) await updateDoc(doc(db, 'members', id), { isActive: !member.isActive });
  };

  const toggleRole = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) await updateDoc(doc(db, 'members', id), { role: member.role === 'Admin' ? 'Member' : 'Admin' });
  };

  const resetPassword = async (id: string) => {
    const tempPass = Math.random().toString(36).slice(-8);
    const hashed = await hashPassword(tempPass);
    await updateDoc(doc(db, 'members', id), { password: hashed, isTempPassword: true });
    alert(`סיסמה זמנית חדשה: ${tempPass}`);
  };

  const approveRequest = async (id: string) => {
    const req = joinRequests.find(r => r.id === id);
    if (!req) return null;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(tempPassword);
    const newMember: Omit<Member, 'id'> = {
      name: req.name, email: req.email, mobile: req.mobile, avatar: req.avatar, bio: req.bio,
      role: 'Member', joinedAt: new Date().toLocaleDateString('he-IL'), isActive: true,
      password: hashedPassword, isTempPassword: true, loginCount: 0, totalAttendance: 0
    };
    await setDoc(doc(db, 'members', id), newMember);
    await deleteDoc(doc(db, 'joinRequests', id));
    return { name: req.name, mobile: req.mobile, tempPassword };
  };

  const rejectRequest = async (id: string) => {
    await deleteDoc(doc(db, 'joinRequests', id));
  };

  const addEvent = async (details: Omit<Event, 'id'>) => {
    await setDoc(doc(collection(db, 'events')), details);
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'events', id));
  };

  const toggleEventAttendance = async (eventId: string, userId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const isAttending = (event.attendees || []).includes(userId);
    await updateDoc(doc(db, 'events', eventId), {
      attendees: isAttending ? arrayRemove(userId) : arrayUnion(userId)
    });
  };

  const addNews = async (details: Omit<NewsItem, 'id'>) => {
    await setDoc(doc(collection(db, 'news')), details);
  };

  const deleteNews = async (id: string) => {
    await deleteDoc(doc(db, 'news', id));
  };

  const toggleSessionAttendance = async (userId: string) => {
    const isCurrentlyAttending = attendeeIds.includes(userId);
    const activeSessionRef = doc(db, 'site_data', 'active_session');
    // We no longer update totalAttendance here immediately.
    // It is updated in bulk when the session resets (on Thursdays at 07:00).
    if (isCurrentlyAttending) {
      await updateDoc(activeSessionRef, { attendees: arrayRemove(userId) });
    } else {
      await updateDoc(activeSessionRef, { attendees: arrayUnion(userId) });
    }
  };

  return (
    <DataContext.Provider value={{ 
      members, joinRequests, events, news, galleryItems, siteAssets, attendeeIds, activeSessionDate, isLoading,
      updateMember, toggleStatus, toggleRole, resetPassword, approveRequest, rejectRequest,
      addEvent, deleteEvent, toggleEventAttendance, addNews, deleteNews, toggleSessionAttendance, forceResetSession
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