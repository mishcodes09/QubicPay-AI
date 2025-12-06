/**
 * Application Entry Point
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log app version and environment
console.log(`
╔═══════════════════════════════════════════╗
║  Qubic Smart Escrow                       ║
║  Version: ${process.env.REACT_APP_VERSION || '1.0.0'}                            ║
║  Environment: ${process.env.NODE_ENV}              ║
╚═══════════════════════════════════════════╝
`);

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}