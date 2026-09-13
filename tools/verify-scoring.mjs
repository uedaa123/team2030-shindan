/* 引継ぎ資料 §5 が要求している確認を自動でやる。
   「配点を変えたら、4タイプ × 3地域くらいで結果が変わることを必ず確認すること。
     変えた結果、誰がやっても同じ5件が出るようになるのが最悪の失敗。」

   使い方： node tools/verify-scoring.mjs
   assets/app.js の score() をそのまま呼ぶので、配点を変えたら結果もここに反映される。 */

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
    if (k === "classList") return { toggle(){}, remove(){}, add(){} };
    if (k === "innerHTML" || k === "textContent" || k === "value") return "";
    return () => stubEl;
  },
  set: () => true
});
const sandbox = {
  window: {},
  document: { getElementById: () => stubEl, querySelectorAll: () => [], querySelector: () => null },
  location: { search: "", protocol: "https:" },
  navigator: {},
  URL,
  URLSearchParams,
  fetch: () => Promise.reject(new Error("verify: fetch は使わない")),
  setTimeout,
  console
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(resolve(ROOT, "assets/app.js"), "utf8"), sandbox, { filename: "app.js" });

const T = sandbox.window.T2030_TEST;
T.setDB(DB);
const A = T.answers();

const TYPES = ["勇", "誠", "義", "礼"];
const PLACES = ["中山間・農山漁村", "地方都市の市街地", "大都市・都市圏"];

function run({ place, yn1, issue, feat, wd, cost, time }) {
  A.place = place;
  A.feat = feat ?? [];
  A.issue = issue ?? [];
  A.wd = wd ?? "unknown";
  A.yn1 = yn1 ?? null;
  A.yn2 = yn1 ?? null;
  A.cost = cost ?? "30万円まで";
  A.time = time ?? "月8時間くらい";

  const all = DB.items.map((it) => ({ it, ...T.score(it) }));
  const ranked = all.filter((r) => !r.over).sort((a, b) => b.s - a.s).slice(0, 5);
  const stretch = all.filter((r) => r.over).sort((a, b) => b.raw - a.raw).slice(0, 2);
  return { ids: ranked.map((r) => r.it.id), titles: ranked.map((r) => r.it.title), stretch: stretch.map((r) => r.it.id) };
}

/* ── ① 4タイプ × 3地域 = 12パターンで、上位5件が重ならないこと ── */
console.log("── 4タイプ × 3地域（気になること：担い手がいない／若者が出ていく）──\n");
const sets = new Map();
let emptyStretch = 0;

for (const place of PLACES) {
  for (const yn1 of TYPES) {
    const r = run({ place, yn1, issue: ["担い手がいない", "若者が出ていく"], feat: ["自然が豊か"] });
    const key = r.ids.join(",");
    sets.set(key, (sets.get(key) || 0) + 1);
    if (r.stretch.length === 0) emptyStretch++;
    console.log(`${place.padEnd(9, "　")} ${yn1}  ${r.ids.join(" ")}  ${r.titles[0]}`);
  }
}

const patterns = sets.size;
console.log(`\n12パターン中、上位5件の並びは ${patterns} 通り`);
const worst = Math.max(...sets.values());
console.log(`同じ並びが最大 ${worst} パターンで重複`);

/* ── ② 課題を変えたら結果が変わること ── */
console.log("\n── 同じ人（中山間・礼）で、気になることだけ変える ──\n");
const issueRuns = [
  ["担い手がいない"],
  ["子どもの体験機会が少ない"],
  ["お金が地域の外に出ていく"],
  ["空き家・空き店舗が多い"]
];
const issueSets = new Set();
for (const issue of issueRuns) {
  const r = run({ place: "中山間・農山漁村", yn1: "礼", issue });
  issueSets.add(r.ids.join(","));
  console.log(`${issue[0].padEnd(12, "　")} ${r.ids.join(" ")}  ${r.titles[0]}`);
}
console.log(`\n4通りの課題で ${issueSets.size} 通りの結果`);

/* ── ③ 予算・時間を絞っても5件出ること／「届かないもの」が出ること ── */
console.log("\n── いちばん条件が厳しい人（3万円まで・月2〜4時間）──\n");
const tight = run({
  place: "中山間・農山漁村", yn1: "礼", issue: ["担い手がいない"],
  cost: "3万円まで", time: "月2〜4時間"
});
console.log(`推薦 ${tight.ids.length} 件：${tight.ids.join(" ")}`);
console.log(`いまは少し届かないもの ${tight.stretch.length} 件：${tight.stretch.join(" ")}`);

/* ── 判定 ── */
const problems = [];
if (patterns < 8) problems.push(`12パターン中 ${patterns} 通りしか出ていない。配点が効きすぎ／効かなすぎ`);
if (worst > 3) problems.push(`同じ並びが ${worst} パターンで重複している`);
if (issueSets.size < 4) problems.push(`課題を変えても結果が ${issueSets.size} 通りしか変わらない`);
if (tight.ids.length < 5) problems.push(`条件が厳しい人に ${tight.ids.length} 件しか出ていない`);
if (tight.stretch.length < 2) problems.push(`「いまは少し届かないもの」が ${tight.stretch.length} 件しか出ていない`);
if (emptyStretch > 0) problems.push(`${emptyStretch} パターンで「届かないもの」が0件`);

console.log("\n" + "─".repeat(50));
if (problems.length === 0) {
  console.log("OK：誰がやっても同じ5件、にはなっていない。");
  process.exit(0);
} else {
  console.log("要確認：");
  problems.forEach((p) => console.log("  ・" + p));
  process.exit(1);
}
