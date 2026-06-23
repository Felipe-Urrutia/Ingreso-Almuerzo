// ==========================================================================
// SERVICE WORKER: BLINDAJE OFFLINE INDUSTRIAL JUMBO
// Versión: Anti-Caídas por Archivos Faltantes
// ==========================================================================

const CACHE_NAME = 'scanner-pro-v35'; // 🔥 Subimos de versión para forzar la limpieza en la Lenovo

// 1. Archivos críticos e indispensables para que la app abra (Si fallan, la app no funciona)
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css', 
  './js/html5-qrcode.min.js',
  './js/xlsx.style.min.js',
  './js/main.js',
  './js/scanner.js',
  './js/excel.js'
];

// 2. Archivos secundarios (Si un logo o icono no carga, no queremos que rompa toda la PWA)
const OPTIONAL_ASSETS = [
  './img/icon-512.png',
  './img/icon-192.png',
  './img/Aurora.png'
];

// Instalar el Service Worker con tolerancia a errores de diseño
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Servidor offline: Descargando archivos críticos...');
      
      // Primero aseguramos lo vital
      return cache.addAll(CRITICAL_ASSETS).then(() => {
        // Después intentamos guardar las imágenes de forma segura
        OPTIONAL_ASSETS.forEach(asset => {
          fetch(asset).then(response => {
            if (response.ok) cache.put(asset, response);
          }).catch(err => console.warn(`Aviso: No se pudo precargar el recurso opcional: ${asset}`));
        });
      });

    }).then(() => self.skipWaiting())
  );
});

// Limpiar cachés antiguos
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

// ESTRATEGIA: Cache-First (Operación Local Estricta)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; 
      }
      return fetch(event.request).catch(() => {
        console.log('🌐 Modo Offline Activo: Respondiendo desde almacenamiento local.');
      });
    })
  );
});