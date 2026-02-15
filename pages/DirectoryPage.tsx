
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Mail, 
  Phone, 
  Facebook, 
  Instagram, 
  Music, 
  Linkedin,
  SortAsc, 
  Calendar,
  X,
  ExternalLink,
  Sparkles,
  User,
  ShieldCheck,
  ChevronDown,
  Waves,
  Send,
  MessageSquare,
  Share2
} from 'lucide-react';
import { Member } from '../types';

type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'role';

interface DirectoryPageProps {
  members: Member[];
}

const WhatsAppLogo = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="28" 
    height="28" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const DirectoryPage: React.FC<DirectoryPageProps> = ({ members }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const sortOptions = [
    { id: 'name-asc', label: 'שם (א-ת)', icon: SortAsc },
    { id: 'name-desc', label: 'שם (ת-א)', icon: SortAsc },
    { id: 'newest', label: 'הצטרפו לאחרונה', icon: Calendar },
    { id: 'oldest', label: 'חברים ותיקים', icon: Calendar },
    { id: 'role', label: 'מנהלים תחילה', icon: ShieldCheck },
  ];

  const processedMembers = useMemo(() => {
    let filtered = members.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.bio.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name, 'he');
        case 'name-desc': return b.name.localeCompare(a.name, 'he');
        case 'newest': return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        case 'oldest': return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        case 'role': 
          if (a.role === b.role) return a.name.localeCompare(b.name, 'he');
          return a.role === 'Admin' ? -1 : 1;
        default: return 0;
      }
    });
  }, [members, searchTerm, sortBy]);

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const getWhatsAppLink = (mobile: string) => {
    const cleanNumber = mobile.replace(/[^0-9]/g, '');
    const formattedNumber = cleanNumber.startsWith('0') ? '972' + cleanNumber.substring(1) : cleanNumber;
    return `https://wa.me/${formattedNumber}`;
  };

  const SocialIconLink = ({ href, icon: Icon, brandColor, label }: { href?: string, icon: any, brandColor: string, label: string }) => {
    if (!href || !href.trim()) return null;
    return (
      <a 
        href={ensureAbsoluteUrl(href)} 
        target="_blank" 
        rel="noopener noreferrer" 
        onClick={(e) => e.stopPropagation()}
        className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95 group/social hover:shadow-xl hover:-translate-y-1"
        title={label}
      >
        <Icon size={24} className={`${brandColor} transition-transform`} />
      </a>
    );
  };

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-14 md:p-14 overflow-hidden bg-white text-right">
      {/* Background Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/40 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-slate-50 rounded-full blur-[100px] -ml-48"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest mb-4 shadow-xl">
            <Sparkles size={12} className="text-indigo-400" />
            נבחרת הכוכבים
          </div>
          <h2 className="text-5xl font-black text-slate-950 tracking-tighter leading-tight mb-3">האנשים שמאחורי הגלים</h2>
          <p className="text-slate-500 text-xl font-medium max-w-2xl">הכירו את קהילת חבל זוג. מרחב של חברות, מקצוענות ואהבה לים.</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-5 mb-14">
          <div className="flex-1 relative group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="חפש חבר בנבחרת..." 
              className="w-full pr-16 pl-8 py-5.5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:bg-white focus:border-indigo-200 outline-none transition-all font-black text-slate-950 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="h-full flex items-center gap-5 px-10 py-5.5 bg-white border border-slate-100 rounded-[2rem] font-black text-sm hover:bg-slate-50 transition-all shadow-sm min-w-[240px]"
            >
              <SortAsc size={20} className="text-slate-400" />
              <span className="flex-1 text-right">{sortOptions.find(o => o.id === sortBy)?.label}</span>
              <ChevronDown size={18} className={`transition-transform duration-500 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSortOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] z-50 py-3 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => { setSortBy(option.id as SortOption); setIsSortOpen(false); }}
                    className={`w-full flex items-center gap-4 px-8 py-4.5 text-right hover:bg-slate-50 transition-all font-black text-sm ${sortBy === option.id ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-600'}`}
                  >
                    <option.icon size={18} className={sortBy === option.id ? 'text-indigo-600' : 'text-slate-300'} />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Members Grid - Optimized for Mobile & Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
          {processedMembers.map((member) => (
            <div 
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="group bg-white rounded-[3.5rem] border border-slate-100 p-7 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-700 cursor-pointer hover:-translate-y-3 flex flex-col h-full relative"
            >
              <div className="relative mb-8 overflow-hidden rounded-[2.5rem]">
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="w-full aspect-square object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 shadow-xl"
                />
                {member.role === 'Admin' && (
                  <div className="absolute top-5 left-5 bg-slate-950 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/10 backdrop-blur-md">
                    מנהל
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-950 group-hover:text-indigo-600 transition-colors mb-2 tracking-tight leading-none">{member.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">חבר בנבחרת • {member.joinedAt}</p>
                
                <p className="text-slate-500 font-bold text-sm leading-relaxed italic line-clamp-3 mb-8 flex-1">
                  "{member.bio}"
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    {member.facebookUrl && <Facebook size={14} className="text-slate-300 group-hover:text-[#1877F2] transition-colors" />}
                    {member.instagramUrl && <Instagram size={14} className="text-slate-300 group-hover:text-[#E4405F] transition-colors" />}
                    {member.linkedinUrl && <Linkedin size={14} className="text-slate-300 group-hover:text-[#0A66C2] transition-colors" />}
                    {member.tiktokUrl && <Music size={14} className="text-slate-300 group-hover:text-slate-950 transition-colors" />}
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500">
                    פרופיל מלא
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {processedMembers.length === 0 && (
          <div className="py-48 text-center flex flex-col items-center animate-in fade-in duration-700">
            <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mb-10 text-slate-200 border border-slate-100">
              <User size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">לא מצאנו אף חבר כזה...</h3>
            <p className="text-slate-400 mt-2 font-medium text-xl">נסה לחפש שם אחר או פשוט דפדף ברשימה.</p>
            <button onClick={() => setSearchTerm('')} className="mt-12 px-12 py-5 bg-slate-950 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-2xl active:scale-95">נקה את כל המסננים</button>
          </div>
        )}
      </div>

      {/* Member Profile Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 max-h-[95vh] overflow-y-auto border border-white/20">
            
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-8 left-8 p-3.5 bg-white/95 backdrop-blur-md text-slate-400 hover:text-slate-950 rounded-2xl shadow-2xl border border-slate-100 z-50 transition-all hover:scale-110 active:scale-90"
            >
              <X size={24} />
            </button>
            
            <div className="h-56 md:h-72 bg-gradient-to-br from-slate-950 to-indigo-950 relative">
               <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -mr-48 -mt-48"></div>
                  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                  <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                     <Waves size={240} className="text-white animate-pulse" />
                  </div>
               </div>
            </div>

            <div className="relative px-10 md:px-20 pb-20">
               {/* Hero Info */}
               <div className="flex flex-col md:flex-row items-end gap-10 -mt-24 md:-mt-32 mb-16">
                  <div className="relative group/avatar">
                    <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-[3.5rem] blur-xl opacity-20 group-hover/avatar:opacity-40 transition-opacity"></div>
                    <img 
                      src={selectedMember.avatar} 
                      className="relative w-48 h-48 md:w-64 md:h-64 rounded-[3rem] object-cover shadow-2xl border-8 border-white bg-white" 
                      alt={selectedMember.name} 
                    />
                  </div>
                  <div className="flex-1 pb-4 text-right">
                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-5 border border-indigo-100 shadow-sm">
                        {selectedMember.role === 'Admin' ? <ShieldCheck size={14} /> : <User size={14} />}
                        {selectedMember.role === 'Admin' ? 'מנהל מערכת' : 'חבר בקהילה'}
                     </div>
                     <h3 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter leading-none mb-3">{selectedMember.name}</h3>
                     <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em] flex items-center gap-3">
                        <Calendar size={16} className="text-indigo-400" />
                        הצטרף/ה ב-{selectedMember.joinedAt}
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  {/* About Section */}
                  <div className="lg:col-span-7 space-y-12">
                     <div className="text-right">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="h-px flex-1 bg-slate-100"></div>
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">ביוגרפיה אישית</h4>
                        </div>
                        <div className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 shadow-inner relative overflow-hidden">
                           <Sparkles size={40} className="absolute -bottom-4 -left-4 text-indigo-500/5 rotate-12" />
                           <p className="text-slate-600 font-bold text-xl md:text-2xl leading-relaxed italic text-right relative z-10">
                              "{selectedMember.bio}"
                           </p>
                        </div>
                     </div>

                     {/* Social Links Section in Modal */}
                     <div className="text-right">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="h-px flex-1 bg-slate-100"></div>
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                             <Share2 size={14} className="text-indigo-500" />
                             חיבורים חברתיים
                           </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 justify-end">
                           <SocialIconLink href={selectedMember.facebookUrl} icon={Facebook} brandColor="text-[#1877F2]" label="Facebook" />
                           <SocialIconLink href={selectedMember.instagramUrl} icon={Instagram} brandColor="text-[#E4405F]" label="Instagram" />
                           <SocialIconLink href={selectedMember.linkedinUrl} icon={Linkedin} brandColor="text-[#0A66C2]" label="LinkedIn" />
                           <SocialIconLink href={selectedMember.tiktokUrl} icon={Music} brandColor="text-slate-950" label="TikTok" />
                        </div>
                     </div>
                  </div>

                  {/* Contact Sidebar */}
                  <div className="lg:col-span-5 space-y-10">
                     <div>
                        <div className="flex items-center gap-4 mb-8">
                           <div className="h-px flex-1 bg-slate-100"></div>
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">צרו קשר</h4>
                        </div>
                        <div className="space-y-5">
                           <div className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm group hover:border-indigo-100 transition-all hover:shadow-md">
                              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                                 <Mail size={28} />
                              </div>
                              <div className="min-w-0 flex-1 text-right">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">אימייל</p>
                                 <p className="text-slate-900 font-black text-lg truncate">{selectedMember.email}</p>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm group hover:border-emerald-100 transition-all hover:shadow-md">
                              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                                 <Phone size={28} />
                              </div>
                              <div className="min-w-0 flex-1 text-right">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">טלפון</p>
                                 <p className="text-slate-900 font-black text-lg">{selectedMember.mobile}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-8">
                        <a 
                          href={getWhatsAppLink(selectedMember.mobile)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-7 bg-[#25D366] text-white rounded-[2.5rem] font-black text-xl hover:bg-[#128C7E] transition-all shadow-2xl flex items-center justify-center gap-5 group active:scale-95 overflow-hidden relative"
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity"></div>
                          <WhatsAppLogo />
                          <span>שלח הודעת וואטסאפ</span>
                        </a>
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
