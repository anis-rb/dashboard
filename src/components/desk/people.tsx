import { useMemo, useState } from "react";
import { useNames } from "@/components/desk/lookups";
import { Button } from "@/components/ui/button";
import { dayLabel, roleLabel } from "@/lib/rb/format";
import { useDesk } from "@/lib/rb/store";
import type { PersonStatus } from "@/lib/rb/types";
import { cn } from "@/lib/utils";

const TABS = ["pending", "approved", "rejected", "admins"] as const;

export function People() {
  const people = useDesk((state) => state.people);
  const admins = useDesk((state) => state.admins);
  const setPersonStatus = useDesk((state) => state.setPersonStatus);
  const names = useNames();
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const rows = useMemo(() => {
    if (tab === "admins") return [];
    return people.filter((person) => person.status === tab);
  }, [people, tab]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={cn("desk-chip pressable capitalize", tab === item && "border-fg")}
            onClick={() => setTab(item)}
          >
            {item === "admins" ? "Admins" : item}
            <span className="tabular-nums text-muted">
              {item === "admins" ? admins.length : people.filter((person) => person.status === item).length}
            </span>
          </button>
        ))}
      </div>
      {tab === "admins" ? (
        <div className="desk-panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                {["Name", "Email", "Phone", "Permissions"].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="h-12 border-t border-line">
                  <td className="px-4">{admin.name}</td>
                  <td className="px-4">{admin.email}</td>
                  <td className="px-4">{admin.phone}</td>
                  <td className="px-4">{admin.active ? admin.permissions : "Off"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="desk-panel overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                {["Name", "Role", "City", "Sponsor", "Email", "Since", ""].map((label) => (
                  <th key={label || "actions"} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((person) => (
                <tr key={person.id} className="h-12 border-t border-line">
                  <td className="px-4">{person.name}</td>
                  <td className="px-4">{roleLabel(person.role)}</td>
                  <td className="px-4">{person.city}</td>
                  <td className="px-4">{person.sponsorId ? names.get(person.sponsorId) || "Desk" : "Direct"}</td>
                  <td className="px-4">{person.email}</td>
                  <td className="px-4 whitespace-nowrap">{dayLabel(person.createdAt)}</td>
                  <td className="px-4">
                    <div className="flex justify-end gap-2">
                      {person.status !== "approved" ? (
                        <Button onClick={() => setPersonStatus(person.id, "approved" satisfies PersonStatus)}>Approve</Button>
                      ) : (
                        <Button variant="danger" onClick={() => setPersonStatus(person.id, "rejected")}>
                          Revoke
                        </Button>
                      )}
                      {person.status === "pending" ? (
                        <Button variant="secondary" onClick={() => setPersonStatus(person.id, "rejected")}>
                          Decline
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="px-4 py-10 text-sm text-muted">No one in this list.</p> : null}
        </div>
      )}
    </div>
  );
}
