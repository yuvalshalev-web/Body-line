/// <reference types="google.maps" />
import React, { useState, useRef, useEffect } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
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
  Camera,
  Navigation
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { Event } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from '../services/firebase';
import { processImage } from '../utils/imageProcessor';
import { syncStorageOnUpload } from '../utils/storageStats';
import { WazeIcon } from '../components/icons/WazeIcon';
import { GoogleMapsIcon } from '../components/icons/GoogleMapsIcon';
import TimePicker from '../components/TimePicker';

const EventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { events, members, addEvent, deleteEvent, updateEvent, toggleEventAttendance } = useData();
  const { showConfirm, showSuccess, showError } = useModal();

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
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && locationInputRef.current) {
      setOptions({
        key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
      });

      importLibrary("places").then((places) => {
        const { Autocomplete } = places;
        const autocomplete = new Autocomplete(locationInputRef.current!, {
          types: ["geocode"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setLocation(place.formatted_address);
          }
        });
      });
    }
  }, [showModal]);

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
      await syncStorageOnUpload(processed.blob.size);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setImageUrl(downloadUrl);
      showSuccess('התמונה הועלתה בהצלחה');
    } catch (err) {
      console.error(err);
      showError('שגיאה בהעלאת התמונה');
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
          imageUrl: imageUrl || 'https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fevents_bg.png?alt=media',
          type: eventType,
        });
      } else {
        await addEvent({
          title,
          description,
          date,
          time,
          location: location || 'הרצליה',
          imageUrl: imageUrl || 'https://firebasestorage.googleapis.com/v0/b/body-line-67637.firebasestorage.app/o/assets%2Fimages%2Fevents_bg.png?alt=media',
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
    showConfirm({
      title: 'מחיקת אירוע',
      message: 'האם למחוק אירוע זה?',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      onConfirm: () => deleteEvent(id)
    });
  };

  const handleToggleAttendance = async (eventId: string) => {
    if (!currentUser) return;
    setProcessingId(eventId);
    try { await toggleEventAttendance(eventId, currentUser.id); } finally { setProcessingId(null); }
  };

  const activeEvents = events.filter(e => {
    const eventDate = new Date(`${e.date}T${e.time || '00:00'}`);
    return eventDate >= new Date();
  });

  return (
    <div className="min-h-screen bg-white text-right animate-in fade-in duration-700" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-6 space-y-2">
        {/* Main Title */}
        <h1 className="main-page-title">
          <span className="surfer-title">אירועים קרובים</span>
        </h1>

        {/* Subtitle with Emoji context */}
        <div className="flex flex-col items-center gap-4">
          <p className="header-subtitle max-w-2xl">
            מפגשים, חוויות ורגעים שקורים מחוץ למים • {activeEvents.length} אירועים 🗓️
          </p>
          
          {currentUser && (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-4 px-10 py-5 text-white rounded-[2rem] font-black text-md transition-all active:scale-95 group hd-glass-button-vibrant"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform text-[#00FFFF]" />
              <span>הוספת אירוע</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeEvents.map((event) => {
          const isAttending = currentUser ? (event.attendees || []).includes(currentUser.id) : false;
          const isProcessing = processingId === event.id;
          
          const canDelete = isAdmin || (currentUser && event.creatorId === currentUser.id);
          const canEdit = isAdmin || (currentUser && event.creatorId === currentUser.id);

          return (
            <div key={event.id} className={`group glass-panel rounded-[3rem] border-t-4 ${event.type === 'COMMUNITY' ? 'border-t-[var(--surfer-pink)]' : event.type === 'INSTRUCTOR' ? 'border-t-[var(--surfer-orange)]' : 'border-t-[var(--surfer-cyan)]'} shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col relative`}>
              <div className="absolute top-6 left-6 flex gap-2 z-20">
                {canEdit && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(event)} 
                      title="עריכת אירוע"
                      className="p-3 bg-white text-[#006994] border border-slate-200 rounded-2xl shadow-xl hover:bg-slate-50 transition-all active:scale-90 flex items-center justify-center"
                    >
                      <Pencil size={18} />
                    </button>
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(event.id)} 
                        title="מחיקת אירוע"
                        className="p-3 bg-white text-red-500 border border-slate-200 rounded-2xl shadow-xl hover:bg-red-50 transition-all active:scale-90 flex items-center justify-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="relative aspect-video overflow-hidden">
                <img src={event.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                  <div className="glass-effect px-4 py-2 rounded-xl text-center shadow-lg min-w-max">
                    <p className="text-sm font-black glass-text-primary whitespace-nowrap tabular-nums">{formatDate(event.date)}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-wider shadow-md ${
                    event.type === 'COMMUNITY' ? 'bg-[var(--surfer-pink)] text-white' : 
                    event.type === 'INSTRUCTOR' ? 'bg-[var(--surfer-orange)] text-white' : 
                    'bg-[var(--surfer-cyan)] text-white'
                  }`}>
                    {event.type === 'COMMUNITY' ? 'אירוע קהילה' : event.type === 'INSTRUCTOR' ? 'אירוע מדריך' : 'אירוע של חבר'}
                  </div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col relative z-30">
                <h3 className="text-2xl font-black glass-text-primary mb-4 group-hover:text-[var(--surfer-pink)] transition-colors">{event.title}</h3>
                <p className="glass-text-secondary font-bold text-sm mb-8 line-clamp-3">{event.description}</p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 glass-text-secondary">
                    {event.type === 'COMMUNITY' ? <ShieldAlert size={16} className="text-[var(--surfer-pink)]" /> : 
                     event.type === 'INSTRUCTOR' ? <Zap size={16} className="text-[var(--surfer-orange)]" /> : 
                     <User size={16} className="text-[var(--surfer-cyan)]" />}
                    <span className="text-xs font-black">
                      {event.type === 'COMMUNITY' ? 'אירוע קהילה רשמי' : 
                       event.type === 'INSTRUCTOR' ? 'אירוע מדריך' : 
                       'אירוע חברתי'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 glass-text-secondary"><Clock size={16} className="text-[var(--surfer-pink)]" /><span className="text-xs font-black">{event.time}</span></div>
                  <div className="flex items-center justify-between gap-3 glass-text-secondary">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-[var(--surfer-pink)]" />
                      <span className="text-xs font-black">{event.location}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <a 
                          href={`https://waze.com/ul?q=${encodeURIComponent(event.location)}&navigate=yes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-[#33ccff]/10 text-[#33ccff] rounded-xl hover:bg-[#33ccff]/20 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                          title="ניווט עם Waze"
                        >
                          <WazeIcon className="w-4 h-4" />
                          <span className="text-xs font-bold">Waze</span>
                        </a>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500/20 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                          title="ניווט עם Google Maps"
                        >
                          <GoogleMapsIcon className="w-4 h-4" />
                          <span className="text-xs font-bold">Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 glass-text-secondary">
                    <Users size={16} className="text-[var(--surfer-pink)]" />
                    <span className="text-xs font-black">
                      {(event.attendees || []).filter(id => activeMemberIds.includes(id)).length} משתתפים
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleAttendance(event.id)}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-md text-white ${isAttending ? 'bg-[var(--surfer-orange)] hover:bg-[var(--surfer-pink)]' : 'bg-[var(--surfer-teal)] hover:bg-[var(--surfer-cyan)]'}`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : isAttending ? <CheckCircle2 size={18} /> : <ArrowRight size={18} className="text-white" />}
                  {isAttending ? 'מבטל הגעה' : 'אני מגיע/ה'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
           <div className="glass-panel w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto glass-text-primary">
             <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-8 left-8 p-3 text-white/60 hover:text-white glass-effect rounded-full"><X size={24} /></button>
             <h3 className="text-3xl font-black mb-8">{editingEvent ? 'עריכת אירוע' : 'יצירת אירוע'}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">בחר סוג אירוע</label>
                  <div className={`grid grid-cols-3 gap-3 p-2 rounded-3xl border-2 transition-colors ${
                    eventType === 'MEMBER' ? 'bg-[#00D9E6]/10 border-[#00D9E6]' :
                    eventType === 'INSTRUCTOR' ? 'bg-[#FF9F1C]/10 border-[#FF9F1C]' :
                    eventType === 'COMMUNITY' ? 'bg-[#FF2D60]/10 border-[#FF2D60]' :
                    'bg-slate-50 border-slate-100'
                  }`}>
                    <button 
                      type="button"
                      onClick={() => { setEventType('MEMBER'); setShowTypeWarning(false); }}
                      className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                        eventType === 'MEMBER' 
                          ? 'bg-[#00D9E6] border-[#00D9E6] text-white shadow-xl shadow-[#00D9E6]/20' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-[#00D9E6] hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'MEMBER' ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-[#00D9E6]'
                      }`}>
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-black text-[12px] mb-0.5">אירוע חבר</p>
                      </div>
                      {eventType === 'MEMBER' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setEventType('INSTRUCTOR'); setShowTypeWarning(false); }}
                      className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center group ${
                        eventType === 'INSTRUCTOR' 
                          ? 'bg-[#FF9F1C] border-[#FF9F1C] text-white shadow-xl shadow-[#FF9F1C]/20' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-[#FF9F1C] hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'INSTRUCTOR' ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-[#FF9F1C]'
                      }`}>
                        <Zap size={16} />
                      </div>
                      <div>
                        <p className="font-black text-[12px] mb-0.5">אירוע מדריך</p>
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
                          ? 'bg-[#FF2D60] border-[#FF2D60] text-white shadow-xl shadow-[#FF2D60]/20' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-[#FF2D60] hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'COMMUNITY' ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-[#FF2D60]'
                      }`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="font-black text-[12px] mb-0.5">אירוע קהילה</p>
                      </div>
                      {eventType === 'COMMUNITY' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {showTypeWarning && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[12px] font-black animate-bounce">
                      <ShieldAlert size={16} />
                      <p>נא לבחור את סוג האירוע</p>
                    </div>
                  )}

                  {eventType === 'COMMUNITY' && !canManageCommunityEvents && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-700 text-[12px] font-black animate-in slide-in-from-top-2">
                      <ShieldAlert size={16} />
                      <p>רק רכז או מדריך יכולים ליצור אירוע רשמי של הקהילה.</p>
                    </div>
                  )}

                  {eventType === 'INSTRUCTOR' && !canManageInstructorEvents && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700 text-[12px] font-black animate-in slide-in-from-top-2">
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
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest mr-2">תאריך</label>
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest mr-2">שעה</label>
                        <TimePicker required value={time} onChangeValue={setTime} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
                      </div>
                    </div>
                    <input type="text" ref={locationInputRef} value={location} onChange={e => setLocation(e.target.value)} placeholder="מיקום (למשל: חוף זבולון)" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100" />
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest mr-4">תמונת רקע</label>
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
                            <span className="font-black text-[#006994] text-[12px] uppercase tracking-widest">מעלה תמונה...</span>
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
                  className="flex items-center justify-center gap-4 px-10 py-5 text-white rounded-[2rem] font-black text-xl transition-all active:scale-95 group hd-glass-button-vibrant w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isSaving ? <Loader2 className="animate-spin" size={24} /> : editingEvent ? <CheckCircle2 size={24} className="text-[#00FFFF]" /> : <Plus size={24} className="group-hover:rotate-90 transition-transform text-[#00FFFF]" />}
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