
const TRIP_META = {
  title: "瑞士家族大冒險 2027",
  subtitle: "4 大 1 小・12 天親子自由行",
  departure: "2027-09-13",  // 台灣起飛
  arrival: "2027-09-14",    // 蘇黎世抵達
  returnDate: "2027-09-25", // 返回台灣
  members: [
    { name:"Morris", role:"爸爸", note:"隊長 · 導航 · 交通後勤" },
    { name:"Emily",  role:"媽媽", note:"妞妞主要照護 · 妞妞包管理" },
    { name:"皮皮",   role:"成人", note:"與 Emily 熟識" },
    { name:"Milo",   role:"成人", note:"與 Morris、Emily 熟識" },
    { name:"妞妞",   role:"2 歲 3 個月幼童", note:"使用嬰兒推車 · 妞妞用品合併 Emily 過夜包" }
  ],
  logistics: "5 件大行李（23kg）＋ 4 個過夜包（20-30L）＋ 1 台推車"
};

const HOTELS = {
  luzern: {
    name:"KoBi Apartments Hirschenplatz",
    city:"琉森 Luzern",
    address:"Hirschenplatz 12, 6004 Luzern",
    checkIn:"2027-09-14 (二)", checkOut:"2027-09-18 (六)",
    nights:4, status:"已預訂",
    priceTWD:125000,
    mapQuery:"KoBi Apartments Hirschenplatz Luzern",
    notes:"3 房 2 衛含陽台公寓，booking.com 免費取消方案"
  },
  grindelwald: {
    name:"Apartment Atlanta by GRIWA RENT",
    city:"格林德瓦 Grindelwald",
    address:"Grundstrasse 19, 3818 Grindelwald",
    office:"GRIWA RENT 辦公室：Dorfstrasse 118, 3818 Grindelwald",
    phone:"+41 33 854 11 40",
    website:"griwarent.ch",
    checkIn:"2027-09-18 (六)", checkOut:"2027-09-24 (五)",
    nights:6, status:"訂房政策：出發前 12 個月開放；官網 griwarent.ch 直訂享 10-15% 折扣，可比較 booking.com",
    priceCHF:3274.80,
    mapQuery:"Grundstrasse 19 Grindelwald",
    notes:"4.5 房 / 3 臥 / 2 衛 / 96㎡ / 6 人 / WiFi、車庫、洗衣機。官網直訂享 10-15% 折扣"
  }
};

const FLIGHTS = {
  outbound: {
    airline:"Emirates 阿聯酋",
    flightNo:"EK87 / EK+杜拜轉機",
    depart:"2027-09-13 (日) 晚間 · TPE 桃園",
    stopover:"DXB 杜拜（約 2h 轉機）",
    arrive:"2027-09-14 (二) 13:20 · ZRH 蘇黎世"
  },
  return: {
    airline:"Emirates 阿聯酋",
    flightNo:"EK88 → EK366",
    depart:"2027-09-24 (五) 15:25 · ZRH 蘇黎世",
    stopover:"DXB 杜拜（EK366 約 09:30 起飛）",
    arrive:"2027-09-25 (六) 約 22:00 · TPE 桃園"
  }
};

const EMERGENCY = [
  { cat:"急難救助", items:[
    { label:"瑞士警察", tel:"117", note:"報案／治安" },
    { label:"瑞士消防", tel:"118", note:"火警／救援" },
    { label:"瑞士醫療緊急", tel:"144", note:"救護車" },
    { label:"歐洲統一緊急", tel:"112", note:"任何緊急狀況" },
    { label:"高山救援 REGA", tel:"1414", note:"直升機山難救援" }
  ]},
  { cat:"台灣官方", items:[
    { label:"駐瑞士代表處 · 一般聯絡", tel:"+41 31 382 29 27", note:"護照遺失、簽證、文件驗證（辦公時間）" },
    { label:"駐瑞士代表處 · 另一線", tel:"+41 31 350 80 50", note:"備用聯絡電話" },
    { label:"🆘 駐瑞士代表處 · 急難救助手機", tel:"+41 76 336 6979", note:"限車禍、搶劫、生命安危等重大急難" },
    { label:"外交部旅外急難救助 · 全球免付費", tel:"+800 0885 0885", note:"境外免付費專線（原號碼已更正）" },
    { label:"地址", tel:"", note:"Kirchenfeldstrasse 14, 3005 Bern" }
  ]},
  { cat:"住宿聯絡", items:[
    { label:"KoBi Hirschenplatz (琉森)", tel:"", note:"booking.com 預訂，詳見訂房確認信" },
    { label:"GRIWA RENT (格林德瓦)", tel:"+41 33 854 11 40", note:"⚠️ Apartment Atlanta 管理處，出發前務必至 griwarent.ch 核對" }
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
        time:"13:20–15:00", title:"抵達蘇黎世機場 ZRH + 從容通關領行李",
        tr:{ label:"入境", icon:"plane" },
        stp:"none",
        steps:[
          "飛機 13:20 落地後立刻開啟網路報平安",
          "跟隨 Exit / Baggage Claim 指標往入境大廳",
          "護照查驗（誠實答 Tourism），ETIAS 若 2027 前正式上路請依官方公告",
          "確認行李轉盤，提領 5 件大行李 + 推車",
          "走綠色通道 Nothing to declare 出關"
        ],
        defense:[
          "下午抵達，海關通關約 30-45 分鐘",
          "妞妞疲憊度高，推車立刻派上用場",
          "時程從容版：主推 15:04 IR 70 直達車（不趕 14:34）",
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
          "全員洗熱水澡放鬆",
          "前往琉森車站 B1 Coop 採買（鮮奶、麵包、火腿起司、水果）"
        ],
        defense:[
          "琉森 Coop 週二正常營業 08:00-19:00",
          "第一天採買重點：簡單晚餐 + 隔日早餐"
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
    day:2, date:"09/15 (三)", loc:"琉森 Luzern", theme:"女皇登山慶典（瑞吉山）",
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
          "無縫轉乘：火車等船客全上完才開車",
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
          "推車天堂：山頂步道極度平緩",
          "山上風大需加件薄外套",
          "13:15 準時收拾出發下山"
        ],
        critical:[]
      },
      {
        time:"13:15–14:30", title:"下坡健行至 Rigi Kaltbad",
        tr:{ label:"步行 2.5km", icon:"walk" }, stp:"none",
        steps:[
          "沿指標往下坡至半山腰 Rigi Kaltbad（緩坡碎石路約 75 分鐘）"
        ],
        defense:[
          "健行步道風景極佳且平緩，適合推推車散步",
          "🆘 備案：若妞妞鬧，Kulm 搭紅色火車 1 站至 Kaltbad（8 分鐘），不影響後續"
        ],
        critical:[]
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
        time:"16:15–19:00", title:"獅子紀念碑 ＋ 舊城區晚餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "回琉森後前往獅子紀念碑",
          "漫步舊城區石板路與濕壁畫",
          "前往預定的餐廳（Rathaus Brauerei 或 Restaurant Pfistern）吃晚餐慶祝"
        ],
        defense:[
          "獅子紀念碑公園步道平緩好推推車",
          "舊城區石板路稍有顛簸"
        ],
        critical:[]
      }
    ]
  },

  {
    day:3, date:"09/16 (四)", loc:"琉森 Luzern", theme:"人文日 ＋ SBB 行李戰術寄送",
    hotelKey:"luzern",
    tl:[
      {
        time:"07:00–09:00", title:"🛅 SBB 行李戰術寄送 ＋ 戰術集結",
        tr:{ label:"步行至琉森車站", icon:"luggage" }, stp:"none",
        steps:[
          "早上 07:00 起床（時差已調整 2 天）",
          "3 大人前一晚已分裝好的 5 件大行李推到琉森車站",
          "跟 Gepäck / Luggage 指標找 SBB 行李櫃台（通常 07:00 開門）",
          "出示護照 + STP，填寄送單：寄至 Grindelwald 站，9/18 (六) 領取",
          "付費 CHF 12 × 5 件 = CHF 60，保留收據與寄物編號",
          "08:30 全家集合前往獅子紀念碑（步行 15 分鐘）"
        ],
        defense:[
          "全寄策略：5 件全部寄送，全員只帶過夜包 + 推車移動",
          "彈性：若擔心延誤，可留妞妞那件當保險（尿布奶粉不斷炊），CHF 12 × 4 = CHF 48"
        ],
        critical:[
          "貴重物品絕對不寄送：護照、機票、STP、現金、信用卡",
          "妞妞 48h 必需品全在 Emily 過夜包：尿布、奶粉、副食品、藥品",
          "全家 1 套保暖衣分散各過夜包",
          "電池、鋰電池類產品全部抽出放隨身"
        ]
      },
      {
        time:"09:00–10:30", title:"獅子紀念碑 ＋ 冰河公園",
        tr:{ label:"步行", icon:"walk" }, stp:"free",
        steps:[
          "獅子紀念碑快閃拍團體合照（趁大批團客抵達前）",
          "步行 1 分鐘進冰河公園",
          "核心任務：帶妞妞直衝鏡子迷宮（Alhambra），大人小孩一起迷路大笑"
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
        time:"10:30–11:30", title:"霍夫教堂 Hofkirche",
        tr:{ label:"步行", icon:"walk" }, stp:"free",
        steps:[
          "下坡走 5 分鐘抵達琉森最美的雙尖塔教堂",
          "靜心參觀，感受中世紀宗教氛圍"
        ],
        defense:["教堂內需保持安靜，若妞妞不安分，大人輪流進去"],
        critical:[]
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
          "妞妞主場：兒童 Media Factory + 小火車互動區",
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
          "若 Webcam 顯示白牆，隔日直接啟動 Day 4 備案（藍湖+歐新能湖）"
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
        time:"11:10–11:50", title:"世界最陡齒軌火車攀升",
        tr:{ label:"Pilatus 齒軌", icon:"train" }, stp:"half",
        steps:[
          "下船後至售票處，出示 STP + 預約憑證（CHF 5 已付）",
          "購買整段 Golden Round Trip 套票（含下山纜車）",
          "走預約通道上車",
          "🥇 直奔整台列車的最後一節（車尾）視野最佳"
        ],
        defense:[
          "推車必收折，大人抱緊寶寶",
          "耳壓對策：準備水或小零食讓寶寶咀嚼減壓",
          "耳壓不適哭鬧 5-10 分鐘屬正常"
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
          "搭大纜車至 Fräkmüntegg",
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
      title:"Day 4 備案：藍湖 ＋ 歐新能湖雙湖連破",
      trigger:"皮拉圖斯山頂 Webcam 顯示白牆時啟動",
      tl:[
        {
          time:"08:00–11:00", title:"直衝藍湖秘境",
          tr:{ label:"IC → Bern → Frutigen → 230 公車", icon:"train" }, stp:"free",
          steps:[
            "08:00 全團準時出發，輕裝不帶行李",
            "SBB App 輸入 Luzern → Blausee BE",
            "經伯恩轉乘至 Frutigen 站",
            "出站換 230 號公車（往 Kandersteg 方向）"
          ],
          defense:["230 公車 1 小時一班，導航股長務必盯緊時間"],
          critical:[]
        },
        {
          time:"11:00–13:00", title:"藍湖野餐 ＋ 透明底小船",
          tr:{ label:"步行", icon:"walk" }, stp:"paid",
          steps:[
            "入口購票（門票約 CHF 11-13，STP 無折）",
            "先排隊搭乘門票內含的透明底小木船",
            "湛藍湖畔野餐、看鱒魚、找羊駝",
            "繞湖散步一圈（約 20 分鐘）"
          ],
          defense:["藍湖森林步道全平緩，推車直達湖畔"],
          critical:["13:00 準時集合，搭 230 公車接駁坎德斯泰格"]
        },
        {
          time:"13:00–14:05", title:"藍湖 → 坎德斯泰格",
          tr:{ label:"230 公車 → BLS 火車", icon:"bus" }, stp:"free",
          steps:[
            "230 公車往 Frutigen 方向（約 15 分鐘）",
            "轉乘 BLS 火車往 Kandersteg（約 15 分鐘）"
          ],
          defense:[],
          critical:[]
        },
        {
          time:"14:05–15:45", title:"🏔️ 歐新能湖 Oeschinensee 翡翠秘境",
          tr:{ label:"纜車", icon:"cablecar" }, stp:"half",
          steps:[
            "出坎德斯泰格車站跟 Oeschinensee 指標步行 5 分鐘至纜車站",
            "湖畔碼頭租一艘傳統木划船（約 CHF 20/30 分鐘）",
            "沿湖畔步道走 30 分鐘至湖的另一端",
            "近距離仰視 Blüemlisalp 冰河群峰"
          ],
          defense:[
            "纜車站有電梯，推車可直接進纜車廂",
            "湖畔步道整體平緩，靠懸崖側路面有碎石",
            "15:30 準時撤退回纜車站"
          ],
          critical:[]
        },
        {
          time:"15:45–18:00", title:"撤退返回琉森",
          tr:{ label:"BLS → IC/IR", icon:"train" }, stp:"free",
          steps:[
            "纜車下山回坎德斯泰格車站，搭 BLS 火車至 Spiez（30 分鐘）",
            "Spiez 轉 IC/IR 往 Bern，轉直達車回琉森（總車程 1h45m）",
            "回琉森後車站 B1 Coop 買熟食晚餐"
          ],
          defense:["傍晚山區起冷風，撤退前替妞妞加件外套"],
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
        time:"09:15–10:06", title:"琉森拔營 ＋ zb 景觀線卡位",
        tr:{ label:"退房＋前往車站", icon:"walk" }, stp:"none",
        steps:[
          "09:15 辦理退房（爭取彈性 45 分鐘）",
          "09:30 抵達車站，09:50 前往月台卡位",
          "兵分兩路強攻車廂兩端大型行李架",
          "電子看板顯示「zb」或「Zentralbahn」"
        ],
        defense:[
          "🎫 座位預約強烈建議：週六旺季，預約 4 相連座位 CHF 10-14/人",
          "SBB App 提前 1 個月預約"
        ],
        critical:[
          "週六旺季沒預約可能罰站 2 小時"
        ]
      },
      {
        time:"10:06–12:00", title:"zb 全景景觀線 → Interlaken Ost",
        tr:{ label:"Zentralbahn 景觀列車", icon:"train" }, stp:"free",
        steps:[
          "🥇 全員鎖定「行車方向右側」座位！龍疆湖與湖光山色全在右邊",
          "沿途經過 Sarnersee、Lungerersee（愛的迫降取景地）",
          "到站前 5 分鐘 SBB App 會提示，全員推行李至車門邊預備"
        ],
        defense:["現代化全景大窗車廂，視野極佳"],
        critical:[]
      },
      {
        time:"12:00–13:00", title:"🚨 BOB 拆解雷區 · 全程最關鍵一段",
        tr:{ label:"BOB 黃綠山地列車", icon:"train" }, stp:"free",
        steps:[
          "12:00 zb 抵 Interlaken Ost，跟 Grindelwald 指標換月台",
          "轉乘時間 4-30 分鐘（依班次）",
          "選 12:34 BOB（30 分鐘從容，可上廁所喝咖啡）",
          "上車後鎖定左側座位（艾格北壁逐漸放大）",
          "約 35 分鐘抵達 Grindelwald 終點站"
        ],
        defense:[
          "SOP 4 步驟：① 確認月台 Sector B 位置 ② 看螢幕標示 ③ 確認車廂電子看板顯示「Grindelwald」 ④ 確認車廂上方掛有 B 字標示",
          "前一晚 SBB App 查當日實際月台與 Sector 配置"
        ],
        critical:[
          "BOB 列車會在 Zweilütschinen 站「自動拆解」！",
          "開往 Grindelwald 的是「後段車廂 Sector B」，前段 Sector A 開往 Lauterbrunnen（瀑布鎮）",
          "全團 5 人+5 大行李必須全部擠在同一節 Sector B 後段車廂內",
          "絕對不能無腦衝前段車廂，否則會被載到瀑布鎮"
        ]
      },
      {
        time:"13:00–14:30", title:"抵達格林德瓦 ＋ 領行李 ＋ Check-in",
        tr:{ label:"步行/計程車", icon:"walk" }, stp:"none",
        steps:[
          "出 Grindelwald 車站",
          "🥇 SOP 鐵律：① 下車 → ② 直奔行李櫃檯領取寄送 5 件 → ③ 14:00 後 Check-in → ④ 卸下才場勘採買",
          "步行或叫計程車（CHF 15-20）至 Apartment Atlanta",
          "📸 車站前廣場拍第一張全家合照，背景就是艾格北壁"
        ],
        defense:["出車站時艾格北壁就在正前方，全員第一眼會被 1,800m 垂直岩壁震懾"],
        critical:[
          "Grindelwald 車站行李櫃檯 17:00-18:00 就打烊！",
          "13:00 抵達時間充足，但絕對不能先 check-in 或吃晚餐再回來領",
          "若錯過營業時間，當晚全團只能靠隨身過夜包撐"
        ]
      },
      {
        time:"14:30–17:00", title:"小鎮場勘 ＋ Coop 大採買",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "沿主街 Dorfstrasse 散步：超市 Coop、餐廳、纜車站、火車站",
          "至 Coop 大採買（今晚晚餐+早餐+接下來自炊食材+葡萄酒）",
          "妞妞推回飯店休息，大人輪流補貨"
        ],
        defense:[
          "格林德瓦 Coop 比一般村莊大很多",
          "週六正常營業 08:00-19:00",
          "預算約 CHF 250-350"
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
    day:6, date:"09/19 (日)", loc:"格林德瓦 Grindelwald", theme:"勞特布魯嫩谷地日",
    hotelKey:"grindelwald",
    tl:[
      {
        time:"09:00–10:00", title:"BOB 輕裝出擊 → 瀑布鎮",
        tr:{ label:"BOB 經 Zweilütschinen", icon:"train" }, stp:"free",
        steps:[
          "輕裝出門，大行李全留木屋",
          "🚂 從 Grindelwald 搭 BOB 往下山方向 Interlaken Ost",
          "在 Zweilütschinen 站下車（約 23 分鐘）",
          "同月台或鄰近月台轉往 Lauterbrunnen 上山方向（約 5 分鐘）"
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
        time:"10:00–12:00", title:"🎠 Spielplatz Lauterbrunnen 兒童遊樂場",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "村中心附近免費兒童遊樂場（Google Maps 搜「Spielplatz Lauterbrunnen」）",
          "滑梯、鞦韆、爬繩應有盡有",
          "放電 30-60 分鐘 CP 值最高"
        ],
        defense:[
          "妞妞在這裡的興奮度會比看瀑布高 10 倍",
          "遊樂場設施完整，妞妞可自由放電"
        ],
        critical:[
          "Trümmelbachfälle 官方規定：4 歲以下幼童（含使用背巾、抱在身上）一律不得入內",
          "妞妞（2.5 歲）100% 會被擋下，背巾、抱嬰、推車都不能規避",
          "強烈建議跳過 Trümmelbach，改玩 Spielplatz + Staubbachfall"
        ]
      },
      {
        time:"12:00–13:00", title:"🌸 Staubbachfall 朝聖 ＋ 谷地野餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "從 Lauterbrunnen 車站沿主街往南走 10-15 分鐘",
          "正前方就是 Staubbach 瀑布（300m 高細白紗，全程免費）",
          "找瀑布前的草地或長椅野餐",
          "拍《愛的迫降》同款：山村教堂+瀑布合影"
        ],
        defense:[
          "Staubbach 300m 高懸崖直落，水量大時細霧瀰漫整個山谷",
          "步道平緩柏油路，推車友善"
        ],
        critical:[]
      },
      {
        time:"13:00–15:00", title:"瀑布谷地平緩健行（推車天堂）",
        tr:{ label:"步行 4km", icon:"walk" }, stp:"none",
        steps:[
          "吃飽後沿谷地步道往 Lauterbrunnen 車站方向散步",
          "全程平緩柏油/碎石路，推車極度滑順",
          "沿途朝聖從 300m 高懸崖垂直落下的 Staubbach",
          "抵達車站時間約 14:30-15:00"
        ],
        defense:[
          "全瑞士最推薦嬰幼兒友善步道",
          "9 月午後光線柔和，三面 300m 岩壁包圍的夢幻場景",
          "備案：體力下降隨時跳上 141 號公車直接回車站"
        ],
        critical:[]
      },
      {
        time:"15:00–16:00", title:"BOB 回格林德瓦",
        tr:{ label:"BOB 經 Zweilütschinen", icon:"train" }, stp:"free",
        steps:[
          "Lauterbrunnen 搭 BOB 下山到 Zweilütschinen（約 5 分鐘）",
          "Zweilütschinen 換乘往 Grindelwald 上山方向（約 23 分鐘）"
        ],
        defense:[
          "回程一樣在 Zweilütschinen 轉，不需要再到 Interlaken Ost",
          "BOB 每 30 分鐘一班，下午回程不用衝時間"
        ],
        critical:[]
      },
      {
        time:"16:00–20:00", title:"木屋慢活 ＋ 自炊晚餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "回木屋洗熱水澡驅除瀑布水氣",
          "自炊晚餐（用 Day 5 採購食材）",
          "早早休息，保留體力迎接明天神級全景健行"
        ],
        defense:["明天 Day 7 走 6 km Panorama Trail，是這趟最長健行日"],
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
        tr:{ label:"步行/公車", icon:"bus" }, stp:"free",
        steps:[
          "早餐後輕裝出門",
          "從木屋步行至 Grindelwald Terminal 站約 15-20 分鐘，或搭公車（5 分鐘）",
          "跟 Männlichen（黃綠色標示）指標進站"
        ],
        defense:[
          "後背包裝水、能量棒、防曬乳、墨鏡、防風外套、妞妞替換衣物",
          "Grindelwald Terminal 是 2020 年啟用的全新大型纜車轉運站"
        ],
        critical:[
          "共構車站有 2 條纜車！今天搭 GGM（10 人座黃綠），不是 Eiger Express（26 人座紅黑）！",
          "Eiger Express 是去艾格冰川/少女峰用的，方向完全不同"
        ]
      },
      {
        time:"10:00–10:30", title:"GGM 纜車直上曼利申（2,230m）",
        tr:{ label:"GGM 黃綠纜車", icon:"cablecar" }, stp:"half",
        steps:[
          "出示 STP 購 Grindelwald Terminal → Männlichen 單程半價票（約 CHF 35-40/成人）",
          "妞妞免費",
          "搭 GGM 10 人座纜車，全程 19-20 分鐘"
        ],
        defense:[
          "推車折疊後可放置車廂中間",
          "氣壓對策：1,034m → 2,230m 耳壓變化明顯，備水或零食",
          "🥇 纜車爬升時往回看（朝山下），格林德瓦全景+艾格北壁同時收入眼底"
        ],
        critical:[]
      },
      {
        time:"10:30–13:00", title:"皇冠觀景台 ＋ 33 號全景步道 6km",
        tr:{ label:"步行 6km 緩下坡", icon:"walk" }, stp:"none",
        steps:[
          "出 Männlichen 山頂站，先走 Royal Walk 上皇冠造型觀景台（15-20 分鐘）",
          "回主站跟黃色指標「Kleine Scheidegg」出發（33 號 Panorama Trail）",
          "沿途 6 km 緩下坡，右側是艾格、僧侶、少女峰三峰正面",
          "左側俯瞰格林德瓦谷地"
        ],
        defense:[
          "🥇 硬派戰術：嬰兒背巾為主方案，運動型推車當裝備運輸車",
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
          "⚠️ WAB Grindelwald ↔ Kleine Scheidegg 段 STP 折扣待確認",
          "舊資料常寫「25% 折扣需補差價」，但實際 STP 涵蓋範圍可能為 100% 免費",
          "出發前 1 個月透過 sbb.ch 或 SBB App 查詢當年度 STP 涵蓋規則",
          "若需補票約 CHF 15-20/成人"
        ]
      },
      {
        time:"16:00–21:00", title:"木屋慢活 ＋ 豐盛自炊",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "回木屋，全員洗熱水澡放鬆腳部，妞妞午睡補眠",
          "自炊晚餐：烤雞+馬鈴薯泥+葡萄酒犒賞",
          "早睡，明天古董蒸汽火車日"
        ],
        defense:["全景步道走完通常會讓妞妞與大人都疲憊，今晚不安排額外活動"],
        critical:[]
      }
    ]
  },

  {
    day:8, date:"09/21 (二)", loc:"格林德瓦 Grindelwald", theme:"古董蒸汽火車神奇日 ＋ 機場行李寄送",
    hotelKey:"grindelwald",
    tl:[
      {
        time:"07:30–09:15", title:"🛅 SBB 機場行李寄送 ＋ 輕裝出擊",
        tr:{ label:"BOB", icon:"luggage" }, stp:"free",
        steps:[
          "07:30 起床（Emily 顧妞妞，其他 3 大人拖 5 件大行李去車站）",
          "07:45 抵 Grindelwald 車站，直奔 Gepäck / Luggage 櫃檯（08:00 前開門）",
          "出示護照 + STP，寄送單填：起點 Grindelwald、終點 Zürich Flughafen、預計領取 9/24 (五) 中午",
          "付費 CHF 12 × 5 件 = CHF 60，保留收據與寄物編號",
          "08:00-08:15 回公寓集合，全員切換 Wilderswil 輕裝模式",
          "08:36 BOB Grindelwald → 09:00 抵 Zweilütschinen → 轉車 → 09:15 抵 Wilderswil"
        ],
        defense:[
          "🥇 終極防禦邏輯：Day 11 兩次轉車會是災難，提前寄送機場",
          "Day 8 早交件 + Day 10 送達 + Day 11 絕對到位，容錯率高",
          "彈性：若擔心延誤可留妞妞包當保險，4 件寄送"
        ],
        critical:[
          "寄送前檢查：貴重物品、電池、鋰電池類產品全部抽出放隨身",
          "Day 11 領取收據務必分開放，避免遺失同時發生"
        ]
      },
      {
        time:"09:25–10:15", title:"1893 年古董齒軌火車上山",
        tr:{ label:"Schynige Platte Bahn", icon:"train" }, stp:"half",
        steps:[
          "下 BOB 後跟「Schynige Platte Bahn」指標走，齒軌火車月台就在旁邊",
          "出示 STP 至售票處購 50% 折扣票（成人約 CHF 32-35，妞妞免費）",
          "列車緩緩爬升 50 分鐘，全程「咔噠咔噠」齒輪聲"
        ],
        defense:[
          "🥇 上山務必坐左側（行進方向左），俯瞰 Brienzersee 與圖恩湖",
          "推車放車廂端部（請司機協助），妞妞由大人輪流抱著",
          "建議搭 09:25 班次，避開 10:00 後人潮，火車約 40 分鐘一班"
        ],
        critical:[]
      },
      {
        time:"10:15–13:00", title:"高山植物園 ＋ 全景步道 ＋ 三峰絕景",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "先繞 Alpine Garden 高山植物園一圈（歐洲最古老，600+ 種）",
          "接著走 Panoramaweg 全景步道環狀路線（1-1.5 小時）",
          "沿途艾格、僧侶、少女峰三峰排列，背後 Brienzersee + 圖恩湖",
          "12:00 前找位置午餐（Hotel Restaurant Schynige Platte 或自備野餐）"
        ],
        defense:[
          "步道平緩碎石，推車可推。少數陡坡輪流抱妞妞",
          "遊客密度低：9 月平日山頂僅 30-50 人，是私房景點",
          "🥇 攝影點：Daube 觀景台從植物園走 15 分鐘"
        ],
        critical:[]
      },
      {
        time:"13:00–14:00", title:"下山 → Wilderswil",
        tr:{ label:"Schynige Platte Bahn", icon:"train" }, stp:"half",
        steps:[
          "搭 13:14 班次下山（回程 50 分鐘）",
          "🥇 下山改坐右側，換另一邊視角俯瞰湖區",
          "抵 Wilderswil 轉 BOB 回 Grindelwald（30 分鐘）"
        ],
        defense:["最後一班約 16:45，時間充裕"],
        critical:[]
      },
      {
        time:"14:30–18:00", title:"格林德瓦小鎮耍廢",
        tr:{ label:"BOB→步行", icon:"walk" }, stp:"none",
        steps:[
          "14:30 回 Grindelwald，妞妞回木屋午睡",
          "大人輪流逛 Dorfstrasse 戶外用品店（Mammut、Bächli）",
          "喝下午咖啡、買瑞士巧克力伴手禮",
          "17:00 前回木屋準備自炊晚餐"
        ],
        defense:[
          "今天節奏比 Day 7 輕鬆，是「半休息日」",
          "為明天 First 山+Bachalpsee 儲備體力",
          "Bächli Bergsport 是瑞士最大連鎖戶外用品店"
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
          "後背包：兩瓶水、能量棒、薄外套、妞妞推車與野餐午餐",
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
          "Bort Spielplatz 是妞妞今日「放電主場」"
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
        tr:{ label:"步行 3km 緩坡", icon:"walk" }, stp:"none",
        steps:[
          "從 First 站跟黃色指標「Bachalpsee」出發",
          "⚠️ 前段是連續陡上坡+碎石路+無遮蔽，最辛苦的 20-30 分鐘",
          "過了起伏段路面趨於平緩，單程約 50 分鐘抵達湖畔",
          "沿湖畔走到對岸（環湖約 20 分鐘），找最佳構圖點拍三峰倒影"
        ],
        defense:[
          "🥇 全行程最美照片：上午光線下三峰倒映湖面",
          "湖水深綠中帶藍，是冰川融水，水溫極低不可下水",
          "🥇 硬派戰術：嬰兒背巾為主，推車放水外套零食（省力 60%）"
        ],
        critical:[
          "前 20-30 分鐘連續陡峭上坡碎石路，海拔 2,168m → 2,265m",
          "2 歲幼童在推車內連續顛簸 40-60 分鐘容易情緒崩潰",
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
        critical:["別直接坐纜車到底，中段 Bort 下車是妞妞真正主場"]
      },
      {
        time:"16:30–21:00", title:"木屋休息 ＋ 慶祝晚餐",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "回木屋，全員洗熱水澡，妞妞放電後可能秒睡午覺",
          "大人輪流去主街採買甜點、葡萄酒",
          "自炊豐盛晚餐慶祝 Bachalpsee 健行",
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
    day:10, date:"09/23 (四)", loc:"格林德瓦 → Brienz → Interlaken", theme:"Brienz Rothorn 蒸汽火車 ＋ 慶功宴",
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
          "🥇 今日主軸：1892 Brienz Rothorn 蒸汽齒軌火車，看 693 座山峰",
          "旺季偶爾改柴油機車，但景觀相同",
          "💡 山頂野餐配 693 山峰大景，比餐廳更有儀式感"
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
          "若已事先線上訂票，直接刷 QR Code 過閘"
        ]
      },
      {
        time:"11:22–12:30", title:"🚂 Brienz Rothorn Bahn 1892 蒸汽齒軌 (60 分鐘上山)",
        tr:{ label:"BRB 蒸汽齒軌", icon:"train" }, stp:"half",
        steps:[
          "11:22-11:30 在 BRB 山谷車站售票口出示已預約線上票券",
          "11:30 蒸汽火車出發（建議預約這班；若無則選 12:00，時間軸順延 30 分鐘）",
          "櫻桃紅車廂 + 深綠蒸汽機車，煤煙與汽笛聲是 2.5 歲妞妞會永遠記得的瑞士記憶",
          "中途 Planalp 站短停 5 分鐘讓蒸汽機車補水",
          "12:30 抵 Rothorn Kulm (2,244m)，山頂車站走 1 分鐘就是觀景台"
        ],
        defense:[
          "🚨 必須線上預約座位：出發前 2-3 個月透過官網 brienz-rothorn-bahn.ch 預約",
          "4 個成人座位（CHF 8/人 × 4 = CHF 32）",
          "妞妞 6 歲以下完全免費、不佔位（坐大人腿上或共用座位），預約時不需特別註記"
        ],
        critical:[
          "BRB 1892 年車廂走道極度狹窄，推車無法推入車廂",
          "折疊後交由站務員放置於「專屬行李車廂」",
          "大人必須全程抱著妞妞搭乘（不能坐推車）",
          "建議 Ergo/Beco 舒適背巾備用，60 分鐘上山比想像中久"
        ]
      },
      {
        time:"12:30–14:00", title:"🏔️ Rothorn Kulm 山頂 (693 山峰 + 野餐)",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "12:30-13:00 觀景台拍照：北看皮拉圖斯、瑞吉、鐵力士；南看艾格、僧侶、少女峰；下方俯瞰布里恩茨湖",
          "13:00-14:00 找大石頭或景觀椅野餐：瑞士起司、麵包、香腸、水果+保溫瓶熱可可",
          "餐後 5-10 分鐘短步道散步，妞妞放電",
          "14:00 收拾野餐，5 分鐘走回車站"
        ],
        defense:[
          "🥇 全行程最廣景觀：鳥瞰式大範圍",
          "山頂步道平緩短小，推車可推 80% 路段",
          "山頂 Berghotel Rothorn Kulm 餐廳可作備案"
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
        time:"14:00–15:00", title:"🚂 蒸汽火車下山（60 分鐘）",
        tr:{ label:"BRB 蒸汽齒軌", icon:"train" }, stp:"half",
        steps:[
          "14:00 火車下山（預約票同時涵蓋上下山）",
          "下山時蒸汽機車變成拉著車廂下山，重力聲更明顯",
          "妞妞可能在下山時睡著（搖晃+引擎節奏=天然搖籃）",
          "15:00 抵 Brienz BRB 山谷車站"
        ],
        defense:[
          "下山車廂位置會調換，建議坐朝向湖景那一側",
          "妞妞 13:00-14:30 午睡時段被切斷，下山火車是補眠最佳時機"
        ],
        critical:[]
      },
      {
        time:"15:00–15:30", title:"🏘️ Brienz 木雕村紀念品快速採購",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "Brienz 是瑞士木雕家鄉，主街上有木雕工坊",
          "推薦：木雕牛、聖伯納犬擺飾、阿爾卑斯山玩具、牛鈴",
          "30 分鐘快速採購——挑小件，避免大型作品"
        ],
        defense:[
          "🥇 Brienz 木雕品質遠勝格林德瓦觀光區，價格較合理",
          "5 件大行李已寄送機場，紀念品裝過夜包或請店家國際寄送"
        ],
        critical:[]
      },
      {
        time:"15:30–15:55", title:"🚂 SBB 火車回 Interlaken Ost (16 分鐘)",
        tr:{ label:"SBB IR", icon:"train" }, stp:"free",
        steps:[
          "15:35 SBB 火車從 Brienz 出發 → 15:51 抵 Interlaken Ost",
          "回程選火車不選船——船 75 分鐘 vs 火車 16 分鐘",
          "火車沿布里恩茨湖南岸行駛，仍可看湖景（右側座位）"
        ],
        defense:["去程船已體驗過，回程節省時間"],
        critical:[]
      },
      {
        time:"15:55–16:30", title:"🛍️ Höheweg 大道 ＋ 三峰最後合照",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "出 Ost 站沿 Höheweg 大道往西走 5-10 分鐘",
          "🥇 Höhematte 草坪抬頭看艾格、僧侶、少女峰最後一張全家合照",
          "大道右側精品店快速逛（Lindt 巧克力、Victorinox 瑞士刀）",
          "16:30 走回 Ost 站"
        ],
        defense:[
          "🥇 夕陽前拍照：16:00-16:30 黃金光線，三峰染金",
          "若累了可從 Ost 搭 21 路公車 5 分鐘到 Höhematte（STP 免費）"
        ],
        critical:[]
      },
      {
        time:"16:30–17:00", title:"🚂 BOB 回 Grindelwald",
        tr:{ label:"BOB", icon:"train" }, stp:"free",
        steps:[
          "16:34 BOB Interlaken Ost → 17:00 抵 Grindelwald",
          "⚠️ 一樣要坐 Sector B「Grindelwald」段車廂",
          "抵達後步行/計程車到 Apartment Atlanta"
        ],
        defense:["推車裝著紀念品，5 件大行李已在機場等候，全團只有過夜包"],
        critical:[]
      },
      {
        time:"17:00–18:00", title:"妞妞補眠 ＋ 行李整理",
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
          "🚨 洗衣球用完後務必裝入硬殼保鮮盒再放託運！絕對不可放隨身登機包（會被安檢沒收）"
        ]
      },
      {
        time:"18:00–21:00", title:"🍴 Barry's 起司鍋慶功宴",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "18:00-18:30 換正式裝、洗熱水澡，推妞妞出發 Barry's",
          "18:30 抵達 Barry's Restaurant",
          "妞妞專屬：無酒版 Älplermagronen + 蘋果泥（服務生確認無酒精）",
          "大人：起司火鍋 Fondue Moitié-Moitié + Raclette",
          "配瑞士本地啤酒或瓦萊州 Fendant 白酒",
          "甜點：自製蘋果派或冰淇淋盤",
          "21:00 散席回 Atlanta，最後行李檢查後早睡"
        ],
        defense:[
          "🥇 10 天行程最後一頓正式晚餐",
          "整理過去 10 天記憶點：龍疆湖、皮拉圖斯山頂、勞特布魯嫩谷地、曼利申全景、施尼格普拉特、Bachalpsee、Brienz Rothorn 蒸汽火車、布里恩茨湖船",
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
            "16:34 BOB 回 Grindelwald 接 Barry's 慶功宴"
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
        time:"07:30–09:00", title:"格林德瓦慢早餐 ＋ 退房",
        tr:{ label:"步行", icon:"walk" }, stp:"none",
        steps:[
          "07:30 起床，用 Day 10 剩下食材慢慢吃早餐",
          "08:45 退房，清點 4 個過夜包 + 推車 + 隨身包 + 妞妞 + 護照",
          "09:00 推行李慢步至格林德瓦火車站（5-10 分鐘）"
        ],
        defense:[
          "🥇 EK 午班優勢：EK88 ZRH 15:25 起飛，今天不用一早衝刺",
          "但 09:18 BOB 不能錯過——與後續 IC 銜接最緊",
          "退房時帶垃圾出來丟，公寓清潔費可省一些"
        ],
        critical:[]
      },
      {
        time:"09:18–12:14", title:"長途撤退 → 蘇黎世機場",
        tr:{ label:"BOB → IC 城際列車", icon:"train" }, stp:"free",
        steps:[
          "09:18 BOB 從格林德瓦發車 → 09:52 抵 Interlaken Ost",
          "跟 Bern / Zürich Flughafen 指標換月台，搭 IC 8 城際列車",
          "約 10:30-11:00 抵 Bern 進行第二次轉乘",
          "🥇 Bern 同月台對向換車：走 5 步路到對面月台即可上對向 IC",
          "12:14 抵達 Zürich Flughafen"
        ],
        defense:[
          "🥇 SBB App 篩選鎖定「via Bern」班次",
          "只有過夜包 + 推車，兵分兩路壓力極低",
          "🦖 家庭車廂 FA：Bern → Zürich Flughafen 段的 IC 雙層列車通常編有 FA，二樓兒童遊戲區"
        ],
        critical:[
          "千萬避開「via Zürich HB」班次——全瑞士最大車站對推車家庭極不友善"
        ]
      },
      {
        time:"12:14–13:30", title:"🛅 領取 SBB 寄送 ＋ 退稅 ＋ Emirates Check-in",
        tr:{ label:"機場內步行", icon:"luggage" }, stp:"none",
        steps:[
          "🥇 第一動作 · SBB 領行李：直奔 SBB 行李櫃台（機場火車站 Level -2 或 -1，跟 Gepäck 指標）",
          "出示 Day 8 寄送收據 + 護照，領取 4 或 5 件大行李（主策略全寄 5 件；若採「留妞妞包」彈性則為 4 件，預估領取 15-30 分鐘）",
          "第二動作 · 退稅（若有）：Global Blue 退稅櫃檯（Level 2 出境大廳），必須在托運前蓋章",
          "第三動作 · Emirates Check-in：5 件大行李 + 推車（登機口交還）全部托運",
          "兵分兩路：Emily 帶妞妞+推車在 SBB 櫃台旁等；3 大人領行李後推去 Emirates 集合"
        ],
        defense:[
          "時間軸驗證：12:14 抵達 → 12:44 SBB 領完 → 13:00 走去 Emirates → 13:30 check-in 完成",
          "EK88 15:25 起飛，緩衝時間充足",
          "🥇 單一整合：5 件行李+推車從此不再兵分——都是 Emirates 托運"
        ],
        critical:[
          "🚨 SBB 領取單必須跟護照分開放，避免遺失同時發生",
          "出發前 1 個月至 sbb.ch/en/travel-information/baggage 確認當年度服務條款"
        ]
      },
      {
        time:"13:30–15:00", title:"過安檢 ＋ 候機 ＋ 妞妞放電",
        tr:{ label:"機場內步行", icon:"walk" }, stp:"none",
        steps:[
          "13:30 全團集合過安檢、護照查驗",
          "進入登機區，EK 通常在 D 大廳登機口",
          "14:00-15:00 在登機區用餐、休息",
          "機場過安檢後有 Family Lounge 與兒童遊樂區",
          "14:55 開始登機（EK88 起飛前 30 分鐘）"
        ],
        defense:[
          "EK 親子硬體業界頂尖：機上嬰兒搖籃、兒童餐、玩具包",
          "出發前確認嬰兒搖籃預約成功（線上 manage booking）"
        ],
        critical:[]
      },
      {
        time:"15:25 起飛", title:"✈️ EK88 起飛返台",
        tr:{ label:"Emirates EK88", icon:"plane" }, stp:"none",
        steps:[
          "EK88 15:25 ZRH → DXB（約 6h10m）",
          "9/25 (六) 凌晨 00:35 抵達杜拜",
          "杜拜轉機 EK366 約 09:30 起飛，當日 22:00 抵桃園"
        ],
        defense:[
          "9 天瑞士+EK 午班舒適起飛，整體節奏最理想",
          "登機後準備奶嘴、小毯子、平板（離線下載卡通）"
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
  { region:"瑞士中部", city:"琉森湖區", name:"瑞吉山 (Rigi Kulm)", stp:"100% 免費", family:"⭐⭐⭐⭐⭐ 極高：步道平緩推車天堂", note:"山巒皇后，360° 俯瞰琉森湖" },
  { region:"瑞士中部", city:"琉森近郊", name:"皮拉圖斯山 (Pilatus)", stp:"50% 折扣", family:"⭐⭐⭐ 中：山頂碎石路推車稍吃力", note:"世界最陡齒軌+金色環遊船齒軌纜車" },
  { region:"伯恩高地", city:"坎德谷（備案）", name:"藍湖 (Blausee)", stp:"公車免費／門票 CHF 11-13", family:"⭐⭐⭐⭐ 高：全程無階梯", note:"森林深處的湛藍寶石" },
  { region:"伯恩高地", city:"坎德谷（備案）", name:"歐新能湖 (Oeschinensee)", stp:"纜車 50% 折扣", family:"⭐⭐⭐⭐ 高：湖畔平緩", note:"翡翠秘境，垂直峭壁包圍" },
  { region:"伯恩高地", city:"少女峰山區", name:"施陶河瀑布 Staubbachfall", stp:"100% 免費", family:"⭐⭐⭐⭐⭐ 極高：谷底平坦", note:"《愛的迫降》取景地，300m 細白紗瀑布" },
  { region:"伯恩高地", city:"少女峰山區", name:"曼利申 (Männlichen)", stp:"50% 折扣", family:"⭐⭐⭐⭐ 高：碎石路建議背巾", note:"海拔 2,230m 三大名峰正對視角" },
  { region:"伯恩高地", city:"少女峰山區", name:"33 號全景步道 Panorama Trail", stp:"纜車 50% 折扣", family:"⭐⭐⭐ 中：背巾為主推車運輸", note:"瑞士最美平緩步道，面對艾格北壁 6km" },
  { region:"伯恩高地", city:"少女峰山區", name:"施尼格普拉特 Schynige Platte", stp:"50% 折扣", family:"⭐⭐⭐⭐ 高：植物園步道平緩", note:"1893 古董齒軌火車，私房秘境" },
  { region:"伯恩高地", city:"少女峰山區", name:"First 纜車 + Cliff Walk", stp:"50% 折扣", family:"⭐⭐⭐⭐ 高：Bort 遊樂場妞妞主場", note:"Bachalpsee 倒影湖，全行程最美照片" },
  { region:"伯恩高地", city:"少女峰山區", name:"格林德瓦冰河峽谷 Gletscherschlucht", stp:"CHF 19 自費", family:"⭐⭐⭐⭐ 高：木棧道嵌岩壁", note:"雨天備案首選（含天然遮蔽）" },
  { region:"伯恩高地", city:"少女峰山區", name:"Pfingstegg 森林溜滑梯", stp:"50% 折扣", family:"⚠️ 4 歲以下嚴禁滑道與 Fly-Line", note:"妞妞無滑道可玩，僅大人看景" },
  { region:"伯恩高地", city:"布里恩茨", name:"Brienz Rothorn 1892 蒸汽齒軌", stp:"50% 折扣 + 預約 CHF 8", family:"⭐⭐⭐⭐ 高：山頂步道平緩", note:"瑞士最古老蒸汽齒軌之一，2,244m 看 693 座山峰" },
  { region:"伯恩高地", city:"因特拉肯", name:"Höheweg 大道 + Höhematte 草坪", stp:"100% 免費", family:"⭐⭐⭐⭐⭐ 極高：平地大道", note:"三峰最後合照黃金地點" }
];

const RESTAURANTS = [
  { area:"琉森", name:"Rathaus Brauerei", plan:"Day 1 或 3 晚餐", spec:"百年地窖鮮釀黑啤", must:"脆皮烤豬腳、Luzerner Chügelipastete", price:"CHF 35-45", book:"提前 1-2 週" },
  { area:"琉森", name:"Restaurant Pfistern", plan:"Day 1 或 3 晚餐", spec:"卡貝爾橋第一排河畔景觀", must:"蘇黎世小牛肉附 Rösti", price:"CHF 45-60", book:"提前 1-2 週，備註二樓陽台" },
  { area:"皮拉圖斯", name:"Pilatus Kulm Restaurant", plan:"Day 4 主線午餐備案", spec:"海拔 2,073m 山頂景觀", must:"高山牛肉湯、Rösti", price:"CHF 30-45", book:"不需訂位" },
  { area:"小夏戴克", name:"Restaurant Grindelwaldblick", plan:"Day 7 午餐", spec:"正面迎擊少女峰雪山露台", must:"Goulash、炸豬排", price:"CHF 25-35", book:"現場排隊" },
  { area:"施尼格普拉特", name:"Hotel Restaurant Schynige Platte", plan:"Day 8 午餐", spec:"面三峰雙湖古蹟旅館", must:"Älplermagronen、蘋果派", price:"CHF 25-35", book:"人少不需訂位" },
  { area:"格林德瓦", name:"🥇 Barry's Restaurant", plan:"🚨 Day 10 慶功宴必訂", spec:"最後一頓外食", must:"起司火鍋 Moitié-Moitié、Raclette", price:"CHF 45-60", book:"🚨 出發前 1.5-2 個月訂 (2027/7 底前)" }
];

const RAIN_PLANS = [
  { base:"琉森", place:"瑞士交通博物館 (雨天首選)", pros:"全瑞士最受歡迎博物館，室內整天玩", ticket:"STP 50% (CHF 19)", note:"對 2 歲妞妞極友善" },
  { base:"琉森", place:"羅森加特美術館", pros:"畢卡索、克利、塞尚", ticket:"STP 100% 免費", note:"1-1.5 小時，適合大人" },
  { base:"琉森", place:"KKL 文化會議中心", pros:"諾曼·福斯特設計，湖畔現代建築", ticket:"大廳免費/美術館 CHF 15", note:"大廳寬敞可避雨" },
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

const BOOKINGS = [
  { when:"🚨 T-15 個月 (2026/6-7)", task:"訂 KoBi Hirschenplatz 琉森住宿", how:"booking.com 免費取消版立即下訂，9 月旺季稀缺", priority:"🔴 必做" },
  { when:"🚨 T-15 個月 (2026/6-7)", task:"開始研究格林德瓦住宿", how:"6 晚連住 9/18-9/24，鎖 2 間獨立房 + 自炊廚房", priority:"🟡 重要" },
  { when:"🟠 T-11~13 個月 (2026/8-10)", task:"ETIAS 動向追蹤（若 2027 正式上路才需申請）", how:"追蹤 travel-europe.europa.eu/etias_en 公告；瑞士非申根國、ETIAS 非必備", priority:"🟡 追蹤" },
  { when:"🔴 雙11/黑五 (2026/11)", task:"🥇 EK 機票搶優惠第一波", how:"目標 NT$ 33,000-38,000/人來回，5 件行李+推車+4 過夜包", priority:"🔴 必做" },
  { when:"🔴 雙11/黑五 (2026/11)", task:"🥇 STP 15 天版鎖 2026 價", how:"CHF 499 鎖 2027 起用日，避開 2027 漲價 +5%", priority:"🔴 必做" },
  { when:"🟠 早春 (2027/2-3)", task:"EK 嬰兒搖籃預約", how:"線上 manage booking，A380 機型前排隔板", priority:"🟡 重要" },
  { when:"🔵 T-3~4 個月 (2027/5-6)", task:"申根旅遊保險", how:"醫療 EUR 30,000+高山救援，妞妞另計", priority:"🔴 必做" },
  { when:"🔵 T-3 個月 (2027/6)", task:"皮拉圖斯齒軌線上預約", how:"pilatus.ch，CHF 5/人保證座位", priority:"🟡 重要" },
  { when:"🔵 T-3 個月 (2027/6-7)", task:"🥇 Brienz Rothorn 蒸汽火車預約", how:"brienz-rothorn-bahn.ch，選 11:30 上山，CHF 8/人預約費，妞妞免費", priority:"🔴 必做" },
  { when:"🟡 T-1.5~2 個月 (2027/7 底)", task:"🥇 Barry's Restaurant 訂位", how:"2027/9/23 (四) 18:30 4 大 1 小，備註 kein Alkohol", priority:"🔴 必做" },
  { when:"🟡 T-1 個月 (2027/8)", task:"zb 景觀線 Day 5 座位預約", how:"SBB App 4 相連座位，CHF 10-14/人", priority:"🔴 必做" },
  { when:"🟡 T-1 個月 (2027/8)", task:"採購裝備與耗材", how:"妞妞健行鞋、防曬乳、瑞士轉接頭、行動電源", priority:"🟡 重要" },
  { when:"🟡 T-2 週 (2027/8 底)", task:"兒童藥品備齊", how:"退燒、止瀉、止癢、體溫計、防蚊液", priority:"🔴 必做" },
  { when:"⚫ T-2 天 (2027/9/11)", task:"SBB 行李寄送分裝", how:"5 件大行李 Day 3 早上寄琉森車站至格林德瓦", priority:"🟡 重要" },
  { when:"🔴 旅程中 · Day 3 (9/16)", task:"🛅 SBB 行李寄送 Round 1", how:"07:00 琉森車站，5 件寄至 Grindelwald，CHF 60", priority:"🔴 必做" },
  { when:"🔴 旅程中 · Day 8 (9/21)", task:"🛅 SBB 行李寄送 Round 2", how:"07:45 Grindelwald 車站，5 件寄至 Zürich Flughafen，CHF 60", priority:"🔴 必做" }
];

const PACKING = [
  { cat:"📄 文件", items:[
    "護照（效期至少 2027/3 後 6 個月）",
    "ETIAS 授權證明（若 2027 前正式上路才需辦理）",
    "訂房憑證（KoBi + Apartment Atlanta）紙本+電子",
    "機票電子檔（EK87 去 + EK88 回）",
    "旅遊保險證明",
    "STP 通行證紙本",
    "緊急聯絡資訊（駐瑞士代表處 +41 31 382 21 36）",
    "信用卡 × 2（含 PIN）",
    "現金：瑞郎 CHF 300 + 台幣轉機備用",
    "妞妞護照 + 妞妞 ETIAS 證明（若 2027 前正式上路才需辦理）+ 出生證明備份"
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
  { cat:"🧴 洗衣球（關鍵警告）", items:[
    "🚨 絕對不可放隨身登機包（會被安檢沒收，液體+凝膠超標）",
    "🚨 必須裝入「硬殼保鮮盒」再放託運行李",
    "🚨 高空失壓會擠壓爆裂，將洗劑滲入毀損整箱衣物",
    "✅ 建議：方形樂扣保鮮盒，內墊塑膠袋雙層防漏",
    "洗衣袋 × 2、拖鞋、衛生紙、口罩備用"
  ], where:"🛅 硬殼保鮮盒放寄送行李" }
];
