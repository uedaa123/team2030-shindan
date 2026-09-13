/* チーム2030 プロジェクト診断 ／ 運営が触る設定はこのファイルだけ
   ここを書き換えても、assets/app.js と data/cases.json は触らなくてよい */
window.T2030_CONFIG = {

  /* 事例データの場所。差し替えるときは data/cases.json を上書きするだけでよい */
  dataUrl: "data/cases.json",

  /* 回答をスプレッドシートに貯めるなら、GASのウェブアプリURLをここに貼る。
     空のままなら送信は一切行わない（ツールは普通に動く）。
     GASの中身は tools/gas-endpoint.gs にある。 */
  logEndpoint: "",

  /* GAS側で SECRET を設定したときだけ、同じ文字列をここにも入れる */
  logSecret: "",

  /* 質問の本数。"full" = 7問（2週目の仮プロジェクト決め用）
                  "short" = 3問（キックオフでその場で触らせる用）
     URLに ?q=3 を付けると、この設定にかかわらず3問版になる。
     ※どちらを使うかは運営未確定（引継ぎ資料 §8-⑤） */
  questionSet: "full",

  /* 結果画面に「Discordの表示名」欄を出すか。logEndpoint が空なら自動的に出ない */
  askName: true
};
