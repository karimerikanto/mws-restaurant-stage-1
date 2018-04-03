/**
 * Snackbar.
 */
class Snackbar {
	constructor() {
		this.messageArray = [];
		this.createContents();
	}

	/**
	* Create snackbar contents.
	*/
	createContents() {
		this.snackbar = document.createElement('div');
		this.snackbar.id = 'snackbar';
		this.snackbar.setAttribute('aria-live', 'polite');

		document.body.append(this.snackbar);
	}

	/**
	* Queue new snackbar message.
	*/
	queueMessage (text, style) {
		this.messageArray.push({
			text,
			style
		});

		if(this.messageArray.length === 1){
			const message = this.messageArray[0];
			this.showMessage(message.text, message.style);
		}
	}

	/**
	* Show snackbar message.
	*/
	showMessage (text, style) {
		this.snackbar.className = 'show';
		this.snackbar.innerHTML = text;
		
		if(style === 'success'){
			this.snackbar.style.backgroundColor = '#00802b';
		}
		else if(style === 'error'){
			this.snackbar.style.backgroundColor ='#900';
		}
		else{
			this.snackbar.style.backgroundColor ='#333';
		}

		setTimeout(() => { 
			this.messageArray.pop(this.messageArray.length - 1);

			if(this.messageArray.length > 0){
				const message = this.messageArray[this.messageArray.length - 1];
				this.showMessage(message.text, message.style);
			}
			else {
				this.snackbar.className = this.snackbar.className.replace('show', ''); 
			}
		}, 2000);
	}
}