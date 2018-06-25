let _updateReady = (sw) => {
	UIkit.modal.confirm('New Version Available')
	     .then(() => {
		     //  Accept
		     sw.postMessage({ action: 'skipWaiting' })
	     }, () => {
		     //  Reject
	     })
};

let _trackInstalling = (sw) => {
	sw.addEventListener('statechange', () => {
		if (sw.state === 'installed') {
			return _updateReady(sw)
		}
	})
};

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js', {
		scope: '/'
	}).then(sw => {
			if (sw.waiting) {
				_updateReady(sw.waiting);
				return
			}
			if (sw.installing) {
				_trackInstalling(sw.installing);
				return
			}
			sw.addEventListener('updatefound', () => {
				_trackInstalling(sw.installing)
			})
		}
	).catch(error => {
		console.log('fail', error)
	})
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		window.location.reload()
	})
}