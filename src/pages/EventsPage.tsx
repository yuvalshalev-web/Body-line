import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Clock, User, Users, X, Navigation, Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { Event } from '../types';
import { EventEditor } from '../components/admin/EventEditor';

const EventsPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { events, members, toggleEventAttendance, addEvent, updateEvent, deleteEvent, archiveEvent, siteAssets } = useData();
  const { currentUser } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const activeEvents = sortedEvents.filter(e => !e.isArchived);
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
    if (currentUser && (event.creatorId === currentUser.id || currentUser.role === 'Admin')) {
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
              {upcomingEvents.map(event => (
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
                    <p className="text-slate-800 mb-6 flex-1 text-sm leading-relaxed">{event.description}</p>
                    
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
              ))}
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
                {(currentUser?.id === selectedEvent.creatorId || currentUser?.role === 'Admin') && (
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
              <div className="flex items-center gap-2 text-slate-800">
                <Users size={20} className="text-slate-800" />
                {selectedEvent.attendees?.length || 0} משתתפים אישרו הגעה
              </div>
              <div className="text-sm text-slate-800 bg-slate-100 p-3 rounded-lg">
                <p className="font-bold mb-1">רשימת משתתפים:</p>
                {getAttendeeNames(selectedEvent.attendees || []).join(', ') || 'עדיין אין משתתפים'}
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
