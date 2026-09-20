/* 2本のExcelをマージして data/cases.json を作る。
     node tools/make-cases.mjs <200件TSV> <90件TSV> <旧cases.json>

   もとの2本
     TEAM2030_プロジェクト事例200ｖ２.xlsx  … 200件・26分野。分野の幅が広い
     TEAM2030_プロジェクト90_大義つき.xlsx   … 90件・12分野。行政の入口と着地点がある
   分野は200件側の26分野に寄せる。90件側の「行政の入口」「着地点」は
   そのまま持ってくる（あちらにしかない情報なので捨てない）。

   手を入れている判断は全部この下の表にある。気に入らなければ表を直して流し直す。
     LIGHTEN / RETITLE … 重いテーマを前向きに言い換える
     DROP              … 言い換えでは収まらないものを落とす
     G90 / G90_ITEM    … 90件側の12分野を、26分野のどれに寄せるか
     REAL_GENRE        … 実在事例33件を、26分野のどれに当てるか
*/

import { readFileSync, writeFileSync } from "node:fs";

const [p200, p90, pOld, pRef] = process.argv.slice(2);

/* ── 26分野。並び順がそのまま画面の並び ──────────────
   幅があることが最初の画面で伝わるように、似た分野を固めず散らしてある。
   政治・経済とAI・デジタルは、スクロールしないうちに目に入る位置に置く。
   lead は設問画面に出す「やってみたいこと」の見出し。
   分野名をそのまま聞くと（例：政治に興味は？）答えにくいので、
   行為の形に直したものを主役にして、分野名は添えるだけにする。 ── */
const GENRES = [
  ["子ども・教育",        "子どもに、学校の外の機会をつくる"],
  ["政治・経済",          "地域のお金と決まりごとを、調べて広める"],
  ["川・水辺・海",        "川と海の生きものを、戻す"],
  ["AI・デジタル",        "AIを使って、手作業をラクにする"],
  ["食・農",              "食べものが作られる場所に、関わる"],
  ["お金・小商い",        "小さく売ってみて、稼ぎをつくる"],
  ["歴史・文化",          "土地の歴史と行事を、もう一度動かす"],
  ["IT・システムづくり",  "回らなくなった仕組みを、回るようにする"],
  ["まち・空き家",        "使われていない建物を、使えるようにする"],
  ["動物",                "動物と人が、一緒に暮らせるようにする"],
  ["自然・環境",          "手つかずになった自然に、手を入れる"],
  ["ものづくり・アート",  "手を動かして、ものを作る"],
  ["高齢者・ケア",        "年を重ねた人が、出かけられるようにする"],
  ["地域ブランド・知財",  "地域の名前と品質を、守って売る"],
  ["発信・記録",          "消えてしまう前に、記録して伝える"],
  ["防災・安全",          "いざというときに動ける状態をつくる"],
  ["学校・若者との協働",  "学校や若い人と、一緒に何かやる"],
  ["資源循環",            "捨てているものを、もう一度使う"],
  ["旅・場づくり",        "人が来たくなる場所をつくる"],
  ["心理・人間関係",      "人の話を聞いて、関係をつなぎ直す"],
  ["農山漁村",            "集落が続いていく形を、つくる"],
  ["脱炭素・エネルギー",  "エネルギーの使い方を、地域で変える"],
  ["道・橋・インフラ",    "毎日通る道まわりを、よくする"],
  ["からだ・健康",        "体を動かす場を、地域につくる"],
  ["観光・関係人口",      "外から来る人との関わりを増やす"],
  ["福祉・多様性",        "事情があっても、輪の中にいられるようにする"]
];
/* ── 大きな6つ。1問目はここから選ぶ。
   いきなり26個から選ばせると粒度がバラバラで選べないので、
   大きく → 分野 → プロジェクト の3段階にする。 ── */
const GROUPS = [
  ["自然と生きもの",   "川・海、山や畑、動物",
   ["川・水辺・海","自然・環境","動物","農山漁村","食・農"]],
  ["人と暮らし",       "子ども、お年寄り、健康、人のつながり",
   ["子ども・教育","学校・若者との協働","高齢者・ケア","福祉・多様性","心理・人間関係","からだ・健康"]],
  ["まちと場所",       "空き家、道、人が集まる場所",
   ["まち・空き家","道・橋・インフラ","旅・場づくり","観光・関係人口"]],
  ["しごととお金",     "小商い、ブランド、地域のお金の流れ",
   ["お金・小商い","地域ブランド・知財","政治・経済"]],
  ["技術と仕組み",     "IT、AI、エネルギー、防災",
   ["IT・システムづくり","AI・デジタル","資源循環","脱炭素・エネルギー","防災・安全"]],
  ["文化とものづくり", "歴史、記録、手を動かすこと",
   ["歴史・文化","発信・記録","ものづくり・アート"]]
];

const GENRE_ORDER = GENRES.map(g => g[0]);
const GENRE_SET = new Set(GENRE_ORDER);

/* ── 重いテーマの言い換え ───────────────────────────
   植田さん「TEAM2030は前向きで明るい未来のためにあるから、負の側面すぎるのはずれてる」
   やることは変えず、言い方だけ変える。元の文は causeSrc / titleSrc に残す。 ── */
const LIGHTEN = {           // 90件側の No
  2:  "ひとり暮らしの人と、週に一度はつながっている状態をつくる",
  3:  "介護しながらでも、仕事と暮らしを続けられるようにする",
  4:  "子育てを、家の中だけで抱え込まなくていい場をつくる",
  6:  "ひとり親の家の子が、ごはんと勉強に困らないようにする",
  7:  "冬の家をあたたかくして、元気に動ける年数を延ばす",
  8:  "免許を返しても、行きたいところに行ける足をつくる",
  27: "家族の世話をしている子に、子どもの時間を返す",
  30: "子どもが水辺で遊べる場所を取り戻す",
  38: "とれた鳥獣を、おいしく食べきる形にする",
  69: "いざというとき、迷わず動ける状態をつくる",
  70: "災害のとき、誰が無事かすぐ分かるようにする",
  73: "ペットと一緒に逃げられるようにする",
  82: "反応が減った仲間に、早めに声をかけられるようにする"
};
const RETITLE = {
  2:  "ひとり暮らしの人とつながる網をつくる",
  3:  "介護しながらでも働き続けられるようにする",
  4:  "産後のおうちを、ひとりにしない",
  7:  "冬の家をあたたかくする",
  27: "家族の世話をしている子に気づく",
  69: "避難のしかたを、体で覚える",
  73: "ペットと一緒に逃げられるようにする",
  82: "反応が減った仲間に気づく"
};
const DROP = {
  1: "自殺対策そのもの。前向きに言い換えると内容を偽ることになる。" +
     "ゲートキーパー養成が前提で、入会2週目に一人で始める形にもならない。"
};
/* 200件側は1件だけ言い換え */
const LIGHTEN200 = {
  161: { find: "ヒートショックは冬の死亡に直結する。", to: "冬のお風呂まわりは、家の中でいちばん寒い。" }
};

/* ── 読みにくいものを書き直す（id → 直す項目）─────────
   むずかしい言葉（属人化、TNR、ノーコード…）と、
   「どこに行って誰に何と言うのか」が分からない一歩目を書き直す。
   2026-09-21 植田さんの指摘「一番混乱している紙を1枚もらってくる→
   マジでどういうことだよ、どこに行って誰と話して、みたいなのもない」 ── */
const REWRITE = {
  A101:{ title:"町内会やPTAの表を、みんなで直せる形にする",
    summary:"紙とExcelの二重管理をやめて、全員が同じ1つの表を見て直せるようにする。いちばん感謝されやすい入口。",
    step:"自治会かPTAの役員さんに「いま一番ややこしい表はどれですか」と聞いて、その紙を1枚もらう" },
  A065:{ title:"紙や口頭でやっている管理を、1つだけ表にする",
    summary:"名簿・当番表・在庫のどれか1つ。共有できた瞬間に「その人しか分からない」が1つ消える。",
    step:"名簿・当番表・在庫のうち、いま一番ややこしいものを1つ選んで、スマホで写真を撮る" },
  A109:{ title:"1人しか触れないExcelを、みんなが見られる形にする",
    summary:"1人しか分からないファイルが壊れたら終わる団体は多い。実は緊急性が高い。",
    step:"所属している団体で「これは◯◯さんしか触れない」というファイルを1つ見つける" },
  B075:{ title:"1人がやめたら回らなくなる状態をなくす",
    step:"所属している団体の役員さんに「いま一番ややこしい表はどれですか」と聞いて、その紙を1枚もらう" },
  A106:{ title:"手伝うイベントの受付を、QRコードで一瞬にする",
    summary:"紙の名簿と照合する受付の行列が消える。自分が主催でなくても、受付だけ引き受ければできる。",
    step:"次に手伝う予定のイベントの主催者に「受付をやらせてください」と伝える" },
  A095:{ title:"野良猫を1匹、手術して元の場所に戻す",
    summary:"つかまえて、不妊手術をして、元いた場所に戻す（TNRと呼ばれるやり方）。費用を助成してくれる自治体が多い。",
    step:"市役所の環境課か生活衛生課に電話して、猫の不妊手術の助成があるか聞く" },
  A086:{ title:"非常食を食べて買い足す会を開く",
    summary:"非常食を普段のごはんとして食べ、食べたぶんを買い足す（ローリングストック）。参加者が家に帰ってすぐ実行できる。",
    step:"自宅の非常食が何日分あるか数える" },
  A049:{ summary:"国や自治体が「この案をどう思いますか」と意見を集める仕組みに、実名で1本出す。30分でできる。",
    step:"e-Gov（国の意見募集サイト）を開いて、気になる募集を1件選ぶ" },
  A061:{ title:"ゴミの日やイベントを自動で答えるLINEを作る",
    summary:"ゴミ収集日・イベント・災害情報を、聞かれたら自動で返す仕組みにする。",
    step:"市のホームページで「オープンデータ」（市が自由に使ってよいと公開しているデータ）のページを探す" },
  A112:{ title:"市が公開しているデータで、地図アプリを1本作る",
    summary:"自治体が誰でも使える形で公開しているデータは大量に眠っていて、使う人がほとんどいない。",
    step:"市のホームページの「オープンデータ」ページから、表データを1本ダウンロードする" },
  B081:{ title:"市が公開しているのに誰も使っていないデータを使う",
    step:"市のホームページの「オープンデータ」ページから、表データを1本ダウンロードする" },
  A139:{ title:"地元の産品の名前を、商標として登録する",
    summary:"「地域名＋商品名」を組合などで登録して、勝手に使われないようにする制度（地域団体商標）。取る過程で地域がまとまる。",
    step:"特許庁のサイトで、地域団体商標のガイドブックを1冊読む" },
  B061:{ title:"産地の名前を、勝手に使われないようにする",
    step:"特許庁のサイトで、地域団体商標のガイドブックを1冊読む" },
  A136:{ title:"ダムや橋を見に行くツアーを1本作る",
    summary:"ダム・水門・トンネル・工場。見学を受け入れている施設が思ったより多い。",
    step:"近くのダムや水門で、見学を受け入れているところがないか調べる" },
  A145:{ title:"特産品の味の違いを、1枚の図にする",
    summary:"甘い・酸っぱい・濃いなどを図にするだけで、詳しくない人でも選べる商品になる。",
    step:"同じ種類の産品を5銘柄そろえて、実際に食べ比べ・飲み比べする" },
  A157:{ title:"捨てにくいものの回収のしくみを調べて提案する",
    summary:"紙おむつ・太陽光パネル・魔法びんなど、行政と企業が組んで回収を始めた例が出ている。",
    step:"自分の市で「回収できません」とされている品目を確認する" },
  A174:{ title:"集落のこれからを住民で話し合う場を作る",
    summary:"農村RMO（集落をまとめて支える組織）という国の枠組みがある。話し合いの記録そのものが成果になる。",
    step:"自分の集落の世帯数と年齢の構成を調べる" },
  A198:{ title:"ひとり親の家庭と、家族の世話をしている子の食事会を開く",
    summary:"月1回でよい。安心して食べられる場そのものが支えになる。",
    step:"社会福祉協議会か市の子育て支援課に相談する" },
  A152:{ summary:"入学・進級のタイミングに合わせるだけで需要がある。まだ使える制服や道具を次の人へ回す。",
    step:"PTAか学校に「制服のゆずり合い会をやりたい」と相談する" },
  B049:{ title:"制服や道具をゆずり合って、教育費の負担を下げる",
    step:"PTAか学校に「制服のゆずり合い会をやりたい」と相談する" },
  A179:{ title:"住まなくても通いつづける関わり方を、自分で作る",
    summary:"移住ではなく「通う」。月1回でも続ければ、地域にとっては戦力になる。",
    step:"通う先を1か所決めて、3回ぶんの日程をカレンダーに入れる" },
  A190:{ summary:"1人でも受け入れれば、その地域に通う人が1人増える。受け入れる側の整理も進む。" },
  B044:{ title:"泊まれる場所を作って、地域に通う人を増やす",
    step:"市役所に、農家民泊をやるのに何の届出が要るか聞く" },
  A169:{ title:"しかやいのししを、解体から料理まで通しで体験する",
    summary:"畑を荒らす鳥獣という深刻な問題と、食と、狩猟が1本でつながる。",
    step:"地元の猟友会か、市の鳥獣被害の担当に連絡する" },
  A015:{ summary:"はちみつ・ジャム・干物・しかやいのししの肉など、1つに絞る。許認可の壁も含めて学べる。" },
  A072:{ summary:"場所と壁があれば成立する。写真に撮ってネットに残す形とも相性がよい。" },
  A078:{ summary:"毎日1枚。100日後には、その土地の記録になっている。" },
  A073:{ step:"話を聞きたい人を1人決めて、連絡して日程をもらう" },
  A075:{ step:"最初に話を聞くゲストを1人決めて、声をかける" },
  A063:{ step:"教える機能を3つに絞って、紙に書き出す" },
  A043:{ step:"手紙を書く相手を1人決める" },
  A094:{ step:"自分が健診か献血の予約を取る" },
  A084:{ step:"集落で一番古い家を1軒訪ねて、話を聞かせてもらえるか頼む" },
  A088:{ step:"隣近所5軒に「災害のとき用の連絡グループを作りませんか」と声をかける" },
  A098:{ step:"招きたい人を3人決める" },
  A091:{ step:"血圧計や握力計を借りられる先（保健センター・薬局など）を1件探す" },
  A040:{ step:"カレンダーに2時間だけ、家族で話す枠を取る" },
  A039:{ step:"家族のうち1人に、タイプ診断を受けてもらう" },
  A037:{ step:"地域包括支援センター（市役所で場所を聞ける）に相談する" }
};

/* ── 90件側の12分野を、26分野のどこに寄せるか ── */
const G90 = {
  "いのち・孤立":      "福祉・多様性",
  "高齢者・介護":      "高齢者・ケア",
  "子ども・教育":      "子ども・教育",
  "福祉・多様性":      "福祉・多様性",
  "水辺・自然再生":    "川・水辺・海",
  "里山・森・農地":    "農山漁村",
  "資源循環・脱炭素":  "資源循環",
  "まち・空き家":      "まち・空き家",
  "地域経済・ブランド":"地域ブランド・知財",
  "防災・安全":        "防災・安全",
  "デジタル・システム":"IT・システムづくり",
  "記録・文化継承":    "発信・記録"
};
/* 上の既定から外れるもの（90件側の No → 26分野） */
const G90_ITEM = {
  2:"高齢者・ケア", 3:"高齢者・ケア", 4:"子ども・教育", 5:"心理・人間関係", 6:"福祉・多様性",
  9:"AI・デジタル", 11:"発信・記録",
  16:"学校・若者との協働", 17:"道・橋・インフラ", 19:"学校・若者との協働", 20:"学校・若者との協働",
  26:"からだ・健康",
  32:"自然・環境",
  36:"食・農", 37:"自然・環境", 38:"食・農", 41:"自然・環境", 42:"食・農", 43:"食・農",
  44:"観光・関係人口",
  50:"脱炭素・エネルギー", 51:"脱炭素・エネルギー",
  57:"道・橋・インフラ", 58:"道・橋・インフラ", 59:"道・橋・インフラ", 60:"旅・場づくり",
  64:"お金・小商い", 65:"政治・経済", 66:"お金・小商い", 67:"観光・関係人口", 68:"ものづくり・アート",
  78:"政治・経済",
  83:"歴史・文化", 84:"歴史・文化", 85:"歴史・文化", 87:"歴史・文化", 88:"歴史・文化"
};

const REACH = { "人":"目の前のひとり", "地域":"自分のまち", "日本":"日本じゅうに" };
const SCALE = { S:"ひとりでも始められる", M:"数人いると動く", L:"十数人か、許認可が要る" };

/* ── 元ネタのURL。参照サイトシートから拾い、足りないものはここで補う ── */
const REF_EXTRA = {
  "特許庁":        "https://www.jpo.go.jp/system/trademark/gaiyo/chidan/katsuyo-jire.html",
  "農林水産省":    "https://www.maff.go.jp/",
  "J4CE":          "https://j4ce.env.go.jp/",
  "内閣官房":      "https://www.chisou.go.jp/sousei/",
  "国土交通省":    "https://www.mlit.go.jp/",
  "聞き書き甲子園":"https://www.kikigaki.net/",
  "5actions.jp":   "https://5actions.jp/",
  "上勝町":        "https://why-kamikatsu.jp/"
};
function refUrl(name, table){
  if (!name) return "";
  for (const k of Object.keys(table)) if (name.includes(k) || k.includes(name)) return table[k];
  for (const k of Object.keys(REF_EXTRA)) if (name.includes(k)) return REF_EXTRA[k];
  return "";   /* 「チーム2030 …」「検索：…」はURLなし。文字だけ出す */
}

/* ── 読み込み ─────────────────────────────────── */
const tsv = (p) => readFileSync(p, "utf8").split("\n")
  .map(l => l.split(" | "))
  .filter(r => r.length >= 8 && /^\d+$/.test((r[0] || "").trim()));

const REF_SITES = pRef ? JSON.parse(readFileSync(pRef, "utf8")) : {};

const items = [];
const changes = [];
const warn = [];
let rewrote = 0, linked = 0;

/* REWRITE の内容をあてる */
function applyRewrite(id, o){
  const r = REWRITE[id];
  if (!r) return o;
  rewrote++;
  if (r.title)   { o.titleSrc = o.titleSrc || o.title; o.title = r.title; }
  if (r.summary) { o.summarySrc = o.summary; o.summary = r.summary; }
  if (r.step)    { o.stepSrc = o.step; o.step = r.step; }
  return o;
}

/* 200件： No 分野 名前 内容 誰のため 射程 規模 見える結果 一歩目 参照 */
for (const r of tsv(p200)) {
  const no = Number(r[0].trim());
  const genre = r[1].trim();
  if (!GENRE_SET.has(genre)) { warn.push(`200件 #${no} の分野「${genre}」が26分野にない`); continue; }
  let summary = (r[3] || "").trim();
  const lg = LIGHTEN200[no];
  if (lg && summary.includes(lg.find)) {
    changes.push(`言い換え  200-#${no} ${r[2]}\n            前: ${lg.find}\n            後: ${lg.to}`);
    summary = summary.replace(lg.find, lg.to);
  }
  const scale = (r[6] || "M").trim();
  const refA = (r[9] || "").trim();
  const urlA = refUrl(refA, REF_SITES); if (urlA) linked++;
  items.push(applyRewrite("A" + String(no).padStart(3, "0"), {
    id: "A" + String(no).padStart(3, "0"),
    src: "事例200",
    title: r[2].trim(),
    genre,
    forwho: (r[4] || "").trim(),   /* 誰のためになるか（200件側にだけある） */
    why: "",
    summary,
    reach: REACH[(r[5] || "地域").trim()] || "自分のまち",
    scale, scaleLabel: SCALE[scale] || scale,
    step: (r[8] || "").trim(),
    result: (r[7] || "").trim(),
    land: "", orgs: "",
    ref: refA, refUrl: urlA
  }));
}

/* 90件： No 分野 名前 大義 射程 規模 一歩目 着地点 行政の入口 測る数字 参照 */
for (const r of tsv(p90)) {
  const no = Number(r[0].trim());
  if (DROP[no]) { changes.push(`落とした  90-#${no} ${r[2]} … ${DROP[no]}`); continue; }

  const srcGenre = r[1].trim();
  const genre = G90_ITEM[no] || G90[srcGenre];
  if (!genre) { warn.push(`90件 #${no} の分野「${srcGenre}」の寄せ先が表にない`); continue; }

  const causeSrc = r[3].trim();
  const cause = LIGHTEN[no] || causeSrc;
  if (LIGHTEN[no]) changes.push(`言い換え  90-#${no} ${r[2]}\n            前: ${causeSrc}\n            後: ${cause}`);

  const titleSrc = r[2].trim();
  const title = RETITLE[no] || titleSrc;
  if (RETITLE[no]) changes.push(`名前変更  90-#${no} ${titleSrc}\n            → ${title}`);

  const scale = (r[5] || "M").trim();
  const refB = (r[10] || "").trim();
  const urlB = refUrl(refB, REF_SITES); if (urlB) linked++;
  items.push(applyRewrite("B" + String(no).padStart(3, "0"), {
    id: "B" + String(no).padStart(3, "0"),
    src: "大義つき90",
    title, titleSrc: title === titleSrc ? "" : titleSrc,
    genre, genreSrc: srcGenre,
    forwho: "",
    why: cause, whySrc: cause === causeSrc ? "" : causeSrc,  /* 大義（90件側にだけある） */
    summary: "",
    reach: REACH[(r[4] || "地域").trim()] || "自分のまち",
    scale, scaleLabel: SCALE[scale] || scale,
    step: (r[6] || "").trim(),
    result: (r[9] || "").trim(),
    land: (r[7] || "").trim(),
    orgs: (r[8] || "").trim(),
    ref: refB, refUrl: urlB
  }));
}

/* ── 実在事例33件（旧データ）を26分野に当てる ── */
const old = JSON.parse(readFileSync(pOld, "utf8"));
const REAL_GENRE = [
  [/河川|川|水辺|湿地|湖|海岸|流域|ビオトープ|生物多様性|魚|コウノトリ/, "川・水辺・海"],
  [/里山|森|林|竹|棚田|放牧|集落/,                          "農山漁村"],
  [/農|みかん|産地|食|酒|米/,                               "食・農"],
  [/公共交通|バス|鉄道|駅|歩行|ウォーカブル|回遊|居住誘導|道路/, "道・橋・インフラ"],
  [/空き家|空き店舗|低未利用|公共施設|廃校|倉庫|拠点|まちなか/, "まち・空き家"],
  [/子育て|子ども|学校|教育|高校生|中学生/,                 "子ども・教育"],
  [/福祉|健康|医療|高齢|見守り|生活支援/,                   "高齢者・ケア"],
  [/循環|資源|ごみ|廃/,                                     "資源循環"],
  [/再生可能|エネルギー|脱炭素|太陽光/,                     "脱炭素・エネルギー"],
  [/歴史|文化|景観|シビックプライド|祭/,                    "歴史・文化"],
  [/観光|関係人口|ツーリズム|交流/,                         "観光・関係人口"],
  [/ブランド|商標|地域商品|地域産業|商店/,                  "地域ブランド・知財"],
  [/美術館|アート|芸術/,                                    "ものづくり・アート"],
  [/防災|避難/,                                             "防災・安全"],
  [/スポーツ/,                                              "からだ・健康"]
];
const oldReals = old.reals || old.items.filter(i => i.src === "事例集");
const reals = oldReals.map(i => {
  const t = [i.title, i.cat || "", i.summary, i.apply || "", i.orgs].join(" ");
  const hits = REAL_GENRE.filter(([re]) => re.test(t)).map(([, g]) => g);
  return {
    id: i.id, title: i.title, genre: [...new Set(hits)].slice(0, 3),
    summary: i.summary, step: i.step, result: i.result, orgs: i.orgs, url: i.url || ""
  };
});

/* ── 書き出し ─────────────────────────────────── */
/* 26分野が6グループに漏れなく入っているか、ここで落としておく */
const inGroups = GROUPS.flatMap(g => g[2]);
const missing = GENRE_ORDER.filter(g => !inGroups.includes(g));
const unknown = inGroups.filter(g => !GENRE_SET.has(g));
if (missing.length) throw new Error("どのグループにも入っていない分野: " + missing.join(" / "));
if (unknown.length) throw new Error("26分野にない名前がグループに入っている: " + unknown.join(" / "));
if (inGroups.length !== new Set(inGroups).size) throw new Error("分野がグループに重複している");

const db = {
  groups: GROUPS.map(([name, sub, genres]) => ({ name, sub, genres })),
  genres: GENRES.map(([name, lead]) => ({ name, lead })),
  items, reals
};
writeFileSync("data/cases.json", JSON.stringify(db, null, 1), "utf8");

console.log(`プロジェクト ${items.length} 件（事例200 ${items.filter(i=>i.src==="事例200").length} ＋ 大義つき90 ${items.filter(i=>i.src==="大義つき90").length}）`);
console.log(`もう動いている場所 ${reals.length} 件\n`);
console.log("大きな6つ");
for (const [name, , gs] of GROUPS) {
  const n = items.filter(i => gs.includes(i.genre)).length;
  console.log(`  ${String(n).padStart(3)} 件  ${name}（${gs.length}分野）`);
}
console.log("");
console.log("分野ごとの件数（実在＝もう動いている場所／入口＝行政の入口つき）");
const thin = [];
for (const [g] of GENRES) {
  const n = items.filter(i => i.genre === g).length;
  const m = reals.filter(i => i.genre.includes(g)).length;
  const orgs = items.filter(i => i.genre === g && i.orgs).length;
  console.log(`  ${String(n).padStart(2)} 件  (実在 ${String(m).padStart(2)} ／ 入口 ${String(orgs).padStart(2)})  ${g}`);
  if (n < 6) thin.push(`${g} が ${n} 件`);
}
console.log("\n規模");
for (const s of ["S","M","L"]) console.log(`  ${String(items.filter(i=>i.scale===s).length).padStart(3)} 件  ${SCALE[s]}`);
const noGenre = reals.filter(r => r.genre.length === 0);
if (noGenre.length) console.log("\n分野が当たらなかった実在事例:", noGenre.map(r => r.id + " " + r.title).join(" / "));
if (thin.length) console.log("\n⚠ 6件未満の分野:", thin.join(" / "));
if (warn.length) console.log("\n⚠ " + warn.join("\n⚠ "));
console.log("");
console.log(`読みにくかったものを書き直した: ${rewrote} 件（むずかしい言葉／どこで誰に、が無い一歩目）`);
console.log(`元ネタにURLが付いた: ${linked} / ${items.length} 件`);
const noDesc = items.filter(i => !i.summary && !i.why);
if (noDesc.length) console.log(`⚠ 説明も大義も無い: ${noDesc.length} 件`);
console.log("\n=== 手を入れたところ ===");
changes.forEach(c => console.log("  " + c));
