
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
  Calendar,
  Cake,
  Phone,
  UserCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';

type SortOption = 'name-asc' | 'attendance' | 'newest';

const WhatsAppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.006L0 24l6.149-1.613a11.771 11.771 0 005.9 1.569h.005c6.632 0 12.028-5.398 12.03-12.03a11.85 11.85 0 00-3.527-8.511" />
  </svg>
);

const DirectoryPage: React.FC = () => {
  const { members } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');

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

  const openWhatsAppModal = (name: string) => {
    setWhatsappMessage(`היי ${name}, מה קורה? ראיתי את הפרופיל שלך בנבחרת חבל זוג...`);
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!selectedMember) return;
    const mobile = selectedMember.mobile;
    const cleanMobile = mobile.replace(/\D/g, '');
    const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
    const message = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${finalMobile}?text=${message}`, '_blank');
    setIsWhatsAppModalOpen(false);
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
             className="w-full md:w-auto h-full px-8 py-5 bg-[#006994] text-white rounded-[1.5rem] font-black text-xs flex items-center justify-between gap-4 hover:bg-[#4E8294] transition-all shadow-xl active:scale-95"
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
               {member.avatar ? (
                 <img src={member.avatar} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" alt={member.name} />
               ) : (
                 <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                   <UserCircle size={48} />
                 </div>
               )}
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
                 {selectedMember.avatar ? (
                   <img src={selectedMember.avatar} className="w-full h-full object-cover" alt={selectedMember.name} />
                 ) : (
                   <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                     <UserCircle size={80} />
                   </div>
                 )}
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
                    <div className="flex flex-wrap gap-6 items-center">
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Bird size={16} className="text-indigo-400" /> חבר נבחרת • {selectedMember.totalAttendance || 0} סשנים
                       </p>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={16} className="text-sky-400" /> הצטרפות: {formatDate(selectedMember.joinedAt)}
                       </p>
                       {selectedMember.birthday && (
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Cake size={16} className="text-rose-400" /> יום הולדת: {formatDate(selectedMember.birthday)}
                         </p>
                       )}
                    </div>
                  </div>
                  
                  <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 relative group">
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Bird size={20} /></div>
                    <p className="text-xl font-bold text-slate-700 leading-relaxed italic pr-6 border-r-4 border-indigo-200">{selectedMember.bio || 'חבר בקהילת הגולשים של חבל זוג. חולק את התשוקה לים ולגלים.'}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 shadow-sm transition-colors"><Phone size={20} /></div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">מספר טלפון</p>
                          <p className="text-sm font-black text-slate-900">{selectedMember.mobile}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 shadow-sm transition-colors"><Mail size={20} /></div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">אימייל</p>
                          <p className="text-sm font-black text-slate-900 truncate">{selectedMember.email}</p>
                       </div>
                    </div>

                    <motion.button 
                      onClick={() => openWhatsAppModal(selectedMember.name)}
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: [1, 1.02, 1],
                        boxShadow: [
                          "0 4px 0 0 #388E3C, 0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          "0 4px 0 0 #388E3C, 0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                          "0 4px 0 0 #388E3C, 0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                        ]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: "#43A047",
                        boxShadow: "0 6px 0 0 #2E7D32, 0 25px 30px -5px rgba(0, 0, 0, 0.3)"
                      }}
                      whileTap={{ 
                        scale: 0.98,
                        y: 4,
                        boxShadow: "0 0px 0 0 #2E7D32, 0 5px 10px -2px rgba(0, 0, 0, 0.2)"
                      }}
                      className="w-full flex items-center justify-center gap-4 py-5 bg-[#4CAF50] rounded-2xl transition-colors shadow-[0_4px_0_0_#388E3C] relative overflow-hidden group"
                    >
                       <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer"></div>
                       <WhatsAppIcon className="w-12 h-12 text-white drop-shadow-md" />
                       <span className="text-white text-3xl font-black tracking-tight drop-shadow-sm">WhatsApp Chat</span>
                    </motion.button>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 pr-4">רשתות חברתיות</h4>
                    <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2 custom-scrollbar">
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
      {isWhatsAppModalOpen && selectedMember && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-lg animate-in fade-in" onClick={() => setIsWhatsAppModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-[#075E54] p-8 text-white flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <WhatsAppIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-black text-xl">שלח הודעת WhatsApp</h4>
                <p className="text-xs opacity-70 font-bold">אל: {selectedMember.name}</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">תוכן ההודעה</label>
                <textarea 
                  value={whatsappMessage}
                  onChange={e => setWhatsappMessage(e.target.value)}
                  className="w-full p-6 bg-slate-50 rounded-2xl font-bold h-40 resize-none outline-none border border-slate-100 focus:bg-white focus:border-[#25D366] transition-all text-sm leading-relaxed"
                  placeholder="הקלד את ההודעה שלך כאן..."
                  autoFocus
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleSendWhatsApp}
                  className="flex-1 py-4 bg-[#006994] text-white rounded-2xl font-black text-lg hover:bg-[#4E8294] transition-all shadow-lg active:scale-95"
                >
                  שלח
                </button>
                <button 
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-[#4E8294] rounded-2xl font-black text-lg hover:bg-slate-200 transition-all active:scale-95"
                >
                  בטל
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;
