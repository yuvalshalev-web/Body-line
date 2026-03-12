/// <reference types="google.maps" />
import React, { useState, useRef, useEffect } from 'react';
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
import { loadGoogleMaps } from '../utils/googlePlaces';
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
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const initAutocomplete = () => {
      if (locationInputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current!, {
            types: ["geocode"],
          });
          autocompleteRef.current = autocomplete;
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
              setLocation(place.formatted_address);
            }
          });
        } catch (e) {
          console.error("Failed to initialize Autocomplete:", e);
        }
      }
    };

    if (showModal) {
      loadGoogleMaps()
        .then(initAutocomplete)
        .catch(err => {
          console.warn("Google Maps loading failed:", err.message);
        });
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
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
    <div className="min-h-screen bg-transparent text-right animate-in fade-in duration-700" dir="rtl">
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-6 space-y-2">
        {/* Main Title */}
        <h1 className="main-page-title">
          <span className="surfer-title">יומן אירועים</span>
        </h1>

        {/* Subtitle with Emoji context */}
        <div className="flex flex-col items-center gap-4">
          <p className="header-subtitle max-w-2xl text-[var(--surfer-yellow)] font-bold drop-shadow-md">
            מפגשים, חוויות ורגעים שקורים מחוץ למים • {activeEvents.length} אירועים 🗓️
          </p>
          
          {currentUser && (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-4 px-10 py-5 bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_15px_30px_-10px_var(--surfer-deep-shadow),inset_0_0_15px_var(--surfer-aqua-mist)] text-[var(--surfer-cyan)] rounded-2xl font-black text-md transition-all active:scale-95 group hover:bg-[var(--surfer-aqua-mist)]/20 hover:scale-105"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform text-[var(--surfer-yellow)]" />
              <span>הוספת אירוע</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
        {activeEvents.map((event) => {
          const isAttending = currentUser ? (event.attendees || []).includes(currentUser.id) : false;
          const isProcessing = processingId === event.id;
          
          const canDelete = isAdmin || (currentUser && event.creatorId === currentUser.id);
          const canEdit = isAdmin || (currentUser && event.creatorId === currentUser.id);

          return (
            <div key={event.id} className="luxury-card group flex flex-col relative">
              <div className="relative aspect-video overflow-hidden">
                <img src={event.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                  <div className="bg-[var(--surfer-aqua-mist)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 px-4 py-2 rounded-xl text-center shadow-lg min-w-max">
                    <p className="text-sm font-black text-white whitespace-nowrap tabular-nums">{formatDate(event.date)}</p>
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
                <button 
                  onClick={() => handleToggleAttendance(event.id)}
                  disabled={isProcessing}
                  className={`w-full py-4 mb-6 rounded-xl border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.2)] font-black text-sm flex items-center justify-center gap-3 transition-all text-[#000000] ${isAttending ? 'bg-[var(--surfer-orange)]' : 'bg-[var(--surfer-cyan)]'}`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : isAttending ? <CheckCircle2 size={18} /> : <ArrowRight size={18} className="text-[#000000]" />}
                  {isAttending ? 'מבטל הגעה' : 'אני מגיע/ה'}
                </button>

                <h3 className="text-2xl font-black text-[var(--surfer-magenta)] [text-shadow:0_0_10px_var(--surfer-pink)] mb-4">{event.title}</h3>
                <p className="text-[#000000] font-bold text-sm mb-8 line-clamp-3">{event.description}</p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-[#000000]">
                    {event.type === 'COMMUNITY' ? <ShieldAlert size={16} className="text-[var(--surfer-pink)]" /> : 
                     event.type === 'INSTRUCTOR' ? <Zap size={16} className="text-[var(--surfer-cyan)]" /> : 
                     <User size={16} className="text-[var(--surfer-yellow)]" />}
                    <span className="text-xs font-black">
                      {event.type === 'COMMUNITY' ? 'אירוע קהילה רשמי' : 
                       event.type === 'INSTRUCTOR' ? 'אירוע מדריך' : 
                       'אירוע חברתי'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[#000000]"><Clock size={16} className="text-[var(--surfer-cyan)]" /><span className="text-xs font-black">{event.time}</span></div>
                  <div className="flex items-center justify-between gap-3 text-[#000000]">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-[var(--surfer-pink)]" />
                      <span className="text-xs font-black">{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[#000000]">
                    <Users size={16} className="text-[var(--surfer-yellow)]" />
                    <span className="text-xs font-black">
                      {(event.attendees || []).filter(id => activeMemberIds.includes(id)).length} משתתפים
                    </span>
                  </div>
                </div>

                {/* Edit/Delete Buttons - Now at the bottom center */}
                <div className="mt-auto pt-6 flex justify-center border-t border-black/10">
                  {canEdit && (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleEdit(event)} 
                        title="עריכת אירוע"
                        className="p-3 bg-[var(--surfer-aqua-mist)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 text-[#000000] rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.1)] hover:bg-[var(--surfer-aqua-mist)]/40 transition-all active:scale-90 flex items-center justify-center"
                      >
                        <Pencil size={20} className="text-[var(--surfer-cyan)]" />
                        <span className="mr-2 font-black text-xs">עריכה</span>
                      </button>
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(event.id)} 
                          title="מחיקת אירוע"
                          className="p-3 bg-[var(--surfer-pink)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 text-[#000000] rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.1)] hover:bg-[var(--surfer-pink)]/30 transition-all active:scale-90 flex items-center justify-center"
                        >
                          <Trash2 size={20} className="text-[var(--surfer-pink)]" />
                          <span className="mr-2 font-black text-xs">מחיקה</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_20px_50px_-10px_var(--surfer-deep-shadow)] w-full max-w-2xl rounded-3xl p-12 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-white">
             <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-8 left-8 p-3 text-white bg-[var(--surfer-aqua-mist)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 rounded-xl hover:bg-[var(--surfer-aqua-mist)]/40 active:scale-95 transition-all"><X size={24} /></button>
             <h3 className="text-3xl font-black mb-8">{editingEvent ? 'עריכת אירוע' : 'יצירת אירוע'}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-black text-white/50 uppercase tracking-widest mr-2">בחר סוג אירוע</label>
                  <div className={`grid grid-cols-3 gap-3 p-2 rounded-3xl border-t border-l border-white/30 border-r border-b border-white/10 bg-black/10 transition-colors`}>
                    <button 
                      type="button"
                      onClick={() => { setEventType('MEMBER'); setShowTypeWarning(false); }}
                      className={`relative p-3 rounded-xl border-t border-l border-white/30 border-r border-b border-white/10 transition-all flex flex-col items-center gap-2 text-center group ${
                        eventType === 'MEMBER' 
                          ? 'bg-[var(--surfer-cyan)] text-black shadow-[0_5px_15px_rgba(0,0,0,0.2)]' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'MEMBER' ? 'bg-black/20 text-black' : 'bg-white/5 text-white/30 group-hover:text-[var(--surfer-cyan)]'
                      }`}>
                        <User size={16} />
                      </div>
                      <p className="font-black text-[12px] mb-0.5">אירוע חבר</p>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setEventType('INSTRUCTOR'); setShowTypeWarning(false); }}
                      className={`relative p-3 rounded-xl border-t border-l border-white/30 border-r border-b border-white/10 transition-all flex flex-col items-center gap-2 text-center group ${
                        eventType === 'INSTRUCTOR' 
                          ? 'bg-[var(--surfer-orange)] text-white shadow-[0_5px_15px_rgba(0,0,0,0.2)]' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'INSTRUCTOR' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30 group-hover:text-[var(--surfer-orange)]'
                      }`}>
                        <Zap size={16} />
                      </div>
                      <p className="font-black text-[12px] mb-0.5">אירוע מדריך</p>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setEventType('COMMUNITY'); setShowTypeWarning(false); }}
                      className={`relative p-3 rounded-xl border-t border-l border-white/30 border-r border-b border-white/10 transition-all flex flex-col items-center gap-2 text-center group ${
                        eventType === 'COMMUNITY' 
                          ? 'bg-[var(--surfer-pink)] text-white shadow-[0_5px_15px_rgba(0,0,0,0.2)]' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        eventType === 'COMMUNITY' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30 group-hover:text-[var(--surfer-pink)]'
                      }`}>
                        <Users size={16} />
                      </div>
                      <p className="font-black text-[12px] mb-0.5">אירוע קהילה</p>
                    </button>
                  </div>
                  
                  {showTypeWarning && (
                    <div className="p-4 bg-[var(--surfer-pink)]/20 border-t border-l border-white/30 border-r border-b border-white/10 rounded-2xl flex items-center gap-3 text-white text-[12px] font-black animate-bounce">
                      <ShieldAlert size={16} />
                      <p>נא לבחור את סוג האירוע</p>
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
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת האירוע" className="w-full p-5 bg-white/5 backdrop-blur-sm rounded-xl font-black outline-none border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.1)] focus:shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all" />
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תיאור האירוע" className="w-full p-5 bg-white/5 backdrop-blur-sm rounded-xl font-bold outline-none border-t border-l border-white/30 border-r border-b border-white/10 h-32 resize-none shadow-[0_5px_15px_rgba(0,0,0,0.1)] focus:shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition-all" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-white/50 uppercase tracking-widest mr-2">תאריך</label>
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-5 bg-white/5 backdrop-blur-sm rounded-xl font-black outline-none border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-black text-white/50 uppercase tracking-widest mr-2">שעה</label>
                        <TimePicker required value={time} onChangeValue={setTime} className="w-full p-5 bg-white/5 backdrop-blur-sm rounded-xl font-black outline-none border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-all" />
                      </div>
                    </div>
                    <input type="text" ref={locationInputRef} value={location} onChange={e => setLocation(e.target.value)} placeholder="מיקום (למשל: חוף זבולון)" className="w-full p-5 bg-white/5 backdrop-blur-sm rounded-xl font-black outline-none border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-all" />
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-white/50 uppercase tracking-widest mr-4">תמונת רקע</label>
                      <div className="relative group/img aspect-video rounded-3xl overflow-hidden border-t border-l border-white/30 border-r border-b border-white/10 bg-white/5 flex flex-col items-center justify-center gap-4 transition-all hover:border-[var(--surfer-cyan)]/40">
                        {imageUrl ? (
                          <>
                            <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-white text-[var(--surfer-cyan)] rounded-xl border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.2)] font-black text-sm flex items-center gap-2 active:scale-95"
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
                            className="flex flex-col items-center gap-2 text-white/50 hover:text-[var(--surfer-cyan)] transition-colors"
                          >
                            <div className="p-4 bg-white/5 rounded-xl border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                              <Camera size={32} />
                            </div>
                            <span className="font-black text-xs">לחץ להעלאת תמונה</span>
                          </button>
                        )}
                        
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                            <Loader2 className="animate-spin text-[var(--surfer-cyan)]" size={32} />
                            <span className="font-black text-[var(--surfer-cyan)] text-[12px] uppercase tracking-widest">מעלה תמונה...</span>
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
                  className="flex items-center justify-center gap-4 px-10 py-5 bg-[var(--surfer-cyan)] text-black rounded-xl border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.3)] font-black text-xl transition-all active:scale-95 group w-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--surfer-teal)]"
                >
                   {isSaving ? <Loader2 className="animate-spin" size={24} /> : editingEvent ? <CheckCircle2 size={24} className="text-black" /> : <Plus size={24} className="group-hover:rotate-90 transition-transform text-black" />}
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