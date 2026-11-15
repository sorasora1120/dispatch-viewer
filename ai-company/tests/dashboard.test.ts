import { describe, expect, it } from "vitest";
import { countByDay, describeLog, lastDays, relTime } from "@/lib/dashboard";

describe("dashboard helpers", () => {
  const now = new Date("2026-11-15T20:00:00Z"); // 15:00 in Toronto
  it("lists the last 7 days oldest first", () => {
    const d = lastDays(now);
    expect(d).toHaveLength(7);
    expect(d[6].key).toBe("2026-11-15");
    expect(d[0].key).toBe("2026-11-09");
  });
  it("counts per day in Toronto time and ignores rows outside the range", () => {
    const d = lastDays(now);
    const c = countByDay(d, ["2026-11-15T19:00:00Z", "2026-11-15T04:00:00Z", "2026-11-01T00:00:00Z", null]);
    expect(c[6]).toBe(1); // 04:00Z on the 15th is still the 14th in Toronto
    expect(c[5]).toBe(1);
    expect(c.reduce((a, b) => a + b, 0)).toBe(2);
  });
  it("formats relative time", () => {
    expect(relTime("2026-11-15T19:58:00Z", now)).toBe("2 min ago");
    expect(relTime("2026-11-14T18:00:00Z", now)).toBe("yesterday");
  });
  it("describes logs and falls back to the action", () => {
    expect(describeLog({ actor: "user", action: "task.create", details: { title: "A" } })).toBe("New task created: A");
    expect(describeLog({ actor: "agent", action: "task.result", details: { agent: "research", title: "B" } })).toBe("Research finished: B");
    expect(describeLog({ actor: "user", action: "x.y", details: null })).toBe("x.y");
    expect(describeLog({ actor: "user", action: "task.update", details: { status: ["running", "completed"], title_now: "C" } })).toBe("Task completed: C");
    expect(describeLog({ actor: "user", action: "task.update", details: { status: ["pending", "waiting_approval"], title_now: "D" } })).toBe("Task moved to Waiting approval: D");
  });
});
