const CACHE_VERSION = "v1.0.4";
const CACHE_NAME = `conversor-moedas-${CACHE_VERSION}`;

const APP_SHELL = [
    "./",
    "./index.html",
    "./404.html",
    "./sobre.html",
    "./politica-privacidade.html",
    "./termos-uso.html",
    "./ads.txt",
    "./robots.txt",
    "./sitemap.xml",
    "./site.webmanifest",

    "./css/styles.css",

    "./js/api.js",
    "./js/ui.js",
    "./js/history.js",
    "./js/favorites.js",
    "./js/theme.js",
    "./js/dashboard.js",
    "./js/converter.js",
    "./js/news.js",
    "./js/app.js",

    "./assets/logo.svg",
    "./assets/favicon.ico",
    "./assets/apple-touch-icon.png",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/preview.jpg"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.allSettled(
                    APP_SHELL.map(url => cache.add(url))
                );
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});

function isHttpRequest(request) {
    return request.url.startsWith("http");
}

function isSameOrigin(request) {
    return new URL(request.url).origin === self.location.origin;
}

function isApiRequest(request) {
    return request.url.includes("economia.awesomeapi.com.br");
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);

        if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cached = await caches.match(request);

        if (cached) {
            return cached;
        }

        throw error;
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);

    if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
    }

    return response;
}

self.addEventListener("fetch", event => {
    const { request } = event;

    if (request.method !== "GET") return;
    if (!isHttpRequest(request)) return;

    if (isApiRequest(request)) {
        event.respondWith(networkFirst(request));
        return;
    }

    if (isSameOrigin(request)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(networkFirst(request));
});

self.addEventListener("message", event => {
    if (!event.data) return;

    if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }

    if (event.data.type === "CLEAR_CACHE") {
        event.waitUntil(
            caches.keys().then(keys => {
                return Promise.all(keys.map(key => caches.delete(key)));
            })
        );
    }
});