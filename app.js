const el = e => document.querySelector(e);
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
(() => {
	fetch('https://free.currencyconverterapi.com/api/v5/countries').then(res => res.json()).then(res => {
			let html = '';
			for (let country of Object.values(res.results)) {
				console.log(country);
				html += `<option value="${country.currencyId}">${country.currencySymbol} ${country.currencyName}</option>`;
			}
			el("#currency-1").insertAdjacentHTML('afterbegin', html);
			el("#currency-2").insertAdjacentHTML('afterbegin', html);
		}
	);
})();
