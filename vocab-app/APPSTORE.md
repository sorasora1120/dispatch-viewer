# VisuWord を App Store に出す手順（Mac なし・ブラウザだけ）

Mac が必要な作業（ビルド・署名・アップロード）は、GitHub のクラウド上の Mac（GitHub Actions）が代わりにやります。
あなたがやるのは **ブラウザ（Windows・留学先のPC・スマホどれでも）** と **iPhone** での操作だけです。

```
① Apple Developer に登録（iPhone）
② アプリの ID と App Store Connect のアプリ枠を作る（ブラウザ）
③ アップロード用の「鍵」を作る（ブラウザ）
④ 鍵を GitHub に登録する（ブラウザ）
⑤ ボタンを押してアップロード → TestFlight で自分の iPhone で確認
⑥ 説明文・スクショを入れて審査に出す（ブラウザ）
```

---

## ① Apple Developer Program に登録（年額 99 米ドル）

- iPhone に **「Apple Developer」アプリ**（App Store で無料）を入れ、「今すぐ登録」から個人として登録するのが一番簡単です。
- 審査・承認に最大 48 時間ほどかかります。

## ② アプリの ID とアプリ枠を作る

1. https://developer.apple.com/account → **Certificates, IDs & Profiles** → **Identifiers** → **＋**
2. **App IDs** → **App** → Description に `VisuWord`、Bundle ID は **Explicit** で `com.sorasora1120.visuword` と入力 → Register
3. https://appstoreconnect.apple.com → **マイ App** → **＋** → **新規 App**

| 項目 | 入力 |
|---|---|
| プラットフォーム | iOS |
| 名前 | VisuWord（使われていたら「VisuWord 英単語」など） |
| プライマリ言語 | 日本語 |
| バンドル ID | 手順 2 で作った `com.sorasora1120.visuword` |
| SKU | `visuword-001`（自由な管理用文字列） |
| ユーザーアクセス | アクセス制限なし |

## ③ アップロード用の鍵（App Store Connect API キー）を作る

1. App Store Connect → **ユーザとアクセス** → **統合** → **App Store Connect API** → **チームキー** → **＋**
2. 名前 `GitHub Actions`、アクセスは **Admin**（クラウドで署名するのに必要です）→ 生成
3. **API キーをダウンロード**（`AuthKey_XXXXXXXXXX.p8`）。**ダウンロードできるのは 1 回だけ**なので、なくさないでください。
4. 同じ画面の **キー ID** と、上の方にある **Issuer ID** をメモ
5. https://developer.apple.com/account → **メンバーシップの詳細** の **チーム ID**（10 文字）をメモ

## ④ 鍵を GitHub に登録する

https://github.com/sorasora1120/dispatch-viewer/settings/secrets/actions → **New repository secret** を 4 回：

| Name | Secret に入れるもの |
|---|---|
| `APPLE_TEAM_ID` | チーム ID |
| `ASC_KEY_ID` | キー ID |
| `ASC_ISSUER_ID` | Issuer ID |
| `ASC_KEY_P8` | `.p8` ファイルをメモ帳で開き、`-----BEGIN PRIVATE KEY-----` から `-----END PRIVATE KEY-----` まで**全部**コピーして貼り付け |

登録した値は暗号化され、あなた以外は（リポジトリが公開でも）見られません。

## ⑤ アップロードして自分の iPhone で試す

どちらかの方法でアップロードが始まります：

- **A. リリースを作る**（今すぐできる）: https://github.com/sorasora1120/dispatch-viewer/releases/new
  → **Choose a tag** に `ios-v1.0.0` と入力して作成 → **Target** でブランチ `claude/english-vocab-app-visual-2of5o3` を選ぶ → **Publish release**
- **B. ボタンで実行**（このブランチを main にマージした後）: **Actions** タブ → **iOS release (TestFlight)** → **Run workflow**

2 回目以降は、タグ名を `ios-v1.0.1` のように変えれば何度でもアップロードできます。

進み具合は **Actions** タブで見られます（15〜30 分）。緑になったら、10〜30 分後に App Store Connect の **TestFlight** に表示されます。
iPhone に **TestFlight** アプリを入れて、自分をテスターに追加するとインストールできます。

赤（失敗）になったら、そのページの URL を Claude に渡してください。ログを見て直せます。

## ⑥ 審査に出す

App Store Connect のアプリページで：

- **サブタイトル**（30文字以内）: 絵と音で覚える英単語
- **カテゴリ**: 教育
- **キーワード**（100文字以内）: `英単語,単語帳,英語,語彙,CEFR,リスニング,暗記,フラッシュカード,忘却曲線,英英`
- **説明文**:

> 日本語に訳さずに、絵・音・英文で英単語を覚えるアプリです。
>
> ・ボタン1つで「今日のレッスン」。忘れかけた単語と新しい単語を自動で出題
> ・音を聞いて絵を選ぶ／英文の空欄を埋める／英語の説明に合う単語を選ぶ――日本語を使わない3種類の問題
> ・borrow と lend のような紛らわしい単語をわざと並べて出題
> ・忘却曲線から「しっかり・あやうい・忘れかけ」の記憶の状態を表示
> ・日本語の意味は赤シートの下。どうしても必要なときだけタップで確認
> ・基礎（CEFR Pre-A1）から最上級（CEFR C1）まで 7 レベル・1,300 語以上
> ・通信不要。学習記録は端末の中だけに保存され、外部に送信されません

- **スクリーンショット**: `vocab-app/assets/screenshots/` の 5 枚（1290×2796、6.7インチ用）をアップロード
  （GitHub でファイルを開いて「Download raw file」で保存できます）
- **年齢制限**: 質問にすべて「なし」→ 4+
- **App のプライバシー**: 「データを収集していますか？」→ **いいえ**
- **プライバシーポリシー URL**（必須）: このブランチを main にマージすると、GitHub Pages で
  `https://sorasora1120.github.io/dispatch-viewer/vocab-app/privacy.html` として公開されます。
  **公開前に `privacy.html` の「お問い合わせ」欄に連絡先を書いてください。**
- **ビルド**: ⑤ でアップロードしたものを選択 → **審査へ提出**（通常 1〜3 日）

## 注意点

- **商標**: 「英検」は公益財団法人 日本英語検定協会の、「TOEIC」は ETS の登録商標です。アプリ名・サブタイトル・キーワードには入れないでください（上の下書きには入れていません）。
- **内容の正確さ**: 単語の選定・訳・例文・英語の説明は AI が作成したもので、公式データではありません。公開前に英語に詳しい人に見てもらうことをおすすめします。
- **単語を直すとき**: `vocab-app/src/words/lv1.txt`〜`lv7.txt` は GitHub のサイト上で直接編集できます（鉛筆マーク）。保存すると「iOS build check」が自動で動いて、壊れていないか確認されます。

## ファイルの場所

| ファイル | 内容 |
|---|---|
| `src/words/lv1.txt`〜`lv7.txt` | 単語データ（1行1単語） |
| `src/app.html` | アプリ本体 |
| `build.js` | 単語データを検証して `index.html` と `www/index.html` を生成 |
| `ios/` | iOS（Xcode）プロジェクト |
| `../.github/workflows/ios-check.yml` | push のたびにクラウドの Mac で iOS ビルドを確認 |
| `../.github/workflows/ios-release.yml` | 署名して App Store Connect にアップロード |
| `assets/` | アイコン・スクリーンショット |
| `privacy.html` | プライバシーポリシー |

イラスト: [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) © Microsoft Corporation（MIT License）。アプリの設定画面にもクレジットを表示しています。
