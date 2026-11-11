# CLAUDE.md（dispatch-viewer）

セッション開始時に必ず `progress.md` を読んでから作業すること。作業の区切りで `progress.md` を更新してコミットする。

## ユーザーについて
- 返事は日本語で、短く。質問は最小限にして手を動かす（迷ったら妥当な方を選び、何を選んだか一言書く）
- 留学中の高校生（18歳未満）。iPad / iPhone で見ている
- 学校のネットワークは github.com / github.io がブロックされる。ページを渡すときは
  `https://rawcdn.githack.com/sorasora1120/dispatch-viewer/<コミットSHA>/index.html` の形（コミット固定）で渡す
  （raw.githack.com は 429 になったので使わない）
- **ビューアは開くと最新版へ自動で移る**（2026-10-09〜。「毎回新しいリンクを開くのがめんどくさい」とのこと）。
  ユーザーは同じリンクを使い続けるので、ビューアを直すたびに新しいリンクを渡さない。直したら push のあと
  affiliate-pipeline の `viewer_version.yml` を手動実行して、スプレッドシートの「設定」タブ B1 に最新SHAを書く
  （収集のたびに worker_match.yml の最後でも書く）。`goToLatestVersion()` は消さないこと

- **Notion Memory に記憶する**（2026-11-09「毎日の話とかこれまでのことノーションに記憶するんだぞ」）。会話を始めたら Notion の memory（fetch id "memory"）を読み、その日の出来事は「毎日の記録」に日付ごとに足す。プロフィール・好み・仕事の状況が変わったら、その memory と About ページを直す

## このリポジトリ
- `index.html`：案件ビューア。Googleスプレッドシート（シート「案件一覧」）を gviz で読んで表示するだけの静的ページ。
  データを作るのは `affiliate-pipeline`（CrowdWorks 収集・マッチング・提案文生成）
- `sales.html`：営業ページ（まず最初に / 返信が来たら / 受注したら / X直募集 / 制作会社 / 月額保守）。チェックリストは localStorage
- `local.html`（日本語）と `local-guide-en.html`（その英語版・友達用）と `local-en.html`（英語・お客さんに見せる1枚）：
  Windsor のサイトがないお店に、友達が見本を見せて売るやり方（料金表・進め方・台本）。お店とのやり取りとお金の受け取りは友達
  （ユーザーのビザのため。詳しくは progress.md）。料金や手順を変えるときは日本語版と英語版の両方を直す
  - 2026-10-26〜 Googleレビューカード（NFC、2枚$39・追加1枚$15・サイトを買ったお店は2枚無料）も売る。サイトより先に売る入口。売り方は local.html と local-guide-en.html の「レビューカード」タブ。
    `pitch.html` はお店で見せるプレゼン（「練習」で台本つき。「緊張しちゃう」とのこと）。2026-11-04 に「これで買うかな？」→ 4枚に作り直し：①そのお店の口コミの数と近くの似たお店の数（行く前に Google マップで見て入れる・ウソの数字は入れない）②かざしてもらう ③$39とタダのQRとの違い ④1週間無料で試す（サイトの話は選んだ時だけ）。2026-11-07 最初の画面で「サイト中心（おすすめ）／レビューカード」を選べるように（「Webサイトを中心にいきたい」）。サイト中心は4枚：①サイトがない（口コミの数と星）②見本を iPad で触ってもらう（種類で cafe/pizza/salon/barber を rawcdn で表示）③$250（ふつう$400）＋レビューカード2枚無料 ④無料の見本を2〜3日で。カードが手元にない時は QR コードでお店の Google ページを開く版。料金を変えたらここも直す。
    レビューと引きかえの割引・満足した人だけに頼む・自分たちで書く、はGoogleのルール違反なので書かない。「お店ページ」（ボタン集だけのページ）は無料のLinktreeと変わらないので売らない
- `shops.html`：Windsor のお店マップ（2026-10-21〜）。自分のサイトがない個人のお店（Overture Maps のオープンデータ）を地図とリストで出す。
  データの作り直しは `python3 tools/windsor_shops.py`（shops.html の /*DATA*/…/*END*/ を書き換える）。印はこの端末の localStorage。
  ユーザーの家や学校の場所は入れない（近い順はその場の位置情報だけで、保存しない）
  - 2026-11-02〜 お店ごとの「📨 メッセージ」：例文（DM・メール）に店名と見本のリンク（種類で cafe/pizza/salon/barber/en）が入り、コピーして Instagram・Facebook・メールを開く。「📨 送った」の印と「まだ送ってない（SNSあり）」の絞り込み。
    `shops.html#send` で開くとそのリストから。ビューアの上に「📨 お店に送る」。名前・学校・メール・住所は「自分の情報」でこの端末にだけ保存（学校名と住所はリポジトリに書かない。ユーザーは学校名を入れる希望）。
    メールには郵便の住所が必要（CASL）なので、住所が空ならDMをすすめる表示
    2026-11-02 SMS のタブも（ユーザーの希望。`sms:番号?&body=` で本文入りでメッセージアプリを開く。STOP の一文入り）。「まだ送ってない」は SNS か電話があるお店。
    2026-11-02 印（📨送った・💬返事あり・⭐など）はスプレッドシート「お店マップ」タブの K列（状態）・L列（更新日時）・M列（メモ）と共有。書くのはビューアと同じ Apps Script（affiliate-pipeline の apps_script_stage_sync.gs の saveShopMark）、読むのは gviz（responseHandler:__shopMarks）。開くとシートの状態が正（初回だけ端末の印をシートへ送る）。Claude は Sheets コネクタでこの列を見て状況をつかむ。「送った」にすると「1週間後にもう一度送る」を Google カレンダーに入れるリンクが出る。メールの返事は Gmail コネクタで Claude が読む（Instagram・Facebook・SMS の返事は読めないので貼ってもらう）
    2026-11-02 Notion にも管理ページ「Sora Web Design（Windsor の営業）」（page 40c7eea5ccc28151afddfd79993437f6、ユーザーの非公開の下書き）と表「お店とのやり取り」（collection://53b94695-9354-4c32-9b71-0d3da029663e：お店・状態・送り方・種類・売るもの・送った日・次にやること・次の日・金額・Googleマップ・電話・メモ）。ページから Notion へは書けないので、Claude がシートの K〜L 列と返事の内容を見て Notion をそろえる（「Notion 更新して」で）
    自分の情報（名前・学校・メール・電話・住所）は `local-sheet-contact`（local.html・local-guide-en.html・pitch.html と共通）に保存して、台本の [Name] と「a student here in Windsor」も自動で埋める
- `call.html`：友達と電話するための英語のリスト（2026-11-10〜「友達と電話したい、英語版ある？」）。shops.html のお店のうち電話番号があるものを英語のカテゴリで並べ、台本・タップで電話・結果ボタン・メモ。⭐Interested／✕Not interested／🌐Has a website はシート（お店マップ K列）に like／skip／site として送る。No answer・Call back とメモは端末だけで、「Copy results for Sora」で貼ってもらう。shops.html のデータを作り直したらこっちも作り直す
- `all.html`：作ったもの一覧（2026-10-22〜、「作ったWEBとかアプリ系全部見せて」）。写真は `all/*.jpg`（スマホの大きさで撮った画面、幅320px）。
  ページを足したら一覧と写真も足す。ポートフォリオのリンクは `SO_SHA` の rawcdn（学校用）と github.io（お客さん用）。実在のお店のプレビューは載せない
- `manual.html`：お店での営業マニュアル（日本語＋英語のセリフ。90秒の流れ・STEP 00〜10・切り返しのカード・やらないこと・今日の記録・12のしくみ）。
  行動経済学のしくみ（返報性・保有効果・損失回避・アンカリング・ゼロリスクなど）は「決めやすくする」ためだけに使い、ウソの期限・残り枠・数字は書かない。
  料金は local.html・local-en.html・sorasora1120.github.io/en.html と同じ。「最初の3店は$250」は3店が埋まったら全部から消す
- `previews/`：お店に見せるページ。`showcase.html`（2026-10-18〜 sorasora1120.github.io/en.html に移る転送ページ。前にお店へ送ったリンクのために残す）、架空のお店の見本4つ `demo-*.html`、
  実在のお店のプレビュー（`balkan-style-bakery.html`、`dar-scarlett.html`＝ドレスのブティック。お店に送るのは sorasora1120.github.io/p/ にコピーした方）。`src/` を直して `python3 previews/gen_demos.py && python3 previews/build.py`（写真は `img/*.json` の data URI）。
  動画 `video/*.mp4` は `tools/record-demos.js` で見本を録画して Actions の ffmpeg で mp4 にした（料金を変えたら showcase.html も直す）
  - `dar-scarlett.html` は 2026-10-19 から黒×金の3D（回るドレスの輪・奥へ歩くコレクション・3Dの扇形のカード・開くベルベットのカーテン・裏返るショップカード）。
    写真は Pexels（ドレス）と Unsplash（小物・店内）でどちらも無料・商用可、カーテンは `previews/velvet.py` で描いた絵。
    3Dの見た目は Chromium（Playwright）で確かめる。Playwright の WebKit（Linux）は `perspective` プロパティが効かず平らに写るが、iPhone の Safari では効く（en.html と同じ作り）
- **ページを重くしない（2026-10-18「めっちゃラグい」）**：data URI の画像を CSS 変数（`--img: url(data…)`）に入れて `var()` で使わない
  （要素のスタイルが変わるたびに数百KBの文字列を読み直して、iPhone でカクつく）。画像は `<img>` か、クラス（`.bg-x{background-image:url(…)}`）で付ける。
  スクロール中は transform と opacity だけを変え、filter・mix-blend-mode・backdrop-filter・border-radius のアニメーション・background-position のアニメーションは使わない。
  位置は読み込み時と resize の時だけ測る
- `x_posts.js`：Xの「今日の投稿」の文面 `X_DAILY`（40案）と、付ける画像 `X_IMAGES`（同じ順番・同じ数、"" は画像なし）。
  2026-10-11に「つまんない・怪しい」、2026-10-12に「痛くね？」「絶対バズらなそう」→「競合の投稿をリサーチして同じようなものを書いて」と言われて書き直した。
  競合（Web制作・デザインの人気アカウント）は、いいね50以上の57件中55件が画像付きで「短い一言＋図解1枚」だったので、29案に図解画像を付けた。
  一言は「わかる」ってなる短いツッコミ、画像で「こうするといい」を見せる。形だけ真似て中身はオリジナル。ハッシュタグ・絵文字・クイズ・質問で終わる・「ソラは」・無料・先着・DM などは使わない。
  お店の名前は出さない。サンプルの中身について書く時は、実際のページを見て確かめる。sales.html・index.html・affiliate-pipeline の x_daily_post.py が読む。
  Xへの自動投稿はしない（投稿画面を文面入りで開くだけ。ポストは本人が押す）
- `x-images/`：投稿に付ける画像。図解は `tools/x-images/ximg.js`（HTMLを Playwright で撮る。使い方はファイルの先頭）で作る。画面はすべてイメージ（架空のお店）
- `tools/print-data/svg2print.py`：SVG（mm）を入稿用のPDF（＋同じ中身の .ai）にする道具（2026-11-01〜）。文字はアウトライン化、色はCMYK（--color で指定）、塗り足し・TrimBox、箔押しの版は --drop で紙の色を消して K100 に。使い方はファイルの先頭。お客さんのデザイン（SVG・フォント）はこの公開リポジトリに入れない。.ai は PDF 互換なので、最初の納品で Illustrator で開けるか確かめてもらう
- `ig.html`：お店に DM する用の Instagram ビジネスアカウントの準備（2026-11-02〜）。名前・自己紹介・アイコン・投稿9枚（`sns/ig/*.jpg`、1080x1350）と投稿の文。画像は `tools/ig-shoot.js`（見本の画面を撮る）→ `tools/ig-posts.js` で作る。料金を変えたら 08-pricing と 09-cards も作り直す。プロフィールに学校名・住所・年齢は書かない
- `rb.html`：Redbubble（プリントオンデマンド）に出す和風デザイン10個の出品ページ（2026-11-08〜、「1円も払いたくない・めんどくさい作業はしない」→ドロップシッピングの代わり）。画像は `rb/*.png`（透明4500x5400）と `rb/preview/*.jpg`、作るのは `tools/rb-designs.js`。Title・Tags・Description をコピーして貼るだけ。アカウントは親の名義
- `mippe/`：学生団体 MIPPE!（Sora は運営メンバー、代表は遠藤光大さん）の公式LPの試作（2026-11-10〜）。中身と写真は MIPPE! の Canva サイト（mippesimulation.my.canva.site）から。運営メンバーの写真・名前とリンク先（応募・Instagram・問い合わせ）は届いたら入れる
- `fiverr.html`：Fiverr 2つ目の出品「Shopify のお店を日本向けに」のコピペ用ページ（2026-11-11〜）。画像は `fiverr/gig2-*.jpg`（`tools/fiverr-gig2.js`、架空のお店）。Fiverr のコネクタは買う側の機能だけ（ライバル調査はできる、出品の編集はできない）
- `works/`：古い制作サンプル。今のポートフォリオは `sorasora1120.github.io`
- `vocab-app/`：別プロジェクト（単語アプリ VisuWord）。触るときは `.github/workflows/ios-*.yml` が動く
- `icon-options/` は `.git/info/exclude` で除外しているローカルのみのファイル

## コードのルール
- **`index.html` は CRLF 改行**。編集後も CRLF のままにする（`file index.html` で確認）
- スプレッドシートは `GVIZ_QUERY` で**使う行と列だけ**読む（全部読むと約8.7MB、絞ると約340KB。2026-10-08）
  - 読む列は A〜H と J〜S（I列の古い下書きとT列の募集文は読まない）。なので `COL` の番号は I列より後ろが1つずつ前にずれている
    （例：S列=応募者数は `COL.applicants=17`）
  - 読む行は「提案済み」「未チェック」「進捗ステージ（R列）が入っている行」だけ
  - 列や使う行を足すときは `GVIZ_QUERY`・`COL`・絞り込み失敗時のフォールバック（`r.slice(0, 8).concat(r.slice(9, 19))`）の3つを直す
- `WORKER_MATCH_CATEGORIES` / `WORKER_MATCH_EXCLUDE_KEYWORDS` は affiliate-pipeline の
  `job_scraper/config.py` と `.github/workflows/*.yml` と同じ内容に揃える。デザインの仕事の判定（`isDesignJob` と `DESIGN_*`）は
  `job_scraper/src/worker_matcher.py` の `design_kind` / `is_design_job` と揃える（2026-10-12〜、チラシ・名刺・ロゴ・バナー・パッケージも拾う。同じ日の夜から取扱説明書・封筒・年賀状・のぼりなどの印刷物も。イラストは「無理かも」とのことで拾わない）。`SOFT_EXCLUDE_KEYWORDS`（題名に「コーディング」
  「LPデザイン」があれば外さない除外語）と `isExcluded` は `job_scraper/src/worker_matcher.py` と揃える
- 利益は手数料込みで計算（手数料 = 予算 − 見積 − マージン）。CrowdWorks の手数料は 10万円以下 20%・10〜20万円 10%・20万円超 5%
- 2026-10-20〜 最初の1件が決まるまでは作るのが Claude（affiliate-pipeline の `config.FIRST_JOB_MODE`）。その行はワーカー提示額が0で、
  ワーカー向けメッセージが「作るのは Claude」で始まる（`isSelfBuild`）。見積は利益から `grossFromNet` で戻して出す

## 守ること（変えない）
- 提案の自動送信・X の DM 自動送信はしない（人間がコピペで送る）
- 応募アカウントは親の名義（CrowdWorks は18歳以上）。sales.html のチェックリストもその前提
- 制作サンプルは「架空の店舗」と明記。ワーカーのサイトは「チームの実績」としてだけ載せる。数字を盛らない

## Git
- 作業ブランチの指定がなければ `main` に直接コミット＆push
- push が 5xx やネットワークエラーで失敗したら 2s→4s→8s→16s で再試行
- コミットメッセージ末尾には、そのセッションで指示される帰属行（`Co-Authored-By:` と `Claude-Session:`）を付ける
- コミット・コード内にモデルIDを書かない
