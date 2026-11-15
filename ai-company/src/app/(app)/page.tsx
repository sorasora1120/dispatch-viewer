import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { OPEN_STATUSES, type TaskStatus, type TaskPriority, type AgentStatus } from "@/lib/domain";
import { Dot, Empty, ErrorBox, PageHeader, Panel, PriorityBadge, Stat, StatusBadge, fmtDate } from "@/components/ui";

export default async function Dashboard() {
  const { supabase } = await getUser();
  const [agents, tasks, approvals, logs] = await Promise.all([
    supabase.from("agents").select("id,name,title,status").order("created_at"),
    supabase.from("tasks").select("id,title,status,priority,due_date,updated_at,agent:agents(name)").order("updated_at", { ascending: false }).limit(200),
    supabase.from("approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("activity_logs").select("id,actor,action,details,created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  const err = agents.error || tasks.error || approvals.error || logs.error;
  const t = tasks.data ?? [];
  const running = t.filter((x) => x.status === "running").length;
  const open = t.filter((x) => OPEN_STATUSES.includes(x.status as TaskStatus));
  const done = t.filter((x) => x.status === "completed").length;
  const tone = (s: AgentStatus) => (s === "active" ? "ok" : s === "error" ? "bad" : s === "paused" ? "warn" : "dim");

  return (
    <>
      <PageHeader title="Dashboard" sub="Live data from your database" />
      {err && <ErrorBox message={`Some data could not be loaded: ${err.message}`} />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="AI Employees" value={agents.data?.length ?? 0} />
        <Stat label="Running tasks" value={running} note={`${open.length} open in total`} />
        <Stat label="Completed tasks" value={done} />
        <Stat label="Waiting approval" value={approvals.count ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Open tasks" className="lg:col-span-2" action={<Link href="/tasks" className="text-xs text-mute hover:text-ink">All tasks</Link>}>
          {open.length === 0 ? (
            <Empty>No open tasks. <Link href="/tasks" className="text-accent">Create one</Link></Empty>
          ) : (
            <ul className="divide-y divide-line">
              {open.slice(0, 8).map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/tasks/${x.id}`} className="min-w-0">
                    <div className="truncate text-sm">{x.title}</div>
                    <div className="text-xs text-dim">
                      {(x.agent as unknown as { name: string } | null)?.name ?? "Unassigned"} · <PriorityBadge priority={x.priority as TaskPriority} />
                      {x.due_date ? ` · due ${x.due_date}` : ""}
                    </div>
                  </Link>
                  <StatusBadge status={x.status as TaskStatus} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="AI Employees" action={<Link href="/agents" className="text-xs text-mute hover:text-ink">Manage</Link>}>
          <ul className="space-y-2.5">
            {(agents.data ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5"><Dot tone={tone(a.status as AgentStatus)} />{a.name}</span>
                <span className="text-xs capitalize text-dim">{a.status}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent activity" className="mt-6" action={<Link href="/activity" className="text-xs text-mute hover:text-ink">All logs</Link>}>
        {(logs.data ?? []).length === 0 ? (
          <Empty>No activity yet</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {(logs.data ?? []).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="min-w-0 truncate"><span className="text-mute">{l.actor}</span> · {l.action}</span>
                <span className="shrink-0 text-xs text-dim">{fmtDate(l.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
