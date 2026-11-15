import { getUser } from "@/lib/supabase/server";
import { Empty, ErrorBox, PageHeader, Panel, btnCls, inputCls, fmtDate } from "@/components/ui";
import { createProject, deleteProject } from "../actions";

export default async function Projects({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: qErr } = await searchParams;
  const { supabase } = await getUser();
  const [{ data, error }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("id,name,description,status,created_at").order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id,status"),
  ]);
  const count = (id: string) => (tasks ?? []).filter((t) => t.project_id === id);
  return (
    <>
      <PageHeader title="Projects" />
      {(qErr || error) && <ErrorBox message={qErr ?? error!.message} />}
      <Panel title="New project" className="mb-6">
        <form action={createProject} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <input name="name" required maxLength={120} placeholder="Name" className={inputCls} />
          <input name="description" maxLength={2000} placeholder="Description (optional)" className={inputCls} />
          <button className={btnCls}>Create</button>
        </form>
      </Panel>
      <Panel>
        {(data ?? []).length === 0 ? <Empty>No projects yet</Empty> : (
          <ul className="divide-y divide-line">
            {(data ?? []).map((p) => {
              const ts = count(p.id), done = ts.filter((t) => t.status === "completed").length;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm">{p.name} <span className="ml-1 text-xs capitalize text-dim">{p.status}</span></div>
                    <div className="truncate text-xs text-dim">{p.description || "—"} · {done}/{ts.length} tasks done · {fmtDate(p.created_at)}</div>
                  </div>
                  <form action={deleteProject.bind(null, p.id)}><button className="text-xs text-mute hover:text-bad">Delete</button></form>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
