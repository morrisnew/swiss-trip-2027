/**
 * V21.7d · Plan Choice Storage Validation Tests（current version；歷史 scope：V21.7c Storage Validation Hotfix）
 * 執行：node scenario_tests_plan_choice_storage.js
 *
 * 對象：V21.7b → V21.7c「Storage Validation Hotfix」
 *   舊 bug：localStorage 殘留的無效／過期 option key（例如 "C"、"legacy"）被
 *           `if (planChoices[refKey])` 當成「已選」，隨後 options.find 找不到 →
 *           plan block 被靜默排除 → 當日方案內容消失、狀態誤判為 gap。
 *
 * 本檔【直接使用真實 data.js 的 DAYS[7] 與 DAY_PLAN_CHOICES.day8_spb】，
 * 並自帶一個虛構 generic plan（family / hike），證明修正非 A／B／day8 專屬。
 *
 * 涵蓋：
 *   1. resolveValidPlanChoice / normalizePlanChoice（generic 驗證器）
 *   2. getPlanChoice()（讀取驗證＋無效值清理＋getItem/removeItem 例外容錯）
 *   3. setPlanChoice()（寫入前驗證＋拒絕無效 option＋setItem 例外容錯）
 *   4. allPlanChoices()（只收有效、清無效、互不影響）
 *   5. 真實 Day 8 findCurrentAndNext()＋classifyDayState() 無效值 "C" 行為 sweep
 *   6. Generic plan lifecycle（無效值在 active window / after deactivation 的行為）
 */
const fs = require("fs");
const path = require("path");

const dataSrc = fs.readFileSync(path.join(__dirname, "data.js"), "utf-8");
const appSrc  = fs.readFileSync(path.join(__dirname, "app.js"),  "utf-8");

// ── 載入真實 data.js ──────────────────────────────────────
const ctx = {};
new Function("ctx", dataSrc + `
  ctx.DAYS = DAYS;
  ctx.DAY_PLAN_CHOICES = DAY_PLAN_CHOICES;
`)(ctx);

// ── 可控 in-memory localStorage mock（可強制 getItem/setItem/removeItem 拋例外）──
function makeMockStorage(initial) {
  const store = Object.assign({}, initial || {});
  const throwOn = { getItem: false, setItem: false, removeItem: false };
  return {
    _store: store,
    _throwOn: throwOn,
    getItem(k) {
      if (throwOn.getItem) throw new Error("mock getItem boom");
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem(k, v) {
      if (throwOn.setItem) throw new Error("mock setItem boom");
      store[k] = String(v);
    },
    removeItem(k) {
      if (throwOn.removeItem) throw new Error("mock removeItem boom");
      delete store[k];
    },
    clear() { Object.keys(store).forEach(k => delete store[k]); }
  };
}
let LS = makeMockStorage();
global.localStorage = LS;                 // eval 出的 helper 以 bare `localStorage` 參照 global

// ── 時間 mock（供 findCurrentAndNext 使用）────────────────
let _mockHM = "00:00";
global._mockHM = () => _mockHM;
const setNow = (hm) => { _mockHM = hm; };

// ── 抽出真實 app.js 函式並 eval（bare DAY_PLAN_CHOICES/localStorage → global）──
const grab = (name) =>
  appSrc.match(new RegExp("function " + name + "\\([\\s\\S]*?\\n}"))[0];

eval(grab("resolveValidPlanChoice"));
eval(grab("normalizePlanChoice"));
eval(grab("getPlanChoice"));
eval(grab("setPlanChoice"));
eval(grab("allPlanChoices"));
eval(grab("planRoleTimeKeys"));
eval(grab("parseTimelineTime"));
eval(grab("planActivationStartMin"));
eval(grab("planActivationEndMin"));
eval(grab("planLifecyclePhase"));
eval(grab("findCurrentAndNext").replace("const hm = nowZurichHM();", "const hm = global._mockHM();"));
eval(grab("classifyDayState"));

// ── 迷你斷言框架 ──────────────────────────────────────────
let pass = 0, fail = 0;
const fails = [];
function check(name, cond) {
  if (cond === true) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); fails.push(name); }
}
function section(title) { console.log("\n" + "─".repeat(88) + "\n" + title + "\n" + "─".repeat(88)); }

const DAY8    = ctx.DAYS[7];
const DAY8DEF = ctx.DAY_PLAN_CHOICES.day8_spb;
const DAY8_KEY = DAY8DEF.storageKey;   // "planchoice_day8_spb_descent"
const toMin = (hm) => parseInt(hm.slice(0,2),10)*60 + parseInt(hm.slice(3,5),10);

console.log("=".repeat(88));
console.log("V21.7d · Plan Choice Storage Validation Tests（真實 Day 8 + generic plan）");
console.log("=".repeat(88));
console.log(`Day ${DAY8.day} · ${DAY8.theme}`);
console.log(`day8_spb storageKey : ${DAY8_KEY}`);
console.log(`Activation Start    : ${planActivationStartMin(DAY8DEF)} 分（${Math.floor(planActivationStartMin(DAY8DEF)/60)}:${String(planActivationStartMin(DAY8DEF)%60).padStart(2,"0")}）`);
console.log(`Deactivation End    : ${planActivationEndMin(DAY8DEF)} 分（${Math.floor(planActivationEndMin(DAY8DEF)/60)}:${String(planActivationEndMin(DAY8DEF)%60).padStart(2,"0")}）`);

// ════════════════════════════════════════════════════════════════
// 1. Validation Helper：resolveValidPlanChoice / normalizePlanChoice
// ════════════════════════════════════════════════════════════════
section("1. Validation Helper（resolveValidPlanChoice / normalizePlanChoice）");
{
  // 註冊測試 registry（含真實 day8_spb + 缺 options 的 plan）
  global.DAY_PLAN_CHOICES = {
    day8_spb: DAY8DEF,
    no_opts:  { storageKey: "test_no_opts_key" }   // 故意缺 options
  };

  // resolveValidPlanChoice（直接給 def）
  check("resolveValidPlanChoice(day8, 'A') === 'A'（有效 A）", resolveValidPlanChoice(DAY8DEF, "A") === "A");
  check("resolveValidPlanChoice(day8, 'B') === 'B'（有效 B）", resolveValidPlanChoice(DAY8DEF, "B") === "B");
  check("resolveValidPlanChoice(day8, 'C') === null（無效 C）", resolveValidPlanChoice(DAY8DEF, "C") === null);
  check("resolveValidPlanChoice(day8, '') === null（空字串）", resolveValidPlanChoice(DAY8DEF, "") === null);
  check("resolveValidPlanChoice(day8, null) === null", resolveValidPlanChoice(DAY8DEF, null) === null);
  check("resolveValidPlanChoice(day8, undefined) === null", resolveValidPlanChoice(DAY8DEF, undefined) === null);
  check("resolveValidPlanChoice(day8, 'undefined'字串) === null", resolveValidPlanChoice(DAY8DEF, "undefined") === null);
  check("resolveValidPlanChoice(null-def, 'A') === null（缺 planDef）", resolveValidPlanChoice(null, "A") === null);
  check("resolveValidPlanChoice(缺 options, 'A') === null", resolveValidPlanChoice({ storageKey: "x" }, "A") === null);
  check("resolveValidPlanChoice(options 非陣列, 'A') === null", resolveValidPlanChoice({ options: "nope" }, "A") === null);
  check("resolveValidPlanChoice 不拋例外（options 含 null 元素）",
    (() => { try { return resolveValidPlanChoice({ options: [null, { key: "A" }] }, "A") === "A"; } catch (e) { return false; } })());

  // normalizePlanChoice（給 planKey）
  check("normalizePlanChoice('day8_spb', 'A') === 'A'", normalizePlanChoice("day8_spb", "A") === "A");
  check("normalizePlanChoice('day8_spb', 'C') === null", normalizePlanChoice("day8_spb", "C") === null);
  check("normalizePlanChoice(不存在 planKey) === null", normalizePlanChoice("no_such_plan", "A") === null);
  check("normalizePlanChoice(缺 options 的 plan) === null", normalizePlanChoice("no_opts", "A") === null);
}

// ════════════════════════════════════════════════════════════════
// 2. getPlanChoice()
// ════════════════════════════════════════════════════════════════
section("2. getPlanChoice()（讀取驗證 + 無效值清理 + 例外容錯）");
{
  global.DAY_PLAN_CHOICES = { day8_spb: DAY8DEF };

  // 有效 A / B
  LS = makeMockStorage({ [DAY8_KEY]: "A", "swiss_checks": '{"x":true}' });
  global.localStorage = LS;
  check("有效 A → getPlanChoice 回傳 'A'", getPlanChoice("day8_spb") === "A");

  LS._store[DAY8_KEY] = "B";
  check("有效 B → getPlanChoice 回傳 'B'", getPlanChoice("day8_spb") === "B");

  // 無效值 → null 且【清除該 key】，但不動 swiss_checks
  LS._store[DAY8_KEY] = "C";
  const gotInvalid = getPlanChoice("day8_spb");
  check("無效值 'C' → getPlanChoice 回傳 null", gotInvalid === null);
  check("無效值 → 已 removeItem 該 plan 的 storageKey", !("planchoice_day8_spb_descent" in LS._store));
  check("無效值清理 → 不影響 swiss_checks", LS._store["swiss_checks"] === '{"x":true}');

  // 過期 legacy 值
  LS._store[DAY8_KEY] = "legacy_option";
  check("過期值 'legacy_option' → null", getPlanChoice("day8_spb") === null);
  check("過期值 → 亦已清除", !(DAY8_KEY in LS._store));

  // 無值 → null
  LS = makeMockStorage({});
  global.localStorage = LS;
  check("無值 → getPlanChoice 回傳 null", getPlanChoice("day8_spb") === null);

  // getItem throw → null（不中斷）
  LS = makeMockStorage({ [DAY8_KEY]: "A" });
  global.localStorage = LS;
  LS._throwOn.getItem = true;
  let getItemSafe = false;
  try { getItemSafe = getPlanChoice("day8_spb") === null; } catch (e) { getItemSafe = false; }
  check("getItem 拋例外 → 安全回傳 null（不 throw）", getItemSafe);

  // removeItem throw（無效值時）→ 仍回傳 null 不 throw
  LS = makeMockStorage({ [DAY8_KEY]: "C" });
  global.localStorage = LS;
  LS._throwOn.removeItem = true;
  let removeSafe = false;
  try { removeSafe = getPlanChoice("day8_spb") === null; } catch (e) { removeSafe = false; }
  check("無效值 + removeItem 拋例外 → 仍安全回傳 null（不 throw）", removeSafe);

  // 不存在 planKey → null
  LS = makeMockStorage({});
  global.localStorage = LS;
  check("不存在 planKey → getPlanChoice 回傳 null", getPlanChoice("no_such_plan") === null);
}

// ════════════════════════════════════════════════════════════════
// 3. setPlanChoice()
// ════════════════════════════════════════════════════════════════
section("3. setPlanChoice()（寫入前驗證 + 拒絕無效 + 例外容錯）");
{
  global.DAY_PLAN_CHOICES = { day8_spb: DAY8DEF, no_opts: { storageKey: "test_no_opts_key" } };

  LS = makeMockStorage({});
  global.localStorage = LS;

  check("有效 A 可寫（回傳 true）", setPlanChoice("day8_spb", "A") === true);
  check("有效 A 已寫入 localStorage", LS._store[DAY8_KEY] === "A");
  check("有效 B 可寫（回傳 true）", setPlanChoice("day8_spb", "B") === true);
  check("有效 B 已覆寫", LS._store[DAY8_KEY] === "B");

  // 無效 C → 不可寫；且不得污染既有有效值
  const before = LS._store[DAY8_KEY];
  check("無效 'C' → setPlanChoice 回傳 false", setPlanChoice("day8_spb", "C") === false);
  check("無效 'C' → 未寫入（既有有效值不變）", LS._store[DAY8_KEY] === before);

  check("空字串 → 拒絕寫入（false）", setPlanChoice("day8_spb", "") === false);
  check("null optionKey → 拒絕寫入（false）", setPlanChoice("day8_spb", null) === false);
  check("不存在 planKey → 拒絕寫入（false）", setPlanChoice("no_such_plan", "A") === false);
  check("缺 options 的 plan → 拒絕寫入（false）", setPlanChoice("no_opts", "A") === false);

  // setItem throw → 不拋未處理例外
  LS = makeMockStorage({});
  global.localStorage = LS;
  LS._throwOn.setItem = true;
  let setSafe = false;
  try { setSafe = setPlanChoice("day8_spb", "A") === false; } catch (e) { setSafe = false; }
  check("setItem 拋例外 → 安全回傳 false（不 throw）", setSafe);
}

// ════════════════════════════════════════════════════════════════
// 4. allPlanChoices()
// ════════════════════════════════════════════════════════════════
section("4. allPlanChoices()（只收有效、清無效、互不影響）");
{
  const PLAN_TWO = { storageKey: "test_plan_two_key", options: [{ key: "X" }, { key: "Y" }] };
  global.DAY_PLAN_CHOICES = { day8_spb: DAY8DEF, plan_two: PLAN_TWO };

  // 兩 plan 皆有效
  LS = makeMockStorage({ [DAY8_KEY]: "A", "test_plan_two_key": "Y", "swiss_checks": "{}" });
  global.localStorage = LS;
  let all = allPlanChoices();
  check("兩有效值皆收集（day8_spb=A, plan_two=Y）", all.day8_spb === "A" && all.plan_two === "Y");

  // plan_two 無效、day8_spb 有效 → 只保留 day8_spb，且清除 plan_two 無效值
  LS = makeMockStorage({ [DAY8_KEY]: "A", "test_plan_two_key": "ZZZ", "swiss_checks": "{}" });
  global.localStorage = LS;
  all = allPlanChoices();
  check("一 plan 無效不影響另一有效 plan（保留 day8_spb=A）", all.day8_spb === "A");
  check("無效 plan_two 不納入輸出", !("plan_two" in all));
  check("無效 plan_two 的 storageKey 已被清理", !("test_plan_two_key" in LS._store));
  check("清理無效 plan 不動 swiss_checks", LS._store["swiss_checks"] === "{}");
  check("清理無效 plan 不動另一有效 plan storageKey", LS._store[DAY8_KEY] === "A");

  // 皆無效 → 空物件
  LS = makeMockStorage({ [DAY8_KEY]: "C", "test_plan_two_key": "Q" });
  global.localStorage = LS;
  all = allPlanChoices();
  check("皆無效 → 回傳空物件", Object.keys(all).length === 0);
}

// ════════════════════════════════════════════════════════════════
// 5. 真實 Day 8 · 無效值 "C" 行為 sweep（findCurrentAndNext + classifyDayState）
// ════════════════════════════════════════════════════════════════
section("5. 真實 Day 8 · 無效值 'C' behavioral sweep（8 時間點）");
{
  global.DAY_PLAN_CHOICES = { day8_spb: DAY8DEF };
  const start = planActivationStartMin(DAY8DEF);   // 675 (11:15)
  const end   = planActivationEndMin(DAY8DEF);     // 1110 (18:30)
  const phaseOf = (hm) => planLifecyclePhase(DAY8DEF, toMin(hm));

  const timesExpect = [
    ["09:50", "in_range"],        // before_activation：共同 BOB 交通段
    ["11:14", "in_range"],        // before_activation：SPB 上山
    ["11:15", "plan_unselected"], // active_window
    ["13:00", "plan_unselected"], // active_window
    ["18:29", "plan_unselected"], // active_window（邊界前 1 分）
    ["18:30", "in_range"],        // after_deactivation：恢復共同晚餐
    ["19:00", "in_range"],        // after_deactivation
    ["21:01", "after_all"]        // after_deactivation：全天結束
  ];

  console.log("\n  time  | phase              | state          | current / next                         | 視為未選 | ≡未選");
  console.log("  ------|--------------------|----------------|----------------------------------------|--------|------");
  timesExpect.forEach(([hm, expect]) => {
    setNow(hm);
    const cnC     = findCurrentAndNext(DAY8.tl, { planChoices: { day8_spb: "C" } });
    const cnEmpty = findCurrentAndNext(DAY8.tl, { planChoices: {} });
    const stateC     = classifyDayState(cnC);
    const stateEmpty = classifyDayState(cnEmpty);

    const cur  = cnC.current ? cnC.current.time : "—";
    const nxt  = cnC.next    ? cnC.next.time    : "—";
    const treatedUnselected =
      stateC === "plan_unselected" ||
      !(cnC.current && cnC.current.planRef === "day8_spb");   // 無有效方案 block 被當已選展開
    const equivUnselected =
      stateC === stateEmpty &&
      (cnC.current ? cnC.current.time : null) === (cnEmpty.current ? cnEmpty.current.time : null) &&
      (cnC.next    ? cnC.next.time    : null) === (cnEmpty.next    ? cnEmpty.next.time    : null);

    console.log(
      `  ${hm} | ${String(phaseOf(hm)).padEnd(18)} | ${String(stateC).padEnd(14)} | ` +
      `${(cur + " / " + nxt).slice(0, 38).padEnd(38)} | ${treatedUnselected ? "  是  " : "  否  "}   | ${equivUnselected ? " ✅ " : " ❌ "}`
    );

    check(`Day8 'C' @ ${hm} → ${expect}`, stateC === expect);
    check(`Day8 'C' @ ${hm} 行為 === 未選（與 {} 完全一致）`, equivUnselected);
  });

  // 無效值不得讓「方案內容以無效 key 展開」
  setNow("13:00");
  const cn13 = findCurrentAndNext(DAY8.tl, { planChoices: { day8_spb: "C" } });
  check("Day8 'C' @ 13:00 → planUnselected=true（非靜默 gap）", cn13.planUnselected === true);
  check("Day8 'C' @ 13:00 → 不得誤判為 gap", classifyDayState(cn13) !== "gap");

  // localStorage helper 對無效值的清理（真實 storageKey）
  LS = makeMockStorage({ [DAY8_KEY]: "C", "swiss_checks": '{"a":1}' });
  global.localStorage = LS;
  check("Day8 無效值經 getPlanChoice → null", getPlanChoice("day8_spb") === null);
  check("Day8 無效值經 getPlanChoice → 已清 storageKey", !(DAY8_KEY in LS._store));
  check("Day8 無效值清理 → swiss_checks 保留", LS._store["swiss_checks"] === '{"a":1}');
}

// ════════════════════════════════════════════════════════════════
// 5b. 真實 Day 8 · 有效 A／B 無 regression
// ════════════════════════════════════════════════════════════════
section("5b. 真實 Day 8 · 有效 A／B expansion 無 regression");
{
  global.DAY_PLAN_CHOICES = { day8_spb: DAY8DEF };
  const cases = [
    ["A", "11:30", "in_range", "11:15–12:45"],  // activity A
    ["A", "15:00", "in_range", "14:30–16:07"],  // descent A
    ["A", "17:00", "in_range", "16:30–18:30"],  // town A
    ["B", "12:00", "in_range", "11:15–14:15"],  // activity B（含午餐時段）
    ["B", "15:30", "in_range", "15:10–16:37"],  // descent B
    ["B", "17:00", "in_range", "16:45–18:30"]   // town B
  ];
  cases.forEach(([opt, hm, expState, expCur]) => {
    setNow(hm);
    const cn = findCurrentAndNext(DAY8.tl, { planChoices: { day8_spb: opt } });
    const st = classifyDayState(cn);
    const ok = st === expState && cn.current && cn.current.time === expCur;
    check(`Day8 '${opt}' @ ${hm} → ${expState}（current=${expCur}）`, ok === true);
  });

  // A 與 B 在同一時刻結果不同 → 證明有效值仍正確分流
  setNow("14:45");
  const cnA = findCurrentAndNext(DAY8.tl, { planChoices: { day8_spb: "A" } });
  const cnB = findCurrentAndNext(DAY8.tl, { planChoices: { day8_spb: "B" } });
  check("Day8 @ 14:45：A=in_range（下山中）而 B=gap（尚未下山）",
    classifyDayState(cnA) === "in_range" && classifyDayState(cnB) === "gap");
}

// ════════════════════════════════════════════════════════════════
// 6. Generic plan（family / hike）· 證明修正非 A／B／day8 專屬
// ════════════════════════════════════════════════════════════════
section("6. Generic plan lifecycle（family / hike · 虛構全新 plan）");
{
  const GENERIC_DEF = {
    dayIndex: 99,
    label: "虛構方案",
    storageKey: "test_generic_plan_key",
    planActivation: { mode: "earliest_plan_block_start", decisionPrompt: "選 family 或 hike" },
    options: [
      { key: "family", activityTime: "09:00–11:00", descentTime: "14:00–15:00", townTime: "15:00–17:00" },
      { key: "hike",   activityTime: "09:00–12:00", descentTime: "14:30–15:30", townTime: "15:30–17:00" }
    ]
  };
  const GENERIC_TL = [
    { time: "07:30–09:00", title: "上山（共同）" },
    { time: "（依所選方案）", planRef: "generic_plan", planRole: "activity", title: "山上活動" },
    { time: "（依所選方案）", planRef: "generic_plan", planRole: "descent",  title: "下山" },
    { time: "（依所選方案）", planRef: "generic_plan", planRole: "town",     title: "小鎮" },
    { time: "18:00–20:00", title: "晚餐（共同）" }
  ];
  global.DAY_PLAN_CHOICES = { generic_plan: GENERIC_DEF };
  const gStart = planActivationStartMin(GENERIC_DEF);  // 540 (09:00)
  const gEnd   = planActivationEndMin(GENERIC_DEF);    // 1020 (17:00)
  check("generic 邊界推導：activation 09:00", gStart === toMin("09:00"));
  check("generic 邊界推導：deactivation 17:00", gEnd === toMin("17:00"));

  // 驗證器對此 plan
  check("resolveValidPlanChoice(generic, 'family') 有效", resolveValidPlanChoice(GENERIC_DEF, "family") === "family");
  check("resolveValidPlanChoice(generic, 'hike') 有效", resolveValidPlanChoice(GENERIC_DEF, "hike") === "hike");
  check("resolveValidPlanChoice(generic, 'A') 無效（A 不屬此 plan）", resolveValidPlanChoice(GENERIC_DEF, "A") === null);

  // 有效值展開
  setNow("10:00");
  check("family @ 10:00 → in_range（活動 09:00–11:00）", (() => {
    const cn = findCurrentAndNext(GENERIC_TL, { planChoices: { generic_plan: "family" } });
    return classifyDayState(cn) === "in_range" && cn.current.time === "09:00–11:00";
  })());
  check("hike @ 10:00 → in_range（活動 09:00–12:00）", (() => {
    const cn = findCurrentAndNext(GENERIC_TL, { planChoices: { generic_plan: "hike" } });
    return classifyDayState(cn) === "in_range" && cn.current.time === "09:00–12:00";
  })());

  // 無效值 'A'（不屬此 plan）在三階段
  setNow("08:00");   // before activation
  check("無效 'A' @ 08:00（before activation）→ 共同 in_range（07:30–09:00）", (() => {
    const cn = findCurrentAndNext(GENERIC_TL, { planChoices: { generic_plan: "A" } });
    return classifyDayState(cn) === "in_range" && cn.current.time === "07:30–09:00";
  })());
  setNow("10:00");   // active window
  check("無效 'A' @ 10:00（active window）→ plan_unselected", (() => {
    const cn = findCurrentAndNext(GENERIC_TL, { planChoices: { generic_plan: "A" } });
    return classifyDayState(cn) === "plan_unselected";
  })());
  setNow("18:30");   // after deactivation
  check("無效 'A' @ 18:30（after deactivation）→ 共同 in_range（18:00–20:00）", (() => {
    const cn = findCurrentAndNext(GENERIC_TL, { planChoices: { generic_plan: "A" } });
    return classifyDayState(cn) === "in_range" && cn.current.time === "18:00–20:00";
  })());
  setNow("21:00");   // after deactivation, day over
  check("無效 'A' @ 21:00（after deactivation, 全天結束）→ after_all", (() => {
    const cn = findCurrentAndNext(GENERIC_TL, { planChoices: { generic_plan: "A" } });
    return classifyDayState(cn) === "after_all";
  })());

  // 無效值 ≡ 未選（generic active window）
  setNow("10:00");
  const gC = findCurrentAndNext(GENERIC_TL, { planChoices: { generic_plan: "A" } });
  const gE = findCurrentAndNext(GENERIC_TL, { planChoices: {} });
  check("generic 無效值 @ 10:00 行為 === 未選（與 {} 一致）",
    classifyDayState(gC) === classifyDayState(gE) && gC.planUnselected === gE.planUnselected);
}

// ── 結果 ──────────────────────────────────────────────────
console.log("\n" + "=".repeat(88));
console.log(fail === 0
  ? `✅ PASSED · ${pass}/${pass + fail}`
  : `❌ FAILED · ${pass}/${pass + fail}（失敗：${fails.join("、")}）`);
console.log("=".repeat(88));
process.exit(fail ? 1 : 0);
