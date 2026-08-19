/**
 * V21.7d Day 8 Plan Lifecycle Regression Tests（current version）
 * 執行：node scenario_tests_day8_plan_lifecycle.js
 *
 * （V21.7a 的 scenario_tests_day8_prebranch.js 已擴充為完整 lifecycle 測試並更名）
 *
 * 驗證完整三階段 plan lifecycle：
 *   Phase 1 · before_activation   → 分流前：共同行程照常解析，不得 plan_unselected
 *   Phase 2 · active_window       → 分流有效窗且未選：plan_unselected
 *   Phase 3 · after_deactivation  → 方案時段結束：不再阻擋後續共同行程
 *
 * 修正對象：
 *   V21.7  bug — 只要有 planRef 且未選就整天 plan_unselected（缺 activation boundary）
 *   V21.7a bug — 越過 activation start 後永久 plan_unselected（缺 deactivation boundary）
 *
 * 本測試【直接使用真實 V21.7b Day 8 timeline + DAY_PLAN_CHOICES】，非簡化假資料。
 * 另含 generic lifecycle 測試，確保修正不只對 day8_spb 有效。
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

// findCurrentAndNext 內部參照 DAY_PLAN_CHOICES → 注入 global（測試中會覆寫）
global.DAY_PLAN_CHOICES = ctx.DAY_PLAN_CHOICES;

let _mockHM = "00:00";
global._mockHM = () => _mockHM;
const setMock = v => { _mockHM = v; };

// ── 抽出真實 app.js 引擎函式 ──────────────────────────────
eval(appSrc.match(/function planRoleTimeKeys\([\s\S]*?\n}/)[0]);
eval(appSrc.match(/function planRoleEngineTime\([\s\S]*?\n}/)[0]);   // V21.8b：display/engine time 分離
eval(appSrc.match(/function parseTimelineTime\([\s\S]*?\n}/)[0]);
eval(appSrc.match(/function planActivationStartMin\([\s\S]*?\n}/)[0]);
eval(appSrc.match(/function planActivationEndMin\([\s\S]*?\n}/)[0]);
eval(appSrc.match(/function planLifecyclePhase\([\s\S]*?\n}/)[0]);
eval(appSrc.match(/function resolveValidPlanChoice\([\s\S]*?\n}/)[0]);   // V21.7c：findCurrentAndNext 依賴
eval(appSrc.match(/function findCurrentAndNext\([\s\S]*?\n}/)[0]
       .replace("const hm = nowZurichHM();", "const hm = global._mockHM();"));
eval(appSrc.match(/function classifyDayState\([\s\S]*?\n}/)[0]);

const DAY8 = ctx.DAYS[7];
const PLAN = ctx.DAY_PLAN_CHOICES.day8_spb;
const fmt = m => m == null ? "(無)" :
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const startMin = planActivationStartMin(PLAN);
const endMin   = planActivationEndMin(PLAN);

console.log("=".repeat(96));
console.log("V21.7d · Day 8 Plan Lifecycle Regression Tests（真實 timeline）");
console.log("=".repeat(96));
console.log(`Day ${DAY8.day} · ${DAY8.theme}`);
console.log(`Activation Start  : ${fmt(startMin)}   （由 option SSoT 自動推導）`);
console.log(`Deactivation End  : ${fmt(endMin)}   （由 option SSoT 自動推導）\n`);
DAY8.tl.forEach((t, i) =>
  console.log(`  [${i}] ${String(t.time).padEnd(34)} ${t.title}${t.planRef ? `  <${t.planRole}>` : ""}`));
console.log("");

let pass = 0, fail = 0;
const failed = [];

function run(name, now, choices, expectState, extra) {
  setMock(now);
  const cn = findCurrentAndNext(DAY8.tl, { planChoices: choices });
  const state = classifyDayState(cn);
  let ok = expectState === "NOT_plan_unselected"
    ? state !== "plan_unselected"
    : state === expectState;
  let msg = "";
  if (ok && typeof extra === "function") {
    const r = extra(cn, state);
    if (r !== true) { ok = false; msg = String(r); }
  }
  const label = cn.current ? `[${cn.current.time} ${String(cn.current.title).slice(0, 28)}]`
              : cn.next    ? `next=[${cn.next.time}]` : "";
  if (ok) { pass++; console.log(`✅ ${name}\n     → ${state}  ${label}`); }
  else {
    fail++; failed.push(name);
    console.log(`❌ ${name}\n     expect: ${expectState}, got: ${state}  ${label}${msg ? "\n     " + msg : ""}`);
  }
}

// ══ 邊界推導本身 ═══════════════════════════════════════════
console.log("─".repeat(96));
console.log("Lifecycle Boundary 推導（generic，非 hardcode）");
console.log("─".repeat(96));

function assert(name, fn) {
  let ok = false, msg = "";
  try { const r = fn(); ok = r === true; if (r !== true) msg = String(r); }
  catch (e) { msg = e.message; }
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; failed.push(name); console.log(`❌ ${name}${msg ? "\n     → " + msg : ""}`); }
}

assert("planActivationStartMin 可推導（非 null）", () => startMin !== null || "null");
assert("planActivationEndMin 可推導（非 null）",   () => endMin   !== null || "null");
assert("Deactivation End 晚於 Activation Start",   () => endMin > startMin || `${endMin} <= ${startMin}`);
assert("Start 等於所有 option 最早 planRole 起始", () => {
  let earliest = null;
  PLAN.options.forEach(o => planRoleTimeKeys().forEach(k => {
    const p = parseTimelineTime(o[k]);
    if (p.type !== "unknown" && p.startMin != null && (earliest === null || p.startMin < earliest)) earliest = p.startMin;
  }));
  return startMin === earliest || `${startMin} != ${earliest}`;
});
assert("End 等於所有 option 最晚 planRole 結束", () => {
  let latest = null;
  PLAN.options.forEach(o => planRoleTimeKeys().forEach(k => {
    const p = parseTimelineTime(o[k]);
    if (p.type === "unknown") return;
    const e = p.endMin != null ? p.endMin : p.startMin;
    if (e != null && (latest === null || e > latest)) latest = e;
  }));
  return endMin === latest || `${endMin} != ${latest}`;
});
assert("app.js 無 Day 8 專用 hardcode 邊界（11:15 / 18:30 / 675 / 1110）", () =>
  !/(nowMin|now)\s*[<>=]{1,2}\s*(675|1110)/.test(appSrc) &&
  !/["'](11:15|18:30)["']\s*/.test(appSrc.replace(/\/\/.*$/gm, "")) || "疑似 hardcode");

// ══ A. Phase 1 · Before Activation ═════════════════════════
console.log("\n" + "─".repeat(96));
console.log("A. 未選方案 · Phase 1 Before Activation（不得 plan_unselected）");
console.log("─".repeat(96));

run("A1 · 07:30 → before_start", "07:30", {}, "before_start",
  cn => /行李寄送/.test(cn.next && cn.next.title) ? true : `next 應為行李寄送段`);
run("A2 · 08:30 → in_range（SBB 行李手續）", "08:30", {}, "in_range",
  cn => /行李寄送/.test(cn.current.title) ? true : `實得 ${cn.current.title}`);
run("A3 · 09:50 → in_range（BOB 交通段）", "09:50", {}, "in_range",
  cn => /BOB/.test(cn.current.title) ? true : `實得 ${cn.current.title}`);
run("A4 · 10:30 → in_range（SPB 上山）", "10:30", {}, "in_range",
  cn => /SPB 上山/.test(cn.current.title) ? true : `實得 ${cn.current.title}`);
run(`A5 · ${fmt(startMin - 1)}（邊界前 1 分）→ 不得 plan_unselected`, fmt(startMin - 1), {}, "NOT_plan_unselected");
run("A6 · Phase 判定為 before_activation", "10:30", {}, "in_range",
  () => planLifecyclePhase(PLAN, 10 * 60 + 30) === "before_activation" || planLifecyclePhase(PLAN, 630));

// ══ B. Phase 2 · Active Plan Window ════════════════════════
console.log("\n" + "─".repeat(96));
console.log("B. 未選方案 · Phase 2 Active Plan Window（才要求選擇 A/B）");
console.log("─".repeat(96));

run(`B1 · ${fmt(startMin)}（Activation Start）→ plan_unselected`, fmt(startMin), {}, "plan_unselected",
  cn => cn.planRef === "day8_spb" && !!cn.decisionPrompt ? true : "應回傳 planRef 與 decisionPrompt");
run("B2 · 13:00 → plan_unselected", "13:00", {}, "plan_unselected");
run("B3 · 17:00 → plan_unselected", "17:00", {}, "plan_unselected");
run(`B4 · ${fmt(endMin - 1)}（Deactivation End 前 1 分）→ plan_unselected`, fmt(endMin - 1), {}, "plan_unselected");
run("B5 · Phase 判定為 active_window", "13:00", {}, "plan_unselected",
  () => planLifecyclePhase(PLAN, 13 * 60) === "active_window" || planLifecyclePhase(PLAN, 780));

// ══ C. Phase 3 · After Deactivation ════════════════════════
console.log("\n" + "─".repeat(96));
console.log("C. 未選方案 · Phase 3 After Deactivation（V21.7b 修正重點）");
console.log("─".repeat(96));

run(`C1 · ${fmt(endMin)}（Deactivation End）→ 不得再 plan_unselected`, fmt(endMin), {}, "NOT_plan_unselected");
run("C2 · 19:00 → in_range（共用自炊晚餐）", "19:00", {}, "in_range",
  cn => /晚餐/.test(cn.current.title) ? true : `應為共用晚餐段，實得 ${cn.current.title}`);
run("C3 · 20:00 → in_range（共用行程）", "20:00", {}, "in_range",
  cn => /晚餐/.test(cn.current.title) ? true : `實得 ${cn.current.title}`);
run("C4 · 21:01 → after_all", "21:01", {}, "after_all");
run("C5 · 23:00 → after_all", "23:00", {}, "after_all");
run("C6 · Phase 判定為 after_deactivation", "19:00", {}, "in_range",
  () => planLifecyclePhase(PLAN, 19 * 60) === "after_deactivation" || planLifecyclePhase(PLAN, 1140));

// ══ D. 已選 A ═════════════════════════════════════════════
console.log("\n" + "─".repeat(96));
console.log("D. 已選方案 A（家庭預設）· 四個 planRole + 共同行程");
console.log("─".repeat(96));
const A = { day8_spb: "A" };
const optA = PLAN.options.find(o => o.key === "A");

run("D1 · A · 08:30 → 共同行程正常", "08:30", A, "in_range",
  cn => /行李寄送/.test(cn.current.title) ? true : `實得 ${cn.current.title}`);
// V21.8b：A 方案已同步 V21.4g（家庭版主方案；display=11:15–下山前 / engine=11:15–13:00）
run("D2 · A · 12:00 → activity（家庭版主方案・非 Alpine Garden 主核心）", "12:00", A, "in_range",
  cn => cn.current.time === planRoleEngineTime(optA, "activityTime")
        && /家庭版主方案|Skywalk/.test(cn.current.title)
        && !/^🌸 Alpine Garden ＋ 短版/.test(cn.current.title)
        ? true : `應為 ${planRoleEngineTime(optA, "activityTime")}，實得 ${cn.current.time} / ${cn.current.title}`);
run("D3 · A · 13:30 → lunch（餐廳）", "13:30", A, "in_range",
  cn => cn.current.time === optA.lunchTime ? true : `應為 ${optA.lunchTime}，實得 ${cn.current.time}`);
run("D4 · A · 15:00 → descent（14:30 下山）", "15:00", A, "in_range",
  cn => cn.current.time === optA.descentTime ? true : `應為 ${optA.descentTime}，實得 ${cn.current.time}`);
run("D5 · A · 17:00 → town", "17:00", A, "in_range",
  cn => cn.current.time === optA.townTime ? true : `應為 ${optA.townTime}，實得 ${cn.current.time}`);
run("D6 · A · 19:00 → 共用晚餐（deactivation 不影響已選）", "19:00", A, "in_range",
  cn => /晚餐/.test(cn.current.title) ? true : `實得 ${cn.current.title}`);
run("D7 · A · 21:01 → after_all", "21:01", A, "after_all");

// ══ E. 已選 B ═════════════════════════════════════════════
console.log("\n" + "─".repeat(96));
console.log("E. 已選方案 B（Bonus Plan）· 四個 planRole + 共同行程");
console.log("─".repeat(96));
const B = { day8_spb: "B" };
const optB = PLAN.options.find(o => o.key === "B");

run("E1 · B · 09:50 → 共同行程正常", "09:50", B, "in_range",
  cn => /BOB/.test(cn.current.title) ? true : `實得 ${cn.current.title}`);
run("E2 · B · 12:00 → activity（Panorama Hike）", "12:00", B, "in_range",
  cn => cn.current.time === optB.activityTime && /Panorama Hike/.test(cn.current.title)
        ? true : `應為 ${optB.activityTime}，實得 ${cn.current.time}`);
run("E3 · B · 13:30 → 仍在 activity（含野餐）", "13:30", B, "in_range",
  cn => cn.current.time === optB.activityTime ? true : `實得 ${cn.current.time}`);
run("E4 · B · 15:30 → descent（15:10 下山）", "15:30", B, "in_range",
  cn => cn.current.time === optB.descentTime ? true : `應為 ${optB.descentTime}，實得 ${cn.current.time}`);
run("E5 · B · 17:00 → town", "17:00", B, "in_range",
  cn => cn.current.time === optB.townTime ? true : `應為 ${optB.townTime}，實得 ${cn.current.time}`);
run("E6 · B · 19:00 → 共用晚餐（deactivation 不影響已選）", "19:00", B, "in_range",
  cn => /晚餐/.test(cn.current.title) ? true : `實得 ${cn.current.title}`);
run("E7 · B · 21:01 → after_all", "21:01", B, "after_all");

// ══ F. A/B 差異 ═══════════════════════════════════════════
console.log("\n" + "─".repeat(96));
console.log("F. A/B 實際差異（同一時間點應解析出不同結果）");
console.log("─".repeat(96));
setMock("14:45");
const cnA = findCurrentAndNext(DAY8.tl, { planChoices: A });
const cnB = findCurrentAndNext(DAY8.tl, { planChoices: B });
const sigA = `${classifyDayState(cnA)}|${cnA.current ? cnA.current.time : "-"}`;
const sigB = `${classifyDayState(cnB)}|${cnB.current ? cnB.current.time : "-"}`;
if (sigA !== sigB) {
  pass++;
  console.log(`✅ 14:45 時 A 與 B 解析結果不同\n     A → ${sigA}\n     B → ${sigB}`);
} else { fail++; failed.push("A/B 差異"); console.log(`❌ 14:45 時 A 與 B 應不同（皆為 ${sigA}）`); }

// ══ G. Generic Plan Lifecycle（不只 day8_spb）══════════════
console.log("\n" + "─".repeat(96));
console.log("G. Generic Plan Lifecycle（驗證修正非 Day 8 專屬）");
console.log("─".repeat(96));

// 虛構一個全新的 plan：activation 09:00、deactivation 15:00，之後有共同行程 16:00–18:00
const GENERIC_PLAN = {
  generic_test: {
    dayIndex: 99,
    label: "Generic 測試方案",
    storageKey: "planchoice_generic_test",
    planActivation: {
      mode: "earliest_plan_block_start",
      commonScheduleBeforeActivation: true,
      decisionPrompt: "請選擇 X 或 Y。"
    },
    options: [
      { key:"X", label:"方案 X", activityTime:"09:00–12:00", lunchTime:"12:00–13:00",
        descentTime:"13:00–14:00", townTime:"14:00–15:00", pro:"" },
      { key:"Y", label:"方案 Y", activityTime:"09:30–12:30", lunchTime:"12:30–13:30",
        descentTime:"13:30–14:30", townTime:"14:30–15:00", pro:"" }
    ]
  }
};
const GENERIC_TL = [
  { time:"07:00–08:30", title:"早晨共同行程" },
  { time:"（依所選方案）", planRef:"generic_test", planRole:"activity", title:"活動" },
  { time:"（依所選方案）", planRef:"generic_test", planRole:"lunch",    title:"午餐" },
  { time:"（依所選方案）", planRef:"generic_test", planRole:"descent",  title:"下山" },
  { time:"（依所選方案）", planRef:"generic_test", planRole:"town",     title:"小鎮" },
  { time:"16:00–18:00", title:"傍晚共同行程" }
];

const savedPlans = global.DAY_PLAN_CHOICES;
global.DAY_PLAN_CHOICES = GENERIC_PLAN;

const gStart = planActivationStartMin(GENERIC_PLAN.generic_test);
const gEnd   = planActivationEndMin(GENERIC_PLAN.generic_test);
console.log(`  Generic Activation Start: ${fmt(gStart)} · Deactivation End: ${fmt(gEnd)}`);

function runG(name, now, choices, expectState, extra) {
  setMock(now);
  const cn = findCurrentAndNext(GENERIC_TL, { planChoices: choices });
  const state = classifyDayState(cn);
  let ok = expectState === "NOT_plan_unselected" ? state !== "plan_unselected" : state === expectState;
  let msg = "";
  if (ok && typeof extra === "function") { const r = extra(cn); if (r !== true) { ok = false; msg = String(r); } }
  const label = cn.current ? `[${cn.current.time} ${cn.current.title}]` : cn.next ? `next=[${cn.next.time}]` : "";
  if (ok) { pass++; console.log(`✅ ${name}\n     → ${state}  ${label}`); }
  else { fail++; failed.push(name); console.log(`❌ ${name}\n     expect ${expectState}, got ${state}  ${label}${msg ? "\n     " + msg : ""}`); }
}

runG("G1 · Generic · 邊界自動推導 09:00 / 15:00", "07:30", {}, "in_range",
  () => (gStart === 9 * 60 && gEnd === 15 * 60) ? true : `${fmt(gStart)} / ${fmt(gEnd)}`);
runG("G2 · Generic · 07:30 未選 → 共同行程 in_range", "07:30", {}, "in_range",
  cn => /早晨共同行程/.test(cn.current.title) ? true : cn.current.title);
runG("G3 · Generic · 08:45 未選（分流前空檔）→ 不得 plan_unselected", "08:45", {}, "NOT_plan_unselected");
runG("G4 · Generic · 09:00 未選 → plan_unselected", "09:00", {}, "plan_unselected");
runG("G5 · Generic · 14:00 未選 → plan_unselected", "14:00", {}, "plan_unselected");
runG("G6 · Generic · 15:00 未選 → 不得再 plan_unselected", "15:00", {}, "NOT_plan_unselected");
runG("G7 · Generic · 17:00 未選 → in_range（傍晚共同行程）", "17:00", {}, "in_range",
  cn => /傍晚共同行程/.test(cn.current.title) ? true : cn.current.title);
runG("G8 · Generic · 19:00 未選 → after_all（非永久 plan_unselected）", "19:00", {}, "after_all");
runG("G9 · Generic · 已選 X · 10:00 → activity", "10:00", { generic_test:"X" }, "in_range",
  cn => cn.current.time === "09:00–12:00" ? true : cn.current.time);
runG("G10 · Generic · 已選 Y · 10:00 → activity（與 X 不同）", "10:00", { generic_test:"Y" }, "in_range",
  cn => cn.current.time === "09:30–12:30" ? true : cn.current.time);

global.DAY_PLAN_CHOICES = savedPlans;

// ── 結果 ──────────────────────────────────────────────────
console.log("\n" + "=".repeat(96));
console.log(fail === 0
  ? `✅ PASSED · ${pass}/${pass + fail}`
  : `❌ FAILED · ${pass}/${pass + fail}（失敗：${failed.join("、")}）`);
console.log("=".repeat(96));
process.exit(fail ? 1 : 0);
