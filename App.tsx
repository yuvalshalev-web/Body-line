
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  orderBy,
  setDoc,
  increment,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { 
  Home, 
  Users, 
  Image as ImageIcon, 
  Calendar, 
  LogOut, 
  User, 
  Menu, 
  X,
  Waves,
  ShieldAlert,
  Newspaper
} from 'lucide-react';
import { db } from './services/firebase';
import { Member, GalleryItem, Event, NewsItem, JoinRequest } from './types';
import { hashPassword } from './utils/crypto';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DirectoryPage from './pages/DirectoryPage';
import GalleryPage from './pages/GalleryPage';
import EventsPage from './pages/EventsPage';
import NewsPage from './pages/NewsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [siteAssets, setSiteAssets] = useState<any>({});
  const [activeSessionAttendees, setActiveSessionAttendees] = useState<Member[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('habal_zug_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'assets'), (doc) => {
      if (doc.exists()) setSiteAssets(doc.data());
    });
  }, []);

  useEffect(() => {
    const today = new Date();
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + (4 + 7 - today.getDay()) % 7);
    const dateKey = nextThursday.toISOString().split('T')[0];

    return onSnapshot(doc(db, 'sessions', dateKey), (doc) => {
      if (doc.exists()) {
        const attendeeIds = doc.data().attendees || [];
        const attendingMembers = members.filter(m => attendeeIds.includes(m.id));
        setActiveSessionAttendees(attendingMembers);
      } else {
        setActiveSessionAttendees([]);
      }
    });
  }, [members]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers(data);
      const updatedMe = data.find(m => m.id === currentUser.id);
      if (updatedMe) {
        setCurrentUser(updatedMe);
        localStorage.setItem('habal_zug_user', JSON.stringify(updatedMe));
      }
    });

    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('timestamp', 'desc')), (snapshot) => {
      setGallery(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
    });

    const unsubEvents = onSnapshot(query(collection(db, 'events'), orderBy('date', 'asc')), (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    });

    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (snapshot) => {
      setNews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
    });

    const unsubRequests = onSnapshot(collection(db, 'joinRequests'), (snapshot) => {
      setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest)));
    });

    return () => {
      unsubMembers();
      unsubGallery();
      unsubEvents();
      unsubNews();
      unsubRequests();
    };
  }, [currentUser?.id]);

  const handleLogin = (member: Member) => {
    setCurrentUser(member);
    localStorage.setItem('habal_zug_user', JSON.stringify(member));
    navigate('/');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('habal_zug_user');
    navigate('/');
  };

  const handleToggleAttendance = async () => {
    if (!currentUser) return;
    const today = new Date();
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + (4 + 7 - today.getDay()) % 7);
    const dateKey = nextThursday.toISOString().split('T')[0];
    
    const sessionRef = doc(db, 'sessions', dateKey);
    const isAttending = activeSessionAttendees.some(a => a.id === currentUser.id);

    if (isAttending) {
      await updateDoc(sessionRef, { attendees: arrayRemove(currentUser.id) });
      await updateDoc(doc(db, 'members', currentUser.id), { totalAttendance: increment(-1) });
    } else {
      await setDoc(sessionRef, { attendees: arrayUnion(currentUser.id) }, { merge: true });
      await updateDoc(doc(db, 'members', currentUser.id), { totalAttendance: increment(1) });
    }
  };

  const updateProfile = async (data: Member) => {
    const { id, ...cleanData } = data;
    // Filter out undefined values to avoid Firestore errors
    const sanitizedData = Object.entries(cleanData).reduce((acc, [key, value]) => {
      acc[key] = value === undefined ? null : value;
      return acc;
    }, {} as any);
    
    await updateDoc(doc(db, 'members', id), sanitizedData);
  };

  if (loading) return null;

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} siteAssets={siteAssets} />;
  }

  const activeSessionDateString = () => {
    const today = new Date();
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + (4 + 7 - today.getDay()) % 7);
    return nextThursday.toISOString();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 left-0 right-0 bg-white/90 backdrop-blur-xl z-[60] px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Waves size={18} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-950">חבל זוג</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2.5 bg-slate-50 rounded-xl text-slate-900 active:scale-95 transition-all"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[65] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Navigation */}
      <aside className={`fixed inset-y-0 right-0 z-[70] w-72 bg-white border-l border-slate-100 text-slate-950 transform transition-transform duration-500 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full shadow-2xl lg:shadow-none'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-xl">
                <Waves size={24} />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-950">חבל זוג</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 active:scale-90 transition-all">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { to: '/', icon: Home, label: 'עמוד ראשי' },
              { to: '/directory', icon: Users, label: 'חברי קהילה' },
              { to: '/gallery', icon: ImageIcon, label: 'גלריית גלים' },
              { to: '/news', icon: Newspaper, label: 'חדשות ופוסטים' },
              { to: '/events', icon: Calendar, label: 'אירועים' },
              { to: '/profile', icon: User, label: 'הפרופיל שלי' },
              ...(currentUser.role === 'Admin' ? [{ to: '/admin', icon: ShieldAlert, label: 'ניהול מערכת' }] : [])
            ].map(link => {
              const isActive = location.pathname === link.to;
              return (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group flex items-center gap-4 px-6 py-4.5 rounded-[1.25rem] transition-all duration-300 font-black text-sm active:scale-95 ${isActive 
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-200' 
                    : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-[1.02]'}`}
                >
                  <link.icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-white' : 'group-hover:text-indigo-600'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-8 border-t border-slate-100 mt-8">
            <button 
              onClick={handleLogout} 
              className="group w-full flex items-center gap-4 px-6 py-4.5 rounded-[1.25rem] text-rose-500 hover:bg-rose-50 transition-all duration-300 font-black text-sm active:scale-95"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span>התנתקות</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-5 md:p-8 lg:p-12 max-w-screen-2xl mx-auto">
          <Routes>
            <Route path="/" element={
              <DashboardPage 
                membersCount={members.length}
                galleryCount={gallery.length}
                eventsCount={events.length}
                newsCount={news.length}
                currentUser={currentUser}
                attendees={activeSessionAttendees}
                onToggleAttendance={handleToggleAttendance}
                heroBg={siteAssets.heroBg || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fbig-wedensday.jpg?alt=media"}
                activeSessionDate={activeSessionDateString()}
                siteAssets={siteAssets}
                news={news}
              />
            } />
            <Route path="/directory" element={<DirectoryPage members={members} />} />
            <Route path="/gallery" element={<GalleryPage user={currentUser} galleryItems={gallery} setGalleryItems={() => {}} />} />
            <Route path="/news" element={
              <NewsPage 
                news={news} 
                currentUser={currentUser} 
                onAddNews={async (details) => { await addDoc(collection(db, 'news'), details); }}
                onDeleteNews={async (id) => { await deleteDoc(doc(db, 'news', id)); }}
              />
            } />
            <Route path="/events" element={
              <EventsPage 
                events={events} 
                currentUser={currentUser} 
                onAddEvent={async (details) => { await addDoc(collection(db, 'events'), details); }}
                onDeleteEvent={async (id) => { await deleteDoc(doc(db, 'events', id)); }}
                onToggleAttendance={async (eventId) => {
                  const eventRef = doc(db, 'events', eventId);
                  const event = events.find(e => e.id === eventId);
                  if (event?.attendees.includes(currentUser.id)) {
                    await updateDoc(eventRef, { attendees: arrayRemove(currentUser.id) });
                  } else {
                    await updateDoc(eventRef, { attendees: arrayUnion(currentUser.id) });
                  }
                }}
              />
            } />
            <Route path="/profile" element={<ProfilePage user={currentUser} onUpdate={updateProfile} />} />
            {currentUser.role === 'Admin' && (
              <Route path="/admin" element={
                <AdminPage 
                  user={currentUser}
                  members={members}
                  onDeleteMember={async (id) => { await deleteDoc(doc(db, 'members', id)); }}
                  onResetPassword={async (id) => { /* logic */ }}
                  onToggleRole={async (id) => {
                    const m = members.find(mem => mem.id === id);
                    if (m) await updateDoc(doc(db, 'members', id), { role: m.role === 'Admin' ? 'Member' : 'Admin' });
                  }}
                  onUpdateMember={updateProfile}
                  joinRequests={joinRequests}
                  onApproveRequest={async (id) => {
                    const req = joinRequests.find(r => r.id === id);
                    if (req) {
                      const tempPassword = Math.random().toString(36).slice(-8);
                      const hashedPassword = await hashPassword(tempPassword);
                      const { id: reqId, ...memberData } = req;
                      
                      const newMember = { 
                        ...memberData, 
                        password: hashedPassword,
                        isTempPassword: true,
                        role: 'Member' as const, 
                        joinedAt: new Date().toLocaleDateString('he-IL'), 
                        totalAttendance: 0,
                        isActive: true
                      };
                      
                      await addDoc(collection(db, 'members'), newMember);
                      await deleteDoc(doc(db, 'joinRequests', id));
                      
                      return { name: req.name, mobile: req.mobile, tempPassword };
                    }
                    return null;
                  }}
                  onRejectRequest={async (id) => { await deleteDoc(doc(db, 'joinRequests', id)); }}
                  siteAssets={siteAssets}
                  events={events}
                  news={news}
                  onDeleteEvent={async (id) => { await deleteDoc(doc(db, 'events', id)); }}
                  onDeleteNews={async (id) => { await deleteDoc(doc(db, 'news', id)); }}
                />
              } />
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
