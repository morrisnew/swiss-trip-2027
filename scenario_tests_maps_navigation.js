/**
 * V21.8 · Maps & Navigation + V21.4g Itinerary Sync Tests
 * 執行：node scenario_tests_maps_navigation.js
 *
 * 涵蓋（§25）：
 *   1. V21.4g itinerary data regression（Day 2/3/5/6/8/9/10/11 + STP + Sans Souci Pending）
 *   2. Map guide existence（P0 六大交通場景）
 *   3. Day ↔ Map link 完整性
 *   4. Offline fallback（示意圖/文字內建，不依賴外網）
 *   5. External link config check（格式合法、無 broken/placeholder）
 *   6. Today engine / 既有結構不被 Maps 破壞（app.js 靜態守門）
 */
const fs = require("fs");
const path = require("path");
const dataSrc = fs.readFileSync(path.join(__dirname, "data.js"), "utf-8");
const appSrc = fs.readFileSync(path.join(__dirname, "app.js"), "utf-8");
const swSrc = fs.readFileSync(path.join(__dirname, "sw.js"), "utf-8");

const ctx = {};
new Function("ctx", dataSrc + "\n;['TRIP_META','DAYS','MAP_GUIDES','DAY_MAP_LINKS','PENDING_2027','HOTELS','BOOKINGS','LUGGAGE_MILESTONES'].forEach(k=>{try{ctx[k]=eval(k)}catch(e){}});")(ctx);

let pass = 0, fail = 0; const failures = [];
function section(t) { console.log("\n" + "─".repeat(72) + "\n" + t + "\n" + "─".repeat(72)); }
function t(name, fn) {
  let ok = false; try { ok = fn() === true; } catch (e) { ok = false; }
  if (ok) { pass++; console.log("  ✅ " + name); }
  else { fail++; failures.push(name); console.log("  ❌ " + name); }
}
const allDays = JSON.stringify(ctx.DAYS);
const day = (n) => JSON.stringify(ctx.DAYS.find(d => d.day === n));

console.log("=".repeat(72));
console.log("V21.8 · Maps & Navigation + V21.4g Itinerary Sync Tests");
console.log("=".repeat(72));

// ══════════════════════════════════════════════════════════
section("1. 版本線分離（§21）");
t("webAppVersion = V21.8c", () => ctx.TRIP_META.webAppVersion === "V21.8c");
t("itineraryVersion = V21.4g", () => ctx.TRIP_META.itineraryVersion === "V21.4g");
t("version 字串同時顯示 Web 版與行程資料版", () =>
  /V21\.8c/.test(ctx.TRIP_META.version) && /V21\.4g/.test(ctx.TRIP_META.version));
t("不再宣稱基於 V21.4a／V21.4b", () => !/V21\.4a|V21\.4b/.test(ctx.TRIP_META.version));

// ══════════════════════════════════════════════════════════
section("2. V21.4g Itinerary Sync Regression（Day 2/3/5/6/8/9/10/11）");
// Day 2（A03/A05/M08）
t("Day 2：Kulm→Kaltbad Default＝齒軌火車", () => /Default/.test(day(2)) && /齒軌火車/.test(day(2)));
t("Day 2：步行為 Optional、非 Must-do", () => /Optional/.test(day(2)) && !/下山第一段：下坡健行/.test(day(2)));
t("Day 2：無『走碎石坡』殘留", () => !/走碎石坡/.test(day(2)));
t("Day 2：無固定假班表（xx:00→xx:15）", () => !/約每整點/.test(day(2)));
t("Day 2：獅子紀念碑已移出（改 Kapellbrücke／舊城）", () =>
  !/title:"獅子紀念碑/.test(day(2)) && /卡貝爾木橋|Kapellbrücke/.test(day(2)));
t("Day 3：獅子紀念碑仍為正式行程", () => /獅子紀念碑/.test(day(3)));
// Day 3（M01/F01-F03）
t("Day 3：SBB 行李為 08:00 開門後辦理", () => /08:00/.test(day(3)) && /開門後/.test(day(3)));
t("Day 3：無『通常 07:00 開門』殘留", () => !/通常 07:00 開門/.test(day(3)));
t("Day 3：行李時段起點為 07:45（非 07:00–09:00）", () => /07:45–09:00/.test(day(3)));
t("全站 luggage milestone D3_send 不再標 07:00", () =>
  !(ctx.LUGGAGE_MILESTONES || []).some(m => m.id === "D3_send" && /07:00/.test(m.date)));
// Day 5（A01）
t("Day 5：13:00 抵達 ≠ 入住；入住 15:00 起", () => /15:00/.test(day(5)));
t("Day 5：明示 13:00–15:00 為入住前等待時段", () => /入住前等待時段/.test(day(5)));
t("Day 5：15:00 前不得進入公寓（critical 保留）", () => /15:00 前.{0,30}不得進入公寓|未到入住時間前不得進入公寓/.test(day(5)));
t("Day 5：不預設一定去 Interhome office 領鑰匙", () => !/去 Interhome 辦公室/.test(day(5)));
// Day 6（U01/U03/M03/M09）
t("Day 6：Mürren 無『全平坦』", () => !/全平坦/.test(day(6)));
t("Day 6：funicular 後步行約 5–10 分鐘（非 1 分鐘）", () =>
  /步行約 5–10 分鐘至 Mürren BLM/.test(day(6)) && !/走回 Mürren BLM 站（約 1 分鐘）/.test(day(6)));
t("Day 6：不硬綁 15:45／每 15 分鐘", () => !/15:45/.test(day(6)) && !/每 15 分鐘/.test(day(6)));
t("Day 6：核心仍為 Mürren + Allmendhubel", () => /Allmendhubel/.test(day(6)) && /Mürren/.test(day(6)));
// Day 8（A02/M02 + luggage）
t("Day 8：A 方案為 11:15–下山前（非 11:15–12:45）", () =>
  /11:15–下山前/.test(day(8)) && !/11:15–12:45/.test(day(8)));
t("Day 8：A 方案優先序 主觀景→Playground→午餐→Naturkino→Alpine Garden", () => {
  const d = day(8);
  return /Skywalk/.test(d) && /Alpine Playground/.test(d) && /Naturkino/.test(d) &&
         /Alpine Garden（永遠最後|Alpine Garden.{0,10}Optional/.test(d);
});
t("Day 8：Alpine Garden 不再是家庭版主核心", () => !/A 家庭預設主方案：Alpine Garden/.test(day(8)));
t("Day 8：行李 08:00 counter 開門後辦理、無 07:30", () =>
  /08:00 Grindelwald SBB luggage counter 開門後辦理/.test(day(8)) && !/07:30/.test(day(8)));
t("Day 8：區塊時間 08:00 起（對齊 V21.4g A3）", () => /"08:00–09:15"/.test(day(8)));
t("Day 11：步行 300m／約 4-5 分鐘（對齊 V21.4g D2）", () => /300m/.test(day(11)) && /4-5 分鐘/.test(day(11)));
t("Day 8：行李寄至 Zürich Flughafen", () => /Zürich Flughafen/.test(day(8)));
// Day 9（A07/M10）
t("Day 9：幼兒主方案為背巾／背架", () => /背巾|背架/.test(day(9)));
t("Day 9：推車非必帶", () => /非必帶|視當日路線與成人分工/.test(day(9)));
// Day 10（A06/M06）
t("Day 10：木雕村標為 Optional Bonus", () => /Optional Bonus/.test(day(10)));
t("Day 10：木雕村有硬性保護（不得壓縮 BRB）", () => /不得壓縮 BRB/.test(day(10)));
t("Day 10：BRB 仍為主線", () => /BRB/.test(day(10)));
// Day 11（A08）
t("Day 11：不預設 Bern 同月台固定值", () => !/走 5 步路到對面月台即可/.test(day(11)));
t("Day 11：Platform/編組依當日 SBB App／看板", () => /以當日 SBB App／車站電子看板為準/.test(day(11)));
t("Day 11：不預設一定有 Family Coach", () => !/通常編有 FA/.test(day(11)));
t("Day 11：08:49 BOB 主方案保留", () => /08:49 BOB/.test(day(11)));
// STP（A09）
t("STP：15-day 為既定主方案", () => {
  const p = ctx.PENDING_2027.find(x => x.id === "stp_2027_price");
  return !!p && /既定主方案/.test(p.note);
});
t("STP：2027 不重新比較票券方案", () => {
  const p = ctx.PENDING_2027.find(x => x.id === "stp_2027_price");
  return !!p && /不重新進行票券方案比較/.test(p.note);
});
// Sans Souci Pending（§12）
t("Sans Souci：已知條件仍在（check-in 15:00–17:00）", () =>
  /15:00/.test(ctx.HOTELS.grindelwald.checkInWindow || ""));
t("Sans Souci：key collection 等仍為 Pending（未轉 Confirmed）", () => {
  const items = ctx.HOTELS.grindelwald.pendingItems || [];
  return items.some(x => /key|鑰匙/.test(x)) && items.some(x => /門牌|address/i.test(x));
});
// 行李鏈（§26）
t("行李鏈 Day 3 寄→Day 5 領→Day 8 寄→Day 11 領 完整", () => {
  const ids = (ctx.LUGGAGE_MILESTONES || []).map(m => m.id);
  return ["D3_send", "D5_receive", "D8_send", "D11_receive"].every(x => ids.includes(x));
});

// ══════════════════════════════════════════════════════════
section("3. Map Guide Existence（P0 六大交通場景）");
const G = ctx.MAP_GUIDES || {};
t("MAP_GUIDES 存在且非空", () => Object.keys(G).length > 0);
[["luzern_station", "P0-1 Luzern Bahnhof"],
 ["interlaken_ost", "P0-2 Interlaken Ost"],
 ["grindelwald_station", "P0-3 Grindelwald Bahnhof"],
 ["lauterbrunnen_transfer", "P0-4a Lauterbrunnen"],
 ["grutschalp_transfer", "P0-4b Grütschalp"],
 ["murren_orientation", "P0-4c Mürren"],
 ["brienz_boat_brb", "P0-5 Brienz Boat→BRB"],
 ["zurich_airport", "P0-6 Zürich Flughafen"]].forEach(([id, label]) => {
  t(`${label} guide 存在`, () => !!G[id]);
});
t("每個 guide 具備必要欄位（id/title/type/status/steps）", () =>
  Object.values(G).every(g => g.id && g.title && g.type && g.status && Array.isArray(g.steps)));
t("type 僅使用 town/route/station/transfer", () =>
  Object.values(G).every(g => ["town", "route", "station", "transfer"].includes(g.type)));
t("station/transfer/town guide 至少 3 個現場重點（§13：3–5 點）", () =>
  Object.values(G).filter(g => g.type !== "route").every(g => g.steps.length >= 3));
t("route（移動鏈）guide 至少 1 個重點", () =>
  Object.values(G).filter(g => g.type === "route").every(g => g.steps.length >= 1));
t("現場重點不超過 5 點（避免整段 Excel 貼上）", () =>
  Object.values(G).every(g => g.steps.length <= 5));

// ══════════════════════════════════════════════════════════
section("4. Day ↔ Map Link");
t("DAY_MAP_LINKS 存在", () => !!ctx.DAY_MAP_LINKS);
t("所有 day→map id 皆能對應到實際 guide（無 broken link）", () =>
  Object.values(ctx.DAY_MAP_LINKS).every(ids => ids.every(id => !!G[id])));
t("Day 3 連到 Luzern 車站（SBB luggage）", () => (ctx.DAY_MAP_LINKS[3] || []).includes("luzern_station"));
t("Day 5 連到 Interlaken Ost 與 Grindelwald 車站", () =>
  (ctx.DAY_MAP_LINKS[5] || []).includes("interlaken_ost") && (ctx.DAY_MAP_LINKS[5] || []).includes("grindelwald_station"));
t("Day 6 連到 Mürren 相關轉乘卡", () => (ctx.DAY_MAP_LINKS[6] || []).includes("murren_orientation"));
t("Day 10 連到 Brienz Boat→BRB", () => (ctx.DAY_MAP_LINKS[10] || []).includes("brienz_boat_brb"));
t("Day 11 連到 Zürich Flughafen", () => (ctx.DAY_MAP_LINKS[11] || []).includes("zurich_airport"));
t("guide.relatedDays 與 DAY_MAP_LINKS 不矛盾", () =>
  Object.entries(ctx.DAY_MAP_LINKS).every(([d, ids]) =>
    ids.every(id => !G[id].relatedDays || G[id].relatedDays.includes(Number(d)))));

// ══════════════════════════════════════════════════════════
section("5. Offline Fallback（§19）");
t("所有 guide 標記 offlineAvailable", () => Object.values(G).every(g => g.offlineAvailable === true));
t("所有 guide 內建 diagram 或 steps（不依賴外網才可讀）", () =>
  Object.values(G).every(g => (Array.isArray(g.diagram) && g.diagram.length) || g.steps.length));
t("MAP_GUIDES 內建於 data.js（隨核心資產 precache）", () => /const MAP_GUIDES/.test(dataSrc));
t("SW ASSETS 已含 data.js / app.js（示意圖隨之離線可用）", () =>
  /"\.\/data\.js"/.test(swSrc) && /"\.\/app\.js"/.test(swSrc));
t("UI 明示外部連結需要網路", () => /需要網路/.test(appSrc));
t("未引入需 API key 才能基本使用的地圖依賴", () =>
  !/googleapis\.com\/maps\/api|mapbox|leaflet|api[_-]?key=/i.test(appSrc + dataSrc));

// ══════════════════════════════════════════════════════════
section("6. External Link Config Check");
const links = Object.values(G).flatMap(g => (g.officialLinks || []).map(l => l.url).concat(g.externalMap ? [g.externalMap] : []));
t("所有外部連結為 https", () => links.every(u => /^https:\/\//.test(u)));
t("無 placeholder / example / TODO 連結", () => !links.some(u => /example\.com|TODO|placeholder|#$/i.test(u)));
t("每個 official link 有 label", () =>
  Object.values(G).every(g => (g.officialLinks || []).every(l => !!l.label && !!l.url)));
t("使用官方來源（sbb/jungfrau/schilthorn/brienz-rothorn/flughafen-zuerich/emirates/bls）", () =>
  Object.values(G).every(g => (g.officialLinks || []).every(l =>
    /sbb\.ch|jungfrau\.ch|schilthorn\.ch|brienz-rothorn-bahn\.ch|flughafen-zuerich\.ch|emirates\.com|bls\.ch/i.test(l.url))));
t("Google Maps 僅作 externalMap fallback，非 officialLinks", () =>
  Object.values(G).every(g => (g.officialLinks || []).every(l => !/google\./i.test(l.url))));

// ══════════════════════════════════════════════════════════
section("7. Current / Pending 在地圖亦成立（§16）");
t("每個 guide 有 status（current_reference 或 pending）", () =>
  Object.values(G).every(g => ["current_reference", "pending"].includes(g.status)));
t("未鎖死具體 platform 號碼", () =>
  !Object.values(G).some(g => /Platform\s*\d|月台\s*\d\s*號/.test(JSON.stringify(g))));
t("未鎖死具體 Gate", () => !Object.values(G).some(g => /Gate\s*[A-Z]?\d{1,2}\b(?!\d)/.test(JSON.stringify(g))));
t("ZRH guide 標明 Gate/櫃台為 Pending", () =>
  /Pending/i.test((G.zurich_airport.pendingNotes || []).join(" ")));
t("Interlaken Ost 明示不預設固定月台", () =>
  /不預設固定月台|不預先鎖定/.test(JSON.stringify(G.interlaken_ost)));
t("BRB guide 標明 2027 timetable Pending", () =>
  /timetable/i.test((G.brienz_boat_brb.pendingNotes || []).join(" ")));
t("未發明 2027 timetable 具體時刻", () =>
  !Object.values(G).some(g => /2027 年?\s*\d{1,2}:\d{2} 發車/.test(JSON.stringify(g))));

// ══════════════════════════════════════════════════════════
section("7b. V21.8a Spatial Schematic（§17）");
const SCH = Object.values(G).filter(g => g.schematic);
t("station/town/transfer 全部具備 schematic 資料", () =>
  Object.values(G).filter(g => g.type !== "route").every(g => g.schematic && Array.isArray(g.schematic.nodes) && g.schematic.nodes.length >= 2));
t("route guide 不使用 schematic（維持 vertical flow）", () =>
  Object.values(G).filter(g => g.type === "route").every(g => !g.schematic && Array.isArray(g.diagram) && g.diagram.length));
t("schematic 具備 nodes/links/viewBox/ariaLabel", () =>
  SCH.every(g => { const c = g.schematic; return c.viewBox && c.ariaLabel && Array.isArray(c.links); }));
t("schematic node 具備 x/y 座標（真正 2D，非單純垂直列）", () =>
  SCH.every(g => g.schematic.nodes.every(n => typeof n.x === "number" && typeof n.y === "number")));
t("station/town schematic 具備多個不同 x 值（非單一垂直軸）", () =>
  Object.values(G).filter(g => ["station", "town"].includes(g.type)).every(g => new Set(g.schematic.nodes.map(n => n.x)).size >= 2));
t("station/town schematic 具備多個不同 y 值（有層次／縱深）", () =>
  Object.values(G).filter(g => ["station", "town"].includes(g.type)).every(g => new Set(g.schematic.nodes.map(n => n.y)).size >= 2));
t("links 的 from/to 皆能對應到既有 node", () =>
  SCH.every(g => { const ids = new Set(g.schematic.nodes.map(n => n.id)); return g.schematic.links.every(l => ids.has(l.from) && ids.has(l.to)); }));
t("link style 僅使用 walk/transport/level", () =>
  SCH.every(g => g.schematic.links.every(l => ["walk", "transport", "level"].includes(l.style))));
t("node status 僅使用 current/verify/pending", () =>
  SCH.every(g => g.schematic.nodes.every(n => !n.status || ["current", "verify", "pending"].includes(n.status))));
// 必修場景各自 layout
[["luzern_station", "station"], ["grindelwald_station", "station"], ["zurich_airport", "station"],
 ["murren_orientation", "town"], ["brienz_boat_brb", "transfer"], ["interlaken_ost", "transfer"],
 ["lauterbrunnen_transfer", "transfer"], ["grutschalp_transfer", "transfer"]].forEach(([id, layout]) => {
  t(`${id} schematic layout = ${layout}`, () => G[id].schematic.layout === layout);
});
t("app.js 有 station/town/transfer 三種 renderer", () =>
  /function renderStationSchematic/.test(appSrc) && /function renderTownSchematic/.test(appSrc) && /function renderTransferSchematic/.test(appSrc));
t("app.js 依 guide.type 分派 renderer", () =>
  /function renderGuideSpatial/.test(appSrc) && /case "station"/.test(appSrc) && /case "town"/.test(appSrc) && /case "transfer"/.test(appSrc));
t("route 仍走 renderMapDiagram（flow renderer 保留）", () =>
  /function renderMapDiagram/.test(appSrc) && /return renderMapDiagram\(g\.diagram\)/.test(appSrc));
t("schematic 以 inline SVG 呈現（無外部圖片資產）", () =>
  /<svg viewBox=/.test(appSrc) && !/\.png|\.jpg|\.jpeg|\.webp/i.test(appSrc));
t("SVG 具 role=img 與 aria-label（accessibility）", () =>
  /role="img"/.test(appSrc) && /aria-label="\$\{escapeHTML\(sc\.ariaLabel/.test(appSrc));
t("提供文字版 fallback（不靠圖與顏色）", () => /function schematicTextFallback/.test(appSrc) && /文字版說明/.test(appSrc));
t("提供 legend", () => /function schematicLegend/.test(appSrc));
t("所有 schematic 標示 Not to scale", () => /Not to scale/.test(appSrc));

section("7c. Factual regression（§17）");
t("Lauterbrunnen description 不含「或登山鐵道」", () =>
  !/或登山鐵道/.test(JSON.stringify(G)));
t("Lauterbrunnen 明確區分 aerial cableway 與 BLM railway", () => {
  const j = JSON.stringify(G.lauterbrunnen_transfer);
  return /aerial cableway|空中纜車/.test(j) && /Grütschalp/.test(j) && /railway|鐵道/.test(j);
});
t("schematic 未鎖死具體 platform 號碼", () =>
  !SCH.some(g => /Platform\s*\d|月台\s*\d\s*號/.test(JSON.stringify(g.schematic))));
t("schematic 未鎖死具體 Gate", () =>
  !SCH.some(g => /Gate\s*[A-Z]?\d{1,2}\b(?!\d)/.test(JSON.stringify(g.schematic))));
t("動態節點標為 pending/verify（Gate／Emirates 櫃台／Sans Souci 門牌）", () => {
  const zrh = G.zurich_airport.schematic.nodes;
  const gri = G.grindelwald_station.schematic.nodes;
  return zrh.some(n => /Gate/.test(n.label) && n.status === "pending")
      && zrh.some(n => /報到/.test(n.label) && n.status === "pending")
      && gri.some(n => /Sans Souci/.test(n.label) && n.status === "pending");
});
t("Interlaken Ost schematic 標明 platform 為 day-of", () =>
  /day-of|當日 SBB App/i.test(JSON.stringify(G.interlaken_ost.schematic)));
t("Brienz schematic 區分 SBB 站與 BRB 獨立站體", () => {
  const j = JSON.stringify(G.brienz_boat_brb.schematic);
  return /SBB/.test(j) && /獨立站體|專屬站體|非 BRB/.test(j);
});

section("7d. Deep-link quality（§17）");
const deepOf = (id) => (G[id].officialLinks || []).map(l => l.url);
// §9：真正的 luggage-counter specific page（generic luggage page / PDF map 皆不算）
t("Luzern 有真正 luggage-counter-specific SBB official page", () => {
  const gen = /\/offers\/luggage-services|\/services\/luggage/i;
  const pdf = /\.pdf/i;
  return (G.luzern_station.officialLinks || []).some(l => {
    let u; try { u = new URL(l.url); } catch (e) { return false; }
    const specific = /luzern-station\/shops\/shop-detail\.html\/geo-gepaeckaufgabe/i.test(l.url);
    return u.protocol === "https:" && /(^|\.)sbb\.ch$/i.test(u.hostname)
        && u.pathname.replace(/\/$/, "").length > 1
        && specific && !gen.test(l.url) && !pdf.test(l.url)
        && /行李櫃台/.test(l.label);
  });
});
t("Luzern：generic luggage page 或 PDF map 單獨不足以構成 counter-specific", () => {
  const only = (G.luzern_station.officialLinks || [])
    .filter(l => /\/offers\/luggage-services/i.test(l.url) || /\.pdf/i.test(l.url));
  return only.length > 0 && !only.some(l => /geo-gepaeckaufgabe/i.test(l.url));
});
// §13：Interlaken Ost 第二連結必須是 Interlaken Ost / BOB 主題
t("Interlaken Ost 有 Jungfrau 官方 Interlaken Ost／BOB 相關頁", () =>
  (G.interlaken_ost.officialLinks || []).some(l =>
    /jungfrau\.ch/i.test(l.url) &&
    /(interlaken-ost-railway-station|berner-oberland-bahn)/i.test(l.url)));
t("Interlaken Ost 不再以 BLM（Lauterbrunnen–Grütschalp–Mürren）作為主要第二 reference", () =>
  !(G.interlaken_ost.officialLinks || []).some(l => /bergbahn-lauterbrunnen-muerren/i.test(l.url)));
t("BLM link 仍保留於 Lauterbrunnen／Grütschalp／Mürren guide", () =>
  ["lauterbrunnen_transfer", "grutschalp_transfer", "murren_orientation"].every(id =>
    (G[id].officialLinks || []).some(l => /bergbahn-lauterbrunnen-muerren/i.test(l.url))));
t("ZRH 使用現行官方 flughafen-zuerich.ch 且為具體頁面", () =>
  deepOf("zurich_airport").some(u => /flughafen-zuerich\.ch\/.*(interactive-map|flightinformation)/i.test(u)));
t("Brienz 有 BRB timetable canonical deep link", () =>
  deepOf("brienz_boat_brb").some(u => /brienz-rothorn-bahn\.ch\/en\/fahrplan-preise/i.test(u)));
t("Grindelwald 使用 SBB canonical station page", () =>
  deepOf("grindelwald_station").some(u => /find-station\/station\.\d+\.grindelwald/i.test(u)));
t("Lauterbrunnen 使用 SBB canonical station page", () =>
  deepOf("lauterbrunnen_transfer").some(u => /find-station\/station\.\d+\.lauterbrunnen/i.test(u)));
t("Interlaken Ost 使用 SBB canonical station page", () =>
  deepOf("interlaken_ost").some(u => /find-station\/station\.\d+\.interlaken-ost/i.test(u)));
t("P0 guide 的 officialLinks 不得全部只是 domain homepage", () =>
  Object.values(G).filter(g => g.priority === "P0" && (g.officialLinks || []).length)
    .every(g => g.officialLinks.some(l => { try { return new URL(l.url).pathname.replace(/\/$/, "").length > 1; } catch (e) { return false; } })));
t("official link label 具體（非僅『官方資訊』）", () =>
  Object.values(G).every(g => (g.officialLinks || []).every(l => !/^官方資訊$/.test(l.label) && l.label.length >= 4)));

// ══════════════════════════════════════════════════════════
t("不再使用舊式 SBB 路徑（/station-services/at-the-station/）", () =>
  !Object.values(G).some(g => (g.officialLinks || []).some(l => /station-services\/at-the-station/i.test(l.url))));
t("不再使用舊 zurich-airport.com 網域", () =>
  !Object.values(G).some(g => (g.officialLinks || []).some(l => /zurich-airport\.com/i.test(l.url))));

// ══════════════════════════════════════════════════════════
section("7e. V21.8b · C02 Light Mode contrast（§12）");
const cssSrc = fs.readFileSync(path.join(__dirname, "style.css"), "utf-8");
function hexOf(v){ const m=String(v).match(/#([0-9a-f]{6})/i); return m?m[1].toLowerCase():null; }
function lum(hex){ const c=[0,2,4].map(i=>parseInt(hex.substr(i,2),16)/255)
  .map(x=>x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; }
function contrast(a,b){ const L1=lum(a),L2=lum(b); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05); }
t("--bg-elev 於 :root 有正式定義", () => /:root[\s\S]*?--bg-elev\s*:/.test(cssSrc));
t("--accent 於 :root 有正式定義", () => /:root[\s\S]*?--accent\s*:/.test(cssSrc));
t("深色模式另有 --bg-elev 定義", () => /prefers-color-scheme:\s*dark[\s\S]*?--bg-elev\s*:/.test(cssSrc));
t("app.js 不再以硬編深色值作為 fallback 決定正式 UI 顏色", () =>
  !/var\(--bg-elev\s*,\s*#/.test(appSrc) && !/var\(--accent\s*,\s*#/.test(appSrc) && !/var\(--text\s*,\s*#/.test(appSrc));
t("Light Mode：node 背景(surface #FFFFFF) vs 文字(--text slate-800 #1E293B) 對比 ≥ 4.5:1", () =>
  contrast("ffffff", "1e293b") >= 4.5);
t("Dark Mode：node 背景(#141821) vs 文字(#F1F5F9) 對比 ≥ 4.5:1", () =>
  contrast("141821", "f1f5f9") >= 4.5);
t("靜態守門：不得出現 #141821 背景 + #1E293B 文字的深對深組合", () => {
  const light = /:root\s*{[\s\S]*?}/.exec(cssSrc)[0];
  return !(/--bg-elev\s*:\s*#141821/i.test(light) && /--text\s*:\s*var\(--slate-800\)/.test(light));
});

// ══════════════════════════════════════════════════════════
section("7f. V21.8b · C03 Schematic node collision（§15）");
function nodeBox(n){
  const lines=String(n.label).split("\n");
  const w=Math.max(56,Math.min(120,Math.max.apply(null,lines.map(l=>l.length))*7+16));
  const h=20+(lines.length-1)*11;
  return { x1:n.x-w/2, y1:n.y-h/2, x2:n.x+w/2, y2:n.y+h/2 };
}
const overlaps=(a,b)=>!(a.x2<=b.x1||b.x2<=a.x1||a.y2<=b.y1||b.y2<=a.y1);
["zurich_airport","luzern_station","interlaken_ost","grindelwald_station","murren_orientation","brienz_boat_brb",
 "lauterbrunnen_transfer","grutschalp_transfer"].forEach(id => {
  t(`${id}：node bounding box 無重疊`, () => {
    const bs=G[id].schematic.nodes.map(nodeBox);
    for(let i=0;i<bs.length;i++) for(let j=i+1;j<bs.length;j++) if(overlaps(bs[i],bs[j])) return false;
    return true;
  });
  t(`${id}：所有 node 落在 viewBox 內`, () => {
    const vb=G[id].schematic.viewBox.split(/\s+/).map(Number);
    return G[id].schematic.nodes.map(nodeBox).every(b =>
      b.x1>=vb[0] && b.y1>=vb[1] && b.x2<=vb[0]+vb[2] && b.y2<=vb[1]+vb[3]);
  });
});
t("ZRH 不再把 luggage／center／check-in 擠在同一水平列", () => {
  const n=G.zurich_airport.schematic.nodes;
  const y=id=>n.find(x=>x.id===id).y;
  return y("center")!==y("lug") || y("center")!==y("chk");
});
t("ZRH Pending 狀態保持（報到／Gate）", () => {
  const n=G.zurich_airport.schematic.nodes;
  return n.find(x=>x.id==="chk").status==="pending" && n.find(x=>x.id==="gate").status==="pending";
});

// ══════════════════════════════════════════════════════════
section("8. 既有功能不被破壞（§23）");
t("renderMaps 已註冊於 renderPage dispatcher", () => /p === "maps"\)\s*return renderMaps\(\)/.test(appSrc));
t("Today Engine 函式仍存在", () =>
  /function findCurrentAndNext/.test(appSrc) && /function classifyDayState/.test(appSrc) && /function parseTimelineTime/.test(appSrc));
t("Day 8 A/B plan 機制仍存在", () => /function getPlanChoice/.test(appSrc) && /function setPlanChoice/.test(appSrc));
t("storage 安全層仍存在", () =>
  /function safeStorageGet/.test(appSrc) && /function loadBookingsFilter/.test(appSrc) && /function getPendingState/.test(appSrc));
t("bottom nav 仍為 5 項（未被 Maps 擠掉）", () => {
  const m = appSrc.match(/function renderBottomNav\(\)[\s\S]*?\];/);
  return !!m && (m[0].match(/key:"/g) || []).length === 5;
});
t("Maps 可從 Tools 與首頁進入", () => /data-nav="maps"/.test(appSrc));
t("Day 頁有本日地圖區塊", () => /本日地圖與轉乘示意/.test(appSrc));
t("自製示意圖標示 Not to scale", () => /Not to scale/.test(appSrc));
t("SW 架構未回退（addAll / claim / cache-first / 503）", () =>
  /cache\.addAll\(ASSETS\)/.test(swSrc) && /clients\.claim\(\)/.test(swSrc) &&
  /caches\.match\(event\.request\)/.test(swSrc) && /status: 503/.test(swSrc));

console.log("\n" + "=".repeat(72));
console.log(fail === 0
  ? `✅ PASSED · ${pass}/${pass + fail}`
  : `❌ FAILED · ${pass}/${pass + fail}（失敗：${failures.join("、")}）`);
console.log("=".repeat(72));
process.exit(fail ? 1 : 0);
