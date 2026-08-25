/**
 * V21.7d · Final Deployment Cache Revision — Service Worker Revision Tests
 * 執行：node scenario_tests_service_worker_revision.js
 *
 * 定位（§7）：驗證 sw.js 的 deployment cache revision 與既有 PWA 升級路徑。
 *   - Static revision：CACHE_NAME = swiss-trip-v21-8c1-v21-4g-maps-expansion-2027；不接受舊 cache 為 current；ASSETS 完整
 *   - Install：caches.open(new) → cache.addAll(ASSETS)；成功 install 完成、失敗 install reject（不吞錯）
 *   - Activate：caches.keys() → 刪除所有非 current 舊 cache（含初次 v21-7d、v21-7c）、保留新 final、clients.claim()
 *   - Fetch：GET-only、跨域不攔截、同源 cache-first、成功 fetch put 進新 cache、navigate 離線 fallback index、非 document 離線 503
 *   - Package integrity guard：./app.js 於 ASSETS，且交付 app.js 為含全站 storage correction 的最新版
 *
 * 直接載入並執行正式 sw.js 的 install/activate/fetch handler（mock caches/fetch/self），不複寫假 SW。
 */
const fs = require("fs");
const path = require("path");
const swSrc = fs.readFileSync(path.join(__dirname, "sw.js"), "utf-8");
const appSrc = fs.readFileSync(path.join(__dirname, "app.js"), "utf-8");

const NEW_CACHE = "swiss-trip-v21-8c1-v21-4g-maps-expansion-2027";
const PREV_FINAL = "swiss-trip-v21-8c1-v21-4g-dark-mode-seal-2027";
const OLD_CACHE = "swiss-trip-v21-7d-2027";

// ── 測試框架 ──────────────────────────────────────────────────────
let pass = 0, fail = 0; const failures = [];
function section(t) { console.log("\n" + "─".repeat(72) + "\n" + t + "\n" + "─".repeat(72)); }
function check(name, cond) {
  if (cond === true) { pass++; console.log("  ✅ " + name); }
  else { fail++; failures.push(name); console.log("  ❌ " + name); }
}
async function checkA(name, fn) { try { check(name, (await fn()) === true); } catch (e) { check(name + "（拋例外：" + e.message + "）", false); } }

// ── 載入正式 sw.js，捕捉 handler；提供 mock caches / fetch / self ──
function loadSW(opts) {
  opts = opts || {};
  const handlers = {};
  const log = { opened: [], addAll: [], deleted: [], put: [], claim: 0, skipWaiting: 0 };
  const keyOf = (req) => (typeof req === "string" ? req : (req && req.url) || String(req));

  const makeCache = (name) => ({
    name,
    addAll(assets) {
      log.addAll.push({ name, assets });
      if (opts.addAllFail) return Promise.reject(new Error("precache addAll failed (mock)"));
      return Promise.resolve();
    },
    put(req, res) { log.put.push({ name, key: keyOf(req), res }); return Promise.resolve(); }
  });

  const matchStore = opts.matchStore || {}; // key → response（模擬 cache 內容）
  const mockCaches = {
    open(name) { log.opened.push(name); return Promise.resolve(makeCache(name)); },
    keys() { return Promise.resolve((opts.existingKeys || []).slice()); },
    delete(k) { log.deleted.push(k); return Promise.resolve(true); },
    match(req) { return Promise.resolve(matchStore[keyOf(req)]); }
  };

  const mockSelf = {
    location: { origin: "https://swiss.example.com" },
    clients: { claim() { log.claim++; return Promise.resolve(); } },
    skipWaiting() { log.skipWaiting++; },
    addEventListener(type, fn) { handlers[type] = fn; }
  };

  const mockFetch = (req) => {
    if (opts.offline) return Promise.reject(new Error("offline (mock)"));
    // 預設回傳同源 200 basic
    const res = { status: 200, type: "basic", _req: req, clone() { return { status: 200, type: "basic", _clone: true }; } };
    return Promise.resolve(opts.fetchResponse || res);
  };

  // 以 Function 包裝，注入 mock 全域；正式 handler 內部 const CACHE_NAME/ASSETS 由 closure 解析
  const runner = new Function("self", "caches", "fetch", "Response", "URL", "console",
    swSrc + "\n//# sourceURL=sw.js");
  const MockResponse = function (body, init) { init = init || {}; this.body = body; this.status = init.status; this.statusText = init.statusText; this.type = "default"; };
  runner(mockSelf, mockCaches, mockFetch, MockResponse, URL, console);

  return { handlers, log, mockCaches, MockResponse };
}

// mock 事件
function makeEvent(extra) {
  const ev = Object.assign({ _waited: null, _responded: false, _response: undefined }, extra);
  ev.waitUntil = (p) => { ev._waited = p; };
  ev.respondWith = (p) => { ev._responded = true; ev._response = p; };
  return ev;
}
const flush = () => new Promise((r) => setTimeout(r, 0));

(async () => {
  console.log("=".repeat(72));
  console.log("V21.7d · Service Worker Revision Tests");
  console.log("=".repeat(72));

  // ════════════════════════════════════════════════════════════════
  // 1. Static revision（§7）
  // ════════════════════════════════════════════════════════════════
  section("1. Static revision");
  check(`CACHE_NAME = "${NEW_CACHE}"`, new RegExp('const\\s+CACHE_NAME\\s*=\\s*"' + NEW_CACHE + '"\\s*;').test(swSrc));
  check(`current CACHE_NAME 不再是初次 "${OLD_CACHE}"`, !new RegExp('const\\s+CACHE_NAME\\s*=\\s*"' + OLD_CACHE + '"\\s*;').test(swSrc));
  check("sw.js 標示版本／revision 註解", /Service Worker · V21\.8a?|Deployment(?:\s+Cache)?\s+Revision/.test(swSrc));
  const assetsM = swSrc.match(/const\s+ASSETS\s*=\s*\[([\s\S]*?)\]/);
  const assets = assetsM ? assetsM[1] : "";
  ["./", "./index.html", "./app.js", "./data.js", "./style.css", "./manifest.json"].forEach(a =>
    check(`ASSETS 含 "${a}"`, new RegExp('"' + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"').test(assets)));

  // ════════════════════════════════════════════════════════════════
  // 2. Package integrity guard（§8）— 交付 app.js 為含全站修正的最新版
  // ════════════════════════════════════════════════════════════════
  section("2. Package integrity guard（app.js 最新修正版納入 ASSETS）");
  check("./app.js 存在於 ASSETS", /"\.\/app\.js"/.test(assets));
  const dataSrcForPkg = fs.readFileSync(path.join(__dirname, "data.js"), "utf-8");
  check("交付 data.js 住宿為 Sans Souci（不會 precache 舊 Atlanta 版）",
    /Apartment Sans Souci W1 by Interhome/.test(dataSrcForPkg) && !/Atlanta|GRIWA/i.test(dataSrcForPkg));
  check("./data.js 在 ASSETS（升級時會重新 precache）", /"\.\/data\.js"/.test(assets));
  ["safeStorageGet", "normalizeBookingsFilter", "normalizePendingState", "getLuggageReceipt"].forEach(fn =>
    check(`交付 app.js 含 ${fn}（最新修正版，非初次 V21.7d 舊檔）`, new RegExp("function " + fn + "\\b").test(appSrc)));

  // ════════════════════════════════════════════════════════════════
  // 3. Install behavior（§7）
  // ════════════════════════════════════════════════════════════════
  section("3. Install behavior");
  {
    const sw = loadSW({});
    check("已註冊 install handler", typeof sw.handlers.install === "function");
    const ev = makeEvent();
    sw.handlers.install(ev);
    await checkA("install 呼叫 skipWaiting", async () => sw.log.skipWaiting === 1);
    await checkA("install 開啟新 cache（swiss-trip-v21-8c1-v21-4g-maps-expansion-2027）", async () => { await ev._waited; return sw.log.opened.indexOf(NEW_CACHE) !== -1; });
    await checkA("install 呼叫 cache.addAll(ASSETS)（6 項）", async () => { await ev._waited; return sw.log.addAll.length === 1 && sw.log.addAll[0].assets.length === 6; });
    await checkA("addAll 含 ./app.js", async () => { await ev._waited; return sw.log.addAll[0].assets.indexOf("./app.js") !== -1; });
    await checkA("addAll 成功 → install promise resolve", async () => { try { await ev._waited; return true; } catch (e) { return false; } });
  }
  {
    const sw = loadSW({ addAllFail: true });
    const ev = makeEvent();
    sw.handlers.install(ev);
    await checkA("addAll 失敗 → install promise reject（不吞掉 precache error）", async () => {
      try { await ev._waited; return false; } catch (e) { return true; }
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 4. Activate migration（§7）
  // ════════════════════════════════════════════════════════════════
  section("4. Activate migration");
  {
    const PREV_8B = "swiss-trip-v21-8b-v21-4g-corrective-2027";
    const sw = loadSW({ existingKeys: [PREV_FINAL, PREV_8B, OLD_CACHE, "swiss-trip-v21-7c-2027", NEW_CACHE] });
    check("已註冊 activate handler", typeof sw.handlers.activate === "function");
    const ev = makeEvent();
    sw.handlers.activate(ev);
    await ev._waited;
    check("保留新 final cache（未刪除）", sw.log.deleted.indexOf(NEW_CACHE) === -1);
    check("刪除初次 V21.7d 舊 cache（swiss-trip-v21-7d-2027）", sw.log.deleted.indexOf(OLD_CACHE) !== -1);
    check("刪除更舊 cache（swiss-trip-v21-7c-2027）", sw.log.deleted.indexOf("swiss-trip-v21-7c-2027") !== -1);
    check("刪除前一版 cache（swiss-trip-v21-8c1-v21-4g-dark-mode-seal-2027）", sw.log.deleted.indexOf(PREV_FINAL) !== -1);
    check("刪除 V21.8b cache（swiss-trip-v21-8b-v21-4g-corrective-2027）", sw.log.deleted.indexOf(PREV_8B) !== -1);
    check("恰好刪除 4 個舊 cache（8c／8b／初次 7d／7c）", sw.log.deleted.length === 4);
    check("升級後僅保留 V21.8c1 cache", sw.log.deleted.indexOf(NEW_CACHE) === -1);
    check("呼叫 clients.claim()", sw.log.claim === 1);
  }

  // ════════════════════════════════════════════════════════════════
  // 5. Fetch regression（§7）
  // ════════════════════════════════════════════════════════════════
  section("5. Fetch regression（strategy 未回退）");
  const req = (url, o) => Object.assign({ url, method: "GET", mode: "no-cors", destination: "" }, o || {});
  // 5a. 同源 cache hit → 用 cached，不 fetch
  {
    const cachedRes = { status: 200, _cached: true };
    const sw = loadSW({ matchStore: { "https://swiss.example.com/app.js": cachedRes } });
    const ev = makeEvent({ request: req("https://swiss.example.com/app.js") });
    sw.handlers.fetch(ev);
    await checkA("同源 cache hit → 使用 cached response", async () => ev._responded === true && (await ev._response) === cachedRes);
    await checkA("cache hit → 未再 put（無多餘寫入）", async () => { await flush(); return sw.log.put.length === 0; });
  }
  // 5b. 同源 cache miss → fetch → 成功 put 進新 cache
  {
    const sw = loadSW({ matchStore: {} });
    const ev = makeEvent({ request: req("https://swiss.example.com/new.js") });
    sw.handlers.fetch(ev);
    await checkA("同源 cache miss → fetch 並回傳 response", async () => { const r = await ev._response; return ev._responded === true && r && r.status === 200; });
    await checkA("成功 fetch（200 basic）→ put 進新 cache（swiss-trip-v21-8c1-v21-4g-maps-expansion-2027）", async () => { await flush(); return sw.log.put.length === 1 && sw.log.put[0].name === NEW_CACHE; });
  }
  // 5c. 跨域 → 不攔截
  {
    const sw = loadSW({});
    const ev = makeEvent({ request: req("https://maps.google.com/x") });
    sw.handlers.fetch(ev);
    check("跨域請求 → 不攔截（respondWith 未呼叫）", ev._responded === false);
  }
  // 5d. 非 GET → 不攔截
  {
    const sw = loadSW({});
    const ev = makeEvent({ request: req("https://swiss.example.com/app.js", { method: "POST" }) });
    sw.handlers.fetch(ev);
    check("非 GET（POST）→ 不攔截（respondWith 未呼叫）", ev._responded === false);
  }
  // 5e. navigate 離線 → fallback ./index.html
  {
    const indexRes = { status: 200, _index: true };
    const sw = loadSW({ offline: true, matchStore: { "./index.html": indexRes } });
    const ev = makeEvent({ request: req("https://swiss.example.com/some/route", { mode: "navigate", destination: "document" }) });
    sw.handlers.fetch(ev);
    await checkA("navigate 離線 → fallback ./index.html", async () => (await ev._response) === indexRes);
  }
  // 5f. 非 document 離線 → 503
  {
    const sw = loadSW({ offline: true, matchStore: {} });
    const ev = makeEvent({ request: req("https://swiss.example.com/data.js", { mode: "no-cors", destination: "script" }) });
    sw.handlers.fetch(ev);
    await checkA("非 document 離線 → 回傳 503", async () => { const r = await ev._response; return r && r.status === 503; });
  }

  // ════════════════════════════════════════════════════════════════
  // 6. 架構未回退（§4）
  // ════════════════════════════════════════════════════════════════
  section("6. 架構守門（不得回退）");
  check("install 使用 cache.addAll(ASSETS)（all-or-nothing，非逐檔吞錯）", /cache\.addAll\(ASSETS\)/.test(swSrc) && !/for\s*\(|forEach[\s\S]*?addAll|map[\s\S]*?add\(/.test(swSrc));
  check("install 失敗 throw（reject）", /throw\s+err/.test(swSrc));
  check("activate 使用 caches.keys() + caches.delete", /caches\.keys\(\)/.test(swSrc) && /caches\.delete/.test(swSrc));
  check("activate 保留 clients.claim()", /clients\.claim\(\)/.test(swSrc));
  check("fetch 僅處理 GET", /method\s*!==\s*"GET"/.test(swSrc));
  check("fetch 跨域不攔截（origin 檢查）", /url\.origin\s*!==\s*self\.location\.origin/.test(swSrc));
  check("fetch 同源 cache-first（caches.match 先行）", /caches\.match\(event\.request\)/.test(swSrc));
  check("fetch document fallback index.html", /caches\.match\("\.\/index\.html"\)/.test(swSrc));
  check("fetch 非 document 離線 503", /status:\s*503/.test(swSrc));
  check("未改為 network-first / stale-while-revalidate", !/networkFirst|staleWhileRevalidate|stale-while-revalidate|network-first/i.test(swSrc));

  // ── 結果 ──────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(72));
  console.log(fail === 0
    ? `✅ PASSED · ${pass}/${pass + fail}`
    : `❌ FAILED · ${pass}/${pass + fail}（失敗：${failures.join("、")}）`);
  console.log("=".repeat(72));
  process.exit(fail ? 1 : 0);
})();
