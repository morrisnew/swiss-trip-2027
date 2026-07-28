/**
 * V21.7d Post-Deployment Real-Environment Acceptance — self-contained harness.
 *
 * 這是「真實瀏覽器」驗收，不是 mock：以真實 headless Chromium 於 http://127.0.0.1
 *（secure context）載入本 package，執行真正的 Service Worker 生命週期與 Cache Storage。
 *
 * 需求（不會在純 node 環境自動具備）：
 *   - Playwright 已安裝，且有可用的 Chromium 二進位（PLAYWRIGHT_BROWSERS_PATH 或系統 Chrome）。
 *   - 可設定 CHROME_PATH 指向 chromium/chrome 執行檔（否則嘗試 playwright 預設）。
 * 執行：
 *   PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers CHROME_PATH=/path/to/chrome node realbrowser_acceptance.js
 * 選用：OLD_APP_JS=/path/to/initial-V21.7d/app.js  （提供「初次 V21.7d」未修正 app.js，
 *       用於升級前對照；未提供則跳過該對照，其餘升級鏈仍完整驗證）。
 *
 * 涵蓋（真實瀏覽器）：Fresh Install / Existing PWA Upgrade（含 localStorage 保留）/
 *   Functional Smoke / Invalid Storage Recovery / Offline。
 * 不涵蓋（仍為 Not Tested）：真機 iPhone/Android PWA、Vercel production、真實行動網路離線。
 */
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); } catch (e) {
  console.error("需要 Playwright：npm i -D playwright（且需可用的 Chromium 二進位）。");
  process.exit(2);
}

const PKG = __dirname;
const RUNTIME = ["index.html", "app.js", "data.js", "style.css", "manifest.json", "sw.js"];
const FINAL_CACHE = "swiss-trip-v21-7d-final-2027";
const OLD_CACHE = "swiss-trip-v21-7d-2027";

// ── 建立 OLD / NEW 部署 fixtures（不改動 package 本身）──────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rbacc-"));
const NEW = path.join(tmp, "new"), OLD = path.join(tmp, "old");
fs.mkdirSync(NEW); fs.mkdirSync(OLD);
for (const f of RUNTIME) { fs.copyFileSync(path.join(PKG, f), path.join(NEW, f)); }
// OLD：sw.js 還原為初次 cache 名；app.js 用 OLD_APP_JS（若提供）否則沿用 package app.js
for (const f of RUNTIME) {
  if (f === "sw.js") {
    const sw = fs.readFileSync(path.join(PKG, "sw.js"), "utf8").replace(new RegExp(FINAL_CACHE, "g"), OLD_CACHE);
    fs.writeFileSync(path.join(OLD, "sw.js"), sw);
  } else if (f === "app.js" && process.env.OLD_APP_JS && fs.existsSync(process.env.OLD_APP_JS)) {
    fs.copyFileSync(process.env.OLD_APP_JS, path.join(OLD, "app.js"));
  } else {
    fs.copyFileSync(path.join(PKG, f), path.join(OLD, f));
  }
}
const HAVE_OLD_APP = !!(process.env.OLD_APP_JS && fs.existsSync(process.env.OLD_APP_JS));

let ROOT = NEW;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/" || p === "") p = "/index.html";
      const file = path.join(ROOT, p);
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end("404"); return; }
      const h = { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" };
      if (p === "/sw.js") h["Cache-Control"] = "no-cache";
      res.writeHead(200, h); fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

let pass = 0, fail = 0;
const ck = (n, c, e) => { (c ? pass++ : fail++); console.log(`  ${c ? "✅" : "❌"} ${n}${e !== undefined ? "  → " + e : ""}`); };
async function ready(p) { await p.evaluate(async () => { await navigator.serviceWorker.ready; }); }
async function waitActivated(p, t = 40) { for (let i = 0; i < t; i++) { const s = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r && r.active ? r.active.state : null; }); if (s === "activated") return s; await p.waitForTimeout(150); } return await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r && r.active ? r.active.state : null; }); }
async function swState(p) { return await p.evaluate(async () => { const o = { secure: isSecureContext, hasSW: "serviceWorker" in navigator, hasCaches: "caches" in window }; if (o.hasSW) { const r = await navigator.serviceWorker.getRegistration(); o.hasReg = !!r; o.active = r && r.active ? r.active.state : null; o.controller = !!navigator.serviceWorker.controller; } if (o.hasCaches) { o.cacheKeys = await caches.keys(); o.contents = {}; for (const k of o.cacheKeys) { const c = await caches.open(k); o.contents[k] = (await c.keys()).map(x => new URL(x.url).pathname).sort(); } } return o; }); }
async function booted(p) { return await p.evaluate(() => { const e = document.getElementById("appbar"); return !!(e && e.innerHTML.trim().length); }); }
async function ftext(p, u) { return await p.evaluate(async (x) => { try { const r = await fetch(x); return { status: r.status, text: await r.text() }; } catch (e) { return { status: -1, text: String(e) }; } }, u); }
async function pollCaches(p, incl, excl, t = 40) { for (let i = 0; i < t; i++) { const k = await p.evaluate(() => caches.keys()); if (k.includes(incl) && (!excl || !k.includes(excl))) return k; await p.waitForTimeout(150); } return await p.evaluate(() => caches.keys()); }

(async () => {
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const exe = process.env.CHROME_PATH || undefined;
  const browser = await chromium.launch(exe ? { executablePath: exe, headless: true, args: ["--no-sandbox"] } : { headless: true, args: ["--no-sandbox"] });
  console.log("real Chromium:", browser.version(), "| base:", base, "| OLD_APP_JS:", HAVE_OLD_APP ? "provided" : "not provided");
  try {
    // A. Fresh Install
    console.log("\n═══ A · Fresh Install ═══"); ROOT = NEW;
    { const ctx = await browser.newContext(); const errs = []; const page = await ctx.newPage();
      const ASSETS = ["/", "/index.html", "/app.js", "/data.js", "/style.css", "/manifest.json"];
      page.on("pageerror", e => errs.push("pageerror:" + e.message));
      page.on("response", r => { try { const u = new URL(r.url()); if (u.origin === base && r.status() >= 400 && ASSETS.includes(u.pathname)) errs.push("asset " + u.pathname + " " + r.status()); } catch (e) {} });
      await page.goto(base + "/", { waitUntil: "load" }); await ready(page); const active = await waitActivated(page);
      let st = await swState(page);
      ck("A1 首頁載入", await booted(page)); ck("A2 secure context + SW/caches", st.secure && st.hasSW && st.hasCaches);
      ck("A3 SW registered", st.hasReg); ck("A4 active=activated", active === "activated", active);
      ck("A5 final cache 建立", st.cacheKeys.includes(FINAL_CACHE), JSON.stringify(st.cacheKeys));
      ck("A6 6 項資產完整", ASSETS.every(a => (st.contents[FINAL_CACHE] || []).includes(a)));
      ck("A7 無舊 cache", !st.cacheKeys.includes(OLD_CACHE));
      await page.reload({ waitUntil: "load" }); st = await swState(page);
      ck("A8 reload 正常", await booted(page)); ck("A9 受 SW 控制", st.controller);
      ck("A10 無 app 錯誤（外部字型/favicon 不列入）", errs.length === 0, errs.slice(0, 2).join(" | ") || "none");
      await ctx.close(); }

    // B. Existing PWA Upgrade（seeded 舊環境 → final；同 origin/profile）
    console.log("\n═══ B · Existing PWA Upgrade ═══");
    { const ctx = await browser.newContext(); const page = await ctx.newPage();
      ROOT = OLD; await page.goto(base + "/", { waitUntil: "load" }); await ready(page); const oa = await waitActivated(page);
      let st = await swState(page);
      ck("B1 升級前有舊 cache", st.cacheKeys.includes(OLD_CACHE), JSON.stringify(st.cacheKeys));
      if (HAVE_OLD_APP) { const oldApp = await ftext(page, "./app.js"); ck("B2 升級前 app.js 為未修正版（無 safeStorageGet）", oldApp.status === 200 && oldApp.text.indexOf("function safeStorageGet") === -1); }
      else { console.log("  ⏭️  B2 skipped（未提供 OLD_APP_JS）"); }
      ck("B3 升級前受舊 SW 控制", oa === "activated", oa);
      await page.evaluate(() => { localStorage.setItem("swiss_checks", '{"keepme":true}'); localStorage.setItem("planchoice_day8_spb_descent", "A"); localStorage.setItem("bookings_filter", "must"); localStorage.setItem("pending_up", "confirmed"); localStorage.setItem("luggage_receipt_up", 'R#42 <>&"\''); });
      ROOT = NEW; await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
      const ka = await pollCaches(page, FINAL_CACHE, OLD_CACHE);
      await page.reload({ waitUntil: "load" }); await ready(page); st = await swState(page);
      ck("B4 建立 final cache", ka.includes(FINAL_CACHE)); ck("B5 刪除舊 cache", !st.cacheKeys.includes(OLD_CACHE), JSON.stringify(st.cacheKeys));
      ck("B6 保留 final cache", st.cacheKeys.includes(FINAL_CACHE));
      const na = await ftext(page, "./app.js");
      ck("B7 升級後 app.js 為修正版（含 safeStorageGet）", na.status === 200 && na.text.indexOf("function safeStorageGet") !== -1);
      ck("B8 含全站 storage helpers", ["normalizeBookingsFilter", "normalizePendingState", "getLuggageReceipt"].every(f => na.text.indexOf("function " + f) !== -1));
      ck("B9 升級後正常且受新 SW 控制", (await booted(page)) && st.controller);
      const ls = await page.evaluate(() => ({ c: localStorage.getItem("swiss_checks"), p: localStorage.getItem("planchoice_day8_spb_descent"), f: localStorage.getItem("bookings_filter"), pe: localStorage.getItem("pending_up"), l: localStorage.getItem("luggage_receipt_up") }));
      ck("B10 localStorage 全數保留（cache migration ≠ localStorage）", ls.c === '{"keepme":true}' && ls.p === "A" && ls.f === "must" && ls.pe === "confirmed" && ls.l === 'R#42 <>&"\'', JSON.stringify(ls));
      await ctx.close(); }

    // D. Functional Smoke
    console.log("\n═══ D · Functional Smoke ═══"); ROOT = NEW;
    { const ctx = await browser.newContext(); const errs = []; const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto(base + "/", { waitUntil: "load" }); await ready(page); await waitActivated(page); await page.reload({ waitUntil: "load" });
      ck("D1 版本顯示 V21.7d", await page.evaluate(() => document.body.innerText.indexOf("V21.7d") !== -1 || document.getElementById("appbar").innerHTML.indexOf("V21.7d") !== -1));
      const pages = ["home", "days", "bookings", "shopping", "packing", "sights", "hotels", "flights", "pending", "luggage", "emergency"]; let ok = true, bl = [];
      for (const pg of pages) { const r = await page.evaluate((x) => { try { navigate(x); const e = document.getElementById("app"); return e && e.innerHTML.trim().length > 0; } catch (e) { return false; } }, pg); if (!r) { ok = false; bl.push(pg); } }
      ck("D2 指定頁面全部可開", ok, bl.join(",") || "all ok");
      ck("D3 Day 頁可開", await page.evaluate(() => { try { navigate("day", 1); return document.getElementById("app").innerHTML.trim().length > 0; } catch (e) { return false; } }));
      await page.evaluate(() => setPlanChoice("day8_spb", "A")); await page.reload({ waitUntil: "load" }); const a = await page.evaluate(() => getPlanChoice("day8_spb"));
      await page.evaluate(() => setPlanChoice("day8_spb", "B")); await page.reload({ waitUntil: "load" }); const b = await page.evaluate(() => getPlanChoice("day8_spb"));
      ck("D4 Day8 A/B 持久化", a === "A" && b === "B", `a=${a},b=${b}`);
      await page.evaluate(() => toggleCheck("d_ck")); await page.reload({ waitUntil: "load" }); ck("D5 checklist reload 保留", await page.evaluate(() => isChecked("d_ck")));
      await page.evaluate(() => saveBookingsFilter("must")); await page.reload({ waitUntil: "load" }); ck("D6 bookings filter reload 保留", await page.evaluate(() => loadBookingsFilter()) === "must");
      await page.evaluate(() => setPendingState("dP", "confirmed")); await page.reload({ waitUntil: "load" }); ck("D7 pending reload 保留", await page.evaluate(() => getPendingState("dP")) === "confirmed");
      const mid = await page.evaluate(() => (typeof LUGGAGE_MILESTONES !== "undefined" && LUGGAGE_MILESTONES.length) ? LUGGAGE_MILESTONES[0].id : null);
      if (mid) { await page.evaluate((id) => setLuggageReceipt("luggage_receipt_" + id, '<b>R</b> "&\''), mid); await page.reload({ waitUntil: "load" });
        const rec = await page.evaluate((id) => getLuggageReceipt("luggage_receipt_" + id), mid);
        const h = await page.evaluate(() => { try { navigate("luggage"); return document.getElementById("app").innerHTML; } catch (e) { return "ERR"; } });
        ck("D8 luggage 特殊字元 reload 保留 + escape", rec === '<b>R</b> "&\'' && h.indexOf("<b>R</b>") === -1 && h.indexOf("&lt;b&gt;R") !== -1);
      } else { ck("D8 escape fallback", await page.evaluate(() => escapeHTML("<b>") === "&lt;b&gt;")); }
      ck("D9 無 app 錯誤", errs.length === 0, errs.slice(0, 2).join(" | ") || "none");
      await ctx.close(); }

    // E. Invalid Storage Recovery
    console.log("\n═══ E · Invalid Storage Recovery ═══");
    { const ctx = await browser.newContext(); const errs = []; const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto(base + "/", { waitUntil: "load" }); await ready(page); await waitActivated(page);
      await page.evaluate(() => { localStorage.setItem("planchoice_day8_spb_descent", "C"); localStorage.setItem("swiss_checks", "{bad"); localStorage.setItem("bookings_filter", "junk"); localStorage.setItem("pending_iv", "junk"); localStorage.setItem("pending_keep", "done"); });
      await page.reload({ waitUntil: "load" }); const boot = await booted(page);
      const r = await page.evaluate(() => ({ plan: getPlanChoice("day8_spb"), pk: localStorage.getItem("planchoice_day8_spb_descent"), ck: localStorage.getItem("swiss_checks"), f: loadBookingsFilter(), fk: localStorage.getItem("bookings_filter"), pe: getPendingState("iv"), pek: localStorage.getItem("pending_iv"), keep: localStorage.getItem("pending_keep") }));
      ck("E0 注入無效值 reload 不空白", boot);
      ck("E1 plan C → null + 清 key", r.plan === null && r.pk === null);
      ck("E2 malformed swiss_checks → 啟動 + 清理", r.ck === null && boot);
      ck("E3 bookings junk → all + 清 key", r.f === "all" && r.fk === null);
      ck("E4 pending junk → unconfirmed + 只清自己", r.pe === "unconfirmed" && r.pek === null);
      ck("E5 隔離：合法 pending_keep 保留", r.keep === "done");
      ck("E6 無 app 錯誤", errs.length === 0, errs.slice(0, 2).join(" | ") || "none");
      await ctx.close(); }

    // C. Offline（關閉 server 使 loopback 真正中斷）
    console.log("\n═══ C · Offline ═══"); ROOT = NEW;
    { const ctx = await browser.newContext(); const page = await ctx.newPage();
      await page.goto(base + "/", { waitUntil: "load" }); await ready(page); await waitActivated(page); await page.reload({ waitUntil: "load" });
      await new Promise(r => server.close(r)); server._closed = true;
      let rootOk = false; try { await page.goto(base + "/", { waitUntil: "load" }); rootOk = await booted(page); } catch (e) {}
      ck("C1 離線重開 root → app 啟動", rootOk);
      let ns = null; try { const resp = await page.goto(base + "/deep/route", { waitUntil: "commit" }); ns = resp && resp.status(); } catch (e) { ns = "err"; }
      ck("C1b 離線深層 navigate → SW fallback 200", ns === 200, "status=" + ns);
      try { await page.goto(base + "/", { waitUntil: "load" }); } catch (e) {}
      const off = await ftext(page, base + "/app.js"); ck("C2 離線取用已快取 app.js → 200", off.status === 200 && off.text.indexOf("function safeStorageGet") !== -1);
      const miss = await ftext(page, base + "/miss-" + Date.now() + ".js"); ck("C3 離線未快取 → 503", miss.status === 503, "status=" + miss.status);
      await ctx.close(); }
  } catch (e) { console.log("‼️ harness error:", e.message); fail++; }
  finally { await browser.close(); if (!server._closed) server.close(); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} }
  console.log("\n" + "=".repeat(60));
  console.log(fail === 0 ? `✅ REAL-BROWSER ACCEPTANCE PASSED · ${pass}/${pass + fail}` : `❌ ${fail} FAILED · ${pass}/${pass + fail}`);
  console.log("=".repeat(60));
  process.exit(fail ? 1 : 0);
})();
