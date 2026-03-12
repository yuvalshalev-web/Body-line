
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
  User,
  Users,
  Plus,
  Camera,
  Sparkles,
  Loader2,
  Save,
  AlertCircle,
  ShieldAlert,
  LayoutGrid,
  List,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Member, Gender } from '../types';
import { processImage } from '../utils/imageProcessor';
import { generateBio } from '../services/geminiService';
import { hashPassword } from '../utils/crypto';
import { validateMobileNumber, formatMobileNumber } from '../utils/validation';

type SortOption = 'name-asc' | 'attendance' | 'newest';

const PhoneIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="phone-grad-glass" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(0, 122, 255, 0.7)" />
        <stop offset="100%" stopColor="rgba(0, 26, 153, 0.7)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#phone-grad-glass)" />
    <path 
      d="M67.2,60.8l-7.1-7.1c-1.1-1.1-3-1.1-4.1,0l-3.3,3.3c-0.6-0.3-1.2-0.7-1.8-1.1c-4.3-2.9-7.8-6.4-10.7-10.7 c-0.4-0.6-0.8-1.2-1.1-1.8l3.3-3.3c1.1-1.1,1.1-3,0-4.1l-7.1-7.1c-1.1-1.1-3-1.1-4.1,0l-5.2,5.2c-2.5,2.5-3.4,6.2-2.2,9.6 c1.9,5.7,5.2,10.8,9.6,15.2c4.4,4.4,9.5,7.7,15.2,9.6c3.4,1.2,7.1,0.3,9.6-2.2l5.2-5.2C68.3,63.8,68.3,61.9,67.2,60.8z" 
      fill="white" 
    />
  </svg>
);

const WhatsAppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wa-grad-glass" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(0, 168, 0, 0.7)" />
        <stop offset="100%" stopColor="rgba(151, 255, 51, 0.7)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#wa-grad-glass)" />
    <path 
      fill="white" 
      d="M50.2 24.3c-14.2 0-25.8 11.6-25.8 25.8 0 4.5 1.2 9 3.4 12.9L24 75.7l13.1-3.4c3.8 2.1 8.1 3.2 12.5 3.2 14.2 0 25.8-11.6 25.8-25.8 0-14.2-11.6-25.8-25.2-25.8zm0 47.3c-3.8 0-7.6-1-10.8-2.9l-.8-.5-7.8 2 2-7.6-.5-.8c-2.1-3.3-3.2-7.1-3.2-11.1 0-11.4 9.3-20.7 20.7-20.7 11.4 0 20.7 9.3 20.7 20.7 0 11.4-9.3 21.2-20.3 21.2zm11.5-15.4c-.6-.3-3.7-1.8-4.3-2-.6-.2-1-.3-1.4.3-.4.6-1.7 2.1-2.1 2.6-.4.5-.8.5-1.4.2-.6-.3-2.5-.9-4.8-3-1.8-1.6-3-3.5-3.4-4.1-.4-.6 0-.9.3-1.2.3-.3.6-.7.9-1 .3-.3.4-.6.6-.9.2-.3.1-.6 0-.9-.1-.3-1-2.4-1.4-3.3-.4-1-.7-.8-1-.8-.3 0-.6 0-.9 0-.3 0-.8.1-1.2.6-.4.5-1.5 1.5-1.5 3.6 0 2.1 1.5 4.1 1.7 4.4.2.3 3 4.6 7.3 6.4 1 .4 1.8.7 2.4.9 1 .3 2 .3 2.7.2.8-.1 2.5-.9 2.8-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-1-.6z"
    />
  </svg>
);

const MemberCard: React.FC<{ member: Member, idx: number, onClick: () => void }> = ({ member, idx, onClick }) => {
  const isSpecial = member.role === 'Admin' || member.role === 'Instructor';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ delay: idx * 0.03, type: 'spring', stiffness: 260, damping: 20 }}
      className="group cursor-pointer relative" 
      onClick={onClick}
    >
      <div className="bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_15px_30px_-10px_var(--surfer-deep-shadow),inset_0_0_15px_var(--surfer-aqua-mist)] rounded-2xl flex flex-col h-full transition-all duration-500 overflow-hidden relative">
        {/* Top Half: Avatar with Feathered Edges */}
        <div className="relative aspect-square w-full overflow-hidden">
          {member.avatar ? (
            <img 
              src={member.avatar} 
              className="w-full h-full object-cover surfer-image-feather" 
              alt={`${member.firstName} ${member.lastName}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--surfer-aqua-mist)]/20 to-[var(--surfer-pink)]/20 flex items-center justify-center surfer-image-feather">
              <UserCircle size={64} strokeWidth={0.5} className="text-[var(--surfer-deep-teal)]/20" />
            </div>
          )}
        </div>

        {/* Bottom Half: Content */}
        <div className="pt-2 pb-8 px-4 flex flex-col items-center justify-center text-center flex-1">
          <h4 className="text-base font-black text-[#7A1555] [text-shadow:0_0_10px_var(--surfer-pink)] truncate w-full">
            {member.firstName} {member.lastName}
          </h4>
        </div>

        {/* Quick Phone Action - Bottom Left Corner */}
        {member.mobile && (
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${member.mobile}`, '_self');
            }}
            className="absolute bottom-1.5 left-1.5 w-8 h-8 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-all duration-300 z-30 cursor-pointer"
            title="חיוג מהיר"
          >
            <PhoneIcon className="w-8 h-8" />
          </div>
        )}

        {/* Quick WhatsApp Action - Absolute Corner */}
        {member.mobile && (
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              const phone = member.mobile?.replace(/[^0-9]/g, '');
              window.open(`https://wa.me/${phone}`, '_blank');
            }}
            className="absolute bottom-1.5 right-1.5 w-8 h-8 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-all duration-300 z-30 cursor-pointer"
            title="שלח הודעה מהירה"
          >
            <WhatsAppIcon className="w-8 h-8" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DirectoryPage: React.FC = () => {
  const { members, siteAssets, addMember } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Handle URL ID parameter for direct profile access
  React.useEffect(() => {
    const memberId = searchParams.get('id');
    if (memberId && members.length > 0) {
      const member = members.find(m => m.id === memberId);
      if (member) {
        setSelectedMember(member);
      }
    }
  }, [searchParams, members]);

  const closeMemberModal = () => {
    setSelectedMember(null);
    // Remove the id from search params when closing
    const newParams = new URLSearchParams(searchParams);
    const hasId = newParams.has('id');
    newParams.delete('id');
    setSearchParams(newParams);
    
    // If we came from the Dashboard (via ?id=), return to home page
    if (hasId) {
      navigate('/');
    }
  };
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
    <div className="min-h-screen text-right relative overflow-hidden bg-slate-50" dir="rtl">
      {/* Background Decorative Elements - Atmospheric Surfers Theme */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[800px] h-[800px] bg-[#00AFC2]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#FF2D60]/5 rounded-full blur-[150px]" />
      </div>

      <div className="surfboard-hero-container mb-6 space-y-2">
        {/* Main Title */}
        <h1 className="main-page-title">
          <span className="surfer-title glass-text-primary">נבחרת הכוכבים</span>
        </h1>
      </div>

      {/* Compact Stats Pill */}
      <div className="flex justify-center mb-12 px-6">
        <div className="glass-panel px-8 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass-effect !rounded-full flex items-center justify-center text-[#00AFC2]">
              <Users size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black glass-text-primary leading-none">{activeMembers.length}</span>
              <span className="text-[10px] font-black glass-text-secondary uppercase tracking-widest mt-0.5">קהילה</span>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-8 bg-white/20" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass-effect !rounded-full flex items-center justify-center text-emerald-500">
              <User size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black glass-text-primary leading-none">{groupedMembers.Member.length}</span>
              <span className="text-[10px] font-black glass-text-secondary uppercase tracking-widest mt-0.5">חברים</span>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass-effect !rounded-full flex items-center justify-center text-[#FFD700]">
              <Sparkles size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black glass-text-primary leading-none">{groupedMembers.Instructor.length}</span>
              <span className="text-[10px] font-black glass-text-secondary uppercase tracking-widest mt-0.5">מדריכים</span>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass-effect !rounded-full flex items-center justify-center text-[#FF2D60]">
              <ShieldAlert size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black glass-text-primary leading-none">{groupedMembers.Admin.length}</span>
              <span className="text-[10px] font-black glass-text-secondary uppercase tracking-widest mt-0.5">רכזים</span>
            </div>
          </div>
          
          {isAdmin && (
            <>
              <div className="hidden sm:block w-px h-8 bg-white/20" />
              <button 
                onClick={() => setIsAddMemberModalOpen(true)}
                className="glass-effect px-6 py-3 !rounded-full flex items-center gap-2 text-[#00AFC2] font-black text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                <Plus size={14} />
                <span>הוסף כוכב +</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        {/* Search & Filter Section */}
        <div className="flex flex-col md:flex-row gap-8 mb-20 items-center">
          <div className="flex-1 relative w-full">
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
             <input 
               type="text" 
               placeholder="חפש כוכב בנבחרת..." 
               className="glass-input w-full pr-16 pl-8 py-5 font-bold text-slate-700 text-lg placeholder:text-slate-400"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="glass-panel p-1.5 flex items-center !rounded-2xl">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white/20 text-[#00AFC2] shadow-sm' : 'text-slate-500 hover:bg-white/10'} text-[11px] font-black uppercase tracking-widest`}
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white/20 text-[#00AFC2] shadow-sm' : 'text-slate-500 hover:bg-white/10'} text-[11px] font-black uppercase tracking-widest`}
              >
                <List size={14} />
                <span>List</span>
              </button>
            </div>

            <div className="relative">
               <button 
                 onClick={() => setIsSortOpen(!isSortOpen)}
                 className="glass-panel h-[60px] px-8 text-slate-700 font-black text-xs !rounded-2xl flex items-center justify-between gap-6 hover:bg-white/20 transition-all"
               >
                  <span className="uppercase tracking-widest">Sort By</span> 
                  <ChevronDown size={14} className={`transition-transform duration-500 ${isSortOpen ? 'rotate-180' : ''}`} />
               </button>
               <AnimatePresence>
                 {isSortOpen && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="absolute top-full left-0 right-0 md:left-auto md:w-64 mt-4 glass-panel !rounded-3xl shadow-2xl z-50 overflow-hidden"
                   >
                      {[
                        { id: 'name-asc', label: 'שם (א-ת)' },
                        { id: 'attendance', label: 'הכי פעילים בסשנים' },
                        { id: 'newest', label: 'מצטרפים חדשים' }
                      ].map((opt) => (
                        <button 
                          key={opt.id}
                          onClick={() => {setSortBy(opt.id as SortOption); setIsSortOpen(false)}} 
                          className={`w-full p-5 text-right font-black text-[12px] transition-all border-b border-white/10 last:border-none ${sortBy === opt.id ? 'bg-[#00AFC2]/10 text-[#00AFC2]' : 'text-slate-600 hover:bg-white/10'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="space-y-32">
          {groupedMembers.Admin.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-12 h-12 glass-effect !rounded-full flex items-center justify-center text-[#FF2D60]">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-sm font-black glass-text-secondary uppercase tracking-[0.5em] whitespace-nowrap">צוות קדמי</h3>
                <div className="h-px flex-1 bg-white/20"></div>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-12" : "space-y-8"}>
                {groupedMembers.Admin.map((member, idx) => (
                  viewMode === 'grid' ? (
                    <MemberCard key={member.id} member={member} idx={idx} onClick={() => setSelectedMember(member)} />
                  ) : (
                    <motion.div 
                      key={member.id} 
                      onClick={() => setSelectedMember(member)} 
                      whileHover={{ x: -10 }}
                      className="tangible-surfer-card p-6 !rounded-[2.5rem] flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 tangible-bevel-inset !rounded-full p-1">
                          <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-full h-full rounded-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className="text-lg font-black neon-text-pink">{member.firstName} {member.lastName}</p>
                          <div className="flex items-center gap-4">
                             <div className="tangible-bevel-inset px-3 py-1 !rounded-full">
                               <span className="text-[10px] font-black text-[#FF2D60] uppercase tracking-widest">רכז</span>
                             </div>
                             <span className="text-[10px] font-black neon-text-cyan uppercase tracking-widest">{member.totalAttendance || 0} סשנים</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 tangible-bevel-inset !rounded-full flex items-center justify-center text-slate-400">
                        <ChevronDown className="-rotate-90" size={24} />
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            </section>
          )}

          {groupedMembers.Instructor.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-12 h-12 glass-effect !rounded-full flex items-center justify-center text-[#00AFC2]">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-sm font-black glass-text-secondary uppercase tracking-[0.5em] whitespace-nowrap">מדריכים</h3>
                <div className="h-px flex-1 bg-white/20"></div>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-12" : "space-y-8"}>
                {groupedMembers.Instructor.map((member, idx) => (
                  viewMode === 'grid' ? (
                    <MemberCard key={member.id} member={member} idx={idx} onClick={() => setSelectedMember(member)} />
                  ) : (
                    <motion.div 
                      key={member.id} 
                      onClick={() => setSelectedMember(member)} 
                      whileHover={{ x: -10 }}
                      className="tangible-surfer-card p-6 !rounded-[2.5rem] flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 tangible-bevel-inset !rounded-full p-1">
                          <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-full h-full rounded-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-[#00426a]">{member.firstName} {member.lastName}</p>
                          <div className="flex items-center gap-4">
                             <div className="tangible-bevel-inset px-3 py-1 !rounded-full">
                               <span className="text-[10px] font-black text-[#00AFC2] uppercase tracking-widest">מדריך</span>
                             </div>
                             <span className="text-[10px] font-black neon-text-cyan uppercase tracking-widest">{member.totalAttendance || 0} סשנים</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 tangible-bevel-inset !rounded-full flex items-center justify-center text-slate-400">
                        <ChevronDown className="-rotate-90" size={24} />
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            </section>
          )}

          {groupedMembers.Member.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-12 h-12 glass-effect !rounded-full flex items-center justify-center text-emerald-500">
                  <Users size={24} />
                </div>
                <h3 className="text-sm font-black glass-text-secondary uppercase tracking-[0.5em] whitespace-nowrap">חברי הקהילה</h3>
                <div className="h-px flex-1 bg-white/20"></div>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-12" : "space-y-8"}>
                {groupedMembers.Member.map((member, idx) => (
                  viewMode === 'grid' ? (
                    <MemberCard key={member.id} member={member} idx={idx} onClick={() => setSelectedMember(member)} />
                  ) : (
                    <motion.div 
                      key={member.id} 
                      onClick={() => setSelectedMember(member)} 
                      whileHover={{ x: -10 }}
                      className="tangible-surfer-card p-6 !rounded-[2.5rem] flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 tangible-bevel-inset !rounded-full p-1">
                          <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.firstName}+${member.lastName}`} className="w-full h-full rounded-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-[#00426a]">{member.firstName} {member.lastName}</p>
                          <div className="flex items-center gap-4">
                             <div className="tangible-bevel-inset px-3 py-1 !rounded-full">
                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">חבר</span>
                             </div>
                             <span className="text-[10px] font-black neon-text-cyan uppercase tracking-widest">{member.totalAttendance || 0} סשנים</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 tangible-bevel-inset !rounded-full flex items-center justify-center text-slate-400">
                        <ChevronDown className="-rotate-90" size={24} />
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12 modal-overlay animate-in fade-in" onClick={closeMemberModal}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="w-full max-w-5xl max-h-[95vh] rounded-3xl overflow-hidden relative flex flex-col md:flex-row m-0 bg-[#B2EBF2]/10 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_20px_50px_-10px_#7A1555]" 
              onClick={e => e.stopPropagation()}
            >
             <button onClick={closeMemberModal} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_rgba(122,21,85,0.4)] text-white hover:bg-[#B2EBF2]/40 transition-all z-50"><X size={20} /></button>
             <div className="md:w-[40%] relative h-[30vh] md:h-auto overflow-hidden bg-slate-100 flex-shrink-0 border-b-2 md:border-b-0 md:border-l-2 border-white/20">
                {selectedMember.avatar ? (
                  <img src={selectedMember.avatar} className="w-full h-full object-cover" alt={`${selectedMember.firstName} ${selectedMember.lastName}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UserCircle size={120} strokeWidth={0.5} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 right-8 left-8">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="h-px w-8 bg-[#FFDE45]"></div>
                     <span className="text-[9px] font-black text-[#FFDE45] drop-shadow-[0_0_8px_rgba(255,222,69,0.5)] uppercase tracking-[0.3em]">Profile</span>
                   </div>
                   <h3 className="text-4xl md:text-5xl font-black text-[#FF2D60] drop-shadow-[0_0_10px_rgba(255,45,96,0.6)] tracking-tighter leading-none">{selectedMember.firstName} {selectedMember.lastName}</h3>
                </div>
             </div>

             <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar text-right relative">
               <div className="max-w-xl mx-auto space-y-10">
               <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-1 text-center p-3 rounded-2xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555]">
                   <p className="text-[9px] font-black text-[#FFDE45] drop-shadow-[0_0_8px_rgba(255,222,69,0.5)] uppercase tracking-widest">Role</p>
                   <p className="font-black text-[#3dbbd3] drop-shadow-[0_0_10px_rgba(0,217,230,0.6)] text-sm">{selectedMember.role}</p>
                 </div>
                 <div className="space-y-1 text-center p-3 rounded-2xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555]">
                   <p className="text-[9px] font-black text-[#FFDE45] drop-shadow-[0_0_8px_rgba(255,222,69,0.5)] uppercase tracking-widest">Sessions</p>
                   <p className="font-black text-[#3dbbd3] drop-shadow-[0_0_10px_rgba(0,217,230,0.6)] text-sm">{selectedMember.totalAttendance || 0}</p>
                 </div>
                 <div className="space-y-1 text-center p-3 rounded-2xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555]">
                   <p className="text-[9px] font-black text-[#FFDE45] drop-shadow-[0_0_8px_rgba(255,222,69,0.5)] uppercase tracking-widest">Joined</p>
                   <p className="font-black text-[#3dbbd3] drop-shadow-[0_0_10px_rgba(0,217,230,0.6)] text-sm">{formatDate(selectedMember.joinedAt)}</p>
                 </div>
               </div>

               <div className="space-y-3">
                 <p className="text-[9px] font-black text-[#FFDE45] drop-shadow-[0_0_8px_rgba(255,222,69,0.5)] uppercase tracking-[0.3em]">About</p>
                 <p className="text-lg font-bold text-[#3dbbd3] drop-shadow-[0_0_10px_rgba(0,217,230,0.6)] leading-snug tracking-tight italic">
                   "{selectedMember.bio || 'חבר בקהילת הגולשים של חבל זוג. חולק את התשוקה לים ולגלים.'}"
                 </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-5 rounded-2xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#B2EBF2]/20 border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_-5px_#7A1555] flex items-center justify-center text-[#FFDE45]"><Phone size={18} /></div>
                    <div className="overflow-hidden">
                       <p className="text-[9px] font-black text-[#FFDE45] drop-shadow-[0_0_8px_rgba(255,222,69,0.5)] uppercase tracking-widest mb-0.5">Mobile</p>
                       <p className="font-black text-[#3dbbd3] drop-shadow-[0_0_10px_rgba(0,217,230,0.6)] text-sm">{selectedMember.mobile}</p>
                    </div>
                 </div>
                 <div className="p-5 rounded-2xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#B2EBF2]/20 border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_-5px_#7A1555] flex items-center justify-center text-[#FFDE45]"><Mail size={18} /></div>
                    <div className="overflow-hidden">
                       <p className="text-[9px] font-black text-[#FFDE45] drop-shadow-[0_0_8px_rgba(255,222,69,0.5)] uppercase tracking-widest mb-0.5">Email</p>
                       <p className="font-black text-[#3dbbd3] drop-shadow-[0_0_10px_rgba(0,217,230,0.6)] text-sm truncate">{selectedMember.email}</p>
                    </div>
                 </div>
               </div>

               <div className="flex justify-center gap-6">
                 <motion.button 
                   onClick={() => openWhatsAppModal(selectedMember.firstName, selectedMember.lastName)}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="w-16 h-16 rounded-full bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555] flex items-center justify-center text-[#25D366] hover:bg-[#B2EBF2]/40 transition-all"
                   title="שלח הודעת WhatsApp"
                 >
                   <WhatsAppIcon className="w-8 h-8 drop-shadow-[0_0_8px_rgba(37,211,102,0.6)]" />
                 </motion.button>

                 <motion.button 
                   onClick={() => window.open(`tel:${selectedMember.mobile}`, '_self')}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="w-16 h-16 rounded-full bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555] flex items-center justify-center text-[#3dbbd3] hover:bg-[#B2EBF2]/40 transition-all"
                   title="Call"
                 >
                   <PhoneIcon className="w-8 h-8 drop-shadow-[0_0_8px_rgba(61,187,211,0.6)]" />
                 </motion.button>
               </div>

               <div className="space-y-4">
                 <p className="text-[9px] font-black text-[#FFDE45] drop-shadow-[0_0_8px_rgba(255,222,69,0.5)] uppercase tracking-[0.3em] text-center">Social Connect</p>
                 <div className="flex justify-center gap-4">
                   <a 
                     href={selectedMember.instagramUrl ? ensureAbsoluteUrl(selectedMember.instagramUrl) : '#'} 
                     target={selectedMember.instagramUrl ? "_blank" : undefined} 
                     rel="noopener noreferrer" 
                     className={`w-12 h-12 rounded-xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555] flex items-center justify-center transition-all ${selectedMember.instagramUrl ? 'text-[#FF2D60] hover:bg-[#B2EBF2]/40' : 'opacity-30 cursor-not-allowed'}`}
                   >
                     <Instagram size={20} />
                   </a>
                   <a 
                     href={selectedMember.facebookUrl ? ensureAbsoluteUrl(selectedMember.facebookUrl) : '#'} 
                     target={selectedMember.facebookUrl ? "_blank" : undefined} 
                     rel="noopener noreferrer" 
                     className={`w-12 h-12 rounded-xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555] flex items-center justify-center transition-all ${selectedMember.facebookUrl ? 'text-[#3dbbd3] hover:bg-[#B2EBF2]/40' : 'opacity-30 cursor-not-allowed'}`}
                   >
                     <Facebook size={20} />
                   </a>
                   <a 
                     href={selectedMember.tiktokUrl ? ensureAbsoluteUrl(selectedMember.tiktokUrl) : '#'} 
                     target={selectedMember.tiktokUrl ? "_blank" : undefined} 
                     rel="noopener noreferrer" 
                     className={`w-12 h-12 rounded-xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555] flex items-center justify-center transition-all ${selectedMember.tiktokUrl ? 'text-[#FFDE45] hover:bg-[#B2EBF2]/40' : 'opacity-30 cursor-not-allowed'}`}
                   >
                     <Music2 size={20} />
                   </a>
                   <a 
                     href={selectedMember.linkedinUrl ? ensureAbsoluteUrl(selectedMember.linkedinUrl) : '#'} 
                     target={selectedMember.linkedinUrl ? "_blank" : undefined} 
                     rel="noopener noreferrer" 
                     className={`w-12 h-12 rounded-xl bg-[#B2EBF2]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_-5px_#7A1555] flex items-center justify-center transition-all ${selectedMember.linkedinUrl ? 'text-[#3dbbd3] hover:bg-[#B2EBF2]/40' : 'opacity-30 cursor-not-allowed'}`}
                   >
                     <Linkedin size={20} />
                   </a>
                 </div>
               </div>
             </div>
             </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-12 modal-overlay animate-in fade-in" onClick={() => setIsAddMemberModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="tangible-surfer-card w-full max-w-7xl h-full md:h-auto md:max-h-[90vh] !rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-8 md:p-12 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 tangible-bevel-inset !rounded-full flex items-center justify-center text-[#3dbbd3]">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black neon-text-pink tracking-tighter">הוספת חבר חדש</h3>
                    <p className="text-[12px] font-black neon-text-yellow uppercase tracking-widest">יצירת פרופיל משתמש ידני</p>
                  </div>
                </div>
                <button onClick={() => setIsAddMemberModalOpen(false)} className="p-3 tangible-bevel-inset hover:bg-white/20 !rounded-full text-white/40 hover:text-white transition-all">
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
                          <div className="w-48 h-48 glass-effect !rounded-full p-2 flex items-center justify-center overflow-hidden">
                            {isProcessingImage ? (
                              <Loader2 className="animate-spin text-[#00AFC2]" size={32} />
                            ) : newMemberData.avatar ? (
                              <img src={newMemberData.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                            ) : (
                              <UserCircle size={80} className="text-white/20" strokeWidth={0.5} />
                            )}
                          </div>
                          <label className="absolute bottom-2 left-2 p-3 bg-[#00AFC2] text-white !rounded-full cursor-pointer shadow-lg hover:scale-110 transition-all">
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
                        <p className="mt-4 text-[12px] font-black glass-text-secondary uppercase tracking-widest">תמונת פרופיל</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest">ביוגרפיה</label>
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
                            className="px-3 py-1.5 glass-effect hover:bg-white/20 !rounded-full text-[10px] font-black text-[#00AFC2] flex items-center gap-1.5 transition-all"
                          >
                            {isGeneratingBio ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} שדרג עם AI
                          </button>
                        </div>
                        <textarea 
                          value={newMemberData.bio} 
                          onChange={e => setNewMemberData(prev => ({ ...prev, bio: e.target.value }))}
                          className="w-full p-6 glass-input !rounded-3xl font-bold h-64 resize-none outline-none focus:bg-white/10 transition-all text-sm leading-relaxed glass-text-primary placeholder:text-white/40" 
                          placeholder="ספר קצת על החבר החדש..." 
                        />
                      </div>
                    </div>

                    {/* Right Column: Fields */}
                    <div className="lg:col-span-8 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">שם פרטי</label>
                          <input 
                            type="text" 
                            value={newMemberData.firstName} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full p-5 glass-effect !rounded-full font-black outline-none focus:bg-white/10 transition-all glass-text-primary" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">שם משפחה</label>
                          <input 
                            type="text" 
                            value={newMemberData.lastName} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full p-5 glass-effect !rounded-full font-black outline-none focus:bg-white/10 transition-all glass-text-primary" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">אימייל</label>
                          <input 
                            type="email" 
                            value={newMemberData.email} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full p-5 glass-effect !rounded-full font-black outline-none focus:bg-white/10 transition-all glass-text-primary" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">טלפון נייד</label>
                          <input 
                            type="tel" 
                            value={newMemberData.mobile} 
                            onChange={e => setNewMemberData(prev => ({ ...prev, mobile: formatMobileNumber(e.target.value) }))}
                            className="w-full p-5 glass-effect !rounded-full font-black outline-none focus:bg-white/10 transition-all glass-text-primary" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">תאריך לידה</label>
                          <div className="relative">
                            <Cake size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40" />
                            <input 
                              type="date" 
                              value={newMemberData.birthday || ''} 
                              onChange={e => setNewMemberData(prev => ({ ...prev, birthday: e.target.value }))} 
                              className="w-full p-5 pr-12 glass-effect !rounded-full font-black outline-none focus:bg-white/10 transition-all glass-text-primary [color-scheme:dark]" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">תפקיד</label>
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                              className="w-full p-5 glass-effect !rounded-full font-black text-sm outline-none transition-all flex items-center justify-between group hover:bg-white/10"
                            >
                              <span className="glass-text-primary">{newMemberData.role === 'Admin' ? 'רכז' : newMemberData.role === 'Instructor' ? 'מדריך' : 'חבר'}</span>
                              <ChevronDown size={18} className={`text-white/40 transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {isRoleDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-[160]" onClick={() => setIsRoleDropdownOpen(false)} />
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 glass-panel !rounded-3xl shadow-2xl z-[170] overflow-hidden"
                                  >
                                    {(['Member', 'Instructor', 'Admin'] as const).map((r) => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => {
                                          setNewMemberData(prev => ({ ...prev, role: r }));
                                          setIsRoleDropdownOpen(false);
                                        }}
                                        className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-white/10 ${
                                          newMemberData.role === r ? 'text-[#00AFC2] bg-white/10' : 'glass-text-primary'
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
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">מגדר</label>
                          <div className="relative">
                            <button 
                              type="button"
                              onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                              className="w-full p-5 glass-effect !rounded-full font-black text-sm outline-none transition-all flex items-center justify-between group hover:bg-white/10"
                            >
                              <span className="glass-text-primary">{newMemberData.gender || 'בחר מגדר'}</span>
                              <ChevronDown size={18} className={`text-white/40 transition-transform duration-300 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {isGenderDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-[160]" onClick={() => setIsGenderDropdownOpen(false)} />
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 glass-panel !rounded-3xl shadow-2xl z-[170] overflow-hidden"
                                  >
                                    {(['זכר', 'נקבה', 'מעדיף/ה לא לציין'] as const).map((g) => (
                                      <button
                                        key={g}
                                        type="button"
                                        onClick={() => {
                                          setNewMemberData(prev => ({ ...prev, gender: g }));
                                          setIsGenderDropdownOpen(false);
                                        }}
                                        className={`w-full px-6 py-4 text-right font-black transition-all hover:bg-white/10 ${
                                          newMemberData.gender === g ? 'text-[#00AFC2] bg-white/10' : 'glass-text-primary'
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
                          <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">סיסמה</label>
                          <div className="flex gap-4">
                            <input 
                              type="text" 
                              value={newMemberData.password || ''} 
                              onChange={e => setNewMemberData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="סיסמה ראשונית"
                              className="flex-1 p-5 glass-effect !rounded-full font-black outline-none transition-all glass-text-primary placeholder:text-white/40" 
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const pass = Math.random().toString(36).slice(-8);
                                setNewMemberData(prev => ({ ...prev, password: pass }));
                              }}
                              className="px-6 glass-effect hover:bg-white/20 !rounded-full text-[#00AFC2] font-black transition-all flex items-center gap-2"
                            >
                              <Sparkles size={16} />
                              ייצר
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[12px] font-black glass-text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
                          <Globe size={14} /> רשתות חברתיות
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">Instagram</label>
                            <input type="text" placeholder="קישור לפרופיל" value={newMemberData.instagramUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, instagramUrl: e.target.value }))} className="w-full p-4 glass-effect !rounded-full font-black text-sm outline-none transition-all glass-text-primary placeholder:text-white/40" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">Facebook</label>
                            <input type="text" placeholder="קישור לפרופיל" value={newMemberData.facebookUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, facebookUrl: e.target.value }))} className="w-full p-4 glass-effect !rounded-full font-black text-sm outline-none transition-all glass-text-primary placeholder:text-white/40" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">LinkedIn</label>
                            <input type="text" placeholder="קישור לפרופיל" value={newMemberData.linkedinUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, linkedinUrl: e.target.value }))} className="w-full p-4 glass-effect !rounded-full font-black text-sm outline-none transition-all glass-text-primary placeholder:text-white/40" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-3">X (Twitter)</label>
                            <input type="text" placeholder="קישור לפרופיל" value={newMemberData.twitterUrl || ''} onChange={e => setNewMemberData(prev => ({ ...prev, twitterUrl: e.target.value }))} className="w-full p-4 glass-effect !rounded-full font-black text-sm outline-none transition-all glass-text-primary placeholder:text-white/40" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 md:p-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-4">
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
                  className="w-full md:w-auto px-16 py-5 bg-[#FF9F1C] text-white !rounded-full font-black text-xl flex items-center justify-center gap-4 shadow-xl shadow-[#FF9F1C]/20 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  שמור חבר חדש
                </button>
                <button 
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="w-full md:w-auto px-12 py-5 glass-effect hover:bg-white/20 !rounded-full glass-text-secondary font-black text-xl transition-all"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isWhatsAppModalOpen && selectedMember && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-lg animate-in fade-in" onClick={() => setIsWhatsAppModalOpen(false)}>
          <div className="glass-panel w-full max-w-md !rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-[#25D366]/10 p-8 text-white flex items-center gap-4 border-b border-white/10">
              <div className="w-12 h-12 glass-effect !rounded-full flex items-center justify-center">
                <WhatsAppIcon className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-black text-xl glass-text-primary">שלח הודעת WhatsApp</h4>
                <p className="text-xs font-bold glass-text-secondary">אל: {selectedMember.firstName} {selectedMember.lastName}</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] font-black glass-text-secondary uppercase tracking-widest pr-2">תוכן ההודעה</label>
                <textarea 
                  value={whatsappMessage}
                  onChange={e => setWhatsappMessage(e.target.value)}
                  className="w-full p-6 glass-input !rounded-3xl font-bold h-40 resize-none outline-none focus:bg-white/10 transition-all text-sm leading-relaxed glass-text-primary placeholder:text-white/40"
                  placeholder="הקלד את ההודעה שלך כאן..."
                  autoFocus
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleSendWhatsApp}
                  className="flex-1 py-4 bg-[#25D366] text-white !rounded-full font-black text-lg shadow-lg shadow-[#25D366]/20 hover:scale-[1.02] transition-all"
                >
                  שלח
                </button>
                <button 
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="flex-1 py-4 glass-effect hover:bg-white/20 !rounded-full glass-text-secondary font-black text-lg transition-all"
                >
                  ביטול
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
