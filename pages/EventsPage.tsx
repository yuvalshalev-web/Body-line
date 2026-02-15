
import React from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, Sparkles, Map, ExternalLink } from 'lucide-react';
import { Event } from '../types';

interface EventsPageProps {
  events: Event[];
}

const EventsPage: React.FC<EventsPageProps> = ({ events }) => {
  const getMapsUrl = (location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-50/50 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-amber-50/40 rounded-full blur-[100px] -ml-24"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-rose-100 shadow-sm">
            <Sparkles size={12} className="text-rose-500" />
            אירועים וחוויות
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">הצטרפו לפעילות</h2>
          <p className="text-slate-500 mt-2 text-lg font-medium">כל המפגשים, הסדנאות והאירועים הקהילתיים במקום אחד.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="group bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-rose-100/50 transition-all duration-500 flex flex-col xl:flex-row hover:-translate-y-2"
            >
              {/* Event Image */}
              <div className="xl:w-2/5 relative h-72 xl:h-auto overflow-hidden">
                <img 
                  src={event.imageUrl} 
                  alt={event.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md rounded-3xl p-4 text-center min-w-[75px] shadow-2xl border border-white/50 animate-in zoom-in-95">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                    {new Date(event.date).toLocaleString('he-IL', { month: 'short' })}
                  </p>
                  <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none">
                    {new Date(event.date).getDate()}
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="flex-1 p-10 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-slate-900 mb-4 group-hover:text-rose-600 transition-colors tracking-tight leading-tight">
                    {event.title}
                  </h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8 opacity-80 italic">
                    {event.description}
                  </p>

                  <div className="grid grid-cols-1 gap-4 mb-10">
                    <div className="flex items-center gap-4 text-slate-600 group/item">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover/item:bg-rose-600 group-hover/item:text-white transition-all">
                        <Clock size={18} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider">{event.time}</span>
                    </div>
                    
                    <div className="flex items-center justify-between group/loc">
                      <div className="flex items-center gap-4 text-slate-600">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover/item:bg-amber-600 group-hover/item:text-white transition-all">
                          <MapPin size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">{event.location}</span>
                      </div>
                      <a 
                        href={getMapsUrl(event.location)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-950 hover:text-white text-slate-950 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em] border border-slate-100"
                      >
                        מפות
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Users size={18} />
                      </div>
                      {/* FIX: Use event.attendees.length instead of non-existent attendeesCount */}
                      <span className="text-xs font-black uppercase tracking-wider">{event.attendees.length} חברים כבר רשומים</span>
                    </div>
                  </div>
                </div>

                <button className="relative overflow-hidden w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black text-md flex items-center justify-center gap-3 group/btn active:scale-95 shadow-2xl shadow-slate-200 transition-all hover:bg-rose-600">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <span>אני מגיע/ה</span>
                  <ArrowRight size={20} className="group-hover/btn:-translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200">
                <Calendar size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">אין אירועים באופק</h3>
              <p className="text-slate-400 mt-2 font-medium text-lg">אנחנו מתכננים דברים מעניינים. חזרו בקרוב לעדכונים.</p>
              <button className="mt-10 px-10 py-4 bg-rose-50 text-rose-700 rounded-2xl font-black text-xs hover:bg-rose-100 transition-all">הצג היסטוריית אירועים</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
