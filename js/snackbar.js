/**
 * Snackbar functions.
 */
class Snackbar {
	/**
	* Show snackbar message.
	*/
	static showMessage(message) {
		var snackbar = document.getElementById('snackbar');

		if(snackbar === null) return;

		snackbar.className = 'show';
		snackbar.innerHTML = message;

		setTimeout(() => { 
			snackbar.className = snackbar.className.replace('show', ''); 
		}, 2000);
	}
}