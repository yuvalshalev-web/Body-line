import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { Waves, Plus, X, MapPin, Clock, Users, MessageCircle } from 'lucide-react';
import { SurfCall } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { loadGoogleMaps } from '../utils/googlePlaces';

export const SurfCallsWidget: React.FC = () => {
  const { surfCalls, addSurfCall, toggleSurfCallAttendance, archiveSurfCall, siteConfig } = useData();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [loadingCalls, setLoadingCalls] = useState<Record<string, boolean>>({});
  const { addSurfCallComment } = useData();
  const [googleReady, setGoogleReady] = useState(false);
  const customBeachRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<any>(null);

  const [newCall, setNewCall] = useState({
    beach: '',
    customBeach: '',
    day: 'today',
    time: '06:00',
    text: ''
  });

  const BEACHES = [
    'אכדיה',
    'מרינה צפון',
    'זבולון',
    'מרינה דרום',
    'הילטון',
    'הדולפינריום',
    'החוף המערבי',
    'הגולשים (רשל"צ)',
    'פלמחים',
    'סירונית',
    'חוף נעורים',
    'בית ינאי',
    'אחר'
  ];

  // Auto-archive calls that are older than 3 hours past their target time
  useEffect(() => {
    const checkArchiving = () => {
      surfCalls.filter(c => !c.isArchived).forEach(call => {
        const targetDateTime = new Date(`${call.targetDate}T${call.targetTime}`);
        const threeHoursMs = 3 * 60 * 60 * 1000;
        if (new Date().getTime() - targetDateTime.getTime() > threeHoursMs) {
          archiveSurfCall(call.id);
        }
      });
    };
    const interval = setInterval(checkArchiving, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [surfCalls, archiveSurfCall]);

  useEffect(() => {
    if (isCreating) {
      loadGoogleMaps()
        .then(() => setGoogleReady(true))
        .catch(err => console.warn('Failed to load Google Maps:', err));
    }
  }, [isCreating]);

  useEffect(() => {
    if (!googleReady || !customBeachRef.current || autocompleteRef.current || newCall.beach !== 'אחר') return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(customBeachRef.current, {
        componentRestrictions: { country: 'il' },
        fields: ['formatted_address', 'name', 'geometry'],
        types: ['establishment', 'geocode']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address || place.name) {
          setNewCall(prev => ({ ...prev, customBeach: place.name || place.formatted_address }));
        }
      });
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
    }

    return () => {
      if (window.google && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [googleReady, newCall.beach === 'אחר']);

  const activeCalls = surfCalls.filter(c => {
    if (c.isArchived) return false;
    const targetDateTime = new Date(`${c.targetDate}T${c.targetTime}`);
    // If it's already past the 3-hour mark, hide it locally even if not archived in DB yet
    if (new Date().getTime() - targetDateTime.getTime() > 3 * 60 * 60 * 1000) return false;
    return true;
  }).sort((a, b) => new Date(`${a.targetDate}T${a.targetTime}`).getTime() - new Date(`${b.targetDate}T${b.targetTime}`).getTime());

  const handleCreate = async () => {
    if (!currentUser) return;
    const targetDate = new Date();
    if (newCall.day === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (newCall.day === 'dayAfterTomorrow') {
      targetDate.setDate(targetDate.getDate() + 2);
    }
    const dateString = targetDate.toISOString().split('T')[0];
    
    const finalBeach = newCall.beach === 'אחר' ? newCall.customBeach : newCall.beach;

    await addSurfCall({
      creatorId: currentUser.id,
      creatorName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt: new Date().toISOString(),
      targetBeach: finalBeach,
      targetDate: dateString,
      targetTime: newCall.time,
      text: newCall.text,
      participantsJoined: [{ id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, avatar: currentUser.avatar }],
      participantsCancelled: []
    });

    setIsCreating(false);
    setNewCall({ beach: '', customBeach: '', day: 'today', time: '06:00', text: '' });
  };

  const hasActiveCallByUser = activeCalls.some(c => c.creatorId === currentUser?.id);

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Action Button */}
      <motion.div 
        drag 
        dragConstraints={{ left: 0, right: typeof window !== "undefined" ? window.innerWidth - 80 : 0, top: typeof window !== "undefined" ? -(window.innerHeight - 80) : 0, bottom: 0 }} 
        dragMomentum={false} 
        className="fixed bottom-24 left-6 z-50 cursor-grab active:cursor-grabbing"
        animate={{ 
          y: [0, -8, 0],
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#00AFC2]/80 to-[#004266]/80 backdrop-blur-3xl border border-white/30 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative group overflow-visible"
        >
          {/* Clipped Background Layer for Effects */}
          <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
            {/* Animated Wave Pulses */}
            <motion.div 
              className="absolute inset-0 bg-cyan-400/20 rounded-full"
              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute inset-0 bg-emerald-400/10 rounded-full"
              animate={{ scale: [1, 2.2], opacity: [0.3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />
            
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 blur-xl opacity-0 group-hover:opacity-100 transition duration-700" />
          </div>

          <div className="relative flex flex-col items-center">
            <span className="text-2xl group-hover:animate-bounce transform transition-transform duration-500" style={{ lineHeight: 1 }}>🏄‍♂️</span>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] mt-1 text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">LIVE</span>
          </div>

          <AnimatePresence>
            {activeCalls.length > 0 && (
              <motion.span 
                key="surf-calls-counter"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-rose-500 to-red-600 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-[0_8px_20px_rgba(244,63,94,0.4)] z-[100] pointer-events-none"
              >
                {activeCalls.length}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>

      {/* Bottom Sheet / Widget */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm sm:items-center sm:justify-center p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-sky-50 to-blue-50 border-b border-sky-100 flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-black text-sky-900 flex items-center gap-2">
                <span className="text-xl" style={{ lineHeight: 1 }}>🏄‍♂️</span>
                מי בא לגלוש?
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 text-sky-400 hover:text-sky-600 bg-white rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!isCreating ? (
                <>
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={() => setIsCreating(true)}
                      disabled={hasActiveCallByUser}
                      className="px-6 py-3 bg-sky-500 text-white rounded-full font-bold shadow-md hover:bg-sky-600 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={20} />
                      {hasActiveCallByUser ? 'כבר פתחת קריאה' : 'יצירת קריאה חדשה'}
                    </button>
                  </div>

                  {activeCalls.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <span className="text-5xl mx-auto mb-4 opacity-20 block" style={{ lineHeight: 1 }}>🏄‍♂️</span>
                      <p className="font-bold">אין קריאות פעילות כרגע.</p>
                      <p className="text-sm">תהיו הראשונים להרים את הדגל!</p>
                    </div>
                  ) : (
                    activeCalls.map(call => {
                      const targetDateTime = new Date(`${call.targetDate}T${call.targetTime}`);
                      const isPastDeadline = new Date() >= targetDateTime;
                      const isAttending = call.participantsJoined.some((p: any) => p.id === currentUser.id);

                      return (
                        <div key={call.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                                <MapPin size={18} className="text-sky-500" />
                                {call.targetBeach}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mt-1">
                                <Clock size={16} />
                                {call.targetDate === new Date().toISOString().split('T')[0] ? 'היום' : 'מחר'}, {call.targetTime}
                              </div>
                            </div>
                            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                              מאת: {call.creatorName}
                            </div>
                          </div>

                          {call.text && (
                            <p className="text-slate-700 bg-slate-50 p-3 rounded-xl text-sm border border-slate-100">
                              "{call.text}"
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2 space-x-reverse">
                                {call.participantsJoined.slice(0, 3).map((p: any, i: number) => (
                                  <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden" style={{ zIndex: 10 - i }}>
                                    {p.avatar ? (
                                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-200">
                                        {p.name.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <span className="text-sm font-bold text-slate-500">
                                {call.participantsJoined.length} באים
                              </span>
                            </div>

                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (loadingCalls[call.id]) return;
                                
                                setLoadingCalls(prev => ({ ...prev, [call.id]: true }));
                                try {
                                  await toggleSurfCallAttendance(call.id, currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, currentUser.avatar);
                                } catch (err) {
                                  // Error is already alerted to the user in DataContext
                                } finally {
                                  setLoadingCalls(prev => ({ ...prev, [call.id]: false }));
                                }
                              }}
                              disabled={(isPastDeadline && !isAttending) || loadingCalls[call.id]}
                              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 ${
                                ((isPastDeadline && !isAttending) || loadingCalls[call.id])
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : isAttending
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-sky-500 text-white hover:bg-sky-600'
                              }`}
                            >
                              {loadingCalls[call.id] ? (
                                <span className="flex items-center gap-1">
                                  <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
                                  מעדכן...
                                </span>
                              ) : isAttending ? (
                                'בטל הגעה'
                              ) : isPastDeadline ? (
                                'נסגר'
                              ) : (
                                'גם אני בא! 🏄‍♂️'
                              )}
                            </button>
                          
                          </div>
                          {/* Comments Section */}
                          <div className="pt-4 border-t border-slate-100">
                            <div className="space-y-3 mb-3 max-h-32 overflow-y-auto pr-2">
                              {(call.comments || []).map((comment: any) => (
                                <div key={comment.id} className="flex gap-2">
                                  {comment.avatar ? (
                                    <img src={comment.avatar} alt={comment.userName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold shrink-0">
                                      {comment.userName.charAt(0)}
                                    </div>
                                  )}
                                  <div className="bg-slate-50 rounded-xl rounded-tr-none px-3 py-2 text-sm">
                                    <span className="font-bold text-xs text-sky-600 block mb-0.5">{comment.userName}</span>
                                    <span className="text-slate-700">{comment.text}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {!isPastDeadline && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="כתוב תגובה..."
                                  value={commentTexts[call.id] || ''}
                                  onChange={e => setCommentTexts({ ...commentTexts, [call.id]: e.target.value })}
                                  onKeyDown={async e => {
                                    if (e.key === 'Enter' && commentTexts[call.id]?.trim()) {
                                      await addSurfCallComment(call.id, currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, currentUser.avatar, commentTexts[call.id].trim());
                                      setCommentTexts({ ...commentTexts, [call.id]: '' });
                                    }
                                  }}
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-sky-500"
                                />
                                <button
                                  onClick={async () => {
                                    if (commentTexts[call.id]?.trim()) {
                                      await addSurfCallComment(call.id, currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, currentUser.avatar, commentTexts[call.id].trim());
                                      setCommentTexts({ ...commentTexts, [call.id]: '' });
                                    }
                                  }}
                                  disabled={!commentTexts[call.id]?.trim()}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-500 text-white disabled:opacity-50"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-lg text-slate-800">יצירת קריאה לים</h3>
                    <button onClick={() => setIsCreating(false)} className="text-sm text-slate-400 hover:text-slate-600">חזור</button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">לאן?</label>
                    <select
                      value={newCall.beach}
                      onChange={e => setNewCall({ ...newCall, beach: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-sky-500"
                    >
                      <option value="" disabled>בחר חוף...</option>
                      {BEACHES.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {newCall.beach === 'אחר' && (
                      <input
                        ref={customBeachRef}
                        type="text"
                        placeholder="איזה חוף?"
                        value={newCall.customBeach}
                        onChange={e => setNewCall({ ...newCall, customBeach: e.target.value })}
                        className="w-full p-3 mt-2 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-sky-500"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">מתי?</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewCall({ ...newCall, day: 'today' })}
                          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${newCall.day === 'today' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                          היום
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCall({ ...newCall, day: 'tomorrow' })}
                          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${newCall.day === 'tomorrow' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                          מחר
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCall({ ...newCall, day: 'dayAfterTomorrow' })}
                          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${newCall.day === 'dayAfterTomorrow' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                          מחרתיים
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">שעה</label>
                      <input
                        type="time"
                        value={newCall.time}
                        onChange={e => setNewCall({ ...newCall, time: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">משהו להוסיף? (אופציונלי)</label>
                    <input
                      type="text"
                      maxLength={100}
                      placeholder="למשל: מביא קפה, מי בא?"
                      value={newCall.text}
                      onChange={e => setNewCall({ ...newCall, text: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={!newCall.beach || (newCall.beach === 'אחר' && !newCall.customBeach) || !newCall.time}
                    className="w-full py-4 mt-4 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-black text-lg hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50"
                  >
                    שלח לקהילה! 🏄‍♂️
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
