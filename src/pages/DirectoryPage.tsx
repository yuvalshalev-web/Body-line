import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, User, Mail, Phone, MapPin, Waves, Loader2, MessageCircle, LayoutGrid, List, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';
import PlayerCard from '../components/PlayerCard';

const DirectoryPage: React.FC = () => {
  const { members, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('הכל');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const groups = ['הכל', ...Array.from(new Set(members.map(m => m.group || 'ללא קבוצה')))];

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.mobile && member.mobile.includes(searchTerm));
    
    const matchesGroup = selectedGroup === 'הכל' || (member.group || 'ללא קבוצה') === selectedGroup;
    
    return matchesSearch && matchesGroup && member.isActive !== false;
  });

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
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20">
          <Waves size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight">נבחרת הכוכבים</h1>
        <p className="text-slate-500 text-lg font-bold max-w-2xl mx-auto">
          הכירו את הגולשים והגולשות של חבל זוג. הקהילה שלנו צומחת ומתפתחת בכל יום.
        </p>
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
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${
                selectedGroup === group
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => setSelectedMemberId(member.id)}
                className="group bg-white rounded-3xl border border-slate-100 p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative mb-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-500">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={`${member.firstName} ${member.lastName}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1 w-full">
                  <h3 className="text-sm sm:text-base font-black text-slate-800 truncate">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 truncate">
                    {member.group || 'ללא קבוצה'}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  {member.mobile && (
                    <>
                      <button 
                        onClick={(e) => openWhatsApp(e, member.mobile!, member.firstName)}
                        className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        title="WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button 
                        onClick={(e) => callMobile(e, member.mobile!)}
                        className="w-8 h-8 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all shadow-sm"
                        title="Call"
                      >
                        <Phone size={16} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member, index) => (
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
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
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
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-xs font-bold text-slate-400">
                      {member.group || 'ללא קבוצה'} • {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {member.mobile && (
                    <>
                      <button 
                        onClick={(e) => openWhatsApp(e, member.mobile!, member.firstName)}
                        className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </button>
                      <button 
                        onClick={(e) => callMobile(e, member.mobile!)}
                        className="px-4 py-2 rounded-xl bg-sky-50 text-sky-600 font-black text-xs flex items-center gap-2 hover:bg-sky-500 hover:text-white transition-all"
                      >
                        <Phone size={14} />
                        התקשר
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedMemberId(null)}
                className="absolute top-6 left-6 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <div className="p-2">
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
          <p className="text-slate-500 font-bold">נסו לשנות את מילות החיפוש או את הסינון לפי קבוצה</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedGroup('הכל'); }}
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
