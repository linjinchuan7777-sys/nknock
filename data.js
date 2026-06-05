// 雷娜塔的家 (Renata's Home) - 預設資料庫
// 儲存於此的資料會作為初始資料載入，並透過 localStorage 進行後續更新

const DEFAULT_BLOG_SETTINGS = {
  blogTitle: "雷娜塔的家",
  blogSubtitle: "RENATA'S HOME",
  adminKey: "admin123",       // 管理員解鎖金鑰
  friendKey: "friend123",     // 好友特權解鎖金鑰
  ownerName: "雷娜塔",
  ownerBio: "歡迎來到我的小角落。這裡記錄了我的日常生活、讀書筆記、影音收藏，還有我四處旅行的足跡。希望你也會喜歡這裡。"
};

const DEFAULT_POSTS = [
  {
    id: "post-1",
    title: "夏日向日葵花海隨筆",
    summary: "今天去了一趟中壢的向日葵花田，漫步在滿滿的金色花海中，心情豁然開朗。這篇文章記錄了陽光下的點滴感動。",
    content: `今天是個晴朗的週末，我決定出門走走，造訪了心心念念的向日葵花海。<br><br>
    一走進花田，映入眼簾的是一片無邊無際的耀眼金黃。每一朵向日葵都高昂著頭，迎著陽光燦爛地微笑著。看著它們，彷彿所有的煩惱與壓力在一瞬間都消散了。向日葵的花語是「沉默的愛」和「陽光」，它們總是執著地追隨太陽，這種溫暖而堅定的力量，也是我一直想在生活中保持的態度。<br><br>
    我拍了許多照片，也買了一小束帶回家放在書桌上。陽光灑進房間時，花朵反射出溫暖的光芒，讓整個空間都充滿了生機。生活中或許有許多陰霾，但只要我們像向日葵一樣，永遠朝向陽光，陰影就只能落在我們身後。`,
    category: "消息",
    subcategory: "情感",
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800",
    date: "2026-06-01 15:30",
    author: "雷娜塔",
    tags: ["生活隨筆", "向日葵", "夏日感悟"],
    isPrivate: false
  },
  {
    id: "post-2",
    title: "【限好友】深夜樹洞：關於未來的選擇與迷茫",
    summary: "只有最親近的朋友才能看。最近站在人生的十字路口，有些心裡話想在這裡默默訴說，關於三十歲的抉擇...",
    content: `這是一篇寫給懂我的人看的私密日記。<br><br>
    最近深夜，我常常獨自坐在書桌前發呆。工作上遇到了瓶頸，生活上也開始面臨許多轉變。身邊的人總覺得我一切順利、方向明確，但其實我內心深處充滿了不確定與迷茫。三十歲這個關卡，好像突然被賦予了許多無形的期待。<br><br>
    我究竟是要繼續留在舒適圈，還是勇敢地踏出去嘗試全新的領域？每一次做決定，都像是拿著自己所剩不多的青春在冒險。這段時間謝謝你一直在我身邊聽我碎碎念，不論我的決定是什麼，我知道你都會支持我的對吧？謝謝你，我最親愛的好友。`,
    category: "消息",
    subcategory: "夢境",
    image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800",
    date: "2026-06-04 23:45",
    author: "雷娜塔",
    tags: ["內心小對話", "深夜碎碎念", "悄悄話"],
    isPrivate: true  // 限好友瀏覽
  },
  {
    id: "post-3",
    title: "我的法式白色浪漫洋裝穿搭分享",
    summary: "這件在小店淘到的復古法式白色洋裝簡直是我的真愛！剪裁優雅，蕾絲精緻，這篇文章分享我的搭配小技巧與穿戴飾品。",
    content: `前陣子在赤峰街的古著店裡，一眼就看中了這件帶有溫柔法式風情的白色洋裝。<br><br>
    它的材質是輕薄的亞麻混紡，點綴著精緻卻不張揚的蕾絲滾邊。最棒的是它的微高腰剪裁，能夠很好地修飾身形比例。在日常穿搭中，我喜歡搭配一雙復古的瑪莉珍鞋，並戴上簡單的黃銅耳環。如果是出遊，戴頂寬邊草帽和編織包，立刻就有了南法度假的氛圍！<br><br>
    衣服不只是遮蔽，更是我們展現自我、表達當下心情的方式。這件洋裝帶給我的，是輕盈、自由且自信的感受。我已經把它收進了衣櫃最顯眼的位置，準備穿著它度過這整個美麗的夏天。`,
    category: "衣櫃",
    subcategory: "衣服",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
    date: "2026-05-28 10:15",
    author: "雷娜塔",
    tags: ["穿搭日記", "法式復古", "夏日穿搭"],
    isPrivate: false
  },
  {
    id: "post-4",
    title: "那些讓我心動的復古手工皮鞋",
    summary: "鞋櫃裡的新成員！來自台灣原創設計師的手工植鞣革皮鞋，穿著它走的每一步都非常踏實，皮革隨著時間留下的痕跡最美了。",
    content: `我一直相信，一雙好鞋能帶你走向美好的地方。<br><br>
    這雙深咖啡色的植鞣革手工皮鞋，是我送給自己今年的生日禮物。剛穿上的時候皮革偏硬，甚至有點磨腳，但隨著穿著次數增加，它漸漸適應了我的腳型，顏色也因為汗水與日照，轉化成獨一無二的焦糖色澤。<br><br>
    我很喜歡手工製品的溫度，那種一針一線留下來的樸實感，是機器快速量產所無法取代的。搭配襪子露出腳踝，無論是配牛仔褲還是長裙都非常合適。穿上它，感覺步伐都變得沉穩踏實了起來。`,
    category: "衣櫃",
    subcategory: "鞋子",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
    date: "2026-05-15 14:20",
    author: "雷娜塔",
    tags: ["鞋履收藏", "手工皮鞋", "皮革養成"],
    isPrivate: false
  },
  {
    id: "post-5",
    title: "自製經典義式提拉米蘇：完美比例分享",
    summary: "書桌與廚房的完美結合！教你如何在家用最簡單的材料，調配出帶有濃郁咖啡與萊姆酒香的完美提拉米蘇，綿密香醇！",
    content: `提拉米蘇（Tiramisu）在義大利文裡的意思是「帶我走」。今天就在廚房與書桌間，做一份帶有滿滿愛意的甜點吧！<br><br>
    <b>【準備材料】</b><br>
    - 馬斯卡彭起司 (Mascarpone) 250g<br>
    - 鮮奶油 150ml<br>
    - 蛋黃 2個<br>
    - 砂糖 40g<br>
    - 濃縮咖啡 1杯<br>
    - 咖啡酒/萊姆酒 2大匙<br>
    - 手指餅乾 一包<br>
    - 無糖可可粉 適量<br><br>
    <b>【製作步驟】</b><br>
    1. 將蛋黃與砂糖隔水加熱打發至泛白。<br>
    2. 將馬斯卡彭起司攪打至滑順，與蛋黃糊混合均勻。<br>
    3. 鮮奶油打發至六分發，輕輕拌入起司糊中，製成馬斯卡彭內餡。<br>
    4. 濃縮咖啡與萊姆酒混合。手指餅乾快速浸泡一下咖啡液，鋪在容器底部。<br>
    5. 鋪上一層內餡，再鋪一層浸泡過的手指餅乾，最後鋪上剩餘的內餡抹平。<br>
    6. 放入冰箱冷藏至少4小時，食用前撒上滿滿的無糖可可粉即可！<br><br>
    這款提拉米蘇入口即化，咖啡的苦甜與酒香交織，非常適合當作下午茶的完美句點。`,
    category: "書桌",
    subcategory: "飲食",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800",
    date: "2026-05-20 16:40",
    author: "雷娜塔",
    tags: ["手作烘焙", "提拉米蘇", "下午茶"],
    isPrivate: false
  }
];

const DEFAULT_BOOKS = [
  {
    id: "book-1",
    title: "向陽而生",
    author: "雷娜塔",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
    description: "這是一本關於生活感悟與日常攝影的隨筆集。記錄了四季交替中的美好瞬間，引導我們在疲憊的生活中尋找那一抹溫暖的陽光。"
  },
  {
    id: "book-2",
    title: "追尋時間的旅人",
    author: "阿爾貝·加繆",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
    description: "探討存在與時間關係的哲學經典。作者以獨特的視角剖析現代人在時間洪流中的迷茫與追求，是床頭必備的啟發之作。"
  },
  {
    id: "book-3",
    title: "微風拂過書頁的聲音",
    author: "村上春樹",
    cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800",
    description: "收錄了村上對閱讀、爵士樂與長跑的熱愛。文字輕快而富有韻律，展現了作家私底下最真實、最愜意的一面。"
  }
];

const DEFAULT_TODOS = [
  { id: "todo-1", text: "更新個人部落格首頁設計", completed: true },
  { id: "todo-2", text: "整理衣櫃，將夏裝拿出來通風", completed: false },
  { id: "todo-3", text: "閱讀《追尋時間的旅人》第三章並做筆記", completed: false },
  { id: "todo-4", text: "練習提拉米蘇減糖配方", completed: true },
  { id: "todo-5", text: "規劃下週末去阿里山的登山行程", completed: false }
];

const DEFAULT_NOTES = `親愛的雷娜塔：

這是一張可以隨手記錄靈感的筆記紙。

【待辦靈感】
- 想想下一次旅行的目的地：蘭嶼？或是台東太麻里看金針花？
- 記得跟阿明借那張披頭四的黑膠唱片。
- 電影《星際效應》的配樂實在太棒了，下次寫一篇影評放進 DVD 架。

【生活小句】
「陰雨天也是生命的一部分，等雨停了，泥土的香氣會更芬芳。」
加油，今天也是美好的一天！`;

const DEFAULT_MEDIA = [
  {
    id: "media-1",
    title: "星際效應 (Interstellar)",
    type: "movie",
    cover: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    year: "2014",
    description: "克里斯多福·諾蘭執導的經典科幻電影。講述一隊探險家利用對蟲洞的突破性科學發現，超越人類太空旅行的極限，展開一場壯麗的星際航行。"
  },
  {
    id: "media-2",
    title: "塞爾達傳說：曠野之息",
    type: "game",
    cover: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800",
    year: "2017",
    description: "任天堂開發的開放世界動作冒險遊戲。在廣袤的海拉魯大陸上自由探索，解開謎題，挑戰強敵。它的藝術風格與自由度堪稱遊戲史上的神作。"
  },
  {
    id: "media-3",
    title: "Gorillaz - Plastic Beach",
    type: "music",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800",
    year: "2010",
    description: "虛擬樂團 Gorillaz 的第三張錄音室專輯。曲風融合了電子、嘻哈與獨立搖滾，主題環繞著環保與現代垃圾問題，概念完整且極具前衛感。"
  },
  {
    id: "media-4",
    title: "Metallica - And Justice For All",
    type: "music",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    year: "1988",
    description: "重金屬天團 Metallica 的第四張錄音室專輯。編曲複雜度極高，歌詞充滿了社會批判與正義反思，是鞭擊金屬音樂歷史上的重要里程碑。"
  }
];

const DEFAULT_SPOTS = [
  {
    id: "spot-1",
    name: "中壢向日葵花田",
    desc: "滿滿的向日葵金色花海，夏日拍照打卡的絕佳去處！",
    lat: 25.0118,
    lng: 121.2185
  },
  {
    id: "spot-2",
    name: "阿里山國家森林遊樂區",
    desc: "看日出、神木與雲海的聖地，放慢步調呼吸芬多精的好地方。",
    lat: 23.5111,
    lng: 120.8031
  },
  {
    id: "spot-3",
    name: "赤峰街古著店聚落",
    desc: "台北中山站旁的文青巷弄，隱藏了許多復古服飾店與特色咖啡館。",
    lat: 25.0543,
    lng: 121.5202
  }
];

const DEFAULT_EVENTS = [
  {
    id: "event-1",
    date: "2026-06-01",
    title: "去向日葵花海拍照",
    desc: "早上出發去中壢向日葵花田，記得帶相機跟防曬。"
  },
  {
    id: "event-2",
    date: "2026-06-15",
    title: "阿里山登山健行",
    desc: "兩天一夜的阿里山之旅，清晨看日出，預計走眠月線步道。"
  },
  {
    id: "event-3",
    date: "2026-06-25",
    title: "阿明黑膠音樂聚會",
    desc: "帶上自己收藏的 CD 去阿明家聚聚，順便借披頭四黑膠唱片。"
  }
];

const DEFAULT_WARDROBE_ITEMS = [
  {
    id: "item-1",
    title: "法式白色浪漫洋裝",
    type: "clothes",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
    desc: "細緻蕾絲古著，夏日拍照必備。"
  },
  {
    id: "item-2",
    title: "文青亞麻寬褲",
    type: "clothes",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
    desc: "透氣舒適，淡淡的燕麥色。"
  },
  {
    id: "item-3",
    title: "復古焦糖色手工皮鞋",
    type: "shoes",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
    desc: "植鞣皮手工縫製，經典耐穿。"
  },
  {
    id: "item-4",
    title: "簡約白色帆布鞋",
    type: "shoes",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800",
    desc: "日常百搭，走再多路都不累。"
  },
  {
    id: "item-5",
    title: "黃銅向日葵耳環",
    type: "accessories",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
    desc: "手工敲打的黃銅質感，與洋裝很配。"
  },
  {
    id: "item-6",
    title: "手織編織草帽",
    type: "accessories",
    image: "https://images.unsplash.com/photo-1572426313455-1345983d4844?w=800",
    desc: "寬邊遮陽草帽，夏日度假風。"
  }
];

const DEFAULT_OWNER_PROFILE = {
  accountId: "renata123",
  name: "雷娜塔",
  nickname: "娜塔",
  bloodType: "A",
  birthday: "1996-06-01",
  horoscope: "雙子座",
  gender: "女",
  city: "台北市",
  orientation: "不限",
  email: "renata@home.com",
  phone: "02-2555-1234",
  mobile: "0912-345-678",
  facebook: "renata.home",
  line: "renata_nana",
  fillDate: "2026-06-05",
  aboutMe: {
    passion: 85,
    humor: 70,
    procrastination: 60,
    fitness: 50,
    foodie: 90
  },
  favorites: {
    country: "日本京都 / 瑞士阿爾卑斯",
    color: "向日葵黃 & 晴空藍",
    music: "溫慢療癒民謠 / 爵士樂",
    movie: "《星際效應》《神隱少女》",
    food: "經典義式提拉米蘇 / 冰美式",
    trait: "真誠、有同理心、幽默感"
  },
  top3: {
    title: "救贖我的三樣東西",
    top1: "早晨的第一杯手沖咖啡",
    top2: "窩在沙發裡讀一本好書",
    top3: "漫無目的地在森林裡散步"
  },
  social: {
    role: "熱唱王, 潛水大師",
    talent: "能在一秒內入睡、記得所有冷知識",
    welcome: "跟我聊聊心事，或單純路過不說話都行",
    status: "正在打理我的小家，冬眠中"
  }
};

const DEFAULT_FRIENDS = [
  {
    id: "friend-1",
    accountId: "aming556",
    name: "阿明",
    nickname: "音樂瘋子",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    bloodType: "O",
    birthday: "1995-10-12",
    horoscope: "天秤座",
    gender: "男",
    city: "台中市",
    orientation: "異性戀",
    email: "aming@vinyl.com",
    phone: "04-2345-6789",
    mobile: "0988-765-432",
    facebook: "aming.music",
    line: "aming_vinyl",
    fillDate: "2026-06-05",
    aboutMe: {
      passion: 95,
      humor: 85,
      procrastination: 80,
      fitness: 70,
      foodie: 75
    },
    favorites: {
      country: "英國倫敦 (披頭四朝聖地)",
      color: "黑膠經典黑",
      music: "The Beatles / 搖滾樂",
      movie: "《海上鋼琴師》《波希米亞狂想曲》",
      food: "雙倍起司披薩 / 冰精釀啤酒",
      trait: "熱情、瘋狂、對藝術有執著"
    },
    top3: {
      title: "不能沒有的黑膠唱片",
      top1: "Abbey Road - The Beatles",
      top2: "The Dark Side of the Moon - Pink Floyd",
      top3: "Kind of Blue - Miles Davis"
    },
    social: {
      role: "熱唱王",
      talent: "聽前奏三秒猜歌名、單手開瓶蓋",
      welcome: "來帶一張你喜歡的 CD 走，留下一首歌",
      status: "正在整理我亂七八糟的黑膠唱片中"
    },
    posts: [
      {
        id: "friend-post-1",
        title: "我的第一張披頭四黑膠唱片收藏",
        summary: "今天在二手市集淘到了這張 1969 年發行的《Abbey Road》黑膠，當指針落下，那種溫暖的模擬音質簡置讓人落淚。",
        content: "這是我收藏生涯中最重要的一天。身為搖滾樂迷，《Abbey Road》是不可逾越的聖經。今天在台中的老黑膠市集，翻找了三個小時，終於在一個不起眼的角落找到了這張保存完好的初版唱片。<br><br>針尖落下的那一刻，音響裡傳來微弱的沙沙聲，隨後《Come Together》那标志性的貝斯線響起。那種飽滿、溫暖且充滿顆粒感的模擬音質，是任何數位串流媒體都無法複製的。這張唱片的封面也是經典，四個人走過斑馬線的畫面，成了音樂史上最著名的符號。這是我書架上最珍貴的收藏，隨時歡迎大家來我家一起聽音樂！",
        category: "消息",
        subcategory: "話題",
        image: "https://images.unsplash.com/photo-1539628390771-e346745efac4?w=800",
        date: "2026-06-05 10:00",
        author: "阿明",
        tags: ["黑膠唱片", "披頭四", "經典搖滾"],
        isPrivate: false
      },
      {
        id: "friend-post-2",
        title: "【限好友】關於音樂與孤獨的深夜碎碎念",
        summary: "只有最懂我的好友能看。深夜聽著 Miles Davis 的爵士樂，突然有些關於創作與孤獨的感觸...",
        content: "深夜一點半，房間裡只剩喇叭發出的幽暗小號聲。<br><br>有時候我常想，我們做音樂、收藏音樂，到底是在尋找共鳴，還是在享受孤獨？每當我戴上耳機，整個世界都安靜了，只剩下旋律在腦海中勾勒出一個安全的避難所。很多時候，言語無法傳達的情感，音符卻能在一瞬間擊中內心。謝謝你在我最低潮的時候，願意陪我默默坐在這聽完一整張唱片。這篇文章只寫給我最親近的朋友，感謝你們的陪伴。",
        category: "消息",
        subcategory: "情感",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
        date: "2026-06-04 01:20",
        author: "阿明",
        tags: ["深夜隨筆", "孤獨感悟", "爵士樂"],
        isPrivate: true
      }
    ],
    books: [
      {
        id: "friend-book-1",
        title: "搖滾樂史話",
        author: "阿明",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
        description: "阿明自己整理的搖滾樂發展史筆記，記錄了從藍調、鄉村樂到現代搖滾的每一次音樂革命與傳奇樂團故事。"
      }
    ],
    media: [
      {
        id: "friend-media-1",
        title: "The Beatles - Abbey Road",
        type: "music",
        cover: "https://images.unsplash.com/photo-1539628390771-e346745efac4?w=800",
        year: "1969",
        description: "搖滾史上最偉大的專輯之一。包含《Come Together》、《Something》、《Here Comes the Sun》等傳世名曲。"
      },
      {
        id: "friend-media-2",
        title: "波希米亞狂想曲 (Bohemian Rhapsody)",
        type: "movie",
        cover: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
        year: "2018",
        description: "傳奇搖滾樂團 Queen (皇后合唱團) 的傳記電影，重現了主唱 Freddie Mercury 的傳奇一生與 1985 年 Live Aid 的震撼演出。"
      }
    ],
    wardrobeItems: [
      {
        id: "friend-w-1",
        title: "經典黑色搖滾皮衣",
        type: "clothes",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
        desc: "穿了很多年的植鞣羊皮機車外套，搖滾樂迷標配。"
      },
      {
        id: "friend-w-2",
        title: "復古高筒馬汀鞋",
        type: "shoes",
        image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800",
        desc: "經典八孔黑色馬汀，踩在舞台上最帥氣。"
      }
    ]
  }
];

const GLOBAL_USER_POOL = [
  DEFAULT_FRIENDS[0],
  {
    id: "friend-2",
    accountId: "xiaohua123",
    name: "小華",
    nickname: "貓咪保育員",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    bloodType: "B",
    birthday: "1997-03-24",
    horoscope: "牡羊座",
    gender: "女",
    city: "新北市",
    email: "xiaohua@cat.com",
    mobile: "0911-222-333",
    line: "xiaohua_cat",
    fillDate: "2026-06-05",
    aboutMe: { passion: 90, humor: 65, procrastination: 40, fitness: 60, foodie: 85 },
    favorites: { country: "日本北海道", color: "櫻花粉", music: "獨立民謠", movie: "《貓的報恩》", food: "草莓大福", trait: "溫柔、細心、愛貓" },
    top3: { title: "最愛的貓咪", top1: "布偶貓", top2: "美短貓", top3: "橘貓" },
    social: { role: "保育員", talent: "懂貓咪叫聲", welcome: "進來請輕聲細語", status: "正在幫貓咪準備罐罐" },
    posts: [
      {
        id: "friend-post-3",
        title: "今天收容所來了一隻超親人的三花貓",
        summary: "一看到人就瘋狂蹭蹭和呼嚕呼嚕，實在太融化了！今天記錄牠的故事。",
        content: "今天在收容所值班，遇到了一隻剛被救援送來的三花貓。<br><br>一看到我走近，不但沒有躲，反而主動走到籠子邊用頭蹭我的手，嘴裡還發出很大聲的『咕嚕咕嚕』聲。我把牠抱起來，牠就整隻貓軟綿綿地趴在我肩膀上，簡直是天使！<br><br>我們叫牠糰子，希望有人能快點帶牠回家，給牠一個溫暖的避難所。牠一定會是一個超級貼心的家人。",
        category: "消息",
        subcategory: "話題",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
        date: "2026-06-05 14:00",
        author: "小華",
        tags: ["貓咪", "領養代替購買"],
        isPrivate: false
      }
    ],
    books: [
      {
        id: "friend-book-2",
        title: "貓咪的心靈密碼",
        author: "小華",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150",
        description: "小華多年與貓咪相處的筆記，包含如何讓害羞貓快速親人的秘訣。"
      }
    ],
    media: [
      {
        id: "friend-media-3",
        title: "貓的報恩",
        type: "movie",
        cover: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150",
        year: "2002",
        description: "吉卜力工作室出品的經典動畫。描述女主角小春救了一隻貓國王子後，意外展開了一場不可思議的貓國奇幻冒險。"
      }
    ],
    wardrobeItems: [
      {
        id: "friend-w-3",
        title: "粉色針織外套",
        brand: "UNIQLO",
        type: "clothes",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150",
        desc: "溫柔粉紅毛衣，摸起來像貓咪一樣軟綿綿。"
      }
    ]
  },
  {
    id: "friend-3",
    accountId: "datong456",
    name: "大同",
    nickname: "山系野人",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    bloodType: "AB",
    birthday: "1994-08-05",
    horoscope: "獅子座",
    gender: "男",
    city: "花蓮縣",
    email: "datong@mountain.com",
    mobile: "0922-444-555",
    line: "datong_mount",
    fillDate: "2026-06-05",
    aboutMe: { passion: 90, humor: 75, procrastination: 50, fitness: 95, foodie: 80 },
    favorites: { country: "尼泊爾", color: "大地墨綠", music: "大自然白噪音", movie: "《阿拉斯加之死》", food: "窯烤麵包", trait: "堅毅、熱愛自然" },
    top3: { title: "最美的百岳", top1: "雪山主峰", top2: "奇萊南華", top3: "大霸尖山" },
    social: { role: "山友", talent: "野外定向", welcome: "帶上你的睡袋，我們營火旁見", status: "正攀爬在合歡北峰的稜線上" },
    posts: [
      {
        id: "friend-post-4",
        title: "奇萊南華黃金草原露營記",
        summary: "在奇萊南華看著日出金光灑在無垠的箭竹草原上，那一刻的震撼將一輩子難忘。",
        content: "這是我今年最深刻的攀登回憶。<br><br>我們在天色微亮時頂著寒風出發，當登上稜線的那一刻，第一縷陽光穿透雲海，將整片奇萊南華的箭竹草原染成一片耀眼奪目的黃金海洋。這就是大自然無與倫比的魔力，也是為什麼我總是願意背著二十公斤 of 重裝，一次次走向大山的原因。<br><br>下山後在天池山莊喝一碗熱呼呼的湯，整個人都被救贖了。希望下次能跟你們一起在山頂迎接日出！",
        category: "消息",
        subcategory: "景點",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
        date: "2026-06-03 08:30",
        author: "大同",
        tags: ["百岳攀登", "高山露營"],
        isPrivate: false
      }
    ],
    books: [
      {
        id: "friend-book-3",
        title: "戶外求生手冊",
        author: "大同",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150",
        description: "包含繩結法、野外急救與失溫處理的實用技術手冊。"
      }
    ],
    media: [
      {
        id: "friend-media-4",
        title: "阿拉斯加之死",
        type: "movie",
        cover: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150",
        year: "2007",
        description: "真實故事改編。講述一個年輕人拋棄所有財產與社會關係，獨自走入阿拉斯加荒野，追尋生命與自由真諦的傳奇故事。"
      }
    ],
    wardrobeItems: [
      {
        id: "friend-w-4",
        title: "專業防風防水衝鋒衣",
        brand: "The North Face",
        type: "clothes",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=150",
        desc: "防風防水衝鋒外套，深綠色保護色。"
      }
    ]
  }
];

// 如果是在瀏覽器環境中載入，則導出為全局變量以供 app.js 使用
if (typeof window !== 'undefined') {
  window.DEFAULT_BLOG_SETTINGS = DEFAULT_BLOG_SETTINGS;
  window.DEFAULT_POSTS = DEFAULT_POSTS;
  window.DEFAULT_BOOKS = DEFAULT_BOOKS;
  window.DEFAULT_TODOS = DEFAULT_TODOS;
  window.DEFAULT_NOTES = DEFAULT_NOTES;
  window.DEFAULT_MEDIA = DEFAULT_MEDIA;
  window.DEFAULT_SPOTS = DEFAULT_SPOTS;
  window.DEFAULT_EVENTS = DEFAULT_EVENTS;
  window.DEFAULT_WARDROBE_ITEMS = DEFAULT_WARDROBE_ITEMS;
  window.DEFAULT_OWNER_PROFILE = DEFAULT_OWNER_PROFILE;
  window.DEFAULT_FRIENDS = DEFAULT_FRIENDS;
  window.GLOBAL_USER_POOL = GLOBAL_USER_POOL;
}
