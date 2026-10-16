import { DEFAULT_THEME } from "@/lib/rb/theme";
import type {
  Admin,
  Campaign,
  Category,
  DeptMetric,
  Lead,
  Person,
  PersonRole,
  PersonStatus,
  Quality,
  Service,
  Snapshot,
  Status,
  StatusEvent,
  ThemeConfig,
} from "@/lib/rb/types";
import { QUALITIES, STATUSES } from "@/lib/rb/types";

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "TRUE" || value === 1 || value === "1") return true;
  if (value === "false" || value === "FALSE" || value === 0 || value === "0") return false;
  return fallback;
}

function asRole(value: unknown): PersonRole {
  const s = String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (s === "champion" || s === "partner" || s === "city_head") return s;
  if (s === "cityhead") return "city_head";
  return "partner";
}

function asPersonStatus(value: unknown): PersonStatus {
  const s = String(value ?? "pending").toLowerCase();
  if (s === "approved" || s === "rejected" || s === "pending") return s;
  return "pending";
}

function asStatus(value: unknown): Status {
  const s = String(value ?? "");
  return (STATUSES as readonly string[]).includes(s) ? (s as Status) : "Other";
}

function asQuality(value: unknown): Quality {
  const s = String(value ?? "Warm");
  return (QUALITIES as readonly string[]).includes(s) ? (s as Quality) : "Warm";
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

function asHistory(value: unknown): StatusEvent[] {
  const list = Array.isArray(value) ? value : typeof value === "string" && value ? safeJson(value) : [];
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const event = item as Record<string, unknown>;
    if (typeof event.at !== "string" || typeof event.to !== "string") return [];
    return [{ at: event.at, from: String(event.from ?? ""), to: event.to, by: String(event.by ?? "") }];
  });
}

function row(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function normalizeTheme(raw: unknown): ThemeConfig {
  const source = Array.isArray(raw) ? raw[0] : raw;
  const record = row(source) ?? {};
  const pick = (key: keyof ThemeConfig) => {
    const value = record[key];
    return typeof value === "string" && value.trim() ? value : DEFAULT_THEME[key];
  };
  return {
    primary: pick("primary"),
    primaryFg: pick("primaryFg"),
    secondary: pick("secondary"),
    background: pick("background"),
    surface: pick("surface"),
    ink: pick("ink"),
    sidebar: pick("sidebar"),
    line: pick("line"),
    radius: pick("radius"),
  };
}

export function normalizeSnapshot(raw: unknown): Snapshot {
  const record = row(raw) ?? {};
  const admins = (Array.isArray(record.admins) ? record.admins : []).flatMap((item) => {
    const r = row(item);
    if (!r || typeof r.id !== "string" || !r.id) return [];
    const admin: Admin = {
      id: r.id,
      name: String(r.name ?? ""),
      email: String(r.email ?? "").toLowerCase(),
      phone: String(r.phone ?? ""),
      passwordHash: String(r.passwordHash ?? ""),
      permissions: String(r.permissions ?? "full"),
      active: asBool(r.active, true),
    };
    return [admin];
  });
  const registration = (Array.isArray(record.registration) ? record.registration : []).flatMap((item) => {
    const r = row(item);
    if (!r || typeof r.id !== "string" || !r.id) return [];
    const person: Person = {
      id: r.id,
      name: String(r.name ?? ""),
      email: String(r.email ?? "").toLowerCase(),
      phone: String(r.phone ?? ""),
      role: asRole(r.role),
      city: String(r.city ?? ""),
      status: asPersonStatus(r.status),
      sponsorId: String(r.sponsorId ?? ""),
      passwordHash: String(r.passwordHash ?? ""),
      createdAt: String(r.createdAt ?? new Date().toISOString()),
    };
    return [person];
  });
  const leads = (Array.isArray(record.leads) ? record.leads : []).flatMap((item) => {
    const r = row(item);
    if (!r || typeof r.id !== "string" || !r.id) return [];
    const createdAt = String(r.createdAt ?? new Date().toISOString());
    const lead: Lead = {
      id: r.id,
      name: String(r.name ?? ""),
      phone: String(r.phone ?? ""),
      email: String(r.email ?? ""),
      serviceId: String(r.serviceId ?? ""),
      source: String(r.source ?? "Website"),
      quality: asQuality(r.quality),
      status: asStatus(r.status),
      giveId: String(r.giveId ?? ""),
      takeId: String(r.takeId ?? ""),
      ownerId: String(r.ownerId ?? ""),
      dealValue: Math.max(0, Math.round(Number(r.dealValue) || 0)),
      commission: Math.max(0, Math.round(Number(r.commission) || 0)),
      city: String(r.city ?? ""),
      notes: String(r.notes ?? ""),
      createdAt,
      updatedAt: String(r.updatedAt ?? createdAt),
      history: asHistory(r.history),
    };
    return [lead];
  });
  const categories = (Array.isArray(record.categories) ? record.categories : []).flatMap((item) => {
    const r = row(item);
    if (!r || typeof r.id !== "string" || !r.id) return [];
    const category: Category = {
      id: r.id,
      name: String(r.name ?? "Category"),
      blurb: String(r.blurb ?? ""),
      sort: Number(r.sort) || 0,
      published: asBool(r.published, true),
    };
    return [category];
  });
  const services = (Array.isArray(record.services) ? record.services : []).flatMap((item) => {
    const r = row(item);
    if (!r || typeof r.id !== "string" || !r.id) return [];
    const service: Service = {
      id: r.id,
      categoryId: String(r.categoryId ?? ""),
      name: String(r.name ?? "Service"),
      summary: String(r.summary ?? ""),
      commissionPct: Number(r.commissionPct) || 0,
      active: asBool(r.active, true),
    };
    return [service];
  });
  const marketing = (Array.isArray(record.marketing) ? record.marketing : []).flatMap((item) => {
    const r = row(item);
    if (!r || typeof r.id !== "string" || !r.id) return [];
    const status = String(r.status ?? "Live");
    const campaign: Campaign = {
      id: r.id,
      name: String(r.name ?? "Campaign"),
      channel: String(r.channel ?? ""),
      spend: Math.max(0, Math.round(Number(r.spend) || 0)),
      leads: Math.max(0, Math.round(Number(r.leads) || 0)),
      status: status === "Paused" || status === "Ended" || status === "Live" ? status : "Live",
      start: String(r.start ?? ""),
      end: String(r.end ?? ""),
      note: String(r.note ?? ""),
    };
    return [campaign];
  });
  const departments = (Array.isArray(record.departments) ? record.departments : []).flatMap((item) => {
    const r = row(item);
    if (!r || typeof r.id !== "string" || !r.id) return [];
    const dept = String(r.dept ?? "sales");
    const metric: DeptMetric = {
      id: r.id,
      dept: dept === "operations" || dept === "accounts" || dept === "sales" ? dept : "sales",
      label: String(r.label ?? "Metric"),
      value: String(r.value ?? ""),
      note: String(r.note ?? ""),
      updatedAt: String(r.updatedAt ?? new Date().toISOString()),
    };
    return [metric];
  });
  return {
    admins,
    registration,
    leads,
    categories,
    services,
    theme: normalizeTheme(record.theme),
    marketing,
    departments,
  };
}

