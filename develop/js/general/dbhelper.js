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
    return idb.open('restaurant-reviews', 2, function(upgradeDb) {
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
  static fetchLocalDbReviews(dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readonly');
      const reviewsStore = tx.objectStore('reviews');
      return reviewsStore.getAll();
    }).then(reviews => {
        callback(null, reviews);
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
   * Save review to the local storage.
   */
  static saveReviewToLocalDb(review, dbPromise, callback) {
    if(dbPromise === null) return;

    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const reviewsStore = tx.objectStore('reviews');
      reviewsStore.put(review);

      return tx.complete;
    })
    .then(() => callback(null, ''))
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

      return tx.complete;
    })
    .catch(e => callback(e, `Delete from local database failed.`));
  }

  /**
   * Send all unsent reviews to the remote server.
   */
  static sendUnsentReviews(dbPromise) {
    DBHelper.fetchLocalDbReviews(dbPromise, (error, reviews) => {
      if (error) {
        console.error(error);
      } 
      else {
        for(const review of reviews){
          DBHelper.sendAndDeleteUnsentReview(review, dbPromise);
        }
      }
    });
  }

  /**
   * Send review to the remote server and delete it from the local storage.
   */
  static sendAndDeleteUnsentReview(review, dbPromise) {
    fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      //Success, delete review from the local storage.
      DBHelper.deleteReviewFromLocalDb(review.id, dbPromise, (error, message) => {
        if (error) {
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
