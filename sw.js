
/* Swiss Trip PWA Service Worker · V21.8c (Itinerary V21.4g + Final Residual Seal) */
/* Web App version: V21.8c；Itinerary data version: V21.4g（兩條版本線分開）。
   V21.8c：Final Residual Seal（R01 Day 8 午餐 wording、R02 固定午睡 wording、R03 Luzern 行李櫃台 specific link、R04 Interlaken Ost/BOB link），
   僅 data.js 變更，cache 由 swiss-trip-v21-8b-v21-4g-corrective-2027 改為 swiss-trip-v21-8c-v21-4g-final-residual-seal-2027，
   以觸發既有 PWA 重新 install/precache。install/activate/fetch 架構未變更。
   Maps 的簡化示意圖與說明文字內建於 app.js／data.js，隨核心資產一併 precache → 離線可看；
   Google Maps／官方即時連結需要網路，已於 UI 明示。 */
const CACHE_NAME = "swiss-trip-v21-8c-v21-4g-final-residual-seal-2027";
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
