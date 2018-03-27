let restaurant;
var map;
let dbPromise;
/**
 * Register service as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  self.dbPromise = DBHelper.openDatabase();
  registerServiceworker();
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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }

  const id = getParameterByName('id');

  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } 
  else {
    DBHelper.fetchLocalDbRestaurantById(id, self.dbPromise, (error, restaurant) => {
      if (error) {
        console.error(error);
      }

      //If the restaurant is not in the local storage, get it from the remote server and save it.
      if(!restaurant) {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
          if (error) {
            console.error(error);
            return;
          }

          if(restaurant){
            DBHelper.saveRestaurantsToLocalDb(self.dbPromise, [restaurant], (error) => {
              if (error) {
                console.error(error);
              }
            });

            self.restaurant = restaurant;
            callback(null, restaurant);
            fillRestaurantHTML();
          }
        });
      }
      else{
        self.restaurant = restaurant;
        callback(null, restaurant);
        fillRestaurantHTML();
      }
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  fillBreadcrumb();

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favorite = document.getElementById('restaurant-favorite');
  favorite.src = restaurant.is_favorite === 'true' ? 'favorite_on.svg' : 'favorite_off.svg';
  favorite.setAttribute("aria-label", restaurant.is_favorite === 'true' ? 'Remove this restaurant from the favorite restaurants' : 'Mark this restaurant as a favorite restaurant');
  favorite.onclick = () => toggleRestaurantFavoriteState(restaurant, favorite);

  const address = document.getElementById('restaurant-address');
  address.setAttribute('tabindex', 0);
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = `An image from ${restaurant.name}`;

  if(restaurant.photograph) {
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}, ${DBHelper.imageUrlForRestaurant(restaurant).replace('.', '_large.')} 1.5x`;
  }
  else {
    image.src = '/image_missing.svg';
    image.alt = `No image`;
  }

  //If image not found, serve image missing picture
  image.onerror = (e) => { 
    e.target.setAttribute('src', '/image_missing.svg');
    e.target.setAttribute('srcset', '');
    e.target.alt = `No image`;
  };

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.setAttribute('tabindex', 0);

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.setAttribute("tabindex", 0);
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const ul = document.getElementById('reviews-list');

  const reviewPromises = reviews.map(review => createReviewHTML(review));

  Promise.all(reviewPromises).then(function(listItems) {
    for(const listItem of listItems){
      ul.appendChild(listItem);
    }
  });

  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  return new Promise(resolve => {
    const li = document.createElement('li');
    li.setAttribute("tabindex", 0);

    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    resolve(li);
  });
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Toggle restaurant favorite state and refresh the restaurants.
 */
toggleRestaurantFavoriteState = (restaurant, image) => {
  DBHelper.updateRestaurantFavoriteState(restaurant.id, !(restaurant.is_favorite === 'true'), (error, response) => {
      if (error) {
        console.error(error);
      } 
      else {
        restaurant.is_favorite = restaurant.is_favorite === 'true' ? 'false' : 'true';

        DBHelper.saveRestaurantToLocalDb(restaurant, self.dbPromise, (error, message) => {
          if (error) {
            console.error(error);
          }
        });

        image.src = restaurant.is_favorite === 'true' ? 'favorite_on.svg' : 'favorite_off.svg';
        image.setAttribute("aria-label", restaurant.is_favorite === 'true' ? 'Mark this restaurant as a favorite restaurant' : 'Remove this restaurant from the favorite restaurants');
      }
    });
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
