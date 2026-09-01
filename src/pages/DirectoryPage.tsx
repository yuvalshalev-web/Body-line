import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, User, Mail, Phone, MapPin, Waves, Loader2, MessageCircle, LayoutGrid, List, X, Users, Headset, Send, Link2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Member } from '../types';
import PlayerCard from '../components/PlayerCard';
import { useRandomHeader } from '../hooks/useRandomHeader';

const DirectoryPage: React.FC = () => {
  const { members, isLoading } = useData();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdentity, setSelectedIdentity] = useState<string>('הכל');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [supportModalMember, setSupportModalMember] = useState<Member | null>(null);

  const isAppShaperMember = (m: Member) => {
    const emailLower = (m.email || '').toLowerCase();
    return m.role === 'Support' || emailLower === 'yuval.shalev@gmail.com';
  };

  const getRoleLabel = (m: Member) => {
    if (isAppShaperMember(m)) {
      return 'אפ-שייפר';
    }
    if (m.role === 'Admin') return 'רכז';
    if (m.role === 'Staff') return 'צוות עמותה';
    if (m.role === 'Instructor') return 'מדריך';
    if (m.role === 'Volunteer') return 'מתנדב';
    return 'משתתף';
  };

  const identities = ['הכל', 'רכז', 'אפ-שייפר', 'מדריך', 'מתנדב', 'משתתף', 'צוות עמותה'];

  const headerImage = useRandomHeader();

  const filteredMembers = members.filter(member => {
    const memberEmail = member.email || '';
    const matchesSearch = 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.mobile && member.mobile.includes(searchTerm));
    
    const memberIdentity = getRoleLabel(member);
    const matchesIdentity = selectedIdentity === 'הכל' || memberIdentity === selectedIdentity;
    
    return matchesSearch && matchesIdentity && member.isActive !== false;
  });

  const roleOrder: Record<string, number> = { 
    'רכז': 1, 
    'אפ-שייפר': 2, 
    'מדריך': 3, 
    'מתנדב': 4, 
    'משתתף': 5,
    'צוות עמותה': 6
  };

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const roleA = getRoleLabel(a);
    const roleB = getRoleLabel(b);
    const orderA = roleOrder[roleA] ?? 99;
    const orderB = roleOrder[roleB] ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
    const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
    return nameA.localeCompare(nameB, 'he');
  });

  const renderMember = (member: Member, index: number, isGrid: boolean) => {
    const isAppShaper = isAppShaperMember(member);
    const partner = member.partnerId ? members.find(m => m.id === member.partnerId) : null;

    return isGrid ? (
      <motion.div
        key={member.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.02 }}
        onClick={() => setSelectedMemberId(member.id)}
        className="group luxury-card flex flex-col items-center text-center relative overflow-hidden cursor-pointer h-64 !scale-100 hover:!scale-105 transition-transform duration-500"
      >
        <div className="grain-overlay opacity-[0.05]" />
        {/* Avatar - Top Half */}
        <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden">
            {member.avatar ? (
              <img 
                src={member.avatar} 
                alt={`${member.firstName} ${member.lastName}`}
                className="w-full h-full object-cover feathered-edges"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                <User size={32} />
              </div>
            )}
        </div>

        {/* Info - Bottom Half */}
        <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 flex flex-col items-center justify-center h-1/2">
          {/* App-Shaper Support Widget - Placed directly between Image and Name */}
          {isAppShaper && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSupportModalMember(member);
              }}
              className="-mt-5 mb-1.5 z-30 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-slate-700 via-blue-600 to-slate-500 text-white rounded-full text-[11px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all border-2 border-white backdrop-blur-md cursor-pointer animate-pulse hover:animate-none"
              title="תמיכה טכנית - App-Shaper"
            >
              <Headset size={13} className="text-white" />
              <span>תמיכה טכנית</span>
            </button>
          )}

          <h3 className="text-sm sm:text-base font-black text-slate-800 truncate w-full flex items-center justify-center gap-1">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 truncate w-full">
            {getRoleLabel(member)}
          </p>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-2">
            {partner && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[var(--surfer-aqua-mist)]/20 to-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-700 shadow-sm hover:scale-105 transition-transform"
                title={`חבל זוג עם ${partner.firstName}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMemberId(partner.id);
                }}
              >
                <Link2 size={12} className="text-indigo-500" />
                <div className="w-4 h-4 rounded-full overflow-hidden bg-white border border-indigo-200">
                  {partner.avatar ? <img src={partner.avatar} className="w-full h-full object-cover" /> : <User size={10} className="m-auto opacity-50 mt-0.5" />}
                </div>
                <span className="truncate max-w-[65px]">{partner.firstName}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    ) : (
      <motion.div
        key={member.id}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: index * 0.02 }}
        onClick={() => setSelectedMemberId(member.id)}
        className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
            {member.avatar ? (
              <img 
                src={member.avatar} 
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                <User size={20} />
              </div>
            )}
            {isAppShaper && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSupportModalMember(member);
                }}
                className="absolute -top-1 -right-1 z-30 p-1.5 bg-gradient-to-r from-slate-700 to-blue-600 text-white rounded-full shadow-md hover:scale-110 transition-all border border-white/80"
                title="תמיכה טכנית - App-Shaper"
              >
                <Headset size={12} />
              </button>
            )}
          </div>
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              {member.firstName} {member.lastName}
              {isAppShaper && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSupportModalMember(member);
                  }}
                  className="px-2.5 py-0.5 text-[10px] bg-gradient-to-r from-slate-700 via-blue-600 to-slate-500 text-white font-bold rounded-full flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer shadow-sm"
                >
                  <Headset size={10} /> תמיכה טכנית
                </button>
              )}
            </h3>
            <p className="text-xs font-bold text-slate-400">
              {getRoleLabel(member)} • {member.email}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {partner && (
            <div 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors"
              title={`חבל זוג עם ${partner.firstName} ${partner.lastName}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMemberId(partner.id);
              }}
            >
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase leading-none">חבל זוג</span>
                <span className="text-xs font-bold text-indigo-700 leading-tight">{partner.firstName} {partner.lastName}</span>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white border-2 border-indigo-200 shrink-0 relative">
                {partner.avatar ? <img src={partner.avatar} className="w-full h-full object-cover" /> : <User size={16} className="m-auto opacity-50 mt-1" />}
                <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-0.5 rounded-full border-2 border-white">
                  <Link2 size={10} />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const getSectionTitle = (role: string) => {
    switch (role) {
      case 'רכז': return 'רכזים';
      case 'אפ-שייפר': return 'אפ-שייפר';
      case 'מדריך': return 'מדריכים';
      case 'מתנדב': return 'מתנדבים';
      case 'משתתף': return 'משתתפים';
      case 'צוות עמותה': return 'צוות עמותה';
      default: return role;
    }
  };

  const renderMembers = () => {
    const rendered: JSX.Element[] = [];
    let lastRole: string | null = null;

    sortedMembers.forEach((member, index) => {
      const currentRole = getRoleLabel(member);
      
      if (!lastRole || lastRole !== currentRole) {
        rendered.push(
          <div key={`sep-${currentRole}-${index}`} className="col-span-full flex items-center gap-4 my-6">
            <div className="flex-grow border-t border-slate-200" />
            <span className="text-sm font-black text-slate-400 px-2">
              {getSectionTitle(currentRole)}
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>
        );
      }
      
      rendered.push(renderMember(member, index, viewMode === 'grid'));
      lastRole = currentRole;
    });

    return rendered;
  };

  const openWhatsApp = (e: React.MouseEvent, mobile: string, name: string) => {
    e.stopPropagation();
    const cleanMobile = mobile.replace(/\D/g, '');
    const finalMobile = cleanMobile.startsWith('0') ? '972' + cleanMobile.substring(1) : cleanMobile;
    const message = encodeURIComponent(`היי ${name}, מה קורה?`);
    window.open(`https://wa.me/${finalMobile}?text=${message}`, '_blank');
  };

  const callMobile = (e: React.MouseEvent, mobile: string) => {
    e.stopPropagation();
    window.location.href = `tel:${mobile}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">טוען את נבחרת הכוכבים...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 pb-20 luxury-bg min-h-screen" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="luxury-card mb-0 relative overflow-hidden !rounded-none md:!rounded-3xl">
        <div className="grain-overlay" />
        <div className="surfboard-hero-container header-wallpaper !py-12 pb-24 relative z-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
          <div className="header-content-wrapper relative z-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
              <Users size={40} />
            </div>
            <h1 className="main-page-title">
              <span className="surfer-title text-[#121212]">נבחרת הכוכבים</span>
            </h1>
            <p className="header-subtitle max-w-2xl mx-auto text-[#121212]">
              הכירו את הקהילה שלנו • {members.length} משתתפים רשומים 🏄‍♂️
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-8">
        {/* Search, Filter and View Toggle Bar */}
        <div className="luxury-card p-6 md:p-8 relative z-30 mx-0 overflow-hidden">
          <div className="grain-overlay opacity-[0.03]" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="חיפוש לפי שם, אימייל או טלפון..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 bg-white/50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-bold text-slate-700 shadow-inner"
                />
              </div>
              
              {/* View Toggle */}
              <div className="flex bg-slate-100/50 p-1 rounded-2xl self-center md:self-auto shadow-inner">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="תצוגת גריד"
                >
                  <LayoutGrid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="תצוגת רשימה"
                >
                  <List size={20} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {identities.map(identity => (
                <button
                  key={identity}
                  onClick={() => setSelectedIdentity(identity)}
                  className={`px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${
                    selectedIdentity === identity
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                      : 'bg-white/50 text-slate-500 border border-slate-100 hover:bg-white shadow-sm'
                  }`}
                >
                  {identity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Members Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8">
            <AnimatePresence mode="popLayout">
              {renderMembers()}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-3 mt-8">
            <AnimatePresence mode="popLayout">
              {renderMembers()}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Member Profile Modal */}
      <AnimatePresence>
        {selectedMemberId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMemberId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#f0f8ff] rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,66,106,0.2)] overflow-hidden border-t border-l border-white/80 border-b border-r border-[#00426a]/10"
            >
              {/* Subtle gradient / Aqua Mist in corners */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-100/40 rounded-full blur-3xl -z-10" />
              {/* Micro-grain texture */}
              <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none -z-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
              
              <button 
                onClick={() => setSelectedMemberId(null)}
                className="absolute top-6 left-6 z-50 p-2 bg-[#00426a]/5 hover:bg-[#00426a]/10 text-[#00426a] rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <div className="p-8 max-h-[90vh] overflow-y-auto">
                <PlayerCard userId={selectedMemberId} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App-Shaper Tech Support Modal */}
      <AnimatePresence>
        {supportModalMember && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSupportModalMember(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 sm:p-8 z-10 text-center"
            >
              {/* Top Accent Icon & Close */}
              <button 
                onClick={() => setSupportModalMember(null)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-700 via-blue-600 to-slate-500 text-white shadow-lg shadow-slate-500/30 mb-4 mx-auto">
                <Headset size={32} />
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-1">
                תמיכה טכנית - App-Shaper
              </h3>
              <p className="text-xs font-bold text-slate-500 mb-6">
                פנייה ישירה למפתח המערכת ({supportModalMember.firstName} {supportModalMember.lastName})
              </p>

              <div className="space-y-3 mb-6">
                {/* WhatsApp Button */}
                <button
                  onClick={() => {
                    const mobile = supportModalMember.mobile ? supportModalMember.mobile.replace(/\D/g, '') : '';
                    const finalMobile = mobile ? (mobile.startsWith('0') ? '972' + mobile.substring(1) : mobile) : '972540000000';
                    const msg = encodeURIComponent('היי יובל, אשמח לקבל עזרה טכנית במערכת BodyLine');
                    window.open(`https://wa.me/${finalMobile}?text=${msg}`, '_blank');
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200/80 rounded-2xl text-emerald-800 transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <MessageCircle size={20} />
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm">פנייה בוואטסאפ (WhatsApp)</div>
                      <div className="text-[11px] font-bold text-emerald-600">מענה מהיר לשאלות ותקלות</div>
                    </div>
                  </div>
                  <Send size={18} className="text-emerald-600 group-hover:-translate-x-1 transition-transform" />
                </button>

                {/* Email Button */}
                <button
                  onClick={() => {
                    const email = supportModalMember.email || 'yuval.shalev@gmail.com';
                    const subject = encodeURIComponent('פנייה לתמיכה טכנית - BodyLine');
                    const body = encodeURIComponent('היי יובל,\n\nאשמח לקבל עזרה בנושא: ');
                    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-cyan-50 hover:from-sky-100 hover:to-cyan-100 border border-sky-200/80 rounded-2xl text-sky-900 transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Mail size={20} />
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm">שליחת אימייל</div>
                      <div className="text-[11px] font-bold text-sky-600">{supportModalMember.email || 'yuval.shalev@gmail.com'}</div>
                    </div>
                  </div>
                  <Send size={18} className="text-sky-600 group-hover:-translate-x-1 transition-transform" />
                </button>

                {/* Phone Call Button if mobile exists */}
                {supportModalMember.mobile && (
                  <button
                    onClick={() => {
                      window.location.href = `tel:${supportModalMember.mobile}`;
                    }}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 rounded-2xl text-blue-900 transition-all group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Phone size={20} />
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm">שיחה טלפונית</div>
                        <div className="text-[11px] font-bold text-blue-600">{supportModalMember.mobile}</div>
                      </div>
                    </div>
                    <Phone size={18} className="text-blue-600" />
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400 font-bold">
                App-Shaper • מפתח המערכת וכל התשתיות הטכנולוגיות
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {filteredMembers.length === 0 && (
        <div className="text-center py-20 space-y-4 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800">לא נמצאו משתמשים התואמים לחיפוש</h3>
          <p className="text-slate-500 font-bold">נסו לשנות את מילות החיפוש או את הסינון לפי זהות</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedIdentity('הכל'); }}
            className="text-sky-500 font-black hover:underline"
          >
            נקה את כל המסננים
          </button>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;
