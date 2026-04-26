
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ModalProvider } from './contexts/ModalContext';
import ErrorBoundary from './components/ErrorBoundary';
import './utils/chartHelpers';
import './utils/systemLogs';
import './index.css';

console.log("index.tsx running - " + new Date().toISOString());
if (typeof window !== 'undefined') {
  (window as any)._boot_time = new Date().toISOString();
  console.log("Setting app-loaded signal");
  document.documentElement.setAttribute('data-app-status', 'loading-react');
}

// Register PWA service worker removed temporarily to fix cache
// If we re-enable, we should wrap it like this:
/*
try {
  registerSW({
    onNeedRefresh() { console.log("PWA: Refresh needed"); },
    onOfflineReady() { console.log("PWA: Offline ready"); },
  });
} catch(e) {
  console.warn("SW register failed during boot", e);
}
*/

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

console.log("Creating React root...");
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
console.log("React render called.");
if (typeof window !== 'undefined') {
  document.documentElement.setAttribute('data-app-status', 'ready');
  console.log("App success signal set.");
}
