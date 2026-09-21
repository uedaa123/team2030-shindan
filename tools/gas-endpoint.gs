/**
 * TEAM2030 プロジェクトコンパス
 * 回答をスプレッドシートに貯めて、希望した人には結果をメールで送るスクリプト。
 *
 * 置き方
 *  1. Googleスプレッドシートを新規作成する（名前は何でもよい）
 *  2. 拡張機能 → Apps Script を開き、このファイルの中身を全部貼る
 *  3. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *       次のユーザーとして実行： 自分          ← メール送信に必要
 *       アクセスできるユーザー： 全員
 *  4. 初回だけ、メール送信の許可を求められるので許可する
 *  5. 出てきた https://script.google.com/macros/s/..../exec を
 *     config.js の logEndpoint に貼る
 *
 * 貼るまでは、サイトにメール欄そのものが出ない（送り先がないため）。
 *
 * メールの通数には上限がある（個人のGmailで1日100通、Workspaceで1500通）。
 * 1期20〜40名なら問題にならないが、上限に当たると送信だけが静かに失敗する。
 *
 * 「アクセスできるユーザー：全員」は、URLを知っていれば誰でも叩けるという意味。
 * 書き込み専用で読み出す口は作っていないが、いたずら送信は起こりうる。
 * 気になる場合は SECRET を設定して、config.js の logSecret にも同じ値を入れる。
 */

var SHEET_NAME = '回答';
var SECRET = '';              // 空なら合言葉チェックなし（config.js の logSecret と同じ値にする）
var FROM_NAME = 'TEAM2030';   // メールに表示される差出人の名前

/* 返信先。ここに会社のアドレスを入れておくと、
   送信はGmailからでも「返信」は会社のアドレスに届く。空なら送信アカウント宛て。 */
var REPLY_TO = 'ueda.r@real-japan.jp';

/* 差出人アドレスそのものを変えたいとき用。
   Gmailの 設定 → アカウントとインポート → 「他のメールアドレスを追加」で
   登録・確認ずみのアドレスだけが使える。未登録のまま入れても無視される。
   空なら、ログインしているGmailのアドレスで送られる。 */
var SEND_AS = '';
var MAX_MAIL_PER_DAY = 60;    // 1日に送る上限。いたずらで使い切られないための保険

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (SECRET && d.secret !== SECRET) return ok('ng');

    record_(d);

    /* メール希望のときだけ送る */
    if (d.event === 'mail' && d.email) {
      if (!canSendToday_()) return ok('limit');
      var opt = {
        to: d.email,
        subject: d.subject || '【TEAM2030】プロジェクトコンパスの結果',
        body: d.body || '',
        name: FROM_NAME
      };
      if (REPLY_TO) opt.replyTo = REPLY_TO;
      /* 登録ずみの別アドレスがあるときだけ、差出人を差し替える */
      if (SEND_AS && GmailApp.getAliases().indexOf(SEND_AS) >= 0) opt.from = SEND_AS;
      MailApp.sendEmail(opt);
      countMail_();
    }
    return ok('ok');
  } catch (err) {
    console.error(err);
    return ok('err');
  }
}

function doGet() {
  return ok('ok'); // 疎通確認用。ブラウザでこのURLを開いて ok と出れば生きている
}

/* ── 1日の送信数を数える ──────────────────────────
   このURLは「全員」に開いているので、見つかれば誰でも叩ける。
   上限を切っておけば、いたずらされても被害が1日ぶんで止まる。
   上限に当たったら送らずに limit を返す（記録だけは残る）。 ── */
function todayKey_() {
  return 'mail_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
}
function canSendToday_() {
  var p = PropertiesService.getScriptProperties();
  return Number(p.getProperty(todayKey_()) || 0) < MAX_MAIL_PER_DAY;
}
function countMail_() {
  var p = PropertiesService.getScriptProperties();
  var k = todayKey_();
  p.setProperty(k, String(Number(p.getProperty(k) || 0) + 1));
}

/** 差出人に使えるアドレスの一覧。SEND_AS に入れられるのはここに出たものだけ */
function 使える差出人アドレス() {
  var a = GmailApp.getAliases();
  Logger.log(a.length ? a.join('
') : '別のアドレスは登録されていません（Gmailのアドレスで送られます）');
}

/** 今日いま何通送ったか。エディタで実行するとログに出る */
function 今日の送信数() {
  var n = PropertiesService.getScriptProperties().getProperty(todayKey_()) || 0;
  Logger.log('今日 ' + n + ' 通 / 上限 ' + MAX_MAIL_PER_DAY + ' 通');
}

function record_(d) {
  var sh = sheet_();
  sh.appendRow([
    new Date(),
    d.event || '',          // start / result / copy / mail
    d.session || '',
    d.name || '',
    d.email || '',
    d.set || '',            // full / short
    (d.genre || []).join(' / '),
    d.wd || '',
    d.yn1 || '',
    (d.top || []).join(' ')
  ]);
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow([
      '受信時刻', 'イベント', 'セッション', 'お名前', 'メールアドレス',
      '設問セット', '選んだ分野', 'ウェルスダイナミクス', '勇誠義礼', '提示された候補'
    ]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function ok(msg) {
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 休眠の予兆を拾う。
 * start は記録されているのに result が無いセッションを出す。
 * Apps Script のエディタでこの関数を実行すると、ログに出る。
 */
function 未到達のセッション() {
  var rows = sheet_().getDataRange().getValues().slice(1);
  var started = {}, finished = {};
  rows.forEach(function (r) {
    var ev = r[1], sid = r[2];
    if (ev === 'start') started[sid] = r;
    if (ev === 'result') finished[sid] = true;
  });
  var out = Object.keys(started).filter(function (sid) { return !finished[sid]; })
    .map(function (sid) { return started[sid][0] + '  ' + (started[sid][3] || '(名前なし)'); });
  Logger.log(out.length + ' 件が結果まで到達していません\n' + out.join('\n'));
}

/**
 * 名前とメールアドレスの一覧（重複なし）。
 * バディのペアリングや、あとから連絡するときに使う。
 */
function 名簿() {
  var rows = sheet_().getDataRange().getValues().slice(1);
  var seen = {}, out = [];
  rows.forEach(function (r) {
    var name = r[3], mail = r[4];
    if (!mail || seen[mail]) return;
    seen[mail] = true;
    out.push((name || '(名前なし)') + '  ' + mail);
  });
  Logger.log(out.length + ' 人\n' + out.join('\n'));
}
