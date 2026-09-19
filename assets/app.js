/* チーム2030 プロジェクト診断
   素のHTML/CSS/JS。ビルド不要、フレームワークなし、localStorage/sessionStorage 不使用。
   状態はすべてメモリ上の A オブジェクトで持つ。

   設問は5問。分野／誰に届けたいか／ウェルスダイナミクス／勇誠義礼2問。
   住んでいる場所・出せるお金・使える時間は聞かない（2026-09-20 植田さんの指示）。 */
(function () {
"use strict";

/* ── 設定 ───────────────────────────────────────────── */
var CFG = Object.assign({
  dataUrl: "data/cases.json",
  logEndpoint: "",
  logSecret: "",
  questionSet: "full",
  askName: true
}, window.T2030_CONFIG || {});

/* URLの ?q=3 で短い版（分野・届け先・勇誠義礼1問）に切り替え */
try {
  var qp = new URLSearchParams(location.search);
  if (qp.get("q") === "3") CFG.questionSet = "short";
  if (qp.get("q") === "5") CFG.questionSet = "full";
} catch (e) { /* URLSearchParams が無い環境では既定のまま */ }

/* 埋め込み版（オフライン配布用）はこの変数にデータが入っている */
var EMBEDDED = window.T2030_DATA || null;

/* ── 固定マスタ①：勇誠義礼（行動コミュニケーション学の思考特性4タイプ）
   出典 一般社団法人行動コミュニケーション協会
   勇＝左脳イン/右脳アウト、誠＝左左、義＝右右、礼＝右脳イン/左脳アウト
   ※定義文は言い換えない ───────────────────────────── */
var YN = {
 "勇":{ q:"What", head:"考えるより、まず動く",
   desc:"思ったら即行動。うまくいかないのは、まだ行動していないからだと考える。「で、どうする？」「結局、自分は何をしたらいいのか」が気になる。",
   love:"して欲しいことを、言う前にしてもらったとき",
   loveShort:"して欲しいことを、言う前にしてもらえると嬉しい",
   ai:"家族愛（自分を必要としてくれる身近な人を幸せにしようとする）",
   proj:"計画を練る前に、今週やる1つを決めてしまうこと。動いてから考える順番でいい。",
   buddy:"言われる前に手を動かして支えてくれる相手。段取りの相談より、一緒にやってくれる人。"},
 "誠":{ q:"How", head:"やるなら、達成できる形にする",
   desc:"効率よく成果を出すには計画が必要だと考える。「どうやって？」「本当に達成できるのか？」が気になり、達成と成果を重視する。",
   love:"そばにいてもらったとき（言葉を交わさなくても、同じ空間にいること）",
   loveShort:"そばにいてもらえると嬉しい",
   ai:"隣人愛（身近な人だけでなく、見ず知らずの人も含む広いコミュニティへ。仕組みやシステムを通して届ける）",
   proj:"数字と期限を先に置くこと。測れる目標がないと力が出ない。仕組みづくりが持ち場。",
   buddy:"同じ時間に一緒に作業してくれる相手。離れた場所からの励ましより、隣にいること。"},
 "義":{ q:"Why", head:"なぜやるのかが、いちばん大事",
   desc:"目的とビジョンを示し、みんなのエネルギーを上げることが成果につながると考える。「なぜですか？」が気になり、そのWhyに向けた一貫した行動を大切にする。",
   love:"承認してもらったとき（言葉でも、承認の意味を込めた握手や肩を叩くことでも）",
   loveShort:"承認してもらえると嬉しい",
   ai:"存在愛（人間や生命の尊厳を守ろうとする）",
   proj:"100年後の風景を先に描くこと。目的が言葉になっていないと、手が動かない。",
   buddy:"やっていることを認めて、言葉にして返してくれる相手。黙って見ているだけでは伝わらない。"},
 "礼":{ q:"Story", head:"人と、そこまでの経緯を大切にする",
   desc:"その場の雰囲気や人が抱く感情を大切にする。人との関係性にフォーカスし、楽しさや一体感を重視する。Why・What・Howを全部含んだStoryで受け取る。",
   love:"話を最後まで聴いてもらったとき（遮られずに、自分のために時間を使ってもらうこと）",
   loveShort:"話を最後まで聴いてもらえると嬉しい",
   ai:"自己愛（自分の才能を表現することが、他人の幸せにつながると信じる）",
   proj:"誰と、どういう経緯でやるのかを先に決めること。人の顔が見えないと進まない。",
   buddy:"口を挟まずに最後まで聴いてくれる相手。アドバイスより、まず聴くこと。"}
};
var YN_ORDER = ["勇","誠","義","礼"];

/* ── 固定マスタ②：ウェルスダイナミクス（協会発行レポート p.50-51, p.60） ── */
var WDROLE = {
 "クリエイター":{role:"立ち上げ役。混乱は起きるが、そこから抜ける方法を思いつく",
   support:"機会提供者・出資者", catalyst:["メカニック","ディールメーカー"],
   why:"メカニックが仕組みを引き受け、ディールメーカーがアイデアをお金に換えてくれる"},
 "スター":{role:"看板役。前に出て、人を集める",
   support:"推薦者・支持者", catalyst:["クリエイター","ディールメーカー"],
   why:"クリエイターが中身を作り、ディールメーカーが知名度をお金に換えてくれる"},
 "サポーター":{role:"チームを率いる役。計画は人からもらい、動かすのが得意",
   support:"アドバイザー・同志", catalyst:["クリエイター","メカニック"],
   why:"価値を生み出す人と組むのが最短。何をやるかより誰を支えるかで選ぶ"},
 "ディールメーカー":{role:"つなぐ役。人と人を引き合わせて価値を生む",
   support:"マネジャー・チーム", catalyst:["クリエイター","メカニック"],
   why:"つなぐ相手として、作る人と仕組む人が第一候補になる"},
 "トレーダー":{role:"売り買いの役。相場と頃合いが読める",
   support:"機会提供者・アドバイザー", catalyst:["サポーター","メカニック"],
   why:"サポーターが時間を作り、メカニックが仕組みを支えてくれる"},
 "アキュムレーター":{role:"進行管理役。期限内に確実に仕上げる",
   support:"出資者・同志", catalyst:["サポーター","メカニック"],
   why:"一人で貯め込まず、外とつないでくれる人を持つと動き出す"},
 "ロード":{role:"分析と裏方の役。数字と細部で支える",
   support:"出資者・マネジャー", catalyst:["サポーター","ディールメーカー"],
   why:"サポーターが時間を作り、ディールメーカーが資金と基盤をつないでくれる"},
 "メカニック":{role:"仕上げ役。既にあるものを分解して、より良く組み直す",
   support:"機会提供者・出資者", catalyst:["クリエイター","ディールメーカー"],
   why:"クリエイターが中身を足し、ディールメーカーが仕組みをお金に換えてくれる"}
};

/* ── 固定マスタ③：あなたの入り方（勇誠義礼4 × ウェルスダイナミクス8 ＝ 32通り）
   「何をやるか」ではなく「あなたはそこにどう入るか」。結果画面のいちばん上に出る。
   自動生成にすると当たり障りのない文になるので、1本ずつ手で書いてある。 ── */
var COMBO = {
 "勇":{
  "クリエイター":"思いついた形を、今週そのまま試してください。相談はやってみたあとでいい。ただし2週目には誰かに渡す前提で。",
  "スター":"先に人前で「やります」と言ってしまうのが早い。引き受けてくれる人は、そのあと集まります。",
  "サポーター":"動きながら人を巻き込むタイプ。計画書を作る前に、手伝ってくれる人を1人つかまえてください。",
  "ディールメーカー":"思いついたらその場で電話する。あなたの一歩目は「つなぐ」なので、資料はいりません。",
  "トレーダー":"まず小さく売ってみる。反応を見てから、続けるかどうかを決めてください。",
  "アキュムレーター":"動きたい気持ちと、確実に仕上げたい性質がぶつかります。今週やる1つだけ決めて、それだけやる。",
  "ロード":"調べる前に一度、現場に行ってください。数字は行ってから取るほうが速い。",
  "メカニック":"いきなり作り始めていい。直すのは、動くものができてからです。"
 },
 "誠":{
  "クリエイター":"思いつきを、先に期限と数字に変換してください。「いつまでに何を」が決まると手が動きます。",
  "スター":"出る場所と回数を先に決める。行き当たりばったりの露出は消耗します。",
  "サポーター":"計画は人からもらっていい。あなたは動かす側です。一歩目は「計画を持っている人」を探すこと。",
  "ディールメーカー":"誰と誰をつなぐと何が起きるかを、先に1枚にする。会う順番を決めてから動いてください。",
  "トレーダー":"いくらで何個売れば成り立つかを先に出す。数字が立たないうちは売らない。",
  "アキュムレーター":"いちばん強い組み合わせです。期限を切って、そのとおりに終わらせられる。最初の期限を今週決めてください。",
  "ロード":"得意がそのまま一歩目になります。ただし分析で止まらないよう、報告する相手を先に決めておくこと。",
  "メカニック":"すでにある仕組みを1つ選んで、どこが壊れているかを測る。作り直すのはそのあとです。"
 },
 "義":{
  "クリエイター":"なぜやるのかを1行書いてから作り始めてください。その1行が、人を呼ぶ看板になります。",
  "スター":"目的を語る場を先に作る。あなたが語ると人が動きます。中身を作る人は後から来ます。",
  "サポーター":"目的を掲げて、そこに人を集める。実務は集まった人に渡していい。",
  "ディールメーカー":"「何のためか」を言葉にしてから人に会う。目的がないと、あなたのつなぎは空回りします。",
  "トレーダー":"何のために売るのかを決める。値段より先に意味。そこが決まると強い。",
  "アキュムレーター":"目的が腹落ちしないと進行管理に力が入りません。着地点を先に自分の言葉にしてください。",
  "ロード":"分析の前に、何を証明したいのかを決める。目的のないデータは、集めても使いません。",
  "メカニック":"直す前に「何のために直すのか」を決める。そこがないと、きれいにして終わります。"
 },
 "礼":{
  "クリエイター":"誰と作るかを先に決めてください。ひとりで作ると途中で止まります。",
  "スター":"あなたの語りは物語になる。まず1人の話を聞いて、その人を主役にして語ってください。",
  "サポーター":"いちばん自然な組み合わせです。誰を支えるかを1人決めるところから始めてください。",
  "ディールメーカー":"会って話を聞くところから始めていい。あなたの一歩目は、用件のない訪問でかまいません。",
  "トレーダー":"買ってくれる人の顔が見えないと動けないタイプ。まず1人に、手渡しで売ってください。",
  "アキュムレーター":"進行管理は得意ですが、人を急かすのが苦手。期限は自分で決めず、みんなで決めること。",
  "ロード":"数字の前に、その数字が誰の何を変えるのかを聞いておく。そこが分かると手が速くなります。",
  "メカニック":"直す前に、それを使っている人の話を最後まで聞く。使い手の話がそのまま設計図になります。"
 }
};

/* ウェルスダイナミクスが「まだ分からない」人向け。勇誠義礼だけで出す */
var COMBO_SOLO = {
 "勇":"考える前に動けるのが強みです。今週やる1つを決めて、それだけやってください。計画はあとから追いつきます。",
 "誠":"数字と期限を先に置いてください。「いつまでに、何を、どれだけ」が決まると、あなたは一気に進みます。",
 "義":"なぜやるのかを1行にしてから始めてください。目的が言葉になっていないと、あなたの手は動きません。",
 "礼":"誰とやるかを先に決めてください。人の顔が見えると進みます。まず1人、話を聞きに行くところから。"
};

/* ── 設問 ──────────────────────────────────────────── */
var Q = {
 genre: {key:"genre", type:"many", max:3, q:"どの分野に心が動きますか",
   h:"気になるものを3つまで。深く考えず、目に留まったものでかまいません。",
   opts:function(){ return DB.genres.map(function(g, i){ return {v:g, b:g, c:hue(i), s:GENREDESC[g]}; }); }},
 reach: {key:"reach", type:"one", q:"どこまで届けたいですか", h:"あとから変えられます。いまの気分で。",
   opts:function(){ return [
     {v:"自分のまち", b:"まず、自分のまちで", s:"目の届く範囲から始める。顔の見える人に効く"},
     {v:"日本じゅうに", b:"日本じゅうに広げたい", s:"うまくいったら他の地域にも渡せる形をねらう"}
   ]; }},
 wd:    {key:"wd", type:"one", q:"ウェルスダイナミクスのプロファイルは",
   h:"インサイドクラスで診断します。まだの人は「まだ分からない」で先に進めます。",
   opts:function(){ return DB.wd.map(function(w){ return {v:w,b:w,s:WDROLE[w].role}; })
     .concat([{v:"unknown",b:"まだ分からない",s:"勇誠義礼だけで、あなたの入り方を出します"}]); }},
 yn1:   {key:"yn1", type:"one", q:"人の話を聞いていて、いちばん引っかかるのはどれですか",
   h:"勇誠義礼の思考特性を見ます。正解はありません。反射的に選んでください。",
   opts:function(){ return YN_ORDER.map(function(k){ return {v:k,b:YN[k].head,s:YN[k].desc,c:YN_HUE[k]}; }); }},
 yn2:   {key:"yn2", type:"one", q:"どんなときに、大切にされていると感じますか",
   h:"同じタイプ分けを、別の角度から確かめます。",
   opts:function(){ return YN_ORDER.map(function(k){ return {v:k,b:YN[k].love,c:YN_HUE[k]}; }); }}
};

var STEP_SETS = {
  full:  [Q.genre, Q.reach, Q.wd, Q.yn1, Q.yn2],
  short: [Q.genre, Q.reach, Q.yn1]
};

var GENREDESC = {
  "子どもと学び":"学校の外でも、子どもが伸びる場をつくる",
  "水辺と生きもの":"川・湖・海と、そこに棲むものを戻す",
  "里山・森・畑":"手が入らなくなった土地に、もう一度手を入れる",
  "記録して残す":"その人しか知らないことを、消える前に残す",
  "まちと空き家":"使われていない場所を、使われる状態に戻す",
  "地域の稼ぎをつくる":"地域の外に出ていくお金を、中で回す",
  "ごみを資源に戻す":"捨てているものを、もう一度使える形にする",
  "仕組みをつくる":"人に頼りきりの作業を、続く形に変える",
  "年を重ねても動ける":"年齢を理由に、外に出られなくならないようにする",
  "だれも外れない":"事情があっても、輪の中にいられるようにする",
  "いざというときに備える":"そのときに動ける状態を、いまつくっておく"
};

/* ── 色 ────────────────────────────────────────────
   分野ごとに固有の色。選んだ分野の色が、そのままおすすめカードの上辺に出る。
   分野を増やしたら style.css に --h11 / --h11v を足す。無ければ既定色に落ちる。 */
function hue(i){
  return i >= 0
    ? "--c:var(--h" + i + ",var(--accent));--cv:var(--h" + i + "v,var(--accent))"
    : "--c:var(--accent);--cv:var(--accent)";
}
function genreHue(name){ return hue(DB.genres.indexOf(name)); }

var YN_HUE = {
  "勇":"--c:var(--yu);--cv:var(--h0v)",
  "誠":"--c:var(--sei);--cv:var(--h1v)",
  "義":"--c:var(--gi);--cv:var(--h9v)",
  "礼":"--c:var(--rei);--cv:var(--h7v)"
};

var SCALE_ORDER = {S:0, M:1, L:2};

/* ── 状態（メモリのみ） ────────────────────────────── */
var A, step, STEPS, TOTAL, DB = null, lastResult = null, started = false;
var SESSION = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function reset() {
  A = {genre:[], reach:null, wd:null, yn1:null, yn2:null, name:""};
  step = 0;
  lastResult = null;
}
reset();
STEPS = STEP_SETS[CFG.questionSet] || STEP_SETS.full;
TOTAL = STEPS.length;

var app = document.getElementById("app");
var bar = document.getElementById("bar");

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];
  });
}
function top(){ window.scrollTo(0, 0); }
function progress(){ bar.style.width = (step / TOTAL * 100) + "%"; }

/* ── データ読み込み ───────────────────────────────── */
function boot(){
  if (EMBEDDED) { DB = ready(EMBEDDED); render(); return; }
  fetch(CFG.dataUrl, {cache:"no-cache"})
    .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(json){ DB = ready(json); render(); })
    .catch(function(err){ failed(err); });
}
function ready(json){
  /* ウェルスダイナミクスの8種はコード側のマスタから（データに持たせない） */
  json.wd = Object.keys(WDROLE);
  return json;
}

function failed(err){
  var isFile = location.protocol === "file:";
  app.innerHTML =
  '<div class="oops">' +
    '<h2>データを読み込めませんでした</h2>' +
    (isFile
      ? '<p>いま <code>file://</code> でこのファイルを直接開いています。この開き方では' +
        'ブラウザの決まり（CORS）で <code>data/cases.json</code> を読めません。</p>' +
        '<p>手元で確認するだけなら <code>dist/TEAM2030_プロジェクト診断_offline.html</code>（データ埋め込み版）を開いてください。' +
        'こちらのファイルは、公開した状態では問題なく動きます。</p>'
      : '<p><code>' + esc(CFG.dataUrl) + '</code> が見つからないか、JSONとして読めませんでした。' +
        'ファイルを差し替えた直後なら、書式が壊れていないか確認してください。</p>') +
    '<p class="note">' + esc(String((err && err.message) || err)) + '</p>' +
  '</div>';
}

/* ── 設問画面 ─────────────────────────────────────── */
function render(){
  progress();
  if (step >= STEPS.length) return results();
  var S = STEPS[step];

  var cur = A[S.key];
  var sel = function(v){ return S.type === "many" ? cur.indexOf(v) >= 0 : cur === v; };
  var opts = S.opts();
  var full = S.type === "many" && cur.length >= S.max;

  app.innerHTML =
  '<div class="step">' +
    '<p class="stepno">' + (step + 1) + ' / ' + TOTAL + '</p>' +
    '<h2>' + esc(S.q) + '</h2>' +
    '<p class="hint">' + esc(S.h || "") + '</p>' +
    '<div class="opts ' + (opts.length > 5 ? "two" : "") + '">' +
      opts.map(function(o){
        var on = sel(o.v);
        return '<button type="button" class="opt ' + (o.c ? "hue " : "") +
          (on ? "on" : (full ? "off" : "")) + '"' +
          (o.c ? ' style="' + o.c + '"' : '') +
          ' aria-pressed="' + (on ? "true" : "false") + '" data-v="' + esc(o.v) + '">' +
          '<b>' + esc(o.b) + '</b>' + (o.s ? '<span>' + esc(o.s) + '</span>' : '') + '</button>';
      }).join("") +
    '</div>' +
    '<div class="nav">' +
      (step > 0 ? '<button type="button" class="back" id="back">ひとつ戻る</button>' : '') +
      (S.type === "many"
        ? '<button type="button" class="go" id="go"' + (canGo(S) ? "" : " disabled") + '>次へ</button>' +
          '<span class="count">' + cur.length + ' / ' + S.max + ' 選択中</span>'
        : '') +
    '</div>' +
  '</div>';

  Array.prototype.forEach.call(app.querySelectorAll(".opt"), function(b){
    b.onclick = function(){
      var v = b.getAttribute("data-v");
      markStarted();
      if (S.type === "many") {
        var i = A[S.key].indexOf(v);
        if (i >= 0) A[S.key].splice(i, 1);
        else if (A[S.key].length < S.max) A[S.key].push(v);
        render();
      } else {
        /* 単一選択はタップした瞬間に次へ進む（確定ボタンなし） */
        A[S.key] = v; step++; render(); top();
      }
    };
  });
  var g = document.getElementById("go");
  if (g) g.onclick = function(){ step++; render(); top(); };
  var bk = document.getElementById("back");
  if (bk) bk.onclick = function(){ step--; render(); top(); };
}
function canGo(S){ return S.type === "many" ? A[S.key].length > 0 : !!A[S.key]; }

/* ── 並べ方 ───────────────────────────────────────
   分野が合うか（×40）と、届け先が合うか（+15）だけで点を出す。
   同点のときは「小さく始められる順」。入会2週目の人に、いきなり
   十数人や許認可が要るものを一番上に出さないため。
   性格（ウェルスダイナミクス・勇誠義礼）は順位に使わない。
   89件に性格タグを機械で振ると当てずっぽうになるので、
   性格は「あなたの入り方」を書くほうにだけ使っている。 ── */
function score(it){
  var s = 0, why = [];
  if (A.genre.indexOf(it.genre) >= 0) { s += 40; why.push(it.genre); }
  if (A.reach && it.reach === A.reach) { s += 15; why.push(it.reach + "に効く"); }
  return {s:s, why:why};
}

function pick(n){
  var all = DB.items.map(function(it){ var r = score(it); r.it = it; return r; })
    .filter(function(r){ return r.s > 0; })
    .sort(function(a, b){
      if (b.s !== a.s) return b.s - a.s;
      var sa = SCALE_ORDER[a.it.scale], sb = SCALE_ORDER[b.it.scale];
      if (sa !== sb) return sa - sb;
      return a.it.id < b.it.id ? -1 : 1;
    });

  /* 選んだ分野を1つずつ拾ってから、残りを埋める。
     3つ選んだのに1つの分野で5件埋まる、を避ける */
  var out = [], seen = {};
  A.genre.forEach(function(g){
    for (var i = 0; i < all.length; i++) {
      if (!seen[all[i].it.id] && all[i].it.genre === g) { out.push(all[i]); seen[all[i].it.id] = 1; break; }
    }
  });
  for (var i = 0; i < all.length && out.length < n; i++) {
    if (!seen[all[i].it.id]) { out.push(all[i]); seen[all[i].it.id] = 1; }
  }
  return {list: out.slice(0, n), rest: all.filter(function(r){ return !seen[r.it.id]; })};
}

function ynType(){ return A.yn1 || null; }

/* ── 結果画面 ─────────────────────────────────────── */
function results(){
  progress();
  var got = pick(5);
  var ranked = got.list;

  /* もう少し大きくなったらできること（十数人か許認可が要るもの） */
  var big = got.rest.filter(function(r){ return r.it.scale === "L"; }).slice(0, 2);

  /* もう動いている場所（実在事例）。選んだ分野に合うものだけ */
  var reals = (DB.reals || []).filter(function(x){
    return x.genre.some(function(g){ return A.genre.indexOf(g) >= 0; });
  }).slice(0, 2);

  var t = ynType();
  var y = t ? YN[t] : null;
  var wdKey = (A.wd && A.wd !== "unknown") ? A.wd : null;
  var wd = wdKey ? WDROLE[wdKey] : null;
  var combo = t ? (wdKey ? COMBO[t][wdKey] : COMBO_SOLO[t]) : null;

  lastResult = {ranked:ranked, big:big, reals:reals, yn:t, wd:wd, wdKey:wdKey, combo:combo};

  app.innerHTML =
  '<div class="res">' +
    '<p class="lede">' + esc(A.genre.join("・")) + 'で、今週から始められることです。</p>' +
    '<p class="recap">' +
      A.genre.map(esc).join(' ・ ') +
      (A.reach ? '／<b>' + esc(A.reach) + '</b>' : '') +
      (wdKey ? '／<b>' + esc(wdKey) + '</b>' : '') +
      (t ? '／<b>' + esc(t) + 'タイプ</b>' : '') +
    '</p>' +

    /* いちばん上に「あなたの入り方」。何をやるかより、どう入るか */
    (combo ?
    '<section class="block me" style="' + (YN_HUE[t] || "") + '">' +
      '<h4>あなたの入り方</h4>' +
      '<p class="mesub">' +
        (wdKey ? esc(wdKey) + 'の' + esc(wd.role.split("。")[0]) + ' × ' : '') +
        esc(t) + 'タイプ' + (wdKey ? '' : '（ウェルスダイナミクスは未診断）') +
      '</p>' +
      '<p class="melead">' + esc(combo) + '</p>' +
      (wd ?
        '<div class="pair"><b>人に渡していいこと</b><br>' +
          '組むなら ' + wd.catalyst.map(esc).join(" か ") + '。' + esc(wd.why) + '</div>' : '') +
      (y ? '<div class="pair"><b>バディに伝えておくこと</b><br>' + esc(y.buddy) + '</div>' : '') +
    '</section>' : '') +

    actCard("head") +

    '<h4 class="sec">あなたに向いているプロジェクト</h4>' +
    '<p class="hint">上から順に、小さく始められるものです。</p>' +
    ranked.map(function(r, i){ return card(r, i); }).join("") +

    (reals.length ?
      '<h4 class="sec">もう動いている場所</h4>' +
      '<p class="hint">同じ分野で、実際に続いている活動です。ゼロから立ち上げなくても、' +
      'すでにある場に入れてもらうという入り方があります。まず見に行く、連絡してみる、で十分です。</p>' +
      reals.map(function(x){ return realCard(x); }).join("")
      : '') +

    (big.length ?
      '<h4 class="sec">人が集まったら、これも</h4>' +
      '<p class="hint">十数人か、許認可が要るもの。いまは無理でも、行き先として置いておいてください。</p>' +
      big.map(function(r, i){ return card(r, i, true); }).join("")
      : '') +

    (y ?
    '<section class="block yn" style="' + (YN_HUE[t] || "") + '">' +
      '<h4>' + esc(t) + 'タイプ：' + esc(y.head) + '</h4>' +
      '<p>' + esc(y.desc) + '</p>' +
      '<div class="pair"><b>プロジェクトの進め方</b><br>' + esc(y.proj) + '</div>' +
      '<div class="pair"><b>大切にされていると感じるのは</b><br>' + esc(y.love) + '<br>' +
        '<span class="dim">この愛のかたちは' + esc(y.ai) + '</span></div>' +
      (A.yn2 && A.yn1 !== A.yn2 ?
        '<p class="note">' +
        '2つの質問で判定が割れました（注目点は' + esc(A.yn1) + '、愛を感じるポイントは' + esc(A.yn2) + '）。' +
        '会話なしでは決めきれないタイプ分けなので、' +
        esc(A.yn1) + 'と' + esc(A.yn2) + 'の両方の説明を読んで、近い方を自分で選んでください。' +
        'ここでは' + esc(A.yn1) + 'として結果を出しています。</p>' : '') +
    '</section>' : '') +

    (wd ?
    '<section class="block wd">' +
      '<h4>ひとりでやらない</h4>' +
      '<p>' + esc(wdKey) + 'のチームでの持ち場は「' + esc(wd.role) + '」。ここから外れる作業は、はじめから人に渡した方が早く進みます。</p>' +
      '<div class="pair"><b>バディに向くのは ' + wd.catalyst.map(esc).join(" か ") + '</b><br>' + esc(wd.why) + '</div>' +
      '<div class="pair"><b>チームの外に置いておきたいのは ' + esc(wd.support) + '</b><br>' +
        '頼れる相手を先に1人決めてから動き出すと、止まりにくくなります。</div>' +
    '</section>' : '') +

    actCard("tail") +

    '<div class="restart"><button type="button" class="go" id="again">選び直す</button></div>' +
  '</div>';

  wireAct();
  document.getElementById("again").onclick = function(){ reset(); render(); top(); };
  logEvent("result");
}

/* ── カード ───────────────────────────────────────── */
function card(r, i, isBig){
  var it = r.it;
  return '<article class="' + ((i === 0 && !isBig) ? "top" : "") + '"' +
    ' style="' + genreHue(it.genre) + '">' +
    '<p class="rank">' + esc(it.genre) + '／' + esc(it.scaleLabel) + '</p>' +
    '<h3>' + esc(it.title) + '</h3>' +
    '<p class="cause">' + esc(it.cause) + '</p>' +
    '<dl>' +
      '<dt>今週やること</dt><dd class="strong">' + esc(it.step) + '</dd>' +
      (it.land ? '<dt>そのあと</dt><dd>' + esc(it.land) + '</dd>' : '') +
      (it.orgs ? '<dt>行政の入口</dt><dd>' + esc(it.orgs) + '</dd>' : '') +
      (it.numbers ? '<dt>測る数字</dt><dd>' + esc(it.numbers) + '</dd>' : '') +
      (it.ref ? '<dt>元ネタ</dt><dd>' + esc(it.ref) + '</dd>' : '') +
    '</dl>' +
  '</article>';
}

function realCard(x){
  return '<article class="real" style="' + genreHue(x.genre[0]) + '">' +
    '<p class="rank">' + esc(x.genre.join("・")) + '／実際に続いている活動</p>' +
    '<h3>' + esc(x.title) + '</h3>' +
    '<dl>' +
      '<dt>やっていること</dt><dd>' + esc(x.summary) + '</dd>' +
      (x.result ? '<dt>出ている成果</dt><dd>' + esc(x.result) + '</dd>' : '') +
      (x.orgs ? '<dt>関わっている人</dt><dd>' + esc(x.orgs) + '</dd>' : '') +
    '</dl>' +
    (x.url ? '<p class="src">見に行く：<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' +
      esc(host(x.url)) + '</a></p>' : '') +
  '</article>';
}
function host(u){
  try { return new URL(u).hostname; } catch (e) { return u; }
}

/* ── 次の行動へ：コピーカード ───────────────────────── */
function actCard(pos){
  var wantName = CFG.askName && !!CFG.logEndpoint;
  return '<div class="act ' + (pos === "tail" ? "tail" : "") + '">' +
    '<h4>' + (pos === "tail" ? "決めたら、ここから先へ" : "まず、バディに見せる") + '</h4>' +
    '<p>結果を短いテキストにまとめてコピーします。Discordの自己紹介チャンネルに貼るか、バディにそのまま送ってください。' +
      '貼った時点で、今月やることの仮決めは終わりです。</p>' +
    (wantName ?
      '<div class="namefield"><label for="nm-' + pos + '">Discordの表示名（任意・運営の記録用）</label>' +
      '<input type="text" id="nm-' + pos + '" class="nm" autocomplete="off" maxlength="40" value="' + esc(A.name) + '"></div>' : '') +
    '<button type="button" class="go copybtn" data-pos="' + pos + '">結果をコピーする</button>' +
    '<p class="copied" data-msg="' + pos + '" role="status"></p>' +
    '<details class="previewbox"><summary>コピーされる内容を見る</summary>' +
      '<pre class="preview">' + esc(copyText()) + '</pre></details>' +
  '</div>';
}

function copyText(){
  if (!lastResult) return "";
  var L = [];
  L.push("【診断結果】");
  if (A.name) L.push("名前：" + A.name);
  L.push("気になる分野：" + A.genre.join("／"));
  if (A.reach) L.push("届けたい範囲：" + A.reach);
  if (lastResult.wdKey) L.push("ウェルスダイナミクス：" + lastResult.wdKey + "（" + lastResult.wd.role.split("。")[0] + "）");
  if (lastResult.yn) L.push("勇誠義礼：" + lastResult.yn + "タイプ（" + YN[lastResult.yn].loveShort + "）");
  if (lastResult.combo) L.push("わたしの入り方：" + lastResult.combo);
  L.push("気になったプロジェクト：");
  lastResult.ranked.slice(0, 3).forEach(function(r, i){ L.push(" " + (i + 1) + ". " + r.it.title); });
  if (lastResult.ranked[0]) L.push("今週やること：" + lastResult.ranked[0].it.step);
  return L.join("\n");
}

function wireAct(){
  Array.prototype.forEach.call(app.querySelectorAll(".nm"), function(inp){
    inp.oninput = function(){
      A.name = inp.value.trim();
      Array.prototype.forEach.call(app.querySelectorAll(".nm"), function(o){ if (o !== inp) o.value = inp.value; });
      refreshPreviews();
    };
  });
  Array.prototype.forEach.call(app.querySelectorAll(".copybtn"), function(btn){
    btn.onclick = function(){
      var msg = app.querySelector('.copied[data-msg="' + btn.getAttribute("data-pos") + '"]');
      copyToClipboard(copyText(), function(ok){
        btn.textContent = ok ? "コピーしました" : "結果をコピーする";
        btn.className = ok ? "go copybtn done" : "go copybtn";
        msg.textContent = ok
          ? "Discordの自己紹介チャンネルに貼ってください。"
          : "このブラウザではコピーが使えませんでした。下に出した文章を、手で選んでコピーしてください。";
        if (!ok) {
          var box = btn.parentNode.querySelector("details.previewbox");
          if (box) { box.open = true; box.scrollIntoView({block:"nearest"}); }
        } else {
          logEvent("copy");
          setTimeout(function(){
            btn.textContent = "結果をコピーする";
            btn.className = "go copybtn";
          }, 4000);
        }
      });
    };
  });
}

function refreshPreviews(){
  var txt = copyText();
  Array.prototype.forEach.call(app.querySelectorAll("pre.preview"), function(p){ p.textContent = txt; });
}

/* クリップボード。navigator.clipboard は HTTPS でないと使えないので、
   textarea + execCommand のフォールバックを必ず持つ */
function copyToClipboard(text, done){
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ done(legacyCopy(text)); });
  } else {
    done(legacyCopy(text));
  }
}
function legacyCopy(text){
  var pad = document.getElementById("fallbackpad");
  if (!pad) return false;
  var ok = false;
  try {
    pad.removeAttribute("aria-hidden");
    pad.value = text;
    pad.readOnly = false;
    /* iOS Safari は textarea.select() だけでは選択できないことがあるので Range も張る */
    pad.contentEditable = "true";
    pad.focus();
    var range = document.createRange();
    range.selectNodeContents(pad);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    pad.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
    sel.removeAllRanges();
  } catch (e) {
    ok = false;
  }
  try {
    pad.contentEditable = "false";
    pad.readOnly = true;
    pad.setAttribute("aria-hidden", "true");
    pad.blur();
  } catch (e) { /* 後片付けの失敗は無視 */ }
  return !!ok;
}

/* ── 回答の記録。logEndpoint が空なら一切送らない ── */
function markStarted(){
  if (started) return;
  started = true;
  logEvent("start");
}
function logEvent(kind){
  if (!CFG.logEndpoint) return;
  var payload = {
    session: SESSION,
    secret: CFG.logSecret || "",
    event: kind,
    at: new Date().toISOString(),
    set: CFG.questionSet,
    name: A.name || "",
    genre: A.genre, reach: A.reach,
    wd: A.wd, yn1: A.yn1, yn2: A.yn2,
    top: lastResult ? lastResult.ranked.map(function(r){ return r.it.id; }) : [],
    reals: lastResult ? lastResult.reals.map(function(x){ return x.id; }) : []
  };
  try {
    fetch(CFG.logEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify(payload),
      keepalive: true
    })["catch"](function(){ /* 記録に失敗しても診断は止めない */ });
  } catch (e) { /* 同上 */ }
}

/* 並べ方を変えたときの確認用の口（tools/verify-scoring.mjs から使う） */
window.T2030_TEST = {
  score: score,
  pick: pick,
  answers: function(){ return A; },
  setDB: function(d){ DB = ready(d); },
  COMBO: COMBO, WDROLE: WDROLE, YN_ORDER: YN_ORDER
};

boot();

})();
