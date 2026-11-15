import { getUser } from "@/lib/supabase/server";
import { Empty, ErrorBox, PageHeader, Panel, fmtDate } from "@/components/ui";

export default async function Activity() {
  const { supabase } = await getUser();
  const { data, error } = await supabase.from("activity_logs").select("id,actor,action,entity_type,details,created_at").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <PageHeader title="Activity Logs" sub="Every change is recorded automatically. Logs cannot be edited or deleted." />
      {error && <ErrorBox message={error.message} />}
      <Panel>
        {(data ?? []).length === 0 ? <Empty>No activity yet</Empty> : (
          <ul className="divide-y divide-line">
            {(data ?? []).map((l) => (
              <li key={l.id} className="grid gap-1 py-2.5 text-sm md:grid-cols-[150px_110px_1fr]">
                <span className="text-xs text-dim">{fmtDate(l.created_at)}</span>
                <span className="text-xs text-mute">{l.actor}</span>
                <span className="min-w-0"><span className="text-ink">{l.action}</span> <span className="break-all text-xs text-dim">{Object.keys(l.details ?? {}).length ? JSON.stringify(l.details) : ""}</span></span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
