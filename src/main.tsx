
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ModalProvider } from './contexts/ModalContext';
import ErrorBoundary from './components/ErrorBoundary';
import './utils/chartHelpers';
import './utils/systemLogs';
import './index.css';

window.onerror = function(message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = "color:red; background:#ffebeb; padding:20px; z-index:99999; position:fixed; top:0; left:0; right:0; bottom:0; overflow:auto;";
  errorDiv.innerHTML = `<h2>Global Crash (onerror):</h2><p>${message}</p><pre>${error?.stack}</pre>`;
  document.body.appendChild(errorDiv);
};

window.addEventListener('unhandledrejection', function(event) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = "color:red; background:#ffebeb; padding:20px; z-index:99999; position:fixed; top:0; left:0; right:0; bottom:0; overflow:auto;";
  errorDiv.innerHTML = `<h2>Global Crash (unhandledrejection):</h2><p>${event.reason?.message || event.reason}</p><pre>${event.reason?.stack}</pre>`;
  document.body.appendChild(errorDiv);
});

// Create a visual console for critical logs just in case
const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) return;
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = "color:darkred; background:#ffcccc; padding:10px; z-index:99998; position:fixed; bottom:0; left:0; right:0; max-height: 200px; overflow:auto; border-top: 2px solid red;";
  errorDiv.innerHTML = `<strong>console.error:</strong> ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
  document.body.appendChild(errorDiv);
};

console.log("index.tsx running");

// Register PWA service worker removed temporarily to fix cache

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <ModalProvider>
            <DataProvider>
              <App />
            </DataProvider>
          </ModalProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
