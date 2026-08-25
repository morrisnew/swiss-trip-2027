# 地圖擴充總結（Batch 1–5 全部完成）

**Web App**：V21.8c1（未升版）　｜　**Itinerary Data**：V21.4g（未動）　｜　**Build**：`V21.8c1-20260826`
**地圖數**：10 → **15 張**（station 3・transfer 4・town 3・**region 3**・route 2）

---

## 一、五批成果

| Batch | 地圖 | 類型 | 掛載 | 核心價值 |
|---|---|---|---|---|
| 1 | **少女峰地區方位圖** | region（新類型） | Day 5–9 | 兩谷結構、BOB 分車、KS 是兩谷唯一連通點 |
| 2 | **琉森地區方位圖** | region | Day 1–4 | 兩山四接駁點、Pier 1／2 分流、哪段免費哪段 50% |
| 3 | **琉森市區步行動線圖** | town | Day 1–4 | 南北岸、住宿↔車站↔碼頭、東側景點群 |
| 4 | **格林德瓦村動線圖** | town | Day 5–11 | **村站 vs Terminal 兩個不同車站**、住宿生活圈距離 |
| 5 | **布里恩茨湖一帶方位圖** | region | Day 10 | 去船回車環線、Brienz 三節點各自獨立 |

**每日覆蓋**：D1:2　D2:2　D3:3　D4:2　D5:4　D6:6　D7:2　D8:3　D9:3　D10:4　D11:3 —— **11 天全覆蓋**。

## 二、先查證再畫（每張都有官方／權威依據）

| 地圖 | 關鍵查證 |
|---|---|
| 少女峰 | 兩條平行山谷同由 Lütschine 切割；**KS 是兩谷唯一鐵路連通點，往來必須換車**；Mürren 在西側懸崖、Wengen 在東側 |
| 琉森地區 | **Pier 1＝Weggis／Vitznau（Rigi）、Pier 2＝Alpnachstad（Pilatus）**（SGV 官方）；主碼頭在車站正對面；**船班不可訂位** |
| 琉森市區 | **羅伊斯河分兩岸**：車站＋KKL＋碼頭在南岸、舊城在北岸；Hirschenplatz 屬北岸舊城；**獅子紀念碑與冰河公園相鄰**；木橋距車站約 5 分 |
| 格林德瓦 | **村站與 Grindelwald Terminal 是兩個不同車站**（Terminal＝Grundstrasse 54，2019 啟用）；**GGM 與 Eiger Express 都在 Terminal**；Firstbahn 自村站走／搭接駁 |
| 布里恩茨 | BRB 為獨立站體、非 SBB 月台；BLS 湖船 STP 免費且不可劃位 |

> Day 7 原本就已正確寫明「從村站搭 BOB 一站到 Terminal」「Terminal 與 Grund 是兩個不同站點」——查證後確認網站無誤，村圖只是把它視覺化。

## 三、過程中發現並修正的既有缺陷（3 類）

畫圖時逐張檢視截圖，發現**測試沒涵蓋的缺陷類別**，補齊守門後回頭掃全部地圖：

| # | 缺陷 | 影響範圍 | 處理 |
|---|---|---|---|
| ① | **zone label 壓到節點／連線標籤** | 新畫的區域圖 ＋ **既有 `brienz_boat_brb`、`zurich_airport`（V21.8a 就存在）** | 標題縮短、說明移到圖下 caption；新增雙向碰撞守門 |
| ② | **連線穿過非端點的節點框** | **6 處**，跨新舊：`luzern_station`（V21.8a）、`jungfrau_region`、`luzern_region`×2、`luzern_town` | 微調節點座標，現 **0 處**；新增守門 |
| ③ | **資料層殘留 markdown `**` 標記** | 新寫的琉森地區圖 ＋ **Day 8 SPB 一句（更早幾輪留下）** | 全站清除（10 個 → 0）；新增守門 |

三項都不是「新功能的瑕疵」，而是**既有地圖一直帶著、只是沒人測**的問題。

## 四、測試

| 測試 | 本輪前 | 現在 |
|---|---|---|
| `maps_navigation` | 185 | **190**（+region type／caption／zone label 雙向／線穿框） |
| `content_completeness` | 61 | **62**（+markdown 守門） |
| 其餘 9 套件 | 全 PASS | 全 PASS（數量未變） |

真實 Chromium QA：**5 張新圖 × 18 項 × (Light/Dark × 375/390)**，全數通過；每張我都**親自檢視截圖**確認可讀（截圖存於 `screenshots_region/`）。

## 五、Freeze

| 檔案 | 結果 |
|---|---|
| `app.js`（Batch 2 起）／`style.css`／`sw.js`／`index.html`／`manifest.json`／`vercel.json` | **IDENTICAL ✅** |
| **Excel V21.4g** | **IDENTICAL ✅** |
| 行程／預算 16 個 dataset（DAYS／HOTELS／BOOKINGS／SIGHTS／RAIN_PLANS／RESTAURANTS／PENDING_2027／LUGGAGE_MILESTONES／DAY_PLAN_CHOICES／TRAVEL_BOUNDARY／PACKING／WEATHER_DECISION／FLIGHT_ITINERARY／EMERGENCY／QUICK_NUMBERS／BUDGET） | **全部未動 ✅**（Batch 2 的 markdown 清理已確認語意等價） |

**itinerary drift = 0｜unexpected production diff = 0。**

## 六、限制（誠實說明）

- 地圖為 **simplified field guide**，全部標 **Not to scale**，用途是「辨方位、不走錯站」，**不是精確比例圖**
- 動態元素（月台、Gate、櫃台、Sans Souci 門牌）維持 **verify／Pending**，未寫死
- **2027 班次、票價、營運季節仍為 Pending**，官方未公布前無法驗證，網站標示正確
- Google Maps 僅作 external fallback，未作為交通規則權威
