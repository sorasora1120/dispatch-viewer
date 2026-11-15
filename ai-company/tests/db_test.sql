-- Run after supabase_stub.sql and the migration. Raises an exception if anything is wrong.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'sora@example.com'), ('22222222-2222-2222-2222-222222222222', 'other@example.com');

do $$ begin
  if (select count(*) from public.agents where owner_id = '11111111-1111-1111-1111-111111111111') <> 9 then raise exception 'FAIL: 9 agents not seeded'; end if;
  if (select count(*) from public.activity_logs where owner_id = '11111111-1111-1111-1111-111111111111' and action = 'agent.create') <> 9 then raise exception 'FAIL: agent.create not logged'; end if;
  raise notice 'ok: signup seeds 9 agents and logs';
end $$;

-- as user A
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
insert into public.projects (name) values ('A project');
insert into public.tasks (title, agent_id, priority, due_date) select 'A task', id, 'high', current_date + 3 from public.agents where slug = 'research';
update public.tasks set status = 'running' where title = 'A task';
do $$ begin
  if (select count(*) from public.activity_logs where action in ('task.create', 'task.update', 'project.insert')) <> 3 then raise exception 'FAIL: task/project logs %', (select count(*) from public.activity_logs where action like 'task.%' or action like 'project.%'); end if;
  if (select count(*) from public.agents) <> 9 then raise exception 'FAIL: A should see 9 agents'; end if;
  raise notice 'ok: user A writes and logs';
end $$;

-- as user B: must see nothing of A
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$ begin
  if (select count(*) from public.tasks) <> 0 then raise exception 'FAIL: B sees A tasks'; end if;
  if (select count(*) from public.projects) <> 0 then raise exception 'FAIL: B sees A projects'; end if;
  if (select count(*) from public.activity_logs where owner_id = '11111111-1111-1111-1111-111111111111') <> 0 then raise exception 'FAIL: B sees A logs'; end if;
  if (select count(*) from public.agents) <> 9 then raise exception 'FAIL: B should see only own 9 agents'; end if;
  update public.tasks set title = 'hacked';  -- affects 0 rows under RLS
  raise notice 'ok: user B isolated';
end $$;
-- B cannot attach A's agent to B's task (get A's agent id as superuser first)
reset role;
select set_config('test.a_agent', (select id::text from public.agents where owner_id = '11111111-1111-1111-1111-111111111111' limit 1), false);
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$ begin
  begin
    insert into public.tasks (title, agent_id) values ('steal', current_setting('test.a_agent')::uuid);
    raise exception 'FAIL: B used A agent';
  exception when insufficient_privilege or check_violation then raise notice 'ok: B cannot use A agent'; end;
end $$;
-- B cannot forge owner_id
do $$ begin
  begin
    insert into public.projects (owner_id, name) values ('11111111-1111-1111-1111-111111111111', 'forged');
    raise exception 'FAIL: forged owner';
  exception when insufficient_privilege then raise notice 'ok: owner cannot be forged'; end;
end $$;

-- activity logs cannot be edited or deleted
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
do $$ declare n int; begin
  update public.activity_logs set action = 'x'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: logs editable'; end if;
  delete from public.activity_logs; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: logs deletable'; end if;
  raise notice 'ok: logs are append-only';
end $$;

-- approvals: created by the system (service role) – simulate as superuser
reset role;
insert into public.approvals (owner_id, action_type, payload, payload_hash) values
  ('11111111-1111-1111-1111-111111111111', 'send_email', 'Hello', encode(digest('Hello', 'sha256'), 'hex')),
  ('11111111-1111-1111-1111-111111111111', 'post_sns', 'Post', encode(digest('Post', 'sha256'), 'hex'));
insert into public.approvals (owner_id, action_type, payload, payload_hash, expires_at) values
  ('11111111-1111-1111-1111-111111111111', 'purchase', 'Buy', encode(digest('Buy', 'sha256'), 'hex'), now() - interval '1 hour');
do $$ begin
  begin
    insert into public.approvals (owner_id, action_type, payload, payload_hash) values ('11111111-1111-1111-1111-111111111111', 'x', 'A', 'bad');
    raise exception 'FAIL: bad hash accepted';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok: wrong hash rejected on insert';
  end;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
do $$ declare h text := encode(digest('Hello', 'sha256'), 'hex'); id1 uuid := (select id from public.approvals where action_type = 'send_email'); n int;
begin
  -- direct update changes nothing (no UPDATE policy; and the guard trigger blocks it even with one)
  update public.approvals set status = 'approved'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: direct update allowed'; end if;
  -- wrong hash
  begin perform public.decide_approval(id1, 'approved', 'deadbeef'); raise exception 'FAIL: wrong hash approved';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  perform public.decide_approval(id1, 'approved', h);
  if (select status from public.approvals where id = id1) <> 'approved' then raise exception 'FAIL: not approved'; end if;
  -- twice
  begin perform public.decide_approval(id1, 'approved', h); raise exception 'FAIL: double approve';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
  -- expired
  perform public.decide_approval((select id from public.approvals where action_type = 'purchase'), 'approved', encode(digest('Buy', 'sha256'), 'hex'));
  if (select status from public.approvals where action_type = 'purchase') <> 'expired' then raise exception 'FAIL: expired not marked'; end if;
  raise notice 'ok: approvals guarded (hash, twice, expired, direct update)';
end $$;
-- B cannot decide A's approval
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$ begin
  begin perform public.decide_approval((select id from public.approvals where action_type = 'post_sns'), 'approved', encode(digest('Post', 'sha256'), 'hex'));
    raise exception 'FAIL: B decided A approval';
  exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'ok: B cannot decide A approval'; end;
end $$;
reset role;
do $$ begin
  if (select status from public.approvals where action_type = 'post_sns') <> 'pending' then raise exception 'FAIL: post_sns changed'; end if;
  raise notice 'ALL DB TESTS PASSED';
end $$;
