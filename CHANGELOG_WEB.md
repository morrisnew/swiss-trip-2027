# CHANGELOG_WEB.md · V21.3b → V21.3c Web 版更新

版本：V21.3c（Web 部署版）
基準：V21.3b 資料層
封版日：2026/7

---

## 1. 資料同步修正（跟 V21.3b 對齊，無資料回退）

### 住宿
- HOTELS.grindelwald：`Apartment Atlanta by GRIWA RENT` 已完全清除，替換為 **Apartment Sans Souci W1 by Interhome**（108㎡ · 2 房 2 衛 · 1 樓+電梯 · cul-de-sac 死巷 · CHF 2830）
- HOTELS.grindelwald.changelog 欄位（舊住宿歷史）**已從資料層刪除**，不再於前台呈現
- Emergency 住宿聯絡：`GRIWA RENT +41 33 854 11 40` → `Interhome / Sans Souci W1 (格林德瓦) · 聯絡方式以訂房確認信為準`
- PACKING 文件清單：「訂房憑證（KoBi + Apartment Atlanta）」→「訂房憑證（KoBi + Sans Souci W1）」
- 首頁 quick-tile 副標：「KoBi · Atlanta」→「Luzern · Grindelwald」
- QUICK_NUMBERS：GRIWA RENT 電話 entry 已移除，改為 Interhome/Sans Souci W1

### 品牌與副標
- 主標題：「瑞士家族大冒險 2027」→ **「瑞士旅行 2027」**
- 副標題：「Morris 家族親子行程」→ **「4 大 1 小・瑞士親子自由行」**
- manifest.json name/short_name/description、index.html title、apple-mobile-web-app-title 全部同步

### V21.3b 關鍵資料不回退
- ✅ LIE 主方案：Zentralbahn 官方指定座位預約系統，2027/9 費率待公布，STP 涵蓋列車本身，未預約仍可搭作備援
- ✅ BOB：不預設固定前段/後段/Sector，以車廂外電子目的地顯示「Grindelwald」為準
- ✅ SBB 行李主線：Day 3 寄→Day 5 領→Day 8 寄→Day 11 領，主預算 CHF 120，dispatch 08:00-17:00、reclaim 08:00-18:00（現行參考）
- ✅ Day 8 SPB：不含「一定不會錯過末班」絕對措辭
- ✅ Day 11 ZRH：Gate 依登機證/Emirates App/ZRH 現場；推車依當日流程交運；T-90 Passport/Security 管理基準、T-60 Economy 抵 Gate
- ✅ Emirates：Weight Concept、CHML(2-12 歲)、Dubai Connect 6-26h 完整保留
- ✅ Day 3 冰河公園 10:00 開門、Day 4 Oeschinensee 14:30 撤退、Day 7/8/9 可互換、Day 10 原則鎖定 BRB、Day 10 BRB 2026 班表作模擬

---

## 2. 文案清理（非必要故事化字眼 0 hit）

### 已 0 hit 字詞（user-facing）
- 家族大冒險 / Morris 家族 / 大冒險
- 女皇登山慶典 / 女皇
- 慶功宴 / 慶祝晚餐 / 慶祝 / 慶典 / 儀式感
- Sector B = Grindelwald / Grindelwald 一定是後段
- EK 通常在 D 大廳

### 戲劇化字眼降級
- 「戰術」→「方案」（SBB 行李戰術寄送 → SBB 行李寄送、硬派戰術 → 主方案、全寄策略保留為「全部寄送方案」）
- 「鐵律」→「原則」（SOP 鐵律 → SOP）
- 「終極」→「主要」（終極防禦邏輯 → 主要防禦邏輯）
- 「放電主場」→「放電區」
- 「主場」→「重點」
- 「高潮」→「重點行程」
- 「拆解雷區」→「轉乘關鍵段」
- 「洗衣球致命安全規則」→「洗衣球包裝規則」
- 「隊長 · 導航 · 交通後勤」→「負責人 · 導航 · 交通後勤」

### 保留（正式名稱不動）
- SBB / BOB / BRB / SPB / STP / LIE / GGM / WAB / zb
- Emirates / EK87 / EK88 / EK366 / A380 / CHML / bassinet
- Family Coach / FA
- 妞妞 / 4 大 1 小

---

## 3. 新功能（全部 V21.3b delta 指令實作）

### A. Today 現場模式（首頁）
- 出發前倒數採用 Asia/Taipei
- **Day 1-11 判定改用 Europe/Zurich 時區**（`Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" })`）
- 通過測試：2027/09/14 23:30 Europe/Zurich（≒ 台灣 2027/09/15 06:30）仍顯示 Day 1
- 首頁 Today Dashboard 卡片顯示：Day X + 主題、日期、地點、瑞士當前 HH:MM、目前正在（🟢）/下一步（🔵）、今日住宿、今日重要提醒（前 3 條 critical）、展開完整 Day 按鈕
- HH:MM–HH:MM 時段可解析；「前一晚」「備案 A」等不可解析格式安全跳過

### B. 2027 待確認控制中心（`renderPending`）
- 10 項待確認清單（航班/班表/預約/營運/物流/票務/入境/住宿）
- 每項 3 態切換：🟡 未確認 / 🔵 已確認 / 🟢 已完成
- 狀態存 localStorage（key: `pending_{id}`）
- 統計卡片顯示三態計數
- 官方連結透過 EXT_LINKS 動態渲染，無 URL 不顯示連結按鈕

### C. 全站狀態 Badge
- 🟢 已確認/已預訂：`safe-green` 色系
- 🔵 現行官方資料：`jungfrau-blue` 色系
- 🟡 2027 待確認：`gold` 色系
- ⚪ 預算/時間估算：中性灰
- 已應用於 2027 待確認頁三態統計，並於 QUICK_NUMBERS 中 EK88 標註「現行參考；2027 訂票時實際為準」

### D. SBB 行李追蹤（`renderLuggage`）
- 5 件 Bag × 4 節點（D3 寄 → D5 領 → D8 寄 → D11 領）= 20 個獨立勾選格
- 每節點顯示 `X/5 到齊` badge，全數勾選轉綠
- 收據/寄物編號輸入欄位（localStorage，key: `luggage_receipt_{id}`）
- 總進度條 + 完成度百分比

### E. 訂位/待辦 Dashboard 強化（`renderBookings`）
- 進度條與完成度百分比（已存在 → 保留）
- **新增篩選 pills**：全部 / 未完成 / 必做 / 重要 / 建議 / 追蹤
- 篩選狀態存 localStorage（key: `bookings_filter`），改版不清除
- 保留現有勾選狀態（key: `book_{task}`）
- 頁面 title 從「訂位清單」改為「待辦 / 訂位」（因新增追蹤類項目）

### F. 天氣決策中心（`renderWeather`）
- **不接即時天氣 API**（依指令說明）
- 4 條核心原則卡片：Day 7/8/9 互換 · Day 10 鎖定 BRB · 白牆撤退 · 下雨低海拔優先
- 4 個官方外連：MeteoSwiss / BRB 營運 / Pilatus / SPB
- 全部連結透過 EXT_LINKS 集中管理，無 URL 不顯示

### G. 一鍵操作連結
- Google Maps 按鈕（現有 data-map）保留
- BOOKINGS 頁的 `how` 欄位自動偵測 URL（http/www/.ch/.com 等）並轉可點連結
- 2027 待確認頁每項有官方連結按鈕（若 EXT_LINKS 內有 URL 才顯示）
- 天氣決策頁 4 個官方連結
- Day 10 頁保留「今日 BRB 是否正常營運」跳轉
- 所有外部連結一律 `target="_blank" rel="noopener noreferrer"` + `data-ext-link` 阻止冒泡

### H. PWA 真正離線可用
- CACHE_NAME：`swiss-trip-v21-2027` → `swiss-trip-v21-3c-2027`
- Precache 檔案清單擴充：`./` `./index.html` `./app.js` `./data.js` `./style.css` `./manifest.json`
- Google Fonts fallback：`<link ... onerror="this.remove()">` + `<style>` 內建 system font stack（Noto Sans TC → PingFang TC → Microsoft JhengHei → -apple-system → ...）
- 舊 cache 自動清除（`activate` event 已存在保留）

### I. 底部導航整理為 5 個
- **首頁 · 行程 · 待辦 · 工具 · 緊急**
- 原本的採買、打包收進「工具」頁
- 工具頁彙集 8 項：行李追蹤 / 2027 待確認 / 天氣決策 / 住宿 / 航班+Emirates 規則 / 打包 / 採買 / 景點
- 不刪除任何原有頁面（`renderShopping` / `renderPacking` / `renderSights` / `renderHotels` / `renderFlights` 全部保留可用）

---

## 4. PWA / offline 修改

| 項目 | 變更 |
|---|---|
| CACHE_NAME | `swiss-trip-v21-2027` → `swiss-trip-v21-3c-2027` |
| Precache | 從 2 個檔案 → 6 個檔案（含全部核心 asset） |
| Font fallback | Google Fonts onerror 移除連結；system font stack 直接內嵌到 HTML |
| Cache 策略 | Cache-first for GET 同源；跨網域走網路（保留原邏輯） |

---

## 5. 尚待 2027 確認事項（PENDING_2027 · 10 項）

| # | 項目 | 建議確認時間 | 官方連結 |
|---|---|---|---|
| 1 | EK87 / EK88 2027 正式航班時間 | 訂票時（2026/11） | emirates.com/tw |
| 2 | BRB 2027 班表 | T-2 個月（2027/7） | brienz-rothorn-bahn.ch |
| 3 | SPB 2027 班表與末班 | T-2 個月（2027/7） | jungfrau.ch |
| 4 | LIE 2027/9 座位預約費 | T-1 個月（2027/8） | sbb.ch |
| 5 | Pilatus 2027 齒軌預約政策 | T-3 個月（2027/6） | pilatus.ch |
| 6 | 高山設施 2027 營運期 | T-3 個月（2027/6） | — |
| 7 | SBB Gepäck 2027 櫃檯時段/費率 | T-1 個月（2027/8） | sbb.ch/baggage |
| 8 | STP 2027 正式價格/購買 | T-2 個月（2027/7） | swissrailways.com |
| 9 | ETIAS 實際執行狀態 | T-6 個月（2027/3） | travel-europe.europa.eu/etias |
| 10 | Interhome Sans Souci W1 鑰匙交付方式/地址 | 訂房後 | interhome.ch |
