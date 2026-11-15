"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { AGENT_STATUSES, formFields, normalizeStatus, projectInput, taskInput } from "@/lib/domain";
import { payloadHash } from "@/lib/hash";

const TASK_KEYS = ["title", "description", "agent_id", "project_id", "priority", "status", "due_date"];
const back = (path: string, error?: string): never => redirect(error ? `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}` : path);

async function requireUser() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createTask(fd: FormData) {
  const { supabase } = await requireUser();
  const parsed = taskInput.safeParse(formFields(fd, TASK_KEYS));
  if (!parsed.success) back("/tasks", parsed.error.issues[0]?.message ?? "Invalid input");
  const v = parsed.data!;
  const { error } = await supabase.from("tasks").insert({ ...v, status: normalizeStatus(v) });
  if (error) back("/tasks", `Could not create the task: ${error.message}`);
  revalidatePath("/", "layout");
  back("/tasks");
}

export async function updateTask(id: string, fd: FormData) {
  const { supabase } = await requireUser();
  const parsed = taskInput.safeParse(formFields(fd, TASK_KEYS));
  if (!parsed.success) back(`/tasks/${id}`, parsed.error.issues[0]?.message ?? "Invalid input");
  const v = parsed.data!;
  const { error, count } = await supabase.from("tasks").update({ ...v, status: normalizeStatus(v) }, { count: "exact" }).eq("id", id);
  if (error) back(`/tasks/${id}`, `Could not save: ${error.message}`);
  if (count === 0) back("/tasks", "Task not found");
  revalidatePath("/", "layout");
  back("/tasks");
}

export async function setTaskStatus(id: string, fd: FormData) {
  const { supabase } = await requireUser();
  const status = String(fd.get("status") ?? "");
  const parsed = taskInput.shape.status.safeParse(status);
  if (!parsed.success) back("/tasks", "Invalid status");
  const { error } = await supabase.from("tasks").update({ status: parsed.data }).eq("id", id);
  if (error) back("/tasks", `Could not update: ${error.message}`);
  revalidatePath("/", "layout");
  back(String(fd.get("back") ?? "/tasks"));
}

export async function deleteTask(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) back(`/tasks/${id}`, `Could not delete: ${error.message}`);
  revalidatePath("/", "layout");
  back("/tasks");
}

export async function setAgentStatus(id: string, fd: FormData) {
  const { supabase } = await requireUser();
  const status = String(fd.get("status") ?? "");
  if (!(AGENT_STATUSES as readonly string[]).includes(status)) back("/agents", "Invalid status");
  const { error } = await supabase.from("agents").update({ status }).eq("id", id);
  if (error) back("/agents", `Could not update: ${error.message}`);
  revalidatePath("/", "layout");
  back("/agents");
}

export async function createProject(fd: FormData) {
  const { supabase } = await requireUser();
  const parsed = projectInput.safeParse(formFields(fd, ["name", "description", "status"]));
  if (!parsed.success) back("/projects", parsed.error.issues[0]?.message ?? "Invalid input");
  const { error } = await supabase.from("projects").insert(parsed.data!);
  if (error) back("/projects", `Could not create: ${error.message}`);
  revalidatePath("/", "layout");
  back("/projects");
}

export async function deleteProject(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) back("/projects", `Could not delete: ${error.message}`);
  revalidatePath("/", "layout");
  back("/projects");
}

/** The hash is computed from the payload the page showed. The database refuses if the stored payload changed. */
export async function decideApproval(id: string, shownPayload: string, fd: FormData) {
  const { supabase } = await requireUser();
  const decision = String(fd.get("decision"));
  if (decision !== "approved" && decision !== "rejected") back("/approvals", "Invalid decision");
  const { data, error } = await supabase.rpc("decide_approval", { p_id: id, p_decision: decision, p_hash: payloadHash(shownPayload) });
  if (error) back("/approvals", `Not applied: ${error.message}`);
  if (!data) back("/approvals", "This approval has expired.");
  revalidatePath("/", "layout");
  back("/approvals");
}

export async function updateDisplayName(fd: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(fd.get("display_name") ?? "").trim().slice(0, 60);
  const { error } = await supabase.from("users").update({ display_name: name }).eq("id", user.id);
  if (error) back("/settings", `Could not save: ${error.message}`);
  await supabase.from("activity_logs").insert({ action: "settings.update", entity_type: "user", entity_id: user.id, details: { display_name: name } });
  revalidatePath("/", "layout");
  back("/settings?saved=1");
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.from("activity_logs").insert({ action: "auth.logout" });
  await supabase.auth.signOut();
  redirect("/login");
}

/** "Ask the AI": Sora writes a request in plain words. It becomes a task for the CEO agent; Claude picks it up on its next run. */
export async function askAI(fd: FormData) {
  const { supabase } = await requireUser();
  const text = String(fd.get("text") ?? "").trim();
  if (!text) back("/", "頼みたいことを書いてください");
  if (text.length > 2000) back("/", "2000文字以内で書いてください");
  const first = text.split("\n")[0].trim();
  const title = first.length > 80 ? first.slice(0, 79) + "…" : first;
  const { data: ceo } = await supabase.from("agents").select("id").eq("slug", "ceo").maybeSingle();
  const { error } = await supabase.from("tasks").insert({ title, description: text, agent_id: ceo?.id ?? null, status: "pending", priority: "medium" });
  if (error) back("/", `送れませんでした: ${error.message}`);
  revalidatePath("/", "layout");
  redirect("/?asked=1");
}
