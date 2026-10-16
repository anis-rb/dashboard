import { Menu } from "@/components/ui/menu";
import { useNames } from "@/components/desk/lookups";
import type { DatePreset, FilterState, Lead, Quality, Service, Status } from "@/lib/rb/types";
import { emptyFilters, QUALITIES, SOURCES, STATUSES } from "@/lib/rb/types";
import { filtersActive } from "@/lib/rb/query";

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "any", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "lastmonth", label: "Last month" },
  { id: "custom", label: "Custom range" },
];

export function FilterBar({
  filters,
  setFilters,
  leads,
  services,
  showPartner,
  showOwner,
}: {
  filters: FilterState;
  setFilters: (next: FilterState | ((current: FilterState) => FilterState)) => void;
  leads: Lead[];
  services: Service[];
  showPartner: boolean;
  showOwner: boolean;
}) {
  const names = useNames();
  const partnerIds = [...new Set(leads.map((lead) => lead.takeId || "__none"))];
  const ownerIds = [...new Set(leads.map((lead) => lead.ownerId || "__none"))];
  const sources = [...new Set([...SOURCES, ...leads.map((lead) => lead.source)])];
  const serviceIds = [...new Set(leads.map((lead) => lead.serviceId).filter(Boolean))];
  const dateLabel = PRESETS.find((item) => item.id === filters.preset)?.label ?? "Date";

  function patch(partial: Partial<FilterState>) {
    setFilters((current) => ({ ...current, ...partial }));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Menu label={filters.preset === "any" ? "Date" : dateLabel} active={filters.preset !== "any"}>
        <div className="grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="min-h-11 rounded-sm px-3 text-left text-sm hover:bg-bg"
              onClick={() => patch({ preset: preset.id })}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {filters.preset === "custom" ? (
          <div className="grid gap-2 border-t border-line p-2">
            <label className="grid gap-1 text-xs text-muted">
              From
              <input className="desk-field" type="date" value={filters.from} onChange={(e) => patch({ from: e.target.value, preset: "custom" })} />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              To
              <input className="desk-field" type="date" value={filters.to} onChange={(e) => patch({ to: e.target.value, preset: "custom" })} />
            </label>
          </div>
        ) : null}
      </Menu>
      <Menu
        label={filters.excludeStatus && filters.statuses.length ? "Exclude status" : "Status"}
        active={filters.statuses.length > 0}
        count={filters.statuses.length || undefined}
      >
        <CheckList
          options={STATUSES.map((status) => ({ id: status, label: status }))}
          selected={filters.statuses}
          onChange={(statuses) => patch({ statuses: statuses as Status[] })}
        />
        <button
          type="button"
          role="switch"
          aria-checked={filters.excludeStatus}
          className="mt-1 flex min-h-11 w-full items-center justify-between border-t border-line px-3 text-sm"
          onClick={() => patch({ excludeStatus: !filters.excludeStatus })}
        >
          Exclude selected
          <span className={filters.excludeStatus ? "h-6 w-11 rounded-full bg-fg p-0.5" : "h-6 w-11 rounded-full bg-line p-0.5"}>
            <span className={filters.excludeStatus ? "block size-5 translate-x-5 rounded-full bg-surface" : "block size-5 rounded-full bg-surface"} />
          </span>
        </button>
      </Menu>
      {showPartner ? (
        <Menu label="Partner" active={filters.partners.length > 0} count={filters.partners.length || undefined}>
          <CheckList
            options={partnerIds.map((id) => ({ id, label: id === "__none" ? "Unassigned" : names.get(id) || id }))}
            selected={filters.partners}
            onChange={(partners) => patch({ partners })}
          />
        </Menu>
      ) : null}
      <Menu label="Source" active={filters.sources.length > 0} count={filters.sources.length || undefined}>
        <CheckList options={sources.map((id) => ({ id, label: id }))} selected={filters.sources} onChange={(sourcesNext) => patch({ sources: sourcesNext })} />
      </Menu>
      {showOwner ? (
        <Menu label="Owner" active={filters.owners.length > 0} count={filters.owners.length || undefined}>
          <CheckList
            options={ownerIds.map((id) => ({ id, label: id === "__none" ? "Unassigned" : names.get(id) || id }))}
            selected={filters.owners}
            onChange={(owners) => patch({ owners })}
          />
        </Menu>
      ) : null}
      <Menu label="Quality" active={filters.qualities.length > 0} count={filters.qualities.length || undefined}>
        <CheckList
          options={QUALITIES.map((quality) => ({ id: quality, label: quality }))}
          selected={filters.qualities}
          onChange={(qualities) => patch({ qualities: qualities as Quality[] })}
        />
      </Menu>
      <Menu label="Service" active={filters.services.length > 0} count={filters.services.length || undefined}>
        <CheckList
          options={serviceIds.map((id) => ({
            id,
            label: services.find((service) => service.id === id)?.name || id,
          }))}
          selected={filters.services}
          onChange={(serviceIdsNext) => patch({ services: serviceIdsNext })}
        />
      </Menu>
      {filtersActive(filters) ? (
        <button type="button" className="min-h-11 px-3 text-sm text-muted" onClick={() => setFilters(emptyFilters())}>
          Clear
        </button>
      ) : null}
    </div>
  );
}

function CheckList({
  options,
  selected,
  onChange,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  if (!options.length) return <p className="px-3 py-3 text-sm text-muted">Nothing in this cut.</p>;
  return (
    <div className="max-h-72 overflow-auto">
      {options.map((option) => {
        const on = selected.includes(option.id);
        return (
          <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-fg"
              checked={on}
              onChange={() => onChange(on ? selected.filter((id) => id !== option.id) : [...selected, option.id])}
            />
            <span className="truncate">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
