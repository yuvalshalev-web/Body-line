import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { isAppShaperUser } from '../constants';
import { storage as firebaseStorage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Upload, Trash2, Image as ImageIcon, Type, Loader2, CheckCircle, AlertTriangle, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { ReadOnlyNoticeModal } from '../components/admin/ReadOnlyNoticeModal';

import { SURFBOARD_CATALOG } from '../data/surfboardCatalog';

interface AssetImageProps {
  url: string | null | undefined;
  alt: string;
  className?: string;
  onDelete: () => void;
  aspect?: 'cover' | 'contain';
}

const AssetImage: React.FC<AssetImageProps> = ({ url, alt, className = "h-24", onDelete, aspect = 'contain' }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [url]);

  if (!url) {
    return (
      <div className={`${className} border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium`}>
        חסר
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${className} relative rounded-xl border border-rose-200 bg-rose-50/50 p-2 flex flex-col items-center justify-center text-center group`}>
        <AlertTriangle size={18} className="text-rose-500 mb-1" />
        <span className="text-[10px] font-bold text-rose-600">שגיאת טעינה</span>
        <button
          onClick={onDelete}
          title="הסר קישור שבור"
          className="absolute top-1 left-1 p-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white rounded-md transition-all duration-200 shadow-sm"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={`${className} relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-0">
          <Loader2 size={16} className="animate-spin text-slate-400" />
        </div>
      )}
      <img 
        src={url} 
        alt={alt} 
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full ${aspect === 'cover' ? 'object-cover' : 'object-contain p-1'} transition-transform duration-300 group-hover:scale-105`} 
      />
      <button
        onClick={onDelete}
        title="מחק נכס"
        className="absolute top-1 left-1 p-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-lg transition-all duration-200 shadow-sm hover:shadow-rose-500/20 active:scale-95 z-10 opacity-90 hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export const AdminAssets: React.FC = () => {
  const { siteAssets, updateSiteAssets, seedInitialAssets, getSiteAssetsBackups, restoreSiteAssetsBackup } = useData();
  const { currentUser } = useAuth();
  const isAppShaper = isAppShaperUser(currentUser);
  const [showReadOnlyNotice, setShowReadOnlyNotice] = useState(false);

  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<{ type: string, url: string, fontName?: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);

  const checkAppShaper = (): boolean => {
    if (!isAppShaper) {
      setShowReadOnlyNotice(true);
      return false;
    }
    return true;
  };

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const b = await getSiteAssetsBackups();
      setBackups(b);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!checkAppShaper()) return;
    if (!window.confirm('האם אתה בטוח שברצונך לשחזר מגיבוי זה? פעולה זו תדרוס את כל הנכסים הנוכחיים.')) return;
    setRestoringBackupId(backupId);
    try {
      await restoreSiteAssetsBackup(backupId);
      setSuccess('הגיבוי שוחזר בהצלחה!');
      setShowBackups(false);
    } catch(err: any) {
      setError('שגיאה בשחזור הגיבוי: ' + err.message);
    } finally {
      setRestoringBackupId(null);
    }
  };

  const handleResetAssetsClick = () => {
    if (!checkAppShaper()) return;
    setShowResetConfirm(true);
  };

  const confirmResetAssets = async () => {
    if (!checkAppShaper()) return;
    setShowResetConfirm(false);
    setIsResetting(true);
    try {
      await seedInitialAssets();
      setSuccess('נכסי ברירת המחדל אותחלו בהצלחה!');
    } catch (err: any) {
      setError('שגיאה באתחול נכסים: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCleanBrokenLinks = async () => {
    if (!checkAppShaper()) return;
    try {
      setIsResetting(true);
      setError(null);
      
      // Clean invalid links
      const cleaned = { ...siteAssets };
      const checkAndClean = (url: any) => {
        if (typeof url === 'string' && url.includes('assets%2Fui%2Fwetsuit') && !url.includes('token=')) {
          return '';
        }
        return url;
      };

      cleaned.wetsuit43 = checkAndClean(cleaned.wetsuit43);
      cleaned.wetsuit32 = checkAndClean(cleaned.wetsuit32);
      cleaned.wetsuit22 = checkAndClean(cleaned.wetsuit22);
      cleaned.wetsuit22ss = checkAndClean(cleaned.wetsuit22ss);
      cleaned.sunShirt = checkAndClean(cleaned.sunShirt);

      await updateSiteAssets(cleaned);
      setSuccess('הקישורים השבורים נוקו בהצלחה ממסד הנתונים!');
    } catch (err: any) {
      setError('שגיאה בניקוי קישורים: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'staticHero' | 'headers' | 'fonts' | 'loginBg' | 'uiImages' | 'atalefLogo' | 'reefLogo' | 'habalZugLogo' | 'starfish' | 'penguin' | 'mantaRay' | 'shark' | 'orca' | 'cork' | 'wetsuit43' | 'wetsuit32' | 'wetsuit22' | 'wetsuit22ss' | 'sunShirt' | 'surfboardModels' | 'defaultEventImage', fontName?: string) => {
    if (!checkAppShaper()) {
      if (e.target) e.target.value = '';
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setSuccess(null);
    setUploading(type + (fontName || ''));

    try {
      let newAssets = { ...siteAssets };
      let uploadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let path = '';
        if (type === 'staticHero') {
          path = `assets/headers/static_hero_${Date.now()}_${file.name}`;
        } else if (type === 'loginBg') {
          path = `assets/headers/login_bg_${Date.now()}_${file.name}`;
        } else if (type === 'headers') {
          path = `assets/headers/${Date.now()}_${file.name}`;
        } else if (type === 'uiImages') {
          path = `assets/ui/${Date.now()}_${file.name}`;
        } else if (type === 'fonts') {
          path = `assets/fonts/${fontName}_${Date.now()}_${file.name}`;
        } else if (['atalefLogo', 'reefLogo', 'habalZugLogo'].includes(type)) {
          path = `assets/logo/${type}_${Date.now()}_${file.name}`;
        } else {
          path = `assets/ui/${type}_${Date.now()}_${file.name}`;
        }

        let url = '';
        try {
          const storageRef = ref(firebaseStorage, path);
          await uploadBytes(storageRef, file, {
            contentType: file.type,
            customMetadata: {
              uploadedBy: 'admin',
              timestamp: new Date().toISOString()
            }
          });
          url = await getDownloadURL(storageRef);
        } catch (storageErr) {
          console.warn("Storage upload failed or permission denied, using base64 data URL fallback:", storageErr);
          url = await readFileAsDataUrl(file);
        }

        if (type === 'staticHero') {
          newAssets.staticHeroImage = url;
        } else if (type === 'loginBg') {
          newAssets.loginBg = url;
        } else if (type === 'headers') {
          newAssets.headers = [...(newAssets.headers || []), url];
        } else if (type === 'uiImages') {
          newAssets.uiImages = [...(newAssets.uiImages || []), url];
        } else if (type === 'fonts' && fontName) {
          const extension = file.name.split('.').pop()?.toLowerCase();
          const format = extension === 'ttf' ? 'truetype' : extension === 'otf' ? 'opentype' : extension;
          const fontData = { url, name: file.name, format };
          const currentFonts = newAssets.fonts?.[fontName] || [];
          const updatedFonts = Array.isArray(currentFonts) ? [...currentFonts, fontData] : [{ url: currentFonts, name: 'קובץ קודם', format: 'woff' }, fontData];
          newAssets.fonts = { ...(newAssets.fonts || {}), [fontName]: updatedFonts };
        } else if (type === 'surfboardModels' && fontName) {
          newAssets.surfboardModels = { ...(newAssets.surfboardModels || {}), [fontName]: url };
        } else {
          // Handle specific UI assets
          newAssets[type] = url;
        }
        uploadedCount++;
      }

      await updateSiteAssets(newAssets);
      setSuccess(uploadedCount > 1 ? `הועלו ${uploadedCount} קבצים בהצלחה!` : 'הקובץ הועלה בהצלחה!');
    } catch (err: any) {
      setError('שגיאה בהעלאת הקבצים: ' + err.message);
    } finally {
      setUploading(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteClick = (type: any, urlToDelete: string, fontName?: string) => {
    if (!checkAppShaper()) return;
    setAssetToDelete({ type, url: urlToDelete, fontName });
  };

  const confirmDelete = async () => {
    if (!checkAppShaper()) return;
    if (!assetToDelete) return;
    const { type, url: urlToDelete, fontName } = assetToDelete;
    setAssetToDelete(null);

    setError(null);
    setSuccess(null);

    try {
      try {
        const storageRef = ref(firebaseStorage, urlToDelete);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn('File might not exist in storage or invalid URL, removing from DB anyway', e);
      }

      let newAssets = { ...siteAssets };
      if (type === 'staticHero') {
        newAssets.staticHeroImage = null;
      } else if (type === 'loginBg') {
        newAssets.loginBg = null;
      } else if (type === 'headers') {
        newAssets.headers = (newAssets.headers || []).filter((url: string) => url !== urlToDelete);
      } else if (type === 'uiImages') {
        newAssets.uiImages = (newAssets.uiImages || []).filter((url: string) => url !== urlToDelete);
      } else if (type === 'fonts' && fontName) {
        const currentFonts = siteAssets?.fonts?.[fontName] || [];
        newAssets.fonts = { ...newAssets.fonts }; // Prevent direct mutation
        if (Array.isArray(currentFonts)) {
          newAssets.fonts[fontName] = currentFonts.filter((f: any) => f.url !== urlToDelete);
        } else {
          newAssets.fonts[fontName] = [];
        }
      } else if (type === 'surfboardModels' && fontName) {
        newAssets.surfboardModels = { ...newAssets.surfboardModels }; // Prevent direct mutation
        newAssets.surfboardModels[fontName] = null;
      } else {
        // Handle specific UI assets
        newAssets[type] = null;
      }

      await updateSiteAssets(newAssets);
      setSuccess('הנכס הוסר בהצלחה!');
    } catch (err: any) {
      setError('שגיאה במחיקת הנכס: ' + err.message);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Read-Only Notice Banner for non-AppShapers */}
      {!isAppShaper && (
        <div 
          onClick={() => setShowReadOnlyNotice(true)}
          className="cursor-pointer bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-300/60 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-900 shadow-xs hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
              👀
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 flex items-center gap-2">
                <span>פה מסתכלים, לא נוגעים 👀</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded-full">צפייה בלבד</span>
              </p>
              <p className="text-xs font-bold text-amber-700/90 mt-0.5">עריכה ושינוי של נכסי האתר והעיצוב מורשים אך ורק למשתמשי אפ-שייפר.</p>
            </div>
          </div>
          <button 
            type="button"
            className="text-xs font-black px-3.5 py-1.5 bg-amber-100 group-hover:bg-amber-200 text-amber-900 rounded-xl transition-all shrink-0 border border-amber-200"
          >
            פרטים
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">ניהול נכסים ועיצוב</h2>
          <p className="text-slate-500 mt-1 font-medium">נהל את התמונות, הפונטים והאלמנטים הגרפיים של האתר ממסד הנתונים</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleCleanBrokenLinks}
            disabled={isResetting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={15} className={isResetting ? "animate-spin text-sky-500" : "text-sky-500"} />
            נקה קישורים ישנים
          </button>
          <button
            onClick={handleResetAssetsClick}
            disabled={isResetting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isResetting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} className="text-amber-400" />}
            אתחל נכסי ברירת מחדל
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700">
          <AlertTriangle size={20} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
          <CheckCircle size={20} />
          <span className="font-bold">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <ImageIcon className="text-sky-500" size={24} />
            <h3 className="text-xl font-bold text-slate-800">תמונות רקע (Headers)</h3>
          </div>

          {/* Static Hero Image */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-700">תמונת רקע ראשית (דף הבית)</h4>
            <p className="text-sm text-slate-500">תמונה זו תוצג בראש דף הבית.</p>
            
            <AssetImage 
              url={siteAssets?.staticHeroImage} 
              alt="Static Hero" 
              className="h-48"
              aspect="cover"
              onDelete={() => handleDeleteClick('staticHero', siteAssets.staticHeroImage)}
            />
            
            <div>
              <input
                type="file"
                id="upload-static-hero"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleUpload(e, 'staticHero')}
                disabled={uploading !== null}
              />
              <label
                htmlFor="upload-static-hero"
                onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-black text-sm shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/20 backdrop-blur-sm"
              >
                {uploading === 'staticHero' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                העלה תמונה ראשית
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Login Background */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-700">תמונת רקע למסך כניסה (Login)</h4>
            <p className="text-sm text-slate-500">תמונה זו תוצג ברקע של מסך ההתחברות.</p>
            
            <AssetImage 
              url={siteAssets?.loginBg} 
              alt="Login Background" 
              className="h-48"
              aspect="cover"
              onDelete={() => handleDeleteClick('loginBg', siteAssets.loginBg)}
            />
            
            <div>
              <input
                type="file"
                id="upload-login-bg"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleUpload(e, 'loginBg')}
                disabled={uploading !== null}
              />
              <label
                htmlFor="upload-login-bg"
                onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-black text-sm shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/20 backdrop-blur-sm"
              >
                {uploading === 'loginBg' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                העלה תמונת כניסה
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Random Headers */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-700">תמונות רקע מתחלפות (דפים פנימיים)</h4>
            <p className="text-sm text-slate-500">תמונות אלו יוצגו באופן אקראי בדפים הפנימיים.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {siteAssets?.headers?.map((url: string, index: number) => (
                <AssetImage 
                  key={index}
                  url={url} 
                  alt={`Header ${index + 1}`} 
                  className="h-24"
                  aspect="cover"
                  onDelete={() => handleDeleteClick('headers', url)}
                />
              ))}
            </div>
            
            <div>
              <input
                type="file"
                id="upload-header"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleUpload(e, 'headers')}
                disabled={uploading !== null}
                multiple
              />
              <label
                htmlFor="upload-header"
                onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-black text-sm shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/20 backdrop-blur-sm"
              >
                {uploading === 'headers' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                הוסף תמונת רקע
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* General UI Images */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-700">תמונות UI כלליות</h4>
            <p className="text-sm text-slate-500">תמונות עבור רכיבי ממשק כלליים.</p>
            
            <div className="grid grid-cols-3 gap-4">
              {siteAssets?.uiImages?.map((url: string, index: number) => (
                <AssetImage 
                  key={index}
                  url={url} 
                  alt={`UI Image ${index + 1}`} 
                  className="h-20"
                  aspect="contain"
                  onDelete={() => handleDeleteClick('uiImages', url)}
                />
              ))}
            </div>
            
            <div>
              <input
                type="file"
                id="upload-ui-image"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleUpload(e, 'uiImages')}
                disabled={uploading !== null}
                multiple
              />
              <label
                htmlFor="upload-ui-image"
                onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-black text-sm shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/20 backdrop-blur-sm"
              >
                {uploading === 'uiImages' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                הוסף תמונת UI
              </label>
            </div>
          </div>

          {/* Specific UI Assets Section */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <Sparkles className="text-sky-500" size={24} />
              <h3 className="text-xl font-bold text-slate-800">לוגואים ונכסי מותג</h3>
            </div>

            {/* Logos & General Assets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { id: 'habalZugLogo', label: 'לוגו חבל זוג' },
                { id: 'atalefLogo', label: 'לוגו עמותת העטלף' },
                { id: 'reefLogo', label: 'לוגו Reef' },
                { id: 'defaultEventImage', label: 'תמונת אירוע ברירת מחדל' }
              ].map(asset => (
                <div key={asset.id} className="space-y-2">
                  <p className="font-bold text-sm text-slate-700">{asset.label}</p>
                  <AssetImage 
                    url={siteAssets?.[asset.id]} 
                    alt={asset.label} 
                    className="h-24"
                    aspect="contain"
                    onDelete={() => handleDeleteClick(asset.id as any, siteAssets[asset.id])}
                  />
                  <input
                    type="file"
                    id={`upload-${asset.id}`}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, asset.id as any)}
                    disabled={uploading !== null}
                  />
                  <label
                    htmlFor={`upload-${asset.id}`}
                    onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-black text-xs shadow-md shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/20 w-full"
                  >
                    {uploading === asset.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    העלה לוגו
                  </label>
                </div>
              ))}
            </div>

            <hr className="border-slate-100" />

            {/* Ocean Journey Animals */}
            <h4 className="font-bold text-slate-700">חיות ים (Ocean Journey)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'starfish', label: 'כוכב ים' },
                { id: 'penguin', label: 'פינגווין' },
                { id: 'mantaRay', label: 'מנטה ריי' },
                { id: 'shark', label: 'כריש' },
                { id: 'orca', label: 'אורקה' },
                { id: 'cork', label: 'פקק (Cork)' }
              ].map(asset => (
                <div key={asset.id} className="space-y-2">
                  <p className="font-bold text-xs text-slate-600">{asset.label}</p>
                  <AssetImage 
                    url={siteAssets?.[asset.id]} 
                    alt={asset.label} 
                    className="h-20"
                    aspect="contain"
                    onDelete={() => handleDeleteClick(asset.id as any, siteAssets[asset.id])}
                  />
                  <input
                    type="file"
                    id={`upload-${asset.id}`}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, asset.id as any)}
                    disabled={uploading !== null}
                  />
                  <label
                    htmlFor={`upload-${asset.id}`}
                    onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-md hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-bold text-[10px] shadow-sm shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-px active:translate-y-0 active:scale-95 border border-white/20 w-full"
                  >
                    {uploading === asset.id ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                    העלה
                  </label>
                </div>
              ))}
            </div>

            <hr className="border-slate-100" />

            {/* Wetsuits */}
            <h4 className="font-bold text-slate-700">חליפות גלישה</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { id: 'wetsuit43', label: '4/3' },
                { id: 'wetsuit32', label: '3/2' },
                { id: 'wetsuit22', label: '2/2' },
                { id: 'wetsuit22ss', label: '2/2 SS' },
                { id: 'sunShirt', label: 'חולצת שמש' }
              ].map(asset => (
                <div key={asset.id} className="space-y-2">
                  <p className="font-bold text-xs text-slate-600">{asset.label}</p>
                  <AssetImage 
                    url={siteAssets?.[asset.id]} 
                    alt={asset.label} 
                    className="h-24"
                    aspect="contain"
                    onDelete={() => handleDeleteClick(asset.id as any, siteAssets[asset.id])}
                  />
                  <input
                    type="file"
                    id={`upload-${asset.id}`}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, asset.id as any)}
                    disabled={uploading !== null}
                  />
                  <label
                    htmlFor={`upload-${asset.id}`}
                    onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-md hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-bold text-[10px] shadow-sm shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-px active:translate-y-0 active:scale-95 border border-white/20 w-full"
                  >
                    {uploading === asset.id ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                    העלה
                  </label>
                </div>
              ))}
            </div>

            <hr className="border-slate-100" />

            {/* Surfboard Models */}
            <h4 className="font-bold text-slate-700">דגמי גלשנים</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {SURFBOARD_CATALOG.map(board => (
                <div key={board.type} className="space-y-2">
                  <p className="font-bold text-xs text-slate-600">{board.name}</p>
                  <AssetImage 
                    url={siteAssets?.surfboardModels?.[board.type]} 
                    alt={board.name} 
                    className="h-24"
                    aspect="contain"
                    onDelete={() => handleDeleteClick('surfboardModels', siteAssets.surfboardModels[board.type], board.type)}
                  />
                  <input
                    type="file"
                    id={`upload-board-${board.type}`}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, 'surfboardModels', board.type)}
                    disabled={uploading !== null}
                  />
                  <label
                    htmlFor={`upload-board-${board.type}`}
                    onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-md hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-bold text-[10px] shadow-sm shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-px active:translate-y-0 active:scale-95 border border-white/20 w-full"
                  >
                    {uploading === 'surfboardModels' + board.type ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                    העלה
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fonts Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Type className="text-sky-500" size={24} />
            <h3 className="text-xl font-bold text-slate-800">פונטים מותאמים אישית</h3>
          </div>
          <p className="text-sm text-slate-500">
            העלה את קבצי הפונטים שרכשת (.woff, .woff2, .ttf, .otf). לאחר ההעלאה, הפונטים ייטענו אוטומטית באתר.
          </p>

          <div className="space-y-6">
            {[
              { id: 'yehudaLight', label: 'Yehuda CLM (Light)' },
              { id: 'yehudaBold', label: 'Yehuda CLM (Bold)' },
              { id: 'miriwin', label: 'Miriwin' },
              { id: 'danaYad', label: 'Dana Yad Alef Alef' }
            ].map(font => {
              const fontFiles = siteAssets?.fonts?.[font.id];
              const filesArray = Array.isArray(fontFiles) ? fontFiles : (fontFiles ? [{ url: fontFiles, name: 'קובץ קודם', format: 'woff' }] : []);
              
              return (
                <div key={font.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-700">{font.label}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {filesArray.length > 0 ? `${filesArray.length} קבצים הועלו` : 'לא הועלו קבצים'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`upload-font-${font.id}`}
                        className="hidden"
                        accept=".woff,.woff2,.ttf,.eot,.otf"
                        onChange={(e) => handleUpload(e, 'fonts', font.id)}
                        disabled={uploading !== null}
                        multiple
                      />
                      <label
                        htmlFor={`upload-font-${font.id}`}
                        onClick={(e) => { if (!checkAppShaper()) { e.preventDefault(); } }}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 font-black text-sm shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-white/20"
                      >
                        {uploading === 'fonts' + font.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        הוסף קבצים
                      </label>
                    </div>
                  </div>

                  {filesArray.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      {filesArray.map((file: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                          <span className="font-medium text-slate-600 truncate max-w-[150px]">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">{file.format}</span>
                            <button
                              onClick={() => handleDeleteClick('fonts', file.url, font.id)}
                              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-all duration-300 hover:shadow-md hover:shadow-rose-500/30 active:scale-95"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Backups Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black">גיבוי ושחזור</h2>
                <p className="text-slate-500 text-sm mt-1">נהל גיבויים אוטומטיים של כל הנכסים למניעת אובדן מידע</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowBackups(!showBackups);
                if (!showBackups) loadBackups();
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {showBackups ? 'הסתר גיבויים' : 'הצג גיבויים אחרונים'}
            </button>
          </div>

          {showBackups && (
            <div className="space-y-4 border-t border-slate-100 pt-6">
              {loadingBackups ? (
                <div className="flex items-center justify-center p-8 text-slate-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl">
                  לא נמצאו גיבויים. מערכת הגיבוי שומרת גרסה חדשה בכל פעם שמתבצע עדכון לנכסים.
                </div>
              ) : (
                <div className="grid gap-3">
                  {backups.map(backup => (
                    <div key={backup.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <div className="font-bold text-slate-700">גיבוי אוטומטי</div>
                        <div className="text-sm text-slate-500">{new Date(backup._backupTimestamp).toLocaleString('he-IL')}</div>
                      </div>
                      <button
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={restoringBackupId === backup.id}
                        className="mt-3 sm:mt-0 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-sm font-bold shadow-sm shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {restoringBackupId === backup.id ? <Loader2 size={16} className="animate-spin" /> : null}
                        שחזר מגיבוי זה
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 text-rose-500">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">מחיקת נכס</h3>
            </div>
            <p className="text-slate-600">
              האם אתה בטוח שברצונך להסיר נכס זה? פעולה זו תעדכן את מסד הנתונים.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAssetToDelete(null)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-bold shadow-sm shadow-rose-500/20 transition-colors"
              >
                הסר נכס
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 text-amber-500">
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">אתחול נכסי ברירת מחדל</h3>
            </div>
            <p className="text-slate-600">
              האם אתה בטוח שברצונך לאתחל את נכסי ברירת המחדל? פעולה זו תעדכן את מסד הנתונים עם ערכי הבסיס.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={confirmResetAssets}
                className="px-5 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl font-bold shadow-sm shadow-amber-500/20 transition-colors"
              >
                אתחל נכסים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read Only Notice Modal */}
      <ReadOnlyNoticeModal 
        isOpen={showReadOnlyNotice} 
        onClose={() => setShowReadOnlyNotice(false)} 
      />
    </div>
  );
};
