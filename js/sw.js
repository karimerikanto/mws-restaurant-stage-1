const staticCacheName = 'restaurant-review-v3';
const OFFLINE_URL = 'offline.html';

/**
 * Add installation event listener to service worker.
 */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/css/styles.css',
        '/js/main.js',
        '/js/dbhelper.js',
        '/js/restaurant_info.js',
        '/index.html',
        '/restaurant.html',
        '/offline.html',
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyCO6SL8NC28iecTQB38TndQwQb_s_zbkvo&libraries=places&callback=initMap',
        'https://normalize-css.googlecode.com/svn/trunk/normalize.css'
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
      return response || fetch(event.request).catch(error => {
        return caches.match(OFFLINE_URL);
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
                 !cacheName.equals(staticCacheName);
        }).map(function(cacheName) {
          console.log('deleting cache ' + cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});