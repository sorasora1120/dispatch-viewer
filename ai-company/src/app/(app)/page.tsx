import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { OPEN_STATUSES, type TaskStatus, type AgentStatus } from "@/lib/domain";
import { countByDay, describeLog, isCompletion, lastDays, relTime } from "@/lib/dashboard";
import { Empty, ErrorBox, Panel, StatusBadge } from "@/components/ui";
import { AgentIcon, ICON, Icon } from "@/components/icons";
import { OverviewChart, Spark } from "@/components/chart";
import { askAI } from "./actions";

const STATUS_DOT: Record<AgentStatus, string> = { active: "bg-ok", idle: "bg-dim", paused: "bg-warn", error: "bg-bad" };
const LOG_DOT = (a: string) => (a.startsWith("task.result") || a.startsWith("approval.approved") ? "bg-ok" : a.startsWith("task") ? "bg-info" : a.startsWith("project") ? "bg-warn" : a.startsWith("approval") ? "bg-accent" : "bg-dim");

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ asked?: string; error?: string }> }) {
  const { asked, error: qErr } = await searchParams;
  const { supabase, user } = await getUser();
  const now = new Date();
  const since = new Date(now.getTime() - 14 * 86400000).toISOString();
  const [profile, agents, tasks, approvals, recent, hist] = await Promise.all([
    supabase.from("users").select("display_name").eq("id", user!.id).maybeSingle(),
    supabase.from("agents").select("id,slug,name,specialty,status").order("created_at"),
    supabase.from("tasks").select("id,title,status,due_date,updated_at").order("updated_at", { ascending: false }).limit(500),
    supabase.from("approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("activity_logs").select("id,actor,action,details,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("activity_logs").select("action,details,created_at").gte("created_at", since).in("action", ["task.create", "task.update"]).limit(5000),
  ]);
  const err = agents.error || tasks.error || approvals.error || recent.error || hist.error;
  const t = tasks.data ?? [];
  const ag = agents.data ?? [];
  const running = t.filter((x) => x.status === "running").length;
  const open = t.filter((x) => OPEN_STATUSES.includes(x.status as TaskStatus)).length;
  const done = t.filter((x) => x.status === "completed").length;
  const pending = approvals.count ?? 0;
  const active = ag.filter((a) => a.status === "active").length;

  const days = lastDays(now, 7);
  const prev = lastDays(new Date(now.getTime() - 7 * 86400000), 7);
  const h = (hist.data ?? []) as { action: string; details: Record<string, unknown> | null; created_at: string }[];
  const createdStamps = h.filter((l) => l.action === "task.create").map((l) => l.created_at);
  const doneStamps = h.filter(isCompletion).map((l) => l.created_at);
  const created7 = countByDay(days, createdStamps);
  const done7 = countByDay(days, doneStamps);
  const donePrev = countByDay(prev, doneStamps).reduce((a, b) => a + b, 0);
  const doneWeek = done7.reduce((a, b) => a + b, 0);
  const name = profile.data?.display_name || user!.email?.split("@")[0] || "";

  const stats = [
    { n: ag.length, label: "AI Employees", note: `${active} active`, icon: ICON.users, tile: "from-[#7c5cff] to-[#4f46e5]", card: "from-[#2a2470]/60", spark: null as number[] | null, color: "" },
    { n: running, label: "Running Tasks", note: `${open} open in total`, icon: ICON.check, tile: "from-[#4f8cff] to-[#1d4ed8]", card: "from-[#1b2f6e]/60", spark: created7, color: "#4f8cff", sparkNote: "created per day" },
    { n: done, label: "Completed Tasks", note: `${doneWeek} this week${donePrev || doneWeek ? ` · ${doneWeek - donePrev >= 0 ? "+" : ""}${doneWeek - donePrev} vs last week` : ""}`, icon: ICON.check, tile: "from-[#34d399] to-[#059669]", card: "from-[#0f4a3a]/60", spark: done7, color: "#3ccf8e", sparkNote: "completed per day" },
    { n: pending, label: "Pending Approvals", note: pending ? "Waiting for you" : "Nothing to approve", icon: ICON.alert, tile: "from-[#fbbf24] to-[#d97706]", card: "from-[#5a3a0e]/60", spark: null, color: "" },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight sm:text-[40px]">Welcome back, <span className="grad-text">{name}!</span></h1>
        <p className="mt-1 text-[15px] text-mute sm:text-lg">
          {running ? `${running} task${running > 1 ? "s" : ""} running` : "No tasks running right now"}{pending ? ` · ${pending} waiting for your approval` : ""}.
        </p>
      </div>
      {err && <ErrorBox message={`Some data could not be loaded: ${err.message}`} />}
      {qErr && <ErrorBox message={qErr} />}
      <form action={askAI} className="glass mb-5 rounded-2xl p-4 lg:p-5">
        <label htmlFor="ask" className="flex items-center gap-2 text-[15px] font-semibold"><Icon d={ICON.bolt} className="size-5 text-warn" />AIに頼む</label>
        <textarea id="ask" name="text" required maxLength={2000} rows={2} placeholder="例：Vivarium に送る返事を考えて／Windsor のカフェを10店調べて"
          className="mt-3 w-full resize-none rounded-xl border border-line bg-panel2/70 px-3.5 py-3 text-ink placeholder:text-dim focus:border-accent/70 focus:outline-none" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-mute">{asked ? "受け付けました。CEO が担当を決めて、1時間以内に始めます。終わると Tasks が「Review」になります。" : "CEO が担当を決めて、1時間以内に始めます。送信・投稿・お金を払うことはしません（押すのは Sora）。"}</p>
          <button className="grad-btn rounded-xl px-6 py-2.5 text-sm font-medium text-white">頼む</button>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`glass relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.card} to-transparent p-4 lg:p-5`}>
            <div className="flex items-start gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${s.tile} text-white shadow-lg lg:size-12`}><Icon d={s.icon} className="size-5 lg:size-6" strokeWidth={2.2} /></span>
              <div className="min-w-0">
                <div className="text-[28px] font-bold leading-none tabular-nums lg:text-[34px]">{s.n}</div>
                <div className="mt-1.5 text-[13px] text-ink/90 lg:text-[15px]">{s.label}</div>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <span className="text-[11.5px] text-mute">{s.note}</span>
              {s.spark && s.spark.some((v) => v > 0) && <span title={s.sparkNote} className="hidden sm:block"><Spark values={s.spark} color={s.color} /></span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Panel title="Company Overview" icon={<Icon d={ICON.chart} className="size-5 text-accent" />} action={<span className="rounded-lg border border-line px-2.5 py-1 text-xs text-mute">Last 7 days</span>}>
          <OverviewChart labels={days.map((d) => d.label)} created={created7} completed={done7} />
        </Panel>
        <Panel title="AI Employee Status" icon={<span className="grid size-5 place-items-center rounded-full bg-ok/20"><span className="size-2.5 rounded-full bg-ok" /></span>}
          action={<span className="flex items-center gap-1.5 text-xs text-ok"><span className="size-2 rounded-full bg-ok" />{active} active · {ag.length - active} standby</span>}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {ag.map((a) => (
              <Link key={a.id} href="/agents" className="flex items-center gap-2.5 rounded-xl border border-line bg-panel2/50 p-2.5 hover:border-accent/50">
                <span className="relative"><AgentIcon slug={a.slug} size={38} /><span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#141834] ${STATUS_DOT[a.status as AgentStatus]}`} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium">{a.name}</span>
                  <span className="block truncate text-[11px] text-mute">{a.specialty || a.status}</span>
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Recent Activities" icon={<Icon d={ICON.clock} className="size-5 text-mute" />} action={<Link href="/activity" className="flex items-center gap-1 text-xs text-info">View All <Icon d={ICON.arrow} className="size-3.5" /></Link>}>
          {(recent.data ?? []).length === 0 ? <Empty>No activity yet</Empty> : (
            <ul className="relative space-y-3.5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
              {(recent.data ?? []).map((l) => (
                <li key={l.id} className="relative flex gap-3 pl-6 text-[13.5px]">
                  <span className={`absolute left-0 top-1.5 size-[11px] rounded-full ring-4 ring-[#12152f] ${LOG_DOT(l.action)}`} />
                  <span className="w-[74px] shrink-0 text-xs leading-5 text-dim">{relTime(l.created_at, now)}</span>
                  <span className="min-w-0 truncate">{describeLog(l)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Tasks" icon={<Icon d={ICON.tasks} className="size-5 text-mute" />} action={<Link href="/tasks" className="flex items-center gap-1 text-xs text-info">View All <Icon d={ICON.arrow} className="size-3.5" /></Link>}>
          {t.length === 0 ? <Empty>No tasks yet</Empty> : (
            <ul className="space-y-2.5">
              {t.slice(0, 5).map((x) => (
                <li key={x.id}>
                  <Link href={`/tasks/${x.id}`} className="flex items-center gap-3 text-[13.5px] hover:text-white">
                    <span className="w-[92px] shrink-0"><StatusBadge status={x.status as TaskStatus} /></span>
                    <span className="min-w-0 flex-1 truncate">{x.title}</span>
                    <span className="shrink-0 text-xs text-dim">{x.due_date ? `due ${x.due_date.slice(5).replace("-", "/")}` : relTime(x.updated_at, now)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Quick Actions" icon={<Icon d={ICON.bolt} className="size-5 text-warn" />}>
          <div className="space-y-3">
            <Link href="/tasks?new=1" className="grad-btn flex items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-medium text-white"><Icon d={ICON.plus} className="size-5" />Create New Task</Link>
            <Link href="/approvals" className="flex items-center justify-center gap-2 rounded-xl border border-line bg-panel2/60 py-3 text-[15px] hover:bg-panel2"><Icon d={ICON.shield} className="size-5" />Review Approvals{pending ? ` (${pending})` : ""}</Link>
            <Link href="/projects" className="flex items-center justify-center gap-2 rounded-xl border border-line bg-panel2/60 py-3 text-[15px] hover:bg-panel2"><Icon d={ICON.folder} className="size-5" />Create Project</Link>
          </div>
        </Panel>
      </div>
    </>
  );
}
