// Service Worker Cache Clear Script
self.addEventListener('install', (event) => {
  console.log('Installing new service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Activating new service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});
