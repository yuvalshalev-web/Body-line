
import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { 
  Users, 
  Trash2, 
  RotateCcw, 
  UserPlus, 
  ShieldAlert, 
  Mail, 
  Phone, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Newspaper,
  Tag,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Upload,
  Loader2,
  Sparkles,
  CheckSquare,
  Square,
  X,
  UserCheck,
  UserX,
  Clock3,
  Send,
  SendHorizontal,
  Edit3,
  Download,
  Database,
  FileJson,
  RefreshCw,
  LayoutDashboard,
  FileArchive,
  FileSpreadsheet
} from 'lucide-react';
import { Member, GalleryItem, Event, NewsItem, JoinRequest } from '../types';
import { analyzeImage } from '../services/geminiService';

interface AdminPageProps {
  user: Member;
  members: Member[];
  onDeleteMember: (id: string) => void;
  onResetPassword: (id: string) => void;
  onToggleRole: (id: string) => void;
  onUpdateMember: (member: Member) => void;
  joinRequests: JoinRequest[];
  // Fix: onApproveRequest should return Promise<Member | null> to match async implementation in App.tsx
  onApproveRequest: (id: string) => Promise<Member | null>;
  onRejectRequest: (id: string) => void;
  galleryItems: GalleryItem[];
  onAddGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  onDeleteGalleryItems: (ids: string[]) => void;
  events: Event[];
  // FIX: attendeesCount does not exist on Event, removed from Omit.
  onAddEvent: (details: Omit<Event, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  news: NewsItem[];
  onAddNews: (details: Omit<NewsItem, 'id'>) => void;
  onDeleteNews: (id: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  user,
  members, 
  onDeleteMember, 
  onResetPassword, 
  onToggleRole,
  onUpdateMember,
  joinRequests,
  onApproveRequest,
  onRejectRequest,
  galleryItems,
  onAddGalleryItem,
  onDeleteGalleryItems,
  events,
  onAddEvent,
  onDeleteEvent,
  news,
  onAddNews,
  onDeleteNews
}) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'REQUESTS' | 'GALLERY' | 'EVENTS' | 'NEWS' | 'ADD' | 'SYSTEM'>('MEMBERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Email Simulation Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [approvedMember, setApprovedMember] = useState<Member | null>(null);

  // Edit Member State
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Add Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLoc, setEventLoc] = useState('');
  const [eventImg, setEventImg] = useState('');

  // Add News Form State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<NewsItem['category']>('Update');
  const [newsImg, setNewsImg] = useState('');

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fix: handleApprove must be async to await the result of onApproveRequest
  const handleApprove = async (id: string) => {
    const newMember = await onApproveRequest(id);
    if (newMember) {
      setApprovedMember(newMember);
      setShowEmailModal(true);
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // 1. Database JSON
      const backupData = {
        members,
        galleryItems,
        events,
        news,
        joinRequests,
        exportDate: new Date().toISOString()
      };
      zip.file("database.json", JSON.stringify(backupData, null, 2));

      // 2. Members CSV
      const csvContent = [
        ["ID", "Name", "Email", "Mobile", "Role", "JoinedAt"].join(","),
        ...members.map(m => [m.id, m.name, m.email, m.mobile, m.role, m.joinedAt].join(","))
      ].join("\n");
      zip.file("members_report.csv", "\ufeff" + csvContent); // BOM for Hebrew/Excel

      // 3. Info Text
      const infoText = `
Habal Zug Community Backup
Generated: ${new Date().toLocaleString('he-IL')}
Total Members: ${members.length}
Total Gallery Items: ${galleryItems.length}
Total Events: ${events.length}
Total News items: ${news.length}
      `.trim();
      zip.file("backup_info.txt", infoText);

      // Fix: Double cast to ensure strict type safety when result is inferred as unknown
      const content = (await zip.generateAsync({ type: "blob" })) as unknown as Blob;
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `habal_zug_full_backup_${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMsg('גיבוי ZIP נוצר והורד בהצלחה!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('שגיאה ביצירת הגיבוי');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    const backupData = {
      members,
      galleryItems,
      events,
      news,
      joinRequests,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habal_zug_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg('נתוני JSON יוצאו בהצלחה!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (window.confirm('האם אתה בטוח שברצונך לייבא את הנתונים? פעולה זו עשויה לדרוס נתונים קיימים.')) {
          localStorage.setItem('members_hv', JSON.stringify(importedData.members || []));
          localStorage.setItem('join_requests_hv', JSON.stringify(importedData.joinRequests || []));
          localStorage.setItem('session_attendees_hv', JSON.stringify([]));
          alert('הנתונים יובאו בהצלחה. המערכת תתרענן כעת.');
          window.location.reload();
        }
      } catch (err) {
        alert('שגיאה בקריאת הקובץ. וודא שמדובר בקובץ JSON תקין.');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      onUpdateMember(editingMember);
      setSuccessMsg(`הפרטים של ${editingMember.name} עודכנו.`);
      setEditingMember(null);
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Add required attendees property
    onAddEvent({
      title: eventTitle,
      description: eventDesc,
      date: eventDate,
      time: eventTime,
      location: eventLoc,
      imageUrl: eventImg || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
      attendees: []
    });
    setSuccessMsg('אירוע חדש פורסם בהצלחה!');
    setEventTitle('');
    setEventDesc('');
    setEventDate('');
    setEventTime('');
    setEventLoc('');
    setEventImg('');
    setTimeout(() => {
      setSuccessMsg('');
      setActiveTab('EVENTS');
    }, 2000);
  };

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNews({
      title: newsTitle,
      content: newsContent,
      category: newsCategory,
      date: new Date().toISOString().split('T')[0],
      imageUrl: newsImg || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800'
    });
    setSuccessMsg('עדכון חדש פורסם בהצלחה!');
    setNewsTitle('');
    setNewsContent('');
    setNewsCategory('Update');
    setNewsImg('');
    setTimeout(() => {
      setSuccessMsg('');
      setActiveTab('NEWS');
    }, 2000);
  };

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right" dir="rtl">
      {/* Background Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-100/50 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/40 rounded-full blur-[100px] -ml-48"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 text-slate-200 text-[10px] font-black uppercase tracking-widest mb-3 border border-white/10 shadow-xl">
              <ShieldAlert size={12} className="text-indigo-400" />
              בקרת מנהל מערכת
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">מרכז ניהול קהילה</h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">ניהול חברים, תוכן ואבטחת המידע של חבל זוג.</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-8 bg-slate-950 text-white px-8 py-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 shadow-2xl border border-white/10">
            <CheckCircle2 className="text-emerald-400" />
            <span className="font-black text-sm uppercase tracking-wider">{successMsg}</span>
          </div>
        )}

        {/* Admin Tabs */}
        <div className="flex flex-wrap gap-3 p-2 bg-slate-100 rounded-[2.5rem] w-fit mb-12 overflow-x-auto shadow-inner">
          {[
            { id: 'MEMBERS', label: 'חברים', icon: Users },
            { id: 'REQUESTS', label: 'בקשות', icon: UserCheck, count: joinRequests.length },
            { id: 'EVENTS', label: 'אירועים', icon: Calendar },
            { id: 'NEWS', label: 'חדשות', icon: Newspaper },
            { id: 'GALLERY', label: 'גלריה', icon: ImageIcon },
            { id: 'ADD', label: 'הוספה', icon: Plus },
            { id: 'SYSTEM', label: 'תחזוקה', icon: RefreshCw },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-sm transition-all whitespace-nowrap relative group ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'} />
              {tab.label}
              {tab.count ? (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[600px] relative">
          {activeTab === 'MEMBERS' && (
            <div className="p-12">
              <div className="mb-14 max-w-xl">
                <div className="relative group">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={22} />
                  <input 
                    type="text" 
                    placeholder="חפש חבר קהילה..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-16 pl-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:bg-white focus:border-indigo-200 outline-none transition-all font-black text-slate-950 shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="bg-white rounded-[3rem] border border-slate-100 p-8 hover:shadow-2xl transition-all duration-500 group flex flex-col hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-8">
                      <div className="relative">
                        <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-[1.75rem] border border-slate-100 shadow-lg object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-4 border-white rounded-full ${member.role === 'Admin' ? 'bg-slate-950' : 'bg-emerald-500'}`}></div>
                      </div>
                      <button onClick={() => setEditingMember(member)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-2xl transition-all">
                        <Edit3 size={20} />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-950 text-xl mb-1 tracking-tight">{member.name}</h4>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mb-6">
                        {member.role === 'Admin' ? 'מנהל מערכת' : 'חבר קהילה'}
                      </p>
                      <div className="space-y-3 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                        <div className="flex items-center gap-3"><Mail size={14} className="text-indigo-500" /> {member.email}</div>
                        <div className="flex items-center gap-3"><Phone size={14} className="text-indigo-500" /> {member.mobile}</div>
                      </div>
                    </div>
                    <div className="mt-10 flex gap-3">
                      <button onClick={() => onResetPassword(member.id)} className="flex-1 py-4 bg-slate-50 text-slate-950 hover:bg-slate-950 hover:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-100">
                        איפוס
                      </button>
                      <button onClick={() => onToggleRole(member.id)} className="flex-1 py-4 bg-slate-50 text-slate-950 hover:bg-slate-950 hover:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-100">
                        הרשאות
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'REQUESTS' && (
            <div className="p-12">
              <h3 className="text-3xl font-black text-slate-950 mb-10 tracking-tight">בקשות הממתינות לאישור</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {joinRequests.map((req) => (
                  <div key={req.id} className="bg-slate-50 rounded-[3rem] border border-slate-100 p-10 flex flex-col group hover:bg-white hover:shadow-2xl transition-all duration-500">
                     <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-sm text-indigo-100">
                           <Users size={40} />
                        </div>
                        <div>
                           <h4 className="font-black text-slate-950 text-xl tracking-tight">{req.name}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{req.requestedAt}</p>
                        </div>
                     </div>
                     <div className="space-y-4 mb-10 flex-1">
                        <div className="flex items-center gap-4 text-slate-600 font-bold text-sm"><Mail size={18} className="text-indigo-500" /> {req.email}</div>
                        <div className="flex items-center gap-4 text-slate-600 font-bold text-sm"><Phone size={18} className="text-indigo-500" /> {req.mobile}</div>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => handleApprove(req.id)} className="flex-1 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs hover:bg-emerald-600 transition-all shadow-xl">אשר הצטרפות</button>
                        <button onClick={() => onRejectRequest(req.id)} className="flex-1 py-5 bg-white border border-slate-100 text-red-500 rounded-[1.5rem] font-black text-xs hover:bg-red-50 transition-all">דחה</button>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SYSTEM' && (
            <div className="p-16 max-w-5xl mx-auto space-y-14">
              <div className="text-center space-y-4">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-slate-950/10 rounded-full blur-3xl"></div>
                  <Database className="w-20 h-20 text-slate-950 relative z-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-950 tracking-tight">תחזוקה וסנכרון נתונים</h3>
                <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto">נהל את מסד הנתונים של הקהילה, בצע גיבויים תקופתיים ושחזר מידע במקרה הצורך.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Full ZIP Backup Card */}
                <button 
                  onClick={handleExportZip} 
                  disabled={isExporting}
                  className="group relative p-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[3rem] flex flex-col items-center gap-6 shadow-2xl hover:scale-105 active:scale-95 transition-all text-white overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-xl border border-white/20">
                    {isExporting ? <Loader2 size={36} className="animate-spin" /> : <FileArchive size={36} />}
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-xl mb-1">גיבוי מלא (ZIP)</span>
                    <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">כולל דוחות CSV ונתוני JSON</span>
                  </div>
                  <Download size={20} className="mt-2 text-indigo-100 group-hover:translate-y-1 transition-transform" />
                </button>

                {/* JSON Data Export */}
                <button 
                  onClick={handleExportJson} 
                  className="group p-10 bg-white border border-slate-100 rounded-[3rem] flex flex-col items-center gap-6 hover:shadow-2xl transition-all hover:-translate-y-2"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all shadow-inner">
                    <FileJson size={36} />
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-slate-950 text-xl mb-1">ייצוא נתוני JSON</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">קובץ מסד נתונים גולמי</span>
                  </div>
                </button>

                {/* Data Import Card */}
                <button 
                  onClick={() => importFileInputRef.current?.click()} 
                  className="group p-10 bg-white border border-slate-100 rounded-[3rem] flex flex-col items-center gap-6 hover:shadow-2xl transition-all hover:-translate-y-2"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                    <Upload size={36} />
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-slate-950 text-xl mb-1">ייבוא ושחזור</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">טעינת נתונים מקובץ JSON</span>
                  </div>
                </button>
              </div>

              <input type="file" ref={importFileInputRef} hidden accept=".json" onChange={handleImportData} />

              <div className="bg-slate-50/50 rounded-[3rem] p-10 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
                      <Clock3 size={32} />
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">סטטוס סנכרון</p>
                      <p className="text-slate-950 font-black text-lg">המערכת מעודכנת לזמן אמת</p>
                   </div>
                </div>
                <button onClick={() => window.location.reload()} className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs hover:bg-slate-950 hover:text-white transition-all shadow-sm">
                  <RefreshCw size={16} />
                  רענן נתונים
                </button>
              </div>
            </div>
          )}

          {activeTab === 'EVENTS' && (
            <div className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group">
                    <div className="h-40 relative">
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      <button onClick={() => onDeleteEvent(event.id)} className="absolute top-4 left-4 p-3 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="p-6">
                      <h4 className="font-black text-slate-950 mb-2">{event.title}</h4>
                      <p className="text-xs text-slate-400 mb-4">{event.date} | {event.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'NEWS' && (
            <div className="p-12">
               <div className="grid grid-cols-1 gap-6">
                {news.map((item) => (
                  <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex items-center justify-between group hover:shadow-xl transition-all">
                    <div className="flex items-center gap-6">
                       {item.imageUrl && <img src={item.imageUrl} className="w-20 h-20 rounded-2xl object-cover" />}
                       <div>
                          <h4 className="font-black text-slate-950 text-xl">{item.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{item.date} | {item.category}</p>
                       </div>
                    </div>
                    <button onClick={() => onDeleteNews(item.id)} className="p-4 bg-slate-50 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ADD' && (
            <div className="p-14 max-w-5xl mx-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {/* Add Event Form */}
                  <form onSubmit={handleAddEvent} className="space-y-8 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                     <h3 className="text-2xl font-black text-slate-950 flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                           <Calendar size={24} />
                        </div>
                        הוספת אירוע
                     </h3>
                     <input type="text" placeholder="שם האירוע" required value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-indigo-400 outline-none font-black text-lg shadow-sm" />
                     <textarea placeholder="תיאור האירוע" required value={eventDesc} onChange={e => setEventDesc(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-indigo-400 outline-none font-bold min-h-[120px] shadow-sm italic" />
                     <div className="grid grid-cols-2 gap-4">
                        <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="px-6 py-5 bg-white border border-slate-100 rounded-2xl focus:border-indigo-400 outline-none font-black" />
                        <input type="time" required value={eventTime} onChange={e => setEventTime(e.target.value)} className="px-6 py-5 bg-white border border-slate-100 rounded-2xl focus:border-indigo-400 outline-none font-black" />
                     </div>
                     <input type="text" placeholder="מיקום האירוע" required value={eventLoc} onChange={e => setEventLoc(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-indigo-400 outline-none font-black shadow-sm" />
                     <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black text-xl hover:bg-indigo-600 shadow-2xl transition-all active:scale-95">פרסם אירוע חדש</button>
                  </form>

                  {/* Add News Form */}
                  <form onSubmit={handleAddNews} className="space-y-8 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                     <h3 className="text-2xl font-black text-slate-950 flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                           <Newspaper size={24} />
                        </div>
                        הוספת חדשות
                     </h3>
                     <input type="text" placeholder="כותרת הכתבה" required value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-blue-400 outline-none font-black text-lg shadow-sm" />
                     <textarea placeholder="תוכן הכתבה..." required value={newsContent} onChange={e => setNewsContent(e.target.value)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-blue-400 outline-none font-bold min-h-[180px] shadow-sm italic leading-relaxed" />
                     <select value={newsCategory} onChange={e => setNewsCategory(e.target.value as any)} className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl focus:border-blue-400 outline-none font-black text-slate-950 shadow-sm">
                        <option value="Update">עדכון כללי</option>
                        <option value="Activity">פעילות שטח</option>
                        <option value="Announcement">הודעה חשובה</option>
                        <option value="Personal">חוויה אישית</option>
                        <option value="Share">רוצה לשתף</option>
                     </select>
                     <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black text-xl hover:bg-blue-600 shadow-2xl transition-all active:scale-95">פרסם כתבה חדשה</button>
                  </form>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl p-14 overflow-hidden text-right border border-white/20 animate-in zoom-in-95">
              <h3 className="text-3xl font-black text-slate-950 mb-10 tracking-tight">עריכת פרטי חבר</h3>
              <form onSubmit={handleUpdateMemberSubmit} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">שם מלא</label>
                    <input type="text" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-400 shadow-inner" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">אימייל</label>
                    <input type="email" value={editingMember.email} onChange={e => setEditingMember({...editingMember, email: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-400 shadow-inner" />
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="submit" className="flex-1 py-5 bg-slate-950 text-white rounded-2xl font-black text-md hover:bg-indigo-600 transition-all shadow-xl">שמור שינויים</button>
                    <button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-md hover:bg-slate-200 transition-all">ביטול</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showEmailModal && approvedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden p-16 text-center animate-in zoom-in-95 border border-white/20">
             <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mx-auto mb-10 shadow-xl shadow-emerald-500/10">
               <CheckCircle2 size={56} />
             </div>
             <h3 className="text-3xl font-black text-slate-950 mb-4 tracking-tight">החבר אושר בהצלחה!</h3>
             <p className="text-slate-500 font-bold mb-12 text-lg leading-relaxed px-8">
               פרטי הגישה נוצרו בהצלחה עבור {approvedMember.name}. החבר יכול להיכנס כעת עם האימייל שלו והסיסמה הזמנית temp.
             </p>
             <button onClick={() => setShowEmailModal(false)} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all shadow-2xl">סיים תהליך אישור</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
