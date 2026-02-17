import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  Sparkles, 
  ExternalLink, 
  Plus, 
  X, 
  Trash2, 
  Image as ImageIcon, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Event, Member } from '../types';

interface EventsPageProps {
  events: Event[];
  currentUser: Member;
  onAddEvent: (details: Omit<Event, 'id'>) => Promise<any>;
  onDeleteEvent: (id: string) => Promise<void>;
  onToggleAttendance: (eventId: string) => Promise<void>;
}

const EventsPage: React.FC<EventsPageProps> = ({ events, currentUser, onAddEvent, onDeleteEvent, onToggleAttendance }) => {
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const isAdmin = currentUser.role === 'Admin';

  const getMapsUrl = (location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;
    
    setIsSaving(true);
    try {
      await onAddEvent({
        title,
        description,
        date,
        time,
        location: location || 'הרצליה',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
        attendees: []
      });
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setImageUrl('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('האם למחוק אירוע זה?')) {
      onDeleteEvent(id);
    }
  };

  const handleToggleAttendance = async (eventId: string) => {
    setProcessingId(eventId);
    try {
      await onToggleAttendance(eventId);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-50/50 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-amber-50/40 rounded-full blur-[100px] -ml-24"></div>
      </div>

      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-rose-100 shadow-sm">
              <Sparkles size={12} className="text-rose-500" />
              אירועים וחוויות
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">הצטרפו לפעילות</h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">כל המפגשים, הסדנאות והאירועים הקהילתיים במקום אחד.</p>
          </div>

          {isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-md hover:bg-rose-600 transition-all shadow-2xl active:scale-95 group"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform" />
              <span>הוספת אירוע</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {events.map((event) => {
            const isAttending = (event.attendees || []).includes(currentUser.id);
            const isProcessing = processingId === event.id;

            return (
              <div 
                key={event.id} 
                className={`group bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-rose-100/50 transition-all duration-500 flex flex-col xl:flex-row hover:-translate-y-2 relative ${isAttending ? 'ring-2 ring-rose-500/20' : ''}`}
              >
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(event.id)}
                    className="absolute top-6 left-6 p-3 bg-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110 active:scale-90 shadow-xl"
                    title="מחק אירוע"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isAttending ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Users size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">{(event.attendees || []).length} חברים כבר רשומים</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleToggleAttendance(event.id)}
                    disabled={isProcessing}
                    className={`relative overflow-hidden w-full py-5 rounded-[2rem] font-black text-md flex items-center justify-center gap-3 group/btn active:scale-95 shadow-2xl transition-all ${isAttending ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-950 text-white hover:bg-rose-600'}`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    {isProcessing ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : isAttending ? (
                      <>
                        <CheckCircle2 size={20} />
                        <span>ביטול הגעה</span>
                      </>
                    ) : (
                      <>
                        <span>אני מגיע/ה</span>
                        <ArrowRight size={20} className="group-hover/btn:-translate-x-2 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {events.length === 0 && (
            <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200">
                <Calendar size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">אין אירועים באופק</h3>
              <p className="text-slate-400 mt-2 font-medium text-lg">אנחנו מתכננים דברים מעניינים. חזרו בקרוב לעדכונים.</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl p-12 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-8 left-8 p-3 text-slate-400 hover:text-slate-950 transition-colors bg-slate-50 rounded-full"
            >
              <X size={24} />
            </button>

            <h3 className="text-3xl font-black text-slate-950 mb-10 tracking-tight">יצירת אירוע חדש</h3>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">כותרת האירוע</label>
                <input 
                  type="text" 
                  required 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="למשל: סדנת גלישת בוקר"
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-rose-400 shadow-inner" 
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">תאריך (לוח שנה)</label>
                  <input 
                    type="date" 
                    required 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-rose-400 shadow-inner" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">שעה (שעון)</label>
                  <input 
                    type="time" 
                    required 
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-rose-400 shadow-inner" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">מיקום</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="למשל: חוף המרינה, הרצליה"
                  className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-rose-400 shadow-inner" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">תיאור האירוע (קופסת טקסט)</label>
                <textarea 
                  required 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="ספר לחברים על האירוע..."
                  className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-rose-400 shadow-inner min-h-[140px] resize-none leading-relaxed" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">קישור לתמונה (URL)</label>
                <div className="relative">
                  <ImageIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="url" 
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="הדבק כאן קישור לתמונה"
                    className="w-full pr-16 pl-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-rose-400 shadow-inner" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-black text-2xl hover:bg-rose-600 transition-all shadow-2xl flex items-center justify-center gap-6 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={28} /> : <Calendar size={28} />}
                <span>{isSaving ? 'שומר אירוע...' : 'פרסום אירוע'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;