import React from 'react';
import { AlertCircle, RotateCcw, Home, Terminal } from 'lucide-react';
import { addLog } from '../utils/systemLogs';

/**
 * Bootstrap ErrorBoundary for maximum stability.
 * Avoids complex dependencies like framer-motion to ensure it can actually render
 * even if the main library bundle has issues.
 */

console.log('ErrorBoundary.tsx: Module evaluating (Bootstrap Version)');

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
    console.group('🛑 ErrorBoundary caught an error');
    console.error('Error:', error);
    console.error('Info:', errorInfo);
    console.groupEnd();
    
    // Attempt to notify system logs
    try {
      addLog(`App Crash: ${error.message}`, 'Critical', 'Frontend', error.stack);
    } catch (e) {
      console.warn('ErrorBoundary: Failed to log error to systemLogs', e);
    }

    this.setState({ errorInfo });
  }

  private handleReset = () => {
    // Attempt cleanup
    try {
      localStorage.removeItem('habal_zug_user');
      const keys = Object.keys(localStorage);
      keys.filter(k => k.includes('cache')).forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#f8fafc',
            padding: '24px',
            fontFamily: 'sans-serif',
            direction: 'rtl'
          }}
        >
          <div 
            style={{ 
              maxWidth: '600px', 
              width: '100%', 
              backgroundColor: 'white', 
              borderRadius: '32px', 
              boxShadow: '0 20px 50px -12px rgba(0,0,0,0.1)', 
              border: '1px solid #e2e8f0',
              padding: '40px',
              textAlign: 'center'
            }}
          >
            {/* Header Icon */}
            <div style={{ backgroundColor: '#fff1f2', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', margin: '0 auto 24px' }}>
              <AlertCircle size={40} />
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '12px' }}>אופס! משהו השתבש</h1>
            <p style={{ color: '#64748b', fontWeight: '600', marginBottom: '32px' }}>
              המערכת נתקלה בשגיאה לא צפויה. נסה לטעון מחדש או לחזור לדף הבית.
            </p>

            {/* Error Detail */}
            <div style={{ backgroundColor: '#f1f5f9', borderRadius: '16px', padding: '16px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                <Terminal size={14} />
                <span>Diagnostic Logs</span>
              </div>
              <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', padding: '16px', overflow: 'auto', maxHeight: '150px' }}>
                <pre style={{ color: '#fca5a5', fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {this.state.error && this.state.error.toString()}
                  {"\n"}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <button
                onClick={this.handleReset}
                style={{ 
                  padding: '16px', 
                  backgroundColor: '#0284c7', 
                  color: 'white', 
                  borderRadius: '16px', 
                  border: 'none', 
                  fontWeight: '900', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RotateCcw size={20} />
                טעינה מחדש
              </button>
              <button
                onClick={this.handleGoHome}
                style={{ 
                  padding: '16px', 
                  backgroundColor: '#f1f5f9', 
                  color: '#475569', 
                  borderRadius: '16px', 
                  border: 'none', 
                  fontWeight: '900', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Home size={20} />
                דף הבית
              </button>
            </div>
            
            <p style={{ marginTop: '24px', fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>
              TIMESTAMP: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
