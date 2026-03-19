import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { Plus, User, Loader2, Trash2, X, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { getDb, getStorageInstance } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { processImage } from '../utils/imageProcessor';
import { analyzeImage } from '../services/geminiService';
import { GalleryItem } from '../types';
import { syncStorageOnUpload, syncStorageOnDelete } from '../utils/storageStats';

import { useRandomHeader } from '../hooks/useRandomHeader';

const GalleryPage: React.FC = () => {
  const headerImage = useRandomHeader();
  const { currentUser } = useAuth();
  const { galleryItems } = useData();
  const { showConfirm, showError } = useModal();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(0);
    
    const stepsPerFile = 3;
    const totalSteps = files.length * stepsPerFile;
    let completedSteps = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndexText = files.length > 1 ? `(${i + 1}/${files.length})` : '';
      
      try {
        setUploadStatus(`מבצע אופטימיזציה ${fileIndexText}...`);
        const { blob, dataUrl } = await processImage(file, 1600, 0.9, 800);
        completedSteps++;
        setUploadProgress(Math.round((completedSteps / totalSteps) * 100));

        setUploadStatus(`מנתח תמונה בעזרת AI ${fileIndexText}...`);
        const aiCaption = await analyzeImage(dataUrl);
        completedSteps++;
        setUploadProgress(Math.round((completedSteps / totalSteps) * 100));

        setUploadStatus(`מעלה לענן ${fileIndexText}...`);
        const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
        const storagePath = `gallery/${fileName}`;
        const storageRef = ref(getStorageInstance(), storagePath);
        
        const snapshot = await uploadBytes(storageRef, blob);
        await syncStorageOnUpload(blob.size);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        await addDoc(collection(getDb(), 'gallery'), {
          imageUrl: downloadUrl,
          storagePath: storagePath, 
          uploaderId: currentUser.id,
          uploaderName: `${currentUser.firstName} ${currentUser.lastName}`,
          caption: aiCaption,
          timestamp: serverTimestamp()
        });

        completedSteps++;
        setUploadProgress(Math.round((completedSteps / totalSteps) * 100));
      } catch (err: any) {
        console.error("Upload failed:", file.name, err);
        setErrorMsg(err.message || `שגיאה בהעלאת ${file.name}`);
      }
    }

    if (!errorMsg) {
      setUploadStatus('העלאה הושלמה בהצלחה!');
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 1500);
    } else {
      setTimeout(() => {
        setIsUploading(false);
        setErrorMsg(null);
      }, 5000);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (item: GalleryItem) => {
    showConfirm({
      title: 'מחיקת תמונה',
      message: 'האם למחוק תמונה זו לצמיתות?\nהקובץ יוסר גם מהשרת וגם מהאפליקציה.',
      confirmText: 'מחק',
      cancelText: 'ביטול',
      onConfirm: async () => {
        setDeletingId(item.id);
        try {
          const db = getDb();
          const storage = getStorageInstance();
          
          await deleteDoc(doc(db, 'gallery', item.id));
          console.log("Firestore document deleted");

          const storageIdentifier = item.storagePath || item.imageUrl;
          if (storageIdentifier) {
            try {
              const imageRef = ref(storage, storageIdentifier);
              
              // Fetch metadata to get file size before deletion
              try {
                const metadata = await getMetadata(imageRef);
                if (metadata.size) {
                  await syncStorageOnDelete(metadata.size);
                }
              } catch (metaErr) {
                console.warn("Could not fetch metadata for size sync:", metaErr);
              }

              await deleteObject(imageRef);
              console.log("Storage file deleted");
            } catch (storageErr: any) {
              if (storageErr.code === 'storage/object-not-found') {
                console.warn("File already missing from storage");
              } else {
                console.error("Storage deletion failed:", storageErr);
              }
            }
          }
        } catch (err: any) {
          console.error("Delete sequence failed:", err);
          showError(err.message || 'המחיקה נכשלה. נסה שנית מאוחר יותר.');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-right animate-in fade-in duration-700" dir="rtl" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-6 space-y-2 header-wallpaper !py-10" style={{ '--bg-image': `url(${headerImage})` } as React.CSSProperties}>
        <div className="header-content-wrapper relative z-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-500/10 text-sky-500 mb-2 shadow-sm border border-sky-500/20 relative z-10">
            <ImageIcon size={40} />
          </div>
          <h1 className="main-page-title">
            <span className="surfer-title">ליינאפ התמונות</span>
          </h1>
          <p className="header-subtitle max-w-2xl mx-auto">
            רגעים מהמים • {galleryItems.length} תמונות אופטימליות של הגולשים שלנו 📸
          </p>
          
          <div className="flex flex-col items-center gap-3 mt-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-4 px-10 py-4 bg-white/50 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 text-sky-600 rounded-2xl font-black text-lg transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-50 group"
            >
              {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} className="group-hover:rotate-90 transition-transform text-sky-500" />}
              <span>{isUploading ? 'מעבד תמונות...' : 'העלאת תמונות'}</span>
            </button>
            <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleFileUpload} />
          </div>
        </div>
      </div>

      {isUploading && (
        <div className={`mb-12 bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_15px_30px_-10px_var(--surfer-deep-shadow),inset_0_0_15px_var(--surfer-aqua-mist)] rounded-2xl p-8 animate-in slide-in-from-top-4 ${errorMsg ? 'border-rose-500' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              {errorMsg ? (
                <AlertTriangle className="text-[var(--surfer-yellow)]" size={24} />
              ) : uploadProgress === 100 ? (
                <CheckCircle2 className="text-[var(--surfer-cyan)] animate-bounce" size={24} />
              ) : (
                <Loader2 className="animate-spin text-white" size={24} />
              )}
              <span className={`font-black ${errorMsg ? 'text-rose-500' : 'text-white'}`}>
                {errorMsg || uploadStatus}
              </span>
            </div>
            <span className="font-black text-[var(--surfer-cyan)] text-sm">{uploadProgress}%</span>
          </div>
          <div className="w-full h-6 bg-black/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${errorMsg ? 'bg-rose-500' : 'bg-[var(--surfer-cyan)]'}`}
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
        {galleryItems.map((item) => (
          <div key={item.id} 
            className="luxury-card relative group aspect-square overflow-hidden cursor-zoom-in hover:scale-105 transition-all duration-500"
            onClick={() => setSelectedImage(item.imageUrl)}
          >
            <img 
              src={item.imageUrl} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt={item.uploaderName} 
              loading="lazy" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
               <div className="flex items-center gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/20 backdrop-blur-[20px] border border-white/30 p-2 rounded-xl self-start">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-white font-black text-xs">{item.uploaderName}</p>
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">רגע מהמים</p>
                  </div>
               </div>
               
               {(currentUser?.role === 'Admin' || currentUser?.id === item.uploaderId) && (
                 <button 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     handleDelete(item); 
                   }}
                   disabled={deletingId === item.id}
                   className="absolute top-4 left-4 p-3 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all z-20 disabled:opacity-50 active:scale-90 flex items-center justify-center"
                   title="מחיקת תמונה"
                 >
                   {deletingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" 
          onClick={() => setSelectedImage(null)}
        >
           <button 
             className="absolute top-8 left-8 p-3 bg-[var(--surfer-aqua-mist)]/20 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 text-white rounded-xl hover:bg-[var(--surfer-aqua-mist)]/40 transition-all z-[130] active:scale-90"
             onClick={(e) => {
               e.stopPropagation();
               setSelectedImage(null);
             }}
           >
             <X size={32} strokeWidth={3} />
           </button>
           <div className="relative max-w-5xl max-h-full bg-[var(--surfer-aqua-mist)]/10 backdrop-blur-[20px] border-t border-l border-white/30 border-r border-b border-white/10 shadow-[0_20px_50px_-10px_var(--surfer-deep-shadow)] rounded-3xl p-2" onClick={e => e.stopPropagation()}>
             <img 
               src={selectedImage} 
               className="w-full h-full object-contain rounded-2xl animate-in zoom-in-95 duration-300" 
               alt="Large view" 
             />
           </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;