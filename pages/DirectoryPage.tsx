
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  X, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter,
  Music2,
  Globe, 
  Mail,
  Bird,
  ExternalLink,
  MapPin,
  Calendar
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';

type SortOption = 'name-asc' | 'attendance' | 'newest';

const DirectoryPage: React.FC = () => {
  const { members } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const activeMembers = useMemo(() => members.filter(m => m.isActive !== false), [members]);

  const processedMembers = useMemo(() => {
    let filtered = activeMembers.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'he');
      if (sortBy === 'attendance') return (b.totalAttendance || 0) - (a.totalAttendance || 0);
      if (sortBy === 'newest') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      return 0;
    });
  }, [activeMembers, searchTerm, sortBy]);

  const formatDate = (dateValue?: string) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    return d.toLocaleDateString('he-IL');
  };

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http')) return trimmed;
    return `https://${trimmed}`;
  };

  return (
    <div className="min-h-screen bg-white text-right" dir="rtl">
      <div className="mb-12 space-y-2">
        <h2 className="text-6xl font-black italic tracking-tighter text-slate-900">נבחרת הכוכבים</h2>
        <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
          <MapPin size={12} className="text-indigo-500" />
          הרצליה פיתוח • {activeMembers.length} חברי קהילה פעילים
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="flex-1 relative group">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" size={20} />
           <input 
             type="text" 
             placeholder="חפש חבר בקהילה..." 
             className="w-full pr-14 pl-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black outline-none focus:bg-white focus:ring-4 ring-indigo-50 transition-all shadow-sm text-base"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="relative">
           <button 
             onClick={() => setIsSortOpen(!isSortOpen)}
             className="w-full md:w-auto h-full px-8 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs flex items-center justify-between gap-4 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
           >
              <span>מיין לפי</span> <ChevronDown size={14} className={isSortOpen ? 'rotate-180 transition-transform' : ''} />
           </button>
           {isSortOpen && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button onClick={() => {setSortBy('name-asc'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors border-b border-slate-50">שם (א-ת)</button>
                <button onClick={() => {setSortBy('attendance'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors border-b border-slate-50">הכי פעילים בסשנים</button>
                <button onClick={() => {setSortBy('newest'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors">מצטרפים חדשים</button>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-6">
        {processedMembers.map(member => (
          <div key={member.id} className="group cursor-pointer flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 active:scale-95 transition-all" onClick={() => setSelectedMember(member)}>
            <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden border-2 border-slate-100 group-hover:border-indigo-500 group-hover:shadow-2xl transition-all duration-500">
               <img src={member.avatar} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" alt={member.name} />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               {member.role === 'Admin' && <div className="absolute top-2 left-2 bg-slate-900/90 text-white px-2 py-0.5 font-black text-[7px] uppercase tracking-widest rounded-md backdrop-blur-sm shadow-sm">ADMIN</div>}
            </div>
            <h3 className="text-xs font-black text-slate-800 text-center truncate w-full group-hover:text-indigo-600 transition-colors px-2">{member.name}</h3>
          </div>
        ))}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedMember(null)}>
           <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 flex flex-col md:flex-row max-h-[92vh]" onClick={e => e.stopPropagation()}>
              <div className="md:w-[45%] relative aspect-[4/3] md:aspect-auto overflow-hidden bg-slate-100">
                 <img src={selectedMember.avatar} className="w-full h-full object-cover" alt={selectedMember.name} />
                 <div className="absolute bottom-10 right-10 left-10 p-6 bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 hidden md:block">
                    <p className="text-white text-xs font-black uppercase tracking-widest mb-1 opacity-60">הצטרפות לקהילה</p>
                    <p className="text-white text-xl font-black">{formatDate(selectedMember.joinedAt)}</p>
                 </div>
              </div>
              <div className="flex-1 p-14 md:p-16 overflow-y-auto custom-scrollbar text-right flex flex-col">
                <button onClick={() => setSelectedMember(null)} className="absolute top-8 left-8 p-4 text-slate-400 hover:text-slate-950 transition-all bg-slate-50 hover:bg-slate-100 rounded-2xl shadow-sm"><X size={28} /></button>
                
                <div className="space-y-12 flex-1">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                       <h3 className="text-6xl font-black text-slate-950 tracking-tighter leading-none">{selectedMember.name}</h3>
                       {selectedMember.role === 'Admin' && <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 uppercase tracking-widest">ADMIN</div>}
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Bird size={14} className="text-indigo-400" /> חבר נבחרת • {selectedMember.totalAttendance || 0} סשנים
                       </p>
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={14} className="text-sky-400" /> {formatDate(selectedMember.joinedAt)}
                       </p>
                    </div>
                  </div>
                  
                  <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 relative group">
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Bird size={20} /></div>
                    <p className="text-xl font-bold text-slate-700 leading-relaxed italic pr-6 border-r-4 border-indigo-200">{selectedMember.bio || 'חבר בקהילת הגולשים של חבל זוג. חולק את התשוקה לים ולגלים.'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 shadow-sm transition-colors"><Mail size={20} /></div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">אימייל</p>
                          <p className="text-sm font-black text-slate-900 truncate">{selectedMember.email}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-sky-600 shadow-sm transition-colors"><Globe size={20} /></div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">אתר אישי</p>
                          <p className="text-sm font-black text-slate-900 truncate">{selectedMember.websiteUrl || 'אין אתר מקושר'}</p>
                       </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 pr-4">רשתות חברתיות</h4>
                    <div className="flex flex-wrap gap-4">
                      {selectedMember.instagramUrl && (
                        <a href={ensureAbsoluteUrl(selectedMember.instagramUrl)} target="_blank" rel="noopener noreferrer" className="p-5 bg-rose-50 text-rose-600 rounded-3xl hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">
                          <Instagram size={28} />
                        </a>
                      )}
                      {selectedMember.facebookUrl && (
                        <a href={ensureAbsoluteUrl(selectedMember.facebookUrl)} target="_blank" rel="noopener noreferrer" className="p-5 bg-blue-50 text-blue-600 rounded-3xl hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">
                          <Facebook size={28} />
                        </a>
                      )}
                      {selectedMember.tiktokUrl && (
                        <a href={ensureAbsoluteUrl(selectedMember.tiktokUrl)} target="_blank" rel="noopener noreferrer" className="p-5 bg-slate-900 text-white rounded-3xl hover:bg-black transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">
                          <Music2 size={28} />
                        </a>
                      )}
                      {selectedMember.linkedinUrl && (
                        <a href={ensureAbsoluteUrl(selectedMember.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="p-5 bg-indigo-50 text-indigo-600 rounded-3xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">
                          <Linkedin size={28} />
                        </a>
                      )}
                      {selectedMember.twitterUrl && (
                        <a href={ensureAbsoluteUrl(selectedMember.twitterUrl)} target="_blank" rel="noopener noreferrer" className="p-5 bg-sky-50 text-sky-600 rounded-3xl hover:bg-sky-500 hover:text-white transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">
                          <Twitter size={28} />
                        </a>
                      )}
                      {selectedMember.websiteUrl && (
                        <a href={ensureAbsoluteUrl(selectedMember.websiteUrl)} target="_blank" rel="noopener noreferrer" className="p-5 bg-indigo-50 text-indigo-600 rounded-3xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">
                          <Globe size={28} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Habal Zug Member Card • ID: {selectedMember.id.slice(0, 8)}</p>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;
