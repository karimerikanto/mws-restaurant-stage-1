let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];
let mapInitialized = false;
let restaurantsInitialized = false;
let dbPromise;
let observer;

/**
 * Register service worker and fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  self.dbPromise = DBHelper.openDatabase();

  if ('IntersectionObserver' in window) {
    self.observer = new IntersectionObserver(onObserverChange);
  }

  registerServiceworker();
  fetchRestaurants();
});

/**
 * Register service worker.
 */
registerServiceworker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker
     .register('../sw.js');
}

/**
 * Event for observer to show images when they are visible in viewport.
 */
onObserverChange = (changes) => {
  changes.forEach(change => {
    change.target.src = change.target.getAttribute('data-src');
    change.target.srcset = change.target.getAttribute('data-srcset');
    self.observer.unobserve(change.target);
  });
}

/**
 * Are filters initialized.
 */
filtersInitialized = () => {
  return self.cuisines && self.neighborhoods;
}

/**
 * Initialize filters.
 */
initializeFilters = (restaurants = self.restaurants) => {
  updateCuisines(restaurants);
  updateNeighborhoods(restaurants);
}

/**
 * Update all neighborhoods and set their HTML.
 */
updateNeighborhoods = (restaurants) => {
  if(self.neighborhoods === undefined){
    // Get all neighborhoods from all restaurants
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);

    // Remove duplicates from neighborhoods
    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

    self.neighborhoods = uniqueNeighborhoods;
    fillNeighborhoodsHTML();
  }
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Update all cuisines and set their HTML.
 */
updateCuisines = (restaurants) => {
  if(self.cuisines === undefined){
    // Get all cuisines from all restaurants
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);

    // Remove duplicates from cuisines
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);

    self.cuisines = uniqueCuisines;
    fillCuisinesHTML();
  }
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  if(restaurantsInitialized){
    addMarkersToMap();
  }

  mapInitialized = true;
}

/**
 * Fetch and update restaurants.
 */
fetchRestaurants = () => {
  DBHelper.fetchLocalDbRestaurants(self.dbPromise, (error, restaurants) => {
    if (error) {
      console.error(error);
    } 
    else {
      updateRestaurants(restaurants);
    }

    //Fetch restaurants from the remote server if we have any new restaurants to be saved for the next time.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        console.error(error);
      } 
      else {
        DBHelper.saveRestaurantsToLocalDb(self.dbPromise, restaurants, (error) => {
          if (error) {
            console.error(error);
          }
        });

        //Set restaurants if there was no restaurants in the local storage or there was an error.
        if(!self.restaurants ||
          self.restaurants.length === 0) {
          updateRestaurants(restaurants);
        }
      }
    });
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = (restaurants) => {
  if(!restaurants || 
    restaurants.length === 0) {
    return;
  }

  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  
  self.restaurants = restaurants;

  if(!filtersInitialized()) {
    initializeFilters();
  }

  restaurants = filterRestaurants(restaurants, cuisine, neighborhood);

  resetRestaurants(restaurants);
  fillRestaurantsHTML();

  if(mapInitialized){
    addMarkersToMap();
  }

  restaurantsInitialized = true;
}

/**
 * Filter restaurants by cuisine type and/or neighborhood.
 */
filterRestaurants = (restaurants, cuisine, neighborhood) => {
  if(cuisine != 'all'){
    restaurants = restaurants.filter(r => r.cuisine_type == cuisine);
  }

  if(neighborhood != 'all'){
    restaurants = restaurants.filter(r => r.neighborhood == neighborhood);
  }

  return restaurants;
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');

  restaurants.forEach(restaurant => {
    createRestaurantHTML(restaurant).then(listItem => {
      ul.append(listItem);
    });
  });
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  return new Promise(resolve => {
    const li = document.createElement('li');
    const image = document.createElement('img');
    image.classList = 'restaurant-img';
    image.alt = `An image from ${restaurant.name}`;

    if(restaurant.photograph) {
      image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
      image.setAttribute('data-srcset', `${DBHelper.imageUrlForRestaurant(restaurant)}, ${DBHelper.imageUrlForRestaurant(restaurant).replace('.', '_large.')} 1.5x`);
    }
    else {
      image.setAttribute('data-src', '/img/image_missing.svg');
      image.setAttribute('data-srcset', '');
      image.alt = `No image`;
    }

    //If image not found, serve image missing picture
    image.onerror = (e) => { 
      e.target.setAttribute('data-src', '/img/image_missing.svg');
      e.target.setAttribute('data-srcset', '');
      e.target.alt = `No image`;
    };

    if(self.observer) {
      self.observer.observe(image);
    }
    else {
      image.src = image.getAttribute('data-src');
      image.srcset = image.getAttribute('data-srcset');
    }

    li.append(image);

    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    name.setAttribute("tabindex", 0);
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.setAttribute('aria-label', `View details of ${restaurant.name}`);
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.setAttribute("tabindex", 0);
    li.append(more)

    resolve(li);
  });
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
