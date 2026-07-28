/**
 * V21.7d · Final Storage Integrity Seal — Storage Resilience Tests
 * 執行：node scenario_tests_storage_integrity.js
 *
 * 定位（與 scenario_tests_plan_choice_storage.js 互補）：
 *   - plan_choice_storage.js：plan choice normalization 行為總覽
 *   - storage_integrity.js（本檔）：全站 storage resilience，尤其
 *       1) Strict primitive-string plan choice validation（§13）
 *       2) Empty / invalid plan choice cleanup + key isolation（§14）
 *       3) swiss_checks 安全載入 / 清理 / 儲存（§15）
 *       4) toggleCheck / isChecked 對異常 State 的防禦（§16）
 *
 * 全部直接 eval app.js 內實際上線的函式（非複寫），確保測到的是真程式。
 */
const fs = require("fs");
const path = require("path");
const appSrc = fs.readFileSync(path.join(__dirname, "app.js"), "utf-8");
const dataSrc = fs.readFileSync(path.join(__dirname, "data.js"), "utf-8");

// ── 可控 mock localStorage（含 _throwOn 旗標可強制例外）─────────────
function makeMockStorage(initial) {
  const store = Object.assign({}, initial || {});
  const throwOn = { getItem: false, setItem: false, removeItem: false };
  return {
    _store: store,
    _throwOn: throwOn,
    getItem(k) {
      if (throwOn.getItem) throw new Error("SecurityError (mock)");
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem(k, v) {
      if (throwOn.setItem) throw new Error("QuotaExceededError (mock)");
      store[k] = String(v);
    },
    removeItem(k) {
      if (throwOn.removeItem) throw new Error("removeItem failed (mock)");
      delete store[k];
    },
    clear() { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// ── module-scope const / State 代理（app.js 函式以自由變數解析到 global）──
global.SWISS_CHECKS_KEY = "swiss_checks";
global.State = { currentPage: "home", currentDay: null, showBackup: false, checkedItems: {}, weatherCache: null };
let LS = makeMockStorage({});
global.localStorage = LS;
let _mockHM = "00:00";
global._mockHM = () => _mockHM;

// ── 從 app.js 抽出真實函式 ────────────────────────────────────────
const grab = (name) => {
  const m = appSrc.match(new RegExp("function " + name + "\\([\\s\\S]*?\\n}"));
  if (!m) throw new Error("找不到函式：" + name);
  return m[0];
};
eval(grab("resolveValidPlanChoice"));
eval(grab("normalizePlanChoice"));
eval(grab("getPlanChoice"));
eval(grab("setPlanChoice"));
eval(grab("allPlanChoices"));
eval(grab("removeChecksKeySafe"));
eval(grab("loadCheckedItems"));
eval(grab("ensureCheckedItems"));
eval(grab("saveChecks"));
eval(grab("toggleCheck"));
eval(grab("isChecked"));
// timeline / lifecycle（findCurrentAndNext 防禦測試需要）
eval(grab("planRoleTimeKeys"));
eval(grab("parseTimelineTime"));
eval(grab("planActivationStartMin"));
eval(grab("planActivationEndMin"));
eval(grab("planLifecyclePhase"));
eval(grab("findCurrentAndNext").replace("const hm = nowZurichHM();", "const hm = global._mockHM();"));
eval(grab("classifyDayState"));

// ── 真實 Day 8 資料 ───────────────────────────────────────────────
const dctx = {};
new Function("ctx", dataSrc + "ctx.DAYS=DAYS;ctx.DAY_PLAN_CHOICES=DAY_PLAN_CHOICES;")(dctx);
const DAY8_TL = dctx.DAYS[7].tl;
const DAY8DEF = dctx.DAY_PLAN_CHOICES.day8_spb;
const DAY8_KEY = DAY8DEF.storageKey;

// ── 測試框架 ──────────────────────────────────────────────────────
let pass = 0, fail = 0;
const failures = [];
function section(t) { console.log("\n" + "─".repeat(72) + "\n" + t + "\n" + "─".repeat(72)); }
function check(name, cond) {
  if (cond === true) { pass++; console.log("  ✅ " + name); }
  else { fail++; failures.push(name); console.log("  ❌ " + name); }
}
// 「呼叫不得 throw」輔助：回傳 true 表示沒有拋例外
function noThrow(fn) { try { fn(); return true; } catch (e) { return false; } }

console.log("=".repeat(72));
console.log("V21.7d · Final Storage Integrity Seal — Storage Resilience Tests");
console.log("=".repeat(72));

// ══════════════════════════════════════════════════════════════════
// 1. Strict Plan Choice Type Validation（§13）
// ══════════════════════════════════════════════════════════════════
section("1. Strict Plan Choice Type Validation（只接受 primitive string）");
{
  const DEF = { storageKey: "planchoice_day8_spb_descent", options: [{ key: "A" }, { key: "B" }] };

  // primitive string
  check("'A' → 有效", resolveValidPlanChoice(DEF, "A") === "A");
  check("'B' → 有效", resolveValidPlanChoice(DEF, "B") === "B");
  check("'C' → null", resolveValidPlanChoice(DEF, "C") === null);
  check("'' → null", resolveValidPlanChoice(DEF, "") === null);
  check("' ' → null", resolveValidPlanChoice(DEF, " ") === null);
  check("'undefined'（字串）→ null", resolveValidPlanChoice(DEF, "undefined") === null);

  // 非字串一律 null（無 coercion）
  check("['A'] → null（Array 不被 coerce）", resolveValidPlanChoice(DEF, ["A"]) === null);
  check("new String('A') → null（String object 非 primitive）", resolveValidPlanChoice(DEF, new String("A")) === null);
  check("{ toString:()=>'A' } → null", resolveValidPlanChoice(DEF, { toString: () => "A" }) === null);
  check("true → null", resolveValidPlanChoice(DEF, true) === null);
  check("false → null", resolveValidPlanChoice(DEF, false) === null);
  check("1 → null", resolveValidPlanChoice(DEF, 1) === null);
  check("0 → null", resolveValidPlanChoice(DEF, 0) === null);
  check("NaN → null", resolveValidPlanChoice(DEF, NaN) === null);
  check("{} → null", resolveValidPlanChoice(DEF, {}) === null);
  check("[] → null", resolveValidPlanChoice(DEF, []) === null);
  check("function → null", resolveValidPlanChoice(DEF, function () {}) === null);
  check("null → null", resolveValidPlanChoice(DEF, null) === null);
  check("undefined → null", resolveValidPlanChoice(DEF, undefined) === null);
  check("Symbol('A') → null（不 throw）", (() => { try { return resolveValidPlanChoice(DEF, Symbol("A")) === null; } catch (e) { return false; } })());
  check("BigInt 1n → null（不 throw）", (() => { try { return resolveValidPlanChoice(DEF, BigInt(1)) === null; } catch (e) { return false; } })());

  // option.key 本身非 string 不得被誤配
  check("option.key 為 number 時 '1' 不誤判", resolveValidPlanChoice({ options: [{ key: 1 }] }, "1") === null);

  // 確認未使用 String() coercion（結構守門）
  const fnSrc = grab("resolveValidPlanChoice");
  check("resolveValidPlanChoice 原始碼不含 String(value) coercion", !/String\s*\(\s*value\s*\)/.test(fnSrc));
  check("resolveValidPlanChoice 使用 typeof value !== 'string' 嚴格檢查", /typeof\s+value\s*!==\s*["']string["']/.test(fnSrc));

  // setPlanChoice 不得寫入任何非字串／無效值
  global.DAY_PLAN_CHOICES = { day8_spb: DAY8DEF };
  const nonStrings = [["A"], new String("A"), { toString: () => "A" }, true, false, 1, 0, NaN, {}, [], function () {}, null, undefined, ""];
  let allRejected = true;
  nonStrings.forEach(v => {
    LS = makeMockStorage({}); global.localStorage = LS;
    const r = setPlanChoice("day8_spb", v);
    if (r !== false || (DAY8_KEY in LS._store)) allRejected = false;
  });
  check("setPlanChoice 對所有非字串／無效值回傳 false 且不寫入", allRejected);

  // findCurrentAndNext 防禦：Active Window 直接傳入非字串 → plan_unselected（不展開 A）
  global.DAY_PLAN_CHOICES = dctx.DAY_PLAN_CHOICES;
  _mockHM = "13:00"; // Day 8 active window
  const cnArr = findCurrentAndNext(DAY8_TL, { planChoices: { day8_spb: ["A"] } });
  check("findCurrentAndNext({day8_spb:['A']}) @13:00 → plan_unselected", classifyDayState(cnArr) === "plan_unselected");
  const cnStrObj = findCurrentAndNext(DAY8_TL, { planChoices: { day8_spb: new String("A") } });
  check("findCurrentAndNext({day8_spb:new String('A')}) @13:00 → plan_unselected", classifyDayState(cnStrObj) === "plan_unselected");
  // 對照：真正字串 "A" 仍正常展開（未回退）
  const cnValidA = findCurrentAndNext(DAY8_TL, { planChoices: { day8_spb: "A" } });
  check("對照：findCurrentAndNext({day8_spb:'A'}) @13:00 → in_range（有效 A 未回退）", classifyDayState(cnValidA) === "in_range");
}

// ══════════════════════════════════════════════════════════════════
// 2. Empty / Invalid Plan Choice Cleanup + Key Isolation（§14）
// ══════════════════════════════════════════════════════════════════
section("2. Empty / Invalid Plan Choice Cleanup + Key Isolation");
{
  global.DAY_PLAN_CHOICES = { day8_spb: DAY8DEF };

  // key 不存在 → null，且不需要（也未）remove
  LS = makeMockStorage({}); global.localStorage = LS;
  check("key 不存在 → null", getPlanChoice("day8_spb") === null);

  // "" → null 且 key 被 remove
  LS = makeMockStorage({ [DAY8_KEY]: "" }); global.localStorage = LS;
  check("'' → null", getPlanChoice("day8_spb") === null);
  check("'' → key 已被 remove", !(DAY8_KEY in LS._store));

  // " " → null 且 key 被 remove
  LS = makeMockStorage({ [DAY8_KEY]: " " }); global.localStorage = LS;
  check("' ' → null", getPlanChoice("day8_spb") === null);
  check("' ' → key 已被 remove", !(DAY8_KEY in LS._store));

  // "C" → null 且 key 被 remove
  LS = makeMockStorage({ [DAY8_KEY]: "C" }); global.localStorage = LS;
  check("'C' → null", getPlanChoice("day8_spb") === null);
  check("'C' → key 已被 remove", !(DAY8_KEY in LS._store));

  // "A"/"B" → 有效且不得 remove
  LS = makeMockStorage({ [DAY8_KEY]: "A" }); global.localStorage = LS;
  check("'A' → 'A'", getPlanChoice("day8_spb") === "A");
  check("'A' → key 未被 remove", DAY8_KEY in LS._store);
  LS = makeMockStorage({ [DAY8_KEY]: "B" }); global.localStorage = LS;
  check("'B' → 'B'", getPlanChoice("day8_spb") === "B");
  check("'B' → key 未被 remove", DAY8_KEY in LS._store);

  // removeItem throw → 安全 null（不 throw）
  LS = makeMockStorage({ [DAY8_KEY]: "C" }); global.localStorage = LS; LS._throwOn.removeItem = true;
  let safeNull = false;
  check("removeItem throw 時仍不拋例外", noThrow(() => { safeNull = getPlanChoice("day8_spb") === null; }));
  check("removeItem throw → 仍回傳 null", safeNull);

  // Key isolation：清除 Day 8 無效 plan choice 時，其他 key 全部保留
  LS = makeMockStorage({
    [DAY8_KEY]: "C",
    "swiss_checks": '{"packed":true}',
    "planchoice_other_plan": "X",
    "pending_something": "in_progress",
    "arbitrary_key": "keep_me"
  });
  global.localStorage = LS;
  getPlanChoice("day8_spb");
  check("isolation：day8 無效值已被清除", !(DAY8_KEY in LS._store));
  check("isolation：swiss_checks 保留", LS._store["swiss_checks"] === '{"packed":true}');
  check("isolation：其他 plan choice 保留", LS._store["planchoice_other_plan"] === "X");
  check("isolation：PENDING workflow state 保留", LS._store["pending_something"] === "in_progress");
  check("isolation：任意其他 key 保留", LS._store["arbitrary_key"] === "keep_me");
  check("isolation：未觸發整站清除（key 數量僅少 1）", Object.keys(LS._store).length === 4);
}

// ══════════════════════════════════════════════════════════════════
// 3. Checklist Storage（swiss_checks）安全載入 / 清理 / 儲存（§15）
// ══════════════════════════════════════════════════════════════════
section("3. Checklist Storage — loadCheckedItems / saveChecks");
{
  const load = (rawObj) => { LS = makeMockStorage(rawObj); global.localStorage = LS; return loadCheckedItems(); };
  const keys = (o) => Object.keys(o);

  // 正常資料
  let o = load({ swiss_checks: '{"a":true,"b":false}' });
  check("正常 {a:true,b:false} → {a:true,b:false}", o.a === true && o.b === false && keys(o).length === 2);

  // Missing
  o = load({});
  check("key 不存在 → {}", keys(o).length === 0);

  // Empty string（文件約定：視為損壞 → 清除 + {}）
  o = load({ swiss_checks: "" });
  check("'' → {}", keys(o).length === 0);
  check("'' → swiss_checks 已清除", !("swiss_checks" in LS._store));

  // Malformed JSON
  o = load({ swiss_checks: "{bad" });
  check("'{bad' → {}", keys(o).length === 0);
  check("'{bad' → 不拋例外且只移除 swiss_checks", !("swiss_checks" in LS._store));

  // JSON null
  o = load({ swiss_checks: "null" });
  check("'null' → {}", keys(o).length === 0);
  check("'null' → swiss_checks 已清除", !("swiss_checks" in LS._store));

  // Array
  o = load({ swiss_checks: "[]" });
  check("'[]' → {}", keys(o).length === 0);
  check("'[]' → swiss_checks 已清除", !("swiss_checks" in LS._store));
  o = load({ swiss_checks: '["a","b"]' });
  check("'[\"a\",\"b\"]' → {} 且清除", keys(o).length === 0 && !("swiss_checks" in LS._store));

  // Primitive
  o = load({ swiss_checks: "true" });
  check("'true' → {} 且清除", keys(o).length === 0 && !("swiss_checks" in LS._store));
  o = load({ swiss_checks: "123" });
  check("'123' → {} 且清除", keys(o).length === 0 && !("swiss_checks" in LS._store));
  o = load({ swiss_checks: '"text"' });
  check("'\"text\"' → {} 且清除", keys(o).length === 0 && !("swiss_checks" in LS._store));

  // Mixed object（策略 A：只保留合法 boolean）
  o = load({ swiss_checks: '{"validTrue":true,"validFalse":false,"badString":"true","badNumber":1,"badNull":null,"badObject":{}}' });
  check("mixed → 只保留 validTrue/validFalse", o.validTrue === true && o.validFalse === false && keys(o).length === 2);
  check("mixed → badString 被丟棄", !("badString" in o));
  check("mixed → badNumber 被丟棄", !("badNumber" in o));
  check("mixed → badNull 被丟棄", !("badNull" in o));
  check("mixed → badObject 被丟棄", !("badObject" in o));
  check("mixed → 有效 swiss_checks 不需清除（仍在）", "swiss_checks" in LS._store);

  // getItem exception → {}（不拋）
  LS = makeMockStorage({ swiss_checks: '{"a":true}' }); global.localStorage = LS; LS._throwOn.getItem = true;
  let getSafe = false;
  check("getItem throw 時不拋例外", noThrow(() => { getSafe = Object.keys(loadCheckedItems()).length === 0; }));
  check("getItem throw → {}", getSafe);

  // removeItem exception（清理損壞資料時）→ {}（不拋）
  LS = makeMockStorage({ swiss_checks: "{bad" }); global.localStorage = LS; LS._throwOn.removeItem = true;
  let rmSafe = false;
  check("removeItem throw 時不拋例外", noThrow(() => { rmSafe = Object.keys(loadCheckedItems()).length === 0; }));
  check("removeItem throw → 仍回傳 {}", rmSafe);

  // saveChecks 正常 → true
  LS = makeMockStorage({}); global.localStorage = LS;
  global.State.checkedItems = { a: true, b: false };
  check("saveChecks 正常 → true", saveChecks() === true);
  check("saveChecks 正常 → 已寫入 swiss_checks", LS._store["swiss_checks"] === '{"a":true,"b":false}');

  // saveChecks setItem exception → false（不拋）
  LS = makeMockStorage({}); global.localStorage = LS; LS._throwOn.setItem = true;
  let saveSafe = false;
  check("saveChecks setItem throw 時不拋例外", noThrow(() => { saveSafe = saveChecks() === false; }));
  check("saveChecks setItem throw → false", saveSafe);

  // saveChecks JSON.stringify exception（cyclic object）→ false（不拋）
  LS = makeMockStorage({}); global.localStorage = LS;
  const cyclic = {}; cyclic.self = cyclic;
  global.State.checkedItems = cyclic;
  let stringifySafe = false;
  check("saveChecks stringify(cyclic) 時不拋例外", noThrow(() => { stringifySafe = saveChecks() === false; }));
  check("saveChecks stringify 例外 → false", stringifySafe);
  global.State.checkedItems = {}; // 還原
}

// ══════════════════════════════════════════════════════════════════
// 4. Checklist Operations — toggleCheck / isChecked（§16）
// ══════════════════════════════════════════════════════════════════
section("4. Checklist Operations — toggleCheck / isChecked");
{
  LS = makeMockStorage({}); global.localStorage = LS;

  // toggleCheck 正常：{} → 第一次 true → 第二次 false
  global.State.checkedItems = {};
  toggleCheck("item1");
  check("toggleCheck 第一次 → true", global.State.checkedItems["item1"] === true);
  toggleCheck("item1");
  check("toggleCheck 第二次 → false", global.State.checkedItems["item1"] === false);

  // Corrupted in-memory State：null → toggle 不 throw、恢復 object、key 變 true
  global.State.checkedItems = null;
  check("State.checkedItems=null 時 toggle 不拋例外", noThrow(() => toggleCheck("k")));
  check("null → 已恢復為 object", global.State.checkedItems !== null && typeof global.State.checkedItems === "object" && !Array.isArray(global.State.checkedItems));
  check("null → key 正常變 true", global.State.checkedItems["k"] === true);

  // Array
  global.State.checkedItems = [];
  check("State.checkedItems=[] 時 toggle 不拋例外", noThrow(() => toggleCheck("k")));
  check("[] → 已恢復為非 Array object", !Array.isArray(global.State.checkedItems) && typeof global.State.checkedItems === "object");
  check("[] → key 正常變 true", global.State.checkedItems["k"] === true);

  // primitive string
  global.State.checkedItems = "bad";
  check("State.checkedItems='bad' 時 toggle 不拋例外", noThrow(() => toggleCheck("k")));
  check("'bad' → key 正常變 true", global.State.checkedItems["k"] === true);

  // primitive number
  global.State.checkedItems = 123;
  check("State.checkedItems=123 時 toggle 不拋例外", noThrow(() => toggleCheck("k")));
  check("123 → key 正常變 true", global.State.checkedItems["k"] === true);

  // isChecked 異常 State → false（不 throw）
  global.State.checkedItems = null;
  check("isChecked(null State) 不拋例外", noThrow(() => isChecked("k")));
  check("isChecked(null State) → false", isChecked("k") === false);
  global.State.checkedItems = [];
  check("isChecked([] State) → false", isChecked("k") === false);
  global.State.checkedItems = "bad";
  check("isChecked('bad' State) → false", isChecked("k") === false);
  global.State.checkedItems = 123;
  check("isChecked(123 State) → false", isChecked("k") === false);

  // isChecked 正常 true / false
  global.State.checkedItems = { on: true, off: false };
  check("isChecked 正常 true → true", isChecked("on") === true);
  check("isChecked 正常 false → false", isChecked("off") === false);
  check("isChecked 未知 key → false", isChecked("never") === false);
}

// ══════════════════════════════════════════════════════════════════
// 5. 全域禁令守門
// ══════════════════════════════════════════════════════════════════
section("5. 全域禁令守門");
{
  const stripped = appSrc.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  check("app.js 全站無 localStorage.clear()", !/localStorage\.clear\s*\(/.test(stripped));
  check("既有 storageKey planchoice_day8_spb_descent 未變更", dataSrc.includes('"planchoice_day8_spb_descent"'));
  check("swiss_checks storage key 仍使用（未改名）", appSrc.includes('"swiss_checks"'));
  check("State 初始化改用 loadCheckedItems（非未保護 JSON.parse）", /checkedItems:\s*loadCheckedItems\(\)/.test(appSrc));
  check("app.js 有 loadCheckedItems", /function loadCheckedItems/.test(appSrc));
  check("app.js 有 saveChecks try/catch（回傳 false 保底）", /function saveChecks\([\s\S]*?catch[\s\S]*?return false/.test(appSrc));
}

// ── 結果 ──────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(72));
console.log(fail === 0
  ? `✅ PASSED · ${pass}/${pass + fail}`
  : `❌ FAILED · ${pass}/${pass + fail}（失敗：${failures.join("、")}）`);
console.log("=".repeat(72));
process.exit(fail ? 1 : 0);
