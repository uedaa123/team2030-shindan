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
  A.genre = genres;
  const got = T.pick(5);
  return {
    ids: got.list.map((r) => r.it.id),
    titles: got.list.map((r) => r.it.title),
    genres: got.list.map((r) => r.it.genre),
    total: got.total,
    reals: (DB.reals || []).filter((x) => x.genre.some((g) => genres.includes(g))).length
  };
}

/* ── ① 分野を1つずつ ── */
console.log("── 分野を1つだけ選んだとき ──");
console.log("");
const seen = new Map();
for (const g of NAMES) {
  const r = run([g]);
  seen.set(r.ids.join(","), (seen.get(r.ids.join(",")) || 0) + 1);
  console.log(`${g.padEnd(11, "　")} 手持ち${String(r.total).padStart(2)}件 → ${r.ids.join(" ")}  実在${r.reals}`);
  console.log(`${"".padEnd(11, "　")} 1位: ${r.titles[0]}`);
  if (r.total < 3) problems.push(`「${g}」が ${r.total} 件しかない`);
  if (r.ids.length < Math.min(5, r.total)) problems.push(`「${g}」で出せるはずの件数が出ていない`);
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

/* ── ③ 設問画面の文が具体的か ── */
console.log("");
console.log("── 分野を選ぶ画面に出る文 ──");
console.log("");
for (const g of DB.genres) {
  const ex = DB.items.filter((i) => i.genre === g.name && i.step)[0];
  console.log(g.lead);
  console.log(`   たとえば：${ex ? ex.step : "(なし)"}   [${g.name}]`);
  if (!ex) problems.push(`「${g.name}」に一歩目つきのプロジェクトがない`);
  if (g.lead === g.name) problems.push(`「${g.name}」の見出しが分野名のまま`);
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
const got = T.pick(5);
T.setResult({
  ranked: got.list, yn: "礼", wdKey: "サポーター",
  wd: T.WDROLE["サポーター"], combo: T.COMBO["礼"]["サポーター"], style: T.STYLE["礼"]
});
for (const kind of ["buddy", "team"]) {
  const txt = T.shareText(kind);
  console.log("");
  console.log(`── 共有文（${kind}）──`);
  console.log(txt);
  if (!txt || txt.length < 60) problems.push(`共有文（${kind}）が短すぎる`);
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
