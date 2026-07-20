import React, { useState, useMemo, useEffect } from 'react';
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
  Sun,
  Cloud,
  Loader2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Member } from '../types';
import { formatDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { addDoc, collection } from 'firebase/firestore';
import { getDb } from '../services/firebase';
import ImportSessionsModal from '../components/admin/ImportSessionsModal';

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
    siteConfig
  } = useData();
  const { currentUser } = useAuth();
  
  const headerImage = useRandomHeader();
  const [selectedSession, setSelectedSession] = useState<{ id: string | 'active', date: any, participantIds: string[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [isImportSessionsModalOpen, setIsImportSessionsModalOpen] = useState(false);

  // Salesforce State
  const [sfToken, setSfToken] = useState<string | null>(null);
  const [sfInstanceUrl, setSfInstanceUrl] = useState<string | null>(null);
  const [sfSyncing, setSfSyncing] = useState(false);
  const [sfMessage, setSfMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [showSyncWarning, setShowSyncWarning] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('sf_token');
    const instanceUrl = params.get('instance_url');
    if (token && instanceUrl) {
      setSfToken(token);
      setSfInstanceUrl(instanceUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const isFuture = useMemo(() => {
    if (!selectedSession) return false;
    const sessionDate = selectedSession.date?.toDate ? selectedSession.date.toDate() : new Date(selectedSession.date);
    return sessionDate > new Date();
  }, [selectedSession]);

  const handleSalesforceSync = async () => {
    if (!selectedSession) return;

    if (isFuture) {
      setShowSyncWarning(true);
      return;
    }
    
    // TEMPORARY: Muted Salesforce requirement until integration is ready
    setSfSyncing(true);
    setSfMessage(null);
    
    setTimeout(() => {
      setSfMessage({ type: 'success', text: 'המידע סונכרן בהצלחה (סימולציה זמנית ללא Salesforce)!' });
      setSfSyncing(false);
      setTimeout(() => setSfMessage(null), 5000);
    }, 1500);

    /* --- REAL INTEGRATION MUTED ---
    if (!sfToken || !sfInstanceUrl) {
      window.location.href = '/api/salesforce/login';
      return;
    }

    setSfSyncing(true);
    setSfMessage(null);
    try {
      const attendees = selectedSession.participantIds.map(id => {
        const m = members.find(mem => mem.id === id);
        return { name: m ? `${m.firstName} ${m.lastName}` : 'Unknown', email: m?.email || '' };
      });

      const res = await fetch('/api/salesforce/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: sfToken,
          instanceUrl: sfInstanceUrl,
          sessionData: { date: selectedSession.date },
          attendees
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSfMessage({ type: 'success', text: 'המידע עודכן בהצלחה ב-Salesforce!' });
        setTimeout(() => setSfMessage(null), 5000);
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err: any) {
      setSfMessage({ type: 'error', text: `שגיאה בסנכרון: ${err.message}` });
    } finally {
      setSfSyncing(false);
    }
    */
  };

  // Sort history by date descending
  const sortedHistory = useMemo(() => {
    return [...weeklyHistory]
      .filter(session => !session.isEvent)
      .sort((a, b) => {
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
    <div className="min-h-screen luxury-bg relative overflow-hidden font-yehuda pb-20 pt-8" dir="rtl">
      
      {/* Unified Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <div className="luxury-card p-6 border border-white/40">
          <div className="surfboard-hero-container header-wallpaper !py-12 rounded-[3rem]" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
            <div className="header-content-wrapper relative z-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
                <History size={40} />
              </div>
              <h1 className="main-page-title">
                <span className="surfer-title text-[#121212]">צוללים לסשנים</span>
              </h1>
              <p className="header-subtitle max-w-2xl mx-auto font-black text-[#121212]">
                תיעוד וניהול נוכחות של סשני הקהילה 🌊
              </p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedSession({ id: 'new', date: new Date().toISOString(), participantIds: [] });
                    setDateError(null);
                  }}
                  className="px-8 py-4 bg-[#00426a] text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(0,66,106,0.3)] hover:bg-[#003354] transition-all duration-300 flex items-center gap-3"
                >
                  <Sparkles size={20} />
                  <span>הוסף סשן ידנית</span>
                </motion.button>
                
                {currentUser?.role === 'Admin' && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsImportSessionsModalOpen(true)}
                    className="px-8 py-4 bg-[#3dbbd3] text-white rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(61,187,211,0.3)] hover:bg-[#2ea0b8] transition-all duration-300 flex items-center gap-3"
                  >
                    <History size={20} />
                    <span>ייבוא סשנים</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Vertical Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute right-10 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#00426a] via-[#00426a]/40 to-transparent rounded-full opacity-5" />

          <div className="space-y-16 relative">
            {/* Upcoming Session (Top of Timeline) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative pr-24"
            >
              {/* Timeline Dot */}
              <div className="absolute right-[28px] top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#00426a] border-4 border-white shadow-[0_0_30px_rgba(0,66,106,0.4)] flex items-center justify-center z-20">
                <Clock className="text-white" size={28} />
              </div>

              <div 
                onClick={() => setSelectedSession({ id: 'active', date: activeSessionDate, participantIds: attendeeIds })}
                className="group cursor-pointer luxury-card p-10 hover:-translate-y-2 relative overflow-hidden transition-all duration-700"
              >
                <div className="grain-overlay" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                  <div>
                    <span className="inline-block px-5 py-1.5 rounded-full bg-sky-500/10 text-sky-600 text-[10px] font-black tracking-[0.2em] uppercase mb-4 shadow-sm border border-sky-500/20">הסשן הקרוב</span>
                    <h3 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">{formatDate(activeSessionDate)}</h3>
                    <div className="flex flex-col gap-2 text-slate-600 font-black">
                      <div className="flex items-center gap-2.5">
                        <Users size={22} className="text-sky-500" />
                        <span className="text-lg">{attendeeIds.length} נרשמו למפגש</span>
                      </div>
                      <div className="text-xs opacity-70 flex flex-col gap-0.5 font-bold">
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
                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/5 border border-sky-500/10 transition-all hover:bg-sky-500/10" title="גובה גלים">
                          <Waves size={14} className="text-sky-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Waves</span>
                          <span className="text-[11px] font-black text-sky-600" dir="ltr">TBC</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 transition-all hover:bg-indigo-500/10" title="מהירות רוח">
                          <Wind size={14} className="text-indigo-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Wind</span>
                          <span className="text-[11px] font-black text-indigo-600" dir="ltr">TBC</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 transition-all hover:bg-cyan-500/10" title="טמפ׳ מים">
                          <Thermometer size={14} className="text-cyan-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Sea</span>
                          <span className="text-[11px] font-black text-cyan-600" dir="ltr">TBC</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/10 transition-all hover:bg-amber-500/10" title="אינדקס קרינה">
                          <Sun size={14} className="text-amber-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">UV</span>
                          <span className="text-[11px] font-black text-amber-600" dir="ltr">TBC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex -space-x-4 space-x-reverse relative z-10">
                    {attendeeIds.slice(0, 6).map(id => {
                      const m = members.find((mem: any) => mem.id === id);
                      return (
                        <div key={id} className="w-14 h-14 rounded-2xl border-4 border-white overflow-hidden shadow-md bg-slate-100 transform hover:-translate-y-1 transition-transform duration-300 group-hover:shadow-xl">
                          {m?.avatar ? <img src={m.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Users className="m-auto text-slate-300" />}
                        </div>
                      );
                    })}
                    {attendeeIds.length > 6 && (
                      <div className="w-14 h-14 rounded-2xl border-4 border-white bg-slate-800 text-white flex items-center justify-center text-xs font-black shadow-md">
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
                <div className="absolute right-[34px] top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center z-20 transition-all duration-500">
                  <CheckCircle2 className="text-slate-200" size={22} />
                </div>

                <div 
                  onClick={() => {
                    setSelectedSession({ id: session.id, date: session.date, participantIds: session.participantIds || [] });
                  }}
                  className="group cursor-pointer luxury-card p-8 hover:-translate-y-1 relative overflow-hidden transition-all duration-500"
                >
                  <div className="grain-overlay" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 mb-2">
                        {session.isEvent ? `${session.title || 'אירוע קהילה'} - ${formatDate(session.date)}` : formatDate(session.date)}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-slate-500 font-bold">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-sky-500" />
                          <span>{session.participantIds?.length || 0} משתתפים</span>
                        </div>
                        <span className="opacity-20 text-lg">|</span>
                        <div className="flex flex-col gap-0.5 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                          <div>
                            מ: {(() => {
                              const instructors = (session.participantIds || [])
                                .map((id: string) => members.find((m: any) => m.id === id))
                                .filter((m: any): m is any => !!m && m.role === 'Instructor');
                              return instructors.length > 0 
                                ? instructors.map((m: any) => `${m.firstName} ${m.lastName}`).join(', ')
                                : 'אין';
                            })()}
                          </div>
                          <div>
                            ר: {(() => {
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
                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100" title="גובה גלים">
                          <Waves size={14} className="text-sky-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Waves</span>
                          {(session.waveHeight !== undefined || session.seaState?.waveHeight !== undefined) && (
                            <span className="text-[11px] font-black text-sky-600" dir="ltr">{session.waveHeight ?? session.seaState?.waveHeight}m</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100" title="מהירות רוח">
                          <Wind size={14} className="text-indigo-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Wind</span>
                          {(session.windSpeed !== undefined || session.seaState?.windSpeed !== undefined) && (
                            <span className="text-[11px] font-black text-indigo-600" dir="ltr">{session.windSpeed ?? session.seaState?.windSpeed}kts</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100" title="טמפ׳ מים">
                          <Thermometer size={14} className="text-cyan-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Sea</span>
                          {(session.waterTemp !== undefined || session.seaState?.waterTemp !== undefined) && (
                            <span className="text-[11px] font-black text-cyan-600" dir="ltr">{session.waterTemp ?? session.seaState?.waterTemp}°C</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100" title="אינדקס קרינה">
                          <Sun size={14} className="text-amber-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">UV</span>
                          {(session.uvIndex !== undefined || session.seaState?.uvIndex !== undefined) && (
                            <span className="text-[11px] font-black text-amber-600" dir="ltr">{session.uvIndex ?? session.seaState?.uvIndex} UV</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex -space-x-3 space-x-reverse">
                      {(session.participantIds || []).slice(0, 4).map((id: string) => {
                        const m = members.find(mem => mem.id === id);
                        return (
                          <div key={id} className="w-10 h-10 rounded-xl border-2 border-white overflow-hidden shadow-sm bg-slate-100 transform hover:-translate-y-1 transition-transform duration-300">
                            {m?.avatar ? <img src={m.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Users className="m-auto text-slate-300" size={16} />}
                          </div>
                        );
                      })}
                      {(session.participantIds || []).length > 4 && (
                        <div className="w-10 h-10 rounded-xl border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
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
          <div className="text-center py-24 luxury-card mt-16 shadow-inner">
            <div className="grain-overlay" />
            <AlertCircle className="mx-auto text-slate-300 mb-6" size={80} />
            <p className="text-slate-400 font-black text-2xl">לא נמצאה היסטוריית סשנים</p>
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              className="relative w-full max-w-5xl luxury-card overflow-hidden flex flex-col max-h-[90vh] !rounded-[2.5rem] !bg-white/95"
            >
              <div className="grain-overlay" />

              {/* Modal Header */}
              <div className="p-10 border-b border-slate-100 flex items-center justify-between relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
                    {selectedSession.id === 'active' ? 'ניהול נוכחות סשן קרוב' : 
                     selectedSession.id === 'new' ? 'הקמת סשן היסטורי' : 
                     `ניהול נוכחות - ${formatDate(selectedSession.date)}`}
                  </h2>
                  {selectedSession.id === 'new' ? (
                    <div className="flex flex-col gap-2">
                      <input 
                        type="datetime-local"
                        className={`text-lg font-bold bg-transparent border-b-2 outline-none transition-colors ${dateError ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-slate-800 focus:border-sky-500'}`}
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
                          className="text-rose-500 text-xs font-black"
                        >
                          {dateError}
                        </motion.span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 text-[10px] font-black tracking-widest uppercase border border-sky-500/20 shadow-sm">
                        {selectedSession.participantIds.length} משתתפים
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">לחץ על משתתף לעדכון נוכחות</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setSelectedSession(null);
                    setDateError(null);
                  }}
                  className="w-12 h-12 rounded-2xl bg-slate-50 shadow-sm flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-all duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 relative z-10">
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="text"
                    placeholder="חיפוש בקהילה..."
                    className="w-full pr-12 pl-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none font-bold text-lg text-slate-800 placeholder-slate-300 transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Members Grid */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {filteredMembers.map(member => {
                    const isAttending = selectedSession.participantIds.includes(member.id);
                    return (
                      <motion.button
                        key={member.id}
                        whileHover={{ y: -5, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleAttendance(member.id)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-500 group relative ${
                          isAttending 
                            ? 'bg-sky-50 border border-sky-100 shadow-xl shadow-sky-500/10' 
                            : 'bg-transparent opacity-40 grayscale-sm hover:opacity-100 hover:grayscale-0'
                        }`}
                      >
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
                            isAttending 
                              ? 'border-sky-500 ring-4 ring-sky-500/20' 
                              : 'border-slate-100'
                          }`}>
                            {member.avatar ? (
                              <img src={member.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                <Users size={24} />
                              </div>
                            )}
                          </div>
                          
                          {isAttending && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg border-2 border-white z-20"
                            >
                              <CheckCircle2 size={14} strokeWidth={3} />
                            </motion.div>
                          )}
                        </div>

                        <div className="text-center">
                          <span className={`block font-black text-xs uppercase tracking-tight truncate w-24 ${
                            isAttending ? 'text-sky-900' : 'text-slate-500'
                          }`}>
                            {member.firstName}
                          </span>
                          <span className={`block font-bold text-[10px] opacity-40 uppercase tracking-widest ${
                            isAttending ? 'text-sky-700' : 'text-slate-400'
                          }`}>
                            {member.lastName}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 relative z-10 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                  <Sparkles size={14} className="text-sky-400" />
                  <span>Smart Attendance System</span>
                </div>
                <div className="flex items-center gap-3">
                    {sfMessage && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg ${sfMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                      >
                        {sfMessage.text}
                      </motion.div>
                    )}
                    {selectedSession.id !== 'new' && (
                      <button
                        onClick={handleSalesforceSync}
                        disabled={sfSyncing}
                        className={`px-6 py-3 rounded-xl font-black text-sm uppercase shadow-md transition-all duration-300 flex items-center gap-2 ${
                          isFuture 
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-70 grayscale' 
                            : 'bg-[#00A1E0] text-white hover:bg-[#0089bf]'
                        }`}
                      >
                        {sfSyncing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>מסנכרן...</span>
                          </>
                        ) : (
                          <>
                            <Cloud size={16} />
                            <span>סנכרן עם Salesforce</span>
                          </>
                        )}
                      </button>
                    )}
                  {selectedSession.id === 'new' && (
                    <button 
                      disabled={!!dateError}
                      onClick={async () => {
                        if (dateError) return;
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
                      className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl transition-all duration-300 ${
                        dateError 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-900 text-white hover:bg-black'
                      }`}
                    >
                      Save Session
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Sync Warning Modal */}
        <AnimatePresence>
          {showSyncWarning && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSyncWarning(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md luxury-card p-10 text-center !bg-white/95 !rounded-[2.5rem] border-white"
              >
                <div className="grain-overlay" />
                <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-500/20">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4">סנכרון עתידי חסום</h3>
                <p className="text-slate-600 font-bold text-lg leading-relaxed mb-8">
                  אין אפשרות לסנכרן סשן עתידי לדאטה-בייס חיצוני. הסנכרון יתאפשר רק לאחר שמועד הסשן עבר והנוכחות תועדה סופית.
                </p>
                <button 
                  onClick={() => setShowSyncWarning(false)}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all duration-300"
                >
                  הבנתי, תודה
                </button>
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

      <ImportSessionsModal
        isOpen={isImportSessionsModalOpen}
        onClose={() => setIsImportSessionsModalOpen(false)}
      />
    </div>
  );
};

export default SurfingSessionAttendance;
