
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  Users, 
  ImageIcon, 
  UserCircle, 
  LogOut, 
  Menu,
  ShieldAlert,
  Calendar,
  Newspaper,
  LayoutDashboard,
  X,
  Loader2,
  Waves
} from 'lucide-react';

import { auth, db } from './services/firebase';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DirectoryPage from './pages/DirectoryPage';
import GalleryPage from './pages/GalleryPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import EventsPage from './pages/EventsPage';
import NewsPage from './pages/NewsPage';
import { Member, GalleryItem, Event, NewsItem, JoinRequest } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [siteStats, setSiteStats] = useState({ daily: 0, weekly: 0, yearly: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // 1. Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extended profile from Firestore
        const userDocRef = doc(db, 'members', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setCurrentUser({ id: userDoc.id, uid: firebaseUser.uid, ...userDoc.data() } as Member);
        } else {
          // If auth exists but no firestore doc, create a basic one
          const newMemberData = {
            name: firebaseUser.displayName || 'חבר חדש',
            email: firebaseUser.email || '',
            mobile: '',
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=random`,
            bio: 'ברוכים הבאים לקהילה!',
            role: 'Member',
            joinedAt: new Date().toLocaleDateString('he-IL')
          };
          await setDoc(userDocRef, newMemberData);
          setCurrentUser({ id: firebaseUser.uid, uid: firebaseUser.uid, ...newMemberData } as Member);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // 2. Real-time Firestore Listeners
    const qMembers = query(collection(db, 'members'), orderBy('name', 'asc'));
    const unsubscribeMembers = onSnapshot(qMembers, (snapshot) => {
      setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
    });

    const qGallery = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeGallery = onSnapshot(qGallery, (snapshot) => {
      setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
    });

    const qEvents = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    });

    const qNews = query(collection(db, 'news'), orderBy('date', 'desc'));
    const unsubscribeNews = onSnapshot(qNews, (snapshot) => {
      setNews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem)));
    });

    const qRequests = query(collection(db, 'joinRequests'), orderBy('requestedAt', 'desc'));
    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
      setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest)));
    });

    // Site Stats Listener (from a dedicated 'config' or 'stats' collection)
    const unsubscribeStats = onSnapshot(doc(db, 'site_data', 'counters'), (doc) => {
      if (doc.exists()) {
        setSiteStats(doc.data() as any);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMembers();
      unsubscribeGallery();
      unsubscribeEvents();
      unsubscribeNews();
      unsubscribeRequests();
      unsubscribeStats();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-slate-950" size={64} />
          <Waves className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={32} />
        </div>
        <div className="text-center">
          <p className="font-black text-slate-900 uppercase tracking-[0.3em] text-sm mb-1">חבל זוג הרצליה</p>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">מתחבר לענן הקהילתי...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const navItems = [
    { path: '/', label: 'דף הבית', icon: LayoutDashboard },
    { path: '/directory', label: 'נבחרת הכוכבים', icon: Users },
    { path: '/events', label: 'אירועים', icon: Calendar },
    { path: '/news', label: 'חדשות', icon: Newspaper },
    { path: '/gallery', label: 'גלריה', icon: ImageIcon },
    { path: '/profile', label: 'פרופיל אישי', icon: UserCircle },
  ];

  if (currentUser.role === 'Admin') {
    navItems.push({ path: '/admin', label: 'ניהול מערכת', icon: ShieldAlert });
  }

  const GLOBAL_LOGO = "https://i.postimg.cc/Mp1vktm0/org-Logo-bbd1959c-cef4-4677-8c9d-a5943034a63e.png";

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-right font-['Assistant']" dir="rtl">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-100 transform transition-all duration-500 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <img src={GLOBAL_LOGO} alt="Logo" className="w-12 h-12 object-contain" />
              <div className="leading-none">
                <h1 className="font-black text-slate-950 text-xl tracking-tight">חבל זוג</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">קהילת הרצליה</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-950">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setIsSidebarOpen(false)} 
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group ${isActive ? 'bg-slate-950 text-white shadow-xl shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}
                >
                  <item.icon size={20} className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-50">
            <div className="bg-slate-50/50 rounded-3xl p-5 mb-4 flex items-center gap-4 border border-slate-100 transition-colors hover:bg-slate-50">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-11 h-11 rounded-xl object-cover grayscale" />
              <div className="min-w-0">
                <p className="font-black text-slate-950 text-xs truncate">{currentUser.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role === 'Admin' ? 'מנהל' : 'חבר'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-600 font-black text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all">
              <LogOut size={16} /> יציאה מהמערכת
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-white">
        <div className="md:hidden bg-white/90 backdrop-blur-md p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <img src={GLOBAL_LOGO} alt="Logo" className="w-9 h-9 object-contain" />
            <h1 className="font-black text-slate-950 text-sm">חבל זוג הרצליה</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-950 text-white rounded-xl shadow-lg">
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-10 md:px-14 md:py-16">
            <Routes>
              <Route path="/" element={
                <DashboardPage 
                  membersCount={members.length} 
                  galleryCount={galleryItems.length} 
                  eventsCount={events.length} 
                  newsCount={news.length} 
                  visitorStats={siteStats} 
                  currentUser={currentUser} 
                  attendees={[]} // Attendees logic could be added as a Firestore array
                  onToggleAttendance={() => {}} 
                />
              } />
              <Route path="/directory" element={<DirectoryPage members={members} />} />
              <Route path="/events" element={<EventsPage events={events} />} />
              <Route path="/news" element={<NewsPage news={news} />} />
              <Route path="/gallery" element={
                <GalleryPage 
                  user={currentUser} 
                  galleryItems={galleryItems} 
                  setGalleryItems={() => {}} // Not needed as it's real-time from Firestore
                />
              } />
              <Route path="/profile" element={
                <ProfilePage 
                  user={currentUser} 
                  onUpdate={(m) => updateDoc(doc(db, 'members', m.id), m as any)} 
                />
              } />
              <Route path="/admin" element={
                currentUser.role === 'Admin' ? (
                  <AdminPage 
                    user={currentUser} 
                    members={members}
                    onDeleteMember={(id) => {}} // Implement with deleteDoc
                    onResetPassword={(id) => {}}
                    onToggleRole={(id) => {}}
                    onUpdateMember={(m) => {}}
                    joinRequests={joinRequests}
                    onApproveRequest={(id) => null}
                    onRejectRequest={(id) => {}}
                    galleryItems={galleryItems}
                    onAddGalleryItem={() => {}}
                    onDeleteGalleryItems={() => {}}
                    events={events}
                    onAddEvent={() => {}}
                    onDeleteEvent={() => {}}
                    news={news}
                    onAddNews={() => {}}
                    onDeleteNews={() => {}}
                  />
                ) : <Navigate to="/" />
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>

        {/* Dynamic Footer with Site Graphics */}
        <footer className="w-full py-24 px-6 border-t border-slate-50 bg-white flex flex-col items-center gap-12">
          <div className="text-center space-y-4">
             <img src={GLOBAL_LOGO} alt="חבל זוג" className="w-16 h-16 mx-auto object-contain grayscale opacity-20 mb-4" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4 max-w-lg leading-relaxed">
              חבל זוג הרצליה • האנשים, הערכים, החברות והרוח מאחורי הגלים
            </h4>
          </div>
          
          {/* Site Graphics Icons / Partners (Stored in Firestore or constant) */}
          <div className="flex justify-center items-center gap-12 md:gap-20">
            <a href="https://reefseacenter.co.il/" target="_blank" rel="noopener noreferrer" className="h-16 flex items-center group opacity-30 hover:opacity-100 transition-all">
              <img src="https://i.postimg.cc/5XNxLBGC/images-(3).jpg" className="max-h-full w-auto grayscale group-hover:grayscale-0 transition-all rounded-xl" alt="Reef" />
            </a>
            <div className="w-px h-10 bg-slate-100"></div>
            <a href="https://atalef.com/" target="_blank" rel="noopener noreferrer" className="h-16 flex items-center group opacity-50 hover:opacity-100 transition-all">
              <img src="https://i.postimg.cc/k2XnKQZK/lwgw-'mwtt-h'tlp.png" className="max-h-full w-auto grayscale group-hover:grayscale-0 transition-all" alt="Atalef" />
            </a>
          </div>

          <div className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} חבל זוג הרצליה.
          </div>
        </footer>
      </main>
      
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};

export default App;
