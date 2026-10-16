import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { dayLabel, roleLabel } from "@/lib/rb/format";
import { useDesk } from "@/lib/rb/store";
import type { PersonRole, SessionUser } from "@/lib/rb/types";

export function Onboard({ user }: { user: SessionUser }) {
  const signup = useDesk((state) => state.signup);
  const people = useDesk((state) => state.people);
  const mine = people.filter((person) => person.sponsorId === user.id);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: user.city === "All" ? "" : user.city,
    role: "champion" as PersonRole,
  });
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = signup({ ...form, sponsorId: user.id });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setForm({ ...form, name: "", email: "", phone: "" });
    toast.success("Sent for admin approval");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form onSubmit={submit} className="desk-panel grid h-fit gap-3 p-4">
        <h2 className="font-display text-xl">Bring someone in</h2>
        <p className="text-sm text-muted">They stay pending until an admin approves the seat.</p>
        <label className="grid gap-1 text-sm">
          Name
          <input className="desk-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="grid gap-1 text-sm">
          Email
          <input className="desk-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label className="grid gap-1 text-sm">
          Phone
          <input className="desk-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        </label>
        <label className="grid gap-1 text-sm">
          City
          <input className="desk-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        </label>
        <label className="grid gap-1 text-sm">
          Role
          <select className="desk-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as PersonRole })}>
            <option value="partner">Partner</option>
            <option value="champion">Champion</option>
          </select>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit">Submit for approval</Button>
      </form>
      <div className="desk-panel overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              {["Name", "Role", "City", "Status", "Since"].map((label) => (
                <th key={label} className="px-4 py-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mine.map((person) => (
              <tr key={person.id} className="h-12 border-t border-line">
                <td className="px-4">{person.name}</td>
                <td className="px-4">{roleLabel(person.role)}</td>
                <td className="px-4">{person.city}</td>
                <td className="px-4 capitalize">{person.status}</td>
                <td className="px-4">{dayLabel(person.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {mine.length === 0 ? <p className="px-4 py-10 text-sm text-muted">You have not brought anyone in yet.</p> : null}
      </div>
    </div>
  );
}
