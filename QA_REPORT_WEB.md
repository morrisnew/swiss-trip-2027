# QA_REPORT_WEB.md · V21.7d Web · Final Storage Integrity Seal QA

- 行程資料母版：**Excel V21.4a**（未變動）
- Web 版本：**V21.7d Web · 基於 V21.4a 行程資料**（正式封版；版本字串未升級）
- Service Worker cache（current revision）：**`swiss-trip-v21-7d-final-2027`**
  （初次 V21.7d cache＝`swiss-trip-v21-7d-2027`，本輪 deployment revision 已改為 final 並於 activate 移除）
- 航班狀態：**current_reference**（無 booked）
- 執行日期：2026/7

**QA 誠信原則**（延續 V21.6/V21.7c）：只有真的執行過的才寫 Passed；未執行一律標 **Not Tested**。
不因「程式碼看起來存在」就標成「功能已驗證」；不只靠字串搜尋宣稱 Passed；不因 wrapper 存在就標頁面已實測；
不因 cache 名稱已改就宣稱真實裝置升級已通過。

---

## ★ V21.7d Post-Deployment Real-Environment Acceptance（本輪 · 真實瀏覽器驗收）

**環境**：真實 headless **Chromium 141.0.7390.37**（Linux）於 `http://127.0.0.1`（localhost secure context）
載入 final package，執行**真正的 Service Worker 生命週期與 Cache Storage**——非 mock、非 jsdom。
新舊環境皆為同一 Chromium profile 中人工 seeded，非真實歷史使用者裝置。
（可用 `realbrowser_acceptance.js` 重現，需 Playwright + Chromium。）

**結果：真實瀏覽器驗收 40/40 全數通過。**

| 階段 | 實測結果（真實瀏覽器）|
|---|---|
| A. Fresh Install（10） | ✅ SW registered + active=**activated**；建立 `swiss-trip-v21-7d-final-2027`，含 `/ /index.html /app.js /data.js /style.css /manifest.json` 6 項；無舊 cache；reload 後受 SW 控制；無 app uncaught error（外部 Google Fonts 403／favicon 404 屬環境限制，不列入） |
| B. Existing PWA Upgrade（10） | ✅ 升級前有舊 `swiss-trip-v21-7d-2027`、服務未修正 app.js（無 `safeStorageGet`）、受舊 SW 控制；部署 final 後（**不清 site data**，僅 `registration.update()` + reload）→ 建立 final cache、**刪除舊 cache**、服務的 app.js 變為修正版（含 `safeStorageGet` 及全站 helpers）、受新 SW 控制；**既有 localStorage（swiss_checks/plan/filter/pending/luggage）全數保留** |
| D. Functional Smoke（9） | ✅ 版本顯示 V21.7d；行程/住宿/訂位/待確認/行李/緊急等頁全可開、無空白；Day 頁可讀；Day 8 A/B 選 A→reload=A、改 B→reload=B；checklist／bookings filter／pending／luggage 特殊字元皆 reload 保留且 escape 正確；無 uncaught error |
| E. Invalid Storage Recovery（7） | ✅ 注入 plan `C`／malformed `swiss_checks`（`{bad`）／bookings `junk`／pending `junk` → reload 不空白；分別回退 未選(null)／安全清理／`all`／`unconfirmed`，各自只清自己的 key；合法 `pending_keep` 未受影響；無 uncaught error |
| C. Offline（4） | ✅ 關閉 server 使 loopback 真正中斷後：離線重開 root「/」app 正常啟動；離線深層 navigate → SW document fallback 回 `index.html`（HTTP 200）；離線取用已快取 app.js → 200 修正版；離線取用未快取資產 → **503** |

**§7 Origin 內容檢查（localhost origin，非 Vercel）**：伺服器實際回傳 `/sw.js`（含 `swiss-trip-v21-7d-final-2027`）、
`/app.js`（含 `safeStorageGet`）、`/index.html`、`/data.js`、`/manifest.json` 皆 HTTP 200、MIME 合理，缺檔 → 404。

**Not Tested（真實裝置/正式部署）**：真機 **iPhone Safari PWA**、真機 **Android Chrome PWA**、
**Vercel production 部署**（CDN／HTTPS origin／build output）、真實行動網路離線、真實歷史使用者裝置、
**Multi-tab** 升級接管。以上一律標 Not Tested（headless Chromium/localhost 非上述環境；桌面不代表真機、
localhost 不代表 Vercel）。詳見 `V21_7D_POST_DEPLOYMENT_REAL_ENV_ACCEPTANCE_SUMMARY.md` 之手動 runbook。

**Minor 觀察（非阻擋、非本輪回退，未改程式）**：離線直接輸入「深層路徑」時，SW 於 SW 層正確回 `index.html`（200），
但因 `index.html` 使用相對資產路徑（`./app.js`），深層路徑下相對路徑會 mis-resolve 而 app 不重啟。本站為 hash 路由、
部署於 origin root，正常使用（含離線重開 root）不受影響；如未來要支援深層路徑直入離線，可改為絕對路徑或加 `<base href="/">`。

**本輪未修改任何程式檔（無 Critical 部署阻擋問題）。**

---

## ★ V21.7d Final Deployment Cache Revision（Service Worker deployment revision）

**Deployment Issue Reproduction**：In-Place Correction 後的 `app.js` 已與初次 V21.7d 不同，但
`sw.js` 與其 `CACHE_NAME`（`swiss-trip-v21-7d-2027`）仍與初次 V21.7d 相同。Service Worker 採
cache-first，若初次 V21.7d 曾部署／安裝，瀏覽器可能判定 `sw.js` 未更新、**不重跑 install /
`cache.addAll`**，既有 PWA 使用者仍讀舊 cache 中的初次 `app.js`，全站 storage 修正只對新訪客生效。

**Revision Change**：`sw.js` `CACHE_NAME` `swiss-trip-v21-7d-2027` → **`swiss-trip-v21-7d-final-2027`**，
並加 `V21.7d Final Deployment Revision` 註解；`sw.js` 位元內容因此與初次 V21.7d 不同 →
瀏覽器偵測新 SW script → install → 新 cache 重跑 `cache.addAll(ASSETS)` → activate 刪舊 cache。
**網站版本字串未升級**（`TRIP_META.version` 維持 V21.7d）；同版、不同 deployment revision。

### Install / Activate / Fetch（✅ 真的執行 · mock · `scenario_tests_service_worker_revision.js` 45/45）
| 面向 | 實際結果 |
|---|---|
| Install | ✅ 開啟新 cache `swiss-trip-v21-7d-final-2027`／`cache.addAll(ASSETS)`（6 項含 `./app.js`）／`skipWaiting` |
| Install 失敗 | ✅ `addAll` reject → install promise **reject**（不吞掉 precache error） |
| Activate 遷移 | ✅ 刪除初次 `swiss-trip-v21-7d-2027` 與更舊 `swiss-trip-v21-7c-2027`／**保留 final cache**／`clients.claim()` |
| Fetch | ✅ 同源 cache hit 用 cached／cache miss fetch 後 put 進 final cache／跨域不攔截／非 GET 不攔截／navigate 離線 fallback `./index.html`／非 document 離線 503 |
| Package integrity | ✅ `./app.js` 在 ASSETS；交付 `app.js` 含 `safeStorageGet`／`normalizeBookingsFilter`／`normalizePendingState`／`getLuggageReceipt`（最新修正版，非初次 V21.7d 舊檔） |

> 以上為 Node mock 單元測試（實跑正式 `sw.js` 的 install/activate/fetch handler）。
> **真實瀏覽器 Service Worker 升級／iPhone/Android PWA／Vercel 部署／真實離線＝Not Tested**（見 §7）。

---

## ★ V21.7d In-Place Final Seal Correction（全站 storage consumer 安全化）

**背景**：V21.7d 初次 Seal 只完成 Plan Choice 與 `swiss_checks`；獨立驗收發現其餘直接使用
`localStorage` 的頁面／事件（bookings filter／pending state／luggage receipt）在 `getItem()`
拋 `SecurityError` 時會 throw、中斷 render。於**同一 V21.7d**就地補正（不升版、不改行程）。

### 重現（✅ 真的執行 · jsdom 以拋 SecurityError 的 localStorage 直接跑正式函式）
| 函式 | 未修正 V21.7d |
|---|---|
| `renderBookings()` | 🔴 throw `SecurityError` |
| `renderPending()` | 🔴 throw `SecurityError` |
| `renderLuggage()` | 🔴 throw `SecurityError` |

### 修正（共用 Safe Storage Layer + enum helpers）
`safeStorageGet/Set/Remove`（get 例外→fallback、set/remove 例外→false、無 `clear()`）；
`bookings_filter`（enum `all/open/must/important/suggest/track`，fallback `all`）；
`pending_<id>`（enum `unconfirmed/confirmed/done`，fallback `unconfirmed`）；
`luggage_receipt_<id>`（自由文字，fallback `""`，escape 不變）。render 與 handler 全改用 helper。

### Direct Render Sweep（✅ 真的執行 · 修正後 · jsdom getItem→SecurityError）
| Function | getItem throw | 實際結果 |
|---|---|---|
| `renderBookings()` | SecurityError | ✅ 不 throw／回退 `all`／回傳 HTML |
| `renderPending()` | SecurityError | ✅ 不 throw／全部回退 `unconfirmed`／回傳 HTML |
| `renderLuggage()` | SecurityError | ✅ 不 throw／receipt 回退 `""`／回傳 HTML（escape 無 regression） |

### Write Handler Sweep（✅ 真的執行 · 修正後 · setItem→SecurityError）
`saveBookingsFilter`／`setPendingState`／`setLuggageReceipt` 於 `setItem()` 拋錯時皆**不 throw、回 false**，
不影響其他 key、不呼叫 `localStorage.clear()`。

### 正式 runtime storage 盤點
`app.js` 全站 `localStorage.getItem/setItem/removeItem` 現只出現於具 try/catch 的函式內：
`safeStorageGet/Set/Remove`（安全層）、`loadCheckedItems/removeChecksKeySafe/saveChecks`（swiss_checks）、
`getPlanChoice/setPlanChoice`（plan choice）。**無未受保護的正式 runtime localStorage 存取。**

---

## 0. Baseline Confirmation（✅ 真的執行）

輸入包確認為 V21.7c：

| 檢查 | 值 | 判定 |
|---|---|---|
| 輸入 `TRIP_META.version`（改動前） | `V21.7c Web · 基於 V21.4a 行程資料` | ✅ |
| 輸入 `CACHE_NAME`（改動前） | `swiss-trip-v21-7c-2027` | ✅ |
| `app.js` 已含 V21.7c 驗證器與 Plan Lifecycle | `resolveValidPlanChoice`／`normalizePlanChoice`／`getPlanChoice`／`setPlanChoice`／`allPlanChoices`／`planRoleTimeKeys`／`planActivationStartMin`／`planActivationEndMin`／`planLifecyclePhase`／`findCurrentAndNext` 皆在 | ✅ |
| 已有 `scenario_tests_day8_plan_lifecycle.js` / `scenario_tests_plan_choice_storage.js` | 皆在 | ✅ |
| 改動前既有測試（實跑） | today 17/17・corpus Critical 0・baseline 138/138・lifecycle 48/48・plan_choice 84/84 | ✅ 已於改動前實跑 |

---

## 1. Independent Reproduction（✅ 真的執行 · 根因）

於**未修改的 V21.7c `app.js`** 上抽出對應函式重現三個 storage integrity 缺口：

### 問題 1 · 非字串 coercion
`resolveValidPlanChoice()` 內 `const key = String(value)` 使非字串被強制轉型：

| 傳入值 | V21.7c 結果 |
|---|---|
| `new String("A")` | **`"A"` 🔴（誤判為有效）** |
| `["A"]` | **`"A"` 🔴** |
| `{ toString:()=>"A" }` | **`"A"` 🔴** |

### 問題 2 · 空字串未清理
`getPlanChoice()` 以 `raw === ""` 直接 `return null`：storage key `""` 讀取後
**仍殘留**（重現：`before === after`，key 未被移除）。

### 問題 3 · 損壞 `swiss_checks` 阻止啟動
`State` literal `checkedItems: JSON.parse(localStorage.getItem("swiss_checks") || "{}")`：

| swiss_checks | V21.7c 結果 |
|---|---|
| `"{bad"` | **`JSON.parse` 拋 `SyntaxError` → `app.js` 初始化中止 🔴** |
| `"null"` | `checkedItems` 為 `null` → 後續 `checkedItems[key]` 拋錯 🔴 |

---

## 2. Strict Validation Flow（✅ 真的執行）

- **primitive string check**：`resolveValidPlanChoice()` 改用 `typeof value !== "string"` 直接排除，
  移除 `String(value)`；`value.length === 0` 排除空字串。Array／Object／`new String("A")`／
  Number／Boolean／Function／Symbol／BigInt／`null`／`undefined` 一律 `null`。
- **option existence check**：比對時 `option.key` 本身亦須為 string 且 `=== value`；動態比對現有
  options，generic 不 hardcode A／B。
- **invalid cleanup**：`getPlanChoice()` 只把 `null`／`undefined` 當「真正不存在」；
  `""`／`" "`／`"C"`／`"legacy"`／`"undefined"` 交由驗證器落空後**只移除該 plan 自己的 storageKey**，
  回傳 `null`；`getItem`／`removeItem` 例外皆安全處理，不拋例外。
- **defensive Today validation**：`findCurrentAndNext()` 對直接傳入的 `opts.planChoices` 以同一
  `resolveValidPlanChoice` 逐一驗證；非字串／無效值視同未選，Active Window → `plan_unselected`，不展開 A。

---

## 3. Checklist Recovery Flow（✅ 真的執行）

新增 `loadCheckedItems()`（策略 A：只保留合法 boolean），資料流：

1. **safe read** — `getItem` try/catch，例外 → `{}`（網站仍啟動）。
2. **safe parse** — `JSON.parse` try/catch；損壞（含 `""`）→ 只移除 `swiss_checks` → `{}`。
3. **object validation** — 必須非 `null`、`typeof === "object"`、非 Array；否則清除 `swiss_checks` → `{}`。
4. **boolean-entry sanitization** — 只保留 string key + boolean value 的 own enumerable entries。
5. **safe cleanup** — 任何無效情況只移除 `swiss_checks`，絕不 `localStorage.clear()`。
6. **safe save** — `saveChecks()` 的 `JSON.stringify` + `setItem` 皆 try/catch；成功 `true`／失敗 `false`；
   QuotaExceededError／SecurityError／cyclic object 皆不拋例外。
   `State.checkedItems` 改為 `loadCheckedItems()`；`toggleCheck()`／`isChecked()` 面對異常 State
   （`null`／Array／primitive）先恢復或安全回 `false`，絕不 throw。

---

## 4. Storage Isolation Table（✅ 真的執行）

| 錯誤情況 | 只清理 | 保留 |
|---|---|---|
| plan choice `""`／`" "`／`"C"`／`"legacy"` | 該 plan 的 `storageKey` | `swiss_checks`／其他 plan choice／PENDING／任意 key |
| `swiss_checks` 損壞 JSON／`null`／Array／primitive | `swiss_checks` | 所有 plan choice／其他 key |
| 有效 `"A"`／`"B"`／有效 checklist | （不清理） | 全部保留 |

storage_integrity §2 實測：清除 Day 8 無效 `C` 後，`swiss_checks`／`planchoice_other_plan`／
`pending_something`／`arbitrary_key` 全數保留，key 數量僅少 1（未整站清除）。

---

## 5. Test Results（✅ 真的執行 · 實際數量）

### 5-A. Static Checks
| 指令 | 結果 |
|---|---|
| `node --check data.js` | ✅ OK |
| `node --check app.js` | ✅ OK |
| `node --check sw.js` | ✅ OK |

### 5-B. Existing Regression Tests（無 regression）
| 指令 | 結果 | 備註 |
|---|---|---|
| `node scenario_tests_today_engine.js` | ✅ **17/17** | 七態全覆蓋，未回退 |
| `node scenario_tests_real_itinerary.js` | ✅ **Critical 0 / Warning 0 / Info 0** | Day 1–11 corpus |
| `node scenario_tests_data_baseline.js` | ✅ **164/164** | 版本 V21.7d；V21.7c 歷史 guard；Final Seal + In-Place 守門；**current cache expectation → `swiss-trip-v21-7d-final-2027`** |
| `node scenario_tests_day8_plan_lifecycle.js` | ✅ **48/48** | Plan Lifecycle 三階段未回退 |
| `node scenario_tests_plan_choice_storage.js` | ✅ **84/84** | V21.7c 驗證行為未回退（strict 型別相容） |

### 5-C. Storage Integrity Tests（初次 Seal）
```
node scenario_tests_storage_integrity.js  → ✅ PASSED · 103/103
```
分區：Strict Plan Choice Type Validation（含 `new String`／Array／Symbol／BigInt 等 + findCurrentAndNext 防禦）｜
Empty/Invalid Plan Choice Cleanup + Key Isolation｜Checklist Storage（normal／missing／empty／
malformed／null／Array／primitive／mixed／getItem/removeItem/setItem/stringify 例外）｜
toggleCheck/isChecked 異常 State 防禦｜全域禁令守門。

### 5-C3. Service Worker Revision Tests（Cache Revision 本輪新增）
```
node scenario_tests_service_worker_revision.js  → ✅ PASSED · 45/45
```
直接載入並執行正式 `sw.js` 的 install/activate/fetch handler（mock caches/fetch/self）。分區：
Static revision（CACHE_NAME=final、不接受舊 cache 為 current、ASSETS 完整）｜Package integrity guard
（`./app.js` 在 ASSETS + `safeStorageGet`/`normalizeBookingsFilter`/`normalizePendingState`/`getLuggageReceipt`）｜
Install（開新 cache、`addAll(ASSETS)`、`skipWaiting`、addAll 失敗 reject）｜Activate migration
（刪初次 v21-7d 與 v21-7c、保留 final、`clients.claim`）｜Fetch regression（cache hit/miss + put、跨域、
非 GET、navigate 離線 fallback、非 document 503）｜架構守門（未回退為 network-first 等）。

### 5-C2. Storage Consumers Tests（In-Place Correction 本輪新增）
```
node scenario_tests_storage_consumers.js  → ✅ PASSED · 84/84（plain node）｜90/90（含 jsdom render sweep）
```
直接抽取／執行正式 `app.js` 函式。分區：安全集合守門｜Safe Storage Layer（get/set/remove 例外）｜
Bookings filter（normalize/load/save · enum · missing/例外/無效/空字串 · cleanup 隔離）｜
Pending state（同上 + key 命名 `pending_<id>`）｜Luggage receipt（missing/例外/自由文字/特殊字元/寫入失敗隔離）｜
全站 getItem/setItem/removeItem exception sweep｜Key Isolation（只清自己的 key、無 `clear()`）｜
（jsdom 可用時）直接跑正式 `renderBookings/renderPending/renderLuggage` 於 getItem→SecurityError 不 throw
+ escaping 無 regression + write handler setItem→throw 不 throw。plain node 環境自動 SKIP jsdom 區段（+6）。

### 5-D. Browser Smoke Test（jsdom headless DOM · 非真實瀏覽器）
```
node _smoke.js  → ✅ 25/25（jsdom headless DOM）
```
以 jsdom 載入 `index.html` 版型 + `data.js` + `app.js` 實際執行，涵蓋 §21 之：

| §21 項目 | jsdom 結果 |
|---|---|
| 1. 首頁正常載入 | ✅ Passed（#appbar/#app/#nav 皆渲染） |
| 2. Console 無 uncaught error | ✅ Passed（各情境 0 error；jsdom `Not implemented` 通知不列為錯誤） |
| 3. Bookings 頁可開 | ✅ Passed（`navigate('bookings')` → #app 非空、無 error） |
| 4. Pending 頁可開 | ✅ Passed（`navigate('pending')`） |
| 5. Luggage 頁可開 | ✅ Passed（`navigate('luggage')`） |
| 6. Day 8 A/B 可操作 | ✅ Passed（setPlanChoice→getPlanChoice roundtrip） |
| 7. Checklist 可操作 | ✅ Passed（toggleCheck → isChecked true） |
| 8. reload 後有效資料保留 | ✅ Passed（filter must／pending confirmed／plan B／checklist keepme 全保留） |
| 9. 注入 invalid filter/pending/plan 後 reload → 安全回退 | ✅ Passed（→ all／unconfirmed／null，清無效 key，swiss_checks 保留） |
| 10. 注入 malformed `swiss_checks` 後 reload → 仍可開 | ✅ Passed（`"{bad"` 無 error、已清除、三頁仍可開） |

> jsdom 為 headless DOM，非真實瀏覽器；上表「Passed」限 jsdom 層級。真實瀏覽器／PWA／部署見 §7。
> jsdom `scrollTo`／`window.open` 等 `Not implemented` 屬環境限制（真實瀏覽器可正常運作），不列為 app 錯誤。

---

## 6. Regression Guard（✅ 真的執行）

以下 V21.7c 已確認結論本輪未回退（由 data_baseline 151/151 + lifecycle 48/48 +
plan_choice 84/84 + storage_integrity 103/103 覆蓋）：

| 項目 | 狀態 | 依據 |
|---|---|---|
| Excel V21.4a itinerary baseline（不退 V21.3b） | ✅ | data_baseline |
| Today Engine 七態 | ✅ | today 17/17 |
| Plan Activation（分流前共同行程） | ✅ | lifecycle 48/48 |
| Plan Deactivation（分流後恢復共同行程） | ✅ | lifecycle 48/48 |
| Day 8 A/B 展開（有效 A/B 完整保留） | ✅ | storage_integrity §1 對照 + plan_choice 84/84 |
| V21.7c Plan Choice Storage Validation（`C`≡未選、key 隔離） | ✅ | plan_choice 84/84 + storage_integrity §2 |
| BRB / BRB_DERIVED / SSoT / conditional ticketing | ✅ | data_baseline（未觸碰 BRB 資料） |
| Flight `current_reference` / T-90/T-60/T-20 | ✅ | data_baseline（未觸碰航班） |
| ETIAS 4 大 1 小 / STP baseline | ✅ | data_baseline（未觸碰） |
| Hotels：KoBi confirmed / Sans Souci user_confirmation_required | ✅ | data_baseline（未觸碰） |
| SBB per-station handling | ✅ | data_baseline（未觸碰） |
| Day 6 Mürren / Allmendhubel 主線 | ✅ | corpus 專項檢查 |
| Service Worker all-or-nothing precache + activate 清 cache | ✅ | data_baseline（僅升 cache 名） |
| localStorage `storageKey`（`planchoice_day8_spb_descent`／`swiss_checks`）未改 | ✅ | data_baseline + storage_integrity §5 |
| 全站無 `localStorage.clear()` | ✅ | data_baseline + storage_integrity 靜態守門 |

---

## 7. Remaining Limitations（❌ Not Tested）

**本輪除 Node mock（SW revision）與 jsdom headless DOM smoke 外，未開真實瀏覽器、未用實機、未部署。以下一律標 Not Tested。**

- **真實瀏覽器 Service Worker 升級**：未在真實 Chromium/Safari 實測初次 `swiss-trip-v21-7d-2027`
  → `swiss-trip-v21-7d-final-2027` 的 SW 偵測／install／新 cache 建立／舊 cache 刪除／頁面重載後
  改用新 `app.js` 的實際時機（本輪僅以 Node mock 驗證 install/activate/fetch 邏輯）。
- **真實瀏覽器 E2E**：未在 Chrome/Safari 實機操作 Day 頁導覽點擊、Day 8 A/B selector 點擊。
- **iPhone PWA 升級**：未在 iOS Safari 加到主畫面／離線開啟／飛航模式重新整理／SW 升級。
- **Android PWA 升級**：未在 Android Chrome PWA 測試 SW 升級。
- **Vercel Deployment**：未實際部署，未測 build／CDN 快取／新 CACHE_NAME 於行動端的更新時機。
- **真實離線模式**：未在真實裝置測離線 fallback。
- **多台家人手機**：未測多裝置 localStorage／cache 升級的實際行為。

> 不因 cache 名稱已改就宣稱真實裝置升級已通過——真實升級鏈屬 Not Tested。

---

## 8. 成功標準核對（Final Deployment Cache Revision · §17 · 18 項）

| # | 標準 | 狀態 | 依據 |
|---|---|---|---|
| 1 | 網站版本維持 V21.7d | ✅ | `TRIP_META.version` 未變、無 V21.7e/V21.8（data_baseline） |
| 2 | `CACHE_NAME` 更新為 `swiss-trip-v21-7d-final-2027` | ✅ | sw.js + data_baseline current cache guard + sw_revision §1 |
| 3 | `sw.js` 與初次 V21.7d 位元內容不同 | ✅ | cache 名 + 註解變更（Old→New），瀏覽器可偵測新 SW script |
| 4 | 新 Service Worker 能觸發 install | ✅ | sw_revision §3（開新 cache、addAll、skipWaiting） |
| 5 | `cache.addAll(ASSETS)` 保留 | ✅ | sw.js + sw_revision §3/§6 |
| 6 | Precache 失敗仍 reject | ✅ | sw_revision §3（addAll fail → install reject，不吞錯） |
| 7 | Activate 刪除舊 V21.7d cache | ✅ | sw_revision §4（刪 `swiss-trip-v21-7d-2027` 與 v21-7c） |
| 8 | Activate 保留新 final cache | ✅ | sw_revision §4（final 未被刪除） |
| 9 | `clients.claim()` 保留 | ✅ | sw.js + sw_revision §4/§6 |
| 10 | Fetch strategy 未回退 | ✅ | sw_revision §5/§6（cache-first、GET-only、跨域不攔截、fallback、503；未改 network-first） |
| 11 | 最新修正版 `app.js` 納入 ASSETS | ✅ | sw_revision §1/§2（`./app.js` 在 ASSETS + 修正函式存在） |
| 12 | 所有既有 regression tests 通過 | ✅ | today 17／corpus Critical 0／baseline 164／lifecycle 48／plan_choice 84／storage_integrity 103／storage_consumers 90 |
| 13 | 新 Service Worker revision tests 通過 | ✅ | sw_revision 45/45 |
| 14 | 文件與 current test expectation 使用新 cache revision | ✅ | data_baseline current guard + CHANGELOG/QA/summary |
| 15 | 舊 cache 名稱只存在於歷史／migration context | ✅ | Residual Scan：舊名僅於 sw.js 註解、activate migration fixture、負向 guard、歷史文件 |
| 16 | 不產生 V21.7e | ✅ | 程式/測試檔無 V21.7e/V21.8；僅文件負面提及 |
| 17 | 沒有修改行程與網站功能 | ✅ | app.js/data.js/index.html/style.css/manifest.json/vercel.json 未變動 |
| 18 | 沒有新的 Critical 或 High issue | ✅ | 全 8 套件綠燈、無 regression |

---

## 9. 結論

- Static ✅・today **17/17**・corpus **Critical 0**・baseline **164/164**・lifecycle **48/48**・
  plan_choice **84/84**・storage_integrity **103/103**・storage_consumers **90/90（84 plain）**・
  **sw_revision 45/45**・jsdom §21 smoke **25/25**。
- 部署層問題（修正後 `app.js` 已變、但 `sw.js`／`CACHE_NAME` 與初次 V21.7d 相同，cache-first 下既有
  PWA 可能不重跑 install）已修正：`CACHE_NAME` `swiss-trip-v21-7d-2027` → `swiss-trip-v21-7d-final-2027`，
  install/activate/fetch 以 Node mock 驗證（開新 cache、addAll 失敗 reject、刪舊留新 + claim、fetch 未回退）。
- **網站版本字串維持 V21.7d**（同版、不同 deployment revision）；未修改行程／UI／Today Engine／
  Plan Lifecycle／storage consumer／storage key／fetch strategy／all-or-nothing precache。
- §17 成功標準 18 項全部成立。

**H. Browser Upgrade Result：Not Tested。** 真實 Chromium Service Worker upgrade、iPhone/Android PWA
升級、Vercel production 部署、真實離線——本輪未執行（僅 Node mock 驗證邏輯）。不因 cache 名稱已改
就宣稱真實裝置升級已通過。

**V21.7d 已完成 Final Deployment Cache Revision。網站版本維持 V21.7d，Service Worker revision 已更新為
`swiss-trip-v21-7d-final-2027`，既有 PWA 已具備取得最終修正版資產的更新觸發條件。** 本版可直接部署至
Vercel；不衍生 V21.7e。（全站 localStorage consumer 安全化已於 In-Place Correction 完成並未回退。）
