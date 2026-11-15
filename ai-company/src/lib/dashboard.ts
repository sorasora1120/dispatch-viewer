// Pure helpers for the dashboard (tested in tests/dashboard.test.ts). Everything comes from real rows; nothing is invented.
export type Day = { key: string; label: string };

/** The last `n` days (oldest first) in the given time zone, as YYYY-MM-DD keys and short weekday labels. */
export function lastDays(now: Date, n = 7, timeZone = "America/Toronto"): Day[] {
  const out: Day[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    out.push({ key: dayKey(d, timeZone), label: d.toLocaleDateString("en-US", { weekday: "short", timeZone }) });
  }
  return out;
}

export function dayKey(d: Date | string, timeZone = "America/Toronto"): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString("en-CA", { timeZone }); // YYYY-MM-DD
}

/** Count rows per day for the given keys. Rows outside the range are ignored. */
export function countByDay(days: Day[], stamps: (string | null | undefined)[], timeZone = "America/Toronto"): number[] {
  const idx = new Map(days.map((d, i) => [d.key, i]));
  const out = days.map(() => 0);
  for (const s of stamps) {
    if (!s) continue;
    const i = idx.get(dayKey(s, timeZone));
    if (i !== undefined) out[i]++;
  }
  return out;
}

export function relTime(iso: string, now: Date): string {
  const s = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

type Log = { actor: string; action: string; details: Record<string, unknown> | null };
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Turn an activity log row into a short sentence. Unknown actions fall back to the raw action name. */
export function describeLog(l: Log): string {
  const d = l.details ?? {};
  const title = str(d.title) || str(d.title_now) || str(d.name) || str(d.project);
  const st = Array.isArray(d.status) ? (d.status as unknown[]) : null;
  if (l.action === "task.update" && st && st[1] === "completed") return `Task completed${title ? `: ${title}` : ""}`;
  if (l.action === "task.update" && st && typeof st[1] === "string") return `Task moved to ${cap(String(st[1]).replace("_", " "))}${title ? `: ${title}` : ""}`;
  const agent = str(d.agent);
  const map: Record<string, string> = {
    "task.create": `New task created${title ? `: ${title}` : ""}`,
    "task.insert": `New task created${title ? `: ${title}` : ""}`,
    "task.update": `Task updated${title ? `: ${title}` : ""}`,
    "task.delete": `Task deleted${title ? `: ${title}` : ""}`,
    "task.result": `${agent ? cap(agent) + " finished" : "Result added"}${title ? `: ${title}` : ""}`,
    "project.insert": `Project created${title ? `: ${title}` : ""}`,
    "project.plan": `Project planned${title ? `: ${title}` : ""}`,
    "project.delete": `Project deleted${title ? `: ${title}` : ""}`,
    "agent.create": `AI Employee added${title ? `: ${title}` : ""}`,
    "agent.update": `AI Employee updated${title ? `: ${title}` : ""}`,
    "approval.approved": "Approval granted",
    "approval.rejected": "Approval rejected",
    "auth.login": "Signed in",
    "auth.logout": "Signed out",
    "settings.update": "Settings updated",
  };
  return map[l.action] ?? l.action;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** True when a log row is a task reaching "completed". */
export function isCompletion(l: { action: string; details: Record<string, unknown> | null }) {
  const st = l.details?.status;
  return l.action === "task.update" && Array.isArray(st) && st[1] === "completed";
}
