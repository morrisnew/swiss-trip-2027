
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
function today() {
  const now = new Date();
  // 台灣時區
  const tw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  tw.setHours(0,0,0,0);
  return tw;
}

function daysUntilDeparture() {
  const dep = new Date("2027-09-13T00:00:00+08:00");
  const t = today();
  return Math.ceil((dep - t) / (1000 * 60 * 60 * 24));
}

function findTodayDayIndex() {
  const t = today();
  const start = new Date("2027-09-14T00:00:00+08:00"); // Day 1
  const diff = Math.floor((t - start) / (1000 * 60 * 60 * 24));
  if (diff >= 0 && diff < DAYS.length) return diff;
  return -1;
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
  if (showBack) {
    return `
      <button class="back-btn" data-back>‹</button>
      <div style="flex:1; text-align:center;">
        <h1 style="justify-content:center; font-size:16px;">🇨🇭 瑞士家族大冒險</h1>
      </div>
      <div style="width:38px;"></div>
    `;
  }
  return `
    <h1><span class="icon">🇨🇭</span> 瑞士家族大冒險</h1>
    <div style="text-align:right; font-size:11px; opacity:0.85;">
      <div>2027/9/13 出發</div>
      <div>4 大 1 小</div>
    </div>
  `;
}

function renderBottomNav() {
  const items = [
    { key:"home", em:"🏠", label:"首頁" },
    { key:"days", em:"📅", label:"行程" },
    { key:"bookings", em:"📞", label:"訂位" },
    { key:"shopping", em:"🛒", label:"採買" },
    { key:"packing", em:"🧳", label:"打包" },
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
    todayBtn = `
      <button class="today-btn" data-nav-day="${todayIdx}">
        <span class="em">📍</span>
        <div style="flex:1; text-align:left;">
          <div style="font-size:12px; opacity:0.85; font-weight:500;">今日行程</div>
          <div>Day ${todayIdx + 1} · ${DAYS[todayIdx].theme}</div>
        </div>
        <span class="arrow">›</span>
      </button>
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

  return `
    ${countdownHTML}
    ${todayBtn}

    <div class="quick-grid">
      <div class="quick-tile" data-nav="hotels">
        <span class="em">🏨</span>
        <div class="label">住宿資訊</div>
        <div class="sub">KoBi · Atlanta</div>
      </div>
      <div class="quick-tile" data-nav="flights">
        <span class="em">✈️</span>
        <div class="label">機票資訊</div>
        <div class="sub">Emirates EK</div>
      </div>
      <div class="quick-tile" data-nav="sights">
        <span class="em">📍</span>
        <div class="label">景點導覽</div>
        <div class="sub">${SIGHTS.length} 個景點</div>
      </div>
      <div class="quick-tile" data-nav="emergency">
        <span class="em">🆘</span>
        <div class="label">緊急聯絡</div>
        <div class="sub">保險 · 官方 · 醫療</div>
      </div>
    </div>

    <div class="pwa-hint">
      💡 <strong>可加到主畫面離線使用</strong>：iPhone Safari 分享 → 加入主畫面；Android Chrome 選單 → 加到主畫面。加入後即使山區無網也可查閱。
    </div>

    <div class="section-title">🗓️ 完整行程（11 天）</div>
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

// ──────────── 訂位清單 ────────────
function renderBookings() {
  const groups = {};
  BOOKINGS.forEach(b => {
    const key = b.when.split(" ")[0]; // 依前綴分組
    if (!groups[b.when]) groups[b.when] = [];
    groups[b.when].push(b);
  });

  const completed = BOOKINGS.filter(b => isChecked(`book_${b.task}`)).length;
  const total = BOOKINGS.length;
  const percent = Math.round(completed / total * 100);

  const html = Object.entries(groups).map(([when, items]) => `
    <div class="checklist-group">
      <div class="checklist-header">
        <span>${when}</span>
      </div>
      ${items.map(b => {
        const key = `book_${b.task}`;
        const chk = isChecked(key);
        return `
          <div class="checklist-item ${chk ? 'checked' : ''}" data-toggle-check="${key}">
            <div class="cb">${chk ? '✓' : ''}</div>
            <div class="text">
              <div><strong>${escapeHTML(b.task)}</strong> ${b.priority ? `<span style="font-size:11px; color:var(--text-muted);">${b.priority}</span>` : ""}</div>
              <div class="meta">${escapeHTML(b.how)}</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `).join("");

  return `
    <div class="page-title">📞 訂位清單</div>
    <div class="page-sub">依時機分階段，勾選已完成</div>
    <div style="background:var(--surface); padding:14px; border-radius:14px; margin-bottom:14px; border:1px solid var(--border);">
      <div style="font-size:13px; margin-bottom:6px;">✅ 完成度 <strong>${completed} / ${total}</strong> · ${percent}%</div>
      <div class="progress-strip"><div style="width:${percent}%;"></div></div>
    </div>
    ${html}
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
    ${arr.map(h => `
      <div class="card">
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
        <div style="margin-top:10px; padding:10px; background:var(--slate-100); border-radius:8px; font-size:12px; color:var(--text-muted);">
          ${escapeHTML(h.notes)}
        </div>
        <div style="margin-top:12px;">
          <button class="map-btn" data-map="${encodeURIComponent(h.mapQuery)}" style="padding:10px 16px; font-size:13px;">📍 Google Maps 導航</button>
        </div>
      </div>
    `).join("")}
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
  return `
    <div class="page-title">✈️ 機票資訊</div>
    <div class="page-sub">Emirates 阿聯酋 · A380 · 經杜拜轉機</div>
    ${render1(FLIGHTS.outbound, "去程")}
    ${render1(FLIGHTS.return, "回程")}
    <div class="card" style="background:var(--gold-bg); border-color:var(--gold-border);">
      <div style="font-weight:700; margin-bottom:6px;">💡 EK 親子提醒</div>
      <ul style="padding-left:18px; font-size:13px; line-height:1.7;">
        <li>嬰兒搖籃：A380 前排隔板，需線上 Manage Booking 預約</li>
        <li>推車：免費 Gate-check，推到登機口才收</li>
        <li>行李：經濟艙每人 2 × 23kg 托運</li>
        <li>兒童餐：線上 Manage Booking 預訂</li>
      </ul>
    </div>
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
      e.stopPropagation();
      const key = el.dataset.toggleCheck;
      toggleCheck(key);
      render();
    });
  });
  document.querySelectorAll("[data-map]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const q = el.dataset.map;
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
    });
  });
}

// ──────────── PWA Service Worker 註冊在 HTML 內嵌 script 完成 ────────────

// ──────────── 啟動 ────────────
parseHash();
render();
