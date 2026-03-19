
import React from 'react';
import { X, Calendar, User, Users, Clock, MapPin, Waves, Wind, Thermometer, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { Member } from '../types';
import { formatDate } from '../utils/dateUtils';

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

  const instructors = participantList.filter(m => m.role === 'Instructor');
  const instructorNames = instructors.length > 0 
    ? instructors.map(m => `${m.firstName} ${m.lastName}`).join(', ')
    : 'אין';

  const coordinators = participantList.filter(m => m.role === 'Admin');
  const coordinatorNames = coordinators.length > 0 
    ? coordinators.map(m => `${m.firstName} ${m.lastName}`).join(', ')
    : 'אין';

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
        className="w-full max-w-2xl !rounded-[3rem] flex flex-col max-h-[90vh] relative elite-alabaster-modal overflow-hidden"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Grit Overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        
        {/* Neumorphic Inner Shadow Overlay */}
        <div className="absolute inset-0 shadow-[inner_0_2px_10px_rgba(255,255,255,0.1)] pointer-events-none rounded-[3rem] z-10" />
        
        {/* Decorative background elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none animate-pulse" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-black/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="relative h-48 bg-gradient-to-b from-[#0071a1]/10 to-transparent p-8 flex flex-col justify-end border-b border-[#00426a]/5">
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 bg-[#00426a]/10 hover:bg-[#00426a]/20 rounded-full text-[#00426a] transition-all z-20"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 text-[#00426a]/40 mb-2 relative z-10">
            <Calendar size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">{formattedDate}</span>
          </div>
          <h2 className="text-4xl font-black text-[#00426a] tracking-tighter relative z-10">פרטי סשן</h2>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="floating-slab-deep p-5">
              <div className="flex items-center gap-3 text-[#00426a]/30 mb-2">
                <User size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">מדריכים:</span>
              </div>
              <p className="text-lg font-black text-[#00426a]">{instructorNames}</p>
            </div>
            <div className="floating-slab-deep p-5">
              <div className="flex items-center gap-3 text-[#00426a]/30 mb-2">
                <User size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">רכזים:</span>
              </div>
              <p className="text-lg font-black text-[#00426a]">{coordinatorNames}</p>
            </div>
            <div className="floating-slab-deep p-5">
              <div className="flex items-center gap-3 text-[#00426a]/30 mb-2">
                <Users size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">משתתפים</span>
              </div>
              <p className="text-lg font-black text-[#00426a]">{session.participantsCount || 0} גולשים</p>
            </div>
          </div>

          {/* Sea State Info */}
          {(session.waveHeight !== undefined || session.seaState?.waveHeight !== undefined || session.windSpeed !== undefined || session.seaState?.windSpeed !== undefined || session.waterTemp !== undefined || session.seaState?.waterTemp !== undefined || session.uvIndex !== undefined || session.seaState?.uvIndex !== undefined) && (
            <div className="floating-slab-deep p-6">
              <div className="flex items-center gap-3 text-[#00426a]/30 mb-4">
                <Waves size={18} />
                <span className="text-[12px] font-black uppercase tracking-widest">מצב הים בסשן</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(session.waveHeight !== undefined || session.seaState?.waveHeight !== undefined) && (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[#0071a1]/5 border border-[#0071a1]/10 transition-all hover:bg-[#0071a1]/10">
                    <span className="text-[#00426a]/40 text-[10px] font-black uppercase tracking-wider">גובה גלים</span>
                    <div className="flex items-center gap-2">
                      <Waves size={16} className="text-[#0071a1]" />
                      <span className="text-xl font-black text-[#00426a]" dir="ltr">{session.waveHeight ?? session.seaState?.waveHeight}m</span>
                    </div>
                  </div>
                )}
                {(session.windSpeed !== undefined || session.seaState?.windSpeed !== undefined) && (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[#0891b2]/5 border border-[#0891b2]/10 transition-all hover:bg-[#0891b2]/10">
                    <span className="text-[#00426a]/40 text-[10px] font-black uppercase tracking-wider">מהירות רוח</span>
                    <div className="flex items-center gap-2">
                      <Wind size={16} className="text-[#0071a1]" />
                      <span className="text-xl font-black text-[#00426a]" dir="ltr">{session.windSpeed ?? session.seaState?.windSpeed}kts</span>
                    </div>
                  </div>
                )}
                {(session.waterTemp !== undefined || session.seaState?.waterTemp !== undefined) && (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[#4338ca]/5 border border-[#4338ca]/10 transition-all hover:bg-[#4338ca]/10">
                    <span className="text-[#00426a]/40 text-[10px] font-black uppercase tracking-wider">טמפ׳ מים</span>
                    <div className="flex items-center gap-2">
                      <Thermometer size={16} className="text-[#0071a1]" />
                      <span className="text-xl font-black text-[#00426a]" dir="ltr">{session.waterTemp ?? session.seaState?.waterTemp}°C</span>
                    </div>
                  </div>
                )}
                {(session.uvIndex !== undefined || session.seaState?.uvIndex !== undefined) && (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-[#b45309]/5 border border-[#b45309]/10 transition-all hover:bg-[#b45309]/10">
                    <span className="text-[#00426a]/40 text-[10px] font-black uppercase tracking-wider">אינדקס קרינה</span>
                    <div className="flex items-center gap-2">
                      <Sun size={16} className="text-[#0071a1]" />
                      <span className="text-xl font-black text-[#00426a]" dir="ltr">{session.uvIndex ?? session.seaState?.uvIndex} UV</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-black text-[#00426a] flex items-center gap-2">
              <Users size={20} className="text-[#0071a1]" />
              רשימת משתתפים
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participantList.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 floating-slab-deep !rounded-2xl !p-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#00426a]/10">
                    {member.avatar ? (
                      <img src={member.avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#00426a]/20">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-[#00426a]">{member.firstName} {member.lastName}</span>
                </div>
              ))}
              {participantList.length === 0 && (
                <p className="text-[#00426a]/30 font-bold italic col-span-full text-center py-4">אין רשימת משתתפים זמינה</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#00426a]/5 border-t border-[#00426a]/10 flex justify-center relative z-10">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-[#00426a] text-white rounded-2xl font-black text-lg hover:bg-[#0071a1] transition-all active:scale-95 shadow-lg shadow-[#00426a]/20"
          >
            סגור
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SessionDetails;
