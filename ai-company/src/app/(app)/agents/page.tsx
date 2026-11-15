import { getUser } from "@/lib/supabase/server";
import { AGENT_STATUSES, type AgentStatus } from "@/lib/domain";
import { Dot, ErrorBox, PageHeader, fmtDate } from "@/components/ui";
import { setAgentStatus } from "../actions";

export default async function Agents({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: qErr } = await searchParams;
  const { supabase } = await getUser();
  const [{ data, error }, { data: tasks }] = await Promise.all([
    supabase.from("agents").select("id,slug,name,title,specialty,duties,status,created_at").order("created_at"),
    supabase.from("tasks").select("agent_id,status"),
  ]);
  const openBy = new Map<string, number>();
  (tasks ?? []).forEach((t) => {
    if (t.agent_id && !["completed", "failed", "cancelled"].includes(t.status)) openBy.set(t.agent_id, (openBy.get(t.agent_id) ?? 0) + 1);
  });
  const tone = (s: AgentStatus) => (s === "active" ? "ok" : s === "error" ? "bad" : s === "paused" ? "warn" : "dim");
  return (
    <>
      <PageHeader title="AI Employees" sub="9 departments. Running AI agents will connect here later (Claude Agent SDK)." />
      {(qErr || error) && <ErrorBox message={qErr ?? error!.message} />}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((a) => (
          <article key={a.id} className="flex flex-col rounded-xl border border-line bg-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[15px] font-semibold"><Dot tone={tone(a.status as AgentStatus)} />{a.name}</div>
                <div className="mt-0.5 text-xs text-mute">{a.title} · {a.specialty}</div>
              </div>
              <span className="text-xs text-dim">{openBy.get(a.id) ?? 0} open</span>
            </div>
            <ul className="mt-3 flex-1 space-y-1 text-[13px] text-mute">
              {(a.duties as string[]).map((d) => <li key={d}>— {d}</li>)}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[11px] text-dim">ID {String(a.id).slice(0, 8)} · {fmtDate(a.created_at)}</span>
              <form action={setAgentStatus.bind(null, a.id)} className="flex items-center gap-2">
                <select name="status" defaultValue={a.status} className="rounded-md border border-line bg-panel2 px-2 py-1 text-xs capitalize">
                  {AGENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="rounded-md border border-line px-2 py-1 text-xs hover:bg-panel2">Save</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
