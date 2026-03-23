import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, User, Mail, Phone, MapPin, Waves, Loader2, MessageCircle, LayoutGrid, List, X, Users, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Member } from '../types';
import PlayerCard from '../components/PlayerCard';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { PerformanceInput } from '../components/PerformanceInput';

const DirectoryPage: React.FC = () => {
  const { members, isLoading } = useData();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdentity, setSelectedIdentity] = useState<string>('הכל');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [ratingMemberId, setRatingMemberId] = useState<string | null>(null);

  const isInstructorOrAdmin = currentUser?.role === 'Instructor' || currentUser?.role === 'Admin';

  const identities = ['הכל', 'רכז', 'מדריך', 'חבר'];

  const headerImage = useRandomHeader();

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.mobile && member.mobile.includes(searchTerm));
    
    const memberIdentity = member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר';
    const matchesIdentity = selectedIdentity === 'הכל' || memberIdentity === selectedIdentity;
    
    return matchesSearch && matchesIdentity && member.isActive !== false;
  });

  const roleOrder: Record<string, number> = { 'רכז': 1, 'מדריך': 2, 'חבר': 3 };
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const roleA = a.role === 'Admin' ? 'רכז' : a.role === 'Instructor' ? 'מדריך' : 'חבר';
    const roleB = b.role === 'Admin' ? 'רכז' : b.role === 'Instructor' ? 'מדריך' : 'חבר';
    return roleOrder[roleA] - roleOrder[roleB];
  });

  const renderMember = (member: Member, index: number, isGrid: boolean) => {
    return isGrid ? (
      <motion.div
        key={member.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.02 }}
        onClick={() => setSelectedMemberId(member.id)}
        className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden cursor-pointer h-64"
      >
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
        <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col items-center">
          <h3 className="text-sm sm:text-base font-black text-slate-800 truncate w-full">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 truncate w-full">
            {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
          </p>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-2">
            {isInstructorOrAdmin && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setRatingMemberId(member.id);
                }}
                className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"
                title="הזן ציוני ביצועים"
              >
                <Star size={16} />
              </button>
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
          <div className="w-12 h-12 rounded-xl overflow-hidden">
            {member.avatar ? (
              <img 
                src={member.avatar} 
                alt=""
                className="w-full h-1/2 object-cover feathered-edges"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                <User size={20} />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-black text-slate-800">
              {member.firstName} {member.lastName}
            </h3>
            <p className="text-xs font-bold text-slate-400">
              {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'} • {member.email}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isInstructorOrAdmin && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setRatingMemberId(member.id);
              }}
              className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-2"
            >
              <Star size={16} />
              <span className="text-xs font-bold">דרג ביצועים</span>
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderMembers = () => {
    const rendered: JSX.Element[] = [];
    let lastRole: string | null = null;

    sortedMembers.forEach((member, index) => {
      const currentRole = member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר';
      
      if (!lastRole || lastRole !== currentRole) {
        rendered.push(
          <div key={`sep-${index}`} className="col-span-full flex items-center gap-4 my-6">
            <div className="flex-grow border-t border-slate-200" />
            <span className="text-sm font-black text-slate-400 px-2">
              {currentRole === 'רכז' ? 'רכזים' : currentRole === 'מדריך' ? 'מדריכים' : 'חברים'}
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-6 space-y-2 header-wallpaper !py-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
            <Users size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title">נבחרת הכוכבים</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto">
            הכירו את הקהילה שלנו • {members.length} חברים רשומים 🏄‍♂️
          </p>
        </div>
      </div>

      {/* Search, Filter and View Toggle Bar */}
      <div className="flex flex-col gap-6 bg-white/50 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-bold text-slate-700"
            />
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl self-center md:self-auto">
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
                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {identity}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence mode="popLayout">
            {renderMembers()}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {renderMembers()}
          </AnimatePresence>
        </div>
      )}

      {/* Member Profile Modal */}
      <AnimatePresence>
        {ratingMemberId && (
          <PerformanceInput 
            member={members.find(m => m.id === ratingMemberId)!} 
            onClose={() => setRatingMemberId(null)} 
          />
        )}
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

      {filteredMembers.length === 0 && (
        <div className="text-center py-20 space-y-4 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800">לא נמצאו חברים התואמים לחיפוש</h3>
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
