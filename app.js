const el = e => document.querySelector(e);
const insertHTML = (e) => {

}
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
	// https.get(url, function(res){
	//     var body = '';
	//
	//     res.on('data', function(chunk){
	//         body += chunk;
	//     });
	//
	//     res.on('end', function(){
	//         try {
	//           var jsonObj = JSON.parse(body);
	//
	//           var val = jsonObj[query];
	//           if (val) {
	//             var total = val * amount;
	//             cb(null, Math.round(total * 100) / 100);
	//           } else {
	//             var err = new Error("Value not found for " + query);
	//             console.log(err);
	//             cb(err);
	//           }
	//         } catch(e) {
	//           console.log("Parse error: ", e);
	//           cb(e);
	//         }

}

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
