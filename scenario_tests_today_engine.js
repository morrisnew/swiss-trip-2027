/**
 * V21.7d Today Dashboard 時間引擎 unit scenario tests（current version）
 * 執行：node scenario_tests_today_engine.js
 *
 * 涵蓋七態：
 *   in_range / at_milestone / before_start / gap / after_all
 *   / schedule_unknown（P7）/ plan_unselected（P2）
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "app.js"), "utf-8");

const parseTimelineTimeSrc  = src.match(/function parseTimelineTime\([\s\S]*?\n}/)[0];
const findCurrentAndNextSrc = src.match(/function findCurrentAndNext\([\s\S]*?\n}/)[0];
const classifyDayStateSrc   = src.match(/function classifyDayState\([\s\S]*?\n}/)[0];

let _mockHM = "00:00";
global._mockHM = () => _mockHM;
const setMock = (v) => { _mockHM = v; };

// 測試用 DAY_PLAN_CHOICES（與 data.js 結構一致）
global.DAY_PLAN_CHOICES = {
  test_plan: {
    dayIndex: 7,
    label: "測試方案",
    storageKey: "planchoice_test",
    note: "",
    // V21.7a：分流邊界 metadata（自 option 最早時間推導 → 14:30）
    planActivation: {
      mode: "earliest_plan_block_start",
      commonScheduleBeforeActivation: true,
      decisionPrompt: "請選擇 A 或 B。"
    },
    options: [
      { key:"A", label:"方案 A", descentTime:"14:30–16:07", descentTitle:"下山 A", townTime:"16:07–18:00", pro:"" },
      { key:"B", label:"方案 B", descentTime:"15:10–16:37", descentTitle:"下山 B", townTime:"16:37–18:00", pro:"" }
    ]
  }
};
const DAY_PLAN_CHOICES = global.DAY_PLAN_CHOICES;

const planRoleTimeKeysSrc       = src.match(/function planRoleTimeKeys\([\s\S]*?\n}/)[0];
const planActivationStartMinSrc = src.match(/function planActivationStartMin\([\s\S]*?\n}/)[0];
const planActivationEndMinSrc   = src.match(/function planActivationEndMin\([\s\S]*?\n}/)[0];
const planLifecyclePhaseSrc     = src.match(/function planLifecyclePhase\([\s\S]*?\n}/)[0];

eval(planRoleTimeKeysSrc);
eval(src.match(/function planRoleEngineTime\([\s\S]*?\n}/)[0]);   // V21.8b：display/engine time 分離
eval(parseTimelineTimeSrc);
eval(planActivationStartMinSrc);
eval(planActivationEndMinSrc);
eval(planLifecyclePhaseSrc);
eval(src.match(/function resolveValidPlanChoice\([\s\S]*?\n}/)[0]);   // V21.7c：findCurrentAndNext 依賴
eval(findCurrentAndNextSrc.replace("const hm = nowZurichHM();", "const hm = global._mockHM();"));
eval(classifyDayStateSrc);

const scenarios = [
  { name:"S1 · 中間空檔（V21.4 bug 情境：16:20，兩段 15:00-16:10 / 16:30-18:30）", now:"16:20",
    tl:[{time:"15:00–16:10",title:"A"},{time:"16:30–18:30",title:"B"}],
    expect:"gap", expectNext:"16:30–18:30" },

  { name:"S2 · 早於全天第一段（07:00，全天 08:00 開始）", now:"07:00",
    tl:[{time:"08:00–10:00",title:"A"},{time:"14:00–16:00",title:"B"}],
    expect:"before_start", expectNext:"08:00–10:00" },

  { name:"S3 · 正在 range 內（09:30，行程 08:00-10:00）", now:"09:30",
    tl:[{time:"08:00–10:00",title:"A"},{time:"14:00–16:00",title:"B"}],
    expect:"in_range", expectCurrent:"08:00–10:00" },

  { name:"S4 · 全天結束後（23:00，最後段 14:00-16:00）", now:"23:00",
    tl:[{time:"08:00–10:00",title:"A"},{time:"14:00–16:00",title:"B"}],
    expect:"after_all" },

  { name:"S5 · Day 11: 14:00-15:10 + 15:30 起飛（point），15:20 打開", now:"15:20",
    tl:[{time:"14:00–15:10",title:"機場流程"},{time:"15:30 起飛",title:"EK88"}],
    expect:"gap", expectNext:"15:30 起飛" },

  // V21.6 · P8：point event 語意分離
  { name:"S6 · P8: 15:32 落在 15:30 point 關注窗 → at_milestone（非 in_range）", now:"15:32",
    tl:[{time:"14:00–15:10",title:"機場流程"},{time:"15:30 起飛",title:"EK88"}],
    expect:"at_milestone", expectCurrent:"15:30 起飛" },

  { name:"S7 · P8: 15:26（point 前 4 分）→ 不得提前判為 current", now:"15:26",
    tl:[{time:"14:00–15:10",title:"機場流程"},{time:"15:30 起飛",title:"EK88"}],
    expect:"gap", expectNext:"15:30 起飛" },

  // V21.6 · P7：全 unknown 不得誤判為 after_all
  { name:"S8 · P7: 全 unknown 時間軸 → schedule_unknown（非 after_all）", now:"10:00",
    tl:[{time:"整天",title:"自由"},{time:"隨時",title:"打包"}],
    expect:"schedule_unknown" },

  // V21.6 · P2：A/B 方案
  { name:"S9 · P2/V21.7a: 已過分流邊界(14:30) 且未選定 → plan_unselected", now:"15:00",
    tl:[{time:"12:00–14:30",title:"上山"},
        {time:"方案 A 14:30 ／ 方案 B 15:10",planRef:"test_plan",planRole:"descent",title:"下山"},
        {time:"（依所選方案）",planRef:"test_plan",planRole:"town",title:"小鎮"}],
    planChoices:{},
    expect:"plan_unselected" },

  { name:"S10 · P2: 已選方案 A，15:00 → in_range（14:30–16:07）", now:"15:00",
    tl:[{time:"12:00–14:30",title:"上山"},
        {time:"方案 A 14:30 ／ 方案 B 15:10",planRef:"test_plan",planRole:"descent",title:"下山"},
        {time:"（依所選方案）",planRef:"test_plan",planRole:"town",title:"小鎮"}],
    planChoices:{test_plan:"A"},
    expect:"in_range", expectCurrent:"14:30–16:07" },

  { name:"S11 · P2: 已選方案 B，15:00 → gap（15:10 才下山）", now:"15:00",
    tl:[{time:"12:00–14:30",title:"上山"},
        {time:"方案 A 14:30 ／ 方案 B 15:10",planRef:"test_plan",planRole:"descent",title:"下山"},
        {time:"（依所選方案）",planRef:"test_plan",planRole:"town",title:"小鎮"}],
    planChoices:{test_plan:"B"},
    expect:"gap", expectNext:"15:10–16:37" },

  { name:"S12 · range 與 point 同時命中時，range 優先", now:"09:00",
    tl:[{time:"08:00–10:00",title:"進行中"},{time:"09:00 集合",title:"集合點"}],
    expect:"in_range", expectCurrent:"08:00–10:00" },

  // V21.7a：分流邊界之前，未選方案不得遮蔽共同行程
  { name:"S13 · V21.7a: 未選方案但在分流邊界(14:30)之前 → 共同行程正常 in_range", now:"12:00",
    tl:[{time:"12:00–14:30",title:"上山（共同）"},
        {time:"方案 A 14:30 ／ 方案 B 15:10",planRef:"test_plan",planRole:"descent",title:"下山"},
        {time:"（依所選方案）",planRef:"test_plan",planRole:"town",title:"小鎮"}],
    planChoices:{},
    expect:"in_range", expectCurrent:"12:00–14:30" },

  { name:"S14 · V21.7a: 未選方案且早於全天第一段 → before_start（非 plan_unselected）", now:"07:00",
    tl:[{time:"12:00–14:30",title:"上山（共同）"},
        {time:"方案 A 14:30 ／ 方案 B 15:10",planRef:"test_plan",planRole:"descent",title:"下山"},
        {time:"（依所選方案）",planRef:"test_plan",planRole:"town",title:"小鎮"}],
    planChoices:{},
    expect:"before_start", expectNext:"12:00–14:30" },

  { name:"S15 · V21.7a: 未選方案且在共同段與分流點之間空檔 → gap（非 plan_unselected）", now:"14:20",
    tl:[{time:"12:00–14:10",title:"上山（共同）"},
        {time:"方案 A 14:30 ／ 方案 B 15:10",planRef:"test_plan",planRole:"descent",title:"下山"},
        {time:"（依所選方案）",planRef:"test_plan",planRole:"town",title:"小鎮"}],
    planChoices:{},
    expect:"gap" },

  // V21.7b：Deactivation boundary — 方案時段結束後不得永久 plan_unselected
  { name:"S16 · V21.7b: 未選方案但已過 deactivation(18:00) → 共同行程恢復 in_range", now:"19:00",
    tl:[{time:"12:00–14:30",title:"上山（共同）"},
        {time:"方案 A 14:30 ／ 方案 B 15:10",planRef:"test_plan",planRole:"descent",title:"下山"},
        {time:"（依所選方案）",planRef:"test_plan",planRole:"town",title:"小鎮"},
        {time:"18:30–21:00",title:"晚餐（共同）"}],
    planChoices:{},
    expect:"in_range", expectCurrent:"18:30–21:00" },

  { name:"S17 · V21.7b: 未選方案且全天結束 → after_all（非永久 plan_unselected）", now:"22:00",
    tl:[{time:"12:00–14:30",title:"上山（共同）"},
        {time:"方案 A 14:30 ／ 方案 B 15:10",planRef:"test_plan",planRole:"descent",title:"下山"},
        {time:"（依所選方案）",planRef:"test_plan",planRole:"town",title:"小鎮"},
        {time:"18:30–21:00",title:"晚餐（共同）"}],
    planChoices:{},
    expect:"after_all" }
];

let pass = 0, fail = 0;
for (const s of scenarios) {
  setMock(s.now);
  const cn = findCurrentAndNext(s.tl, { planChoices: s.planChoices || {} });
  const state = classifyDayState(cn);
  const ok = state === s.expect &&
             (!s.expectNext    || (cn.next    && cn.next.time    === s.expectNext)) &&
             (!s.expectCurrent || (cn.current && cn.current.time === s.expectCurrent));
  if (ok) { pass++; console.log(`✅ ${s.name} → ${state}`); }
  else {
    fail++;
    console.log(`❌ ${s.name}`);
    console.log(`   expect state  : ${s.expect}, got: ${state}`);
    console.log(`   expect next   : ${s.expectNext    || "any"}, got: ${cn.next?.time    || "null"}`);
    console.log(`   expect current: ${s.expectCurrent || "any"}, got: ${cn.current?.time || "null"}`);
  }
}
console.log(`\n通過 ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
