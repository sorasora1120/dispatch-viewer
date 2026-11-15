import { z } from "zod";

export const TASK_STATUSES = ["pending", "assigned", "running", "review", "waiting_approval", "completed", "failed", "cancelled"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const AGENT_STATUSES = ["idle", "active", "paused", "error"] as const;
export const PROJECT_STATUSES = ["active", "paused", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  running: "Running",
  review: "Review",
  waiting_approval: "Waiting Approval",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};
export const PRIORITY_LABEL: Record<TaskPriority, string> = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
export const OPEN_STATUSES: TaskStatus[] = ["pending", "assigned", "running", "review", "waiting_approval"];

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.string().uuid().nullable());
const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").nullable());

export const taskInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().trim().max(5000).default(""),
  agent_id: optionalUuid,
  project_id: optionalUuid,
  priority: z.enum(TASK_PRIORITIES).default("medium"),
  status: z.enum(TASK_STATUSES).default("pending"),
  due_date: optionalDate,
});
export type TaskInput = z.infer<typeof taskInput>;

export const projectInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).default(""),
  status: z.enum(PROJECT_STATUSES).default("active"),
});

/** A new task with an agent but still "pending" is promoted to "assigned". */
export function normalizeStatus(input: Pick<TaskInput, "agent_id" | "status">): TaskStatus {
  if (input.status === "pending" && input.agent_id) return "assigned";
  return input.status;
}

export function formFields(fd: FormData, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = fd.get(k);
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export function isOverdue(due: string | null, status: TaskStatus, today = new Date()): boolean {
  if (!due || !OPEN_STATUSES.includes(status)) return false;
  const t = today.toISOString().slice(0, 10);
  return due < t;
}
