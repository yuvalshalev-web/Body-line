import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  Zap, 
  X, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Globe, 
  Music,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Cake,
  ExternalLink,
  Bird
} from 'lucide-react';
import { Member } from '../types';

type SortOption = 'name-asc' | 'attendance' | 'newest';

const XLogo = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

interface DirectoryPageProps {
  members: Member[];
}

const DirectoryPage: React.FC<DirectoryPageProps> = ({ members }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const processedMembers = useMemo(() => {
    let filtered = members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'he');
      if (sortBy === 'attendance') return (b.totalAttendance || 0) - (a.totalAttendance || 0);
      if (sortBy === 'newest') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      return 0;
    });
  }, [members, searchTerm, sortBy]);

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const getWhatsAppUrl = (mobile?: string) => {
    if (!mobile) return '';
    const cleaned = mobile.replace(/\D/g, '');
    const withPrefix = cleaned.startsWith('0') ? `972${cleaned.substring(1)}` : cleaned;
    return `https://wa.me/${withPrefix}`;
  };

  const formatDate = (dateValue?: string) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-white text-right" dir="rtl">
      <div className="mb-8 md:mb-12 space-y-1">
        <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter big-wednesday-title text-slate-900">ספר החברים</h2>
        <p className="text-slate-500 font-black text-[9px] md:text-[11px] uppercase tracking-widest">נבחרת המייסדים • {members.length} חברים</p>
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
             className="w-full md:w-auto h-full px-8 py-4.5 bg-slate-950 text-white rounded-2xl font-black text-xs flex items-center justify-between md:justify-start gap-3 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
           >
              <span>מיין לפי</span> <ChevronDown size={14} className={isSortOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
           </button>
           {isSortOpen && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button onClick={() => {setSortBy('name-asc'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors border-b border-slate-50">שם (א-ת)</button>
                <button onClick={() => {setSortBy('attendance'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors border-b border-slate-50">הכי פעילים</button>
                <button onClick={() => {setSortBy('newest'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-xs hover:bg-slate-50 transition-colors">חדשים</button>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-5">
        {processedMembers.map(member => (
          <div 
            key={member.id} 
            className="group cursor-pointer flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 active:scale-95 transition-all"
            onClick={() => setSelectedMember(member)}
          >
            <div className="relative w-full aspect-square rounded-[1.25rem] md:rounded-2xl overflow-hidden border-2 border-slate-50 group-hover:border-indigo-600 group-hover:shadow-xl transition-all duration-300">
               <img src={member.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={member.name} />
               {member.role === 'Admin' && (
                 <div className="absolute top-1 left-1 bg-slate-950/90 text-white px-1.5 py-0.5 font-black text-[6px] uppercase tracking-widest rounded-md">ADMIN</div>
               )}
            </div>
            <h3 className="text-[9px] md:text-[10px] font-black text-slate-800 text-center truncate w-full group-hover:text-indigo-600 transition-colors">{member.name}</h3>
          </div>
        ))}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedMember(null)}>
           <div className="bg-white w-full max-w-4xl rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
              
              <div className="md:w-5/12 relative aspect-[4/3] md:aspect-auto overflow-hidden">
                 <img src={selectedMember.avatar} className="w-full h-full object-cover" alt={selectedMember.name} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden"></div>
                 <button 
                    onClick={() => setSelectedMember(null)}
                    className="absolute top-4 left-4 p-2.5 text-slate-400 hover:text-slate-950 transition-colors bg-white/90 backdrop-blur-md rounded-xl z-20 md:hidden shadow-lg active:scale-90"
                  >
                    <X size={20} />
                  </button>
              </div>

              <div className="flex-1 p-6 md:p-14 overflow-y-auto custom-scrollbar text-center md:text-right">
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-8 left-8 p-3 text-slate-400 hover:text-slate-950 transition-colors bg-slate-50 rounded-2xl z-20 hidden md:block active:scale-90"
                >
                  <X size={24} />
                </button>

                <div className="space-y-8 md:space-y-10">
                  <div className="pt-2 md:pt-0">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
                       <h3 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tighter">{selectedMember.name}</h3>
                       {selectedMember.role === 'Admin' && (
                         <div className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black border border-indigo-100 uppercase tracking-widest">
                           ADMIN
                         </div>
                       )}
                    </div>
                    <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                       <Bird size={14} className="text-indigo-400" /> חבר נבחרת • {formatDate(selectedMember.joinedAt)}
                    </p>
                  </div>

                  {/* Contacts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedMember.email && (
                      <div className="flex items-center gap-4 p-4 md:p-5 bg-slate-50 rounded-[1.25rem] md:rounded-[1.5rem] border border-slate-100">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <Mail size={16} />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">אימייל</p>
                          <p className="text-[11px] md:text-xs font-black text-slate-900 truncate">{selectedMember.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedMember.mobile && (
                      <div className="flex items-center gap-4 p-4 md:p-5 bg-slate-50 rounded-[1.25rem] md:rounded-[1.5rem] border border-slate-100">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <Phone size={16} />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">נייד</p>
                          <p className="text-[11px] md:text-xs font-black text-slate-900 truncate">{selectedMember.mobile}</p>
                        </div>
                      </div>
                    )}
                    {selectedMember.birthday && (
                      <div className="flex items-center gap-4 p-4 md:p-5 bg-slate-50 rounded-[1.25rem] md:rounded-[1.5rem] border border-slate-100">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-rose-300 shadow-sm">
                          <Cake size={16} />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">יום הולדת</p>
                          <p className="text-[11px] md:text-xs font-black text-slate-900">{formatDate(selectedMember.birthday)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                     <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 text-center md:text-right">קצת עלי</h4>
                     <p className="text-slate-700 font-bold leading-relaxed italic text-base md:text-lg pr-0 md:pr-4 border-r-0 md:border-r-4 border-indigo-100">
                       "{selectedMember.bio || 'גולש בנבחרת חבל זוג, חי את הגלים ואת החוף.'}"
                     </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                     <div className="p-5 md:p-6 bg-slate-900 text-white rounded-[1.75rem] md:rounded-[2.5rem] shadow-xl flex flex-col justify-center gap-1">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center md:text-right">פעילות קהילתית</p>
                        <div className="flex items-center justify-center md:justify-start gap-3">
                           <Zap size={20} className="text-yellow-400" />
                           <span className="text-2xl md:text-3xl font-black">{selectedMember.totalAttendance || 0}</span>
                           <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">מפגשים</span>
                        </div>
                     </div>
                     
                     {selectedMember.mobile && (
                       <a 
                         href={getWhatsAppUrl(selectedMember.mobile)}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="p-5 md:p-6 bg-emerald-500 text-white rounded-[1.75rem] md:rounded-[2.5rem] shadow-xl shadow-emerald-200 flex flex-col justify-center gap-1 hover:bg-emerald-600 transition-all active:scale-95 group/btnwa"
                       >
                          <p className="text-[8px] md:text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-1 text-center md:text-right">WhatsApp</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <MessageSquare size={20} />
                               <span className="text-lg md:text-xl font-black">שלח הודעה</span>
                            </div>
                            <ExternalLink size={16} className="opacity-50 group-hover/btnwa:translate-x-1 transition-transform hidden md:block" />
                          </div>
                       </a>
                     )}
                  </div>

                  <div className="space-y-4 pt-4">
                     <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 text-center md:text-right">איפה עוד תמצאו אותי?</h4>
                     <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-5">
                        {[
                          { url: selectedMember.facebookUrl, icon: Facebook, color: '#1877F2' },
                          { url: selectedMember.instagramUrl, icon: Instagram, color: '#E4405F' },
                          { url: selectedMember.linkedinUrl, icon: Linkedin, color: '#0A66C2' },
                          { url: selectedMember.tiktokUrl, icon: Music, color: '#000000' },
                          { url: selectedMember.twitterUrl, icon: XLogo, color: '#000000' },
                          { url: selectedMember.websiteUrl, icon: Globe, color: '#4F46E5' }
                        ].map((soc, idx) => soc.url ? (
                          <a 
                            key={idx} 
                            href={ensureAbsoluteUrl(soc.url)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-12 h-12 md:w-14 md:h-14 rounded-[1rem] md:rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-all hover:-translate-y-2 hover:scale-110 hover:shadow-xl hover:bg-white active:scale-90 group/soclink"
                            style={{ color: soc.color }}
                          >
                            <soc.icon size={22} className="md:w-6 md:h-6 transition-all group-hover/soclink:scale-110" />
                          </a>
                        ) : null)}
                     </div>
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