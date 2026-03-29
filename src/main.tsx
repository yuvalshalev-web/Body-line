
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ModalProvider } from './contexts/ModalContext';
import './utils/chartHelpers';
import './utils/systemLogs';
import './index.css';

console.log("index.tsx running");

// Register PWA service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ModalProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </ModalProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
