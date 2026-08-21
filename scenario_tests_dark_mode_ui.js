/**
 * V21.8c1 · Final Dark Mode UI Seal — theme regression（static guards）
 * 執行：node scenario_tests_dark_mode_ui.js
 * 目的：防止「固定淺色底 + var(--text) 淺字」同型 bug 回歸，並確保 theme-aware class 存在。
 */
const fs=require("fs"), path=require("path");
const appSrc=fs.readFileSync(path.join(__dirname,"app.js"),"utf-8");
const cssSrc=fs.readFileSync(path.join(__dirname,"style.css"),"utf-8");
let pass=0,fail=0;const failures=[];
function section(t){console.log("\n"+"─".repeat(72)+"\n"+t+"\n"+"─".repeat(72));}
function t(n,fn){let ok=false;try{ok=fn()===true;}catch(e){ok=false;}
  if(ok){pass++;console.log("  ✅ "+n);}else{fail++;failures.push(n);console.log("  ❌ "+n);}}
// WCAG
const lum=h=>{const c=[0,2,4].map(i=>parseInt(h.substr(i,2),16)/255).map(x=>x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const ctr=(a,b)=>{const L1=lum(a.replace("#","")),L2=lum(b.replace("#",""));return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);};
const darkBlock = (cssSrc.match(/@media \(prefers-color-scheme: dark\)[\s\S]*?\n\}/)||[""])[0];

console.log("=".repeat(72));
console.log("V21.8c1 · Dark Mode UI Theme Regression");
console.log("=".repeat(72));

section("1. 全站不得再有 fixed-light background 搭配 theme 文字");
["background:white","background: white","#F0F9FF","#E9F2FF","#FFF7ED","#FEF2F2","#EFF6FF","#F8FAFC"].forEach(p=>{
  t(`app.js 無 inline ${p}`, () => !appSrc.includes(p));
});
t("app.js 無 #FFFFFF inline 背景", () => !/background[^;"]*#FFFFFF/i.test(appSrc));
t("僅允許的固定色殘留（首頁深色 hero／badge 固定前後景）", () => {
  const hits = (appSrc.match(/#F1F5F9/g)||[]).length;
  return hits <= 2;   // renderHome 深底淺字 + renderStatusBadge estimate（前後景皆固定）
});

section("2. Weather：theme-aware class（Issue A）");
t("renderWeather 使用 .weather-principles-card", () => /class="card weather-principles-card"/.test(appSrc));
t("principle item 使用 .weather-principle-item", () => /class="weather-principle-item"/.test(appSrc));
t("renderWeather 內無 background:white", () => {
  const m = appSrc.match(/function renderWeather\(\)[\s\S]*?\n\}/);
  return !!m && !/background:\s*white/.test(m[0]);
});
t("CSS 有 .weather-principles-card / .weather-principle-item", () =>
  /\.weather-principles-card\s*\{/.test(cssSrc) && /\.weather-principle-item\s*\{/.test(cssSrc));
t("Dark 有 weather 覆寫", () => /weather-principles-card/.test(darkBlock) && /weather-principle-item/.test(darkBlock));

section("3. Emergency：theme-aware class（Issue B）");
t("priority card 使用 .emergency-priority-card", () => /class="card emergency-priority-card"/.test(appSrc));
t("call card 使用 .emergency-call-card", () => /class="emergency-call-card"/.test(appSrc));
t("renderEmergency 內無 background:white", () => {
  const m = appSrc.match(/function renderEmergency\(\)[\s\S]*?\n\}/);
  return !!m && !/background:\s*white/.test(m[0]);
});
t("CSS 有 emergency class 且 Dark 有覆寫", () =>
  /\.emergency-call-card\s*\{/.test(cssSrc) && /emergency-call-card/.test(darkBlock) && /emergency-priority-card/.test(darkBlock));

section("4. Generic toggle 拆分（Issue C）");
t("CSS 有 .section-toggle 且使用中性色 var(--text)", () =>
  /\.section-toggle\s*\{[\s\S]*?color:\s*var\(--text\)/.test(cssSrc));
t(".critical-toggle 仍保留給真正 critical", () => /\.critical-toggle\s*\{/.test(cssSrc));
["renderBudget","renderRainPlansSection","renderBoundaryCard","renderMapCard"].forEach(fn=>{
  t(`${fn} 使用 section-toggle（非 critical-toggle）`, () => {
    const m = appSrc.match(new RegExp("function "+fn+"\\([\\s\\S]*?\\n\\}"));
    return !!m && /class="section-toggle"/.test(m[0]) && !/class="critical-toggle"/.test(m[0]);
  });
});
t("renderTimeblock（真 critical）仍用 critical-toggle", () => {
  const m = appSrc.match(/function renderTimeblock\([\s\S]*?\n\}/);
  return !!m && /class="critical-toggle"/.test(m[0]);
});

section("5. Text accent 變數（品牌色不再直接當深底上的文字）");
["--text-blue","--text-red","--text-green","--text-warn","--text-gold","--text-safe","--text-critical"].forEach(v=>{
  t(`:root 定義 ${v}`, () => new RegExp("\\"+v+"\\s*:").test(cssSrc));
  t(`Dark 覆寫 ${v}`, () => new RegExp("\\"+v+"\\s*:").test(darkBlock));
});
t("app.js 不再以 color:var(--jungfrau-blue) 直接著色", () => !/color:\s*var\(--jungfrau-blue\)/.test(appSrc));
t("app.js 不再以 color:var(--alert-red) 直接著色", () =>
  !/color:\s*var\(--alert-red\)/.test(appSrc));
// --swiss-red 僅允許用於「同一元素明確設定固定淺色背景」的 CTA（如 today-btn）；
// 其餘（會隨主題變化的表面）一律不得使用，避免 dark 下淺底淺字或深底深字。
t("app.js 的 color:var(--swiss-red) 僅出現在固定淺底 CTA 上", () => {
  const lines = appSrc.split("\n").filter(l => /color:\s*var\(--swiss-red\)/.test(l));
  return lines.length > 0 && lines.every(l => /background:\s*(rgba\(255,\s*255,\s*255|#fff|white)/i.test(l));
});
t("app.js 不再以 color:var(--warn-orange)/--gold/--safe-green 直接著色", () =>
  !/color:\s*var\(--warn-orange\)/.test(appSrc) && !/color:\s*var\(--gold\)/.test(appSrc) && !/color:\s*var\(--safe-green\)/.test(appSrc));

section("6. 計算對比（WCAG ≥ 4.5:1）");
const pairs = [
  ["Dark Weather 標題", "#7FB3F0", "#182338"],
  ["Dark Weather 內文", "#94A3B8", "#141821"],
  ["Dark Emergency 標籤/電話", "#FF8A93", "#141821"],
  ["Dark section-toggle", "#F1F5F9", "#182338"],
  ["Light Weather 標題", "#2B6CB0", "#F1F5F9"],
  ["Light 面板次要文字", "#475569", "#FFF5F0"],
  ["Light critical toggle", "#B91C1C", "#FEF2F2"],
  ["Light gold badge", "#92400E", "#FFFBEB"],
  ["Light warn text", "#9A3412", "#FFF7ED"],
  ["Light safe text", "#047857", "#ECFDF5"]
];
pairs.forEach(([n,fg,bg]) => t(`${n}（${fg} on ${bg}）≥4.5`, () => ctr(fg,bg) >= 4.5));

section("6b. V21.8c1 Final Contrast Residual（Issue A–D）");
// Guard A：Today Dashboard CTA 為 fixed-light CTA，不得使用 dark-accent 文字變數
t("A：today-btn 不使用 var(--text-red)（dark accent 不可用於固定淺底）", () => {
  const m = appSrc.match(/<button class="today-btn"[\s\S]{0,400}?>/);
  return !!m && !/var\(--text-red\)/.test(m[0]);
});
t("A：today-btn 使用固定深色品牌紅 var(--swiss-red)", () => {
  const m = appSrc.match(/<button class="today-btn"[\s\S]{0,400}?>/);
  return !!m && /color:\s*var\(--swiss-red\)/.test(m[0]);
});
t("A：today-btn fixed-light CTA contrast ≥4.5（#DC0018 on #FFFFFF）", () => ctr("#DC0018", "#FFFFFF") >= 4.5);
t("A：--swiss-red 未於 Dark 全域被改亮（僅面板內 scoped）", () => {
  const global = darkBlock.match(/:root\s*\{[\s\S]*?\}/);
  return !global || !/--swiss-red\s*:/.test(global[0]);
});
// Guard B：Backup active
t("B：.backup-toggle.active 使用 --warn-orange-action", () =>
  /\.backup-toggle\.active\s*\{[\s\S]*?background:\s*var\(--warn-orange-action\)/.test(cssSrc));
t("B：--warn-orange-action 已定義", () => /--warn-orange-action\s*:\s*#9A3412/i.test(cssSrc));
t("B：white on active backup background ≥4.5", () => ctr("#FFFFFF", "#9A3412") >= 4.5);
t("B：warning semantic 未被改掉（--warn-orange 仍為 #EA580C）", () => /--warn-orange:\s*#EA580C/i.test(cssSrc));
// Guard C：tel-btn
t("C：.tel-btn 使用 --safe-green-action", () =>
  /\.tel-btn\s*\{[\s\S]*?background:\s*var\(--safe-green-action\)/.test(cssSrc));
t("C：--safe-green-action 已定義", () => /--safe-green-action\s*:\s*#046C51/i.test(cssSrc));
t("C：white on tel-btn background ≥4.5", () => ctr("#FFFFFF", "#046C51") >= 4.5);
t("C：green semantic 與白字保留", () => /\.tel-btn\s*\{[\s\S]*?color:\s*#fff/i.test(cssSrc));
// Guard D：critical content
t("D：.critical-content li 使用 --text-critical（不新增重複 semantic 變數）", () =>
  /\.critical-content li\s*\{[\s\S]*?color:\s*var\(--text-critical\)/.test(cssSrc));
t("D：critical-content text on alert-red-bg ≥4.5（#B91C1C on #FEF2F2）", () => ctr("#B91C1C", "#FEF2F2") >= 4.5);
t("D：未新增重複的 critical 語意變數", () => {
  const dup = (cssSrc.match(/--text-critical\s*:/g) || []).length;
  return dup >= 1 && dup <= 3 && !/--critical-text|--text-critical-2/.test(cssSrc);
});
// 通則：action 類背景（白字）一律 ≥4.5
[["--warn-orange-action","#9A3412"],["--safe-green-action","#046C51"],
 ["--jungfrau-blue(map-btn)","#2B6CB0"],["--swiss-red(badge)","#DC0018"]].forEach(([n,hex])=>{
  t(`action 背景 ${n} 上的白字 ≥4.5`, () => ctr("#FFFFFF", hex) >= 4.5);
});

section("7. 品牌色仍可作背景（未被破壞）");
t("--jungfrau-blue / --swiss-red 仍為原飽和值（供背景使用）", () =>
  /--jungfrau-blue:\s*#2B6CB0/.test(cssSrc) && /--swiss-red:\s*#DC0018/.test(cssSrc));
t("Dark block 未全域改寫 --jungfrau-blue", () => !/--jungfrau-blue:\s*#/.test(darkBlock));

console.log("\n"+"=".repeat(72));
console.log(fail===0?`✅ PASSED · ${pass}/${pass+fail}`:`❌ FAILED · ${pass}/${pass+fail}（失敗：${failures.join("、")}）`);
console.log("=".repeat(72));
process.exit(fail?1:0);
