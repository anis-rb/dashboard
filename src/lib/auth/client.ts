export const authEnabled = true;
export const GROK_PROVIDERS: { providerId: string; label: string }[] = [];
export async function signIn(_providerId?: string, _opts?: { callbackURL?: string }): Promise<void> { window.location.assign("/login"); }
export async function signOut(redirectTo = "/"): Promise<void> {
  const response = await fetch("/api/rb-session", { method: "DELETE", credentials: "same-origin" });
  if (!response.ok) throw new Error("Sign-out failed");
  window.location.assign(redirectTo);
}
