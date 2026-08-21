/**
 * V21.7d Data Baseline Reconciliation Tests（current version）
 * 執行：node scenario_tests_data_baseline.js
 *
 * 驗證 Web 資料層是否確實維持 Excel V21.4a baseline，
 * 且未破壞 V21.6 已建立的 SSoT / regression guard。
 * 版本 static 守門：current = V21.7d；V21.7a／V21.7b／V21.7c 皆為歷史 regression guard。
 */
const fs = require("fs");
const path = require("path");

const dataSrc = fs.readFileSync(path.join(__dirname, "data.js"), "utf-8");
const appSrc  = fs.readFileSync(path.join(__dirname, "app.js"),  "utf-8");
const swSrc   = fs.readFileSync(path.join(__dirname, "sw.js"),   "utf-8");

const ctx = {};
new Function("ctx", dataSrc + `
  ctx.TRIP_META = TRIP_META;
  ctx.HOTELS = HOTELS;
  ctx.BOOKINGS = BOOKINGS;
  ctx.PENDING_2027 = PENDING_2027;
  ctx.PACKING = PACKING;
  ctx.DAYS = DAYS;
  ctx.DAY_PLAN_CHOICES = DAY_PLAN_CHOICES;
  ctx.BRB_DAY_PLAN = BRB_DAY_PLAN;
  ctx.FLIGHT_ITINERARY = FLIGHT_ITINERARY;
  ctx.TRAVEL_DOCUMENT_RULES = TRAVEL_DOCUMENT_RULES;
  ctx.WEATHER_DECISION = WEATHER_DECISION;
  ctx.BRB_SCHEDULE = BRB_SCHEDULE;
  ctx.BRB_DERIVED = BRB_DERIVED;
  ctx.CONSULATE_CONTACT = CONSULATE_CONTACT;
  ctx.RESTAURANTS = RESTAURANTS;
  ctx.EMIRATES_RULES = EMIRATES_RULES;
  ctx.ZRH_T20_HM = ZRH_T20_HM;
`)(ctx);

const allText = dataSrc + appSrc + swSrc;
let pass = 0, fail = 0;
const failures = [];

function t(name, fn) {
  let ok = false, detail = "";
  try { const r = fn(); ok = r === true; if (r !== true) detail = String(r); }
  catch (e) { ok = false; detail = e.message; }
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}${detail ? "\n     → " + detail : ""}`); failures.push(name); }
}

console.log("=".repeat(84));
console.log("V21.7d · Excel V21.4a Baseline Reconciliation");
console.log("=".repeat(84));

// ── 版本（current V21.7d）─────────────────────────────────
console.log("\n【版本 · current V21.7d】");
t("TRIP_META.version 為 V21.8c1（行程資料 V21.4g）", () =>
  ctx.TRIP_META.version === "V21.8c1 Web · 行程資料 V21.4g" || ctx.TRIP_META.version);
t("webAppVersion = V21.8c1 且 itineraryVersion = V21.4g（兩條版本線分開）", () =>
  ctx.TRIP_META.webAppVersion === "V21.8c1" && ctx.TRIP_META.itineraryVersion === "V21.4g");
t("CACHE_NAME 為 v21-7d-final-accsync（current deployment revision）", () =>
  /const\s+CACHE_NAME\s*=\s*"swiss-trip-v21-8c1-v21-4g-dark-mode-seal-2027"\s*;/.test(swSrc));
t("current CACHE_NAME const 不再是初次 v21-7d（舊 cache 僅存於註解/遷移）", () =>
  !/const\s+CACHE_NAME\s*=\s*"swiss-trip-v21-7d-2027"\s*;/.test(swSrc));
t("user-facing 不再出現「基於 V21.3b 行程資料」", () =>
  !dataSrc.includes("基於 V21.3b 行程資料"));

// ── 住宿 ────────────────────────────────────────────────
console.log("\n【住宿】");
t("KoBi bookingStatus = confirmed", () =>
  ctx.HOTELS.luzern.bookingStatus === "confirmed" || String(ctx.HOTELS.luzern.bookingStatus));
t("KoBi status 含「已訂房」", () =>
  /已訂房/.test(ctx.HOTELS.luzern.status) || ctx.HOTELS.luzern.status);
// V21.4b Accommodation Sync：Sans Souci 已確認訂房（原 pre-booking locks 更新為 confirmed reality）
t("Sans Souci bookingStatus = confirmed（V21.4b 已訂房）", () =>
  ctx.HOTELS.grindelwald.bookingStatus === "confirmed" || String(ctx.HOTELS.grindelwald.bookingStatus));
t("Sans Souci status 標示已訂房（confirmed）", () =>
  /已訂房|已完成訂房/.test(ctx.HOTELS.grindelwald.status) || ctx.HOTELS.grindelwald.status);
t("Sans Souci priceCHF = 2691.01（實際訂房價；未併城市稅、非 2847.01）", () =>
  ctx.HOTELS.grindelwald.priceCHF === 2691.01);
t("Sans Souci priceIsReferenceQuote = false", () =>
  ctx.HOTELS.grindelwald.priceIsReferenceQuote === false);
t("Sans Souci referenceQuoteNote 標明實際金額 2691.01 且作廢舊參考", () => {
  const n = ctx.HOTELS.grindelwald.referenceQuoteNote || "";
  return /2,?691\.01/.test(n) && /作廢|已不適用|下訂前參考/.test(n);
});
t("Sans Souci pendingItems 不再含「實際訂房狀態」且為 operational", () => {
  const items = ctx.HOTELS.grindelwald.pendingItems || [];
  return !items.some(x => /實際訂房狀態/.test(x)) && items.some(x => /key|鑰匙|紗窗|insect/.test(x));
});
t("Sans Souci 有 payment 結構（待付 2691 / 已付 0）", () => {
  const pay = ctx.HOTELS.grindelwald.payment || {};
  return pay.dueCHF === 2691 && pay.paidCHF === 0;
});
t("Sans Souci 有 cityTax 結構（CHF 156，獨立於住宿費）", () =>
  /156/.test(String((ctx.HOTELS.grindelwald.cityTax || {}).total)));
t("Sans Souci phone = +41 43 810 9126", () =>
  (ctx.HOTELS.grindelwald.phone || "").replace(/[^0-9]/g, "") === "41438109126");
t("KoBi phone = +41 79 235 6688", () =>
  (ctx.HOTELS.luzern.phone || "").replace(/[^0-9]/g, "") === "41792356688");
t("KoBi priceCHF = 2702.16（實際訂房原幣）且 NT$125000 標為預算基準", () =>
  ctx.HOTELS.luzern.priceCHF === 2702.16 && ctx.HOTELS.luzern.priceTWD === 125000 && /預算|規劃基準/.test(ctx.HOTELS.luzern.priceNote || ""));
t("KoBi 不再出現在「立即下訂」型 BOOKINGS", () => {
  const bad = ctx.BOOKINGS.filter(b => /KoBi/.test(b.task) && /立即下訂/.test(b.how || ""));
  return bad.length === 0 || JSON.stringify(bad);
});
t("KoBi BOOKINGS 已改為 post-booking checklist（非 🔴 必做訂房）", () => {
  const k = ctx.BOOKINGS.find(b => /KoBi/.test(b.task));
  return !!k && !/^訂 /.test(k.task) && /已完成訂房/.test(k.how);
});
t("Sans Souci BOOKINGS 標示已完成訂房（非待使用者確認）", () => {
  const b = ctx.BOOKINGS.find(b => /Sans Souci/.test(b.task));
  return !!b && /已完成訂房/.test(b.how) && !/待使用者確認/.test(b.how);
});

// ── STP ─────────────────────────────────────────────────
console.log("\n【STP】");
// V21.4g（A09）：15-day STP 為既定主方案；2027 僅更新售價／範圍／規則，不重開票券比較
t("STP = 既定主方案（V21.4g）", () => {
  const p = ctx.PENDING_2027.find(x => x.id === "stp_2027_price");
  return !!p && /既定主方案/.test(p.note);
});
t("STP PENDING 不再要求 2027 重新比較票券方案", () => {
  const p = ctx.PENDING_2027.find(x => x.id === "stp_2027_price");
  return !!p && /不重新進行票券方案比較/.test(p.note);
});
t("user-facing 無「STP 唯一方案」宣稱", () =>
  !/STP\s*(是|為)?\s*唯一方案/.test(allText));
t("user-facing 無「不再比較 Half Fare」", () =>
  !/不再比較\s*Half\s*Fare/.test(allText));

// ── ETIAS ───────────────────────────────────────────────
console.log("\n【ETIAS】");
t("TRAVEL_DOCUMENT_RULES.etias 有 ifApplicable2027（4 大 1 小）", () =>
  /4 大 1 小/.test(ctx.TRAVEL_DOCUMENT_RULES.etias.ifApplicable2027 || ""));
t("etias.feeRule 說明 4 成人付費、妞妞免申請費", () => {
  const f = ctx.TRAVEL_DOCUMENT_RULES.etias.feeRule || "";
  return /4 位成人/.test(f) && /免申請費/.test(f);
});
t("etias.childWarning 明確「免申請費 ≠ 不需申請」", () =>
  /免申請費\s*≠\s*不需申請/.test(ctx.TRAVEL_DOCUMENT_RULES.etias.childWarning || ""));
t("PACKING 妞妞 ETIAS 行明確仍須取得授權", () => {
  const doc = ctx.PACKING.find(c => /文件/.test(c.cat));
  return doc.items.some(i => /妞妞/.test(i) && /仍須取得|仍需依規定/.test(i));
});
t("BOOKINGS ETIAS 任務涵蓋全員", () => {
  const b = ctx.BOOKINGS.find(x => /ETIAS/.test(x.task));
  return !!b && /4 大 1 小/.test(b.how);
});
t("user-facing 無「妞妞不用 ETIAS」", () =>
  !/妞妞不用\s*ETIAS|妞妞免\s*ETIAS(?!\s*申請費)/.test(allText));
t("user-facing 無「只有 4 大申請 ETIAS」", () =>
  !/只有\s*4\s*(大|位成人)\s*(申請|需要)\s*ETIAS/.test(allText));

// ── Day 7 票價 ──────────────────────────────────────────
console.log("\n【Day 7 Männlichen】");
t("舊值 CHF 35-40 半價 = 0 hit", () =>
  !/CHF\s*35\s*[-–]\s*40/.test(dataSrc + appSrc));
t("現行參考 CHF 34 原價 / 約 CHF 17 半價存在", () => {
  const d7 = JSON.stringify(ctx.DAYS[6]);
  return /CHF\s*34/.test(d7) && /CHF\s*17/.test(d7);
});
t("Day 7 背巾為確定主方案、推車為選配", () => {
  const d7 = JSON.stringify(ctx.DAYS[6]);
  return /背巾為確定主方案/.test(d7) && /運動型推車僅在/.test(d7);
});

// ── Day 8 A/B ───────────────────────────────────────────
console.log("\n【Day 8 A/B】");
const d8plan = ctx.DAY_PLAN_CHOICES.day8_spb;
t("DAY_PLAN_CHOICES.day8_spb 存在", () => !!d8plan);
t("localStorage key 未變（planchoice_day8_spb_descent）", () =>
  d8plan.storageKey === "planchoice_day8_spb_descent" || d8plan.storageKey);
t("A = family_default tier", () => {
  const a = d8plan.options.find(o => o.key === "A");
  return a.tier === "family_default" || a.tier;
});
t("B = bonus tier", () => {
  const b = d8plan.options.find(o => o.key === "B");
  return b.tier === "bonus" || b.tier;
});
// ── V21.8b（C01）：Day 8 A 方案已同步 V21.4g；以下取代舊版 stale regression guard ──
t("A 為家庭版主方案：含 Skywalk／Playground／Naturkino", () => {
  const a = JSON.stringify(d8plan.options.find(o => o.key === "A"));
  return /Skywalk/.test(a) && /Alpine Playground/.test(a) && /Naturkino/.test(a);
});
t("A：Alpine Garden 為最後 Optional，非家庭主核心", () => {
  const a = d8plan.options.find(o => o.key === "A");
  return /Alpine Garden.{0,40}(放最後|Optional)/.test(JSON.stringify(a))
      && !/^🌸 Alpine Garden ＋ 短版/.test(a.activityTitle);
});
t("A：display time = 11:15–下山前，無 stale 11:15–12:45", () => {
  const a = d8plan.options.find(o => o.key === "A");
  return a.activityTime === "11:15–下山前" && !/11:15[-–]12:45/.test(JSON.stringify(a));
});
t("A：engine time 可被 parser 解析（不破壞 lifecycle）", () => {
  const a = d8plan.options.find(o => o.key === "A");
  return /^\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/.test(a.activityEngineTime || "");
});
t("A：無 12:30–12:45 硬性收尾", () => {
  const a = JSON.stringify(d8plan.options.find(o => o.key === "A"));
  return !/12:30[-–]12:45/.test(a);
});
t("A：SPB 下山班次標為現行參考／2027 待確認（不偽裝已確認）", () => {
  const a = JSON.stringify(d8plan.options.find(o => o.key === "A"));
  return /現行參考/.test(a) && /2027/.test(a);
});
// ── §9：Day 8 cross-SSoT consistency（DAYS ↔ DAY_PLAN_CHOICES）──
t("SSoT 一致：DAYS Day 8 與 plan A 皆含 Skywalk／Playground／Naturkino", () => {
  const day8 = JSON.stringify(ctx.DAYS.find(d => d.day === 8));
  const a = JSON.stringify(d8plan.options.find(o => o.key === "A"));
  return ["Skywalk", "Alpine Playground", "Naturkino"].every(k => day8.includes(k) && a.includes(k));
});
t("SSoT 一致：兩處 Alpine Garden 皆為最後 Optional", () => {
  const day8 = JSON.stringify(ctx.DAYS.find(d => d.day === 8));
  const a = JSON.stringify(d8plan.options.find(o => o.key === "A"));
  return /Alpine Garden.{0,40}(放最後|Optional)/.test(day8) && /Alpine Garden.{0,40}(放最後|Optional)/.test(a);
});
t("SSoT 一致：全檔 runtime 無 stale 11:15–12:45", () => {
  const all = JSON.stringify(ctx.DAYS) + JSON.stringify(ctx.DAY_PLAN_CHOICES);
  return !/11:15[-–]12:45/.test(all);
});
t("SSoT 一致：全檔 runtime 無「Alpine Garden ＋ 短版 Swiss Flower」主方案敘述", () => {
  const all = JSON.stringify(ctx.DAYS) + JSON.stringify(ctx.DAY_PLAN_CHOICES);
  return !/Alpine Garden ＋ 短版 Swiss Flower/.test(all);
});
// ══ V21.8c1 · Accommodation production guard（§29：檢查 runtime objects，不做全 source 字串零出現）══
t("HOTELS.grindelwald = Apartment Sans Souci W1 by Interhome", () =>
  ctx.HOTELS.grindelwald.name === "Apartment Sans Souci W1 by Interhome");
t("runtime accommodation objects 無 Atlanta / GRIWA legacy", () => {
  const runtime = JSON.stringify([ctx.HOTELS, ctx.BOOKINGS, ctx.DAYS, ctx.QUICK_NUMBERS, ctx.PENDING_2027]);
  return !/Atlanta|GRIWA|Grundstrasse 19|3,?274\.8/i.test(runtime);
});
t("Grindelwald 住宿核心事實維持 V21.4g（6 晚／15:00–17:00／10:00 前）", () => {
  const g = ctx.HOTELS.grindelwald;
  return g.nights === 6 && /15:00/.test(g.checkInWindow || "") && /10:00/.test(g.checkOutBy || "");
});
t("Luzern 住宿未受影響（KoBi）", () => /KoBi/.test(ctx.HOTELS.luzern.name));
t("Sans Souci Pending wording 仍在（門牌／key 未被誤標 confirmed）", () => {
  const items = ctx.HOTELS.grindelwald.pendingItems || [];
  return items.some(x => /門牌|address/i.test(x)) && items.some(x => /key|鑰匙/i.test(x));
});
t("build fingerprint 存在且與 webAppVersion 一致", () =>
  typeof ctx.TRIP_META.build === "string" && ctx.TRIP_META.build.indexOf(ctx.TRIP_META.webAppVersion) === 0);

// ══ V21.8c Final Residual guards（R01 / R02）══
// §4：必須同時檢查 DAYS 與 DAY_PLAN_CHOICES，避免單邊 SSoT 更新
t("R01：DAYS Day 8 無 stale 12:30–12:45", () =>
  !/12:30[–-]12:45/.test(JSON.stringify(ctx.DAYS.find(d => d.day === 8))));
t("R01：DAY_PLAN_CHOICES 無 stale 12:30–12:45", () =>
  !/12:30[–-]12:45/.test(JSON.stringify(ctx.DAY_PLAN_CHOICES)));
t("R01：Day 8 保留彈性午餐 12:30–13:00（DAYS 或 plan option）", () => {
  const both = JSON.stringify(ctx.DAYS.find(d => d.day === 8)) + JSON.stringify(ctx.DAY_PLAN_CHOICES);
  return /12:30[–-]13:00/.test(both);
});
t("R01：Day 8 午餐敘述為彈性、非硬性截止", () => {
  const both = JSON.stringify(ctx.DAYS.find(d => d.day === 8)) + JSON.stringify(ctx.DAY_PLAN_CHOICES);
  return /非硬性截止/.test(both) && /彈性/.test(both);
});
t("R02：Day 8 無「妞妞回木屋午睡」hard-coded wording", () =>
  !/妞妞回木屋午睡/.test(JSON.stringify(ctx.DAYS.find(d => d.day === 8))));
t("R02：Day 8 無「一定／固定回去午睡」式敘述", () => {
  const d8 = JSON.stringify(ctx.DAYS.find(d => d.day === 8));
  return !/(一定|固定).{0,6}午睡/.test(d8);
});
t("R02：Day 8 午睡改為依當日狀態彈性決定", () => {
  const d8 = JSON.stringify(ctx.DAYS.find(d => d.day === 8));
  return /是否午睡/.test(d8) && /(依當日|彈性決定)/.test(d8);
});
t("R02：Day 8 town block 以「回公寓休息」為主安排", () =>
  /回公寓休息/.test(JSON.stringify(ctx.DAYS.find(d => d.day === 8))));

t("SSoT 一致：DAYS Day 8 顯示 11:15–下山前", () => {
  const day8 = JSON.stringify(ctx.DAYS.find(d => d.day === 8));
  return /11:15–下山前/.test(day8);
});
t("A 推車非無障礙保證", () => {
  const a = JSON.stringify(d8plan.options.find(o => o.key === "A"));
  return /非無障礙|不等於無障礙/.test(a);
});
t("B 為正式 Panorama Hike 約 6 km", () => {
  const b = JSON.stringify(d8plan.options.find(o => o.key === "B"));
  return /Panorama Hike/.test(b) && /6\s*(km|公里)/.test(b);
});
t("B 理想條件約 2.5–3 小時，幼兒同行可能更久", () => {
  const b = JSON.stringify(d8plan.options.find(o => o.key === "B"));
  return /2\.5[～~-]3\s*小時/.test(b) && /可能更久/.test(b);
});
t("B 背巾限定、推車不得視為交通工具", () => {
  const b = d8plan.options.find(o => o.key === "B");
  return /限定主策略/.test(b.carrierPolicy) && /不得視為行程交通工具/.test(b.strollerPolicy);
});
t("B 午餐改野餐（A/B 午餐邏輯不衝突）", () => {
  const a = d8plan.options.find(o => o.key === "A");
  const b = d8plan.options.find(o => o.key === "B");
  return /Restaurant|餐廳/.test(a.lunchTitle) && /野餐/.test(b.lunchTitle);
});
t("decisionHint 明示「不確定時選 A」", () =>
  /不確定時選\s*A/.test(d8plan.decisionHint || ""));
t("Day 8 timeline 使用 planRef 涵蓋 activity/lunch/descent/town", () => {
  const roles = ctx.DAYS[7].tl.filter(x => x.planRef === "day8_spb").map(x => x.planRole);
  return ["activity","lunch","descent","town"].every(r => roles.includes(r)) || roles.join(",");
});
t("app.js 支援 activity / lunch planRole 展開", () =>
  /planRole === "activity"/.test(appSrc) && /planRole === "lunch"/.test(appSrc));

// ── Day 10 BRB ──────────────────────────────────────────
console.log("\n【Day 10 BRB】");
t("BRB_DAY_PLAN.status = simulated_2026（不得標為 2027 confirmed）", () =>
  ctx.BRB_DAY_PLAN.status === "simulated_2026" || ctx.BRB_DAY_PLAN.status);
t("BRB scheduleFramework = relative（2027 前不鎖死班次）", () =>
  ctx.BRB_DAY_PLAN.scheduleFramework === "relative" || String(ctx.BRB_DAY_PLAN.scheduleFramework));
t("BRB frameworkNote 說明 2027 尚未決定實際班次", () =>
  /尚未|待公布|非 2027 已確認/.test(ctx.BRB_DAY_PLAN.frameworkNote || ""));
t("BRB 保留 30-45 分鐘 buffer 參數", () =>
  ctx.BRB_DAY_PLAN.minBufferMinutes === 30 && ctx.BRB_DAY_PLAN.recommendedBufferMinutes === 45);
t("BRB reservationPolicy.kind = recommended（非假裝強制）", () =>
  ctx.BRB_DAY_PLAN.reservationPolicy.kind === "recommended");
t("BRB 票務改為「依所購產品辦理」，不宣稱一定換 STP 實體票", () =>
  /依所購買的票券產品而定/.test(ctx.BRB_DAY_PLAN.reservationPolicy.ticketingNote || ""));
t("BRB 有 boat → BRB connection fallback", () => {
  const f = ctx.BRB_DAY_PLAN.connectionFallback;
  return !!f && /取消湖船/.test(JSON.stringify(f.actions));
});
t("fallback 優先保留 BRB", () =>
  /優先保留 BRB/.test(JSON.stringify(ctx.BRB_DAY_PLAN.connectionFallback.actions)));
t("BRB 停駛備援 A/B 存在", () =>
  !!ctx.BRB_DAY_PLAN.brbClosedFallback &&
  !!ctx.BRB_DAY_PLAN.brbClosedFallback.A && !!ctx.BRB_DAY_PLAN.brbClosedFallback.B);
t("山頂 activity 不早於抵頂（由 SSoT 推導）", () => {
  const toMin = hm => { const [h,m] = hm.split(":").map(Number); return h*60+m; };
  const p = ctx.BRB_DAY_PLAN;
  const summitArrive = toMin(p.chosenUpDeparture) + p.ascentMinutes;
  const d10 = ctx.DAYS[9];
  const summit = d10.tl.find(x => /Rothorn Kulm 山頂/.test(x.title));
  const m = summit.time.match(/^(\d{1,2}):(\d{2})/);
  return (+m[1]*60 + +m[2]) >= summitArrive || `山頂 ${summit.time} 早於抵頂`;
});
t("Barry's 不早於合理返程（BOB 抵達之後）", () => {
  const d10 = ctx.DAYS[9];
  const bob = d10.tl.find(x => /BOB 回 Grindelwald/.test(x.title));
  const barry = d10.tl.find(x => /Barry/.test(x.title));
  const end = bob.time.match(/[–-](\d{1,2}):(\d{2})/);
  const start = barry.time.match(/^(\d{1,2}):(\d{2})/);
  return (+start[1]*60 + +start[2]) >= (+end[1]*60 + +end[2]) || `${barry.time} 早於 ${bob.time}`;
});
t("Day 10 湖畔為簡單補給，非第二頓正式午餐", () => {
  const d10 = JSON.stringify(ctx.DAYS[9]);
  return /湖畔簡單補給/.test(d10) && !/湖畔.{0,6}正式午餐/.test(d10);
});
t("Barry's 訂位為 19:00–19:30 建議", () => {
  const b = ctx.DAYS[9].tl.find(x => /Barry/.test(x.title));
  return /19:00[–-]19:30/.test(b.title) || b.title;
});

// ── Flight ──────────────────────────────────────────────
console.log("\n【Flight】");
t("FLIGHT_ITINERARY.status = current_reference（不得為 booked）", () =>
  ctx.FLIGHT_ITINERARY.status === "current_reference" || ctx.FLIGHT_ITINERARY.status);
t("四航段 leg status 均為 current_reference", () => {
  const legs = [
    ctx.FLIGHT_ITINERARY.outbound.leg1, ctx.FLIGHT_ITINERARY.outbound.leg2,
    ctx.FLIGHT_ITINERARY.return.leg1,   ctx.FLIGHT_ITINERARY.return.leg2
  ];
  return legs.every(l => l.status === "current_reference");
});
t("回程主航段為 EK88 + EK386（非 EK366）", () =>
  ctx.FLIGHT_ITINERARY.return.leg1.flightNo === "EK88" &&
  ctx.FLIGHT_ITINERARY.return.leg2.flightNo === "EK386");
t("user-facing 無「22:00 抵桃園」", () =>
  !/22:00\s*抵桃園/.test(dataSrc + appSrc));
t("T-90 / T-60 由 flight SSoT 推導（非 hardcode 常數字串）", () =>
  /subtractMinutesFromFlightDeparture/.test(dataSrc) &&
  /ZRH_T90_HM/.test(dataSrc) && /ZRH_T60_HM/.test(dataSrc));

// ── Regression guard（V21.6 不得回退）────────────────────
console.log("\n【Regression Guard · V21.6 架構】");
t("parseTimelineTime / findCurrentAndNext / classifyDayState 全在", () =>
  /function parseTimelineTime/.test(appSrc) &&
  /function findCurrentAndNext/.test(appSrc) &&
  /function classifyDayState/.test(appSrc));
t("七狀態語意全在", () =>
  ["in_range","at_milestone","before_start","gap","after_all","schedule_unknown","plan_unselected"]
    .every(x => appSrc.includes(x)));
t("TRAVEL_DOCUMENT_RULES 保留 legalMinimum / conservativeRecommendation", () =>
  !!ctx.TRAVEL_DOCUMENT_RULES.passport.legalMinimum &&
  !!ctx.TRAVEL_DOCUMENT_RULES.passport.conservativeRecommendation);
t("護照 6 個月未被寫成法定最低", () =>
  /3 個月/.test(ctx.TRAVEL_DOCUMENT_RULES.passport.legalMinimum) &&
  /本團保守/.test(ctx.TRAVEL_DOCUMENT_RULES.passport.conservativeRecommendation));
t("SW all-or-nothing precache 保留", () =>
  /cache\.addAll\(ASSETS\)/.test(swSrc) && /throw err/.test(swSrc) &&
  /console\.error\("\[SW\] precache failed"/.test(swSrc));
t("SW activate 清舊 cache + clients.claim()", () =>
  /caches\.delete/.test(swSrc) && /clients\.claim\(\)/.test(swSrc));
t("SBB 分站處理保留（不套用單一 counter hours）", () =>
  /依各站公告為準/.test(appSrc) || /分站頁確認/.test(dataSrc));
t("Status Badge helper 保留", () =>
  /function renderStatusBadge/.test(appSrc));
t("Day 6 Mürren / Allmendhubel 主線未回退", () => {
  const d6 = JSON.stringify(ctx.DAYS[5]);
  return /Mürren/.test(d6) && /Allmendhubel/.test(d6);
});
t("Day 6 保守化：不再宣稱完全平坦 / 固定分鐘走完全村", () => {
  const d6 = JSON.stringify(ctx.DAYS[5]);
  return !/完全平坦/.test(d6) && !/15 分鐘走完/.test(d6);
});
// V21.4g（A03/M08）：Kulm→Kaltbad Default＝齒軌火車，步行降為 Optional
t("Day 2 Rigi：齒軌火車為 Default、步行為 Optional", () => {
  const d2 = JSON.stringify(ctx.DAYS[1]);
  return /Default/.test(d2) && /Optional/.test(d2) && !/走碎石坡/.test(d2) && !/適合推推車散步/.test(d2);
});
t("Day 2 Rigi：不再把 2.5km 下坡健行當 Must-do 主行程", () => {
  const d2 = JSON.stringify(ctx.DAYS[1]);
  return !/下山第一段：下坡健行/.test(d2);
});
t("Day 2：獅子紀念碑已移出 Day 2 回程（正式在 Day 3）", () => {
  const d2 = JSON.stringify(ctx.DAYS[1].tl);
  const d3 = JSON.stringify(ctx.DAYS[2].tl);
  return !/title:"獅子紀念碑/.test(d2) && /Kapellbrücke|卡貝爾木橋/.test(d2) && /獅子紀念碑/.test(d3);
});
t("Day 4 Pilatus：交通票券 ≠ seat reservation", () => {
  const p = ctx.PENDING_2027.find(x => x.id === "pilatus_2027");
  return /交通票券與座位預約應分開確認/.test(p.note);
});
t("Day 4 B 計畫：反向不得假設預約自動適用", () => {
  const p = ctx.PENDING_2027.find(x => x.id === "pilatus_2027");
  return /不會自動適用於下山方向/.test(p.note);
});
t("LIE：5 個座位規則（非只訂 4 個）", () => {
  const p = ctx.PENDING_2027.find(x => x.id === "lie_seat");
  return /處理 5 個座位/.test(p.note);
});
t("WEATHER：三處 webcam 同步比對規則", () => {
  const w = JSON.stringify(ctx.WEATHER_DECISION);
  return /Männlichen/.test(w) && /Schynige Platte/.test(w) && /First/.test(w) && /同步比對/.test(w);
});
t("WEATHER：Day 10 原則鎖 BRB 未回退", () =>
  /Day 10 原則鎖定 BRB/.test(JSON.stringify(ctx.WEATHER_DECISION)));


// ── V21.7a Hotfix 專項 ──────────────────────────────────
console.log("\n【V21.7a · Plan Activation Boundary】");
t("day8_spb 有 planActivation metadata", () =>
  !!ctx.DAY_PLAN_CHOICES.day8_spb.planActivation);
t("planActivation.mode = earliest_plan_block_start", () =>
  ctx.DAY_PLAN_CHOICES.day8_spb.planActivation.mode === "earliest_plan_block_start" ||
  ctx.DAY_PLAN_CHOICES.day8_spb.planActivation.mode);
t("planActivation.commonScheduleBeforeActivation = true", () =>
  ctx.DAY_PLAN_CHOICES.day8_spb.planActivation.commonScheduleBeforeActivation === true);
t("planActivation 有 decisionPrompt", () =>
  typeof ctx.DAY_PLAN_CHOICES.day8_spb.planActivation.decisionPrompt === "string");
t("app.js 有 planActivationStartMin（非 hardcode 時間判斷）", () =>
  /function planActivationStartMin/.test(appSrc));
t("app.js 無 Day 8 專用 hardcode 時間判斷", () =>
  !/nowMin\s*<\s*675|now\s*<\s*["\']11:15/.test(appSrc));

console.log("\n【V21.7a · BRB SSoT 一致性】");
t("BRB_SCHEDULE.simulation2026 由 BRB_DERIVED 產生", () =>
  ctx.BRB_SCHEDULE.simulation2026 === ctx.BRB_DERIVED.simulationText ||
  "simulation2026 與 BRB_DERIVED.simulationText 不同");
t("simulated departure 一致（schedule / day plan / derived）", () => {
  const dep = ctx.BRB_DAY_PLAN.chosenUpDeparture;
  return ctx.BRB_SCHEDULE.departures.includes(dep) &&
         ctx.BRB_SCHEDULE.simulation2026.includes(dep) || `departure ${dep} 不一致`;
});
t("simulated arrival 一致（derived / schedule card / Day 10 timeline）", () => {
  const arr = ctx.BRB_DERIVED.summitArrive;
  const summit = ctx.DAYS[9].tl.find(x => /Rothorn Kulm 山頂/.test(x.title));
  return ctx.BRB_SCHEDULE.simulation2026.includes(arr) &&
         summit.time.startsWith(arr) || `arrival ${arr} 不一致（timeline=${summit.time}）`;
});
t("user-facing 無 13:57（僅允許註解）", () => {
  const lines = (dataSrc + appSrc).split("\n")
    .filter(l => l.includes("13:57") && !l.trim().startsWith("//"));
  return lines.length === 0 || lines.join(" | ").slice(0, 120);
});
t("Day 10 上山段終點 = derived summitArrive", () => {
  const up = ctx.DAYS[9].tl.find(x => /蒸汽齒軌上山/.test(x.title));
  return up.time.includes(ctx.BRB_DERIVED.summitArrive) || up.time;
});

console.log("\n【V21.7a · BRB 票務語意】");
t("無「所有人必須換票」型絕對敘述", () =>
  !/(所有人|每個人|全員).{0,8}(必須|一定要).{0,6}換票/.test(dataSrc + appSrc));
t("無「建議發車前 N 分鐘完成換票」硬性指令", () =>
  !/建議發車前\s*\d+\s*分鐘完成換票/.test(dataSrc + appSrc));
t("所有「換票」皆為條件句（依產品／若需要）", () => {
  const lines = (dataSrc + appSrc).split("\n").filter(l => l.includes("換票") && !l.trim().startsWith("//"));
  const bad = lines.filter(l => !/(依|若|是否|視).{0,30}換票|換票.{0,30}(依|為準|而定)/.test(l));
  return bad.length === 0 || bad.join(" | ").slice(0, 140);
});
t("Day 10 標題為「票務／進站手續」非「換票」", () => {
  const blk = ctx.DAYS[9].tl.find(x => /BRB/.test(x.title) && /上車/.test(x.title));
  return /票務／進站手續/.test(blk.title) || blk.title;
});
t("turnstileNote 說明「開放通行 ≠ 必須此時通過」", () =>
  /不等於|不是/.test(ctx.BRB_DAY_PLAN.reservationPolicy.turnstileNote || ""));
t("Seat Guarantee 維持 recommended（未改 mandatory）", () =>
  ctx.BRB_DAY_PLAN.reservationPolicy.kind === "recommended");

console.log("\n【V21.7a · Day 8 A/B 交叉污染】");
t("A option 不含 Daube", () =>
  !/Daube/.test(JSON.stringify(ctx.DAY_PLAN_CHOICES.day8_spb.options.find(o => o.key === "A"))));
t("Day 8 共用 block（無 planRef）不含 Daube", () =>
  !/Daube/.test(JSON.stringify(ctx.DAYS[7].tl.filter(x => !x.planRef))));
t("Daube 若存在，僅在 B option", () => {
  const B = JSON.stringify(ctx.DAY_PLAN_CHOICES.day8_spb.options.find(o => o.key === "B"));
  const elsewhere = (dataSrc.match(/Daube/g) || []).length;
  const inB = (B.match(/Daube/g) || []).length;
  return elsewhere === 0 || inB > 0;
});
t("Day 8 無「遊客密度低 / 平日人少」推論", () =>
  !/遊客密度低|平日人少|平日幾乎/.test(JSON.stringify(ctx.DAYS[7])));
t("Day 8 人潮描述已保守化", () =>
  /實際人潮依天氣、團客、假期與當日營運狀況而定/.test(JSON.stringify(ctx.DAYS[7])));
t("SPB 蒸汽班無「4-6 場 / 平日幾乎不會」推論", () => {
  const d8 = JSON.stringify(ctx.DAYS[7]);
  return !/4\s*[-–]\s*6\s*場/.test(d8) && !/平日幾乎/.test(d8);
});
t("SPB 蒸汽班採統一保守敘述", () =>
  /蒸汽特別班僅於特定日期運行，本行程不預設搭乘/.test(JSON.stringify(ctx.DAYS[7])));

console.log("\n【V21.7a · Day 4 時間語意】");
t("Day 4 齒軌段標題不再宣稱純車程", () => {
  const blk = ctx.DAYS[3].tl.find(x => /齒軌/.test(x.title) && /11:10/.test(x.time));
  return !/車程約 30 分鐘/.test(blk.title) || blk.title;
});
t("Day 4 齒軌段明示 11:10–11:50 為含轉場緩衝", () => {
  const blk = ctx.DAYS[3].tl.find(x => /11:10/.test(x.time));
  return /不是純搭車時間/.test(JSON.stringify(blk.steps));
});
t("Day 4 純乘車 30 分鐘另行標示且標 PENDING", () => {
  const blk = ctx.DAYS[3].tl.find(x => /11:10/.test(x.time));
  const j = JSON.stringify(blk);
  return /純齒軌乘車時間/.test(j) && /PENDING/.test(j);
});
t("Day 4 現行模擬時間未被寫成 2027 confirmed", () => {
  const blk = ctx.DAYS[3].tl.find(x => /11:10/.test(x.time));
  return /2026 現行班次模擬，非 2027 已確認時刻/.test(JSON.stringify(blk.defense));
});

console.log("\n【V21.7a · 版本（歷史 regression guard）】");
t("TRIP_META.version 已前進、非停留 V21.7a", () =>
  ctx.TRIP_META.version !== "V21.7a Web · 基於 V21.4a 行程資料" || ctx.TRIP_META.version);
t("CACHE_NAME 已離開 v21-7a", () =>
  !swSrc.includes('"swiss-trip-v21-7a-2027"'));
t("無舊 CACHE swiss-trip-v21-7-2027 / -7a", () =>
  !/swiss-trip-v21-7-2027|swiss-trip-v21-7a-2027/.test(swSrc + dataSrc + appSrc));
t("PACKING 電話由 CONSULATE_CONTACT 產生（無獨立 hardcode）", () => {
  const doc = ctx.PACKING.find(c => /文件/.test(c.cat));
  const line = doc.items.find(i => /緊急聯絡資訊/.test(i));
  return line.includes(ctx.CONSULATE_CONTACT.emergency) &&
         !/"緊急聯絡資訊已存手機＋紙本（駐瑞士代表處急難手機 \+41/.test(dataSrc);
});


console.log("\n【V21.7b · Plan Deactivation Boundary】");
t("app.js 有 planActivationEndMin", () => /function planActivationEndMin/.test(appSrc));
t("app.js 有 planLifecyclePhase（三階段）", () => /function planLifecyclePhase/.test(appSrc));
t("app.js 有 planRoleTimeKeys（共用時間欄位鍵）", () => /function planRoleTimeKeys/.test(appSrc));
t("三階段語意齊備", () =>
  ["before_activation", "active_window", "after_deactivation"].every(x => appSrc.includes(x)));
t("app.js 無 Day 8 專用 hardcode 邊界（675 / 1110 分鐘）", () =>
  !/(nowMin|now)\s*[<>=]{1,2}\s*(675|1110)/.test(appSrc));
t("app.js 無 hardcode 18:30 邊界字串", () =>
  !/["\']18:30["\']/.test(appSrc.replace(/\/\/.*$/gm, "")));
t("Deactivation 由 option SSoT 推導（activityTime/lunchTime/descentTime/townTime）", () => {
  const keysInFn = appSrc.match(/function planRoleTimeKeys\([\s\S]*?\n}/)[0];
  return ["activityTime","lunchTime","descentTime","townTime"].every(k => keysInFn.includes(k));
});
t("findCurrentAndNext 依 phase 而非單一 boundary 判定", () =>
  /planLifecyclePhase\(def, nowMin\)/.test(appSrc));

console.log("\n【V21.7b · 餐廳訂位文案】");
t("RESTAURANTS 無「人少不需訂位」", () =>
  !ctx.RESTAURANTS.some(r => /人少/.test(r.book || "")));
t("RESTAURANTS 無任何「不需訂位」絕對斷言", () =>
  !ctx.RESTAURANTS.some(r => /^不需訂位$/.test((r.book || "").trim())));
t("Schynige Platte 餐廳改為保守敘述", () => {
  const r = ctx.RESTAURANTS.find(x => /Schynige/.test(x.name));
  return /2027 出發前確認營運與是否建議訂位/.test(r.book) || r.book;
});
t("Pilatus Kulm 餐廳改為保守敘述", () => {
  const r = ctx.RESTAURANTS.find(x => /Pilatus Kulm/.test(x.name));
  return /2027 出發前確認營運與是否建議訂位/.test(r.book) || r.book;
});
t("Schynige Platte 餐廳標為 A 家庭預設方案午餐", () => {
  const r = ctx.RESTAURANTS.find(x => /Schynige/.test(x.name));
  return /A 家庭預設方案/.test(r.plan) || r.plan;
});

console.log("\n【V21.7b · SSoT residual】");
t("T-20 登機門關閉由 ZRH_T20_HM 產生", () => {
  const key = Object.keys(ctx.EMIRATES_RULES).find(k => ctx.EMIRATES_RULES[k] && ctx.EMIRATES_RULES[k].points);
  const p = ctx.EMIRATES_RULES[key].points.find(x => /T-20/.test(x.label));
  return p.value === ctx.ZRH_T20_HM && !/\{ label:"T-20｜登機門關閉", value:"15:10" \}/.test(dataSrc);
});
t("全站無「人少」文案", () => !/人少/.test(dataSrc + appSrc));
t("全站無「不需訂位」文案", () => !/不需訂位/.test(dataSrc + appSrc));

console.log("\n【V21.7b · 版本（歷史 regression guard）】");
t("TRIP_META.version 已前進、非停留 V21.7b", () =>
  ctx.TRIP_META.version !== "V21.7b Web · 基於 V21.4a 行程資料" || ctx.TRIP_META.version);
t("CACHE_NAME 已離開 v21-7b（現為 v21-7d-final）", () =>
  !swSrc.includes('"swiss-trip-v21-7b-2027"') && /const\s+CACHE_NAME\s*=\s*"swiss-trip-v21-8c1-v21-4g-dark-mode-seal-2027"\s*;/.test(swSrc));

console.log("\n【V21.7c · 版本（歷史 regression guard）】");
t("TRIP_META.version 已前進、非停留 V21.7c", () =>
  ctx.TRIP_META.version !== "V21.7c Web · 基於 V21.4a 行程資料" || ctx.TRIP_META.version);
t("CACHE_NAME 已離開 v21-7c（現為 v21-7d-final）", () =>
  !swSrc.includes('"swiss-trip-v21-7c-2027"') && /const\s+CACHE_NAME\s*=\s*"swiss-trip-v21-8c1-v21-4g-dark-mode-seal-2027"\s*;/.test(swSrc));
t("無舊 CACHE swiss-trip-v21-7a / -7b / -7c-2027（current 僅 v21-7d-final）", () =>
  !/swiss-trip-v21-7a-2027|swiss-trip-v21-7b-2027|swiss-trip-v21-7c-2027/.test(swSrc + dataSrc + appSrc));

// ══════════════════════════════════════════════════════════
// V21.7c · Storage Validation Hotfix（維持中 · static 靜態守門；V21.7d 未回退）
// 行為面由 scenario_tests_plan_choice_storage.js 覆蓋；此處守 app.js 結構不回退。
// ══════════════════════════════════════════════════════════
console.log("\n【V21.7c · Storage Validation Hotfix（維持中）】");
t("app.js 有 resolveValidPlanChoice（generic 驗證器）", () =>
  /function resolveValidPlanChoice/.test(appSrc));
t("app.js 有 normalizePlanChoice（planKey 便利版）", () =>
  /function normalizePlanChoice/.test(appSrc));
t("resolveValidPlanChoice 動態比對 options（不 hardcode A／B）", () => {
  const fn = appSrc.match(/function resolveValidPlanChoice\([\s\S]*?\n}/)[0];
  return /planDef\.options\.some/.test(fn) && !/===\s*["']A["']/.test(fn) && !/===\s*["']B["']/.test(fn);
});
t("getPlanChoice 讀取後以 resolveValidPlanChoice 驗證", () => {
  const fn = appSrc.match(/function getPlanChoice\([\s\S]*?\n}/)[0];
  return /resolveValidPlanChoice/.test(fn);
});
t("getPlanChoice 無效值只 removeItem 自己的 key（不 clear）", () => {
  const fn = appSrc.match(/function getPlanChoice\([\s\S]*?\n}/)[0];
  return /removeItem/.test(fn) && !/localStorage\.clear/.test(fn);
});
t("setPlanChoice 寫入前以 resolveValidPlanChoice 驗證", () => {
  const fn = appSrc.match(/function setPlanChoice\([\s\S]*?\n}/)[0];
  return /resolveValidPlanChoice/.test(fn);
});
t("allPlanChoices 透過 getPlanChoice 收集（自動驗證＋清理）", () => {
  const fn = appSrc.match(/function allPlanChoices\([\s\S]*?\n}/)[0];
  return /getPlanChoice/.test(fn);
});
t("findCurrentAndNext 以 resolveValidPlanChoice 防禦直接傳入的 opts.planChoices", () => {
  const fn = appSrc.match(/function findCurrentAndNext\([\s\S]*?\n}/)[0];
  return /resolveValidPlanChoice/.test(fn);
});
t("app.js 全站無 localStorage.clear()（禁止清除所有資料）", () =>
  !/localStorage\.clear\s*\(/.test(
    appSrc.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")));
t("既有 storageKey planchoice_day8_spb_descent 未變更", () =>
  dataSrc.includes('"planchoice_day8_spb_descent"'));
t("swiss_checks storage key 未被牽動", () =>
  appSrc.includes('"swiss_checks"'));

// ══════════════════════════════════════════════════════════
// V21.7d · Final Storage Integrity Seal（本輪新增 · static 靜態守門）
// 行為面由 scenario_tests_storage_integrity.js 覆蓋；此處守 app.js 結構不回退。
// ══════════════════════════════════════════════════════════
console.log("\n【V21.7d · Final Storage Integrity Seal】");
t("resolveValidPlanChoice 為 strict primitive-string（typeof value !== 'string'）", () => {
  const fn = appSrc.match(/function resolveValidPlanChoice\([\s\S]*?\n}/)[0];
  return /typeof\s+value\s*!==\s*["']string["']/.test(fn);
});
t("resolveValidPlanChoice 不再使用 String(value) coercion", () => {
  const fn = appSrc.match(/function resolveValidPlanChoice\([\s\S]*?\n}/)[0];
  return !/String\s*\(\s*value\s*\)/.test(fn);
});
t("resolveValidPlanChoice 要求 option.key 亦為 string", () => {
  const fn = appSrc.match(/function resolveValidPlanChoice\([\s\S]*?\n}/)[0];
  return /typeof\s+o\.key\s*===\s*["']string["']/.test(fn);
});
t("getPlanChoice 只把 null/undefined 當真正不存在（空字串走清理，不再 raw === \"\" early-return）", () => {
  const fn = appSrc.match(/function getPlanChoice\([\s\S]*?\n}/)[0];
  return /raw === null \|\| raw === undefined\)\s*return null/.test(fn) && !/raw === ""/.test(fn);
});
t("app.js 有 loadCheckedItems（安全 checklist loader）", () =>
  /function loadCheckedItems/.test(appSrc));
t("State.checkedItems 改用 loadCheckedItems()（非未保護 JSON.parse）", () => {
  const code = appSrc.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""); // 去註解，避免匹配到說明舊寫法的註解
  return /checkedItems:\s*loadCheckedItems\(\)/.test(code) && !/checkedItems:\s*JSON\.parse/.test(code);
});
t("loadCheckedItems 安全 parse + 結構驗證（try/parse/Array.isArray）", () => {
  const fn = appSrc.match(/function loadCheckedItems\([\s\S]*?\n}/)[0];
  return /JSON\.parse/.test(fn) && /Array\.isArray/.test(fn) && /try/.test(fn);
});
t("loadCheckedItems 無效資料只移除 swiss_checks（不 clear）", () => {
  const fn = appSrc.match(/function loadCheckedItems\([\s\S]*?\n}/)[0];
  return /removeChecksKeySafe|removeItem/.test(fn) && !/localStorage\.clear/.test(fn);
});
t("saveChecks 具 try/catch 保底（回傳 false 不拋例外）", () => {
  const fn = appSrc.match(/function saveChecks\([\s\S]*?\n}/)[0];
  return /try/.test(fn) && /catch/.test(fn) && /return false/.test(fn);
});
t("toggleCheck 對異常 State 先恢復（ensureCheckedItems）", () => {
  const fn = appSrc.match(/function toggleCheck\([\s\S]*?\n}/)[0];
  return /ensureCheckedItems/.test(fn);
});
t("isChecked 具防禦（異常 State 回 false，不 throw）", () => {
  const fn = appSrc.match(/function isChecked\([\s\S]*?\n}/)[0];
  return /Array\.isArray/.test(fn) && /return false/.test(fn);
});

// ══════════════════════════════════════════════════════════
// V21.7d · In-Place Final Seal Correction（本輪新增 · static 靜態守門）
// 全站 storage consumer 安全化；行為面由 scenario_tests_storage_consumers.js 覆蓋。
// ══════════════════════════════════════════════════════════
console.log("\n【V21.7d · In-Place Final Seal Correction（全站 storage 安全化）】");
// 共用 safe storage layer
t("app.js 有共用 safeStorageGet/Set/Remove", () =>
  /function safeStorageGet/.test(appSrc) && /function safeStorageSet/.test(appSrc) && /function safeStorageRemove/.test(appSrc));
t("safeStorageGet/Set/Remove 皆具 try/catch", () =>
  ["safeStorageGet", "safeStorageSet", "safeStorageRemove"].every(n => {
    const fn = appSrc.match(new RegExp("function " + n + "\\([\\s\\S]*?\\n}"))[0];
    return /try/.test(fn) && /catch/.test(fn);
  }));
// enum helpers 存在
t("app.js 有 bookings filter enum helpers", () =>
  /function normalizeBookingsFilter/.test(appSrc) && /function loadBookingsFilter/.test(appSrc) && /function saveBookingsFilter/.test(appSrc));
t("app.js 有 pending state enum helpers", () =>
  /function normalizePendingState/.test(appSrc) && /function getPendingState/.test(appSrc) && /function setPendingState/.test(appSrc));
t("app.js 有 luggage receipt helpers", () =>
  /function getLuggageReceipt/.test(appSrc) && /function setLuggageReceipt/.test(appSrc));
// enum 合法集合
t("BOOKINGS_FILTERS enum = [all, open, must, important, suggest, track]", () =>
  /BOOKINGS_FILTERS\s*=\s*\[\s*"all",\s*"open",\s*"must",\s*"important",\s*"suggest",\s*"track"\s*\]/.test(appSrc));
t("PENDING_STATES enum = [unconfirmed, confirmed, done]", () =>
  /PENDING_STATES\s*=\s*\[\s*"unconfirmed",\s*"confirmed",\s*"done"\s*\]/.test(appSrc));
// render 函式改用 safe helper（不再 bare localStorage.getItem）
t("renderBookings 改用 loadBookingsFilter（非 bare localStorage.getItem）", () => {
  const fn = appSrc.match(/function renderBookings\([\s\S]*?\n}/)[0];
  return /loadBookingsFilter\(\)/.test(fn) && !/localStorage\.getItem/.test(fn);
});
t("renderPending 改用 getPendingState（非 bare localStorage.getItem）", () => {
  const fn = appSrc.match(/function renderPending\([\s\S]*?\n}/)[0];
  return /getPendingState/.test(fn) && !/localStorage\.getItem/.test(fn);
});
t("renderLuggage 改用 getLuggageReceipt（非 bare localStorage.getItem）", () => {
  const fn = appSrc.match(/function renderLuggage\([\s\S]*?\n}/)[0];
  return /getLuggageReceipt/.test(fn) && !/localStorage\.getItem/.test(fn);
});
// 事件 handler 改用 safe helper（attachHandlers 內不再 bare localStorage.setItem）
t("attachHandlers 內不再有 bare localStorage.setItem（改用 save helpers）", () => {
  const fn = appSrc.match(/function attachHandlers\([\s\S]*?\n}/)[0];
  return /saveBookingsFilter/.test(fn) && /setPendingState/.test(fn) && /setLuggageReceipt/.test(fn) && !/localStorage\.setItem/.test(fn);
});
// 正式 runtime 不再有未受保護的 localStorage（所有 bare 呼叫皆在具 try/catch 的函式內）
t("正式 runtime 無未受保護 localStorage（bare 呼叫僅存在於具 try/catch 的 storage 函式）", () => {
  // 允許 bare localStorage 的函式白名單（皆自帶 try/catch 或本身即安全層）
  const allowed = ["removeChecksKeySafe", "loadCheckedItems", "saveChecks", "getPlanChoice", "setPlanChoice", "safeStorageGet", "safeStorageSet", "safeStorageRemove"];
  const code = appSrc.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  // 找出所有含 bare localStorage.(get/set/remove)Item 的函式名
  const fnRe = /function\s+([A-Za-z0-9_]+)\s*\([\s\S]*?\n}/g;
  let m, ok = true;
  while ((m = fnRe.exec(code)) !== null) {
    if (/localStorage\.(getItem|setItem|removeItem)/.test(m[0]) && allowed.indexOf(m[1]) === -1) ok = false;
  }
  return ok;
});

// ── 結果 ────────────────────────────────────────────────
console.log("\n" + "=".repeat(84));
console.log(fail === 0
  ? `✅ PASSED · ${pass}/${pass + fail}`
  : `❌ FAILED · ${pass}/${pass + fail}（失敗：${failures.join("、")}）`);
console.log("=".repeat(84));
process.exit(fail ? 1 : 0);
