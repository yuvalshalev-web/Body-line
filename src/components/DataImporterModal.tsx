import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  Table as TableIcon,
  Database,
  ChevronRight,
  Loader2,
  Download
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface DataImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'members' | 'sessions';
  onImport: (data: any[]) => Promise<void>;
}

const MEMBER_FIELDS = [
  { key: 'firstName', label: 'שם פרטי', required: true },
  { key: 'lastName', label: 'שם משפחה', required: true },
  { key: 'email', label: 'אימייל', required: true },
  { key: 'mobile', label: 'טלפון', required: true },
  { key: 'role', label: 'תפקיד', required: false, default: 'Member' },
  { key: 'joinedAt', label: 'תאריך הצטרפות', required: false, default: new Date().toISOString().split('T')[0] },
  { key: 'gender', label: 'מגדר', required: false },
  { key: 'birthday', label: 'תאריך לידה', required: false },
  { key: 'bio', label: 'ביוגרפיה', required: false },
  { key: 'isActive', label: 'פעיל', required: false, default: true },
];

const SESSION_FIELDS = [
  { key: 'date', label: 'תאריך', required: true },
  { key: 'participantNames', label: 'שמות משתתפים (שם מלא, מופרדים בפסיק)', required: true },
  { key: 'windSpeed', label: 'מהירות רוח', required: false },
  { key: 'waterTemp', label: 'טמפרטורת מים', required: false },
  { key: 'location', label: 'מיקום', required: false, default: 'חוף הדרומי' },
];

export const DataImporterModal: React.FC<DataImporterModalProps> = ({ isOpen, onClose, type, onImport }) => {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'processing'>('upload');
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fields = type === 'members' ? MEMBER_FIELDS : SESSION_FIELDS;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              setRawData(results.data);
              setHeaders(Object.keys(results.data[0] as Record<string, any>));
              autoMap(Object.keys(results.data[0] as Record<string, any>));
              setStep('map');
            }
          },
          error: (err) => setError('שגיאה בקריאת קובץ ה-CSV: ' + err.message)
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        if (data && data.length > 0) {
          setRawData(data);
          setHeaders(Object.keys(data[0] as Record<string, any>));
          autoMap(Object.keys(data[0] as Record<string, any>));
          setStep('map');
        }
      } else {
        setError('פורמט קובץ לא נתמך. אנא השתמש ב-CSV או Excel.');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const autoMap = (fileHeaders: string[]) => {
    const newMapping: Record<string, string> = {};
    fields.forEach(field => {
      const match = fileHeaders.find(h => 
        h.toLowerCase().trim() === field.label.toLowerCase().trim() ||
        h.toLowerCase().trim() === field.key.toLowerCase().trim()
      );
      if (match) newMapping[field.key] = match;
    });
    setMapping(newMapping);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const processedData = rawData.map(row => {
        const item: any = {};
        fields.forEach(field => {
          const mappedHeader = mapping[field.key];
          if (mappedHeader) {
            item[field.key] = row[mappedHeader];
          } else if (field.default !== undefined) {
            item[field.key] = field.default;
          }
        });
        return item;
      });

      await onImport(processedData);
      onClose();
      reset();
    } catch (err: any) {
      setError('שגיאה במהלך הייבוא: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setRawData([]);
    setHeaders([]);
    setMapping({});
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-[#fdfdfd] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${type === 'members' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
              <Database size={28} />
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-black text-slate-900 leading-tight">
                {type === 'members' ? 'ייבוא חברים למערכת' : 'ייבוא סשנים היסטוריים'}
              </h3>
              <p className="text-sm text-slate-500 font-bold">
                {step === 'upload' && 'העלה קובץ CSV או Excel להתחלת התהליך'}
                {step === 'map' && 'התאם בין עמודות הקובץ לשדות המערכת'}
                {step === 'preview' && 'בדוק את הנתונים לפני האישור הסופי'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-lg aspect-video border-4 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-6 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
              >
                <div className="p-6 bg-slate-50 rounded-full text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                  <Upload size={48} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-slate-900 mb-2">גרור קובץ לכאן או לחץ לבחירה</p>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">CSV, XLSX, XLS</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                />
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4 text-slate-900">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <h4 className="font-black">טיפים לייבוא מוצלח</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-500 font-bold list-disc list-inside">
                    <li>ודא שהשורה הראשונה מכילה כותרות</li>
                    <li>אימייל הוא שדה חובה וייחודי</li>
                    <li>תאריכים צריכים להיות בפורמט YYYY-MM-DD</li>
                  </ul>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4 text-slate-900">
                    <Download size={20} className="text-blue-500" />
                    <h4 className="font-black">תבניות לדוגמה</h4>
                  </div>
                  <p className="text-sm text-slate-500 font-bold mb-4">הורד תבנית מוכנה כדי להבטיח התאמה מלאה</p>
                  <button className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1">
                    הורד תבנית {type === 'members' ? 'חברים' : 'סשנים'} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4">
                {fields.map(field => (
                  <div key={field.key} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${field.required ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      <div>
                        <h4 className="font-black text-slate-900">
                          {field.label}
                          {field.required && <span className="text-rose-500 mr-1">*</span>}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">System Field: {field.key}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <ArrowRight size={20} className="text-slate-300" />
                      <select 
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
                      >
                        <option value="">-- בחר עמודה מהקובץ --</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4 pt-8">
                <button 
                  onClick={() => setStep('upload')}
                  className="px-8 py-4 text-slate-500 font-black hover:bg-slate-100 rounded-2xl transition-all"
                >
                  חזור
                </button>
                <button 
                  onClick={() => setStep('preview')}
                  className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:shadow-slate-900/20 transition-all active:scale-95"
                >
                  המשך לתצוגה מקדימה
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {fields.map(f => (
                          <th key={f.key} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rawData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          {fields.map(f => (
                            <td key={f.key} className="px-6 py-4 text-sm font-bold text-slate-600">
                              {row[mapping[f.key]] || f.default || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rawData.length > 5 && (
                  <div className="p-4 bg-slate-50/50 text-center text-xs font-bold text-slate-400 italic">
                    מציג 5 שורות ראשונות מתוך {rawData.length}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-8">
                <button 
                  onClick={() => setStep('map')}
                  className="px-8 py-4 text-slate-500 font-black hover:bg-slate-100 rounded-2xl transition-all"
                >
                  חזור למיפוי
                </button>
                <button 
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  <span>אשר וייבא {rawData.length} שורות</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
