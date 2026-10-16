import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
const schema = z.object({ identifier: z.string().trim().min(1).max(160), password: z.string().min(1).max(256) });
type Result = { ok?: boolean; profile?: { id: string; name: string; email: string; role: string; status: string }; sessionToken?: string };
function config() {
  const url = process.env.RB_SHEETS_WEBAPP_URL?.trim(), token = process.env.RB_SHEETS_ACCESS_TOKEN?.trim();
  if (!url || !token) throw new Error("Private Sheets connection is not configured.");
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) throw new Error("Invalid Sheets endpoint.");
  return { url, token };
}
async function post({ request }: { request: Request }) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Sign-in request rejected." }, { status: 403 });
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: "Enter your ID/email and password." }, { status: 400 }); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Enter your ID/email and password." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const { url, token } = config();
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "authenticate", ...parsed.data, token }), cache: "no-store", signal: AbortSignal.timeout(15000) });
    const result = await response.json() as Result;
    console.log("LOGIN DEBUG", { httpStatus: response.status, ok: result.ok, hasSession: !!result.sessionToken, profileStatus: result.profile?.status, profileRole: result.profile?.role, raw: JSON.stringify({ ...result, sessionToken: undefined }) });
    if (!response.ok || !result.ok || !result.sessionToken || result.profile?.status !== "approved") return Response.json({ error: "Incorrect credentials, or account is not active and approved." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store", "Set-Cookie": `rb_session=${encodeURIComponent(result.sessionToken)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800` } });
  } catch { return Response.json({ error: "Sign-in failed. Check the account and private Sheets connection." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
export const Route = createFileRoute("/api/rb-login")({ server: { handlers: { POST: post } } });
