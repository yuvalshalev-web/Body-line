import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type ModalType = 'success' | 'error' | 'info';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showAlert: (message: string, title?: string, type?: ModalType) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [modalContent, setModalContent] = useState({ message: '', title: '', type: 'info' as ModalType });

  const showAlert = useCallback((message: string, title = '', type: ModalType = 'info') => {
    setModalContent({ message, title, type });
    setIsConfirm(false);
    setIsOpen(true);
  }, []);

  const showSuccess = useCallback((message: string, title = 'הצלחה') => {
    showAlert(message, title, 'success');
  }, [showAlert]);

  const showError = useCallback((message: string, title = 'שגיאה') => {
    showAlert(message, title, 'error');
  }, [showAlert]);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setModalContent({ message: options.message, title: options.title || 'אישור פעולה', type: 'info' });
    setIsConfirm(true);
    setConfirmOptions(options);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmOptions?.onConfirm) confirmOptions.onConfirm();
    setIsOpen(false);
  }, [confirmOptions]);

  const handleCancel = useCallback(() => {
    if (confirmOptions?.onCancel) confirmOptions.onCancel();
    setIsOpen(false);
  }, [confirmOptions]);

  return (
    <ModalContext.Provider value={{ showAlert, showSuccess, showError, showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={isConfirm ? handleCancel : () => setIsOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex flex-col items-center text-center gap-4">
              {modalContent.type === 'error' && <AlertCircle size={48} className="text-rose-500" />}
              {modalContent.type === 'success' && <CheckCircle2 size={48} className="text-emerald-500" />}
              {modalContent.type === 'info' && <Info size={48} className="text-blue-500" />}
              
              <div>
                {modalContent.title && <h3 className="text-xl font-black text-slate-900 mb-2">{modalContent.title}</h3>}
                <p className="text-slate-600 font-medium">{modalContent.message}</p>
              </div>
              
              {isConfirm ? (
                <div className="flex gap-3 w-full mt-4">
                  <button 
                    onClick={handleCancel}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    {confirmOptions?.cancelText || 'ביטול'}
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    {confirmOptions?.confirmText || 'אישור'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  סגור
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
