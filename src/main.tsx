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

console.log("main.tsx: Execution started - " + new Date().toISOString());
if (typeof window !== 'undefined') {
  document.documentElement.setAttribute('data-exec-start', 'true');
}

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
