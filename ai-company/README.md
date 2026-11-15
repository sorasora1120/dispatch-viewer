# AI COMPANY OS — Phase 1 (Foundation)

Next.js 15 (App Router, TypeScript) + Tailwind v4 + Supabase (Postgres, Auth, RLS). Vercel で公開する前提。設計は `docs/design.md`。

## 実装したもの
- ログイン（メール＋パスワード、Supabase Auth）。未ログインは /login へ。環境変数がないときは /setup で案内
- Dashboard：AI社員数・実行中・完了・承認待ちの数、未完了タスク、AI社員の状態、最近の操作（すべて DB の実データ。架空の数字は出さない）
- AI Employees：9人（CEO / Research / Marketing / Product / Sales / Finance / Creative / Operations / Quality Control）。新規ユーザー作成時に DB のトリガーで自動作成。状態（Idle / Active / Paused / Error）の変更
- Tasks：作成・編集・削除・状態変更（Pending / Assigned / Running / Review / Waiting Approval / Completed / Failed / Cancelled）、担当・プロジェクト・優先度・期限、状態での絞り込み、タスクごとの履歴
- Projects：作成・削除、タスク数
- Approvals：一覧と承認・却下。DB 関数 `decide_approval` だけが状態を変えられる（中身のハッシュ確認・期限切れ・二重承認を DB で拒否）
- Activity Logs：ログイン・ログアウト・タスク/AI社員/プロジェクトの変更・承認・設定変更を記録。追記のみ（更新・削除不可）
- Settings：表示名の変更、接続先の確認、ログアウト
- RLS：全テーブルで本人のデータしか読めない・書けない。他人の AI社員やプロジェクトをタスクに付けることも DB が拒否
- iPhone（下のタブバー）／iPad・PC（左のサイドバー）対応、ダークテーマ
- 秘密情報は環境変数だけ（`.env.example`）。コードに API キーはない

## まだ作っていないもの（未実装）
- AI社員が実際に動くこと（Claude API などの呼び出し）。今は「担当を決めて状態を管理する」まで
- 承認リクエストを作る側（AI が承認を出す仕組み）。今の画面は承認する側だけ。承認後の実行（送信・投稿・購入など）もしない
- 外部サービス連携（Gmail・SNS・Shopify など）、Analytics・売上画面、通知
- 複数人のチーム機能・権限の段階
- 本物の Supabase と Vercel での動作確認（下の「テスト結果」参照）

## テスト結果（2026-11-15）
| テスト | 結果 | 中身 |
|---|---|---|
| `npm run typecheck` | ✅ 通過 | TypeScript の型チェック |
| `npm test`（vitest） | ✅ 7件通過 | 入力チェック・状態の自動変換・期限切れ判定・ハッシュ |
| `tests/db_test.sh` | ✅ 全通過 | ローカルの PostgreSQL 16 ＋ Supabase の auth を真似たスタブで、マイグレーションを実行して RLS を確認：AI社員9人の自動作成、操作ログ、ユーザー間の分離、他人の AI社員の割り当て拒否、owner の偽装拒否、ログの更新・削除拒否、承認の直接更新不可、ハッシュ違い・二重承認・期限切れの拒否、他人の承認を決められない |
| `next build` | ✅ 成功 | 全ページ |
| `tests/e2e.mjs`（Playwright） | ✅ 通過 | テスト用の偽 Supabase サーバー（`tests/mock-supabase.mjs`）に対して：未ログインのリダイレクト、パスワード違いのエラー、ログイン、Dashboard、AI社員9人、タスク作成→Assigned、Running に変更、操作ログ、空タイトルの拒否、iPad と iPhone の画面 |
| 本物の Supabase | ❌ 未確認 | アカウントがまだないため。偽サーバーは本物と細部が違う可能性がある |
| Vercel への公開 | ❌ 未確認 | 同上 |

DB テストの動かし方：`PGHOST=<ソケットのフォルダ> PGPORT=<ポート> bash tests/db_test.sh`

## 公開のしかた
1. **Supabase**（無料プラン）でプロジェクトを作る
2. SQL Editor に `supabase/migrations/0001_init.sql` を貼って実行
3. Authentication → Users → Add user で自分のユーザーを作る（パスワードは8文字以上）
4. Authentication → Sign In / Providers で **新規登録（Allow new users to sign up）をオフ**（ほかの人が勝手に作れないように）
5. Project Settings → API の `Project URL` と `anon public` キーを控える（`service_role` キーは使わない・どこにも貼らない）
6. **Vercel**（無料の Hobby）で GitHub の `dispatch-viewer` を Import、**Root Directory を `ai-company`** にする
7. Environment Variables に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を入れて Deploy
8. 出てきた URL を開いてログイン

注意：Supabase・Vercel は利用規約で年齢の条件がある場合がある。必要なら保護者の名義で作る。

## ローカルで動かす
```
cd ai-company
cp .env.example .env.local   # 値を入れる
npm install
npm run dev
```
