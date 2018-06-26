const el = e => document.querySelector(e);
const getFromCurrencyName = () => {
	return el("#fromCurrency").value;
};
const getToCurrencyName = () => {
	return el("#toCurrency").value;
};
const getFromCurrencyId = () => {
	return el("#fromCurrency").value;
};
const getToCurrencyId = () => {
	return el("#toCurrency").value;
};
const getFromCurrencyValue = () => {
	return el("#fromCurrencyValue").value;
};
const getToCurrencyValue = () => {
	return el("#toCurrencyValue").value;
};

const convertCurrency = (amount, fromCurrency, toCurrency, cb) => {

	fromCurrency = encodeURIComponent(fromCurrency);
	toCurrency = encodeURIComponent(toCurrency);
	const query = fromCurrency + '_' + toCurrency;
	const url = 'https://free.currencyconverterapi.com/api/v5/convert?q='
		+ query + '&compact=ultra';

	fetch(url).then(res => res.json);
};
let dbPromise = idb.open('currencyConverter', 1, (upgradeDb) => {
	switch (upgradeDb.oldVersion) {
		case 0:
			upgradeDb.createObjectStore('countries', { keyPath: 'currencyId' })
	}
});

let _updateReady = (sw) => {
	UIkit.modal.confirm('New Version Available')
	     .then(() => {
		     //  Accept
		     sw.postMessage({ action: 'skipWaiting' })
	     }, () => {
		     //  Reject
	     })
};
const a = new Promise((resolve, reject) => {
	const a = fetch('https://free.currencyconverterapi.com/api/v5/countries');
	setTimeout(() => {
		resolve(a);
	}, 5000);
	setTimeout(() => {
		reject('a');
	}, 5000);
});
a.then(res => {
	console.log(res.json());
}).catch(err => {
	console.log(err);
});

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
	});
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		window.location.reload()
	})
}
(() => {
	fetch('https://free.currencyconverterapi.com/api/v5/countries').then(res => res.json()).then(res => {
			let html = '';
			Object.values(res.results).forEach(country => {
				html += `<option value="${country.currencyId}">${country.currencySymbol} ${country.currencyName}</option>`;
			});
			el("#fromCurrency").insertAdjacentHTML('afterbegin', html);
			el("#toCurrency").insertAdjacentHTML('afterbegin', html);
			html = `${getFromCurrencyValue()} ${getFromCurrencyId()} to ${getToCurrencyValue()} ${getToCurrencyId()}`;
			el('.results').innerText = html;

			el("#fromCurrency").addEventListener('change', () => {
				html = `${getFromCurrencyValue()} ${getFromCurrencyId()} to ${getToCurrencyValue()} ${getToCurrencyId()}`;
				el('.results').innerText = html;
			});
			el("#toCurrency").addEventListener('change', () => {
				html = `${getFromCurrencyValue()} ${getFromCurrencyId()} to ${getToCurrencyValue()} ${getToCurrencyId()}`;
				el('.results').innerText = html;
			})
		}
	);
})();
