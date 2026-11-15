import { TASK_PRIORITIES, TASK_STATUSES, STATUS_LABEL, PRIORITY_LABEL } from "@/lib/domain";
import { btnCls, inputCls } from "@/components/ui";

type Opt = { id: string; name: string };
type Task = { title: string; description: string; agent_id: string | null; project_id: string | null; priority: string; status: string; due_date: string | null };

export function TaskForm({ action, agents, projects, task, submit }: { action: (fd: FormData) => Promise<void>; agents: Opt[]; projects: Opt[]; task?: Task; submit: string }) {
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <input name="title" required maxLength={200} defaultValue={task?.title} placeholder="Task title" className={`${inputCls} md:col-span-2`} />
      <textarea name="description" maxLength={5000} defaultValue={task?.description} placeholder="Details (optional)" rows={3} className={`${inputCls} md:col-span-2`} />
      <label className="text-xs text-mute">Assignee
        <select name="agent_id" defaultValue={task?.agent_id ?? ""} className={`${inputCls} mt-1`}>
          <option value="">Unassigned</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label className="text-xs text-mute">Project
        <select name="project_id" defaultValue={task?.project_id ?? ""} className={`${inputCls} mt-1`}>
          <option value="">None</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="text-xs text-mute">Priority
        <select name="priority" defaultValue={task?.priority ?? "medium"} className={`${inputCls} mt-1`}>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
      </label>
      <label className="text-xs text-mute">Due date
        <input type="date" name="due_date" defaultValue={task?.due_date ?? ""} className={`${inputCls} mt-1`} />
      </label>
      <label className="text-xs text-mute md:col-span-2">Status
        <select name="status" defaultValue={task?.status ?? "pending"} className={`${inputCls} mt-1`}>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <div className="md:col-span-2"><button className={btnCls}>{submit}</button></div>
    </form>
  );
}
