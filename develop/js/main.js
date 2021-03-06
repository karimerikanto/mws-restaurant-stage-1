let restaurants,
  neighborhoods,
  cuisines;
let map;
let markers = [];
let mapInitialized = false;
let restaurantsInitialized = false;
let dbPromise;
let observer;
let snackbar;

/**
 * Register service worker and fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  setStyleSheet();
  self.dbPromise = DBHelper.openDatabase();
  self.snackbar = new Snackbar();

  if ('IntersectionObserver' in window) {
    self.observer = new IntersectionObserver(onObserverChange);
  }

  registerServiceworker();
  fetchRestaurants();
  
  DBHelper.sendUnsentReviews(self.dbPromise, (error) => {
    if(error){
      console.error(error);
    }
  });
});

/**
 * Set style sheet.
 */
const setStyleSheet = () => {
  var head = document.head;
  var link = document.createElement("link");

  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = "css/main.min.css";

  head.appendChild(link);
}

/**
 * Register service worker.
 */
const registerServiceworker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker
     .register('../sw.js');
}

/**
 * Event for observer to show images when they are visible in viewport.
 */
const onObserverChange = (changes) => {
  changes.forEach(change => {
    if(change.isIntersecting){
      change.target.src = change.target.getAttribute('data-src');
      change.target.srcset = change.target.getAttribute('data-srcset');
      self.observer.unobserve(change.target);
    }
  });
}

/**
 * Are filters initialized.
 */
const filtersInitialized = () => {
  return self.cuisines && self.neighborhoods;
}

/**
 * Initialize filters.
 */
const initializeFilters = (restaurants = self.restaurants) => {
  updateCuisines(restaurants);
  updateNeighborhoods(restaurants);
}

/**
 * Update all neighborhoods and set their HTML.
 */
const updateNeighborhoods = (restaurants) => {
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
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    requestAnimationFrame(() => {
      const option = document.createElement('option');
      option.innerHTML = neighborhood;
      option.value = neighborhood;
      select.append(option);
    });
  });
}

/**
 * Update all cuisines and set their HTML.
 */
const updateCuisines = (restaurants) => {
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
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    requestAnimationFrame(() => {
      const option = document.createElement('option');
      option.innerHTML = cuisine;
      option.value = cuisine;
      select.append(option);
    });
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  requestAnimationFrame(() => {
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
  });
}

/**
 * Fetch and update restaurants.
 */
const fetchRestaurants = () => {
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
const updateRestaurants = (restaurants) => {
  if(!restaurants || 
    restaurants.length === 0) {
    return;
  }

  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const nCheckboxFavorite = document.getElementById('favorites-checkbox');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  const showOnlyFavoritesChecked = nCheckboxFavorite.checked;

  self.restaurants = restaurants;

  if(!filtersInitialized()) {
    initializeFilters();
  }

  restaurants = filterRestaurants(restaurants, cuisine, neighborhood, showOnlyFavoritesChecked);

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
const filterRestaurants = (restaurants, cuisine, neighborhood, showOnlyFavorites) => {
  if(cuisine != 'all'){
    restaurants = restaurants.filter(r => r.cuisine_type == cuisine);
  }

  if(neighborhood != 'all'){
    restaurants = restaurants.filter(r => r.neighborhood == neighborhood);
  }

  if(showOnlyFavorites){
    restaurants = restaurants.filter(r => r.is_favorite === 'true');
  }

  return restaurants;
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
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
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  
  restaurants.forEach(restaurant => {
    requestAnimationFrame(() => ul.append(createRestaurantHTML(restaurant)));
  });
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
    li.className = 'restaurants-list-item';

    const image = document.createElement('img');
    image.classList = 'restaurant-img';
    image.alt = `An image from ${restaurant.name}`;

    if(restaurant.photograph) {
      image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
      image.setAttribute('data-srcset', `${DBHelper.imageUrlForRestaurant(restaurant)}, ${DBHelper.imageUrlForRestaurant(restaurant).replace('.', '_large.')} 1.5x`);
    }
    else {
      image.setAttribute('data-src', '/image_missing.svg');
      image.setAttribute('data-srcset', '');
      image.alt = `No image`;
    }

    //If image not found, serve image missing picture
    image.onerror = (e) => { 
      e.target.src = '/image_missing.svg';
      e.target.srcset = '';
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
    name.classList = 'restaurant-name';
    name.innerHTML = restaurant.name;
    name.setAttribute("tabindex", 0);

    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.className = 'restaurant-neighborhood';
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.className = 'restaurant-address';
    address.innerHTML = restaurant.address;
    li.append(address);

    const container = document.createElement('div');

    const more = document.createElement('a');
    more.className = 'restaurant-more-button';
    more.innerHTML = 'View Details';
    more.setAttribute('aria-label', `View details of ${restaurant.name}`);
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.setAttribute('tabindex', 0);

    container.append(more);

    const favorite = document.createElement('input');
    favorite.classList = 'restaurant-favorite';
    favorite.alt = 'Toggle favorite restaurant';
    favorite.src = restaurant.is_favorite === 'true' ? 'favorite_on.svg' : 'favorite_off.svg';
    favorite.setAttribute('tabindex', 0);
    favorite.setAttribute('type', 'image');
    favorite.setAttribute('aria-label', 
      restaurant.is_favorite === 'true' ? 
        'Mark restaurant as a favorite restaurant' : 
        'Remove restaurant from the favorite restaurants');
    
    favorite.onclick = () => toggleRestaurantFavoriteState(restaurant, favorite);

    container.append(favorite);

    li.append(container);

    return li;
}

/**
 * Toggle restaurant favorite state and refresh the restaurants.
 */
const toggleRestaurantFavoriteState = (restaurant, image) => {
  DBHelper.updateRestaurantFavoriteState(restaurant.id, !(restaurant.is_favorite === 'true'), (error, response) => {
      if (error) {
        console.error(error);
        snackbar.queueMessage('Failed to change restaurant\'s favorite state', 'error');
      } 
      else {
        restaurant.is_favorite = restaurant.is_favorite === 'true' ? 'false' : 'true';

        DBHelper.saveRestaurantToLocalDb(restaurant, self.dbPromise, (error, message) => {
          if (error) {
            console.error(error);
          }
        });

        snackbar.queueMessage(
          restaurant.is_favorite === 'true' ? 
            'Restaurant added as a favorite restaurant' : 
            'Removed restaurant from the favorite restaurants',
          'success');

        image.src = restaurant.is_favorite === 'true' ? 'favorite_on.svg' : 'favorite_off.svg';

        image.setAttribute("aria-label", 
          restaurant.is_favorite === 'true' ? 
            'Mark restaurant as a favorite restaurant' : 
            'Remove restaurant from the favorite restaurants');
      }
    });
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    requestAnimationFrame(() => {
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
      self.markers.push(marker);
    });
  });
}
