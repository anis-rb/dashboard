import { getRequest } from "@tanstack/react-start/server";
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() { super("Unauthorized"); this.name = "UnauthorizedError"; }
}
export type VerifiedUser = { id: string; email: string; name: string; role: string; city: string; status: string };
export async function getSessionUser(): Promise<VerifiedUser | null> {
  const request = getRequest(); if (!request) return null;
  const value = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("rb_session="))?.slice(11);
  if (!value) return null;
  const url = process.env.RB_SHEETS_WEBAPP_URL?.trim(), token = process.env.RB_SHEETS_ACCESS_TOKEN?.trim();
  if (!url || !token) throw new Error("Private Sheets connection is not configured.");
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "verifySession", sessionToken: decodeURIComponent(value), token }), cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) return null;
  const result = await response.json() as { ok?: boolean; profile?: VerifiedUser };
  return result.ok && result.profile?.status === "approved" ? result.profile : null;
}
export async function requireUserId(): Promise<string> {
  const user = await getSessionUser(); if (!user) throw new UnauthorizedError(); return user.id;
}
