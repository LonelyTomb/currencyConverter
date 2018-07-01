"use strict"
/*
DOM element selector
 */
const el = e => document.querySelector(e);

/*
IndexedDb initialization
 */
const dbPromise = idb.open('currencyConverter', 3, (upgradeDb) => {
    switch (upgradeDb.oldVersion) {
        case 0:
            upgradeDb.createObjectStore('countries', { keyPath: 'currencyId' });
        case 1:
            const countriesStore = upgradeDb.transaction.objectStore('countries');
            countriesStore.createIndex('country', 'currencyName');
            countriesStore.createIndex('country-code', 'currencyId');
        case 2:
            upgradeDb.createObjectStore('conversionRates', { keyPath: 'id' });
            const ratesStore = upgradeDb.transaction.objectStore('conversionRates');
            ratesStore.createIndex('rates-fr', 'fr');
            ratesStore.createIndex('rates-to', 'to');
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
    navigator.serviceWorker.register('sw.js').then(sw => {

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
    }).catch(error => {
        console.log('fail', error)
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
    })
}

// const getFromCurrencyName = () => {
// 	return el("#fromCurrency").value;
// };
// const getToCurrencyName = () => {
// 	return el("#toCurrency").value;
// };
const getFromCurrencyId = () => {
    return el("#fromCurrency").value;
};
const getToCurrencyId = () => {
    return el("#toCurrency").value;
};
const getFromCurrencyValue = () => {
    return el("#fromCurrencyValue").value;
};
const formatCurrency = (currency, id) => currency.toLocaleString('en-US', { 'currency': id })
    /*
    Fetch list of available countries to DOM
     */
const fetchCountries = (countries) => {
    let html = '';

    Object.values(countries).forEach(country => {
        html += `<option value="${country.currencyId}">[${country.currencySymbol}] ${country.currencyName}</option>`;
    });

    el("#fromCurrency").insertAdjacentHTML('afterbegin', html);
    el("#toCurrency").insertAdjacentHTML('afterbegin', html);

    el("#fromCurrency").addEventListener('change', () => {
        html = `${formatCurrency(getFromCurrencyValue(), getFromCurrencyId())} to  ${getToCurrencyId()}`;
        el('.results').innerText = html;
    });
};
/*
Generate conversion url
 */
const convertCurrencyURL = (amount, fromCurrency, toCurrency) => {

    fromCurrency = encodeURIComponent(fromCurrency);
    toCurrency = encodeURIComponent(toCurrency);
    const query = `${fromCurrency}_${toCurrency}`;
    const reverseQuery = `${toCurrency}_${fromCurrency}`;
    return { url: `https://free.currencyconverterapi.com/api/v5/convert?q=${query},${reverseQuery}`, query: query };

};
/*
Convert currency
 */
const saveRate = (data) => {
    dbPromise.then(db => {
        const ratesStore = db.transaction('conversionRates', 'readwrite').objectStore('conversionRates');
        Object.values(data).forEach(rate => {
            ratesStore.put(rate);
        })
    });
}
const convertCurrency = (data) => {
    const rate = data.val;
    const result = Math.round((rate * getFromCurrencyValue() * 100)) / 100;

    el('.results').innerText = `${getFromCurrencyValue()} ${getFromCurrencyId()} equals ${result} ${getToCurrencyId()}`;


    dbPromise.then(db => {

        const card = document.createElement('div');

        card.setAttribute('class', "uk-card uk-card-default uk-card-body uk-width-1-3" +
            " uk-margin-auto uk-padding-small");
        card.setAttribute('id', "conversionResults");
        const countries = db.transaction('countries').objectStore('countries');

        countries.get(getToCurrencyId()).then((res) => {
            card.innerText = `[${res.currencySymbol}] ${result.toLocaleString('en-US')}`;

            el('.rate').removeChild(el('#conversionResults'));
            el('.rate').appendChild(card);
        });
    });
};


document.addEventListener('DOMContentLoaded', () => {
    /*
     Fetch Countries Process
      */
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
                const countriesIndex = countries.index('country');
                countriesIndex.getAll().then(currencies => {
                    fetchCountries(currencies);
                })
            })
        }).catch(() => {
            dbPromise.then(db => {
                const countries = db.transaction('countries').objectStore('countries');
                const countriesIndex = countries.index('country');
                countriesIndex.getAll().then(currencies => {
                    fetchCountries(currencies);
                })

            });
        });


    /*
    Conversion Process
     */
    el('.convert').addEventListener('click', (e) => {
        const { url, query } = convertCurrencyURL(getFromCurrencyValue(), getFromCurrencyId(), getToCurrencyId());
        fetch(url)
            .then(res => res.json())
            .then(data => {
                convertCurrency(data.results[query]);
                saveRate(data.results);
            })
            .catch(() => {
                dbPromise.then(db => {
                    const rates = db.transaction('conversionRates').objectStore('conversionRates');

                    rates.get(query)
                        .then((res) => {
                            if (res == undefined) {
                                UIkit.notification({
                                    message: '<p>Conversion rate unavailable offline</p>',
                                    status: 'warning'
                                })
                                return;
                            }
                            convertCurrency(res)

                        })
                })

            });
        e.preventDefault();
    });
});