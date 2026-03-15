import React, { Component, ErrorInfo, ReactNode } from 'react';
import { addLog } from '../utils/systemLogs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    addLog(`Uncaught Error: ${error.message}`, 'Critical', 'Frontend', errorInfo.componentStack || undefined);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "נתקלנו בשגיאה לא צפויה. המידע הטכני נשמר בחדר המכונות לטיפול הרכזים.";
      let isPermissionError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.error.includes('insufficient permissions')) {
            isPermissionError = true;
            errorMessage = `שגיאת הרשאות: אין לך הרשאה לבצע פעולת ${parsed.operationType} בנתיב ${parsed.path}.`;
          }
        }
      } catch (e) {
        // Not a JSON error, use default message
      }

      return this.props.fallback || (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[40vh]">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm border ${
            isPermissionError ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-rose-50 text-rose-500 border-rose-100'
          }`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-10 h-10">
              <path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            {isPermissionError ? 'שגיאת הרשאות' : 'אופס! משהו השתבש.'}
          </h2>
          <p className="text-slate-500 font-bold max-w-md">{errorMessage}</p>
          
          <div className="mt-8 flex gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95"
            >
              רענן דף
            </button>
            <button 
              onClick={() => window.history.back()}
              className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              חזור אחורה
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
