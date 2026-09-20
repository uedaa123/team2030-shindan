/* オフライン配布用の1ファイル版を作る。
   使い方：  node build.mjs
   出力：    dist/TEAM2030_プロジェクト診断_offline.html

   公開用（index.html + data/cases.json）と中身は同じで、
   CSS・JS・事例データを1枚のHTMLに埋め込んだだけのもの。
   file:// で直接開けるので、実機確認やオフライン配布はこちらを使う。 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(ROOT, p), "utf8");

const css = read("assets/style.css");
const js = read("assets/app.js");
const cfg = read("config.js");
const raw = read("data/cases.json");

// 読めるJSONかどうかをここで落としておく（壊れたまま配布しないため）
const db = JSON.parse(raw);
if (!Array.isArray(db.items) || db.items.length === 0) {
  throw new Error("cases.json に items がありません");
}

// </script> がデータ中にあるとHTMLが壊れるのでエスケープ
const embedded = JSON.stringify(db).replace(/<\//g, "<\\/");

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>TEAM2030 プロジェクトコンパス</title>
<!-- オフライン配布版（build.mjs が自動生成）。直接編集しないこと。
     直すのは assets/ と data/ の側。 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700&display=swap">
<style>
${css}
</style>
</head>
<body>

<header><div class="wrap">
<p class="eyebrow">TEAM2030</p>
<h1>プロジェクト<span>コンパス</span></h1>
<p>3分。<b>あなたのプロジェクトが見つかる。</b></p>
</div></header>

<div class="bar"><i id="bar"></i></div>

<main class="wrap" id="app" aria-live="polite"></main>

<textarea id="fallbackpad" aria-hidden="true" tabindex="-1"></textarea>

<script>${cfg}</script>
<script>window.T2030_DATA = ${embedded};</script>
<script>
${js}
</script>
</body>
</html>
`;

/* ── 公開用 index.html に版を打つ ────────────────────
   GitHub Pages は CSS/JS を10分ほどキャッシュするので、
   更新しても古いままの画面を見せてしまう。中身が変わったときだけ
   変わる短いハッシュを ?v= に付けて、確実に新しいほうを読ませる。 */
const stamp = createHash("sha1").update(css + js + cfg).digest("hex").slice(0, 8);
const idxPath = resolve(ROOT, "index.html");
const idx = readFileSync(idxPath, "utf8")
  .replace(/(href|src)="(assets\/[\w.-]+|config\.js)(\?v=[0-9a-f]+)?"/g,
           (_, attr, file) => `${attr}="${file}?v=${stamp}"`);
writeFileSync(idxPath, idx, "utf8");
console.log(`index.html に版を打ちました: ?v=${stamp}`);

mkdirSync(resolve(ROOT, "dist"), { recursive: true });
const out = resolve(ROOT, "dist/TEAM2030_プロジェクト診断_offline.html");
writeFileSync(out, html, "utf8");
console.log(`書き出しました: ${out}`);
console.log(`  事例 ${db.items.length} 件 / ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
