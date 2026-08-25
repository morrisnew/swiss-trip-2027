# WEB_V21_4G_MAPS_IMPLEMENTATION_SUMMARY.md

**Web App version**：**V21.8**（原 V21.7d）　｜　**Itinerary Data version**：**V21.4g**（原 web 實作停在 V21.4b）
**Deployment cache**：`swiss-trip-v21-8-v21-4g-maps-2027`（原 `…-v21-7d-final-accsync-r2-2027`）
**本輪**：Phase 1 行程同步（V21.4b→V21.4g）＋ Phase 2 Maps & Navigation

> ⚠️ **輸入限制**：`瑞士行程_最終版_V21.4g.xlsx`（Level 1）未附。改以 V21.4b xlsx ＋ 完整未斷鏈之
> 4b→4c→4d→4e→4f→4g 五份 summary ＋ prompt §五 為權威。未被 summary 記載之 V21.4g 儲存格層級差異無法驗證。
> 詳見 `V21_4b_WEB_to_V21_4g_SYNC_MATRIX.md`。

---

## 1. Phase 1｜Itinerary Sync 修改（21 項 stale/drift 全修）

| Day / Module | 修改內容 |
|---|---|
| Day 2 | Kulm→Kaltbad **Default＝齒軌火車**、步行降 **Optional**；刪「走碎石坡」；回程改 **Kapellbrücke→舊城→晚餐→休息**（獅子紀念碑改由 Day 3 正式承接） |
| Day 3 | SBB luggage **07:45 出發／08:00 開門後辦理／08:20–08:30 完成**（時段、步驟、luggage milestone、BOOKINGS 四處同步） |
| Day 5 | **移除 Interhome office 預設**（改「依最終 key collection instructions；office／lockbox／self check-in 未確認前不預設」）；13:00≠入住、15:00 起入住維持 |
| Day 6 | Mürren 移除「全平坦」；funicular 後 **步行 5–10 分鐘搭下一班**（刪「1 分鐘」與固定班次） |
| Day 8 | A 方案 **11:15–下山前**＋新優先序（主觀景/Skywalk→Playground→午餐→Naturkino→**Alpine Garden 最後 Optional**）；推車措辭保守化；第二次 luggage **07:45 出發／08:00 counter 開門後辦理 → Zürich Flughafen** |
| Day 9 | 幼兒主方案 **背巾/背架**，推車改 **非必帶** |
| Day 10 | 木雕村降 **Optional Bonus** ＋硬性保護（不得壓縮 BRB／回程／Barry's／休息） |
| Day 11 | 移除 Bern「走 5 步到對面月台」與 Family Coach「通常編有」→ 一律依當日 SBB App／看板；08:49 BOB 主方案保留 |
| STP | 15-day **既定主方案**；2027 僅更新售價／範圍／規則，**不重開票券比較**（PENDING note ＋ BOOKINGS 任務） |
| 版本 | `version` = `V21.8 Web · 行程資料 V21.4g`；新增 `webAppVersion`／`itineraryVersion` |

## 2. Phase 2｜Maps & Navigation 新增

- `data.js`：新增 **`MAP_GUIDES`（10 張，P0 六大場景全覆蓋）** 與 `DAY_MAP_LINKS`
- `app.js`：新增 `renderMaps()`／`renderMapCard()`／`renderMapDiagram()`／`MAP_TYPE_META`／`mapStatusBadge()`；
  renderPage 加 `maps` 路由；Tools C 組與首頁 quick tile 加入口；**Day 頁新增「本日地圖與轉乘示意」**
- `sw.js`：cache 升版（架構未動）；Maps 內容隨 `data.js`／`app.js` precache → 離線可看
- **未新增 CSS**（沿用 `.map-btn`／`.card`／`.critical-toggle`）；未新增外部圖片；無 API key 依賴

## 3. 未修改項

Excel 母版（唯讀，未改）｜Today Engine（`parseTimelineTime`／`findCurrentAndNext`／`classifyDayState`）｜
Day 8 A/B plan lifecycle 與 plan choice storage｜storage 安全層（safeStorage／bookings filter／pending／luggage receipt）｜
`swiss_checks` recovery｜bottom nav 5 項結構｜`index.html`／`style.css`／`manifest.json`／`vercel.json`（byte 未變）｜
BRB／航班／ETIAS／住宿金額／行李鏈／Day 7-8-9 天候互換｜Day 6 Staubbach 回程段與各日「推車天堂」（summary 未記載變更，不自行發明）

## 4. Pending（未轉 Confirmed）

**2027 Pending**：BRB／SPB timetable、SBB 各站營業時間與價格、Emirates 實際航班／櫃台／航廈／Gate、
實際月台／Sector／車廂編組、ETIAS 啟用狀態、STP 官方售價、山區營運季節、即時天氣。
**Sans Souci W1（現在可問、尚未確認）**：exact key collection／office vs lockbox vs self check-in／early key pickup／
13:00 luggage storage／late arrival after 17:00／key return／bed rail／portable bed rail／insect screens／精確門牌。
**KoBi**：付款狀態與期限、提前退房與鑰匙返還。

## 5. QA

### 測試（實跑，全 PASS）
| 套件 | 結果 |
|---|---|
| `node --check` data／app／sw | ✅ OK |
| today_engine | ✅ 17/17 |
| real_itinerary | ✅ Critical 0 / Warning 0 / Info 0 |
| data_baseline | ✅ **172/172** |
| day8_plan_lifecycle | ✅ 48/48 |
| plan_choice_storage | ✅ 84/84 |
| storage_integrity | ✅ 103/103 |
| storage_consumers | ✅ 90/90（plain node 84/84） |
| service_worker_revision | ✅ 46/46 |
| **maps_navigation（新增）** | ✅ **90/90** |

新測試涵蓋：V21.4g itinerary regression（Day 2/3/5/6/8/9/10/11＋STP＋Sans Souci Pending＋行李鏈）、
map guide existence（P0 六場景）、Day↔Map link 無 broken、offline fallback、external link config
（https／無 placeholder／官方來源／Google 僅 fallback）、Current-Pending 不鎖死 platform/Gate、
Today engine 與既有結構守門。

### 真實瀏覽器（Chromium 141 / localhost secure context）15/15
建立 V21.8 cache｜app bar 顯示 V21.8＋V21.4g｜地圖頁可開｜P0 六卡皆present｜展開顯示示意圖＋Not to scale＋
Current reference＋官方連結＋Google fallback＋Pending 區塊｜Day 3／Day 11 頁地圖連結｜Day 2／Day 8 同步結果可見｜
**無 console error**｜**關閉伺服器後離線仍可開啟地圖**。

### Not Tested
真機 iPhone／Android PWA、Vercel production 部署、真實行動網路離線、V21.4g Excel 逐格比對。

## 6. 交付檔案
`data.js`／`app.js`／`sw.js`（production）＋ `index.html`／`style.css`／`manifest.json`／`vercel.json`（未變）
＋ 9 支 scenario tests（含新增 `scenario_tests_maps_navigation.js`）
＋ `V21_4b_WEB_to_V21_4g_SYNC_MATRIX.md`／`MAPS_NAVIGATION_SPEC.md`／本檔。

> 部署使用 canonical filenames：`index.html` 參照 `./data.js`／`./app.js`／`./sw.js`／`./style.css`／`./manifest.json`。
