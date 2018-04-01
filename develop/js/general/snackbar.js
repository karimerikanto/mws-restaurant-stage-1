/**
 * Snackbar functions.
 */
class Snackbar {
	/**
	* Show snackbar message.
	*/
	static showMessage(message, style) {
		var snackbar = document.getElementById('snackbar');

		if(snackbar === null) return;

		snackbar.className = 'show';
		snackbar.innerHTML = message;
		
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
			snackbar.className = snackbar.className.replace('show', ''); 
		}, 2000);
	}
}