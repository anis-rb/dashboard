import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { z } from "zod";
import type { Snapshot, Role } from "@/lib/rb/types";

type DeskProfile = { id: string; name: string; email: string; role: Role; city: string; permissions: string; status: "approved" | "pending" | "rejected" | "unknown" };
type SheetsResult = { profile?: DeskProfile; snapshot?: Snapshot; revision?: string; ok?: boolean; status?: string; error?: string; rows?: Snapshot["leads"]; nextOffset?: number | null; leadCount?: number };

const inputProfile = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().min(5).max(40), city: z.string().trim().min(2).max(80), role: z.enum(["partner","champion","city_head"]) });
const inputSnapshot = z.object({
  snapshot: z.custom<Snapshot>((value) => {
    if (!value || typeof value !== "object" || !Array.isArray((value as Snapshot).leads)) return false;
    try { return JSON.stringify(value).length <= 2_000_000; } catch { return false; }
  }),
  revision: z.string().max(100).optional(),
});

async function identity(user: { email: string; name: string }) {
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) throw new Error("Your Sheet account identity could not be verified.");
  return { email, name: user.name || email };
}

function endpoint() {
  const url = process.env.RB_SHEETS_WEBAPP_URL?.trim();
  const token = process.env.RB_SHEETS_ACCESS_TOKEN?.trim();
  if (!url || !token) throw new Error("The administrator has not configured the private Sheets connection.");
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) throw new Error("The configured Sheets endpoint is invalid.");
  return { url, token };
}

async function callSheets<T extends SheetsResult = SheetsResult>(payload: Record<string, unknown>): Promise<T> {
  const { url, token } = endpoint();
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...payload, token }), cache: "no-store", signal: AbortSignal.timeout(30_000) });
  const body = await response.text();
  let data: Record<string, unknown>;
  try { data = JSON.parse(body) as Record<string, unknown>; } catch { throw new Error("The Google Sheets service returned an invalid response."); }
  if (!response.ok || data.error) throw new Error(typeof data.error === "string" ? data.error : "Google Sheets request failed.");
  return data as T;
}

export const loadDesk = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
  const who = await identity(context.rbIdentity);
  const result = await callSheets<{ profile: DeskProfile; snapshot: Snapshot; revision: string; nextOffset: number | null }>({ action: "bootstrap", email: who.email });
  const snapshot = result.snapshot;
  let offset = result.nextOffset;
  for (let page = 0; offset !== null && page < 19; page += 1) {
    const chunk = await callSheets<{ rows: Snapshot["leads"]; nextOffset: number | null }>({ action: "leadPage", email: who.email, offset, limit: 500 });
    snapshot.leads.push(...chunk.rows);
    offset = chunk.nextOffset;
  }
  if (offset !== null) throw new Error("This Sheet has more than 10,000 leads in your scope. Narrow the data or archive older rows before loading the dashboard.");
  return { profile: result.profile, snapshot, revision: String(result.revision ?? "") };
});

export const requestDeskAccess = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(inputProfile).handler(async ({ context, data }) => {
  const who = await identity(context.rbIdentity);
  return await callSheets<{ ok: boolean; status: string }>({ action: "requestAccess", email: who.email, accountName: who.name, data });
});

export const commitDesk = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(inputSnapshot).handler(async ({ context, data }) => {
  const who = await identity(context.rbIdentity);
  return await callSheets<{ ok: boolean; revision: string }>({ action: "commit", email: who.email, snapshot: data.snapshot, revision: data.revision ?? "" });
});

export const approveDeskUser = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(z.object({ id: z.string().min(1), status: z.enum(["approved","rejected"]) })).handler(async ({ context, data }) => {
  const who = await identity(context.rbIdentity);
  return await callSheets<{ ok: boolean }>({ action: "approve", email: who.email, id: data.id, status: data.status });
});

