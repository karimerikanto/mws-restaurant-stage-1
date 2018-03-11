let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []
let mapInitialized = false;
let restaurantsInitialized = false;

/**
 * Register service worker and fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceworker();
  updateRestaurants();
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
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
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
  })
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
    ul.append(createRestaurantHTML(restaurant));
  });
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = `An image from ${restaurant.name}`;

  if(restaurant.photograph) {
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}, ${DBHelper.imageUrlForRestaurant(restaurant).replace('.', '_large.')} 1.5x`;
  }
  else {
    image.src = '/img/image_missing.svg';
  }

  //If image not found, serve image missing picture
  image.onerror = (e) => { 
    e.target.setAttribute('src', '/img/image_missing.svg');
    e.target.setAttribute('srcset', '');
  };
  

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

  return li
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
