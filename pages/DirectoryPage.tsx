
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
  Users,
  Plus,
  Camera,
  Sparkles,
  Loader2,
  Save,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Member, Gender } from '../types';
import { processImage } from '../utils/imageProcessor';
import { generateBio } from '../services/geminiService';
import { hashPassword } from '../utils/crypto';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';

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
      className="group cursor-pointer relative z-10" 
      onClick={onClick}
    >
      <div className="bg-white border border-slate-100 rounded-2xl p-2 pb-5 transition-all duration-500 group-hover:bg-slate-50 group-hover:border-slate-200 shadow-sm hover:shadow-xl">
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
          <p className="text-[10px] font-['Assistant'] font-black text-[#2B2B2E] truncate px-1">{member.firstName} {member.lastName}</p>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}</p>
        </div>
      </div>
    </motion.div>
  );
};

const DirectoryPage: React.FC = () => {
  const { members, siteAssets, addMember } = useData();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Add Member State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [newMemberData, setNewMemberData] = useState<Partial<Member>>({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    avatar: '',
    bio: '',
    role: 'Member',
    gender: 'מעדיף/ה לא לציין',
    isActive: true,
    birthday: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    password: ''
  });

  const isAdmin = currentUser?.role === 'Admin';

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

      <div className="surfboard-hero-container mb-6 space-y-2">
        {/* Main Title */}
        <h1 className="main-page-title">
          נבחרת הגלישה
        </h1>
      </div>

      {/* Subtitle with Emoji context */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <p className="text-slate-600 font-medium max-w-2xl text-lg text-center">
          האנשים שעושים את חבל זוג למה שהיא - קהילה של חברים שנפגשים במים 🌊
        </p>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-sm">
            <Users size={18} className="text-[#D4A373]" />
            <span className="text-sm font-black text-slate-700">{activeMembers.length} חברים פעילים</span>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setIsAddMemberModalOpen(true)}
              className="w-12 h-12 bg-white/40 backdrop-blur-md hover:bg-[#D4A373] hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm border border-white/60 group"
              title="הוסף חבר חדש"
            >
              <Plus size={24} className="transition-transform group-hover:rotate-90" />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">

        <div className="flex flex-col md:flex-row gap-4 mb-16 items-center">
          <div className="flex-1 relative group w-full">
             <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#D4A373] transition-colors" size={20} />
             <input 
               type="text" 
               placeholder="חפש חבר בקהילה..." 
               className="w-full pr-14 pl-6 py-3.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-full font-bold text-[#2B2B2E] outline-none focus:bg-white/60 focus:ring-4 ring-[#D4A373]/10 transition-all shadow-sm text-base placeholder:text-slate-400"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* View Mode Segmented Control - Turquoise Glassmorphism */}
            <div className="gt-segmented bg-white/40 backdrop-blur-md border border-white/60 shadow-sm h-[48px] items-center">
              <button 
                onClick={() => setViewMode('grid')}
                className={`gt-segment-item flex items-center gap-2 ${viewMode === 'grid' ? 'active' : ''} text-[10px] font-black uppercase tracking-widest`}
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`gt-segment-item flex items-center gap-2 ${viewMode === 'list' ? 'active' : ''} text-[10px] font-black uppercase tracking-widest`}
              >
                <List size={14} />
                <span className="hidden sm:inline">List</span>
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
                    <div key={member.id} onClick={() => setSelectedMember(member)} className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between hover:bg-white/60 cursor-pointer transition-all shadow-sm relative z-10">
                      <div className="flex items-center gap-4">
                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-12 h-12 rounded-xl object-cover border border-white/40" alt="" />
                        <div>
                          <p className="font-black text-[#2B2B2E]">{member.firstName} {member.lastName}</p>
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
                    <div key={member.id} onClick={() => setSelectedMember(member)} className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between hover:bg-white/60 cursor-pointer transition-all shadow-sm relative z-10">
                      <div className="flex items-center gap-4">
                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-12 h-12 rounded-xl object-cover border border-white/40" alt="" />
                        <div>
                          <p className="font-black text-[#2B2B2E]">{member.firstName} {member.lastName}</p>
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
                    <div key={member.id} onClick={() => setSelectedMember(member)} className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 flex items-center justify-between hover:bg-white/60 cursor-pointer transition-all shadow-sm relative z-10">
                      <div className="flex items-center gap-4">
                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-12 h-12 rounded-xl object-cover border border-white/40" alt="" />
                        <div>
                          <p className="font-black text-[#2B2B2E]">{member.firstName} {member.lastName}</p>
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
        {selectedMember && (
           <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 40 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         className="bg-[#FDFBF7] w-full max-w-5xl max-h-[95vh] rounded-none md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col md:flex-row border border-white/60 m-0 md:m-4" 
         onClick={e => e.stopPropagation()}
       >
          <div className="md:w-[40%] relative h-[30vh] md:h-auto overflow-hidden bg-slate-100 flex-shrink-0">
             {selectedMember.avatar ? (
               <img src={selectedMember.avatar} className="w-full h-full object-cover" alt={`${selectedMember.firstName} ${selectedMember.lastName}`} />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-300">
                 <UserCircle size={120} strokeWidth={0.5} />
               </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent"></div>
             <div className="absolute bottom-8 right-8 left-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-8 bg-[#D4A373]"></div>
                  <span className="text-[9px] font-black text-[#D4A373] uppercase tracking-[0.3em]">Profile</span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-[#2B2B2E] tracking-tighter leading-none">{selectedMember.firstName} {selectedMember.lastName}</h3>
             </div>
          </div>

          <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar text-right relative">
            <button onClick={() => setSelectedMember(null)} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-600 transition-all bg-slate-100 hover:bg-slate-200 rounded-full z-10"><X size={20} /></button>
            
            <div className="max-w-xl mx-auto space-y-10">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 text-center bg-white/50 p-3 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</p>
                  <p className="font-black text-[#2B2B2E] text-sm">{selectedMember.role}</p>
                </div>
                <div className="space-y-1 text-center bg-white/50 p-3 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sessions</p>
                  <p className="font-black text-[#2B2B2E] text-sm">{selectedMember.totalAttendance || 0}</p>
                </div>
                <div className="space-y-1 text-center bg-white/50 p-3 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Joined</p>
                  <p className="font-black text-[#2B2B2E] text-sm">{formatDate(selectedMember.joinedAt)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[9px] font-black text-[#D4A373] uppercase tracking-[0.3em]">About</p>
                <p className="text-lg font-bold text-slate-700 leading-snug tracking-tight italic">
                  "{selectedMember.bio || 'חבר בקהילת הגולשים של חבל זוג. חולק את התשוקה לים ולגלים.'}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Phone size={18} /></div>
                   <div className="overflow-hidden">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mobile</p>
                      <p className="font-black text-[#2B2B2E] text-sm">{selectedMember.mobile}</p>
                   </div>
                </div>
                <div className="p-5 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Mail size={18} /></div>
                   <div className="overflow-hidden">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                      <p className="font-black text-[#2B2B2E] text-sm truncate">{selectedMember.email}</p>
                   </div>
                </div>
              </div>

              <motion.button 
                onClick={() => openWhatsAppModal(selectedMember.firstName, selectedMember.lastName)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-5 bg-[#25D366] text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-4"
              >
                <WhatsAppIcon className="w-6 h-6" />
                <span>Open WhatsApp Chat</span>
              </motion.button>

              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Social Connect</p>
                <div className="flex justify-center gap-4">
                  <a 
                    href={selectedMember.instagramUrl ? ensureAbsoluteUrl(selectedMember.instagramUrl) : '#'} 
                    target={selectedMember.instagramUrl ? "_blank" : undefined} 
                    rel="noopener noreferrer" 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:shadow-lg hover:-translate-y-0.5 border border-white/10 ${selectedMember.instagramUrl ? 'bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    <Instagram size={20} />
                  </a>
                  <a 
                    href={selectedMember.facebookUrl ? ensureAbsoluteUrl(selectedMember.facebookUrl) : '#'} 
                    target={selectedMember.facebookUrl ? "_blank" : undefined} 
                    rel="noopener noreferrer" 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:shadow-lg hover:-translate-y-0.5 border border-white/10 ${selectedMember.facebookUrl ? 'bg-white/5 text-blue-600 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    <Facebook size={20} />
                  </a>
                  <a 
                    href={selectedMember.tiktokUrl ? ensureAbsoluteUrl(selectedMember.tiktokUrl) : '#'} 
                    target={selectedMember.tiktokUrl ? "_blank" : undefined} 
                    rel="noopener noreferrer" 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:shadow-lg hover:-translate-y-0.5 border border-white/10 ${selectedMember.tiktokUrl ? 'bg-white/5 text-black hover:bg-black hover:text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    <Music2 size={20} />
                  </a>
                  <a 
                    href={selectedMember.linkedinUrl ? ensureAbsoluteUrl(selectedMember.linkedinUrl) : '#'} 
                    target={selectedMember.linkedinUrl ? "_blank" : undefined} 
                    rel="noopener noreferrer" 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:shadow-lg hover:-translate-y-0.5 border border-white/10 ${selectedMember.linkedinUrl ? 'bg-white/5 text-[#00CED1] hover:bg-[#00CED1] hover:text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>
       </motion.div>
    )}
    </div>
      <AnimatePresence>
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-12 bg-slate-900/40 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddMemberModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="bg-[#FDFBF7] w-full max-w-7xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col border border-white/60" 
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-8 md:p-12 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#D4A373]/10 rounded-2xl flex items-center justify-center text-[#D4A373]">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#2B2B2E] tracking-tighter">הוספת חבר חדש</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">יצירת פרופיל משתמש ידני</p>
                  </div>
                </div>
                <button onClick={() => setIsAddMemberModalOpen(false)} className="p-3 text-slate-400 hover:text-slate-600 transition-all bg-slate-100 hover:bg-slate-200 rounded-full">
                  <X size={24} />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-16">
                <div className="max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Avatar & Bio */}
                    <div className="lg:col-span-4 space-y-8">
                      <div className="flex flex-col items-center">
                        <div className="relative group">
                          <div className="w-48 h-48 rounded-[3rem] border-[10px] border-white overflow-hidden shadow-2xl bg-slate-100 flex items-center justify-center">
                            {isProcessingImage ? (
                              <Loader2 className="animate-spin text-[#D4A373]" size={32} />
                            ) : newMemberData.avatar ? (
                              <img src={newMemberData.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <UserCircle size={80} className="text-slate-300" strokeWidth={0.5} />
                            )}
                          </div>
                          <label className="absolute bottom-2 left-2 p-3 bg-[#D4A373] text-white rounded-2xl cursor-pointer hover:bg-[#B88A5B] transition-all shadow-xl">
                            <Camera size={20} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setIsProcessingImage(true);
                                  try {
                                    const { dataUrl } = await processImage(file, 600, 0.8);
                                    setNewMemberData(prev => ({ ...prev, avatar: dataUrl }));
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setIsProcessingImage(false);
                                  }
                                }
                              }} 
                            />
                          </label>
                        </div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">תמונת פרופיל</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ביוגרפיה</label>
                          <button 
                            type="button" 
                            onClick={async () => {
                              if (!newMemberData.firstName) return;
                              setIsGeneratingBio(true);
                              try {
                                const bio = await generateBio(`${newMemberData.firstName} ${newMemberData.lastName}`, newMemberData.role || 'Member', newMemberData.bio || '');
                                setNewMemberData(prev => ({ ...prev, bio }));
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsGeneratingBio(false);
                              }
                            }} 
                            className="text-[10px] font-black text-[#D4A373] flex items-center gap-1.5 hover:bg-[#D4A373]/10 px-3 py-1.5 rounded-lg transition-all border border-[#D4A373]/10"
                          >
                            {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} שדרג עם AI
                          </button>
                        </div>
                        <textarea 
                          value={newMemberData.bio} 
                          onChange={e => setNewMemberData(prev => ({ ...prev, bio: e.target.value }))}
                          className="w-full p-6 bg-white/40 backdrop-blur-md rounded-[2rem] font-bold h-64 resize-none outline-none border border-white/60 focus:bg-white/60 transition-all text-sm leading-relaxed shadow-inner" 
                          placeholder="ספר קצת על החבר החדש..." 
                        />
                      </div>
                    </div>

                    {/* Right Column: Fields */}
                    <div className="lg:col-span-8 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">שם פרטי</label>
                          <input 
                            type="text" 
                            value={newMemberData.firstName} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full p-5 bg-white/40 backdrop-blur-md rounded-2xl font-black outline-none border border-white/60 focus:bg-white/60 transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">שם משפחה</label>
                          <input 
                            type="text" 
                            value={newMemberData.lastName} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full p-5 bg-white/40 backdrop-blur-md rounded-2xl font-black outline-none border border-white/60 focus:bg-white/60 transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">אימייל</label>
                          <input 
                            type="email" 
                            value={newMemberData.email} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-5 bg-white/40 backdrop-blur-md rounded-2xl font-black outline-none border border-white/60 focus:bg-white/60 transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">טלפון נייד</label>
                          <input 
                            type="tel" 
                            value={newMemberData.mobile} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, mobile: formatMobileNumber(e.target.value) }))}
                            className="w-full p-5 bg-white/40 backdrop-blur-md rounded-2xl font-black outline-none border border-white/60 focus:bg-white/60 transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">תאריך לידה</label>
                          <div className="relative">
                            <Cake size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input 
                              type="date" 
                              value={newMemberData.birthday || ''} 
                              onChange={e => setNewMemberData(prev => ({ ...prev, birthday: e.target.value }))} 
                              className="w-full pr-14 pl-6 py-5 bg-white/40 backdrop-blur-md rounded-2xl font-black outline-none border border-white/60 focus:bg-white/60 transition-all cursor-pointer" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">תפקיד</label>
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                              className="w-full p-5 bg-white/40 backdrop-blur-md rounded-2xl font-black text-sm outline-none border border-white/60 focus:bg-white/60 transition-all flex items-center justify-between group"
                            >
                              <span>{newMemberData.role === 'Admin' ? 'רכז' : newMemberData.role === 'Instructor' ? 'מדריך' : 'חבר'}</span>
                              <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {isRoleDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-[160]" onClick={() => setIsRoleDropdownOpen(false)} />
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-2xl shadow-2xl z-[170] overflow-hidden"
                                  >
                                    {(['Member', 'Instructor', 'Admin'] as const).map((r) => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => {
                                          setNewMemberData(prev => ({ ...prev, role: r }));
                                          setIsRoleDropdownOpen(false);
                                        }}
                                        className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-indigo-50 ${
                                          newMemberData.role === r ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
                                        }`}
                                      >
                                        {r === 'Admin' ? 'רכז' : r === 'Instructor' ? 'מדריך' : 'חבר'}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">מגדר</label>
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                              className="w-full p-5 bg-white/40 backdrop-blur-md rounded-2xl font-black text-sm outline-none border border-white/60 focus:bg-white/60 transition-all flex items-center justify-between group"
                            >
                              <span>{newMemberData.gender || 'בחר מגדר'}</span>
                              <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {isGenderDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-[160]" onClick={() => setIsGenderDropdownOpen(false)} />
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-2xl shadow-2xl z-[170] overflow-hidden"
                                  >
                                    {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                                      <button
                                        key={g}
                                        type="button"
                                        onClick={() => {
                                          setNewMemberData(prev => ({ ...prev, gender: g }));
                                          setIsGenderDropdownOpen(false);
                                        }}
                                        className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-indigo-50 ${
                                          newMemberData.gender === g ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
                                        }`}
                                      >
                                        {g}
                                      </button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">סיסמה</label>
                          <div className="flex gap-4">
                            <input 
                              type="text" 
                              value={newMemberData.password || ''} 
                              onChange={e => setNewMemberData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="סיסמה ראשונית"
                              className="flex-1 p-5 bg-white/40 backdrop-blur-md rounded-2xl font-black outline-none border border-white/60 focus:bg-white/60 transition-all" 
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const pass = Math.random().toString(36).slice(-8);
                                setNewMemberData(prev => ({ ...prev, password: pass }));
                              }}
                              className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all flex items-center gap-2"
                            >
                              <Sparkles size={16} />
                              ייצר
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3">
                          <Globe size={14} /> רשתות חברתיות
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">Instagram</label>
                            <input type="text" placeholder="קישור לפרופיל" value={newMemberData.instagramUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, instagramUrl: e.target.value }))} className="w-full p-4 bg-white/40 backdrop-blur-md rounded-xl font-black text-sm outline-none border border-white/60 focus:bg-white/60 transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">Facebook</label>
                            <input type="text" placeholder="קישור לפרופיל" value={newMemberData.facebookUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, facebookUrl: e.target.value }))} className="w-full p-4 bg-white/40 backdrop-blur-md rounded-xl font-black text-sm outline-none border border-white/60 focus:bg-white/60 transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">LinkedIn</label>
                            <input type="text" placeholder="קישור לפרופיל" value={newMemberData.linkedinUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, linkedinUrl: e.target.value }))} className="w-full p-4 bg-white/40 backdrop-blur-md rounded-xl font-black text-sm outline-none border border-white/60 focus:bg-white/60 transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">X (Twitter)</label>
                            <input type="text" placeholder="קישור לפרופיל" value={newMemberData.twitterUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, twitterUrl: e.target.value }))} className="w-full p-4 bg-white/40 backdrop-blur-md rounded-xl font-black text-sm outline-none border border-white/60 focus:bg-white/60 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 md:p-12 border-t border-slate-100 bg-white/40 backdrop-blur-md flex flex-col md:flex-row items-center justify-center gap-4">
                <button 
                  onClick={async () => {
                    if (!newMemberData.firstName || !newMemberData.email) {
                      alert('נא למלא שם ואימייל לפחות');
                      return;
                    }
                    if (newMemberData.mobile && !validateMobileNumber(newMemberData.mobile)) {
                      alert('מספר טלפון נייד לא תקין');
                      return;
                    }
                    setIsSaving(true);
                    try {
                      // Use provided password or generate one
                      const finalPass = newMemberData.password || Math.random().toString(36).slice(-8);
                      const hashed = await hashPassword(finalPass);
                      
                      await addMember({
                        ...newMemberData as Member,
                        password: hashed,
                        isTemporary: true,
                        joinedAt: new Date().toISOString()
                      });
                      
                      alert(`חבר נוסף בהצלחה! סיסמה: ${finalPass}`);
                      setIsAddMemberModalOpen(false);
                      setNewMemberData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        mobile: '',
                        avatar: '',
                        bio: '',
                        role: 'Member',
                        gender: 'מעדיף/ה לא לציין',
                        isActive: true,
                        birthday: '',
                        instagramUrl: '',
                        facebookUrl: '',
                        linkedinUrl: '',
                        twitterUrl: '',
                        password: ''
                      });
                    } catch (err) {
                      console.error(err);
                      alert('שגיאה בהוספת חבר');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full md:w-auto px-16 py-5 bg-[#D4A373] text-white rounded-2xl font-black text-xl hover:bg-[#B88A5B] transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  שמור חבר חדש
                </button>
                <button 
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="w-full md:w-auto px-12 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xl hover:bg-slate-200 transition-all"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
