import React, { useState, useRef } from 'react';
import { 
  Users, 
  Trash2, 
  ShieldAlert, 
  Mail, 
  Phone, 
  Search,
  Loader2,
  X,
  UserCheck,
  UserPlus,
  Palette,
  Save,
  UserCog,
  Calendar,
  Newspaper,
  Edit2,
  Lock,
  UserX,
  Archive,
  RotateCcw,
  AlertOctagon,
  Check,
  Box,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Layout,
  UserMinus,
  CheckCircle2,
  Info,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Music,
  Camera,
  MessageSquare,
  Cake,
  ExternalLink,
  ShieldCheck,
  UserCircle,
  Activity
} from 'lucide-react';
import { Member, JoinRequest, Event, NewsItem } from '../types';

interface AdminPageProps {
  user: Member;
  members: Member[];
  onDeleteMember: (id: string) => Promise<void>;
  onPermanentDeleteMember: (id: string) => Promise<void>;
  onResetPassword: (id: string) => Promise<void>;
  onToggleRole: (id: string) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onUpdateMember: (member: Member) => Promise<void>;
  joinRequests: JoinRequest[];
  onApproveRequest: (id: string) => Promise<{ name: string; mobile: string; tempPassword: string } | null>;
  onRejectRequest: (id: string) => Promise<void>;
  siteAssets: { 
    clubLogo?: string; 
    atalefLogo?: string; 
    habalZugLogo?: string;
    heroBg?: string; 
    loginBg?: string;
  };
  events: Event[];
  news: NewsItem[];
  onDeleteEvent: (id: string) => Promise<void>;
  onDeleteNews: (id: string) => Promise<void>;
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  members, 
  onDeleteMember, 
  onPermanentDeleteMember,
  onToggleStatus,
  onToggleRole,
  onUpdateMember,
  joinRequests,
  onApproveRequest,
  onRejectRequest,
  siteAssets,
  events,
  news,
  onDeleteEvent,
  onDeleteNews
}) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'REQUESTS' | 'EVENTS' | 'NEWS' | 'SITE' | 'ARCHIVE'>('MEMBERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const formatDate = (dateValue?: string) => {
    if (!dateValue) return '---';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'MEMBERS') return matchesSearch && m.isActive !== false;
    if (activeTab === 'ARCHIVE') return matchesSearch && m.isActive === false;
    return matchesSearch;
  });

  const handleToggle = async (id: string, toggleFn: (id: string) => Promise<void>) => {
    setIsProcessingId(id);
    try {
      await toggleFn(id);
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-12 pb-20 pt-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest mb-4 shadow-xl">
              <ShieldAlert size={12} className="text-rose-400" />
              מרכז שליטה מנהל
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">ניהול חברים</h2>
            <p className="text-slate-500 font-bold text-lg">עריכה, ניהול סטטוסים ותפקידים של חברי הנבחרת.</p>
          </div>
          
          <div className="flex bg-slate-100 p-2 rounded-[2.5rem] border border-slate-200 flex-wrap gap-1">
            {[
              { id: 'MEMBERS', label: 'חברים פעילים', icon: Users },
              { id: 'ARCHIVE', label: 'ארכיון', icon: Archive },
              { id: 'REQUESTS', label: 'בקשות הצטרפות', icon: UserPlus },
              { id: 'SITE', label: 'נכסי אתר', icon: Layout }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3.5 rounded-full font-black text-xs transition-all flex items-center gap-2.5 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table View for Members */}
        {(activeTab === 'MEMBERS' || activeTab === 'ARCHIVE') && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="relative group">
              <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="חפש חבר לפי שם או אימייל..." 
                className="w-full pr-20 pl-10 py-6 bg-slate-50 border border-slate-100 rounded-[3rem] focus:bg-white outline-none transition-all font-black text-slate-950 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">חבר נבחרת וניהול סטטוס</th>
                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">מידע נוסף</th>
                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">הצטרפות</th>
                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/20 transition-colors group/row">
                          <td className="px-10 py-10">
                            <div className="flex items-start gap-8">
                              <div className="relative shrink-0">
                                <img src={m.avatar} className={`w-20 h-20 rounded-[2rem] object-cover border-4 ${!m.isActive ? 'grayscale opacity-30 border-slate-200' : 'border-white shadow-xl'}`} alt="" />
                                {isProcessingId === m.id && (
                                  <div className="absolute inset-0 bg-white/60 rounded-[2rem] flex items-center justify-center backdrop-blur-[1px]">
                                    <Loader2 className="animate-spin text-slate-950" size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-6">
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <p className={`font-black text-2xl leading-tight ${!m.isActive ? 'text-slate-400' : 'text-slate-900'}`}>{m.name}</p>
                                    {m.role === 'Admin' && <ShieldCheck size={18} className="text-indigo-600" />}
                                  </div>
                                  <p className="text-slate-400 font-bold text-sm tracking-tight">{m.email}</p>
                                </div>
                                
                                {/* --- Rolling Toggles Area --- */}
                                <div className="flex items-center gap-12 bg-white/50 backdrop-blur-sm p-5 rounded-[2.5rem] border border-slate-100 shadow-sm w-fit">
                                  
                                  {/* Active/Suspended Toggle */}
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">סטטוס משתמש</span>
                                    <div className="scale-[0.35] origin-top">
                                      <input 
                                        type="checkbox" 
                                        id={`toggle-active-${m.id}`} 
                                        className="rolling-toggle-checkbox" 
                                        checked={m.isActive !== false}
                                        onChange={() => handleToggle(m.id, onToggleStatus)}
                                      />
                                      <div className="rolling-toggle-bg">
                                        <label htmlFor={`toggle-active-${m.id}`} className="rolling-toggle-ball"></label>
                                      </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${m.isActive !== false ? 'text-emerald-500' : 'text-slate-400'}`}>
                                      {m.isActive !== false ? 'פעיל' : 'מושעה'}
                                    </span>
                                  </div>

                                  {/* Admin/Member Toggle */}
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">סוג הרשאה</span>
                                    <div className="scale-[0.35] origin-top">
                                      <input 
                                        type="checkbox" 
                                        id={`toggle-role-${m.id}`} 
                                        className="rolling-toggle-checkbox" 
                                        checked={m.role === 'Admin'}
                                        onChange={() => handleToggle(m.id, onToggleRole)}
                                      />
                                      <div className="rolling-toggle-bg">
                                        <label htmlFor={`toggle-role-${m.id}`} className="rolling-toggle-ball"></label>
                                      </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${m.role === 'Admin' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                      {m.role === 'Admin' ? 'מנהל' : 'חבר'}
                                    </span>
                                  </div>

                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-10 text-center">
                            <div className="flex flex-col items-center gap-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">סך סשנים</p>
                               <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-900 text-xl shadow-inner">
                                 {m.totalAttendance || 0}
                               </div>
                            </div>
                          </td>
                          <td className="px-10 py-10 text-center text-slate-500 font-black text-sm">
                             <div className="flex flex-col items-center gap-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">תאריך</p>
                               <span>{formatDate(m.joinedAt)}</span>
                             </div>
                          </td>
                          <td className="px-10 py-10">
                            <div className="flex items-center justify-end gap-4">
                               <button 
                                 onClick={() => onPermanentDeleteMember(m.id)} 
                                 className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-2xl border border-transparent hover:border-rose-100"
                                 title="מחיקה סופית"
                               >
                                 <Trash2 size={20} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'REQUESTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in">
            {joinRequests.length > 0 ? joinRequests.map(req => (
              <div key={req.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all">
                <div className="flex items-center gap-6 mb-10">
                  <img src={req.avatar} className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-slate-50 shadow-md" alt="" />
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 leading-tight mb-1">{req.name}</h4>
                    <p className="text-slate-400 font-bold text-xs">{req.email}</p>
                    <p className="text-slate-400 font-bold text-xs">{req.mobile}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => onApproveRequest(req.id)} className="flex-1 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                    <UserCheck size={18} /> אישור
                  </button>
                  <button onClick={() => onRejectRequest(req.id)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black text-sm hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95">
                    דחייה
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                <UserPlus size={48} className="text-slate-200 mb-6" />
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">אין בקשות חדשות</h3>
                <p className="text-slate-400 font-bold">כל הבקשות טופלו בהצלחה.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'SITE' && (
           <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-sm">
                  <Palette size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">נכסי ויזואליה</h3>
                  <p className="text-slate-500 font-bold">ניהול הלוגואים והרקעים של מערכת חבל זוג.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">
                {['heroBg', 'loginBg', 'habalZugLogo', 'atalefLogo', 'clubLogo'].map(assetKey => (
                  <div key={assetKey} className="space-y-4 group">
                    <div className="flex justify-between items-center px-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{assetKey}</p>
                    </div>
                    <div className="aspect-video rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden relative shadow-inner group-hover:border-indigo-100 transition-colors">
                       {siteAssets[assetKey as keyof typeof siteAssets] ? (
                         <img src={siteAssets[assetKey as keyof typeof siteAssets]} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" alt="" />
                       ) : (
                         <ImageIcon size={40} className="text-slate-200" />
                       )}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage;