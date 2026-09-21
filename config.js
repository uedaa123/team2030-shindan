/* チーム2030 プロジェクト診断 ／ 運営が触る設定はこのファイルだけ
   ここを書き換えても、assets/app.js と data/cases.json は触らなくてよい */
window.T2030_CONFIG = {

  /* 事例データの場所。差し替えるときは data/cases.json を上書きするだけでよい */
  dataUrl: "data/cases.json",

  /* GASのウェブアプリURLをここに貼ると、次の2つができるようになる。
       ・回答をスプレッドシートに貯める
       ・結果を本人にメールで送る（結果画面に「メールで受け取る」欄が出る）
     空のままなら送信は一切行わず、メール欄も出ない（ツールは普通に動く）。
     GASの中身と置き方は tools/gas-endpoint.gs にある。 */
  logEndpoint: "https://script.google.com/macros/s/AKfycbzzJWRbjHgVWjg3CZrkDuAD9a_Ew0hSx1FCT3jFNHk6pHhRZijBRsmyDrnxWL-5JHqD/exec",

  /* GAS側で SECRET を設定したときだけ、同じ文字列をここにも入れる */
  logSecret: "",

  /* 質問の本数。"full" = 7問（2週目の仮プロジェクト決め用）
                  "short" = 3問（キックオフでその場で触らせる用）
     URLに ?q=3 を付けると、この設定にかかわらず3問版になる。
     ※どちらを使うかは運営未確定（引継ぎ資料 §8-⑤） */
  questionSet: "full",

  /* 結果画面に「メールで受け取る」欄（お名前・メールアドレス）を出すか。
     logEndpoint が空なら送り先がないので、設定にかかわらず出ない。 */
  askName: true
};
