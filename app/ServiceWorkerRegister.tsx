'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('✅ Service Worker enregistré'))
        .catch((err) => console.error('❌ Erreur Service Worker', err));
    }
  }, []);

  return null;
}
