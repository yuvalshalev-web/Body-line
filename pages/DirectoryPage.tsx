import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  X, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Globe, 
  Mail,
  Bird,
  ExternalLink
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

  return (
    <div className="min-h-screen bg-white text-right" dir="rtl">
      <div className="mb-12 space-y-1">
        <h2 className="text-5xl font-black italic tracking-tighter text-slate-900">ספר החברים</h2>
        <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest">נבחרת המייסדים • {activeMembers.length} חברים פעילים</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="flex-1 relative">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 opacity-30" size={18} />
           <input 
             type="text" 
             placeholder="חפש חבר..." 
             className="w-full pr-14 pl-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:bg-white transition-all shadow-sm text-sm"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="relative">
           <button 
             onClick={() => setIsSortOpen(!isSortOpen)}
             className="w-full md:w-auto h-full px-8 py-4.5 bg-slate-950 text-white rounded-2xl font-black text-xs flex items-center justify-between gap-3 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
           >
              <span>מיין לפי</span> <ChevronDown size={14} className={isSortOpen ? 'rotate-180 transition-transform' : ''} />
           </button>
           {isSortOpen && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <button onClick={() => {setSortBy('name-asc'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors border-b border-slate-50">שם (א-ת)</button>
                <button onClick={() => {setSortBy('attendance'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors border-b border-slate-50">הכי פעילים</button>
                <button onClick={() => {setSortBy('newest'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors">חדשים</button>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-5">
        {processedMembers.map(member => (
          <div key={member.id} className="group cursor-pointer flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 active:scale-95 transition-all" onClick={() => setSelectedMember(member)}>
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-slate-50 group-hover:border-indigo-600 group-hover:shadow-xl transition-all duration-300">
               <img src={member.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={member.name} />
               {member.role === 'Admin' && <div className="absolute top-1 left-1 bg-slate-950/90 text-white px-1.5 py-0.5 font-black text-[6px] uppercase tracking-widest rounded-md">ADMIN</div>}
            </div>
            <h3 className="text-[10px] font-black text-slate-800 text-center truncate w-full group-hover:text-indigo-600 transition-colors">{member.name}</h3>
          </div>
        ))}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedMember(null)}>
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="md:w-5/12 relative aspect-[4/3] md:aspect-auto overflow-hidden">
                 <img src={selectedMember.avatar} className="w-full h-full object-cover" alt={selectedMember.name} />
              </div>
              <div className="flex-1 p-14 overflow-y-auto custom-scrollbar text-right">
                <button onClick={() => setSelectedMember(null)} className="absolute top-8 left-8 p-3 text-slate-400 hover:text-slate-950 transition-colors bg-slate-50 rounded-2xl"><X size={24} /></button>
                <div className="space-y-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-5xl font-black text-slate-950 tracking-tighter">{selectedMember.name}</h3>
                       {selectedMember.role === 'Admin' && <div className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black border border-indigo-100 uppercase tracking-widest">ADMIN</div>}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Bird size={14} className="text-indigo-400" /> חבר נבחרת • הצטרף ב-{formatDate(selectedMember.joinedAt)}
                    </p>
                  </div>
                  
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <p className="font-bold text-slate-600 leading-relaxed italic pr-4 border-r-4 border-indigo-200">{selectedMember.bio || 'חבר בקהילת הגולשים של חבל זוג.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"><Mail size={16} className="text-slate-400" /><div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase">אימייל</p><p className="text-xs font-black">{selectedMember.email}</p></div></div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"><Globe size={16} className="text-slate-400" /><div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase">סשנים</p><p className="text-xs font-black">{selectedMember.totalAttendance || 0}</p></div></div>
                  </div>

                  <div className="flex gap-3">
                    {selectedMember.instagramUrl && <a href={selectedMember.instagramUrl} target="_blank" className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all"><Instagram size={24} /></a>}
                    {selectedMember.facebookUrl && <a href={selectedMember.facebookUrl} target="_blank" className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all"><Facebook size={24} /></a>}
                    {selectedMember.linkedinUrl && <a href={selectedMember.linkedinUrl} target="_blank" className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all"><Linkedin size={24} /></a>}
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;