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
var SECRET = '';            // 空なら合言葉チェックなし
var FROM_NAME = 'TEAM2030'; // メールの差出人名

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (SECRET && d.secret !== SECRET) return ok('ng');

    record_(d);

    /* メール希望のときだけ送る */
    if (d.event === 'mail' && d.email) {
      MailApp.sendEmail({
        to: d.email,
        subject: d.subject || '【TEAM2030】プロジェクトコンパスの結果',
        body: d.body || '',
        name: FROM_NAME
      });
    }
    return ok('ok');
  } catch (err) {
    console.error(err);
    return ok('err');
  }
}

function doGet() {
  return ok('ok'); // 疎通確認用
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
