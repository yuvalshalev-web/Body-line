
import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Sparkles, User, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import { db, storage } from '../services/firebase';
import { GalleryItem, Member } from '../types';
import { analyzeImage } from '../services/geminiService';

interface GalleryPageProps {
  user: Member;
  galleryItems: GalleryItem[];
  setGalleryItems: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ user, galleryItems }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      try {
        // 1. Upload to Firebase Storage
        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        // 2. Gemini Analysis (using base64 for Gemini)
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          const aiDescription = await analyzeImage(base64);

          // 3. Save to Firestore
          await addDoc(collection(db, 'gallery'), {
            imageUrl: downloadUrl,
            uploaderId: user.id,
            uploaderName: user.name,
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

  const deleteItem = async (id: string) => {
    if (window.confirm('האם למחוק תמונה זו?')) {
      await deleteDoc(doc(db, 'gallery', id));
    }
  };

  return (
    <div className="relative min-h-screen -m-6 p-6 md:-m-12 md:p-12 overflow-hidden bg-white text-right">
      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
              <Sparkles size={12} className="text-indigo-500" />
              גלריה חכמה - Firebase & Gemini
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">זכרונות מהגלים</h2>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="group relative flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-md hover:bg-black transition-all shadow-2xl disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
            <span>{isUploading ? 'מעלה תמונות...' : 'העלאת תמונה'}</span>
          </button>
          <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {galleryItems.map((item) => (
            <div key={item.id} className="break-inside-avoid group bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
              <div className="relative">
                <img src={item.imageUrl} alt={item.caption} className="w-full h-auto object-cover transition-all duration-1000 group-hover:scale-105" />
                {user.id === item.uploaderId && (
                  <button onClick={() => deleteItem(item.id)} className="absolute top-6 left-6 p-3 bg-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-950 text-sm truncate">{item.uploaderName}</p>
                  </div>
                </div>

                <h4 className="text-xl font-black text-slate-950 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {item.caption}
                </h4>
                
                {item.aiDescription && (
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-slate-500 font-medium text-[13px] leading-relaxed italic pr-4 border-r-2 border-indigo-500/30">
                      {item.aiDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {galleryItems.length === 0 && !isUploading && (
          <div className="py-40 text-center flex flex-col items-center">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200">
                <ImageIcon size={48} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">הגלריה ריקה</h3>
             <p className="text-slate-400 mt-2 font-medium text-lg">שתפו את התמונה הראשונה והתחילו את הסיפור.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
