import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Clock, User, Users, X, Navigation } from 'lucide-react';
import { useRandomHeader } from '../hooks/useRandomHeader';
import { Event } from '../types';

const EventsPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { events, members, toggleEventAttendance } = useData();
  const { currentUser } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingEvents = sortedEvents.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));
  const pastEvents = sortedEvents.filter(e => new Date(e.date) < new Date(new Date().setHours(0,0,0,0))).reverse();

  const handleRSVP = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    await toggleEventAttendance(eventId, currentUser.id);
  };

  const openModal = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
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

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-0 space-y-2 header-wallpaper !py-12 pb-24" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
            <Calendar size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title">לוח אירועים</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto">
            כל האירועים, המפגשים והפעילויות של הקהילה שלנו במקום אחד.
          </p>
        </div>
      </div>

      <div className="relative z-30 -mt-16 mx-4 md:mx-0 space-y-12">
        {upcomingEvents.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-500" />
            אירועים קרובים
          </h2>
          <div className="grid gap-6">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openModal(event)}>
                <div className="flex-shrink-0 w-full md:w-48 h-48 md:h-auto rounded-xl overflow-hidden bg-slate-100">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Calendar size={48} />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <p className="text-slate-600 mb-4 flex-1">{event.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      {event.time && (
                        <div className="flex items-center gap-1">
                          <Clock size={16} className="text-slate-400" />
                          {event.time}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} className="text-slate-400" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    {currentUser && (
                      <button 
                        onClick={(e) => handleRSVP(e, event.id)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                          (event.attendees || []).includes(currentUser.id) 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
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
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedEvent.title}</h2>
            <p className="text-slate-600 mb-6">{selectedEvent.description}</p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar size={20} className="text-indigo-500" />
                {new Date(selectedEvent.date).toLocaleDateString('he-IL')} {selectedEvent.time}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin size={20} className="text-indigo-500" />
                {selectedEvent.location}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users size={20} className="text-indigo-500" />
                {selectedEvent.attendees?.length || 0} משתתפים אישרו הגעה
              </div>
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <p className="font-bold mb-1">רשימת משתתפים:</p>
                {getAttendeeNames(selectedEvent.attendees || []).join(', ') || 'עדיין אין משתתפים'}
              </div>
            </div>

            <div className="flex gap-4">
              <a href={`https://waze.com/ul?q=${encodeURIComponent(selectedEvent.location)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white py-3 rounded-xl font-bold hover:bg-sky-600">
                <Navigation size={20} /> Waze
              </a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.location)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 text-white py-3 rounded-xl font-bold hover:bg-indigo-600">
                <MapPin size={20} /> Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {pastEvents.length > 0 && (
        <div className="space-y-6 mt-12">
          <h2 className="text-2xl font-bold text-slate-800 opacity-60">אירועי עבר</h2>
          <div className="grid gap-4 opacity-70">
            {pastEvents.map(event => (
              <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Calendar size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-700 truncate">{event.title}</h3>
                  <p className="text-sm text-slate-500 truncate">{event.date ? new Date(event.date).toLocaleDateString('he-IL') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
          <Calendar className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-2xl font-bold text-slate-400">אין אירועים קרובים</h3>
          <p className="text-slate-500 mt-2">ברגע שיתווספו אירועים חדשים הם יופיעו כאן</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default EventsPage;
