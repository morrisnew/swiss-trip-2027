
const TRIP_META = {
  title: "瑞士旅行 2027",
  subtitle: "4 大 1 小・瑞士親子自由行",
  version: "V21.8c1 Web · 行程資料 V21.4g",
  webAppVersion: "V21.8c1",
  build: "V21.8c1-20260820",
  itineraryVersion: "V21.4g",
  departure: "2027-09-13",  // 台灣起飛
  arrival: "2027-09-14",    // 蘇黎世抵達
  returnDate: "2027-09-25", // 返回台灣
  members: [
    { name:"Morris", role:"爸爸", note:"負責人 · 導航 · 交通後勤" },
    { name:"Emily",  role:"媽媽", note:"妞妞主要照護 · 妞妞包管理" },
    { name:"皮皮",   role:"成人", note:"與 Emily 熟識" },
    { name:"Milo",   role:"成人", note:"與 Morris、Emily 熟識" },
    { name:"妞妞",   role:"2 歲半幼童", note:"使用嬰兒推車 · 妞妞用品合併 Emily 過夜包" }
  ],
  logistics: "5 件大行李（23kg）＋ 4 個過夜包（20-30L）＋ 1 台推車"
};

// 建議 D：首頁重要數字速查（現場最常查的號碼與代碼）
// V21.4：定義移至 CONSULATE_CONTACT + FLIGHT_CODES 之後，改用常數引用，避免多處抄寫不同步

// V21.3e：駐瑞士代表處共用聯絡（避免 PACKING / EMERGENCY / QUICK 各處抄寫版本不同步）
const CONSULATE_CONTACT = {
  general:   "+41 31 382 2927",
  altGeneral:"+41 31 350 8050",
  emergency: "+41 76 336 6979",
  freeCall:  "+800 0885 0885",
  address:   "Kirchenfeldstrasse 14, 3005 Bern"
};

// V21.5：航班資訊真正 SSoT — 4 航段完整資料模型
// 未來訂票確認實際航班時，只需將 status 改為 "booked" 並填入實際時間
const FLIGHT_ITINERARY = {
  status: "current_reference", // current_reference / booked
  airline: "Emirates 阿聯酋",
  airlineTW: "+886 2 7745 0420",
  manageURL: "https://www.emirates.com/tw/chinese/manage-booking/",
  outbound: {
    label: "去程 TPE → ZRH",
    date: "2027-09-13 (一) → 2027-09-14 (二)",
    leg1: {
      flightNo: "EK367",
      from: "TPE 桃園",
      to:   "DXB 杜拜",
      depart: "23:50 (TPE, 2027-09-13 一)",
      arrive: "04:35+1 (DXB, 2027-09-14 二)",
      status: "current_reference",
      note:   "現行參考航班；2027 訂票時實際為準"
    },
    leg2: {
      flightNo: "EK87",
      from: "DXB 杜拜",
      to:   "ZRH 蘇黎世",
      depart: "08:20 (DXB, 2027-09-14 二)",
      arrive: "13:20 (ZRH, 2027-09-14 二)",
      status: "current_reference",
      note:   "現行參考航班；2027 訂票時實際為準"
    }
  },
  return: {
    label: "回程 ZRH → TPE",
    date:  "2027-09-24 (五) → 2027-09-25 (六)",
    leg1: {
      flightNo: "EK88",
      from: "ZRH 蘇黎世",
      to:   "DXB 杜拜",
      depart: "15:30 (ZRH, 2027-09-24 五)",
      arrive: "00:15+1 (DXB, 2027-09-25 六)",
      status: "current_reference",
      note:   "現行參考航班；2027 訂票時實際為準"
    },
    leg2: {
      flightNo: "EK386",
      from: "DXB 杜拜",
      to:   "TPE 桃園",
      depart: "08:45 (DXB, 2027-09-25 六)",
      arrive: "21:20 (TPE, 2027-09-25 六)",
      status: "current_reference",
      note:   "現行參考航班；2027 訂票時實際為準（另一選項 EK366 03:45→16:15）"
    }
  }
};

// V21.5：計算 DXB 轉機時間（HH:MM）— 由 SSoT 自動計算，不再 hardcode
function calculateConnectionMinutes(arriveStr, departStr) {
  // arriveStr / departStr 格式類似 "04:35+1 (DXB, ...)" 或 "08:20 (DXB, ...)"
  const parseHM = (s) => {
    const m = s.match(/^(\d{2}):(\d{2})/);
    if (!m) return null;
    const plus = s.includes("+1") ? 1 : 0;
    return { h: +m[1], m: +m[2], dayOffset: plus };
  };
  const a = parseHM(arriveStr), d = parseHM(departStr);
  if (!a || !d) return null;
  // 假設同一段：arrive 已在前一日跨到今天（+1），depart 在今天
  // 若 arrive.dayOffset === 1，dep 通常視為當日 00:00 之後計
  let arriveMin = a.h * 60 + a.m;      // arrive 是實際 DXB 當地時
  let departMin = d.h * 60 + d.m;
  if (departMin < arriveMin) departMin += 24 * 60; // 跨日
  return departMin - arriveMin;
}

const _OUTBOUND_CONN = calculateConnectionMinutes(FLIGHT_ITINERARY.outbound.leg1.arrive, FLIGHT_ITINERARY.outbound.leg2.depart);
const _RETURN_CONN   = calculateConnectionMinutes(FLIGHT_ITINERARY.return.leg1.arrive,   FLIGHT_ITINERARY.return.leg2.depart);

// V21.5：向後兼容 alias（不再新增 hardcode；未來直接引用 FLIGHT_ITINERARY 更好）
const FLIGHT_CODES = {
  outbound:      FLIGHT_ITINERARY.outbound.leg2.flightNo,  // "EK87"
  outboundLeg1:  FLIGHT_ITINERARY.outbound.leg1.flightNo,  // "EK367"
  return:        FLIGHT_ITINERARY.return.leg1.flightNo,    // "EK88"
  dubaiHomeLeg:  FLIGHT_ITINERARY.return.leg2.flightNo,    // "EK386"
  airline:       FLIGHT_ITINERARY.airline,
  airlineTW:     FLIGHT_ITINERARY.airlineTW,
  manageURL:     FLIGHT_ITINERARY.manageURL,
  timeStatusNote:"所有具體時間為現行參考；2027 訂票時實際為準"
};

// V21.5：旅行證件規則 SSoT — Day / PACKING / PENDING 共同引用
const TRAVEL_DOCUMENT_RULES = {
  passport: {
    // 官方最低（EU Your Europe / 申根規則，2026/7 查證）
    legalMinimum: "申根區官方最低：預定離開申根區後護照仍需至少有效 3 個月，且入境時該旅行證件簽發未滿 10 年",
    legalMinimumPoints: [
      "離開申根區後護照至少仍有效 3 個月",
      "入境時旅行證件簽發未滿 10 年"
    ],
    // 本團自訂保守管理標準（不是法規）
    conservativeRecommendation: "本團保守管理建議：護照效期涵蓋出發後至少 6 個月",
    reason: "3 個月與 10 年為官方最低要求；6 個月屬本團自訂保守標準，用於降低航空公司值機與過境地實務風險，不得寫成申根法定最低要求",
    officialURL: "https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm",
    checkedAt: "2026-07（本輪查證）"
  },
  etias: {
    status: "尚未強制執行（2026/7 現況）",
    officialTiming: "ETIAS 官方預計於 2026 Q4 啟用",
    forSwiss: "瑞士屬申根區；ETIAS 正式強制後，適用的免簽旅客原則上需取得旅行授權",
    forThisTrip: "2027/9 出發前是否需辦理，視當年度是否已對本團各成員依所持護照正式要求為準；於 2027/3 再至 EU 官方網站確認實際啟用、過渡期與各成員依所持護照適用情況",
    // V21.7（Excel V21.4a）：若 2027 已正式適用時的申請範圍與費用
    ifApplicable2027: "若 2027 已正式適用：4 大 1 小【全員】均依規定取得 ETIAS travel authorisation",
    feeRule: "4 位成人依現行規則支付申請費（EU 執委會 2025-07-17 公告 EUR 20/人）；妞妞未滿 18 歲【免申請費】",
    childWarning: "🚨 免申請費 ≠ 不需申請。妞妞仍須依規定取得自己的 ETIAS travel authorisation",
    officialURL: "https://travel-europe.europa.eu/etias",
    checkedAt: "2026-07（本輪查證）"
  }
};

// V21.6：證件文案共用 helper — Day / PACKING / PENDING 統一由此產生，
// 避免各處自行手寫造成「6 個月被寫成法定最低」等偏差。
function passportRequirementLine() {
  return `${TRAVEL_DOCUMENT_RULES.passport.legalMinimum}；${TRAVEL_DOCUMENT_RULES.passport.conservativeRecommendation}`;
}
function passportPackingLine() {
  return `護照（官方最低：離開申根區後仍有效 3 個月、簽發未滿 10 年；${TRAVEL_DOCUMENT_RULES.passport.conservativeRecommendation}）`;
}
function etiasPackingLine(who) {
  const prefix = who ? `${who} ` : "";
  const childNote = who ? "（未滿 18 歲免申請費，但仍須取得自己的授權）" : "";
  return `${prefix}ETIAS 授權資料${childNote}（${TRAVEL_DOCUMENT_RULES.etias.status}；若 2027 已正式適用，4 大 1 小全員均需依規定取得授權，2027/3 再至官方確認）`;
}
// V21.7：ETIAS 申請範圍與費用共用文案
function etiasApplicabilityLine() {
  return `${TRAVEL_DOCUMENT_RULES.etias.ifApplicable2027}。${TRAVEL_DOCUMENT_RULES.etias.feeRule}。${TRAVEL_DOCUMENT_RULES.etias.childWarning}`;
}

// V21.6：航班 SSoT helper — 讓 user-facing 文字由 FLIGHT_ITINERARY 產生，
// 未來換航班只需改 FLIGHT_ITINERARY 的核心資料，主要 user-facing 航班資訊即同步更新。
function _flightHM(s) {                    // "15:30 (ZRH, ...)" → "15:30"
  const m = String(s || "").match(/^(\d{1,2}:\d{2})/);
  return m ? m[1] : "";
}
function formatFlightLeg(leg) {            // "EK88 ZRH 15:30 → DXB 00:15+1"
  const dep = String(leg.depart || "").match(/^([\d:]+(?:\+1)?)/);
  const arr = String(leg.arrive || "").match(/^([\d:]+(?:\+1)?)/);
  return `${leg.flightNo} ${String(leg.from).split(" ")[0]} ${dep ? dep[1] : ""} → ${String(leg.to).split(" ")[0]} ${arr ? arr[1] : ""}`;
}
function formatFlightRoute(dir) {          // dir: "outbound" | "return"
  const d = FLIGHT_ITINERARY[dir];
  return `${formatFlightLeg(d.leg1)}；${formatFlightLeg(d.leg2)}`;
}
function formatFlightReference() {         // 兩個方向的完整現行參考敘述
  return `現行參考：去 ${formatFlightRoute("outbound")}；回 ${formatFlightRoute("return")}。正式時間、航段組合以 2027 訂票確認為準`;
}
function flightCodesSummary() {            // "去 EK367+EK87 / 回 EK88+EK386"
  const o = FLIGHT_ITINERARY.outbound, r = FLIGHT_ITINERARY.return;
  return `去 ${o.leg1.flightNo}+${o.leg2.flightNo} / 回 ${r.leg1.flightNo}+${r.leg2.flightNo}`;
}
// 由指定航段起飛時間計算 T-minus 管理時間，取代硬寫 14:00 / 14:30 / 15:10
function subtractMinutesFromFlightDeparture(minutes, dir, legKey) {
  const leg = FLIGHT_ITINERARY[dir || "return"][legKey || "leg1"];
  const hm = _flightHM(leg.depart);
  if (!hm) return "";
  const [h, m] = hm.split(":").map(Number);
  let total = h * 60 + m - minutes;
  while (total < 0) total += 24 * 60;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
const ZRH_DEPART_HM = _flightHM(FLIGHT_ITINERARY.return.leg1.depart);   // 15:30
const ZRH_T90_HM    = subtractMinutesFromFlightDeparture(90);           // 14:00
const ZRH_T60_HM    = subtractMinutesFromFlightDeparture(60);           // 14:30
const ZRH_T20_HM    = subtractMinutesFromFlightDeparture(20);           // 15:10
const ZRH_ARRIVE_HM = _flightHM(FLIGHT_ITINERARY.outbound.leg2.arrive); // 13:20

// V21.4：QUICK_NUMBERS 引用上述 SSoT 常數（避免各處抄寫不同步）
// V21.5：112 稱謂改為「歐洲通用緊急」；Emirates 顯示兩段航班（不再誤導為 EK87 = 整段）
const QUICK_NUMBERS = [
  { icon:"🚨", label:"瑞士急難", value:"112 歐洲通用緊急 · 144 醫療 · 117 警察 · 118 火警" },
  { icon:"🚁", label:"高山救援 REGA", value:"1414" },
  { icon:"🆘", label:"駐瑞士代表處急難手機", value:CONSULATE_CONTACT.emergency },
  { icon:"✈️", label:"Emirates 航班（現行參考）", value:`${flightCodesSummary()}（2027 訂票時實際為準）` },
  { icon:"📞", label:"Emirates 台灣客服", value:FLIGHT_CODES.airlineTW },
  { icon:"🏨", label:"Interhome 客服（Sans Souci W1）", value:"+41 43 810 9126（Sans Souci W1 位於 cul-de-sac 死巷；精確門牌待 Interhome 確認）" },
  { icon:"🏨", label:"KoBi Hirschenplatz（琉森）", value:"+41 79 235 6688" },
  { icon:"🚂", label:"SBB 瑞士國鐵客服", value:"+41 848 44 66 88" }
];

// 建議 B/C：外部連結（Day 頁與 BOOKINGS 用）
const EXT_LINKS = {
  brienzRothornOps: "https://brienz-rothorn-bahn.ch/en/",
  stpBuy: "https://www.swissrailways.com/en",
  sbb: "https://www.sbb.ch/en",
  sbbLuggage: "https://www.sbb.ch/en/offers/luggage-transport-station-to-station",
  lieOfficial: "https://www.zentralbahn.ch/en/experience/leisure/luzern-interlaken-express",
  meteoSwiss: "https://www.meteoswiss.admin.ch/",
  pilatus: "https://www.pilatus.ch/en",
  spb: "https://jungfrau.ch/en-gb/schynige-platte/",
  zurichAirport: "https://www.zurich-airport.com/",
  emiratesManage: "https://www.emirates.com/tw/chinese/manage-booking/",
  interhome: "https://www.interhome.ch/",
  etias: "https://travel-europe.europa.eu/etias_en"
};

// V21.3b 功能：2027 待確認控制中心
const PENDING_2027 = [
  { id:"ek_flight", cat:"航班", item:"Emirates 去回 4 航段 2027 正式時間", suggestBy:"訂票時（2026/11 雙11、黑五）", link:"emiratesManage", note:formatFlightReference() },
  { id:"brb_2027", cat:"班表", item:"BRB Brienz Rothorn Bahn 2027 班表", suggestBy:"T-2 個月（2027/7）", link:"brienzRothornOps", note:"2026 官方 9 個班次僅作模擬；2027 正式班表公布後決定 9/23 上山班次" },
  { id:"spb_2027", cat:"班表", item:"SPB Schynige Platte Bahn 2027 班表與末班", suggestBy:"T-2 個月（2027/7）", link:"spb", note:"Day 8 下山方案 A/B 為暫定；末班時間依 2027 官方班表確認" },
  { id:"lie_seat", cat:"預約", item:"LIE Luzern-Interlaken Express 2027/9 座位預約（5 個座位）", suggestBy:"T-1 個月（2027/8）", link:"lieOfficial", note:"座位預約用於【確保座位】，不是搭乘的必要條件：持 STP 即可搭乘（Zentralbahn 官方：本線全額包含於 Swiss Travel Pass），但旺季週末可能難以取得相鄰座位。主方案：透過 Zentralbahn 官方指定座位預約系統預約相連座位。🚨【車票免費 ≠ 座位預約免費】妞妞依現行規則車票免費，但若希望她擁有獨立保證座位，仍需依 2027 Zentralbahn 規則確認並支付相應 reservation fee。📌 本團 4 大 1 小若希望 5 人皆有固定座位，應依 2027 實際規則【處理 5 個座位】（而非只訂 4 個）。官方現行預約費參考：2026/5/2-11/1 CHF 16；2027 費率待公布" },
  { id:"pilatus_2027", cat:"預約", item:"Pilatus 2027 齒軌預約政策", suggestBy:"T-3 個月（2027/6）", link:"pilatus", note:"官方措辭存在「強烈建議」與「不強制」不同措辭；2027 出發前確認是否成為強制。🚨 交通票券與座位預約應分開確認：持有效交通票券仍可能需要另外辦理／購買座位預約，不視為 Golden Round Trip 套票自動含齒軌座位。⚠️ 若當日啟動 B 計畫（Kriens 上山 → Pilatus Kulm → Alpnachstad 齒軌下山），原上山方向的預約【不會自動適用於下山方向】，需確認：① 原上山預約是否需取消 ② 下山方向是否需另行取得座位預約 ③ 改訂管道與可否當日辦理" },
  { id:"mountain_season", cat:"營運", item:"高山設施 2027 營運期", suggestBy:"T-3 個月（2027/6）", link:"", note:"Firstbahn、SPB、BRB、Pilatus 等秋季末營運期以官網為準" },
  { id:"sbb_luggage", cat:"物流", item:"SBB Gepäck 2027 櫃檯時段/費率", suggestBy:"T-1 個月（2027/8）", link:"sbbLuggage", note:"現行費率 CHF 12/件（Station-to-Station）。⚠️ 各站 luggage counter 開放時段依所選車站公告為準，SBB 官方要求依分站查詢；本團涉及 Luzern / Grindelwald / Zürich Flughafen 三站，2027 出發前需分別確認" },
  { id:"stp_2027_price", cat:"票務", item:"STP 2027 正式價格與規則更新", suggestBy:"T-2 個月（2027/7）", link:"stpBuy", note:"15 天版 Swiss Travel Pass 為【既定主方案】。2027 僅更新正式售價、適用範圍與當年度規則，不重新進行票券方案比較（除非日後主動決定重開）。原比較說明：與 8 天版 STP＋其餘單買、Swiss Half Fare Card＋單買等可行方案做最終成本比較後再鎖定。4 大人購買；妞妞 6 歲以下完全免費。預算暫採 CHF 515/成人（估算值，2027 實際售價公布後重算）" },
  { id:"etias_status", cat:"入境", item:"ETIAS 實際執行狀態", suggestBy:"T-6 個月（2027/3）", link:"etias", note:`${TRAVEL_DOCUMENT_RULES.etias.officialTiming}。${TRAVEL_DOCUMENT_RULES.etias.forSwiss}。${TRAVEL_DOCUMENT_RULES.etias.forThisTrip}。${etiasApplicabilityLine()}` },
  { id:"interhome_key", cat:"住宿", item:"Interhome Sans Souci W1 鑰匙交付/精確地址（已訂房後 operational 確認）", suggestBy:"出發前", link:"interhome", note:"已完成訂房；仍待 Interhome 確認：exact street address（精確門牌）／key pickup 領鑰匙方式／key return 還鑰匙方式／early check-in 是否可行／late check-in（17:00 後）procedure。Day 5 領鑰匙流程以住宿方最終說明為準" }
];

// V21.3b 功能：天氣/行程調整決策中心
const WEATHER_DECISION = {
  principles:[
    { icon:"🔄", label:"Day 7/8/9 可依天氣互換（需同步比對三處）", detail:"曼利申全景健行、SPB 歷史齒軌、First+Bachalpsee 三日為高山日靈活調度。🚨 不可只看「今天這座山白牆」就盲目跳到另一座山：① 每晚 19:00-21:00 同步比對 Männlichen / Schynige Platte / First 三處 webcam（jungfrau.ch）＋當日目的地官方營運狀態 ② 只有當某一目的地即時能見度明顯較佳時才互換 ③ 若三處皆白牆 → 直接啟動低海拔方案，不在白牆山頭之間輪流換 ④ 不以海拔高低推論雲層厚薄" },
    { icon:"🔒", label:"Day 10 原則鎖定 BRB", detail:"BRB 主題日受班表限制，非機動天。只有 BRB 明顯停駛（大風/濃霧/機車故障）才啟動專屬備案" },
    { icon:"⚠️", label:"高山 Webcam 白牆撤退（Day 4 需雙向確認）", detail:"Day 4 皮拉圖斯前一晚 20:00 檢查 Webcam，若白牆隔日啟動備案 A（Oeschinensee 單點）或 B（琉森室內日）。🚨 不能只看「Pilatus 白牆 + Kandersteg 低地天氣」就直接切 Oeschinensee：必須同步確認 Oeschinensee webcam、纜車是否營運、當地實際天氣後再決定" },
    { icon:"🌧️", label:"下雨天低海拔優先", detail:"Rothorn/First/Männlichen 山頂雨雪時視野零，改走 Lauterbrunnen 谷地、Interlaken 市區、伯恩舊城拱廊、琉森室內展館" }
  ],
  externalLinks:[
    { label:"MeteoSwiss（瑞士氣象局）", url:"meteoSwiss", note:"隔日天氣預報 + 逐時風速" },
    { label:"Brienz Rothorn Bahn 營運狀態", url:"brienzRothornOps", note:"Day 10 早上必查" },
    { label:"Pilatus 官方 Webcam / 營運", url:"pilatus", note:"Day 4 前一晚 20:00 檢查" },
    { label:"Schynige Platte Bahn 官方", url:"spb", note:"Day 8 SPB 車型/班表" }
  ]
};

// V21.3b 功能：SBB 行李追蹤（5 件 × 4 節點）
const LUGGAGE_MILESTONES = [
  { id:"D3_send", day:"Day 3", date:"9/16 (四) 08:00 起", loc:"Luzern 車站", action:"寄出", target:"Grindelwald" },
  { id:"D5_receive", day:"Day 5", date:"9/18 (六) 13:00", loc:"Grindelwald 車站", action:"領取", target:"5 件" },
  { id:"D8_send", day:"Day 8", date:"9/21 (二) 08:00", loc:"Grindelwald 車站", action:"寄出", target:"Zürich Flughafen" },
  { id:"D11_receive", day:"Day 11", date:"9/24 (五) 11:45", loc:"ZRH 機場 SBB", action:"領取", target:"5 件" }
];

const HOTELS = {
  luzern: {
    name:"KoBi Apartments Hirschenplatz",
    city:"琉森 Luzern",
    address:"Hirschenplatz 12, 6004 Luzern（訂房截圖地址為 5 Werchlaubengässli, 6004 Luzern；兩者同一街廓，實際 check-in 入口／門牌待住宿方確認）",
    roomType:"Two-Bedroom Apartment with Balcony",
    size:"130 m² · 2 房 2 衛",
    beds:"Bedroom 1: 1 twin + 1 queen · Bedroom 2: 1 queen · Living: 2 sofa beds",
    features:["電梯","陽台","城市景","洗衣機+烘乾機","完整廚房"],
    sleepPlanA:"推薦：Emily+皮皮+妞妞睡 Bedroom 1；Morris+Milo 睡 Bedroom 2",
    sleepPlanB:"備選：Emily+Morris+妞妞睡 Bedroom 1；皮皮獨佔 Bedroom 2；Milo 沙發床",
    sleepPlanC:"備選：Emily+Morris+妞妞睡 Bedroom 1；皮皮獨佔 Bedroom 2；Milo 沙發床",
    sleepNote:"關鍵原則：皮皮怕生只跟 Emily 熟 → 皮皮與 Emily 同房或獨房，絕不跟 Milo 同房",
    checkIn:"2027-09-14 (二)", checkOut:"2027-09-18 (六)",
    checkInWindow:"15:00–21:00",
    checkOutWindow:"10:00–11:00",
    nights:4,
    bookingStatus:"confirmed",
    status:"✅ 已訂房（已收到 Booking.com 確認信；付款狀態／時間待人工確認）",
    phone:"+41 79 235 6688",
    priceCHF:2702.16,
    priceTWD:125000,
    priceNote:"CHF 2,702.16 為實際訂房金額（原幣）；NT$ 125,000 為既有預算／規劃基準，非 Booking.com 實際訂單金額",
    cancellation:"2027/8/30 23:59 前可免費取消（Booking 截圖確認）",
    mapQuery:"KoBi Apartments Hirschenplatz Luzern",
    notes:"130 m² 兩房兩衛含陽台公寓，含電梯／洗衣機＋烘乾機。免費取消至 2027/8/30 23:59；付款狀態／時間待人工確認"
  },
  grindelwald: {
    name:"Apartment Sans Souci W1 by Interhome",
    city:"格林德瓦 Grindelwald",
    address:"3818 Grindelwald（鎮名層級；精確門牌待 Interhome 確認，位於 cul-de-sac 死巷）",
    office:"key collection 方式／地點待 Interhome 確認（office／lockbox／self check-in 未確認前不預設）",
    phone:"+41 43 810 9126",
    website:"interhome.ch",
    roomType:"108 m² · 2 房 2 衛 · 1 樓 + 電梯",
    features:["南向陽台","私人洗衣機+烘乾機","完整廚房","位於 cul-de-sac 死巷（無車流、安靜）","距 Coop 超市 50m","距室內游泳池 100m","距兒童遊樂場 100m","距主車站 300m"],
    checkIn:"2027-09-18 (六)", checkOut:"2027-09-24 (五)",
    checkInWindow:"15:00–17:00",
    checkOutBy:"10:00 前",
    houseRulesLabel:"入住條件（訂房平台現行資訊）",
    houseRules:[
      "Check-in 15:00–17:00",
      "Check-out 10:00 前",
      "Children all ages welcome",
      "無嬰兒床（crib）、無加床（extra bed）",
      "禁菸",
      "不可攜帶寵物",
      "免費取消條件：待住宿方／Booking 確認（原免費取消至 2027/7/20 為下訂前參考，已不適用）",
      "付款期限：待住宿方／Booking 確認（原 Pay nothing until 2027/7/18 為下訂前參考）",
      "押金：待住宿方確認（原 CHF 400 damage deposit 為下訂前參考，訂單截圖未顯示）"
    ],
    payment:{ dueCHF:2691, paidCHF:0, deadline:"待人工確認" },
    cityTax:{ rate:"CHF 5.20 / 人 / 晚", persons:5, nights:6, total:"CHF 156", note:"住宿方現場另收，未含於住宿費" },
    deposit:"待人工確認（原 CHF 400 為下訂前參考）",
    pendingItems:[
      "key collection 領鑰匙最終方式與地點（office 領取／密碼鎖 lockbox／self check-in，未確認前不預設）",
      "是否支援 self check-in",
      "13:00–15:00 抵達後的行李寄放安排",
      "17:00 後的 late check-in 是否可行",
      "床欄（bed rail / portable bed rail）是否可提供",
      "紗窗（insect screens）配置",
      "精確門牌地址（exact street address）",
      "鑰匙返還（key return）方式"
    ],
    nights:6,
    bookingStatus:"confirmed",
    status:"✅ 已訂房（Apartment Sans Souci W1 by Interhome，2027/09/18–24 共 6 晚）",
    selectionNote:"已完成訂房；以下為已訂房後、出發前仍待住宿方確認的 operational 資訊。",
    referenceQuoteNote:"實際訂房金額 CHF 2,691.01（原幣）；城市稅 CHF 156 由住宿方現場另收，不併入住宿費。舊 CHF 2,830／免費取消至 2027/7/20／Pay nothing until 2027/7/18／押金 CHF 400 為下訂前參考，已作廢，不代表現行訂單條款。",
    priceCHF:2691.01,
    priceIsReferenceQuote:false,
    mapQuery:"Sans Souci W1 Grindelwald",
    notes:"108㎡ 兩房兩衛，1 樓+電梯，南向陽台，private washer/dryer。Check-in 前（15:00 前）不得進入公寓/陽台/私人區域。付款狀態／取消條件／押金／精確門牌待人工確認"
  }
};

// V21.5：FLIGHTS 由 FLIGHT_ITINERARY 4 航段自動生成（不再獨立 hardcode）
// 未來訂票確認實際航班時，只需改 FLIGHT_ITINERARY 即可全站同步
const FLIGHTS = {
  outbound: {
    airline: FLIGHT_ITINERARY.airline,
    flightNo: `${FLIGHT_ITINERARY.outbound.leg1.flightNo} + ${FLIGHT_ITINERARY.outbound.leg2.flightNo}（兩段）`,
    depart: `${FLIGHT_ITINERARY.outbound.leg1.depart} · TPE 桃園`,
    stopover: `${FLIGHT_ITINERARY.outbound.leg1.arrive} DXB 抵達 → ${FLIGHT_ITINERARY.outbound.leg2.depart} DXB 起飛` +
              (_OUTBOUND_CONN ? `（DXB 轉機約 ${Math.floor(_OUTBOUND_CONN/60)}h${_OUTBOUND_CONN%60}m，由現行資料計算）` : ""),
    arrive: `${FLIGHT_ITINERARY.outbound.leg2.arrive} · ZRH 蘇黎世（現行參考，2027 訂票時實際為準）`
  },
  return: {
    airline: FLIGHT_ITINERARY.airline,
    flightNo: `${FLIGHT_ITINERARY.return.leg1.flightNo} + ${FLIGHT_ITINERARY.return.leg2.flightNo}（兩段）`,
    depart: `${FLIGHT_ITINERARY.return.leg1.depart} · ZRH 蘇黎世`,
    stopover: `${FLIGHT_ITINERARY.return.leg1.arrive} DXB 抵達 → ${FLIGHT_ITINERARY.return.leg2.depart} DXB 起飛` +
              (_RETURN_CONN ? `（DXB 轉機約 ${Math.floor(_RETURN_CONN/60)}h${_RETURN_CONN%60}m，由現行資料計算）` : ""),
    arrive: `${FLIGHT_ITINERARY.return.leg2.arrive} · TPE 桃園（現行參考，2027 訂票時實際為準）`
  }
};

// V21.3b 新增：Emirates 完整規則（Day 11 頁面渲染用）
const EMIRATES_RULES = {
  baggage: {
    concept:"Weight Concept（總重量制），非 Piece Concept",
    tiers:[
      { fare:"Economy Special", weight:"20 kg/人" },
      { fare:"Economy Saver",   weight:"25 kg/人" },
      { fare:"Economy Flex",    weight:"30 kg/人" },
      { fare:"Economy Flex Plus", weight:"35 kg/人" }
    ],
    perPiece:"每件單件上限 32 kg，可分多件",
    warning:"⚠️ 2×23kg 標準僅適用美洲/非洲航線；TPE-DXB-ZRH 亞歐路線為 Weight Concept"
  },
  childMeal: {
    code:"CHML",
    ageRange:"2-12 歲",
    note:"妞妞 2 歲半適用；訂票時 Manage Booking 選 CHML",
    warning:"⚠️ 不使用 BBML（僅 <2 歲）；KID 非 Emirates 官方代碼"
  },
  seatingPolicy:{
    note:"妞妞 2 歲半 → 使用兒童獨立座位 + 安全帶（不使用 bassinet 搖籃）",
    request:"可申請 bulkhead 前排優先"
  },
  dubaiConnect:{
    hours:"符合資格的 6-26 小時轉機可申請",
    perks:"免費過境酒店 + 餐食 + 接駁 + UAE transit visa",
    warning:"⚠️ 不是免費 city tour；最終資格以 Emirates 訂位系統/客服確認"
  },
  timeRules:{
    baseFlight:`${FLIGHT_ITINERARY.return.leg1.flightNo} 現行 ${ZRH_DEPART_HM} 起飛（2027 訂票時實際為準）`,
    note:"以下均為現行參考時間；ZRH 實體 check-in / bag-drop 截止時間以 2027 電子機票及 Emirates / Zürich Airport 當日規則為準",
    points:[
      { label:"Online check-in（App/網站）關閉", value:`起飛前 90 分鐘（${ZRH_DEPART_HM} → ${ZRH_T90_HM}）`, note:"App 端關閉，非機場實體 bag drop 硬截止" },
      { label:"T-90｜Passport control / Security 管理基準", value:ZRH_T90_HM },
      { label:"T-60｜Economy 抵達 Gate 硬時間點", value:ZRH_T60_HM },
      { label:"T-20｜登機門關閉", value:ZRH_T20_HM }
    ]
  }
};

// V21.3b 新增：Brienz Rothorn Bahn 班次表（2026 官方；2027 待官方公布）
const BRB_SCHEDULE = {
  season:"2026 官方班次（非每小時等距；2027 待官方公布）",
  departures:["07:36","08:36","09:40","10:45","11:45","12:58","13:58","14:58","16:36"],
  note:"turnstile 現行約於發車前 30 分鐘開放；若所購產品需要辦理換票或其他票務手續，應額外預留時間。建議至少於發車前適當時間完成進站準備。",
  buffer:"湖船抵 Brienz 後預留至少 30-45 分鐘 buffer 至下一班 BRB"
  // V21.7a：simulation2026 已移除獨立 hardcode，改由 BRB_DAY_PLAN + BRB_DERIVED 於下方統一產生
};

// V21.6：Day 10 BRB 行程 SSoT
// 目的：修正 V21.5「12:58 發車 / 13:57 抵頂」與「12:30–14:00 山頂」的物理矛盾。
// 所有 Day 10 BRB 相關絕對時間都由此推導，2027 官方班表公布後只需改此處。
const BRB_DAY_PLAN = {
  // ── 狀態（V21.7：Excel V21.4a 明確要求 2027 班表未公布前不鎖死正式班次）──
  status: "simulated_2026",   // simulated_2026 / official_2027 / booked
  statusLabel: "2026 班表模擬（2027 官方班表待公布，尚未決定實際搭乘班次）",
  scheduleFramework: "relative",  // relative（相對時間框架）/ absolute（2027 班表公布後）
  frameworkNote: "2027 BRB 時刻表尚未公布。本日採【相對時間框架】：湖船抵 Brienz → 預留至少 30-45 分鐘 buffer → 已選 BRB 班次 → 約 60 分鐘登頂 → 山頂停留約 1.5 小時 → 已選下山班次 → Brienz → Barry's。下方絕對時間僅為 2026 班表模擬，供 Preview 與 Today Engine 測試用，非 2027 已確認搭乘班次。",

  // ── 相對時間框架參數（2027 班表公布後仍成立）──
  minBufferMinutes: 30,
  recommendedBufferMinutes: 45,
  ascentMinutes: 60,
  summitStayMinutes: 90,
  descentMinutes: 64,

  // ── 2026 模擬用絕對時間（僅供模擬，非 2027 決定）──
  boatArriveBrienz: "11:22",
  chosenUpDeparture: "12:58",   // 2026 官方班次之一（模擬選擇）
  chosenDownDeparture: "15:28", // 2026 模擬下山班次
  simulationDisclaimer: "以下絕對時間由 2026 官方班次模擬推導，不代表 2027 已決定搭乘 12:58 這班。2027 官方時刻表公布後需重新配對上下山班次。",

  // ── 票務（Excel V21.4a：依所購產品辦理，不宣稱一定換 STP 實體票）──
  reservationPolicy: {
    kind: "recommended",        // recommended / mandatory
    text: "強烈建議事先鎖定班次並購買座位保證（Seat Guarantee，現行約 CHF 8/人）；是否強制隨票種而定，2027 出發前再次確認",
    ticketingNote: "BRB 進站與換票方式【依所購買的票券產品而定】。若購買 BRB 官方含有效車票與 Seat Guarantee 的產品，依當年度 QR Code／閘門規則使用；若僅持其他通票、折扣資格或座位保證，可能需要另外取得有效 BRB 車票。2027 實際規則於購票時再次確認。",
    fareNote: "現行 STP 半價來回約 CHF 49／成人 + 座位保證約 CHF 8（2027 出發前確認）",
    turnstileNote: "BRB turnstile 現行約於發車前 30 分鐘開放（「開放通行」不等於「乘客必須在此時通過」）；若所購產品需要辦理換票或其他票務手續，應額外預留時間。建議至少於發車前適當時間完成進站準備，並提前上車安置推車與幼兒。",
    childNote: "妞妞未滿 6 歲，依當年度兒童票價規則可能可免費搭乘；但「免費搭乘」不等於「保證有獨立座位」。若希望妞妞擁有保證座位，需依 2027 BRB Seat Guarantee 規則另外確認或辦理"
  },

  // ── 銜接失敗備援（Excel V21.4a 明確要求）──
  connectionFallback: {
    trigger: "若 2027 船班（BLS）與 BRB 上山班次無法合理銜接（例如船抵 Brienz 距下一班 BRB 少於 30 分鐘且無湖畔緩衝空間）",
    actions: [
      "① 取消湖船，改搭火車直達 Brienz：Grindelwald BOB → Interlaken Ost → SBB Brienz（現行約 30 分鐘）",
      "② 優先保留 BRB 與 Barry's 晚餐（今日雙主軸）",
      "③ 湖船體驗延後至 Day 6 或未來旅程再訪"
    ]
  },
  brbClosedFallback: {
    A: "BRB 停駛時採用：保留布里恩茨湖遊船 + Brienz 木雕村深度逛（11:22 抵 Brienz → 湖畔午餐 + 木雕村 → 火車回 Interlaken Ost）",
    B: "湖邊天氣也差時採用：因特拉肯市區全日（Höheweg 大道 + Höhematte 草坪 + Harder Kulm 纜車若晴 + 賭場周邊）"
  },

  officialCheckedAt: "2026-07（本輪查證：brienz-rothorn-bahn.ch）"
};

// V21.6：Day 方案選擇 SSoT
// 目的：修正 V21.5 將 "14:30 / 15:10" 交給通用 parser 自行猜測的問題。
// Today Dashboard 只讀「已選定方案」的時間；未選定時顯示「今日方案尚未選定」，
// 絕不把 alternative time 誤當單一路線。
const DAY_PLAN_CHOICES = {
  day8_spb: {
    dayIndex: 7,                      // DAYS[7] = Day 8
    label: "Schynige Platte 活動方案（A 家庭預設 / B Bonus）",
    storageKey: "planchoice_day8_spb_descent",   // V21.6 沿用，不破壞既有選擇
    defaultKey: "A",
    note: "A 為家庭預設主方案；B 為天氣、能見度、步道狀況、成人體力與妞妞狀態全部理想時才啟動的 Bonus Plan。不確定時選 A。所有班次為現行參考，2027 出發前以 SBB App / jungfrau.ch 確認。",
    decisionHint: "不確定時選 A。B 不是與 A 同等推薦的選項。",

    // ── V21.7a：Plan Activation Boundary（分流邊界）──────────────────────
    // 目的：修正 V21.7「只要當日有 planRef 就整天 plan_unselected」的行為錯誤。
    //
    // 語意：A/B 分流【不是】從當日 00:00 開始生效，而是抵達 Schynige Platte 後
    //       才需要依天氣、能見度、步道、成人體力與妞妞狀態決定。
    //       在分流點之前的共同行程（早餐、SBB 行李、BOB、SPB 上山）
    //       必須照常由 Today Engine 解析，不得被 plan_unselected 遮蔽。
    //
    // 實作原則（不使用 fragile hardcode "if now < 11:15"）：
    //   activationFrom = "earliest_plan_block_start"
    //     → 由「所有 option 中，最早的 planRole 起始時間」自動推導分流邊界。
    //       2027 班次調整時只需改 option 的 activityTime，邊界自動跟著改。
    //   decisionPrompt = 到達分流點且未選時，UI 顯示的提示語
    // ────────────────────────────────────────────────────────────────
    planActivation: {
      mode: "earliest_plan_block_start",
      // 分流前的共同行程照常解析（不被遮蔽）
      commonScheduleBeforeActivation: true,
      decisionPrompt: "請依今日天氣、能見度、步道、成人體力與妞妞狀態選擇 A 或 B。",
      boundaryNote: "分流點＝抵達 Schynige Platte、準備開始山上活動時。此前的行李寄送、BOB、SPB 上山為 A/B 共同行程。"
    },

    options: [
      {
        key: "A",
        tier: "family_default",
        label: "A · 家庭預設主方案（推薦・V21.4g）",
        pro: "主觀景／Skywalk＋Alpine Playground 為核心；保留餐廳正式午餐；不為走完整步道硬走",
        // ── 山上活動（V21.4g：11:15–下山前，逐項進行、後段可捨去）──
        // display time = 自然語意；engine time = Today engine 可解析的保守區間（不含午餐後段，避免與 lunch 區塊重疊）
        activityTime: "11:15–下山前",
        activityEngineTime: "11:15–13:00",
        activityTitle: "🏔️ Schynige Platte 家庭版主方案（主觀景／Skywalk → Playground → 午餐 → Naturkino → Alpine Garden Optional）",
        activitySteps: [
          "1. 抵達 Schynige Platte：觀景平台看伯恩三峰（Eiger/Mönch/Jungfrau）＋雙湖全景，全家合照",
          "2. 主要觀景點／Skywalk（山頂展望）：車站周邊主觀景點與 Skywalk 平台走動賞景",
          "3. Alpine Playground（高山兒童遊憩區）：妞妞放電主場",
          "4. 午餐／休息：約 12:30–13:00 進 Hotel Restaurant Schynige Platte（非硬性截止）",
          "5. Naturkino 短環線：餐後走「自然劇院」短觀景環線（短、緩、可隨時折返）",
          "6. Alpine Garden 高山植物園（放最後・Optional）：視時間／體力／路況再決定，時間或體力不足可直接略過，不影響本日核心"
        ],
        activityDefense: [
          "⚠️ 順序為建議順序，時間／體力／路況允許時逐項進行；後段可視情況捨去，不為走完整步道而硬走",
          "⚠️ 部分路面碎石／不平，非無障礙、非「推車一定全程可行」；個別路段可能需大人抬或改背巾",
          "適用狀況：妞妞需要推車休息／不適合長時間背巾／天氣或能見度普通／成人不想長距離健行／希望保留正式餐廳午餐"
        ],
        // ── 午餐 ──
        lunchTime: "13:00–14:15",
        lunchTitle: "🍽️ Hotel Restaurant Schynige Platte 正式午餐",
        lunchSteps: [
          "約 12:30–13:00 進入 Hotel Restaurant Schynige Platte（非硬性截止，含 4 大人＋幼兒＋推車＋拍照＋如廁的實際彈性）",
          "推薦 Rösti 或 Älplermagronen",
          "餐後續行 Naturkino 短環線 → Alpine Garden（Optional，可略過），再準備下山"
        ],
        lunchDefense: ["餐廳午餐是 A 方案的一部分；若改走 B 方案則改為野餐"],
        // ── 下山（班次為現行參考；2027 SPB timetable 仍為 Pending）──
        descentTime: "14:30–16:07",
        descentTitle: "🚂 SPB 下山（方案 A・現行參考班次，2027 待確認）",
        descentSteps: [
          "SPB 下山 → 轉 BOB Wilderswil → 抵 Grindelwald",
          "⚠️ 現行參考：14:30 發車、約 15:20 抵 Wilderswil、15:34 轉 BOB、約 16:07 抵 Grindelwald——**2027 SPB／BOB 班表尚未公布，出發前以 SBB App／jungfrau.ch 為準，不視為已確認班次**",
          "🥇 下山改坐右側，換另一邊視角俯瞰湖區"
        ],
        townTime: "16:30–18:30",
        strollerPolicy: "推車可攜；非無障礙、非全程可行，必要時改背巾，依現場路況判斷",
        carrierPolicy: "背巾備用"
      },
      {
        key: "B",
        tier: "bonus",
        label: "B · Bonus Plan · 正式 Panorama Hike（條件全部理想才啟動）",
        pro: "約 6 km 正式健行；午餐改野餐；背巾限定",
        // ── 山上活動 ──
        activityTime: "11:15–14:15",
        activityTitle: "🏔️ Schynige Platte Panorama Hike（正式健行版 · Bonus）",
        activitySteps: [
          "正式「Schynige Platte Panorama Hike」，約 6 公里",
          "理想條件下約 2.5～3 小時；幼兒同行實際可能更久",
          "有實際健行地形與高度變化，沿途觀景點視野開闊",
          "沿線可含 Daube 觀景台（自植物園方向步行約 15 分鐘量級；實際距離與路況依當日步道指標為準）",
          "午餐改為野餐（不進餐廳）"
        ],
        activityDefense: [
          "🚨 推車不得視為本方案的行程交通工具——背巾為限定主策略",
          "🚨 啟動條件：天氣／能見度／步道狀況／成人體力／妞妞狀態全部理想才啟動",
          "任一條件不理想 → 直接回到 A 家庭預設方案"
        ],
        // ── 午餐（野餐，含在活動時段內）──
        lunchTime: "（野餐，含於健行途中）",
        lunchTitle: "🥪 步道途中野餐",
        lunchSteps: [
          "午餐改為野餐，於步道途中視野良好處進行",
          "不安排 Hotel Restaurant Schynige Platte 正式午餐",
          "野餐食材需於前一晚或當日早上先備妥"
        ],
        lunchDefense: ["B 方案不使用餐廳午餐；A/B 午餐邏輯互斥，不可並存"],
        // ── 下山 ──
        descentTime: "15:10–16:37",
        descentTitle: "🚂 SPB 下山（方案 B：15:10 發車）",
        descentSteps: [
          "15:10 SPB 下山 → 約 16:00 抵 Wilderswil（車程約 50 分鐘）",
          "16:04 轉 BOB Wilderswil → 約 16:37 抵 Grindelwald",
          "🥇 下山改坐右側，換另一邊視角俯瞰湖區"
        ],
        townTime: "16:45–18:30",
        strollerPolicy: "🚨 推車不得視為行程交通工具",
        carrierPolicy: "背巾為限定主策略，妞妞由父母輪流揹"
      }
    ]
  }
};
function _brbAddMinutes(hm, mins) {
  const [h, m] = hm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
const BRB_DERIVED = {
  summitArrive: _brbAddMinutes(BRB_DAY_PLAN.chosenUpDeparture, BRB_DAY_PLAN.ascentMinutes),           // 13:58
  summitLeave:  BRB_DAY_PLAN.chosenDownDeparture,                                                     // 15:28
  brienzBack:   _brbAddMinutes(BRB_DAY_PLAN.chosenDownDeparture, BRB_DAY_PLAN.descentMinutes)         // 16:32
};
// 下游段落（木雕村 → SBB → BOB → 休息）同樣由 brienzBack 推導，避免手寫造成矛盾
BRB_DERIVED.souvenirEnd   = _brbAddMinutes(BRB_DERIVED.brienzBack, 23);   // 16:55
BRB_DERIVED.sbbDepart     = _brbAddMinutes(BRB_DERIVED.brienzBack, 28);   // 17:00
BRB_DERIVED.sbbArriveIntO = _brbAddMinutes(BRB_DERIVED.sbbDepart, 16);    // 17:16
BRB_DERIVED.bobDepart     = _brbAddMinutes(BRB_DERIVED.sbbArriveIntO, 9); // 17:25
BRB_DERIVED.bobArriveGrin = _brbAddMinutes(BRB_DERIVED.bobDepart, 35);    // 18:00

// V21.7a：BRB 模擬敘述由 SSoT 單一產生，回填 BRB_SCHEDULE
// 修正 V21.7「BRB_SCHEDULE 寫 13:57、BRB_DERIVED 算出 13:58」的雙 hardcode 不一致
BRB_DERIVED.simulationText =
  `船 ${BRB_DAY_PLAN.boatArriveBrienz} 抵 Brienz → ${BRB_DAY_PLAN.chosenUpDeparture} BRB → ` +
  `${BRB_DERIVED.summitArrive} 抵頂 → ${BRB_DERIVED.summitLeave} 下山 → ` +
  `${BRB_DERIVED.brienzBack} 回 Brienz（山頂約 ${(BRB_DAY_PLAN.summitStayMinutes / 60).toFixed(1).replace(/\.0$/, "")} 小時）` +
  `｜${BRB_DAY_PLAN.statusLabel}`;
BRB_SCHEDULE.simulation2026 = BRB_DERIVED.simulationText;

const EMERGENCY = [
  { cat:"急難救助", items:[
    { label:"瑞士警察", tel:"117", note:"報案／治安" },
    { label:"瑞士消防", tel:"118", note:"火警／救援" },
    { label:"瑞士醫療緊急", tel:"144", note:"救護車" },
    { label:"歐洲統一緊急", tel:"112", note:"任何緊急狀況" },
    { label:"高山救援 REGA", tel:"1414", note:"直升機山難救援" }
  ]},
  { cat:"台灣官方", items:[
    { label:"駐瑞士代表處 · 一般聯絡", tel:CONSULATE_CONTACT.general, note:"護照遺失、簽證、文件驗證（辦公時間）" },
    { label:"駐瑞士代表處 · 另一線", tel:CONSULATE_CONTACT.altGeneral, note:"備用聯絡電話" },
    { label:"🆘 駐瑞士代表處 · 急難救助手機", tel:CONSULATE_CONTACT.emergency, note:"限車禍、搶劫、生命安危等重大急難" },
    { label:"外交部旅外急難救助 · 全球免付費", tel:CONSULATE_CONTACT.freeCall, note:"境外免付費專線" },
    { label:"地址", tel:"", note:CONSULATE_CONTACT.address }
  ]},
  { cat:"住宿聯絡", items:[
    { label:"KoBi Hirschenplatz (琉森)", tel:"", note:"booking.com 預訂，詳見訂房確認信" },
    { label:"Interhome / Sans Souci W1 (格林德瓦)", tel:"", note:"聯絡方式以訂房確認信、Booking.com / Interhome 訂房資料為準" }
  ]},
  { cat:"航空與保險", items:[
    { label:"Emirates 台灣客服", tel:"+886 2 7745 0420", note:"改班、行李（已驗證）" },
    { label:"旅遊保險 24h 急難", tel:"", note:"⚠️ 出發前將保險公司急難專線填入此處" }
  ]},
  { cat:"交通查詢", items:[
    { label:"SBB 瑞士國鐵 App", tel:"", note:"班次、月台、行李寄送" },
    { label:"MeteoSwiss App", tel:"", note:"隔日天氣與白牆判斷" }
  ]}
];

const DAYS = [
  {
    day:1, date:"09/14 (二)", loc:"琉森 Luzern", theme:"降落與適應日",
    hotelKey:"luzern",
    tl:[
      {
        time:`${ZRH_ARRIVE_HM}–15:00`, title:"抵達蘇黎世機場 ZRH + 從容通關領行李",
        tr:{ label:"入境", icon:"plane" },
        stp:"none",
        steps:[
          `飛機約 ${ZRH_ARRIVE_HM} 落地後立刻開啟網路報平安（現行參考時間；2027 訂票時實際為準）`,
          "跟隨 Exit / Baggage Claim 指標往入境大廳",
          `護照查驗（誠實答 Tourism）；${passportRequirementLine()}`,
          "確認行李轉盤，提領 5 件大行李 + 推車",
          "走綠色通道 Nothing to declare 出關"
        ],
        defense:[
          "下午抵達，海關通關約 30-45 分鐘",
          "妞妞疲憊度高，推車立刻派上用場",
          "時程從容版：主推 15:04 IR 70 直達車（不趕 14:34；班次以 2027 SBB App 為準）",
          "備案：若海關 <60 分鐘，可搭 14:34 IR 70（15:39 抵琉森）"
        ],
        critical:[]
      },
      {
        time:"15:00–16:10", title:"IR 70 15:04 城際直達車 → 琉森",
        tr:{ label:"IR 70 直達", icon:"train" },
        stp:"free",
        steps:[
          "找 Bahn / Train 標誌往機場地下層車站",
          "SBB App 輸入 Zürich Flughafen → Luzern，篩選 IR 70 直達車（約 1h5m）",
          "🥇 鎖定 0 changes 直達車，全程不用下車",
          "認準車廂外「2」字二等艙標示"
        ],
        defense:[
          "壯丁強攻車廂兩端行李架",
          "推車免折疊，直接推入無障礙區",
          "🦖 尋找 FA 家庭車廂：外有恐龍/熊卡通圖案，二樓兒童遊戲區"
        ],
        critical:[
          "絕對不搭需在 Zürich HB 轉車的班次——剛長途飛行+帶妞妞與 5 件大行李+推車，全瑞士最大車站換月台極易走散"
        ]
      },
      {
        time:"16:30–18:30", title:"KoBi Check-in ＋ Coop 採買",
        tr:{ label:"步行 5 分鐘", icon:"walk" },
        stp:"none",
        steps:[
          "Google Maps 導航至 KoBi Hirschenplatz（步行 5 分鐘）",
          "辦理正式 Check-in，卸下 5 件大行李 + 推車",
          "KoBi 是 130 m² 2 房 2 衛，建物有電梯，5 件大行李 + 推車可搭電梯上樓",
          "熟悉家電：洗衣機、烘乾機、烤箱、洗碗機、咖啡機（按鈕通常德文）",
          "全員洗熱水澡放鬆",
          "前往琉森車站 B1 Coop 採買（鮮奶、麵包、火腿起司、水果）"
        ],
        defense:[
          "琉森 Coop 週二正常營業 08:00-19:00",
          "第一天採買重點：簡單晚餐 + 隔日早餐",
          "🏠 4 晚睡眠配置・關鍵原則：皮皮怕生只跟 Emily 熟",
          "方案 A（推薦）：Emily+皮皮+妞妞睡 Bedroom 1（1 queen + 1 twin），Morris+Milo 睡 Bedroom 2",
          "方案 B：Emily+Morris+妞妞睡 Bedroom 1，皮皮獨佔 Bedroom 2，Milo 沙發床",
          "方案 C：Emily+Morris+妞妞睡 Bedroom 1，皮皮獨佔 Bedroom 2，Milo 沙發床",
          "💡 三方案共通點：皮皮絕不跟 Milo 同房或獨睡陌生沙發床"
        ],
        critical:[]
      },
      {
        time:"18:30–21:00", title:"湖畔輕散步 ＋ 自炊晚餐",
        tr:{ label:"步行", icon:"walk" },
        stp:"none",
        steps:[
          "18:30 全員推車輕裝出門，沿琉森湖畔散步",
          "至卡貝爾木橋 Kapellbrücke 拍照（黃昏光線最美）",
          "19:00 回公寓自炊簡易晚餐"
        ],
        defense:[
          "第一天不排複雜行程——妞妞今晚 21:00 前務必入睡",
          "大人陽台喝酒看夜景，22:00 前一定要睡"
        ],
        critical:[]
      }
    ]
  },

  {
    day:2, date:"09/15 (三)", loc:"琉森 Luzern", theme:"瑞吉山環遊",
    hotelKey:"luzern",
    tl:[
      {
        time:"09:00–10:15", title:"琉森湖 SGV 遊船 → Vitznau",
        tr:{ label:"SGV 遊船 09:12", icon:"ship" }, stp:"free",
        steps:[
          "走到火車站正前方的碼頭",
          "尋找開往 Vitznau 的船班（09:12）",
          "出示 STP 直接上船，二等艙可坐一樓"
        ],
        defense:["推車免折疊直接上船，停船首/船尾寬敞處"],
        critical:[]
      },
      {
        time:"10:15–11:00", title:"紅色齒軌列車 → 瑞吉山頂",
        tr:{ label:"Rigi Bahn", icon:"train" }, stp:"free",
        steps:[
          "Vitznau 下船後正前方 50 公尺是火車站",
          "🥇 上車搶攻「行車方向左側」座位，湖景全在左邊"
        ],
        defense:[
          "正常準點時 Rigi Bahnen 與 SGV 湖船有 5-10 分鐘 buffer；若船延誤火車不保證等待，仍建議下船後正常步行（不奔跑，親子行程原則）到齒軌月台",
          "車廂無障礙，推車可直上"
        ],
        critical:[]
      },
      {
        time:"11:00–13:15", title:"Rigi Kulm 山頂 360° 大景野餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "終點站 Rigi Kulm 下車",
          "沿斜坡上走約 10 分鐘至電信塔十字制高點大合照",
          "找戶外木椅或草地野餐"
        ],
        defense:[
          "山頂步道相對平緩，對推車與長輩較友善",
          "山上風大需加件薄外套",
          "⚠️ 13:15 準時收拾出發，前往 Rigi Kulm 車站準備搭齒軌火車下山至 Rigi Kaltbad"
        ],
        critical:[]
      },
      {
        time:"13:15–14:30", title:"下山第一段：Rigi Kulm → Rigi Kaltbad（Default：齒軌火車）",
        tr:{ label:"齒軌火車（Optional：部分步行）", icon:"train" }, stp:"free",
        steps:[
          "⭐ Default：於 Rigi Kulm 站搭齒軌火車下至 Rigi Kaltbad（rigi.ch 現行車程約 10 分鐘量級）",
          "Optional：僅在天氣／路況／幼兒狀態／推車條件皆良好時，才改為部分步行；步行非 Must-do",
          "實際班次與車程依當日 rigi.ch／SBB 時刻表，不預設固定發車時刻"
        ],
        defense:[
          "⚠️ 步行段已降為 Optional：不再把 Kulm → Kaltbad 下坡健行當作應完成的主行程",
          "🛡️ Rigi 雖有多條 stroller-friendly 步道，但不等於 Kulm → Kaltbad 所有路線都適合推車；若選 Optional 步行，出發前於 rigi.ch 確認當日建議路線",
          "🆘 第一個完整旅遊日以降低體力負荷為原則，不確定時一律搭齒軌火車"
        ],
        critical:[
          "⚠️ Kulm → Kaltbad 不是「1 站」——中間尚有 Rigi Staffel、Rigi Staffelhöhe 等站；現行車程約 10 分鐘量級，2027 實際班次與車程依 rigi.ch／SBB 時刻表確認"
        ]
      },
      {
        time:"14:30–15:05", title:"高空纜車降落 Weggis",
        tr:{ label:"Rigi 纜車", icon:"cablecar" }, stp:"free",
        steps:[
          "Rigi Kaltbad 搭往 Weggis（玫瑰小鎮）大纜車約 10 分鐘",
          "出站跟 Schiff/Boat 指標步行 10-12 分鐘至碼頭"
        ],
        defense:["Weggis 纜車站到碼頭是下坡路，抓穩推車"],
        critical:[]
      },
      {
        time:"15:05–16:15", title:"遊船返回琉森",
        tr:{ label:"SGV 遊船", icon:"ship" }, stp:"free",
        steps:[
          "Weggis 碼頭搭 15:05 返回 Luzern 船班（約 1h10m）",
          "找甲板位置放空欣賞另一側湖景"
        ],
        defense:["若錯過 15:05，下一班 16:05 亦可，17:15 抵琉森"],
        critical:[]
      },
      {
        time:"16:15–19:00", title:"卡貝爾木橋 ＋ 舊城散步 ＋ 晚餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "回琉森後前往卡貝爾木橋（Kapellbrücke）",
          "漫步舊城區石板路與濕壁畫",
          "前往預定的餐廳（Rathaus Brauerei 或 Restaurant Pfistern）吃晚餐",
          "晚餐後回住宿休息，避免 Day 2 過長"
        ],
        defense:[
          "ℹ️ 獅子紀念碑正式安排於 Day 3 文化日，Day 2 回程不重複排入",
          "舊城區石板路稍有顛簸"
        ],
        critical:[]
      }
    ]
  },

  {
    day:3, date:"09/16 (四)", loc:"琉森 Luzern", theme:"人文日 ＋ SBB 行李寄送",
    hotelKey:"luzern",
    tl:[
      {
        time:"07:45–09:00", title:"🛅 SBB 行李寄送 + 集結",
        tr:{ label:"步行至琉森車站", icon:"luggage" }, stp:"none",
        steps:[
          "早上 07:00 起床（時差已調整 2 天）",
          "3 大人前一晚已分裝好的 5 件大行李推到琉森車站",
          "約 07:45 從住宿出發；跟 Gepäck / Luggage 指標找 SBB 行李櫃台（現行 08:00 開門後才可辦理，約 08:20–08:30 完成；2027 實際營業時間出發前重新確認）",
          "出示護照 + STP，填寄送單：寄至 Grindelwald 站，9/18 (六) 領取",
          "付費 CHF 12 × 5 件 = CHF 60，保留收據與寄物編號",
          "08:30 全家集合前往獅子紀念碑（步行 15 分鐘）"
        ],
        defense:[
          "全部寄送方案：5 件全部寄送，全員只帶過夜包 + 推車移動",
          "彈性：若擔心延誤，可留妞妞那件當保險（尿布奶粉不斷炊），CHF 12 × 4 = CHF 48"
        ],
        critical:[
          "貴重物品絕對不寄送：護照、機票、STP、現金、信用卡",
          "妞妞 48h 必需品全在 Emily 過夜包：尿布、奶粉、副食品、藥品",
          "全家 1 套保暖衣分散各過夜包",
          "電池、鋰電池類產品全部抽出放隨身",
          "🚨【SBB 禁寄易腐食品・已查證】 SBB 明文禁止運送乳製品、肉類等易腐食品",
          "妞妞奶粉、副食品、優格絕對不可放進寄送的大行李，必須全放隨身過夜包",
          "✅ 過夜包方案剛好符合：奶粉本就在 Emily 隨身包，但務必確認執行時不誤放"
        ]
      },
      {
        time:"09:00–09:30", title:"獅子紀念碑",
        tr:{ label:"步行", icon:"walk" }, stp:"free",
        steps:[
          "獅子紀念碑快閃拍團體合照（趁大批團客抵達前）"
        ],
        defense:["獅子紀念碑公園步道平緩好推推車"],
        critical:[]
      },
      {
        time:"09:30–10:00", title:"步行至霍夫教堂 Hofkirche / 舊城拱廊",
        tr:{ label:"步行", icon:"walk" }, stp:"free",
        steps:[
          "下坡走 5 分鐘抵達琉森最美的雙尖塔教堂",
          "靜心參觀，感受中世紀宗教氛圍",
          "教堂外舊城拱廊區逛逛，等冰河公園 10:00 開門"
        ],
        defense:["教堂內需保持安靜，若妞妞不安分，大人輪流進去","冰河公園 10:00 才開門，不可提早入場"],
        critical:[]
      },
      {
        time:"10:00–11:30", title:"冰河公園 ＋ 鏡子迷宮（10:00 開門）",
        tr:{ label:"步行", icon:"walk" }, stp:"free",
        steps:[
          "10:00 冰河公園開門後入場",
          "先在售票處寄放推車（走道狹窄推車進不去）",
          "帶妞妞直衝鏡子迷宮（Alhambra），大人小孩一起迷路大笑",
          "含冰河壺穴區與觀景台，全程 1.5 小時"
        ],
        defense:[
          "鏡子迷宮內握好妞妞的手，玻璃太乾淨容易撞上去",
          "冰河壺穴區也有階梯，推車一律停門口"
        ],
        critical:[
          "冰河公園鏡子迷宮走道極窄，嬰兒推車絕對進不去！入口寄放推車，牽妞妞或用背巾進入",
          "後方觀景台需攀陡石階，推車與行動不便者無法上去"
        ]
      },
      {
        time:"11:30–13:00", title:"老城區碼頭午餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "散步回老城區碼頭，找露天餐廳坐下",
          "必點料理：Luzerner Chügelipastete（琉森派）"
        ],
        defense:["碼頭區風大，餵奶換尿布可去 Manora 百貨或火車站 B1"],
        critical:[]
      },
      {
        time:"13:00–13:30", title:"琉森湖航行 → Verkehrshaus-Lido",
        tr:{ label:"SGV 遊船", icon:"ship" }, stp:"free",
        steps:[
          "走到火車站前 Luzern Bahnhofquai 碼頭（通常是 2 號）",
          "尋找開往 Verkehrshaus-Lido 的船（10 分鐘湖光山色）",
          "下船後步行 3-5 分鐘至交通博物館"
        ],
        defense:["交通博物館展區極大，家庭極容易玩超時，17:00 前務必離開"],
        critical:[]
      },
      {
        time:"13:30–17:00", title:"⭐ 瑞士交通博物館",
        tr:{ label:"步行", icon:"walk" }, stp:"half",
        steps:[
          "購票進場（STP 享 5 折）",
          "必玩清單：戶外工地施工區、實體飛機艙門體驗、巧克力工廠（需加購）",
          "妞妞放電區：兒童 Media Factory + 小火車互動區",
          "累了在中庭喝咖啡休息"
        ],
        defense:[
          "全室內無障礙推車天堂",
          "館內充足熱水與育嬰設施",
          "至少預留 3 小時"
        ],
        critical:[]
      },
      {
        time:"17:00–18:00", title:"公車返回市區",
        tr:{ label:"6/8/24 號公車", icon:"bus" }, stp:"free",
        steps:[
          "走到博物館門口公車站 Verkehrshaus",
          "搭 6、8、24 號公車約 10 分鐘回火車站"
        ],
        defense:["下班時間公車人稍多，推車靠邊站穩並鎖上煞車"],
        critical:[]
      },
      {
        time:"18:00–20:00", title:"晚間人文散步 ＋ 超市採買",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "沿羅伊斯河畔散步，餵天鵝",
          "欣賞夜晚點燈的卡貝爾橋",
          "進火車站內 Coop 採買隔日早餐"
        ],
        defense:["湖邊欄杆較低，妞妞餵天鵝時大人務必抓緊"],
        critical:[]
      }
    ]
  },

  {
    day:4, date:"09/17 (五)", loc:"琉森 Luzern", theme:"皮拉圖斯金色環遊",
    hotelKey:"luzern",
    hasBackup: true,
    tl:[
      {
        time:"前一晚 20:00", title:"情報與天候確認",
        tr:{ label:"Webcam 檢查", icon:"info" }, stp:"none",
        steps:[
          "⚠️ 極度關鍵：優先查看皮拉圖斯山頂 Webcam 即時影像"
        ],
        defense:[
          "白牆撤退機制：山區最大風險是雲海變白牆",
          "若 Webcam 顯示白牆，隔日直接啟動 Day 4 備案 A/B（見備案面板：A 為 Oeschinensee 單點深度日；B 為琉森室內日）"
        ],
        critical:[]
      },
      {
        time:"09:00–10:42", title:"遊船啟航 → Alpnachstad",
        tr:{ label:"SGV 遊船 09:12", icon:"ship" }, stp:"free",
        steps:[
          "走到 Luzern Bahnhofquai 碼頭（通常 2 號）",
          "🥇 硬規則：只搭能銜接 11:10 齒軌的船班（09:12 出發、10:42 抵達）"
        ],
        defense:[
          "推車直接推上船，坐一樓（二樓為頭等艙）",
          "🆘 若錯過船班：立刻放棄水路，改搭公車去 Kriens 逆時針上山"
        ],
        critical:[]
      },
      {
        time:"11:10–11:50", title:"世界最陡齒軌上山 ＋ 抵達轉場緩衝（現行模擬）",
        tr:{ label:"Pilatus 齒軌", icon:"train" }, stp:"half",
        steps:[
          "⏱️ 本段 11:10–11:50 為【購票／上車 → 齒軌上山 → 抵達下車轉場】的整段緩衝，不是純搭車時間",
          "🚞 純齒軌乘車時間：現行參考約 30 分鐘（Alpnachstad → Pilatus Kulm）；2027 正式時刻 🟡 PENDING",
          "下船後至售票處",
          "⭐ STP 分段購買原則：不要買整段 Golden Round Trip 套票（船 + Bus 對持 STP 者已 100% 免費會重複計價）",
          "  · 船段：STP 100% 免費（已完成）",
          "  · 齒軌上山：出示 STP 購 50% 半價票",
          "  · 空中纜車下山：出示 STP 購 50% 半價票",
          "  · Bus 1 號 Kriens→Luzern：STP 100% 免費",
          "走預約通道上車",
          "🥇 直奔整台列車的最後一節（車尾）視野最佳"
        ],
        defense:[
          "🟡 11:10 / 11:50 皆為 2026 現行班次模擬，非 2027 已確認時刻；2027 正式時刻表公布後重算",
          "推車必收折，大人抱緊寶寶",
          "耳壓對策：準備水或小零食讓寶寶咀嚼減壓",
          "耳壓不適哭鬧 5-10 分鐘屬正常",
          "⚠️ Pilatus 齒軌預約：pilatus.ch 官方措辭存在「強烈建議」與「不強制」不同措辭；強烈建議出發前於 pilatus.ch 訂位；2027 出發前確認是否成為強制",
          "🚨【交通票券 ≠ 座位預約】持有效交通票券仍可能需要另外辦理／購買座位預約；不視為 Golden Round Trip 套票自動包含齒軌座位預約。座位預約費現行約 CHF 5/人（幼童若不佔位通常免收）"
        ],
        critical:[]
      },
      {
        time:"11:50–14:30", title:"Pilatus Kulm 山頂視野與尋龍",
        tr:{ label:"步行/觀景", icon:"walk" }, stp:"none",
        steps:[
          "🥇 先衝 Esel 觀景台（中午前光線最穩）",
          "🥪 找好位置野餐（面湖景觀位）",
          "🐉 走龍之小徑收尾",
          "最後回餐廳喝熱可可暖身"
        ],
        defense:[
          "山頂氣溫低 10-15 度，務必穿防風外套",
          "山頂部分步道碎石路，推車稍吃力",
          "備案：天氣轉壞野餐改至室內餐廳"
        ],
        critical:[]
      },
      {
        time:"14:30–15:30", title:"高空撤退 → Kriens",
        tr:{ label:"大纜車+小纜車", icon:"cablecar" }, stp:"half",
        steps:[
          "搭大纜車 Pilatus Kulm → Fräkmüntegg（Panorama Gondola 路線；2027 精確班次待確認）",
          "轉四人小纜車降落至 Kriens 站"
        ],
        defense:[
          "小纜車稍搖晃，可推車",
          "咀嚼零食減壓策略再次啟動"
        ],
        critical:[
          "Fräkmüntegg 溜滑梯：2 歲寶寶絕對不能玩！",
          "溜滑梯自動售票機需信用卡 4 位數 PIN 碼，出國前先開通或準備瑞郎硬幣"
        ]
      },
      {
        time:"15:30–16:00", title:"1 號公車返回琉森",
        tr:{ label:"1 號公車", icon:"bus" }, stp:"free",
        steps:[
          "出纜車站步行下坡至 Kriens, Zentrum Pilatus 站牌",
          "搭 1 號公車回琉森火車站約 15 分鐘"
        ],
        defense:["下坡路推車務必拉好防爆衝手環或煞車"],
        critical:[]
      }
    ],
    backup: {
      title:"Day 4 備案（A/B 二擇一）",
      trigger:"皮拉圖斯山頂 Webcam 顯示白牆時啟動；前一晚 20:00 判斷",
      tl:[
        {
          time:"備案 A", title:"Oeschinensee 單點深度日（Pilatus 白牆但低海拔乾燥）",
          tr:{ label:"BLS + 山頂纜車", icon:"cablecar" }, stp:"half",
          steps:[
            "上午 BLS 從琉森出發，經 Bern/Spiez 至 Kandersteg",
            "12:00-12:30 抵山頂纜車站",
            "12:30-14:30 湖畔活動：步行/接駁下到湖畔約 30 分鐘 → 13:00-14:00 湖畔午餐 → 14:00-14:30 划船或湖畔散步二選一",
            "14:30 準時開始撤退（不是 15:30）",
            "約 15:00 回山頂纜車站",
            "約 15:30 回 Kandersteg 車站",
            "火車依 2027 班表返回琉森"
          ],
          defense:[
            "⚠️ Oeschinensee 現行需線上訂纜車 timeslot（2025 起）",
            "電動接駁 11:00-16:30（旺季至 17:30），每 30 分鐘或滿座才發車，優先服務行動不便者",
            "其他人可能需等候或直接步行 30 分鐘",
            "接駁費率 CHF 10/成人、CHF 8/兒童（單程，非 STP 涵蓋），2027 出發前確認",
            "湖畔步道整體平緩，靠懸崖側路面有碎石"
          ],
          critical:[
            "🚨 14:30 準時開始撤退硬規則！不是 15:30！山區傍晚起冷風且班表回程有限"
          ]
        },
        {
          time:"備案 B", title:"琉森室內日（真正持續下雨）",
          tr:{ label:"步行/公車", icon:"walk" }, stp:"free",
          steps:[
            "⚠️ Day 3 若已完整參觀 Verkehrshaus，Day 4 雨天備案 B 不重複",
            "主打：Rosengart 美術館 + Bourbaki Panorama + KKL 大廳 + 舊城拱廊",
            "KKL 建築師是 Jean Nouvel（2008 普立茲克獎，1995-2000 建造，音響顧問 Russell Johnson）",
            "Verkehrshaus 夏季開放時間 10:00-18:00（不是 09:30 開門）",
            "舊城拱廊多雨可避，Kapellbrücke 有頂棚"
          ],
          defense:[
            "室內展館多數推車可推，Bourbaki Panorama 有電梯",
            "KKL 大廳免費開放，午餐可在大廳附設咖啡"
          ],
          critical:[]
        },
        {
          time:"逆時針 B 計畫", title:"🆘 Kriens 上山逆時針路線（早上天氣不佳／錯過船班／起不來）",
          tr:{ label:"Bus 1 + 纜車 + 齒軌", icon:"cablecar" }, stp:"half",
          steps:[
            "捨棄遊船：早上直接從琉森火車站搭 1 號公車到 Kriens, Zentrum Pilatus（Bus 1 號 STP 100% 免費）",
            "纜車上山：Kriens 纜車隨到隨搭（不需預約）→ Fräkmüntegg 換 Dragon Ride 空中纜車 → Pilatus Kulm",
            "火車下山：山頂玩夠後搭齒軌火車下山到 Alpnachstad",
            "回程：Alpnachstad → Luzern，可搭船或 SBB S-Bahn 火車約 20 分鐘（STP 皆 100% 免費）"
          ],
          defense:[
            "STP 現場出示買纜車／齒軌半價票",
            "⚠️ 齒軌下山段官方仍強烈建議座位預約，尤其週末好天氣；未預約可能長時間等候（尖峰）"
          ],
          critical:[
            "🚨【B 計畫啟動時的預約決策｜務必先處理，勿假設自動沿用】主方案預約的是「Alpnachstad → Pilatus Kulm 上山」齒軌座位；B 計畫走的是「Pilatus Kulm → Alpnachstad 齒軌下山」，方向相反。上山方向的預約【不會自動適用於下山方向】",
            "啟動 B 計畫當天必須先確認三件事：① 原上山預約是否需要取消（避免無故 no-show 或費用損失）② 下山方向是否需要另行取得座位預約 ③ 改訂管道與可否當日辦理（pilatus.ch 線上／現場櫃檯）",
            "⚠️ 2027 實際預約政策與可否更改，於開放預約時向 pilatus.ch 確認"
          ]
        },
        {
          time:"補充", title:"Trümmelbach 4 歲以下禁入（safety reasons）",
          tr:{ label:"備註", icon:"info" }, stp:"none",
          steps:[
            "本團原則不排 Trümmelbach（妞妞 2 歲半不得入內）",
            "若成人組願拆隊：1-2 大人可利用 Mürren 下山空檔前往",
            "其他人陪妞妞在 Lauterbrunnen 主街或 Talmuseum 谷地博物館"
          ],
          defense:[],
          critical:[]
        }
      ]
    }
  },

  {
    day:5, date:"09/18 (六)", loc:"格林德瓦 Grindelwald", theme:"重裝大遷徙日",
    hotelKey:"grindelwald",
    tl:[
      {
        time:"09:15–10:06", title:"琉森拔營 ＋ LIE 景觀線",
        tr:{ label:"退房＋前往車站", icon:"walk" }, stp:"none",
        steps:[
          "預計 09:15 離開；Booking 標示退房時段為 10:00–11:00，09:15 早於該時段，提前退房／還鑰匙流程尚待住宿方確認",
          "09:30 抵達車站，09:50 前往月台卡位",
          "全團只帶過夜包 + 推車（5 件大行李 Day 3 已寄送）",
          "電子看板顯示「Luzern-Interlaken Express」或「zb」"
        ],
        defense:[
          "🎫 主方案：建議預約 Luzern-Interlaken Express 座位",
          "2027 夏季預約開放後，透過 Zentralbahn 官方指定座位預約系統辦理",
          "2027/9 預約費率待官方公布（STP 涵蓋列車本身，座位預約費另計）",
          "若未預約仍可持 STP 搭乘，但不保證有座位，此為備援方案"
        ],
        critical:[]
      },
      {
        time:"10:06–12:00", title:"LIE 全景景觀線 → Interlaken Ost",
        tr:{ label:"Luzern-Interlaken Express", icon:"train" }, stp:"free",
        steps:[
          "🥇 全員鎖定「行車方向右側」座位！龍疆湖與湖光山色全在右邊",
          "沿途經過 Sarnersee、Lungerersee（愛的迫降取景地）",
          "到站前 5 分鐘 SBB App 會提示，全員推行李至車門邊預備"
        ],
        defense:["現代化全景大窗車廂，視野極佳","班次時間以 2027 SBB App 為準"],
        critical:[]
      },
      {
        time:"12:00–13:00", title:"BOB 轉乘至 Grindelwald",
        tr:{ label:"BOB 黃綠山地列車", icon:"train" }, stp:"free",
        steps:[
          "12:00 LIE 抵 Interlaken Ost，跟 Grindelwald 指標換月台",
          "轉乘時間 4-30 分鐘（依 2027 SBB 班次為準）",
          "上車後鎖定左側座位（艾格北壁逐漸放大）",
          "約 35 分鐘抵達 Grindelwald 終點站"
        ],
        defense:[
          "SOP：① 看月台指標「往 Grindelwald」 ② 車廂外電子目的地必須顯示「Grindelwald」 ③ 上車前再次確認",
          "前一晚 SBB App 查當日實際月台配置",
          "全團只有過夜包 + 推車，移動壓力大幅降低（5 件大行李 Day 3 已寄達 Grindelwald 車站）"
        ],
        critical:[
          "🚨 BOB 列車可能於 Zweilütschinen 分流；最終以車廂外電子目的地顯示「Grindelwald」為準，不預設固定前段、後段或固定 Sector",
          "上車前確認當日月台顯示與車廂電子目的地"
        ]
      },
      {
        time:"13:00–15:00", title:"抵達格林德瓦 ＋ 領 SBB 行李（入住前等待時段）",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "出 Grindelwald 車站",
          "🥇 兵分兩路：Morris 輕裝依 Interhome 最終 key collection instructions 執行（office 領取／密碼鎖 lockbox／self check-in 未確認前不預設；出發前以住宿方說明為準）",
          "家人（Emily/皮皮/Milo+妞妞）在車站 SBB Luggage 櫃台領 5 件大行李",
          "📸 車站前廣場拍第一張全家合照，背景就是艾格北壁",
          "⏳ 13:00–15:00 為入住前等待時段：可在車站周邊 / Coop / 咖啡店休息",
          "🕒 Sans Souci W1 check-in 時段為 15:00–17:00，15:00 前不得預設可進入公寓"
        ],
        defense:[
          "SBB Luggage reclaim 時段依 Grindelwald 分站公告為準（非全網統一時段）；2027 出發前 3 個月至 sbb.ch 分站頁確認",
          "🟡 PENDING：13:00–15:00 的 5 件行李寄放安排尚未確認，不得自行假定 Interhome 一定可代寄放",
          "🟡 PENDING：key collection 實際方式（辦公室領取 / 密碼鎖 / self check-in）待訂房確認",
          "備援：若行李無處寄放，可先留在車站行李櫃台或請家人分批看顧，等 15:00 後一次搬入",
          "Sans Souci W1 位於 cul-de-sac 死巷，無車流、安靜（距車站 300m）"
        ],
        critical:[
          "🚨 Check-in 15:00–17:00；未取得鑰匙、未到入住時間前不得進入公寓/陽台/私人區域",
          "🚨 妞妞午睡不可預設在公寓進行；15:00 前請用推車或車站休息區安排",
          "Interhome 精確門牌地址與 key collection 最終方式／地點仍為 Pending，依住宿方最終 instructions 為準"
        ]
      },
      {
        time:"15:00–17:00", title:"正式 Check-in ＋ 小鎮場勘 ＋ Coop 大採買",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "沿主街 Dorfstrasse 散步：超市 Coop、餐廳、纜車站、火車站",
          "至 Coop 大採買（今晚晚餐+早餐+接下來自炊食材+葡萄酒）",
          "妞妞推回 Sans Souci W1 休息（距 Coop 僅 50m）",
          "大人輪流補貨"
        ],
        defense:[
          "格林德瓦 Coop 比一般村莊大很多",
          "週六正常營業 08:00-19:00",
          "預算約 CHF 250-350",
          "Sans Souci W1 距 Coop 50m、距室內游泳池 100m、距兒童遊樂場 100m、距主車站 300m"
        ],
        critical:[]
      },
      {
        time:"17:00–21:00", title:"自炊晚餐 ＋ 早睡儲備",
        tr:{ label:"公寓", icon:"home" }, stp:"none",
        steps:[
          "自炊晚餐：培根義大利麵、起司沙拉、烤蔬菜",
          "21:00 前讓妞妞入睡"
        ],
        defense:[
          "🎉 大遷徙完成！連住 5 晚不用再搬大行李",
          "妞妞亢奮可陽台看艾格峰夜景"
        ],
        critical:[]
      }
    ]
  },

  {
    day:6, date:"09/19 (日)", loc:"格林德瓦 Grindelwald", theme:"Mürren 懸崖村 ＋ Allmendhubel 高山遊樂場",
    hotelKey:"grindelwald",
    tl:[
      {
        time:"09:15–10:15", title:"BOB 輕裝出擊 → Lauterbrunnen",
        tr:{ label:"BOB 經 Zweilütschinen", icon:"train" }, stp:"free",
        steps:[
          "輕裝出門，大行李全留木屋；路上到 Coop 買野餐食材（三明治、水果、餅乾、水）",
          "🚂 從 Grindelwald 主車站搭 BOB 往下山方向（Sans Souci W1 走 300m / 約 4 分鐘）",
          "在 Zweilütschinen 站下車（約 23 分鐘）",
          "同月台或鄰近月台轉往 Lauterbrunnen 上山方向（約 5 分鐘等車）",
          "約 10:12 抵 Lauterbrunnen；走出車站正對面就是 BLM 纜車站"
        ],
        defense:[
          "輕裝原則：後背包+推車+野餐午餐+妞妞尿布 1 天份",
          "回程一樣 Zweilütschinen 轉車",
          "📱 前一晚 SBB App 確認 Zweilütschinen 轉乘月台",
          "💡 週日紅利：Grindelwald Coop 週日仍開至 18:30-19:00"
        ],
        critical:["不要搭到 Interlaken Ost！那會多繞 40 分鐘冤枉路"]
      },
      {
        time:"10:15–11:00", title:"🚡 BLM 纜車 ＋ 山區小火車 → Mürren",
        tr:{ label:"BLM 纜車 + 山區小火車", icon:"cable" }, stp:"free",
        steps:[
          "過馬路到 BLM 纜車站（Lauterbrunnen 車站正對面，Bahnhofplatz 477）",
          "搭 BLM 纜車上 Grütschalp（約 4 分鐘）",
          "同建築內轉乘 BLM 山區小火車 → Mürren（約 12 分鐘）",
          "途經中間站 Winteregg（Top of Family 有兒童遊樂場，今日不下車）",
          "抵 Mürren BLM 站（村莊北端），走出車站左轉即是主街 Dorfstrasse"
        ],
        defense:[
          "BLM 纜車 + 山區小火車 STP 100% 涵蓋",
          "纜車車廂平坦，推車可直接推入",
          "山區小火車班距約 20 分鐘，實際依當日 BLM 官方班表"
        ],
        critical:[]
      },
      {
        time:"11:00–13:30", title:"🏘️ Mürren 懸崖無車村漫遊 ＋ 午餐",
        tr:{ label:"步行（無車山村；部分路段有坡度／不平）", icon:"walk" }, stp:"none",
        steps:[
          "Mürren 主街 Dorfstrasse 漫遊（無車村；村內核心區步行相對輕鬆，仍可能有坡度）",
          "傳統瑞士 chalet + 花圃陽台，正對艾格北壁 + 僧侶峰 + 少女峰",
          "村內有小型 Coop 可補給；午餐可野餐或於村內餐廳用餐",
          "用餐後散步到 Allmendhubel funicular 站（主街中段，步行 3-5 分鐘）"
        ],
        defense:[
          "全村無汽車，推車與幼兒走動安全度高",
          "⏱️ 實際停留時間依拍照、午餐與幼兒節奏調整（不預設固定分鐘數走完全村）",
          "村內平坦，妞妞可自行走一段消耗體力",
          "教堂旁小空地可讓妞妞跑跳"
        ],
        critical:[]
      },
      {
        time:"13:30–15:30", title:"🎠 Allmendhubel Flower Park（幼兒放電重點）",
        tr:{ label:"Allmendhubel funicular", icon:"cable" }, stp:"half",
        steps:[
          "13:30 到 Allmendhubel funicular 站（Mürren 主街中段）",
          "funicular 上山約 4 分鐘",
          "Flower Park 冒險遊樂場（60-75 分鐘）：滑梯、鞦韆、爬繩、學擠牛奶、土撥鼠洞",
          "隔壁 Water Labyrinth 水迷宮（9 月水溫較涼，注意鞋子別濕）",
          "Flower Trail 20 分鐘環狀 loop（推車友善，若妞妞還有體力）",
          "大人 Skyline Chill 躺椅看少女峰全景"
        ],
        defense:[
          "STP 為 50% 折扣（非免費）；2027 正式費率待官方公布",
          "Flower Trail 平坦環狀，150 種高山花卉沿途標示，沿途有小型兒童遊戲站",
          "妞妞可放電 1-1.5 小時，是本日核心安排"
        ],
        critical:[
          "Allmendhubel funicular 為 STP 半價，非免費，現場需另購票",
          "山上氣溫較 Mürren 低，備薄外套"
        ]
      },
      {
        time:"15:30–17:15", title:"🌸 下山 ＋ Staubbach 朝聖 ＋ 撤退回木屋",
        tr:{ label:"funicular → BLM 火車 → BLM 纜車 → BOB", icon:"train" }, stp:"free",
        steps:[
          "Allmendhubel funicular 下山（約 4 分鐘），出站後步行約 5–10 分鐘至 Mürren BLM 站，搭下一班往 Grütschalp（不硬綁固定班次；班距依 2027 Jungfrau／SBB timetable）",
          "BLM 山區小火車 → Grütschalp → BLM 纜車 → Lauterbrunnen",
          "Staubbach 快速朝聖約 25 分鐘：從 BLM 車站走到瀑布正對面約 5 分鐘（不用走到瀑布底）",
          "拍山村教堂 + 300m 高瀑布同框構圖",
          "約 16:30 回 Lauterbrunnen 車站搭 BOB → Zweilütschinen（5 分鐘）→ 轉車 → Grindelwald（23 分鐘）"
        ],
        defense:[
          "Staubbach 全程免費、步道平緩柏油路，推車友善",
          "若妞妞已累，可略過 Staubbach 直接搭 BOB 回程",
          "備案：Spielplatz Lauterbrunnen（村中心附近免費兒童遊樂場）可作為候車 buffer"
        ],
        critical:[
          "Trümmelbachfälle 官方規定 4 歲以下幼童（含背巾、抱在身上）一律不得入內；妞妞 2.5 歲會被擋下，本日不安排"
        ]
      },
      {
        time:"17:15–20:00", title:"木屋慢活 ＋ 自炊晚餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "回木屋洗個熱水澡，妞妞可能一整天很累，早點睡覺",
          "自炊晚餐：用 Day 5 採買的食材，簡單煮義大利麵/炒飯/微波熟食",
          "大人可輪流去 Grindelwald 主街散步或 Coop 補貨（週日開到 18:30-19:00）"
        ],
        defense:[
          "21:00 前務必讓妞妞入睡，保留體力迎接 Day 7 曼利申 Panorama Trail",
          "明天 Day 7 走 4.5 km Panorama Trail（Royal Walk 加碼 +1.5km 來回），是這趟最長健行日"
        ],
        critical:[]
      }
    ]
  },

  {
    day:7, date:"09/20 (一)", loc:"格林德瓦 Grindelwald", theme:"巨牛全景健行（曼利申）",
    hotelKey:"grindelwald",
    tl:[
      {
        time:"09:00–10:00", title:"前往 GGM 纜車站 Grindelwald Terminal",
        tr:{ label:"BOB + 步行", icon:"train" }, stp:"free",
        steps:[
          "早餐後輕裝出門",
          "從 Grindelwald 主車站搭 BOB 一站到 Grindelwald Terminal 站（zb 不營運此區段）",
          "Grindelwald Terminal 為 2020 啟用的獨立站，GGM Männlichen 纜車就在 Terminal 內",
          "跟 Männlichen（黃綠色標示）指標進站"
        ],
        defense:[
          "後背包裝水、能量棒、防曬乳、墨鏡、防風外套、妞妞替換衣物",
          "Grindelwald Terminal 與 Grund 為兩個不同站點，別搞混"
        ],
        critical:[
          "共構車站有 2 條纜車！今天搭 GGM（10 人座黃綠），不是 Eiger Express（26 人座紅黑）",
          "Eiger Express 是去艾格冰川/少女峰用的，方向完全不同"
        ]
      },
      {
        time:"10:00–10:30", title:"GGM 纜車直上曼利申（2,230m）",
        tr:{ label:"GGM 黃綠纜車", icon:"cablecar" }, stp:"half",
        steps:[
          "出示 STP 購 Grindelwald Terminal → Männlichen 單程半價票：2026 現行參考成人單程原價約 CHF 34，STP 50% 折扣後約 CHF 17/成人（妞妞免費）；2027 實際票價與折扣依官方最新資料確認",
          "妞妞免費",
          "搭 GGM 10 人座纜車，全程 19-20 分鐘",
          "⭐ 只買單程票：回程走 Panorama Trail 到 Kleine Scheidegg 再搭 WAB 火車回 Grindelwald"
        ],
        defense:[
          "推車折疊後可放置車廂中間",
          "氣壓對策：1,034m → 2,230m 耳壓變化明顯，備水或零食",
          "🥇 纜車爬升時往回看（朝山下），格林德瓦全景+艾格北壁同時收入眼底"
        ],
        critical:[]
      },
      {
        time:"10:30–13:00", title:"皇冠觀景台 ＋ 33 號 Panorama Trail",
        tr:{ label:"步行 4.5km + Royal Walk 1.5km", icon:"walk" }, stp:"none",
        steps:[
          "出 Männlichen 山頂站，先走 Royal Walk 上皇冠造型觀景台（加碼 +1.5 km 來回，15-20 分鐘）",
          "回主站跟黃色指標「Kleine Scheidegg」出發（33 號 Panorama Trail 本體 4.5 km）",
          "沿途右側是艾格、僧侶、少女峰三峰正面",
          "左側俯瞰格林德瓦谷地"
        ],
        defense:[
          "🥇 背巾為確定主方案：妞妞由父母輪流揹；運動型推車僅在出發前確認當日路況適合時才攜帶，主要作為裝備運輸車",
          "⚠️ 不把「推車上午睡」視為行程成立的前提條件——官方未對完整 Panorama Trail 的推車通行做明確保證",
          "緩下坡 2,230m → 2,061m，途中 3-4 段平緩段可放下妞妞自己走",
          "全程無遮蔽物，墨鏡+遮陽帽+防曬乳必備",
          "洋蔥穿搭：多帶薄外套輪流穿脫"
        ],
        critical:[
          "33 號步道為碎石礫石山徑，不是柏油路！",
          "2.5 歲妞妞不可能自己走完全程，連續搭推車 2.5 小時也會崩潰",
          "一般城市型推車完全不建議，輪子會卡石頭"
        ]
      },
      {
        time:"13:00–14:30", title:"小夏戴克雪山午餐（2,061m）",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "抵達 Kleine Scheidegg 火車轉運站",
          "找 Restaurant Grindelwaldblick 或 Bahnhof 露台用餐",
          "推薦：Goulash 高山牛肉紅酒湯、Schnitzel 炸豬排、Rösti 薯餅"
        ],
        defense:["午餐 13:00 後人潮稍退，是黃金時段"],
        critical:[]
      },
      {
        time:"14:30–16:00", title:"WAB 齒軌火車環線下山",
        tr:{ label:"WAB 紅色齒軌", icon:"train" }, stp:"half",
        steps:[
          "在 Kleine Scheidegg 月台確認車廂寫「Grindelwald」方向",
          "🚨 千萬不要搭錯往 Wengen 那班",
          "搭 WAB 紅色齒軌火車下山回 Grindelwald 車站（35 分鐘）"
        ],
        defense:["WAB 是 O 型環線完美收尾，車程平緩"],
        critical:[
          "🚨【已查證】 WAB Grindelwald ↔ Kleine Scheidegg 段 STP 僅 25% 折扣，不是免費",
          "原因：Kleine Scheidegg 非住人村莊，私營鐵路自定折扣，STP 持有者僅 25%（半價卡反而是 50%）",
          "需在售票處補差價，預算約 CHF 15-20/成人（2027 推估 CHF 18），已列入預算",
          "從 Kleine Scheidegg 下到 Grindelwald 全程約 35 分鐘，車程平緩，是 O 型環線完美收尾"
        ]
      },
      {
        time:"16:00–21:00", title:"木屋慢活 ＋ 豐盛自炊",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "回木屋，全員洗熱水澡放鬆腳部，妞妞午睡補眠",
          "自炊晚餐：烤雞+馬鈴薯泥+葡萄酒犒賞",
          "早睡，明天歷史齒軌列車日（SPB）"
        ],
        defense:["全景步道走完通常會讓妞妞與大人都疲憊，今晚不安排額外活動"],
        critical:[]
      }
    ]
  },

  {
    day:8, date:"09/21 (二)", loc:"格林德瓦 Grindelwald", theme:"行李寄送＋Schynige Platte 親子輕健行日（百年電力齒軌 SPB）",
    hotelKey:"grindelwald",
    tl:[
      {
        time:"08:00–09:15", title:"🛅 SBB 機場行李寄送 ＋ 輕裝出擊",
        tr:{ label:"步行至車站 + BOB", icon:"luggage" }, stp:"free",
        steps:[
          "前一晚 Day 7 已完成分裝",
          "約 07:45 Morris + Milo 從住宿出發 → 08:00 Grindelwald SBB luggage counter 開門後辦理 5 件行李寄送至 Zürich Flughafen（約 08:20–08:30 完成；2027 營業時間出發前再確認）",
          "Luggage dispatch 時段依 Grindelwald 分站公告為準（非全網統一時段）；2027 出發前 3 個月至 sbb.ch 分站頁確認實際時段",
          "寄送單填：起點 Grindelwald、終點 Zürich Flughafen、預計領取 9/24 (五) 中午",
          "現行 CHF 12 × 5 件 = CHF 60（2027 出發前確認）",
          "保留收據與寄物編號",
          "家人（Emily/皮皮/Milo+妞妞）09:00 出門直接在車站集合",
          "暫定 09:38 BOB → 抵 Wilderswil → SPB 上山（若接 10:25 SPB 只有 10 分鐘轉車過緊，建議退到 11:05 SPB 更從容）",
          "均為暫定班次；2027 出發前 SBB App 確認"
        ],
        defense:[
          "🥇 主要防禦邏輯：Day 11 兩次轉車會是災難，提前寄送機場",
          "Day 8 早交件 + Day 10 送達 + Day 11 絕對到位，容錯率高",
          "彈性：若擔心延誤可留妞妞包當保險，4 件寄送"
        ],
        critical:[
          "寄送前檢查：貴重物品、電池、鋰電池類產品全部抽出放隨身",
          "Day 11 領取收據務必分開放，避免遺失同時發生",
          "🚨 寄送機場的大行李內，絕不可放乳製品、副食品（SBB 規定 + 長途運送風險）",
          "妞妞所有食品全在隨身過夜包，不放寄送行李"
        ]
      },
      {
        time:"09:38–10:15", title:"🚂 BOB Grindelwald → Zweilütschinen → Wilderswil",
        tr:{ label:"BOB 黃綠色山地火車", icon:"train" }, stp:"free",
        steps:[
          "暫定 09:38 BOB Grindelwald → 約 10:00 Zweilütschinen（車程約 22 分鐘）",
          "同月台或鄰近月台轉車 → 約 10:15 抵 Wilderswil（總共約 37 分鐘）",
          "下山方向 BOB 不會拆解，兵分兩路壓力極低",
          "⚠️ 具體班次為現行參考；2027 時刻表公布後於 SBB App 重新確認"
        ],
        defense:[
          "若 09:38 班次 2027 有變，退到 10:08 也可（SPB 約 40 分鐘一班有緩衝）",
          "🥇 BOB 沿途左側偶見艾格北壁；右側是伯恩高地谷地",
          "妞妞背巾 + 推車皆可上車"
        ],
        critical:[
          "⚠️ 若接 10:25 SPB 只有約 10 分鐘轉車（帶妞妞＋推車＋買折扣票可能不夠）；若 09:38 準點抵 10:15 可搭 10:25 SPB，若延誤或動作稍慢則退到 11:05 SPB 更從容"
        ]
      },
      {
        time:"10:25–11:15", title:"🚞 百年電力齒軌 SPB 上山（Wilderswil → Schynige Platte 1,967m）",
        tr:{ label:"Schynige Platte Bahn（1893 開通・1914 電氣化）", icon:"train" }, stp:"half",
        steps:[
          "下 BOB 後跟「Schynige Platte Bahn」指標，齒軌月台就在 BOB 月台旁（步行約 1 分鐘）",
          "出示 STP 至售票處購買 50% 折扣票（暫定約 CHF 32/成人）；妞妞 6 歲以下免費",
          "暫定 10:25 SPB 上山（現行約 40 分鐘一班；2027 出發前確認 jungfrau.ch）",
          "車程約 50-53 分鐘 → 約 11:15 抵山頂",
          "全程齒輪卡進軌道的「咔噠咔噠」聲，是全瑞士最有時光感的高山體驗"
        ],
        defense:[
          "🥇 上山務必坐左側，可俯瞰 Brienzersee 與圖恩湖",
          "古董車廂窄，推車放車廂端部（請司機協助），妞妞由大人輪流抱",
          "氣壓：從 584m 上到 1,967m，準備水或零食讓妞妞咀嚼減壓"
        ],
        critical:[
          "🚨 SPB 車型澄清：1893 開通時為蒸汽，1914 電氣化，日常班次全部為百年電力機車。蒸汽特別班僅於特定日期運行，本行程不預設搭乘；2027 若公布符合旅行日期的特別班，再另行評估（jungfrau.ch）"
        ]
      },
      {
        time:"（依所選方案）",
        planRef:"day8_spb", planRole:"activity",
        title:"🌸🏔️ Schynige Platte 活動（A 家庭版 / B Bonus 健行版，二選一）",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "出 Schynige Platte 站後，依當日天氣、能見度、妞妞狀況與成人意願，於 A／B 二方案中擇一",
          "⭐ A 家庭預設主方案（11:15–下山前）：主觀景／Skywalk → Alpine Playground → 午餐／休息 → Naturkino 短環線 → Alpine Garden（永遠最後、Optional，視時間／體力／路況可略過）",
          "🏔️ B Bonus Plan：正式 Schynige Platte Panorama Hike，約 6 km、理想條件約 2.5–3 小時（11:15–14:15）",
          "📌 不確定時選 A。B 不是與 A 同等推薦的選項"
        ],
        defense:[
          "A：部分路面可能有碎石或不平整，非無障礙、非全程推車路線，必要時改用背架；不為走完整步道硬走",
          "B：推車不得視為行程交通工具，背巾為限定主策略；幼兒同行實際可能超過 3 小時",
          "ℹ️ 實際人潮依天氣、團客、假期與當日營運狀況而定，不以平日／假日推論"
        ],
        critical:[
          "🚨 B 方案啟動條件：天氣／能見度／步道狀況／成人體力／妞妞狀態全部理想才啟動；任一條件不理想直接回到 A"
        ]
      },
      {
        time:"（依所選方案）",
        planRef:"day8_spb", planRole:"lunch",
        title:"🍽️ 午餐（依所選方案：A 餐廳／B 野餐）",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "⭐ A 方案：Playground 之後往餐廳方向收尾，目標 13:00 前後進入 Hotel Restaurant Schynige Platte（Rösti 或 Älplermagronen）；午餐後再視狀況進行 Naturkino → Alpine Garden（Optional）",
          "🏔️ B 方案：午餐改為野餐，於健行途中視野良好處進行，不進餐廳"
        ],
        defense:[
          "A／B 午餐邏輯互斥，不可並存",
          "A 方案於 Playground 後往餐廳方向移動，目標約 12:30–13:00 進入午餐／休息；依 4 大人＋幼兒＋推車＋拍照＋如廁與現場狀況彈性調整，非硬性截止",
          "B 的野餐食材需於前一晚或當日早上先備妥"
        ],
        critical:[]
      },
      {
        time:"方案 A 14:30 ／ 方案 B 15:10 下山（依當日選定）",
        planRef:"day8_spb", planRole:"descent",
        title:"SPB 下山方案 A/B（需先選定；2027 SBB 為準）",
        tr:{ label:"Schynige Platte Bahn", icon:"train" }, stp:"half",
        steps:[
          "⭐ 方案 A：14:30 SPB 下山 → 約 15:20 抵 Wilderswil → 15:34 BOB → 約 16:07 Grindelwald",
          "⭐ 方案 B：15:10 SPB 下山 → 約 16:00 抵 Wilderswil → 16:04 BOB → 約 16:37 Grindelwald",
          "🥇 下山改坐右側，換另一邊視角俯瞰湖區",
          "SPB 末班時間依 2027 官方班表確認（不寫「不會錯過末班」絕對措辭）"
        ],
        defense:[
          "均為暫定班次；2027 出發前 SBB App 確認",
          "方案 A 較從容，妞妞下午精神較好；方案 B 給山上多 40 分鐘",
          "📌 現場請先在本卡片選定 A 或 B，Today 才會顯示正確的「目前正在／下一步」"
        ],
        critical:[]
      },
      {
        time:"（依所選方案）",
        planRef:"day8_spb", planRole:"town",
        title:"格林德瓦小鎮耍廢",
        tr:{ label:"BOB→步行", icon:"walk" }, stp:"none",
        steps:[
          "回 Grindelwald 後回公寓休息；妞妞是否午睡、睡多久，依當日睡眠、精神與晚間作息彈性決定",
          "大人輪流逛 Dorfstrasse 戶外用品店（Mammut、Bächli）",
          "喝下午咖啡、買瑞士巧克力伴手禮",
          "18:00 前回木屋準備自炊晚餐"
        ],
        defense:[
          "今天節奏比 Day 7 輕鬆，是「半休息日」",
          "為明天 First 山+Bachalpsee 儲備體力",
          "Bächli Bergsport 是瑞士最大連鎖戶外用品店",
          "⏱️ 起始時間依所選下山方案自動調整（A：16:07／B：16:37）"
        ],
        critical:[]
      },
      {
        time:"18:00–21:00", title:"自炊晚餐 ＋ 早睡備戰",
        tr:{ label:"公寓", icon:"home" }, stp:"none",
        steps:[
          "自炊晚餐：火腿起司義大利麵、烤蔬菜、葡萄酒",
          "21:00 前讓妞妞入睡"
        ],
        defense:["🥇 明天 Bachalpsee 倒影是全行程最美照片，早睡爭取上午黃金光線"],
        critical:[]
      }
    ]
  },

  {
    day:9, date:"09/22 (三)", loc:"格林德瓦 Grindelwald", theme:"First 倒影湖日（Bachalpsee）",
    hotelKey:"grindelwald",
    tl:[
      {
        time:"08:30–09:30", title:"前往 First 纜車站",
        tr:{ label:"步行/121 公車", icon:"walk" }, stp:"free",
        steps:[
          "早餐後出發，從木屋步行 10 分鐘至 Firstbahn 纜車站，或搭 121 公車（5 分鐘）",
          "在 Firstbahn 售票處出示 STP，購 50% 折扣來回票（約 CHF 35/成人，妞妞免費）"
        ],
        defense:[
          "後背包：兩瓶水、能量棒、薄外套與野餐午餐；幼兒移動主方案為背巾／背架，推車視當日路線與成人分工決定是否攜帶（非必帶）",
          "9 月底山頂可能少量殘雪，鞋子建議防水或厚襪",
          "🚨 SOS 撤退決策點：走到 1/3 路程（20-30 分鐘），若妞妞明顯疲累或哭鬧 → 原路折返，不勉強"
        ],
        critical:[
          "☀️ Bachalpsee 步道海拔 2,200m，全程零樹蔭、無遮蔽物，紫外線是平地兩倍",
          "山風冷涼會失去防備但皮膚已被烤傷"
        ]
      },
      {
        time:"09:30–10:00", title:"First 大纜車上山（2,168m）",
        tr:{ label:"First 大纜車", icon:"cablecar" }, stp:"half",
        steps:[
          "搭 6 人座大型纜車上山，全程 25 分鐘",
          "分三段：Bort → Schreckfeld → First",
          "回程計畫：中段在 Bort 站下車讓妞妞放電"
        ],
        defense:[
          "推車直接推進纜車不需折疊",
          "🥇 上山往行進方向左側看：格林德瓦谷地全景",
          "Bort Spielplatz 是妞妞今日「放電區」"
        ],
        critical:[
          "First 山上 First Flyer/Glider/Mountain Cart 全部年齡限制 6+/8+，妞妞不能參與",
          "出發前先決定「全部不玩」或「預留 CHF 100」，別現場一時興起打亂分工"
        ]
      },
      {
        time:"10:00–10:30", title:"First Cliff Walk 懸崖懸臂步道",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "出 First 站立刻看見 Cliff Walk 入口（45m 金屬懸臂步道）",
          "走出去站在最遠端透明延伸觀景台，腳下就是 800m 落差",
          "正前方是艾格北壁"
        ],
        defense:[
          "Cliff Walk 路面有金屬格柵，妞妞可能會害怕，大人抱著走完",
          "🥇 拍照黃金：上午 10 點前光線從東邊打來，艾格北壁細節清晰"
        ],
        critical:[]
      },
      {
        time:"10:30–12:30", title:"⭐ Bachalpsee 倒影湖健行",
        tr:{ label:"步行 3km 緩上坡", icon:"walk" }, stp:"none",
        steps:[
          "從 First 站跟黃色指標「Bachalpsee」出發",
          "⚠️ 前段是緩上坡碎石路 + 無遮蔽，累積約 100m 爬升分佈於 3km（官方定位為易走路線）",
          "帶妞妞於推車中連續顛簸 40-60 分鐘容易情緒不穩，這是最需要注意的路段",
          "過了起伏段路面趨於平緩，單程約 50 分鐘抵達湖畔",
          "沿湖畔走到對岸（環湖約 20 分鐘），找最佳構圖點拍三峰倒影"
        ],
        defense:[
          "🥇 全行程最美照片：若上午風平、無雲、光線齊備，可拍到三峰倒映湖面的經典構圖",
          "⚠️ 此為天氣條件苛刻的畫面，非到訪即得——不保證一定拍到",
          "湖水深綠中帶藍，是冰川融水，水溫極低不可下水",
          "🥇 主方案：嬰兒背巾為主，推車放水外套零食（省力 60%）"
        ],
        critical:[
          "海拔 2,168m → 2,265m 累積約 100m 爬升，官方定位為易走路線但無遮蔽",
          "2 歲幼童在推車內連續顛簸 40-60 分鐘容易情緒不穩",
          "白色碎石+湖面雙重反射，UV 比一般山頂再強，補防曬不能省"
        ]
      },
      {
        time:"12:30–13:30", title:"湖畔野餐 ＋ 妞妞放電",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "湖畔大石頭旁野餐（麵包、起司、水果、能量棒）",
          "妞妞可在草地自由活動：撿石頭、追小鳥、看高山植物"
        ],
        defense:[
          "高山風大，妞妞跑動時注意位置",
          "湖邊石頭有時濕滑",
          "Leave No Trace：垃圾全帶下山"
        ],
        critical:[]
      },
      {
        time:"13:30–16:30", title:"走回 First → Bort 中繼放電",
        tr:{ label:"步行 + 纜車", icon:"cablecar" }, stp:"half",
        steps:[
          "13:30 從 Bachalpsee 走回 First 站（50 分鐘）",
          "14:30 搭 First 纜車下山，中段在 Bort 站下車",
          "14:30-16:00 妞妞在 Bort 阿爾卑斯遊樂場放電",
          "16:00 搭纜車最後一段回到 Grindelwald"
        ],
        defense:[
          "🥇 Bort 才是格林德瓦最頂級的幼兒遊樂區（非 Pfingstegg，那邊滑道有 4 歲下限）",
          "Bort 海拔 1,560m，天氣較溫和"
        ],
        critical:["別直接坐纜車到底，中段 Bort 下車是妞妞放電區"]
      },
      {
        time:"16:30–21:00", title:"木屋休息 ＋ 晚餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "回木屋，全員洗熱水澡，妞妞放電後可能秒睡午覺",
          "大人輪流去主街採買甜點、葡萄酒",
          "自炊晚餐 Bachalpsee 健行",
          "21:00 前讓妞妞入睡"
        ],
        defense:[
          "🥇 妞妞 SOS Plan：Day 7-9 是連續 3 天高山日",
          "若 Day 8 已崩潰 → Day 9 直接放棄 First 山頂，改村內+Bort 遊樂場",
          "行程成功率取決於「彈性」，妞妞舒服比待辦清單重要"
        ],
        critical:[]
      }
    ]
  },

  {
    day:10, date:"09/23 (四)", loc:"格林德瓦 → Brienz → Interlaken", theme:"Brienz Rothorn 蒸汽火車 ＋ 晚餐（BRB 主題日，受固定班次限制）",
    hotelKey:"grindelwald",
    hasBackup: true,
    tl:[
      {
        time:"08:45–09:15", title:"木屋早餐 ＋ 取出野餐",
        tr:{ label:"公寓", icon:"home" }, stp:"none",
        steps:[
          "提早起床（8:00-8:15），今天要趕 09:18 BOB → 接 10:07 船",
          "從冰箱取出前一晚準備的野餐：瑞士起司、麵包、香腸、水果、巧克力、保溫瓶熱飲",
          "後背包：野餐+水+妞妞替換衣物+推車雨罩+山頂保暖外套"
        ],
        defense:[
          "🥇 Day 10 為 BRB 主題日，受固定班次限制，非機動天",
          "🎯 三大調度原則：① Day 7/8/9 可視天氣互換（高山日靈活調度） ② Day 10 原則上鎖 BRB（受固定班次） ③ 只有 BRB 停駛才啟動 Day 10 專屬備援",
          "旺季偶爾改柴油機車，但景觀相同",
          "💡 山頂野餐配 693 山峰大景，比餐廳更有"
        ],
        critical:[
          "Rothorn Kulm 海拔 2,244m，9 月底可能 5-10°C 且風大",
          "妞妞與大人各帶一件防風厚外套"
        ]
      },
      {
        time:"09:15–10:00", title:"🚂 BOB → Interlaken Ost → 湖船碼頭",
        tr:{ label:"BOB", icon:"train" }, stp:"free",
        steps:[
          "09:18 BOB Grindelwald → 09:53 抵 Interlaken Ost",
          "出 Ost 站後跟「Schifffahrt / Boat」指標步行 3-5 分鐘",
          "抵達 Interlaken Ost (See) 碼頭（就在車站後方阿勒河上）",
          "推車直接推上船，無須折疊"
        ],
        defense:[
          "前一晚 SBB App 確認 09:18 BOB 班次",
          "妞妞 2.5 歲在所有瑞士交通工具上免費（6 歲以下規則）"
        ],
        critical:[]
      },
      {
        time:"10:07–11:22", title:"🚢 BLS 船遊布里恩茨湖 (75 分鐘體驗)",
        tr:{ label:"BLS 湖船", icon:"ship" }, stp:"free",
        steps:[
          "10:07 上船（前一晚 SBB App 確認實際班次）",
          "沿途經過 Bönigen、Ringgenberg、Niederried、Iseltwald、Giessbach",
          "不要下船——目標是 Brienz 終點站接蒸汽火車",
          "11:22 抵 Brienz (See) 碼頭",
          "下船後走 3-5 分鐘到 Brienz Rothorn Bahn 山谷車站"
        ],
        defense:[
          "🥇 沒去過 Brienz 湖的旅伴福利：75 分鐘船程是經典 Berner Oberland 體驗",
          "冰河翡翠綠湖水是布里恩茨湖獨有奇景",
          "📸 11:00 左右經過 Giessbach 瀑布，14 層階梯瀑布從船上仰望最壯觀",
          "💡 Morris + Emily：2023 蜜月已造訪 Iseltwald 玄彬碼頭，遠眺即可"
        ],
        critical:[
          "極限 8 分鐘轉乘：11:15 提早收折推車，全團在船艙出口/上層甲板下船通道待命",
          "一靠岸立刻下船，跟 Rothorn Bahn 指標走 3-5 分鐘",
          "湖畔簡單補給／點心（不安排正式午餐，主要午餐保留至 Rothorn Kulm 山頂野餐）"
        ]
      },
      {
        time:`${BRB_DAY_PLAN.boatArriveBrienz}–${BRB_DAY_PLAN.chosenUpDeparture} 集合 / 上車`, title:"🚂 BRB 票務／進站手續 ＋ 上車（2026 班表模擬）",
        tr:{ label:"BRB 齒軌", icon:"train" }, stp:"half",
        steps:[
          "⚠️ 2026 官方班次：07:36、08:36、09:40、10:45、11:45、12:58、13:58、14:58、16:36（非每小時等距）",
          `湖船 ${BRB_DAY_PLAN.boatArriveBrienz} 抵 Brienz 後，本模擬選擇 ${BRB_DAY_PLAN.chosenUpDeparture} 這班上山（buffer 約 ${(() => { const [h1,m1]=BRB_DAY_PLAN.boatArriveBrienz.split(":").map(Number); const [h2,m2]=BRB_DAY_PLAN.chosenUpDeparture.split(":").map(Number); return (h2*60+m2)-(h1*60+m1); })()} 分鐘）`,
          "實際是否需要換票，依所購產品與 2027 BRB 官方流程為準",
          "BRB turnstile 現行約於發車前 30 分鐘開放；若所購產品需要辦理票務手續，應額外預留時間",
          BRB_DAY_PLAN.reservationPolicy.ticketingNote,
          "櫻桃紅車廂 + 深綠齒軌機車，齒輪咬合聲是 2 歲半妞妞的瑞士記憶",
          "中途 Planalp 站短停數分鐘"
        ],
        defense:[
          `📌 ${BRB_DAY_PLAN.reservationPolicy.text}`,
          `${BRB_DAY_PLAN.reservationPolicy.fareNote}；${BRB_DAY_PLAN.reservationPolicy.childNote}`,
          "⚠️ 車型：1893 開通蒸汽；旺季偶爾改柴油機車，2027 出發當日查官網",
          `🟡 本日 BRB 所有絕對時間為 ${BRB_DAY_PLAN.statusLabel}，2027 官方班表公布後需整段重算`,
          `📐 相對時間框架：湖船抵 Brienz → 至少 ${BRB_DAY_PLAN.minBufferMinutes}-${BRB_DAY_PLAN.recommendedBufferMinutes} 分鐘 buffer → 已選 BRB 班次 → 約 ${BRB_DAY_PLAN.ascentMinutes} 分鐘登頂 → 山頂約 ${BRB_DAY_PLAN.summitStayMinutes} 分鐘 → 已選下山班次 → Brienz → Barry's`,
          `🆘 ${BRB_DAY_PLAN.connectionFallback.trigger} → ${BRB_DAY_PLAN.connectionFallback.actions.join("；")}`
        ],
        critical:[
          "BRB 車廂走道極度狹窄，推車無法推入車廂",
          "折疊後交由站務員放置於「專屬行李車廂」",
          "大人必須全程抱著妞妞搭乘（不能坐推車）",
          "建議 Ergo/Beco 舒適背巾備用，約 60 分鐘上山比想像中久"
        ]
      },
      {
        time:`${BRB_DAY_PLAN.chosenUpDeparture}–${BRB_DERIVED.summitArrive}`, title:"🚂 蒸汽齒軌上山（約 60 分鐘）",
        tr:{ label:"BRB 蒸汽齒軌", icon:"train" }, stp:"half",
        steps:[
          `${BRB_DAY_PLAN.chosenUpDeparture} 發車，官方上山約 ${BRB_DAY_PLAN.ascentMinutes} 分鐘`,
          `約 ${BRB_DERIVED.summitArrive} 抵 Rothorn Kulm (2,244m)，山頂車站走 1 分鐘就是觀景台`,
          "中途 Planalp 站短停，可看蒸汽機車加水"
        ],
        defense:[
          "車廂每間約 8 人，走道窄；上車後先安置好妞妞再放隨身包",
          `🟡 ${BRB_DAY_PLAN.statusLabel}`
        ],
        critical:[]
      },
      {
        time:`${BRB_DERIVED.summitArrive}–${BRB_DERIVED.summitLeave}`, title:"🏔️ Rothorn Kulm 山頂（約 1.5 小時 · 693 山峰 + 野餐）",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "觀景台拍照：北看皮拉圖斯、瑞吉、鐵力士；南看艾格、僧侶、少女峰；下方俯瞰布里恩茨湖",
          "找大石頭或景觀椅野餐：瑞士起司、麵包、香腸、水果 + 保溫瓶熱可可",
          "餐後 5-10 分鐘短步道散步，妞妞放電",
          `${BRB_DERIVED.summitLeave} 前收拾野餐，5 分鐘走回車站搭下山班次`
        ],
        defense:[
          "🥇 全行程最廣景觀：鳥瞰式大範圍",
          "山頂步道平緩短小，推車可推 80% 路段",
          "山頂 Berghotel Rothorn Kulm 餐廳可作備案",
          `🟡 山頂停留長度依當日實際上下山班次調整；本模擬為 ${BRB_DAY_PLAN.summitStayMinutes} 分鐘`
        ],
        critical:[
          "🚨 山頂體感溫度防禦・無條件撤退預案",
          "判斷標準：出蒸汽火車車站瞬間 — 若寒風刺骨（皮膚立即發麻、身體發抖）",
          "→ 立刻放棄戶外野餐，全團無條件撤退至 Berghotel Rothorn Kulm 室內餐廳（4 大約 CHF 120-160，妞妞兒童餐 CHF 15）",
          "幼童體溫調節能力遠低於成人，妞妞若在 5°C 大風環境下 15 分鐘就可能失溫",
          "判斷者：Emily 抱妞妞出車站時的即時感受最準"
        ]
      },
      {
        time:`${BRB_DERIVED.summitLeave}–${BRB_DERIVED.brienzBack}`, title:"🚂 蒸汽火車下山（約 60 分鐘）",
        tr:{ label:"BRB 蒸汽齒軌", icon:"train" }, stp:"half",
        steps:[
          `${BRB_DERIVED.summitLeave} 火車下山（來回票同時涵蓋上下山）`,
          "下山時蒸汽機車變成拉著車廂下山，重力聲更明顯",
          "妞妞可能在下山時睡著（搖晃+引擎節奏=天然搖籃）",
          `約 ${BRB_DERIVED.brienzBack} 抵 Brienz BRB 山谷車站`
        ],
        defense:[
          "下山車廂位置會調換，建議坐朝向湖景那一側",
          "妞妞午睡時段被切斷，下山火車是補眠最佳時機",
          `🟡 ${BRB_DAY_PLAN.statusLabel}`
        ],
        critical:[]
      },
      {
        time:`${BRB_DERIVED.brienzBack}–${BRB_DERIVED.souvenirEnd}`, title:"🏘️（Optional Bonus）Brienz 木雕村紀念品快速採購",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "Brienz 是瑞士木雕家鄉，主街上有木雕工坊",
          "推薦：木雕牛、聖伯納犬擺飾、阿爾卑斯山玩具、牛鈴",
          "約 20 分鐘快速採購——挑小件，避免大型作品",
          "⚠️ 若當日下山班次較晚，此段可整段略過直接搭車回程"
        ],
        defense:[
          "🥇 Brienz 木雕品質遠勝格林德瓦觀光區，價格較合理",
          "🚨 Optional Bonus：僅在 BRB 順利／下山準時／妞妞狀態佳／回程 buffer 充足時才執行；不得壓縮 BRB、回 Grindelwald 銜接、Barry's 晚餐與休息。時間偏緊直接整段跳過",
          "5 件大行李已寄送機場，紀念品裝過夜包或請店家國際寄送",
          `🟡 ${BRB_DAY_PLAN.statusLabel}`
        ],
        critical:[]
      },
      {
        time:`${BRB_DERIVED.sbbDepart}–${BRB_DERIVED.sbbArriveIntO}`, title:"🚂 SBB 火車回 Interlaken Ost（約 16 分鐘）",
        tr:{ label:"SBB IR", icon:"train" }, stp:"free",
        steps:[
          `約 ${BRB_DERIVED.sbbDepart} SBB 火車從 Brienz 出發 → 約 ${BRB_DERIVED.sbbArriveIntO} 抵 Interlaken Ost`,
          "回程選火車不選船——船 75 分鐘 vs 火車約 16 分鐘",
          "火車沿布里恩茨湖南岸行駛，仍可看湖景（右側座位）",
          "⚠️ Day 5 已看過三峰，不再繞 Höheweg 大道，直接接 BOB 回 Grindelwald"
        ],
        defense:[
          "去程船已體驗過，回程節省時間",
          "📱 現場以 SBB App 查當日實際班次為準"
        ],
        critical:[]
      },
      {
        time:`${BRB_DERIVED.bobDepart}–${BRB_DERIVED.bobArriveGrin}`, title:"🚂 BOB 回 Grindelwald",
        tr:{ label:"BOB", icon:"train" }, stp:"free",
        steps:[
          "轉乘 BOB Interlaken Ost → Grindelwald",
          "⚠️ 以車廂外電子目的地顯示「Grindelwald」為準（不預設固定前段、後段或固定 Sector）",
          "抵達後步行到 Sans Souci W1（距車站 300m）"
        ],
        defense:["推車裝著紀念品，5 件大行李已在機場等候，全團只有過夜包"],
        critical:[]
      },
      {
        time:`${BRB_DERIVED.bobArriveGrin}–18:45`, title:"妞妞補眠 ＋ 行李整理",
        tr:{ label:"公寓", icon:"home" }, stp:"none",
        steps:[
          "妞妞補眠 30-60 分鐘",
          "大人輪流整理行李：Day 11 早上出發前 95% 必須完成",
          "紀念品分裝、充電器今晚最後一次使用"
        ],
        defense:[
          "清單檢查：護照、訂房憑證、機票、STP、現金、信用卡"
        ],
        critical:[
          "⚠️ 洗衣膠囊建議放入託運行李、裝入硬殼保鮮盒；避免放隨身登機包（依當年度隨身液體/凝膠限制與各機場安檢實務為準）"
        ]
      },
      {
        time:"19:00–21:30", title:"🍴 Barry's 起司鍋晚餐（建議訂位 19:00–19:30）",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "18:30-19:00 換正式裝、洗熱水澡，推妞妞出發 Barry's",
          "19:00 訂位入座；若因 BRB 實際班表返家過晚，改 19:30 或延後",
          "妞妞專屬：無酒版 Älplermagronen + 蘋果泥（服務生確認無酒精）",
          "大人：起司火鍋 Fondue Moitié-Moitié + Raclette",
          "配瑞士本地啤酒或瓦萊州 Fendant 白酒",
          "甜點：自製蘋果派或冰淇淋盤",
          "21:30 散席回 Sans Souci W1，最後行李檢查後早睡"
        ],
        defense:[
          "🥇 10 天行程最後一頓正式晚餐",
          "整理過去 10 天記憶點：龍疆湖、皮拉圖斯山頂、勞特布魯嫩谷地、曼利申全景、施尼格普拉特、Bachalpsee、Brienz Rothorn 齒軌火車、布里恩茨湖船",
          "每人投票「最難忘的一幕」"
        ],
        critical:[
          "🚨 幼兒酒精警告：道地瑞士起司火鍋熬煮時加白酒 + Kirsch 櫻桃酒",
          "加熱後仍殘留酒精，妞妞絕對不能食用任何鍋內食物",
          "沾過鍋的麵包、馬鈴薯、蔬菜都不能給妞妞吃"
        ]
      }
    ],
    backup: {
      title:"Day 10 備案：Brienz Rothorn 停駛時啟動",
      trigger:"9 月下旬 Rothorn (2244m) 常見大風/濃霧，出發當日早上務必查詢 brienz-rothorn-bahn.ch 首頁營運狀態",
      tl:[
        {
          time:"備案 A", title:"布里恩茨湖遊船 ＋ Brienz 木雕村深度",
          tr:{ label:"BOB → 船 → SBB", icon:"ship" }, stp:"free",
          steps:[
            "09:18 BOB Grindelwald → 09:53 Interlaken Ost",
            "10:07 船 → 11:22 抵 Brienz（保留原船遊）",
            "11:30-14:00 Brienz 湖畔午餐 + 木雕村深度逛",
            "15:35 火車 → 15:51 Interlaken Ost（接原路線 Höheweg + Barry's）"
          ],
          defense:["Brienz 木雕村值得慢慢逛，是備案裡的高品質選項"],
          critical:[]
        },
        {
          time:"備案 B", title:"因特拉肯市區深度",
          tr:{ label:"BOB", icon:"train" }, stp:"free",
          steps:[
            "全日在 Interlaken 深度玩",
            "Höheweg 大道 + Höhematte 草坪",
            "Harder Kulm 纜車（若晴）",
            "賭場周邊逛街",
            "16:34 BOB 回 Grindelwald 接 Barry's 晚餐"
          ],
          defense:["湖邊天氣也差時採用此備案"],
          critical:[]
        }
      ]
    }
  },

  {
    day:11, date:"09/24 (五)", loc:"蘇黎世機場 ZRH", theme:"賦歸與機場幹線",
    hotelKey:"grindelwald",
    tl:[
      {
        time:"07:00–08:30", title:"格林德瓦早餐 ＋ 退房 ＋ 前往車站",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "07:00 起床，用 Day 10 剩下食材吃早餐",
          "08:00–08:15 完成退房並離開；清點 4 個過夜包 + 推車 + 隨身包 + 妞妞 + 護照後，立即從 Sans Souci W1 推行李走 300m 至 Grindelwald 主車站（步行約 4-5 分鐘），抵站後等待 08:49 BOB"
        ],
        defense:[
          "🥇 V21.3b 主方案時段大幅提前：08:49 BOB → 目標 11:15-11:45 抵達 Zürich Flughafen",
          "12:14 抵達降為錯過主班時的備援（不再是主方案）",
          "退房時依住宿方退房規定處理垃圾（不宣稱可節省清潔費）"
        ],
        critical:[
          "🔑 鑰匙返還（key return）方式待 Interhome 確認：不得預設 dropbox、辦公室一定可還、或 self-return 一定可行；出發前以住宿方最終說明為準"
        ]
      },
      {
        time:"08:49–11:15", title:"長途撤退 → 蘇黎世機場（主方案）",
        tr:{ label:"BOB → IC 城際列車", icon:"train" }, stp:"free",
        steps:[
          "08:49 BOB 從格林德瓦發車（暫定；2027 SBB App 確認）",
          "抵 Interlaken Ost 後跟 Bern / Zürich Flughafen 指標換月台",
          "🥇 SBB App 篩選鎖定「via Bern」班次（Grindelwald→Bern 車程約 1.5 小時量級，依 2027 SBB 確認）",
          "🥇 Bern 轉乘是否同月台、實際 Platform／Sector／車廂編組，一律以當日 SBB App／車站電子看板為準，不預設固定值",
          "目標 11:15-11:45 抵達 Zürich Flughafen",
          "備援班次：12:14 抵達（錯過主班時使用）"
        ],
        defense:[
          "只有過夜包 + 推車，兵分兩路壓力極低",
          "🦖 家庭車廂 FA：部分 IC 雙層列車設有 FA（二樓兒童遊戲區），但不預設一定掛車，以當日實際編組為準",
          "所有具體班次時刻為現行參考；2027 出發前 SBB App / 官網確認實際"
        ],
        critical:[
          "千萬避開「via Zürich HB」班次——全瑞士最大車站對推車家庭極不友善"
        ]
      },
      {
        time:"11:45–13:30", title:"🛅 領取 SBB 寄送 ＋ 退稅 ＋ Emirates Check-in",
        tr:{ label:"機場內步行", icon:"luggage" }, stp:"none",
        steps:[
          "🥇 第一動作 · SBB 領行李：直奔 SBB 行李櫃台（機場火車站 Level -2 或 -1，跟 Gepäck 指標）",
          "出示 Day 8 寄送收據 + 護照，領取 4 或 5 件大行李（主策略全寄 5 件；若採「留妞妞包」彈性則為 4 件）",
          "第二動作 · 退稅（若有）：Global Blue 退稅櫃檯（Level 2 出境大廳）；13:00 為退稅明確放棄時間點",
          "第三動作 · Emirates Check-in（保守目標 12:30-13:30 完成）",
          "推車保留使用至登機口，再依 Emirates / Zürich Airport 當日流程交運",
          "兵分兩路：Emily 帶妞妞+推車在 SBB 櫃台旁等；3 大人領行李後推去 Emirates 集合"
        ],
        defense:[
          "時間軸驗證：11:15-11:45 抵達 → 領行李 → 退稅 → 12:30-13:30 check-in 完成 → 14:00 過安檢",
          "⚠️ ZRH 實體 check-in / bag-drop 截止時間以 2027 電子機票及 Emirates / Zürich Airport 當日規則為準（不設為硬截止推論）",
          "推車流程統一：若現場要求於 check-in 櫃檯提前交運，依當日規則辦理"
        ],
        critical:[
          "🚨 SBB 領取單必須跟護照分開放，避免遺失同時發生",
          "出發前 1 個月至 sbb.ch/en/offers/luggage-transport-station-to-station 確認當年度服務條款"
        ]
      },
      {
        time:"14:00–15:10", title:"Emirates 硬時間點（現行 15:30 框架；2027 訂票時實際為準）",
        tr:{ label:"機場內步行", icon:"walk" }, stp:"none",
        steps:[
          "⏰ T-90 = 14:00：Passport control / Security 管理基準（保守目標）",
          "⏰ T-60 = 14:30：Economy 抵達登機門硬時間點",
          "⏰ T-20 = 15:10：登機門關閉時間",
          "實際登機區與 Gate 以當日登機證、Emirates App 及 Zürich Airport 現場顯示為準",
          "機場過安檢後有 Family Lounge 與兒童遊樂區"
        ],
        defense:[
          "妞妞使用兒童獨立座位 + 安全帶（不使用 bassinet，2 歲半不適用）",
          "可申請 bulkhead 前排優先",
          "訂票時 Manage Booking 選 CHML（兒童餐，2-12 歲）",
          "Emirates baggage 為 Weight Concept 總重量制：Economy Special 20kg/人｜Saver 25kg/人｜Flex 30kg/人｜Flex Plus 35kg/人（每件單件上限 32kg）"
        ],
        critical:[]
      },
      {
        time:`${ZRH_DEPART_HM} 起飛（現行）`, title:`✈️ ${FLIGHT_ITINERARY.return.leg1.flightNo} 起飛返台`,
        tr:{ label:`Emirates ${FLIGHT_ITINERARY.return.leg1.flightNo}`, icon:"plane" }, stp:"none",
        steps:[
          `${formatFlightLeg(FLIGHT_ITINERARY.return.leg1)}（現行參考；2027 訂票時實際為準）`,
          `杜拜轉機 ${formatFlightLeg(FLIGHT_ITINERARY.return.leg2)}，符合資格的 6-26 小時轉機可申請 Dubai Connect（免費過境酒店+餐食+接駁+UAE transit visa）`,
          `9/25 (六) 當日約 ${_flightHM(FLIGHT_ITINERARY.return.leg2.arrive)} 抵桃園（現行參考）`
        ],
        defense:[
          "EK 親子硬體業界頂尖：兒童餐（CHML）、玩具包、bulkhead 前排",
          "Dubai Connect 最終資格以 Emirates 訂位系統/客服確認"
        ],
        critical:[]
      }
    ]
  }
];

const SIGHTS = [
  { region:"瑞士中部", city:"琉森", name:"卡貝爾木橋與舊城", stp:"100% 免費", family:"⭐⭐⭐⭐⭐ 極高：全程平地", note:"歐洲最古老有頂木橋，橋身種滿鮮花" },
  { region:"瑞士中部", city:"琉森", name:"獅子紀念碑", stp:"100% 免費", family:"⭐⭐⭐⭐ 高：公園平緩", note:"馬克吐溫譽為世界上最悲傷的石頭" },
  { region:"瑞士中部", city:"琉森", name:"瑞士交通博物館", stp:"50% 折扣", family:"⭐⭐⭐⭐⭐ 極高：全室內無障礙，雨天首選", note:"全歐最豐富交通博物館，大量幼兒互動區" },
  { region:"瑞士中部", city:"琉森湖區", name:"瑞吉山 (Rigi Kulm)", stp:"100% 免費", family:"⭐⭐⭐⭐ 高：山頂步道相對平緩；下山步道推車可行性依當日路線與路況判斷", note:"山巒皇后，360° 俯瞰琉森湖" },
  { region:"瑞士中部", city:"琉森近郊", name:"皮拉圖斯山 (Pilatus)", stp:"50% 折扣", family:"⭐⭐⭐ 中：山頂碎石路推車稍吃力", note:"世界最陡齒軌+金色環遊船齒軌纜車" },
  { region:"伯恩高地", city:"坎德谷（備案）", name:"藍湖 (Blausee)", stp:"公車免費／門票 CHF 11-13", family:"⭐⭐⭐⭐ 高：全程無階梯", note:"森林深處的湛藍寶石" },
  { region:"伯恩高地", city:"坎德谷（備案）", name:"歐新能湖 (Oeschinensee)", stp:"纜車 50% 折扣", family:"⭐⭐⭐⭐ 高：湖畔平緩", note:"翡翠秘境，垂直峭壁包圍" },
  { region:"伯恩高地", city:"少女峰山區", name:"施陶河瀑布 Staubbachfall", stp:"100% 免費", family:"⭐⭐⭐⭐⭐ 極高：谷底平坦", note:"《愛的迫降》取景地，300m 細白紗瀑布" },
  { region:"伯恩高地", city:"少女峰山區", name:"曼利申 (Männlichen)", stp:"50% 折扣", family:"⭐⭐⭐⭐ 高：碎石路建議背巾", note:"海拔 2,230m 三大名峰正對視角" },
  { region:"伯恩高地", city:"少女峰山區", name:"33 號全景步道 Panorama Trail", stp:"纜車 50% 折扣", family:"⭐⭐⭐ 中：背巾為主推車運輸", note:"瑞士最美平緩步道，面對艾格北壁 6km" },
  { region:"伯恩高地", city:"少女峰山區", name:"施尼格普拉特 Schynige Platte", stp:"50% 折扣", family:"⭐⭐⭐⭐ 高：植物園步道平緩", note:"1893 古董齒軌火車，私房秘境" },
  { region:"伯恩高地", city:"少女峰山區", name:"First 纜車 + Cliff Walk", stp:"50% 折扣", family:"⭐⭐⭐⭐ 高：Bort 遊樂場妞妞放電區", note:"Bachalpsee 倒影湖，全行程最美照片" },
  { region:"伯恩高地", city:"少女峰山區", name:"格林德瓦冰河峽谷 Gletscherschlucht", stp:"CHF 19 自費", family:"⭐⭐⭐⭐ 高：木棧道嵌岩壁", note:"雨天備案首選（含天然遮蔽）" },
  { region:"伯恩高地", city:"少女峰山區", name:"Pfingstegg 森林溜滑梯（非正式行程）", stp:"50% 折扣", family:"⚠️ 4 歲以下嚴禁滑道與 Fly-Line", note:"非正式行程，僅供參考。妞妞無滑道可玩，大人看景用。Day 9 的幼童放電區已改為 Bort 遊樂場" },
  { region:"伯恩高地", city:"布里恩茨", name:"Brienz Rothorn 1892 蒸汽齒軌", stp:"50% 折扣（2026 實查 CHF 49，2027 推估 CHF 50）+ 預約 CHF 8", family:"⭐⭐⭐⭐ 高：山頂步道平緩，推車 80% 路段可用", note:"瑞士最古老蒸汽齒軌之一，2,244m 看 693 座山峰。旺季可能改柴油機車，出發當日查官網" },
  { region:"伯恩高地", city:"因特拉肯", name:"Höheweg 大道 + Höhematte 草坪", stp:"100% 免費", family:"⭐⭐⭐⭐⭐ 極高：平地大道", note:"三峰最後合照黃金地點" }
];

const RESTAURANTS = [
  { area:"琉森", name:"Rathaus Brauerei", plan:"Day 1 或 3 晚餐", spec:"百年地窖鮮釀黑啤", must:"脆皮烤豬腳、Luzerner Chügelipastete", price:"CHF 35-45", book:"提前 1-2 週" },
  { area:"琉森", name:"Restaurant Pfistern", plan:"Day 1 或 3 晚餐", spec:"卡貝爾橋第一排河畔景觀", must:"蘇黎世小牛肉附 Rösti", price:"CHF 45-60", book:"提前 1-2 週，備註二樓陽台" },
  { area:"皮拉圖斯", name:"Pilatus Kulm Restaurant", plan:"Day 4 主線午餐備案", spec:"海拔 2,073m 山頂景觀", must:"高山牛肉湯、Rösti", price:"CHF 30-45", book:"原則可現場用餐；2027 出發前確認營運與是否建議訂位" },
  { area:"小夏戴克", name:"Restaurant Grindelwaldblick", plan:"Day 7 午餐", spec:"正面迎擊少女峰雪山露台", must:"Goulash、炸豬排", price:"CHF 25-35", book:"現場排隊" },
  { area:"施尼格普拉特", name:"Hotel Restaurant Schynige Platte", plan:"Day 8 午餐（A 家庭預設方案）", spec:"面三峰雙湖古蹟旅館", must:"Älplermagronen、蘋果派", price:"CHF 25-35", book:"原則可現場用餐；2027 出發前確認營運與是否建議訂位" },
  { area:"格林德瓦", name:"🥇 Barry's Restaurant", plan:"🚨 Day 10 晚餐必訂", spec:"最後一頓外食", must:"起司火鍋 Moitié-Moitié、Raclette", price:"CHF 45-60", book:"🚨 出發前 1.5-2 個月訂 (2027/7 底前)" }
];

const RAIN_PLANS = [
  { base:"琉森", place:"瑞士交通博物館 (雨天首選)", pros:"全瑞士最受歡迎博物館，室內整天玩", ticket:"STP 50% (CHF 19)", note:"對 2 歲妞妞極友善" },
  { base:"琉森", place:"羅森加特美術館", pros:"畢卡索、克利、塞尚", ticket:"STP 100% 免費", note:"1-1.5 小時，適合大人" },
  { base:"琉森", place:"KKL 文化會議中心", pros:"Jean Nouvel 設計（2008 普立茲克獎，1995-2000 建造）湖畔現代建築", ticket:"大廳免費/美術館 CHF 15", note:"大廳寬敞可避雨" },
  { base:"琉森", place:"舊城拱廊購物 + 咖啡", pros:"下雨也能購物喝咖啡", ticket:"無", note:"巧克力店、紀念品店" },
  { base:"格林德瓦", place:"🥇 冰河峽谷 (雨天首選)", pros:"木棧道嵌岩壁下雨也能玩", ticket:"CHF 19", note:"獨立雨天備案；Day 10 主行程已改為 Brienz Rothorn 蒸汽火車" },
  { base:"格林德瓦", place:"Sportzentrum 室內泳池", pros:"適合幼兒戲水", ticket:"CHF 8-12", note:"整下午消磨" },
  { base:"格林德瓦", place:"Pfingstegg 山頂木屋", pros:"陰天看艾格北壁神秘氛圍", ticket:"STP 50% (CHF 18)", note:"風雨大不建議" },
  { base:"格林德瓦", place:"Interlaken 購物商場", pros:"Höhematte 商業區品牌店", ticket:"BOB 35 分鐘 STP 免費", note:"半天行程" },
  { base:"格林德瓦", place:"🥇 伯恩舊城 (整日雨天)", pros:"UNESCO 世界遺產，6 公里拱廊街", ticket:"車程 35 分 STP 免費", note:"拱廊全程遮雨" }
];

const SHOPPING = [
  {
    when:"Day 1 抵琉森 (9/14 二)",
    place:"琉森車站 B1 Coop",
    warning:"",
    items:[
      "鮮奶 1L × 1（妞妞早餐用）",
      "優格 4-6 杯",
      "香蕉、蘋果、橘子各 4-6 顆",
      "麵包 / Brötchen 6-8 個",
      "火腿、起司切片（隔日早餐用）",
      "礦泉水 1.5L × 2 瓶（適應期）",
      "簡單晚餐（沙拉/微波義大利麵）"
    ],
    budget:"CHF 60-80"
  },
  {
    when:"Day 3 琉森備貨 (9/16 四)",
    place:"琉森老城區 Coop / Migros",
    warning:"🥪 重點：Day 4 皮拉圖斯山頂野餐前一天備妥三明治原料",
    items:[
      "麵包、火腿、起司、優格、水果",
      "自製三明治原料（Day 4 皮拉圖斯山頂野餐）",
      "巧克力/能量棒（健行零食）",
      "葡萄酒 1 瓶（晚餐配）"
    ],
    budget:""
  },
  {
    when:"Day 5 抵格林德瓦 (9/18 六)",
    place:"格林德瓦主街 Coop",
    warning:"⚠️ 一次買齊 4-5 天份，Day 6 週日 Grindelwald Coop 仍營業至 18:30",
    items:[
      "牛奶 1L × 2-3 瓶",
      "優格、起司、火腿、雞蛋（早餐 × 6 天）",
      "麵包 / 全麥吐司 × 3 包",
      "義大利麵、米、調味料",
      "蔬菜（番茄、生菜、洋蔥）",
      "肉品（雞胸、培根、火腿片）",
      "水果（蘋果、香蕉、莓果）",
      "巧克力、能量棒、糖果（妞妞獎勵）",
      "葡萄酒 2-3 瓶、啤酒 6 罐",
      "洗碗精、洗衣球（若公寓未提供）"
    ],
    budget:"CHF 250-350"
  },
  {
    when:"Day 8 中段補貨 (9/21 二)",
    place:"格林德瓦 Coop",
    warning:"🥪 Day 10 Brienz Rothorn 山頂野餐食材（保暖熱可可必備）",
    items:[
      "蔬菜、麵包（已消耗補充）",
      "水果補充",
      "Day 9 健行乾糧（能量棒、堅果、果乾）",
      "Day 11 早上 BOB 上早餐與點心",
      "【Day 10 Rothorn 野餐】瑞士起司 Gruyère + Emmental 200g",
      "【Day 10 Rothorn 野餐】法棍或黑麥麵包",
      "【Day 10 Rothorn 野餐】Bündnerfleisch 風乾牛肉小包",
      "【Day 10 Rothorn 野餐】蘋果、葡萄（妞妞愛吃）",
      "【Day 10 Rothorn 野餐】Lindt 巧克力（熱量補給）",
      "【Day 10 Rothorn 野餐】兒童優酪乳（妞妞）",
      "🚨【Day 10 Rothorn 野餐】保溫瓶熱可可（山頂 5-10°C 必備）"
    ],
    budget:""
  }
];


// ══════════════════════════════════════════════════════════════════
// V21.8 · Maps & Navigation（地圖與導航）— MAP_GUIDES
// ──────────────────────────────────────────────────────────────────
// 目的：現場回答「我在哪裡／我要往哪裡／下一段交通怎麼搭」。
// 原則：simplified field-guide 示意（Not to scale），不建 GIS、不做 turn-by-turn、
//       不發明 2027 timetable／platform／gate；未確認者一律 Pending。
// type：town（城鎮定位）／route（當日移動鏈）／station（站體）／transfer（轉乘）
// status：current_reference（現行參考，2027 需重新確認）／pending（未確認）
// ══════════════════════════════════════════════════════════════════
const MAP_GUIDES = {
  // ── P0-1 ─────────────────────────────────────────────
  luzern_station: {
    id:"luzern_station", title:"Luzern Bahnhof（琉森車站）· SBB 行李寄送",
    type:"station", priority:"P0", relatedDays:[1,2,3,4,5],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"Day 3 早上於此辦理 5 件 Station-to-Station 行李寄送（Luzern → Grindelwald）。",
    diagram:[
      { node:"KoBi Hirschenplatz（住宿）", note:"步行約 5–10 分鐘至車站" },
      { node:"Luzern Bahnhof 主入口", note:"湖畔側大門最好認" },
      { node:"跟 Gepäck / Luggage 指標", note:"指標為德/英雙語" },
      { node:"SBB 行李櫃台（luggage counter）", note:"現行 08:00 開門後才可辦理" },
      { node:"辦理 5 件 → Grindelwald", note:"約 08:20–08:30 完成" }
    ],
    steps:[
      "約 07:45 從住宿出發，08:00 櫃台開門後才辦理（不要安排 07:00／07:30 到場等待辦理）",
      "跟 Gepäck / Luggage 指標走，櫃台不在月台上而在站體服務區",
      "5 件大行李 Station-to-Station 寄至 Grindelwald，Day 5 抵達後領取",
      "留存收據；行李內不放乳製品／副食品／證件／貴重物"
    ],
    pendingNotes:["2027 實際櫃台營業時間與收費須出發前重新確認（現行 08:00 開門、CHF 60 為 current reference）"],
    officialLinks:[
      { label:"SBB Luzern 車站資訊與設施", url:"https://www.sbb.ch/en/travel-information/stations/find-station/luzern-station.html" },
      { label:"SBB Luzern 行李櫃台位置與營業資訊（Gepäckaufgabe · Galerie 1. Obergeschoss）", url:"https://www.sbb.ch/en/travel-information/stations/find-station/luzern-station/shops/shop-detail.html/geo-gepaeckaufgabe-ea8e" },
      { label:"SBB Luzern 站內平面圖 PDF（找行李櫃台位置）", url:"https://www.sbb.ch/content/dam/infrastruktur/trafimage/bahnhofplaene/plan-luzern-a4.pdf.sbbdownload.pdf" },
      { label:"SBB 行李寄送服務（Station-to-Station）", url:"https://www.sbb.ch/en/offers/luggage-services" }
    ],
    externalMap:"https://www.google.com/maps/search/?api=1&query=Luzern+Bahnhof",
    schematic:{
      layout:"station", viewBox:"0 0 320 250",
      ariaLabel:"Luzern 車站示意圖：主大廳位於中央，行李櫃台在 Galerie 上層，湖與碼頭在一側、舊城與住宿在另一側，月台在大廳後方",
      zones:[
        { label:"Galerie / 上層", x:12, y:26, w:296, h:56 },
        { label:"主大廳 Main Hall（地面層）", x:12, y:96, w:296, h:66 },
        { label:"月台區 Platforms", x:12, y:176, w:296, h:52 }
      ],
      nodes:[
        { id:"lug", label:"SBB 行李櫃台", x:160, y:54, icon:"🛅", status:"verify", note:"Galerie／上層（2027 verify）" },
        { id:"lift", label:"電梯／手扶梯", x:62, y:54, icon:"↕️", status:"current" },
        { id:"hall", label:"主大廳", x:160, y:128, icon:"🏛️", status:"current" },
        { id:"entry", label:"主入口", x:160, y:166, icon:"🚪", status:"current" },
        { id:"lake", label:"← 湖／碼頭", x:52, y:128, icon:"⛵", status:"current" },
        { id:"town", label:"舊城／KoBi →", x:268, y:128, icon:"🏘️", status:"current" },
        { id:"plat", label:"月台", x:160, y:202, icon:"🚆", status:"verify", note:"月台號＝當日看板" }
      ],
      links:[
        { from:"entry", to:"hall", style:"walk", label:"進站" },
        { from:"hall", to:"lift", style:"level", label:"往上層" },
        { from:"lift", to:"lug", style:"walk", label:"跟 Gepäck 指標", labelDx:0, labelDy:-16 },
        { from:"hall", to:"plat", style:"level", label:"往月台", labelDx:-46, labelDy:3, labelAnchor:"end" }
      ],
      pendingLabels:["櫃台實際樓層／位置 2027 verify"]
    }
  },

  // ── P0-2 ─────────────────────────────────────────────
  interlaken_ost: {
    id:"interlaken_ost", title:"Interlaken Ost · Luzern–Interlaken Express → BOB 轉乘",
    type:"transfer", priority:"P0", relatedDays:[5,6,8,10,11],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"Day 5 由 Luzern 前往 Grindelwald 的關鍵轉乘點；BOB 會分段掛車，看車廂目的地顯示最重要。",
    diagram:[
      { node:"Luzern–Interlaken Express 抵達", note:"下車後留在站內" },
      { node:"看月台電子看板找 BOB", note:"往 Grindelwald / Lauterbrunnen" },
      { node:"確認車廂外側目的地顯示", note:"⚠️ 同一列車會分向兩地" },
      { node:"上正確車廂 → Grindelwald", note:"錯車廂會被解聯到別的山谷" }
    ],
    steps:[
      "不預設固定月台：以當日車站電子看板 / SBB App 為準",
      "BOB 常為一列分段掛車，前後段目的地不同——上車前務必看『車廂外側目的地顯示』",
      "不預設一定在前段或後段，方向以站方顯示為準",
      "帶推車者預留多一點上車時間，車門與月台有高差"
    ],
    pendingNotes:["實際月台、車廂編組、分段方式依 2027 當日 SBB App／站內看板，不預先鎖定"],
    officialLinks:[
      { label:"SBB Interlaken Ost 車站資訊", url:"https://www.sbb.ch/en/travel-information/stations/find-station/station.7492.interlaken-ost.html" },
      { label:"Jungfrau Interlaken Ost 車站頁（BOB 往 Grindelwald／Lauterbrunnen）", url:"https://www.jungfrau.ch/en-gb/arrival-at-station-car-parks/interlaken-ost-railway-station/" },
      { label:"Berner Oberland-Bahn（BOB）官方說明：Zweilütschinen 分車", url:"https://www.jungfrau.ch/en-gb/corporate/jungfrau-railways/berner-oberland-bahnen-ag/berner-oberland-bahn/" }
    ],
    externalMap:"https://www.google.com/maps/search/?api=1&query=Interlaken+Ost+railway+station",
    schematic:{
      layout:"transfer", viewBox:"0 0 320 236",
      ariaLabel:"Interlaken Ost 轉乘示意圖：LIE 抵達區與 BOB 出發區在同一站體，透過站內通道轉乘；BOB 會分段掛車，須確認車廂目的地顯示",
      zones:[{ label:"Interlaken Ost 站體（同站內轉乘）", x:12, y:26, w:296, h:150 }],
      nodes:[
        { id:"lie", label:"LIE 抵達區", x:74, y:64, icon:"🚆", status:"current" },
        { id:"conc", label:"站內通道\nconcourse", x:160, y:112, icon:"🚶", status:"current" },
        { id:"bob", label:"BOB 出發區", x:250, y:64, icon:"🚆", status:"verify", note:"月台＝當日 SBB App" },
        { id:"disp", label:"車廂目的地顯示", x:250, y:150, icon:"🔎", status:"verify", note:"⚠️ 分向 Grindelwald / Lauterbrunnen" }
      ],
      links:[
        { from:"lie", to:"conc", style:"walk", label:"下車後留在站內" },
        { from:"conc", to:"bob", style:"walk", label:"看電子看板找 BOB", labelDx:-14, labelDy:6, labelAnchor:"end" },
        { from:"bob", to:"disp", style:"level", label:"上車前務必確認" }
      ],
      pendingLabels:["Platform ＝ day-of SBB App（不鎖固定號碼）"]
    }
  },

  // ── P0-3 ─────────────────────────────────────────────
  grindelwald_station: {
    id:"grindelwald_station", title:"Grindelwald Bahnhof · 領行李／寄行李",
    type:"station", priority:"P0", relatedDays:[5,8,9,10,11],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"Day 5 領取 5 件 SBB 行李；Day 8 於此再寄 5 件至 Zürich Flughafen；Day 11 由此出發。",
    diagram:[
      { node:"Grindelwald Bahnhof 月台", note:"BOB 到站" },
      { node:"站內 Gepäck / Luggage 櫃台", note:"領取／寄送皆在此" },
      { node:"車站出口（主street 側）", note:"出站即為主street" },
      { node:"Sans Souci W1 方向", note:"步行約 300m 量級（精確門牌待確認）" },
      { node:"Firstbahn 方向", note:"與住宿方向不同側，Day 9 使用" }
    ],
    steps:[
      "Day 5：抵達後先於站內 luggage 櫃台領取 5 件（憑收據）",
      "Day 8：約 07:45 出發，08:00 櫃台開門後辦理寄送至 Zürich Flughafen",
      "站前為主street，Coop 超市與住宿方向同側；Firstbahn 需另往纜車站方向",
      "13:00–15:00 之間抵達時，不預設可先進公寓（正式 check-in 15:00 起）"
    ],
    pendingNotes:["Grindelwald 站行李櫃台 2027 營業時間須重新確認","Sans Souci W1 精確門牌與 key collection 方式仍為 Pending"],
    officialLinks:[
      { label:"SBB Grindelwald 車站資訊", url:"https://www.sbb.ch/en/travel-information/stations/find-station/station.7380.grindelwald.html" },
      { label:"Jungfrau Grindelwald 車站頁", url:"https://www.jungfrau.ch/en-gb/arrival-at-station-car-parks/grindelwald-railway-station/" }
    ],
    externalMap:"https://www.google.com/maps/search/?api=1&query=Grindelwald+Bahnhof",
    schematic:{
      layout:"station", viewBox:"0 0 320 250",
      ariaLabel:"Grindelwald 車站示意圖：月台與行李櫃台在站內，出站後為主街，住宿方向與 Firstbahn 方向分屬不同側",
      zones:[
        { label:"車站站體", x:12, y:26, w:296, h:92 },
        { label:"站外・Dorfstrasse 主街軸線", x:12, y:132, w:296, h:96 }
      ],
      nodes:[
        { id:"plat", label:"BOB 月台", x:80, y:54, icon:"🚆", status:"current" },
        { id:"lug", label:"行李櫃台", x:224, y:54, icon:"🛅", status:"verify", note:"領/寄皆在此・時間 2027 verify" },
        { id:"exit", label:"車站出口", x:160, y:100, icon:"🚪", status:"current" },
        { id:"bus", label:"巴士／接駁區", x:62, y:158, icon:"🚌", status:"current" },
        { id:"sans", label:"Sans Souci W1\n（方向・約 300m）", x:238, y:158, icon:"🏠", status:"pending", note:"精確門牌 Pending" },
        { id:"first", label:"Firstbahn 方向", x:150, y:206, icon:"🚡", status:"current", note:"與住宿不同側" }
      ],
      links:[
        { from:"plat", to:"lug", style:"walk", label:"站內" },
        { from:"lug", to:"exit", style:"walk", label:"出站" },
        { from:"exit", to:"sans", style:"walk", label:"主街方向・步行約 4-5 分" },
        { from:"exit", to:"first", style:"walk", label:"另一側" }
      ],
      pendingLabels:["Sans Souci 精確門牌 Pending（僅示方向，非精準定位）"]
    }
  },

  // ── P0-4（拆三張卡）─────────────────────────────────
  lauterbrunnen_transfer: {
    id:"lauterbrunnen_transfer", title:"Lauterbrunnen · 上山轉乘（往 Grütschalp / Mürren）",
    type:"transfer", priority:"P0", relatedDays:[6],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"Day 6 上 Mürren 的起點。轉乘鏈：Lauterbrunnen → aerial cableway（空中纜車）→ Grütschalp → BLM railway（山區鐵道）→ Mürren。兩段交通工具不同，勿混稱。",
    diagram:[
      { node:"Lauterbrunnen 車站（BOB 抵達）", note:"出站" },
      { node:"往 Grütschalp 纜車站", note:"就在車站對面／鄰接" },
      { node:"Grütschalp", note:"轉 BLM 山區小火車" },
      { node:"Mürren BLM", note:"抵達 Mürren 村" }
    ],
    steps:[
      "順序固定：Lauterbrunnen →（aerial cableway 空中纜車）→ Grütschalp →（BLM railway 山區鐵道）→ Mürren",
      "不硬綁固定班次；搭下一班即可，班距依 2027 Jungfrau／SBB timetable",
      "回程為反向同一順序",
      "推車可上，但上下車有高差，預留時間"
    ],
    pendingNotes:["2027 實際班距與首末班依 Jungfrau／SBB 官方時刻表"],
    officialLinks:[
      { label:"SBB Lauterbrunnen 車站資訊", url:"https://www.sbb.ch/en/travel-information/stations/find-station/station.7384.lauterbrunnen.html" },
      { label:"Jungfrau Lauterbrunnen 車站頁", url:"https://www.jungfrau.ch/en-gb/arrival-at-station-car-parks/lauterbrunnen-railway-station/" },
      { label:"BLM 空中纜車＋Grütschalp–Mürren 鐵道（官方說明）", url:"https://www.jungfrau.ch/de-ch/unternehmen/jungfraubahnen/jungfraubahn-holding-ag/bergbahn-lauterbrunnen-muerren-ag/" }
    ],
    externalMap:"https://www.google.com/maps/search/?api=1&query=Lauterbrunnen+station",
    schematic:{
      layout:"transfer", viewBox:"0 0 320 200",
      ariaLabel:"Lauterbrunnen 轉乘示意圖：BOB 車站與空中纜車山谷站相鄰，出站後過馬路即達纜車站",
      zones:[{ label:"Lauterbrunnen 車站區", x:12, y:34, w:296, h:120 }],
      nodes:[
        { id:"bob", label:"BOB 抵達月台", x:74, y:74, icon:"🚆", status:"current" },
        { id:"exit", label:"站前出口", x:74, y:122, icon:"🚶", status:"current" },
        { id:"cable", label:"纜車山谷站\n(aerial cableway)", x:236, y:122, icon:"🚡", status:"current" },
        { id:"gru", label:"→ Grütschalp", x:236, y:66, icon:"⛰️", status:"current" }
      ],
      links:[
        { from:"bob", to:"exit", style:"level", label:"下車出站" },
        { from:"exit", to:"cable", style:"walk", label:"過馬路・車站正對面" },
        { from:"cable", to:"gru", style:"transport", label:"空中纜車約 4 分" }
      ],
      pendingLabels:["月台號碼＝當日 SBB App"]
    }
  },
  grutschalp_transfer: {
    id:"grutschalp_transfer", title:"Grütschalp · 纜車 ↔ BLM 月台轉乘",
    type:"transfer", priority:"P0", relatedDays:[6],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"純轉乘點：纜車與 BLM 小火車在同一站體銜接，不需離站。",
    diagram:[
      { node:"纜車抵達 Grütschalp", note:"出車廂即為轉乘層" },
      { node:"BLM 月台", note:"同站體、步行極短" },
      { node:"往 Mürren（或回 Lauterbrunnen）", note:"看車頭方向標示" }
    ],
    steps:[
      "同站體轉乘，不需要出站或走遠路",
      "上行往 Mürren、下行回 Lauterbrunnen，以車頭／月台標示確認方向",
      "此站僅為轉乘節點，無市鎮設施，不安排停留"
    ],
    pendingNotes:["班次銜接依當日實際 timetable"],
    officialLinks:[
      { label:"BLM Grütschalp 轉乘（纜車↔鐵道官方說明）", url:"https://www.jungfrau.ch/de-ch/unternehmen/jungfraubahnen/jungfraubahn-holding-ag/bergbahn-lauterbrunnen-muerren-ag/" }
    ],
    externalMap:"https://www.google.com/maps/search/?api=1&query=Gr%C3%BCtschalp",
    schematic:{
      layout:"transfer", viewBox:"0 0 320 176",
      ariaLabel:"Grütschalp 轉乘示意圖：纜車與 BLM 月台同一站體，步行極短，非村鎮",
      zones:[{ label:"Grütschalp 同一站體（轉乘節點・無村鎮設施）", x:12, y:30, w:296, h:104 }],
      nodes:[
        { id:"cab", label:"纜車抵達", x:78, y:84, icon:"🚡", status:"current" },
        { id:"blm", label:"BLM 月台", x:232, y:84, icon:"🚆", status:"current" }
      ],
      links:[{ from:"cab", to:"blm", style:"walk", label:"同站體・步行極短" }],
      pendingLabels:["班次銜接＝當日 timetable"]
    }
  },
  murren_orientation: {
    id:"murren_orientation", title:"Mürren 村 · 定位（BLM ↔ Allmendhubelbahn）",
    type:"town", priority:"P0", relatedDays:[6],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"無車山村；主要動線為 BLM 站 → 主街 Dorfstrasse → Allmendhubel 纜車站。",
    diagram:[
      { node:"Mürren BLM 站", note:"村子一端" },
      { node:"主街 Dorfstrasse", note:"沿街走即可貫穿村子" },
      { node:"Allmendhubelbahn 站", note:"村子另一端，往 Flower Park" },
      { node:"Allmendhubel 山上", note:"Flower Park（家庭核心）" }
    ],
    steps:[
      "村內無車，但非全平坦：部分路段有坡度、不平或碎石，推車依現場調整",
      "BLM 站與 Allmendhubel 纜車站分居村子兩端，步行約 5–10 分鐘",
      "回程：funicular 下山後步行約 5–10 分鐘回 BLM 站，搭下一班往 Grütschalp",
      "Flower Trail 依當日路況與推車狀況決定是否走完整圈，走不完不影響核心體驗"
    ],
    pendingNotes:["Allmendhubel 纜車 2027 營運季節與班距依 Schilthorn 官方"],
    officialLinks:[
      { label:"Schilthorn 時刻表與票價（含 Mürren–Allmendhubel）", url:"https://schilthorn.ch/en/Infos/Timetable__and__Tariff" },
      { label:"BLM Lauterbrunnen–Grütschalp–Mürren 官方說明", url:"https://www.jungfrau.ch/de-ch/unternehmen/jungfraubahnen/jungfraubahn-holding-ag/bergbahn-lauterbrunnen-muerren-ag/" }
    ],
    externalMap:"https://www.google.com/maps/search/?api=1&query=M%C3%BCrren",
    schematic:{
      layout:"town", viewBox:"0 0 320 250",
      ariaLabel:"Mürren 村定位示意圖：BLM 車站在村子一端，沿主街 Dorfstrasse 貫穿村中心，Allmendhubel 纜車站在另一端，往上為 Flower Park",
      zones:[{ label:"Mürren 村（無車山村・南北向村軸）", x:12, y:30, w:296, h:196 }],
      axis:{ label:"Dorfstrasse 主街步行軸線", from:"blm", to:"allm" },
      nodes:[
        { id:"blm", label:"Mürren BLM 站", x:70, y:196, icon:"🚆", status:"current", note:"村子一端（下方／downhill）" },
        { id:"centre", label:"村中心\nDorfstrasse", x:160, y:140, icon:"🏘️", status:"current", note:"商店・餐廳" },
        { id:"allm", label:"Allmendhubelbahn\n纜車站", x:250, y:88, icon:"🚡", status:"current", note:"村子另一端（上方／uphill）" },
        { id:"flower", label:"Flower Park\n（山上）", x:250, y:44, icon:"🌼", status:"current" }
      ],
      links:[
        { from:"blm", to:"centre", style:"walk", label:"沿主街・約 5–10 分" },
        { from:"centre", to:"allm", style:"walk", label:"續行至另一端" },
        { from:"allm", to:"flower", style:"transport", label:"funicular 上山" }
      ],
      pendingLabels:["纜車營運季節／班距依 Schilthorn 官方"]
    }
  },

  // ── P0-5 ─────────────────────────────────────────────
  brienz_boat_brb: {
    id:"brienz_boat_brb", title:"Brienz · 遊船碼頭 → BRB 齒軌起點",
    type:"transfer", priority:"P0", relatedDays:[10],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"Day 10 由湖上遊船抵 Brienz 後轉乘 BRB 上 Brienzer Rothorn；重點是不要跑錯碼頭／車站。",
    diagram:[
      { node:"遊船抵達 Brienz 碼頭（Schiffstation）", note:"湖畔" },
      { node:"Brienz 火車站（SBB）", note:"碼頭對面／相鄰" },
      { node:"BRB 起點站", note:"⚠️ BRB 為獨立站體，緊鄰 SBB 站" },
      { node:"BRB 上山 → Brienzer Rothorn", note:"蒸汽／柴油齒軌" }
    ],
    steps:[
      "Brienz 有『碼頭 / SBB 車站 / BRB 站』三個節點且彼此很近——認明 BRB 專屬站體再排隊",
      "BRB 非 SBB 月台，走錯會誤以為班次取消",
      "下船到 BRB 需要 buffer；船班誤點會直接影響上山班次",
      "BRB 為 Day 10 主線：木雕村僅為 Optional Bonus，不得壓縮 BRB"
    ],
    pendingNotes:["BRB 2027 timetable／營運季節／班次為 Pending，出發前依 brienz-rothorn-bahn.ch 確認"],
    officialLinks:[
      { label:"BRB 時刻表與票價（含營運季節）", url:"https://brienz-rothorn-bahn.ch/en/fahrplan-preise/" },
      { label:"BRB 常見問題（含碼頭／車站相對位置）", url:"https://brienz-rothorn-bahn.ch/en/fragen-und-antworten/" },
      { label:"BLS 湖上遊船（Brienzersee）", url:"https://www.bls.ch/en/freizeit/schifffahrt/brienzersee" }
    ],
    externalMap:"https://www.google.com/maps/search/?api=1&query=Brienz+Rothorn+Bahn+station",
    schematic:{
      layout:"transfer", viewBox:"0 0 320 220",
      ariaLabel:"Brienz 轉乘示意圖：湖畔碼頭、SBB 車站與 BRB 車站三者相鄰但為不同站體，BRB 有專屬站體不可誤認為 SBB 月台",
      zones:[
        { label:"湖畔側", x:12, y:26, w:296, h:56 },
        { label:"車站區（三個節點相鄰但不同站體）", x:12, y:96, w:296, h:104 }
      ],
      nodes:[
        { id:"pier", label:"遊船碼頭\nSchiffstation", x:160, y:54, icon:"⛴️", status:"current" },
        { id:"sbb", label:"Brienz SBB 車站", x:80, y:150, icon:"🚆", status:"current", note:"⚠️ 非 BRB" },
        { id:"brb", label:"BRB 起點站\n（獨立站體）", x:244, y:150, icon:"🚂", status:"current", note:"⚠️ 認明 BRB 專屬站體" }
      ],
      links:[
        { from:"pier", to:"sbb", style:"walk", label:"下船・步行極短" },
        { from:"sbb", to:"brb", style:"walk", label:"緊鄰但站體不同" },
        { from:"pier", to:"brb", style:"walk", label:"直接前往 BRB" }
      ],
      pendingLabels:["BRB 2027 timetable／營運季節 Pending・預留下船轉乘 buffer"]
    }
  },

  // ── P0-6 ─────────────────────────────────────────────
  zurich_airport: {
    id:"zurich_airport", title:"Zürich Flughafen · 領行李 → 報到 → 安檢 → 登機門",
    type:"station", priority:"P0", relatedDays:[11],
    status:"pending", offlineAvailable:true, lastVerified:"2026-08",
    description:"Day 11 離境流程節點順序；櫃台／航廈／Gate 一律不預先鎖定。",
    diagram:[
      { node:"Zürich Flughafen 火車站（地下）", note:"列車抵達" },
      { node:"SBB 行李領取", note:"領回 Day 8 寄出的 5 件" },
      { node:"Emirates 報到櫃台", note:"櫃台號依當日看板／App" },
      { node:"護照查驗 / 安檢", note:"T-90 為管理基準" },
      { node:"登機門 Gate", note:"Gate 依登機證／App／現場" }
    ],
    steps:[
      "順序固定：火車站 → SBB 行李領取 → Emirates 報到 → 護照/安檢 → Gate",
      "T-90（約 14:00）＝ passport／security 管理基準，非全球統一的實體 bag-drop 硬截止",
      "T-60（約 14:30）＝ Economy 抵達 Gate 的管理基準",
      "推車處理方式依當日櫃台指示（可能託運或到 Gate 前交付），不預設固定流程"
    ],
    pendingNotes:["Emirates 報到櫃台／航廈／Gate／實際航班時刻皆為 2027 Pending，依 boarding pass、Emirates App 與 ZRH 現場為準"],
    officialLinks:[
      { label:"ZRH 互動式機場地圖（現行官方）", url:"https://www.flughafen-zuerich.ch/en/passengers/practical/guidance/interactive-map" },
      { label:"ZRH 航空公司報到區資訊（Check-in 1/2/3）", url:"https://www.flughafen-zuerich.ch/en/passengers/fly/flightinformation/airlines" },
      { label:"Emirates 報到與行李規定", url:"https://www.emirates.com/english/before-you-fly/baggage/" }
    ],
    externalMap:"https://www.google.com/maps/search/?api=1&query=Zurich+Airport",
    schematic:{
      layout:"station", viewBox:"0 0 320 288",
      ariaLabel:"蘇黎世機場離境示意圖：地下火車站往上至機場中心，先領 SBB 行李，再至報到區、護照安檢，最後前往登機門；報到櫃台與登機門為 2027 待確認",
      zones:[
        { label:"地下層：火車站", x:12, y:20, w:296, h:44 },
        { label:"Airport Center / 報到層", x:12, y:78, w:296, h:132 },
        { label:"管制區：安檢後", x:12, y:224, w:296, h:52 }
      ],
      nodes:[
        { id:"rail", label:"Zürich Flughafen 火車站", x:160, y:42, icon:"🚆", status:"current" },
        { id:"center", label:"Airport Center", x:160, y:100, icon:"🏛️", status:"current" },
        { id:"lug", label:"SBB 行李領取", x:74, y:150, icon:"🛅", status:"current", note:"領回 Day 8 寄出 5 件" },
        { id:"chk", label:"Emirates 報到", x:246, y:150, icon:"🛄", status:"pending", note:"櫃台／航廈 2027 Pending" },
        { id:"sec", label:"護照查驗／安檢", x:160, y:196, icon:"🛂", status:"current", note:"T-90 管理基準" },
        { id:"gate", label:"登機門 Gate", x:160, y:250, icon:"✈️", status:"pending", note:"登機門號碼＝2027 Pending（依登機證／App）" }
      ],
      links:[
        { from:"rail", to:"center", style:"level", label:"往上至機場中心" },
        { from:"center", to:"lug", style:"walk", label:"先領行李" },
        { from:"center", to:"chk", style:"walk", label:"再報到" },
        { from:"chk", to:"sec", style:"walk", label:"T-90 前完成", labelDx:16, labelDy:8, labelAnchor:"start" },
        { from:"sec", to:"gate", style:"walk", label:"T-60 抵 Gate" }
      ],
      pendingLabels:["Emirates 櫃台／航廈／Gate／推車處理程序＝2027 Pending"]
    }
  },

  // ── Daily Journey Flow（Map Type B）──────────────────
  day6_flow: {
    id:"day6_flow", title:"Day 6 移動鏈 · Lauterbrunnen ↔ Mürren ↔ Allmendhubel",
    type:"route", priority:"P0", relatedDays:[6],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"當日整條移動鏈（去程與回程為同一順序反向）。",
    diagram:[
      { node:"Lauterbrunnen" },{ node:"Grütschalp" },{ node:"Mürren BLM" },
      { node:"Mürren village" },{ node:"Allmendhubel funicular" },{ node:"Flower Park" },
      { node:"Mürren BLM" },{ node:"Grütschalp" },{ node:"Lauterbrunnen" }
    ],
    steps:["核心為 Lauterbrunnen → Mürren → Allmendhubel，不是 Lauterbrunnen 平地行程","回程為同一鏈反向，不硬綁固定班次"],
    pendingNotes:["各段班距依 2027 Jungfrau／SBB timetable"],
    officialLinks:[
      { label:"BLM Lauterbrunnen–Grütschalp–Mürren 官方說明", url:"https://www.jungfrau.ch/de-ch/unternehmen/jungfraubahnen/jungfraubahn-holding-ag/bergbahn-lauterbrunnen-muerren-ag/" },
      { label:"Schilthorn 時刻表與票價（Mürren–Allmendhubel）", url:"https://schilthorn.ch/en/Infos/Timetable__and__Tariff" }
    ],
    externalMap:""
  },
  day10_flow: {
    id:"day10_flow", title:"Day 10 移動鏈 · Brienz 湖船 + BRB",
    type:"route", priority:"P0", relatedDays:[10],
    status:"current_reference", offlineAvailable:true, lastVerified:"2026-08",
    description:"當日主線；木雕村為 Optional Bonus，不在主鏈上。",
    diagram:[
      { node:"Grindelwald" },{ node:"Interlaken Ost" },{ node:"Boat（湖上遊船）" },
      { node:"Brienz" },{ node:"BRB" },{ node:"Brienzer Rothorn" },
      { node:"Brienz" },{ node:"Grindelwald" },{ node:"Barry's" }
    ],
    steps:["BRB 為主線，受保護不得被壓縮","木雕村＝Optional Bonus，僅 buffer 充足時執行"],
    pendingNotes:["BRB 2027 timetable Pending"],
    officialLinks:[
      { label:"BRB 時刻表與票價（含營運季節）", url:"https://brienz-rothorn-bahn.ch/en/fahrplan-preise/" },
      { label:"BLS 湖上遊船（Brienzersee）", url:"https://www.bls.ch/en/freizeit/schifffahrt/brienzersee" }
    ],
    externalMap:""
  }
};

// Day → map guide id（供 Day 頁「查看轉乘示意」使用）
const DAY_MAP_LINKS = {
  3:["luzern_station"],
  5:["interlaken_ost","grindelwald_station"],
  6:["day6_flow","lauterbrunnen_transfer","grutschalp_transfer","murren_orientation"],
  8:["grindelwald_station"],
  9:["grindelwald_station"],
  10:["day10_flow","brienz_boat_brb"],
  11:["grindelwald_station","zurich_airport"]
};

const BOOKINGS = [
  { when:"✅ 已完成 (出發前確認)", task:"KoBi Hirschenplatz 訂房後確認", how:"✅ 已完成訂房並收到 Booking.com 確認信（Two-Bedroom Apartment with Balcony，130 m²，2027/09/14 入住、09/18 退房共 4 晚）。實際訂房金額（原幣）CHF 2,702.16；NT$ 125,000 為既有預算／規劃基準，非 Booking.com 實際訂單金額。免費取消至 2027/8/30 23:59（Booking 確認）。付款狀態／時間待人工確認。保留憑證 PDF 與紙本。", priority:"🟢 建議" },
  { when:"✅ 已完成 (出發前確認)", task:"Sans Souci W1 by Interhome — 出發前 operational 確認", how:"✅ 已完成訂房（Apartment Sans Souci W1 by Interhome，108 m²，2027/09/18-24 共 6 晚）。實際訂房金額 CHF 2,691.01（原幣）；城市稅 CHF 156 由住宿方現場另收。出發前透過 Booking Messages／Interhome 確認：免費取消條件、付款期限、精確門牌地址、key pickup 領鑰匙、key return 還鑰匙、17:00 後 late check-in、床欄（bed rail）、紗窗（insect screens）。押金／取消／付款期限尚待確認（原 CHF 400／2027/7/20／2027/7/18 為下訂前參考，已不適用）。", priority:"🟡 重要" },
  { when:"🟠 T-11~13 個月 (2026/8-10)", task:"📱 ETIAS 動向追蹤（4 大 1 小全員）", how:"ETIAS 官方預計 2026 Q4 啟用；目前不需採取行動。2027 出發前 6 個月確認實際上線及強制執行日期。⚠️ 若 2027 已正式適用：4 大 1 小【全員】均依規定取得 ETIAS travel authorisation；4 位成人支付申請費（EU 執委會 2025-07-17 公告 EUR 20/人），妞妞未滿 18 歲免申請費——但【免申請費 ≠ 不需申請】，妞妞仍須取得自己的授權。網址：travel-europe.europa.eu/etias_en", priority:"🔴 必做" },
  { when:"🔴 機票鎖價（2026/11 雙11、黑五）", task:"🥇 EK 機票搶優惠", how:"目標 NT$ 33,000-38,000/人來回；托運 Weight Concept（依 fare 20-35kg/人）；4 大 + 妞妞 2 歲半兒童座位", priority:"🔴 必做" },
  { when:"🔵 T-3~4 個月 (2027/5-6)", task:"旅遊保險", how:"醫療給付建議 EUR 30,000 以上（風險管理與旅遊保障需求；EUR 30,000 為申根簽證申請人的強制門檻，本團為台灣護照免簽入境不受此強制，但仍強烈建議此額度）", priority:"🔴 必做" },
  { when:"🔵 T-3 個月 (2027/6)", task:"🚂 Pilatus 齒軌線上預約", how:"Day 4 行程主菜，pilatus.ch 線上預約。⚠️ 交通票券與座位預約應分開確認：持有效交通票券仍可能需要另外辦理／購買座位預約；不視為 Golden Round Trip 套票自動含齒軌座位，實際 2027 規則與預約方式於開放後再次確認。旺季週末易爆滿，建議出發前 3 個月鎖定。座位預約費現行約 CHF 5/人。", priority:"🟡 重要" },
  { when:"🟢 T-2 個月 (2027/7)", task:"🚂 票券購買（既定主方案：STP 15 天版）", how:"15 天版 STP 為既定主方案。待 2027 官方票價與購票開放時程公布後，僅更新售價／適用範圍／規則並購買，不重新比較票券方案。（歷史比較說明：與 8 天版 STP＋其餘單買、Swiss Half Fare Card＋單買比較總成本後鎖定並購買（sbb.ch / swissrailways.com）。不預設固定天數的官方購買限制。4 大人購買，妞妞 6 歲以下免費。預算暫採 CHF 515/成人（2027 實際售價公布後重算）", priority:"🔴 必做" },
  { when:"🔵 T-2 個月 (2027/7)", task:"🥇 Brienz Rothorn（BRB）班次預約", how:"brienz-rothorn-bahn.ch Webshop。2027 官方時刻表公布後決定；2026 官方班次為 07:36、08:36、09:40、10:45、11:45、12:58、13:58、14:58、16:36（非每小時等距）。STP 半價 CHF 49-50 + 座位保證 CHF 8/人，妞妞 6 歲以下免費不佔位", priority:"🔴 必做" },
  { when:"🟡 T-1.5~2 個月 (2027/7 底)", task:"🥇 Barry's Restaurant 訂位", how:"2027/9/23 (四) 19:00 4 大 1 小，備註 kein Alkohol（若因 BRB 實際班表返家過晚，改 19:30 或延後）", priority:"🔴 必做" },
  { when:"🟡 T-1 個月 (2027/8)", task:"LIE（Luzern-Interlaken Express）座位預約", how:"透過 Zentralbahn 官方指定座位預約系統辦理；2027/9 預約費率待官方公布；STP 涵蓋列車本身，座位預約費另計；未預約仍可持 STP 搭乘但不保證座位（備援）", priority:"🟡 建議" },
  { when:"🟡 T-1 個月 (2027/8)", task:"採購裝備與耗材", how:"妞妞健行鞋、防曬乳、瑞士轉接頭、行動電源", priority:"🟡 重要" },
  { when:"🟡 T-2 週 (2027/8 底)", task:"兒童藥品備齊", how:"退燒、止瀉、止癢、體溫計、防蚊液", priority:"🔴 必做" },
  { when:"⚫ T-2 天 (2027/9/11)", task:"SBB 行李寄送分裝", how:"5 件大行李 Day 3 早上寄琉森車站至 Grindelwald；主方案共 CHF 120（5 件 × CHF 12 × 2 段）", priority:"🟡 重要" },
  { when:"🔴 旅程中 · Day 3 (9/16)", task:"🛅 SBB 行李寄送 Round 1（琉森→Grindelwald）", how:"約 07:45 出發 → 08:00 SBB Luzern luggage counter 開門後辦理，5 件 Station-to-Station 寄至 Grindelwald，約 08:20–08:30 完成，現行 CHF 60（2027 營業時間出發前再確認）", priority:"🔴 必做" },
  { when:"🔴 旅程中 · Day 8 (9/21)", task:"🛅 SBB 行李寄送 Round 2（Grindelwald→ZRH 機場）", how:"上午於 Grindelwald 車站 luggage counter 寄送 5 件至 Zürich Flughafen，現行 CHF 60（CHF 12/件）。⚠️ 該站實際開放時段依 sbb.ch 分站頁為準。今日交件、後天領取（SBB 官方措辭，不是 2 工作天）", priority:"🔴 必做" }
];

const PACKING = [
  { cat:"📄 文件", items:[
    passportPackingLine(),
    etiasPackingLine(),
    "訂房憑證（KoBi + Sans Souci W1）紙本+電子",
    "機票電子檔（去程兩段 + 回程兩段，共 4 段登機證）",
    "旅遊保險證明",
    "STP 通行證紙本",
    `緊急聯絡資訊已存手機＋紙本（駐瑞士代表處急難手機 ${CONSULATE_CONTACT.emergency}；一般聯絡 ${CONSULATE_CONTACT.general}）`,
    "信用卡 × 2（含 PIN）",
    "現金：瑞郎 CHF 300 + 台幣轉機備用",
    `妞妞護照 ＋ ${etiasPackingLine("妞妞")} ＋ 出生證明備份`
  ], where:"🛂 隨身行李護照夾"},
  { cat:"📱 電子設備", items:[
    "手機（漫遊或 eSim）",
    "充電器 × 全員",
    "行動電源 × 2-3",
    "Type J 瑞士轉接頭 × 3",
    "相機 + 備用記憶卡",
    "平板（離線下載卡通+電影）",
    "耳機 + 充電線備用",
    "妞妞專屬平板 + 兒童耳機（下載 5-10 集卡通）"
  ], where:"🎒 隨身行李（絕不寄送）"},
  { cat:"👕 服裝", items:[
    "💡 KoBi + Sans Souci W1 都有洗衣機（KoBi 還有烘乾機），衣物按 4-5 天備即可",
    "防風防水外套 × 1（必）",
    "薄羽絨 × 1、長袖上衣 × 5、長褲 × 3-4",
    "健行褲 × 1、內衣褲 × 7、厚襪 × 5",
    "🥾 Gore-Tex 健行鞋 × 1（已磨合，Day 5-10 必備）",
    "👟 跑鞋/休閒鞋 × 1（琉森市區+機場+湖畔）",
    "保暖內衣 × 2、毛衣 × 1",
    "圍巾、毛帽、保暖手套、太陽眼鏡 UV400",
    "妞妞防風防水外套（兒童冬季）、薄羽絨",
    "妞妞長袖上衣 × 5-6、長褲 × 4-5",
    "🥾 妞妞防滑健行鞋（提前 2 週磨合）",
    "☀️ 全覆蓋遮陽帽 × 2（第一頂常丟）",
    "☀️ 兒童太陽眼鏡 UV400 × 2"
  ], where:"👶 妞妞 1 件指定行李 + 1 套保暖衣隨身"},
  { cat:"🍼 飲食與餵養", items:[
    "保溫瓶 × 2、摺疊水壺 × 2",
    "環保餐具組",
    "即食食品（泡麵、味噌湯包、糖果）",
    "🌾 奇亞籽 / 洋車前子殼（腸胃防禦，早餐混優格）",
    "🚨 妞妞奶瓶 × 3 + 奶嘴 × 4",
    "🚨 妞妞奶粉（12 天 + 3 天緩衝）",
    "🚨 妞妞副食品/果泥 × 12 包",
    "🚨 妞妞嬰兒餅乾/米餅",
    "🚨 妞妞兒童餐具（防摔湯匙、便攜餐墊）",
    "妞妞圍兜 × 5、安撫奶嘴 × 3",
    "妞妞兒童益生菌"
  ], where:"🧷 妞妞 48h 必需品隨身行李"},
  { cat:"🧴 衛浴用品", items:[
    "牙刷牙膏 × 4",
    "洗髮精/沐浴乳（旅行裝）",
    "速乾毛巾 × 4",
    "🚨 妞妞尿布 × 70-80 片",
    "🚨 妞妞濕紙巾 × 5-6 包",
    "妞妞屁屁霜、嬰兒沐浴乳、乳液",
    "妞妞口水巾 × 5、兒童牙刷牙膏",
    "妞妞換洗墊 × 3"
  ], where:"🧷 妞妞 48h 必需品隨身"},
  { cat:"💊 藥品", items:[
    "暈車藥、感冒藥（綜合）",
    "止痛藥（普拿疼）、腸胃藥/止瀉藥",
    "慢性病藥（多帶 1 週緩衝）",
    "過敏藥、外用藥膏",
    "OK 繃、紗布、消毒液",
    "暈機藥",
    "🚨 妞妞兒童退燒藥（口服液+塞劑）",
    "🚨 妞妞兒童止痛藥、止瀉藥、止癢藥膏",
    "🚨 妞妞體溫計（額溫槍）",
    "妞妞防蚊液（DEET 10% 以下兒童版）",
    "妞妞過敏藥、益生菌"
  ], where:"🧷 妞妞藥品隨身+護照夾旁"},
  { cat:"☀️ 防曬與紫外線", items:[
    "成人防曬乳 SPF 50+",
    "成人太陽眼鏡 UV400",
    "🚨 妞妞 SPF 50+ 兒童專用防曬乳 × 2 條",
    "🚨 妞妞全覆蓋遮陽帽 × 2（含備用，第一頂常被丟下山）",
    "🚨 妞妞兒童太陽眼鏡 UV400 × 2（含備用）",
    "推車全罩式遮陽蓬（含 UV 防護布）"
  ], where:"👶 妞妞指定行李"},
  { cat:"🍼 戶外裝備", items:[
    "🚨 嬰兒背巾 × 2（Bachalpsee 主方案）",
    "嬰兒推車（含防風罩、雨罩）",
    "折疊背包 × 4（健行用）",
    "頭燈/手電筒 × 1",
    "摺疊購物袋 × 3",
    "大型夾鏈袋 × 5（裝濕衣物）",
    "推車防風罩、雨罩、保暖毯（冰河峽谷必需）"
  ], where:"🎒 上機帶推車，背巾掛隨身包"},
  { cat:"🛏️ 睡眠用品", items:[
    "旅行枕、眼罩、耳塞",
    "妞妞安撫巾 / 小毯子（認床必備）",
    "妞妞安撫玩具 × 1（最愛那隻）",
    "妞妞兒童睡眠音樂（手機 App 預存）"
  ], where:"👶 妞妞指定行李，安撫巾隨身"},
  { cat:"🧴 洗衣膠囊（包裝提醒）", items:[
    "⚠️ 建議放入託運行李、避免放隨身登機包（依當年度隨身液體/凝膠限制與各機場安檢實務為準）",
    "⚠️ 建議裝入「硬殼保鮮盒」再放託運行李",
    "⚠️ 高空可能因壓力/擠壓破裂，滲入洗劑毀損整箱衣物",
    "✅ 建議：方形樂扣保鮮盒，內墊塑膠袋雙層防漏",
    "洗衣袋 × 2、拖鞋、衛生紙、口罩備用"
  ], where:"🛅 硬殼保鮮盒放寄送行李" }
];
