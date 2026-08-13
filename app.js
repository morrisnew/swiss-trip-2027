
/* ═══════════════════════════════════════════════
   瑞士行程 PWA · App Logic
═══════════════════════════════════════════════ */

// 交通圖示映射
const TR_ICONS = {
  plane: "✈️", train: "🚂", ship: "🚢", cablecar: "🚡",
  bus: "🚌", walk: "🚶", home: "🏠", luggage: "🛅",
  info: "ℹ️", car: "🚗"
};

// ════════════════════════════════════════════════════════════════
// V21.7d · Final Storage Integrity Seal — Checklist Storage Recovery
// ────────────────────────────────────────────────────────────────
// 問題：舊寫法 checkedItems: JSON.parse(localStorage.getItem("swiss_checks") || "{}")
//   1. malformed JSON（例如 "{bad"）→ JSON.parse throw → 整個 app.js 初始化中止。
//   2. JSON null → checkedItems 為 null → 後續 State.checkedItems[key] 拋錯。
//   3. Array／primitive（[]／true／123／"text"）→ 非預期 checklist dictionary。
//   4. getItem 例外（隱私模式／SecurityError）→ 網站無法啟動。
// 修正：safe read → safe parse → 結構驗證 → 只保留 string-key + boolean-value entries；
//   任何無效情況只移除 swiss_checks（絕不整站清除），一律回傳安全物件。
// ════════════════════════════════════════════════════════════════

const SWISS_CHECKS_KEY = "swiss_checks";

// 只移除 swiss_checks，且 removeItem 失敗也不拋例外
function removeChecksKeySafe() {
  try { localStorage.removeItem(SWISS_CHECKS_KEY); } catch (e) { /* ignore */ }
}

// generic、安全的 checklist loader（策略 A：只保留合法 boolean entries）
function loadCheckedItems() {
  let raw = null;
  try {
    raw = localStorage.getItem(SWISS_CHECKS_KEY);        // 1. 安全讀取
  } catch (e) {
    return {};                                            // getItem 例外 → {}，網站仍啟動
  }
  if (raw === null || raw === undefined) return {};       // 2. 真正無資料 → {}（不需清理）

  let parsed;
  try {
    parsed = JSON.parse(raw);                             // 3. 安全 parse（"" 亦 throw → 當作損壞）
  } catch (e) {
    removeChecksKeySafe();                                // JSON 損壞 → 只移除 swiss_checks
    return {};
  }

  // 4. 結構驗證：必須為非 null、typeof object、且非 Array
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    removeChecksKeySafe();                                // null／Array／primitive → 清除 + {}
    return {};
  }

  // 5. Entry sanitization：只保留 string key + boolean value 的 own enumerable entries
  const clean = {};
  try {
    Object.keys(parsed).forEach(k => {
      if (typeof k !== "string") return;
      const v = parsed[k];
      if (typeof v === "boolean") clean[k] = v;           // "true"／1／null／{}／[] 等 entry 丟棄
    });
  } catch (e) {
    return {};                                            // 極端情況（惡意 getter throw）→ 安全 {}
  }
  return clean;
}

// 全域狀態
const State = {
  currentPage: "home",
  currentDay: null,
  showBackup: false,
  checkedItems: loadCheckedItems(),      // V21.7d：安全載入，取代未保護的 JSON.parse
  weatherCache: null
};

// 若 State.checkedItems 被外部程式／未來 migration 改成 null／Array／primitive，恢復為安全 object
function ensureCheckedItems() {
  const items = State.checkedItems;
  if (items === null || typeof items !== "object" || Array.isArray(items)) {
    State.checkedItems = {};
  }
  return State.checkedItems;
}

// V21.7d：序列化與 setItem 均不得造成未處理例外；成功 true / 失敗 false，
//         UI 當下勾選狀態仍維持在記憶體。QuotaExceededError／SecurityError／
//         cyclic object（stringify throw）皆安全處理。
function saveChecks() {
  try {
    localStorage.setItem(SWISS_CHECKS_KEY, JSON.stringify(State.checkedItems));
    return true;
  } catch (e) {
    return false;
  }
}

// V21.7d：面對異常 State（null／Array／primitive）先恢復為安全 object 再切換，絕不 throw
function toggleCheck(key) {
  const items = ensureCheckedItems();
  items[key] = !items[key];
  saveChecks();
}

// V21.7d：安全回傳 boolean；State 異常時回 false，絕不 throw
function isChecked(key) {
  try {
    const items = State.checkedItems;
    if (items === null || typeof items !== "object" || Array.isArray(items)) return false;
    return !!items[key];
  } catch (e) {
    return false;
  }
}

// ════════════════════════════════════════════════════════════════
// V21.7c · Generic Plan Choice Validation（Storage Validation Hotfix）
// ────────────────────────────────────────────────────────────────
// 問題：舊程式只用 `if (planChoices[refKey])` 判斷「是否已選」，任何非空
//       字串（例如 localStorage 殘留的過期 option key "C" / "legacy"）都會
//       被當成「已選」；後續 def.options.find(o => o.key === chosenKey) 找
//       不到對應 option 時，plan block 會被【靜默排除】，導致當日方案內容
//       消失、狀態誤判為 gap（而非正確的 plan_unselected）。
//
// 修正原則（完全 generic，不 hardcode A／B、不綁 day8_spb）：
//   一個 value 只有在「對應到 planDef.options 內某個 option.key」時才有效。
//   null／空字串／過期／不存在／缺 options／非法型別 一律回傳 null，且不拋例外。
//   無效值只移除該 plan 自己的 storage key，絕不整站清除 localStorage。
// ════════════════════════════════════════════════════════════════

// 核心：給定 planDef 與候選值，回傳有效 option key，否則 null。
// V21.7d · Strict Type Validation：plan choice 只有 primitive string 才可能有效。
//   不做任何隱式／顯式 string coercion（不再 String(value)），因此
//   Array（["A"]）／Object／new String("A")／{ toString:()=>"A" }／Number／Boolean／
//   Function／Symbol／BigInt／null／undefined 一律無效。option.key 本身也必須是 string。
//   唯一有效性依據＝該 primitive string 是否等於某個 planDef.options[].key（動態，不寫死）。
function resolveValidPlanChoice(planDef, value) {
  try {
    if (!planDef || !Array.isArray(planDef.options)) return null;   // 缺 planDef / 缺 options → null
    if (typeof value !== "string") return null;                     // 僅接受 primitive string（無 coercion）
    if (value.length === 0) return null;                            // 空字串 → null
    const valid = planDef.options.some(o =>                         // 動態比對現有 option
      o && typeof o.key === "string" && o.key === value            // option.key 亦須為 string
    );
    return valid ? value : null;                                    // "C"／"undefined"／" " 皆落空 → null
  } catch (e) {
    return null;                                                    // 任何例外 → 安全 null
  }
}

// 便利版：以 planKey 查 DAY_PLAN_CHOICES 後委派 resolveValidPlanChoice。
// 不存在的 planKey 安全回傳 null。
function normalizePlanChoice(planKey, value) {
  try {
    if (typeof DAY_PLAN_CHOICES === "undefined" || !DAY_PLAN_CHOICES[planKey]) return null;
    return resolveValidPlanChoice(DAY_PLAN_CHOICES[planKey], value);
  } catch (e) {
    return null;
  }
}

// V21.6：Day 方案（A/B）選擇 — 獨立 localStorage key，不影響既有勾選
// V21.7c：讀取後驗證 value 是否仍存在於目前 option 定義；無效值只清除【該 plan 自己的】
//         storage key（絕不整站清除 localStorage），回傳 null，且不影響其他資料。
function getPlanChoice(planKey) {
  if (typeof DAY_PLAN_CHOICES === "undefined" || !DAY_PLAN_CHOICES[planKey]) return null;
  const def = DAY_PLAN_CHOICES[planKey];
  const storageKey = def.storageKey;
  if (!storageKey) return null;

  let raw = null;
  try {
    raw = localStorage.getItem(storageKey);
  } catch (e) {
    return null;                       // getItem 例外 → 安全 null，不中斷網站
  }
  // V21.7d：只有 null／undefined 才是「真正不存在」（無需清理）；
  //         ""／" "／"C"／"legacy"／"undefined" 等皆屬「已存在但無效」，
  //         交由下方 resolveValidPlanChoice 落空後移除該 plan 自己的 key。
  if (raw === null || raw === undefined) return null;

  const valid = resolveValidPlanChoice(def, raw);
  if (valid) return valid;             // 有效 → 正常回傳

  // 無效／過期值：只移除這一個 plan 的 storage key，不動其他 localStorage
  try {
    localStorage.removeItem(storageKey);
  } catch (e) {
    /* removeItem 例外 → 忽略，仍回傳 null */
  }
  return null;
}

// V21.7c：寫入前驗證 planKey / planDef / storageKey / optionKey 皆有效；
//         無效 option key 一律拒絕寫入（不污染 localStorage）。回傳 true/false，
//         setItem 失敗不拋未處理例外。既有 UI caller 忽略回傳值，不受影響。
function setPlanChoice(planKey, optionKey) {
  if (typeof DAY_PLAN_CHOICES === "undefined" || !DAY_PLAN_CHOICES[planKey]) return false;
  const def = DAY_PLAN_CHOICES[planKey];
  if (!def.storageKey) return false;

  const valid = resolveValidPlanChoice(def, optionKey);
  if (!valid) return false;            // 拒絕寫入不存在的 option（例如 "C"）

  try {
    localStorage.setItem(def.storageKey, valid);
    return true;
  } catch (e) {
    return false;                      // setItem 失敗 → 安全 false，不拋例外
  }
}

// V21.7c：只收集通過驗證的有效方案。無效值不納入輸出且會被 getPlanChoice
//         自動清理；單一 plan 無效不影響其他有效 plan。
function allPlanChoices() {
  const out = {};
  if (typeof DAY_PLAN_CHOICES === "undefined") return out;
  Object.keys(DAY_PLAN_CHOICES).forEach(k => {
    const v = getPlanChoice(k);        // 已驗證＋清理無效值
    if (v) out[k] = v;
  });
  return out;
}

// ════════════════════════════════════════════════════════════════
// V21.7d · In-Place Final Seal Correction — 共用 Safe Storage Layer
// ────────────────────────────────────────────────────────────────
// generic、全站共用的 localStorage 安全存取層：getItem／setItem／removeItem 例外
// （SecurityError／隱私模式／QuotaExceededError 等）一律不拋出，讓 render / handler
// 不會中斷。不使用 localStorage.clear()、不影響其他 key、不吞掉上層資料驗證。
// 既有 swiss_checks 與 plan choice 已各自具備完整 try/catch + validation/cleanup，
// 保留原實作（本層為 bookings_filter / pending_* / luggage_receipt_* 及未來 consumer 共用）。
// ════════════════════════════════════════════════════════════════

function safeStorageGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return (value === null || value === undefined) ? fallback : value;
  } catch (e) {
    return fallback;                     // getItem 例外（SecurityError 等）→ fallback
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, String(value));
    return true;
  } catch (e) {
    return false;                        // setItem 例外（Quota/Security 等）→ false
  }
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;                        // removeItem 例外 → false
  }
}

// ── Bookings filter（enum validation；合法集合以實際 UI 篩選按鈕為準）──────
const BOOKINGS_FILTER_KEY = "bookings_filter";
const BOOKINGS_FILTERS = ["all", "open", "must", "important", "suggest", "track"];
function normalizeBookingsFilter(value) {
  return (typeof value === "string" && BOOKINGS_FILTERS.indexOf(value) !== -1) ? value : null;
}
function loadBookingsFilter() {
  const raw = safeStorageGet(BOOKINGS_FILTER_KEY, null);   // getItem 例外／missing → null
  const valid = normalizeBookingsFilter(raw);
  if (valid) return valid;
  if (raw !== null) safeStorageRemove(BOOKINGS_FILTER_KEY); // 已存在但無效 → 只清自己的 key
  return "all";                                             // fallback
}
function saveBookingsFilter(value) {
  const valid = normalizeBookingsFilter(value);
  if (!valid) return false;                                 // 無效 filter 不寫入
  return safeStorageSet(BOOKINGS_FILTER_KEY, valid);
}

// ── Pending state（enum validation：unconfirmed / confirmed / done）──────
const PENDING_STATES = ["unconfirmed", "confirmed", "done"];
function pendingKey(id) { return `pending_${id}`; }         // 既有 key 命名規則不變
function normalizePendingState(value) {
  return (typeof value === "string" && PENDING_STATES.indexOf(value) !== -1) ? value : null;
}
function getPendingState(id) {
  const key = pendingKey(id);
  const raw = safeStorageGet(key, null);                    // getItem 例外／missing → null
  const valid = normalizePendingState(raw);
  if (valid) return valid;
  if (raw !== null) safeStorageRemove(key);                 // 已存在但無效 → 只清該 pending key
  return "unconfirmed";                                     // fallback
}
function setPendingState(id, state) {
  const valid = normalizePendingState(state);
  if (!valid) return false;                                 // 無效 enum 不寫入
  return safeStorageSet(pendingKey(id), valid);
}

// ── Luggage receipt（自由文字，不需 enum，僅安全 I/O；escape 由 render 維持）──
function luggageReceiptKey(id) { return `luggage_receipt_${id}`; } // 命名規則不變
function getLuggageReceipt(receiptKey) {
  return safeStorageGet(receiptKey, "");                    // getItem 例外／missing → ""
}
function setLuggageReceipt(receiptKey, value) {
  return safeStorageSet(receiptKey, value == null ? "" : value);
}

// ──────────── 日期計算 ────────────
// 台灣時區的「今日 00:00」— 用於出發前倒數
function todayTaipei() {
  const now = new Date();
  const tw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  tw.setHours(0,0,0,0);
  return tw;
}

// 瑞士時區的「當前日期字串 YYYY-MM-DD」— 用於 Day 1-11 判定
function todayZurichDateStr() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

// 瑞士時區的當前 HH:MM
function nowZurichHM() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(now);
  const h = parts.find(p => p.type === "hour").value;
  const m = parts.find(p => p.type === "minute").value;
  return `${h}:${m}`;
}

function daysUntilDeparture() {
  const dep = new Date("2027-09-13T00:00:00+08:00");
  const t = todayTaipei();
  return Math.ceil((dep - t) / (1000 * 60 * 60 * 24));
}

// 用 Europe/Zurich 時區精確判定 Day 1-11
function findTodayDayIndex() {
  const zurichStr = todayZurichDateStr();
  // Day 1 = 2027-09-14 (Europe/Zurich)
  const startYMD = new Date("2027-09-14T00:00:00Z");
  const currentYMD = new Date(zurichStr + "T00:00:00Z");
  const diff = Math.floor((currentYMD - startYMD) / (1000 * 60 * 60 * 24));
  if (diff >= 0 && diff < DAYS.length) return diff;
  return -1;
}

// V21.5：時間引擎重構
// 支援三種時間格式：
//   range   → "HH:MM-HH:MM" / "HH:MM–HH:MM" / "HH:MM~HH:MM"
//   point   → "HH:MM 起飛" / "HH:MM 集合" / "HH:MM 發車" / "HH:MM 開放" / 純 "HH:MM ..."
//   unknown → 無法解析，安全跳過（不當作時間軸事件）
function parseTimelineTime(str) {
  if (!str) return { type: "unknown", startMin: null, endMin: null };
  // 先試 range
  const r = str.match(/^(\d{1,2}):(\d{2})\s*[–\-~]\s*(\d{1,2}):(\d{2})/);
  if (r) {
    const s = parseInt(r[1],10)*60 + parseInt(r[2],10);
    const e = parseInt(r[3],10)*60 + parseInt(r[4],10);
    return { type: "range", startMin: s, endMin: e };
  }
  // 試 point（開頭 HH:MM 後面接任意文字）
  const p = str.match(/^(\d{1,2}):(\d{2})/);
  if (p) {
    const s = parseInt(p[1],10)*60 + parseInt(p[2],10);
    return { type: "point", startMin: s, endMin: s };
  }
  return { type: "unknown", startMin: null, endMin: null };
}

// V21.5：向後兼容 alias
function parseTimeblockRange(str) {
  const t = parseTimelineTime(str);
  if (t.type === "range") return [t.startMin, t.endMin];
  return null;
}

// V21.7a/b：Plan lifecycle 共用 — 所有 planRole 的時間欄位鍵
function planRoleTimeKeys() {
  return ["activityTime", "lunchTime", "descentTime", "townTime"];
}

// V21.7a：計算某個 plan 的「分流邊界」起始分鐘（Activation Start）
// 依 planActivation.mode 決定；預設 earliest_plan_block_start
// = 所有 option 中，最早出現的 planRole 時間字串起始分鐘
// 不使用 hardcode 時間，2027 班次調整時邊界自動跟著改
function planActivationStartMin(planDef) {
  if (!planDef) return null;
  const act = planDef.planActivation || {};
  if (typeof act.activationStartMin === "number") return act.activationStartMin;

  let earliest = null;
  (planDef.options || []).forEach(opt => {
    planRoleTimeKeys().forEach(k => {
      const parsed = parseTimelineTime(opt[k]);
      if (parsed.type === "unknown" || parsed.startMin == null) return;
      if (earliest === null || parsed.startMin < earliest) earliest = parsed.startMin;
    });
  });
  return earliest;
}

// V21.7b：計算某個 plan 的「結束邊界」分鐘（Deactivation End）
// 依 planActivation.mode 決定；預設 latest_plan_block_end
// = 所有 option 中，最晚的 planRole 結束分鐘（range 取 endMin，point 取 startMin）
//
// 目的：修正 V21.7a「plan lifecycle 只有開始邊界、沒有結束邊界」的行為錯誤 ——
//       未選 A/B 時，一旦越過 activation start 就永久 plan_unselected，
//       即使方案時段早已全部結束，仍會擋住之後的共同行程（例如 Day 8 晚餐）。
//
// 同樣不使用 hardcode（不寫死 18:30），完全由 DAY_PLAN_CHOICES option SSoT 推導。
// 2027 行程時間調整時，只需改 option 時間，start / end boundary 自動同步。
function planActivationEndMin(planDef) {
  if (!planDef) return null;
  const act = planDef.planActivation || {};
  if (typeof act.deactivationEndMin === "number") return act.deactivationEndMin;

  let latest = null;
  (planDef.options || []).forEach(opt => {
    planRoleTimeKeys().forEach(k => {
      const parsed = parseTimelineTime(opt[k]);
      if (parsed.type === "unknown") return;
      const end = (parsed.endMin != null) ? parsed.endMin : parsed.startMin;
      if (end == null) return;
      if (latest === null || end > latest) latest = end;
    });
  });
  return latest;
}

// V21.7b：判斷未選方案時，該 plan 目前處於 lifecycle 的哪個階段
//   "before_activation" → 分流點之前：共同行程照常解析
//   "active_window"     → 分流有效時間窗：才要求選擇 A/B
//   "after_deactivation"→ 方案時段已結束：不再阻擋後續共同行程
// 無法推導邊界時回傳 "active_window"（退回 V21.6 保守行為）
function planLifecyclePhase(planDef, nowMin) {
  const start = planActivationStartMin(planDef);
  const end   = planActivationEndMin(planDef);
  if (start === null) return "active_window";      // 無法推導 → 保守
  if (nowMin < start) return "before_activation";
  if (end !== null && nowMin >= end) return "after_deactivation";
  return "active_window";
}

// V21.7a/b：目前/下一個 timeblock（依 Europe/Zurich 當前時間）
// P2（V21.6）：A/B 方案未選定時不猜方案
// V21.7a 修正：A/B 未選定不再遮蔽分流點【之前】的共同行程
// V21.7b 修正：A/B 未選定不再永久遮蔽分流時段【之後】的共同行程
//   完整三階段 lifecycle（planLifecyclePhase）：
//     before_activation  → 共同行程照常解析
//     active_window      → 才回傳 plan_unselected
//     after_deactivation → planRef block 不再阻擋，恢復解析共同 timeline
// P8（V21.6）：point event 與 range 語意分離
function findCurrentAndNext(tl, opts) {
  const hm = nowZurichHM();
  const nowMin = parseInt(hm.slice(0,2),10)*60 + parseInt(hm.slice(3,5),10);

  // V21.7c：獨立防禦性驗證。即使 localStorage helpers 已驗證，直接傳入的
  //   opts.planChoices 仍可能含無效／過期值（unit tests、其他程式、未來
  //   state migration）。這裡以 resolveValidPlanChoice 逐一驗證：無效值一律
  //   視同「尚未選定」（從 map 移除），確保 plan block 不會被靜默排除、也不會
  //   誤把無效值當已選而略過 lifecycle 判定。
  const rawChoices = (opts && opts.planChoices) || {};
  const planChoices = {};
  Object.keys(rawChoices).forEach(refKey => {
    const def = (typeof DAY_PLAN_CHOICES !== "undefined") ? DAY_PLAN_CHOICES[refKey] : null;
    const valid = resolveValidPlanChoice(def, rawChoices[refKey]);
    if (valid) planChoices[refKey] = valid;
  });

  // ── 處理 A/B 方案 ────────────────────────────────────────────
  const planBlocks = tl.filter(t => t.planRef);
  let pendingPlanRef = null;      // 尚未選定、且正處於 active_window 的 planRef
  let unselectedPlanRefs = [];    // 尚未選定的 planRef（含各自 lifecycle phase）

  if (planBlocks.length) {
    const refs = [...new Set(planBlocks.map(t => t.planRef))];
    refs.forEach(refKey => {
      if (planChoices[refKey]) return;   // 已選定
      const def = (typeof DAY_PLAN_CHOICES !== "undefined") ? DAY_PLAN_CHOICES[refKey] : null;
      const phase = planLifecyclePhase(def, nowMin);
      unselectedPlanRefs.push({ refKey, phase });
      if (phase === "active_window") pendingPlanRef = pendingPlanRef || refKey;
    });
  }

  // 僅在 active_window（分流有效時間窗）內未選 → 才回傳 plan_unselected
  if (pendingPlanRef) {
    const def = (typeof DAY_PLAN_CHOICES !== "undefined") ? DAY_PLAN_CHOICES[pendingPlanRef] : null;
    return {
      current: null, next: null, nowMin, allBlocks: [],
      planUnselected: true, planRef: pendingPlanRef,
      decisionPrompt: (def && def.planActivation && def.planActivation.decisionPrompt) || null
    };
  }

  // ── 展開 timeline ────────────────────────────────────────────
  // 已選方案 → 展開實際時間
  // 未選且 before_activation / after_deactivation → 排除該 planRef block，
  //   共同行程照常解析（V21.7a 修正分流前、V21.7b 修正分流後）
  const expanded = [];
  tl.forEach(t => {
    if (!t.planRef) { expanded.push(t); return; }
    const chosenKey = planChoices[t.planRef];
    const def = (typeof DAY_PLAN_CHOICES !== "undefined") ? DAY_PLAN_CHOICES[t.planRef] : null;
    if (!def || !chosenKey) return;   // 未選定（且不在 active_window）：暫不納入解析
    const opt = def.options.find(o => o.key === chosenKey);
    if (!opt) return;
    // 支援 activity / lunch / descent / town 四種 role
    if (t.planRole === "activity")      expanded.push(Object.assign({}, t, { time: opt.activityTime, title: opt.activityTitle || t.title }));
    else if (t.planRole === "lunch")    expanded.push(Object.assign({}, t, { time: opt.lunchTime,    title: opt.lunchTitle    || t.title }));
    else if (t.planRole === "descent")  expanded.push(Object.assign({}, t, { time: opt.descentTime,  title: opt.descentTitle  || t.title }));
    else if (t.planRole === "town")     expanded.push(Object.assign({}, t, { time: opt.townTime }));
    else expanded.push(t);
  });

  const parsed = expanded.map((t, i) => ({ item: t, idx: i, ...parseTimelineTime(t.time) }));
  const eventable = parsed.filter(p => p.type !== "unknown");
  if (eventable.length === 0) {
    return { current:null, next:null, nowMin, allBlocks:[], planUnselected:false, unselectedPlanRefs };
  }

  let current = null;
  let currentIsMilestone = false;
  // range 優先（實際「正在進行」）
  for (const p of eventable) {
    if (p.type === "range" && nowMin >= p.startMin && nowMin < p.endMin) { current = p.item; break; }
  }
  // 沒有 range 命中，才看 point event 關注窗（語意為「應完成/注意」）
  const POINT_WINDOW_MIN = 5;
  if (!current) {
    for (const p of eventable) {
      if (p.type === "point" && nowMin >= p.startMin && nowMin <= p.startMin + POINT_WINDOW_MIN) {
        current = p.item; currentIsMilestone = true; break;
      }
    }
  }

  let next = null;
  for (const p of eventable) {
    if (p.startMin > nowMin) { next = p.item; break; }
  }

  // V21.7a：若共同行程已全部結束、但仍有「尚未到分流點」的未選方案，
  // 不得誤報 after_all（今日行程已完成）。以分流邊界作為 next，顯示為 gap。
  if (!current && !next && unselectedPlanRefs.length) {
    for (const { refKey, phase } of unselectedPlanRefs) {
      if (phase !== "before_activation") continue;   // V21.7b：僅分流前才補 boundary next
      const def = (typeof DAY_PLAN_CHOICES !== "undefined") ? DAY_PLAN_CHOICES[refKey] : null;
      const boundary = planActivationStartMin(def);
      if (boundary !== null && boundary > nowMin) {
        const hh = String(Math.floor(boundary / 60)).padStart(2, "0");
        const mm = String(boundary % 60).padStart(2, "0");
        next = {
          time: `${hh}:${mm}`,
          title: `${(def && def.label) || "今日方案"} — 分流點（屆時需選擇 A 或 B）`,
          _isPlanBoundary: true
        };
        break;
      }
    }
  }

  return { current, next, nowMin, allBlocks: eventable, currentIsMilestone, planUnselected:false, unselectedPlanRefs };
}

// V21.6：判斷「當日狀態」五態（V21.5 為四態）
// - "in_range":         現在正在某個 range 段內
// - "at_milestone":     現在落在某個 point event 的關注窗（P8：語意為「應完成/注意」，非「正在做」）
// - "before_start":     早於全天第一個可解析時間
// - "gap":              兩段之間中間空檔
// - "after_all":        全天所有可解析時間都已過
// - "schedule_unknown": 當日沒有任何可解析時間（P7：不得誤顯示為「今日行程已完成」）
// - "plan_unselected":  已到 A/B 分流點但方案尚未選定（V21.7a：分流點之前不遮蔽共同行程）
function classifyDayState(cn) {
  if (cn && cn.planUnselected) return "plan_unselected";
  if (!cn.allBlocks || cn.allBlocks.length === 0) return "schedule_unknown";
  if (cn.current) return cn.currentIsMilestone ? "at_milestone" : "in_range";
  if (!cn.next) return "after_all";
  const firstEventBlock = cn.allBlocks[0].item;
  if (cn.next === firstEventBlock) return "before_start";
  return "gap";
}

// ──────────── 導航 ────────────
function navigate(page, arg) {
  State.currentPage = page;
  State.currentDay = (typeof arg === "number") ? arg : null;
  State.showBackup = false;
  window.scrollTo(0, 0);
  render();
  // 更新 hash（不觸發 popstate）
  const hash = arg != null ? `#${page}/${arg}` : `#${page}`;
  if (location.hash !== hash) {
    history.pushState({ page, arg }, "", hash);
  }
}

window.addEventListener("popstate", (e) => {
  const s = e.state;
  if (s) {
    State.currentPage = s.page;
    State.currentDay = s.arg;
  } else {
    parseHash();
  }
  render();
});

function parseHash() {
  const h = location.hash.replace(/^#/, "");
  if (!h) { State.currentPage = "home"; State.currentDay = null; return; }
  const [p, arg] = h.split("/");
  State.currentPage = p;
  State.currentDay = arg != null ? parseInt(arg, 10) : null;
}

// ──────────── 頁面渲染入口 ────────────
function render() {
  const app = document.getElementById("app");
  const nav = document.getElementById("nav");

  // 頂部 app bar
  const bar = document.getElementById("appbar");
  bar.innerHTML = renderAppBar();

  // 主內容
  app.innerHTML = `<div class="page container">${renderPage()}</div>`;

  // 底部導覽
  nav.innerHTML = renderBottomNav();

  attachHandlers();
}

function renderAppBar() {
  const showBack = State.currentPage !== "home" || State.currentDay != null;
  const versionBadge = TRIP_META.version
    ? `<div style="font-size:10px; opacity:0.7; margin-top:2px; font-weight:400;">${escapeHTML(TRIP_META.version)}</div>`
    : "";
  if (showBack) {
    return `
      <button class="back-btn" data-back>‹</button>
      <div style="flex:1; text-align:center;">
        <h1 style="justify-content:center; font-size:16px;">🇨🇭 瑞士旅行 2027</h1>
        ${versionBadge}
      </div>
      <div style="width:38px;"></div>
    `;
  }
  return `
    <h1><span class="icon">🇨🇭</span> 瑞士旅行 2027</h1>
    <div style="text-align:right; font-size:11px; opacity:0.85;">
      <div>2027/9/13 出發 · 4 大 1 小</div>
      ${TRIP_META.version ? `<div style="font-size:10px; opacity:0.85; margin-top:2px;">${escapeHTML(TRIP_META.version)}</div>` : ''}
    </div>
  `;
}

function renderBottomNav() {
  const items = [
    { key:"home", em:"🏠", label:"首頁" },
    { key:"days", em:"📅", label:"行程" },
    { key:"bookings", em:"✅", label:"待辦" },
    { key:"tools", em:"🧰", label:"工具" },
    { key:"emergency", em:"🆘", label:"緊急" }
  ];
  return items.map(it => `
    <button class="nav-btn ${State.currentPage === it.key ? "active" : ""}" data-nav="${it.key}">
      <span class="em">${it.em}</span>
      <span>${it.label}</span>
    </button>
  `).join("");
}

function renderPage() {
  const p = State.currentPage;
  if (p === "home")      return renderHome();
  if (p === "days")      return renderDaysList();
  if (p === "day")       return renderDay();
  if (p === "bookings")  return renderBookings();
  if (p === "shopping")  return renderShopping();
  if (p === "packing")   return renderPacking();
  if (p === "sights")    return renderSights();
  if (p === "emergency") return renderEmergency();
  if (p === "hotels")    return renderHotels();
  if (p === "flights")   return renderFlights();
  if (p === "tools")     return renderTools();
  if (p === "pending")   return renderPending();
  if (p === "weather")   return renderWeather();
  if (p === "luggage")   return renderLuggage();
  return renderHome();
}

// ──────────── 首頁 ────────────
function renderHome() {
  const days = daysUntilDeparture();
  const todayIdx = findTodayDayIndex();

  let countdownHTML;
  if (days > 0) {
    countdownHTML = `
      <div class="countdown">
        <div class="label">距離出發還有</div>
        <div class="num">${days}</div>
        <div class="unit">天</div>
        <div class="date">2027 / 09 / 13 (一) 台灣起飛</div>
      </div>
    `;
  } else if (todayIdx >= 0) {
    countdownHTML = `
      <div class="countdown" style="background: linear-gradient(135deg, var(--swiss-red), #b30014);">
        <div class="label">旅程進行中</div>
        <div class="num">Day ${todayIdx + 1}</div>
        <div class="unit">${DAYS[todayIdx].theme}</div>
        <div class="date">${DAYS[todayIdx].date}</div>
      </div>
    `;
  } else {
    countdownHTML = `
      <div class="countdown" style="background: linear-gradient(135deg, var(--slate-500), var(--slate-700));">
        <div class="label">旅程已結束</div>
        <div class="num">✨</div>
        <div class="unit">下一次瑞士之旅見</div>
      </div>
    `;
  }

  let todayBtn = "";
  if (todayIdx >= 0) {
    const d = DAYS[todayIdx];
    const hotel = HOTELS[d.hotelKey];
    const cn = findCurrentAndNext(d.tl, { planChoices: allPlanChoices() });
    // 今日 critical 匯總（前 3 條）
    const critList = [];
    d.tl.forEach(t => {
      if (t.critical && t.critical.length) critList.push(...t.critical);
    });
    const critTop3 = critList.slice(0, 3);
    const timeNow = nowZurichHM();

    // V21.6：classifyDayState 七態（新增 schedule_unknown / at_milestone / plan_unselected）
    const dayState = classifyDayState(cn);
    let flowHTML = "";
    if (dayState === "in_range") {
      flowHTML += `
        <div style="background:rgba(255,255,255,0.15); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">🟢 目前正在</div>
          <div style="font-size:14px; font-weight:700;">${escapeHTML(cn.current.time)} · ${escapeHTML(cn.current.title)}</div>
        </div>
      `;
    } else if (dayState === "at_milestone") {
      // P8：point event 語意為「應完成／注意」，不是「正在進行一段行程」
      flowHTML += `
        <div style="background:rgba(255,255,255,0.15); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">⏰ 現在應完成／注意</div>
          <div style="font-size:14px; font-weight:700;">${escapeHTML(cn.current.time)} · ${escapeHTML(cn.current.title)}</div>
        </div>
      `;
    } else if (dayState === "plan_unselected") {
      // V21.7a：僅在已到分流點且未選時顯示（分流前的共同行程不再被遮蔽）
      const planDef = (typeof DAY_PLAN_CHOICES !== "undefined" && cn.planRef) ? DAY_PLAN_CHOICES[cn.planRef] : null;
      const prompt = cn.decisionPrompt || (planDef && planDef.planActivation && planDef.planActivation.decisionPrompt) || "請先選擇今日方案。";
      flowHTML += `
        <div style="background:rgba(0,0,0,0.2); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">🔀 已到分流點 · 今日方案尚未選定</div>
          <div style="font-size:12px; opacity:0.9; line-height:1.6;">
            ${escapeHTML(prompt)}<br>
            請展開完整行程，在方案卡片選擇 A 或 B。
          </div>
        </div>
      `;
    } else if (dayState === "schedule_unknown") {
      // P7：無法解析 ≠ 今日已完成
      flowHTML += `
        <div style="background:rgba(0,0,0,0.2); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">📋 今日時間尚未完整鎖定</div>
          <div style="font-size:12px; opacity:0.9;">本日行程未使用可推算的絕對時間，請開啟完整行程查看</div>
        </div>
      `;
    } else if (dayState === "before_start") {
      flowHTML += `
        <div style="background:rgba(0,0,0,0.15); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">🕐 行程尚未開始</div>
          <div style="font-size:12px; opacity:0.8;">第一段行程於下方預告</div>
        </div>
      `;
    } else if (dayState === "gap") {
      flowHTML += `
        <div style="background:rgba(0,0,0,0.15); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">🕐 空檔中</div>
          <div style="font-size:12px; opacity:0.8;">下一段行程於下方顯示</div>
        </div>
      `;
    } else { // after_all
      flowHTML += `
        <div style="background:rgba(255,255,255,0.15); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">🌙 今日行程已完成</div>
          <div style="font-size:12px; opacity:0.8;">好好休息，明天繼續</div>
        </div>
      `;
    }

    if (cn.next) {
      const nextLabel = (parseTimelineTime(cn.next.time).type === "point") ? "⏰ 下一個關鍵時間" : "🔵 下一步";
      flowHTML += `
        <div style="background:rgba(0,0,0,0.15); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
          <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">${nextLabel}</div>
          <div style="font-size:14px; font-weight:700;">${escapeHTML(cn.next.time)} · ${escapeHTML(cn.next.title)}</div>
        </div>
      `;
    }

    todayBtn = `
      <div class="today-dashboard" style="background: linear-gradient(135deg, var(--swiss-red), #b30014); color:#fff; padding:16px; border-radius:16px; margin-bottom:14px; box-shadow: 0 4px 16px rgba(220,0,24,0.28);">
        <div style="display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:10px;">
          <div>
            <div style="font-size:11px; opacity:0.9; letter-spacing:0.06em;">📍 現場模式 · Europe/Zurich ${escapeHTML(timeNow)}</div>
            <div style="font-size:22px; font-weight:800; margin-top:2px;">Day ${d.day} · ${escapeHTML(d.theme)}</div>
            <div style="font-size:12px; opacity:0.9; margin-top:2px;">${escapeHTML(d.date)} · ${escapeHTML(d.loc)}</div>
          </div>
        </div>

        ${flowHTML}

        ${hotel ? `
          <div style="font-size:12px; opacity:0.9; margin-bottom:8px;">🏨 ${escapeHTML(hotel.name)}</div>
        ` : ""}

        ${critTop3.length ? `
          <div style="background:rgba(0,0,0,0.2); border-radius:10px; padding:10px 12px; margin-bottom:10px;">
            <div style="font-size:10px; opacity:0.9; letter-spacing:0.08em; margin-bottom:6px;">⚠️ 今日重要提醒</div>
            ${critTop3.map(c => `<div style="font-size:12px; line-height:1.55; padding:3px 0;">• ${escapeHTML(c)}</div>`).join("")}
          </div>
        ` : ""}

        <button class="today-btn" data-nav-day="${todayIdx}" style="background: rgba(255,255,255,0.95); color: var(--swiss-red); padding:12px 16px; border-radius:10px; border:none; width:100%; font-family:inherit; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:space-between;">
          <span>展開完整 Day ${d.day} 行程</span>
          <span style="font-size:18px;">›</span>
        </button>
      </div>
    `;
  }

  const dayCards = DAYS.map((d, idx) => {
    const hotel = HOTELS[d.hotelKey];
    const isToday = idx === todayIdx;
    return `
      <div class="day-list-item ${isToday ? "today" : ""}" data-nav-day="${idx}">
        <div class="num">${d.day}</div>
        <div class="content">
          <div class="theme">${d.theme}${isToday ? '<span class="today-badge">今日</span>' : ''}</div>
          <div class="meta">
            <span>📅 ${d.date}</span>
            <span>📍 ${d.loc}</span>
          </div>
        </div>
        <span class="arrow">›</span>
      </div>
    `;
  }).join("");

  // 建議 D：重要數字速查卡片
  const quickNumbersHTML = (typeof QUICK_NUMBERS !== "undefined") ? `
    <div class="card" style="background: linear-gradient(135deg, #1E3A5F, #0F172A); color: #F1F5F9; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
      <div style="font-size:13px; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
        <span style="font-size:16px;">⚡</span> 重要數字速查
        <span style="font-size:10px; opacity:0.6; margin-left:auto; font-weight:400;">現場最常查</span>
      </div>
      ${QUICK_NUMBERS.map(n => {
        const isPhone = /^[+\d\s\-()]+$/.test(n.value.trim()) && n.value.includes("+");
        const telHref = isPhone ? `tel:${n.value.replace(/[^+\d]/g, '')}` : null;
        const rightPart = telHref
          ? `<a href="${telHref}" style="color:#93E0FF; text-decoration:none; font-weight:600; font-family:ui-monospace,monospace; font-size:13px;">${escapeHTML(n.value)}</a>`
          : `<span style="color:rgba(255,255,255,0.85); font-size:12px;">${escapeHTML(n.value)}</span>`;
        return `
          <div style="display:flex; align-items:flex-start; gap:8px; padding:7px 0; border-top:1px solid rgba(255,255,255,0.08); font-size:12px;">
            <span style="flex-shrink:0; margin-top:1px;">${n.icon}</span>
            <div style="flex:1; min-width:0;">
              <div style="opacity:0.75; font-size:11px; margin-bottom:2px;">${escapeHTML(n.label)}</div>
              ${rightPart}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  ` : "";

  return `
    ${countdownHTML}
    ${todayBtn}
    ${quickNumbersHTML}

    <div class="quick-grid">
      <div class="quick-tile" data-nav="luggage">
        <span class="em">🛅</span>
        <div class="label">行李追蹤</div>
        <div class="sub">SBB 5 件 × 4 節點</div>
      </div>
      <div class="quick-tile" data-nav="pending">
        <span class="em">🟡</span>
        <div class="label">2027 待確認</div>
        <div class="sub">10 項待鎖定</div>
      </div>
      <div class="quick-tile" data-nav="weather">
        <span class="em">🌦️</span>
        <div class="label">天氣決策</div>
        <div class="sub">互換與撤退規則</div>
      </div>
      <div class="quick-tile" data-nav="tools">
        <span class="em">🧰</span>
        <div class="label">全部工具</div>
        <div class="sub">住宿·航班·打包·景點</div>
      </div>
    </div>

    <div class="pwa-hint">
      💡 <strong>可加到主畫面離線使用</strong>：iPhone Safari 分享 → 加入主畫面；Android Chrome 選單 → 加到主畫面。加入後即使山區無網也可查閱。
    </div>

    <div class="section-title">🗓️ 完整行程（${DAYS.length} 天）</div>
    ${dayCards}
  `;
}

// ──────────── 行程列表 ────────────
function renderDaysList() {
  return `
    <div class="page-title">📅 完整行程</div>
    <div class="page-sub">4 大 1 小 · 琉森 4 晚 + 格林德瓦 6 晚</div>
    ${DAYS.map((d, idx) => `
      <div class="day-list-item" data-nav-day="${idx}">
        <div class="num">${d.day}</div>
        <div class="content">
          <div class="theme">${d.theme}</div>
          <div class="meta">
            <span>📅 ${d.date}</span>
            <span>📍 ${d.loc}</span>
          </div>
        </div>
        <span class="arrow">›</span>
      </div>
    `).join("")}
  `;
}

// ──────────── 單日詳細 ────────────
function renderDay() {
  const idx = State.currentDay;
  if (idx == null || !DAYS[idx]) return renderDaysList();
  const d = DAYS[idx];
  const hotel = HOTELS[d.hotelKey];

  const prevBtn = idx > 0 ? `<button class="badge badge-tr" data-nav-day="${idx-1}" style="border:none; cursor:pointer;">‹ Day ${idx}</button>` : "";
  const nextBtn = idx < DAYS.length - 1 ? `<button class="badge badge-tr" data-nav-day="${idx+1}" style="border:none; cursor:pointer;">Day ${idx+2} ›</button>` : "";

  let backupHTML = "";
  if (d.hasBackup && d.backup) {
    backupHTML = `
      <button class="backup-toggle ${State.showBackup ? 'active' : ''}" data-backup-toggle>
        <span>${State.showBackup ? '📖 隱藏備案' : '📖 查看備案'}</span>
        <span>${State.showBackup ? '▲' : '▼'}</span>
      </button>
      ${State.showBackup ? renderBackupPanel(d.backup) : ''}
    `;
  }

  const timeline = State.showBackup && d.backup ? d.backup.tl : d.tl;
  const isBackupView = State.showBackup && d.backup;

  // 建議 B：Day 10 專屬：Brienz Rothorn 營運查詢外部連結
  const day10Extra = (idx === 9 && typeof EXT_LINKS !== "undefined" && EXT_LINKS.brienzRothornOps) ? `
    <a href="${EXT_LINKS.brienzRothornOps}" target="_blank" rel="noopener noreferrer"
       style="display:flex; align-items:center; justify-content:space-between; gap:10px;
              width:100%; padding:14px 16px; margin-bottom:12px;
              background: linear-gradient(135deg, #EA580C, #DC2626);
              color:white; border-radius:14px; text-decoration:none;
              font-weight:700; font-size:14px;
              box-shadow: 0 4px 14px rgba(234,88,12,0.35);">
      <span style="font-size:20px;">🔍</span>
      <span style="flex:1;">今日 BRB 是否正常營運？</span>
      <span style="font-size:12px; opacity:0.85;">brienz-rothorn-bahn.ch ↗</span>
    </a>
  ` : "";

  // V21.3b：Day 10 BRB 班次列表 card
  const brbScheduleCard = (idx === 9 && typeof BRB_SCHEDULE !== "undefined") ? `
    <div class="card" style="background: linear-gradient(135deg, #FEF3C7, #FFFBEB); border: 1px solid var(--gold-border); border-left: 4px solid var(--gold);">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
        <div style="font-weight:800; font-size:14px; color:var(--gold);">🚂 BRB 班次表</div>
        ${renderStatusBadge("current", "2026 現行官方資料")}
        ${renderStatusBadge("pending", "2027 待官方公布")}
      </div>
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">${escapeHTML(BRB_SCHEDULE.season)}</div>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
        ${BRB_SCHEDULE.departures.map(t => `
          <span style="padding:6px 10px; background:white; border:1px solid var(--gold-border); border-radius:8px; font-family:ui-monospace,monospace; font-weight:700; color:var(--text); font-size:13px;">${escapeHTML(t)}</span>
        `).join("")}
      </div>
      <div style="font-size:12px; color:var(--text); line-height:1.6; padding:10px; background:white; border-radius:8px;">
        <div style="margin-bottom:4px;">⏰ ${escapeHTML(BRB_SCHEDULE.buffer)}</div>
        <div style="margin-bottom:4px;">🎫 ${escapeHTML(BRB_SCHEDULE.note)}</div>
        <div style="margin-top:6px; padding-top:6px; border-top:1px dashed var(--gold-border); color:var(--text-muted); font-size:11px;">${escapeHTML(BRB_SCHEDULE.simulation2026)}</div>
      </div>
    </div>
  ` : "";

  // V21.3b：Day 11 Emirates 時間規則 card
  const day11EmiratesTime = (idx === 10 && typeof EMIRATES_RULES !== "undefined" && EMIRATES_RULES.timeRules) ? `
    <div class="card" style="background: linear-gradient(135deg, #FFF7ED, #FEF2F2); border: 1px solid var(--warn-orange-border); border-left: 4px solid var(--warn-orange);">
      <div style="font-weight:800; font-size:14px; color:var(--warn-orange); margin-bottom:8px;">⏰ Emirates 時間規則（現行參考）</div>
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px; line-height:1.5;">${escapeHTML(EMIRATES_RULES.timeRules.baseFlight)}</div>
      ${EMIRATES_RULES.timeRules.points.map(p => `
        <div style="display:flex; gap:10px; padding:8px 0; border-top:1px solid rgba(0,0,0,0.06); font-size:12px;">
          <div style="flex:1;">
            <div style="font-weight:600; color:var(--text);">${escapeHTML(p.label)}</div>
            ${p.note ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px; line-height:1.5;">${escapeHTML(p.note)}</div>` : ''}
          </div>
          <div style="font-family:ui-monospace,monospace; font-weight:800; color:var(--warn-orange); white-space:nowrap;">${escapeHTML(p.value)}</div>
        </div>
      `).join("")}
      <div style="font-size:11px; color:var(--text-muted); margin-top:10px; padding-top:10px; border-top:1px dashed var(--warn-orange-border); line-height:1.5;">${escapeHTML(EMIRATES_RULES.timeRules.note)}</div>
    </div>
  ` : "";

  // V21.6 · P11：Day 5 LIE 座位預約資訊卡（Day 卡片本身也要有 Current / Pending badge）
  const lieCard = (idx === 4) ? `
    <div class="card" style="background:linear-gradient(135deg,#EFF6FF,#F8FAFC); border:1px solid #93C5FD; border-left:4px solid var(--jungfrau-blue);">
      <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
        <div style="font-weight:800; font-size:14px; color:var(--jungfrau-blue);">🚂 LIE 座位預約</div>
        ${renderStatusBadge("current", "現行官方規則")}
        ${renderStatusBadge("pending", "2027/9 費率待公布")}
      </div>
      <div style="font-size:12px; color:var(--text); line-height:1.75;">
        <div>• 座位預約用於<strong>確保座位</strong>，不是搭乘的必要條件</div>
        <div>• 持 STP 即可搭乘（Zentralbahn 官方：本線全額包含於 STP）</div>
        <div>• 主方案：透過 <strong>Zentralbahn 官方指定座位預約系統</strong>預約相連座位</div>
        <div>• 🚨 <strong>車票免費 ≠ 座位預約免費</strong>：妞妞車票免費，但若要獨立保證座位仍需付 reservation fee</div>
        <div>• 📌 4 大 1 小若希望 5 人皆有固定座位，應處理 <strong>5 個座位</strong>（非只訂 4 個）</div>
        <div>• 官方現行預約費參考：2026/5/2–11/1 CHF 16；2027 費率待公布</div>
      </div>
      <a href="${EXT_LINKS.lieOfficial}" target="_blank" rel="noopener noreferrer" data-ext-link
         style="display:inline-block; margin-top:10px; padding:6px 12px; font-size:11px; font-weight:700; border-radius:6px; background:var(--jungfrau-blue); color:#fff; text-decoration:none;">
        🔗 Zentralbahn 官方頁 ↗
      </a>
    </div>
  ` : "";

  // V21.6：Day 方案（A/B）選擇器 — 讓使用者明確選定，Today 才推算時間
  let planChooserCard = "";
  if (typeof DAY_PLAN_CHOICES !== "undefined") {
    Object.entries(DAY_PLAN_CHOICES).forEach(([key, def]) => {
      if (def.dayIndex !== idx) return;
      const chosen = getPlanChoice(key);
      planChooserCard += `
        <div class="card" style="border-left:4px solid var(--jungfrau-blue);">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
            <div style="font-weight:800; font-size:14px;">🔀 ${escapeHTML(def.label)}</div>
            ${chosen
              ? renderStatusBadge("confirmed", `已選 ${chosen}`)
              : renderStatusBadge("pending", "尚未選定")}
          </div>
          <div style="font-size:12px; color:var(--text-muted); line-height:1.6; margin-bottom:6px;">${escapeHTML(def.note)}</div>
          ${def.decisionHint ? `<div style="font-size:12px; font-weight:700; color:var(--jungfrau-blue); margin-bottom:6px;">📌 ${escapeHTML(def.decisionHint)}</div>` : ""}
          ${def.planActivation && def.planActivation.boundaryNote ? `<div style="font-size:11px; color:var(--text-muted); margin-bottom:10px; padding:8px 10px; background:var(--slate-50); border-radius:8px;">⏱️ ${escapeHTML(def.planActivation.boundaryNote)}</div>` : ""}
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${def.options.map(o => {
              const isDefault = o.tier === "family_default";
              const tierTag = isDefault ? "⭐ 家庭預設" : (o.tier === "bonus" ? "🏔️ Bonus Plan" : "");
              return `
              <button data-plan-choice="${key}|${o.key}" style="
                text-align:left; padding:10px 12px; border-radius:10px; cursor:pointer; font-family:inherit;
                border:1px solid ${chosen === o.key ? 'var(--jungfrau-blue)' : (isDefault ? '#93C5FD' : 'var(--border)')};
                background:${chosen === o.key ? '#DBEAFE' : 'var(--surface)'};
                color:${chosen === o.key ? '#1E40AF' : 'var(--text)'};">
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  <div style="font-weight:700; font-size:13px;">${chosen === o.key ? '✓ ' : ''}${escapeHTML(o.label)}</div>
                  ${tierTag ? `<span style="font-size:10px; padding:2px 7px; border-radius:999px; background:${isDefault ? '#DCFCE7' : '#FEF3C7'}; color:${isDefault ? '#166534' : '#92400E'}; font-weight:700;">${tierTag}</span>` : ""}
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${escapeHTML(o.pro)}</div>
                ${o.strollerPolicy ? `<div style="font-size:11px; color:var(--text-muted); margin-top:3px;">🛒 ${escapeHTML(o.strollerPolicy)}</div>` : ""}
                ${o.carrierPolicy ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">🎒 ${escapeHTML(o.carrierPolicy)}</div>` : ""}
              </button>
            `;}).join("")}
          </div>
          ${!chosen ? `<div style="margin-top:10px; font-size:11px; color:var(--warn-orange);">⚠️ 未選定前，Today 不會推算本日方案相關時間</div>` : ""}
        </div>
      `;
    });
  }

  return `
    <div class="day-hero">
      <div class="day-hero-tag">Day ${d.day} · ${d.date}</div>
      <h2>${d.theme}</h2>
      <div class="date">📍 ${d.loc}</div>
      ${hotel ? `
        <div class="hotel">
          🏨 ${hotel.name}
          <button class="map-btn" style="margin-left:auto;" data-map="${encodeURIComponent(hotel.mapQuery || hotel.address)}">地圖</button>
        </div>` : ""}
    </div>

    ${day10Extra}
    ${brbScheduleCard}
    ${day11EmiratesTime}
    ${lieCard}
    ${planChooserCard}
    ${backupHTML}

    ${isBackupView ? `
      <div style="margin: 8px 0 12px; padding: 10px 14px; background: var(--warn-orange-bg); border-left: 4px solid var(--warn-orange); border-radius: 8px; font-size: 12px; color: var(--warn-orange); font-weight: 600;">
        🔀 目前顯示：備案時間軸（${timeline.length} 個時段）· 主行程已隱藏
      </div>
      <div style="border: 2px dashed var(--warn-orange-border); border-radius: 14px; padding: 12px; background: rgba(234,88,12,0.03);">
        ${timeline.map(t => renderTimeblock(t, idx)).join("")}
      </div>
    ` : `
      ${timeline.map(t => renderTimeblock(t, idx)).join("")}
    `}

    <div style="display:flex; justify-content:space-between; margin-top:20px; padding: 12px 0;">
      <div>${prevBtn}</div>
      <div>${nextBtn}</div>
    </div>
  `;
}

function renderBackupPanel(backup) {
  return `
    <div class="backup-panel">
      <div class="trigger">⚠️ ${escapeHTML(backup.trigger)}</div>
      <div style="font-weight:700; margin-bottom:6px; color: var(--warn-orange); font-size:15px;">📖 ${escapeHTML(backup.title)}</div>
      <div style="font-size:12px; color:var(--text-muted); line-height:1.55;">
        以下時間軸將替換原本的主行程。若之後恢復晴天，可點上方按鈕切回主行程。
      </div>
    </div>
  `;
}

function renderTimeblock(t, dayIdx) {
  const critKey = `crit_${dayIdx}_${t.time}`;
  const critOpen = isChecked(critKey);
  const trIcon = TR_ICONS[t.tr.icon] || "🚂";

  return `
    <div class="timeblock">
      <div class="timeblock-header">
        <div>
          <div class="timeblock-time">⏰ ${t.time}</div>
          <div class="timeblock-title">${t.title}</div>
        </div>
      </div>

      <div class="badge-row">
        <span class="badge badge-tr">${trIcon} ${t.tr.label}</span>
        ${renderStpBadge(t.stp)}
      </div>

      ${t.steps && t.steps.length ? `
        <div class="steps-section">
          <h4>📋 執行步驟</h4>
          <ul class="steps-list">
            ${t.steps.map(s => `<li>${escapeHTML(s)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      ${t.defense && t.defense.length ? `
        <div class="defense-list">
          <h4>🛡️ 防禦指令</h4>
          <ul style="list-style:none; padding:0; margin:0;">
            ${t.defense.map(x => `<li>${escapeHTML(x)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      ${t.critical && t.critical.length ? `
        <div class="critical-alert">
          <button class="critical-toggle" data-toggle-check="${critKey}">
            <span>🚨 重要警告 · ${t.critical.length} 條${critOpen ? '' : '（點擊展開）'}</span>
            <span>${critOpen ? '▲' : '▼'}</span>
          </button>
          ${critOpen ? `
            <div class="critical-content">
              <ul style="list-style:none; padding:0; margin:0;">
                ${t.critical.map(c => `<li>${escapeHTML(c)}</li>`).join("")}
              </ul>
            </div>
          ` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

function renderStpBadge(stp) {
  if (!stp || stp === "none") return "";
  if (stp === "free") return '<span class="badge badge-stp-free">STP 免費 ✓</span>';
  if (stp === "half") return '<span class="badge badge-stp-half">STP 半價</span>';
  if (stp === "paid") return '<span class="badge badge-stp-paid">自費門票</span>';
  return "";
}

/**
 * V21.3d：全站資料狀態 Badge helper（與使用者完成狀態 workflow 完全分離）
 * type:
 *   confirmed → 🟢 已確認/已預訂（安全綠）
 *   current   → 🔵 現行官方資料（少女峰藍）
 *   pending   → 🟡 2027 待確認（金黃）
 *   estimate  → ⚪ 預算/估算（中性灰）
 */
function renderStatusBadge(type, label) {
  const styles = {
    confirmed: { bg:"#DCFCE7", fg:"#166534", border:"#86EFAC", em:"🟢" },
    current:   { bg:"#DBEAFE", fg:"#1E40AF", border:"#93C5FD", em:"🔵" },
    pending:   { bg:"#FEF3C7", fg:"#92400E", border:"#FDE68A", em:"🟡" },
    estimate:  { bg:"#F1F5F9", fg:"#334155", border:"#CBD5E1", em:"⚪" }
  };
  const s = styles[type] || styles.estimate;
  return `<span class="badge" style="display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:700; background:${s.bg}; color:${s.fg}; border:1px solid ${s.border}; white-space:nowrap;">${s.em} ${escapeHTML(label)}</span>`;
}

// ──────────── 訂位清單 / 待辦 ────────────
function renderBookings() {
  const groups = {};
  BOOKINGS.forEach(b => {
    const key = b.when.split(" ")[0];
    if (!groups[b.when]) groups[b.when] = [];
    groups[b.when].push(b);
  });

  const completed = BOOKINGS.filter(b => isChecked(`book_${b.task}`)).length;
  const total = BOOKINGS.length;
  const percent = Math.round(completed / total * 100);

  // 篩選狀態（V21.7d：safe storage + enum validation，例外/無效 → all）
  const currentFilter = loadBookingsFilter();
  const filters = [
    { key:"all", label:`全部 (${total})` },
    { key:"open", label:`未完成 (${total - completed})` },
    { key:"must", label:"必做" },
    { key:"important", label:"重要" },
    { key:"suggest", label:"建議" },
    { key:"track", label:"追蹤" }
  ];

  const matches = (b) => {
    const chk = isChecked(`book_${b.task}`);
    if (currentFilter === "all") return true;
    if (currentFilter === "open") return !chk;
    if (currentFilter === "must") return b.priority && b.priority.includes("必做");
    if (currentFilter === "important") return b.priority && b.priority.includes("重要");
    if (currentFilter === "suggest") return b.priority && b.priority.includes("建議");
    if (currentFilter === "track") return b.priority && b.priority.includes("追蹤");
    return true;
  };

  const urlPattern = /(https?:\/\/[^\s，。]+|(?:www\.)[a-z0-9.-]+\.[a-z]{2,}|[a-z0-9-]+\.(?:com|ch|org|net|app)[a-z0-9\/.-]*)/gi;
  const linkifyHow = (str) => {
    return escapeHTML(str).replace(urlPattern, (match) => {
      const url = match.startsWith("http") ? match : `https://${match}`;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--jungfrau-blue); text-decoration:underline; font-weight:600;" data-ext-link>${match} ↗</a>`;
    });
  };

  const html = Object.entries(groups).map(([when, items]) => {
    const visible = items.filter(matches);
    if (!visible.length) return "";
    return `
    <div class="checklist-group">
      <div class="checklist-header"><span>${escapeHTML(when)}</span></div>
      ${visible.map(b => {
        const key = `book_${b.task}`;
        const chk = isChecked(key);
        return `
          <div class="checklist-item ${chk ? 'checked' : ''}" data-toggle-check="${key}">
            <div class="cb">${chk ? '✓' : ''}</div>
            <div class="text">
              <div><strong>${escapeHTML(b.task)}</strong> ${b.priority ? `<span style="font-size:11px; color:var(--text-muted);">${escapeHTML(b.priority)}</span>` : ""}</div>
              <div class="meta">${linkifyHow(b.how)}</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
  }).join("");

  return `
    <div class="page-title">✅ 待辦 / 訂位</div>
    <div class="page-sub">依時機分階段，勾選已完成；點連結直接開官方頁</div>
    <div style="background:var(--surface); padding:14px; border-radius:14px; margin-bottom:14px; border:1px solid var(--border);">
      <div style="font-size:13px; margin-bottom:6px;">完成度 <strong>${completed} / ${total}</strong> · ${percent}%</div>
      <div class="progress-strip"><div style="width:${percent}%;"></div></div>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
      ${filters.map(f => `
        <button data-set-filter="${f.key}" style="padding:6px 12px; font-family:inherit; font-size:12px; font-weight:600; border-radius:999px; cursor:pointer; border: 1px solid ${currentFilter === f.key ? 'var(--alpine-green)' : 'var(--border)'}; background: ${currentFilter === f.key ? 'var(--alpine-green)' : 'var(--surface)'}; color: ${currentFilter === f.key ? '#fff' : 'var(--text)'};">
          ${escapeHTML(f.label)}
        </button>
      `).join("")}
    </div>
    ${html || '<div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13px;">沒有符合此篩選條件的項目</div>'}
  `;
}

// ──────────── 採買清單 ────────────
function renderShopping() {
  const html = SHOPPING.map((sh, sidx) => {
    return `
      <div class="checklist-group">
        <div class="checklist-header">
          <span>🛒 ${sh.when}</span>
        </div>
        <div style="padding:10px 14px; font-size:12px; color:var(--text-muted); background:var(--slate-50);">
          📍 ${sh.place}${sh.budget ? ` · 💰 ${sh.budget}` : ''}
        </div>
        ${sh.warning ? `
          <div class="checklist-item warning" style="cursor:default;">
            <div class="cb" style="border-color:transparent; background:transparent;">⚠️</div>
            <div class="text">${escapeHTML(sh.warning)}</div>
          </div>
        ` : ''}
        ${sh.items.map((item, iidx) => {
          const key = `shop_${sidx}_${iidx}`;
          const chk = isChecked(key);
          const isSpecial = item.startsWith("🚨");
          return `
            <div class="checklist-item ${chk ? 'checked' : ''} ${isSpecial ? 'warning' : ''}" data-toggle-check="${key}">
              <div class="cb">${chk ? '✓' : ''}</div>
              <div class="text">${escapeHTML(item)}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }).join("");

  return `
    <div class="page-title">🛒 採買清單</div>
    <div class="page-sub">Coop / Migros 分階段採買，勾選已買到</div>
    ${html}
  `;
}

// ──────────── 打包清單 ────────────
function renderPacking() {
  const total = PACKING.reduce((n, g) => n + g.items.length, 0);
  const done = PACKING.reduce((n, g, gidx) => n + g.items.filter((_, iidx) => isChecked(`pack_${gidx}_${iidx}`)).length, 0);
  const percent = Math.round(done / total * 100);

  const laundryWarn = `
    <div class="card" style="background:var(--warn-orange-bg); border-color:var(--warn-orange-border); border-left:4px solid var(--warn-orange);">
      <div style="font-weight:800; font-size:15px; color:var(--warn-orange); margin-bottom:8px;">⚠️ 洗衣膠囊包裝提醒</div>
      <ul style="padding-left:18px; font-size:13px; color:var(--text); line-height:1.7;">
        <li>建議放入託運行李、避免放隨身登機包（依當年度隨身液體/凝膠限制與各機場安檢實務為準）</li>
        <li>建議裝入「硬殼保鮮盒」中再放入託運行李</li>
        <li>高空可能因壓力/擠壓破裂，滲入洗劑毀損整箱衣物</li>
        <li>✅ 建議：方形樂扣保鮮盒，內墊塑膠袋雙層防漏</li>
      </ul>
    </div>
  `;

  const html = PACKING.map((g, gidx) => `
    <div class="checklist-group">
      <div class="checklist-header">
        <span>${g.cat}</span>
      </div>
      <div style="padding:10px 14px; font-size:12px; color:var(--text-muted); background:var(--slate-50);">
        ${g.where}
      </div>
      ${g.items.map((item, iidx) => {
        const key = `pack_${gidx}_${iidx}`;
        const chk = isChecked(key);
        const isCrit = item.startsWith("🚨");
        return `
          <div class="checklist-item ${chk ? 'checked' : ''} ${isCrit ? 'warning' : ''}" data-toggle-check="${key}">
            <div class="cb">${chk ? '✓' : ''}</div>
            <div class="text">${escapeHTML(item)}</div>
          </div>
        `;
      }).join("")}
    </div>
  `).join("");

  return `
    <div class="page-title">🧳 打包清單</div>
    <div class="page-sub">5 件大行李 + 4 個過夜包 + 1 推車</div>
    <div style="background:var(--surface); padding:14px; border-radius:14px; margin-bottom:14px; border:1px solid var(--border);">
      <div style="font-size:13px; margin-bottom:6px;">✅ 完成度 <strong>${done} / ${total}</strong> · ${percent}%</div>
      <div class="progress-strip"><div style="width:${percent}%;"></div></div>
    </div>
    ${laundryWarn}
    ${html}
  `;
}

// ──────────── 景點導覽 ────────────
function renderSights() {
  const regions = {};
  SIGHTS.forEach(s => {
    if (!regions[s.region]) regions[s.region] = [];
    regions[s.region].push(s);
  });

  const html = Object.entries(regions).map(([region, list]) => `
    <div class="section-title">${region}</div>
    ${list.map(s => `
      <div class="sight-card">
        <div class="region">${escapeHTML(s.city)}</div>
        <div class="name">${escapeHTML(s.name)}</div>
        <div class="desc">${escapeHTML(s.note)}</div>
        <div class="row">
          <span class="tag">🎫 ${escapeHTML(s.stp)}</span>
          <span class="tag">👶 ${escapeHTML(s.family)}</span>
          <button class="map-btn" data-map="${encodeURIComponent(s.name + ' Switzerland')}">📍 地圖</button>
        </div>
      </div>
    `).join("")}
  `).join("");

  return `
    <div class="page-title">📍 景點導覽</div>
    <div class="page-sub">${SIGHTS.length} 個景點 · 含 STP 折扣與推車友善度</div>
    ${html}
  `;
}

// ──────────── 緊急聯絡 ────────────
function renderEmergency() {
  // V21.5：112 提升至第一位（唯一可用官方 foreign SIM / 預付卡無餘額也可撥的號碼）
  // 移除「免國際漫遊也可打」統一保證（其他號碼實際撥號需視 SIM/餘額情況）
  const priorityCalls = [
    { icon:"📞", label:"112 通用緊急", tel:"112", desc:"歐洲通用緊急號；可透過任何行動電話撥打，包含 foreign SIM 或預付卡無餘額（依 ch.ch 官方）" },
    { icon:"🚑", label:"144 醫療", tel:"144", desc:"救護車 / 醫療急救" },
    { icon:"👮", label:"117 警察", tel:"117", desc:"報案 / 治安事件" },
    { icon:"🚁", label:"REGA 1414", tel:"1414", desc:"高山救援直升機" },
    { icon:"🆘", label:"駐瑞士代表處急難手機", tel:CONSULATE_CONTACT.emergency, desc:"重大急難救助（車禍/搶劫/生命安危）" }
  ];
  const priorityHTML = `
    <div class="card" style="background:linear-gradient(135deg, #FEF2F2, #FEE2E2); border:2px solid var(--swiss-red); border-radius:14px; padding:14px; margin-bottom:16px;">
      <div style="font-weight:800; font-size:14px; color:var(--swiss-red); margin-bottom:10px; display:flex; align-items:center; gap:6px;">
        🚨 現場急難 · 一鍵撥號
      </div>
      ${priorityCalls.map(p => `
        <a href="tel:${p.tel.replace(/[^+\d]/g,'')}" style="display:flex; align-items:center; gap:10px; padding:12px; background:white; border-radius:10px; margin-bottom:8px; text-decoration:none; color:var(--text); border:1px solid rgba(220,0,24,0.15);">
          <span style="font-size:22px;">${p.icon}</span>
          <div style="flex:1;">
            <div style="font-weight:800; font-size:14px; color:var(--swiss-red);">${escapeHTML(p.label)}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${escapeHTML(p.desc)}</div>
          </div>
          <span style="font-family:ui-monospace,monospace; font-weight:800; color:var(--swiss-red); font-size:15px;">${escapeHTML(p.tel)}</span>
        </a>
      `).join("")}
    </div>
  `;

  const html = EMERGENCY.map(g => `
    <div class="contact-card">
      <div class="cat">${escapeHTML(g.cat)}</div>
      ${g.items.map(it => `
        <div class="contact-row">
          <div class="info">
            <div class="label">${escapeHTML(it.label)}</div>
            ${it.note ? `<div class="note">${escapeHTML(it.note)}</div>` : ""}
          </div>
          ${it.tel ? `<a class="tel-btn" href="tel:${it.tel.replace(/[^+\d]/g, '')}">📞 撥打</a>` : ""}
        </div>
      `).join("")}
    </div>
  `).join("");

  return `
    <div class="page-title">🆘 緊急聯絡</div>
    <div class="page-sub">現場急難請優先使用下列號碼；實際撥號需視手機是否有可用行動語音網路而定</div>
    ${priorityHTML}
    ${html}

    <div class="card" style="background:var(--gold-bg); border-color:var(--gold-border);">
      <div style="font-weight:700; margin-bottom:6px;">💡 出發前提醒</div>
      <ul style="padding-left:18px; font-size:13px; line-height:1.7;">
        <li>將保險公司 24h 急難專線填入本頁面前，出發前先電話確認</li>
        <li>信用卡出發前致電客服通知 9/13-9/25 將在杜拜、瑞士消費</li>
        <li>台灣駐瑞士代表處：Kirchenfeldstrasse 14, 3005 Bern</li>
      </ul>
    </div>
  `;
}

// ──────────── 住宿頁 ────────────
function renderHotels() {
  const arr = [HOTELS.luzern, HOTELS.grindelwald];
  return `
    <div class="page-title">🏨 住宿資訊</div>
    <div class="page-sub">兩大基地 · 琉森 4 晚 + 格林德瓦 6 晚</div>
    ${arr.map(h => {
      // 收集睡眠方案（可能有 A/B/C 任一數量）
      const sleepPlans = [
        h.sleepPlanA ? { key:"A", text:h.sleepPlanA } : null,
        h.sleepPlanB ? { key:"B", text:h.sleepPlanB } : null,
        h.sleepPlanC ? { key:"C", text:h.sleepPlanC } : null,
      ].filter(Boolean);

      const featuresHTML = h.features && h.features.length ? `
        <div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:6px;">
          ${h.features.map(f => `
            <span style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; background:var(--glacier); color:var(--alpine-green-dark); font-size:12px; font-weight:600;">
              ✓ ${escapeHTML(f)}
            </span>
          `).join("")}
        </div>
      ` : "";

      const roomHTML = (h.roomType || h.size || h.beds) ? `
        <div style="margin-top:12px; padding:12px; background:var(--slate-50); border-radius:10px; font-size:13px; line-height:1.75; border:1px solid var(--border);">
          ${h.roomType ? `<div style="font-weight:700; color:var(--text); margin-bottom:6px;">🏘️ ${escapeHTML(h.roomType)}</div>` : ""}
          ${h.size ? `<div style="color:var(--text-muted);">📐 ${escapeHTML(h.size)}</div>` : ""}
          ${h.beds ? `<div style="color:var(--text-muted); font-size:12px; margin-top:4px;">🛏️ ${escapeHTML(h.beds)}</div>` : ""}
        </div>
      ` : "";

      const sleepHTML = sleepPlans.length ? `
        <div style="margin-top:12px; padding:14px; background: linear-gradient(135deg, #FEF3C7, #FFFBEB); border:1px solid var(--gold-border); border-radius:12px;">
          <div style="font-weight:700; color:var(--gold); margin-bottom:8px; font-size:13px; display:flex; align-items:center; gap:6px;">
            🛌 睡眠配置方案
          </div>
          ${sleepPlans.map(p => `
            <div style="margin-bottom:8px; font-size:13px; line-height:1.65; color:var(--text);">
              <strong style="color:var(--gold); display:inline-block; min-width:22px;">${p.key}．</strong>${escapeHTML(p.text)}
            </div>
          `).join("")}
          ${h.sleepNote ? `
            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--gold-border); font-size:12px; color:var(--alert-red); font-weight:600; line-height:1.6;">
              ⚠️ ${escapeHTML(h.sleepNote)}
            </div>
          ` : ""}
        </div>
      ` : "";

      return `
      <div class="card">
        ${h.changelog ? `
          <div style="display:inline-block; padding:4px 10px; background:linear-gradient(135deg, #EA580C, #DC2626); color:white; border-radius:999px; font-size:11px; font-weight:700; margin-bottom:8px;">
            🔀 ${escapeHTML(h.changelog)}
          </div>
        ` : ''}
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <div style="flex:1;">
            <div style="font-size:11px; color:var(--jungfrau-blue); font-weight:600;">${escapeHTML(h.city)}</div>
            <div style="font-size:17px; font-weight:700; margin:4px 0;">${escapeHTML(h.name)}</div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:6px;">
              ${renderStatusBadge("confirmed", "已預訂")}
              <span style="font-size:12px; color:var(--text-muted);">${escapeHTML(h.status)}</span>
            </div>
          </div>
        </div>
        <div style="margin-top:12px; font-size:13px; line-height:1.7;">
          <div>📅 ${h.checkIn} → ${h.checkOut} · ${h.nights} 晚</div>
          <div>📍 ${escapeHTML(h.address)}</div>
          ${h.office ? `<div>🏢 ${escapeHTML(h.office)}</div>` : ''}
          ${h.phone ? `<div>📞 <a href="tel:${h.phone.replace(/[^+\d]/g,'')}" style="color:var(--jungfrau-blue);">${escapeHTML(h.phone)}</a></div>` : ''}
          ${h.priceTWD ? `<div>💰 約 NT$ ${h.priceTWD.toLocaleString()}</div>` : ''}
          ${h.priceCHF ? `<div>💰 ${h.priceIsReferenceQuote ? '約 ' : ''}CHF ${h.priceCHF.toLocaleString()}</div>` : ''}
          ${h.priceNote ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">ℹ️ ${escapeHTML(h.priceNote)}</div>` : ''}
          ${h.payment ? `<div>💳 付款：待付 CHF ${Number(h.payment.dueCHF).toLocaleString()}｜已付 CHF ${Number(h.payment.paidCHF).toLocaleString()}｜付款期限：${escapeHTML(String(h.payment.deadline))}</div>` : ''}
          ${h.cityTax ? `<div>🏛️ 城市稅：${escapeHTML(h.cityTax.rate)} × ${escapeHTML(String(h.cityTax.persons))} 人 × ${escapeHTML(String(h.cityTax.nights))} 晚 = ${escapeHTML(h.cityTax.total)}（${escapeHTML(h.cityTax.note)}）</div>` : ''}
        </div>
        ${roomHTML}
        ${featuresHTML}
        ${sleepHTML}
        ${h.houseRules && h.houseRules.length ? `
          <div style="margin-top:12px; padding:12px; background:#EFF6FF; border:1px solid #93C5FD; border-radius:10px;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <div style="font-weight:800; font-size:13px; color:var(--jungfrau-blue);">🔑 入住條件（訂房平台現行資訊）</div>
              ${renderStatusBadge("current", "訂房平台現行資訊")}
            </div>
            <div style="font-size:12px; color:var(--text); line-height:1.75;">
              ${h.houseRules.map(r => `<div>• ${escapeHTML(r)}</div>`).join("")}
            </div>
          </div>
        ` : ""}
        ${h.pendingItems && h.pendingItems.length ? `
          <div style="margin-top:10px; padding:12px; background:var(--gold-bg); border:1px solid var(--gold-border); border-radius:10px;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <div style="font-weight:800; font-size:13px; color:var(--gold);">🟡 住宿待確認事項</div>
              ${renderStatusBadge("pending", "出發前確認")}
            </div>
            <div style="font-size:12px; color:var(--text); line-height:1.75;">
              ${h.pendingItems.map(r => `<div>• ${escapeHTML(r)}</div>`).join("")}
            </div>
          </div>
        ` : ""}
        <div style="margin-top:10px; padding:10px; background:var(--slate-100); border-radius:8px; font-size:12px; color:var(--text-muted);">
          ${escapeHTML(h.notes)}
        </div>
        <div style="margin-top:12px;">
          <button class="map-btn" data-map="${encodeURIComponent(h.mapQuery)}" style="padding:10px 16px; font-size:13px;">📍 Google Maps 導航</button>
        </div>
      </div>
    `;
    }).join("")}
  `;
}

// ──────────── 機票頁 ────────────
function renderFlights() {
  const render1 = (f, title) => `
    <div class="card">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <span style="font-size:12px; color:var(--jungfrau-blue); font-weight:700;">${title}</span>
        ${renderStatusBadge("current", "現行參考")}
        ${renderStatusBadge("pending", "2027 訂票時實際為準")}
      </div>
      <div style="font-size:16px; font-weight:700; margin:4px 0;">${escapeHTML(f.airline)}</div>
      <div style="font-size:13px; color:var(--text-muted);">${escapeHTML(f.flightNo)}</div>
      <div style="margin-top:12px; font-size:14px; line-height:1.8;">
        <div>🛫 <strong>出發</strong>：${escapeHTML(f.depart)}</div>
        <div>✈️ <strong>轉機</strong>：${escapeHTML(f.stopover)}</div>
        <div>🛬 <strong>抵達</strong>：${escapeHTML(f.arrive)}</div>
      </div>
    </div>
  `;

  // Emirates 完整規則 card
  const rulesHTML = (typeof EMIRATES_RULES !== "undefined") ? `
    <div class="card" style="background: linear-gradient(135deg, #E9F2FF, #F1F5F9); border: 1px solid var(--jungfrau-blue); border-left: 4px solid var(--jungfrau-blue);">
      <div style="font-weight:800; font-size:15px; color:var(--jungfrau-blue); margin-bottom:10px;">📋 Emirates 完整規則</div>

      <div style="margin-top:12px; padding:10px; background:white; border-radius:8px;">
        <div style="font-weight:700; font-size:13px; margin-bottom:6px;">🧳 托運額度：Weight Concept 總重量制</div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">${escapeHTML(EMIRATES_RULES.baggage.concept)}</div>
        <ul style="padding-left:18px; font-size:12px; line-height:1.7;">
          ${EMIRATES_RULES.baggage.tiers.map(t => `<li><strong>${escapeHTML(t.fare)}</strong>：${escapeHTML(t.weight)}</li>`).join("")}
        </ul>
        <div style="font-size:11px; color:var(--alert-red); margin-top:6px;">${escapeHTML(EMIRATES_RULES.baggage.warning)}</div>
      </div>

      <div style="margin-top:10px; padding:10px; background:white; border-radius:8px;">
        <div style="font-weight:700; font-size:13px; margin-bottom:6px;">🍽️ 兒童餐代碼：${escapeHTML(EMIRATES_RULES.childMeal.code)}</div>
        <div style="font-size:12px; color:var(--text-muted);">${escapeHTML(EMIRATES_RULES.childMeal.note)}</div>
        <div style="font-size:11px; color:var(--alert-red); margin-top:4px;">${escapeHTML(EMIRATES_RULES.childMeal.warning)}</div>
      </div>

      <div style="margin-top:10px; padding:10px; background:white; border-radius:8px;">
        <div style="font-weight:700; font-size:13px; margin-bottom:6px;">💺 座位配置</div>
        <div style="font-size:12px; color:var(--text-muted);">${escapeHTML(EMIRATES_RULES.seatingPolicy.note)}</div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${escapeHTML(EMIRATES_RULES.seatingPolicy.request)}</div>
      </div>

      <div style="margin-top:10px; padding:10px; background:white; border-radius:8px;">
        <div style="font-weight:700; font-size:13px; margin-bottom:6px;">🏨 Dubai Connect</div>
        <div style="font-size:12px; color:var(--text-muted);">${escapeHTML(EMIRATES_RULES.dubaiConnect.hours)}</div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${escapeHTML(EMIRATES_RULES.dubaiConnect.perks)}</div>
        <div style="font-size:11px; color:var(--alert-red); margin-top:4px;">${escapeHTML(EMIRATES_RULES.dubaiConnect.warning)}</div>
      </div>

      <div style="margin-top:10px; padding:10px; background: linear-gradient(135deg, #FFF7ED, #FEF2F2); border-radius:8px; border: 1px solid var(--warn-orange-border);">
        <div style="font-weight:800; font-size:13px; color:var(--warn-orange); margin-bottom:6px;">⏰ Emirates 時間規則（現行參考）</div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px; line-height:1.5;">${escapeHTML(EMIRATES_RULES.timeRules.baseFlight)}</div>
        ${EMIRATES_RULES.timeRules.points.map(p => `
          <div style="display:flex; gap:8px; padding:6px 0; border-top:1px solid rgba(0,0,0,0.06); font-size:12px;">
            <div style="flex:1;">
              <div style="font-weight:600; color:var(--text);">${escapeHTML(p.label)}</div>
              ${p.note ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${escapeHTML(p.note)}</div>` : ''}
            </div>
            <div style="font-family:ui-monospace,monospace; font-weight:700; color:var(--warn-orange);">${escapeHTML(p.value)}</div>
          </div>
        `).join("")}
        <div style="font-size:11px; color:var(--text-muted); margin-top:8px; padding-top:8px; border-top:1px solid rgba(0,0,0,0.06); line-height:1.5;">${escapeHTML(EMIRATES_RULES.timeRules.note)}</div>
      </div>
    </div>
  ` : "";

  return `
    <div class="page-title">✈️ 機票資訊</div>
    <div class="page-sub">Emirates 阿聯酋 · A380 · 經杜拜轉機</div>
    ${render1(FLIGHTS.outbound, "去程")}
    ${render1(FLIGHTS.return, "回程")}
    ${rulesHTML}
  `;
}

// ──────────── 工具集頁 ────────────
function renderTools() {
  const groups = [
    {
      title: "A. 現場工具（旅程中每天用）",
      desc: "行李節點、天氣調整、緊急聯絡快查",
      tiles: [
        { nav:"luggage",   em:"🛅", label:"行李追蹤",  sub:"SBB 5 件 × 4 節點" },
        { nav:"weather",   em:"🌦️", label:"天氣決策",  sub:"互換與撤退規則" },
        { nav:"emergency", em:"🆘", label:"緊急聯絡",  sub:"急難號碼 + 使館 + 醫療" }
      ]
    },
    {
      title: "B. 行前管理（出發前逐月確認）",
      desc: "待確認、打包、採買、訂位/待辦",
      tiles: [
        { nav:"pending",  em:"🟡", label:"2027 待確認", sub:"10 項待鎖定" },
        { nav:"packing",  em:"🧳", label:"打包清單",   sub:`${PACKING.length} 分類` },
        { nav:"shopping", em:"🛒", label:"採買清單",   sub:`${SHOPPING.length} 階段` },
        { nav:"bookings", em:"✅", label:"待辦 / 訂位", sub:`${BOOKINGS.length} 項任務` }
      ]
    },
    {
      title: "C. 資訊查詢（隨時查閱）",
      desc: "住宿、航班、景點導覽",
      tiles: [
        { nav:"hotels",  em:"🏨", label:"住宿",       sub:"Luzern · Grindelwald" },
        { nav:"flights", em:"✈️", label:"航班 + Emirates 規則", sub:`${FLIGHT_CODES.outbound} / ${FLIGHT_CODES.return}` },
        { nav:"sights",  em:"📍", label:"景點導覽",   sub:`${SIGHTS.length} 個景點` }
      ]
    }
  ];

  return `
    <div class="page-title">🧰 工具</div>
    <div class="page-sub">依使用時機分三組：現場、行前、資訊查詢</div>
    ${groups.map(g => `
      <div style="margin-bottom:20px;">
        <div class="section-title" style="margin-bottom:4px;">${escapeHTML(g.title)}</div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">${escapeHTML(g.desc)}</div>
        <div class="quick-grid">
          ${g.tiles.map(t => `
            <div class="quick-tile" data-nav="${t.nav}">
              <span class="em">${t.em}</span>
              <div class="label">${escapeHTML(t.label)}</div>
              <div class="sub">${escapeHTML(t.sub)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("")}
  `;
}

// ──────────── 2027 待確認 ────────────
function renderPending() {
  if (typeof PENDING_2027 === "undefined") return `<div class="page-title">🟡 2027 待確認</div><div>資料未載入</div>`;

  // 狀態統計（V21.7d：safe storage + enum validation，例外/無效 → unconfirmed）
  const stateOf = (id) => getPendingState(id);
  const stats = { unconfirmed:0, confirmed:0, done:0 };
  PENDING_2027.forEach(p => { stats[stateOf(p.id)]++; });

  const groups = {};
  PENDING_2027.forEach(p => {
    if (!groups[p.cat]) groups[p.cat] = [];
    groups[p.cat].push(p);
  });

  const stateChip = (s) => {
    if (s === "done") return '<span class="badge" style="background:#DCFCE7; color:#166534; border:1px solid #86EFAC;">🟢 已完成</span>';
    if (s === "confirmed") return '<span class="badge" style="background:#DBEAFE; color:#1E40AF; border:1px solid #93C5FD;">🔵 已確認</span>';
    return '<span class="badge" style="background:#FEF3C7; color:#92400E; border:1px solid #FDE68A;">🟡 未確認</span>';
  };

  return `
    <div class="page-title">🟡 2027 待確認</div>
    <div class="page-sub">尚未鎖定的 ${PENDING_2027.length} 項資料，按建議時間追蹤</div>

    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px;">
      <div style="background:#FEF3C7; padding:10px; border-radius:10px; text-align:center; border:1px solid #FDE68A;">
        <div style="font-size:20px; font-weight:800; color:#92400E;">${stats.unconfirmed}</div>
        <div style="font-size:11px; color:#92400E;">🟡 未確認</div>
      </div>
      <div style="background:#DBEAFE; padding:10px; border-radius:10px; text-align:center; border:1px solid #93C5FD;">
        <div style="font-size:20px; font-weight:800; color:#1E40AF;">${stats.confirmed}</div>
        <div style="font-size:11px; color:#1E40AF;">🔵 已確認</div>
      </div>
      <div style="background:#DCFCE7; padding:10px; border-radius:10px; text-align:center; border:1px solid #86EFAC;">
        <div style="font-size:20px; font-weight:800; color:#166534;">${stats.done}</div>
        <div style="font-size:11px; color:#166534;">🟢 已完成</div>
      </div>
    </div>

    ${Object.entries(groups).map(([cat, items]) => `
      <div class="section-title">${escapeHTML(cat)}</div>
      ${items.map(p => {
        const s = stateOf(p.id);
        const linkURL = p.link && EXT_LINKS[p.link] ? EXT_LINKS[p.link] : "";
        // V21.3e：資料狀態 badge（與使用者 workflow 分離）
        const dataStatusBadges = [renderStatusBadge("pending", "2027 待確認")];
        if (p.id === "stp_2027_price") dataStatusBadges.push(renderStatusBadge("estimate", "CHF 515 預算估算"));
        if (p.id === "sbb_luggage") dataStatusBadges.unshift(renderStatusBadge("current", "現行官方資料"));
        if (p.id === "brb_2027") dataStatusBadges.unshift(renderStatusBadge("current", "2026 現行官方資料"));
        return `
          <div class="card" style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:8px;">
              <div style="flex:1; font-weight:700; font-size:14px;">${escapeHTML(p.item)}</div>
              ${stateChip(s)}
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
              ${dataStatusBadges.join("")}
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">🕒 建議確認：${escapeHTML(p.suggestBy)}</div>
            <div style="font-size:12px; color:var(--text); line-height:1.6; padding:8px 10px; background:var(--slate-50); border-radius:8px; margin-bottom:10px;">${escapeHTML(p.note)}</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              <button data-pending-state="${p.id}|unconfirmed" style="padding:6px 10px; font-size:11px; font-weight:600; border-radius:6px; cursor:pointer; border:1px solid ${s === 'unconfirmed' ? '#92400E' : 'var(--border)'}; background:${s === 'unconfirmed' ? '#FEF3C7' : 'var(--surface)'}; color:${s === 'unconfirmed' ? '#92400E' : 'var(--text-muted)'}; font-family:inherit;">🟡 未確認</button>
              <button data-pending-state="${p.id}|confirmed" style="padding:6px 10px; font-size:11px; font-weight:600; border-radius:6px; cursor:pointer; border:1px solid ${s === 'confirmed' ? '#1E40AF' : 'var(--border)'}; background:${s === 'confirmed' ? '#DBEAFE' : 'var(--surface)'}; color:${s === 'confirmed' ? '#1E40AF' : 'var(--text-muted)'}; font-family:inherit;">🔵 已確認</button>
              <button data-pending-state="${p.id}|done" style="padding:6px 10px; font-size:11px; font-weight:600; border-radius:6px; cursor:pointer; border:1px solid ${s === 'done' ? '#166534' : 'var(--border)'}; background:${s === 'done' ? '#DCFCE7' : 'var(--surface)'}; color:${s === 'done' ? '#166534' : 'var(--text-muted)'}; font-family:inherit;">🟢 已完成</button>
              ${linkURL ? `<a href="${linkURL}" target="_blank" rel="noopener noreferrer" data-ext-link style="padding:6px 10px; font-size:11px; font-weight:600; border-radius:6px; background:var(--jungfrau-blue); color:#fff; text-decoration:none; margin-left:auto;">🔗 官方連結 ↗</a>` : ""}
            </div>
          </div>
        `;
      }).join("")}
    `).join("")}
  `;
}

// ──────────── 天氣決策中心 ────────────
function renderWeather() {
  if (typeof WEATHER_DECISION === "undefined") return `<div class="page-title">🌦️ 天氣決策</div><div>資料未載入</div>`;

  return `
    <div class="page-title">🌦️ 天氣 / 行程調整</div>
    <div class="page-sub">4 項核心原則 + 官方 Webcam / 氣象</div>

    <div class="card" style="background:linear-gradient(135deg,#F0F9FF,#F1F5F9); border:1px solid var(--jungfrau-blue);">
      <div style="font-weight:800; color:var(--jungfrau-blue); margin-bottom:10px;">📖 4 項核心原則</div>
      ${WEATHER_DECISION.principles.map(p => `
        <div style="padding:12px; background:white; border-radius:10px; margin-bottom:8px;">
          <div style="font-size:14px; font-weight:700; margin-bottom:6px;">${p.icon} ${escapeHTML(p.label)}</div>
          <div style="font-size:12px; color:var(--text-muted); line-height:1.65;">${escapeHTML(p.detail)}</div>
        </div>
      `).join("")}
    </div>

    <div class="section-title">🔗 官方連結（不即時抓 API）</div>
    ${WEATHER_DECISION.externalLinks.map(l => {
      const url = EXT_LINKS[l.url];
      if (!url) return "";
      return `
        <a href="${url}" target="_blank" rel="noopener noreferrer" data-ext-link class="card" style="display:block; text-decoration:none; color:inherit; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:24px;">🌐</span>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:14px;">${escapeHTML(l.label)}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${escapeHTML(l.note)}</div>
            </div>
            <span style="color:var(--jungfrau-blue); font-size:14px; font-weight:600;">開啟 ↗</span>
          </div>
        </a>
      `;
    }).join("")}
  `;
}

// ──────────── SBB 行李追蹤 ────────────
function renderLuggage() {
  if (typeof LUGGAGE_MILESTONES === "undefined") return `<div class="page-title">🛅 行李追蹤</div><div>資料未載入</div>`;

  const BAGS = [1,2,3,4,5];
  const total = LUGGAGE_MILESTONES.length * BAGS.length;
  const doneCount = LUGGAGE_MILESTONES.reduce((n, m) => n + BAGS.filter(b => isChecked(`luggage_${m.id}_bag${b}`)).length, 0);
  const percent = Math.round(doneCount / total * 100);

  return `
    <div class="page-title">🛅 SBB 行李追蹤</div>
    <div class="page-sub">5 件大行李 × 4 節點 · 純本機 localStorage</div>

    <div style="background:var(--surface); padding:14px; border-radius:14px; margin-bottom:14px; border:1px solid var(--border);">
      <div style="font-size:13px; margin-bottom:6px;">總進度 <strong>${doneCount} / ${total}</strong> · ${percent}%</div>
      <div class="progress-strip"><div style="width:${percent}%;"></div></div>
    </div>

    <div class="card" style="background:var(--slate-50); border:1px solid var(--border);">
      <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
        <div style="font-weight:800; font-size:14px;">📦 SBB Station-to-Station 現行費率</div>
        ${renderStatusBadge("current", "現行官方資料")}
        ${renderStatusBadge("pending", "2027 出發前再確認")}
      </div>
      <div style="font-size:12px; color:var(--text); line-height:1.7;">
        <div>• CHF 12 / 件（Station-to-Station 現行費率）</div>
        <div style="margin-top:6px;">• ⚠️ Luggage counter 開放時段<strong>依各站公告為準</strong>，SBB 官方要求依所選車站查詢，非全網統一</div>
        <div style="margin-left:12px; margin-top:4px; color:var(--text-muted);">本團涉及：Luzern（Day 3 寄）／Grindelwald（Day 5 領・Day 8 寄）／Zürich Flughafen（Day 11 領）</div>
        <div style="margin-left:12px; color:var(--text-muted);">三站時段需於 2027 出發前分別至 sbb.ch 分站頁確認</div>
      </div>
    </div>

    <div class="card" style="background:var(--gold-bg); border-color:var(--gold-border);">
      <div style="font-size:12px; color:var(--gold); font-weight:700; margin-bottom:6px;">💡 使用說明</div>
      <ul style="padding-left:18px; font-size:12px; line-height:1.7; color:var(--text);">
        <li>每一節點勾選「5 件已寄出／領取」</li>
        <li>可填入寄物編號或收據編號，僅存本機</li>
        <li>下方會顯示「5/5 全部到齊」狀態</li>
      </ul>
    </div>

    ${LUGGAGE_MILESTONES.map(m => {
      const bagsDone = BAGS.filter(b => isChecked(`luggage_${m.id}_bag${b}`)).length;
      const allDone = bagsDone === BAGS.length;
      const receiptKey = `luggage_receipt_${m.id}`;
      const receipt = getLuggageReceipt(receiptKey);   // V21.7d：safe read，例外/missing → ""

      return `
        <div class="card" style="border-left:4px solid ${allDone ? 'var(--safe-green)' : 'var(--slate-300)'};">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:10px;">
            <div>
              <div style="font-weight:800; font-size:15px;">${escapeHTML(m.day)} · ${escapeHTML(m.action)}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">📅 ${escapeHTML(m.date)}</div>
              <div style="font-size:12px; color:var(--text-muted);">📍 ${escapeHTML(m.loc)} → ${escapeHTML(m.target)}</div>
            </div>
            ${allDone
              ? renderStatusBadge("confirmed", `${bagsDone}/5 到齊`)
              : `<span class="badge" style="background:var(--slate-100); color:var(--text-muted);">${bagsDone}/5</span>`
            }
          </div>

          <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:6px; margin-bottom:10px;">
            ${BAGS.map(b => {
              const key = `luggage_${m.id}_bag${b}`;
              const chk = isChecked(key);
              return `
                <button data-toggle-check="${key}" style="padding:12px 6px; border-radius:10px; border:2px solid ${chk ? 'var(--safe-green)' : 'var(--slate-300)'}; background:${chk ? 'var(--safe-green)' : 'var(--surface)'}; color:${chk ? '#fff' : 'var(--text-muted)'}; font-family:inherit; font-weight:800; font-size:12px; cursor:pointer;">
                  <div style="font-size:16px;">${chk ? '✓' : '☐'}</div>
                  <div>Bag ${b}</div>
                </button>
              `;
            }).join("")}
          </div>

          <div style="margin-top:8px;">
            <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">寄物 / 收據編號（純本機儲存）</label>
            <input type="text" data-luggage-receipt="${m.id}" value="${escapeHTML(receipt)}" placeholder="輸入編號..." style="width:100%; padding:8px 10px; font-family:ui-monospace,monospace; font-size:13px; border:1px solid var(--border); border-radius:8px; background:var(--slate-50);" />
          </div>
        </div>
      `;
    }).join("")}
  `;
}

// ──────────── HTML 跳脫 ────────────
function escapeHTML(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ──────────── 事件掛勾 ────────────
function attachHandlers() {
  document.querySelectorAll("[data-nav]").forEach(el => {
    el.addEventListener("click", () => navigate(el.dataset.nav));
  });
  document.querySelectorAll("[data-nav-day]").forEach(el => {
    el.addEventListener("click", () => navigate("day", parseInt(el.dataset.navDay, 10)));
  });
  document.querySelectorAll("[data-back]").forEach(el => {
    el.addEventListener("click", () => {
      if (State.currentPage === "day") navigate("home");
      else navigate("home");
    });
  });
  document.querySelectorAll("[data-backup-toggle]").forEach(el => {
    el.addEventListener("click", () => {
      State.showBackup = !State.showBackup;
      render();
    });
  });
  document.querySelectorAll("[data-toggle-check]").forEach(el => {
    el.addEventListener("click", (e) => {
      // 若點擊的是外部連結，不觸發勾選
      if (e.target.closest("a[data-ext-link]")) return;
      e.stopPropagation();
      const key = el.dataset.toggleCheck;
      toggleCheck(key);
      render();
    });
  });
  // 外部連結明確阻止冒泡
  document.querySelectorAll("a[data-ext-link]").forEach(el => {
    el.addEventListener("click", (e) => { e.stopPropagation(); });
  });
  document.querySelectorAll("[data-map]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const q = el.dataset.map;
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
    });
  });

  // V21.3b：篩選按鈕（V21.7d：safe + enum，setItem 例外/無效值不中斷 handler）
  document.querySelectorAll("[data-set-filter]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      saveBookingsFilter(el.dataset.setFilter);
      render();
    });
  });

  // V21.3b：2027 待確認狀態切換（V21.7d：safe + enum，setItem 例外/無效值不中斷 handler）
  document.querySelectorAll("[data-pending-state]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const [id, state] = el.dataset.pendingState.split("|");
      setPendingState(id, state);
      render();
    });
  });

  // V21.6：Day 方案（A/B）選擇
  document.querySelectorAll("[data-plan-choice]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const [planKey, optionKey] = el.dataset.planChoice.split("|");
      setPlanChoice(planKey, optionKey);
      render();
    });
  });

  // V21.3b：行李寄物編號輸入（V21.7d：safe write，setItem 例外不中斷 input event）
  document.querySelectorAll("[data-luggage-receipt]").forEach(el => {
    el.addEventListener("input", (e) => {
      const id = el.dataset.luggageReceipt;
      setLuggageReceipt(`luggage_receipt_${id}`, el.value);
    });
    el.addEventListener("click", (e) => e.stopPropagation());
  });
}

// ──────────── PWA Service Worker 註冊在 HTML 內嵌 script 完成 ────────────

// ──────────── 啟動 ────────────
parseHash();
render();
