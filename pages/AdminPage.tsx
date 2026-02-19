import React, { useState } from 'react';
import { 
  Users, 
  Trash2, 
  ShieldAlert, 
  Search,
  Loader2,
  UserCheck,
  UserPlus,
  Palette,
  Layout,
  Archive,
  ShieldCheck,
  Pencil,
  X,
  Save,
  Camera,
  Key,
  Instagram,
  Facebook,
  Linkedin,
  Music,
  Globe
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';

const XLogo = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

const AdminPage: React.FC = () => {
  const { 
    members, joinRequests, siteAssets,
    updateMember, toggleStatus, toggleRole, resetPassword, approveRequest, rejectRequest
  } = useData();

  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'REQUESTS' | 'SITE' | 'ARCHIVE'>('MEMBERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'MEMBERS') return matchesSearch && m.isActive !== false;
    if (activeTab === 'ARCHIVE') return matchesSearch && m.isActive === false;
    return matchesSearch;
  });

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSaving(true);
    try {
      await updateMember(editingMember);
      setEditingMember(null);
    } catch (err) {
      alert('שגיאה בעדכון');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-right space-y-12 pb-20 pt-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full mb-4">
              <ShieldAlert size={12} className="text-rose-400" /> מנהל מערכת
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">ניהול חברי הנבחרת</h2>
          </div>
          <div className="flex bg-slate-100 p-2 rounded-full gap-1">
            {['MEMBERS', 'ARCHIVE', 'REQUESTS', 'SITE'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 rounded-full font-black text-xs transition-all ${activeTab === tab ? 'bg-white shadow-xl text-slate-900' : 'text-slate-400'}`}
              >
                {tab === 'MEMBERS' ? 'פעילים' : tab === 'ARCHIVE' ? 'ארכיון' : tab === 'REQUESTS' ? 'בקשות' : 'אתר'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-8">
           <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
           <input 
             type="text" 
             placeholder="חיפוש חבר..." 
             className="w-full pr-16 pl-6 py-6 bg-slate-50 rounded-[2.5rem] border-none font-black focus:ring-2 ring-slate-200"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
           <table className="w-full text-right">
              <thead className="bg-slate-50">
                 <tr>
                    <th className="px-10 py-6 font-black text-xs text-slate-400 uppercase tracking-widest">חבר</th>
                    <th className="px-10 py-6 font-black text-xs text-slate-400 uppercase tracking-widest text-center">סטטוס</th>
                    <th className="px-10 py-6 font-black text-xs text-slate-400 uppercase tracking-widest text-left">פעולות</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                             <img src={m.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                             <div>
                                <p className="font-black text-xl text-slate-900">{m.name}</p>
                                <p className="text-slate-400 font-bold text-xs">{m.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <div className="flex flex-col items-center gap-3">
                             <input 
                               type="checkbox" 
                               className="rolling-toggle-checkbox" 
                               checked={m.isActive !== false} 
                               onChange={() => toggleStatus(m.id)} 
                               id={`t-stat-${m.id}`}
                             />
                             <div className="scale-[0.3] rolling-toggle-bg">
                                <label htmlFor={`t-stat-${m.id}`} className="rolling-toggle-ball"></label>
                             </div>
                             <span className={`text-[10px] font-black uppercase ${m.isActive !== false ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {m.isActive !== false ? 'פעיל' : 'מושעה'}
                             </span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex justify-end gap-2">
                             <button onClick={() => setEditingMember(m)} className="p-3 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-all"><Pencil size={18} /></button>
                             <button onClick={() => resetPassword(m.id)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-xl transition-all"><Key size={18} /></button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl p-14 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setEditingMember(null)} className="absolute top-8 left-8 p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-950 transition-colors"><X size={24} /></button>
              <h3 className="text-3xl font-black mb-10">עריכת פרטי חבר</h3>
              <form onSubmit={handleUpdateSubmit} className="space-y-8">
                <div className="flex flex-col items-center gap-6 mb-12">
                   <div className="relative">
                      <img src={editingMember.avatar} className="w-40 h-40 rounded-[3rem] object-cover border-8 border-slate-50 shadow-xl" alt="" />
                      <label className="absolute -bottom-2 -left-2 p-3 bg-slate-950 text-white rounded-xl cursor-pointer">
                        <Camera size={20} />
                        <input type="file" className="hidden" accept="image/*" onChange={e => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => setEditingMember({...editingMember, avatar: ev.target?.result as string});
                             reader.readAsDataURL(file);
                           }
                        }} />
                      </label>
                   </div>
                   <div className="flex gap-12 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס משתמש</span>
                         <input type="checkbox" className="rolling-toggle-checkbox" checked={editingMember.isActive !== false} onChange={() => setEditingMember({...editingMember, isActive: !editingMember.isActive})} id="m-stat" />
                         <div className="scale-[0.4] rolling-toggle-bg"><label htmlFor="m-stat" className="rolling-toggle-ball"></label></div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">הרשאת ניהול</span>
                         <input type="checkbox" className="rolling-toggle-checkbox" checked={editingMember.role === 'Admin'} onChange={() => setEditingMember({...editingMember, role: editingMember.role === 'Admin' ? 'Member' : 'Admin'})} id="m-role" />
                         <div className="scale-[0.4] rolling-toggle-bg"><label htmlFor="m-role" className="rolling-toggle-ball"></label></div>
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <input type="text" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none" placeholder="שם מלא" />
                      <input type="email" value={editingMember.email} onChange={e => setEditingMember({...editingMember, email: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none" placeholder="אימייל" />
                      <input type="tel" value={editingMember.mobile} onChange={e => setEditingMember({...editingMember, mobile: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none" placeholder="טלפון נייד" />
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl"><Instagram size={18} className="text-rose-500"/><input type="text" value={editingMember.instagramUrl || ''} onChange={e => setEditingMember({...editingMember, instagramUrl: e.target.value})} className="bg-transparent w-full font-bold outline-none" placeholder="Instagram" /></div>
                      <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl"><Facebook size={18} className="text-blue-600"/><input type="text" value={editingMember.facebookUrl || ''} onChange={e => setEditingMember({...editingMember, facebookUrl: e.target.value})} className="bg-transparent w-full font-bold outline-none" placeholder="Facebook" /></div>
                      <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl"><Globe size={18} className="text-indigo-600"/><input type="text" value={editingMember.websiteUrl || ''} onChange={e => setEditingMember({...editingMember, websiteUrl: e.target.value})} className="bg-transparent w-full font-bold outline-none" placeholder="Website" /></div>
                   </div>
                </div>
                <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4">
                   {isSaving ? <Loader2 className="animate-spin" /> : <Save />} שמירת שינויים
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;