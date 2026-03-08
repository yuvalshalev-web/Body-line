import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { Plus, User, Loader2, Trash2, X, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { getDb, getStorageInstance } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { processImage } from '../utils/imageProcessor';
import { GalleryItem } from '../types';
import { syncStorageOnUpload, syncStorageOnDelete } from '../utils/storageStats';

const GalleryPage: React.FC = () => {
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
    
    const stepsPerFile = 2;
    const totalSteps = files.length * stepsPerFile;
    let completedSteps = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndexText = files.length > 1 ? `(${i + 1}/${files.length})` : '';
      
      try {
        setUploadStatus(`מבצע אופטימיזציה ${fileIndexText}...`);
        const { blob } = await processImage(file, 1200, 0.85);
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
          caption: "רגע מהמים",
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
    <div className="min-h-screen bg-white text-right animate-in fade-in duration-700" dir="rtl" style={{ fontFamily: "'Yehuda CLM', sans-serif" }}>
      {/* Body-line Standard Header Stack */}
      <div className="surfboard-hero-container mb-6 space-y-2">
        {/* Main Title */}
        <h1 className="main-page-title">
          <span className="surfer-title">ליינאפ התמונות</span>
        </h1>

        {/* Subtitle with Emoji context */}
        <div className="flex flex-col items-center gap-4">
          <p className="header-subtitle max-w-2xl">
            רגעים מהמים • {galleryItems.length} תמונות אופטימליות של הגולשים שלנו 📸
          </p>
          
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-4 px-10 py-5 text-white rounded-[2rem] font-black text-md transition-all active:scale-95 disabled:opacity-50 group hd-glass-button-vibrant"
            >
              {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} className="group-hover:rotate-90 transition-transform text-[#00FFFF]" />}
              <span>{isUploading ? 'מעבד תמונות...' : 'העלאת תמונות'}</span>
            </button>
            <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleFileUpload} />
          </div>
        </div>
      </div>

      {isUploading && (
        <div className={`mb-12 rounded-[2.5rem] p-8 border animate-in slide-in-from-top-4 ${errorMsg ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              {errorMsg ? (
                <AlertTriangle className="text-rose-500" size={24} />
              ) : uploadProgress === 100 ? (
                <CheckCircle2 className="text-emerald-500 animate-bounce" size={24} />
              ) : (
                <Loader2 className="animate-spin text-indigo-500" size={24} />
              )}
              <span className={`font-black ${errorMsg ? 'text-rose-700' : 'text-[#2B2B2E]'}`}>
                {errorMsg || uploadStatus}
              </span>
            </div>
            <span className="font-black text-slate-400 text-sm">{uploadProgress}%</span>
          </div>
          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-500 ease-out ${errorMsg ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-indigo-500'}`}
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {galleryItems.map((item) => (
          <div 
            key={item.id} 
            className={`relative group aspect-square overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-zoom-in ${deletingId === item.id ? 'opacity-30' : ''}`}
            onClick={() => setSelectedImage(item.imageUrl)}
          >
            <img 
              src={item.imageUrl} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt={item.uploaderName} 
              loading="lazy" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
               <div className="flex items-center gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{item.uploaderName}</p>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">רגע מהמים</p>
                  </div>
               </div>
               
               {(currentUser?.role === 'Admin' || currentUser?.id === item.uploaderId) && (
                 <button 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     handleDelete(item); 
                   }}
                   disabled={deletingId === item.id}
                   className="absolute top-6 left-6 p-3 bg-rose-500/90 backdrop-blur-sm text-white rounded-2xl hover:bg-rose-600 transition-all shadow-lg active:scale-90 z-20 disabled:opacity-50"
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
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" 
          onClick={() => setSelectedImage(null)}
        >
           <button 
             className="absolute top-8 left-8 p-4 text-white hover:text-[#00FFFF] transition-colors bg-white/10 hover:bg-white/20 rounded-2xl z-[130]"
             onClick={(e) => {
               e.stopPropagation();
               setSelectedImage(null);
             }}
           >
             <X size={32} />
           </button>
           <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
             <img 
               src={selectedImage} 
               className="w-full h-full object-contain rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300" 
               alt="Large view" 
             />
           </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;