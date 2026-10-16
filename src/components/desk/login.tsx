import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import { requestDeskAccess } from "@/lib/rb/server";
import type { PersonRole } from "@/lib/rb/types";

export function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/rb-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Sign-in failed.");
      window.location.assign("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg p-5">
      <section className="desk-panel w-full max-w-md p-5 sm:p-7">
        <h1 className="font-display text-2xl">Sign in to RB Desk</h1>
        <p className="mt-2 text-sm text-muted">Use your RefBuddy ID or email and password.</p>
        {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
        <form className="mt-5 grid gap-3" onSubmit={submit}>
          <Field label="Unique ID or email">
            <input className="desk-field" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </Field>
          <Field label="Password">
            <input className="desk-field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" className="mt-1 w-full" disabled={busy}>{busy ? "Checking credentials..." : "Sign in"}</Button>
        </form>
      </section>
    </main>
  );
}

export function AccessRequest({ suggestedName }: { suggestedName: string }) {
  const [name,setName]=useState(suggestedName);const [phone,setPhone]=useState("");const [city,setCity]=useState("");const [role,setRole]=useState<PersonRole>("partner");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError("");try{await requestDeskAccess({data:{name,phone,city,role}});window.location.reload()}catch(e){setError(e instanceof Error?e.message:"Could not submit request")}finally{setBusy(false)}}
  return <main className="grid min-h-screen place-items-center bg-bg p-5"><form onSubmit={submit} className="desk-panel grid w-full max-w-md gap-3 p-5"><h1 className="font-display text-2xl">Request RB Desk access</h1><p className="text-sm text-muted">Your request remains pending until an administrator approves it.</p><Field label="Name"><input className="desk-field" value={name} onChange={e=>setName(e.target.value)} required /></Field><Field label="Phone"><input className="desk-field" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required /></Field><Field label="City"><input className="desk-field" value={city} onChange={e=>setCity(e.target.value)} required /></Field><Field label="Role"><select className="desk-field" value={role} onChange={e=>setRole(e.target.value as PersonRole)}><option value="partner">Partner</option><option value="champion">Champion</option><option value="city_head">City Head</option></select></Field>{error?<p role="alert" className="text-sm text-danger">{error}</p>:null}<Button disabled={busy}>{busy?"Sending…":"Send access request"}</Button><Button type="button" variant="ghost" onClick={()=>void signOut("/")}>Sign out</Button></form></main>;
}
export function AccessStatus({ status }: { status: "pending"|"rejected" }) { return <main className="grid min-h-screen place-items-center bg-bg p-5"><div className="desk-panel grid max-w-md gap-3 p-6"><h1 className="font-display text-2xl">{status==="pending"?"Request awaiting approval":"Access not approved"}</h1><p className="text-sm text-muted">{status==="pending"?"An administrator must approve your RB Registration entry before you can access leads.":"This RB Desk account is inactive or was declined. Contact an administrator if you think this is an error."}</p><Button onClick={()=>void signOut("/")}>Sign out</Button></div></main> }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1 text-sm"><span className="font-medium">{label}</span>{children}</label> }
