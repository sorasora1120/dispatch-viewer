# AI COMPANY OS — Phase 1 設計

## 目的
将来 AI 社員（Claude Agent SDK）をつなげられる、安定した管理画面の土台を作る。この段階では AI の自動実行はしない。

## 構成（すべて無料プランで動く）
| 役割 | 使うもの | 理由 |
|---|---|---|
| 画面 | Next.js 15（App Router）＋ TypeScript ＋ Tailwind CSS 4 | iPad のブラウザで動く。Vercel に置ける |
| データベース・ログイン | Supabase（PostgreSQL ＋ Auth） | 無料。RLS でデータを人ごとに分けられる |
| 公開 | Vercel（Hobby・無料） | GitHub に push すると自動で公開。PC 不要 |
| コード | GitHub（dispatch-viewer の `ai-company/`） | iPad から Claude Code で直せる |

使わないもの：Redis・Docker・FastAPI（今は不要。必要になったら足す）。

## 画面
Dashboard／AI Employees／Tasks／Projects／Approvals／Activity Logs／Settings、それと Login。
- PC・iPad 横：左にサイドバー。スマホ：下にタブバー。
- ダークモード、細い線と余白で整理。アニメーションは使わない（押したときの色の変化だけ）。

## データベース（supabase/migrations/0001_init.sql）
- `users`：auth.users と 1対1。表示名。
- `agents`：AI 社員。slug・名前・役職・専門分野・担当業務・状態（idle/active/paused/error）・将来の SDK 用の設定（`config` jsonb）。
- `projects`：名前・説明・状態。
- `tasks`：タイトル・説明・担当 AI 社員・プロジェクト・優先度（low/medium/high/urgent）・期限・状態（pending/assigned/running/review/waiting_approval/completed/failed/cancelled）・作成/更新日時。
- `approvals`：操作の種類・内容・内容のハッシュ・期限・状態（pending/approved/rejected/expired/executed）。
- `activity_logs`：誰が・何を・対象・詳細・日時。消せない・書きかえられない（UPDATE/DELETE のポリシーなし）。

すべてのテーブルに `owner_id`（既定値 `auth.uid()`）。RLS で「自分の行だけ読める・書ける」。
新しいユーザーが登録されたら、トリガーで `users` と 9人の AI 社員を作り、操作履歴に記録する。
タスクの作成・更新・削除と AI 社員の変更は、トリガーで操作履歴に自動で記録する（画面側の書き忘れがない）。
承認は関数 `decide_approval(id, decision, hash)`：待ち状態・期限内・ハッシュ一致のときだけ通る（二重実行・改ざん・期限切れを DB 側で止める）。

## 認証
Supabase Auth（メール＋パスワード）。`middleware.ts` でログインしていない人を /login に送る。
セッションは Cookie（@supabase/ssr）。秘密情報は環境変数（`.env.local`、GitHub には入れない）。
新規登録は「最初の1人（Sora）だけ」を想定。Supabase の設定で新規登録を止められる（README に手順）。

## 将来の AI 接続
`agents.config`（モデル・使えるツール・承認が必要な操作）と、タスクの状態の流れ（assigned → running → review → waiting_approval → completed）を、
Agent SDK のワーカーがそのまま使えるようにしておく。ワーカーは service role キーでサーバー側だけで動かす（ブラウザには出さない）。
