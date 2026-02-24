import React, { useState, useRef } from 'react';
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
  CheckCircle2,
  ShieldAlert,
  User,
  Zap,
  Info,
  Pencil,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Event } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from '../services/firebase';
import { processImage } from '../utils/imageProcessor';

const EventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { events, members, addEvent, deleteEvent, updateEvent, toggleEventAttendance } = useData();

  const activeMemberIds = members.filter(m => m.isActive !== false).map(m => m.id);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [eventType, setEventType] = useState<'COMMUNITY' | 'MEMBER' | 'INSTRUCTOR' | null>(null);
  const [showTypeWarning, setShowTypeWarning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManageCommunityEvents = currentUser?.role === 'Admin' || currentUser?.role === 'Instructor' || currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.email === 'yuval@shalev.io';
  const canManageInstructorEvents = currentUser?.role === 'Admin' || currentUser?.role === 'Instructor' || currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.email === 'yuval@shalev.io';
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.email === 'yuval@shalev.io';

  const formatDate = (dateValue: string) => {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const processed = await processImage(file, 1200, 0.85);
      const storage = getStorageInstance();
      const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);
      
      await uploadBytes(storageRef, processed.blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setImageUrl(downloadUrl);
      alert('התמונה הועלתה בהצלחה');
    } catch (err) {
      console.error(err);
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType) {
      setShowTypeWarning(true);
      return;
    }
    if (!title || !date || !time) return;
    setIsSaving(true);
    try {
      if (editingEvent) {
        await updateEvent({
          ...editingEvent,
          title,
          description,
          date,
          time,
          location: location || 'הרצליה',
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
          type: eventType,
        });
      } else {
        await addEvent({
          title,
          description,
          date,
          time,
          location: location || 'הרצליה',
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
          type: eventType,
          creatorId: currentUser?.id,
          attendees: []
        });
      }
      setShowModal(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setDate(''); setTime(''); setLocation(''); setImageUrl(''); setEventType(null);
    setShowTypeWarning(false);
    setEditingEvent(null);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date);
    setTime(event.time);
    setLocation(event.location);
    setImageUrl(event.imageUrl);
    setEventType(event.type);
    setShowModal(true);
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

        {currentUser && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-4 px-10 py-5 bg-[#006994] text-white rounded-[2rem] font-black text-md hover:bg-[#4E8294] transition-all shadow-xl active:scale-95 group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform text-[#00FFFF]" />
            <span>הוספת אירוע</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => {
          const isAttending = currentUser ? (event.attendees || []).includes(currentUser.id) : false;
          const isProcessing = processingId === event.id;
          const canDelete = isAdmin || (currentUser && event.creatorId === currentUser.id);

          return (
            <div key={event.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col relative">
              <div className="absolute top-6 left-6 flex gap-2 z-20">
                {(currentUser && (event.creatorId === currentUser.id || currentUser.email === SUPER_ADMIN_EMAIL || currentUser.email === 'yuval@shalev.io')) && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(event)} 
                      title="עריכת אירוע"
                      className="p-3 bg-white text-[#006994] border border-slate-200 rounded-2xl shadow-xl hover:bg-slate-50 transition-all active:scale-90 flex items-center justify-center"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)} 
                      title="מחיקת אירוע"
                      className="p-3 bg-white text-red-500 border border-slate-200 rounded-2xl shadow-xl hover:bg-red-50 transition-all active:scale-90 flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="relative aspect-video overflow-hidden">
                <img src={event.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                  <div className="bg-white/95 px-4 py-2 rounded-xl text-center shadow-lg min-w-max">
                    <p className="text-sm font-black text-slate-950 whitespace-nowrap tabular-nums">{formatDate(event.date)}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md ${
                    event.type === 'COMMUNITY' ? 'bg-[#006994] text-white' : 
                    event.type === 'INSTRUCTOR' ? 'bg-amber-500 text-white' : 
                    'bg-white text-[#4E8294]'
                  }`}>
                    {event.type === 'COMMUNITY' ? 'אירוע קהילה' : event.type === 'INSTRUCTOR' ? 'אירוע מדריך' : 'אירוע של חבר'}
                  </div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-rose-600 transition-colors">{event.title}</h3>
                <p className="text-slate-500 font-bold text-sm mb-8 line-clamp-3">{event.description}</p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-600">
                    {event.type === 'COMMUNITY' ? <ShieldAlert size={16} className="text-[#006994]" /> : 
                     event.type === 'INSTRUCTOR' ? <Zap size={16} className="text-amber-500" /> : 
                     <User size={16} className="text-[#4E8294]" />}
                    <span className="text-xs font-black">
                      {event.type === 'COMMUNITY' ? 'אירוע קהילה רשמי' : 
                       event.type === 'INSTRUCTOR' ? 'אירוע מדריך' : 
                       'אירוע חברתי'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600"><Clock size={16} className="text-rose-500" /><span className="text-xs font-black">{event.time}</span></div>
                  <div className="flex items-center gap-3 text-slate-600"><MapPin size={16} className="text-rose-500" /><span className="text-xs font-black">{event.location}</span></div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Users size={16} className="text-rose-500" />
                    <span className="text-xs font-black">
                      {(event.attendees || []).filter(id => activeMemberIds.includes(id)).length} משתתפים
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleAttendance(event.id)}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${isAttending ? 'bg-rose-600 text-white' : 'bg-[#006994] text-white hover:bg-[#4E8294]'}`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : isAttending ? <CheckCircle2 size={18} /> : <ArrowRight size={18} className="text-[#00FFFF]" />}
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
             <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-8 left-8 p-3 text-slate-400 bg-slate-50 rounded-full"><X size={24} /></button>
             <h3 className="text-3xl font-black mb-8">{editingEvent ? 'עריכת אירוע' : 'יצירת אירוע'}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">בחר סוג אירוע</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      type="button"
                      onClick={() => { setEventType('MEMBER'); setShowTypeWarning(false); }}
                      className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                        eventType === 'MEMBER' 
                          ? 'bg-[#006994] border-[#006994] text-white shadow-xl shadow-[#006994]/20' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-[#4E8294] hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'MEMBER' ? 'bg-white/20 text-[#00FFFF]' : 'bg-slate-50 text-slate-300 group-hover:text-[#4E8294]'
                      }`}>
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-black text-[10px] mb-0.5">אירוע חבר</p>
                      </div>
                      {eventType === 'MEMBER' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle2 size={12} className="text-[#00FFFF]" />
                        </div>
                      )}
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setEventType('INSTRUCTOR'); setShowTypeWarning(false); }}
                      className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                        eventType === 'INSTRUCTOR' 
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-500/20' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-amber-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'INSTRUCTOR' ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-amber-500'
                      }`}>
                        <Zap size={16} />
                      </div>
                      <div>
                        <p className="font-black text-[10px] mb-0.5">אירוע מדריך</p>
                      </div>
                      {eventType === 'INSTRUCTOR' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setEventType('COMMUNITY'); setShowTypeWarning(false); }}
                      className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                        eventType === 'COMMUNITY' 
                          ? 'bg-[#006994] border-[#006994] text-white shadow-xl shadow-[#006994]/20' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-[#4E8294] hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'COMMUNITY' ? 'bg-white/20 text-[#00FFFF]' : 'bg-slate-50 text-slate-300 group-hover:text-[#4E8294]'
                      }`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="font-black text-[10px] mb-0.5">אירוע קהילה</p>
                      </div>
                      {eventType === 'COMMUNITY' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle2 size={12} className="text-[#00FFFF]" />
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {showTypeWarning && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[10px] font-black animate-bounce">
                      <ShieldAlert size={16} />
                      <p>נא לבחור את סוג האירוע</p>
                    </div>
                  )}

                  {eventType === 'COMMUNITY' && !canManageCommunityEvents && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-700 text-[10px] font-black animate-in slide-in-from-top-2">
                      <ShieldAlert size={16} />
                      <p>רק מנהל או מדריך יכולים ליצור אירוע רשמי של הקהילה.</p>
                    </div>
                  )}

                  {eventType === 'INSTRUCTOR' && !canManageInstructorEvents && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700 text-[10px] font-black animate-in slide-in-from-top-2">
                      <Zap size={16} />
                      <p>הלו... אתה עדיין לא מדריך. 😉</p>
                    </div>
                  )}
                </div>
                <div className="relative group">
                  {!eventType && (
                    <div 
                      className="absolute inset-0 z-10 cursor-pointer" 
                      onClick={() => setShowTypeWarning(true)}
                    ></div>
                  )}
                  <div className={`space-y-6 transition-opacity ${!eventType ? 'opacity-40' : 'opacity-100'}`}>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת האירוע" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תיאור האירוע" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100 h-32 resize-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
                      <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
                    </div>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="מיקום (למשל: חוף זבולון)" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">תמונת רקע</label>
                      <div className="relative group/img aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-4 transition-all hover:border-[#006994]/40">
                        {imageUrl ? (
                          <>
                            <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-white text-[#006994] rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 active:scale-95"
                              >
                                <Camera size={18} />
                                החלפת תמונת רקע
                              </button>
                            </div>
                          </>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center gap-2 text-slate-400 hover:text-[#006994] transition-colors"
                          >
                            <div className="p-4 bg-white rounded-2xl shadow-sm">
                              <Camera size={32} />
                            </div>
                            <span className="font-black text-xs">לחץ להעלאת תמונה</span>
                          </button>
                        )}
                        
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                            <Loader2 className="animate-spin text-[#006994]" size={32} />
                            <span className="font-black text-[#006994] text-[10px] uppercase tracking-widest">מעלה תמונה...</span>
                          </div>
                        )}
                      </div>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSaving || !eventType || (eventType === 'COMMUNITY' && !canManageCommunityEvents) || (eventType === 'INSTRUCTOR' && !canManageInstructorEvents)} 
                  className="w-full py-5 bg-[#006994] text-white rounded-[2rem] font-black text-xl hover:bg-[#4E8294] transition-all shadow-xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isSaving ? <Loader2 className="animate-spin" size={24} /> : editingEvent ? <CheckCircle2 size={24} className="text-[#00FFFF]" /> : <Plus size={24} className="text-[#00FFFF]" />}
                   {editingEvent ? 'שמור שינויים' : 'צור אירוע חדש'}
                </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;