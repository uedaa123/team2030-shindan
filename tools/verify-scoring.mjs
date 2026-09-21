/* 結果の出し方を変えたら、これを流す。
     node tools/verify-scoring.mjs

   assets/app.js の中身をそのまま呼ぶので、直せば結果もここに出る。
   見ているのは5つ。
     ① どの分野を選んでも、ちゃんと件数が出るか
     ② 3つ選んだとき、3分野から拾えているか
     ③ 分野を選ぶ画面の文が、分野名のままになっていないか（具体的か）
     ④ 入り方32通りと、進め方4タイプが埋まっているか
     ⑤ 共有文（バディ用・チーム用）が2種類とも出るか */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DB = JSON.parse(readFileSync(resolve(ROOT, "data/cases.json"), "utf8"));

/* app.js はブラウザ前提なので、最低限のDOMを用意して読み込む */
const stubEl = new Proxy({}, {
  get: (t, k) => {
    if (k === "style") return {};
    if (k === "querySelectorAll") return () => [];
    if (k === "querySelector") return () => null;
    if (k === "innerHTML" || k === "textContent" || k === "value") return "";
    return () => stubEl;
  },
  set: () => true
});
const sandbox = {
  window: {},
  document: { getElementById: () => stubEl, querySelectorAll: () => [], querySelector: () => null },
  location: { search: "", protocol: "https:" },
  navigator: {}, URL, URLSearchParams, Object,
  fetch: () => Promise.reject(new Error("verify: fetch は使わない")),
  setTimeout, console
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(resolve(ROOT, "assets/app.js"), "utf8"), sandbox, { filename: "app.js" });

const T = sandbox.window.T2030_TEST;
T.setDB(DB);
const A = T.answers();
const NAMES = DB.genres.map((g) => g.name);
const problems = [];

function run(genres) {
  A.group = DB.groups.filter((g) => g.genres.some((x) => genres.includes(x))).map((g) => g.name);
  A.genre = genres;
  A.project = null;
  const list = T.shortlist();
  return {
    ids: list.map((it) => it.id),
    titles: list.map((it) => it.title),
    genres: list.map((it) => it.genre),
    total: DB.items.filter((it) => genres.includes(it.genre)).length
  };
}

/* ── ① 分野を1つずつ ── */
console.log("── 分野を1つだけ選んだとき ──");
console.log("");
const seen = new Map();
for (const g of NAMES) {
  const r = run([g]);
  seen.set(r.ids.join(","), (seen.get(r.ids.join(",")) || 0) + 1);
  console.log(`${g.padEnd(11, "　")} 手持ち${String(r.total).padStart(2)}件 → 候補 ${r.ids.join(" ")}`);
  console.log(`${"".padEnd(11, "　")} 1位: ${r.titles[0]}`);
  if (r.total < 3) problems.push(`「${g}」が ${r.total} 件しかない`);
  if (r.ids.length < Math.min(8, r.total)) problems.push(`「${g}」の候補が ${r.ids.length} 件しか出ていない（手持ち${r.total}件）`);
}
console.log("");
console.log(`${NAMES.length}分野で ${seen.size} 通りの結果`);
if (seen.size < NAMES.length) problems.push(`${NAMES.length}分野なのに ${seen.size} 通りしか出ていない`);

/* ── ② 3つ選んだとき ── */
console.log("");
console.log("── 3つ選んだとき、3分野から拾えているか ──");
console.log("");
const trios = [
  ["政治・経済", "AI・デジタル", "動物"],
  ["子ども・教育", "川・水辺・海", "歴史・文化"],
  ["まち・空き家", "お金・小商い", "旅・場づくり"],
  ["高齢者・ケア", "心理・人間関係", "福祉・多様性"]
];
for (const trio of trios) {
  const r = run(trio);
  const covered = new Set(r.genres).size;
  console.log(`${trio.join(" + ")}`);
  console.log(`   ${r.ids.join(" ")} → ${covered}/3 分野`);
  if (covered < 3) problems.push(`${trio.join("+")} で ${covered}/3 分野しか出ていない`);
}

/* ── ③ 3段階の入口 ── */
console.log("");
console.log("── 1問目：大きな6つ ──");
console.log("");
const inGroups = DB.groups.flatMap((g) => g.genres);
for (const g of DB.groups) {
  const n = DB.items.filter((it) => g.genres.includes(it.genre)).length;
  console.log(`${g.name}（${g.sub}）`);
  console.log(`   ${g.genres.length}分野 / ${n}件 … ${g.genres.join(" / ")}`);
  if (n < 20) problems.push(`グループ「${g.name}」が ${n} 件しかない`);
}
const missing = NAMES.filter((g) => !inGroups.includes(g));
if (missing.length) problems.push("どのグループにも入っていない分野: " + missing.join(" / "));
if (inGroups.length !== new Set(inGroups).size) problems.push("分野がグループに重複している");

console.log("");
console.log("── 2問目：分野の選択肢に出る「たとえば」──");
console.log("");
for (const g of DB.genres) {
  const ex = DB.items.filter((i) => i.genre === g.name).slice(0, 2).map((i) => i.title);
  console.log(`${g.name}`);
  console.log(`   ${ex.join(" ／ ")}`);
  if (ex.length < 2) problems.push(`「${g.name}」の例が2つ出せない`);
  /* 一歩目ではなくプロジェクト名が出ているか（一歩目は「〜する」で終わる手続きが多い） */
  if (ex.some((x) => x.length > 34)) problems.push(`「${g.name}」の例が長すぎる（${ex.find((x) => x.length > 34)}）`);
}

console.log("");
console.log("── 3問目：候補として出るプロジェクト ──");
console.log("");
for (const trio of [["政治・経済"], ["AI・デジタル", "IT・システムづくり"], ["動物", "からだ・健康"]]) {
  const r = run(trio);
  console.log(trio.join(" + "));
  r.titles.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));
  if (r.titles.length < Math.min(4, r.total)) problems.push(`${trio.join("+")} の候補が少なすぎる`);
}

/* ── ④ 入り方と進め方 ── */
console.log("");
console.log("── 入り方（32通り）と進め方（4タイプ）──");
const wds = Object.keys(T.WDROLE);
let filled = 0;
for (const t of T.YN_ORDER) for (const w of wds) {
  const v = T.COMBO[t] && T.COMBO[t][w];
  if (v && v.length > 15) filled++; else problems.push(`入り方が空: ${t} × ${w}`);
}
console.log(`入り方 ${filled} / ${T.YN_ORDER.length * wds.length} 通り`);
const combos = T.YN_ORDER.flatMap((t) => wds.map((w) => T.COMBO[t][w]));
if (combos.length !== new Set(combos).size) problems.push("入り方に同じ文の使い回しがある");
for (const t of T.YN_ORDER) {
  const st = T.STYLE[t];
  if (!st || st.steps.length !== 4) problems.push(`${t}タイプの進め方が4ステップになっていない`);
}
console.log(`進め方 ${T.YN_ORDER.length} タイプ × 4ステップ`);

/* ── ⑤ 共有文 ── */
run(["子ども・教育"]);
const got = { list: T.shortlist().slice(0, 3).map((it) => ({ it })) };
T.setResult({
  ranked: got.list, yn: "礼", wdKey: "サポーター",
  wd: T.WDROLE["サポーター"], combo: T.COMBO["礼"]["サポーター"], style: T.STYLE["礼"]
});
const txt = T.shareText();
console.log("");
console.log("── 共有文（バディ・チーム共通）──");
console.log(txt);
if (!txt || txt.length < 100) problems.push("共有文が短すぎる");
if (/ますか？|ませんか？/.test(txt)) problems.push("共有文に問いかけが残っている");

/* 進め方が「自分ひとりで進めるとき」の手順になっているか。
   相手に動いてもらう書き方（バディに話す・チームに共有する）が混ざっていないか */
for (const t of T.YN_ORDER) {
  const joined = T.STYLE[t].steps.join(" ");
  if (/バディに|チームに共有/.test(joined)) {
    problems.push(`${t}タイプの手順に、人に動いてもらう書き方が残っている`);
  }
}

/* ── ⑥ GASスクリプトの構文 ──
   gas-endpoint.gs は貼り付けて使うので、壊れていると
   Apps Script のエディタで初めて気づくことになる。ここで落としておく。 */
console.log("");
console.log("── tools/gas-endpoint.gs ──");
try {
  const gs = readFileSync(resolve(ROOT, "tools/gas-endpoint.gs"), "utf8");
  new vm.Script(gs, { filename: "gas-endpoint.gs" });
  console.log("構文OK");
  const odd = gs.split("\n")
    .map((l, i) => [i + 1, l])
    .filter(([, l]) => (l.split("'").length - 1) % 2 || (l.split('"').length - 1) % 2);
  if (odd.length) problems.push("gas-endpoint.gs で引用符が閉じていない行: " + odd.map(([n]) => n).join(", "));
} catch (e) {
  problems.push("gas-endpoint.gs の構文エラー: " + e.message);
}

/* ── 判定 ── */
console.log("");
console.log("─".repeat(52));
if (problems.length === 0) {
  console.log("OK");
  process.exit(0);
} else {
  console.log("要確認：");
  problems.forEach((p) => console.log("  ・" + p));
  process.exit(1);
}
