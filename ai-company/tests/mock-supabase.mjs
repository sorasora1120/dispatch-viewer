// Test-only stand-in for the Supabase HTTP API (auth + a few REST calls) so the UI can be clicked through in e2e tests.
// Not used by the app. Data here is test data and never shown outside tests.
import http from "node:http";
import { randomUUID } from "node:crypto";

const USER = { id: "11111111-1111-1111-1111-111111111111", aud: "authenticated", role: "authenticated", email: "owner@test.local", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const now = () => new Date().toISOString();
const names = [["ceo","CEO","Chief Executive Officer","全体統括"],["research","Research","Research Lead","競合・市場調査"],["marketing","Marketing","Marketing Lead","広告・SNS"],["product","Product","Product Lead","商品企画"],["sales","Sales","Sales Lead","営業"],["finance","Finance","Finance Lead","収支"],["creative","Creative","Creative Lead","制作"],["operations","Operations","Operations Lead","運用"],["qc","Quality Control","Quality Lead","品質管理"]];
const db = {
  users: [{ id: USER.id, display_name: "Test Owner", created_at: now() }],
  agents: names.map(([slug, name, title, specialty], i) => ({ id: randomUUID(), owner_id: USER.id, slug, name, title, specialty, duties: ["担当業務A", "担当業務B"], status: i < 2 ? "active" : "idle", config: {}, created_at: now(), updated_at: now() })),
  projects: [], tasks: [], approvals: [], activity_logs: [],
};
let logId = 1;
const log = (action, details = {}) => db.activity_logs.push({ id: logId++, owner_id: USER.id, actor: "user", action, details, entity_type: null, entity_id: details.id ?? null, created_at: now() });

function filterRows(rows, q) {
  for (const [k, v] of q) {
    if (["select", "order", "limit", "offset", "columns"].includes(k)) continue;
    const m = /^(eq|neq)\.(.*)$/.exec(v);
    if (m) rows = rows.filter((r) => (m[1] === "eq" ? String(r[k]) === m[2] : String(r[k]) !== m[2]));
  }
  return rows;
}
function embed(rows, table) {
  return rows.map((r) => {
    const o = { ...r };
    if (table === "tasks") { const a = db.agents.find((x) => x.id === r.agent_id); o.agent = a ? { name: a.name } : null; const p = db.projects.find((x) => x.id === r.project_id); o.project = p ? { name: p.name } : null; }
    if (table === "approvals") o.agent = null;
    return o;
  });
}
const send = (res, code, body, headers = {}) => { res.writeHead(code, { "content-type": "application/json", ...headers }); res.end(body === undefined ? "" : JSON.stringify(body)); };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  let body = ""; for await (const c of req) body += c;
  const json = body ? JSON.parse(body) : {};
  if (u.pathname === "/auth/v1/token") {
    if (json.password !== "correct-horse") return send(res, 400, { error: "invalid_grant", error_description: "Invalid login credentials" });
    return send(res, 200, { access_token: "test-token", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "r", user: USER });
  }
  if (u.pathname === "/auth/v1/user") return req.headers.authorization === "Bearer test-token" ? send(res, 200, USER) : send(res, 401, { msg: "no" });
  if (u.pathname === "/auth/v1/logout") return send(res, 204);
  const m = /^\/rest\/v1\/(\w+)$/.exec(u.pathname);
  if (!m) return send(res, 404, { message: "not mocked " + u.pathname });
  const table = m[1];
  if (req.headers.authorization !== "Bearer test-token") return send(res, 401, { message: "JWT required" });
  const rows = db[table];
  if (!rows) return send(res, 404, { message: "no table" });
  if (req.method === "GET" || req.method === "HEAD") {
    let r = filterRows(rows, u.searchParams);
    const total = r.length;
    const order = u.searchParams.get("order");
    if (order) { const [col, dir] = order.split("."); r = [...r].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : 1) * (dir === "desc" ? -1 : 1)); }
    const lim = u.searchParams.get("limit"); if (lim) r = r.slice(0, +lim);
    const single = (req.headers.accept || "").includes("vnd.pgrst.object");
    const out = embed(r, table);
    return send(res, 200, req.method === "HEAD" ? undefined : single ? (out[0] ?? null) : out, { "content-range": `0-${Math.max(r.length - 1, 0)}/${total}` });
  }
  if (req.method === "POST") {
    const items = Array.isArray(json) ? json : [json];
    for (const it of items) {
      const row = { id: table === "activity_logs" ? logId++ : randomUUID(), owner_id: USER.id, created_at: now(), updated_at: now(), description: "", status: table === "projects" ? "active" : "pending", priority: "medium", due_date: null, agent_id: null, project_id: null, actor: "user", details: {}, ...it };
      rows.push(row);
      if (table === "tasks") log("task.create", { id: row.id, title: row.title });
      if (table === "projects") log("project.insert", { id: row.id, name: row.name });
    }
    return send(res, 201, undefined);
  }
  if (req.method === "PATCH") {
    const r = filterRows(rows, u.searchParams);
    r.forEach((x) => { Object.assign(x, json, { updated_at: now() }); if (table === "tasks") log("task.update", { id: x.id, title: x.title }); });
    return send(res, 204, undefined, { "content-range": `0-${r.length - 1}/${r.length}` });
  }
  if (req.method === "DELETE") {
    const r = filterRows(rows, u.searchParams);
    db[table] = rows.filter((x) => !r.includes(x));
    if (table === "tasks") r.forEach((x) => log("task.delete", { id: x.id, title: x.title }));
    return send(res, 204);
  }
  send(res, 405, {});
}).listen(54321, "127.0.0.1", () => console.log("mock supabase on :54321"));
