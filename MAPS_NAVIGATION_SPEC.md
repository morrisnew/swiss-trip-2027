# MAPS_NAVIGATION_SPEC.md｜地圖與導航 功能規格（Web V21.8）

## 0. 目標
現場以最低 cognitive load 回答三個問題：**我在哪裡？我要往哪裡？下一段交通怎麼搭？**
判斷標準：**10 秒內找到下一步**。地圖不是裝飾。

明確不做（§12/§28）：自建 navigation engine、turn-by-turn GPS、即時定位、Google Maps clone、
重度第三方 API、需 API key 才能基本使用、需網路才看得到核心資訊、重型 GIS。

---

## 1. Map Types

| Type | 中文 | 回答 | 實作 |
|---|---|---|---|
| `town` | 城鎮定位 | 抵達後重要位置在哪 | Mürren orientation |
| `route` | 當日移動鏈 | 今天整條鏈是什麼 | Day 6 flow、Day 10 flow |
| `station` | 站體指引 | 站內怎麼找 | Luzern／Grindelwald／ZRH |
| `transfer` | 轉乘指引 | 下一段怎麼轉 | Interlaken Ost／Lauterbrunnen／Grütschalp／Brienz→BRB |

---

## 2. P0（本輪完成）

| # | Guide id | 場景 | 對應 Day |
|---|---|---|---|
| P0-1 | `luzern_station` | Luzern Bahnhof · SBB 行李寄送 | 3 |
| P0-2 | `interlaken_ost` | Interlaken Ost · LIE → BOB 轉乘 | 5,6,8,10,11 |
| P0-3 | `grindelwald_station` | Grindelwald Bahnhof · 領／寄行李 | 5,8,9,10,11 |
| P0-4a | `lauterbrunnen_transfer` | Lauterbrunnen 上山轉乘 | 6 |
| P0-4b | `grutschalp_transfer` | Grütschalp 纜車↔BLM | 6 |
| P0-4c | `murren_orientation` | Mürren 村定位 | 6 |
| P0-5 | `brienz_boat_brb` | Brienz 碼頭 → BRB | 10 |
| P0-6 | `zurich_airport` | ZRH 領行李→報到→安檢→Gate | 11 |
| 附 | `day6_flow` / `day10_flow` | 當日移動鏈（Map Type B） | 6 / 10 |

**P1（未做，不阻塞 P0 上線）**：Rigi、Pilatus、Männlichen、Schynige Platte、First/Bachalpsee/Bort、Luzern Old Town、Grindelwald village。

---

## 3. Data Schema（`MAP_GUIDES` in data.js）

```js
{
  id, title,
  type: "town" | "route" | "station" | "transfer",
  priority: "P0" | "P1",
  relatedDays: [Number],
  status: "current_reference" | "pending",
  offlineAvailable: Boolean,
  lastVerified: "YYYY-MM",
  description: String,
  diagram: [{ node, note? }],      // 簡化示意圖節點（Not to scale）
  steps: [String],                  // 現場重點 3–5 點（route 型可 1–2）
  pendingNotes: [String],           // 當天可能改變／尚未確認
  officialLinks: [{ label, url }],  // 官方來源
  externalMap: String               // Google Maps fallback
}
```
另有 `DAY_MAP_LINKS = { day: [guideId] }` 供 Day 頁連結。

---

## 4. Offline Strategy（§19）
- 示意圖為**純 HTML/CSS 節點流**，與說明文字一併內建於 `data.js`／`app.js`；兩者已在 SW `ASSETS` → **隨核心資產 precache，離線可看**。
- 不新增圖片資產、不 hotlink 外部官方圖（§20：copyright／hotlink 穩定性／CORS／offline 皆不利）→ 採「官方連結 + 自製 simplified diagram」。
- 需要網路者於 UI 明示：Google Maps、官方即時資訊（SBB／Gate／timetable）。
- 已驗證：關閉伺服器後於真實 Chromium 重開，地圖頁仍完整可用。

---

## 5. Source Policy（§14）
- 交通／站體優先官方：SBB、Jungfrau、Schilthorn、Brienz Rothorn Bahn、BLS、Zürich Airport、Emirates。
- Google Maps 僅作 **navigation fallback / external link**，不作交通規則權威（測試強制 `officialLinks` 不得含 google 網域）。
- 本輪未使用部落格／Trip.com／AI 摘要等非官方來源。

---

## 6. Current / Pending 原則（§16）
- 每張卡有 `status`；`current_reference` 顯示「Current reference — verify for 2027」。
- **不鎖死** platform 號碼、Gate、櫃台、2027 timetable（測試以 regex 強制）。
- 例：Interlaken Ost 明示「不預設固定月台，以車廂外側目的地顯示／站內看板為準」；ZRH 的 Gate／櫃台／航廈標 2027 Pending。

---

## 7. UI（§13/§18）
- Card：Header（名稱／類型 icon／Day／離線標記）→ 展開後 status badge → 描述 → 簡化示意圖（標 **Not to scale**）→ 現場重點（最多 5）→ 🟡 當天可能改變 → Actions（官方連結／開啟 Google Maps）。
- 預設收合，一鍵展開；節點以編號圓點 + ↓ 呈現，手機不需 pinch zoom。
- 入口：底部導覽「工具」→ 地圖與導航；首頁 quick tile；**Day 頁「本日地圖與轉乘示意」**（Day 3/5/6/8/9/10/11）。
- 沿用既有 `.map-btn`／`.card`／`.critical-toggle`，**未新增 CSS 檔案**，不改動 bottom nav 5 項結構。
