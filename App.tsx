
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  getDoc, 
  updateDoc, 
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
  Waves,
  AlertCircle
} from 'lucide-react';

import { db } from './services/firebase';
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
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [siteStats, setSiteStats] = useState({ daily: 0, weekly: 0, yearly: 0 });
  const [siteAssets, setSiteAssets] = useState<any>({
    logo: "https://i.postimg.cc/Mp1vktm0/org-Logo-bbd1959c-cef4-4677-8c9d-a5943034a63e.png",
    heroBg: "https://images.unsplash.com/photo-1414490929659-9a12b7e31907?auto=format&fit=crop&q=80&w=2000"
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Session Management without Firebase Auth
    const checkSession = async () => {
      const savedMemberId = localStorage.getItem('habal_zug_member_id');
      if (savedMemberId) {
        try {
          const userDoc = await getDoc(doc(db, 'members', savedMemberId));
          if (userDoc.exists()) {
            setCurrentUser({ id: userDoc.id, ...userDoc.data() } as Member);
          } else {
            localStorage.removeItem('habal_zug_member_id');
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Session check error:", err);
        }
      }
      setLoading(false);
    };

    checkSession();

    // Data Listeners
    const handleError = (collectionName: string) => (err: any) => {
      console.warn(`Firestore listener error for ${collectionName}:`, err.message);
    };

    const unsubscribeMembers = onSnapshot(
      query(collection(db, 'members'), orderBy('name', 'asc')),
      (snapshot) => setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member))),
      handleError('members')
    );

    const unsubscribeGallery = onSnapshot(
      query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(50)),
      (snapshot) => setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem))),
      handleError('gallery')
    );

    const unsubscribeEvents = onSnapshot(
      query(collection(db, 'events'), orderBy('date', 'asc')),
      (snapshot) => setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event))),
      handleError('events')
    );

    const unsubscribeNews = onSnapshot(
      query(collection(db, 'news'), orderBy('date', 'desc')),
      (snapshot) => setNews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem))),
      handleError('news')
    );

    const unsubscribeRequests = onSnapshot(
      query(collection(db, 'joinRequests'), orderBy('requestedAt', 'desc')),
      (snapshot) => setJoinRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JoinRequest))),
      handleError('joinRequests')
    );

    const unsubscribeStats = onSnapshot(doc(db, 'site_data', 'counters'), (doc) => {
      if (doc.exists()) setSiteStats(doc.data() as any);
    }, handleError('stats'));

    const unsubscribeAssets = onSnapshot(doc(db, 'site_data', 'assets'), (doc) => {
      if (doc.exists()) setSiteAssets(prev => ({ ...prev, ...doc.data() }));
    }, handleError('assets'));

    return () => {
      unsubscribeMembers();
      unsubscribeGallery();
      unsubscribeEvents();
      unsubscribeNews();
      unsubscribeRequests();
      unsubscribeStats();
      unsubscribeAssets();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('habal_zug_member_id');
    setCurrentUser(null);
    setIsSidebarOpen(false);
  };

  const handleLogin = (member: Member) => {
    localStorage.setItem('habal_zug_member_id', member.id);
    setCurrentUser(member);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-slate-900 mb-2">{error}</h2>
        <button onClick={() => window.location.reload()} className="mt-4 px-8 py-3 bg-slate-950 text-white rounded-2xl font-black">טען מחדש</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-slate-950" size={64} />
          <Waves className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={32} />
        </div>
        <div className="text-center">
          <p className="font-black text-slate-900 uppercase tracking-[0.3em] text-sm mb-1">חבל זוג הרצליה</p>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">טוען נתונים מהענן...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
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

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-right font-['Assistant']" dir="rtl">
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-100 transform transition-all duration-500 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <img src={siteAssets.logo} alt="Logo" className="w-12 h-12 object-contain" />
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

      <main className="flex-1 overflow-y-auto flex flex-col bg-white">
        <div className="md:hidden bg-white/90 backdrop-blur-md p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <img src={siteAssets.logo} alt="Logo" className="w-9 h-9 object-contain" />
            <h1 className="font-black text-slate-950 text-sm">חבל זוג הרצליה</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-950 text-white rounded-xl shadow-lg">
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-10 md:px-14 md:py-16">
            <Routes>
              <Route path="/" element={<DashboardPage membersCount={members.length} galleryCount={galleryItems.length} eventsCount={events.length} newsCount={news.length} visitorStats={siteStats} currentUser={currentUser} attendees={[]} onToggleAttendance={() => {}} />} />
              <Route path="/directory" element={<DirectoryPage members={members} />} />
              <Route path="/events" element={<EventsPage events={events} />} />
              <Route path="/news" element={<NewsPage news={news} />} />
              <Route path="/gallery" element={<GalleryPage user={currentUser} galleryItems={galleryItems} setGalleryItems={() => {}} />} />
              <Route path="/profile" element={<ProfilePage user={currentUser} onUpdate={(m) => updateDoc(doc(db, 'members', m.id), m as any)} />} />
              <Route path="/admin" element={currentUser.role === 'Admin' ? (
                <AdminPage 
                  user={currentUser} 
                  members={members}
                  onDeleteMember={(id) => {}} 
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
              ) : <Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>

        <footer className="w-full py-24 px-6 border-t border-slate-50 bg-white flex flex-col items-center gap-12">
          <div className="text-center space-y-4">
             <img src={siteAssets.logo} alt="חבל זוג" className="w-16 h-16 mx-auto object-contain grayscale opacity-20 mb-4" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4 max-w-lg leading-relaxed">
              חבל זוג הרצליה • האנשים, הערכים, החברות והרוח מאחורי הגלים
            </h4>
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
