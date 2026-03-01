
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
  UserCircle,
  Users
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

const MemberCard: React.FC<{ member: Member, idx: number, onClick: () => void }> = ({ member, idx, onClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, zIndex: 10 }}
      transition={{ delay: idx * 0.02, type: 'spring', stiffness: 300 }}
      className="group cursor-pointer relative" 
      onClick={onClick}
    >
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-2 pb-5 transition-all duration-500 group-hover:bg-white/60 group-hover:border-white shadow-sm hover:shadow-xl">
        <div className="aspect-square overflow-hidden bg-slate-200/50 rounded-xl mb-3 border border-white/40">
          {member.avatar ? (
            <img 
              src={member.avatar} 
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
              alt={`${member.firstName} ${member.lastName}`} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <UserCircle size={32} strokeWidth={1} />
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-[10px] font-['Assistant'] font-black text-slate-800 truncate px-1">{member.firstName} {member.lastName}</p>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{member.role === 'Admin' ? 'מנהל' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}</p>
        </div>
      </div>
    </motion.div>
  );
};

const DirectoryPage: React.FC = () => {
  const { members, siteAssets } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Progress Bar Logic
  React.useEffect(() => {
    if ((window as any).updateProgressBar) {
      (window as any).updateProgressBar(30);
      const timer = setTimeout(() => (window as any).updateProgressBar(100), 800);
      return () => {
        clearTimeout(timer);
        (window as any).updateProgressBar(0);
      };
    }
  }, []);

  const activeMembers = useMemo(() => members.filter(m => m.isActive !== false), [members]);

  const processedMembers = useMemo(() => {
    let filtered = activeMembers.filter(m => 
      (m.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.lastName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.sort((a, b) => {
      if (sortBy === 'name-asc') {
        // Use firstName and lastName if available, otherwise fallback to name
        const aLast = a.lastName || '';
        const bLast = b.lastName || '';
        const aFirst = a.firstName || '';
        const bFirst = b.firstName || '';
        
        if (aLast || bLast) {
          const lastCompare = aLast.localeCompare(bLast, 'he');
          if (lastCompare !== 0) return lastCompare;
          return aFirst.localeCompare(bFirst, 'he');
        }
        
        return (a.firstName + ' ' + a.lastName).localeCompare((b.firstName + ' ' + b.lastName), 'he');
      }
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

  const openWhatsAppModal = (firstName: string, lastName: string) => {
    setWhatsappMessage(`היי ${firstName}, מה קורה? ראיתי את הפרופיל שלך בנבחרת חבל זוג...`);
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

  const groupedMembers = useMemo(() => {
    const groups = {
      Admin: [] as Member[],
      Instructor: [] as Member[],
      Member: [] as Member[]
    };
    
    processedMembers.forEach(m => {
      const role = m.role || 'Member';
      if (groups[role as keyof typeof groups]) {
        groups[role as keyof typeof groups].push(m);
      } else {
        groups.Member.push(m);
      }
    });
    
    return groups;
  }, [processedMembers]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-right relative overflow-hidden" dir="rtl">
      {/* Background Decorative Elements - Sand Theme */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#E6D5B8]/30 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-[#D4A373]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#E6D5B8]/20 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Body-line Standard Header Stack */}
        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          {/* Top Badge */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 px-4 py-1 rounded-full inline-flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase shadow-sm">
            <Users size={12} className="text-[#D4A373]" />
            <span>THE ELITE SQUAD</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 uppercase tracking-tighter">
            נבחרת הכוכבים
          </h1>

          {/* Subtitle with Emoji context */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-slate-600 font-medium max-w-2xl text-lg">
              האנשים שעושים את חבל זוג למה שהיא - קהילה של חברים שנפגשים במים 🌊
            </p>
            
            <div className="flex items-center gap-3 px-6 py-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-sm">
              <Users size={18} className="text-[#D4A373]" />
              <span className="text-sm font-black text-slate-700">{activeMembers.length} חברים פעילים</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-16 items-center">
          <div className="flex-1 relative group w-full">
             <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#D4A373] transition-colors" size={20} />
             <input 
               type="text" 
               placeholder="חפש חבר בקהילה..." 
               className="w-full pr-14 pl-6 py-3.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-full font-bold text-slate-800 outline-none focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all shadow-sm text-base placeholder:text-slate-400"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* View Mode Toggle - Sand Theme Glassmorphism */}
            <div className="bg-white/40 backdrop-blur-md p-1 rounded-full border border-white/60 flex items-center shadow-sm relative h-[48px] min-w-[120px]">
              <motion.div 
                animate={{ x: viewMode === 'grid' ? '0%' : '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#D4A373] rounded-full shadow-sm border border-white/20"
              />
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex-1 relative z-10 flex items-center justify-center gap-2 px-3 py-1.5 text-[10px] font-black transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Grid
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`flex-1 relative z-10 flex items-center justify-center gap-2 px-3 py-1.5 text-[10px] font-black transition-colors ${viewMode === 'list' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                List
              </button>
            </div>

            <div className="relative flex-1 md:flex-none">
               <button 
                 onClick={() => setIsSortOpen(!isSortOpen)}
                 className="w-full md:w-auto h-[48px] px-6 bg-white/40 backdrop-blur-md text-slate-700 border border-white/60 rounded-full font-black text-xs flex items-center justify-between gap-4 hover:bg-white/60 transition-all shadow-sm active:scale-95"
               >
                  <span className="uppercase tracking-widest">מיון</span> <ChevronDown size={14} className={isSortOpen ? 'rotate-180 transition-transform' : ''} />
               </button>
               {isSortOpen && (
                 <div className="absolute top-full left-0 right-0 md:left-auto md:w-56 mt-3 bg-white/80 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                    <button onClick={() => {setSortBy('name-asc'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-[10px] text-slate-700 hover:bg-[#D4A373] hover:text-white transition-all border-b border-slate-100">שם (א-ת)</button>
                    <button onClick={() => {setSortBy('attendance'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-[10px] text-slate-700 hover:bg-[#D4A373] hover:text-white transition-all border-b border-slate-100">הכי פעילים בסשנים</button>
                    <button onClick={() => {setSortBy('newest'); setIsSortOpen(false)}} className="w-full p-4 text-right font-black text-[10px] text-slate-700 hover:bg-[#D4A373] hover:text-white transition-all">מצטרפים חדשים</button>
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="space-y-20">
          {groupedMembers.Admin.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-10">
                <h3 className="text-xs font-black text-[#D4A373] uppercase tracking-[0.4em] whitespace-nowrap opacity-80">צוות קדמי</h3>
                <div className="h-px w-full bg-slate-200"></div>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8" : "space-y-4"}>
                {groupedMembers.Admin.map((member, idx) => (
                  viewMode === 'grid' ? (
                    <MemberCard key={member.id} member={member} idx={idx} onClick={() => setSelectedMember(member)} />
                  ) : (
                    <div key={member.id} onClick={() => setSelectedMember(member)} className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between hover:bg-white/60 cursor-pointer transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-12 h-12 rounded-xl object-cover border border-white/40" alt="" />
                        <div>
                          <p className="font-black text-slate-800">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{member.role}</p>
                        </div>
                      </div>
                      <ChevronDown className="-rotate-90 text-slate-300" size={20} />
                    </div>
                  )
                ))}
              </div>
            </section>
          )}

          {groupedMembers.Instructor.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-10">
                <h3 className="text-xs font-black text-[#D4A373] uppercase tracking-[0.4em] whitespace-nowrap opacity-80">מדריכים</h3>
                <div className="h-px w-full bg-slate-200"></div>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8" : "space-y-4"}>
                {groupedMembers.Instructor.map((member, idx) => (
                  viewMode === 'grid' ? (
                    <MemberCard key={member.id} member={member} idx={idx} onClick={() => setSelectedMember(member)} />
                  ) : (
                    <div key={member.id} onClick={() => setSelectedMember(member)} className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between hover:bg-white/60 cursor-pointer transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-12 h-12 rounded-xl object-cover border border-white/40" alt="" />
                        <div>
                          <p className="font-black text-slate-800">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{member.role}</p>
                        </div>
                      </div>
                      <ChevronDown className="-rotate-90 text-slate-300" size={20} />
                    </div>
                  )
                ))}
              </div>
            </section>
          )}

          {groupedMembers.Member.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-10">
                <h3 className="text-xs font-black text-[#D4A373] uppercase tracking-[0.4em] whitespace-nowrap opacity-80">חברי הקהילה</h3>
                <div className="h-px w-full bg-slate-200"></div>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8" : "space-y-4"}>
                {groupedMembers.Member.map((member, idx) => (
                  viewMode === 'grid' ? (
                    <MemberCard key={member.id} member={member} idx={idx} onClick={() => setSelectedMember(member)} />
                  ) : (
                    <div key={member.id} onClick={() => setSelectedMember(member)} className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between hover:bg-white/60 cursor-pointer transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-12 h-12 rounded-xl object-cover border border-white/40" alt="" />
                        <div>
                          <p className="font-black text-slate-800">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{member.role}</p>
                        </div>
                      </div>
                      <ChevronDown className="-rotate-90 text-slate-300" size={20} />
                    </div>
                  )
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {selectedMember && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-12 bg-slate-900/40 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedMember(null)}>
       <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 40 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         className="bg-[#FDFBF7] w-full max-w-7xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col md:flex-row border border-white/60" 
         onClick={e => e.stopPropagation()}
       >
          <div className="md:w-[40%] relative h-[40vh] md:h-auto overflow-hidden bg-slate-100">
             {selectedMember.avatar ? (
               <img src={selectedMember.avatar} className="w-full h-full object-cover" alt={`${selectedMember.firstName} ${selectedMember.lastName}`} />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-300">
                 <UserCircle size={160} strokeWidth={0.5} />
               </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent"></div>
             <div className="absolute bottom-12 right-12 left-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-12 bg-[#D4A373]"></div>
                  <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.4em]">Member Profile</span>
                </div>
                <h3 className="text-6xl font-black text-slate-800 tracking-tighter leading-none">{selectedMember.firstName} {selectedMember.lastName}</h3>
             </div>
          </div>

          <div className="flex-1 p-10 md:p-20 overflow-y-auto custom-scrollbar text-right relative">
            <button onClick={() => setSelectedMember(null)} className="absolute top-10 left-10 p-4 text-slate-400 hover:text-slate-600 transition-all bg-slate-100 hover:bg-slate-200 rounded-full z-10"><X size={32} /></button>
            
            <div className="max-w-2xl space-y-16">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</p>
                  <p className="text-lg font-black text-slate-800">{selectedMember.role}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions</p>
                  <p className="text-lg font-black text-slate-800">{selectedMember.totalAttendance || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</p>
                  <p className="text-lg font-black text-slate-800">{formatDate(selectedMember.joinedAt)}</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.3em]">About</p>
                <p className="text-3xl font-bold text-slate-700 leading-tight tracking-tight italic">
                  "{selectedMember.bio || 'חבר בקהילת הגולשים של חבל זוג. חולק את התשוקה לים ולגלים.'}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 flex items-center gap-6 group hover:bg-white/60 hover:shadow-xl transition-all duration-500">
                   <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#D4A373] shadow-sm transition-colors"><Phone size={24} /></div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile</p>
                      <p className="text-xl font-black text-slate-800">{selectedMember.mobile}</p>
                   </div>
                </div>
                <div className="p-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 flex items-center gap-6 group hover:bg-white/60 hover:shadow-xl transition-all duration-500">
                   <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#D4A373] shadow-sm transition-colors"><Mail size={24} /></div>
                   <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                      <p className="text-xl font-black text-slate-800 truncate">{selectedMember.email}</p>
                   </div>
                </div>
              </div>

              <motion.button 
                onClick={() => openWhatsAppModal(selectedMember.firstName, selectedMember.lastName)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-8 bg-[#25D366] text-white rounded-[2.5rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-6 group relative overflow-hidden"
              >
                <WhatsAppIcon className="w-10 h-10" />
                <span>Open WhatsApp Chat</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </motion.button>

              <div className="space-y-8">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] text-center">Social Connect</p>
                <div className="flex justify-center gap-6">
                  {selectedMember.instagramUrl && (
                    <a href={ensureAbsoluteUrl(selectedMember.instagramUrl)} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white/5 text-white/40 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all hover:shadow-xl hover:-translate-y-1 border border-white/10">
                      <Instagram size={28} />
                    </a>
                  )}
                  {selectedMember.facebookUrl && (
                    <a href={ensureAbsoluteUrl(selectedMember.facebookUrl)} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white/5 text-white/40 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all hover:shadow-xl hover:-translate-y-1 border border-white/10">
                      <Facebook size={28} />
                    </a>
                  )}
                  {selectedMember.tiktokUrl && (
                    <a href={ensureAbsoluteUrl(selectedMember.tiktokUrl)} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white/5 text-white/40 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all hover:shadow-xl hover:-translate-y-1 border border-white/10">
                      <Music2 size={28} />
                    </a>
                  )}
                  {selectedMember.linkedinUrl && (
                    <a href={ensureAbsoluteUrl(selectedMember.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-white/5 text-white/40 rounded-2xl flex items-center justify-center hover:bg-[#00CED1] hover:text-white transition-all hover:shadow-xl hover:-translate-y-1 border border-white/10">
                      <Linkedin size={28} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
       </motion.div>
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
                <p className="text-xs opacity-70 font-bold">אל: {selectedMember.firstName} {selectedMember.lastName}</p>
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
