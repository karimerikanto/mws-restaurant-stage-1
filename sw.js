const staticCacheName = 'restaurant-review-v5';
const OFFLINE_URL = 'offline.html';

/**
 * Add installation event listener to service worker.
 */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        'css/styles.css',
        'js/idb.js',
        'js/main.js',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        '/',
        'restaurant.html',
        'offline.html'
      ]);
    })
  );
});

/**
 * Add fetch event listener to service worker.
 */
self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);
  
  if (requestUrl.origin === location.origin) {
    //If the requested page is restaurant.html, serve the empty restaurant info page
    if (requestUrl.pathname === '/restaurant.html') {
      event.respondWith(caches.match('restaurant.html')
        .then(response => {
          return response || fetch(event.request);
      }));
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).catch(error => {
        if (event.request.mode === 'navigate' ||
          (event.request.method === 'GET' &&
           event.request.headers.get('accept').includes('text/html'))) {
            //If we fail to request a html page, then we will serve the offline page.
            return caches.match(OFFLINE_URL);
          }

          return error;
      });
    })
  );
});

/**
 * Add activate event listener to service worker.
 */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurant-review-') &&
                 cacheName !== staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});