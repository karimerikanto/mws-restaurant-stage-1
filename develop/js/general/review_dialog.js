/**
 * Review dialog.
 */
class AddReviewDialog {
	constructor(submitCallback) {
		this.submitCallback = submitCallback;
		this.focusableElements = [];
		this.ratingFields = [];
		this.lastFocusedElementBeforeOpen = null;
		this.currentFocusIndex = 1;
		this.focusIndexOnOpen = 1;

		this.createContents();
	}

	/**
	* Create dialog contents.
	*/
	createContents() {
		//Dialog
  		this.dialog = document.createElement('div');
  		this.dialog.className = 'modal';
  		this.dialog.setAttribute('aria-modal', 'true');

  		//Content holder
  		const content = document.createElement('form');
  		content.className = 'modal-content';

  		//Close button
  		const closeButton = document.createElement('input');
  		closeButton.className = 'modal-close';
  		closeButton.setAttribute('type', 'button');
  		closeButton.setAttribute('aria-label', 'Close dialog');
  		closeButton.value = '×';
  		closeButton.onclick = () => this.close();

  		content.append(closeButton);
  		this.focusableElements.push(closeButton);

  		//Title
  		const title = document.createElement('h3');
  		title.className = 'add-review-title';
  		title.innerHTML = 'Add new review';

  		content.append(title);

  		//Name label
  		const nameLabel = document.createElement('label');
  		nameLabel.className = 'add-review-subtitle';
  		nameLabel.innerHTML = '* Name';
  		
  		content.append(nameLabel);

  		//Name field
  		this.nameField = document.createElement('input');
  		this.nameField.className = 'add-review-input';
  		this.nameField.setAttribute('type', 'text');
  		this.nameField.setAttribute('aria-label', 'Name');
  		
  		content.append(this.nameField);
  		this.focusableElements.push(this.nameField);

  		//Rating label
  		const ratingLabel = document.createElement('label');
  		ratingLabel.className = 'add-review-subtitle';
  		ratingLabel.innerHTML = '* Rating';
  		
  		content.append(ratingLabel);

  		//Rating fieldset
  		const ratingFieldSet = document.createElement('fieldset');
  		ratingFieldSet.className = 'add-review-fieldset';
  		ratingFieldSet.id = 'add-review-rating';

  		//Rating radio buttons
  		for(let i = 1; i <= 5; i++){
  			const radioButton = document.createElement('input');
  			radioButton.setAttribute('type', 'radio');
  			radioButton.value = i;
  			radioButton.id = `review-rating-${i}`;
  			radioButton.className = 'add-review-radio';
  			radioButton.name = 'add-review-rating';
  			radioButton.setAttribute('aria-label', `Set rating ${i} of 5`);

  			const radioButtonLabel = document.createElement('label');
  			radioButtonLabel.setAttribute('for', `review-rating-${i}`);
  			radioButtonLabel.innerHTML = i;

  			this.ratingFields.push(radioButton);
  			ratingFieldSet.append(radioButton);
  			ratingFieldSet.append(radioButtonLabel);
  			this.focusableElements.push(radioButton);
  		}
  		
  		content.append(ratingFieldSet);

  		//Comment label
  		const commentLabel = document.createElement('label');
  		commentLabel.className = 'add-review-subtitle';
  		commentLabel.innerHTML = '* Comments';
  		
  		content.append(commentLabel);

  		//Comment field
  		this.commentField = document.createElement('textarea');
  		this.commentField.className = 'add-review-textarea';
  		this.commentField.setAttribute('aria-label', 'Comments');
  		
  		content.append(this.commentField);
  		this.focusableElements.push(this.commentField);

  		//Submit button
  		const submitButton = document.createElement('input');
  		submitButton.value = 'Submit';
  		submitButton.className = 'add-review-submit-button';
  		submitButton.setAttribute('type', 'button');
  		submitButton.setAttribute('aria-label', 'Submit rating');
  		submitButton.onclick = () => this.submitToCallback();

  		content.append(submitButton);
  		this.focusableElements.push(submitButton);

  		this.dialog.append(content);

  		document.body.append(this.dialog);
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
	* Submit dialog to the callback function.
	*/
	submitToCallback () {
		const error = this.validateFields();

		if(error.length > 0){
			this.submitCallback(error, null);
			return;
		}

		this.submitCallback(null, {
			name: this.getNameValue(),
			rating: this.getRatingValue(),
			comments: this.getCommentValue()
		})
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