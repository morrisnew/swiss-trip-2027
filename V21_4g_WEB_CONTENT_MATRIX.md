# V21.4g Excel ↔ Web V21.8c1｜Content Matrix

判準：**Excel 有效資訊 → Web data layer 有正確資料 → production UI 真的看得到且旅行時可用**。
狀態：`Complete` / `Partial` / `Missing` / `Intentionally excluded` / `Historical only` / `2027 Pending`

| Excel module | Web dataset | UI renderer | Status | 說明 |
|---|---|---|---|---|
| Day 0（台灣出發） | `TRAVEL_BOUNDARY.day0` ✨ | `renderBoundaryCard("day0")`（行程頁）✨ | **Complete** | 本輪新增。boundary card，不進 `DAYS`、不進 Today Engine |
| Day 1–11 | `DAYS` | `renderDay` / `renderDaysList` | **Complete** | 本輪僅 Day 6（午餐策略）、Day 8（分組修正）變動 |
| Day 12（抵達台灣） | `TRAVEL_BOUNDARY.day12` ✨ | `renderBoundaryCard("day12")` ✨ | **Complete** | 本輪新增 |
| Day 4 備案（Oeschinensee） | `DAYS[3].backup` | `renderBackupPanel` | Complete | 既有 |
| Hotels | `HOTELS` | `renderHotels` | **Complete** | KoBi confirmed／Sans Souci W1 confirmed；門牌與 key procedure 仍 Pending |
| Flights | `FLIGHT_ITINERARY`／`EMIRATES_RULES` | `renderFlights` | Complete（2027 Pending） | 實際時刻／Gate 為 2027 Pending |
| **Budget（2027 完整預算）** | **`BUDGET`** ✨ | **`renderBudget`（工具→預算總覽）** ✨ | **Complete** | 本輪新增。摘要非計算底稿；booked／current／estimate／pending 分開標示 |
| Restaurants | `RESTAURANTS`（+Mürren 午餐）✨ | **`renderRestaurants`（工具→餐廳與訂位）** ✨ | **Complete** | 本輪前 data 存在但無 UI；現已可達 |
| Sights | `SIGHTS`（+Mürren／Allmendhubel）✨ | `renderSights` | **Complete** | 本輪補 Day 6 兩大主行程景點 |
| Rain Plan | `RAIN_PLANS`（+Ballenberg／Spiez・圖恩湖／連續白牆 A 級）✨ | **`renderRainPlansSection`（天氣頁）** ✨ | **Complete** | 本輪前 data 存在但未 render；Bern 車程 factual 已修 |
| Weather Swap | `WEATHER_DECISION` | `renderWeather` | Complete | 未動（freeze） |
| Packing | `PACKING` | `renderPacking` | **Complete** | 洗衣 wording 已依 HOTELS SSoT 修正 |
| Shopping | `SHOPPING` | `renderShopping` | Complete | 未動 |
| Emergency | `EMERGENCY`／`CONSULATE_CONTACT`／`QUICK_NUMBERS` | `renderEmergency` | Complete | Web 電話本就正確（Excel 舊號已於本輪修正） |
| **Travel references** | **`TRAVEL_REF_FIELDS`（僅欄位定義）** ✨ | **`renderTravelRefs`（工具→旅行備忘）** ✨ | **Complete** | 本輪新增。實際值由使用者填於本機 localStorage，**不 hard-code** |
| Bookings | `BOOKINGS`（+Day 6 午餐訂位）✨ | `renderBookings` | **Complete** | 本輪補 Mürren 午餐訂位任務 |
| Pending 2027 | `PENDING_2027` | `renderPending` | Complete（2027 Pending） | 未動（freeze） |
| Luggage chain | `LUGGAGE_MILESTONES` | `renderLuggage` | Complete | 未動（freeze） |
| Maps | `MAP_GUIDES`／`DAY_MAP_LINKS` | `renderMaps` | Complete（P0） | 未動（freeze）；P1 未開發 |
| Day 8 A/B | `DAY_PLAN_CHOICES` | plan chooser／Today engine | Complete | 未動（freeze） |
| BRB | `BRB_DAY_PLAN`／`BRB_SCHEDULE`／`BRB_DERIVED` | Day 10 卡 | Complete（2027 Pending） | 未動 |
| 訂位清單（📞） | `BOOKINGS`＋`RESTAURANTS` | `renderBookings`／`renderRestaurants` | Complete | Day 6 午餐已納入 |
| 航空比較（舊） | — | — | **Intentionally excluded** | 已決策 EK，舊比較屬規劃歷史 |
| 淘汰住宿（Atlanta／GRIWA 等） | — | — | **Intentionally excluded** | 已淘汰，不得復活（有 regression guard） |
| 已否決景點／舊方案 | — | — | **Intentionally excluded** | 規劃歷史 |
| V21 版本說明／change-log | — | — | **Historical only** | 版本沿革，不上 Web |
| 預算計算底稿（公式、匯率格） | `BUDGET`（僅摘要） | `renderBudget` | **Intentionally excluded**（明細） | Web 只放旅行／規劃時有價值的 summary |
| STP／HFC 舊比較 | — | — | **Intentionally excluded** | V21.4g 已定 15-day 為既定主方案，不重開比較 |

✨＝本輪 V21.8c1 Content Completeness 新增／修正。
