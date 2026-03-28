import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Event, Member } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useModal } from '../../contexts/ModalContext';

interface ImportSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportSessionsModal({ isOpen, onClose }: ImportSessionsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addEvent, members } = useData();
  const { showSuccess, showError } = useModal();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportResults(null);
    }
  };

  const processData = async (data: any[]) => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Group rows by Date and Title
    const sessionsMap = new Map<string, any>();

    for (const row of data) {
      if (!row.Date || !row.Title) {
        failedCount++;
        errors.push(`שורה חסרה פרטי חובה (Date, Title): ${JSON.stringify(row)}`);
        continue;
      }

      const key = `${row.Date}_${row.Title}`;
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, {
          ...row,
          attendeesList: []
        });
      }

      const session = sessionsMap.get(key);

      // Add from Attendees column
      if (row.Attendees) {
        const attendees = String(row.Attendees).split(',').map(e => e.trim());
        session.attendeesList.push(...attendees);
      }

      // Add from First Name and Last Name columns
      const firstName = row['First Name'] || row['שם פרטי'] || row.firstName;
      const lastName = row['Last Name'] || row['שם משפחה'] || row.lastName;
      if (firstName || lastName) {
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();
        if (fullName) {
          session.attendeesList.push(fullName);
        }
      }
    }

    for (const [key, session] of sessionsMap.entries()) {
      try {
        const attendeeIds: string[] = [];
        
        for (const attendee of session.attendeesList) {
          if (!attendee) continue;
          
          const searchStr = attendee.toLowerCase();
          const member = members.find(m => {
            const emailMatch = m.email?.toLowerCase() === searchStr;
            const fullName1 = `${m.firstName} ${m.lastName}`.toLowerCase().trim();
            const fullName2 = `${m.lastName} ${m.firstName}`.toLowerCase().trim();
            return emailMatch || fullName1 === searchStr || fullName2 === searchStr;
          });
          
          if (member) {
            // Avoid duplicates
            if (!attendeeIds.includes(member.id)) {
              attendeeIds.push(member.id);
            }
          } else {
            errors.push(`אזהרה: לא נמצא חבר עם השם/אימייל "${attendee}" עבור האירוע "${session.Title}"`);
          }
        }

        const newEvent: Omit<Event, 'id'> = {
          title: String(session.Title).trim(),
          description: session.Description ? String(session.Description).trim() : 'סשן מיובא',
          date: String(session.Date).trim(),
          time: session.Time ? String(session.Time).trim() : '07:00',
          location: session.Location ? String(session.Location).trim() : 'חוף גיל',
          imageUrl: '',
          type: 'COMMUNITY',
          attendees: attendeeIds,
          attendeeCount: attendeeIds.length,
          isArchived: true
        };

        await addEvent(newEvent);
        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`שגיאה בייבוא אירוע ${session.Title}: ${err.message}`);
      }
    }

    setImportResults({ success: successCount, failed: failedCount, errors });
    setIsImporting(false);
    
    if (successCount > 0) {
      showSuccess(`יובאו בהצלחה ${successCount} סשנים היסטוריים`);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          await processData(json);
        } catch (err: any) {
          showError(`שגיאה בפענוח הקובץ: ${err.message}`);
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        showError('שגיאה בקריאת הקובץ');
        setIsImporting(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      showError(`שגיאה כללית: ${err.message}`);
      setIsImporting(false);
    }
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
              ייבוא סשנים היסטוריים (CSV/XLSX)
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
                  <p className="mb-2 font-bold">הנחיות לקובץ:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>הקובץ חייב לכלול שורת כותרות (Header row).</li>
                    <li>שדות חובה: <code className="bg-blue-100 px-1 rounded">Date</code> (YYYY-MM-DD), <code className="bg-blue-100 px-1 rounded">Title</code>.</li>
                    <li>שדות אופציונליים: <code className="bg-blue-100 px-1 rounded">Time</code>, <code className="bg-blue-100 px-1 rounded">Location</code>, <code className="bg-blue-100 px-1 rounded">Description</code>.</li>
                    <li>נוכחות: <code className="bg-blue-100 px-1 rounded">Attendees</code> (רשימת אימיילים או שמות מלאים מופרדים בפסיק).</li>
                  </ul>
                </div>

                <div 
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
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
                      <p className="text-lg font-bold text-gray-800">לחץ לבחירת קובץ CSV או Excel</p>
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
                    <p className="font-bold text-red-800 mb-2">פירוט שגיאות ואזהרות:</p>
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
