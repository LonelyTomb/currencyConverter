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

const convertCurrency = (amount, fromCurrency, toCurrency) => {

	fromCurrency = encodeURIComponent(fromCurrency);
	toCurrency = encodeURIComponent(toCurrency);
	const query = fromCurrency + '_' + toCurrency;
	return `https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=ultra`;

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
			countriesStore.createIndex('country-code', 'currencyId')
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


document.addEventListener('DOMContentLoaded', () => {
	// Fetch Countries
	fetch('https://free.currencyconverterapi.com/api/v5/countries')
		.then(res => res.json())
		.then(res => {

				Object.values(res.results).forEach(country => {
					dbPromise.then(db => {
						const countries = db.transaction('countries', 'readwrite').objectStore('countries');
						countries.put(country);
					})
				});
				dbPromise.then(db => {
					const countries = db.transaction('countries', 'readwrite').objectStore('countries');
					const countriesIndex = countries.index('country-code');
					countriesIndex.getAll().then(currencies => {
						fetchCountries(currencies);
					})
				})
			}
		).catch(() => {
		dbPromise.then(db => {
			const countries = db.transaction('countries').objectStore('countries');
			const countriesIndex = countries.index('country-code');
			countriesIndex.getAll().then(currencies => {
				fetchCountries(currencies);
			})

		});
	});

	el('.convert').addEventListener('click', (e) => {
		const url = convertCurrency(getFromCurrencyValue(), getFromCurrencyId(), getToCurrencyId());
		fetch(url).then(res => res.json())
		          .then(data => {
			          let rate = Object.values(data).toString();
			          let result = Math.round((rate * getFromCurrencyValue() * 100)) / 100;
			          console.log(result);
		          });
		e.preventDefault();
	});
});


