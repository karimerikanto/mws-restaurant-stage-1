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
    return idb.open('restaurant-reviews', 1, function(upgradeDb) {
      upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
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
   * Fetch all restaurants.
   */
  static fetchRestaurants(dbPromise, callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(response => response.json())
      .then(restaurantDatasAsJson => {
        DBHelper.saveRestaurantsToLocalDb(dbPromise, restaurantDatasAsJson, callback);
        callback(null, restaurantDatasAsJson);
      })
      .catch(e => {
        console.log('Error fetching restaurants, getting restaurants from local storage.');
        DBHelper.fetchLocalDbRestaurants(dbPromise, callback);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, dbPromise, callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`)
      .then(response => response.json())
      .then(restaurantDataAsJson => callback(null, restaurantDataAsJson))
      .catch(e => {
        console.log('Error fetching restaurant, getting restaurant from local storage.');
        DBHelper.fetchLocalDbRestaurantById(id, dbPromise, callback);
      });
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
    return (`/img/${restaurant.photograph}.jpg`);
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
