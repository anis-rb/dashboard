import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AccessRequest, AccessStatus, Login } from "@/components/desk/login";
import { Shell } from "@/components/desk/shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadDesk } from "@/lib/rb/server";
import { normalizeSnapshot } from "@/lib/rb/sheets";
import { useDesk } from "@/lib/rb/store";
import { applyTheme } from "@/lib/rb/theme";
import type { Role, SessionUser } from "@/lib/rb/types";

type GateState =
  | { kind: "loading" }
  | { kind: "unknown" }
  | { kind: "pending" }
  | { kind: "rejected" }
  | { kind: "approved"; profile: SessionUser }
  | { kind: "error"; message: string };

export function DeskRoot() {
  const { user, isPending } = useCurrentUserState();
  const theme = useDesk((state) => state.theme);
  const [gate, setGate] = useState<GateState>({ kind: "loading" });

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    try {
      const key = "rb-desk-v1";
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as { state?: Record<string, unknown> };
        const state = saved.state;
        if (state) {
          delete state.sheetUrl;
          delete state.sheetToken;
          delete state.sessionUserId;
          for (const group of [state.admins, state.people]) {
            if (Array.isArray(group)) for (const person of group) {
              if (person && typeof person === "object") delete (person as Record<string, unknown>).passwordHash;
            }
          }
          window.localStorage.setItem(key, JSON.stringify(saved));
        }
      }
    } catch {
      // Old browser cache is untrusted; the authenticated server snapshot is authoritative.
    }
  }, []);

  useEffect(() => {
    let live = true;
    if (isPending) return () => { live = false; };
    if (!user) {
      setGate({ kind: "unknown" });
      return () => { live = false; };
    }
    setGate({ kind: "loading" });
    void loadDesk().then((result) => {
      if (!live) return;
      const profile = result.profile as {
        id?: string; name?: string; email?: string; role?: string; city?: string;
        permissions?: string; status?: string;
      } | null;
      if (!profile || profile.status === "unknown") { setGate({ kind: "unknown" }); return; }
      if (profile.status === "pending") { setGate({ kind: "pending" }); return; }
      if (profile.status !== "approved" || !profile.id || !["admin","partner","champion","city_head"].includes(profile.role || "")) {
        setGate({ kind: "rejected" }); return;
      }
      const session: SessionUser = {
        id: profile.id,
        name: profile.name || user.displayName || user.primaryEmail || "RB Desk user",
        email: profile.email || user.primaryEmail || "",
        role: profile.role as Role,
        city: profile.city || "",
        permissions: profile.permissions || "",
      };
      useDesk.getState().boot(normalizeSnapshot(result.snapshot), String(result.revision || ""));
      useDesk.getState().activateSession(session.id);
      setGate({ kind: "approved", profile: session });
    }).catch((error: unknown) => {
      if (live) setGate({ kind: "error", message: error instanceof Error ? error.message : "RB Desk data could not be loaded." });
    });
    return () => { live = false; };
  }, [user?.id, isPending]);

  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: "var(--color-surface)", color: "var(--color-fg)", border: "1px solid var(--color-line)" } }} />
      {isPending || gate.kind === "loading" ? <main className="grid min-h-screen place-items-center bg-bg text-fg"><p className="font-display text-2xl">Loading RB Desk…</p></main> : null}
      {!user && !isPending ? <Login /> : null}
      {user && gate.kind === "unknown" ? <AccessRequest suggestedName={user.displayName || ""} /> : null}
      {gate.kind === "pending" || gate.kind === "rejected" ? <AccessStatus status={gate.kind} /> : null}
      {gate.kind === "error" ? <main className="grid min-h-screen place-items-center bg-bg p-5"><section className="desk-panel grid max-w-lg gap-3 p-5"><h1 className="font-display text-2xl">RB Desk is not connected</h1><p role="alert" className="text-sm text-danger">{gate.message}</p><p className="text-sm text-muted">Ask the administrator to check the private server connection settings. Sheet URLs and access tokens are not entered on this page.</p><button className="pressable rounded-sm border border-line px-4 py-2 text-sm" onClick={()=>window.location.reload()}>Try again</button></section></main> : null}
      {gate.kind === "approved" ? <Shell key={gate.profile.id} user={gate.profile} /> : null}
    </>
  );
}
