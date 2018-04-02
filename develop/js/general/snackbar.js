/**
 * Snackbar.
 */
class Snackbar {
	constructor() {
		this.messageArray = [];
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
		var snackbar = document.getElementById('snackbar');

		if(snackbar === null) return;

		snackbar.className = 'show';
		snackbar.innerHTML = text;
		
		if(style === 'success'){
			snackbar.style.backgroundColor = '#00802b';
		}
		else if(style === 'error'){
			snackbar.style.backgroundColor ='#900';
		}
		else{
			snackbar.style.backgroundColor ='#333';
		}

		setTimeout(() => { 
			this.messageArray.pop(this.messageArray.length - 1);

			if(this.messageArray.length > 0){
				const message = this.messageArray[this.messageArray.length - 1];
				this.showMessage(message.text, message.style);
			}
			else {
				snackbar.className = snackbar.className.replace('show', ''); 
			}
		}, 2000);
	}
}