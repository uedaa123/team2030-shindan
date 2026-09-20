/* 結果の出し方を変えたら、これを流す。
     node tools/verify-scoring.mjs

   assets/app.js の中身をそのまま呼ぶので、並べ方を変えれば結果もここに出る。
   見ているのは4つ。
     ① どの分野を選んでも5件出るか（0件や2件で終わらないか）
     ② 分野を変えたら結果が変わるか（誰がやっても同じ、になっていないか）
     ③ 3つ選んだとき、3つの分野からちゃんと拾えているか
     ④ 「あなたの入り方」32通りが全部埋まっているか */

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

function run(genres) {
  A.genre = genres;
  const got = T.pick(5);
  return {
    ids: got.list.map((r) => r.it.id),
    titles: got.list.map((r) => r.it.title),
    genres: got.list.map((r) => r.it.genre),
    big: got.rest.filter((r) => r.it.scale === "L").slice(0, 2).map((r) => r.it.id),
    reals: (DB.reals || []).filter((x) => x.genre.some((g) => genres.includes(g))).length
  };
}

const problems = [];

/* ── ① ② 分野を1つずつ ── */
console.log("── 分野を1つだけ選んだとき ──\n");
const seen = new Map();
for (const g of DB.genres) {
  const r = run([g]);
  seen.set(r.ids.join(","), (seen.get(r.ids.join(",")) || 0) + 1);
  const n = DB.items.filter((i) => i.genre === g).length;
  console.log(`${g.padEnd(12, "　")} 手持ち${String(n).padStart(2)}件 → ${r.ids.join(" ")}  実在${r.reals}件`);
  console.log(`${"".padEnd(12, "　")} 1位: ${r.titles[0]}`);
  if (r.ids.length < 5) problems.push(`「${g}」で ${r.ids.length} 件しか出ない`);
}
console.log(`\n11分野で ${seen.size} 通りの結果`);
if (seen.size < DB.genres.length) problems.push(`11分野なのに ${seen.size} 通りしか出ていない`);

/* ── ③ 3つ選んだとき ── */
console.log("\n── 3つ選んだとき、3分野から拾えているか ──\n");
const trios = [
  ["子ども・教育", "川・海・生きもの", "歴史・文化・記録"],
  ["空き家・まちなみ", "地域のしごと・お店", "デジタル・事務しごと"],
  ["里山・森・畑", "ごみ・エネルギー", "防災"],
  ["高齢者・介護", "福祉・多様性", "子ども・教育"]
];
for (const trio of trios) {
  const r = run(trio);
  const covered = new Set(r.genres).size;
  console.log(`${trio.join(" + ")}`);
  console.log(`   ${r.ids.join(" ")}  → ${covered}/3 分野をカバー`);
  if (covered < 3) problems.push(`${trio.join("+")} で ${covered}/3 分野しか出ていない`);
}

/* ── 分野を選ぶ画面に出る「例」が、ちゃんと具体的か ── */
console.log("\n── 分野を選ぶ画面に出る例（実際のプロジェクト名）──\n");
for (const g of DB.genres) {
  const ex = DB.items.filter((i) => i.genre === g).slice(0, 3).map((i) => i.title);
  console.log(g + "\n   " + ex.join("／"));
  if (ex.length < 3) problems.push(`「${g}」の例が ${ex.length} 件しか出せない`);
}

/* ── ④ 入り方32通り ── */
console.log("\n── あなたの入り方（勇誠義礼4 × ウェルスダイナミクス8）──\n");
const wds = Object.keys(T.WDROLE);
let filled = 0, blanks = [];
for (const t of T.YN_ORDER) {
  for (const w of wds) {
    const v = T.COMBO[t] && T.COMBO[t][w];
    if (v && v.length > 15) filled++;
    else blanks.push(`${t} × ${w}`);
  }
}
console.log(`${filled} / ${T.YN_ORDER.length * wds.length} 通り書けている`);
if (blanks.length) problems.push(`入り方が空: ${blanks.join(", ")}`);

/* 同じ文の使い回しがないか */
const all = T.YN_ORDER.flatMap((t) => wds.map((w) => T.COMBO[t][w]));
const dup = all.length - new Set(all).size;
if (dup > 0) problems.push(`入り方に同じ文が ${dup} 個ある（使い回しは意味がない）`);
else console.log("同じ文の使い回しなし");

/* ── 判定 ── */
console.log("\n" + "─".repeat(52));
if (problems.length === 0) {
  console.log("OK：どの分野でも5件出るし、選び方で結果が変わる。");
  process.exit(0);
} else {
  console.log("要確認：");
  problems.forEach((p) => console.log("  ・" + p));
  process.exit(1);
}
