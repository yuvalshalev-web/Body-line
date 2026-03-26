import React, { useState, useRef, useEffect } from 'react';
import { Event } from '../../types';
import { X, Calendar, Clock, MapPin, Image as ImageIcon, Save, Upload, Loader2, AlertCircle } from 'lucide-react';
import { processImage } from '../../utils/imageProcessor';
import { loadGoogleMaps } from '../../utils/googlePlaces';

interface EventEditorProps {
  event: Partial<Event> | null;
  onSave: (event: any) => Promise<void> | void;
  onClose: () => void;
  onArchive?: (id: string) => Promise<void> | void;
  attendeeNames?: string[];
}

export const EventEditor: React.FC<EventEditorProps> = ({ event, onSave, onClose, onArchive, attendeeNames }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || new Date().toISOString().split('T')[0],
    time: event?.time || '18:00',
    location: event?.location || '',
    imageUrl: event?.imageUrl || '',
    type: event?.type || 'MEMBER',
    creatorId: event?.creatorId || '',
    attendees: event?.attendees || []
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        await loadGoogleMaps();
        if (!locationInputRef.current || !window.google) return;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(locationInputRef.current, {
          componentRestrictions: { country: 'il' },
          fields: ['address_components', 'geometry', 'formatted_address', 'name'],
          types: ['establishment', 'geocode']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.formatted_address || place.name) {
            setFormData(prev => ({ 
              ...prev, 
              location: place.formatted_address || place.name 
            }));
          }
        });
      } catch (err) {
        console.error('Failed to load Google Maps Autocomplete:', err);
      }
    };

    initAutocomplete();

    return () => {
      if (window.google && window.google.maps && window.google.maps.event && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const { dataUrl } = await processImage(file, 1200, 0.7, 150);
      setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
    } catch (err: any) {
      setError(err.message || 'נכשלה העלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading) return;

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        ...event,
        ...formData
      });
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.message || 'נכשלה שמירת האירוע. אנא נסו שוב.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative my-auto">
        <button 
          onClick={onClose} 
          className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar className="text-indigo-600" />
          {event?.id ? 'עריכת אירוע' : 'יצירת אירוע חדש'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block mr-1">כותרת האירוע</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="למשל: ערב גיבוש בחוף"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block mr-1">תיאור האירוע</label>
            <textarea
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
              placeholder="ספרו לנו קצת על האירוע..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block mr-1">תאריך</label>
              <div className="relative">
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block mr-1">שעה</label>
              <div className="relative">
                <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block mr-1">מיקום</label>
            <div className="relative">
              <MapPin size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                ref={locationInputRef}
                required
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="איפה זה קורה? (התחילו להקליד כתובת...)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block mr-1">תמונת האירוע</label>
            <div className="flex flex-col gap-4">
              {formData.imageUrl && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 group">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all bg-slate-50"
                >
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                  {formData.imageUrl ? 'החלף תמונה' : 'העלה תמונה מהמכשיר'}
                </button>
                
                {/* Fallback for manual URL if needed, but hidden by default to simplify */}
                {/* <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="flex-[2] px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="או הדבק קישור לתמונה..."
                /> */}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {event?.id && attendeeNames && attendeeNames.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Save className="text-indigo-500" size={16} />
                משתתפים ({attendeeNames.length})
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                רשימת משתתפים נוכחית: {attendeeNames.join(', ')}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                * שמות המשתתפים מוצגים כאן לצורך מידע בלבד בזמן עריכה
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-100 mt-8">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
            >
              ביטול
            </button>
            {event?.id && onArchive && (
              <button 
                type="button"
                onClick={() => onArchive(event.id!)}
                className="flex-1 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors border border-red-100"
              >
                ביטול אירוע (ארכיון)
              </button>
            )}
            <button 
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-[2] px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {isSaving ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEditor;
