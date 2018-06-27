/*
DOM element selector
 */
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

/*
Fetch list of available countries to DOM
 */
const fetchCountries = (countries) => {
	let html = '';

	Object.values(countries).forEach(country => {
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
};

const convertCurrency = (amount, fromCurrency, toCurrency, cb) => {

	fromCurrency = encodeURIComponent(fromCurrency);
	toCurrency = encodeURIComponent(toCurrency);
	const query = fromCurrency + '_' + toCurrency;
	const url = 'https://free.currencyconverterapi.com/api/v5/convert?q='
		+ query + '&compact=ultra';

	fetch(url).then(res => res.json);
};
/*
IndexedDb initialization
 */
const dbPromise = idb.open('currencyConverter', 2, (upgradeDb) => {
	switch (upgradeDb.oldVersion) {
		case 0:
			upgradeDb.createObjectStore('countries', { keyPath: 'currencyId' });
		case 1:
			let countriesStore = upgradeDb.transaction.objectStore('countries');
			countriesStore.createIndex('country', 'name');
	}
});
/*
Update Service Worker Function
 */
const _updateReady = (sw) => {
	UIkit.modal.confirm('New Version Available')
	     .then(() => {
		     //  Accept
		     sw.postMessage({ action: 'skipWaiting' })
	     }, () => {
		     //  Reject
	     })
};

/*
Monitor SW install state
 */
const _trackInstalling = (sw) => {
	sw.addEventListener('statechange', () => {
		if (sw.state === 'installed') {
			return _updateReady(sw)
		}
	})
};
/*
Register Service Worker
 */
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
	// Fetch Countries
	fetch('https://free.currencyconverterapi.com/api/v5/countries')
		.then(res => res.json())
		.then(res => {
				Object.values(res.results).forEach(country => {
					dbPromise.then(db => {
						let countries = db.transaction('countries', 'readwrite').objectStore('countries');
						countries.put(country);
					})
				});
				fetchCountries(res.results);
			}
		).catch(() => {
		dbPromise.then(db => {
			const countries = db.transaction('countries').objectStore('countries');
			const countriesIndex = countries.index('country');
			countriesIndex.getAll().then(currencies => {
				fetchCountries(currencies);
			})

		});

	});
})();
