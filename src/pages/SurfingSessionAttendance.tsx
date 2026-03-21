import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock,
  History,
  AlertCircle,
  X,
  Search,
  CheckCircle2,
  Sparkles,
  Waves,
  Wind,
  Thermometer,
  Sun
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Member } from '../types';
import { formatDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { addDoc, collection } from 'firebase/firestore';
import { getDb } from '../services/firebase';

const SurfingSessionAttendance: React.FC = () => {
  const { 
    members, 
    weeklyHistory, 
    attendeeIds, 
    activeSessionDate, 
    toggleSessionAttendance,
    updateHistory,
    isLoading,
    coastalWeather,
    siteConfig,
    seaStats
  } = useData();
  
  const headerImage = useRandomHeader();
  const [selectedSession, setSelectedSession] = useState<{ id: string | 'active', date: any, participantIds: string[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  // Sort history by date descending
  const sortedHistory = useMemo(() => {
    return [...weeklyHistory].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [weeklyHistory]);

  const activeMembers = useMemo(() => members.filter(m => m.isActive !== false), [members]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return activeMembers;
    return activeMembers.filter(m => 
      (m.firstName + ' ' + m.lastName).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeMembers, searchTerm]);

  const handleToggleAttendance = async (userId: string) => {
    if (!selectedSession) return;

    if (selectedSession.id === 'active') {
      await toggleSessionAttendance(userId);
      // Update local state for immediate feedback in modal
      setSelectedSession(prev => {
        if (!prev) return null;
        const isAttending = prev.participantIds.includes(userId);
        const newIds = isAttending 
          ? prev.participantIds.filter(id => id !== userId)
          : [...prev.participantIds, userId];
        return { ...prev, participantIds: newIds };
      });
    } else if (selectedSession.id === 'new') {
      // Update local state for new session
      setSelectedSession(prev => {
        if (!prev) return null;
        const isAttending = prev.participantIds.includes(userId);
        const newIds = isAttending 
          ? prev.participantIds.filter(id => id !== userId)
          : [...prev.participantIds, userId];
        return { ...prev, participantIds: newIds };
      });
    } else {
      const currentParticipants = selectedSession.participantIds || [];
      const isAttending = currentParticipants.includes(userId);
      const newParticipants = isAttending
        ? currentParticipants.filter((id: string) => id !== userId)
        : [...currentParticipants, userId];
      
      await updateHistory(selectedSession.id, newParticipants);
      // Update local state
      setSelectedSession(prev => prev ? { ...prev, participantIds: newParticipants } : null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] relative overflow-hidden font-['Yehuda_CLM'] pb-20" dir="rtl">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
      
      {/* Subtle Aqua Mist Gradient Hints */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#B2EBF2] blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#B2EBF2] blur-[150px] rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Unified Header */}
      <div className="surfboard-hero-container mb-6 space-y-2 header-wallpaper !py-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#0071a1]/10 text-[#0071a1] mb-2 shadow-sm border border-[#0071a1]/20 relative z-10">
            <History size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title text-[#00426a]">צוללים לסשנים</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto text-[#00426a] font-black">
            תיעוד וניהול נוכחות של סשני הקהילה 🌊
          </p>
          
          <div className="mt-8">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedSession({ id: 'new', date: new Date().toISOString(), participantIds: [] });
                setDateError(null);
              }}
              className="px-8 py-4 bg-[#00426a] text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(0,66,106,0.3)] hover:bg-[#003354] transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <Sparkles size={20} />
              <span>הוסף סשן ידנית</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Vertical Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute right-10 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#00426a] via-[#00426a]/40 to-transparent rounded-full opacity-10" />

          <div className="space-y-16 relative">
            {/* Upcoming Session (Top of Timeline) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative pr-24"
            >
              {/* Timeline Dot */}
              <div className="absolute right-[28px] top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#00426a] border-4 border-[#f5f5f0] shadow-[0_0_30px_rgba(0,66,106,0.4)] flex items-center justify-center z-20">
                <Clock className="text-white" size={28} />
              </div>

              <div 
                onClick={() => setSelectedSession({ id: 'active', date: activeSessionDate, participantIds: attendeeIds })}
                className="group cursor-pointer bg-[#f0f8ff1a] backdrop-blur-xl border-t border-l border-white/80 border-b border-r border-[#00426a33] rounded-[40px] p-10 shadow-[0_30px_60px_rgba(0,66,106,0.15)] hover:shadow-[0_40px_80px_rgba(0,66,106,0.25)] transition-all duration-700 hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="relative z-10">
                    <span className="inline-block px-5 py-1.5 rounded-full bg-[#3dbbd3] text-[#00426a] text-xs font-black tracking-[0.2em] uppercase mb-4 shadow-lg shadow-[#3dbbd3]/20">הסשן הקרוב</span>
                    <h3 className="text-4xl font-black text-[#00426a] mb-3 tracking-tight">{formatDate(activeSessionDate)}</h3>
                    <div className="flex flex-col gap-2 text-[#00426a] font-black">
                      <div className="flex items-center gap-2.5">
                        <Users size={22} className="text-[#0071a1]" />
                        <span className="text-lg">{attendeeIds.length} חברים רשומים</span>
                      </div>
                      <div className="text-sm opacity-70 flex flex-col gap-0.5">
                        <div>
                          מדריכים: {(() => {
                            const instructors = attendeeIds
                              .map(id => members.find((m: any) => m.id === id))
                              .filter((m: any): m is any => !!m && m.role === 'Instructor');
                            return instructors.length > 0 
                              ? instructors.map(m => `${m.firstName} ${m.lastName}`).join(', ')
                              : 'אין';
                          })()}
                        </div>
                        <div>
                          רכזים: {(() => {
                            const coordinators = attendeeIds
                              .map(id => members.find((m: any) => m.id === id))
                              .filter((m: any): m is any => !!m && m.role === 'Admin');
                            return coordinators.length > 0 
                              ? coordinators.map(m => `${m.firstName} ${m.lastName}`).join(', ')
                              : 'אין';
                          })()}
                        </div>
                      </div>

                      {/* Sea State Info */}
                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[#00426a]/10">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0071a1]/5 border border-[#0071a1]/10 transition-all hover:bg-[#0071a1]/10" title="גובה גלים">
                          <Waves size={14} className="text-[#0071a1]" />
                          <span className="text-xs font-black text-[#00426a]/70">גובה גלים:</span>
                          {(seaStats?.waveHeight !== undefined || siteConfig?.seaState?.waveHeight !== undefined) && (
                            <span className="text-xs font-black text-[#0071a1]" dir="ltr">{seaStats?.waveHeight ?? siteConfig?.seaState?.waveHeight}m</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0891b2]/5 border border-[#0891b2]/10 transition-all hover:bg-[#0891b2]/10" title="מהירות רוח">
                          <Wind size={14} className="text-[#0891b2]" />
                          <span className="text-xs font-black text-[#00426a]/70">מהירות רוח:</span>
                          {(seaStats?.windSpeed !== undefined || siteConfig?.seaState?.windSpeed !== undefined) && (
                            <span className="text-xs font-black text-[#0891b2]" dir="ltr">{seaStats?.windSpeed ?? siteConfig?.seaState?.windSpeed}kts</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#4338ca]/5 border border-[#4338ca]/10 transition-all hover:bg-[#4338ca]/10" title="טמפ׳ מים">
                          <Thermometer size={14} className="text-[#4338ca]" />
                          <span className="text-xs font-black text-[#00426a]/70">טמפ׳ מים:</span>
                          {(seaStats?.waterTemp !== undefined || siteConfig?.seaState?.waterTemp !== undefined) && (
                            <span className="text-xs font-black text-[#4338ca]" dir="ltr">{seaStats?.waterTemp ?? siteConfig?.seaState?.waterTemp}°C</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#b45309]/5 border border-[#b45309]/10 transition-all hover:bg-[#b45309]/10" title="אינדקס קרינה">
                          <Sun size={14} className="text-[#b45309]" />
                          <span className="text-xs font-black text-[#00426a]/70">אינדקס קרינה:</span>
                          {(seaStats?.uvIndex !== undefined || siteConfig?.seaState?.uvIndex !== undefined) && (
                            <span className="text-xs font-black text-[#b45309]" dir="ltr">{seaStats?.uvIndex ?? siteConfig?.seaState?.uvIndex} UV</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex -space-x-4 space-x-reverse relative z-10">
                    {attendeeIds.slice(0, 6).map(id => {
                      const m = members.find((mem: any) => mem.id === id);
                      return (
                        <div key={id} className="w-14 h-14 rounded-2xl border-4 border-white overflow-hidden shadow-xl bg-slate-100 transform hover:-translate-y-1 transition-transform duration-300">
                          {m?.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : <Users className="m-auto text-slate-300" />}
                        </div>
                      );
                    })}
                    {attendeeIds.length > 6 && (
                      <div className="w-14 h-14 rounded-2xl border-4 border-white bg-[#00426a] text-white flex items-center justify-center text-sm font-black shadow-xl">
                        +{attendeeIds.length - 6}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Historical Sessions */}
            {sortedHistory.map((session, index) => (
              <motion.div 
                key={session.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative pr-24"
              >
                {/* Timeline Dot */}
                <div className="absolute right-[34px] top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border-4 border-[#00426a]/10 shadow-sm flex items-center justify-center z-20 group-hover:border-[#00426a]/30 transition-all duration-500">
                  <CheckCircle2 className="text-[#00426a]/20 group-hover:text-[#00426a]/40" size={22} />
                </div>

                <div 
                  onClick={() => {
                    console.log('Selected Session:', session);
                    setSelectedSession({ id: session.id, date: session.date, participantIds: session.participantIds || [] });
                  }}
                  className="group cursor-pointer bg-[#f0f8ff1a] backdrop-blur-md border-t border-l border-white/80 border-b border-r border-[#00426a33] rounded-[32px] p-8 shadow-[0_15px_40px_rgba(0,66,106,0.08)] hover:shadow-[0_25px_50px_rgba(0,66,106,0.15)] transition-all duration-500 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                      <h4 className="text-2xl font-black text-[#00426a] mb-2">{formatDate(session.date)}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-[#00426a] font-bold">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-[#0071a1]" />
                          <span>{session.participantIds?.length || 0} משתתפים</span>
                        </div>
                        <span className="opacity-20 text-lg">|</span>
                        <div className="flex flex-col gap-0.5 text-[#00426a]/60 text-sm">
                          <div>
                            מדריכים: {(() => {
                              const instructors = (session.participantIds || [])
                                .map((id: string) => members.find((m: any) => m.id === id))
                                .filter((m: any): m is any => !!m && m.role === 'Instructor');
                              return instructors.length > 0 
                                ? instructors.map((m: any) => `${m.firstName} ${m.lastName}`).join(', ')
                                : 'אין';
                            })()}
                          </div>
                          <div>
                            רכזים: {(() => {
                              const coordinators = (session.participantIds || [])
                                .map((id: string) => members.find((m: any) => m.id === id))
                                .filter((m: any): m is any => !!m && m.role === 'Admin');
                              return coordinators.length > 0 
                                ? coordinators.map((m: any) => `${m.firstName} ${m.lastName}`).join(', ')
                                : 'אין';
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Sea State Info */}
                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[#00426a]/10">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0071a1]/5 border border-[#0071a1]/10 transition-all hover:bg-[#0071a1]/10" title="גובה גלים">
                          <Waves size={14} className="text-[#0071a1]" />
                          <span className="text-xs font-black text-[#00426a]/70">גובה גלים:</span>
                          {(session.waveHeight !== undefined || session.seaState?.waveHeight !== undefined) && (
                            <span className="text-xs font-black text-[#0071a1]" dir="ltr">{session.waveHeight ?? session.seaState?.waveHeight}m</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0891b2]/5 border border-[#0891b2]/10 transition-all hover:bg-[#0891b2]/10" title="מהירות רוח">
                          <Wind size={14} className="text-[#0891b2]" />
                          <span className="text-xs font-black text-[#00426a]/70">מהירות רוח:</span>
                          {(session.windSpeed !== undefined || session.seaState?.windSpeed !== undefined) && (
                            <span className="text-xs font-black text-[#0891b2]" dir="ltr">{session.windSpeed ?? session.seaState?.windSpeed}kts</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#4338ca]/5 border border-[#4338ca]/10 transition-all hover:bg-[#4338ca]/10" title="טמפ׳ מים">
                          <Thermometer size={14} className="text-[#4338ca]" />
                          <span className="text-xs font-black text-[#00426a]/70">טמפ׳ מים:</span>
                          {(session.waterTemp !== undefined || session.seaState?.waterTemp !== undefined) && (
                            <span className="text-xs font-black text-[#4338ca]" dir="ltr">{session.waterTemp ?? session.seaState?.waterTemp}°C</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#b45309]/5 border border-[#b45309]/10 transition-all hover:bg-[#b45309]/10" title="אינדקס קרינה">
                          <Sun size={14} className="text-[#b45309]" />
                          <span className="text-xs font-black text-[#00426a]/70">אינדקס קרינה:</span>
                          {(session.uvIndex !== undefined || session.seaState?.uvIndex !== undefined) && (
                            <span className="text-xs font-black text-[#b45309]" dir="ltr">{session.uvIndex ?? session.seaState?.uvIndex} UV</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex -space-x-3 space-x-reverse">
                      {(session.participantIds || []).slice(0, 4).map((id: string) => {
                        const m = members.find(mem => mem.id === id);
                        return (
                          <div key={id} className="w-10 h-10 rounded-xl border-2 border-white overflow-hidden shadow-md bg-slate-100 transform hover:-translate-y-1 transition-transform duration-300">
                            {m?.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : <Users className="m-auto text-slate-300" size={16} />}
                          </div>
                        );
                      })}
                      {(session.participantIds || []).length > 4 && (
                        <div className="w-10 h-10 rounded-xl border-2 border-white bg-[#00426a] text-white flex items-center justify-center text-xs font-black shadow-md">
                          +{(session.participantIds || []).length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {sortedHistory.length === 0 && (
          <div className="text-center py-24 bg-[#f0f8ff1a] backdrop-blur-md rounded-[48px] border-2 border-dashed border-[#00426a]/10 mt-16 shadow-inner">
            <AlertCircle className="mx-auto text-[#00426a]/10 mb-6" size={80} />
            <p className="text-[#00426a]/40 font-black text-2xl">לא נמצאה היסטוריית סשנים</p>
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSession(null)}
              className="absolute inset-0 bg-[#134E4A]/60 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              className="relative w-full max-w-5xl bg-[#f5f5f0] rounded-[50px] shadow-[0_50px_100px_rgba(0,66,106,0.4)] overflow-hidden flex flex-col max-h-[90vh] border-t border-l border-white/80 border-b border-r border-[#00426a33]"
            >
              {/* Texture Overlay for Modal */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

              {/* Modal Header */}
              <div className="p-10 border-b border-[#00426a]/10 flex items-center justify-between bg-[#f0f8ff1a] backdrop-blur-2xl relative z-10">
                <div>
                  <h2 className="text-4xl font-black text-[#00426a] mb-2 tracking-tight">
                    {selectedSession.id === 'active' ? 'ניהול נוכחות סשן קרוב' : 
                     selectedSession.id === 'new' ? 'הקמת סשן היסטורי' : 
                     `ניהול נוכחות - ${formatDate(selectedSession.date)}`}
                  </h2>
                  {selectedSession.id === 'new' ? (
                    <div className="flex flex-col gap-2">
                      <input 
                        type="datetime-local"
                        className={`text-lg font-bold bg-transparent border-b-2 outline-none transition-colors ${dateError ? 'border-[#BC4749] text-[#BC4749]' : 'border-[#00426a]/20 text-[#00426a] focus:border-[#0071a1]'}`}
                        value={new Date(new Date(selectedSession.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          const tomorrow = new Date();
                          tomorrow.setHours(0,0,0,0);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          
                          if (selectedDate >= tomorrow) {
                            setDateError("תאריך של תיעוד היסטורי חייב להיות בעבר.");
                          } else {
                            setDateError(null);
                          }
                          setSelectedSession(prev => prev ? { ...prev, date: selectedDate.toISOString() } : null);
                        }}
                      />
                      {dateError && (
                        <motion.span 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[#BC4749] text-sm font-black"
                        >
                          {dateError}
                        </motion.span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1 rounded-full bg-[#00426a] text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-[#00426a]/20">
                        {selectedSession.participantIds.length} משתתפים
                      </span>
                      <span className="text-[#00426a]/40 font-black text-sm">•</span>
                      <span className="text-[#00426a]/60 font-black text-sm">לחץ על חבר לעדכון נוכחות</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setSelectedSession(null);
                    setDateError(null);
                  }}
                  className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-[#00426a] hover:bg-[#00426a] hover:text-white transition-all duration-500 transform hover:rotate-90"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-8 bg-[#f0f8ff1a] border-b border-[#00426a]/5 relative z-10">
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[#0071a1]" size={24} />
                  <input 
                    type="text"
                    placeholder="חיפוש חבר בקהילה..."
                    className="w-full pr-16 pl-8 py-5 bg-[#f0f8ff1a] backdrop-blur-md border-t border-l border-white/80 border-b border-r border-[#00426a33] rounded-[24px] focus:ring-8 focus:ring-[#00426a]/10 focus:border-[#0071a1]/20 outline-none font-black text-xl text-[#00426a] placeholder-[#00426a]/20 shadow-xl transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Members Grid */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                  {filteredMembers.map(member => {
                    const isAttending = selectedSession.participantIds.includes(member.id);
                    return (
                      <motion.button
                        key={member.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleAttendance(member.id)}
                        className={`flex flex-col items-center gap-4 p-5 rounded-[40px] transition-all duration-700 group relative ${
                          isAttending 
                            ? 'bg-[#f0f8ff1a] backdrop-blur-md shadow-[0_25px_50px_rgba(0,66,106,0.2)] border-t border-l border-white/80 border-b border-r border-[#00426a33]' 
                            : 'bg-transparent opacity-30 grayscale hover:opacity-100 hover:grayscale-0'
                        }`}
                      >
                        <div className={`w-24 h-24 rounded-[30px] overflow-hidden border-4 transition-all duration-700 relative ${
                          isAttending 
                            ? 'border-[#A2FF00] shadow-[0_0_30px_rgba(162,255,0,0.4)] scale-110' 
                            : 'border-white/40'
                        }`}>
                          {member.avatar ? (
                            <img src={member.avatar} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                              <Users size={40} />
                            </div>
                          )}
                        </div>

                        <div className="text-center space-y-0.5">
                          <span className={`block font-black text-base leading-tight transition-colors duration-500 ${
                            isAttending ? 'text-[#2D6A4F]' : 'text-[#00426a]/60'
                          }`}>
                            {member.firstName}
                          </span>
                          <span className={`block font-black text-sm opacity-60 transition-colors duration-500 ${
                            isAttending ? 'text-[#2D6A4F]' : 'text-[#00426a]/60'
                          }`}>
                            {member.lastName}
                          </span>
                        </div>

                        {isAttending && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#A2FF00] text-[#00426a] flex items-center justify-center shadow-xl border-2 border-white z-20"
                          >
                            <CheckCircle2 size={18} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-[#f0f8ff1a] backdrop-blur-2xl border-t border-[#00426a]/10 text-center relative z-10 flex justify-between items-center">
                <div className="flex items-center justify-center gap-2 text-[#00426a]/40 font-black text-sm uppercase tracking-[0.3em]">
                  <Sparkles size={16} className="text-[#0071a1]" />
                  <span>ניהול נוכחות חכם • Body-Line</span>
                  <Sparkles size={16} className="text-[#0071a1]" />
                </div>
                {selectedSession.id === 'new' && (
                  <button 
                    disabled={!!dateError}
                    onClick={async () => {
                      if (dateError) return;
                      // Logic to save new session
                      const db = getDb();
                      const status = selectedSession.participantIds.length > 0 ? 'בוצע' : 'לא בוצע';
                      await addDoc(collection(db, 'weekly_history'), {
                        date: new Date(selectedSession.date),
                        participantIds: selectedSession.participantIds,
                        participantsCount: selectedSession.participantIds.length,
                        status: status,
                        seaState: coastalWeather || null
                      });
                      setSelectedSession(null);
                      setDateError(null);
                    }}
                    className={`px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all duration-300 ${
                      dateError 
                        ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-[#00426a] text-white hover:bg-[#003354]'
                    }`}
                  >
                    שמור סשן
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 66, 106, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 66, 106, 0.2);
        }
      `}</style>
    </div>
  );
};

export default SurfingSessionAttendance;
