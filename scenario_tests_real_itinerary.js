/**
 * V21.7d Real Itinerary Corpus Tests（current version）
 * 執行：node scenario_tests_real_itinerary.js
 *
 * 直接讀 data.js 的 DAYS，遍歷 Day 1～11 每一個 timeline time 字串，
 * 分類並偵測結構性問題。
 *
 * 設計原則（依 V21.6 指令）：
 *   - 不要求 unknown 必須為 0（有些相對時間本來就不該硬解析）
 *   - 正確做法是：辨識 → 分類 → 確保 UI 對 unknown 有安全 fallback
 *   - alternative time（A/B 方案）不得交給通用 parser 猜測，必須用 planRef 標記
 */
const fs = require("fs");
const path = require("path");

// ── 載入 data.js ──────────────────────────────────────────
const dataSrc = fs.readFileSync(path.join(__dirname, "data.js"), "utf-8");
const ctx = {};
new Function("ctx", dataSrc + `
  ctx.DAYS = DAYS;
  ctx.DAY_PLAN_CHOICES = (typeof DAY_PLAN_CHOICES !== "undefined") ? DAY_PLAN_CHOICES : {};
  ctx.BRB_DAY_PLAN = (typeof BRB_DAY_PLAN !== "undefined") ? BRB_DAY_PLAN : null;
`)(ctx);

// ── 從 app.js 抽出 parser（確保測的是實際上線的 parser）─────
const appSrc = fs.readFileSync(path.join(__dirname, "app.js"), "utf-8");
const parseSrc = appSrc.match(/function parseTimelineTime\([\s\S]*?\n}/)[0];
eval(parseSrc);

// ── 偵測 alternative time 字串（不應交給通用 parser）────────
function looksLikeAlternative(str) {
  if (!str) return false;
  // "14:30 / 15:10"、"14:30／15:10"、"方案 A 14:30 ／ 方案 B 15:10"
  const times = String(str).match(/\d{1,2}:\d{2}/g) || [];
  const hasSlash = /[\/／]/.test(str);
  const isRange = /^\d{1,2}:\d{2}\s*[–\-~]\s*\d{1,2}:\d{2}/.test(str);
  return hasSlash && times.length >= 2 && !isRange;
}

// ── 逐日分析 ──────────────────────────────────────────────
const rows = [];
const issues = { critical: [], warning: [], info: [] };

ctx.DAYS.forEach((d, dayIdx) => {
  const planRefsInDay = new Set(d.tl.filter(t => t.planRef).map(t => t.planRef));
  const parsedBlocks = [];

  d.tl.forEach((t, i) => {
    const p = parseTimelineTime(t.time);
    const alt = looksLikeAlternative(t.time);
    const row = {
      day: d.day,
      idx: i,
      time: t.time,
      title: t.title,
      type: p.type,
      startMin: p.startMin,
      endMin: p.endMin,
      isAlternative: alt,
      isUnknown: p.type === "unknown",
      isPoint: p.type === "point",
      isRange: p.type === "range",
      hasPlanRef: !!t.planRef,
      planRef: t.planRef || null,
      planRole: t.planRole || null
    };
    rows.push(row);
    if (p.type !== "unknown") parsedBlocks.push(row);

    // ① alternative time 未用 planRef 標記 → Critical
    if (alt && !t.planRef) {
      issues.critical.push(
        `Day ${d.day} #${i} 「${t.time}」看起來是 alternative time，但未用 planRef 標記；通用 parser 只會讀到第一個時間`
      );
    }
    // ② start > end
    if (p.type === "range" && p.startMin >= p.endMin) {
      issues.critical.push(`Day ${d.day} #${i} 「${t.time}」start >= end`);
    }
  });

  // ③ range overlap（前一事件尚未結束、下一事件已開始）
  for (let i = 1; i < parsedBlocks.length; i++) {
    const prev = parsedBlocks[i - 1], cur = parsedBlocks[i];
    if (prev.isRange && cur.startMin != null && cur.startMin < prev.endMin) {
      // 若兩者都屬同一個 planRef，視為方案造成的假 overlap（可接受）
      const samePlan = prev.planRef && cur.planRef && prev.planRef === cur.planRef;
      if (samePlan) {
        issues.info.push(`Day ${d.day} #${prev.idx}→#${cur.idx} 同方案內時間重疊（由 planRef 控制，可接受）`);
      } else {
        issues.critical.push(
          `Day ${d.day} overlap：#${prev.idx}「${prev.time}」尚未結束，#${cur.idx}「${cur.time}」已開始`
        );
      }
    }
  }

  // ④ 全天 unknown
  if (parsedBlocks.length === 0) {
    issues.warning.push(`Day ${d.day} 全天無可解析時間 → UI 必須顯示 schedule_unknown（非「已完成」）`);
  }

  // ⑤ planRef 定義完整性
  planRefsInDay.forEach(ref => {
    const def = ctx.DAY_PLAN_CHOICES[ref];
    if (!def) {
      issues.critical.push(`Day ${d.day} 使用 planRef "${ref}"，但 DAY_PLAN_CHOICES 未定義`);
    } else if (def.dayIndex !== dayIdx) {
      issues.critical.push(`Day ${d.day} planRef "${ref}".dayIndex=${def.dayIndex} 與實際 DAYS index ${dayIdx} 不符`);
    }
  });
});

// ── 輸出 corpus 表 ────────────────────────────────────────
console.log("=".repeat(100));
console.log("V21.7d Real Itinerary Corpus · Day 1–11 timeline parser 分析");
console.log("=".repeat(100));
console.log(
  "Day".padEnd(4) + "| " + "time".padEnd(38) + "| " + "type".padEnd(9) +
  "| " + "start".padEnd(6) + "| " + "end".padEnd(6) + "| alt | plan"
);
console.log("-".repeat(100));
rows.forEach(r => {
  console.log(
    String(r.day).padEnd(4) + "| " +
    String(r.time).slice(0, 37).padEnd(38) + "| " +
    r.type.padEnd(9) + "| " +
    String(r.startMin ?? "-").padEnd(6) + "| " +
    String(r.endMin ?? "-").padEnd(6) + "| " +
    (r.isAlternative ? " Y  " : " .  ") + "| " +
    (r.planRef ? `${r.planRef}/${r.planRole}` : "-")
  );
});

// ── 統計 ──────────────────────────────────────────────────
const total = rows.length;
const nRange = rows.filter(r => r.isRange).length;
const nPoint = rows.filter(r => r.isPoint).length;
const nUnknown = rows.filter(r => r.isUnknown).length;
const nAlt = rows.filter(r => r.isAlternative).length;
const nPlan = rows.filter(r => r.hasPlanRef).length;

console.log("\n" + "=".repeat(100));
console.log("統計");
console.log("=".repeat(100));
console.log(`總 timeline blocks : ${total}`);
console.log(`  range            : ${nRange}`);
console.log(`  point            : ${nPoint}`);
console.log(`  unknown          : ${nUnknown}  （允許存在；UI 必須有 schedule_unknown fallback）`);
console.log(`  alternative 字串  : ${nAlt}  （必須全部由 planRef 控制）`);
console.log(`  有 planRef        : ${nPlan}`);

// ── 問題列表 ──────────────────────────────────────────────
console.log("\n" + "=".repeat(100));
console.log("問題偵測");
console.log("=".repeat(100));
console.log(`\n【CRITICAL】${issues.critical.length} 項`);
issues.critical.forEach(m => console.log("  ❌ " + m));
console.log(`\n【WARNING】${issues.warning.length} 項`);
issues.warning.forEach(m => console.log("  ⚠️  " + m));
console.log(`\n【INFO】${issues.info.length} 項`);
issues.info.forEach(m => console.log("  ℹ️  " + m));

// ── Day 10 BRB 內部一致性（P3 專項）───────────────────────
console.log("\n" + "=".repeat(100));
console.log("Day 10 BRB timeline 內部一致性檢查（P3）");
console.log("=".repeat(100));
if (ctx.BRB_DAY_PLAN) {
  const d10 = ctx.DAYS[9];
  const toMin = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
  const plan = ctx.BRB_DAY_PLAN;
  const expectSummitArrive = toMin(plan.chosenUpDeparture) + plan.ascentMinutes;
  const summitBlock = d10.tl.find(t => /Rothorn Kulm 山頂/.test(t.title));
  const ascentBlock = d10.tl.find(t => /蒸汽齒軌上山/.test(t.title));
  let brbOk = true;

  if (ascentBlock) {
    const p = parseTimelineTime(ascentBlock.time);
    const ok = p.startMin === toMin(plan.chosenUpDeparture) && p.endMin === expectSummitArrive;
    console.log(`  上山段 「${ascentBlock.time}」 ${ok ? "✅" : "❌"} 應為 ${plan.chosenUpDeparture}–${String(Math.floor(expectSummitArrive/60)).padStart(2,"0")}:${String(expectSummitArrive%60).padStart(2,"0")}`);
    brbOk = brbOk && ok;
  }
  if (summitBlock) {
    const p = parseTimelineTime(summitBlock.time);
    const ok = p.startMin === expectSummitArrive;
    console.log(`  山頂段 「${summitBlock.time}」 ${ok ? "✅" : "❌"} 起始應等於抵頂時間（不得早於抵頂）`);
    brbOk = brbOk && ok;
    if (!ok) issues.critical.push("Day 10 山頂段起始時間早於 BRB 抵頂時間（物理不可能）");
  }
  console.log(`  BRB_DAY_PLAN.status = ${plan.status}（${plan.statusLabel}）`);
  console.log(`  → Day 10 BRB 內部一致性：${brbOk ? "✅ 通過" : "❌ 未通過"}`);
} else {
  console.log("  ⚠️  BRB_DAY_PLAN 未定義");
}

// ── Day 6 主線檢查（P1 專項）──────────────────────────────
console.log("\n" + "=".repeat(100));
console.log("Day 6 主線檢查（P1：Mürren / Allmendhubel 不得消失）");
console.log("=".repeat(100));
const d6text = JSON.stringify(ctx.DAYS[5]);
const hasMurren = /Mürren/.test(d6text);
const hasAllmendhubel = /Allmendhubel/.test(d6text);
console.log(`  Mürren        : ${hasMurren ? "✅ 存在" : "❌ 缺失"}`);
console.log(`  Allmendhubel  : ${hasAllmendhubel ? "✅ 存在" : "❌ 缺失"}`);
if (!hasMurren || !hasAllmendhubel) {
  issues.critical.push("Day 6 主線缺少 Mürren / Allmendhubel（V21.3b regression）");
}

// ── 結果 ──────────────────────────────────────────────────
const failed = issues.critical.length > 0;
console.log("\n" + "=".repeat(100));
console.log(failed
  ? `❌ FAILED · Critical ${issues.critical.length} 項`
  : `✅ PASSED · Critical 0 項（Warning ${issues.warning.length} / Info ${issues.info.length}）`);
console.log("=".repeat(100));
process.exit(failed ? 1 : 0);
