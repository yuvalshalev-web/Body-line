import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-black text-rose-500 mb-4">אופס! משהו השתבש.</h2>
          <p className="text-slate-400">נסה לרענן את הדף או לחזור מאוחר יותר.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-[#006994] text-white rounded-xl font-bold"
          >
            רענן דף
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
