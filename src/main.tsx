import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Forzar limpieza agresiva de todos los caches viejos
// Resuelve problemas de logos/iconos cacheados con fondos opacos
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      if (
        name.startsWith('workbox-precache') ||
        name.includes('images-cache') ||
        name.includes('supabase-storage') ||
        name.includes('manifest')
      ) {
        caches.delete(name);
      }
    });
  });
}

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
