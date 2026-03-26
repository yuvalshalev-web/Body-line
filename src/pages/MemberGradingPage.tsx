import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, User, UserCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import MemberGradingModal from '../components/admin/MemberGradingModal';
import { Member } from '../types';
import { useRandomHeader } from '../hooks/useRandomHeader';

const MemberGradingPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { members } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = members.filter(m => 
    m.role !== 'Instructor' && 
    (m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="relative min-h-screen luxury-bg text-right space-y-12 pb-20 pt-8" dir="rtl">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-200/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-200/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 px-4">
        {/* Header Section */}
        <div className="luxury-card p-6 mb-12 border border-white/40">
          <div className="surfboard-hero-container mb-6 space-y-2 header-wallpaper !py-10 rounded-[2rem]" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
            <div className="header-content-wrapper relative z-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
                <UserCheck size={40} />
              </div>
              <h1 className="main-page-title">
                <span className="surfer-title">הערכות חברים</span>
              </h1>
              <p className="header-subtitle max-w-2xl mx-auto">
                ניהול ומעקב אחר ביצועי והתקדמות חברי הנבחרת 🌊
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-sky-500/40" />
            <input 
              type="text" 
              placeholder="חיפוש חבר..." 
              className="w-full pr-16 pl-6 py-6 luxury-card font-black focus:ring-2 ring-sky-500/30 text-slate-900 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredMembers.map(member => (
              <motion.div 
                key={member.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="luxury-card p-6 cursor-pointer text-center group transition-all hover:border-sky-500/30"
                onClick={() => setSelectedMember(member)}
              >
                <div className="relative mb-4">
                  <div className="absolute -inset-2 bg-gradient-to-br from-sky-400/20 to-transparent rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  {member.avatar ? (
                    <img 
                      src={member.avatar}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-white shadow-lg relative z-10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto bg-sky-50 flex items-center justify-center text-sky-500 border-2 border-white shadow-lg relative z-10">
                      <User size={40} />
                    </div>
                  )}
                </div>
                <h3 className="font-black text-slate-900 text-lg group-hover:text-sky-600 transition-colors">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {member.role === 'Admin' ? 'רכז' : member.role === 'Instructor' ? 'מדריך' : 'חבר'}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {selectedMember && (
        <MemberGradingModal 
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          member={selectedMember}
        />
      )}
    </div>
  );
};

export default MemberGradingPage;
