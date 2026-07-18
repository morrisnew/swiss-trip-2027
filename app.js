
/* ═══════════════════════════════════════════════
   瑞士行程 PWA · App Logic
═══════════════════════════════════════════════ */

// 交通圖示映射
const TR_ICONS = {
  plane: "✈️", train: "🚂", ship: "🚢", cablecar: "🚡",
  bus: "🚌", walk: "🚶", home: "🏠", luggage: "🛅",
  info: "ℹ️", car: "🚗"
};

// 全域狀態
const State = {
  currentPage: "home",
  currentDay: null,
  showBackup: false,
  checkedItems: JSON.parse(localStorage.getItem("swiss_checks") || "{}"),
  weatherCache: null
};

function saveChecks() {
  localStorage.setItem("swiss_checks", JSON.stringify(State.checkedItems));
}

function toggleCheck(key) {
  State.checkedItems[key] = !State.checkedItems[key];
  saveChecks();
}

function isChecked(key) {
  return !!State.checkedItems[key];
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

// 解析 HH:MM–HH:MM 字串為 [開始分鐘, 結束分鐘]；失敗回 null
function parseTimeblockRange(str) {
  if (!str) return null;
  const m = str.match(/^(\d{1,2}):(\d{2})[–\-~](\d{1,2}):(\d{2})/);
  if (!m) return null;
  const s = parseInt(m[1],10)*60 + parseInt(m[2],10);
  const e = parseInt(m[3],10)*60 + parseInt(m[4],10);
  return [s, e];
}

// 目前/下一個 timeblock（依 Europe/Zurich 當前時間）
function findCurrentAndNext(tl) {
  const hm = nowZurichHM();
  const nowMin = parseInt(hm.slice(0,2),10)*60 + parseInt(hm.slice(3,5),10);
  let current = null, next = null;
  for (let i = 0; i < tl.length; i++) {
    const range = parseTimeblockRange(tl[i].time);
    if (!range) continue;
    if (nowMin >= range[0] && nowMin < range[1]) {
      current = tl[i];
      // 找下一個可解析
      for (let j = i+1; j < tl.length; j++) {
        if (parseTimeblockRange(tl[j].time)) { next = tl[j]; break; }
      }
      return { current, next };
    }
    if (nowMin < range[0] && !next) next = tl[i];
  }
  return { current, next };
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
        <div class="date">2027 / 09 / 13 (日) 台灣起飛</div>
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
    const cn = findCurrentAndNext(d.tl);
    // 今日 critical 匯總（前 3 條）
    const critList = [];
    d.tl.forEach(t => {
      if (t.critical && t.critical.length) critList.push(...t.critical);
    });
    const critTop3 = critList.slice(0, 3);
    const timeNow = nowZurichHM();

    todayBtn = `
      <div class="today-dashboard" style="background: linear-gradient(135deg, var(--swiss-red), #b30014); color:#fff; padding:16px; border-radius:16px; margin-bottom:14px; box-shadow: 0 4px 16px rgba(220,0,24,0.28);">
        <div style="display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:10px;">
          <div>
            <div style="font-size:11px; opacity:0.9; letter-spacing:0.06em;">📍 現場模式 · Europe/Zurich ${escapeHTML(timeNow)}</div>
            <div style="font-size:22px; font-weight:800; margin-top:2px;">Day ${d.day} · ${escapeHTML(d.theme)}</div>
            <div style="font-size:12px; opacity:0.9; margin-top:2px;">${escapeHTML(d.date)} · ${escapeHTML(d.loc)}</div>
          </div>
        </div>

        ${cn.current ? `
          <div style="background:rgba(255,255,255,0.15); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
            <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">🟢 目前正在</div>
            <div style="font-size:14px; font-weight:700;">${escapeHTML(cn.current.time)} · ${escapeHTML(cn.current.title)}</div>
          </div>
        ` : ""}

        ${cn.next ? `
          <div style="background:rgba(0,0,0,0.15); border-radius:10px; padding:10px 12px; margin-bottom:8px;">
            <div style="font-size:10px; opacity:0.85; letter-spacing:0.08em; margin-bottom:2px;">🔵 下一步</div>
            <div style="font-size:14px; font-weight:700;">${escapeHTML(cn.next.time)} · ${escapeHTML(cn.next.title)}</div>
          </div>
        ` : ""}

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
      <div style="font-weight:800; font-size:14px; color:var(--gold); margin-bottom:8px;">🚂 BRB 班次表</div>
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

  // 篩選狀態（localStorage）
  const filterKey = "bookings_filter";
  const currentFilter = localStorage.getItem(filterKey) || "all";
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
    <div class="card" style="background:var(--alert-red-bg); border-color:var(--alert-red-border); border-left:4px solid var(--alert-red);">
      <div style="font-weight:800; font-size:15px; color:var(--alert-red); margin-bottom:8px;">🚨 洗衣球關鍵安全規則</div>
      <ul style="padding-left:18px; font-size:13px; color:var(--alert-red); line-height:1.7;">
        <li>絕對不可放隨身登機包！會被安檢沒收（液體+凝膠超標）</li>
        <li>必須裝入「硬殼保鮮盒」中再放入託運行李</li>
        <li>高空失壓會擠壓爆裂，將洗劑滲入毀損整箱衣物</li>
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
    <div class="page-sub">點擊 📞 直接撥打（需開通國際漫遊）</div>
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
            <div style="font-size:12px; color:var(--text-muted);">${escapeHTML(h.status)}</div>
          </div>
        </div>
        <div style="margin-top:12px; font-size:13px; line-height:1.7;">
          <div>📅 ${h.checkIn} → ${h.checkOut} · ${h.nights} 晚</div>
          <div>📍 ${escapeHTML(h.address)}</div>
          ${h.office ? `<div>🏢 ${escapeHTML(h.office)}</div>` : ''}
          ${h.phone ? `<div>📞 <a href="tel:${h.phone.replace(/[^+\d]/g,'')}" style="color:var(--jungfrau-blue);">${escapeHTML(h.phone)}</a></div>` : ''}
          ${h.priceTWD ? `<div>💰 約 NT$ ${h.priceTWD.toLocaleString()}</div>` : ''}
          ${h.priceCHF ? `<div>💰 約 CHF ${h.priceCHF.toLocaleString()}</div>` : ''}
        </div>
        ${roomHTML}
        ${featuresHTML}
        ${sleepHTML}
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
      <div style="font-size:12px; color:var(--jungfrau-blue); font-weight:700;">${title}</div>
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
      <div style="font-weight:800; font-size:15px; color:var(--jungfrau-blue); margin-bottom:10px;">📋 Emirates 完整規則（V21.3b）</div>

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
  const tiles = [
    { nav:"luggage",   em:"🛅", label:"行李追蹤",   sub:"SBB 5 件 × 4 節點" },
    { nav:"pending",   em:"🟡", label:"2027 待確認", sub:"10 項待鎖定" },
    { nav:"weather",   em:"🌦️", label:"天氣決策",   sub:"互換與撤退規則" },
    { nav:"hotels",    em:"🏨", label:"住宿",       sub:"Luzern · Grindelwald" },
    { nav:"flights",   em:"✈️", label:"航班 + Emirates 規則", sub:"EK87 / EK88" },
    { nav:"packing",   em:"🧳", label:"打包清單",   sub:`${PACKING.length} 分類` },
    { nav:"shopping",  em:"🛒", label:"採買清單",   sub:`${SHOPPING.length} 階段` },
    { nav:"sights",    em:"📍", label:"景點導覽",   sub:`${SIGHTS.length} 個景點` }
  ];
  return `
    <div class="page-title">🧰 工具</div>
    <div class="page-sub">住宿、航班、行李、天氣、待確認、打包、採買、景點</div>
    <div class="quick-grid">
      ${tiles.map(t => `
        <div class="quick-tile" data-nav="${t.nav}">
          <span class="em">${t.em}</span>
          <div class="label">${escapeHTML(t.label)}</div>
          <div class="sub">${escapeHTML(t.sub)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

// ──────────── 2027 待確認 ────────────
function renderPending() {
  if (typeof PENDING_2027 === "undefined") return `<div class="page-title">🟡 2027 待確認</div><div>資料未載入</div>`;

  // 狀態統計
  const stateOf = (id) => localStorage.getItem(`pending_${id}`) || "unconfirmed";
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
        return `
          <div class="card" style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:8px;">
              <div style="flex:1; font-weight:700; font-size:14px;">${escapeHTML(p.item)}</div>
              ${stateChip(s)}
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
      const receipt = localStorage.getItem(receiptKey) || "";

      return `
        <div class="card" style="border-left:4px solid ${allDone ? 'var(--safe-green)' : 'var(--slate-300)'};">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:10px;">
            <div>
              <div style="font-weight:800; font-size:15px;">${escapeHTML(m.day)} · ${escapeHTML(m.action)}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">📅 ${escapeHTML(m.date)}</div>
              <div style="font-size:12px; color:var(--text-muted);">📍 ${escapeHTML(m.loc)} → ${escapeHTML(m.target)}</div>
            </div>
            <span class="badge" style="background:${allDone ? 'var(--safe-green)' : 'var(--slate-100)'}; color:${allDone ? '#fff' : 'var(--text-muted)'};">
              ${bagsDone}/5 ${allDone ? '✓ 到齊' : ''}
            </span>
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

  // V21.3b：篩選按鈕
  document.querySelectorAll("[data-set-filter]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      localStorage.setItem("bookings_filter", el.dataset.setFilter);
      render();
    });
  });

  // V21.3b：2027 待確認狀態切換
  document.querySelectorAll("[data-pending-state]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const [id, state] = el.dataset.pendingState.split("|");
      localStorage.setItem(`pending_${id}`, state);
      render();
    });
  });

  // V21.3b：行李寄物編號輸入
  document.querySelectorAll("[data-luggage-receipt]").forEach(el => {
    el.addEventListener("input", (e) => {
      const id = el.dataset.luggageReceipt;
      localStorage.setItem(`luggage_receipt_${id}`, el.value);
    });
    el.addEventListener("click", (e) => e.stopPropagation());
  });
}

// ──────────── PWA Service Worker 註冊在 HTML 內嵌 script 完成 ────────────

// ──────────── 啟動 ────────────
parseHash();
render();
