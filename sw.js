/* ==========================================================
   Conversor de Moedas
   sw.js
   Service Worker / PWA
========================================================== */

const CACHE_VERSION = "v1.0.1";
const CACHE_NAME = `conversor-moedas-${CACHE_VERSION}`;

const APP_SHELL = [
    "./",
    "./index.html",
    "./404.html",
    "./sobre.html",
    "./politica-privacidade.html",
    "./termos-uso.html",
    "./site.webmanifest",
    "./css/styles.css",
    "./js/api.js",
    "./js/ui.js",
    "./js/history.js",
    "./js/favorites.js",
    "./js/theme.js",
    "./js/dashboard.js",
    "./js/converter.js",
    "./js/app.js",
    "./assets/logo.svg",
    "./assets/favicon.ico",
    "./assets/apple-touch-icon.png",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/preview.jpg"
];

const OFFLINE_FALLBACK = "./404.html";

/* ==========================================================
   INSTALL
========================================================== */

self.addEventListener("install", event => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.allSettled(
                    APP_SHELL.map(file => cache.add(file))
                );
            })
    );
});

/* ==========================================================
   ACTIVATE
========================================================== */

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

/* ==========================================================
   HELPERS
========================================================== */

function isHttpRequest(request) {
    return request.url.startsWith("http");
}

function isSameOrigin(request) {
    return new URL(request.url).origin === self.location.origin;
}

function isNavigationRequest(request) {
    return request.mode === "navigate";
}

function isApiRequest(request) {
    return request.url.includes("economia.awesomeapi.com.br");
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);

        const cache = await caches.open(CACHE_NAME);

        cache.put(request, response.clone());

        return response;
    } catch {
        const cached = await caches.match(request);

        if (cached) {
            return cached;
        }

        if (isNavigationRequest(request)) {
            return caches.match(OFFLINE_FALLBACK);
        }

        throw new Error("Recurso indisponível offline.");
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);

    const cache = await caches.open(CACHE_NAME);

    cache.put(request, response.clone());

    return response;
}

/* ==========================================================
   FETCH
========================================================== */

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

/* ==========================================================
   MESSAGE
========================================================== */

self.addEventListener("message", event => {
    if (!event.data) return;

    if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }

    if (event.data.type === "CLEAR_CACHE") {
        event.waitUntil(
            caches.keys()
                .then(keys => {
                    return Promise.all(
                        keys.map(key => caches.delete(key))
                    );
                })
        );
    }
});