"use strict";var restaurants=void 0,neighborhoods=void 0,cuisines=void 0,map=void 0,markers=[],mapInitialized=!1,restaurantsInitialized=!1,dbPromise=void 0,observer=void 0,snackbar=void 0;document.addEventListener("DOMContentLoaded",function(e){self.dbPromise=DBHelper.openDatabase(),self.snackbar=new Snackbar,"IntersectionObserver"in window&&(self.observer=new IntersectionObserver(onObserverChange)),registerServiceworker(),fetchRestaurants()});var registerServiceworker=function(){navigator.serviceWorker&&navigator.serviceWorker.register("../sw.js")},onObserverChange=function(e){e.forEach(function(e){e.isIntersecting&&(e.target.src=e.target.getAttribute("data-src"),e.target.srcset=e.target.getAttribute("data-srcset"),self.observer.unobserve(e.target))})},filtersInitialized=function(){return self.cuisines&&self.neighborhoods},initializeFilters=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurants;updateCuisines(e),updateNeighborhoods(e)},updateNeighborhoods=function(r){if(void 0===self.neighborhoods){var a=r.map(function(e,t){return r[t].neighborhood}),e=a.filter(function(e,t){return a.indexOf(e)==t});self.neighborhoods=e,fillNeighborhoodsHTML()}},fillNeighborhoodsHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.neighborhoods,r=document.getElementById("neighborhoods-select");e.forEach(function(e){var t=document.createElement("option");t.innerHTML=e,t.value=e,r.append(t)})},updateCuisines=function(r){if(void 0===self.cuisines){var a=r.map(function(e,t){return r[t].cuisine_type}),e=a.filter(function(e,t){return a.indexOf(e)==t});self.cuisines=e,fillCuisinesHTML()}},fillCuisinesHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.cuisines,r=document.getElementById("cuisines-select");e.forEach(function(e){var t=document.createElement("option");t.innerHTML=e,t.value=e,r.append(t)})};window.initMap=function(){self.map=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),restaurantsInitialized&&addMarkersToMap(),mapInitialized=!0};var fetchRestaurants=function(){DBHelper.fetchLocalDbRestaurants(self.dbPromise,function(e,t){e?console.error(e):updateRestaurants(t),DBHelper.fetchRestaurants(function(e,t){e?console.error(e):(DBHelper.saveRestaurantsToLocalDb(self.dbPromise,t,function(e){e&&console.error(e)}),self.restaurants&&0!==self.restaurants.length||updateRestaurants(t))})})},updateRestaurants=function(e){if(e&&0!==e.length){var t=document.getElementById("cuisines-select"),r=document.getElementById("neighborhoods-select"),a=document.getElementById("favorites-checkbox"),n=t.selectedIndex,s=r.selectedIndex,i=t[n].value,o=r[s].value,u=a.checked;self.restaurants=e,filtersInitialized()||initializeFilters(),e=filterRestaurants(e,i,o,u),resetRestaurants(e),fillRestaurantsHTML(),mapInitialized&&addMarkersToMap(),restaurantsInitialized=!0}},filterRestaurants=function(e,t,r,a){return"all"!=t&&(e=e.filter(function(e){return e.cuisine_type==t})),"all"!=r&&(e=e.filter(function(e){return e.neighborhood==r})),a&&(e=e.filter(function(e){return"true"===e.is_favorite})),e},resetRestaurants=function(e){self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers.forEach(function(e){return e.setMap(null)}),self.markers=[],self.restaurants=e},fillRestaurantsHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurants,t=document.getElementById("restaurants-list");e.forEach(function(e){createRestaurantHTML(e).then(function(e){t.append(e)})})},createRestaurantHTML=function(l){return new Promise(function(e){var t=document.createElement("li"),r=document.createElement("img");r.classList="restaurant-img",r.alt="An image from "+l.name,l.photograph?(r.setAttribute("data-src",DBHelper.imageUrlForRestaurant(l)),r.setAttribute("data-srcset",DBHelper.imageUrlForRestaurant(l)+", "+DBHelper.imageUrlForRestaurant(l).replace(".","_large.")+" 1.5x")):(r.setAttribute("data-src","/image_missing.svg"),r.setAttribute("data-srcset",""),r.alt="No image"),r.onerror=function(e){e.target.src="/image_missing.svg",e.target.srcset="",e.target.alt="No image"},self.observer?self.observer.observe(r):(r.src=r.getAttribute("data-src"),r.srcset=r.getAttribute("data-srcset")),t.append(r);var a=document.createElement("h2");a.classList="restaurant-name",a.innerHTML=l.name,a.setAttribute("tabindex",0),t.append(a);var n=document.createElement("p");n.innerHTML=l.neighborhood,t.append(n);var s=document.createElement("p");s.innerHTML=l.address,t.append(s);var i=document.createElement("div"),o=document.createElement("a");o.innerHTML="View Details",o.setAttribute("aria-label","View details of "+l.name),o.href=DBHelper.urlForRestaurant(l),o.setAttribute("tabindex",0),i.append(o);var u=document.createElement("input");u.classList="restaurant-favorite",u.alt="Toggle favorite restaurant",u.src="true"===l.is_favorite?"favorite_on.svg":"favorite_off.svg",u.setAttribute("tabindex",0),u.setAttribute("type","image"),u.setAttribute("aria-label","true"===l.is_favorite?"Mark restaurant as a favorite restaurant":"Remove restaurant from the favorite restaurants"),u.onclick=function(){return toggleRestaurantFavoriteState(l,u)},i.append(u),t.append(i),e(t)})},toggleRestaurantFavoriteState=function(r,a){DBHelper.updateRestaurantFavoriteState(r.id,!("true"===r.is_favorite),function(e,t){e?(console.error(e),snackbar.queueMessage("Failed to change restaurant's favorite state","error")):(r.is_favorite="true"===r.is_favorite?"false":"true",DBHelper.saveRestaurantToLocalDb(r,self.dbPromise,function(e,t){e&&console.error(e)}),snackbar.queueMessage("true"===r.is_favorite?"Restaurant added as a favorite restaurant":"Removed restaurant from the favorite restaurants","success"),a.src="true"===r.is_favorite?"favorite_on.svg":"favorite_off.svg",a.setAttribute("aria-label","true"===r.is_favorite?"Mark restaurant as a favorite restaurant":"Remove restaurant from the favorite restaurants"))})},addMarkersToMap=function(){(0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurants).forEach(function(e){var t=DBHelper.mapMarkerForRestaurant(e,self.map);google.maps.event.addListener(t,"click",function(){window.location.href=t.url}),self.markers.push(t)})};
"use strict";var _createClass=function(){function r(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}return function(t,e,n){return e&&r(t.prototype,e),n&&r(t,n),t}}();function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}var DBHelper=function(){function r(){_classCallCheck(this,r)}return _createClass(r,null,[{key:"openDatabase",value:function(){return idb.open("restaurant-reviews",1,function(t){t.createObjectStore("restaurants",{keyPath:"id"})})}},{key:"fetchLocalDbRestaurants",value:function(t,e){if(null!==t)return t.then(function(t){return t.transaction("restaurants","readonly").objectStore("restaurants").getAll()}).then(function(t){e(null,t)}).catch(function(t){return e(t,"Fetch from local database failed.")})}},{key:"fetchLocalDbRestaurantById",value:function(e,t,n){if(null!==t)return t.then(function(t){return t.transaction("restaurants","readonly").objectStore("restaurants").get(parseInt(e))}).then(function(t){n(null,t)}).catch(function(t){return n(t,"Fetch from local database failed.")})}},{key:"saveRestaurantsToLocalDb",value:function(t,n,e){if(null!==t)return t.then(function(t){var e=t.transaction("restaurants","readwrite").objectStore("restaurants");return Promise.all(n.map(function(t){e.put(t)}))}).catch(function(t){return e(t,"Save to local database failed.")})}},{key:"saveRestaurantToLocalDb",value:function(n,t,e){if(null!==t)return t.then(function(t){var e=t.transaction("restaurants","readwrite");return e.objectStore("restaurants").put(n),e.complete}).catch(function(t){return e(t,"Save to local database failed.")})}},{key:"fetchRestaurants",value:function(e){fetch(r.DATABASE_URL+"/restaurants").then(function(t){return t.json()}).then(function(t){e(null,t)}).catch(function(t){return e(t,"Error when fetching restaurants from the remote server.")})}},{key:"fetchRestaurantById",value:function(t,e){fetch(r.DATABASE_URL+"/restaurants/"+t).then(function(t){return t.json()}).then(function(t){return e(null,t)}).catch(function(t){return e(t,"Error when fetching restaurant from the remote server.")})}},{key:"updateRestaurantFavoriteState",value:function(t,e,n){fetch(r.DATABASE_URL+"/restaurants/"+t+"/?is_favorite="+e,{method:"PUT"}).then(function(t){return n(null,t)}).catch(function(t){return n(t,"Error when updating favorite state to the remote server.")})}},{key:"urlForRestaurant",value:function(t){return"./restaurant.html?id="+t.id}},{key:"imageUrlForRestaurant",value:function(t){return"/img/"+t.photograph+".webp"}},{key:"mapMarkerForRestaurant",value:function(t,e){return new google.maps.Marker({position:t.latlng,title:t.name,url:r.urlForRestaurant(t),map:e,animation:google.maps.Animation.DROP})}},{key:"DATABASE_URL",get:function(){return"http://localhost:1337"}}]),r}();
"use strict";!function(){function u(n){return new Promise(function(e,t){n.onsuccess=function(){e(n.result)},n.onerror=function(){t(n.error)}})}function i(n,o,r){var i,e=new Promise(function(e,t){u(i=n[o].apply(n,r)).then(e,t)});return e.request=i,e}function e(e,n,t){t.forEach(function(t){Object.defineProperty(e.prototype,t,{get:function(){return this[n][t]},set:function(e){this[n][t]=e}})})}function t(t,n,o,e){e.forEach(function(e){e in o.prototype&&(t.prototype[e]=function(){return i(this[n],e,arguments)})})}function n(t,n,o,e){e.forEach(function(e){e in o.prototype&&(t.prototype[e]=function(){return this[n][e].apply(this[n],arguments)})})}function o(e,o,t,n){n.forEach(function(n){n in t.prototype&&(e.prototype[n]=function(){return e=this[o],(t=i(e,n,arguments)).then(function(e){if(e)return new c(e,t.request)});var e,t})})}function r(e){this._index=e}function c(e,t){this._cursor=e,this._request=t}function s(e){this._store=e}function a(n){this._tx=n,this.complete=new Promise(function(e,t){n.oncomplete=function(){e()},n.onerror=function(){t(n.error)},n.onabort=function(){t(n.error)}})}function p(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new a(n)}function f(e){this._db=e}e(r,"_index",["name","keyPath","multiEntry","unique"]),t(r,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),o(r,"_index",IDBIndex,["openCursor","openKeyCursor"]),e(c,"_cursor",["direction","key","primaryKey","value"]),t(c,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(n){n in IDBCursor.prototype&&(c.prototype[n]=function(){var t=this,e=arguments;return Promise.resolve().then(function(){return t._cursor[n].apply(t._cursor,e),u(t._request).then(function(e){if(e)return new c(e,t._request)})})})}),s.prototype.createIndex=function(){return new r(this._store.createIndex.apply(this._store,arguments))},s.prototype.index=function(){return new r(this._store.index.apply(this._store,arguments))},e(s,"_store",["name","keyPath","indexNames","autoIncrement"]),t(s,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),o(s,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),n(s,"_store",IDBObjectStore,["deleteIndex"]),a.prototype.objectStore=function(){return new s(this._tx.objectStore.apply(this._tx,arguments))},e(a,"_tx",["objectStoreNames","mode"]),n(a,"_tx",IDBTransaction,["abort"]),p.prototype.createObjectStore=function(){return new s(this._db.createObjectStore.apply(this._db,arguments))},e(p,"_db",["name","version","objectStoreNames"]),n(p,"_db",IDBDatabase,["deleteObjectStore","close"]),f.prototype.transaction=function(){return new a(this._db.transaction.apply(this._db,arguments))},e(f,"_db",["name","version","objectStoreNames"]),n(f,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(i){[s,r].forEach(function(e){e.prototype[i.replace("open","iterate")]=function(){var e,t=(e=arguments,Array.prototype.slice.call(e)),n=t[t.length-1],o=this._store||this._index,r=o[i].apply(o,t.slice(0,-1));r.onsuccess=function(){n(r.result)}}})}),[r,s].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,n){var o=this,r=[];return new Promise(function(t){o.iterateCursor(e,function(e){e?(r.push(e.value),void 0===n||r.length!=n?e.continue():t(r)):t(r)})})})});var d={open:function(e,t,n){var o=i(indexedDB,"open",[e,t]),r=o.request;return r.onupgradeneeded=function(e){n&&n(new p(r.result,e.oldVersion,r.transaction))},o.then(function(e){return new f(e)})},delete:function(e){return i(indexedDB,"deleteDatabase",[e])}};"undefined"!=typeof module?(module.exports=d,module.exports.default=module.exports):self.idb=d}();
"use strict";var _createClass=function(){function i(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(e,t,n){return t&&i(e.prototype,t),n&&i(e,n),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var AddReviewDialog=function(){function e(){_classCallCheck(this,e),this.dialog=document.getElementById("addReviewDialog"),this.focusableElements=this.dialog.querySelectorAll('[tabindex="0"]'),this.lastFocusedElementBeforeOpen=null,this.nameField=document.getElementById("add-review-name"),this.ratingFields=document.getElementsByClassName("add-review-radio"),this.commentField=document.getElementById("add-review-comment"),this.currentFocusIndex=1,this.focusIndexOnOpen=1}return _createClass(e,[{key:"isOpen",value:function(){return"block"===this.dialog.style.display}},{key:"show",value:function(){this.initializeFields(),this.dialog.style.display="block",this.lastFocusedElementBeforeOpen=document.activeElement,this.focusableElements[this.focusIndexOnOpen].focus(),this.currentFocusIndex=this.focusIndexOnOpen}},{key:"close",value:function(){this.dialog.style.display="none",null!==this.lastFocusedElementBeforeOpen&&this.lastFocusedElementBeforeOpen.focus()}},{key:"initializeFields",value:function(){var e=!(this.nameField.value=""),t=!1,n=void 0;try{for(var i,l=this.ratingFields[Symbol.iterator]();!(e=(i=l.next()).done);e=!0){i.value.checked=!1}}catch(e){t=!0,n=e}finally{try{!e&&l.return&&l.return()}finally{if(t)throw n}}this.commentField.value=""}},{key:"validateFields",value:function(){return 0===this.getNameValue().length?"Missing name from the submitted review.":0===this.getCommentValue().length?"Missing comment from the submitted review.":0===this.getRatingValue()?"Missing rating from the submitted review.":""}},{key:"submit",value:function(){var e=this.validateFields();return 0<e.length?e:""}},{key:"getNameValue",value:function(){return this.nameField.value}},{key:"getCommentValue",value:function(){return this.commentField.value}},{key:"getRatingValue",value:function(){var e=0,t=!0,n=!1,i=void 0;try{for(var l,s=this.ratingFields[Symbol.iterator]();!(t=(l=s.next()).done);t=!0){var a=l.value;a.checked&&(e=a.value)}}catch(e){n=!0,i=e}finally{try{!t&&s.return&&s.return()}finally{if(n)throw i}}return e}},{key:"handleClick",value:function(e){if(e.target===this.dialog)this.close();else if(this.isOpen()){var t=0,n=!0,i=!1,l=void 0;try{for(var s,a=this.focusableElements[Symbol.iterator]();!(n=(s=a.next()).done);n=!0){var r=s.value;e.target===r&&(this.currentFocusIndex=t),t++}}catch(e){i=!0,l=e}finally{try{!n&&a.return&&a.return()}finally{if(i)throw l}}}}},{key:"handleKeyDown",value:function(e){this.isOpen()&&(9===e.keyCode?(e.shiftKey?(this.currentFocusIndex--,this.currentFocusIndex<0&&(this.currentFocusIndex=this.focusableElements.length-1)):(this.currentFocusIndex++,this.currentFocusIndex>=this.focusableElements.length&&(this.currentFocusIndex=0)),this.focusableElements[this.currentFocusIndex].focus(),e.preventDefault()):27===e.keyCode&&(this.close(),e.preventDefault()))}}]),e}();
"use strict";var _createClass=function(){function r(e,s){for(var a=0;a<s.length;a++){var r=s[a];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,s,a){return s&&r(e.prototype,s),a&&r(e,a),e}}();function _classCallCheck(e,s){if(!(e instanceof s))throw new TypeError("Cannot call a class as a function")}var Snackbar=function(){function e(){_classCallCheck(this,e),this.messageArray=[]}return _createClass(e,[{key:"queueMessage",value:function(e,s){if(this.messageArray.push({text:e,style:s}),1===this.messageArray.length){var a=this.messageArray[0];this.showMessage(a.text,a.style)}}},{key:"showMessage",value:function(e,s){var a=this,r=document.getElementById("snackbar");null!==r&&(r.className="show",r.innerHTML=e,r.style.backgroundColor="success"===s?"#00802b":"error"===s?"#900":"#333",setTimeout(function(){if(a.messageArray.pop(a.messageArray.length-1),0<a.messageArray.length){var e=a.messageArray[a.messageArray.length-1];a.showMessage(e.text,e.style)}else r.className=r.className.replace("show","")},2e3))}}]),e}();