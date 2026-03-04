import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ModalOptions {
  title?: string;
  message: string;
  type?: 'alert' | 'confirm' | 'success' | 'error';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showAlert: (message: string, title?: string) => void;
  showConfirm: (options: ModalOptions) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);

  const showAlert = useCallback((message: string, title: string = 'הודעת מערכת') => {
    setOptions({ message, title, type: 'alert', confirmText: 'הבנתי' });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((opts: ModalOptions) => {
    setOptions({ 
      ...opts, 
      type: opts.type || 'confirm',
      confirmText: opts.confirmText || 'אישור',
      cancelText: opts.cancelText || 'ביטול'
    });
    setIsOpen(true);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setOptions({ message, title: 'הצלחה', type: 'success', confirmText: 'מעולה' });
    setIsOpen(true);
  }, []);

  const showError = useCallback((message: string) => {
    setOptions({ message, title: 'שגיאה', type: 'error', confirmText: 'סגור' });
    setIsOpen(true);
  }, []);

  const handleConfirm = async () => {
    console.log('handleConfirm called, options:', options);
    setIsOpen(false);
    if (options?.onConfirm) await options.onConfirm();
  };

  const handleCancel = async () => {
    console.log('handleCancel called, options:', options);
    setIsOpen(false);
    if (options?.onCancel) await options.onCancel();
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showSuccess, showError }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
              dir="rtl"
            >
              {/* Header with Icon */}
              <div className={`p-6 flex flex-col items-center text-center gap-4 ${
                options.type === 'error' ? 'bg-rose-50' : 
                options.type === 'success' ? 'bg-emerald-50' : 
                options.type === 'confirm' ? 'bg-amber-50' : 'bg-slate-50'
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${
                  options.type === 'error' ? 'bg-rose-500 text-white' : 
                  options.type === 'success' ? 'bg-emerald-500 text-white' : 
                  options.type === 'confirm' ? 'bg-amber-500 text-white' : 'bg-[#006994] text-white'
                }`}>
                  {options.type === 'error' && <AlertTriangle size={32} />}
                  {options.type === 'success' && <CheckCircle2 size={32} />}
                  {options.type === 'confirm' && <Info size={32} />}
                  {options.type === 'alert' && <Info size={32} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{options.title}</h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 text-center">
                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                  {options.message}
                </p>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${
                    options.type === 'error' ? 'bg-rose-500 text-white shadow-rose-200' : 
                    options.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-200' : 
                    'bg-[#006994] text-white shadow-[#006994]/20'
                  }`}
                >
                  {options.confirmText}
                </button>
                {options.type === 'confirm' && (
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-4 px-6 rounded-2xl font-black text-sm text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    {options.cancelText}
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button 
                onClick={handleCancel}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};
