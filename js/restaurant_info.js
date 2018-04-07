"use strict";var restaurant=void 0,map=void 0,dbPromise=void 0,snackbar=void 0,addReviewDialog=void 0;document.addEventListener("DOMContentLoaded",function(e){self.dbPromise=DBHelper.openDatabase(),self.snackbar=new Snackbar,self.addReviewDialog=new AddReviewDialog(function(e,t){return submitNewReview(e,t)}),registerServiceworker()});var registerServiceworker=function(){navigator.serviceWorker&&navigator.serviceWorker.register("../sw.js")};window.initMap=function(){fetchRestaurantFromURL(function(e,t){e?console.error(e):(self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:t.latlng,scrollwheel:!1}),DBHelper.mapMarkerForRestaurant(self.restaurant,self.map))})};var fetchRestaurantFromURL=function(r){if(self.restaurant)r(null,self.restaurant);else{var a=getParameterByName("id");a?DBHelper.fetchLocalDbRestaurantById(a,self.dbPromise,function(e,t){e&&console.error(e),t?(self.restaurant=t,r(null,t),fillRestaurantHTML()):DBHelper.fetchRestaurantById(a,function(e,t){e?console.error(e):t&&(DBHelper.saveRestaurantsToLocalDb(self.dbPromise,[t],function(e){e&&console.error(e)}),self.restaurant=t,r(null,t),fillRestaurantHTML())})}):(error="No restaurant id in URL",r(error,null))}},fillRestaurantHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurant;fillBreadcrumb(),document.getElementById("restaurant-name").innerHTML=e.name;var t=document.getElementById("restaurant-favorite");t.src="true"===e.is_favorite?"favorite_on.svg":"favorite_off.svg",t.setAttribute("aria-label","true"===e.is_favorite?"Remove this restaurant from the favorite restaurants":"Mark this restaurant as a favorite restaurant"),t.onclick=function(){return toggleRestaurantFavoriteState(e,t)};var r=document.getElementById("restaurant-address");r.setAttribute("tabindex",0),r.innerHTML=e.address;var a=document.getElementById("restaurant-img");a.className="restaurant-img",a.alt="An image from "+e.name,e.photograph?(a.src=DBHelper.imageUrlForRestaurant(e),a.srcset=DBHelper.imageUrlForRestaurant(e)+", "+DBHelper.imageUrlForRestaurant(e).replace(".","_large.")+" 1.5x"):(a.src="/image_missing.svg",a.alt="No image"),a.onerror=function(e){e.target.setAttribute("src","/image_missing.svg"),e.target.setAttribute("srcset",""),e.target.alt="No image"},document.getElementById("restaurant-cuisine").innerHTML=e.cuisine_type,e.operating_hours&&fillRestaurantHoursHTML(),fillReviewsHTML()},fillRestaurantHoursHTML=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurant.operating_hours,t=document.getElementById("restaurant-hours");for(var r in e){var a=document.createElement("tr");a.setAttribute("tabindex",0);var n=document.createElement("td");n.innerHTML=r,a.appendChild(n);var i=document.createElement("td");i.innerHTML=e[r],a.appendChild(i),t.appendChild(a)}},fillReviewsHTML=function(){var i=document.getElementById("reviews-container"),e=document.createElement("h2");e.innerHTML="Reviews",e.setAttribute("tabindex",0),i.appendChild(e);var t=document.createElement("input");t.id="add-review-button",t.setAttribute("tabindex",0),t.setAttribute("type","button"),t.setAttribute("value","Add review"),t.onclick=showAddReviewDialog,i.appendChild(t),DBHelper.fetchRestaurantReviews(restaurant.id,function(e,t){if(null!==e){console.error(e);var r=document.createElement("p");return r.innerHTML="Failed to get reviews.",i.appendChild(r),void snackbar.queueMessage("Failed to get reviews","error")}if(!t){var a=document.createElement("p");return a.innerHTML="No reviews yet!",void i.appendChild(a)}var s=document.getElementById("reviews-list"),n=t.sort(function(e,t){var r=new Date(e.createdAt);return new Date(t.createdAt)-r}).map(function(e){return createReviewHTML(e)});Promise.all(n).then(function(e){var t=!0,r=!1,a=void 0;try{for(var n,i=e[Symbol.iterator]();!(t=(n=i.next()).done);t=!0){var o=n.value;s.appendChild(o)}}catch(e){r=!0,a=e}finally{try{!t&&i.return&&i.return()}finally{if(r)throw a}}}),i.appendChild(s)})},createReviewHTML=function(s){return new Promise(function(e){var t=document.createElement("li");t.setAttribute("tabindex",0);var r=document.createElement("p");r.innerHTML=s.name,t.appendChild(r);var a=new Date(s.createdAt),n=document.createElement("p");n.innerHTML=a.toLocaleString(),t.appendChild(n);var i=document.createElement("p");i.innerHTML="Rating: "+s.rating,t.appendChild(i);var o=document.createElement("p");o.innerHTML=s.comments,t.appendChild(o),e(t)})},fillBreadcrumb=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurant,t=document.getElementById("breadcrumb"),r=document.createElement("li");r.innerHTML=e.name,t.appendChild(r)},toggleRestaurantFavoriteState=function(r,a){DBHelper.updateRestaurantFavoriteState(r.id,!("true"===r.is_favorite),function(e,t){e?(console.error(e),snackbar.queueMessage("Failed to change restaurant's favorite state","error")):(r.is_favorite="true"===r.is_favorite?"false":"true",DBHelper.saveRestaurantToLocalDb(r,self.dbPromise,function(e,t){e&&console.error(e)}),snackbar.queueMessage("true"===r.is_favorite?"Restaurant added as a favorite restaurant":"Removed restaurant from the favorite restaurants","success"),a.src="true"===r.is_favorite?"favorite_on.svg":"favorite_off.svg",a.setAttribute("aria-label","true"===r.is_favorite?"Remove this restaurant from the favorite restaurants":"Mark this restaurant as a favorite restaurant"))})},showAddReviewDialog=function(){self.addReviewDialog.show()},submitNewReview=function(e,t){null===e?self.restaurant?(t.restaurant_id=self.restaurant.id,DBHelper.saveReviewToLocalDb(t,self.dbPromise,function(e,t){if(e)return console.error(e),void snackbar.queueMessage("An error happened while saving a new review","error");DBHelper.sendUnsentReviews(self.dbPromise)}),self.addReviewDialog.close()):console.error("Restaurant is not set!"):snackbar.queueMessage(e,"error")};window.onclick=function(e){void 0!==self.addReviewDialog&&self.addReviewDialog.handleClick(e)},window.addEventListener("keydown",function(e){void 0!==self.addReviewDialog&&self.addReviewDialog.handleKeyDown(e)});var getParameterByName=function(e,t){t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");var r=new RegExp("[?&]"+e+"(=([^&#]*)|&|#|$)").exec(t);return r?r[2]?decodeURIComponent(r[2].replace(/\+/g," ")):"":null};
"use strict";var _createClass=function(){function r(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,t,n){return t&&r(e.prototype,t),n&&r(e,n),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var DBHelper=function(){function l(){_classCallCheck(this,l)}return _createClass(l,null,[{key:"openDatabase",value:function(){return idb.open("restaurant-reviews",2,function(e){switch(e.oldVersion){case 0:e.createObjectStore("restaurants",{keyPath:"id"});case 1:e.createObjectStore("reviews",{keyPath:"id",autoIncrement:!0})}})}},{key:"fetchLocalDbRestaurants",value:function(e,t){if(null!==e)return e.then(function(e){return e.transaction("restaurants","readonly").objectStore("restaurants").getAll()}).then(function(e){t(null,e)}).catch(function(e){return t(e,"Fetch from local database failed.")})}},{key:"fetchLocalDbReviews",value:function(e,t){if(null!==e)return e.then(function(e){return e.transaction("reviews","readonly").objectStore("reviews").getAll()}).then(function(e){t(null,e)}).catch(function(e){return t(e,"Fetch from local database failed.")})}},{key:"fetchLocalDbRestaurantById",value:function(t,e,n){if(null!==e)return e.then(function(e){return e.transaction("restaurants","readonly").objectStore("restaurants").get(parseInt(t))}).then(function(e){n(null,e)}).catch(function(e){return n(e,"Fetch from local database failed.")})}},{key:"saveRestaurantsToLocalDb",value:function(e,n,t){if(null!==e)return e.then(function(e){var t=e.transaction("restaurants","readwrite").objectStore("restaurants");return Promise.all(n.map(function(e){t.put(e)}))}).catch(function(e){return t(e,"Save to local database failed.")})}},{key:"saveRestaurantToLocalDb",value:function(n,e,t){if(null!==e)return e.then(function(e){var t=e.transaction("restaurants","readwrite");return t.objectStore("restaurants").put(n),t.complete}).catch(function(e){return t(e,"Save to local database failed.")})}},{key:"saveReviewToLocalDb",value:function(n,e,t){if(null!==e)return e.then(function(e){var t=e.transaction("reviews","readwrite");return t.objectStore("reviews").put(n),t.complete}).then(function(){return t(null,"")}).catch(function(e){return t(e,"Save to local database failed.")})}},{key:"deleteReviewFromLocalDb",value:function(n,e,t){if(null!==e)return e.then(function(e){var t=e.transaction("reviews","readwrite");return t.objectStore("reviews").delete(n),t.complete}).catch(function(e){return t(e,"Delete from local database failed.")})}},{key:"sendUnsentReviews",value:function(i){l.fetchLocalDbReviews(i,function(e,t){if(e)console.error(e);else{var n=!0,r=!1,a=void 0;try{for(var o,u=t[Symbol.iterator]();!(n=(o=u.next()).done);n=!0){var c=o.value;l.sendAndDeleteUnsentReview(c,i)}}catch(e){r=!0,a=e}finally{try{!n&&u.return&&u.return()}finally{if(r)throw a}}}})}},{key:"sendAndDeleteUnsentReview",value:function(t,n){fetch(l.DATABASE_URL+"/reviews",{method:"POST",body:JSON.stringify(t),headers:{"Content-Type":"application/json"}}).then(function(e){l.deleteReviewFromLocalDb(t.id,n,function(e,t){e&&console.error(e)})}).catch(function(e){return console.error(e)})}},{key:"fetchRestaurants",value:function(t){fetch(l.DATABASE_URL+"/restaurants").then(function(e){return e.json()}).then(function(e){t(null,e)}).catch(function(e){return t(e,"Error when fetching restaurants from the remote server.")})}},{key:"fetchRestaurantById",value:function(e,t){fetch(l.DATABASE_URL+"/restaurants/"+e).then(function(e){return e.json()}).then(function(e){return t(null,e)}).catch(function(e){return t(e,"Error when fetching restaurant from the remote server.")})}},{key:"fetchRestaurantReviews",value:function(e,t){fetch(l.DATABASE_URL+"/reviews/?restaurant_id="+e).then(function(e){return e.json()}).then(function(e){return t(null,e)}).catch(function(e){return t(e,"Error when fetching restaurant reviews from the remote server.")})}},{key:"updateRestaurantFavoriteState",value:function(e,t,n){fetch(l.DATABASE_URL+"/restaurants/"+e+"/?is_favorite="+t,{method:"PUT"}).then(function(e){return n(null,e)}).catch(function(e){return n(e,"Error when updating favorite state to the remote server.")})}},{key:"urlForRestaurant",value:function(e){return"./restaurant.html?id="+e.id}},{key:"imageUrlForRestaurant",value:function(e){return"/img/"+e.photograph+".webp"}},{key:"mapMarkerForRestaurant",value:function(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:l.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}},{key:"DATABASE_URL",get:function(){return"http://localhost:1337"}}]),l}();
"use strict";!function(){function u(n){return new Promise(function(e,t){n.onsuccess=function(){e(n.result)},n.onerror=function(){t(n.error)}})}function i(n,o,r){var i,e=new Promise(function(e,t){u(i=n[o].apply(n,r)).then(e,t)});return e.request=i,e}function e(e,n,t){t.forEach(function(t){Object.defineProperty(e.prototype,t,{get:function(){return this[n][t]},set:function(e){this[n][t]=e}})})}function t(t,n,o,e){e.forEach(function(e){e in o.prototype&&(t.prototype[e]=function(){return i(this[n],e,arguments)})})}function n(t,n,o,e){e.forEach(function(e){e in o.prototype&&(t.prototype[e]=function(){return this[n][e].apply(this[n],arguments)})})}function o(e,o,t,n){n.forEach(function(n){n in t.prototype&&(e.prototype[n]=function(){return e=this[o],(t=i(e,n,arguments)).then(function(e){if(e)return new c(e,t.request)});var e,t})})}function r(e){this._index=e}function c(e,t){this._cursor=e,this._request=t}function s(e){this._store=e}function a(n){this._tx=n,this.complete=new Promise(function(e,t){n.oncomplete=function(){e()},n.onerror=function(){t(n.error)},n.onabort=function(){t(n.error)}})}function p(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new a(n)}function f(e){this._db=e}e(r,"_index",["name","keyPath","multiEntry","unique"]),t(r,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),o(r,"_index",IDBIndex,["openCursor","openKeyCursor"]),e(c,"_cursor",["direction","key","primaryKey","value"]),t(c,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(n){n in IDBCursor.prototype&&(c.prototype[n]=function(){var t=this,e=arguments;return Promise.resolve().then(function(){return t._cursor[n].apply(t._cursor,e),u(t._request).then(function(e){if(e)return new c(e,t._request)})})})}),s.prototype.createIndex=function(){return new r(this._store.createIndex.apply(this._store,arguments))},s.prototype.index=function(){return new r(this._store.index.apply(this._store,arguments))},e(s,"_store",["name","keyPath","indexNames","autoIncrement"]),t(s,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),o(s,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),n(s,"_store",IDBObjectStore,["deleteIndex"]),a.prototype.objectStore=function(){return new s(this._tx.objectStore.apply(this._tx,arguments))},e(a,"_tx",["objectStoreNames","mode"]),n(a,"_tx",IDBTransaction,["abort"]),p.prototype.createObjectStore=function(){return new s(this._db.createObjectStore.apply(this._db,arguments))},e(p,"_db",["name","version","objectStoreNames"]),n(p,"_db",IDBDatabase,["deleteObjectStore","close"]),f.prototype.transaction=function(){return new a(this._db.transaction.apply(this._db,arguments))},e(f,"_db",["name","version","objectStoreNames"]),n(f,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(i){[s,r].forEach(function(e){e.prototype[i.replace("open","iterate")]=function(){var e,t=(e=arguments,Array.prototype.slice.call(e)),n=t[t.length-1],o=this._store||this._index,r=o[i].apply(o,t.slice(0,-1));r.onsuccess=function(){n(r.result)}}})}),[r,s].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,n){var o=this,r=[];return new Promise(function(t){o.iterateCursor(e,function(e){e?(r.push(e.value),void 0===n||r.length!=n?e.continue():t(r)):t(r)})})})});var d={open:function(e,t,n){var o=i(indexedDB,"open",[e,t]),r=o.request;return r.onupgradeneeded=function(e){n&&n(new p(r.result,e.oldVersion,r.transaction))},o.then(function(e){return new f(e)})},delete:function(e){return i(indexedDB,"deleteDatabase",[e])}};"undefined"!=typeof module?(module.exports=d,module.exports.default=module.exports):self.idb=d}();
"use strict";var _createClass=function(){function i(e,t){for(var a=0;a<t.length;a++){var i=t[a];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(e,t,a){return t&&i(e.prototype,t),a&&i(e,a),e}}();function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var AddReviewDialog=function(){function t(e){_classCallCheck(this,t),this.submitCallback=e,this.focusableElements=[],this.ratingFields=[],this.lastFocusedElementBeforeOpen=null,this.currentFocusIndex=1,this.focusIndexOnOpen=1,this.createContents()}return _createClass(t,[{key:"createContents",value:function(){var e=this;this.dialog=document.createElement("div"),this.dialog.className="modal",this.dialog.setAttribute("aria-modal","true");var t=document.createElement("div");t.className="modal-content";var a=document.createElement("input");a.className="modal-close",a.setAttribute("type","button"),a.setAttribute("aria-label","Close dialog"),a.value="×",a.onclick=function(){return e.close()},t.append(a),this.focusableElements.push(a);var i=document.createElement("h3");i.className="add-review-title",i.innerHTML="Add new review",t.append(i);var n=document.createElement("p");n.className="add-review-subtitle",n.innerHTML="Name",t.append(n),this.nameField=document.createElement("input"),this.nameField.className="add-review-input",this.nameField.setAttribute("type","text"),this.nameField.setAttribute("aria-label","Name"),t.append(this.nameField),this.focusableElements.push(this.nameField);var s=document.createElement("p");s.className="add-review-subtitle",s.innerHTML="Rating",t.append(s);var l=document.createElement("fieldset");l.className="add-review-fieldset",l.id="add-review-rating";for(var r=1;r<=5;r++){var u=document.createElement("input");u.setAttribute("type","radio"),u.value=r,u.id="review-rating-"+r,u.className="add-review-radio",u.name="add-review-rating",u.setAttribute("aria-label","Set rating "+r+" of 5");var o=document.createElement("label");o.setAttribute("for","review-rating-"+r),o.innerHTML=r,this.ratingFields.push(u),l.append(u),l.append(o),this.focusableElements.push(u)}t.append(l);var c=document.createElement("p");c.className="add-review-subtitle",c.innerHTML="Comments",t.append(c),this.commentField=document.createElement("textarea"),this.commentField.className="add-review-textarea",this.commentField.setAttribute("aria-label","Comments"),t.append(this.commentField),this.focusableElements.push(this.commentField);var d=document.createElement("input");d.value="Submit",d.className="add-review-submit-button",d.setAttribute("type","button"),d.setAttribute("aria-label","Submit rating"),d.onclick=function(){return e.submitToCallback()},t.append(d),this.focusableElements.push(d),this.dialog.append(t),document.body.append(this.dialog)}},{key:"isOpen",value:function(){return"block"===this.dialog.style.display}},{key:"show",value:function(){this.initializeFields(),this.dialog.style.display="block",this.lastFocusedElementBeforeOpen=document.activeElement,this.focusableElements[this.focusIndexOnOpen].focus(),this.currentFocusIndex=this.focusIndexOnOpen}},{key:"close",value:function(){this.dialog.style.display="none",null!==this.lastFocusedElementBeforeOpen&&this.lastFocusedElementBeforeOpen.focus()}},{key:"initializeFields",value:function(){var e=!(this.nameField.value=""),t=!1,a=void 0;try{for(var i,n=this.ratingFields[Symbol.iterator]();!(e=(i=n.next()).done);e=!0){i.value.checked=!1}}catch(e){t=!0,a=e}finally{try{!e&&n.return&&n.return()}finally{if(t)throw a}}this.commentField.value=""}},{key:"validateFields",value:function(){return 0===this.getNameValue().length?"Missing name from the submitted review.":0===this.getCommentValue().length?"Missing comment from the submitted review.":0===this.getRatingValue()?"Missing rating from the submitted review.":""}},{key:"submitToCallback",value:function(){var e=this.validateFields();0<e.length?this.submitCallback(e,null):this.submitCallback(null,{name:this.getNameValue(),rating:this.getRatingValue(),comments:this.getCommentValue()})}},{key:"getNameValue",value:function(){return this.nameField.value}},{key:"getCommentValue",value:function(){return this.commentField.value}},{key:"getRatingValue",value:function(){var e=0,t=!0,a=!1,i=void 0;try{for(var n,s=this.ratingFields[Symbol.iterator]();!(t=(n=s.next()).done);t=!0){var l=n.value;l.checked&&(e=l.value)}}catch(e){a=!0,i=e}finally{try{!t&&s.return&&s.return()}finally{if(a)throw i}}return e}},{key:"handleClick",value:function(e){if(e.target===this.dialog)this.close();else if(this.isOpen()){var t=0,a=!0,i=!1,n=void 0;try{for(var s,l=this.focusableElements[Symbol.iterator]();!(a=(s=l.next()).done);a=!0){var r=s.value;e.target===r&&(this.currentFocusIndex=t),t++}}catch(e){i=!0,n=e}finally{try{!a&&l.return&&l.return()}finally{if(i)throw n}}}}},{key:"handleKeyDown",value:function(e){this.isOpen()&&(9===e.keyCode?(e.shiftKey?(this.currentFocusIndex--,this.currentFocusIndex<0&&(this.currentFocusIndex=this.focusableElements.length-1)):(this.currentFocusIndex++,this.currentFocusIndex>=this.focusableElements.length&&(this.currentFocusIndex=0)),this.focusableElements[this.currentFocusIndex].focus(),e.preventDefault()):27===e.keyCode&&(this.close(),e.preventDefault()))}}]),t}();
"use strict";var _createClass=function(){function t(e,s){for(var a=0;a<s.length;a++){var t=s[a];t.enumerable=t.enumerable||!1,t.configurable=!0,"value"in t&&(t.writable=!0),Object.defineProperty(e,t.key,t)}}return function(e,s,a){return s&&t(e.prototype,s),a&&t(e,a),e}}();function _classCallCheck(e,s){if(!(e instanceof s))throw new TypeError("Cannot call a class as a function")}var Snackbar=function(){function e(){_classCallCheck(this,e),this.messageArray=[],this.createContents()}return _createClass(e,[{key:"createContents",value:function(){this.snackbar=document.createElement("div"),this.snackbar.id="snackbar",this.snackbar.setAttribute("aria-live","polite"),document.body.append(this.snackbar)}},{key:"queueMessage",value:function(e,s){if(this.messageArray.push({text:e,style:s}),1===this.messageArray.length){var a=this.messageArray[0];this.showMessage(a.text,a.style)}}},{key:"showMessage",value:function(e,s){var a=this;this.snackbar.className="show",this.snackbar.innerHTML=e,this.snackbar.style.backgroundColor="success"===s?"#00802b":"error"===s?"#900":"#333",setTimeout(function(){if(a.messageArray.pop(a.messageArray.length-1),0<a.messageArray.length){var e=a.messageArray[a.messageArray.length-1];a.showMessage(e.text,e.style)}else a.snackbar.className=a.snackbar.className.replace("show","")},2e3)}}]),e}();