/* 引継ぎ資料 §7-1「タグの精度」の目視作業を、どこから手をつけるか決めるための一覧。
   タグを直すのは人の仕事なので、このスクリプトは数えるだけで何も書き換えない。

   使い方： node tools/tag-report.mjs            … 全体の偏りを出す
            node tools/tag-report.mjs issue 地域の魅力が知られていない
                                                  … そのタグが付いている事例を並べる（間引く候補を選ぶ用） */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DB = JSON.parse(readFileSync(resolve(ROOT, "data/cases.json"), "utf8"));
const N = DB.items.length;

const [col, value] = process.argv.slice(2);

if (col && value) {
  const hits = DB.items.filter((it) => (it[col] || []).includes(value));
  console.log(`${col} = ${value}  … ${hits.length} / ${N} 件\n`);
  for (const it of hits) {
    console.log(`${it.id}  ${it.title}`);
    console.log(`      ${it.summary.slice(0, 60)}`);
    console.log(`      ${col}: ${it[col].join(" / ")}\n`);
  }
  process.exit(0);
}

function count(key) {
  const m = new Map();
  for (const it of DB.items) for (const v of it[key] || []) m.set(v, (m.get(v) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/* 半数を超えるとそのタグは絞り込みに効かなくなる（選んだ人の半分以上に同じ事例が出る） */
const HALF = N / 2;

function show(key, label) {
  console.log(`── ${label}（${key}）──`);
  for (const [v, n] of count(key)) {
    const pct = Math.round((n / N) * 100);
    const bar = "█".repeat(Math.round(n / 2));
    const flag = n > HALF ? "  ← 半数超。絞り込みに効いていない" : "";
    console.log(`${String(n).padStart(3)} 件 ${String(pct).padStart(3)}%  ${bar} ${v}${flag}`);
  }
  console.log("");
}

console.log(`事例 ${N} 件\n`);
show("issue", "効く課題");
show("yn", "勇誠義礼");
show("feat", "土地の特徴");
show("place", "地域規模");
show("wd", "主役になれるプロファイル");

const avg = (key) => (DB.items.reduce((s, it) => s + (it[key] || []).length, 0) / N).toFixed(1);
console.log("1件あたりの平均タグ数：" +
  ["issue", "feat", "yn", "wd", "place"].map((k) => `${k} ${avg(k)}`).join(" / "));

console.log(`
タグが1件に付きすぎていると、誰が診断しても同じ事例が上に来る。
「半数超」と出た値は、上の使い方②で中身を並べて、本当に効く事例だけ残すこと。
直すのは data/cases.json。コードは触らなくてよい。
直したあとは node tools/verify-scoring.mjs を流して、結果が散らばることを確認する。`);
