# V21.7d Accommodation Web Data Sync — QA

- 網站版本：**V21.7d Web · 基於 V21.4a 行程資料**（`TRIP_META.version` 不變）
- 行程母版：**V21.4b**（`瑞士行程_最終版_V21.4b_最終封板版.xlsx`，只讀、未修改）
- Service Worker cache（deployment revision）：`swiss-trip-v21-7d-final-2027` → **`swiss-trip-v21-7d-final-accsync-2027`**
- 依據：`V21_4B_WEB_SYNC_IMPACT_ASSESSMENT_FINAL.md` 之 Final Action Table（已封板，本輪只施作、不重做 Audit）

## 1. Input Confirmation

實際讀取：V21.4b Excel（只讀）、`V21_4B_WEB_SYNC_IMPACT_ASSESSMENT_FINAL.md`（specification）、current V21.7d runtime
（`data.js` L5 `TRIP_META.version="V21.7d Web · 基於 V21.4a 行程資料"`、`sw.js` `CACHE_NAME="swiss-trip-v21-7d-final-2027"`、
`app.js` `renderHotel`）、三份 regression tests、四張 Booking 截圖（KoBi Luzern／Sans Souci W1 Interhome）。
Baseline 相符 → 直接施作。註：uploads 內另有一份 Jul 25 的 V21.7c 舊檔，非 current runtime，未採用。

## 2. Modified Files

- **data.js**：`HOTELS.luzern`、`HOTELS.grindelwald`、`BOOKINGS[0]`、`BOOKINGS[1]`、`QUICK_NUMBERS`、`PENDING_2027.interhome_key`、Day 5（`DAYS[4]`）、Day 11（`DAYS[10]`）
- **app.js**：`renderHotel()` 最小增補——payment／cityTax／priceNote 三行 render；pendingItems heading `待訂房確認事項→住宿待確認事項`、badge `訂房確認後更新→出發前確認`。**未重構** hardcoded confirmed badge、未動其他 render/sealed logic。
- **sw.js**：deployment cache revision（cache 名＋註解）；install/activate/fetch 架構未動。
- **tests**：`scenario_tests_data_baseline.js`（Sans Souci pre-booking 斷言更新為 confirmed reality＋新增 V21.4b sync 守門＋current cache→accsync）、`scenario_tests_service_worker_revision.js`（current cache→accsync、activate 刪除前一版 final cache）。
- **other**：本 QA 文件。Excel／index.html／style.css／manifest.json／vercel.json＝未修改。

## 3. Action Completion（依 Final Action Table）

**Must Sync 19／19 完成**：Grindelwald bookingStatus→confirmed｜status→已訂房｜selectionNote→operational｜priceCHF 2830→**2691.01**｜priceIsReferenceQuote true→**false**｜referenceQuoteNote 作廢舊參考並述實際金額｜houseRules[] 清除 CHF400/7-20/7-18 現行條款、改「待確認（原…為下訂前參考）」、保留 check-in/out/children/禁菸/無寵物｜houseRulesLabel→「入住條件（訂房平台現行資訊）」｜pendingItems[]（[0]/[1] 移除、[2]–[7] 保留＋新增 exact address／key return）｜BOOKINGS[1] 改 operational｜BOOKINGS[0].how wording｜payment data field｜cityTax data field｜**renderHotel payment/cityTax render support**｜renderHotel pendingItems heading｜Day 5 checkout qualification｜Day 11 departure 08:00–08:15｜Day 11 cleaning（不宣稱省清潔費）｜Day 11 key-return reminder（新增）。

**Must Reconcile 2／2**：見 §4。

**Recommended 9／9 完成**：deposit（structured `deposit` field，標「待確認（原 CHF 400 為下訂前參考）」）｜QUICK_NUMBERS Interhome→+41 43 810 9126｜QUICK_NUMBERS KoBi→+41 79 235 6688｜HOTELS.luzern.phone｜HOTELS.grindelwald.phone｜Luzern checkInWindow/checkOutWindow（15:00–21:00／10:00–11:00）｜Luzern cancellation（2027/8/30 23:59，另於 BOOKINGS[0].how 呈現）｜Grindelwald address descriptive（3818 Grindelwald，鎮名層級）｜interhome_key note（已訂房後 operational 清單）。

**No Sync 3**（未動）：Grindelwald checkInWindow/checkOutBy 已正確｜Day 5 check-in 等待邏輯 already implemented｜PENDING「Sans Souci 尚未訂房」不存在（不硬刪）。
**Do Not Sync 2**：app.js hardcoded badge（未重構）｜Booking.com 即時 TWD estimate／booking ref／付款連結／私人 email（未寫入 PWA）。

## 4. Must Reconcile Outcome

- **Luzern address**：**未直接 Replace**。保留 `Hirschenplatz 12, 6004 Luzern` 為現行導航點，並註明 Booking 截圖地址為 `5 Werchlaubengässli, 6004 Luzern`（同一街廓），實際 check-in 入口／門牌**待住宿方確認**。未把未確認地址做成唯一導航點。
- **Luzern price semantics**：actual booking price 顯示 **CHF 2,702.16**（`priceCHF`）；`priceTWD 125000` 保留但以 `priceNote` 明確標示為「既有預算／規劃基準，非 Booking.com 實際訂單金額」。**未**改成固定 NT$ 108,083。

## 5. Regression Results（實際執行）

| 測試（§26 必跑） | 結果 |
|---|---|
| `scenario_tests_today_engine.js` | ✅ PASS · 17/17 |
| `scenario_tests_storage_integrity.js` | ✅ PASS · 103/103 |
| `scenario_tests_storage_consumers.js` | ✅ PASS · 84/84（plain node；jsdom render sweep 段自動 skip） |

其餘既有套件（一併執行）：data_baseline ✅ **169/169**（含更新後之 Sans Souci confirmed 斷言＋V21.4b sync 守門）｜real_itinerary ✅ Critical 0／Warning 0／Info 0｜day8_plan_lifecycle ✅ 48/48｜plan_choice_storage ✅ 84/84｜service_worker_revision ✅ 46/46（current cache accsync＋刪除前一版 final cache）。
Syntax：`node --check` data.js／app.js／sw.js 皆 OK。

> data_baseline 內原「Sans Souci = user_confirmation_required／priceIsReferenceQuote=true／pendingItems 含實際訂房狀態待確認／BOOKINGS 待使用者確認」等斷言，是鎖定**下訂前狀態**；V21.4b 已確認訂房，故依 §27（test 鎖定前一狀態）更新為 confirmed reality，非為了「變綠」而改 unrelated logic。

## 6. Accommodation UI QA（實際 render 驗證：jsdom 22/22＋真實 Chromium 9/9）

**KoBi**：booking confirmed｜實際訂房金額 **CHF 2,702.16**（原幣）語意正確｜NT$ 125,000 明確標為預算／規劃基準｜免費取消 **2027/8/30 23:59**（於 BOOKINGS[0].how）｜payment＝待人工確認｜phone **+41 79 235 6688**（tel 連結）｜address 保留 Hirschenplatz 12 且註明 Werchlaubengässli 待確認、未無證據猜測。
**Sans Souci**：booking confirmed｜**CHF 2,691.01**（未併城市稅、非 2847.01）｜city tax **CHF 156** 獨立顯示（CHF 5.20/人/晚 × 5 × 6，現場另收）｜payment 行可見（待付 CHF 2,691｜已付 CHF 0｜期限 待人工確認）｜city tax 行可見｜stale CHF 2,830 不再當 current price｜7/20 不再當 confirmed cancellation｜7/18 不再當 confirmed payment deadline｜CHF 400 不再當 confirmed deposit｜pending heading 已改「住宿待確認事項」｜booking-stage pending item（[0]/[1]）已消失｜operational pending 保留｜phone **+41 43 810 9126**。

## 7. Day 5 / Day 11 QA

**Day 5**：09:15 early checkout 已加 qualification（早於 Booking stated 10:00–11:00，待住宿方確認）｜13:00–15:00 等待 intact｜15:00–17:00 check-in intact｜15:00 前不預設入住｜key collection pending intact。
**Day 11**：departure **08:00–08:15 離開**｜**08:49 BOB 主方案保留**｜key-return 提醒已加入（🚨 重要警告；待 Interhome 確認、不預設 dropbox）｜清潔費節省宣稱已移除（改「依住宿方退房規定處理垃圾」）｜**Day 10 的 09:18 未被誤動**（09:18 僅存在於 Day 10；Day 11 本無 09:18／dropbox，未全域刪除）。

## 8. Stale-text Scan（§31）

`08:30 退房`／`清潔費可省`／`待訂房確認事項`／`訂房確認後更新`／`若尚未下訂`／`實際訂房狀態待使用者確認`／bare `2830` → **0 命中**。
`2,830`／`7/20`／`7/18`／`CHF 400` 之殘留全數位於明確標示「原…為下訂前參考／已作廢／已不適用／待確認」之語境（且 `referenceQuoteNote` 不被 renderHotel 輸出），**未以 current actual booking terms 呈現** → 判定為合法歷史註記，保留。

## 9. PWA / Cache QA

data.js／app.js 已修改 → 依 cache-first 需 deployment revision：`CACHE_NAME` 已 bump 為 `swiss-trip-v21-7d-final-accsync-2027`（logical version 維持 V21.7d）。SW syntax OK；ASSETS（`./ ./index.html ./app.js ./data.js ./style.css ./manifest.json`）未破壞；install all-or-nothing／activate 刪舊 cache＋clients.claim／fetch cache-first・navigate fallback・503 未回退（service_worker_revision 46/46）。
**真實 Chromium 141（localhost secure context）實測 9/9**：fresh load 建立 accsync cache、無前一版 final cache 殘留、hotels/bookings 住宿資料正確 render、無 app console error、離線重開由 cache 正確渲染。
未提供 index.html／style.css／manifest.json 之外部更動需求；本輪未改該三檔（沿用現有），未假裝完整驗證其內容。

## 10. Remaining Manual Confirmations

1. Luzern 早退（09:15）可否提前自助退房／key return
2. Luzern `Hirschenplatz 12` 與 `5 Werchlaubengässli` 關係（entrance／reception／old／erroneous）
3. Luzern NT$125,000 vs CHF 2,702.16 差異語意
4. Grindelwald 免費取消條件
5. Grindelwald 付款期限
6. Grindelwald 押金（舊 CHF 400 是否仍適用）
7. Grindelwald 精確門牌地址
8. Grindelwald key pickup／key return 方式
9. Grindelwald late check-in（17:00 後）procedure

以上網站均以 **Needs Manual Confirmation／待確認** 明確呈現，無猜測或誤導。

## 11. Final Verdict

- Must Sync 19 全部完成｜Must Reconcile 2 未被錯誤猜測｜actual booking data 正確｜payment／city tax 可實際 render｜stale booking-stage wording 已清除｜Day 5／Day 11 修正正確｜syntax PASS｜三套 required regression PASS（＋全 8 套 PASS）｜protected logic 無 regression｜PWA/cache consistency PASS｜無 Critical stale information。

> **V21.7d Accommodation Web Data Sync — PASS**

網站版本維持 V21.7d；deployment cache revision＝`swiss-trip-v21-7d-final-accsync-2027`；未升版、未動 Excel、未重構 sealed logic。Remaining Manual Confirmations 見 §10。

---

# Final Micro-Patch Addendum（V21.7d — 封板前最後微修）

> 定位：CONDITIONAL PASS → 僅 1 個 Day 11 runtime residual 修正 ＋ 2 個極小 cleanup ＋ regression rerun。
> 未重開任何 Audit、未改 logical version、未升 V21.7e/V21.8、未重構任何 sealed logic。

## 1. Day 11 stale 08:40 residual — 已修正
Day 11 第一個 timeline block 原有語意矛盾：08:00–08:15 已「離開」，卻又寫「08:40 推行李慢步至格林德瓦火車站」。
- title：`格林德瓦早餐 ＋ 退房` → `格林德瓦早餐 ＋ 退房 ＋ 前往車站`
- steps：兩步整併為單一 operationally consistent step：「08:00–08:15 完成退房並離開；清點…後，立即步行 5–10 分鐘至 Grindelwald 車站，抵站後等待 08:49 BOB」
- `time:"07:00–08:30"` 保留；08:49 BOB 主方案保留；key-return warning、cleaning wording 保留；Day 10 的 09:18 未動。

## 2. SW test labels — 已 cleanup
`scenario_tests_service_worker_revision.js` 兩處 display label（install 開新 cache、fetch put 進新 cache）由
`swiss-trip-v21-7d-final-2027` 更新為 `swiss-trip-v21-7d-final-accsync-2027`。**僅改 label，未動測試邏輯**；
`PREV_FINAL`（L20）與「刪除前一版 final cache」label（L151）維持 `final-2027`（該處正確指被刪除的前一版 cache）。測試數量不變（46/46）。

## 3. Actual CHF「約」— 已 cleanup（generic）
`renderHotel()` priceCHF render 由固定「💰 約 CHF …」改為 `💰 ${h.priceIsReferenceQuote ? '約 ' : ''}CHF …`：
actual booking price（KoBi CHF 2,702.16、Sans Souci CHF 2,691.01，皆 `priceIsReferenceQuote` 未設/為 false）顯示精確金額；
若未來某住宿為 reference quote（`priceIsReferenceQuote:true`）則仍顯示「約 CHF」。**維持 generic schema、未 hardcode hotel name、未新增 price architecture、未重構 renderHotel**。`priceTWD`（NT$ 125,000 預算基準）維持「約 NT$」。

## 4. Modified files（本 micro-patch）
- `data.js`：僅 Day 11 第一個 timeline block（title + steps 整併）
- `app.js`：僅 `renderHotel()` priceCHF 一行
- `sw.js`：**未變更**（cache 維持 `swiss-trip-v21-7d-final-accsync-2027`，未 bump）
- `scenario_tests_service_worker_revision.js`：僅 2 處 display label
- QA：本 Addendum
- 其餘（index/style/manifest/vercel/data_baseline test/其他 HOTELS/Days）：未變更

## 5. Regression results（實際重跑）
Today 17/17 ✅｜Storage Integrity 103/103 ✅｜Storage Consumers 84/84（plain node）／90/90（jsdom 在場時含 render sweep）✅｜Data Baseline 169/169 ✅｜Service Worker Revision 46/46 ✅｜（另）real_itinerary Critical 0 ✅｜day8_plan_lifecycle 48/48 ✅｜plan_choice_storage 84/84 ✅。測試數量未因 label cleanup 改變。

## 6. Syntax results
`node --check` data.js／app.js／sw.js → 全 PASS。

## 7. Diff scope
data.js＝僅 Day 11 block｜app.js＝僅 priceCHF 一行｜sw.js＝identical｜data_baseline test＝identical｜sw_revision test＝僅 2 label 行。無 unrelated diff。Day 11 static verification：08:00–08:15 存在、08:49 BOB 存在、`08:40 推行李慢步…` 不存在、key-return/cleaning 保留、Day 10 09:18 未動（4 處全在 Day 10）。真實 render（jsdom）：KoBi/Sans Souci 顯示精確 CHF、Day 11 合併步驟正確。

## 8. Final verdict

> **V21.7d Accommodation Web Data Sync — FINAL PASS**
> **Ready for deployment / final website update.**

Deployment 交付使用 canonical filenames：`index.html` 參照 `./data.js`／`./app.js`／`./sw.js`／`./style.css`／`./manifest.json`，SW `ASSETS` 亦用 canonical 檔名。若下載檔帶 timestamp，部署前務必更名回 `data.js`／`app.js`／`sw.js`（其餘不變），以免 index 找不到資產。cache 維持 `swiss-trip-v21-7d-final-accsync-2027`（本 micro-patch 未 bump；logical version 維持 V21.7d）。

> 說明（cache-first 取捨）：本輪僅依 prompt §13 不自動 bump cache。已安裝於 `…accsync-2027` 的 PWA 會在下次有 cache revision 的部署時取得此 Day 11 修正；全新安裝／清除快取之用戶即時取得。若部署方希望立即向既有 PWA 推送本修正，可於部署時做一次 deployment cache revision（logical version 仍維持 V21.7d）。

---

# Final Deployment Cache Revision Addendum（accsync → accsync-r2）

> 定位：Final Micro-Patch 上線後之純部署層 cache revision。因前一版 `swiss-trip-v21-7d-final-accsync-2027`
> 已實際部署，且其後又改了 data.js（Day 11）／app.js（actual CHF），沿用同一 cache 會使既有 PWA 命中舊 cache、
> 無法即時取得最新資產。本輪只做一次 deployment cache revision；未重開 Audit、未改行程/住宿、logical version 維持 V21.7d。

## 1. Cache revision
- Previous deployed cache：`swiss-trip-v21-7d-final-accsync-2027`
- **New current cache：`swiss-trip-v21-7d-final-accsync-r2-2027`**
- logical version：**V21.7d Web · 基於 V21.4a 行程資料**（`TRIP_META.version` 未動；非 V21.7e/V21.8）

## 2. sw.js diff
僅 `CACHE_NAME` 由 `…accsync-2027` → `…accsync-r2-2027`，並同步更新其上方描述該次 revision 的註解（說明 accsync→r2 原因）。
**Service Worker architecture 完全未變更**：ASSETS／install（skipWaiting／`cache.addAll` all-or-nothing）／activate（`caches.keys` → 刪除所有非 current cache → `clients.claim()`）／fetch（cache-first・navigate fallback `index.html`・非 document 503）皆 byte-identical。

## 3. Service Worker revision test 更新
`scenario_tests_service_worker_revision.js`：`NEW_CACHE` → `…accsync-r2-2027`、`PREV_FINAL` → `…accsync-2027`，
並同步 install/fetch display labels 與「刪除前一版 cache」label。**未改 assertion substantive logic**；沿用「刪除所有非 current cache」邏輯。
另 `scenario_tests_data_baseline.js` 之 current-cache expectation（3 處 regex）由 `…accsync-2027` → `…accsync-r2-2027`（純 expectation 同步，非行程/邏輯變更；count 不變）。

## 4. Activate migration（驗證）
mock 測試（46/46）確認：保留 `…accsync-r2-2027`；刪除前一版 `…accsync-2027`；刪除更舊 `swiss-trip-v21-7d-2027`、`swiss-trip-v21-7c-2027`（generic「刪除所有非 current cache」亦涵蓋 `…final-2027`）；`clients.claim()` 正常。

## 5. Deployment behavior（真實瀏覽器實測）
真實 Chromium 141（localhost secure context）7/7：升級前存在 `…accsync-2027` → 部署 r2 → 偵測新 SW → 建立 `…accsync-r2-2027` → **刪除 `…accsync-2027`** → 受新 SW 控制 → r2 服務最新 `app.js`（actual CHF 無「約」）與 `data.js`（Day 11 合併步驟、無 08:40 stale）。非 mock，非虛構。

## 6. Regression results
Today 17/17 ✅｜Storage Integrity 103/103 ✅｜Storage Consumers 84/84（plain node）／90/90（jsdom 在場）✅｜Data Baseline 169/169 ✅｜Service Worker Revision 46/46 ✅。測試數量未改變（僅 cache 名稱／label／expectation 同步）。

## 7. Syntax
`node --check` data.js／app.js／sw.js → 全 PASS。

## 8. Diff scope
Production：**僅 sw.js**（CACHE_NAME + 其描述註解）。`data.js`／`app.js`／`index.html`／`style.css`／`manifest.json`／`vercel.json`＝**byte-for-byte unchanged**（已 diff 驗證）。Test：`scenario_tests_service_worker_revision.js`（constants/labels）＋`scenario_tests_data_baseline.js`（current-cache expectation）。

## 9. Deployment filenames
canonical：`index.html` 參照 `./data.js`／`./app.js`／`./sw.js`／`./style.css`／`./manifest.json`；SW `ASSETS` 亦用 canonical 檔名。下載檔若帶 timestamp，部署前務必更名回 `data.js`／`app.js`／`sw.js`（其餘同名）。

## 10. Final verdict

> **V21.7d Accommodation Web Data Sync — FINAL DEPLOYMENT PASS**
> **Deployment cache = `swiss-trip-v21-7d-final-accsync-r2-2027`**
> **Ready for production deployment.**

logical version 維持 V21.7d；data/app/itinerary/住宿內容未被更動；既有 PWA 於偵測新 sw.js 後將建立 r2 cache、刪除前一版 accsync cache、由 r2 提供最新 data.js／app.js。
