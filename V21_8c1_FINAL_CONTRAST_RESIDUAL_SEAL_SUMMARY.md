# V21.8c1 Final Contrast Residual Seal Summary

**Web App**：**V21.8c1**（in-place，未升 V21.8c2）　｜　**Itinerary Data**：**V21.4g**
**SW cache**：`swiss-trip-v21-8c1-v21-4g-dark-mode-seal-2027`（**未再 bump**，理由見 §7）

---

## 1. Four residuals

| # | 位置 | 嚴重度 | 根因 |
|---|---|---|---|
| **A** | Today Dashboard CTA「展開完整 Day X 行程」 | **High** | **上一輪我自己造成的 regression**：把 `color: var(--swiss-red)` 改成 `var(--text-red)`，但這顆按鈕背景是**固定** `rgba(255,255,255,0.95)`。`--text-red` 是為「深底上的 accent 文字」而設計（Dark = `#FF8A93`），用在固定淺底 → 淡紅字＋近白底，約 **2.05–2.26:1** |
| **B** | `.backup-toggle.active` | Medium | `background: var(--warn-orange)`（`#EA580C`）＋白字 = **3.56:1**，非 large text |
| **C** | `.tel-btn` | Medium | `background: var(--safe-green)`（`#059669`）＋白字 = **3.77:1** |
| **D** | `.critical-content li`（Light） | Medium | `color: var(--text-red)`（Light `#DC2626`）on `--alert-red-bg` `#FEF2F2` = **4.41:1**，低於 4.5 |

> Issue A 特別說明：這顆 CTA 只在 `todayIdx >= 0`（實際旅行期間）才 render，
> 以「今天」開首頁的 Browser QA 一定漏檢——這正是上一輪 136/136 仍未攔截到它的原因。
> 本輪 Browser QA 已**強制 mock 瀏覽器日期至 2027-09-20**，讓 Today Dashboard 分支真正 render 後再量測。

---

## 2. Before / After

| # | Before | After |
|---|---|---|
| **A** | `<button class="today-btn" style="background: rgba(255,255,255,0.95); color: var(--text-red); …">` | `… color: var(--swiss-red); …`（固定深色品牌紅，**不隨 Dark Mode 變亮**） |
| **B** | `.backup-toggle.active { background: var(--warn-orange); color:#fff; }` | `background: var(--warn-orange-action);`　新增 `--warn-orange-action: #9A3412`（**warning semantic 未改**，`--warn-orange` 仍為 `#EA580C`） |
| **C** | `.tel-btn { background: var(--safe-green); color:#fff; }` | `background: var(--safe-green-action);`　新增 `--safe-green-action: #046C51`（green semantic／白字／clickable affordance 全保留） |
| **D** | `.critical-content li { color: var(--text-red); }` | `color: var(--text-critical);`（**沿用既有變數，未新增重複 semantic**） |

---

## 3. Contrast table（真實瀏覽器 computed style，非估算）

| 項目 | Mode | Viewport | Foreground | Effective background | Ratio |
|---|---|---|---|---|---|
| A Today CTA | Light | 375 / 390 | `#dc0018` | `#fcf2f3` | **4.72** ✅ |
| A Today CTA | Dark | 375 / 390 | `#dc0018` | `#fcf2f3` | **4.72** ✅ |
| B Backup active | Light | 375 / 390 | `#ffffff` | `#9a3412` | **7.31** ✅ |
| B Backup active | Dark | 375 / 390 | `#ffffff` | `#9a3412` | **7.31** ✅ |
| C tel-btn | Light | 375 / 390 | `#ffffff` | `#046c51` | **6.42** ✅ |
| C tel-btn | Dark | 375 / 390 | `#ffffff` | `#046c51` | **6.42** ✅ |
| D critical li | Light | 375 / 390 | `#b91c1c` | `#fef2f2` | **5.91** ✅ |
| D critical li | Dark | 375 / 390 | `#ff8a93` | `#302336` | **6.56** ✅ |

（背景為逐層往上合成之 effective background，含 alpha 混色；前景亦做 alpha 混色後再計算。）

---

## 4. Travel-time Home QA

- **日期 mock**：於 page init 覆寫 `Date`／`Date.now()` 為 **2027-09-20T10:30+02:00**（Day 7）。
- **實際 render 確認**：Today Dashboard 分支成立，CTA 文字為「**展開完整 Day 7 行程 ›**」，同時顯示「目前正在 10:30–13:00 皇冠觀景台 + 33 號 Panorama Trail」「下一步 13:00–14:30」。
- Light + Dark、375 + 390 皆量測 CTA 的 computed foreground / effective background / ratio（見上表）。
- 另測 **Day 4 Backup active**、**Emergency `.tel-btn`**、**含 critical 的 Day（Day 1）展開 critical content**。
- 截圖：`screenshots_contrast_seal/`（today_home／backup／telbtn／critical × Light+Dark）。人工檢視確認 CTA 為深紅字於近白按鈕、清晰可讀。

**Browser QA 結果：36/36 PASS（Light/Dark × 375/390 × 4 狀態），console error = 0。**

---

## 5. Regression counts

| 測試 | Pass | Fail | Skip |
|---|---:|---:|---:|
| `node --check` data／app／sw | PASS | 0 | 0 |
| today_engine | 17 | 0 | 0 |
| real_itinerary | Critical 0 / Warning 0 / Info 0 | 0 | 0 |
| data_baseline | 195 | 0 | 0 |
| day8_plan_lifecycle | 48 | 0 | 0 |
| plan_choice_storage | 84 | 0 | 0 |
| storage_integrity | 103 | 0 | 0 |
| storage_consumers | 90（jsdom）／84（plain） | 0 | 0（plain 時 6） |
| service_worker_revision | 50 | 0 | 0 |
| maps_navigation | 185 | 0 | 0 |
| content_completeness | 53 | 0 | 0 |
| **dark_mode_ui** | **75**（55 → +20 Guards A–D） | 0 | 0 |

原 pass count 全數維持，無任何測試下降。

### 新增 Guards
- **A**：`today-btn` 不得使用 `var(--text-red)`；必須使用 `var(--swiss-red)`；fixed-light CTA ≥4.5；`--swiss-red` 未於 Dark 全域改亮。
  另把上一輪過寬的「app.js 不得用 `color:var(--swiss-red)`」改為**情境式**：僅允許出現在**同一元素明確設定固定淺色背景**的 CTA。
- **B**：`.backup-toggle.active` 使用 `--warn-orange-action`；白字 ≥4.5；`--warn-orange` 語意未被改掉。
- **C**：`.tel-btn` 使用 `--safe-green-action`；白字 ≥4.5；green semantic／白字保留。
- **D**：`.critical-content li` 使用 `--text-critical`；`#B91C1C` on `#FEF2F2` ≥4.5；未新增重複 semantic 變數。
- 通則：所有 action 背景（`--warn-orange-action`／`--safe-green-action`／`--jungfrau-blue`／`--swiss-red`）上的白字皆 ≥4.5。

---

## 6. Freeze evidence（sha256 前 16 碼，本輪前 / 本輪後）

| 檔案 | 結果 | Hash |
|---|---|---|
| `data.js` | **BYTE-IDENTICAL** ✅ | `bafbae112d0b6f5f` = `bafbae112d0b6f5f` |
| `瑞士行程_最終版_V21_4g.xlsx` | **BYTE-IDENTICAL** ✅ | `9b67853ea833fc22` = `9b67853ea833fc22` |
| `index.html` | IDENTICAL ✅ | `056b693a00095b9b` |
| `manifest.json` | IDENTICAL ✅ | `e1410c330b9d0cc1` |
| `vercel.json` | IDENTICAL ✅ | `e0ca6f0254453aa5` |
| `sw.js` | IDENTICAL ✅ | `ca2028968a768890` |

**Excel diff = 0｜data.js diff = 0｜itinerary drift = 0｜unexpected production diff = 0。**
實際變動僅：`app.js`（1 行 CTA 顏色）、`style.css`（2 個新 action 變數 + 3 處引用）、`scenario_tests_dark_mode_ui.js`、本 summary。

---

## 7. PWA cache decision

**不再 bump cache。**
依 §7：上一輪的 `swiss-trip-v21-8c1-v21-4g-dark-mode-seal-2027` package **尚未正式 production deployment**（本對話中僅為交付、未部署），
因此本輪的 `app.js` / `style.css` 修正應**併入同一個 final cache package 一次部署**，`sw.js` 維持 byte-identical（hash 已驗證）。

> 若你其實**已經**把 dark-mode-seal package 部署給既有 PWA 使用者，請告知，我再做一次**最小 deployment cache revision**
> （Web 版本仍 V21.8c1、Itinerary 仍 V21.4g、不升 V21.8c2、architecture 不變；**deployment cache revision ≠ version bump**）。

---

## 8. Final conclusion

- **Issue A** Today Dashboard CTA：Light **4.72** / Dark **4.72** ✅（且已用 mock date 實際 render 後量測）
- **Issue B** Backup active：**7.31** ✅
- **Issue C** tel-btn：**6.42** ✅
- **Issue D** Critical content：Light **5.91** / Dark **6.56** ✅
- Regression：High = 0、Critical = 0、test failures = 0，原 pass count 未下降 ✅
- Freeze：Excel diff = 0、`data.js` diff = 0、itinerary drift = 0、unexpected production diff = 0 ✅

> **V21.8c1 = Production Final Seal**

正式封板。不提出 V21.8c2，不再進行 broad audit。
部署請使用 canonical 檔名，並於手機工具頁確認 Build `V21.8c1-20260820`。
