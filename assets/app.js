/* チーム2030 プロジェクト診断
   素のHTML/CSS/JS。ビルド不要、フレームワークなし、localStorage/sessionStorage 不使用。

   設問は3問。やってみたいこと／勇誠義礼／ウェルスダイナミクス。
   ・分野名をそのまま聞くと答えにくい（「政治に興味は？」には答えられない）ので、
     行為のかたちで聞いて、分野名は小さく添えるだけにしている。
   ・勇誠義礼もウェルスも受講ずみなので、判定はせず「選ぶだけ」。説明も出さない。 */
(function () {
"use strict";

var CFG = Object.assign({
  dataUrl: "data/cases.json",
  logEndpoint: "",
  logSecret: "",
  questionSet: "full",
  askName: true
}, window.T2030_CONFIG || {});

try {
  var qp = new URLSearchParams(location.search);
  if (qp.get("q") === "2") CFG.questionSet = "short";
  if (qp.get("q") === "3") CFG.questionSet = "full";
} catch (e) { /* URLSearchParams が無い環境では既定のまま */ }

var EMBEDDED = window.T2030_DATA || null;

var YN_ORDER = ["勇","誠","義","礼"];
var YN_HEAD = {
  "勇":"考えるより、まず動く",
  "誠":"やるなら、達成できる形にする",
  "義":"なぜやるのかが、いちばん大事",
  "礼":"人と、そこまでの経緯を大切にする"
};

/* ── 進め方：タイプ別の4ステップ ──────────────────────
   「人にどう動いてもらうか」ではなく「自分ひとりで進めるとき、
   どうやると止まらないか」を書いている。どのプロジェクトでも同じように使える。 ── */
var STYLE = {
 "勇":{ lead:"計画より先に手をつける。動いてから直す。",
   steps:[
     "今週やる1つだけ決めて、紙かメモに書く",
     "準備が半分でも、今週のうちに手をつけてしまう",
     "やって分かったことを、1行だけ書き残す",
     "合わなければ、やり方を変えてもう一度やる"
   ],
   stuck:"止まるのは、考えすぎたとき。迷ったら小さいほうを今日やる。" },
 "誠":{ lead:"数字と期限を先に置く。置けば進む。",
   steps:[
     "30日後にどうなっていたいかを、数字で1つ決める",
     "そこから逆算して、今週やることを1つに絞る",
     "作業する時間を、先にカレンダーに入れてしまう",
     "30日たったら、その数字が動いたかを確かめる"
   ],
   stuck:"止まるのは、ゴールが数字になっていないとき。まず測れる形にする。" },
 "義":{ lead:"なぜやるのかを、先に自分の言葉にする。",
   steps:[
     "なぜやるのかを1行で書いて、見えるところに置く",
     "その1行に合わない作業は、今はやらないと決める",
     "残った中から、今週やることを1つ決めて手をつける",
     "進んだら、その1行に近づいたかを自分で確かめる"
   ],
   stuck:"止まるのは、目的があいまいなとき。作業を増やす前に1行を直す。" },
 "礼":{ lead:"誰のためにやるのかを、先にはっきりさせる。",
   steps:[
     "これで助かる人を、具体的に1人思い浮かべる",
     "その人に話すつもりで、やりたい理由を書き出す",
     "今週やることを1つ決める。人と会う予定を1つ入れておくと進む",
     "やったことを書き留めておく。積み重なると次のきっかけになる"
   ],
   stuck:"止まるのは、相手の顔が見えなくなったとき。1人に絞ると戻ってくる。" }
};

/* ── ウェルスダイナミクス：持ち場と、渡す相手 ── */
var WDROLE = {
 "クリエイター":{role:"立ち上げ役", catalyst:["メカニック","ディールメーカー"],
   hand:"仕組みをつくる部分と、お金に換える部分"},
 "スター":{role:"看板役", catalyst:["クリエイター","ディールメーカー"],
   hand:"中身をつくる部分と、お金に換える部分"},
 "サポーター":{role:"チームを率いる役", catalyst:["クリエイター","メカニック"],
   hand:"何をやるかを決める部分と、仕組みにする部分"},
 "ディールメーカー":{role:"つなぐ役", catalyst:["クリエイター","メカニック"],
   hand:"中身をつくる部分と、続く形にする部分"},
 "トレーダー":{role:"売り買いの役", catalyst:["サポーター","メカニック"],
   hand:"人を集める部分と、仕組みを支える部分"},
 "アキュムレーター":{role:"進行管理役", catalyst:["サポーター","メカニック"],
   hand:"外とつなぐ部分と、仕組みを整える部分"},
 "ロード":{role:"分析と裏方の役", catalyst:["サポーター","ディールメーカー"],
   hand:"人を集める部分と、お金と基盤をつなぐ部分"},
 "メカニック":{role:"仕上げ役", catalyst:["クリエイター","ディールメーカー"],
   hand:"新しい中身を足す部分と、お金に換える部分"}
};

/* ── その人が、そのプロジェクトにどう入るか（4×8＝32通り）── */
var COMBO = {
 "勇":{
  "クリエイター":"思いついた形を、今週そのまま試す。相談はやってみたあとでいい。",
  "スター":"先に人前で「やります」と言ってしまう。引き受けてくれる人は、あとから集まる。",
  "サポーター":"計画書を作る前に、手伝ってくれる人を1人つかまえる。動きながら巻き込む。",
  "ディールメーカー":"思いついたらその場で電話する。あなたの一歩目に資料はいらない。",
  "トレーダー":"まず小さく売ってみる。反応を見てから、続けるかを決める。",
  "アキュムレーター":"動きたい気持ちと、確実に仕上げたい性質がぶつかる。今週やる1つだけ決めて、それだけやる。",
  "ロード":"調べる前に一度、現場に行く。数字は行ってから取るほうが速い。",
  "メカニック":"いきなり作り始めていい。直すのは、動くものができてから。"
 },
 "誠":{
  "クリエイター":"思いつきを、先に期限と数字に変換する。「いつまでに何を」が決まると手が動く。",
  "スター":"出る場所と回数を先に決める。行き当たりばったりの露出は消耗する。",
  "サポーター":"計画は人からもらっていい。一歩目は「計画を持っている人」を探すこと。",
  "ディールメーカー":"誰と誰をつなぐと何が起きるかを、先に1枚にする。会う順番を決めてから動く。",
  "トレーダー":"いくらで何個売れば成り立つかを先に出す。数字が立たないうちは売らない。",
  "アキュムレーター":"いちばん強い組み合わせ。期限を切れば、そのとおりに終わらせられる。最初の期限を今週決める。",
  "ロード":"得意がそのまま一歩目になる。ただし分析で止まらないよう、報告する相手を先に決めておく。",
  "メカニック":"すでにある仕組みを1つ選んで、どこが壊れているかを測る。作り直すのはそのあと。"
 },
 "義":{
  "クリエイター":"なぜやるのかを1行書いてから作り始める。その1行が、人を呼ぶ看板になる。",
  "スター":"目的を語る場を先に作る。あなたが語ると人が動く。中身を作る人は後から来る。",
  "サポーター":"目的を掲げて、そこに人を集める。実務は集まった人に渡していい。",
  "ディールメーカー":"「何のためか」を言葉にしてから人に会う。目的がないと、つなぎが空回りする。",
  "トレーダー":"何のために売るのかを決める。値段より先に意味。そこが決まると強い。",
  "アキュムレーター":"目的が腹落ちしないと進行管理に力が入らない。着地点を先に自分の言葉にする。",
  "ロード":"分析の前に、何を証明したいのかを決める。目的のないデータは、集めても使わない。",
  "メカニック":"直す前に「何のために直すのか」を決める。そこがないと、きれいにして終わる。"
 },
 "礼":{
  "クリエイター":"誰と作るかを先に決める。ひとりで作ると途中で止まる。",
  "スター":"あなたの語りは物語になる。まず1人の話を聞いて、その人を主役にして語る。",
  "サポーター":"いちばん自然な組み合わせ。誰を支えるかを1人決めるところから始める。",
  "ディールメーカー":"会って話を聞くところから始めていい。一歩目は、用件のない訪問でかまわない。",
  "トレーダー":"買ってくれる人の顔が見えないと動けない。まず1人に、手渡しで売る。",
  "アキュムレーター":"進行管理は得意だが、人を急かすのが苦手。期限は自分で決めず、みんなで決める。",
  "ロード":"数字の前に、その数字が誰の何を変えるのかを聞いておく。分かると手が速くなる。",
  "メカニック":"直す前に、それを使っている人の話を最後まで聞く。使い手の話が設計図になる。"
 }
};

/* ── 設問（5画面）───────────────────────────────────
   やってみたいことは3段階。いきなり26分野から選ばせると粒度がばらばらで
   選べないので、大きく6つ → 分野 → プロジェクト の順に絞る。
   選択肢に出す「たとえば」は一歩目ではなくプロジェクト名にする
   （一歩目は役所の手続きの話が多く、分野とずれて見えるため）。 ── */
function shortlist(){
  /* 選んだ分野から、実際の候補を作る。分野ごとに1つずつ拾ってから埋める */
  var pool = DB.items.filter(function(it){ return A.genre.indexOf(it.genre) >= 0; })
    .sort(function(x, y){
      var sx = SCALE_ORDER[x.scale], sy = SCALE_ORDER[y.scale];
      if (sx !== sy) return sx - sy;
      if (!!y.orgs !== !!x.orgs) return (y.orgs ? 1 : 0) - (x.orgs ? 1 : 0);
      return x.id < y.id ? -1 : 1;
    });
  var out = [], seen = {};
  /* 分野が1つだけでも8件出るよう、回す数を分野数に合わせる */
  var rounds = Math.max(1, Math.ceil(8 / Math.max(1, A.genre.length)));
  for (var round = 0; round < rounds; round++) {
    A.genre.forEach(function(g){
      for (var i = 0; i < pool.length; i++) {
        if (seen[pool[i].id] || pool[i].genre !== g) continue;
        out.push(pool[i]); seen[pool[i].id] = 1; return;   /* 各分野から1つずつ */
      }
    });
  }
  return out.slice(0, 8);
}

var Q = {
 group: {key:"group", type:"many", max:2,
   label:"どのへん",
   q:"どのへんに、ワクワクする？",
   h:"26分野を、大きく6つに束ねています。",
   note:"2つまで選べます。1つでもOK",
   opts:function(){ return DB.groups.map(function(g, i){
     return {v:g.name, b:g.name, s:g.sub, c:hue(GROUP_HUE[i])};
   }); }},

 genre: {key:"genre", type:"many", max:3,
   label:"もう少し",
   q:"もうちょっと近づけると？",
   h:"さっき選んだ中から出しています。",
   note:"3つまで選べます",
   opts:function(){
     var names = [];
     DB.groups.forEach(function(g){ if (A.group.indexOf(g.name) >= 0) names = names.concat(g.genres); });
     return names.map(function(n){
       var i = genreIndex(n);
       /* たとえばは「プロジェクト名」を2つ。一歩目より、分野の中身が伝わる */
       var ex = DB.items.filter(function(it){ return it.genre === n; })
                  .slice(0, 2).map(function(it){ return it.title; });
       return {v:n, b:n, c:hue(i), s:(ex.length ? ex.join(" ／ ") : "")};
     });
   }},

 project: {key:"project", type:"one",
   label:"これ",
   q:"この中で、いちばんやってみたいのは？",
   h:"ピンときたものを1つ。あとで選び直せます。",
   opts:function(){
     return shortlist().map(function(it){
       return {v:it.id, b:it.title, c:hue(genreIndex(it.genre)),
               s:"今週やること：" + it.step, tag:it.genre};
     }).concat([{v:"auto", b:"どれもピンとこない",
                 s:"いちばん小さく始められるものを、こっちで選びます"}]);
   }},

 yn:    {key:"yn1", type:"one", q:"あなたの勇誠義礼は",
   h:"診断したタイプを選ぶだけです。",
   label:"タイプ",
   opts:function(){ return YN_ORDER.map(function(k){
     return {v:k, b:k + "タイプ", s:YN_HEAD[k], c:YN_HUE[k]};
   }).concat([{v:"unknown", b:"まだ分からない", s:"これでも結果は出ます"}]); }},

 wd:    {key:"wd", type:"one", q:"あなたのウェルスダイナミクスは",
   h:"診断したプロファイルを選ぶだけです。",
   label:"持ち場",
   opts:function(){ return Object.keys(WDROLE).map(function(w){
     return {v:w, b:w, s:WDROLE[w].role};
   }).concat([{v:"unknown", b:"まだ分からない", s:"これでも結果は出ます"}]); }}
};
var STEP_SETS = {
  full:  [Q.group, Q.genre, Q.project, Q.yn, Q.wd],
  short: [Q.group, Q.genre, Q.project, Q.yn]
};

/* 6グループの色は、それぞれの代表になる分野の色を使う */
var GROUP_HUE = [2, 0, 8, 5, 3, 6];

/* ── 色 ─────────────────────────────────────────── */
function hue(i){
  return i >= 0
    ? "--c:var(--h" + i + ",var(--accent));--cv:var(--h" + i + "v,var(--accent))"
    : "--c:var(--accent);--cv:var(--accent)";
}
function genreIndex(name){
  for (var i = 0; i < DB.genres.length; i++) if (DB.genres[i].name === name) return i;
  return -1;
}
function genreHue(name){ return hue(genreIndex(name)); }
var YN_HUE = {
  "勇":"--c:var(--yu);--cv:var(--yuv)",
  "誠":"--c:var(--sei);--cv:var(--seiv)",
  "義":"--c:var(--gi);--cv:var(--giv)",
  "礼":"--c:var(--rei);--cv:var(--reiv)"
};
var SCALE_ORDER = {S:0, M:1, L:2};

/* ── 状態 ───────────────────────────────────────── */
var A, step, STEPS, TOTAL, DB = null, lastResult = null, started = false;
var SESSION = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function reset(){ A = {group:[], genre:[], project:null, wd:null, yn1:null, name:""}; step = 0; lastResult = null; }
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

/* ── 読み込み ───────────────────────────────────── */
function boot(){
  if (EMBEDDED) { DB = EMBEDDED; render(); return; }
  fetch(CFG.dataUrl, {cache:"no-cache"})
    .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(json){ DB = json; render(); })
    .catch(failed);
}
function failed(err){
  var isFile = location.protocol === "file:";
  app.innerHTML = '<div class="oops"><h2>データを読み込めませんでした</h2>' +
    (isFile
      ? '<p>いま <code>file://</code> でこのファイルを直接開いています。この開き方では' +
        'ブラウザの決まり（CORS）で <code>data/cases.json</code> を読めません。' +
        '手元で見るだけなら <code>dist/</code> の埋め込み版を開いてください。</p>'
      : '<p><code>' + esc(CFG.dataUrl) + '</code> が見つからないか、JSONとして読めませんでした。</p>') +
    '<p class="note">' + esc(String((err && err.message) || err)) + '</p></div>';
}

/* 上の帯。いまどこにいて、あと何が残っているかを常に見せる */
function stepper(){
  return '<ol class="stepper">' + STEPS.map(function(S, i){
    var cls = i < step ? "done" : (i === step ? "now" : "");
    return '<li class="' + cls + '"><i>' + (i + 1) + '</i><em>' + esc(S.label || "") + '</em></li>';
  }).join("") + '</ol>';
}

/* ── 設問画面 ───────────────────────────────────── */
/* 上の設問を変えたら、その下の答えは捨てる（選べなくなった分野が残らないように） */
function prune(){
  var names = [];
  DB.groups.forEach(function(g){ if (A.group.indexOf(g.name) >= 0) names = names.concat(g.genres); });
  A.genre = A.genre.filter(function(g){ return names.indexOf(g) >= 0; });
  if (A.project && A.project !== "auto") {
    var ok = shortlist().some(function(it){ return it.id === A.project; });
    if (!ok) A.project = null;
  }
}

function render(){
  progress();
  prune();
  if (step >= STEPS.length) return results();
  var S = STEPS[step];
  var cur = A[S.key];
  var sel = function(v){ return S.type === "many" ? cur.indexOf(v) >= 0 : cur === v; };
  var opts = S.opts();
  var full = S.type === "many" && cur.length >= S.max;

  app.innerHTML =
  stepper() +
  '<div class="step' + (S.type === "many" ? " haspad" : "") + '">' +
    '<h2>' + esc(S.q) + '</h2>' +
    '<p class="hint">' + esc(S.h || "") + '</p>' +
    (S.note ? '<p class="multi">' + esc(S.note) + '</p>' : '') +
    '<div class="opts">' +
      opts.map(function(o){
        var on = sel(o.v);
        return '<button type="button" class="opt ' + (o.c ? "hue " : "") +
          (on ? "on" : (full ? "off" : "")) + '"' +
          (o.c ? ' style="' + o.c + '"' : '') +
          ' aria-pressed="' + (on ? "true" : "false") + '" data-v="' + esc(o.v) + '">' +
          '<b>' + esc(o.b) + '</b>' +
          (o.s ? '<span>' + esc(o.s) + '</span>' : '') +
          (o.tag ? '<em class="gtag">' + esc(o.tag) + '</em>' : '') +
          '</button>';
      }).join("") +
    '</div>' +
    (step > 0 ? '<div class="nav"><button type="button" class="back" id="back">ひとつ戻る</button></div>' : '') +
  '</div>' +
  (S.type === "many"
    ? '<div class="bottombar"><div class="bottominner">' +
        '<span class="count">' + cur.length + ' / ' + S.max + ' 選択中</span>' +
        '<button type="button" class="go" id="go"' + (cur.length ? "" : " disabled") + '>' +
        (cur.length ? "次へ" : "まず1つえらんでね") + '</button>' +
      '</div></div>'
    : '');

  Array.prototype.forEach.call(app.querySelectorAll(".opt"), function(b){
    b.onclick = function(){
      var v = b.getAttribute("data-v");
      markStarted();
      if (S.type === "many") {
        var i = A[S.key].indexOf(v);
        if (i >= 0) A[S.key].splice(i, 1);
        else if (A[S.key].length < S.max) A[S.key].push(v);
        var y = window.scrollY;
        render();
        window.scrollTo(0, y);
      } else { A[S.key] = v; step++; render(); top(); }
    };
  });
  var g = document.getElementById("go");
  if (g) g.onclick = function(){ step++; render(); top(); };
  var bk = document.getElementById("back");
  if (bk) bk.onclick = function(){ step--; render(); top(); };
}

/* ── 並べ方 ─────────────────────────────────────
   選んだ分野に入っているかどうかだけ。同じなら「小さく始められる順」。
   性格は順位に使わない（289件に性格タグを機械で振ると当てずっぽうになる）。
   性格は「入り方」と「進め方」を書くほうにだけ使う。 ── */
function pick(n){
  var all = DB.items.filter(function(it){ return A.genre.indexOf(it.genre) >= 0; })
    .map(function(it){ return {it:it}; })
    .sort(function(a, b){
      var sa = SCALE_ORDER[a.it.scale], sb = SCALE_ORDER[b.it.scale];
      if (sa !== sb) return sa - sb;
      /* 行政の入口が書いてあるものを少し前に（次の一手がはっきりするので） */
      if (!!b.it.orgs !== !!a.it.orgs) return (b.it.orgs ? 1 : 0) - (a.it.orgs ? 1 : 0);
      return a.it.id < b.it.id ? -1 : 1;
    });

  /* 選んだ分野を1つずつ拾ってから残りを埋める（1分野で全部埋まらないように） */
  var out = [], seen = {};
  A.genre.forEach(function(g){
    for (var i = 0; i < all.length; i++) {
      if (!seen[all[i].it.id] && all[i].it.genre === g) { out.push(all[i]); seen[all[i].it.id] = 1; break; }
    }
  });
  for (var i = 0; i < all.length && out.length < n; i++) {
    if (!seen[all[i].it.id]) { out.push(all[i]); seen[all[i].it.id] = 1; }
  }
  return {list: out.slice(0, n), rest: all.filter(function(r){ return !seen[r.it.id]; }), total: all.length};
}

/* 発行日と診断No.。同じ人が同じ日にやれば同じ番号になる */
function today(){
  var d = new Date();
  return d.getFullYear() + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + ("0" + d.getDate()).slice(-2);
}
function docNo(){
  var seed = (A.genre.join("") + (A.project || "") + (A.yn1 || "") + (A.wd || ""));
  var n = 0;
  for (var i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return "C-" + n.toString(36).toUpperCase().slice(0, 4);
}

function ynType(){ return (A.yn1 && A.yn1 !== "unknown") ? A.yn1 : null; }
function wdKey(){ return (A.wd && A.wd !== "unknown") ? A.wd : null; }

/* ── 結果画面 ───────────────────────────────────── */
function results(){
  progress();
  var list = shortlist();
  var leadItem = null;
  if (A.project && A.project !== "auto") {
    for (var i = 0; i < list.length; i++) if (list[i].id === A.project) leadItem = list[i];
  }
  if (!leadItem) leadItem = list[0];               /* 「どれもピンとこない」はここに来る */
  /* 以降は {it: …} の形で扱う（カードの描画がこの形を前提にしている） */
  var lead = leadItem ? {it:leadItem} : null;
  var rest = list.filter(function(it){ return it !== leadItem; }).slice(0, 4);
  var ranked = (lead ? [lead] : []).concat(rest.map(function(it){ return {it:it}; }));

  /* 人が集まったらできること（十数人か許認可が要るもの）。候補に出していないものから */
  var shown = {};
  list.forEach(function(it){ shown[it.id] = 1; });
  var big = DB.items.filter(function(it){
    return A.genre.indexOf(it.genre) >= 0 && it.scale === "L" && !shown[it.id];
  }).slice(0, 2).map(function(it){ return {it:it}; });

  var total = DB.items.filter(function(it){ return A.genre.indexOf(it.genre) >= 0; }).length;
  var got = {total: total};

  var t = ynType(), w = wdKey();
  var wd = w ? WDROLE[w] : null;
  var st = t ? STYLE[t] : null;
  var combo = t ? (w ? COMBO[t][w] : st.lead) : null;
  var who = [w, t ? t + "タイプ" : null].filter(Boolean).join(" ／ ");

  lastResult = {ranked:ranked, big:big, yn:t, wdKey:w, wd:wd, combo:combo, style:st};

  app.innerHTML =
  '<div class="res">' +

    /* 結果の頭。何が出ているかを1目で分かるようにする */
    '<div class="doc">' +
      '<p class="docmeta"><span>プロジェクトコンパス</span><span>' + esc(today()) + '</span>' +
        '<span>No. ' + esc(docNo()) + '</span></p>' +
      '<h2 class="docttl">あなたの1枚</h2>' +
      '<p class="docsub">上から読めば、今週やることまで決まります。</p>' +
      '<div class="chips">' +
        A.genre.map(function(g){ return '<span class="chip" style="' + genreHue(g) + '">' + esc(g) + '</span>'; }).join("") +
        (t ? '<span class="chip" style="' + YN_HUE[t] + '">' + esc(t) + 'タイプ</span>' : '') +
        (w ? '<span class="chip plain">' + esc(w) + '</span>' : '') +
      '</div>' +
      '<ol class="guidelist">' +
        '<li><b>やってみるプロジェクト</b>　選んだ1つと、ほかの候補</li>' +
        '<li><b>進め方</b>　' + (t ? esc(t) + 'タイプの' : '') + 'あなたに合った手順</li>' +
        '<li><b>チームやバディに共有する</b>　結果をコピーして貼る</li>' +
      '</ol>' +
    '</div>' +

    '<h4 class="sec"><span class="secno">1</span>やってみるプロジェクト</h4>' +
    (lead ?
    '<article class="lead" style="' + genreHue(lead.it.genre) + '">' +
      '<p class="rank">' +
        '<em class="pick">' + (A.project && A.project !== "auto" ? 'あなたが選んだもの' : 'おすすめ') + '</em>' +
        '<em>' + esc(lead.it.genre) + '</em><em>' + esc(lead.it.scaleLabel) + '</em></p>' +
      '<h3>' + esc(lead.it.title) + '</h3>' +
      (lead.it.summary ? '<p class="cause">' + esc(lead.it.summary) + '</p>' :
       lead.it.why ? '<p class="cause">' + esc(lead.it.why) + '</p>' : '') +
      (lead.it.forwho ? '<p class="forwho">これで助かるのは：' + esc(lead.it.forwho) + '</p>' : '') +
      '<div class="todo"><p class="todolabel">今週やること</p>' +
        '<p class="todobody">' + esc(lead.it.step) + '</p></div>' +
      (combo ?
        '<div class="youdo"><p class="youlabel">' + esc(who) + 'のあなたは、こう入る</p>' +
          '<p class="youbody">' + esc(combo) + '</p></div>'
        : '<div class="youdo"><p class="youlabel">あなたの入り方</p>' +
          '<p class="youbody">勇誠義礼のタイプを選ぶと、ここに「あなたの場合どう入るか」が出ます。</p></div>') +
      '<dl>' +
        (lead.it.result ? '<dt>30〜90日で</dt><dd>' + esc(lead.it.result) + '</dd>' : '') +
        (lead.it.land ? '<dt>そのあと</dt><dd>' + esc(lead.it.land) + '</dd>' : '') +
        (lead.it.orgs ? '<dt>行政の入口</dt><dd>' + esc(lead.it.orgs) + '</dd>' : '') +
        (lead.it.ref ? '<dt>元ネタ</dt><dd>' + refLink(lead.it) + '</dd>' : '') +
      '</dl>' +
    '</article>' : '<p class="hint">選んだ分野にプロジェクトが見つかりませんでした。</p>') +

    (rest.length ? '<p class="subsec">気が変わったら、こっちも</p>' +
      rest.map(function(it){ return card({it:it}); }).join("") : '') +
    (got.total < 5 ?
      '<p class="note">この分野のプロジェクトはいま' + got.total + '件です。分野をもう1つ選ぶと、もっと出ます。</p>' : '') +

    (big.length ?
      '<p class="subsec">仲間が増えたら、これも</p>' +
      big.map(function(r){ return card(r); }).join("") : '') +

    '<h4 class="sec"><span class="secno">2</span>進め方</h4>' +
    (st ?
    '<section class="block yn" style="' + (YN_HUE[t] || "") + '">' +
      '<h4>' + esc(t) + 'タイプの進め方</h4>' +
      '<p class="stlead">' + esc(st.lead) + '</p>' +
      '<ol class="ststeps">' + st.steps.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join("") + '</ol>' +
      '<p class="ststuck">' + esc(st.stuck) + '</p>' +
    '</section>'
    : '<p class="hint">勇誠義礼のタイプを選ぶと、あなたに合った手順が出ます。</p>') +

    (wd ?
    '<section class="block wd">' +
      '<h4>' + esc(w) + 'のあなたが、つまずきやすいところ</h4>' +
      '<p>基本はひとりで進めて大丈夫です。あなたが力を出せるのは<b>' + esc(wd.role) + '</b>。' +
        'ただ、' + esc(wd.hand) + 'は後回しになりやすいところです。' +
        'ここで詰まったら、抱え込まずに人に聞いてください。</p>' +
      '<div class="pair"><b>聞くなら ' + wd.catalyst.map(esc).join(" か ") + '</b><br>' +
        'バディがこのどちらかなら、そのまま相談を。違うタイプなら、' +
        'チームの中にこの2つの人がいないか探すと早いです。</div>' +
    '</section>' : '') +

    '<h4 class="sec"><span class="secno">3</span>チームやバディに共有する</h4>' +
    '<p class="hint">バディやチームに共有しましょう。そして、アドバイスや感想をもらいましょう。</p>' +
    shareCard() +

    '<div class="restart"><button type="button" class="go ghost" id="again">選び直す</button></div>' +
  '</div>';

  wireShare();
  document.getElementById("again").onclick = function(){ reset(); render(); top(); };
  logEvent("result");
}

/* ── カード ─────────────────────────────────────── */
function card(r){
  var it = r.it;
  return '<article style="' + genreHue(it.genre) + '">' +
    '<p class="rank"><em>' + esc(it.genre) + '</em><em>' + esc(it.scaleLabel) + '</em></p>' +
    '<h3>' + esc(it.title) + '</h3>' +
    (it.summary ? '<p class="cause">' + esc(it.summary) + '</p>' :
     it.why ? '<p class="cause">' + esc(it.why) + '</p>' : '') +
    '<dl>' +
      '<dt>今週やること</dt><dd class="strong">' + esc(it.step) + '</dd>' +
      (it.forwho ? '<dt>だれのため</dt><dd>' + esc(it.forwho) + '</dd>' : '') +
      (it.result ? '<dt>30〜90日で</dt><dd>' + esc(it.result) + '</dd>' : '') +
      (it.orgs ? '<dt>行政の入口</dt><dd>' + esc(it.orgs) + '</dd>' : '') +
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
    '</dl>' +
    (x.url ? '<p class="src">見に行く：<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' +
      esc(host(x.url)) + '</a></p>' : '') +
  '</article>';
}
function host(u){ try { return new URL(u).hostname; } catch (e) { return u; } }

/* 元ネタ。URLが分かっているものはリンクにする */
function refLink(it){
  if (!it.refUrl) return esc(it.ref);
  return '<a href="' + esc(it.refUrl) + '" target="_blank" rel="noopener">' + esc(it.ref) + '</a>';
}

/* ── 共有：1本にまとめた「診断結果シェア」──────────────
   バディにもチームにも同じ文を貼れるようにする。
   「話せますか？」のような問いかけは入れない（貼る人が決める）。 ── */
function shareCard(){
  var wantName = CFG.askName && !!CFG.logEndpoint;
  return '<div class="act">' +
    (wantName ?
      '<div class="namefield"><label for="nm">あなたの表示名（任意）</label>' +
      '<input type="text" id="nm" class="nm" autocomplete="off" maxlength="40" value="' + esc(A.name) + '"></div>' : '') +
    '<button type="button" class="go copybtn" data-kind="share">診断結果をコピーする</button>' +
    '<p class="copied" data-msg="share" role="status"></p>' +
    '<details class="previewbox"><summary>コピーされる内容を見る</summary>' +
      '<pre class="preview" data-pre="share">' + esc(shareText("share")) + '</pre></details>' +
  '</div>';
}

function shareText(){
  if (!lastResult) return "";
  var lead = lastResult.ranked[0];
  if (!lead) return "";
  var L = [];
  var me = [lastResult.wdKey, lastResult.yn ? lastResult.yn + "タイプ" : null].filter(Boolean).join("／");

  L.push("【プロジェクト診断の結果】" + (A.name ? " " + A.name : ""));
  L.push("気になった分野：" + A.genre.join("／"));
  if (me) L.push("タイプ：" + me);
  L.push("");
  L.push("やってみるプロジェクト：" + lead.it.title);
  if (lead.it.forwho) L.push("だれのため：" + lead.it.forwho);
  else if (lead.it.why) L.push("何のために：" + lead.it.why);
  L.push("今週やること：" + lead.it.step);
  if (lead.it.result) L.push("30〜90日で：" + lead.it.result);
  if (lastResult.combo) L.push("わたしの入り方：" + lastResult.combo);
  if (lastResult.wd) L.push("つまずきやすいところ：" + lastResult.wd.hand);
  if (lastResult.style) {
    L.push("");
    L.push("進め方（" + lastResult.yn + "タイプ）");
    lastResult.style.steps.forEach(function(x, i){ L.push(" " + (i + 1) + ". " + x); });
  }
  if (lastResult.ranked.length > 1) {
    L.push("");
    L.push("ほかに気になったもの：");
    lastResult.ranked.slice(1, 3).forEach(function(r){ L.push(" ・" + r.it.title); });
  }
  return L.join("\n");
}

function wireShare(){
  var inp = app.querySelector(".nm");
  if (inp) inp.oninput = function(){ A.name = inp.value.trim(); refreshPreviews(); };
  Array.prototype.forEach.call(app.querySelectorAll(".copybtn"), function(btn){
    btn.onclick = function(){
      var kind = btn.getAttribute("data-kind");
      var msg = app.querySelector('.copied[data-msg="' + kind + '"]');
      copyToClipboard(shareText(kind), function(ok){
        btn.textContent = ok ? "コピーしました" : "コピーする";
        btn.className = ok ? "go copybtn done" : "go copybtn";
        msg.textContent = ok ? "そのまま貼れます。"
          : "このブラウザではコピーが使えませんでした。下に出した文を手で選んでください。";
        if (!ok) {
          var box = btn.parentNode.querySelector("details.previewbox");
          if (box) { box.open = true; box.scrollIntoView({block:"nearest"}); }
        } else {
          logEvent("copy-" + kind);
          setTimeout(function(){ btn.textContent = "コピーする"; btn.className = "go copybtn"; }, 4000);
        }
      });
    };
  });
}
function refreshPreviews(){
  Array.prototype.forEach.call(app.querySelectorAll("pre.preview"), function(p){
    p.textContent = shareText(p.getAttribute("data-pre"));
  });
}

function copyToClipboard(text, done){
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ done(legacyCopy(text)); });
  } else { done(legacyCopy(text)); }
}
function legacyCopy(text){
  var pad = document.getElementById("fallbackpad");
  if (!pad) return false;
  var ok = false;
  try {
    pad.removeAttribute("aria-hidden");
    pad.value = text; pad.readOnly = false; pad.contentEditable = "true";
    pad.focus();
    var range = document.createRange();
    range.selectNodeContents(pad);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    pad.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
    sel.removeAllRanges();
  } catch (e) { ok = false; }
  try {
    pad.contentEditable = "false"; pad.readOnly = true;
    pad.setAttribute("aria-hidden", "true"); pad.blur();
  } catch (e) { /* 後片付けの失敗は無視 */ }
  return !!ok;
}

/* ── 記録。logEndpoint が空なら一切送らない ── */
function markStarted(){ if (started) return; started = true; logEvent("start"); }
function logEvent(kind){
  if (!CFG.logEndpoint) return;
  var payload = {
    session: SESSION, secret: CFG.logSecret || "", event: kind,
    at: new Date().toISOString(), set: CFG.questionSet, name: A.name || "",
    genre: A.genre, wd: A.wd, yn1: A.yn1,
    top: lastResult ? lastResult.ranked.map(function(r){ return r.it.id; }) : []
  };
  try {
    fetch(CFG.logEndpoint, {
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify(payload), keepalive: true
    })["catch"](function(){ /* 記録に失敗しても診断は止めない */ });
  } catch (e) { /* 同上 */ }
}

window.T2030_TEST = {
  pick: pick, shortlist: shortlist, answers: function(){ return A; }, setDB: function(d){ DB = d; },
  shareText: shareText, setResult: function(r){ lastResult = r; },
  COMBO: COMBO, STYLE: STYLE, WDROLE: WDROLE, YN_ORDER: YN_ORDER
};

boot();

})();
