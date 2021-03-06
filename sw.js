const staticCacheName = 'restaurant-review-v7';
const remoteCacheName = 'restaurant-review-remotes';
const imagesCacheName = 'restaurant-review-images';

const allCacheNames = [
  staticCacheName,
  remoteCacheName,
  imagesCacheName
];

const remoteCachePathPrefixes = [
  'https://maps.googleapis.com/maps/api/js?key=AIzaSyB14vP09l2oJojjzpXxQGAtcYHz5caC2IQ', 
  'https://maps.googleapis.com/maps-api',
  'https://maps.gstatic.com/mapfiles'
  ];

/**
 * Add installation event listener to service worker.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        'css/main.min.css',
        'css/restaurant_info.min.css',
        'js/main.js',
        'js/restaurant_info.js',
        '/',
        'restaurant.html',
        'image_missing.svg',
        'favorite_on.svg',
        'favorite_off.svg',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2'
      ]);
    })
  );
});

/**
 * Add fetch event listener to service worker.
 */
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  //Check if the request is matched in the remote caches list and put it in the cache if it is.
  for(const remoteCacheUrl of remoteCachePathPrefixes){
    if(event.request.url.startsWith(remoteCacheUrl)){
      return event.respondWith(serveRemoteFile(event));
    }
  }

  if (requestUrl.origin === location.origin) {
    //If the requested page is restaurant.html, serve the empty restaurant info page
    if (requestUrl.pathname === '/restaurant.html') {
      return event.respondWith(serveRestaurantPage(event));
    }

    //Check if the path is for restaurant images and try to get them from cache if they are.
    if(requestUrl.pathname.startsWith('/img/')){
      return event.respondWith(serveRestaurantImage(event));
    }
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(error => {
          return error;
      });
    })
  );
});

/**
 * Add activate event listener to service worker.
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('restaurant-review-') &&
                 !allCacheNames.includes(cacheName);
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/**
 * Serve cached remote files.
 */
const serveRemoteFile = (event) => {
  return caches.open(remoteCacheName).then(cache => {
    return cache.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request, {
          mode: 'no-cors'
        })
        .then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
    });
  });
}

/**
 * Serve cached restaurant page.
 */
const serveRestaurantPage = (event) => {
  return caches.match('restaurant.html')
        .then(response => {
          return response || fetch(event.request);
      })
}

/**
 * Serve cached restaurant images.
 */
const serveRestaurantImage = (event) => {
  return caches.open(imagesCacheName).then(cache => {
      return cache.match(event.request).then(response => {
        if (response) return response;

        return fetch(event.request)
          .then(imageResponse => {
            cache.put(event.request, imageResponse.clone());
            return imageResponse;
          });
      });
    });
}