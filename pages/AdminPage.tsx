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
  UserCircle
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { Member, JoinRequest, Event, NewsItem } from '../types';
import { hashPassword } from '../utils/crypto';

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
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAssetField = useRef<string | null>(null);

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
            <p className="text-slate-500 font-bold text-lg">בצע עריכה, אירכוב וניהול תפקידים של חברי הנבחרת.</p>
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

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">חבר הנבחרת ותפעול סטטוס</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">מידע נוסף</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">הצטרף ב-</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/30 transition-colors group/row">
                          <td className="px-10 py-8">
                            <div className="flex items-start gap-6">
                              <div className="shrink-0">
                                <img src={m.avatar} className={`w-16 h-16 rounded-[1.5rem] object-cover border-2 ${!m.isActive ? 'grayscale opacity-40 border-slate-200' : 'border-white shadow-md'}`} alt="" />
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <p className={`font-black text-xl leading-tight ${!m.isActive ? 'text-slate-400' : 'text-slate-900'}`}>{m.name}</p>
                                  <p className="text-slate-400 font-bold text-xs">{m.email}</p>
                                </div>
                                
                                {/* --- Rolling Toggles Injection --- */}
                                <div className="flex items-center gap-10 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                  {/* Activity Toggle */}
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">סטטוס פעיל</span>
                                    <div className="scale-[0.25] origin-top">
                                      <input 
                                        type="checkbox" 
                                        id={`toggle-active-${m.id}`} 
                                        className="rolling-toggle-checkbox" 
                                        checked={m.isActive !== false}
                                        onChange={() => onToggleStatus(m.id)}
                                      />
                                      <div className="rolling-toggle-bg">
                                        <label htmlFor={`toggle-active-${m.id}`} className="rolling-toggle-ball"></label>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${m.isActive !== false ? 'text-emerald-500' : 'text-slate-400'}`}>
                                      {m.isActive !== false ? 'פעיל' : 'מושבת'}
                                    </span>
                                  </div>

                                  {/* Role Toggle */}
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">סוג מנוי</span>
                                    <div className="scale-[0.25] origin-top">
                                      <input 
                                        type="checkbox" 
                                        id={`toggle-role-${m.id}`} 
                                        className="rolling-toggle-checkbox" 
                                        checked={m.role === 'Admin'}
                                        onChange={() => onToggleRole(m.id)}
                                      />
                                      <div className="rolling-toggle-bg">
                                        <label htmlFor={`toggle-role-${m.id}`} className="rolling-toggle-ball"></label>
                                      </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${m.role === 'Admin' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                      {m.role === 'Admin' ? 'מנהל' : 'חבר'}
                                    </span>
                                  </div>
                                </div>
                                {/* --- End of Toggles --- */}
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סשנים</p>
                               <span className="text-xl font-black text-slate-900">{m.totalAttendance || 0}</span>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-center text-slate-500 font-black text-sm">
                            {formatDate(m.joinedAt)}
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center justify-end gap-3">
                               <button 
                                 onClick={() => onPermanentDeleteMember(m.id)} 
                                 className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                                 title="מחיקה סופית"
                               >
                                 <Trash2 size={18} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
            {joinRequests.length > 0 ? joinRequests.map(req => (
              <div key={req.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-6 mb-8">
                  <img src={req.avatar} className="w-20 h-20 rounded-[1.5rem] object-cover" alt="" />
                  <div>
                    <h4 className="text-2xl font-black text-slate-900">{req.name}</h4>
                    <p className="text-slate-400 font-bold text-xs">{req.email} • {req.mobile}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => onApproveRequest(req.id)} className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                    <UserCheck size={16} /> אישור
                  </button>
                  <button onClick={() => onRejectRequest(req.id)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs hover:bg-rose-50 hover:text-rose-600 transition-all">
                    דחייה
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center text-slate-400 font-black italic">אין בקשות חדשות כרגע...</div>
            )}
          </div>
        )}

        {activeTab === 'SITE' && (
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-6">נכסי ויזואליה של האתר</h3>
              <p className="text-slate-500 mb-10 font-bold">כאן ניתן לעדכן את הלוגואים והרקעים המרכזיים המופיעים במערכת.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['heroBg', 'loginBg', 'habalZugLogo', 'atalefLogo', 'clubLogo'].map(assetKey => (
                  <div key={assetKey} className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">{assetKey}</p>
                    <div className="aspect-video rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                       {siteAssets[assetKey as keyof typeof siteAssets] ? (
                         <img src={siteAssets[assetKey as keyof typeof siteAssets]} className="w-full h-full object-contain" alt="" />
                       ) : (
                         <ImageIcon size={32} className="text-slate-200" />
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