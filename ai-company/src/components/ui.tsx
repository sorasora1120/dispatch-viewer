import type { ReactNode } from "react";
import { STATUS_LABEL, PRIORITY_LABEL, type TaskStatus, type TaskPriority } from "@/lib/domain";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, icon, action, children, className = "" }: { title?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-2xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">{icon}{title}</h2>
          {action}
        </div>
      )}
      <div className="px-5 pb-5 pt-2">{children}</div>
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-4">
      <div className="text-xs text-mute">{label}</div>
      <div className="mt-2 text-[28px] font-bold tabular-nums leading-none">{value}</div>
      {note && <div className="mt-2 text-xs text-dim">{note}</div>}
    </div>
  );
}

// Filled pills like the reference design. Text stays light so it is readable on every pill.
const STATUS_TONE: Record<TaskStatus, string> = {
  pending: "bg-[#c2410c]/80",
  assigned: "bg-[#1e40af]/80",
  running: "bg-[#1d4ed8]",
  review: "bg-[#4d6b1f]",
  waiting_approval: "bg-[#6d28d9]",
  completed: "bg-[#15803d]",
  failed: "bg-[#b91c1c]",
  cancelled: "bg-[#3f4468]",
};
export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-medium text-white ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
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
  return <div className="mb-4 rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">{message}</div>;
}

export const inputCls = "w-full rounded-xl border border-line bg-panel2 px-3 py-2 text-ink placeholder:text-dim focus:border-accent/70 focus:outline-none";
export const btnCls = "grad-btn inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50";
export const btnGhostCls = "inline-flex items-center justify-center rounded-xl border border-line bg-panel2/60 px-3 py-2 text-sm text-ink hover:bg-panel2";

export function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto" });
}
