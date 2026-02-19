import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Sparkles, User, Loader2, Trash2, Image as ImageIcon, Camera, X } from 'lucide-react';
import { db, storage } from '../services/firebase';
import { analyzeImage } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const GalleryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { galleryItems } = useData();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      try {
        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          const aiDescription = await analyzeImage(base64);

          await addDoc(collection(db, 'gallery'), {
            imageUrl: downloadUrl,
            uploaderId: currentUser.id,
            uploaderName: currentUser.name,
            caption: "רגע קהילתי משותף",
            timestamp: serverTimestamp(),
            aiDescription: aiDescription
          });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('האם למחוק תמונה זו?')) {
      try {
        await deleteDoc(doc(db, 'gallery', itemId));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-right animate-in fade-in duration-700" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 mb-2">גלריית הנבחרת</h2>
          <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest">רגעים שנתפסו בעדשה • {galleryItems.length} תמונות</p>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-md hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 group"
        >
          {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} className="group-hover:rotate-90 transition-transform" />}
          <span>{isUploading ? 'מעלה תמונות...' : 'העלאת תמונות'}</span>
          <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleFileUpload} />
        </button>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
        {galleryItems.map((item) => (
          <div 
            key={item.id} 
            className="relative group rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 break-inside-avoid cursor-zoom-in"
            onClick={() => setSelectedImage(item.imageUrl)}
          >
            <img src={item.imageUrl} className="w-full object-cover" alt={item.uploaderName} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"><User size={14} /></div>
                  <p className="text-white font-black text-xs">{item.uploaderName}</p>
               </div>
               <p className="text-white/80 text-[10px] font-bold leading-relaxed pr-2 border-r-2 border-indigo-500">{item.aiDescription || 'רגע של גלישה...'}</p>
               {(currentUser?.role === 'Admin' || currentUser?.id === item.uploaderId) && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                   className="absolute top-6 left-6 p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-lg active:scale-90"
                 >
                   <Trash2 size={16} />
                 </button>
               )}
            </div>
            {item.aiDescription && (
              <div className="absolute top-4 right-4 p-2 bg-indigo-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                <Sparkles size={14} />
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-12 bg-slate-950/90 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedImage(null)}>
           <button className="absolute top-8 left-8 p-4 text-white hover:text-indigo-400 transition-colors bg-white/10 rounded-2xl"><X size={32} /></button>
           <img src={selectedImage} className="max-w-full max-h-full rounded-[2rem] shadow-2xl animate-in zoom-in-95" alt="Large view" />
        </div>
      )}
    </div>
  );
};

export default GalleryPage;