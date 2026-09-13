/**
 * チーム2030 プロジェクト診断 ／ 回答をスプレッドシートに貯めるための Google Apps Script
 * 引継ぎ資料 §8-③ と 完了条件5（運営が誰がどのタイプで何を選んだか後から見られる）に対応する。
 *
 * 置き方
 *  1. Googleスプレッドシートを新規作成する（名前は何でもよい）
 *  2. 拡張機能 → Apps Script を開き、このファイルの中身を全部貼る
 *  3. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *       次のユーザーとして実行： 自分
 *       アクセスできるユーザー： 全員
 *  4. 出てきた https://script.google.com/macros/s/..../exec を
 *     config.js の logEndpoint に貼る
 *
 * 「アクセスできるユーザー：全員」は、会員以外でもこのURLを叩けるという意味になる。
 * 書き込み専用で、読み出す口は用意していないが、いたずら書き込みは起こりうる。
 * 気になる場合は SECRET を設定して、config.js 側にも同じ値を持たせること。
 */

var SHEET_NAME = '回答';
var SECRET = ''; // 空なら合言葉チェックなし

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (SECRET && d.secret !== SECRET) return ok('ng');

    var sh = sheet();
    sh.appendRow([
      new Date(),
      d.event || '',          // start / result / copy
      d.session || '',
      d.name || '',
      d.set || '',            // full / short
      d.place || '',
      (d.feat || []).join(' / '),
      (d.issue || []).join(' / '),
      d.wd || '',
      d.yn1 || '',
      d.yn2 || '',
      d.time || '',
      d.cost || '',
      (d.top || []).join(' '),
      (d.stretch || []).join(' ')
    ]);
    return ok('ok');
  } catch (err) {
    return ok('err');
  }
}

function doGet() {
  return ok('ok'); // 疎通確認用
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow([
      '受信時刻', 'イベント', 'セッション', '表示名', '設問セット',
      '地域', 'あるもの', '気になること',
      'ウェルスダイナミクス', '勇誠義礼(注目点)', '勇誠義礼(愛)',
      '使える時間', '出せるお金', '提示された上位5件', '届かないもの'
    ]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function ok(msg) {
  return ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 休眠の予兆を拾う（引継ぎ資料 §8-③ の「開いたが結果まで到達していない人」）。
 * start は記録されているのに result が無いセッションを出す。
 * Apps Script のエディタでこの関数を実行すると、ログに出る。
 */
function 未到達のセッション() {
  var rows = sheet().getDataRange().getValues().slice(1);
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
