import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { storage as firebaseStorage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { Upload, Trash2, Image as ImageIcon, Type, Loader2, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

import { SURFBOARD_CATALOG } from '../data/surfboardCatalog';

export const AdminAssets: React.FC = () => {
  const { siteAssets, updateSiteAssets } = useData();
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'staticHero' | 'headers' | 'fonts' | 'loginBg' | 'uiImages' | 'atalefLogo' | 'reefLogo' | 'habalZugLogo' | 'starfish' | 'penguin' | 'mantaRay' | 'shark' | 'orca' | 'cork' | 'wetsuit43' | 'wetsuit32' | 'wetsuit22' | 'wetsuit22ss' | 'sunShirt' | 'surfboardModels' | 'defaultEventImage', fontName?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setUploading(type + (fontName || ''));

    try {
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

      const storageRef = ref(firebaseStorage, path);
      await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: 'admin',
          timestamp: new Date().toISOString()
        }
      });
      const url = await getDownloadURL(storageRef);

      let newAssets = { ...siteAssets };
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
        const currentFonts = siteAssets?.fonts?.[fontName] || [];
        const updatedFonts = Array.isArray(currentFonts) ? [...currentFonts, fontData] : [{ url: currentFonts, name: 'קובץ קודם', format: 'woff' }, fontData];
        newAssets.fonts = { ...(newAssets.fonts || {}), [fontName]: updatedFonts };
      } else if (type === 'surfboardModels' && fontName) {
        newAssets.surfboardModels = { ...(newAssets.surfboardModels || {}), [fontName]: url };
      } else {
        // Handle specific UI assets
        newAssets[type] = url;
      }

      await updateSiteAssets(newAssets);
      setSuccess('הקובץ הועלה בהצלחה!');
    } catch (err: any) {
      setError('שגיאה בהעלאת הקובץ: ' + err.message);
    } finally {
      setUploading(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (type: 'staticHero' | 'headers' | 'fonts' | 'loginBg' | 'uiImages' | 'atalefLogo' | 'reefLogo' | 'habalZugLogo' | 'starfish' | 'penguin' | 'mantaRay' | 'shark' | 'orca' | 'cork' | 'wetsuit43' | 'wetsuit32' | 'wetsuit22' | 'wetsuit22ss' | 'sunShirt' | 'surfboardModels' | 'defaultEventImage', urlToDelete: string, fontName?: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק קובץ זה?')) return;

    setError(null);
    setSuccess(null);

    try {
      const storageRef = ref(firebaseStorage, urlToDelete);
      
      try {
        await deleteObject(storageRef);
      } catch (e) {
        console.warn('File might not exist in storage, removing from DB anyway', e);
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
        if (Array.isArray(currentFonts)) {
          newAssets.fonts[fontName] = currentFonts.filter((f: any) => f.url !== urlToDelete);
          if (newAssets.fonts[fontName].length === 0) {
            delete newAssets.fonts[fontName];
          }
        } else {
          const newFonts = { ...newAssets.fonts };
          delete newFonts[fontName];
          newAssets.fonts = newFonts;
        }
      } else if (type === 'surfboardModels' && fontName) {
        const newModels = { ...newAssets.surfboardModels };
        delete newModels[fontName];
        newAssets.surfboardModels = newModels;
      } else {
        // Handle specific UI assets
        newAssets[type] = null;
      }

      await updateSiteAssets(newAssets);
      setSuccess('הקובץ נמחק בהצלחה!');
    } catch (err: any) {
      setError('שגיאה במחיקת הקובץ: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-800">ניהול נכסים ופונטים</h2>
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
            <p className="text-sm text-slate-500">תמונה זו תוצג בראש דף הבית (header_1.jpeg).</p>
            
            {siteAssets?.staticHeroImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                <img src={siteAssets.staticHeroImage} alt="Static Hero" className="w-full h-48 object-cover" />
                <button
                  onClick={() => handleDelete('staticHero', siteAssets.staticHeroImage)}
                  className="absolute top-2 left-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                <p className="text-slate-500 mb-4">לא הוגדרה תמונה ראשית</p>
              </div>
            )}
            
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
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm"
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
            
            {siteAssets?.loginBg ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                <img src={siteAssets.loginBg} alt="Login Background" className="w-full h-48 object-cover" />
                <button
                  onClick={() => handleDelete('loginBg', siteAssets.loginBg)}
                  className="absolute top-2 left-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                <p className="text-slate-500 mb-4">לא הוגדרה תמונת כניסה (יוצג רקע אקראי)</p>
              </div>
            )}
            
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
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm"
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
                <div key={index} className="relative rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={url} alt={`Header ${index + 1}`} className="w-full h-24 object-cover" />
                  <button
                    onClick={() => handleDelete('headers', url)}
                    className="absolute top-2 left-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
              />
              <label
                htmlFor="upload-header"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm"
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
            <p className="text-sm text-slate-500">תמונות עבור רכיבי ממשק (בעלי חיים, ציוד וכו').</p>
            
            <div className="grid grid-cols-3 gap-4">
              {siteAssets?.uiImages?.map((url: string, index: number) => (
                <div key={index} className="relative rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={url} alt={`UI Image ${index + 1}`} className="w-full h-20 object-cover" />
                  <button
                    onClick={() => handleDelete('uiImages', url)}
                    className="absolute top-1 left-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
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
              />
              <label
                htmlFor="upload-ui-image"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm"
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
              <h3 className="text-xl font-bold text-slate-800">נכסי UI ספציפיים</h3>
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
                  {siteAssets?.[asset.id] ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 group h-24">
                      <img src={siteAssets[asset.id]} alt={asset.label} className="w-full h-full object-contain p-2" />
                      <button
                        onClick={() => handleDelete(asset.id as any, siteAssets[asset.id])}
                        className="absolute top-1 left-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      חסר
                    </div>
                  )}
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
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-bold text-xs w-full justify-center"
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
                  {siteAssets?.[asset.id] ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 group h-20">
                      <img src={siteAssets[asset.id]} alt={asset.label} className="w-full h-full object-contain p-1" />
                      <button
                        onClick={() => handleDelete(asset.id as any, siteAssets[asset.id])}
                        className="absolute top-1 left-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-[10px]">
                      חסר
                    </div>
                  )}
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
                    className="cursor-pointer inline-flex items-center gap-2 px-2 py-1 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors font-bold text-[10px] w-full justify-center border border-slate-100"
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
                  {siteAssets?.[asset.id] ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 group h-24">
                      <img src={siteAssets[asset.id]} alt={asset.label} className="w-full h-full object-contain p-1" />
                      <button
                        onClick={() => handleDelete(asset.id as any, siteAssets[asset.id])}
                        className="absolute top-1 left-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-[10px]">
                      חסר
                    </div>
                  )}
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
                    className="cursor-pointer inline-flex items-center gap-2 px-2 py-1 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors font-bold text-[10px] w-full justify-center border border-slate-100"
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
                  {siteAssets?.surfboardModels?.[board.type] ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 group h-24">
                      <img src={siteAssets.surfboardModels[board.type]} alt={board.name} className="w-full h-full object-contain p-1" />
                      <button
                        onClick={() => handleDelete('surfboardModels', siteAssets.surfboardModels[board.type], board.type)}
                        className="absolute top-1 left-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-[10px]">
                      חסר
                    </div>
                  )}
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
                    className="cursor-pointer inline-flex items-center gap-2 px-2 py-1 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors font-bold text-[10px] w-full justify-center border border-slate-100"
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
            העלה את קבצי הפונטים שרכשת (.woff, .ttf, .eot). לאחר ההעלאה, הפונטים ייטענו אוטומטית באתר.
            <br/><br/>
            <strong>הערה חשובה:</strong> יש לוודא שמוגדר CORS ב-Firebase Storage כדי שהפונטים ייטענו כראוי.
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
                      />
                      <label
                        htmlFor={`upload-font-${font.id}`}
                        className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-bold text-sm"
                      >
                        {uploading === 'fonts' + font.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        הוסף קובץ
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
                              onClick={() => handleDelete('fonts', file.url, font.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
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
      </div>
    </div>
  );
};
