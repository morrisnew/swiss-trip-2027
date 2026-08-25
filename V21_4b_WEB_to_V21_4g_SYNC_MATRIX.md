# V21.4b_WEB → V21.4g｜Itinerary Sync Matrix

**Web App version**：V21.7d → **V21.8**　｜　**Itinerary Data version**：V21.4b(web 實作) → **V21.4g**
**Deployment cache**：`swiss-trip-v21-7d-final-accsync-r2-2027` → `swiss-trip-v21-8-v21-4g-maps-2027`

---

## ✅ 輸入限制已解除（2026/08 更新）

`瑞士行程_最終版_V21.4g.xlsx` 其後已提供，並完成**逐格驗證**：本矩陣的 21 項判定全部獲母版佐證，
另發現並修正 2 項僅逐格比對可見之差異（Day 8 區塊時間、Day 11 步行時間）。
詳見 `V21_4G_EXCEL_CELL_LEVEL_VERIFICATION.md`。以下為當時的限制說明，保留備查。

---

## ⚠️（歷史）輸入限制

`§二` 指定 Level 1 權威為 `瑞士行程_最終版_V21.4g.xlsx`，但**該檔未包含於本輪上傳**。
實際收到：`瑞士行程_最終版_V21.4a.xlsx`、`瑞士行程_最終版_V21.4b_最終封板版.xlsx`，以及
**完整未斷鏈的五份修正摘要**（4b→4c→4d→4e→4f→4g）。

依 `§三`「不要卡住等待」原則，本輪以下列組合作為替代權威：

| 來源 | 用途 | 可信度 |
|---|---|---|
| V21.4b xlsx | 同步起點 baseline | 直接讀取 |
| 4b→4c／4c→4d／4d→4e／4e→4f／4f→4g summary | 逐輪變更清單（各輪皆聲明該輪 diff 窮舉；4g 明載「Unexpected diffs = 0，僅 6 格」） | 高（鏈完整、無缺口） |
| prompt `§五` 已知重要變化 | 交叉驗證 | 高 |

**未能驗證之範圍**：任何「未被上述 summary 記載」的 V21.4g 儲存格層級差異。
本文件不宣稱已逐格比對 V21.4g Excel。若日後提供 V21.4g xlsx，建議重跑一次逐格比對以關閉此缺口。

---

## Classification 定義
A. Already aligned｜B. Stale from V21.4b｜C. Web-only enhancement｜D. Unauthorized Web drift｜E. 2027 Pending｜F. Obsolete / remove

---

## Matrix

| # | Day / Module | Current Web（同步前） | V21.4g（依 summary 鏈） | Class | Required Action | 狀態 |
|---|---|---|---|---|---|---|
| 1 | Day 2 Rigi 下山 | 「下山第一段：下坡健行至 Rigi Kaltbad」、tr「步行 2.5km」、「留出充裕時間走碎石坡」 | Default＝齒軌火車；步行降 Optional（A03/M08） | **B** | 改 Default 齒軌火車、步行標 Optional、刪碎石坡 | ✅ 已改 |
| 2 | Day 2 假固定班次 | （已無「約每整點/xx:15」） | 依當日 rigi.ch／SBB | **A** | 無 | ✅ |
| 3 | Day 2 回程景點 | timeline「獅子紀念碑 ＋ 舊城區晚餐」 | 移除，改 Kapellbrücke→Old Town→dinner→rest（A05） | **B** | 換 block、Day 3 保留獅子紀念碑 | ✅ 已改 |
| 4 | Day 3 SBB luggage 時段 | `07:00–09:00`、「櫃台通常 07:00 開門」 | 07:45 出發→08:00 開門後辦理→08:20–08:30（M01/F01） | **B** | 改時段與敘述 | ✅ 已改 |
| 5 | Day 3 luggage milestone | `D3_send` date「9/16 (四) 07:00」 | 08:00 起 | **B** | 改 milestone | ✅ 已改 |
| 6 | Day 3 BOOKINGS 任務 | 「07:00 琉森車站 Luggage dispatch」 | 07:45 出發／08:00 辦理 | **B** | 改 how | ✅ 已改 |
| 7 | Day 3 起床 07:00 | 「早上 07:00 起床」 | 允許（非行李殘留，V21.4f 已認可） | **A** | 保留 | ✅ |
| 8 | Day 5 抵達／入住 | 13:00–15:00「入住前等待時段」、critical「15:00 前不得進入公寓」 | 同（A01） | **A** | 無 | ✅ |
| 9 | Day 5 key collection | 「Morris 輕裝**去 Interhome 辦公室**辦理 key collection」 | 不得預設 office pickup（M04/U02/§五-3） | **D** | 改為「依最終 instructions；office／lockbox／self check-in 未確認前不預設」 | ✅ 已改 |
| 10 | Day 5 Interhome 地址敘述 | 「精確地址與**辦公室位置**訂房後 email 告知」 | 同上 | **D** | 改為 Pending 中性敘述 | ✅ 已改 |
| 11 | HOTELS.grindelwald.office | 「Interhome 辦公室，位置／領鑰匙方式待確認」 | 不預設 office | **D** | 中性化 | ✅ 已改 |
| 12 | Sans Souci pendingItems | 含「Interhome 辦公室 / 密碼鎖」 | 並列選項、不預設 | **D** | 加入 self check-in、標明不預設 | ✅ 已改 |
| 13 | Day 6 Mürren 平坦度 | tr label「村內全平坦、無車」 | 無車、部分坡度/不平/碎石（U01/M09） | **B** | 改 label | ✅ 已改 |
| 14 | Day 6 funicular→BLM | 「15:30 下山…走回 BLM 站（約 1 分鐘）」 | 步行 5–10 分鐘、搭下一班、不硬綁班次（M03/U03） | **B** | 改敘述 | ✅ 已改 |
| 15 | Day 6 固定班次 | （已無 15:45／16:00／每 15 分鐘） | 同 | **A** | 無 | ✅ |
| 16 | Day 6 核心 | Lauterbrunnen→Mürren→Allmendhubel（Flower Park） | 同 | **A** | 無（§二十四 舊 drift 已修） | ✅ Already fixed |
| 17 | Day 8 A 方案時段 | 「Alpine Garden ＋ 短版 Trail（11:15–12:45）」 | 11:15–下山前、新優先序（A02/M02） | **B** | 改為 主觀景/Skywalk→Playground→午餐→Naturkino→Alpine Garden(Optional) | ✅ 已改 |
| 18 | Day 8 A 方案午餐銜接 | 「12:30–12:45 開始收尾」 | 不綁死、午餐後續 Naturkino/Garden | **B** | 改敘述 | ✅ 已改 |
| 19 | Day 8 推車措辭 | 「A：推車相對較友善」 | 非無障礙、非全程推車、必要時背架 | **B/C** | 保守化 | ✅ 已改 |
| 20 | Day 8 第二次 luggage | 「08:00 出門到車站寄送」 | 07:45 出發→08:00 counter 開門後辦理（§五-6） | **B** | 改時段與敘述 | ✅ 已改 |
| 21 | Day 8 07:30 行李 | （無 07:30） | 禁止 | **A** | 無 | ✅ |
| 22 | Day 8 傍晚午睡 | （無 16:30–18:30 固定午睡） | 依當日狀態（M11） | **A** | 無 | ✅ |
| 23 | Day 9 裝備推車 | 「後背包：…妞妞推車與野餐午餐」 | 背巾/背架主方案、推車非必帶（A07/M10） | **B** | 改敘述 | ✅ 已改 |
| 24 | Day 9 核心 | First→Bachalpsee→Bort | 同 | **A** | 無 | ✅ |
| 25 | Day 10 木雕村 | timeline「Brienz 木雕村紀念品快速採購（約 20 分鐘）」 | Optional Bonus + 硬性保護（A06/M06） | **B** | 標 Optional Bonus、加不得壓縮 BRB | ✅ 已改 |
| 26 | Day 10 BRB 主線 | BRB 為主線、BRB_DERIVED 推導 | 同 | **A** | 無（無假精確時間） | ✅ Already fixed |
| 27 | Day 11 Bern 轉乘 | 「Bern 同月台對向換車：走 5 步路到對面月台即可」 | 不預設固定值（A08） | **B** | 改為依當日 SBB App／看板 | ✅ 已改 |
| 28 | Day 11 Family Coach | 「IC 雙層列車**通常編有 FA**」 | 不預設一定掛車 | **B** | 加保留語 | ✅ 已改 |
| 29 | Day 11 T-90/T-60 | T-90 管理基準、非硬截止；T-60 抵 Gate | 同 | **A** | 無 | ✅ |
| 30 | Day 11 08:49 BOB | 主方案保留 | 同 | **A** | 無 | ✅ |
| 31 | STP PENDING note | 「基準方案…仍應與 8 天版／Half Fare 比較」 | 既定主方案、不重開比較（A09） | **B** | 改 note＋item | ✅ 已改 |
| 32 | STP BOOKINGS 任務 | 「票券方案最終比較與購買」 | 僅更新售價/範圍/規則後購買 | **B** | 改 task＋how | ✅ 已改 |
| 33 | 行李鏈 Day3→5→8→11 | D3_send/D5_receive/D8_send/D11_receive | 同 | **A** | 無 | ✅ |
| 34 | Day 7/8/9 天候互換 | 成立 | 同 | **A** | 無 | ✅ |
| 35 | 版本字串 | 「V21.7d Web · 基於 V21.4a 行程資料」 | 兩條版本線分開（§21） | **B** | version→V21.8／itineraryVersion→V21.4g | ✅ 已改 |
| 36 | Maps & Navigation | 不存在 | （Web-only 功能，非 itinerary fact） | **C** | Phase 2 新增 | ✅ 已增 |
| 37 | 2027 Pending（BRB/SPB timetable、ETIAS、航班、Gate、月台、STP 售價） | 已標 Pending | 同 | **E** | 維持，不轉 Confirmed | ✅ |
| 38 | Day 6 Staubbach 回程段 | Web 既有（V21.4a/b 期） | summary 未記載變更 | **A** | 不動（不發明變更） | ✅ |
| 39 | 「推車天堂」（Day 3 Verkehrshaus 等） | 存在 | 各自情境正確，非 Day 6（U01 明載非 scope） | **A** | 不動 | ✅ |

### 統計
- **B（Stale from V21.4b）＝ 17 項** → 全數修正
- **D（Unauthorized Web drift）＝ 4 項**（Day 5／HOTELS 的 Interhome office 預設）→ 全數修正
- **A（Already aligned）＝ 16 項**（含 §二十四 舊 drift 已修：Day 6 核心、Day 10 假精確時間、Day 5 入住邏輯、Day 11 stale wording）
- **C ＝ 1**（Maps）｜**E ＝ 1 類**（2027 Pending 維持）｜**F ＝ 0**

> 合計發現 **21 項 stale / drift**（B 17 + D 4），全部已於 Phase 1 修正。
