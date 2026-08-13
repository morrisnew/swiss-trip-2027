
/* Swiss Trip PWA Service Worker · V21.7d Deployment Cache Revision (accsync-r2) */
/* 網站版本維持 V21.7d（TRIP_META.version 不變）。本檔為同版 Service Worker 之
   deployment cache revision：Accommodation Sync 後又完成 Final Micro-Patch（Day 11 08:40
   stale residual 修正、actual CHF 不再顯示「約」），為讓已安裝於前一版 cache 的 PWA 取得
   最新 data.js／app.js，cache 由 swiss-trip-v21-7d-final-accsync-2027 改為
   swiss-trip-v21-7d-final-accsync-r2-2027。install/activate/fetch 架構未變更。 */
const CACHE_NAME = "swiss-trip-v21-7d-final-accsync-r2-2027";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./style.css",
  "./manifest.json"
];

// install：核心 asset 一次 cache.addAll(ASSETS)。任一失敗即 throw，
// 讓 install promise reject，避免不完整 Service Worker 接管
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch((err) => {
        console.error("[SW] precache failed", err);
        throw err;
      })
  );
});

// activate：清除舊 cache、宣告控制權
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// fetch：同源 cache-first、跨域走網路
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch (err) {
    return;
  }

  // 跨網域（例如 Google Maps、外部 API、Google Fonts CDN）不攔截
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          // SPA 導航保底 index.html
          if (event.request.mode === "navigate" || event.request.destination === "document") {
            return caches.match("./index.html");
          }
          return new Response("", { status: 503, statusText: "offline (service worker fallback)" });
        });
    })
  );
});
