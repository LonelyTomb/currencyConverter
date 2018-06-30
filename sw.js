const version = 'v10';

const assetsCache = `assets-${version}`;
const coreCacheurls = [
    'uikit.min.css',
    'app.js',
    '/index.html',
    'idb.js',
    'uikit.min.js'
];

const addToCache = (cacheName, req, res) =>
    caches.open(cacheName).then(cache => {
        cache.put(req, res);
    });


self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(assetsCache)
        .then(cache => {
            cache.addAll(coreCacheurls)
                .then(() => {
                    console.log('Cached')
                })
        })
    )
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const headers = request.headers.get('Accept');
    const requestUrl = new URL(request.url);
    /*
    Non HTML requests
     */
    if (headers.indexOf('text/html') === -1) {
        // Don't cache  currencyconverterapi urls
        if (requestUrl.hostname === 'free.currencyconverterapi.com') {
            return fetch(request);
        }
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request).then(res => {
                    addToCache(assetsCache, request, res.clone());
                    return res;
                })
            })
        )
    }
    /*
    HTML Requests
     */
    if (headers.indexOf('text/html') !== -1) {
        //Page Skeleton
        if (requestUrl.pathname === '/') {
            return event.respondWith(caches.match('/index.html').then(res => {
                return res || fetch(request);
            }))
        } else {
            event.respondWith(
                caches.match(request).then(response => {
                    return response || fetch(request).then(res => {
                        addToCache(assetsCache, request, res.clone());
                        return res;
                    })
                })
            )
        }
    }

});
//
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        return self.skipWaiting()
    }
});

const clearCaches = () => {
    caches.keys().then(
        cachesNames => {
            return Promise.all(
                cachesNames
                .filter((cacheName) => {
                    return !cacheName.endsWith(version)
                })
                .map(cacheName => {
                    return caches.delete(cacheName)
                })
            )
        }
    )
}

self.addEventListener('activate', event => {
    event.waitUntil(
        clearCaches().then(() => {
            self.clients.claim()
        })
    )
});