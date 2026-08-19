# V21.8b → V21.8c｜Final Residual Seal Summary

**Web App**：V21.8b → **V21.8c**　｜　**Itinerary Data**：**V21.4g（凍結，未修改）**
**SW cache**：`swiss-trip-v21-8b-v21-4g-corrective-2027` → **`swiss-trip-v21-8c-v21-4g-final-residual-seal-2027`**
**本輪性質**：只修 4 個外部驗證後仍殘留的 residual（R01–R04），非 Audit／非 migration／非 Maps redesign／非 P1。

---

## R01｜Day 8 殘留 12:30–12:45 舊 wording

| | 內容 |
|---|---|
| **原**（`DAYS[7]` 午餐 defense） | 「A 的 **12:30–12:45** 為收尾起點，非硬性截止（考量 4 大人＋幼兒＋推車＋拍照＋如廁的實際彈性）」 |
| **新** | 「A 方案於 **Playground 後往餐廳方向移動，目標約 12:30–13:00 進入午餐／休息**；依 4 大人＋幼兒＋推車＋拍照＋如廁與現場狀況彈性調整，**非硬性截止**」 |

只改這一段 wording，未重新修改整個 Day 8 itinerary。

## R02｜Day 8 固定午睡 wording

| | 內容 |
|---|---|
| **原**（`DAYS[7]` town block step） | 「回 Grindelwald 後，**妞妞回木屋午睡**」 |
| **新** | 「回 Grindelwald 後**回公寓休息**；妞妞**是否午睡、睡多久，依當日睡眠、精神與晚間作息彈性決定**」 |

休息＝主安排；午睡＝視實際狀態；未創造固定午睡時段。
（註：Day 7 另有各自情境的午睡敘述，不在本輪 scope，未動。）

## R03｜Luzern 真正的 luggage-counter-specific 官方連結（新增）

**新增（第二順位）**：`SBB Luzern 行李櫃台位置與營業資訊（Gepäckaufgabe · Galerie 1. Obergeschoss）`
`https://www.sbb.ch/en/travel-information/stations/find-station/luzern-station/shops/shop-detail.html/geo-gepaeckaufgabe-ea8e`

**Online validation（實際 fetch）**：
| 項目 | 結果 |
|---|---|
| original URL | 同上 |
| redirect | **無**（`final_url` = original） |
| final URL | 同上 |
| HTTP／browser | ✅ 成功取得頁面 |
| official domain | ✅ `www.sbb.ch` |
| 頁面主題與 label 相符 | ✅ title「**Luggage - Station Luzern | SBB**」；內容含 **Floor: 1／Location details: Galerie, 1. Obergeschoss**、**Mon–Sun 08:00–19:00**、Luggage 聯絡電話 |

Luzern 最終連結結構（§8）：① 車站資訊與設施 → ② **行李櫃台位置與營業資訊（本輪新增）** → ③ 站內平面圖 PDF → ④ 行李寄送服務。
> 附帶佐證：官方標示櫃台位於 **Galerie／1. Obergeschoss** 且 **08:00** 開門，與 schematic 的「行李櫃台（Galerie 上層，2027 verify）」及 Day 3「08:00 開門後辦理」一致（未因此改動任何 itinerary 或 schematic）。

## R04｜Interlaken Ost 第二連結主題錯置

**移除**：BLM Lauterbrunnen–Grütschalp–Mürren（主題屬 Lauterbrunnen／Grütschalp／Mürren，非 Interlaken Ost 的 LIE → BOB 轉乘問題）。
**新增兩個 Jungfrau 官方頁**：
1. `Jungfrau Interlaken Ost 車站頁（BOB 往 Grindelwald／Lauterbrunnen）` — `https://www.jungfrau.ch/en-gb/arrival-at-station-car-parks/interlaken-ost-railway-station/`
2. `Berner Oberland-Bahn（BOB）官方說明：Zweilütschinen 分車` — `https://www.jungfrau.ch/en-gb/corporate/jungfrau-railways/berner-oberland-bahnen-ag/berner-oberland-bahn/`

**Online validation**：
| URL | redirect | final URL | 官方 domain | 主題相符 |
|---|---|---|---|---|
| Interlaken Ost 車站頁 | 僅尾斜線正規化 | `.../arrival-at-station-car-parks/interlaken-ost-railway-station` | ✅ `www.jungfrau.ch` | ✅ title「Interlaken Ost railway station \| jungfrau.ch」；內文述 **BOB 往 Grindelwald 或 Lauterbrunnen**、車站設施與地址 |
| BOB 官方說明 | 無（搜尋結果直接命中官方頁） | 同 original | ✅ `www.jungfrau.ch` | ✅ 明載「**two trains are coupled together until Zweilütschinen, where they are separated. One train travels onwards to Lauterbrunnen, the other to Grindelwald**」——正是本卡「不能死記前段／後段、要看車廂目的地顯示」的官方依據 |

**BLM link 最終位置**：原本即已存在於 `lauterbrunnen_transfer`、`grutschalp_transfer`、`murren_orientation` 三張 guide，故本輪只從 Interlaken Ost 移除，**未搬移、未刪站、未改 MAP_GUIDES 結構**。

---

## Production diff（§18）

| 檔案 | 變動 |
|---|---|
| `data.js` | R01 wording｜R02 wording｜R03 Luzern officialLinks（+1）｜R04 Interlaken Ost officialLinks（−1／+2）｜version metadata |
| `sw.js` | Web version 註解＋cache revision |
| `index.html`／`app.js`／`style.css`／`manifest.json`／`vercel.json` | **byte-identical（未修改）** |
| tests | `data_baseline`（+R01/R02 guards、version/cache）、`maps_navigation`（+R03/R04 guards、version）、`service_worker_revision`（cache） |

**Final Freeze Comparison（§23）**：`LUGGAGE_MILESTONES`／`HOTELS`／`BOOKINGS`／`PENDING_2027`／`FLIGHT_ITINERARY`／`BRB_DAY_PLAN`／`QUICK_NUMBERS`／`SIGHTS`／**`DAY_PLAN_CHOICES`（runtime 架構未變）**／`DAY_MAP_LINKS` 全部 **IDENTICAL**；`DAYS` 僅 Day 8 兩個 timeline 區塊變動（R01／R02），**Day 8 以外 0 變動**；`MAP_GUIDES` 僅 `luzern_station`／`interlaken_ost` 的 `officialLinks` 變動，**非 officialLinks 欄位 0 變動**（schematic 座標、legend、accessibility 全未動）。

---

## Regression（§21・全部實跑）

| 測試 | Pass | Fail | Skip |
|---|---:|---:|---:|
| `node --check` data／app／sw | PASS | 0 | 0 |
| today_engine | 17 | 0 | 0 |
| real_itinerary | Critical 0 / Warning 0 / Info 0 | 0 | 0 |
| data_baseline | **189** | 0 | 0 |
| day8_plan_lifecycle | 48 | 0 | 0 |
| plan_choice_storage | 84 | 0 | 0 |
| storage_integrity | 103 | 0 | 0 |
| storage_consumers | 90（jsdom）／84（plain node） | 0 | 0（plain node 時 6） |
| service_worker_revision | 46 | 0 | 0 |
| maps_navigation | **163** | 0 | 0 |

新增 guards：R01（DAYS 與 DAY_PLAN_CHOICES **雙 SSoT** 皆無 `12:30–12:45`、保留彈性 `12:30–13:00`）、R02（無「妞妞回木屋午睡」、無「一定／固定…午睡」、須有「是否午睡…依當日」與「回公寓休息」）、R03（**收緊**：必須是 `geo-gepaeckaufgabe` counter-specific 頁，generic luggage page 或 PDF 單獨不算，且 label 須含「行李櫃台」）、R04（須有 Interlaken Ost／BOB 官方頁；不得以 BLM 為第二 reference；BLM 仍須留在三張山谷 guide）。

## Smoke Browser QA（§22・真實 Chromium）— **11/11 PASS**
V21.8c cache 建立｜app bar 顯示 V21.8c/V21.4g｜Maps page 能開｜Luzern 官方連結（含行李櫃台 specific）正常顯示｜Interlaken Ost 官方連結（BOB／Zweilütschinen）正常顯示且不再出現 BLM｜Day 8 能開｜R01／R02 wording 已生效｜Day 8 A/B 選擇正常（A engine `11:15–13:00` / display `11:15–下山前`；B `11:15–14:15`）｜**console error = 0**。
（依 §22 未重跑 375/390/430 × Light/Dark 的完整 UI regression——本輪未動 renderer／CSS／layout／schematic 座標。）

## High / Critical
**無。** 未發現新的 High／Critical，未產生 unexpected production diff。

## Not Tested
真機 iPhone／Android PWA、Vercel production 部署、真實行動網路離線；`bls.ch`／`emirates.com`／Grindelwald／Lauterbrunnen／ZRH／BRB 等 V21.8b 已驗證連結本輪依 §15 未重新 Audit。
