
import React, { useState } from 'react';
import { RotateCcw, Camera, Loader2, Settings, ExternalLink, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssetEditorProps {
  siteAssets: Record<string, any>;
  assetLabels: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<void>;
  onUpload: (key: string, file: File) => Promise<void>;
  onReset: () => Promise<void>;
  isUploading: string | null;
}

const AssetEditor: React.FC<AssetEditorProps> = ({ 
  siteAssets, 
  assetLabels, 
  onUpdate, 
  onUpload, 
  onReset,
  isUploading 
}) => {
  const [editingAsset, setEditingAsset] = useState<{ key: string, value: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [replacingKey, setReplacingKey] = useState<string | null>(null);

  return (
    <div className="luxury-slab rounded-[4rem] p-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-500 text-white rounded-2xl shadow-lg"><RotateCcw size={24} /></div>
          <div>
            <h3 className="text-2xl font-black text-[#4a002e]">הגדרות ונכסי אתר</h3>
            <p className="text-[#f063c1]/60 font-bold">צפייה ועדכון הנכסים הוויזואליים של המערכת</p>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="px-6 py-3 luxury-card text-[#ff009f] rounded-2xl font-black text-xs hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95"
        >
          <RotateCcw size={14} />
          איפוס לברירת מחדל
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(siteAssets || {}).map(([key, value]: [string, any]) => (
          <div key={key} className="p-6 luxury-card rounded-[2rem] flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 luxury-slab rounded-2xl flex items-center justify-center overflow-hidden relative group/avatar">
                {typeof value === 'string' && value.startsWith('http') ? (
                  <img src={value} className="w-full h-full object-contain p-2" alt="" />
                ) : (
                  <span className="text-[#f063c1]/40 font-black text-[12px] uppercase">{key.slice(0, 2)}</span>
                )}
                
                <button 
                  onClick={() => {
                    setReplacingKey(key);
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading === key}
                  className="absolute inset-0 bg-[#4a002e]/40 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all disabled:opacity-100"
                >
                  {isUploading === key ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Camera size={20} />
                  )}
                </button>
              </div>
              <div>
                <p className="text-[12px] font-black text-[#ff009f] uppercase tracking-widest mb-1">{key}</p>
                <h4 className="text-lg font-black text-[#4a002e]">{assetLabels[key] || key}</h4>
                <p className="text-[12px] font-bold text-[#f063c1]/40 truncate max-w-[180px]">{typeof value === 'string' ? value : 'נתון מורכב'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setEditingAsset({ key, value: typeof value === 'string' ? value : '' })}
                className="p-2 text-[#f063c1]/20 hover:text-[#ff009f] opacity-0 group-hover:opacity-100 transition-all"
              >
                <Settings size={16} />
              </button>
              {typeof value === 'string' && value.startsWith('http') && (
                <a href={value} target="_blank" rel="noreferrer" className="p-2 text-[#f063c1]/20 hover:text-[#4a002e] opacity-0 group-hover:opacity-100 transition-all">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <input 
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replacingKey) {
            onUpload(replacingKey, file);
          }
        }}
        accept="image/*"
        className="hidden"
      />

      <AnimatePresence>
        {editingAsset && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 luxury-bg backdrop-blur-md animate-in fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="luxury-slab w-full max-w-lg rounded-[3.5rem] p-10"
            >
              <h3 className="text-2xl font-black text-[#4a002e] mb-2">עדכון נכס: {editingAsset.key}</h3>
              <p className="text-[#f063c1]/60 font-bold text-sm mb-8">הזן כתובת URL חדשה עבור הנכס</p>
              
              <div className="space-y-6 mb-10">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-[#f063c1]/60 uppercase tracking-widest mr-4">כתובת URL</label>
                  <input 
                    type="text"
                    value={editingAsset.value}
                    onChange={(e) => setEditingAsset({ ...editingAsset, value: e.target.value })}
                    className="w-full p-5 luxury-card rounded-2xl font-black text-[#4a002e] outline-none focus:ring-2 ring-[#ff009f]/20 transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setEditingAsset(null)}
                  className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                >
                  ביטול
                </button>
                <button 
                  onClick={async () => {
                    await onUpdate(editingAsset.key, editingAsset.value);
                    setEditingAsset(null);
                  }}
                  className="py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  שמור שינויים
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetEditor;
