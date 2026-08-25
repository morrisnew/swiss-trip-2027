# 交叉驗證結果（Claude 自查 × ChatGPT 獨立驗證）

## 一、結論

| 指標 | 結果 |
|---|---|
| 兩邊都判 ✅（結論一致） | **多數項目一致**，無互相矛盾 |
| ChatGPT 發現、我漏掉的錯誤 | **1 項（A2）** — 已修正 |
| 我發現、ChatGPT 未提的問題 | 0 項 |
| **會造成現場走錯路線／上錯車的錯誤** | **0 項** |
| **會造成預算低估的錯誤** | **0 項** |
| 我先前的「待複驗」項目 | **已由 ChatGPT 解決（見二）** |

---

## 二、我先前的懸念被解掉了

**Day 7 Männlichen GGM 是否 STP 50%**（我第 1 輪列為唯一衝突，傾向網站正確）
→ ChatGPT 查得 **Männlichen 官方票價頁明列 Swiss Travel Pass 50%、單程 CHF 34**，**網站正確**。
我當時的推論（社群那則「免費」是指 2019 已停用的舊 Grund 線／混淆了 BOP 與 STP）也獲得佐證：
ChatGPT 特別指出「Jungfrau Travel Pass／BOP 與 STP 的適用待遇不同，是更容易發生混淆的地方」。

---

## 三、ChatGPT 判 ❌ 的唯一項目：A2 Pilatus —— **它是對的，我漏了**

### 問題
網站原文：
> 「不要買整段 Golden Round Trip 套票（船 + Bus 對持 STP 者已 100% 免費**會重複計價**）」

- **結論部分正確**：pilatus.ch 官方 FAQ 確實說「持 STP 者船與 Bus 免費，只需另購上下山折扣票」。
- **理由部分無官方依據**：「買了**會重複計價**」是推論。官方只說「不需要買整套」，沒說「買了會被重複收費」；
  且 Pilatus 官方本身有可套用優惠資格的票務產品。

### 我的疏漏
上一輪我查到官方 FAQ 後，只確認了「結論成立」就判 ✅，**沒有回頭驗證那個括號裡的理由**。
這正是「聽起來合理就打勾」的失誤——而我自己寫進 prompt 要求 ChatGPT 不要犯。

### 修正（Before → After）
| | 內容 |
|---|---|
| **Before** | 不要買整段 Golden Round Trip 套票（船 + Bus 對持 STP 者已 100% 免費**會重複計價**） |
| **After** | 持 STP **不需要**買整段 Golden Round Trip 套票。pilatus.ch 官方明載「持 Swiss Travel Pass 者，船與 Bus 免費，只需另購上下山的折扣票」，上下山山區段為 **STP 50%**（**折扣僅適用 Kriens／Alpnachstad–Pilatus 區間**）。⚠️ 官方仍有可套用優惠資格的套票產品，**何者較划算請出發前於 pilatus.ch 現場比價，不預設套票一定較貴** |

**預算 note 同步修正**：「STP 半價組合票」（易誤解為整套半價）→「**上下山山區段 STP 50%**（船與 Bus 對 STP 免費，不需買整套 GRT）；2027 預估 CHF 60-68／人，取高標（保守估）」。
**金額未動**（全團總預算仍 NT$ 685,540.4）——ChatGPT 指出此項若有偏差是**高估**而非低估，屬保守方向，不影響安全性。

---

## 四、順帶補進的 2 項官方事實（非錯誤修正）

| 項目 | 內容 | 來源 | 為什麼值得補 |
|---|---|---|---|
| Day 10 | **BLS 湖船不可劃位**（官方：free seating、reservations not possible），帶推車與幼兒請提早到碼頭排隊搶位 | bls-schiff.ch | 4 大 1 小＋推車，上船搶不到位是真實現場風險 |
| Day 4 | Luzern 往 Alpnachstad 的船在車站正對面 **pier number 2** | pilatus.ch | 現場找碼頭 |

---

## 五、ChatGPT 判 ⏸（10 項）— 我同意，且**不應改**

| 類型 | 項目 | 我的判斷 |
|---|---|---|
| 2027 未公布 | B5（Day 11 轉乘拓撲）、C2／C3／C4（SBB 動態車程） | **同意**。網站已標 Pending，維持即正確 |
| 找不到官方散客價 | A4（Allmendhubel CHF 12）、A8（First 折後 CHF 35） | **同意**。**折扣比例 50% 兩邊都已確認**，只有金額待 2027；網站已標 current reference |
| 用詞可再精確 | A11「6 歲以下多數山區交通與門票免費」把「交通」與「門票」混談 | **同意這是措辭寬鬆**，但屬 Low；本輪未改，記錄備查 |
| 本身就是 Pending | C7（Sans Souci 300m／4–5 分） | **同意**。門牌本來就標 Pending，網站敘述一致 |
| 來源政策所限 | B4（Brienz 三站體）、C6（步行 5–10 分）、D3（La Grotte） | **同意判 ⏸**。這是我的 prompt 要求「找不到官方就不判 ✅」的正確執行，不代表錯誤 |

> ⏸ 不等於錯。這 10 項沒有一項被查出與官方**牴觸**。

---

## 六、修正後回歸（全部實跑）

| 測試 | 結果 |
|---|---|
| `node --check` data／app／sw | PASS |
| today_engine | 17/17 |
| real_itinerary | Critical 0 / Warning 0 / Info 0 |
| data_baseline | 195/195 |
| day8_plan_lifecycle | 48/48 |
| plan_choice_storage | 84/84 |
| storage_integrity | 103/103 |
| storage_consumers | 90/90 |
| service_worker_revision | 50/50 |
| maps_navigation | 185/185 |
| **content_completeness** | **61/61**（53 → +8 A2 防回歸守門） |
| dark_mode_ui | 75/75 |

**新增守門**：不得再出現「重複計價」｜須保留官方措辭｜須標明折扣區間限制｜不得預設套票較貴｜BUDGET note 不得用「半價組合票」｜總額不得變動｜Day 10 BLS 不可劃位｜Day 4 pier 2。

## 七、變動範圍（freeze evidence）

| 檔案 | 結果 |
|---|---|
| `app.js`／`style.css`／`sw.js`／`index.html`／`manifest.json`／`vercel.json` | **IDENTICAL ✅** |
| **Excel V21.4g** | **IDENTICAL ✅（diff = 0）** |
| `data.js` | 變動限於 **DAYS Day 4、Day 10**、**BUDGET note**、**build fingerprint** |
| 其他 dataset（HOTELS／BOOKINGS／SIGHTS／RAIN_PLANS／RESTAURANTS／PENDING_2027／LUGGAGE_MILESTONES／DAY_PLAN_CHOICES／MAP_GUIDES／TRAVEL_BOUNDARY／PACKING／WEATHER_DECISION／FLIGHT_ITINERARY／EMERGENCY／QUICK_NUMBERS） | **全部未變 ✅** |
| 全團總預算 | **NT$ 685,540.4 未變 ✅** |

**Build fingerprint**：`V21.8c1-20260820` → **`V21.8c1-20260821`**（內容有變，便於手機確認實際載入版本）。
**Web 版本仍 V21.8c1、Itinerary 仍 V21.4g、cache 未 bump**（該 package 尚未正式部署，沿用上一輪決策）。

## 八、綜合結論

- 兩份獨立查證合計涵蓋 **30 項宣稱**，**發現真錯誤 1 項（A2 措辭），已修正**。
- **0 項會造成現場走錯路線或上錯車**；**0 項造成預算低估**。
- 最高風險的票務骨架 —— **Rigi 全免費 / Pilatus 僅 50% / WAB 僅 25% / Männlichen 50% / SPB 50% / First 50% / BRB 半價 / BLM 與湖船免費 / Terminal 兩纜車辨識** —— **全部與官方一致**。
- 其餘未決項目本質上都要等 **2027 官方公布**，網站已正確標為 Pending。

> **交通與票務事實層面：可安全執行。** 目前無已知會導致現場失誤或費用短缺的錯誤。
