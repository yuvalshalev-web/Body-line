import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from './services/firebase';
import { Member, JoinRequest, Event, NewsItem, GalleryItem } from './types';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DirectoryPage from './pages/DirectoryPage';
import GalleryPage from './pages/GalleryPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import EventsPage from './pages/EventsPage';
import NewsPage from './pages/NewsPage';
import SurfingNewsPage from './pages/SurfingNewsPage';
import AdminInfoPage from './pages/AdminInfoPage';
import { hashPassword } from './utils/crypto';
import { 
  Home, 
  Users, 
  Image as ImageIcon, 
  Calendar, 
  Newspaper, 
  Globe, 
  UserCircle, 
  Settings, 
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Waves,
  BarChart3
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    const saved = localStorage.getItem('habal_zug_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [siteAssets, setSiteAssets] = useState<any>({});
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Robust calculation for "Next or Current Thursday"
  const nextThursdayDate = useMemo(() => {
    const now = new Date();
    const resultDate = new Date(now);
    const day = now.getDay(); // 0 = Sunday, 4 = Thursday
    
    // Logic: Calculate how many days until the next Thursday.
    const daysToAdd = (4 - day + 7) % 7;
    resultDate.setDate(now.getDate() + daysToAdd);
    resultDate.setHours(0, 0, 0, 0);
    return resultDate.toISOString();
  }, []);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
    const unsubGallery = onSnapshot(query(collection(db, 'gallery')), (snapshot) => {
      setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
    });
    const unsubAssets = onSnapshot(doc(db, 'site_data', 'assets'), (doc) => {
      if (doc.exists()) setSiteAssets(doc.data());
    });

    const unsubAttendees = onSnapshot(doc(db, 'site_data', 'active_session'), (snapshot) => {
      if (snapshot.exists()) {
        setAttendeeIds(snapshot.data().attendees || []);
      } else {
        setDoc(doc(db, 'site_data', 'active_session'), { attendees: [] });
      }
    });

    return () => {
      unsubMembers(); unsubRequests(); unsubEvents(); unsubNews(); unsubGallery(); unsubAssets(); unsubAttendees();
    };
  }, []);

  const attendees = useMemo(() => {
    return members.filter(m => attendeeIds.includes(m.id));
  }, [members, attendeeIds]);

  const onLogin = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem('habal_zug_user', JSON.stringify(user));
    navigate('/');
  };

  const onLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('habal_zug_user');
    navigate('/login');
  };

  const onUpdateMember = async (member: Member) => {
    const memberRef = doc(db, 'members', member.id);
    const { id, ...data } = member;
    await updateDoc(memberRef, data);
  };

  const onDeleteMember = async (id: string) => {
    await updateDoc(doc(db, 'members', id), { isActive: false });
  };

  const onPermanentDeleteMember = async (id: string) => {
    await deleteDoc(doc(db, 'members', id));
  };

  const onToggleStatus = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    await updateDoc(doc(db, 'members', id), { isActive: !member.isActive });
  };

  const onToggleRole = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    await updateDoc(doc(db, 'members', id), { role: member.role === 'Admin' ? 'Member' : 'Admin' });
  };

  const onResetPassword = async (id: string) => {
    const tempPass = Math.random().toString(36).slice(-8);
    const hashed = await hashPassword(tempPass);
    await updateDoc(doc(db, 'members', id), { password: hashed, isTempPassword: true });
    alert(`סיסמה זמנית חדשה: ${tempPass}`);
  };

  const onApproveRequest = async (id: string) => {
    const req = joinRequests.find(r => r.id === id);
    if (!req) return null;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(tempPassword);
    const newMember: Omit<Member, 'id'> = {
      name: req.name, email: req.email, mobile: req.mobile, avatar: req.avatar, bio: req.bio,
      role: 'Member', joinedAt: formatDate(new Date()), isActive: true,
      password: hashedPassword, isTempPassword: true, loginCount: 0, totalAttendance: 0
    };
    await setDoc(doc(db, 'members', id), newMember);
    await deleteDoc(doc(db, 'joinRequests', id));
    return { name: req.name, mobile: req.mobile, tempPassword };
  };

  const onRejectRequest = async (id: string) => {
    await deleteDoc(doc(db, 'joinRequests', id));
  };

  const onAddEvent = async (details: Omit<Event, 'id'>) => {
    return await setDoc(doc(collection(db, 'events')), details);
  };

  const onDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'events', id));
  };

  const onToggleEventAttendance = async (eventId: string) => {
    if (!currentUser) return;
    const eventRef = doc(db, 'events', eventId);
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const isAttending = event.attendees.includes(currentUser.id);
    await updateDoc(eventRef, {
      attendees: isAttending ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
    });
  };

  const onAddNews = async (details: Omit<NewsItem, 'id'>) => {
    await setDoc(doc(collection(db, 'news')), details);
  };

  const onDeleteNews = async (id: string) => {
    await deleteDoc(doc(db, 'news', id));
  };

  const onToggleAttendance = async () => {
    if (!currentUser) return;
    const activeSessionRef = doc(db, 'site_data', 'active_session');
    const memberRef = doc(db, 'members', currentUser.id);
    const isCurrentlyAttending = attendeeIds.includes(currentUser.id);

    try {
      if (isCurrentlyAttending) {
        await updateDoc(activeSessionRef, { attendees: arrayRemove(currentUser.id) });
        await updateDoc(memberRef, { totalAttendance: increment(-1) });
      } else {
        await updateDoc(activeSessionRef, { attendees: arrayUnion(currentUser.id) });
        await updateDoc(memberRef, { totalAttendance: increment(1) });
      }
    } catch (err) {
      console.error("Attendance toggle failed:", err);
    }
  };

  if (!currentUser) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage onLogin={onLogin} siteAssets={siteAssets} />} />
      </Routes>
    );
  }

  const navItems = [
    { path: '/', icon: Home, label: 'דף הבית' },
    { path: '/directory', icon: Users, label: 'ספר חברים' },
    { path: '/gallery', icon: ImageIcon, label: 'גלריית תמונות' },
    { path: '/events', icon: Calendar, label: 'אירועים קרובים' },
    { path: '/posts', icon: Newspaper, label: 'פוסטים ועדכונים' },
    { path: '/world-news', icon: Globe, label: 'חדשות מהעולם' },
    { path: '/profile', icon: UserCircle, label: 'פרופיל אישי' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row-reverse font-['Assistant']" dir="rtl">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <Waves size={20} />
          </div>
          <span className="font-black text-slate-900 tracking-tighter">חבל זוג</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 right-0 h-screen bg-white border-l border-slate-200 z-[110] transition-all duration-300
        ${isMobileMenuOpen ? 'w-72 translate-x-0' : 'w-0 md:w-72 translate-x-full md:translate-x-0'}
        flex flex-col shadow-2xl md:shadow-none
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section - Specifically for Habal Zug */}
          <div className="p-8 flex items-center gap-4 border-b border-slate-50">
             <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg">
                {/* Use the HZ specific asset if available, otherwise a generic surfer/wave icon */}
                <img 
                  src={siteAssets.habalZugLogo || "https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fhz-logo-fixed.png?alt=media"} 
                  className="w-10 h-10 object-contain" 
                  alt="Habal Zug Logo" 
                  onError={(e) => {
                    // Fallback to Icon if image fails
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if(parent) parent.innerHTML = '<div class="text-white"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg></div>';
                  }}
                />
             </div>
             <div className="flex flex-col">
               <span className="font-black text-slate-900 tracking-tighter text-xl leading-none">חבל זוג</span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">הרצליה • 2025</span>
             </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">תפריט ראשי</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button 
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <item.icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                  <span className={`text-sm font-black transition-colors ${isActive ? 'text-white' : 'group-hover:text-slate-950'}`}>{item.label}</span>
                  {isActive && <ChevronLeft size={16} className="mr-auto opacity-50" />}
                </button>
              );
            })}
            
            {currentUser.role === 'Admin' && (
              <>
                <div className="pt-6 pb-2">
                  <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">ניהול מערכת</p>
                </div>
                <button 
                  onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${location.pathname === '/admin' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Settings size={20} className={`${location.pathname === '/admin' ? 'text-white' : 'text-slate-400 group-hover:text-rose-600'}`} />
                  <span className={`text-sm font-black ${location.pathname === '/admin' ? 'text-white' : 'group-hover:text-slate-950'}`}>פאנל מנהל</span>
                  {location.pathname === '/admin' && <ChevronLeft size={16} className="mr-auto opacity-50" />}
                </button>
                <button 
                  onClick={() => { navigate('/admin-info'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${location.pathname === '/admin-info' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <BarChart3 size={20} className={`${location.pathname === '/admin-info' ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                  <span className={`text-sm font-black ${location.pathname === '/admin-info' ? 'text-white' : 'group-hover:text-slate-950'}`}>סטטיסטיקה</span>
                  {location.pathname === '/admin-info' && <ChevronLeft size={16} className="mr-auto opacity-50" />}
                </button>
              </>
            )}
          </nav>

          {/* User Section & Logout */}
          <div className="p-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-3 p-3 mb-2 bg-slate-50 rounded-2xl">
               <img src={currentUser.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
               <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-slate-900 truncate">{currentUser.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 truncate">{currentUser.email}</span>
               </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-black text-sm"
            >
              <LogOut size={20} />
              <span>התנתקות</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto min-h-[calc(100vh-64px)] md:min-h-screen">
        <Routes>
          <Route path="/" element={<DashboardPage 
            membersCount={members.length}
            galleryCount={galleryItems.length}
            eventsCount={events.length}
            newsCount={news.length}
            currentUser={currentUser}
            attendees={attendees}
            onToggleAttendance={onToggleAttendance}
            heroBg={siteAssets.heroBg}
            activeSessionDate={nextThursdayDate}
            siteAssets={siteAssets}
            news={news}
          />} />
          <Route path="/directory" element={<DirectoryPage members={members.filter(m => m.isActive !== false)} />} />
          <Route path="/gallery" element={<GalleryPage user={currentUser} galleryItems={galleryItems} setGalleryItems={setGalleryItems} />} />
          <Route path="/events" element={<EventsPage events={events} currentUser={currentUser} onAddEvent={onAddEvent} onDeleteEvent={onDeleteEvent} onToggleAttendance={onToggleEventAttendance} />} />
          <Route path="/posts" element={<NewsPage news={news} currentUser={currentUser} onAddNews={onAddNews} onDeleteNews={onDeleteNews} />} />
          <Route path="/world-news" element={<SurfingNewsPage />} />
          <Route path="/profile" element={<ProfilePage user={currentUser} onUpdate={onUpdateMember} />} />
          {currentUser.role === 'Admin' && (
            <>
              <Route path="/admin" element={<AdminPage 
                user={currentUser}
                members={members} 
                onDeleteMember={onDeleteMember}
                onPermanentDeleteMember={onPermanentDeleteMember}
                onResetPassword={onResetPassword}
                onToggleRole={onToggleRole}
                onToggleStatus={onToggleStatus}
                onUpdateMember={onUpdateMember}
                joinRequests={joinRequests}
                onApproveRequest={onApproveRequest}
                onRejectRequest={onRejectRequest}
                siteAssets={siteAssets}
                events={events}
                news={news}
                onDeleteEvent={onDeleteEvent}
                onDeleteNews={onDeleteNews}
              />} />
              <Route path="/admin-info" element={<AdminInfoPage />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[105] md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </div>
  );
};

export default App;