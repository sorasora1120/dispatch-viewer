-- AI COMPANY OS Phase 1: tables, RLS, triggers.
-- Run this in Supabase: Dashboard → SQL Editor → paste → Run (or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  slug text not null,
  name text not null,
  title text not null,
  specialty text not null default '',
  duties text[] not null default '{}',
  status text not null default 'idle' check (status in ('idle', 'active', 'paused', 'error')),
  config jsonb not null default '{}'::jsonb,  -- future: model, tools, actions that need approval
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  agent_id uuid references public.agents (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'assigned', 'running', 'review', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  agent_id uuid references public.agents (id) on delete set null,
  action_type text not null,               -- e.g. send_email, post_sns, purchase
  payload text not null,                   -- exactly what will be executed
  payload_hash text not null,              -- sha256 hex of payload, set at creation
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'executed')),
  expires_at timestamptz not null default now() + interval '48 hours',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  actor text not null default 'user',      -- 'user' or an agent slug
  action text not null,                    -- e.g. task.create, agent.update, auth.login
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists tasks_owner_status_idx on public.tasks (owner_id, status);
create index if not exists tasks_owner_agent_idx on public.tasks (owner_id, agent_id);
create index if not exists tasks_owner_due_idx on public.tasks (owner_id, due_date);
create index if not exists tasks_project_idx on public.tasks (project_id);
create index if not exists approvals_owner_status_idx on public.approvals (owner_id, status);
create index if not exists activity_owner_time_idx on public.activity_logs (owner_id, created_at desc);
create index if not exists agents_owner_idx on public.agents (owner_id);
create index if not exists projects_owner_idx on public.projects (owner_id);

-- approvals: the hash must match the payload when the row is created
create or replace function public.approval_hash_check() returns trigger language plpgsql as $$
begin
  if new.payload_hash <> encode(digest(new.payload, 'sha256'), 'hex') then
    raise exception 'payload_hash does not match payload';
  end if;
  return new;
end $$;
drop trigger if exists approvals_hash_check on public.approvals;
create trigger approvals_hash_check before insert on public.approvals for each row execute function public.approval_hash_check();

-- ---------- updated_at ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists agents_touch on public.agents;
create trigger agents_touch before update on public.agents for each row execute function public.touch_updated_at();
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
alter table public.users enable row level security;
alter table public.agents enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.approvals enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists users_self on public.users;
create policy users_self on public.users for select using (id = auth.uid());
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update using (id = auth.uid()) with check (id = auth.uid());

-- agents: read and update own. Create/delete only through the signup trigger (Phase 1).
drop policy if exists agents_select on public.agents;
create policy agents_select on public.agents for select using (owner_id = auth.uid());
drop policy if exists agents_update on public.agents;
create policy agents_update on public.agents for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists projects_all on public.projects;
create policy projects_all on public.projects for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists tasks_all on public.tasks;
create policy tasks_all on public.tasks for all using (owner_id = auth.uid()) with check (
  owner_id = auth.uid()
  and (agent_id is null or exists (select 1 from public.agents a where a.id = agent_id and a.owner_id = auth.uid()))
  and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
);

-- approvals: read own; decisions only through decide_approval(); rows are created by agents (service role) later.
drop policy if exists approvals_select on public.approvals;
create policy approvals_select on public.approvals for select using (owner_id = auth.uid());

-- activity logs: read and append own. No update/delete policy = cannot be changed.
drop policy if exists activity_select on public.activity_logs;
create policy activity_select on public.activity_logs for select using (owner_id = auth.uid());
drop policy if exists activity_insert on public.activity_logs;
create policy activity_insert on public.activity_logs for insert with check (owner_id = auth.uid());

-- ---------- activity log triggers ----------
create or replace function public.log_task_change() returns trigger language plpgsql as $$
declare d jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs (owner_id, action, entity_type, entity_id, details)
    values (new.owner_id, 'task.create', 'task', new.id, jsonb_build_object('title', new.title, 'status', new.status));
    return new;
  elsif tg_op = 'UPDATE' then
    d := jsonb_strip_nulls(jsonb_build_object(
      'title', case when new.title is distinct from old.title then new.title end,
      'status', case when new.status is distinct from old.status then jsonb_build_array(old.status, new.status) end,
      'priority', case when new.priority is distinct from old.priority then jsonb_build_array(old.priority, new.priority) end,
      'agent_id', case when new.agent_id is distinct from old.agent_id then to_jsonb(new.agent_id) end,
      'due_date', case when new.due_date is distinct from old.due_date then to_jsonb(new.due_date) end));
    insert into public.activity_logs (owner_id, action, entity_type, entity_id, details)
    values (new.owner_id, 'task.update', 'task', new.id, d || jsonb_build_object('title_now', new.title));
    return new;
  else
    insert into public.activity_logs (owner_id, action, entity_type, entity_id, details)
    values (old.owner_id, 'task.delete', 'task', old.id, jsonb_build_object('title', old.title));
    return old;
  end if;
end $$;
drop trigger if exists tasks_log on public.tasks;
create trigger tasks_log after insert or update or delete on public.tasks for each row execute function public.log_task_change();

create or replace function public.log_agent_change() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs (owner_id, actor, action, entity_type, entity_id, details)
    values (new.owner_id, 'system', 'agent.create', 'agent', new.id, jsonb_build_object('name', new.name));
  elsif new.status is distinct from old.status or new.config is distinct from old.config then
    insert into public.activity_logs (owner_id, action, entity_type, entity_id, details)
    values (new.owner_id, 'agent.update', 'agent', new.id, jsonb_build_object('name', new.name, 'status', jsonb_build_array(old.status, new.status)));
  end if;
  return new;
end $$;
drop trigger if exists agents_log on public.agents;
create trigger agents_log after insert or update on public.agents for each row execute function public.log_agent_change();

create or replace function public.log_project_change() returns trigger language plpgsql as $$
begin
  insert into public.activity_logs (owner_id, action, entity_type, entity_id, details)
  values (coalesce(new.owner_id, old.owner_id), 'project.' || lower(tg_op), 'project', coalesce(new.id, old.id),
          jsonb_build_object('name', coalesce(new.name, old.name)));
  return coalesce(new, old);
end $$;
drop trigger if exists projects_log on public.projects;
create trigger projects_log after insert or update or delete on public.projects for each row execute function public.log_project_change();

-- ---------- approvals: the only way to decide ----------
-- Direct UPDATEs from signed-in users are blocked; decide_approval() sets app.deciding for its own update.
create or replace function public.approvals_guard() returns trigger language plpgsql as $$
begin
  if current_setting('app.deciding', true) is distinct from 'on' and auth.uid() is not null then
    raise exception 'use decide_approval()';
  end if;
  return new;
end $$;
create or replace function public.decide_approval(p_id uuid, p_decision text, p_hash text)
returns public.approvals language plpgsql security definer set search_path = public as $$
declare r public.approvals;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'invalid decision'; end if;
  select * into r from public.approvals where id = p_id and owner_id = auth.uid() for update;
  if not found then raise exception 'approval not found'; end if;
  if r.status <> 'pending' then raise exception 'already %', r.status; end if;
  perform set_config('app.deciding', 'on', true);
  if r.expires_at < now() then
    update public.approvals set status = 'expired' where id = p_id;
    perform set_config('app.deciding', 'off', true);
    return null;
  end if;
  if r.payload_hash <> p_hash or r.payload_hash <> encode(digest(r.payload, 'sha256'), 'hex') then
    perform set_config('app.deciding', 'off', true);
    raise exception 'payload changed';
  end if;
  update public.approvals set status = p_decision, decided_at = now() where id = p_id returning * into r;
  perform set_config('app.deciding', 'off', true);
  insert into public.activity_logs (owner_id, action, entity_type, entity_id, details)
  values (r.owner_id, 'approval.' || p_decision, 'approval', r.id, jsonb_build_object('action_type', r.action_type));
  return r;
end $$;
drop trigger if exists approvals_guard on public.approvals;
create trigger approvals_guard before update on public.approvals for each row execute function public.approvals_guard();
revoke all on function public.decide_approval(uuid, text, text) from public;
grant execute on function public.decide_approval(uuid, text, text) to authenticated;

-- ---------- new user: profile + 9 AI employees ----------
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.agents (owner_id, slug, name, title, specialty, duties) values
    (new.id, 'ceo', 'CEO', 'Chief Executive Officer', '全体統括', array['指示を分解してタスクにする', '担当を決める', '優先順位を決める', '最終報告']),
    (new.id, 'research', 'Research', 'Research Lead', '競合・市場調査', array['競合調査', '市場トレンド調査', '出典つきのレポート']),
    (new.id, 'marketing', 'Marketing', 'Marketing Lead', '広告・SNS', array['市場分析', '広告戦略', 'SNS分析', '投稿案']),
    (new.id, 'product', 'Product', 'Product Lead', '商品企画', array['商品企画', '商品改善の提案']),
    (new.id, 'sales', 'Sales', 'Sales Lead', '営業', array['営業戦略', '顧客対応の文案']),
    (new.id, 'finance', 'Finance', 'Finance Lead', '収支', array['収支分析', '利益管理（実データだけ）']),
    (new.id, 'creative', 'Creative', 'Creative Lead', '制作', array['画像', '動画', 'コンテンツ制作']),
    (new.id, 'operations', 'Operations', 'Operations Lead', '運用', array['予定管理', 'メールの下書き', '日々の報告']),
    (new.id, 'qc', 'Quality Control', 'Quality Lead', '品質管理', array['成果物の確認', '改善提案', '事実と推測の区別']);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
