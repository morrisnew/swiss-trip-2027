# CHANGELOG_WEB.md · V21.7d Web · 基於 Excel V21.4a 行程資料

- 行程資料母版：**Excel V21.4a**（未變動）
- Web 版本：**V21.7d**（正式封版 · Final Storage Integrity Seal）— 版本字串未變
- Service Worker cache（current revision）：**`swiss-trip-v21-7d-final-2027`**
  （初次 V21.7d cache＝`swiss-trip-v21-7d-2027`，已改為 final revision 並於 activate 移除）
- 航班狀態：**current_reference**（未改為 booked）
- 日期：2026/7

> **V21.7d 定位：Final Storage Integrity Seal（正式封版）。**
> 重點為：**strict primitive-string plan choice validation**、**empty invalid choice cleanup**、
> **safe checklist load（`loadCheckedItems`）**、**checklist data sanitization（只留合法 boolean）**、
> **safe checklist save（`saveChecks` try/catch）**、**storage integrity regression tests**，
> （就地補正）**全站其餘 storage consumer 安全化**（bookings filter／pending state／luggage receipt），
> 以及（部署補正）**Service Worker deployment cache revision**（觸發既有 PWA 取得最新修正資產）。
> 不是行程重新規劃、不是 Excel 資料更新、不是 UI 改版、不是網站架構重構、不是新功能開發。
> V21.6 七態引擎、V21.7a/b Plan Lifecycle、V21.7c Plan Choice Storage Validation、BRB、
> FLIGHT_ITINERARY、ETIAS/STP、住宿狀態、SW all-or-nothing、既有 storageKey **全部保留未回退**。
> 本輪完成並通過全部測試後，**V21.7d 作為正式封版，不再衍生 V21.7e**（網站版本字串維持 V21.7d）。

---

## V21.7d · Final Deployment Cache Revision（同版 · Service Worker deployment revision）

> **背景**：In-Place Correction 後的 `app.js` 已與初次 V21.7d 不同，但 `sw.js` 與其 `CACHE_NAME`
> 仍與初次 V21.7d 相同。Service Worker 採 cache-first，若初次 V21.7d 曾部署／安裝，瀏覽器可能
> 判定 `sw.js` 未更新、不重跑 install/`cache.addAll`，導致既有 PWA 使用者仍使用舊 cache 中的
> 初次 `app.js`，全站 storage 修正只對新訪客生效。本輪封住既有 PWA 的升級路徑。

**唯一核心修正**（`sw.js`）：

| | 值 |
|---|---|
| Old（初次 V21.7d cache） | `swiss-trip-v21-7d-2027` |
| **New（current revision）** | **`swiss-trip-v21-7d-final-2027`** |

- `sw.js` 開頭加上 `V21.7d Final Deployment Revision` 註解；`sw.js` 位元內容因此與初次 V21.7d 不同，
  瀏覽器可偵測到新的 Service Worker script → 觸發 install → 以新 cache 執行 `cache.addAll(ASSETS)`
  重新預載修正後的 `app.js`／`data.js`／`index.html`／`style.css`／`manifest.json` → activate 刪除
  舊 `swiss-trip-v21-7d-2027`（及更舊 cache）→ `clients.claim()`。
- **網站版本字串未升級**（`TRIP_META.version` 維持 `V21.7d Web · 基於 V21.4a 行程資料`）；
  這是同一網站版本、不同 Service Worker deployment revision，**非 V21.7e／V21.8、非新功能**。
- **Service Worker 架構未回退**：install all-or-nothing（precache 失敗 reject，不逐檔吞錯）、
  activate 刪舊 cache + `clients.claim()`、fetch GET-only／跨域不攔截／同源 cache-first／
  網路成功補 cache／navigate 離線 fallback `index.html`／非 document 離線 503——全部保留。
- **未修改**行程資料／Today Engine／Day 8 A/B／Plan Lifecycle／Bookings／Pending／Luggage／
  checklist／BRB／航班／住宿／ETIAS／STP／UI，未更改任何 storage key。

**測試**：新增 `scenario_tests_service_worker_revision.js`（45 項：static revision／package integrity
guard／install mock（含 addAll 失敗 reject）／activate migration（刪舊留新 + claim）／fetch regression
（cache hit/miss、跨域、非 GET、navigate 離線 fallback、非 document 503）／架構守門）。
`scenario_tests_data_baseline.js` current cache expectation 更新為 `swiss-trip-v21-7d-final-2027`（164/164）。
全套件實跑綠燈：today 17／corpus Critical 0／baseline 164／lifecycle 48／plan_choice 84／
storage_integrity 103／storage_consumers 90／sw_revision 45。

---

## V21.7d · In-Place Final Seal Correction（同版就地補正 · 全站 storage consumer 安全化）

> **背景**：V21.7d 初次 Seal 只完成 Plan Choice 與 `swiss_checks` 的 storage integrity；
> 獨立驗收發現 `renderBookings()`／`renderPending()`／`renderLuggage()` 仍直接使用未保護的
> `localStorage`，在 `getItem()` 拋 `SecurityError`（隱私模式／權限）時會 **throw、頁面 render 中斷**。
> 本輪於**同一 V21.7d**就地補正，不升版、不改 cache、不改行程。

**重現（未修正 V21.7d，於 jsdom 以拋 `SecurityError` 的 localStorage 直接執行正式函式）**：
`renderBookings()`／`renderPending()`／`renderLuggage()` 三者皆 **throw `SecurityError`**。

**修正**：

- 新增共用 **Safe Storage Layer**：`safeStorageGet(key, fallback)`／`safeStorageSet(key, value)`／
  `safeStorageRemove(key)`——getItem／setItem／removeItem 例外一律不拋，get 失敗回 caller fallback，
  set／remove 回 true／false；不使用 `localStorage.clear()`、不影響其他 key。
- **Bookings filter**（`bookings_filter`）：`normalizeBookingsFilter`／`loadBookingsFilter`／
  `saveBookingsFilter`。合法集合以實際 UI 為準 = `all／open／must／important／suggest／track`；
  missing／例外／無效／空字串 → `all`；無效值只移除 `bookings_filter`；無效不寫入。
- **Pending state**（`pending_<id>`）：`normalizePendingState`／`getPendingState`／`setPendingState`。
  合法 enum = `unconfirmed／confirmed／done`；missing／例外／無效／空字串 → `unconfirmed`；
  無效值只移除該 `pending_<id>`；key 命名規則不變；無效 enum 不寫入。
- **Luggage receipt**（`luggage_receipt_<id>`）：`getLuggageReceipt`／`setLuggageReceipt`（自由文字，
  不做 enum）。missing／例外 → `""`；寫入例外 → false 不拋；render 端 HTML/attribute escaping 維持不變。
- `renderBookings`／`renderPending`／`renderLuggage` 及對應 filter／pending／luggage 事件 handler
  全部改用上述 helper；`renderPending` 統計亦因 enum 正規化避免 `stats[invalid]` 破值。

**修正後（同 jsdom SecurityError 條件）**：三個 render function 皆**不 throw**、回退 all／unconfirmed／""，
且三類 write handler 於 `setItem()` 拋錯時皆不 throw。正式 runtime 中已無未受保護的 localStorage
get／set／remove（既有 `swiss_checks`／plan choice 仍保留其原本完整 try/catch + validation/cleanup）。

**測試**：新增 `scenario_tests_storage_consumers.js`（plain node 84；jsdom render sweep +6 = 90）；
`scenario_tests_data_baseline.js` 新增 12 項全站 storage 靜態守門（含「正式 runtime 無未受保護 localStorage」）。
全套件實跑綠燈：today 17／corpus Critical 0／baseline 163／lifecycle 48／plan_choice 84／
storage_integrity 103／storage_consumers 90；jsdom §21 smoke 25。

---

## V21.7c → V21.7d · Final Storage Integrity Seal（正式封版）

> 修完目前最後已知的 storage integrity 缺口：**plan choice 嚴格型別驗證**、
> **空字串 plan choice 清理**、**`swiss_checks` 損壞不再阻止網站啟動**。
> generic、不綁 A／B、不綁 Day 8；只處理自己的 storage key，全站無 `localStorage.clear()`。

### 🔴 問題 1 · Plan Choice Validator 強制型別轉換（non-string coercion）

**問題**（V21.7c）：`resolveValidPlanChoice()` 內 `const key = String(value)` 會把非字串
強制轉型，導致以下本非合法字串 option 者被誤判為有效（於未修改的 V21.7c `app.js` 已獨立重現）：

| 傳入值 | V21.7c（String coercion） | V21.7d（strict type） |
|---|---|---|
| `"A"` | `"A"` ✅ | `"A"` ✅ |
| `new String("A")` | **`"A"` 🔴（誤判有效）** | `null` ✅ |
| `["A"]` | **`"A"` 🔴** | `null` ✅ |
| `{ toString:()=>"A" }` | **`"A"` 🔴** | `null` ✅ |
| Number／Boolean／Function／Symbol／BigInt／`{}`／`[]` | 部分被 coerce | 一律 `null` ✅ |

**修正**：`resolveValidPlanChoice()` 改為 **strict primitive-string validation**——
移除 `String(value)`，改用 `typeof value !== "string"` 直接排除；`value.length === 0` 排除空字串；
option 比對時 `option.key` 本身亦須為 string。完全不做隱式／顯式 string coercion，generic 不 hardcode A／B。
`findCurrentAndNext()` 的獨立防禦沿用同一驗證器，故直接傳入 `{ day8_spb:["A"] }`／
`{ day8_spb:new String("A") }` 在 Active Window 一律視為 `plan_unselected`，不展開 A。

### 🔴 問題 2 · 空字串 plan choice 未清理

**問題**（V21.7c）：`getPlanChoice()` 以 `raw === ""` 直接 `return null`，空字串 storage key
**仍殘留在 localStorage**（於未修改的 V21.7c 已重現：before === after，key 未移除）。

**修正**：只有 `raw === null`／`undefined` 才視為「真正不存在」（無需清理）；
`""`／`" "`／`"C"`／`"legacy"`／`"undefined"` 等皆屬「已存在但無效」，交由 `resolveValidPlanChoice`
落空後**只移除該 plan 自己的 storage key**、回傳 `null`；`removeItem` 失敗也不拋例外。

### 🔴 問題 3 · 損壞 `swiss_checks` 阻止網站啟動

**問題**（V21.7c）：`State` literal 直接
`checkedItems: JSON.parse(localStorage.getItem("swiss_checks") || "{}")`——
`"{bad"` 使 `JSON.parse` 拋 `SyntaxError`、中止整個 `app.js` 初始化（已重現）；
`"null"` 使 `checkedItems` 為 `null`，後續 `State.checkedItems[key]` 拋錯；
`getItem` 於隱私模式／`SecurityError` 亦可能讓網站無法啟動。

**修正**：新增 **safe checklist loader** `loadCheckedItems()`（策略 A：只保留合法 boolean）：

1. **safe read** — `getItem` 置於 try/catch，例外 → `{}`（網站仍啟動）。
2. **無資料** — `raw === null`／`undefined` → `{}`。
3. **safe parse** — `JSON.parse` 置於 try/catch；損壞（含 `""`）→ 只移除 `swiss_checks` → `{}`。
4. **結構驗證** — 必須非 `null`、`typeof === "object"`、非 Array；否則清除 `swiss_checks` → `{}`。
5. **entry sanitization** — 只保留 string key + boolean value 的 own enumerable entries
   （`"true"`／`1`／`null`／`{}`／`[]` 等 entry 丟棄）。
6. `State.checkedItems` 改為 `loadCheckedItems()`，不再於 literal 執行未保護的 `JSON.parse`。

並強化 checklist 操作函式：

| 函式 | V21.7d 行為 |
|---|---|
| `saveChecks()` | `JSON.stringify` + `setItem` 皆置於 try/catch；成功 `true` / 失敗 `false`；QuotaExceededError／SecurityError／cyclic object 皆不拋例外，UI 當下勾選仍在記憶體 |
| `ensureCheckedItems()` | 若 `State.checkedItems` 被改成 `null`／Array／primitive，先恢復為安全 object |
| `toggleCheck()` | 先 `ensureCheckedItems()` 再切換，面對異常 State 不拋例外 |
| `isChecked()` | 異常 State 安全回 `false`，絕不 throw；正常語意仍為 `!!State.checkedItems[key]` |

### Storage Key Isolation（本輪嚴格維持）

- Plan choice 無效 → 只移除**該 plan 的 storageKey**。
- Checklist 無效 → 只移除 **`swiss_checks`**。
- 不影響其他 plan choice／PENDING workflow／Day 8 有效 A/B／其他任意 key。
- 全站**無** `localStorage.clear()`。

### 測試

- 新增 **`scenario_tests_storage_integrity.js`**（103 檢查）：strict type validation、
  empty/invalid cleanup + key isolation、checklist safe load/sanitize/save、toggle/isChecked 防禦。
- 既有 `scenario_tests_plan_choice_storage.js`（84）保留，定位不變。
- 全套件實跑綠燈（見 QA_REPORT）：today 17／corpus Critical 0／baseline 151／lifecycle 48／
  plan_choice 84／storage_integrity 103；jsdom headless DOM smoke 17。

---

## V21.7b → V21.7c · Storage Validation Hotfix

> **無效／過期 plan choice 容錯**：修正「localStorage 殘留的無效 option key 被誤認為已選、
> 導致當日方案內容靜默消失」的程式容錯問題。generic、不綁 A／B、不綁 Day 8。

### 🔴 Critical · 無效 Plan Choice 被誤認為已選

**問題**（V21.7b 及更早）：`findCurrentAndNext()` 以 `if (planChoices[refKey])` 判斷是否已選——
任何非空字串（例如 localStorage 殘留的過期 key `C`／`legacy_option`／`"undefined"`）都被當成
**已選**；其後 `def.options.find(o => o.key === chosenKey)` 找不到對應 option 時，plan block 被
**靜默排除**。以真實 Day 8 約 13:00 為例：

| planChoices | 修正前（V21.7b） | 修正後（V21.7c） |
|---|---|---|
| `{}`（未選） | `plan_unselected` ✅ | `plan_unselected` ✅ |
| `{day8_spb:"A"}`（有效） | `in_range` 13:00–14:15 ✅ | `in_range` 13:00–14:15 ✅ |
| `{day8_spb:"C"}`（**無效**） | **`gap`（方案內容消失）🔴** | **`plan_unselected` ✅（≡ 未選）** |

（修正前 bug 已於未修改的 V21.7b `app.js` 上獨立重現：無效 `C` → `gap` / `planUnselected=false`。）

**修正**：建立 **generic Plan Choice Validation**（`app.js`，完全不 hardcode A／B、不綁 day8_spb）。

新增：
- `resolveValidPlanChoice(planDef, value)` — 唯一有效性依據＝該值是否等於某個
  `planDef.options[].key`（動態）。`null`／空字串／過期／不存在／缺 `options`／非法型別
  一律回傳 `null`，且**不拋例外**。
- `normalizePlanChoice(planKey, value)` — 以 planKey 查 `DAY_PLAN_CHOICES` 後委派；
  不存在的 planKey 安全回傳 `null`。

修正既有 localStorage helper：

| 函式 | V21.7c 行為 |
|---|---|
| `getPlanChoice(planKey)` | 讀取後以 `resolveValidPlanChoice` 驗證；無效值**只 `removeItem` 該 plan 自己的 storageKey**（絕不整站清除），回傳 `null`；`getItem`／`removeItem` 例外→安全 `null` |
| `setPlanChoice(planKey, optionKey)` | 寫入前驗證 planKey／planDef／storageKey／optionKey；**拒絕寫入不存在的 option**（回傳 `false`）；`setItem` 例外→安全 `false`，不拋例外 |
| `allPlanChoices()` | 透過 `getPlanChoice` 收集→只回傳通過驗證的方案；無效值自動清理；**單一 plan 無效不影響其他有效 plan** |
| `findCurrentAndNext(tl, opts)` | **獨立防禦**：即使 helper 已驗證，仍以 `resolveValidPlanChoice` 逐一驗證直接傳入的 `opts.planChoices`（unit test／state migration）；無效值**完全視同尚未選定** |

**未變動**：`storageKey` 仍為 `planchoice_day8_spb_descent`；`swiss_checks` 與其他 key 不受牽動；
Plan Lifecycle 三階段（activation 11:15 / deactivation 18:30，由 option SSoT 推導）與已選 A／B
的 activity/lunch/descent/town 展開行為完全保留。

### Day 8 無效值 `C` 行為（真實 timeline · behavioral sweep）

| 時間 | lifecycle phase | state | 說明 |
|---|---|---|---|
| 09:50 | before_activation | `in_range` | 共同 BOB 交通段（無效值＝未選，不遮蔽分流前共同行程） |
| 11:14 | before_activation | `in_range` | 共同 SPB 上山 |
| 11:15 | active_window | `plan_unselected` | 分流窗內未選（非 `gap`） |
| 13:00 | active_window | `plan_unselected` | 同上（修正前為 `gap`） |
| 18:29 | active_window | `plan_unselected` | 分流窗內未選 |
| 18:30 | after_deactivation | `in_range` | 恢復共同自炊晚餐（未破壞 V21.7b deactivation boundary） |
| 19:00 | after_deactivation | `in_range` | 共同自炊晚餐 |
| 21:01 | after_deactivation | `after_all` | 全天結束 |

8/8 與「未選 `{}`」完全一致；`getPlanChoice` 對無效值回傳 `null` 並只清除
`planchoice_day8_spb_descent`（`swiss_checks`／其他 plan choice 保留）。

### 測試

| 測試 | V21.7b | V21.7c |
|---|---|---|
| `node --check data.js / app.js / sw.js` | OK | **OK**（無 regression） |
| `scenario_tests_today_engine.js` | 17/17 | **17/17** |
| `scenario_tests_real_itinerary.js` | Critical 0 | **Critical 0 / Warning 0 / Info 0** |
| `scenario_tests_data_baseline.js` | 127/127 | **138/138**（新增 11 項 V21.7c storage 靜態守門） |
| `scenario_tests_day8_plan_lifecycle.js` | 48/48 | **48/48** |
| `scenario_tests_plan_choice_storage.js` | — | **84/84 · 新增** |

版本／cache／測試顯示名稱／CHANGELOG／QA／summary 均更新至 **V21.7c**；歷史章節保留
V21.7a／V21.7b 標記。

---

## V21.7a → V21.7b · Final Behavioral Hotfix

> **Plan Lifecycle Boundary Fix + Residual Data Cleanup + Final Regression Hardening**
> 不是 Full Audit、不是 UI 重構、不是新功能開發。
> V21.6 / V21.7 / V21.7a 所有架構與 Excel V21.4a baseline 全部保留未回退。

### 🔴 Critical · Plan Deactivation Boundary

**問題**：V21.7a 的 plan lifecycle 只有開始邊界、沒有結束邊界。未選 A/B 時，一旦越過 `activationStart`（Day 8 = 11:15），就**永久**維持 `plan_unselected`，即使方案時段（11:15–18:30）早已結束。Day 8 晚上 19:00 的共用「自炊晚餐 ＋ 早睡備戰」被永久遮蔽，21:01 後也無法正常進入 `after_all`。

**修正**：建立 **generic Plan Lifecycle 三階段模型**（不針對 Day 8 hardcode `18:30`）。

新增 `app.js`：
- `planRoleTimeKeys()` — 共用時間欄位鍵（activity/lunch/descent/town）
- `planActivationEndMin(planDef)` — 預設 `latest_plan_block_end`，取所有 option 最晚 planRole 結束分鐘
- `planLifecyclePhase(planDef, nowMin)` — 回傳 `before_activation` / `active_window` / `after_deactivation`

`findCurrentAndNext()` 改依 phase 判定：

| Phase | 條件 | 行為 |
|---|---|---|
| Before Activation | `now < start` | 排除 planRef，共同行程照常解析 |
| Active Plan Window | `start <= now < end` | `plan_unselected` + `decisionPrompt` |
| After Deactivation | `now >= end` | 排除 planRef，**恢復解析後續共同行程** |

Day 8 邊界自動推導：**Activation 11:15 · Deactivation 18:30**（來自 option A `townTime:"16:30–18:30"` 與 option B `townTime:"16:45–18:30"`）。2027 行程調整時只需改 option 時間，兩邊界自動同步。

**已選 A/B 不受影響**：仍完整依 activity / lunch / descent / town 四個 planRole 展開。

### 🟡 Medium · 餐廳訂位絕對斷言清理

- **Hotel Restaurant Schynige Platte**：`book:"人少不需訂位"` →「原則可現場用餐；2027 出發前確認營運與是否建議訂位」；`plan` 補註「（A 家庭預設方案）」
- **Pilatus Kulm Restaurant**（本輪主動額外找到）：`book:"不需訂位"` → 同上保守敘述

全站「人少」「不需訂位」= **0 hit**。

### 🟢 Low · T-20 SSoT residual（本輪主動額外找到）

`EMIRATES_RULES` 的 `{ label:"T-20｜登機門關閉", value:"15:10" }` 為獨立 hardcode，而 `ZRH_T20_HM` SSoT 已存在（同組 T-90 / T-60 都已引用）。改為 `value:ZRH_T20_HM`。

### 測試

| 測試 | V21.7a | V21.7b |
|---|---|---|
| `scenario_tests_today_engine.js` | 15/15 | **17/17**（新增 S16/S17 deactivation） |
| `scenario_tests_real_itinerary.js` | Critical 0 | **Critical 0**（無 regression） |
| `scenario_tests_data_baseline.js` | 108/108 | **127/127**（新增 19 項） |
| `scenario_tests_day8_prebranch.js` → `scenario_tests_day8_plan_lifecycle.js` | 19/19 | **48/48**（擴充為完整 lifecycle，含 Generic 組 10 項） |

**Behavioral Sweep**：14 個 Day 8 時間點未選 A/B，**14/14 全部正確**。

---

## V21.7 → V21.7a · Corrective Hotfix

> **Independent Behavioral Fix + Data Residual Cleanup + Regression Hardening**
> 不是 Full Audit、不是 UI 重構、不是新功能開發。
> V21.6 / V21.7 所有架構與 Excel V21.4a baseline 全部保留未回退。

### 🔴 Critical · Day 8 Plan Activation Boundary

**問題**：`findCurrentAndNext()` 只要當日 timeline 存在任何 `planRef` 且 A/B 未選，就整天短路回傳 `plan_unselected`，完全不考慮分流點是否已到。使用者早上 07:30 / 08:30 / 09:50 / 10:30 在寄行李、搭 BOB、搭 SPB 時，Today Dashboard 全被「今日方案尚未選定」遮蔽。

**修正**：新增 **Plan Activation Boundary 資料模型**（不使用 fragile hardcode）。

`DAY_PLAN_CHOICES.day8_spb.planActivation`：
- `mode:"earliest_plan_block_start"` — 由所有 option 的 `activityTime` / `lunchTime` / `descentTime` / `townTime` 自動推導最早分流邊界（Day 8 = 11:15）
- `commonScheduleBeforeActivation:true`
- `decisionPrompt` / `boundaryNote`

`app.js` 新增 `planActivationStartMin()`；`findCurrentAndNext()` 重寫：
- 未選且未到邊界 → 該 planRef block 暫不納入解析，**共同行程照常判定**
- 未選且已到邊界 → 才 `plan_unselected` + 顯示 decisionPrompt
- 已選 → 依四個 planRole 展開
- 無法推導邊界 → 退回 V21.6 保守行為

2027 班次調整時只需改 option 時間，邊界自動跟著改。

### 🟠 High · BRB simulated_2026 單一 SSoT

`BRB_SCHEDULE.simulation2026` 原為 V21.5 留下的獨立手寫字串（13:57），與 `BRB_DERIVED.summitArrive`（13:58）及 Day 10 timeline（13:58–15:28）不一致。

改由 `BRB_DERIVED.simulationText` 統一產生後回填 `BRB_SCHEDULE`。schedule card / BRB_DAY_PLAN / BRB_DERIVED / Day 10 timeline / Today Dashboard / user-facing notes 全部由同一 SSoT 推導。

### 🟠 High · BRB 票務語意統一

同頁矛盾（一邊「依所購產品而定」、一邊「建議發車前 20 分鐘完成換票」）全面消除：
- Day 10 標題：「BRB **票務／進站手續** ＋ 上車」
- `BRB_SCHEDULE.note` / `turnstileNote` / Day 10 步驟全部改為條件句
- turnstile「開放通行」明確 ≠「必須此時通過」
- Seat Guarantee 維持 `recommended`（未改 mandatory）

### 🟡 Medium · Day 8 A/B 交叉污染清理

- **Daube 觀景台**：從 A/B 共用 block 移除 → 移入 **B option 專屬**（正式 Panorama Hike 沿線），並加註實際距離依當日步道指標
- **人潮推論**：「遊客密度低：9 月平日山頂人潮相對少」→「實際人潮依天氣、團客、假期與當日營運狀況而定，不以平日／假日推論」
- **SPB 蒸汽班**：移除「9/21 (二) 平日幾乎不會排到蒸汽班」→「蒸汽特別班僅於特定日期運行，本行程不預設搭乘；2027 若公布符合旅行日期的特別班，再另行評估」

### 🟡 Medium · Day 4 時間語意

`11:10–11:50`（40 分鐘）與「車程約 30 分鐘」矛盾。改為：
- title：「世界最陡齒軌**上山 ＋ 抵達轉場緩衝**（現行模擬）」
- 明示本段為【購票／上車 → 齒軌上山 → 抵達下車轉場】整段緩衝，**不是純搭車時間**
- 純齒軌乘車時間約 30 分鐘另列並標 🟡 PENDING 2027
- 加註 11:10 / 11:50 皆為 2026 現行模擬、非 2027 已確認時刻

### 額外主動修正（不在原列 5 項內）

**Medium · 共同段結束但分流點未到時誤報「今日行程已完成」**
撰寫 S15 regression test 時發現：共同 block 結束、plan block 被排除 → 誤判 `after_all`。修正為以分流邊界作為 `next`，狀態正確落在 `gap`。

**Low · PACKING 電話獨立 hardcode**
改為引用 `CONSULATE_CONTACT.emergency` / `.general` SSoT。

### 測試

| 測試 | V21.7 | V21.7a |
|---|---|---|
| `scenario_tests_today_engine.js` | 12/12 | **15/15**（新增 S13/S14/S15） |
| `scenario_tests_real_itinerary.js` | Critical 0 | **Critical 0**（無 regression） |
| `scenario_tests_data_baseline.js` | 76/76 | **108/108**（新增 32 項） |
| `scenario_tests_day8_prebranch.js` | — | **19/19**（新增，真實 Day 8 timeline） |

---

## V21.6 → V21.7 · Excel V21.4a Baseline Migration

### 🚩 住宿狀態（最關鍵修正）

**KoBi Hirschenplatz → CONFIRMED**
- Excel V21.4a 明確 ✅ 已完成訂房並收到 Booking.com 確認信
- `bookingStatus:"confirmed"`；status 改為「✅ 已訂房（已收到確認信；付款依原訂單條款辦理）」
- BOOKINGS 由 `🔴 必做 · 訂 KoBi…立即下訂` 改為 **post-booking checklist**（🟢 建議：出發前確認訂單有效性、付款狀態與取消期限）

**Sans Souci W1 → USER CONFIRMATION REQUIRED**
- Excel V21.4a 明確 🚩 **實際訂房狀態待使用者確認**；Booking Ref 仍為 `[請填入]` 佔位符
- `bookingStatus:"user_confirmation_required"`；status 改為「🚩 目前選定方案｜實際訂房狀態待使用者確認」
- 新增 `selectionNote`（房源已選定）／`referenceQuoteNote`（CHF 2,830、免費取消至 2027/7/20、Pay nothing until 2027/7/18、押金 CHF 400 均為**參考報價／方案條款**，僅於實際完成訂購後成立）／`priceIsReferenceQuote:true`
- houseRules 加 `houseRulesLabel:"參考方案條款（僅於實際完成該方案訂購後成立）"`
- pendingItems 首項改為「🚩 實際訂房狀態（是否已完成下訂）— 待使用者確認」
- **住宿 Status Badge 由 confirmed 改為 pending / selected**，不再誤導全團以為已訂完成

### 🎫 Swiss Travel Pass → baseline

- 15 天版 STP 由「本行程主方案」改為 **「目前基準方案（baseline）」，明確標示不是唯一方案**
- 2027 官方價格公布後仍應比較：15-day STP／8-day STP＋其餘單買／Swiss Half Fare Card＋單買
- PENDING_2027 與 BOOKINGS 同步更新；不預設固定天數的官方購買限制

### 🏔️ Day 8 A/B 雙軌完整遷移（本輪最大資料遷移）

`DAY_PLAN_CHOICES.day8_spb` 全面重建，每個 option 涵蓋 activity / lunch / descent / town 四段與推車、背巾政策：

**A · 家庭預設主方案（⭐ 推薦）**
- Alpine Garden 高山植物園 ＋ 短版 Swiss Flower & Panorama Trail（11:15–12:45）
- 12:30–12:45 開始收尾 → 13:00 左右 Hotel Restaurant Schynige Platte 正式午餐
- 推車相對較友善，但**非無障礙保證**；部分路面碎石或不平整，依現場判斷
- 下山 14:30 → 15:20 Wilderswil → 15:34 BOB → 16:07 Grindelwald

**B · Bonus Plan · 正式 Panorama Hike（🏔️ 條件全部理想才啟動）**
- 正式 Schynige Platte Panorama Hike，約 6 km，理想條件約 2.5–3 小時；**幼兒同行實際可能更久**
- **背巾為限定主策略**；**推車不得視為行程交通工具**
- **午餐改野餐**（不進餐廳，與 A 互斥）
- 下山 15:10 → 16:00 Wilderswil → 16:04 BOB → 16:37 Grindelwald

**Decision UI**：A 標 ⭐ 家庭預設、B 標 🏔️ Bonus Plan；`decisionHint:"不確定時選 A。B 不是與 A 同等推薦的選項。"`；選擇器顯示各方案推車／背巾政策。

**技術**：timeline 新增 `planRole:"activity"` 與 `"lunch"`；`findCurrentAndNext()` 展開四種 role；`storageKey` 沿用 `planchoice_day8_spb_descent`，既有選擇不失效。UI 顯示家庭版 A 時 Today Engine 亦依 A 的實際活動／午餐／下山時間解析。

### 🚂 Day 8 早晨流程重寫

Day 7 晚完成 5 件分裝 → 07:45 Morris+Milo 出門 → 08:00 SBB 寄件 → 09:00 家人出門 → 09:15 車站集合 → **09:38 BOB → 10:15 Wilderswil → 10:25 SPB → 11:15 抵頂**。上山段由籠統的 `11:00–12:00` 拆為兩段，並加入「10 分鐘轉車可能不夠、可退到 11:05 SPB」的 critical 提醒。SPB 車型澄清（1893 開通蒸汽、1914 電氣化、日常為電力機車、蒸汽特別班不預設搭乘）升為 critical。

### 🚞 Day 10 BRB 相對時間框架

`BRB_DAY_PLAN` 擴充，明確 **2027 班表未公布前不鎖死正式班次**：
- `scheduleFramework:"relative"` ＋ `frameworkNote`（湖船抵 Brienz → 至少 30–45 分鐘 buffer → 已選班次 → 約 60 分鐘登頂 → 山頂約 90 分鐘 → 下山 → Barry's）
- `simulationDisclaimer`：2026 絕對時間僅供模擬，**不代表 2027 已決定搭乘 12:58 這班**
- `connectionFallback`：若 2027 船班與 BRB 無法合理銜接 → ① 取消湖船改火車直達 Brienz ② **優先保留 BRB 與 Barry's** ③ 湖船延後
- `brbClosedFallback` A/B（BRB 停駛／湖邊天氣也差）
- **票務改為「依所購買的票券產品而定」**，不再宣稱一定換 STP 實體票；`turnstileNote` 明確 turnstile 開放 ≠ 必須此時通過；`childNote` 妞妞免費搭乘 ≠ 保證獨立座位
- 湖畔改為**簡單補給／點心**（不安排第二頓正式午餐，主要午餐保留山頂野餐）
- Barry's 改為「建議訂位 19:00–19:30」，依 2027 最終交通確認

### 📄 ETIAS：4 大 1 小全員

- `TRAVEL_DOCUMENT_RULES.etias` 新增 `ifApplicable2027`（4 大 1 小全員均需取得授權）／`feeRule`（4 成人付 EUR 20，妞妞未滿 18 歲免申請費）／`childWarning`（**免申請費 ≠ 不需申請**）
- 新增 `etiasApplicabilityLine()`；`etiasPackingLine(who)` 對妞妞加註「未滿 18 歲免申請費，但仍須取得自己的授權」
- PENDING_2027、PACKING、BOOKINGS 全部同步；不再出現「只有 4 位成人申請 ETIAS」或「妞妞免費 = 不用 ETIAS」

### 🚆 zb / Luzern–Interlaken Express：5 個座位

- 座位預約用於**確保座位**，不是搭乘的必要條件（持 STP 即可搭乘）
- **車票免費 ≠ 座位預約免費**：妞妞車票免費，但若要獨立保證座位仍需付 reservation fee
- **4 大 1 小若希望 5 人皆有固定座位，應處理 5 個座位**（而非只訂 4 個）
- 官方現行預約費參考 CHF 16（2026/5/2–11/1）；2027 費率待公布
- Day 5 LIE 卡片同步六條

### 🎡 Day 2 Rigi 推車保守化

- 山頂：「推車天堂：山頂步道極度平緩」→「山頂步道相對平緩，對推車與長輩較友善」
- 下山段：「健行步道風景極佳且平緩，適合推推車散步」→ **「推車可行性需依當日選定步道路線與路況判斷，不視為無障礙路線」**＋ rigi.ch 確認建議 ＋ 若不適合直接搭齒軌 Kulm→Kaltbad
- 新增 critical：Kulm–Kaltbad **不是「1 站」**，中間尚有 Rigi Staffel、Rigi Staffelhöhe

### 🐉 Day 4 Pilatus

- 齒軌上山標明**現行車程約 30 分鐘**；下山明確 Pilatus Kulm → Fräkmüntegg → Kriens（Panorama Gondola）
- 新增 critical：**交通票券 ≠ 座位預約**，不視為 Golden Round Trip 自動含齒軌座位；預約費現行約 CHF 5/人
- 新增「逆時針 B 計畫」完整備案卡，含 **反向預約三項確認**：① 原上山預約是否需取消 ② 下山方向是否需另行預約 ③ 改訂管道與可否當日辦理

### 🏘️ Day 6 保守化（主線保留）

- Mürren / Allmendhubel 主線完整保留（V21.6 已恢復，本輪未回退）
- 「村莊僅約 1 公里長，全平坦無車」→「無車村；村內核心區步行相對輕鬆，仍可能有坡度」
- 新增「實際停留時間依拍照、午餐與幼兒節奏調整」

### 🚡 Day 7 Männlichen

- 票價：`約 CHF 35-40/成人` → **2026 現行參考單程原價約 CHF 34，STP 50% 折扣後約 CHF 17/成人**（妞妞免費）；2027 依官方確認
- **背巾為確定主方案**；運動型推車僅在出發前確認當日路況適合時才攜帶
- 新增「不把『推車上午睡』視為行程成立的前提條件」

### 🌦️ 雨天／白牆決策規則

`WEATHER_DECISION` 兩條原則重寫：
- Day 7/8/9 互換：**不可只看一座山白牆就盲目換另一座**。① 每晚 19:00–21:00 同步比對 Männlichen / Schynige Platte / First 三處 webcam ＋ 官方營運狀態 ② 只有某處明顯較佳才互換 ③ 三處皆差 → 直接低海拔備案 ④ 不以海拔推論雲層
- Day 4：不能只看 Pilatus 白牆＋Kandersteg 低地天氣，必須同步確認 Oeschinensee webcam、纜車營運、當地實際天氣

---

## 本輪刻意 **未** 同步的 Excel 內容（Web 保留）

| Excel V21.4a 內容 | Web 處理 | 理由 |
|---|---|---|
| 待辦區「駐瑞士代表處 +41 31 382 21 36」 | **保留 Web 正確號碼**（一般 +41 31 382 2927、急難 +41 76 336 6979） | Excel 該欄為舊資料殘留；Web 於 V21.3e 已修正並抽為 `CONSULATE_CONTACT` SSoT |
| 總覽 Day 2「女皇登山慶典」、Day 10「妞妞主場日 ＋ 慶功宴」 | **保留 Web 中性化主題** | Web 於 V21.3c 已完成文案中性化，屬 Web 架構層改善 |
| 各 Day 表的「戰術動線」「實戰防禦指令」欄位名 | **保留 Web 用詞** | 同上 |

---

## V21.5 → V21.6 摘要（歷史紀錄）

Today 時間引擎七態（新增 `schedule_unknown` / `at_milestone` / `plan_unselected`）、Day 6 Mürren/Allmendhubel 主線恢復、Day 8 `DAY_PLAN_CHOICES` 建立、Day 10 `BRB_DAY_PLAN` 建立、`FLIGHT_ITINERARY` 全面 SSoT 化、`TRAVEL_DOCUMENT_RULES` 共用 helper、SBB 分站處理、Day 5 入住前流程、BRB Seat Guarantee 措辭修正、LIE Day 卡 badge、real-itinerary corpus test 建立。

## V21.4 → V21.5 摘要（歷史紀錄）

Today 四態引擎、`FLIGHT_ITINERARY` 4 航段建立、緊急頁 112 提升、`TRAVEL_DOCUMENT_RULES` 建立、PWA 可觀測性、QA 5 分類。

## 更早版本（V21.3c–V21.4）

品牌與文案中性化、ETIAS 申根修正、9/13 星期修正、SBB / LIE 官方 URL、`renderStatusBadge`、SW all-or-nothing precache、`CONSULATE_CONTACT`、STP 60 天說法移除、Tools 頁 A/B/C 分組、緊急頁一鍵撥號。

---

## localStorage 兼容性

**全部 key 未變**，使用者既有勾選狀態完整保留：

`book_*`／`pack_*`／`shop_*`／`crit_*`／`bookings_filter`／`pending_*`／`luggage_*`／`luggage_receipt_*`／`planchoice_day8_spb_descent`

> Day 8 的 `DAY_PLAN_CHOICES` key 由 `day8_spb_descent` 更名為 `day8_spb`（內部識別），
> 但 `storageKey` 仍維持 `planchoice_day8_spb_descent`，既有 A/B 選擇不會失效。

> **V21.7c 新增**：plan choice value 現在會對照目前 option 定義驗證。若某個 plan choice key
> 因方案改版而不再存在（例如舊版曾有的 `C`），讀取時**只會清除該 plan 自己的 storageKey**
> 並回傳「未選」，**絕不 `localStorage.clear()`**、不影響 `swiss_checks` 與其他 plan choice。
> 有效的 A／B 選擇完全不受影響。

> **V21.7d 新增**：plan choice 現在僅接受 **primitive string**（`new String("A")`／`["A"]`／
> 物件／數字／布林等一律無效，不再 coercion）；空字串 plan choice 亦會被清理（只移除該 plan 的
> storageKey）。`swiss_checks` 讀取改用安全 loader：損壞 JSON／`null`／Array／primitive 一律安全
> 恢復為 `{}` 並**只移除 `swiss_checks`**，且只保留合法 boolean entries；`saveChecks` 具 try/catch
> 保底。既有有效 checklist 與有效 A／B 完全保留，`storageKey` 不變，全站無 `localStorage.clear()`。

---

## 檔案交付

### V21.7d · Final Deployment Cache Revision（本輪 · Service Worker deployment revision）

| 檔案 | 變動 |
|---|---|
| `sw.js` | ✅ 動（`CACHE_NAME` → `swiss-trip-v21-7d-final-2027`、開頭加 `V21.7d Final Deployment Revision` 註解；install/activate/fetch 架構未回退） |
| `scenario_tests_service_worker_revision.js` | ✅ **新增**（45 項：static／package integrity／install（含 addAll 失敗 reject）／activate migration／fetch regression／架構守門） |
| `scenario_tests_data_baseline.js` | ✅ 動（current cache expectation → `swiss-trip-v21-7d-final-2027`；163→164） |
| `V21_7D_FINAL_DEPLOYMENT_CACHE_REVISION_SUMMARY.md` | ✅ **新增** |
| `CHANGELOG_WEB.md` / `QA_REPORT_WEB.md` / 兩份 V21.7d summary | ✅ 動（說明 cache revision；網站版本未升級） |
| `app.js` / `data.js` / `index.html` / `style.css` / `manifest.json` / `vercel.json` | ❌ 未動（交付最新修正版；功能不變、版本字串維持 V21.7d） |

### V21.7d · In-Place Final Seal Correction（同版就地補正 · 全站 storage 安全化）

| 檔案 | 補正變動 |
|---|---|
| `app.js` | ✅ 動（新增共用 `safeStorageGet/Set/Remove`；新增 bookings filter／pending state／luggage receipt helpers；`renderBookings`／`renderPending`／`renderLuggage` 與對應 handler 改用 safe helper，移除未保護 localStorage） |
| `scenario_tests_storage_consumers.js` | ✅ **新增**（plain node 84；jsdom render sweep +6 = 90：safe layer／enum／exception sweep／key isolation／正式 render 函式防禦） |
| `scenario_tests_data_baseline.js` | ✅ 動（新增 12 項 V21.7d In-Place Correction 靜態守門；151→163） |
| `V21_7D_IN_PLACE_FINAL_SEAL_CORRECTION_SUMMARY.md` | ✅ **新增** |
| `CHANGELOG_WEB.md` / `QA_REPORT_WEB.md` / `V21_7C_to_V21_7D_..._SUMMARY.md` | ✅ 動（說明就地補正） |
| `data.js` / `sw.js` | ❌ 未動（版本／cache 維持 V21.7d，不升版） |
| `index.html` / `style.css` / `manifest.json` / `vercel.json` | ❌ 未動 |

### V21.7d（Final Storage Integrity Seal · 初次 Seal）

| 檔案 | V21.7d 變動 |
|---|---|
| `app.js` | ✅ 動（`resolveValidPlanChoice` 改 strict primitive-string；`getPlanChoice` 空字串走清理；新增 `loadCheckedItems`／`removeChecksKeySafe`／`ensureCheckedItems`；`State.checkedItems` 改用 `loadCheckedItems()`；強化 `saveChecks`／`toggleCheck`／`isChecked`） |
| `data.js` | ✅ 動（僅 `TRIP_META.version` → V21.7d；行程內容未動） |
| `sw.js` | ✅ 動（CACHE_NAME → `swiss-trip-v21-7d-2027`、註解 V21.7d） |
| `scenario_tests_storage_integrity.js` | ✅ **新增**（103 項：strict type／empty cleanup + key isolation／checklist safe load/sanitize/save／toggle/isChecked 防禦／全域禁令守門） |
| `scenario_tests_data_baseline.js` | ✅ 動（版本顯示→V21.7d、V21.7c 改為歷史 regression guard、新增 V21.7d Final Storage Integrity Seal 靜態守門） |
| `scenario_tests_plan_choice_storage.js` | ✅ 動（顯示名→V21.7d，歷史 scope 註明 V21.7c；84/84 無 regression） |
| `scenario_tests_today_engine.js` | ✅ 動（顯示名→V21.7d；17/17 無 regression） |
| `scenario_tests_day8_plan_lifecycle.js` | ✅ 動（顯示名→V21.7d；48/48 無 regression） |
| `scenario_tests_real_itinerary.js` | ✅ 動（顯示名→V21.7d；Critical 0 無 regression） |
| `CHANGELOG_WEB.md` / `QA_REPORT_WEB.md` | ✅ 動 |
| `V21_7C_to_V21_7D_FINAL_STORAGE_INTEGRITY_SEAL_SUMMARY.md` | ✅ **新增** |
| `index.html` / `style.css` / `manifest.json` / `vercel.json` | ❌ 未動（無必要修改） |

### V21.7c（歷史 · Storage Validation Hotfix）

| 檔案 | V21.7c 變動 |
|---|---|
| `app.js` | ✅ 動（新增 `resolveValidPlanChoice`／`normalizePlanChoice`；重寫 `getPlanChoice`／`setPlanChoice`／`allPlanChoices`；`findCurrentAndNext` 加入 defensive validation） |
| `data.js` | ✅ 動（僅 `TRIP_META.version` → V21.7c；行程內容未動） |
| `sw.js` | ✅ 動（CACHE_NAME → `swiss-trip-v21-7c-2027`、註解 V21.7c） |
| `scenario_tests_plan_choice_storage.js` | ✅ **新增**（84 項：驗證器／getPlanChoice／setPlanChoice／allPlanChoices／真實 Day 8 無效 `C` sweep／generic plan） |
| `scenario_tests_data_baseline.js` | ✅ 動（版本顯示→V21.7c、歷史版本改為 regression guard、新增 11 項 storage 靜態守門） |
| `scenario_tests_today_engine.js` | ✅ 動（注入 `resolveValidPlanChoice` 依賴、顯示名→V21.7c；17/17 無 regression） |
| `scenario_tests_day8_plan_lifecycle.js` | ✅ 動（注入 `resolveValidPlanChoice` 依賴、顯示名→V21.7c；48/48 無 regression） |
| `scenario_tests_real_itinerary.js` | ✅ 動（僅顯示名→V21.7c；Critical 0 無 regression） |
| `CHANGELOG_WEB.md` / `QA_REPORT_WEB.md` | ✅ 動 |
| `V21_7B_to_V21_7C_STORAGE_VALIDATION_HOTFIX_SUMMARY.md` | ✅ **新增** |
| `index.html` / `style.css` / `manifest.json` / `vercel.json` | ❌ 未動（無必要修改） |

### V21.7（歷史 · Excel V21.4a Baseline Migration）

| 檔案 | V21.7 變動 |
|---|---|
| `data.js` | ✅ 動（baseline migration 主體） |
| `app.js` | ✅ 動（activity/lunch planRole、方案選擇器 tier 標籤、LIE 卡 5 座位） |
| `sw.js` | ✅ 動（CACHE_NAME v21-7、註解 V21.7） |
| `scenario_tests_data_baseline.js` | ✅ **新增**（76 項 reconciliation） |
| `scenario_tests_today_engine.js` | 未動（12/12 無 regression） |
| `scenario_tests_real_itinerary.js` | 未動（Critical 0 無 regression） |
| `CHANGELOG_WEB.md` | ✅ 動（本檔） |
| `QA_REPORT_WEB.md` | ✅ 動 |
| `V21_6_to_V21_7_EXCEL_V21_4A_SYNC_SUMMARY.md` | ✅ **新增** |
| `index.html` / `style.css` / `manifest.json` / `vercel.json` | ❌ 未動（無必要修改） |
