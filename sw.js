const CACHE_NAME = 'scanner-pro-v2';

// Archivos críticos que se guardarán para uso offline inmediato
const ASSETS_TO_CACHE = [
  '/',
  '/index.html', // Asegúrate de que tu archivo se llame así, o cambia el nombre aquí
  '/html5-qrcode.min.js',
  '/xlsx.full.min.js',
  '/manifest.json',
  '/icon-512.png' // Si no tienes este icono aún, puedes quitar esta línea temporalmente
];

// Instalar el Service Worker y almacenar los archivos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Servidor offline: Archivos asegurados en caché');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Fuerza al SW a activarse de inmediato
  );
});

// Limpiar cachés antiguos si decides actualizar la app en el futuro
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 Limpiando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ESTRATEGIA: Cache-First (Priorizar Caché sobre Internet)
// Si el archivo está en el dispositivo, lo entrega de inmediato sin mirar si hay señal.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Retorna el archivo local instantáneamente
      }

      // Si por alguna razón pide algo que no está en caché, intenta buscarlo en red
      return fetch(event.request).catch(() => {
        // Si falla la red y no hay caché, la app no se cae catastróficamente
        console.log('🌐 Modo Offline Activo: No se pudo conectar a la red.');
      });
    })
  );
});
