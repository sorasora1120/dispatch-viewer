# CLAUDE.md（dispatch-viewer）

セッション開始時に必ず `progress.md` を読んでから作業すること。作業の区切りで `progress.md` を更新してコミットする。

## ユーザーについて
- 返事は日本語で、短く。質問は最小限にして手を動かす（迷ったら妥当な方を選び、何を選んだか一言書く）
- 留学中の高校生（18歳未満）。iPad / iPhone で見ている
- 学校のネットワークは github.com / github.io がブロックされる。ページを渡すときは
  `https://rawcdn.githack.com/sorasora1120/dispatch-viewer/<コミットSHA>/index.html` の形（コミット固定）で渡す
  （raw.githack.com は 429 になったので使わない）

## このリポジトリ
- `index.html`：案件ビューア。Googleスプレッドシート（シート「案件一覧」）を gviz で読んで表示するだけの静的ページ。
  データを作るのは `affiliate-pipeline`（CrowdWorks 収集・マッチング・提案文生成）
- `sales.html`：営業ページ（まず最初に / X直募集 / 制作会社 / 月額保守）。チェックリストは localStorage
- `works/`：古い制作サンプル。今のポートフォリオは `sorasora1120.github.io`
- `vocab-app/`：別プロジェクト（単語アプリ VisuWord）。触るときは `.github/workflows/ios-*.yml` が動く
- `icon-options/` は `.git/info/exclude` で除外しているローカルのみのファイル

## コードのルール
- **`index.html` は CRLF 改行**。編集後も CRLF のままにする（`file index.html` で確認）
- スプレッドシートの列は `COL`（例：S列=応募者数 `COL.applicants=18`、T列=募集文）。列を足すときは affiliate-pipeline 側と揃える
- `WORKER_MATCH_CATEGORIES` / `WORKER_MATCH_EXCLUDE_KEYWORDS` は affiliate-pipeline の
  `job_scraper/config.py` と `.github/workflows/*.yml` と同じ内容に揃える
- 利益は手数料込みで計算（手数料 = 予算 − 見積 − マージン）。CrowdWorks の手数料は 10万円以下 20%・10〜20万円 10%・20万円超 5%

## 守ること（変えない）
- 提案の自動送信・X の DM 自動送信はしない（人間がコピペで送る）
- 応募アカウントは親の名義（CrowdWorks は18歳以上）。sales.html のチェックリストもその前提
- 制作サンプルは「架空の店舗」と明記。ワーカーのサイトは「チームの実績」としてだけ載せる。数字を盛らない

## Git
- 作業ブランチの指定がなければ `main` に直接コミット＆push
- push が 5xx やネットワークエラーで失敗したら 2s→4s→8s→16s で再試行
- コミットメッセージ末尾には、そのセッションで指示される帰属行（`Co-Authored-By:` と `Claude-Session:`）を付ける
- コミット・コード内にモデルIDを書かない
