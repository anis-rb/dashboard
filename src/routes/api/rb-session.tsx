import { createFileRoute } from "@tanstack/react-router";
function cookie(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("rb_session="))?.slice(11);
  return value ? decodeURIComponent(value) : "";
}
async function send(request: Request, action: "verifySession" | "revokeSession") {
  const sessionToken = cookie(request); if (!sessionToken) return null;
  const url = process.env.RB_SHEETS_WEBAPP_URL?.trim(), token = process.env.RB_SHEETS_ACCESS_TOKEN?.trim();
  if (!url || !token) throw new Error("Sheets connection is not configured.");
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, sessionToken, token }), cache: "no-store", signal: AbortSignal.timeout(15000) });
  return await response.json() as { ok?: boolean; profile?: { id: string; name: string; email: string; role: string } };
}
async function get({ request }: { request: Request }) {
  try { const result = await send(request, "verifySession"); const p = result?.profile; return Response.json({ user: result?.ok && p ? { id: p.id, name: p.name, email: p.email, role: p.role } : null }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ user: null }, { headers: { "Cache-Control": "no-store" } }); }
}
async function remove({ request }: { request: Request }) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Sign-out request rejected." }, { status: 403 });
  try { await send(request, "revokeSession"); } catch {}
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", "Set-Cookie": "rb_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0" } });
}
export const Route = createFileRoute("/api/rb-session")({ server: { handlers: { GET: get, DELETE: remove } } });
