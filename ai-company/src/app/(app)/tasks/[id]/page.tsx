import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ErrorBox, PageHeader, Panel, btnGhostCls, fmtDate } from "@/components/ui";
import { TaskForm } from "@/components/task-form";
import { deleteTask, updateTask } from "../../actions";

export default async function TaskDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error: qErr } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await getUser();
  const [{ data: task, error }, agents, projects, logs] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).maybeSingle(),
    supabase.from("agents").select("id,name").order("created_at"),
    supabase.from("projects").select("id,name").order("created_at"),
    supabase.from("activity_logs").select("id,action,details,created_at").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (!task && !error) notFound();
  return (
    <>
      <PageHeader title="Edit task" sub={task ? `Created ${fmtDate(task.created_at)} · Updated ${fmtDate(task.updated_at)}` : undefined} action={<Link href="/tasks" className={btnGhostCls}>Back</Link>} />
      {(qErr || error) && <ErrorBox message={qErr ?? error!.message} />}
      {task && (
        <>
          <Panel><TaskForm action={updateTask.bind(null, id)} agents={agents.data ?? []} projects={projects.data ?? []} task={task} submit="Save changes" /></Panel>
          <Panel title="History" className="mt-6">
            <ul className="divide-y divide-line text-sm">
              {(logs.data ?? []).map((l) => (
                <li key={l.id} className="flex justify-between gap-4 py-2"><span className="min-w-0 truncate">{l.action} <span className="text-dim">{JSON.stringify(l.details)}</span></span><span className="shrink-0 text-xs text-dim">{fmtDate(l.created_at)}</span></li>
              ))}
            </ul>
          </Panel>
          <form action={deleteTask.bind(null, id)} className="mt-6">
            <button className="text-sm text-bad hover:underline">Delete this task</button>
          </form>
        </>
      )}
    </>
  );
}
