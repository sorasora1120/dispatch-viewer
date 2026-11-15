// e2e smoke test: login (wrong + right password), dashboard, AI employees, create/edit task, logs, mobile + iPad layouts.
// Usage: start tests/mock-supabase.mjs and `next start -p 3100` with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321, then: node tests/e2e.mjs <outdir>
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PW || "playwright");
const out = process.argv[2] || ".";
const base = "http://127.0.0.1:3100";
const fail = (m) => { console.error("FAIL:", m); process.exit(1); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1024, height: 1366 } }); // iPad portrait
const p = await ctx.newPage();
p.on("pageerror", (e) => fail("page error " + e.message));

await p.goto(base + "/tasks");
if (!p.url().includes("/login")) fail("not redirected to /login when signed out");
await p.fill('input[name=email]', "owner@test.local"); await p.fill('input[name=password]', "wrong-password"); await p.click("button");
await p.waitForURL(/error=/); await p.waitForLoadState("networkidle"); if (!(await p.textContent("body")).includes("incorrect")) { console.log(p.url(), (await p.textContent("body")).slice(0,300)); fail("no error on bad password"); }
await p.fill('input[name=email]', "owner@test.local"); await p.fill('input[name=password]', "correct-horse"); await p.click("button");
await p.waitForURL(base + "/");
const dash = await p.textContent("main");
if (!dash.includes("AI Employees") || !dash.includes("9")) fail("dashboard does not show 9 agents");
await p.screenshot({ path: out + "/ipad-dashboard.png", fullPage: true });

await p.goto(base + "/agents");
if ((await p.locator("article").count()) !== 9) fail("agents page does not list 9");

await p.goto(base + "/tasks");
if (!(await p.locator("details").getAttribute("open") !== null)) await p.click("summary");
await p.fill('input[name=title]', "競合の値段を調べる");
await p.selectOption('select[name=agent_id]', { label: "Research" });
await p.selectOption('select[name=priority]', "high");
await p.click("text=Create task");
await p.locator("main a", { hasText: "競合の値段を調べる" }).first().waitFor({ timeout: 15000 }).catch(() => {});
if (!(await p.textContent("main")).includes("競合の値段を調べる")) { console.log(p.url(), (await p.textContent("main")).slice(0,600)); fail("created task not listed"); }
if (!(await p.textContent("main")).includes("Assigned")) fail("task with agent should be Assigned");
await p.click("text=競合の値段を調べる");
await p.selectOption('select[name=status]', "running");
await p.click("text=Save changes");
await p.waitForURL(base + "/tasks");
await p.getByText("Running").first().waitFor({ timeout: 15000 }).catch(() => {});
if (!(await p.textContent("main")).includes("Running")) fail("status not updated");
await p.screenshot({ path: out + "/ipad-tasks.png", fullPage: true });

await p.goto(base + "/activity");
const logs = await p.textContent("main");
if (!logs.includes("auth.login") || !logs.includes("task.create") || !logs.includes("task.update")) fail("activity missing entries");

// empty title is rejected by the server action
await p.goto(base + "/tasks");
await p.click("summary");
await p.evaluate(() => { const i = document.querySelector('input[name=title]'); i.removeAttribute('required'); i.value = '   '; });
await p.click("text=Create task");
await p.waitForURL(/error=/);

const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, storageState: await ctx.storageState() });
const mp = await m.newPage();
await mp.goto(base + "/"); await mp.screenshot({ path: out + "/phone-dashboard.png", fullPage: true });
await mp.goto(base + "/agents"); await mp.screenshot({ path: out + "/phone-agents.png" });
const lp = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await lp.goto(base + "/login"); await lp.screenshot({ path: out + "/phone-login.png" });
console.log("E2E PASSED");
await b.close();
