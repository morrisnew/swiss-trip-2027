
/* Swiss Trip PWA Service Worker */
const CACHE_NAME = "swiss-trip-v21-3c-2027";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./style.css",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // 只處理 GET
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // 跨網域（如 Google Maps）直接走網路
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // 只快取成功的同源請求
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
