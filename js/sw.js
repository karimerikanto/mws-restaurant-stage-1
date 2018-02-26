var staticCacheName = 'restaurant-review-v1';

/**
 * Add installation event listener to service worker.
 */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        'js/main.js',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        'index.html',
        'restaurant.html',
      ]);
    })
  );
});

/**
 * Add fetch event listener to service worker.
 */
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});