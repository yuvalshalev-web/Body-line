import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  Plus, 
  X, 
  Trash2, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const EventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { events, addEvent, deleteEvent, toggleEventAttendance } = useData();

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

  const isAdmin = currentUser?.role === 'Admin';

  const formatDate = (dateValue: string) => {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    return d.toLocaleDateString('he-IL');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;
    setIsSaving(true);
    try {
      await addEvent({
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
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setDate(''); setTime(''); setLocation(''); setImageUrl('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('האם למחוק אירוע זה?')) deleteEvent(id);
  };

  const handleToggleAttendance = async (eventId: string) => {
    if (!currentUser) return;
    setProcessingId(eventId);
    try { await toggleEventAttendance(eventId, currentUser.id); } finally { setProcessingId(null); }
  };

  return (
    <div className="min-h-screen bg-white text-right animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-slate-900">אירועים קרובים</h2>
          <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest">מפגשים וחוויות קהילתיות • {events.length} אירועים</p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-md hover:bg-rose-600 transition-all shadow-xl active:scale-95 group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            <span>הוספת אירוע</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => {
          const isAttending = currentUser ? (event.attendees || []).includes(currentUser.id) : false;
          const isProcessing = processingId === event.id;

          return (
            <div key={event.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col relative">
              {isAdmin && (
                <button onClick={() => handleDelete(event.id)} className="absolute top-6 left-6 p-3 bg-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl"><Trash2 size={18} /></button>
              )}
              <div className="relative aspect-video overflow-hidden">
                <img src={event.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                <div className="absolute top-6 right-6 bg-white/95 px-3 py-1.5 rounded-xl text-center shadow-lg"><p className="text-sm font-black text-slate-950">{formatDate(event.date)}</p></div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-rose-600 transition-colors">{event.title}</h3>
                <p className="text-slate-500 font-bold text-sm mb-8 line-clamp-3">{event.description}</p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-600"><Clock size={16} className="text-rose-500" /><span className="text-xs font-black">{event.time}</span></div>
                  <div className="flex items-center gap-3 text-slate-600"><MapPin size={16} className="text-rose-500" /><span className="text-xs font-black">{event.location}</span></div>
                  <div className="flex items-center gap-3 text-slate-600"><Users size={16} className="text-rose-500" /><span className="text-xs font-black">{(event.attendees || []).length} משתתפים</span></div>
                </div>
                <button 
                  onClick={() => handleToggleAttendance(event.id)}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${isAttending ? 'bg-rose-600 text-white' : 'bg-slate-950 text-white hover:bg-rose-600'}`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : isAttending ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
                  {isAttending ? 'מבטל הגעה' : 'אני מגיע/ה'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
             <button onClick={() => setShowModal(false)} className="absolute top-8 left-8 p-3 text-slate-400 bg-slate-50 rounded-full"><X size={24} /></button>
             <h3 className="text-3xl font-black mb-8">יצירת אירוע</h3>
             <form onSubmit={handleSubmit} className="space-y-6">
               <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת האירוע" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
               <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תיאור האירוע" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100 h-32 resize-none" />
               <div className="grid grid-cols-2 gap-4">
                 <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
                 <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
               </div>
               <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="מיקום (למשל: חוף זבולון)" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
               <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="כתובת תמונת רקע (URL)" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
               <button type="submit" disabled={isSaving} className="w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-rose-600 transition-all shadow-xl flex items-center justify-center gap-4">
                  {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                  צור אירוע חדש
               </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;