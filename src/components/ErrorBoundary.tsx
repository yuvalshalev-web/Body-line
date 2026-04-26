import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RotateCcw, Home, Terminal } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('🛑 React Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Info:', errorInfo);
    console.groupEnd();
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    // Clear potentially corrupt local storage if it's a known boot issue
    try {
      const keys = Object.keys(localStorage);
      const criticalKeys = keys.filter(k => k.includes('firebase') || k.includes('cache'));
      criticalKeys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to clear storage during reset', e);
    }
    
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-yehuda" dir="rtl">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, #00426a 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white p-10 relative overflow-hidden"
          >
            {/* Header with Icon */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6 shadow-inner">
                <AlertCircle size={40} />
              </div>
              <h1 className="text-3xl font-black text-[#00426a] mb-3">אופס! נראה שיש גל גבוה מדי...</h1>
              <p className="text-slate-500 font-bold max-w-sm">
                נתקלנו בשגיאה לא צפויה בזמן טעינת הרכיב. אל דאגה, השייפרים שלנו כבר בדרך.
              </p>
            </div>

            {/* Error Detail (Collapsible Explorer Style) */}
            <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6 mb-8">
              <div className="flex items-center gap-2 mb-3 text-slate-400">
                <Terminal size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Error Diagnostics</span>
              </div>
              <div className="bg-slate-900 rounded-2xl p-5 overflow-x-auto max-h-40 custom-scrollbar">
                <pre className="text-rose-400 text-xs font-mono leading-relaxed">
                  {this.state.error?.stack || this.state.error?.toString()}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-98 transition-all"
              >
                <RotateCcw size={20} />
                <span>ניסיון טעינה מחדש</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 active:scale-98 transition-all"
              >
                <Home size={20} />
                <span>חזרה לדף הבית</span>
              </button>
            </div>

            {/* Bottom help text */}
            <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} | Timestamp: {new Date().toLocaleTimeString()}
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
