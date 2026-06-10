const CACHE_NAME = 'simulador-minero-v1';
const urlsToCache = [
  './index.html',
  './styles.css',
  './app.js',
  // También guardamos la librería Dexie para que la base de datos funcione offline
  'https://unpkg.com/dexie/dist/dexie.js' 
];

// 1. Instalación del Service Worker (Descarga los archivos)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos cacheados exitosamente');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Intercepción de peticiones (El modo Offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el archivo está en la caché local, lo devuelve sin usar internet
        if (response) {
          return response;
        }
        // Si no está, intenta buscarlo en internet
        return fetch(event.request);
      })
  );
});