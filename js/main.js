"use strict";var restaurants=void 0,neighborhoods=void 0,cuisines=void 0,map=void 0,markers=[],mapInitialized=!1,restaurantsInitialized=!1,dbPromise=void 0,observer=void 0,snackbar=void 0;document.addEventListener("DOMContentLoaded",function(e){self.dbPromise=DBHelper.openDatabase(),self.snackbar=new Snackbar,"IntersectionObserver"in window&&(self.observer=new IntersectionObserver(onObserverChange)),registerServiceworker(),fetchRestaurants(),DBHelper.sendUnsentReviews(self.dbPromise,function(e){e&&console.error(e)})});var registerServiceworker=function(){navigator.serviceWorker&&navigator.serviceWorker.register("../sw.js")},onObserverChange=function(e){e.forEach(function(e){e.isIntersecting&&(e.target.src=e.target.getAttribute("data-src"),e.target.srcset=e.target.getAttribute("data-srcset"),self.observer.unobserve(e.target))})},filtersInitialized=function(){return self.cuisines&&self.neighborhoods},initializeFilters=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurants;updateCuisines(e),updateNeighborhoods(e)},updateNeighborhoods=function(r){if(void 0===self.neighborhoods){var a=r.map(function(e,t){return r[t].neighborhood}),e=a.filter(function(e,t){return a.indexOf(e)==t});self.neighborhoods=e,fillNeighborhoodsHTML()}},fillNeighborhoodsHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.neighborhoods,r=document.getElementById("neighborhoods-select");e.forEach(function(t){requestAnimationFrame(function(){var e=document.createElement("option");e.innerHTML=t,e.value=t,r.append(e)})})},updateCuisines=function(r){if(void 0===self.cuisines){var a=r.map(function(e,t){return r[t].cuisine_type}),e=a.filter(function(e,t){return a.indexOf(e)==t});self.cuisines=e,fillCuisinesHTML()}},fillCuisinesHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.cuisines,r=document.getElementById("cuisines-select");e.forEach(function(t){requestAnimationFrame(function(){var e=document.createElement("option");e.innerHTML=t,e.value=t,r.append(e)})})};window.initMap=function(){requestAnimationFrame(function(){self.map=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),restaurantsInitialized&&addMarkersToMap(),mapInitialized=!0})};var fetchRestaurants=function(){DBHelper.fetchLocalDbRestaurants(self.dbPromise,function(e,t){e?console.error(e):updateRestaurants(t),DBHelper.fetchRestaurants(function(e,t){e?console.error(e):(DBHelper.saveRestaurantsToLocalDb(self.dbPromise,t,function(e){e&&console.error(e)}),self.restaurants&&0!==self.restaurants.length||updateRestaurants(t))})})},updateRestaurants=function(e){if(e&&0!==e.length){var t=document.getElementById("cuisines-select"),r=document.getElementById("neighborhoods-select"),a=document.getElementById("favorites-checkbox"),n=t.selectedIndex,s=r.selectedIndex,i=t[n].value,o=r[s].value,u=a.checked;self.restaurants=e,filtersInitialized()||initializeFilters(),e=filterRestaurants(e,i,o,u),resetRestaurants(e),fillRestaurantsHTML(),mapInitialized&&addMarkersToMap(),restaurantsInitialized=!0}},filterRestaurants=function(e,t,r,a){return"all"!=t&&(e=e.filter(function(e){return e.cuisine_type==t})),"all"!=r&&(e=e.filter(function(e){return e.neighborhood==r})),a&&(e=e.filter(function(e){return"true"===e.is_favorite})),e},resetRestaurants=function(e){self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers.forEach(function(e){return e.setMap(null)}),self.markers=[],self.restaurants=e},fillRestaurantsHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurants,t=document.getElementById("restaurants-list");e.forEach(function(e){requestAnimationFrame(function(){return t.append(createRestaurantHTML(e))})})},createRestaurantHTML=function(e){var t=document.createElement("li");t.className="restaurants-list-item";var r=document.createElement("img");r.classList="restaurant-img",r.alt="An image from "+e.name,e.photograph?(r.setAttribute("data-src",DBHelper.imageUrlForRestaurant(e)),r.setAttribute("data-srcset",DBHelper.imageUrlForRestaurant(e)+", "+DBHelper.imageUrlForRestaurant(e).replace(".","_large.")+" 1.5x")):(r.setAttribute("data-src","/image_missing.svg"),r.setAttribute("data-srcset",""),r.alt="No image"),r.onerror=function(e){e.target.src="/image_missing.svg",e.target.srcset="",e.target.alt="No image"},self.observer?self.observer.observe(r):(r.src=r.getAttribute("data-src"),r.srcset=r.getAttribute("data-srcset")),t.append(r);var a=document.createElement("h2");a.classList="restaurant-name",a.innerHTML=e.name,a.setAttribute("tabindex",0),t.append(a);var n=document.createElement("p");n.className="restaurant-neighborhood",n.innerHTML=e.neighborhood,t.append(n);var s=document.createElement("p");s.className="restaurant-address",s.innerHTML=e.address,t.append(s);var i=document.createElement("div"),o=document.createElement("a");o.className="restaurant-more-button",o.innerHTML="View Details",o.setAttribute("aria-label","View details of "+e.name),o.href=DBHelper.urlForRestaurant(e),o.setAttribute("tabindex",0),i.append(o);var u=document.createElement("input");return u.classList="restaurant-favorite",u.alt="Toggle favorite restaurant",u.src="true"===e.is_favorite?"favorite_on.svg":"favorite_off.svg",u.setAttribute("tabindex",0),u.setAttribute("type","image"),u.setAttribute("aria-label","true"===e.is_favorite?"Mark restaurant as a favorite restaurant":"Remove restaurant from the favorite restaurants"),u.onclick=function(){return toggleRestaurantFavoriteState(e,u)},i.append(u),t.append(i),t},toggleRestaurantFavoriteState=function(r,a){DBHelper.updateRestaurantFavoriteState(r.id,!("true"===r.is_favorite),function(e,t){e?(console.error(e),snackbar.queueMessage("Failed to change restaurant's favorite state","error")):(r.is_favorite="true"===r.is_favorite?"false":"true",DBHelper.saveRestaurantToLocalDb(r,self.dbPromise,function(e,t){e&&console.error(e)}),snackbar.queueMessage("true"===r.is_favorite?"Restaurant added as a favorite restaurant":"Removed restaurant from the favorite restaurants","success"),a.src="true"===r.is_favorite?"favorite_on.svg":"favorite_off.svg",a.setAttribute("aria-label","true"===r.is_favorite?"Mark restaurant as a favorite restaurant":"Remove restaurant from the favorite restaurants"))})},addMarkersToMap=function(){(0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurants).forEach(function(t){requestAnimationFrame(function(){var e=DBHelper.mapMarkerForRestaurant(t,self.map);self.markers.push(e)})})};
"use strict";var _createClass=function(){function r(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,t,n){return t&&r(e.prototype,t),n&&r(e,n),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var DBHelper=function(){function s(){_classCallCheck(this,s)}return _createClass(s,null,[{key:"openDatabase",value:function(){return idb.open("restaurant-reviews",3,function(e){switch(e.oldVersion){case 0:e.createObjectStore("restaurants",{keyPath:"id"});case 1:e.createObjectStore("reviews",{keyPath:"id",autoIncrement:!0});case 2:e.createObjectStore("reviews-unsent",{keyPath:"id",autoIncrement:!0})}})}},{key:"fetchLocalDbRestaurants",value:function(e,t){if(null!==e)return e.then(function(e){return e.transaction("restaurants","readonly").objectStore("restaurants").getAll()}).then(function(e){t(null,e)}).catch(function(e){return t(e,"Fetch from local database failed.")})}},{key:"fetchLocalDbReviews",value:function(e,t){if(null!==e)return e.then(function(e){return e.transaction("reviews","readonly").objectStore("reviews").getAll()}).then(function(e){t(null,e)}).catch(function(e){return t(e,"Fetch from local database failed.")})}},{key:"fetchLocalDbUnsentReviews",value:function(e,t){if(null!==e)return e.then(function(e){return e.transaction("reviews-unsent","readonly").objectStore("reviews-unsent").getAll()}).then(function(e){t(null,e)}).catch(function(e){return t(e,"Fetch from local database failed.")})}},{key:"fetchLocalDbRestaurantById",value:function(t,e,n){if(null!==e)return e.then(function(e){return e.transaction("restaurants","readonly").objectStore("restaurants").get(parseInt(t))}).then(function(e){n(null,e)}).catch(function(e){return n(e,"Fetch from local database failed.")})}},{key:"saveRestaurantsToLocalDb",value:function(e,n,t){if(null!==e)return e.then(function(e){var t=e.transaction("restaurants","readwrite").objectStore("restaurants");return Promise.all(n.map(function(e){t.put(e)}))}).catch(function(e){return t(e,"Save to local database failed.")})}},{key:"saveReviewsToLocalDb",value:function(e,n,t){if(null!==e)return e.then(function(e){var t=e.transaction("reviews","readwrite").objectStore("reviews");return Promise.all(n.map(function(e){t.put(e)}))}).catch(function(e){return t(e,"Save to local database failed.")})}},{key:"saveRestaurantToLocalDb",value:function(n,e,t){if(null!==e)return e.then(function(e){var t=e.transaction("restaurants","readwrite");return t.objectStore("restaurants").put(n),t.complete}).catch(function(e){return t(e,"Save to local database failed.")})}},{key:"saveUnsentReviewToLocalDb",value:function(n,e,t){if(null!==e)return e.then(function(e){var t=e.transaction("reviews-unsent","readwrite");return t.objectStore("reviews-unsent").put(n),t.complete}).then(function(){return t(null,"")}).catch(function(e){return t(e,"Save to local database failed.")})}},{key:"deleteUnsentReviewFromLocalDb",value:function(n,e,t){if(null!==e)return e.then(function(e){var t=e.transaction("reviews-unsent","readwrite");return t.objectStore("reviews-unsent").delete(n),t.complete}).catch(function(e){return t(e,"Delete from local database failed.")})}},{key:"sendUnsentReviews",value:function(i,l){s.fetchLocalDbUnsentReviews(i,function(e,t){if(e)console.error(e),l(e);else{var n=!0,r=!1,a=void 0;try{for(var o,u=t[Symbol.iterator]();!(n=(o=u.next()).done);n=!0){var c=o.value;s.sendAndDeleteUnsentReview(c,i)}}catch(e){r=!0,a=e}finally{try{!n&&u.return&&u.return()}finally{if(r)throw a}}l(null)}})}},{key:"sendAndDeleteUnsentReview",value:function(t,n){fetch(s.DATABASE_URL+"/reviews",{method:"POST",body:JSON.stringify(t),headers:{"Content-Type":"application/json"}}).then(function(e){s.deleteUnsentReviewFromLocalDb(t.id,n,function(e,t){e&&console.error(e)})}).catch(function(e){return console.error(e)})}},{key:"fetchRestaurants",value:function(t){fetch(s.DATABASE_URL+"/restaurants").then(function(e){return e.json()}).then(function(e){t(null,e)}).catch(function(e){return t(e,"Error when fetching restaurants from the remote server.")})}},{key:"fetchRestaurantById",value:function(e,t){fetch(s.DATABASE_URL+"/restaurants/"+e).then(function(e){return e.json()}).then(function(e){return t(null,e)}).catch(function(e){return t(e,"Error when fetching restaurant from the remote server.")})}},{key:"fetchRestaurantReviews",value:function(e,t){fetch(s.DATABASE_URL+"/reviews/?restaurant_id="+e).then(function(e){return e.json()}).then(function(e){return t(null,e)}).catch(function(e){return t(e,"Error when fetching restaurant reviews from the remote server.")})}},{key:"updateRestaurantFavoriteState",value:function(e,t,n){fetch(s.DATABASE_URL+"/restaurants/"+e+"/?is_favorite="+t,{method:"PUT"}).then(function(e){return n(null,e)}).catch(function(e){return n(e,"Error when updating favorite state to the remote server.")})}},{key:"urlForRestaurant",value:function(e){return"./restaurant.html?id="+e.id}},{key:"imageUrlForRestaurant",value:function(e){return"/img/"+e.photograph+".webp"}},{key:"mapMarkerForRestaurant",value:function(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:s.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}},{key:"DATABASE_URL",get:function(){return"http://localhost:1337"}}]),s}();
"use strict";!function(){function u(n){return new Promise(function(e,t){n.onsuccess=function(){e(n.result)},n.onerror=function(){t(n.error)}})}function i(n,o,r){var i,e=new Promise(function(e,t){u(i=n[o].apply(n,r)).then(e,t)});return e.request=i,e}function e(e,n,t){t.forEach(function(t){Object.defineProperty(e.prototype,t,{get:function(){return this[n][t]},set:function(e){this[n][t]=e}})})}function t(t,n,o,e){e.forEach(function(e){e in o.prototype&&(t.prototype[e]=function(){return i(this[n],e,arguments)})})}function n(t,n,o,e){e.forEach(function(e){e in o.prototype&&(t.prototype[e]=function(){return this[n][e].apply(this[n],arguments)})})}function o(e,o,t,n){n.forEach(function(n){n in t.prototype&&(e.prototype[n]=function(){return e=this[o],(t=i(e,n,arguments)).then(function(e){if(e)return new c(e,t.request)});var e,t})})}function r(e){this._index=e}function c(e,t){this._cursor=e,this._request=t}function s(e){this._store=e}function a(n){this._tx=n,this.complete=new Promise(function(e,t){n.oncomplete=function(){e()},n.onerror=function(){t(n.error)},n.onabort=function(){t(n.error)}})}function p(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new a(n)}function f(e){this._db=e}e(r,"_index",["name","keyPath","multiEntry","unique"]),t(r,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),o(r,"_index",IDBIndex,["openCursor","openKeyCursor"]),e(c,"_cursor",["direction","key","primaryKey","value"]),t(c,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(n){n in IDBCursor.prototype&&(c.prototype[n]=function(){var t=this,e=arguments;return Promise.resolve().then(function(){return t._cursor[n].apply(t._cursor,e),u(t._request).then(function(e){if(e)return new c(e,t._request)})})})}),s.prototype.createIndex=function(){return new r(this._store.createIndex.apply(this._store,arguments))},s.prototype.index=function(){return new r(this._store.index.apply(this._store,arguments))},e(s,"_store",["name","keyPath","indexNames","autoIncrement"]),t(s,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),o(s,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),n(s,"_store",IDBObjectStore,["deleteIndex"]),a.prototype.objectStore=function(){return new s(this._tx.objectStore.apply(this._tx,arguments))},e(a,"_tx",["objectStoreNames","mode"]),n(a,"_tx",IDBTransaction,["abort"]),p.prototype.createObjectStore=function(){return new s(this._db.createObjectStore.apply(this._db,arguments))},e(p,"_db",["name","version","objectStoreNames"]),n(p,"_db",IDBDatabase,["deleteObjectStore","close"]),f.prototype.transaction=function(){return new a(this._db.transaction.apply(this._db,arguments))},e(f,"_db",["name","version","objectStoreNames"]),n(f,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(i){[s,r].forEach(function(e){e.prototype[i.replace("open","iterate")]=function(){var e,t=(e=arguments,Array.prototype.slice.call(e)),n=t[t.length-1],o=this._store||this._index,r=o[i].apply(o,t.slice(0,-1));r.onsuccess=function(){n(r.result)}}})}),[r,s].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,n){var o=this,r=[];return new Promise(function(t){o.iterateCursor(e,function(e){e?(r.push(e.value),void 0===n||r.length!=n?e.continue():t(r)):t(r)})})})});var d={open:function(e,t,n){var o=i(indexedDB,"open",[e,t]),r=o.request;return r.onupgradeneeded=function(e){n&&n(new p(r.result,e.oldVersion,r.transaction))},o.then(function(e){return new f(e)})},delete:function(e){return i(indexedDB,"deleteDatabase",[e])}};"undefined"!=typeof module?(module.exports=d,module.exports.default=module.exports):self.idb=d}();
"use strict";var _createClass=function(){function i(e,t){for(var a=0;a<t.length;a++){var i=t[a];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(e,t,a){return t&&i(e.prototype,t),a&&i(e,a),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var AddReviewDialog=function(){function t(e){_classCallCheck(this,t),this.submitCallback=e,this.focusableElements=[],this.ratingFields=[],this.lastFocusedElementBeforeOpen=null,this.currentFocusIndex=1,this.focusIndexOnOpen=1,this.createContents()}return _createClass(t,[{key:"createContents",value:function(){var e=this;this.dialog=document.createElement("div"),this.dialog.className="modal",this.dialog.setAttribute("aria-modal","true");var t=document.createElement("form");t.className="modal-content";var a=document.createElement("input");a.className="modal-close",a.setAttribute("type","button"),a.setAttribute("aria-label","Close dialog"),a.value="×",a.onclick=function(){return e.close()},t.append(a),this.focusableElements.push(a);var i=document.createElement("h3");i.className="add-review-title",i.innerHTML="Add new review",t.append(i);var n=document.createElement("label");n.className="add-review-subtitle",n.innerHTML="* Name",t.append(n),this.nameField=document.createElement("input"),this.nameField.className="add-review-input",this.nameField.setAttribute("type","text"),this.nameField.setAttribute("aria-label","Name"),t.append(this.nameField),this.focusableElements.push(this.nameField);var l=document.createElement("label");l.className="add-review-subtitle",l.innerHTML="* Rating",t.append(l);var s=document.createElement("fieldset");s.className="add-review-fieldset",s.id="add-review-rating";for(var r=1;r<=5;r++){var u=document.createElement("input");u.setAttribute("type","radio"),u.value=r,u.id="review-rating-"+r,u.className="add-review-radio",u.name="add-review-rating",u.setAttribute("aria-label","Set rating "+r+" of 5");var o=document.createElement("label");o.setAttribute("for","review-rating-"+r),o.innerHTML=r,this.ratingFields.push(u),s.append(u),s.append(o),this.focusableElements.push(u)}t.append(s);var c=document.createElement("label");c.className="add-review-subtitle",c.innerHTML="* Comments",t.append(c),this.commentField=document.createElement("textarea"),this.commentField.className="add-review-textarea",this.commentField.setAttribute("aria-label","Comments"),t.append(this.commentField),this.focusableElements.push(this.commentField);var d=document.createElement("input");d.value="Submit",d.className="add-review-submit-button",d.setAttribute("type","button"),d.setAttribute("aria-label","Submit rating"),d.onclick=function(){return e.submitToCallback()},t.append(d),this.focusableElements.push(d),this.dialog.append(t),document.body.append(this.dialog)}},{key:"isOpen",value:function(){return"block"===this.dialog.style.display}},{key:"show",value:function(){this.initializeFields(),this.dialog.style.display="block",this.lastFocusedElementBeforeOpen=document.activeElement,this.focusableElements[this.focusIndexOnOpen].focus(),this.currentFocusIndex=this.focusIndexOnOpen}},{key:"close",value:function(){this.dialog.style.display="none",null!==this.lastFocusedElementBeforeOpen&&this.lastFocusedElementBeforeOpen.focus()}},{key:"initializeFields",value:function(){var e=!(this.nameField.value=""),t=!1,a=void 0;try{for(var i,n=this.ratingFields[Symbol.iterator]();!(e=(i=n.next()).done);e=!0){i.value.checked=!1}}catch(e){t=!0,a=e}finally{try{!e&&n.return&&n.return()}finally{if(t)throw a}}this.commentField.value=""}},{key:"validateFields",value:function(){return 0===this.getNameValue().length?"Missing name from the submitted review.":0===this.getCommentValue().length?"Missing comment from the submitted review.":0===this.getRatingValue()?"Missing rating from the submitted review.":""}},{key:"submitToCallback",value:function(){var e=this.validateFields();0<e.length?this.submitCallback(e,null):this.submitCallback(null,{name:this.getNameValue(),rating:this.getRatingValue(),comments:this.getCommentValue()})}},{key:"getNameValue",value:function(){return this.nameField.value}},{key:"getCommentValue",value:function(){return this.commentField.value}},{key:"getRatingValue",value:function(){var e=0,t=!0,a=!1,i=void 0;try{for(var n,l=this.ratingFields[Symbol.iterator]();!(t=(n=l.next()).done);t=!0){var s=n.value;s.checked&&(e=s.value)}}catch(e){a=!0,i=e}finally{try{!t&&l.return&&l.return()}finally{if(a)throw i}}return e}},{key:"handleClick",value:function(e){if(e.target===this.dialog)this.close();else if(this.isOpen()){var t=0,a=!0,i=!1,n=void 0;try{for(var l,s=this.focusableElements[Symbol.iterator]();!(a=(l=s.next()).done);a=!0){var r=l.value;e.target===r&&(this.currentFocusIndex=t),t++}}catch(e){i=!0,n=e}finally{try{!a&&s.return&&s.return()}finally{if(i)throw n}}}}},{key:"handleKeyDown",value:function(e){this.isOpen()&&(9===e.keyCode?(e.shiftKey?(this.currentFocusIndex--,this.currentFocusIndex<0&&(this.currentFocusIndex=this.focusableElements.length-1)):(this.currentFocusIndex++,this.currentFocusIndex>=this.focusableElements.length&&(this.currentFocusIndex=0)),this.focusableElements[this.currentFocusIndex].focus(),e.preventDefault()):27===e.keyCode&&(this.close(),e.preventDefault()))}}]),t}();
"use strict";var _createClass=function(){function t(e,s){for(var a=0;a<s.length;a++){var t=s[a];t.enumerable=t.enumerable||!1,t.configurable=!0,"value"in t&&(t.writable=!0),Object.defineProperty(e,t.key,t)}}return function(e,s,a){return s&&t(e.prototype,s),a&&t(e,a),e}}();function _classCallCheck(e,s){if(!(e instanceof s))throw new TypeError("Cannot call a class as a function")}var Snackbar=function(){function e(){_classCallCheck(this,e),this.messageArray=[],this.createContents()}return _createClass(e,[{key:"createContents",value:function(){this.snackbar=document.createElement("div"),this.snackbar.id="snackbar",this.snackbar.setAttribute("aria-live","polite"),document.body.append(this.snackbar)}},{key:"queueMessage",value:function(e,s){if(this.messageArray.push({text:e,style:s}),1===this.messageArray.length){var a=this.messageArray[0];this.showMessage(a.text,a.style)}}},{key:"showMessage",value:function(e,s){var a=this;this.snackbar.className="show",this.snackbar.innerHTML=e,this.snackbar.style.backgroundColor="success"===s?"#00802b":"error"===s?"#900":"#333",setTimeout(function(){if(a.messageArray.pop(a.messageArray.length-1),0<a.messageArray.length){var e=a.messageArray[a.messageArray.length-1];a.showMessage(e.text,e.style)}else a.snackbar.className=a.snackbar.className.replace("show","")},2e3)}}]),e}();