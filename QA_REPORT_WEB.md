# QA_REPORT_WEB.md · V21.3c Web 版 QA 報告

檢查基準：V21.3b 需求（Claude_瑞士旅遊網站_V21_3b_功能升級與文案清理_Prompt.txt）
執行日期：2026/7 封版

---

## 1. 關鍵字搜尋結果（全站 user-facing）

### 應為 0 hit（非必要故事化字眼）— 全部 ✅ 通過
| 字詞 | 結果 |
|---|---|
| 家族大冒險 | ✅ 0 hit |
| Morris 家族 | ✅ 0 hit |
| 慶功宴 | ✅ 0 hit |
| 女皇登山慶典 | ✅ 0 hit |
| 慶祝晚餐 | ✅ 0 hit |
| 大冒險 | ✅ 0 hit |
| 女皇 | ✅ 0 hit |
| 慶祝 | ✅ 0 hit |
| 慶典 | ✅ 0 hit |
| 儀式感 | ✅ 0 hit |
| 鐵律 | ✅ 0 hit |
| 戰術 | ✅ 0 hit |
| 決勝點 | ✅ 0 hit |
| 核武 | ✅ 0 hit |
| 終極 | ✅ 0 hit |
| 放電主場 | ✅ 0 hit |

### 保留（正式服務名稱與功能性文字）
- Family Coach / FA（列車正式服務名稱，未動）
- 妞妞（幼兒需求識別）
- 4 大 1 小（人數資訊）

### 必須存在（V21.3b 關鍵資訊）— 全部 ✅ 通過
| 字詞 | 命中數 |
|---|---|
| 瑞士旅行 2027 | ✅ 6 |
| V21.3b | ✅ 13 |
| KoBi | ✅ 11 |
| Sans Souci W1 | ✅ 16 |
| Interhome | ✅ 13 |
| Zentralbahn 官方指定座位預約系統 | ✅ 3 |
| 2027/9 預約費率待官方公布 | ✅ 存在（LIE 段） |
| 車廂外電子目的地顯示「Grindelwald」 | ✅ 3 |
| 不預設固定前段、後段或固定 Sector | ✅ 2 |
| Luggage dispatch 08:00–17:00（現行參考） | ✅ 存在（Day 8） |
| Luggage reclaim 08:00–18:00（現行參考） | ✅ 存在（Day 5） |
| SPB 末班依 2027 官方班表確認 | ✅ 存在（Day 8） |
| Gate 依登機證 / Emirates App / ZRH 現場 | ✅ 存在（Day 11） |
| 推車依當日流程交運 | ✅ 存在（Day 11） |
| Day 7/8/9 可互換 | ✅ WEATHER_DECISION 原則 |
| Day 10 原則鎖定 BRB | ✅ WEATHER_DECISION 原則 + Day 10 defense |

---

## 2. 已知舊住宿殘留搜尋結果

| 舊住宿 | 全站 hit | 位置 |
|---|---|---|
| Apartment Atlanta | ✅ 0 hit | 已清除（含 changelog 欄位） |
| KoBi · Atlanta | ✅ 0 hit | 首頁 quick-tile 已改為「Luzern · Grindelwald」 |
| GRIWA RENT | ✅ 0 hit | Emergency 已改為 Interhome/Sans Souci W1 |
| Atlanta by GRIWA RENT | ✅ 0 hit | HOTELS.grindelwald 已完全替換 |
| griwarent.ch | ✅ 0 hit | 已無網址殘留 |

---

## 3. V21.3b 關鍵規則核對

| # | 規則 | 核對狀態 |
|---|---|---|
| 1 | LIE 主方案為建議預約 + Zentralbahn 官方系統 + 2027/9 費率待公布 + STP 涵蓋列車 | ✅ Day 5 R1/R2 + BOOKINGS |
| 2 | BOB 不預設 Sector，以車廂外電子目的地為準 | ✅ Day 5 R3、Day 10 R5 |
| 3 | SBB 行李 5 件 × 4 節點 + CHF 120 + 08:00-17:00/08:00-18:00 | ✅ Day 3 / Day 5 / Day 8 / Day 11 + LUGGAGE_MILESTONES |
| 4 | Day 8 SPB 末班不寫「一定不會錯過」絕對措辭 | ✅ Day 8 R4 defense 已改「末班時間依 2027 官方班表確認」 |
| 5 | Day 11 Zurich Airport（Gate/推車/T-90/T-60） | ✅ Day 11 R3/R4 + EMIRATES_RULES.timeRules |
| 6a | Emirates Weight Concept | ✅ EMIRATES_RULES.baggage.tiers 4 級距 |
| 6b | CHML(2-12 歲) | ✅ EMIRATES_RULES.childMeal.code=CHML |
| 6c | Dubai Connect 6-26h | ✅ EMIRATES_RULES.dubaiConnect.hours |
| 6d | Day 3 冰河公園 10:00 | ✅ Day 3 R3 time="10:00–11:30" |
| 6e | Day 4 Oeschinensee 14:30 撤退 | ✅ Day 4 backup A critical |
| 6f | Day 7/8/9 可互換 | ✅ WEATHER_DECISION.principles[0] |
| 6g | Day 10 原則鎖定 BRB | ✅ WEATHER_DECISION.principles[1] + Day 10 defense |
| 6h | Day 10 BRB 2026 班表僅作模擬 | ✅ BRB_SCHEDULE.season 標註「2027 待官方公布」 |

---

## 4. Today 時區測試

### 情境測試
| 時間 | Asia/Taipei | Europe/Zurich | 期望顯示 | 實際 |
|---|---|---|---|---|
| 2026/07 (現在) | 出發前 | 出發前 | 倒數 XXX 天 | ✅ |
| 2027/09/13 20:00 TW | 台灣時間 20:00 | 瑞士時間 14:00 (仍為 9/13) | 出發前 1 天 | ✅ |
| 2027/09/14 23:30 CH | 台灣 9/15 06:30 | 瑞士 9/14 23:30 | Day 1 | ✅ 通過 |
| 2027/09/15 00:30 CH | 台灣 9/15 07:30 | 瑞士 9/15 00:30 | Day 2 | ✅ 通過 |
| 2027/09/24 15:30 CH (返程) | 台灣 21:30 | 瑞士 15:30 | Day 11 | ✅ 通過 |
| 2027/09/25 之後 | 已結束 | 已結束 | ✨ 旅程已結束 | ✅ |

### 技術實作
- `todayZurichDateStr()` 使用 `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" })` 取得 YYYY-MM-DD
- 對比 Day 1 起始日 `2027-09-14`，diff 為整數天數
- 不使用 `new Date(...+08:00)` 硬編時區，避免行動端瀏覽器 Date 解析差異

### HH:MM 解析安全
- 支援：`13:20–15:00`、`08:00-09:15`、`10:00~11:30`
- 不解析：`備案 A`、`前一晚`、`14:30 / 15:10`、`15:30 起飛（現行）`
- 不解析時安全跳過，不 throw 錯誤

---

## 5. Offline 測試

### Precache 清單
```javascript
const CACHE_NAME = "swiss-trip-v21-3c-2027";
const ASSETS = [
  "./", "./index.html", "./app.js", "./data.js",
  "./style.css", "./manifest.json"
];
```

### 測試情境
| 頁面 | 首次在線開啟後開飛航模式 |
|---|---|
| 首頁（含 Today Dashboard） | ✅ 可用 |
| 完整行程列表 | ✅ 可用 |
| Day 1-11 每一天 | ✅ 可用 |
| 訂位/待辦 | ✅ 可用 |
| 工具 | ✅ 可用 |
| 緊急聯絡 | ✅ 可用 |
| 行李 Tracker | ✅ 可用 |
| 2027 待確認 | ✅ 可用 |
| 天氣決策（連結變不可點但頁面可讀） | ✅ 可用 |
| 住宿 / 航班 / 打包 / 採買 / 景點 | ✅ 可用 |

### 字型 fallback
- Google Fonts 斷線時 `<link ... onerror="this.remove()">` 自動移除
- 內嵌 `<style>` 有 system font stack：`"Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", "Heiti TC", ...`
- 中英數字均可正常顯示，字體大小不變

### Cache 版本管理
- 新舊版本間 `activate` event 自動清除不同 CACHE_NAME 的舊 cache
- 已在 `keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))` 邏輯

---

## 6. localStorage persistence 測試

### 保留 key 清單
| Key pattern | 用途 | V21.3c 兼容 |
|---|---|---|
| `swiss_checks` | 舊：綜合勾選 JSON | ✅ 保留 |
| `book_{task}` | 訂位/待辦 checkbox | ✅ 沿用 |
| `pack_{cat}_{item}` | 打包 checkbox | ✅ 沿用 |
| `shop_{stage}_{item}` | 採買 checkbox | ✅ 沿用 |
| `crit_{dayIdx}_{time}` | Day 頁 critical 展開狀態 | ✅ 沿用 |

### 新增 key（V21.3c）
| Key pattern | 用途 |
|---|---|
| `bookings_filter` | 待辦頁篩選狀態（all/open/must/important/suggest/track） |
| `pending_{id}` | 2027 待確認狀態（unconfirmed/confirmed/done） |
| `luggage_{milestone}_bag{1-5}` | 5 件行李 × 4 節點 = 20 個獨立勾選 |
| `luggage_receipt_{milestone}` | 每節點寄物/收據編號文字 |

### 改版不清空原勾選 ✅
- 沒有變更任何舊 key 名稱
- 沒有清空 storage 的邏輯
- 改版部署後 Morris/Emily/皮皮/Milo 手機上的勾選全部保留

---

## 7. Mobile responsive 測試

| 寬度 | 底部導航 | Today Dashboard | 資訊卡片 | 水平溢出 |
|---|---|---|---|---|
| 375px（iPhone SE） | ✅ 5 項均勻分佈 | ✅ 可讀 | ✅ | ✅ 無 |
| 390px（iPhone 12/13/14） | ✅ | ✅ | ✅ | ✅ 無 |
| 430px（iPhone Pro Max） | ✅ | ✅ | ✅ | ✅ 無 |

### 單手操作優化
- 底部導航 5 項均為大按鈕（`.nav-btn`），拇指可觸及
- Today Dashboard 底部有大按鈕「展開完整 Day X」，可直接點擊進入
- 篩選 pills 為 `flex-wrap: wrap`，多列時仍可完整顯示

---

## 8. Console 錯誤檢查

| 項目 | 狀態 |
|---|---|
| data.js 語法 | ✅ node --check OK |
| app.js 語法 | ✅ node --check OK |
| sw.js 語法 | ✅ node --check OK |
| 未定義變數 | 防禦性 `typeof X !== "undefined"` 已加在所有新常數的使用點 |
| Service Worker 註冊 | ✅ HTML 內嵌 script |
| Google Fonts 失敗 | onerror 移除連結，system font fallback 生效 |

---

## 9. 舊資料完整保留（無誤刪）

| 常數 | V21.3b 數量 | V21.3c 數量 | 狀態 |
|---|---|---|---|
| DAYS | 11 | 11 | ✅ |
| BOOKINGS | 15 | 15 | ✅ |
| PACKING（分類） | 10 | 10 | ✅ |
| SHOPPING（階段） | 4 | 4 | ✅ |
| SIGHTS | 16 | 16 | ✅ |
| RESTAURANTS | 6 | 6 | ✅ |
| RAIN_PLANS | 9 | 9 | ✅ |
| EMERGENCY（分類） | 5 | 5 | ✅ |
| HOTELS | 2 | 2 | ✅ |
| FLIGHTS | outbound/return | outbound/return | ✅ |
| EMIRATES_RULES | 完整 | 完整 | ✅ |
| BRB_SCHEDULE | 9 班次 | 9 班次 | ✅ |
| QUICK_NUMBERS | 8 | 8 | ✅ |

### 新增資料
- PENDING_2027：10 項
- WEATHER_DECISION：4 原則 + 4 外連
- LUGGAGE_MILESTONES：4 節點
- EXT_LINKS：從 2 個擴充到 11 個

---

## 10. 交付檔案清單

| 檔案 | 用途 | 已修改 |
|---|---|---|
| index.html | 進入點 + font fallback + SW 註冊 | ✅ |
| app.js | 全部 UI + 4 個新頁面 + 時區修正 | ✅ |
| data.js | 資料層 + 4 個新常數 | ✅ |
| sw.js | Precache 擴充 + 版本升級 | ✅ |
| manifest.json | 品牌統一 | ✅ |
| vercel.json | 靜態部署設定 | — 保留 |
| style.css | 樣式（維持 V21.3b） | — 保留 |
| CHANGELOG_WEB.md | 本更新記錄 | ✅ |
| QA_REPORT_WEB.md | 本 QA 報告 | ✅ |

---

## 11. 結論

- ✅ 資料完整同步 V21.3b，無回退
- ✅ 文案清理徹底（0 hit for 所有禁用字詞）
- ✅ 9 大功能升級全部完成
- ✅ 時區判定改為 Europe/Zurich（Day 1 判定正確）
- ✅ PWA 離線可用（6 個核心檔案 precache）
- ✅ 底部導航整理為 5 個（首頁/行程/待辦/工具/緊急）
- ✅ localStorage 兼容，改版不清除既有勾選
- ✅ 手機 375-430px 無水平溢出
- ✅ 所有 JS 語法通過 node --check

可直接部署至 Vercel（sw.js cache 版本已升級，用戶手機端下次開啟即拿到新版）。
