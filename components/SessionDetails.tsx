
import React from 'react';
import { X, Calendar, User, Users, Clock, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Member } from '../types';
import { formatDate } from '../src/utils/dateUtils';

interface SessionDetailsProps {
  session: any;
  members: Member[];
  onClose: () => void;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({ session, members, onClose }) => {
  if (!session) return null;

  const formattedDate = formatDate(session.date);

  const participantList = (session.participantIds || []).map((id: string) => 
    members.find(m => m.id === id)
  ).filter(Boolean) as Member[];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="modal-content w-full max-w-2xl !rounded-[3rem] flex flex-col max-h-[90vh] relative"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Neumorphic Inner Shadow Overlay */}
        <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(255,255,255,0.1)] pointer-events-none rounded-[3rem]" />
        
        {/* Decorative background elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none animate-pulse" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-black/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="relative h-48 bg-gradient-to-b from-blue-400/20 to-transparent p-8 flex flex-col justify-end border-b border-white/5">
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 text-white/40 mb-2 relative z-10">
            <Calendar size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">{formattedDate}</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter relative z-10">פרטי סשן</h2>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 text-white/30 mb-2">
                <User size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">מדריך</span>
              </div>
              <p className="text-xl font-black text-white">{session.instructorName || 'מדריך חבל זוג'}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 text-white/30 mb-2">
                <Users size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">משתתפים</span>
              </div>
              <p className="text-xl font-black text-white">{session.participantsCount || 0} גולשים</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              רשימת משתתפים
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participantList.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10">
                    {member.avatar ? (
                      <img src={member.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-white/80">{member.firstName} {member.lastName}</span>
                </div>
              ))}
              {participantList.length === 0 && (
                <p className="text-white/30 font-bold italic col-span-full text-center py-4">אין רשימת משתתפים זמינה</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/20 border-t border-white/5 flex justify-center relative z-10">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-blue-400 text-[#021626] rounded-2xl font-black text-lg hover:bg-blue-400/90 transition-all active:scale-95"
          >
            סגור
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SessionDetails;
