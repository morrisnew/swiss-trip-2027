/**
 * V21.7d · In-Place Final Seal Correction — Full-Site Storage Consumer Tests
 * 執行：node scenario_tests_storage_consumers.js
 *
 * 定位（§12）：驗證正式頁面與事件使用的**全部** storage consumer，而不只 helper 本身。
 *   - 共用 Safe Storage Layer：safeStorageGet / safeStorageSet / safeStorageRemove
 *   - Bookings filter：normalizeBookingsFilter / loadBookingsFilter / saveBookingsFilter（enum）
 *   - Pending state：normalizePendingState / getPendingState / setPendingState（enum）
 *   - Luggage receipt：getLuggageReceipt / setLuggageReceipt（自由文字）
 *   - 全站 getItem/setItem/removeItem exception sweep + key isolation
 *   - （若 jsdom 可用）直接執行正式 renderBookings/renderPending/renderLuggage
 *
 * 全部直接抽取／執行正式 app.js 的實際函式，不複寫假 implementation（§12）。
 */
const fs = require("fs");
const path = require("path");
const appSrc = fs.readFileSync(path.join(__dirname, "app.js"), "utf-8");

// ── 可控 mock localStorage ────────────────────────────────────────
function makeMockStorage(initial) {
  const store = Object.assign({}, initial || {});
  const throwOn = { getItem: false, setItem: false, removeItem: false };
  return {
    _store: store, _throwOn: throwOn,
    getItem(k) { if (throwOn.getItem) throw new Error("SecurityError (mock)"); return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { if (throwOn.setItem) throw new Error("QuotaExceededError (mock)"); store[k] = String(v); },
    removeItem(k) { if (throwOn.removeItem) throw new Error("removeItem failed (mock)"); delete store[k]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// ── 從 app.js 抽出真實常數與函式 ──────────────────────────────────
const grabFn = (name) => {
  const m = appSrc.match(new RegExp("function " + name + "\\([\\s\\S]*?\\n}"));
  if (!m) throw new Error("找不到函式：" + name);
  return m[0];
};
const grabConst = (name) => {
  const m = appSrc.match(new RegExp("const " + name + "\\s*=\\s*([^;]+);"));
  if (!m) throw new Error("找不到常數：" + name);
  return m[1];
};
// 常數（掛到 global，供 eval 的函式以自由變數解析）
global.BOOKINGS_FILTER_KEY = eval(grabConst("BOOKINGS_FILTER_KEY"));
global.BOOKINGS_FILTERS = eval(grabConst("BOOKINGS_FILTERS"));
global.PENDING_STATES = eval(grabConst("PENDING_STATES"));
let LS = makeMockStorage({});
global.localStorage = LS;
// 函式
eval(grabFn("safeStorageGet"));
eval(grabFn("safeStorageSet"));
eval(grabFn("safeStorageRemove"));
eval(grabFn("normalizeBookingsFilter"));
eval(grabFn("loadBookingsFilter"));
eval(grabFn("saveBookingsFilter"));
eval(grabFn("normalizePendingState"));
eval(grabFn("pendingKey"));
eval(grabFn("getPendingState"));
eval(grabFn("setPendingState"));
eval(grabFn("luggageReceiptKey"));
eval(grabFn("getLuggageReceipt"));
eval(grabFn("setLuggageReceipt"));

// ── 測試框架 ──────────────────────────────────────────────────────
let pass = 0, fail = 0, skip = 0;
const failures = [];
function section(t) { console.log("\n" + "─".repeat(72) + "\n" + t + "\n" + "─".repeat(72)); }
function check(name, cond) {
  if (cond === true) { pass++; console.log("  ✅ " + name); }
  else { fail++; failures.push(name); console.log("  ❌ " + name); }
}
function noThrow(fn) { try { fn(); return true; } catch (e) { return false; } }
const setLS = (obj) => { LS = makeMockStorage(obj); global.localStorage = LS; return LS; };

console.log("=".repeat(72));
console.log("V21.7d · Full-Site Storage Consumer Tests");
console.log("=".repeat(72));

// ══════════════════════════════════════════════════════════════════
// 0. 合法集合以正式 app.js 為準（documents drift guard）
// ══════════════════════════════════════════════════════════════════
section("0. 合法集合（取自正式 app.js）");
check("BOOKINGS_FILTERS = [all, open, must, important, suggest, track]",
  JSON.stringify(global.BOOKINGS_FILTERS) === JSON.stringify(["all", "open", "must", "important", "suggest", "track"]));
check("PENDING_STATES = [unconfirmed, confirmed, done]",
  JSON.stringify(global.PENDING_STATES) === JSON.stringify(["unconfirmed", "confirmed", "done"]));
check("BOOKINGS_FILTER_KEY = 'bookings_filter'", global.BOOKINGS_FILTER_KEY === "bookings_filter");

// ══════════════════════════════════════════════════════════════════
// 1. Safe Storage Layer（§5）
// ══════════════════════════════════════════════════════════════════
section("1. Safe Storage Layer — safeStorageGet / Set / Remove");
{
  setLS({ k: "v" });
  check("get 既有值 → 回傳值", safeStorageGet("k", "fb") === "v");
  check("get missing → fallback", safeStorageGet("nope", "fb") === "fb");
  check("get missing 無 fallback → null", safeStorageGet("nope") === null);
  LS._throwOn.getItem = true;
  check("get 例外不 throw", noThrow(() => safeStorageGet("k", "fb")));
  check("get 例外 → fallback", safeStorageGet("k", "fb") === "fb");

  setLS({});
  check("set ok → true", safeStorageSet("k", "v") === true);
  check("set ok → 已寫入（字串化）", LS._store["k"] === "v");
  check("set 數字 → 字串化寫入", (safeStorageSet("n", 123), LS._store["n"] === "123"));
  LS._throwOn.setItem = true;
  check("set 例外不 throw", noThrow(() => safeStorageSet("k", "v")));
  check("set 例外 → false", safeStorageSet("k", "v") === false);

  setLS({ k: "v" });
  check("remove ok → true", safeStorageRemove("k") === true);
  check("remove ok → 已移除", !("k" in LS._store));
  LS._throwOn.removeItem = true;
  check("remove 例外不 throw", noThrow(() => safeStorageRemove("x")));
  check("remove 例外 → false", safeStorageRemove("x") === false);

  // 全站無 clear
  const stripped = appSrc.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  check("app.js 全站無 localStorage.clear()", !/localStorage\.clear\s*\(/.test(stripped));
}

// ══════════════════════════════════════════════════════════════════
// 2. Bookings filter（§7 / §13 / §17）
// ══════════════════════════════════════════════════════════════════
section("2. Bookings filter — normalize / load / save（enum）");
{
  // normalize
  ["all", "open", "must", "important", "suggest", "track"].forEach(f =>
    check(`normalize('${f}') → '${f}'`, normalizeBookingsFilter(f) === f));
  check("normalize('junk') → null", normalizeBookingsFilter("junk") === null);
  check("normalize('') → null", normalizeBookingsFilter("") === null);
  check("normalize('ALL') → null（大小寫敏感）", normalizeBookingsFilter("ALL") === null);
  check("normalize(['all']) → null（非字串）", normalizeBookingsFilter(["all"]) === null);
  check("normalize(null) → null", normalizeBookingsFilter(null) === null);

  // load
  setLS({});
  check("load missing → 'all'", loadBookingsFilter() === "all");
  setLS({ bookings_filter: "open" });
  check("load 'open' → 'open'", loadBookingsFilter() === "open");
  setLS({ bookings_filter: "junk", swiss_checks: '{"x":true}', planchoice_day8_spb_descent: "A", pending_p1: "done", luggage_receipt_x: "R1" });
  check("load 無效 'junk' → 'all'", loadBookingsFilter() === "all");
  check("load 無效 → 只移除 bookings_filter", !("bookings_filter" in LS._store));
  check("load 無效清理 → swiss_checks 保留", LS._store["swiss_checks"] === '{"x":true}');
  check("load 無效清理 → plan choice 保留", LS._store["planchoice_day8_spb_descent"] === "A");
  check("load 無效清理 → pending 保留", LS._store["pending_p1"] === "done");
  check("load 無效清理 → luggage 保留", LS._store["luggage_receipt_x"] === "R1");
  setLS({ bookings_filter: "" });
  check("load '' → 'all' 且清除", loadBookingsFilter() === "all" && !("bookings_filter" in LS._store));
  setLS({ bookings_filter: "must" }); LS._throwOn.getItem = true;
  check("load getItem 例外 → 'all' 不 throw", (() => { try { return loadBookingsFilter() === "all"; } catch (e) { return false; } })());

  // save
  setLS({});
  check("save('open') → true 且寫入", saveBookingsFilter("open") === true && LS._store["bookings_filter"] === "open");
  check("save('junk') → false 且不寫入", (setLS({}), saveBookingsFilter("junk") === false && !("bookings_filter" in LS._store)));
  check("save('') → false", saveBookingsFilter("") === false);
  setLS({}); LS._throwOn.setItem = true;
  check("save setItem 例外 → false 不 throw", (() => { try { return saveBookingsFilter("all") === false; } catch (e) { return false; } })());
}

// ══════════════════════════════════════════════════════════════════
// 3. Pending state（§8 / §14 / §17）
// ══════════════════════════════════════════════════════════════════
section("3. Pending state — normalize / get / set（enum）");
{
  ["unconfirmed", "confirmed", "done"].forEach(s =>
    check(`normalize('${s}') → '${s}'`, normalizePendingState(s) === s));
  check("normalize('junk') → null", normalizePendingState("junk") === null);
  check("normalize('') → null", normalizePendingState("") === null);
  check("normalize('confirmed ') → null（不 trim）", normalizePendingState("confirmed ") === null);
  check("normalize(1) → null（非字串）", normalizePendingState(1) === null);

  // key naming
  check("pendingKey('p1') === 'pending_p1'", pendingKey("p1") === "pending_p1");

  // get
  setLS({});
  check("get missing → 'unconfirmed'", getPendingState("p1") === "unconfirmed");
  setLS({ pending_p1: "confirmed" });
  check("get 'confirmed' → 'confirmed'", getPendingState("p1") === "confirmed");
  setLS({ pending_p1: "junk", pending_p2: "done", swiss_checks: '{"x":true}', bookings_filter: "open" });
  check("get 無效 'junk' → 'unconfirmed'", getPendingState("p1") === "unconfirmed");
  check("get 無效 → 只移除該 pending_p1", !("pending_p1" in LS._store));
  check("get 無效清理 → 其他 pending_p2 保留", LS._store["pending_p2"] === "done");
  check("get 無效清理 → swiss_checks 保留", LS._store["swiss_checks"] === '{"x":true}');
  check("get 無效清理 → bookings_filter 保留", LS._store["bookings_filter"] === "open");
  setLS({ pending_p1: "" });
  check("get '' → 'unconfirmed' 且清除", getPendingState("p1") === "unconfirmed" && !("pending_p1" in LS._store));
  setLS({ pending_p1: "done" }); LS._throwOn.getItem = true;
  check("get getItem 例外 → 'unconfirmed' 不 throw", (() => { try { return getPendingState("p1") === "unconfirmed"; } catch (e) { return false; } })());

  // set
  setLS({});
  check("set('p1','confirmed') → true 且寫入 pending_p1", setPendingState("p1", "confirmed") === true && LS._store["pending_p1"] === "confirmed");
  check("set('p1','junk') → false 且不寫入", (setLS({}), setPendingState("p1", "junk") === false && !("pending_p1" in LS._store)));
  check("set('p1','') → false", setPendingState("p1", "") === false);
  setLS({}); LS._throwOn.setItem = true;
  check("set setItem 例外 → false 不 throw", (() => { try { return setPendingState("p1", "done") === false; } catch (e) { return false; } })());
}

// ══════════════════════════════════════════════════════════════════
// 4. Luggage receipt（§9 / §15）
// ══════════════════════════════════════════════════════════════════
section("4. Luggage receipt — get / set（自由文字）");
{
  check("luggageReceiptKey('m1') === 'luggage_receipt_m1'", luggageReceiptKey("m1") === "luggage_receipt_m1");
  setLS({});
  check("get missing → ''", getLuggageReceipt("luggage_receipt_m1") === "");
  setLS({ luggage_receipt_m1: "ABC-123" });
  check("get 既有 → 原值", getLuggageReceipt("luggage_receipt_m1") === "ABC-123");
  setLS({ luggage_receipt_m1: "X" }); LS._throwOn.getItem = true;
  check("get getItem 例外 → '' 不 throw", (() => { try { return getLuggageReceipt("luggage_receipt_m1") === ""; } catch (e) { return false; } })());

  setLS({});
  check("set 自由文字 → true 且寫入", setLuggageReceipt("luggage_receipt_m1", "R#42 <>&\"'") === true && LS._store["luggage_receipt_m1"] === "R#42 <>&\"'");
  check("set null → '' 寫入（不 throw）", (setLS({}), setLuggageReceipt("luggage_receipt_m1", null) === true && LS._store["luggage_receipt_m1"] === ""));
  setLS({ other: "keep" }); LS._throwOn.setItem = true;
  check("set setItem 例外 → false 不 throw", (() => { try { return setLuggageReceipt("luggage_receipt_m1", "X") === false; } catch (e) { return false; } })());
  check("set 失敗 → 不影響其他 key", LS._store["other"] === "keep");
}

// ══════════════════════════════════════════════════════════════════
// 5. 全站 exception sweep（§16）— getItem / setItem / removeItem throw
// ══════════════════════════════════════════════════════════════════
section("5. Exception Sweep（getItem / setItem / removeItem throw 皆不拋）");
{
  // getItem throw
  setLS({}); LS._throwOn.getItem = true;
  check("getItem throw · loadBookingsFilter 不拋", noThrow(() => loadBookingsFilter()));
  check("getItem throw · getPendingState 不拋", noThrow(() => getPendingState("p1")));
  check("getItem throw · getLuggageReceipt 不拋", noThrow(() => getLuggageReceipt("luggage_receipt_m1")));
  // setItem throw
  setLS({}); LS._throwOn.setItem = true;
  check("setItem throw · saveBookingsFilter 不拋", noThrow(() => saveBookingsFilter("all")));
  check("setItem throw · setPendingState 不拋", noThrow(() => setPendingState("p1", "done")));
  check("setItem throw · setLuggageReceipt 不拋", noThrow(() => setLuggageReceipt("luggage_receipt_m1", "X")));
  // removeItem throw（清理無效值時）
  setLS({ bookings_filter: "junk", pending_p1: "junk" }); LS._throwOn.removeItem = true;
  check("removeItem throw · loadBookingsFilter 不拋（仍回 all）", (() => { try { return loadBookingsFilter() === "all"; } catch (e) { return false; } })());
  check("removeItem throw · getPendingState 不拋（仍回 unconfirmed）", (() => { try { return getPendingState("p1") === "unconfirmed"; } catch (e) { return false; } })());
}

// ══════════════════════════════════════════════════════════════════
// 6. Key Isolation（§18）
// ══════════════════════════════════════════════════════════════════
section("6. Key Isolation（錯誤只影響自己的 key）");
{
  // 無效 bookings_filter 只移除 bookings_filter
  setLS({ bookings_filter: "junk", swiss_checks: "{}", planchoice_day8_spb_descent: "A", pending_p1: "done", luggage_receipt_m1: "R" });
  loadBookingsFilter();
  check("無效 bookings_filter → 僅 bookings_filter 被移除", !("bookings_filter" in LS._store) &&
    LS._store["swiss_checks"] === "{}" && LS._store["planchoice_day8_spb_descent"] === "A" &&
    LS._store["pending_p1"] === "done" && LS._store["luggage_receipt_m1"] === "R");
  check("無效 bookings_filter → key 數量僅少 1", Object.keys(LS._store).length === 4);

  // 無效 pending_p1 只移除 pending_p1
  setLS({ pending_p1: "junk", pending_p2: "confirmed", swiss_checks: "{}", bookings_filter: "all", luggage_receipt_m1: "R" });
  getPendingState("p1");
  check("無效 pending_p1 → 僅 pending_p1 被移除", !("pending_p1" in LS._store) &&
    LS._store["pending_p2"] === "confirmed" && LS._store["swiss_checks"] === "{}" &&
    LS._store["bookings_filter"] === "all" && LS._store["luggage_receipt_m1"] === "R");

  // luggage write failure 不移除任何 key
  setLS({ a: "1", b: "2" }); LS._throwOn.setItem = true;
  setLuggageReceipt("luggage_receipt_m1", "X");
  check("luggage 寫入失敗 → 不移除任何其他 key", LS._store["a"] === "1" && LS._store["b"] === "2" && Object.keys(LS._store).length === 2);
}

// ══════════════════════════════════════════════════════════════════
// 7. 直接執行正式 render function（§13-15 / §20）— 需 jsdom；不可用則 SKIP
// ══════════════════════════════════════════════════════════════════
section("7. Direct render-function sweep（jsdom · 正式 renderBookings/Pending/Luggage）");
{
  let JSDOM = null;
  try { JSDOM = require("jsdom").JSDOM; } catch (e) { JSDOM = null; }
  if (!JSDOM) {
    skip += 6;
    console.log("  ⏭️  SKIPPED（本環境無 jsdom）— 由 QA_REPORT §F Direct Render Sweep（jsdom）另行覆蓋，不計入 pass/fail");
  } else {
    const dataJs = fs.readFileSync(path.join(__dirname, "data.js"), "utf-8");
    const { VirtualConsole } = require("jsdom");
    const boot = () => {
      const vc = new VirtualConsole();
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
<header id="appbar"></header><main id="app"></main><nav id="nav"></nav>
<script>${dataJs}</script><script>${appSrc}</script></body></html>`;
      const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", url: "https://example.com/", virtualConsole: vc });
      return dom.window;
    };
    const w = boot();
    // getItem 於 init 後拋 SecurityError
    w.Storage.prototype.getItem = function () { throw new w.DOMException("blocked", "SecurityError"); };
    const callSafe = (fn) => { try { const h = w[fn](); return typeof h === "string" && h.length > 0; } catch (e) { return false; } };
    check("renderBookings() getItem→SecurityError 不 throw 且回傳 HTML", callSafe("renderBookings"));
    check("renderPending() getItem→SecurityError 不 throw 且回傳 HTML", callSafe("renderPending"));
    check("renderLuggage() getItem→SecurityError 不 throw 且回傳 HTML", callSafe("renderLuggage"));
    // 有效 escaping regression：receipt 含特殊字元仍被 escape
    const w2 = boot();
    const mid = w2.eval("(typeof LUGGAGE_MILESTONES !== 'undefined' && LUGGAGE_MILESTONES.length) ? LUGGAGE_MILESTONES[0].id : null");
    if (mid !== null) {
      w2.localStorage.setItem("luggage_receipt_" + mid, '<img src=x onerror=1> "&\'');
      let lug = ""; try { lug = w2.renderLuggage(); } catch (e) { lug = "THREW"; }
      check("renderLuggage 特殊字元 → HTML escaping 無 regression（原始 <img 被 escape）",
        lug !== "THREW" && lug.indexOf("<img src=x") === -1 && lug.indexOf("&lt;img") !== -1);
    } else {
      check("escapeHTML('<img>') → '&lt;img&gt;'（escaping 無 regression）", w2.eval("escapeHTML('<img>')") === "&lt;img&gt;");
    }
    // write-handler（helper 層）於 setItem throw 不拋
    w2.Storage.prototype.setItem = function () { throw new w2.DOMException("q", "SecurityError"); };
    check("saveBookingsFilter setItem→throw 不拋（正式函式）", (() => { try { return w2.saveBookingsFilter("open") === false; } catch (e) { return false; } })());
    check("setPendingState setItem→throw 不拋（正式函式）", (() => { try { return w2.setPendingState("x", "done") === false; } catch (e) { return false; } })());
    w.close(); w2.close();
  }
}

// ── 結果 ──────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(72));
console.log(fail === 0
  ? `✅ PASSED · ${pass}/${pass + fail}` + (skip ? `（另 SKIP ${skip}：jsdom render sweep）` : "")
  : `❌ FAILED · ${pass}/${pass + fail}（失敗：${failures.join("、")}）`);
console.log("=".repeat(72));
process.exit(fail ? 1 : 0);
