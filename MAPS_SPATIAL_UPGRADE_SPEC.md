# MAPS_SPATIAL_UPGRADE_SPEC.md｜Maps 空間化規格（Web V21.8a）

**Web App**：V21.8 → **V21.8a**　｜　**Itinerary Data**：**V21.4g（完全凍結，未修改）**
**SW cache**：`swiss-trip-v21-8-v21-4g-maps-2027` → `swiss-trip-v21-8a-v21-4g-maps-spatial-2027`

## 0. 本輪解決的問題
V21.8 對所有 map type 都用同一套 `① → ② → ③` vertical flow。對 `route` 合理，對 `station`／`town`
無法回答「我在站內哪個方向／哪一層」「出站後往哪」「兩個地標相對位置」。
本輪讓**不同 type 有不同視覺語言**，架構沿用（`MAP_GUIDES`／`DAY_MAP_LINKS`／`renderMaps`／`renderMapCard`／
Day 頁入口／Tools 入口／offline precache／official links／Google fallback 全部保留，未推倒重做）。

## 1. Renderer 分派
```js
function renderGuideSpatial(g) {
  const sc = g.schematic;
  if (sc && sc.nodes && sc.nodes.length) switch (g.type) {
    case "station":  return renderStationSchematic(sc);   // 2D 站體平面
    case "town":     return renderTownSchematic(sc);      // 2D 城鎮定位
    case "transfer": return renderTransferSchematic(sc);  // 2D 轉乘空間
  }
  return renderMapDiagram(g.diagram);                     // route：維持 vertical flow
}
```
`renderMapDiagram()` **保留未動**（route 專用，標題改為「移動鏈流程」）。

## 2. Data schema 擴充（不做 GIS）
```js
schematic: {
  layout: "station" | "town" | "transfer",
  viewBox: "0 0 320 250",
  ariaLabel: String,                                  // screen reader
  zones:  [{ label, x, y, w, h }],                    // 樓層／區域
  nodes:  [{ id, label, x, y, icon, status, note }],  // status: current | verify | pending
  links:  [{ from, to, style, label }],               // style: walk | transport | level
  axis:   { label, from, to },                        // town 村軸（選用）
  pendingLabels: [String]
}
```
**未加入**：lat/lng engine、pathfinding、zoom levels、map tiles、routing algorithm、API key、外部圖片。

## 3. 呈現技術
- **inline SVG**（`viewBox` + `width:100%`），responsive、offline、無 API key、無外部 asset。
- zones 以虛線圓角矩形＋區域標籤；links 以帶箭頭線段（`walk` 虛線／`transport` 實線／`level` 點線）＋段落標籤；
  nodes 以圓角方框＋狀態色點＋icon＋多行標籤。
- 每張圖標 **Not to scale**、附 **legend**（現行方位／2027 verify／Pending・步行／交通工具／樓層移動）。
- Mobile-first：viewBox 寬 320，`width:100%`；SVG 文字 ≥8.5px；375／390／430px 實測不溢出、免 pinch zoom。
- Dark mode：全部使用既有 CSS 變數（`--bg-elev`／`--border`／`--text`／`--text-muted`／`--jungfrau-blue`／`--gold`／`--warn-orange`），未新增色系、未新增 CSS 檔。

## 4. Accessibility（§15）
- `<svg role="img" aria-label="…">`，每張圖有敘述性 ariaLabel。
- 圖下提供 **`<details>` 文字版說明**（links 逐條 A → B（說明）＋ node 註記＋ Pending），不看圖也能用。
- 狀態同時以**色點＋文字 legend＋文字 fallback** 表達，不靠顏色 alone。
- 所有 action button 具體標籤（見 §5）。

## 5. Official deep links（§8/§9）
| Guide | Deep links |
|---|---|
| Luzern | `SBB Luzern 車站資訊與設施`（`/railway-stations/bahnhof.luzern.html`）、`SBB 行李寄送服務`（`/services/luggage.html`） |
| Interlaken Ost | `SBB Interlaken Ost 車站資訊`、`Jungfrau 交通與轉乘資訊`（`/corporate/timetables/`） |
| Grindelwald | `SBB Grindelwald 車站資訊`、`Jungfrau Grindelwald 交通資訊` |
| Lauterbrunnen | `BLM Lauterbrunnen–Grütschalp–Mürren 路線`、`SBB Lauterbrunnen 車站資訊` |
| Grütschalp | `BLM Grütschalp 轉乘與路線` |
| Mürren | `Allmendhubel 纜車與 Flower Park`（`/en/Allmendhubel`）、`BLM Mürren 路線資訊` |
| Brienz | `BRB 時刻表與營運期`（`/en/timetable-prices/`）、`BRB 交通指引`、`BLS 湖上遊船（Brienzersee）` |
| ZRH | `ZRH 機場平面圖`（`/airport-map`）、`ZRH 出發資訊`（`/departures`）、`Emirates 報到與行李規定` |
| Day 6／Day 10 flow | BLM 路線／Jungfrau 時刻表；BRB 時刻表／BLS 遊船 |

Google Maps 維持 **external navigation fallback**（`externalMap`），不作 platform／timetable／行李規則／機場程序的權威，
且測試強制 `officialLinks` 不得含 Google 網域。

## 6. Current / Pending 畫進圖裡（§11）
動態節點以 `status` 上色並標註：`verify`（2027 verify）／`pending`（Day-of）。
例：ZRH「Emirates 報到」「登機門 Gate」＝pending；Grindelwald「Sans Souci W1（方向）」＝pending（**只畫方向，不畫精準 property pin**）；
Luzern「行李櫃台」＝verify（Galerie／上層，2027 verify）；Interlaken Ost 標「Platform ＝ day-of SBB App」。
測試強制：schematic 不得出現固定 platform 號碼或 Gate 編號。

## 7. 不在本輪範圍
P1（Rigi／Pilatus／Männlichen／Schynige Platte／First-Bachalpsee-Bort／Luzern Old Town／Grindelwald village）未開發；
itinerary facts、Today engine、storage、Day 8 A/B、SW 架構均未修改。
