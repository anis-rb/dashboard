import { StatusPill } from "@/components/desk/status-pill";
import { dayLabel, inr } from "@/lib/rb/format";
import { ledgerFor, ledgerTotals } from "@/lib/rb/report";
import { useDesk } from "@/lib/rb/store";
import type { SessionUser } from "@/lib/rb/types";

export function Ledger({ user, onOpen }: { user: SessionUser; onOpen: (id: string) => void }) {
  const leads = useDesk((state) => state.leads);
  const rows = ledgerFor(leads, user.id);
  const totals = ledgerTotals(rows);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Receivable" value={inr(totals.receivable)} note="Commission on leads you gave, once deposited or completed." />
        <Summary label="Payable" value={inr(totals.payable)} note="Commission on leads you took, once deposited or completed." />
        <Summary label="Net" value={inr(totals.net)} note={`Give book ${inr(totals.giveBook)} · Take book ${inr(totals.takeBook)}`} />
      </div>
      <div className="desk-panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              {["Date", "Lead", "Name", "Side", "Status", "Deal", "Commission"].map((label) => (
                <th key={label} className="px-4 py-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.leadId}-${row.side}`}
                tabIndex={0}
                className="h-12 cursor-pointer border-t border-line hover:bg-bg"
                onClick={() => onOpen(row.leadId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(row.leadId);
                  }
                }}
              >
                <td className="px-4 whitespace-nowrap">{dayLabel(row.at)}</td>
                <td className="px-4 font-mono text-xs">{row.leadId}</td>
                <td className="px-4">{row.name}</td>
                <td className="px-4">{row.side}</td>
                <td className="px-4">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 text-right tabular-nums">{inr(row.deal)}</td>
                <td className="px-4 text-right tabular-nums">{row.posted ? inr(row.commission) : "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-10 text-sm text-muted">No give or take rows yet.</p> : null}
      </div>
    </div>
  );
}

function Summary({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="desk-panel p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-xl tabular-nums">{value}</p>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </article>
  );
}
