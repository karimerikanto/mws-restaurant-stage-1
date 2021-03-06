let restaurant;
let map;
let dbPromise;
let snackbar;
let addReviewDialog;

/**
 * Register service as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  setStyleSheet();
  self.dbPromise = DBHelper.openDatabase();
  self.snackbar = new Snackbar();
  self.addReviewDialog = new AddReviewDialog((error, review) => submitNewReview(error, review));

  registerServiceworker();
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
  link.href = "css/restaurant_info.min.css";

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
const fetchRestaurantFromURL = (callback) => {
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
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  fillBreadcrumb();

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favorite = document.getElementById('restaurant-favorite');
  favorite.src = restaurant.is_favorite === 'true' ? 'favorite_on.svg' : 'favorite_off.svg';
  favorite.setAttribute("aria-label", 
    restaurant.is_favorite === 'true' ? 
      'Remove this restaurant from the favorite restaurants' : 
      'Mark this restaurant as a favorite restaurant');
  
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

  // Fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
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
const fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.setAttribute('tabindex', 0);
  container.appendChild(title);

  const addReviewBtn = document.createElement('input');
  addReviewBtn.id = 'add-review-button';
  addReviewBtn.setAttribute('tabindex', 0);
  addReviewBtn.setAttribute('type', 'button');
  addReviewBtn.setAttribute('value', 'Add review');
  addReviewBtn.onclick = showAddReviewDialog;

  container.appendChild(addReviewBtn);

  updateReviews(container);
}

/**
 * Update reviews to the container.
 */
const updateReviews = (container) => {  
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';

  //Fetch reviews from the local database
  DBHelper.fetchLocalDbReviewsByRestaurantId(self.restaurant.id, self.dbPromise, (error, localDbReviews) => {
    if (error) {
      console.error(error);
      const failedToGetReviews = document.createElement('p');
      failedToGetReviews.innerHTML = 'Failed to get reviews.';
      container.appendChild(failedToGetReviews);
    } 
    else {
      if(localDbReviews.length > 0){
        //Fill reviews with the local storage reviews
        fillReviewsToContainer(localDbReviews, container);
      }

      //Get newest reviews from the remote server
      DBHelper.fetchRestaurantReviews(restaurant.id, (error, reviews) => {
        if(error !== null){
          console.error(error);

          if (localDbReviews.length === 0) {
            appendNoReviewsNotificationToReviewContainer(container);
          }
        }
        else{
          //Save newest reviews to the local storage
          DBHelper.saveReviewsToLocalDb(self.dbPromise, reviews, (error) => {
              if (error) {
                console.error(error);
              }
            });

          //If there is no reviews in the local storage or not in the remote server, show 'no reviews' notification
          if(reviews.length === 0 && 
            localDbReviews.length === 0){
            appendNoReviewsNotificationToReviewContainer(container);
          }
          else if(localDbReviews.length === 0){
            //If there were no reviews in the local storage, but there were reviews in the remote server, show the remote server reviews
            fillReviewsToContainer(reviews, container);
          }
        }
      });
    }
  });
}

/**
 * Append no reviews notification to the review container.
 */
const appendNoReviewsNotificationToReviewContainer = (container) => {
  const noReviews = document.createElement('p');
  noReviews.innerHTML = 'No reviews yet!';
  container.appendChild(noReviews);
}

/**
 * Serve saved offline reviews from the local storage.
 */
const fillReviewsToContainer = (reviews, container) => {
  const ul = document.getElementById('reviews-list');

  const listItems = reviews.sort((reviewA, reviewB) => {
      const timeA = new Date(reviewA.createdAt);
      const timeB = new Date(reviewB.createdAt);

      return timeB - timeA;
    })
    .map(review => createReviewHTML(review));

  for(const listItem of listItems){
    ul.appendChild(listItem);
  }

  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute("tabindex", 0);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const createdAt = new Date(review.createdAt);
  const date = document.createElement('p');
  date.innerHTML = createdAt.toLocaleString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
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
            'Remove this restaurant from the favorite restaurants' : 
            'Mark this restaurant as a favorite restaurant');
      }
    });
}

/**
 * Show dialog.
 */
const showAddReviewDialog = () => {
  self.addReviewDialog.show();
}

/**
 * Submit new review.
 */
const submitNewReview = (error, review) => {
  if(error !== null){
    snackbar.queueMessage(error, 'error');
    return;
  }

  if (!self.restaurant) { 
    console.error('Restaurant is not set!');
    return;
  }

  review.restaurant_id = self.restaurant.id;

  DBHelper.saveReviewToLocalDb(review, self.dbPromise, (error, message) => {
    if (error) {
      console.error(error);
      snackbar.queueMessage('An error happened while saving a new review', 'error');
      return;
    }
    else{
      DBHelper.sendUnsentReviews(self.dbPromise, (error) => {
        if(error){
          console.error(error);
        }
      });

      updateReviews(document.getElementById('reviews-container'));
    }
  });

  self.addReviewDialog.close();
}

/**
 * Catch onclick events and pass them to the dialog class.
 */
window.onclick = (e) => {
  if(self.addReviewDialog !== undefined){
    self.addReviewDialog.handleClick(e);
  }
}

/**
 * Catch keydown events and pass them to the dialog class.
 */
window.addEventListener('keydown', (e) => {
  if(self.addReviewDialog !== undefined){
    self.addReviewDialog.handleKeyDown(e);
  }
});

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
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
