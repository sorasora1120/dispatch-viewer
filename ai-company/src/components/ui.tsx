import type { ReactNode } from "react";
import { STATUS_LABEL, PRIORITY_LABEL, type TaskStatus, type TaskPriority } from "@/lib/domain";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-panel ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium text-ink">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-4">
      <div className="text-xs text-mute">{label}</div>
      <div className="mt-2 text-[28px] font-semibold tabular-nums leading-none">{value}</div>
      {note && <div className="mt-2 text-xs text-dim">{note}</div>}
    </div>
  );
}

const STATUS_TONE: Record<TaskStatus, string> = {
  pending: "text-mute border-line",
  assigned: "text-info border-info/30",
  running: "text-warn border-warn/30",
  review: "text-accent border-accent/30",
  waiting_approval: "text-accent border-accent/40",
  completed: "text-ok border-ok/30",
  failed: "text-bad border-bad/30",
  cancelled: "text-dim border-line",
};
export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11.5px] font-medium ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const tone = priority === "urgent" ? "text-bad" : priority === "high" ? "text-warn" : "text-mute";
  return <span className={`text-[11.5px] font-medium ${tone}`}>{PRIORITY_LABEL[priority]}</span>;
}
export function Dot({ tone }: { tone: "ok" | "warn" | "bad" | "dim" }) {
  const c = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", dim: "bg-dim" }[tone];
  return <span className={`inline-block size-2 rounded-full ${c}`} />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-8 text-center text-sm text-mute">{children}</div>;
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="mb-4 rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">{message}</div>;
}

export const inputCls = "w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-ink placeholder:text-dim focus:border-accent/60 focus:outline-none";
export const btnCls = "inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-medium text-bg hover:bg-white disabled:opacity-50";
export const btnGhostCls = "inline-flex items-center justify-center rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-panel2";

export function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto" });
}
