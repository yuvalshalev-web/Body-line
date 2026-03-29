import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-rose-600 mb-4">אופס! משהו השתבש.</h1>
            <p className="text-slate-600 mb-6">
              {this.state.error?.message || 'אירעה שגיאה לא צפויה.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-xl font-bold shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 backdrop-blur-sm border border-white/20 transition-all active:scale-95"
            >
              רענן עמוד
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
