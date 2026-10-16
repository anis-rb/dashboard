import {
  endOfDay,
  endOfMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import type { DatePreset, FilterState, Lead, Status } from "@/lib/rb/types";
import { STATUSES } from "@/lib/rb/types";

export function inDateRange(
  iso: string,
  preset: DatePreset,
  from: string,
  to: string,
  now = new Date(),
): boolean {
  if (preset === "any") return true;
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return false;
  if (preset === "custom") {
    if (!from && !to) return true;
    const start = from ? startOfDay(parseISO(from)) : new Date(0);
    const end = to ? endOfDay(parseISO(to)) : new Date(8.64e15);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
    return isWithinInterval(d, { start, end });
  }
  let start: Date;
  let end: Date;
  if (preset === "today") {
    start = startOfDay(now);
    end = endOfDay(now);
  } else if (preset === "yesterday") {
    const y = subDays(now, 1);
    start = startOfDay(y);
    end = endOfDay(y);
  } else if (preset === "7") {
    start = startOfDay(subDays(now, 6));
    end = endOfDay(now);
  } else if (preset === "30") {
    start = startOfDay(subDays(now, 29));
    end = endOfDay(now);
  } else if (preset === "month") {
    start = startOfMonth(now);
    end = endOfDay(now);
  } else {
    const last = subMonths(now, 1);
    start = startOfMonth(last);
    end = endOfMonth(last);
  }
  return isWithinInterval(d, { start, end });
}

export function applyFilters(leads: Lead[], f: FilterState, opts?: { ignoreStatus?: boolean }): Lead[] {
  const q = f.query.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  return leads.filter((lead) => {
    if (!opts?.ignoreStatus && f.statuses.length) {
      const hit = f.statuses.includes(lead.status);
      if (f.excludeStatus ? hit : !hit) return false;
    }
    if (!inDateRange(lead.createdAt, f.preset, f.from, f.to)) return false;
    if (f.partners.length && !f.partners.includes(lead.takeId || "__none")) return false;
    if (f.sources.length && !f.sources.includes(lead.source)) return false;
    if (f.owners.length && !f.owners.includes(lead.ownerId || "__none")) return false;
    if (f.qualities.length && !f.qualities.includes(lead.quality)) return false;
    if (f.services.length && !f.services.includes(lead.serviceId)) return false;
    if (q) {
      const hay = `${lead.id} ${lead.name} ${lead.giveId} ${lead.takeId}`.toLowerCase();
      const phone = lead.phone.replace(/\D/g, "");
      const textHit = hay.includes(q);
      const phoneHit = qDigits.length >= 3 && phone.includes(qDigits);
      if (!textHit && !phoneHit) return false;
    }
    return true;
  });
}

export function countStatuses(leads: Lead[]): Record<Status, number> {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<Status, number>;
  for (const lead of leads) counts[lead.status] += 1;
  return counts;
}

export function filtersActive(f: FilterState): boolean {
  return (
    f.preset !== "any" ||
    f.query.trim().length > 0 ||
    f.statuses.length > 0 ||
    f.partners.length > 0 ||
    f.sources.length > 0 ||
    f.owners.length > 0 ||
    f.qualities.length > 0 ||
    f.services.length > 0
  );
}

export function nextLeadId(_leads: Lead[]): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `LD-${uuid.toUpperCase()}`;
}
