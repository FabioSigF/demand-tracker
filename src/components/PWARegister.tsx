'use client';
import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Em dev os chunks de /_next/static/ mudam de conteúdo sem mudar de nome, e o
    // cache-first do sw.js serviria código antigo. Remove SW e caches deixados por ele.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).workbox === undefined) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => {
            console.warn('Service worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
