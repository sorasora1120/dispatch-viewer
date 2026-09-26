# VisuWord を App Store に出す手順

このフォルダには、Mac で開けばそのまま申請作業に入れる iOS プロジェクト（`ios/`）と、申請に必要なアイコン・スクリーンショット・プライバシーポリシーが入っています。

## 1. 用意するもの

- **Apple Developer Program への登録**（年額 99 米ドル。https://developer.apple.com/programs/ ）
- **Mac** と最新の **Xcode**（App Store から無料で入手）
- **Node.js**（https://nodejs.org/ から LTS 版）
- 動作確認用の iPhone（なくてもシミュレーターで確認できます）

## 2. Mac でアプリを動かす

```bash
git clone https://github.com/sorasora1120/dispatch-viewer.git
cd dispatch-viewer
git checkout claude/english-vocab-app-visual-2of5o3
cd vocab-app
npm install
npm run ios        # 単語データからアプリを生成 → iOSプロジェクトへコピー → Xcode が開く
```

Xcode が開いたら:

1. 左の一覧で **App** を選び、**Signing & Capabilities** タブを開く
2. **Team** に自分の Apple Developer アカウントを選ぶ
3. **Bundle Identifier** は `com.sorasora1120.visuword` になっています。別の名前にしたい場合はここと `capacitor.config.json` の `appId` を同じ値に変えてください（公開後は変更できません）
4. 上部でシミュレーター（例: iPhone 16）か実機を選び、▶ ボタンで起動して、レッスン・発音・レベル一覧が動くか確認

単語やアプリを直したときは、`npm run ios` をもう一度実行すれば反映されます。

## 3. App Store Connect でアプリを登録

https://appstoreconnect.apple.com/ →「マイ App」→「＋」→「新規 App」

| 項目 | 入力例 |
|---|---|
| プラットフォーム | iOS |
| 名前 | VisuWord（ほかのアプリと重複していたら「VisuWord 英単語」など） |
| プライマリ言語 | 日本語 |
| バンドル ID | 手順 2 で設定したもの |
| SKU | visuword-001（自由な管理用文字列） |

### 掲載情報（下書き）

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

- **スクリーンショット**: `assets/screenshots/` の 5 枚（1290×2796、6.7インチ用）をそのままアップロードできます。実機と同じフォントで撮り直したい場合は、Xcode のシミュレーター（iPhone 16 Pro Max など）で ⌘S を押すと保存できます。
- **年齢制限**: 質問にすべて「なし」で回答 → 4+
- **価格**: 無料 or 有料を選択（有料・アプリ内課金にする場合は「有料 App 契約」と口座・税務情報の登録が必要）

### App のプライバシー

- 「データを収集していますか？」→ **いいえ（データの収集なし）**
  （学習記録は端末内のみ。任意の写真機能はユーザー自身のキーで端末から Pexels に直接通信するもので、開発者はデータを受け取りません）
- **プライバシーポリシー URL**（必須）: `privacy.html` を公開して、その URL を入力します。
  一番簡単なのは GitHub Pages です: リポジトリの Settings → Pages → Branch を選んで Save → 数分後に `https://sorasora1120.github.io/dispatch-viewer/vocab-app/privacy.html` で公開されます。
  **公開前に `privacy.html` の「お問い合わせ」欄に連絡先を書き込んでください。**

## 4. ビルドをアップロードして審査に出す

1. Xcode 上部の実行先を **Any iOS Device (arm64)** にする
2. メニュー **Product → Archive**
3. 完了したら出てくる画面で **Distribute App → App Store Connect → Upload**
4. 10〜30分ほどで App Store Connect の「TestFlight」にビルドが表示される（TestFlight で自分の iPhone に入れて最終確認できます）
5. アプリのページで「ビルド」にそのビルドを選び、**審査へ提出**

審査は通常 1〜3 日ほどです。

## 5. 審査で指摘されやすい点と対策

- **商標**: 「英検」は公益財団法人 日本英語検定協会の登録商標です。アプリ内では「英検○級 相当」という目安の表記にとどめ、**アプリ名・サブタイトル・キーワードには入れない**でください（上の下書きも入れていません）。「TOEIC」も同様です。
- **内容の正確さ**: 単語の選定・訳・例文・英語の説明は AI が作成したもので、公式データではありません。公開前に英語に詳しい人に一度確認してもらうことをおすすめします。単語データは `src/words/lv1.txt`〜`lv7.txt` に 1 行 1 単語で入っていて、直したら `npm run ios` で反映できます。
- **写真・動画の設定**: 一般の利用者に API キーを取らせる機能は分かりにくいので、気になる場合は次の更新で外すか、アプリ側で用意する方法を検討してください（なくてもアプリは完結して動きます）。

## 6. ファイルの場所

| ファイル | 内容 |
|---|---|
| `src/words/lv1.txt`〜`lv7.txt` | 単語データ（1行1単語） |
| `src/app.html` | アプリ本体 |
| `build.js` | 単語データを検証して `index.html` と `www/index.html` を生成 |
| `ios/` | Xcode プロジェクト |
| `assets/icon.svg`, `assets/icon-1024.png` | アプリアイコン（1024×1024、透過なし） |
| `assets/screenshots/` | App Store 用スクリーンショット |
| `privacy.html` | プライバシーポリシー |

イラスト: [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) © Microsoft Corporation（MIT License）。アプリの設定画面にもクレジットを表示しています。
