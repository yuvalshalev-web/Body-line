console.log("main.tsx: Execution started - " + new Date().toISOString());
if (typeof window !== 'undefined') {
  document.documentElement.setAttribute('data-exec-start', 'true');

  // Guard against internal Firestore assertion glitches or transient offline network blips
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event?.reason?.message || event?.reason?.stack || event?.reason || '');
    if (
      reasonStr.includes('FIRESTORE') || 
      reasonStr.includes('INTERNAL ASSERTION FAILED') || 
      reasonStr.includes('Could not reach Cloud Firestore backend') ||
      reasonStr.includes('code=unavailable') ||
      reasonStr.includes('ca9') ||
      reasonStr.includes('b815')
    ) {
      console.warn('Intercepted transient Firestore internal assertion/network rejection:', reasonStr);
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  }, true);

  window.addEventListener('error', (event) => {
    const msg = String(event?.message || event?.error?.message || event?.error?.stack || '');
    if (
      msg.includes('FIRESTORE') || 
      msg.includes('INTERNAL ASSERTION FAILED') || 
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('code=unavailable') ||
      msg.includes('ca9') ||
      msg.includes('b815')
    ) {
      console.warn('Intercepted transient Firestore error event:', msg);
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  }, true);
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ModalProvider } from './contexts/ModalContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';
import './utils/systemLogs';
import './utils/chartHelpers';

const rootElement = document.getElementById('root');
console.log("main.tsx: Got rootElement", rootElement);
if (!rootElement) throw new Error('Failed to find the root element');

console.log("main.tsx: Creating root...");
const root = createRoot(rootElement);

if (typeof window !== 'undefined') {
  document.documentElement.setAttribute('data-exec-before-render', 'true');
}

console.log("main.tsx: Calling root.render()...");
root.render(
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
);

if (typeof window !== 'undefined') {
  document.documentElement.setAttribute('data-app-status', 'ready');
  (window as any)._boot_progress = "Ready";
}
