import { getUser } from "@/lib/supabase/server";
import { Empty, ErrorBox, PageHeader, Panel, btnGhostCls, fmtDate } from "@/components/ui";
import { decideApproval } from "../actions";

export default async function Approvals({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: qErr } = await searchParams;
  const { supabase } = await getUser();
  const { data, error } = await supabase.from("approvals").select("id,action_type,payload,status,expires_at,decided_at,created_at,agent:agents(name)").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");
  return (
    <>
      <PageHeader title="Approvals" sub="Actions that leave the company (email, posts, purchases…) wait here. Nothing runs without your approval." />
      {(qErr || error) && <ErrorBox message={qErr ?? error!.message} />}
      <Panel title={`Waiting (${pending.length})`}>
        {pending.length === 0 ? <Empty>No pending approvals</Empty> : (
          <ul className="space-y-4">
            {pending.map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-panel2 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{r.action_type}</span>
                  <span className="text-xs text-dim">{(r.agent as unknown as { name: string } | null)?.name ?? "—"} · expires {fmtDate(r.expires_at)}</span>
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-md border border-line bg-bg p-3 text-[13px] text-ink">{r.payload}</pre>
                <form action={decideApproval.bind(null, r.id, r.payload)} className="mt-3 flex gap-2">
                  <button name="decision" value="approved" className="rounded-lg bg-ok/90 px-4 py-2 text-sm font-medium text-bg hover:bg-ok">Approve</button>
                  <button name="decision" value="rejected" className={btnGhostCls}>Reject</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="History" className="mt-6">
        {done.length === 0 ? <Empty>Nothing yet</Empty> : (
          <ul className="divide-y divide-line text-sm">
            {done.map((r) => (
              <li key={r.id} className="flex justify-between gap-4 py-2"><span>{r.action_type}</span><span className="text-xs capitalize text-mute">{r.status} · {fmtDate(r.decided_at ?? r.created_at)}</span></li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
