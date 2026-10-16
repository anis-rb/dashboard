import { format, parseISO, subMonths } from "date-fns";
import type { Lead, Status } from "@/lib/rb/types";
import { STATUSES } from "@/lib/rb/types";

const POSTED = new Set<Status>(["Deposited", "Completed"]);
const DEAD = new Set<Status>(["Lost", "Failed"]);

export interface LedgerRow {
  leadId: string;
  name: string;
  at: string;
  side: "Give" | "Take";
  status: Status;
  deal: number;
  commission: number;
  posted: boolean;
}

export function ledgerFor(leads: Lead[], userId: string): LedgerRow[] {
  const rows: LedgerRow[] = [];
  for (const lead of leads) {
    if (lead.giveId === userId) {
      rows.push({
        leadId: lead.id,
        name: lead.name,
        at: lead.createdAt,
        side: "Give",
        status: lead.status,
        deal: lead.dealValue,
        commission: lead.commission,
        posted: POSTED.has(lead.status),
      });
    }
    if (lead.takeId === userId) {
      rows.push({
        leadId: lead.id,
        name: lead.name,
        at: lead.createdAt,
        side: "Take",
        status: lead.status,
        deal: lead.dealValue,
        commission: lead.commission,
        posted: POSTED.has(lead.status),
      });
    }
  }
  return rows.sort((a, b) => b.at.localeCompare(a.at));
}

export function ledgerTotals(rows: LedgerRow[]) {
  let receivable = 0;
  let payable = 0;
  let giveBook = 0;
  let takeBook = 0;
  for (const row of rows) {
    const open = !DEAD.has(row.status);
    if (row.side === "Give") {
      if (open) giveBook += row.deal;
      if (row.posted) receivable += row.commission;
    } else {
      if (open) takeBook += row.deal;
      if (row.posted) payable += row.commission;
    }
  }
  return { receivable, payable, net: receivable - payable, giveBook, takeBook };
}

export interface SourceRow {
  source: string;
  total: number;
  completed: number;
  deposited: number;
  rate: number;
  deal: number;
  commission: number;
}

export function sourceReport(leads: Lead[]): SourceRow[] {
  const map = new Map<string, SourceRow>();
  for (const lead of leads) {
    const row = map.get(lead.source) ?? {
      source: lead.source,
      total: 0,
      completed: 0,
      deposited: 0,
      rate: 0,
      deal: 0,
      commission: 0,
    };
    row.total += 1;
    if (lead.status === "Completed") row.completed += 1;
    if (lead.status === "Deposited") row.deposited += 1;
    if (POSTED.has(lead.status)) {
      row.deal += lead.dealValue;
      row.commission += lead.commission;
    }
    map.set(lead.source, row);
  }
  return [...map.values()]
    .map((row) => ({ ...row, rate: row.total ? Math.round((row.completed / row.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}

export interface PartnerRow {
  id: string;
  name: string;
  taken: number;
  completed: number;
  lost: number;
  deal: number;
  commission: number;
}

export function partnerReport(leads: Lead[], names: Map<string, string>): PartnerRow[] {
  const map = new Map<string, PartnerRow>();
  for (const lead of leads) {
    const id = lead.takeId || "";
    const row = map.get(id) ?? {
      id,
      name: id ? names.get(id) || id : "Unassigned",
      taken: 0,
      completed: 0,
      lost: 0,
      deal: 0,
      commission: 0,
    };
    row.taken += 1;
    if (lead.status === "Completed") {
      row.completed += 1;
      row.deal += lead.dealValue;
      row.commission += lead.commission;
    }
    if (lead.status === "Lost" || lead.status === "Failed") row.lost += 1;
    map.set(id, row);
  }
  return [...map.values()].sort((a, b) => b.taken - a.taken);
}

const FUNNEL_KEYS = [
  ["New Enquiry", "In Progress"],
  ["In Progress", "Pending"],
  ["Pending", "Deposited"],
  ["Deposited", "Completed"],
] as const;

export interface MonthFunnel {
  month: string;
  label: string;
  steps: number[];
  lost: number;
  failed: number;
}

export function funnelMonths(leads: Lead[]): MonthFunnel[] {
  const map = new Map<string, MonthFunnel>();
  const ensure = (month: string) => {
    let row = map.get(month);
    if (!row) {
      const parsed = parseISO(`${month}-01`);
      row = {
        month,
        label: Number.isNaN(parsed.getTime()) ? month : format(parsed, "MMM yyyy"),
        steps: FUNNEL_KEYS.map(() => 0),
        lost: 0,
        failed: 0,
      };
      map.set(month, row);
    }
    return row;
  };
  for (const lead of leads) {
    for (const event of lead.history) {
      const month = event.at.slice(0, 7);
      if (!month) continue;
      const row = ensure(month);
      const idx = FUNNEL_KEYS.findIndex(([from, to]) => event.from === from && event.to === to);
      if (idx >= 0) row.steps[idx] = (row.steps[idx] ?? 0) + 1;
      if (event.to === "Lost") row.lost += 1;
      if (event.to === "Failed") row.failed += 1;
    }
  }
  return [...map.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export function monthlyRevenue(leads: Lead[], now = new Date()) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM"), deal: 0, commission: 0 });
  }
  for (const lead of leads) {
    if (lead.status !== "Completed" && lead.status !== "Deposited") continue;
    const event = [...lead.history].reverse().find((item) => item.to === lead.status);
    const key = (event?.at ?? lead.updatedAt).slice(0, 7);
    const row = months.find((month) => month.key === key);
    if (!row) continue;
    row.deal += lead.dealValue;
    row.commission += lead.commission;
  }
  return months;
}

export function pipelineCounts(leads: Lead[]) {
  return STATUSES.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));
}

export function bookValue(leads: Lead[], statuses: Status[]) {
  const set = new Set(statuses);
  return leads.filter((lead) => set.has(lead.status)).reduce((sum, lead) => sum + lead.dealValue, 0);
}

export function bookCommission(leads: Lead[], statuses: Status[]) {
  const set = new Set(statuses);
  return leads.filter((lead) => set.has(lead.status)).reduce((sum, lead) => sum + lead.commission, 0);
}
