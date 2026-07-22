const CACHE_VERSION = "cocktailapp-v6";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  OFFLINE_URL,
  "/icon-192.png",
  "/icon-512.png",
];

const loadPrecacheUrls = async () => {
  try {
    const response = await fetch("/sw-manifest.json", { cache: "no-store" });

    if (!response.ok) {
      return APP_SHELL;
    }

    const manifest = await response.json();

    if (!Array.isArray(manifest.urls)) {
      return APP_SHELL;
    }

    return Array.from(new Set([...APP_SHELL, ...manifest.urls]));
  } catch {
    return APP_SHELL;
  }
};

const offlineResponse = () =>
  new Response(
    "<!doctype html><title>Offline</title><main style=\"font-family:system-ui;padding:32px;text-align:center\"><h1>You are offline</h1><p>CocktailApp cannot load right now. Check your connection and try again.</p></main>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => {
        const urls = await loadPrecacheUrls();
        await cache.put(OFFLINE_URL, offlineResponse().clone());
        await Promise.allSettled(urls.map((url) => cache.add(url)));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const isApiRequest = (url) =>
  url.pathname.startsWith("/api") ||
  url.pathname.startsWith("/socket.io") ||
  url.pathname.startsWith("/uploads");

const isStaticAsset = (request, url) =>
  request.destination === "script" ||
  request.destination === "style" ||
  request.destination === "font" ||
  request.destination === "image" ||
  url.pathname.startsWith("/assets/");

const navigationFallback = async (request) => {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    return (await caches.match(OFFLINE_URL)) || offlineResponse();
  }
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    return cached || Response.error();
  }
};

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || isApiRequest(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigationFallback(request));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request));
  }
});
