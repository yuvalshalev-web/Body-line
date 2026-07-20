import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { Member } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useModal } from '../../contexts/ModalContext';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportMembersModal({ isOpen, onClose }: ImportMembersModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMember, members } = useData();
  const { showSuccess, showError } = useModal();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setImportResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        for (const row of results.data as any[]) {
          try {
            // Basic validation
            if (!row.firstName || !row.lastName || !row.email) {
              failedCount++;
              errors.push(`שורה חסרה פרטי חובה (שם, משפחה או אימייל): ${JSON.stringify(row)}`);
              continue;
            }

            // Check if email already exists
            const emailExists = members.some(m => m.email.toLowerCase() === row.email.trim().toLowerCase());
            if (emailExists) {
              failedCount++;
              errors.push(`אימייל כבר קיים במערכת: ${row.email}`);
              continue;
            }

            // Map CSV row to Member object
            const newMember: Omit<Member, "id"> = {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              email: row.email.trim().toLowerCase(),
              role: row.role === 'Admin' || row.role === 'Instructor' ? row.role : 'Member',
              mobile: row.mobile ? row.mobile.trim() : '',
              gender: row.gender === 'זכר' || row.gender === 'נקבה' || row.gender === 'לא בינארי' ? row.gender : 'מעדיף/ה לא לציין',
              birthday: row.birthDate || '',
              full_address: row.address || '',
              city: row.city || '',
              bio: row.bio || '',
              isActive: true,
              joinedAt: new Date().toISOString(),
              totalAttendance: 0,
              loginCount: 0,
              avatar: '',
              instagramUrl: '',
              facebookUrl: '',
              linkedinUrl: '',
              twitterUrl: '',
              password: ''
            };

            await addMember(newMember);
            successCount++;
          } catch (err: any) {
            failedCount++;
            errors.push(`שגיאה בייבוא ${row.email}: ${err.message}`);
          }
        }

        setImportResults({ success: successCount, failed: failedCount, errors });
        setIsImporting(false);
        
        if (successCount > 0) {
          showSuccess(`יובאו בהצלחה ${successCount} משתמשים חדשים`);
        }
      },
      error: (error) => {
        showError(`שגיאה בקריאת הקובץ: ${error.message}`);
        setIsImporting(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <Upload size={24} className="text-blue-500" />
              ייבוא משתמשים מקובץ CSV
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8">
            {!importResults ? (
              <div className="space-y-6">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium">
                  <p className="mb-2 font-bold">הנחיות לקובץ CSV:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>הקובץ חייב לכלול שורת כותרות (Header row).</li>
                    <li>שדות חובה: <code className="bg-blue-100 px-1 rounded">firstName</code>, <code className="bg-blue-100 px-1 rounded">lastName</code>, <code className="bg-blue-100 px-1 rounded">email</code>.</li>
                    <li>שדות אופציונליים: <code className="bg-blue-100 px-1 rounded">mobile</code>, <code className="bg-blue-100 px-1 rounded">role</code> (Admin/Instructor/User), <code className="bg-blue-100 px-1 rounded">gender</code> (זכר/נקבה/לא בינארי/מעדיף/ה לא לציין), <code className="bg-blue-100 px-1 rounded">birthDate</code>, <code className="bg-blue-100 px-1 rounded">address</code>, <code className="bg-blue-100 px-1 rounded">city</code>.</li>
                  </ul>
                </div>

                <div 
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  {file ? (
                    <div>
                      <p className="text-lg font-bold text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-bold text-gray-800">לחץ לבחירת קובץ CSV</p>
                      <p className="text-sm text-gray-500">או גרור ושחרר את הקובץ לכאן</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!file || isImporting}
                    className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isImporting ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    {isImporting ? 'מייבא...' : 'התחל ייבוא'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-6 rounded-2xl text-center border border-green-100">
                    <CheckCircle2 size={40} className="mx-auto text-green-500 mb-2" />
                    <p className="text-3xl font-black text-green-700">{importResults.success}</p>
                    <p className="text-green-600 font-bold">יובאו בהצלחה</p>
                  </div>
                  <div className={`p-6 rounded-2xl text-center border ${importResults.failed > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <AlertCircle size={40} className={`mx-auto mb-2 ${importResults.failed > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                    <p className={`text-3xl font-black ${importResults.failed > 0 ? 'text-red-700' : 'text-gray-600'}`}>{importResults.failed}</p>
                    <p className={`font-bold ${importResults.failed > 0 ? 'text-red-600' : 'text-gray-500'}`}>נכשלו</p>
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 max-h-48 overflow-y-auto">
                    <p className="font-bold text-red-800 mb-2">פירוט שגיאות:</p>
                    <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                      {importResults.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors"
                  >
                    סיום
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
