/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    const port = 1337;
    return `http://localhost:${port}`;
  }

  /**
   * Opens the local storage database and returns a promise from it.
   */
  static openDatabase() {
    return idb.open('restaurant-reviews', 3, function(upgradeDb) {
      switch(upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          upgradeDb.createObjectStore('reviews', {
            keyPath: 'id',
            autoIncrement: true
          });
      }
    });
  }

  /**
   * Fetch all restaurants from local storage.
   */
  static fetchLocalDbRestaurants(dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readonly');
      const restaurantsStore = tx.objectStore('restaurants');
      return restaurantsStore.getAll();
    }).then(restaurants => {
        callback(null, restaurants);
    })
    .catch(e => callback(e, `Fetch from local database failed.`));
  }

  /**
   * Fetch all reviews from local storage.
   */
  static fetchLocalDbReviewsByRestaurantId(restaurant_id, dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readonly');
      const reviewsStore = tx.objectStore('reviews');
      return reviewsStore.getAll();
    })
    .then(reviews => reviews.filter(review => review.restaurant_id === restaurant_id))
    .then(reviews => {
        callback(null, reviews);
    })
    .catch(e => callback(e, `Fetch from local database failed.`));
  }

  /**
   * Fetch all unsent reviews from local storage.
   */
  static fetchLocalDbUnsentReviews(dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readonly');
      const reviewsStore = tx.objectStore('reviews');
      return reviewsStore.getAll();
    }).then(reviews => {
        callback(null, reviews.filter(review => review.updatedAt === undefined));
    })
    .catch(e => callback(e, `Fetch from local database failed.`));
  }

  /**
   * Fetch restaurant from local storage.
   */
  static fetchLocalDbRestaurantById(id, dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readonly');
      const restaurantsStore = tx.objectStore('restaurants');
      return restaurantsStore.get(parseInt(id));
    }).then(restaurant => {
        callback(null, restaurant);
    })
    .catch(e => callback(e, `Fetch from local database failed.`));
  }

  /**
   * Save restaurants to local storage.
   */
  static saveRestaurantsToLocalDb(dbPromise, restaurants, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantsStore = tx.objectStore('restaurants');

      return Promise.all(restaurants.map(restaurant => 
        {
          restaurantsStore.put(restaurant);
        }));
    })
    .catch(e => callback(e, `Save to local database failed.`));
  }

  /**
   * Save reviews to local storage.
   */
  static saveReviewsToLocalDb(dbPromise, reviews, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const reviewsStore = tx.objectStore('reviews');
      callback(null, null);

      return Promise.all(reviews.map(review => 
        {
          reviewsStore.put(review);
        }));
    })
    .catch(e => callback(e, `Save to local database failed.`));
  }  

  /**
   * Delete review from the local storage.
   */
  static deleteReviewFromLocalDb(reviewId, dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const reviewsStore = tx.objectStore('reviews');
      reviewsStore.delete(reviewId);

      callback(null, null);
      return tx.complete;
    })
    .catch(e => callback(e, `Delete from local database failed.`));
  }

  /**
   * Save review to local storage.
   */
  static saveReviewToLocalDb(review, dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const reviewsStore = tx.objectStore('reviews');
      callback(null, null);

      return reviewsStore.put(review);
    })
    .catch(e => callback(e, `Save to local database failed.`));
  }

  /**
   * Save restaurant to the local storage.
   */
  static saveRestaurantToLocalDb(restaurant, dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantsStore = tx.objectStore('restaurants');
      restaurantsStore.put(restaurant);

      return tx.complete;
    })
    .catch(e => callback(e, `Save to local database failed.`));
  }

  /**
   * Send all unsent reviews to the remote server.
   */
  static sendUnsentReviews(dbPromise, callback) {
    DBHelper.fetchLocalDbUnsentReviews(dbPromise, (error, reviews) => {
      if (error) {
        console.error(error);
        callback(error);
      } 
      else {
        for(const review of reviews){
          DBHelper.sendUnsentReview(review, dbPromise);
        }

        callback(null);
      }
    });
  }

  /**
   * Send review to the remote server and delete it from the local storage.
   */
  static sendUnsentReview(review, dbPromise) {
    fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        name: review.name,
        rating: review.rating,
        restaurant_id: review.restaurant_id,
        comments: review.comments
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then((reviewAsResponse) => {

      //Delete old review if it has wrong id
      DBHelper.deleteReviewFromLocalDb(review.id, dbPromise, (error, message) => {
        if(error){
          console.error(error);
        }
      });
      
      //Save same review which the server has
      DBHelper.saveReviewToLocalDb(reviewAsResponse, dbPromise, (error, message) => {
        if(error){
          console.error(error);
        }
      });
    })
    .catch(e => console.error(e));
  }

  /**
   * Fetch all restaurants from the remote server.
   */
  static fetchRestaurants(callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(response => response.json())
      .then(restaurants => {
        callback(null, restaurants);
      })
    .catch(e => callback(e, `Error when fetching restaurants from the remote server.`));
  }

  /**
   * Fetch a restaurant by its ID from the remote server.
   */
  static fetchRestaurantById(id, callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
      .then(response => response.json())
      .then(restaurantDataAsJson => callback(null, restaurantDataAsJson))
      .catch(e => callback(e, `Error when fetching restaurant from the remote server.`));
  }

  /**
   * Fetch a restaurant reviews by its ID from the remote server.
   */
  static fetchRestaurantReviews(restaurantId, callback) {
    fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurantId}`)
      .then(response => response.json())
      .then(restaurantReviewDataAsJson => callback(null, restaurantReviewDataAsJson))
      .catch(e => callback(e, `Error when fetching restaurant reviews from the remote server.`));
  }

  /**
   * Update restaurant state to the remote server.
   */
  static updateRestaurantFavoriteState(id, isFavorite, callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${isFavorite}`, {
      method: 'PUT'
    })
    .then(response => callback(null, response))
    .catch(e => callback(e, `Error when updating favorite state to the remote server.`));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
