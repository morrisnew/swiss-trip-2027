# V21.7d Post-Deployment Real-Environment Acceptance Summary

> 本輪為**真實瀏覽器**部署驗收（非 mock、非 jsdom）。以真實 headless Chromium 於 localhost
> secure context 執行真正的 Service Worker 生命週期。未修改任何程式（無 Critical 部署阻擋問題）。

## A. Environment

- Browser：真實 **Chromium 141.0.7390.37**（headless，Playwright 驅動）
- OS：Linux（容器）
- 測試 origin／URL：`http://127.0.0.1:<port>`（loopback；**localhost 為 secure context**，故 SW／CacheStorage 為真實可用）
- Profile：每階段使用全新 browser context（乾淨 profile）；升級測試在同一 context 內完成
- 是否曾安裝舊 V21.7d：**是（人工 seeded）**——於同一真實 Chromium profile 中先部署「初次 V21.7d」
  （舊 cache `swiss-trip-v21-7d-2027` + 未修正 app.js）再升級；**非真實歷史使用者裝置**
- 是否為 PWA standalone：否（未加入主畫面；桌面 headless）
- 是否使用真機：**否**（iPhone／Android 真機為 Not Tested）
- 重現：`realbrowser_acceptance.js`（需 Playwright + Chromium；可設 `CHROME_PATH`、`OLD_APP_JS`）

## B. Package Baseline

```
Web version: V21.7d Web · 基於 V21.4a 行程資料
SW cache:    swiss-trip-v21-7d-final-2027
```

## C. Pre-Deployment Tests（實際數量）

| 測試 | 結果 |
|---|---|
| `node --check` data.js / app.js / sw.js | ✅ OK |
| today_engine | ✅ 17/17 |
| real_itinerary | ✅ Critical 0 / Warning 0 / Info 0 |
| data_baseline | ✅ 164/164 |
| day8_plan_lifecycle | ✅ 48/48 |
| plan_choice_storage | ✅ 84/84 |
| storage_integrity | ✅ 103/103 |
| storage_consumers | ✅ 84/84（plain node） |
| service_worker_revision | ✅ 45/45 |

§7 Origin 內容（localhost）：`/sw.js` 含 `swiss-trip-v21-7d-final-2027`、`/app.js` 含 `safeStorageGet`、
`/index.html`／`/data.js`／`/manifest.json` 皆 200、MIME 合理、缺檔 404。

## D. Fresh Install Result（真實瀏覽器 · 10/10）

- SW registration：✅ registered
- activated status：✅ `activated`
- final cache：✅ 建立 `swiss-trip-v21-7d-final-2027`
- asset completeness：✅ `/`、`/index.html`、`/app.js`、`/data.js`、`/style.css`、`/manifest.json`
- 無舊 cache：✅；reload 後受 SW 控制：✅
- Console：✅ 無 app uncaught error（外部 Google Fonts 403／favicon 404 屬環境限制，非 app 錯誤）

## E. Existing PWA Upgrade Result（真實瀏覽器 · 10/10 · 最重要）

- 升級前 cache：✅ `swiss-trip-v21-7d-2027`；升級前服務 app.js 為未修正版（無 `safeStorageGet`）；受舊 SW 控制
- 觸發方式：部署 final revision（同一 URL 換 bytes）→ `registration.update()` + reload，**未使用 Clear Site Data**
- 新 SW detection：✅；install：✅；activate：✅
- 舊 cache deletion：✅ `swiss-trip-v21-7d-2027` 已刪除
- final cache retention：✅ 保留 `swiss-trip-v21-7d-final-2027`
- controller：✅ 頁面受新 SW 控制；升級後服務的 app.js 為修正版（含 `safeStorageGet` 及 `normalizeBookingsFilter`／`normalizePendingState`／`getLuggageReceipt`）
- **localStorage preservation：✅** 升級前植入的 `swiss_checks`／`planchoice_day8_spb_descent`／
  `bookings_filter`／`pending_*`／`luggage_receipt_*` 於升級後**全數保留**（Cache Storage migration 不影響 localStorage）

## F. Functional Smoke（真實瀏覽器 · 9/9）

- Home：✅ 版本顯示 V21.7d、導覽正常
- 頁面：✅ 行程(days)／住宿(hotels)／訂位(bookings)／待確認(pending)／行李(luggage)／緊急(emergency)
  及 shopping／packing／sights／flights 全可開、無空白頁；Day 頁 timeline 可讀
- Day 8 A/B：✅ 選 A→reload=A、改 B→reload=B（不因 SW 更新丟失）
- Checklist：✅ 切換 + reload 保留
- Bookings：✅ filter 切換 + reload 保留
- Pending：✅ 狀態切換 + reload 保留
- Luggage：✅ receipt 含特殊字元 + reload 保留，DOM 顯示已 escape（無原始 `<b>`）
- 無空白頁、無 uncaught exception、無舊版資產混用、無 CSS 遺失

## G. Invalid Storage Recovery（真實瀏覽器 · 7/7）

- Plan Choice `C`：✅ reload 不空白、視同未選(null)、無效 key 清理
- `swiss_checks` = `{bad`：✅ 網站仍啟動、checklist 安全清理、不影響其他 key
- Bookings filter `junk`：✅ 回退 `all`、清自己的 key
- Pending `junk`：✅ 回退 `unconfirmed`、只清自己的 pending key
- 隔離：✅ 合法 `pending_keep=done` 未受影響
- 測試後已恢復乾淨資料（未於環境殘留破壞值）

## H. Offline Result（真實瀏覽器 · 4/4）

- 以「關閉本機 server → loopback 連線被拒」模擬真實離線（Playwright setOffline 不作用於 loopback）
- 離線重開 root「/」：✅ 由 cache 服務 index.html + 資產，app 正常啟動、非空白
- 離線深層 navigate：✅ SW document fallback 回 `index.html`（HTTP 200）
- 離線取用已快取 `app.js`：✅ 200（修正版）
- 離線取用未快取資產：✅ SW 回 **503**
- 外部資源（Google Fonts）離線失敗但站以 system-font fallback 保持可讀

## I. Device／Production Result

- Desktop（headless Chromium / localhost）：✅ 如上 A–H
- iPhone Safari PWA：**Not Tested**（無真機；不得以桌面模擬取代）
- Android Chrome PWA：**Not Tested**（無真機）
- Vercel／Production：**Not Tested**（無正式部署權限；localhost 非 Vercel，不得只測本機宣稱 Vercel Passed）
- Multi-tab 升級接管：**Not Tested**

## J. Issues Found

- Critical：無
- High：無
- Medium／Low（僅記錄，未改程式）：離線「直接輸入深層路徑」時，SW 於 SW 層正確回 `index.html`（200），
  但 `index.html` 相對資產路徑（`./app.js`）於深層路徑會 mis-resolve，app 不重啟。本站為 hash 路由、
  部署於 origin root，正常使用（含離線重開 root）不受影響——非本輪回退、非部署阻擋。
  可選未來硬化：資產改絕對路徑或加 `<base href="/">`。

> **No material deployment issues found.**（無 Critical／High 部署問題。）

## K. Remaining Limitations（Not Tested）

真機 iPhone Safari PWA、真機 Android Chrome PWA、Vercel／正式 hosting 部署、真實行動網路離線、
真實歷史使用者裝置、Multi-tab 升級接管。headless Chromium/localhost 屬真實 SW 環境但不等同上述。

### 使用者手動驗收 runbook（需真機／正式部署時）

1. **Vercel 部署**：部署 final package → 開啟 production URL → DevTools ▸ Network 確認 `sw.js` 200 且含
   `swiss-trip-v21-7d-final-2027`、`app.js` 含 `safeStorageGet`；Application ▸ Service Workers 顯示 activated；
   Cache Storage 出現 `swiss-trip-v21-7d-final-2027` 且含 6 項資產；無 404、scope 為 `/`。
2. **既有 PWA 升級**：於曾開過初次 V21.7d 的裝置／profile，直接重新載入 production URL（**勿按 Clear Site Data**）；
   等候 installing→waiting→activated（必要時多重整一次）；確認舊 `swiss-trip-v21-7d-2027` 消失、final cache 建立、
   頁面改用新 `app.js`、既有勾選／方案選擇（localStorage）仍在。
3. **iPhone**：Safari 開站 → 分享 ▸ 加入主畫面 → 由主畫面啟動（standalone）→ 首頁正常、飛航模式可離線開啟 root。
4. **Android**：Chrome 開站 → 安裝 PWA → 由主畫面啟動 → 同上離線驗證。

## L. Final Declaration

Fresh Install 與 Existing PWA Upgrade 均已於真實瀏覽器實際完成，且無 Critical／High 問題：

> **V21.7d Post-Deployment Real-Environment Acceptance 已通過。網站版本維持 V21.7d，既有 PWA 已在真實測試環境
> 成功升級至 `swiss-trip-v21-7d-final-2027`，舊 cache 已移除，最新資產、localStorage 狀態與離線主流程均正常。**

範圍界定：上述真實驗收於 headless Chromium／localhost secure context 完成；真機 iPhone/Android PWA 與
Vercel production 部署仍為 Not Tested，須依上方 runbook 由使用者於真機／正式環境完成。
本輪未修改任何程式、未升版、未再改 cache revision。
