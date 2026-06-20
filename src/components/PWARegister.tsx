'use client';
import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && (window as any).workbox === undefined) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Service worker registered successfully:', reg.scope);
          })
          .catch((err) => {
            console.warn('Service worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
