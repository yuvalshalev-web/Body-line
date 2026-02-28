
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ModalProvider } from './contexts/ModalContext';

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
