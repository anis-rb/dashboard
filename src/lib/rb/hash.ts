/** Workspace gate hash. Not a bank vault — the sheet stores this, never the password. */
export function hashSecret(password: string): string {
  let h = 2166136261;
  const s = `rb-desk::${password}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
