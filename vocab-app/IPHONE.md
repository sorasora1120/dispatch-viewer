# VisuWord を自分の iPhone に入れる（Windows・無料）

Web版ではなく、**本物の iOS アプリ**（ホーム画面のアイコンから起動、iPhone の振動・音声つき）を入れる方法です。
Mac も Apple の有料登録（年 99 ドル）もいりません。必要なのは **Windows パソコン・iPhone・USB ケーブル・Apple ID** だけです。

> 無料の方法なので **7 日ごとに入れ直し**（ボタン 1 つ）が必要です。学習記録は入れ直しても消えません。
> App Store で売る・ほかの人に配るには、`APPSTORE.md` の有料登録が必要です。

## ① アプリのファイル（VisuWord.ipa）をダウンロード

1. https://github.com/sorasora1120/dispatch-viewer/actions/workflows/ios-check.yml を開く（GitHub にログインした状態で）
2. 一番上の **緑のチェック** がついた行をクリック
3. 下の **Artifacts** にある **VisuWord-ipa** をクリック → zip がダウンロードされる
4. zip を右クリック →「すべて展開」→ 中に `VisuWord.ipa` がある

## ② Windows に準備するもの（最初の 1 回だけ）

1. **iTunes** と **iCloud** を Apple のサイトからインストール
   （Microsoft Store 版ではなく、Apple 公式サイトの「Windows 用」ダウンロード版を推奨）
   - iTunes: https://www.apple.com/jp/itunes/
   - iCloud: https://support.apple.com/ja-jp/103232
2. **Sideloadly** をインストール: https://sideloadly.io/

## ③ iPhone に入れる

1. iPhone を USB で Windows につなぐ（iPhone に「このコンピュータを信頼しますか？」と出たら **信頼**）
2. Sideloadly を開き、`VisuWord.ipa` をウィンドウにドラッグ
3. **Apple account** に自分の Apple ID（メールアドレス）を入れて **Start**
4. パスワード（と 2 ファクタ認証のコード）を聞かれたら入力
5. 「Done」と出たら完了

## ④ iPhone 側で許可する（最初の 1 回だけ）

1. **設定 → 一般 → VPN とデバイス管理** → 自分の Apple ID → **信頼**
2. **設定 → プライバシーとセキュリティ → デベロッパモード** を **オン** → 再起動 → 「オンにする」
   （アプリを開こうとしたときに案内が出る場合もあります）
3. ホーム画面の **VisuWord** をタップ

## 7 日たって開けなくなったら

もう一度 ③ をやるだけです（学習記録はそのまま）。
Sideloadly の **Automatically refresh** をオンにしておくと、パソコンと iPhone が同じ Wi-Fi にあるときに自動で入れ直してくれます。

## うまくいかないとき

- **iPhone が表示されない** → iTunes を Apple 公式版で入れ直す／ケーブルを替える
- **ログインで失敗する** → Apple ID のパスワードを確認。2 ファクタ認証のコードは iPhone に出ます
- **「アプリの上限」と出る** → 無料の Apple ID で入れられるのは同時に 3 個まで。ほかの自作アプリを消す

エラー画面のスクリーンショットを Claude に見せてもらえれば、原因を調べます。
