/**
 * Review dialog.
 */
class AddReviewDialog {
	constructor() {
		this.dialog = document.getElementById('addReviewDialog');
		this.focusableElements = this.dialog.querySelectorAll('[tabindex="0"]');
		this.lastFocusedElementBeforeOpen = null;

		this.nameField = document.getElementById('add-review-name');
		this.ratingFields = document.getElementsByClassName('add-review-radio');
		this.commentField = document.getElementById('add-review-comment');
		this.currentFocusIndex = 1;
		this.focusIndexOnOpen = 1;
	}

	/**
	* Is the dialog open.
	*/
	isOpen() {
		return this.dialog.style.display === 'block';
	}

	/**
	* Show dialog.
	*/
	show () {
		this.initializeFields();
		this.dialog.style.display = 'block';
		this.lastFocusedElementBeforeOpen = document.activeElement;
		this.focusableElements[this.focusIndexOnOpen].focus();
		this.currentFocusIndex = this.focusIndexOnOpen;
	}

	/**
	* Close dialog.
	*/
	close () {
	  	this.dialog.style.display = 'none';

	  	if(this.lastFocusedElementBeforeOpen !== null){
	  		this.lastFocusedElementBeforeOpen.focus();
	  	}
	}

	/**
	* Initialize dialog fields.
	*/
	initializeFields () {
		this.nameField.value = '';

	  	for(const ratingField of this.ratingFields){
	    	ratingField.checked = false;
	  	}

	  	this.commentField.value = '';
	}

	/**
	* Validate fields.
	*/
	validateFields () {
		if(this.getNameValue().length === 0){
			return 'Missing name from the submitted review.';
		}

		if(this.getCommentValue().length === 0){
			return 'Missing comment from the submitted review.';
		}

	  	if(this.getRatingValue() === 0){
	  		return 'Missing rating from the submitted review.';
	  	}

	  	return '';
	}

	/**
	* Submit dialog
	*/
	submit () {
		const errorMessage = this.validateFields();

		if(errorMessage.length > 0){
			return errorMessage;
		}

		return '';
	}

	/**
	* Get value from the name field
	*/
	getNameValue() {
		return this.nameField.value;
	}

	/**
	* Get value from the comment field
	*/
	getCommentValue() {
		return this.commentField.value;
	}

	/**
	* Get selected rating from the rating fields
	*/
	getRatingValue() {
		let rating = 0;

	  	for(const ratingField of this.ratingFields){
	    	if(ratingField.checked){
	      		rating = ratingField.value;
	    	}
	  	}

	  	return rating;
	}

	/**
	* Handle click events
	*/
	handleClick(e) {
		if(e.target === this.dialog){
	      this.close();
	    }
	    else if(this.isOpen()){

	    	//Set new focus index is some element is clicked.
	    	let index = 0;
	    	for(const element of this.focusableElements) {
	    		if(e.target === element){
	    			this.currentFocusIndex = index;
	    		}

	    		index++;
	    	}
		}
	}

	/**
	* Handle key down events
	*/
	handleKeyDown(e) {
		if(this.isOpen()){
			if(e.keyCode === 9){ //TAB

				if(e.shiftKey){
					this.currentFocusIndex--;

					if(this.currentFocusIndex < 0){
						this.currentFocusIndex = this.focusableElements.length - 1;
					}
				}
				else{
					this.currentFocusIndex++;

					if(this.currentFocusIndex >= this.focusableElements.length){
						this.currentFocusIndex = 0;
					}
				}

				this.focusableElements[this.currentFocusIndex].focus();
				e.preventDefault();
			}
			else if(e.keyCode === 27){
				this.close();
				e.preventDefault();
			}
		}
	}
}