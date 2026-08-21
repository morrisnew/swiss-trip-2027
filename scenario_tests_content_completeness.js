/**
 * V21.8c1 · Content Completeness Regression（prompt §七）
 * 執行：node scenario_tests_content_completeness.js
 * 判準：Excel 有效資訊 → Web data layer 有正確資料 → production UI 真的 render 得出來
 */
const fs = require("fs");
const path = require("path");
const dataSrc = fs.readFileSync(path.join(__dirname, "data.js"), "utf-8");
const appSrc  = fs.readFileSync(path.join(__dirname, "app.js"), "utf-8");
const ctx = {};
new Function("c", dataSrc + "\n;['TRIP_META','DAYS','SIGHTS','RAIN_PLANS','RESTAURANTS','BOOKINGS','PACKING','BUDGET','TRAVEL_REF_FIELDS','TRAVEL_BOUNDARY','HOTELS','EMERGENCY','CONSULATE_CONTACT'].forEach(k=>{try{c[k]=eval(k)}catch(e){}});")(ctx);

let pass = 0, fail = 0; const failures = [];
function section(t){ console.log("\n" + "─".repeat(72) + "\n" + t + "\n" + "─".repeat(72)); }
function t(name, fn){ let ok=false; try{ ok = fn()===true; }catch(e){ ok=false; }
  if(ok){pass++;console.log("  ✅ "+name);} else {fail++;failures.push(name);console.log("  ❌ "+name);} }
const day = n => JSON.stringify(ctx.DAYS.find(d=>d.day===n));

console.log("=".repeat(72));
console.log("V21.8c1 · Content Completeness Regression");
console.log("=".repeat(72));

section("A. Day 8 人員分組（factual）");
t("07:45 早班＝Morris + Milo", () => /07:45 Morris \+ Milo/.test(day(8)));
t("09:00 家人組＝Emily + 皮皮 + 妞妞", () => /家人（Emily \+ 皮皮 \+ 妞妞）09:00/.test(day(8)));
t("09:00 組不得含 Milo", () => {
  const m = day(8).match(/家人（[^）]*）09:00/);
  return !!m && !/Milo/.test(m[0]);
});
t("Milo 不同時出現在兩個出發組別", () => {
  const d8 = day(8);
  const early = /07:45[^"]*Milo/.test(d8);
  const later = /家人（[^）]*Milo[^）]*）09:00/.test(d8);
  return early && !later;
});

section("B. Day 6 Mürren 午餐策略");
t("Day 6 有 Stägerstübli 首選", () => /Stägerstübli/.test(day(6)));
t("Day 6 有 1-2 個備選（Hotel Eiger／La Grotte）", () => /Hotel Eiger/.test(day(6)) && /La Grotte/.test(day(6)));
t("Day 6 有訂位建議（出發前 2-3 天）", () => /2-3 天/.test(day(6)));
t("Day 6 有預計時間 12:15 與 5 人", () => /12:15/.test(day(6)) && /5 人/.test(day(6)));
t("BOOKINGS 有 Day 6 Mürren 午餐訂位任務", () =>
  ctx.BOOKINGS.some(b => /Mürren.*午餐訂位|午餐訂位.*Mürren/.test(b.task)));
t("該 BOOKINGS 任務時機為出發前 2-3 天", () => {
  const b = ctx.BOOKINGS.find(x => /Mürren/.test(x.task) && /午餐/.test(x.task));
  return !!b && /2-3 天/.test(b.when + b.how);
});

section("C. SIGHTS 補 Day 6 景點");
t("SIGHTS 含 Mürren", () => ctx.SIGHTS.some(s => /Mürren/.test(s.name)));
t("SIGHTS 含 Allmendhubel", () => ctx.SIGHTS.some(s => /Allmendhubel/.test(s.name)));
t("Mürren 不得寫成完全平坦", () => {
  const s = JSON.stringify(ctx.SIGHTS.find(x => /Mürren/.test(x.name)));
  return /坡度|不平|碎石/.test(s) && !/全平坦|完全平坦/.test(s);
});
t("Allmendhubel 含 Flower Park／funicular／幼兒", () => {
  const s = JSON.stringify(ctx.SIGHTS.find(x => /Allmendhubel/.test(x.name)));
  return /Flower Park/.test(s) && /funicular/i.test(s) && /幼兒/.test(s);
});
t("Allmendhubel 標示 2027 營運仍需確認", () => {
  const s = JSON.stringify(ctx.SIGHTS.find(x => /Allmendhubel/.test(x.name)));
  return /2027/.test(s) && /確認/.test(s);
});

section("D/E/F. Rain Plans：render + factual + 完整性");
t("renderWeather 實際 render RAIN_PLANS", () =>
  /function renderRainPlansSection/.test(appSrc) && /\$\{renderRainPlansSection\(\)\}/.test(appSrc) && /RAIN_PLANS/.test(appSrc));
t("Bern 不得再出現「車程 35 分」", () => !/車程 35 分/.test(JSON.stringify(ctx.RAIN_PLANS)));
t("Bern 改為 1.5 小時量級且依 SBB 確認", () => {
  const b = ctx.RAIN_PLANS.find(r => /伯恩舊城/.test(r.place));
  return !!b && /1\.5 小時/.test(b.ticket) && /SBB/.test(b.ticket);
});
t("Bern 保留 STP coverage 與拱廊 rain-friendly", () => {
  const b = ctx.RAIN_PLANS.find(r => /伯恩舊城/.test(r.place));
  return /STP/.test(b.ticket) && /拱廊/.test(b.pros + b.note);
});
t("Luzern 必要雨備齊全（交通博物館／Rosengart／KKL／舊城）", () => {
  const j = JSON.stringify(ctx.RAIN_PLANS.filter(r => r.base === "琉森"));
  return /交通博物館/.test(j) && /羅森加特/.test(j) && /KKL/.test(j) && /舊城/.test(j);
});
t("Grindelwald 必要雨備齊全（冰河峽谷／Sportzentrum／Interlaken）", () => {
  const j = JSON.stringify(ctx.RAIN_PLANS);
  return /冰河峽谷/.test(j) && /Sportzentrum/.test(j) && /Interlaken/.test(j);
});
t("Excel 仍有效備案已進 Web：Ballenberg", () => /Ballenberg/.test(JSON.stringify(ctx.RAIN_PLANS)));
t("Excel 仍有效備案已進 Web：Spiez + 圖恩湖", () => /Spiez/.test(JSON.stringify(ctx.RAIN_PLANS)) && /圖恩湖/.test(JSON.stringify(ctx.RAIN_PLANS)));
t("連續白牆 A 級（交通博物館，自格林德瓦約 2 小時）存在", () =>
  ctx.RAIN_PLANS.some(r => /連續白牆|A 級/.test(r.place + r.pros + r.note)));

section("G. Budget");
t("BUDGET dataset 存在", () => !!ctx.BUDGET && Array.isArray(ctx.BUDGET.groups) && ctx.BUDGET.groups.length >= 2);
t("Budget UI 可由 renderPage 到達（route budget）", () =>
  /p === "budget"\)\s*return renderBudget\(\)/.test(appSrc) && /function renderBudget/.test(appSrc));
t("Budget 有正常 UI 入口（Tools）", () => /data-nav="budget"|nav:"budget"/.test(appSrc));
t("含主要分類：機票／兩處住宿／STP／景點預約／SBB luggage／保險／餐飲", () => {
  const j = JSON.stringify(ctx.BUDGET);
  return ["機票","琉森","格林德瓦","Swiss Travel Pass","預約","行李寄送","保險","餐廳"].every(k => j.includes(k));
});
t("Summary 含全團總預算與每人概念", () =>
  /685,540\.4/.test(ctx.BUDGET.summary.grandTotal) && /成人/.test(ctx.BUDGET.summary.perAdult));
t("booked / current / estimate / pending 不混用（每項皆有合法 status）", () => {
  const ok = ["booked","current","estimate","pending"];
  return ctx.BUDGET.groups.every(g => g.items.every(i => ok.includes(i.status)));
});
t("四種 status 皆實際出現且 UI 有標記", () => {
  const used = new Set(ctx.BUDGET.groups.flatMap(g => g.items.map(i => i.status)));
  return ["booked","current","estimate","pending"].every(s => used.has(s)) && /function budgetStatusBadge/.test(appSrc);
});
t("住宿為 booked、STP 為 pending（不得混為已確認）", () => {
  const all = ctx.BUDGET.groups.flatMap(g => g.items);
  const kobi = all.find(i => /琉森/.test(i.name)), stp = all.find(i => /Swiss Travel Pass/.test(i.name));
  return kobi.status === "booked" && stp.status === "pending";
});

section("H. Restaurants 可達");
t("RESTAURANTS 有 renderer", () => /function renderRestaurants/.test(appSrc));
t("RESTAURANTS 可由 renderPage 到達", () => /p === "food"\)\s*return renderRestaurants\(\)/.test(appSrc));
t("有正常 UI 入口", () => /nav:"food"|data-nav="food"/.test(appSrc));
t("顯示 area / restaurant / plan / food / price / booking", () =>
  ["r.area","r.name","r.plan","r.must","r.price","r.book"].every(k => appSrc.includes(k)));
t("含 Day 6 Mürren 午餐資訊", () => ctx.RESTAURANTS.some(r => /Stägerstübli/.test(r.name) && /Mürren/.test(r.area)));

section("I. Travel References（不得 hard-code 敏感資料）");
t("TRAVEL_REF_FIELDS 僅欄位定義，無實際值", () =>
  ctx.TRAVEL_REF_FIELDS.every(f => f.id && f.label && !("value" in f)));
t("data.js 未 hard-code 真實 PNR／票號／保單號", () =>
  !/PNR\s*[:=]\s*"[A-Z0-9]{5,}"/.test(dataSrc) && !/policy(No|Number)\s*[:=]\s*"/i.test(dataSrc));
t("使用既有 safeStorage 架構（非另創脆弱寫法）", () =>
  /function getTravelRef/.test(appSrc) && /safeStorageGet\(travelRefKey/.test(appSrc) && /safeStorageSet\(travelRefKey/.test(appSrc));
t("key isolation：travelref_ 前綴", () => /travelref_\$\{id\}/.test(appSrc));
t("Travel References 可由 renderPage 到達且有入口", () =>
  /p === "refs"\)\s*return renderTravelRefs\(\)/.test(appSrc) && /nav:"refs"/.test(appSrc));
t("UI 明示僅存本機、需另留備份", () => /只存在本機|僅存在這支裝置|不會上傳/.test(appSrc) && /備份/.test(appSrc));

section("J/K. Packing");
t("Sans Souci 洗衣／烘衣 wording 正確（不得再寫只有 KoBi 有烘乾機）", () => {
  const j = JSON.stringify(ctx.PACKING);
  return /均有洗衣／烘衣設備/.test(j) && !/KoBi 還有烘乾機/.test(j);
});
t("HOTELS SSoT 佐證：Sans Souci 具 private washer/dryer", () =>
  /洗衣機\+烘乾機|private washer/i.test(JSON.stringify(ctx.HOTELS.grindelwald)));

section("L. Day 0 / Day 12 邊界");
t("TRAVEL_BOUNDARY 具 day0 / day12", () =>
  !!ctx.TRAVEL_BOUNDARY && !!ctx.TRAVEL_BOUNDARY.day0 && !!ctx.TRAVEL_BOUNDARY.day12);
t("DAYS 仍為 11 天（未污染 Today Engine / Day index）", () => ctx.DAYS.length === 11);
t("邊界卡有 renderer 且在行程列表呈現", () =>
  /function renderBoundaryCard/.test(appSrc) && /renderBoundaryCard\("day0"\)/.test(appSrc) && /renderBoundaryCard\("day12"\)/.test(appSrc));
t("行程頁標題語意完整（不再只寫『完整行程』而無邊界說明）", () =>
  /Day 0 出發 · 瑞士境內 Day 1–11 · Day 12 抵台/.test(appSrc));

section("M. 駐瑞士代表處電話（Web 端不得回退）");
t("Web 使用正確 General +41 31 382 2927", () =>
  /\+41 31 382 2927/.test(JSON.stringify(ctx.CONSULATE_CONTACT || ctx.EMERGENCY || {}) + dataSrc));
t("Web 無舊號碼 +41 31 382 21 36", () => !/382\s*21\s*36/.test(dataSrc));

section("版本");
t("Web App 維持 V21.8c1", () => ctx.TRIP_META.webAppVersion === "V21.8c1");
t("Itinerary 維持 V21.4g", () => ctx.TRIP_META.itineraryVersion === "V21.4g");

console.log("\n" + "=".repeat(72));
console.log(fail === 0 ? `✅ PASSED · ${pass}/${pass + fail}` : `❌ FAILED · ${pass}/${pass + fail}（失敗：${failures.join("、")}）`);
console.log("=".repeat(72));
process.exit(fail ? 1 : 0);
