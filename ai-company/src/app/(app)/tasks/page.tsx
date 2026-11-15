import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { OPEN_STATUSES, STATUS_LABEL, TASK_STATUSES, isOverdue, type TaskPriority, type TaskStatus } from "@/lib/domain";
import { Empty, ErrorBox, PageHeader, Panel, PriorityBadge, StatusBadge, fmtDate } from "@/components/ui";
import { TaskForm } from "@/components/task-form";
import { createTask } from "../actions";

export default async function Tasks({ searchParams }: { searchParams: Promise<{ error?: string; f?: string; q?: string; new?: string }> }) {
  const { error: qErr, f = "open", q = "", new: isNew } = await searchParams;
  const needle = q.trim().toLowerCase();
  const { supabase } = await getUser();
  const [tasks, agents, projects] = await Promise.all([
    supabase.from("tasks").select("id,title,status,priority,due_date,created_at,updated_at,agent:agents(name),project:projects(name)").order("updated_at", { ascending: false }),
    supabase.from("agents").select("id,name").order("created_at"),
    supabase.from("projects").select("id,name").order("created_at"),
  ]);
  const err = qErr ?? (tasks.error || agents.error || projects.error)?.message;
  const all = tasks.data ?? [];
  const list = all.filter((t) => (f === "all" ? true : f === "open" ? OPEN_STATUSES.includes(t.status as TaskStatus) : t.status === f)).filter((t) => !needle || t.title.toLowerCase().includes(needle));
  const filters = [["open", "Open"], ["all", "All"], ...TASK_STATUSES.map((s) => [s, STATUS_LABEL[s]])];
  return (
    <>
      <PageHeader title="Tasks" sub={needle ? `${list.length} results for “${q.trim()}”` : `${all.length} tasks`} />
      {err && <ErrorBox message={err} />}
      <details className="glass mb-6 rounded-2xl" open={all.length === 0 || !!isNew}>
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">New task</summary>
        <div className="border-t border-line p-4">
          <TaskForm action={createTask} agents={agents.data ?? []} projects={projects.data ?? []} submit="Create task" />
        </div>
      </details>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {filters.map(([v, l]) => (
          <Link key={v} href={`/tasks?f=${v}${needle ? `&q=${encodeURIComponent(q)}` : ""}`} className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs ${f === v ? "border-accent bg-accent/25 text-white" : "border-line text-mute"}`}>{l}</Link>
        ))}
      </div>
      <Panel>
        {list.length === 0 ? <Empty>No tasks here</Empty> : (
          <ul className="divide-y divide-line">
            {list.map((t) => {
              const over = isOverdue(t.due_date, t.status as TaskStatus);
              return (
                <li key={t.id}>
                  <Link href={`/tasks/${t.id}`} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm">{t.title}</div>
                      <div className="mt-0.5 text-xs text-dim">
                        {(t.agent as unknown as { name: string } | null)?.name ?? "Unassigned"}
                        {(t.project as unknown as { name: string } | null)?.name ? ` · ${(t.project as unknown as { name: string }).name}` : ""} · <PriorityBadge priority={t.priority as TaskPriority} />
                        {t.due_date && <span className={over ? "text-bad" : ""}> · due {t.due_date}{over ? " (overdue)" : ""}</span>}
                        <span> · updated {fmtDate(t.updated_at)}</span>
                      </div>
                    </div>
                    <StatusBadge status={t.status as TaskStatus} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
