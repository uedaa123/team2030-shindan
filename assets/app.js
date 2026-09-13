/* チーム2030 プロジェクト診断
   素のHTML/CSS/JS。ビルド不要、外部CDNなし、localStorage/sessionStorage 不使用。
   状態はすべてメモリ上の A オブジェクトで持つ（引継ぎ資料 §9）。 */
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

/* URLの ?q=3 で3問版に切り替え（引継ぎ資料 §8-⑤。既定は7問） */
try {
  var qp = new URLSearchParams(location.search);
  if (qp.get("q") === "3") CFG.questionSet = "short";
  if (qp.get("q") === "7") CFG.questionSet = "full";
} catch (e) { /* URLSearchParams が無い環境では既定のまま */ }

/* 埋め込み版（オフライン配布用）はこの変数にデータが入っている */
var EMBEDDED = window.T2030_DATA || null;

/* ── 固定マスタ①：勇誠義礼（行動コミュニケーション学の思考特性4タイプ）
   出典 https://note.com/kanada0627/n/n6c3fbceb3427
   勇＝左脳イン/右脳アウト、誠＝左左、義＝右右、礼＝右脳イン/左脳アウト
   ※定義文は言い換えない（引継ぎ資料 §6-1） ───────────── */
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
   proj:"数字と期限を先に置くこと。measurableな目標がないと力が出ない。仕組みづくりが持ち場。",
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

/* ── 固定マスタ②：ウェルスダイナミクス（協会発行レポート p.50-51, p.60）
   ※この表はバディのペアリングにそのまま使う（引継ぎ資料 §6-2） ── */
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

var COSTS = ["3万円まで","30万円まで","30万円以上"];
var TIMES = ["月2〜4時間","月8時間くらい","月20時間以上"];

var PLACEDESC = {
 "中山間・農山漁村":"山あい、農村、漁村。集落単位で暮らしが回っている",
 "小さな町・村":"歩いて用が足りる規模。顔が見える範囲",
 "地方都市の市街地":"駅前や商店街がある。中核市・小都市",
 "大都市・都市圏":"政令市やその周辺。人は多いがつながりは薄い",
 "沿岸・離島":"海沿い、島。水辺が生活のそばにある"
};

/* ── 色 ────────────────────────────────────────────
   「気になっていること」は1項目ずつ固有の色を持つ。選んだ課題の色が、
   そのまま結果画面の事例カードの上辺に出る（assets/style.css の --h0〜--h9）。
   issues が増えたときは style.css に --h10 を足せばよく、無ければ既定色に落ちる。 */
/* --c は文字にも使う濃いほう、--cv は面を塗る鮮やかなほう */
function hue(i){
  return i >= 0
    ? "--c:var(--h" + i + ",var(--accent));--cv:var(--h" + i + "v,var(--accent))"
    : "--c:var(--accent);--cv:var(--accent)";
}
function issueHue(name){ return hue(DB.issues.indexOf(name)); }

var YN_HUE = {
  "勇":"--c:var(--yu);--cv:var(--h0v)",
  "誠":"--c:var(--sei);--cv:var(--h1v)",
  "義":"--c:var(--gi);--cv:var(--h9v)",
  "礼":"--c:var(--rei);--cv:var(--h7v)"
};

/* ── 設問 ──────────────────────────────────────────── */
var Q = {
 place: {key:"place", type:"one", q:"住んでいるのは、どんなところですか", h:"いちばん近いものを1つ。",
   opts:function(){ return DB.places.map(function(p){ return {v:p,b:p,s:PLACEDESC[p]}; }); }},
 feat:  {key:"feat", type:"many", max:3, q:"その土地には、何がありますか", h:"あるものを3つまで。無理に埋めなくて構いません。",
   opts:function(){ return DB.feats.map(function(f){ return {v:f,b:f}; }); }},
 issue: {key:"issue", type:"many", max:3, q:"気になっていることは何ですか", h:"解決したいことでも、ただ気になることでも。3つまで。",
   opts:function(){ return DB.issues.map(function(f, i){ return {v:f,b:f,c:hue(i)}; }); }},
 wd:    {key:"wd", type:"one", q:"ウェルスダイナミクスのプロファイルは", h:"8/6のインサイドクラスで診断します。まだの人は「まだ分からない」で先に進めます。",
   opts:function(){ return DB.wd.map(function(w){ return {v:w,b:w,s:WDROLE[w].role}; })
     .concat([{v:"unknown",b:"まだ分からない",s:"この項目は結果に使いません"}]); }},
 yn1:   {key:"yn1", type:"one", q:"人の話を聞いていて、いちばん引っかかるのはどれですか",
   h:"勇誠義礼の思考特性を見ます。正解はありません。反射的に選んでください。",
   opts:function(){ return YN_ORDER.map(function(k){ return {v:k,b:YN[k].head,s:YN[k].desc}; }); }},
 yn2:   {key:"yn2", type:"one", q:"どんなときに、大切にされていると感じますか",
   h:"同じタイプ分けを、別の角度から確かめます。",
   opts:function(){ return YN_ORDER.map(function(k){ return {v:k,b:YN[k].love}; }); }},
 money: {key:"money", type:"money", q:"最初に出せるものを教えてください", h:"多い少ないで結果は変わりません。無理のない範囲が出るだけです。"}
};

var STEP_SETS = {
  full:  [Q.place, Q.feat, Q.issue, Q.wd, Q.yn1, Q.yn2, Q.money],
  short: [Q.place, Q.issue, Q.money]
};
var STEPS = STEP_SETS[CFG.questionSet] || STEP_SETS.full;
var TOTAL = STEPS.length;

/* ── 状態（メモリのみ） ────────────────────────────── */
var A, step, DB = null, lastResult = null, started = false;
var SESSION = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function reset() {
  A = {place:null, feat:[], issue:[], wd:null, yn1:null, yn2:null, cost:null, time:null, name:""};
  step = 0;
  lastResult = null;
}
reset();

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
  if (EMBEDDED) { DB = EMBEDDED; render(); return; }
  fetch(CFG.dataUrl, {cache:"no-cache"})
    .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(json){ DB = json; render(); })
    .catch(function(err){ failed(err); });
}

function failed(err){
  var isFile = location.protocol === "file:";
  app.innerHTML =
  '<div class="oops">' +
    '<h2>事例データを読み込めませんでした</h2>' +
    (isFile
      ? '<p>いま <code>file://</code> でこのファイルを直接開いています。この開き方では' +
        'ブラウザの決まり（CORS）で <code>data/cases.json</code> を読めません。</p>' +
        '<p>手元で確認するだけなら <code>dist/TEAM2030_プロジェクト診断_offline.html</code>（データ埋め込み版）を開いてください。' +
        'こちらのファイルは、Netlify などに置いた状態では問題なく動きます。</p>'
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
  if (S.type === "money") return money(S);

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
      '<button type="button" class="go" id="go"' + (ready(S) ? "" : " disabled") + '>次へ</button>' +
      (S.type === "many" ? '<span class="count">' + cur.length + ' / ' + S.max + ' 選択中</span>' : '') +
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
        /* 単一選択はタップした瞬間に次へ進む（確定ボタンなし。§3） */
        A[S.key] = v; step++; render(); top();
      }
    };
  });
  var g = document.getElementById("go");
  if (g) g.onclick = function(){ step++; render(); top(); };
  var bk = document.getElementById("back");
  if (bk) bk.onclick = function(){ step--; render(); top(); };
}
function ready(S){ return S.type === "many" ? A[S.key].length > 0 : !!A[S.key]; }

function money(S){
  app.innerHTML =
  '<div class="step">' +
    '<p class="stepno">' + (step + 1) + ' / ' + TOTAL + '</p>' +
    '<h2>' + esc(S.q) + '</h2>' +
    '<p class="hint">' + esc(S.h) + '</p>' +
    '<p class="sublabel">ひと月に使える時間</p>' +
    '<div class="opts">' + TIMES.map(function(t){
      return '<button type="button" class="opt t ' + (A.time === t ? "on" : "") + '"' +
        ' aria-pressed="' + (A.time === t ? "true" : "false") + '" data-v="' + esc(t) + '"><b>' + esc(t) + '</b></button>';
    }).join("") + '</div>' +
    '<p class="sublabel">最初に出せるお金</p>' +
    '<div class="opts">' + COSTS.map(function(c){
      return '<button type="button" class="opt c ' + (A.cost === c ? "on" : "") + '"' +
        ' aria-pressed="' + (A.cost === c ? "true" : "false") + '" data-v="' + esc(c) + '"><b>' + esc(c) + '</b></button>';
    }).join("") + '</div>' +
    '<div class="nav">' +
      '<button type="button" class="back" id="back">ひとつ戻る</button>' +
      '<button type="button" class="go" id="go"' + (A.time && A.cost ? "" : " disabled") + '>事例を見る</button>' +
    '</div>' +
  '</div>';

  Array.prototype.forEach.call(app.querySelectorAll(".opt.t"), function(b){
    b.onclick = function(){ markStarted(); A.time = b.getAttribute("data-v"); money(S); };
  });
  Array.prototype.forEach.call(app.querySelectorAll(".opt.c"), function(b){
    b.onclick = function(){ markStarted(); A.cost = b.getAttribute("data-v"); money(S); };
  });
  document.getElementById("back").onclick = function(){ step--; render(); top(); };
  var g = document.getElementById("go");
  if (A.time && A.cost) g.onclick = function(){ step++; render(); top(); };
}

/* ── スコアリング（引継ぎ資料 §5）
   配点を変えたら node tools/verify-scoring.mjs を必ず流すこと ── */
function ynType(){ return A.yn1 || null; }

function score(it){
  var s = 0, why = [];
  var t = ynType();
  var ih = it.issue.filter(function(x){ return A.issue.indexOf(x) >= 0; });
  if (ih.length) { s += ih.length * 30; why.push("「" + ih[0] + "」に効く"); }
  var fh = it.feat.filter(function(x){ return A.feat.indexOf(x) >= 0; });
  if (fh.length) { s += fh.length * 12; why.push(fh[0] + "土地の事例"); }
  if (it.place.indexOf(A.place) >= 0 || it.place.indexOf("どこでも") >= 0) { s += 15; why.push("同じ規模の地域"); }
  if (A.wd && A.wd !== "unknown" && it.wd.indexOf(A.wd) >= 0) { s += 18; why.push(A.wd + "が主役になれる"); }
  /* 3問版では勇誠義礼を聞かないので、この項は加点も減点もしない */
  if (t) {
    if (it.yn && it.yn.indexOf(t) >= 0) { s += 22; why.push(t + "タイプの進め方に合う"); }
    else { s -= 8; }
  }
  var co = COSTS.indexOf(it.cost) - COSTS.indexOf(A.cost);
  var to = TIMES.indexOf(it.time) - TIMES.indexOf(A.time);
  var raw = s;
  if (co > 0) s -= co * 14;
  if (to > 0) s -= to * 10;
  return {s:s, raw:raw, why:why, over: co > 0 || to > 0};
}

/* ── 結果画面 ─────────────────────────────────────── */
function results(){
  progress();
  var all = DB.items.map(function(it){
    var r = score(it); r.it = it; return r;
  });
  var ranked  = all.filter(function(r){ return !r.over; }).sort(function(a,b){ return b.s - a.s; }).slice(0, 5);
  var stretch = all.filter(function(r){ return r.over; }).sort(function(a,b){ return b.raw - a.raw; }).slice(0, 2);
  var max = Math.max(ranked[0] ? ranked[0].s : 1, 1);
  var t = ynType();
  var y = t ? YN[t] : null;
  var wd = (A.wd && A.wd !== "unknown") ? WDROLE[A.wd] : null;

  lastResult = {ranked:ranked, stretch:stretch, yn:t, wd:wd};

  var recap =
    '<b>' + esc(A.place) + '</b>' +
    (A.feat.length ? '／あるもの <b>' + A.feat.map(esc).join("・") + '</b>' : '') +
    '／気になること <b>' + A.issue.map(esc).join("・") + '</b>' +
    (wd ? '／<b>' + esc(A.wd) + '</b>' : '') +
    (t ? '／<b>' + esc(t) + 'タイプ</b>' : '') +
    '／' + esc(A.time) + '・' + esc(A.cost);

  app.innerHTML =
  '<div class="res">' +
    '<p class="lede">この条件に近いところで、実際に動いている事例です。</p>' +
    '<p class="recap">' + recap + '</p>' +

    actCard("head") +

    ranked.map(function(r, i){ return card(r, i, max, false); }).join("") +

    /* 予算・時間を最大にすると超過する事例が無くなる。その時は枠ごと出さない。
       それ以外では必ず残す（§7-3。消すと成長の行き先が消える） */
    (stretch.length ?
      '<h4 class="sec">いまは少し届かないもの</h4>' +
      '<p class="hint">条件そのものは合っています。予算か時間が増えたときに、もう一度見てください。</p>' +
      stretch.map(function(r, i){ return card(r, i, Math.max(r.raw, max), true); }).join("")
      : '') +

    (wd ?
    '<section class="block wd">' +
      '<h4>ひとりでやらない</h4>' +
      '<p>' + esc(A.wd) + 'のチームでの持ち場は「' + esc(wd.role) + '」。ここから外れる作業は、はじめから人に渡した方が早く進みます。</p>' +
      '<div class="pair"><b>バディに向くのは ' + wd.catalyst.map(esc).join(" か ") + '</b><br>' + esc(wd.why) + '</div>' +
      '<div class="pair"><b>チームの外に置いておきたいのは ' + esc(wd.support) + '</b><br>' +
        '頼れる相手を先に1人決めてから動き出すと、止まりにくくなります。</div>' +
    '</section>' : '') +

    (y ?
    '<section class="block yn" style="' + (YN_HUE[t] || "--c:var(--accent);--cv:var(--accent)") + '">' +
      '<h4>' + esc(t) + 'タイプ：' + esc(y.head) + '</h4>' +
      '<p>' + esc(y.desc) + '</p>' +
      '<div class="pair"><b>プロジェクトの進め方</b><br>' + esc(y.proj) + '</div>' +
      '<div class="pair"><b>大切にされていると感じるのは</b><br>' + esc(y.love) + '<br>' +
        '<span style="font-size:12.5px;opacity:.8">この愛のかたちは' + esc(y.ai) + '</span></div>' +
      '<div class="pair"><b>バディに伝えておくこと</b><br>' + esc(y.buddy) + '</div>' +
      (A.yn2 && A.yn1 !== A.yn2 ?
        '<p class="note">' +
        '2つの質問で判定が割れました（注目点は' + esc(A.yn1) + '、愛を感じるポイントは' + esc(A.yn2) + '）。' +
        '腕組み・手組みだけでも会話なしでも決めきれないタイプ分けなので、' +
        esc(A.yn1) + 'と' + esc(A.yn2) + 'の両方の説明を読んで、近い方を自分で選んでください。' +
        'ここでは' + esc(A.yn1) + 'として結果を出しています。</p>' : '') +
    '</section>' : '') +

    '<section class="block money" style="--c:var(--h6);--cv:var(--h6v)">' +
      '<h4>始める前に、お金の見通しを立てる</h4>' +
      '<p>' + esc(A.cost) + '・' + esc(A.time) + 'で始める前提です。ここが埋まらないうちに人を集めると、途中で止まります。</p>' +
      '<ul class="check">' +
        '<li>初回にかかる実費を書き出した（材料・場所代・保険・交通費）</li>' +
        '<li>2年目以降の原資を決めた（売上／会費／協賛／行政の支援／持ち出し）</li>' +
        '<li>持ち出しなら、いくらまでなら続けられるか上限を決めた</li>' +
        '<li>行政の窓口に一度電話した（制度の有無と、担当課の名前を確認）</li>' +
        '<li>お金を扱うなら、記録の担当を自分以外に決めた</li>' +
      '</ul>' +
      '<p class="note">補助金は年度単位で募集が動きます。今年度に間に合わなくても、来年度の募集に合わせて準備すれば十分です。まず担当課の名前を控えるところまでで、今週は終わりで構いません。</p>' +
    '</section>' +

    actCard("tail") +

    '<div class="restart"><button type="button" class="go" id="again">条件を変えてやり直す</button></div>' +
  '</div>';

  wireAct();
  document.getElementById("again").onclick = function(){ reset(); render(); top(); };
  logEvent("result");
}

/* ── 次の行動へ：コピーカード（§8-①。このツールで最優先の機能） ── */
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
  L.push("地域：" + A.place + (A.feat.length ? "／" + A.feat.join("・") : ""));
  L.push("気になること：" + A.issue.join("／"));
  if (lastResult.wd) L.push("ウェルスダイナミクス：" + A.wd + "（" + lastResult.wd.role.split("。")[0] + "）");
  if (lastResult.yn) L.push("勇誠義礼：" + lastResult.yn + "タイプ（" + YN[lastResult.yn].loveShort + "）");
  L.push("気になった事例：");
  lastResult.ranked.slice(0, 3).forEach(function(r, i){ L.push(" " + (i + 1) + ". " + r.it.title); });
  if (lastResult.ranked[0]) L.push("最初の一歩：" + lastResult.ranked[0].it.step);
  L.push("使える時間・お金：" + A.time + "／" + A.cost);
  return L.join("\n");
}

function wireAct(){
  Array.prototype.forEach.call(app.querySelectorAll(".nm"), function(inp){
    inp.oninput = function(){
      A.name = inp.value.trim();
      /* もう一方のカードの入力欄とプレビューを合わせる（画面は作り直さない） */
      Array.prototype.forEach.call(app.querySelectorAll(".nm"), function(o){ if (o !== inp) o.value = inp.value; });
      refreshPreviews();
    };
  });
  Array.prototype.forEach.call(app.querySelectorAll(".copybtn"), function(btn){
    btn.onclick = function(){
      var msg = app.querySelector('.copied[data-msg="' + btn.getAttribute("data-pos") + '"]');
      copyToClipboard(copyText(), function(ok){
        btn.textContent = ok ? "コピーしました" : "結果をコピーする";
        if (ok) { btn.className = "go copybtn done"; } else { btn.className = "go copybtn"; }
        msg.textContent = ok
          ? "Discordの自己紹介チャンネルに貼ってください。"
          : "このブラウザではコピーが使えませんでした。下に出した文章を、手で選んでコピーしてください。";
        if (!ok) {
          /* 自動コピーができないときは、手で選べるように本文を開いておく */
          var box = btn.parentNode.querySelector("details.previewbox");
          if (box) { box.open = true; box.scrollIntoView({block:"nearest"}); }
        }
        if (ok) {
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
   textarea + execCommand のフォールバックを必ず持つ（§8-①） */
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
    /* iOS Safari は textarea.select() だけでは選択できないことがあるので、
       Range を作って選択し直す */
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

/* ── 回答の記録（§8-③）。logEndpoint が空なら一切送らない ── */
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
    place: A.place, feat: A.feat, issue: A.issue,
    wd: A.wd, yn1: A.yn1, yn2: A.yn2, time: A.time, cost: A.cost,
    top: lastResult ? lastResult.ranked.map(function(r){ return r.it.id; }) : [],
    stretch: lastResult ? lastResult.stretch.map(function(r){ return r.it.id; }) : []
  };
  try {
    fetch(CFG.logEndpoint, {
      method: "POST",
      mode: "no-cors",
      /* text/plain にすると preflight が飛ばず、GAS 側でそのまま受け取れる */
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify(payload),
      keepalive: true
    })["catch"](function(){ /* 記録に失敗しても診断は止めない */ });
  } catch (e) { /* 同上 */ }
}

/* ── 事例カード ───────────────────────────────────── */
function card(r, i, max, isStretch){
  var it = r.it;
  var pct = Math.max(12, Math.round((isStretch ? r.raw : r.s) / max * 100));
  /* カードの色は、その事例が「自分の選んだ課題」のどれに効くかで決まる。
     どれにも当たらなければ、その事例の代表的な課題の色 */
  var lead = it.issue.filter(function(x){ return A.issue.indexOf(x) >= 0; })[0] || it.issue[0];
  var tag = function(list, selected){
    return list.map(function(x){
      return '<span class="tag ' + (selected.indexOf(x) >= 0 ? "hit" : "") + '">' + esc(x) + '</span>';
    }).join("");
  };
  return '<article class="' + ((i === 0 && !isStretch) ? "top" : "") + '"' +
    ' style="' + issueHue(lead) + '">' +
    '<p class="rank">' + (isStretch ? "条件は合う" : (i + 1) + "番目に近い") +
      (it.src === "事例集" ? "／実在事例" : "／企画のかたち") + '</p>' +
    '<h3>' + esc(it.title) +
      (r.over ? '<span class="over">' + esc(it.cost) + '・' + esc(it.time) + 'が必要</span>' : '') + '</h3>' +
    '<div class="fit"><i><i style="width:' + pct + '%"></i></i><em>適合度 ' + pct + '</em></div>' +
    '<p class="why">' + r.why.map(function(w){ return '<s>' + esc(w) + '</s>'; }).join(" ／ ") + '</p>' +
    '<dl>' +
      '<dt>何をする</dt><dd>' + esc(it.summary) + '</dd>' +
      '<dt>最初の一歩</dt><dd>' + esc(it.step) + '</dd>' +
      (it.apply ? '<dt>' + (it.src === "事例集" ? "応用の勘所" : "育て方") + '</dt><dd>' + esc(it.apply) + '</dd>' : '') +
      (it.result ? '<dt>' + (it.src === "事例集" ? "確認できた成果" : "測る数字") + '</dt><dd>' + esc(it.result) + '</dd>' : '') +
      (it.orgs ? '<dt>' + (it.src === "事例集" ? "関わる人" : "行政の入口") + '</dt><dd>' + esc(it.orgs) + '</dd>' : '') +
      '<dt>目安</dt><dd>' + esc(it.cost) + '・' + esc(it.time) + (it.term ? '・' + esc(it.term) : '') + '</dd>' +
    '</dl>' +
    '<p class="tags">' + tag(it.issue, A.issue) + tag(it.feat, A.feat) + '</p>' +
    (it.url ? '<p class="src">出典：<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
      esc(host(it.url)) + '</a></p>' : '') +
  '</article>';
}
function host(u){
  try { return new URL(u).hostname; } catch (e) { return u; }
}

/* 配点を変えたときの確認用の口（tools/verify-scoring.mjs から使う）。
   画面の動きには一切影響しない。 */
window.T2030_TEST = {
  score: score,
  answers: function(){ return A; },
  setDB: function(d){ DB = d; },
  COSTS: COSTS, TIMES: TIMES, YN_ORDER: YN_ORDER
};

boot();

})();
