import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Clock, User, Users, X, Navigation, Plus, Edit2, Trash2, Upload, UserCircle } from 'lucide-react';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { Event } from '../types';
import { EventEditor } from '../components/admin/EventEditor';
import { isAdminUser } from '../constants';

const EventsPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { events, members, toggleEventAttendance, addEvent, updateEvent, deleteEvent, archiveEvent, siteAssets } = useData();
  const { currentUser } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<Event | null>(null);

  
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const roleFilteredEvents = sortedEvents.filter(e => {
    if (isAdminUser(currentUser)) return true;
    if (e.type === 'COMMUNITY') return true;
    if (e.type === 'MEMBER' && currentUser?.role === 'Member') return true;
    if (e.type === 'VOLUNTEER' && currentUser?.role === 'Volunteer') return true;
    return false;
  });
  const activeEvents = roleFilteredEvents.filter(e => !e.isArchived);

  const upcomingEvents = activeEvents.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));
  const pastEvents = sortedEvents.filter(e => new Date(e.date) < new Date(new Date().setHours(0,0,0,0))).reverse();

  const handleRSVP = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    await toggleEventAttendance(eventId, currentUser.id);
  };

  const handleCreateEvent = () => {
    if (!currentUser) return;
    setEditingEvent({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      location: '',
      imageUrl: '',
      type: 'MEMBER',
      creatorId: currentUser.id,
      attendees: [currentUser.id]
    });
    setIsEditing(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEditing(true);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך לבטל ולמחוק את האירוע?')) {
      await deleteEvent(eventId);
      setIsModalOpen(false);
    }
  };

  const openModal = (event: Event) => {
    if (currentUser && (event.creatorId === currentUser.id || isAdminUser(currentUser))) {
      setEditingEvent(event);
      setIsEditing(true);
    } else {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(false);
  };

  const getAttendeeNames = (attendeeIds: string[]) => {
    return attendeeIds
      .map(id => members.find(m => m.id === id))
      .filter(m => m)
      .map(m => `${m!.firstName} ${m!.lastName}`);
  };

  const getCreatorName = (creatorId?: string) => {
    if (!creatorId) return null;
    const creator = members.find(m => m.id === creatorId);
    return creator ? `${creator.firstName} ${creator.lastName}` : null;
  };

  return (
    <div className="min-h-screen luxury-bg pb-20 overflow-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 relative z-10 px-4 md:px-0">
        {/* Body-line Standard Header Stack */}
        <div className="surfboard-hero-container mb-0 space-y-2 header-wallpaper !py-12 pb-24" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
          <div className="header-content-wrapper relative z-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
              <Calendar size={40} />
            </div>
            <h1 className="main-page-title">
              <span className="surfer-title text-[#121212]">לוח אירועים</span>
            </h1>
            <p className="header-subtitle max-w-2xl mx-auto text-[#121212]">
              כל האירועים, המפגשים והפעילויות של הקהילה שלנו במקום אחד.
            </p>
          </div>
        </div>

        <div className="relative z-40 -mt-24 mx-4 md:mx-0 space-y-12">
          {currentUser && (
            <div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={handleCreateEvent}
                className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-[var(--surfer-vibrant-cyan)] to-[var(--surfer-turquoise-teal)] text-white rounded-[2rem] font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(212,163,115,0.4)] border-4 border-white/80 backdrop-blur-md relative z-50"
              >
                <Plus size={28} strokeWidth={3} />
                יצירת אירוע חדש
              </button>
            </div>
          )}
          {upcomingEvents.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 pr-4">
              <Calendar className="text-slate-800" />
              אירועים קרובים
            </h2>
            <div className="grid gap-6">
              {upcomingEvents.map(event => {
                const eventAttendees = members.filter(m => (event.attendees || []).includes(m.id));
                return (
                  <div key={event.id} className="luxury-card p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group" onClick={() => openModal(event)}>
                    <div className="grain-overlay" />
                    <div className="premium-sweep-fx opacity-10" />
                    
                    <div className="flex-shrink-0 w-full md:w-48 h-48 md:h-auto rounded-2xl overflow-hidden bg-slate-100 shadow-inner relative z-10">
                      {event.imageUrl || siteAssets?.defaultEventImage ? (
                        <img src={event.imageUrl || siteAssets?.defaultEventImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Calendar size={48} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{event.title}</h3>
                          {getCreatorName(event.creatorId) && (
                            <span className="text-sm text-slate-800 font-medium flex items-center gap-1 mt-0.5">
                              <User size={14} />
                              מארגן האירוע: {getCreatorName(event.creatorId)}
                            </span>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-bold whitespace-nowrap shadow-sm">
                          {new Date(event.date).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      <p className="text-slate-800 mb-4 flex-1 text-sm leading-relaxed">{event.description}</p>
                      
                      {/* Confirmed Event Members Row */}
                      {eventAttendees.length > 0 && (
                        <div className="flex flex-col gap-3 mb-4 bg-sky-500/5 p-4 rounded-2xl border border-sky-500/10" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-[#00AFC2] animate-pulse" />
                            <p className="text-sm font-black text-[#002b44]">
                              {eventAttendees.length} כוכבים אישרו הגעה
                            </p>
                          </div>
                          
                          {/* Spaced, auto-wrapping thumbnails to show everyone who confirmed with magnifying glass hover & focus effect */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {eventAttendees.map(a => (
                              <div 
                                key={a.id} 
                                tabIndex={0}
                                className="relative group flex-shrink-0 transition-all duration-300 hover:scale-135 hover:z-50 hover:rotate-3 active:scale-125 focus:scale-135 focus:z-50 focus:rotate-3 focus:outline-none rounded-xl cursor-pointer select-none"
                              >
                                {a.avatar ? (
                                  <img 
                                    src={a.avatar} 
                                    className="w-10 h-10 rounded-xl border-2 border-white shadow-md object-cover transition-shadow duration-300 group-hover:shadow-[0_8px_20px_rgba(0,175,194,0.35)] group-focus:shadow-[0_8px_20px_rgba(0,175,194,0.35)] pointer-events-none select-none" 
                                    alt="" 
                                    loading="lazy" 
                                    draggable="false"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002b44] to-[#00426a] border-2 border-white flex items-center justify-center text-xs text-white font-black shadow-md transition-shadow duration-300 group-hover:shadow-[0_8px_20px_rgba(0,175,194,0.35)] group-focus:shadow-[0_8px_20px_rgba(0,175,194,0.35)] select-none pointer-events-none">
                                    {a.firstName.charAt(0)}
                                  </div>
                                )}
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1 bg-[#002b44]/95 backdrop-blur-sm text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-md border border-white/10">
                                  {a.firstName} {a.lastName}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/50">
                        <div className="flex flex-wrap gap-4 text-[11px] font-black uppercase tracking-widest text-slate-800">
                          {event.time && (
                            <div className="flex items-center gap-1">
                              <Clock size={16} className="text-slate-800" />
                              {event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 max-w-[200px]">
                                <MapPin size={16} className="text-slate-800" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {currentUser && (
                          <button 
                            onClick={(e) => handleRSVP(e, event.id)}
                            disabled={event.creatorId === currentUser.id}
                            className={`px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 ${
                              (event.attendees || []).includes(currentUser.id) 
                                ? (event.creatorId === currentUser.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white')
                                : 'bg-sky-600 text-white hover:bg-sky-700 hover:shadow-sky-200'
                            }`}
                            title={event.creatorId === currentUser.id ? 'מארגן האירוע אינו יכול לבטל הגעה' : ''}
                          >
                            {(event.attendees || []).includes(currentUser.id) ? 'ביטול הגעה' : 'אישור הגעה'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

      {/* Event Details Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 left-4 z-50 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-slate-800 hover:text-slate-900 transition-all">
              <X size={24} />
            </button>
            <div className="flex justify-between items-start mb-4 pl-12">
              <h2 className="text-2xl font-bold text-slate-800">{selectedEvent.title}</h2>
              <div className="flex flex-col items-end gap-2">
                {getCreatorName(selectedEvent.creatorId) && (
                  <span className="text-sm text-slate-800 font-medium bg-slate-100 px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <User size={14} />
                    מארגן האירוע: {getCreatorName(selectedEvent.creatorId)}
                  </span>
                )}
                {(currentUser?.id === selectedEvent.creatorId || isAdminUser(currentUser)) && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditEvent(selectedEvent)}
                      className="p-2 text-slate-800 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                      title="ערוך אירוע"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="p-2 text-slate-800 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="מחק אירוע"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-slate-800 mb-6">{selectedEvent.description}</p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-slate-800">
                <Calendar size={20} className="text-slate-800" />
                {new Date(selectedEvent.date).toLocaleDateString('he-IL')} {selectedEvent.time}
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <MapPin size={20} className="text-slate-800" />
                {selectedEvent.location}
              </div>
              
              <div className="flex items-center gap-2 text-slate-800 border-t border-slate-100 pt-4 mt-4">
                <Users size={20} className="text-[#007085]" />
                <span className="font-black text-slate-800">{selectedEvent.attendees?.length || 0} משתתפים אישרו הגעה</span>
              </div>
              
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                <p className="font-black text-xs text-[#007085] uppercase tracking-wider mb-3">רשימת משתתפים:</p>
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {members.filter(m => (selectedEvent.attendees || []).includes(m.id)).map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm border border-slate-100/50">
                        {a.avatar ? (
                          <img src={a.avatar} className="w-8 h-8 rounded-lg object-cover shadow-sm flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-xs text-slate-500 font-bold flex-shrink-0">
                            {a.firstName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-sm truncate">{a.firstName} {a.lastName}</p>
                        </div>
                        <span className="text-[10px] font-black bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md flex-shrink-0">
                          {a.role === 'Admin' ? 'רכז' : a.role === 'Instructor' ? 'מדריך' : a.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 font-medium">עדיין אין משתתפים באירוע זה</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <a href={`https://waze.com/ul?q=${encodeURIComponent(selectedEvent.location)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white py-3 rounded-xl font-bold hover:bg-sky-600">
                <Navigation size={20} /> Waze
              </a>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(selectedEvent.location)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 text-white py-3 rounded-xl font-bold hover:bg-indigo-600">
                <MapPin size={20} /> Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Full Attendees List Modal (Identical in logic & UI/UX to the Upcoming Sessions list modal) */}
      {selectedEventForAttendees && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in" 
          onClick={() => setSelectedEventForAttendees(null)}
        >
          <div 
            className="relative bg-gradient-to-br from-[#FCFCFC] via-[#FFFFFF] to-[#F0F7F9] border border-white/80 shadow-[0_40px_80px_-20px_rgba(0,43,68,0.2)] rounded-[2rem] w-full max-w-lg p-8 sm:p-10 animate-in zoom-in-95 overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Micro-grain texture */}
            <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-[#002b44] tracking-tight font-yehuda">נבחרת האירוע</h3>
                <div className="px-4 py-1.5 bg-[#007085]/10 text-[#007085] rounded-full text-sm font-black tracking-widest">
                  {selectedEventForAttendees.attendees?.length || 0} משתתפים
                </div>
              </div>
              <div className="space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
                {members.filter(m => (selectedEventForAttendees.attendees || []).includes(m.id)).map(a => (
                  <div key={a.id} className="flex items-center gap-5 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,43,68,0.12)] border border-white hover:shadow-[0_24px_50px_-16px_rgba(0,43,68,0.2)] hover:-translate-y-1 transition-all duration-300">
                    {a.avatar ? (
                      <img src={a.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-md border border-slate-100/50 flex-shrink-0" alt="" loading="lazy" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-white shadow-inner flex items-center justify-center text-slate-400 flex-shrink-0">
                        <UserCircle size={28} strokeWidth={1.5} />
                      </div>
                    )}
                    <div>
                      <p className="font-black text-[#002b44] text-lg">{a.firstName} {a.lastName}</p>
                      <p className="text-[10px] font-black text-[#007085] uppercase tracking-[0.2em] opacity-80">
                        {a.role === 'Admin' ? 'רכז' : a.role === 'Instructor' ? 'מדריך' : a.role === 'Volunteer' ? 'מתנדב' : 'משתתף'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setSelectedEventForAttendees(null)} 
                className="w-full mt-6 py-4 bg-[#002b44] text-white rounded-2xl shadow-[0_12px_24px_-8px_rgba(0,43,68,0.4)] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-[#003b5c] hover:shadow-[0_16px_32px_-8px_rgba(0,43,68,0.5)]"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Editor Modal */}
      {isEditing && editingEvent && (
        <EventEditor
          event={editingEvent}
          attendeeNames={editingEvent.attendees ? getAttendeeNames(editingEvent.attendees) : []}
          onArchive={handleDeleteEvent}
          onSave={async (data) => {
            const { id, ...details } = data;
            if (id) {
              await updateEvent(data);
            } else {
              await addEvent(details);
            }
            setIsEditing(false);
            setEditingEvent(null);
          }}
          onClose={() => {
            setIsEditing(false);
            setEditingEvent(null);
          }}
        />
      )}

      {pastEvents.length > 0 && (
        <div className="space-y-6 mt-12">
          <h2 className="text-2xl font-bold text-slate-800 opacity-60">אירועי עבר</h2>
          <div className="grid gap-4 opacity-70">
            {pastEvents.map(event => (
              <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <span className="text-4xl md:text-6xl font-black text-slate-800/10 transform -rotate-12 select-none tracking-widest">
                    הסתיים
                  </span>
                </div>
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative z-10">
                  {event.imageUrl || siteAssets?.defaultEventImage ? (
                    <img src={event.imageUrl || siteAssets?.defaultEventImage} alt={event.title} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-800">
                      <Calendar size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 truncate">{event.title}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-800 truncate">{event.date ? new Date(event.date).toLocaleDateString('he-IL') : ''}</p>
                    {getCreatorName(event.creatorId) && (
                      <span className="text-xs text-slate-800 font-medium flex items-center gap-1">
                        • מארגן האירוע: {getCreatorName(event.creatorId)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="luxury-card p-20 text-center">
          <Calendar className="mx-auto text-slate-800 mb-4" size={64} />
          <h3 className="text-2xl font-bold text-slate-800">אין אירועים קרובים</h3>
          <p className="text-slate-800 mt-2">ברגע שיתווספו אירועים חדשים הם יופיעו כאן</p>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
