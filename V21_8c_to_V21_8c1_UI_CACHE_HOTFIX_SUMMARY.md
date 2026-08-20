# V21.8c → V21.8c1｜Production UI / Cache Hotfix Summary

**Web App**：V21.8c → **V21.8c1**　｜　**Itinerary Data**：**V21.4g（凍結，未修改）**　｜　**Build**：`V21.8c1-20260820`
**SW cache**：`swiss-trip-v21-8c-v21-4g-final-residual-seal-2027` → **`swiss-trip-v21-8c1-v21-4g-ui-cache-hotfix-2027`**

---

## Issue 1｜住宿顯示舊 Atlanta — **Case B：cache / deployment bug（非 source bug）**

### Source-of-Truth Trace（§3）
| 檢查 | 結果 |
|---|---|
| `HOTELS.grindelwald.name` | **`Apartment Sans Souci W1 by Interhome`** ✅（address 3818 Grindelwald、phone +41 43 810 9126、priceCHF 2691.01、bookingStatus confirmed） |
| `BOOKINGS` 是否有 Atlanta / GRIWA | **無**；含 Sans Souci ✅ |
| `renderHotels()` 資料來源 | `const arr = [HOTELS.luzern, HOTELS.grindelwald]` — **只讀 HOTELS**，無 legacy hard-coded HTML、無其他 accommodation constant |
| 全 codebase 搜尋 `Apartment Atlanta`／`Atlanta by GRIWA`／`GRIWA RENT`／`GRIWA`／`Grundstrasse 19`／`CHF 3,274.8`／`3274.8` | **全部 0 命中**（含 js/html/css/json，連 comment／changelog 都沒有） |

**結論**：V21.8c source 完全正確，畫面上的 Atlanta 只可能來自 **舊 deployment bundle 或 Service Worker / PWA / browser 舊 cache**。
依 §5，**未改任何住宿資料**（HOTELS / BOOKINGS / DAYS 皆 byte-identical）。

### 修法（deployment / cache 路徑）
1. **Build fingerprint**（§6）：`TRIP_META.build = "V21.8c1-20260820"`，於 **工具頁頁尾**低干擾顯示三行：`Web V21.8c1 · Itinerary V21.4g` / `Build V21.8c1-20260820`。手機一眼確認實際載入的 bundle。
2. **Cache revision**（§7）：`CACHE_NAME` → `swiss-trip-v21-8c1-v21-4g-ui-cache-hotfix-2027`；skipWaiting／activate 清舊 cache／clients.claim／same-origin cache-first／offline fallback **全部保留未改**。
3. **升級驗證測試**（§8）：activate fixture 加入 V21.8b 與 V21.8c 兩個舊 cache，斷言「刪 4 個舊 cache、僅保留 8c1、clients.claim()」，並斷言交付 `data.js` 為 Sans Souci 版且 `./data.js` 在 ASSETS（升級必重新 precache）。

---

## Issue 2｜LIE 座位預約卡 Dark Mode 對比失敗

**原因**：卡片用固定淺色 inline gradient `linear-gradient(135deg,#EFF6FF,#F8FAFC)`，文字卻用 `var(--text)`／`var(--text-muted)`；Dark Mode 下 `--text` 變淺 → 淺底＋淺字。

**修法**（§10–12）：改用正式 CSS class `.lie-reservation-card`（＋`.lie-title`／`.lie-body`／`.lie-cta`），Light／Dark 分開定義。
- Light：淺藍底 `#EFF6FF→#F8FAFC`、`#93C5FD` border、深色文字。
- Dark：`linear-gradient(135deg,#17233A,#141821)` elevated surface、`#2F4C7A` border、`--text` 淺色文字、`#7FB3F0` 藍色 accent（CTA 用深色字）。

**同型 bug 一併修正**：住宿頁「🔑 入住條件」面板同樣是 `#EFF6FF` + `var(--text)`，改為 `.info-panel-blue`（同一 theme-aware 模式）。`app.js` 內已無任何固定淺色底。

### 實測對比（真實瀏覽器繪製色）
| 項目 | Light | Dark |
|---|---|---|
| 內文（body） | `#EFF6FF` / `#1E293B` = **13.44:1** | `#17233A` / `#F1F5F9` = **14.33:1** |
| 標題 | **4.98:1** | **5.14:1** |
| Zentralbahn 按鈕 | **5.42:1** | **6.13:1** |
| Current／Pending badge | 皆可讀（截圖確認） | 皆可讀（截圖確認） |

---

## Issue 3｜Maps schematic label 被框／線遮住

**原因**：`svgLink()` 固定把 label 放在 `y = my - 3`（線中點正上方 3px），node 近／label 長／box 寬時就壓線壓框。

**修法**（§16–19，**未改 node 座標、未改 topology**）：
1. 新增 `linkLabelOffset()`：**水平線 → 標上方**；**垂直線 → 標側邊**；**斜向 → 沿法線推開**。
2. 支援手動 override：`labelDx` / `labelDy` / `labelAnchor` / `labelPosition`。
3. **Text halo**：`paint-order="stroke" stroke="var(--bg-elev)" stroke-width="3" stroke-linejoin="round"` → 線不再穿過文字，Light／Dark 都適用、offline 不受影響、不需新增 rect。

### 使用手動 labelDx/labelDy 的 map（僅 4 條 link）
| Map | Link | Override |
|---|---|---|
| Luzern | `lift → lug`「跟 Gepäck 指標」 | `labelDy:-16` |
| Luzern | `hall → plat`「往月台」 | `labelDx:-46, labelAnchor:"end"`（避開中間的「主入口」node） |
| Interlaken Ost | `conc → bob`「看電子看板找 BOB」 | `labelDx:-14, labelDy:6, labelAnchor:"end"` |
| ZRH | `chk → sec`「T-90 前完成」 | `labelDx:16, labelDy:8, labelAnchor:"start"` |

其餘 map（Grindelwald／Lauterbrunnen／Grütschalp／Mürren／Brienz）**全部使用自動偏移即可**，未加 override、未動座標。

### Label collision QA（§24）
以 production 幾何計算，8 張 P0 schematic：**node↔node = 0**、**link label↔node box = 0**、**label↔label = 0**。

---

## Regression（§29・全部實跑）

| 測試 | Pass | Fail | Skip |
|---|---:|---:|---:|
| `node --check` data／app／sw | PASS | 0 | 0 |
| today_engine | 17 | 0 | 0 |
| real_itinerary | Critical 0 / Warning 0 / Info 0 | 0 | 0 |
| data_baseline | **195** | 0 | 0 |
| day8_plan_lifecycle | 48 | 0 | 0 |
| plan_choice_storage | 84 | 0 | 0 |
| storage_integrity | 103 | 0 | 0 |
| storage_consumers | 90（jsdom）／84（plain node） | 0 | 0（plain 時 6） |
| service_worker_revision | **50** | 0 | 0 |
| maps_navigation | **185** | 0 | 0 |

新增 guards：Accommodation production guard（**檢查 runtime objects**，非全 source 字串零出現）｜build fingerprint 一致性｜cache upgrade（刪 8b/8c、保留 8c1）｜LIE Light/Dark contrast＋不得用 inline fixed gradient｜label placement（無固定 `my-3`、有 halo、支援 override）｜label↔node／label↔label collision。

## Browser QA（§23／§30・真實 Chromium）— **41/41 PASS**
- **Test A（乾淨 profile）**：建立 8c1 cache｜住宿顯示 Sans Souci、無 Atlanta/GRIWA｜build fingerprint = V21.8c1。
- **Test B（先裝 V21.8c，且舊 cache 內植入 legacy Atlanta bundle）**：升級前 **SW 確實回傳 legacy bundle（成功重現手機症狀）** → 部署 8c1 → **8b/8c cache 皆被刪除、僅保留 8c1** → SW 服務的 `data.js` 不再是 legacy → 住宿顯示 Sans Souci → Luzern（KoBi）未受影響、Google Maps 導航按鈕可用 → Sans Souci Pending wording 正常 → build fingerprint = V21.8c1。
- **Visual QA（Light/Dark × 375/390，實際截圖人工確認）**：LIE card、Luzern／Interlaken Ost／ZRH／Mürren schematic 共 20 張截圖。確認 **文字未被框遮住、線不穿字、label 不壓 node、無水平溢出、無 app error**。

## Production diff（§27）
| 檔案 | 變動 |
|---|---|
| `data.js` | version metadata＋`build` fingerprint；4 條 link 的 label offset metadata |
| `app.js` | LIE／info-panel 改 CSS class；`linkLabelOffset()`＋halo；`buildFingerprintHTML()` |
| `style.css` | `.lie-reservation-card`／`.info-panel-blue` Light＋Dark |
| `sw.js` | cache revision＋版本註解 |
| `index.html`／`manifest.json`／`vercel.json` | **未修改** |

**Itinerary freeze**：`DAYS`／`HOTELS`／`BOOKINGS`／`PENDING_2027`／`LUGGAGE_MILESTONES`／`FLIGHT_ITINERARY`／`BRB_DAY_PLAN`／`QUICK_NUMBERS`／`SIGHTS`／`DAY_PLAN_CHOICES`／`DAY_MAP_LINKS` **全部 IDENTICAL**；`MAP_GUIDES` 非 links 欄位 0 變動（座標／topology／schematic 未動）。**itinerary drift = 0。**

## High / Critical
**無。** 未發現新的 High／Critical，無 unexpected production diff。

## Not Tested
真機 iPhone／Android PWA、Vercel production 部署、真實行動網路離線。
