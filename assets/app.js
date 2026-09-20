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
   どのプロジェクトを選んでも同じように使える、汎用の手順。
   バディとチームがここで自然に出てくるようにしてある
   （結果のとちゅうで唐突に出てこないように）。 ── */
var STYLE = {
 "勇":{ lead:"計画より先に動く。動いてから直す。",
   steps:[
     "今週やる1つだけ決める。計画は後でいい",
     "決めた1つを、今週のうちに実際にやってしまう",
     "やった結果をバディに話す。相談ではなく報告でいい",
     "うまくいかなかったら、やり方を変えてもう一度やる"
   ],
   stuck:"止まるのは、考えすぎたとき。迷ったら小さいほうを今日やる。" },
 "誠":{ lead:"数字と期限を先に置く。置けば進む。",
   steps:[
     "30日後にどうなっていたいかを、数字で1つ決める",
     "そこから逆算して、今週やることを決める",
     "バディと同じ時間に作業する日を、週に1つ入れる",
     "30日たったら、その数字が動いたかを確かめる"
   ],
   stuck:"止まるのは、ゴールが数字になっていないとき。まず測れる形にする。" },
 "義":{ lead:"なぜやるのかを、先に言葉にする。",
   steps:[
     "なぜやるのかを、1行で書く",
     "その1行をバディとチームに話して、反応を見る",
     "うなずいてくれた人と、今週やることを決める",
     "進んだら、その1行に近づいたかを言葉で確かめる"
   ],
   stuck:"止まるのは、目的があいまいなとき。作業を増やす前に1行を直す。" },
 "礼":{ lead:"誰とやるかを、先に決める。",
   steps:[
     "一緒にやりたい人を、まず1人決める",
     "その人に、やりたい理由を最後まで話す。相手の話も最後まで聞く",
     "2人で、今週やることを決める",
     "やったことをチームに共有して、次にやる人を増やす"
   ],
   stuck:"止まるのは、ひとりで抱えたとき。人の顔が見えないと進まない。" }
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

/* ── 設問 ───────────────────────────────────────── */
var Q = {
 genre: {key:"genre", type:"many", max:3,
   q:"こんなこと、やってみたい？",
   h:"ピンとくるものを選んでください。正解はありません。",
   note:"複数えらべます（3つまで）。1つだけでも先に進めます。",
   opts:function(){ return DB.genres.map(function(g, i){
     /* 見出しは行為のかたち。実際の一歩目を2つ添えて、分野名は小さく出す。
        1つだけだと、その分野にしては外れて見える例が当たることがあるので2つ。 */
     var ex = DB.items.filter(function(it){ return it.genre === g.name && it.step; })
                .slice(0, 2).map(function(it){ return it.step; });
     return {v:g.name, b:g.lead, c:hue(i),
             s:(ex.length ? "たとえば：" + ex.join(" ／ ") : ""), tag:g.name};
   }); }},
 yn:    {key:"yn1", type:"one", q:"あなたの勇誠義礼は",
   h:"診断したタイプを選ぶだけです。",
   opts:function(){ return YN_ORDER.map(function(k){
     return {v:k, b:k + "タイプ", s:YN_HEAD[k], c:YN_HUE[k]};
   }).concat([{v:"unknown", b:"まだ分からない"}]); }},
 wd:    {key:"wd", type:"one", q:"あなたのウェルスダイナミクスは",
   h:"診断したプロファイルを選ぶだけです。",
   opts:function(){ return Object.keys(WDROLE).map(function(w){
     return {v:w, b:w, s:WDROLE[w].role};
   }).concat([{v:"unknown", b:"まだ分からない"}]); }}
};
var STEP_SETS = { full:[Q.genre, Q.yn, Q.wd], short:[Q.genre, Q.yn] };

/* ── 色 ─────────────────────────────────────────── */
function hue(i){
  return i >= 0
    ? "--c:var(--h" + i + ",var(--accent));--cv:var(--h" + i + "v,var(--accent))"
    : "--c:var(--accent);--cv:var(--accent)";
}
function genreHue(name){
  for (var i = 0; i < DB.genres.length; i++) if (DB.genres[i].name === name) return hue(i);
  return hue(-1);
}
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

function reset(){ A = {genre:[], wd:null, yn1:null, name:""}; step = 0; lastResult = null; }
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

/* ── 設問画面 ───────────────────────────────────── */
function render(){
  progress();
  if (step >= STEPS.length) return results();
  var S = STEPS[step];
  var cur = A[S.key];
  var sel = function(v){ return S.type === "many" ? cur.indexOf(v) >= 0 : cur === v; };
  var opts = S.opts();
  var full = S.type === "many" && cur.length >= S.max;

  app.innerHTML =
  '<div class="step' + (S.type === "many" ? " haspad" : "") + '">' +
    '<p class="stepno">' + (step + 1) + ' / ' + TOTAL + '</p>' +
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
        (cur.length ? "次へ" : "1つ以上えらぶ") + '</button>' +
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

function ynType(){ return (A.yn1 && A.yn1 !== "unknown") ? A.yn1 : null; }
function wdKey(){ return (A.wd && A.wd !== "unknown") ? A.wd : null; }

/* ── 結果画面 ───────────────────────────────────── */
function results(){
  progress();
  var got = pick(5);
  var ranked = got.list, lead = ranked[0], rest = ranked.slice(1);
  var big = got.rest.filter(function(r){ return r.it.scale === "L"; }).slice(0, 2);
  var reals = (DB.reals || []).filter(function(x){
    return x.genre.some(function(g){ return A.genre.indexOf(g) >= 0; });
  }).slice(0, 2);

  var t = ynType(), w = wdKey();
  var wd = w ? WDROLE[w] : null;
  var st = t ? STYLE[t] : null;
  var combo = t ? (w ? COMBO[t][w] : st.lead) : null;
  var who = [w, t ? t + "タイプ" : null].filter(Boolean).join(" ／ ");

  lastResult = {ranked:ranked, big:big, reals:reals, yn:t, wdKey:w, wd:wd, combo:combo, style:st};

  app.innerHTML =
  '<div class="res">' +

    '<div class="guide">' +
      '<p class="guidehead">結果は3つに分かれています</p>' +
      '<ol class="guidelist">' +
        '<li><b>やること</b>　今週やる1つと、ほかの候補</li>' +
        '<li><b>進め方</b>　' + (t ? esc(t) + 'タイプの' : '') + 'あなたに合った手順</li>' +
        '<li><b>共有する</b>　バディとチームに送る文をコピーする</li>' +
      '</ol>' +
    '</div>' +

    '<h4 class="sec"><span class="secno">1</span>やること</h4>' +
    (lead ?
    '<article class="lead" style="' + genreHue(lead.it.genre) + '">' +
      '<p class="rank">' + esc(lead.it.genre) + '／' + esc(lead.it.scaleLabel) + '</p>' +
      '<h3>' + esc(lead.it.title) + '</h3>' +
      (lead.it.summary ? '<p class="cause">' + esc(lead.it.summary) + '</p>' : '') +
      (lead.it.cause ? '<p class="forwho">これで助かるのは：' + esc(lead.it.cause) + '</p>' : '') +
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
        (lead.it.ref ? '<dt>元ネタ</dt><dd>' + esc(lead.it.ref) + '</dd>' : '') +
      '</dl>' +
    '</article>' : '<p class="hint">選んだ分野にプロジェクトが見つかりませんでした。</p>') +

    (rest.length ? '<p class="subsec">これでなければ、こちらも</p>' + rest.map(function(r){ return card(r); }).join("") : '') +
    (got.total < 5 ?
      '<p class="note">この分野のプロジェクトはいま' + got.total + '件です。分野をもう1つ選ぶと、もっと出ます。</p>' : '') +

    (reals.length ?
      '<p class="subsec">ゼロから作らず、もう動いている場所に入る手もあります</p>' +
      reals.map(realCard).join("") : '') +

    (big.length ?
      '<p class="subsec">人が集まったら、これも</p>' +
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
      '<h4>' + esc(w) + 'のあなたが、人に渡していいこと</h4>' +
      '<p>あなたの持ち場は<b>' + esc(wd.role) + '</b>。' + esc(wd.hand) +
        'は、はじめから人に渡した方が早く進みます。</p>' +
      '<div class="pair"><b>渡す相手に向くのは ' + wd.catalyst.map(esc).join(" か ") + '</b><br>' +
        'バディを決めるとき、このどちらかの人を選ぶと噛み合います。</div>' +
    '</section>' : '') +

    '<h4 class="sec"><span class="secno">3</span>共有する</h4>' +
    '<p class="hint">ここまで決めたら、あとは人に言うだけです。言った時点で、今月やることの仮決めは終わりです。</p>' +
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
    '<p class="rank">' + esc(it.genre) + '／' + esc(it.scaleLabel) + '</p>' +
    '<h3>' + esc(it.title) + '</h3>' +
    (it.summary ? '<p class="cause">' + esc(it.summary) + '</p>' : '') +
    '<dl>' +
      '<dt>今週やること</dt><dd class="strong">' + esc(it.step) + '</dd>' +
      (it.cause && !it.summary ? '<dt>だれのため</dt><dd>' + esc(it.cause) + '</dd>' : '') +
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

/* ── 共有（バディ用とチーム用の2種類）───────────────── */
function shareCard(){
  var wantName = CFG.askName && !!CFG.logEndpoint;
  return '<div class="act">' +
    (wantName ?
      '<div class="namefield"><label for="nm">あなたの表示名（任意）</label>' +
      '<input type="text" id="nm" class="nm" autocomplete="off" maxlength="40" value="' + esc(A.name) + '"></div>' : '') +
    '<div class="shares">' +
      shareOne("buddy", "バディに送る", "2人で動くための短い連絡。何を頼みたいかまで入っています。") +
      shareOne("team", "チームに貼る", "グループやDiscordに貼る宣言文。一緒にやれる人を呼ぶ形です。") +
    '</div>' +
  '</div>';
}
function shareOne(kind, label, desc){
  return '<div class="share">' +
    '<p class="sharelabel">' + esc(label) + '</p>' +
    '<p class="sharedesc">' + esc(desc) + '</p>' +
    '<button type="button" class="go copybtn" data-kind="' + kind + '">コピーする</button>' +
    '<p class="copied" data-msg="' + kind + '" role="status"></p>' +
    '<details class="previewbox"><summary>文を見る</summary>' +
      '<pre class="preview" data-pre="' + kind + '">' + esc(shareText(kind)) + '</pre></details>' +
  '</div>';
}

function shareText(kind){
  if (!lastResult) return "";
  var lead = lastResult.ranked[0];
  if (!lead) return "";
  var L = [];
  var me = [lastResult.wdKey, lastResult.yn ? lastResult.yn + "タイプ" : null].filter(Boolean).join("／");

  if (kind === "buddy") {
    L.push("【今月やること】" + (A.name ? " " + A.name : ""));
    L.push(lead.it.title);
    L.push("今週やること：" + lead.it.step);
    if (me) L.push("わたしは " + me + "。" + (lastResult.combo || ""));
    if (lastResult.wd) {
      L.push("手伝ってほしいのは：" + lastResult.wd.hand);
      L.push("（" + lastResult.wd.catalyst.join("か") + "の人が合うそうです）");
    }
    L.push("今週どこかで15分、話せますか？");
  } else {
    L.push("【プロジェクト宣言】" + (A.name || ""));
    L.push("やること：" + lead.it.title);
    if (lead.it.cause) L.push("だれのため：" + lead.it.cause);
    L.push("今週やること：" + lead.it.step);
    if (lead.it.result) L.push("30〜90日で：" + lead.it.result);
    if (me) L.push("タイプ：" + me);
    if (lastResult.style) L.push("進め方：" + lastResult.style.steps[0]);
    L.push("気になった分野：" + A.genre.join("／"));
    L.push("同じ分野の人、一緒にやれる人がいたら声をかけてください。");
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
  pick: pick, answers: function(){ return A; }, setDB: function(d){ DB = d; },
  shareText: shareText, setResult: function(r){ lastResult = r; },
  COMBO: COMBO, STYLE: STYLE, WDROLE: WDROLE, YN_ORDER: YN_ORDER
};

boot();

})();
