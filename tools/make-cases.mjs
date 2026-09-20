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

const [p200, p90, pOld] = process.argv.slice(2);

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

/* ── 読み込み ─────────────────────────────────── */
const tsv = (p) => readFileSync(p, "utf8").split("\n")
  .map(l => l.split(" | "))
  .filter(r => r.length >= 8 && /^\d+$/.test((r[0] || "").trim()));

const items = [];
const changes = [];
const warn = [];

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
  items.push({
    id: "A" + String(no).padStart(3, "0"),
    src: "事例200",
    title: r[2].trim(),
    genre,
    cause: (r[4] || "").trim(),
    summary,
    reach: REACH[(r[5] || "地域").trim()] || "自分のまち",
    scale, scaleLabel: SCALE[scale] || scale,
    step: (r[8] || "").trim(),
    result: (r[7] || "").trim(),
    land: "", orgs: "",
    ref: (r[9] || "").trim()
  });
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
  items.push({
    id: "B" + String(no).padStart(3, "0"),
    src: "大義つき90",
    title, titleSrc: title === titleSrc ? "" : titleSrc,
    genre, genreSrc: srcGenre,
    cause, causeSrc: cause === causeSrc ? "" : causeSrc,
    summary: "",
    reach: REACH[(r[4] || "地域").trim()] || "自分のまち",
    scale, scaleLabel: SCALE[scale] || scale,
    step: (r[6] || "").trim(),
    result: (r[9] || "").trim(),
    land: (r[7] || "").trim(),
    orgs: (r[8] || "").trim(),
    ref: (r[10] || "").trim()
  });
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
console.log("\n=== 手を入れたところ ===");
changes.forEach(c => console.log("  " + c));
