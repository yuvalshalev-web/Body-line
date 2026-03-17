
import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Loader2, FileText, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MarkdownViewerProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  title: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ isOpen, onClose, filePath, title }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetch(filePath)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load file');
          return res.text();
        })
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('שגיאה בטעינת הקובץ');
          setLoading(false);
        });
    }
  }, [isOpen, filePath]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--vibrant-cyan)]/10 text-[var(--vibrant-cyan)] rounded-xl">
                  {filePath.includes('MAP') ? <Map size={20} /> : <FileText size={20} />}
                </div>
                <h3 className="text-xl font-black text-[var(--deep-teal-sea)]">{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar text-right" dir="rtl">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-[var(--vibrant-cyan)]" size={40} />
                  <p className="font-bold text-slate-400">טוען נתונים...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-rose-500 font-bold">{error}</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none 
                  prose-headings:font-black prose-headings:text-[var(--deep-teal-sea)]
                  prose-p:text-slate-600 prose-p:leading-relaxed
                  prose-strong:text-[var(--deep-teal-sea)]
                  prose-code:bg-slate-100 prose-code:p-1 prose-code:rounded-md prose-code:text-[var(--electric-pink)]
                  prose-pre:bg-slate-900 prose-pre:text-slate-100
                  prose-li:text-slate-600
                  prose-table:border prose-table:border-slate-200
                  prose-th:bg-slate-50 prose-th:p-2
                  prose-td:p-2 prose-td:border-t prose-td:border-slate-100
                ">
                  <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-[var(--deep-teal-sea)] text-white rounded-2xl font-black text-sm hover:bg-[var(--vibrant-cyan)] transition-all shadow-lg"
              >
                סגור
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
