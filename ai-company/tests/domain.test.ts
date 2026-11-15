import { describe, expect, it } from "vitest";
import { taskInput, normalizeStatus, isOverdue, projectInput } from "@/lib/domain";
import { payloadHash } from "@/lib/hash";

describe("taskInput", () => {
  it("accepts a minimal task and fills defaults", () => {
    const r = taskInput.parse({ title: "  Research competitors ", agent_id: "", project_id: "", due_date: "" });
    expect(r).toMatchObject({ title: "Research competitors", priority: "medium", status: "pending", agent_id: null, project_id: null, due_date: null });
  });
  it("rejects empty or too long titles", () => {
    expect(taskInput.safeParse({ title: " ", agent_id: "", project_id: "", due_date: "" }).success).toBe(false);
    expect(taskInput.safeParse({ title: "x".repeat(201), agent_id: "", project_id: "", due_date: "" }).success).toBe(false);
  });
  it("rejects invalid status, priority, uuid and date", () => {
    expect(taskInput.safeParse({ title: "a", status: "done", agent_id: "", project_id: "", due_date: "" }).success).toBe(false);
    expect(taskInput.safeParse({ title: "a", priority: "max", agent_id: "", project_id: "", due_date: "" }).success).toBe(false);
    expect(taskInput.safeParse({ title: "a", agent_id: "not-a-uuid", project_id: "", due_date: "" }).success).toBe(false);
    expect(taskInput.safeParse({ title: "a", agent_id: "", project_id: "", due_date: "2026/11/15" }).success).toBe(false);
  });
});

describe("normalizeStatus", () => {
  it("promotes pending to assigned when an agent is set", () => {
    expect(normalizeStatus({ status: "pending", agent_id: "5f0c3a52-8f42-4d3b-9b0a-3f6a1b2c3d4e" })).toBe("assigned");
    expect(normalizeStatus({ status: "pending", agent_id: null })).toBe("pending");
    expect(normalizeStatus({ status: "running", agent_id: "5f0c3a52-8f42-4d3b-9b0a-3f6a1b2c3d4e" })).toBe("running");
  });
});

describe("isOverdue", () => {
  const today = new Date("2026-11-15T12:00:00Z");
  it("only open tasks past due are overdue", () => {
    expect(isOverdue("2026-11-14", "running", today)).toBe(true);
    expect(isOverdue("2026-11-15", "running", today)).toBe(false);
    expect(isOverdue("2026-11-14", "completed", today)).toBe(false);
    expect(isOverdue(null, "pending", today)).toBe(false);
  });
});

describe("projectInput", () => {
  it("requires a name", () => {
    expect(projectInput.safeParse({ name: "" }).success).toBe(false);
    expect(projectInput.parse({ name: "Windsor" }).status).toBe("active");
  });
});

describe("payloadHash", () => {
  it("matches PostgreSQL sha256 hex", () => {
    // select encode(digest('Hello', 'sha256'), 'hex')
    expect(payloadHash("Hello")).toBe("185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969");
  });
});
