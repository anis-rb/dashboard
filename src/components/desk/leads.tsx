import { useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/desk/filters";
import { useNames } from "@/components/desk/lookups";
import { StatusPill } from "@/components/desk/status-pill";
import { Button } from "@/components/ui/button";
import { canCreate, deskLeads } from "@/lib/rb/access";
import { dayLabel, inr } from "@/lib/rb/format";
import { applyFilters, countStatuses } from "@/lib/rb/query";
import { useDesk } from "@/lib/rb/store";
import type { FilterState, SessionUser, Status } from "@/lib/rb/types";
import { STATUSES } from "@/lib/rb/types";
import { cn } from "@/lib/utils";

const PAGE = 20;

export function Leads({
  user,
  filters,
  setFilters,
  openId,
  onOpen,
}: {
  user: SessionUser;
  filters: FilterState;
  setFilters: (next: FilterState | ((current: FilterState) => FilterState)) => void;
  openId: string | null;
  onOpen: (id: string) => void;
}) {
  const leads = useDesk((state) => state.leads);
  const services = useDesk((state) => state.services);
  const names = useNames();
  const [page, setPage] = useState(0);
  const base = useMemo(() => deskLeads(leads, user), [leads, user]);
  const counted = useMemo(() => applyFilters(base, filters, { ignoreStatus: true }), [base, filters]);
  const shown = useMemo(() => applyFilters(base, filters), [base, filters]);
  const counts = useMemo(() => countStatuses(counted), [counted]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const slice = shown.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const serviceName = useMemo(() => new Map(services.map((service) => [service.id, service.name])), [services]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          Showing {shown.length} of {base.length}
        </p>
        {canCreate(user.role) ? (
          <Button onClick={() => onOpen("new")}>{user.role === "admin" ? "New lead" : "Refer a lead"}</Button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {STATUSES.map((status) => {
          const active = !filters.excludeStatus && filters.statuses.includes(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setFilters((current) => {
                  const on = current.statuses.length === 1 && current.statuses[0] === status && !current.excludeStatus;
                  return { ...current, statuses: on ? [] : [status], excludeStatus: false };
                })
              }
              className={cn(
                "pressable flex min-h-20 flex-col items-start justify-between rounded-xl border px-4 py-3 text-left",
                active ? "border-fg bg-fg text-surface" : "border-line bg-surface text-fg",
              )}
            >
              <span className={cn("text-xs", active ? "text-surface/70" : "text-muted")}>{status}</span>
              <span className="text-xl tabular-nums">{counts[status]}</span>
            </button>
          );
        })}
      </div>
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        leads={base}
        services={services}
        showPartner={user.role !== "partner"}
        showOwner={user.role === "admin" || user.role === "city_head"}
      />
      <div className="desk-panel overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-surface text-xs text-muted">
              <tr>
                {["Lead", "Name", "Phone", "Status", "City", "Service", "Source", "Partner", "Quality", "Deal", "Updated"].map(
                  (label) => (
                    <th key={label} scope="col" className="px-3 py-3 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {slice.map((lead) => (
                <tr
                  key={lead.id}
                  tabIndex={0}
                  className={cn(
                    "h-12 cursor-pointer border-t border-line hover:bg-bg",
                    openId === lead.id && "bg-bg",
                  )}
                  onClick={() => onOpen(lead.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(lead.id);
                    }
                  }}
                >
                  <td className="px-3 font-mono text-xs">{lead.id}</td>
                  <td className="max-w-48 truncate px-3">{lead.name}</td>
                  <td className="px-3 whitespace-nowrap">{lead.phone}</td>
                  <td className="px-3">
                    <StatusPill status={lead.status as Status} />
                  </td>
                  <td className="px-3">{lead.city}</td>
                  <td className="px-3">{serviceName.get(lead.serviceId) || lead.serviceId}</td>
                  <td className="px-3">{lead.source}</td>
                  <td className="px-3">{lead.takeId ? names.get(lead.takeId) || lead.takeId : "Unassigned"}</td>
                  <td className="px-3">{lead.quality}</td>
                  <td className="px-3 text-right tabular-nums">{inr(lead.dealValue)}</td>
                  <td className="px-3 whitespace-nowrap text-muted">{dayLabel(lead.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {slice.length === 0 ? <p className="px-4 py-10 text-sm text-muted">No leads in this cut.</p> : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="text-sm text-muted tabular-nums">
            {shown.length === 0 ? "0" : `${safePage * PAGE + 1}–${Math.min(shown.length, safePage * PAGE + PAGE)}`} of {shown.length}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
