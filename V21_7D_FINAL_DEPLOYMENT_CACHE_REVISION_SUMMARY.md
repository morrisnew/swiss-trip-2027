# V21.7d Final Deployment Cache Revision Summary

- **網站版本**：`V21.7d Web · 基於 V21.4a 行程資料`（**未升級**；`TRIP_META.version` 不變）
- **Service Worker cache（current revision）**：`swiss-trip-v21-7d-2027` → **`swiss-trip-v21-7d-final-2027`**
- 定位：**Service Worker deployment revision**（同一網站版本、不同 deployment revision）
- 日期：2026/7
- **不是**升版、不是 V21.7e／V21.8、不是新功能、不是行程或 UI 變更

> 本輪唯一目的：讓「同版 `app.js` 已更新」能觸發**既有 PWA 使用者**的 Service Worker 升級，
> 使其取得最終修正版資產。舊 cache 會在 activate 階段移除。**沒有修改行程或網站功能。**

---

## A. Baseline Confirmation

輸入為完成 In-Place Correction 的 V21.7d：`TRIP_META.version === "V21.7d Web · 基於 V21.4a 行程資料"`；
`app.js` 已含 `safeStorageGet`／`safeStorageSet`／`safeStorageRemove`／`normalizeBookingsFilter`／
`loadBookingsFilter`／`saveBookingsFilter`／`normalizePendingState`／`getPendingState`／`setPendingState`／
`getLuggageReceipt`／`setLuggageReceipt`／Plan choice validation／`swiss_checks` recovery／完整 Plan Lifecycle。
既有測試（today／real_itinerary／data_baseline／day8_plan_lifecycle／plan_choice_storage／
storage_integrity／storage_consumers）皆在。改動前 `sw.js` `CACHE_NAME = "swiss-trip-v21-7d-2027"`。

## B. Deployment Issue Reproduction

- In-Place Correction 後 `app.js` 已與初次 V21.7d 不同。
- 但 `sw.js` 內容與 `CACHE_NAME` 仍與初次 V21.7d 相同。
- Service Worker 採 cache-first：若初次 V21.7d 曾部署／開啟／安裝，瀏覽器可能判定 `sw.js` 未更新
  → 不重新觸發 install → 不重跑 `cache.addAll(ASSETS)` → 舊 cache 中的初次 `app.js` 繼續被使用。
- 結果：本次全站 storage 修正**只對新訪客生效**，既有 PWA 使用者升級路徑未封住。

## C. Revision Change

| | 值 |
|---|---|
| Old（初次 V21.7d cache） | `swiss-trip-v21-7d-2027` |
| **New（current revision）** | **`swiss-trip-v21-7d-final-2027`** |

`sw.js` 開頭加註 `V21.7d Final Deployment Revision`；位元內容與初次 V21.7d 不同 → 瀏覽器可偵測新
Service Worker script → 觸發 install。**網站版本字串未升級。**

## D. Install Test（✅ Node mock）

| 情況 | 結果 |
|---|---|
| `caches.open(CACHE_NAME)` | ✅ 開啟 `swiss-trip-v21-7d-final-2027` |
| `cache.addAll(ASSETS)` | ✅ 被呼叫（6 項，含 `./app.js`／`./data.js`／`./index.html`／`./style.css`／`./manifest.json`／`./`） |
| `addAll` 成功 | ✅ install promise resolve；`skipWaiting()` 呼叫 |
| `addAll` 失敗 | ✅ install promise **reject**（不吞掉 precache error；all-or-nothing 保留） |

## E. Activate Migration Test（✅ Node mock）

以 `caches.keys()` = `["swiss-trip-v21-7d-2027", "swiss-trip-v21-7c-2027", "swiss-trip-v21-7d-final-2027"]`：

| 動作 | 結果 |
|---|---|
| 刪除初次 V21.7d 舊 cache `swiss-trip-v21-7d-2027` | ✅ |
| 刪除更舊 cache `swiss-trip-v21-7c-2027` | ✅ |
| 保留新 final cache `swiss-trip-v21-7d-final-2027` | ✅（未刪除） |
| `self.clients.claim()` | ✅ 呼叫 |

## F. Fetch Regression Test（✅ Node mock）

| 情況 | 結果 |
|---|---|
| 同源 cache hit | ✅ 使用 cached response（不重複 put） |
| 同源 cache miss | ✅ fetch；成功（200 basic）→ put 進 `swiss-trip-v21-7d-final-2027` |
| 跨域請求 | ✅ 不攔截（`respondWith` 未呼叫） |
| 非 GET（POST） | ✅ 不攔截 |
| navigate 離線 | ✅ fallback `./index.html` |
| 非 document 離線 | ✅ 回傳 503 |

策略未回退（仍為 same-origin cache-first；未改 network-first／stale-while-revalidate）。

## G. Existing Regression

| 測試 | 結果 |
|---|---|
| `node --check data.js / app.js / sw.js` | ✅ OK |
| today_engine | ✅ 17/17 |
| real_itinerary | ✅ Critical 0 / Warning 0 / Info 0 |
| data_baseline | ✅ 164/164（current cache expectation → final revision） |
| day8_plan_lifecycle | ✅ 48/48 |
| plan_choice_storage | ✅ 84/84 |
| storage_integrity | ✅ 103/103 |
| storage_consumers | ✅ 84（plain）／90（jsdom） |
| **service_worker_revision** | ✅ **45/45（新增）** |

網站功能測試全部未回退。未修改行程／Today Engine／Day 8 A/B／Plan Lifecycle／Bookings／Pending／
Luggage／checklist／BRB／航班／住宿／ETIAS／STP／UI，未更改 storage key。

## H. Browser Upgrade Result

> **Not Tested。** 真實 Chromium Service Worker upgrade、iPhone PWA upgrade、Android PWA upgrade、
> Vercel production deployment、真實離線模式——本輪未執行。本輪僅以 Node mock 驗證 install/activate/fetch
> 邏輯；不因 cache 名稱已改就宣稱真實裝置升級已通過。

## I. Final Declaration

§17 成功標準 18 項全部成立、全部 Node／mock 測試通過：

> **V21.7d 已完成 Final Deployment Cache Revision。網站版本維持 V21.7d，Service Worker revision 已更新為
> `swiss-trip-v21-7d-final-2027`，既有 PWA 已具備取得最終修正版資產的更新觸發條件。**

舊 cache 名稱僅存在於歷史／migration context（sw.js 遷移註解、activate migration 測試 fixture、
CHANGELOG 歷史、負向 guard）；current `CACHE_NAME` 僅為 final revision。不衍生 V21.7e。
