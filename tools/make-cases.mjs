/* TEAM2030_プロジェクト90_大義つき.xlsx ＋ 旧 cases.json の実在事例33件
   → data/cases.json を作り直す。

   使い方： node tools/make-cases.mjs <xlsxから吐いたTSV> <旧cases.json>

   ここでやっている判断は3つ。全部この下の表に書いてあるので、
   気に入らなければ表を直して流し直せばよい。

   ① 重いテーマを前向きに言い換える（LIGHTEN）
      植田さんの指示「TEAM2030は前向きで明るい未来のためにあるから、
      負の側面すぎるのはずれてる」。やることは変えず、大義の言い方だけ変える。
      元の文は genreSrc / causeSrc に残してあるので、いつでも戻せる。
   ② 言い換えでは収まらないものは落とす（DROP）
      軽くすると内容を偽ることになるものだけ。理由つき。
   ③ 分野名を前向きな言い方にする（GENRE）
*/

import { readFileSync, writeFileSync } from "node:fs";

const [tsvPath, oldPath] = process.argv.slice(2);

/* ── ① 大義の言い換え（No → 新しい大義） ───────────────── */
const LIGHTEN = {
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

/* ── ①b プロジェクト名の言い換え（No → 新しい名前）
   大義だけ明るくしても、一覧で最初に目に入るのは名前なのでここも直す。 */
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

/* ── ② 落とすもの（No → 理由） ─────────────────────── */
const DROP = {
  1: "自殺対策そのもの。前向きに言い換えると内容を偽ることになる。" +
     "ゲートキーパー養成が前提で、入会2週目に一人で始める形にもならない。"
};

/* ── ③ 分野名（元の名前 → サイトで出す名前） ──────────── */
const GENRE = {
  /* 残り3件と少なく、テーマも近いので「福祉・多様性」に寄せた */
  "いのち・孤立":     "福祉・多様性",
  "高齢者・介護":     "高齢者・介護",
  "子ども・教育":     "子ども・教育",
  "福祉・多様性":     "福祉・多様性",
  "水辺・自然再生":   "川・海・生きもの",
  "里山・森・農地":   "里山・森・畑",
  "資源循環・脱炭素": "ごみ・エネルギー",
  "まち・空き家":     "空き家・まちなみ",
  "地域経済・ブランド":"地域のしごと・お店",
  "防災・安全":       "防災",
  "デジタル・システム":"デジタル・事務しごと",
  "記録・文化継承":   "歴史・文化・記録"
};

/* 分野の並び（サイトでこの順に出る） */
const GENRE_ORDER = [
  "子ども・教育", "川・海・生きもの", "里山・森・畑", "歴史・文化・記録",
  "空き家・まちなみ", "地域のしごと・お店", "ごみ・エネルギー",
  "デジタル・事務しごと", "高齢者・介護", "福祉・多様性", "防災"
];

/* 分野をまたいで移すもの（No → 新しい分野名） */
const REGENRE = {
  2: "高齢者・介護",
  4: "子ども・教育"
};

const REACH = { "人":"目の前のひとり", "地域":"自分のまち", "日本":"日本じゅうに" };
const SCALE = {
  "S": { label:"ひとりでも始められる", order:0 },
  "M": { label:"数人いると動く",       order:1 },
  "L": { label:"十数人か、許認可が要る", order:2 }
};

/* ── 変換 ────────────────────────────────────────── */
const rows = readFileSync(tsvPath, "utf8").split("\n")
  .map(l => l.split(" | "))
  .filter(r => r.length >= 10 && /^\d+$/.test((r[0] || "").trim()));

const items = [];
const changes = [];

for (const r of rows) {
  const no = Number(r[0].trim());
  if (DROP[no]) { changes.push(`落とした  #${no} ${r[2]} … ${DROP[no]}`); continue; }

  const srcGenre = r[1].trim();
  const genre = REGENRE[no] || GENRE[srcGenre];
  if (!genre) throw new Error(`分野が表にない: ${srcGenre}`);

  const causeSrc = r[3].trim();
  const cause = LIGHTEN[no] || causeSrc;
  if (LIGHTEN[no]) changes.push(`言い換え  #${no} ${r[2]}\n            前: ${causeSrc}\n            後: ${cause}`);
  if (REGENRE[no]) changes.push(`分野移動  #${no} ${r[2]} … ${GENRE[srcGenre]} → ${genre}`);

  const titleSrc = r[2].trim();
  const title = RETITLE[no] || titleSrc;
  if (RETITLE[no]) changes.push(`名前変更  #${no} ${titleSrc}
            → ${title}`);

  const scale = (r[5] || "M").trim();
  items.push({
    id: "P" + String(no).padStart(3, "0"),
    kind: "project",
    title,
    titleSrc: title === titleSrc ? "" : titleSrc,
    genre,
    genreSrc: srcGenre,
    cause,
    causeSrc: cause === causeSrc ? "" : causeSrc,
    reach: REACH[(r[4] || "地域").trim()] || "自分のまち",
    scale,
    scaleLabel: SCALE[scale] ? SCALE[scale].label : scale,
    step: (r[6] || "").trim(),
    land: (r[7] || "").trim(),
    orgs: (r[8] || "").trim(),
    numbers: (r[9] || "").trim(),
    ref: (r[10] || "").trim()
  });
}

/* ── 実在事例33件。分野を当てて「もう動いている場所」に回す ── */
const old = JSON.parse(readFileSync(oldPath, "utf8"));
const REAL_GENRE = [
  [/河川|川|水辺|湿地|湖|海岸|流域|ビオトープ|生物多様性|魚/, "川・海・生きもの"],
  [/里山|森|林|農|棚田|放牧|みかん|産地/,                    "里山・森・畑"],
  [/公共交通|バス|鉄道|駅|歩行|ウォーカブル|回遊|居住誘導/,   "空き家・まちなみ"],
  [/空き家|空き店舗|低未利用|公共施設|廃校|倉庫|拠点/,        "空き家・まちなみ"],
  [/子育て|子ども|学校|教育|高校生|中学生/,                  "子ども・教育"],
  [/福祉|健康|医療|高齢|見守り|生活支援/,                    "高齢者・介護"],
  [/循環|再生可能|エネルギー|資源|脱炭素/,                    "ごみ・エネルギー"],
  [/歴史|文化|景観|シビックプライド|まちなみ/,               "歴史・文化・記録"],
  [/ブランド|商標|観光|地域商品|地域産業|経済|商店/,          "地域のしごと・お店"]
];

const reals = old.items.filter(i => i.src === "事例集").map(i => {
  const t = [i.title, i.cat, i.summary, i.apply, i.orgs].join(" ");
  const hits = REAL_GENRE.filter(([re]) => re.test(t)).map(([, g]) => g);
  return {
    id: i.id,
    kind: "real",
    title: i.title,
    genre: [...new Set(hits)].slice(0, 3),
    cat: i.cat,
    summary: i.summary,
    step: i.step,
    apply: i.apply,
    result: i.result,
    orgs: i.orgs,
    url: i.url || ""
  };
});

const noGenre = reals.filter(r => r.genre.length === 0);

const db = {
  genres: GENRE_ORDER,
  reaches: ["自分のまち", "日本じゅうに"],
  items,
  reals
};

writeFileSync("data/cases.json", JSON.stringify(db, null, 1), "utf8");

console.log(`プロジェクト ${items.length} 件 ／ もう動いている場所 ${reals.length} 件`);
console.log("\n分野ごとの件数");
for (const g of GENRE_ORDER) {
  const n = items.filter(i => i.genre === g).length;
  const m = reals.filter(i => i.genre.includes(g)).length;
  console.log(`  ${String(n).padStart(2)} 件  (実在 ${m})  ${g}`);
}
console.log("\n射程");
for (const r of db.reaches) console.log(`  ${String(items.filter(i => i.reach === r).length).padStart(2)} 件  ${r}`);
console.log(`  ${items.filter(i => i.reach === "目の前のひとり").length} 件  目の前のひとり`);
console.log("\n規模");
for (const s of ["S","M","L"]) console.log(`  ${String(items.filter(i=>i.scale===s).length).padStart(2)} 件  ${s} ${SCALE[s].label}`);
if (noGenre.length) console.log("\n分野が当たらなかった実在事例:", noGenre.map(r => r.id + " " + r.title).join(" / "));
console.log("\n=== 手を入れたところ ===");
changes.forEach(c => console.log("  " + c));
