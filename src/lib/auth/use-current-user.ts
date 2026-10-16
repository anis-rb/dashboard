import { useEffect, useState } from "react";
import { authEnabled } from "./client";
export type AppUser = { id: string; displayName: string | null; primaryEmail: string | null; profileImageUrl: string | null; isDevFallback: boolean };
export type CurrentUserState = { user: AppUser | null; isPending: boolean };
const DEV_USER: AppUser = { id: "dev-user", displayName: "Dev User", primaryEmail: "dev@example.com", profileImageUrl: null, isDevFallback: true };
export function useCurrentUserState(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>({ user: null, isPending: true });
  useEffect(() => {
    let live = true;
    fetch("/api/rb-session", { credentials: "same-origin", cache: "no-store" })
      .then(async (res) => res.ok ? await res.json() as { user?: { id: string; name?: string; email?: string } | null } : { user: null })
      .then(({ user }) => { if (live) setState({ user: user ? { id: user.id, displayName: user.name ?? null, primaryEmail: user.email ?? null, profileImageUrl: null, isDevFallback: false } : null, isPending: false }); })
      .catch(() => { if (live) setState({ user: null, isPending: false }); });
    return () => { live = false; };
  }, []);
  return authEnabled ? state : { user: DEV_USER, isPending: false };
}
export function useCurrentUser(): AppUser | null { return useCurrentUserState().user; }
